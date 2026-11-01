import { useMemo, useState } from 'react'
import type { SequenceStep } from '../types'
import { useGame } from '../state/GameContext'
import { DIFFICULTIES, rngFor, shuffleWith } from '../engine/game'
import { assessSequence } from '../engine/scoring'
import { sfx } from '../engine/sound'

interface Props {
  step: SequenceStep
  reveal: boolean
  onSubmit: (order: string[]) => void
  onContinue: () => void
}

export default function SequenceBuilder({ step, reveal, onSubmit, onContinue }: Props) {
  const { state } = useGame()
  const defer = DIFFICULTIES[state.game.difficulty].deferFeedback
  const correct = step.activities.map((a) => a.id)

  const initial = useMemo(() => {
    const shuffled = shuffleWith(correct, rngFor(state.game.seed, `seq:${step.id}`))
    // Never hand the delegate the answer.
    if (shuffled.every((id, i) => id === correct[i])) shuffled.reverse()
    return shuffled
  }, [step.id, state.game.seed]) // eslint-disable-line react-hooks/exhaustive-deps

  const [order, setOrder] = useState<string[]>(initial)
  const [dragId, setDragId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const byId = (id: string) => step.activities.find((a) => a.id === id)!
  const result = submitted ? assessSequence(step, order) : null

  const move = (from: number, to: number) => {
    if (submitted || to < 0 || to >= order.length || from === to) return
    setOrder((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
    sfx.tick()
  }

  const submit = () => {
    setSubmitted(true)
    onSubmit(order)
    const a = assessSequence(step, order)
    if (defer) sfx.click()
    else if (a.perfect) sfx.fanfare()
    else if (a.criticalViolated.length) sfx.bad()
    else sfx.ok()
  }

  // Positions whose activity is involved in a violated constraint.
  const badIds = new Set(result && !defer ? result.violated.flatMap((c) => [c.before, c.after]) : [])

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 anim-rise">
      <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Mini-game · Plan the sequence</div>
      <h3 className="text-lg font-semibold leading-snug">{step.prompt}</h3>
      {step.context && <p className="text-sm text-slate-400 mt-1">{step.context}</p>}
      <p className="text-[11px] text-slate-500 mt-1 mb-4">
        Drag the activities (or use ▲▼) into a safe, buildable order, first at the top. Scored on every
        dependency you respect; getting a critical hold point out of order is a critical safety failure.
      </p>

      <ol className="space-y-1.5">
        {order.map((id, i) => {
          const a = byId(id)
          const bad = badIds.has(id)
          const inPlace = submitted && !defer && correct[i] === id
          return (
            <li
              key={id}
              draggable={!submitted}
              onDragStart={(e) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id) }}
              onDragOver={(e) => { if (!submitted) e.preventDefault() }}
              onDrop={(e) => {
                e.preventDefault()
                const src = dragId ?? e.dataTransfer.getData('text/plain')
                if (src) move(order.indexOf(src), i)
                setDragId(null)
              }}
              onDragEnd={() => setDragId(null)}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                dragId === id ? 'opacity-40' : ''
              } ${
                submitted && !defer
                  ? bad ? 'border-red-700 bg-red-950/30' : 'border-emerald-800 bg-emerald-950/20'
                  : 'border-slate-700 bg-slate-900 cursor-grab active:cursor-grabbing hover:border-slate-500'
              } ${reveal && !submitted && correct[i] === id ? 'outline outline-1 outline-amber-600' : ''}`}
            >
              <span className="w-7 h-7 shrink-0 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-300">{i + 1}</span>
              <span className="flex-1 min-w-0">
                <span className="font-semibold text-slate-100">{a.label}</span>
                {a.detail && <span className="block text-xs text-slate-400">{a.detail}</span>}
              </span>
              {inPlace && <span className="text-emerald-400 text-xs font-bold">✓</span>}
              {!submitted && (
                <span className="flex flex-col">
                  <button aria-label={`Move ${a.label} up`} onClick={() => move(i, i - 1)} disabled={i === 0} className="px-2 leading-none text-slate-400 hover:text-amber-300 disabled:opacity-20">▲</button>
                  <button aria-label={`Move ${a.label} down`} onClick={() => move(i, i + 1)} disabled={i === order.length - 1} className="px-2 leading-none text-slate-400 hover:text-amber-300 disabled:opacity-20">▼</button>
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {!submitted ? (
        <button onClick={submit} className="mt-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5">
          🔒 Lock in sequence
        </button>
      ) : (
        <div className="mt-4 space-y-3 anim-rise">
          {defer ? (
            <div className="rounded-lg border border-sky-800 bg-sky-950/30 p-3 text-sm text-sky-200">
              📝 Sequence logged and issued to site. If anything is out of order, site will find out the hard way.
            </div>
          ) : result && (
            <>
              <div className={`rounded-lg border p-3 text-sm ${result.perfect ? 'border-emerald-700 bg-emerald-950/30 text-emerald-200' : 'border-slate-700 bg-slate-900'}`}>
                <b>{result.satisfied.length}/{step.constraints.length} dependencies respected.</b>
                {result.perfect && ' Perfect sequence: every hold point in the right place.'}
                {result.criticalViolated.length > 0 && <span className="text-red-400 font-bold"> {result.criticalViolated.length} critical hold point(s) out of order.</span>}
              </div>
              {result.violated.length > 0 && (
                <ul className="space-y-1.5 text-xs">
                  {result.violated.map((c) => (
                    <li key={`${c.before}-${c.after}`} className={`rounded border p-2 ${c.critical ? 'border-red-700 bg-red-950/30 text-red-200' : 'border-amber-800 bg-amber-950/20 text-amber-200'}`}>
                      {c.critical && <b>CRITICAL · </b>}<b>{byId(c.before).label}</b> must come before <b>{byId(c.after).label}</b>. {c.reason}
                    </li>
                  ))}
                </ul>
              )}
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300">
                <p className="font-bold text-slate-400 mb-1">Model sequence</p>
                <ol className="list-decimal pl-5 space-y-0.5">
                  {step.activities.map((a) => <li key={a.id}>{a.label}</li>)}
                </ol>
              </div>
              <div className="rounded-lg border border-sky-900 bg-sky-950/30 p-3 text-sm text-sky-200">
                <p className="font-bold text-xs text-sky-400 mb-1">📘 Learning note: {step.topic}</p>
                <p>{step.learningNote}</p>
              </div>
            </>
          )}
          <button onClick={onContinue} className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5">
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
