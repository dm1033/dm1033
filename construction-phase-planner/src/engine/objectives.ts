import type { GameState, Scenario, SiteSetupStep, Step, TwRegisterStep, PermitStep } from '../types'
import { LEARNING_OBJECTIVES, OBJECTIVE_MAP, type LearningObjective } from '../data/objectives'
import { assessPlacements, twItemScore } from './scoring'

export type ObjectiveStatus = 'achieved' | 'partial' | 'revise' | 'not-reached'

export interface ObjectiveCoverage {
  objective: LearningObjective
  stepIds: string[]
  encountered: number
  /** 0–100 performance across encountered mapped steps, or null if none reached yet. */
  performance: number | null
  status: ObjectiveStatus
}

const QUALITY_SCORE: Record<string, number> = { best: 100, partial: 60, poor: 25, unsafe: 0 }

function stepById(scenario: Scenario, id: string): Step | undefined {
  for (const phase of scenario.phases) {
    for (const step of phase.steps) if (step.id === id) return step
  }
  return undefined
}

/** Performance for one mapped step, or null if the delegate hasn't reached it. */
function stepPerformance(state: GameState, scenario: Scenario, stepId: string): number | null {
  const step = stepById(scenario, stepId)
  if (!step) return null
  switch (step.type) {
    case 'decision': {
      const rec = state.decisions.find((d) => d.stepId === stepId)
      return rec ? QUALITY_SCORE[rec.quality] ?? 0 : null
    }
    case 'siteSetup': {
      if (state.placements.length === 0) return null
      const setup = step as SiteSetupStep
      const assessments = assessPlacements(setup, state.placements)
      const required = setup.rules.filter((r) => r.required)
      if (required.length === 0) return 100
      let total = 0
      for (const rule of required) {
        const a = assessments.find((x) => x.itemId === rule.itemId)
        total += a?.status === 'good' ? 100 : a?.status === 'neutral' ? 60 : 0
      }
      return Math.round(total / required.length)
    }
    case 'twRegister': {
      const tw = step as TwRegisterStep
      const answered = tw.items.some((i) => state.twAnswers.some((a) => a.itemId === i.id))
      if (!answered) return null
      let earned = 0
      let possible = 0
      for (const item of tw.items) {
        const ans = state.twAnswers.find((a) => a.itemId === item.id)
        const s = twItemScore(item, ans)
        earned += s.earned
        possible += s.possible
      }
      return possible > 0 ? Math.round((earned / possible) * 100) : 100
    }
    case 'permits': {
      const permits = step as PermitStep
      const ans = state.permitAnswers.find((a) => a.stepId === stepId)
      if (!ans) return null
      const req = permits.required
      if (req.length === 0) return 100
      const hit = req.filter((r) => ans.selected.includes(r)).length
      return Math.round((hit / req.length) * 100)
    }
    default:
      return null
  }
}

export function computeObjectiveCoverage(state: GameState, scenario: Scenario): ObjectiveCoverage[] {
  const map = OBJECTIVE_MAP[scenario.id] ?? {}
  return LEARNING_OBJECTIVES.map((objective) => {
    const stepIds = map[objective.id] ?? []
    const scores = stepIds
      .map((id) => stepPerformance(state, scenario, id))
      .filter((v): v is number => v !== null)
    const performance = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null
    const status: ObjectiveStatus =
      performance === null ? 'not-reached'
      : performance >= 75 ? 'achieved'
      : performance >= 50 ? 'partial'
      : 'revise'
    return { objective, stepIds, encountered: scores.length, performance, status }
  })
}
