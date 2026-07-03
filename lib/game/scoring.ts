// Scoring, banding and chosen-vs-ideal comparison. Pure functions.

import type {
  Band,
  GameResult,
  RiskRating,
  Scenario,
  ScoreReport,
  StageComparison,
} from "@/lib/types";

export function bandFor(percent: number): Band {
  if (percent >= 85) return "Distinction";
  if (percent >= 70) return "Merit";
  if (percent >= 50) return "Pass";
  return "Fail";
}

export function riskRatingFor(riskIndex: number): RiskRating {
  if (riskIndex <= 30) return "Low";
  if (riskIndex <= 55) return "Medium";
  if (riskIndex <= 80) return "High";
  return "Critical";
}

export function percentFor(total: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((total / max) * 100)));
}

/** Build the full score report by comparing the delegate's choices to the ideal control at each stage. */
export function buildReport(result: GameResult, scenario: Scenario): ScoreReport {
  const comparisons: StageComparison[] = scenario.stages.map((stage) => {
    const chosen = result.choices.find((c) => c.stage_id === stage.id);
    const ideal = stage.decisions.find((d) => d.is_ideal) ?? stage.decisions[0];
    return {
      stage_title: stage.title,
      phase: stage.phase,
      chosen_text: chosen?.choice_text ?? "No decision recorded",
      chosen_score: chosen?.score_awarded ?? 0,
      ideal_text: ideal?.choice_text ?? "",
      ideal_score: ideal?.score_effect ?? 0,
      is_ideal: chosen?.is_ideal ?? false,
      explanation: chosen?.explanation ?? "",
      safety_impact: chosen?.safety_impact ?? "",
      legal_impact: chosen?.legal_impact ?? "",
    };
  });

  const percent = percentFor(result.total_score, result.max_score);
  return {
    total_score: result.total_score,
    max_score: result.max_score,
    percent,
    band: bandFor(percent),
    risk_index: result.risk_index,
    risk_rating: riskRatingFor(result.risk_index),
    comparisons,
  };
}
