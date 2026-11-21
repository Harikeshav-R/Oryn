import type { ActionType, ScreenId, StateId } from './types'
import { SCREEN_IDS, STATE_IDS } from './types'

/**
 * RT-01 transition graph. Every lifecycle state has a named entry (the action that
 * arrives there) and a named exit (the action that leaves). The table is data only: guards
 * and effects live in `rules.ts`, and a test proves the two agree.
 */
export interface Edge {
  readonly from: StateId
  readonly action: ActionType
  /** Possible destinations. ST07 completion goes to ST08 or ST09 by evaluation outcome. */
  readonly to: readonly StateId[]
}

export const TRANSITIONS: readonly Edge[] = Object.freeze([
  { from: 'ST01', action: 'CONSENT', to: ['ST02'] },
  { from: 'ST02', action: 'REVIEW_MEETING', to: ['ST03'] },
  { from: 'ST03', action: 'CONFIRM_COMMITMENT', to: ['ST04'] },
  { from: 'ST04', action: 'PUBLISH', to: ['ST05'] },
  { from: 'ST05', action: 'CREATE_AGENT', to: ['ST06'] },
  { from: 'ST06', action: 'RUN_SIMULATION', to: ['ST07'] },
  { from: 'ST07', action: 'COMPLETE_SIMULATION', to: ['ST08', 'ST09'] },
  { from: 'ST08', action: 'FIX_AND_RUN', to: ['ST07'] },
  { from: 'ST09', action: 'RELEASE_AND_START', to: ['ST10'] },
  { from: 'ST10', action: 'PAUSE_FOR_APPROVAL', to: ['ST11'] },
  { from: 'ST11', action: 'NEXT_CYCLE_INCIDENT', to: ['ST12'] },
  { from: 'ST12', action: 'TEACH', to: ['ST13'] },
  { from: 'ST13', action: 'PROPOSE_REPAIR', to: ['ST14'] },
  { from: 'ST14', action: 'LIMITED_RELEASE', to: ['ST15'] },
  { from: 'ST15', action: 'CLOSE_INCIDENT', to: ['ST16'] },
  { from: 'ST16', action: 'OPEN_MONTAGE', to: ['ST17'] },
  { from: 'ST17', action: 'NEXT', to: ['ST18'] },
  { from: 'ST18', action: 'NEXT', to: ['ST19'] },
  { from: 'ST19', action: 'NEXT', to: ['ST20'] },
  { from: 'ST20', action: 'NEXT', to: ['ST21'] },
  { from: 'ST21', action: 'NEXT', to: ['ST22'] },
  { from: 'ST22', action: 'NEXT', to: ['ST23'] },
  { from: 'ST23', action: 'NEXT', to: ['ST24'] },
  { from: 'ST24', action: 'RESET', to: ['ST01'] },
])

/** `name` is the RT-01 state name; `screens` is its view binding (first is primary). */
export interface StateDef {
  readonly id: StateId
  readonly name: string
  readonly screens: readonly ScreenId[]
  /** Actions that arrive here. ST01 is entered by `INIT` at start and by RESET. */
  readonly entry: readonly (ActionType | 'INIT')[]
  readonly exit: ActionType
}

const NAMES: Readonly<Record<StateId, { name: string; screens: readonly ScreenId[] }>> = {
  ST01: { name: 'enrollment', screens: ['SC02', 'SC03'] },
  ST02: { name: 'observation', screens: ['SC01', 'SC05', 'SC06', 'SC07', 'SC08', 'SC09'] },
  ST03: { name: 'meeting_review', screens: ['SC11'] },
  ST04: { name: 'candidate_review', screens: ['SC13', 'SC14'] },
  ST05: { name: 'playbook_published', screens: ['SC15'] },
  ST06: { name: 'agent_draft', screens: ['SC17', 'SC18'] },
  ST07: { name: 'simulation_running', screens: ['SC19'] },
  ST08: { name: 'simulation_failed', screens: ['SC20'] },
  ST09: { name: 'simulation_passed', screens: ['SC20', 'SC18'] },
  ST10: { name: 'job_running', screens: ['SC21', 'SC22'] },
  ST11: { name: 'approval_required', screens: ['SC23', 'SC24', 'SC25'] },
  ST12: { name: 'incident_open', screens: ['SC26'] },
  ST13: { name: 'correction_captured', screens: ['SC27'] },
  ST14: { name: 'repair_testing', screens: ['SC28'] },
  ST15: { name: 'limited_release', screens: ['SC29'] },
  ST16: { name: 'rollout_expanded_closed', screens: ['SC29'] },
  ST17: { name: 'ops_map', screens: ['SC16'] },
  ST18: { name: 'peer_guidance', screens: ['SC04'] },
  ST19: { name: 'policy_revalidation', screens: ['SC31'] },
  ST20: { name: 'unsafe_blocked', screens: ['SC10', 'SC32'] },
  ST21: { name: 'versions', screens: ['SC30'] },
  ST22: { name: 'command_center', screens: ['SC33'] },
  ST23: { name: 'audit_export', screens: ['SC34'] },
  ST24: { name: 'notifications', screens: ['SC35'] },
}

function entriesInto(id: StateId): readonly (ActionType | 'INIT')[] {
  const arriving = TRANSITIONS.filter((edge) => edge.to.includes(id)).map((edge) => edge.action)
  return id === 'ST01' ? ['INIT', ...arriving] : arriving
}

export const STATES: Readonly<Record<StateId, StateDef>> = Object.freeze(
  Object.fromEntries(
    STATE_IDS.map((id) => {
      const exit = TRANSITIONS.find((edge) => edge.from === id)
      if (!exit) throw new Error(`State ${id} has no exit action`)
      return [id, Object.freeze({ id, ...NAMES[id], entry: Object.freeze([...new Set(entriesInto(id))]), exit: exit.action })]
    }),
  ) as Record<StateId, StateDef>,
)

export function phaseIndex(phase: StateId): number {
  return STATE_IDS.indexOf(phase)
}

/** The state that follows `from` in the straight-line montage (ST17 to ST24). */
export function nextPhase(from: StateId): StateId {
  const edge = TRANSITIONS.find((candidate) => candidate.from === from)
  const to = edge?.to[0]
  if (!to) throw new Error(`State ${from} has no successor`)
  return to
}

/**
 * Earliest state in which a screen may be opened; a deep link to it must first reconstruct
 * that state's prerequisites. By default this is the earliest state whose view binding
 * includes the screen. Screens in no binding (shell, home) are free. A screen that carries
 * the control which causes the next state is reachable one state earlier than its binding:
 * SC15 (Publish), SC17 (Create Agent), SC19 (Run scenarios), SC21 (start the job), SC27 (Teach), SC28 (propose repair). SC04, the
 * contextual reminder, is also used right after the commitment is confirmed. SC05 to SC09 are the
 * employee's own work applications (Gmail, NetSuite, Sheets, Slack, Zoom): they exist before Oryn
 * and are shown in the problem montage, so they are free at ST01. Observation inside them is not.
 */
const SCREEN_OVERRIDES: Partial<Record<ScreenId, StateId>> = { SC04: 'ST04', SC05: 'ST01', SC06: 'ST01', SC07: 'ST01', SC08: 'ST01', SC09: 'ST01', SC15: 'ST04', SC17: 'ST05', SC19: 'ST06', SC21: 'ST09', SC27: 'ST12', SC28: 'ST13', SC29: 'ST14' }

export const SCREEN_MIN_PHASE: Readonly<Record<ScreenId, StateId>> = Object.freeze(
  Object.fromEntries(
    SCREEN_IDS.map((screen) => {
      const bound = STATE_IDS.find((id) => STATES[id].screens.includes(screen))
      return [screen, SCREEN_OVERRIDES[screen] ?? bound ?? 'ST01']
    }),
  ) as Record<ScreenId, StateId>,
)

export function isScreenId(value: string): value is ScreenId {
  return (SCREEN_IDS as readonly string[]).includes(value)
}

export function isStateId(value: string): value is StateId {
  return (STATE_IDS as readonly string[]).includes(value)
}
