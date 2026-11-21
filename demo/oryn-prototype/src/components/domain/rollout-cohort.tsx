import { Check, Circle, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CohortPhase = 'awaiting-owner' | 'limited-release' | 'expanded' | 'closed'
export type CohortWatchOutcome = 'pending' | 'verified' | 'unknown' | 'regression'
export interface CohortWatch {
  outcome: CohortWatchOutcome
  /** Evidence must identify an independent readback, not just an execution. */
  evidenceId?: string
}
export interface RolloutCohortProps {
  phase?: CohortPhase
  watches?: readonly CohortWatch[]
  ownerAuthorized?: boolean
  regressionPassed?: boolean
  scopeValidated?: boolean
  onAuthorizeLimitedRelease?: () => void
  onExpand?: () => void
  onCloseIncident?: () => void
  onOpenEvidence?: (evidenceId: string) => void
  film?: boolean
  className?: string
}

const EMPTY_WATCH: CohortWatch = { outcome: 'pending' }

/** The watch cohort is separate from JOB-0117 and never receives invented case IDs. */
export function RolloutCohort({ phase = 'awaiting-owner', watches = [], ownerAuthorized = false, regressionPassed = false, scopeValidated = false, onAuthorizeLimitedRelease, onExpand, onCloseIncident, onOpenEvidence, film = false, className }: RolloutCohortProps) {
  const rows = [watches[0] ?? EMPTY_WATCH, watches[1] ?? EMPTY_WATCH, watches[2] ?? EMPTY_WATCH]
  const evidenceIds = rows.filter((row) => row.outcome === 'verified' && row.evidenceId?.trim()).map((row) => row.evidenceId!.trim())
  const verified = evidenceIds.filter((id) => evidenceIds.filter((other) => other === id).length === 1).length
  const paused = watches.some((row) => row.outcome === 'unknown' || row.outcome === 'regression')
  const canRelease = phase === 'awaiting-owner' && scopeValidated && regressionPassed && !paused && ownerAuthorized && Boolean(onAuthorizeLimitedRelease)
  const canExpand = phase === 'limited-release' && verified === 3 && !paused && ownerAuthorized && Boolean(onExpand)
  const canClose = phase === 'expanded' && verified === 3 && !paused && ownerAuthorized && Boolean(onCloseIncident)
  const releaseReason = paused ? 'Resolve the unknown outcome or regression before release.' : !scopeValidated ? 'Validate the repair scope first.' : !regressionPassed ? 'Complete all 34 regression outcomes first.' : !ownerAuthorized ? 'Marcus Webb must authorize the release.' : 'Release action unavailable.'
  const expandReason = paused ? 'Rollout paused on unknown outcome or regression.' : verified !== 3 ? 'Three independent verifications are required.' : !ownerAuthorized ? 'Marcus Webb must authorize expansion.' : 'Expansion action unavailable.'
  const closeReason = paused ? 'Resolve the unknown outcome or regression before closure.' : verified !== 3 ? 'Three independent verifications are required.' : !ownerAuthorized ? 'Marcus Webb must authorize closure.' : 'Closure action unavailable.'

  return (
    <section data-anchor="rollout-cohort" data-phase={phase} aria-label="Repair rollout cohort" className={cn('w-full max-w-[480px] rounded border bg-surface text-foreground', className)}>
      <header className="flex flex-wrap items-start justify-between gap-2 border-b p-4"><div><h3 className="text-sm font-semibold">{phase === 'awaiting-owner' ? 'Awaiting owner' : 'Limited release'}</h3><p className="mt-1 type-data text-muted-foreground">Agent v1.1 · Owner Marcus Webb</p></div><span className="rounded-sm border px-2 py-1 type-data">{phase === 'closed' ? 'Repaired - Validated' : phase === 'expanded' ? 'Expansion authorized' : paused ? 'Paused' : phase === 'limited-release' ? 'Watching' : 'Pending'}</span></header>
      <div className="space-y-3 p-4"><div className="flex flex-wrap gap-2"><span className="rounded-sm border px-2 py-1 type-data">Kestrel Components invoices only</span><span className="rounded-sm border px-2 py-1 type-data">AP East only</span></div>
        <div><div className="flex justify-between gap-2"><h4 className="text-sm font-medium">Independent watch</h4><span className="type-data">First {verified}/3 Verified Complete</span></div><p className="mt-1 text-xs text-muted-foreground">Separate cohort; not additions to JOB-0117.</p></div>
        <ol className="divide-y border-y">{rows.map((row, index) => {
          const evidence = row.evidenceId?.trim()
          const independent = row.outcome === 'verified' && Boolean(evidence) && evidenceIds.filter((id) => id === evidence).length === 1
          const Icon = independent ? Check : row.outcome === 'unknown' || row.outcome === 'regression' ? Pause : Circle
          const label = independent ? 'Verified Complete' : row.outcome === 'unknown' ? 'Outcome Unknown — paused' : row.outcome === 'regression' ? 'Regression — paused' : row.outcome === 'verified' ? 'Independent evidence required' : 'Awaiting verification'
          return <li key={index} className={cn('flex min-h-10 items-center gap-2 py-2', !film && 'transition-opacity duration-150 motion-reduce:transition-none')}><Icon aria-hidden="true" className="size-4 shrink-0" /><span className="flex-1 text-sm">Watch {index + 1} · {label}</span>{independent && evidence && (onOpenEvidence ? <button type="button" onClick={() => onOpenEvidence(evidence)} className="type-data underline underline-offset-2" aria-label={`Open evidence for watch ${index + 1}`}>Evidence</button> : <span className="type-data">{evidence}</span>)}</li>
        })}</ol>
        {paused && <p role="status" className="text-sm">Pause rollout until the unknown outcome or regression is resolved.</p>}
        {phase === 'closed' && <div className="border-t pt-3"><h4 className="text-sm font-medium">Affected-case history</h4><p className="mt-1 type-data">INC-0042 · INV-48231 · INV-48233 · INV-48236</p></div>}
        <div className="flex flex-wrap gap-2">{phase === 'awaiting-owner' && <Button size="sm" disabled={!canRelease} disabledReason={releaseReason} onClick={onAuthorizeLimitedRelease}>Authorize limited release</Button>}{phase === 'limited-release' && <Button size="sm" disabled={!canExpand} disabledReason={expandReason} onClick={onExpand}>Expand</Button>}{phase === 'expanded' && <Button size="sm" disabled={!canClose} disabledReason={closeReason} onClick={onCloseIncident}>Close incident</Button>}</div>
      </div>
    </section>
  )
}
