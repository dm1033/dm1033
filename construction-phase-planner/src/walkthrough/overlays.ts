// Overlays: what the paperwork and the site weeks add to the walk at Reveal. Temporary works
// tags, permit cards, incident cordons, open-risk beacons and HSE notices, each tied to a spot on
// the site and to the checkpoint where the group talks about it.
import type {
  ConsequenceRecord, GameState, LatentHazard, NoticeRecord, PermitStep, Scenario, TwItem, TwRegisterStep,
} from '../types'
import { twItemScore } from '../engine/scoring'
import { fmtMoney } from '../engine/game'
import { permitAnchor, twAnchor, type Anchor } from './anchors'
import { CHECKPOINT_MAP, checkpointForTopic } from './checkpoints'
import { clampToWorld, round3 } from './geometry'
import type { CheckpointId, MissingItem, Overlay, SiteItem, SiteModel, Vec3, ZoneModel } from './types'

/** The parts of the site model an overlay is positioned against. */
export interface OverlaySite {
  world: SiteModel['world']
  zones: ZoneModel[]
  items: SiteItem[]
  missing: MissingItem[]
}

export type OverlaySet = SiteModel['overlays']

type Draft = Omit<Overlay, 'position'> & { base: Vec3 }

const twSteps = (scenario: Scenario): TwRegisterStep[] =>
  scenario.phases.flatMap((p) => p.steps.filter((s): s is TwRegisterStep => s.type === 'twRegister'))
const permitSteps = (scenario: Scenario): PermitStep[] =>
  scenario.phases.flatMap((p) => p.steps.filter((s): s is PermitStep => s.type === 'permits'))

// ---------- Positions ----------

/** Where a checkpoint's evidence gathers: beside its first placed item, else where that item belongs. */
export function checkpointSpot(checkpoint: CheckpointId, site: OverlaySite): Vec3 {
  const order = CHECKPOINT_MAP[checkpoint].itemIds
  const placed = order.map((id) => site.items.find((i) => i.itemId === id)).find((i) => !!i)
  if (placed) return placed.position
  const absent = site.missing.filter((m) => m.checkpoint === checkpoint)
  const model = absent.find((m) => m.status === 'missing') ?? absent[0]
  return model ? model.modelPosition : [0, 0, 0]
}

/** Resolve an anchor to a ground position on this site. */
export function anchorSpot(anchor: Anchor, site: OverlaySite): Vec3 {
  if (anchor.item) {
    const placed = site.items.find((i) => i.itemId === anchor.item)
    if (placed) return placed.position
    const absent = site.missing.find((m) => m.itemId === anchor.item)
    if (absent) return absent.modelPosition
  }
  for (const kind of anchor.zones) {
    const zone = site.zones.find((z) => z.kind === kind && !z.blocked) ?? site.zones.find((z) => z.kind === kind)
    if (zone) return zone.centre
  }
  return checkpointSpot(anchor.checkpoint, site)
}

/** True if a ground position is within `margin` metres of a zone nothing can stand in. */
function inBlockedZone(p: Vec3, site: OverlaySite, margin: number): boolean {
  return site.zones.some((z) => z.blocked
    && Math.abs(p[0] - z.centre[0]) <= z.size[0] / 2 + margin
    && Math.abs(p[2] - z.centre[2]) <= z.size[1] / 2 + margin)
}

const RING_STEP = 30
/** Preferred and minimum gap between a tag and a building or live road, in metres. */
const TAG_CLEARANCES = [2, 0.4]
const TAG_SPACING = 0.9

/**
 * Tags that share an anchor are fanned out in a ring round it, so none hides another and none
 * sits on top of the item's own status marker. A slot that would put a tag inside (or hard up
 * against) an occupied building or a live road is skipped: the tag turns round the ring until it
 * stands on open ground, where the camera can see it.
 */
function spread(drafts: Draft[], site: OverlaySite): Overlay[] {
  const key = (p: Vec3) => `${p[0]},${p[2]}`
  const groupSize = new Map<string, number>()
  for (const d of drafts) groupSize.set(key(d.base), (groupSize.get(key(d.base)) ?? 0) + 1)
  const seen = new Map<string, number>()
  const used: Vec3[] = []
  const crowded = (p: Vec3) => used.some((u) => Math.hypot(u[0] - p[0], u[2] - p[2]) < TAG_SPACING)
  return drafts.map((d) => {
    const k = key(d.base)
    const n = groupSize.get(k) ?? 1
    const i = seen.get(k) ?? 0
    seen.set(k, i + 1)
    const { base, ...rest } = d
    const start = 45 + (i * 360) / n
    const slot = (radius: number, degrees: number): Vec3 => {
      const angle = (degrees * Math.PI) / 180
      return clampToWorld([round3(base[0] + radius * Math.cos(angle)), 0, round3(base[2] + radius * Math.sin(angle))], site.world, 0.5)
    }
    const radii = [Math.max(1.6, n * 0.45), 1.1, 2.6]
    const firstFree = (clearance: number): Vec3 | null => {
      for (const radius of radii) {
        for (let turn = 0; turn < 360; turn += RING_STEP) {
          const candidate = slot(radius, start + turn)
          if (!inBlockedZone(candidate, site, clearance) && !crowded(candidate)) return candidate
        }
      }
      return null
    }
    // Nowhere clear nearby (an anchor walled in on every side): stand on the anchor itself.
    const position = TAG_CLEARANCES.map(firstFree).find((p): p is Vec3 => !!p) ?? clampToWorld(base, site.world, 0.5)
    used.push(position)
    return { ...rest, position }
  })
}

// ---------- Temporary works ----------

const TW_FIELD_WORDS: Record<string, string> = {
  register: 'register entry',
  design: 'design requirement',
  catCheck: 'design check category',
  rams: 'RAMS',
  inspection: 'inspection before use',
  holdPoint: 'hold point before loading',
  responsible: 'who is responsible',
}

const fieldWords = (fields: string[]) => fields.map((f) => TW_FIELD_WORDS[f] ?? f).join(', ')

function twDraft(item: TwItem, state: GameState, site: OverlaySite): Draft {
  const anchor = twAnchor(item.id, item.name)
  const common = { id: `tw:${item.id}`, kind: 'tw' as const, title: item.name, checkpoint: anchor.checkpoint, base: anchorSpot(anchor, site) }
  const answer = state.twAnswers.find((a) => a.itemId === item.id)
  if (!answer) {
    return { ...common, tone: 'info', statusText: 'NOT REACHED', detail: 'The project stopped before the temporary works register was completed.' }
  }
  const { wrongFields } = twItemScore(item, answer)
  if (wrongFields.length === 0) {
    return item.correct.register
      ? { ...common, tone: 'good', statusText: 'ON REGISTER, PERMIT TO LOAD', detail: `Every register entry was right. ${item.explanation}` }
      : { ...common, tone: 'good', statusText: 'NOT TEMPORARY WORKS, CORRECTLY ASSESSED', detail: `Rightly kept off the register. ${item.explanation}` }
  }
  const critical = wrongFields.includes('register') || wrongFields.includes('design')
  return {
    ...common,
    tone: critical ? 'bad' : 'warn',
    statusText: critical ? 'DO NOT USE' : 'INCOMPLETE',
    detail: `Wrong or left blank: ${fieldWords(wrongFields)}. ${item.explanation}`,
  }
}

// ---------- Permits ----------

function permitDrafts(step: PermitStep, state: GameState, site: OverlaySite): Draft[] {
  const answer = state.permitAnswers.find((a) => a.stepId === step.id)
  const out: Draft[] = []
  for (const option of step.options) {
    const required = step.required.includes(option.id)
    const raised = !!answer && answer.selected.includes(option.id)
    if (!required && !raised) continue
    const anchor = permitAnchor(option.id, option.name)
    const common = {
      id: `permit:${step.id}:${option.id}`, kind: 'permit' as const, title: option.name,
      checkpoint: anchor.checkpoint, base: anchorSpot(anchor, site),
    }
    if (!answer) {
      out.push({ ...common, tone: 'info', statusText: 'NOT REACHED', detail: 'The project stopped before permits were raised for this work.' })
    } else if (required && raised) {
      out.push({ ...common, tone: 'good', statusText: 'PERMIT RAISED', detail: 'Needed for this work and raised before it started.' })
    } else if (required) {
      out.push({ ...common, tone: 'bad', statusText: 'STOP, NO PERMIT', detail: 'This work needs a permit and none was raised. It stays stopped until one is issued and briefed.' })
    } else {
      out.push({ ...common, tone: 'warn', statusText: 'RAISED, NOT NEEDED', detail: 'Raised for work that is not in this scope. Permits nobody needs weaken the ones that matter.' })
    }
  }
  return out
}

// ---------- Incidents, open risks, notices ----------

const days = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)} day${n === 1 ? '' : 's'}`

function topicOf(c: ConsequenceRecord, latent: LatentHazard[]): string {
  const source = latent.find((h) => h.id === c.hazardId)
  if (source) return source.topic
  // rootCause is written as "Phase N, <topic>. You chose: ..." by the engine.
  return /^Phase \d+, (.+?)\. You chose/.exec(c.rootCause)?.[1] ?? c.rootCause
}

function incidentDraft(c: ConsequenceRecord, n: number, state: GameState, site: OverlaySite): Draft {
  const checkpoint = checkpointForTopic(topicOf(c, state.game.latent))
  return {
    id: `incident:${n}`,
    kind: 'incident',
    tone: c.severity === 'major' ? 'bad' : 'warn',
    statusText: `INCIDENT ${n}${c.riddor ? ', RIDDOR REPORTABLE' : ''}`,
    title: `Week ${c.week}: ${c.title}`,
    detail: `${c.narrative} Root cause: ${c.rootCause}. Cost ${fmtMoney(c.cost)}, ${days(c.days)} lost.`,
    checkpoint,
    base: checkpointSpot(checkpoint, site),
  }
}

function openRiskDraft(h: LatentHazard, site: OverlaySite): Draft {
  const checkpoint = checkpointForTopic(h.topic)
  return {
    id: `risk:${h.id}`,
    kind: 'openRisk',
    tone: h.severity === 'major' ? 'bad' : 'warn',
    statusText: 'STILL LIVE AT HANDOVER',
    title: h.topic,
    detail: `Never put right. The decision: "${h.choice}". What it can lead to: ${h.consequence}`,
    checkpoint,
    base: checkpointSpot(checkpoint, site),
  }
}

/** HSE notices go on the board at the gate, where everyone coming on to site reads them. */
const NOTICE_ANCHOR: Anchor = { item: 'signage', zones: ['gate', 'boundary'], checkpoint: 'gate' }

function noticeDraft(n: NoticeRecord, index: number, site: OverlaySite): Draft {
  const prohibition = n.kind === 'prohibition'
  return {
    id: `notice:${index}`,
    kind: 'notice',
    tone: prohibition ? 'bad' : 'warn',
    statusText: prohibition ? 'PROHIBITION NOTICE' : 'IMPROVEMENT NOTICE',
    title: `Week ${n.week}: HSE ${n.kind} notice`,
    detail: `${n.reason} Cost ${fmtMoney(n.cost)}, ${days(n.days)} lost.`,
    checkpoint: NOTICE_ANCHOR.checkpoint,
    base: anchorSpot(NOTICE_ANCHOR, site),
  }
}

// ---------- Assembly ----------

/**
 * Every overlay for a finished (or shut down) game. Pure and deterministic: the same scenario,
 * state and site always give the same overlays in the same order.
 */
export function buildOverlays(scenario: Scenario, state: GameState, site: OverlaySite): OverlaySet {
  const tw = twSteps(scenario).flatMap((step) => step.items.map((item) => twDraft(item, state, site)))
  const permits = permitSteps(scenario).flatMap((step) => permitDrafts(step, state, site))
  const incidents = [
    ...state.game.consequences.map((c, i) => incidentDraft(c, i + 1, state, site)),
    ...state.game.latent.filter((h) => h.status === 'open').map((h) => openRiskDraft(h, site)),
    ...state.game.notices.map((n, i) => noticeDraft(n, i + 1, site)),
  ]
  // Spread once over everything, so a permit and a temporary works tag on the same item do not collide.
  const placed = spread([...tw, ...permits, ...incidents], site)
  return {
    temporaryWorks: placed.slice(0, tw.length),
    permits: placed.slice(tw.length, tw.length + permits.length),
    incidents: placed.slice(tw.length + permits.length),
  }
}

export const allOverlays = (set: OverlaySet): Overlay[] => [...set.temporaryWorks, ...set.permits, ...set.incidents]
