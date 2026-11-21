/** DAT-07: source-backed incident and repair facts, separate from job and watch cases. */
export const INCIDENT = {
  id: 'INC-0042',
  agentVersionId: 'agent-v1.0',
  summary: 'Required amount could not be verified on 3 Kestrel invoices',
  status: 'Contained',
  affectedCases: [
    { id: 'INV-48231', initialState: 'held', invoiceAmountCents: 421350 },
    { id: 'INV-48233', initialState: 'held', invoiceAmountCents: null },
    { id: 'INV-48236', initialState: 'held', invoiceAmountCents: null },
  ],
  hypothesis: { description: 'supplier document format change', status: 'unconfirmed' },
  evidence: [
    { id: 'E-0042-01', sourceId: 'INV-48231', description: 'Invoice $4,213.50' },
    { id: 'E-0042-02', sourceId: 'PO-1051', description: 'PO $4,175.00' },
    { id: 'E-0042-03', sourceId: 'INV-48231', description: '$38.50 handling line after subtotal' },
    { id: 'E-0042-04', sourceId: 'AP-RULE-017', description: 'Approved terms cover handling fee' },
  ],
  correction: {
    caseId: 'INV-48231',
    actorId: 'elena',
    action: 'manually completed',
    question: 'Is the $38.50 handling fee part of the invoice total, and is it covered by the PO terms?',
    answer: 'Yes; billed on top of subtotal and within approved terms',
    evidenceIds: ['E-0042-01', 'E-0042-02', 'E-0042-03', 'E-0042-04'],
  },
} as const

export const REPAIR = {
  id: 'REP-0042-1',
  incidentId: INCIDENT.id,
  fromVersionId: 'agent-v1.0',
  toVersionId: 'agent-v1.1',
  scope: 'Kestrel Components layout v2 only',
  stepId: 'AP-STEP-03',
  step: 'Interpret invoice totals',
  before: 'Do not include a separately positioned handling line without verified terms',
  after: 'Include the handling line when approved Kestrel terms cover it',
  permissionsChanged: false,
  policyChanged: false,
  scenariosAdded: 6,
  regressionSuiteId: 'SIM-AP-RECON-34',
  release: {
    supplier: 'Kestrel Components',
    team: 'AP East',
    ownerId: 'marcus',
    requiredPassingOutcomes: 34,
    requiredIndependentReadbacks: 3,
    stopOn: ['regression', 'unknown'],
    disposition: 'Repaired - Validated',
  },
  gates: {
    limitedRelease: {
      requires: ['scope validated', '34 passing intended outcomes', 'owner authorization'],
    },
    expansion: {
      requires: ['limited release', '3 independent verified readbacks', 'owner authorization', 'no regression or unknown outcome'],
    },
    closure: {
      requires: ['authorized expansion', 'owner authorization', 'no regression or unknown outcome'],
    },
  },
  lifecycle: [
    'contained', 'manual-correction', 'scope-validated', 'regression-pending',
    'regression-running', 'regression-passed', 'limited-release', 'expanded', 'closed',
  ],
} as const
