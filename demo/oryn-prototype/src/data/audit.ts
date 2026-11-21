/**
 * DAT-11: immutable audit history A01-A15 in logical order. There are no timestamps:
 * the source defines none, so none are shown. A field the source does not state is
 * `null` and renders as an em dash with an accessible "Not specified".
 */
export interface AuditEvent {
  id: string
  order: number
  actor: string | null
  action: string
  object: string | null
  scope: string | null
  outcome: string | null
}

export const AUDIT_EVENTS: readonly AuditEvent[] = [
  { id: 'A01', order: 1, actor: 'Priya Nair', action: 'Consent', object: null, scope: null, outcome: null },
  {
    id: 'A02',
    order: 2,
    actor: 'Priya Nair, Jamal Carter',
    action: 'Approve Demonstration',
    object: 'Their respective sanitized Demonstrations',
    scope: null,
    outcome: null,
  },
  {
    id: 'A03',
    order: 3,
    actor: 'Marcus Webb',
    action: 'Publish',
    object: 'PB-AP-RECON v1.0',
    scope: 'AP East',
    outcome: 'Approved for Guidance',
  },
  {
    id: 'A04',
    order: 4,
    actor: 'Marcus Webb',
    action: 'Approve release',
    object: 'Supplier Invoice Reconciler v1.0',
    scope: 'AP East',
    outcome: null,
  },
  {
    id: 'A05',
    order: 5,
    actor: 'Authorized operator',
    action: 'Start job',
    object: 'JOB-0117',
    scope: 'AP East',
    outcome: null,
  },
  { id: 'A06', order: 6, actor: 'Daniel Okafor', action: 'Approval', object: 'INV-48219', scope: 'Tier 3', outcome: 'Approved' },
  {
    id: 'A07',
    order: 7,
    actor: null,
    action: 'Independent readback',
    object: 'INV-48219',
    scope: null,
    outcome: 'Verified Complete',
  },
  { id: 'A08', order: 8, actor: 'Marcus Webb', action: 'Contain', object: 'INC-0042', scope: null, outcome: 'Contained' },
  {
    id: 'A09',
    order: 9,
    actor: 'Elena Ruiz',
    action: 'Record correction',
    object: 'INV-48231',
    scope: null,
    outcome: null,
  },
  {
    id: 'A10',
    order: 10,
    actor: 'Marcus Webb',
    action: 'Validate scope',
    object: 'REP-0042-1',
    scope: 'Kestrel Components layout v2 only',
    outcome: null,
  },
  {
    id: 'A11',
    order: 11,
    actor: null,
    action: 'Regression evaluation',
    object: 'SIM-AP-RECON-34',
    scope: null,
    outcome: 'Completed',
  },
  {
    id: 'A12',
    order: 12,
    actor: 'Marcus Webb',
    action: 'Limited release',
    object: 'Supplier Invoice Reconciler v1.1',
    scope: 'Kestrel Components \u00b7 AP East',
    outcome: 'Released',
  },
  {
    id: 'A13',
    order: 13,
    actor: null,
    action: 'Cohort verification',
    object: 'Three cohort outcomes',
    scope: 'Kestrel Components \u00b7 AP East',
    outcome: 'Verified Complete',
  },
  {
    id: 'A14',
    order: 14,
    actor: 'Marcus Webb',
    action: 'Expand and close',
    object: 'INC-0042',
    scope: 'AP East',
    outcome: 'Repaired - Validated',
  },
  {
    id: 'A15',
    order: 15,
    actor: 'Authorized user',
    action: 'Export audit pack',
    object: null,
    scope: null,
    outcome: null,
  },
]

/** Only completed events belong in a snapshot; no future rows are inferred. */
export function auditEventsThrough(order: number): readonly AuditEvent[] {
  return AUDIT_EVENTS.filter((event) => event.order <= order)
}

/** Audit exports contain event records, not private recordings or raw media. */
export const AUDIT_EXPORT_SCOPE = {
  includes: 'Authorized audit event records',
  excludes: 'Raw media and private recordings',
} as const
