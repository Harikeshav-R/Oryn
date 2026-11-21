import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct, type State } from '@/state'
import { act } from '@/state/test-helpers'
import { HubSpotView } from './HubSpotView'
import { HUBSPOT_ANCHOR_RECTS } from './hubspot-layout'

const render = (state: State) => renderToStaticMarkup(<HubSpotView state={state} />)
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(node)) return []
  if (typeof node.type === 'function') return elements(Reflect.apply(node.type, undefined, [node.props]))
  return [node, ...elements(node.props.children as ReactNode)]
}
function click(state: State, anchor: string): State {
  let next = state
  const element = elements(<HubSpotView state={state} dispatch={(action) => { next = act(next, action) }} />).find((item) => item.props['data-film-anchor'] === anchor)
  if (typeof element?.props.onClick !== 'function') throw new Error(`Missing action ${anchor}`)
  element.props.onClick()
  return next
}

describe('APP-09 and SC32', () => {
  test('draft shows the block, approver and only fixture facts', () => {
    const html = render(reconstruct('ST20'))
    for (const text of ['Deal', 'Discount draft', '12% discount', 'Requires Tier 3 approval - Daniel Okafor', 'Action blocked until authorized', 'Request approval', 'Submit']) expect(html).toContain(text)
    expect(html).not.toMatch(/INV-|\$\d|orbit|execution/i)
    expect(html).toMatch(/data-film-anchor="blocked-submit"[^>]*aria-disabled="true"/)
    expect(HUBSPOT_ANCHOR_RECTS['discount-field']).toEqual({ x: 410, y: 280, width: 240, height: 40 })
  })
  test('the block does not cover the discount field and Submit has no handler', () => {
    const field = HUBSPOT_ANCHOR_RECTS['discount-field']
    const card = HUBSPOT_ANCHOR_RECTS['blocked-action']
    expect(field.x + field.width).toBeLessThanOrEqual(card.x)
    const submit = elements(<HubSpotView state={reconstruct('ST20')} />).find((item) => item.props['data-film-anchor'] === 'blocked-submit')
    expect(submit?.props['aria-disabled']).toBe('true')
    expect(submit?.props.onClick).toBeUndefined()
  })
  test('request and Daniel denial remain blocked without granting approval', () => {
    const before = reconstruct('ST20')
    const requested = click(before, 'request-approval')
    expect(requested.unsafeRequest).toBe('requested')
    expect(requested.approval).toEqual(before.approval)
    expect(render(requested)).toContain('Approval requested · awaiting Daniel Okafor')
    expect(render(requested)).toContain('Action blocked until authorized')
    const daniel = act(requested, { type: 'SELECT_ACTOR', personId: 'daniel' })
    const denied = click(daniel, 'deny-request')
    expect(denied.unsafeRequest).toBe('denied')
    expect(denied.approval).toEqual(before.approval)
    expect(render(denied)).toContain('Approval denied')
    expect(render(denied)).toContain('Action blocked until authorized')
  })
})
