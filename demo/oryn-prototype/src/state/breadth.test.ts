import { describe, expect, test } from 'bun:test'
import { createInitialState, reconstruct, type Action, type StateId } from './index'
import { act, expectRejected, withGrant } from './test-helpers'

describe('breadth reducer', () => {
  test('initial defaults carry no restored version or open breadth surface', () => {
    const state = createInitialState()
    expect(state.restoredVersion).toBeNull()
    expect(state.ui.breadth).toEqual({ map: { view: 'graph', selected: null }, versions: { compare: null, restore: 'closed', hint: false }, policy: { tests: false }, command: { tab: 'command', snapshot: 'current', detail: null }, audit: { step: 'closed' }, notifications: { filter: 'all', open: null, read: [], toast: null }, capability: { view: 'matrix', selected: null }, timeout: { dismissed: false } })
  })
  test('presentation actions retain distinct choices and reject unknown targets', () => {
    const state = act(reconstruct('ST24'), { type: 'SET_MAP_VIEW', view: 'table' }, { type: 'SELECT_MAP_NODE', node: 'agent' }, { type: 'SET_VERSION_VIEW', compare: 'repair', hint: true }, { type: 'SET_POLICY_VIEW', tests: true }, { type: 'SET_COMMAND_VIEW', tab: 'xray', snapshot: 'before', detail: 'incident' }, { type: 'SET_CAPABILITY_VIEW', view: 'tiles' }, { type: 'DISMISS_TIMEOUT_BANNER' })
    expect(state.ui.breadth.map).toEqual({ view: 'table', selected: 'agent' })
    expect(state.ui.breadth.versions.compare).toBe('repair')
    expect(state.ui.breadth.policy.tests).toBe(true)
    expect(state.ui.breadth.command).toEqual({ tab: 'xray', snapshot: 'before', detail: 'incident' })
    expect(state.ui.breadth.capability.view).toBe('tiles')
    expect(state.ui.breadth.timeout.dismissed).toBe(true)
    const invalid: Action[] = [
      { type: 'SELECT_MAP_NODE', node: 'missing' } as unknown as Action,
      { type: 'SET_MAP_VIEW', view: 'missing' } as unknown as Action,
      { type: 'SET_VERSION_VIEW', compare: 'missing' } as unknown as Action,
      { type: 'SET_POLICY_VIEW', tests: 'missing' } as unknown as Action,
      { type: 'SET_COMMAND_VIEW', detail: 'missing' } as unknown as Action,
      { type: 'SET_NOTIFICATION_VIEW', open: 'N-99' } as unknown as Action,
      { type: 'SURFACE_TOAST', id: 'N-99' } as unknown as Action,
      { type: 'SET_CAPABILITY_VIEW', selected: { application: 'missing', capability: 'missing' } } as unknown as Action,
    ]
    for (const action of invalid) expectRejected(state, action, 'target')
  })
  test('notice events gate opening and surfacing; toast dismissal changes no business state', () => {
    for (const phase of ['ST11', 'ST12'] as const) for (const id of ['N-04', 'N-05'] as const) {
      expectRejected(reconstruct(phase), { type: 'SET_NOTIFICATION_VIEW', open: id }, 'target')
      expectRejected(reconstruct(phase), { type: 'SURFACE_TOAST', id }, 'target')
    }
    const base = act(reconstruct('ST24'), { type: 'SELECT_ACTOR', personId: 'marcus' })
    const open = act(base, { type: 'SET_NOTIFICATION_VIEW', open: 'N-04' }, { type: 'SURFACE_TOAST', id: 'N-04' })
    expect(open.ui.breadth.notifications.read).toContain('N-04')
    expectRejected(open, { type: 'SURFACE_TOAST', id: 'N-05' }, 'target')
    const closed = act(open, { type: 'DISMISS_TOAST' })
    expect(closed.notificationsDismissed).toEqual(open.notificationsDismissed)
    expect(closed.approval).toEqual(open.approval)
    expect(closed.incident).toEqual(open.incident)
    expect(closed.audit).toEqual(open.audit)
    const next = act(closed, { type: 'SURFACE_TOAST', id: 'N-05' })
    expect(next.ui.breadth.notifications.toast).toBe('N-05')
    const dismissed = act(next, { type: 'DISMISS_NOTIFICATION', id: 'N-04' })
    expect(dismissed.ui.breadth.notifications.open).toBeNull()
    expect(dismissed.notificationsDismissed).toContain('N-04')
    expect(act(dismissed, { type: 'DISMISS_NOTIFICATION', id: 'N-05' }).ui.breadth.notifications.toast).toBeNull()
  })
  test('restore requires confirmation, authority and a late phase, and affects future jobs only', () => {
    for (const phase of ['ST20'] as const) expectRejected(reconstruct(phase), { type: 'RESTORE_VERSION' }, 'phase')
    for (const phase of ['ST21', 'ST22', 'ST23', 'ST24'] as const satisfies readonly StateId[]) {
      const base = act(reconstruct(phase), { type: 'SELECT_ACTOR', personId: 'marcus' })
      expectRejected(base, { type: 'RESTORE_VERSION' }, 'version')
      const confirm = act(base, { type: 'SET_VERSION_VIEW', restore: 'confirm' })
      const revoked = { ...confirm, authority: { grants: withGrant('grant-marcus-restore-version', { status: 'revoked' }) } }
      expectRejected(revoked, { type: 'RESTORE_VERSION' }, 'authority')
      expectRejected(act(confirm, { type: 'SELECT_ACTOR', personId: 'daniel' }), { type: 'RESTORE_VERSION' }, 'authority')
      const restored = act(confirm, { type: 'RESTORE_VERSION' })
      expect(restored.restoredVersion).toBe('agent-v1.0')
      expect({ ...restored, restoredVersion: confirm.restoredVersion, step: confirm.step, ui: confirm.ui }).toEqual(confirm)
    }
  })
  test('changing route closes breadth overlays without clearing read notices', () => {
    const base = act(reconstruct('ST24'), { type: 'OPEN_SCREEN', screen: 'SC30' }, { type: 'SET_VERSION_VIEW', restore: 'confirm' }, { type: 'SET_AUDIT_EXPORT', step: 'drawer' }, { type: 'SET_CAPABILITY_VIEW', selected: { application: 'HubSpot', capability: 'Observe' } }, { type: 'SET_NOTIFICATION_VIEW', open: 'N-04' })
    const next = act(base, { type: 'OPEN_SCREEN', screen: 'SC31' })
    expect(next.ui.breadth.versions.restore).toBe('closed')
    expect(next.ui.breadth.audit.step).toBe('closed')
    expect(next.ui.breadth.capability.selected).toBeNull()
    expect(next.ui.breadth.notifications.open).toBeNull()
    expect(next.ui.breadth.notifications.read).toContain('N-04')
  })
  test('export confirmation follows drawer, appends A15 once and closes it', () => {
    const base = act(reconstruct('ST23'), { type: 'SELECT_ACTOR', personId: 'marcus' })
    expectRejected(base, { type: 'SET_AUDIT_EXPORT', step: 'confirm' }, 'target')
    const ready = act(base, { type: 'SET_AUDIT_EXPORT', step: 'drawer' }, { type: 'SET_AUDIT_EXPORT', step: 'confirm' })
    const exported = act(ready, { type: 'EXPORT_AUDIT_PACK' })
    expect(exported.audit.filter((id) => id === 'A15')).toHaveLength(1)
    expect(exported.ui.breadth.audit.step).toBe('closed')
    expectRejected(exported, { type: 'EXPORT_AUDIT_PACK' }, 'target')
  })
  test('request and denial never change approval or submit an action', () => {
    const base = reconstruct('ST20')
    expectRejected(act(base, { type: 'SELECT_ACTOR', personId: 'daniel' }), { type: 'DENY_UNSAFE_REQUEST' }, 'decision')
    const requested = act(base, { type: 'REQUEST_APPROVAL' })
    expect({ ...requested, unsafeRequest: base.unsafeRequest, step: base.step }).toEqual(base)
    expectRejected(requested, { type: 'REQUEST_APPROVAL' }, 'decision')
    expectRejected(requested, { type: 'DENY_UNSAFE_REQUEST' }, 'actor')
    const daniel = act(requested, { type: 'SELECT_ACTOR', personId: 'daniel' })
    const denied = act(daniel, { type: 'DENY_UNSAFE_REQUEST' })
    expect(denied.unsafeRequest).toBe('denied')
    expect(denied.approval).toEqual(base.approval)
    expect(denied.job).toEqual(base.job)
  })
})
