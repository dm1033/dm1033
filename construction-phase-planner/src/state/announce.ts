// Screen-reader announcements. One pair of live regions is mounted once by App (<LiveRegions />);
// any component calls announce() to speak a result, a time warning or a change of step.
//
//   announce('Best answer. Plus 150 points.')                 // polite: waits for the current speech
//   announce('Ten seconds left.', 'assertive')                // interrupts: use sparingly
//
// Rules: say the outcome in words (never "green" or an emoji alone); keep it to one sentence
// where possible; do not announce every tick of a clock (warn at 30 s and 10 s only).
import { useSyncExternalStore } from 'react'

export type Politeness = 'polite' | 'assertive'

interface Message { text: string; n: number }
let polite: Message = { text: '', n: 0 }
let assertive: Message = { text: '', n: 0 }
const listeners = new Set<() => void>()

export function announce(text: string, politeness: Politeness = 'polite'): void {
  // The counter makes a repeated identical message a new value, so it is spoken again.
  if (politeness === 'assertive') assertive = { text, n: assertive.n + 1 }
  else polite = { text, n: polite.n + 1 }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** For <LiveRegions />: the current message for each politeness level. */
export function useAnnouncements(): { polite: Message; assertive: Message } {
  const p = useSyncExternalStore(subscribe, () => polite, () => polite)
  const a = useSyncExternalStore(subscribe, () => assertive, () => assertive)
  return { polite: p, assertive: a }
}
