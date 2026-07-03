// Pure gameplay engine — no React, no I/O. Drives the in-browser game and is
// reusable for server-side recomputation/validation.

import type { ChoiceRecord, Decision, GameResult, Scenario, Stage } from "@/lib/types";

export const RISK_START = 50;

export interface GameState {
  stageIndex: number;
  choices: ChoiceRecord[];
  score: number;
  risk: number;
  layout: string[];
}

export function initialState(): GameState {
  return { stageIndex: 0, choices: [], score: 0, risk: RISK_START, layout: [] };
}

export function clampRisk(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Apply a chosen decision for the given stage, returning the next state. */
export function applyChoice(state: GameState, stage: Stage, decision: Decision): GameState {
  const record: ChoiceRecord = {
    stage_id: stage.id,
    stage_key: stage.key,
    stage_title: stage.title,
    phase: stage.phase,
    decision_id: decision.id,
    choice_text: decision.choice_text,
    safety_impact: decision.safety_impact,
    legal_impact: decision.legal_impact,
    explanation: decision.explanation,
    score_awarded: decision.score_effect,
    risk_effect: decision.risk_effect,
    is_ideal: decision.is_ideal,
    layout_add: decision.layout_effect?.add ?? [],
  };
  const layout = Array.from(new Set([...state.layout, ...record.layout_add]));
  return {
    stageIndex: state.stageIndex + 1,
    choices: [...state.choices, record],
    score: state.score + decision.score_effect,
    risk: clampRisk(state.risk + decision.risk_effect),
    layout,
  };
}

export function maxScoreFor(scenario: Scenario): number {
  return scenario.stages.reduce((total, stage) => {
    const best = Math.max(0, ...stage.decisions.map((d) => d.score_effect));
    return total + best;
  }, 0);
}

export function isComplete(state: GameState, scenario: Scenario): boolean {
  return state.stageIndex >= scenario.stages.length;
}

export function toResult(state: GameState, scenario: Scenario): GameResult {
  return {
    scenario_id: scenario.id,
    scenario_slug: scenario.slug,
    scenario_title: scenario.title,
    choices: state.choices,
    total_score: state.score,
    max_score: maxScoreFor(scenario),
    risk_index: state.risk,
    layout: state.layout,
  };
}
