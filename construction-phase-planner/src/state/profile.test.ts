import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ACHIEVEMENTS, clearLeaderboard, evaluateAchievements, isMuted, loadLeaderboard, loadProfile, recordGame,
  resetProfile, setMuted,
} from './profile'
import { SCENARIOS } from '../data'
import type { Difficulty, GameState, PermitStep, ScoreKey } from '../types'
import { SCORE_KEYS } from '../types'
import { findSteps } from '../engine/reports'
import { DIFFS, S1, hazard, setupSteps } from '../test/fixtures'
import { layoutFor, perfectStrategy, play, recklessStrategy } from '../test/playthrough'
import { knownBug } from '../test/knownBug'

/** In-memory stand-in for window.localStorage (the suite runs in plain Node, no DOM). */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() { return data.size },
    dump: () => Object.fromEntries(data),
  }
}

const ALL_BUT_EXPERT = [
  'zero-harm', 'on-budget', 'on-programme', 'clean-sheet', 'no-notices', 'permit-perfect', 'tw-guru', 'hawk-eye',
  'master-planner', 'site-perfect', 'on-fire', 'cool-head', 'calibrated', 'unaided', 'excellent',
]
const ALL = [...ALL_BUT_EXPERT, 'expert-class']

const cache = new Map<string, GameState>()
const perfect = (difficulty: Difficulty = 'standard', scenario = S1): GameState => {
  const key = `${scenario.id}:${difficulty}`
  if (!cache.has(key)) cache.set(key, play(scenario, difficulty, 21, perfectStrategy).final)
  return cache.get(key)!
}

describe('ACHIEVEMENTS', () => {
  it('defines 16 uniquely identified badges', () => {
    expect(ACHIEVEMENTS).toHaveLength(16)
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(16)
    expect(ACHIEVEMENTS.map((a) => a.id)).toEqual(ALL)
    for (const a of ACHIEVEMENTS) {
      expect(a.title).toBeTruthy()
      expect(a.desc).toBeTruthy()
      expect(a.icon).toBeTruthy()
    }
  })
})

describe('evaluateAchievements', () => {
  for (const scenario of SCENARIOS) {
    it(`${scenario.id}: a model run earns every badge (all 16 on Expert, 15 below it)`, () => {
      expect(evaluateAchievements(perfect('learner', scenario), scenario)).toEqual(ALL_BUT_EXPERT)
      expect(evaluateAchievements(perfect('standard', scenario), scenario)).toEqual(ALL_BUT_EXPERT)
      expect(evaluateAchievements(perfect('expert', scenario), scenario)).toEqual(ALL)
    })
  }

  it('only ever returns ids from the badge catalogue, without duplicates', () => {
    const known = new Set(ACHIEVEMENTS.map((a) => a.id))
    for (const scenario of SCENARIOS) {
      for (const d of DIFFS) {
        for (const strategy of [perfectStrategy, recklessStrategy]) {
          const got = evaluateAchievements(play(scenario, d, 4, strategy).final, scenario)
          expect(new Set(got).size).toBe(got.length)
          for (const id of got) expect(known.has(id)).toBe(true)
        }
      }
    }
  })

  it('a project shut down by HSE earns nothing at all', () => {
    const base = perfect('expert')
    expect(evaluateAchievements({ ...base, game: { ...base.game, shutdown: true } }, S1)).toEqual([])
    const real = play(S1, 'expert', 12345, recklessStrategy).final
    expect(real.game.shutdown).toBe(true)
    expect(evaluateAchievements(real, S1)).toEqual([])
  })

  describe('each badge is lost for exactly the reason on its label', () => {
    const base = perfect('expert')
    const lost = (state: GameState) => ALL.filter((id) => !evaluateAchievements(state, S1).includes(id))
    const game = (over: Partial<GameState['game']>): GameState => ({ ...base, game: { ...base.game, ...over } })
    const incident = { hazardId: 'h', week: 4, severity: 'minor' as const, title: 't', narrative: 'n', rootCause: 'r', cost: 1, days: 1, riddor: false, points: -1 }
    const at = (pct: number): GameState => ({
      ...base,
      scores: {
        ...base.scores,
        earned: Object.fromEntries(SCORE_KEYS.map((k) => [k, pct])) as Record<ScoreKey, number>,
        possible: Object.fromEntries(SCORE_KEYS.map((k) => [k, 100])) as Record<ScoreKey, number>,
      },
    })

    it('sanity: the unmodified model run loses nothing', () => {
      expect(lost(base)).toEqual([])
    })
    it('zero-harm: any incident on site', () => {
      expect(lost(game({ consequences: [incident] }))).toEqual(['zero-harm'])
    })
    it('on-budget: contingency overspent (exactly £0 left still counts)', () => {
      expect(lost(game({ budget: -1 }))).toEqual(['on-budget'])
      expect(lost(game({ budget: 0 }))).toEqual([])
    })
    it('on-programme: handed over late (exactly on the day still counts)', () => {
      expect(lost(game({ floatDays: -0.5 }))).toEqual(['on-programme'])
      expect(lost(game({ floatDays: 0 }))).toEqual([])
    })
    it('clean-sheet: a critical safety failure', () => {
      expect(lost({ ...base, criticalFailures: ['No lift plan'] })).toEqual(['clean-sheet'])
    })
    it('no-notices: any HSE notice', () => {
      expect(lost(game({ notices: [{ kind: 'improvement', week: 4, reason: 'r', cost: 1, days: 1, points: -1 }] }))).toEqual(['no-notices'])
    })
    it('permit-perfect: a required permit not raised, or the form never submitted', () => {
      const step = findSteps<PermitStep>(S1, 'permits')[0]
      expect(lost({ ...base, permitAnswers: [{ stepId: step.id, selected: step.required.slice(1) }] })).toEqual(['permit-perfect'])
      expect(lost({ ...base, permitAnswers: [] })).toEqual(['permit-perfect'])
    })
    it('tw-guru: one wrong field on one item', () => {
      const [first, ...rest] = base.twAnswers
      expect(lost({ ...base, twAnswers: [{ ...first, rams: !first.rams }, ...rest] })).toEqual(['tw-guru'])
    })
    it('hawk-eye: a missed hazard, or a false alarm', () => {
      const [hunt] = base.huntAnswers
      expect(lost({ ...base, huntAnswers: [{ ...hunt, flagged: hunt.flagged.slice(1) }] })).toEqual(['hawk-eye'])
      const def = S1.phases.flatMap((p) => p.steps).find((s) => s.id === hunt.stepId)
      const lookAlike = def?.type === 'hazardHunt' ? def.observations.find((o) => !o.hazard)!.id : ''
      expect(lost({ ...base, huntAnswers: [{ ...hunt, flagged: [...hunt.flagged, lookAlike] }] })).toEqual(['hawk-eye'])
    })
    it('master-planner: one sequence with a broken dependency', () => {
      const [first, second] = base.sequenceAnswers
      expect(lost({ ...base, sequenceAnswers: [{ ...first, order: [...first.order].reverse() }, second] })).toEqual(['master-planner'])
    })
    it('site-perfect: a required item missing from the plan', () => {
      const step = setupSteps(S1)[0]
      const required = step.rules.find((r) => r.required)!.itemId
      expect(lost({ ...base, placements: base.placements.filter((p) => p.itemId !== required) })).toEqual(['site-perfect'])
    })
    it('on-fire: best streak below ten', () => {
      expect(lost(game({ bestStreak: 9 }))).toEqual(['on-fire'])
    })
    it('cool-head: an incident event not handled with the best response', () => {
      const idx = base.decisions.findIndex((d) => d.wasEvent)
      const decisions = base.decisions.map((d, i) => (i === idx ? { ...d, quality: 'partial' as const } : d))
      expect(lost({ ...base, decisions })).toEqual(['cool-head'])
    })
    it('calibrated: fewer than ten "Certain" answers, or one of them wrong', () => {
      expect(lost(game({ confidence: base.game.confidence.slice(0, 9) }))).toEqual(['calibrated'])
      const [c0, ...cs] = base.game.confidence
      expect(lost(game({ confidence: [{ ...c0, quality: 'partial' }, ...cs] }))).toEqual(['calibrated'])
    })
    it('unaided: a lifeline used or a question timed out', () => {
      expect(lost(game({ lifelineSteps: ['p1-d1'] }))).toEqual(['unaided'])
      expect(lost(game({ timeouts: 1 }))).toEqual(['unaided'])
    })
    it('excellent needs 90+; Contracts Manager Class needs Expert and 75+', () => {
      expect(lost(at(90))).toEqual([])
      expect(lost(at(89))).toEqual(['excellent'])
      expect(lost(at(75))).toEqual(['excellent'])
      expect(lost(at(74))).toEqual(['excellent', 'expert-class'])
      expect(lost({ ...at(100), game: { ...base.game, difficulty: 'standard' } })).toEqual(['expert-class'])
    })
    it('open risks handed over do not by themselves cost a badge', () => {
      expect(lost(game({ latent: [hazard()] }))).toEqual([])
    })
  })

  knownBug('BUG eng-tests-14: "Permit Perfect ... no paperwork padding" is withheld when an unnecessary permit was raised', () => {
    const base = perfect('standard')
    const step = findSteps<PermitStep>(S1, 'permits')[0]
    const extra = step.options.find((o) => !step.required.includes(o.id))!.id
    const padded: GameState = { ...base, permitAnswers: [{ stepId: step.id, selected: [...step.required, extra] }] }
    expect(evaluateAchievements(padded, S1)).not.toContain('permit-perfect')
  })

  knownBug('BUG eng-tests-4: "Perfect Layout" is withheld when an optional item sits in a zone its own rule calls unsafe', () => {
    // Scenario 3: e.g. the (optional) muster point in the live works lane, fire point in the trench.
    const s3 = SCENARIOS[2]
    const base = perfect('standard', s3)
    const step = setupSteps(s3)[0]
    const optionalWithBadZone = step.rules.filter((r) => !r.required && r.badZones.length > 0)
    expect(optionalWithBadZone.map((r) => r.itemId)).toContain('muster-point')
    const required = layoutFor(step, 'good', true)!
    const taken = new Set(required.map((p) => `${p.x},${p.y}`))
    const bad = layoutFor({ ...step, rules: optionalWithBadZone }, 'unsafe')!.filter((p) => !taken.has(`${p.x},${p.y}`))
    expect(bad.length).toBeGreaterThan(0)
    expect(evaluateAchievements({ ...base, placements: [...required, ...bad] }, s3)).not.toContain('site-perfect')
  })
})

describe('profile and leaderboard storage', () => {
  let storage: ReturnType<typeof memoryStorage>

  beforeEach(() => {
    storage = memoryStorage()
    vi.stubGlobal('localStorage', storage)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts from an empty career and an empty hall of fame', () => {
    expect(loadProfile()).toEqual({ xp: 0, games: 0, achievements: [], bestPoints: {} })
    expect(loadLeaderboard()).toEqual([])
  })

  it('recordGame banks XP, counts the game, unlocks badges once and remembers the best score', () => {
    const state = perfect('standard')
    const first = recordGame(state, S1)
    expect(first.xpBefore).toBe(0)
    expect(first.xpAfter).toBe(state.game.points)
    expect(first.earned).toEqual(ALL_BUT_EXPERT)
    expect(first.newAchievements).toEqual(ALL_BUT_EXPERT)
    expect(loadProfile()).toEqual({
      xp: state.game.points, games: 1, achievements: ALL_BUT_EXPERT, bestPoints: { 's1-commercial-extension:standard': state.game.points },
    })

    const second = recordGame({ ...state, game: { ...state.game, points: 100 } }, S1)
    expect(second.newAchievements).toEqual([])
    expect(second.xpBefore).toBe(state.game.points)
    const profile = loadProfile()
    expect(profile.games).toBe(2)
    expect(profile.xp).toBe(state.game.points + 100)
    expect(profile.achievements).toEqual(ALL_BUT_EXPERT)
    expect(profile.bestPoints['s1-commercial-extension:standard']).toBe(state.game.points)
  })

  it('a negative score never takes XP away, but is still stored as the best when it is the only attempt', () => {
    const state = play(S1, 'standard', 12345, recklessStrategy).final
    expect(state.game.points).toBeLessThan(0)
    expect(recordGame(state, S1).xpAfter).toBe(0)
    expect(loadProfile().bestPoints['s1-commercial-extension:standard']).toBe(state.game.points)
    expect(JSON.stringify(storage.dump())).not.toMatch(/Infinity|NaN/)
  })

  it('adds a leaderboard row with the outcome, sorted by points, using the fallback name', () => {
    const good = perfect('standard')
    const bad = play(S1, 'standard', 12345, recklessStrategy, '').final
    recordGame(bad, S1)
    recordGame({ ...good, delegateName: 'Group B' }, S1)
    const board = loadLeaderboard()
    expect(board.map((e) => e.name)).toEqual(['Group B', 'Delegate'])
    expect(board[0]).toMatchObject({
      scenarioId: S1.id, scenarioTitle: S1.title, difficulty: 'standard', points: good.game.points, onBudget: true,
      onProgramme: true, riddor: 0, notices: 0, shutdown: false, date: good.finishedAt,
    })
    expect(board[1]).toMatchObject({ shutdown: true, onBudget: false, points: bad.game.points })
    expect(board[1].overall).toBeLessThanOrEqual(39)
  })

  it('keeps only the top 200 results', () => {
    const state = perfect('learner')
    for (let i = 0; i < 205; i++) recordGame({ ...state, game: { ...state.game, points: i } }, S1)
    const board = loadLeaderboard()
    expect(board).toHaveLength(200)
    expect(board[0].points).toBe(204)
    expect(board.at(-1)!.points).toBe(5)
  })

  it('clearLeaderboard and resetProfile wipe their own data only', () => {
    recordGame(perfect('learner'), S1)
    clearLeaderboard()
    expect(loadLeaderboard()).toEqual([])
    expect(loadProfile().games).toBe(1)
    resetProfile()
    expect(loadProfile()).toEqual({ xp: 0, games: 0, achievements: [], bestPoints: {} })
  })

  it('survives corrupt or partial data in storage', () => {
    storage.setItem('cpp-profile-v1', '{not json')
    storage.setItem('cpp-leaderboard-v1', '{"not":"an array"}')
    expect(loadProfile()).toEqual({ xp: 0, games: 0, achievements: [], bestPoints: {} })
    expect(loadLeaderboard()).toEqual([])
    storage.setItem('cpp-profile-v1', '{"xp":500}')
    expect(loadProfile()).toEqual({ xp: 500, games: 0, achievements: [], bestPoints: {} })
  })

  it('degrades to a no-op when storage is blocked (private browsing, sandboxed iframe)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('SecurityError') },
      setItem: () => { throw new Error('SecurityError') },
    })
    expect(loadProfile().xp).toBe(0)
    expect(loadLeaderboard()).toEqual([])
    expect(isMuted()).toBe(false)
    expect(() => setMuted(true)).not.toThrow()
    expect(() => recordGame(perfect('learner'), S1)).not.toThrow()
  })

  it('remembers the mute setting', () => {
    expect(isMuted()).toBe(false)
    setMuted(true)
    expect(isMuted()).toBe(true)
    setMuted(false)
    expect(isMuted()).toBe(false)
  })
})
