// Local career profile (XP, rank, achievements) and the classroom leaderboard.
// Everything lives in this browser's localStorage, so a shared classroom device
// builds a shared "Hall of Fame" that the tutor can export or clear.
import type { Difficulty, GameState, PermitStep, Scenario, SequenceStep, SiteSetupStep, TwRegisterStep, HazardHuntStep } from '../types'
import { assessHunt, assessPlacements, assessSequence, twItemScore } from '../engine/scoring'
import { finalOverall, findSteps } from '../engine/reports'
import { outcomeSummary } from '../engine/game'

const PROFILE_KEY = 'cpp-profile-v1'
const BOARD_KEY = 'cpp-leaderboard-v1'
const SOUND_KEY = 'cpp-sound-muted'

export interface Profile {
  xp: number
  games: number
  achievements: string[]
  bestPoints: Record<string, number>
}

export interface LeaderboardEntry {
  id: string
  name: string
  scenarioId: string
  scenarioTitle: string
  difficulty: Difficulty
  points: number
  overall: number
  onBudget: boolean
  onProgramme: boolean
  riddor: number
  notices: number
  shutdown: boolean
  date: string
}

const emptyProfile = (): Profile => ({ xp: 0, games: 0, achievements: [], bestPoints: {} })

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...(JSON.parse(raw) as T) } : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage blocked */ }
}

export function loadProfile(): Profile {
  return read<Profile>(PROFILE_KEY, emptyProfile())
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(BOARD_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function clearLeaderboard() {
  write(BOARD_KEY, [])
}

export function resetProfile() {
  write(PROFILE_KEY, emptyProfile())
}

export function isMuted(): boolean {
  try { return localStorage.getItem(SOUND_KEY) === '1' } catch { return false }
}

export function setMuted(muted: boolean) {
  try { localStorage.setItem(SOUND_KEY, muted ? '1' : '0') } catch { /* storage blocked */ }
}

// ---------- Achievements ----------

export interface AchievementDef {
  id: string
  icon: string
  title: string
  desc: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'zero-harm', icon: '🦺', title: 'Zero Harm', desc: 'Finish a project without a single incident on site.' },
  { id: 'on-budget', icon: '💷', title: 'On Budget', desc: 'Hand over with contingency still in the bank.' },
  { id: 'on-programme', icon: '📅', title: 'On Programme', desc: 'Hand over on or ahead of programme.' },
  { id: 'clean-sheet', icon: '🧾', title: 'Clean Sheet', desc: 'No critical safety failures all project.' },
  { id: 'no-notices', icon: '🏛️', title: 'Nothing to Report', desc: 'No HSE enforcement notices.' },
  { id: 'permit-perfect', icon: '📋', title: 'Permit Perfect', desc: 'Every required permit raised, no paperwork padding.' },
  { id: 'tw-guru', icon: '🔩', title: 'TW Guru', desc: 'Every temporary works register field correct.' },
  { id: 'hawk-eye', icon: '🦅', title: 'Hawk Eye', desc: 'Find every hazard on the walk-round with no false flags.' },
  { id: 'master-planner', icon: '🗓️', title: 'Master Planner', desc: 'Get every work sequence right first time.' },
  { id: 'site-perfect', icon: '🗺️', title: 'Perfect Layout', desc: 'Every required site set-up item in an ideal location.' },
  { id: 'on-fire', icon: '🔥', title: 'On Fire', desc: 'Ten best answers in a row.' },
  { id: 'cool-head', icon: '🧊', title: 'Cool Head', desc: 'Handle every incident event with the best response.' },
  { id: 'calibrated', icon: '🎯', title: 'Calibrated', desc: 'Ten or more "Certain" answers, all of them right.' },
  { id: 'unaided', icon: '🧠', title: 'Unaided', desc: 'Finish without lifelines and without running out of time.' },
  { id: 'excellent', icon: '🏆', title: 'Excellent', desc: 'Finish with an overall grade of 90 or more.' },
  { id: 'expert-class', icon: '👑', title: 'Contracts Manager Class', desc: 'Finish Expert difficulty, not shut down, with 75 or more.' },
]

export function evaluateAchievements(state: GameState, scenario: Scenario): string[] {
  const g = state.game
  const out = outcomeSummary(state)
  const overall = finalOverall(state)
  const got: string[] = []
  if (g.shutdown) return got
  if (out.incidents === 0) got.push('zero-harm')
  if (out.onBudget) got.push('on-budget')
  if (out.onProgramme) got.push('on-programme')
  if (state.criticalFailures.length === 0) got.push('clean-sheet')
  if (out.notices === 0) got.push('no-notices')

  const permitSteps = findSteps<PermitStep>(scenario, 'permits')
  if (permitSteps.length && permitSteps.every((s) => {
    const sel = state.permitAnswers.find((a) => a.stepId === s.id)?.selected ?? []
    return s.required.every((r) => sel.includes(r)) && sel.filter((x) => !s.required.includes(x)).length <= 1
  })) got.push('permit-perfect')

  const twItems = findSteps<TwRegisterStep>(scenario, 'twRegister').flatMap((s) => s.items)
  if (twItems.length && twItems.every((i) => twItemScore(i, state.twAnswers.find((a) => a.itemId === i.id)).wrongFields.length === 0)) got.push('tw-guru')

  const hunts = findSteps<HazardHuntStep>(scenario, 'hazardHunt')
  if (hunts.length && hunts.every((h) => {
    const ans = state.huntAnswers.find((a) => a.stepId === h.id)
    if (!ans) return false
    const a = assessHunt(h, ans.flagged)
    return a.missed.length === 0 && a.falseFlags.length === 0
  })) got.push('hawk-eye')

  const seqs = findSteps<SequenceStep>(scenario, 'sequence')
  if (seqs.length && seqs.every((s) => {
    const ans = state.sequenceAnswers.find((a) => a.stepId === s.id)
    return !!ans && assessSequence(s, ans.order).perfect
  })) got.push('master-planner')

  const setups = findSteps<SiteSetupStep>(scenario, 'siteSetup')
  if (setups.length && setups.every((s) => {
    const a = assessPlacements(s, state.placements)
    return s.rules.filter((r) => r.required).every((r) => a.find((x) => x.itemId === r.itemId)?.status === 'good')
  })) got.push('site-perfect')

  if (g.bestStreak >= 10) got.push('on-fire')
  const events = state.decisions.filter((d) => d.wasEvent)
  if (events.length >= 2 && events.every((d) => d.quality === 'best')) got.push('cool-head')
  if (out.calibration.sure.n >= 10 && out.calibration.sure.best === out.calibration.sure.n) got.push('calibrated')
  if (g.lifelineSteps.length === 0 && g.timeouts === 0) got.push('unaided')
  if (overall >= 90) got.push('excellent')
  if (g.difficulty === 'expert' && overall >= 75) got.push('expert-class')
  return got
}

/**
 * Write a completed game to the profile and leaderboard.
 * Returns the achievements unlocked for the first time and XP before/after.
 */
export function recordGame(state: GameState, scenario: Scenario): { newAchievements: string[]; xpBefore: number; xpAfter: number; earned: string[] } {
  const profile = loadProfile()
  const earned = evaluateAchievements(state, scenario)
  const newAchievements = earned.filter((a) => !profile.achievements.includes(a))
  const xpBefore = profile.xp
  const gained = Math.max(0, state.game.points)
  const key = `${scenario.id}:${state.game.difficulty}`
  const next: Profile = {
    xp: profile.xp + gained,
    games: profile.games + 1,
    achievements: [...profile.achievements, ...newAchievements],
    bestPoints: { ...profile.bestPoints, [key]: Math.max(profile.bestPoints[key] ?? -Infinity, state.game.points) },
  }
  write(PROFILE_KEY, next)

  const out = outcomeSummary(state)
  const entry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    name: state.delegateName || 'Delegate',
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    difficulty: state.game.difficulty,
    points: state.game.points,
    overall: finalOverall(state),
    onBudget: out.onBudget,
    onProgramme: out.onProgramme,
    riddor: out.riddor,
    notices: out.notices,
    shutdown: state.game.shutdown,
    date: state.finishedAt ?? new Date().toISOString(),
  }
  const board = [...loadLeaderboard(), entry].sort((a, b) => b.points - a.points).slice(0, 200)
  write(BOARD_KEY, board)
  return { newAchievements, xpBefore, xpAfter: next.xp, earned }
}
