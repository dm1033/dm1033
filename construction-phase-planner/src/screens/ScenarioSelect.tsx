import { useState } from 'react'
import { SCENARIOS } from '../data'
import { useGame } from '../state/GameContext'
import type { GameMode } from '../types'

const MODES: { id: GameMode; label: string; desc: string }[] = [
  { id: 'learning', label: '📖 Learning Mode', desc: 'Immediate feedback and explanations after every decision.' },
  { id: 'assessment', label: '📝 Assessment Mode', desc: 'Decisions are recorded silently; feedback and model answers appear only in the final report.' },
  { id: 'tutor', label: '🎓 Tutor-Led Mode', desc: 'Learning mode plus tutor pause, discussion and selective reveal.' },
  { id: 'demo', label: '🎬 Demonstration Mode', desc: 'Guided 10–15 minute walkthrough with a docked demo script for presentations.' },
]

export default function ScenarioSelect({ onStarted }: { onStarted: () => void }) {
  const { state, dispatch } = useGame()
  const [name, setName] = useState(state.delegateName)
  const [chosen, setChosen] = useState<string | null>(null)
  const [mode, setMode] = useState<GameMode>('learning')

  const start = () => {
    if (!chosen) return
    dispatch({ type: 'START_SCENARIO', scenarioId: chosen, delegateName: name.trim() || 'Delegate', mode })
    onStarted()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-1">Choose your project</h2>
      <p className="text-slate-400 mb-6 text-sm">
        You are the Site Manager. Pick a scenario — each one covers different SMSTS learning areas.
      </p>

      <label className="block mb-6 max-w-sm">
        <span className="text-sm text-slate-300">Delegate name (appears on reports)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 focus:outline-none focus:border-amber-500"
        />
      </label>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setChosen(s.id)}
            className={`text-left rounded-xl border p-4 transition-colors ${
              chosen === s.id
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
            }`}
          >
            <div className="font-bold mb-1">{s.title}</div>
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
          </button>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-300 mb-2">Choose a mode</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                mode === m.id ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
              }`}
            >
              <div className="text-sm font-semibold">{m.label}</div>
              <div className="text-[11px] text-slate-400 mt-1">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {state.scenarioId && !state.completed && (
        <p className="text-amber-400 text-sm mb-4">
          ⚠ Starting a new scenario will discard your current game in progress.
        </p>
      )}

      <button
        onClick={start}
        disabled={!chosen}
        className="rounded-lg bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 text-slate-950 font-bold px-8 py-3"
      >
        Start Project
      </button>
    </div>
  )
}
