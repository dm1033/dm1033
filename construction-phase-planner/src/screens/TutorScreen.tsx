import { useMemo, useState } from 'react'
import { useGame } from '../state/GameContext'
import { allDecisionSteps, buildScoreReport, decisionsCsv, downloadText } from '../engine/reports'
import type { CustomQuestion } from '../types'

// Placeholder access code for tutor mode. Training providers replace this
// (or wire it to their licence system) before deployment.
const TUTOR_ACCESS_CODE = 'TUTOR'

export default function TutorScreen({ onSelectScenario, onViewReport }: { onSelectScenario: () => void; onViewReport: () => void }) {
  const { state, scenario, dispatch, tutor, tutorDispatch } = useGame()
  const [code, setCode] = useState('')
  const [unlocked, setUnlocked] = useState(tutor.enabled)

  const report = useMemo(
    () => (scenario && state.decisions.length > 0 ? buildScoreReport(state, scenario) : null),
    [state, scenario],
  )

  if (!unlocked) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16">
        <h2 className="text-xl font-bold mb-2">🎓 Tutor / Admin Mode</h2>
        <p className="text-sm text-slate-400 mb-4">
          Enter the tutor access code. (Demo code: <code className="text-amber-400">TUTOR</code> — replace for production.)
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && code.trim().toUpperCase() === TUTOR_ACCESS_CODE) { setUnlocked(true); tutorDispatch({ type: 'SET_ENABLED', enabled: true }) } }}
          placeholder="Access code"
          className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 mb-3"
        />
        <button
          onClick={() => { if (code.trim().toUpperCase() === TUTOR_ACCESS_CODE) { setUnlocked(true); tutorDispatch({ type: 'SET_ENABLED', enabled: true }) } }}
          className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5"
        >
          Unlock Tutor Mode
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold mr-auto">🎓 Tutor Console</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={tutor.enabled}
            onChange={(e) => tutorDispatch({ type: 'SET_ENABLED', enabled: e.target.checked })}
          />
          Tutor mode active
        </label>
      </div>

      {/* Session controls */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <TutorButton
          label={tutor.paused ? '▶ Resume delegate game' : '⏸ Pause for discussion'}
          desc="Freezes the delegate's screen for group discussion"
          onClick={() => tutorDispatch({ type: 'SET_PAUSED', paused: !tutor.paused })}
          active={tutor.paused}
        />
        <TutorButton
          label={tutor.revealAnswers ? '🙈 Hide correct answers' : '👁 Reveal correct answers'}
          desc="Highlights the best answer on decision cards"
          onClick={() => tutorDispatch({ type: 'SET_REVEAL', reveal: !tutor.revealAnswers })}
          active={tutor.revealAnswers}
        />
        <TutorButton
          label="🗂 Select scenario"
          desc="Start or switch the delegate scenario"
          onClick={onSelectScenario}
        />
        <TutorButton
          label="↻ Reset scenario"
          desc="Clears the delegate's current run"
          onClick={() => { if (confirm('Reset the delegate’s current game? This cannot be undone.')) dispatch({ type: 'RESET' }) }}
        />
      </div>

      {/* Delegate progress */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h3 className="text-lg font-bold mr-auto">Delegate progress</h3>
          {state.decisions.length > 0 && (
            <>
              <button onClick={() => downloadText('delegate-decision-log.csv', decisionsCsv(state))} className="text-xs rounded border border-slate-600 px-2.5 py-1.5 hover:border-amber-500">
                ⬇ Decision log CSV
              </button>
              {state.completed && (
                <button onClick={onViewReport} className="text-xs rounded bg-amber-500 text-slate-950 font-bold px-2.5 py-1.5">
                  Open full report →
                </button>
              )}
            </>
          )}
        </div>
        {!scenario ? (
          <p className="text-sm text-slate-400">No scenario in progress.</p>
        ) : (
          <>
            <p className="text-sm text-slate-400 mb-3">
              <b className="text-slate-200">{state.delegateName || 'Delegate'}</b> · {scenario.title} ·
              Phase {scenario.phases[state.phaseIndex]?.number ?? '—'} of 15
              {state.completed && ' · COMPLETED'}
              {report && <> · Current overall: <b className="text-slate-200">{report.overall}/100 ({report.gradeLabel})</b></>}
            </p>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="text-left text-slate-500 border-b border-slate-800">
                    <th className="py-1.5 pr-2">Ph.</th><th className="py-1.5 pr-2">Decision</th><th className="py-1.5 pr-2">Chosen</th><th className="py-1.5 pr-2">Best answer</th><th className="py-1.5">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {state.decisions.map((d) => {
                    const step = allDecisionSteps(scenario).find((s) => s.id === d.stepId)
                    const chosen = step?.options.find((o) => o.id === d.chosenOptionId)
                    const best = step?.options.find((o) => o.quality === 'best')
                    return (
                      <tr key={d.stepId} className="border-b border-slate-800/50 align-top">
                        <td className="py-1.5 pr-2">{d.phaseNumber}</td>
                        <td className="py-1.5 pr-2 text-slate-400">{d.prompt.replace(/^EVENT:\s*/, '')}</td>
                        <td className="py-1.5 pr-2">{chosen?.text ?? d.chosenOptionId}</td>
                        <td className="py-1.5 pr-2 text-emerald-300/80">{best?.text ?? '—'}</td>
                        <td className={`py-1.5 font-bold ${d.quality === 'best' ? 'text-emerald-400' : d.quality === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
                          {d.quality.toUpperCase()}
                        </td>
                      </tr>
                    )
                  })}
                  {state.decisions.length === 0 && (
                    <tr><td colSpan={5} className="py-3 text-slate-500">No decisions taken yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Custom questions */}
      <CustomQuestionBuilder />

      {/* Custom hazards */}
      <CustomHazards />
    </div>
  )
}

function TutorButton({ label, desc, onClick, active }: { label: string; desc: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${active ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>
    </button>
  )
}

function CustomQuestionBuilder() {
  const { tutor, tutorDispatch } = useGame()
  const [prompt, setPrompt] = useState('')
  const [opts, setOpts] = useState(['', '', '', ''])
  const [correct, setCorrect] = useState(0)
  const [explanation, setExplanation] = useState('')

  const add = () => {
    const filled = opts.map((o) => o.trim()).filter(Boolean)
    if (!prompt.trim() || filled.length < 2 || !explanation.trim()) return
    const q: CustomQuestion = {
      id: `${Date.now()}`,
      prompt: prompt.trim(),
      options: opts.map((o, i) => ({ text: o.trim(), correct: i === correct })).filter((o) => o.text),
      explanation: explanation.trim(),
    }
    tutorDispatch({ type: 'ADD_QUESTION', question: q })
    setPrompt(''); setOpts(['', '', '', '']); setExplanation(''); setCorrect(0)
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-lg font-bold mb-1">Custom questions</h3>
      <p className="text-xs text-slate-400 mb-3">
        Added questions appear as extra events in Phase 12 (Incident / Challenge Events) of the delegate's game.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Question prompt…"
            rows={2}
            className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
          />
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-opt"
                checked={correct === i}
                onChange={() => setCorrect(i)}
                title="Mark as correct answer"
              />
              <input
                value={o}
                onChange={(e) => setOpts((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={`Option ${String.fromCharCode(65 + i)}${correct === i ? ' (correct)' : ''}`}
                className="flex-1 rounded-md bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm"
              />
            </div>
          ))}
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explanation / learning note shown after answering…"
            rows={2}
            className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
          />
          <button onClick={add} className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-sm">
            + Add question
          </button>
        </div>
        <div>
          <div className="text-xs font-bold text-slate-400 mb-2">Question bank ({tutor.customQuestions.length})</div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tutor.customQuestions.map((q) => (
              <div key={q.id} className="rounded border border-slate-700 p-2 text-xs flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-slate-200">{q.prompt}</div>
                  <div className="text-emerald-400 mt-0.5">✓ {q.options.find((o) => o.correct)?.text}</div>
                </div>
                <button onClick={() => tutorDispatch({ type: 'REMOVE_QUESTION', id: q.id })} className="text-red-400 hover:text-red-300">✕</button>
              </div>
            ))}
            {tutor.customQuestions.length === 0 && <p className="text-xs text-slate-500">No custom questions yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomHazards() {
  const { tutor, tutorDispatch } = useGame()
  const [hazard, setHazard] = useState('')
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-lg font-bold mb-1">Custom site hazards</h3>
      <p className="text-xs text-slate-400 mb-3">
        Added hazards appear in the delegate's Risk Register panel as tutor prompts for discussion.
      </p>
      <div className="flex gap-2 mb-3">
        <input
          value={hazard}
          onChange={(e) => setHazard(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && hazard.trim()) { tutorDispatch({ type: 'ADD_HAZARD', hazard: hazard.trim() }); setHazard('') } }}
          placeholder="e.g. Overhead 11kV line crossing the compound"
          className="flex-1 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
        />
        <button
          onClick={() => { if (hazard.trim()) { tutorDispatch({ type: 'ADD_HAZARD', hazard: hazard.trim() }); setHazard('') } }}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 text-sm"
        >
          + Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tutor.customHazards.map((h) => (
          <span key={h} className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs">
            ⚠ {h}
            <button onClick={() => tutorDispatch({ type: 'REMOVE_HAZARD', hazard: h })} className="text-red-400 hover:text-red-300">✕</button>
          </span>
        ))}
      </div>
    </div>
  )
}
