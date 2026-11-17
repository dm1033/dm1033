// The two screen-reader live regions that announce() (src/state/announce.ts) speaks through.
//
// App mounts one pair for the page. Dialog mounts its own pair as well, because a modal dialog
// makes the rest of the page inert and an inert live region says nothing.
//
// - A region starts empty and only ever shows messages that arrive after it mounted, so opening a
//   dialog does not repeat the last thing that was said.
// - Each message is a fresh element (keyed by its counter), so saying the same words twice in a
//   row is spoken twice.
// - The text is cleared after a short while so a delegate browsing the page with a screen reader
//   does not stumble over an old result.
import { useEffect, useState } from 'react'
import { useAnnouncements } from '../state/announce'

const CLEAR_AFTER_MS = 12_000

function useFreshMessage(message: { text: string; n: number }): { text: string; n: number } | null {
  const [mountedAt] = useState(message.n)
  const [expired, setExpired] = useState(-1)

  useEffect(() => {
    if (message.n === mountedAt) return
    const t = window.setTimeout(() => setExpired(message.n), CLEAR_AFTER_MS)
    return () => window.clearTimeout(t)
  }, [message.n, mountedAt])

  if (message.n === mountedAt || message.n === expired || !message.text) return null
  return message
}

export default function LiveRegions() {
  const { polite, assertive } = useAnnouncements()
  const politeMsg = useFreshMessage(polite)
  const assertiveMsg = useFreshMessage(assertive)

  return (
    <div className="sr-only" data-live-regions="">
      <div role="status" aria-live="polite" aria-atomic="true">
        {politeMsg && <span key={politeMsg.n}>{politeMsg.text}</span>}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {assertiveMsg && <span key={assertiveMsg.n}>{assertiveMsg.text}</span>}
      </div>
    </div>
  )
}
