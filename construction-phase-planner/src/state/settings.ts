// Access settings: per-device choices that make the game easier to see, read and pace.
//
// Contract for every component:
//   const settings = useSettings()            // re-renders when a setting changes
//   updateSettings({ timing: 'extended' })    // persist + apply
//   timeLimitFor(seconds)                     // null = no clock; otherwise the adjusted limit
//
// The settings are applied to <html> as data attributes so plain CSS can respond:
//   data-text="100|115|130|150"  data-font="default|readable"  data-contrast="default|high"
//   data-motion="system|reduce|allow"  data-theme="dark|light"
//
// Privacy: a timing adjustment is an access need. It is never written into the saved game, the
// reports, the leaderboard or any CSV export.
import { useSyncExternalStore } from 'react'

export type TextScale = 100 | 115 | 130 | 150
export type TimingMode = 'standard' | 'extended' | 'untimed'

export interface AccessSettings {
  textScale: TextScale
  /** Wider letter and line spacing with a highly legible typeface. */
  readableFont: boolean
  highContrast: boolean
  /** 'system' follows prefers-reduced-motion. */
  motion: 'system' | 'reduce' | 'allow'
  /** Bright-room (light) theme for projectors and sunlit rooms. */
  theme: 'dark' | 'light'
  /** 'extended' doubles every clock; 'untimed' removes clocks (no time bonus, no timeouts). */
  timing: TimingMode
  sound: boolean
  /** Single-key shortcuts (WCAG 2.1.4 lets the user turn these off). */
  shortcuts: boolean
}

export const DEFAULT_SETTINGS: AccessSettings = {
  textScale: 100,
  readableFont: false,
  highContrast: false,
  motion: 'system',
  theme: 'dark',
  timing: 'standard',
  sound: true,
  shortcuts: true,
}

const KEY = 'cpp-access-v1'
const listeners = new Set<() => void>()
let current: AccessSettings = load()

function load(): AccessSettings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AccessSettings>) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** Write the current settings onto <html> so CSS can respond. Safe to call outside a browser. */
export function applySettings(s: AccessSettings = current): void {
  if (typeof document === 'undefined') return
  const d = document.documentElement.dataset
  d.text = String(s.textScale)
  d.font = s.readableFont ? 'readable' : 'default'
  d.contrast = s.highContrast ? 'high' : 'default'
  d.motion = s.motion
  d.theme = s.theme
}

export function getSettings(): AccessSettings {
  return current
}

export function updateSettings(patch: Partial<AccessSettings>): void {
  current = { ...current, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(current)) } catch { /* storage blocked: keep in memory */ }
  applySettings(current)
  listeners.forEach((l) => l())
}

export function resetSettings(): void {
  updateSettings(DEFAULT_SETTINGS)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSettings(): AccessSettings {
  return useSyncExternalStore(subscribe, getSettings, getSettings)
}

/** Adjust a time limit for the delegate's timing setting. `null` means no clock at all. */
export function timeLimitFor(seconds: number | null, s: AccessSettings = current): number | null {
  if (seconds === null || s.timing === 'untimed') return null
  return s.timing === 'extended' ? seconds * 2 : seconds
}

/** True when animation should be minimised (explicit setting, or the system preference). */
export function prefersReducedMotion(s: AccessSettings = current): boolean {
  if (s.motion === 'reduce') return true
  if (s.motion === 'allow') return false
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
