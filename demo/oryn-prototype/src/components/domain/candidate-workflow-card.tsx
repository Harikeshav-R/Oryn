import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CandidateWorkflowCardProps {
  selected?: boolean
  contributionReviewed?: boolean
  ownerApproved?: boolean
  published?: boolean
  onOpenDetail?: () => void
  /** Publishing requires both contributor review and owner approval. */
  onPublish?: () => void
  film?: boolean
  className?: string
}

export function CandidateWorkflowCard({
  selected = false,
  contributionReviewed = false,
  ownerApproved = false,
  published = false,
  onOpenDetail,
  onPublish,
  film = false,
  className,
}: CandidateWorkflowCardProps) {
  const canPublish = contributionReviewed && ownerApproved
  const isPublished = published && canPublish
  const status = isPublished ? 'Published' : ownerApproved ? 'Owner approved' : contributionReviewed ? 'Contribution reviewed' : 'Needs Review'

  return (
    <section data-anchor="candidate-card" className={cn('w-full max-w-[992px] rounded-lg border bg-surface p-4 text-foreground', !film && 'transition-colors duration-150 motion-reduce:transition-none', selected && 'outline outline-2 outline-offset-1 outline-foreground', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 type-data">
            <span className="rounded-sm border px-2 py-0.5">Suggested</span>
            <span>{status}</span>
            <span>Confidence: Medium</span>
          </div>
          {onOpenDetail ? (
            <button type="button" onClick={onOpenDetail} aria-pressed={selected} className="mt-2 block text-left text-sm font-medium underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Match supplier invoice to purchase order and stage result in ERP</button>
          ) : <p className="mt-2 text-sm font-medium">Match supplier invoice to purchase order and stage result in ERP</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1"><p className="type-data text-muted-foreground">3 demonstrations</p><p className="flex items-center gap-2 text-xs"><AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-warning" />Variance exception rule: unverified until SME review</p></div>
        </div>
        {onPublish && !isPublished && (
          <div className="text-right">
            <button type="button" disabled={!canPublish} onClick={() => { if (canPublish) onPublish() }} className="rounded-md border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:text-muted-foreground">Publish</button>
            {!canPublish && <p className="mt-1 text-xs text-muted-foreground">Contribution review and owner approval required</p>}
          </div>
        )}
      </div>
    </section>
  )
}
