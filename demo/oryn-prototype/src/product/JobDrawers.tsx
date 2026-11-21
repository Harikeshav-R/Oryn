import { ExternalLink, FileText, Info } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { StatusBadge } from '@/components/domain/status-badge'
import { StatusGlyph } from '@/components/domain/status-glyphs'
import { Button } from '@/components/ui/button'
import { Hatch } from '@/components/ui/hatch'
import { APPROVAL_AFTER, APPROVAL_BEFORE, APPROVAL_INVOICE, APPROVAL_PENDING_VERIFICATION, APPROVAL_PO_CENTS, APPROVAL_RULE, APPROVER_AUTHORITY, UNKNOWN_FACTS, UNKNOWN_INVOICE, varianceDisplay } from '@/data/approval'
import { formatCents } from '@/data/invoices'
import { approvalBlock, person } from '@/state'
import type { State } from '@/state'
import type { Rect } from '@/film'
import { DRAWER, DRAWER_PARTS } from './candidate-layout'
import { CANVAS, act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { trapTab } from './focus-trap'
import { anchored, at, within } from './geometry'
import { JOB_TEAM_LABEL, decisionBlock, jobAccess } from './job'
import { APPROVAL_BUTTONS, APPROVAL_PARTS, UNKNOWN_BUTTONS, UNKNOWN_PARTS } from './job-layout'
import { Frame, HiddenAnchors } from './settings-frame'

/**
 * The two right drawers over the SC22 case table: SC23 approval (route SC23) and SC24 unknown outcome (route SC24).
 * `[800,0,480,720]` over a z40 scrim, a 64 px sticky footer. Viewing decides nothing: the approval drawer changes the
 * record only through its own `Approve`, `Reject` or `Request Changes`, and a decision never stands in for the
 * independent readback, which is shown as its own state. The unknown drawer has no decision and no resubmission at
 * all: `Resubmit unavailable` is a status, not a control. In the clickable app focus moves to Close when a drawer
 * opens, Tab cycles inside it, Escape and the scrim return to SC22, and focus returns to the opener; in a film there is
 * no focus handling and the 150 ms entry is an opacity ramp, so an anchored rectangle never moves. Every anchor is
 * always rendered; the drawer that is not showing renders them hidden (`display: none`).
 */

const APPROVAL_ANCHORS = ['approval-drawer', 'approval-diff', 'approval-authority', 'approval-evidence', 'approve', 'reject', 'request-changes', 'readback', 'approval-close'] as const
const UNKNOWN_ANCHORS = ['unknown-case', 'unknown-hold', 'resubmit-unavailable', 'unknown-evidence', 'investigate', 'unknown-close'] as const

const card = 'box-border overflow-hidden rounded-lg border bg-surface'
/** The long single lines are 11 px mono with no tracking, so none can outgrow its 432 px column. */
const NO_TRACKING: CSSProperties = { letterSpacing: 0 }
const clamp = (lines: number): CSSProperties => ({ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden' })

const SOURCES = [
  { id: 'invoice', label: 'Invoice INV-48219 document', icon: FileText, detail: formatCents(APPROVAL_INVOICE.amountCents) },
  { id: 'netsuite', label: 'NetSuite bill and PO-1042', icon: ExternalLink, detail: `PO ${formatCents(APPROVAL_PO_CENTS)}` },
  { id: 'rule', label: APPROVAL_RULE, icon: FileText, detail: 'Above 2.00%' },
] as const

/** What the case record says now, kept apart from the readback card: a decision and its independent verification are two facts. */
function decidedText(state: State): string {
  const { decision, by } = state.approval
  const who = by === null ? 'Daniel Okafor' : person(by).name
  if (decision === 'approved') return state.readback.status === 'pending' ? `Approved by ${who} \u00b7 awaiting independent verification` : `Approved by ${who}`
  if (decision === 'rejected') return `Rejected by ${who}`
  if (decision === 'changesRequested') return `Changes requested by ${who}`
  return 'Pending Tier 3 approval'
}

function Readback({ state }: { readonly state: State }) {
  const { status } = state.readback
  return (
    <div className="flex h-full items-center gap-2 px-3">
      {status === 'verified' ? (
        <>
          <div className="type-micro min-w-0 flex-1" style={NO_TRACKING}>
            <div>Independent NetSuite readback:</div>
            <div>{APPROVAL_AFTER}</div>
          </div>
          <StatusBadge status="verified" />
        </>
      ) : status === 'pending' ? (
        <div className="min-w-0 flex-1">
          <div className="type-data">{APPROVAL_PENDING_VERIFICATION}</div>
          <div className="type-micro text-muted-foreground" style={NO_TRACKING}>
            Independent NetSuite readback not yet received
          </div>
        </div>
      ) : status === 'mismatch' ? (
        <div className="type-data min-w-0 flex-1">{'Readback mismatch \u00b7 not verified'}</div>
      ) : (
        <div className="type-data min-w-0 flex-1">Independent readback: not requested</div>
      )}
    </div>
  )
}

function SourceCard({ source, fade }: { readonly source: (typeof SOURCES)[number]; readonly fade: number }) {
  const Icon = source.icon
  return (
    <div className={`${card} flex flex-col`} style={{ width: 128, height: 100, opacity: fade }}>
      <div className="flex items-center justify-center border-b bg-muted text-muted-foreground" style={{ height: 40 }}>
        <Icon size={16} aria-hidden="true" />
      </div>
      <div className="type-micro px-2 pt-1" style={{ ...NO_TRACKING, ...clamp(2) }}>
        {source.label}
      </div>
      <div className="type-micro px-2 text-muted-foreground" style={{ ...NO_TRACKING, ...clamp(1) }}>
        {source.detail}
      </div>
    </div>
  )
}

function ApprovalBody(props: ProductProps) {
  const { state, film } = props
  const expanded = state.ui.job.evidence
  const authorityReason = approvalBlock(state)
  const fade = expanded ? motionProgress(film, 'SET_JOB_VIEW') : 1
  const toggleEvidence = () => act(props, { type: 'SET_JOB_VIEW', evidence: !expanded })
  /** The invoice document and the NetSuite bill open their own source in the work application; the rule expands or collapses the evidence. */
  const openSource = (id: (typeof SOURCES)[number]['id']) => {
    if (id === 'invoice') {
      act(props, { type: 'OPEN_MESSAGE', record: 'INV-48219' })
      act(props, { type: 'OPEN_ATTACHMENT' })
      act(props, { type: 'OPEN_SCREEN', screen: 'SC05' })
    } else if (id === 'netsuite') {
      act(props, { type: 'OPEN_BILL', record: 'INV-48219' })
      act(props, { type: 'OPEN_SCREEN', screen: 'SC06' })
    } else toggleEvidence()
  }
  return (
    <>
      <div className="type-micro truncate" style={{ ...at(APPROVAL_PARTS.record), ...NO_TRACKING }}>
        {decidedText(state)}
      </div>
      <div className={`${card} px-3 py-2`} style={at(APPROVAL_PARTS.invoice)}>
        <div className="type-card">{`Invoice ${formatCents(APPROVAL_INVOICE.amountCents)}`}</div>
        <div className="type-micro text-muted-foreground" style={NO_TRACKING}>
          {APPROVAL_INVOICE.supplier}
        </div>
      </div>
      <div className={`${card} px-3 py-2`} style={at(APPROVAL_PARTS.po)}>
        <div className="type-card">{`${APPROVAL_INVOICE.po ?? ''} ${formatCents(APPROVAL_PO_CENTS)}`}</div>
        <div className="type-micro text-muted-foreground" style={NO_TRACKING}>
          Purchase order
        </div>
      </div>
      <div className="type-data flex items-center gap-2" style={at(APPROVAL_PARTS.variance)}>
        <span className="text-warning">
          <StatusGlyph status="approval" />
        </span>
        <span>{`Variance ${varianceDisplay()}`}</span>
      </div>
      <div {...anchored('approval-diff', APPROVAL_PARTS.diff)} className={`${card} relative`}>
        <div className="absolute inset-y-0 left-0 px-3 pt-3" style={{ width: 215 }}>
          <div className="type-data" style={{ minHeight: 36 }}>{`Before: ${APPROVAL_BEFORE}`}</div>
          <div className="type-micro mt-1 text-muted-foreground" style={NO_TRACKING}>
            Held for Tier 3 decision
          </div>
        </div>
        <div aria-hidden="true" className="absolute inset-y-0 bg-border" style={{ left: 215, width: 1, bottom: 28 }} />
        <div className="absolute px-3 pt-3" style={{ left: 216, top: 0, width: 214, bottom: 28 }}>
          <div className="type-data" style={{ minHeight: 36 }}>{`After: ${APPROVAL_AFTER}`}</div>
          <div className="type-micro mt-1 text-muted-foreground" style={NO_TRACKING}>
            Not posted until verified
          </div>
        </div>
        <div className="type-micro absolute inset-x-0 bottom-0 flex items-center border-t px-3 text-muted-foreground" style={{ ...NO_TRACKING, height: 28 }}>
          Viewing this comparison changes nothing.
        </div>
      </div>
      <div {...anchored('approval-authority', APPROVAL_PARTS.authority)} className={`${card} px-3 py-2`}>
        <div className="type-data">{APPROVER_AUTHORITY}</div>
        <div className="type-micro mt-1" style={{ ...NO_TRACKING, ...clamp(3) }}>
          {authorityReason === null ? `Authority confirmed \u00b7 scoped to ${APPROVAL_INVOICE.invoice}, ${JOB_TEAM_LABEL}, 2.00%` : authorityReason}
        </div>
      </div>
      <div {...anchored('approval-evidence', APPROVAL_PARTS.evidence)} className={card}>
        <div className="type-data px-3 text-muted-foreground" style={{ height: 28, lineHeight: '28px' }} onClick={toggleEvidence}>
          Evidence
        </div>
        {expanded ? (
          <div className="flex gap-3 px-3">
            {SOURCES.map((source) => (
              <button key={source.id} type="button" aria-expanded="true" aria-label={source.label} className="rounded-lg p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openSource(source.id)}>
                <SourceCard source={source} fade={fade} />
              </button>
            ))}
          </div>
        ) : (
          SOURCES.map((source) => {
            const Icon = source.icon
            return (
              <button key={source.id} type="button" aria-expanded="false" className="type-data flex w-full items-center gap-2 px-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" style={{ height: 28 }} onClick={() => openSource(source.id)}>
                <Icon size={16} aria-hidden="true" />
                <span>{source.label}</span>
              </button>
            )
          })
        )}
      </div>
      <div {...anchored('readback', APPROVAL_PARTS.readback)} className={card}>
        <Readback state={state} />
      </div>
    </>
  )
}

/** The facts the drawer states about the held case; the outcome comes from the case record, never from a button. */
function UnknownBody(props: ProductProps) {
  const { state, film } = props
  const openedAt = film?.lastApplied('OPEN_SCREEN')
  const connector = !film || film.reducedMotion || openedAt == null ? 1 : Math.min(1, Math.max(0, (film.frame - openedAt) / 15))
  const { tip, investigating } = state.ui.job
  const unknown = state.job.outcomes[UNKNOWN_INVOICE.invoice] === 'unknown'
  const facts: readonly (readonly [string, string])[] = [
    ['Invoice', UNKNOWN_INVOICE.invoice],
    ['Supplier', UNKNOWN_INVOICE.supplier],
    ['Amount', formatCents(UNKNOWN_INVOICE.amountCents)],
    ['PO', UNKNOWN_INVOICE.po ?? '\u2014'],
  ]
  return (
    <>
      <dl className={`${card} m-0 grid grid-cols-2 gap-x-4 gap-y-1 px-3 py-2`} style={at(UNKNOWN_PARTS.facts)}>
        {facts.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="type-micro text-muted-foreground">{label}</dt>
            <dd className="type-data m-0 truncate">{value}</dd>
          </div>
        ))}
      </dl>
      <div {...anchored('unknown-hold', UNKNOWN_PARTS.hold)} className={`${card} relative`}>
        {unknown ? (
          <>
            <div className="absolute border" style={at(UNKNOWN_PARTS.holdHatch)}>
              <Hatch variant="neutral" className="size-full" />
            </div>
            <div className="absolute flex flex-col gap-1" style={at(UNKNOWN_PARTS.holdLabels)}>
              <div>
                <StatusBadge status="unknown" />
              </div>
              <div className="type-body">{UNKNOWN_FACTS.cause}</div>
              <div className="flex items-center gap-2">
                <StatusBadge status="held" />
                <span className="type-data">{UNKNOWN_FACTS.reconciliation}</span>
              </div>
              <div className="type-data text-muted-foreground">{UNKNOWN_FACTS.custody}</div>
            </div>
          </>
        ) : (
          <div className="type-data px-4 py-3">Not evaluated yet</div>
        )}
      </div>
      <div className="px-3" style={at(UNKNOWN_PARTS.guidance)}>
        <div className="type-card">{UNKNOWN_FACTS.guidance}</div>
        <div className="type-data text-muted-foreground">{UNKNOWN_FACTS.rule}</div>
      </div>
      <div {...anchored('resubmit-unavailable', UNKNOWN_PARTS.unavailable)} className="flex items-center gap-1">
        <button
          type="button"
          aria-label="About resubmission"
          aria-expanded={tip}
          className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => act(props, { type: 'SET_JOB_VIEW', tip: !tip })}
          onFocus={() => !tip && act(props, { type: 'SET_JOB_VIEW', tip: true })}
          onMouseEnter={() => !tip && act(props, { type: 'SET_JOB_VIEW', tip: true })}
          onBlur={() => tip && act(props, { type: 'SET_JOB_VIEW', tip: false })}
          onMouseLeave={() => tip && act(props, { type: 'SET_JOB_VIEW', tip: false })}
        >
          <Info size={16} aria-hidden="true" />
        </button>
        <span className="type-data text-muted-foreground">{UNKNOWN_FACTS.unavailable}</span>
      </div>
      {tip && (
        <div className={`${card} type-micro px-3 py-2`} style={{ ...at(UNKNOWN_PARTS.tip), ...NO_TRACKING }}>
          A timeout proves neither failure nor submission. Do not resubmit until reconciled.
        </div>
      )}
      <div {...anchored('unknown-evidence', UNKNOWN_PARTS.evidence)} className="relative flex gap-4">
        <div className={`${card} flex-1 px-2 py-2`}>
          <div className="type-data">Evidence</div>
          <button type="button" aria-label="Open NetSuite ERP timeout record" className="type-micro text-left underline" onClick={() => {
            act(props, { type: 'SELECT_CASE', caseId: UNKNOWN_INVOICE.invoice })
            act(props, { type: 'SELECT_APP_TAB', tab: 'netsuite' })
            act(props, { type: 'OPEN_SCREEN', screen: 'SC06' })
          }}>
            NetSuite ERP timeout record
          </button>
          <div className="type-micro">ERP submit timed out</div>
        </div>
        <div aria-hidden="true" className="absolute bg-foreground" style={{ left: 204, top: 48, width: 24 * connector, height: 1 }} />
        <div className={`${card} flex-1 px-2 py-2`}>
          <div className="type-data">Business postcondition</div>
          <div className="type-micro">Reconciliation required</div>
          <div className="type-micro">Independent readback unavailable</div>
          {investigating && <div className="type-micro">Investigation opened</div>}
        </div>
      </div>
    </>
  )
}

interface DrawerFrameProps {
  readonly anchor: string
  readonly visible: boolean
  readonly hiddenAnchors: readonly string[]
  readonly titleId: string
  readonly title: string
  readonly subtitle: string
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  readonly body: ReactNode
  readonly footer: ReactNode
}

/** One drawer: header, scrollable body and sticky footer in drawer-local coordinates. Hidden, it renders only its anchors. */
function DrawerFrame({ anchor, visible, hiddenAnchors, titleId, title, subtitle, onKeyDown, body, footer }: DrawerFrameProps) {
  return (
    <Frame as="section" anchor={anchor} visible={visible} rect={DRAWER} role="dialog" aria-modal="true" aria-labelledby={titleId} className="rounded-none shadow-lg" style={{ zIndex: 50 }} onKeyDown={onKeyDown}>
      {visible ? (
        <>
          <h2 id={titleId} className="type-section m-0" style={at(DRAWER_PARTS.title)}>
            {title}
          </h2>
          <p className="type-data m-0 text-muted-foreground" style={at(DRAWER_PARTS.subtitle)}>
            {subtitle}
          </p>
          <div className="overflow-hidden" style={at(DRAWER_PARTS.body)}>
            {body}
          </div>
          <div className="border-t bg-surface" style={at(DRAWER_PARTS.footer)} />
          {footer}
        </>
      ) : (
        <HiddenAnchors names={hiddenAnchors} />
      )}
    </Frame>
  )
}

const local = (rect: Rect): Rect => within(DRAWER, rect)

/** The z40 layer. In the clickable app it moves focus to the shown drawer's `Close` and gives focus back to the opener; a film has no focus handling. */
function ModalLayer({ open, focusKey, interactive, fade, children }: { readonly open: boolean; readonly focusKey: string | null; readonly interactive: boolean; readonly fade: number; readonly children: ReactNode }) {
  const layer = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusKey === null || !interactive) return undefined
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    layer.current?.querySelector<HTMLElement>('[data-initial-focus]')?.focus()
    return () => opener?.focus()
  }, [focusKey, interactive])
  return (
    <div ref={layer} data-layer="job-drawer" aria-hidden={open ? undefined : true} style={{ ...at({ x: 0, y: 0, width: CANVAS.width, height: CANVAS.height }), zIndex: 40, display: open ? undefined : 'none', opacity: fade }}>
      {children}
    </div>
  )
}

export function JobDrawers(props: ProductProps) {
  const { state, film } = props
  const access = jobAccess(state)
  const interactive = film === undefined
  const shown: 'approval' | 'unknown' | null = !access.ok ? null : state.route === 'SC23' ? 'approval' : state.route === 'SC24' ? 'unknown' : null
  const open = shown !== null

  const close = () => act(props, { type: 'OPEN_SCREEN', screen: 'SC22' })
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      close()
    } else trapTab(event, event.currentTarget)
  }
  const fade = open ? motionProgress(film, 'OPEN_SCREEN') : 1
  const transition = film ? 'transition-none' : undefined

  const approve = decisionBlock(state, 'APPROVE')
  const reject = decisionBlock(state, 'REJECT')
  const changes = decisionBlock(state, 'REQUEST_CHANGES')
  const decide = (type: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES') => act(props, { type, invoice: APPROVAL_INVOICE.invoice })

  return (
    <ModalLayer open={open} focusKey={shown} interactive={interactive} fade={fade}>
      <div aria-hidden="true" className="bg-black/80" style={at({ x: 0, y: 0, width: DRAWER.x, height: CANVAS.height })} onClick={close} />
      <DrawerFrame
        anchor="approval-drawer"
        visible={shown === 'approval'}
        hiddenAnchors={APPROVAL_ANCHORS.filter((name) => name !== 'approval-drawer')}
        titleId="approval-drawer-title"
        title={APPROVAL_INVOICE.invoice}
        subtitle={`${APPROVAL_INVOICE.supplier} \u00b7 ${APPROVAL_INVOICE.po ?? ''} \u00b7 ${APPROVAL_RULE}`}
        onKeyDown={onKeyDown}
        body={<ApprovalBody {...props} />}
        footer={
          <>
            <Button variant="outline" className={transition} disabled={changes !== null} disabledReason={changes ?? undefined} {...anchored('request-changes', local(APPROVAL_BUTTONS.requestChanges))} onClick={() => decide('REQUEST_CHANGES')}>
              Request Changes
            </Button>
            <Button variant="outline" className={transition} disabled={reject !== null} disabledReason={reject ?? undefined} {...anchored('reject', local(APPROVAL_BUTTONS.reject))} onClick={() => decide('REJECT')}>
              Reject
            </Button>
            <Button className={transition} disabled={approve !== null} disabledReason={approve ?? undefined} {...anchored('approve', local(APPROVAL_BUTTONS.approve))} onClick={() => decide('APPROVE')}>
              Approve
            </Button>
            <Button data-initial-focus="true" variant="outline" className={transition} {...anchored('approval-close', local(APPROVAL_BUTTONS.close))} onClick={close}>
              Close
            </Button>
          </>
        }
      />
      <DrawerFrame
        anchor="unknown-case"
        visible={shown === 'unknown'}
        hiddenAnchors={UNKNOWN_ANCHORS.filter((name) => name !== 'unknown-case')}
        titleId="unknown-drawer-title"
        title={UNKNOWN_INVOICE.invoice}
        subtitle={`${UNKNOWN_INVOICE.supplier} \u00b7 ${formatCents(UNKNOWN_INVOICE.amountCents)} \u00b7 ${UNKNOWN_INVOICE.po ?? ''}`}
        onKeyDown={onKeyDown}
        body={<UnknownBody {...props} />}
        footer={
          <>
            {state.ui.job.investigating && (
              <span className="type-data flex items-center text-muted-foreground" style={at({ x: 16, y: 668, width: 232, height: 40 })}>
                Investigation open
              </span>
            )}
            <Button variant="outline" className={transition} {...anchored('investigate', local(UNKNOWN_BUTTONS.investigate))} onClick={() => act(props, { type: 'SET_JOB_VIEW', investigating: true })}>
              Investigate
            </Button>
            <Button data-initial-focus="true" variant="outline" className={transition} {...anchored('unknown-close', local(UNKNOWN_BUTTONS.close))} onClick={close}>
              Close
            </Button>
          </>
        }
      />
    </ModalLayer>
  )
}
