import { describe, expect, test } from 'bun:test'
import { AUDIT_EVENTS, AUDIT_EXPORT_SCOPE } from '@/data/audit'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { GATE, GATE_PROVENANCE, GATE_SUMMARY } from '@/data/gate'
import { INCIDENT, REPAIR } from '@/data/incident'
import { auditSlice, gateChecks, reconstruct, visibleNotifications } from '@/state'
import { REGRESSION_PASS_RESULTS } from '@/data/regression'
import { act, expectRejected } from '@/state/test-helpers'

describe('gate, incident and release audit', () => {
  test('gate provenance identifies only the three observed cases', () => {
    expect(GATE).toEqual({ observed: 3, archivedSmeVerified: 2, required: 5 })
    expect(GATE_PROVENANCE).toBe('3 observed this week + 2 SME-verified archived cases')
    expect(GATE_SUMMARY).toBe('5/5 verified human examples')
    expect(DEMONSTRATIONS.map(({ id, contributorId, time, invoice, supplierId }) => [id, contributorId, time, invoice, supplierId])).toEqual([
      ['D1', 'priya', 'Mon 09:14', 'INV-48203', 'brightwater'],
      ['D2', 'priya', 'Mon 10:02', 'INV-48204', 'copperline'],
      ['D3', 'jamal', 'Tue 13:40', 'INV-48207', 'harlow'],
    ])
  })

  test('scenario and edge rows stay pending on v0.1 evidence and are met only by the passed v0.2 evaluation', () => {
    const rows = (id: 'ST08' | 'ST09') => gateChecks(reconstruct(id)).filter((check) => check.id === 'scenarios' || check.id === 'edgeCases').map((check) => check.met)
    expect(rows('ST08')).toEqual([false, false])
    expect(rows('ST09')).toEqual([true, true])
  })

  test('incident evidence and repair retain exact scope and unknown amounts', () => {
    expect(INCIDENT.affectedCases.map((item) => [item.id, item.initialState, item.invoiceAmountCents])).toEqual([
      ['INV-48231', 'held', 421350], ['INV-48233', 'held', null], ['INV-48236', 'held', null],
    ])
    expect(421350 - 417500).toBe(3850)
    expect(INCIDENT.evidence.map((item) => item.id)).toEqual(['E-0042-01', 'E-0042-02', 'E-0042-03', 'E-0042-04'])
    expect(INCIDENT.hypothesis.status).toBe('unconfirmed')
    expect(INCIDENT.correction.actorId).toBe('elena')
    expect(REPAIR).toMatchObject({ fromVersionId: 'agent-v1.0', toVersionId: 'agent-v1.1', scope: 'Kestrel Components layout v2 only', step: 'Interpret invoice totals', permissionsChanged: false, policyChanged: false })
  })


  test('release and notifications wait for regression, authorization and three readbacks', () => {
    const before = reconstruct('ST14')
    const passed = act(before, { type: 'RUN_REGRESSION' }, { type: 'COMPLETE_REGRESSION', results: REGRESSION_PASS_RESULTS })
    expect(visibleNotifications(passed, 'marcus')).toContain('N-04')
    expect(visibleNotifications(passed, 'marcus')).not.toContain('N-05')
    const released = act(passed, { type: 'LIMITED_RELEASE' })
    expect(released.release.cohort).toEqual(['pending', 'pending', 'pending'])
    expect(visibleNotifications(released, 'marcus')).toContain('N-05')
    const first = act(released, { type: 'VERIFY_COHORT_OUTCOME', index: 0, result: 'verified' })
    expect(first.release.cohort).toEqual(['verified', 'pending', 'pending'])
    expect(auditSlice(first).some((event) => event.id === 'A13')).toBe(false)
    const all = act(first, { type: 'VERIFY_COHORT_OUTCOME', index: 1, result: 'verified' }, { type: 'VERIFY_COHORT_OUTCOME', index: 2, result: 'verified' })
    expect(all.release.cohort).toEqual(['verified', 'verified', 'verified'])
    expect(auditSlice(all).some((event) => event.id === 'A13')).toBe(true)
  })

  test('a completed failed regression is audited but cannot release', () => {
    const before = reconstruct('ST14')
    const failedResults = REGRESSION_PASS_RESULTS.map((result, index) => index === 0 ? { ...result, verdict: 'failed' as const } : result)
    const failed = act(before, { type: 'RUN_REGRESSION' }, { type: 'COMPLETE_REGRESSION', results: failedResults })
    expect(auditSlice(failed).map((event) => event.id)).toContain('A11')
    expectRejected(failed, { type: 'LIMITED_RELEASE' }, 'regression')
    expect(visibleNotifications(failed, 'marcus')).not.toContain('N-04')
  })
  test('audit and repair notices follow actual lifecycle events', () => {
    expect(AUDIT_EVENTS.map((event) => event.order)).toEqual(Array.from({ length: 15 }, (_, index) => index + 1))
    expect(AUDIT_EXPORT_SCOPE.excludes).toContain('Raw media')
    expect(auditSlice(reconstruct('ST06')).some((event) => event.order > 3)).toBe(false)
    expect(visibleNotifications(reconstruct('ST14'), 'marcus')).not.toContain('N-04')
    expect(visibleNotifications(reconstruct('ST14'), 'marcus')).not.toContain('N-05')
    expect(visibleNotifications(reconstruct('ST15'), 'marcus')).toContain('N-05')
  })
})
