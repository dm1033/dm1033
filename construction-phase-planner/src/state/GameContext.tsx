import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type {
  CustomQuestion, DecisionOption, DecisionStep, GameState, PermitStep, PlacementRecord,
  Scenario, SiteSetupStep, TutorState, TwAnswerRecord, TwRegisterStep,
} from '../types'
import {
  applyDecision, applyPermits, applySiteSetup, applyTwRegister,
  initialScoreState, seededShuffle,
} from '../engine/scoring'
import { getScenario } from '../data'

const SAVE_KEY = 'cpp-smsts-save-v1'
const TUTOR_KEY = 'cpp-smsts-tutor-v1'

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
  riskRegister: [],
  incidentLog: [],
  criticalFailures: [],
  cpp: {},
  drawnEventIds: [],
  delegateName: '',
  startedAt: null,
  finishedAt: null,
}

export const initialTutorState: TutorState = {
  enabled: false,
  revealAnswers: false,
  paused: false,
  customQuestions: [],
  customHazards: [],
}

type Action =
  | { type: 'START_SCENARIO'; scenarioId: string; delegateName: string }
  | { type: 'ANSWER_DECISION'; step: DecisionStep; option: DecisionOption; phaseNumber: number }
  | { type: 'SUBMIT_SITE_SETUP'; step: SiteSetupStep; placements: PlacementRecord[] }
  | { type: 'SUBMIT_TW'; step: TwRegisterStep; answers: TwAnswerRecord[] }
  | { type: 'SUBMIT_PERMITS'; step: PermitStep; selected: string[] }
  | { type: 'ADVANCE'; scenario: Scenario; extraSteps: number }
  | { type: 'FINISH' }
  | { type: 'RESET' }
  | { type: 'LOAD'; state: GameState }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_SCENARIO': {
      const scenario = getScenario(action.scenarioId)
      const seed = Date.now()
      const drawn = scenario
        ? seededShuffle(scenario.eventPool, seed).slice(0, scenario.eventDraw).map((e) => e.id)
        : []
      return {
        ...initialGameState,
        scenarioId: action.scenarioId,
        delegateName: action.delegateName,
        drawnEventIds: drawn,
        startedAt: new Date().toISOString(),
      }
    }
    case 'ANSWER_DECISION': {
      const { step, option, phaseNumber } = action
      const scores = applyDecision(state.scores, step, option)
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
        },
      ]
      const criticalFailures =
        option.criticalFailure && !state.criticalFailures.includes(option.criticalFailure)
          ? [...state.criticalFailures, option.criticalFailure]
          : state.criticalFailures
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
      return { ...state, scores, decisions, criticalFailures, cpp, riskRegister, incidentLog }
    }
    case 'SUBMIT_SITE_SETUP': {
      const { scores } = applySiteSetup(state.scores, action.step, action.placements)
      return { ...state, scores, placements: action.placements }
    }
    case 'SUBMIT_TW': {
      const scores = applyTwRegister(state.scores, action.step, action.answers)
      const others = state.twAnswers.filter((a) => !action.answers.some((n) => n.itemId === a.itemId))
      return { ...state, scores, twAnswers: [...others, ...action.answers] }
    }
    case 'SUBMIT_PERMITS': {
      const scores = applyPermits(state.scores, action.step, action.selected)
      return {
        ...state,
        scores,
        permitAnswers: [...state.permitAnswers, { stepId: action.step.id, selected: action.selected }],
      }
    }
    case 'ADVANCE': {
      const { scenario, extraSteps } = action
      const phase = scenario.phases[state.phaseIndex]
      const stepCount = (phase?.steps.length ?? 0) + (isEventPhase(phase?.number) ? extraSteps : 0)
      if (state.stepIndex + 1 < stepCount) {
        return { ...state, stepIndex: state.stepIndex + 1 }
      }
      if (state.phaseIndex + 1 < scenario.phases.length) {
        return { ...state, phaseIndex: state.phaseIndex + 1, stepIndex: 0 }
      }
      return { ...state, completed: true, finishedAt: new Date().toISOString() }
    }
    case 'FINISH':
      return { ...state, completed: true, finishedAt: state.finishedAt ?? new Date().toISOString() }
    case 'RESET':
      return { ...initialGameState }
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
  dispatch: React.Dispatch<Action>
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

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialGameState, (init) => loadSaved<GameState>(SAVE_KEY) ?? init)
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
