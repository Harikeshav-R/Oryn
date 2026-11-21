import { Building2, CircleAlert, Clock3, FileText, Link as LinkIcon, ShieldCheck, TriangleAlert, X } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { APPROVAL_AFTER, APPROVAL_BEFORE, APPROVAL_EXCEEDS_THRESHOLD, APPROVAL_INVOICE, APPROVAL_PENDING_VERIFICATION, APPROVAL_RULE, varianceDisplay } from '@/data/approval'
import { UNKNOWN_INVOICE } from '@/data/approval'
import { INCIDENT } from '@/data/incident'
import { KESTREL_DOCUMENT } from '@/data/work-records'
import { SUPPLIERS, supplierName } from '@/data/people'
import { centsOrDash, recordsOfSupplier, workRecord } from '@/data/work-records'
import type { Rect } from '@/film'
import { cn } from '@/lib/utils'
import { person } from '@/state'
import type { State } from '@/state'
import { act, filmAnchor, motionProgress, type ProductProps } from '../contract'
import { refusal } from '../discovery'
import { appTabMeta } from '../desktop-data'
import {
  APP05_RECTS,
  BILL_FIELDS,
  BILL_PANEL,
  ERP_ACTIONS,
  ERP_SHELL,
  PO_FIELDS,
  PO_PANEL,
  VENDOR_CARD,
  VENDOR_HEADING,
  VENDOR_ORDER,
  VENDOR_RECORD,
  vendorRowRectOf,
} from './erp-layout'
import { Hud } from './Hud'
import { HiddenAnchors } from '../settings-frame'
import { appAnchored, appAt, inside } from './frame'

/**
 * APP-03 vendor bill with its purchase order, APP-04 vendor list and Kestrel vendor record, in an
 * original neutral ERP skin. A pure function of `{ state, film }`: the view follows `state.ui.app.erp`
 * and the record in `state.ui.app.record`. Every anchored element is rendered on every render and
 * hidden with `display: none` when its view is not shown, so no rectangle ever moves.
 */

const DASH = '\u2014'
const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const BUTTON = `box-border inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border type-data ${FOCUS}`
const OUTLINE = 'border-border bg-surface text-foreground hover:bg-surface-2'
const PRIMARY = 'border-primary bg-primary text-primary-foreground hover:border-foreground hover:bg-background hover:text-foreground'
const LABEL = 'font-sans text-[12px] leading-4 text-muted-foreground'

const rel = (parent: Rect, child: Rect): CSSProperties => {
  const { x, y, width, height } = inside(parent, child)
  return { position: 'absolute', left: x, top: y, width, height }
}
const hideUnless = (visible: boolean): CSSProperties => (visible ? {} : { display: 'none' })

type StatusGlyph = 'hold' | 'awaiting' | 'matched' | 'mismatch'
interface BillStatus {
  readonly glyph: StatusGlyph
  readonly text: string
  readonly reason: string
}

/**
 * The status line of INV-48219. A decision is not a readback: `Matched - Variance Approved` needs
 * the independent readback to be verified; an approval alone shows `Awaiting verification`.
 */
function billStatus(state: State): BillStatus {
  const { approval, readback } = state
  const by = approval.by === null ? null : person(approval.by).name
  if (readback.status === 'verified') return { glyph: 'matched', text: APPROVAL_AFTER, reason: 'Independent readback confirmed the approved change' }
  if (readback.status === 'mismatch') return { glyph: 'mismatch', text: 'Readback mismatch', reason: 'Readback did not confirm the approved change' }
  if (approval.decision === 'approved') return { glyph: 'awaiting', text: APPROVAL_PENDING_VERIFICATION, reason: by === null ? 'Approved; readback pending' : `Approved by ${by}; readback pending` }
  if (approval.decision === 'rejected') return { glyph: 'hold', text: APPROVAL_BEFORE, reason: by === null ? 'Rejected; the hold stands' : `Rejected by ${by}; the hold stands` }
  if (approval.decision === 'changesRequested') return { glyph: 'hold', text: APPROVAL_BEFORE, reason: by === null ? 'Changes requested; the hold stands' : `Changes requested by ${by}; the hold stands` }
  return { glyph: 'hold', text: APPROVAL_BEFORE, reason: `Held for approval under ${APPROVAL_RULE}` }
}

function StatusIcon({ glyph }: { readonly glyph: StatusGlyph }) {
  if (glyph === 'matched') return <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
  if (glyph === 'hold') return <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-warning" />
  if (glyph === 'awaiting') return <Clock3 aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
  return <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-foreground" />
}

/** A 40px field: label above a mono value. The label and value stay readable as one phrase. */
function Field({ parent, rect, label, value, anchor, visible }: { readonly parent: Rect; readonly rect: Rect; readonly label: string; readonly value: string; readonly anchor?: string; readonly visible: boolean }) {
  return (
    <div {...(anchor ? filmAnchor(anchor) : {})} className="box-border flex flex-col justify-center overflow-hidden border bg-background px-2" style={{ ...rel(parent, rect), ...hideUnless(visible) }}>
      <span className={LABEL}>{label}</span>{' '}
      <span className="type-data overflow-hidden whitespace-nowrap">{value}</span>
    </div>
  )
}

/** A 1px-bordered panel: the inner layer cancels the border so children use `parent + local` exactly. */
function Panel({ name, rect, visible, label, children }: { readonly name: string; readonly rect: Rect; readonly visible: boolean; readonly label: string; readonly children: ReactNode }) {
  return (
    <section {...appAnchored(name, rect, visible)} aria-label={label} className="box-border border bg-surface">
      <div style={{ position: 'absolute', left: -1, top: -1, width: rect.width, height: rect.height }}>{children}</div>
    </section>
  )
}

function BillView({ props, visible }: { readonly props: ProductProps; readonly visible: boolean }) {
  const { state } = props
  const record = workRecord(state.ui.app.record)
  const hero = record.id === APPROVAL_INVOICE.invoice
  const status = billStatus(state)
  const [varianceAmount = DASH, variancePercent = DASH] = varianceDisplay().split(' / ')
  const poNote = record.po === null ? 'Purchase order not stated in this record' : record.poTotalCents === null ? 'PO total not stated in this record' : null
  const ruleNote = APPROVAL_EXCEEDS_THRESHOLD ? `Exceeds the 2% threshold \u00b7 ${APPROVAL_RULE}` : APPROVAL_RULE
  if (!visible) return <HiddenAnchors names={['erp-bill', 'erp-po', 'erp-invoice-total', 'po-total', 'erp-variance', 'erp-status', 'erp-match-action', 'erp-stage']} />

  return (
    <>
      <Panel name="erp-bill" rect={BILL_PANEL} visible={visible} label="Vendor bill">
        <h2 className="type-card m-0 flex items-center gap-2" style={rel(BILL_PANEL, BILL_FIELDS.heading)}>
          <FileText aria-hidden="true" className="size-4 shrink-0" />
          Vendor Bill
        </h2>
        <div aria-hidden="true" className="bg-border" style={rel(BILL_PANEL, BILL_FIELDS.rule)} />
        <Field parent={BILL_PANEL} rect={BILL_FIELDS.invoice} label="Invoice" value={record.id} visible={visible} />
        <Field parent={BILL_PANEL} rect={BILL_FIELDS.total} label="Invoice total" value={centsOrDash(record.totalCents)} anchor="erp-invoice-total" visible={visible} />
        <Field parent={BILL_PANEL} rect={BILL_FIELDS.supplier} label="Supplier" value={record.supplier} visible={visible} />
        <Field parent={BILL_PANEL} rect={BILL_FIELDS.po} label="Purchase order" value={record.po ?? DASH} visible={visible} />
        {!hero && <HiddenAnchors names={['erp-variance', 'erp-status']} />}
        {hero && (
        <>
        <div
          {...filmAnchor('erp-variance')}
          className="box-border flex items-center gap-4 overflow-hidden border bg-surface-2 px-2"
          style={{ ...rel(BILL_PANEL, BILL_FIELDS.variance), ...hideUnless(visible && hero) }}
        >
          <div className="w-28 shrink-0">
            <span className={LABEL}>Variance</span>{' '}
            <span className="type-data block whitespace-nowrap">{varianceAmount}</span>
          </div>
          <div className="w-16 shrink-0">
            <span className={LABEL}>Of PO total</span>{' '}
            <span className="type-data block whitespace-nowrap">{variancePercent}</span>
          </div>
          <p className="type-micro m-0 min-w-0 flex-1 text-muted-foreground">{ruleNote}</p>
        </div>
        <div
          {...filmAnchor('erp-status')}
          role="status"
          data-status={status.glyph}
          className="box-border flex flex-col justify-center overflow-hidden border bg-background px-2"
          style={{ ...rel(BILL_PANEL, BILL_FIELDS.status), ...hideUnless(visible && hero) }}
        >
          <span className="type-body flex items-center gap-2 font-medium">
            <StatusIcon glyph={status.glyph} />
            {status.text}
          </span>
          <span className="type-micro overflow-hidden whitespace-nowrap text-muted-foreground">{status.reason}</span>
        </div>
        </>
      )}
      </Panel>
      <Panel name="erp-po" rect={PO_PANEL} visible={visible} label="Linked purchase order">
        <h2 className="type-card m-0 flex items-center gap-2" style={rel(PO_PANEL, PO_FIELDS.heading)}>
          <LinkIcon aria-hidden="true" className="size-4 shrink-0" />
          Purchase order
        </h2>
        <div aria-hidden="true" className="bg-border" style={rel(PO_PANEL, PO_FIELDS.rule)} />
        <Field parent={PO_PANEL} rect={PO_FIELDS.po} label="Purchase order" value={record.po ?? DASH} visible={visible} />
        <Field parent={PO_PANEL} rect={PO_FIELDS.total} label="PO total" value={centsOrDash(record.poTotalCents)} anchor="po-total" visible={visible} />
        <Field parent={PO_PANEL} rect={PO_FIELDS.supplier} label="Supplier" value={record.po === null ? DASH : record.supplier} visible={visible} />
        {poNote !== null && (
          <p className="type-micro m-0 box-border flex items-center overflow-hidden border bg-surface-2 px-2 text-muted-foreground" style={rel(PO_PANEL, PO_FIELDS.note)}>
            {poNote}
          </p>
        )}
      </Panel>
      <button
        type="button"
        {...appAnchored('erp-match-action', ERP_ACTIONS.match, visible)}
        className={cn(BUTTON, OUTLINE)}
      >
        Match purchase order
      </button>
      <button
        type="button"
        {...appAnchored('erp-stage', ERP_ACTIONS.stage, visible)}
        className={cn(BUTTON, PRIMARY)}
        onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC23' })}
      >
        Stage
      </button>
    </>
  )
}

function VendorList({ props, visible }: { readonly props: ProductProps; readonly visible: boolean }) {
  if (!visible) return <HiddenAnchors names={['vendor-list', 'vendor-row-kestrel', 'vendor-row-brightwater']} />
  return (
    <section {...appAnchored('vendor-list', VENDOR_CARD, visible)} aria-label="Vendors" className="box-border border bg-surface">
      <div style={{ position: 'absolute', left: -1, top: -1, width: VENDOR_CARD.width, height: VENDOR_CARD.height }}>
        <h2 className="type-section m-0 flex items-center gap-2" style={rel(VENDOR_CARD, VENDOR_HEADING)}>
          Vendors
        </h2>
        <ul className="m-0 list-none p-0">
          {VENDOR_ORDER.map((id) => {
            const anchor = id === 'kestrel' ? 'vendor-row-kestrel' : id === 'brightwater' ? 'vendor-row-brightwater' : undefined
            return (
              <li key={id}>
                <button
                  type="button"
                  {...(anchor ? filmAnchor(anchor) : {})}
                  onClick={() => act(props, { type: 'OPEN_VENDOR', vendorId: id })}
                  className={cn('box-border flex items-center gap-3 border border-transparent bg-transparent px-3 text-left text-foreground hover:bg-surface-2', FOCUS)}
                  style={{ ...rel(VENDOR_CARD, vendorRowRectOf(id)), ...hideUnless(visible) }}
                >
                  <Building2 aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <span className="type-body">{supplierName(id)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function VendorRecord({ props, visible }: { readonly props: ProductProps; readonly visible: boolean }) {
  const vendorId = props.state.ui.app.vendor
  const supplier = SUPPLIERS.find((item) => item.id === vendorId)
  const bills = supplier ? recordsOfSupplier(supplier.id) : []
  if (!visible) return <HiddenAnchors names={['vendor-record', 'vendor-name']} />
  return (
    <section {...appAnchored('vendor-record', VENDOR_CARD, visible)} aria-label="Vendor record" className="box-border border bg-surface">
      <div style={{ position: 'absolute', left: -1, top: -1, width: VENDOR_CARD.width, height: VENDOR_CARD.height }}>
        <h2 {...filmAnchor('vendor-name')} className="m-0 flex items-center gap-3 overflow-hidden" style={{ ...rel(VENDOR_CARD, VENDOR_HEADING), ...hideUnless(visible) }}>
          <Building2 aria-hidden="true" className="size-4 shrink-0" />
          <span className="type-micro text-muted-foreground">Vendor</span>{' '}
          <span className="type-section overflow-hidden whitespace-nowrap">{supplier ? supplier.name : DASH}</span>
        </h2>
        <h3 className="type-body m-0 font-medium" style={rel(VENDOR_CARD, VENDOR_RECORD.billsLabel)}>
          Open bills
        </h3>
        {bills.length === 0 ? (
          <p className="type-body m-0 text-muted-foreground" style={rel(VENDOR_CARD, VENDOR_RECORD.bills[0] ?? VENDOR_RECORD.billsLabel)}>
            No bills are stated for this vendor in these records
          </p>
        ) : (
          <ul className="m-0 list-none p-0">
            {bills.slice(0, VENDOR_RECORD.bills.length).map((bill, index) => (
              <li key={bill.id}>
                <button
                  type="button"
                  onClick={() => act(props, { type: 'OPEN_BILL', record: bill.id })}
                  className={cn('type-data box-border flex items-center gap-3 border px-3 text-left', OUTLINE, FOCUS)}
                  style={rel(VENDOR_CARD, VENDOR_RECORD.bills[index] ?? VENDOR_RECORD.billsLabel)}
                >
                  <FileText aria-hidden="true" className="size-4 shrink-0" />
                  {`${bill.id} \u00b7 ${bill.po ?? DASH} \u00b7 ${centsOrDash(bill.totalCents)}`}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="type-micro m-0 text-muted-foreground" style={rel(VENDOR_CARD, VENDOR_RECORD.note)}>
          No other fields are stated in this record
        </p>
      </div>
    </section>
  )
}

/** APP-05 uses separate contexts so a held submission is never mistaken for a correction. */
function ExceptionViews({ props, manual, peer, timeout }: { readonly props: ProductProps; readonly manual: boolean; readonly peer: boolean; readonly timeout: boolean }) {
  const { state, film } = props
  const completed = state.incident.manualCompletions.includes('INV-48231')
  const completeAction = { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48231' } as const
  const completeReason = refusal(state, completeAction)
  const teachReason = completed ? refusal(state, { type: 'OPEN_SCREEN', screen: 'SC27' }) : 'INV-48231 must be completed manually before the correction is taught.'
  const progress = film?.reducedMotion ? 1 : motionProgress(film, timeout ? 'SELECT_CASE' : 'OPEN_SCREEN')
  const entrance: CSSProperties = { opacity: progress, transform: `translateY(${-12 * (1 - progress)}px)` }
  const banner = timeout && !state.ui.breadth.timeout.dismissed
  return (
    <>
      <section {...appAnchored('manual-completion', APP05_RECTS.manual, manual)} className="box-border border bg-surface" aria-label="Manual case">
        {manual && (
          <div {...filmAnchor('manual-form')} style={rel(APP05_RECTS.manual, APP05_RECTS.form)} className="box-border overflow-hidden border bg-background p-4">
            <h2 className="type-section m-0">Vendor Bill · Manual completion</h2>
            <p className="type-body mt-2 text-muted-foreground">Elena Ruiz · INV-48231</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                ['Invoice', 'INV-48231'],
                ['Supplier', KESTREL_DOCUMENT.supplier],
                ['Purchase order', KESTREL_DOCUMENT.po],
                ['Invoice total', centsOrDash(KESTREL_DOCUMENT.totalCents)],
                ['PO total', centsOrDash(KESTREL_DOCUMENT.poTotalCents)],
                ['Handling', centsOrDash(KESTREL_DOCUMENT.handlingFeeCents)],
              ].map(([label, value]) => (
                <label key={label} className="type-data flex flex-col gap-1 text-muted-foreground">
                  {label}
                  <input aria-label={label} defaultValue={value} className="h-8 border bg-surface px-2 text-foreground" />
                </label>
              ))}
            </div>
            {completed && <div className="type-micro mt-3"><p className="m-0">{`${person(INCIDENT.correction.actorId).name} · ${INCIDENT.correction.caseId} · ${INCIDENT.correction.action}`}</p><p className="m-0">{INCIDENT.correction.answer}</p><details><summary className="cursor-pointer underline">Completion evidence</summary><p className="m-0">{INCIDENT.correction.question}</p><p className="m-0">{INCIDENT.correction.evidenceIds.join(' · ')}</p></details></div>}
            <p className="type-micro mt-2 text-muted-foreground">Correction is evidence, not new policy.</p>
          </div>
        )}
      </section>
      {!manual && <HiddenAnchors names={['manual-form']} />}
      <button type="button" {...appAnchored('complete-manually', APP05_RECTS.complete, manual && !completed)} aria-disabled={manual && completeReason !== null || undefined} title={manual ? completeReason ?? undefined : undefined} onClick={() => { if (completeReason === null) act(props, completeAction) }} className={cn(BUTTON, OUTLINE, 'aria-disabled:opacity-50')}>Complete manually</button>
      <button type="button" {...appAnchored('teach-correction', APP05_RECTS.teach, manual)} aria-disabled={manual && teachReason !== null || undefined} title={manual ? teachReason ?? undefined : undefined} onClick={() => { if (teachReason === null) act(props, { type: 'OPEN_SCREEN', screen: 'SC27' }) }} className={cn(BUTTON, PRIMARY, 'aria-disabled:opacity-50')}>Teach Oryn What Changed</button>
      <div {...appAnchored('tax-validation', APP05_RECTS.validation, peer)}>
        {peer && <div style={entrance} className="box-border flex h-full w-[620px] items-center gap-3 border bg-surface px-4"><TriangleAlert aria-hidden="true" className="size-5 text-warning" /><span className="type-body font-medium">Vendor tax ID format</span></div>}
      </div>
      <label {...appAnchored('tax-id-field', APP05_RECTS.taxField, peer)} className="type-data flex flex-col gap-1 text-muted-foreground">
        {peer && <>Vendor tax ID<input aria-label="Vendor tax ID" className="h-9 border bg-surface px-2 text-foreground" /></>}
      </label>
      {peer && <div className="grid w-[560px] grid-cols-2 gap-4" style={appAt({ x: 260, y: 340, width: 560, height: 160 })}>
        {([['Invoice', workRecord(state.ui.app.record).id], ['Supplier', workRecord(state.ui.app.record).supplier], ['Invoice total', centsOrDash(workRecord(state.ui.app.record).totalCents)], ['Purchase order', workRecord(state.ui.app.record).po ?? DASH]] as const).map(([label, value]) => <label key={label} className="type-data flex flex-col gap-1 text-muted-foreground">{label}<input aria-label={label} defaultValue={value} className="h-9 border bg-surface px-2 text-foreground" /></label>)}
      </div>}
      <div {...appAnchored('timeout-banner', APP05_RECTS.timeout, banner)} style={{ ...appAnchored('timeout-banner', APP05_RECTS.timeout, banner).style, zIndex: 20 }}>
        {banner && <div style={entrance} className="box-border flex h-full gap-3 rounded-lg border bg-surface p-3 text-foreground shadow-md"><TriangleAlert aria-hidden="true" className="mt-1 size-5 shrink-0 text-warning" /><div><p className="m-0 text-[14px] font-medium leading-5">Submission timed out</p><p className="m-0 text-[14px] leading-5">Outcome Unknown · Held</p><p className="m-0 text-[12px] leading-[18px] text-muted-foreground">Do not resubmit until reconciled</p></div></div>}
      </div>
      <button {...appAnchored('timeout-close', APP05_RECTS.timeoutClose, banner)} type="button" aria-label="Close notification" onClick={() => act(props, { type: 'DISMISS_TIMEOUT_BANNER' })} style={{ ...appAnchored('timeout-close', APP05_RECTS.timeoutClose, banner).style, zIndex: 21 }} className="flex items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2"><X aria-hidden="true" className="size-4" /></button>
      <button {...appAnchored('timeout-review', APP05_RECTS.timeoutReview, banner)} type="button" onClick={() => { act(props, { type: 'SELECT_CASE', caseId: 'INV-48220' }); act(props, { type: 'OPEN_SCREEN', screen: 'SC24' }) }} style={{ ...appAnchored('timeout-review', APP05_RECTS.timeoutReview, banner).style, zIndex: 21 }} className="rounded-md border bg-surface type-data focus-visible:outline focus-visible:outline-2">Review</button>
      {timeout && <section aria-label="Held vendor bill" className="box-border border bg-surface p-5" style={appAt(APP05_RECTS.manual)}>
        <h2 className="type-section m-0">Vendor Bill</h2>
        <div className="mt-5 grid w-[560px] grid-cols-2 gap-4">
          {([['Invoice', UNKNOWN_INVOICE.invoice], ['Supplier', UNKNOWN_INVOICE.supplier], ['Invoice total', centsOrDash(UNKNOWN_INVOICE.amountCents)], ['Purchase order', UNKNOWN_INVOICE.po ?? DASH]] as const).map(([label, value]) => <label key={label} className="type-data flex flex-col gap-1 text-muted-foreground">{label}<input aria-label={label} defaultValue={value} className="h-9 border bg-background px-2 text-foreground" /></label>)}
        </div>
        <button type="button" onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC24' })} className={cn(BUTTON, OUTLINE, 'mt-6 h-10 px-4')}>Reconcile</button>
      </section>}
    </>
  )
}

/** The whole 1280x644 content area of the NetSuite tab. */
export function NetSuiteView(props: ProductProps) {
  const { erp } = props.state.ui.app
  const bill = erp === 'bill'
  // Explicit case selection of the held unknown case shows its timeout, unless the viewer has since opened Elena's INV-48231 bill (the opened record wins); otherwise the bill record selects the context.
  const timeout = bill && props.state.route === 'SC06' && props.state.ui.app.record !== 'INV-48231' && props.state.selectedCase === 'INV-48220' && props.state.job.outcomes['INV-48220'] === 'unknown'
  const peer = bill && props.state.route === 'SC04' && props.state.actorId === 'jamal'
  const manual = bill && !timeout && !peer && props.state.ui.app.record === 'INV-48231' && props.state.incident.status !== 'none'
  const vendorsShown = erp === 'vendors' || erp === 'vendor'
  const mark = appTabMeta('netsuite').mark
  const railItem = (active: boolean): string => cn('box-border flex items-center gap-2 border-l-2 px-3 text-left type-body', FOCUS, active ? 'border-foreground bg-surface-2 font-medium' : 'border-transparent hover:bg-surface-2')

  return (
    <div data-app="netsuite" data-view={erp} className="absolute inset-0 overflow-hidden bg-background text-foreground">
      <header className="box-border flex items-center gap-3 border-b bg-surface px-4" style={appAt(ERP_SHELL.header)}>
        <img src={mark} alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
        <span className="type-body font-medium">NetSuite</span>
        <span className="type-body text-muted-foreground">Transactions</span>
        <span className="type-body text-muted-foreground">Lists</span>
      </header>
      <nav aria-label="NetSuite sections" className="box-border border-r bg-surface" style={appAt(ERP_SHELL.rail)}>
        <button
          type="button"
          aria-current={bill ? 'page' : undefined}
          onClick={() => act(props, { type: 'OPEN_ERP_VIEW', view: 'bill' })}
          className={railItem(bill)}
          style={{ position: 'absolute', left: ERP_SHELL.railVendorBill.x, top: ERP_SHELL.railVendorBill.y - ERP_SHELL.rail.y, width: ERP_SHELL.railVendorBill.width, height: ERP_SHELL.railVendorBill.height }}
        >
          <FileText aria-hidden="true" className="size-4 shrink-0" />
          Vendor Bill
        </button>
        <button
          type="button"
          aria-current={vendorsShown ? 'page' : undefined}
          onClick={() => act(props, { type: 'OPEN_ERP_VIEW', view: 'vendors' })}
          className={railItem(vendorsShown)}
          style={{ position: 'absolute', left: ERP_SHELL.railVendors.x, top: ERP_SHELL.railVendors.y - ERP_SHELL.rail.y, width: ERP_SHELL.railVendors.width, height: ERP_SHELL.railVendors.height }}
        >
          <Building2 aria-hidden="true" className="size-4 shrink-0" />
          Vendors
        </button>
      </nav>
      <BillView props={props} visible={bill && !manual && !peer && !timeout} />
      <VendorList props={props} visible={erp === 'vendors'} />
      <VendorRecord props={props} visible={erp === 'vendor'} />
      <ExceptionViews props={props} manual={manual} peer={peer} timeout={timeout} />
      <Hud {...props} />
    </div>
  )
}
