import { StatusGlyph } from '@/components/domain/status-glyphs'
import { jobCounts, type DecisionState, type JobCounts } from '@/data/approval'
import { JOB_ID } from '@/data/invoices'
import type { StatusId } from '@/data/status'
import { cn } from '@/lib/utils'

export type MetricCategory = keyof JobCounts | 'incident'
export type IncidentMetricState = 'contained' | 'repaired'

export interface MetricCardProps {
  category: MetricCategory
  value: number
  label: string
  status: StatusId
  scope: string
  selected?: boolean
  onSelect?: (category: MetricCategory) => void
  className?: string
}

/** A card filters only its named category; it does not change domain state. */
export function MetricCard({ category, value, label, status, scope, selected = false, onSelect, className }: MetricCardProps) {
  const content = <><span className="flex items-center gap-2 type-data"><StatusGlyph status={status} />{label}</span><span className="mt-4 block font-sans text-[28px] font-bold leading-[34px] tabular-nums">{value}</span><span className="mt-auto block pt-3 type-data text-muted-foreground">{scope}</span></>
  const classes = cn('flex min-h-[160px] w-full min-w-0 flex-col rounded-lg border bg-surface p-4 text-left text-foreground', selected && 'border-foreground', className)
  return onSelect ? <button type="button" data-anchor="metric-card" data-category={category} aria-pressed={selected} onClick={() => onSelect(category)} className={cn(classes, 'hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground')}>{content}</button> : <div data-anchor="metric-card" data-category={category} className={classes}>{content}</div>
}

export interface JobMetricCardsProps {
  decision: DecisionState
  readbackVerified: boolean
  selected?: MetricCategory | null
  onSelect?: (category: MetricCategory) => void
  className?: string
}

const JOB_METRICS: readonly { category: keyof JobCounts; label: string; status: StatusId }[] = [
  { category: 'verified', label: 'Verified Complete', status: 'verified' },
  { category: 'escalated', label: 'Escalated', status: 'escalated' },
  { category: 'approval', label: 'Approval Required', status: 'approval' },
  { category: 'unknown', label: 'Outcome Unknown', status: 'unknown' },
]

/** Only approval followed by independent readback changes the eleven-case snapshot. */
export function JobMetricCards({ decision, readbackVerified, selected = null, onSelect, className }: JobMetricCardsProps) {
  const counts = jobCounts(decision, readbackVerified)
  return <section aria-label={`${JOB_ID} outcome snapshot`} className={className}><p className="mb-3 text-sm text-muted-foreground">{JOB_ID} · 11 cases · single-job snapshot</p><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{JOB_METRICS.map(({ category, label, status }) => <MetricCard key={category} category={category} value={counts[category]} label={label} status={status} scope={`${JOB_ID} · 11 cases`} selected={selected === category} onSelect={onSelect} />)}</div></section>
}

export interface IncidentMetricCardProps {
  state: IncidentMetricState
  selected?: boolean
  onSelect?: (category: MetricCategory) => void
  className?: string
}

/** INC-0042 is a separate incident population, not another JOB-0117 case. */
export function IncidentMetricCard({ state, selected = false, onSelect, className }: IncidentMetricCardProps) {
  return <MetricCard category="incident" value={1} label={state === 'contained' ? 'contained incident' : 'repaired incident'} status={state === 'contained' ? 'contained' : 'verified'} scope="INC-0042 · separate from job cases" selected={selected} onSelect={onSelect} className={className} />
}
