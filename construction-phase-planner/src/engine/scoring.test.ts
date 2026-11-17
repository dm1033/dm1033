import { describe, expect, it } from 'vitest'
import {
  CATEGORY_WEIGHT_FLOOR, ENVIRONMENTAL_SITE_ITEMS, TW_FIELD_KEYS, applyDecision, applyHazardHunt, applyPermits,
  applySequence, applySiteSetup, applyTwRegister, assessHunt, assessPermits, assessPlacements, assessSequence,
  categoryScore, categoryWeights, decisionPossible, gradeFor, initialMeters, initialScoreState, initialSequenceOrder,
  overallScore, twItemScore, zeroScores, zoneAt,
} from './scoring'
import { GRADE_BANDS, METER_KEYS, SCORE_KEYS } from '../types'
import type { DecisionOption, DecisionStep, Scenario, ScoreKey, ScoreState, SiteSetupStep, TwAnswerRecord } from '../types'
import { SCENARIOS } from '../data'
import {
  allDecisions, decisionStep, huntFixture, huntSteps, option, permitFixture, permitSteps, sequenceFixture,
  sequenceSteps, setupFixture, setupSteps, twItemFixture, twSteps,
} from '../test/fixtures'
import { blockedCells, deepFreeze, layoutFor, perfectHunt, perfectSequence, perfectTw } from '../test/playthrough'

const fresh = (): ScoreState => deepFreeze(initialScoreState())
const withScores = (earned: Partial<Record<ScoreKey, number>>, possible: Partial<Record<ScoreKey, number>>): ScoreState => ({
  earned: { ...zeroScores(), ...earned },
  possible: { ...zeroScores(), ...possible },
  meters: initialMeters(),
})

describe('initial score state', () => {
  it('starts every category at 0/0 and the meters at their baselines', () => {
    const s = initialScoreState()
    expect(Object.keys(s.earned).sort()).toEqual([...SCORE_KEYS].sort())
    expect(Object.values(s.earned).every((v) => v === 0)).toBe(true)
    expect(Object.values(s.possible).every((v) => v === 0)).toBe(true)
    expect(s.meters).toEqual({ clientConfidence: 70, morale: 70, enforcementRisk: 15, incidentLikelihood: 15, cost: 30 })
    expect(Object.keys(s.meters).sort()).toEqual([...METER_KEYS].sort())
  })
  it('hands out a new object every time (no shared mutable state between games)', () => {
    expect(initialScoreState()).not.toBe(initialScoreState())
    expect(initialScoreState().meters).not.toBe(initialScoreState().meters)
  })
})

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

describe('decisionPossible / applyDecision', () => {
  const step = decisionStep()
  const [best, partial, poor, unsafe] = step.options

  it('possible marks are the model answer\'s marks in each category', () => {
    expect(decisionPossible(step)).toEqual({ ...zeroScores(), safety: 10, legal: 5, programme: 2 })
  })

  it('adds the chosen option\'s marks and the question\'s maximum, without touching the input', () => {
    const before = fresh()
    const after = applyDecision(before, step, partial)
    expect(after.earned).toMatchObject({ safety: 5, legal: 2 })
    expect(after.possible).toMatchObject({ safety: 10, legal: 5, programme: 2 })
    expect(before.earned.safety).toBe(0)
  })

  it('moves meters by the option\'s deltas and clamps them to 0..100', () => {
    expect(applyDecision(fresh(), step, best).meters.morale).toBe(73)
    expect(applyDecision(fresh(), step, poor).meters.incidentLikelihood).toBe(20)
    let s = fresh()
    for (let i = 0; i < 20; i++) s = applyDecision(s, step, unsafe)
    expect(s.meters.enforcementRisk).toBe(100)
    const calm = decisionStep({ options: [option('best', { impact: { incidentLikelihood: -50 } })] })
    expect(applyDecision(fresh(), calm, calm.options[0]).meters.incidentLikelihood).toBe(0)
  })

  it('negative marks reduce the category but the percentage never drops below zero', () => {
    const s = applyDecision(fresh(), step, unsafe)
    expect(s.earned.safety).toBe(-5)
    expect(categoryScore(s, 'safety')).toBe(0)
  })

  it('never awards more than the question maximum', () => {
    for (const scenario of SCENARIOS) {
      for (const d of allDecisions(scenario)) {
        for (const o of d.options) {
          const s = applyDecision(fresh(), d, o)
          for (const k of SCORE_KEYS) expect(s.earned[k]).toBeLessThanOrEqual(s.possible[k])
        }
      }
    }
  })

  it('in every authored decision the best answer is at least as good as any other on Legal and Safety', () => {
    for (const scenario of SCENARIOS) {
      for (const d of allDecisions(scenario)) {
        const best2 = d.options.find((o) => o.quality === 'best')!
        const poss = decisionPossible(d)
        for (const k of ['legal', 'safety'] as ScoreKey[]) {
          expect(best2.impact[k] ?? 0, `${scenario.id} ${d.id} ${k}`).toBe(poss[k])
        }
      }
    }
  })

  it('the best answer earns every mark the question makes available (eng-tests-3)', () => {
    // Otherwise the model answer cannot reach 100% and "cutting corners" out-scores it on Programme.
    const short: string[] = []
    for (const scenario of SCENARIOS) {
      for (const d of allDecisions(scenario)) {
        const s = applyDecision(fresh(), d, d.options.find((o) => o.quality === 'best')!)
        for (const k of SCORE_KEYS) {
          if (s.earned[k] !== s.possible[k]) short.push(`${scenario.id} ${d.id} ${k}: best earns ${s.earned[k]} of ${s.possible[k]}`)
        }
      }
    }
    expect(short).toEqual([])
  })

  describe('the marks available are the model answer\'s marks, never a distractor\'s', () => {
    // The shape that used to cap a perfect delegate at 50-69% for Programme Management: doing it
    // properly costs time (programme -2) while the unsafe shortcut "saves" three days.
    const pressured = decisionStep({
      options: [
        option('best', { impact: { safety: 10, temporaryWorks: 10, programme: -2 } }),
        option('partial', { impact: { safety: 4, programme: -1 } }),
        option('poor', { impact: { safety: 12, quality: 3, programme: 1 } }),
        option('unsafe', { impact: { safety: -6, programme: 3 } }),
      ],
    })
    const [pBest, pPartial, pPoor, pUnsafe] = pressured.options

    it('a shortcut with a higher mark does not raise the maximum', () => {
      expect(decisionPossible(pressured)).toEqual({ ...zeroScores(), safety: 10, temporaryWorks: 10 })
    })

    it('the best answer never loses competence marks for the time it costs', () => {
      const s = applyDecision(fresh(), pressured, pBest)
      expect(s.earned).toEqual({ ...zeroScores(), safety: 10, temporaryWorks: 10 })
      expect(s.possible).toEqual(s.earned)
      for (const k of SCORE_KEYS) expect([null, 100]).toContain(categoryScore(s, k))
      expect(overallScore(s)).toBe(100)
    })

    it('a distractor cannot earn marks the model answer does not carry, and is capped at the model answer\'s mark', () => {
      const poor = applyDecision(fresh(), pressured, pPoor)
      expect(poor.earned).toMatchObject({ safety: 10, quality: 0, programme: 0 })
      const unsafe = applyDecision(fresh(), pressured, pUnsafe)
      expect(unsafe.earned).toMatchObject({ safety: -6, programme: 0 })
      expect(unsafe.possible.programme).toBe(0)
    })

    it('an answer other than the best keeps its own negative marks', () => {
      expect(applyDecision(fresh(), pressured, pPartial).earned).toMatchObject({ safety: 4, programme: -1 })
    })

    it('no option out-scores the best answer in any category, in any authored decision', () => {
      for (const scenario of SCENARIOS) {
        for (const d of allDecisions(scenario)) {
          const top = applyDecision(fresh(), d, d.options.find((o) => o.quality === 'best')!)
          for (const o of d.options) {
            const s = applyDecision(fresh(), d, o)
            for (const k of SCORE_KEYS) expect(s.earned[k], `${scenario.id} ${d.id} ${o.id} ${k}`).toBeLessThanOrEqual(top.earned[k])
          }
        }
      }
    })

    it('with two best options the higher mark is available and either earns it in full', () => {
      const twin = decisionStep({ options: [option('best', { id: 'a', impact: { legal: 6 } }), option('best', { id: 'b', impact: { legal: 8, quality: 2 } }), option('poor')] })
      expect(decisionPossible(twin)).toMatchObject({ legal: 8, quality: 2 })
      for (const o of twin.options.slice(0, 2)) expect(applyDecision(fresh(), twin, o).earned).toMatchObject({ legal: 8, quality: 2 })
    })

    it('a step with no best option (never authored) falls back to the highest mark on offer', () => {
      const none = decisionStep({ options: [option('partial', { impact: { safety: 4 } }), option('poor', { impact: { safety: 1, legal: 2 } })] })
      expect(decisionPossible(none)).toMatchObject({ safety: 4, legal: 2 })
      expect(applyDecision(fresh(), none, none.options[1]).earned).toMatchObject({ safety: 1, legal: 2 })
    })
  })
})

// ---------------------------------------------------------------------------
// Site set-up
// ---------------------------------------------------------------------------

describe('zoneAt / assessPlacements / applySiteSetup', () => {
  it('zoneAt returns every zone covering a cell (inclusive edges), or none', () => {
    expect(zoneAt(setupFixture, 0, 0)).toEqual(['road'])
    expect(zoneAt(setupFixture, 2, 2)).toEqual(['compound'])
    expect(zoneAt(setupFixture, 3, 1)).toEqual(['works'])
    expect(zoneAt(setupFixture, 5, 3)).toEqual(['footpath'])
    expect(zoneAt(setupFixture, 9, 9)).toEqual([])
    const overlapping = { ...setupFixture, zones: [...setupFixture.zones, { id: 'crane', label: 'Crane radius', x1: 2, y1: 2, x2: 3, y2: 2, color: 'x' }] }
    expect(zoneAt(overlapping, 2, 2)).toEqual(['compound', 'crane'])
  })

  it('rates each rule good / neutral / unsafe / missing', () => {
    const rate = (placements: { itemId: string; x: number; y: number }[]) =>
      Object.fromEntries(assessPlacements(setupFixture, placements).map((a) => [a.itemId, a.status]))
    expect(rate([{ itemId: 'welfare', x: 0, y: 1 }, { itemId: 'fuel-store', x: 4, y: 1 }])).toEqual({ welfare: 'good', 'fuel-store': 'good' })
    expect(rate([{ itemId: 'welfare', x: 4, y: 1 }, { itemId: 'fuel-store', x: 0, y: 1 }])).toEqual({ welfare: 'unsafe', 'fuel-store': 'neutral' })
    expect(rate([])).toEqual({ welfare: 'missing', 'fuel-store': 'missing' })
    // Optional items are only reported when placed.
    expect(rate([{ itemId: 'lighting', x: 0, y: 3 }])).toEqual({ welfare: 'missing', 'fuel-store': 'missing', lighting: 'unsafe' })
  })

  it('an unsafe zone wins when a cell is in both a good and a bad zone', () => {
    const step = { ...setupFixture, zones: [...setupFixture.zones, { id: 'crane', label: 'Crane radius', x1: 0, y1: 1, x2: 0, y2: 1, color: 'x' }] }
    step.rules = [{ ...setupFixture.rules[0], badZones: ['crane'] }]
    expect(assessPlacements(step, [{ itemId: 'welfare', x: 0, y: 1 }])[0].status).toBe('unsafe')
  })

  it('reports whether each item is required and where it should go, by zone label', () => {
    const a = assessPlacements(setupFixture, [{ itemId: 'lighting', x: 0, y: 1 }])
    expect(a.find((x) => x.itemId === 'welfare')).toEqual({
      itemId: 'welfare', status: 'missing', note: 'Welfare belongs in the compound.', required: true, idealZones: ['Compound'],
    })
    expect(a.find((x) => x.itemId === 'lighting')).toMatchObject({ status: 'good', required: false, idealZones: ['Compound'] })
    expect(a.find((x) => x.itemId === 'fuel-store')).toMatchObject({ required: true, idealZones: ['Works area'] })
  })

  it('required items earn 10 planning + 5 safety each; 60% for neutral; −5 safety for unsafe', () => {
    const good = applySiteSetup(fresh(), setupFixture, [{ itemId: 'welfare', x: 0, y: 1 }, { itemId: 'fuel-store', x: 4, y: 1 }]).scores
    expect(good.possible).toMatchObject({ planning: 20, safety: 10 })
    expect(good.earned).toMatchObject({ planning: 20, safety: 10 })
    expect(good.meters.incidentLikelihood).toBe(15)

    const mixed = applySiteSetup(fresh(), setupFixture, [{ itemId: 'welfare', x: 4, y: 1 }, { itemId: 'fuel-store', x: 0, y: 1 }]).scores
    expect(mixed.earned).toMatchObject({ planning: 6, safety: -2 })
    expect(mixed.meters.incidentLikelihood).toBe(20)

    const empty = applySiteSetup(fresh(), setupFixture, []).scores
    expect(empty.earned).toMatchObject({ planning: 0, safety: 0 })
    expect(empty.possible).toMatchObject({ planning: 20, safety: 10 })
    expect(empty.meters.incidentLikelihood).toBe(21)
  })

  for (const scenario of SCENARIOS) {
    for (const step of setupSteps(scenario)) {
      it(`${scenario.id} ${step.id}: the site plan is well-formed and a 100% layout exists within the UI's rules`, () => {
        for (const z of step.zones) {
          expect(z.x1).toBeLessThanOrEqual(z.x2)
          expect(z.y1).toBeLessThanOrEqual(z.y2)
          expect(z.x1).toBeGreaterThanOrEqual(0)
          expect(z.y1).toBeGreaterThanOrEqual(0)
          expect(z.x2).toBeLessThan(step.grid.cols)
          expect(z.y2).toBeLessThan(step.grid.rows)
        }
        const zoneIds = new Set(step.zones.map((z) => z.id))
        for (const r of step.rules) {
          for (const z of [...r.goodZones, ...r.badZones]) expect(zoneIds.has(z), `${r.itemId} -> ${z}`).toBe(true)
          expect(r.goodZones.filter((z) => r.badZones.includes(z))).toEqual([])
        }
        expect(new Set(step.rules.map((r) => r.itemId)).size).toBe(step.rules.length)

        // One item per cell, nothing in a blocked cell (what SitePlanner allows).
        const layout = layoutFor(step, 'good')
        expect(layout, 'no layout places every item in a good zone').not.toBeNull()
        const cells = layout!.map((p) => `${p.x},${p.y}`)
        expect(new Set(cells).size).toBe(cells.length)
        const blocked = blockedCells(step)
        for (const c of cells) expect(blocked.has(c)).toBe(false)
        const assessed = assessPlacements(step, layout!)
        expect(assessed.every((a) => a.status === 'good')).toBe(true)
        const { scores } = applySiteSetup(fresh(), step, layout!)
        expect(scores.earned.planning).toBe(scores.possible.planning)
        expect(scores.earned.safety).toBe(scores.possible.safety)
        expect(scores.earned.environment).toBe(scores.possible.environment)
        expect(scores.meters).toEqual(initialMeters())
      })

      it(`${scenario.id} ${step.id}: the required environmental controls carry Environmental Control marks`, () => {
        const envRequired = step.rules.filter((r) => r.required && ENVIRONMENTAL_SITE_ITEMS.has(r.itemId))
        expect(envRequired.length).toBeGreaterThan(0)
        expect(applySiteSetup(fresh(), step, []).scores.possible.environment).toBe(envRequired.length * 5)
      })
    }
  }

  describe('optional items (eng-tests-4)', () => {
    const required = [{ itemId: 'welfare', x: 0, y: 1 }, { itemId: 'fuel-store', x: 4, y: 1 }]
    const clean = applySiteSetup(fresh(), setupFixture, required)

    it('an optional item put somewhere its own rule calls unsafe costs 5 safety marks and raises incident likelihood', () => {
      // The fixture's optional lighting tower is placed on the public footpath (a badZone).
      const careless = applySiteSetup(fresh(), setupFixture, [...required, { itemId: 'lighting', x: 0, y: 3 }])
      expect(careless.assessments.find((a) => a.itemId === 'lighting')?.status).toBe('unsafe')
      expect(careless.scores.earned.safety).toBe(clean.scores.earned.safety - 5)
      expect(careless.scores.earned.planning).toBe(clean.scores.earned.planning)
      expect(careless.scores.possible).toEqual(clean.scores.possible)
      expect(careless.scores.meters.incidentLikelihood).toBe(clean.scores.meters.incidentLikelihood + 5)
    })

    it('an optional item placed well, acceptably or not at all changes nothing', () => {
      for (const extra of [[], [{ itemId: 'lighting', x: 0, y: 2 }], [{ itemId: 'lighting', x: 3, y: 1 }]]) {
        expect(applySiteSetup(fresh(), setupFixture, [...required, ...extra]).scores).toEqual(clean.scores)
      }
    })

    for (const scenario of SCENARIOS) {
      for (const step of setupSteps(scenario)) {
        it(`${scenario.id} ${step.id}: every optional item with an unsafe zone costs marks when it is put there`, () => {
          const good = layoutFor(step, 'good', true)!
          const taken = new Set(good.map((p) => `${p.x},${p.y}`))
          const base = applySiteSetup(fresh(), step, good).scores
          const optional = step.rules.filter((r) => !r.required && r.badZones.length > 0)
          for (const rule of optional) {
            const bad = layoutFor({ ...step, rules: [rule] }, 'unsafe')?.find((p) => !taken.has(`${p.x},${p.y}`))
            if (!bad) continue
            const s = applySiteSetup(fresh(), step, [...good, bad]).scores
            expect(s.earned.safety, rule.itemId).toBe(base.earned.safety - 5)
            expect(s.meters.incidentLikelihood, rule.itemId).toBe(base.meters.incidentLikelihood + 5)
          }
        })
      }
    }
  })

  describe('environmental controls on the site plan', () => {
    // fuel-storage, spill-kit and drain-protection are environmental controls; welfare is not.
    const envStep: SiteSetupStep = {
      ...setupFixture,
      rules: [
        { itemId: 'welfare', required: true, goodZones: ['compound'], badZones: ['works'], placementNote: 'n' },
        { itemId: 'fuel-storage', required: true, goodZones: ['works'], badZones: ['footpath'], placementNote: 'n' },
        { itemId: 'spill-kit', required: true, goodZones: ['works'], badZones: [], placementNote: 'n' },
        { itemId: 'drain-protection', required: false, goodZones: ['works'], badZones: ['footpath'], placementNote: 'n' },
      ],
    }
    const at = (itemId: string, x: number, y: number) => ({ itemId, x, y })
    const welfare = at('welfare', 0, 1)

    it('a required environmental control is worth 5 Environmental Control marks on top of planning and safety', () => {
      const s = applySiteSetup(fresh(), envStep, [welfare, at('fuel-storage', 3, 1), at('spill-kit', 4, 1)]).scores
      expect(s.possible).toMatchObject({ planning: 30, safety: 15, environment: 10 })
      expect(s.earned).toMatchObject({ planning: 30, safety: 15, environment: 10 })
    })

    it('60% in an acceptable location, nothing when missing, and −5 when it is somewhere unsafe', () => {
      const neutral = applySiteSetup(fresh(), envStep, [welfare, at('fuel-storage', 1, 1), at('spill-kit', 4, 1)]).scores
      expect(neutral.earned.environment).toBe(8)
      const missing = applySiteSetup(fresh(), envStep, [welfare, at('spill-kit', 4, 1)]).scores
      expect(missing.earned.environment).toBe(5)
      expect(missing.possible.environment).toBe(10)
      const unsafe = applySiteSetup(fresh(), envStep, [welfare, at('fuel-storage', 1, 3), at('spill-kit', 4, 1)]).scores
      expect(unsafe.earned).toMatchObject({ environment: 0, safety: 5 }) // spill kit +5, fuel store −5 in each
      expect(unsafe.meters.incidentLikelihood).toBe(20)
    })

    it('an optional environmental control put somewhere unsafe costs environment and safety marks', () => {
      const good = [welfare, at('fuel-storage', 3, 1), at('spill-kit', 4, 1)]
      const base = applySiteSetup(fresh(), envStep, good).scores
      const s = applySiteSetup(fresh(), envStep, [...good, at('drain-protection', 2, 3)]).scores
      expect(s.earned.environment).toBe(base.earned.environment - 5)
      expect(s.earned.safety).toBe(base.earned.safety - 5)
      expect(s.possible).toEqual(base.possible)
    })

    it('an item that is not an environmental control never touches the Environmental Control score', () => {
      const s = applySiteSetup(fresh(), setupFixture, [{ itemId: 'welfare', x: 4, y: 1 }, { itemId: 'fuel-store', x: 4, y: 2 }]).scores
      expect(s.possible.environment).toBe(0)
      expect(s.earned.environment).toBe(0)
    })
  })
})

// ---------------------------------------------------------------------------
// Temporary works
// ---------------------------------------------------------------------------

describe('twItemScore / applyTwRegister', () => {
  const correct: TwAnswerRecord = { itemId: twItemFixture.id, ...twItemFixture.correct }

  it('marks seven fields at two points each', () => {
    expect(TW_FIELD_KEYS).toEqual(['register', 'design', 'catCheck', 'rams', 'inspection', 'holdPoint', 'responsible'])
    expect(twItemScore(twItemFixture, correct)).toEqual({ earned: 14, possible: 14, wrongFields: [], cautiousFields: [] })
  })

  it('a missing answer scores 0/14 with every field listed for review', () => {
    expect(twItemScore(twItemFixture, undefined)).toEqual({ earned: 0, possible: 14, wrongFields: [...TW_FIELD_KEYS], cautiousFields: [] })
    expect(twItemScore(twItemFixture, { itemId: twItemFixture.id })).toEqual({ earned: 0, possible: 14, wrongFields: [...TW_FIELD_KEYS], cautiousFields: [] })
  })

  it.each(TW_FIELD_KEYS.map((k) => [k] as const))('one wrong field (%s) costs exactly two points and is named', (key) => {
    const flipped: Record<(typeof TW_FIELD_KEYS)[number], unknown> = {
      register: false, design: 'none', catCheck: 'cat3', rams: false, inspection: false, holdPoint: false, responsible: 'PC',
    }
    const answer = { ...correct, [key]: flipped[key] } as TwAnswerRecord
    expect(twItemScore(twItemFixture, answer)).toEqual({ earned: 12, possible: 14, wrongFields: [key], cautiousFields: [] })
  })

  describe('design check category: one step more rigorous than the model answer (edu-s2-tw-highrisk-7)', () => {
    // The fixture's model answer is category 1.
    it('earns half the field\'s marks and is reported as cautious, not simply wrong', () => {
      expect(twItemScore(twItemFixture, { ...correct, catCheck: 'cat2' })).toEqual({
        earned: 13, possible: 14, wrongFields: ['catCheck'], cautiousFields: ['catCheck'],
      })
    })
    it('a less rigorous check, or one two steps over, is still wrong and earns nothing', () => {
      expect(twItemScore(twItemFixture, { ...correct, catCheck: 'cat0' })).toMatchObject({ earned: 12, wrongFields: ['catCheck'], cautiousFields: [] })
      expect(twItemScore(twItemFixture, { ...correct, catCheck: 'cat3' })).toMatchObject({ earned: 12, wrongFields: ['catCheck'], cautiousFields: [] })
    })
    it('never applies to any other field, and never lifts an item to full marks', () => {
      for (const scenario of SCENARIOS) {
        for (const item of twSteps(scenario).flatMap((s) => s.items)) {
          const model: TwAnswerRecord = { itemId: item.id, ...item.correct }
          for (const cat of ['cat0', 'cat1', 'cat2', 'cat3'] as const) {
            const r = twItemScore(item, { ...model, catCheck: cat })
            if (cat === item.correct.catCheck) expect(r).toMatchObject({ earned: 14, cautiousFields: [] })
            else {
              expect(r.earned).toBeLessThan(14)
              expect(r.wrongFields).toEqual(['catCheck'])
              expect(r.cautiousFields.every((f) => f === 'catCheck')).toBe(true)
            }
          }
        }
      }
    })
  })

  it('an unanswered field is wrong even when the correct value is "No"', () => {
    const item = { ...twItemFixture, correct: { ...twItemFixture.correct, holdPoint: false } }
    const { holdPoint: _omitted, ...answer } = { ...correct, holdPoint: false }
    expect(twItemScore(item, answer).wrongFields).toEqual(['holdPoint'])
    expect(twItemScore(item, { ...answer, holdPoint: false }).wrongFields).toEqual([])
  })

  it('applyTwRegister totals the items and raises incident likelihood for a missed register or design call', () => {
    const step = { type: 'twRegister' as const, id: 'fx-tw', prompt: '', topic: 't', learningNote: '', items: [twItemFixture, { ...twItemFixture, id: 'fx-tw2' }] }
    const perfect = applyTwRegister(fresh(), step, perfectTw(step))
    expect(perfect.earned.temporaryWorks).toBe(28)
    expect(perfect.possible.temporaryWorks).toBe(28)
    expect(perfect.meters.incidentLikelihood).toBe(15)

    const one = applyTwRegister(fresh(), step, [{ ...correct, design: 'none' }])
    expect(one.earned.temporaryWorks).toBe(12)
    expect(one.possible.temporaryWorks).toBe(28)
    expect(one.meters.incidentLikelihood).toBe(23) // +4 wrong design, +4 item never answered

    const paperwork = applyTwRegister(fresh(), step, [{ ...correct, rams: false }, { ...correct, itemId: 'fx-tw2', responsible: 'PC' }])
    expect(paperwork.meters.incidentLikelihood).toBe(15)
  })

  for (const scenario of SCENARIOS) {
    it(`${scenario.id}: the model answer to every authored TW item scores 14/14`, () => {
      for (const step of twSteps(scenario)) {
        expect(new Set(step.items.map((i) => i.id)).size).toBe(step.items.length)
        const answers = perfectTw(step)
        for (const item of step.items) {
          expect(twItemScore(item, answers.find((a) => a.itemId === item.id))).toEqual({ earned: 14, possible: 14, wrongFields: [] })
        }
        const s = applyTwRegister(fresh(), step, answers)
        expect(categoryScore(s, 'temporaryWorks')).toBe(100)
      }
    })
  }
})

// ---------------------------------------------------------------------------
// Permits
// ---------------------------------------------------------------------------

describe('applyPermits', () => {
  it('awards 4 legal + 3 safety per required permit raised', () => {
    const s = applyPermits(fresh(), permitFixture, ['dig', 'hot', 'lift'])
    expect(s.earned).toMatchObject({ legal: 12, safety: 9 })
    expect(s.possible).toMatchObject({ legal: 12, safety: 9 })
    expect(s.meters).toEqual(initialMeters())
  })

  it('each missed permit raises enforcement risk and incident likelihood by 5', () => {
    const s = applyPermits(fresh(), permitFixture, ['dig'])
    expect(s.earned).toMatchObject({ legal: 4, safety: 3 })
    expect(s.possible).toMatchObject({ legal: 12, safety: 9 })
    expect(s.meters.enforcementRisk).toBe(25)
    expect(s.meters.incidentLikelihood).toBe(25)
    const none = applyPermits(fresh(), permitFixture, [])
    expect(none.earned).toMatchObject({ legal: 0, safety: 0 })
    expect(none.meters.enforcementRisk).toBe(30)
  })

  it('assessPermits splits the form into raised, missed and unnecessary; unknown ids are ignored', () => {
    const a = assessPermits(permitFixture, ['dig', 'paint', 'nonsense', 'dig'])
    expect(a.raised.map((p) => p.id)).toEqual(['dig'])
    expect(a.missed.map((p) => p.name)).toEqual(['Hot works', 'Permit to lift'])
    expect(a.unnecessary).toEqual([{ id: 'paint', name: 'Permit to paint' }])
    expect(assessPermits(permitFixture, [])).toMatchObject({ raised: [], unnecessary: [] })
  })

  it('a permit nobody needs costs 2 planning marks (paperwork padding) but no legal or safety marks; unknown ids are ignored', () => {
    const exact = applyPermits(fresh(), permitFixture, ['dig', 'hot', 'lift'])
    expect(exact.earned.planning).toBe(0)
    const padded = applyPermits(fresh(), permitFixture, ['dig', 'hot', 'lift', 'paint', 'nonsense'])
    expect(padded.earned).toEqual({ ...exact.earned, planning: -2 })
    expect(padded.possible).toEqual(exact.possible)
    expect(padded.meters).toEqual(exact.meters)
  })

  it('meters clamp at 100 and the input state is not mutated', () => {
    const start = deepFreeze({ ...initialScoreState(), meters: { ...initialMeters(), enforcementRisk: 96, incidentLikelihood: 99 } })
    const s = applyPermits(start, permitFixture, [])
    expect(s.meters.enforcementRisk).toBe(100)
    expect(s.meters.incidentLikelihood).toBe(100)
  })

  for (const scenario of SCENARIOS) {
    it(`${scenario.id}: every required permit is one of the options on the form`, () => {
      for (const step of permitSteps(scenario)) {
        const ids = step.options.map((o) => o.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const r of step.required) expect(ids).toContain(r)
        expect(step.required.length).toBeGreaterThan(0)
        expect(step.required.length).toBeLessThan(ids.length) // at least one distractor
        const s = applyPermits(fresh(), step, step.required)
        expect(s.earned.legal).toBe(s.possible.legal)
        expect(s.earned.safety).toBe(s.possible.safety)
        expect(s.earned.planning).toBe(0)
        // Ticking every box is not a model answer: it keeps the legal marks but loses planning marks.
        const everything = applyPermits(fresh(), step, ids)
        expect(everything.earned.legal).toBe(s.earned.legal)
        expect(everything.earned.planning).toBe(-2 * (ids.length - step.required.length))
      }
    })
  }
})

// ---------------------------------------------------------------------------
// Hazard hunt
// ---------------------------------------------------------------------------

describe('assessHunt / applyHazardHunt', () => {
  it('splits observations into found, missed and false alarms', () => {
    const a = assessHunt(huntFixture, ['h1', 'ok1'])
    expect(a.found.map((o) => o.id)).toEqual(['h1'])
    expect(a.missed.map((o) => o.id)).toEqual(['h2', 'h3'])
    expect(a.falseFlags.map((o) => o.id)).toEqual(['ok1'])
  })

  it('a clean sweep finds everything with no false alarms; flagging nothing misses everything', () => {
    const sweep = assessHunt(huntFixture, perfectHunt(huntFixture))
    expect(sweep.found).toHaveLength(3)
    expect(sweep.missed).toEqual([])
    expect(sweep.falseFlags).toEqual([])
    const blank = assessHunt(huntFixture, [])
    expect(blank.found).toEqual([])
    expect(blank.missed).toHaveLength(3)
  })

  it('ignores duplicate and unknown ids', () => {
    const a = assessHunt(huntFixture, ['h1', 'h1', 'not-a-tile'])
    expect(a.found.map((o) => o.id)).toEqual(['h1'])
    expect(a.falseFlags).toEqual([])
  })

  it('found + missed always equals the number of real hazards, whatever is flagged', () => {
    const ids = huntFixture.observations.map((o) => o.id)
    for (let mask = 0; mask < 2 ** ids.length; mask++) {
      const flagged = ids.filter((_, i) => mask & (1 << i))
      const a = assessHunt(huntFixture, flagged)
      expect(a.found.length + a.missed.length).toBe(3)
      expect(a.found.length + a.falseFlags.length).toBe(flagged.length)
    }
  })

  it('scores 4 safety + 2 planning per hazard found; a false alarm costs half a find in each', () => {
    const perfect = applyHazardHunt(fresh(), huntFixture, ['h1', 'h2', 'h3'])
    expect(perfect.earned).toMatchObject({ safety: 12, planning: 6 })
    expect(perfect.possible).toMatchObject({ safety: 12, planning: 6 })
    const sloppy = applyHazardHunt(fresh(), huntFixture, ['h1', 'ok1', 'ok2'])
    expect(sloppy.earned).toMatchObject({ safety: 0, planning: 0 })
    expect(sloppy.possible).toMatchObject({ safety: 12, planning: 6 })
    const everything = applyHazardHunt(fresh(), huntFixture, ['h1', 'h2', 'h3', 'ok1', 'ok2'])
    expect(everything.earned).toMatchObject({ safety: 8, planning: 4 })
  })

  it('false alarms can cancel finds but never take the walk-round below zero', () => {
    const before = withScores({ safety: 20, planning: 10 }, { safety: 20, planning: 10 })
    const s = applyHazardHunt(before, huntFixture, ['ok1', 'ok2'])
    expect(s.earned).toMatchObject({ safety: 20, planning: 10 })
    expect(s.possible).toMatchObject({ safety: 32, planning: 16 })
  })

  it('a missed hazard raises incident likelihood: +4 if high severity, otherwise +2', () => {
    expect(applyHazardHunt(fresh(), huntFixture, ['h2', 'h3']).meters.incidentLikelihood).toBe(19)
    expect(applyHazardHunt(fresh(), huntFixture, ['h1']).meters.incidentLikelihood).toBe(19)
    expect(applyHazardHunt(fresh(), huntFixture, []).meters.incidentLikelihood).toBe(23)
    expect(applyHazardHunt(fresh(), huntFixture, ['h1', 'h2', 'h3']).meters.incidentLikelihood).toBe(15)
  })

  for (const scenario of SCENARIOS) {
    it(`${scenario.id}: the walk-round is 16 tiles, 8 hazards (each with a severity) and 8 look-alikes`, () => {
      for (const step of huntSteps(scenario)) {
        expect(step.observations).toHaveLength(16)
        const hazards = step.observations.filter((o) => o.hazard)
        expect(hazards).toHaveLength(8)
        for (const h of hazards) expect(['low', 'medium', 'high']).toContain(h.severity)
        expect(new Set(step.observations.map((o) => o.id)).size).toBe(16)
        const s = applyHazardHunt(fresh(), step, perfectHunt(step))
        expect(s.earned.safety).toBe(s.possible.safety)
        expect(s.earned.planning).toBe(s.possible.planning)
        // Flagging every tile without looking is worth exactly half marks, not full marks for planning.
        const blind = applyHazardHunt(fresh(), step, step.observations.map((o) => o.id))
        expect(blind.earned.safety).toBe(s.possible.safety / 2)
        expect(blind.earned.planning).toBe(s.possible.planning / 2)
      }
    })
  }
})

// ---------------------------------------------------------------------------
// Sequencing
// ---------------------------------------------------------------------------

describe('assessSequence / applySequence', () => {
  it('scores precedence, not position: any order that respects every dependency is perfect', () => {
    for (const order of [['a', 'b', 'c', 'd'], ['a', 'c', 'b', 'd'], ['c', 'a', 'b', 'd']]) {
      const a = assessSequence(sequenceFixture, order)
      expect(a.perfect).toBe(true)
      expect(a.violated).toEqual([])
      expect(a.satisfied).toHaveLength(3)
    }
  })

  it('reports each broken dependency and separates the critical ones', () => {
    const a = assessSequence(sequenceFixture, ['b', 'a', 'd', 'c'])
    expect(a.perfect).toBe(false)
    expect(a.violated.map((c) => `${c.before}>${c.after}`)).toEqual(['a>b', 'c>d'])
    expect(a.criticalViolated.map((c) => `${c.before}>${c.after}`)).toEqual(['c>d'])
    expect(a.satisfied.map((c) => `${c.before}>${c.after}`)).toEqual(['b>d'])
  })

  it('an activity left out of the plan breaks every dependency it is part of', () => {
    const a = assessSequence(sequenceFixture, ['a', 'b', 'd'])
    expect(a.violated.map((c) => `${c.before}>${c.after}`)).toEqual(['c>d'])
    expect(assessSequence(sequenceFixture, []).violated).toHaveLength(3)
  })

  it('applySequence: 3 planning + 1 programme per dependency, 4 safety per critical hold point, +5 incident likelihood per critical breach', () => {
    const perfect = applySequence(fresh(), sequenceFixture, ['a', 'b', 'c', 'd'])
    expect(perfect.earned).toMatchObject({ planning: 9, safety: 8, programme: 3 })
    expect(perfect.possible).toMatchObject({ planning: 9, safety: 8, programme: 3 })
    expect(perfect.meters.incidentLikelihood).toBe(15)

    const reversed = applySequence(fresh(), sequenceFixture, ['d', 'c', 'b', 'a'])
    expect(reversed.earned).toMatchObject({ planning: 0, safety: 0, programme: 0 })
    expect(reversed.possible).toMatchObject({ planning: 9, safety: 8, programme: 3 })
    expect(reversed.meters.incidentLikelihood).toBe(25)
  })

  for (const scenario of SCENARIOS) {
    for (const step of sequenceSteps(scenario)) {
      const authored = perfectSequence(step)
      const key = (c: { before: string; after: string }) => `${c.before}>${c.after}`

      it(`${scenario.id} ${step.id}: constraints are well-formed and the authored order is perfect`, () => {
        expect(new Set(authored).size).toBe(authored.length)
        for (const c of step.constraints) {
          expect(authored).toContain(c.before)
          expect(authored).toContain(c.after)
          expect(c.before).not.toBe(c.after)
          expect(c.reason.length).toBeGreaterThan(10)
        }
        expect(new Set(step.constraints.map(key)).size).toBe(step.constraints.length)
        const a = assessSequence(step, authored)
        expect(a.perfect).toBe(true)
        expect(a.satisfied).toHaveLength(step.constraints.length)
        expect(a.criticalViolated).toEqual([])
        const s = applySequence(fresh(), step, authored)
        expect(s.earned.planning).toBe(s.possible.planning)
        expect(s.earned.safety).toBe(s.possible.safety)
      })

      it(`${scenario.id} ${step.id}: every single adjacent swap is detected iff the pair is constrained`, () => {
        let constrainedSwaps = 0
        for (let i = 0; i < authored.length - 1; i++) {
          const order = [...authored]
          ;[order[i], order[i + 1]] = [order[i + 1], order[i]]
          const a = assessSequence(step, order)
          const direct = step.constraints.filter((c) => c.before === authored[i] && c.after === authored[i + 1])
          // Swapping neighbours can only break a rule between those two activities.
          expect(a.violated.map(key)).toEqual(direct.map(key))
          expect(a.perfect).toBe(direct.length === 0)
          expect(a.criticalViolated.map(key)).toEqual(direct.filter((c) => c.critical).map(key))
          if (direct.length) constrainedSwaps++
        }
        // The puzzle must actually constrain something next to each other.
        expect(constrainedSwaps).toBeGreaterThan(0)
      })

      it(`${scenario.id} ${step.id}: reversing the plan breaks every dependency, including every critical hold point`, () => {
        const a = assessSequence(step, [...authored].reverse())
        expect(a.violated).toHaveLength(step.constraints.length)
        expect(a.criticalViolated).toHaveLength(step.constraints.filter((c) => c.critical).length)
        expect(a.criticalViolated.length).toBeGreaterThan(0)
      })

      it(`${scenario.id} ${step.id}: moving one activity anywhere is judged purely by the dependencies it crosses`, () => {
        const pos = (order: string[]) => new Map(order.map((id, i) => [id, i] as const))
        for (let from = 0; from < authored.length; from++) {
          for (let to = 0; to < authored.length; to++) {
            const order = [...authored]
            const [moved] = order.splice(from, 1)
            order.splice(to, 0, moved)
            const p = pos(order)
            const expected = step.constraints.filter((c) => p.get(c.before)! > p.get(c.after)!).map(key)
            expect(assessSequence(step, order).violated.map(key)).toEqual(expected)
          }
        }
      })
    }
  }
})

describe('initialSequenceOrder (eng-tests-10)', () => {
  it('is a permutation of the activities, stable for a seed, and different across seeds', () => {
    const ids = sequenceFixture.activities.map((a) => a.id)
    const seen = new Set<string>()
    for (let seed = 1; seed <= 200; seed++) {
      const order = initialSequenceOrder(sequenceFixture, seed)
      expect([...order].sort()).toEqual([...ids].sort())
      expect(initialSequenceOrder(sequenceFixture, seed)).toEqual(order)
      seen.add(order.join(','))
    }
    expect(seen.size).toBeGreaterThan(5)
  })

  it('never hands over an order that already satisfies every dependency', () => {
    // The fixture has only 4 activities and 3 rules, so 3 of its 24 orders are already perfect.
    for (let seed = 1; seed <= 2000; seed++) {
      expect(assessSequence(sequenceFixture, initialSequenceOrder(sequenceFixture, seed)).perfect, `seed ${seed}`).toBe(false)
    }
  })

  for (const scenario of SCENARIOS) {
    for (const step of sequenceSteps(scenario)) {
      it(`${scenario.id} ${step.id}: seeds 1-3000 all start from a plan that still needs work`, () => {
        const ids = step.activities.map((a) => a.id).sort()
        for (let seed = 1; seed <= 3000; seed++) {
          const order = initialSequenceOrder(step, seed)
          expect(assessSequence(step, order).perfect, `seed ${seed}`).toBe(false)
          if (seed % 250 === 0) expect([...order].sort()).toEqual(ids)
        }
      })
    }
  }

  it('falls back to the reversed plan when no shuffle can be wrong (nothing is constrained)', () => {
    const free = { ...sequenceFixture, constraints: [] }
    expect(initialSequenceOrder(free, 7)).toEqual(['d', 'c', 'b', 'a'])
  })
})

// ---------------------------------------------------------------------------
// Final scores and grades
// ---------------------------------------------------------------------------

/** The score state of a model run through the authored phases (no incident events), by pure scoring. */
function modelRun(scenario: Scenario): ScoreState {
  let s = initialScoreState()
  for (const d of scenario.phases.flatMap((p) => p.steps)) {
    if (d.type === 'decision') s = applyDecision(s, d, d.options.find((o) => o.quality === 'best')!)
    else if (d.type === 'siteSetup') s = applySiteSetup(s, d, layoutFor(d, 'good')!).scores
    else if (d.type === 'twRegister') s = applyTwRegister(s, d, perfectTw(d))
    else if (d.type === 'permits') s = applyPermits(s, d, d.required)
    else if (d.type === 'hazardHunt') s = applyHazardHunt(s, d, perfectHunt(d))
    else if (d.type === 'sequence') s = applySequence(s, d, perfectSequence(d))
  }
  return s
}

/** The model run with one decision re-answered. */
function withAnswer(base: ScoreState, step: DecisionStep, answer: DecisionOption): ScoreState {
  const best = applyDecision(initialScoreState(), step, step.options.find((o) => o.quality === 'best')!)
  const other = applyDecision(initialScoreState(), step, answer)
  const earned = { ...base.earned }
  for (const k of SCORE_KEYS) earned[k] += other.earned[k] - best.earned[k]
  return { ...base, earned }
}

/** Overall score before rounding, to measure how far one answer moves it. */
function exactOverall(state: ScoreState): number {
  const w = categoryWeights(state)
  return SCORE_KEYS.reduce((sum, k) => sum + (w[k] ?? 0) * Math.min(1, Math.max(0, state.earned[k] / (state.possible[k] || 1))), 0) * 100
}

describe('categoryScore / overallScore / gradeFor', () => {
  it('a category nobody has been tested on yet is null, not 0%', () => {
    expect(categoryScore(initialScoreState(), 'legal')).toBeNull()
    expect(overallScore(initialScoreState())).toBe(0)
  })

  it('is a rounded percentage clamped to 0..100', () => {
    expect(categoryScore(withScores({ legal: 7 }, { legal: 9 }), 'legal')).toBe(78)
    expect(categoryScore(withScores({ legal: -4 }, { legal: 9 }), 'legal')).toBe(0)
    expect(categoryScore(withScores({ legal: 12 }, { legal: 9 }), 'legal')).toBe(100)
    expect(categoryScore(withScores({ legal: 9 }, { legal: 9 }), 'legal')).toBe(100)
  })

  it('overall only counts the categories that have been assessed', () => {
    expect(overallScore(withScores({ legal: 10, safety: 5 }, { legal: 10, safety: 10 }))).toBe(75)
    expect(overallScore(withScores({ legal: 1 }, { legal: 3, safety: 0 }))).toBe(33)
    expect(categoryWeights(withScores({}, { legal: 3 }))).toEqual({ legal: 1 })
    expect(categoryWeights(initialScoreState())).toEqual({})
  })

  it('a category counts in proportion to the marks behind it, with a 3% floor for thin categories', () => {
    expect(CATEGORY_WEIGHT_FLOOR).toBe(0.03)
    // Safety has 300 marks, quality has 100: safety counts three times as much.
    const w = categoryWeights(withScores({}, { safety: 300, quality: 100 }))
    expect(w.safety).toBeCloseTo(0.75, 10)
    expect(w.quality).toBeCloseTo(0.25, 10)
    expect(overallScore(withScores({ safety: 300, quality: 0 }, { safety: 300, quality: 100 }))).toBe(75)
    expect(overallScore(withScores({ safety: 0, quality: 100 }, { safety: 300, quality: 100 }))).toBe(25)
    // A category with 1% of the marks is lifted to the floor (3% of the marks, then shares re-normalised).
    const thin = categoryWeights(withScores({}, { safety: 990, quality: 10 }))
    expect(thin.quality).toBeCloseTo(30 / 1020, 10)
    expect(thin.safety).toBeCloseTo(990 / 1020, 10)
    expect(Object.values(thin).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10)
  })

  it('one answer in a thin category cannot move the grade a band (eng-engine-3)', () => {
    // 14 quality marks from a single question, beside 1,000 marks elsewhere: equal weights used to
    // make that one answer worth a seventh of the grade.
    const possible = { legal: 160, safety: 310, planning: 330, temporaryWorks: 190, environment: 50, programme: 30, quality: 14 }
    const perfect = withScores(possible, possible)
    expect(overallScore(perfect)).toBe(100)
    const slipped = withScores({ ...possible, quality: 0 }, possible)
    expect(categoryScore(slipped, 'quality')).toBe(0)
    expect(overallScore(slipped)).toBeGreaterThanOrEqual(97)
  })

  it('a category cannot go below 0% or above 100% in the overall, whatever the raw marks', () => {
    expect(overallScore(withScores({ legal: -50, safety: 100 }, { legal: 100, safety: 100 }))).toBe(50)
    expect(overallScore(withScores({ legal: 150, safety: 0 }, { legal: 100, safety: 100 }))).toBe(50)
    expect(overallScore(withScores({ legal: -5 }, { legal: 10 }))).toBe(0)
  })

  for (const scenario of SCENARIOS) {
    it(`${scenario.id}: a model run scores 100% in every category and 100 overall`, () => {
      const s = modelRun(scenario)
      for (const k of SCORE_KEYS) {
        expect(s.possible[k], k).toBeGreaterThan(0)
        expect(categoryScore(s, k), k).toBe(100)
      }
      expect(overallScore(s)).toBe(100)
      // Drawing any of the incident events and answering it properly keeps it there.
      let withEvents = s
      for (const e of scenario.eventPool) withEvents = applyDecision(withEvents, e, e.options.find((o) => o.quality === 'best')!)
      for (const k of SCORE_KEYS) expect(categoryScore(withEvents, k), k).toBe(100)
      expect(overallScore(withEvents)).toBe(100)
    })

    it(`${scenario.id}: no single answer moves the overall grade by more than about 3 points`, () => {
      const base = modelRun(scenario)
      let worst = { drop: 0, where: '' }
      let worstPartial = { drop: 0, where: '' }
      for (const d of scenario.phases.flatMap((p) => p.steps)) {
        if (d.type !== 'decision') continue
        for (const o of d.options) {
          const drop = 100 - exactOverall(withAnswer(base, d, o))
          expect(drop, `${d.id} ${o.id}`).toBeGreaterThanOrEqual(0)
          if (drop > worst.drop) worst = { drop, where: `${d.id} ${o.id} (${o.quality})` }
          if (o.quality === 'partial' && drop > worstPartial.drop) worstPartial = { drop, where: `${d.id} ${o.id}` }
        }
      }
      // Worst case today is an unsafe answer on the construction phase plan question (about 3.4);
      // the worst "partly right" answer costs under 2.
      expect(worst.drop, worst.where).toBeLessThanOrEqual(4)
      expect(worstPartial.drop, worstPartial.where).toBeLessThanOrEqual(2.5)
    })
  }

  it.each([
    [100, 'Excellent'], [90, 'Excellent'], [89, 'Good'], [75, 'Good'], [74, 'Developing'], [60, 'Developing'],
    [59, 'Significant gaps'], [40, 'Significant gaps'], [39, 'Unsafe planning'], [0, 'Unsafe planning'],
  ])('%i -> %s', (score, label) => {
    expect(gradeFor(score).label).toBe(label)
  })

  it('no grade band reads as an assessment result: the game is never an SMSTS pass', () => {
    for (const b of GRADE_BANDS) expect(`${b.label} ${b.summary}`).not.toMatch(/\bpass|\bfail|smsts|citb|certif/i)
  })

  it('grade bands are in descending order and out-of-range scores fall into the bottom band', () => {
    const mins = GRADE_BANDS.map((b) => b.min)
    expect([...mins].sort((a, b) => b - a)).toEqual(mins)
    expect(mins.at(-1)).toBe(0)
    expect(gradeFor(-5).label).toBe('Unsafe planning')
    expect(gradeFor(Number.NaN).label).toBe('Unsafe planning')
  })
})
