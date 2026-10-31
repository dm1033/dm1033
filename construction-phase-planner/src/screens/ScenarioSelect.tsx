import { useMemo, useState } from 'react'
import { SCENARIOS } from '../data'
import { useGame } from '../state/GameContext'
import { DIFFICULTIES, DIFFICULTY_ORDER, economyFor, fmtMoney } from '../engine/game'
import { loadProfile } from '../state/profile'
import { sfx } from '../engine/sound'
import type { Difficulty } from '../types'

const CHALLENGE: Record<string, number> = {
  's1-commercial-extension': 2,
  's2-city-refurb': 3,
  's3-utilities-roadworks': 3,
}

export default function ScenarioSelect({ onStarted }: { onStarted: () => void }) {
  const { state, dispatch } = useGame()
  const [name, setName] = useState(state.delegateName)
  const [chosen, setChosen] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('standard')
  const profile = useMemo(() => loadProfile(), [])

  const scenario = SCENARIOS.find((s) => s.id === chosen) ?? null
  const eco = scenario ? economyFor(scenario, difficulty) : null

  const start = () => {
    if (!chosen) return
    sfx.fanfare()
    dispatch({
      type: 'START_SCENARIO',
      scenarioId: chosen,
      delegateName: name.trim() || 'Delegate',
      difficulty,
      seed: Math.floor(Math.random() * 2 ** 31),
    })
    onStarted()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-1">Choose your project</h2>
      <p className="text-slate-400 mb-6 text-sm">
        You are the Site Manager. Every project has a contingency budget and programme float. Protect both,
        and your people, from mobilisation to handover.
      </p>

      <label className="block mb-6 max-w-sm">
        <span className="text-sm text-slate-300">Delegate name (shown on reports and the leaderboard)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={40}
          className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-amber-500"
        />
      </label>

      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-2">1 · Project</h3>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {SCENARIOS.map((s) => {
          const best = DIFFICULTY_ORDER
            .map((d) => ({ d, pts: profile.bestPoints[`${s.id}:${d}`] }))
            .filter((x) => x.pts !== undefined)
          return (
            <button
              key={s.id}
              onClick={() => { setChosen(s.id); sfx.click() }}
              className={`text-left flex flex-col justify-start rounded-xl border p-4 transition-colors ${
                chosen === s.id
                  ? 'border-amber-500 bg-amber-500/10 anim-glow'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold mb-1">{s.title}</div>
                <div className="text-amber-400 text-xs whitespace-nowrap" title="Challenge rating">
                  {'★'.repeat(CHALLENGE[s.id] ?? 2)}<span className="text-slate-700">{'★'.repeat(3 - (CHALLENGE[s.id] ?? 2))}</span>
                </div>
              </div>
              <div className="text-sm text-slate-400 mb-3">{s.subtitle}</div>
              <div className="text-xs text-slate-500">
                <div>📍 {s.brief.location}</div>
                <div>⏱ {s.brief.duration} · 💷 {s.brief.value}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {s.brief.keyRisks.slice(0, 3).map((r) => (
                  <span key={r} className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">{r}</span>
                ))}
              </div>
              {best.length > 0 && (
                <div className="mt-3 text-[11px] text-amber-300">
                  🏅 Your best: {best.map((b) => `${DIFFICULTIES[b.d].label} ${b.pts!.toLocaleString('en-GB')}`).join(' · ')}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-2">2 · Difficulty</h3>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {DIFFICULTY_ORDER.map((id) => {
          const d = DIFFICULTIES[id]
          const active = difficulty === id
          return (
            <button
              key={id}
              onClick={() => { setDifficulty(id); sfx.click() }}
              className={`text-left flex flex-col justify-start rounded-xl border p-4 transition-colors ${
                active ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold">{d.icon} {d.label}</div>
                <span className="text-[11px] rounded-full bg-slate-800 px-2 py-0.5 text-amber-300 font-bold">×{d.pointsMultiplier} pts</span>
              </div>
              <div className="text-xs text-amber-400 font-semibold mt-0.5">Play as: {d.role}</div>
              <p className="text-sm text-slate-300 mt-2">{d.tagline}</p>
              <ul className="mt-2 space-y-0.5 text-[11px] text-slate-400">
                {d.rules.map((r) => <li key={r}>▸ {r}</li>)}
              </ul>
            </button>
          )
        })}
      </div>

      {scenario && eco && (
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm flex flex-wrap gap-x-6 gap-y-2 anim-rise">
          <span className="font-bold text-slate-200">📦 Mobilisation briefing</span>
          <span>💷 Contingency: <b>{fmtMoney(eco.budgetStart)}</b></span>
          <span>📅 Programme float: <b>{eco.floatStart} days</b></span>
          <span>🗓️ Duration: <b>{eco.weeksTotal} weeks</b></span>
          <span>🛟 Adviser calls: <b>{DIFFICULTIES[difficulty].lifelines}</b></span>
          <span>🚨 Incident events: <b>{DIFFICULTIES[difficulty].eventDraw + DIFFICULTIES[difficulty].surpriseEvents}+</b></span>
        </div>
      )}

      {state.scenarioId && !state.completed && (
        <p className="text-amber-400 text-sm mb-4">
          ⚠ Starting a new project will discard your current game in progress.
        </p>
      )}

      <button
        onClick={start}
        disabled={!chosen}
        className="rounded-lg bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 text-slate-950 font-bold px-8 py-3 text-lg"
      >
        ▶ Mobilise site
      </button>
    </div>
  )
}
