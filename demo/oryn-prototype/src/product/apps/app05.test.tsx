import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import { act } from '@/state/test-helpers'
import type { State } from '@/state'
import { NetSuiteView } from './NetSuiteView'
import { APP05_RECTS, HUD_RECTS } from './erp-layout'

const render = (state: State) => renderToStaticMarkup(<NetSuiteView state={state} />)
const anchor = (html: string, name: string) => html.match(new RegExp(`<[^>]*data-film-anchor="${name}"[^>]*>`))?.[0] ?? ''
const hidden = (html: string, name: string) => anchor(html, name).includes('display:none')
const manual = () => act(reconstruct('ST12'), { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'CONTAIN_INCIDENT', caseIds: ['INV-48231', 'INV-48233', 'INV-48236'] }, { type: 'SELECT_ACTOR', personId: 'elena' }, { type: 'OPEN_SCREEN', screen: 'SC06' }, { type: 'OPEN_BILL', record: 'INV-48231' })

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(node)) return []
  if (typeof node.type === 'function') return elements(Reflect.apply(node.type, undefined, [node.props]))
  return [node, ...elements(node.props.children as ReactNode)]
}

function click(state: State, name: string): State {
  let next = state
  const node = elements(<NetSuiteView state={state} dispatch={(action) => { next = act(next, action) }} />).find((item) => item.props['data-film-anchor'] === name)
  if (!node || typeof node.props.onClick !== 'function') throw new Error(`Missing button ${name}`)
  node.props.onClick()
  return next
}

describe('APP-05 distinct ERP contexts', () => {
  test('manual case shows correct editable amounts and guards teaching', () => {
    const state = manual()
    const html = render(state)
    for (const value of ['INV-48231', 'Kestrel Components', 'PO-1051', '$4,213.50', '$4,175.00', '$38.50', 'Complete manually', 'Teach Oryn What Changed']) expect(html).toContain(value)
    expect(html).not.toContain('INV-48220')
    expect(hidden(html, 'manual-completion')).toBe(false)
    expect(anchor(html, 'teach-correction')).toContain('aria-disabled="true"')
    const completed = act(state, { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48231' })
    expect(render(completed)).toContain('Elena Ruiz · INV-48231 · manually completed')
    expect(render(completed)).toContain('Completion evidence')
    expect(hidden(render(completed), 'complete-manually')).toBe(true)
    expect(anchor(render(completed), 'teach-correction')).not.toContain('aria-disabled="true"')
  })
  test('manual action and teach button dispatch through the reducer', () => {
    const state = manual()
    expect(click(state, 'teach-correction').route).toBe('SC06')
    const completed = click(state, 'complete-manually')
    expect(completed.incident.manualCompletions).toContain('INV-48231')
    expect(click(completed, 'teach-correction').route).toBe('SC27')
  })
  test('held timeout shows its own record and no retry control', () => {
    const state = act(reconstruct('ST11'), { type: 'SELECT_CASE', caseId: 'INV-48220' }, { type: 'OPEN_SCREEN', screen: 'SC06' })
    const html = render(state)
    for (const value of ['INV-48220', 'Northgate Pallets', '$2,732.50', 'PO-1044', 'Submission timed out', 'Outcome Unknown', 'Held', 'Do not resubmit until reconciled']) expect(html).toContain(value)
    expect(html).not.toContain('INV-48231')
    expect(html).not.toMatch(/<(?:button|a)\b[^>]*>[^<]*(?:retry|resubmit|submit again)/i)
    expect(hidden(html, 'timeout-banner')).toBe(false)
  })
  test('timeout notification dismisses only itself and Review opens the held case', () => {
    const state = act(reconstruct('ST11'), { type: 'SELECT_CASE', caseId: 'INV-48220' }, { type: 'OPEN_SCREEN', screen: 'SC06' })
    expect(APP05_RECTS.timeout).toEqual({ x: 872, y: 90, width: 360, height: 88 })
    expect(APP05_RECTS.timeoutClose).toEqual({ x: 1190, y: 98, width: 32, height: 32 })
    const dismissed = click(state, 'timeout-close')
    expect(hidden(render(dismissed), 'timeout-banner')).toBe(true)
    expect(render(dismissed)).toContain('Held vendor bill')
    expect(dismissed.job).toEqual(state.job)
    expect(dismissed.job.outcomes['INV-48220']).toBe('unknown')
    const reviewed = click(state, 'timeout-review')
    expect(reviewed.route).toBe('SC24')
    expect(reviewed.selectedCase).toBe('INV-48220')
  })
  test('an opened Kestrel bill shows Elena\u2019s manual context in either order; the held timeout shows for the selected unknown case otherwise', () => {
    const base = manual()
    const first = act(base, { type: 'SELECT_CASE', caseId: 'INV-48220' }, { type: 'OPEN_BILL', record: 'INV-48231' })
    const second = act(base, { type: 'OPEN_BILL', record: 'INV-48231' }, { type: 'SELECT_CASE', caseId: 'INV-48220' })
    for (const state of [first, second]) {
      expect(hidden(render(state), 'timeout-banner')).toBe(true)
      expect(hidden(render(state), 'manual-completion')).toBe(false)
    }
    const held = act(base, { type: 'OPEN_BILL', record: 'INV-48219' }, { type: 'SELECT_CASE', caseId: 'INV-48220' })
    expect(hidden(render(held), 'timeout-banner')).toBe(false)
    expect(hidden(render(held), 'manual-completion')).toBe(true)
  })
  test('peer guidance has validation and no incident or timeout', () => {
    const state = act(reconstruct('ST04'), { type: 'SELECT_ACTOR', personId: 'jamal' }, { type: 'OPEN_SCREEN', screen: 'SC04' })
    const html = render(state)
    expect(html).toContain('Known fix from AP East: Vendor tax ID format')
    expect(html).toContain('Guide Me')
    expect(hidden(html, 'tax-validation')).toBe(false)
    expect(hidden(html, 'manual-completion')).toBe(true)
    expect(hidden(html, 'timeout-banner')).toBe(true)
  })
  test('peer HUD does not cover its tax ID or bill inputs', () => {
    for (const card of Object.values(HUD_RECTS)) {
      for (const rect of [APP05_RECTS.taxField, { x: 260, y: 340, width: 560, height: 160 }]) {
        const overlap = rect.x < card.x + card.width && rect.x + rect.width > card.x && rect.y < card.y + card.height && rect.y + rect.height > card.y
        expect(overlap).toBe(false)
      }
    }
  })
})
