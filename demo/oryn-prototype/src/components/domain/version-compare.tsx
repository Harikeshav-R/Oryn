import { useState } from 'react'
import { GitCompareArrows, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { VERSION_HISTORY, type VersionComparison, type VersionId } from '@/data/versions'
import { cn } from '@/lib/utils'

export interface VersionCompareProps {
  selectedId?: VersionId
  onSelect?: (id: VersionId) => void
  comparison?: VersionComparison | null
  onCompare?: (comparison: VersionComparison) => void
  /** True only after all 34 regression outcomes have met their expected results. */
  regressionPassed?: boolean
  /** Authorization must cover the previous approved agent version and future jobs. */
  restoreAuthorized?: boolean
  onRestore?: (version: 'agent-v1.0') => void
  film?: boolean
  className?: string
}

export function VersionCompare({ selectedId, onSelect, comparison, onCompare, regressionPassed = false, restoreAuthorized = false, onRestore, film = false, className }: VersionCompareProps) {
  const [localSelection, setLocalSelection] = useState<VersionId>('agent-v1.1')
  const [localComparison, setLocalComparison] = useState<VersionComparison | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const selected = selectedId ?? localSelection
  const currentComparison = comparison === undefined ? localComparison : comparison
  const restoreBlocked = !restoreAuthorized || !onRestore

  function select(id: VersionId) {
    if (selectedId === undefined) setLocalSelection(id)
    onSelect?.(id)
  }
  function compare(next: VersionComparison) {
    if (comparison === undefined) setLocalComparison(next)
    onCompare?.(next)
  }

  return (
    <section data-anchor="version-compare" aria-label="Version history" className={cn('w-full rounded border bg-surface text-foreground', className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b p-4"><h3 className="text-sm font-semibold">Version history</h3><span className="text-xs text-muted-foreground">Immutable evaluation and release history</span></header>
      <ul className="divide-y">{VERSION_HISTORY.map((record) => <li key={record.id}><button type="button" aria-pressed={selected === record.id} onClick={() => select(record.id)} className={cn('flex min-h-10 w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]', selected === record.id && 'bg-muted', !film && 'transition-colors duration-150 motion-reduce:transition-none')}><span className="w-32 shrink-0 type-data font-semibold">{record.kind} {record.version}</span><span className="text-sm">{record.status}</span><span className="ml-auto text-xs text-muted-foreground">{record.id === 'agent-v1.1' && !regressionPassed ? 'SIM-AP-RECON-34 · Regression pending' : record.detail}</span></button></li>)}</ul>
      <div className="flex flex-wrap items-center gap-2 border-t p-4"><Button variant="outline" size="sm" icon={<GitCompareArrows className="size-4" />} onClick={() => compare(selected === 'agent-v1.0' || selected === 'agent-v1.1' ? 'repair' : 'evaluation')}>Compare</Button><Button variant="ghost" size="sm" onClick={() => compare('evaluation')}>v0.1 / v0.2</Button><Button variant="ghost" size="sm" onClick={() => compare('repair')}>v1.0 / v1.1</Button><Button variant="outline" size="sm" icon={<RotateCcw className="size-4" />} disabled={restoreBlocked} disabledReason={!restoreAuthorized ? 'Authorization is required to restore the previous approved version.' : 'Restore action unavailable.'} onClick={() => setConfirmOpen(true)}>Restore previous approved version</Button></div>
      {currentComparison && <div className={cn('grid grid-cols-1 border-t sm:grid-cols-2', !film && 'transition-opacity duration-150 motion-reduce:transition-none')} aria-label="Version comparison">{currentComparison === 'evaluation' ? <><div className="p-4 sm:border-r"><h4 className="type-data font-semibold">Agent v0.1 · Failed evaluation</h4><p className="mt-2 text-sm">SCN-022: Expected: accept; Actual: escalate.</p><p className="mt-2 text-xs text-muted-foreground">21 Passed · 6 Passed — Expected Safe Escalation · 1 Failed</p></div><div className="p-4"><h4 className="type-data font-semibold">Agent v0.2 · Passed evaluation</h4><p className="mt-2 text-sm">Exactly 2.00% is accepted; &gt; 2.00% requires approval.</p><p className="mt-2 text-xs text-muted-foreground">22 Passed · 6 Passed — Expected Safe Escalation · 0 Failed</p></div></> : <><div className="p-4 sm:border-r"><h4 className="type-data font-semibold">Agent v1.0 · Released</h4><p className="mt-2 text-sm">Do not include a separately positioned handling line without verified terms.</p></div><div className="p-4"><h4 className="type-data font-semibold">Agent v1.1 · Repair</h4><p className="mt-2 text-sm">Include the handling line when approved Kestrel terms cover it.</p><p className="mt-2 text-xs text-muted-foreground">Kestrel Components layout v2 only · Permissions and policy unchanged.</p><p className="mt-2 text-xs text-muted-foreground">{regressionPassed ? '28 Passed · 6 Passed — Expected Safe Escalation · 0 Failed' : 'Regression pending'}</p></div></>}</div>}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent title="Restore for future jobs only?" description="Prior business effects will not be undone." footer={<><Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button><Button disabled={restoreBlocked} disabledReason="Authorization is required to restore the previous approved version." onClick={() => { if (!restoreBlocked && onRestore) { onRestore('agent-v1.0'); setConfirmOpen(false) } }}>Restore</Button></>}><p className="text-sm">Restore Agent v1.0 for future jobs only. Historical actions and records remain unchanged.</p></DialogContent></Dialog>
    </section>
  )
}
