import { StatusGlyph } from '@/components/domain/status-glyphs'
import { Button } from '@/components/ui/button'
import { Hatch } from '@/components/ui/hatch'
import { APPROVER_NAME, APPROVAL_AFTER, APPROVAL_INVOICE, APPROVAL_PENDING_VERIFICATION, COUNTS_INITIAL, UNKNOWN_FACTS, UNKNOWN_INVOICE, jobCounts as snapshotCounts } from '@/data/approval'
import type { JobCounts } from '@/data/approval'
import { JOB_ID } from '@/data/invoices'
import { STATUS_META } from '@/data/status'
import type { StatusId } from '@/data/status'
import { sampleMotion } from '@/film'
import type { JobFilter, State } from '@/state'
import { cn } from '@/lib/utils'
import { act } from './contract'
import type { FilmContext, ProductProps } from './contract'
import { anchored, at } from './geometry'
import { JOB_SUMMARY, JOB_SUMMARY_ANCHORS, OPEN_CASES, SUMMARY_META, SUMMARY_READBACK, SUMMARY_SNAPSHOT, SUMMARY_STATUS, summaryCard } from './job-layout'
import { JOB_TEAM_LABEL, JOB_VERSION_LABEL, POPULATION_LABEL, SNAPSHOT_AFTER, SNAPSHOT_BEFORE, SNAPSHOT_CURRENT, historicalSnapshot, jobAccess, jobLabel, jobSettled, snapshotLabel, summaryCards } from './job'
import type { SummaryCardView } from './job'
import { HiddenAnchors } from './settings-frame'

/**
 * SC25 job outcome summary. Rendered inside the shell, in canvas coordinates from `job-layout.ts`.
 * A pure function of `{ state, film }`: the four counts come from the case outcomes (`summaryCards`), so an approval
 * alone never moves a verified count; only the independent readback does (7/2/1/1 before, 8/2/0/1 after, both
 * sum to 11). The unknown card never changes. The job is `Partially Complete`, never fully complete, and no glyph
 * of the job itself is a success mark. Nothing here is cyan: execution has stopped.
 *
 * In a film the readback (or the switch between the current and the earlier snapshot) replaces the whole snapshot,
 * label and cards, in one 150 ms opacity swap: no count-up and no intermediate number. The cards are buttons:
 * three filter SC22 by outcome, the unknown card opens SC24.
 */

const flat = 'transition-none'
const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const EARLIER_SNAPSHOT = `Earlier snapshot \u00b7 ${APPROVAL_INVOICE.invoice} has since been independently verified`

const GLYPH_TONE: Readonly<Record<SummaryCardView['category'], string>> = {
  verified: 'text-success',
  escalated: 'text-warning',
  approval: 'text-warning',
  unknown: 'text-signal',
}

const ANCHOR_OF: Readonly<Record<SummaryCardView['category'], string>> = {
  verified: 'summary-verified',
  escalated: 'summary-escalated',
  approval: 'summary-approval',
  unknown: 'summary-unknown',
}

const GLYPH_STATUS: Readonly<Record<SummaryCardView['category'], StatusId>> = { verified: 'verified', escalated: 'escalated', approval: 'approval', unknown: 'unknown' }

/** `7 + 2 + 1 + 1 = 11`: both snapshots show their own sum. */
const equation = (counts: JobCounts): string => `${counts.verified} + ${counts.escalated} + ${counts.approval} + ${counts.unknown} = ${counts.verified + counts.escalated + counts.approval + counts.unknown}`

/** The first line of the readback strip: what is known about the approval case, never more than the reducer has. */
function readbackLine(state: State): string {
  const invoice = APPROVAL_INVOICE.invoice
  const { readback, approval } = state
  if (readback.status === 'verified') return `${invoice} independently read back: ${APPROVAL_AFTER}`
  if (readback.status === 'mismatch') return `${invoice} readback did not match \u00b7 remains ${STATUS_META.approval.label} \u00b7 counts unchanged`
  if (approval.decision === 'approved') return `${invoice} approved by ${APPROVER_NAME} \u00b7 ${APPROVAL_PENDING_VERIFICATION} \u00b7 counts unchanged until independent readback`
  if (approval.decision === 'rejected') return `${invoice} rejected by ${APPROVER_NAME} \u00b7 remains ${STATUS_META.approval.label} \u00b7 counts unchanged`
  if (approval.decision === 'changesRequested') return `${invoice} changes requested by ${APPROVER_NAME} \u00b7 remains ${STATUS_META.approval.label} \u00b7 counts unchanged`
  return `No approval decision recorded \u00b7 ${invoice} remains ${STATUS_META.approval.label}`
}

/**
 * Opacity of the snapshot (label and cards): 0 to 1 over 150 ms from the later of the readback and the snapshot switch; 1 outside a film.
 * The stored preapproval snapshot is an entry, not a replacement, so it is fully visible on its first frame.
 */
function swapOpacity(film: FilmContext | undefined, historical: boolean): number {
  if (!film || historical) return 1
  const landed = [film.lastApplied('VERIFY_READBACK'), film.lastApplied('SET_JOB_VIEW')].filter((frame): frame is number => frame !== null)
  if (landed.length === 0) return 1
  return sampleMotion(Math.max(...landed), 4.5, 'product')(film).progress
}

const heldLine = `${UNKNOWN_INVOICE.invoice} remains ${STATUS_META.unknown.label} \u00b7 ${UNKNOWN_FACTS.hold} \u00b7 ${UNKNOWN_FACTS.custody}`

export function JobSummaryScreen(props: ProductProps) {
  const { state } = props
  const access = jobAccess(state)
  const unavailable = !access.ok ? `Not available: ${access.reason}` : !jobSettled(state) ? `${JOB_ID} has no outcome summary until its cases are evaluated.` : null

  if (unavailable) {
    return (
      <>
        <h1 className="type-title m-0" style={at(SUMMARY_STATUS)}>
          Job summary
        </h1>
        <p role="status" className="type-body m-0 rounded-lg border bg-surface-2 p-4" data-view="denied" style={at({ x: 264, y: 176, width: 992, height: 88 })}>
          {unavailable}
        </p>
        <HiddenAnchors names={JOB_SUMMARY_ANCHORS} />
      </>
    )
  }

  const cards = summaryCards(state)
  const opacity = swapOpacity(props.film, historicalSnapshot(state))
  const swap = opacity < 1 ? { opacity } : {}
  const verified = state.readback.status === 'verified'

  const open = (filter: JobFilter, screen: 'SC22' | 'SC24') => {
    act(props, { type: 'SET_JOB_FILTER', filter })
    if (screen === 'SC24') act(props, { type: 'SELECT_CASE', caseId: UNKNOWN_INVOICE.invoice })
    act(props, { type: 'OPEN_SCREEN', screen })
  }

  return (
    <>
      <div {...anchored('job-summary', JOB_SUMMARY)} aria-hidden="true" style={{ ...at(JOB_SUMMARY), pointerEvents: 'none' }} />
      <h1 {...anchored('summary-status', SUMMARY_STATUS)} className="type-section m-0 flex items-center overflow-hidden whitespace-nowrap">
        {jobLabel(state)}
      </h1>
      <p {...anchored('summary-snapshot', SUMMARY_SNAPSHOT)} style={{ ...at(SUMMARY_SNAPSHOT), ...swap }} className="m-0 flex items-center gap-2 overflow-hidden whitespace-nowrap" aria-live="polite">
        <span className="type-data">{snapshotLabel(state)}</span> <span className="type-micro truncate text-muted-foreground">{historicalSnapshot(state) ? EARLIER_SNAPSHOT : SNAPSHOT_CURRENT}</span>
      </p>

      {cards.map((card, index) => {
        const unknown = card.category === 'unknown'
        return (
          <button
            key={card.category}
            type="button"
            {...anchored(ANCHOR_OF[card.category], summaryCard(index))}
            style={{ ...at(summaryCard(index)), ...swap }}
            className={cn('box-border flex flex-col items-start overflow-hidden rounded-lg bg-surface text-left hover:bg-surface-2', unknown ? 'border-2 border-foreground p-[14px]' : 'border p-[15px]', flat, focusRing)}
            onClick={() => (unknown ? open('unknown', 'SC24') : open(card.category, 'SC22'))}
          >
            <span className="block font-sans text-[28px] font-bold leading-[34px] tabular-nums">{card.count}</span>{' '}
            <span className="mt-2 flex items-center gap-2 type-data">
              <span className={GLYPH_TONE[card.category]}>
                <StatusGlyph status={GLYPH_STATUS[card.category]} />
              </span>
              <span>{card.label}</span>
            </span>
            {unknown && <Hatch className="mt-auto block h-12 w-full border border-foreground" />}
          </button>
        )
      })}

      <Button variant="outline" {...anchored('open-cases', OPEN_CASES)} className={flat} onClick={() => open('all', 'SC22')}>
        View all cases
      </Button>

      <section {...anchored('summary-readback', SUMMARY_READBACK)} aria-label="Approval readback" aria-live="polite" className="box-border flex flex-col justify-center gap-1 overflow-hidden rounded-lg border bg-surface-2 px-4">
        <p className="type-data m-0 truncate" data-readback={state.readback.status}>
          {readbackLine(state)}
        </p>
        <p className="type-data m-0 flex items-center gap-2 truncate text-muted-foreground">
          <StatusGlyph status="unknown" />
          <span>{heldLine}</span>
        </p>
      </section>

      <div style={at(SUMMARY_META)} className="box-border flex flex-col justify-center gap-1 overflow-hidden">
        <p className="type-data m-0 truncate">{`${JOB_ID} \u00b7 ${POPULATION_LABEL} \u00b7 ${JOB_VERSION_LABEL} \u00b7 ${JOB_TEAM_LABEL}`}</p>
        <p className="type-micro m-0 truncate text-muted-foreground">
          {verified
            ? `${SNAPSHOT_BEFORE}: ${equation(COUNTS_INITIAL)} \u00b7 ${SNAPSHOT_AFTER}: ${equation(snapshotCounts('approved', true))}`
            : `${SNAPSHOT_BEFORE}: ${equation(COUNTS_INITIAL)} \u00b7 the preapproval classification stays until the independent readback`}
        </p>
      </div>
    </>
  )
}
