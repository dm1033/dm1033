// Boundary, security and traffic items (catalogue categories "boundary" and "access").
// See ../recipe.ts for the conventions: metres, `at` is the centre of a part's underside.
import { box, cone, cylinder, type ShapeRecipe } from '../recipe'

const HOARDING_PANEL = 2.4

export const ACCESS_SHAPES: Record<string, ShapeRecipe> = {
  // Run of 2.4 m high white panels with a blue band and steel posts.
  hoarding: {
    footprint: [HOARDING_PANEL, 0.4],
    parts: [
      box([HOARDING_PANEL - 0.04, 2.4, 0.08], [0, 0, 0], 'W'),
      box([HOARDING_PANEL - 0.04, 0.45, 0.12], [0, 1.85, 0], 'B'),
      box([0.1, 2.5, 0.16], [-HOARDING_PANEL / 2, 0, 0], 'S'),
    ],
    run: { module: HOARDING_PANEL, ends: [box([0.1, 2.5, 0.16], [HOARDING_PANEL / 2, 0, 0], 'S')], edge: 1.6, gapsAtGates: true },
  },

  // Steel posts 5.8 m apart with a pair of red leaves swung open into the site.
  'gate-vehicle': {
    footprint: [6, 1.8],
    parts: [
      box([0.26, 2.7, 0.26], [-2.9, 0, 0], 'S'),
      box([0.26, 2.7, 0.26], [2.9, 0, 0], 'S'),
      box([2.8, 1.9, 0.08], [4.11, 0.15, 0.7], 'R', { rotY: -30 }),
      box([2.8, 1.9, 0.08], [-4.11, 0.15, 0.7], 'R', { rotY: 30 }),
      box([2.8, 0.25, 0.1], [4.11, 1.0, 0.7], 'W', { rotY: -30 }),
      box([2.8, 0.25, 0.1], [-4.11, 1.0, 0.7], 'W', { rotY: 30 }),
      box([5.5, 0.03, 0.3], [0, 0.02, 0], 'Y'),
    ],
    gate: { opening: 6.2 },
  },

  // A single green leaf 1.2 m wide, open, under a green header.
  'gate-pedestrian': {
    footprint: [1.8, 1.4],
    parts: [
      box([0.14, 2.3, 0.14], [-0.7, 0, 0], 'S'),
      box([0.14, 2.3, 0.14], [0.7, 0, 0], 'S'),
      box([1.54, 0.35, 0.12], [0, 2.1, 0], 'G'),
      box([1.2, 1.9, 0.06], [-0.3, 0.1, 0.52], 'G', { rotY: -60 }),
      box([1.2, 0.03, 0.9], [0, 0.02, 0], 'G'),
    ],
    gate: { opening: 1.8 },
  },

  // Three boards on two posts: information (blue), warning (yellow), prohibition (red).
  signage: {
    footprint: [2.5, 0.4],
    parts: [
      box([0.1, 2.7, 0.1], [-1.15, 0, 0], 'S'),
      box([0.1, 2.7, 0.1], [1.15, 0, 0], 'S'),
      box([0.74, 1.0, 0.08], [-0.78, 1.55, 0], 'B'),
      box([0.74, 1.0, 0.08], [0, 1.55, 0], 'Y'),
      box([0.74, 1.0, 0.08], [0.78, 1.55, 0], 'R'),
      box([2.4, 0.06, 0.06], [0, 1.47, 0], 'S'),
    ],
  },

  // Dark gatehouse kiosk beside a 4 m camera pole.
  security: {
    footprint: [3.2, 2],
    parts: [
      box([1.7, 2.3, 1.7], [0.6, 0, 0], 'D'),
      box([1.74, 0.6, 1.74], [0.6, 1.15, 0], 'W'),
      box([2.0, 0.12, 2.0], [0.6, 2.3, 0], 'S'),
      cylinder(0.08, 4, [-1.2, 0, 0], 'D'),
      box([0.3, 0.3, 0.3], [-1.2, 0, 0], 'S'),
      box([0.7, 0.08, 0.08], [-0.95, 3.85, 0], 'D'),
      box([0.5, 0.22, 0.24], [-0.7, 3.6, 0], 'W', { lean: [0, 20] }),
    ],
  },

  // 5 m mast on a ballast base with a pair of lamp heads.
  lighting: {
    footprint: [1.6, 1.2],
    parts: [
      box([1.2, 0.5, 1.0], [0, 0, 0], 'S'),
      cylinder(0.09, 4.6, [0, 0.5, 0], 'S'),
      box([1.5, 0.1, 0.1], [0, 5.0, 0], 'S'),
      box([0.6, 0.35, 0.5], [-0.55, 5.1, 0], 'W', { lean: [0, 25] }),
      box([0.6, 0.35, 0.5], [0.55, 5.1, 0], 'W', { lean: [0, 25] }),
    ],
  },

  // Green walkway 1.2 m wide with an orange handrail down one side.
  'pedestrian-route': {
    footprint: [4, 1.5],
    parts: [
      box([4, 0.04, 1.2], [0, 0.05, 0], 'G'),
      box([4, 0.06, 0.06], [0, 1.0, 0.7], 'O'),
      box([4, 0.05, 0.05], [0, 0.55, 0.7], 'O'),
      box([0.07, 1.06, 0.07], [-1, 0, 0.7], 'O'),
      box([0.07, 1.06, 0.07], [1, 0, 0.7], 'O'),
    ],
    run: { module: 4 },
  },

  // Dark haul road 3.5 m wide with a broken white centre line.
  'vehicle-route': {
    footprint: [4, 3.5],
    parts: [
      box([4, 0.03, 3.5], [0, 0.02, 0], 'D'),
      box([1.8, 0.02, 0.16], [0, 0.05, 0], 'W'),
      box([4, 0.02, 0.1], [0, 0.05, 1.6], 'Y'),
      box([4, 0.02, 0.1], [0, 0.05, -1.6], 'Y'),
    ],
    run: { module: 4 },
  },

  // Three cones across the lane and a stop disc on a pole.
  'traffic-management': {
    footprint: [3.4, 2],
    parts: [
      ...[-1.2, 0, 1.2].flatMap((x) => [
        box([0.6, 0.06, 0.6], [x, 0, 0.6], 'O'),
        cone(0.24, 0.95, [x, 0.06, 0.6], 'O'),
        cylinder(0.17, 0.16, [x, 0.4, 0.6], 'W'),
      ]),
      cylinder(0.05, 2.2, [0, 0, -0.6], 'S'),
      box([0.5, 0.1, 0.5], [0, 0, -0.6], 'D'),
      cylinder(0.5, 0.08, [0, 1.5, -0.6], 'R', { axis: 'z', sides: 10 }),
      box([0.72, 0.18, 0.12], [0, 1.91, -0.6], 'W'),
    ],
  },

  // Drive-through trough of water with a ramp at each end and blue spray bars.
  'wheel-wash': {
    footprint: [3, 3.9],
    parts: [
      box([2.8, 0.3, 2.3], [0, 0, 0], 'S'),
      box([2.4, 0.04, 2.0], [0, 0.3, 0], 'B'),
      box([2.8, 0.08, 0.98], [0, 0.12, 1.6], 'S', { lean: [0, 18] }),
      box([2.8, 0.08, 0.98], [0, 0.12, -1.6], 'S', { lean: [0, -18] }),
      ...[-1.3, 1.3].flatMap((x) => [
        box([0.1, 1.5, 0.1], [x, 0.3, -0.9], 'B'),
        box([0.1, 1.5, 0.1], [x, 0.3, 0.9], 'B'),
        box([0.1, 0.1, 1.9], [x, 1.8, 0], 'B'),
      ]),
    ],
  },
}
