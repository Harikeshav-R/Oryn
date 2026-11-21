import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Action } from '@/state'
import { CAPABILITY_COLUMNS, CAPABILITY_MATRIX, OTHER_APPLICATIONS } from '@/data/capabilities'
import { reconstruct } from '@/state'
import { act } from '@/state/test-helpers'
import { CapabilitiesScreen } from './CapabilitiesScreen'

const base = act(reconstruct('ST17'), { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'OPEN_SCREEN', screen: 'SC36' })
const html = (state: typeof base) => renderToStaticMarkup(<CapabilitiesScreen state={state} />).replaceAll('<!-- -->', '')

describe('Application capabilities', () => {
  test('shows all 35 explicit intersections and the meeting condition', () => {
    const markup = html(base)
    for (const column of CAPABILITY_COLUMNS) expect(markup).toContain(column)
    for (const row of CAPABILITY_MATRIX) expect(markup).toContain(row.application)
    expect(markup.match(/data-capability-cell=/g)).toHaveLength(35)
    expect(markup.match(/— Unavailable/g)).toHaveLength(17)
    expect(markup).toContain('Observe by per-meeting opt-in')
  })
  test('each application reports its own capabilities without inferring extras', () => {
    const markup = html(base)
    const expected = [
      ['Gmail', 'Available', 'Available', 'Available', 'Unavailable', 'Unavailable'],
      ['NetSuite', 'Available', 'Available', 'Unavailable', 'Available', 'Unavailable'],
      ['Google Sheets', 'Available', 'Available', 'Unavailable', 'Available', 'Unavailable'],
      ['Slack', 'Available', 'Available', 'Unavailable', 'Unavailable', 'Unavailable'],
      ['Zoom', 'Observe by per-meeting opt-in', 'Available', 'Unavailable', 'Unavailable', 'Unavailable'],
      ['HubSpot', 'Available', 'Available', 'Available', 'Unavailable', 'Unavailable'],
      ['Chrome', 'Available', 'Available', 'Unavailable', 'Unavailable', 'Unavailable'],
    ]
    for (const [app, ...values] of expected) {
      CAPABILITY_COLUMNS.forEach((column, index) => expect(markup).toContain(`aria-label="${app} ${column}: ${values[index]}"`))
    }
    for (const app of OTHER_APPLICATIONS) expect(markup).not.toContain(`data-capability-cell="${app}:`)
  })
  test('details distinguish capability, authorization, absence and consent', () => {
    const selected = (application: 'Gmail' | 'Zoom', capability: 'Observe' | 'Run Autonomously') => html(act(base, { type: 'SET_CAPABILITY_VIEW', selected: { application, capability } }))
    expect(selected('Gmail', 'Observe')).toContain('Capability is not authorization')
    expect(selected('Gmail', 'Run Autonomously')).toContain('No action is available')
    expect(selected('Zoom', 'Observe')).toContain('Capture consent never implies meeting consent')
  })
  test('tiles list thirteen names and distinguish the six decorative extras', () => {
    const markup = html(act(base, { type: 'SET_CAPABILITY_VIEW', view: 'tiles' }))
    for (const app of [...CAPABILITY_MATRIX.map((row) => row.application), ...OTHER_APPLICATIONS]) expect(markup).toContain(app)
    expect(markup.match(/data-extra-mark="true"/g)).toHaveLength(6)
    expect(markup).toContain('per-meeting opt-in')
  })
  test('denies views without navigation access', () => {
    expect(html(act(base, { type: 'SELECT_ACTOR', personId: 'priya' }))).toContain('Not available')
  })
  test('cell click and Escape dispatch selection without authorization', () => {
    const actions: Action[] = []
    function find(node: ReactNode, name: string): ReactElement<Record<string, unknown>> | undefined {
      if (Array.isArray(node)) return node.map((child: ReactNode) => find(child, name)).find(Boolean)
      if (!isValidElement<Record<string, unknown>>(node)) return undefined
      if (node.props['data-film-anchor'] === name) return node
      if (typeof node.type === 'function') return find((node.type as (props: Record<string, unknown>) => ReactNode)(node.props), name)
      return find(node.props.children as ReactNode, name)
    }
    const cell = find(<CapabilitiesScreen state={base} dispatch={(action) => actions.push(action)} />, 'cap-cell-gmail-observe')
    expect(cell).toBeDefined()
    ;(cell!.props.onClick as () => void)()
    ;(cell!.props.onKeyDown as (event: { key: string }) => void)({ key: 'Escape' })
    expect(actions).toEqual([{ type: 'SET_CAPABILITY_VIEW', selected: { application: 'Gmail', capability: 'Observe' } }, { type: 'SET_CAPABILITY_VIEW', selected: null }])
  })
})
