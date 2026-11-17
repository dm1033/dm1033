// Shape recipes: every site item is drawn from a short list of flat-shaded primitives.
//
// This file is pure data and maths (no three.js, no DOM) so the recipes can be checked in node.
//
// Conventions, in metres and degrees:
//   - An item's own frame has x along its width, z along its depth and y up, with the origin at
//     the centre of its footprint ON THE GROUND.
//   - `at` is the centre of a part's UNDERSIDE, so `at: [0, 0, 0]` stands the part on the ground
//     and nothing can be buried by accident. A horizontal cylinder (`axis: 'x' | 'z'`) rests on
//     `at` along its length.
//   - `lean: [towardX, towardZ]` tips the part over about the centre of its underside (a raking
//     prop pivots on its foot); `rotY` then turns it about the vertical, anticlockwise seen from
//     above (local +x swings towards -z).
//   - A single-cell item must fit one 4 m grid cell, so keep it within about 3.8 m x 3.8 m on
//     plan. Height is free.
import type { Vec3 } from '../types'

/** Item palette from the visual specification. */
export const PALETTE = {
  Y: '#FFD400', // plant, skips, warning
  O: '#F26A1B', // barriers, cones
  R: '#C8102E', // fire, gas, prohibition
  G: '#1E8E3E', // welfare, safe condition
  B: '#2F6DB5', // water, information
  W: '#F2F2F2', // cabins, hoarding, markings
  S: '#9AA4AE', // steel, galvanised
  T: '#C19A6B', // timber, spoil
  D: '#2B2F36', // rubber, tarmac, glass
} as const
export type PaletteKey = keyof typeof PALETTE

/** Colours for the ground, buildings and pits. Kept apart from the item palette on purpose. */
export const CONTEXT = {
  ground: '#8C8474',
  yard: '#9C947F',
  asphalt: '#50545B',
  paving: '#B9B4A8',
  kerb: '#D0CCC2',
  verge: '#7E7667',
  apron: '#A9A393',
  slab: '#ADB2B6',
  pad: '#6F6A61',
  earth: '#7B6146',
  earthDark: '#4E3D2C',
  wall: '#B8AC9C',
  roof: '#5E6268',
  glass: '#4F6F8F',
  concrete: '#C4C7C9',
  beyond: '#3B424C',
} as const
export type ContextKey = keyof typeof CONTEXT
export type ColourKey = PaletteKey | ContextKey

export function colourHex(key: ColourKey): string {
  return key in PALETTE ? PALETTE[key as PaletteKey] : CONTEXT[key as ContextKey]
}

interface PartBase {
  /** Centre of the part's underside, relative to the item centre on the ground. */
  at: Vec3
  /** Degrees about the vertical, anticlockwise from above. */
  rotY?: number
  /** Degrees tipped towards +x and towards +z, pivoting on the centre of the underside. */
  lean?: [number, number]
  colour: ColourKey
}
export interface BoxPart extends PartBase { kind: 'box'; /** Width (x), height (y), depth (z). */ size: Vec3 }
export interface CylinderPart extends PartBase {
  kind: 'cylinder'; radius: number
  /** Length along `axis`. */
  height: number
  axis?: 'x' | 'y' | 'z'
  sides?: number
}
export interface ConePart extends PartBase {
  kind: 'cone'; radius: number; height: number; sides?: number
  /** Point down: the tip sits on `at`. */
  inverted?: boolean
}
export type ShapePart = BoxPart | CylinderPart | ConePart

/**
 * A linear item: `parts` describe one module `module` metres long (along x, centred on the
 * origin) and the scene repeats it to fill the item's run.
 */
export interface RunSpec {
  module: number
  /** Parts that close off the +x end of a stretch (a last post), in the module's frame. */
  ends?: ShapePart[]
  /** Barriers stand this far off the centre line of their strip, on the side away from the site centre. */
  edge?: number
  /** Leave an opening wherever a gate stands on the line. */
  gapsAtGates?: boolean
}

export interface ShapeRecipe {
  /** Nominal size on plan: [width along x, depth along z]. */
  footprint: [number, number]
  parts: ShapePart[]
  run?: RunSpec
  /** Gates snap onto a nearby barrier and open it by this many metres. */
  gate?: { opening: number }
  /** A real hole cut in the ground under the item (centre is [x, z] in the item's frame). */
  pit?: { centre: [number, number]; size: [number, number]; depth: number }
}

type PartOptions = Pick<PartBase, 'rotY' | 'lean'>

export const box = (size: Vec3, at: Vec3, colour: ColourKey, options: PartOptions = {}): BoxPart =>
  ({ kind: 'box', size, at, colour, ...options })

export const cylinder = (
  radius: number, height: number, at: Vec3, colour: ColourKey,
  options: PartOptions & Pick<CylinderPart, 'axis' | 'sides'> = {},
): CylinderPart => ({ kind: 'cylinder', radius, height, at, colour, ...options })

export const cone = (
  radius: number, height: number, at: Vec3, colour: ColourKey,
  options: PartOptions & Pick<ConePart, 'sides' | 'inverted'> = {},
): ConePart => ({ kind: 'cone', radius, height, at, colour, ...options })

/** A flat ring on the ground (a lifting radius, a drain boom) built from short straight pieces. */
export function ring(
  radius: number, colour: ColourKey,
  options: { segments?: number; width?: number; height?: number; y?: number; centre?: [number, number] } = {},
): ShapePart[] {
  const { segments = 12, width = 0.15, height = 0.04, y = 0.02, centre = [0, 0] } = options
  const chord = 2 * radius * Math.tan(Math.PI / segments) + width * 0.4
  return Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2
    return box([chord, height, width], [centre[0] + Math.sin(a) * radius, y, centre[1] + Math.cos(a) * radius], colour, {
      rotY: (a * 180) / Math.PI,
    })
  })
}

/** A copy of `part` moved by `by`. */
export function shift<T extends ShapePart>(part: T, by: Vec3): T {
  return { ...part, at: [part.at[0] + by[0], part.at[1] + by[1], part.at[2] + by[2]] }
}

/** A closed-open stretch of a run, in metres along x from the middle of the run. */
export type Gap = [from: number, to: number]

/**
 * Repeat a run recipe's module along x to fill `length` metres (centred on the origin), leaving
 * out any module whose middle falls in a gap and closing each stretch with the recipe's `ends`.
 */
export function repeatAlong(recipe: ShapeRecipe, length: number, gaps: Gap[] = []): ShapePart[] {
  const module = recipe.run?.module ?? recipe.footprint[0]
  const count = Math.max(1, Math.round(length / module))
  const start = (-count * module) / 2 + module / 2
  const open = (x: number) => gaps.some(([from, to]) => x >= from && x < to)
  const out: ShapePart[] = []
  for (let i = 0; i < count; i++) {
    const x = start + i * module
    if (open(x)) continue
    for (const part of recipe.parts) out.push(shift(part, [x, 0, 0]))
    const last = i === count - 1 || open(x + module)
    if (last) for (const part of recipe.run?.ends ?? []) out.push(shift(part, [x, 0, 0]))
  }
  return out
}

const cosDeg = (deg: number) => Math.cos((deg * Math.PI) / 180)

/** Height of the top of a part above the item's ground level (approximate when the part leans). */
export function partTop(part: ShapePart): number {
  const upright = part.lean ? cosDeg(part.lean[0]) * cosDeg(part.lean[1]) : 1
  if (part.kind === 'box') return part.at[1] + part.size[1] * upright
  if (part.kind === 'cone') return part.at[1] + part.height * upright
  return part.at[1] + (part.axis && part.axis !== 'y' ? part.radius * 2 : part.height * upright)
}

export const partsTop = (parts: ShapePart[]): number => parts.reduce((top, p) => Math.max(top, partTop(p)), 0)

/** Triangles a part costs, counted the same way the mesh builder emits them. */
export function partTriangles(part: ShapePart): number {
  if (part.kind === 'box') return 12
  const sides = part.sides ?? 8
  return part.kind === 'cone' ? sides + (sides - 2) : sides * 2 + (sides - 2) * 2
}

export const partsTriangles = (parts: ShapePart[]): number => parts.reduce((n, p) => n + partTriangles(p), 0)
