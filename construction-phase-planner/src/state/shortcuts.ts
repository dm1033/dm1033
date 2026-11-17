// Single-key shortcuts (A-D to pick an answer, S/F/G to commit, Enter to continue, and the
// walk-through keys) are a convenience for a tutor driving from a keyboard. They must never act
// on something the delegate cannot see or is typing over. Every keydown handler calls this first:
//
//   const onKey = (e: KeyboardEvent) => { if (!shortcutAllowed(e)) return; ... }
//
// It says no when: the delegate has switched shortcuts off in Access settings; the game is paused;
// a modifier key is held (so browser and screen-reader commands pass through); the key is
// auto-repeating; a dialog is open; another handler has already dealt with the key; the focus is
// in a text field or drop-down; or the key is Enter or Space and the focus is on a button, link
// or other control (that key press belongs to the focused control, which will act on its own).
import { isDialogOpen } from '../components/Dialog'
import { getSettings } from './settings'

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const ACTIVATING_KEYS = new Set(['Enter', ' ', 'Spacebar'])
const CONTROL_SELECTOR =
  'button, a[href], summary, [role="button"], [role="link"], [role="radio"], [role="checkbox"], [role="switch"], [role="tab"], [role="option"], [role="menuitem"]'

export function shortcutAllowed(e: KeyboardEvent, opts: { paused?: boolean; allowInDialog?: boolean } = {}): boolean {
  if (!getSettings().shortcuts) return false
  if (opts.paused) return false
  if (e.defaultPrevented) return false
  if (e.ctrlKey || e.metaKey || e.altKey) return false
  if (e.repeat) return false
  if (!opts.allowInDialog && isDialogOpen()) return false
  const t = e.target as HTMLElement | null
  if (t && typeof t.tagName === 'string') {
    if (TYPING_TAGS.has(t.tagName) || t.isContentEditable) return false
    if (ACTIVATING_KEYS.has(e.key) && typeof t.closest === 'function' && t.closest(CONTROL_SELECTOR)) return false
  }
  return true
}
