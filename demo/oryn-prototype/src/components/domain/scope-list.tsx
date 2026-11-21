import { Button } from '@/components/ui/button'

export type ScopeListState = 'draft' | 'complete' | 'missingPermission' | 'unsupportedApp' | 'approved'
export type ScopeDetail = 'team' | 'queue' | 'gmail' | 'netsuite' | 'sheets' | 'agent' | 'action' | 'authority'

export interface ScopeListProps {
  state?: ScopeListState
  /** Supplied by the owning flow after verifying scope and permissions. */
  prerequisitesMet?: boolean
  onOpenDetail?: (detail: ScopeDetail) => void
  onContinue?: () => void
  className?: string
}

const ROWS: readonly { id: ScopeDetail; label: string; value: string; detail?: string }[] = [
  { id: 'team', label: 'Team', value: 'AP East' },
  { id: 'queue', label: 'Queue', value: 'Selected invoice queue' },
  { id: 'gmail', label: 'Application', value: 'Gmail' },
  { id: 'netsuite', label: 'Application', value: 'NetSuite' },
  { id: 'sheets', label: 'Application', value: 'Google Sheets' },
  { id: 'agent', label: 'Agent', value: 'Supplier Invoice Reconciler' },
  { id: 'action', label: 'Action', value: 'Run Supervised', detail: 'Read: Tier 0 · Tag/stage: Tier 1/2' },
  { id: 'authority', label: 'Authority', value: 'Tier 3 - Consequential', detail: 'Post and approve variance require separate delegated human authority.' },
]

/** Capability does not grant permission; a viewpoint change cannot expand this scope. */
export function ScopeList({ state = 'draft', prerequisitesMet = false, onOpenDetail, onContinue, className }: ScopeListProps) {
  const blockedState = state === 'missingPermission' || state === 'unsupportedApp'
  const canContinue = prerequisitesMet && !blockedState && Boolean(onContinue)
  const reason = state === 'missingPermission' ? 'Required permission is missing.' : state === 'unsupportedApp' ? 'Unavailable: application capability is not supported.' : !prerequisitesMet ? 'Scope and permissions must be confirmed first.' : 'Simulator cannot be opened.'

  return (
    <section data-anchor="scope-list" className={className}>
      <div className="rounded-lg border bg-surface p-4">
        <div className="flex items-center justify-between gap-2"><h2 className="text-base font-semibold">Scope and permissions</h2><span className="rounded border px-2 py-1 text-xs">{state === 'approved' ? 'Approved scope' : state === 'complete' ? 'Complete' : 'Draft'}</span></div>
        <ul className="mt-3 divide-y divide-border border-y">
          {ROWS.map((row) => {
            if (row.id === 'netsuite' || row.id === 'sheets') return null
            if (row.id === 'gmail') return <li key="applications" className="flex min-h-10 flex-wrap items-center justify-between gap-x-3"><span className="text-sm">Applications</span><div className="flex flex-wrap justify-end gap-x-3">{ROWS.slice(2, 5).map((app) => onOpenDetail ? <button key={app.id} type="button" aria-label={`Application: ${app.value}`} onClick={() => onOpenDetail(app.id)} className="min-h-10 type-data hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]">{app.value}</button> : <span key={app.id} className="type-data">{app.value}</span>)}</div></li>
            return <li key={row.id}>{onOpenDetail ? <button type="button" onClick={() => onOpenDetail(row.id)} className="flex min-h-10 w-full flex-wrap items-center justify-between gap-x-3 py-1 text-left hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"><span className="text-sm">{row.label}</span><span className="type-data text-right">{row.value}{row.detail && <span className="block text-muted-foreground">{row.detail}</span>}</span></button> : <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 py-1"><span className="text-sm">{row.label}</span><span className="type-data text-right">{row.value}{row.detail && <span className="block text-muted-foreground">{row.detail}</span>}</span></div>}</li>
          })}
        </ul>
        {blockedState && <p role="status" className="mt-3 text-sm">{reason}</p>}
        <p className="mt-3 text-xs text-muted-foreground">Capability is not permission. Tier 3 decisions require delegated human authority; changing viewpoint does not grant access.</p>
        <div className="mt-4 flex justify-end"><Button disabled={!canContinue} disabledReason={reason} onClick={onContinue}>Continue</Button></div>
      </div>
    </section>
  )
}
