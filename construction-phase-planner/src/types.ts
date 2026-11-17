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

export interface DecisionOption {
  id: string
  text: string
  quality: OptionQuality
  impact: ScoreImpact
  feedback: string
  /** If chosen, recorded as a critical safety failure in the final report. */
  criticalFailure?: string
  /**
   * What later goes wrong on site if this (poor/unsafe) choice is left uncorrected.
   * Shown on a consequence card when the latent hazard this choice created "fires".
   */
  consequence?: string
  /**
   * Authored flag: true when the `consequence` describes something reportable under RIDDOR 2013
   * (a specified injury, an over-seven-day injury, an occupational disease or a dangerous
   * occurrence); false when it does not (for example a waste paperwork offence or a neighbour
   * complaint). When absent the engine falls back to a keyword check.
   */
  riddor?: boolean
  /**
   * Who would act on this failure. Defaults to 'hse'. Environmental offences (pollution, waste,
   * discharge consents) are for the environmental regulator; statutory nuisance (noise, dust,
   * mud on the road) and highway licences are for the local or highway authority. Used so that
   * an HSE notice never cites something HSE does not enforce.
   */
  regulator?: 'hse' | 'environment' | 'localAuthority' | 'highwayAuthority'
}

/** A multiple-choice decision (also used for incident/challenge events). */
export interface DecisionStep {
  type: 'decision'
  id: string
  /** Set true for incident/challenge events — rendered as an alert. */
  isEvent?: boolean
  /**
   * True when this decision is part of the shorter classroom route (about an hour): the one or
   * two decisions in each phase that carry the phase's main learning point. Practical tasks
   * (site set-up, TW register, permits, hazard hunt, sequences) are always included.
   */
  core?: boolean
  /**
   * Tutor-authored quiz question (see customToDecision in engine/game.ts). It is scored like any
   * decision but is never a site incident: no incident clock, no latent hazard, no incident-log row.
   */
  custom?: boolean
  prompt: string
  context?: string
  options: DecisionOption[]
  /**
   * Reference topic, e.g. "CDM 2015 - construction phase plan". Shown only AFTER the group has
   * answered (it often names the answer), and in reports.
   */
  topic: string
  /** Corrective learning note shown after answering. */
  learningNote: string
  /**
   * One or two open questions for the group to talk through once the answer is revealed, or when
   * the tutor pauses the game ("Who on your site would have noticed this first?").
   */
  discussion?: string[]
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

// ---------- Hazard hunt (timed site walk-round) ----------

export interface HazardObservation {
  id: string
  /** Single emoji shown on the tile. */
  icon: string
  /** What the delegate sees on the walk-round — neutral wording that does not telegraph the answer. */
  text: string
  /** True if this observation is a hazard that must be flagged. */
  hazard: boolean
  /** Why it is a hazard (and the control), or why it is acceptable. */
  explanation: string
  /** Hazards only: consequence severity if left uncontrolled. */
  severity?: 'low' | 'medium' | 'high'
}

export interface HazardHuntStep {
  type: 'hazardHunt'
  id: string
  prompt: string
  /** Scene-setting line, e.g. "Site walk-round — week 6, Tuesday 07:40". */
  location: string
  /** Base time limit in seconds (scaled by difficulty). */
  timeLimit: number
  observations: HazardObservation[]
  topic: string
  learningNote: string
}

// ---------- Sequencing (plan the order of work) ----------

export interface SequenceActivity {
  id: string
  label: string
  detail?: string
}

export interface SequenceConstraint {
  /** Activity id that must come first. */
  before: string
  /** Activity id that must come later. */
  after: string
  /** Why the order matters (shown when violated). */
  reason: string
  /** Violating a critical constraint is recorded as a critical safety failure. */
  critical?: boolean
  /** Authored flag, as DecisionOption.riddor: would the resulting incident be RIDDOR reportable? */
  riddor?: boolean
}

export interface SequenceStep {
  type: 'sequence'
  id: string
  prompt: string
  context?: string
  /** Authored in the CORRECT order; the UI shuffles them for the delegate. */
  activities: SequenceActivity[]
  /** Precedence rules used for scoring. */
  constraints: SequenceConstraint[]
  topic: string
  learningNote: string
}

export type Step =
  | DecisionStep | InfoStep | SiteSetupStep | TwRegisterStep | PermitStep
  | HazardHuntStep | SequenceStep

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

// ---------- Case study pack (what a group reads before playing inside the case study) ----------

export interface CaseStudyRole {
  id: string
  /** e.g. "Site Manager (chair)". */
  title: string
  /** What this person leads on during play and in the walk-through. */
  focus: string
}

export interface CaseStudyPack {
  /** Short label, e.g. "Case Study A". */
  reference: string
  title: string
  /** Two or three sentences a tutor can read out. */
  summary: string
  learningObjectives: string[]
  /** Paragraphs: who the client is, what is being built and why. */
  background: string[]
  /** Paragraphs: the site, its boundaries, neighbours and existing conditions. */
  siteDescription: string[]
  programme: { stage: string; weeks: string; note: string }[]
  /** Duty holders and other organisations (fictional names). */
  organisations: { role: string; name: string; note?: string }[]
  keyConstraints: string[]
  /** Roles for a group of 3 to 6 delegates; larger groups double up. */
  groupRoles: CaseStudyRole[]
  /** What the group must produce or demonstrate by the end. */
  deliverables: string[]
  /** What the group demonstrates in the end-of-game 3D site walk-through. */
  walkthroughBrief: string[]
  /** Tutor-led debrief questions. */
  discussionPrompts: string[]
  /** Environmental themes this case study exercises (kept current with published guidance). */
  environmentFocus?: string[]
}

/** The group playing a case study together on one device. */
export interface TeamInfo {
  name: string
  /** First names only (data minimisation: this is saved on a shared classroom device). */
  members: string[]
  /** CaseStudyRole.id -> member first name. */
  roles: Record<string, string>
}

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
  /** Case study pack shown before play and used by the tutor debrief. */
  caseStudy?: CaseStudyPack
}

// ---------- Runtime state ----------

import type { WalkthroughRecord } from './walkthrough/types'

export interface DecisionRecord {
  stepId: string
  phaseNumber: number
  prompt: string
  topic: string
  chosenOptionId: string
  quality: OptionQuality
  wasEvent: boolean
  confidence?: Confidence
  timedOut?: boolean
  usedLifeline?: boolean
  points?: number
  /** True for a tutor quiz question (its step is not in the scenario, so reports cannot look it up). */
  custom?: boolean
  /**
   * Stored for tutor quiz questions only, so the decision review can show what was chosen and what
   * the answer was without the step: the chosen text, its feedback, the correct answer and the note.
   */
  chosenText?: string
  chosenFeedback?: string
  bestText?: string
  learningNote?: string
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

// ---------- Game layer (difficulty, economy, consequences, points) ----------

export type Difficulty = 'learner' | 'standard' | 'expert'
export type Confidence = 'sure' | 'think' | 'guess'

/** A shortcut or poor choice that is still "live" on site and may cause an incident later. */
export interface LatentHazard {
  /** `${stepId}:${optionId}` (or `${stepId}:seq:${n}` for sequencing errors). */
  id: string
  stepId: string
  phaseNumber: number
  severity: 'minor' | 'major'
  topic: string
  /** What the delegate chose (or did). */
  choice: string
  /** What goes wrong if it fires. */
  consequence: string
  status: 'open' | 'fired' | 'rectified'
  /** Expert mode: hazards are hidden until an audit reveals them. */
  revealed: boolean
  /** Where the hazard came from. Absent on saves made before this field existed (decision or sequence). */
  source?: 'decision' | 'timeout' | 'sequence' | 'siteSetup' | 'twRegister' | 'permits' | 'hazardHunt'
  /**
   * Authored RIDDOR flag copied from the option or sequence constraint that created the hazard.
   * When absent the engine falls back to a strict keyword check of `consequence`.
   */
  riddor?: boolean
  /** The critical-failure label recorded with this hazard, if the choice was a critical failure. */
  critical?: string
  /** What closing the risk out involves (the model answer for the step), shown at the weekly review. */
  remedy?: string
}

export interface ConsequenceRecord {
  hazardId: string
  week: number
  severity: 'minor' | 'major'
  title: string
  narrative: string
  rootCause: string
  cost: number
  days: number
  riddor: boolean
  points: number
}

export interface NoticeRecord {
  kind: 'improvement' | 'prohibition'
  week: number
  /** Phase after which the notice was served (the cool-down counts site-week reports, not calendar weeks). */
  afterPhase?: number
  reason: string
  cost: number
  days: number
  points: number
}

export interface WeekReport {
  week: number
  afterPhase: number
  consequences: ConsequenceRecord[]
  notice: NoticeRecord | null
  shutdown: boolean
  safe: boolean
  points: number
  /**
   * Open risks the group can see at this review (on Expert: only those an audit has revealed).
   * A week can be `safe` (no incident, no notice) with risks still open: that is luck, not control.
   */
  openRisks?: { major: number; minor: number }
  /** True when the week was safe AND nothing known was left open: the only weeks that earn the bonus. */
  controlled?: boolean
  /** Plain-English early warning that HSE attention is building (shown before any notice is served). */
  warning?: string
  /** True for the last site-week report before handover (the pre-handover inspection). */
  final?: boolean
}

export interface ConfidenceRecord {
  stepId: string
  confidence: Confidence
  quality: OptionQuality
}

export interface PointsAward {
  /** Increments so the UI can animate each award. */
  seq: number
  amount: number
  label: string
}

export interface BonusLine {
  label: string
  points: number
}

export interface GameMeta {
  difficulty: Difficulty
  seed: number
  points: number
  streak: number
  bestStreak: number
  budgetStart: number
  budget: number
  floatStart: number
  floatDays: number
  weeksTotal: number
  week: number
  safeWeeks: number
  /** Critical failures since the last prohibition notice. */
  strikes: number
  /** Step ids behind the current strikes, so that closing out the risk can clear its strike. */
  strikeSteps?: string[]
  /** Number of critical failures already cited in an earlier HSE notice. */
  noticeMark?: number
  /**
   * Critical-failure labels that are not HSE matters (DecisionOption.regulator is the environmental
   * regulator or a local/highway authority). They never count as strikes or appear in an HSE notice.
   */
  nonHseFailures?: string[]
  /** Critical-failure labels whose risk has since been closed out or has already caused its incident. */
  settledFailures?: string[]
  lifelines: number
  lifelineSteps: string[]
  timeouts: number
  latent: LatentHazard[]
  consequences: ConsequenceRecord[]
  notices: NoticeRecord[]
  confidence: ConfidenceRecord[]
  /** Extra eventPool events injected into construction phases. */
  surpriseEvents: { phaseNumber: number; eventId: string }[]
  pendingWeek: WeekReport | null
  auditsUsed: number
  /** Phase of the weekly report in which the last site audit was commissioned (one audit per report). */
  auditedAfterPhase?: number
  /**
   * Set when the tutor's "reveal answers" was on at any point in this run. An assisted run is a
   * demonstration: it is not written to the career profile or the leaderboard.
   */
  assisted?: boolean
  shutdown: boolean
  bonuses: BonusLine[]
  lastAward: PointsAward | null
  /** Set once the result has been written to the local profile/leaderboard. */
  recorded: boolean
}

export interface HuntAnswerRecord {
  stepId: string
  flagged: string[]
  secondsLeft: number
}

export interface SequenceAnswerRecord {
  stepId: string
  order: string[]
}

export interface GameState {
  scenarioId: string | null
  phaseIndex: number
  stepIndex: number
  completed: boolean
  scores: ScoreState
  decisions: DecisionRecord[]
  placements: PlacementRecord[]
  twAnswers: TwAnswerRecord[]
  permitAnswers: PermitAnswerRecord[]
  huntAnswers: HuntAnswerRecord[]
  sequenceAnswers: SequenceAnswerRecord[]
  /** Ids of site set-up steps already submitted (a layout, even an empty one, is scored once). */
  setupDone?: string[]
  riskRegister: RiskRegisterRow[]
  incidentLog: IncidentLogRow[]
  criticalFailures: string[]
  cpp: Partial<Record<CppSectionId, string[]>>
  /** Ids of eventPool events drawn for this run (stable across reloads). */
  drawnEventIds: string[]
  delegateName: string
  startedAt: string | null
  finishedAt: string | null
  game: GameMeta
  /** Group playing together; null for a solo delegate. */
  team: TeamInfo | null
  /** End-of-game 3D site walk-through record (see src/walkthrough/types.ts). */
  walkthrough: WalkthroughRecord
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
  { min: 90, label: 'Excellent', summary: 'Strong planning across all seven disciplines.' },
  { min: 75, label: 'Good', summary: 'Safe with minor gaps.' },
  // "Developing", never "pass": the game is a learning aid, not an assessment.
  { min: 60, label: 'Developing', summary: 'Improvement required.' },
  { min: 40, label: 'Significant gaps', summary: 'Key duties and controls were missed.' },
  { min: 0, label: 'Unsafe planning', summary: 'Restart recommended.' },
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
