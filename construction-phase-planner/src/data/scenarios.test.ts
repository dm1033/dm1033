// Contract between the authored scenario JSON and the engine. scripts/validate-data.ts checks the
// schema; these tests pin the handful of assumptions the engine code silently relies on, so a
// content edit that would break scoring fails in `npm test` with a readable message.
import { describe, expect, it } from 'vitest'
import { SCENARIOS, getScenario } from './index'
import { SITE_ITEM_MAP } from './siteItems'
import { CPP_SECTIONS } from '../types'
import { DIFFICULTIES, WEEK_PHASES } from '../engine/game'
import { allDecisions, setupSteps } from '../test/fixtures'

describe('scenario registry', () => {
  it('ships the three CITB-style case studies with unique ids', () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual(['s1-commercial-extension', 's2-city-refurb', 's3-utilities-roadworks'])
    for (const s of SCENARIOS) expect(getScenario(s.id)).toBe(s)
    expect(getScenario('missing')).toBeNull()
  })
})

for (const scenario of SCENARIOS) {
  describe(`${scenario.id}: engine contract`, () => {
    it('has phases numbered 1–15 in order, so site weeks follow phases 4–13 and incidents land in phase 12', () => {
      expect(scenario.phases.map((p) => p.number)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
      for (const n of WEEK_PHASES) expect(scenario.phases.some((p) => p.number === n && p.steps.length > 0)).toBe(true)
    })

    it('uses step ids that are unique across phases and the incident pool', () => {
      const ids = [...scenario.phases.flatMap((p) => p.steps.map((s) => s.id)), ...scenario.eventPool.map((e) => e.id)]
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('gives every decision exactly one best answer, four options with unique ids, and no option called "timeout"', () => {
      for (const d of allDecisions(scenario)) {
        expect(d.options, d.id).toHaveLength(4)
        expect(d.options.filter((o) => o.quality === 'best'), d.id).toHaveLength(1)
        expect(new Set(d.options.map((o) => o.id)).size, d.id).toBe(4)
        expect(d.options.map((o) => o.id)).not.toContain('timeout')
      }
    })

    it('has enough incidents in the pool for the hardest difficulty (draw + surprise events)', () => {
      const need = Math.max(...Object.values(DIFFICULTIES).map((d) => d.eventDraw + d.surpriseEvents))
      expect(scenario.eventPool.length).toBeGreaterThanOrEqual(need)
      for (const e of scenario.eventPool) expect(e.isEvent, e.id).toBe(true)
    })

    it('writes CPP text for every answer quality on offer (otherwise the model text is shown for a poor answer)', () => {
      const sections = new Set<string>(CPP_SECTIONS.map((c) => c.id))
      for (const d of allDecisions(scenario)) {
        if (!d.cppSection) continue
        expect(sections.has(d.cppSection), d.id).toBe(true)
        for (const o of d.options) expect(d.cppText?.[o.quality], `${d.id} ${o.quality}`).toBeTruthy()
      }
    })

    it('only marks an answer as a critical failure when it is poor or unsafe', () => {
      for (const d of allDecisions(scenario)) {
        for (const o of d.options) {
          if (o.criticalFailure) expect(['poor', 'unsafe'], `${d.id} ${o.id}`).toContain(o.quality)
        }
      }
    })

    it('places only items that exist in the site item catalogue', () => {
      for (const step of setupSteps(scenario)) {
        for (const r of step.rules) expect(SITE_ITEM_MAP[r.itemId], r.itemId).toBeTruthy()
      }
    })
  })
}
