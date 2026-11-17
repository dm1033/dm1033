// Accessible modal dialog built on the native <dialog> element: showModal() gives a real focus
// trap, makes the rest of the page inert (so nothing behind it can be clicked, tabbed to or
// answered) and puts the dialog in the top layer above sticky headers.
//
//   <Dialog open title="Weekly site report" onClose={close}> ... </Dialog>
//
// - Omit onClose for a dialog that must be answered: Escape is then ignored.
// - Focus lands on the heading (so a screen reader reads the title and the content starts at the
//   top) unless initialFocus is given. Never auto-focus the dismiss button: a held Enter key would
//   close the dialog unread.
// - When the dialog goes away, focus returns to the control that opened it.
// - announce() still speaks while a dialog is open: the dialog carries its own live regions,
//   because the page's own regions are inert behind a modal.
// - isDialogOpen() lets global keyboard shortcuts and clocks stand down while any dialog is up.
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import LiveRegions from './LiveRegions'

interface DialogProps {
  open: boolean
  title: ReactNode
  /** Escape (and the Close button, when closeLabel is set) dismissal. Omit to make the dialog mandatory. */
  onClose?: () => void
  children: ReactNode
  /** Extra classes for the panel (width, border colour). */
  className?: string
  initialFocus?: RefObject<HTMLElement | null>
  /** Hide the visible heading (it is still the accessible name). */
  hideTitle?: boolean
  /** Show a labelled close button beside the heading, for example "Close". Needs onClose. */
  closeLabel?: string
  /** Also close when the dimmed area outside the panel is clicked or tapped. Needs onClose. */
  dismissOnBackdrop?: boolean
}

export function isDialogOpen(): boolean {
  return typeof document !== 'undefined' && document.querySelector('dialog[open]') !== null
}

export default function Dialog({
  open, title, onClose, children, className = '', initialFocus, hideTitle, closeLabel, dismissOnBackdrop,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const pressedOnBackdrop = useRef(false)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!open || !el) return
    if (!el.open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      el.showModal()
      el.scrollTop = 0
      ;(initialFocus?.current ?? headingRef.current)?.focus()
    }
    return () => {
      // Only once the dialog has really left the page (not on a re-run of this effect).
      if (el.isConnected) return
      const opener = openerRef.current
      if (opener?.isConnected) opener.focus()
      if (!document.activeElement || document.activeElement === document.body) document.getElementById('main')?.focus()
    }
  }, [open, initialFocus])

  if (!open) return null
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose?.()
      }}
      // Some browsers close a dialog on a second Escape even when the first was refused. Keep the
      // element and the app in step: hand the close to the owner, or re-open a mandatory dialog.
      onClose={(e) => {
        if (onClose) onClose()
        else if (e.currentTarget.isConnected && !e.currentTarget.open) e.currentTarget.showModal()
      }}
      onPointerDown={(e) => { pressedOnBackdrop.current = e.target === e.currentTarget }}
      onClick={(e) => {
        // A press that both starts and ends on the dimmed area (not a text selection dragged out).
        if (dismissOnBackdrop && onClose && pressedOnBackdrop.current && e.target === e.currentTarget) onClose()
        pressedOnBackdrop.current = false
      }}
      className={`cpp-dialog m-auto w-[min(100vw-1.5rem,44rem)] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/75 ${className}`}
    >
      <div className={hideTitle && !(closeLabel && onClose) ? '' : 'flex items-start gap-3 px-5 pt-5'}>
        <h2
          id={titleId}
          ref={headingRef}
          tabIndex={-1}
          className={hideTitle ? 'sr-only' : 'min-w-0 flex-1 text-xl font-bold'}
        >
          {title}
        </h2>
        {closeLabel && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto shrink-0 min-h-11 rounded-lg border border-slate-600 px-3 text-sm font-semibold text-slate-200 hover:border-amber-500 hover:bg-slate-800"
          >
            <span aria-hidden="true">✕ </span>{closeLabel}
          </button>
        )}
      </div>
      <div className="px-5 pb-5 pt-3">{children}</div>
      <LiveRegions />
    </dialog>
  )
}
