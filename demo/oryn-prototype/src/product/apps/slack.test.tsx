import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Rect } from '@/film'
import { createInitialState, type Action, type State } from '@/state'
import { act as run } from '@/state/test-helpers'
import type { FilmContext, ProductProps } from '../contract'
import { APP_TOP } from './frame'
import { SLACK_ANCHORS, SLACK_ANCHOR_RECTS, type SLACKAnchor } from './slack-layout'
import { SlackView } from './SlackView'

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

const tree = (props: ProductProps): El[] => flatten(<SlackView {...props} />)
const byAnchor = (props: ProductProps, name: string): El => must(tree(props).find((element) => element.props['data-film-anchor'] === name), `anchor ${name}`)
const html = (state: State, film?: FilmContext): string => renderToStaticMarkup(<SlackView state={state} film={film} />)
const openingTag = (markup: string, name: string): string => must(markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0], `tag for ${name}`)
const hidden = (markup: string, name: string): boolean => openingTag(markup, name).includes('display:none')

const initial = createInitialState()
const selected = (caseId: string): State => run(initial, { type: 'SELECT_CASE', caseId })

const messages = (state: State): El[] => tree({ state }).filter((element) => element.props.role === 'listitem')
const pane = (state: State): string => textOf(byAnchor({ state }, 'slack-case'))

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

/** Click one case link and return every action the view dispatched. */
function clickLink(state: State, invoice: string): Action[] {
  const dispatched: Action[] = []
  const onClick = byAnchor({ state, dispatch: (action) => dispatched.push(action) }, `slack-link-${invoice.toLowerCase()}`).props.onClick
  if (typeof onClick !== 'function') throw new Error('The link has no click handler')
  onClick()
  return dispatched
}

describe('Slack channel', () => {
  test('shows the workspace, one active channel and no member names', () => {
    const markup = html(initial)
    const nav = textOf(must(tree({ state: initial }).find((element) => element.type === 'nav'), 'workspace rail'))
    expect(nav).toBe('Calder & VanceChannels#ap-escalations')
    expect(textOf(byAnchor({ state: initial }, 'slack-channel'))).toBe('#ap-escalations')
    expect(markup).not.toMatch(/Priya|Jamal|Marcus|Elena|Daniel|Tomas|Dana|Okafor/)
    expect(markup).not.toMatch(/\d{1,2}:\d{2}/)
  })

  test('shows three separate messages with the exact texts', () => {
    expect(messages(initial).map((message) => textOf(message))).toEqual(['Missing purchase order: INV-48215', 'Missing purchase order: INV-48218', 'INV-48219'])
    expect(messages(initial).map((message) => message.props['data-film-anchor'])).toEqual(['slack-message-inv-48215', 'slack-message-inv-48218', 'slack-message-inv-48219'])
  })

  test('the composer takes focus and text, shows its placeholder and cannot send', () => {
    const markup = html(initial)
    const composer = byAnchor({ state: initial }, 'slack-composer')
    const field = must(flatten(composer).find((element) => element.type === 'textarea'), 'composer field')
    expect(field.props.placeholder).toBe('Message #ap-escalations')
    expect(field.props.disabled).toBeUndefined()
    expect(field.props.readOnly).toBeUndefined()
    expect(field.props.onKeyDown).toBeUndefined()
    expect(markup).toContain('placeholder="Message #ap-escalations"')

    const send = must(flatten(composer).find((element) => element.props['aria-label'] === 'Send'), 'Send button')
    expect(send.props['aria-disabled']).toBe('true')
    expect(textOf(composer)).toContain('Sending needs authorization')
    const dispatched: Action[] = []
    const withDispatch = byAnchor({ state: initial, dispatch: (action) => dispatched.push(action) }, 'slack-composer')
    const sendWith = must(flatten(withDispatch).find((element) => element.props['aria-label'] === 'Send'), 'Send button')
    const onClick = sendWith.props.onClick
    if (typeof onClick !== 'function') throw new Error('Send has no handler')
    onClick({ preventDefault: () => undefined })
    expect(dispatched).toEqual([])
  })
})

describe('Slack case links', () => {
  test('clicking each link opens that invoice as the selected case', () => {
    for (const invoice of ['INV-48215', 'INV-48218', 'INV-48219']) {
      expect(clickLink(initial, invoice)).toEqual([{ type: 'SELECT_CASE', caseId: invoice }])
    }
  })

  test('the Case pane is hidden until one of the three cases is selected', () => {
    expect(hidden(html(initial), 'slack-case')).toBe(true)
    expect(hidden(html(selected('INV-48210')), 'slack-case')).toBe(true)
    for (const invoice of ['INV-48215', 'INV-48218', 'INV-48219']) expect(hidden(html(selected(invoice)), 'slack-case')).toBe(false)
  })

  test('each pane shows that invoice\'s own supplier, qualifier, amount, PO and outcome', () => {
    const first = pane(selected('INV-48215'))
    expect(first).toContain('INV-48215')
    expect(first).toContain('Ironbark Fasteners')
    expect(first).toContain('Missing Purchase Order')
    expect(first).toContain('$2,260.00')
    expect(first).toContain('PO\u2014')
    expect(first).toContain('Escalated')

    const second = pane(selected('INV-48218'))
    expect(second).toContain('Sable & Co. Logistics')
    expect(second).toContain('$4,415.00')
    expect(second).toContain('PO\u2014')
    expect(second).toContain('Escalated')
    expect(second).not.toContain('Ironbark')

    const hero = pane(selected('INV-48219'))
    expect(hero).toContain('Brightwater Industrial')
    expect(hero).toContain('Tier 3')
    expect(hero).toContain('$18,420.00')
    expect(hero).toContain('PO-1042')
  })

  test('the hero reference never implies approval or verification', () => {
    const state = selected('INV-48219')
    const hero = pane(state)
    expect(hero).toContain('Approval Required')
    expect(hero).not.toMatch(/Approved|Verified/)
    const badge = must(flatten(byAnchor({ state }, 'slack-case')).find((element) => 'data-status' in element.props), 'outcome badge')
    expect(badge.props['data-status']).toBe('approval')
    expect(html(state)).not.toMatch(/Approved|Verified|data-glyph="verified"|data-status="verified"/)
    expect(textOf(messages(state)[2] as ReactNode)).toBe('INV-48219')
  })

  test('the open case marks its own message only', () => {
    const state = selected('INV-48218')
    expect(messages(state).map((message) => message.props['data-selected'])).toEqual([undefined, 'true', undefined])
  })
})

describe('Slack geometry and film', () => {
  test('every anchor renders once and sits at its declared rectangle', () => {
    const markup = html(selected('INV-48215'))
    const names = [...markup.matchAll(/data-film-anchor="([^"]+)"/g)].map((match) => match[1])
    expect([...names].sort()).toEqual([...SLACK_ANCHORS].sort())

    const props: ProductProps = { state: selected('INV-48215') }
    const style = (name: string): Rect => rectOf(byAnchor(props, name).props.style)
    const absolute = (name: SLACKAnchor): Rect => (name.startsWith('slack-link-') ? shift(style(`slack-message-${name.slice('slack-link-'.length)}`), style(name)) : style(name))
    for (const name of SLACK_ANCHORS) {
      const declared = SLACK_ANCHOR_RECTS[name]
      expect(absolute(name)).toEqual({ ...declared, y: declared.y - APP_TOP })
    }
  })

  test('messages are fixed 64px rows on a 70px stride and never overlap the Case pane', () => {
    const rows = (['slack-message-inv-48215', 'slack-message-inv-48218', 'slack-message-inv-48219'] as const).map((name) => SLACK_ANCHOR_RECTS[name])
    expect(rows.map((row) => row.y)).toEqual([150, 220, 290])
    for (const row of rows) {
      expect(row.height).toBe(64)
      expect(row.x + row.width).toBeLessThanOrEqual(SLACK_ANCHOR_RECTS['slack-case'].x)
    }
    expect(SLACK_ANCHOR_RECTS['slack-case']).toEqual({ x: 960, y: 132, width: 320, height: 450 })
    expect(SLACK_ANCHOR_RECTS['slack-composer']).toEqual({ x: 240, y: 582, width: 1000, height: 64 })
    expect(SLACK_ANCHOR_RECTS['slack-channel']).toEqual({ x: 220, y: 76, width: 1060, height: 56 })
  })

  test('opening a case never moves any other anchor', () => {
    const rect = (state: State, name: SLACKAnchor): Rect => rectOf(byAnchor({ state }, name).props.style)
    for (const name of SLACK_ANCHORS) expect(rect(selected('INV-48219'), name)).toEqual(rect(initial, name))
  })

  test('film markup has no transition or animation, no execution cyan, and is a pure function of state and frame', () => {
    const film: FilmContext = { frame: 12, reducedMotion: false, lastApplied: () => 0 }
    const state = selected('INV-48219')
    const markup = html(state, film)
    expect(markup).not.toMatch(/transition|animate-/)
    expect(markup).not.toMatch(/--arc|2fd8ff|\b(?:bg|text|border|ring|fill|stroke)-arc/i)
    expect(markup).toBe(html(state, film))
    expect(html(state)).toContain('motion-reduce:transition-none')
  })
})
