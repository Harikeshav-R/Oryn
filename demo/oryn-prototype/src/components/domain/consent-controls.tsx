import { useId, type ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  CAPTURE_BLOCK_TEXT,
  CONSENT_COPY,
  captureBlock,
  captureCategories,
  type ConsentState,
} from '@/data/consent'

/**
 * CMP-13 consent controls. Five independent values: the notice, two capture categories,
 * organizational contribution and pause. No value implies another, and nothing is
 * pre-selected. `Excluded windows` is a mandatory exclusion: it is locked on, stays in the
 * tab order and says why. Every control has a visible label that spans its 32px row, and
 * pause is one action.
 *
 * Anchors: `capture-choice` (what may be observed) and `sharing-choice` (what may be shared)
 * are separate groups on purpose: contribution is not capture and capture is not sharing.
 */
function Group({ anchor, title, children }: { anchor?: string; title: string; children: ReactNode }) {
  const titleId = useId()
  return (
    <div role="group" aria-labelledby={titleId} data-anchor={anchor} className="rounded-lg border px-4 py-3">
      <p id={titleId} className="mb-1 type-card">
        {title}
      </p>
      {children}
    </div>
  )
}

function CheckRow({
  label,
  checked,
  onCheckedChange,
  locked = false,
  reason,
}: {
  label: string
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  locked?: boolean
  reason?: string
}) {
  const id = useId()
  const reasonId = `${id}-reason`
  return (
    <div className="flex min-h-8 items-center gap-3">
      <label htmlFor={id} className="flex min-h-8 flex-1 cursor-pointer items-center gap-3 type-data data-[locked=true]:cursor-not-allowed" data-locked={locked}>
        <Checkbox
          id={id}
          checked={checked}
          locked={locked}
          aria-describedby={locked && reason ? reasonId : undefined}
          onCheckedChange={(value) => onCheckedChange?.(value === true)}
        />
        <span>{label}</span>
      </label>
      {locked && reason && (
        <span id={reasonId} className="type-micro text-muted-foreground">
          {reason}
        </span>
      )}
    </div>
  )
}

function SwitchRow({
  label,
  checked,
  onCheckedChange,
  stateText,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  stateText?: string
}) {
  const id = useId()
  return (
    <div className="flex min-h-8 items-center gap-3">
      <label htmlFor={id} className="flex min-h-8 flex-1 cursor-pointer items-center type-data">
        {label}
      </label>
      {stateText && <span className="type-micro text-muted-foreground">{stateText}</span>}
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function ConsentControls({
  state,
  onChange,
}: {
  state: ConsentState
  onChange: (next: ConsentState) => void
}) {
  const set = (patch: Partial<ConsentState>) => onChange({ ...state, ...patch })
  const block = captureBlock(state)
  const categories = captureCategories(state)

  return (
    <div className="space-y-3">
      <Group title="Organization notice">
        <CheckRow
          label={CONSENT_COPY.notice}
          checked={state.noticeAccepted}
          onCheckedChange={(noticeAccepted) => set({ noticeAccepted })}
        />
      </Group>

      <Group anchor="capture-choice" title="Permitted work observation">
        <CheckRow
          label={CONSENT_COPY.workApplications}
          checked={state.workApplications}
          onCheckedChange={(workApplications) => set({ workApplications })}
        />
        <CheckRow label={CONSENT_COPY.excludedWindows} checked locked reason={CONSENT_COPY.mandatoryReason} />
        <CheckRow
          label={CONSENT_COPY.visualObservation}
          checked={state.visualObservation}
          onCheckedChange={(visualObservation) => set({ visualObservation })}
        />
      </Group>

      <Group anchor="sharing-choice" title="Sharing">
        <SwitchRow
          label={CONSENT_COPY.contribution}
          checked={state.contribution}
          onCheckedChange={(contribution) => set({ contribution })}
          stateText={state.contribution ? 'Shared after review' : 'Not shared'}
        />
      </Group>

      <Group title="Observation">
        <SwitchRow
          label={CONSENT_COPY.pause}
          checked={state.paused}
          onCheckedChange={(paused) => set({ paused })}
          stateText={state.paused ? 'Observation paused' : 'Observation permitted'}
        />
      </Group>

      <p role="status" data-capture-status={block ?? 'allowed'} className="type-data">
        {block ? CAPTURE_BLOCK_TEXT[block] : `Capture may start: ${categories.join(', ')}.`}
      </p>
    </div>
  )
}
