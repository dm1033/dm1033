import { useMemo } from 'react'
import { DISCLAIMER } from '../types'
import { ACHIEVEMENTS, loadLeaderboard, loadProfile } from '../state/profile'
import { DIFFICULTIES, rankFor } from '../engine/game'

interface Props {
  onStart: () => void
  onTutor: () => void
  onResume?: () => void
}

export default function HomeScreen({ onStart, onTutor, onResume }: Props) {
  const profile = useMemo(() => loadProfile(), [])
  const board = useMemo(() => loadLeaderboard().slice(0, 5), [])
  const { rank, next, progress } = rankFor(profile.xp)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">🚧</div>
        <h1 className="text-4xl font-extrabold tracking-tight">Construction Phase Planner</h1>
        <p className="text-xl text-amber-400 font-semibold mt-1">SMSTS Safety Challenge</p>
        <p className="text-lg text-slate-200 font-semibold mt-3">Plan it. Build it. Hand it over. Don't get shut down.</p>
        <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
          Run a live project as Site Manager. Every shortcut stays on site as a hidden risk that can come
          back weeks later as an incident, an HSE notice or a blown budget. Protect your people, your
          contingency and your programme from mobilisation to handover.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        <button
          onClick={onStart}
          className="sm:col-span-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xl px-6 py-5 transition-colors anim-glow"
        >
          ▶ New project
          <span className="block text-sm font-normal mt-1">3 projects · 3 difficulty levels · new incidents every run</span>
        </button>
        <div className="grid gap-3">
          {onResume && (
            <button onClick={onResume} className="rounded-xl bg-emerald-700 hover:bg-emerald-600 font-bold px-4 py-3">
              ⏯ Resume project
            </button>
          )}
          <button onClick={onTutor} className="rounded-xl bg-slate-800 hover:bg-slate-700 font-bold px-4 py-3">
            🎓 Tutor console
            <span className="block text-xs font-normal text-slate-300">Pause, reveal, leaderboard, custom questions</span>
          </button>
        </div>
      </div>

      {/* Career */}
      <div className="grid md:grid-cols-[1.1fr_1fr] gap-4 mb-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Your career</div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{rank.icon}</span>
            <div className="flex-1">
              <div className="text-lg font-extrabold">{rank.title}</div>
              <div className="text-xs text-slate-400">
                {profile.xp.toLocaleString('en-GB')} XP · {profile.games} project{profile.games === 1 ? '' : 's'} completed
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {next ? `${(next.min - profile.xp).toLocaleString('en-GB')} XP to ${next.icon} ${next.title}` : 'Top of the ladder.'}
          </div>
          <div className="mt-4 text-xs font-bold text-slate-400 mb-1">
            Badges {profile.achievements.length}/{ACHIEVEMENTS.length}
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {ACHIEVEMENTS.map((a) => {
              const got = profile.achievements.includes(a.id)
              return (
                <div
                  key={a.id}
                  title={`${a.title}: ${a.desc}${got ? '' : ' (locked)'}`}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xl border ${
                    got ? 'border-amber-500/60 bg-amber-500/10' : 'border-slate-800 bg-slate-950 grayscale opacity-30'
                  }`}
                >
                  {a.icon}
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">🏆 Hall of fame (this device)</div>
          {board.length === 0 ? (
            <p className="text-sm text-slate-500">No completed projects yet. Be the first name on the board.</p>
          ) : (
            <ol className="space-y-1.5 text-sm">
              {board.map((e, i) => (
                <li key={e.id} className="flex items-center gap-2">
                  <span className="w-6 text-center font-bold text-amber-400">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
                  <span className="flex-1 min-w-0 truncate">
                    <b>{e.name}</b> <span className="text-slate-500 text-xs">· {e.scenarioTitle.replace(/^Scenario \d+ — /, '')} · {DIFFICULTIES[e.difficulty]?.label}</span>
                  </span>
                  <span className={`tabular-nums font-bold ${e.shutdown ? 'text-red-400' : 'text-slate-100'}`}>{e.points.toLocaleString('en-GB')}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* How to play */}
      <h2 className="text-lg font-bold mb-3">How the game works</h2>
      <div className="grid md:grid-cols-4 gap-3 text-sm mb-8">
        {[
          { icon: '🗂️', title: '1 · Plan', body: 'Appoint duty holders, sequence the work, lay out the site, build the CPP, TW register and permits.' },
          { icon: '🎯', title: '2 · Decide and commit', body: 'Answers are shuffled and look plausible. Commit as Certain, Fairly sure or Unsure: confidence multiplies the reward and the penalty.' },
          { icon: '🗓️', title: '3 · Survive the site weeks', body: 'After each phase a week passes. Shortcuts can fire as incidents, RIDDOR reports and HSE notices; three critical failures (strikes) bring a prohibition. Close risks out before they bite.' },
          { icon: '🏁', title: '4 · Hand over', body: 'On time, on budget, no harm? Earn bonuses, badges and XP, then review every decision in a full set of printable reports.' },
        ].map((c) => (
          <div key={c.title} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="font-semibold mb-1">{c.title}</div>
            <div className="text-slate-400">{c.body}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 leading-relaxed">
        <p className="font-semibold text-slate-300 mb-1">Disclaimer</p>
        <p>{DISCLAIMER}</p>
        <p className="mt-2">
          This is an SMSTS-aligned learning game based on construction site safety principles. It
          supports revision and practical understanding. It is not endorsed or approved by CITB and
          does not replace formal CITB training, assessment or certification.
        </p>
      </div>
    </div>
  )
}
