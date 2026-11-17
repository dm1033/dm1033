// Permit systems (phase 9): tick the permit systems this job needs.
//
// Each permit is a real checkbox on a card, with one line on when that kind of permit is used.
// Ticks are kept with useDraft, an empty submission asks first, and after marking every permit is
// shown as needed or not needed, in words, with the reason. Ticking everything is not a free
// pass: extra permits cost points and the feedback says so.
// On Expert the marking is sealed until handover: nothing here may hint at right or wrong.
import { useEffect, useId, useRef, useState } from 'react'
import type { PermitOption, PermitStep } from '../types'
import { useGame } from '../state/GameContext'
import { DIFFICULTIES } from '../engine/game'
import { sfx } from '../engine/sound'
import { useDraft } from '../state/useDraft'
import { announce } from '../state/announce'
import Dialog from './Dialog'

interface Props {
  step: PermitStep
  reveal: boolean
  onSubmit: (selected: string[]) => void
  onContinue: () => void
}

/** Scenario data may carry its own lines; they take priority over the general ones below. */
type PermitOptionWithNotes = PermitOption & {
  /** One line on when this permit is used. */
  when?: string
  /** Why it is, or is not, needed on this project. */
  why?: string
}

/** When each kind of permit is used, in general. Says nothing about this project. */
const WHEN_USED: Record<string, string> = {
  'hot-works': 'For welding, cutting, grinding or any other work that makes flame, heat or sparks.',
  'permit-to-dig': 'Before any break of ground, so that buried services are located and marked first.',
  'permit-to-load': 'Before temporary works are loaded or used, and again before they are struck or unloaded.',
  'lifting-permit': 'For crane lifts that are run to a lift plan under a named person in control.',
  'confined-space': 'Before anyone enters a space where gas, fumes, lack of oxygen or flooding could trap them, such as a chamber, tank or deep manhole.',
  'electrical-isolation': 'Before work on or close to electrical services that must be isolated, locked off and proved dead.',
  'isolation-permit': 'Before work on or close to live services that must be isolated, locked off and proved dead.',
  'roof-access': 'To control who goes onto a roof or up to a leading edge, and only once edge protection is in place.',
  'demolition-permit': 'To authorise each stage of demolition or structural alteration against the agreed plan.',
  'asbestos-clearance': 'Before any trade goes back into an area after asbestos removal: no certificate, no entry.',
  'street-works-occupation': 'To check each day that the road or lane occupation matches the conditions set by the highway authority.',
}

type Verdict = 'missed' | 'extra' | 'inPlace' | 'leftOut'

const VERDICT: Record<Verdict, { icon: string; words: string; text: string; border: string }> = {
  missed: { icon: '✗', words: 'Needed, but missed', text: 'text-red-300', border: 'border-red-600' },
  extra: { icon: '⚠', words: 'Not needed: extra paperwork', text: 'text-amber-300', border: 'border-amber-600' },
  inPlace: { icon: '✓', words: 'Needed, and in place', text: 'text-emerald-300', border: 'border-emerald-700' },
  leftOut: { icon: '✓', words: 'Not needed, and rightly left out', text: 'text-emerald-300', border: 'border-slate-600' },
}
const VERDICT_ORDER: Verdict[] = ['missed', 'extra', 'inPlace', 'leftOut']

const BTN_PRIMARY = 'min-h-11 rounded-lg border border-transparent bg-amber-500 px-5 py-2.5 text-base font-bold text-slate-950 hover:bg-amber-400'
const BTN_SECONDARY = 'min-h-11 rounded-lg border border-slate-400 bg-slate-900 px-5 py-2.5 text-base font-semibold text-slate-100 hover:border-slate-200 hover:bg-slate-800'

export default function PermitForm({ step, reveal, onSubmit, onContinue }: Props) {
  const { state } = useGame()
  const defer = DIFFICULTIES[state.game.difficulty].deferFeedback
  const uid = useId()
  const options = step.options as PermitOptionWithNotes[]

  const [rawDraft, setDraft, clearDraft] = useDraft<string[]>(step.id, [])
  // A stored draft is untrusted: keep only ids that are still on the list.
  const selected = Array.isArray(rawDraft) ? rawDraft.filter((id) => options.some((o) => o.id === id)) : []

  const [restored, setRestored] = useState(() => selected.length > 0)
  const [submitted, setSubmitted] = useState<string[] | null>(null)
  const [confirming, setConfirming] = useState(false)
  /** The seq of the last points award before the permits were confirmed. */
  const [awardSeqBefore, setAwardSeqBefore] = useState<number | null>(null)

  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)
  const focusTarget = useRef<'result' | 'confirm' | null>(null)

  useEffect(() => {
    const target = focusTarget.current
    if (!target) return
    focusTarget.current = null
    ;(target === 'result' ? resultHeadingRef.current : confirmBtnRef.current)?.focus()
  })

  useEffect(() => {
    if (restored) announce('Your earlier permit choices have been restored.')
    // Announce once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const whenLine = (o: PermitOptionWithNotes): string | undefined => o.when ?? WHEN_USED[o.id]

  const toggle = (id: string) => {
    setRestored(false)
    setDraft((prev) => {
      const list = Array.isArray(prev) ? prev : []
      return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    })
    sfx.tick()
  }

  const doSubmit = () => {
    setConfirming(false)
    setAwardSeqBefore(state.game.lastAward?.seq ?? 0)
    setSubmitted(selected)
    onSubmit(selected)
    clearDraft()
    focusTarget.current = 'result'
    if (defer) {
      sfx.click()
      announce('Permit systems set up. On Expert they are marked at handover.')
      return
    }
    const missed = step.required.filter((r) => !selected.includes(r)).length
    const extra = selected.filter((s) => !step.required.includes(s)).length
    if (missed === 0 && extra === 0) sfx.good()
    else if (missed === 0) sfx.ok()
    else sfx.bad()
    const inPlace = step.required.length - missed
    announce(
      `Permits marked. ${inPlace} of ${step.required.length} needed permits in place. `
      + `${missed === 0 ? 'None missed.' : `${missed} missed.`} ${extra === 0 ? 'No extras.' : `${extra} not needed.`}`,
    )
  }

  const trySubmit = () => {
    if (selected.length === 0) setConfirming(true)
    else doSubmit()
  }

  const cardCls = 'rounded-xl border border-slate-700 bg-slate-900/50 p-4 sm:p-5'

  // ---------- After submission ----------

  if (submitted) {
    if (defer) {
      const chosen = options.filter((o) => submitted.includes(o.id))
      return (
        <div className={cardCls}>
          <h3 ref={resultHeadingRef} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold outline-none">Permit systems set up</h3>
          {chosen.length > 0 ? (
            <>
              <p className="mt-2 text-base leading-relaxed text-slate-200">These permit systems are now running on your site:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-base text-slate-100">
                {chosen.map((o) => <li key={o.id}>{o.name}</li>)}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-base leading-relaxed text-slate-200">Your site is running with no permit systems.</p>
          )}
          <p className="mt-2 text-base leading-relaxed text-slate-200">
            On Expert this is not marked here. Any gap shows up on site, or in your handover report.
          </p>
          <button type="button" onClick={onContinue} className={`mt-4 ${BTN_PRIMARY}`}>
            Continue <span aria-hidden="true">→</span>
          </button>
        </div>
      )
    }

    const verdictOf = (o: PermitOption): Verdict => {
      const needed = step.required.includes(o.id)
      const ticked = submitted.includes(o.id)
      return needed ? (ticked ? 'inPlace' : 'missed') : ticked ? 'extra' : 'leftOut'
    }
    const marked = options
      .map((o) => ({ o, v: verdictOf(o) }))
      .sort((x, y) => VERDICT_ORDER.indexOf(x.v) - VERDICT_ORDER.indexOf(y.v))
    const count = (v: Verdict) => marked.filter((m) => m.v === v).length
    const missed = count('missed')
    const extra = count('extra')
    const tickedAll = submitted.length === options.length && extra > 0
    const award = state.game.lastAward && awardSeqBefore !== null && state.game.lastAward.seq === awardSeqBefore + 1
      ? state.game.lastAward.amount
      : null

    const reasonFor = (o: PermitOptionWithNotes, v: Verdict): string => {
      if (o.why) return o.why
      if (v === 'missed') return 'This project has that work. Without the permit, nobody checks that the controls are in place before it starts.'
      if (v === 'inPlace') return 'This project has that work, so the permit earns its place.'
      if (v === 'extra') return 'Nothing in this scope calls for it. A permit that nobody needs is paperwork that teaches people to sign without reading.'
      return 'Nothing in this scope calls for it.'
    }

    return (
      <div className={cardCls}>
        <h3 ref={resultHeadingRef} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold outline-none">Permits marked</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-slate-100">
          <span><b>{step.required.length - missed} of {step.required.length}</b> needed permits in place</span>
          <span><b>{missed}</b> missed</span>
          <span><b>{extra}</b> not needed</span>
          {award !== null && (
            <span className={`rounded-full border px-3 py-1 text-sm font-bold ${award >= 0 ? 'border-emerald-600 bg-emerald-950 text-emerald-200' : 'border-red-600 bg-red-950 text-red-200'}`}>
              {award >= 0 ? '+' : '−'}{Math.abs(award)} points
            </span>
          )}
        </div>
        {tickedAll && (
          <p className="mt-3 rounded-lg border border-amber-600 bg-amber-950/40 p-3 text-sm leading-relaxed text-amber-100">
            <b>You ticked every permit on the list.</b> That is not a free pass: {extra} of them {extra === 1 ? 'is' : 'are'} not
            needed here, and each one cost points. When everything needs a permit, the permits that matter stop being read.
          </p>
        )}
        {!tickedAll && extra > 0 && (
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Each permit that is not needed cost points. Keep the system small enough to be run properly.
          </p>
        )}

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {marked.map(({ o, v }) => (
            <li key={o.id} className={`rounded-lg border bg-slate-950/40 p-3 ${VERDICT[v].border}`}>
              <p className="text-base font-semibold text-slate-100">{o.name}</p>
              <p className={`mt-0.5 text-sm font-bold ${VERDICT[v].text}`}>
                <span aria-hidden="true">{VERDICT[v].icon} </span>{VERDICT[v].words}
              </p>
              {whenLine(o) && <p className="mt-1 text-sm leading-relaxed text-slate-300">{whenLine(o)}</p>}
              <p className="mt-1 text-sm leading-relaxed text-slate-200"><span className="font-semibold">Why: </span>{reasonFor(o, v)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-lg border border-slate-600 bg-slate-900 p-3 sm:p-4">
          <p className="text-sm font-bold text-slate-200">Why these permits, on this project</p>
          <p className="mt-1 text-base leading-relaxed text-slate-200">{step.explanation}</p>
        </div>
        <div className="mt-3 rounded-lg border border-sky-800 bg-sky-950/30 p-3 sm:p-4">
          <p className="text-sm font-bold text-sky-300"><span aria-hidden="true">📘 </span>Learning note: {step.topic}</p>
          <p className="mt-1 text-base leading-relaxed text-sky-100">{step.learningNote}</p>
        </div>
        <button type="button" onClick={onContinue} className={`mt-4 ${BTN_PRIMARY}`}>
          Continue <span aria-hidden="true">→</span>
        </button>
      </div>
    )
  }

  // ---------- Choosing ----------

  return (
    <div className={cardCls}>
      <h3 className="text-lg font-semibold">Permit Systems</h3>
      <p className="mt-1 text-base leading-relaxed text-slate-300">{step.prompt}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        A permit to work is a written check, made just before a high-risk task starts, that its controls are
        really in place. Tick every permit system this job needs. A missed permit leaves that task
        uncontrolled. An extra permit costs points too.
      </p>
      {restored && (
        <p className="mt-3 rounded-lg border border-sky-700 bg-sky-950/40 px-3 py-2 text-sm text-sky-100">
          <span aria-hidden="true">↺ </span>Your earlier permit choices have been restored.
        </p>
      )}

      <fieldset className="mt-4 min-w-0">
        <legend className="block w-full text-base font-semibold text-slate-100">Which permit systems does this project need?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {options.map((o) => {
            const id = `${uid}-${o.id}`
            const when = whenLine(o)
            const needed = step.required.includes(o.id)
            return (
              <label
                key={o.id}
                htmlFor={id}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-500 bg-slate-900 px-3 py-3 hover:border-slate-300 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-500/15 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber-300 forced-colors:has-[:checked]:outline-2 forced-colors:has-[:checked]:outline-[Highlight]"
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  onChange={() => toggle(o.id)}
                  aria-describedby={when || reveal ? `${id}-note` : undefined}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-amber-500"
                />
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-slate-100">{o.name}</span>
                  <span id={`${id}-note`} className="block text-sm leading-relaxed text-slate-300">
                    {when}
                    {reveal && (
                      <span className="mt-1 block font-bold text-amber-200">
                        Tutor reveal: {needed ? 'needed on this project' : 'not needed on this project'}
                      </span>
                    )}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button ref={confirmBtnRef} type="button" onClick={trySubmit} className={BTN_PRIMARY}>
          Confirm Permit Systems
        </button>
        <p className="text-sm text-slate-300" role="status">
          <b className="text-slate-100">{selected.length} of {options.length}</b> ticked. You cannot change this after you confirm.
        </p>
      </div>

      <Dialog
        open={confirming}
        title="Confirm with no permits?"
        onClose={() => { setConfirming(false); focusTarget.current = 'confirm' }}
      >
        <div className="space-y-3 text-base leading-relaxed text-slate-200">
          <p>
            You have not ticked any permit system. Every permit this job needs will count as missed, and you
            cannot change your answer after you confirm.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setConfirming(false); focusTarget.current = 'confirm' }}
              className={BTN_PRIMARY}
            >
              Keep working
            </button>
            <button type="button" onClick={doSubmit} className={BTN_SECONDARY}>Confirm with none</button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
