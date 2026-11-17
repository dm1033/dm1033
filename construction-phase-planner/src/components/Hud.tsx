import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useGame } from '../state/GameContext'
import { DIFFICULTIES, fmtMoney } from '../engine/game'
import { Abbr } from './Abbr'

type Tone = 'good' | 'warn' | 'bad' | 'neutral'

const TONE_TEXT: Record<Tone, string> = {
  good: 'text-emerald-400',
  warn: 'text-amber-300',
  bad: 'text-red-300',
  neutral: 'text-slate-100',
}
const TONE_ICON: Record<Tone, string> = { good: '✓', warn: '!', bad: '✕', neutral: '' }
// Diagonal hatching so "low" and "gone" do not rely on amber and red alone.
const HATCH = 'repeating-linear-gradient(135deg, rgba(2,6,23,0.55) 0 2px, transparent 2px 5px)'

function daysWords(n: number): string {
  const a = Math.abs(n)
  return `${Number.isInteger(a) ? a : a.toFixed(1)} ${a === 1 ? 'day' : 'days'}`
}

/**
 * Heads-up display: the project's resources and the group's score.
 *
 * One compact strip. Narrow columns (phones, the 1024 px tablet layout) show the three figures that
 * move most (contingency, float, points); wider columns add the site week and the critical-failure
 * count. "More" opens every figure with a plain explanation, so nothing depends on a hover tooltip.
 * The strip sticks under the app header only on large, tall screens, and never while "More" is open.
 */
export default function Hud() {
  const { state } = useGame()
  const g = state.game
  const diff = DIFFICULTIES[g.difficulty]
  // Expert: marking is sealed until handover, so points, streak and critical failures are hidden.
  const sealed = diff.deferFeedback && !state.completed
  const [open, setOpen] = useState(false)
  const [stickyTop, setStickyTop] = useState<number | null>(null)
  const rootRef = useRef<HTMLElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  // Stick under the app header on large, tall viewports only. On phones, at high zoom and on
  // short screens the strip scrolls away with the page so it never covers the question.
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const header = document.querySelector<HTMLElement>('body header')
    const mq = window.matchMedia('(min-width: 1024px) and (min-height: 700px)')
    const measure = () => {
      const own = rootRef.current?.offsetHeight ?? 0
      let top = 0
      if (header) {
        const pos = getComputedStyle(header).position
        if (pos === 'sticky' || pos === 'fixed') top = Math.round(header.getBoundingClientRect().height)
      }
      const fits = mq.matches && top + own <= window.innerHeight * 0.3
      setStickyTop(fits ? top : null)
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro && header) ro.observe(header)
    if (ro && rootRef.current) ro.observe(rootRef.current)
    mq.addEventListener('change', measure)
    window.addEventListener('resize', measure)
    return () => {
      ro?.disconnect()
      mq.removeEventListener('change', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])

  // Points awards: the chip stays until the next award (no 1.5 second pop to miss) and the same
  // words go to a polite status line for screen readers. Nothing is shown or spoken on Expert.
  const award = sealed ? null : g.lastAward
  const [spoken, setSpoken] = useState('')
  const seenSeq = useRef(g.lastAward?.seq ?? 0)
  useEffect(() => {
    if (!award || award.seq === seenSeq.current) return
    seenSeq.current = award.seq
    setSpoken(`${award.amount >= 0 ? 'Plus' : 'Minus'} ${Math.abs(award.amount).toLocaleString('en-GB')} points. ${award.label}.`)
  }, [award])

  const budgetPct = g.budgetStart > 0 ? Math.max(0, Math.min(1, g.budget / g.budgetStart)) : 0
  const floatPct = g.floatStart > 0 ? Math.max(0, Math.min(1, g.floatDays / g.floatStart)) : 0
  const budgetTone: Tone = g.budget < 0 ? 'bad' : budgetPct < 0.35 ? 'warn' : 'good'
  const floatTone: Tone = g.floatDays < 0 ? 'bad' : floatPct < 0.35 ? 'warn' : 'good'
  const budgetWord = g.budget < 0 ? 'Overspent' : budgetPct < 0.35 ? 'Low' : 'OK'
  const floatWord = g.floatDays < 0 ? 'Late' : floatPct < 0.35 ? 'Low' : 'OK'
  const floatValue = g.floatDays < 0 ? `${daysWords(g.floatDays)} late` : daysWords(g.floatDays)
  const weekValue = g.week === 0 ? 'Pre-start' : `${g.week} of ${g.weeksTotal}`
  const strikeTone: Tone = g.strikes >= 3 ? 'bad' : g.strikes > 0 ? 'warn' : 'good'
  const strikeWords = g.strikes >= 3
    ? 'HSE inspection due at the next site report.'
    : g.strikes === 2
      ? 'One more brings an HSE inspection.'
      : g.strikes === 1 ? 'Three bring an HSE inspection.' : ''
  const shutdownRule = diff.shutdownAfterProhibitions === null
    ? `On ${diff.label} the project is never shut down.`
    : diff.shutdownAfterProhibitions === 1
      ? `On ${diff.label}, one Prohibition Notice shuts the project down.`
      : `On ${diff.label}, ${diff.shutdownAfterProhibitions} Prohibition Notices shut the project down.`
  const pips = (
    <span aria-hidden="true" className={`tracking-widest ${g.strikes > 0 ? 'text-red-400' : 'text-slate-400'}`}>
      {[0, 1, 2].map((i) => (i < g.strikes ? '▲' : '△')).join('')}
    </span>
  )

  const sticky = stickyTop !== null && !open

  return (
    <section
      ref={rootRef}
      aria-label="Project status"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          setOpen(false)
          moreRef.current?.focus()
        }
      }}
      style={sticky ? { position: 'sticky', top: stickyTop ?? 0 } : undefined}
      className="no-print @container z-30 mb-3 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 shadow-lg shadow-slate-950/40"
    >
      <div className="flex items-stretch gap-2">
        <dl className="flex min-w-0 flex-1 flex-wrap gap-x-2 gap-y-2">
          <Stat
            icon="💷"
            label="Contingency"
            value={fmtMoney(g.budget)}
            tone={budgetTone}
            word={budgetWord}
            bar={budgetPct}
          />
          <Stat
            icon="📅"
            label="Float"
            value={floatValue}
            tone={floatTone}
            word={floatWord}
            bar={floatPct}
          />
          <Stat icon="🗓️" label="Site week" value={weekValue} tone="neutral" wideOnly />
          <Stat
            icon={sealed ? '🔒' : '⭐'}
            label="Points"
            value={sealed ? 'Sealed' : g.points.toLocaleString('en-GB')}
            tone="neutral"
            extra={
              sealed ? (
                <span className="text-xs text-slate-400">until handover</span>
              ) : award ? (
                <span
                  key={award.seq}
                  className={`anim-rise inline-block rounded-full px-2 py-0.5 text-xs font-bold leading-tight ${
                    award.amount >= 0 ? 'bg-emerald-400 text-slate-950' : 'bg-red-700 text-white'
                  }`}
                >
                  {award.amount >= 0 ? '+' : '−'}{Math.abs(award.amount).toLocaleString('en-GB')} {award.label}
                </span>
              ) : null
            }
          />
          {!sealed && (
            <Stat
              icon="⚠"
              label="Critical failures"
              value={`${g.strikes} of 3`}
              tone={strikeTone}
              extra={pips}
              wideOnly
            />
          )}
        </dl>
        <button
          ref={moreRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={`flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center self-center rounded-lg border px-2 py-1 text-xs font-semibold ${
            open ? 'border-amber-400 bg-amber-500/15 text-amber-200' : 'border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700'
          }`}
        >
          <span aria-hidden="true" className="text-base leading-none">{open ? '▴' : 'ⓘ'}</span>
          <span>{open ? 'Less' : 'More'}<span className="sr-only">: every figure and what it means</span></span>
        </button>
      </div>

      {/* Narrow layouts hide the critical-failure column, so raise it as a line as soon as there is one. */}
      {!sealed && g.strikes > 0 && (
        <p className="@xl:hidden mt-2 rounded-md border border-red-700 bg-red-950/60 px-2 py-1 text-sm text-red-100">
          {pips} <b>Critical failures: {g.strikes} of 3.</b> {strikeWords}
        </p>
      )}

      <p role="status" className="sr-only">{spoken}</p>

      {open && (
        <div id={panelId} className="mt-2 border-t border-slate-700 pt-2">
          <p id={`${panelId}-title`} className="text-sm font-bold text-slate-100">What the figures mean</p>
          <dl aria-labelledby={`${panelId}-title`} className="mt-1 grid gap-x-6 gap-y-2 text-sm @2xl:grid-cols-2">
            <Explain name="Contingency" now={`${fmtMoney(g.budget)} left of ${fmtMoney(g.budgetStart)}`}>
              Money held back for things going wrong. Incidents, enforcement notices, rework and closing out
              risks all spend it. Below zero means the job is over budget.
            </Explain>
            <Explain name="Float" now={`${floatValue}${g.floatDays >= 0 ? ' in hand' : ''} (started with ${daysWords(g.floatStart)})`}>
              Spare working days in the programme. Delays use them up. Below zero means the project is late.
            </Explain>
            <Explain name="Site week" now={g.week === 0 ? 'Not on site yet' : `Week ${g.week} of ${g.weeksTotal}`}>
              Time passes on site as each construction phase finishes. A weekly site report then shows what
              happened because of your earlier decisions.
            </Explain>
            <Explain name="Points" now={sealed ? 'Sealed until handover' : g.points.toLocaleString('en-GB')}>
              {sealed
                ? 'On Expert your answers are not marked during play. Points, streak and critical failures are revealed at handover. Watch the weekly site reports for warning signs.'
                : 'The game score, used for the leaderboard. Your competence grade is separate and is shown in the end-of-game reports.'}
            </Explain>
            {!sealed && (
              <Explain name="Critical failures" now={`${g.strikes} of 3`}>
                A critical failure is a decision that leaves people in serious danger. At three, <Abbr term="HSE" /> inspects
                at the next weekly site report and serves a Prohibition Notice; the count then starts again. {shutdownRule}
              </Explain>
            )}
            {!sealed && (
              <Explain name="Streak" now={`${g.streak} in a row`}>
                Best answers in a row. A longer streak adds bonus points to your next best answer.
              </Explain>
            )}
            <Explain name="Adviser calls left" now={`${g.lifelines}`}>
              On a question you can call the health and safety adviser. The call removes two wrong answers and
              halves the points for that question.
            </Explain>
            <Explain name="Incident-free weeks" now={`${g.safeWeeks}`}>
              Site weeks with no incident and no enforcement notice. Incidents so far: {g.consequences.length}.
            </Explain>
          </dl>
        </div>
      )}
    </section>
  )
}

function Stat({ icon, label, value, tone, word, bar, extra, wideOnly }: {
  icon: string
  label: string
  value: string
  tone: Tone
  /** State in words (OK, Low, Late): shown with an icon so the colour is never the only signal. */
  word?: string
  bar?: number
  extra?: ReactNode
  /** Hidden in narrow columns; the figure is still listed under "More". */
  wideOnly?: boolean
}) {
  return (
    <div className={`${wideOnly ? 'hidden @xl:flex' : 'flex'} min-w-[5.25rem] flex-1 flex-col items-center justify-start text-center`}>
      <dt className="text-xs leading-tight text-slate-300">
        <span aria-hidden="true">{icon} </span>{label}
      </dt>
      <dd className="m-0 flex flex-col items-center">
        <span className={`text-base font-extrabold leading-tight tabular-nums ${TONE_TEXT[tone]}`}>{value}</span>
        {(word || bar !== undefined) && (
          <span className={`flex items-center gap-1 text-xs leading-tight ${TONE_TEXT[tone]}`}>
            {bar !== undefined && (
              <span
                aria-hidden="true"
                className={`block h-2 w-10 overflow-hidden rounded-sm border bg-slate-800 ${tone === 'bad' ? 'border-red-400' : 'border-slate-400'}`}
                style={tone === 'bad' ? { backgroundImage: HATCH.replace('rgba(2,6,23,0.55)', 'rgba(248,113,113,0.8)') } : undefined}
              >
                <span
                  className={`block h-full forced-colors:bg-[Highlight] ${tone === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${bar * 100}%`, backgroundImage: tone === 'warn' ? HATCH : undefined }}
                />
              </span>
            )}
            {word && <span><span aria-hidden="true">{TONE_ICON[tone]} </span>{word}</span>}
          </span>
        )}
        {extra}
      </dd>
    </div>
  )
}

function Explain({ name, now, children }: { name: string; now: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-semibold text-slate-100">
        {name}: <span className="tabular-nums text-amber-200">{now}</span>
      </dt>
      <dd className="m-0 text-slate-300">{children}</dd>
    </div>
  )
}
