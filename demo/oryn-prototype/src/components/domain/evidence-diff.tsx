import { FileText } from 'lucide-react'

export type EvidenceDiffVariant = 'approval' | 'comparator' | 'repair' | 'version'

export interface EvidenceDiffProps {
  /** Select a fixture comparison; neither side changes an evaluation or policy. */
  variant?: EvidenceDiffVariant
  /** The parent opens the authorized source detail. */
  onOpenSource?: (id: string) => void
  sourceAccessible?: boolean
  sourceUnavailableReason?: string
}

interface DiffRow {
  label: string
  before: string
  after: string
  unchanged?: boolean
}

const COMPARISONS: Record<EvidenceDiffVariant, { title: string; source: string; rows: readonly DiffRow[] }> = {
  approval: {
    title: 'Approval proposal · INV-48219', source: 'AP-RULE-009',
    rows: [
      { label: 'Status', before: 'Variance Hold', after: 'Matched - Variance Approved' },
      { label: 'Invoice', before: '$18,420.00', after: '$18,420.00', unchanged: true },
      { label: 'PO-1042', before: '$17,980.00', after: '$17,980.00', unchanged: true },
      { label: 'Variance', before: '$440.00 / 2.45%', after: '$440.00 / 2.45%', unchanged: true },
      { label: 'Authorization', before: 'Tier 3 approval required', after: 'Awaiting independent verification', unchanged: false },
    ],
  },
  comparator: {
    title: 'Comparator fix · SCN-022', source: 'AP-RULE-009',
    rows: [
      { label: 'At exactly 2.00%', before: 'Escalate', after: 'Accept within match' },
      { label: 'Approval threshold', before: 'Above 2.00%', after: 'Above 2.00%', unchanged: true },
      { label: 'Expected', before: 'Accept', after: 'Accept', unchanged: true },
    ],
  },
  repair: {
    title: 'Repair interpretation · Kestrel Components layout v2 only', source: 'AP-RULE-017',
    rows: [
      { label: 'Interpret invoice totals', before: 'Do not include a separately positioned handling line without verified terms', after: 'Include the handling line when approved Kestrel terms cover it' },
      { label: 'Policy and permissions', before: 'Unchanged', after: 'Unchanged', unchanged: true },
    ],
  },
  version: {
    title: 'Evaluation comparison · SIM-AP-RECON', source: 'AP-RULE-009',
    rows: [
      { label: 'Version', before: 'v0.1', after: 'v0.2' },
      { label: 'Passed', before: '21', after: '22' },
      { label: 'Expected safe escalations', before: '6', after: '6', unchanged: true },
      { label: 'Failed', before: '1', after: '0' },
      { label: 'SCN-022', before: 'Failed · actual: escalate', after: 'Passed · actual: accept' },
    ],
  },
}

export function EvidenceDiff({ variant = 'approval', onOpenSource, sourceAccessible = true, sourceUnavailableReason = 'Source restricted for this viewpoint' }: EvidenceDiffProps) {
  const comparison = COMPARISONS[variant]
  return (
    <section data-anchor="diff" aria-label={comparison.title} className="min-w-0 rounded border bg-surface text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className="text-sm font-medium">{comparison.title}</h3>
        {sourceAccessible && onOpenSource ? <button type="button" onClick={() => onOpenSource(comparison.source)} className="inline-flex items-center gap-1 text-xs underline underline-offset-2"><FileText aria-hidden="true" className="size-3.5" />{comparison.source}</button> : <span className="text-xs text-muted-foreground">{sourceAccessible ? 'Source detail unavailable' : sourceUnavailableReason}</span>}
      </div>
      <div className="grid grid-cols-2 text-xs">
        <div className="border-r px-3 py-2 type-data text-muted-foreground">Before</div>
        <div className="px-3 py-2 type-data text-muted-foreground">After</div>
        {comparison.rows.map((row) => (
          <div key={row.label} className="col-span-2 grid grid-cols-2 border-t">
            <div className="min-w-0 border-r px-3 py-2"><span className="block text-muted-foreground">{row.label}</span><span>{row.unchanged ? 'Unchanged: ' : '− Removed: '}{row.before}</span></div>
            <div className="min-w-0 px-3 py-2"><span className="block text-muted-foreground">{row.label}</span><span>{row.unchanged ? 'Unchanged: ' : '+ Added: '}{row.after}</span></div>
          </div>
        ))}
      </div>
    </section>
  )
}
