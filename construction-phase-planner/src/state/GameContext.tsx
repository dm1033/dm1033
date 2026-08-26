import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type {
  CustomQuestion, DecisionOption, DecisionStep, GameMode, GameState, PermitStep, PlacementRecord,
  Scenario, SiteSetupStep, TutorState, TwAnswerRecord, TwRegisterStep,
} from '../types'
import {
  applyDecision, applyPermits, applySiteSetup, applyTwRegister,
  initialScoreState, seededShuffle,
} from '../engine/scoring'
import type { DelayedConsequence } from '../engine/consequences'
import { METER_KEYS } from '../types'
import { getScenario } from '../data'

const SAVE_KEY = 'cpp-smsts-save-v1'
const TUTOR_KEY = 'cpp-smsts-tutor-v1'

export const initialGameState: GameState = {
  scenarioId: null,
  mode: 'learning',
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
  firedConsequences: [],
  consequenceLog: [],
  cpp: {},
  drawnEventIds: [],
  delegateName: '',
  delegateReflection: '',
  trainerComments: '',
  trainerName: '',
  runId: null,
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
  | { type: 'START_SCENARIO'; scenarioId: string; delegateName: string; mode: GameMode }
  | { type: 'ANSWER_DECISION'; step: DecisionStep; option: DecisionOption; phaseNumber: number }
  | { type: 'RECOVER_DECISION'; step: DecisionStep; option: DecisionOption }
  | { type: 'SET_SIGNOFF'; field: 'delegateReflection' | 'trainerComments' | 'trainerName'; text: string }
  | { type: 'SUBMIT_SITE_SETUP'; step: SiteSetupStep; placements: PlacementRecord[] }
  | { type: 'SUBMIT_TW'; step: TwRegisterStep; answers: TwAnswerRecord[] }
  | { type: 'SUBMIT_PERMITS'; step: PermitStep; selected: string[] }
  | { type: 'ADVANCE'; scenario: Scenario; extraSteps: number }
  | { type: 'FIRE_CONSEQUENCE'; consequence: DelayedConsequence }
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
      const runId = `CPP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 46656)
        .toString(36)
        .toUpperCase()
        .padStart(3, '0')}`
      return {
        ...initialGameState,
        scenarioId: action.scenarioId,
        mode: action.mode,
        delegateName: action.delegateName,
        drawnEventIds: drawn,
        runId,
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
          at: new Date().toISOString(),
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
    case 'RECOVER_DECISION': {
      // Recovery after a poor/unsafe answer: the first answer keeps its assessment
      // score (integrity of the record); a sound recovery claws back half of the
      // recovery option's meter effects — you can steady the project, not the exam.
      const { step, option } = action
      let idx = -1
      for (let i = state.decisions.length - 1; i >= 0; i--) {
        const d = state.decisions[i]
        if (d.stepId === step.id && d.recoveryOptionId === undefined) { idx = i; break }
      }
      if (idx === -1) return state
      const decisions = state.decisions.map((d, i) =>
        i === idx ? { ...d, recoveryOptionId: option.id, recoveryQuality: option.quality } : d,
      )
      const meters = { ...state.scores.meters }
      if (option.quality === 'best' || option.quality === 'partial') {
        for (const key of METER_KEYS) {
          const v = option.impact[key]
          if (typeof v === 'number') {
            const half = Math.round(v / 2)
            meters[key] = Math.min(100, Math.max(0, meters[key] + half))
          }
        }
      }
      return { ...state, decisions, scores: { ...state.scores, meters } }
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
    case 'FIRE_CONSEQUENCE': {
      const c = action.consequence
      if (state.firedConsequences.includes(c.id)) return state
      const meters = { ...state.scores.meters }
      for (const key of METER_KEYS) {
        const v = c.meters[key]
        if (typeof v === 'number') meters[key] = Math.min(100, Math.max(0, meters[key] + v))
      }
      const phaseNumber = c.firesAtPhase
      return {
        ...state,
        scores: { ...state.scores, meters },
        firedConsequences: [...state.firedConsequences, c.id],
        consequenceLog: [
          ...state.consequenceLog,
          { id: c.id, phaseNumber, severity: c.severity, title: c.title, message: c.message },
        ],
      }
    }
    case 'SET_SIGNOFF':
      return { ...state, [action.field]: action.text }
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

export type SaveStatus = { state: 'saved' | 'saving' | 'error'; at: string | null }

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<Action>
  tutor: TutorState
  tutorDispatch: React.Dispatch<TutorAction>
  scenario: Scenario | null
  saveStatus: SaveStatus
  exportRecovery: () => void
  importRecovery: (file: File) => Promise<string | null>
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
  const [state, dispatch] = useReducer(reducer, initialGameState, (init) => {
    const saved = loadSaved<GameState>(SAVE_KEY)
    // Migrate saves written before newer fields existed.
    return saved
      ? {
          ...init,
          ...saved,
          mode: saved.mode ?? 'learning',
          firedConsequences: saved.firedConsequences ?? [],
          consequenceLog: saved.consequenceLog ?? [],
          delegateReflection: saved.delegateReflection ?? '',
          trainerComments: saved.trainerComments ?? '',
          trainerName: saved.trainerName ?? '',
        }
      : init
  })
  const [tutor, tutorDispatch] = useReducer(tutorReducer, initialTutorState, (init) => loadSaved<TutorState>(TUTOR_KEY) ?? init)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>({ state: 'saved', at: null })

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state))
      // Verify the write actually persisted before claiming "saved".
      const readBack = localStorage.getItem(SAVE_KEY)
      if (readBack && readBack.length > 0) {
        setSaveStatus({ state: 'saved', at: new Date().toISOString() })
      } else {
        setSaveStatus({ state: 'error', at: new Date().toISOString() })
      }
    } catch {
      setSaveStatus({ state: 'error', at: new Date().toISOString() })
    }
  }, [state])
  useEffect(() => {
    try { localStorage.setItem(TUTOR_KEY, JSON.stringify(tutor)) } catch { /* storage full/blocked */ }
  }, [tutor])

  const scenario = useMemo(() => (state.scenarioId ? getScenario(state.scenarioId) : null), [state.scenarioId])

  const exportRecovery = React.useCallback(() => {
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), game: state, tutor }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cpp-recovery-${(state.delegateName || 'delegate').replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [state, tutor])

  const importRecovery = React.useCallback(async (file: File): Promise<string | null> => {
    try {
      const parsed = JSON.parse(await file.text())
      if (!parsed?.game || typeof parsed.game !== 'object' || !('phaseIndex' in parsed.game)) {
        return 'Not a valid recovery file.'
      }
      dispatch({ type: 'LOAD', state: { ...initialGameState, ...parsed.game, mode: parsed.game.mode ?? 'learning' } })
      if (parsed.tutor) tutorDispatch({ type: 'LOAD', state: { ...initialTutorState, ...parsed.tutor } })
      return null
    } catch {
      return 'Could not read the recovery file.'
    }
  }, [])

  const value = useMemo(
    () => ({ state, dispatch, tutor, tutorDispatch, scenario, saveStatus, exportRecovery, importRecovery }),
    [state, tutor, scenario, saveStatus, exportRecovery, importRecovery],
  )
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
