import { useEffect, useId, useState } from 'react'
import { useGame } from '../state/GameContext'
import { useDraft } from '../state/useDraft'
import { METER_LABELS, SCORE_LABELS } from '../types'
import type { MeterKey, ScoreKey } from '../types'
import { categoryScore } from '../engine/scoring'
import { DIFFICULTIES } from '../engine/game'

type Item = { kind: 'meter'; key: MeterKey } | { kind: 'score'; key: ScoreKey }
type Band = 'good' | 'watch' | 'poor'

/** Meters where a high number is bad news. */
const LOWER_IS_BETTER: ReadonlySet<MeterKey> = new Set<MeterKey>(['enforcementRisk', 'incidentLikelihood', 'cost'])

/** The three meters that drive what happens on site next: incidents, HSE visits and the client. */
const KEY_METERS: Item[] = [
  { kind: 'meter', key: 'incidentLikelihood' },
  { kind: 'meter', key: 'enforcementRisk' },
  { kind: 'meter', key: 'clientConfidence' },
]

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'People and compliance',
    items: [
      { kind: 'score', key: 'legal' },
      { kind: 'score', key: 'safety' },
      { kind: 'meter', key: 'enforcementRisk' },
      { kind: 'meter', key: 'morale' },
    ],
  },
  {
    title: 'Programme and cost',
    items: [
      { kind: 'score', key: 'planning' },
      { kind: 'score', key: 'programme' },
      { kind: 'score', key: 'quality' },
      { kind: 'meter', key: 'cost' },
      { kind: 'meter', key: 'clientConfidence' },
    ],
  },
  {
    title: 'Site conditions',
    items: [
      { kind: 'meter', key: 'incidentLikelihood' },
      { kind: 'score', key: 'temporaryWorks' },
      { kind: 'score', key: 'environment' },
    ],
  },
]

const BAND_WORD: Record<Band, string> = { good: 'Good', watch: 'Watch', poor: 'Poor' }
const BAND_ICON: Record<Band, string> = { good: '✓', watch: '!', poor: '✕' }
const BAND_TEXT: Record<Band, string> = { good: 'text-emerald-400', watch: 'text-amber-300', poor: 'text-red-300' }
const BAND_FILL: Record<Band, string> = { good: 'bg-emerald-400', watch: 'bg-amber-400', poor: 'bg-red-400' }
// Hatching on "watch" and "poor" so the three bands differ without colour.
const HATCH: Record<Band, string | undefined> = {
  good: undefined,
  watch: 'repeating-linear-gradient(135deg, rgba(2,6,23,0.5) 0 2px, transparent 2px 6px)',
  poor: 'repeating-linear-gradient(90deg, rgba(2,6,23,0.6) 0 2px, transparent 2px 4px)',
}

function bandFor(value: number, lowerIsBetter: boolean): Band {
  const x = lowerIsBetter ? 100 - value : value
  return x >= 75 ? 'good' : x >= 45 ? 'watch' : 'poor'
}

const ALL_KEY = 'cpp-dashboard-show-all'

/**
 * Project meters. Three key meters by default; "Show all" opens the full set in three groups.
 * Every row says its value, its band in words and which direction is good.
 * Expert: competence scores are sealed until handover, and the project meters only move at each
 * weekly site report, so no single answer can be read off as right or wrong.
 */
export default function Dashboard() {
  const { state } = useGame()
  const g = state.game
  const sealed = DIFFICULTIES[g.difficulty].deferFeedback && !state.completed
  const listId = useId()
  const [showAll, setShowAll] = useState<boolean>(() => {
    try { return localStorage.getItem(ALL_KEY) === '1' } catch { return false }
  })
  const toggle = () => {
    setShowAll((v) => {
      try { localStorage.setItem(ALL_KEY, v ? '0' : '1') } catch { /* storage blocked */ }
      return !v
    })
  }

  // Expert: freeze the meters at the last weekly site report (kept across a reload).
  const [seal, setSeal] = useDraft<{ week: number; meters: Record<MeterKey, number> } | null>('meter-seal', null)
  useEffect(() => {
    if (sealed && (seal === null || seal.week !== g.week)) setSeal({ week: g.week, meters: state.scores.meters })
  }, [sealed, seal, g.week, state.scores.meters, setSeal])
  const meters = sealed && seal ? seal.meters : state.scores.meters
  const asAt = !sealed
    ? null
    : (seal?.week ?? g.week) === 0 ? 'Shown as at the start of the project.' : `Shown as at the week ${seal?.week ?? g.week} site report.`

  const row = (item: Item) => {
    if (item.kind === 'meter') {
      const lower = LOWER_IS_BETTER.has(item.key)
      return (
        <MeterRow
          key={`m-${item.key}`}
          label={METER_LABELS[item.key]}
          value={meters[item.key]}
          band={bandFor(meters[item.key], lower)}
          direction={lower ? 'lower is better' : 'higher is better'}
        />
      )
    }
    if (sealed) return null
    const score = categoryScore(state.scores, item.key)
    return (
      <MeterRow
        key={`s-${item.key}`}
        label={SCORE_LABELS[item.key]}
        value={score}
        band={score === null ? null : bandFor(score, false)}
        direction="higher is better"
      />
    )
  }

  const total = sealed ? 5 : 12

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-100">{showAll ? 'Project meters' : 'Key project meters'}</h2>
        <button
          type="button"
          aria-expanded={showAll}
          aria-controls={listId}
          onClick={toggle}
          className="min-h-11 rounded-md border border-slate-500 bg-slate-800 px-3 text-sm font-semibold text-slate-100 hover:bg-slate-700"
        >
          {showAll ? 'Show key 3' : `Show all ${total}`}
        </button>
      </div>

      {sealed && (
        <p className="text-sm text-slate-300">
          <span aria-hidden="true">🔒 </span>Expert: your competence scores are sealed until handover. These meters
          update at each weekly site report, not after each answer. {asAt}
        </p>
      )}

      <div id={listId} className="space-y-3">
        {!showAll ? (
          <ul className="space-y-2.5">{KEY_METERS.map(row)}</ul>
        ) : (
          GROUPS.map((grp) => {
            const rows = grp.items.map(row).filter(Boolean)
            if (rows.length === 0) return null
            return (
              <section key={grp.title} aria-label={grp.title}>
                <h3 className="mb-1.5 border-b border-slate-700 pb-1 text-xs font-bold uppercase tracking-wide text-slate-300">{grp.title}</h3>
                <ul className="space-y-2.5">{rows}</ul>
              </section>
            )
          })
        )}
      </div>

      {showAll && !sealed && (
        <p className="text-xs text-slate-400">
          Scores out of 100 are your competence marks so far. Meters out of 100 show the state of the project.
        </p>
      )}

      {!sealed && state.criticalFailures.length > 0 && (
        <div className="rounded-md border border-red-700 bg-red-950/50 p-2.5">
          <h3 className="text-sm font-bold text-red-200">
            <span aria-hidden="true">⚠ </span>Critical failures so far: {state.criticalFailures.length}
          </h3>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-red-100">
            {state.criticalFailures.slice(-3).map((f) => <li key={f}>{f}</li>)}
          </ul>
          {state.criticalFailures.length > 3 && (
            <p className="mt-1 text-xs text-red-200">Showing the latest 3. The full list is in the end-of-game reports.</p>
          )}
        </div>
      )}
    </div>
  )
}

function MeterRow({ label, value, band, direction }: {
  label: string
  /** null = not assessed yet. */
  value: number | null
  band: Band | null
  direction: string
}) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-2 text-sm text-slate-100">
        <span>{label}</span>
        <span className="shrink-0 font-bold tabular-nums">
          {value === null ? <span aria-hidden="true">—</span> : <>{value}<span className="sr-only"> out of 100</span></>}
        </span>
      </div>
      <div aria-hidden="true" className="mt-0.5 h-2.5 overflow-hidden rounded-sm border border-slate-500 bg-slate-800">
        {band && value !== null && (
          <div
            className={`h-full motion-safe:transition-[width] forced-colors:bg-[Highlight] ${BAND_FILL[band]}`}
            style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundImage: HATCH[band] }}
          />
        )}
      </div>
      <div className="mt-0.5 flex flex-wrap justify-between gap-x-2 text-xs">
        {band ? (
          <span className={`font-semibold ${BAND_TEXT[band]}`}><span aria-hidden="true">{BAND_ICON[band]} </span>{BAND_WORD[band]}</span>
        ) : (
          <span className="text-slate-400">Not assessed yet</span>
        )}
        <span className="text-slate-400">{direction}</span>
      </div>
    </li>
  )
}
