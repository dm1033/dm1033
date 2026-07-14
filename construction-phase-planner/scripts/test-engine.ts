// Engine tests: classification derivation, weighted model, critical-failure gate.
// Run: npx tsx scripts/test-engine.ts
import scenario1 from '../src/data/scenarios/scenario1-commercial-extension.json'
import type { DecisionStep, GameState, Scenario } from '../src/types'
import {
  classifyOption, computeWeightedResult, COMPETENCY_AREAS, areaForStep,
} from '../src/engine/assessment'
import { initialScoreState, gradeFor } from '../src/engine/scoring'
import { initialGameState } from '../src/state/GameContext'

const scenario = scenario1 as unknown as Scenario
let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ✓ ${name}`)
  else { failures++; console.error(`  ✗ ${name} ${detail}`) }
}

// --- weights sum to 100 ---
check('competency weights sum to 100', COMPETENCY_AREAS.reduce((a, b) => a + b.weight, 0) === 100)

// --- classification derivation ---
const allDecisions: DecisionStep[] = []
for (const phase of scenario.phases) {
  for (const step of phase.steps) if (step.type === 'decision') allDecisions.push(step)
}
allDecisions.push(...scenario.eventPool)

const p7d1 = allDecisions.find((d) => d.id === 'p7-d1')! // the scaffold example question
check('best option classifies as excellent', classifyOption(p7d1, p7d1.options.find((o) => o.quality === 'best')!) === 'excellent')
const unsafeCritical = p7d1.options.find((o) => o.quality === 'unsafe' && o.criticalFailure)!
check('unsafe option with criticalFailure classifies as critical', classifyOption(p7d1, unsafeCritical) === 'critical')

let sawUnsafeNonCritical = false
let sawGoodOrAcceptable = false
let sawWeakOrPoor = false
for (const d of allDecisions) {
  for (const o of d.options) {
    const c = classifyOption(d, o)
    if (o.quality === 'unsafe' && !o.criticalFailure) {
      sawUnsafeNonCritical = true
      check(`unsafe w/o critical stays unsafe (${d.id}/${o.id})`, c === 'unsafe')
      break
    }
  }
}
for (const d of allDecisions) {
  for (const o of d.options) {
    const c = classifyOption(d, o)
    if (o.quality === 'partial' && (c === 'good' || c === 'acceptable')) sawGoodOrAcceptable = true
    if (o.quality === 'poor' && (c === 'weak' || c === 'poor')) sawWeakOrPoor = true
    check(`classification tier consistent with quality (${d.id}/${o.id})`,
      (o.quality === 'best' && c === 'excellent') ||
      (o.quality === 'partial' && (c === 'good' || c === 'acceptable')) ||
      (o.quality === 'poor' && (c === 'weak' || c === 'poor')) ||
      (o.quality === 'unsafe' && (c === 'unsafe' || c === 'critical')),
      `got ${c}`)
  }
}
check('partial maps into good/acceptable somewhere', sawGoodOrAcceptable)
check('poor maps into weak/poor somewhere', sawWeakOrPoor)

// --- area mapping: every deterministic step resolves to a valid area ---
for (const phase of scenario.phases) {
  for (const step of phase.steps) {
    if (step.type === 'info') continue
    const area = areaForStep(step)
    check(`area for ${step.id} valid`, COMPETENCY_AREAS.some((a) => a.id === area), `got ${area}`)
  }
}

// --- weighted result + critical gate ---
function mkState(withCritical: boolean): GameState {
  const decisions = allDecisions.slice(0, 12).map((d, i) => {
    const best = d.options.find((o) => o.quality === 'best')!
    return {
      stepId: d.id, phaseNumber: 1, prompt: d.prompt, topic: d.topic,
      chosenOptionId: best.id, quality: best.quality, wasEvent: !!d.isEvent,
    }
  })
  return {
    ...initialGameState,
    scenarioId: scenario.id,
    scores: initialScoreState(),
    decisions,
    criticalFailures: withCritical ? ['Test critical failure'] : [],
  }
}

const clean = computeWeightedResult(mkState(false), scenario)
check('all-best run scores 100', clean.overall === 100, `got ${clean.overall}`)
check('clean run is not gated', !clean.gated)
check('clean run outcome is Outstanding', clean.outcome === 'Outstanding', clean.outcome)

const gated = computeWeightedResult(mkState(true), scenario)
check('critical failure gates the outcome', gated.gated)
check('gated outcome overrides high score',
  gated.outcome.includes('Insufficient evidence of competence'), gated.outcome)
check('gated run still reports numeric band', gated.bandLabel === 'Outstanding', gated.bandLabel)

// --- performance bands ---
check('band 95 = Outstanding', gradeFor(95).label === 'Outstanding')
check('band 85 = Strong', gradeFor(85).label === 'Strong')
check('band 72 = Competent', gradeFor(72).label === 'Competent')
check('band 65 = Developing competence', gradeFor(65).label === 'Developing competence')
check('band 55 = Significant improvement required', gradeFor(55).label === 'Significant improvement required')
check('band 30 = Insufficient evidence of competence', gradeFor(30).label === 'Insufficient evidence of competence')

if (failures > 0) {
  console.error(`\n${failures} engine test(s) FAILED`)
  process.exit(1)
}
console.log('\nAll engine tests passed.')
