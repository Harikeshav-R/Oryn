import { useState } from 'react'
import { CaseTable } from '@/components/domain/case-table'
import { StatusGlyph } from '@/components/domain/status-glyphs'
import { Hatch } from '@/components/ui/hatch'
import { INVOICE_CASES, JOB_ID } from '@/data/invoices'
import { STATUS_META } from '@/data/status'
import { cn } from '@/lib/utils'

type Outcome = 'verified' | 'escalated' | 'approval' | 'unknown'
type JobPhase = 'initial' | 'running' | 'paused' | 'snapshot'
type ApprovalState = 'required' | 'approved' | 'verified'

const OUTCOMES: readonly Outcome[] = ['verified', 'escalated', 'approval', 'unknown']
const SEGMENT_CLASS: Record<Exclude<Outcome, 'unknown'>, string> = {
  verified: 'bg-foreground',
  escalated: 'bg-warning',
  approval: 'bg-signal',
}
const GLYPH_CLASS: Record<Outcome, string> = {
  verified: 'text-success',
  escalated: 'text-warning',
  approval: 'text-warning',
  unknown: 'text-signal',
}

/** JOB-0117 outcomes remain fixture-derived; only an independent readback verifies approval. */
export function JobProgress({
  phase = 'snapshot',
  approvalState = 'required',
  frame = 0,
  selectedId,
  onSelect,
}: {
  phase?: JobPhase
  approvalState?: ApprovalState
  frame?: number
  selectedId?: string | null
  onSelect?: (invoice: string) => void
}) {
  const [filter, setFilter] = useState<Outcome | null>(null)
  const rows = INVOICE_CASES.map((row) =>
    row.invoice === 'INV-48219' && approvalState === 'verified'
      ? { ...row, outcome: 'verified' as const, qualifier: undefined }
      : row,
  )
  const counts: Record<Outcome, number> = {
    verified: rows.filter((row) => row.outcome === 'verified').length,
    escalated: rows.filter((row) => row.outcome === 'escalated').length,
    approval: rows.filter((row) => row.outcome === 'approval').length,
    unknown: rows.filter((row) => row.outcome === 'unknown').length,
  }
  const visibleRows = phase === 'snapshot' && filter ? rows.filter((row) => row.outcome === filter) : rows
  const running = phase === 'running'
  const progress = Math.max(0, Math.min(11, Math.floor(frame)))

  return (
    <section data-anchor="job-progress" aria-label={`${JOB_ID} progress and cases`} className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 type-data">
          <span>{JOB_ID} · Supplier Invoice Reconciler v1.0 · AP East</span>
          <span>{phase === 'snapshot' ? 'Partially Complete' : phase === 'initial' ? 'Queued' : running ? 'Running' : 'Paused'}</span>
        </div>
        {phase === 'snapshot' ? (
          <div className="flex h-2 w-full overflow-hidden rounded-sm bg-muted" aria-label="Outcome composition for 11 cases">
            {OUTCOMES.map((outcome) => (
              <span key={outcome} style={{ width: `${(counts[outcome] / rows.length) * 100}%` }} className="h-full overflow-hidden">
                {outcome === 'unknown' ? <Hatch className="h-full w-full" /> : <span className={cn('block h-full w-full', SEGMENT_CLASS[outcome])} />}
              </span>
            ))}
          </div>
        ) : (
          <div role="progressbar" aria-label="Cases processed" aria-valuemin={0} aria-valuemax={11} aria-valuenow={phase === 'initial' ? 0 : progress} className="h-2 overflow-hidden rounded-sm bg-muted">
            <span className={cn('block h-full', running ? 'bg-arc' : 'bg-foreground')} style={{ width: `${((phase === 'initial' ? 0 : progress) / 11) * 100}%` }} />
          </div>
        )}
        {phase === 'snapshot' ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Filter cases by outcome">
            {OUTCOMES.map((outcome) => (
              <button
                key={outcome}
                type="button"
                aria-pressed={filter === outcome}
                onClick={() => setFilter(filter === outcome ? null : outcome)}
                className="inline-flex items-center gap-1 rounded-sm px-1 py-1 type-data text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground aria-pressed:bg-muted"
              >
                <span className={GLYPH_CLASS[outcome]}><StatusGlyph status={outcome} /></span>
                <span>{counts[outcome]} {STATUS_META[outcome].label}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="type-data">{phase === 'initial' ? '0' : progress} of 11 cases processed. Processing does not imply verification.</p>
        )}
        {phase === 'snapshot' && approvalState === 'approved' && (
          <p className="type-data">INV-48219 approved · Awaiting verification</p>
        )}
        {phase === 'snapshot' && <p className="type-data">INV-48220: Held · Do not resubmit until reconciled</p>}
      </div>
      <CaseTable
        rows={visibleRows}
        selectedId={selectedId}
        onSelect={onSelect}
        frame={frame}
        workProgress={phase === 'snapshot' ? undefined : { processed: phase === 'initial' ? 0 : progress, running }}
      />
    </section>
  )
}
