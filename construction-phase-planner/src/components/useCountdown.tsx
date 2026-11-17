// The game clock: a countdown hook, the timer strip that shows it, and two small helpers that
// decide how long a group needs and where a sticky strip may sit.
//
//   const remaining = useCountdown(total, running, onExpire)                      // as before
//   const remaining = useCountdown(total, running, onExpire, { paused, persistKey, exact })
//   <TimerBar remaining={remaining} total={total} />
//
// The clock only moves while it is fair for it to move. It stops:
//   - while `running` is false or `options.paused` is true (tutor pause, weekly report);
//   - while any <Dialog> is open (glossary, settings, weekly report);
//   - while the tab is hidden or the tablet is locked.
// onExpire can therefore never fire on a question the group cannot see.
//
// With `persistKey` the time already used is kept in localStorage, so a reload or a visit to
// another screen picks the clock up where it stopped instead of handing out a full one.
import { useEffect, useRef, useState } from 'react'
import { isDialogOpen } from './Dialog'
import { announce } from '../state/announce'
import { prefersReducedMotion, useSettings } from '../state/settings'
import { sfx } from '../engine/sound'

/** Shares the draft prefix so the "new project" clean-up (clearAllDrafts) removes old clocks too. */
const CLOCK_PREFIX = 'cpp-draft:clock:'
const TICK_MS = 250

export interface CountdownOptions {
  /** Extra hold, on top of `running`: the clock stands still and cannot expire. */
  paused?: boolean
  /** Unique per run and step, e.g. `${seed}:${step.id}`. Keeps the time used across reloads. */
  persistKey?: string
  /** Receives the precise seconds left (the return value is whole seconds). */
  exact?: { current: number | null }
}

function readElapsed(key: string | null): number {
  if (!key) return 0
  try {
    const n = Number(localStorage.getItem(key))
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

function writeElapsed(key: string | null, elapsed: number): void {
  if (!key) return
  try { localStorage.setItem(key, elapsed.toFixed(1)) } catch { /* storage blocked: memory only */ }
}

/** Forget the stored clock for a step. Call it when the step has been answered. */
export function clearCountdown(persistKey: string): void {
  try { localStorage.removeItem(CLOCK_PREFIX + persistKey) } catch { /* storage blocked */ }
}

/**
 * Countdown in whole seconds. Returns null when untimed (`total` is null). Calls `onExpire`
 * exactly once when it reaches zero, and never while the clock is held.
 */
export function useCountdown(
  total: number | null,
  running: boolean,
  onExpire: () => void,
  options: CountdownOptions = {},
): number | null {
  const storageKey = options.persistKey ? CLOCK_PREFIX + options.persistKey : null
  const [, rerender] = useState(0)
  const elapsed = useRef(0)
  const loadedKey = useRef<string | null | undefined>(undefined)
  const expired = useRef(false)
  const shown = useRef<number | null>(null)
  const cb = useRef(onExpire)
  const opts = useRef(options)
  cb.current = onExpire
  opts.current = options

  // First render, or a different step on the same instance: pick up the time already used.
  if (loadedKey.current !== storageKey) {
    loadedKey.current = storageKey
    elapsed.current = readElapsed(storageKey)
    expired.current = false
  }

  const exactLeft = total === null ? null : Math.max(0, total - elapsed.current)
  const secondsLeft = exactLeft === null ? null : Math.ceil(exactLeft)
  shown.current = secondsLeft
  if (options.exact) options.exact.current = exactLeft

  // A longer limit (extra time switched on mid-question) gives an expired clock its time back.
  useEffect(() => { expired.current = false }, [total])

  useEffect(() => {
    if (total === null || !running) return
    let last = performance.now()
    const save = () => writeElapsed(storageKey, elapsed.current)
    const tick = () => {
      const now = performance.now()
      // Never take more than one second in a step: a sleeping laptop or a stalled tab must not
      // swallow the group's time in one gulp.
      const dt = Math.min(1, (now - last) / 1000)
      last = now
      if (opts.current.paused || document.hidden || isDialogOpen() || expired.current) return
      elapsed.current = Math.min(total, elapsed.current + dt)
      const left = total - elapsed.current
      if (opts.current.exact) opts.current.exact.current = left
      const secs = Math.ceil(left)
      if (secs !== shown.current) {
        shown.current = secs
        save()
        rerender((n) => n + 1) // one render a second, not five
      }
      if (left <= 0) {
        expired.current = true
        cb.current()
      }
    }
    const id = window.setInterval(tick, TICK_MS)
    const resync = () => { last = performance.now() }
    document.addEventListener('visibilitychange', resync)
    window.addEventListener('pagehide', save)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', resync)
      window.removeEventListener('pagehide', save)
      save()
    }
  }, [total, running, storageKey])

  return secondsLeft
}

// ---------- How long does a group need? ----------

/** Read aloud at about 180 words a minute. */
const WORDS_PER_SECOND = 3
/** Time to agree an answer once everyone has heard it. */
const DISCUSSION_SECONDS = 30

export function countWords(...texts: (string | undefined)[]): number {
  return texts.reduce((n, t) => n + (t ? t.trim().split(/\s+/).filter(Boolean).length : 0), 0)
}

/**
 * The fair limit for a card with this many words: never less than the time to read it aloud
 * plus 30 seconds to agree. `base` is the difficulty's limit (null = this card has no clock).
 * Rounded up to 5 seconds. Pass the result through timeLimitFor() for the access setting.
 */
export function fairTimeLimit(base: number | null, words: number): number | null {
  if (base === null) return null
  const needed = Math.ceil(words / WORDS_PER_SECOND) + DISCUSSION_SECONDS
  return Math.ceil(Math.max(base, needed) / 5) * 5
}

// ---------- Where may a sticky strip sit? ----------

/**
 * Height in pixels of the sticky app header, or 0 when the header is not pinned. A sticky strip
 * uses it as its `top` so it sits under the header instead of sliding beneath it.
 */
export function useStickyTop(): number {
  const [top, setTop] = useState(0)
  useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const measure = () => {
      const pos = getComputedStyle(header).position
      setTop(pos === 'sticky' || pos === 'fixed' ? Math.round(header.getBoundingClientRect().height) : 0)
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(header)
    window.addEventListener('resize', measure)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  return top
}

// ---------- The timer strip ----------

function spoken(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  const mins = m === 1 ? '1 minute' : `${m} minutes`
  const rest = s === 1 ? '1 second' : `${s} seconds`
  return m === 0 ? rest : s === 0 ? mins : `${mins} ${rest}`
}

function clock(secs: number): string {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
}

interface TimerBarProps {
  remaining: number | null
  total: number | null
  /** Accessible name and visible label. */
  label?: string
  /** Show "Paused" in words while the clock is held. */
  paused?: boolean
  /** Extra classes on the wrapper. */
  className?: string
}

/**
 * One-line timer: label, bar and a text readout. In the last 30 seconds it turns amber, and in
 * the last 10 it changes shape and wording ("Hurry") as well as colour. It speaks at 30 s and
 * 10 s only, and ticks quietly through the last five seconds.
 */
export function TimerBar({ remaining, total, label = 'Time left', paused = false, className = '' }: TimerBarProps) {
  const settings = useSettings()
  const secs = remaining === null ? null : Math.max(0, Math.ceil(remaining))
  const prev = useRef<number | null>(secs)

  useEffect(() => {
    const before = prev.current
    prev.current = secs
    if (secs === null || before === null || secs >= before) return
    if (before > 30 && secs <= 30 && secs > 10) announce('30 seconds left.')
    if (before > 10 && secs <= 10 && secs > 0) announce('10 seconds left.', 'assertive')
    if (secs <= 5 && secs > 0) sfx.tick()
  }, [secs])

  if (secs === null || total === null || total <= 0) return null
  const frac = Math.max(0, Math.min(1, secs / total))
  const urgent = secs <= 10
  const warn = !urgent && secs <= 30
  const fill = paused ? 'bg-slate-400' : urgent ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-emerald-500'
  const still = prefersReducedMotion(settings) || paused

  return (
    <div role="timer" aria-label={label} className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <span className="shrink-0 text-xs font-semibold text-slate-300" aria-hidden="true">
        ⏱ {label}
      </span>
      <div
        aria-hidden="true"
        className={`min-w-8 flex-1 overflow-hidden rounded-full border bg-slate-800 ${urgent && !paused ? 'h-3.5 border-red-400' : 'h-2.5 border-slate-600'}`}
      >
        <div
          className={`h-full w-full origin-left forced-colors:bg-[CanvasText] ${fill}`}
          style={{ transform: `scaleX(${frac})`, transition: still ? 'none' : 'transform 1s linear' }}
        />
      </div>
      <span
        aria-hidden="true"
        className={`shrink-0 rounded-md border px-2 py-0.5 text-right text-sm font-bold tabular-nums ${
          paused
            ? 'border-slate-500 bg-slate-800 text-slate-200'
            : urgent
              ? 'border-red-300 bg-red-700 text-white'
              : warn
                ? 'border-amber-500 bg-amber-950 text-amber-200'
                : 'border-transparent text-slate-100'
        }`}
      >
        {paused ? '⏸ Paused · ' : urgent ? '⚠ Hurry · ' : ''}{clock(secs)}
      </span>
      <span className="sr-only">{paused ? 'Clock paused. ' : ''}{spoken(secs)}</span>
    </div>
  )
}
