// Protection and environment items (catalogue category "protection").
import { box, cylinder, ring, type ShapeRecipe } from '../recipe'

const GANTRY_BAY = 3
const BARRIER_PANEL = 2.4

export const ENVIRONMENT_SHAPES: Record<string, ShapeRecipe> = {
  // Four posts, two rows of tape and a no-entry disc laid on the ground.
  'exclusion-zone': {
    footprint: [3.6, 3.6],
    parts: [
      ...[-1.7, 1.7].flatMap((x) => [-1.7, 1.7].flatMap((z) => [
        cylinder(0.07, 1.15, [x, 0, z], 'R', { sides: 6 }),
        box([0.4, 0.08, 0.4], [x, 0, z], 'W'),
      ])),
      ...[-1.7, 1.7].flatMap((z) => [
        box([3.4, 0.1, 0.03], [0, 0.95, z], 'R'),
        box([3.4, 0.1, 0.03], [0, 0.72, z], 'W'),
      ]),
      ...[-1.7, 1.7].flatMap((x) => [
        box([0.03, 0.1, 3.4], [x, 0.95, 0], 'R'),
        box([0.03, 0.1, 3.4], [x, 0.72, 0], 'W'),
      ]),
      cylinder(1.15, 0.04, [0, 0.02, 0], 'R', { sides: 16 }),
      box([1.7, 0.03, 0.38], [0, 0.06, 0], 'W'),
    ],
  },

  // Covered walkway 2.5 m high: steel posts, a timber deck and a yellow fascia on both sides.
  'public-protection': {
    footprint: [GANTRY_BAY, 2.6],
    parts: [
      box([0.12, 2.5, 0.12], [-GANTRY_BAY / 2, 0, 1.2], 'S'),
      box([0.12, 2.5, 0.12], [-GANTRY_BAY / 2, 0, -1.2], 'S'),
      box([GANTRY_BAY, 0.16, 2.6], [0, 2.5, 0], 'T'),
      box([GANTRY_BAY, 0.55, 0.08], [0, 2.66, 1.3], 'Y'),
      box([GANTRY_BAY, 0.55, 0.08], [0, 2.66, -1.3], 'Y'),
    ],
    run: {
      module: GANTRY_BAY,
      ends: [box([0.12, 2.5, 0.12], [GANTRY_BAY / 2, 0, 1.2], 'S'), box([0.12, 2.5, 0.12], [GANTRY_BAY / 2, 0, -1.2], 'S')],
    },
  },

  // Blue misting cannon and water tank on a small trailer.
  'dust-suppression': {
    footprint: [3.2, 1.7],
    parts: [
      cylinder(0.36, 1.6, [-0.3, 0, 0], 'D', { axis: 'z' }),
      box([2.3, 0.2, 1.3], [-0.2, 0.45, 0], 'S'),
      box([0.9, 0.1, 0.1], [1.35, 0.5, 0], 'S'),
      box([0.1, 0.5, 0.1], [1.75, 0, 0], 'S'),
      box([1.0, 0.85, 1.1], [-0.75, 0.65, 0], 'B'),
      box([0.4, 0.5, 0.4], [0.45, 0.65, 0], 'S'),
      cylinder(0.42, 1.4, [0.45, 1.1, 0], 'B', { lean: [58, 0], sides: 10 }),
      cylinder(0.47, 0.14, [1.55, 1.79, 0], 'W', { lean: [58, 0], sides: 10 }),
    ],
  },

  // Run of 3 m high dark acoustic panels with a green band.
  'noise-barrier': {
    footprint: [BARRIER_PANEL, 0.4],
    parts: [
      box([BARRIER_PANEL - 0.04, 3.0, 0.12], [0, 0, 0], 'D'),
      box([BARRIER_PANEL - 0.04, 0.6, 0.16], [0, 2.1, 0], 'G'),
      box([0.12, 3.1, 0.2], [-BARRIER_PANEL / 2, 0, 0], 'S'),
    ],
    run: { module: BARRIER_PANEL, ends: [box([0.12, 3.1, 0.2], [BARRIER_PANEL / 2, 0, 0], 'S')], edge: 1.15, gapsAtGates: true },
  },

  // Orange cover mat over the gully, ringed by a blue absorbent boom.
  'drain-protection': {
    footprint: [2.9, 2.9],
    parts: [
      box([1.5, 0.07, 1.5], [0, 0.03, 0], 'O'),
      box([1.1, 0.04, 0.12], [0, 0.1, 0], 'D', { rotY: 45 }),
      box([1.1, 0.04, 0.12], [0, 0.1, 0], 'D', { rotY: -45 }),
      ...ring(1.3, 'B', { segments: 10, width: 0.24, height: 0.22, y: 0 }),
    ],
  },
}
