export type NotificationId = 'N-01' | 'N-02' | 'N-03' | 'N-04' | 'N-05'
export type NotificationRecipient = 'daniel' | 'marcus' | 'priya'
export type NotificationTarget = 'INV-48219' | 'INC-0042' | 'kestrel-commitment' | 'REP-0042-1' | 'v1.1-limited-cohort'

interface NotificationFixture {
  recipient: NotificationRecipient
  title: string
  detail: string
  action: string
  target: NotificationTarget
}

export const NOTIFICATIONS: Readonly<Record<NotificationId, NotificationFixture>> = {
  'N-01': { recipient: 'daniel', title: 'Approval Required', detail: 'INV-48219', action: 'Review approval', target: 'INV-48219' },
  'N-02': { recipient: 'marcus', title: 'INC-0042 Contained', detail: 'three Kestrel cases paused', action: 'View incident', target: 'INC-0042' },
  'N-03': { recipient: 'priya', title: 'Confirm Kestrel handling-fee terms in writing', detail: 'Fri 12:00 · NetSuite vendor record', action: 'View commitment', target: 'kestrel-commitment' },
  'N-04': { recipient: 'marcus', title: 'Repair Ready', detail: 'REP-0042-1', action: 'View repair', target: 'REP-0042-1' },
  'N-05': { recipient: 'marcus', title: 'Release Status', detail: 'v1.1 limited cohort', action: 'View release', target: 'v1.1-limited-cohort' },
}

export interface NotificationEligibility {
  recipient: NotificationRecipient
  /** These events must have occurred; absence never implies eligibility. */
  approvalRequired?: boolean
  incidentContained?: boolean
  commitmentConfirmed: boolean
  regressionPassed: boolean
  releaseAuthorized: boolean
  /** Explicit object-level read access; a selected role alone is not a grant. */
  canAccess: (target: NotificationTarget) => boolean
  dismissed?: readonly NotificationId[]
}

/** Eligibility is separate from opening, reading, or dismissing a notice. */
export function isNotificationEligible(id: NotificationId, { recipient, approvalRequired = false, incidentContained = false, commitmentConfirmed, regressionPassed, releaseAuthorized, canAccess, dismissed = [] }: NotificationEligibility): boolean {
  const item = NOTIFICATIONS[id]
  return item.recipient === recipient && !dismissed.includes(id) &&
    (id !== 'N-01' || approvalRequired) && (id !== 'N-02' || incidentContained) &&
    (id !== 'N-03' || commitmentConfirmed) && (id !== 'N-04' || regressionPassed) &&
    (id !== 'N-05' || releaseAuthorized) && canAccess(item.target)
}

/** Select the first eligible notice in fixture priority order, never a stack. */
export function selectNotification(eligibility: NotificationEligibility): NotificationId | undefined {
  return (Object.keys(NOTIFICATIONS) as NotificationId[]).find((id) => isNotificationEligible(id, eligibility))
}
