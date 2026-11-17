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

export function latentFromOption(step: DecisionStep, option: DecisionOption, phaseNumber: number): LatentHazard | null {
  if (option.quality !== 'poor' && option.quality !== 'unsafe') return null
  const consequence = option.consequence
    ?? `The shortcut on "${step.topic}" was never corrected and caught up with the project. ${option.feedback}`
  return {
    id: `${step.id}:${option.id}`,
    stepId: step.id,
    phaseNumber,
    severity: option.quality === 'unsafe' ? 'major' : 'minor',
    topic: step.topic,
    choice: option.text,
    consequence,
    status: 'open',
    revealed: false,
  }
}

export function rectifyCost(h: LatentHazard, scenario: Scenario): { cost: number; days: number } {
  const k = scaleFor(scenario)
  return h.severity === 'major' ? { cost: round100(4000 * k), days: 1 } : { cost: round100(1500 * k), days: 0.5 }
}

export function auditCost(scenario: Scenario): { cost: number; days: number } {
  return { cost: round100(2500 * scaleFor(scenario)), days: 0.5 }
}

/** Phase numbers after which a "site week" passes (construction period). */
export const WEEK_PHASES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

export function weekFor(afterPhase: number, weeksTotal: number): number {
  return Math.max(1, Math.min(weeksTotal, Math.round((weeksTotal * (afterPhase - 3)) / 11)))
}

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v))
const RIDDOR_RX = /riddor|injur|fractur|hospital|dangerous occurrence|collaps|fell |fall |struck|crush|burn|amputat|unconscious|electric shock/i

function noticeReason(state: GameState, kind: NoticeRecord['kind'], firedThisWeek: ConsequenceRecord[]): string {
  // Cite what is new since the last notice, not the same findings every visit.
  const fresh = state.criticalFailures.slice(state.game.noticeMark ?? 0)
  const incidents = firedThisWeek.filter((c) => c.severity === 'major').map((c) => c.title.toLowerCase())
  const openMajor = state.game.latent.filter((h) => h.status === 'open' && h.severity === 'major').map((h) => `uncontrolled risk: ${h.topic}`)
  const pieces = [...new Set([...fresh.slice(-3), ...incidents, ...openMajor])].slice(0, 3)
  const lead = kind === 'prohibition'
    ? 'Inspector judged there was a risk of serious personal injury and stopped the affected work.'
    : 'Inspector found material breaches that must be put right by a deadline.'
  return pieces.length ? `${lead} Findings: ${pieces.join('; ')}.` : `${lead} Findings: the site's own safety indicators (enforcement history, incident rate) prompted the visit.`
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

  // 1. Latent hazards roll.
  const exposure = 0.6 + (meters.incidentLikelihood / 100) * 0.8
  const candidates = game.latent
    .filter((h) => h.status === 'open' && h.phaseNumber < afterPhase)
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'major' ? -1 : 1))
  const fired: ConsequenceRecord[] = []
  for (const h of candidates) {
    if (fired.length >= 2) break
    const base = h.severity === 'major' ? 0.2 : 0.1
    if (rand() < base * diff.incidentFactor * exposure) {
      h.status = 'fired'
      const major = h.severity === 'major'
      const riddor = major && RIDDOR_RX.test(h.consequence)
      const rec: ConsequenceRecord = {
        hazardId: h.id,
        week,
        severity: h.severity,
        title: major ? (riddor ? 'Serious incident: RIDDOR reportable' : 'Serious incident') : 'Site problem',
        narrative: h.consequence,
        rootCause: `Phase ${h.phaseNumber}, ${h.topic}. You chose: "${h.choice}"`,
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

  // 2. HSE inspection.
  let notice: NoticeRecord | null = null
  const lastNoticeWeek = game.notices.length ? game.notices[game.notices.length - 1].week : -99
  const inspect = (meters.enforcementRisk >= 70 || game.strikes >= 3) && week - lastNoticeWeek > 1
  if (inspect) {
    const prohibition = meters.enforcementRisk >= 88 || game.strikes >= 3
    const kind: NoticeRecord['kind'] = prohibition ? 'prohibition' : 'improvement'
    notice = {
      kind,
      week,
      reason: noticeReason({ ...state, game }, kind, fired),
      cost: round100((prohibition ? 12000 : 3000) * k),
      days: prohibition ? 6 : 2,
      points: Math.round((prohibition ? -700 : -250) * mult),
    }
    game.noticeMark = state.criticalFailures.length
    if (prohibition) {
      meters.enforcementRisk = 50
      game.strikes = 0
    } else {
      meters.enforcementRisk = clamp(meters.enforcementRisk - 20)
    }
    meters.clientConfidence = clamp(meters.clientConfidence - (prohibition ? 15 : 6))
  }

  // 3. Shutdown check.
  const prohibitions = game.notices.filter((n) => n.kind === 'prohibition').length + (notice?.kind === 'prohibition' ? 1 : 0)
  const shutdown = diff.shutdownAfterProhibitions !== null && prohibitions >= diff.shutdownAfterProhibitions

  // 4. Settle the week.
  const safe = fired.length === 0 && !notice
  const safePoints = safe ? Math.round(40 * mult) : 0
  const points = fired.reduce((a, c) => a + c.points, 0) + (notice?.points ?? 0) + safePoints
  const cost = fired.reduce((a, c) => a + c.cost, 0) + (notice?.cost ?? 0)
  const days = fired.reduce((a, c) => a + c.days, 0) + (notice?.days ?? 0)
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
  if (points !== 0) game = award(game, points, safe ? 'Safe week' : 'Site week')
  const report: WeekReport = { week, afterPhase, consequences: fired, notice, shutdown, safe, points }
  return { game: { ...game, pendingWeek: report }, meters, report }
}

// ---------- Completion ----------

export function completionBonuses(state: GameState): BonusLine[] {
  const g = state.game
  const mult = DIFFICULTIES[g.difficulty].pointsMultiplier
  const m = (n: number) => Math.round(n * mult)
  if (g.shutdown) return [{ label: 'Project shut down by HSE prohibition', points: m(-1500) }]
  const lines: BonusLine[] = []
  if (g.budget >= 0) lines.push({ label: `Delivered within budget (${fmtMoney(g.budget)} contingency left)`, points: m(400 + Math.round((300 * g.budget) / Math.max(1, g.budgetStart))) })
  else lines.push({ label: `Over budget by ${fmtMoney(-g.budget)}`, points: m(-200) })
  if (g.floatDays >= 0) lines.push({ label: `Handed over on programme (${fmtDays(g.floatDays)} float left)`, points: m(400 + Math.round(25 * g.floatDays)) })
  else lines.push({ label: `Handed over ${Math.abs(g.floatDays)} days late`, points: m(-200) })
  if (!g.consequences.some((c) => c.riddor)) lines.push({ label: 'No RIDDOR-reportable incidents', points: m(500) })
  if (g.notices.length === 0) lines.push({ label: 'No HSE enforcement notices', points: m(300) })
  if (state.criticalFailures.length === 0) lines.push({ label: 'No critical safety failures', points: m(400) })
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
