// Temporary Works Register (phase 8).
//
// One temporary works item at a time, answered in the order a Temporary Works Co-ordinator would
// think: is it temporary works, what design does it need, how independent is the design check,
// who signs it off, then the controls in use. A review table comes before the single scored
// submission, and after marking every field shows the group's answer, the model answer and why.
//
// Work in progress is kept with useDraft, so a reload or a visit to Tutor Mode loses nothing.
// On Expert the marking is sealed until handover: nothing here may hint at right or wrong.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { TwAnswerRecord, TwItem, TwRegisterStep } from '../types'
import { twItemScore } from '../engine/scoring'
import { useGame } from '../state/GameContext'
import { DIFFICULTIES } from '../engine/game'
import { sfx } from '../engine/sound'
import { useDraft } from '../state/useDraft'
import { announce } from '../state/announce'
import Dialog from './Dialog'
import { Abbr } from './Abbr'

interface Props {
  step: TwRegisterStep
  reveal: boolean
  onSubmit: (answers: TwAnswerRecord[]) => void
  onContinue: () => void
}

// ---------- The seven questions, in the order a TWC would ask them ----------

type FieldKey = 'register' | 'design' | 'catCheck' | 'responsible' | 'rams' | 'inspection' | 'holdPoint'
const FIELD_ORDER: FieldKey[] = ['register', 'design', 'catCheck', 'responsible', 'rams', 'inspection', 'holdPoint']
type FieldValue = boolean | string

interface Choice {
  v: FieldValue
  /** Full label on the answer card. */
  label: string
  /** Short form for the review table and the marked result. */
  short: string
  /** One plain line on what the choice means in practice. */
  desc?: string
}

interface FieldDef {
  /** Column heading in the review table and row label in the marked result. */
  short: string
  /** The question, as the legend of its radio group. */
  legend: string
  help: ReactNode
  choices: Choice[]
  /** Two short answers side by side, or a stack of cards with a description each. */
  layout: 'pair' | 'stack'
}

const YES_NO: Choice[] = [
  { v: true, label: 'Yes', short: 'Yes' },
  { v: false, label: 'No', short: 'No' },
]

const FIELDS: Record<FieldKey, FieldDef> = {
  register: {
    short: 'On the register',
    legend: 'Is it temporary works? Does it go on the register?',
    help: (
      <>
        Temporary works are things the job needs while it is being built that are not part of the finished
        works. They support, retain, give access or protect. If this is one, it goes on the register so that
        the <Abbr term="TWC" /> can control it.
      </>
    ),
    choices: [
      { v: true, label: 'Yes, it goes on the register', short: 'Yes' },
      { v: false, label: 'No, it is not temporary works', short: 'No' },
    ],
    layout: 'pair',
  },
  design: {
    short: 'Design',
    legend: 'What design does it need?',
    help: (
      <>
        Start from a design brief: what the item has to do, the loads on it and the ground under it. Then
        decide whether an off-the-shelf answer covers those conditions.
      </>
    ),
    choices: [
      {
        v: 'standard-solution',
        label: 'Standard solution',
        short: 'Standard solution',
        desc: 'Proprietary or tabulated equipment, used inside the supplier’s stated limits. It still has to be the right one for these conditions.',
      },
      {
        v: 'bespoke',
        label: 'Bespoke design',
        short: 'Bespoke design',
        desc: 'The conditions are outside any standard solution’s limits, so a temporary works designer designs it for this site.',
      },
      {
        v: 'none',
        label: 'No design needed',
        short: 'No design needed',
        desc: 'A site rule or arrangement, not a structure that carries load.',
      },
    ],
    layout: 'stack',
  },
  catCheck: {
    short: 'Design check',
    legend: 'Which design check category?',
    help: (
      <>
        Every design is checked by someone other than the person who produced it. The more complex the design
        and the worse a failure would be, the more independent the checker has to be.
      </>
    ),
    choices: [
      {
        v: 'cat0',
        label: 'Category 0',
        short: 'Cat 0',
        desc: 'A standard solution. A second competent person on the site or design team confirms it suits this site. It is never a self-check.',
      },
      {
        v: 'cat1',
        label: 'Category 1',
        short: 'Cat 1',
        desc: 'A simple design. Checked by another member of the design team.',
      },
      {
        v: 'cat2',
        label: 'Category 2',
        short: 'Cat 2',
        desc: 'A more complex design. Checked by someone who took no part in the design.',
      },
      {
        v: 'cat3',
        label: 'Category 3',
        short: 'Cat 3',
        desc: 'A complex or unusual design. Checked by a separate organisation.',
      },
    ],
    layout: 'stack',
  },
  responsible: {
    short: 'Signed off by',
    legend: 'Who signs it off as ready to use?',
    help: (
      <>
        The designer designs it and the trade contractor builds it. This question asks who confirms that it has
        been built as checked and can now be used. The <Abbr term="TWC" /> stays responsible for the procedure
        on every item, and can authorise a <Abbr term="TWS" /> in writing to sign off lower-risk items.
      </>
    ),
    choices: [
      { v: 'TWC', label: 'Temporary Works Co-ordinator (TWC)', short: 'TWC' },
      { v: 'TWS', label: 'Temporary Works Supervisor (TWS)', short: 'TWS', desc: 'Only with written authority from the TWC.' },
      { v: 'PC', label: 'Site manager', short: 'Site manager', desc: 'Signing for the principal contractor, outside the temporary works procedure.' },
      { v: 'contractor', label: 'Trade contractor’s supervisor', short: 'Trade contractor', desc: 'The firm that installs the item.' },
      { v: 'designer', label: 'Temporary works designer', short: 'TW designer' },
    ],
    layout: 'stack',
  },
  rams: {
    short: 'RAMS',
    legend: 'Does it need its own risk assessment and method statement?',
    help: (
      <>
        <Abbr term="RAMS" />: a risk assessment and method statement for putting the item up, using it,
        altering it and taking it down.
      </>
    ),
    choices: YES_NO,
    layout: 'pair',
  },
  inspection: {
    short: 'Inspected',
    legend: 'Is it inspected before first use and while it is in use?',
    help: (
      <>
        Think about a check before first use, then at set intervals, and again after anything that could
        affect it, such as bad weather, an alteration or an impact.
      </>
    ),
    choices: YES_NO,
    layout: 'pair',
  },
  holdPoint: {
    short: 'Permit to load',
    legend: 'Does it need a permit to load before it is used?',
    help: (
      <>
        A permit to load is a hold point. Nobody loads or uses the item until it has been checked against the
        design and released in writing. Where one applies, taking the item away is controlled the same way,
        with a permit to strike or unload.
      </>
    ),
    choices: YES_NO,
    layout: 'pair',
  },
}

/** Scenario data may carry a reason per field; the form shows it in place of the general rule. */
type TwItemWithReasons = TwItem & { reasons?: Partial<Record<FieldKey, string>> }

type Answers = Record<string, TwAnswerRecord>

interface TwDraft {
  answers: Answers
  index: number
  view: 'items' | 'review'
}

function choiceFor(field: FieldKey, value: FieldValue | undefined): Choice | undefined {
  return FIELDS[field].choices.find((c) => c.v === value)
}

function shortLabel(field: FieldKey, value: FieldValue | undefined): string {
  return choiceFor(field, value)?.short ?? 'Not answered'
}

/** Is this question put to the group, given what they have said so far? */
function asked(a: TwAnswerRecord, field: FieldKey): boolean {
  if (field === 'register') return true
  if (a.register !== true) return false
  // No design means there is no design check to categorise.
  return !(field === 'catCheck' && a.design === 'none')
}

interface ItemProgress {
  answered: number
  total: number
  state: 'empty' | 'part' | 'done'
}

function progressOf(a: TwAnswerRecord): ItemProgress {
  if (a.register === undefined) return { answered: 0, total: FIELD_ORDER.length, state: 'empty' }
  const needed = FIELD_ORDER.filter((f) => asked(a, f))
  const answered = needed.filter((f) => a[f] !== undefined).length
  return { answered, total: needed.length, state: answered === needed.length ? 'done' : 'part' }
}

function progressWords(p: ItemProgress): string {
  if (p.state === 'done') return 'Complete'
  if (p.state === 'empty') return 'Not started'
  return `${p.answered} of ${p.total} answered`
}

/**
 * The record that is scored. Questions the group was not asked are filled with what their own
 * answer implies: "not temporary works" means no temporary works design and no permit to load;
 * "no design" means no design check. The answer type has no "not applicable" category, and the
 * scenario data records a design-free item as cat0, so cat0 stands in for "none" here.
 */
function toRecord(item: TwItem, a: TwAnswerRecord): TwAnswerRecord {
  const r: TwAnswerRecord = { itemId: item.id }
  if (a.register === undefined) return r
  r.register = a.register
  if (!a.register) {
    r.design = 'none'
    r.catCheck = 'cat0'
    r.holdPoint = false
    return r
  }
  r.design = a.design
  r.catCheck = a.design === 'none' ? 'cat0' : a.catCheck
  r.responsible = a.responsible
  r.rams = a.rams
  r.inspection = a.inspection
  r.holdPoint = a.holdPoint
  return r
}

// ---------- Marking: the group's answer, the model answer and the reason ----------

const CAT_RANK = ['cat0', 'cat1', 'cat2', 'cat3']

function ruleFor(item: TwItem, field: FieldKey): string {
  const c = item.correct
  switch (field) {
    case 'register':
      return c.register
        ? 'The works or the people around them rely on it while the job is built, so it goes on the register and gets a named owner, a check and a sign-off.'
        : 'Nothing is supported, retained or protected by it, so it is not temporary works. It is controlled another way. A register stays credible by holding only what belongs on it.'
    case 'design':
      if (c.design === 'bespoke') return 'The loads, the ground or the layout here are outside the limits of an off-the-shelf answer, so a temporary works designer works it out from a design brief.'
      if (c.design === 'standard-solution') return 'Proprietary or tabulated equipment used inside the supplier’s stated limits. It is still controlled through the register, and somebody still confirms that this site matches those limits.'
      return 'It is a site rule or arrangement, not a structure, so there is nothing to design. It still has to be briefed and checked.'
    case 'catCheck':
      if (c.design === 'none') return 'There is no design, so there is no design check to categorise.'
      if (c.catCheck === 'cat0') return 'Category 0 is for a standard solution: a second competent person confirms that the site conditions sit inside its limits.'
      if (c.catCheck === 'cat1') {
        return c.design === 'standard-solution'
          ? 'A standard solution normally takes Category 0. The model answer asks for one step more here because of what depends on it: a check by another member of the design team.'
          : 'Category 1 is for a simple design: it is checked by another member of the design team.'
      }
      if (c.catCheck === 'cat2') return 'Category 2 is for a more complex design: it is checked by someone who took no part in the design.'
      return 'Category 3 is for a complex or unusual design where failure would be very serious: it is checked by a separate organisation.'
    case 'responsible':
      if (c.responsible === 'TWC') return 'The Temporary Works Co-ordinator signs off designed and higher-risk items in person, normally with a permit to load.'
      if (c.responsible === 'TWS') return 'It is checked at the workface each time it is set up, so the Temporary Works Supervisor signs it off, with written authority from the TWC.'
      if (c.responsible === 'contractor') return 'A standard, lower-risk item: the trade contractor’s supervisor checks it against the supplier’s instructions and signs it off. The TWC still tracks it on the register.'
      if (c.responsible === 'PC') return 'The site manager signs this one off for the principal contractor.'
      return 'The temporary works designer confirms this one before it is used.'
    case 'rams':
      return c.rams
        ? 'Putting it up, altering it and taking it down are tasks with their own risks, so they need a risk assessment and method statement.'
        : 'The model answer treats this as routine work that is covered by existing arrangements, with no separate method statement.'
    case 'inspection':
      return c.inspection
        ? 'It is checked before first use, then at set intervals, and again after anything that could affect it, such as bad weather, an alteration or an impact.'
        : 'No inspection regime is asked for on this item.'
    case 'holdPoint':
      return c.holdPoint
        ? 'Nobody loads or uses it until it has been checked against the design and released with a permit to load. Taking it out later is controlled the same way, with a permit to strike or unload.'
        : 'It is checked and signed off on the register before use, but it does not need a formal permit to load.'
  }
}

type RowStatus = 'right' | 'cautious' | 'wrong'

interface MarkRow {
  field: FieldKey
  status: RowStatus
  yours: string
  model: string
  reason: string
}

interface ItemMark {
  item: TwItem
  earned: number
  possible: number
  rows: MarkRow[]
  wrong: number
}

function markItem(item: TwItem, a: TwAnswerRecord): ItemMark {
  const record = toRecord(item, a)
  const score = twItemScore(item, record)
  const cautious = (score as { cautiousFields?: string[] }).cautiousFields ?? []
  const reasons = (item as TwItemWithReasons).reasons ?? {}
  const rows: MarkRow[] = []
  for (const field of FIELD_ORDER) {
    const given = record[field]
    const correct = item.correct[field]
    const isWrong = score.wrongFields.includes(field)
    // Not marked wrong and not a match: the scoring did not count this field for this item.
    if (!isWrong && given !== correct) continue
    const wasAsked = asked(a, field)
    let yours: string
    if (!wasAsked && a.register === undefined) yours = 'Not answered'
    else if (!wasAsked && a.register === false) yours = field === 'design' ? 'None: you said it is not temporary works' : field === 'holdPoint' ? 'No: you said it is not temporary works' : 'Left out: you said it is not temporary works'
    else if (!wasAsked) yours = 'None: you said no design is needed'
    else yours = shortLabel(field, given)
    const model = field === 'catCheck' && item.correct.design === 'none' ? 'None: no design, so no design check' : shortLabel(field, correct)
    let reason = reasons[field] ?? ruleFor(item, field)
    const status: RowStatus = !isWrong ? 'right' : cautious.includes(field) ? 'cautious' : 'wrong'
    if (status === 'cautious') reason = `Your answer is one step more rigorous than needed. That is safe, but it costs time and money, so it earns half marks. ${reason}`
    else if (status === 'wrong' && field === 'catCheck' && typeof given === 'string' && wasAsked
      && CAT_RANK.indexOf(given) < CAT_RANK.indexOf(item.correct.catCheck) && item.correct.design !== 'none') {
      reason = `Your check is not independent enough for this item. ${reason}`
    }
    rows.push({ field, status, yours, model, reason })
  }
  const order: Record<RowStatus, number> = { wrong: 0, cautious: 1, right: 2 }
  rows.sort((x, y) => order[x.status] - order[y.status])
  return { item, earned: score.earned, possible: score.possible, rows, wrong: rows.filter((r) => r.status !== 'right').length }
}

// ---------- Small building blocks ----------

const BTN_PRIMARY = 'min-h-11 rounded-lg border border-transparent bg-amber-500 px-5 py-2.5 text-base font-bold text-slate-950 hover:bg-amber-400'
const BTN_SECONDARY = 'min-h-11 rounded-lg border border-slate-400 bg-slate-900 px-5 py-2.5 text-base font-semibold text-slate-100 hover:border-slate-200 hover:bg-slate-800'

function Question({ field, name, value, onChange }: {
  field: FieldKey
  name: string
  value: FieldValue | undefined
  onChange: (v: FieldValue) => void
}) {
  const def = FIELDS[field]
  const helpId = `${name}-help`
  return (
    <fieldset className="min-w-0" aria-describedby={helpId}>
      <legend className="block w-full text-base font-semibold text-slate-100">{def.legend}</legend>
      <p id={helpId} className="mt-1 text-sm leading-relaxed text-slate-300">{def.help}</p>
      <div className={`mt-2 grid gap-2 ${def.layout === 'pair' ? 'sm:grid-cols-2' : ''}`}>
        {def.choices.map((c) => (
          <label
            key={String(c.v)}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-500 bg-slate-900 px-3 py-2.5 hover:border-slate-300 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-500/15 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber-300 forced-colors:has-[:checked]:outline-2 forced-colors:has-[:checked]:outline-[Highlight]"
          >
            <input
              type="radio"
              name={name}
              value={String(c.v)}
              checked={value === c.v}
              onChange={() => onChange(c.v)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-amber-500"
            />
            <span className="min-w-0">
              <span className="block text-base font-semibold text-slate-100">{c.label}</span>
              {c.desc && <span className="block text-sm leading-relaxed text-slate-300">{c.desc}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function KeyTerms() {
  return (
    <details className="mt-3 rounded-lg border border-slate-600 bg-slate-900">
      <summary className="flex min-h-11 cursor-pointer items-center px-3 py-2 text-base font-semibold text-sky-200">
        Key terms for this step
      </summary>
      <dl className="space-y-2 px-3 pb-3 text-sm leading-relaxed text-slate-300">
        <div>
          <dt className="font-semibold text-slate-100">Temporary works</dt>
          <dd>Anything needed to build the job that is not part of the finished works: scaffolds, excavation support, propping, hoardings, crane platforms and the like.</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-100">Temporary works register</dt>
          <dd>The list of every temporary works item on the job, with its design, its check, who signs it off and its permits. It is how the site knows what must not be loaded or removed yet.</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-100">TWC: Temporary Works Co-ordinator</dt>
          <dd>The named person who makes sure the temporary works procedure is followed for every item, from design brief to removal.</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-100">TWS: Temporary Works Supervisor</dt>
          <dd>Helps the TWC at the workface. Can sign off lower-risk items only when the TWC has authorised that in writing.</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-100">Design brief</dt>
          <dd>What the designer is told: what the item has to do, the loads, the ground and any limits on site.</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-100">Standard solution and bespoke design</dt>
          <dd>A standard solution is proprietary or tabulated equipment used inside its stated limits. Outside those limits it needs a bespoke design for this site. A standard solution is not automatically low risk: it must be the right one for the conditions.</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-100">Design check category (Cat 0 to Cat 3)</dt>
          <dd>How independent the person checking the design must be. Cat 0: a second person confirms a standard solution suits the site. Cat 1: another member of the design team. Cat 2: someone who took no part in the design. Cat 3: a separate organisation.</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-100">Permit to load, permit to strike</dt>
          <dd>Written release, after a check against the design, before an item is loaded or used, and again before it is struck, unloaded or taken away.</dd>
        </div>
      </dl>
    </details>
  )
}

function StatusIcon({ status }: { status: RowStatus }) {
  const icon = status === 'right' ? '✓' : status === 'cautious' ? '◐' : '✗'
  return <span aria-hidden="true" className="mr-1.5 font-bold">{icon}</span>
}

const STATUS_WORDS: Record<RowStatus, string> = { right: 'Right', cautious: 'Over-cautious', wrong: 'Not right' }
const STATUS_TEXT: Record<RowStatus, string> = { right: 'text-emerald-300', cautious: 'text-amber-300', wrong: 'text-red-300' }

// ---------- The form ----------

export default function TwRegisterForm({ step, reveal, onSubmit, onContinue }: Props) {
  const { state } = useGame()
  const defer = DIFFICULTIES[state.game.difficulty].deferFeedback
  const uid = useId()
  const items = step.items

  const [rawDraft, setDraft, clearDraft] = useDraft<TwDraft>(step.id, { answers: {}, index: 0, view: 'items' })
  // A stored draft is untrusted (older build, hand-edited storage): read it defensively.
  const answers: Answers = rawDraft && typeof rawDraft.answers === 'object' && rawDraft.answers !== null ? rawDraft.answers : {}
  const index = Math.min(Math.max(0, Number.isInteger(rawDraft?.index) ? rawDraft.index : 0), Math.max(0, items.length - 1))
  const view: TwDraft['view'] = rawDraft?.view === 'review' ? 'review' : 'items'

  const [restored, setRestored] = useState(() => Object.keys(answers).length > 0)
  const [submitted, setSubmitted] = useState<TwAnswerRecord[] | null>(null)
  const [confirming, setConfirming] = useState(false)
  /** The seq of the last points award before this register was submitted. */
  const [awardSeqBefore, setAwardSeqBefore] = useState<number | null>(null)

  const itemHeadingRef = useRef<HTMLHeadingElement>(null)
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)
  /** Where focus should go after the next render (set by navigation, never on first mount). */
  const submitBtnRef = useRef<HTMLButtonElement>(null)
  const focusTarget = useRef<'item' | 'review' | 'result' | 'submit' | null>(null)

  useEffect(() => {
    const target = focusTarget.current
    if (!target) return
    focusTarget.current = null
    const el = target === 'item' ? itemHeadingRef.current
      : target === 'review' ? reviewHeadingRef.current
        : target === 'submit' ? submitBtnRef.current
          : resultHeadingRef.current
    el?.focus()
  })

  useEffect(() => {
    if (restored) announce('Your earlier answers on this register have been restored.')
    // Announce once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const answerOf = (item: TwItem): TwAnswerRecord => answers[item.id] ?? { itemId: item.id }
  const progress = items.map((i) => progressOf(answerOf(i)))
  const doneCount = progress.filter((p) => p.state === 'done').length
  const allDone = doneCount === items.length
  const firstOpen = progress.findIndex((p) => p.state !== 'done')

  const update = (itemId: string, patch: Partial<TwAnswerRecord>) => {
    setRestored(false)
    setDraft((prev) => {
      const prevAnswers = prev && typeof prev.answers === 'object' && prev.answers !== null ? prev.answers : {}
      return {
        index,
        view,
        answers: { ...prevAnswers, [itemId]: { ...(prevAnswers[itemId] ?? { itemId }), ...patch } },
      }
    })
  }

  const goItem = (i: number) => {
    focusTarget.current = 'item'
    setDraft({ answers, index: Math.min(Math.max(0, i), items.length - 1), view: 'items' })
  }
  const goReview = () => {
    focusTarget.current = 'review'
    setDraft({ answers, index, view: 'review' })
  }

  const doSubmit = () => {
    const list = items.map((i) => toRecord(i, answerOf(i)))
    setConfirming(false)
    setAwardSeqBefore(state.game.lastAward?.seq ?? 0)
    setSubmitted(list)
    onSubmit(list)
    clearDraft()
    focusTarget.current = 'result'
    if (defer) {
      sfx.click()
      announce('Register issued. On Expert it is marked at handover.')
      return
    }
    const marks = items.map((i) => markItem(i, answerOf(i)))
    const earned = marks.reduce((s, m) => s + m.earned, 0)
    const possible = marks.reduce((s, m) => s + m.possible, 0)
    const clean = marks.filter((m) => m.wrong === 0).length
    if (clean === items.length) sfx.fanfare()
    else sfx.ok()
    announce(`Register marked. ${earned} of ${possible} marks. ${clean} of ${items.length} items fully right.`)
  }

  const trySubmit = () => {
    if (allDone) doSubmit()
    else setConfirming(true)
  }

  const cardCls = 'rounded-xl border border-slate-700 bg-slate-900/50 p-4 sm:p-5'

  // ---------- After submission ----------

  if (submitted) {
    if (defer) {
      return (
        <div className={cardCls}>
          <h3 ref={resultHeadingRef} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold outline-none">Register issued</h3>
          <p className="mt-2 text-base leading-relaxed text-slate-200">
            Your register is now in use on site with {items.length} items on it. On Expert it is not marked
            here: it is audited at handover, or tested by what happens on site.
          </p>
          <button type="button" onClick={onContinue} className={`mt-4 ${BTN_PRIMARY}`}>
            Continue <span aria-hidden="true">→</span>
          </button>
        </div>
      )
    }

    const marks = items.map((i) => markItem(i, answerOf(i)))
    const earned = marks.reduce((s, m) => s + m.earned, 0)
    const possible = marks.reduce((s, m) => s + m.possible, 0)
    const clean = marks.filter((m) => m.wrong === 0).length
    const ordered = [...marks].sort((a, b) => b.wrong - a.wrong)
    const award = state.game.lastAward && awardSeqBefore !== null && state.game.lastAward.seq === awardSeqBefore + 1
      ? state.game.lastAward.amount
      : null
    // Did the group say Yes to every yes-or-no question they were asked, when the model does not?
    const yesNoFields: FieldKey[] = ['register', 'rams', 'inspection', 'holdPoint']
    const yesNoGiven = items.flatMap((i) => yesNoFields.map((f) => answerOf(i)[f])).filter((v) => v !== undefined)
    const allYes = yesNoGiven.length >= items.length * 3 && yesNoGiven.every((v) => v === true)
    const modelHasNo = items.some((i) => yesNoFields.some((f) => i.correct[f] === false))

    return (
      <div className={cardCls}>
        <h3 ref={resultHeadingRef} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold outline-none">Register marked</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-slate-100">
          <span><b>{earned} of {possible}</b> marks</span>
          <span><b>{clean} of {items.length}</b> items fully right</span>
          {award !== null && (
            <span className={`rounded-full border px-3 py-1 text-sm font-bold ${award >= 0 ? 'border-emerald-600 bg-emerald-950 text-emerald-200' : 'border-red-600 bg-red-950 text-red-200'}`}>
              {award >= 0 ? '+' : '−'}{Math.abs(award)} points
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Items with something to review come first. Each one shows your answer, the model answer and the reason.
        </p>
        {allYes && modelHasNo && (
          <p className="mt-3 rounded-lg border border-amber-600 bg-amber-950/40 p-3 text-sm leading-relaxed text-amber-100">
            <b>You answered Yes to every yes-or-no question.</b> That is not a free pass. A register that says
            yes to everything does not show the site where the real hold points are, and it is marked down
            where the answer is No.
          </p>
        )}

        <ol className="mt-4 space-y-4">
          {ordered.map((m) => {
            const reviewRows = m.rows.filter((r) => r.status !== 'right')
            const rightRows = m.rows.filter((r) => r.status === 'right')
            const ok = m.wrong === 0
            return (
              <li key={m.item.id} className={`rounded-lg border p-3 sm:p-4 ${ok ? 'border-emerald-700' : 'border-amber-600'}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h4 className="text-base font-semibold text-slate-100">{m.item.name}</h4>
                  <span className={`text-sm font-bold ${ok ? 'text-emerald-300' : 'text-amber-300'}`}>
                    <span aria-hidden="true">{ok ? '✓ ' : '⚠ '}</span>
                    {ok ? 'All right' : `${m.wrong} to review`} · {m.earned} of {m.possible} marks
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-sky-100">{m.item.explanation}</p>

                {reviewRows.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {reviewRows.map((r) => (
                      <li key={r.field} className="rounded-md border border-slate-600 bg-slate-950/60 p-3">
                        <p className={`text-sm font-bold ${STATUS_TEXT[r.status]}`}>
                          <StatusIcon status={r.status} />
                          {STATUS_WORDS[r.status]}: {FIELDS[r.field].short}
                        </p>
                        <dl className="mt-1 grid gap-x-4 gap-y-1 text-sm text-slate-200 sm:grid-cols-2">
                          <div><dt className="inline font-semibold text-slate-300">Your answer: </dt><dd className="inline">{r.yours}</dd></div>
                          <div><dt className="inline font-semibold text-slate-300">Model answer: </dt><dd className="inline font-semibold text-slate-50">{r.model}</dd></div>
                        </dl>
                        <p className="mt-1 text-sm leading-relaxed text-slate-300"><span className="font-semibold">Why: </span>{r.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {rightRows.length > 0 && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    <span className="font-bold text-emerald-300"><StatusIcon status="right" />Right: </span>
                    {rightRows.map((r) => `${FIELDS[r.field].short} (${r.model})`).join('; ')}.
                  </p>
                )}
              </li>
            )
          })}
        </ol>

        <div className="mt-4 rounded-lg border border-sky-800 bg-sky-950/30 p-3 sm:p-4">
          <p className="text-sm font-bold text-sky-300"><span aria-hidden="true">📘 </span>Learning note: {step.topic}</p>
          <p className="mt-1 text-base leading-relaxed text-sky-100">{step.learningNote}</p>
        </div>
        <button type="button" onClick={onContinue} className={`mt-4 ${BTN_PRIMARY}`}>
          Continue <span aria-hidden="true">→</span>
        </button>
      </div>
    )
  }

  // ---------- Filling in ----------

  const item = items[index]
  const a = item ? answerOf(item) : { itemId: '' }
  const here = progress[index]
  const untouched = progress.every((p) => p.state === 'empty')
  const notStarted = items.filter((_, i) => progress[i].state === 'empty')
  const partDone = items.filter((_, i) => progress[i].state === 'part')

  return (
    <div className={cardCls}>
      <h3 className="text-lg font-semibold">Temporary Works Register</h3>
      <p className="mt-1 text-base leading-relaxed text-slate-300">{step.prompt}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        Take one item at a time and answer in the order a Temporary Works Co-ordinator (<Abbr term="TWC" />)
        would think. You can go back and change anything. Nothing is marked until you submit the whole register.
      </p>
      <KeyTerms />
      {restored && (
        <p className="mt-3 rounded-lg border border-sky-700 bg-sky-950/40 px-3 py-2 text-sm text-sky-100">
          <span aria-hidden="true">↺ </span>Your earlier answers on this register have been restored.
        </p>
      )}

      <nav aria-label="Register items" className="mt-4">
        <ol className="flex flex-wrap gap-2">
          {items.map((it, i) => {
            const p = progress[i]
            const current = view === 'items' && i === index
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => goItem(i)}
                  aria-current={current ? 'step' : undefined}
                  aria-label={`Item ${i + 1}: ${it.name}. ${progressWords(p)}.`}
                  className={`flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg border px-2 text-base font-bold ${
                    current
                      ? 'border-amber-400 bg-amber-500 text-slate-950'
                      : 'border-slate-500 bg-slate-900 text-slate-100 hover:border-slate-300'
                  }`}
                >
                  {i + 1}
                  {p.state === 'done' && <span aria-hidden="true">✓</span>}
                  {p.state === 'part' && <span aria-hidden="true">…</span>}
                </button>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={goReview}
              aria-current={view === 'review' ? 'step' : undefined}
              className={`min-h-11 rounded-lg border px-3 text-base font-bold ${
                view === 'review'
                  ? 'border-amber-400 bg-amber-500 text-slate-950'
                  : 'border-slate-500 bg-slate-900 text-slate-100 hover:border-slate-300'
              }`}
            >
              Review
            </button>
          </li>
        </ol>
        <p className="mt-2 text-sm text-slate-300">
          <b className="text-slate-100">{doneCount} of {items.length}</b> items complete.{' '}
          <span aria-hidden="true">✓</span> complete, <span aria-hidden="true">…</span> part answered.
        </p>
      </nav>

      {view === 'items' && item && (
        <fieldset className="mt-4 min-w-0 rounded-lg border border-slate-600 bg-slate-950/40 p-3 sm:p-4">
          <legend className="float-left mb-1 block w-full p-0">
            <h4 ref={itemHeadingRef} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold text-slate-50 outline-none">
              <span className="block text-sm font-semibold text-amber-300">Item {index + 1} of {items.length}</span>
              {item.name}
            </h4>
          </legend>
          <p className="clear-both text-base leading-relaxed text-slate-200">{item.description}</p>
          <p className="mt-1 text-sm text-slate-300" role="status">
            {here.state === 'done' && <span aria-hidden="true">✓ </span>}
            This item: {progressWords(here).toLowerCase()}.
          </p>

          {reveal && (
            <div className="mt-3 rounded-lg border border-amber-600 bg-amber-950/40 p-3 text-sm leading-relaxed text-amber-100">
              <p className="font-bold">Tutor reveal: model answers for this item</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {FIELD_ORDER.map((f) => (
                  <li key={f}>
                    {FIELDS[f].short}:{' '}
                    <b>{f === 'catCheck' && item.correct.design === 'none' ? 'None (no design)' : shortLabel(f, item.correct[f])}</b>
                  </li>
                ))}
              </ul>
              <p className="mt-1">{item.explanation}</p>
            </div>
          )}

          <div className="mt-4 space-y-6">
            {FIELD_ORDER.filter((f) => asked(a, f)).map((f) => (
              <Question
                key={f}
                field={f}
                name={`${uid}-${item.id}-${f}`}
                value={a[f]}
                onChange={(v) => update(item.id, { [f]: v } as Partial<TwAnswerRecord>)}
              />
            ))}
            {a.register === false && (
              <p className="rounded-lg border border-slate-600 bg-slate-900 p-3 text-sm leading-relaxed text-slate-200">
                You have said this is not temporary works, so the design, check and permit questions do not
                apply. There is nothing more to answer for this item.
              </p>
            )}
            {a.register === true && a.design === 'none' && (
              <p className="rounded-lg border border-slate-600 bg-slate-900 p-3 text-sm leading-relaxed text-slate-200">
                You have said no design is needed, so there is no design check category to choose.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {index > 0 && (
              <button type="button" onClick={() => goItem(index - 1)} className={BTN_SECONDARY}>
                <span aria-hidden="true">← </span>Back
              </button>
            )}
            {index < items.length - 1 ? (
              <button type="button" onClick={() => goItem(index + 1)} className={here.state === 'done' ? BTN_PRIMARY : BTN_SECONDARY}>
                Next item<span aria-hidden="true"> →</span>
              </button>
            ) : (
              <button type="button" onClick={goReview} className={here.state === 'done' ? BTN_PRIMARY : BTN_SECONDARY}>
                Review register<span aria-hidden="true"> →</span>
              </button>
            )}
          </div>
        </fieldset>
      )}

      {view === 'review' && (
        <div className="@container mt-4 rounded-lg border border-slate-600 bg-slate-950/40 p-3 sm:p-4">
          <h4 ref={reviewHeadingRef} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold text-slate-50 outline-none">Review your register</h4>
          <p className="mt-1 text-base leading-relaxed text-slate-200" role="status">
            {allDone
              ? 'Every item is complete. Check it over as a group, then submit. You cannot change it afterwards.'
              : `${doneCount} of ${items.length} items are complete. Items that are not finished are marked “To finish”. Questions left unanswered score nothing.`}
          </p>

          {/* Wide: a matrix the group can scan across. */}
          <div className="mt-3 hidden @3xl:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Your answers for each temporary works item</caption>
              <thead>
                <tr className="border-b border-slate-500 text-slate-200">
                  <th scope="col" className="py-2 pr-2 font-semibold">Item</th>
                  {FIELD_ORDER.map((f) => <th key={f} scope="col" className="px-1.5 py-2 font-semibold">{FIELDS[f].short}</th>)}
                  <th scope="col" className="py-2 pl-2 font-semibold"><span className="sr-only">Change</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const ans = answerOf(it)
                  const p = progress[i]
                  return (
                    <tr key={it.id} className="border-b border-slate-700 align-top">
                      <th scope="row" className="py-2 pr-2 font-semibold text-slate-100">
                        {i + 1}. {it.name}
                        <span className={`block text-sm font-semibold ${p.state === 'done' ? 'text-emerald-300' : 'text-amber-300'}`}>
                          <span aria-hidden="true">{p.state === 'done' ? '✓ ' : '⚠ '}</span>
                          {p.state === 'done' ? 'Complete' : `To finish: ${progressWords(p).toLowerCase()}`}
                        </span>
                      </th>
                      {FIELD_ORDER.map((f) => (
                        <td key={f} className="px-1.5 py-2 text-slate-100">
                          <ReviewValue a={ans} field={f} />
                        </td>
                      ))}
                      <td className="py-1 pl-2">
                        <button type="button" onClick={() => goItem(i)} aria-label={`Edit item ${i + 1}: ${it.name}`} className="min-h-11 rounded-lg border border-slate-400 bg-slate-900 px-3 text-sm font-semibold text-slate-100 hover:border-slate-200">
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Narrow: one card per item, same content. */}
          <ol className="mt-3 space-y-3 @3xl:hidden">
            {items.map((it, i) => {
              const ans = answerOf(it)
              const p = progress[i]
              return (
                <li key={it.id} className="rounded-lg border border-slate-600 bg-slate-900 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-slate-100">{i + 1}. {it.name}</p>
                      <p className={`text-sm font-semibold ${p.state === 'done' ? 'text-emerald-300' : 'text-amber-300'}`}>
                        <span aria-hidden="true">{p.state === 'done' ? '✓ ' : '⚠ '}</span>
                        {p.state === 'done' ? 'Complete' : `To finish: ${progressWords(p).toLowerCase()}`}
                      </p>
                    </div>
                    <button type="button" onClick={() => goItem(i)} aria-label={`Edit item ${i + 1}: ${it.name}`} className="min-h-11 rounded-lg border border-slate-400 bg-slate-950 px-4 text-sm font-semibold text-slate-100 hover:border-slate-200">
                      Edit
                    </button>
                  </div>
                  {p.state !== 'empty' && (
                    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm @sm:grid-cols-2">
                      {FIELD_ORDER.map((f) => (
                        <div key={f}>
                          <dt className="inline text-slate-300">{FIELDS[f].short}: </dt>
                          <dd className="inline font-semibold text-slate-100"><ReviewValue a={ans} field={f} /></dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              )
            })}
          </ol>

          <div className="mt-4 flex flex-wrap gap-3">
            <button ref={submitBtnRef} type="button" onClick={trySubmit} className={BTN_PRIMARY}>Submit Register</button>
            <button type="button" onClick={() => goItem(firstOpen >= 0 ? firstOpen : index)} className={BTN_SECONDARY}>
              {firstOpen >= 0 ? 'Go to the first unfinished item' : 'Back to the items'}
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={confirming}
        title={untouched ? 'Submit an empty register?' : 'Submit an unfinished register?'}
        onClose={() => { setConfirming(false); focusTarget.current = 'submit' }}
      >
        <div className="space-y-3 text-base leading-relaxed text-slate-200">
          <p>
            {untouched
              ? 'You have not answered anything yet.'
              : `${doneCount} of ${items.length} items are complete.`}{' '}
            Unanswered questions score nothing, and the register cannot be changed after you submit.
          </p>
          {!untouched && notStarted.length > 0 && (
            <div>
              <p className="font-semibold text-slate-100">Not started:</p>
              <ul className="list-disc pl-5 text-sm">{notStarted.map((it) => <li key={it.id}>{it.name}</li>)}</ul>
            </div>
          )}
          {partDone.length > 0 && (
            <div>
              <p className="font-semibold text-slate-100">Part answered:</p>
              <ul className="list-disc pl-5 text-sm">
                {partDone.map((it) => <li key={it.id}>{it.name} ({progressWords(progressOf(answerOf(it))).toLowerCase()})</li>)}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setConfirming(false); goItem(firstOpen >= 0 ? firstOpen : 0) }}
              className={BTN_PRIMARY}
            >
              Keep working
            </button>
            <button type="button" onClick={doSubmit} className={BTN_SECONDARY}>Submit anyway</button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function ReviewValue({ a, field }: { a: TwAnswerRecord; field: FieldKey }) {
  if (!asked(a, field)) {
    if (a.register === undefined) return <><span aria-hidden="true">–</span><span className="sr-only">Not answered</span></>
    return <>Does not apply</>
  }
  const value = a[field]
  if (value === undefined) return <span className="font-semibold text-amber-300"><span aria-hidden="true">? </span>Not answered</span>
  return <>{shortLabel(field, value)}</>
}
