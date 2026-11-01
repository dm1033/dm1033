import { useEffect, useState } from 'react'
import { useGame } from '../state/GameContext'
import { DIFFICULTIES, fmtDays, fmtMoney } from '../engine/game'
import type { PointsAward } from '../types'

/** Heads-up display: the project's resources and the player's score. */
export default function Hud() {
  const { state } = useGame()
  const g = state.game
  const diff = DIFFICULTIES[g.difficulty]
  const sealed = diff.deferFeedback
  const [pop, setPop] = useState<PointsAward | null>(null)

  useEffect(() => {
    if (!g.lastAward || sealed) return
    setPop(g.lastAward)
    const id = window.setTimeout(() => setPop(null), 1600)
    return () => window.clearTimeout(id)
  }, [g.lastAward?.seq, sealed]) // eslint-disable-line react-hooks/exhaustive-deps

  const budgetPct = g.budgetStart > 0 ? Math.max(0, Math.min(1, g.budget / g.budgetStart)) : 0
  const floatPct = g.floatStart > 0 ? Math.max(0, Math.min(1, g.floatDays / g.floatStart)) : 0
  const weekLabel = g.week === 0 ? 'Pre-start' : `Wk ${g.week}/${g.weeksTotal}`

  return (
    <div className="no-print rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 mb-3 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center relative">
      <Stat
        icon="💷"
        label="Contingency"
        value={fmtMoney(g.budget)}
        tone={g.budget < 0 ? 'bad' : budgetPct < 0.35 ? 'warn' : 'good'}
        bar={budgetPct}
        title={`Starting contingency ${fmtMoney(g.budgetStart)}. Shortcuts that cause incidents, notices and rework spend it.`}
      />
      <Stat
        icon="📅"
        label="Float"
        value={fmtDays(g.floatDays)}
        tone={g.floatDays < 0 ? 'bad' : floatPct < 0.35 ? 'warn' : 'good'}
        bar={floatPct}
        title={`Programme float in working days (started at ${g.floatStart}). Negative means late.`}
      />
      <Stat icon="🗓️" label="Programme" value={weekLabel} tone="neutral" title="Site weeks pass as each construction phase completes." />
      <Stat
        icon="🦺"
        label="Safe weeks"
        value={`${g.safeWeeks}`}
        tone={g.consequences.length === 0 ? 'good' : 'neutral'}
        title={`Weeks without an incident or notice. Incidents so far: ${g.consequences.length}.`}
      />
      <div className="relative">
        <Stat
          icon={sealed ? '🔒' : '⭐'}
          label={sealed ? 'Score sealed' : 'Points'}
          value={sealed ? '— — —' : g.points.toLocaleString('en-GB')}
          tone="neutral"
          title={sealed ? 'Expert mode: your score is revealed at handover.' : 'Game points. Your competence grade is separate (see Performance).'}
        />
        {pop && (
          <span
            key={pop.seq}
            className={`anim-pop pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-extrabold shadow ${
              pop.amount >= 0 ? 'bg-emerald-500 text-slate-950' : 'bg-red-600 text-white'
            }`}
          >
            {pop.amount >= 0 ? '+' : ''}{pop.amount} {pop.label}
          </span>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 text-sm font-bold">
        {!sealed && (
          <span className="flex flex-col items-center" title="Streak: best answers in a row (bonus points)">
            <span className={g.streak >= 3 ? 'text-orange-400' : 'text-slate-400'}>🔥{g.streak}</span>
            <span className="text-[9px] uppercase tracking-wide text-slate-500 font-normal">Streak</span>
          </span>
        )}
        {!sealed && (
          <span className="flex flex-col items-center" title="HSE strikes: critical safety failures. Three strikes brings a Prohibition Notice at the next site week.">
            <span className="flex gap-0.5" aria-label={`${g.strikes} of 3 strikes`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={i < g.strikes ? 'text-red-500' : 'text-slate-700'}>⚠</span>
              ))}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-slate-500 font-normal">Strikes</span>
          </span>
        )}
        <span className="flex flex-col items-center" title="Call the H&S Adviser: removes two wrong answers, halves the points for that question">
          <span className={g.lifelines > 0 ? 'text-sky-400' : 'text-slate-600'}>🛟{g.lifelines}</span>
          <span className="text-[9px] uppercase tracking-wide text-slate-500 font-normal">Help</span>
        </span>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, tone, bar, title }: {
  icon: string
  label: string
  value: string
  tone: 'good' | 'warn' | 'bad' | 'neutral'
  bar?: number
  title?: string
}) {
  const color = tone === 'bad' ? 'text-red-400' : tone === 'warn' ? 'text-amber-400' : tone === 'good' ? 'text-emerald-400' : 'text-slate-100'
  return (
    <div className="flex flex-col items-center justify-center min-w-0" title={title}>
      <div className="text-[10px] uppercase tracking-wide text-slate-500 truncate">{icon} {label}</div>
      <div className={`text-sm font-extrabold tabular-nums ${color}`}>{value}</div>
      {bar !== undefined && (
        <div className="w-full max-w-[90px] h-1 rounded bg-slate-800 overflow-hidden mt-0.5">
          <div className={`h-full ${tone === 'bad' ? 'bg-red-500' : tone === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${bar * 100}%` }} />
        </div>
      )}
    </div>
  )
}
