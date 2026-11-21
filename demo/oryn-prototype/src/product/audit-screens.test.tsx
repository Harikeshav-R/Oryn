import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import type { Action, State } from '@/state'
import { act } from '@/state/test-helpers'
import { AuditScreen } from './AuditScreen'

const render = (state: State) => renderToStaticMarkup(<AuditScreen state={state} />).replaceAll('<!-- -->', '')

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(node)) return []
  const renderNode = node.type as ((props: Record<string, unknown>) => ReactNode) & { readonly name?: string }
  const children = typeof renderNode === 'function' && renderNode.name !== 'FocusOnOpen' ? renderNode(node.props) : node.props.children as ReactNode
  return [node, ...elements(children)]
}
function click(state: State, anchor: string): Action[] {
  const actions: Action[] = []
  const element = elements(<AuditScreen state={state} dispatch={(action) => actions.push(action)} />).find((item) => item.props['data-film-anchor'] === anchor)
  if (typeof element?.props.onClick !== 'function') throw new Error(`No click handler for ${anchor}`)
  ;(element.props.onClick as () => void)()
  return actions
}
describe('audit history', () => {
  test('keeps five fields and omits future records', () => {
    const early = render(reconstruct('ST11'))
    for (const label of ['Actor', 'Event', 'Object', 'Scope', 'Outcome']) expect(early).toContain(label)
    expect(early).not.toContain('SIM-AP-RECON-34')
    expect(early).not.toContain('Export audit pack</td>')
  })
  test('shows the completed regression, separate release and closure, without invented timestamps', () => {
    const markup = render(reconstruct('ST23'))
    for (const label of ['Regression evaluation', 'SIM-AP-RECON-34', '28 Passed', '6 Passed — Expected Safe Escalation', '0 Failed', 'Limited release', 'Expand and close', 'Not specified']) expect(markup).toContain(label)
    expect(markup).not.toMatch(/\b\d{1,2}:\d{2}\b/)
  })
  test('previews authorized scope and requires confirmation; approver cannot export', () => {
    const state = reconstruct('ST23')
    const drawer = act(state, { type: 'SET_AUDIT_EXPORT', step: 'drawer' })
    const confirm = act(drawer, { type: 'SET_AUDIT_EXPORT', step: 'confirm' })
    expect(render(drawer)).toContain('Authorized scope')
    expect(render(drawer)).toContain('Raw private media is not included.')
    expect(render(confirm)).toContain('Export authorized records only?')
    expect(render(act(state, { type: 'SELECT_ACTOR', personId: 'daniel' }))).toContain('aria-disabled="true"')
  })
  test('export controls dispatch the preview, confirmation and cancellation actions', () => {
    const state = reconstruct('ST23')
    expect(click(state, 'audit-export')).toEqual([{ type: 'SET_AUDIT_EXPORT', step: 'drawer' }])
    const confirm = act(state, { type: 'SET_AUDIT_EXPORT', step: 'drawer' }, { type: 'SET_AUDIT_EXPORT', step: 'confirm' })
    expect(click(confirm, 'audit-confirm-export')).toEqual([{ type: 'EXPORT_AUDIT_PACK' }])
    expect(click(confirm, 'audit-confirm-cancel')).toEqual([{ type: 'SET_AUDIT_EXPORT', step: 'closed' }])
    const done = act(confirm, { type: 'EXPORT_AUDIT_PACK' })
    expect(render(done)).toContain('Audit pack generated')
    expect(render(done)).toContain('Authorized user')
  })
})
