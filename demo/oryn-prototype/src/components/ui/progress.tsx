import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

/**
 * CMP-14 progress: 8px high, 4px radius, neutral track. The fill is arc cyan only while
 * `executing` is true; complete and cancelled fills are neutral. `value` is a fraction of
 * `max`; `null` means the count is unknown and shows the static hatch instead of a number.
 * The value comes from the caller, sampled from explicit events: no timer lives here.
 * A full bar says the run finished, never that anything was verified.
 */
export function Progress({
  value,
  max = 100,
  label,
  valueText,
  executing = false,
  className,
}: {
  value: number | null
  max?: number
  /** Accessible name. */
  label: string
  /** Human-readable value, e.g. `11 of 28 scenarios run`. */
  valueText?: string
  /** True only while a run executes. */
  executing?: boolean
  className?: string
}) {
  const unknown = value === null
  const percent = unknown ? 100 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <ProgressPrimitive.Root
      value={value}
      max={max}
      aria-label={label}
      aria-valuetext={valueText}
      data-executing={executing ? 'true' : 'false'}
      className={cn('relative h-2 w-full overflow-hidden rounded-sm bg-surface-2', className)}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full', unknown ? 'hatch hatch-neutral' : executing ? 'bg-arc' : 'bg-foreground')}
        style={{ width: `${percent}%` }}
      />
    </ProgressPrimitive.Root>
  )
}
