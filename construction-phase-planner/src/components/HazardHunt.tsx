import { useCallback, useMemo, useState } from 'react'
import type { HazardHuntStep } from '../types'
import { useGame } from '../state/GameContext'
import { DIFFICULTIES, rngFor, shuffleWith } from '../engine/game'
import { assessHunt } from '../engine/scoring'
import { useCountdown, TimerBar } from './useCountdown'
import { sfx } from '../engine/sound'

interface Props {
  step: HazardHuntStep
  reveal: boolean
  paused: boolean
  onSubmit: (flagged: string[], secondsLeft: number) => void
  onContinue: () => void
}

export default function HazardHunt({ step, reveal, paused, onSubmit, onContinue }: Props) {
  const { state } = useGame()
  const diff = DIFFICULTIES[state.game.difficulty]
  const defer = diff.deferFeedback
  const limit = Math.round(step.timeLimit * diff.huntTimeFactor)
  const [started, setStarted] = useState(false)
  const [flagged, setFlagged] = useState<string[]>([])
  const [done, setDone] = useState<{ secondsLeft: number } | null>(null)

  const tiles = useMemo(
    () => shuffleWith(step.observations, rngFor(state.game.seed, `hunt:${step.id}`)),
    [step, state.game.seed],
  )
  const hazardCount = step.observations.filter((o) => o.hazard).length

  const submit = useCallback((secondsLeft: number) => {
    if (done) return
    setDone({ secondsLeft: Math.floor(secondsLeft) })
    onSubmit(flagged, Math.floor(secondsLeft))
    const a = assessHunt(step, flagged)
    if (defer) sfx.click()
    else if (a.missed.length === 0 && a.falseFlags.length === 0) sfx.fanfare()
    else if (a.found.length >= a.missed.length) sfx.ok()
    else sfx.bad()
  }, [done, flagged, onSubmit, step, defer])

  const remaining = useCountdown(started ? limit : null, started && !done && !paused, () => submit(0))

  const toggle = (id: string) => {
    if (!started || done) return
    sfx.tick()
    setFlagged((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const result = done ? assessHunt(step, flagged) : null

  if (!started) {
    return (
      <div className="rounded-xl border border-amber-700 bg-amber-950/20 p-6 anim-rise">
        <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Mini-game · Hazard hunt</div>
        <h3 className="text-xl font-bold mb-1">🔦 Site walk-round</h3>
        <p className="text-sm text-slate-300 mb-1">{step.location}</p>
        <p className="text-sm text-slate-400 mb-4">{step.prompt}</p>
        <ul className="text-sm text-slate-300 space-y-1 mb-5">
          <li>⏱ You have <b>{limit} seconds</b> to walk the site.</li>
          <li>🚩 Tap every observation that is a <b>hazard needing action</b>. Some things are being done right: leave those alone.</li>
          <li>⭐ Points for every hazard found (more for high-severity ones) and a time bonus for a clean sweep.</li>
          <li>❌ False alarms cost points and credibility. Missed hazards stay on site and raise incident likelihood.</li>
        </ul>
        <button
          onClick={() => { setStarted(true); sfx.click() }}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 anim-glow"
        >
          ▶ Start the walk-round
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="sticky top-14 z-10 -mx-5 -mt-5 mb-2 rounded-t-xl border-b border-slate-800 bg-slate-900/95 backdrop-blur px-5 pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h3 className="text-base font-semibold mr-auto">🔦 {step.location}</h3>
          <span className="text-sm font-bold text-amber-300">🚩 {flagged.length} flagged</span>
        </div>
        {!done && <TimerBar remaining={remaining} total={limit} />}
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-2">
        {tiles.map((o) => {
          const isFlagged = flagged.includes(o.id)
          let cls = isFlagged ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400' : 'border-slate-700 bg-slate-900 hover:border-slate-500'
          let badge: string | null = null
          if (result && !defer) {
            if (o.hazard && isFlagged) { cls = 'border-emerald-600 bg-emerald-950/40'; badge = '✓ Hazard found' }
            else if (o.hazard && !isFlagged) { cls = 'border-red-600 bg-red-950/40'; badge = '✗ Missed hazard' }
            else if (!o.hazard && isFlagged) { cls = 'border-amber-600 bg-amber-950/30'; badge = '⚠ False alarm' }
            else { cls = 'border-slate-800 bg-slate-900/40 text-slate-400'; badge = 'Acceptable' }
          } else if (reveal && o.hazard && !result) {
            cls += ' outline outline-1 outline-amber-600'
          }
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              disabled={!!done}
              aria-pressed={isFlagged}
              className={`relative text-left rounded-lg border p-3 text-sm transition-colors ${cls}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl leading-none">{o.icon}</span>
                <span className="flex-1 text-slate-200">{o.text}</span>
                {isFlagged && <span className="text-base">🚩</span>}
              </div>
              {badge && <div className="mt-2 text-[10px] font-bold uppercase tracking-wide">{badge}{o.hazard && o.severity ? ` · ${o.severity}` : ''}</div>}
              {result && !defer && <div className="mt-1 text-xs text-slate-400">{o.explanation}</div>}
            </button>
          )
        })}
      </div>

      {!done ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => submit(remaining ?? 0)}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5"
          >
            Finish walk-round
          </button>
          <span className="text-xs text-slate-500">Some observations are hazards; others are good practice. Read carefully.</span>
        </div>
      ) : (
        <div className="mt-4 space-y-3 anim-rise">
          {!defer && result ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm flex flex-wrap gap-4">
              <span className="text-emerald-400 font-bold">✓ {result.found.length}/{hazardCount} hazards found</span>
              <span className="text-red-400 font-bold">✗ {result.missed.length} missed</span>
              <span className="text-amber-400 font-bold">⚠ {result.falseFlags.length} false alarm(s)</span>
              {result.missed.length === 0 && <span className="text-sky-300 font-bold">⏱ {done.secondsLeft}s to spare</span>}
            </div>
          ) : (
            <div className="rounded-lg border border-sky-800 bg-sky-950/30 p-3 text-sm text-sky-200">
              📝 Walk-round logged: you flagged {flagged.length} observation(s). Anything you missed is still out there.
            </div>
          )}
          {!defer && (
            <div className="rounded-lg border border-sky-900 bg-sky-950/30 p-3 text-sm text-sky-200">
              <p className="font-bold text-xs text-sky-400 mb-1">📘 Learning note: {step.topic}</p>
              <p>{step.learningNote}</p>
            </div>
          )}
          <button onClick={onContinue} className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5">
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
