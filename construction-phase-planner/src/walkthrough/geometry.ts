// Pure geometry for the site walk-through: grid to world, zone classification, item footprints
// and the orbit camera. No three.js and no DOM, so the 3D scene, the SVG plan and the tests all
// share one set of numbers.
import type { GridZone } from '../types'
import type { CameraPose, Footprint, StructureModel, Vec3, ZoneKind } from './types'

/** Side of one grid cell in metres. A 12 x 9 grid is a 48 m x 36 m site. */
export const CELL = 4

export interface GridSize { cols: number; rows: number }
export interface Cell { x: number; y: number }
export interface World { cols: number; rows: number; cell: number; width: number; depth: number }

/** Round to the millimetre and never return -0 (which JSON would silently turn into 0). */
export const round3 = (v: number): number => Math.round(v * 1000) / 1000 + 0

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const rad = (deg: number) => (deg * Math.PI) / 180

export function worldFor(grid: GridSize): World {
  return { cols: grid.cols, rows: grid.rows, cell: CELL, width: grid.cols * CELL, depth: grid.rows * CELL }
}

/** Centre of a grid cell. Grid column 0 is -x (west), grid row 0 is -z (the top of the plan). */
export function cellToWorld(x: number, y: number, grid: GridSize): Vec3 {
  return [round3((x - grid.cols / 2 + 0.5) * CELL), 0, round3((y - grid.rows / 2 + 0.5) * CELL)]
}

/** The grid cell under a world position, clamped to the grid. */
export function worldToCell(p: Vec3, grid: GridSize): Cell {
  return {
    x: clamp(Math.floor(p[0] / CELL + grid.cols / 2), 0, grid.cols - 1),
    y: clamp(Math.floor(p[2] / CELL + grid.rows / 2), 0, grid.rows - 1),
  }
}

function columnLetters(x: number): string {
  let n = Math.max(0, Math.floor(x))
  let out = ''
  do {
    out = String.fromCharCode(65 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}

/** Grid reference as printed on the plan edges: column letter then row number, e.g. (2, 3) is "C4". */
export function cellRef(x: number, y: number): string {
  return `${columnLetters(x)}${Math.max(0, Math.floor(y)) + 1}`
}

export function isInsideWorld(p: Vec3, world: Pick<World, 'width' | 'depth'>, margin = 0): boolean {
  return Math.abs(p[0]) <= world.width / 2 - margin + 1e-9 && Math.abs(p[2]) <= world.depth / 2 - margin + 1e-9
}

export function clampToWorld(p: Vec3, world: Pick<World, 'width' | 'depth'>, margin = 0): Vec3 {
  const hx = Math.max(0, world.width / 2 - margin)
  const hz = Math.max(0, world.depth / 2 - margin)
  return [round3(clamp(p[0], -hx, hx)), round3(p[1]), round3(clamp(p[2], -hz, hz))]
}

// ---------- Zones ----------

type ZoneLike = Pick<GridZone, 'id' | 'label'> & { blocked?: boolean }

// First match wins, so the order matters: "Roadside drain / gully" is a drain, not a road;
// "Site gate off the lane" is a gate; "Site compound (car park corner)" is a yard.
const ZONE_KEYWORDS: { rx: RegExp; kind: ZoneKind | 'structure' }[] = [
  { rx: /drain|gully|sewer|watercourse|culvert/, kind: 'drain' },
  { rx: /crossing/, kind: 'crossing' },
  { rx: /trench|excavat|chamber|shaft|manhole|\bpit\b/, kind: 'trench' },
  { rx: /\bgate\b|entrance|access point/, kind: 'gate' },
  { rx: /compound|yard|laydown|storage/, kind: 'yard' },
  { rx: /car[ -]?park|parking/, kind: 'carPark' },
  { rx: /boundary|hoarding|perimeter|fence/, kind: 'boundary' },
  { rx: /footpath|footway|pavement|pedestrian|gantry|walkway/, kind: 'footway' },
  { rx: /road|street|lane|carriageway|highway|traffic/, kind: 'road' },
  { rx: /building|shop|office|annexe|extension|footprint|new-build|structure|frontage|house|school|store|warehouse|block/, kind: 'structure' },
]

/** Kind inferred from the id and label keywords, or null when nothing matched. */
export function zoneKindByKeyword(zone: ZoneLike): ZoneKind | null {
  const text = `${zone.id} ${zone.label}`.toLowerCase()
  const hit = ZONE_KEYWORDS.find((k) => k.rx.test(text))
  if (!hit) return null
  // A structure nobody may place items in is an occupied building; one the group works in is a work area.
  if (hit.kind === 'structure') return zone.blocked ? 'building' : 'workArea'
  return hit.kind
}

/** Kind of a set-up zone. Never fails: an unrecognised zone is a building if blocked, else open yard. */
export function zoneKind(zone: ZoneLike): ZoneKind {
  return zoneKindByKeyword(zone) ?? (zone.blocked ? 'building' : 'yard')
}

/** A zone's rectangle clipped to the grid, as a centre and a [width, depth] in metres. */
export function zoneRect(zone: Pick<GridZone, 'x1' | 'y1' | 'x2' | 'y2'>, grid: GridSize): { centre: Vec3; size: [number, number] } {
  const x1 = clamp(Math.min(zone.x1, zone.x2), 0, grid.cols - 1)
  const x2 = clamp(Math.max(zone.x1, zone.x2), 0, grid.cols - 1)
  const y1 = clamp(Math.min(zone.y1, zone.y2), 0, grid.rows - 1)
  const y2 = clamp(Math.max(zone.y1, zone.y2), 0, grid.rows - 1)
  return {
    centre: [round3(((x1 + x2 + 1) / 2 - grid.cols / 2) * CELL), 0, round3(((y1 + y2 + 1) / 2 - grid.rows / 2) * CELL)],
    size: [(x2 - x1 + 1) * CELL, (y2 - y1 + 1) * CELL],
  }
}

// ---------- Footprints ----------

/** Items that run the length of their zone, with the width of the run in metres. */
export const LINEAR_ITEMS: Record<string, number> = {
  hoarding: 0.4,
  'pedestrian-route': 1.2,
  'vehicle-route': 3.5,
  'public-protection': 2.4,
  'noise-barrier': 0.4,
}

export const isLinearItem = (itemId: string): boolean => Object.prototype.hasOwnProperty.call(LINEAR_ITEMS, itemId)

/**
 * Where an item sits and how much ground it covers. A linear item stretches along the long axis
 * of `zone` through the cell it was dropped on; everything else fills its one cell.
 */
export function footprintFor(
  itemId: string,
  cell: Cell,
  zone: Pick<GridZone, 'x1' | 'y1' | 'x2' | 'y2'> | null,
  grid: GridSize,
): { position: Vec3; footprint: Footprint } {
  const x = clamp(Math.floor(cell.x), 0, grid.cols - 1)
  const y = clamp(Math.floor(cell.y), 0, grid.rows - 1)
  const at = cellToWorld(x, y, grid)
  if (!isLinearItem(itemId) || !zone) return { position: at, footprint: { w: CELL, d: CELL, yaw: 0 } }
  const rect = zoneRect(zone, grid)
  const alongX = rect.size[0] >= rect.size[1]
  return alongX
    ? { position: [rect.centre[0], 0, at[2]], footprint: { w: rect.size[0], d: LINEAR_ITEMS[itemId], yaw: 0 } }
    : { position: [at[0], 0, rect.centre[2]], footprint: { w: rect.size[1], d: LINEAR_ITEMS[itemId], yaw: 90 } }
}

/** World-axis extent [along x, along z] of a footprint, for the plan view. */
export function footprintExtent(fp: Footprint): [number, number] {
  const quarterTurns = Math.round(fp.yaw / 90)
  return quarterTurns % 2 === 0 ? [fp.w, fp.d] : [fp.d, fp.w]
}

// ---------- Camera ----------

/** Fixed pitch of every checkpoint pose, in degrees above the horizon. */
export const CHECKPOINT_PITCH = 35
export const CAMERA_DISTANCE = { min: 16, max: 40, base: 14, perSpread: 1.6 }
/**
 * The view the poses are checked against: 60 degrees vertical in a 4:3 frame. A wider frame
 * (16:9) only shows more, so a renderer using at least this field of view shows every item
 * that `sees()` reports.
 */
export const CHECK_FRUSTUM = { vfov: 60, aspect: 4 / 3 }
/** Height above its ground position at which an item is "seen" (roughly where its marker floats). */
export const SIGHT_HEIGHT = 1.2
/** Yaw candidates, in order of preference when several see the same number of items. */
export const YAW_ORDER = [0, 45, 315, 90, 270, 135, 225, 180]

/**
 * Eye position of an orbit pose. Yaw 0 puts the camera on the +z side of the target looking
 * towards -z, which matches the plan view (west on the left); yaw 90 puts it on the +x side.
 */
export function poseToEye(pose: CameraPose): Vec3 {
  const flat = pose.distance * Math.cos(rad(pose.pitch))
  return [
    round3(pose.target[0] + flat * Math.sin(rad(pose.yaw))),
    round3(pose.target[1] + pose.distance * Math.sin(rad(pose.pitch))),
    round3(pose.target[2] + flat * Math.cos(rad(pose.yaw))),
  ]
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const unit = (a: Vec3): Vec3 => {
  const len = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / len, a[1] / len, a[2] / len]
}

/** True if `p` lies inside the frame of a camera at `pose` (ignoring anything in the way). */
export function inFrame(pose: CameraPose, p: Vec3, frustum = CHECK_FRUSTUM): boolean {
  const eye = poseToEye(pose)
  const forward = unit(sub(pose.target, eye))
  const right = unit(cross(forward, [0, 1, 0]))
  const up = cross(right, forward)
  const v = sub(p, eye)
  const depth = dot(v, forward)
  if (depth <= 0.1) return false
  const tanV = Math.tan(rad(frustum.vfov / 2))
  return Math.abs(dot(v, up) / depth) <= tanV && Math.abs(dot(v, right) / depth) <= tanV * frustum.aspect
}

/** True if the straight line from `a` to `b` passes through the box (slab test). */
export function segmentHitsBox(a: Vec3, b: Vec3, box: Pick<StructureModel, 'centre' | 'size'>): boolean {
  let tEnter = 0
  let tExit = 1
  for (let i = 0; i < 3; i++) {
    const lo = box.centre[i] - box.size[i] / 2
    const hi = box.centre[i] + box.size[i] / 2
    const d = b[i] - a[i]
    if (Math.abs(d) < 1e-9) {
      if (a[i] < lo || a[i] > hi) return false
      continue
    }
    const t1 = (lo - a[i]) / d
    const t2 = (hi - a[i]) / d
    tEnter = Math.max(tEnter, Math.min(t1, t2))
    tExit = Math.min(tExit, Math.max(t1, t2))
    if (tEnter > tExit) return false
  }
  return true
}

const solid = (structures: StructureModel[]) => structures.filter((s) => s.kind === 'building')

/** True if a ground position is under the roof of an occupied building. */
export function insideBuilding(p: Vec3, structures: StructureModel[]): boolean {
  return solid(structures).some((s) => Math.abs(p[0] - s.centre[0]) <= s.size[0] / 2 && Math.abs(p[2] - s.centre[2]) <= s.size[2] / 2)
}

/**
 * True if a camera at `pose` shows the item standing at ground position `p`: it is in frame and
 * no occupied building stands between the eye and the item. Frames and pits are open, so only
 * `building` structures block the view.
 */
export function sees(pose: CameraPose, p: Vec3, structures: StructureModel[], frustum = CHECK_FRUSTUM): boolean {
  const aim: Vec3 = [p[0], p[1] + SIGHT_HEIGHT, p[2]]
  if (!inFrame(pose, aim, frustum)) return false
  const eye = poseToEye(pose)
  return !solid(structures).some((s) => segmentHitsBox(eye, aim, s))
}

/** Number of `points` a camera at `pose` shows. */
export function seenCount(pose: CameraPose, points: Vec3[], structures: StructureModel[]): number {
  return points.reduce((n, p) => n + (sees(pose, p, structures) ? 1 : 0), 0)
}

export interface CameraOptions {
  structures?: StructureModel[]
  /** Yaw candidates in order of preference; defaults to YAW_ORDER. */
  prefer?: number[]
  /** Pose returned when there is nothing to look at. */
  fallback?: CameraPose
}

const flatDistance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[2] - b[2])

function bestYaw(target: Vec3, pitch: number, points: Vec3[], structures: StructureModel[], prefer: number[]): { pose: CameraPose; seen: number } {
  const spread = Math.max(...points.map((p) => flatDistance(p, target)))
  const distance = round3(clamp(CAMERA_DISTANCE.perSpread * spread + CAMERA_DISTANCE.base, CAMERA_DISTANCE.min, CAMERA_DISTANCE.max))
  let best: { pose: CameraPose; seen: number } = { pose: { target, yaw: prefer[0], pitch, distance }, seen: -1 }
  for (const yaw of prefer) {
    const pose: CameraPose = { target, yaw, pitch, distance }
    const seen = seenCount(pose, points, structures)
    if (seen > best.seen) best = { pose, seen }
  }
  return best
}

/** Steeper pitches tried, in order, only when the standard pose cannot show everything. */
export const FALLBACK_PITCHES = [45, 55, 65]

/**
 * Camera pose for a checkpoint: aim at the centroid of the positions it covers (or the nearest of
 * them, if the centroid is inside a building), stand back far enough to take in their spread, and
 * of eight compass directions pick the one that shows the most.
 *
 * A layout scattered across the whole site can defeat that rule (about one stop in a hundred in
 * random layouts). Only then are other poses tried: the same rule aimed at the middle of the
 * positions' bounding box, then looking down more steeply. The first pose that shows everything
 * wins; if none does, the one that shows the most.
 */
export function cameraFor(points: Vec3[], options: CameraOptions = {}): CameraPose {
  const structures = options.structures ?? []
  const prefer = options.prefer?.length ? options.prefer : YAW_ORDER
  if (points.length === 0) {
    return options.fallback ?? { target: [0, 0, 0], yaw: prefer[0], pitch: CHECKPOINT_PITCH, distance: CAMERA_DISTANCE.max }
  }
  const nearestTo = (q: Vec3): Vec3 => {
    const p = points.reduce((best, c) => (flatDistance(c, q) < flatDistance(best, q) ? c : best), points[0])
    return [p[0], 0, p[2]]
  }
  const clear = (q: Vec3): Vec3 => (insideBuilding(q, structures) ? nearestTo(q) : q)
  const centroid: Vec3 = [
    round3(points.reduce((s, p) => s + p[0], 0) / points.length),
    0,
    round3(points.reduce((s, p) => s + p[2], 0) / points.length),
  ]
  const xs = points.map((p) => p[0])
  const zs = points.map((p) => p[2])
  const boxCentre: Vec3 = [round3((Math.min(...xs) + Math.max(...xs)) / 2), 0, round3((Math.min(...zs) + Math.max(...zs)) / 2)]

  let best = bestYaw(clear(centroid), CHECKPOINT_PITCH, points, structures, prefer)
  if (best.seen === points.length) return best.pose
  const alternatives: [Vec3, number][] = [
    [clear(boxCentre), CHECKPOINT_PITCH],
    ...FALLBACK_PITCHES.flatMap((pitch): [Vec3, number][] => [[clear(centroid), pitch], [clear(boxCentre), pitch]]),
  ]
  for (const [target, pitch] of alternatives) {
    const candidate = bestYaw(target, pitch, points, structures, prefer)
    if (candidate.seen > best.seen) best = candidate
    if (best.seen === points.length) break
  }
  return best.pose
}

/** Whole-site pose for the start of the tour and for sign-off. */
export function overviewFor(world: Pick<World, 'width' | 'depth'>): CameraPose {
  const distance = round3(clamp(0.9 * Math.max(world.width, world.depth) + 12, 20, 60))
  return { target: [0, 0, 0], yaw: 0, pitch: 55, distance }
}
