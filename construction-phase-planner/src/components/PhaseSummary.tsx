import { useGame } from '../state/GameContext'
import type { Phase } from '../types'
import { METER_LABELS } from '../types'

const QUALITY_TEXT: Record<string, { label: string; cls: string }> = {
  best: { label: 'Excellent / Good', cls: 'text-emerald-400' },
  partial: { label: 'Acceptable', cls: 'text-amber-400' },
  poor: { label: 'Weak / Poor', cls: 'text-orange-400' },
  unsafe: { label: 'Unsafe', cls: 'text-red-400' },
}

interface Props {
  phase: Phase
  onContinue: () => void
}

/** End-of-phase feedback interstitial (learning / tutor / demo modes). */
export default function PhaseSummary({ phase, onContinue }: Props) {
  const { state } = useGame()
  const phaseDecisions = state.decisions.filter((d) => d.phaseNumber === phase.number)
  const strengths = phaseDecisions.filter((d) => d.quality === 'best')
  const missed = phaseDecisions.filter((d) => d.quality === 'partial' || d.quality === 'poor')
  const unsafe = phaseDecisions.filter((d) => d.quality === 'unsafe')
  const score = phaseDecisions.length
    ? Math.round(
        phaseDecisions.reduce(
          (sum, d) => sum + (d.quality === 'best' ? 100 : d.quality === 'partial' ? 60 : d.quality === 'poor' ? 25 : 0),
          0,
        ) / phaseDecisions.length,
      )
    : null

  const worryMeters = (['enforcementRisk', 'incidentLikelihood'] as const).filter(
    (k) => state.scores.meters[k] >= 40,
  )

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
      <div className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-1">Phase review</div>
      <h3 className="text-lg font-bold mb-3">
        Phase {phase.number} — {phase.title} complete
        {score !== null && (
          <span className={`ml-3 text-base ${score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {score}/100
          </span>
        )}
      </h3>

      <div className="space-y-3 text-sm">
        {strengths.length > 0 && (
          <div>
            <div className="font-semibold text-emerald-400 text-xs mb-1">✓ Strengths</div>
            <ul className="list-disc pl-5 text-slate-300 space-y-0.5">
              {strengths.map((d) => <li key={d.stepId}>{d.topic}</li>)}
            </ul>
          </div>
        )}
        {missed.length > 0 && (
          <div>
            <div className="font-semibold text-amber-400 text-xs mb-1">~ Missed controls / partial answers</div>
            <ul className="list-disc pl-5 text-slate-300 space-y-0.5">
              {missed.map((d) => <li key={d.stepId}>{d.topic} — revise this topic</li>)}
            </ul>
          </div>
        )}
        {unsafe.length > 0 && (
          <div>
            <div className="font-semibold text-red-400 text-xs mb-1">✗ Unsafe decisions</div>
            <ul className="list-disc pl-5 text-red-300 space-y-0.5">
              {unsafe.map((d) => <li key={d.stepId}>{d.topic}</li>)}
            </ul>
          </div>
        )}
        {phaseDecisions.length === 0 && (
          <p className="text-slate-400">No scored decisions in this phase.</p>
        )}
        {worryMeters.length > 0 && (
          <div className="rounded-md border border-amber-800 bg-amber-950/30 p-2 text-xs text-amber-200">
            ⚠ Consequences building: {worryMeters.map((k) => `${METER_LABELS[k]} at ${state.scores.meters[k]}`).join(' · ')}.
            Poor early planning shows up later in the project.
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        className="mt-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5"
      >
        Continue to next phase →
      </button>
    </div>
  )
}
