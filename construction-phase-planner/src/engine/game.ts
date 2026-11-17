// ============================================================
// Game layer: difficulty, project economy (budget & programme),
// latent hazards and consequences, HSE enforcement, points,
// streaks, confidence, completion bonuses, achievements, ranks.
//
// The seven competence categories in scoring.ts remain the
// learning assessment. Everything here is the "game" on top:
// resources to protect, risks that come back to bite, and points.
// ============================================================
import type {
  BonusLine, Confidence, ConsequenceRecord, CustomQuestion, DecisionOption, DecisionStep, Difficulty, GameMeta,
  GameState, HazardHuntStep, LatentHazard, MeterKey, NoticeRecord, OptionQuality, PermitStep, PlacementRecord,
  Scenario, SequenceStep, SiteSetupStep, Step, TwAnswerRecord, TwRegisterStep, WeekReport,
} from '../types'
import { assessSequence, zoneAt, type HuntAssessment, type PlacementAssessment } from './scoring'
import { SITE_ITEM_MAP } from '../data/siteItems'

// ---------- Difficulty ----------

export interface DifficultyDef {
  id: Difficulty
  label: string
  role: string
  icon: string
  tagline: string
  rules: string[]
  pointsMultiplier: number
  lifelines: number
  /** Seconds per normal decision (null = untimed). */
  decisionTimer: number | null
  /** Seconds per incident event (null = untimed). */
  eventTimer: number | null
  huntTimeFactor: number
  incidentFactor: number
  eventDraw: number
  surpriseEvents: number
  /** No right/wrong marking during play — revealed at handover. */
  deferFeedback: boolean
  /** Number of prohibition notices that shuts the project down (null = never). */
  shutdownAfterProhibitions: number | null
  budgetFactor: number
}

// Clocks are sized for a group reading a card aloud and agreeing an answer, not for one fast
// reader: an incident card runs to about 130-200 words. The access setting in state/settings.ts
// can double every clock or remove it.
export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  learner: {
    id: 'learner',
    label: 'Learning',
    role: 'Assistant Site Manager',
    icon: '🟢',
    tagline: 'Feedback after every answer, no time limit on decisions, three adviser calls.',
    rules: [
      'Feedback and a learning note after every decision',
      'No time limit on decisions; the hazard walk-round is timed, with extra time',
      'Fewer incidents and a larger contingency budget',
      'HSE can serve notices but will not shut the project down',
    ],
    pointsMultiplier: 1,
    lifelines: 3,
    decisionTimer: null,
    eventTimer: null,
    huntTimeFactor: 2.5,
    incidentFactor: 0.6,
    eventDraw: 2,
    surpriseEvents: 0,
    deferFeedback: false,
    shutdownAfterProhibitions: null,
    budgetFactor: 1.25,
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    role: 'Site Manager',
    icon: '🟠',
    tagline: 'Incident events are timed, one unplanned event arrives during the works, and risky choices can cause incidents later.',
    rules: [
      'Feedback after every decision',
      'Incident events must be answered within 90 seconds',
      'One unplanned incident arrives during the works',
      'Three critical failures bring an HSE inspection',
      'Two HSE prohibition notices and the project is shut down',
    ],
    pointsMultiplier: 1.25,
    lifelines: 2,
    decisionTimer: null,
    eventTimer: 90,
    huntTimeFactor: 1.5,
    incidentFactor: 1,
    eventDraw: 3,
    surpriseEvents: 1,
    deferFeedback: false,
    shutdownAfterProhibitions: 2,
    budgetFactor: 1,
  },
  expert: {
    id: 'expert',
    label: 'Expert',
    role: 'Contracts Manager',
    icon: '🔴',
    tagline: 'Answers are not marked until handover. Every decision is timed. Risks stay hidden until you audit.',
    rules: [
      'No right or wrong feedback during play: the results show on site and at handover',
      'Every decision is timed (2 minutes); incident events 75 seconds',
      'More incidents, a tighter budget and one adviser call',
      'Risks are hidden: commission site audits to find them',
      'Three critical failures, or very high enforcement risk, bring an HSE prohibition notice',
      'One HSE prohibition notice and the project is shut down',
    ],
    pointsMultiplier: 1.6,
    lifelines: 1,
    decisionTimer: 120,
    eventTimer: 75,
    huntTimeFactor: 1,
    incidentFactor: 1.4,
    eventDraw: 4,
    surpriseEvents: 2,
    deferFeedback: true,
    shutdownAfterProhibitions: 1,
    budgetFactor: 0.8,
  },
}

export const DIFFICULTY_ORDER: Difficulty[] = ['learner', 'standard', 'expert']

// ---------- Deterministic randomness ----------

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const rngFor = (seed: number, salt: string) => mulberry32((seed ^ hashString(salt)) >>> 0)

export function shuffleWith<T>(items: T[], rand: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Options in a stable per-run random order (removes the "it's always A" cue). */
export function shuffledOptions(step: DecisionStep, seed: number): DecisionOption[] {
  return shuffleWith(step.options, rngFor(seed, `opts:${step.id}`))
}

/** The two options removed by the "Call the H&S Adviser" lifeline. */
export function lifelineRemovals(step: DecisionStep, seed: number): string[] {
  const wrong = step.options.filter((o) => o.quality !== 'best')
  // Remove the worst first so the one left standing is the most plausible distractor.
  const rank: Record<OptionQuality, number> = { unsafe: 0, poor: 1, partial: 2, best: 3 }
  const ordered = shuffleWith(wrong, rngFor(seed, `life:${step.id}`)).sort((a, b) => rank[a.quality] - rank[b.quality])
  return ordered.slice(0, Math.max(0, Math.min(2, wrong.length - 1))).map((o) => o.id)
}

// ---------- Step rules shared by the screens, the reducer and the simulator ----------

/** True for a tutor quiz question: scored like a decision, never treated as a site incident. */
export function isCustomStep(step: { id: string; custom?: boolean }): boolean {
  return !!step.custom || step.id.startsWith('custom-')
}

/** A tutor question can only be asked if it has at least two answers and exactly marks one as correct. */
export function isAskable(q: CustomQuestion): boolean {
  const filled = q.options.filter((o) => o.text.trim().length > 0)
  return q.prompt.trim().length > 0 && filled.length >= 2 && filled.some((o) => o.correct)
}

/** Convert a tutor-authored question into a decision step. */
export function customToDecision(q: CustomQuestion): DecisionStep {
  return {
    type: 'decision',
    id: `custom-${q.id}`,
    custom: true,
    prompt: q.prompt,
    options: q.options
      .filter((o) => o.text.trim().length > 0)
      .map((o, i) => ({
        id: `o${i}`,
        text: o.text,
        quality: o.correct ? 'best' as const : 'poor' as const,
        impact: o.correct ? { safety: 5, legal: 5 } : {},
        feedback: o.correct ? 'Correct.' : 'Not the best answer. See the tutor\'s explanation.',
      })),
    topic: 'Tutor question',
    learningNote: q.explanation,
  }
}

/** Incident events are handled in the phase 12 "Incident / Challenge Events" phase. */
export const EVENT_PHASE = 12

/**
 * The steps played in the current phase, in order: the authored steps, any unplanned event
 * injected into this phase, then (in the incident phase) the drawn events and the tutor's own
 * questions. `extra` is the number of steps beyond the authored ones (what ADVANCE needs).
 */
export function phaseSteps(
  scenario: Scenario,
  state: Pick<GameState, 'phaseIndex' | 'drawnEventIds'> & { game: Pick<GameMeta, 'surpriseEvents'> },
  customQuestions: CustomQuestion[] = [],
): { steps: Step[]; extra: number } {
  const phase = scenario.phases[state.phaseIndex]
  if (!phase) return { steps: [], extra: 0 }
  const find = (id: string) => scenario.eventPool.find((e) => e.id === id)
  const surprise = state.game.surpriseEvents
    .filter((s) => s.phaseNumber === phase.number)
    .map((s) => find(s.eventId))
    .filter((e): e is DecisionStep => !!e)
  const extra: Step[] = phase.number === EVENT_PHASE
    ? [
        ...surprise,
        ...state.drawnEventIds.map(find).filter((e): e is DecisionStep => !!e),
        ...customQuestions.filter(isAskable).map(customToDecision),
      ]
    : surprise
  return { steps: [...phase.steps, ...extra], extra: extra.length }
}

/** Seconds allowed for a decision at this difficulty (null = no clock), before the access setting is applied. */
export function decisionTimeLimit(step: DecisionStep, difficulty: Difficulty): number | null {
  const d = DIFFICULTIES[difficulty]
  return step.isEvent && !isCustomStep(step) ? d.eventTimer : d.decisionTimer
}

/** Seconds allowed for the hazard walk-round at this difficulty, before the access setting is applied. */
export function huntTimeLimit(step: HazardHuntStep, difficulty: Difficulty): number {
  return Math.round(step.timeLimit * DIFFICULTIES[difficulty].huntTimeFactor)
}

/** The single definition of "no decision was made in time". */
export function timeoutOption(step: DecisionStep): DecisionOption {
  return {
    id: 'timeout',
    text: 'No decision made in time',
    quality: 'poor',
    impact: { incidentLikelihood: 5, enforcementRisk: 3 },
    feedback: 'Time ran out, so no decision was recorded. The situation carried on without anyone managing it.',
    consequence: `No decision was made on "${step.topic}" in time, so the issue was left as it stood. It was still unmanaged when it next came up on site.`,
    riddor: false,
  }
}

/**
 * The order the Sequence Planner starts from: a stable per-run shuffle that never already
 * satisfies every constraint (so "submit without moving anything" can never be a perfect plan).
 */
export function initialSequenceOrder(step: SequenceStep, seed: number): string[] {
  const ids = step.activities.map((a) => a.id)
  for (let n = 0; n < 20; n++) {
    const order = shuffleWith(ids, rngFor(seed, `seq:${step.id}:${n}`))
    if (!assessSequence(step, order).perfect) return order
  }
  const reversed = [...ids].reverse()
  return assessSequence(step, reversed).perfect ? ids : reversed
}

/** Rough size of a full run, for the "how long will this take?" line before a group starts. */
export function playEstimate(scenario: Scenario, difficulty: Difficulty): { decisions: number; tasks: number; siteWeeks: number; minutes: number } {
  const d = DIFFICULTIES[difficulty]
  const authored = scenario.phases.flatMap((p) => p.steps)
  const decisions = authored.filter((s) => s.type === 'decision').length
    + Math.min(scenario.eventPool.length, d.eventDraw + d.surpriseEvents)
  const tasks = authored.filter((s) => s.type !== 'decision' && s.type !== 'info').length
  const siteWeeks = WEEK_PHASES.length
  // A group reads a card aloud and agrees an answer in about two minutes; a task takes about five.
  const minutes = Math.round((decisions * 2 + tasks * 5 + siteWeeks * 1 + 10) / 5) * 5
  return { decisions, tasks, siteWeeks, minutes }
}

// ---------- Project economy ----------

const DEFAULT_VALUE = 1_400_000
const DEFAULT_WEEKS = 20

/** "£1.4m", "Approx. £3.2 million", "£950k", "£1,400,000" -> pounds. Never NaN: unreadable text gives the reference value. */
export function parseMoney(v: string): number {
  const text = String(v ?? '').replace(/,/g, '')
  // Prefer the figure that follows a pound sign; otherwise the first number in the text.
  const m = text.match(/£\s*(\d+(?:\.\d+)?)\s*(bn|billion|m|million|k|thousand)?\b/i)
    ?? text.match(/(\d+(?:\.\d+)?)\s*(bn|billion|m|million|k|thousand)?\b/i)
  if (!m) return DEFAULT_VALUE
  const n = parseFloat(m[1])
  const unit = (m[2] ?? '').toLowerCase()
  const value = unit === 'm' || unit === 'million' ? n * 1e6
    : unit === 'k' || unit === 'thousand' ? n * 1e3
      : unit === 'bn' || unit === 'billion' ? n * 1e9 : n
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_VALUE
}

/** "22 weeks", "40-week programme", "18 months", "1 year", "52 wks" -> weeks. Unreadable text gives 20. */
export function parseWeeks(d: string): number {
  const text = String(d ?? '')
  const weeks = text.match(/(\d+)[\s-]*(?:weeks?|wks?)\b/i)
  if (weeks) return Math.max(1, parseInt(weeks[1], 10))
  const months = text.match(/(\d+)[\s-]*months?\b/i)
  if (months) return Math.max(1, Math.round(parseInt(months[1], 10) * 4.33))
  const years = text.match(/(\d+)[\s-]*(?:years?|yrs?)\b/i)
  if (years) return Math.max(1, parseInt(years[1], 10) * 52)
  return DEFAULT_WEEKS
}

/** Money scale relative to the £1.4m reference project. */
export function scaleFor(scenario: Scenario): number {
  const k = parseMoney(scenario.brief.value) / 1_400_000
  return Math.min(3, Math.max(0.5, k))
}

const round100 = (n: number) => Math.round(n / 100) * 100
const roundHalf = (n: number) => Math.round(n * 2) / 2

export function economyFor(scenario: Scenario, difficulty: Difficulty) {
  const d = DIFFICULTIES[difficulty]
  const value = parseMoney(scenario.brief.value)
  const weeksTotal = parseWeeks(scenario.brief.duration)
  return {
    budgetStart: Math.round((value * 0.04 * d.budgetFactor) / 1000) * 1000,
    floatStart: Math.max(4, Math.round(weeksTotal * 0.45 * d.budgetFactor)),
    weeksTotal,
  }
}

export function fmtMoney(n: number): string {
  const sign = n < 0 ? '−' : ''
  const a = Math.abs(n)
  if (a >= 1e6) return `${sign}£${(a / 1e6).toFixed(2)}m`
  if (a >= 1000) return `${sign}£${(a / 1000).toFixed(1)}k`
  return `${sign}£${Math.round(a)}`
}

export function fmtDays(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  const a = Math.abs(n)
  return `${sign}${Number.isInteger(a) ? a : a.toFixed(1)} d`
}

/** Money and programme effect of a decision option (revealed after choosing). */
export function decisionEconomy(option: DecisionOption, scenario: Scenario): { cost: number; days: number } {
  const k = scaleFor(scenario)
  const cost = round100((option.impact.cost ?? 0) * 1000 * k)
  const days = Math.min(3, Math.max(-4, roundHalf((option.impact.programme ?? 0) * 0.5)))
  return { cost, days }
}

// ---------- Points ----------

const BASE_POINTS: Record<OptionQuality, number> = { best: 100, partial: 40, poor: -40, unsafe: -120 }
const CONFIDENCE_FACTOR: Record<Confidence, Record<OptionQuality, number>> = {
  sure: { best: 1.5, partial: 1, poor: 2, unsafe: 2 },
  think: { best: 1, partial: 1, poor: 1, unsafe: 1 },
  guess: { best: 0.6, partial: 0.8, poor: 0.5, unsafe: 0.5 },
}

export const CONFIDENCE_LABELS: Record<Confidence, { label: string; hint: string; key: string }> = {
  sure: { label: 'Certain', hint: '1.5 times the points if right; double the penalty if wrong', key: 'S' },
  think: { label: 'Fairly sure', hint: 'Standard points', key: 'F' },
  guess: { label: 'Unsure', hint: 'Safer: 0.6 times the points if right; half the penalty if wrong', key: 'G' },
}

export function decisionPoints(args: {
  quality: OptionQuality
  confidence: Confidence
  streak: number
  timeFrac: number | null
  lifeline: boolean
  timedOut: boolean
  multiplier: number
}): number {
  if (args.timedOut) return Math.round(-60 * args.multiplier)
  let pts = BASE_POINTS[args.quality] * CONFIDENCE_FACTOR[args.confidence][args.quality]
  if (args.quality === 'best') {
    pts += Math.min(Math.max(0, args.streak), 10) * 10
    // `timeFrac` is null on an untimed question (no clock, or the access setting): no bonus, no penalty.
    if (args.timeFrac !== null && Number.isFinite(args.timeFrac)) pts += Math.round(50 * Math.max(0, Math.min(1, args.timeFrac)))
  }
  // The adviser halves whatever the answer earns; a penalty is not softened.
  if (args.lifeline && pts > 0) pts *= 0.5
  return Math.round(pts * args.multiplier)
}

export function award(game: GameMeta, amount: number, label: string): GameMeta {
  return {
    ...game,
    points: game.points + amount,
    lastAward: { seq: (game.lastAward?.seq ?? 0) + 1, amount, label },
  }
}

// ---------- Latent hazards ----------

/**
 * True when a critical failure is a matter for HSE. Pollution, waste and discharge offences are
 * for the environmental regulator, and nuisance or highway matters for the local or highway
 * authority: they are still critical failures, but they are never strikes towards an HSE
 * inspection and never quoted in an HSE notice.
 */
export function isHseMatter(option: Pick<DecisionOption, 'regulator' | 'criticalFailure'>): boolean {
  if (option.regulator) return option.regulator === 'hse'
  return !/^\s*(environmental offence|environment agency|local authority|highway authority)/i.test(option.criticalFailure ?? '')
}

export function latentFromOption(step: DecisionStep, option: DecisionOption, phaseNumber: number): LatentHazard | null {
  if (option.quality !== 'poor' && option.quality !== 'unsafe') return null
  // A tutor quiz question tests knowledge; a wrong answer is not a shortcut taken on site.
  if (isCustomStep(step)) return null
  const timedOut = option.id === 'timeout'
  const consequence = option.consequence
    ?? `The shortcut on "${step.topic}" was never corrected and caught up with the project. ${option.feedback}`
  const best = step.options.find((o) => o.quality === 'best')
  const hazard: LatentHazard = {
    id: `${step.id}:${option.id}`,
    stepId: step.id,
    phaseNumber,
    severity: option.quality === 'unsafe' ? 'major' : 'minor',
    topic: step.topic,
    choice: option.text,
    consequence,
    status: 'open',
    revealed: false,
    source: timedOut ? 'timeout' : 'decision',
  }
  if (typeof option.riddor === 'boolean') hazard.riddor = option.riddor
  if (option.criticalFailure) hazard.critical = option.criticalFailure
  if (option.regulator && option.regulator !== 'hse') hazard.regulator = option.regulator
  if (best) hazard.remedy = best.text
  return hazard
}

/** Hazards created by a sequence plan that breaks critical hold points. */
export function latentFromSequence(step: SequenceStep, order: string[], phaseNumber: number): LatentHazard[] {
  const label = (id: string) => step.activities.find((x) => x.id === id)?.label ?? id
  return assessSequence(step, order).criticalViolated.map((c, i) => {
    const hazard: LatentHazard = {
      id: `${step.id}:seq:${i}`,
      stepId: step.id,
      phaseNumber,
      severity: 'major',
      topic: step.topic,
      choice: `Planned "${label(c.after)}" before "${label(c.before)}"`,
      consequence: c.consequence ?? `"${label(c.after)}" went ahead before "${label(c.before)}" was done. ${c.reason}`,
      status: 'open',
      revealed: false,
      source: 'sequence',
      critical: sequenceFailureLabel(step, c),
      remedy: `Re-plan the work so that "${label(c.before)}" is complete before "${label(c.after)}" starts.`,
    }
    if (typeof c.riddor === 'boolean') hazard.riddor = c.riddor
    return hazard
  })
}

/** The critical-failure label recorded for a broken critical sequence constraint. */
export function sequenceFailureLabel(step: SequenceStep, c: { before: string; after: string }): string {
  const label = (id: string) => step.activities.find((x) => x.id === id)?.label ?? id
  return `Out-of-sequence work: "${label(c.after)}" planned before "${label(c.before)}"`
}

// The mini-games also leave risk on site. Each one creates at most a handful of hazards, so a
// careless form is felt in the site weeks without flooding the weekly review.
const MAX_LAYOUT_HAZARDS = 3
const MAX_FORM_HAZARDS = 2
const MAX_HUNT_HAZARDS = 3

const itemLabel = (itemId: string) => SITE_ITEM_MAP[itemId]?.label ?? itemId

/** Unsafe placements, and required items never provided, stay on site as risks. */
export function latentFromSiteSetup(
  step: SiteSetupStep,
  placements: PlacementRecord[],
  assessments: PlacementAssessment[],
  phaseNumber: number,
): LatentHazard[] {
  const out: LatentHazard[] = []
  const zoneName = (id: string) => step.zones.find((z) => z.id === id)?.label ?? id
  const unsafe = assessments
    .filter((a) => a.status === 'unsafe')
    .sort((a, b) => Number(!!step.rules.find((r) => r.itemId === b.itemId)?.required) - Number(!!step.rules.find((r) => r.itemId === a.itemId)?.required))
  for (const a of unsafe.slice(0, MAX_LAYOUT_HAZARDS)) {
    const rule = step.rules.find((r) => r.itemId === a.itemId)
    const placed = placements.find((p) => p.itemId === a.itemId)
    const zones = placed ? zoneAt(step, placed.x, placed.y).filter((z) => rule?.badZones.includes(z)) : []
    const where = zones.length ? zoneName(zones[0]) : 'an unsafe location'
    const good = rule?.goodZones.length ? rule.goodZones.map(zoneName).join(' or ') : null
    out.push({
      id: `${step.id}:unsafe:${a.itemId}`,
      stepId: step.id,
      phaseNumber,
      severity: 'major',
      topic: step.topic,
      choice: `Site layout: ${itemLabel(a.itemId)} set up in ${where}`,
      consequence: `The site was run as it was laid out, with the ${itemLabel(a.itemId).toLowerCase()} in ${where}, and it led to an incident. ${a.note}`,
      status: 'open',
      revealed: false,
      source: 'siteSetup',
      riddor: false,
      remedy: good ? `Move the ${itemLabel(a.itemId).toLowerCase()} to ${good}. ${a.note}` : a.note,
    })
  }
  const required = step.rules.filter((r) => r.required)
  const missing = assessments.filter((a) => a.status === 'missing')
  if (missing.length > 0) {
    const names = missing.map((a) => itemLabel(a.itemId))
    const list = names.length > 4 ? `${names.slice(0, 4).join(', ')} and ${names.length - 4} more` : names.join(', ')
    out.push({
      id: `${step.id}:missing`,
      stepId: step.id,
      phaseNumber,
      severity: missing.length * 3 > required.length ? 'major' : 'minor',
      topic: step.topic,
      choice: `Site layout: ${missing.length} required item(s) not provided (${list})`,
      consequence: `The site opened without ${list}. The gap was found the hard way, when it was needed and was not there. ${missing[0].note}`,
      status: 'open',
      revealed: false,
      source: 'siteSetup',
      riddor: false,
      remedy: `Provide the missing set-up: ${list}.`,
    })
  }
  return out
}

/** Temporary works left off the register have no design check and no permit to load. */
export function latentFromTwRegister(step: TwRegisterStep, answers: TwAnswerRecord[], phaseNumber: number): LatentHazard[] {
  return step.items
    .filter((item) => item.correct.register && answers.find((a) => a.itemId === item.id)?.register !== true)
    .slice(0, MAX_FORM_HAZARDS)
    .map((item) => ({
      id: `${step.id}:tw:${item.id}`,
      stepId: step.id,
      phaseNumber,
      severity: 'major' as const,
      topic: step.topic,
      choice: `Temporary works register: "${item.name}" left off the register`,
      consequence: `"${item.name}" was built and used without being on the temporary works register, so nobody checked its design or released it for use, and it failed in service. ${item.explanation}`,
      status: 'open' as const,
      revealed: false,
      source: 'twRegister' as const,
      remedy: `Add "${item.name}" to the temporary works register and have the Temporary Works Coordinator confirm the design, the check and the sign-off before it is used again.`,
    }))
}

/** A permit that was needed and never set up means the work goes ahead uncontrolled. */
export function latentFromPermits(step: PermitStep, selected: string[], phaseNumber: number): LatentHazard[] {
  return step.required
    .filter((id) => !selected.includes(id))
    .slice(0, MAX_FORM_HAZARDS)
    .map((id) => {
      const name = step.options.find((o) => o.id === id)?.name ?? id
      return {
        id: `${step.id}:permit:${id}`,
        stepId: step.id,
        phaseNumber,
        severity: 'major' as const,
        topic: step.topic,
        choice: `Permit systems: no "${name}" in place`,
        consequence: `Work that needed a "${name}" went ahead without one: nobody checked the precautions before it started, and it went wrong. ${step.explanation}`,
        status: 'open' as const,
        revealed: false,
        source: 'permits' as const,
        remedy: `Set up the "${name}" system and stop the affected work until a permit has been issued.`,
      }
    })
}

/** A hazard walked past on the walk-round is still there. */
export function latentFromHunt(step: HazardHuntStep, assessment: HuntAssessment, phaseNumber: number): LatentHazard[] {
  const rank = { high: 0, medium: 1, low: 2 } as const
  return [...assessment.missed]
    .sort((a, b) => rank[a.severity ?? 'low'] - rank[b.severity ?? 'low'])
    .slice(0, MAX_HUNT_HAZARDS)
    .map((o) => ({
      id: `${step.id}:missed:${o.id}`,
      stepId: step.id,
      phaseNumber,
      severity: o.severity === 'high' ? 'major' as const : 'minor' as const,
      topic: step.topic,
      choice: `Not picked up on the walk-round: ${o.text}`,
      consequence: `Nobody acted on something that was in plain view on the walk-round: ${o.text} ${o.explanation}`,
      status: 'open' as const,
      revealed: false,
      source: 'hazardHunt' as const,
      remedy: o.explanation,
    }))
}

export function rectifyCost(h: LatentHazard, scenario: Scenario): { cost: number; days: number } {
  const k = scaleFor(scenario)
  return h.severity === 'major' ? { cost: round100(4000 * k), days: 1 } : { cost: round100(1500 * k), days: 0.5 }
}

export function auditCost(scenario: Scenario): { cost: number; days: number } {
  return { cost: round100(2500 * scaleFor(scenario)), days: 0.5 }
}

/**
 * Phase numbers after which a "site week" passes. Phases 4-13 are the construction period; the
 * report after phase 14 is the last week before handover, when everything still open gets a final roll.
 */
export const WEEK_PHASES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
const FINAL_WEEK_PHASE = WEEK_PHASES[WEEK_PHASES.length - 1]

export function weekFor(afterPhase: number, weeksTotal: number): number {
  return Math.max(1, Math.min(weeksTotal, Math.round((weeksTotal * (afterPhase - 3)) / 11)))
}

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v))

// RIDDOR status is authored (DecisionOption.riddor / SequenceConstraint.riddor). The keyword check
// below is only the fallback for content that has no flag yet, and it is deliberately strict: it
// needs wording for an injury, a dangerous occurrence, a collapse or a strike of a live service,
// and it never fires on paperwork, waste, neighbour or nuisance wording.
const RIDDOR_NEVER_RX = /\bwaste\b|transfer station|duty of care|consignment|paperwork|\bneighbou?r|nuisance|\bcomplain|\bnoise\b|\bdust\b|mud on the road|environment agency|environmental health|\bcouncil\b|pollut|\bdischarg/i
const RIDDOR_NO_HARM_RX = /\b(nobody|no[- ]one|none of (them|the \w+)) (was|were) (hurt|injured|harmed|hit|struck)|\bno injur|without injury|\buninjured\b|\bunhurt\b|not reportable|\bnear miss\b/i
const RIDDOR_INJURY_RX = /\binjur(y|ies|ed)\b|\bfractur|\bbroke (his|her|their)\b|\bbroken (arm|leg|hip|wrist|ankle|pelvis|collarbone|ribs?|back|bones?)\b|\bhospital|\bamputat|\bunconscious\b|\belectric shock\b|\belectrocut|\bkilled\b|\bfatal|\bdied\b/i
const RIDDOR_OCCURRENCE_RX = /dangerous occurrence|\bcollaps|\b(struck|hit|gouged|ruptured|severed|cut through)\b[^.]{0,60}\b(live|buried|gas|electric(ity)?|high[- ]voltage|cables?|mains?|services?)\b|\b(gas|cable|service) strike\b/i

/** Fallback only: does this narrative clearly describe something reportable under RIDDOR? */
export function riddorFromNarrative(text: string): boolean {
  if (RIDDOR_NEVER_RX.test(text)) return false
  if (RIDDOR_OCCURRENCE_RX.test(text)) return true
  if (RIDDOR_NO_HARM_RX.test(text)) return false
  return RIDDOR_INJURY_RX.test(text)
}

/** Is the incident this hazard causes RIDDOR reportable? The authored flag wins; otherwise the strict fallback (major incidents only). */
export function hazardIsRiddor(h: Pick<LatentHazard, 'riddor' | 'severity' | 'consequence'>): boolean {
  if (typeof h.riddor === 'boolean') return h.riddor
  return h.severity === 'major' && riddorFromNarrative(h.consequence)
}

const sentence = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

function noticeReason(state: GameState, kind: NoticeRecord['kind'], firedThisWeek: ConsequenceRecord[]): string {
  const g = state.game
  // Cite what is new since the last notice. Leave out anything HSE does not enforce, anything the
  // group has since closed out, and anything that has already caused its incident (the incident is cited).
  const settled = new Set(g.latent.filter((h) => h.critical && h.status !== 'open').map((h) => h.critical))
  const nonHse = new Set(g.nonHseFailures ?? [])
  const fresh = state.criticalFailures.slice(g.noticeMark ?? 0).filter((f) => !settled.has(f) && !nonHse.has(f))
  const serious = firedThisWeek.filter((c) => c.severity === 'major')
  const reportable = firedThisWeek.filter((c) => c.riddor).length
  const incidents = serious.length === 0 ? []
    : [`${serious.length === 1 ? 'a serious incident' : `${serious.length} serious incidents`} on site this week${reportable ? ` (${reportable === serious.length && serious.length === 1 ? 'RIDDOR reportable' : `${reportable} RIDDOR reportable`})` : ''}`]
  const openMajor = g.latent
    .filter((h) => h.status === 'open' && h.severity === 'major' && !h.regulator)
    .map((h) => `no effective control in place for: ${h.topic}`)
  const pieces = [...new Set([...fresh.slice(-3), ...incidents, ...openMajor])].slice(0, 3).map(sentence)
  const lead = kind === 'prohibition'
    ? 'The inspector judged that there was a risk of serious personal injury and stopped the affected work.'
    : 'The inspector found breaches of health and safety law that must be put right by a set date.'
  return pieces.length
    ? `${lead} Findings: ${pieces.join('; ')}.`
    : `${lead} Findings: the standard of control seen across the site, and its recent record, did not give the inspector confidence that risks were being managed.`
}

/**
 * Simulate one site week after a construction phase: open latent hazards may fire,
 * HSE may inspect, and the week is either safe or not. Deterministic per seed + phase.
 */
export function simulateWeek(
  state: GameState,
  scenario: Scenario,
  afterPhase: number,
): { game: GameMeta; meters: Record<MeterKey, number>; report: WeekReport } {
  const diff = DIFFICULTIES[state.game.difficulty]
  const rand = rngFor(state.game.seed, `week:${afterPhase}`)
  const k = scaleFor(scenario)
  const mult = diff.pointsMultiplier
  const meters = { ...state.scores.meters }
  let game: GameMeta = { ...state.game, latent: state.game.latent.map((h) => ({ ...h })) }
  const week = weekFor(afterPhase, game.weeksTotal)
  const final = afterPhase >= FINAL_WEEK_PHASE

  // 1. Latent hazards roll. A hazard cannot fire in the phase that created it, except in the last
  //    week before handover, when everything still open is in play.
  const exposure = 0.6 + (meters.incidentLikelihood / 100) * 0.8
  const candidates = game.latent
    .filter((h) => h.status === 'open' && (h.phaseNumber < afterPhase || (final && h.phaseNumber <= afterPhase)))
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'major' ? -1 : 1))
  const fired: ConsequenceRecord[] = []
  for (const h of candidates) {
    if (fired.length >= 2) break
    const base = h.severity === 'major' ? 0.2 : 0.1
    if (rand() < base * diff.incidentFactor * exposure) {
      h.status = 'fired'
      const major = h.severity === 'major'
      const riddor = hazardIsRiddor(h)
      const rec: ConsequenceRecord = {
        hazardId: h.id,
        week,
        severity: h.severity,
        title: major
          ? (riddor ? 'Serious incident: RIDDOR reportable' : 'Serious incident')
          : (riddor ? 'Site incident: RIDDOR reportable' : 'Site problem'),
        narrative: h.consequence,
        rootCause: h.source && h.source !== 'decision' && h.source !== 'timeout' && h.source !== 'sequence'
          ? `Phase ${h.phaseNumber}, ${h.topic}. ${h.choice}`
          : `Phase ${h.phaseNumber}, ${h.topic}. You chose: "${h.choice}"`,
        cost: round100((major ? 15000 : 4000) * k),
        days: major ? 4 : 1.5,
        riddor,
        points: Math.round((major ? -400 : -150) * mult),
      }
      fired.push(rec)
      if (major) {
        meters.enforcementRisk = clamp(meters.enforcementRisk + 12)
        meters.morale = clamp(meters.morale - 8)
        meters.clientConfidence = clamp(meters.clientConfidence - 8)
        meters.incidentLikelihood = clamp(meters.incidentLikelihood + 4)
      } else {
        meters.enforcementRisk = clamp(meters.enforcementRisk + 3)
        meters.morale = clamp(meters.morale - 3)
        meters.clientConfidence = clamp(meters.clientConfidence - 3)
        meters.incidentLikelihood = clamp(meters.incidentLikelihood + 2)
      }
    }
  }

  // 2. HSE inspection. No notice in two consecutive site-week reports (the cool-down counts
  //    reports, not calendar weeks, so it works the same in every case study).
  let notice: NoticeRecord | null = null
  const last = game.notices.length ? game.notices[game.notices.length - 1] : null
  const reportIndex = WEEK_PHASES.indexOf(afterPhase) >= 0 ? WEEK_PHASES.indexOf(afterPhase) : afterPhase
  const lastIndex = last?.afterPhase !== undefined
    ? (WEEK_PHASES.indexOf(last.afterPhase) >= 0 ? WEEK_PHASES.indexOf(last.afterPhase) : last.afterPhase)
    : null
  const cooledDown = !last || (lastIndex !== null ? reportIndex - lastIndex > 1 : week - last.week > 1)
  const inspect = (meters.enforcementRisk >= 70 || game.strikes >= 3) && cooledDown
  if (inspect) {
    const prohibition = meters.enforcementRisk >= 88 || game.strikes >= 3
    const kind: NoticeRecord['kind'] = prohibition ? 'prohibition' : 'improvement'
    notice = {
      kind,
      week,
      afterPhase,
      reason: noticeReason({ ...state, game }, kind, fired),
      cost: round100((prohibition ? 12000 : 3000) * k),
      days: prohibition ? 6 : 2,
      points: Math.round((prohibition ? -700 : -250) * mult),
    }
    game.noticeMark = state.criticalFailures.length
    if (prohibition) {
      meters.enforcementRisk = 50
      game.strikes = 0
      game.strikeSteps = []
    } else {
      meters.enforcementRisk = clamp(meters.enforcementRisk - 20)
    }
    meters.clientConfidence = clamp(meters.clientConfidence - (prohibition ? 15 : 6))
  }

  // 3. Shutdown check.
  const prohibitions = game.notices.filter((n) => n.kind === 'prohibition').length + (notice?.kind === 'prohibition' ? 1 : 0)
  const shutdown = diff.shutdownAfterProhibitions !== null && prohibitions >= diff.shutdownAfterProhibitions

  // 4. Settle the week. A week with no incident and no notice is "safe", but it only earns the
  //    bonus when nothing the group knows about is still open: otherwise it was luck, not control.
  const safe = fired.length === 0 && !notice
  const known = game.latent.filter((h) => h.status === 'open' && (!diff.deferFeedback || h.revealed))
  const openRisks = {
    major: known.filter((h) => h.severity === 'major').length,
    minor: known.filter((h) => h.severity === 'minor').length,
  }
  const controlled = safe && known.length === 0
  const safePoints = controlled ? Math.round(40 * mult) : 0
  const points = fired.reduce((a, c) => a + c.points, 0) + (notice?.points ?? 0) + safePoints
  const cost = fired.reduce((a, c) => a + c.cost, 0) + (notice?.cost ?? 0)
  const days = fired.reduce((a, c) => a + c.days, 0) + (notice?.days ?? 0)

  // Early warning, so that a prohibition notice (a shutdown on Expert) never arrives unannounced.
  let warning: string | undefined
  if (!notice && !shutdown) {
    const closes = diff.shutdownAfterProhibitions === 1 ? ' At this level one prohibition notice shuts the project down.' : ''
    if (game.strikes === 2) {
      warning = `Two critical failures are on record. A third brings an HSE inspection and a prohibition notice.${closes}`
    } else if (meters.enforcementRisk >= 60) {
      warning = `Enforcement risk is high. HSE is likely to visit soon unless the site is brought back under control.${closes}`
    }
  }

  game = {
    ...game,
    week,
    budget: game.budget - cost,
    floatDays: game.floatDays - days,
    safeWeeks: safe ? game.safeWeeks + 1 : game.safeWeeks,
    consequences: [...game.consequences, ...fired],
    notices: notice ? [...game.notices, notice] : game.notices,
    shutdown,
  }
  if (points !== 0) game = award(game, points, controlled ? 'Safe week' : 'Site week')
  const report: WeekReport = { week, afterPhase, consequences: fired, notice, shutdown, safe, points, openRisks, controlled }
  if (warning) report.warning = warning
  if (final) report.final = true
  return { game: { ...game, pendingWeek: report }, meters, report }
}

// ---------- Completion ----------

export function completionBonuses(state: GameState): BonusLine[] {
  const g = state.game
  const mult = DIFFICULTIES[g.difficulty].pointsMultiplier
  const m = (n: number) => Math.round(n * mult)
  if (g.shutdown) return [{ label: 'Project shut down by HSE prohibition', points: m(-1500) }]
  const lines: BonusLine[] = []
  // Money and days "saved" by shortcuts never earn more than finishing with the starting allowance:
  // the bonus rewards protecting the contingency and the float, not cutting corners to grow them.
  const budgetKept = Math.min(g.budget, g.budgetStart)
  const floatKept = Math.min(g.floatDays, Math.max(g.floatStart, 0))
  if (g.budget >= 0) lines.push({ label: `Delivered within budget (${fmtMoney(g.budget)} contingency left)`, points: m(400 + Math.round((300 * budgetKept) / Math.max(1, g.budgetStart))) })
  else lines.push({ label: `Over budget by ${fmtMoney(-g.budget)}`, points: m(-200) })
  if (g.floatDays >= 0) lines.push({ label: `Handed over on programme (${fmtDays(g.floatDays)} float left)`, points: m(400 + Math.round(25 * floatKept)) })
  else lines.push({ label: `Handed over ${Math.abs(g.floatDays)} days late`, points: m(-200) })
  if (!g.consequences.some((c) => c.riddor)) lines.push({ label: 'No RIDDOR-reportable incidents', points: m(500) })
  if (g.notices.length === 0) lines.push({ label: 'No HSE enforcement notices', points: m(300) })
  if (state.criticalFailures.length === 0) lines.push({ label: 'No critical failures', points: m(400) })
  const open = g.latent.filter((h) => h.status === 'open').length
  if (open > 0) lines.push({ label: `${open} uncorrected risk(s) handed over to the client`, points: m(-50 * open) })
  return lines
}

export interface OutcomeSummary {
  points: number
  onBudget: boolean
  onProgramme: boolean
  incidents: number
  majorIncidents: number
  riddor: number
  notices: number
  prohibitions: number
  openRisks: number
  rectified: number
  calibration: Record<Confidence, { n: number; best: number }>
  confidentlyWrong: number
}

export function outcomeSummary(state: GameState): OutcomeSummary {
  const g = state.game
  const calibration: OutcomeSummary['calibration'] = {
    sure: { n: 0, best: 0 }, think: { n: 0, best: 0 }, guess: { n: 0, best: 0 },
  }
  for (const c of g.confidence) {
    calibration[c.confidence].n++
    if (c.quality === 'best') calibration[c.confidence].best++
  }
  return {
    points: g.points,
    onBudget: g.budget >= 0,
    onProgramme: g.floatDays >= 0,
    incidents: g.consequences.length,
    majorIncidents: g.consequences.filter((c) => c.severity === 'major').length,
    riddor: g.consequences.filter((c) => c.riddor).length,
    notices: g.notices.length,
    prohibitions: g.notices.filter((n) => n.kind === 'prohibition').length,
    openRisks: g.latent.filter((h) => h.status === 'open').length,
    rectified: g.latent.filter((h) => h.status === 'rectified').length,
    calibration,
    confidentlyWrong: g.confidence.filter((c) => c.confidence === 'sure' && (c.quality === 'poor' || c.quality === 'unsafe')).length,
  }
}

// ---------- Ranks ----------

export interface Rank { min: number; title: string; icon: string }

export const RANKS: Rank[] = [
  { min: 0, title: 'Site Operative', icon: '👷' },
  { min: 1500, title: 'Supervisor', icon: '🦺' },
  { min: 5000, title: 'Assistant Site Manager', icon: '📋' },
  { min: 10000, title: 'Site Manager', icon: '🏗️' },
  { min: 18000, title: 'Senior Site Manager', icon: '🧭' },
  { min: 28000, title: 'Project Manager', icon: '📐' },
  { min: 40000, title: 'Contracts Manager', icon: '🏢' },
  { min: 55000, title: 'Construction Director', icon: '👑' },
]

export function rankFor(xp: number): { rank: Rank; next: Rank | null; progress: number } {
  let idx = 0
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) idx = i
  const rank = RANKS[idx]
  const next = RANKS[idx + 1] ?? null
  const progress = next ? (xp - rank.min) / (next.min - rank.min) : 1
  return { rank, next, progress: Math.max(0, Math.min(1, progress)) }
}
