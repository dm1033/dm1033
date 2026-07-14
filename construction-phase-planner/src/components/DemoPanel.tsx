import { useState } from 'react'

// Docked presenter script for Demonstration Mode. The full script with talking
// points lives in docs/citb/CITB_DEMO_SCRIPT.md.
const BEATS: { t: string; label: string }[] = [
  { t: '0:00', label: 'Problem & value proposition (paper, admin, evidence)' },
  { t: '1:30', label: 'Select scenario & mode' },
  { t: '2:30', label: 'Site set-up: drag-and-drop plan (Phase 4)' },
  { t: '4:30', label: 'A good decision — show feedback & score move' },
  { t: '5:30', label: 'A poor/unsafe decision — show consequence' },
  { t: '6:30', label: 'Immediate vs delayed consequences (meters panel)' },
  { t: '7:30', label: 'Dynamic conditions — incident event (Phase 12 style)' },
  { t: '8:30', label: 'Scoring dashboard + learning objectives' },
  { t: '9:30', label: 'Live Construction Phase Plan panel' },
  { t: '10:30', label: 'Tutor console (pause / reveal / custom questions)' },
  { t: '11:30', label: 'Final report tabs + certificate' },
  { t: '13:00', label: 'Savings calculator (illustrative)' },
  { t: '14:00', label: 'Licensing & deployment options' },
]

export default function DemoPanel() {
  const [open, setOpen] = useState(true)
  const [done, setDone] = useState<Set<number>>(new Set())

  return (
    <div className="fixed bottom-3 right-3 z-50 w-72 rounded-lg border border-purple-700 bg-slate-950/95 shadow-xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-purple-300"
      >
        🎬 Demo script ({done.size}/{BEATS.length})
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 max-h-64 overflow-y-auto space-y-1">
          {BEATS.map((b, i) => (
            <button
              key={i}
              onClick={() => setDone((prev) => {
                const next = new Set(prev)
                if (next.has(i)) next.delete(i)
                else next.add(i)
                return next
              })}
              className={`w-full text-left text-[11px] rounded px-2 py-1 flex gap-2 ${
                done.has(i) ? 'text-slate-600 line-through' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <span className="text-purple-400 font-mono shrink-0">{b.t}</span>
              {b.label}
            </button>
          ))}
          <p className="text-[10px] text-slate-500 pt-1">
            Full script: docs/citb/CITB_DEMO_SCRIPT.md
          </p>
        </div>
      )}
    </div>
  )
}
