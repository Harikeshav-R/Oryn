import { ROLES, type Role } from './labels'

/**
 * CMP-11 command palette fixture and permission filter (RT-02). A command appears only if
 * the current viewpoint role may run it. Roles are viewpoints, not delegations: nothing
 * here grants authority, and no command exposes private evidence.
 */
export interface Command {
  id: string
  label: string
  /** Where the command goes. Display only; the palette never mutates domain state. */
  target: string
  roles: readonly Role[]
}

export const COMMANDS: readonly Command[] = [
  { id: 'privacy', label: 'Open My Privacy', target: 'My Privacy', roles: ROLES },
  { id: 'pause', label: 'Pause observation', target: 'My Privacy', roles: ['Employee'] },
  { id: 'guide', label: 'Guide Me', target: 'Guidance', roles: ['Employee'] },
  { id: 'publish', label: 'Publish playbook', target: 'Playbook', roles: ['Workflow Owner'] },
  { id: 'run', label: 'Run scenarios', target: 'Flight Simulator', roles: ['Workflow Owner'] },
  { id: 'unknown', label: 'Open INV-48220 evidence', target: 'JOB-0117', roles: ['Workflow Owner', 'Approver'] },
  { id: 'approve', label: 'Review approval INV-48219', target: 'JOB-0117', roles: ['Approver'] },
  { id: 'export', label: 'Export audit pack', target: 'Audit history', roles: ['Workflow Owner', 'Admin'] },
]

export const NO_MATCH = 'No matching commands'
export const NOT_LISTED = 'Commands your role cannot run are not listed.'

export interface CommandSearch {
  /** Authorized matches, in fixture order. */
  results: readonly Command[]
  /** True when the query matched commands that this role may not run. */
  denied: boolean
}

export function searchCommands(role: Role, query: string): CommandSearch {
  const needle = query.trim().toLowerCase()
  const matches = COMMANDS.filter((command) => needle === '' || command.label.toLowerCase().includes(needle))
  const results = matches.filter((command) => command.roles.includes(role))
  return { results, denied: results.length === 0 && matches.length > 0 }
}
