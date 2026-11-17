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
// - isDialogOpen() lets global keyboard shortcuts and clocks stand down while any dialog is up.
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'

interface DialogProps {
  open: boolean
  title: ReactNode
  /** Escape or backdrop dismissal. Omit to make the dialog mandatory. */
  onClose?: () => void
  children: ReactNode
  /** Extra classes for the panel (width, border colour). */
  className?: string
  initialFocus?: RefObject<HTMLElement | null>
  /** Hide the visible heading (it is still the accessible name). */
  hideTitle?: boolean
}

export function isDialogOpen(): boolean {
  return typeof document !== 'undefined' && document.querySelector('dialog[open]') !== null
}

export default function Dialog({ open, title, onClose, children, className = '', initialFocus, hideTitle }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      el.scrollTop = 0
      ;(initialFocus?.current ?? headingRef.current)?.focus()
    } else if (!open && el.open) {
      el.close()
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
      className={`cpp-dialog m-auto w-[min(100vw-1.5rem,44rem)] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/75 ${className}`}
    >
      <h2
        id={titleId}
        ref={headingRef}
        tabIndex={-1}
        className={hideTitle ? 'sr-only' : 'px-5 pt-5 text-xl font-bold outline-none'}
      >
        {title}
      </h2>
      <div className="px-5 pb-5 pt-3">{children}</div>
    </dialog>
  )
}
