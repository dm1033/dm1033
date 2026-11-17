// Welfare cabins and emergency points (catalogue categories "welfare" and "emergency").
// Cabins are drawn 3.8 m long so that two in neighbouring grid cells never run into each other.
import { box, cone, cylinder, type ShapePart, type ShapeRecipe } from '../recipe'
import type { ColourKey } from '../recipe'

const CABIN_H = 2.6
const CABIN_D = 2.4

/** A site cabin on bearers: body, flat roof, a door and a window on the +z face. */
function cabin(length: number, body: ColourKey, roof: ColourKey, door: ColourKey): ShapePart[] {
  const front = CABIN_D / 2
  return [
    box([length, CABIN_H - 0.15, CABIN_D], [0, 0.15, 0], body),
    box([length - 0.3, 0.15, CABIN_D - 0.4], [0, 0, 0], 'D'),
    box([length + 0.12, 0.1, CABIN_D + 0.12], [0, CABIN_H, 0], roof),
    box([0.9, 2.0, 0.06], [-length / 2 + 0.85, 0.2, front], door),
    box([1.3, 0.8, 0.06], [length / 2 - 1.05, 1.25, front], 'D'),
  ]
}

export const WELFARE_SHAPES: Record<string, ShapeRecipe> = {
  // Green canteen cabin with a step and a white roof.
  welfare: {
    footprint: [3.8, 3.2],
    parts: [
      ...cabin(3.8, 'G', 'W', 'W'),
      box([1.1, 0.2, 0.5], [-1.05, 0, 1.45], 'S'),
      box([0.5, 0.5, 0.5], [1.2, CABIN_H + 0.1, -0.5], 'S'),
    ],
  },

  // Two blue cubicles, each 1.2 m square and 2.3 m high.
  toilets: {
    footprint: [2.7, 1.4],
    parts: [-0.68, 0.68].flatMap((x) => [
      box([1.2, 2.3, 1.2], [x, 0, 0], 'B'),
      box([1.3, 0.1, 1.3], [x, 2.3, 0], 'W'),
      box([0.7, 1.8, 0.05], [x, 0.15, 0.6], 'W'),
      cylinder(0.06, 0.5, [x + 0.35, 2.4, -0.35], 'S', { sides: 6 }),
    ]),
  },

  // Timber-coloured cabin with a roof vent and a louvre for the heater.
  'drying-room': {
    footprint: [3.6, 2.6],
    parts: [
      ...cabin(3.6, 'T', 'S', 'D'),
      box([0.7, 0.45, 0.7], [0.6, CABIN_H + 0.1, 0], 'S'),
      box([0.9, 0.1, 0.9], [0.6, CABIN_H + 0.55, 0], 'D'),
      box([0.06, 0.7, 0.9], [1.8, 1.2, 0], 'D'),
    ],
  },

  // White office cabin with a blue band, steps up to the door and a noticeboard.
  office: {
    footprint: [3.8, 3.6],
    parts: [
      ...cabin(3.8, 'W', 'S', 'B'),
      box([3.84, 0.3, CABIN_D + 0.04], [0, 2.2, 0], 'B'),
      box([1.1, 0.14, 0.9], [-1.05, 0, 1.65], 'S'),
      box([1.1, 0.14, 0.45], [-1.05, 0.14, 1.43], 'S'),
      box([0.08, 1.9, 0.08], [0.65, 0, 1.6], 'S'),
      box([0.08, 1.9, 0.08], [1.75, 0, 1.6], 'S'),
      box([1.2, 0.9, 0.08], [1.2, 1.0, 1.6], 'Y'),
    ],
  },

  // Green cabinet with a raised white cross on the front, the back and the top.
  'first-aid': {
    footprint: [1.6, 1.2],
    parts: [
      box([1.3, 0.25, 0.9], [0, 0, 0], 'S'),
      box([1.5, 1.7, 1.0], [0, 0.25, 0], 'G'),
      box([0.26, 0.9, 0.08], [0, 0.65, 0.5], 'W'),
      box([0.9, 0.26, 0.09], [0, 0.97, 0.5], 'W'),
      box([0.26, 0.9, 0.08], [0, 0.65, -0.5], 'W'),
      box([0.9, 0.26, 0.09], [0, 0.97, -0.5], 'W'),
      box([0.24, 0.05, 0.8], [0, 1.95, 0], 'W'),
      box([0.8, 0.06, 0.24], [0, 1.95, 0], 'W'),
    ],
  },

  // Red stand with a back board, two extinguishers and a yellow call point.
  'fire-point': {
    footprint: [1.6, 1.0],
    parts: [
      box([1.6, 0.2, 0.9], [0, 0, 0], 'R'),
      box([1.6, 1.9, 0.1], [0, 0.2, -0.38], 'R'),
      box([1.3, 0.3, 0.14], [0, 1.7, -0.38], 'W'),
      ...[-0.4, 0.4].flatMap((x) => [
        cylinder(0.18, 0.75, [x, 0.2, 0.05], 'R'),
        cone(0.18, 0.2, [x, 0.95, 0.05], 'D'),
      ]),
      box([0.3, 0.3, 0.16], [0, 1.2, -0.3], 'Y'),
    ],
  },

  // Green assembly sign on a 3 m pole in the middle of a green ground disc.
  'muster-point': {
    footprint: [3.2, 3.2],
    parts: [
      cylinder(1.6, 0.04, [0, 0.02, 0], 'G', { sides: 16 }),
      cylinder(1.05, 0.03, [0, 0.06, 0], 'W', { sides: 16 }),
      cylinder(0.85, 0.03, [0, 0.09, 0], 'G', { sides: 16 }),
      cylinder(0.07, 3, [0, 0, 0], 'S'),
      box([1.1, 1.1, 0.08], [0, 1.95, 0], 'G'),
      box([0.5, 0.5, 0.12], [0, 2.25, 0], 'W'),
    ],
  },

  // Yellow wheeled bin with a dark lid.
  'spill-kit': {
    footprint: [1.3, 1.3],
    parts: [
      box([1.2, 1.15, 1.0], [0, 0.2, 0], 'Y'),
      box([1.3, 0.14, 1.1], [0, 1.35, 0], 'D'),
      cylinder(0.2, 1.3, [0, 0, -0.35], 'D', { axis: 'x' }),
      box([0.7, 0.45, 0.04], [0, 0.6, 0.5], 'W'),
      box([0.08, 0.3, 0.08], [0.45, 0, 0.4], 'D'),
      box([0.08, 0.3, 0.08], [-0.45, 0, 0.4], 'D'),
    ],
  },
}
