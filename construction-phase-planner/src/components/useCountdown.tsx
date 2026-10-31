import { useEffect, useRef, useState } from 'react'

/**
 * Countdown in seconds. Returns null when untimed. Pauses while `running` is false
 * and calls `onExpire` exactly once when it reaches zero.
 */
export function useCountdown(total: number | null, running: boolean, onExpire: () => void): number | null {
  const [remaining, setRemaining] = useState<number | null>(total)
  const expired = useRef(false)
  const cb = useRef(onExpire)
  cb.current = onExpire

  useEffect(() => {
    setRemaining(total)
    expired.current = false
  }, [total])

  useEffect(() => {
    if (total === null || !running) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const dt = (now - last) / 1000
      last = now
      setRemaining((r) => {
        if (r === null) return r
        const next = Math.max(0, r - dt)
        if (next <= 0 && !expired.current) {
          expired.current = true
          window.setTimeout(() => cb.current(), 0)
        }
        return next
      })
    }, 200)
    return () => window.clearInterval(id)
  }, [total, running])

  return remaining
}

export function TimerBar({ remaining, total }: { remaining: number | null; total: number | null }) {
  if (remaining === null || total === null) return null
  const frac = Math.max(0, remaining / total)
  const urgent = remaining <= 10
  return (
    <div className="flex items-center gap-2" role="timer" aria-live="off">
      <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden">
        <div
          className={`h-full transition-[width] duration-200 ${urgent ? 'bg-red-500' : frac < 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
          style={{ width: `${frac * 100}%` }}
        />
      </div>
      <span className={`tabular-nums text-xs font-bold w-10 text-right ${urgent ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
        {Math.ceil(remaining)}s
      </span>
    </div>
  )
}
