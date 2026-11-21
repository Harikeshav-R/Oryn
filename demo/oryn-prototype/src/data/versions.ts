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

export const VERSION_HISTORY: readonly VersionRecord[] = Object.freeze([
  Object.freeze({ id: 'playbook-v1.0', kind: 'Playbook', version: 'v1.0', status: 'Approved for Guidance', detail: 'Published playbook guidance' } as const),
  Object.freeze({ id: 'agent-v0.1', kind: 'Agent', version: 'v0.1', status: 'Candidate · Failed evaluation', detail: 'SIM-AP-RECON · 21 Passed · 6 Passed — Expected Safe Escalation · 1 Failed', suiteId: 'SIM-AP-RECON', totals: Object.freeze({ passed: 21, safeEscalation: 6, failed: 1 }) } as const),
  Object.freeze({ id: 'agent-v0.2', kind: 'Agent', version: 'v0.2', status: 'Candidate · Passed evaluation', detail: 'SIM-AP-RECON · 22 Passed · 6 Passed — Expected Safe Escalation · 0 Failed', suiteId: 'SIM-AP-RECON', totals: Object.freeze({ passed: 22, safeEscalation: 6, failed: 0 }) } as const),
  Object.freeze({ id: 'agent-v1.0', kind: 'Agent', version: 'v1.0', status: 'Released · Stage 3', detail: 'Stage 3 Supervised Assist · AP East' } as const),
  Object.freeze({ id: 'agent-v1.1', kind: 'Agent', version: 'v1.1', status: 'Repair candidate', detail: 'SIM-AP-RECON-34 · 28 Passed · 6 Passed — Expected Safe Escalation · 0 Failed', suiteId: 'SIM-AP-RECON-34', totals: Object.freeze({ passed: 28, safeEscalation: 6, failed: 0 }) } as const),
])
export type VersionComparison = 'evaluation' | 'repair'
