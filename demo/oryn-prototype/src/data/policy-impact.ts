/** DAT-09: a policy change and its impact, separate from the Kestrel fee correction. */
export const POLICY_IMPACT = {
  ruleId: 'AP-RULE-009',
  title: 'Invoice approval threshold',
  previousThreshold: '2.00%',
  newThreshold: '1.50%',
  effective: 'Dec 1',
  status: 'Needs Revalidation',
  dependencies: [
    { kind: 'playbook', id: 'PB-AP-RECON', count: 1 },
    { kind: 'agent', id: 'Supplier Invoice Reconciler', count: 1 },
    { kind: 'tests', id: 'SIM-AP-RECON-34', count: 34 },
  ],
  boundaryTests: [
    { position: 'below', threshold: '1.50%', status: 'Proposed' },
    { position: 'at', threshold: '1.50%', status: 'Proposed' },
    { position: 'above', threshold: '1.50%', status: 'Proposed' },
  ],
  releaseRequires: ['Evaluation', 'Required approvals'],
  priorPolicyContinuation: 'Only with an explicit bounded grant',
} as const

/** Separate populations: the incident is not an outcome of JOB-0117. */
export const ANALYTICS_SCOPES = {
  job: { id: 'JOB-0117', population: 'AP East invoice job' },
  incident: { id: 'INC-0042', population: 'Kestrel incident', label: '1 contained incident' },
  release: { limited: 'v1.1 limited cohort', expanded: 'Repaired - Validated' },
  xray: { pilotMinimumEnrolled: 5, eligibility: 'Not established' },
} as const
