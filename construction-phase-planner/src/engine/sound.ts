// Tiny synthesised sound effects (Web Audio). No audio files, works offline.
import { isMuted, setMuted } from '../state/profile'

let ctx: AudioContext | null = null
let muted = isMuted()

function audio(): AudioContext | null {
  if (muted) return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.08) {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + start
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export const sfx = {
  good: () => { tone(660, 0, 0.12, 'triangle'); tone(990, 0.08, 0.18, 'triangle') },
  ok: () => { tone(520, 0, 0.15, 'triangle') },
  bad: () => { tone(220, 0, 0.2, 'sawtooth', 0.05); tone(160, 0.12, 0.25, 'sawtooth', 0.05) },
  alarm: () => { for (let i = 0; i < 3; i++) { tone(880, i * 0.3, 0.14, 'square', 0.04); tone(620, i * 0.3 + 0.15, 0.14, 'square', 0.04) } },
  cash: () => { tone(1320, 0, 0.06, 'square', 0.03); tone(1760, 0.06, 0.1, 'square', 0.03) },
  tick: () => { tone(1200, 0, 0.03, 'square', 0.02) },
  click: () => { tone(800, 0, 0.03, 'triangle', 0.03) },
  fanfare: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.07)) },
  levelUp: () => { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.2, 'triangle', 0.06)) },
}

export function soundMuted(): boolean {
  return muted
}

export function toggleSound(): boolean {
  muted = !muted
  setMuted(muted)
  if (!muted) sfx.click()
  return muted
}
