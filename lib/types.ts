// Shared domain types for SiteSafe.

export type UserRole = "delegate" | "trainer" | "admin";
export type SessionStatus = "in_progress" | "completed";
export type Difficulty = "foundation" | "intermediate" | "advanced";

export interface LayoutEffect {
  /** Site-plan element keys this choice adds (see SiteLayout element catalogue). */
  add: string[];
  /** Short note about the layout consequence. */
  note?: string;
}

export interface Decision {
  id: string;
  stage_id: string;
  choice_text: string;
  safety_impact: string;
  legal_impact: string;
  explanation: string;
  score_effect: number;
  risk_effect: number;
  is_ideal: boolean;
  layout_effect: LayoutEffect;
  sort_order: number;
}

export interface Stage {
  id: string;
  scenario_id: string;
  key: string;
  title: string;
  phase: string;
  learning_outcome: string;
  prompt: string;
  sort_order: number;
  decisions: Decision[];
}

export interface Scenario {
  id: string;
  slug: string;
  title: string;
  sector: string;
  difficulty: Difficulty;
  summary: string;
  description: string;
  image_key: string | null;
  is_published: boolean;
  sort_order: number;
  stages: Stage[];
}

// ── Gameplay (client) ──────────────────────────────────────────────────────

export interface ChoiceRecord {
  stage_id: string;
  stage_key: string;
  stage_title: string;
  phase: string;
  decision_id: string;
  choice_text: string;
  safety_impact: string;
  legal_impact: string;
  explanation: string;
  score_awarded: number;
  risk_effect: number;
  is_ideal: boolean;
  layout_add: string[];
}

export interface GameResult {
  scenario_id: string;
  scenario_slug: string;
  scenario_title: string;
  choices: ChoiceRecord[];
  total_score: number;
  max_score: number;
  risk_index: number;
  layout: string[];
}

// ── Reporting ──────────────────────────────────────────────────────────────

export type Band = "Fail" | "Pass" | "Merit" | "Distinction";
export type RiskRating = "Low" | "Medium" | "High" | "Critical";

export interface StageComparison {
  stage_title: string;
  phase: string;
  chosen_text: string;
  chosen_score: number;
  ideal_text: string;
  ideal_score: number;
  is_ideal: boolean;
  explanation: string;
  safety_impact: string;
  legal_impact: string;
}

export interface ScoreReport {
  total_score: number;
  max_score: number;
  percent: number;
  band: Band;
  risk_index: number;
  risk_rating: RiskRating;
  comparisons: StageComparison[];
}

// ── CPP ────────────────────────────────────────────────────────────────────

export interface CppSection {
  heading: string;
  body: string[];
}

export interface CppDraft {
  scenario_title: string;
  generated_label: string;
  sections: CppSection[];
}

// ── DB row shapes (subset used by dashboards) ──────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  organisation_id: string | null;
}

export interface SessionRow {
  id: string;
  delegate_id: string;
  scenario_id: string;
  status: SessionStatus;
  total_score: number;
  max_score: number;
  risk_index: number;
  started_at: string;
  completed_at: string | null;
}
