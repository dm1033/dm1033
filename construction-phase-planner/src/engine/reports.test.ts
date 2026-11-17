import { describe, expect, it } from 'vitest'
import {
  allDecisionSteps, buildMissedItems, buildScoreReport, decisionsCsv, environmentalChecklistCsv, finalOverall,
  findSteps, inspectionTrackerCsv, permitTrackerCsv, toCsv, twRegisterCsv,
} from './reports'
import { gradeFor, overallScore, zeroScores } from './scoring'
import { SCENARIOS } from '../data'
import type { DecisionStep, GameState, PermitStep, ScoreKey, TwRegisterStep } from '../types'
import { SCORE_KEYS } from '../types'
import { DIFFS, S1, stateFor } from '../test/fixtures'
import { perfectStrategy, play, recklessStrategy } from '../test/playthrough'
import { knownBug } from '../test/knownBug'

/** Minimal RFC 4180 reader (quoted fields, doubled quotes, CRLF records) for round-trip checks. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"' && cell === '') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\r' && text[i + 1] === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++ }
    else if (ch === '\n' || ch === '\r') { row.push(cell); rows.push(row); row = []; cell = '' } // bare CR or LF: what Excel does
    else cell += ch
  }
  row.push(cell)
  rows.push(row)
  return rows
}

const scoresAt = (pct: number): GameState['scores'] => ({
  earned: Object.fromEntries(SCORE_KEYS.map((k) => [k, pct])) as Record<ScoreKey, number>,
  possible: Object.fromEntries(SCORE_KEYS.map((k) => [k, 100])) as Record<ScoreKey, number>,
  meters: { clientConfidence: 70, morale: 70, enforcementRisk: 15, incidentLikelihood: 15, cost: 30 },
})

// ---------------------------------------------------------------------------
// finalOverall
// ---------------------------------------------------------------------------

describe('finalOverall', () => {
  it('is the plain competence score when the project was not shut down', () => {
    for (const pct of [0, 39, 40, 74, 93, 100]) {
      const s = stateFor(S1, 'standard', {}, {}, { scores: scoresAt(pct) })
      expect(finalOverall(s)).toBe(pct)
      expect(finalOverall(s)).toBe(overallScore(s.scores))
    }
  })

  it('an HSE shutdown caps the score at 39, i.e. the "Unsafe planning" band', () => {
    for (const pct of [40, 60, 93, 100]) {
      const s = stateFor(S1, 'expert', { shutdown: true }, {}, { scores: scoresAt(pct) })
      expect(finalOverall(s)).toBe(39)
      expect(gradeFor(finalOverall(s)).label).toBe('Unsafe planning')
    }
  })

  it('the cap never raises a score that was already below it', () => {
    for (const pct of [0, 12, 39]) {
      expect(finalOverall(stateFor(S1, 'expert', { shutdown: true }, {}, { scores: scoresAt(pct) }))).toBe(pct)
    }
  })

  it('tolerates a save from before the game layer existed', () => {
    const legacy = { ...stateFor(S1, 'standard', {}, {}, { scores: scoresAt(80) }), game: undefined } as unknown as GameState
    expect(finalOverall(legacy)).toBe(80)
  })
})

// ---------------------------------------------------------------------------
// Step lookups
// ---------------------------------------------------------------------------

describe('findSteps / allDecisionSteps', () => {
  it('finds steps by type across all phases, in phase order', () => {
    for (const s of SCENARIOS) {
      expect(findSteps<PermitStep>(s, 'permits')).toHaveLength(1)
      expect(findSteps<TwRegisterStep>(s, 'twRegister')).toHaveLength(1)
      expect(findSteps(s, 'sequence')).toHaveLength(2)
      expect(findSteps(s, 'hazardHunt')).toHaveLength(1)
      expect(findSteps(s, 'nonsense')).toEqual([])
    }
  })

  it('allDecisionSteps includes the incident pool and has unique ids across the scenario', () => {
    for (const s of SCENARIOS) {
      const all = allDecisionSteps(s)
      expect(all).toHaveLength(findSteps<DecisionStep>(s, 'decision').length + s.eventPool.length)
      expect(new Set(all.map((d) => d.id)).size).toBe(all.length)
    }
  })
})

// ---------------------------------------------------------------------------
// Missed items and the score report
// ---------------------------------------------------------------------------

describe('buildMissedItems / buildScoreReport', () => {
  for (const scenario of SCENARIOS) {
    it(`${scenario.id}: a model run has nothing in any "missed" list`, () => {
      const { final } = play(scenario, 'standard', 11, perfectStrategy)
      const missed = buildMissedItems(final, scenario)
      for (const [key, list] of Object.entries(missed)) expect(list, key).toEqual([])
    })

    it(`${scenario.id}: a reckless run is itemised: failures, permits, TW, placements, hazards and sequence errors`, () => {
      const { final } = play(scenario, 'learner', 11, recklessStrategy)
      const missed = buildMissedItems(final, scenario)
      expect(missed.criticalFailures).toEqual(final.criticalFailures)
      expect(missed.criticalFailures.length).toBeGreaterThan(0)
      const permits = findSteps<PermitStep>(scenario, 'permits')[0]
      expect(missed.missedPermits).toEqual(permits.required.map((id) => permits.options.find((o) => o.id === id)!.name))
      const genuineTw = findSteps<TwRegisterStep>(scenario, 'twRegister')[0].items.filter((i) => i.correct.register).map((i) => i.name)
      expect(missed.missedTwItems).toEqual(expect.arrayContaining(genuineTw))
      expect(missed.missedHazards).toHaveLength(8)
      expect(missed.missingPlacements.length).toBeGreaterThan(0)
      expect(missed.unsafePlacements).toEqual([])
      expect(missed.sequenceErrors.some((e) => e.startsWith('CRITICAL: '))).toBe(true)
      expect(missed.programmeConsequences.length).toBeGreaterThan(0)
      expect(missed.revisionTopics).toEqual([...new Set(missed.revisionTopics)].sort())
      expect(missed.revisionTopics.length).toBeGreaterThan(5)
    })
  }

  knownBug('BUG eng-tests-11: an item wrongly ADDED to the TW register is not reported under "Missed temporary works items"', () => {
    // Scenario 3: the portable signals power supply is not temporary works (correct.register === false).
    const s3 = SCENARIOS[2]
    const notTw = findSteps<TwRegisterStep>(s3, 'twRegister')[0].items.find((i) => !i.correct.register)!
    expect(notTw.id).toBe('tw3-signals-power')
    const { final } = play(s3, 'standard', 11, perfectStrategy)
    const overRegistered = { ...final, twAnswers: final.twAnswers.map((a) => (a.itemId === notTw.id ? { ...a, register: true } : a)) }
    expect(buildMissedItems(overRegistered, s3).missedTwItems).toEqual([])
  })

  it('builds the headline report: seven categories, overall, grade and a fallback delegate name', () => {
    const { final } = play(S1, 'standard', 3, perfectStrategy, '')
    const report = buildScoreReport(final, S1)
    expect(report.delegateName).toBe('Delegate')
    expect(report.scenarioTitle).toBe(S1.title)
    expect(report.categories.map((c) => c.key)).toEqual(SCORE_KEYS)
    expect(report.overall).toBe(finalOverall(final))
    expect(report.gradeLabel).toBe(gradeFor(report.overall).label)
    expect(report.startedAt).toBe(final.startedAt)
    expect(report.finishedAt).toBe(final.finishedAt)
    expect(buildScoreReport({ ...final, delegateName: 'Group 3' }, S1).delegateName).toBe('Group 3')
  })

  it('a shut-down project is reported in the capped band with the shutdown called out', () => {
    const { final } = play(S1, 'expert', 12345, recklessStrategy)
    expect(final.game.shutdown).toBe(true)
    const report = buildScoreReport(final, S1)
    expect(report.overall).toBeLessThanOrEqual(39)
    expect(report.gradeLabel).toBe('Unsafe planning')
    expect(report.missed.programmeConsequences).toContain('Project shut down by an HSE prohibition notice.')
  })
})

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

describe('toCsv', () => {
  it('joins cells with commas and records with CRLF, with no trailing newline', () => {
    expect(toCsv(['A', 'B'], [['1', '2'], ['3', '4']])).toBe('A,B\r\n1,2\r\n3,4')
    expect(toCsv(['A'], [])).toBe('A')
  })

  it('renders numbers, booleans, null and undefined', () => {
    expect(toCsv(['n', 'b', 'x', 'y', 'z'], [[1.5, false, null, undefined, 0]])).toBe('n,b,x,y,z\r\n1.5,false,,,0')
  })

  it('quotes cells containing a comma, a double quote or a line feed, doubling embedded quotes', () => {
    expect(toCsv(['h'], [['a,b']])).toBe('h\r\n"a,b"')
    expect(toCsv(['h'], [['say "stop"']])).toBe('h\r\n"say ""stop"""')
    expect(toCsv(['h'], [['line1\nline2']])).toBe('h\r\n"line1\nline2"')
    expect(toCsv(['a,b'], [])).toBe('"a,b"')
  })

  it('leaves ordinary text, £ signs and em dashes unquoted and unchanged', () => {
    expect(toCsv(['h'], [['£1.4m — Small Commercial Extension']])).toBe('h\r\n£1.4m — Small Commercial Extension')
  })

  it('round-trips awkward real-world text through a standard CSV reader', () => {
    const nasty = [
      'plain', '', 'comma, inside', '"quoted"', 'ends with quote"', '"', '""', 'two\nlines', 'crlf\r\ninside',
      'CRITICAL: "Dig" must precede "Lift", always', ' leading and trailing ', '£12,000', 'emoji 🚧', ',', '\n',
    ]
    const rows = nasty.map((s, i) => [String(i), s, s])
    const parsed = parseCsv(toCsv(['i', 'a', 'b'], rows))
    expect(parsed).toEqual([['i', 'a', 'b'], ...rows])
  })

  knownBug('BUG eng-tests-6: a cell containing a bare carriage return is quoted (Excel treats CR as a new row)', () => {
    const rows = [['1', 'first\rsecond', 'x']]
    expect(parseCsv(toCsv(['i', 'a', 'b'], rows))).toEqual([['i', 'a', 'b'], ...rows])
  })

  knownBug('BUG eng-tests-6: cells that start with = + - or @ are neutralised so a spreadsheet does not run them', () => {
    for (const payload of ['=HYPERLINK("http://example.invalid","click")', '+1+1', '-2+3', '@SUM(A1:A2)']) {
      const [, [cell]] = parseCsv(toCsv(['h'], [[payload]]))
      expect(cell).not.toMatch(/^[=+\-@]/)
    }
  })
})

describe('CSV exports', () => {
  const final: Record<string, GameState> = {}
  const get = (id: string, kind: 'perfect' | 'reckless'): GameState => {
    const key = `${id}:${kind}`
    const scenario = SCENARIOS.find((s) => s.id === id)!
    final[key] ??= play(scenario, 'learner', 5, kind === 'perfect' ? perfectStrategy : recklessStrategy).final
    return final[key]
  }

  for (const scenario of SCENARIOS) {
    it(`${scenario.id}: every export is rectangular and survives a CSV reader`, () => {
      for (const kind of ['perfect', 'reckless'] as const) {
        const state = get(scenario.id, kind)
        const exports = [
          permitTrackerCsv(state, scenario), twRegisterCsv(state, scenario), inspectionTrackerCsv(state, scenario),
          decisionsCsv(state), environmentalChecklistCsv(state, scenario),
        ]
        for (const csv of exports) {
          const rows = parseCsv(csv)
          expect(rows.length).toBeGreaterThan(0)
          for (const r of rows) expect(r).toHaveLength(rows[0].length)
          expect(csv).not.toMatch(/undefined|NaN|\[object Object\]/)
        }
      }
    })

    it(`${scenario.id}: permit tracker lists every permit with the right status`, () => {
      const step = findSteps<PermitStep>(scenario, 'permits')[0]
      const perfect = parseCsv(permitTrackerCsv(get(scenario.id, 'perfect'), scenario))
      expect(perfect[0]).toEqual(['Permit', 'Required', 'Raised by delegate', 'Status'])
      expect(perfect).toHaveLength(step.options.length + 1)
      expect(perfect.slice(1).filter((r) => r[3] === 'In place')).toHaveLength(step.required.length)
      expect(perfect.slice(1).filter((r) => r[3] === 'MISSED')).toEqual([])
      const reckless = parseCsv(permitTrackerCsv(get(scenario.id, 'reckless'), scenario))
      expect(reckless.slice(1).filter((r) => r[3] === 'MISSED')).toHaveLength(step.required.length)
      const padded = { ...get(scenario.id, 'perfect'), permitAnswers: [{ stepId: step.id, selected: step.options.map((o) => o.id) }] }
      expect(parseCsv(permitTrackerCsv(padded, scenario)).filter((r) => r[3] === 'Raised (not essential)')).toHaveLength(step.options.length - step.required.length)
    })

    it(`${scenario.id}: TW register export marks a model answer "Correct" and an empty one for review`, () => {
      const items = findSteps<TwRegisterStep>(scenario, 'twRegister')[0].items
      const perfect = parseCsv(twRegisterCsv(get(scenario.id, 'perfect'), scenario))
      expect(perfect).toHaveLength(items.length + 1)
      expect(perfect.slice(1).every((r) => r.at(-1) === 'Correct')).toBe(true)
      const reckless = parseCsv(twRegisterCsv(get(scenario.id, 'reckless'), scenario))
      expect(reckless.slice(1).every((r) => r.at(-1)!.startsWith('Review: register; design;'))).toBe(true)
      expect(reckless.slice(1).every((r) => r[1] === '—')).toBe(true)
    })

    it(`${scenario.id}: inspection tracker flags a required inspection the delegate did not plan`, () => {
      const items = findSteps<TwRegisterStep>(scenario, 'twRegister')[0].items
      const need = items.filter((i) => i.correct.inspection).length
      const reckless = parseCsv(inspectionTrackerCsv(get(scenario.id, 'reckless'), scenario))
      expect(reckless.slice(1, items.length + 1).filter((r) => r[3] === 'MISSED')).toHaveLength(need)
      const perfect = parseCsv(inspectionTrackerCsv(get(scenario.id, 'perfect'), scenario))
      expect(perfect.slice(1).filter((r) => r[3] === 'MISSED' || r[3] === 'REVIEW')).toEqual([])
    })

    it(`${scenario.id}: decision log has one row per decision with phase, type, outcome, wager and points`, () => {
      const state = get(scenario.id, 'perfect')
      const rows = parseCsv(decisionsCsv(state))
      expect(rows[0]).toEqual(['Phase', 'Type', 'Prompt', 'Topic', 'Outcome quality', 'Confidence', 'Lifeline used', 'Points'])
      expect(rows).toHaveLength(state.decisions.length + 1)
      state.decisions.forEach((d, i) => {
        expect(rows[i + 1]).toEqual([String(d.phaseNumber), d.wasEvent ? 'Event' : 'Decision', d.prompt, d.topic, 'best', 'sure', 'No', String(d.points)])
      })
    })
  }

  it('decision log records a timeout as "timed out" rather than as a chosen answer', () => {
    const state = stateFor(S1, 'expert', {}, {}, {
      decisions: [{ stepId: 'p5-d1', phaseNumber: 5, prompt: 'Q', topic: 'T', chosenOptionId: 'timeout', quality: 'poor', wasEvent: false, confidence: 'guess', timedOut: true, usedLifeline: true, points: -96 }],
    })
    expect(parseCsv(decisionsCsv(state))[1]).toEqual(['5', 'Decision', 'Q', 'T', 'timed out', 'guess', 'Yes', '-96'])
  })

  it('environmental checklist only lists environmental topics, with a status per decision', () => {
    const state = stateFor(S1, 'standard', {}, {}, {
      decisions: [
        { stepId: 'a', phaseNumber: 11, prompt: 'Washout', topic: 'Environment — pollution prevention', chosenOptionId: 'x', quality: 'best', wasEvent: false },
        { stepId: 'b', phaseNumber: 11, prompt: 'Skip', topic: 'Waste duty of care', chosenOptionId: 'x', quality: 'partial', wasEvent: false },
        { stepId: 'c', phaseNumber: 11, prompt: 'Cutting', topic: 'Dust and noise', chosenOptionId: 'x', quality: 'unsafe', wasEvent: false },
        { stepId: 'd', phaseNumber: 2, prompt: 'F10', topic: 'CDM 2015 — notification', chosenOptionId: 'x', quality: 'unsafe', wasEvent: false },
      ],
    })
    expect(parseCsv(environmentalChecklistCsv(state, S1))).toEqual([
      ['Environmental topic', 'Situation', 'Status'],
      ['Environment — pollution prevention', 'Washout', 'Controlled'],
      ['Waste duty of care', 'Skip', 'Partially controlled'],
      ['Dust and noise', 'Cutting', 'NOT controlled'],
    ])
  })

  it('exports for a game that has not started are header-only, not an exception', () => {
    const blank = stateFor(S1, 'standard')
    for (const d of DIFFS) expect(decisionsCsv({ ...blank, game: { ...blank.game, difficulty: d } })).toBe('Phase,Type,Prompt,Topic,Outcome quality,Confidence,Lifeline used,Points')
    expect(parseCsv(permitTrackerCsv(blank, S1)).slice(1).every((r) => r[2] === 'No')).toBe(true)
  })
})

// zeroScores is imported so a refactor that drops it from the public surface is noticed here.
it('zeroScores covers exactly the seven categories', () => {
  expect(Object.keys(zeroScores())).toEqual(SCORE_KEYS)
})
