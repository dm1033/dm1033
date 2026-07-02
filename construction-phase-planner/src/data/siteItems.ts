// Shared catalogue of placeable site set-up items.
// Scenario JSON references these by id in siteSetup rules.

export interface SiteItemDef {
  id: string
  label: string
  icon: string
  category: 'boundary' | 'access' | 'welfare' | 'emergency' | 'storage' | 'work-zones' | 'protection'
}

export const SITE_ITEMS: SiteItemDef[] = [
  { id: 'hoarding', label: 'Hoarding / Fencing', icon: '🚧', category: 'boundary' },
  { id: 'gate-vehicle', label: 'Vehicle Gate', icon: '🚪', category: 'boundary' },
  { id: 'gate-pedestrian', label: 'Pedestrian Gate', icon: '🚶', category: 'boundary' },
  { id: 'signage', label: 'Site Signage', icon: '⚠️', category: 'boundary' },
  { id: 'security', label: 'Security / CCTV', icon: '📹', category: 'boundary' },
  { id: 'lighting', label: 'Site Lighting', icon: '💡', category: 'boundary' },

  { id: 'pedestrian-route', label: 'Pedestrian Route', icon: '🥾', category: 'access' },
  { id: 'vehicle-route', label: 'Vehicle / Delivery Route', icon: '🚚', category: 'access' },
  { id: 'traffic-management', label: 'Traffic Management', icon: '🚦', category: 'access' },
  { id: 'wheel-wash', label: 'Wheel Wash', icon: '🫧', category: 'access' },

  { id: 'welfare', label: 'Welfare Cabin', icon: '🏠', category: 'welfare' },
  { id: 'toilets', label: 'Toilets & Washing', icon: '🚻', category: 'welfare' },
  { id: 'drying-room', label: 'Drying / Rest Room', icon: '🧥', category: 'welfare' },
  { id: 'office', label: 'Site Office / Induction', icon: '🗂️', category: 'welfare' },

  { id: 'first-aid', label: 'First Aid Point', icon: '⛑️', category: 'emergency' },
  { id: 'fire-point', label: 'Fire Point', icon: '🧯', category: 'emergency' },
  { id: 'muster-point', label: 'Emergency Muster Point', icon: '📍', category: 'emergency' },
  { id: 'spill-kit', label: 'Spill Kit', icon: '🛢️', category: 'emergency' },

  { id: 'skips', label: 'Waste Skips', icon: '🗑️', category: 'storage' },
  { id: 'material-storage', label: 'Material Storage / Laydown', icon: '📦', category: 'storage' },
  { id: 'fuel-storage', label: 'Bunded Fuel Storage', icon: '⛽', category: 'storage' },
  { id: 'plant-parking', label: 'Plant Parking', icon: '🚜', category: 'storage' },
  { id: 'gas-storage', label: 'Gas Bottle Cage', icon: '🧪', category: 'storage' },

  { id: 'scaffold-zone', label: 'Scaffold Zone', icon: '🏗️', category: 'work-zones' },
  { id: 'crane-zone', label: 'Crane / Lifting Zone', icon: '🏋️', category: 'work-zones' },
  { id: 'excavation-zone', label: 'Excavation Zone', icon: '⛏️', category: 'work-zones' },
  { id: 'tw-zone', label: 'Temporary Works Zone', icon: '🔩', category: 'work-zones' },
  { id: 'concrete-wash', label: 'Concrete Washout', icon: '🪣', category: 'work-zones' },

  { id: 'exclusion-zone', label: 'Exclusion Zone', icon: '⛔', category: 'protection' },
  { id: 'public-protection', label: 'Public Protection (fan/gantry)', icon: '🛡️', category: 'protection' },
  { id: 'dust-suppression', label: 'Dust Suppression', icon: '💦', category: 'protection' },
  { id: 'noise-barrier', label: 'Noise Barrier / Monitor', icon: '🔇', category: 'protection' },
  { id: 'drain-protection', label: 'Drain Protection', icon: '🕳️', category: 'protection' },
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
