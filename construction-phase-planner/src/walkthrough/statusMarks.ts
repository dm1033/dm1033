// How a status looks in every view. Status is never carried by colour alone: each one has its
// own glyph, its own words, its own 3D marker shape and its own plan fill pattern.
import type { ItemStatus, Tone, WalkRow } from './types'

export interface MarkStyle {
  /** Single character shown before the words. */
  glyph: string
  /** Words shown with the glyph, in every view. */
  text: string
  /** Fill colour of the tag or marker. Passes 4.5:1 as text on the dark slate background. */
  colour: string
  /** Colour for text or a glyph drawn on top of `colour` (at least 4.5:1). */
  onColour: string
}

export interface StatusMark extends MarkStyle {
  /** 3D marker above the item. */
  marker: 'sphere' | 'octahedron' | 'cone' | 'wireframe' | 'none'
  /** Plan view fill, which survives greyscale printing. */
  planFill: 'solid' | 'dotted' | 'hatched' | 'dashed-outline' | 'none'
}

const INK = '#0B1220'

export const STATUS_MARK: Record<ItemStatus, StatusMark> = {
  good: { glyph: '✓', text: 'Well placed', marker: 'sphere', planFill: 'solid', colour: '#009E73', onColour: INK },
  neutral: { glyph: '~', text: 'Acceptable', marker: 'octahedron', planFill: 'dotted', colour: '#E69F00', onColour: INK },
  unsafe: { glyph: '✗', text: 'UNSAFE HERE', marker: 'cone', planFill: 'hatched', colour: '#D55E00', onColour: INK },
  missing: { glyph: '?', text: 'NOT PROVIDED', marker: 'wireframe', planFill: 'dashed-outline', colour: '#D55E00', onColour: INK },
  unused: { glyph: '○', text: 'Not used', marker: 'none', planFill: 'none', colour: '#9AA4AE', onColour: INK },
}

/** Tone of an overlay (temporary works tag, permit card, incident, open risk, HSE notice). */
export const TONE_MARK: Record<Tone, MarkStyle> = {
  good: { glyph: '✓', text: 'In order', colour: '#009E73', onColour: INK },
  warn: { glyph: '!', text: 'Needs attention', colour: '#E69F00', onColour: INK },
  bad: { glyph: '✗', text: 'Stop', colour: '#D55E00', onColour: INK },
  info: { glyph: 'i', text: 'For information', colour: '#56B4E9', onColour: INK },
}

/** The mark for a table row: item rows use STATUS_MARK, every other kind uses TONE_MARK. */
export function rowMark(row: Pick<WalkRow, 'kind' | 'status'>): MarkStyle {
  return row.kind === 'item' ? STATUS_MARK[row.status as ItemStatus] : TONE_MARK[row.status as Tone]
}

/** "✓ Well placed": the glyph and words for a row, as shown in the Status column. */
export function rowStatusLabel(row: Pick<WalkRow, 'kind' | 'status' | 'statusText'>): string {
  return `${rowMark(row).glyph} ${row.statusText}`
}

// ---------- Contrast (WCAG 2.x relative luminance) ----------

function channel(v: number): number {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
