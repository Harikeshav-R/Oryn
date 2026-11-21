import { Lock } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { StatusGlyph } from '@/components/domain/status-glyphs'
import { Button } from '@/components/ui/button'
import { SCOPE } from '@/data/agent-draft'
import { INVOICE_CASES, JOB_ID, formatCents } from '@/data/invoices'
import { STOPPED_LABEL } from '@/data/status'
import { cn } from '@/lib/utils'
import { jobLabel, person } from '@/state'
import { CANVAS, act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { FocusOnOpen } from './focus-on-open'
import { trapTab } from './focus-trap'
import { anchored, at, within } from './geometry'
import { authorityBlock, JOB_TEAM_LABEL, JOB_VERSION_LABEL, POPULATION_LABEL, jobAccess, scopeBlock, selectionBlock, startBlock } from './job'
import {
  CONFIRM_JOB_SCOPE,
  CONFIRM_SELECTION,
  JOBS_ANCHORS,
  JOBS_HEADING,
  JOBS_NOTICE,
  JOB_ROW,
  JOB_ROW_PARTS,
  PREFLIGHT,
  QUEUE,
  QUEUE_COLUMNS,
  SCOPE_DIALOG,
  SCOPE_DIALOG_PARTS,
  queueRow,
  preflightRow,
} from './job-layout'
import { Frame, HiddenAnchors } from './settings-frame'

/**
 * SC21 Jobs queue and scope confirmation. Rendered inside the shell, in canvas coordinates from `job-layout.ts`.
 * A pure function of `{ state, film }`. The population is fixed before anything starts: `Confirm 11 invoices`
 * freezes it, `Confirm job scope` opens the confirmation, and only `Start job` inside that confirmation starts
 * the job, through the reducer's guarded `RELEASE_AND_START`. Cancel, Escape and the scrim start nothing.
 *
 * Starting a job is not blanket permission: the preflight and the dialog both say that variance above the
 * threshold still needs a person's Tier 3 approval. Cyan appears only on the status orbit of a job that is
 * executing; before the start and after it stops the status is neutral ink.
 */

const flat = 'transition-none'
const chip = 'box-border inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-sm border bg-surface px-2 type-data'

const STARTED_NOTE = `${JOB_ID} started on v1.0. Cases are evaluated independently; a finished pass is not an all-success outcome.`
const CANCELLED_NOTE = 'Job start cancelled. Nothing was started; the queue is unchanged.'
const POLICY_TEXT = 'Invoice approval threshold 2.00%. Variance above it needs Tier 3 approval by a person.'
const NO_POSTING = 'Starting this job does not authorize consequential variance posting.'
const SELECTION_TITLE = 'Proposed selection'
const FIXED_TITLE = `Selection fixed \u00b7 ${POPULATION_LABEL}`

function PreflightRow({ index, label, value, detail, title }: { readonly index: number; readonly label: string; readonly value: string; readonly detail: string; readonly title?: string }) {
  return (
    <div style={at(preflightRow(index))} className="box-border flex flex-col justify-center overflow-hidden border-b px-3" data-preflight={label}>
      <span className="type-micro block truncate text-muted-foreground">{label}</span>
      <span className="type-data block truncate">{value}</span>
      <span className="type-micro block truncate text-muted-foreground" title={title}>
        {detail}
      </span>
    </div>
  )
}

function StatusChip({ props }: { readonly props: ProductProps }) {
  const { state, film } = props
  const label = jobLabel(state)
  if (state.job.status === 'notStarted') return <span className={chip}>{label}</span>
  if (state.job.status === 'running') {
    const running = state.running.job
    return (
      <span className={chip} data-job-status="running" data-running={running ? 'true' : 'false'}>
        <span className={running ? 'text-trace' : 'text-signal'}>
          <StatusGlyph status="running" frame={film?.frame ?? props.runFrame ?? 0} running={running} />
        </span>
        <span>{running ? label : STOPPED_LABEL}</span>
      </span>
    )
  }
  return <span className={chip}>{label}</span>
}

export function JobsScreen(props: ProductProps) {
  const { state, film } = props
  const access = jobAccess(state)
  const interactive = film === undefined
  const started = state.job.status !== 'notStarted'
  const open = access.ok && state.ui.job.dialog === 'open' && state.phase === 'ST09'

  if (!access.ok) {
    return (
      <>
        <h1 className="type-title m-0" style={at(JOBS_HEADING)}>
          Jobs
        </h1>
        <p role="status" className="type-body m-0 rounded-lg border bg-surface-2 p-4" data-view="denied" style={at({ x: 264, y: 176, width: 992, height: 88 })}>
          Not available: {access.reason}
        </p>
        <HiddenAnchors names={JOBS_ANCHORS} />
      </>
    )
  }

  const fixed = state.ui.job.selection === 'confirmed' || started
  const selectionReason = selectionBlock(state)
  const scopeReason = scopeBlock(state)
  const startReason = startBlock(state)
  const authority = authorityBlock(state)
  const notice = started ? STARTED_NOTE : state.ui.job.startCancelled ? CANCELLED_NOTE : authority
  const fade = open ? motionProgress(film, 'OPEN_JOB_SCOPE') : 1
  const actor = person(state.actorId).name

  const onDialogKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      act(props, { type: 'CANCEL_JOB_START' })
    } else trapTab(event, event.currentTarget)
  }

  return (
    <>
      <h1 className="type-title m-0" style={at(JOBS_HEADING)}>
        Jobs
      </h1>

      <div {...anchored('job-row', JOB_ROW)} role="group" aria-label={`${JOB_ID}, ${JOB_VERSION_LABEL}`} data-job-status-label={jobLabel(state)} className="box-border border-b bg-surface">
        <span aria-hidden="true" className="absolute left-0 top-0 h-full w-0.5 bg-signal" />
        <span className="type-data flex items-center font-medium" style={at(JOB_ROW_PARTS.id)}>
          {JOB_ID}
        </span>
        <span className="type-body flex items-center truncate" style={at(JOB_ROW_PARTS.name)}>
          <span className="truncate">{JOB_VERSION_LABEL}</span>
        </span>
        <span className="type-data flex items-center" style={at(JOB_ROW_PARTS.team)}>
          {JOB_TEAM_LABEL}
        </span>
        <span className="type-data flex items-center" style={at(JOB_ROW_PARTS.population)}>
          {POPULATION_LABEL}
        </span>
        <span className="flex items-center" style={at(JOB_ROW_PARTS.status)} aria-live="polite">
          <StatusChip props={props} />
        </span>
      </div>
      <Button
        variant="primary"
        {...anchored('confirm-job-scope', CONFIRM_JOB_SCOPE)}
        className={flat}
        disabled={scopeReason !== null}
        disabledReason={scopeReason ?? undefined}
        onClick={() => act(props, { type: 'OPEN_JOB_SCOPE' })}
      >
        Confirm job scope
      </Button>

      <Frame as="section" anchor="jobs-queue" rect={QUEUE} role="table" aria-label={`${JOB_ID} invoices, ${fixed ? 'selection fixed' : 'proposed selection'}`} data-selection={fixed ? 'fixed' : 'proposed'}>
        <div role="row" className="box-border flex items-center border-b bg-surface-2 type-micro text-muted-foreground" style={at({ x: 0, y: 0, width: QUEUE.width, height: 32 })}>
          <span role="columnheader" aria-colspan={3} className="type-data truncate px-3 text-foreground" style={{ width: (QUEUE_COLUMNS[0] ?? 0) + (QUEUE_COLUMNS[1] ?? 0) + (QUEUE_COLUMNS[2] ?? 0) }}>
            {fixed ? FIXED_TITLE : SELECTION_TITLE}
          </span>
          <span role="columnheader" className="box-border px-2 text-right" style={{ width: QUEUE_COLUMNS[3] }}>
            Amount
          </span>
          <span role="columnheader" className="box-border px-2" style={{ width: QUEUE_COLUMNS[4] }}>
            PO
          </span>
          <span role="columnheader" className="box-border px-2" style={{ width: QUEUE_COLUMNS[5] }}>
            Selection
          </span>
        </div>
        {INVOICE_CASES.map((row, index) => (
          <div
            key={row.invoice}
            role="row"
            data-invoice={row.invoice}
            className="box-border flex items-center border-b last:border-b-0"
            style={at(within(QUEUE, queueRow(index)))}
          >
            <span role="cell" aria-hidden="true" className="flex items-center justify-center" style={{ width: QUEUE_COLUMNS[0] }}>
              {fixed ? <Lock className="size-3 text-foreground" strokeWidth={1.75} /> : <span className="size-3 rounded-sm border border-foreground" />}
            </span>
            <span role="cell" className="type-data box-border truncate px-2" style={{ width: QUEUE_COLUMNS[1] }}>
              {row.invoice}
            </span>
            <span role="cell" className="type-body box-border truncate px-2" style={{ width: QUEUE_COLUMNS[2] }}>
              {row.supplier}
            </span>
            <span role="cell" className="type-data box-border truncate px-2 text-right tabular-nums" style={{ width: QUEUE_COLUMNS[3] }}>
              {formatCents(row.amountCents)}
            </span>
            <span role="cell" className="type-data box-border truncate px-2" style={{ width: QUEUE_COLUMNS[4] }}>
              {row.po ?? '\u2014'}
            </span>
            <span role="cell" className="type-micro box-border truncate px-2 text-muted-foreground" style={{ width: QUEUE_COLUMNS[5] }}>
              {fixed ? 'Fixed' : 'Proposed'}
            </span>
          </div>
        ))}
      </Frame>

      <Frame as="section" anchor="job-preflight" rect={PREFLIGHT} aria-labelledby="job-preflight-title">
        <h2 id="job-preflight-title" className="type-card m-0 flex items-center px-3" style={at({ x: 0, y: 0, width: PREFLIGHT.width, height: 40 })}>
          Preflight
        </h2>
        <PreflightRow index={0} label="Version" value={JOB_VERSION_LABEL} detail={`${state.agent.releaseApproved ? 'Released' : 'Release approval pending'} \u00b7 Stage 3 Supervised Assist`} />
        <PreflightRow index={1} label="Scope" value={SCOPE.team} detail={SCOPE.queue} />
        <PreflightRow index={2} label="Permitted applications" value={SCOPE.applications.join(', ')} detail="No other application is in scope." />
        <PreflightRow index={3} label="Policy" value="Invoice approval threshold 2.00%" detail="Above it: Tier 3 approval by a person" />
        <PreflightRow
          index={4}
          label="Population"
          value={POPULATION_LABEL}
          detail={fixed ? 'Frozen: no case can be added or removed.' : 'Proposed: not frozen until confirmed.'}
        />
        <PreflightRow
          index={5}
          label="Authority"
          value={started ? `start-job used by ${actor}` : authority ? 'Start blocked' : `start-job \u00b7 ${actor}`}
          detail={authority && !started ? authority : NO_POSTING}
          title={authority && !started ? authority : undefined}
        />
      </Frame>

      <Button
        variant="outline"
        {...anchored('confirm-selection', CONFIRM_SELECTION)}
        className={flat}
        disabled={selectionReason !== null}
        disabledReason={selectionReason ?? undefined}
        onClick={() => act(props, { type: 'CONFIRM_SELECTION' })}
      >
        {fixed ? 'Selection confirmed' : `Confirm ${INVOICE_CASES.length} invoices`}
      </Button>
      <p
        role="status"
        data-notice={started ? 'started' : state.ui.job.startCancelled ? 'cancelled' : authority ? 'blocked' : 'none'}
        className="type-micro m-0 flex items-center overflow-hidden text-muted-foreground"
        style={{ ...at({ ...JOBS_NOTICE, width: started ? 540 : JOBS_NOTICE.width }), display: notice ? undefined : 'none' }}
      >
        {notice}
      </p>
      {started && (
        <Button variant="outline" className={flat} style={at({ x: 1032, y: 616, width: 216, height: 32 })} onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC22' })}>
          Open job progress
        </Button>
      )}

      <FocusOnOpen open={open} interactive={interactive} anchor="cancel-job-start" />
      <div
        data-layer="job-scope-dialog"
        aria-hidden={open ? undefined : true}
        className="bg-black/80"
        style={{ ...at({ x: 0, y: 0, width: CANVAS.width, height: CANVAS.height }), zIndex: 40, display: open ? undefined : 'none', opacity: fade }}
        onClick={(event) => {
          if (event.target === event.currentTarget) act(props, { type: 'CANCEL_JOB_START' })
        }}
      >
        <Frame
          anchor="job-scope-dialog"
          visible={open}
          rect={SCOPE_DIALOG}
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-scope-title"
          className="shadow-lg"
          style={{ zIndex: 50 }}
          onKeyDown={onDialogKey}
        >
          <h2 id="job-scope-title" className="type-section m-0" style={at(SCOPE_DIALOG_PARTS.title)}>
            Confirm job scope
          </h2>
          <div className="type-data" style={at(SCOPE_DIALOG_PARTS.lines)}>
            <p className="m-0 flex h-8 items-center">{`${JOB_ID} \u00b7 ${JOB_VERSION_LABEL}`}</p>
            <p className="m-0 flex h-8 items-center">{`${JOB_TEAM_LABEL} \u00b7 ${POPULATION_LABEL}`}</p>
            <p className="m-0 flex h-8 items-center">Selection fixed: no case can be added or removed.</p>
            <p className="m-0 flex h-8 items-center">Release: Stage 3 Supervised Assist</p>
          </div>
          <div style={at(SCOPE_DIALOG_PARTS.applications)}>
            <p className="type-micro m-0 mb-1 text-muted-foreground">Permitted applications</p>
            <div className="flex gap-2">
              {SCOPE.applications.map((app) => (
                <span key={app} className={chip}>
                  {app}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-hidden" style={at(SCOPE_DIALOG_PARTS.policy)}>
            <p className="type-micro m-0 text-muted-foreground">Policy</p>
            <p className="type-micro m-0">{`${POLICY_TEXT} ${NO_POSTING}`}</p>
          </div>
          <Button variant="outline" className={cn(flat)} {...anchored('cancel-job-start', SCOPE_DIALOG_PARTS.cancel, open)} onClick={() => act(props, { type: 'CANCEL_JOB_START' })}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className={cn(flat)}
            {...anchored('start-job', SCOPE_DIALOG_PARTS.start, open)}
            disabled={startReason !== null}
            disabledReason={startReason ?? undefined}
            onClick={() => act(props, { type: 'RELEASE_AND_START' })}
          >
            Start job
          </Button>
        </Frame>
      </div>
    </>
  )
}
