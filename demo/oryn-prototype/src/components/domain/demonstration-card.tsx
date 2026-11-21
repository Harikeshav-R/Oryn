import { FileText, LockKeyhole } from 'lucide-react'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { PEOPLE, supplierName } from '@/data/people'
import { cn } from '@/lib/utils'

export type DemonstrationId = 'D1' | 'D2' | 'D3'

export interface DemonstrationCardProps {
  id: DemonstrationId
  reviewed?: boolean
  selected?: boolean
  accessible?: boolean
  /** This callback may only open a permitted, sanitized evidence derivative. */
  onOpenEvidence?: (id: DemonstrationId) => void
  /** Only the contribution owner may review their own contribution. */
  isContributionOwner?: boolean
  onReviewContribution?: (id: DemonstrationId) => void
  className?: string
}

export function DemonstrationCard({ id, reviewed = false, selected = false, accessible = true, onOpenEvidence, isContributionOwner = false, onReviewContribution, className }: DemonstrationCardProps) {
  const item = DEMONSTRATIONS.find((example) => example.id === id)
  if (!item) throw new Error(`Unknown demonstration fixture ${id}`)
  const contributor = PEOPLE.find((person) => person.id === item.contributorId)
  if (!contributor) throw new Error(`Unknown contributor fixture ${item.contributorId}`)
  const canOpen = accessible && Boolean(onOpenEvidence)
  const content = (
    <>
      <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded border bg-surface-2 text-muted-foreground">
        {accessible ? <FileText className="size-5" /> : <LockKeyhole className="size-5" />}
      </span>
      <span className="min-w-0">
        <span className="block type-data">{id} · {contributor.name}</span>
        <span className="block type-data text-muted-foreground">{item.time}</span>
        <span className="block type-data">{item.invoice}</span>
        <span className="block text-sm">{supplierName(item.supplierId)}</span>
        <span className="block text-xs text-muted-foreground">{!accessible ? 'Source inaccessible' : reviewed ? 'Contribution reviewed' : 'Observed'}</span>
      </span>
    </>
  )
  const classes = cn('w-full max-w-[292px] rounded-lg border bg-surface p-3 text-left text-foreground', selected && 'outline outline-2 outline-offset-1 outline-foreground', className)
  const contentClasses = 'flex min-h-[94px] w-full items-center gap-3 text-left'

  return (
    <div data-anchor="demonstration-card" className={classes}>
      {canOpen ? <button type="button" aria-pressed={selected} onClick={() => onOpenEvidence?.(id)} className={contentClasses}>{content}</button> : <div className={contentClasses}>{content}</div>}
      {isContributionOwner && onReviewContribution && !reviewed && (
        <button type="button" onClick={() => onReviewContribution(id)} className="mt-1 type-data underline underline-offset-2">Approve contribution</button>
      )}
    </div>
  )
}
