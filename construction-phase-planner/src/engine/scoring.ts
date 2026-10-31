import type {
  DecisionStep, DecisionOption, MeterKey, PermitStep, PlacementRecord,
  ScoreKey, ScoreState, SiteSetupStep, TwAnswerRecord, TwItem, TwRegisterStep,
  GradeBand, HazardHuntStep, HazardObservation, SequenceStep, SequenceConstraint,
} from '../types'
import { GRADE_BANDS, METER_KEYS, SCORE_KEYS } from '../types'

export const zeroScores = (): Record<ScoreKey, number> =>
  Object.fromEntries(SCORE_KEYS.map((k) => [k, 0])) as Record<ScoreKey, number>

export const initialMeters = (): Record<MeterKey, number> => ({
  clientConfidence: 70,
  morale: 70,
  enforcementRisk: 15,
  incidentLikelihood: 15,
  cost: 30,
})

export const initialScoreState = (): ScoreState => ({
  earned: zeroScores(),
  possible: zeroScores(),
  meters: initialMeters(),
})

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v))

/** Max positive points available per score category across a decision's options. */
export function decisionPossible(step: DecisionStep): Record<ScoreKey, number> {
  const poss = zeroScores()
  for (const key of SCORE_KEYS) {
    let max = 0
    for (const opt of step.options) {
      const v = opt.impact[key]
      if (typeof v === 'number' && v > max) max = v
    }
    poss[key] = max
  }
  return poss
}

/** Apply a chosen decision option to the score state (mutates a copy). */
export function applyDecision(scores: ScoreState, step: DecisionStep, option: DecisionOption): ScoreState {
  const next: ScoreState = {
    earned: { ...scores.earned },
    possible: { ...scores.possible },
    meters: { ...scores.meters },
  }
  const poss = decisionPossible(step)
  for (const key of SCORE_KEYS) {
    next.possible[key] += poss[key]
    const v = option.impact[key]
    if (typeof v === 'number') next.earned[key] += Math.min(v, poss[key])
  }
  for (const key of METER_KEYS) {
    const v = option.impact[key]
    if (typeof v === 'number') next.meters[key] = clamp(next.meters[key] + v)
  }
  return next
}

// ---------- Site set-up scoring ----------

export interface PlacementAssessment {
  itemId: string
  status: 'good' | 'neutral' | 'unsafe' | 'missing'
  note: string
}

export function zoneAt(step: SiteSetupStep, x: number, y: number): string[] {
  return step.zones
    .filter((z) => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2)
    .map((z) => z.id)
}

export function assessPlacements(step: SiteSetupStep, placements: PlacementRecord[]): PlacementAssessment[] {
  const out: PlacementAssessment[] = []
  for (const rule of step.rules) {
    const placed = placements.find((p) => p.itemId === rule.itemId)
    if (!placed) {
      if (rule.required) out.push({ itemId: rule.itemId, status: 'missing', note: rule.placementNote })
      continue
    }
    const zones = zoneAt(step, placed.x, placed.y)
    if (zones.some((z) => rule.badZones.includes(z))) {
      out.push({ itemId: rule.itemId, status: 'unsafe', note: rule.placementNote })
    } else if (zones.some((z) => rule.goodZones.includes(z))) {
      out.push({ itemId: rule.itemId, status: 'good', note: rule.placementNote })
    } else {
      out.push({ itemId: rule.itemId, status: 'neutral', note: rule.placementNote })
    }
  }
  return out
}

const SITE_PLANNING_PTS = 10
const SITE_SAFETY_PTS = 5

export function applySiteSetup(
  scores: ScoreState,
  step: SiteSetupStep,
  placements: PlacementRecord[],
): { scores: ScoreState; assessments: PlacementAssessment[] } {
  const next: ScoreState = {
    earned: { ...scores.earned },
    possible: { ...scores.possible },
    meters: { ...scores.meters },
  }
  const assessments = assessPlacements(step, placements)
  const requiredRules = step.rules.filter((r) => r.required)
  next.possible.planning += requiredRules.length * SITE_PLANNING_PTS
  next.possible.safety += requiredRules.length * SITE_SAFETY_PTS

  for (const rule of requiredRules) {
    const a = assessments.find((x) => x.itemId === rule.itemId)
    const status = a?.status ?? 'missing'
    if (status === 'good') {
      next.earned.planning += SITE_PLANNING_PTS
      next.earned.safety += SITE_SAFETY_PTS
    } else if (status === 'neutral') {
      next.earned.planning += Math.round(SITE_PLANNING_PTS * 0.6)
      next.earned.safety += Math.round(SITE_SAFETY_PTS * 0.6)
    } else if (status === 'unsafe') {
      next.earned.safety -= SITE_SAFETY_PTS
      next.meters.incidentLikelihood = clamp(next.meters.incidentLikelihood + 5)
    } else {
      next.meters.incidentLikelihood = clamp(next.meters.incidentLikelihood + 3)
    }
  }
  return { scores: next, assessments }
}

// ---------- Temporary works scoring ----------

export const TW_FIELD_KEYS = ['register', 'design', 'catCheck', 'rams', 'inspection', 'holdPoint', 'responsible'] as const
const TW_PTS_PER_FIELD = 2

export function twItemScore(item: TwItem, answer: TwAnswerRecord | undefined): { earned: number; possible: number; wrongFields: string[] } {
  const possible = TW_FIELD_KEYS.length * TW_PTS_PER_FIELD
  if (!answer) return { earned: 0, possible, wrongFields: [...TW_FIELD_KEYS] }
  let earned = 0
  const wrongFields: string[] = []
  for (const key of TW_FIELD_KEYS) {
    const correct = item.correct[key as keyof TwItem['correct']]
    const given = answer[key as keyof TwAnswerRecord]
    if (given !== undefined && given === correct) earned += TW_PTS_PER_FIELD
    else wrongFields.push(key)
  }
  return { earned, possible, wrongFields }
}

export function applyTwRegister(
  scores: ScoreState,
  step: TwRegisterStep,
  answers: TwAnswerRecord[],
): ScoreState {
  const next: ScoreState = {
    earned: { ...scores.earned },
    possible: { ...scores.possible },
    meters: { ...scores.meters },
  }
  for (const item of step.items) {
    const ans = answers.find((a) => a.itemId === item.id)
    const { earned, possible, wrongFields } = twItemScore(item, ans)
    next.possible.temporaryWorks += possible
    next.earned.temporaryWorks += earned
    if (wrongFields.includes('register') || wrongFields.includes('design')) {
      next.meters.incidentLikelihood = clamp(next.meters.incidentLikelihood + 4)
    }
  }
  return next
}

// ---------- Permit scoring ----------

const PERMIT_LEGAL_PTS = 4
const PERMIT_SAFETY_PTS = 3

export function applyPermits(scores: ScoreState, step: PermitStep, selected: string[]): ScoreState {
  const next: ScoreState = {
    earned: { ...scores.earned },
    possible: { ...scores.possible },
    meters: { ...scores.meters },
  }
  for (const req of step.required) {
    next.possible.legal += PERMIT_LEGAL_PTS
    next.possible.safety += PERMIT_SAFETY_PTS
    if (selected.includes(req)) {
      next.earned.legal += PERMIT_LEGAL_PTS
      next.earned.safety += PERMIT_SAFETY_PTS
    } else {
      next.meters.enforcementRisk = clamp(next.meters.enforcementRisk + 5)
      next.meters.incidentLikelihood = clamp(next.meters.incidentLikelihood + 5)
    }
  }
  return next
}

// ---------- Hazard hunt scoring ----------

export interface HuntAssessment {
  found: HazardObservation[]
  missed: HazardObservation[]
  falseFlags: HazardObservation[]
}

export function assessHunt(step: HazardHuntStep, flagged: string[]): HuntAssessment {
  const set = new Set(flagged)
  return {
    found: step.observations.filter((o) => o.hazard && set.has(o.id)),
    missed: step.observations.filter((o) => o.hazard && !set.has(o.id)),
    falseFlags: step.observations.filter((o) => !o.hazard && set.has(o.id)),
  }
}

const HUNT_SAFETY_PTS = 4
const HUNT_PLANNING_PTS = 2

export function applyHazardHunt(scores: ScoreState, step: HazardHuntStep, flagged: string[]): ScoreState {
  const next: ScoreState = {
    earned: { ...scores.earned },
    possible: { ...scores.possible },
    meters: { ...scores.meters },
  }
  const a = assessHunt(step, flagged)
  const hazards = a.found.length + a.missed.length
  next.possible.safety += hazards * HUNT_SAFETY_PTS
  next.possible.planning += hazards * HUNT_PLANNING_PTS
  next.earned.safety += a.found.length * HUNT_SAFETY_PTS - a.falseFlags.length * (HUNT_SAFETY_PTS / 2)
  next.earned.planning += a.found.length * HUNT_PLANNING_PTS
  for (const m of a.missed) {
    next.meters.incidentLikelihood = clamp(next.meters.incidentLikelihood + (m.severity === 'high' ? 4 : 2))
  }
  return next
}

// ---------- Sequencing scoring ----------

export interface SequenceAssessment {
  satisfied: SequenceConstraint[]
  violated: SequenceConstraint[]
  criticalViolated: SequenceConstraint[]
  perfect: boolean
}

export function assessSequence(step: SequenceStep, order: string[]): SequenceAssessment {
  const pos = new Map(order.map((id, i) => [id, i]))
  const satisfied: SequenceConstraint[] = []
  const violated: SequenceConstraint[] = []
  for (const c of step.constraints) {
    const b = pos.get(c.before)
    const a = pos.get(c.after)
    if (b !== undefined && a !== undefined && b < a) satisfied.push(c)
    else violated.push(c)
  }
  return {
    satisfied,
    violated,
    criticalViolated: violated.filter((c) => c.critical),
    perfect: violated.length === 0,
  }
}

const SEQ_PLANNING_PTS = 3
const SEQ_SAFETY_PTS = 4

export function applySequence(scores: ScoreState, step: SequenceStep, order: string[]): ScoreState {
  const next: ScoreState = {
    earned: { ...scores.earned },
    possible: { ...scores.possible },
    meters: { ...scores.meters },
  }
  const a = assessSequence(step, order)
  next.possible.planning += step.constraints.length * SEQ_PLANNING_PTS
  next.earned.planning += a.satisfied.length * SEQ_PLANNING_PTS
  const critical = step.constraints.filter((c) => c.critical)
  next.possible.safety += critical.length * SEQ_SAFETY_PTS
  next.earned.safety += (critical.length - a.criticalViolated.length) * SEQ_SAFETY_PTS
  next.possible.programme += step.constraints.length
  next.earned.programme += a.satisfied.length
  next.meters.incidentLikelihood = clamp(next.meters.incidentLikelihood + a.criticalViolated.length * 5)
  return next
}

// ---------- Final scores ----------

export function categoryScore(state: ScoreState, key: ScoreKey): number | null {
  const possible = state.possible[key]
  if (possible <= 0) return null
  return clamp(Math.round((state.earned[key] / possible) * 100))
}

export function overallScore(state: ScoreState): number {
  const vals = SCORE_KEYS.map((k) => categoryScore(state, k)).filter((v): v is number => v !== null)
  if (vals.length === 0) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

export function gradeFor(score: number): GradeBand {
  return GRADE_BANDS.find((b) => score >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1]
}

/** Deterministic PRNG so the drawn events stay stable for a given seed. */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items]
  let s = seed || 1
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
