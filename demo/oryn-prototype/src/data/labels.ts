/** Exact labels from the inventory (CMP-05, CMP-08). */

export const ROLES = ['Employee', 'Workflow Owner', 'Approver', 'Admin'] as const
export type Role = (typeof ROLES)[number]

export const CAPABILITIES = ['Observe', 'Guide', 'Assist', 'Run Supervised', 'Run Autonomously'] as const
export type Capability = (typeof CAPABILITIES)[number]

export const LIFECYCLE_STEPS = [
  'Observe',
  'Understand',
  'Review',
  'Publish',
  'Compile',
  'Simulate',
  'Authorize',
  'Execute',
  'Verify',
  'Diagnose',
  'Correct',
  'Repair',
  'Re-evaluate',
  'Release',
] as const
export type LifecycleStep = (typeof LIFECYCLE_STEPS)[number]

export const BUTTON_LABELS = [
  'Accept and continue',
  'Pause',
  'Confirm',
  'Publish',
  'Run scenarios',
  'Approve',
  'Reject',
  'Request Changes',
  'Guide Me',
  'Request approval',
  'Export audit pack',
] as const
export type ButtonLabel = (typeof BUTTON_LABELS)[number]

export const INTENT = 'Reconcile supplier invoices against purchase orders and stage the result in the ERP.'
export const DEADLINE_DRAFT = 'Fri 17:00'
export const DEADLINE_CONFIRMED = 'Fri 12:00'
export const COMMAND_PLACEHOLDER = 'Type a command\u2026'

export const APPROVAL_REQUIRED_LABEL = 'Requires Tier 3 approval - Daniel Okafor'
export const REQUEST_APPROVAL_LABEL = 'Request approval'
