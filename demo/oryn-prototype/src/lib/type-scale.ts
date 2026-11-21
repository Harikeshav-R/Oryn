/**
 * CMP-02 product type scale (design spec section 3.2). Single source for the
 * Tailwind `type-*` classes and the runtime minimum-size audit.
 * Sizes and line heights are authored px at 1280x720.
 */

export type TypeFamily = 'sans' | 'mono' | 'serif'
export type TypeRole = 'title' | 'section' | 'card' | 'body' | 'prose' | 'data' | 'micro'

export interface TypeSpec {
  family: TypeFamily
  size: number
  line: number
  tracking: string
  weight: 400 | 500 | 600 | 700
}

export const TYPE_SCALE = {
  title: { family: 'sans', size: 28, line: 34, tracking: '-0.025em', weight: 700 },
  section: { family: 'sans', size: 20, line: 28, tracking: '-0.025em', weight: 700 },
  card: { family: 'sans', size: 16, line: 22, tracking: '-0.01em', weight: 500 },
  body: { family: 'sans', size: 14, line: 20, tracking: '0em', weight: 400 },
  prose: { family: 'serif', size: 16, line: 24, tracking: '0em', weight: 400 },
  data: { family: 'mono', size: 12, line: 18, tracking: '0em', weight: 500 },
  micro: { family: 'mono', size: 11, line: 16, tracking: '0.04em', weight: 500 },
} as const satisfies Record<TypeRole, TypeSpec>

/** No UI text may render below this size (authored px). */
export const MIN_UI_FONT_PX = 11
