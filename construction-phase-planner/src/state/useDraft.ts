// Draft persistence for work in progress on a step (site layout, temporary works register,
// permit ticks, sequence order, hazard-hunt flags). Without it, a reload or a visit to another
// screen throws the group's work away.
//
//   const [placements, setPlacements, clearDraft] = useDraft<PlacementRecord[]>(step.id, [])
//   ...on submit: clearDraft()
//
// Drafts are keyed by the run (seed) and the step, live in localStorage, and are removed when the
// step is submitted or a new project starts (clearAllDrafts, called from the start/reset flow).
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame } from './GameContext'

const PREFIX = 'cpp-draft:'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function clearAllDrafts(): void {
  try {
    const doomed: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) doomed.push(k)
    }
    doomed.forEach((k) => localStorage.removeItem(k))
  } catch { /* storage blocked */ }
}

export function useDraft<T>(stepId: string, initial: T): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const { state } = useGame()
  const key = `${PREFIX}${state.game.seed}:${stepId}`
  const [value, setValue] = useState<T>(() => read(key, initial))
  const keyRef = useRef(key)

  // A different step (or run) mounted on the same component instance: load that step's draft.
  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key
      setValue(read(key, initial))
    }
    // `initial` is a default, not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage blocked: memory only */ }
  }, [key, value])

  const clear = useCallback(() => {
    try { localStorage.removeItem(key) } catch { /* storage blocked */ }
  }, [key])

  return [value, setValue, clear]
}
