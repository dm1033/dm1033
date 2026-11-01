import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type {
  Confidence, CustomQuestion, DecisionOption, DecisionStep, Difficulty, GameMeta, GameState,
  HazardHuntStep, PermitStep, PlacementRecord, Scenario, SequenceStep, SiteSetupStep, TutorState,
  TwAnswerRecord, TwRegisterStep,
} from '../types'
import {
  applyDecision, applyHazardHunt, applyPermits, applySequence, applySiteSetup, applyTwRegister,
  assessHunt, assessSequence, initialScoreState, twItemScore,
} from '../engine/scoring'
import {
  DIFFICULTIES, WEEK_PHASES, auditCost, award, completionBonuses, decisionEconomy, decisionPoints,
  economyFor, latentFromOption, rectifyCost, rngFor, shuffleWith, simulateWeek,
} from '../engine/game'
import { getScenario } from '../data'

const SAVE_KEY = 'cpp-smsts-save-v2'
const TUTOR_KEY = 'cpp-smsts-tutor-v1'

export const initialGameMeta = (): GameMeta => ({
  difficulty: 'standard',
  seed: 1,
  points: 0,
  streak: 0,
  bestStreak: 0,
  budgetStart: 0,
  budget: 0,
  floatStart: 0,
  floatDays: 0,
  weeksTotal: 0,
  week: 0,
  safeWeeks: 0,
  strikes: 0,
  lifelines: 0,
  lifelineSteps: [],
  timeouts: 0,
  latent: [],
  consequences: [],
  notices: [],
  confidence: [],
  surpriseEvents: [],
  pendingWeek: null,
  auditsUsed: 0,
  shutdown: false,
  bonuses: [],
  lastAward: null,
  recorded: false,
})

export const initialGameState: GameState = {
  scenarioId: null,
  phaseIndex: 0,
  stepIndex: 0,
  completed: false,
  scores: initialScoreState(),
  decisions: [],
  placements: [],
  twAnswers: [],
  permitAnswers: [],
  huntAnswers: [],
  sequenceAnswers: [],
  riskRegister: [],
  incidentLog: [],
  criticalFailures: [],
  cpp: {},
  drawnEventIds: [],
  delegateName: '',
  startedAt: null,
  finishedAt: null,
  game: initialGameMeta(),
}

export const initialTutorState: TutorState = {
  enabled: false,
  revealAnswers: false,
  paused: false,
  customQuestions: [],
  customHazards: [],
}

export type GameAction =
  | { type: 'START_SCENARIO'; scenarioId: string; delegateName: string; difficulty: Difficulty; seed: number }
  | {
      type: 'ANSWER_DECISION'
      step: DecisionStep
      option: DecisionOption
      phaseNumber: number
      confidence: Confidence
      timeFrac: number | null
      timedOut: boolean
    }
  | { type: 'USE_LIFELINE'; stepId: string }
  | { type: 'SUBMIT_SITE_SETUP'; step: SiteSetupStep; placements: PlacementRecord[] }
  | { type: 'SUBMIT_TW'; step: TwRegisterStep; answers: TwAnswerRecord[] }
  | { type: 'SUBMIT_PERMITS'; step: PermitStep; selected: string[] }
  | { type: 'SUBMIT_HUNT'; step: HazardHuntStep; flagged: string[]; secondsLeft: number }
  | { type: 'SUBMIT_SEQUENCE'; step: SequenceStep; order: string[]; phaseNumber: number }
  | { type: 'ADVANCE'; scenario: Scenario; extraSteps: number }
  | { type: 'CLOSE_WEEK' }
  | { type: 'RECTIFY'; hazardId: string }
  | { type: 'AUDIT' }
  | { type: 'MARK_RECORDED' }
  | { type: 'FINISH' }
  | { type: 'RESET' }
  | { type: 'LOAD'; state: GameState }

function mult(state: GameState) {
  return DIFFICULTIES[state.game.difficulty].pointsMultiplier
}

function finish(state: GameState): GameState {
  const done: GameState = { ...state, completed: true, finishedAt: state.finishedAt ?? new Date().toISOString() }
  const bonuses = completionBonuses(done)
  const total = bonuses.reduce((a, b) => a + b.points, 0)
  return {
    ...done,
    game: { ...award(done.game, total, 'Project completion'), bonuses, pendingWeek: null },
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_SCENARIO': {
      const scenario = getScenario(action.scenarioId)
      if (!scenario) return state
      const diff = DIFFICULTIES[action.difficulty]
      const rand = rngFor(action.seed, 'events')
      const pool = shuffleWith(scenario.eventPool, rand)
      const drawn = pool.slice(0, Math.min(diff.eventDraw, pool.length)).map((e) => e.id)
      const rest = pool.slice(drawn.length)
      const phases = shuffleWith([6, 7, 8, 9, 10, 11], rand)
      const surpriseEvents = rest
        .slice(0, diff.surpriseEvents)
        .map((e, i) => ({ phaseNumber: phases[i], eventId: e.id }))
      const eco = economyFor(scenario, action.difficulty)
      return {
        ...initialGameState,
        scores: initialScoreState(),
        scenarioId: action.scenarioId,
        delegateName: action.delegateName,
        drawnEventIds: drawn,
        startedAt: new Date().toISOString(),
        game: {
          ...initialGameMeta(),
          difficulty: action.difficulty,
          seed: action.seed,
          budgetStart: eco.budgetStart,
          budget: eco.budgetStart,
          floatStart: eco.floatStart,
          floatDays: eco.floatStart,
          weeksTotal: eco.weeksTotal,
          lifelines: diff.lifelines,
          surpriseEvents,
        },
      }
    }

    case 'ANSWER_DECISION': {
      const { step, option, phaseNumber, confidence, timeFrac, timedOut } = action
      if (state.decisions.some((d) => d.stepId === step.id)) return state
      const scenario = state.scenarioId ? getScenario(state.scenarioId) : null
      const scores = applyDecision(state.scores, step, option)
      const usedLifeline = state.game.lifelineSteps.includes(step.id)
      const points = decisionPoints({
        quality: option.quality,
        confidence,
        streak: state.game.streak,
        timeFrac,
        lifeline: usedLifeline,
        timedOut,
        multiplier: mult(state),
      })
      const decisions = [
        ...state.decisions,
        {
          stepId: step.id,
          phaseNumber,
          prompt: step.prompt,
          topic: step.topic,
          chosenOptionId: option.id,
          quality: option.quality,
          wasEvent: !!step.isEvent,
          confidence,
          timedOut,
          usedLifeline,
          points,
        },
      ]
      const isCritical = !!option.criticalFailure && !state.criticalFailures.includes(option.criticalFailure)
      const criticalFailures = isCritical ? [...state.criticalFailures, option.criticalFailure!] : state.criticalFailures
      const cpp = { ...state.cpp }
      if (step.cppSection && step.cppText) {
        const text = step.cppText[option.quality] ?? step.cppText.best
        if (text) cpp[step.cppSection] = [...(cpp[step.cppSection] ?? []), text]
      }
      const riskRegister = step.riskEntry
        ? [
            ...state.riskRegister,
            {
              hazard: step.riskEntry.hazard,
              control: option.quality === 'best' ? step.riskEntry.control : `Chosen response: ${option.text}`,
              adequate: option.quality === 'best' || option.quality === 'partial',
            },
          ]
        : state.riskRegister
      const incidentLog = step.isEvent
        ? [
            ...state.incidentLog,
            { stepId: step.id, prompt: step.prompt, outcomeQuality: option.quality, response: option.text },
          ]
        : state.incidentLog

      const eco = scenario && !timedOut ? decisionEconomy(option, scenario) : { cost: 0, days: timedOut ? 0.5 : 0 }
      const latent = latentFromOption(step, option, phaseNumber)
      const streak = option.quality === 'best' ? state.game.streak + 1 : 0
      let game: GameMeta = {
        ...state.game,
        streak,
        bestStreak: Math.max(state.game.bestStreak, streak),
        budget: state.game.budget - eco.cost,
        floatDays: state.game.floatDays + eco.days,
        strikes: state.game.strikes + (isCritical ? 1 : 0),
        timeouts: state.game.timeouts + (timedOut ? 1 : 0),
        confidence: timedOut
          ? state.game.confidence
          : [...state.game.confidence, { stepId: step.id, confidence, quality: option.quality }],
        latent: latent ? [...state.game.latent, latent] : state.game.latent,
      }
      const label = timedOut
        ? 'Out of time'
        : option.quality === 'best'
          ? (streak >= 3 ? `Streak ×${streak}` : 'Good call')
          : option.quality === 'partial' ? 'Partly right' : option.quality === 'poor' ? 'Poor call' : 'Unsafe call'
      game = award(game, points, label)
      return { ...state, scores, decisions, criticalFailures, cpp, riskRegister, incidentLog, game }
    }

    case 'USE_LIFELINE': {
      if (state.game.lifelines <= 0 || state.game.lifelineSteps.includes(action.stepId)) return state
      return {
        ...state,
        game: {
          ...state.game,
          lifelines: state.game.lifelines - 1,
          lifelineSteps: [...state.game.lifelineSteps, action.stepId],
        },
      }
    }

    case 'SUBMIT_SITE_SETUP': {
      const { scores, assessments } = applySiteSetup(state.scores, action.step, action.placements)
      const m = mult(state)
      let pts = 0
      for (const a of assessments) {
        const rule = action.step.rules.find((r) => r.itemId === a.itemId)
        if (!rule?.required) continue
        pts += a.status === 'good' ? 25 : a.status === 'neutral' ? 10 : a.status === 'unsafe' ? -40 : -20
      }
      return { ...state, scores, placements: action.placements, game: award(state.game, Math.round(pts * m), 'Site layout') }
    }

    case 'SUBMIT_TW': {
      const scores = applyTwRegister(state.scores, action.step, action.answers)
      const others = state.twAnswers.filter((a) => !action.answers.some((n) => n.itemId === a.itemId))
      let pts = 0
      for (const item of action.step.items) {
        const { earned, possible } = twItemScore(item, action.answers.find((a) => a.itemId === item.id))
        pts += earned * 4 + (earned === possible ? 30 : 0)
      }
      return {
        ...state,
        scores,
        twAnswers: [...others, ...action.answers],
        game: award(state.game, Math.round(pts * mult(state)), 'TW register'),
      }
    }

    case 'SUBMIT_PERMITS': {
      const scores = applyPermits(state.scores, action.step, action.selected)
      let pts = 0
      for (const req of action.step.required) pts += action.selected.includes(req) ? 40 : -60
      pts -= action.selected.filter((s) => !action.step.required.includes(s)).length * 15
      return {
        ...state,
        scores,
        permitAnswers: [...state.permitAnswers, { stepId: action.step.id, selected: action.selected }],
        game: award(state.game, Math.round(pts * mult(state)), 'Permits'),
      }
    }

    case 'SUBMIT_HUNT': {
      if (state.huntAnswers.some((h) => h.stepId === action.step.id)) return state
      const scores = applyHazardHunt(state.scores, action.step, action.flagged)
      const a = assessHunt(action.step, action.flagged)
      let pts = a.found.reduce((s, o) => s + (o.severity === 'high' ? 80 : 60), 0)
      pts -= a.falseFlags.length * 30 + a.missed.length * 20
      if (a.missed.length === 0) pts += action.secondsLeft * 2
      const riskRegister = [
        ...state.riskRegister,
        ...a.found.map((o) => ({ hazard: `Walk-round: ${o.text}`, control: o.explanation, adequate: true })),
        ...a.missed.map((o) => ({ hazard: `Walk-round: ${o.text}`, control: `NOT IDENTIFIED on the walk-round. ${o.explanation}`, adequate: false })),
      ]
      const cpp = { ...state.cpp }
      cpp.riskAssessmentSummary = [
        ...(cpp.riskAssessmentSummary ?? []),
        `Site walk-round: ${a.found.length} of ${a.found.length + a.missed.length} hazards identified and actioned` +
          (a.missed.length ? `; ${a.missed.length} not identified and still present on site.` : '.'),
      ]
      return {
        ...state,
        scores,
        riskRegister,
        cpp,
        huntAnswers: [...state.huntAnswers, { stepId: action.step.id, flagged: action.flagged, secondsLeft: action.secondsLeft }],
        game: award(state.game, Math.round(pts * mult(state)), 'Hazard hunt'),
      }
    }

    case 'SUBMIT_SEQUENCE': {
      const { step, order, phaseNumber } = action
      if (state.sequenceAnswers.some((s) => s.stepId === step.id)) return state
      const scores = applySequence(state.scores, step, order)
      const a = assessSequence(step, order)
      const label = (id: string) => step.activities.find((x) => x.id === id)?.label ?? id
      let pts = a.satisfied.length * 25 - a.criticalViolated.length * 100
      if (a.perfect) pts += 150
      const newCritical = a.criticalViolated
        .map((c) => `Out-of-sequence work: "${label(c.after)}" planned before "${label(c.before)}"`)
        .filter((f) => !state.criticalFailures.includes(f))
      const latent = a.criticalViolated.map((c, i) => ({
        id: `${step.id}:seq:${i}`,
        stepId: step.id,
        phaseNumber,
        severity: 'major' as const,
        topic: step.topic,
        choice: `Planned "${label(c.after)}" before "${label(c.before)}"`,
        consequence: `Work went ahead out of sequence. ${c.reason}`,
        status: 'open' as const,
        revealed: false,
      }))
      const cpp = { ...state.cpp }
      const section = phaseNumber <= 3 ? 'projectDescription' : 'highRiskActivities'
      cpp[section] = [
        ...(cpp[section] ?? []),
        `Planned sequence (${step.topic}): ${order.map(label).join(' → ')}` +
          (a.violated.length ? `. ${a.violated.length} sequencing conflict(s) unresolved.` : '.'),
      ]
      let game: GameMeta = {
        ...state.game,
        // One badly ordered plan is one strike, however many hold points it breaks.
        strikes: state.game.strikes + (newCritical.length > 0 ? 1 : 0),
        latent: [...state.game.latent, ...latent],
      }
      game = award(game, Math.round(pts * mult(state)), a.perfect ? 'Perfect sequence' : 'Sequence')
      return {
        ...state,
        scores,
        cpp,
        criticalFailures: [...state.criticalFailures, ...newCritical],
        sequenceAnswers: [...state.sequenceAnswers, { stepId: step.id, order }],
        game,
      }
    }

    case 'ADVANCE': {
      const { scenario, extraSteps } = action
      if (state.game.pendingWeek) return state
      const phase = scenario.phases[state.phaseIndex]
      const stepCount = (phase?.steps.length ?? 0) + extraSteps
      if (state.stepIndex + 1 < stepCount) {
        return { ...state, stepIndex: state.stepIndex + 1 }
      }
      // Phase complete. A site week passes during the construction period.
      let next: GameState = state
      if (phase && WEEK_PHASES.includes(phase.number)) {
        const sim = simulateWeek(state, scenario, phase.number)
        next = { ...state, game: sim.game, scores: { ...state.scores, meters: sim.meters } }
      }
      if (state.phaseIndex + 1 < scenario.phases.length) {
        return { ...next, phaseIndex: state.phaseIndex + 1, stepIndex: 0 }
      }
      return finish(next)
    }

    case 'CLOSE_WEEK': {
      const wk = state.game.pendingWeek
      if (!wk) return state
      const cleared: GameState = { ...state, game: { ...state.game, pendingWeek: null } }
      return wk.shutdown ? finish(cleared) : cleared
    }

    case 'RECTIFY': {
      const scenario = state.scenarioId ? getScenario(state.scenarioId) : null
      const h = state.game.latent.find((x) => x.id === action.hazardId)
      if (!scenario || !h || h.status !== 'open') return state
      const c = rectifyCost(h, scenario)
      const game: GameMeta = {
        ...state.game,
        budget: state.game.budget - c.cost,
        floatDays: state.game.floatDays - c.days,
        latent: state.game.latent.map((x) => (x.id === h.id ? { ...x, status: 'rectified' as const, revealed: true } : x)),
      }
      return {
        ...state,
        scores: {
          ...state.scores,
          meters: {
            ...state.scores.meters,
            incidentLikelihood: Math.max(0, state.scores.meters.incidentLikelihood - (h.severity === 'major' ? 4 : 2)),
            enforcementRisk: Math.max(0, state.scores.meters.enforcementRisk - (h.severity === 'major' ? 3 : 1)),
          },
        },
        game: award(game, Math.round(20 * mult(state)), 'Risk closed out'),
      }
    }

    case 'AUDIT': {
      const scenario = state.scenarioId ? getScenario(state.scenarioId) : null
      if (!scenario) return state
      const c = auditCost(scenario)
      return {
        ...state,
        game: {
          ...state.game,
          budget: state.game.budget - c.cost,
          floatDays: state.game.floatDays - c.days,
          auditsUsed: state.game.auditsUsed + 1,
          latent: state.game.latent.map((x) => (x.status === 'open' ? { ...x, revealed: true } : x)),
        },
      }
    }

    case 'MARK_RECORDED':
      return { ...state, game: { ...state.game, recorded: true } }
    case 'FINISH':
      return state.completed ? state : finish(state)
    case 'RESET':
      return { ...initialGameState, scores: initialScoreState(), game: initialGameMeta() }
    case 'LOAD':
      return action.state
    default:
      return state
  }
}

export function isEventPhase(phaseNumber: number | undefined): boolean {
  return phaseNumber === 12
}

type TutorAction =
  | { type: 'SET_ENABLED'; enabled: boolean }
  | { type: 'SET_REVEAL'; reveal: boolean }
  | { type: 'SET_PAUSED'; paused: boolean }
  | { type: 'ADD_QUESTION'; question: CustomQuestion }
  | { type: 'REMOVE_QUESTION'; id: string }
  | { type: 'ADD_HAZARD'; hazard: string }
  | { type: 'REMOVE_HAZARD'; hazard: string }
  | { type: 'LOAD'; state: TutorState }

function tutorReducer(state: TutorState, action: TutorAction): TutorState {
  switch (action.type) {
    case 'SET_ENABLED': return { ...state, enabled: action.enabled }
    case 'SET_REVEAL': return { ...state, revealAnswers: action.reveal }
    case 'SET_PAUSED': return { ...state, paused: action.paused }
    case 'ADD_QUESTION': return { ...state, customQuestions: [...state.customQuestions, action.question] }
    case 'REMOVE_QUESTION': return { ...state, customQuestions: state.customQuestions.filter((q) => q.id !== action.id) }
    case 'ADD_HAZARD': return { ...state, customHazards: [...state.customHazards, action.hazard] }
    case 'REMOVE_HAZARD': return { ...state, customHazards: state.customHazards.filter((h) => h !== action.hazard) }
    case 'LOAD': return action.state
    default: return state
  }
}

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  tutor: TutorState
  tutorDispatch: React.Dispatch<TutorAction>
  scenario: Scenario | null
}

const GameContext = createContext<GameContextValue | null>(null)

function loadSaved<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

/** Accept a saved game only if it has the current shape. */
function loadGame(): GameState | null {
  const saved = loadSaved<GameState>(SAVE_KEY)
  if (!saved || !saved.game || !Array.isArray(saved.huntAnswers) || !Array.isArray(saved.sequenceAnswers)) return null
  return { ...initialGameState, ...saved, game: { ...initialGameMeta(), ...saved.game } }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState, (init) => loadGame() ?? init)
  const [tutor, tutorDispatch] = useReducer(tutorReducer, initialTutorState, (init) => loadSaved<TutorState>(TUTOR_KEY) ?? init)

  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)) } catch { /* storage full/blocked */ }
  }, [state])
  useEffect(() => {
    try { localStorage.setItem(TUTOR_KEY, JSON.stringify(tutor)) } catch { /* storage full/blocked */ }
  }, [tutor])

  const scenario = useMemo(() => (state.scenarioId ? getScenario(state.scenarioId) : null), [state.scenarioId])

  const value = useMemo(
    () => ({ state, dispatch, tutor, tutorDispatch, scenario }),
    [state, tutor, scenario],
  )
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
