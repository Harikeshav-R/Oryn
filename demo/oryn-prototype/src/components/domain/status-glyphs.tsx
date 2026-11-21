import { Hatch } from '@/components/ui/hatch'
import { OrbitNode } from '@/components/domain/orbit'
import type { StatusId } from '@/data/status'
import { cn } from '@/lib/utils'

/**
 * CMP-06 glyphs: 12px, 1.75 stroke, one distinct silhouette per status so the glyph
 * identifies the status without colour. Hue is applied by the caller via `currentColor`.
 * Unknown and Held use the neutral Hatch as the glyph square only; hatch never sits
 * behind text because the label is a separate element.
 */
const svgProps = {
  width: 12,
  height: 12,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'shrink-0',
} as const

export function StatusGlyph({
  status,
  className,
  frame = 0,
  running = true,
}: {
  status: StatusId
  className?: string
  frame?: number
  running?: boolean
}) {
  switch (status) {
    case 'approved':
      return (
        <svg {...svgProps} data-glyph={status} className={cn('shrink-0', className)}>
          <path d="M8 1.75 2.5 3.75v4c0 3.1 2.2 5.4 5.5 6.75 3.3-1.35 5.5-3.65 5.5-6.75v-4L8 1.75Z" />
          <path d="m5.5 8 1.8 1.8L10.8 6.3" />
        </svg>
      )
    case 'verified':
      return (
        <svg {...svgProps} data-glyph={status} className={cn('shrink-0', className)}>
          <circle cx={8} cy={8} r={6.25} />
          <path d="m5.25 8.1 1.9 1.9 3.6-3.9" />
        </svg>
      )
    case 'unknown':
      return <Hatch className={cn('size-3 border border-foreground', className)} />
    case 'passed':
      return (
        <svg {...svgProps} data-glyph={status} className={cn('shrink-0', className)}>
          <path d="m2.75 8.5 3.5 3.5 7-8" />
        </svg>
      )
    case 'safeEscalation':
      return (
        <svg {...svgProps} data-glyph={status} className={cn('shrink-0', className)}>
          <circle cx={8} cy={8} r={6.25} />
          <path d="M5.5 5.25v3a1.5 1.5 0 0 0 1.5 1.5h3.25" />
          <path d="m8.9 7.9 1.5 1.85-1.5 1.8" />
        </svg>
      )
    case 'failed':
      return (
        <svg {...svgProps} data-glyph={status} className={cn('shrink-0', className)}>
          <path d="M8 1.25 14.75 8 8 14.75 1.25 8 8 1.25Z" />
          <path d="m6 6 4 4m0-4-4 4" />
        </svg>
      )
    case 'revalidation':
      return (
        <svg {...svgProps} data-glyph={status} className={cn('shrink-0', className)}>
          <path d="M8 2 14.75 13.75H1.25L8 2Z" />
          <path d="M8 6.5v3.25" />
          <path d="M8 11.75h.01" />
        </svg>
      )
    case 'contained':
      return (
        <svg {...svgProps} data-glyph={status} className={cn('shrink-0', className)}>
          <rect x={2} y={2} width={12} height={12} rx={1.5} />
          <rect x={5.5} y={5.5} width={5} height={5} fill="currentColor" stroke="none" />
        </svg>
      )
    case 'approval':
      return (
        <svg {...svgProps} data-glyph={status} className={cn('shrink-0', className)}>
          <path d="M8 1.25 14.75 8 8 14.75 1.25 8 8 1.25Z" />
          <circle cx={8} cy={6.4} r={1.35} />
          <path d="M5.6 10.6c.35-1.3 1.2-2 2.4-2s2.05.7 2.4 2" />
        </svg>
      )
    case 'escalated':
      return (
        <svg {...svgProps} data-glyph={status} className={cn('shrink-0', className)}>
          <path d="M1.5 8H6m-1.6-2.2L6.3 8l-1.9 2.2" />
          <circle cx={11.75} cy={5.25} r={1.9} />
          <path d="M8.75 13.25c.3-2 1.5-3.1 3-3.1s2.7 1.1 3 3.1" />
        </svg>
      )
    case 'held':
      return (
        <span className={cn('relative inline-block size-3 shrink-0', className)} data-glyph={status}>
          <Hatch className="absolute inset-0 size-3 border border-foreground" />
          {/* Bars carry a surface halo so they stay legible over the hatch strokes. */}
          <svg {...svgProps} className="absolute inset-0" stroke="var(--surface)" strokeWidth={1.5} strokeLinejoin="miter">
            <rect x={4.5} y={4} width={2.5} height={8} fill="var(--foreground)" paintOrder="stroke" />
            <rect x={9} y={4} width={2.5} height={8} fill="var(--foreground)" paintOrder="stroke" />
          </svg>
        </span>
      )
    case 'running':
      return <OrbitNode frame={frame} running={running} size={12} decorative />
  }
}
