import { describe, expect, it } from 'vitest'
import {
  DIFFICULTIES, DIFFICULTY_ORDER, RANKS, WEEK_PHASES, auditCost, award, completionBonuses, decisionEconomy,
  decisionPoints, economyFor, fmtDays, fmtMoney, hashString, latentFromOption, lifelineRemovals, mulberry32,
  outcomeSummary, parseMoney, parseWeeks, rankFor, rectifyCost, rngFor, scaleFor, shuffleWith, shuffledOptions,
  simulateWeek, weekFor,
} from './game'
import { SCENARIOS } from '../data'
import type { Confidence, ConsequenceRecord, Difficulty, GameState, NoticeRecord, OptionQuality } from '../types'
import { initialGameMeta } from '../state/GameContext'
import { DIFFS, S1, S2, S3, allDecisions, decisionStep, hazard, option, stateFor } from '../test/fixtures'
import { deepFreeze } from '../test/playthrough'
import { knownBug } from '../test/knownBug'

const QUALITIES: OptionQuality[] = ['best', 'partial', 'poor', 'unsafe']
const CONFIDENCES: Confidence[] = ['sure', 'think', 'guess']
const SEEDS = [1, 2, 3, 7, 42, 1234, 99991, 2 ** 31 - 1]

// ---------------------------------------------------------------------------
// Deterministic randomness
// ---------------------------------------------------------------------------

describe('seeded randomness', () => {
  it('hashString is a stable unsigned 32-bit hash', () => {
    expect(hashString('')).toBe(2166136261)
    expect(hashString('opts:p1-d1')).toBe(hashString('opts:p1-d1'))
    expect(hashString('opts:p1-d1')).not.toBe(hashString('opts:p1-d2'))
    for (const s of ['a', 'week:4', 'événement', '🚧']) {
      const h = hashString(s)
      expect(Number.isInteger(h)).toBe(true)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThan(2 ** 32)
    }
  })

  it('mulberry32 repeats exactly for the same seed and stays inside [0, 1)', () => {
    const a = mulberry32(123)
    const b = mulberry32(123)
    const c = mulberry32(124)
    const seqA = Array.from({ length: 200 }, () => a())
    const seqB = Array.from({ length: 200 }, () => b())
    const seqC = Array.from({ length: 200 }, () => c())
    expect(seqA).toEqual(seqB)
    expect(seqA).not.toEqual(seqC)
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('rngFor gives independent streams per salt and survives negative or huge seeds', () => {
    expect(rngFor(5, 'week:4')()).toBe(rngFor(5, 'week:4')())
    expect(rngFor(5, 'week:4')()).not.toBe(rngFor(5, 'week:5')())
    for (const seed of [-1, 0, 2 ** 31, 2 ** 32 + 5]) {
      const v = rngFor(seed, 'x')()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('shuffleWith returns a permutation and leaves its input alone', () => {
    const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]) as unknown as number[]
    const out = shuffleWith(input, mulberry32(9))
    expect(out).not.toBe(input)
    expect([...out].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(shuffleWith([], mulberry32(1))).toEqual([])
    expect(shuffleWith(['only'], mulberry32(1))).toEqual(['only'])
  })
})

// ---------------------------------------------------------------------------
// shuffledOptions
// ---------------------------------------------------------------------------

describe('shuffledOptions', () => {
  for (const scenario of SCENARIOS) {
    it(`${scenario.id}: is a permutation of the authored options for every decision and seed`, () => {
      for (const step of allDecisions(scenario)) {
        const authored = step.options.map((o) => o.id)
        for (const seed of SEEDS) {
          const shuffled = shuffledOptions(step, seed)
          expect(shuffled).toHaveLength(authored.length)
          expect(shuffled.map((o) => o.id).sort()).toEqual([...authored].sort())
          // Same objects, not copies: the reducer relies on the option it is handed.
          for (const o of shuffled) expect(step.options).toContain(o)
        }
        // The authored array must never be reordered in place.
        expect(step.options.map((o) => o.id)).toEqual(authored)
      }
    })
  }

  it('is deterministic: the same seed and step always give the same order (stable across reloads)', () => {
    for (const step of allDecisions(S1)) {
      for (const seed of SEEDS) {
        expect(shuffledOptions(step, seed).map((o) => o.id)).toEqual(shuffledOptions(step, seed).map((o) => o.id))
      }
    }
  })

  it('changes with the seed and with the step id', () => {
    const steps = allDecisions(S1)
    const orderFor = (seed: number) => steps.map((s) => shuffledOptions(s, seed).map((o) => o.id).join(',')).join('|')
    expect(orderFor(1)).not.toBe(orderFor(2))
    const twin = { ...steps[0], id: `${steps[0].id}-copy` }
    const differs = SEEDS.some((seed) =>
      shuffledOptions(steps[0], seed).map((o) => o.id).join() !== shuffledOptions(twin, seed).map((o) => o.id).join())
    expect(differs).toBe(true)
  })

  it('removes the "it is always A" cue: the best answer lands in each position about a quarter of the time', () => {
    const counts = [0, 0, 0, 0]
    let n = 0
    for (const scenario of SCENARIOS) {
      for (const step of allDecisions(scenario)) {
        if (step.options.length !== 4) continue
        for (let seed = 1; seed <= 200; seed++) {
          counts[shuffledOptions(step, seed).findIndex((o) => o.quality === 'best')]++
          n++
        }
      }
    }
    for (const c of counts) {
      expect(c / n).toBeGreaterThan(0.22)
      expect(c / n).toBeLessThan(0.28)
    }
  })
})

// ---------------------------------------------------------------------------
// lifelineRemovals
// ---------------------------------------------------------------------------

describe('lifelineRemovals ("Call the H&S Adviser")', () => {
  const rank: Record<OptionQuality, number> = { unsafe: 0, poor: 1, partial: 2, best: 3 }

  for (const scenario of SCENARIOS) {
    it(`${scenario.id}: removes two wrong answers, never the best, and keeps the most plausible distractor`, () => {
      for (const step of allDecisions(scenario)) {
        const best = step.options.filter((o) => o.quality === 'best').map((o) => o.id)
        expect(best).toHaveLength(1)
        for (const seed of SEEDS) {
          const removed = lifelineRemovals(step, seed)
          expect(removed).toHaveLength(2)
          expect(new Set(removed).size).toBe(2)
          expect(removed).not.toContain(best[0])
          for (const id of removed) expect(step.options.some((o) => o.id === id)).toBe(true)
          const left = step.options.filter((o) => o.quality !== 'best' && !removed.includes(o.id))
          expect(left).toHaveLength(step.options.length - 3)
          const worstLeft = Math.min(...left.map((o) => rank[o.quality]))
          const bestRemoved = Math.max(...removed.map((id) => rank[step.options.find((o) => o.id === id)!.quality]))
          expect(worstLeft).toBeGreaterThanOrEqual(bestRemoved)
          expect(lifelineRemovals(step, seed)).toEqual(removed)
        }
      }
    })
  }

  it('always leaves at least one distractor standing on short questions', () => {
    const three = decisionStep({ options: [option('best'), option('poor'), option('unsafe')] })
    expect(lifelineRemovals(three, 1)).toEqual(['opt-unsafe'])
    const two = decisionStep({ options: [option('best'), option('poor')] })
    expect(lifelineRemovals(two, 1)).toEqual([])
    const none = decisionStep({ options: [option('best')] })
    expect(lifelineRemovals(none, 1)).toEqual([])
  })

  it('ties between equally bad options are broken by the seed, not by authored position', () => {
    const step = decisionStep({
      options: [option('best'), option('poor', { id: 'p1' }), option('poor', { id: 'p2' }), option('poor', { id: 'p3' })],
    })
    const survivors = new Set<string>()
    for (let seed = 1; seed <= 60; seed++) {
      const removed = lifelineRemovals(step, seed)
      survivors.add(['p1', 'p2', 'p3'].find((id) => !removed.includes(id))!)
    }
    expect([...survivors].sort()).toEqual(['p1', 'p2', 'p3'])
  })
})

// ---------------------------------------------------------------------------
// Project economy
// ---------------------------------------------------------------------------

describe('parseMoney', () => {
  it.each([
    ['£1.4m', 1_400_000],
    ['£3.8m', 3_800_000],
    ['£1.1m', 1_100_000],
    ['£950k', 950_000],
    ['£1,400,000', 1_400_000],
    ['£2bn', 2_000_000_000],
    ['£ 2.5 M', 2_500_000],
    ['1.4m', 1_400_000],
    ['£750', 750],
    ['£1.4 million', 1_400_000],
  ])('%s -> %d', (text, value) => {
    expect(parseMoney(text)).toBe(value)
  })

  it('falls back to the £1.4m reference project when there is no number at all', () => {
    expect(parseMoney('to be confirmed')).toBe(1_400_000)
    expect(parseMoney('')).toBe(1_400_000)
  })

  knownBug('BUG eng-tests-13: prose before the figure must not turn the budget into NaN', () => {
    // "Approx." / "c." end in a full stop, which the pattern accepts as a number.
    expect(parseMoney('Approx. £3.2m')).toBe(3_200_000)
    expect(parseMoney('c. £2.5m')).toBe(2_500_000)
  })
})

describe('parseWeeks', () => {
  it.each([
    ['22 weeks', 22],
    ['34 weeks', 34],
    ['16 weeks', 16],
    ['1 week', 1],
    ['12 Weeks on site', 12],
    ['6 months', 26],
    ['1 month', 4],
    ['unknown', 20],
  ])('%s -> %d', (text, weeks) => {
    expect(parseWeeks(text)).toBe(weeks)
  })

  knownBug('BUG eng-tests-13: a hyphenated duration ("40-week programme") is not silently replaced by 20 weeks', () => {
    expect(parseWeeks('40-week programme')).toBe(40)
  })
})

describe('economyFor / scaleFor', () => {
  it('the three shipped briefs are written in a form the parsers genuinely understand', () => {
    for (const s of SCENARIOS) {
      expect(s.brief.value).toMatch(/^£[\d.,]+\s*(m|k|bn)?\b/i)
      expect(s.brief.duration).toMatch(/\d+\s*(week|month)/i)
    }
    expect(SCENARIOS.map((s) => parseMoney(s.brief.value))).toEqual([1_400_000, 3_800_000, 1_100_000])
    expect(SCENARIOS.map((s) => parseWeeks(s.brief.duration))).toEqual([22, 34, 16])
  })

  it.each([
    // scenario, difficulty, contingency £, float days, weeks
    [0, 'learner', 70_000, 12, 22],
    [0, 'standard', 56_000, 10, 22],
    [0, 'expert', 45_000, 8, 22],
    [1, 'learner', 190_000, 19, 34],
    [1, 'standard', 152_000, 15, 34],
    [1, 'expert', 122_000, 12, 34],
    [2, 'learner', 55_000, 9, 16],
    [2, 'standard', 44_000, 7, 16],
    [2, 'expert', 35_000, 6, 16],
  ] as const)('scenario %i on %s: £%i contingency, %i days float, %i weeks', (idx, difficulty, budget, float, weeks) => {
    expect(economyFor(SCENARIOS[idx], difficulty)).toEqual({ budgetStart: budget, floatStart: float, weeksTotal: weeks })
  })

  it('matches the documented contingency percentages (5% / 4% / 3.2%) to the nearest £1,000', () => {
    const pct: Record<Difficulty, number> = { learner: 0.05, standard: 0.04, expert: 0.032 }
    for (const s of SCENARIOS) {
      for (const d of DIFFS) {
        const eco = economyFor(s, d)
        expect(Math.abs(eco.budgetStart - parseMoney(s.brief.value) * pct[d])).toBeLessThanOrEqual(500)
        expect(eco.budgetStart % 1000).toBe(0)
        expect(eco.floatStart).toBeGreaterThanOrEqual(4)
        expect(Number.isInteger(eco.floatStart)).toBe(true)
      }
    }
  })

  it('harder difficulties never get more money or more float', () => {
    for (const s of SCENARIOS) {
      const [l, st, e] = DIFFICULTY_ORDER.map((d) => economyFor(s, d))
      expect(l.budgetStart).toBeGreaterThan(st.budgetStart)
      expect(st.budgetStart).toBeGreaterThan(e.budgetStart)
      expect(l.floatStart).toBeGreaterThanOrEqual(st.floatStart)
      expect(st.floatStart).toBeGreaterThanOrEqual(e.floatStart)
    }
  })

  it('scaleFor is relative to the £1.4m reference job and clamped to 0.5–3', () => {
    expect(scaleFor(S1)).toBe(1)
    expect(scaleFor(S2)).toBeCloseTo(3.8 / 1.4, 10)
    expect(scaleFor(S3)).toBeCloseTo(1.1 / 1.4, 10)
    const withValue = (value: string) => ({ ...S1, brief: { ...S1.brief, value } })
    expect(scaleFor(withValue('£100k'))).toBe(0.5)
    expect(scaleFor(withValue('£40m'))).toBe(3)
  })

  it('never yields NaN, zero or negative resources for a brief with odd wording', () => {
    for (const value of ['£1.4m', 'TBC', '£0', 'about two million']) {
      for (const duration of ['22 weeks', 'TBC', '0 weeks']) {
        const eco = economyFor({ ...S1, brief: { ...S1.brief, value, duration } }, 'standard')
        expect(Number.isFinite(eco.budgetStart)).toBe(true)
        expect(eco.budgetStart).toBeGreaterThanOrEqual(0)
        expect(eco.floatStart).toBeGreaterThanOrEqual(4)
      }
    }
  })
})

describe('fmtMoney / fmtDays', () => {
  it('formats money for the HUD', () => {
    expect(fmtMoney(0)).toBe('£0')
    expect(fmtMoney(950)).toBe('£950')
    expect(fmtMoney(56_000)).toBe('£56.0k')
    expect(fmtMoney(1_400_000)).toBe('£1.40m')
    expect(fmtMoney(-4_100)).toBe('−£4.1k')
  })
  it('formats programme days with a sign', () => {
    expect(fmtDays(0)).toBe('0 d')
    expect(fmtDays(2)).toBe('+2 d')
    expect(fmtDays(-1.5)).toBe('−1.5 d')
  })
})

describe('decisionEconomy', () => {
  it('turns cost pressure into £ scaled by project size and programme marks into half-days', () => {
    expect(decisionEconomy(option('poor', { impact: { cost: 3, programme: -2 } }), S1)).toEqual({ cost: 3000, days: -1 })
    expect(decisionEconomy(option('poor', { impact: { cost: 3 } }), S2)).toEqual({ cost: 8100, days: 0 })
    expect(decisionEconomy(option('best'), S1)).toEqual({ cost: 0, days: 0 })
  })

  it('clamps a single decision to between -4 and +3 days', () => {
    expect(decisionEconomy(option('poor', { impact: { programme: -20 } }), S1).days).toBe(-4)
    expect(decisionEconomy(option('poor', { impact: { programme: 20 } }), S1).days).toBe(3)
  })

  it('every authored option produces a clean £100 / half-day figure', () => {
    for (const s of SCENARIOS) {
      for (const step of allDecisions(s)) {
        for (const o of step.options) {
          const eco = decisionEconomy(o, s)
          expect(Number.isFinite(eco.cost)).toBe(true)
          expect(Math.abs(eco.cost % 100)).toBe(0)
          expect(Math.abs((eco.days * 2) % 1)).toBe(0)
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// decisionPoints
// ---------------------------------------------------------------------------

describe('decisionPoints', () => {
  const base = { streak: 0, timeFrac: null, lifeline: false, timedOut: false, multiplier: 1 }

  // docs/GAME-DESIGN.md, "Confidence wager".
  const TABLE: Record<Confidence, Record<OptionQuality, number>> = {
    sure: { best: 150, partial: 40, poor: -80, unsafe: -240 },
    think: { best: 100, partial: 40, poor: -40, unsafe: -120 },
    guess: { best: 60, partial: 32, poor: -20, unsafe: -60 },
  }

  for (const confidence of CONFIDENCES) {
    for (const quality of QUALITIES) {
      it(`${confidence} + ${quality} = ${TABLE[confidence][quality]} at ×1`, () => {
        expect(decisionPoints({ ...base, quality, confidence })).toBe(TABLE[confidence][quality])
      })
    }
  }

  it('applies the difficulty multiplier to the whole table (×1, ×1.25, ×1.6)', () => {
    for (const d of DIFFS) {
      const multiplier = DIFFICULTIES[d].pointsMultiplier
      for (const confidence of CONFIDENCES) {
        for (const quality of QUALITIES) {
          expect(decisionPoints({ ...base, quality, confidence, multiplier })).toBe(Math.round(TABLE[confidence][quality] * multiplier))
        }
      }
    }
    expect(DIFFS.map((d) => DIFFICULTIES[d].pointsMultiplier)).toEqual([1, 1.25, 1.6])
  })

  it('"Certain" is the only wager that beats "Fairly sure" when right and it costs double when wrong', () => {
    const p = (quality: OptionQuality, confidence: Confidence) => decisionPoints({ ...base, quality, confidence })
    expect(p('best', 'sure')).toBeGreaterThan(p('best', 'think'))
    expect(p('best', 'think')).toBeGreaterThan(p('best', 'guess'))
    expect(p('unsafe', 'sure')).toBe(2 * p('unsafe', 'think'))
    expect(p('poor', 'sure')).toBe(2 * p('poor', 'think'))
    expect(p('unsafe', 'guess')).toBe(0.5 * p('unsafe', 'think'))
  })

  it('adds +10 per consecutive best answer, capped at +100, and only to best answers', () => {
    const best = (streak: number) => decisionPoints({ ...base, quality: 'best', confidence: 'think', streak })
    expect(best(0)).toBe(100)
    expect(best(1)).toBe(110)
    expect(best(9)).toBe(190)
    expect(best(10)).toBe(200)
    expect(best(11)).toBe(200)
    expect(best(500)).toBe(200)
    for (const quality of ['partial', 'poor', 'unsafe'] as OptionQuality[]) {
      expect(decisionPoints({ ...base, quality, confidence: 'think', streak: 10 })).toBe(TABLE.think[quality])
    }
  })

  it('adds a time bonus of up to +50 on timed questions, clamped to the 0..1 range, best answers only', () => {
    const best = (timeFrac: number | null) => decisionPoints({ ...base, quality: 'best', confidence: 'think', timeFrac })
    expect(best(null)).toBe(100)
    expect(best(0)).toBe(100)
    expect(best(0.5)).toBe(125)
    expect(best(1)).toBe(150)
    expect(best(7)).toBe(150)
    expect(best(-3)).toBe(100)
    expect(decisionPoints({ ...base, quality: 'partial', confidence: 'think', timeFrac: 1 })).toBe(40)
    expect(decisionPoints({ ...base, quality: 'unsafe', confidence: 'think', timeFrac: 1 })).toBe(-120)
  })

  it('a lifeline halves a best answer, including its streak and time bonus', () => {
    expect(decisionPoints({ ...base, quality: 'best', confidence: 'think', lifeline: true })).toBe(50)
    expect(decisionPoints({ ...base, quality: 'best', confidence: 'sure', streak: 4, timeFrac: 1, lifeline: true })).toBe(120)
    // Penalties are not softened by having phoned the adviser.
    expect(decisionPoints({ ...base, quality: 'unsafe', confidence: 'sure', lifeline: true })).toBe(-240)
  })

  it('running out of time is a flat −60 × difficulty whatever else is passed', () => {
    for (const quality of QUALITIES) {
      for (const confidence of CONFIDENCES) {
        expect(decisionPoints({ quality, confidence, streak: 10, timeFrac: 1, lifeline: true, timedOut: true, multiplier: 1 })).toBe(-60)
        expect(decisionPoints({ quality, confidence, streak: 10, timeFrac: 1, lifeline: true, timedOut: true, multiplier: 1.25 })).toBe(-75)
        expect(decisionPoints({ quality, confidence, streak: 10, timeFrac: 1, lifeline: true, timedOut: true, multiplier: 1.6 })).toBe(-96)
      }
    }
  })

  it('always returns a whole number', () => {
    for (const multiplier of [1, 1.25, 1.6]) {
      for (const quality of QUALITIES) {
        for (const confidence of CONFIDENCES) {
          for (const streak of [0, 3, 12]) {
            for (const timeFrac of [null, 0.33, 0.99]) {
              for (const lifeline of [false, true]) {
                expect(Number.isInteger(decisionPoints({ quality, confidence, streak, timeFrac, lifeline, timedOut: false, multiplier }))).toBe(true)
              }
            }
          }
        }
      }
    }
  })

  it('without a lifeline, a better answer never scores fewer points than a worse one', () => {
    for (const confidence of CONFIDENCES) {
      const pts = QUALITIES.map((quality) => decisionPoints({ ...base, quality, confidence }))
      expect([...pts].sort((a, b) => b - a)).toEqual(pts)
    }
  })

  knownBug('BUG eng-tests-9: with the lifeline used, the best answer still out-scores a partial one', () => {
    // "Halves the points for this question" is applied to best answers only, so
    // best + Unsure + lifeline = 30 but partial + Unsure + lifeline = 32.
    for (const confidence of CONFIDENCES) {
      const best = decisionPoints({ ...base, quality: 'best', confidence, lifeline: true })
      const partial = decisionPoints({ ...base, quality: 'partial', confidence, lifeline: true })
      expect(best).toBeGreaterThan(partial)
    }
  })
})

describe('award', () => {
  it('adds points and bumps the award sequence so the HUD can animate each one', () => {
    const g0 = initialGameMeta()
    const g1 = award(g0, 150, 'Good call')
    const g2 = award(g1, -80, 'Poor call')
    expect(g0.points).toBe(0)
    expect(g1).toMatchObject({ points: 150, lastAward: { seq: 1, amount: 150, label: 'Good call' } })
    expect(g2).toMatchObject({ points: 70, lastAward: { seq: 2, amount: -80, label: 'Poor call' } })
  })
})

// ---------------------------------------------------------------------------
// Latent hazards
// ---------------------------------------------------------------------------

describe('latentFromOption', () => {
  const step = decisionStep()
  it('best and partial answers leave nothing behind', () => {
    expect(latentFromOption(step, step.options[0], 5)).toBeNull()
    expect(latentFromOption(step, step.options[1], 5)).toBeNull()
  })
  it('a poor answer leaves a minor hazard and an unsafe answer a major one', () => {
    expect(latentFromOption(step, step.options[2], 5)).toMatchObject({
      id: 'fx-d1:opt-poor', stepId: 'fx-d1', phaseNumber: 5, severity: 'minor', status: 'open', revealed: false, topic: 'Fixture topic', choice: 'poor option',
    })
    expect(latentFromOption(step, step.options[3], 7)).toMatchObject({
      id: 'fx-d1:opt-unsafe', severity: 'major', phaseNumber: 7, consequence: 'A scaffold collapsed.',
    })
  })
  it('falls back to a generic narrative built from the feedback when none is authored', () => {
    const h = latentFromOption(step, step.options[2], 5)!
    expect(h.consequence).toContain('Fixture topic')
    expect(h.consequence).toContain('poor feedback')
  })
  it('every authored poor/unsafe option carries its own consequence narrative', () => {
    for (const s of SCENARIOS) {
      for (const d of allDecisions(s)) {
        for (const o of d.options) {
          if (o.quality === 'poor' || o.quality === 'unsafe') expect(o.consequence, `${s.id} ${d.id} ${o.id}`).toBeTruthy()
        }
      }
    }
  })
})

describe('rectifyCost / auditCost', () => {
  it('matches the documented close-out prices on the £1.4m reference job', () => {
    expect(rectifyCost(hazard({ severity: 'minor' }), S1)).toEqual({ cost: 1500, days: 0.5 })
    expect(rectifyCost(hazard({ severity: 'major' }), S1)).toEqual({ cost: 4000, days: 1 })
    expect(auditCost(S1)).toEqual({ cost: 2500, days: 0.5 })
  })
  it('scales with project value, rounded to £100', () => {
    expect(rectifyCost(hazard({ severity: 'major' }), S2)).toEqual({ cost: 10900, days: 1 })
    expect(rectifyCost(hazard({ severity: 'minor' }), S3)).toEqual({ cost: 1200, days: 0.5 })
    expect(auditCost(S2).cost).toBe(6800)
  })
  it('closing a risk out is always cheaper than the incident it prevents', () => {
    for (const s of SCENARIOS) {
      const k = scaleFor(s)
      expect(rectifyCost(hazard({ severity: 'minor' }), s).cost).toBeLessThan(4000 * k)
      expect(rectifyCost(hazard({ severity: 'major' }), s).cost).toBeLessThan(15000 * k)
    }
  })
})

describe('weekFor', () => {
  it('site weeks follow phases 4–13', () => {
    expect(WEEK_PHASES).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
  })
  it('stays inside the programme and moves strictly forward on all three scenarios', () => {
    for (const s of SCENARIOS) {
      const total = parseWeeks(s.brief.duration)
      const weeks = WEEK_PHASES.map((p) => weekFor(p, total))
      for (const w of weeks) {
        expect(w).toBeGreaterThanOrEqual(1)
        expect(w).toBeLessThanOrEqual(total)
      }
      expect([...new Set(weeks)]).toEqual(weeks)
      expect([...weeks].sort((a, b) => a - b)).toEqual(weeks)
    }
  })
  it('clamps for degenerate programmes', () => {
    expect(weekFor(4, 0)).toBe(1)
    expect(weekFor(13, 1)).toBe(1)
    expect(weekFor(1, 22)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// simulateWeek
// ---------------------------------------------------------------------------

describe('simulateWeek', () => {
  const manyHazards = (n: number, severity: 'minor' | 'major' = 'major') =>
    Array.from({ length: n }, (_, i) => hazard({ id: `h${i}`, severity, phaseNumber: 2 }))

  it('is deterministic for a given seed and phase, and never mutates the state it is given', () => {
    for (const seed of SEEDS) {
      const state = deepFreeze(stateFor(S1, 'expert', { seed, latent: manyHazards(6) }, { incidentLikelihood: 80, enforcementRisk: 75 }))
      const a = simulateWeek(state, S1, 6)
      const b = simulateWeek(state, S1, 6)
      expect(a).toEqual(b)
      expect(state.game.latent.every((h) => h.status === 'open')).toBe(true)
    }
  })

  it('different phases of the same run roll independently', () => {
    const outcomes = new Set<string>()
    for (const phase of WEEK_PHASES) {
      const state = stateFor(S1, 'standard', { seed: 7, latent: manyHazards(8) }, { incidentLikelihood: 60 })
      outcomes.add(simulateWeek(state, S1, phase).report.consequences.map((c) => c.hazardId).join(','))
    }
    expect(outcomes.size).toBeGreaterThan(1)
  })

  it('INVARIANT: never more than two consequences in one week, however bad the site is', () => {
    let sawTwo = false
    for (const difficulty of DIFFS) {
      for (let seed = 1; seed <= 300; seed++) {
        for (const phase of [4, 8, 13]) {
          const state = stateFor(S2, difficulty, { seed, latent: [...manyHazards(15), ...manyHazards(15, 'minor').map((h) => ({ ...h, id: `m-${h.id}` }))] }, { incidentLikelihood: 100 })
          const { report, game } = simulateWeek(state, S2, phase)
          expect(report.consequences.length).toBeLessThanOrEqual(2)
          expect(game.latent.filter((h) => h.status === 'fired')).toHaveLength(report.consequences.length)
          if (report.consequences.length === 2) sawTwo = true
        }
      }
    }
    expect(sawTwo).toBe(true)
  })

  it('only open hazards created in an EARLIER phase can fire; fired and rectified ones never fire again', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const latent = [
        hazard({ id: 'same-phase', phaseNumber: 6 }),
        hazard({ id: 'later-phase', phaseNumber: 9 }),
        hazard({ id: 'already-fired', status: 'fired' }),
        hazard({ id: 'closed-out', status: 'rectified' }),
        hazard({ id: 'eligible', phaseNumber: 5 }),
      ]
      const { report } = simulateWeek(stateFor(S1, 'expert', { seed, latent }, { incidentLikelihood: 100 }), S1, 6)
      for (const c of report.consequences) expect(c.hazardId).toBe('eligible')
    }
  })

  it('a clean site has a safe week: +40 × difficulty, no cost, no lost time', () => {
    for (const d of DIFFS) {
      const state = stateFor(S1, d)
      const { game, meters, report } = simulateWeek(state, S1, 4)
      expect(report).toMatchObject({ week: 2, afterPhase: 4, consequences: [], notice: null, shutdown: false, safe: true })
      expect(report.points).toBe(Math.round(40 * DIFFICULTIES[d].pointsMultiplier))
      expect(game.points).toBe(report.points)
      expect(game.lastAward?.label).toBe('Safe week')
      expect(game.safeWeeks).toBe(1)
      expect(game.budget).toBe(state.game.budget)
      expect(game.floatDays).toBe(state.game.floatDays)
      expect(game.pendingWeek).toEqual(report)
      expect(meters).toEqual(state.scores.meters)
    }
  })

  it('books every consequence and notice against budget, float and points exactly once', () => {
    for (let seed = 1; seed <= 150; seed++) {
      for (const d of DIFFS) {
        const state = stateFor(S3, d, { seed, latent: manyHazards(6), strikes: seed % 4 }, { incidentLikelihood: 90, enforcementRisk: 60 + (seed % 40) })
        const { game, report } = simulateWeek(state, S3, 9)
        const events: (ConsequenceRecord | NoticeRecord)[] = [...report.consequences, ...(report.notice ? [report.notice] : [])]
        const cost = events.reduce((a, e) => a + e.cost, 0)
        const days = events.reduce((a, e) => a + e.days, 0)
        const pts = events.reduce((a, e) => a + e.points, 0) + (report.safe ? Math.round(40 * DIFFICULTIES[d].pointsMultiplier) : 0)
        expect(game.budget).toBe(state.game.budget - cost)
        expect(game.floatDays).toBe(state.game.floatDays - days)
        expect(report.points).toBe(pts)
        expect(game.points).toBe(state.game.points + pts)
        expect(report.safe).toBe(events.length === 0)
        expect(game.safeWeeks).toBe(report.safe ? 1 : 0)
        expect(game.consequences).toHaveLength(report.consequences.length)
        expect(game.notices).toHaveLength(report.notice ? 1 : 0)
        for (const e of events) {
          expect(e.cost).toBeGreaterThan(0)
          expect(e.days).toBeGreaterThan(0)
          expect(e.points).toBeLessThan(0)
        }
      }
    }
  })

  it('prices incidents as documented on the reference job: minor £4k / 1.5 d, major £15k / 4 d', () => {
    const seen = { minor: false, major: false }
    for (let seed = 1; seed <= 400 && !(seen.minor && seen.major); seed++) {
      const latent = [hazard({ id: 'maj', severity: 'major' }), hazard({ id: 'min', severity: 'minor' })]
      const { report } = simulateWeek(stateFor(S1, 'standard', { seed, latent }, { incidentLikelihood: 100 }), S1, 5)
      for (const c of report.consequences) {
        if (c.severity === 'major') {
          expect(c).toMatchObject({ cost: 15000, days: 4, points: -500 })
          expect(c.title).toMatch(/^Serious incident/)
          seen.major = true
        } else {
          // −150 × 1.25 = −187.5; Math.round rounds halves towards +∞, i.e. in the delegate's favour.
          expect(c).toMatchObject({ cost: 4000, days: 1.5, points: -187, riddor: false, title: 'Site problem' })
          seen.minor = true
        }
        expect(c.rootCause).toContain('Phase 2')
        expect(c.rootCause).toContain('Carried on regardless')
      }
    }
    expect(seen).toEqual({ minor: true, major: true })
  })

  /** Force one specific major hazard to fire and return its consequence record. */
  const fire = (consequence: string): ConsequenceRecord => {
    for (let seed = 1; seed <= 500; seed++) {
      const state = stateFor(S1, 'expert', { seed, latent: [hazard({ consequence })] }, { incidentLikelihood: 100 })
      const { report } = simulateWeek(state, S1, 6)
      if (report.consequences.length) return report.consequences[0]
    }
    throw new Error('hazard never fired')
  }

  // Characterisation of today's keyword matching. When eng-tests-5 is fixed by authoring an explicit
  // RIDDOR flag on the option, drive this test from that flag instead of from the narrative wording.
  it('flags a major incident with an injury or dangerous occurrence as RIDDOR reportable', () => {
    expect(fire('A decker fell through an open bay, fracturing his pelvis.')).toMatchObject({ riddor: true, title: 'Serious incident: RIDDOR reportable' })
    expect(fire('It was reported to HSE as a dangerous occurrence.').riddor).toBe(true)
    expect(fire('The Environment Agency prosecuted the company for a pollution offence.')).toMatchObject({ riddor: false, title: 'Serious incident' })
  })

  knownBug('BUG eng-tests-5: a waste-paperwork offence is not labelled RIDDOR because the story contains the word "crushed"', () => {
    // Verbatim consequence of the unsafe answer to s2-city-refurb p11-d1 (hazardous waste in a mixed skip).
    const p11 = S2.phases.flatMap((p) => p.steps).find((s) => s.id === 'p11-d1')
    const unsafe = p11?.type === 'decision' ? p11.options.find((o) => o.quality === 'unsafe') : undefined
    expect(unsafe?.consequence).toContain('crushed tubes')
    expect(fire(unsafe!.consequence!).riddor).toBe(false)
  })

  knownBug('BUG eng-tests-5: an incident that explicitly says nobody was hurt is not labelled RIDDOR reportable', () => {
    expect(fire('A pallet slid off the forks. Nobody was injured and the area was cleared.').riddor).toBe(false)
  })

  describe('HSE enforcement', () => {
    it('no inspection below 70 enforcement risk and fewer than 3 strikes', () => {
      for (const d of DIFFS) {
        const { report } = simulateWeek(stateFor(S1, d, { strikes: 2 }, { enforcementRisk: 69 }), S1, 5)
        expect(report.notice).toBeNull()
      }
    })

    it('70–87 enforcement risk earns an Improvement Notice: £3k, 2 days, risk drops by 20', () => {
      const state = stateFor(S1, 'standard', {}, { enforcementRisk: 70, clientConfidence: 70 })
      const { report, meters, game } = simulateWeek(state, S1, 5)
      expect(report.notice).toMatchObject({ kind: 'improvement', week: 4, cost: 3000, days: 2, points: -312 })
      expect(meters.enforcementRisk).toBe(50)
      expect(meters.clientConfidence).toBe(64)
      expect(report.safe).toBe(false)
      expect(report.shutdown).toBe(false)
      expect(game.notices).toHaveLength(1)
      expect(game.budget).toBe(53000)
      expect(game.floatDays).toBe(8)
    })

    it('88+ enforcement risk earns a Prohibition Notice: £12k, 6 days, risk reset to 50', () => {
      const state = stateFor(S1, 'learner', {}, { enforcementRisk: 88, clientConfidence: 70 })
      const { report, meters } = simulateWeek(state, S1, 5)
      expect(report.notice).toMatchObject({ kind: 'prohibition', cost: 12000, days: 6, points: -700 })
      expect(meters.enforcementRisk).toBe(50)
      expect(meters.clientConfidence).toBe(55)
    })

    it('three strikes earn a Prohibition Notice even on a quiet site, and the strikes reset', () => {
      const state = stateFor(S1, 'learner', { strikes: 3 }, { enforcementRisk: 15 })
      const { report, game } = simulateWeek(state, S1, 5)
      expect(report.notice?.kind).toBe('prohibition')
      expect(game.strikes).toBe(0)
    })

    it('notice costs scale with project value', () => {
      const { report } = simulateWeek(stateFor(S2, 'learner', { weeksTotal: 34 }, { enforcementRisk: 95 }), S2, 5)
      expect(report.notice?.cost).toBe(32600)
    })

    it('a notice cites the delegate\'s own critical failures, and only those new since the last notice', () => {
      const first = stateFor(S1, 'learner', { strikes: 3 }, {}, { criticalFailures: ['No F10 notification', 'No CPP before start', 'Untrained scaffolder'] })
      const r1 = simulateWeek(first, S1, 5)
      expect(r1.report.notice?.reason).toContain('No F10 notification')
      expect(r1.game.noticeMark).toBe(3)
      const second = stateFor(S1, 'learner', { ...r1.game, pendingWeek: null, strikes: 3 }, {}, { criticalFailures: [...first.criticalFailures, 'Lift with no lift plan'] })
      const r2 = simulateWeek(second, S1, 9)
      expect(r2.report.notice?.reason).toContain('Lift with no lift plan')
      expect(r2.report.notice?.reason).not.toContain('No F10 notification')
    })

    it('a notice reason is always a complete sentence, even with nothing specific to cite', () => {
      const { report } = simulateWeek(stateFor(S1, 'learner', {}, { enforcementRisk: 75 }), S1, 5)
      expect(report.notice?.reason).toMatch(/Findings: .+\.$/)
      expect(report.notice?.reason).not.toMatch(/undefined|NaN/)
    })

    knownBug('BUG eng-tests-12: HSE does not serve a second notice the very next site week (documented cool-down)', () => {
      // docs/GAME-DESIGN.md: "HSE inspects ... (and there was no notice the previous week)".
      const s0 = stateFor(S1, 'learner', {}, { enforcementRisk: 100 })
      const w1 = simulateWeek(s0, S1, 4)
      expect(w1.report.notice).not.toBeNull()
      const s1 = stateFor(S1, 'learner', { ...w1.game, pendingWeek: null }, { ...w1.meters, enforcementRisk: 100 })
      const w2 = simulateWeek(s1, S1, 5)
      expect(w2.report.notice).toBeNull()
    })
  })

  describe('shutdown rules per difficulty', () => {
    const prohibition = (week: number): NoticeRecord => ({ kind: 'prohibition', week, reason: 'earlier', cost: 12000, days: 6, points: -700 })
    const improvement = (week: number): NoticeRecord => ({ kind: 'improvement', week, reason: 'earlier', cost: 3000, days: 2, points: -250 })
    /** Simulate a week (phase 13, well clear of earlier notices) in which a new prohibition is served. */
    const afterProhibition = (difficulty: Difficulty, earlier: NoticeRecord[]) =>
      simulateWeek(stateFor(S1, difficulty, { notices: earlier }, { enforcementRisk: 95 }), S1, 13)

    it('documented thresholds: Learning never, Standard 2, Expert 1', () => {
      expect(DIFFS.map((d) => DIFFICULTIES[d].shutdownAfterProhibitions)).toEqual([null, 2, 1])
    })

    it('Learning: HSE can serve any number of prohibitions but never shuts the project down', () => {
      for (const n of [0, 1, 2, 5]) {
        const { report, game } = afterProhibition('learner', Array.from({ length: n }, (_, i) => prohibition(i + 1)))
        expect(report.notice?.kind).toBe('prohibition')
        expect(report.shutdown).toBe(false)
        expect(game.shutdown).toBe(false)
      }
    })

    it('Standard: the first prohibition is survivable, the second shuts the project down', () => {
      expect(afterProhibition('standard', []).report.shutdown).toBe(false)
      const second = afterProhibition('standard', [prohibition(2)])
      expect(second.report.shutdown).toBe(true)
      expect(second.game.shutdown).toBe(true)
    })

    it('Expert: one prohibition and the project is shut down', () => {
      const { report, game } = afterProhibition('expert', [])
      expect(report.notice?.kind).toBe('prohibition')
      expect(report.shutdown).toBe(true)
      expect(game.shutdown).toBe(true)
    })

    it('Improvement Notices never count towards a shutdown', () => {
      for (const d of DIFFS) {
        const state = stateFor(S1, d, { notices: [improvement(1), improvement(3), improvement(5)] }, { enforcementRisk: 75 })
        const { report } = simulateWeek(state, S1, 13)
        expect(report.notice?.kind).toBe('improvement')
        expect(report.shutdown).toBe(false)
      }
    })

    it('a week without a new prohibition does not shut down a project below its threshold', () => {
      const { report } = simulateWeek(stateFor(S1, 'standard', { notices: [prohibition(2)] }), S1, 13)
      expect(report.notice).toBeNull()
      expect(report.shutdown).toBe(false)
    })
  })

  it('keeps every meter inside 0..100 under sustained bad weeks', () => {
    for (let seed = 1; seed <= 50; seed++) {
      let state = stateFor(S1, 'learner', { seed, latent: manyHazards(30) }, { incidentLikelihood: 99, enforcementRisk: 97, morale: 3, clientConfidence: 2 })
      for (const phase of WEEK_PHASES) {
        const { game, meters } = simulateWeek(state, S1, phase)
        for (const v of Object.values(meters)) {
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(100)
        }
        state = { ...state, game: { ...game, pendingWeek: null }, scores: { ...state.scores, meters } }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

describe('completionBonuses', () => {
  const clean = (d: Difficulty, over: Parameters<typeof stateFor>[2] = {}, extra: Partial<GameState> = {}) =>
    stateFor(S1, d, { budgetStart: 56000, budget: 56000, floatStart: 10, floatDays: 10, ...over }, {}, extra)
  const total = (s: GameState) => completionBonuses(s).reduce((a, b) => a + b.points, 0)

  it('a clean project earns all five bonuses: 700 + 650 + 500 + 300 + 400 at ×1', () => {
    const lines = completionBonuses(clean('learner'))
    expect(lines.map((l) => l.points)).toEqual([700, 650, 500, 300, 400])
    expect(lines[0].label).toContain('within budget')
    expect(lines[1].label).toContain('on programme')
    expect(lines[2].label).toBe('No RIDDOR-reportable incidents')
    expect(lines[3].label).toBe('No HSE enforcement notices')
    expect(lines[4].label).toBe('No critical safety failures')
  })

  it('every line is multiplied by the difficulty', () => {
    expect(completionBonuses(clean('standard')).map((l) => l.points)).toEqual([875, 813, 625, 375, 500])
    expect(completionBonuses(clean('expert')).map((l) => l.points)).toEqual([1120, 1040, 800, 480, 640])
  })

  it('budget bonus: +400 at exactly £0 left, rising to +700 with the whole contingency left; −200 once overspent', () => {
    expect(completionBonuses(clean('learner', { budget: 0 }))[0].points).toBe(400)
    expect(completionBonuses(clean('learner', { budget: 28000 }))[0].points).toBe(550)
    expect(completionBonuses(clean('learner', { budget: 56000 }))[0].points).toBe(700)
    const over = completionBonuses(clean('learner', { budget: -100 }))[0]
    expect(over.points).toBe(-200)
    expect(over.label).toContain('Over budget by £100')
  })

  it('programme bonus: +400 on the day, +25 per spare day; −200 when late', () => {
    expect(completionBonuses(clean('learner', { floatDays: 0 }))[1].points).toBe(400)
    expect(completionBonuses(clean('learner', { floatDays: 4 }))[1].points).toBe(500)
    expect(completionBonuses(clean('learner', { floatDays: 0.5 }))[1].points).toBe(413)
    const late = completionBonuses(clean('learner', { floatDays: -2.5 }))[1]
    expect(late.points).toBe(-200)
    expect(late.label).toBe('Handed over 2.5 days late')
  })

  it('RIDDOR, notices and critical failures each forfeit their own bonus only', () => {
    const riddor = clean('learner', { consequences: [{ hazardId: 'h', week: 3, severity: 'major', title: 't', narrative: 'n', rootCause: 'r', cost: 1, days: 1, riddor: true, points: -1 }] })
    expect(completionBonuses(riddor).map((l) => l.label)).not.toContain('No RIDDOR-reportable incidents')
    expect(total(riddor)).toBe(700 + 650 + 300 + 400)

    const nonRiddor = clean('learner', { consequences: [{ hazardId: 'h', week: 3, severity: 'minor', title: 't', narrative: 'n', rootCause: 'r', cost: 1, days: 1, riddor: false, points: -1 }] })
    expect(total(nonRiddor)).toBe(700 + 650 + 500 + 300 + 400)

    const noticed = clean('learner', { notices: [{ kind: 'improvement', week: 4, reason: 'r', cost: 1, days: 1, points: -1 }] })
    expect(total(noticed)).toBe(700 + 650 + 500 + 400)

    const critical = clean('learner', {}, { criticalFailures: ['No lift plan'] })
    expect(total(critical)).toBe(700 + 650 + 500 + 300)
  })

  it('−50 for every open risk handed to the client; fired and rectified risks do not count', () => {
    const s = clean('standard', {
      latent: [hazard({ id: 'a' }), hazard({ id: 'b' }), hazard({ id: 'c', status: 'rectified' }), hazard({ id: 'd', status: 'fired' })],
    })
    const line = completionBonuses(s).at(-1)!
    expect(line.label).toBe('2 uncorrected risk(s) handed over to the client')
    expect(line.points).toBe(-125)
  })

  it('a shutdown replaces everything with a single −1,500 × difficulty line', () => {
    expect(completionBonuses(clean('standard', { shutdown: true }))).toEqual([{ label: 'Project shut down by HSE prohibition', points: -1875 }])
    expect(completionBonuses(clean('expert', { shutdown: true }))).toEqual([{ label: 'Project shut down by HSE prohibition', points: -2400 }])
  })

  it('never produces NaN, even for a state that was never given a budget', () => {
    for (const l of completionBonuses(stateFor(S1, 'standard', { budgetStart: 0, budget: 0, floatStart: 0, floatDays: 0 }))) {
      expect(Number.isFinite(l.points)).toBe(true)
    }
  })
})

describe('outcomeSummary', () => {
  it('summarises incidents, notices, open risks and the confidence calibration table', () => {
    const s = stateFor(S1, 'standard', {
      points: 1234,
      budget: -1,
      floatDays: 0,
      consequences: [
        { hazardId: 'a', week: 2, severity: 'major', title: 't', narrative: 'n', rootCause: 'r', cost: 1, days: 1, riddor: true, points: -1 },
        { hazardId: 'b', week: 4, severity: 'minor', title: 't', narrative: 'n', rootCause: 'r', cost: 1, days: 1, riddor: false, points: -1 },
      ],
      notices: [
        { kind: 'improvement', week: 4, reason: 'r', cost: 1, days: 1, points: -1 },
        { kind: 'prohibition', week: 8, reason: 'r', cost: 1, days: 1, points: -1 },
      ],
      latent: [hazard({ id: 'o' }), hazard({ id: 'r', status: 'rectified' }), hazard({ id: 'f', status: 'fired' })],
      confidence: [
        { stepId: '1', confidence: 'sure', quality: 'best' },
        { stepId: '2', confidence: 'sure', quality: 'unsafe' },
        { stepId: '3', confidence: 'sure', quality: 'poor' },
        { stepId: '4', confidence: 'sure', quality: 'partial' },
        { stepId: '5', confidence: 'think', quality: 'best' },
        { stepId: '6', confidence: 'guess', quality: 'poor' },
      ],
    })
    expect(outcomeSummary(s)).toEqual({
      points: 1234,
      onBudget: false,
      onProgramme: true,
      incidents: 2,
      majorIncidents: 1,
      riddor: 1,
      notices: 2,
      prohibitions: 1,
      openRisks: 1,
      rectified: 1,
      calibration: { sure: { n: 4, best: 1 }, think: { n: 1, best: 1 }, guess: { n: 1, best: 0 } },
      confidentlyWrong: 2,
    })
  })
})

// ---------------------------------------------------------------------------
// Ranks
// ---------------------------------------------------------------------------

describe('rankFor', () => {
  it('the rank table is ascending and starts at zero', () => {
    expect(RANKS[0].min).toBe(0)
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i].min).toBeGreaterThan(RANKS[i - 1].min)
    expect(new Set(RANKS.map((r) => r.title)).size).toBe(RANKS.length)
  })

  it('promotes exactly on each boundary and not one XP earlier', () => {
    RANKS.forEach((rank, i) => {
      expect(rankFor(rank.min).rank).toBe(rank)
      expect(rankFor(rank.min).progress).toBe(i === RANKS.length - 1 ? 1 : 0)
      if (i > 0) {
        const below = rankFor(rank.min - 1)
        expect(below.rank).toBe(RANKS[i - 1])
        expect(below.next).toBe(rank)
        expect(below.progress).toBeLessThan(1)
        expect(below.progress).toBeGreaterThan(0.99)
      }
    })
  })

  it.each([
    [0, 'Site Operative', 'Supervisor', 0],
    [750, 'Site Operative', 'Supervisor', 0.5],
    [1499, 'Site Operative', 'Supervisor', 1499 / 1500],
    [1500, 'Supervisor', 'Assistant Site Manager', 0],
    [7500, 'Assistant Site Manager', 'Site Manager', 0.5],
    [54999, 'Contracts Manager', 'Construction Director', 14999 / 15000],
  ])('%i XP -> %s (next: %s)', (xp, title, next, progress) => {
    const r = rankFor(xp)
    expect(r.rank.title).toBe(title)
    expect(r.next?.title).toBe(next)
    expect(r.progress).toBeCloseTo(progress, 10)
  })

  it('tops out at Construction Director with a full bar', () => {
    for (const xp of [55000, 55001, 10 ** 9]) {
      expect(rankFor(xp)).toEqual({ rank: RANKS[RANKS.length - 1], next: null, progress: 1 })
    }
  })

  it('never goes below the first rank or outside a 0..1 bar', () => {
    for (const xp of [-1, -50000]) {
      const r = rankFor(xp)
      expect(r.rank).toBe(RANKS[0])
      expect(r.progress).toBe(0)
    }
  })
})
