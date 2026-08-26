import { useMemo, useState } from 'react'
import { useGame } from '../state/GameContext'
import {
  buildScoreReport, decisionsCsv, downloadText, environmentalChecklistCsv, findSteps,
  inspectionTrackerCsv, permitTrackerCsv, placementAssessments, twRegisterCsv,
} from '../engine/reports'
import { CPP_SECTIONS, DISCLAIMER, TW_FIELDS, type PermitStep, type SiteSetupStep, type TwRegisterStep } from '../types'
import { SITE_ITEM_MAP } from '../data/siteItems'
import { twItemScore } from '../engine/scoring'
import { computeObjectiveCoverage } from '../engine/objectives'
import { toCsv } from '../engine/reports'
import {
  classifyRun, computeWeightedResult, CLASSIFICATION_LABELS, CLASSIFICATION_ORDER,
} from '../engine/assessment'

type Tab =
  | 'score' | 'cpp' | 'risk' | 'tw' | 'permits' | 'inspections'
  | 'environment' | 'incidents' | 'missed' | 'model' | 'objectives' | 'tutor-sheet' | 'certificate'

const TABS: { id: Tab; label: string }[] = [
  { id: 'score', label: '1 · Score Report' },
  { id: 'cpp', label: '2 · Construction Phase Plan' },
  { id: 'risk', label: '3 · Risk Assessment Summary' },
  { id: 'tw', label: '4 · Temporary Works Register' },
  { id: 'permits', label: '5 · Permit Tracker' },
  { id: 'inspections', label: '6 · Inspection Tracker' },
  { id: 'environment', label: '7 · Environmental Checklist' },
  { id: 'incidents', label: '8 · Incident Response Log' },
  { id: 'missed', label: '9 · Missed Items Report' },
  { id: 'model', label: '10 · Model Answer Overlay' },
  { id: 'objectives', label: '11 · Learning Objectives' },
  { id: 'tutor-sheet', label: '12 · Tutor Review Sheet' },
  { id: 'certificate', label: '13 · Certificate' },
]

export default function ReportScreen({ onRestart }: { onRestart: () => void }) {
  const { state, scenario, dispatch } = useGame()
  const [tab, setTab] = useState<Tab>('score')

  const report = useMemo(
    () => (scenario ? buildScoreReport(state, scenario) : null),
    [state, scenario],
  )

  if (!scenario || !report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 mb-4">No completed game found.</p>
        <button onClick={onRestart} className="rounded-lg bg-amber-500 text-slate-950 font-bold px-6 py-2.5">
          Start a scenario
        </button>
      </div>
    )
  }

  const csvActions: Partial<Record<Tab, () => void>> = {
    objectives: () => {
      const rows = computeObjectiveCoverage(state, scenario).map((c) => [
        c.objective.code, c.objective.title,
        String(c.stepIds.length), String(c.encountered),
        c.performance === null ? '—' : String(c.performance),
        c.status.toUpperCase(),
      ])
      downloadText('learning-objectives.csv', toCsv(['Code', 'Learning outcome', 'Mapped steps', 'Encountered', 'Performance', 'Status'], rows))
    },
    tw: () => downloadText('temporary-works-register.csv', twRegisterCsv(state, scenario)),
    permits: () => downloadText('permit-tracker.csv', permitTrackerCsv(state, scenario)),
    inspections: () => downloadText('inspection-tracker.csv', inspectionTrackerCsv(state, scenario)),
    environment: () => downloadText('environmental-checklist.csv', environmentalChecklistCsv(state, scenario)),
    score: () => downloadText('decision-log.csv', decisionsCsv(state)),
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="no-print flex flex-wrap items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold mr-auto">End of Game Reports</h2>
        {csvActions[tab] && (
          <button onClick={csvActions[tab]} className="rounded-md border border-slate-600 hover:border-amber-500 px-3 py-1.5 text-sm">
            ⬇ Download CSV
          </button>
        )}
        <button onClick={() => window.print()} className="rounded-md border border-slate-600 hover:border-amber-500 px-3 py-1.5 text-sm">
          🖨 Print / Save as PDF
        </button>
        <button
          onClick={() => { dispatch({ type: 'RESET' }); onRestart() }}
          className="rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 text-sm"
        >
          ↻ New Scenario
        </button>
      </div>

      <div className="no-print flex flex-wrap gap-1 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-2.5 py-1.5 text-xs ${tab === t.id ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="print-area space-y-4">
        <div className="hidden print:block text-sm mb-4">
          <h1 className="text-xl font-bold">Construction Phase Planner — SMSTS Safety Challenge</h1>
          <p>{report.delegateName} · {report.scenarioTitle} · {report.finishedAt ? new Date(report.finishedAt).toLocaleDateString() : ''}</p>
        </div>

        {tab === 'score' && <ScoreReportView report={report} />}
        {tab === 'cpp' && <CppView />}
        {tab === 'risk' && <RiskView />}
        {tab === 'tw' && <TwView />}
        {tab === 'permits' && <PermitsView />}
        {tab === 'inspections' && <InspectionsView />}
        {tab === 'environment' && <EnvironmentView />}
        {tab === 'incidents' && <IncidentsView />}
        {tab === 'missed' && <MissedView report={report} />}
        {tab === 'model' && <ModelAnswerView />}
        {tab === 'objectives' && <ObjectivesView />}
        {tab === 'tutor-sheet' && <TutorSheetView report={report} />}
        {tab === 'certificate' && <CertificateView report={report} />}
      </div>
    </div>
  )
}

// ---------- Individual report views ----------

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      {title && <h3 className="text-lg font-bold mb-3">{title}</h3>}
      {children}
    </div>
  )
}

function ScoreReportView({ report }: { report: ReturnType<typeof buildScoreReport> }) {
  const { state, scenario } = useGame()
  if (!scenario) return null
  const weighted = computeWeightedResult(state, scenario)
  const classified = classifyRun(state, scenario)
  const distribution = CLASSIFICATION_ORDER.map((c) => ({
    c,
    n: classified.filter((d) => d.classification === c).length,
  }))
  const outcomeColor = weighted.gated
    ? 'text-red-400'
    : weighted.overall >= 70 ? 'text-emerald-400' : weighted.overall >= 50 ? 'text-amber-400' : 'text-red-400'
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start gap-6">
          <div className="min-w-[220px]">
            <div className="text-5xl font-extrabold tabular-nums">{weighted.overall}<span className="text-xl text-slate-500">/100</span></div>
            <div className={`text-xl font-bold ${outcomeColor}`}>{weighted.outcome}</div>
            {weighted.gated && (
              <div className="mt-2 rounded-md border border-red-800 bg-red-950/40 p-2 text-xs text-red-300">
                ⚠ The numeric score does not override safety: this run contains{' '}
                {weighted.criticalFailures.length} unresolved critical failure(s), so a competent
                result cannot be awarded. Numeric band for reference: {weighted.bandLabel}.
              </div>
            )}
            <div className="mt-3 text-xs text-slate-500">
              Weighted competency model — see below. Mode: <b className="text-slate-300">{state.mode}</b>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
              {state.runId && <div>Audit ID: <b className="text-slate-400 font-mono">{state.runId}</b></div>}
              {state.startedAt && (
                <div>Started: {new Date(state.startedAt).toLocaleString()}</div>
              )}
              {state.finishedAt && (
                <div>Completed: {new Date(state.finishedAt).toLocaleString()}</div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-[280px] space-y-2">
            {weighted.areas.map((a) => (
              <div key={a.area.id}>
                <div className="flex justify-between text-xs">
                  <span>{a.area.label} <span className="text-slate-600">({a.area.weight}%)</span></span>
                  <span className="tabular-nums">{a.score ?? '—'}/100</span>
                </div>
                <div className="h-2 rounded bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${a.score === null ? 'bg-slate-700' : a.score >= 75 ? 'rag-green' : a.score >= 45 ? 'rag-amber' : 'rag-red'}`}
                    style={{ width: `${a.score ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-400">
          <b>Performance levels:</b> 90–100 Outstanding · 80–89 Strong · 70–79 Competent ·
          60–69 Developing competence · 50–59 Significant improvement required ·
          Below 50 Insufficient evidence of competence. An unresolved critical failure prevents a
          competent result regardless of score. Scoring rules: docs/SCORING-MODEL.md.
        </div>
      </Card>
      <Card title="Decision classification profile">
        <div className="flex flex-wrap gap-2 mb-3">
          {distribution.map(({ c, n }) => (
            <span
              key={c}
              className={`rounded-full px-3 py-1 text-xs font-bold border ${
                n === 0 ? 'border-slate-800 text-slate-600'
                : c === 'excellent' ? 'border-emerald-700 text-emerald-400'
                : c === 'good' ? 'border-emerald-800 text-emerald-500'
                : c === 'acceptable' ? 'border-amber-700 text-amber-400'
                : c === 'weak' ? 'border-orange-800 text-orange-400'
                : c === 'poor' ? 'border-orange-700 text-orange-500'
                : c === 'unsafe' ? 'border-red-700 text-red-400'
                : 'border-red-600 text-red-300 bg-red-950/40'
              }`}
            >
              {CLASSIFICATION_LABELS[c]}: {n}
            </span>
          ))}
        </div>
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="py-1.5 pr-2">Ph.</th><th className="py-1.5 pr-2">Decision</th><th className="py-1.5">Classification</th>
              </tr>
            </thead>
            <tbody>
              {classified.map((d) => (
                <tr key={d.stepId} className="border-b border-slate-800/50 align-top">
                  <td className="py-1.5 pr-2">{d.phaseNumber}</td>
                  <td className="py-1.5 pr-2 text-slate-400">{d.prompt.replace(/^EVENT:\s*/, '')}</td>
                  <td className={`py-1.5 font-bold whitespace-nowrap ${
                    d.classification === 'excellent' || d.classification === 'good' ? 'text-emerald-400'
                    : d.classification === 'acceptable' ? 'text-amber-400'
                    : d.classification === 'weak' || d.classification === 'poor' ? 'text-orange-400'
                    : 'text-red-400'
                  }`}>
                    {CLASSIFICATION_LABELS[d.classification]}
                    {d.recoveryQuality && (
                      <span className={`block text-[10px] font-semibold ${
                        d.recoveryQuality === 'best' || d.recoveryQuality === 'partial'
                          ? 'text-emerald-500'
                          : 'text-red-400'
                      }`}>
                        recovery: {d.recoveryQuality === 'best' ? 'sound' : d.recoveryQuality === 'partial' ? 'partial' : 'failed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Discipline detail (legacy category view)">
        <div className="space-y-2">
          {report.categories.map((c) => (
            <div key={c.key}>
              <div className="flex justify-between text-xs"><span>{c.label}</span><span className="tabular-nums">{c.score ?? '—'}/100</span></div>
              <div className="h-2 rounded bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${c.score === null ? 'bg-slate-700' : c.score >= 75 ? 'rag-green' : c.score >= 45 ? 'rag-amber' : 'rag-red'}`}
                  style={{ width: `${c.score ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
      {report.missed.criticalFailures.length > 0 && (
        <Card title="⚠ Critical safety failures">
          <ul className="list-disc pl-5 text-sm text-red-300 space-y-1">
            {report.missed.criticalFailures.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </Card>
      )}
      <Card title="Recommended revision topics">
        {report.missed.revisionTopics.length === 0
          ? <p className="text-sm text-emerald-400">None — every decision matched the model answer. Outstanding.</p>
          : <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">{report.missed.revisionTopics.map((t) => <li key={t}>{t}</li>)}</ul>}
      </Card>
      <p className="text-[11px] text-slate-500">{DISCLAIMER}</p>
    </>
  )
}

function CppView() {
  const { state, scenario } = useGame()
  if (!scenario) return null
  return (
    <Card title="Construction Phase Plan (built from your decisions)">
      <div className="space-y-4 text-sm">
        {CPP_SECTIONS.map((s) => {
          const entries = s.id === 'projectDescription'
            ? [scenario.cppProjectDescription, ...(state.cpp[s.id] ?? [])]
            : state.cpp[s.id] ?? []
          return (
            <div key={s.id}>
              <h4 className="font-bold text-amber-400">{s.title}</h4>
              {entries.length === 0
                ? <p className="text-red-400 text-xs mt-1">⚠ Section not developed during play — this is a gap in your plan.</p>
                : entries.map((e, i) => <p key={i} className="text-slate-300 mt-1">{e}</p>)}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function RiskView() {
  const { state } = useGame()
  return (
    <Card title="Risk Assessment Summary">
      {state.riskRegister.length === 0 ? (
        <p className="text-sm text-slate-400">No risk register entries were generated.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
              <th className="py-2 pr-3">Hazard</th><th className="py-2 pr-3">Control implemented</th><th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {state.riskRegister.map((r, i) => (
              <tr key={i} className="border-b border-slate-800/50 align-top">
                <td className="py-2 pr-3">{r.hazard}</td>
                <td className="py-2 pr-3 text-slate-400">{r.control}</td>
                <td className={`py-2 font-bold text-xs ${r.adequate ? 'text-emerald-400' : 'text-red-400'}`}>
                  {r.adequate ? 'ADEQUATE' : 'REVIEW'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-slate-500 mt-3">
        Decision outcomes on risk-related topics also appear in the Missed Items report.
      </p>
    </Card>
  )
}

function TwView() {
  const { state, scenario } = useGame()
  if (!scenario) return null
  const items = findSteps<TwRegisterStep>(scenario, 'twRegister').flatMap((s) => s.items)
  return (
    <Card title="Temporary Works Register (your answers vs required controls)">
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-800">
              <th className="py-2 pr-2">Item</th>
              {TW_FIELDS.map((f) => <th key={f.key} className="py-2 pr-2">{f.label.replace('?', '')}</th>)}
              <th className="py-2 pr-2">Responsible</th>
              <th className="py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const ans = state.twAnswers.find((a) => a.itemId === item.id)
              const { wrongFields } = twItemScore(item, ans)
              return (
                <tr key={item.id} className="border-b border-slate-800/50 align-top">
                  <td className="py-2 pr-2 font-semibold">{item.name}</td>
                  {TW_FIELDS.map((f) => {
                    const given = ans?.[f.key]
                    const wrong = wrongFields.includes(f.key)
                    return (
                      <td key={f.key} className={`py-2 pr-2 ${wrong ? 'text-red-400' : 'text-slate-300'}`}>
                        {given === undefined ? '—' : String(given)}
                        {wrong && <span className="block text-[9px] text-emerald-400">req: {String(item.correct[f.key as keyof typeof item.correct])}</span>}
                      </td>
                    )
                  })}
                  <td className={`py-2 pr-2 ${wrongFields.includes('responsible') ? 'text-red-400' : 'text-slate-300'}`}>
                    {ans?.responsible ?? '—'}
                    {wrongFields.includes('responsible') && <span className="block text-[9px] text-emerald-400">req: {item.correct.responsible}</span>}
                  </td>
                  <td className={`py-2 font-bold ${wrongFields.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {14 - wrongFields.length * 2}/14
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function PermitsView() {
  const { state, scenario } = useGame()
  if (!scenario) return null
  const steps = findSteps<PermitStep>(scenario, 'permits')
  return (
    <Card title="Permit Tracker">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
            <th className="py-2 pr-3">Permit</th><th className="py-2 pr-3">Required</th><th className="py-2 pr-3">Raised</th><th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {steps.flatMap((step) => {
            const ans = state.permitAnswers.find((a) => a.stepId === step.id)
            return step.options.map((o) => {
              const req = step.required.includes(o.id)
              const sel = !!ans?.selected.includes(o.id)
              return (
                <tr key={`${step.id}-${o.id}`} className="border-b border-slate-800/50">
                  <td className="py-2 pr-3">{o.name}</td>
                  <td className="py-2 pr-3">{req ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-3">{sel ? 'Yes' : 'No'}</td>
                  <td className={`py-2 font-bold text-xs ${req && !sel ? 'text-red-400' : req ? 'text-emerald-400' : sel ? 'text-amber-400' : 'text-slate-600'}`}>
                    {req && !sel ? 'MISSED' : req ? 'IN PLACE' : sel ? 'NOT ESSENTIAL' : '—'}
                  </td>
                </tr>
              )
            })
          })}
        </tbody>
      </table>
    </Card>
  )
}

function InspectionsView() {
  const { state, scenario } = useGame()
  if (!scenario) return null
  const twItems = findSteps<TwRegisterStep>(scenario, 'twRegister').flatMap((s) => s.items)
  const inspectionDecisions = state.decisions.filter((d) => d.topic.toLowerCase().includes('inspection'))
  return (
    <Card title="Inspection Tracker">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
            <th className="py-2 pr-3">Item</th><th className="py-2 pr-3">Inspection required</th><th className="py-2 pr-3">Planned by you</th><th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {twItems.map((item) => {
            const ans = state.twAnswers.find((a) => a.itemId === item.id)
            const missed = item.correct.inspection && !ans?.inspection
            return (
              <tr key={item.id} className="border-b border-slate-800/50">
                <td className="py-2 pr-3">{item.name}</td>
                <td className="py-2 pr-3">{item.correct.inspection ? 'Yes' : 'No'}</td>
                <td className="py-2 pr-3">{ans?.inspection === undefined ? '—' : ans.inspection ? 'Yes' : 'No'}</td>
                <td className={`py-2 font-bold text-xs ${missed ? 'text-red-400' : 'text-emerald-400'}`}>{missed ? 'MISSED' : 'OK'}</td>
              </tr>
            )
          })}
          {inspectionDecisions.map((d) => (
            <tr key={d.stepId} className="border-b border-slate-800/50">
              <td className="py-2 pr-3">{d.topic}</td>
              <td className="py-2 pr-3">Yes</td>
              <td className="py-2 pr-3">{d.quality === 'best' ? 'Yes' : 'Partial'}</td>
              <td className={`py-2 font-bold text-xs ${d.quality === 'best' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {d.quality === 'best' ? 'OK' : 'REVIEW'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function EnvironmentView() {
  const { state } = useGame()
  const envTopics = ['environment', 'waste', 'dust', 'noise', 'spill', 'pollution', 'water', 'fuel', 'washout']
  const rows = state.decisions.filter((d) => envTopics.some((t) => d.topic.toLowerCase().includes(t)))
  return (
    <Card title="Environmental Control Checklist">
      {rows.length === 0 ? <p className="text-sm text-slate-400">No environmental decisions recorded.</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
              <th className="py-2 pr-3">Topic</th><th className="py-2 pr-3">Situation</th><th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.stepId} className="border-b border-slate-800/50 align-top">
                <td className="py-2 pr-3">{d.topic}</td>
                <td className="py-2 pr-3 text-slate-400">{d.prompt.replace(/^EVENT:\s*/, '')}</td>
                <td className={`py-2 font-bold text-xs ${d.quality === 'best' ? 'text-emerald-400' : d.quality === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
                  {d.quality === 'best' ? 'CONTROLLED' : d.quality === 'partial' ? 'PARTIAL' : 'NOT CONTROLLED'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function IncidentsView() {
  const { state } = useGame()
  return (
    <Card title="Incident Response Log">
      {state.consequenceLog.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-slate-400 mb-2">Delayed consequences generated by this run's decisions:</p>
          <div className="space-y-2">
            {state.consequenceLog.map((c) => (
              <div key={c.id} className={`rounded-lg border p-3 text-sm ${
                c.severity === 'positive' ? 'border-emerald-800' : c.severity === 'serious' ? 'border-red-800' : 'border-amber-800'
              }`}>
                <div className="font-semibold">
                  Phase {c.phaseNumber}: {c.title}
                  <span className={`ml-2 text-[10px] font-bold uppercase ${
                    c.severity === 'positive' ? 'text-emerald-400' : c.severity === 'serious' ? 'text-red-400' : 'text-amber-400'
                  }`}>{c.severity}</span>
                </div>
                <p className="text-slate-400 mt-1">{c.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {state.incidentLog.length === 0 ? <p className="text-sm text-slate-400">No incident events occurred in this run.</p> : (
        <div className="space-y-3">
          {state.incidentLog.map((r, i) => (
            <div key={i} className="rounded-lg border border-slate-800 p-3 text-sm">
              <div className="font-semibold">{r.prompt.replace(/^EVENT:\s*/, '')}</div>
              <div className="text-slate-400 mt-1">Your response: {r.response}</div>
              <div className={`mt-1 text-xs font-bold ${r.outcomeQuality === 'best' ? 'text-emerald-400' : r.outcomeQuality === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
                {r.outcomeQuality === 'best' ? 'WELL HANDLED' : r.outcomeQuality === 'partial' ? 'PARTIALLY CONTROLLED' : 'POORLY HANDLED'}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function MissedView({ report }: { report: ReturnType<typeof buildScoreReport> }) {
  const m = report.missed
  const sections: { title: string; items: string[]; ok: string }[] = [
    { title: 'Critical safety failures', items: m.criticalFailures, ok: 'No critical safety failures.' },
    { title: 'Missed legal duties', items: m.missedLegalDuties, ok: 'No missed legal duties detected.' },
    { title: 'Missed temporary works items', items: m.missedTwItems, ok: 'All temporary works items were correctly registered.' },
    { title: 'Missed inspections', items: m.missedInspections, ok: 'No missed inspections.' },
    { title: 'Missed permits', items: m.missedPermits, ok: 'All required permits were raised.' },
    { title: 'Environmental failures', items: m.environmentalFailures, ok: 'No environmental control failures.' },
    { title: 'Programme consequences', items: m.programmeConsequences, ok: 'Programme managed without safety trade-offs.' },
    { title: 'Unsafe site layout locations', items: m.unsafePlacements, ok: 'No unsafe placements.' },
    { title: 'Missing site set-up items', items: m.missingPlacements, ok: 'All required site items were placed.' },
  ]
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <Card key={s.title} title={s.title}>
          {s.items.length === 0
            ? <p className="text-sm text-emerald-400">✓ {s.ok}</p>
            : <ul className="list-disc pl-5 text-sm text-red-300 space-y-1">{[...new Set(s.items)].map((i) => <li key={i}>{i}</li>)}</ul>}
        </Card>
      ))}
    </div>
  )
}

function ModelAnswerView() {
  const { state, scenario } = useGame()
  if (!scenario) return null
  const setup = findSteps<SiteSetupStep>(scenario, 'siteSetup')[0]
  const assessments = placementAssessments(state, scenario)
  return (
    <div className="space-y-4">
      {setup && (
        <Card title="Your site set-up vs the model answer">
          <div
            className="grid gap-px bg-slate-800 rounded-lg overflow-hidden border border-slate-700 max-w-2xl"
            style={{ gridTemplateColumns: `repeat(${setup.grid.cols}, minmax(0,1fr))` }}
          >
            {Array.from({ length: setup.grid.rows }).flatMap((_, y) =>
              Array.from({ length: setup.grid.cols }).map((_, x) => {
                const zones = setup.zones.filter((z) => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2)
                const topZone = zones[zones.length - 1]
                const placed = state.placements.find((p) => p.x === x && p.y === y)
                const a = placed ? assessments.find((r) => r.itemId === placed.itemId) : null
                return (
                  <div key={`${x},${y}`} title={topZone?.label} className={`aspect-square flex items-center justify-center text-sm ${topZone ? topZone.color : 'bg-slate-950'}`}>
                    {placed && (
                      <span className={`rounded ${a?.status === 'good' ? 'ring-2 ring-emerald-400' : a?.status === 'unsafe' ? 'ring-2 ring-red-500' : 'ring-1 ring-amber-400'}`}>
                        {SITE_ITEM_MAP[placed.itemId]?.icon}
                      </span>
                    )}
                  </div>
                )
              }),
            )}
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-1 text-xs">
            {setup.rules.filter((r) => r.required).map((r) => {
              const a = assessments.find((x) => x.itemId === r.itemId)
              const zoneNames = r.goodZones.map((gz) => setup.zones.find((z) => z.id === gz)?.label ?? gz).join(' / ')
              const status = a?.status ?? 'missing'
              const cls = status === 'good' ? 'text-emerald-400' : status === 'neutral' ? 'text-amber-400' : 'text-red-400'
              return (
                <div key={r.itemId} className="flex gap-2">
                  <span className={`font-bold ${cls}`}>{status === 'good' ? '✓' : status === 'neutral' ? '~' : '✗'}</span>
                  <span className="text-slate-300">{SITE_ITEM_MAP[r.itemId]?.label}</span>
                  <span className="text-slate-500">→ ideal: {zoneNames}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
      <Card title="Model answer — how the project should have been run">
        <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1.5">
          {scenario.modelAnswerNotes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </Card>
    </div>
  )
}

function ObjectivesView() {
  const { state, scenario } = useGame()
  if (!scenario) return null
  const coverage = computeObjectiveCoverage(state, scenario)
  const statusStyle = {
    achieved: 'text-emerald-400',
    partial: 'text-amber-400',
    revise: 'text-red-400',
    'not-reached': 'text-slate-500',
  } as const
  const statusLabel = {
    achieved: 'ACHIEVED',
    partial: 'PARTIALLY ACHIEVED',
    revise: 'NEEDS REVISION',
    'not-reached': 'NOT REACHED',
  } as const
  const addressed = coverage.filter((c) => c.encountered > 0).length
  return (
    <Card title="Learning objective coverage">
      <p className="text-sm text-slate-400 mb-1">
        Every completed scenario walks the delegate through gameplay steps mapped to all ten
        SMSTS-aligned learning outcomes. This report evidences coverage and performance for
        this run: <b className="text-slate-200">{addressed}/{coverage.length}</b> outcomes addressed.
      </p>
      <p className="text-[11px] text-slate-500 mb-4">
        Outcome wording is original and SMSTS-aligned; this game and report are not endorsed or
        approved by CITB and do not replace formal training or assessment.
      </p>
      <div className="space-y-3">
        {coverage.map((c) => (
          <div key={c.objective.id} className="rounded-lg border border-slate-800 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-sm">
                  <span className="text-amber-400 mr-2">{c.objective.code}</span>
                  {c.objective.title}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{c.objective.description}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Evidenced by {c.encountered}/{c.stepIds.length} mapped steps this run
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-xs font-bold ${statusStyle[c.status]}`}>{statusLabel[c.status]}</div>
                <div className="text-lg font-bold tabular-nums">{c.performance === null ? '—' : `${c.performance}`}</div>
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded bg-slate-800 overflow-hidden">
              <div
                className={`h-full ${c.performance === null ? 'bg-slate-700' : c.performance >= 75 ? 'rag-green' : c.performance >= 50 ? 'rag-amber' : 'rag-red'}`}
                style={{ width: `${c.performance ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function SignoffField({
  label, hint, value, print, rows, onChange,
}: {
  label: string
  hint: string
  value: string
  /** Extra text appended in print view (e.g. signature line). */
  print?: string
  rows?: number
  onChange: (text: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-300 mb-1">
        {label}
        <span className="block font-normal text-slate-500">{hint}</span>
      </label>
      <textarea
        value={value}
        rows={rows ?? 4}
        onChange={(e) => onChange(e.target.value)}
        className="no-print w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm"
        placeholder="Type here — saved automatically and included when the report is printed."
      />
      <div className="hidden print:block whitespace-pre-wrap border border-slate-400 rounded p-2 text-sm min-h-16">
        {value || ' '}
        {print && <span className="block mt-3">{print}</span>}
      </div>
    </div>
  )
}

function TutorSheetView({ report }: { report: ReturnType<typeof buildScoreReport> }) {
  const { state, dispatch } = useGame()
  return (
    <Card title="Tutor Review Sheet">
      <p className="text-sm text-slate-400 mb-3">
        Delegate: <b className="text-slate-200">{report.delegateName}</b> · Scenario: {report.scenarioTitle} ·
        Overall: <b className="text-slate-200">{report.overall}/100 ({report.gradeLabel})</b>
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-800">
            <th className="py-2 pr-2">Phase</th><th className="py-2 pr-2">Type</th><th className="py-2 pr-2">Decision</th><th className="py-2 pr-2">Topic</th><th className="py-2">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {state.decisions.map((d) => (
            <tr key={d.stepId} className="border-b border-slate-800/50 align-top">
              <td className="py-1.5 pr-2">{d.phaseNumber}</td>
              <td className="py-1.5 pr-2">{d.wasEvent ? 'Event' : 'Decision'}</td>
              <td className="py-1.5 pr-2 text-slate-400">{d.prompt.replace(/^EVENT:\s*/, '')}</td>
              <td className="py-1.5 pr-2">{d.topic}</td>
              <td className={`py-1.5 font-bold ${d.quality === 'best' ? 'text-emerald-400' : d.quality === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
                {d.quality.toUpperCase()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-sm text-slate-400 space-y-2">
        <p className="font-semibold text-slate-300">Suggested discussion points:</p>
        <ul className="list-disc pl-5 space-y-1">
          {report.missed.revisionTopics.slice(0, 8).map((t) => <li key={t}>{t}</li>)}
          {report.missed.revisionTopics.length === 0 && <li>Full marks — discuss how the delegate would coach others on these standards.</li>}
        </ul>
      </div>

      <div className="mt-6 space-y-4 border-t border-slate-800 pt-4">
        <h4 className="text-sm font-bold text-slate-200">Reflection &amp; sign-off</h4>
        <SignoffField
          label="Delegate reflection"
          hint="In your own words: what would you do differently on a live project, and why?"
          value={state.delegateReflection}
          onChange={(text) => dispatch({ type: 'SET_SIGNOFF', field: 'delegateReflection', text })}
        />
        <SignoffField
          label="Trainer comments"
          hint="Observations on the delegate's decision-making, recovery and areas to develop."
          value={state.trainerComments}
          onChange={(text) => dispatch({ type: 'SET_SIGNOFF', field: 'trainerComments', text })}
        />
        <div className="max-w-sm">
          <label className="block text-xs font-bold text-slate-300 mb-1">Trainer name (sign-off)</label>
          <input
            value={state.trainerName}
            onChange={(e) => dispatch({ type: 'SET_SIGNOFF', field: 'trainerName', text: e.target.value })}
            className="no-print w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-sm"
            placeholder="Name of reviewing trainer"
          />
          <div className="hidden print:block border-b border-slate-400 pt-6 text-sm">
            {state.trainerName}
          </div>
          <p className="hidden print:block text-[10px] text-slate-500 mt-1">
            Trainer signature · Audit ID {state.runId ?? '—'} ·
            Reviewed {state.finishedAt ? new Date(state.finishedAt).toLocaleDateString() : ''}
          </p>
        </div>
      </div>
    </Card>
  )
}

function CertificateView({ report }: { report: ReturnType<typeof buildScoreReport> }) {
  return (
    <div className="rounded-xl border-4 border-double border-amber-500/60 bg-slate-900 p-10 text-center max-w-2xl mx-auto">
      <div className="text-4xl mb-2">🏗️</div>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-4">Certificate of Completion</p>
      <h3 className="text-2xl font-bold">Construction Phase Planner</h3>
      <p className="text-amber-400 font-semibold mb-6">SMSTS Safety Challenge</p>
      <p className="text-sm text-slate-400">This certifies that</p>
      <p className="text-3xl font-bold my-2">{report.delegateName}</p>
      <p className="text-sm text-slate-400">
        completed <b className="text-slate-200">{report.scenarioTitle}</b><br />
        with an overall score of <b className="text-slate-200">{report.overall}/100 — {report.gradeLabel}</b>
      </p>
      <p className="text-xs text-slate-500 mt-6">
        {report.finishedAt ? new Date(report.finishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
      </p>
      <div className="mt-8 pt-4 border-t border-slate-700 text-[10px] text-slate-500 leading-relaxed">
        This certificate records completion of an educational simulation only. It is not a CITB certificate,
        does not confirm SMSTS attendance or achievement, and does not replace formal training, assessment or certification.
        <span className="block mt-2 italic">[Placeholder — training providers may apply their own branding under licence]</span>
      </div>
    </div>
  )
}
