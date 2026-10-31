import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Confidence, DecisionStep, DecisionOption } from '../types'
import { useGame } from '../state/GameContext'
import {
  CONFIDENCE_LABELS, DIFFICULTIES, decisionEconomy, fmtDays, fmtMoney, lifelineRemovals, shuffledOptions,
} from '../engine/game'
import { useCountdown, TimerBar } from './useCountdown'
import { sfx } from '../engine/sound'

const QUALITY_STYLE: Record<string, { label: string; cls: string }> = {
  best: { label: 'BEST ANSWER', cls: 'text-emerald-400 border-emerald-700 bg-emerald-950/40' },
  partial: { label: 'PARTIALLY CORRECT', cls: 'text-amber-400 border-amber-700 bg-amber-950/40' },
  poor: { label: 'POOR CHOICE', cls: 'text-orange-400 border-orange-700 bg-orange-950/40' },
  unsafe: { label: 'UNSAFE', cls: 'text-red-400 border-red-700 bg-red-950/40' },
}

const CONFIDENCES: Confidence[] = ['sure', 'think', 'guess']

export function timeoutOption(step: DecisionStep): DecisionOption {
  return {
    id: 'timeout',
    text: 'No decision made in time',
    quality: 'poor',
    impact: { incidentLikelihood: 5, enforcementRisk: 3 },
    feedback: 'The clock ran out. On site, indecision is still a decision: the situation carried on unmanaged while you deliberated.',
    consequence: `Nobody took control of "${step.topic}" when it mattered, and the problem was still live when it next came to a head on site.`,
  }
}

interface Props {
  step: DecisionStep
  reveal: boolean
  paused: boolean
  onAnswer: (option: DecisionOption, confidence: Confidence, timeFrac: number | null, timedOut: boolean) => void
  onContinue: () => void
}

export default function DecisionCard({ step, reveal, paused, onAnswer, onContinue }: Props) {
  const { state, dispatch, scenario } = useGame()
  const g = state.game
  const diff = DIFFICULTIES[g.difficulty]
  const defer = diff.deferFeedback
  const [selected, setSelected] = useState<string | null>(null)
  const [chosen, setChosen] = useState<DecisionOption | null>(null)
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  const options = useMemo(() => shuffledOptions(step, g.seed), [step, g.seed])
  const lifelineUsed = g.lifelineSteps.includes(step.id)
  const removed = useMemo(() => (lifelineUsed ? lifelineRemovals(step, g.seed) : []), [lifelineUsed, step, g.seed])
  const total = step.isEvent ? diff.eventTimer : diff.decisionTimer

  useEffect(() => {
    if (step.isEvent) sfx.alarm()
  }, [step.id, step.isEvent])

  const expire = useCallback(() => {
    if (chosen) return
    const opt = timeoutOption(step)
    setChosen(opt)
    setTimedOut(true)
    setConfidence('guess')
    sfx.bad()
    onAnswer(opt, 'guess', 0, true)
  }, [chosen, step, onAnswer])

  const remaining = useCountdown(total, !chosen && !paused, expire)

  const commit = useCallback((conf: Confidence) => {
    if (chosen || !selected) return
    const opt = options.find((o) => o.id === selected)
    if (!opt) return
    setChosen(opt)
    setConfidence(conf)
    if (defer) sfx.click()
    else if (opt.quality === 'best') sfx.good()
    else if (opt.quality === 'partial') sfx.ok()
    else sfx.bad()
    onAnswer(opt, conf, total && remaining !== null ? remaining / total : null, false)
  }, [chosen, selected, options, defer, onAnswer, total, remaining])

  // Keyboard: A–D / 1–4 select, S/F/G (or Enter) commit, Enter continues.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const k = e.key.toLowerCase()
      // A focused button already turns Enter into a click; don't handle it twice.
      if (k === 'enter' && e.target instanceof HTMLButtonElement) return
      if (chosen) {
        if (k === 'enter') { e.preventDefault(); onContinue() }
        return
      }
      const idx = 'abcd'.indexOf(k) >= 0 ? 'abcd'.indexOf(k) : '1234'.indexOf(k)
      if (idx >= 0 && idx < options.length && !removed.includes(options[idx].id)) {
        setSelected(options[idx].id)
        sfx.click()
        return
      }
      if (!selected) return
      if (k === 's') commit('sure')
      else if (k === 'f' || k === 'enter') { e.preventDefault(); commit('think') }
      else if (k === 'g') commit('guess')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [chosen, selected, options, removed, commit, onContinue, paused])

  const myPoints = chosen ? state.decisions.find((d) => d.stepId === step.id)?.points : undefined
  const eco = chosen && scenario && !timedOut ? decisionEconomy(chosen, scenario) : null
  const isRisky = chosen && (chosen.quality === 'poor' || chosen.quality === 'unsafe')

  return (
    <div className={`rounded-xl border p-5 anim-rise ${step.isEvent ? 'border-red-800 bg-red-950/20' : 'border-slate-800 bg-slate-900/50'} ${chosen && !defer && isRisky ? 'anim-shake' : ''}`}>
      {step.isEvent && (
        <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-3 animate-pulse">
          🚨 SITE INCIDENT: respond now
        </div>
      )}
      <h3 className="text-lg font-semibold leading-snug">{step.prompt.replace(/^EVENT:\s*/, '')}</h3>
      {step.context && <p className="text-slate-400 text-sm mt-2">{step.context}</p>}
      <p className="text-[11px] text-slate-500 mt-1">Topic: {step.topic}</p>

      {total !== null && !chosen && (
        <div className="mt-3">
          <TimerBar remaining={remaining} total={total} />
        </div>
      )}

      <div className="mt-4 space-y-2" role="radiogroup" aria-label="Answer options">
        {options.map((o, idx) => {
          const isRemoved = removed.includes(o.id)
          const showQuality = (chosen !== null && !defer) || (reveal && o.quality === 'best')
          const isChosen = chosen?.id === o.id
          const isSelected = !chosen && selected === o.id
          const style = QUALITY_STYLE[o.quality]
          let cls = 'border-slate-700 bg-slate-900 hover:border-amber-500 cursor-pointer'
          if (isRemoved) cls = 'border-slate-800 bg-slate-950 text-slate-600 line-through cursor-not-allowed'
          else if (showQuality && (isChosen || o.quality === 'best')) cls = style.cls
          else if (chosen && isChosen) cls = 'border-sky-600 bg-sky-950/40 text-sky-100'
          else if (chosen) cls = 'border-slate-800 bg-slate-900/30 text-slate-500'
          else if (isSelected) cls = 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400'
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={isSelected || isChosen}
              onClick={() => { if (!chosen && !isRemoved) { setSelected(o.id); sfx.click() } }}
              disabled={chosen !== null || isRemoved}
              className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${cls}`}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
              {o.text}
              {isRemoved && <span className="block mt-1 text-[10px] font-bold no-underline">🛟 Adviser: not this one</span>}
              {showQuality && (isChosen || o.quality === 'best') && (
                <span className="block mt-1 text-[10px] font-bold tracking-wide">
                  {style.label}{reveal && !chosen && o.quality === 'best' ? ' (revealed by tutor)' : ''}
                </span>
              )}
              {defer && isChosen && <span className="block mt-1 text-[10px] font-bold tracking-wide text-sky-300">YOUR DECISION</span>}
            </button>
          )
        })}
      </div>

      {!chosen && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">{selected ? 'Commit with confidence:' : 'Select an answer (A–D), then commit.'}</span>
            {CONFIDENCES.map((c) => (
              <button
                key={c}
                disabled={!selected}
                onClick={() => commit(c)}
                title={CONFIDENCE_LABELS[c].hint}
                className={`rounded-lg px-3 py-2 text-sm font-bold border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  c === 'sure'
                    ? 'border-emerald-600 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-200'
                    : c === 'think'
                      ? 'border-amber-500 bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {CONFIDENCE_LABELS[c].label} <span className="opacity-60 text-[10px] font-normal">[{CONFIDENCE_LABELS[c].key}]</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span>Certain: ×1.5 if right, double penalty if wrong · Unsure: lower reward, half penalty.</span>
            {!lifelineUsed && (
              <button
                disabled={g.lifelines <= 0}
                onClick={() => { dispatch({ type: 'USE_LIFELINE', stepId: step.id }); sfx.click() }}
                className="ml-auto rounded-md border border-sky-700 bg-sky-950/40 px-2.5 py-1.5 text-sky-300 font-semibold hover:bg-sky-900/40 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Removes two wrong answers. Halves the points for this question."
              >
                🛟 Call the H&amp;S Adviser ({g.lifelines} left)
              </button>
            )}
          </div>
        </div>
      )}

      {chosen && (
        <div className="mt-4 space-y-3 anim-rise">
          {timedOut && (
            <div className="rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">
              <p className="font-bold text-xs mb-1">⏱ OUT OF TIME</p>
              <p>{chosen.feedback}</p>
            </div>
          )}
          {!defer && !timedOut && (
            <div className={`rounded-lg border p-3 text-sm ${QUALITY_STYLE[chosen.quality].cls}`}>
              <p className="font-bold text-xs mb-1">
                {QUALITY_STYLE[chosen.quality].label}
                {confidence && <span className="font-normal opacity-80"> · you were {CONFIDENCE_LABELS[confidence].label.toLowerCase()}</span>}
              </p>
              <p>{chosen.feedback}</p>
            </div>
          )}
          {defer && !timedOut && (
            <div className="rounded-lg border border-sky-800 bg-sky-950/30 p-3 text-sm text-sky-200">
              <p className="font-bold text-xs text-sky-400 mb-1">📝 DECISION LOGGED</p>
              <p>Expert mode: nobody marks your homework on a live project. If this was the wrong call, you will find out on site, or in your handover report.</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            {!defer && myPoints !== undefined && (
              <span className={`rounded-full px-2.5 py-1 font-bold ${myPoints >= 0 ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
                {myPoints >= 0 ? '+' : ''}{myPoints} pts
              </span>
            )}
            {eco && eco.cost !== 0 && (
              <span className={`rounded-full px-2.5 py-1 font-bold ${eco.cost > 0 ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
                💷 {eco.cost > 0 ? `${fmtMoney(eco.cost)} spent` : `${fmtMoney(-eco.cost)} saved`}
              </span>
            )}
            {eco && eco.days !== 0 && (
              <span className={`rounded-full px-2.5 py-1 font-bold ${eco.days < 0 ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
                📅 {fmtDays(eco.days)} float
              </span>
            )}
          </div>

          {!defer && isRisky && (
            <div className="rounded-lg border border-orange-800 bg-orange-950/30 p-3 text-xs text-orange-200">
              ⚠ <b>This shortcut is now a live risk on site.</b> It may cause an incident in a later week unless you
              close it out at a weekly site review. Major risks bite harder and more often.
            </div>
          )}
          {!defer && (
            <div className="rounded-lg border border-sky-900 bg-sky-950/30 p-3 text-sm text-sky-200">
              <p className="font-bold text-xs text-sky-400 mb-1">📘 Learning note: {step.topic}</p>
              <p>{step.learningNote}</p>
            </div>
          )}
          <button
            onClick={onContinue}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5"
          >
            Continue → <span className="opacity-60 text-xs font-normal">[Enter]</span>
          </button>
        </div>
      )}
    </div>
  )
}
