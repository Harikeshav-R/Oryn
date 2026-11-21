/**
 * DAT-13 consent copy and the independent consent values (CMP-13).
 * Notice acceptance, each capture category, organizational sharing and pause are separate
 * values. Contribution never implies capture and capture never implies contribution.
 */
export const CONSENT_COPY = {
  title: 'Your work, your choice',
  accept: 'Accept and continue',
  notice: 'I understand',
  workApplications: 'Work applications',
  excludedWindows: 'Excluded windows',
  exclusions: 'Excluded apps, windows and URLs',
  mandatoryExclusions: 'Mandatory exclusions',
  localRetention: 'Local retention: 7 days',
  deleteLocalHistory: 'Delete local history',
  visualObservation: 'Visual observation',
  contribution: 'Organizational contribution',
  pause: 'Pause observation',
  mandatoryReason: 'Mandatory exclusion: always on',
} as const

/** Exclusions are mandatory, not user-controlled consent choices. */
export const MANDATORY_EXCLUSIONS = Object.freeze({
  label: CONSENT_COPY.mandatoryExclusions,
  scope: CONSENT_COPY.exclusions,
  enabled: true,
  canDisable: false,
} as const)

export const PROTECTED_FIELD_LABELS = ['BANK ACCT', 'TAX ID', 'CARD'] as const

export const PRIVACY_LABEL = 'My Privacy'

export interface ConsentState {
  noticeAccepted: boolean
  workApplications: boolean
  visualObservation: boolean
  /** Sharing with the organization. Independent of capture. */
  contribution: boolean
  paused: boolean
}

/** Nothing is pre-selected: capture needs a deliberate choice. */
export const CONSENT_INITIAL: ConsentState = {
  noticeAccepted: false,
  workApplications: false,
  visualObservation: false,
  contribution: false,
  paused: false,
}

export type CaptureBlock = 'notice' | 'category' | 'paused'

/**
 * The single guard for starting capture. Returns why capture cannot begin, or `null` when
 * it may. Mandatory exclusions are not a choice and are not part of this guard.
 */
export function captureBlock(state: ConsentState): CaptureBlock | null {
  if (!state.noticeAccepted) return 'notice'
  if (state.paused) return 'paused'
  if (!state.workApplications && !state.visualObservation) return 'category'
  return null
}

export const CAPTURE_BLOCK_TEXT: Record<CaptureBlock, string> = {
  notice: 'Capture is off: accept the notice first.',
  paused: 'Capture is paused.',
  category: 'Capture is off: choose at least one category.',
}

export function captureCategories(state: ConsentState): string[] {
  const categories: string[] = []
  if (state.workApplications) categories.push(CONSENT_COPY.workApplications)
  if (state.visualObservation) categories.push(CONSENT_COPY.visualObservation)
  return categories
}
