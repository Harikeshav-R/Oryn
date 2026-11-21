import { Info } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { GATE_PROVENANCE, GATE_SUMMARY } from '@/data/gate'
import { cn } from '@/lib/utils'

/**
 * CMP-10 gate provenance: the `5/5 verified human examples` chip and the tooltip that
 * explains where the five come from (3 observed this week + 2 SME-verified archived
 * cases). The tooltip is supplemental: the same text is always a hidden description of
 * the chip, so it is available by keyboard, by screen reader and without hover.
 *
 * The chip is the anchor `gate-provenance` and stays visible while the tooltip is open.
 * When `disabled`, the chip stays focusable, the tooltip stays closed and the reason is
 * visible and described. `open` controls the tooltip for film frames.
 */
export function GateProvenance({
  disabled = false,
  disabledReason,
  open,
  onOpenChange,
}: {
  disabled?: boolean
  disabledReason?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Tooltip
        content={GATE_PROVENANCE}
        open={disabled ? false : open}
        onOpenChange={onOpenChange}
        anchor="gate-provenance-tooltip"
      >
        <button
          type="button"
          data-anchor="gate-provenance"
          aria-disabled={disabled || undefined}
          className={cn(
            'inline-flex h-8 items-center gap-2 rounded-md border bg-surface px-3 type-data text-foreground transition-colors',
            disabled ? 'cursor-not-allowed bg-surface-2 text-muted-foreground' : 'hover:bg-surface-2',
          )}
        >
          <span>{GATE_SUMMARY}</span>
          <Info aria-hidden="true" className="size-4" strokeWidth={1.75} />
        </button>
      </Tooltip>
      {disabled && disabledReason && <p className="type-micro text-muted-foreground">{disabledReason}</p>}
    </div>
  )
}
