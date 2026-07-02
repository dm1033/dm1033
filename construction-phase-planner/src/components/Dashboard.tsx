import { useGame } from '../state/GameContext'
import { METER_KEYS, METER_LABELS, SCORE_KEYS, SCORE_LABELS } from '../types'
import { categoryScore } from '../engine/scoring'

function ragClass(v: number, invert = false) {
  const x = invert ? 100 - v : v
  if (x >= 75) return 'rag-green'
  if (x >= 45) return 'rag-amber'
  return 'rag-red'
}

export default function Dashboard() {
  const { state } = useGame()
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Performance</h3>
        <div className="space-y-1.5">
          {SCORE_KEYS.map((k) => {
            const score = categoryScore(state.scores, k)
            return (
              <div key={k}>
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>{SCORE_LABELS[k]}</span>
                  <span className="tabular-nums">{score === null ? '—' : `${score}`}</span>
                </div>
                <div className="h-1.5 rounded bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded transition-all ${score === null ? 'bg-slate-700' : ragClass(score)}`}
                    style={{ width: `${score ?? 0}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Project Meters</h3>
        <div className="space-y-1.5">
          {METER_KEYS.map((k) => {
            const v = state.scores.meters[k]
            const invert = k === 'enforcementRisk' || k === 'incidentLikelihood' || k === 'cost'
            return (
              <div key={k}>
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>{METER_LABELS[k]}</span>
                  <span className="tabular-nums">{v}</span>
                </div>
                <div className="h-1.5 rounded bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded transition-all ${ragClass(v, invert)}`} style={{ width: `${v}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {state.criticalFailures.length > 0 && (
        <div className="rounded-md border border-red-800 bg-red-950/40 p-2">
          <div className="text-[11px] font-bold text-red-400 mb-1">
            ⚠ Critical failures: {state.criticalFailures.length}
          </div>
          <ul className="text-[10px] text-red-300 space-y-0.5 list-disc pl-3">
            {state.criticalFailures.slice(-3).map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
