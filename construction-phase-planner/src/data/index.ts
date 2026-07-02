import type { Scenario } from '../types'
import scenario1 from './scenarios/scenario1-commercial-extension.json'
import scenario2 from './scenarios/scenario2-city-refurb.json'
import scenario3 from './scenarios/scenario3-utilities-roadworks.json'

// Scenario data is authored as JSON (validated by scripts/validate-data.ts).
export const SCENARIOS: Scenario[] = [
  scenario1 as unknown as Scenario,
  scenario2 as unknown as Scenario,
  scenario3 as unknown as Scenario,
]

export function getScenario(id: string): Scenario | null {
  return SCENARIOS.find((s) => s.id === id) ?? null
}
