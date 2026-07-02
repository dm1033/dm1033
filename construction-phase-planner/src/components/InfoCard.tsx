import type { InfoStep } from '../types'

export default function InfoCard({ step, onContinue }: { step: InfoStep; onContinue: () => void }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-xl font-bold mb-3">{step.title}</h3>
      <div className="space-y-2 text-slate-300 text-sm leading-relaxed">
        {step.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {step.keyPoints && (
        <ul className="mt-4 space-y-1 text-sm">
          {step.keyPoints.map((k) => (
            <li key={k} className="flex gap-2 text-amber-300"><span>▸</span><span>{k}</span></li>
          ))}
        </ul>
      )}
      <button
        onClick={onContinue}
        className="mt-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5"
      >
        Continue →
      </button>
    </div>
  )
}
