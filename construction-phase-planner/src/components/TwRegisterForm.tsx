import { useState } from 'react'
import type { TwAnswerRecord, TwItem, TwRegisterStep } from '../types'
import { twItemScore } from '../engine/scoring'

interface Props {
  step: TwRegisterStep
  reveal: boolean
  /** Assessment mode: record answers but defer marking to the final report. */
  deferFeedback?: boolean
  onSubmit: (answers: TwAnswerRecord[]) => void
  onContinue: () => void
}

const DESIGN_OPTS = [
  { v: 'bespoke', label: 'Bespoke design' },
  { v: 'standard-solution', label: 'Standard solution' },
  { v: 'none', label: 'No design needed' },
] as const

const CAT_OPTS = [
  { v: 'cat0', label: 'Cat 0 (self-check / standard)' },
  { v: 'cat1', label: 'Cat 1 (independent in-team)' },
  { v: 'cat2', label: 'Cat 2 (independent in-organisation)' },
  { v: 'cat3', label: 'Cat 3 (independent third party)' },
] as const

const RESP_OPTS = [
  { v: 'TWC', label: 'Temporary Works Coordinator' },
  { v: 'TWS', label: 'Temporary Works Supervisor' },
  { v: 'PC', label: 'Principal Contractor (SM)' },
  { v: 'contractor', label: 'Trade contractor' },
  { v: 'designer', label: 'TW Designer' },
] as const

function YesNo({ value, onChange, disabled }: { value: boolean | undefined; onChange: (v: boolean) => void; disabled: boolean }) {
  return (
    <div className="flex gap-1">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          disabled={disabled}
          onClick={() => onChange(v)}
          className={`px-2 py-1 rounded text-[11px] border ${
            value === v ? 'border-amber-500 bg-amber-500/20 text-amber-200' : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
          }`}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  )
}

export default function TwRegisterForm({ step, reveal, deferFeedback, onSubmit, onContinue }: Props) {
  const [answers, setAnswers] = useState<Record<string, TwAnswerRecord>>({})
  const [submitted, setSubmitted] = useState(false)

  const update = (itemId: string, patch: Partial<TwAnswerRecord>) => {
    setAnswers((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? { itemId }), ...patch } }))
  }

  const complete = (item: TwItem) => {
    const a = answers[item.id]
    return a && a.register !== undefined && a.design !== undefined && a.catCheck !== undefined
      && a.rams !== undefined && a.inspection !== undefined && a.holdPoint !== undefined && a.responsible !== undefined
  }

  const allComplete = step.items.every(complete)

  const submit = () => {
    onSubmit(step.items.map((i) => answers[i.id] ?? { itemId: i.id }))
    if (deferFeedback) {
      onContinue()
      return
    }
    setSubmitted(true)
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-lg font-semibold mb-1">Temporary Works Register</h3>
      <p className="text-sm text-slate-400 mb-4">{step.prompt}</p>

      <div className="space-y-4">
        {step.items.map((item) => {
          const a = answers[item.id] ?? { itemId: item.id }
          const score = submitted ? twItemScore(item, a) : null
          return (
            <div key={item.id} className={`rounded-lg border p-3 ${submitted ? (score!.wrongFields.length === 0 ? 'border-emerald-800' : 'border-amber-800') : 'border-slate-700'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs text-slate-400">{item.description}</div>
                </div>
                {submitted && (
                  <span className={`text-[10px] font-bold whitespace-nowrap ${score!.wrongFields.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {14 - score!.wrongFields.length * 2}/14 pts
                  </span>
                )}
              </div>

              <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                <Field label="Add to TW register?" wrong={submitted && a.register !== item.correct.register}>
                  <YesNo disabled={submitted} value={a.register} onChange={(v) => update(item.id, { register: v })} />
                </Field>
                <Field label="Design requirement" wrong={submitted && a.design !== item.correct.design}>
                  <Select disabled={submitted} value={a.design} opts={DESIGN_OPTS} onChange={(v) => update(item.id, { design: v as TwAnswerRecord['design'] })} />
                </Field>
                <Field label="Design check category" wrong={submitted && a.catCheck !== item.correct.catCheck}>
                  <Select disabled={submitted} value={a.catCheck} opts={CAT_OPTS} onChange={(v) => update(item.id, { catCheck: v as TwAnswerRecord['catCheck'] })} />
                </Field>
                <Field label="RAMS required?" wrong={submitted && a.rams !== item.correct.rams}>
                  <YesNo disabled={submitted} value={a.rams} onChange={(v) => update(item.id, { rams: v })} />
                </Field>
                <Field label="Inspection / permit before use?" wrong={submitted && a.inspection !== item.correct.inspection}>
                  <YesNo disabled={submitted} value={a.inspection} onChange={(v) => update(item.id, { inspection: v })} />
                </Field>
                <Field label="Hold point before loading/use?" wrong={submitted && a.holdPoint !== item.correct.holdPoint}>
                  <YesNo disabled={submitted} value={a.holdPoint} onChange={(v) => update(item.id, { holdPoint: v })} />
                </Field>
                <Field label="Responsible person" wrong={submitted && a.responsible !== item.correct.responsible}>
                  <Select disabled={submitted} value={a.responsible} opts={RESP_OPTS} onChange={(v) => update(item.id, { responsible: v as TwAnswerRecord['responsible'] })} />
                </Field>
              </div>

              {(submitted || reveal) && (
                <div className={`mt-2 rounded border p-2 text-xs ${submitted ? 'border-sky-900 bg-sky-950/30 text-sky-200' : 'border-amber-800 bg-amber-950/30 text-amber-200'}`}>
                  {reveal && !submitted && (
                    <p className="mb-1"><b>Tutor reveal:</b> register: {item.correct.register ? 'yes' : 'no'} · design: {item.correct.design} · check: {item.correct.catCheck} · RAMS: {item.correct.rams ? 'yes' : 'no'} · inspection: {item.correct.inspection ? 'yes' : 'no'} · hold point: {item.correct.holdPoint ? 'yes' : 'no'} · responsible: {item.correct.responsible}</p>
                  )}
                  {submitted && <p>{item.explanation}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!submitted ? (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={submit}
            disabled={!allComplete}
            className="rounded-lg bg-amber-500 disabled:opacity-40 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5"
          >
            Submit Register
          </button>
          {!allComplete && <span className="text-xs text-amber-400">Answer every field for every item first.</span>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-sky-900 bg-sky-950/30 p-3 text-sm text-sky-200">
            <p className="font-bold text-xs text-sky-400 mb-1">📘 Learning note — {step.topic}</p>
            <p>{step.learningNote}</p>
          </div>
          <button onClick={onContinue} className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5">
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, wrong, children }: { label: string; wrong: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className={`mb-1 ${wrong ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
        {label} {wrong && '✗'}
      </div>
      {children}
    </div>
  )
}

function Select({ value, opts, onChange, disabled }: {
  value: string | undefined
  opts: readonly { v: string; label: string }[]
  onChange: (v: string) => void
  disabled: boolean
}) {
  return (
    <select
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-slate-200"
    >
      <option value="" disabled>Select…</option>
      {opts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
    </select>
  )
}
