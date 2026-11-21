import type { Role } from '@/data/labels'
import { person, jobCounts } from '@/state'
import type { ScreenId, State } from '@/state'

/**
 * SC12-FRAME navigation. The inventory fixes the 14 labels; this table resolves each to the named
 * product screen. Which rows a viewpoint sees is a view decision only: a role confers no authority
 * (RT-02), and an unauthorized destination is absent, not merely disabled.
 */
export const DESTINATION_IDS = [
  'home',
  'workflow-discovery',
  'playbooks',
  'operations-map',
  'agent-factory',
  'flight-simulator',
  'jobs',
  'incident-center',
  'version-history',
  'command-center',
  'audit-export',
  'notifications',
  'application-capabilities',
  'my-privacy',
] as const
export type DestinationId = (typeof DESTINATION_IDS)[number]

export interface Destination {
  readonly id: DestinationId
  readonly label: string
  readonly screen: ScreenId
}

export const DESTINATIONS: readonly Destination[] = [
  { id: 'home', label: 'Home', screen: 'SC12' },
  { id: 'workflow-discovery', label: 'Workflow Discovery', screen: 'SC13' },
  { id: 'playbooks', label: 'Playbooks', screen: 'SC15' },
  { id: 'operations-map', label: 'Operations Map', screen: 'SC16' },
  { id: 'agent-factory', label: 'Agent Factory', screen: 'SC17' },
  { id: 'flight-simulator', label: 'Flight Simulator', screen: 'SC19' },
  { id: 'jobs', label: 'Jobs', screen: 'SC21' },
  { id: 'incident-center', label: 'Incident Center', screen: 'SC26' },
  { id: 'version-history', label: 'Version History', screen: 'SC30' },
  { id: 'command-center', label: 'Command Center', screen: 'SC33' },
  { id: 'audit-export', label: 'Audit & Export', screen: 'SC34' },
  { id: 'notifications', label: 'Notifications', screen: 'SC35' },
  { id: 'application-capabilities', label: 'Application Capabilities', screen: 'SC36' },
  { id: 'my-privacy', label: 'My Privacy', screen: 'SC03' },
]

const byId = (id: DestinationId): Destination => DESTINATIONS.find((item) => item.id === id) as Destination

/** Rows each viewpoint's navigation shows. My Privacy is personal consent control, so only an Employee has it. */
const ROLE_DESTINATIONS: Readonly<Record<Role, readonly DestinationId[]>> = {
  Employee: ['home', 'notifications', 'my-privacy'],
  'Workflow Owner': ['home', 'workflow-discovery', 'playbooks', 'operations-map', 'agent-factory', 'flight-simulator', 'jobs', 'incident-center', 'version-history', 'command-center', 'audit-export', 'notifications', 'application-capabilities'],
  Approver: ['home', 'jobs', 'incident-center', 'version-history', 'command-center', 'audit-export', 'notifications'],
  Admin: ['home', 'operations-map', 'version-history', 'command-center', 'audit-export', 'notifications', 'application-capabilities'],
}

/** The viewpoint's role, or null for a person with no internal viewpoint (the external supplier). */
export function roleOf(state: State): Role | null {
  const role = person(state.actorId).role
  return role === 'Employee' || role === 'Workflow Owner' || role === 'Approver' || role === 'Admin' ? role : null
}

/** Navigation rows for the current viewpoint, in inventory order. An SME or external viewpoint has none. */
export function destinationsFor(state: State): readonly Destination[] {
  const role = roleOf(state)
  return role === null ? [] : ROLE_DESTINATIONS[role].map(byId)
}

/** A screen opened from a navigation row keeps that row current: the candidate review belongs to Workflow Discovery. */
const PARENT_DESTINATION: Readonly<Partial<Record<ScreenId, DestinationId>>> = { SC14: 'workflow-discovery', SC18: 'agent-factory', SC20: 'flight-simulator', SC22: 'jobs', SC23: 'jobs', SC24: 'jobs', SC25: 'jobs', SC27: 'incident-center', SC28: 'incident-center', SC29: 'incident-center' }

/** The destination a route belongs to (for the active nav row and the breadcrumb), or null for a screen outside the shell. */
export function destinationOf(route: ScreenId): Destination | null {
  const parent = PARENT_DESTINATION[route]
  return parent === undefined ? (DESTINATIONS.find((item) => item.screen === route) ?? null) : byId(parent)
}

/** Screens inside the shell that have no navigation row: reached from a work application, not from the sidebar. */
const SCREEN_LABELS: Readonly<Partial<Record<ScreenId, string>>> = { SC11: 'Meeting review', SC14: 'Candidate review', SC18: 'Scope and gates', SC20: 'Evaluation results', SC22: 'Job progress', SC23: 'Approval', SC24: 'Outcome evidence', SC25: 'Job summary', SC27: 'Teach Oryn What Changed', SC28: 'Repair proposal', SC29: 'Limited release', SC31: 'Policy change' }

/** Breadcrumb and heading text for a route: its navigation label, else its own name, else the route id. */
export const screenLabel = (route: ScreenId): string => SCREEN_LABELS[route] ?? destinationOf(route)?.label ?? route

// -- SC12 Home --------------------------------------------------------------------------

export type HomeCardId = 'approvals' | 'incidents' | 'verified-outcomes' | 'recent-changes'

export interface HomeCard {
  readonly id: HomeCardId
  readonly title: 'Approvals' | 'Incidents' | 'Verified outcomes' | 'Recent changes'
  /** Route the card opens. The reducer's own guard decides whether it is reachable yet. */
  readonly screen: ScreenId
  /** Roles whose viewpoint may read the card. Others see a reason, never the figures. */
  readonly roles: readonly Role[]
  readonly figure: (state: State) => { readonly value: number; readonly detail: string }
}

export const HOME_CARDS: readonly HomeCard[] = [
  {
    id: 'approvals',
    title: 'Approvals',
    screen: 'SC23',
    roles: ['Workflow Owner', 'Approver'],
    figure: (state) => {
      const waiting = jobCounts(state).approval
      return { value: waiting, detail: waiting === 1 ? 'case waiting for approval' : 'cases waiting for approval' }
    },
  },
  {
    id: 'incidents',
    title: 'Incidents',
    screen: 'SC26',
    roles: ['Workflow Owner', 'Approver', 'Admin'],
    figure: (state) => {
      const open = state.incident.status === 'open' ? 1 : 0
      return { value: open, detail: open === 1 ? 'incident open' : 'incidents open' }
    },
  },
  {
    id: 'verified-outcomes',
    title: 'Verified outcomes',
    screen: 'SC25',
    roles: ['Workflow Owner', 'Approver', 'Admin'],
    figure: (state) => {
      const { verified, total } = jobCounts(state)
      return { value: verified, detail: total === 0 ? 'no job has run yet' : `of ${total} cases in this job` }
    },
  },
  {
    id: 'recent-changes',
    title: 'Recent changes',
    screen: 'SC34',
    roles: ['Employee', 'Workflow Owner', 'Approver', 'Admin'],
    figure: (state) => ({ value: state.audit.length, detail: state.audit.length === 1 ? 'audit event recorded' : 'audit events recorded' }),
  },
]

export type HomeCardView =
  | { readonly card: HomeCard; readonly available: true; readonly value: number; readonly detail: string }
  | { readonly card: HomeCard; readonly available: false; readonly reason: string }

/** Four cards for the current viewpoint. Figures come from the selected snapshot; an unauthorized card carries a reason instead. */
export function homeCards(state: State): readonly HomeCardView[] {
  const role = roleOf(state)
  return HOME_CARDS.map((card): HomeCardView => {
    if (role !== null && card.roles.includes(role)) return { card, available: true, ...card.figure(state) }
    return { card, available: false, reason: role === null ? 'No internal viewpoint is selected.' : `Not available for ${role}.` }
  })
}
