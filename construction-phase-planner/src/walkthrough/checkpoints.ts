// The eight stops of the site walk-through and the ten things the tutor marks.
// Every placeable item in the catalogue (src/data/siteItems.ts) belongs to exactly one checkpoint.
import {
  CHECKPOINT_ORDER, RUBRIC_ORDER,
  type CheckpointDef, type CheckpointId, type Mark, type RubricCriterion, type RubricId,
} from './types'

/** In tour order: in at the gate, round the site, and out to look back in as the public do. */
export const CHECKPOINTS: CheckpointDef[] = [
  {
    id: 'gate',
    title: 'Site gate',
    itemIds: ['gate-vehicle', 'gate-pedestrian', 'signage', 'security', 'lighting'],
    prompts: [
      'Who gets through this gate, and who decides?',
      'What does a first-time visitor see and do here?',
    ],
    criterion: 'Access control, induction and signage at the gate.',
  },
  {
    id: 'segregation',
    title: 'People and plant',
    itemIds: ['pedestrian-route', 'vehicle-route', 'traffic-management', 'wheel-wash'],
    prompts: [
      'Show us where people walk and where plant moves.',
      'Where do the two routes meet, and what controls that point?',
    ],
    criterion: 'Segregation of people and plant.',
  },
  {
    id: 'welfare',
    title: 'Welfare',
    itemIds: ['welfare', 'toilets', 'drying-room', 'office'],
    prompts: [
      'Why is welfare here and not somewhere else?',
      'Is it enough for your peak workforce? How do you know?',
    ],
    criterion: 'Welfare: enough of it, and in the right place.',
  },
  {
    id: 'emergency',
    title: 'Emergency',
    itemIds: ['first-aid', 'fire-point', 'muster-point'],
    prompts: [
      'Someone is hurt at the far end of site. What happens next?',
      'The alarm sounds. Where does everyone go, and who counts them?',
    ],
    criterion: 'Emergency arrangements: first aid, fire and muster.',
  },
  {
    id: 'logistics',
    title: 'Storage and logistics',
    itemIds: ['skips', 'material-storage', 'fuel-storage', 'plant-parking', 'gas-storage'],
    prompts: [
      'Why are fuel, gas and waste stored where they are?',
      'How does a delivery get in, unload and leave safely?',
    ],
    criterion: 'Storage, waste, fuel and gas.',
  },
  {
    id: 'workzones',
    title: 'Work zones',
    itemIds: ['scaffold-zone', 'crane-zone', 'excavation-zone', 'tw-zone', 'exclusion-zone'],
    prompts: [
      'Who is kept out of these zones, and how?',
      'What must be signed off before anyone loads, lifts or digs here?',
    ],
    criterion: 'Work zones: exclusion, the temporary works register and permits.',
  },
  {
    id: 'environment',
    title: 'Environment',
    itemIds: ['spill-kit', 'drain-protection', 'dust-suppression', 'noise-barrier', 'concrete-wash'],
    prompts: [
      'If fuel spills here, where does it go and what stops it?',
      'How do you keep dust and noise away from the neighbours?',
    ],
    criterion: 'Environment: drains, spills, dust and noise.',
  },
  {
    id: 'public',
    title: 'Public side',
    itemIds: ['hoarding', 'public-protection'],
    prompts: [
      'Stand on the pavement. What protects someone walking past?',
      'Who checks this boundary, and how often?',
    ],
    criterion: 'Public protection, seen from outside the boundary.',
  },
]

export const CHECKPOINT_MAP: Record<CheckpointId, CheckpointDef> = Object.fromEntries(
  CHECKPOINTS.map((c) => [c.id, c]),
) as Record<CheckpointId, CheckpointDef>

const ITEM_CHECKPOINT: Record<string, CheckpointId> = Object.fromEntries(
  CHECKPOINTS.flatMap((c) => c.itemIds.map((itemId) => [itemId, c.id])),
)

/** The checkpoint a catalogue item is explained at, or null for an id the catalogue does not hold. */
export function checkpointForItem(itemId: string): CheckpointId | null {
  return ITEM_CHECKPOINT[itemId] ?? null
}

export const isCheckpointId = (id: unknown): id is CheckpointId =>
  typeof id === 'string' && (CHECKPOINT_ORDER as string[]).includes(id)

export const isRubricId = (id: unknown): id is RubricId =>
  typeof id === 'string' && (RUBRIC_ORDER as string[]).includes(id)

// ---------- Topic routing ----------

// A decision topic, an open risk or an incident is shown at the stop where the group would talk
// about it. First match wins, so "Environmental controls: waste, water, dust, noise" lands on
// Environment rather than Storage, and "Fire and ignition control near gas plant" on Emergency.
const TOPIC_RULES: { rx: RegExp; checkpoint: CheckpointId }[] = [
  { rx: /welfare/, checkpoint: 'welfare' },
  { rx: /environment|spill|dust|noise|silica|vibration|dewater|silt|washout|drain|pollut|watercourse/, checkpoint: 'environment' },
  { rx: /traffic|people.{1,3}plant|segregat|\btm\b|banksman|reversing/, checkpoint: 'segregation' },
  { rx: /public protection|children|neighbour|stakeholder|communit|occupiers|gantry|hoarding|out of hours|trespass|member of the public/, checkpoint: 'public' },
  { rx: /emergency|first aid|fire|ignition|rescue|evacuat|muster|gas escape/, checkpoint: 'emergency' },
  { rx: /waste|storage|fuel|housekeeping|logistics|set-up|laydown|deliver|\bskips?\b|\bcoshh\b/, checkpoint: 'logistics' },
  {
    rx: /scaffold|excavat|trench|temporary works|lifting|crane|demolition|asbestos|height|confined|buried|services|steel|permit|propping|structural|mewp|plant|\bdig|strip-out|rams|\bhv\b|spoil|exclusion/,
    checkpoint: 'workzones',
  },
  {
    rx: /access|induction|security|signage|competence|cdm|construction phase plan|duty holder|notif|consultation|engagement|riddor|enforcement|regulator|records|handover|inspection|programme|ppe|occupational health|risk assessment|hazard identification|pre-construction/,
    checkpoint: 'gate',
  },
]

/** Topics that match no rule are discussed where the work is. */
export const DEFAULT_TOPIC_CHECKPOINT: CheckpointId = 'workzones'

/** The checkpoint at which a decision topic, incident or open risk is discussed. */
export function checkpointForTopic(topic: string): CheckpointId {
  const text = topic.toLowerCase()
  return TOPIC_RULES.find((r) => r.rx.test(text))?.checkpoint ?? DEFAULT_TOPIC_CHECKPOINT
}

// ---------- Rubric ----------

const WHOLE_WALK: RubricCriterion[] = [
  {
    id: 'ownership',
    title: 'Ownership',
    criterion: 'Every flagged item and open risk has a fix and a named owner.',
  },
  {
    id: 'management',
    title: 'Keeping it right',
    criterion: 'Inspections, and how a change on site reaches the construction phase plan and the briefings.',
  },
]

/** The ten criteria in marking order: one per checkpoint, then two for the walk as a whole. */
export const RUBRIC: RubricCriterion[] = [
  ...CHECKPOINTS.map((c) => ({ id: c.id as RubricId, title: c.title, criterion: c.criterion })),
  ...WHOLE_WALK,
]

export const RUBRIC_MAP: Record<RubricId, RubricCriterion> = Object.fromEntries(
  RUBRIC.map((r) => [r.id, r]),
) as Record<RubricId, RubricCriterion>

/** Marks belong to the group. Words go with every number so a mark is never just a digit. */
export const MARK_WORDS: Record<Mark, { short: string; long: string }> = {
  0: { short: 'Not explained', long: 'Not explained.' },
  1: { short: 'Says what', long: 'Says what is there.' },
  2: { short: 'Says why', long: 'Says why: the hazard and who could be harmed.' },
  3: {
    short: 'Says how it is kept right',
    long: 'Adds how it is kept right: who checks, how often and where it is written down. At a flagged stop: the right fix, with reasons.',
  },
}
