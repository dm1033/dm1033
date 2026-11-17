// One recipe for every placeable item in src/data/siteItems.ts, plus the context structures.
// The recipes live in one file per group of catalogue categories; this file only joins them up.
import type { StructureModel, Vec3 } from '../../types'
import { box, cylinder, type ShapePart, type ShapeRecipe } from '../recipe'
import { ACCESS_SHAPES } from './access'
import { WELFARE_SHAPES } from './welfare'
import { LOGISTICS_SHAPES } from './logistics'
import { WORKZONE_SHAPES } from './workzones'
import { ENVIRONMENT_SHAPES } from './environment'

export const ITEM_SHAPES: Record<string, ShapeRecipe> = {
  ...ACCESS_SHAPES,
  ...WELFARE_SHAPES,
  ...LOGISTICS_SHAPES,
  ...WORKZONE_SHAPES,
  ...ENVIRONMENT_SHAPES,
}

/** Drawn for an item id the catalogue does not know: a plain crate, so nothing is ever invisible. */
export const FALLBACK_SHAPE: ShapeRecipe = {
  footprint: [1.6, 1.6],
  parts: [box([1.6, 1.2, 1.6], [0, 0, 0], 'S'), box([1.64, 0.2, 1.64], [0, 0.5, 0], 'D')],
}

export const shapeFor = (itemId: string): ShapeRecipe => ITEM_SHAPES[itemId] ?? FALLBACK_SHAPE

const STOREY = 3

/**
 * Context structures, as parts in a frame centred on the structure's footprint at ground level.
 * A pit has no parts of its own (the scene cuts it out of the ground); it gets a pipe on the floor.
 */
export const STRUCTURE_SHAPES: Record<StructureModel['kind'], (size: Vec3) => ShapePart[]> = {
  // Occupied building: solid walls, a band of glazing to every storey, a dark roof.
  building: ([w, h, d]) => {
    const storeys = Math.max(1, Math.floor(h / STOREY))
    return [
      box([w - 0.4, h, d - 0.4], [0, 0, 0], 'wall'),
      ...Array.from({ length: storeys }, (_, i) => box([w - 0.3, 1.2, d - 0.3], [0, 1.1 + i * STOREY, 0], 'glass')),
      box([w - 0.2, 0.3, d - 0.2], [0, h, 0], 'roof'),
    ]
  },
  // Work area: an open frame of corner columns tied by an edge beam, so items inside stay visible.
  frame: ([w, h, d]) => {
    const height = Math.min(Math.max(h, 3), 4.5)
    const x = w / 2 - 0.35
    const z = d / 2 - 0.35
    return [
      ...[-x, x].flatMap((cx) => [-z, z].map((cz) => box([0.45, height, 0.45], [cx, 0, cz], 'concrete'))),
      box([w - 0.7, 0.3, 0.3], [0, height - 0.3, -z], 'concrete'),
      box([w - 0.7, 0.3, 0.3], [0, height - 0.3, z], 'concrete'),
      box([0.3, 0.3, d - 0.7], [-x, height - 0.3, 0], 'concrete'),
      box([0.3, 0.3, d - 0.7], [x, height - 0.3, 0], 'concrete'),
    ]
  },
  pit: ([w, h, d]) => {
    const alongX = w >= d
    const length = Math.max(1, (alongX ? w : d) - 2.4)
    return [cylinder(0.25, length, [0, -Math.min(Math.max(h, 0.8), 2) + 0.02, 0], 'B', { axis: alongX ? 'x' : 'z' })]
  },
}
