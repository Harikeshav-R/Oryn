import { describe, expect, test } from 'bun:test'
import { isValidElement, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Rect } from '@/film'
import { createInitialState, reconstruct, type Action, type State, type TrackerColumn, type TrackerInvoice } from '@/state'
import { act as run } from '@/state/test-helpers'
import type { FilmContext, ProductProps } from '../contract'
import { APP_TOP } from './frame'
import { TRACKER_ANCHORS, TRACKER_ANCHOR_RECTS, cellAfterKey, type TRACKERAnchor } from './tracker-layout'
import { TrackerView } from './TrackerView'

type Props = Record<string, unknown>
type El = ReactElement<Props>

/** Host elements of the rendered tree in document order. The view uses no hooks, so components can be called directly. */
function flatten(node: ReactNode, out: El[] = []): El[] {
  if (Array.isArray(node)) {
    node.forEach((child) => flatten(child as ReactNode, out))
    return out
  }
  if (!isValidElement<Props>(node)) return out
  if (typeof node.type === 'function') return flatten((node.type as (props: Props) => ReactNode)(node.props), out)
  if (typeof node.type === 'string') out.push(node)
  return flatten(node.props.children as ReactNode, out)
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map((child) => textOf(child as ReactNode)).join('')
  if (!isValidElement<Props>(node)) return ''
  if (typeof node.type === 'function') return textOf((node.type as (props: Props) => ReactNode)(node.props))
  return textOf(node.props.children as ReactNode)
}

function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Missing ${what}`)
  return value
}

const tree = (props: ProductProps): El[] => flatten(<TrackerView {...props} />)
const byAnchor = (props: ProductProps, name: string): El => must(tree(props).find((element) => element.props['data-film-anchor'] === name), `anchor ${name}`)
const html = (state: State, film?: FilmContext): string => renderToStaticMarkup(<TrackerView state={state} film={film} />)

const initial = createInitialState()
const focused = (invoice: TrackerInvoice, column: TrackerColumn): State => run(initial, { type: 'FOCUS_TRACKER_CELL', invoice, column })

const isRow = (element: El): boolean => element.props.role === 'row'
const dataRows = (props: ProductProps): El[] => tree(props).filter((element) => isRow(element) && typeof element.props['data-film-anchor'] === 'string')
const cellTexts = (row: El): string[] => flatten(row).filter((element) => element.props.role === 'gridcell').map((cell) => textOf(cell))
const cellOf = (props: ProductProps, invoice: TrackerInvoice, column: TrackerColumn): El =>
  must(tree(props).find((element) => element.props.role === 'gridcell' && element.props['data-invoice'] === invoice && element.props['data-column'] === column), `cell ${invoice} / ${column}`)
const formulaValue = (state: State): string => textOf(must(tree({ state }).find((element) => 'data-formula-value' in element.props), 'formula value'))
const tabStops = (state: State): string[] =>
  tree({ state })
    .filter((element) => element.props.role === 'gridcell' && element.props.tabIndex === 0)
    .map((element) => `${String(element.props['data-invoice'])}/${String(element.props['data-column'])}`)

const EM = '\u2014'
const EXPECTED: readonly (readonly string[])[] = [
  ['INV-48203', 'Brightwater Industrial', EM, EM, EM],
  ['INV-48210', 'Brightwater Industrial', EM, EM, EM],
  ['INV-48215', 'Ironbark Fasteners', 'Missing Purchase Order', 'AP East', 'Escalated'],
  ['INV-48218', 'Sable & Co. Logistics', 'Missing Purchase Order', 'AP East', 'Escalated'],
  ['INV-48219', 'Brightwater Industrial', 'Variance above 2.00%', 'Daniel Okafor', 'Approval Required'],
  ['INV-48220', 'Northgate Pallets', 'ERP submit timed out', 'AP East', 'Outcome Unknown'],
]

/** A keyboard event with only what the view's handler reads; the document lookup finds no element. */
function keyEvent(key: string, shiftKey: boolean): KeyboardEvent<HTMLElement> {
  const event = { key, shiftKey, preventDefault: () => undefined, currentTarget: { ownerDocument: { getElementById: () => null } } }
  // A structural stand-in for the DOM event: the handler reads only these four members.
  return event as unknown as KeyboardEvent<HTMLElement>
}

function handlerOf(element: El, name: 'onKeyDown' | 'onClick'): (...args: unknown[]) => void {
  const handler = element.props[name]
  if (typeof handler !== 'function') throw new Error(`No ${name} handler`)
  return (...args) => handler(...args)
}

/** Press `key` on one cell and return every action the view dispatched. */
function press(state: State, invoice: TrackerInvoice, column: TrackerColumn, key: string, shiftKey = false): Action[] {
  const dispatched: Action[] = []
  handlerOf(cellOf({ state, dispatch: (action) => dispatched.push(action) }, invoice, column), 'onKeyDown')(keyEvent(key, shiftKey))
  return dispatched
}

function rectOf(style: unknown): Rect {
  if (typeof style !== 'object' || style === null) throw new Error('No inline style')
  const num = (key: string): number => {
    const value = Object.entries(style).find(([name]) => name === key)?.[1]
    if (typeof value !== 'number') throw new Error(`Style has no numeric ${key}`)
    return value
  }
  return { x: num('left'), y: num('top'), width: num('width'), height: num('height') }
}
const shift = (parent: Rect, child: Rect): Rect => ({ x: parent.x + child.x, y: parent.y + child.y, width: child.width, height: child.height })

describe('AP Exceptions Tracker rows', () => {
  test('shows exactly six rows in ascending invoice order with exact cell text', () => {
    const shown = dataRows({ state: initial })
    expect(shown.map((row) => row.props['data-film-anchor'])).toEqual(['tracker-row-inv-48203', 'tracker-row-inv-48210', 'tracker-row-inv-48215', 'tracker-row-inv-48218', 'tracker-row-inv-48219', 'tracker-row-inv-48220'])
    expect(shown.map(cellTexts)).toEqual(EXPECTED.map((row) => [...row]))
  })

  test('the two missing-PO exceptions are distinct rows with their own invoice and supplier', () => {
    const shown = dataRows({ state: initial }).map(cellTexts)
    const first = must(shown[2], 'INV-48215 row')
    const second = must(shown[3], 'INV-48218 row')
    expect(first[0]).toBe('INV-48215')
    expect(second[0]).toBe('INV-48218')
    expect(first[1]).not.toBe(second[1])
    expect(first[2]).toBe('Missing Purchase Order')
    expect(second[2]).toBe('Missing Purchase Order')
  })

  test('context rows state no issue, owner or outcome and carry no status badge', () => {
    const shown = dataRows({ state: initial })
    for (const row of [must(shown[0], 'INV-48203 row'), must(shown[1], 'INV-48210 row')]) {
      expect(cellTexts(row).slice(2)).toEqual([EM, EM, EM])
      expect(flatten(row).some((element) => 'data-status' in element.props)).toBe(false)
    }
  })

  test('state cells use status badges; Outcome Unknown carries its text and a hatched glyph', () => {
    const shown = dataRows({ state: initial })
    const statuses = shown.map((row) => flatten(row).find((element) => 'data-status' in element.props)?.props['data-status'])
    expect(statuses).toEqual([undefined, undefined, 'escalated', 'escalated', 'approval', 'unknown'])
    const badge = must(flatten(must(shown[5], 'INV-48220 row')).find((element) => element.props['data-status'] === 'unknown'), 'unknown badge')
    expect(textOf(badge)).toBe('Outcome Unknown')
    const hatch = must(flatten(badge).find((element) => 'data-hatch' in element.props), 'hatched glyph')
    expect(hatch.props.children).toBeUndefined()
  })

  test('a handoff row never reads as verified, and no execution cyan appears', () => {
    const markup = html(focused('INV-48220', 'state'))
    expect(markup).not.toMatch(/Verified|Approved|data-glyph="verified"|data-status="verified"/)
    expect(markup).not.toMatch(/--arc|2fd8ff|\b(?:bg|text|border|ring|fill|stroke)-arc/i)
  })

  test('on the observation week (ST02) the sheet states only the context rows, never a later invoice', () => {
    const observing = reconstruct('ST02')
    const shown = dataRows({ state: observing })
    expect(shown.map((row) => row.props['data-film-anchor'])).toEqual(['tracker-row-inv-48203', 'tracker-row-inv-48210'])
    expect(shown.map(cellTexts)).toEqual(EXPECTED.slice(0, 2).map((row) => [...row]))
    expect(html(observing)).not.toMatch(/INV-4821[5-9]|INV-48220|Outcome Unknown|Approval Required|Escalated/)
    const started = reconstruct('ST10')
    expect(dataRows({ state: started }).map(cellTexts)).toEqual(EXPECTED.map((row) => [...row]))
  })

  test('rows beyond the six are empty grid rows', () => {
    const empty = tree({ state: initial }).filter((element) => isRow(element) && element.props['data-film-anchor'] === undefined && typeof element.props['aria-rowindex'] === 'number' && element.props['aria-rowindex'] > 7)
    expect(empty.length).toBeGreaterThan(0)
    for (const row of empty) expect(cellTexts(row).every((text) => text === '')).toBe(true)
  })
})

describe('AP Exceptions Tracker selection', () => {
  test('no cell is selected by default: empty formula bar, no outline, the first cell is the only tab stop', () => {
    expect(formulaValue(initial)).toBe('')
    expect(html(initial)).not.toContain('inset 0 0 0 2px')
    expect(tabStops(initial)).toEqual(['INV-48203/invoice'])
  })

  test('the focused cell has the neutral ink inset outline, its text in the formula bar and the tab stop', () => {
    const state = focused('INV-48219', 'issue')
    expect(formulaValue(state)).toBe('Variance above 2.00%')
    expect(html(state).split('inset 0 0 0 2px var(--foreground)').length - 1).toBe(1)
    expect(cellOf({ state }, 'INV-48219', 'issue').props['aria-selected']).toBe(true)
    expect(cellOf({ state }, 'INV-48219', 'supplier').props['aria-selected']).toBe(false)
    expect(tabStops(state)).toEqual(['INV-48219/issue'])
    expect(byAnchor({ state }, 'tracker-row-inv-48219').props['data-focused-row']).toBe('true')
    expect(byAnchor({ state }, 'tracker-row-inv-48215').props['data-focused-row']).toBeUndefined()
  })

  test('the formula bar follows the focused cell, including an unstated value', () => {
    expect(formulaValue(focused('INV-48220', 'state'))).toBe('Outcome Unknown')
    expect(formulaValue(focused('INV-48218', 'supplier'))).toBe('Sable & Co. Logistics')
    expect(formulaValue(focused('INV-48210', 'owner'))).toBe(EM)
  })

  test('selection never moves an anchored rectangle', () => {
    const geometry = (state: State): Rect[] => TRACKER_ANCHORS.map((name) => rectOf(byAnchor({ state }, name).props.style))
    expect(geometry(focused('INV-48215', 'invoice'))).toEqual(geometry(initial))
    expect(geometry(focused('INV-48220', 'state'))).toEqual(geometry(initial))
  })

  test('clicking a cell dispatches FOCUS_TRACKER_CELL for that cell only', () => {
    const dispatched: Action[] = []
    handlerOf(cellOf({ state: initial, dispatch: (action) => dispatched.push(action) }, 'INV-48218', 'owner'), 'onClick')()
    expect(dispatched).toEqual([{ type: 'FOCUS_TRACKER_CELL', invoice: 'INV-48218', column: 'owner' }])
  })
})

describe('AP Exceptions Tracker keyboard', () => {
  const to = (invoice: TrackerInvoice, column: TrackerColumn): Action[] => [{ type: 'FOCUS_TRACKER_CELL', invoice, column }]

  test('arrow keys move focus one cell and stop at the edges', () => {
    expect(press(initial, 'INV-48215', 'supplier', 'ArrowRight')).toEqual(to('INV-48215', 'issue'))
    expect(press(initial, 'INV-48215', 'supplier', 'ArrowLeft')).toEqual(to('INV-48215', 'invoice'))
    expect(press(initial, 'INV-48215', 'supplier', 'ArrowDown')).toEqual(to('INV-48218', 'supplier'))
    expect(press(initial, 'INV-48215', 'supplier', 'ArrowUp')).toEqual(to('INV-48210', 'supplier'))
    expect(press(initial, 'INV-48203', 'invoice', 'ArrowUp')).toEqual([])
    expect(press(initial, 'INV-48203', 'invoice', 'ArrowLeft')).toEqual([])
    expect(press(initial, 'INV-48220', 'state', 'ArrowDown')).toEqual([])
    expect(press(initial, 'INV-48220', 'state', 'ArrowRight')).toEqual([])
  })

  test('Tab moves across a row, wraps to the next row and leaves the grid at either end', () => {
    expect(press(initial, 'INV-48215', 'issue', 'Tab')).toEqual(to('INV-48215', 'owner'))
    expect(press(initial, 'INV-48215', 'state', 'Tab')).toEqual(to('INV-48218', 'invoice'))
    expect(press(initial, 'INV-48218', 'invoice', 'Tab', true)).toEqual(to('INV-48215', 'state'))
    expect(press(initial, 'INV-48220', 'state', 'Tab')).toEqual([])
    expect(press(initial, 'INV-48203', 'invoice', 'Tab', true)).toEqual([])
    expect(cellAfterKey({ invoice: 'INV-48203', column: 'invoice' }, 'a')).toBeNull()
  })

  test('Enter on an invoice cell opens that case; INV-48203 has no case and other columns do nothing', () => {
    for (const invoice of ['INV-48210', 'INV-48215', 'INV-48218', 'INV-48219', 'INV-48220'] as const) {
      expect(press(initial, invoice, 'invoice', 'Enter')).toEqual([{ type: 'SELECT_CASE', caseId: invoice }])
    }
    expect(press(initial, 'INV-48203', 'invoice', 'Enter')).toEqual([])
    expect(press(initial, 'INV-48215', 'supplier', 'Enter')).toEqual([])
    expect(press(initial, 'INV-48220', 'state', 'Enter')).toEqual([])
  })
})

describe('AP Exceptions Tracker geometry and film', () => {
  test('every anchor renders once, shown, at its declared rectangle', () => {
    const markup = html(initial)
    const names = [...markup.matchAll(/data-film-anchor="([^"]+)"/g)].map((match) => match[1])
    expect([...names].sort()).toEqual([...TRACKER_ANCHORS].sort())
    expect(markup).not.toContain('display:none')

    const props: ProductProps = { state: initial }
    const style = (name: string): Rect => rectOf(byAnchor(props, name).props.style)
    const strip = rectOf(must(tree(props).find((element) => element.type === 'header'), 'menu strip').props.style)
    const grid = style('tracker-grid')
    const absolute = (name: TRACKERAnchor): Rect => {
      if (name === 'tracker-title') return shift(strip, style(name))
      if (name === 'tracker-formula' || name === 'tracker-grid') return style(name)
      if (name.startsWith('tracker-row-')) return shift(grid, style(name))
      return shift(shift(grid, style(`tracker-row-${name.slice('tracker-cell-'.length)}`)), style(name))
    }
    for (const name of TRACKER_ANCHORS) {
      const declared = TRACKER_ANCHOR_RECTS[name]
      expect(absolute(name)).toEqual({ ...declared, y: declared.y - APP_TOP })
    }
  })

  test('the declared rectangles are the inventory geometry', () => {
    expect(TRACKER_ANCHOR_RECTS['tracker-formula']).toEqual({ x: 0, y: 116, width: 1280, height: 32 })
    expect(TRACKER_ANCHOR_RECTS['tracker-grid']).toEqual({ x: 0, y: 148, width: 1040, height: 204 })
    expect(TRACKER_ANCHOR_RECTS['tracker-row-inv-48203']).toEqual({ x: 0, y: 184, width: 1040, height: 28 })
    expect(TRACKER_ANCHOR_RECTS['tracker-row-inv-48220']).toEqual({ x: 0, y: 324, width: 1040, height: 28 })
    expect(TRACKER_ANCHOR_RECTS['tracker-cell-inv-48210']).toEqual({ x: 40, y: 212, width: 170, height: 28 })
  })

  test('film markup has no transition or animation and is a pure function of state and frame', () => {
    const film = (frame: number): FilmContext => ({ frame, reducedMotion: false, lastApplied: (type) => (type === 'FOCUS_TRACKER_CELL' ? 1 : null) })
    const state = focused('INV-48215', 'invoice')
    const markup = html(state, film(3))
    expect(markup).not.toMatch(/transition|animate-/)
    expect(markup).toBe(html(state, film(3)))
    expect(markup).toContain('color-mix')
    expect(html(state, film(9))).toContain('inset 0 0 0 2px var(--foreground)')
    expect(html(state)).toContain('motion-reduce:transition-none')
  })
})
