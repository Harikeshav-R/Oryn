import { describe, expect, test } from 'bun:test'
import { APPROVAL_INVOICE, APPROVAL_PO_CENTS } from '@/data/approval'
import { POLICY_IMPACT } from '@/data/policy-impact'
import { REGRESSION_CASES, REGRESSION_PASS_RESULTS } from '@/data/regression'
import { BOUNDARY_REPLAY, SCENARIOS, sampleRun, suiteTotals } from '@/data/simulation'
import { VERSION_HISTORY } from '@/data/versions'
import { exceedsThreshold, thresholdHundredths } from '@/state/permissions'
import { regressionPasses, runSummary, suiteVerdicts } from '@/state/selectors'
import { createInitialState } from '@/state/initial'
import type { EvaluationRun } from '@/state/types'

describe('simulator audit', () => {
  test('sealed base and regression suites preserve distinct version verdicts', () => {
    const ids = [...SCENARIOS.map(({ id }) => id), ...REGRESSION_CASES.map(({ id }) => id)]
    expect(ids).toEqual(Array.from({ length: 34 }, (_, index) => `SCN-${String(index + 1).padStart(3, '0')}`))
    expect(new Set(ids).size).toBe(34)
    expect(suiteTotals('v0.1')).toEqual({ passed: 21, safeEscalation: 6, failed: 1 })
    expect(suiteTotals('v0.2')).toEqual({ passed: 22, safeEscalation: 6, failed: 0 })
    expect(SCENARIOS[21]).toMatchObject({ id: 'SCN-022', v01: 'failed', v02: 'passed' })
    expect(BOUNDARY_REPLAY).toMatchObject({ key: 'variance_exactly_2.00pct', expected: 'accept', actualV01: 'escalate' })
    const run: EvaluationRun = { id: 'audit', versionId: 'agent-v1.1', suiteId: 'SIM-AP-RECON-34', status: 'complete', results: REGRESSION_PASS_RESULTS }
    expect(runSummary(run)).toEqual({ complete: true, passed: 28, safeEscalation: 6, failed: 0, notRun: 0 })
    expect(regressionPasses(run)).toBe(true)
    expect(VERSION_HISTORY.filter((row) => row.totals).map((row) => row.totals)).toEqual([
      { passed: 21, safeEscalation: 6, failed: 1 },
      { passed: 22, safeEscalation: 6, failed: 0 },
      { passed: 28, safeEscalation: 6, failed: 0 },
    ])
  })

  test('unfinished runs never expose recorded verdicts as passes', () => {
    const run: EvaluationRun = { id: 'audit', versionId: 'agent-v0.1', suiteId: 'SIM-AP-RECON', status: 'cancelled', results: [] }
    expect(suiteVerdicts({ ...createInitialState(), evaluations: [run] }, 'agent-v0.1').every(({ verdict }) => verdict === 'notRun')).toBe(true)
    expect(runSummary(run)).toMatchObject({ passed: 0, safeEscalation: 0, failed: 0, notRun: 28 })
    expect(sampleRun([{ frame: 0, type: 'start' }, { frame: 10, type: 'cancel' }], 100).phase).toBe('cancelled')
  })

  test('integer comparator accepts equality and rejects the next cent for both policies', () => {
    for (const [threshold, amount] of [['2.00%', 2000], ['1.50%', 1500]] as const) {
      const parsed = thresholdHundredths(threshold)
      expect(exceedsThreshold(100000 + amount - 1, 100000, parsed)).toBe(false)
      expect(exceedsThreshold(100000 + amount, 100000, parsed)).toBe(false)
      expect(exceedsThreshold(100000 + amount + 1, 100000, parsed)).toBe(true)
    }
    expect(exceedsThreshold(APPROVAL_INVOICE.amountCents, APPROVAL_PO_CENTS, 200)).toBe(true)
    expect(POLICY_IMPACT).toMatchObject({ previousThreshold: '2.00%', newThreshold: '1.50%', effective: 'Dec 1', status: 'Needs Revalidation' })
    expect(POLICY_IMPACT.dependencies.map(({ count }) => count)).toEqual([1, 1, 34])
  })
})
