// Where on the site a temporary works item or a permit is shown.
//
// Each id is anchored to a placeable site item (its tag stands next to that item) and, for a
// scenario whose set-up does not include that item, to the first zone of a given kind. The
// checkpoint is the stop at which the tag is revealed and discussed.
import type { CheckpointId, ZoneKind } from './types'

export interface Anchor {
  /** Site item id (src/data/siteItems.ts) the tag stands next to, when that item is part of the scenario. */
  item?: string
  /** Zone kinds to fall back on, in order of preference. */
  zones: ZoneKind[]
  checkpoint: CheckpointId
}

const atWorkFace: ZoneKind[] = ['workArea', 'trench', 'yard']
const atExcavation: ZoneKind[] = ['trench', 'workArea', 'yard']

/** Temporary works item id (scenario twRegister steps) -> anchor. Covers all three scenarios. */
export const TW_ANCHORS: Record<string, Anchor> = {
  // Scenario 1: commercial extension
  'tw-scaffold': { item: 'scaffold-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'tw-excavation': { item: 'excavation-zone', zones: atExcavation, checkpoint: 'workzones' },
  'tw-crane-mat': { item: 'crane-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'tw-frame-stability': { item: 'tw-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'tw-edge-protection': { item: 'tw-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'tw-hoarding': { item: 'hoarding', zones: ['boundary', 'footway'], checkpoint: 'public' },
  'tw-welfare-base': { item: 'welfare', zones: ['yard'], checkpoint: 'welfare' },
  'tw-loading-bay': { item: 'scaffold-zone', zones: atWorkFace, checkpoint: 'workzones' },
  // Scenario 2: city centre refurbishment and demolition
  'tw-propping': { item: 'tw-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'tw-facade': { item: 'tw-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'tw-gantry': { item: 'public-protection', zones: ['footway', 'boundary'], checkpoint: 'public' },
  'tw-scaffold-sheeted': { item: 'scaffold-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'tw-exclusion-structure': { item: 'exclusion-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'tw-chute': { item: 'skips', zones: ['yard', 'workArea'], checkpoint: 'logistics' },
  'tw-hoarding-pavement': { item: 'hoarding', zones: ['footway', 'boundary'], checkpoint: 'public' },
  'tw-backprop-machine': { item: 'tw-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'tw-temp-services': { item: 'tw-zone', zones: atWorkFace, checkpoint: 'workzones' },
  // Scenario 3: utilities and roadworks
  'tw3-trench-box': { item: 'excavation-zone', zones: atExcavation, checkpoint: 'workzones' },
  'tw3-chamber-shaft': { item: 'exclusion-zone', zones: atExcavation, checkpoint: 'workzones' },
  'tw3-gas-main-support': { item: 'excavation-zone', zones: atExcavation, checkpoint: 'workzones' },
  'tw3-road-plates': { item: 'traffic-management', zones: ['road', 'crossing'], checkpoint: 'segregation' },
  'tw3-ped-bridge': { item: 'public-protection', zones: ['footway', 'crossing'], checkpoint: 'public' },
  'tw3-thrust-block': { item: 'tw-zone', zones: atExcavation, checkpoint: 'workzones' },
  'tw3-spoil': { item: 'excavation-zone', zones: atExcavation, checkpoint: 'workzones' },
  'tw3-dewatering': { item: 'drain-protection', zones: ['drain', 'trench'], checkpoint: 'environment' },
  'tw3-signals-power': { item: 'traffic-management', zones: ['road', 'crossing'], checkpoint: 'segregation' },
}

/** Permit option id (scenario permits steps) -> anchor. Covers all three scenarios. */
export const PERMIT_ANCHORS: Record<string, Anchor> = {
  'hot-works': { item: 'fire-point', zones: atWorkFace, checkpoint: 'emergency' },
  'permit-to-dig': { item: 'excavation-zone', zones: atExcavation, checkpoint: 'workzones' },
  'permit-to-load': { item: 'scaffold-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'lifting-permit': { item: 'crane-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'confined-space': { item: 'excavation-zone', zones: atExcavation, checkpoint: 'workzones' },
  'electrical-isolation': { item: 'tw-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'isolation-permit': { item: 'tw-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'roof-access': { item: 'scaffold-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'demolition-permit': { item: 'exclusion-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'asbestos-clearance': { item: 'tw-zone', zones: atWorkFace, checkpoint: 'workzones' },
  'street-works-occupation': { item: 'traffic-management', zones: ['road', 'crossing'], checkpoint: 'segregation' },
}

interface KeywordAnchor { rx: RegExp; anchor: Anchor }

// For ids added to a scenario after this table was written. First match wins.
const TW_KEYWORDS: KeywordAnchor[] = [
  { rx: /hoarding|fenc/, anchor: TW_ANCHORS['tw-hoarding'] },
  { rx: /gantry|\bfan\b|footbridge|pedestrian|crash deck/, anchor: TW_ANCHORS['tw-gantry'] },
  { rx: /scaffold|loading bay|hoist|edge protection/, anchor: TW_ANCHORS['tw-scaffold'] },
  { rx: /crane|outrigger|lifting|piling mat|working platform/, anchor: TW_ANCHORS['tw-crane-mat'] },
  { rx: /dewater|pump|settlement|silt/, anchor: TW_ANCHORS['tw3-dewatering'] },
  { rx: /road plate|signal|traffic/, anchor: TW_ANCHORS['tw3-road-plates'] },
  { rx: /excavat|trench|shaft|shoring|spoil|sheet pil|cofferdam/, anchor: TW_ANCHORS['tw-excavation'] },
  { rx: /exclusion|demolition/, anchor: TW_ANCHORS['tw-exclusion-structure'] },
  { rx: /chute|skip/, anchor: TW_ANCHORS['tw-chute'] },
  { rx: /welfare|cabin/, anchor: TW_ANCHORS['tw-welfare-base'] },
]

const PERMIT_KEYWORDS: KeywordAnchor[] = [
  { rx: /hot|weld|fire|flame/, anchor: PERMIT_ANCHORS['hot-works'] },
  { rx: /street|road|lane|traffic|highway/, anchor: PERMIT_ANCHORS['street-works-occupation'] },
  { rx: /\bdig|ground|excavat|confined/, anchor: PERMIT_ANCHORS['permit-to-dig'] },
  { rx: /lift|crane/, anchor: PERMIT_ANCHORS['lifting-permit'] },
  { rx: /demol|asbestos/, anchor: PERMIT_ANCHORS['demolition-permit'] },
  { rx: /load|strike|roof|height|edge|scaffold/, anchor: PERMIT_ANCHORS['permit-to-load'] },
]

/** Anything unrecognised is shown at the work face and discussed at the work zones stop. */
export const DEFAULT_ANCHOR: Anchor = { item: 'tw-zone', zones: atWorkFace, checkpoint: 'workzones' }

const byKeyword = (rules: KeywordAnchor[], id: string, name: string): Anchor =>
  rules.find((r) => r.rx.test(`${id} ${name}`.toLowerCase().replace(/-/g, ' ')))?.anchor ?? DEFAULT_ANCHOR

/** Anchor for a temporary works item: the table above, or a keyword match on its id and name. */
export function twAnchor(id: string, name = ''): Anchor {
  return TW_ANCHORS[id] ?? byKeyword(TW_KEYWORDS, id, name)
}

/** Anchor for a permit: the table above, or a keyword match on its id and name. */
export function permitAnchor(id: string, name = ''): Anchor {
  return PERMIT_ANCHORS[id] ?? byKeyword(PERMIT_KEYWORDS, id, name)
}
