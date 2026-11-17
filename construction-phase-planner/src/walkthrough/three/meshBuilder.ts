// Turns shape parts into flat-shaded, vertex-coloured triangles. Pure maths: the scene wraps the
// finished arrays in a three.js BufferGeometry, so everything static costs a single draw call.
import type { Vec3 } from '../types'
import { colourHex, type ColourKey, type ShapePart } from './recipe'

export type Rgb = [number, number, number]

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))

/** "#RRGGBB" to linear RGB, which is what three.js expects in a colour attribute. */
export function hexToLinear(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [srgbToLinear(((n >> 16) & 255) / 255), srgbToLinear(((n >> 8) & 255) / 255), srgbToLinear((n & 255) / 255)]
}

const colourCache = new Map<ColourKey, Rgb>()
export function keyToLinear(key: ColourKey): Rgb {
  let rgb = colourCache.get(key)
  if (!rgb) {
    rgb = hexToLinear(colourHex(key))
    colourCache.set(key, rgb)
  }
  return rgb
}

/** Rotation (row-major 3 x 3), then uniform scale, then translation. */
export interface Xform { m: number[]; s: number; t: Vec3 }

const rad = (deg: number) => (deg * Math.PI) / 180
const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1]

const mul = (a: number[], b: number[]): number[] => {
  const out = new Array<number>(9)
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]
  return out
}
const rotate = (m: number[], v: Vec3): Vec3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
]

/** Anticlockwise about the vertical seen from above: local +x swings towards -z. */
export const rotYMatrix = (deg: number): number[] => {
  const c = Math.cos(rad(deg))
  const s = Math.sin(rad(deg))
  return [c, 0, s, 0, 1, 0, -s, 0, c]
}
/** Tip +y towards +x by `towardX` degrees and towards +z by `towardZ` degrees. */
const leanMatrix = (towardX: number, towardZ: number): number[] => {
  const ca = Math.cos(rad(towardX))
  const sa = Math.sin(rad(towardX))
  const cb = Math.cos(rad(towardZ))
  const sb = Math.sin(rad(towardZ))
  const aboutZ = [ca, sa, 0, -sa, ca, 0, 0, 0, 1]
  const aboutX = [1, 0, 0, 0, cb, -sb, 0, sb, cb]
  return mul(aboutX, aboutZ)
}

export const xform = (position: Vec3 = [0, 0, 0], yawDeg = 0, scale = 1): Xform =>
  ({ m: yawDeg ? rotYMatrix(yawDeg) : IDENTITY, s: scale, t: position })

export const apply = (x: Xform, v: Vec3): Vec3 => {
  const r = rotate(x.m, v)
  return [r[0] * x.s + x.t[0], r[1] * x.s + x.t[1], r[2] * x.s + x.t[2]]
}

/** `outer` applied after `inner`. */
export const compose = (outer: Xform, inner: Xform): Xform =>
  ({ m: mul(outer.m, inner.m), s: outer.s * inner.s, t: apply(outer, inner.t) })

export class MeshBuilder {
  readonly positions: number[] = []
  readonly normals: number[] = []
  readonly colours: number[] = []

  get triangles(): number { return this.positions.length / 9 }

  /** One flat triangle; corners anticlockwise seen from outside. */
  tri(a: Vec3, b: Vec3, c: Vec3, rgb: Rgb): void {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
    let nx = uy * vz - uz * vy
    let ny = uz * vx - ux * vz
    let nz = ux * vy - uy * vx
    const len = Math.hypot(nx, ny, nz)
    if (len < 1e-12) return
    nx /= len; ny /= len; nz /= len
    this.positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2])
    for (let i = 0; i < 3; i++) {
      this.normals.push(nx, ny, nz)
      this.colours.push(rgb[0], rgb[1], rgb[2])
    }
  }

  quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, rgb: Rgb): void {
    this.tri(a, b, c, rgb)
    this.tri(a, c, d, rgb)
  }

  /** A flat polygon as a fan; corners anticlockwise seen from outside. */
  fan(points: Vec3[], rgb: Rgb): void {
    for (let i = 1; i < points.length - 1; i++) this.tri(points[0], points[i], points[i + 1], rgb)
  }
}

function emitBox(b: MeshBuilder, size: Vec3, x: Xform, rgb: Rgb, skipUnderside: boolean): void {
  const hw = size[0] / 2
  const hd = size[2] / 2
  const h = size[1]
  const p = (sx: number, y: number, sz: number) => apply(x, [sx * hw, y, sz * hd])
  const lbn = p(-1, 0, -1), rbn = p(1, 0, -1), rbs = p(1, 0, 1), lbs = p(-1, 0, 1)
  const ltn = p(-1, h, -1), rtn = p(1, h, -1), rts = p(1, h, 1), lts = p(-1, h, 1)
  b.quad(lts, rts, rtn, ltn, rgb) // top
  b.quad(lbs, rbs, rts, lts, rgb) // +z
  b.quad(rbn, lbn, ltn, rtn, rgb) // -z
  b.quad(rbs, rbn, rtn, rts, rgb) // +x
  b.quad(lbn, lbs, lts, ltn, rgb) // -x
  if (!skipUnderside) b.quad(lbn, rbn, rbs, lbs, rgb)
}

function ringPoints(radius: number, y: number, sides: number, x: Xform): Vec3[] {
  return Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2
    return apply(x, [Math.sin(a) * radius, y, Math.cos(a) * radius])
  })
}

function emitCylinder(b: MeshBuilder, radius: number, height: number, sides: number, x: Xform, rgb: Rgb, skipUnderside: boolean): void {
  const lower = ringPoints(radius, 0, sides, x)
  const upper = ringPoints(radius, height, sides, x)
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides
    b.quad(lower[i], lower[j], upper[j], upper[i], rgb)
  }
  b.fan(upper, rgb)
  if (!skipUnderside) b.fan([...lower].reverse(), rgb)
}

function emitCone(b: MeshBuilder, radius: number, height: number, sides: number, inverted: boolean, x: Xform, rgb: Rgb, skipUnderside: boolean): void {
  const base = ringPoints(radius, inverted ? height : 0, sides, x)
  const tip = apply(x, [0, inverted ? 0 : height, 0])
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides
    if (inverted) b.tri(base[j], base[i], tip, rgb)
    else b.tri(base[i], base[j], tip, rgb)
  }
  if (inverted) b.fan(base, rgb)
  else if (!skipUnderside) b.fan([...base].reverse(), rgb)
}

// A cylinder is generated standing on the origin; these lay it along x or z, resting on the origin.
const AXIS_X = [0, 1, 0, -1, 0, 0, 0, 0, 1]
const AXIS_Z = [1, 0, 0, 0, 0, -1, 0, 1, 0]

/** Local frame of one part: lay down, lean, turn, then move to `at`. */
function partXform(part: ShapePart): Xform {
  let m = IDENTITY
  let offset: Vec3 = [0, 0, 0]
  if (part.kind === 'cylinder' && part.axis && part.axis !== 'y') {
    m = part.axis === 'x' ? AXIS_X : AXIS_Z
    offset = part.axis === 'x' ? [-part.height / 2, part.radius, 0] : [0, part.radius, -part.height / 2]
  }
  let outer = IDENTITY
  if (part.lean) outer = leanMatrix(part.lean[0], part.lean[1])
  if (part.rotY) outer = mul(rotYMatrix(part.rotY), outer)
  return { m: mul(outer, m), s: 1, t: (() => { const o = rotate(outer, offset); return [o[0] + part.at[0], o[1] + part.at[1], o[2] + part.at[2]] as Vec3 })() }
}

/** Emit one part of an item standing at `item`. `tint` replaces the recipe colour (model-answer ghosts). */
export function emitPart(b: MeshBuilder, part: ShapePart, item: Xform, tint?: Rgb): void {
  const x = compose(item, partXform(part))
  const rgb = tint ?? keyToLinear(part.colour)
  const grounded = part.at[1] <= 0.06 && !part.lean
  if (part.kind === 'box') emitBox(b, part.size, x, rgb, grounded)
  else if (part.kind === 'cylinder') emitCylinder(b, part.radius, part.height, part.sides ?? 8, x, rgb, grounded && (!part.axis || part.axis === 'y'))
  else emitCone(b, part.radius, part.height, part.sides ?? 8, !!part.inverted, x, rgb, grounded)
}

export function emitParts(b: MeshBuilder, parts: ShapePart[], item: Xform, tint?: Rgb): void {
  for (const part of parts) emitPart(b, part, item, tint)
}

/** A low-polygon ball for status markers. */
export function emitSphere(b: MeshBuilder, centre: Vec3, radius: number, rgb: Rgb, around = 10, bands = 6): void {
  const at = (i: number, j: number): Vec3 => {
    const lat = (j / bands) * Math.PI
    const lon = (i / around) * Math.PI * 2
    return [centre[0] + radius * Math.sin(lat) * Math.sin(lon), centre[1] + radius * Math.cos(lat), centre[2] + radius * Math.sin(lat) * Math.cos(lon)]
  }
  for (let j = 0; j < bands; j++) {
    for (let i = 0; i < around; i++) {
      const a = at(i, j), bb = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1)
      if (j > 0) b.tri(a, c, bb, rgb)
      if (j < bands - 1) b.tri(a, d, c, rgb)
    }
  }
}

/** A diamond for "acceptable" markers. */
export function emitOctahedron(b: MeshBuilder, centre: Vec3, radius: number, rgb: Rgb): void {
  const [cx, cy, cz] = centre
  const top: Vec3 = [cx, cy + radius * 1.25, cz]
  const bottom: Vec3 = [cx, cy - radius * 1.25, cz]
  const waist: Vec3[] = [[cx + radius, cy, cz], [cx, cy, cz - radius], [cx - radius, cy, cz], [cx, cy, cz + radius]]
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    b.tri(waist[i], waist[j], top, rgb)
    b.tri(waist[j], waist[i], bottom, rgb)
  }
}
