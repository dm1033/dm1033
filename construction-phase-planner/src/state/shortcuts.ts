// Single-key shortcuts (A-D to pick an answer, S/F/G to commit, Enter to continue, and the
// walk-through keys) are a convenience for a tutor driving from a keyboard. They must never act
// on something the delegate cannot see or is typing over. Every keydown handler calls this first:
//
//   const onKey = (e: KeyboardEvent) => { if (!shortcutAllowed(e)) return; ... }
import { isDialogOpen } from '../components/Dialog'
import { getSettings } from './settings'

export function shortcutAllowed(e: KeyboardEvent, opts: { paused?: boolean; allowInDialog?: boolean } = {}): boolean {
  if (!getSettings().shortcuts) return false
  if (opts.paused) return false
  if (e.ctrlKey || e.metaKey || e.altKey) return false
  if (e.repeat) return false
  if (!opts.allowInDialog && isDialogOpen()) return false
  const t = e.target as HTMLElement | null
  if (t) {
    const tag = t.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) return false
  }
  return true
}
