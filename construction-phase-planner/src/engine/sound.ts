// Tiny synthesised sound effects (Web Audio). No audio files, works offline.
//
// Sound is one of the Access settings (src/state/settings.ts): every effect checks the setting,
// and switching sound off silences anything already playing straight away.
import { getSettings, onSettingsChange, updateSettings } from '../state/settings'

let ctx: AudioContext | null = null
let master: GainNode | null = null

const soundOn = (): boolean => getSettings().sound

function audio(): AudioContext | null {
  if (!soundOn()) return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
      master = ctx.createGain()
      master.gain.value = 1
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => { /* blocked until a tap or key press */ })
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.08) {
  const ac = audio()
  // A browser that blocks audio until the first tap keeps the context suspended. Anything scheduled
  // then would be queued and burst out late, on top of that first tap, so it is dropped instead.
  if (!ac || !master || ac.state !== 'running') return
  try {
    const t0 = ac.currentTime + start
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g).connect(master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  } catch { /* audio is a nicety: never let it break the game */ }
}

/** Open or close the master gain so a change of setting is heard (or not heard) at once. */
function syncMaster() {
  if (!ctx || !master) return
  try {
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setValueAtTime(soundOn() ? 1 : 0, ctx.currentTime)
  } catch { /* ignore */ }
}

// However the setting is changed (the panel, another tab), the master gain follows it.
onSettingsChange(syncMaster)

// Wake the audio engine on the first real tap or key press, so later effects are on time.
if (typeof window !== 'undefined') {
  const wake = () => { if (soundOn()) audio() }
  window.addEventListener('pointerdown', wake, { once: true, capture: true })
  window.addEventListener('keydown', wake, { once: true, capture: true })
}

/** Steps that have already sounded their alarm, so coming back to a step does not replay it. */
const alarmed = new Set<string>()

const alarm = () => { for (let i = 0; i < 3; i++) { tone(880, i * 0.3, 0.14, 'square', 0.04); tone(620, i * 0.3 + 0.15, 0.14, 'square', 0.04) } }

export const sfx = {
  good: () => { tone(660, 0, 0.12, 'triangle'); tone(990, 0.08, 0.18, 'triangle') },
  ok: () => { tone(520, 0, 0.15, 'triangle') },
  bad: () => { tone(220, 0, 0.2, 'sawtooth', 0.05); tone(160, 0.12, 0.25, 'sawtooth', 0.05) },
  alarm,
  /** The alarm, once per key (use the step id): a reload or a visit to another screen stays quiet. */
  alarmOnce: (key: string) => {
    if (alarmed.has(key)) return
    alarmed.add(key)
    alarm()
  },
  cash: () => { tone(1320, 0, 0.06, 'square', 0.03); tone(1760, 0.06, 0.1, 'square', 0.03) },
  tick: () => { tone(1200, 0, 0.03, 'square', 0.02) },
  /** One clear note for a time warning (30 s and 10 s left). */
  warn: () => { tone(740, 0, 0.18, 'triangle', 0.06) },
  click: () => { tone(800, 0, 0.03, 'triangle', 0.03) },
  fanfare: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.07)) },
  levelUp: () => { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.2, 'triangle', 0.06)) },
}

/** Switch sound effects on or off. Persists with the other access settings. */
export function setSound(on: boolean): void {
  updateSettings({ sound: on })
  if (on) sfx.click()
}

export function soundMuted(): boolean {
  return !soundOn()
}

/** Kept for older callers: flips the sound setting and returns true when sound is now off. */
export function toggleSound(): boolean {
  setSound(!soundOn())
  return !soundOn()
}
