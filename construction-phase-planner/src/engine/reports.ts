import type {
  GameState, Scenario, ScoreKey, SiteSetupStep, TwRegisterStep, PermitStep, DecisionStep,
} from '../types'
import { SCORE_KEYS, SCORE_LABELS } from '../types'
import {
  assessPlacements, categoryScore, gradeFor, overallScore, twItemScore, TW_FIELD_KEYS,
  type PlacementAssessment,
} from './scoring'
import { SITE_ITEM_MAP } from '../data/siteItems'

export interface MissedItemsReport {
  criticalFailures: string[]
  missedLegalDuties: string[]
  missedTwItems: string[]
  missedInspections: string[]
  missedPermits: string[]
  environmentalFailures: string[]
  programmeConsequences: string[]
  unsafePlacements: string[]
  missingPlacements: string[]
  revisionTopics: string[]
}

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

export function buildMissedItems(state: GameState, scenario: Scenario): MissedItemsReport {
  const report: MissedItemsReport = {
    criticalFailures: [...state.criticalFailures],
    missedLegalDuties: [],
    missedTwItems: [],
    missedInspections: [],
    missedPermits: [],
    environmentalFailures: [],
    programmeConsequences: [],
    unsafePlacements: [],
    missingPlacements: [],
    revisionTopics: [],
  }
  const decisionMap = new Map(allDecisionSteps(scenario).map((d) => [d.id, d]))
  const topics = new Set<string>()

  for (const rec of state.decisions) {
    if (rec.quality === 'best') continue
    const step = decisionMap.get(rec.stepId)
    const topic = step?.topic ?? rec.topic
    topics.add(topic)
    const t = topic.toLowerCase()
    if (rec.quality === 'unsafe' || rec.quality === 'poor') {
      if (t.includes('cdm') || t.includes('legal') || t.includes('riddor') || t.includes('duty')) {
        report.missedLegalDuties.push(topic)
      }
      if (t.includes('environment') || t.includes('pollution') || t.includes('waste') || t.includes('spill') || t.includes('dust') || t.includes('noise')) {
        report.environmentalFailures.push(topic)
      }
      if (t.includes('inspection')) report.missedInspections.push(topic)
      if (t.includes('programme')) report.programmeConsequences.push(topic)
    }
  }

  // Temporary works misses
  const twSteps = findSteps<TwRegisterStep>(scenario, 'twRegister')
  for (const step of twSteps) {
    for (const item of step.items) {
      const ans = state.twAnswers.find((a) => a.itemId === item.id)
      const { wrongFields } = twItemScore(item, ans)
      if (wrongFields.includes('register')) report.missedTwItems.push(item.name)
      if (wrongFields.includes('inspection')) report.missedInspections.push(`${item.name} — pre-use inspection/permit`)
    }
  }

  // Permit misses
  const permitSteps = findSteps<PermitStep>(scenario, 'permits')
  for (const step of permitSteps) {
    const answer = state.permitAnswers.find((a) => a.stepId === step.id)
    for (const req of step.required) {
      if (!answer || !answer.selected.includes(req)) {
        const name = step.options.find((o) => o.id === req)?.name ?? req
        report.missedPermits.push(name)
      }
    }
  }

  // Site placement issues
  for (const a of placementAssessments(state, scenario)) {
    const label = SITE_ITEM_MAP[a.itemId]?.label ?? a.itemId
    if (a.status === 'unsafe') report.unsafePlacements.push(`${label} — ${a.note}`)
    if (a.status === 'missing') report.missingPlacements.push(`${label} — ${a.note}`)
  }

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
  delegateName: string
  scenarioTitle: string
  startedAt: string | null
  finishedAt: string | null
  categories: { key: ScoreKey; label: string; score: number | null }[]
  overall: number
  gradeLabel: string
  gradeSummary: string
  missed: MissedItemsReport
}

export function buildScoreReport(state: GameState, scenario: Scenario): ScoreReport {
  const categories = SCORE_KEYS.map((key) => ({
    key,
    label: SCORE_LABELS[key],
    score: categoryScore(state.scores, key),
  }))
  const overall = overallScore(state.scores)
  const grade = gradeFor(overall)
  return {
    delegateName: state.delegateName || 'Delegate',
    scenarioTitle: scenario.title,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    categories,
    overall,
    gradeLabel: grade.label,
    gradeSummary: grade.summary,
    missed: buildMissedItems(state, scenario),
  }
}

// ---------- CSV export ----------

function csvEscape(v: string | number | boolean | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [headers.map(csvEscape).join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\r\n')
}

export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
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
      const { wrongFields } = twItemScore(item, ans)
      rows.push([
        item.name,
        ans?.register === undefined ? '—' : ans.register ? 'Yes' : 'No',
        ans?.design ?? '—',
        ans?.catCheck ?? '—',
        ans?.rams === undefined ? '—' : ans.rams ? 'Yes' : 'No',
        ans?.inspection === undefined ? '—' : ans.inspection ? 'Yes' : 'No',
        ans?.holdPoint === undefined ? '—' : ans.holdPoint ? 'Yes' : 'No',
        ans?.responsible ?? '—',
        wrongFields.length === 0 ? 'Correct' : `Review: ${wrongFields.join('; ')}`,
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
  for (const rec of state.decisions.filter((d) => d.topic.toLowerCase().includes('inspection'))) {
    rows.push([rec.topic, 'Yes', rec.quality === 'best' ? 'Yes' : 'Partial/No', rec.quality === 'best' ? 'OK' : 'REVIEW'])
  }
  return toCsv(['Inspection item', 'Required', 'Planned by delegate', 'Status'], rows)
}

export function decisionsCsv(state: GameState): string {
  const rows = state.decisions.map((d) => [
    String(d.phaseNumber),
    d.wasEvent ? 'Event' : 'Decision',
    d.prompt,
    d.topic,
    d.quality,
  ])
  return toCsv(['Phase', 'Type', 'Prompt', 'Topic', 'Outcome quality'], rows)
}

export function environmentalChecklistCsv(state: GameState, scenario: Scenario): string {
  const envDecisions = state.decisions.filter((d) => {
    const t = d.topic.toLowerCase()
    return t.includes('environment') || t.includes('waste') || t.includes('dust') || t.includes('noise')
      || t.includes('spill') || t.includes('pollution') || t.includes('water') || t.includes('fuel')
  })
  const rows = envDecisions.map((d) => [d.topic, d.prompt, d.quality === 'best' ? 'Controlled' : d.quality === 'partial' ? 'Partially controlled' : 'NOT controlled'])
  return toCsv(['Environmental topic', 'Situation', 'Status'], rows)
}
