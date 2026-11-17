// 3D site walk-through: shared contract.
//
// The walk-through is the finale of each case study: the group tours the site they set up and
// explains it to the tutor. Phase 4 already scored the layout; the walk scores the explanation.
//
// `buildSiteModel(scenario, state)` is pure, deterministic and JSON-serialisable. The 3D scene,
// the SVG plan and the list view are three renderings of the same SiteModel, so the non-3D views
// are equivalent by construction. Only files under ./three/ may import the three.js library.
import type { GameState, Scenario } from '../types'
import type { PlacementAssessment } from '../engine/scoring'

/** x, y (up), z in metres; origin at the centre of the site grid. */
export type Vec3 = [number, number, number]

export type CheckpointId =
  | 'gate' | 'segregation' | 'welfare' | 'emergency'
  | 'logistics' | 'workzones' | 'environment' | 'public'

/** Tour order. */
export const CHECKPOINT_ORDER: CheckpointId[] = [
  'gate', 'segregation', 'welfare', 'emergency', 'logistics', 'workzones', 'environment', 'public',
]

export type ItemStatus = PlacementAssessment['status'] | 'unused'
export type Tone = 'good' | 'warn' | 'bad' | 'info'
export type ZoneKind =
  | 'road' | 'footway' | 'boundary' | 'gate' | 'building' | 'workArea'
  | 'yard' | 'drain' | 'trench' | 'crossing' | 'carPark'

/** Orbit camera about `target`; angles in degrees, distance in metres. */
export interface CameraPose { target: Vec3; yaw: number; pitch: number; distance: number }

export interface ZoneModel {
  id: string; label: string; kind: ZoneKind; blocked: boolean
  centre: Vec3
  /** Width (x) and depth (z) in metres. */
  size: [number, number]
}

export interface StructureModel {
  id: string; zoneId: string; kind: 'building' | 'frame' | 'pit'
  centre: Vec3; size: Vec3
}

interface ItemBase {
  itemId: string; label: string; checkpoint: CheckpointId; required: boolean
  /** Assessment note explaining the status (from the scenario's placement rules). */
  note: string
  /** Where the model answer puts this item (centre of its first good zone). */
  modelPosition: Vec3
}

/**
 * Ground rectangle an item occupies, centred on its `position`. `w` runs along the item's own
 * x axis and `d` along its own z axis, in metres; `yaw` (degrees about the vertical) turns that
 * frame. buildSiteModel only ever emits yaw 0 (w lies along world x) or 90 (w lies along world z).
 */
export interface Footprint { w: number; d: number; yaw: number }

/** An item the group placed. */
export interface SiteItem extends ItemBase {
  status: 'good' | 'neutral' | 'unsafe'
  /** Grid reference such as "C4" (the cell the group dropped the item on). */
  cellRef: string
  zoneLabel: string
  /** Centre of the footprint. For a linear item this is the middle of its run, not its cell. */
  position: Vec3
  footprint: Footprint
}

/** A rule item the group did not place: `missing` if required, `unused` if optional. */
export interface MissingItem extends ItemBase {
  status: 'missing' | 'unused'
  modelZoneLabel: string
}

export interface Overlay {
  id: string
  kind: 'tw' | 'permit' | 'incident' | 'openRisk' | 'notice'
  tone: Tone
  /** Short words shown with the glyph, e.g. "DO NOT USE". Status never relies on colour alone. */
  statusText: string
  title: string; detail: string
  checkpoint: CheckpointId; position: Vec3
}

/** One row of the accessible table that every view renders for a checkpoint. */
export interface WalkRow {
  id: string
  kind: 'item' | Overlay['kind']
  what: string; where: string
  status: ItemStatus | Tone
  statusText: string
  why: string
}

export interface Checkpoint {
  id: CheckpointId; title: string; camera: CameraPose
  itemIds: string[]; overlayIds: string[]
  /** Two short prompts the presenters answer out loud. */
  prompts: string[]
  /** What the tutor is marking at this stop. */
  criterion: string
  rows: WalkRow[]
  /** One-sentence assessment shown at Reveal. */
  assessment: string
  /** True when the stop has an unsafe or missing item, or a bad overlay. */
  flawed: boolean
}

export interface SiteModel {
  version: 1
  scenarioId: string
  shutdown: boolean
  world: { cols: number; rows: number; cell: number; width: number; depth: number }
  zones: ZoneModel[]
  structures: StructureModel[]
  items: SiteItem[]
  missing: MissingItem[]
  overlays: { temporaryWorks: Overlay[]; permits: Overlay[]; incidents: Overlay[] }
  /** In tour order. */
  checkpoints: Checkpoint[]
  overview: CameraPose
}

export type BuildSiteModel = (scenario: Scenario, state: GameState) => SiteModel

// ---------- Walk record (persisted in GameState.walkthrough) ----------

export type RubricId = CheckpointId | 'ownership' | 'management'
export const RUBRIC_ORDER: RubricId[] = [...CHECKPOINT_ORDER, 'ownership', 'management']
export type Mark = 0 | 1 | 2 | 3
export type WalkCall = 'stand' | 'change'
export type WalkStatus = 'pending' | 'inProgress' | 'signedOff' | 'actionsRequired' | 'notYet' | 'skipped'

export interface WalkSignOff { by: 'tutor' | 'self'; name: string; actions: string; at: string }

export interface WalkthroughRecord {
  status: WalkStatus
  attempt: number
  /** -1 = briefing, 0..scope.length-1 = checkpoint stop, scope.length = sign-off. */
  index: number
  /** Checkpoints the tutor chose to assess, in tour order. */
  scope: CheckpointId[]
  /** First names only; marks belong to the group, never to a person. */
  presenters: string[]
  visited: CheckpointId[]
  revealed: CheckpointId[]
  calls: Partial<Record<CheckpointId, WalkCall>>
  rubric: Partial<Record<RubricId, Mark>>
  notes: Partial<Record<RubricId, string>>
  signOff: WalkSignOff | null
  /** Points already paid into game.points for this walk, so a re-walk only pays the difference. */
  pointsAwarded: number
  /**
   * Revealed checkpoints whose reveal showed a flaw (set by WALK_REVEAL). A call is correct when
   * `change` was called on one of these, or `stand` on a revealed checkpoint that is not listed.
   * Optional so records saved before this field existed still type-check; read it as `?? []`.
   */
  flawed?: CheckpointId[]
}

export type WalkOutcome = 'signedOff' | 'actionsRequired' | 'notYet'

/** Static definition of a checkpoint (see checkpoints.ts); buildSiteModel adds the site-specific parts. */
export interface CheckpointDef {
  id: CheckpointId
  title: string
  /** Catalogue item ids (src/data/siteItems.ts) explained at this stop. */
  itemIds: string[]
  prompts: [string, string]
  criterion: string
}

/** One of the ten things the tutor marks 0 to 3. */
export interface RubricCriterion { id: RubricId; title: string; criterion: string }

export type WalkAction =
  | { type: 'WALK_START'; scope: CheckpointId[]; presenters: string[] }
  | { type: 'WALK_GOTO'; index: number }
  | { type: 'WALK_CALL'; checkpoint: CheckpointId; call: WalkCall }
  | { type: 'WALK_REVEAL'; checkpoint: CheckpointId; flawed: boolean }
  | { type: 'WALK_MARK'; rubric: RubricId; mark: Mark; note?: string }
  | { type: 'WALK_SIGNOFF'; outcome: WalkOutcome; by: 'tutor' | 'self'; name: string; actions: string; at: string }
  | { type: 'WALK_SKIP' }
  | { type: 'WALK_RESTART' }

// ---------- Per-device viewing preferences (not part of the saved game) ----------

export type WalkView = '3d' | 'plan' | 'list'

export interface WalkPrefs {
  view: WalkView
  /** `glide` eases the camera between stops; `jump` cuts with a short fade. */
  movement: 'glide' | 'jump'
  /** Presenter mode: large type for a projector. */
  presenter: boolean
  brightRoom: boolean
  shortcuts: boolean
}
