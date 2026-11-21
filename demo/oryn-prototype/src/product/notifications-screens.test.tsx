import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import type { Action, State } from '@/state'
import { act } from '@/state/test-helpers'
import { NotificationsScreen } from './NotificationsScreen'
import { NotificationToast } from './NotificationToast'

const render = (state: State) => renderToStaticMarkup(<NotificationsScreen state={state} />).replaceAll('<!-- -->', '')

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(node)) return []
  const renderNode = node.type as (props: Record<string, unknown>) => ReactNode
  const children = typeof renderNode === 'function' ? renderNode(node.props) : node.props.children as ReactNode
  return [node, ...elements(children)]
}
function click(state: State, pick: (props: Record<string, unknown>) => boolean): Action[] {
  const actions: Action[] = []
  const element = elements(<NotificationsScreen state={state} dispatch={(action) => actions.push(action)} />).find((item) => pick(item.props) && typeof item.props.onClick === 'function')
  if (typeof element?.props.onClick !== 'function') throw new Error('Missing notification action')
  ;(element.props.onClick as () => void)()
  return actions
}

describe('notification center', () => {
  test('shows occurred notices with distinct messages and recipients', () => {
    const markup = render(reconstruct('ST23'))
    for (const label of ['Approval Required', 'INV-48219', 'INC-0042 Contained', '3 affected cases paused', 'Confirm Kestrel handling-fee terms in writing', 'Fri 12:00', 'For Daniel Okafor', 'For Marcus Webb', 'For Priya Nair', 'Resolved']) expect(markup).toContain(label)
  })
  test('does not surface repair or release before their events', () => {
    const markup = render(reconstruct('ST11'))
    expect(markup).not.toContain('Repair Ready')
    expect(markup).not.toContain('Release Status')
  })
  test('filter and expanded state change visible content', () => {
    const state = reconstruct('ST23')
    const filtered = act(state, { type: 'SET_NOTIFICATION_VIEW', filter: 'reminders', open: 'N-03' })
    const markup = render(filtered)
    expect(markup).toContain('NetSuite vendor record')
    expect(markup).toContain('Read')
    expect(markup).not.toContain('Approval Required')
  })
  test('dismissal preserves underlying incident and approval; one toast is rendered', () => {
    const state = act(reconstruct('ST23'), { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'SURFACE_TOAST', id: 'N-02' })
    expect(renderToStaticMarkup(<NotificationToast state={state} />)).toContain('INC-0042 Contained')
    const dismissed = act(state, { type: 'DISMISS_NOTIFICATION', id: 'N-02' })
    expect(dismissed.incident).toEqual(state.incident)
    expect(dismissed.approval).toEqual(state.approval)
  })
  test('filters, expands, and opens the selected object', () => {
    const state = reconstruct('ST23')
    expect(click(state, (props) => props['data-film-anchor'] === 'filter-incidents')).toEqual([{ type: 'SET_NOTIFICATION_VIEW', filter: 'incidents' }])
    expect(click(state, (props) => props['data-film-anchor'] === 'notice-N-02')).toEqual([{ type: 'SET_NOTIFICATION_VIEW', open: 'N-02' }])
    const opened = act(state, { type: 'SET_NOTIFICATION_VIEW', open: 'N-02' })
    expect(click(opened, (props) => props.children === 'View incident')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC26' }])
    expect(click(opened, (props) => props.children === 'Dismiss')).toEqual([{ type: 'DISMISS_NOTIFICATION', id: 'N-02' }])
  })
  test('each expanded notice opens its object only for an authorized viewer', () => {
    const cases = [
      ['N-01', 'marcus', 'Review approval', 'SC23'],
      ['N-02', 'marcus', 'View incident', 'SC26'],
      ['N-03', 'priya', 'View commitment', 'SC11'],
      ['N-04', 'marcus', 'View repair', 'SC28'],
      ['N-05', 'marcus', 'View release', 'SC29'],
    ] as const
    for (const [id, personId, label, screen] of cases) {
      const state = act(reconstruct('ST23'), { type: 'SELECT_ACTOR', personId }, { type: 'SET_NOTIFICATION_VIEW', open: id })
      expect(click(state, (props) => props.children === label)).toEqual([{ type: 'OPEN_SCREEN', screen }])
    }
    const denied = act(reconstruct('ST23'), { type: 'SET_NOTIFICATION_VIEW', open: 'N-03' })
    expect(render(denied)).toContain('Only Priya can view this commitment.')
  })
})
