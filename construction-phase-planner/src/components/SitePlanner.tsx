import { useMemo, useState } from 'react'
import type { PlacementRecord, SiteSetupStep } from '../types'
import { SITE_ITEM_MAP, ITEM_CATEGORY_LABELS, type SiteItemDef } from '../data/siteItems'
import { assessPlacements, type PlacementAssessment } from '../engine/scoring'

interface Props {
  step: SiteSetupStep
  reveal: boolean
  /** Assessment mode: record placements but defer the assessment to the final report. */
  deferFeedback?: boolean
  onSubmit: (placements: PlacementRecord[]) => void
  onContinue: () => void
}

export default function SitePlanner({ step, reveal, deferFeedback, onSubmit, onContinue }: Props) {
  const [placements, setPlacements] = useState<PlacementRecord[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<PlacementAssessment[] | null>(null)

  const paletteItems = useMemo(() => {
    const ids = step.rules.map((r) => r.itemId)
    const items = ids.map((id) => SITE_ITEM_MAP[id]).filter(Boolean)
    const grouped = new Map<SiteItemDef['category'], SiteItemDef[]>()
    for (const item of items) {
      grouped.set(item.category, [...(grouped.get(item.category) ?? []), item])
    }
    return grouped
  }, [step])

  const blockedCells = useMemo(() => {
    const set = new Set<string>()
    for (const z of step.zones.filter((z) => z.blocked)) {
      for (let x = z.x1; x <= z.x2; x++) for (let y = z.y1; y <= z.y2; y++) set.add(`${x},${y}`)
    }
    return set
  }, [step])

  const placeAt = (itemId: string, x: number, y: number) => {
    if (result) return
    if (blockedCells.has(`${x},${y}`)) return
    if (placements.some((p) => p.x === x && p.y === y && p.itemId !== itemId)) return
    setPlacements((prev) => [...prev.filter((p) => p.itemId !== itemId), { itemId, x, y }])
    setSelected(null)
  }

  const removeItem = (itemId: string) => {
    if (result) return
    setPlacements((prev) => prev.filter((p) => p.itemId !== itemId))
  }

  const handleCellClick = (x: number, y: number) => {
    const existing = placements.find((p) => p.x === x && p.y === y)
    if (existing && !selected) {
      removeItem(existing.itemId)
      return
    }
    if (selected) placeAt(selected, x, y)
  }

  const submit = () => {
    onSubmit(placements)
    if (deferFeedback) {
      onContinue()
      return
    }
    setResult(assessPlacements(step, placements))
  }

  const requiredCount = step.rules.filter((r) => r.required).length
  const placedRequired = step.rules.filter((r) => r.required && placements.some((p) => p.itemId === r.itemId)).length

  const statusStyle: Record<PlacementAssessment['status'], string> = {
    good: 'text-emerald-400',
    neutral: 'text-amber-400',
    unsafe: 'text-red-400',
    missing: 'text-red-400',
  }
  const statusLabel: Record<PlacementAssessment['status'], string> = {
    good: '✓ Well placed',
    neutral: '~ Acceptable location',
    unsafe: '✗ UNSAFE location',
    missing: '✗ MISSING',
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-lg font-semibold leading-snug mb-1">Site Set-Up Planner</h3>
      <p className="text-sm text-slate-400 mb-1">{step.prompt}</p>
      <p className="text-[11px] text-slate-500 mb-4">
        Select an item, then click a cell to place it (or drag it on). Click a placed item to remove it.
        Required items placed: <b className={placedRequired === requiredCount ? 'text-emerald-400' : 'text-amber-400'}>{placedRequired}/{requiredCount}</b>
      </p>

      <div className="grid lg:grid-cols-[1fr_260px] gap-4">
        {/* Grid */}
        <div>
          <div
            className="grid gap-px bg-slate-800 rounded-lg overflow-hidden border border-slate-700 select-none"
            style={{ gridTemplateColumns: `repeat(${step.grid.cols}, minmax(0,1fr))` }}
          >
            {Array.from({ length: step.grid.rows }).flatMap((_, y) =>
              Array.from({ length: step.grid.cols }).map((_, x) => {
                const zones = step.zones.filter((z) => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2)
                const topZone = zones[zones.length - 1]
                const placed = placements.find((p) => p.x === x && p.y === y)
                const blocked = blockedCells.has(`${x},${y}`)
                const assessment = result && placed ? result.find((r) => r.itemId === placed.itemId) : null
                return (
                  <div
                    key={`${x},${y}`}
                    onClick={() => handleCellClick(x, y)}
                    onDragOver={(e) => { if (!blocked) e.preventDefault() }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const id = e.dataTransfer.getData('text/plain')
                      if (id) placeAt(id, x, y)
                    }}
                    title={topZone ? topZone.label : undefined}
                    className={`aspect-square relative flex items-center justify-center text-base sm:text-lg cursor-pointer
                      ${topZone ? topZone.color : 'bg-slate-950'}
                      ${blocked ? 'cursor-not-allowed opacity-90' : selected && !result ? 'hover:ring-2 hover:ring-amber-400 hover:ring-inset' : ''}`}
                  >
                    {placed && (
                      <span
                        draggable={!result}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', placed.itemId)}
                        className={`drop-shadow ${assessment ? (assessment.status === 'good' ? 'ring-2 ring-emerald-400 rounded' : assessment.status === 'unsafe' ? 'ring-2 ring-red-500 rounded' : 'ring-2 ring-amber-400 rounded') : ''}`}
                      >
                        {SITE_ITEM_MAP[placed.itemId]?.icon}
                      </span>
                    )}
                  </div>
                )
              }),
            )}
          </div>
          {/* Zone legend */}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
            {step.zones.map((z) => (
              <span key={z.id} className="inline-flex items-center gap-1">
                <span className={`inline-block w-3 h-3 rounded-sm border border-slate-600 ${z.color}`} />
                {z.label}{z.blocked ? ' (no placement)' : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Palette */}
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {[...paletteItems.entries()].map(([cat, items]) => (
            <div key={cat}>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                {ITEM_CATEGORY_LABELS[cat]}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const isPlaced = placements.some((p) => p.itemId === item.id)
                  const rule = step.rules.find((r) => r.itemId === item.id)
                  const isSelected = selected === item.id
                  return (
                    <button
                      key={item.id}
                      draggable={!result}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
                      onClick={() => setSelected(isSelected ? null : item.id)}
                      disabled={!!result}
                      className={`w-full flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15'
                          : isPlaced
                            ? 'border-emerald-800 bg-emerald-950/30 text-slate-300'
                            : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {rule?.required && !isPlaced && <span className="text-[9px] text-amber-400 font-bold">REQ</span>}
                      {isPlaced && <span className="text-emerald-400">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!result ? (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={submit}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5"
          >
            Confirm Site Set-Up
          </button>
          {placedRequired < requiredCount && (
            <span className="text-xs text-amber-400">
              {requiredCount - placedRequired} required item(s) not yet placed — unplaced items score zero.
            </span>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 max-h-56 overflow-y-auto">
            <p className="text-xs font-bold text-slate-300 mb-2">Placement assessment</p>
            <div className="grid sm:grid-cols-2 gap-1 text-xs">
              {result.map((r) => (
                <div key={r.itemId} className="flex gap-2">
                  <span className={`font-bold whitespace-nowrap ${statusStyle[r.status]}`}>{statusLabel[r.status]}</span>
                  <span className="text-slate-400">{SITE_ITEM_MAP[r.itemId]?.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-sky-900 bg-sky-950/30 p-3 text-sm text-sky-200">
            <p className="font-bold text-xs text-sky-400 mb-1">📘 Learning note — {step.topic}</p>
            <p>{step.learningNote}</p>
          </div>
          <button onClick={onContinue} className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5">
            Continue →
          </button>
        </div>
      )}

      {reveal && !result && (
        <div className="mt-3 rounded-md border border-amber-800 bg-amber-950/30 p-2 text-xs text-amber-200">
          <b>Tutor reveal:</b> ideal locations — {step.rules.filter((r) => r.required).map((r) => {
            const zoneNames = r.goodZones.map((gz) => step.zones.find((z) => z.id === gz)?.label ?? gz).join(' / ')
            return `${SITE_ITEM_MAP[r.itemId]?.label}: ${zoneNames}`
          }).join(' · ')}
        </div>
      )}
    </div>
  )
}
