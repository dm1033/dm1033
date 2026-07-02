import type {
  DecisionStep, DecisionOption, GameState, MeterKey, PermitStep, PlacementRecord,
  ScoreImpact, ScoreKey, ScoreState, SiteSetupStep, TwAnswerRecord, TwItem, TwRegisterStep,
  GradeBand,
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
