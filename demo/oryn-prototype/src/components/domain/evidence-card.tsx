import { FileText, LockKeyhole } from 'lucide-react'
import { cn } from '@/lib/utils'
import { INCIDENT } from '@/data/incident'
import { PLAYBOOK_RULES } from '@/data/playbook'

export type EvidenceSource = 'rule009' | 'rule017' | 'invoice' | 'purchaseOrder' | 'handling'
export type EvidenceCardState = 'available' | 'selected' | 'unverified' | 'restricted' | 'unavailable' | 'none'

export interface EvidenceCardProps {
  /** Identifies a source in DAT-04 or DAT-07. */
  source?: EvidenceSource
  /** Restricted and unavailable sources never expose source contents. */
  state?: EvidenceCardState
  /** Render the 24px source-chip variant. */
  compact?: boolean
  reason?: string
  /** Opens the source detail only when the source is accessible. */
  onOpenSource?: (id: string) => void
}

const SOURCES: Record<EvidenceSource, { id: string; title: string; detail: string }> = {
  rule009: { id: PLAYBOOK_RULES[0].id, title: PLAYBOOK_RULES[0].title, detail: PLAYBOOK_RULES[0].description },
  rule017: { id: PLAYBOOK_RULES[1].id, title: PLAYBOOK_RULES[1].title, detail: PLAYBOOK_RULES[1].description },
  invoice: { id: INCIDENT.evidence[0].sourceId, title: 'Invoice', detail: INCIDENT.evidence[0].description },
  purchaseOrder: { id: INCIDENT.evidence[1].sourceId, title: 'Purchase order', detail: INCIDENT.evidence[1].description },
  handling: { id: INCIDENT.evidence[2].sourceId, title: 'Handling line', detail: INCIDENT.evidence[2].description },
}

export function EvidenceCard({ source = 'rule009', state = 'available', compact = false, reason, onOpenSource }: EvidenceCardProps) {
  const item = SOURCES[source]
  const inaccessible = state === 'restricted' || state === 'unavailable'
  const absent = state === 'none'
  const canOpen = !inaccessible && !absent && Boolean(onOpenSource)
  const status = absent ? 'No source linked' : inaccessible ? reason ?? (state === 'restricted' ? 'Source restricted for this viewpoint' : 'Source unavailable') : state === 'unverified' ? 'Unverified hypothesis' : undefined

  if (compact) {
    return (
      <span data-anchor="source-chip" className="inline-flex max-w-full flex-col items-start gap-1">
        {canOpen ? <button type="button" title={`${item.id} ${item.title}`} onClick={() => onOpenSource?.(item.id)} className={cn('inline-flex h-6 max-w-full items-center gap-1 rounded border bg-surface px-2 type-data text-foreground', state === 'selected' && 'outline outline-2 outline-offset-1 outline-foreground')}><FileText aria-hidden="true" className="size-3.5 shrink-0" /><span className="truncate">{item.id}</span></button> : <span className="inline-flex h-6 max-w-full items-center gap-1 rounded border bg-surface px-2 type-data text-muted-foreground">{inaccessible ? <LockKeyhole aria-hidden="true" className="size-3.5 shrink-0" /> : <FileText aria-hidden="true" className="size-3.5 shrink-0" />}<span className="truncate">{absent ? 'No source' : item.id}</span></span>}
        {status && <span className="text-xs text-muted-foreground">{status}</span>}
      </span>
    )
  }

  return (
    <section data-anchor="evidence-card" className={cn('flex min-w-0 gap-2 rounded border bg-surface p-3 text-foreground', state === 'selected' && 'outline outline-2 outline-offset-1 outline-foreground')}>
      <div aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded border bg-surface-2 text-muted-foreground">{inaccessible ? <LockKeyhole className="size-5" /> : <FileText className="size-5" />}</div>
      <div className="min-w-0">
        {absent ? <p className="text-sm">No source linked</p> : <>
          {canOpen ? <button type="button" title={`${item.id} ${item.title}`} onClick={() => onOpenSource?.(item.id)} className="block max-w-full text-left type-data underline underline-offset-2">{item.id}</button> : <p className="type-data">{item.id}</p>}
          {!inaccessible && <><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-sm">{item.detail}</p></>}
        </>}
        {status && !absent && <p className="mt-1 text-xs text-muted-foreground">{status}</p>}
        {!canOpen && !inaccessible && !absent && <p className="mt-1 text-xs text-muted-foreground">Source detail unavailable</p>}
      </div>
    </section>
  )
}
