import { Check } from 'lucide-react'
import { CAPABILITY_COLUMNS, CAPABILITY_MATRIX, OTHER_APPLICATIONS, type CapabilityAvailability, type CapabilitySelection } from '@/data/capabilities'
import { cn } from '@/lib/utils'

export interface CapabilityMatrixProps {
  selected?: CapabilitySelection | null
  onSelect?: (selection: CapabilitySelection) => void
  film?: boolean
  className?: string
}

const LABELS: Record<CapabilityAvailability, string> = {
  available: 'Available',
  unavailable: '— Unavailable',
  'per-meeting-opt-in': 'Observe by per-meeting opt-in',
}

/** Capability describes adapter support only; policy and authority are evaluated separately. */
export function CapabilityMatrix({ selected = null, onSelect, film = false, className }: CapabilityMatrixProps) {
  const selectedRow = CAPABILITY_MATRIX.find((row) => row.application === selected?.application)
  const selectedAvailability = selected && selectedRow?.capabilities[selected.capability]
  const selectionSupported = selectedAvailability && selectedAvailability !== 'unavailable'

  return (
    <section aria-label="Application capabilities" className={cn('min-w-0 text-foreground', className)}>
      <h2 className="text-lg font-semibold">Application capabilities</h2>
      <p className="mt-1 text-sm text-muted-foreground">Capability does not grant authority. Use remains subject to permissions and policy.</p>
      <div className="mt-4 overflow-x-auto rounded border bg-surface">
        <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
          <thead><tr className="border-b"><th scope="col" className="w-[180px] px-3 py-3 type-data">Application</th>{CAPABILITY_COLUMNS.map((capability) => <th key={capability} scope="col" className="px-2 py-3 type-data">{capability}</th>)}</tr></thead>
          <tbody>{CAPABILITY_MATRIX.map((row) => <tr key={row.application} className="border-b last:border-b-0"><th scope="row" className="px-3 py-2 text-sm font-medium">{row.application}</th>{CAPABILITY_COLUMNS.map((capability) => {
            const availability = row.capabilities[capability]
            const active = selected?.application === row.application && selected.capability === capability && availability !== 'unavailable'
            const reason = `${capability} is unavailable for ${row.application}.`
            return <td key={capability} className="border-l p-1 align-middle"><button type="button" data-anchor="capability-cell" data-availability={availability} disabled={availability === 'unavailable' || !onSelect} title={availability === 'unavailable' ? reason : !onSelect ? 'Capability details unavailable.' : undefined} aria-label={`${row.application}, ${capability}: ${LABELS[availability]}${availability === 'unavailable' ? `. ${reason}` : ''}`} aria-pressed={availability !== 'unavailable' ? active : undefined} onClick={() => onSelect?.({ application: row.application, capability })} className={cn('flex min-h-10 w-full min-w-0 items-start gap-1 rounded-sm border border-transparent px-1.5 py-2 text-left font-mono text-[11px] leading-4', availability !== 'unavailable' && onSelect && 'hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground', active && 'border-foreground', !film && 'transition-colors duration-150 motion-reduce:transition-none')}>
              {availability !== 'unavailable' && <Check aria-hidden="true" className="mt-0.5 size-3 shrink-0" />}<span>{LABELS[availability]}</span>
            </button></td>
          })}</tr>)}</tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Unavailable cells identify actions not supported for that application.</p>
      {selectionSupported && selected && <div className="mt-3 rounded border bg-surface p-3" aria-live="polite"><h3 className="text-sm font-medium">{selected.application} · {selected.capability}</h3><p className="mt-1 text-sm">{LABELS[selectedAvailability]}</p><p className="mt-1 text-xs text-muted-foreground">Availability does not grant permission or approval.</p></div>}
      <div className="mt-4" aria-label="Other applications"><p className="text-xs text-muted-foreground">Other applications</p><ul className="mt-2 flex flex-wrap gap-2">{OTHER_APPLICATIONS.map((application) => <li key={application} className="rounded border px-2 py-1 type-data text-muted-foreground">{application}</li>)}</ul></div>
    </section>
  )
}
