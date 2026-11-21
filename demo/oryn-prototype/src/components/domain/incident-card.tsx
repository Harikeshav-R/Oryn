import { Square } from 'lucide-react'
import { ExpectedActual } from '@/components/domain/expected-actual'
import { StatusBadge } from '@/components/domain/status-badge'
import { INCIDENT, REPAIR } from '@/data/incident'

export type IncidentCardState = 'opened' | 'contained' | 'manual-resolution' | 'repaired-closed'
export type IncidentCaseId = (typeof INCIDENT.affectedCases)[number]['id']

export interface IncidentCardProps {
  /** State is supplied by the parent after the corresponding event. */
  state?: IncidentCardState
  sourceAccessible?: boolean
  sourceUnavailableReason?: string
  onOpenSource?: (id: string) => void
  onOpenCase?: (id: IncidentCaseId) => void
  /** Authorized evidence of Elena's completed manual work; required to enable Teach. */
  manualCompletionEvidenceId?: string
  onTeach?: () => void
}


export function IncidentCard({ state = 'opened', sourceAccessible = true, sourceUnavailableReason = 'Source restricted for this viewpoint', onOpenSource, onOpenCase, manualCompletionEvidenceId, onTeach }: IncidentCardProps) {
  const contained = state !== 'opened'
  const closed = state === 'repaired-closed'
  const manual = (state === 'manual-resolution' || closed) && Boolean(manualCompletionEvidenceId?.trim())

  return (
    <section data-anchor="incident-card" aria-label={`Incident ${INCIDENT.id}`} className="min-w-0 rounded border bg-surface text-foreground">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div>
          <h3 className="type-data font-semibold">{INCIDENT.id} <span className="font-normal text-muted-foreground">· Agent v1.0</span></h3>
          <p className="mt-2 text-sm">{INCIDENT.summary}</p>
        </div>
        {closed ? <span className="inline-flex h-6 items-center gap-1 rounded-sm border px-2 type-data"><Square aria-hidden="true" className="size-3" />{REPAIR.release.disposition} · Closed</span> : contained ? <StatusBadge status="contained" /> : <span className="inline-flex h-6 items-center gap-1 rounded-sm border px-2 type-data"><Square aria-hidden="true" className="size-3" />Incident opened</span>}
      </header>
      <div className="p-4">
        <p className="mb-2 text-sm font-medium">{closed ? '3 affected cases contained before repair' : contained ? '3 affected cases held' : '3 affected cases'}</p>
        <ul className="divide-y rounded border">
          {INCIDENT.affectedCases.map(({ id }) => (
            <li key={id} className="flex items-center justify-between gap-3 px-3 py-1">
              {sourceAccessible && onOpenCase ? <button type="button" onClick={() => onOpenCase(id)} className="type-data underline underline-offset-2">{id}</button> : <span className="type-data">{id}</span>}
              <span className="text-xs text-muted-foreground">{manual && id === INCIDENT.correction.caseId ? 'Manually completed' : closed ? 'Affected case' : contained ? 'Held' : 'Affected'}</span>
            </li>
          ))}
        </ul>
        {!sourceAccessible && <p className="mt-2 text-xs text-muted-foreground">{sourceUnavailableReason}</p>}
        {manual && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span>Elena manually completed INV-48231.</span>{sourceAccessible && onOpenSource ? <button type="button" className="underline underline-offset-2" onClick={() => onOpenSource(manualCompletionEvidenceId!)}>Completion evidence</button> : <span className="text-muted-foreground">{sourceAccessible ? 'Completion evidence unavailable' : sourceUnavailableReason}</span>}{!closed && <button type="button" disabled={!onTeach || !sourceAccessible} onClick={onTeach} className="rounded border px-2 py-1 disabled:opacity-50">Teach</button>}</div>}
        <div className="mt-4"><h4 className="mb-2 text-sm font-medium">Evidence</h4><ExpectedActual variant="incident" sourceState={sourceAccessible ? 'available' : 'restricted'} sourceUnavailableReason={sourceUnavailableReason} onOpenSource={onOpenSource} /></div>
        <div className="mt-4 border-t pt-3"><h4 className="text-sm font-medium">Hypothesis <span className="font-normal text-muted-foreground">· {INCIDENT.hypothesis.status}</span></h4><p className="mt-1 text-sm">{INCIDENT.hypothesis.description} — {INCIDENT.hypothesis.status}</p></div>
      </div>
    </section>
  )
}
