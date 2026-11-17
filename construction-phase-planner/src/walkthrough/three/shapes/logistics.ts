// Storage and logistics items (catalogue category "storage").
import { box, cylinder, type ShapePart, type ShapeRecipe } from '../recipe'

/** An open yellow skip 3.5 m x 1.8 m with sloping ends and a part load. */
function skip(z: number): ShapePart[] {
  return [
    box([2.9, 0.12, 1.7], [0, 0.1, z], 'D'),
    box([3.5, 1.2, 0.1], [0, 0.1, z - 0.85], 'Y'),
    box([3.5, 1.2, 0.1], [0, 0.1, z + 0.85], 'Y'),
    box([0.1, 1.3, 1.8], [1.45, 0.1, z], 'Y', { lean: [18, 0] }),
    box([0.1, 1.3, 1.8], [-1.45, 0.1, z], 'Y', { lean: [-18, 0] }),
    box([2.5, 0.5, 1.4], [0.1, 0.22, z], 'T', { rotY: 4 }),
  ]
}

/** A pallet with a wrapped load. */
function pallet(x: number, z: number, height: number): ShapePart[] {
  return [
    box([1.2, 0.15, 1.0], [x, 0, z], 'T'),
    box([1.1, height, 0.9], [x, 0.15, z], 'W'),
    box([1.12, 0.12, 0.92], [x, 0.15 + height * 0.5, z], 'B'),
  ]
}

export const LOGISTICS_SHAPES: Record<string, ShapeRecipe> = {
  // Two open skips side by side.
  skips: {
    footprint: [3.7, 3.8],
    parts: [...skip(-1.0), ...skip(1.0)],
  },

  // Pallet stacks, a timber pack and a pyramid of blue pipes.
  'material-storage': {
    footprint: [3.8, 3.6],
    parts: [
      ...pallet(-1.2, -1.1, 1.0),
      ...pallet(0.2, -1.1, 1.5),
      ...pallet(1.5, -1.1, 0.7),
      box([2.4, 0.1, 0.12], [-0.6, 0, 0.1], 'D', { rotY: 90 }),
      box([3.4, 0.5, 1.0], [0, 0.1, 0.25], 'T'),
      cylinder(0.2, 3.4, [0, 0, 1.15], 'B', { axis: 'x' }),
      cylinder(0.2, 3.4, [0, 0, 1.56], 'B', { axis: 'x' }),
      cylinder(0.2, 3.4, [0, 0.35, 1.355], 'B', { axis: 'x' }),
    ],
  },

  // Green tank sitting in a steel bund tray, with a dispensing pump.
  'fuel-storage': {
    footprint: [3.2, 2.2],
    parts: [
      box([3.2, 0.12, 2.2], [0, 0, 0], 'S'),
      box([3.2, 0.5, 0.1], [0, 0.12, 1.05], 'S'),
      box([3.2, 0.5, 0.1], [0, 0.12, -1.05], 'S'),
      box([0.1, 0.5, 2.2], [1.55, 0.12, 0], 'S'),
      box([0.1, 0.5, 2.2], [-1.55, 0.12, 0], 'S'),
      box([0.2, 0.35, 1.3], [-0.7, 0.12, 0], 'D'),
      box([0.2, 0.35, 1.3], [0.5, 0.12, 0], 'D'),
      cylinder(0.72, 2.3, [-0.15, 0.42, 0], 'G', { axis: 'x', sides: 10 }),
      box([0.35, 1.2, 0.35], [1.25, 0.12, 0.6], 'D'),
      box([0.4, 0.4, 0.06], [1.25, 1.0, 0.78], 'Y'),
    ],
  },

  // A tracked excavator parked in a marked bay.
  'plant-parking': {
    footprint: [3.8, 3.6],
    parts: [
      box([0.1, 0.02, 3.5], [-1.85, 0.02, 0], 'W'),
      box([0.1, 0.02, 3.5], [1.85, 0.02, 0], 'W'),
      box([3.8, 0.02, 0.1], [0, 0.02, -1.75], 'W'),
      box([2.6, 0.55, 0.5], [-0.3, 0, 0.8], 'D'),
      box([2.6, 0.55, 0.5], [-0.3, 0, -0.8], 'D'),
      box([1.9, 0.9, 1.7], [-0.5, 0.55, 0], 'Y'),
      box([0.6, 0.5, 1.5], [-1.2, 1.45, 0], 'D'),
      box([0.9, 1.0, 0.8], [0, 1.45, -0.4], 'Y'),
      box([0.94, 0.55, 0.84], [0, 1.75, -0.4], 'D'),
      box([0.3, 2.3, 0.3], [0.3, 1.3, 0.4], 'Y', { lean: [42, 0] }),
      box([0.22, 1.7, 0.22], [1.55, 1.35, 0.4], 'Y', { lean: [10, 0] }),
      box([0.5, 0.45, 0.6], [1.45, 0.9, 0.4], 'D'),
    ],
  },

  // Open steel cage with a roof and a row of red cylinders inside.
  'gas-storage': {
    footprint: [2.2, 1.5],
    parts: [
      ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box([0.08, 2.0, 0.08], [sx * 1.0, 0, sz * 0.65], 'S'))),
      ...[0.5, 1.2, 1.9].flatMap((y) => [
        box([2.0, 0.05, 0.05], [0, y, 0.65], 'S'),
        box([2.0, 0.05, 0.05], [0, y, -0.65], 'S'),
        box([0.05, 0.05, 1.3], [1.0, y, 0], 'S'),
        box([0.05, 0.05, 1.3], [-1.0, y, 0], 'S'),
      ]),
      box([2.2, 0.06, 1.5], [0, 2.0, 0], 'S'),
      box([2.0, 0.06, 1.3], [0, 0, 0], 'D'),
      ...[-0.72, -0.36, 0, 0.36, 0.72].flatMap((x) => [
        cylinder(0.15, 1.2, [x, 0.06, -0.15], 'R', { sides: 6 }),
        cylinder(0.06, 0.2, [x, 1.26, -0.15], 'D', { sides: 6 }),
      ]),
      box([0.6, 0.45, 0.04], [0, 1.3, 0.7], 'Y'),
    ],
  },
}
