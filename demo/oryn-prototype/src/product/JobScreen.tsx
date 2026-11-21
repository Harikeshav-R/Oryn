import { X } from 'lucide-react'
import { StatusGlyph } from '@/components/domain/status-glyphs'
import { Button } from '@/components/ui/button'
import { Hatch } from '@/components/ui/hatch'
import { INVOICE_CASES, JOB_ID } from '@/data/invoices'
import { STATUS_META } from '@/data/status'
import type { StatusId } from '@/data/status'
import { cn } from '@/lib/utils'
import { jobCounts } from '@/state'
import type { State } from '@/state'
import { act } from './contract'
import type { ProductProps } from './contract'
import { refusal } from './discovery'
import { anchored, at, within } from './geometry'
import { caseRows, jobAccess, jobLabel, POPULATION_LABEL, JOB_TEAM_LABEL, JOB_VERSION_LABEL } from './job'
import type { CaseRowView, RowKind } from './job'
import { JobDrawers } from './JobDrawers'
import { APPROVAL_ROW_INDEX, CASE_COLUMNS, CASE_ROW_ANCHORS, CASE_TABLE, JOB_ANCHORS, JOB_PROGRESS, OPEN_SUMMARY, PROGRESS_PARTS, UNKNOWN_ROW_INDEX, caseRow } from './job-layout'
import { glyphFrame } from './simulator'
import { HiddenAnchors } from './settings-frame'

/**
 * SC22 eleven-case job. Rendered inside the shell, in canvas coordinates from `job-layout.ts`; SC23 and SC24 draw this
 * same table with a drawer over it (`JobDrawers`, last).
 * A pure function of `{ state, film }`: every row, the segmented bar and the counts come from the case outcomes, so
 * an approval that has not been independently read back stays Approval Required, the held unknown stays Outcome Unknown
 * and a finished pass is `Partially Complete`, never an all-success total. Cyan appears only while the job executes: the
 * orbit in the status and the one active row. There is no retry and no resubmit control.
 */

const flat = 'transition-none'
const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const SUMMARY_ACTION = { type: 'OPEN_SCREEN', screen: 'SC25' } as const

/** The anchors this screen draws; the drawer anchors belong to `JobDrawers`. */
const OWN_ANCHORS = JOB_ANCHORS.slice(0, 5 + CASE_ROW_ANCHORS.length)

const COLUMN_LABELS = ['Invoice', 'Supplier', 'Amount', 'PO', 'Status', 'Action'] as const

const GLYPH_TONE: Readonly<Partial<Record<StatusId, string>>> = { verified: 'text-success', escalated: 'text-warning', approval: 'text-warning', unknown: 'text-foreground', running: 'text-trace' }

const CATEGORY_STATUS = { verified: 'verified', escalated: 'escalated', approval: 'approval', unknown: 'unknown' } as const

/** Why the case action is unavailable, or null: the action opens the drawer the reducer would route to. */
const drawerBlock = (state: State, screen: 'SC23' | 'SC24'): string | null => refusal(state, { type: 'OPEN_SCREEN', screen })

function RowGlyph({ kind, frame }: { readonly kind: RowKind; readonly frame: number }) {
  if (kind === 'queued') return <span aria-hidden="true" className="inline-block size-3 shrink-0" />
  const status: StatusId = kind
  return (
    <span className={cn('inline-flex shrink-0', GLYPH_TONE[status])}>
      <StatusGlyph status={status} frame={frame} running />
    </span>
  )
}

/** Eleven slots, one per case in table order: verified ink, escalated warning, approval signal, unknown hatched, anything not yet decided an empty outline. */
function Bar({ rows, label }: { readonly rows: readonly CaseRowView[]; readonly label: string }) {
  return (
    <div role="img" aria-label={label} data-segments={rows.length} className="grid" style={{ ...at(PROGRESS_PARTS.bar), gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`, columnGap: 2 }}>
      {rows.map((row) => {
        const kind = row.kind === 'running' ? 'queued' : row.kind
        if (kind === 'unknown') return <Hatch key={row.invoice} className="h-2 w-full border border-foreground" />
        return (
          <span
            key={row.invoice}
            data-slot={kind}
            className={cn('box-border block h-2', kind === 'verified' && 'bg-foreground', kind === 'escalated' && 'bg-warning', kind === 'approval' && 'bg-signal', kind === 'queued' && 'border border-foreground/40')}
          />
        )
      })}
    </div>
  )
}

function Progress({ props, rows }: { readonly props: ProductProps; readonly rows: readonly CaseRowView[] }) {
  const { state } = props
  const counts = jobCounts(state)
  const parts = [
    `${counts.verified} ${STATUS_META.verified.label}`,
    `${counts.escalated} ${STATUS_META.escalated.label}`,
    `${counts.approval} ${STATUS_META.approval.label}`,
    `${counts.unknown} ${STATUS_META.unknown.label}`,
    ...(counts.queued > 0 ? [`${counts.queued} Queued`] : []),
  ]
  const countsLine = parts.join(' \u00b7 ')
  const running = state.running.job
  const filter = state.ui.job.filter
  const shown = rows.filter((row) => row.inFilter).length
  const summaryReason = refusal(state, SUMMARY_ACTION)

  return (
    <div {...anchored('job-progress', JOB_PROGRESS)} aria-label="Job progress" role="group" className="box-border">
      <p className="m-0 flex items-baseline gap-3 overflow-hidden whitespace-nowrap" style={at(PROGRESS_PARTS.title)}>
        <span className="type-card">{`${JOB_ID} \u00b7 ${POPULATION_LABEL}`}</span>
        <span className="type-micro truncate text-muted-foreground">{`${JOB_VERSION_LABEL} \u00b7 ${JOB_TEAM_LABEL}`}</span>
      </p>
      <Bar rows={rows} label={countsLine} />
      <p className="type-data m-0 flex items-center overflow-hidden whitespace-nowrap" data-counts-line="" style={at(PROGRESS_PARTS.counts)}>
        {countsLine}
      </p>
      <div role="status" aria-live="polite" className="type-data flex items-center gap-2" data-job-status={jobLabel(state)} data-executing={running ? 'true' : 'false'} style={at(PROGRESS_PARTS.status)}>
        {running && (
          <span className="inline-flex text-trace">
            <StatusGlyph status="running" frame={glyphFrame(props)} running />
          </span>
        )}
        <span>{jobLabel(state)}</span>
      </div>
      {filter !== 'all' && (
        <div style={at(PROGRESS_PARTS.filter)}>
          <button
            type="button"
            aria-label={`Clear the ${STATUS_META[CATEGORY_STATUS[filter]].label} filter`}
            onClick={() => act(props, { type: 'SET_JOB_FILTER', filter: 'all' })}
            className={cn('box-border inline-flex h-8 max-w-full items-center gap-2 rounded-sm border bg-surface px-2 type-data hover:bg-surface-2', flat, focusRing)}
          >
            <span className="truncate">{`Showing: ${STATUS_META[CATEGORY_STATUS[filter]].label} \u00b7 ${shown} of ${rows.length}`}</span>
            <X aria-hidden="true" className="size-3 shrink-0" />
          </button>
        </div>
      )}
      <Button
        variant="outline"
        {...anchored('open-summary', within(JOB_PROGRESS, OPEN_SUMMARY))}
        className={flat}
        disabled={summaryReason !== null}
        disabledReason={summaryReason ?? undefined}
        onClick={() => act(props, SUMMARY_ACTION)}
      >
        Open summary
      </Button>
    </div>
  )
}

function StatusCell({ row, frame }: { readonly row: CaseRowView; readonly frame: number }) {
  return (
    <div className="flex h-full min-w-0 items-center gap-2 px-3" style={{ width: CASE_COLUMNS[4] }}>
      <RowGlyph kind={row.kind} frame={frame} />
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate type-data', row.kind === 'queued' && 'text-muted-foreground')} style={{ lineHeight: row.note ? '16px' : '18px' }}>
          {row.label}
        </span>
        {row.note && (
          <span className="block truncate type-micro text-muted-foreground" style={{ lineHeight: '14px' }}>
            {row.note}
          </span>
        )}
      </span>
    </div>
  )
}

export function JobScreen(props: ProductProps) {
  const { state } = props
  const access = jobAccess(state)

  if (!access.ok) {
    return (
      <>
        <p role="status" className="type-body m-0 rounded-lg border bg-surface-2 p-4" data-view="denied" style={at({ x: 264, y: 112, width: 992, height: 88 })}>
          Not available: {access.reason}
        </p>
        <HiddenAnchors names={OWN_ANCHORS} />
        <JobDrawers {...props} />
      </>
    )
  }

  const rows = caseRows(state)
  const frame = glyphFrame(props)
  const approvalReason = drawerBlock(state, 'SC23')
  const unknownReason = drawerBlock(state, 'SC24')
  const overlays = [
    { index: APPROVAL_ROW_INDEX, anchor: 'approval-row', screen: 'SC23', reason: approvalReason, text: 'Review' },
    { index: UNKNOWN_ROW_INDEX, anchor: 'unknown-row', screen: 'SC24', reason: unknownReason, text: 'Evidence' },
  ] as const

  const open = (invoice: string, screen: 'SC23' | 'SC24') => {
    act(props, { type: 'SELECT_CASE', caseId: invoice })
    act(props, { type: 'OPEN_SCREEN', screen })
  }

  return (
    <>
      <Progress props={props} rows={rows} />
      <div {...anchored('job-table', CASE_TABLE)} role="table" aria-label={`${POPULATION_LABEL} of JOB-0117`} className="box-border bg-surface">
        <div role="row" className="box-border flex border-b type-micro text-muted-foreground" style={at({ x: 0, y: 0, width: CASE_TABLE.width, height: 32 })}>
          {COLUMN_LABELS.map((label, index) => (
            <span
              key={label}
              role="columnheader"
              className={cn('box-border flex h-full items-center', index === 2 ? 'justify-end px-2' : 'px-3')}
              style={{ width: CASE_COLUMNS[index] }}
            >
              {label}
            </span>
          ))}
        </div>
        {rows.map((row, index) => {
          const place = anchored(CASE_ROW_ANCHORS[index] as string, within(CASE_TABLE, caseRow(index)))
          const selected = state.selectedCase === row.invoice
          const overlay = overlays.find((item) => item.index === index)
          const actionable = overlay !== undefined && overlay.reason === null
          return (
            <div
              key={row.invoice}
              role="row"
              data-case={row.invoice}
              data-outcome={row.kind}
              data-selected={selected ? 'true' : undefined}
              data-dimmed={row.inFilter ? undefined : 'true'}
              aria-selected={selected}
              data-film-anchor={place['data-film-anchor']}
              className="box-border flex border-b bg-surface"
              style={{ ...place.style, opacity: row.inFilter ? 1 : 0.4, boxShadow: selected ? 'inset 0 0 0 2px var(--foreground)' : undefined }}
            >
              <span role="cell" className="box-border flex h-full items-center px-3 type-data" style={{ width: CASE_COLUMNS[0] }}>
                {row.invoice}
              </span>
              <span role="cell" className="box-border flex h-full min-w-0 items-center px-3 type-data" style={{ width: CASE_COLUMNS[1] }}>
                <span className="truncate">{row.supplier}</span>
              </span>
              <span role="cell" className="box-border flex h-full items-center justify-end px-2 type-data tabular-nums" style={{ width: CASE_COLUMNS[2] }}>
                {row.amount}
              </span>
              <span role="cell" className="box-border flex h-full items-center px-3 type-data" style={{ width: CASE_COLUMNS[3] }}>
                {row.po}
              </span>
              <span role="cell" className="box-border block h-full">
                <StatusCell row={row} frame={frame} />
              </span>
              <span role="cell" className="box-border flex h-full items-center px-3 type-data underline underline-offset-2" style={{ width: CASE_COLUMNS[5] }}>
                {actionable ? overlay.text : null}
              </span>
            </div>
          )
        })}
        {rows.map((row, index) => row.kind === 'escalated' ? (
          <button
            key={`select-${row.invoice}`}
            type="button"
            aria-label={`Open case ${row.invoice}`}
            style={at(within(CASE_TABLE, caseRow(index)))}
            onClick={() => act(props, { type: 'SELECT_CASE', caseId: row.invoice })}
            className={cn('box-border cursor-pointer border-0 bg-transparent p-0 hover:bg-foreground/5', flat, focusRing)}
          />
        ) : null)}
        {overlays.map((item) => {
          const invoice = INVOICE_CASES[item.index]?.invoice as string
          const place = anchored(item.anchor, within(CASE_TABLE, caseRow(item.index)), item.reason === null)
          return (
            <button
              key={item.anchor}
              type="button"
              data-film-anchor={place['data-film-anchor']}
              style={place.style}
              aria-label={`${item.text === 'Review' ? 'Open approval' : 'Open evidence'} for ${invoice}`}
              onClick={() => open(invoice, item.screen)}
              className={cn('box-border cursor-pointer border-0 bg-transparent p-0 hover:bg-foreground/5', flat, focusRing)}
            />
          )
        })}
      </div>
      <JobDrawers {...props} />
    </>
  )
}
