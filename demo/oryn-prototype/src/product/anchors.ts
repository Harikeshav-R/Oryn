import type { AppTabId, ScreenId, State } from '@/state'
import { ERP_ANCHORS } from './apps/erp-layout'
import { GMAIL_ANCHORS } from './apps/gmail-layout'
import { SLACK_ANCHORS } from './apps/slack-layout'
import { TRACKER_ANCHORS } from './apps/tracker-layout'
import { ZOOM_ANCHORS } from './apps/zoom-layout'
import { DESTINATION_IDS } from './destinations'
import { CANDIDATE_ANCHORS } from './candidate-layout'
import { DISCOVERY_ANCHORS } from './discovery-layout'
import { FACTORY_ANCHORS } from './factory-layout'
import { INCIDENT_ANCHORS } from './incident-layout'
import { JOBS_ANCHORS, JOB_ANCHORS, JOB_SUMMARY_ANCHORS } from './job-layout'
import { MEETING_REVIEW_ANCHORS } from './meeting-review-layout'
import { PLAYBOOK_ANCHORS } from './playbook-layout'
import { SCOPE_ANCHORS } from './scope-layout'
import { RELEASE_ANCHORS } from './release-layout'
import { REPAIR_ANCHORS } from './repair-layout'
import { RESULT_ANCHORS, SIMULATOR_ANCHORS } from './simulator-layout'
import { TEACH_ANCHORS } from './teach-layout'
import { HUBSPOT_ANCHORS } from './apps/hubspot-layout'
import { AUDIT_ANCHORS } from './audit-layout'
import { CAPABILITY_ANCHORS } from './capabilities-layout'
import { COMMAND_ANCHORS } from './command-layout'
import { MAP_ANCHORS } from './map-layout'
import { NOTIFICATIONS_ANCHORS, NOTIFICATION_TOAST_ANCHORS } from './notifications-layout'
import { POLICY_ANCHORS } from './policy-layout'
import { VERSIONS_ANCHORS } from './versions-layout'

/** People the role selector lists: every internal viewpoint with one of the four roles. */
export const ROLE_OPTION_IDS = ['priya', 'jamal', 'marcus', 'daniel', 'tomas'] as const

/**
 * Film anchor names (`data-film-anchor`) each screen renders, and the scene each route draws. A
 * film surface hides every timeline anchor that belongs to another scene with a stand-in, so the
 * capture finds one element per anchor on every frame. `anchors.test.tsx` renders every scene and
 * checks these lists against the DOM in both directions.
 */
export const SHELL_ANCHORS = [
  'role-selector',
  'search',
  'bell',
  'navigation',
  'breadcrumbs',
  'command-palette',
  ...ROLE_OPTION_IDS.map((id) => `role-option-${id}`),
  ...DESTINATION_IDS.map((id) => `nav-${id}`),
] as const

export const HOME_ANCHORS = ['home-cards', 'card-approvals', 'card-incidents', 'card-verified-outcomes', 'card-recent-changes'] as const

export const ENROLLMENT_ANCHORS = [
  'notice',
  'review-notice',
  'understand',
  'capture-consent',
  'work-applications',
  'visual-observation',
  'sharing-consent',
  'contribution',
  'continue',
  'back',
  'decline',
] as const

export const PRIVACY_ANCHORS = ['exclusions', 'retention', 'masked-fields', 'privacy-pause', 'delete-local-history', 'delete-dialog', 'delete-confirm', 'delete-cancel'] as const

export const DESKTOP_ANCHORS = [
  'browser-tabs',
  'tab-gmail',
  'tab-netsuite',
  'tab-tracker',
  'tab-slack',
  'tab-zoom',
  'tab-hubspot',
  'tray-icon',
  'companion-menu',
  'pause-observation',
  'my-privacy-link',
  'excluded-window',
  'excluded-cue',
  'dock',
] as const

/** SC02 enrollment and the desktop (SC01, SC04-SC10, SC32) stand outside the organizational shell. SC10 and SC32 are the HubSpot tab with its blocked-action card. */
export type Scene = 'enrollment' | 'desktop' | 'privacy' | 'home' | 'meeting-review' | 'discovery' | 'candidate' | 'playbook' | 'factory' | 'scope' | 'simulator' | 'results' | 'jobs' | 'job' | 'job-summary' | 'incident' | 'teach' | 'repair' | 'release' | 'map' | 'versions' | 'policy' | 'command' | 'audit' | 'notifications' | 'capabilities' | 'pending'

const DESKTOP_ROUTES: readonly ScreenId[] = ['SC01', 'SC04', 'SC05', 'SC06', 'SC07', 'SC08', 'SC09', 'SC10', 'SC32']

export function sceneOf(route: ScreenId): Scene {
  if (route === 'SC02') return 'enrollment'
  if (DESKTOP_ROUTES.includes(route)) return 'desktop'
  if (route === 'SC03') return 'privacy'
  if (route === 'SC11') return 'meeting-review'
  if (route === 'SC13') return 'discovery'
  if (route === 'SC14') return 'candidate'
  if (route === 'SC15') return 'playbook'
  if (route === 'SC17') return 'factory'
  if (route === 'SC18') return 'scope'
  if (route === 'SC19') return 'simulator'
  if (route === 'SC20') return 'results'
  if (route === 'SC21') return 'jobs'
  if (route === 'SC22' || route === 'SC23' || route === 'SC24') return 'job'
  if (route === 'SC25') return 'job-summary'
  if (route === 'SC26') return 'incident'
  if (route === 'SC27') return 'teach'
  if (route === 'SC28') return 'repair'
  if (route === 'SC29') return 'release'
  if (route === 'SC12') return 'home'
  if (route === 'SC16') return 'map'
  if (route === 'SC30') return 'versions'
  if (route === 'SC31') return 'policy'
  if (route === 'SC33') return 'command'
  if (route === 'SC34') return 'audit'
  if (route === 'SC35') return 'notifications'
  if (route === 'SC36') return 'capabilities'
  return 'pending'
}

/** Anchors each work-application view renders (every one is always rendered, hidden when not shown). */
const APP_TAB_ANCHORS: Readonly<Record<AppTabId, readonly string[]>> = {
  gmail: GMAIL_ANCHORS,
  netsuite: ERP_ANCHORS,
  tracker: TRACKER_ANCHORS,
  slack: SLACK_ANCHORS,
  zoom: ZOOM_ANCHORS,
  hubspot: HUBSPOT_ANCHORS,
}

/** Anchor names the current screen renders, apart from the toast: only the active browser tab's own anchors exist on the desktop. */
function sceneOwnAnchors(state: State): readonly string[] {
  switch (sceneOf(state.route)) {
    case 'enrollment':
      return ENROLLMENT_ANCHORS
    case 'desktop':
      return [...DESKTOP_ANCHORS, ...APP_TAB_ANCHORS[state.ui.activeTab]]
    case 'privacy':
      return [...SHELL_ANCHORS, ...PRIVACY_ANCHORS]
    case 'home':
      return [...SHELL_ANCHORS, ...HOME_ANCHORS]
    case 'meeting-review':
      return [...SHELL_ANCHORS, ...MEETING_REVIEW_ANCHORS]
    case 'discovery':
      return [...SHELL_ANCHORS, ...DISCOVERY_ANCHORS]
    case 'candidate':
      return [...SHELL_ANCHORS, ...CANDIDATE_ANCHORS]
    case 'playbook':
      return [...SHELL_ANCHORS, ...PLAYBOOK_ANCHORS]
    case 'factory':
      return [...SHELL_ANCHORS, ...FACTORY_ANCHORS]
    case 'scope':
      return [...SHELL_ANCHORS, ...SCOPE_ANCHORS]
    case 'simulator':
      return [...SHELL_ANCHORS, ...SIMULATOR_ANCHORS]
    case 'results':
      return [...SHELL_ANCHORS, ...RESULT_ANCHORS]
    case 'jobs':
      return [...SHELL_ANCHORS, ...JOBS_ANCHORS]
    case 'job':
      return [...SHELL_ANCHORS, ...JOB_ANCHORS]
    case 'job-summary':
      return [...SHELL_ANCHORS, ...JOB_SUMMARY_ANCHORS]
    case 'incident':
      return [...SHELL_ANCHORS, ...INCIDENT_ANCHORS]
    case 'teach':
      return [...SHELL_ANCHORS, ...TEACH_ANCHORS]
    case 'repair':
      return [...SHELL_ANCHORS, ...REPAIR_ANCHORS]
    case 'release':
      return [...SHELL_ANCHORS, ...RELEASE_ANCHORS]
    case 'map':
      return [...SHELL_ANCHORS, ...MAP_ANCHORS]
    case 'versions':
      return [...SHELL_ANCHORS, ...VERSIONS_ANCHORS]
    case 'policy':
      return [...SHELL_ANCHORS, ...POLICY_ANCHORS]
    case 'command':
      return [...SHELL_ANCHORS, ...COMMAND_ANCHORS]
    case 'audit':
      return [...SHELL_ANCHORS, ...AUDIT_ANCHORS]
    case 'notifications':
      return [...SHELL_ANCHORS, ...NOTIFICATIONS_ANCHORS]
    case 'capabilities':
      return [...SHELL_ANCHORS, ...CAPABILITY_ANCHORS]
    case 'pending':
      return SHELL_ANCHORS
  }
}

/** The one notification toast floats over every organizational screen, so its anchors exist on each of them (hidden while no toast is showing). */
export function sceneAnchors(state: State): readonly string[] {
  const scene = sceneOf(state.route)
  const own = sceneOwnAnchors(state)
  return scene === 'enrollment' || scene === 'desktop' ? own : [...own, ...NOTIFICATION_TOAST_ANCHORS]
}
