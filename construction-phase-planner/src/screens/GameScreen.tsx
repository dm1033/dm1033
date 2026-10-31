import { useEffect, useMemo, useRef } from 'react'
import { useGame } from '../state/GameContext'
import Dashboard from '../components/Dashboard'
import PanelsDrawer from '../components/PanelsDrawer'
import DecisionCard from '../components/DecisionCard'
import InfoCard from '../components/InfoCard'
import SitePlanner from '../components/SitePlanner'
import TwRegisterForm from '../components/TwRegisterForm'
import PermitForm from '../components/PermitForm'
import HazardHunt from '../components/HazardHunt'
import SequenceBuilder from '../components/SequenceBuilder'
import Hud from '../components/Hud'
import SiteWeekCard from '../components/SiteWeekCard'
import type { CustomQuestion, DecisionStep, Step } from '../types'
import { isEventPhase } from '../state/GameContext'
import { DIFFICULTIES } from '../engine/game'

/** Convert a tutor-authored question into a decision step. */
function customToDecision(q: CustomQuestion): DecisionStep {
  return {
    type: 'decision',
    id: `custom-${q.id}`,
    isEvent: true,
    prompt: q.prompt,
    options: q.options.map((o, i) => ({
      id: `o${i}`,
      text: o.text,
      quality: o.correct ? 'best' : 'poor',
      impact: o.correct ? { safety: 5, legal: 5 } : {},
      feedback: o.correct ? 'Correct: tutor question.' : 'Not the best answer. See the tutor explanation.',
    })),
    topic: 'Tutor question',
    learningNote: q.explanation,
  }
}

export default function GameScreen({ onFinished, onExit }: { onFinished: () => void; onExit: () => void }) {
  const { state, dispatch, scenario, tutor, tutorDispatch } = useGame()
  const entryRef = useRef<{ id: string; done: boolean } | null>(null)

  useEffect(() => {
    if (state.completed) onFinished()
  }, [state.completed, onFinished])

  const phase = scenario?.phases[state.phaseIndex]

  const extraSteps: Step[] = useMemo(() => {
    if (!scenario || !phase) return []
    const find = (id: string) => scenario.eventPool.find((e) => e.id === id)
    const surprise = state.game.surpriseEvents
      .filter((s) => s.phaseNumber === phase.number)
      .map((s) => find(s.eventId))
      .filter((e): e is DecisionStep => !!e)
    if (!isEventPhase(phase.number)) return surprise
    const drawn = state.drawnEventIds.map(find).filter((e): e is DecisionStep => !!e)
    const custom = tutor.customQuestions.map(customToDecision)
    return [...surprise, ...drawn, ...custom]
  }, [scenario, phase, state.drawnEventIds, state.game.surpriseEvents, tutor.customQuestions])

  if (!scenario || !phase) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 mb-4">No scenario in progress.</p>
        <button onClick={onExit} className="rounded-lg bg-amber-500 text-slate-950 font-bold px-6 py-2.5">
          Back to start
        </button>
      </div>
    )
  }

  const diff = DIFFICULTIES[state.game.difficulty]
  const steps: Step[] = [...phase.steps, ...extraSteps]
  const step = steps[Math.min(state.stepIndex, steps.length - 1)]
  const advance = () => dispatch({ type: 'ADVANCE', scenario, extraSteps: extraSteps.length })
  const reveal = tutor.enabled && tutor.revealAnswers
  const paused = tutor.enabled && tutor.paused
  const surpriseHere = step.type === 'decision' && state.game.surpriseEvents.some((s) => s.eventId === step.id)

  // Guard against double-scoring after a reload: a step whose answer was already
  // recorded BEFORE the step was entered renders as completed instead of accepting a
  // second submission. Evaluated once per step id so that answering in-session (which
  // also records the answer) doesn't hide the feedback card.
  if (entryRef.current?.id !== step.id) {
    entryRef.current = {
      id: step.id,
      done:
        (step.type === 'decision' && state.decisions.some((d) => d.stepId === step.id)) ||
        (step.type === 'permits' && state.permitAnswers.some((a) => a.stepId === step.id)) ||
        (step.type === 'twRegister' && step.items.length > 0 && step.items.every((i) => state.twAnswers.some((a) => a.itemId === i.id))) ||
        (step.type === 'siteSetup' && state.placements.length > 0) ||
        (step.type === 'hazardHunt' && state.huntAnswers.some((a) => a.stepId === step.id)) ||
        (step.type === 'sequence' && state.sequenceAnswers.some((a) => a.stepId === step.id)),
    }
  }
  const alreadyDone = entryRef.current.done

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 grid lg:grid-cols-[220px_1fr_280px] gap-4">
      {state.game.pendingWeek && <SiteWeekCard />}

      {/* Phase progress */}
      <aside className="no-print hidden lg:block">
        <div className="sticky top-16 space-y-0.5 text-xs">
          <div className="mb-2 rounded-md border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-[11px] text-slate-400">
            {diff.icon} <b className="text-slate-200">{diff.role}</b> · {diff.label}
          </div>
          {scenario.phases.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                i === state.phaseIndex
                  ? 'bg-amber-500/15 text-amber-300 font-semibold'
                  : i < state.phaseIndex
                    ? 'text-emerald-500'
                    : 'text-slate-600'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                i === state.phaseIndex ? 'bg-amber-500 text-slate-950' : i < state.phaseIndex ? 'bg-emerald-600 text-white' : 'bg-slate-800'
              }`}>
                {i < state.phaseIndex ? '✓' : p.number}
              </span>
              {p.title}
            </div>
          ))}
        </div>
      </aside>

      {/* Main step area */}
      <section className="min-w-0">
        <Hud />

        {/* Compact phase progress for tablets / phones */}
        <div className="no-print lg:hidden flex gap-0.5 mb-3" aria-hidden="true">
          {scenario.phases.map((p, i) => (
            <div key={p.id} className={`h-1.5 flex-1 rounded ${i < state.phaseIndex ? 'bg-emerald-600' : i === state.phaseIndex ? 'bg-amber-500' : 'bg-slate-800'}`} />
          ))}
        </div>

        <div className="mb-3">
          <div className="text-xs text-slate-500">
            Phase {phase.number} of {scenario.phases.length} · Step {Math.min(state.stepIndex + 1, steps.length)} of {steps.length} · {scenario.title}
          </div>
          <h2 className="text-xl font-bold">{phase.title}</h2>
          {state.stepIndex === 0 && <p className="text-sm text-slate-400 mt-1">{phase.intro}</p>}
          {surpriseHere && (
            <p className="mt-2 text-xs font-bold text-red-400">⚡ Unplanned event: site doesn't wait for the right phase.</p>
          )}
        </div>

        {paused && (
          <div className="mb-3 rounded-lg border border-amber-700 bg-amber-950/40 p-4 text-amber-200 text-sm flex items-center justify-between gap-3">
            <span>⏸ <b>Paused for tutor discussion.</b> The tutor has paused the game (and the clock) to discuss this step with the group.</span>
            <button
              onClick={() => tutorDispatch({ type: 'SET_PAUSED', paused: false })}
              className="rounded bg-amber-500 text-slate-950 font-bold px-3 py-1.5 text-xs whitespace-nowrap"
            >
              Resume
            </button>
          </div>
        )}

        <div className={paused ? 'pointer-events-none opacity-50' : ''}>
          {alreadyDone && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <p className="text-sm text-slate-300">✓ This step has already been completed and scored.</p>
              <button onClick={advance} className="mt-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5">
                Continue →
              </button>
            </div>
          )}
          {!alreadyDone && step.type === 'info' && <InfoCard key={step.id} step={step} onContinue={advance} />}
          {!alreadyDone && step.type === 'decision' && (
            <DecisionCard
              key={step.id}
              step={step}
              reveal={reveal}
              paused={paused}
              onAnswer={(option, confidence, timeFrac, timedOut) =>
                dispatch({ type: 'ANSWER_DECISION', step, option, phaseNumber: phase.number, confidence, timeFrac, timedOut })}
              onContinue={advance}
            />
          )}
          {!alreadyDone && step.type === 'siteSetup' && (
            <SitePlanner
              key={step.id}
              step={step}
              reveal={reveal}
              onSubmit={(placements) => dispatch({ type: 'SUBMIT_SITE_SETUP', step, placements })}
              onContinue={advance}
            />
          )}
          {!alreadyDone && step.type === 'twRegister' && (
            <TwRegisterForm
              key={step.id}
              step={step}
              reveal={reveal}
              onSubmit={(answers) => dispatch({ type: 'SUBMIT_TW', step, answers })}
              onContinue={advance}
            />
          )}
          {!alreadyDone && step.type === 'permits' && (
            <PermitForm
              key={step.id}
              step={step}
              reveal={reveal}
              onSubmit={(selected) => dispatch({ type: 'SUBMIT_PERMITS', step, selected })}
              onContinue={advance}
            />
          )}
          {!alreadyDone && step.type === 'hazardHunt' && (
            <HazardHunt
              key={step.id}
              step={step}
              reveal={reveal}
              paused={paused}
              onSubmit={(flagged, secondsLeft) => dispatch({ type: 'SUBMIT_HUNT', step, flagged, secondsLeft })}
              onContinue={advance}
            />
          )}
          {!alreadyDone && step.type === 'sequence' && (
            <SequenceBuilder
              key={step.id}
              step={step}
              reveal={reveal}
              onSubmit={(order) => dispatch({ type: 'SUBMIT_SEQUENCE', step, order, phaseNumber: phase.number })}
              onContinue={advance}
            />
          )}
        </div>
      </section>

      {/* Right sidebar: dashboard + live panels */}
      <aside className="no-print space-y-4">
        <div className="lg:sticky lg:top-16 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <Dashboard />
          </div>
          <PanelsDrawer />
        </div>
      </aside>
    </div>
  )
}
