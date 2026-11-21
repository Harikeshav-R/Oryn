import type { CSSProperties, ReactNode } from 'react'
import { sampleMotion } from '@/film'
import type { Rect } from '@/film'
import { KESTREL_DOCUMENT, centsOrDash } from '@/data/work-records'
import type { WorkRecord } from '@/data/work-records'
import { cn } from '@/lib/utils'
import type { DocumentView } from '@/state/types'
import type { FilmContext } from '../contract'
import { CAPTION_CURRENT, CAPTION_EARLIER, DOC, PAGE, PAGE_V1, V1, VIEWER, anchorIn, placeIn } from './gmail-layout'

/**
 * APP-02: the source document as selectable HTML. It is an original simplified invoice, never a
 * screenshot or a vendor PDF. Geometry is identical for every record: unknown or absent values
 * stay in place as an em dash, and the one extra Kestrel row (the handling fee, layout v2) is a
 * fixed slot that is `display: none` for every other record, so a single set of rectangles serves
 * all four documents. The paper stays white in both themes: it is a document, not product chrome.
 */

interface InvoiceDocumentModel {
  readonly supplier: string
  readonly id: string
  /** `null` when the source states no purchase order; rendered as an em dash. */
  readonly po: string | null
  /** Kestrel layout v2 only. */
  readonly subtotalCents: number | null
  readonly handlingFeeCents: number | null
  /** `null` when the source states no total (Demonstration D1); never inferred. */
  readonly totalCents: number | null
  readonly totalLabel: 'Invoice total' | 'Total'
}

function invoiceDocument(record: WorkRecord): InvoiceDocumentModel {
  if (record.id === KESTREL_DOCUMENT.invoice) {
    return {
      supplier: KESTREL_DOCUMENT.supplier,
      id: KESTREL_DOCUMENT.invoice,
      po: KESTREL_DOCUMENT.po,
      subtotalCents: KESTREL_DOCUMENT.subtotalCents,
      handlingFeeCents: KESTREL_DOCUMENT.handlingFeeCents,
      totalCents: KESTREL_DOCUMENT.totalCents,
      totalLabel: 'Total',
    }
  }
  return { supplier: record.supplier, id: record.id, po: record.po, subtotalCents: null, handlingFeeCents: null, totalCents: record.totalCents, totalLabel: 'Invoice total' }
}

const PAPER = 'box-border overflow-hidden bg-white text-[#0a0a0a] ring-1 ring-inset ring-[#dfdfd8]'
const LABEL = 'type-data text-[#666666]'
const VALUE = 'type-data text-[#0a0a0a]'

function Row({ rect, children, anchor }: { rect: Rect; children?: ReactNode; anchor?: { name: string; visible: boolean } }) {
  const attrs = anchor ? anchorIn(anchor.name, PAGE, rect, anchor.visible) : { style: placeIn(PAGE, rect) }
  return (
    <div {...attrs} className="box-border flex items-center justify-between overflow-hidden whitespace-nowrap">
      {children}
    </div>
  )
}

/** One skeleton bar: a plain surface shape that stands in for a number, never text. */
function SkeletonBar({ rect, parent }: { rect: Rect; parent: Rect }) {
  return <div aria-hidden="true" className="rounded-sm bg-[#efefeb]" style={placeIn(parent, rect)} />
}

const SLIDE_FRAMES = 18
const SLIDE_PX = 72

interface Motion {
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * The 600 ms cross-slide of the earlier sheet: `sheet` slides and fades, `caption` only fades. A
 * film derives progress from the frame (settled when no `SET_DOCUMENT_VIEW` has landed, and under
 * reduced motion); the clickable app plays a `motion-safe` keyframe animation when the sheet
 * mounts (a `display: none` element cannot transition).
 */
function slideOf(film: FilmContext | undefined): { readonly sheet: Motion; readonly caption: Motion } {
  if (!film) {
    const timing: CSSProperties = { animationDuration: '600ms', animationTimingFunction: 'cubic-bezier(.16,1,.3,1)' }
    return {
      sheet: { className: 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-[72px]', style: timing },
      caption: { className: 'motion-safe:animate-in motion-safe:fade-in-0', style: timing },
    }
  }
  const since = film.lastApplied('SET_DOCUMENT_VIEW')
  if (since === null || since === 0) return { sheet: {}, caption: {} }
  const { progress } = sampleMotion(since, SLIDE_FRAMES, 'reveal')(film)
  if (progress >= 1) return { sheet: {}, caption: {} }
  return { sheet: { style: { opacity: progress, transform: `translateX(${(1 - progress) * SLIDE_PX}px)` } }, caption: { style: { opacity: progress } } }
}

/**
 * The earlier layout v1: header, Subtotal and Total rows with skeleton bars; no ID and no amounts.
 * The anchored element keeps its settled rectangle on every frame; only the inner paper moves.
 */
function EarlierLayout({ visible, film }: { visible: boolean; film: FilmContext | undefined }) {
  const slide = visible ? slideOf(film).sheet : {}
  return (
    <div role="group" aria-label="Earlier layout" {...anchorIn('invoice-v1', VIEWER, PAGE_V1, visible)}>
      <div className={cn(PAPER, 'absolute inset-0', slide.className)} style={slide.style}>
        <SkeletonBar parent={PAGE_V1} rect={V1.header} />
        <div className="overflow-hidden whitespace-nowrap font-sans text-[11px] leading-[14px] text-[#666666]" style={placeIn(PAGE_V1, V1.subtotalLabel)}>
          Subtotal
        </div>
        <SkeletonBar parent={PAGE_V1} rect={V1.subtotalBar} />
        <div className="overflow-hidden whitespace-nowrap font-sans text-[11px] leading-[14px] text-[#666666]" style={placeIn(PAGE_V1, V1.totalLabel)}>
          Total
        </div>
        <SkeletonBar parent={PAGE_V1} rect={V1.totalBar} />
      </div>
    </div>
  )
}

interface InvoiceDocumentProps {
  readonly film?: FilmContext
  readonly record: WorkRecord
  readonly view: DocumentView
  /** True while the viewer is open; every anchor below is hidden otherwise. */
  readonly shown: boolean
}

/**
 * Renders the sheet(s) inside a positioned viewer whose border box is `VIEWER`. In compare mode
 * (INV-48231 only) the earlier layout v1 sits behind the current layout v2, which keeps the page
 * rectangle; the view never highlights the fee line itself.
 */
export function InvoiceDocument({ record, view, shown, film }: InvoiceDocumentProps) {
  const doc = invoiceDocument(record)
  const hasFee = doc.handlingFeeCents !== null
  const compare = shown && view === 'compare' && hasFee
  const slide = compare ? slideOf(film).caption : {}
  return (
    <>
      <EarlierLayout visible={compare} film={film} />
      <article aria-label={compare ? 'Current layout' : 'Invoice document'} {...anchorIn('document-page', VIEWER, PAGE, shown)} className={PAPER}>
        <div className="type-card overflow-hidden whitespace-nowrap font-sans font-bold" style={placeIn(PAGE, DOC.header)}>
          {doc.supplier}
        </div>
        <div aria-hidden="true" className="bg-[#dfdfd8]" style={placeIn(PAGE, DOC.headerRule)} />
        <div aria-hidden="true" className="bg-[#dfdfd8]" style={placeIn(PAGE, DOC.totalRule)} />
        <dl>
          <Row rect={DOC.invoiceId} anchor={{ name: 'invoice-id', visible: shown }}>
            <dt className={LABEL}>Invoice</dt>
            <dd className={VALUE}>{doc.id}</dd>
          </Row>
          <Row rect={DOC.poNumber} anchor={{ name: 'po-number', visible: shown }}>
            <dt className={LABEL}>Purchase order</dt>
            <dd className={VALUE}>{doc.po ?? '\u2014'}</dd>
          </Row>
          {hasFee ? (
            <Row rect={DOC.subtotal}>
              <dt className={LABEL}>Subtotal</dt>
              <dd className={VALUE}>{centsOrDash(doc.subtotalCents)}</dd>
            </Row>
          ) : null}
          <Row rect={DOC.handlingFee} anchor={{ name: 'handling-fee', visible: shown && hasFee }}>
            {hasFee ? (
              <>
                <dt className={LABEL}>Handling fee</dt>
                <dd className={VALUE}>{centsOrDash(doc.handlingFeeCents)}</dd>
              </>
            ) : null}
          </Row>
          <Row rect={DOC.total} anchor={{ name: 'invoice-total', visible: shown }}>
            <dt className={LABEL}>{doc.totalLabel}</dt>
            <dd className="type-section text-[#0a0a0a]">{centsOrDash(doc.totalCents)}</dd>
          </Row>
        </dl>
      </article>
      {compare ? (
        <>
          <div className={cn(LABEL, 'whitespace-nowrap', slide.className)} style={{ ...placeIn(VIEWER, CAPTION_EARLIER), ...slide.style }}>
            Earlier layout
          </div>
          <div className={`${LABEL} whitespace-nowrap text-right`} style={placeIn(VIEWER, CAPTION_CURRENT)}>
            Current layout
          </div>
        </>
      ) : null}
    </>
  )
}
