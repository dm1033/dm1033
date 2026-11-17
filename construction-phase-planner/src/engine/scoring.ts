import type {
  DecisionStep, DecisionOption, MeterKey, PermitOption, PermitStep, PlacementRecord,
  ScoreKey, ScoreState, SiteSetupStep, TwAnswerRecord, TwCatAnswer, TwItem, TwRegisterStep,
  GradeBand, HazardHuntStep, HazardObservation, SequenceStep, SequenceConstraint,
} from '../types'
import { GRADE_BANDS, METER_KEYS, SCORE_KEYS } from '../types'
import { rngFor, shuffleWith } from './game'

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

/**
 * Marks available in each category for a decision: the marks the model ("best") answer carries.
 * A distractor never sets the maximum, so a shortcut that "saves time" cannot out-score the model
 * answer, and the model answer always earns every mark the question makes available.
 * (A step with no best option, which authored content never has, falls back to the highest mark on offer.)
 */
export function decisionPossible(step: DecisionStep): Record<ScoreKey, number> {
  const poss = zeroScores()
  const best = step.options.filter((o) => o.quality === 'best')
  const pool = best.length > 0 ? best : step.options
  for (const key of SCORE_KEYS) {
    let max = 0
    for (const opt of pool) {
      const v = opt.impact[key]
      if (typeof v === 'number' && v > max) max = v
    }
    poss[key] = max
  }
  return poss
}

/**
 * Apply a chosen decision option to the score state (returns a copy).
 * The best answer earns the full marks available: what doing the job properly costs in time is
 * charged to programme float by the game layer (decisionEconomy), never to the competence score.
 * Any other answer earns its own marks, capped at the marks available; negative marks still count.
 */
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
    if (option.quality === 'best') next.earned[key] += poss[key]
    else if (typeof v === 'number') next.earned[key] += Math.min(v, poss[key])
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
  /** Why the item belongs where the model answer puts it (the rule's placement note). */
  note: string
  /** True when the scenario requires this item; optional items are only assessed when placed. */
  required: boolean
  /** Labels of the zones where this item earns full marks, for "it should be in ..." feedback. */
  idealZones: string[]
}

export function zoneAt(step: SiteSetupStep, x: number, y: number): string[] {
  return step.zones
    .filter((z) => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2)
    .map((z) => z.id)
}

export function assessPlacements(step: SiteSetupStep, placements: PlacementRecord[]): PlacementAssessment[] {
  const out: PlacementAssessment[] = []
  const zoneLabel = (id: string) => step.zones.find((z) => z.id === id)?.label ?? id
  for (const rule of step.rules) {
    const base = {
      itemId: rule.itemId,
      note: rule.placementNote,
      required: rule.required,
      idealZones: [...new Set(rule.goodZones.map(zoneLabel))],
    }
    const placed = placements.find((p) => p.itemId === rule.itemId)
    if (!placed) {
      if (rule.required) out.push({ ...base, status: 'missing' })
      continue
    }
    const zones = zoneAt(step, placed.x, placed.y)
    if (zones.some((z) => rule.badZones.includes(z))) out.push({ ...base, status: 'unsafe' })
    else if (zones.some((z) => rule.goodZones.includes(z))) out.push({ ...base, status: 'good' })
    else out.push({ ...base, status: 'neutral' })
  }
  return out
}

const SITE_PLANNING_PTS = 10
const SITE_SAFETY_PTS = 5
const SITE_ENVIRONMENT_PTS = 5

/**
 * Site set-up items that are environmental controls. Where one of these is a required item it
 * also carries Environmental Control marks, so where the fuel store, spill kit, drain protection,
 * washout and skips go moves that score and not only Planning and Safety.
 */
export const ENVIRONMENTAL_SITE_ITEMS: ReadonlySet<string> = new Set([
  'fuel-storage', 'spill-kit', 'drain-protection', 'concrete-wash', 'wheel-wash',
  'dust-suppression', 'noise-barrier', 'skips',
])

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
  const part = (pts: number) => Math.round(pts * 0.6)

  for (const rule of step.rules) {
    const env = ENVIRONMENTAL_SITE_ITEMS.has(rule.itemId)
    const status = assessments.find((x) => x.itemId === rule.itemId)?.status
    if (rule.required) {
      next.possible.planning += SITE_PLANNING_PTS
      next.possible.safety += SITE_SAFETY_PTS
      if (env) next.possible.environment += SITE_ENVIRONMENT_PTS
      if (status === 'good') {
        next.earned.planning += SITE_PLANNING_PTS
        next.earned.safety += SITE_SAFETY_PTS
        if (env) next.earned.environment += SITE_ENVIRONMENT_PTS
      } else if (status === 'neutral') {
        next.earned.planning += part(SITE_PLANNING_PTS)
        next.earned.safety += part(SITE_SAFETY_PTS)
        if (env) next.earned.environment += part(SITE_ENVIRONMENT_PTS)
      } else if (status !== 'unsafe') {
        // Required item never placed.
        next.meters.incidentLikelihood = clamp(next.meters.incidentLikelihood + 3)
      }
    }
    // Required or optional: an item put where its own rule says it is unsafe costs marks.
    // (An optional item earns nothing for being placed, but it is still on the site.)
    if (status === 'unsafe') {
      next.earned.safety -= SITE_SAFETY_PTS
      if (env) next.earned.environment -= SITE_ENVIRONMENT_PTS
      next.meters.incidentLikelihood = clamp(next.meters.incidentLikelihood + 5)
    }
  }
  return { scores: next, assessments }
}

// ---------- Temporary works scoring ----------

export const TW_FIELD_KEYS = ['register', 'design', 'catCheck', 'rams', 'inspection', 'holdPoint', 'responsible'] as const
export type TwFieldKey = (typeof TW_FIELD_KEYS)[number]
const TW_PTS_PER_FIELD = 2
const TW_CAT_ORDER: TwCatAnswer[] = ['cat0', 'cat1', 'cat2', 'cat3']

export interface TwItemScore {
  earned: number
  possible: number
  /** Fields that differ from the model answer (unanswered fields included). */
  wrongFields: string[]
  /**
   * Subset of wrongFields that differ on the safe side. Today that is only a design check
   * category exactly one step more rigorous than the model answer: the category is the
   * minimum a competent Temporary Works Co-ordinator would accept, so going one higher is safe
   * but costs time and money. It earns half the field's marks instead of none.
   */
  cautiousFields: string[]
}

export function twItemScore(item: TwItem, answer: TwAnswerRecord | undefined): TwItemScore {
  const possible = TW_FIELD_KEYS.length * TW_PTS_PER_FIELD
  if (!answer) return { earned: 0, possible, wrongFields: [...TW_FIELD_KEYS], cautiousFields: [] }
  let earned = 0
  const wrongFields: string[] = []
  const cautiousFields: string[] = []
  for (const key of TW_FIELD_KEYS) {
    const correct = item.correct[key as keyof TwItem['correct']]
    const given = answer[key as keyof TwAnswerRecord]
    if (given !== undefined && given === correct) {
      earned += TW_PTS_PER_FIELD
      continue
    }
    wrongFields.push(key)
    if (key === 'catCheck' && given !== undefined
      && TW_CAT_ORDER.indexOf(given as TwCatAnswer) === TW_CAT_ORDER.indexOf(item.correct.catCheck) + 1) {
      earned += TW_PTS_PER_FIELD / 2
      cautiousFields.push(key)
    }
  }
  return { earned, possible, wrongFields, cautiousFields }
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
/** Planning marks lost for each permit raised that the work does not need (paperwork padding). */
const PERMIT_PADDING_PTS = 2

export interface PermitAssessment {
  /** Required permits that were raised. */
  raised: PermitOption[]
  /** Required permits that were not raised. */
  missed: PermitOption[]
  /** Permits raised that this stage of the work does not need. */
  unnecessary: PermitOption[]
}

export function assessPermits(step: PermitStep, selected: string[]): PermitAssessment {
  const set = new Set(selected)
  const named = (id: string): PermitOption => step.options.find((o) => o.id === id) ?? { id, name: id }
  return {
    raised: step.required.filter((id) => set.has(id)).map(named),
    missed: step.required.filter((id) => !set.has(id)).map(named),
    unnecessary: step.options.filter((o) => set.has(o.id) && !step.required.includes(o.id)),
  }
}

export function applyPermits(scores: ScoreState, step: PermitStep, selected: string[]): ScoreState {
  const next: ScoreState = {
    earned: { ...scores.earned },
    possible: { ...scores.possible },
    meters: { ...scores.meters },
  }
  const a = assessPermits(step, selected)
  const required = a.raised.length + a.missed.length
  next.possible.legal += required * PERMIT_LEGAL_PTS
  next.possible.safety += required * PERMIT_SAFETY_PTS
  next.earned.legal += a.raised.length * PERMIT_LEGAL_PTS
  next.earned.safety += a.raised.length * PERMIT_SAFETY_PTS
  for (let i = 0; i < a.missed.length; i++) {
    next.meters.enforcementRisk = clamp(next.meters.enforcementRisk + 5)
    next.meters.incidentLikelihood = clamp(next.meters.incidentLikelihood + 5)
  }
  // A permit for everything devalues the permits that matter: proportionality is part of planning.
  next.earned.planning -= a.unnecessary.length * PERMIT_PADDING_PTS
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
  // A false alarm costs half of what a find earns, in both categories, so flagging every tile is
  // worth half marks at most. False alarms can cancel finds but never take the walk-round below zero.
  next.earned.safety += Math.max(0, a.found.length * HUNT_SAFETY_PTS - a.falseFlags.length * (HUNT_SAFETY_PTS / 2))
  next.earned.planning += Math.max(0, a.found.length * HUNT_PLANNING_PTS - a.falseFlags.length * (HUNT_PLANNING_PTS / 2))
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

/**
 * The shuffled order the Sequence Planner starts from: stable for a given run (seed) and never
 * an order that already satisfies every dependency, because any order that respects the
 * dependencies scores as perfect, not only the authored one.
 */
export function initialSequenceOrder(step: SequenceStep, seed: number): string[] {
  const ids = step.activities.map((a) => a.id)
  for (let attempt = 0; attempt < 24; attempt++) {
    const order = shuffleWith(ids, rngFor(seed, `seq:${step.id}:${attempt}`))
    if (!assessSequence(step, order).perfect) return order
  }
  // Reversing the authored order breaks every dependency there is.
  return [...ids].reverse()
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

/**
 * The least any assessed category counts towards the overall grade, as a share of all the marks
 * available. Without a floor the thin categories (Environmental Control, Quality / Handover)
 * would barely register; with equal weights one answer in a thin category moved the grade a band.
 */
export const CATEGORY_WEIGHT_FLOOR = 0.03

/**
 * How much each assessed category counts towards the overall grade (shares that add up to 1).
 * A category counts in proportion to the marks available in it, subject to the floor above.
 * Categories nobody has been tested on yet are left out.
 */
export function categoryWeights(state: ScoreState): Partial<Record<ScoreKey, number>> {
  const assessed = SCORE_KEYS.filter((k) => state.possible[k] > 0)
  const total = assessed.reduce((a, k) => a + state.possible[k], 0)
  const raw = assessed.map((k) => Math.max(state.possible[k], CATEGORY_WEIGHT_FLOOR * total))
  const sum = raw.reduce((a, b) => a + b, 0)
  const out: Partial<Record<ScoreKey, number>> = {}
  assessed.forEach((k, i) => { out[k] = raw[i] / sum })
  return out
}

/**
 * Overall competence score, 0 to 100: the weighted mean of the category scores (see
 * categoryWeights). A model run scores 100, and because a category's weight follows the marks
 * behind it, no single answer can move the grade by more than a few points.
 */
export function overallScore(state: ScoreState): number {
  const weights = categoryWeights(state)
  let total = 0
  for (const key of SCORE_KEYS) {
    const w = weights[key]
    if (w === undefined) continue
    total += w * Math.min(1, Math.max(0, state.earned[key] / state.possible[key]))
  }
  return clamp(Math.round(total * 100))
}

export function gradeFor(score: number): GradeBand {
  return GRADE_BANDS.find((b) => score >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1]
}
