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
// data-contrast is also "high" when the device itself asks for more contrast (prefers-contrast: more).
// The matching CSS lives in src/index.css. index.html applies the same attributes before first paint.
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
/** The old stand-alone mute flag, read once so a muted device stays muted. */
const LEGACY_MUTE_KEY = 'cpp-sound-muted'
const listeners = new Set<() => void>()
let current: AccessSettings = load()

const oneOf = <T,>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback
const bool = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback)

/** Keep only values the app understands, so a damaged or hand-edited entry cannot break the page. */
function sanitise(raw: unknown): AccessSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const d = DEFAULT_SETTINGS
  return {
    textScale: oneOf<TextScale>(r.textScale, [100, 115, 130, 150], d.textScale),
    readableFont: bool(r.readableFont, d.readableFont),
    highContrast: bool(r.highContrast, d.highContrast),
    motion: oneOf<AccessSettings['motion']>(r.motion, ['system', 'reduce', 'allow'], d.motion),
    theme: oneOf<AccessSettings['theme']>(r.theme, ['dark', 'light'], d.theme),
    timing: oneOf<TimingMode>(r.timing, ['standard', 'extended', 'untimed'], d.timing),
    sound: bool(r.sound, d.sound),
    shortcuts: bool(r.shortcuts, d.shortcuts),
  }
}

function load(): AccessSettings {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS
    const raw = localStorage.getItem(KEY)
    if (raw) return sanitise(JSON.parse(raw))
    // First run with the settings panel: carry over the old mute button's choice.
    return localStorage.getItem(LEGACY_MUTE_KEY) === '1' ? { ...DEFAULT_SETTINGS, sound: false } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** True when the device (not this app) asks for stronger contrast. */
export function systemPrefersContrast(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-contrast: more)').matches
}

/** Page background per theme, mirrored into <meta name="theme-color"> for the browser chrome. */
const THEME_COLOURS = { dark: '#020617', light: '#ffffff' } as const

/** Write the current settings onto <html> so CSS can respond. Safe to call outside a browser. */
export function applySettings(s: AccessSettings = current): void {
  if (typeof document === 'undefined') return
  const d = document.documentElement.dataset
  d.text = String(s.textScale)
  d.font = s.readableFont ? 'readable' : 'default'
  d.contrast = s.highContrast || systemPrefersContrast() ? 'high' : 'default'
  d.motion = s.motion
  d.theme = s.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOURS[s.theme])
}

// Follow the device if its contrast preference changes while the game is open, and keep two tabs
// on the same device in step.
if (typeof window !== 'undefined') {
  if (typeof matchMedia === 'function') {
    try { matchMedia('(prefers-contrast: more)').addEventListener('change', () => applySettings()) } catch { /* old browser */ }
  }
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    current = load()
    applySettings(current)
    listeners.forEach((l) => l())
  })
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

/** For code outside React (the sound engine): run `listener` after every change. Returns an unsubscribe. */
export function onSettingsChange(listener: () => void): () => void {
  return subscribe(listener)
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
