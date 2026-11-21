import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import { act } from '@/state/test-helpers'
import { VersionsScreen } from './VersionsScreen'
import { FocusOnOpen } from './focus-on-open'

const state = act(reconstruct('ST21'), { type: 'OPEN_SCREEN', screen: 'SC30' })
const html = (s: typeof state) => renderToStaticMarkup(<VersionsScreen state={s} />).replaceAll('<!-- -->', '')

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(node)) return []
  if (node.type === FocusOnOpen) return []
  if (typeof node.type === 'function') return elements(Reflect.apply(node.type, undefined, [node.props]))
  return [node, ...elements(node.props.children as ReactNode)]
}
function click(s: typeof state, name: string): typeof state {
  let next = s
  const node = elements(<VersionsScreen state={s} dispatch={(action) => { next = act(next, action) }} />).find((item) => item.props['data-film-anchor'] === name)
  if (!node || typeof node.props.onClick !== 'function') throw new Error(`Missing ${name}`)
  node.props.onClick()
  return next
}
describe('version history', () => {
  test('retains all version evidence including the failure', () => {
    const output = html(state)
    for (const text of ['Playbook v1.0 · Approved for Guidance', 'Agent v0.1 · Candidate', 'Agent v0.2 · Candidate', 'Agent v1.0 · Released · Stage 3', 'Agent v1.1 · Repair', '21 Passed', '1 Failed', '28 Passed', 'SIM-AP-RECON-34']) expect(output).toContain(text)
  })
  test('shows evaluation and repair comparisons', () => {
    expect(html(act(state, { type: 'SET_VERSION_VIEW', compare: 'evaluation' }))).toContain('SCN-022')
    expect(html(act(state, { type: 'SET_VERSION_VIEW', compare: 'repair' }))).toContain('Permissions and policy unchanged')
  })
  test('cancel preserves release and restore is future only', () => {
    const open = act(state, { type: 'SET_VERSION_VIEW', restore: 'confirm' })
    expect(html(open)).toContain('Prior business effects will not be undone.')
    const cancelled = act(open, { type: 'SET_VERSION_VIEW', restore: 'closed' })
    expect(cancelled.restoredVersion).toBe(state.restoredVersion)
    expect(html(act(state, { type: 'SET_VERSION_VIEW', hint: true }))).toContain('Restore affects future eligible work, not prior business effects')
  })
  test('controls dispatch comparison, cancellation and authorized future restore', () => {
    const compare = click(state, 'version-compare-evaluation')
    expect(compare.ui.breadth.versions.compare).toBe('evaluation')
    const open = click(compare, 'restore-previous')
    expect(click(open, 'version-restore-cancel').restoredVersion).toBeNull()
    const restored = click(open, 'version-restore-confirm')
    expect(restored.restoredVersion).toBe('agent-v1.0')
    expect(restored.job).toEqual(state.job)
    expect(restored.incident).toEqual(state.incident)
  })
  test('refuses a viewpoint without a restore grant and hides history from employees', () => {
    const approver = act(state, { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'SET_VERSION_VIEW', restore: 'confirm' })
    expect(html(approver)).toContain('aria-disabled="true"')
    expect(html(act(state, { type: 'SELECT_ACTOR', personId: 'priya' }))).toContain('Not available:')
  })
})
