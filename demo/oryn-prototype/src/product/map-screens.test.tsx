import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import type { Action } from '@/state'
import { renderToStaticMarkup } from 'react-dom/server'
import { OPERATIONS_NODES, OPERATIONS_RELATIONS } from '@/data/operations-graph'
import { reconstruct } from '@/state'
import { act } from '@/state/test-helpers'
import { MapScreen } from './MapScreen'

const base = act(reconstruct('ST17'), { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'OPEN_SCREEN', screen: 'SC16' })
const html = (state: typeof base) => renderToStaticMarkup(<MapScreen state={state} />).replaceAll('<!-- -->', '')

describe('Operations Map', () => {
  test('shows all graph objects and types', () => {
    const markup = html(base)
    for (const node of OPERATIONS_NODES) { expect(markup).toContain(node.name); expect(markup).toContain(node.kind) }
    expect(markup).toContain('stroke-dasharray="5 3"')
    expect(markup).not.toContain('text-arc')
  })
  test('selects agent and cites distinct rule and incident evidence', () => {
    const markup = html(act(base, { type: 'SELECT_MAP_NODE', node: 'agent' }))
    expect(markup).toContain('AP-RULE-009')
    expect(markup).toContain('INC-0042')
    expect(markup.match(/>Evidence</g)?.length).toBe(2)
    expect(markup).toContain('stroke-width="2"')
  })
  test('table presents the same objects and relations', () => {
    const markup = html(act(base, { type: 'SET_MAP_VIEW', view: 'table' }))
    for (const node of OPERATIONS_NODES) expect(markup).toContain(node.name)
    for (const relation of OPERATIONS_RELATIONS) { expect(markup).toContain(relation.name); expect(markup).toContain(relation.status) }
  })
  test('candidate edge stays dashed while selection is shared with table', () => {
    const graph = html(act(base, { type: 'SELECT_MAP_NODE', node: 'workflow' }))
    expect(graph).toMatch(/stroke-width="2" stroke-dasharray="5 3"/)
    const table = html(act(base, { type: 'SELECT_MAP_NODE', node: 'agent' }, { type: 'SET_MAP_VIEW', view: 'table' }))
    expect(table).toMatch(/aria-pressed="true"[^>]*>[^<]*<span[^>]*>Agent<\/span>Supplier Invoice Reconciler/)
  })
  test('denies views without navigation access', () => {
    expect(html(act(base, { type: 'SELECT_ACTOR', personId: 'priya' }))).toContain('Not available')
  })
  test('agent and table controls dispatch their reducer actions', () => {
    const actions: Action[] = []
    function find(node: ReactNode, name: string): ReactElement<Record<string, unknown>> | undefined {
      if (Array.isArray(node)) return node.map((child: ReactNode) => find(child, name)).find(Boolean)
      if (!isValidElement<Record<string, unknown>>(node)) return undefined
      if (node.props['data-film-anchor'] === name) return node
      if (typeof node.type === 'function') return find((node.type as (props: Record<string, unknown>) => ReactNode)(node.props), name)
      return find(node.props.children as ReactNode, name)
    }
    const tree = <MapScreen state={base} dispatch={(action) => actions.push(action)} />
    const agent = find(tree, 'map-agent')
    const table = find(tree, 'map-toggle-table')
    expect(agent).toBeDefined()
    expect(table).toBeDefined()
    ;(agent!.props.onClick as () => void)()
    ;(table!.props.onClick as () => void)()
    expect(actions).toEqual([{ type: 'SELECT_MAP_NODE', node: 'agent' }, { type: 'SET_MAP_VIEW', view: 'table' }])
  })
})
