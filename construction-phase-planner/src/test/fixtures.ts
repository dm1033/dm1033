// Small hand-built fixtures so unit tests do not depend on authored scenario content.
import { initialGameMeta, initialGameState } from '../state/GameContext'
import { initialScoreState } from '../engine/scoring'
import type {
  DecisionOption, DecisionStep, Difficulty, GameMeta, GameState, HazardHuntStep, LatentHazard,
  MeterKey, OptionQuality, PermitStep, Scenario, SequenceStep, SiteSetupStep, TwItem, TwRegisterStep,
} from '../types'
import { SCENARIOS } from '../data'

export const S1 = SCENARIOS[0]
export const S2 = SCENARIOS[1]
export const S3 = SCENARIOS[2]
export const DIFFS: Difficulty[] = ['learner', 'standard', 'expert']

export function option(quality: OptionQuality, over: Partial<DecisionOption> = {}): DecisionOption {
  return { id: `opt-${quality}`, text: `${quality} option`, quality, impact: {}, feedback: `${quality} feedback`, ...over }
}

export function decisionStep(over: Partial<DecisionStep> = {}): DecisionStep {
  return {
    type: 'decision',
    id: 'fx-d1',
    prompt: 'What do you do?',
    topic: 'Fixture topic',
    learningNote: 'note',
    options: [
      // The best option holds the highest mark in every category, so these fixtures do not depend
      // on how the engine treats a distractor that out-scores the model answer (finding eng-tests-3).
      option('best', { impact: { safety: 10, legal: 5, programme: 2, morale: 3 } }),
      option('partial', { impact: { safety: 5, legal: 2 } }),
      option('poor', { impact: { safety: 0, programme: 1, incidentLikelihood: 5 } }),
      option('unsafe', { impact: { safety: -5, enforcementRisk: 10 }, criticalFailure: 'Fixture critical failure', consequence: 'A scaffold collapsed.' }),
    ],
    ...over,
  }
}

export const allDecisions = (scenario: Scenario): DecisionStep[] => [
  ...scenario.phases.flatMap((p) => p.steps.filter((s): s is DecisionStep => s.type === 'decision')),
  ...scenario.eventPool,
]

export function stepOf<T extends { type: string }>(scenario: Scenario, type: T['type']): T[] {
  return scenario.phases.flatMap((p) => p.steps.filter((s) => s.type === type)) as unknown as T[]
}

export const setupSteps = (s: Scenario) => stepOf<SiteSetupStep>(s, 'siteSetup')
export const twSteps = (s: Scenario) => stepOf<TwRegisterStep>(s, 'twRegister')
export const permitSteps = (s: Scenario) => stepOf<PermitStep>(s, 'permits')
export const huntSteps = (s: Scenario) => stepOf<HazardHuntStep>(s, 'hazardHunt')
export const sequenceSteps = (s: Scenario) => stepOf<SequenceStep>(s, 'sequence')

/** 6 x 4 site: road (blocked) on row 0, compound columns 0-2, works columns 3-5, footpath row 3. */
export const setupFixture: SiteSetupStep = {
  type: 'siteSetup',
  id: 'fx-setup',
  prompt: 'Lay out the site',
  grid: { cols: 6, rows: 4 },
  zones: [
    { id: 'road', label: 'Live road', x1: 0, y1: 0, x2: 5, y2: 0, color: 'bg-slate-700', blocked: true },
    { id: 'compound', label: 'Compound', x1: 0, y1: 1, x2: 2, y2: 2, color: 'bg-emerald-900' },
    { id: 'works', label: 'Works area', x1: 3, y1: 1, x2: 5, y2: 2, color: 'bg-amber-900' },
    { id: 'footpath', label: 'Public footpath', x1: 0, y1: 3, x2: 5, y2: 3, color: 'bg-red-900' },
  ],
  rules: [
    { itemId: 'welfare', required: true, goodZones: ['compound'], badZones: ['works', 'footpath'], placementNote: 'Welfare belongs in the compound.' },
    { itemId: 'fuel-store', required: true, goodZones: ['works'], badZones: ['footpath'], placementNote: 'Fuel away from the public.' },
    { itemId: 'lighting', required: false, goodZones: ['compound'], badZones: ['footpath'], placementNote: 'Optional lighting.' },
  ],
  topic: 'Site set-up',
  learningNote: 'note',
}

export const twItemFixture: TwItem = {
  id: 'fx-tw1',
  name: 'Excavation support',
  description: 'Trench box to 2.4 m',
  correct: { register: true, design: 'standard-solution', catCheck: 'cat1', rams: true, inspection: true, holdPoint: true, responsible: 'TWC' },
  explanation: 'why',
}

export const permitFixture: PermitStep = {
  type: 'permits',
  id: 'fx-permits',
  prompt: 'Which permits?',
  options: [{ id: 'dig', name: 'Permit to dig' }, { id: 'hot', name: 'Hot works' }, { id: 'lift', name: 'Permit to lift' }, { id: 'paint', name: 'Permit to paint' }],
  required: ['dig', 'hot', 'lift'],
  explanation: 'why',
  topic: 'Permits',
  learningNote: 'note',
}

export const huntFixture: HazardHuntStep = {
  type: 'hazardHunt',
  id: 'fx-hunt',
  prompt: 'Walk the site',
  location: 'Week 6',
  timeLimit: 90,
  observations: [
    { id: 'h1', icon: '!', text: 'Open edge', hazard: true, explanation: 'x', severity: 'high' },
    { id: 'h2', icon: '!', text: 'Trailing lead', hazard: true, explanation: 'x', severity: 'low' },
    { id: 'h3', icon: '!', text: 'Missing toe board', hazard: true, explanation: 'x', severity: 'medium' },
    { id: 'ok1', icon: '.', text: 'Tagged scaffold', hazard: false, explanation: 'x' },
    { id: 'ok2', icon: '.', text: 'Bunded fuel', hazard: false, explanation: 'x' },
  ],
  topic: 'Hazard spotting',
  learningNote: 'note',
}

export const sequenceFixture: SequenceStep = {
  type: 'sequence',
  id: 'fx-seq',
  prompt: 'Order the work',
  activities: [{ id: 'a', label: 'Survey' }, { id: 'b', label: 'Design' }, { id: 'c', label: 'Permit' }, { id: 'd', label: 'Dig' }],
  constraints: [
    { before: 'a', after: 'b', reason: 'Design needs the survey.' },
    { before: 'b', after: 'd', reason: 'No digging before the design.', critical: true },
    { before: 'c', after: 'd', reason: 'No digging before the permit.', critical: true },
  ],
  topic: 'Sequencing',
  learningNote: 'note',
}

export function hazard(over: Partial<LatentHazard> = {}): LatentHazard {
  return {
    id: 'fx-h', stepId: 'fx-d1', phaseNumber: 2, severity: 'major', topic: 'Fixture topic',
    choice: 'Carried on regardless', consequence: 'A wall collapsed onto the footpath.', status: 'open', revealed: false, ...over,
  }
}

/** A mid-project state for a real scenario, with overrides for the game layer and meters. */
export function stateFor(
  scenario: Scenario,
  difficulty: Difficulty,
  game: Partial<GameMeta> = {},
  meters: Partial<Record<MeterKey, number>> = {},
  over: Partial<GameState> = {},
): GameState {
  const scores = initialScoreState()
  return {
    ...initialGameState,
    scenarioId: scenario.id,
    scores: { ...scores, meters: { ...scores.meters, ...meters } },
    game: { ...initialGameMeta(), difficulty, seed: 42, budgetStart: 56000, budget: 56000, floatStart: 10, floatDays: 10, weeksTotal: 22, ...game },
    ...over,
  }
}
