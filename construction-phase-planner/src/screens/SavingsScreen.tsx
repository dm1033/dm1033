import { useMemo, useState } from 'react'

// Evidence-based savings ILLUSTRATION. Every figure is computed from the
// user's own editable inputs — nothing here is a claim of proven savings.

interface Inputs {
  delegatesPerCourse: number
  coursesPerYear: number
  pagesPerDelegate: number
  printCostPerPage: number
  trainerPrepMinsPerCourse: number
  markingMinsPerDelegate: number
  adminMinsPerDelegate: number
  reportMinsPerDelegate: number
  storageCostPerYear: number
  trainerHourlyRate: number
  adminHourlyRate: number
}

const DEFAULTS: Inputs = {
  delegatesPerCourse: 12,
  coursesPerYear: 40,
  pagesPerDelegate: 60,
  printCostPerPage: 0.05,
  trainerPrepMinsPerCourse: 90,
  markingMinsPerDelegate: 20,
  adminMinsPerDelegate: 15,
  reportMinsPerDelegate: 10,
  storageCostPerYear: 250,
  trainerHourlyRate: 35,
  adminHourlyRate: 18,
}

const FIELDS: { key: keyof Inputs; label: string; step?: number }[] = [
  { key: 'delegatesPerCourse', label: 'Delegates per course' },
  { key: 'coursesPerYear', label: 'Courses per year' },
  { key: 'pagesPerDelegate', label: 'Printed pages per delegate (exercises, handouts, marking sheets)' },
  { key: 'printCostPerPage', label: 'Printing cost per page (£)', step: 0.01 },
  { key: 'trainerPrepMinsPerCourse', label: 'Trainer exercise-preparation minutes per course' },
  { key: 'markingMinsPerDelegate', label: 'Marking minutes per delegate' },
  { key: 'adminMinsPerDelegate', label: 'Administration minutes per delegate' },
  { key: 'reportMinsPerDelegate', label: 'Report-production minutes per delegate' },
  { key: 'storageCostPerYear', label: 'Document storage cost per year (£)' },
  { key: 'trainerHourlyRate', label: 'Trainer hourly cost (£)' },
  { key: 'adminHourlyRate', label: 'Administrator hourly cost (£)' },
]

const gbp = (v: number) =>
  v.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })

export default function SavingsScreen() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS)

  const r = useMemo(() => {
    const delegates = inputs.delegatesPerCourse * inputs.coursesPerYear
    const pages = delegates * inputs.pagesPerDelegate
    const printCost = pages * inputs.printCostPerPage
    const prepHours = (inputs.trainerPrepMinsPerCourse * inputs.coursesPerYear) / 60
    const markingHours = (inputs.markingMinsPerDelegate * delegates) / 60
    const adminHours = (inputs.adminMinsPerDelegate * delegates) / 60
    const reportHours = (inputs.reportMinsPerDelegate * delegates) / 60
    const trainerValue = (prepHours + markingHours) * inputs.trainerHourlyRate
    const adminValue = (adminHours + reportHours) * inputs.adminHourlyRate
    return {
      delegates, pages, printCost, prepHours, markingHours, adminHours, reportHours,
      trainerValue, adminValue,
      total: printCost + trainerValue + adminValue + inputs.storageCostPerYear,
    }
  }, [inputs])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-1">Savings Calculator</h2>
      <p className="text-sm text-slate-400 mb-2">
        Estimate what paper-based exercise delivery currently costs your organisation, using
        your own figures. The simulation replaces printed exercises, manual marking and
        report assembly with automatic scoring and downloadable evidence.
      </p>
      <p className="text-xs rounded-md border border-amber-800 bg-amber-950/30 text-amber-200 p-2 mb-6">
        ⚠ All results are <b>illustrative</b>, calculated only from the figures you enter. They are not
        claims of proven savings and assume the simulation fully replaces the equivalent paper exercise.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300">Your inputs</h3>
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-xs text-slate-400">{f.label}</span>
              <input
                type="number"
                min={0}
                step={f.step ?? 1}
                value={inputs[f.key]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [f.key]: Math.max(0, Number(e.target.value) || 0) }))}
                className="mt-0.5 w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm"
              />
            </label>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-300 mb-3">Illustrative annual position</h3>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800 text-sm">
            <Row label="Delegates per year" value={r.delegates.toLocaleString('en-GB')} />
            <Row label="Paper avoided (pages)" value={r.pages.toLocaleString('en-GB')} />
            <Row label="Printing cost avoided" value={gbp(r.printCost)} />
            <Row label="Trainer preparation hours" value={`${r.prepHours.toFixed(0)} h`} />
            <Row label="Marking hours avoided" value={`${r.markingHours.toFixed(0)} h`} />
            <Row label="Administration hours" value={`${r.adminHours.toFixed(0)} h`} />
            <Row label="Report-production hours" value={`${r.reportHours.toFixed(0)} h`} />
            <Row label="Trainer time value" value={gbp(r.trainerValue)} />
            <Row label="Admin time value" value={gbp(r.adminValue)} />
            <Row label="Document storage" value={gbp(inputs.storageCostPerYear)} />
            <div className="flex justify-between px-4 py-3 font-bold text-amber-400">
              <span>Illustrative annual value</span>
              <span className="tabular-nums">{gbp(r.total)}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Assumptions are yours to adjust. Environmental note: a typical box of paper
            (2,500 sheets) ≈ 0.25 tree — your figure equates to roughly{' '}
            {(r.pages / 10000).toFixed(1)} trees per year.
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="tabular-nums text-slate-200">{value}</span>
    </div>
  )
}
