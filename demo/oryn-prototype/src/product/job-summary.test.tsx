import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import type { Action, State } from '@/state'
import { act as run } from '@/state/test-helpers'
import type { FilmContext, ProductProps } from './contract'
import { JobSummaryScreen } from './JobSummaryScreen'
import { JOB_SUMMARY_ANCHORS, JOB_SUMMARY_ANCHOR_RECTS } from './job-layout'
import type { JobSummaryAnchor } from './job-layout'

/** SC25 job outcome summary. */

type Props = Record<string, unknown>

const html = (state: State, film?: FilmContext): string => renderToStaticMarkup(<JobSummaryScreen state={state} film={film} />)
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
const text = (markup: string): string => plain(markup.replace(/<[^>]*>/g, ''))

const openingTag = (markup: string, name: string): string => {
  const tag = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return tag
}
const hidden = (markup: string, name: string): boolean => openingTag(markup, name).includes('display:none')
const opacityOf = (markup: string, name: string): number => Number(openingTag(markup, name).match(/opacity:([\d.]+)/)?.[1] ?? 1)
const rectOf = (markup: string, name: string) => {
  const style = openingTag(markup, name)
  const px = (property: string): number => Number(style.match(new RegExp(`${property}:(-?[\\d.]+)px`))?.[1])
  return { x: px('left'), y: px('top'), width: px('width'), height: px('height') }
}
/** Text of one anchored element: buttons, sections and paragraphs close with their own tag. */
const textOf = (markup: string, name: string): string => {
  const start = markup.indexOf(openingTag(markup, name))
  const tagName = openingTag(markup, name).match(/^<(\w+)/)?.[1]
  const end = markup.indexOf(`</${tagName}>`, start)
  return text(markup.slice(start, end))
}

const filmAt = (frame: number, applied: Partial<Record<Action['type'], number>> = {}): FilmContext => ({
  frame,
  reducedMotion: false,
  lastApplied: (type) => applied[type] ?? null,
})

function anchoredElements(node: ReactNode, out: ReactElement<Props>[] = []): ReactElement<Props>[] {
  if (Array.isArray(node)) {
    node.forEach((child) => anchoredElements(child as ReactNode, out))
    return out
  }
  if (!isValidElement<Props>(node)) return out
  if (node.props['data-film-anchor'] !== undefined) out.push(node)
  if (typeof node.type === 'function') return anchoredElements((node.type as (props: Props) => ReactNode)(node.props), out)
  return anchoredElements(node.props.children as ReactNode, out)
}

/** Fire one handler of an anchored element and return every action it dispatched. */
function fire(state: State, name: string): Action[] {
  const dispatched: Action[] = []
  const props: ProductProps = { state, dispatch: (action) => dispatched.push(action) }
  const element = anchoredElements(<JobSummaryScreen {...props} />).find((candidate) => candidate.props['data-film-anchor'] === name)
  if (!element) throw new Error(`No element for anchor ${name}`)
  ;(element.props.onClick as (() => void) | undefined)?.()
  return dispatched
}

const paused = reconstruct('ST11')
const preApproval = run(paused, { type: 'OPEN_SCREEN', screen: 'SC25' })
const approved = run(preApproval, { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'APPROVE', invoice: 'INV-48219' })
const verified = run(approved, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' })
const earlier = run(verified, { type: 'SET_JOB_VIEW', snapshot: 'before' })

const CARDS = ['summary-verified', 'summary-escalated', 'summary-approval', 'summary-unknown'] as const
const cardTexts = (state: State, film?: FilmContext): string[] => {
  const markup = html(state, film)
  return CARDS.map((name) => textOf(markup, name))
}
const total = (texts: string[]): number => texts.reduce((sum, entry) => sum + Number(entry.split(' ')[0]), 0)

describe('SC25 counts', () => {
  test('before approval the cards read 7 / 2 / 1 / 1 and sum to 11', () => {
    const texts = cardTexts(preApproval)
    expect(texts).toEqual(['7 Verified Complete', '2 Escalated', '1 Approval Required', '1 Outcome Unknown'])
    expect(total(texts)).toBe(11)
    expect(textOf(html(preApproval), 'summary-snapshot')).toContain('Before approval')
  })

  test('an approval alone moves nothing: still 7 / 2 / 1 / 1, labelled Before approval, awaiting readback', () => {
    const markup = html(approved)
    expect(CARDS.map((name) => textOf(markup, name))).toEqual(['7 Verified Complete', '2 Escalated', '1 Approval Required', '1 Outcome Unknown'])
    expect(textOf(markup, 'summary-snapshot')).toContain('Before approval')
    expect(textOf(markup, 'summary-readback')).toContain('INV-48219 approved by Daniel Okafor · Awaiting verification · counts unchanged until independent readback')
    expect(textOf(markup, 'summary-readback')).not.toContain('independently read back')
  })

  test('after the independent readback the cards read 8 / 2 / 0 / 1, still 11, labelled After approval and verification', () => {
    const markup = html(verified)
    const texts = CARDS.map((name) => textOf(markup, name))
    expect(texts).toEqual(['8 Verified Complete', '2 Escalated', '0 Approval Required', '1 Outcome Unknown'])
    expect(total(texts)).toBe(11)
    expect(textOf(markup, 'summary-snapshot')).toContain('After approval and verification')
    expect(textOf(markup, 'summary-readback')).toContain('INV-48219 independently read back: Matched - Variance Approved')
  })

  test('the earlier snapshot after verification keeps 7 / 2 / 1 / 1 and Before approval, and says so', () => {
    const markup = html(earlier)
    expect(CARDS.map((name) => textOf(markup, name))).toEqual(['7 Verified Complete', '2 Escalated', '1 Approval Required', '1 Outcome Unknown'])
    const label = textOf(markup, 'summary-snapshot')
    expect(label).toContain('Before approval')
    expect(label).toContain('Earlier snapshot · INV-48219 has since been independently verified')
    expect(label).not.toContain('Current snapshot')
    expect(textOf(html(verified), 'summary-snapshot')).toContain('Current snapshot')
  })

  test('the unknown count is 1 in every snapshot and INV-48220 is always held, never resubmitted', () => {
    for (const state of [preApproval, approved, verified, earlier]) {
      const markup = html(state)
      expect(textOf(markup, 'summary-unknown')).toBe('1 Outcome Unknown')
      expect(textOf(markup, 'summary-readback')).toContain('INV-48220 remains Outcome Unknown · Held · Not resubmitted')
    }
  })

  test('a mismatched readback leaves the counts at 7 / 2 / 1 / 1 and never claims verification', () => {
    const mismatch = run(approved, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'mismatch' })
    const markup = html(mismatch)
    expect(textOf(markup, 'summary-verified')).toBe('7 Verified Complete')
    expect(textOf(markup, 'summary-readback')).not.toContain('independently read back')
  })

  test('both snapshots are listed as summing to 11 once the readback has landed', () => {
    expect(text(html(verified))).toContain('Before approval: 7 + 2 + 1 + 1 = 11 · After approval and verification: 8 + 2 + 0 + 1 = 11')
    expect(text(html(preApproval))).toContain('Before approval: 7 + 2 + 1 + 1 = 11')
    expect(text(html(preApproval))).not.toContain('8 + 2 + 0 + 1')
  })
})

describe('SC25 truthfulness', () => {
  test('the job is Partially Complete; never Completed with exceptions, 11 successful, Retry or Resubmit as a control', () => {
    for (const state of [preApproval, approved, verified]) {
      const markup = html(state)
      expect(textOf(markup, 'summary-status')).toBe('Partially Complete')
      const all = text(markup)
      expect(all).not.toContain('Completed with exceptions')
      expect(all).not.toContain('11 successful')
      expect(/Retry|Resubmit(?! )|Resubmission/.test(all.replace('Not resubmitted', ''))).toBe(false)
    }
  })

  test('no cyan exists: the job has stopped', () => {
    for (const state of [preApproval, verified]) expect(html(state)).not.toContain('text-trace')
    expect(html(verified)).not.toContain('data-glyph="running"')
  })

  test('each card has a distinct glyph; the unknown card is a hatched square, heavier-bordered, and keeps its text apart from the hatch', () => {
    const markup = html(preApproval)
    const glyphs = CARDS.map((name) => {
      const start = markup.indexOf(openingTag(markup, name))
      const body = markup.slice(start, markup.indexOf('</button>', start))
      return body.match(/data-glyph="(\w+)"/)?.[1] ?? (body.includes('data-hatch') ? 'hatch' : 'none')
    })
    expect(glyphs).toEqual(['verified', 'escalated', 'approval', 'hatch'])
    expect(openingTag(markup, 'summary-unknown')).toContain('border-2')
    expect(openingTag(markup, 'summary-verified')).not.toContain('border-2')
    // The hatch is a childless element: no text sits inside it.
    expect(markup).not.toMatch(/data-hatch="[^"]*"[^>]*>[^<]/)
  })

  test('the verified glyph is only on the verified card', () => {
    const markup = html(preApproval)
    expect(markup.split('data-glyph="verified"').length - 1).toBe(1)
  })
})

describe('SC25 interaction', () => {
  test('verified, escalated and approval cards filter the case table then open SC22', () => {
    for (const filter of ['verified', 'escalated', 'approval'] as const) {
      expect(fire(preApproval, `summary-${filter}`)).toEqual([
        { type: 'SET_JOB_FILTER', filter },
        { type: 'OPEN_SCREEN', screen: 'SC22' },
      ])
    }
  })

  test('the unknown card filters unknown, selects INV-48220 and opens SC24', () => {
    expect(fire(preApproval, 'summary-unknown')).toEqual([
      { type: 'SET_JOB_FILTER', filter: 'unknown' },
      { type: 'SELECT_CASE', caseId: 'INV-48220' },
      { type: 'OPEN_SCREEN', screen: 'SC24' },
    ])
  })

  test('View all cases clears the filter and opens SC22', () => {
    expect(fire(preApproval, 'open-cases')).toEqual([
      { type: 'SET_JOB_FILTER', filter: 'all' },
      { type: 'OPEN_SCREEN', screen: 'SC22' },
    ])
    expect(text(html(preApproval))).toContain('View all cases')
  })

  test('the dispatched actions are accepted by the reducer from the summary route', () => {
    const next = run(preApproval, ...fire(preApproval, 'summary-unknown'))
    expect(next.route).toBe('SC24')
    expect(next.selectedCase).toBe('INV-48220')
    expect(next.ui.job.filter).toBe('unknown')
  })
})

describe('SC25 film', () => {
  test('the card set and label fade together over 150 ms from the readback, with no intermediate number', () => {
    const landed = { VERIFY_READBACK: 20 }
    const mid = html(verified, filmAt(22, landed))
    const partial = [...CARDS, 'summary-snapshot'].map((name) => opacityOf(mid, name))
    expect(new Set(partial).size).toBe(1)
    expect(partial[0]).toBeGreaterThanOrEqual(0)
    expect(partial[0]).toBeLessThan(1)
    expect(CARDS.map((name) => textOf(mid, name))).toEqual(['8 Verified Complete', '2 Escalated', '0 Approval Required', '1 Outcome Unknown'])
    const done = html(verified, filmAt(25, landed))
    for (const name of [...CARDS, 'summary-snapshot']) expect(opacityOf(done, name)).toBe(1)
  })

  test('a switch to the current snapshot fades from the later of the two landings', () => {
    const applied = { VERIFY_READBACK: 20, SET_JOB_VIEW: 60 }
    expect(opacityOf(html(verified, filmAt(62, applied)), 'summary-verified')).toBeLessThan(1)
    expect(opacityOf(html(verified, filmAt(66, applied)), 'summary-verified')).toBe(1)
  })

  test('the stored preapproval snapshot is an entry, fully visible on its first frame', () => {
    const applied = { VERIFY_READBACK: 20, SET_JOB_VIEW: 60 }
    for (const name of [...CARDS, 'summary-snapshot']) expect(opacityOf(html(earlier, filmAt(60, applied)), name)).toBe(1)
  })

  test('outside a film, or before any landing, nothing fades', () => {
    expect(opacityOf(html(verified), 'summary-verified')).toBe(1)
    expect(opacityOf(html(preApproval, filmAt(10)), 'summary-unknown')).toBe(1)
  })
})

describe('SC25 access and layout', () => {
  test('a viewpoint that does not read jobs sees why, and every anchor is hidden', () => {
    const denied = run(preApproval, { type: 'SELECT_ACTOR', personId: 'priya' })
    const markup = html(denied)
    expect(text(markup)).toContain('Not available:')
    for (const name of JOB_SUMMARY_ANCHORS) expect(hidden(markup, name)).toBe(true)
  })

  test('the Workflow Owner and the Approver both read the summary', () => {
    for (const state of [preApproval, approved]) {
      expect(text(html(state))).not.toContain('Not available')
      for (const name of JOB_SUMMARY_ANCHORS) expect(hidden(html(state), name)).toBe(false)
    }
  })

  test('every anchor is always rendered and sits exactly on its authored rectangle', () => {
    const markup = html(verified)
    for (const name of JOB_SUMMARY_ANCHORS) expect(rectOf(markup, name)).toEqual(JOB_SUMMARY_ANCHOR_RECTS[name as JobSummaryAnchor])
  })

  test('the four cards are 232 x 160 on a 16 px gap', () => {
    const rects = CARDS.map((name) => JOB_SUMMARY_ANCHOR_RECTS[name])
    for (const rect of rects) expect([rect.width, rect.height, rect.y]).toEqual([232, 160, 160])
    expect(rects.map((rect) => rect.x)).toEqual([264, 512, 760, 1008])
  })

  test('the meta line names the job, population, version and team', () => {
    expect(text(html(preApproval))).toContain('JOB-0117 · 11 invoices · Supplier Invoice Reconciler v1.0 · AP East')
  })
})
