import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../state/GameContext'
import {
  allDecisionSteps, buildScoreReport, decisionsCsv, downloadText, environmentalChecklistCsv, findSteps,
  inspectionTrackerCsv, permitTrackerCsv, placementAssessments, twRegisterCsv,
} from '../engine/reports'
import {
  CPP_SECTIONS, DISCLAIMER, TW_FIELDS, type HazardHuntStep, type PermitStep, type SequenceStep,
  type SiteSetupStep, type TwRegisterStep,
} from '../types'
import { SITE_ITEM_MAP } from '../data/siteItems'
import { assessHunt, assessSequence, twItemScore } from '../engine/scoring'
import { CONFIDENCE_LABELS, DIFFICULTIES, fmtDays, fmtMoney, outcomeSummary, rankFor } from '../engine/game'
import { ACHIEVEMENTS, evaluateAchievements, recordGame } from '../state/profile'
import { sfx } from '../engine/sound'

type Tab =
  | 'outcome' | 'score' | 'review' | 'cpp' | 'risk' | 'tw' | 'permits' | 'inspections'
  | 'environment' | 'incidents' | 'missed' | 'model' | 'tutor-sheet' | 'certificate'

interface RecordResult { newAchievements: string[]; xpBefore: number; xpAfter: number }

const TABS: { id: Tab; label: string }[] = [
  { id: 'outcome', label: '🏁 Project Outcome' },
  { id: 'score', label: '1 · Score Report' },
  { id: 'review', label: '🔍 Decision Review' },
  { id: 'cpp', label: '2 · Construction Phase Plan' },
  { id: 'risk', label: '3 · Risk Assessment Summary' },
  { id: 'tw', label: '4 · Temporary Works Register' },
  { id: 'permits', label: '5 · Permit Tracker' },
  { id: 'inspections', label: '6 · Inspection Tracker' },
  { id: 'environment', label: '7 · Environmental Checklist' },
  { id: 'incidents', label: '8 · Incident Response Log' },
  { id: 'missed', label: '9 · Missed Items Report' },
  { id: 'model', label: '10 · Model Answer Overlay' },
  { id: 'tutor-sheet', label: '11 · Tutor Review Sheet' },
  { id: 'certificate', label: '12 · Certificate' },
]

export default function ReportScreen({ onRestart }: { onRestart: () => void }) {
  const { state, scenario, dispatch } = useGame()
  const [tab, setTab] = useState<Tab>('outcome')
  const [recorded, setRecorded] = useState<RecordResult | null>(null)
  const recordingRef = useRef(false)

  // Write the result to the career profile and leaderboard exactly once.
  useEffect(() => {
    if (!scenario || !state.completed || state.game.recorded || recordingRef.current) return
    recordingRef.current = true
    const r = recordGame(state, scenario)
    setRecorded(r)
    dispatch({ type: 'MARK_RECORDED' })
    if (rankFor(r.xpAfter).rank.title !== rankFor(r.xpBefore).rank.title) sfx.levelUp()
    else if (!state.game.shutdown) sfx.fanfare()
    else sfx.bad()
  }, [scenario, state, dispatch])

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

        {tab === 'outcome' && <OutcomeView report={report} recorded={recorded} />}
        {tab === 'score' && <ScoreReportView report={report} />}
        {tab === 'review' && <DecisionReviewView />}
        {tab === 'cpp' && <CppView />}
        {tab === 'risk' && <RiskView />}
        {tab === 'tw' && <TwView />}
        {tab === 'permits' && <PermitsView />}
        {tab === 'inspections' && <InspectionsView />}
        {tab === 'environment' && <EnvironmentView />}
        {tab === 'incidents' && <IncidentsView />}
        {tab === 'missed' && <MissedView report={report} />}
        {tab === 'model' && <ModelAnswerView />}
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
  const gradeColor = report.overall >= 75 ? 'text-emerald-400' : report.overall >= 60 ? 'text-amber-400' : 'text-red-400'
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="text-5xl font-extrabold tabular-nums">{report.overall}<span className="text-xl text-slate-500">/100</span></div>
            <div className={`text-xl font-bold ${gradeColor}`}>{report.gradeLabel}</div>
            <div className="text-sm text-slate-400">{report.gradeSummary}</div>
          </div>
          <div className="flex-1 min-w-[260px] space-y-2">
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
        </div>
        <div className="mt-4 text-xs text-slate-400">
          <b>Grade bands:</b> 90–100 Excellent — strong SMSTS-level planning · 75–89 Good — safe with minor gaps ·
          60–74 Pass-level — improvement required · 40–59 Significant gaps · Below 40 Unsafe planning — restart recommended
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
    { title: 'Hazards not identified on the walk-round', items: m.missedHazards, ok: 'Every walk-round hazard was identified.' },
    { title: 'Sequencing errors', items: m.sequenceErrors, ok: 'Every work sequence respected its dependencies.' },
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

function TutorSheetView({ report }: { report: ReturnType<typeof buildScoreReport> }) {
  const { state } = useGame()
  return (
    <Card title="Tutor Review Sheet">
      <p className="text-sm text-slate-400 mb-3">
        Delegate: <b className="text-slate-200">{report.delegateName}</b> · Scenario: {report.scenarioTitle} ·
        Overall: <b className="text-slate-200">{report.overall}/100 ({report.gradeLabel})</b>
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-800">
            <th className="py-2 pr-2">Phase</th><th className="py-2 pr-2">Type</th><th className="py-2 pr-2">Decision</th><th className="py-2 pr-2">Topic</th><th className="py-2 pr-2">Confidence</th><th className="py-2">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {state.decisions.map((d) => (
            <tr key={d.stepId} className="border-b border-slate-800/50 align-top">
              <td className="py-1.5 pr-2">{d.phaseNumber}</td>
              <td className="py-1.5 pr-2">{d.wasEvent ? 'Event' : 'Decision'}</td>
              <td className="py-1.5 pr-2 text-slate-400">{d.prompt.replace(/^EVENT:\s*/, '')}</td>
              <td className="py-1.5 pr-2">{d.topic}</td>
              <td className="py-1.5 pr-2">{d.timedOut ? '⏱ timed out' : d.confidence ? CONFIDENCE_LABELS[d.confidence].label : '—'}{d.usedLifeline ? ' · 🛟' : ''}</td>
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
    </Card>
  )
}

function CertificateView({ report }: { report: ReturnType<typeof buildScoreReport> }) {
  const { state } = useGame()
  const diff = DIFFICULTIES[state.game.difficulty]
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
        with an overall score of <b className="text-slate-200">{report.overall}/100 — {report.gradeLabel}</b><br />
        playing as <b className="text-slate-200">{diff.role}</b> ({diff.label} difficulty) · {state.game.points.toLocaleString('en-GB')} game points
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

// ---------- Project outcome (game debrief) ----------

function OutcomeView({ report, recorded }: { report: ReturnType<typeof buildScoreReport>; recorded: RecordResult | null }) {
  const { state, scenario } = useGame()
  if (!scenario) return null
  const g = state.game
  const diff = DIFFICULTIES[g.difficulty]
  const out = outcomeSummary(state)
  const earned = evaluateAchievements(state, scenario)
  const bonusTotal = g.bonuses.reduce((a, b) => a + b.points, 0)
  const decisionPts = state.decisions.reduce((a, d) => a + (d.points ?? 0), 0)
  const otherPts = g.points - bonusTotal - decisionPts
  const before = recorded ? rankFor(recorded.xpBefore) : null
  const after = recorded ? rankFor(recorded.xpAfter) : null
  const promoted = before && after && before.rank.title !== after.rank.title
  const gradeColor = report.overall >= 75 ? 'text-emerald-400' : report.overall >= 60 ? 'text-amber-400' : 'text-red-400'

  const timeline = [
    ...g.consequences.map((c) => ({ week: c.week, kind: c.severity === 'major' ? '🚑' : '⚠️', title: c.title, body: c.narrative, cause: c.rootCause, cost: c.cost, days: c.days })),
    ...g.notices.map((n) => ({ week: n.week, kind: '🏛️', title: `HSE ${n.kind === 'prohibition' ? 'Prohibition' : 'Improvement'} Notice`, body: n.reason, cause: '', cost: n.cost, days: n.days })),
  ].sort((a, b) => a.week - b.week)

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border-2 p-6 ${g.shutdown ? 'border-red-600 bg-red-950/40' : 'border-amber-500/60 bg-slate-900'}`}>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[240px]">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {diff.icon} {diff.label} · {diff.role} · {scenario.title}
            </div>
            <div className={`text-2xl font-extrabold mt-1 ${g.shutdown ? 'text-red-300' : 'text-slate-100'}`}>
              {g.shutdown ? '⛔ Project shut down by HSE' : '🏁 Project handed over'}
            </div>
            <div className="text-sm text-slate-400 mt-1">{report.delegateName}</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">Game points</div>
            <div className="text-5xl font-extrabold tabular-nums text-amber-400">{g.points.toLocaleString('en-GB')}</div>
            <div className="text-[11px] text-slate-500">×{diff.pointsMultiplier} difficulty multiplier included</div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">Competence grade</div>
            <div className="text-5xl font-extrabold tabular-nums">{report.overall}<span className="text-lg text-slate-500">/100</span></div>
            <div className={`text-sm font-bold ${gradeColor}`}>{report.gradeLabel}</div>
          </div>
        </div>
        {recorded && after && (
          <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            {promoted && <div className="text-lg font-extrabold text-amber-300 mb-1 anim-rise">⬆ Promoted to {after.rank.icon} {after.rank.title}!</div>}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-2xl">{after.rank.icon}</span>
              <span className="flex-1">
                <b>{after.rank.title}</b> · {recorded.xpAfter.toLocaleString('en-GB')} XP
                <span className="text-slate-500"> (+{(recorded.xpAfter - recorded.xpBefore).toLocaleString('en-GB')})</span>
                <span className="block h-2 rounded bg-slate-800 overflow-hidden mt-1">
                  <span className="block h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${after.progress * 100}%` }} />
                </span>
                {after.next && <span className="text-[11px] text-slate-500">{(after.next.min - recorded.xpAfter).toLocaleString('en-GB')} XP to {after.next.title}</span>}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <OutTile icon="💷" label="Contingency left" value={fmtMoney(g.budget)} sub={`of ${fmtMoney(g.budgetStart)}`} good={out.onBudget} />
        <OutTile icon="📅" label="Programme float" value={fmtDays(g.floatDays)} sub={out.onProgramme ? 'On programme' : 'Late'} good={out.onProgramme} />
        <OutTile icon="🚑" label="Incidents" value={`${out.incidents}`} sub={`${out.majorIncidents} serious · ${out.riddor} RIDDOR`} good={out.incidents === 0} />
        <OutTile icon="🏛️" label="HSE notices" value={`${out.notices}`} sub={`${out.prohibitions} prohibition`} good={out.notices === 0} />
        <OutTile icon="🦺" label="Safe weeks" value={`${g.safeWeeks}`} sub="no incident or notice" good={g.safeWeeks >= 5} />
        <OutTile icon="🔥" label="Best streak" value={`${g.bestStreak}`} sub="best answers in a row" good={g.bestStreak >= 5} />
        <OutTile icon="🧰" label="Risks closed out" value={`${out.rectified}`} sub={`${out.openRisks} handed over open`} good={out.openRisks === 0} />
        <OutTile icon="🛟" label="Help used" value={`${g.lifelineSteps.length}`} sub={`${g.timeouts} timed out`} good={g.lifelineSteps.length === 0 && g.timeouts === 0} />
      </div>

      <Card title="Points breakdown">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-800/50"><td className="py-1.5">Decisions and incident responses ({state.decisions.length})</td><td className="py-1.5 text-right tabular-nums font-bold">{decisionPts.toLocaleString('en-GB')}</td></tr>
            <tr className="border-b border-slate-800/50"><td className="py-1.5">Planning tasks, mini-games and site weeks</td><td className="py-1.5 text-right tabular-nums font-bold">{otherPts.toLocaleString('en-GB')}</td></tr>
            {g.bonuses.map((b) => (
              <tr key={b.label} className="border-b border-slate-800/50">
                <td className="py-1.5 text-slate-300">{b.points >= 0 ? '🏅' : '⚠'} {b.label}</td>
                <td className={`py-1.5 text-right tabular-nums font-bold ${b.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{b.points >= 0 ? '+' : ''}{b.points.toLocaleString('en-GB')}</td>
              </tr>
            ))}
            <tr><td className="py-2 font-bold">Total</td><td className="py-2 text-right tabular-nums font-extrabold text-amber-400">{g.points.toLocaleString('en-GB')}</td></tr>
          </tbody>
        </table>
      </Card>

      <Card title={`Badges earned this project (${earned.length})`}>
        {earned.length === 0 ? <p className="text-sm text-slate-400">No badges this time. Check the locked badges on the home screen for what to aim for.</p> : (
          <div className="grid sm:grid-cols-2 gap-2">
            {earned.map((id) => {
              const a = ACHIEVEMENTS.find((x) => x.id === id)!
              const isNew = recorded?.newAchievements.includes(id)
              return (
                <div key={id} className={`flex items-center gap-3 rounded-lg border p-2 ${isNew ? 'border-amber-500 bg-amber-500/10 anim-rise' : 'border-slate-800'}`}>
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-sm"><b>{a.title}</b>{isNew && <span className="ml-2 text-[10px] font-bold text-amber-300">NEW!</span>}<span className="block text-xs text-slate-400">{a.desc}</span></span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card title="What happened on site">
        {timeline.length === 0 ? (
          <p className="text-sm text-emerald-400">✓ No incidents or enforcement all project. Your planning kept the site under control.</p>
        ) : (
          <ol className="relative border-l border-slate-700 ml-2 space-y-4">
            {timeline.map((t, i) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs">{t.kind}</span>
                <div className="text-xs text-slate-500">Week {t.week} · −{fmtMoney(t.cost)} · −{t.days} d</div>
                <div className="font-semibold text-sm">{t.title}</div>
                <p className="text-sm text-slate-300">{t.body}</p>
                {t.cause && <p className="text-xs text-slate-400 mt-0.5">Root cause: {t.cause}</p>}
              </li>
            ))}
          </ol>
        )}
        {g.latent.some((h) => h.status === 'open') && (
          <div className="mt-4 rounded-lg border border-orange-800 bg-orange-950/20 p-3">
            <p className="text-xs font-bold text-orange-300 mb-1">Risks still open at handover (passed to the client and the H&amp;S file):</p>
            <ul className="list-disc pl-5 text-xs text-orange-200 space-y-0.5">
              {g.latent.filter((h) => h.status === 'open').map((h) => <li key={h.id}>{h.topic}: "{h.choice}"</li>)}
            </ul>
          </div>
        )}
      </Card>

      <Card title="Confidence calibration">
        <p className="text-xs text-slate-400 mb-3">
          Good managers know what they know, and know when to stop and check. Being certain and wrong on a
          safety-critical call is the most dangerous combination on site.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
              <th className="py-1.5">Confidence</th><th className="py-1.5">Answers</th><th className="py-1.5">Best answer rate</th>
            </tr>
          </thead>
          <tbody>
            {(['sure', 'think', 'guess'] as const).map((c) => {
              const row = out.calibration[c]
              const pct = row.n ? Math.round((row.best / row.n) * 100) : null
              return (
                <tr key={c} className="border-b border-slate-800/50">
                  <td className="py-1.5">{CONFIDENCE_LABELS[c].label}</td>
                  <td className="py-1.5 tabular-nums">{row.n}</td>
                  <td className="py-1.5">
                    {pct === null ? '—' : (
                      <span className="flex items-center gap-2">
                        <span className="w-32 h-2 rounded bg-slate-800 overflow-hidden"><span className={`block h-full ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} /></span>
                        <span className="tabular-nums">{pct}%</span>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {out.confidentlyWrong > 0 && (
          <p className="mt-3 text-sm text-red-300">⚠ {out.confidentlyWrong} answer(s) were poor or unsafe while marked <b>Certain</b>. Review these first in the Decision Review tab.</p>
        )}
      </Card>
    </div>
  )
}

function OutTile({ icon, label, value, sub, good }: { icon: string; label: string; value: string; sub: string; good: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${good ? 'border-emerald-800 bg-emerald-950/20' : 'border-red-900 bg-red-950/20'}`}>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{icon} {label}</div>
      <div className={`text-xl font-extrabold tabular-nums ${good ? 'text-emerald-300' : 'text-red-300'}`}>{value}</div>
      <div className="text-[11px] text-slate-400">{sub}</div>
    </div>
  )
}

// ---------- Decision review (every answer vs the model answer) ----------

const Q_CLS: Record<string, string> = {
  best: 'text-emerald-400', partial: 'text-amber-400', poor: 'text-orange-400', unsafe: 'text-red-400',
}

function DecisionReviewView() {
  const { state, scenario } = useGame()
  const [filter, setFilter] = useState<'all' | 'wrong'>('wrong')
  if (!scenario) return null
  const stepMap = new Map(allDecisionSteps(scenario).map((d) => [d.id, d]))
  const rows = state.decisions.filter((d) => filter === 'all' || d.quality !== 'best')
  const hunts = findSteps<HazardHuntStep>(scenario, 'hazardHunt')
  const seqs = findSteps<SequenceStep>(scenario, 'sequence')

  return (
    <div className="space-y-4">
      <div className="no-print flex gap-2">
        <button onClick={() => setFilter('wrong')} className={`rounded-md px-3 py-1.5 text-xs ${filter === 'wrong' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}>Only answers to review</button>
        <button onClick={() => setFilter('all')} className={`rounded-md px-3 py-1.5 text-xs ${filter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'}`}>All decisions</button>
      </div>
      {rows.length === 0 && <Card><p className="text-sm text-emerald-400">✓ Every decision matched the model answer.</p></Card>}
      {rows.map((d) => {
        const step = stepMap.get(d.stepId)
        const chosen = step?.options.find((o) => o.id === d.chosenOptionId)
        const best = step?.options.find((o) => o.quality === 'best')
        return (
          <div key={d.stepId} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm">
            <div className="text-[11px] text-slate-500">Phase {d.phaseNumber} · {d.wasEvent ? 'Incident event' : 'Decision'} · {d.topic}</div>
            <div className="font-semibold mt-0.5">{d.prompt.replace(/^EVENT:\s*/, '')}</div>
            <div className="mt-2 grid md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-700 p-2">
                <div className={`text-[10px] font-bold ${Q_CLS[d.quality]}`}>
                  YOUR ANSWER · {d.timedOut ? 'TIMED OUT' : d.quality.toUpperCase()}
                  {d.confidence && !d.timedOut && ` · ${CONFIDENCE_LABELS[d.confidence].label.toUpperCase()}`}
                  {d.points !== undefined && ` · ${d.points >= 0 ? '+' : ''}${d.points} pts`}
                </div>
                <div className="mt-1">{chosen?.text ?? 'No decision made in time'}</div>
                {chosen && <div className="mt-1 text-xs text-slate-400">{chosen.feedback}</div>}
              </div>
              {best && d.quality !== 'best' && (
                <div className="rounded-lg border border-emerald-800 bg-emerald-950/20 p-2">
                  <div className="text-[10px] font-bold text-emerald-400">MODEL ANSWER</div>
                  <div className="mt-1">{best.text}</div>
                  <div className="mt-1 text-xs text-slate-400">{best.feedback}</div>
                </div>
              )}
            </div>
            {step && <div className="mt-2 text-xs text-sky-200">📘 {step.learningNote}</div>}
          </div>
        )
      })}

      {hunts.map((h) => {
        const ans = state.huntAnswers.find((a) => a.stepId === h.id)
        if (!ans) return null
        const a = assessHunt(h, ans.flagged)
        return (
          <Card key={h.id} title={`Hazard hunt: ${a.found.length}/${a.found.length + a.missed.length} found · ${a.falseFlags.length} false alarm(s)`}>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              {h.observations.filter((o) => filter === 'all' || a.missed.includes(o) || a.falseFlags.includes(o)).map((o) => {
                const status = a.found.includes(o) ? ['✓ Found', 'text-emerald-400'] : a.missed.includes(o) ? ['✗ Missed hazard', 'text-red-400'] : a.falseFlags.includes(o) ? ['⚠ False alarm', 'text-amber-400'] : ['Acceptable', 'text-slate-500']
                return (
                  <div key={o.id} className="rounded border border-slate-800 p-2">
                    <div className={`font-bold ${status[1]}`}>{status[0]}</div>
                    <div className="text-slate-200">{o.icon} {o.text}</div>
                    <div className="text-slate-400 mt-0.5">{o.explanation}</div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}

      {seqs.map((sq) => {
        const ans = state.sequenceAnswers.find((a) => a.stepId === sq.id)
        if (!ans) return null
        const a = assessSequence(sq, ans.order)
        const label = (id: string) => sq.activities.find((x) => x.id === id)?.label ?? id
        return (
          <Card key={sq.id} title={`Sequence: ${sq.topic} (${a.satisfied.length}/${sq.constraints.length} dependencies)`}>
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="font-bold text-slate-400 mb-1">Your sequence</div>
                <ol className="list-decimal pl-5 space-y-0.5">{ans.order.map((id) => <li key={id}>{label(id)}</li>)}</ol>
              </div>
              <div>
                <div className="font-bold text-emerald-400 mb-1">Model sequence</div>
                <ol className="list-decimal pl-5 space-y-0.5">{sq.activities.map((x) => <li key={x.id}>{x.label}</li>)}</ol>
              </div>
            </div>
            {a.violated.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs">
                {a.violated.map((c) => (
                  <li key={`${c.before}-${c.after}`} className={c.critical ? 'text-red-300' : 'text-amber-300'}>
                    {c.critical ? 'CRITICAL · ' : ''}<b>{label(c.before)}</b> must precede <b>{label(c.after)}</b>. {c.reason}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )
      })}
    </div>
  )
}
