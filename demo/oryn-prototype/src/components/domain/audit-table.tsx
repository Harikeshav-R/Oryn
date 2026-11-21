import { StatusBadge } from '@/components/domain/status-badge'
import { rowClass, type TableDensity } from '@/components/ui/table-row'
import { Table, TableStateRow, Td, Th, type TableState, type TableStateCopy } from '@/components/ui/table'
import { AUDIT_EVENTS, type AuditEvent } from '@/data/audit'
import { STATUS_BY_LABEL } from '@/data/status'

/**
 * CMP-07 audit table (DAT-11). Five columns, one field each. Immutable facts: only the
 * events up to `visibleCount` are present, so earlier views cannot show future events.
 * Long values wrap. A field the source does not state renders as an em dash with an accessible
 * "Not specified". No timestamps exist in the source, so none are shown.
 */
const COLUMNS = [
  ['Actor', 160],
  ['Event', 168],
  ['Object', 224],
  ['Scope', 224],
  ['Outcome', 216],
] as const

const STATE_COPY: Record<Exclude<TableState, 'ready'>, TableStateCopy> = {
  loading: { reason: 'Loading audit records.' },
  empty: { reason: 'No audit events yet. Events appear only after they happen.' },
  error: { reason: 'Audit records could not be loaded.', action: { label: 'Reload records' } },
  unauthorized: { reason: 'Your current role cannot view audit records.' },
}

function Value({ value }: { value: string | null }) {
  if (value !== null) return <span>{value}</span>
  return (
    <>
      <span aria-hidden="true">{'\u2014'}</span>
      <span className="sr-only">Not specified</span>
    </>
  )
}

export function AuditTable({
  events = AUDIT_EVENTS,
  visibleCount = 0,
  selectedId,
  onSelect,
  density = 'dense',
  state = 'ready',
  onRecover,
}: {
  events?: readonly AuditEvent[]
  visibleCount?: number
  selectedId?: string | null
  onSelect?: (id: string) => void
  density?: TableDensity
  state?: TableState
  onRecover?: () => void
}) {
  const visible = events.filter((event) => event.order <= visibleCount)
  const copy = state === 'ready' ? null : STATE_COPY[state]
  return (
    <Table aria-label="Audit history" data-anchor="audit-table">
      <colgroup>
        {COLUMNS.map(([name, width]) => (
          <col key={name} style={{ width }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {COLUMNS.map(([name]) => (
            <Th key={name}>{name}</Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {state !== 'ready' && copy ? (
          <TableStateRow
            state={state}
            colSpan={COLUMNS.length}
            copy={copy.action ? { ...copy, action: { ...copy.action, onAction: onRecover } } : copy}
          />
        ) : (
          visible.map((event) => {
            const selected = event.id === selectedId
            const status = event.outcome ? STATUS_BY_LABEL[event.outcome] : undefined
            return (
              <tr
                key={event.id}
                data-audit={event.id}
                data-selected={selected ? 'true' : undefined}
                aria-current={selected ? 'true' : undefined}
                className={rowClass(density, selected)}
                onClick={() => onSelect?.(event.id)}
              >
                <Td className="py-1">
                  <Value value={event.actor} />
                </Td>
                <Td className="py-1">
                  <span className="text-muted-foreground">{event.id}</span> <Value value={event.action} />
                </Td>
                <Td className="py-1">
                  <Value value={event.object} />
                </Td>
                <Td className="py-1">
                  <Value value={event.scope} />
                </Td>
                <Td className="py-1">{status ? <StatusBadge status={status} /> : <Value value={event.outcome} />}</Td>
              </tr>
            )
          })
        )}
      </tbody>
    </Table>
  )
}
