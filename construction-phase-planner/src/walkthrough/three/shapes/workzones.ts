// Work-zone items (catalogue category "work-zones").
import { box, cone, cylinder, ring, type ShapeRecipe } from '../recipe'

const LIFTS = [2, 4, 6]

export const WORKZONE_SHAPES: Record<string, ShapeRecipe> = {
  // Three-lift independent scaffold: steel standards and ledgers, timber boards, a ladder.
  'scaffold-zone': {
    footprint: [3.9, 1.5],
    parts: [
      ...[-1.9, 0, 1.9].flatMap((x) => [-0.65, 0.65].map((z) => box([0.08, 7.1, 0.08], [x, 0, z], 'S'))),
      ...LIFTS.flatMap((y) => [
        box([3.8, 0.07, 0.07], [0, y - 0.1, 0.65], 'S'),
        box([3.8, 0.07, 0.07], [0, y - 0.1, -0.65], 'S'),
        box([3.8, 0.08, 1.2], [0, y, 0], 'T'),
        box([3.8, 0.15, 0.04], [0, y + 0.08, 0.63], 'T'),
      ]),
      box([3.8, 0.06, 0.06], [0, 7.0, 0.65], 'S'),
      box([3.8, 0.06, 0.06], [0, 6.5, 0.65], 'S'),
      box([0.07, 2.75, 0.07], [-1.9, 0.05, 0.7], 'S', { lean: [44, 0] }),
      box([0.45, 2.3, 0.06], [1.2, 0, 1.25], 'W', { lean: [0, -15] }),
    ],
  },

  // Mobile crane on outriggers with the boom raised, inside a yellow lifting-radius ring.
  'crane-zone': {
    footprint: [3.8, 3.8],
    parts: [
      ...ring(1.85, 'Y', { segments: 14, width: 0.16, height: 0.03, y: 0.02 }),
      cylinder(0.45, 1.5, [-1.1, 0, 0], 'D', { axis: 'z' }),
      cylinder(0.45, 1.5, [1.1, 0, 0], 'D', { axis: 'z' }),
      box([3.4, 0.7, 1.3], [0, 0.5, 0], 'Y'),
      box([0.24, 0.2, 3.5], [-1.5, 0.3, 0], 'D'),
      box([0.24, 0.2, 3.5], [1.5, 0.3, 0], 'D'),
      ...[-1.5, 1.5].flatMap((x) => [-1.65, 1.65].map((z) => box([0.5, 0.3, 0.5], [x, 0, z], 'S'))),
      box([0.9, 0.85, 1.0], [-1.15, 1.2, 0], 'D'),
      cylinder(0.6, 0.4, [0.5, 1.2, 0], 'D'),
      box([0.45, 9, 0.45], [0.5, 1.5, 0], 'Y', { lean: [25, 0] }),
      box([0.05, 3.2, 0.05], [4.3, 6.4, 0], 'D'),
      box([0.3, 0.4, 0.3], [4.3, 6.0, 0], 'R'),
    ],
  },

  // An open dig with orange edge barriers on all sides and a spoil heap set back from the edge.
  'excavation-zone': {
    footprint: [3.8, 3.6],
    parts: [
      ...[-1, 1].flatMap((s) => [
        box([2.7, 0.14, 0.06], [-0.5, 0.95, s * 1.5], 'O'),
        box([2.7, 0.14, 0.06], [-0.5, 0.5, s * 1.5], 'O'),
      ]),
      ...[-1.85, 0.85].flatMap((x) => [
        box([0.06, 0.14, 3.0], [x, 0.95, 0], 'O'),
        box([0.06, 0.14, 3.0], [x, 0.5, 0], 'O'),
      ]),
      ...[-1.85, 0.85].flatMap((x) => [-1.5, 1.5].map((z) => box([0.1, 1.1, 0.1], [x, 0, z], 'W'))),
      cone(0.75, 1.0, [1.25, 0, -0.9], 'T', { sides: 7 }),
      cone(0.6, 0.75, [1.3, 0, 0.5], 'T', { sides: 7 }),
    ],
    pit: { centre: [-0.5, 0], size: [2.2, 2.5], depth: 1.4 },
  },

  // A sheeted wall held by a steel waling and three red raking props on kicker blocks.
  'tw-zone': {
    footprint: [3.6, 2.4],
    parts: [
      box([3.5, 2.5, 0.18], [0, 0, -0.9], 'S'),
      ...[-1.4, -0.7, 0, 0.7, 1.4].map((x) => box([0.1, 2.5, 0.06], [x, 0, -0.79], 'D')),
      box([3.5, 0.28, 0.22], [0, 1.6, -0.68], 'S'),
      ...[-1.2, 0, 1.2].flatMap((x) => [
        box([0.16, 2.4, 0.16], [x, 0.15, 0.95], 'R', { lean: [0, -42] }),
        box([0.5, 0.25, 0.5], [x, 0, 1.0], 'D'),
      ]),
    ],
  },

  // A lined, bunded tray of grey washout water with a sign.
  'concrete-wash': {
    footprint: [3.0, 2.4],
    parts: [
      box([3.0, 0.5, 0.14], [0, 0, 1.0], 'D'),
      box([3.0, 0.5, 0.14], [0, 0, -1.0], 'D'),
      box([0.14, 0.5, 2.0], [1.43, 0, 0], 'D'),
      box([0.14, 0.5, 2.0], [-1.43, 0, 0], 'D'),
      box([2.75, 0.3, 1.9], [0, 0, 0], 'S'),
      box([1.2, 0.03, 0.7], [0.4, 0.3, 0.2], 'W', { rotY: 20 }),
      cylinder(0.05, 1.9, [-1.3, 0, -1.2], 'S', { sides: 6 }),
      box([0.8, 0.6, 0.06], [-1.3, 1.3, -1.2], 'B'),
    ],
  },
}
