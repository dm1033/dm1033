// Monte-Carlo balance check: plays every scenario at every difficulty with simulated
// delegates of different ability, using the real game reducer, and reports outcomes.
// Usage: npx tsx scripts/balance-sim.ts [runsPerCell=150]
import { SCENARIOS } from '../src/data'
import { gameReducer, initialGameState, isEventPhase } from '../src/state/GameContext'
import { finalOverall } from '../src/engine/reports'
import { zoneAt } from '../src/engine/scoring'
import { mulberry32 } from '../src/engine/game'
import type {
  DecisionStep, Difficulty, GameState, OptionQuality, PlacementRecord, Scenario, Step, TwAnswerRecord,
} from '../src/types'

const RUNS = Number(process.argv[2] ?? 150)

interface Profile {
  name: string
  /** Probability of choosing each quality (falls back to nearest available). */
  mix: Record<OptionQuality, number>
  /** Probability of getting any single "objective" item right (TW field, permit, placement, hazard). */
  accuracy: number
  falseFlag: number
  rectify: 'all' | 'major' | 'none'
}

const PROFILES: Profile[] = [
  { name: 'Strong', mix: { best: 0.85, partial: 0.1, poor: 0.04, unsafe: 0.01 }, accuracy: 0.92, falseFlag: 0.08, rectify: 'all' },
  { name: 'Competent', mix: { best: 0.65, partial: 0.2, poor: 0.12, unsafe: 0.03 }, accuracy: 0.8, falseFlag: 0.15, rectify: 'major' },
  { name: 'Weak', mix: { best: 0.4, partial: 0.25, poor: 0.25, unsafe: 0.1 }, accuracy: 0.6, falseFlag: 0.3, rectify: 'none' },
  { name: 'Reckless', mix: { best: 0.25, partial: 0.25, poor: 0.25, unsafe: 0.25 }, accuracy: 0.4, falseFlag: 0.5, rectify: 'none' },
]

function pickOption(step: DecisionStep, p: Profile, r: () => number) {
  let x = r()
  let q: OptionQuality = 'best'
  for (const k of ['best', 'partial', 'poor', 'unsafe'] as OptionQuality[]) {
    if (x < p.mix[k]) { q = k; break }
    x -= p.mix[k]
  }
  const order: OptionQuality[] = q === 'unsafe' ? ['unsafe', 'poor', 'partial', 'best'] : q === 'poor' ? ['poor', 'unsafe', 'partial', 'best'] : q === 'partial' ? ['partial', 'poor', 'best'] : ['best']
  for (const want of order) {
    const o = step.options.find((x) => x.quality === want)
    if (o) return o
  }
  return step.options[0]
}

function play(scenario: Scenario, difficulty: Difficulty, p: Profile, seed: number): GameState {
  const r = mulberry32(seed * 7919 + 13)
  let s = gameReducer(initialGameState, { type: 'START_SCENARIO', scenarioId: scenario.id, delegateName: 'Sim', difficulty, seed })
  const dispatch = (a: Parameters<typeof gameReducer>[1]) => { s = gameReducer(s, a) }
  let guard = 0
  while (!s.completed && guard++ < 500) {
    if (s.game.pendingWeek) {
      const open = s.game.latent.filter((h) => h.status === 'open' && (difficulty !== 'expert' || h.revealed))
      if (difficulty === 'expert' && p.rectify !== 'none' && r() < 0.5) dispatch({ type: 'AUDIT' })
      for (const h of open) {
        if (p.rectify === 'all' || (p.rectify === 'major' && h.severity === 'major')) dispatch({ type: 'RECTIFY', hazardId: h.id })
      }
      dispatch({ type: 'CLOSE_WEEK' })
      continue
    }
    const phase = scenario.phases[s.phaseIndex]
    const find = (id: string) => scenario.eventPool.find((e) => e.id === id)
    const surprise = s.game.surpriseEvents.filter((x) => x.phaseNumber === phase.number).map((x) => find(x.eventId)!).filter(Boolean)
    const extra: Step[] = isEventPhase(phase.number) ? [...surprise, ...s.drawnEventIds.map(find).filter((e): e is DecisionStep => !!e)] : surprise
    const step = [...phase.steps, ...extra][s.stepIndex]
    switch (step.type) {
      case 'decision':
        dispatch({ type: 'ANSWER_DECISION', step, option: pickOption(step, p, r), phaseNumber: phase.number, confidence: 'think', timeFrac: 0.5, timedOut: false })
        break
      case 'siteSetup': {
        const placements: PlacementRecord[] = []
        const used = new Set<string>()
        for (const rule of step.rules) {
          if (!rule.required && r() > 0.5) continue
          const wantGood = r() < p.accuracy
          outer: for (let y = 0; y < step.grid.rows; y++) {
            for (let x = 0; x < step.grid.cols; x++) {
              const key = `${x},${y}`
              if (used.has(key)) continue
              const zones = zoneAt(step, x, y)
              if (zones.some((z) => step.zones.find((zz) => zz.id === z)?.blocked)) continue
              const good = zones.some((z) => rule.goodZones.includes(z)) && !zones.some((z) => rule.badZones.includes(z))
              if (good === wantGood) { placements.push({ itemId: rule.itemId, x, y }); used.add(key); break outer }
            }
          }
        }
        dispatch({ type: 'SUBMIT_SITE_SETUP', step, placements })
        break
      }
      case 'twRegister': {
        const answers: TwAnswerRecord[] = step.items.map((i) => {
          const c = i.correct
          const ok = () => r() < p.accuracy
          return {
            itemId: i.id,
            register: ok() ? c.register : !c.register,
            design: ok() ? c.design : c.design === 'none' ? 'standard-solution' : 'none',
            catCheck: ok() ? c.catCheck : c.catCheck === 'cat0' ? 'cat1' : 'cat0',
            rams: ok() ? c.rams : !c.rams,
            inspection: ok() ? c.inspection : !c.inspection,
            holdPoint: ok() ? c.holdPoint : !c.holdPoint,
            responsible: ok() ? c.responsible : c.responsible === 'TWC' ? 'PC' : 'TWC',
          }
        })
        dispatch({ type: 'SUBMIT_TW', step, answers })
        break
      }
      case 'permits': {
        const selected = step.options.filter((o) => (step.required.includes(o.id) ? r() < p.accuracy : r() < 1 - p.accuracy)).map((o) => o.id)
        dispatch({ type: 'SUBMIT_PERMITS', step, selected })
        break
      }
      case 'hazardHunt': {
        const flagged = step.observations.filter((o) => (o.hazard ? r() < p.accuracy : r() < p.falseFlag)).map((o) => o.id)
        dispatch({ type: 'SUBMIT_HUNT', step, flagged, secondsLeft: Math.round(step.timeLimit * 0.3) })
        break
      }
      case 'sequence': {
        const order = step.activities.map((a) => a.id)
        const swaps = Math.round((1 - p.accuracy) * 8)
        for (let i = 0; i < swaps; i++) {
          const a = Math.floor(r() * (order.length - 1))
          ;[order[a], order[a + 1]] = [order[a + 1], order[a]]
        }
        dispatch({ type: 'SUBMIT_SEQUENCE', step, order, phaseNumber: phase.number })
        break
      }
      default:
        break
    }
    dispatch({ type: 'ADVANCE', scenario, extraSteps: extra.length })
  }
  return s
}

const pct = (n: number, d: number) => `${Math.round((100 * n) / d)}%`.padStart(5)
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)

console.log(`Balance simulation · ${RUNS} runs per cell\n`)
console.log('Scenario                     Level     Delegate   Shut  Budget  OnProg  Incid  RIDDOR  Notices  Grade   Points')
for (const scenario of SCENARIOS) {
  for (const difficulty of ['learner', 'standard', 'expert'] as Difficulty[]) {
    for (const p of PROFILES) {
      const res = Array.from({ length: RUNS }, (_, i) => play(scenario, difficulty, p, i + 1))
      const name = scenario.title.replace(/^Scenario \d+ — /, '').slice(0, 27).padEnd(28)
      console.log(
        `${name} ${difficulty.padEnd(9)} ${p.name.padEnd(10)}` +
        `${pct(res.filter((s) => s.game.shutdown).length, RUNS)} ` +
        `${pct(res.filter((s) => s.game.budget >= 0).length, RUNS)}  ` +
        `${pct(res.filter((s) => s.game.floatDays >= 0).length, RUNS)}  ` +
        `${avg(res.map((s) => s.game.consequences.length)).toFixed(1).padStart(5)}  ` +
        `${avg(res.map((s) => s.game.consequences.filter((c) => c.riddor).length)).toFixed(1).padStart(5)}  ` +
        `${avg(res.map((s) => s.game.notices.length)).toFixed(1).padStart(6)}   ` +
        `${avg(res.map((s) => finalOverall(s))).toFixed(0).padStart(4)}  ` +
        `${avg(res.map((s) => s.game.points)).toFixed(0).padStart(7)}`,
      )
    }
  }
}
