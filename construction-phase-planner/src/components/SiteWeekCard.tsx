import { useEffect, useState } from 'react'
import { useGame } from '../state/GameContext'
import { DIFFICULTIES, auditCost, fmtDays, fmtMoney, rectifyCost } from '../engine/game'
import { sfx } from '../engine/sound'

/** Modal shown between construction phases: what happened on site this week. */
export default function SiteWeekCard() {
  const { state, dispatch, scenario } = useGame()
  const g = state.game
  const wk = g.pendingWeek
  const defer = DIFFICULTIES[g.difficulty].deferFeedback
  const [auditMsg, setAuditMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!wk) return
    setAuditMsg(null)
    if (wk.shutdown || wk.notice || wk.consequences.length) sfx.alarm()
    else sfx.good()
  }, [wk?.afterPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!wk || !scenario) return null
  const phase = scenario.phases.find((p) => p.number === wk.afterPhase)
  const open = g.latent.filter((h) => h.status === 'open')
  const visible = defer ? open.filter((h) => h.revealed) : open
  const audit = auditCost(scenario)

  const runAudit = () => {
    const hidden = open.filter((h) => !h.revealed).length
    dispatch({ type: 'AUDIT' })
    sfx.cash()
    setAuditMsg(hidden > 0
      ? `Audit complete: the auditor found ${hidden} latent risk(s) you were not aware of.`
      : 'Audit complete: no further significant latent risks found.')
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="week-title">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className={`rounded-2xl border bg-slate-900 p-6 shadow-2xl anim-rise ${wk.shutdown ? 'border-red-600' : wk.safe ? 'border-emerald-700' : 'border-amber-700'}`}>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Weekly site report</div>
          <h2 id="week-title" className="text-2xl font-extrabold">🗓️ Week {wk.week} of {g.weeksTotal}</h2>
          <p className="text-sm text-slate-400">Phase {wk.afterPhase} complete{phase ? `: ${phase.title}` : ''}</p>
          <div className="mt-3 h-2 rounded bg-slate-800 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${(wk.week / g.weeksTotal) * 100}%` }} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <Tile label="Contingency" value={fmtMoney(g.budget)} bad={g.budget < 0} />
            <Tile label="Float" value={fmtDays(g.floatDays)} bad={g.floatDays < 0} />
            <Tile label="Safe weeks" value={`${g.safeWeeks}`} bad={false} />
          </div>

          {wk.shutdown && (
            <div className="mt-5 rounded-xl border-2 border-red-600 bg-red-950/60 p-5 text-center anim-shake">
              <div className="text-4xl mb-1">⛔</div>
              <div className="text-xl font-extrabold text-red-300">PROJECT SHUT DOWN</div>
              <p className="text-sm text-red-200 mt-1">
                HSE has prohibited further work. The client has suspended the contract pending an investigation.
                Your project ends here. Read the report to see how it went wrong.
              </p>
            </div>
          )}

          {wk.safe && (
            <div className="mt-5 rounded-xl border border-emerald-700 bg-emerald-950/30 p-4">
              <div className="font-bold text-emerald-300">✅ Safe week: no incidents, no enforcement.</div>
              <p className="text-sm text-emerald-200/80 mt-1">
                Good planning is invisible: nothing happened because you controlled it.
                {!defer && wk.points > 0 && <b> +{wk.points} pts</b>}
              </p>
            </div>
          )}

          {wk.consequences.map((c) => (
            <div key={c.hazardId} className={`mt-4 rounded-xl border p-4 ${c.severity === 'major' ? 'border-red-700 bg-red-950/40' : 'border-orange-700 bg-orange-950/30'}`}>
              <div className={`text-xs font-extrabold uppercase tracking-wide ${c.severity === 'major' ? 'text-red-400' : 'text-orange-400'}`}>
                {c.severity === 'major' ? '🚑' : '⚠️'} {c.title}
              </div>
              <p className="mt-1 text-sm text-slate-100">{c.narrative}</p>
              <p className="mt-2 text-xs text-slate-400"><b className="text-slate-300">Root cause traced to:</b> {c.rootCause}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                <Chip tone="bad">💷 −{fmtMoney(c.cost)}</Chip>
                <Chip tone="bad">📅 −{c.days} d</Chip>
                {c.riddor && <Chip tone="bad">📝 RIDDOR report required</Chip>}
                {!defer && <Chip tone="bad">{c.points} pts</Chip>}
              </div>
            </div>
          ))}

          {wk.notice && (
            <div className="mt-4 rounded-xl border-2 border-red-700 bg-slate-950 p-4">
              <div className="text-xs font-extrabold uppercase tracking-wide text-red-400">
                🏛️ HSE {wk.notice.kind === 'prohibition' ? 'Prohibition Notice' : 'Improvement Notice'} served
              </div>
              <p className="mt-1 text-sm text-slate-200">{wk.notice.reason}</p>
              <p className="mt-1 text-xs text-slate-400">
                {wk.notice.kind === 'prohibition'
                  ? 'Affected work stops immediately until the risk is removed. Fee for Intervention is charged for the inspector’s time.'
                  : 'The breaches must be remedied by the date on the notice. Fee for Intervention is charged for the inspector’s time.'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                <Chip tone="bad">💷 −{fmtMoney(wk.notice.cost)}</Chip>
                <Chip tone="bad">📅 −{wk.notice.days} d</Chip>
                {!defer && <Chip tone="bad">{wk.notice.points} pts</Chip>}
              </div>
            </div>
          )}

          {!wk.shutdown && (
            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <h3 className="font-bold">🧰 Weekly risk review</h3>
              {!defer ? (
                <p className="text-xs text-slate-400 mt-1">
                  Shortcuts from earlier decisions that are still live on site. Each one may cause an incident in a
                  future week. Closing one out now costs a little; leaving it can cost a lot.
                </p>
              ) : (
                <div className="mt-1 text-xs text-slate-400 space-y-2">
                  <p>
                    You can't see what you don't know. An independent site audit costs {fmtMoney(audit.cost)} and half a
                    day, and reveals latent risks created by your earlier decisions.
                  </p>
                  <button onClick={runAudit} className="rounded-md border border-sky-700 bg-sky-950/40 px-3 py-1.5 text-sky-300 font-semibold hover:bg-sky-900/40">
                    🔍 Commission site audit ({fmtMoney(audit.cost)}, ½ day)
                  </button>
                  {auditMsg && <p className="text-sky-300 font-semibold">{auditMsg}</p>}
                </div>
              )}

              {visible.length === 0 ? (
                <p className="mt-3 text-sm text-emerald-400">{defer ? (auditMsg ? 'No open risks on the audit list.' : '') : '✓ No open risks from your decisions.'}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {visible.map((h) => {
                    const c = rectifyCost(h, scenario)
                    return (
                      <li key={h.id} className="rounded-lg border border-slate-700 p-3 text-xs flex flex-wrap items-start gap-3">
                        <span className={`rounded px-1.5 py-0.5 font-bold ${h.severity === 'major' ? 'bg-red-900 text-red-200' : 'bg-orange-900 text-orange-200'}`}>
                          {h.severity === 'major' ? 'MAJOR' : 'MINOR'}
                        </span>
                        <span className="flex-1 min-w-[200px]">
                          <b className="text-slate-200">{h.topic}</b>
                          <span className="block text-slate-400">Phase {h.phaseNumber}: "{h.choice}"</span>
                        </span>
                        <button
                          onClick={() => { dispatch({ type: 'RECTIFY', hazardId: h.id }); sfx.cash() }}
                          className="rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5"
                        >
                          Close out ({fmtMoney(c.cost)}, {c.days} d)
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              autoFocus
              onClick={() => { dispatch({ type: 'CLOSE_WEEK' }); sfx.click() }}
              className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3"
            >
              {wk.shutdown ? 'Read the investigation report →' : 'Back to site →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Tile({ label, value, bad }: { label: string; value: string; bad: boolean }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-sm font-extrabold tabular-nums ${bad ? 'text-red-400' : 'text-slate-100'}`}>{value}</div>
    </div>
  )
}

function Chip({ tone, children }: { tone: 'bad' | 'good'; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2 py-0.5 ${tone === 'bad' ? 'bg-red-900/60 text-red-200' : 'bg-emerald-900/60 text-emerald-200'}`}>{children}</span>
  )
}
