import { StatusGlyph } from '@/components/domain/status-glyphs'
import { STATUS_META, STOPPED_LABEL, type GlyphTone, type StatusId } from '@/data/status'
import { cn } from '@/lib/utils'

const TONE_CLASS: Record<GlyphTone, string> = {
  neutral: 'text-signal',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  arc: 'text-trace',
}

/**
 * CMP-06 status badge: 24px, 12px glyph, 4px gap, exact label. The label is always
 * foreground text; hue is on the glyph only, and the glyph silhouette differs per status.
 * Noninteractive: if a button wraps it, the button owns semantics and focus.
 *
 * `running` is the only animated status. Its node angle derives from `frame`, and the
 * node is arc only while `running` is true. When stopped the badge turns neutral and
 * reads "Stopped": cyan never survives the end of execution.
 */
export function StatusBadge({
  status,
  running = true,
  frame = 0,
  className,
}: {
  status: StatusId
  /** Only meaningful for status "running". */
  running?: boolean
  frame?: number
  className?: string
}) {
  const meta = STATUS_META[status]
  const stopped = status === 'running' && !running
  const label = stopped ? STOPPED_LABEL : meta.label
  const tone: GlyphTone = stopped ? 'neutral' : meta.tone
  return (
    <span
      data-anchor="status-badge"
      data-status={status}
      data-running={status === 'running' ? (running ? 'true' : 'false') : undefined}
      className={cn(
        'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-sm border bg-surface px-2 type-data text-foreground',
        className,
      )}
    >
      <span className={TONE_CLASS[tone]}>
        <StatusGlyph status={status} frame={frame} running={running} />
      </span>
      <span>{label}</span>
    </span>
  )
}
