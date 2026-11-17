// Walk-through reducer. Called from gameReducer for every WALK_* action.
// STUB: the walk-through lead replaces this body; the exported names are the contract.
import type { GameState } from '../types'
import { CHECKPOINT_ORDER, type WalkAction, type WalkthroughRecord } from './types'

export function initialWalkthrough(): WalkthroughRecord {
  return {
    status: 'pending',
    attempt: 0,
    index: -1,
    scope: [...CHECKPOINT_ORDER],
    presenters: [],
    visited: [],
    revealed: [],
    calls: {},
    rubric: {},
    notes: {},
    signOff: null,
    pointsAwarded: 0,
  }
}

export function isWalkAction(action: { type: string }): action is WalkAction {
  return action.type.startsWith('WALK_')
}

/** True while the finale is still owed: the game is complete and the walk is not closed out. */
export function walkIsOpen(state: GameState): boolean {
  return state.completed && (state.walkthrough.status === 'pending' || state.walkthrough.status === 'inProgress')
}

export function walkReducer(state: GameState, _action: WalkAction): GameState {
  return state
}
