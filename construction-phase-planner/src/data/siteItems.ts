// Shared catalogue of placeable site set-up items.
// Scenario JSON references these by id in siteSetup rules, and the 3D walk-through groups them
// into checkpoints by id: never rename or remove an id.

export interface SiteItemDef {
  id: string
  label: string
  icon: string
  category: 'boundary' | 'access' | 'welfare' | 'emergency' | 'storage' | 'work-zones' | 'protection'
  /** Caption printed under the icon on a plan square. One or two short words. */
  short: string
  /** One plain sentence saying what the item is, for anyone who has not met the term. */
  description: string
}

export const SITE_ITEMS: SiteItemDef[] = [
  { id: 'hoarding', label: 'Hoarding / Fencing', icon: '🚧', category: 'boundary', short: 'Hoarding', description: 'Solid boards or fence panels that keep the public out of the works.' },
  { id: 'gate-vehicle', label: 'Vehicle Gate', icon: '🚪', category: 'boundary', short: 'Vehicle gate', description: 'The controlled way in and out for deliveries and plant.' },
  { id: 'gate-pedestrian', label: 'Pedestrian Gate', icon: '🚶', category: 'boundary', short: 'Foot gate', description: 'A separate way in for people on foot, kept apart from vehicles.' },
  { id: 'signage', label: 'Site Signage', icon: '⚠️', category: 'boundary', short: 'Signs', description: 'Site rules, warnings and emergency information, put where people will see them.' },
  { id: 'security', label: 'Security / CCTV', icon: '📹', category: 'boundary', short: 'CCTV', description: 'Access control and cameras that stop people getting in unnoticed.' },
  { id: 'lighting', label: 'Site Lighting', icon: '💡', category: 'boundary', short: 'Lights', description: 'Lights for gates, walkways and work areas when it is dark.' },

  { id: 'pedestrian-route', label: 'Pedestrian Route', icon: '🥾', category: 'access', short: 'Foot route', description: 'A marked, protected walkway kept apart from vehicles and plant.' },
  { id: 'vehicle-route', label: 'Vehicle / Delivery Route', icon: '🚚', category: 'access', short: 'Vehicle route', description: 'The route that deliveries and plant follow through the site.' },
  { id: 'traffic-management', label: 'Traffic Management', icon: '🚦', category: 'access', short: 'Traffic mgmt', description: 'Barriers, signs, crossing points and a traffic marshal where vehicles meet people.' },
  { id: 'wheel-wash', label: 'Wheel Wash', icon: '🫧', category: 'access', short: 'Wheel wash', description: 'Cleans tyres so mud is not carried out onto the road.' },

  { id: 'welfare', label: 'Welfare Cabin', icon: '🏠', category: 'welfare', short: 'Welfare', description: 'A warm, dry place to eat, drink and take breaks.' },
  { id: 'toilets', label: 'Toilets & Washing', icon: '🚻', category: 'welfare', short: 'Toilets', description: 'Toilets with running water, soap and somewhere to dry your hands.' },
  { id: 'drying-room', label: 'Drying / Rest Room', icon: '🧥', category: 'welfare', short: 'Drying room', description: 'Somewhere to dry wet clothing and keep work gear.' },
  { id: 'office', label: 'Site Office / Induction', icon: '🗂️', category: 'welfare', short: 'Office', description: 'Where the site is run from and where new starters get their induction.' },

  { id: 'first-aid', label: 'First Aid Point', icon: '⛑️', category: 'emergency', short: 'First aid', description: 'First aid kit and a named first aider, clearly signed.' },
  { id: 'fire-point', label: 'Fire Point', icon: '🧯', category: 'emergency', short: 'Fire point', description: 'Extinguishers, a way to raise the alarm and a fire notice, on an escape route.' },
  { id: 'muster-point', label: 'Emergency Muster Point', icon: '📍', category: 'emergency', short: 'Muster', description: 'The safe place where everyone gathers to be counted in an emergency.' },
  { id: 'spill-kit', label: 'Spill Kit', icon: '🛢️', category: 'emergency', short: 'Spill kit', description: 'Absorbent pads and booms to soak up a fuel or oil spill fast.' },

  { id: 'skips', label: 'Waste Skips', icon: '🗑️', category: 'storage', short: 'Skips', description: 'Containers for sorted waste, where a skip lorry can reach them.' },
  { id: 'material-storage', label: 'Material Storage / Laydown', icon: '📦', category: 'storage', short: 'Laydown', description: 'The laydown area: where deliveries are unloaded and materials are stacked.' },
  { id: 'fuel-storage', label: 'Bunded Fuel Storage', icon: '⛽', category: 'storage', short: 'Fuel', description: 'A fuel tank that sits in a leak-proof tray (a bund) to catch any spill.' },
  { id: 'plant-parking', label: 'Plant Parking', icon: '🚜', category: 'storage', short: 'Plant', description: 'Where excavators, dumpers and other machines are left, with the keys removed.' },
  { id: 'gas-storage', label: 'Gas Bottle Cage', icon: '🧪', category: 'storage', short: 'Gas cage', description: 'A locked, ventilated cage outdoors for gas cylinders.' },

  { id: 'scaffold-zone', label: 'Scaffold Zone', icon: '🏗️', category: 'work-zones', short: 'Scaffold', description: 'The ground taken up by the scaffold and its loading bays.' },
  { id: 'crane-zone', label: 'Crane / Lifting Zone', icon: '🏋️', category: 'work-zones', short: 'Crane', description: 'Where the crane stands and the area its loads pass over.' },
  { id: 'excavation-zone', label: 'Excavation Zone', icon: '⛏️', category: 'work-zones', short: 'Dig', description: 'Where the ground is opened up: trenches, pits and foundations.' },
  { id: 'tw-zone', label: 'Temporary Works Zone', icon: '🔩', category: 'work-zones', short: 'Temp works', description: 'Props, supports and other temporary structures that hold things up during the job.' },
  { id: 'concrete-wash', label: 'Concrete Washout', icon: '🪣', category: 'work-zones', short: 'Washout', description: 'A lined area for washing out concrete wagons and pumps, so the wash water is contained.' },

  { id: 'exclusion-zone', label: 'Exclusion Zone', icon: '⛔', category: 'protection', short: 'Keep out', description: 'A fenced-off danger area that nobody enters while lifting or demolition is going on.' },
  { id: 'public-protection', label: 'Public Protection (fan/gantry)', icon: '🛡️', category: 'protection', short: 'Public cover', description: 'Covered walkways, scaffold fans, barriers or footbridges that shield the public from the works.' },
  { id: 'dust-suppression', label: 'Dust Suppression', icon: '💦', category: 'protection', short: 'Dust', description: 'Water sprays or misting that damp dust down where it is made.' },
  { id: 'noise-barrier', label: 'Noise Barrier / Monitor', icon: '🔇', category: 'protection', short: 'Noise', description: 'Screens and a monitor that keep noise within the agreed limits.' },
  { id: 'drain-protection', label: 'Drain Protection', icon: '🕳️', category: 'protection', short: 'Drain cover', description: 'Covers and silt barriers that keep spills and dirty water out of a drain.' },
]

export const SITE_ITEM_MAP: Record<string, SiteItemDef> = Object.fromEntries(
  SITE_ITEMS.map((i) => [i.id, i]),
)

export const ITEM_CATEGORY_LABELS: Record<SiteItemDef['category'], string> = {
  boundary: 'Boundary & Security',
  access: 'Access & Traffic',
  welfare: 'Welfare',
  emergency: 'Emergency & First Aid',
  storage: 'Storage & Logistics',
  'work-zones': 'Work Zones',
  protection: 'Protection & Environment',
}

/** Palette order: the order a site manager would walk the site from the gate inwards. */
export const ITEM_CATEGORY_ORDER: SiteItemDef['category'][] = [
  'boundary', 'access', 'welfare', 'emergency', 'storage', 'work-zones', 'protection',
]
