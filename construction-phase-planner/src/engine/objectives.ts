import type { GameState, Scenario } from '../types'
import { LEARNING_OBJECTIVES, OBJECTIVE_MAP, type LearningObjective } from '../data/objectives'
import { stepPerformance } from './performance'

export type ObjectiveStatus = 'achieved' | 'partial' | 'revise' | 'not-reached'

export interface ObjectiveCoverage {
  objective: LearningObjective
  stepIds: string[]
  encountered: number
  /** 0–100 performance across encountered mapped steps, or null if none reached yet. */
  performance: number | null
  status: ObjectiveStatus
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
