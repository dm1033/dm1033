import { useState } from 'react'
import { useGame } from '../state/GameContext'
import { CPP_SECTIONS, TW_FIELDS } from '../types'
import { findSteps } from '../engine/reports'
import type { TwRegisterStep } from '../types'

type Tab = 'cpp' | 'risk' | 'tw' | 'rams' | 'incidents'

export default function PanelsDrawer() {
  const { state, scenario, tutor } = useGame()
  const [tab, setTab] = useState<Tab>('cpp')
  if (!scenario) return null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'cpp', label: 'CPP' },
    { id: 'risk', label: 'Risk Register' },
    { id: 'tw', label: 'TW Register' },
    { id: 'rams', label: 'RAMS' },
    { id: 'incidents', label: 'Incidents' },
  ]

  const twSteps = findSteps<TwRegisterStep>(scenario, 'twRegister')

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50">
      <div className="flex border-b border-slate-800 text-[11px]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-1 py-2 ${tab === t.id ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-3 max-h-72 overflow-y-auto text-xs space-y-2">
        {tab === 'cpp' && (
          <>
            <p className="text-slate-500">Your Construction Phase Plan builds as you make decisions.</p>
            {CPP_SECTIONS.map((s) => {
              const entries = s.id === 'projectDescription'
                ? [scenario.cppProjectDescription, ...(state.cpp[s.id] ?? [])]
                : state.cpp[s.id] ?? []
              return (
                <div key={s.id}>
                  <div className={`font-semibold ${entries.length ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {entries.length ? '●' : '○'} {s.title}
                  </div>
                  {entries.map((e, i) => (
                    <p key={i} className="text-slate-400 pl-3 mt-0.5">{e}</p>
                  ))}
                </div>
              )
            })}
          </>
        )}
        {tab === 'risk' && (
          state.riskRegister.length === 0 ? (
            <p className="text-slate-500">Hazards you identify will appear here with their controls.</p>
          ) : (
            state.riskRegister.map((r, i) => (
              <div key={i} className="rounded border border-slate-800 p-2">
                <div className="font-semibold text-slate-200">{r.hazard}</div>
                <div className="text-slate-400 mt-0.5">{r.control}</div>
                <div className={`mt-1 text-[10px] font-bold ${r.adequate ? 'text-emerald-400' : 'text-red-400'}`}>
                  {r.adequate ? 'CONTROL ADEQUATE' : 'CONTROL NEEDS REVIEW'}
                </div>
              </div>
            ))
          )
        )}
        {tab === 'tw' && (
          twSteps.flatMap((s) => s.items).length === 0 ? (
            <p className="text-slate-500">No temporary works items identified yet.</p>
          ) : (
            twSteps.flatMap((s) => s.items).map((item) => {
              const ans = state.twAnswers.find((a) => a.itemId === item.id)
              return (
                <div key={item.id} className="rounded border border-slate-800 p-2">
                  <div className="font-semibold text-slate-200">{item.name}</div>
                  {ans ? (
                    <div className="text-slate-400 mt-0.5 grid grid-cols-2 gap-x-2">
                      {TW_FIELDS.map((f) => (
                        <span key={f.key}>
                          {f.label.replace('?', '')}: <b>{String(ans[f.key] ?? '—')}</b>
                        </span>
                      ))}
                      <span>Responsible: <b>{ans.responsible ?? '—'}</b></span>
                    </div>
                  ) : (
                    <div className="text-slate-600 mt-0.5">Not yet assessed</div>
                  )}
                </div>
              )
            })
          )
        )}
        {tab === 'rams' && (
          <>
            <p className="text-slate-500 mb-1">RAMS-related decisions taken so far:</p>
            {state.decisions.filter((d) => d.topic.toLowerCase().includes('rams') || d.topic.toLowerCase().includes('method')).length === 0 && (
              <p className="text-slate-600">None yet — RAMS review comes in phase 7.</p>
            )}
            {state.decisions
              .filter((d) => d.topic.toLowerCase().includes('rams') || d.topic.toLowerCase().includes('method') || d.topic.toLowerCase().includes('scaffold'))
              .map((d) => (
                <div key={d.stepId} className="rounded border border-slate-800 p-2">
                  <div className="text-slate-300">{d.topic}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${d.quality === 'best' ? 'text-emerald-400' : d.quality === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
                    {d.quality.toUpperCase()}
                  </div>
                </div>
              ))}
          </>
        )}
        {tab === 'incidents' && (
          state.incidentLog.length === 0 ? (
            <p className="text-slate-500">No incidents yet. They will come.</p>
          ) : (
            state.incidentLog.map((r, i) => (
              <div key={i} className="rounded border border-slate-800 p-2">
                <div className="text-slate-300">{r.prompt.replace(/^EVENT:\s*/, '')}</div>
                <div className="text-slate-400 mt-0.5">Response: {r.response}</div>
                <div className={`text-[10px] font-bold mt-0.5 ${r.outcomeQuality === 'best' ? 'text-emerald-400' : r.outcomeQuality === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
                  {r.outcomeQuality === 'best' ? 'WELL HANDLED' : r.outcomeQuality === 'partial' ? 'PARTIALLY CONTROLLED' : 'POORLY HANDLED'}
                </div>
              </div>
            ))
          )
        )}
        {tutor.enabled && tutor.customHazards.length > 0 && tab === 'risk' && (
          <div className="rounded border border-amber-800 bg-amber-950/30 p-2">
            <div className="font-semibold text-amber-400 mb-1">Tutor-added hazards to consider:</div>
            {tutor.customHazards.map((h) => <div key={h} className="text-amber-200">• {h}</div>)}
          </div>
        )}
      </div>
    </div>
  )
}
