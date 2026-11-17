import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameReducer, initialGameMeta, initialGameState, isEventPhase, type GameAction } from './GameContext'
import { DIFFICULTIES, WEEK_PHASES, economyFor } from '../engine/game'
import { categoryScore, gradeFor, overallScore } from '../engine/scoring'
import { finalOverall } from '../engine/reports'
import { SCENARIOS } from '../data'
import { CPP_SECTIONS, METER_KEYS, SCORE_KEYS } from '../types'
import type { DecisionStep, Difficulty, GameState, Scenario } from '../types'
import {
  DIFFS, S1, allDecisions, decisionStep, hazard, huntFixture, huntSteps, permitFixture, permitSteps,
  sequenceFixture, sequenceSteps, setupFixture, setupSteps, stateFor, twItemFixture, twSteps,
} from '../test/fixtures'
import {
  bestOption, deepFreeze, layoutFor, perfectHunt, perfectSequence, perfectStrategy, perfectTw, play, randomStrategy,
  recklessStrategy, stepsFor, worstOption, type PlayResult, type Strategy,
} from '../test/playthrough'
import { knownBug } from '../test/knownBug'

const start = (scenario: Scenario = S1, difficulty: Difficulty = 'standard', seed = 99): GameState =>
  gameReducer(initialGameState, { type: 'START_SCENARIO', scenarioId: scenario.id, delegateName: 'Group A', difficulty, seed })

const run = (state: GameState, ...actions: GameAction[]): GameState =>
  actions.reduce((s, a) => gameReducer(deepFreeze(s), deepFreeze(a)), state)

const firstDecision = (scenario: Scenario): DecisionStep => allDecisions(scenario)[0]

/** Every number anywhere in the state (to prove nothing went NaN / Infinity). */
function numbersIn(value: unknown, path = 'state', out: [string, number][] = []): [string, number][] {
  if (typeof value === 'number') out.push([path, value])
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) numbersIn(v, `${path}.${k}`, out)
  }
  return out
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-02T09:00:00.000Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// START_SCENARIO
// ---------------------------------------------------------------------------

describe('START_SCENARIO', () => {
  it('ignores an unknown scenario id', () => {
    const s = gameReducer(initialGameState, { type: 'START_SCENARIO', scenarioId: 'nope', delegateName: 'x', difficulty: 'standard', seed: 1 })
    expect(s).toBe(initialGameState)
  })

  for (const scenario of SCENARIOS) {
    for (const difficulty of DIFFS) {
      it(`${scenario.id} / ${difficulty}: sets up the economy, lifelines and incident draw`, () => {
        const s = start(scenario, difficulty, 77)
        const def = DIFFICULTIES[difficulty]
        const eco = economyFor(scenario, difficulty)
        expect(s).toMatchObject({ scenarioId: scenario.id, delegateName: 'Group A', phaseIndex: 0, stepIndex: 0, completed: false, startedAt: '2026-03-02T09:00:00.000Z', finishedAt: null })
        expect(s.game).toMatchObject({
          difficulty, seed: 77, points: 0, budgetStart: eco.budgetStart, budget: eco.budgetStart, floatStart: eco.floatStart,
          floatDays: eco.floatStart, weeksTotal: eco.weeksTotal, lifelines: def.lifelines, shutdown: false, recorded: false,
        })
        const pool = scenario.eventPool.map((e) => e.id)
        expect(s.drawnEventIds).toHaveLength(def.eventDraw)
        expect(s.game.surpriseEvents).toHaveLength(def.surpriseEvents)
        const all = [...s.drawnEventIds, ...s.game.surpriseEvents.map((e) => e.eventId)]
        expect(new Set(all).size).toBe(all.length) // no incident is used twice in one run
        for (const id of all) expect(pool).toContain(id)
        const phases = s.game.surpriseEvents.map((e) => e.phaseNumber)
        expect(new Set(phases).size).toBe(phases.length)
        for (const p of phases) {
          expect(p).toBeGreaterThanOrEqual(6)
          expect(p).toBeLessThanOrEqual(11)
        }
      })
    }
  }

  it('the incident draw is fixed by the seed (stable across a reload) and varies between seeds', () => {
    expect(start(S1, 'expert', 5)).toEqual(start(S1, 'expert', 5))
    const draws = new Set(Array.from({ length: 30 }, (_, i) => start(S1, 'expert', i + 1).drawnEventIds.join(',')))
    expect(draws.size).toBeGreaterThan(10)
  })

  it('every incident in the pool gets drawn sooner or later', () => {
    for (const scenario of SCENARIOS) {
      const seen = new Set<string>()
      for (let seed = 1; seed <= 200; seed++) for (const id of start(scenario, 'standard', seed).drawnEventIds) seen.add(id)
      expect([...seen].sort()).toEqual(scenario.eventPool.map((e) => e.id).sort())
    }
  })

  it('starting again throws away everything from the previous run', () => {
    const dirty = play(S1, 'standard', 3, recklessStrategy).final
    const again = gameReducer(dirty, { type: 'START_SCENARIO', scenarioId: S2Id, delegateName: 'Next group', difficulty: 'learner', seed: 8 })
    expect(again.decisions).toEqual([])
    expect(again.criticalFailures).toEqual([])
    expect(again.game.latent).toEqual([])
    expect(again.game.points).toBe(0)
    expect(again.scores.meters).toEqual(initialGameState.scores.meters)
    expect(again.scores).not.toBe(initialGameState.scores)
    expect(again.completed).toBe(false)
  })
})
const S2Id = SCENARIOS[1].id

// ---------------------------------------------------------------------------
// ANSWER_DECISION / USE_LIFELINE
// ---------------------------------------------------------------------------

describe('ANSWER_DECISION', () => {
  const answer = (step: DecisionStep, quality: 'best' | 'partial' | 'poor' | 'unsafe', over: Partial<Extract<GameAction, { type: 'ANSWER_DECISION' }>> = {}): GameAction => ({
    type: 'ANSWER_DECISION', step, option: step.options.find((o) => o.quality === quality)!, phaseNumber: 5, confidence: 'think', timeFrac: null, timedOut: false, ...over,
  })
  const fx = decisionStep({
    cppSection: 'siteRules',
    cppText: { best: 'Model site rules.', poor: 'Weak site rules.' },
    riskEntry: { hazard: 'Unauthorised access', control: 'Hoarding and gate control' },
  })

  it('records the decision, scores it and awards points with the difficulty multiplier', () => {
    const s = run(start(), answer(fx, 'best', { confidence: 'sure' }))
    expect(s.decisions).toEqual([{
      stepId: 'fx-d1', phaseNumber: 5, prompt: fx.prompt, topic: fx.topic, chosenOptionId: 'opt-best', quality: 'best',
      wasEvent: false, confidence: 'sure', timedOut: false, usedLifeline: false, points: 188,
    }])
    expect(s.game.points).toBe(188)
    expect(s.game.lastAward).toEqual({ seq: 1, amount: 188, label: 'Good call' })
    expect(s.scores.earned.safety).toBe(10)
    expect(s.game.confidence).toEqual([{ stepId: 'fx-d1', confidence: 'sure', quality: 'best' }])
    expect(s.game.streak).toBe(1)
  })

  it('a second answer to the same step is ignored (no double scoring after a reload)', () => {
    const once = run(start(), answer(fx, 'unsafe'))
    expect(run(once, answer(fx, 'best'))).toBe(once)
  })

  it('builds and breaks the streak, and remembers the best one', () => {
    let s = start()
    for (let i = 0; i < 4; i++) s = run(s, answer(decisionStep({ id: `d${i}` }), 'best'))
    expect(s.game.streak).toBe(4)
    expect(s.game.lastAward?.label).toBe('Streak ×4')
    expect(s.decisions.map((d) => d.points)).toEqual([125, 138, 150, 163])
    s = run(s, answer(decisionStep({ id: 'd-partial' }), 'partial'))
    expect(s.game).toMatchObject({ streak: 0, bestStreak: 4 })
    s = run(s, answer(decisionStep({ id: 'd-after' }), 'best'))
    expect(s.game).toMatchObject({ streak: 1, bestStreak: 4 })
  })

  it('an unsafe answer is a critical failure, a strike and a major latent hazard; the same failure is not counted twice', () => {
    let s = run(start(), answer(fx, 'unsafe'))
    expect(s.criticalFailures).toEqual(['Fixture critical failure'])
    expect(s.game.strikes).toBe(1)
    expect(s.game.latent).toEqual([expect.objectContaining({ id: 'fx-d1:opt-unsafe', severity: 'major', status: 'open', phaseNumber: 5, revealed: false })])
    s = run(s, answer(decisionStep({ id: 'fx-d2' }), 'unsafe'))
    expect(s.criticalFailures).toEqual(['Fixture critical failure'])
    expect(s.game.strikes).toBe(1)
    expect(s.game.latent).toHaveLength(2)
  })

  it('a poor answer leaves a minor hazard; best and partial leave none', () => {
    expect(run(start(), answer(fx, 'poor')).game.latent).toEqual([expect.objectContaining({ severity: 'minor' })])
    expect(run(start(), answer(fx, 'best')).game.latent).toEqual([])
    expect(run(start(), answer(fx, 'partial')).game.latent).toEqual([])
  })

  it('writes the CPP section (falling back to the model text) and the risk register row', () => {
    const best = run(start(), answer(fx, 'best'))
    expect(best.cpp.siteRules).toEqual(['Model site rules.'])
    expect(best.riskRegister).toEqual([{ hazard: 'Unauthorised access', control: 'Hoarding and gate control', adequate: true }])
    const poor = run(start(), answer(fx, 'poor'))
    expect(poor.cpp.siteRules).toEqual(['Weak site rules.'])
    expect(poor.riskRegister).toEqual([{ hazard: 'Unauthorised access', control: 'Chosen response: poor option', adequate: false }])
    expect(run(start(), answer(fx, 'partial')).riskRegister[0].adequate).toBe(true)
    expect(run(start(), answer(fx, 'unsafe')).cpp.siteRules).toEqual(['Model site rules.'])
  })

  it('logs incident events and marks them in the decision record', () => {
    const event = decisionStep({ id: 'ev-fx', isEvent: true })
    const s = run(start(), answer(event, 'partial'))
    expect(s.incidentLog).toEqual([{ stepId: 'ev-fx', prompt: event.prompt, outcomeQuality: 'partial', response: 'partial option' }])
    expect(s.decisions[0].wasEvent).toBe(true)
    expect(run(start(), answer(fx, 'partial')).incidentLog).toEqual([])
  })

  it('spends contingency and programme according to the option', () => {
    const costly = decisionStep({ options: [{ ...fx.options[2], impact: { cost: 4, programme: -3 } }] })
    const s0 = start()
    const s = run(s0, answer(costly, 'poor'))
    expect(s.game.budget).toBe(s0.game.budget - 4000)
    expect(s.game.floatDays).toBe(s0.game.floatDays - 1.5)
  })

  it('a timeout scores −60 × difficulty, counts as a timeout, breaks the streak and is left out of calibration', () => {
    const timeout = { id: 'timeout', text: 'No decision made in time', quality: 'poor' as const, impact: { incidentLikelihood: 5, enforcementRisk: 3 }, feedback: 'f', consequence: 'c' }
    const before = run(start(S1, 'expert'), answer(decisionStep({ id: 'warm-up' }), 'best'))
    const s = run(before, { type: 'ANSWER_DECISION', step: fx, option: timeout, phaseNumber: 5, confidence: 'guess', timeFrac: 0, timedOut: true })
    expect(s.decisions.at(-1)).toMatchObject({ chosenOptionId: 'timeout', timedOut: true, points: -96, quality: 'poor' })
    expect(s.game.timeouts).toBe(1)
    expect(s.game.streak).toBe(0)
    expect(s.game.lastAward?.label).toBe('Out of time')
    expect(s.game.confidence).toHaveLength(1)
    expect(s.game.latent.at(-1)).toMatchObject({ id: 'fx-d1:timeout', severity: 'minor' })
    expect(s.scores.meters.incidentLikelihood).toBe(before.scores.meters.incidentLikelihood + 5)
    expect(s.game.budget).toBe(before.game.budget)
  })

  knownBug('BUG eng-tests-7: running out of time never ADDS programme float', () => {
    const timeout = { id: 'timeout', text: 'No decision made in time', quality: 'poor' as const, impact: {}, feedback: 'f' }
    const s0 = start(S1, 'expert')
    const s = run(s0, { type: 'ANSWER_DECISION', step: fx, option: timeout, phaseNumber: 5, confidence: 'guess', timeFrac: 0, timedOut: true })
    expect(s.game.floatDays).toBeLessThanOrEqual(s0.game.floatDays)
  })
})

describe('USE_LIFELINE', () => {
  it('spends one lifeline per step and halves the points of a best answer on that step', () => {
    const fx = decisionStep()
    let s = run(start(S1, 'standard'), { type: 'USE_LIFELINE', stepId: fx.id })
    expect(s.game.lifelines).toBe(1)
    expect(s.game.lifelineSteps).toEqual([fx.id])
    expect(run(s, { type: 'USE_LIFELINE', stepId: fx.id })).toBe(s)
    s = run(s, { type: 'ANSWER_DECISION', step: fx, option: fx.options[0], phaseNumber: 5, confidence: 'think', timeFrac: null, timedOut: false })
    expect(s.decisions[0]).toMatchObject({ usedLifeline: true, points: 63 })
  })

  it('cannot go below zero', () => {
    let s = start(S1, 'expert')
    s = run(s, { type: 'USE_LIFELINE', stepId: 'a' })
    expect(s.game.lifelines).toBe(0)
    expect(run(s, { type: 'USE_LIFELINE', stepId: 'b' })).toBe(s)
  })

  // A two-option tutor question: lifelineRemovals() rightly removes nothing (it always leaves one
  // distractor), yet the lifeline is spent and the correct answer is then worth half. The reducer only
  // receives a step id, so the guard needs the step (or the removal count) on the action first.
  it.todo('eng-tests-9: USE_LIFELINE is refused, and not charged, when lifelineRemovals(step) would remove nothing')
})

// ---------------------------------------------------------------------------
// Mini-game submissions
// ---------------------------------------------------------------------------

describe('mini-game submissions', () => {
  it('SUBMIT_SITE_SETUP: +25 good, +10 neutral, −40 unsafe, −20 missing per required item (× difficulty)', () => {
    const s0 = start(S1, 'learner')
    const good = run(s0, { type: 'SUBMIT_SITE_SETUP', step: setupFixture, placements: [{ itemId: 'welfare', x: 0, y: 1 }, { itemId: 'fuel-store', x: 4, y: 1 }] })
    expect(good.game.points).toBe(50)
    expect(good.game.lastAward?.label).toBe('Site layout')
    expect(good.placements).toHaveLength(2)
    const mixed = run(s0, { type: 'SUBMIT_SITE_SETUP', step: setupFixture, placements: [{ itemId: 'welfare', x: 4, y: 1 }, { itemId: 'fuel-store', x: 0, y: 1 }] })
    expect(mixed.game.points).toBe(-30)
    expect(run(s0, { type: 'SUBMIT_SITE_SETUP', step: setupFixture, placements: [] }).game.points).toBe(-40)
    expect(run(start(S1, 'expert'), { type: 'SUBMIT_SITE_SETUP', step: setupFixture, placements: [] }).game.points).toBe(-64)
  })

  it('SUBMIT_TW: 8 points per correct field plus 30 for a fully correct item', () => {
    const step = { type: 'twRegister' as const, id: 'fx-tw', prompt: '', topic: 't', learningNote: '', items: [twItemFixture] }
    const s0 = start(S1, 'learner')
    const perfect = run(s0, { type: 'SUBMIT_TW', step, answers: perfectTw(step) })
    expect(perfect.game.points).toBe(7 * 8 + 30)
    expect(perfect.twAnswers).toHaveLength(1)
    const oneWrong = run(s0, { type: 'SUBMIT_TW', step, answers: [{ ...perfectTw(step)[0], rams: false }] })
    expect(oneWrong.game.points).toBe(6 * 8)
    expect(run(s0, { type: 'SUBMIT_TW', step, answers: [] }).game.points).toBe(0)
  })

  it('SUBMIT_PERMITS: +40 per required permit raised, −60 per one missed, −15 per unnecessary permit', () => {
    const s0 = start(S1, 'learner')
    const sub = (selected: string[]) => run(s0, { type: 'SUBMIT_PERMITS', step: permitFixture, selected })
    expect(sub(['dig', 'hot', 'lift']).game.points).toBe(120)
    expect(sub(['dig', 'hot', 'lift', 'paint']).game.points).toBe(105)
    expect(sub(['dig']).game.points).toBe(40 - 120)
    expect(sub([]).game.points).toBe(-180)
    expect(sub(['dig']).permitAnswers).toEqual([{ stepId: 'fx-permits', selected: ['dig'] }])
  })

  it('SUBMIT_HUNT: 80 per high-severity hazard, 60 otherwise, −30 false alarm, −20 missed, time bonus for finding them all', () => {
    const s0 = start(S1, 'learner')
    const sub = (flagged: string[], secondsLeft = 0) => run(s0, { type: 'SUBMIT_HUNT', step: huntFixture, flagged, secondsLeft })
    expect(sub(['h1', 'h2', 'h3']).game.points).toBe(200)
    expect(sub(['h1', 'h2', 'h3'], 30).game.points).toBe(260)
    expect(sub(['h1'], 30).game.points).toBe(80 - 40)
    expect(sub(['h1', 'ok1']).game.points).toBe(80 - 30 - 40)
    expect(sub([]).game.points).toBe(-60)
    const s = sub(['h1'])
    expect(s.riskRegister.map((r) => r.adequate)).toEqual([true, false, false])
    expect(s.riskRegister[1].control).toMatch(/^NOT IDENTIFIED on the walk-round\./)
    expect(s.cpp.riskAssessmentSummary).toEqual(['Site walk-round: 1 of 3 hazards identified and actioned; 2 not identified and still present on site.'])
    expect(s.huntAnswers).toEqual([{ stepId: 'fx-hunt', flagged: ['h1'], secondsLeft: 0 }])
    expect(run(s, { type: 'SUBMIT_HUNT', step: huntFixture, flagged: ['h1', 'h2', 'h3'], secondsLeft: 50 })).toBe(s)
  })

  knownBug('BUG eng-tests-8: a walk-round with false alarms earns no time bonus ("a time bonus for a clean sweep")', () => {
    // Flagging every tile in the first seconds needs no hazard knowledge at all; it must not be paid for speed.
    const s0 = start(S1, 'learner')
    const everything = huntFixture.observations.map((o) => o.id)
    const fast = run(s0, { type: 'SUBMIT_HUNT', step: huntFixture, flagged: everything, secondsLeft: 85 })
    const slow = run(s0, { type: 'SUBMIT_HUNT', step: huntFixture, flagged: everything, secondsLeft: 0 })
    expect(fast.game.points).toBe(slow.game.points)
  })

  it('SUBMIT_SEQUENCE: +25 per dependency kept, +150 for a perfect plan', () => {
    const s = run(start(S1, 'learner'), { type: 'SUBMIT_SEQUENCE', step: sequenceFixture, order: ['a', 'b', 'c', 'd'], phaseNumber: 2 })
    expect(s.game.points).toBe(3 * 25 + 150)
    expect(s.game.lastAward?.label).toBe('Perfect sequence')
    expect(s.criticalFailures).toEqual([])
    expect(s.game.latent).toEqual([])
    expect(s.cpp.projectDescription).toEqual(['Planned sequence (Sequencing): Survey → Design → Permit → Dig.'])
    expect(s.sequenceAnswers).toEqual([{ stepId: 'fx-seq', order: ['a', 'b', 'c', 'd'] }])
  })

  it('SUBMIT_SEQUENCE: each broken critical hold point is a critical failure and a major hazard, but the plan is one strike', () => {
    const s = run(start(S1, 'learner'), { type: 'SUBMIT_SEQUENCE', step: sequenceFixture, order: ['d', 'c', 'b', 'a'], phaseNumber: 10 })
    expect(s.game.points).toBe(-200)
    expect(s.criticalFailures).toEqual([
      'Out-of-sequence work: "Dig" planned before "Design"',
      'Out-of-sequence work: "Dig" planned before "Permit"',
    ])
    expect(s.game.strikes).toBe(1)
    expect(s.game.latent.map((h) => [h.id, h.severity, h.phaseNumber, h.status])).toEqual([
      ['fx-seq:seq:0', 'major', 10, 'open'], ['fx-seq:seq:1', 'major', 10, 'open'],
    ])
    expect(s.cpp.highRiskActivities?.[0]).toContain('3 sequencing conflict(s) unresolved.')
    expect(s.scores.meters.incidentLikelihood).toBe(25)
    expect(run(s, { type: 'SUBMIT_SEQUENCE', step: sequenceFixture, order: ['a', 'b', 'c', 'd'], phaseNumber: 10 })).toBe(s)
  })

  knownBug('BUG eng-tests-2: submitting the site plan, TW register or permit form twice does not score it twice', () => {
    const s0 = start(S1, 'learner')
    const twStep = { type: 'twRegister' as const, id: 'fx-tw', prompt: '', topic: 't', learningNote: '', items: [twItemFixture] }
    const actions: GameAction[] = [
      { type: 'SUBMIT_SITE_SETUP', step: setupFixture, placements: [{ itemId: 'welfare', x: 0, y: 1 }, { itemId: 'fuel-store', x: 4, y: 1 }] },
      { type: 'SUBMIT_TW', step: twStep, answers: perfectTw(twStep) },
      { type: 'SUBMIT_PERMITS', step: permitFixture, selected: ['dig', 'hot', 'lift'] },
    ]
    const doubled: string[] = []
    for (const a of actions) {
      const once = run(s0, a)
      const twice = run(once, a)
      if (twice.game.points !== once.game.points || twice.scores.possible.planning + twice.scores.possible.legal + twice.scores.possible.temporaryWorks
        !== once.scores.possible.planning + once.scores.possible.legal + once.scores.possible.temporaryWorks) doubled.push(a.type)
    }
    expect(doubled).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// ADVANCE / CLOSE_WEEK / RECTIFY / AUDIT / misc
// ---------------------------------------------------------------------------

describe('ADVANCE and the site week', () => {
  it('moves step by step, then phase by phase, counting extra (event) steps', () => {
    let s = start()
    expect(S1.phases[0].steps.length).toBe(2)
    s = run(s, { type: 'ADVANCE', scenario: S1, extraSteps: 0 })
    expect([s.phaseIndex, s.stepIndex]).toEqual([0, 1])
    s = run(s, { type: 'ADVANCE', scenario: S1, extraSteps: 1 })
    expect([s.phaseIndex, s.stepIndex]).toEqual([0, 2])
    s = run(s, { type: 'ADVANCE', scenario: S1, extraSteps: 1 })
    expect([s.phaseIndex, s.stepIndex]).toEqual([1, 0])
    expect(s.game.pendingWeek).toBeNull() // phase 1 is pre-construction: no site week
  })

  it('a site week is reported after each of phases 4–13 and blocks progress until it is closed', () => {
    for (const scenario of SCENARIOS) {
      const weekPhases: number[] = []
      const { history } = play(scenario, 'standard', 6, perfectStrategy)
      for (const { state } of history) {
        if (state.game.pendingWeek && !weekPhases.includes(state.game.pendingWeek.afterPhase)) weekPhases.push(state.game.pendingWeek.afterPhase)
      }
      expect(weekPhases).toEqual(WEEK_PHASES)
    }
    const s = { ...stateFor(S1, 'standard'), phaseIndex: 3, stepIndex: S1.phases[3].steps.length - 1 }
    const pending = run(s, { type: 'ADVANCE', scenario: S1, extraSteps: 0 })
    expect(pending.phaseIndex).toBe(4)
    expect(pending.game.pendingWeek).toMatchObject({ afterPhase: 4, safe: true })
    expect(run(pending, { type: 'ADVANCE', scenario: S1, extraSteps: 0 })).toBe(pending)
    const closed = run(pending, { type: 'CLOSE_WEEK' })
    expect(closed.game.pendingWeek).toBeNull()
    expect(closed.completed).toBe(false)
    expect(run(closed, { type: 'CLOSE_WEEK' })).toBe(closed)
  })

  it('closing a week in which HSE shut the project down ends the game on the spot', () => {
    const s = { ...stateFor(S1, 'expert', {}, { enforcementRisk: 95 }), phaseIndex: 3, stepIndex: S1.phases[3].steps.length - 1 }
    const pending = run(s, { type: 'ADVANCE', scenario: S1, extraSteps: 0 })
    expect(pending.game.pendingWeek).toMatchObject({ shutdown: true })
    expect(pending.completed).toBe(false)
    const over = run(pending, { type: 'CLOSE_WEEK' })
    expect(over.completed).toBe(true)
    expect(over.finishedAt).toBe('2026-03-02T09:00:00.000Z')
    expect(over.game.bonuses).toEqual([{ label: 'Project shut down by HSE prohibition', points: -2400 }])
    expect(over.game.pendingWeek).toBeNull()
    expect(finalOverall(over)).toBeLessThanOrEqual(39)
  })

  it('RECTIFY closes an open risk for the documented price, lowers the meters and awards +20 × difficulty', () => {
    const s0 = stateFor(S1, 'standard', { latent: [hazard({ id: 'maj' }), hazard({ id: 'min', severity: 'minor' })] }, { incidentLikelihood: 30, enforcementRisk: 30 })
    const s1 = run(s0, { type: 'RECTIFY', hazardId: 'maj' })
    expect(s1.game.budget).toBe(s0.game.budget - 4000)
    expect(s1.game.floatDays).toBe(s0.game.floatDays - 1)
    expect(s1.game.points).toBe(25)
    expect(s1.game.latent[0]).toMatchObject({ status: 'rectified', revealed: true })
    expect(s1.scores.meters).toMatchObject({ incidentLikelihood: 26, enforcementRisk: 27 })
    const s2 = run(s1, { type: 'RECTIFY', hazardId: 'min' })
    expect(s2.game.budget).toBe(s1.game.budget - 1500)
    expect(s2.game.floatDays).toBe(s1.game.floatDays - 0.5)
    expect(s2.scores.meters).toMatchObject({ incidentLikelihood: 24, enforcementRisk: 26 })
    // Already closed, fired or unknown: nothing happens.
    expect(run(s2, { type: 'RECTIFY', hazardId: 'maj' })).toBe(s2)
    expect(run(s2, { type: 'RECTIFY', hazardId: 'nope' })).toBe(s2)
    const fired = stateFor(S1, 'standard', { latent: [hazard({ id: 'f', status: 'fired' })] })
    expect(run(fired, { type: 'RECTIFY', hazardId: 'f' })).toBe(fired)
  })

  it('AUDIT costs £2.5k and half a day and reveals every open risk', () => {
    const s0 = stateFor(S1, 'expert', { latent: [hazard({ id: 'a' }), hazard({ id: 'b', status: 'fired' })] })
    const s1 = run(s0, { type: 'AUDIT' })
    expect(s1.game.budget).toBe(s0.game.budget - 2500)
    expect(s1.game.floatDays).toBe(s0.game.floatDays - 0.5)
    expect(s1.game.auditsUsed).toBe(1)
    expect(s1.game.latent.map((h) => h.revealed)).toEqual([true, false])
    expect(run(initialGameState, { type: 'AUDIT' })).toBe(initialGameState)
  })

  it('MARK_RECORDED, RESET, LOAD and unknown actions', () => {
    const s = play(S1, 'learner', 2, perfectStrategy).final
    expect(run(s, { type: 'MARK_RECORDED' }).game.recorded).toBe(true)
    const reset = run(s, { type: 'RESET' })
    expect(reset).toEqual({ ...initialGameState, game: initialGameMeta() })
    expect(reset.scores).not.toBe(initialGameState.scores)
    expect(run(initialGameState, { type: 'LOAD', state: s })).toBe(s)
    expect(gameReducer(s, { type: 'NOT_AN_ACTION' } as unknown as GameAction)).toBe(s)
  })

  it('FINISH completes once and is then a no-op', () => {
    const done = run(start(), { type: 'FINISH' })
    expect(done.completed).toBe(true)
    expect(done.game.bonuses.length).toBeGreaterThan(0)
    expect(run(done, { type: 'FINISH' })).toBe(done)
  })

  it('isEventPhase: the drawn incidents are played in phase 12 only', () => {
    expect([11, 12, 13, undefined].map(isEventPhase)).toEqual([false, true, false, false])
  })
})

// ---------------------------------------------------------------------------
// Full playthroughs
// ---------------------------------------------------------------------------

/**
 * Invariants that must hold after EVERY action of ANY game. Problems are collected and asserted
 * once, so a failure lists everything that went wrong and thousands of states stay cheap to check.
 */
function checkInvariants(result: PlayResult, scenario: Scenario): void {
  const problems: string[] = []
  const cppIds = new Set<string>(CPP_SECTIONS.map((c) => c.id))
  let prev: GameState | null = null
  for (const { action, state } of result.history) {
    const bad = (msg: string) => problems.push(`${scenario.id} after ${action.type} at phase ${state.phaseIndex + 1} step ${state.stepIndex + 1}: ${msg}`)
    const g = state.game
    for (const [path, n] of numbersIn(state)) if (!Number.isFinite(n)) bad(`${path} = ${n}`)
    for (const k of METER_KEYS) {
      const v = state.scores.meters[k]
      if (v < 0 || v > 100) bad(`meter ${k} = ${v}`)
    }
    for (const k of SCORE_KEYS) {
      if (state.scores.earned[k] > state.scores.possible[k]) bad(`${k}: earned ${state.scores.earned[k]} > possible ${state.scores.possible[k]}`)
      const pct = categoryScore(state.scores, k)
      if (pct !== null && (pct < 0 || pct > 100)) bad(`${k} = ${pct}%`)
    }
    if (!Number.isInteger(g.points)) bad(`points ${g.points} is not a whole number`)
    if (!Number.isInteger(g.floatDays * 2)) bad(`float ${g.floatDays} is not in half days`)
    if (!Number.isInteger(g.budget / 100)) bad(`budget ${g.budget} is not in £100s`)
    if (g.lifelines < 0) bad(`lifelines ${g.lifelines}`)
    if (g.streak > g.bestStreak) bad(`streak ${g.streak} > best ${g.bestStreak}`)
    if (new Set(state.decisions.map((d) => d.stepId)).size !== state.decisions.length) bad('a step was answered twice')
    if (new Set(g.latent.map((h) => h.id)).size !== g.latent.length) bad('duplicate latent hazard id')
    if (new Set(state.criticalFailures).size !== state.criticalFailures.length) bad('duplicate critical failure')
    if (g.consequences.length !== g.latent.filter((h) => h.status === 'fired').length) bad('consequences do not match fired hazards')
    for (const c of g.consequences) if (!g.latent.some((h) => h.id === c.hazardId && h.status === 'fired')) bad(`consequence without a fired hazard: ${c.hazardId}`)
    if (g.pendingWeek && g.pendingWeek.consequences.length > 2) bad(`${g.pendingWeek.consequences.length} consequences in one week`)
    for (const key of Object.keys(state.cpp)) if (!cppIds.has(key)) bad(`unknown CPP section ${key}`)

    if (prev) {
      // Points only ever change through an award, and by exactly the awarded amount.
      const awarded = (g.lastAward?.seq ?? 0) !== (prev.game.lastAward?.seq ?? 0)
      const delta = g.points - prev.game.points
      if (delta !== (awarded ? g.lastAward!.amount : 0)) bad(`points moved by ${delta} without a matching award`)
      if (awarded && g.lastAward!.seq !== (prev.game.lastAward?.seq ?? 0) + 1) bad('award sequence skipped')
      // Progress never goes backwards and nothing already recorded is lost.
      if (state.phaseIndex < prev.phaseIndex) bad('phase went backwards')
      if (state.phaseIndex === prev.phaseIndex && state.stepIndex < prev.stepIndex) bad('step went backwards')
      if (state.decisions.length < prev.decisions.length) bad('a decision was lost')
      if (g.week < prev.game.week) bad('week went backwards')
      if (g.notices.length < prev.game.notices.length) bad('a notice was lost')
      if (prev.completed && !state.completed) bad('un-completed')
    }
    prev = state
  }
  expect(problems).toEqual([])
  // A save written at any point (sampled) can be read back unchanged.
  for (let i = 0; i < result.history.length; i += 7) {
    const { state } = result.history[i]
    expect(JSON.parse(JSON.stringify(state))).toEqual(state)
  }

  const final = result.final
  expect(final.completed).toBe(true)
  expect(final.finishedAt).toBe('2026-03-02T09:00:00.000Z')
  expect(final.game.pendingWeek).toBeNull()
  expect(final.game.bonuses.length).toBeGreaterThan(0)
  expect(final.game.lastAward).toMatchObject({ label: 'Project completion', amount: final.game.bonuses.reduce((a, b) => a + b.points, 0) })
  const def = DIFFICULTIES[final.game.difficulty]
  const prohibitions = final.game.notices.filter((n) => n.kind === 'prohibition').length
  if (final.game.shutdown) {
    expect(def.shutdownAfterProhibitions).not.toBeNull()
    expect(prohibitions).toBe(def.shutdownAfterProhibitions)
    expect(final.game.bonuses).toHaveLength(1)
    expect(finalOverall(final)).toBeLessThanOrEqual(39)
    expect(gradeFor(finalOverall(final)).label).toBe('Unsafe planning')
  } else {
    if (def.shutdownAfterProhibitions !== null) expect(prohibitions).toBeLessThan(def.shutdownAfterProhibitions)
    expect(final.phaseIndex).toBe(scenario.phases.length - 1)
    expect(finalOverall(final)).toBe(overallScore(final.scores))
    const expectedDecisions = scenario.phases.flatMap((p) => p.steps).filter((s) => s.type === 'decision').length + def.eventDraw + def.surpriseEvents
    expect(final.decisions).toHaveLength(expectedDecisions)
    expect(final.incidentLog).toHaveLength(final.decisions.filter((d) => d.wasEvent).length)
    expect(final.huntAnswers).toHaveLength(1)
    expect(final.sequenceAnswers).toHaveLength(2)
    expect(final.permitAnswers).toHaveLength(1)
    expect(final.game.week).toBeLessThanOrEqual(final.game.weeksTotal)
  }
}

describe('full playthrough of every scenario with the real reducer', () => {
  for (const scenario of SCENARIOS) {
    for (const difficulty of DIFFS) {
      const def = DIFFICULTIES[difficulty]

      it(`${scenario.id} / ${difficulty}: the model delegate reaches handover with a clean project`, () => {
        const result = play(scenario, difficulty, 2026, perfectStrategy)
        checkInvariants(result, scenario)
        const s = result.final
        expect(s.completed).toBe(true)
        expect(s.game.shutdown).toBe(false)
        expect(s.criticalFailures).toEqual([])
        expect(s.game.latent).toEqual([])
        expect(s.game.consequences).toEqual([])
        expect(s.game.notices).toEqual([])
        expect(s.game.safeWeeks).toBe(WEEK_PHASES.length)
        expect(s.game.strikes).toBe(0)
        expect(s.game.budget).toBeGreaterThanOrEqual(0)
        expect(s.game.floatDays).toBeGreaterThanOrEqual(0)
        expect(s.decisions.every((d) => d.quality === 'best')).toBe(true)
        expect(s.game.bestStreak).toBe(s.decisions.length)
        expect(s.riskRegister.every((r) => r.adequate)).toBe(true)
        expect(s.game.bonuses.map((b) => b.label.split(' (')[0])).toEqual([
          'Delivered within budget', 'Handed over on programme', 'No RIDDOR-reportable incidents', 'No HSE enforcement notices', 'No critical safety failures',
        ])
        for (const k of ['legal', 'safety', 'temporaryWorks'] as const) expect(categoryScore(s.scores, k)).toBe(100)
        expect(finalOverall(s)).toBeGreaterThanOrEqual(90)
        expect(gradeFor(finalOverall(s)).label).toBe('Excellent')
        // Every CPP section the scenario can populate has the model text in it.
        expect(Object.keys(s.cpp).length).toBeGreaterThanOrEqual(10)
        expect(s.game.points).toBeGreaterThan(9000 * def.pointsMultiplier)
      })

      it(`${scenario.id} / ${difficulty}: the reckless delegate is ${def.shutdownAfterProhibitions === null ? 'never shut down but finishes in the bottom band' : 'shut down by HSE'}`, () => {
        const result = play(scenario, difficulty, 2026, recklessStrategy)
        checkInvariants(result, scenario)
        const s = result.final
        expect(s.completed).toBe(true)
        expect(s.game.points).toBeLessThan(0)
        expect(s.criticalFailures.length).toBeGreaterThan(0)
        expect(gradeFor(finalOverall(s)).label).toBe('Unsafe planning')
        if (def.shutdownAfterProhibitions === null) {
          expect(s.game.shutdown).toBe(false)
          expect(s.phaseIndex).toBe(scenario.phases.length - 1)
          expect(s.game.notices.filter((n) => n.kind === 'prohibition').length).toBeGreaterThan(1)
        } else {
          expect(s.game.shutdown).toBe(true)
          expect(s.phaseIndex).toBeLessThan(scenario.phases.length - 1)
          expect(s.game.bonuses).toEqual([{ label: 'Project shut down by HSE prohibition', points: Math.round(-1500 * def.pointsMultiplier) }])
        }
      })

      it(`${scenario.id} / ${difficulty}: 25 random delegates all finish with every invariant intact`, () => {
        for (let seed = 1; seed <= 25; seed++) {
          const result = play(scenario, difficulty, seed, randomStrategy(seed * 31 + 7))
          checkInvariants(result, scenario)
        }
      })
    }

    it(`${scenario.id}: the same seed and the same answers give exactly the same game`, () => {
      for (const difficulty of DIFFS) {
        const a = play(scenario, difficulty, 4242, randomStrategy(9)).final
        const b = play(scenario, difficulty, 4242, randomStrategy(9)).final
        expect(a).toEqual(b)
        const c = play(scenario, difficulty, 4243, randomStrategy(9)).final
        expect(c).not.toEqual(a)
      }
    })

    it(`${scenario.id}: a game saved to JSON mid-project and reloaded finishes identically`, () => {
      const strategy = (): Strategy => randomStrategy(17)
      const straight = play(scenario, 'standard', 808, strategy())
      // Replay the same actions, but push the state through JSON (the localStorage save) before every one.
      let state: GameState = initialGameState
      for (const { action } of straight.history) {
        state = gameReducer(gameReducer(initialGameState, { type: 'LOAD', state: JSON.parse(JSON.stringify(state)) as GameState }), action)
      }
      expect(state).toEqual(straight.final)
    })

    it(`${scenario.id}: harder difficulties pay more for the same model run`, () => {
      const [l, s, e] = DIFFS.map((d) => play(scenario, d, 5, perfectStrategy).final.game.points)
      expect(s).toBeGreaterThan(l)
      expect(e).toBeGreaterThan(s)
    })
  }

  it('the model answers used above really are the authored model answers', () => {
    for (const scenario of SCENARIOS) {
      for (const d of allDecisions(scenario)) {
        expect(bestOption(d).quality).toBe('best')
        expect(['unsafe', 'poor']).toContain(worstOption(d).quality)
      }
      expect(layoutFor(setupSteps(scenario)[0], 'good')).not.toBeNull()
      expect(twSteps(scenario)).toHaveLength(1)
      expect(permitSteps(scenario)).toHaveLength(1)
      expect(perfectHunt(huntSteps(scenario)[0])).toHaveLength(8)
      expect(perfectSequence(sequenceSteps(scenario)[0])).toHaveLength(8)
      const s0 = start(scenario, 'expert')
      expect(stepsFor(scenario, { ...s0, phaseIndex: 11 }).extra).toBeGreaterThanOrEqual(DIFFICULTIES.expert.eventDraw)
    }
  })

  knownBug('BUG eng-tests-3: a delegate who gives the model answer to everything scores 100% in every category', () => {
    const short: string[] = []
    for (const scenario of SCENARIOS) {
      const s = play(scenario, 'standard', 2026, perfectStrategy).final
      for (const k of SCORE_KEYS) {
        const pct = categoryScore(s.scores, k)
        if (pct !== null && pct !== 100) short.push(`${scenario.id} ${k}: ${pct}%`)
      }
    }
    expect(short).toEqual([])
  })

  knownBug('BUG eng-tests-2: ADVANCE after handover is a no-op (the completion bonus is paid once)', () => {
    const done = play(S1, 'standard', 2026, perfectStrategy).final
    const again = gameReducer(done, { type: 'ADVANCE', scenario: S1, extraSteps: 0 })
    expect(again.game.points).toBe(done.game.points)
  })

  knownBug('BUG eng-tests-2: nothing can be answered while the weekly site report is still open', () => {
    const s = { ...stateFor(S1, 'expert'), phaseIndex: 3, stepIndex: S1.phases[3].steps.length - 1 }
    const pending = gameReducer(s, { type: 'ADVANCE', scenario: S1, extraSteps: 0 })
    expect(pending.game.pendingWeek).not.toBeNull()
    const next = stepsFor(S1, pending).steps[0] as DecisionStep
    const timeout = { id: 'timeout', text: 'No decision made in time', quality: 'poor' as const, impact: {}, feedback: 'f' }
    const after = gameReducer(pending, { type: 'ANSWER_DECISION', step: next, option: timeout, phaseNumber: 5, confidence: 'guess', timeFrac: 0, timedOut: true })
    expect(after.decisions).toEqual(pending.decisions)
  })
})

// Rules that currently live inside React components and therefore cannot be unit tested until
// they are moved into src/engine (finding eng-tests-15). The tests are written as soon as they move.
describe('rules still stranded in components', () => {
  it.todo('eng-tests-10: initialSequenceOrder(step, seed) never hands the delegate an order that already satisfies every constraint (SequenceBuilder.tsx:20-25)')
  it.todo('eng-tests-15: timeoutOption(step) is the single definition of a timed-out answer (DecisionCard.tsx:19-28)')
  it.todo('eng-tests-15: phaseSteps(scenario, state, customQuestions) is shared by GameScreen and scripts/balance-sim.ts (GameScreen.tsx:47-58)')
  it.todo('eng-tests-15: customToDecision(question) does not create latent hazards or incident-log rows for a tutor quiz question (GameScreen.tsx:19-35)')
  it.todo('eng-tests-15: huntTimeLimit(step, difficulty) and the secondsLeft passed to SUBMIT_HUNT (HazardHunt.tsx:21,31-34)')
})
