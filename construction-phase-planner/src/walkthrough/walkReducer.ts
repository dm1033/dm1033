// Walk-through reducer. gameReducer forwards every WALK_* action here.
//
// Rules that hold for every action:
//  - pure and non-mutating (safe on a frozen state), with no clock: sign-off time arrives in the action;
//  - idempotent: an action that changes nothing returns the very same state object;
//  - the competence scores (state.scores) are never touched. The walk pays game points only,
//    through award() and one line in game.bonuses.
import type { BonusLine, GameState } from '../types'
import { DIFFICULTIES, award } from '../engine/game'
import {
  CHECKPOINT_ORDER, RUBRIC_ORDER,
  type CheckpointId, type Mark, type RubricId, type WalkAction, type WalkCall, type WalkOutcome,
  type WalkSignOff, type WalkthroughRecord,
} from './types'

// ---------- Record ----------

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
    flawed: [],
  }
}

export function isWalkAction(action: { type: string }): action is WalkAction {
  return action.type.startsWith('WALK_')
}

/** The walk record of a state, with defaults filled in for a save made before the walk existed. */
export function walkOf(state: Pick<GameState, 'walkthrough'>): WalkthroughRecord {
  return { ...initialWalkthrough(), ...(state.walkthrough ?? {}) }
}

/** True while the finale is still owed: the game is complete and the walk is not closed out. */
export function walkIsOpen(state: GameState): boolean {
  const status = state.walkthrough?.status ?? 'pending'
  return state.completed && (status === 'pending' || status === 'inProgress')
}

/** True once a tutor or the group has closed the walk with an outcome. */
export function walkIsSigned(walk: Pick<WalkthroughRecord, 'status'>): boolean {
  return walk.status === 'signedOff' || walk.status === 'actionsRequired' || walk.status === 'notYet'
}

// ---------- Points ----------

/** Maximum for a full walk: 10 criteria x 3 x 40, 8 calls x 25, plus 300 for a clean sign-off = 1,700. */
export const WALK_POINTS = { perMark: 40, perCall: 25, signedOff: 300, actionsRequired: 150, notYet: 0, max: 1700 } as const

export const MAX_PRESENTERS = 6
const MAX_NAME = 40
const MAX_NOTE = 500
const MAX_ACTIONS = 2000

/** The criteria marked on this walk: its checkpoints in tour order, then the two whole-walk ones. */
export function rubricScope(walk: Pick<WalkthroughRecord, 'scope'>): RubricId[] {
  return RUBRIC_ORDER.filter((id) => id === 'ownership' || id === 'management' || walk.scope.includes(id))
}

/**
 * Whether the group's call at a checkpoint was right: "change" exactly when the stop was flawed.
 * Null until the checkpoint has been revealed, or if no call was made.
 */
export function callIsCorrect(walk: WalkthroughRecord, checkpoint: CheckpointId): boolean | null {
  const call = walk.calls[checkpoint]
  if (!call || !walk.revealed.includes(checkpoint)) return null
  return (call === 'change') === (walk.flawed ?? []).includes(checkpoint)
}

export interface WalkPointsBreakdown {
  /** Sum of the tutor's marks x 40. Zero for a self-assessed walk. */
  marks: number
  /** Correct calls x 25. Paid whoever signs off. */
  calls: number
  /** 300 signed off, 150 signed off with actions. Zero for a self-assessed walk. */
  outcome: number
  /** Before the difficulty multiplier. */
  total: number
  correctCalls: number
  markTotal: number
  markMax: number
}

export interface WalkPointsOptions {
  /** Defaults to the record's own status when it is signed, else `notYet`. */
  outcome?: WalkOutcome
  /** Defaults to the record's sign-off, else `self`. A self-assessed walk earns call points only. */
  by?: WalkSignOff['by']
  /** Difficulty points multiplier; defaults to 1. */
  multiplier?: number
}

function outcomeOf(walk: WalkthroughRecord, options: WalkPointsOptions): WalkOutcome {
  if (options.outcome) return options.outcome
  return walk.status === 'signedOff' || walk.status === 'actionsRequired' ? walk.status : 'notYet'
}

export function walkPointsBreakdown(walk: WalkthroughRecord, options: WalkPointsOptions = {}): WalkPointsBreakdown {
  const by = options.by ?? walk.signOff?.by ?? 'self'
  const criteria = rubricScope(walk)
  const markTotal = criteria.reduce((sum, id) => sum + (walk.rubric[id] ?? 0), 0)
  const correctCalls = walk.scope.filter((id) => callIsCorrect(walk, id) === true).length
  const marks = by === 'tutor' ? markTotal * WALK_POINTS.perMark : 0
  const calls = correctCalls * WALK_POINTS.perCall
  const outcome = by === 'tutor' ? WALK_POINTS[outcomeOf(walk, options)] : 0
  return { marks, calls, outcome, total: marks + calls + outcome, correctCalls, markTotal, markMax: criteria.length * 3 }
}

/** Game points a walk is worth, after the difficulty multiplier. */
export function walkPoints(walk: WalkthroughRecord, options: WalkPointsOptions = {}): number {
  return Math.round(walkPointsBreakdown(walk, options).total * (options.multiplier ?? 1))
}

/**
 * The outcome the marks point to, for the tutor to accept or overrule: signed off needs every
 * criterion marked, no zero and at least 70% of the marks; half the marks suggests actions.
 */
export function suggestedOutcome(walk: WalkthroughRecord): WalkOutcome {
  const criteria = rubricScope(walk)
  const marks = criteria.map((id) => walk.rubric[id])
  const total = marks.reduce<number>((sum, m) => sum + (m ?? 0), 0)
  const max = criteria.length * 3
  const complete = marks.every((m) => m !== undefined && m > 0)
  if (complete && total >= 0.7 * max) return 'signedOff'
  return total >= 0.5 * max ? 'actionsRequired' : 'notYet'
}

// ---------- Bonus line ----------

/** Every walk bonus line starts with this, so a re-walk replaces the line instead of adding one. */
export const WALK_BONUS_PREFIX = 'Site walk-through'

const OUTCOME_WORDS: Record<WalkOutcome, string> = {
  signedOff: 'signed off',
  actionsRequired: 'signed off with actions',
  notYet: 'not yet signed off',
}

function bonusLabel(outcome: WalkOutcome, by: WalkSignOff['by']): string {
  return by === 'tutor' ? `${WALK_BONUS_PREFIX}: ${OUTCOME_WORDS[outcome]}` : `${WALK_BONUS_PREFIX}: self-assessed`
}

function withWalkBonus(bonuses: BonusLine[], line: BonusLine): BonusLine[] {
  const at = bonuses.findIndex((b) => b.label.startsWith(WALK_BONUS_PREFIX))
  if (at < 0) return [...bonuses, line]
  return bonuses.map((b, i) => (i === at ? line : b)).filter((b, i) => i === at || !b.label.startsWith(WALK_BONUS_PREFIX))
}

// ---------- Input cleaning ----------

const isCheckpoint = (id: unknown): id is CheckpointId => (CHECKPOINT_ORDER as unknown[]).includes(id)
const isRubric = (id: unknown): id is RubricId => (RUBRIC_ORDER as unknown[]).includes(id)
const isMark = (m: unknown): m is Mark => m === 0 || m === 1 || m === 2 || m === 3
const isCall = (c: unknown): c is WalkCall => c === 'stand' || c === 'change'
const isOutcome = (o: unknown): o is WalkOutcome => o === 'signedOff' || o === 'actionsRequired' || o === 'notYet'
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Valid checkpoints only, once each, in tour order; an empty choice means the full walk. */
function cleanScope(scope: unknown): CheckpointId[] {
  const chosen = Array.isArray(scope) ? scope : []
  const cleaned = CHECKPOINT_ORDER.filter((id) => chosen.includes(id))
  return cleaned.length ? cleaned : [...CHECKPOINT_ORDER]
}

function cleanPresenters(presenters: unknown): string[] {
  if (!Array.isArray(presenters)) return []
  return presenters.map((p) => text(p, MAX_NAME)).filter((p) => p.length > 0).slice(0, MAX_PRESENTERS)
}

const sameList = <T,>(a: readonly T[], b: readonly T[]) => a.length === b.length && a.every((v, i) => v === b[i])
const isEmpty = (o: object) => Object.keys(o).length === 0

// ---------- Reducer ----------

function freshAttempt(walk: WalkthroughRecord): Pick<WalkthroughRecord, 'visited' | 'revealed' | 'calls' | 'rubric' | 'notes' | 'signOff' | 'flawed'> {
  void walk
  return { visited: [], revealed: [], calls: {}, rubric: {}, notes: {}, signOff: null, flawed: [] }
}

function start(state: GameState, walk: WalkthroughRecord, action: Extract<WalkAction, { type: 'WALK_START' }>): GameState {
  // The walk is the finale; a second WALK_START (a double click) must not wipe the walk in hand.
  if (!state.completed || walk.status === 'inProgress') return state
  const scope = cleanScope(action.scope)
  return {
    ...state,
    walkthrough: {
      ...walk,
      ...freshAttempt(walk),
      status: 'inProgress',
      attempt: walk.attempt + 1,
      index: 0,
      scope,
      presenters: cleanPresenters(action.presenters),
      visited: [scope[0]],
    },
  }
}

function goTo(state: GameState, walk: WalkthroughRecord, index: number): GameState {
  if (walk.status === 'pending' || walk.status === 'skipped' || !Number.isFinite(index)) return state
  // scope.length is the sign-off stage; the briefing (-1) is only reached through WALK_RESTART.
  const next = Math.min(walk.scope.length, Math.max(0, Math.round(index)))
  const stop = walk.scope[next]
  const visit = walk.status === 'inProgress' && stop !== undefined && !walk.visited.includes(stop)
  if (next === walk.index && !visit) return state
  return { ...state, walkthrough: { ...walk, index: next, visited: visit ? [...walk.visited, stop] : walk.visited } }
}

function call(state: GameState, walk: WalkthroughRecord, checkpoint: CheckpointId, choice: WalkCall): GameState {
  if (walk.status !== 'inProgress' || !isCheckpoint(checkpoint) || !isCall(choice)) return state
  if (!walk.scope.includes(checkpoint) || walk.revealed.includes(checkpoint) || walk.calls[checkpoint] === choice) return state
  return { ...state, walkthrough: { ...walk, calls: { ...walk.calls, [checkpoint]: choice } } }
}

function reveal(state: GameState, walk: WalkthroughRecord, checkpoint: CheckpointId, flawed: boolean): GameState {
  if (walk.status !== 'inProgress' || !isCheckpoint(checkpoint)) return state
  // The first reveal fixes the answer the call is judged against; later ones change nothing.
  if (!walk.scope.includes(checkpoint) || walk.revealed.includes(checkpoint)) return state
  const known = walk.flawed ?? []
  return {
    ...state,
    walkthrough: {
      ...walk,
      revealed: [...walk.revealed, checkpoint],
      flawed: flawed === true && !known.includes(checkpoint) ? [...known, checkpoint] : known,
    },
  }
}

function mark(state: GameState, walk: WalkthroughRecord, action: Extract<WalkAction, { type: 'WALK_MARK' }>): GameState {
  const { rubric } = action
  if (walk.status !== 'inProgress' || !isRubric(rubric) || !isMark(action.mark)) return state
  if (!rubricScope(walk).includes(rubric)) return state
  const note = action.note === undefined ? walk.notes[rubric] ?? '' : text(action.note, MAX_NOTE)
  if (walk.rubric[rubric] === action.mark && (walk.notes[rubric] ?? '') === note) return state
  const notes = { ...walk.notes }
  if (note) notes[rubric] = note
  else delete notes[rubric]
  return { ...state, walkthrough: { ...walk, rubric: { ...walk.rubric, [rubric]: action.mark }, notes } }
}

function signOff(state: GameState, walk: WalkthroughRecord, action: Extract<WalkAction, { type: 'WALK_SIGNOFF' }>): GameState {
  if (!state.completed || !isOutcome(action.outcome)) return state
  if (walk.status !== 'inProgress' && !walkIsSigned(walk)) return state
  const by: WalkSignOff['by'] = action.by === 'tutor' ? 'tutor' : 'self'
  const record: WalkSignOff = { by, name: text(action.name, MAX_NAME), actions: text(action.actions, MAX_ACTIONS), at: text(action.at, 40) }
  const signed: WalkthroughRecord = { ...walk, status: action.outcome, signOff: record, index: walk.scope.length }
  const multiplier = DIFFICULTIES[state.game.difficulty]?.pointsMultiplier ?? 1
  // The walk pays its best result so far: a re-walk tops the points up and never takes them back.
  const earned = Math.max(walk.pointsAwarded, walkPoints(signed, { outcome: action.outcome, by, multiplier }))
  const delta = earned - walk.pointsAwarded
  const line: BonusLine = { label: bonusLabel(action.outcome, by), points: earned }
  const current = state.game.bonuses.filter((b) => b.label.startsWith(WALK_BONUS_PREFIX))
  const sameBonus = current.length === 1 && current[0].label === line.label && current[0].points === line.points
  const prior = walk.signOff
  const sameRecord = walk.status === signed.status && walk.index === signed.index && !!prior
    && prior.by === record.by && prior.name === record.name && prior.actions === record.actions && prior.at === record.at
  if (sameRecord && sameBonus && delta === 0) return state
  const withBonus = { ...state.game, bonuses: withWalkBonus(state.game.bonuses, line) }
  return {
    ...state,
    walkthrough: { ...signed, pointsAwarded: earned },
    game: delta === 0 ? withBonus : award(withBonus, delta, 'Site walk-through'),
  }
}

function skip(state: GameState, walk: WalkthroughRecord): GameState {
  // A walk that has an outcome keeps it; only a walk still owed can be skipped.
  if (walk.status !== 'pending' && walk.status !== 'inProgress') return state
  return { ...state, walkthrough: { ...walk, status: 'skipped' } }
}

function restart(state: GameState, walk: WalkthroughRecord): GameState {
  const pristine = walk.status === 'pending' && walk.index === -1 && walk.signOff === null
    && sameList(walk.visited, []) && sameList(walk.revealed, []) && sameList(walk.flawed ?? [], [])
    && isEmpty(walk.calls) && isEmpty(walk.rubric) && isEmpty(walk.notes)
  if (pristine) return state
  // Back to the briefing. Scope and presenters stay as a starting point; attempt goes up on WALK_START.
  // pointsAwarded stays, so the next sign-off pays only what the new walk adds.
  return { ...state, walkthrough: { ...walk, ...freshAttempt(walk), status: 'pending', index: -1 } }
}

export function walkReducer(state: GameState, action: WalkAction): GameState {
  const walk = walkOf(state)
  switch (action.type) {
    case 'WALK_START': return start(state, walk, action)
    case 'WALK_GOTO': return goTo(state, walk, action.index)
    case 'WALK_CALL': return call(state, walk, action.checkpoint, action.call)
    case 'WALK_REVEAL': return reveal(state, walk, action.checkpoint, action.flawed)
    case 'WALK_MARK': return mark(state, walk, action)
    case 'WALK_SIGNOFF': return signOff(state, walk, action)
    case 'WALK_SKIP': return skip(state, walk)
    case 'WALK_RESTART': return restart(state, walk)
    default: return state
  }
}
