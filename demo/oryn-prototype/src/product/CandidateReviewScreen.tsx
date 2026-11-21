import { Check, CircleDashed, FileText, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { supplierName } from '@/data/people'
import { CANDIDATE, PLAYBOOK_RULES, PLAYBOOK_STEPS } from '@/data/playbook'
import { person } from '@/state'
import { cn } from '@/lib/utils'
import { act } from './contract'
import type { ProductProps } from './contract'
import {
  APPROVE_CONTRIBUTION,
  CANDIDATE_ANCHORS,
  CANDIDATE_TITLE,
  CARD,
  CARDS_COLUMN,
  CARDS_LABEL,
  CONFIDENCE_BADGE,
  DEMONSTRATION_COUNT,
  EVIDENCE_RAIL,
  OWNER_REVIEW_STATUS,
  RAIL,
  REQUEST_REVIEW,
  STEPS,
  STEPS_PANEL,
  SUGGESTED_BADGE,
  UNCERTAINTY,
  demoCard,
} from './candidate-layout'
import { approveBlock, contributorName, discoveryAccess, isApproved, ownPending, requestBlock } from './discovery'
import { EvidenceDrawer } from './EvidenceDrawer'
import { DENIED_STATE } from './discovery-layout'
import { anchored, at } from './geometry'
import { Frame, HiddenAnchors } from './settings-frame'

/**
 * SC14 candidate review. Rendered inside the shell, in canvas coordinates from
 * `candidate-layout.ts`, with the evidence drawer layered over it. The candidate is a suggestion
 * from three demonstrations: its confidence is a category, never a number, and the variance
 * exception stays unverified until an SME reviews it. Contributor approval and the request for
 * owner review are separate actions; neither publishes anything. A pure function of
 * `{ state, film }`.
 */

const CONFIDENCE = 'Confidence: Medium'
const UNVERIFIED = 'Variance exception rule: unverified until SME review'
const SENTENCE = 'variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept'
const FOOTNOTE = 'Sanitized derivatives only. Inspecting evidence does not approve, publish or verify anything.'

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const flat = 'transition-none'
const rule009 = PLAYBOOK_RULES[0]

export function CandidateReviewScreen(props: ProductProps) {
  const { state } = props
  const access = discoveryAccess(state)

  if (!access.ok) {
    return (
      <>
        <h1 className="type-card m-0" style={at(CANDIDATE_TITLE)}>
          Candidate review
        </h1>
        <p role="status" className="type-body m-0 rounded-lg border bg-surface-2 p-4" data-view="denied" style={at(DENIED_STATE)}>
          Not available: {access.reason}
        </p>
        <HiddenAnchors names={CANDIDATE_ANCHORS.filter((name) => name !== 'rule-drawer' && name !== 'drawer-close')} />
        <EvidenceDrawer {...props} />
      </>
    )
  }

  const { demonstration } = state.ui.discovery
  const pending = ownPending(state)
  const approvalBlock = approveBlock(state)
  const reviewBlock = requestBlock(state)
  const requestedBy = state.ownerReviewRequestedBy
  const reviewStatus = requestedBy === null ? 'Not requested' : `Requested by ${person(requestedBy).name}`

  return (
    <>
      <h1 className="type-card m-0 overflow-hidden" {...anchored('candidate-title', CANDIDATE_TITLE)}>
        {CANDIDATE.title}
      </h1>
      <span className="flex items-center rounded-sm bg-surface-2 px-2 type-data" style={at(SUGGESTED_BADGE)}>
        Suggested
      </span>
      <p className="type-data m-0 text-muted-foreground" style={at(DEMONSTRATION_COUNT)}>
        {`${DEMONSTRATIONS.length} demonstrations`}
      </p>
      <p className="m-0 flex items-center rounded-sm border px-2 type-data" {...anchored('candidate-confidence', CONFIDENCE_BADGE)}>
        {CONFIDENCE}
      </p>
      <p className="type-data m-0 flex items-center gap-2" {...anchored('candidate-uncertainty', UNCERTAINTY)}>
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-warning" strokeWidth={1.75} />
        {UNVERIFIED}
      </p>

      <p className="type-micro m-0 text-muted-foreground" style={at(CARDS_LABEL)}>
        Demonstrations
      </p>
      <div aria-hidden="true" {...anchored('demonstration-cards', CARDS_COLUMN)} />
      <ul aria-label="Demonstrations" className="m-0 list-none p-0" style={{ display: 'contents' }}>
        {DEMONSTRATIONS.map((demo, index) => {
          const approved = isApproved(state, demo.id)
          const selected = demonstration === demo.id
          return (
            <li key={demo.id} style={{ display: 'contents' }}>
              <button
                type="button"
                {...anchored(`demo-card-${demo.id.toLowerCase()}`, demoCard(index))}
                aria-pressed={selected}
                className={cn('box-border rounded-lg border bg-surface text-left hover:bg-surface-2', flat, focusRing, selected && 'ring-2 ring-foreground')}
                onClick={() => act(props, { type: 'SELECT_DEMONSTRATION', demoId: demo.id })}
              >
                <span className="type-data block" style={at(CARD.id)}>{`${demo.id} · ${contributorName(demo)}`}</span>
                <span className="type-data block text-muted-foreground" style={at(CARD.time)}>{demo.time}</span>
                <span className="type-data block" style={at(CARD.invoice)}>{demo.invoice}</span>
                <span className="type-body block" style={at(CARD.supplier)}>{supplierName(demo.supplierId)}</span>
                <span className="type-micro flex items-center gap-1 text-muted-foreground" style={at(CARD.status)}>
                  {approved ? <Check aria-hidden="true" className="size-3 shrink-0" strokeWidth={1.75} /> : <CircleDashed aria-hidden="true" className="size-3 shrink-0" strokeWidth={1.75} />}
                  {approved ? 'Contribution approved' : 'Awaiting contributor approval'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <Frame as="section" anchor="proposed-steps" rect={STEPS_PANEL} aria-labelledby="candidate-steps-title">
        <h2 id="candidate-steps-title" className="type-card m-0" style={at(STEPS.heading)}>
          Proposed steps
        </h2>
        <ol className="m-0 list-none p-0">
          {PLAYBOOK_STEPS.map((step, index) => (
            <li key={step.id} style={at({ ...STEPS.firstRow, y: STEPS.firstRow.y + index * STEPS.rowStep })}>
              <span className="type-data block text-muted-foreground">{step.id}</span>
              <span className="type-body block">{step.title}</span>
            </li>
          ))}
        </ol>
      </Frame>

      <Frame as="section" anchor="candidate-evidence" rect={EVIDENCE_RAIL} aria-labelledby="candidate-evidence-title">
        <h2 id="candidate-evidence-title" className="type-section m-0" style={at(RAIL.heading)}>
          Evidence
        </h2>
        <p className="type-body m-0 text-muted-foreground" style={at(RAIL.note)}>
          Authorized sanitized derivatives of the three contributions. Raw local evidence is not shown.
        </p>
        <p className="type-micro m-0 text-muted-foreground" style={at(RAIL.sourcesLabel)}>
          Sanitized sources
        </p>
        {DEMONSTRATIONS.map((demo, index) => (
          <button
            key={demo.id}
            type="button"
            {...anchored(`evidence-link-${demo.id.toLowerCase()}`, RAIL.source(index))}
            className={cn('flex items-center gap-2 rounded-md border bg-surface px-2 text-left type-data hover:bg-surface-2', flat, focusRing)}
            onClick={() => {
              act(props, { type: 'SELECT_DEMONSTRATION', demoId: demo.id })
              act(props, { type: 'OPEN_DRAWER', drawer: 'evidence' })
            }}
          >
            <FileText aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
            {`${demo.id} · sanitized source`}
          </button>
        ))}
        <div aria-hidden="true" className="bg-border" style={at(RAIL.divider)} />
        <p className="type-micro m-0 text-muted-foreground" style={at(RAIL.ruleLabel)}>
          Governing rule
        </p>
        <button
          type="button"
          {...anchored('rule-link', RAIL.rule)}
          className={cn('rounded-md border bg-surface px-2 py-1 text-left hover:bg-surface-2', flat, focusRing)}
          onClick={() => act(props, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' })}
        >
          <span className="type-body block font-medium">{`${rule009.id} ${rule009.title}`}</span>
          <span className="type-data block text-muted-foreground">{SENTENCE}</span>
        </button>
        <p className="type-micro m-0 text-muted-foreground" style={at(RAIL.footnote)}>
          {FOOTNOTE}
        </p>
      </Frame>

      <Button
        variant="outline"
        {...anchored('approve-contribution', APPROVE_CONTRIBUTION)}
        className={flat}
        disabled={approvalBlock !== null}
        disabledReason={approvalBlock ?? undefined}
        onClick={() => pending.forEach((demo) => act(props, { type: 'APPROVE_DEMONSTRATION', demoId: demo.id }))}
      >
        Approve contribution
      </Button>
      <Button
        variant="primary"
        {...anchored('request-review', REQUEST_REVIEW)}
        className={flat}
        disabled={reviewBlock !== null}
        disabledReason={reviewBlock ?? undefined}
        onClick={() => act(props, { type: 'REQUEST_OWNER_REVIEW' })}
      >
        Request owner review
      </Button>
      <div {...anchored('owner-review-status', OWNER_REVIEW_STATUS)} role="status">
        <p className="type-data m-0">{`Owner review: ${reviewStatus}`}</p>
        <p className="type-micro m-0 overflow-hidden text-muted-foreground" style={{ height: 32, display: reviewBlock === null || requestedBy !== null ? 'none' : undefined }}>
          {reviewBlock}
        </p>
      </div>

      <EvidenceDrawer {...props} />
    </>
  )
}
