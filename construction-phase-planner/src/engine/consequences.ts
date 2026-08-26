// Delayed-consequence engine: earlier decisions change what the delegate meets
// later in the project. Rules are generic across scenarios, proportionate and
// educational; each fires at most once per run, at entry to its trigger phase.
import type { GameState, MeterKey } from '../types'

export interface DelayedConsequence {
  id: string
  /** Phase number at whose start the consequence fires. */
  firesAtPhase: number
  severity: 'positive' | 'warning' | 'serious'
  title: string
  message: string
  /** Meter deltas applied when the consequence fires. */
  meters: Partial<Record<MeterKey, number>>
  /** Condition evaluated against the run so far. */
  trigger: (state: GameState) => boolean
}

const decidedBadly = (state: GameState, stepId: string) =>
  state.decisions.some((d) => d.stepId === stepId && (d.quality === 'poor' || d.quality === 'unsafe'))

/** Attainment ratio (earned/possible) in a score category; 1 when nothing was assessable yet. */
const ratio = (state: GameState, key: 'temporaryWorks' | 'environment' | 'safety') => {
  const possible = state.scores.possible[key]
  return possible > 0 ? state.scores.earned[key] / possible : 1
}

export const DELAYED_CONSEQUENCES: DelayedConsequence[] = [
  {
    id: 'welfare-grievance',
    firesAtPhase: 13,
    severity: 'warning',
    title: 'Workforce grievance over welfare',
    message:
      'Your early welfare decisions are back on the table: the workforce has raised a collective ' +
      'grievance about facilities, and two gangs are threatening to walk. Poor day-one welfare ' +
      'planning surfaces as a relations problem months later.',
    meters: { morale: -10, cost: 3 },
    trigger: (s) => decidedBadly(s, 'p5-d1'),
  },
  {
    id: 'near-miss-cluster',
    firesAtPhase: 12,
    severity: 'serious',
    title: 'Near-miss cluster reported',
    message:
      'Supervisors report a cluster of near misses this fortnight. Your accumulated risk decisions ' +
      'have raised the site\'s accident likelihood — the warnings are arriving before the injury does.',
    meters: { morale: -5 },
    trigger: (s) => s.scores.meters.incidentLikelihood >= 45,
  },
  {
    id: 'enforcement-letter',
    firesAtPhase: 13,
    severity: 'serious',
    title: 'Regulator follow-up letter',
    message:
      'A letter from the enforcing authority requests your inspection records and RAMS for review. ' +
      'Earlier compliance gaps have put the project on their radar — expect closer attention and ' +
      'recoverable costs if material breaches are found.',
    meters: { clientConfidence: -8, cost: 5 },
    trigger: (s) => s.scores.meters.enforcementRisk >= 45,
  },
  {
    id: 'client-reporting-regime',
    firesAtPhase: 14,
    severity: 'warning',
    title: 'Client imposes enhanced reporting',
    message:
      'The client\'s confidence has dropped far enough that they are imposing weekly directors\' ' +
      'reviews and enhanced reporting for the remainder of the project — administration you created ' +
      'through earlier delivery and communication choices.',
    meters: { cost: 7 },
    trigger: (s) => s.scores.meters.clientConfidence <= 45,
  },
  {
    id: 'investigation-opened',
    firesAtPhase: 14,
    severity: 'serious',
    title: 'Formal investigation under way',
    message:
      'The critical failure earlier in the project is now a formal investigation: statements, ' +
      'document requests and legal involvement are consuming management time as you try to close ' +
      'out the job. Critical failures never stay in the phase where they happened.',
    meters: { enforcementRisk: 10, cost: 10 },
    trigger: (s) => s.criticalFailures.length > 0,
  },
  {
    id: 'tw-standing-scare',
    firesAtPhase: 11,
    severity: 'serious',
    title: 'Temporary works stood without checks',
    message:
      'A subcontractor has propped a slab and struck formwork to their own programme — nobody ' +
      'could produce a permit to load or strike. Your loose grip on temporary works control ' +
      'earlier in the job set the tone; the TWC is now re-inspecting everything standing.',
    meters: { incidentLikelihood: 8, cost: 4 },
    trigger: (s) => ratio(s, 'temporaryWorks') < 0.5,
  },
  {
    id: 'community-complaint',
    firesAtPhase: 11,
    severity: 'warning',
    title: 'Neighbourhood complaint escalated',
    message:
      'Residents have complained to the council about dust and out-of-hours noise, copying the ' +
      'client in. Weak environmental controls earlier in the project have become a public-relations ' +
      'problem — the council is asking for your Section 61 position and dust management plan.',
    meters: { clientConfidence: -6, enforcementRisk: 5 },
    trigger: (s) => ratio(s, 'environment') < 0.5,
  },
  {
    id: 'supply-chain-strain',
    firesAtPhase: 12,
    severity: 'warning',
    title: 'Commercial pressure biting',
    message:
      'The commercial team flags that the project is burning contingency: rework, standing time and ' +
      'recovery measures from earlier decisions have used the buffer, and two suppliers have moved ' +
      'you to payment-on-order. Every future slip now costs real money.',
    meters: { morale: -4 },
    trigger: (s) => s.scores.meters.cost >= 60,
  },
  {
    id: 'strong-foundations',
    firesAtPhase: 10,
    severity: 'positive',
    title: 'Planning is paying off',
    message:
      'Your disciplined pre-construction and set-up decisions are visible on site: inductions are ' +
      'smooth, deliveries flow, and the workforce trusts the plan. Good early planning is buying you ' +
      'productivity exactly when the high-risk work starts.',
    meters: { morale: 6, clientConfidence: 6 },
    trigger: (s) =>
      s.decisions.filter((d) => d.phaseNumber <= 6).length >= 5 &&
      s.decisions.filter((d) => d.phaseNumber <= 6 && (d.quality === 'poor' || d.quality === 'unsafe')).length === 0,
  },
  {
    id: 'inspection-passed',
    firesAtPhase: 13,
    severity: 'positive',
    title: 'External inspection passed',
    message:
      'A client-appointed safety auditor has walked the site and left complimentary: registers ' +
      'current, permits live, temporary works controlled. Evidence-led management shows.',
    meters: { clientConfidence: 8 },
    trigger: (s) =>
      s.scores.meters.enforcementRisk < 30 &&
      s.scores.meters.incidentLikelihood < 30 &&
      s.criticalFailures.length === 0,
  },
]

/** Consequences due to fire at entry to the given phase that haven't fired yet. */
export function dueConsequences(state: GameState, phaseNumber: number): DelayedConsequence[] {
  return DELAYED_CONSEQUENCES.filter(
    (c) =>
      c.firesAtPhase === phaseNumber &&
      !state.firedConsequences.includes(c.id) &&
      c.trigger(state),
  )
}
