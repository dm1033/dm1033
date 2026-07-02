import { useState } from 'react'
import type { PermitStep } from '../types'

interface Props {
  step: PermitStep
  reveal: boolean
  onSubmit: (selected: string[]) => void
  onContinue: () => void
}

export default function PermitForm({ step, reveal, onSubmit, onContinue }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const toggle = (id: string) => {
    if (submitted) return
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submit = () => {
    setSubmitted(true)
    onSubmit(selected)
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-lg font-semibold mb-1">Permit Systems</h3>
      <p className="text-sm text-slate-400 mb-4">{step.prompt}</p>

      <div className="grid sm:grid-cols-2 gap-2">
        {step.options.map((o) => {
          const isSel = selected.includes(o.id)
          const isReq = step.required.includes(o.id)
          const showState = submitted || reveal
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                showState
                  ? isReq && isSel
                    ? 'border-emerald-700 bg-emerald-950/40 text-emerald-200'
                    : isReq && !isSel
                      ? 'border-red-700 bg-red-950/40 text-red-300'
                      : !isReq && isSel
                        ? 'border-amber-700 bg-amber-950/40 text-amber-300'
                        : 'border-slate-800 bg-slate-900/40 text-slate-500'
                  : isSel
                    ? 'border-amber-500 bg-amber-500/15'
                    : 'border-slate-700 bg-slate-900 hover:border-slate-500'
              }`}
            >
              <span className="mr-2">{isSel ? '☑' : '☐'}</span>
              {o.name}
              {showState && isReq && !isSel && <span className="block text-[10px] font-bold mt-1">REQUIRED — MISSED</span>}
              {showState && isReq && isSel && <span className="block text-[10px] font-bold mt-1">REQUIRED — IN PLACE</span>}
              {showState && !isReq && isSel && <span className="block text-[10px] font-bold mt-1">NOT ESSENTIAL — ADDED PAPERWORK</span>}
            </button>
          )
        })}
      </div>

      {!submitted ? (
        <button onClick={submit} className="mt-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5">
          Confirm Permit Systems
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">
            {step.explanation}
          </div>
          <div className="rounded-lg border border-sky-900 bg-sky-950/30 p-3 text-sm text-sky-200">
            <p className="font-bold text-xs text-sky-400 mb-1">📘 Learning note — {step.topic}</p>
            <p>{step.learningNote}</p>
          </div>
          <button onClick={onContinue} className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5">
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
