import { describe, expect, test } from 'bun:test'
import { isValidElement } from 'react'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { INBOX_ROWS } from '@/data/inbox'
import { formatCents } from '@/data/invoices'
import { ORGANIZATION } from '@/data/people'
import { KESTREL_DOCUMENT, WORK_RECORDS, centsOrDash } from '@/data/work-records'
import { createInitialState, reduce } from '@/state'
import type { Action, RecordId, State } from '@/state'
import { act as run, expectRejected } from '@/state/test-helpers'
import type { FilmContext } from '../contract'
import { APP_TOP } from './frame'
import { GMAIL_ANCHORS, GMAIL_ANCHOR_RECTS, LIST, PAGE, PANE, TOOLBAR, VIEWER } from './gmail-layout'
import type { GMAILAnchor } from './gmail-layout'
import { GmailView } from './GmailView'

const render = (state: State, film?: FilmContext): string => renderToStaticMarkup(<GmailView state={state} film={film} />)

/** Visible text: tags dropped, entities decoded, whitespace collapsed. */
const text = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

function tag(html: string, name: string): string {
  const match = html.match(new RegExp(`<[^>]*data-film-anchor="${name}"[^>]*>`))
  if (!match) throw new Error(`anchor ${name} is missing`)
  return match[0]
}
const hidden = (html: string, name: string): boolean => tag(html, name).includes('display:none')
const styleNumber = (html: string, name: string, property: string): number => {
  const match = tag(html, name).match(new RegExp(`[;"]${property}:(-?[\\d.]+)`))
  if (!match) throw new Error(`anchor ${name} has no ${property}`)
  return Number(match[1])
}

/** HTML after the opening tag that carries `from`, up to the tag that carries `to` (or the `to` markup itself). */
function between(html: string, from: string, to: string): string {
  const at = html.indexOf(from)
  const stop = html.indexOf(to, at)
  if (at < 0 || stop < 0) throw new Error(`no region ${from} .. ${to}`)
  const end = to.startsWith('<') ? stop : html.lastIndexOf('<', stop)
  return html.slice(html.indexOf('>', at) + 1, end)
}
const cardOf = (html: string): string => text(between(html, 'data-film-anchor="attachment"', '</button>'))
const pageOf = (html: string): string => text(between(html, 'data-film-anchor="document-page"', '</article>'))
const paneOf = (html: string): string => text(between(html, 'data-film-anchor="message-pane"', 'data-film-anchor="document-viewer"'))

const inbox = (): State => createInitialState()
const message = (record: RecordId): State => run(inbox(), { type: 'OPEN_MESSAGE', record })
const document_ = (record: RecordId): State => run(message(record), { type: 'OPEN_ATTACHMENT' })
const compare = (): State => run(document_('INV-48231'), { type: 'SET_DOCUMENT_VIEW', view: 'compare' })

const RECORD_IDS: readonly RecordId[] = ['INV-48219', 'INV-48231', 'INV-48210', 'INV-48203']

const VISIBLE: Readonly<Record<string, readonly GMAILAnchor[]>> = {
  inbox: ['inbox-list', 'inbox-row-inv-48219', 'inbox-row-inv-48231', 'inbox-row-inv-48210', 'inbox-row-inv-48203'],
  message: ['message-pane', 'attachment', 'gmail-back'],
  document: ['message-pane', 'attachment', 'gmail-back', 'document-viewer', 'document-page', 'invoice-id', 'po-number', 'invoice-total', 'gmail-close-document'],
  kestrel: ['message-pane', 'attachment', 'gmail-back', 'document-viewer', 'document-page', 'invoice-id', 'po-number', 'invoice-total', 'gmail-close-document', 'handling-fee', 'gmail-compare-toggle'],
  compare: ['message-pane', 'attachment', 'gmail-back', 'document-viewer', 'document-page', 'invoice-id', 'po-number', 'invoice-total', 'gmail-close-document', 'handling-fee', 'gmail-compare-toggle', 'invoice-v1'],
}
const STATES: Readonly<Record<string, State>> = {
  inbox: inbox(),
  message: message('INV-48219'),
  document: document_('INV-48210'),
  kestrel: document_('INV-48231'),
  compare: compare(),
}

describe('APP-01 inbox', () => {
  test('eight rows in the fixed order, no dates, times or amounts', () => {
    const html = render(inbox())
    const list = between(html, 'data-film-anchor="inbox-list"', 'data-film-anchor="message-pane"')
    const subjects = [...list.matchAll(/Invoice (INV-\d+)/g)].map((match) => match[1])
    expect(subjects).toEqual(['INV-48219', 'INV-48231', 'INV-48210', 'INV-48203', 'INV-48211', 'INV-48212', 'INV-48213', 'INV-48214'])
    const visible = text(list)
    for (const row of INBOX_ROWS) expect(visible).toContain(`${row.supplier} ${row.subject}`)
    expect(text(html)).toContain('Search mail')
    expect(text(html)).toContain('Inbox Sent Drafts')
    expect(visible).not.toMatch(/\d{1,2}:\d{2}/)
    expect(visible).not.toContain('$')
    expect(visible).not.toMatch(/\b(Mon|Tue|Wed|Thu|Fri)\b/)
  })

  test('each record row carries its own supplier: Brightwater, Kestrel, Brightwater, Brightwater', () => {
    expect(INBOX_ROWS.slice(0, 4).map((row) => [row.record, row.supplier])).toEqual([
      ['INV-48219', 'Brightwater Industrial'],
      ['INV-48231', 'Kestrel Components'],
      ['INV-48210', 'Brightwater Industrial'],
      ['INV-48203', 'Brightwater Industrial'],
    ])
    expect(INBOX_ROWS.slice(4).map((row) => [row.id, row.supplier, row.record])).toEqual([
      ['INV-48211', 'Copperline Cables', null],
      ['INV-48212', 'Northgate Pallets', null],
      ['INV-48213', 'Orchard Lane Foods', null],
      ['INV-48214', 'Harlow Tooling', null],
    ])
  })

  test('the open message replaces the list; both hide their own anchors', () => {
    const list = render(inbox())
    expect(hidden(list, 'message-pane')).toBe(true)
    expect(hidden(list, 'inbox-list')).toBe(false)
    const open = render(message('INV-48210'))
    expect(hidden(open, 'inbox-list')).toBe(true)
    for (const record of RECORD_IDS) expect(hidden(open, `inbox-row-${record.toLowerCase()}`)).toBe(true)
    expect(hidden(open, 'message-pane')).toBe(false)
  })

  test('the row of the current record is marked and only that one', () => {
    const html = render(run(inbox(), { type: 'OPEN_MESSAGE', record: 'INV-48210' }, { type: 'CLOSE_MESSAGE' }))
    expect(html.match(/aria-current="true"/g)).toHaveLength(1)
    expect(html).toMatch(/aria-current="true"[^>]*>[\s\S]*?Brightwater Industrial[\s\S]*?Invoice INV-48210/)
  })
})

describe('APP-01 message and attachment card', () => {
  for (const id of RECORD_IDS) {
    test(`${id}: message, card and document name one identity`, () => {
      const record = WORK_RECORDS[id]
      const html = render(document_(id))
      const pane = paneOf(html)
      expect(pane).toContain(`Invoice ${id}`)
      expect(pane).toContain(record.supplier)
      expect(pane).toContain(`to ${ORGANIZATION}`)
      const card = cardOf(html)
      expect(card).toContain(id)
      if (record.po === null) expect(card).not.toContain('PO-')
      else expect(card).toContain(record.po)
      if (record.totalCents === null) expect(card).not.toContain('$')
      else expect(card).toContain(formatCents(record.totalCents))
      const page = pageOf(html)
      expect(page).toContain(record.supplier)
      expect(page).toContain(id)
      expect(page).toContain(record.po ?? '\u2014')
    })
  }

  test('only Demonstration D1 carries a time, with the contributor', () => {
    expect(paneOf(render(message('INV-48203')))).toContain('Priya Nair \u00b7 Mon 09:14')
    for (const id of ['INV-48219', 'INV-48231', 'INV-48210'] as const) {
      const pane = paneOf(render(message(id)))
      expect(pane).not.toContain('09:14')
      expect(pane).not.toContain('Priya')
      expect(pane).not.toMatch(/\d{1,2}:\d{2}/)
    }
  })

  test('INV-48203 shows no PO and no amount anywhere', () => {
    const html = render(document_('INV-48203'))
    const visible = text(html)
    expect(cardOf(html)).toBe('INV-48203')
    expect(visible).not.toContain('$')
    expect(visible).not.toContain('PO-')
    expect(pageOf(html)).toContain('Purchase order \u2014')
    expect(pageOf(html)).toContain('Invoice total \u2014')
  })

  test('INV-48231 message body repeats the handling fee from the document data', () => {
    expect(paneOf(render(message('INV-48231')))).toContain(`Handling fee ${formatCents(KESTREL_DOCUMENT.handlingFeeCents)}`)
    expect(paneOf(render(message('INV-48231')))).toContain('Handling fee $38.50')
    for (const id of ['INV-48219', 'INV-48210', 'INV-48203'] as const) expect(paneOf(render(message(id)))).not.toContain('Handling fee')
  })
})

describe('APP-02 document variants', () => {
  test('Brightwater INV-48219: the hero amount reads in the crop', () => {
    const page = pageOf(render(document_('INV-48219')))
    expect(page).toContain('Brightwater Industrial')
    expect(page).toContain('Invoice INV-48219')
    expect(page).toContain('Purchase order PO-1042')
    expect(page).toContain('Invoice total $18,420.00')
    expect(page).not.toContain('Handling fee')
    expect(page).not.toContain('2.45')
  })

  test('INV-48210 uses its own PO and total', () => {
    const page = pageOf(render(document_('INV-48210')))
    expect(page).toContain('Invoice INV-48210')
    expect(page).toContain('Purchase order PO-1031')
    expect(page).toContain('Invoice total $6,240.00')
  })

  test('Kestrel INV-48231: subtotal, then handling fee, then total, and they add up', () => {
    const html = render(document_('INV-48231'))
    const page = pageOf(html)
    expect(page).toContain('Kestrel Components')
    expect(page).toContain('Invoice INV-48231')
    expect(page).toContain('Purchase order PO-1051')
    expect(page).toContain('Subtotal $4,175.00')
    expect(page).toContain('Handling fee $38.50')
    expect(page).toContain('Total $4,213.50')
    expect(page.indexOf('Subtotal $4,175.00')).toBeLessThan(page.indexOf('Handling fee $38.50'))
    expect(page.indexOf('Handling fee $38.50')).toBeLessThan(page.indexOf('Total $4,213.50'))
    expect(KESTREL_DOCUMENT.subtotalCents + KESTREL_DOCUMENT.handlingFeeCents).toBe(KESTREL_DOCUMENT.totalCents)
    expect(centsOrDash(KESTREL_DOCUMENT.totalCents)).toBe('$4,213.50')
    expect(page).not.toContain('2.45')
    expect(hidden(html, 'handling-fee')).toBe(false)
  })

  test('the handling-fee slot exists for every record but only Kestrel shows it, without moving the total', () => {
    const kestrel = render(document_('INV-48231'))
    for (const id of ['INV-48219', 'INV-48210', 'INV-48203'] as const) {
      const html = render(document_(id))
      expect(hidden(html, 'handling-fee')).toBe(true)
      expect(pageOf(html)).not.toContain('Handling fee')
      expect(styleNumber(html, 'invoice-total', 'top')).toBe(styleNumber(kestrel, 'invoice-total', 'top'))
      expect(styleNumber(html, 'invoice-id', 'top')).toBe(styleNumber(kestrel, 'invoice-id', 'top'))
    }
  })

  test('compare mode draws the earlier layout v1 behind the current v2 and highlights nothing', () => {
    const html = render(compare())
    expect(hidden(html, 'invoice-v1')).toBe(false)
    const earlier = text(between(html, 'data-film-anchor="invoice-v1"', '<article'))
    expect(earlier).toBe('Subtotal Total')
    expect(earlier).not.toContain('$')
    expect(earlier).not.toContain('INV-')
    const visible = text(html)
    expect(visible).toContain('Earlier layout')
    expect(visible).toContain('Current layout')
    expect(visible).toContain('Single layout')
    expect(html.indexOf('data-film-anchor="invoice-v1"')).toBeLessThan(html.indexOf('data-film-anchor="document-page"'))
    expect(between(html, 'data-film-anchor="document-page"', '</article>')).not.toMatch(/outline:|ring-2/)
    expect(pageOf(html)).toContain('Handling fee $38.50')
  })

  test('single view offers `Compare layouts` for Kestrel only', () => {
    const kestrel = render(document_('INV-48231'))
    expect(hidden(kestrel, 'gmail-compare-toggle')).toBe(false)
    expect(hidden(kestrel, 'invoice-v1')).toBe(true)
    expect(text(kestrel)).toContain('Compare layouts')
    for (const id of ['INV-48219', 'INV-48210', 'INV-48203'] as const) expect(hidden(render(document_(id)), 'gmail-compare-toggle')).toBe(true)
  })

  test('the reducer refuses a comparison for any record but INV-48231', () => {
    for (const id of ['INV-48219', 'INV-48210', 'INV-48203'] as const) {
      expectRejected(document_(id), { type: 'SET_DOCUMENT_VIEW', view: 'compare' }, 'record')
    }
  })

  test('closing the document or the message hides the viewer', () => {
    expect(hidden(render(run(document_('INV-48231'), { type: 'CLOSE_ATTACHMENT' })), 'document-viewer')).toBe(true)
    expect(hidden(render(run(compare(), { type: 'CLOSE_MESSAGE' })), 'document-viewer')).toBe(true)
    expect(hidden(render(document_('INV-48219')), 'document-viewer')).toBe(false)
  })
})

describe('APP-01/02 anchors', () => {
  for (const [label, state] of Object.entries(STATES)) {
    test(`${label}: every anchor renders once and visibility follows the state`, () => {
      const html = render(state)
      const names = [...html.matchAll(/data-film-anchor="([^"]+)"/g)].map((match) => match[1])
      expect([...names].sort()).toEqual([...GMAIL_ANCHORS].sort())
      const shown = VISIBLE[label] ?? []
      for (const name of GMAIL_ANCHORS) expect([name, !hidden(html, name)]).toEqual([name, shown.includes(name)])
    })
  }

  test('declared rectangles match the spec', () => {
    const rect = GMAIL_ANCHOR_RECTS
    expect(rect['inbox-list']).toEqual({ x: 184, y: 132, width: 480, height: 514 })
    expect(rect['message-pane']).toEqual({ x: 184, y: 132, width: 536, height: 514 })
    expect(rect['document-viewer']).toEqual({ x: 720, y: 132, width: 560, height: 514 })
    expect(rect['document-page']).toEqual({ x: 780, y: 188, width: 440, height: 420 })
    expect(rect['inbox-row-inv-48219']).toEqual({ x: 200, y: 160, width: 460, height: 48 })
    expect(rect['inbox-row-inv-48231']).toEqual({ x: 200, y: 208, width: 460, height: 48 })
    expect(rect['inbox-row-inv-48210']).toEqual({ x: 200, y: 256, width: 460, height: 48 })
    expect(rect['inbox-row-inv-48203']).toEqual({ x: 200, y: 304, width: 460, height: 48 })
    for (const name of GMAIL_ANCHORS) {
      const { y, height } = rect[name]
      expect(y + height).toBeLessThanOrEqual(646)
    }
  })

  test('every element is placed at its declared rectangle, whatever the state', () => {
    const parent: Readonly<Partial<Record<GMAILAnchor, typeof LIST>>> = {
      'inbox-row-inv-48219': LIST,
      'inbox-row-inv-48231': LIST,
      'inbox-row-inv-48210': LIST,
      'inbox-row-inv-48203': LIST,
      attachment: PANE,
      'gmail-back': PANE,
      'document-page': VIEWER,
      'invoice-v1': VIEWER,
      'invoice-id': PAGE,
      'po-number': PAGE,
      'invoice-total': PAGE,
      'handling-fee': PAGE,
      'gmail-compare-toggle': TOOLBAR,
      'gmail-close-document': TOOLBAR,
    }
    for (const state of Object.values(STATES)) {
      const html = render(state)
      for (const name of GMAIL_ANCHORS) {
        const rect = GMAIL_ANCHOR_RECTS[name]
        const origin = parent[name] ?? { x: 0, y: APP_TOP }
        expect([name, styleNumber(html, name, 'left'), styleNumber(html, name, 'top'), styleNumber(html, name, 'width'), styleNumber(html, name, 'height')]).toEqual([name, rect.x - origin.x, rect.y - origin.y, rect.width, rect.height])
      }
    }
  })

  test('equal state and frame render equal markup', () => {
    const film: FilmContext = { frame: 40, reducedMotion: false, lastApplied: () => 38 }
    expect(render(compare(), film)).toBe(render(compare(), film))
  })
})

describe('APP-01 privacy, ink and film markup', () => {
  test('no account identifier or avatar: one mark, no address', () => {
    for (const state of Object.values(STATES)) {
      const html = render(state)
      expect(html.match(/<img/g)).toHaveLength(1)
      expect(html).toContain('alt="Gmail"')
      expect(text(html)).not.toMatch(/@|avatar|account/i)
      expect(html).not.toContain('href=')
    }
  })

  test('never cyan, never a hard stage shadow', () => {
    for (const state of Object.values(STATES)) {
      const html = render(state)
      expect(html).not.toMatch(/\barc\b|\barc-|2fd8ff/i)
      expect(html).not.toMatch(/shadow-\[\d/)
    }
  })

  test('a film has no CSS transition or animation; the clickable app fades in with reduced motion respected', () => {
    const film: FilmContext = { frame: 100, reducedMotion: false, lastApplied: () => 0 }
    for (const state of Object.values(STATES)) {
      const html = render(state, film)
      expect(html).not.toMatch(/transition|animate-|animation/)
    }
    expect(render(document_('INV-48219'))).toContain('motion-safe:animate-in')
  })

  test('the 150 ms reveal is derived from the frame inside a film and finishes', () => {
    const state = document_('INV-48219')
    const during: FilmContext = { frame: 3, reducedMotion: false, lastApplied: () => 1 }
    const after: FilmContext = { frame: 13, reducedMotion: false, lastApplied: () => 1 }
    const reduced: FilmContext = { frame: 3, reducedMotion: true, lastApplied: () => 1 }
    expect(tag(render(state, during), 'document-viewer')).toMatch(/opacity:0\.\d+/)
    expect(tag(render(state, after), 'document-viewer')).not.toContain('opacity')
    expect(tag(render(state, reduced), 'document-viewer')).not.toContain('opacity')
  })

  test('a document opened on clip frame 0 is the start state and is fully visible on that frame', () => {
    const first: FilmContext = { frame: 0, reducedMotion: false, lastApplied: () => 0 }
    expect(tag(render(document_('INV-48231'), first), 'document-viewer')).not.toContain('opacity')
  })

  describe('the 600 ms cross-slide of the earlier layout', () => {
    const innerOf = (html: string): string => {
      const at = html.indexOf(tag(html, 'invoice-v1')) + tag(html, 'invoice-v1').length
      const match = html.slice(at).match(/^<div[^>]*>/)
      if (!match) throw new Error('the earlier sheet has no inner wrapper')
      return match[0]
    }
    const at = (frame: number, reducedMotion = false): FilmContext => ({ frame, reducedMotion, lastApplied: (type) => (type === 'SET_DOCUMENT_VIEW' ? 10 : null) })

    test('the anchored element never moves; only the inner wrapper differs between first frame and settle', () => {
      const first = render(compare(), at(10))
      const settled = render(compare(), at(10 + 18))
      expect(tag(first, 'invoice-v1')).toBe(tag(settled, 'invoice-v1'))
      expect(tag(render(compare(), at(19)), 'invoice-v1')).toBe(tag(settled, 'invoice-v1'))
      expect(innerOf(first)).not.toBe(innerOf(settled))
      expect(innerOf(first)).toMatch(/opacity:0[;"]/)
      expect(innerOf(first)).toContain('translateX(72px)')
      expect(innerOf(settled)).not.toMatch(/opacity|transform/)
    })

    test('the slide eases in between: partway is neither start nor settled', () => {
      const middle = innerOf(render(compare(), at(14)))
      expect(middle).toMatch(/opacity:0\.\d+/)
      expect(middle).toMatch(/translateX\((?!72px)[\d.]+px\)/)
    })

    test('the earlier caption fades with the sheet and the current page stays fixed', () => {
      const first = render(compare(), at(10))
      const settled = render(compare(), at(28))
      expect(first).toMatch(/opacity:0[;"][^>]*>\s*Earlier layout/)
      expect(settled).not.toMatch(/opacity[^>]*>\s*Earlier layout/)
      expect(tag(first, 'document-page')).toBe(tag(settled, 'document-page'))
    })

    test('a film with no landed SET_DOCUMENT_VIEW, or reduced motion, renders settled', () => {
      const none: FilmContext = { frame: 5, reducedMotion: false, lastApplied: () => null }
      const settled = render(compare(), at(28))
      expect(render(compare(), none)).toBe(settled)
      expect(render(compare(), at(10, true))).toBe(settled)
    })

    test('the clickable app uses a motion-safe 600 ms animation with the reveal curve', () => {
      const html = render(compare())
      expect(innerOf(html)).toContain('motion-safe:animate-in')
      expect(innerOf(html)).toContain('animation-duration:600ms')
      expect(innerOf(html)).toContain('cubic-bezier(.16,1,.3,1)')
      expect(render(document_('INV-48231'))).not.toContain('slide-in-from-right')
    })
  })
})

// -- handlers: walk the element tree of the view and invoke the handlers it declares -----------
type Props = Record<string, unknown>
type Component = (props: Props) => ReactNode
const isComponent = (type: unknown): type is Component => typeof type === 'function'

interface Handler {
  readonly anchor: string | null
  readonly invoke: () => void
}

function handlers(node: unknown, anchor: string | null = null, found: Handler[] = []): Handler[] {
  if (Array.isArray(node)) {
    for (const child of node) handlers(child, anchor, found)
    return found
  }
  if (!isValidElement<Props>(node)) return found
  const { type, props } = node
  if (isComponent(type)) return handlers(type(props), anchor, found)
  const own = typeof props['data-film-anchor'] === 'string' ? props['data-film-anchor'] : anchor
  const onClick = props.onClick
  if (typeof onClick === 'function') found.push({ anchor: own, invoke: () => void onClick() })
  return handlers(props.children, own, found)
}

function clicks(state: State, anchor: string | null): Action[] {
  const sent: Action[] = []
  const found = handlers(GmailView({ state, dispatch: (action) => sent.push(action) }))
  const matches = found.filter((handler) => handler.anchor === anchor)
  expect(matches.length).toBeGreaterThan(0)
  for (const handler of matches) handler.invoke()
  return sent
}

describe('APP-01/02 interactions dispatch the reducer actions', () => {
  test('a record row opens its own message; the four neutral rows are inert', () => {
    for (const record of RECORD_IDS) {
      expect(clicks(inbox(), `inbox-row-${record.toLowerCase()}`)).toEqual([{ type: 'OPEN_MESSAGE', record }])
    }
    const clickable = handlers(GmailView({ state: inbox() })).filter((handler) => handler.anchor?.startsWith('inbox-row-'))
    expect(clickable).toHaveLength(4)
    const reduced = reduce(inbox(), { type: 'OPEN_MESSAGE', record: 'INV-48210' })
    expect(reduced.ui.app.record).toBe('INV-48210')
  })

  test('back, attachment, close and the folder button', () => {
    expect(clicks(message('INV-48219'), 'gmail-back')).toEqual([{ type: 'CLOSE_MESSAGE' }])
    expect(clicks(message('INV-48219'), 'attachment')).toEqual([{ type: 'OPEN_ATTACHMENT' }])
    expect(clicks(document_('INV-48219'), 'gmail-close-document')).toEqual([{ type: 'CLOSE_ATTACHMENT' }])
    expect(clicks(message('INV-48219'), null)).toEqual([{ type: 'CLOSE_MESSAGE' }])
    expect(clicks(inbox(), null)).toEqual([])
  })

  test('the layout toggle compares, then returns to a single layout', () => {
    expect(clicks(document_('INV-48231'), 'gmail-compare-toggle')).toEqual([{ type: 'SET_DOCUMENT_VIEW', view: 'compare' }])
    expect(clicks(compare(), 'gmail-compare-toggle')).toEqual([{ type: 'SET_DOCUMENT_VIEW', view: 'single' }])
  })

  test('a film has no dispatch: a click does nothing', () => {
    const film: FilmContext = { frame: 0, reducedMotion: false, lastApplied: () => null }
    const found = handlers(GmailView({ state: inbox(), film }))
    expect(found.length).toBeGreaterThan(0)
    for (const handler of found) expect(() => handler.invoke()).not.toThrow()
  })
})
