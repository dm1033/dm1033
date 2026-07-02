import { useState } from 'react'
import type { DecisionStep, DecisionOption } from '../types'

const QUALITY_STYLE: Record<string, { label: string; cls: string }> = {
  best: { label: 'BEST ANSWER', cls: 'text-emerald-400 border-emerald-700 bg-emerald-950/40' },
  partial: { label: 'PARTIALLY CORRECT', cls: 'text-amber-400 border-amber-700 bg-amber-950/40' },
  poor: { label: 'POOR CHOICE', cls: 'text-orange-400 border-orange-700 bg-orange-950/40' },
  unsafe: { label: 'UNSAFE', cls: 'text-red-400 border-red-700 bg-red-950/40' },
}

interface Props {
  step: DecisionStep
  reveal: boolean
  onAnswer: (option: DecisionOption) => void
  onContinue: () => void
}

export default function DecisionCard({ step, reveal, onAnswer, onContinue }: Props) {
  const [chosen, setChosen] = useState<DecisionOption | null>(null)

  const choose = (o: DecisionOption) => {
    if (chosen) return
    setChosen(o)
    onAnswer(o)
  }

  return (
    <div className={`rounded-xl border p-5 ${step.isEvent ? 'border-red-800 bg-red-950/20' : 'border-slate-800 bg-slate-900/50'}`}>
      {step.isEvent && (
        <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-3 animate-pulse">
          🚨 SITE INCIDENT — respond now
        </div>
      )}
      <h3 className="text-lg font-semibold leading-snug">{step.prompt.replace(/^EVENT:\s*/, '')}</h3>
      {step.context && <p className="text-slate-400 text-sm mt-2">{step.context}</p>}
      <p className="text-[11px] text-slate-500 mt-1">Topic: {step.topic}</p>

      <div className="mt-4 space-y-2">
        {step.options.map((o, idx) => {
          const showQuality = chosen !== null || (reveal && o.quality === 'best')
          const isChosen = chosen?.id === o.id
          const style = QUALITY_STYLE[o.quality]
          return (
            <button
              key={o.id}
              onClick={() => choose(o)}
              disabled={chosen !== null}
              className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                showQuality
                  ? isChosen || chosen === null
                    ? style.cls
                    : o.quality === 'best'
                      ? style.cls
                      : 'border-slate-800 bg-slate-900/30 text-slate-500'
                  : 'border-slate-700 bg-slate-900 hover:border-amber-500 cursor-pointer'
              }`}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
              {o.text}
              {showQuality && (isChosen || o.quality === 'best') && (
                <span className="block mt-1 text-[10px] font-bold tracking-wide">
                  {style.label}{reveal && !chosen && o.quality === 'best' ? ' (revealed by tutor)' : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className="mt-4 space-y-3">
          <div className={`rounded-lg border p-3 text-sm ${QUALITY_STYLE[chosen.quality].cls}`}>
            <p className="font-bold text-xs mb-1">{QUALITY_STYLE[chosen.quality].label}</p>
            <p>{chosen.feedback}</p>
          </div>
          <div className="rounded-lg border border-sky-900 bg-sky-950/30 p-3 text-sm text-sky-200">
            <p className="font-bold text-xs text-sky-400 mb-1">📘 Learning note — {step.topic}</p>
            <p>{step.learningNote}</p>
          </div>
          <button
            onClick={onContinue}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
