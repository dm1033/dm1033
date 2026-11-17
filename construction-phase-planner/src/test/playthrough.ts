// Test-only helpers: drive the real reducer through a whole scenario the same way
// GameScreen does, with pluggable "delegate" strategies. No React, no DOM.
import { gameReducer, initialGameState, isEventPhase, type GameAction } from '../state/GameContext'
import { zoneAt } from '../engine/scoring'
import { mulberry32 } from '../engine/game'
import type {
  Confidence, DecisionOption, DecisionStep, Difficulty, GameState, HazardHuntStep, OptionQuality,
  PermitStep, PlacementRecord, Scenario, SequenceStep, SiteSetupStep, Step, TwAnswerRecord, TwRegisterStep,
} from '../types'

/** Recursively freeze a value so that any in-place mutation throws (ES modules are strict). */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v)
  }
  return value
}

/** The steps GameScreen renders for the current phase: authored steps + surprise + drawn events. */
export function stepsFor(scenario: Scenario, state: GameState): { steps: Step[]; extra: number } {
  const phase = scenario.phases[state.phaseIndex]
  const find = (id: string) => scenario.eventPool.find((e) => e.id === id)
  const surprise = state.game.surpriseEvents
    .filter((s) => s.phaseNumber === phase.number)
    .map((s) => find(s.eventId))
    .filter((e): e is DecisionStep => !!e)
  const drawn = isEventPhase(phase.number)
    ? state.drawnEventIds.map(find).filter((e): e is DecisionStep => !!e)
    : []
  const extra = [...surprise, ...drawn]
  return { steps: [...phase.steps, ...extra], extra: extra.length }
}

const QUALITY_RANK: Record<OptionQuality, number> = { unsafe: 0, poor: 1, partial: 2, best: 3 }
export const bestOption = (step: DecisionStep): DecisionOption =>
  [...step.options].sort((a, b) => QUALITY_RANK[b.quality] - QUALITY_RANK[a.quality])[0]
export const worstOption = (step: DecisionStep): DecisionOption =>
  [...step.options].sort((a, b) => QUALITY_RANK[a.quality] - QUALITY_RANK[b.quality])[0]

// ---------- model answers for the mini-games ----------

/** Cells the SitePlanner UI refuses (inside a blocked zone). */
export function blockedCells(step: SiteSetupStep): Set<string> {
  const set = new Set<string>()
  for (const z of step.zones.filter((zone) => zone.blocked)) {
    for (let x = z.x1; x <= z.x2; x++) for (let y = z.y1; y <= z.y2; y++) set.add(`${x},${y}`)
  }
  return set
}

/**
 * One item per cell, never in a blocked cell (the UI rules), every item in a cell that the
 * engine rates `want`. Uses bipartite matching so the result does not depend on rule order.
 * Returns null when no such layout exists.
 */
export function layoutFor(step: SiteSetupStep, want: 'good' | 'unsafe', requiredOnly = false): PlacementRecord[] | null {
  const blocked = blockedCells(step)
  const rules = step.rules.filter((r) => !requiredOnly || r.required)
  const cells: { x: number; y: number }[] = []
  for (let y = 0; y < step.grid.rows; y++) for (let x = 0; x < step.grid.cols; x++) if (!blocked.has(`${x},${y}`)) cells.push({ x, y })
  const ok = rules.map((rule) => cells.map((c) => {
    const zones = zoneAt(step, c.x, c.y)
    const bad = zones.some((z) => rule.badZones.includes(z))
    const good = zones.some((z) => rule.goodZones.includes(z))
    return want === 'good' ? good && !bad : bad
  }))
  const cellOwner = new Array<number>(cells.length).fill(-1)
  const tryAssign = (r: number, seen: boolean[]): boolean => {
    for (let c = 0; c < cells.length; c++) {
      if (!ok[r][c] || seen[c]) continue
      seen[c] = true
      if (cellOwner[c] === -1 || tryAssign(cellOwner[c], seen)) { cellOwner[c] = r; return true }
    }
    return false
  }
  for (let r = 0; r < rules.length; r++) {
    if (!tryAssign(r, new Array<boolean>(cells.length).fill(false))) return null
  }
  const out: PlacementRecord[] = []
  cellOwner.forEach((r, c) => { if (r >= 0) out.push({ itemId: rules[r].itemId, x: cells[c].x, y: cells[c].y }) })
  return out
}

export const perfectTw = (step: TwRegisterStep): TwAnswerRecord[] =>
  step.items.map((i) => ({ itemId: i.id, ...i.correct }))

export const perfectPermits = (step: PermitStep): string[] => [...step.required]
export const perfectHunt = (step: HazardHuntStep): string[] => step.observations.filter((o) => o.hazard).map((o) => o.id)
export const perfectSequence = (step: SequenceStep): string[] => step.activities.map((a) => a.id)

// ---------- strategies ----------

export interface Strategy {
  decision(step: DecisionStep, state: GameState): { option: DecisionOption; confidence: Confidence; timeFrac: number | null; timedOut?: boolean }
  siteSetup(step: SiteSetupStep): PlacementRecord[]
  tw(step: TwRegisterStep): TwAnswerRecord[]
  permits(step: PermitStep): string[]
  hunt(step: HazardHuntStep): { flagged: string[]; secondsLeft: number }
  sequence(step: SequenceStep): string[]
  /** Called while a site-week card is open; return actions to dispatch before closing it. */
  weekReview?(state: GameState): GameAction[]
}

/** Model delegate: best answer every time, committed as "Certain", every mini-game perfect. */
export const perfectStrategy: Strategy = {
  decision: (step) => ({ option: bestOption(step), confidence: 'sure', timeFrac: null }),
  siteSetup: (step) => {
    const layout = layoutFor(step, 'good')
    if (!layout) throw new Error(`${step.id}: no layout puts every item in a good zone`)
    return layout
  },
  tw: perfectTw,
  permits: perfectPermits,
  hunt: (step) => ({ flagged: perfectHunt(step), secondsLeft: 0 }),
  sequence: perfectSequence,
}

/** Worst-case delegate: worst option, "Certain", nothing placed/flagged/raised, plan reversed. */
export const recklessStrategy: Strategy = {
  decision: (step) => ({ option: worstOption(step), confidence: 'sure', timeFrac: null }),
  siteSetup: () => [],
  tw: (step) => step.items.map((i) => ({ itemId: i.id })),
  permits: () => [],
  hunt: () => ({ flagged: [], secondsLeft: 0 }),
  sequence: (step) => step.activities.map((a) => a.id).reverse(),
}

/** Seeded random delegate that also audits and closes out risks at random. */
export function randomStrategy(seed: number): Strategy {
  const r = mulberry32(seed)
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]
  return {
    decision: (step) => ({
      option: pick(step.options),
      confidence: pick(['sure', 'think', 'guess'] as const),
      timeFrac: r() < 0.5 ? null : r(),
    }),
    siteSetup: (step) => {
      const free = [...Array(step.grid.cols * step.grid.rows).keys()]
        .map((i) => ({ x: i % step.grid.cols, y: Math.floor(i / step.grid.cols) }))
        .filter((c) => !blockedCells(step).has(`${c.x},${c.y}`))
      const out: PlacementRecord[] = []
      for (const rule of step.rules) {
        if (r() < 0.2 || free.length === 0) continue
        const [cell] = free.splice(Math.floor(r() * free.length), 1)
        out.push({ itemId: rule.itemId, ...cell })
      }
      return out
    },
    tw: (step) => step.items.map((i) => ({
      itemId: i.id,
      register: r() < 0.5,
      design: pick(['bespoke', 'standard-solution', 'none'] as const),
      catCheck: pick(['cat0', 'cat1', 'cat2', 'cat3'] as const),
      rams: r() < 0.5,
      inspection: r() < 0.5,
      holdPoint: r() < 0.5,
      responsible: pick(['TWC', 'TWS', 'PC', 'contractor', 'designer'] as const),
    })),
    permits: (step) => step.options.filter(() => r() < 0.5).map((o) => o.id),
    hunt: (step) => ({ flagged: step.observations.filter(() => r() < 0.5).map((o) => o.id), secondsLeft: Math.floor(r() * step.timeLimit) }),
    sequence: (step) => {
      const order = step.activities.map((a) => a.id)
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1))
        ;[order[i], order[j]] = [order[j], order[i]]
      }
      return order
    },
    weekReview: (state) => {
      const actions: GameAction[] = []
      if (r() < 0.3) actions.push({ type: 'AUDIT' })
      for (const h of state.game.latent) if (h.status === 'open' && r() < 0.4) actions.push({ type: 'RECTIFY', hazardId: h.id })
      return actions
    },
  }
}

export interface PlayResult {
  final: GameState
  /** Every state the reducer returned, in order (index 0 = after START_SCENARIO). */
  history: { action: GameAction; state: GameState }[]
}

/**
 * Play a scenario from START_SCENARIO to `completed`, dispatching exactly what the UI dispatches.
 * Every state and action is deep-frozen first, so a reducer that mutates its input throws.
 */
export function play(scenario: Scenario, difficulty: Difficulty, seed: number, strategy: Strategy, delegateName = 'Test Group'): PlayResult {
  deepFreeze(scenario)
  const history: PlayResult['history'] = []
  let state = deepFreeze(initialGameState)
  const dispatch = (action: GameAction) => {
    state = deepFreeze(gameReducer(state, deepFreeze(action)))
    history.push({ action, state })
  }
  dispatch({ type: 'START_SCENARIO', scenarioId: scenario.id, delegateName, difficulty, seed })
  let guard = 0
  while (!state.completed) {
    if (guard++ > 1000) throw new Error('playthrough did not terminate')
    if (state.game.pendingWeek) {
      for (const a of strategy.weekReview?.(state) ?? []) dispatch(a)
      dispatch({ type: 'CLOSE_WEEK' })
      continue
    }
    const phase = scenario.phases[state.phaseIndex]
    const { steps, extra } = stepsFor(scenario, state)
    const step = steps[state.stepIndex]
    switch (step.type) {
      case 'decision': {
        const d = strategy.decision(step, state)
        dispatch({ type: 'ANSWER_DECISION', step, option: d.option, phaseNumber: phase.number, confidence: d.confidence, timeFrac: d.timeFrac, timedOut: !!d.timedOut })
        break
      }
      case 'siteSetup': dispatch({ type: 'SUBMIT_SITE_SETUP', step, placements: strategy.siteSetup(step) }); break
      case 'twRegister': dispatch({ type: 'SUBMIT_TW', step, answers: strategy.tw(step) }); break
      case 'permits': dispatch({ type: 'SUBMIT_PERMITS', step, selected: strategy.permits(step) }); break
      case 'hazardHunt': { const h = strategy.hunt(step); dispatch({ type: 'SUBMIT_HUNT', step, flagged: h.flagged, secondsLeft: h.secondsLeft }); break }
      case 'sequence': dispatch({ type: 'SUBMIT_SEQUENCE', step, order: strategy.sequence(step), phaseNumber: phase.number }); break
      case 'info': break
    }
    dispatch({ type: 'ADVANCE', scenario, extraSteps: extra })
  }
  return { final: state, history }
}
