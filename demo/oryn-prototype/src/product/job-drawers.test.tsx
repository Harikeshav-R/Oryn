import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { formatCents } from '@/data/invoices'
import { varianceDisplay } from '@/data/approval'
import type { Rect } from '@/film'
import { approvalBlock, jobCounts, reconstruct, transition } from '@/state'
import type { Action, State } from '@/state'
import { act as run } from '@/state/test-helpers'
import type { FilmContext } from './contract'
import { DRAWER, DRAWER_PARTS } from './candidate-layout'
import { JobDrawers } from './JobDrawers'
import { JOB_ANCHOR_RECTS } from './job-layout'

/** SC23 approval drawer and SC24 unknown-outcome drawer over the SC22 case table. */

type Props = Record<string, unknown>

const html = (state: State, film?: FilmContext): string => renderToStaticMarkup(<JobDrawers state={state} film={film} />)
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
const text = (markup: string): string => plain(markup.replace(/<[^>]*>/g, ''))

const openingTag = (markup: string, name: string): string => {
  const tag = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return tag
}
const hidden = (markup: string, name: string): boolean => openingTag(markup, name).includes('display:none')
const disabled = (markup: string, name: string): boolean => openingTag(markup, name).includes('aria-disabled="true"')

/** Markup of the element carrying an anchor, from its opening tag to its matching closing tag. */
function elementOf(markup: string, name: string): string {
  const tag = openingTag(markup, name)
  const start = markup.indexOf(tag)
  const tagName = (tag.match(/^<(\w+)/) as RegExpMatchArray)[1]
  const tags = new RegExp(`<${tagName}\\b|</${tagName}>`, 'g')
  tags.lastIndex = start
  let depth = 0
  for (let found = tags.exec(markup); found; found = tags.exec(markup)) {
    depth += found[0].startsWith('</') ? -1 : 1
    if (depth === 0) return markup.slice(start, tags.lastIndex)
  }
  throw new Error(`Anchor ${name} is not closed`)
}

/** The canvas rectangle an anchored element is placed at: its authored style plus the origin of the parent it is positioned in (frame: canvas, buttons: drawer, body parts: drawer body). */
function rectOf(markup: string, name: string): Rect {
  const style = openingTag(markup, name).match(/style="([^"]*)"/)?.[1] ?? ''
  const value = (property: string): number => Number(style.match(new RegExp(`(?:^|;)${property}:(-?\\d+)(?:px)?`))?.[1])
  const origin = name === 'approval-drawer' || name === 'unknown-case' ? { x: 0, y: 0 } : BUTTONS.includes(name) ? { x: DRAWER.x, y: DRAWER.y } : { x: DRAWER.x + DRAWER_PARTS.body.x, y: DRAWER.y + DRAWER_PARTS.body.y }
  return { x: origin.x + value('left'), y: origin.y + value('top'), width: value('width'), height: value('height') }
}
const BUTTONS: readonly string[] = ['approve', 'reject', 'request-changes', 'approval-close', 'investigate', 'unknown-close']

const authored = (name: string): Rect => JOB_ANCHOR_RECTS[name as keyof typeof JOB_ANCHOR_RECTS] as Rect
const filmAt = (frame: number, applied: Partial<Record<Action['type'], number>> = {}): FilmContext => ({ frame, reducedMotion: false, lastApplied: (type) => applied[type] ?? null })
const layerOpacity = (markup: string): number => Number(markup.match(/data-layer="job-drawer"[^>]*style="[^"]*opacity:([\d.]+)/)?.[1])

/** Every element of the drawers. `ModalLayer` owns the focus hooks and is entered through its children. */
function elementsOf(node: ReactNode, out: ReactElement<Props>[] = []): ReactElement<Props>[] {
  if (Array.isArray(node)) {
    node.forEach((child) => elementsOf(child as ReactNode, out))
    return out
  }
  if (!isValidElement<Props>(node)) return out
  out.push(node)
  const render = node.type as ((props: Props) => ReactNode) & { readonly name?: string }
  if (typeof render === 'function' && render.name !== 'ModalLayer') return elementsOf(render(node.props), out)
  return elementsOf(node.props.children as ReactNode, out)
}

/** Fire the handler of the one element `pick` selects and return every action it dispatched. */
function fire(state: State, pick: (props: Props) => boolean, handler: string, event: Props): Action[] {
  const dispatched: Action[] = []
  const element = elementsOf(<JobDrawers state={state} dispatch={(action) => dispatched.push(action)} />).find((candidate) => pick(candidate.props) && typeof candidate.props[handler] === 'function')
  if (!element) throw new Error('No element matches')
  ;(element.props[handler] as (event: Props) => void)(event)
  return dispatched
}
const clickAnchor = (state: State, name: string): Action[] => fire(state, (props) => props['data-film-anchor'] === name, 'onClick', { preventDefault: () => undefined })
const clickLabel = (state: State, label: string): Action[] => fire(state, (props) => props['aria-label'] === label, 'onClick', { preventDefault: () => undefined })

/** Cyan: the orbit node of a running glyph, the progress fill while executing, or any arc colour class. */
const CYAN = /(?:text|bg|border|ring|stroke|fill)-(?:arc|trace)\b|data-running="true"|data-executing="true"|var\(--arc-mark\)/
const SUCCESS = /(?:text|bg|border)-success\b|data-status="verified"/

const APPROVAL = ['approval-drawer', 'approval-diff', 'approval-authority', 'approval-evidence', 'approve', 'reject', 'request-changes', 'readback', 'approval-close'] as const
const UNKNOWN = ['unknown-case', 'unknown-hold', 'resubmit-unavailable', 'unknown-evidence', 'investigate', 'unknown-close'] as const
const ALL = [...APPROVAL, ...UNKNOWN]

const decisionButtons = ['approve', 'reject', 'request-changes'] as const
const INVOICE = 'INV-48219'

const atJob = reconstruct('ST11')
const daniel = run(atJob, { type: 'SELECT_ACTOR', personId: 'daniel' })
const open = (state: State, screen: 'SC22' | 'SC23' | 'SC24'): State => run(state, { type: 'OPEN_SCREEN', screen })
const pending = open(daniel, 'SC23')
const approved = run(pending, { type: 'APPROVE', invoice: INVOICE })
const verified = run(approved, { type: 'VERIFY_READBACK', invoice: INVOICE, result: 'verified' })
const mismatch = run(approved, { type: 'VERIFY_READBACK', invoice: INVOICE, result: 'mismatch' })
const rejected = run(pending, { type: 'REJECT', invoice: INVOICE })
const changes = run(pending, { type: 'REQUEST_CHANGES', invoice: INVOICE })
const marcus = open(run(atJob, { type: 'SELECT_ACTOR', personId: 'marcus' }), 'SC23')
const unknownOpen = open(daniel, 'SC24')

test('unknown evidence separates the timeout record from the unverified business postcondition', () => {
  const markup = text(html(unknownOpen))
  expect(markup).toContain('NetSuite ERP timeout record')
  expect(markup).toContain('Business postcondition')
  expect(markup).toContain('Independent readback unavailable')
})

describe('SC23 pending approval', () => {
  const markup = html(pending)
  const body = text(markup)

  test('names the invoice, the exact amounts and the 2.45% variance from the fixtures', () => {
    expect(body).toContain('INV-48219')
    expect(body).toContain('Brightwater Industrial \u00b7 PO-1042 \u00b7 AP-RULE-009')
    expect(body).toContain('Invoice $18,420.00')
    expect(body).toContain('PO-1042 $17,980.00')
    expect(body).toContain('Variance $440.00 / 2.45%')
    expect(varianceDisplay()).toBe('$440.00 / 2.45%')
    expect(formatCents(1_842_000)).toBe('$18,420.00')
  })

  test('shows the before and after diff, the named approver and the scoped authority', () => {
    const diff = text(elementOf(markup, 'approval-diff'))
    expect(diff).toContain('Before: Variance Hold')
    expect(diff).toContain('After: Matched - Variance Approved')
    expect(diff).toContain('Viewing this comparison changes nothing.')
    const authority = text(elementOf(markup, 'approval-authority'))
    expect(authority).toContain('Daniel Okafor \u00b7 Tier 3')
    expect(authority).toContain('Authority confirmed \u00b7 scoped to INV-48219, AP East, 2.00%')
  })

  test('lists the three sources with their exact labels', () => {
    const evidence = text(elementOf(markup, 'approval-evidence'))
    for (const label of ['Invoice INV-48219 document', 'NetSuite bill and PO-1042', 'AP-RULE-009']) expect(evidence).toContain(label)
    expect(elementOf(markup, 'approval-evidence')).toContain('aria-expanded="false"')
  })

  test('nothing is decided, verified or counted: readback is not requested and no success glyph shows', () => {
    expect(body).toContain('Pending Tier 3 approval')
    expect(text(elementOf(markup, 'readback'))).toBe('Independent readback: not requested')
    expect(body).not.toContain('Verified Complete')
    expect(body).not.toContain('Awaiting verification')
    expect(markup).not.toMatch(SUCCESS)
    expect(jobCounts(pending)).toMatchObject({ verified: 7, escalated: 2, approval: 1, unknown: 1 })
  })

  test('Daniel can decide: the three decision buttons and Close are enabled', () => {
    for (const name of [...decisionButtons, 'approval-close']) expect(disabled(markup, name)).toBe(false)
    expect(body).toContain('Approve')
    expect(body).toContain('Reject')
    expect(body).toContain('Request Changes')
  })

  test('each decision is its own action for INV-48219, and Close and Escape only return to SC22', () => {
    expect(clickAnchor(pending, 'approve')).toEqual([{ type: 'APPROVE', invoice: INVOICE }])
    expect(clickAnchor(pending, 'reject')).toEqual([{ type: 'REJECT', invoice: INVOICE }])
    expect(clickAnchor(pending, 'request-changes')).toEqual([{ type: 'REQUEST_CHANGES', invoice: INVOICE }])
    expect(clickAnchor(pending, 'approval-close')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC22' }])
    const escape = fire(pending, (props) => props['data-film-anchor'] === 'approval-drawer', 'onKeyDown', { key: 'Escape', stopPropagation: () => undefined })
    expect(escape).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC22' }])
    const scrim = fire(pending, (props) => props.className === 'bg-black/80', 'onClick', {})
    expect(scrim).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC22' }])
  })

  test('uses no cyan and no unknown outcome', () => {
    expect(markup).not.toMatch(CYAN)
    expect(body).not.toContain('Outcome Unknown')
  })
})

/** Click the evidence button whose visible text is `label`. */
const byText = (state: State, label: string): Action[] =>
  fire(state, (props) => props['aria-expanded'] !== undefined && props['aria-label'] !== 'About resubmission' && text(renderToStaticMarkup(<>{props.children as ReactNode}</>)).includes(label), 'onClick', {})
const heading = (state: State): Action[] => fire(state, (props) => props.children === 'Evidence' && typeof props.onClick === 'function', 'onClick', {})

describe('SC23 evidence expanded', () => {
  const expanded = run(pending, { type: 'SET_JOB_VIEW', evidence: true })
  const markup = html(expanded)

  test('the source links become cards that keep their labels', () => {
    const evidence = elementOf(markup, 'approval-evidence')
    expect(evidence).toContain('aria-expanded="true"')
    for (const label of ['Invoice INV-48219 document', 'NetSuite bill and PO-1042', 'AP-RULE-009']) expect(text(evidence)).toContain(label)
    expect(text(evidence)).toContain('$18,420.00')
    expect(text(evidence)).toContain('PO $17,980.00')
    expect(text(evidence)).toContain('Above 2.00%')
    expect(markup).toContain('aria-label="Invoice INV-48219 document"')
  })

  test('the invoice document and the NetSuite bill open their own source; neither toggles the disclosure', () => {
    for (const state of [pending, expanded]) {
      const invoice = byText(state, 'Invoice INV-48219 document')
      expect(invoice).toEqual([{ type: 'OPEN_MESSAGE', record: 'INV-48219' }, { type: 'OPEN_ATTACHMENT' }, { type: 'OPEN_SCREEN', screen: 'SC05' }])
      const bill = byText(state, 'NetSuite bill and PO-1042')
      expect(bill).toEqual([{ type: 'OPEN_BILL', record: 'INV-48219' }, { type: 'OPEN_SCREEN', screen: 'SC06' }])
      expect(run(state, ...invoice).route).toBe('SC05')
      expect(run(state, ...bill).route).toBe('SC06')
    }
  })

  test('the rule item and the Evidence heading expand a collapsed list and collapse an expanded one', () => {
    expect(byText(pending, 'AP-RULE-009')).toEqual([{ type: 'SET_JOB_VIEW', evidence: true }])
    expect(byText(expanded, 'AP-RULE-009')).toEqual([{ type: 'SET_JOB_VIEW', evidence: false }])
    expect(heading(pending)).toEqual([{ type: 'SET_JOB_VIEW', evidence: true }])
    expect(heading(expanded)).toEqual([{ type: 'SET_JOB_VIEW', evidence: false }])
  })

  test('the cards fade in over 150 ms in a film and are static in the app', () => {
    const landed = (frame: number) => filmAt(frame, { SET_JOB_VIEW: 10 })
    const opacityAt = (frame: number) => Number(elementOf(html(expanded, landed(frame)), 'approval-evidence').match(/opacity:([\d.]+)/)?.[1])
    expect(opacityAt(10)).toBeLessThan(1)
    expect(opacityAt(40)).toBe(1)
    expect(elementOf(markup, 'approval-evidence')).not.toContain('opacity:0')
  })

  test('the anchored rectangle does not change when it expands', () => {
    expect(rectOf(markup, 'approval-evidence')).toEqual(authored('approval-evidence'))
  })
})

describe('SC23 decision and independent readback stay separate', () => {
  test('approved: awaiting verification, never Verified Complete, no success glyph, counts unchanged', () => {
    const markup = html(approved)
    const body = text(markup)
    expect(body).toContain('Approved by Daniel Okafor \u00b7 awaiting independent verification')
    expect(text(elementOf(markup, 'readback'))).toContain('Awaiting verification')
    expect(body).not.toContain('Verified Complete')
    expect(markup).not.toMatch(SUCCESS)
    expect(markup).not.toMatch(CYAN)
    expect(jobCounts(approved)).toMatchObject({ verified: 7, escalated: 2, approval: 1, unknown: 1 })
  })

  test('after a decision every decision button is disabled with the reducer reason; Close stays available', () => {
    for (const state of [approved, rejected, changes, verified]) {
      const markup = html(state)
      for (const name of decisionButtons) {
        expect(disabled(markup, name)).toBe(true)
        const reason = state === verified ? 'INV-48219 is not waiting for approval.' : 'A decision is already recorded for this case.'
        expect(text(elementOf(markup, name))).toContain(`Unavailable: ${reason}`)
      }
      expect(disabled(markup, 'approval-close')).toBe(false)
    }
  })

  test('an independent readback is the only thing that shows Verified Complete, and its success glyph', () => {
    const markup = html(verified)
    const readback = text(elementOf(markup, 'readback'))
    expect(readback).toContain('Independent NetSuite readback:')
    expect(readback).toContain('Matched - Variance Approved')
    expect(readback).toContain('Verified Complete')
    expect(text(markup).split('Verified Complete')).toHaveLength(2)
    expect(markup).toMatch(SUCCESS)
    expect(markup).not.toMatch(CYAN)
    expect(text(markup)).toContain('Approved by Daniel Okafor')
    expect(text(markup)).not.toContain('awaiting independent verification')
    expect(jobCounts(verified)).toMatchObject({ verified: 8, escalated: 2, approval: 0, unknown: 1 })
  })

  test('a readback mismatch is not verified and shows no success', () => {
    const markup = html(mismatch)
    expect(text(elementOf(markup, 'readback'))).toBe('Readback mismatch \u00b7 not verified')
    expect(text(markup)).not.toContain('Verified Complete')
    expect(markup).not.toMatch(SUCCESS)
  })

  test('rejected and changes requested are their own text, with no readback to wait for', () => {
    const rejectedMarkup = html(rejected)
    expect(text(rejectedMarkup)).toContain('Rejected by Daniel Okafor')
    expect(text(rejectedMarkup)).not.toContain('Approved by')
    expect(text(elementOf(rejectedMarkup, 'readback'))).toBe('Independent readback: not requested')
    const changesMarkup = html(changes)
    expect(text(changesMarkup)).toContain('Changes requested by Daniel Okafor')
    expect(text(changesMarkup)).not.toContain('Approved by')
    expect(text(elementOf(changesMarkup, 'readback'))).toBe('Independent readback: not requested')
    for (const markup of [rejectedMarkup, changesMarkup]) expect(markup).not.toMatch(SUCCESS)
  })

  test('the authority line still reads confirmed for Daniel after he decided', () => {
    expect(text(html(approved))).toContain('Authority confirmed \u00b7 scoped to INV-48219, AP East, 2.00%')
  })
})

describe('SC23 another viewpoint', () => {
  const markup = html(marcus)

  test('Marcus holds no Tier 3 delegation: the authority card and Approve give the reducer reason', () => {
    const reason = approvalBlock(marcus)
    expect(reason).toBeTruthy()
    expect(text(elementOf(markup, 'approval-authority'))).toContain(reason as string)
    expect(text(elementOf(markup, 'approval-authority'))).not.toContain('Authority confirmed')
    for (const name of decisionButtons) {
      expect(disabled(markup, name)).toBe(true)
      expect(text(elementOf(markup, name))).toContain(`Unavailable: ${reason}`)
    }
    expect(transition(marcus, { type: 'APPROVE', invoice: INVOICE }).ok).toBe(false)
  })

  test('the drawer is still readable and closes', () => {
    expect(text(markup)).toContain('Variance $440.00 / 2.45%')
    expect(disabled(markup, 'approval-close')).toBe(false)
  })

  test('an Employee viewpoint gets no drawer at all', () => {
    const priya = run(marcus, { type: 'SELECT_ACTOR', personId: 'priya' })
    const denied = html(priya)
    expect(text(denied)).toBe('')
    for (const name of ALL) expect(hidden(denied, name)).toBe(true)
  })
})

describe('SC24 unknown outcome', () => {
  const markup = html(unknownOpen)
  const body = text(markup)

  test('shows the invoice facts and the hold, with every exact label', () => {
    expect(body).toContain('INV-48220')
    expect(body).toContain('Northgate Pallets \u00b7 $2,732.50 \u00b7 PO-1044')
    for (const fact of ['Invoice', 'INV-48220', 'Supplier', 'Northgate Pallets', 'Amount', '$2,732.50', 'PO', 'PO-1044']) expect(body).toContain(fact)
    const hold = text(elementOf(markup, 'unknown-hold'))
    for (const label of ['Outcome Unknown', 'ERP submit timed out', 'Held', 'Reconciliation required', 'Not resubmitted']) expect(hold).toContain(label)
    expect(body).toContain('Held \u2014 check outcome before further action')
    expect(body).toContain('Do not resubmit until reconciled')
  })

  test('the hatch sits beside the labels, never behind text', () => {
    const hold = elementOf(markup, 'unknown-hold')
    expect(hold).toContain('data-hatch="neutral"')
    expect(hold).toMatch(/<span aria-hidden="true" data-hatch="neutral"[^>]*><\/span>/)
  })

  test('the missing independent readback is explicit and nothing says verified', () => {
    const evidence = text(elementOf(markup, 'unknown-evidence'))
    expect(evidence).toContain('Business postcondition')
    expect(evidence).toContain('Independent readback unavailable')
    expect(evidence).not.toContain('Investigation opened')
    expect(body).not.toContain('Verified Complete')
    expect(markup).not.toMatch(SUCCESS)
    expect(markup).not.toMatch(CYAN)
  })

  test('there is no retry, resubmit or decision control: Resubmit unavailable is status text', () => {
    const buttons = [...markup.matchAll(/<button\b[^>]*>(.*?)<\/button>/g)].map((match) => text(match[1] as string))
    expect(buttons).toEqual(['', 'NetSuite ERP timeout record', 'Investigate', 'Close'])
    expect(markup).toContain('aria-label="About resubmission"')
    expect(body).toContain('Resubmit unavailable')
    expect(body).not.toMatch(/Retry|Resubmit(?! unavailable)/)
    for (const label of ['Approve', 'Reject', 'Request Changes']) expect(body).not.toContain(label)
    expect(text(elementOf(markup, 'resubmit-unavailable'))).toBe('Resubmit unavailable')
    expect(openingTag(markup, 'resubmit-unavailable')).not.toContain('<button')
  })

  test('timeout evidence opens the selected case in NetSuite', () => {
    expect(clickLabel(unknownOpen, 'Open NetSuite ERP timeout record')).toEqual([
      { type: 'SELECT_CASE', caseId: 'INV-48220' },
      { type: 'SELECT_APP_TAB', tab: 'netsuite' },
      { type: 'OPEN_SCREEN', screen: 'SC06' },
    ])
  })

  test('the resubmission note shows only after the info control is used', () => {
    const tip = 'A timeout proves neither failure nor submission. Do not resubmit until reconciled.'
    expect(body).not.toContain(tip)
    expect(clickLabel(unknownOpen, 'About resubmission')).toEqual([{ type: 'SET_JOB_VIEW', tip: true }])
    const shown = run(unknownOpen, { type: 'SET_JOB_VIEW', tip: true })
    expect(text(html(shown))).toContain(tip)
    expect(clickLabel(shown, 'About resubmission')).toEqual([{ type: 'SET_JOB_VIEW', tip: false }])
    expect(text(html(shown))).not.toMatch(/Retry/)
  })

  test('hover and keyboard focus reveal the note, and leaving or blurring hides it', () => {
    const shown = run(unknownOpen, { type: 'SET_JOB_VIEW', tip: true })
    const info = (handler: string) => (state: State) => fire(state, (props) => props['aria-label'] === 'About resubmission', handler, {})
    for (const handler of ['onMouseEnter', 'onFocus']) {
      expect(info(handler)(unknownOpen)).toEqual([{ type: 'SET_JOB_VIEW', tip: true }])
      expect(info(handler)(shown)).toEqual([])
    }
    for (const handler of ['onMouseLeave', 'onBlur']) {
      expect(info(handler)(shown)).toEqual([{ type: 'SET_JOB_VIEW', tip: false }])
      expect(info(handler)(unknownOpen)).toEqual([])
    }
    const revealed = run(unknownOpen, ...info('onFocus')(unknownOpen))
    expect(text(html(revealed))).toContain('A timeout proves neither failure nor submission.')
    expect(text(html(run(revealed, ...info('onBlur')(revealed))))).not.toContain('A timeout proves neither failure nor submission.')
  })

  test('Investigate opens the investigation and stays; the evidence still never says verified', () => {
    expect(clickAnchor(unknownOpen, 'investigate')).toEqual([{ type: 'SET_JOB_VIEW', investigating: true }])
    const investigating = run(unknownOpen, { type: 'SET_JOB_VIEW', investigating: true })
    const opened = html(investigating)
    const evidence = text(elementOf(opened, 'unknown-evidence'))
    for (const line of ['Investigation opened', 'ERP submit timed out', 'Independent readback unavailable']) expect(evidence).toContain(line)
    expect(text(opened)).toContain('Investigation open')
    expect(disabled(opened, 'investigate')).toBe(false)
    expect(text(opened)).not.toContain('Verified Complete')
    expect(opened).not.toMatch(CYAN)
    expect(opened).not.toMatch(SUCCESS)
    expect(jobCounts(investigating)).toMatchObject({ verified: 7, escalated: 2, approval: 1, unknown: 1 })
  })

  test('Close and Escape only return to SC22', () => {
    expect(clickAnchor(unknownOpen, 'unknown-close')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC22' }])
    const escape = fire(unknownOpen, (props) => props['data-film-anchor'] === 'unknown-case', 'onKeyDown', { key: 'Escape', stopPropagation: () => undefined })
    expect(escape).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC22' }])
  })

  test('the unknown outcome persists, and the count 1, after INV-48219 was approved and read back', () => {
    for (const state of [approved, verified]) {
      const markup = html(open(state, 'SC24'))
      expect(text(elementOf(markup, 'unknown-hold'))).toContain('Outcome Unknown')
      expect(text(markup)).not.toContain('Verified Complete')
      expect(markup).not.toMatch(SUCCESS)
    }
    expect(jobCounts(verified).unknown).toBe(1)
    expect(jobCounts(verified).verified).toBe(8)
  })

  test('the reducer refuses to decide, read back or verify INV-48220, even for Daniel', () => {
    for (const action of [
      { type: 'APPROVE', invoice: 'INV-48220' },
      { type: 'REJECT', invoice: 'INV-48220' },
      { type: 'REQUEST_CHANGES', invoice: 'INV-48220' },
      { type: 'VERIFY_READBACK', invoice: 'INV-48220', result: 'verified' },
    ] satisfies Action[]) {
      expect(transition(verified, action).ok).toBe(false)
      expect(transition(approved, action).ok).toBe(false)
    }
  })

  test('Marcus and Daniel see the same drawer; an Employee sees none', () => {
    const owner = open(run(atJob, { type: 'SELECT_ACTOR', personId: 'marcus' }), 'SC24')
    expect(text(html(owner))).toBe(text(markup))
    expect(text(html(run(owner, { type: 'SELECT_ACTOR', personId: 'priya' })))).toBe('')
  })
})

describe('anchors', () => {
  test('SC23 renders every drawer anchor; the approval ones are shown, the unknown ones hidden', () => {
    const markup = html(pending)
    for (const name of APPROVAL) expect(hidden(markup, name)).toBe(false)
    for (const name of UNKNOWN) expect(hidden(markup, name)).toBe(true)
  })

  test('SC24 shows the unknown anchors and hides the approval ones', () => {
    const markup = html(unknownOpen)
    for (const name of UNKNOWN) expect(hidden(markup, name)).toBe(false)
    for (const name of APPROVAL) expect(hidden(markup, name)).toBe(true)
  })

  test('on the table route (SC22) both drawers are present and hidden, and no scrim shows', () => {
    const markup = html(open(daniel, 'SC22'))
    for (const name of ALL) expect(hidden(markup, name)).toBe(true)
    expect(markup).toContain('data-layer="job-drawer" aria-hidden="true"')
    expect(text(markup)).toBe('')
  })

  test('a visible anchor is placed exactly on its authored rectangle', () => {
    for (const [state, names] of [
      [pending, APPROVAL],
      [verified, APPROVAL],
      [marcus, APPROVAL],
      [unknownOpen, UNKNOWN],
      [run(unknownOpen, { type: 'SET_JOB_VIEW', tip: true, investigating: true }), UNKNOWN],
    ] as const) {
      const markup = html(state)
      for (const name of names) expect(rectOf(markup, name)).toEqual(authored(name))
    }
  })

  test('the drawer is 480 wide on the right of the canvas, with the scrim over the left part', () => {
    expect(JOB_ANCHOR_RECTS['approval-drawer']).toEqual({ x: 800, y: 0, width: 480, height: 720 })
    expect(JOB_ANCHOR_RECTS['unknown-case']).toEqual({ x: 800, y: 0, width: 480, height: 720 })
    expect(html(pending)).toContain('class="bg-black/80"')
  })
})

describe('film', () => {
  test('the drawer fades in over 150 ms from the OPEN_SCREEN that opened it, and is solid afterwards', () => {
    const landed = (frame: number) => filmAt(frame, { OPEN_SCREEN: 10 })
    expect(layerOpacity(html(pending, landed(10)))).toBeLessThan(1)
    expect(layerOpacity(html(pending, landed(60)))).toBe(1)
    expect(layerOpacity(html(pending))).toBe(1)
  })

  test('a film uses no transitions, so a frame is exact', () => {
    const markup = html(pending, filmAt(60))
    expect(markup).toContain('transition-none')
    expect(markup).not.toMatch(/transition-(?!none)/)
  })

  test('film and app render the same drawer', () => {
    expect(text(html(pending, filmAt(60)))).toBe(text(html(pending)))
    expect(text(html(unknownOpen, filmAt(60)))).toBe(text(html(unknownOpen)))
  })
})
