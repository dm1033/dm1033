import type {
  DecisionRecord, Difficulty, GameState, Scenario, ScoreKey, SiteSetupStep, TwRegisterStep, PermitStep, DecisionStep,
  HazardHuntStep, SequenceStep,
} from '../types'
import { GRADE_BANDS, SCORE_KEYS, SCORE_LABELS } from '../types'
import {
  assessHunt, assessPermits, assessPlacements, assessSequence, categoryScore, gradeFor, overallScore, twItemScore,
  type PlacementAssessment,
} from './scoring'
import { DIFFICULTIES } from './game'
import { SITE_ITEM_MAP } from '../data/siteItems'

export interface MissedItemsReport {
  criticalFailures: string[]
  missedLegalDuties: string[]
  missedTwItems: string[]
  /** Items the delegate added to the temporary works register that are not temporary works. */
  overRegisteredTwItems: string[]
  missedInspections: string[]
  missedPermits: string[]
  /** Permits raised that the work did not need (paperwork padding). */
  unnecessaryPermits: string[]
  environmentalFailures: string[]
  programmeConsequences: string[]
  unsafePlacements: string[]
  missingPlacements: string[]
  missedHazards: string[]
  sequenceErrors: string[]
  revisionTopics: string[]
}

// ---------- Who played ----------

/** Name shown on reports, exports and the leaderboard: the team name when a group is playing. */
export function displayName(state: Pick<GameState, 'delegateName' | 'team'>): string {
  return state.team?.name?.trim() || state.delegateName?.trim() || 'Delegate'
}

// ---------- Overall grade and its caps ----------

/** An HSE shutdown puts the run in the bottom band whatever the marks. */
export const SHUTDOWN_GRADE_CAP = 39
/**
 * A run with a critical safety failure cannot grade above "Good", and a run with a prohibition
 * notice or a RIDDOR-reportable incident cannot grade "Excellent": both stop one point short of
 * the top band.
 */
export const SERIOUS_FAILURE_GRADE_CAP = GRADE_BANDS[0].min - 1

export interface GradeCap {
  /** The highest overall score this run can be given. */
  cap: number
  /** Label of the highest band the run can reach, for example "Good". */
  bandLabel: string
  /** Plain-English cause, written to follow "because": "2 critical safety failures and 1 HSE prohibition notice". */
  reason: string
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const joinList = (parts: string[]) =>
  parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`

/** How many of each serious outcome the run recorded (all zero for a save with no game layer). */
export function seriousOutcomes(state: GameState): {
  criticalFailures: number; riddor: number; prohibitions: number; notices: number; shutdown: boolean
} {
  const g = state.game
  return {
    criticalFailures: state.criticalFailures?.length ?? 0,
    riddor: g?.consequences?.filter((c) => c.riddor).length ?? 0,
    prohibitions: g?.notices?.filter((n) => n.kind === 'prohibition').length ?? 0,
    notices: g?.notices?.length ?? 0,
    shutdown: !!g?.shutdown,
  }
}

/**
 * The ceiling on this run's overall grade, or null when nothing limits it.
 * The cap applies whether or not the marks reach it: use `finalOverall` for the capped score and
 * `buildScoreReport(...).capReason` for the sentence to print when the cap actually bit.
 */
export function gradeCap(state: GameState): GradeCap | null {
  const o = seriousOutcomes(state)
  if (o.shutdown) {
    return {
      cap: SHUTDOWN_GRADE_CAP,
      bandLabel: gradeFor(SHUTDOWN_GRADE_CAP).label,
      reason: 'the project was shut down by an HSE prohibition notice',
    }
  }
  const parts: string[] = []
  if (o.criticalFailures > 0) parts.push(plural(o.criticalFailures, 'critical safety failure', 'critical safety failures'))
  if (o.prohibitions > 0) parts.push(plural(o.prohibitions, 'HSE prohibition notice', 'HSE prohibition notices'))
  if (o.riddor > 0) parts.push(plural(o.riddor, 'RIDDOR-reportable incident', 'RIDDOR-reportable incidents'))
  if (parts.length === 0) return null
  return {
    cap: SERIOUS_FAILURE_GRADE_CAP,
    bandLabel: gradeFor(SERIOUS_FAILURE_GRADE_CAP).label,
    reason: `the run recorded ${joinList(parts)}`,
  }
}

/** Overall competence score before any cap. */
export function rawOverall(state: GameState): number {
  return overallScore(state.scores)
}

/**
 * Overall competence score with the grade caps applied: an HSE shutdown caps it at 39; any
 * critical safety failure, prohibition notice or RIDDOR-reportable incident caps it at 89
 * (the top of "Good"). A cap never raises a score.
 */
export function finalOverall(state: GameState): number {
  const overall = rawOverall(state)
  const cap = gradeCap(state)
  return cap ? Math.min(overall, cap.cap) : overall
}

/** Sentence for reports when the cap lowered the grade; null when it made no difference. */
export function gradeCapNote(state: GameState): string | null {
  const cap = gradeCap(state)
  const raw = rawOverall(state)
  if (!cap || raw <= cap.cap) return null
  return `Grade capped at ${cap.cap} (${cap.bandLabel}) because ${cap.reason}. The answers alone scored ${raw}/100.`
}

// ---------- Step lookups ----------

export function findSteps<T extends { type: string }>(scenario: Scenario, type: T['type']): T[] {
  const out: T[] = []
  for (const phase of scenario.phases) {
    for (const step of phase.steps) {
      if (step.type === type) out.push(step as unknown as T)
    }
  }
  return out
}

export function allDecisionSteps(scenario: Scenario): DecisionStep[] {
  return [...findSteps<DecisionStep>(scenario, 'decision'), ...scenario.eventPool]
}

export function placementAssessments(state: GameState, scenario: Scenario): PlacementAssessment[] {
  const setups = findSteps<SiteSetupStep>(scenario, 'siteSetup')
  return setups.flatMap((s) => assessPlacements(s, state.placements))
}

// ---------- What a decision was about ----------
//
// The report buckets follow what the model answer is marked for, not the wording of the topic
// label. The label is only a fallback: for legal and programme wording that is unambiguous, and
// for questions the scenario does not contain (tutor questions, saves from older content).

const LEGAL_TOPIC = /\b(cdm|legal|riddor|dut(y|ies)|statutory|nrswa|licen[sc]|notif|enforcement|regulator)/i
const ENVIRONMENT_TOPIC = /environment|pollution|waste|spill|dust|noise|vibration|nuisance|fuel|washout|silt|dewater|ecolog|wildlife|surface water|groundwater|watercourse/i
const INSPECTION_TOPIC = /inspect|thorough examination/i
const PROGRAMME_TOPIC = /programme/i

const bestOf = (step: DecisionStep | undefined) => step?.options.find((o) => o.quality === 'best')

/** True when `key` carries the highest (or equal-highest) marks in the model answer. */
function leadsModelAnswer(step: DecisionStep | undefined, key: ScoreKey): boolean {
  const best = bestOf(step)
  const mark = best?.impact[key] ?? 0
  return mark > 0 && SCORE_KEYS.every((k) => (best?.impact[k] ?? 0) <= mark)
}

/** A decision about a legal duty: legal marks lead the model answer, or the topic says so. */
export function isLegalDecision(topic: string, step?: DecisionStep): boolean {
  return leadsModelAnswer(step, 'legal') || LEGAL_TOPIC.test(topic)
}

/**
 * A decision about environmental control. When the scenario step is known this follows the marks:
 * the model answer earns Environmental Control marks, or an option loses them. Without the step
 * (tutor questions) it falls back to the topic wording.
 */
export function isEnvironmentalDecision(topic: string, step?: DecisionStep): boolean {
  if (!step) return ENVIRONMENT_TOPIC.test(topic)
  return (bestOf(step)?.impact.environment ?? 0) > 0 || step.options.some((o) => (o.impact.environment ?? 0) < 0)
}

export const isInspectionTopic = (topic: string): boolean => INSPECTION_TOPIC.test(topic)

export function isProgrammeDecision(topic: string, step?: DecisionStep): boolean {
  return leadsModelAnswer(step, 'programme') || PROGRAMME_TOPIC.test(topic)
}

// ---------- Missed items ----------

export function buildMissedItems(state: GameState, scenario: Scenario): MissedItemsReport {
  const report: MissedItemsReport = {
    criticalFailures: [...state.criticalFailures],
    missedLegalDuties: [],
    missedTwItems: [],
    overRegisteredTwItems: [],
    missedInspections: [],
    missedPermits: [],
    unnecessaryPermits: [],
    environmentalFailures: [],
    programmeConsequences: [],
    unsafePlacements: [],
    missingPlacements: [],
    missedHazards: [],
    sequenceErrors: [],
    revisionTopics: [],
  }
  const decisionMap = new Map(allDecisionSteps(scenario).map((d) => [d.id, d]))
  const topics = new Set<string>()
  const add = (list: string[], item: string) => { if (!list.includes(item)) list.push(item) }

  for (const rec of state.decisions) {
    if (rec.quality === 'best') continue
    const step = decisionMap.get(rec.stepId)
    const topic = step?.topic ?? rec.topic
    topics.add(topic)
    if (rec.quality !== 'unsafe' && rec.quality !== 'poor') continue
    const chosen = step?.options.find((o) => o.id === rec.chosenOptionId)
    if (isLegalDecision(topic, step) || (chosen?.impact.legal ?? 0) < 0) add(report.missedLegalDuties, topic)
    if (isEnvironmentalDecision(topic, step) || (chosen?.impact.environment ?? 0) < 0) add(report.environmentalFailures, topic)
    if (isInspectionTopic(topic)) add(report.missedInspections, topic)
    if (isProgrammeDecision(topic, step)) add(report.programmeConsequences, topic)
  }

  // Temporary works: a genuine item left off the register is "missed"; something that is not
  // temporary works but was put on the register is the opposite mistake and is listed separately.
  const twSteps = findSteps<TwRegisterStep>(scenario, 'twRegister')
  for (const step of twSteps) {
    for (const item of step.items) {
      const ans = state.twAnswers.find((a) => a.itemId === item.id)
      const { wrongFields } = twItemScore(item, ans)
      if (wrongFields.includes('register')) {
        if (item.correct.register) report.missedTwItems.push(item.name)
        else report.overRegisteredTwItems.push(`${item.name} — added to the register, but it is not temporary works`)
      }
      if (wrongFields.includes('inspection') && item.correct.inspection) {
        report.missedInspections.push(`${item.name} — pre-use inspection/permit`)
      }
    }
  }

  // Permits: required ones not raised, and ones raised that the work did not need.
  const permitSteps = findSteps<PermitStep>(scenario, 'permits')
  for (const step of permitSteps) {
    const answer = state.permitAnswers.find((a) => a.stepId === step.id)
    const a = assessPermits(step, answer?.selected ?? [])
    for (const p of a.missed) report.missedPermits.push(p.name)
    for (const p of a.unnecessary) report.unnecessaryPermits.push(p.name)
  }

  // Site placement issues
  for (const a of placementAssessments(state, scenario)) {
    const label = SITE_ITEM_MAP[a.itemId]?.label ?? a.itemId
    if (a.status === 'unsafe') report.unsafePlacements.push(`${label} — ${a.note}`)
    if (a.status === 'missing') report.missingPlacements.push(`${label} — ${a.note}`)
  }

  // Hazard hunt misses
  for (const step of findSteps<HazardHuntStep>(scenario, 'hazardHunt')) {
    const ans = state.huntAnswers.find((a) => a.stepId === step.id)
    if (!ans) continue
    const a = assessHunt(step, ans.flagged)
    for (const o of a.missed) report.missedHazards.push(`${o.text} (${o.severity ?? 'hazard'})`)
    if (a.missed.length || a.falseFlags.length) topics.add(step.topic)
  }

  // Sequencing errors
  for (const step of findSteps<SequenceStep>(scenario, 'sequence')) {
    const ans = state.sequenceAnswers.find((a) => a.stepId === step.id)
    if (!ans) continue
    const a = assessSequence(step, ans.order)
    const label = (id: string) => step.activities.find((x) => x.id === id)?.label ?? id
    for (const c of a.violated) {
      report.sequenceErrors.push(`${c.critical ? 'CRITICAL: ' : ''}"${label(c.before)}" must precede "${label(c.after)}". ${c.reason}`)
    }
    if (a.violated.length) topics.add(step.topic)
  }

  // Project outcome
  if (state.game?.shutdown) report.programmeConsequences.push('Project shut down by an HSE prohibition notice.')
  if (state.game && state.game.floatDays < 0) report.programmeConsequences.push(`Handed over ${Math.abs(state.game.floatDays)} working days late.`)
  if (state.game && state.game.budget < 0) report.programmeConsequences.push('Contingency budget exhausted: incidents, notices and rework cost more than the allowance.')

  if (state.scores.meters.cost > 70) {
    report.programmeConsequences.push('High cost pressure — decisions added avoidable cost or delay.')
  }
  if (state.scores.meters.clientConfidence < 40) {
    report.programmeConsequences.push('Low client confidence — communication and delivery planning need attention.')
  }

  report.revisionTopics = [...topics].sort()
  return report
}

export interface ScoreReport {
  /** Name to print: the team name when a group played, otherwise the delegate's name. */
  delegateName: string
  /** Team name, or null for a solo delegate. */
  teamName: string | null
  /** First names of the team (empty for a solo delegate). */
  teamMembers: string[]
  scenarioTitle: string
  difficulty: Difficulty | null
  difficultyLabel: string
  startedAt: string | null
  finishedAt: string | null
  categories: { key: ScoreKey; label: string; score: number | null }[]
  /** Overall competence score after any grade cap. */
  overall: number
  /** Overall competence score from the answers alone, before any cap. */
  rawOverall: number
  /** The ceiling that applied to this run, or null (see gradeCap). */
  cap: number | null
  /** Sentence to print under the grade when the cap lowered it; null when it made no difference. */
  capReason: string | null
  gradeLabel: string
  gradeSummary: string
  /** Counts for the outcome line and the completion record. */
  outcome: ReturnType<typeof seriousOutcomes>
  missed: MissedItemsReport
}

export function buildScoreReport(state: GameState, scenario: Scenario): ScoreReport {
  const categories = SCORE_KEYS.map((key) => ({
    key,
    label: SCORE_LABELS[key],
    score: categoryScore(state.scores, key),
  }))
  const overall = finalOverall(state)
  const grade = gradeFor(overall)
  const difficulty = state.game?.difficulty ?? null
  return {
    delegateName: displayName(state),
    teamName: state.team?.name?.trim() || null,
    teamMembers: state.team?.members ?? [],
    scenarioTitle: scenario.title,
    difficulty,
    difficultyLabel: difficulty ? DIFFICULTIES[difficulty]?.label ?? '' : '',
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    categories,
    overall,
    rawOverall: rawOverall(state),
    cap: gradeCap(state)?.cap ?? null,
    capReason: gradeCapNote(state),
    gradeLabel: grade.label,
    gradeSummary: grade.summary,
    outcome: seriousOutcomes(state),
    missed: buildMissedItems(state, scenario),
  }
}

// ---------- CSV export ----------

type Cell = string | number | boolean | null | undefined

/**
 * One CSV cell. Text that a spreadsheet would run as a formula (it starts with = + - @, or with
 * a tab or carriage return, possibly after spaces) is prefixed with an apostrophe so it is shown
 * as text. Real numbers are left alone, so a points cell of -96 stays numeric.
 */
function csvEscape(v: Cell): string {
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : ''
  let s = v === null || v === undefined ? '' : String(v)
  if (/^[\t\r]|^\s*[=+\-@]/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(headers: string[], rows: Cell[][]): string {
  return [headers.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\r\n')
}

/** File name that tells exports from different groups apart: who, which scenario, when, what. */
export function exportName(state: GameState, scenario: Scenario | null, kind: string, ext = 'csv'): string {
  const slug = (text: string) => text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  const who = slug(displayName(state)) || 'delegate'
  const date = (state.finishedAt ?? state.startedAt ?? new Date().toISOString()).slice(0, 10)
  return [who, scenario ? slug(scenario.id) : '', date, slug(kind) || 'export'].filter(Boolean).join('_') + `.${ext}`
}

export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8'): void {
  // Excel reads a CSV without a byte-order mark as Windows-1252 and turns "—" and "£" into mojibake.
  const body = /csv/i.test(mime) && !text.startsWith('﻿') ? `﻿${text}` : text
  const blob = new Blob([body], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking straight away cancels the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function permitTrackerCsv(state: GameState, scenario: Scenario): string {
  const rows: (string | boolean)[][] = []
  for (const step of findSteps<PermitStep>(scenario, 'permits')) {
    const answer = state.permitAnswers.find((a) => a.stepId === step.id)
    for (const opt of step.options) {
      const required = step.required.includes(opt.id)
      const selected = !!answer?.selected.includes(opt.id)
      rows.push([
        opt.name,
        required ? 'Yes' : 'No',
        selected ? 'Yes' : 'No',
        required && !selected ? 'MISSED' : required && selected ? 'In place' : selected ? 'Raised (not essential)' : '—',
      ])
    }
  }
  return toCsv(['Permit', 'Required', 'Raised by delegate', 'Status'], rows)
}

export function twRegisterCsv(state: GameState, scenario: Scenario): string {
  const rows: string[][] = []
  for (const step of findSteps<TwRegisterStep>(scenario, 'twRegister')) {
    for (const item of step.items) {
      const ans = state.twAnswers.find((a) => a.itemId === item.id)
      const { wrongFields, cautiousFields } = twItemScore(item, ans)
      const review = wrongFields.map((f) => (cautiousFields.includes(f) ? `${f} (more rigorous than needed: safe, but it costs time and money)` : f))
      rows.push([
        item.name,
        ans?.register === undefined ? '—' : ans.register ? 'Yes' : 'No',
        ans?.design ?? '—',
        ans?.catCheck ?? '—',
        ans?.rams === undefined ? '—' : ans.rams ? 'Yes' : 'No',
        ans?.inspection === undefined ? '—' : ans.inspection ? 'Yes' : 'No',
        ans?.holdPoint === undefined ? '—' : ans.holdPoint ? 'Yes' : 'No',
        ans?.responsible ?? '—',
        review.length === 0 ? 'Correct' : `Review: ${review.join('; ')}`,
      ])
    }
  }
  return toCsv(
    ['Item', 'On register', 'Design', 'Check category', 'RAMS', 'Inspection/Permit', 'Hold point', 'Responsible', 'Assessment'],
    rows,
  )
}

export function inspectionTrackerCsv(state: GameState, scenario: Scenario): string {
  const rows: string[][] = []
  for (const step of findSteps<TwRegisterStep>(scenario, 'twRegister')) {
    for (const item of step.items) {
      const ans = state.twAnswers.find((a) => a.itemId === item.id)
      rows.push([
        item.name,
        item.correct.inspection ? 'Yes' : 'No',
        ans?.inspection === undefined ? '—' : ans.inspection ? 'Yes' : 'No',
        item.correct.inspection && !ans?.inspection ? 'MISSED' : 'OK',
      ])
    }
  }
  for (const rec of state.decisions.filter((d) => isInspectionTopic(d.topic))) {
    rows.push([rec.topic, 'Yes', rec.quality === 'best' ? 'Yes' : 'Partial/No', rec.quality === 'best' ? 'OK' : 'REVIEW'])
  }
  return toCsv(['Inspection item', 'Required', 'Planned by delegate', 'Status'], rows)
}

export const DECISION_LOG_HEADERS = [
  'Delegate or team', 'Scenario', 'Difficulty', 'Phase', 'Type', 'Prompt', 'Topic', 'Chosen answer', 'Model answer',
  'Outcome quality', 'Confidence', 'Lifeline used', 'Points',
]

/** Text a decision record may carry when the step is not part of the scenario (tutor questions). */
type DecisionRecordText = DecisionRecord & { chosenText?: string; bestText?: string }

/**
 * Decision log. Every row names the delegate or team, the scenario and the difficulty, so logs
 * collected from several devices can be merged and still told apart, and gives the answer chosen
 * next to the model answer. Pass the scenario to fill in the answer wording.
 */
export function decisionsCsv(state: GameState, scenario?: Scenario | null): string {
  const steps = new Map((scenario ? allDecisionSteps(scenario) : []).map((d) => [d.id, d]))
  const who = displayName(state)
  const difficulty = state.game?.difficulty ? DIFFICULTIES[state.game.difficulty]?.label ?? '' : ''
  const rows = state.decisions.map((rec): Cell[] => {
    const d: DecisionRecordText = rec
    const step = steps.get(d.stepId)
    const chosen = d.timedOut
      ? 'No decision made in time'
      : step?.options.find((o) => o.id === d.chosenOptionId)?.text ?? d.chosenText ?? ''
    return [
      who,
      scenario?.title ?? state.scenarioId ?? '',
      difficulty,
      d.phaseNumber,
      d.wasEvent ? 'Event' : 'Decision',
      d.prompt,
      d.topic,
      chosen,
      bestOf(step)?.text ?? d.bestText ?? '',
      d.timedOut ? 'timed out' : d.quality,
      // A timed-out question was never given a confidence: the clock answered it.
      d.timedOut ? '' : d.confidence ?? '',
      d.usedLifeline ? 'Yes' : 'No',
      d.points ?? '',
    ]
  })
  return toCsv(DECISION_LOG_HEADERS, rows)
}

/** Decisions that belong on the environmental checklist (shared by the CSV and the on-screen view). */
export function environmentalDecisions(state: GameState, scenario: Scenario): DecisionRecord[] {
  const steps = new Map(allDecisionSteps(scenario).map((d) => [d.id, d]))
  return state.decisions.filter((d) => isEnvironmentalDecision(d.topic, steps.get(d.stepId)))
}

export function environmentalChecklistCsv(state: GameState, scenario: Scenario): string {
  const rows = environmentalDecisions(state, scenario).map((d) => [
    d.topic,
    d.prompt,
    d.quality === 'best' ? 'Controlled' : d.quality === 'partial' ? 'Partially controlled' : 'NOT controlled',
  ])
  return toCsv(['Environmental topic', 'Situation', 'Status'], rows)
}
