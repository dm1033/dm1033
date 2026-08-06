// Weighted competency assessment: 7-tier decision classification, nine weighted
// competency areas, and the critical-failure gate. Rules are documented in
// docs/SCORING-MODEL.md — keep that file in step with any change here.
import type { Classification, DecisionOption, DecisionStep, GameState, OptionQuality, Scenario, Step } from '../types'
import { SCORE_KEYS } from '../types'
import { decisionPossible, gradeFor } from './scoring'
import { stepPerformance, stepById } from './performance'

// ---------- 7-tier decision classification ----------

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  excellent: 'Excellent',
  good: 'Good',
  acceptable: 'Acceptable',
  weak: 'Weak',
  poor: 'Poor',
  unsafe: 'Unsafe',
  critical: 'Critical Failure',
}

export const CLASSIFICATION_ORDER: Classification[] = [
  'excellent', 'good', 'acceptable', 'weak', 'poor', 'unsafe', 'critical',
]

/** Fraction of the question's available score points this option earns (0–1). */
function attainment(step: DecisionStep, option: DecisionOption): number {
  const poss = decisionPossible(step)
  let max = 0
  let earned = 0
  for (const key of SCORE_KEYS) {
    max += poss[key]
    const v = option.impact[key]
    if (typeof v === 'number' && v > 0) earned += Math.min(v, poss[key])
  }
  return max > 0 ? earned / max : 0
}

/**
 * Deterministic classification derived from the authored quality tier plus score
 * attainment. An authored `classification` on the option always wins.
 */
export function classifyOption(step: DecisionStep, option: DecisionOption): Classification {
  if (option.classification) return option.classification
  if (option.quality === 'unsafe') return option.criticalFailure ? 'critical' : 'unsafe'
  if (option.quality === 'poor') return attainment(step, option) >= 0.15 ? 'weak' : 'poor'
  if (option.quality === 'partial') return attainment(step, option) >= 0.5 ? 'good' : 'acceptable'
  return 'excellent'
}

export interface ClassifiedDecision {
  stepId: string
  phaseNumber: number
  prompt: string
  topic: string
  classification: Classification
  wasEvent: boolean
  recoveryQuality?: OptionQuality
}

export function classifyRun(state: GameState, scenario: Scenario): ClassifiedDecision[] {
  return state.decisions.map((rec) => {
    const step = stepById(scenario, rec.stepId)
    let classification: Classification =
      rec.quality === 'best' ? 'excellent'
      : rec.quality === 'partial' ? 'acceptable'
      : rec.quality === 'poor' ? 'poor'
      : 'unsafe'
    if (step && step.type === 'decision') {
      const opt = step.options.find((o) => o.id === rec.chosenOptionId)
      if (opt) classification = classifyOption(step, opt)
    }
    return {
      stepId: rec.stepId,
      phaseNumber: rec.phaseNumber,
      prompt: rec.prompt,
      topic: rec.topic,
      classification,
      wasEvent: rec.wasEvent,
      recoveryQuality: rec.recoveryQuality,
    }
  })
}

// ---------- Nine weighted competency areas ----------

export type AreaId =
  | 'hs' | 'legal' | 'planning' | 'highRisk' | 'tw'
  | 'leadership' | 'occHealth' | 'environment' | 'quality'

export interface CompetencyArea {
  id: AreaId
  label: string
  weight: number // percentage; all weights sum to 100
}

export const COMPETENCY_AREAS: CompetencyArea[] = [
  { id: 'hs', label: 'Health & safety control', weight: 30 },
  { id: 'legal', label: 'Legal & management duties', weight: 15 },
  { id: 'planning', label: 'Construction planning', weight: 15 },
  { id: 'highRisk', label: 'High-risk activities', weight: 10 },
  { id: 'tw', label: 'Temporary works management', weight: 10 },
  { id: 'leadership', label: 'Leadership & communication', weight: 5 },
  { id: 'occHealth', label: 'Occupational health', weight: 5 },
  { id: 'environment', label: 'Environmental management', weight: 5 },
  { id: 'quality', label: 'Quality, completion & handover', weight: 5 },
]

/** Ordered topic rules — first match wins. Documented in docs/SCORING-MODEL.md. */
const AREA_RULES: { id: AreaId; pattern: RegExp }[] = [
  { id: 'tw', pattern: /temporary works|propping|fa[çc]ade|retention|scaffold — design|permit to load/i },
  { id: 'occHealth', pattern: /occupational health|silica|vibration|leptospir|health surveillance|dust, noise/i },
  { id: 'environment', pattern: /environment|waste|spill|pollution|washout|dewatering|noise complaint|dust complaint|nuisance|noise, vibration/i },
  { id: 'highRisk', pattern: /work at height|lifting|excavation|demolition|confined|buried services|hot work|structural|gas |HV|trench|MEWP|crane|asbestos|scaffold|leading edge|fragile|services/i },
  { id: 'leadership', pattern: /consultation|engagement|communication|behaviour|toolbox|induction|briefing|neighbour|stakeholder|supervision|non-English|worker/i },
  { id: 'legal', pattern: /cdm|law|duty|riddor|enforcement|notice|statutory|occupiers|liability|competence|nrswa|street works permits|records/i },
  { id: 'quality', pattern: /handover|reinstatement|close-out|quality/i },
  { id: 'planning', pattern: /construction phase plan|pre-construction|site set-up|logistics|programme|sequencing|planning/i },
  // default → hs (welfare, fire, first aid, traffic, PPE, permits, inspections, security, emergency, public protection)
]

export function areaForStep(step: Step): AreaId {
  if (step.type === 'twRegister') return 'tw'
  if (step.type === 'permits') return 'hs'
  if (step.type === 'siteSetup') return 'planning'
  const topic = step.type === 'decision' ? step.topic : ''
  for (const rule of AREA_RULES) {
    if (rule.pattern.test(topic)) return rule.id
  }
  return 'hs'
}

export interface AreaResult {
  area: CompetencyArea
  score: number | null
  steps: number
}

export interface WeightedResult {
  areas: AreaResult[]
  /** Weighted overall 0–100 across areas with evidence (weights renormalised). */
  overall: number
  /** Performance band label for the numeric score. */
  bandLabel: string
  /** True when unresolved critical failures cap the outcome. */
  gated: boolean
  criticalFailures: string[]
  /** The final reported outcome, after applying the critical-failure gate. */
  outcome: string
}

export function bandFor(score: number): string {
  return gradeFor(score).label
}

/** Every deterministic step in the scenario with its competency area. */
function allAssessableSteps(scenario: Scenario): { id: string; area: AreaId }[] {
  const out: { id: string; area: AreaId }[] = []
  for (const phase of scenario.phases) {
    for (const step of phase.steps) {
      if (step.type === 'info') continue
      out.push({ id: step.id, area: areaForStep(step) })
    }
  }
  // Drawn pool events count toward the area they belong to when answered.
  for (const ev of scenario.eventPool) out.push({ id: ev.id, area: areaForStep(ev) })
  return out
}

export function computeWeightedResult(state: GameState, scenario: Scenario): WeightedResult {
  const steps = allAssessableSteps(scenario)
  const byArea = new Map<AreaId, number[]>()
  for (const { id, area } of steps) {
    const perf = stepPerformance(state, scenario, id)
    if (perf === null) continue
    byArea.set(area, [...(byArea.get(area) ?? []), perf])
  }
  const areas: AreaResult[] = COMPETENCY_AREAS.map((area) => {
    const scores = byArea.get(area.id) ?? []
    return {
      area,
      steps: scores.length,
      score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    }
  })
  let weightedSum = 0
  let weightTotal = 0
  for (const a of areas) {
    if (a.score === null) continue
    weightedSum += a.score * a.area.weight
    weightTotal += a.area.weight
  }
  const overall = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0
  const gated = state.criticalFailures.length > 0
  const bandLabel = bandFor(overall)
  return {
    areas,
    overall,
    bandLabel,
    gated,
    criticalFailures: [...state.criticalFailures],
    outcome: gated
      ? 'Insufficient evidence of competence — unresolved critical failure'
      : bandLabel,
  }
}

