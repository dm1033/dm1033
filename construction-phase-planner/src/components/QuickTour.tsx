// "How it works": a six-step tour of the game in a modal dialog.
//
//   <QuickTour open={open} onClose={() => setOpen(false)} onStart={startACaseStudy} />
//   <QuickTourButton className="..." />            // button + dialog, for a header or a HUD
//
// - Never advances on its own: the group reads each step and presses Next or Back.
// - Each step has a small illustrative mock of the screen it describes, drawn in HTML and CSS.
//   The mocks are decoration (aria-hidden, nothing in them can be focused or pressed); the words
//   beside them carry the whole message.
// - tourSeen() / markTourSeen() remember, per device, that the tour was finished or dismissed, so
//   it is offered once and then waits behind the "How it works" button.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import Dialog from './Dialog'

const SEEN_KEY = 'cpp-tour-seen-v1'

/** True once the tour has been finished or dismissed on this device. */
export function tourSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return true }
}

export function markTourSeen(): void {
  try { localStorage.setItem(SEEN_KEY, '1') } catch { /* storage blocked: offer again next visit */ }
}

interface TourStep {
  id: string
  title: string
  body: string[]
  mock: ReactNode
}

// ---------- Illustrative mocks (decoration only) ----------

function MockFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-hidden="true" className="rounded-lg border border-slate-600 bg-slate-950 p-3 select-none">
      <div className="mb-2 text-xs font-semibold text-slate-400">Example: {label}</div>
      {children}
    </div>
  )
}

function DecisionMock() {
  const options = [
    { key: 'A', text: 'Let the driver reverse in alone', picked: false },
    { key: 'B', text: 'Hold the wagon until the traffic marshal is back', picked: true },
    { key: 'C', text: 'Ask a passing labourer to wave it in', picked: false },
    { key: 'D', text: 'Send the delivery away for the day', picked: false },
  ]
  return (
    <MockFrame label="a decision card">
      <div className="text-sm font-semibold text-slate-100 mb-2">
        A delivery arrives early and the traffic marshal is not at the gate. What do you do?
      </div>
      <div className="grid gap-1.5">
        {options.map((o) => (
          <div
            key={o.key}
            className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${
              o.picked ? 'border-amber-400 bg-amber-500/15 text-slate-50' : 'border-slate-600 text-slate-300'
            }`}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-slate-800 text-xs font-bold text-slate-100">{o.key}</span>
            <span className="min-w-0 flex-1">{o.text}</span>
            {o.picked && <span className="shrink-0 text-xs font-bold text-amber-300">✓ Selected</span>}
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs font-semibold text-slate-300">How sure are you?</div>
      <div className="mt-1 flex flex-wrap gap-1.5 text-sm font-bold">
        <span className="rounded-md bg-emerald-700 px-3 py-1.5 text-white">Certain</span>
        <span className="rounded-md bg-sky-700 px-3 py-1.5 text-white">Fairly sure</span>
        <span className="rounded-md bg-slate-700 px-3 py-1.5 text-white">Unsure</span>
      </div>
    </MockFrame>
  )
}

function SitePlanMock() {
  // 6 x 4 plan: a road along the bottom, the building top right, the rest is site.
  const items: Record<string, { icon: string; name: string }> = {
    '0,2': { icon: '🚪', name: 'Gate' },
    '1,1': { icon: '🚻', name: 'Welfare' },
    '0,0': { icon: '🧯', name: 'Fire point' },
    '2,2': { icon: '📦', name: 'Stores' },
    '3,2': { icon: '🚶', name: 'Walkway' },
  }
  const cells: ReactNode[] = []
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 6; x++) {
      const road = y === 3
      const building = y <= 1 && x >= 3
      const item = items[`${x},${y}`]
      cells.push(
        <div
          key={`${x},${y}`}
          className={`grid aspect-square place-items-center rounded-sm border text-base ${
            road ? 'border-slate-500 bg-slate-700' : building ? 'border-sky-500 bg-sky-900/70' : 'border-emerald-700 bg-emerald-950'
          }`}
        >
          {item?.icon}
        </div>,
      )
    }
  }
  return (
    <MockFrame label="the site set-up plan">
      <div className="grid grid-cols-6 gap-1">{cells}</div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-300">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-emerald-700 bg-emerald-950 align-middle" />Site</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-sky-500 bg-sky-900 align-middle" />Building</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-slate-500 bg-slate-700 align-middle" />Road</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-200">
        {Object.values(items).map((i) => (
          <span key={i.name} className="rounded border border-slate-600 px-1.5 py-0.5">{i.icon} {i.name}</span>
        ))}
      </div>
    </MockFrame>
  )
}

function RegisterMock() {
  const rows = [
    { item: 'Scaffold to the front', design: 'Yes', check: 'Before first use' },
    { item: 'Trench support', design: 'Yes', check: 'Every shift' },
    { item: 'Fencing on blocks', design: 'Standard', check: 'Weekly' },
  ]
  const permits = [
    { name: 'Hot works', on: true },
    { name: 'Breaking ground', on: true },
    { name: 'Confined space', on: false },
  ]
  return (
    <MockFrame label="the temporary works register and permits">
      <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-x-2 gap-y-1 text-xs">
        <div className="font-bold text-slate-300">Temporary works</div>
        <div className="font-bold text-slate-300">Design?</div>
        <div className="font-bold text-slate-300">Checked</div>
        {rows.map((r) => (
          <div key={r.item} className="contents">
            <div className="rounded bg-slate-800 px-1.5 py-1 text-slate-100">{r.item}</div>
            <div className="rounded border border-slate-500 px-1.5 py-1 text-slate-100">{r.design}</div>
            <div className="rounded border border-slate-500 px-1.5 py-1 text-slate-100">{r.check}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs font-bold text-slate-300">Permits to raise</div>
      <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
        {permits.map((p) => (
          <span
            key={p.name}
            className={`rounded-md border px-2 py-1 font-semibold ${p.on ? 'border-amber-400 bg-amber-500/15 text-amber-200' : 'border-slate-500 text-slate-300'}`}
          >
            {p.on ? '☑' : '☐'} {p.name}
          </span>
        ))}
      </div>
    </MockFrame>
  )
}

function SiteWeekMock() {
  return (
    <MockFrame label="a weekly site report">
      <div className="text-sm font-bold text-slate-100">Week 6 of 20</div>
      <div className="mt-2 grid gap-2 text-xs text-slate-200">
        <div>
          <div className="flex justify-between"><span>Contingency (spare budget)</span><span className="font-bold">£41k left</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded bg-slate-800"><div className="h-full w-[62%] bg-emerald-500" /></div>
        </div>
        <div>
          <div className="flex justify-between"><span>Float (spare days)</span><span className="font-bold">3 days left</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded bg-slate-800"><div className="h-full w-[30%] bg-amber-500" /></div>
        </div>
      </div>
      <div className="mt-3 rounded-md border border-red-400 bg-red-950 px-2 py-1.5 text-xs text-red-100">
        <span className="font-bold">⚠ Incident:</span> a pedestrian walks into the unloading area. Lost: £4k and 1 day.
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-slate-600 px-2 py-1.5 text-xs text-slate-200">
        <span><span className="font-bold">Live risk:</span> no walkway to the welfare cabin</span>
        <span className="shrink-0 rounded bg-amber-500 px-2 py-1 font-bold text-slate-950">Close out</span>
      </div>
    </MockFrame>
  )
}

function WalkMock() {
  const points = ['Site gate', 'People and plant', 'Welfare']
  return (
    <MockFrame label="the 3D site walk-through">
      <div className="relative h-28 overflow-hidden rounded-md bg-gradient-to-b from-sky-900 to-sky-950">
        {/* ground */}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-emerald-900 to-emerald-950" />
        <div className="absolute bottom-0 left-[8%] h-3 w-[84%] bg-slate-600" />
        {/* building, cabin, fence posts */}
        <div className="absolute bottom-10 right-[12%] h-16 w-24 border border-slate-300 bg-slate-500" />
        <div className="absolute bottom-10 right-[12%] h-16 w-6 translate-x-[-6rem] skew-y-[-18deg] border border-slate-300 bg-slate-600" />
        <div className="absolute bottom-8 left-[14%] h-7 w-14 border border-amber-200 bg-amber-600" />
        <div className="absolute bottom-6 left-[40%] h-6 w-1 bg-orange-400" />
        <div className="absolute bottom-6 left-[46%] h-6 w-1 bg-orange-400" />
        <div className="absolute bottom-6 left-[52%] h-6 w-1 bg-orange-400" />
        <div className="absolute bottom-[2.6rem] left-[40%] h-0.5 w-[12.5%] bg-orange-400" />
        <div className="absolute left-2 top-2 rounded bg-slate-950/80 px-1.5 py-0.5 text-xs font-bold text-slate-100">📍 Checkpoint 3 of 8</div>
      </div>
      <div className="mt-2 grid gap-1 text-xs">
        {points.map((p, i) => (
          <div key={p} className="flex items-center justify-between gap-2 rounded border border-slate-600 px-2 py-1 text-slate-200">
            <span>{i + 1}. {p}</span>
            <span className={`font-bold ${i < 2 ? 'text-emerald-300' : 'text-amber-300'}`}>{i < 2 ? '✓ Signed off' : 'Explaining now'}</span>
          </div>
        ))}
      </div>
    </MockFrame>
  )
}

function ReportMock() {
  const lines = ['Score report', 'Decision review', 'Construction phase plan', 'Missed items', 'Model answers']
  return (
    <MockFrame label="the end-of-game reports">
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-emerald-400 text-lg font-extrabold text-slate-50">78</div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-100">Team Alpha: Good</div>
          <div className="text-xs text-slate-300">Safe with minor gaps. Handed over 2 days late.</div>
        </div>
      </div>
      <div className="mt-3 grid gap-1 text-xs text-slate-200">
        {lines.map((l) => (
          <div key={l} className="flex items-center gap-2 rounded bg-slate-800 px-2 py-1">
            <span className="text-slate-300">▤</span>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 inline-block rounded-md border border-slate-500 px-2 py-1 text-xs font-bold text-slate-100">🖨 Print or save</div>
    </MockFrame>
  )
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'decide',
    title: 'Decide and commit',
    body: [
      'Your group runs a building project as Site Manager. Read each card out loud and agree an answer.',
      'Then say how sure you are. Certain earns one and a half times the points if you are right, and costs double if you are wrong. Unsure is the safer bet.',
      'On Learning and Standard you see why straight away. On Expert the marking stays sealed until handover.',
    ],
    mock: <DecisionMock />,
  },
  {
    id: 'setup',
    title: 'Set up the site',
    body: [
      'In phase 4 you lay out your site on a plan: the gate, welfare, stores, walkways and plant routes.',
      'Pick an item, then pick the square where it goes. Keep people and vehicles apart, and keep the public out.',
      'The layout is marked once. You will meet it again at the end, in 3D.',
    ],
    mock: <SitePlanMock />,
  },
  {
    id: 'register',
    title: 'Temporary works and permits',
    body: [
      'Fill in the temporary works register: what needs a design, who checks it, and how often.',
      'Then choose the permits the job needs. A missing permit is unsafe. A permit nobody needs is wasted paperwork.',
      'There is also a timed hazard walk-round and a task where you put the work in a safe order.',
    ],
    mock: <RegisterMock />,
  },
  {
    id: 'weeks',
    title: 'Site weeks and risks',
    body: [
      'After each phase, time passes on site. A shortcut you took earlier stays on site as a live risk.',
      'A live risk can come back weeks later as an incident, a notice from the Health and Safety Executive, lost days or lost money.',
      'Watch your contingency (spare budget) and your float (spare days). You can spend some of each to close a risk out before it hurts someone.',
    ],
    mock: <SiteWeekMock />,
  },
  {
    id: 'walk',
    title: 'Walk the tutor round your site',
    body: [
      'After handover, the site you set up appears in 3D.',
      'As a group, walk your tutor round eight checkpoints, from the site gate to the public side, and explain your choices. Your tutor signs off each one.',
      'If 3D is not for you, the same walk works as a flat plan or a list.',
    ],
    mock: <WalkMock />,
  },
  {
    id: 'reports',
    title: 'Reports and debrief',
    body: [
      'You finish with a full set of reports: your score, every decision with the reason, your construction phase plan, the registers, what you missed and the model answers.',
      'Print or save them for the debrief.',
      'Everything stays in this browser on this device. Nothing is uploaded.',
    ],
    mock: <ReportMock />,
  },
]

interface QuickTourProps {
  open: boolean
  /** Called when the tour is finished or dismissed. The tour is then remembered as seen. */
  onClose: () => void
  /** Optional: adds a "Start a case study" button to the last step. */
  onStart?: () => void
}

const BTN = 'min-h-11 rounded-lg px-4 py-2 text-base font-bold'

function TourBody({ onClose, onStart }: { onClose: () => void; onStart?: () => void }) {
  const [index, setIndex] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)
  const step = TOUR_STEPS[index]
  const total = TOUR_STEPS.length
  const last = index === total - 1

  // Next and Back change the content under the reader: move focus to the new step heading so a
  // screen reader reads it and a keyboard user carries on from the top of the step.
  useEffect(() => {
    if (first.current) { first.current = false; return }
    headingRef.current?.focus()
  }, [index])

  return (
    <div>
      <div className="flex gap-1" aria-hidden="true">
        {TOUR_STEPS.map((s, i) => (
          <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i <= index ? 'bg-amber-400' : 'bg-slate-600'}`} />
        ))}
      </div>

      <h3 ref={headingRef} tabIndex={-1} className="mt-4 text-lg font-bold text-slate-50 outline-none">
        <span className="block text-sm font-semibold text-amber-300">Step {index + 1} of {total}</span>
        {step.title}
      </h3>

      <div className="mt-3 grid gap-4 md:grid-cols-2 md:items-start">
        <div className="grid gap-3 text-base leading-relaxed text-slate-200">
          {step.body.map((p) => <p key={p}>{p}</p>)}
        </div>
        {step.mock}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {index > 0 && (
          <button type="button" onClick={() => setIndex(index - 1)} className={`${BTN} border border-slate-400 text-slate-100 hover:bg-slate-800`}>
            <span aria-hidden="true">← </span>Back
          </button>
        )}
        {!last && (
          <button type="button" onClick={() => setIndex(index + 1)} className={`${BTN} bg-amber-500 text-slate-950 hover:bg-amber-400`}>
            Next<span className="sr-only">: {TOUR_STEPS[index + 1].title}</span><span aria-hidden="true"> →</span>
          </button>
        )}
        {last && onStart && (
          <button type="button" onClick={() => { onClose(); onStart() }} className={`${BTN} bg-amber-500 text-slate-950 hover:bg-amber-400`}>
            Start a case study
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className={`${BTN} ml-auto ${last && !onStart ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'text-slate-200 underline underline-offset-4 hover:text-white'}`}
        >
          {last ? 'Close the tour' : 'Skip the tour'}
        </button>
      </div>
    </div>
  )
}

export default function QuickTour({ open, onClose, onStart }: QuickTourProps) {
  const close = () => { markTourSeen(); onClose() }
  return (
    <Dialog open={open} title="How it works" onClose={close} className="w-[min(100vw-1.5rem,56rem)]!">
      {/* TourBody is mounted only while the dialog is open, so the tour always starts at step 1. */}
      <TourBody onClose={close} onStart={onStart} />
    </Dialog>
  )
}

/** A self-contained "How it works" button for a header, a HUD or a help menu. */
export function QuickTourButton({ className, children, onStart }: { className?: string; children?: ReactNode; onStart?: () => void }) {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={btn} type="button" onClick={() => setOpen(true)} className={className}>
        {children ?? 'How it works'}
      </button>
      <QuickTour open={open} onClose={() => { setOpen(false); btn.current?.focus() }} onStart={onStart} />
    </>
  )
}
