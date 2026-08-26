// ============================================================
// Construction Phase Planner — SMSTS Safety Challenge
// Core type system for scenarios, decisions, scoring and reports
// ============================================================

/** The seven headline score categories (0–100 each). */
export type ScoreKey =
  | 'legal'          // Legal Compliance
  | 'safety'         // Safety Control
  | 'planning'       // Construction Planning
  | 'temporaryWorks' // Temporary Works Management
  | 'environment'    // Environmental Control
  | 'programme'      // Programme Management
  | 'quality'        // Quality / Handover

/** Soft "meter" tracks that move up/down during play (start at a baseline). */
export type MeterKey =
  | 'clientConfidence'
  | 'morale'
  | 'enforcementRisk'
  | 'incidentLikelihood'
  | 'cost'

export const SCORE_KEYS: ScoreKey[] = [
  'legal', 'safety', 'planning', 'temporaryWorks', 'environment', 'programme', 'quality',
]

export const METER_KEYS: MeterKey[] = [
  'clientConfidence', 'morale', 'enforcementRisk', 'incidentLikelihood', 'cost',
]

export const SCORE_LABELS: Record<ScoreKey, string> = {
  legal: 'Legal Compliance',
  safety: 'Safety Control',
  planning: 'Construction Planning',
  temporaryWorks: 'Temporary Works',
  environment: 'Environmental Control',
  programme: 'Programme Management',
  quality: 'Quality / Handover',
}

export const METER_LABELS: Record<MeterKey, string> = {
  clientConfidence: 'Client Confidence',
  morale: 'Workforce Morale',
  enforcementRisk: 'Enforcement Risk',
  incidentLikelihood: 'Accident / Incident Likelihood',
  cost: 'Cost Pressure',
}

/** Points awarded/deducted by a decision option. Score keys are points earned
 *  (relative to the option's question max); meter keys are deltas applied to meters. */
export type ScoreImpact = Partial<Record<ScoreKey | MeterKey, number>>

export type OptionQuality = 'best' | 'partial' | 'poor' | 'unsafe'

/** Seven-tier decision classification (see docs/SCORING-MODEL.md). */
export type Classification =
  | 'excellent' | 'good' | 'acceptable' | 'weak' | 'poor' | 'unsafe' | 'critical'

export interface DecisionOption {
  id: string
  text: string
  quality: OptionQuality
  impact: ScoreImpact
  feedback: string
  /** If chosen, recorded as a critical safety failure in the final report. */
  criticalFailure?: string
  /** Optional explicit 7-tier classification; otherwise derived from quality + attainment. */
  classification?: Classification
}

/** A multiple-choice decision (also used for incident/challenge events). */
export interface DecisionStep {
  type: 'decision'
  id: string
  /** Set true for incident/challenge events — rendered as an alert. */
  isEvent?: boolean
  prompt: string
  context?: string
  options: DecisionOption[]
  /** Reference topic, e.g. "CDM 2015 — construction phase plan". */
  topic: string
  /** Corrective learning note shown after answering. */
  learningNote: string
  /** If set, the chosen answer populates this CPP section. */
  cppSection?: CppSectionId
  /** CPP text keyed by chosen option quality ('best' text is the model answer). */
  cppText?: Partial<Record<OptionQuality, string>>
  /** If set, answering adds this row to the risk register. */
  riskEntry?: {
    hazard: string
    /** Control implemented when the best answer is chosen. */
    control: string
  }
}

export interface InfoStep {
  type: 'info'
  id: string
  title: string
  body: string[]
  /** Optional bullet list of key points. */
  keyPoints?: string[]
}

// ---------- Site set-up (drag-and-drop planner) ----------

export interface GridZone {
  id: string
  label: string
  /** Grid rectangle: 0-based, inclusive. */
  x1: number; y1: number; x2: number; y2: number
  /** Tailwind-compatible background colour token, e.g. 'bg-slate-700/40'. */
  color: string
  /** Cells inside this zone cannot receive items (e.g. existing building, live road). */
  blocked?: boolean
}

export interface SiteItemRule {
  /** Site item id from the shared catalogue (see siteItems.ts). */
  itemId: string
  required: boolean
  /** Zone ids where placement earns full marks. */
  goodZones: string[]
  /** Zone ids where placement is unsafe. */
  badZones: string[]
  /** Reason shown when placed in a bad zone / model-answer note. */
  placementNote: string
}

export interface SiteSetupStep {
  type: 'siteSetup'
  id: string
  prompt: string
  grid: { cols: number; rows: number }
  zones: GridZone[]
  rules: SiteItemRule[]
  /** Points per correctly placed item are normalised by the engine. */
  topic: string
  learningNote: string
}

// ---------- Temporary works register ----------

export interface TwField {
  key: 'register' | 'design' | 'catCheck' | 'rams' | 'inspection' | 'holdPoint'
  label: string
}

export const TW_FIELDS: TwField[] = [
  { key: 'register', label: 'Add to TW register?' },
  { key: 'design', label: 'Design required?' },
  { key: 'catCheck', label: 'Design check category' },
  { key: 'rams', label: 'RAMS required?' },
  { key: 'inspection', label: 'Inspection / permit before use?' },
  { key: 'holdPoint', label: 'Hold point before loading/use?' },
]

export type TwDesignAnswer = 'bespoke' | 'standard-solution' | 'none'
export type TwCatAnswer = 'cat0' | 'cat1' | 'cat2' | 'cat3'
export type TwResponsible = 'TWC' | 'TWS' | 'PC' | 'contractor' | 'designer'

export interface TwItem {
  id: string
  name: string
  description: string
  correct: {
    register: boolean
    design: TwDesignAnswer
    catCheck: TwCatAnswer
    rams: boolean
    inspection: boolean
    holdPoint: boolean
    responsible: TwResponsible
  }
  explanation: string
}

export interface TwRegisterStep {
  type: 'twRegister'
  id: string
  prompt: string
  items: TwItem[]
  topic: string
  learningNote: string
}

// ---------- Permits ----------

export interface PermitOption {
  id: string
  name: string
}

export interface PermitStep {
  type: 'permits'
  id: string
  prompt: string
  options: PermitOption[]
  /** Ids of permits genuinely required for this scenario stage. */
  required: string[]
  explanation: string
  topic: string
  learningNote: string
}

export type Step = DecisionStep | InfoStep | SiteSetupStep | TwRegisterStep | PermitStep

// ---------- Phases & scenario ----------

export interface Phase {
  id: string
  /** 1..15 matching the required gameplay structure. */
  number: number
  title: string
  intro: string
  steps: Step[]
}

export type CppSectionId =
  | 'projectDescription' | 'dutyHolders' | 'siteRules' | 'welfare'
  | 'trafficManagement' | 'emergencyArrangements' | 'firePlan'
  | 'riskAssessmentSummary' | 'highRiskActivities' | 'temporaryWorks'
  | 'inspections' | 'permits' | 'environmentalControls'
  | 'communication' | 'trainingCompetence' | 'handover'

export const CPP_SECTIONS: { id: CppSectionId; title: string }[] = [
  { id: 'projectDescription', title: 'Project Description' },
  { id: 'dutyHolders', title: 'Duty Holders' },
  { id: 'siteRules', title: 'Site Rules' },
  { id: 'welfare', title: 'Welfare Arrangements' },
  { id: 'trafficManagement', title: 'Traffic Management' },
  { id: 'emergencyArrangements', title: 'Emergency Arrangements' },
  { id: 'firePlan', title: 'Fire Plan' },
  { id: 'riskAssessmentSummary', title: 'Risk Assessment Summary' },
  { id: 'highRiskActivities', title: 'High-Risk Activities' },
  { id: 'temporaryWorks', title: 'Temporary Works' },
  { id: 'inspections', title: 'Inspections' },
  { id: 'permits', title: 'Permits' },
  { id: 'environmentalControls', title: 'Environmental Controls' },
  { id: 'communication', title: 'Communication Arrangements' },
  { id: 'trainingCompetence', title: 'Training & Competence' },
  { id: 'handover', title: 'Handover Requirements' },
]

export interface ScenarioBrief {
  client: string
  location: string
  duration: string
  value: string
  description: string[]
  constraints: string[]
  keyRisks: string[]
}

export interface Scenario {
  id: string
  title: string
  subtitle: string
  brief: ScenarioBrief
  /** Base text for the CPP project description section. */
  cppProjectDescription: string
  phases: Phase[]
  /** Pool of extra incident events; the engine draws `eventDraw` of them in phase 12. */
  eventPool: DecisionStep[]
  eventDraw: number
  /** Model answer summary bullets shown in the final comparison. */
  modelAnswerNotes: string[]
}

// ---------- Runtime state ----------

export interface DecisionRecord {
  stepId: string
  phaseNumber: number
  prompt: string
  topic: string
  chosenOptionId: string
  quality: OptionQuality
  wasEvent: boolean
  /** ISO timestamp of when the answer was given. */
  at?: string
  /** Recovery attempt after a poor/unsafe first answer (learning modes only). */
  recoveryOptionId?: string
  recoveryQuality?: OptionQuality
}

export interface PlacementRecord {
  itemId: string
  x: number
  y: number
}

export interface TwAnswerRecord {
  itemId: string
  register?: boolean
  design?: TwDesignAnswer
  catCheck?: TwCatAnswer
  rams?: boolean
  inspection?: boolean
  holdPoint?: boolean
  responsible?: TwResponsible
}

export interface PermitAnswerRecord {
  stepId: string
  selected: string[]
}

export interface RiskRegisterRow {
  hazard: string
  control: string
  adequate: boolean
}

export interface IncidentLogRow {
  stepId: string
  prompt: string
  outcomeQuality: OptionQuality
  response: string
}

export interface ConsequenceLogRow {
  id: string
  phaseNumber: number
  severity: 'positive' | 'warning' | 'serious'
  title: string
  message: string
}

export interface ScoreState {
  /** Earned points per category. */
  earned: Record<ScoreKey, number>
  /** Max possible points per category (accumulated as questions are answered). */
  possible: Record<ScoreKey, number>
  meters: Record<MeterKey, number>
}

export interface CustomQuestion {
  id: string
  prompt: string
  options: { text: string; correct: boolean }[]
  explanation: string
}

/**
 * Play modes: learning (immediate feedback), assessment (feedback deferred to the
 * final report), tutor (learning + tutor console), demo (learning + demo script panel).
 */
export type GameMode = 'learning' | 'assessment' | 'tutor' | 'demo'

export interface GameState {
  scenarioId: string | null
  mode: GameMode
  phaseIndex: number
  stepIndex: number
  completed: boolean
  scores: ScoreState
  decisions: DecisionRecord[]
  placements: PlacementRecord[]
  twAnswers: TwAnswerRecord[]
  permitAnswers: PermitAnswerRecord[]
  riskRegister: RiskRegisterRow[]
  incidentLog: IncidentLogRow[]
  criticalFailures: string[]
  /** Ids of delayed consequences that have fired (each fires once). */
  firedConsequences: string[]
  consequenceLog: ConsequenceLogRow[]
  cpp: Partial<Record<CppSectionId, string[]>>
  /** Ids of eventPool events drawn for this run (stable across reloads). */
  drawnEventIds: string[]
  delegateName: string
  /** Delegate's own reflection, written on the final report. */
  delegateReflection: string
  /** Trainer's comments and sign-off name, written on the final report. */
  trainerComments: string
  trainerName: string
  /** Unique audit identifier for this run, shown on the report and exports. */
  runId: string | null
  startedAt: string | null
  finishedAt: string | null
}

export interface TutorState {
  enabled: boolean
  revealAnswers: boolean
  paused: boolean
  customQuestions: CustomQuestion[]
  customHazards: string[]
}

// ---------- Grading ----------

export interface GradeBand {
  min: number
  label: string
  summary: string
}

export const GRADE_BANDS: GradeBand[] = [
  { min: 90, label: 'Outstanding', summary: 'Anticipates issues, applies the hierarchy of control and evidences decisions.' },
  { min: 80, label: 'Strong', summary: 'Safe, well-planned management with minor gaps.' },
  { min: 70, label: 'Competent', summary: 'Sound control of risk; some assurance steps missed.' },
  { min: 60, label: 'Developing competence', summary: 'Immediate risks controlled, but planning and evidence need development.' },
  { min: 50, label: 'Significant improvement required', summary: 'Reactive management with material gaps.' },
  { min: 0, label: 'Insufficient evidence of competence', summary: 'Decisions did not demonstrate safe management of the project.' },
]

export const DISCLAIMER =
  'This game is an educational simulation designed to support construction safety training and ' +
  'SMSTS-style revision. It does not replace formal CITB training, official assessment, legal advice, ' +
  'competent supervision, approved RAMS, project-specific risk assessment, statutory duties or ' +
  'employer procedures.'

export const ALIGNMENT_STATEMENT =
  'SMSTS-aligned learning game, based on construction site safety principles. Supports revision and ' +
  'practical understanding. Does not replace formal CITB training, assessment or certification. ' +
  'Not endorsed or approved by CITB.'
