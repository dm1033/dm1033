// buildSiteModel: the one description of the group's site that the 3D scene, the SVG plan and
// the list view all render. Pure, deterministic and JSON-serialisable: no dates, no randomness,
// no class instances, no undefined fields.
import type { GameState, GridZone, PlacementRecord, Scenario, SiteItemRule, SiteSetupStep } from '../types'
import { assessPlacements, type PlacementAssessment } from '../engine/scoring'
import { SITE_ITEM_MAP } from '../data/siteItems'
import { CHECKPOINTS, checkpointForItem } from './checkpoints'
import {
  CELL, YAW_ORDER, cameraFor, cellRef, cellToWorld, footprintFor, isLinearItem, overviewFor, round3,
  worldFor, worldToCell, zoneKind, zoneRect, type Cell, type GridSize,
} from './geometry'
import { allOverlays, buildOverlays } from './overlays'
import { STATUS_MARK } from './statusMarks'
import type {
  Checkpoint, CheckpointId, MissingItem, Overlay, SiteItem, SiteModel, StructureModel, Vec3, WalkRow, ZoneModel,
} from './types'

/** Grid used when a scenario has no site set-up step at all (none of the three shipped ones). */
const DEFAULT_GRID: GridSize = { cols: 12, rows: 9 }

const BUILDING_HEIGHT = 8
const FRAME_HEIGHT = 6
const PIT_DEPTH = 2
/** Gap between a structure and the edge of its zone, so walls do not sit on the zone boundary. */
const STRUCTURE_INSET = 0.5

/** The public stop is seen from outside, so it tries the far (top-of-plan) side first. */
const PUBLIC_YAW_ORDER = [180, 135, 225, 90, 270, 45, 315, 0]

const isSetup = (s: { type: string }): s is SiteSetupStep => s.type === 'siteSetup'

/** The scenario's site set-up step: the one in phase 4, else the first one anywhere, else null. */
export function siteSetupStep(scenario: Scenario): SiteSetupStep | null {
  const inPhase4 = scenario.phases.find((p) => p.number === 4)?.steps.find(isSetup)
  if (inPhase4) return inPhase4
  for (const phase of scenario.phases) {
    const step = phase.steps.find(isSetup)
    if (step) return step
  }
  return null
}

// ---------- Zones and structures ----------

function zoneModels(step: SiteSetupStep): ZoneModel[] {
  return step.zones.map((z) => ({
    id: z.id,
    label: z.label,
    kind: zoneKind(z),
    blocked: !!z.blocked,
    ...zoneRect(z, step.grid),
  }))
}

function structureFor(zone: ZoneModel): StructureModel | null {
  const [w, d] = [Math.max(1, zone.size[0] - 2 * STRUCTURE_INSET), Math.max(1, zone.size[1] - 2 * STRUCTURE_INSET)]
  const at = (y: number): Vec3 => [zone.centre[0], y, zone.centre[2]]
  const base = { id: `structure:${zone.id}`, zoneId: zone.id }
  if (zone.kind === 'building') return { ...base, kind: 'building', centre: at(BUILDING_HEIGHT / 2), size: [w, BUILDING_HEIGHT, d] }
  if (zone.kind === 'workArea') return { ...base, kind: 'frame', centre: at(FRAME_HEIGHT / 2), size: [w, FRAME_HEIGHT, d] }
  // A pit is cut into the ground: its box lies below y = 0.
  if (zone.kind === 'trench') return { ...base, kind: 'pit', centre: at(-PIT_DEPTH / 2), size: [w, PIT_DEPTH, d] }
  return null
}

// ---------- Cells and zones ----------

const inZone = (z: GridZone, c: Cell) => c.x >= z.x1 && c.x <= z.x2 && c.y >= z.y1 && c.y <= z.y2
const zoneArea = (z: GridZone) => (z.x2 - z.x1 + 1) * (z.y2 - z.y1 + 1)
const zoneLength = (z: GridZone) => Math.max(z.x2 - z.x1, z.y2 - z.y1) + 1

/** The zones that explain an item's status at `cell`: its good zones if good, bad if unsafe, else all. */
function decidingZones(step: SiteSetupStep, rule: SiteItemRule, cell: Cell, status: SiteItem['status']): GridZone[] {
  const here = step.zones.filter((z) => inZone(z, cell))
  const decided = status === 'good'
    ? here.filter((z) => rule.goodZones.includes(z.id))
    : status === 'unsafe' ? here.filter((z) => rule.badZones.includes(z.id)) : here
  return decided.length ? decided : here
}

// Array.prototype.sort is stable, so ties keep the scenario's own zone order.
const mostSpecific = (zones: GridZone[]): GridZone | null => [...zones].sort((a, b) => zoneArea(a) - zoneArea(b))[0] ?? null
const longest = (zones: GridZone[]): GridZone | null => [...zones].sort((a, b) => zoneLength(b) - zoneLength(a))[0] ?? null

function blockedCells(step: SiteSetupStep): Set<string> {
  const set = new Set<string>()
  for (const z of step.zones) {
    if (!z.blocked) continue
    for (let x = z.x1; x <= z.x2; x++) for (let y = z.y1; y <= z.y2; y++) set.add(`${x},${y}`)
  }
  return set
}

interface ModelSpot { position: Vec3; zoneLabel: string }

/**
 * Where the model answer puts each rule item: a cell of its first good zone, as near that zone's
 * centre as possible, that is not also unsafe for the item. Items that share a good zone are
 * given different cells so their "model answer" ghosts do not stack on one spot.
 */
function modelSpots(step: SiteSetupStep): Map<string, ModelSpot> {
  const out = new Map<string, ModelSpot>()
  const blocked = blockedCells(step)
  const taken = new Set<string>()
  const key = (c: Cell) => `${c.x},${c.y}`
  for (const rule of step.rules) {
    if (out.has(rule.itemId)) continue
    const zone = rule.goodZones.map((id) => step.zones.find((z) => z.id === id)).find((z): z is GridZone => !!z) ?? null
    if (!zone) {
      out.set(rule.itemId, { position: [0, 0, 0], zoneLabel: 'the site' })
      continue
    }
    const mid = { x: (zone.x1 + zone.x2) / 2, y: (zone.y1 + zone.y2) / 2 }
    const cells: Cell[] = []
    for (let y = Math.max(0, zone.y1); y <= Math.min(step.grid.rows - 1, zone.y2); y++) {
      for (let x = Math.max(0, zone.x1); x <= Math.min(step.grid.cols - 1, zone.x2); x++) cells.push({ x, y })
    }
    const usable = cells
      .filter((c) => !blocked.has(key(c)))
      .filter((c) => !step.zones.some((z) => rule.badZones.includes(z.id) && inZone(z, c)))
      .sort((a, b) => Math.hypot(a.x - mid.x, a.y - mid.y) - Math.hypot(b.x - mid.x, b.y - mid.y))
    const cell = usable.find((c) => !taken.has(key(c))) ?? usable[0] ?? null
    if (cell) taken.add(key(cell))
    out.set(rule.itemId, {
      position: cell ? cellToWorld(cell.x, cell.y, step.grid) : zoneRect(zone, step.grid).centre,
      zoneLabel: zone.label,
    })
  }
  return out
}

// ---------- Items ----------

const labelFor = (itemId: string) => SITE_ITEM_MAP[itemId]?.label ?? itemId
/** An id outside the catalogue (a data error the validator would catch) is still walked, at the work zones. */
const checkpointOf = (itemId: string): CheckpointId => checkpointForItem(itemId) ?? 'workzones'

function uniqueRules(step: SiteSetupStep): SiteItemRule[] {
  const seen = new Set<string>()
  return step.rules.filter((r) => (seen.has(r.itemId) ? false : (seen.add(r.itemId), true)))
}

function placedItem(
  step: SiteSetupStep, rule: SiteItemRule, placed: PlacementRecord, assessment: PlacementAssessment, model: ModelSpot,
): SiteItem {
  const status = assessment.status === 'missing' ? 'neutral' : assessment.status
  const cell: Cell = {
    x: Math.min(step.grid.cols - 1, Math.max(0, Math.floor(placed.x))),
    y: Math.min(step.grid.rows - 1, Math.max(0, Math.floor(placed.y))),
  }
  const zones = decidingZones(step, rule, cell, status)
  const { position, footprint } = footprintFor(rule.itemId, cell, isLinearItem(rule.itemId) ? longest(zones) : null, step.grid)
  return {
    itemId: rule.itemId,
    label: labelFor(rule.itemId),
    checkpoint: checkpointOf(rule.itemId),
    required: rule.required,
    note: assessment.note,
    modelPosition: model.position,
    status,
    cellRef: cellRef(cell.x, cell.y),
    zoneLabel: mostSpecific(zones)?.label ?? 'Open ground',
    position,
    footprint,
  }
}

function buildItems(step: SiteSetupStep, placements: PlacementRecord[]): { items: SiteItem[]; missing: MissingItem[] } {
  const assessments = assessPlacements(step, placements)
  const spots = modelSpots(step)
  const items: SiteItem[] = []
  const missing: MissingItem[] = []
  for (const rule of uniqueRules(step)) {
    const model = spots.get(rule.itemId) ?? { position: [0, 0, 0] as Vec3, zoneLabel: 'the site' }
    const assessment = assessments.find((a) => a.itemId === rule.itemId)
    const placed = placements.find((p) => p.itemId === rule.itemId)
    if (placed && assessment && assessment.status !== 'missing') {
      items.push(placedItem(step, rule, placed, assessment, model))
    } else {
      missing.push({
        itemId: rule.itemId,
        label: labelFor(rule.itemId),
        checkpoint: checkpointOf(rule.itemId),
        required: rule.required,
        note: rule.placementNote,
        modelPosition: model.position,
        status: rule.required ? 'missing' : 'unused',
        modelZoneLabel: model.zoneLabel,
      })
    }
  }
  return { items, missing }
}

// ---------- Rows ----------

function itemRow(item: SiteItem): WalkRow {
  const elsewhere = item.status === 'good' ? '' : ' The model answer has more on where it belongs.'
  return {
    id: `item:${item.itemId}`,
    kind: 'item',
    what: item.label,
    where: `${item.zoneLabel}, ${item.cellRef}`,
    status: item.status,
    statusText: STATUS_MARK[item.status].text,
    why: `${item.note}${elsewhere}`,
  }
}

function missingRow(item: MissingItem): WalkRow {
  const belongs = `It belongs in: ${item.modelZoneLabel}.`
  return {
    id: `item:${item.itemId}`,
    kind: 'item',
    what: item.label,
    where: 'Not placed',
    status: item.status,
    statusText: STATUS_MARK[item.status].text,
    why: item.status === 'missing'
      ? `Needed on this site and not provided. ${item.note} ${belongs}`
      : `Optional on this site and not used. ${item.note}`,
  }
}

function overlayRow(overlay: Overlay, step: SiteSetupStep | null, grid: GridSize): WalkRow {
  const cell = worldToCell(overlay.position, grid)
  const zone = step ? mostSpecific(step.zones.filter((z) => inZone(z, cell))) : null
  return {
    id: overlay.id,
    kind: overlay.kind,
    what: overlay.title,
    where: `${zone?.label ?? 'Open ground'}, ${cellRef(cell.x, cell.y)}`,
    status: overlay.tone,
    statusText: overlay.statusText,
    why: overlay.detail,
  }
}

// ---------- Checkpoints ----------

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** One sentence for the Reveal: how the stop measured up. */
function assessmentFor(items: SiteItem[], missing: MissingItem[], overlays: Overlay[]): string {
  const absent = missing.filter((m) => m.status === 'missing')
  const total = items.length + absent.length
  const good = items.filter((i) => i.status === 'good').length
  const neutral = items.filter((i) => i.status === 'neutral').length
  const unsafe = items.filter((i) => i.status === 'unsafe')
  const names = (list: { label: string }[]) => list.map((i) => i.label).join(', ')
  let text: string
  if (total === 0) text = 'Nothing from this stop was placed on the plan'
  else if (good === total) text = total === 1 ? 'The one item here is well placed' : `All ${total} items here are well placed`
  else {
    const parts = [`${good} of ${plural(total, 'item')} well placed`]
    if (neutral) parts.push(`${neutral} acceptable`)
    if (unsafe.length) parts.push(`${unsafe.length} unsafe where ${unsafe.length === 1 ? 'it stands' : 'they stand'} (${names(unsafe)})`)
    if (absent.length) parts.push(`${absent.length} not provided (${names(absent)})`)
    text = parts.join(', ')
  }
  const bad = overlays.filter((o) => o.tone === 'bad').length
  const warn = overlays.filter((o) => o.tone === 'warn').length
  const findings = [bad ? plural(bad, 'serious finding') : '', warn ? plural(warn, 'lesser finding') : ''].filter(Boolean)
  return findings.length ? `${text}; the records add ${findings.join(' and ')}.` : `${text}.`
}

function buildCheckpoints(
  step: SiteSetupStep | null, grid: GridSize, items: SiteItem[], missing: MissingItem[],
  overlays: Overlay[], structures: StructureModel[], overview: SiteModel['overview'],
): Checkpoint[] {
  return CHECKPOINTS.map((def) => {
    const mine = (i: { checkpoint: CheckpointId }) => i.checkpoint === def.id
    const order = (a: { itemId: string }, b: { itemId: string }) => rank(def.itemIds, a.itemId) - rank(def.itemIds, b.itemId)
    const here = items.filter(mine).sort(order)
    const absent = missing.filter(mine).sort(order)
    const tags = overlays.filter(mine)
    const itemIds = [...here, ...absent].sort(order).map((i) => i.itemId)
    const rows: WalkRow[] = [
      ...[...here.map(itemRow), ...absent.map(missingRow)].sort((a, b) => itemIds.indexOf(a.id.slice(5)) - itemIds.indexOf(b.id.slice(5))),
      ...tags.map((o) => overlayRow(o, step, grid)),
    ]
    // What the camera must show: placed items, the dashed outline of each missing one, every tag.
    const covered: Vec3[] = [
      ...here.map((i) => i.position),
      ...absent.filter((m) => m.status === 'missing').map((m) => m.modelPosition),
      ...tags.map((o) => o.position),
    ]
    const lookAt = covered.length ? covered : absent.map((m) => m.modelPosition)
    return {
      id: def.id,
      title: def.title,
      camera: cameraFor(lookAt, { structures, prefer: def.id === 'public' ? PUBLIC_YAW_ORDER : YAW_ORDER, fallback: overview }),
      itemIds,
      overlayIds: tags.map((o) => o.id),
      prompts: [...def.prompts],
      criterion: def.criterion,
      rows,
      assessment: assessmentFor(here, absent, tags),
      flawed: here.some((i) => i.status === 'unsafe') || absent.some((m) => m.status === 'missing') || tags.some((o) => o.tone === 'bad'),
    }
  })
}

/** Position in a checkpoint's item list; ids outside the list go last, in a stable order. */
function rank(order: string[], itemId: string): number {
  const i = order.indexOf(itemId)
  return i < 0 ? order.length : i
}

// ---------- Model ----------

/**
 * Build the site model for a finished game. Works for any state of a scenario, including a game
 * shut down before the site was laid out or before the temporary works register was reached.
 */
export function buildSiteModel(scenario: Scenario, state: GameState): SiteModel {
  const step = siteSetupStep(scenario)
  const grid: GridSize = step ? { cols: step.grid.cols, rows: step.grid.rows } : DEFAULT_GRID
  const world = worldFor(grid)
  const zones = step ? zoneModels(step) : []
  const structures = zones.map(structureFor).filter((s): s is StructureModel => !!s)
  const { items, missing } = step ? buildItems(step, state.placements ?? []) : { items: [], missing: [] }
  const overlays = buildOverlays(scenario, state, { world, zones, items, missing })
  const overview = overviewFor(world)
  return {
    version: 1,
    scenarioId: scenario.id,
    shutdown: !!state.game?.shutdown,
    world,
    zones,
    structures,
    items,
    missing,
    overlays,
    checkpoints: buildCheckpoints(step, grid, items, missing, allOverlays(overlays), structures, overview),
    overview,
  }
}

/** Rule items in the model, placed or not, keyed by id. */
export function modelItem(model: SiteModel, itemId: string): SiteItem | MissingItem | null {
  return model.items.find((i) => i.itemId === itemId) ?? model.missing.find((m) => m.itemId === itemId) ?? null
}

/** Every overlay in the model, in a stable order (temporary works, permits, then incidents). */
export const modelOverlays = (model: SiteModel): Overlay[] => allOverlays(model.overlays)

export { CELL, round3 }
