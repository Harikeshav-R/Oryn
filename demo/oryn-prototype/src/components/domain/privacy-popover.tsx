import { ArrowRight, Eye, EyeOff, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CONSENT_COPY, PRIVACY_LABEL } from '@/data/consent'

/**
 * CMP-10 privacy popover (anchor `privacy-popover`). Pausing is one action. The popover
 * states only whether observation is permitted or paused; it never shows what was or would
 * be captured, so excluded private content cannot appear here.
 *
 * Escape closes it and focus returns to the trigger (Radix). The trigger stays visible
 * and active under an open popover. When `disabled` the trigger keeps its tab stop and
 * names why, instead of silently doing nothing.
 */
export function PrivacyPopover({
  paused,
  onPausedChange,
  onOpenMyPrivacy,
  disabled = false,
  disabledReason,
  open,
  onOpenChange,
}: {
  paused: boolean
  onPausedChange: (paused: boolean) => void
  onOpenMyPrivacy?: () => void
  disabled?: boolean
  disabledReason?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const StateIcon = paused ? EyeOff : Eye
  const state = paused ? 'Observation paused' : 'Observation permitted'

  if (disabled) {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <Button variant="outline" size="sm" icon={<StateIcon />} disabled disabledReason={disabledReason}>
          {state}
        </Button>
        {disabledReason && <p className="type-micro text-muted-foreground">{disabledReason}</p>}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" icon={<StateIcon />} data-anchor="privacy-trigger">
          {state}
        </Button>
      </PopoverTrigger>
      <PopoverContent anchor="privacy-popover" aria-label={PRIVACY_LABEL}>
        <div className="space-y-3">
          <p className="type-data" role="status">
            {paused ? 'Observation is paused. Nothing new is captured.' : 'Observation is permitted for the work you approved.'}
          </p>
          <Button
            variant="secondary"
            icon={paused ? <Play /> : <Pause />}
            className="w-full"
            onClick={() => onPausedChange(!paused)}
          >
            {paused ? 'Resume observation' : CONSENT_COPY.pause}
          </Button>
          <Button variant="link" trailingIcon={<ArrowRight />} onClick={onOpenMyPrivacy}>
            {PRIVACY_LABEL}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
