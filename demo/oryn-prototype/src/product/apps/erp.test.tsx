import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { APPROVAL_AFTER, APPROVAL_INVOICE, APPROVAL_PO_CENTS, APPROVAL_VARIANCE_CENTS } from '@/data/approval'
import { COMMITMENT } from '@/data/commitment'
import { formatCents } from '@/data/invoices'
import { SUPPLIERS } from '@/data/people'
import { WORK_RECORDS } from '@/data/work-records'
import type { Rect } from '@/film'
import { createInitialState, reconstruct } from '@/state'
import type { Action, HudPlacement, RecordId, State } from '@/state'
import { act } from '@/state/test-helpers'
import { ERP_ANCHORS, ERP_ANCHOR_RECTS, BILL_PANEL, PO_PANEL, VENDOR_CARD, HUD_RECTS, hudAnchorRects, type HudAnchor } from './erp-layout'
import { APP_TOP } from './frame'
import { NetSuiteView } from './NetSuiteView'
import type { FilmContext, ProductProps } from '../contract'

type Props = Record<string, unknown>

const render = (state: State, film?: FilmContext): string => renderToStaticMarkup(<NetSuiteView state={state} film={film} />)

/** Readable text of a markup string: tags, comments and style sheets removed, entities decoded. */
const text = (markup: string): string =>
  markup
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")

function tag(markup: string, name: string): string {
  const found = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!found) throw new Error(`No element for anchor ${name}`)
  return found
}
const hidden = (markup: string, name: string): boolean => tag(markup, name).includes('display:none')
const count = (markup: string, needle: string): number => markup.split(needle).length - 1

/** left/top/width/height of an opening tag's inline style, in px. */
function styleRect(opening: string): Rect {
  const read = (property: string): number => {
    const value = opening.match(new RegExp(`[ ;"']${property}:(-?\\d+(?:\\.\\d+)?)(?:px)?[;"']`))?.[1]
    if (value === undefined) throw new Error(`${property} missing in ${opening}`)
    return Number(value)
  }
  return { x: read('left'), y: read('top'), width: read('width'), height: read('height') }
}
const origin = (rect: Rect, parent: Rect): Rect => ({ ...rect, x: rect.x + parent.x, y: rect.y + parent.y })
const toCanvas = (rect: Rect): Rect => ({ ...rect, y: rect.y + APP_TOP })

/** The renderable children of an element's props. */
function childrenOf(props: Props): ReactNode {
  const children = props.children
  return typeof children === 'string' || typeof children === 'number' || isValidElement(children) || Array.isArray(children) ? children : null
}

/** Host elements in document order. The view uses no hooks, so components can be called directly. */
function flatten(node: ReactNode, out: ReactElement<Props>[] = []): ReactElement<Props>[] {
  if (Array.isArray(node)) {
    node.forEach((child: ReactNode) => flatten(child, out))
    return out
  }
  if (!isValidElement<Props>(node)) return out
  if (typeof node.type === 'function') {
    const rendered: ReactNode = Reflect.apply(node.type, undefined, [node.props])
    return flatten(rendered, out)
  }
  if (typeof node.type === 'string') out.push(node)
  return flatten(childrenOf(node.props), out)
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map((child: ReactNode) => textOf(child)).join('')
  if (!isValidElement<Props>(node)) return ''
  if (typeof node.type === 'function') return textOf(Reflect.apply(node.type, undefined, [node.props]))
  return textOf(childrenOf(node.props))
}

function run(state: State, find: (element: ReactElement<Props>) => boolean, handler: 'onClick' | 'onKeyDown', event: unknown): Action[] {
  const dispatched: Action[] = []
  const props: ProductProps = { state, dispatch: (action) => dispatched.push(action) }
  const element = flatten(<NetSuiteView {...props} />).find(find)
  if (!element) throw new Error('No matching element')
  const fn = element.props[handler]
  if (typeof fn === 'function') fn(event)
  return dispatched
}
const clickAnchor = (state: State, name: string): Action[] => run(state, (element) => element.props['data-film-anchor'] === name, 'onClick', undefined)
const clickText = (state: State, label: string): Action[] => run(state, (element) => element.type === 'button' && textOf(childrenOf(element.props)).trim() === label, 'onClick', undefined)

const initial = createInitialState()
const openBill = (record: RecordId, from: State = initial): State => act(from, { type: 'OPEN_BILL', record })
const confirmed = (): State => act(reconstruct('ST04'), { type: 'OPEN_SCREEN', screen: 'SC06' })
const kestrelRecord = (from: State = confirmed()): State => act(from, { type: 'OPEN_VENDOR', vendorId: 'kestrel' })
const peerFix = (): State => act(reconstruct('ST04'), { type: 'OPEN_SCREEN', screen: 'SC04' })
const withPlacement = (state: State, placement: HudPlacement): State => act(state, { type: 'PLACE_HUD', placement })

const hudAnchors: readonly HudAnchor[] = ['hud-reminder', 'hud-peer-fix', 'guide-me', 'guide-next', 'guide-back', 'guide-done', 'hud-dismiss']

const filmAt = (frame: number, applied: Partial<Record<Action['type'], number>> = {}): FilmContext => ({ frame, reducedMotion: false, lastApplied: (type) => applied[type] ?? null })

describe('APP-03 vendor bill and purchase order', () => {
  const html = render(initial)
  const readable = text(html)

  test('INV-48219 shows every identifier and both totals and the variance at once', () => {
    for (const expected of ['Vendor Bill', 'Brightwater Industrial', 'INV-48219', 'PO-1042', 'Invoice total $18,420.00', 'PO total $17,980.00', 'Variance $440.00', '2.45%', 'Match purchase order', 'Stage']) {
      expect(readable).toContain(expected)
    }
    for (const name of ['erp-invoice-total', 'po-total', 'erp-variance']) expect(hidden(html, name)).toBe(false)
  })

  test('the numbers agree with the fixture arithmetic in integer cents', () => {
    expect(formatCents(APPROVAL_INVOICE.amountCents)).toBe('$18,420.00')
    expect(formatCents(APPROVAL_PO_CENTS)).toBe('$17,980.00')
    expect(APPROVAL_VARIANCE_CENTS).toBe(44_000)
    expect((Math.round((APPROVAL_VARIANCE_CENTS * 10_000) / APPROVAL_PO_CENTS) / 100).toFixed(2)).toBe('2.45')
  })

  test('before any approval the status is Variance Hold with a warning glyph, never verified', () => {
    expect(readable).toContain('Variance Hold')
    expect(readable).not.toContain(APPROVAL_AFTER)
    expect(readable).not.toContain('Awaiting verification')
    expect(tag(html, 'erp-status')).toContain('data-status="hold"')
    expect(html).toContain('lucide-triangle-alert')
  })

  test('an authorized approval alone shows Awaiting verification, not the verified text', () => {
    const approved = act(reconstruct('ST11'), { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'APPROVE', invoice: 'INV-48219' })
    expect(approved.approval.decision).toBe('approved')
    expect(approved.readback.status).toBe('pending')
    const markup = render(approved)
    expect(text(markup)).toContain('Awaiting verification')
    expect(text(markup)).not.toContain(APPROVAL_AFTER)
    expect(text(markup)).not.toContain('Variance Hold')
    expect(tag(markup, 'erp-status')).toContain('data-status="awaiting"')
  })

  test('Matched - Variance Approved appears only after the independent readback is verified', () => {
    const approved = act(reconstruct('ST11'), { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'APPROVE', invoice: 'INV-48219' })
    const verified = act(approved, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' })
    expect(text(render(verified))).toContain('Matched - Variance Approved')
    expect(tag(render(verified), 'erp-status')).toContain('data-status="matched"')
    expect(html).not.toContain('lucide-shield-check')
    expect(render(verified)).toContain('lucide-shield-check')
  })

  test('a readback mismatch says so with a reason and never shows the verified text', () => {
    const approved = act(reconstruct('ST11'), { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'APPROVE', invoice: 'INV-48219' })
    const mismatch = render(act(approved, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'mismatch' }))
    expect(text(mismatch)).toContain('Readback mismatch')
    expect(text(mismatch)).toContain('Readback did not confirm the approved change')
    expect(text(mismatch)).not.toContain(APPROVAL_AFTER)
  })

  test('a rejection leaves the hold in place', () => {
    const rejected = act(reconstruct('ST11'), { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'REJECT', invoice: 'INV-48219' })
    const markup = text(render(rejected))
    expect(markup).toContain('Variance Hold')
    expect(markup).toContain('Rejected by Daniel Okafor; the hold stands')
    expect(markup).not.toContain(APPROVAL_AFTER)
  })

  test('INV-48210 shows its total and PO, states no PO total and has no variance block', () => {
    const markup = render(openBill('INV-48210'))
    const readableText = text(markup)
    expect(readableText).toContain('INV-48210')
    expect(readableText).toContain('Invoice total $6,240.00')
    expect(readableText).toContain('PO-1031')
    expect(readableText).toContain('PO total \u2014')
    expect(readableText).toContain('PO total not stated in this record')
    expect(readableText).not.toContain('Variance')
    expect(readableText).not.toContain('%')
    expect(hidden(markup, 'erp-variance')).toBe(true)
    expect(hidden(markup, 'erp-status')).toBe(true)
  })

  test('INV-48203 invents no PO and no total: em dashes and a neutral note', () => {
    const markup = render(openBill('INV-48203'))
    const readableText = text(markup)
    expect(readableText).toContain('INV-48203')
    expect(readableText).toContain('Invoice total \u2014')
    expect(readableText).toContain('PO total \u2014')
    expect(readableText).toContain('Purchase order not stated in this record')
    expect(readableText).not.toMatch(/PO-\d{4}/)
    expect(readableText).not.toMatch(/\$\d/)
    expect(hidden(markup, 'erp-variance')).toBe(true)
  })

  test('INV-48231 shows its own totals and never computes a percentage', () => {
    const markup = render(openBill('INV-48231'))
    const readableText = text(markup)
    expect(readableText).toContain('Kestrel Components')
    expect(readableText).toContain('Invoice total $4,213.50')
    expect(readableText).toContain('PO-1051')
    expect(readableText).toContain('PO total $4,175.00')
    expect(readableText).not.toContain('%')
    expect(readableText).not.toContain('Variance')
    expect(hidden(markup, 'erp-variance')).toBe(true)
  })

  test('every record prints the amounts of its fixture and nothing else', () => {
    for (const record of Object.values(WORK_RECORDS)) {
      const readableText = text(render(openBill(record.id)))
      const dollars = readableText.match(/\$[\d,]+\.\d{2}/g) ?? []
      const expected = [record.totalCents, record.poTotalCents].filter((cents): cents is number => cents !== null).map(formatCents)
      if (record.id === 'INV-48219') expected.push('$440.00')
      expect([...dollars].sort()).toEqual([...expected].sort())
    }
  })

  test('Stage routes to the approval screen; Match purchase order dispatches nothing', () => {
    expect(clickAnchor(initial, 'erp-stage')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC23' }])
    expect(clickAnchor(initial, 'erp-match-action')).toEqual([])
  })

  test('the rail switches views and marks the active section', () => {
    expect(clickText(initial, 'Vendors')).toEqual([{ type: 'OPEN_ERP_VIEW', view: 'vendors' }])
    expect(clickText(act(initial, { type: 'OPEN_ERP_VIEW', view: 'vendors' }), 'Vendor Bill')).toEqual([{ type: 'OPEN_ERP_VIEW', view: 'bill' }])
    expect(count(html, 'aria-current="page"')).toBe(1)
    expect(html).toMatch(/aria-current="page"[^>]*>(?:<[^>]*>)*Vendor Bill/)
    expect(render(act(initial, { type: 'OPEN_ERP_VIEW', view: 'vendors' }))).toMatch(/aria-current="page"[^>]*>(?:<[^>]*>)*Vendors/)
  })
})

describe('APP-04 vendors and the Kestrel vendor record', () => {
  const vendors = act(initial, { type: 'OPEN_ERP_VIEW', view: 'vendors' })

  test('the list names the ten suppliers only and opens a vendor on click', () => {
    const markup = render(vendors)
    for (const supplier of SUPPLIERS) expect(text(markup)).toContain(supplier.name)
    expect(hidden(markup, 'vendor-list')).toBe(false)
    expect(hidden(markup, 'vendor-row-kestrel')).toBe(false)
    expect(hidden(markup, 'vendor-row-brightwater')).toBe(false)
    expect(clickAnchor(vendors, 'vendor-row-kestrel')).toEqual([{ type: 'OPEN_VENDOR', vendorId: 'kestrel' }])
    expect(clickAnchor(vendors, 'vendor-row-brightwater')).toEqual([{ type: 'OPEN_VENDOR', vendorId: 'brightwater' }])
  })

  test('the Kestrel record shows Vendor, the name and its bills, and states no other fields', () => {
    const markup = render(act(vendors, { type: 'OPEN_VENDOR', vendorId: 'kestrel' }))
    const readableText = text(markup)
    expect(readableText).toContain('Vendor')
    expect(readableText).toContain('Kestrel Components')
    expect(readableText).toContain('Open bills')
    expect(readableText).toContain('INV-48231 \u00b7 PO-1051 \u00b7 $4,213.50')
    expect(readableText).toContain('No other fields are stated in this record')
    expect(hidden(markup, 'vendor-record')).toBe(false)
    expect(hidden(markup, 'vendor-name')).toBe(false)
    expect(hidden(markup, 'vendor-list')).toBe(true)
    expect(hidden(markup, 'erp-bill')).toBe(true)
  })

  test('an open bill of the vendor opens its bill, so the record stays usable', () => {
    const record = act(vendors, { type: 'OPEN_VENDOR', vendorId: 'brightwater' })
    expect(text(render(record))).toContain('INV-48219 \u00b7 PO-1042 \u00b7 $18,420.00')
    expect(clickText(record, 'INV-48210 \u00b7 PO-1031 \u00b7 $6,240.00')).toEqual([{ type: 'OPEN_BILL', record: 'INV-48210' }])
  })

  test('a vendor without a bill says so and invents none', () => {
    const markup = text(render(act(vendors, { type: 'OPEN_VENDOR', vendorId: 'harlow' })))
    expect(markup).toContain('Harlow Tooling')
    expect(markup).toContain('No bills are stated for this vendor in these records')
    expect(markup).not.toMatch(/INV-\d{5} \u00b7/)
  })

  test('opening a record from the list leaves the bill hidden and the bill view hides the vendor anchors', () => {
    const billMarkup = render(initial)
    for (const name of ['vendor-list', 'vendor-row-kestrel', 'vendor-row-brightwater', 'vendor-record', 'vendor-name']) expect(hidden(billMarkup, name)).toBe(true)
    for (const name of ['erp-bill', 'erp-po', 'erp-invoice-total', 'po-total', 'erp-match-action', 'erp-stage']) expect(hidden(billMarkup, name)).toBe(false)
    const listMarkup = render(vendors)
    for (const name of ['erp-bill', 'erp-po', 'erp-invoice-total', 'po-total', 'erp-variance', 'erp-status', 'erp-match-action', 'erp-stage', 'vendor-record', 'vendor-name']) expect(hidden(listMarkup, name)).toBe(true)
  })
})

describe('SC04 reminder', () => {
  test('shows the confirmed commitment only in the Kestrel record: title, owner, Fri 12:00 and the qualifier', () => {
    const state = kestrelRecord()
    const markup = render(state)
    const readableText = text(markup)
    expect(readableText).toContain('Confirm Kestrel handling-fee terms in writing')
    expect(readableText).toContain('Priya Nair \u00b7 Fri 12:00')
    expect(readableText).toContain('subject to company approval')
    expect(readableText).not.toContain('Fri 17:00')
    expect(readableText).not.toContain('Known fix from AP East')
    expect(hidden(markup, 'hud-reminder')).toBe(false)
    expect(hidden(markup, 'hud-peer-fix')).toBe(true)
    expect(markup).toContain('aria-label="Dismiss"')
    expect(COMMITMENT.title).toBe('Confirm Kestrel handling-fee terms in writing')
  })

  test('it reads confirmedDue, so an edited deadline reads Fri 15:00', () => {
    const edited = act(reconstruct('ST03'), { type: 'EDIT_COMMITMENT', due: 'Fri 15:00' }, { type: 'CONFIRM_COMMITMENT' }, { type: 'OPEN_SCREEN', screen: 'SC06' }, { type: 'OPEN_VENDOR', vendorId: 'kestrel' })
    expect(edited.commitment.confirmedDue).toBe('Fri 15:00')
    const readableText = text(render(edited))
    expect(readableText).toContain('Priya Nair \u00b7 Fri 15:00')
    expect(readableText).not.toContain('Fri 12:00')
    expect(readableText).not.toContain('Fri 17:00')
  })

  test('no reminder on another vendor or before the commitment is confirmed', () => {
    const other = act(confirmed(), { type: 'OPEN_VENDOR', vendorId: 'brightwater' })
    expect(hidden(render(other), 'hud-reminder')).toBe(true)
    expect(text(render(other))).not.toContain('Confirm Kestrel handling-fee terms in writing')
    const early = act(reconstruct('ST03'), { type: 'OPEN_SCREEN', screen: 'SC06' }, { type: 'OPEN_VENDOR', vendorId: 'kestrel' })
    expect(early.commitment.status).not.toBe('confirmed')
    expect(hidden(render(early), 'hud-reminder')).toBe(true)
    expect(text(render(early))).not.toContain('Confirm Kestrel handling-fee terms in writing')
  })

  test('Dismiss hides only the card and changes no business state; Escape dismisses too', () => {
    const state = kestrelRecord()
    expect(run(state, (element) => element.props['aria-label'] === 'Dismiss', 'onClick', undefined)).toEqual([{ type: 'DISMISS_HUD' }])
    expect(run(state, (element) => element.type === 'aside', 'onKeyDown', { key: 'Escape', stopPropagation: () => undefined })).toEqual([{ type: 'DISMISS_HUD' }])
    expect(run(state, (element) => element.type === 'aside', 'onKeyDown', { key: 'Enter', stopPropagation: () => undefined })).toEqual([])
    const dismissed = act(state, { type: 'DISMISS_HUD' })
    expect(hidden(render(dismissed), 'hud-reminder')).toBe(true)
    expect(text(render(dismissed))).toContain('Kestrel Components')
    expect(dismissed.commitment).toEqual(state.commitment)
    expect(dismissed.approval).toEqual(state.approval)
    expect(dismissed.job).toEqual(state.job)
    expect(dismissed.phase).toBe(state.phase)
    // Reopening the Kestrel context shows the reminder once more.
    const reopened = act(dismissed, { type: 'OPEN_ERP_VIEW', view: 'vendors' }, { type: 'OPEN_VENDOR', vendorId: 'kestrel' })
    expect(hidden(render(reopened), 'hud-reminder')).toBe(false)
  })
})

describe('SC04 peer fix and Guide Me', () => {
  const start = peerFix()

  test('shows the published fix with Guide Me and Dismiss, and no reminder', () => {
    const markup = render(start)
    const readableText = text(markup)
    expect(readableText).toContain('Known fix from AP East: Vendor tax ID format')
    expect(readableText).toContain('Published guidance')
    expect(readableText).toContain('Guide Me')
    expect(readableText).not.toContain('Confirm Kestrel handling-fee terms in writing')
    expect(hidden(markup, 'hud-peer-fix')).toBe(false)
    expect(hidden(markup, 'hud-reminder')).toBe(true)
    expect(hidden(markup, 'guide-me')).toBe(false)
    for (const name of ['guide-next', 'guide-back', 'guide-done']) expect(hidden(markup, name)).toBe(true)
    expect(clickText(start, 'Guide Me')).toEqual([{ type: 'OPEN_GUIDE' }])
  })

  test('the guide advances only by Next, Back and Done', () => {
    const one = act(start, { type: 'OPEN_GUIDE' })
    const markup1 = render(one)
    expect(text(markup1)).toContain('Step 1 of 3')
    expect(text(markup1)).toContain('Check the vendor tax ID format')
    expect(hidden(markup1, 'guide-me')).toBe(true)
    expect(hidden(markup1, 'guide-next')).toBe(false)
    expect(hidden(markup1, 'guide-done')).toBe(true)
    expect(text(markup1)).not.toContain('Known fix from AP East')

    expect(tag(markup1, 'guide-back')).toBeDefined()
    expect(markup1).toMatch(/aria-disabled="true"[^>]*aria-describedby="hud-back-reason"|aria-describedby="hud-back-reason"[^>]*aria-disabled="true"/)
    expect(text(markup1)).toContain('Step 1 is the first step.')
    expect(run(one, (element) => element.type === 'button' && textOf(childrenOf(element.props)).trim() === 'Back', 'onClick', undefined)).toEqual([])

    const two = act(one, { type: 'GUIDE_NEXT' })
    expect(text(render(two))).toContain('Step 2 of 3')
    expect(text(render(two))).toContain('Update the permitted field')
    expect(text(render(two))).not.toContain('Step 1 is the first step.')
    expect(render(two)).not.toContain('aria-disabled="true"')

    const three = act(two, { type: 'GUIDE_NEXT' })
    const markup3 = render(three)
    expect(text(markup3)).toContain('Step 3 of 3')
    expect(text(markup3)).toContain('Review the result')
    expect(hidden(markup3, 'guide-next')).toBe(true)
    expect(hidden(markup3, 'guide-done')).toBe(false)

    expect(text(render(act(three, { type: 'GUIDE_BACK' })))).toContain('Step 2 of 3')
    expect(clickText(two, 'Next')).toEqual([{ type: 'GUIDE_NEXT' }])
    expect(clickText(two, 'Back')).toEqual([{ type: 'GUIDE_BACK' }])
    expect(clickText(three, 'Done')).toEqual([{ type: 'GUIDE_DONE' }])
  })

  test('completing guidance says the source case stays open and resolves nothing', () => {
    const done = act(start, { type: 'OPEN_GUIDE' }, { type: 'GUIDE_NEXT' }, { type: 'GUIDE_NEXT' }, { type: 'GUIDE_DONE' })
    const markup = render(done)
    expect(text(markup)).toContain('Guidance complete')
    expect(text(markup)).toContain('The source case stays open.')
    for (const name of ['guide-me', 'guide-next', 'guide-back', 'guide-done']) expect(hidden(markup, name)).toBe(true)
    expect(hidden(markup, 'hud-dismiss')).toBe(false)
    for (const key of ['commitment', 'approval', 'readback', 'job', 'incident', 'selectedCase', 'phase'] as const) expect(done[key]).toEqual(start[key])
  })

  test('dismissing hides the card and leaves every business field unchanged', () => {
    const open = act(start, { type: 'OPEN_GUIDE' }, { type: 'GUIDE_NEXT' })
    const dismissed = act(open, { type: 'DISMISS_HUD' })
    const markup = render(dismissed)
    expect(hidden(markup, 'hud-peer-fix')).toBe(true)
    expect(text(markup)).not.toContain('Known fix from AP East')
    expect(text(markup)).not.toContain('Step 2 of 3')
    for (const key of ['commitment', 'approval', 'readback', 'job', 'incident', 'selectedCase', 'phase'] as const) expect(dismissed[key]).toEqual(start[key])
  })

  test('the card box never changes with the guide step', () => {
    const steps = [start, act(start, { type: 'OPEN_GUIDE' }), act(start, { type: 'OPEN_GUIDE' }, { type: 'GUIDE_NEXT' }), act(start, { type: 'OPEN_GUIDE' }, { type: 'GUIDE_NEXT' }, { type: 'GUIDE_NEXT' })]
    const boxes = steps.map((state) => styleRect(tag(render(state), 'hud-peer-fix')))
    for (const box of boxes) expect(box).toEqual({ x: 0, y: 0, width: 320, height: 144 })
    const asides = steps.map((state) => styleRect(render(state).match(/<aside[^>]*>/)?.[0] ?? ''))
    for (const aside of asides) expect(aside).toEqual(asides.at(0) ?? { x: -1, y: -1, width: -1, height: -1 })
  })
})

describe('anchors and geometry', () => {
  test('every anchor is rendered exactly once in every view', () => {
    const states = [initial, act(initial, { type: 'OPEN_ERP_VIEW', view: 'vendors' }), kestrelRecord(), peerFix(), act(peerFix(), { type: 'OPEN_GUIDE' })]
    for (const state of states) {
      const markup = render(state)
      for (const name of ERP_ANCHORS) expect(count(markup, `data-film-anchor="${name}"`)).toBe(1)
      expect(count(markup, 'data-film-anchor=')).toBe(ERP_ANCHORS.length)
    }
  })

  test('declared rectangles equal the rendered ones', () => {
    const bill = render(initial)
    for (const name of ['erp-bill', 'erp-po', 'erp-match-action', 'erp-stage'] as const) expect(toCanvas(styleRect(tag(bill, name)))).toEqual(ERP_ANCHOR_RECTS[name])
    for (const name of ['erp-invoice-total', 'erp-variance', 'erp-status'] as const) expect(origin(styleRect(tag(bill, name)), BILL_PANEL)).toEqual(ERP_ANCHOR_RECTS[name])
    expect(origin(styleRect(tag(bill, 'po-total')), PO_PANEL)).toEqual(ERP_ANCHOR_RECTS['po-total'])
    expect(ERP_ANCHOR_RECTS['erp-bill']).toEqual({ x: 240, y: 152, width: 464, height: 420 })
    expect(ERP_ANCHOR_RECTS['erp-po']).toEqual({ x: 728, y: 152, width: 456, height: 420 })
    expect(ERP_ANCHOR_RECTS['vendor-record']).toEqual({ x: 240, y: 152, width: 920, height: 420 })
    expect(ERP_ANCHOR_RECTS['vendor-name']).toEqual({ x: 272, y: 180, width: 600, height: 40 })

    const list = render(act(initial, { type: 'OPEN_ERP_VIEW', view: 'vendors' }))
    expect(toCanvas(styleRect(tag(list, 'vendor-list')))).toEqual(ERP_ANCHOR_RECTS['vendor-list'])
    for (const name of ['vendor-row-kestrel', 'vendor-row-brightwater'] as const) expect(origin(styleRect(tag(list, name)), VENDOR_CARD)).toEqual(ERP_ANCHOR_RECTS[name])
    const record = render(kestrelRecord())
    expect(toCanvas(styleRect(tag(record, 'vendor-record')))).toEqual(ERP_ANCHOR_RECTS['vendor-record'])
    expect(origin(styleRect(tag(record, 'vendor-name')), VENDOR_CARD)).toEqual(ERP_ANCHOR_RECTS['vendor-name'])
  })

  test('content stays above the Dock and out of the HUD zones', () => {
    for (const name of ERP_ANCHORS) {
      const rect = ERP_ANCHOR_RECTS[name]
      expect(rect.y + rect.height).toBeLessThanOrEqual(646)
    }
    for (const name of ['po-total', 'erp-invoice-total', 'erp-variance', 'erp-status', 'vendor-row-kestrel', 'vendor-row-brightwater', 'vendor-name'] as const) {
      const rect = ERP_ANCHOR_RECTS[name]
      expect(rect.x + rect.width).toBeLessThanOrEqual(880)
    }
  })

  for (const placement of ['upper', 'lower'] as const) {
    test(`the card and its controls sit at their ${placement} rectangles`, () => {
      const rects = hudAnchorRects(placement)
      expect(HUD_RECTS[placement]).toEqual(rects['hud-peer-fix'])
      for (const state of [withPlacement(kestrelRecord(), placement), withPlacement(act(peerFix(), { type: 'OPEN_GUIDE' }), placement)]) {
        const markup = render(state)
        const aside = toCanvas(styleRect(markup.match(/<aside[^>]*>/)?.[0] ?? ''))
        expect(aside).toEqual(rects['hud-reminder'])
        for (const name of hudAnchors) expect(origin(styleRect(tag(markup, name)), aside)).toEqual({ ...rects[name], x: rects[name].x, y: rects[name].y })
      }
    })
  }

  test('the upper card never covers the record and the lower card never covers a field', () => {
    for (const placement of ['upper', 'lower'] as const) {
      const card = HUD_RECTS[placement]
      for (const name of ['erp-invoice-total', 'po-total', 'erp-variance', 'erp-status', 'vendor-name'] as const) {
        const rect = ERP_ANCHOR_RECTS[name]
        const overlaps = rect.x < card.x + card.width && rect.x + rect.width > card.x && rect.y < card.y + card.height && rect.y + rect.height > card.y
        expect(overlaps).toBe(false)
      }
    }
  })
})

describe('film determinism and motion', () => {
  const reminder = kestrelRecord()

  test('equal state and frame render equal markup; a film has no transition, animation, style sheet or cyan', () => {
    const film = filmAt(7, { OPEN_VENDOR: 5 })
    expect(render(reminder, film)).toBe(render(reminder, film))
    for (const state of [initial, reminder, act(peerFix(), { type: 'OPEN_GUIDE' })]) {
      const markup = render(state, filmAt(3, { OPEN_VENDOR: 1, OPEN_SCREEN: 1, OPEN_GUIDE: 2 }))
      expect(markup).not.toMatch(/transition|animate-|animation|<style|keyframes/i)
      expect(markup).not.toMatch(/--arc|bg-arc|text-arc|border-arc|text-trace|2fd8ff/i)
    }
  })

  test('no cyan in the clickable app either', () => {
    for (const state of [initial, reminder, act(peerFix(), { type: 'OPEN_GUIDE' })]) expect(render(state)).not.toMatch(/--arc|bg-arc|text-arc|border-arc|text-trace|2fd8ff/i)
  })

  test('the entry settles the inner layer, never the anchored box', () => {
    const settled = render(reminder, filmAt(60, { OPEN_VENDOR: 0 }))
    const early = render(reminder, filmAt(1, { OPEN_VENDOR: 0 }))
    expect(tag(early, 'hud-reminder')).toBe(tag(settled, 'hud-reminder'))
    expect(tag(early, 'hud-dismiss')).toBe(tag(settled, 'hud-dismiss'))
    expect(early).toMatch(/opacity:0\.\d+;transform:translateY\(-\d+(\.\d+)?px\)/)
    expect(settled).not.toContain('translateY')
    expect(settled).not.toMatch(/opacity:/)
  })

  test('the long cut fades and settles horizontally by at most 20 px', () => {
    const long = act(reminder, { type: 'PLACE_HUD', placement: 'upper', motion: 'long' })
    const early = render(long, filmAt(2, { OPEN_VENDOR: 0 }))
    const shift = Number(early.match(/translateX\((\d+(?:\.\d+)?)px\)/)?.[1])
    expect(shift).toBeGreaterThan(0)
    expect(shift).toBeLessThanOrEqual(20)
    expect(early).not.toContain('translateY')
    expect(render(long, filmAt(30, { OPEN_VENDOR: 0 }))).not.toContain('translateX')
  })

  test('reduced motion shows the settled card', () => {
    expect(render(reminder, { ...filmAt(1, { OPEN_VENDOR: 0 }), reducedMotion: true })).not.toMatch(/opacity:|translate/)
  })

  test('the peer fix enters from OPEN_SCREEN', () => {
    expect(render(peerFix(), filmAt(1, { OPEN_SCREEN: 0 }))).toMatch(/opacity:0\.\d+/)
    expect(render(peerFix(), filmAt(60, { OPEN_SCREEN: 0 }))).not.toMatch(/opacity:/)
  })
})
