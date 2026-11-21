/**
 * CMP-06 status vocabulary (design spec section 3.4, inventory decisions 6, 9, 11).
 * Text is always the exact label; the glyph is a second, distinct channel.
 * Hue lives on the glyph only. Label text is always foreground.
 */
export const STATUS_IDS = [
  'approved',
  'verified',
  'unknown',
  'passed',
  'safeEscalation',
  'failed',
  'revalidation',
  'contained',
  'approval',
  'escalated',
  'held',
  'running',
] as const
export type StatusId = (typeof STATUS_IDS)[number]

export type GlyphTone = 'neutral' | 'success' | 'warning' | 'danger' | 'arc'

export const STATUS_META: Record<StatusId, { label: string; tone: GlyphTone; meaning: string }> = {
  approved: { label: 'Approved for Guidance', tone: 'neutral', meaning: 'Approved human guidance, not execution authority' },
  verified: { label: 'Verified Complete', tone: 'success', meaning: 'Independent postcondition evidence exists' },
  unknown: { label: 'Outcome Unknown', tone: 'neutral', meaning: 'Stop and reconcile; no blind resubmission' },
  passed: { label: 'Passed', tone: 'success', meaning: 'Expected result and invariants verified' },
  safeEscalation: {
    label: 'Passed \u2014 Expected Safe Escalation',
    tone: 'success',
    meaning: 'Correct safe stop; not a failure',
  },
  failed: { label: 'Failed', tone: 'danger', meaning: 'Expected result or invariant failed' },
  revalidation: { label: 'Needs Revalidation', tone: 'warning', meaning: 'Dependent version must be retested' },
  contained: { label: 'Contained', tone: 'warning', meaning: 'Bounded affected cases paused before repair' },
  approval: { label: 'Approval Required', tone: 'warning', meaning: 'An authorized person must decide' },
  escalated: { label: 'Escalated', tone: 'warning', meaning: 'Human handoff has an owner' },
  held: { label: 'Held', tone: 'neutral', meaning: 'Work remains stopped; not a rejection' },
  running: { label: 'Running', tone: 'arc', meaning: 'Execution is active' },
}

/** Shown only when a `running` badge is stopped: neutral, never cyan. Not one of the twelve statuses. */
export const STOPPED_LABEL = 'Stopped'

/** Plain metadata chips. They imply no status. */
export const PLAIN_BADGES = [
  'Suggested',
  'Needs Review',
  'Unverified',
  'Not Run',
  'Partially Complete',
  'Repaired - Validated',
] as const

/** Exact status labels, used to upgrade matching outcome text to a StatusBadge. */
export const STATUS_BY_LABEL: Record<string, StatusId> = Object.fromEntries(
  STATUS_IDS.map((id) => [STATUS_META[id].label, id]),
)
