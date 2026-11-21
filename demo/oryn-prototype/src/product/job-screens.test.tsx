import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { INVOICE_CASES } from '@/data/invoices'
import { reconstruct } from '@/state'
import type { Action, State } from '@/state'
import { act as run } from '@/state/test-helpers'
import type { FilmContext } from './contract'
import { JobDrawers } from './JobDrawers'
import { JobScreen } from './JobScreen'
import { CASE_ROW_ANCHORS, CASE_TABLE, JOB_ANCHORS, JOB_ANCHOR_RECTS, JOB_PROGRESS } from './job-layout'

/** SC22 eleven-case job: the progress summary and the case table, as every route that draws it shows them. */

type Props = Record<string, unknown>
type Rect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number }

const html = (state: State, film?: FilmContext): string => renderToStaticMarkup(<JobScreen state={state} film={film} />)
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
const text = (markup: string): string => plain(markup.replace(/<[^>]*>/g, ''))
const count = (markup: string, needle: string): number => markup.split(needle).length - 1

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

const rectOf = (markup: string, name: string): Rect => {
  const match = openingTag(markup, name).match(/left:(\d+)(?:px)?;top:(\d+)(?:px)?;width:(\d+)px;height:(\d+)px/)
  if (!match) throw new Error(`Anchor ${name} has no authored rectangle`)
  return { x: Number(match[1]), y: Number(match[2]), width: Number(match[3]), height: Number(match[4]) }
}
const shift = (rect: Rect, origin: Rect): Rect => ({ x: rect.x + origin.x, y: rect.y + origin.y, width: rect.width, height: rect.height })

/** Every element of a screen, without rendering the drawers (they use hooks, which only a renderer may run). */
function elementsOf(node: ReactNode, out: ReactElement<Props>[] = []): ReactElement<Props>[] {
  if (Array.isArray(node)) {
    node.forEach((child) => elementsOf(child as ReactNode, out))
    return out
  }
  if (!isValidElement<Props>(node)) return out
  out.push(node)
  if (node.type === JobDrawers) return out
  if (typeof node.type === 'function') return elementsOf((node.type as (props: Props) => ReactNode)(node.props), out)
  return elementsOf(node.props.children as ReactNode, out)
}

/** Fire the click of the one element `pick` selects and return every action it dispatched. */
function click(state: State, pick: (props: Props) => boolean): Action[] {
  const dispatched: Action[] = []
  const element = elementsOf(<JobScreen state={state} dispatch={(action) => dispatched.push(action)} />).find((candidate) => pick(candidate.props))
  if (!element) throw new Error('No element matches')
  ;(element.props.onClick as ((event: Props) => void) | undefined)?.({ preventDefault: () => undefined })
  return dispatched
}
const clickAnchor = (state: State, name: string): Action[] => click(state, (props) => props['data-film-anchor'] === name)

const filmAt = (frame: number): FilmContext => ({ frame, reducedMotion: false, lastApplied: () => null })

/** Cyan: the orbit node of a running glyph, the cyan text class, or an executing flag. */
const CYAN = /data-running="true"|text-trace|data-executing="true"|var\(--arc-mark\)/

const countsLine = (markup: string): string => plain(markup.match(/data-counts-line=""[^>]*>([^<]*)</)?.[1] ?? '')
const rowText = (markup: string, invoice: string): string => text(elementOf(markup, `case-row-${invoice.toLowerCase()}`))
const rowTag = (markup: string, invoice: string): string => openingTag(markup, `case-row-${invoice.toLowerCase()}`)
const outcomeOf = (markup: string, invoice: string): string => rowTag(markup, invoice).match(/data-outcome="(\w+)"/)?.[1] as string
const slots = (markup: string, kind: string): number => count(elementOf(markup, 'job-progress'), `data-slot="${kind}"`)

/** DAT-02, written out: invoice, supplier, amount, PO and the outcome the pass records for it. */
const DAT02 = [
  ['INV-48210', 'Brightwater Industrial', '$6,240.00', 'PO-1031', 'Verified Complete'],
  ['INV-48211', 'Copperline Cables', '$3,118.40', 'PO-1032', 'Verified Complete'],
  ['INV-48212', 'Northgate Pallets', '$1,905.00', 'PO-1034', 'Verified Complete'],
  ['INV-48213', 'Orchard Lane Foods', '$12,480.00', 'PO-1036', 'Verified Complete'],
  ['INV-48214', 'Harlow Tooling', '$847.25', 'PO-1037', 'Verified Complete'],
  ['INV-48215', 'Ironbark Fasteners', '$2,260.00', '\u2014', 'Escalated: Missing Purchase Order'],
  ['INV-48216', 'Vantage Print', '$529.90', 'PO-1039', 'Verified Complete'],
  ['INV-48217', 'Meadowbrook Office', '$1,376.12', 'PO-1040', 'Verified Complete'],
  ['INV-48218', 'Sable & Co. Logistics', '$4,415.00', '\u2014', 'Escalated: Missing Purchase Order'],
  ['INV-48219', 'Brightwater Industrial', '$18,420.00', 'PO-1042', 'Approval Required (Tier 3)'],
  ['INV-48220', 'Northgate Pallets', '$2,732.50', 'PO-1044', 'Outcome Unknown'],
] as const

const IDS = INVOICE_CASES.map((row) => row.invoice)
const evaluate = (state: State, upTo: number): State => run(state, ...IDS.slice(0, upTo).map((invoice): Action => ({ type: 'EVALUATE_CASE', invoice })))
const as = (state: State, personId: 'daniel' | 'priya'): State => run(state, { type: 'SELECT_ACTOR', personId })

const queued = reconstruct('ST10')
const midRun = evaluate(queued, 3)
const allEvaluated = evaluate(queued, 11)

test('each missing purchase order opens its own selected case', () => {
  for (const invoice of ['INV-48215', 'INV-48218']) {
    expect(click(allEvaluated, (props) => props['aria-label'] === `Open case ${invoice}`)).toEqual([{ type: 'SELECT_CASE', caseId: invoice }])
  }
})

test('each escalated case shows its own detail panel; no other case and no aggregate', () => {
  const detail = (state: State) => [...html(state).matchAll(/data-case-detail="([^"]+)"/g)].map((match) => match[1])
  expect(detail(allEvaluated)).toEqual([])
  for (const [invoice, supplier, amount] of [['INV-48215', 'Ironbark Fasteners', '$2,260.00'], ['INV-48218', 'Sable & Co. Logistics', '$4,415.00']] as const) {
    const selected = run(allEvaluated, { type: 'SELECT_CASE', caseId: invoice })
    expect(detail(selected)).toEqual([invoice])
    const panel = text(html(selected))
    expect(panel).toContain(`${invoice} \u00b7 Escalated: Missing Purchase Order`)
    expect(panel).toContain(`${supplier} \u00b7 ${amount} \u00b7 Purchase order \u2014`)
    expect(plain(html(selected))).not.toMatch(/Retry|Resubmit(?! unavailable)/)
  }
  // A case that is not escalated opens no panel here (its own drawer is SC23 or SC24).
  expect(detail(run(allEvaluated, { type: 'SELECT_CASE', caseId: 'INV-48219' }))).toEqual([])
})
const stopped = reconstruct('ST11')
const approved = run(as(stopped, 'daniel'), { type: 'APPROVE', invoice: 'INV-48219' })
const verified = run(approved, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' })

const COUNTS_STOPPED = '7 Verified Complete \u00b7 2 Escalated \u00b7 1 Approval Required \u00b7 1 Outcome Unknown'
const COUNTS_VERIFIED = '8 Verified Complete \u00b7 2 Escalated \u00b7 0 Approval Required \u00b7 1 Outcome Unknown'
const NEVER = /Retry|Resubmit(?! unavailable)|11 successful|Completed with exceptions/

describe('SC22 queued', () => {
  const markup = html(queued)

  test('a started job has eleven queued cases and the first one is running', () => {
    expect(countsLine(markup)).toBe('0 Verified Complete \u00b7 0 Escalated \u00b7 0 Approval Required \u00b7 0 Outcome Unknown \u00b7 11 Queued')
    expect(outcomeOf(markup, 'INV-48210')).toBe('running')
    expect(rowText(markup, 'INV-48210')).toContain('Running')
    IDS.slice(1).forEach((invoice) => {
      expect(outcomeOf(markup, invoice)).toBe('queued')
      expect(rowText(markup, invoice)).toEndWith('Queued')
    })
  })

  test('cyan marks only the status orbit and the one active row while it executes', () => {
    expect(count(markup, 'data-running="true"')).toBe(2)
    expect(count(elementOf(markup, 'case-row-inv-48210'), 'data-running="true"')).toBe(1)
    IDS.slice(1).forEach((invoice) => expect(CYAN.test(elementOf(markup, `case-row-${invoice.toLowerCase()}`))).toBe(false))
    expect(text(elementOf(markup, 'job-progress'))).toContain('Queued')
  })

  test('the bar shows eleven empty slots, not a fill', () => {
    expect(slots(markup, 'queued')).toBe(11)
    ;['verified', 'escalated', 'approval'].forEach((kind) => expect(slots(markup, kind)).toBe(0))
    expect(count(elementOf(markup, 'job-progress'), 'data-hatch')).toBe(0)
  })

  test('no case action is offered before a case needs a person, and the summary is unavailable with its reason', () => {
    expect(hidden(markup, 'approval-row')).toBe(true)
    expect(hidden(markup, 'unknown-row')).toBe(true)
    expect(disabled(markup, 'open-summary')).toBe(true)
    expect(markup).toContain('SC25 is not reachable yet')
    expect(NEVER.test(text(markup))).toBe(false)
  })
})

describe('SC22 mid-run', () => {
  const markup = html(midRun)

  test('evaluated rows keep their outcome and the next queued row is the active one', () => {
    expect(countsLine(markup)).toBe('3 Verified Complete \u00b7 0 Escalated \u00b7 0 Approval Required \u00b7 0 Outcome Unknown \u00b7 8 Queued')
    ;['INV-48210', 'INV-48211', 'INV-48212'].forEach((invoice) => expect(outcomeOf(markup, invoice)).toBe('verified'))
    expect(outcomeOf(markup, 'INV-48213')).toBe('running')
    expect(count(markup, 'data-running="true"')).toBe(2)
    expect(slots(markup, 'verified')).toBe(3)
    expect(slots(markup, 'queued')).toBe(8)
  })

  test('evaluation order does not have to follow the table: the first queued row is the one running', () => {
    const skipped = run(queued, { type: 'EVALUATE_CASE', invoice: 'INV-48215' })
    const view = html(skipped)
    expect(outcomeOf(view, 'INV-48215')).toBe('escalated')
    expect(outcomeOf(view, 'INV-48210')).toBe('running')
    expect(slots(view, 'escalated')).toBe(1)
  })
})

describe('SC22 every case evaluated, pass not yet paused', () => {
  const markup = html(allEvaluated)

  test('the totals are final but the job still executes: the orbit stays, no row runs', () => {
    expect(countsLine(markup)).toBe(COUNTS_STOPPED)
    expect(count(markup, 'data-running="true"')).toBe(1)
    expect(markup).not.toContain('data-outcome="running"')
    expect(text(elementOf(markup, 'job-progress'))).toContain('Running')
  })
})

describe('SC22 stopped with 7 / 2 / 1 / 1', () => {
  const markup = html(stopped)

  test('the eleven rows are exactly DAT-02', () => {
    expect(IDS).toEqual(DAT02.map((row) => row[0]))
    DAT02.forEach(([invoice, supplier, amount, po, label]) => {
      expect(rowText(markup, invoice)).toStartWith(`${invoice}${supplier}${amount}${po}${label}`)
    })
    expect(count(markup, 'role="row"')).toBe(12)
  })

  test('the counts line, the bar and the status say partially complete, never all successful', () => {
    expect(countsLine(markup)).toBe(COUNTS_STOPPED)
    expect(slots(markup, 'verified')).toBe(7)
    expect(slots(markup, 'escalated')).toBe(2)
    expect(slots(markup, 'approval')).toBe(1)
    expect(slots(markup, 'queued')).toBe(0)
    expect(count(elementOf(markup, 'job-progress'), 'data-hatch')).toBe(1)
    expect(text(elementOf(markup, 'job-progress'))).toContain('Partially Complete')
    expect(NEVER.test(text(markup))).toBe(false)
    expect(count(text(markup), 'Verified Complete')).toBe(8)
  })

  test('cyan is gone the moment execution stops: no orbit anywhere, glyphs are plain', () => {
    expect(CYAN.test(markup)).toBe(false)
    expect(markup).not.toContain('Stopped')
    expect(html(stopped, filmAt(0))).toBe(html(stopped, filmAt(37)))
  })

  test('the approval and unknown rows offer exactly one action each, and nothing offers a retry', () => {
    expect(hidden(markup, 'approval-row')).toBe(false)
    expect(hidden(markup, 'unknown-row')).toBe(false)
    expect(rowText(markup, 'INV-48219')).toEndWith('Review')
    expect(rowText(markup, 'INV-48220')).toEndWith('Evidence')
    IDS.slice(0, 9).forEach((invoice) => {
      const row = rowText(markup, invoice)
      expect(row.endsWith('Review') || row.endsWith('Evidence')).toBe(false)
    })
    expect(disabled(markup, 'open-summary')).toBe(false)
    expect(markup.match(/<button[^>]*>[^<]*(?:Retry|Resubmit)/)).toBeNull()
  })
})

describe('SC22 approval decided, readback pending', () => {
  const markup = html(approved)

  test('the approval does not move any count: the case stays Approval Required and says it awaits verification', () => {
    expect(countsLine(markup)).toBe(COUNTS_STOPPED)
    expect(outcomeOf(markup, 'INV-48219')).toBe('approval')
    expect(rowText(markup, 'INV-48219')).toContain('Approval Required (Tier 3)')
    expect(rowText(markup, 'INV-48219')).toContain('Approved \u00b7 Awaiting verification')
    expect(slots(markup, 'verified')).toBe(7)
    expect(count(text(markup), 'Verified Complete')).toBe(8)
    expect(CYAN.test(markup)).toBe(false)
  })

  test('a rejection or a change request is recorded on the row without moving a count either', () => {
    const rejected = html(run(as(stopped, 'daniel'), { type: 'REJECT', invoice: 'INV-48219' }))
    expect(rowText(rejected, 'INV-48219')).toContain('Rejected')
    expect(countsLine(rejected)).toBe(COUNTS_STOPPED)
    const changes = html(run(as(stopped, 'daniel'), { type: 'REQUEST_CHANGES', invoice: 'INV-48219' }))
    expect(rowText(changes, 'INV-48219')).toContain('Changes requested')
    expect(countsLine(changes)).toBe(COUNTS_STOPPED)
  })
})

describe('SC22 after the independent readback', () => {
  const markup = html(verified)

  test('only the readback moves INV-48219 to verified: 8 / 2 / 0 / 1', () => {
    expect(countsLine(markup)).toBe(COUNTS_VERIFIED)
    expect(outcomeOf(markup, 'INV-48219')).toBe('verified')
    expect(rowText(markup, 'INV-48219')).toContain('Verified Complete')
    expect(rowText(markup, 'INV-48219')).not.toContain('Awaiting verification')
    expect(slots(markup, 'verified')).toBe(8)
    expect(slots(markup, 'approval')).toBe(0)
  })

  test('the unknown case is still held, still Outcome Unknown, and the job is still partial', () => {
    expect(outcomeOf(markup, 'INV-48220')).toBe('unknown')
    expect(rowText(markup, 'INV-48220')).toContain('Outcome Unknown')
    expect(count(elementOf(markup, 'job-progress'), 'data-hatch')).toBe(1)
    expect(text(elementOf(markup, 'job-progress'))).toContain('Partially Complete')
    expect(NEVER.test(text(markup))).toBe(false)
    expect(CYAN.test(markup)).toBe(false)
  })
})

describe('SC22 filter', () => {
  const all = html(stopped)
  const filtered = html(run(stopped, { type: 'SET_JOB_FILTER', filter: 'unknown' }))

  test('a filter dims the other rows and states how many it shows; no anchor moves', () => {
    expect(count(filtered, 'data-dimmed="true"')).toBe(10)
    expect(rowTag(filtered, 'INV-48220')).not.toContain('data-dimmed')
    expect(rowTag(filtered, 'INV-48210')).toContain('opacity:0.4')
    expect(text(filtered)).toContain('Showing: Outcome Unknown \u00b7 1 of 11')
    expect(countsLine(filtered)).toBe(COUNTS_STOPPED)
    JOB_ANCHORS.filter((name) => !hidden(all, name) && all.includes(`data-film-anchor="${name}"`)).forEach((name) => {
      expect(openingTag(filtered, name).match(/left:\d+(?:px)?;top:\d+(?:px)?;width:\d+px;height:\d+px/)?.[0]).toBe(openingTag(all, name).match(/left:\d+(?:px)?;top:\d+(?:px)?;width:\d+px;height:\d+px/)?.[0])
    })
  })

  test('the approval filter counts the one approval case, and the chip clears the filter', () => {
    const approval = html(run(stopped, { type: 'SET_JOB_FILTER', filter: 'approval' }))
    expect(text(approval)).toContain('Showing: Approval Required \u00b7 1 of 11')
    expect(count(approval, 'data-dimmed="true"')).toBe(10)
    expect(approval).toContain('aria-label="Clear the Approval Required filter"')
    const cleared = click(run(stopped, { type: 'SET_JOB_FILTER', filter: 'escalated' }), (props) => typeof props['aria-label'] === 'string' && (props['aria-label'] as string).startsWith('Clear the'))
    expect(cleared).toEqual([{ type: 'SET_JOB_FILTER', filter: 'all' }])
  })

  test('no filter, no chip and nothing dimmed', () => {
    expect(all).not.toContain('Showing:')
    expect(all).not.toContain('data-dimmed')
  })
})

describe('SC22 selection and routes', () => {
  test('the selected case has a neutral two pixel inset outline, never cyan', () => {
    const markup = html(run(stopped, { type: 'SELECT_CASE', caseId: 'INV-48219' }))
    expect(rowTag(markup, 'INV-48219')).toContain('box-shadow:inset 0 0 0 2px var(--foreground)')
    expect(count(markup, 'box-shadow:inset')).toBe(1)
    expect(CYAN.test(markup)).toBe(false)
    expect(rectOf(markup, 'case-row-inv-48219')).toEqual(rectOf(html(stopped), 'case-row-inv-48219'))
  })

  test('Review selects INV-48219 and opens the approval drawer; Evidence selects INV-48220 and opens the unknown-outcome drawer', () => {
    expect(clickAnchor(stopped, 'approval-row')).toEqual([
      { type: 'SELECT_CASE', caseId: 'INV-48219' },
      { type: 'OPEN_SCREEN', screen: 'SC23' },
    ])
    expect(clickAnchor(stopped, 'unknown-row')).toEqual([
      { type: 'SELECT_CASE', caseId: 'INV-48220' },
      { type: 'OPEN_SCREEN', screen: 'SC24' },
    ])
    expect(openingTag(html(stopped), 'approval-row')).toContain('aria-label="Open approval for INV-48219"')
    expect(openingTag(html(stopped), 'unknown-row')).toContain('aria-label="Open evidence for INV-48220"')
  })

  test('Open summary opens SC25 once the pass has stopped', () => {
    expect(clickAnchor(stopped, 'open-summary')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC25' }])
  })

  test('in a film the orbit is a pure function of the frame while the job runs, and a click is a no-op', () => {
    expect(html(queued, filmAt(0))).not.toBe(html(queued, filmAt(20)))
    const element = elementsOf(<JobScreen state={stopped} film={filmAt(5)} />).find((candidate) => candidate.props['data-film-anchor'] === 'approval-row')
    expect(() => (element?.props.onClick as (() => void) | undefined)?.()).not.toThrow()
  })
})

describe('SC22 geometry', () => {
  const markup = html(stopped)
  const authored = (name: string): Rect => JOB_ANCHOR_RECTS[name as keyof typeof JOB_ANCHOR_RECTS] as Rect
  const OWN = JOB_ANCHORS.filter((name) => name === 'job-progress' || name === 'open-summary' || name === 'job-table' || name === 'approval-row' || name === 'unknown-row' || CASE_ROW_ANCHORS.includes(name))

  test('every anchor this screen owns is rendered and sits exactly on its authored rectangle', () => {
    expect(OWN).toHaveLength(16)
    OWN.forEach((name) => {
      const origin = name === 'open-summary' ? JOB_PROGRESS : CASE_ROW_ANCHORS.includes(name) || name === 'approval-row' || name === 'unknown-row' ? CASE_TABLE : { x: 0, y: 0, width: 0, height: 0 }
      expect(shift(rectOf(markup, name), origin)).toEqual(authored(name))
      expect(hidden(markup, name)).toBe(false)
    })
  })

  test('the geometry is the same in every state, the rows are 32 px apart and the table is 992 by 384', () => {
    ;[queued, midRun, allEvaluated, approved, verified].forEach((state) => {
      const view = html(state)
      OWN.forEach((name) => {
        if (hidden(view, name)) return
        expect(rectOf(view, name)).toEqual(rectOf(markup, name))
      })
    })
    expect(authored('job-table')).toEqual({ x: 264, y: 188, width: 992, height: 384 })
    expect(authored('approval-row').y + 16).toBe(524)
    expect(authored('unknown-row').y + 16).toBe(556)
  })
})

describe('SC22 viewpoint', () => {
  test('a person who does not read jobs sees why, and every anchor of the table is hidden', () => {
    const markup = html(as(stopped, 'priya'))
    expect(text(markup)).toContain('Not available: Jobs are read by the Workflow Owner and the Approver.')
    expect(markup).toContain('data-view="denied"')
    ;['job-progress', 'open-summary', 'job-table', 'approval-row', 'unknown-row', ...CASE_ROW_ANCHORS].forEach((name) => expect(hidden(markup, name)).toBe(true))
    expect(markup).not.toContain('INV-48210')
  })

  test('the Approver reads the same table as the Workflow Owner', () => {
    const owner = html(stopped)
    const approver = html(as(stopped, 'daniel'))
    expect(countsLine(approver)).toBe(COUNTS_STOPPED)
    expect(rowText(approver, 'INV-48219')).toBe(rowText(owner, 'INV-48219'))
  })
})
