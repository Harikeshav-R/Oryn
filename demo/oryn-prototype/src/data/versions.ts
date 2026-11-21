import { REGRESSION_PASS_RESULTS } from './regression'
import { suiteTotals } from './simulation'

export type VersionId = 'playbook-v1.0' | 'agent-v0.1' | 'agent-v0.2' | 'agent-v1.0' | 'agent-v1.1'
export interface VersionRecord {
  readonly id: VersionId
  readonly kind: 'Playbook' | 'Agent'
  readonly version: string
  readonly status: string
  readonly detail: string
  readonly suiteId?: 'SIM-AP-RECON' | 'SIM-AP-RECON-34'
  readonly totals?: Readonly<{ passed: number; safeEscalation: number; failed: number }>
}
export const AGENT_DEFINITION = Object.freeze({
  name: 'Supplier Invoice Reconciler',
  intent: 'Reconcile supplier invoices against purchase orders and stage the result in the ERP.',
  jobStartingVersionId: 'agent-v1.0',
} as const)

const v01Totals = Object.freeze(suiteTotals('v0.1'))
const v02Totals = Object.freeze(suiteTotals('v0.2'))
const v11Totals = Object.freeze(REGRESSION_PASS_RESULTS.reduce(
  (totals, result) => ({ ...totals, [result.verdict]: totals[result.verdict] + 1 }),
  { passed: 0, safeEscalation: 0, failed: 0 },
))
const evaluationDetail = (suiteId: string, totals: NonNullable<VersionRecord['totals']>): string =>
  `${suiteId} · ${totals.passed} Passed · ${totals.safeEscalation} Passed — Expected Safe Escalation · ${totals.failed} Failed`

export const VERSION_HISTORY: readonly VersionRecord[] = Object.freeze([
  Object.freeze({ id: 'playbook-v1.0', kind: 'Playbook', version: 'v1.0', status: 'Approved for Guidance', detail: 'Published playbook guidance' } as const),
  Object.freeze({ id: 'agent-v0.1', kind: 'Agent', version: 'v0.1', status: 'Candidate · Failed evaluation', detail: evaluationDetail('SIM-AP-RECON', v01Totals), suiteId: 'SIM-AP-RECON', totals: v01Totals } as const),
  Object.freeze({ id: 'agent-v0.2', kind: 'Agent', version: 'v0.2', status: 'Candidate · Passed evaluation', detail: evaluationDetail('SIM-AP-RECON', v02Totals), suiteId: 'SIM-AP-RECON', totals: v02Totals } as const),
  Object.freeze({ id: 'agent-v1.0', kind: 'Agent', version: 'v1.0', status: 'Released · Stage 3', detail: 'Stage 3 Supervised Assist · AP East' } as const),
  Object.freeze({ id: 'agent-v1.1', kind: 'Agent', version: 'v1.1', status: 'Repair candidate', detail: evaluationDetail('SIM-AP-RECON-34', v11Totals), suiteId: 'SIM-AP-RECON-34', totals: v11Totals } as const),
])
export type VersionComparison = 'evaluation' | 'repair'
