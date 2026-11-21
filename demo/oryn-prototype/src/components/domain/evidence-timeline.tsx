import { useState } from 'react'
import { AUDIT_EVENTS } from '@/data/audit'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { PEOPLE, supplierName } from '@/data/people'
import { cn } from '@/lib/utils'

export interface TimelineEvent {
  id: string
  /** Required for audit events to establish their snapshot boundary. */
  order?: number
  actor: string | null
  action: string
  object: string | null
  /** Only supplied source times are displayed. */
  time?: string
  source?: { id: string; accessible: boolean; reason?: string }
}

const DEMONSTRATION_EVENTS: readonly TimelineEvent[] = DEMONSTRATIONS.map((example) => ({
  id: example.id,
  actor: PEOPLE.find((person) => person.id === example.contributorId)?.name ?? null,
  time: example.time,
  action: 'Observation',
  object: `${example.invoice} · ${supplierName(example.supplierId)}`,
  source: { id: example.id, accessible: false },
}))

export interface EvidenceTimelineProps {
  /** Audit is the default; demonstrations retain their three recorded times. */
  variant?: 'audit' | 'demonstrations'
  /** Override the fixture when the caller has authorized evidence references. */
  events?: readonly TimelineEvent[]
  /** Limit the audit to events already reached in the current snapshot. */
  throughOrder?: number
  /** Controlled selection for deterministic film frames. */
  selectedId?: string | null
  onSelect?: (id: string) => void
  /** Demonstration sources must open only permitted, sanitized evidence derivatives. */
  onOpenSource?: (id: string) => void
}

export function EvidenceTimeline({ variant = 'audit', events, throughOrder = 0, selectedId, onSelect, onOpenSource }: EvidenceTimelineProps) {
  const [localSelection, setLocalSelection] = useState<string | null>(null)
  const selected = selectedId === undefined ? localSelection : selectedId
  const rows: readonly TimelineEvent[] = variant === 'audit'
    ? (events ?? AUDIT_EVENTS).filter((event) => event.order !== undefined && event.order <= throughOrder)
    : events ?? DEMONSTRATION_EVENTS

  return (
    <ol data-anchor="evidence-timeline" aria-label={variant === 'audit' ? 'Audit history' : 'Demonstrations'} className="space-y-4">
      {rows.map((event) => (
        <li key={event.id} className="relative flex gap-3 before:absolute before:bottom-[-16px] before:left-[3px] before:top-2 before:w-0.5 before:bg-border last:before:hidden">
          <span aria-hidden="true" className={cn('relative mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground', selected === event.id && 'outline outline-2 outline-offset-2 outline-foreground')} />
          <div className="min-w-0 flex-1">
            <button type="button" aria-pressed={selected === event.id} onClick={() => { setLocalSelection(event.id); onSelect?.(event.id) }} className="block w-full rounded-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
              <span className="block type-data text-muted-foreground">{event.id}{event.time ? ` · ${event.time}` : ''}{event.actor ? ` · ${event.actor}` : ''}</span>
              <span className="block text-sm text-foreground">{event.action}{event.object ? ` · ${event.object}` : ''}</span>
            </button>
            {event.source ? event.source.accessible && onOpenSource ? (
              <button type="button" className="mt-1 text-xs text-foreground underline underline-offset-2" onClick={() => onOpenSource(event.source!.id)}>Open evidence · {event.source.id}</button>
            ) : <p className="mt-1 text-xs text-muted-foreground">{event.source.accessible ? 'Evidence detail unavailable' : event.source.reason ?? 'Evidence restricted for this viewpoint'}</p> : <p className="mt-1 text-xs text-muted-foreground">No evidence linked</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
