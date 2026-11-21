import { INVOICE_CASES } from '@/data/invoices'
import { REGRESSION_PASS_RESULTS } from '@/data/regression'
import { AGENT_DEFINITION } from '@/data/versions'
import { INCIDENT, REPAIR } from '@/data/incident'
import { createInitialState, type InitialOptions } from './initial'
import { transition } from './reducer'
import { SCREEN_MIN_PHASE, STATES, isScreenId, isStateId, phaseIndex } from './states'
import type { Action, ScreenId, State, StateId } from './types'

/**
 * The prerequisite history. A deep link does not set a phase: it replays the ordered actions
 * that legitimately reach it, so every guard runs. This is also the fixture-complete happy
 * path that the film script and the tests build on.
 */
const as = (personId: Extract<Action, { type: 'SELECT_ACTOR' }>['personId']): Action => ({ type: 'SELECT_ACTOR', personId })

export const CANONICAL_SCRIPT: readonly Action[] = Object.freeze([
  // ST01 enrollment: notice, category and contribution are separate choices.
  { type: 'ACKNOWLEDGE_NOTICE' },
  { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true },
  { type: 'SET_CONTRIBUTION', enabled: true },
  { type: 'CONSENT' },
  // ST02 observation: per-meeting consent is its own grant.
  { type: 'GRANT_MEETING_CONSENT', meetingId: 'zoom-kestrel' },
  { type: 'REVIEW_MEETING' },
  // ST03 meeting review.
  { type: 'EDIT_COMMITMENT', due: 'Fri 12:00' },
  { type: 'CONFIRM_COMMITMENT' },
  // ST04 candidate review: each contributor approves their own Demonstration, then the owner publishes.
  { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' },
  { type: 'APPROVE_DEMONSTRATION', demoId: 'D2' },
  as('jamal'),
  { type: 'ACKNOWLEDGE_NOTICE' },
  { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true },
  { type: 'SET_CONTRIBUTION', enabled: true },
  { type: 'APPROVE_DEMONSTRATION', demoId: 'D3' },
  { type: 'REQUEST_OWNER_REVIEW' },
  as('marcus'),
  { type: 'PUBLISH' },
  // ST05 to ST09 agent, simulation, release.
  { type: 'SET_INTENT', text: AGENT_DEFINITION.intent },
  { type: 'CREATE_AGENT' },
  { type: 'RUN_SIMULATION' },
  { type: 'COMPLETE_SIMULATION' },
  { type: 'FIX_AND_RUN' },
  { type: 'COMPLETE_SIMULATION' },
  { type: 'APPROVE_RELEASE' },
  { type: 'CONFIRM_SCOPE' },
  { type: 'CONFIRM_SELECTION' },
  { type: 'OPEN_JOB_SCOPE' },
  { type: 'RELEASE_AND_START' },
  // ST10 job: fixed case events.
  ...INVOICE_CASES.map((row): Action => ({ type: 'EVALUATE_CASE', invoice: row.invoice })),
  { type: 'PAUSE_FOR_APPROVAL' },
  // ST11: Daniel decides; readback is a separate, later event.
  as('daniel'),
  { type: 'APPROVE', invoice: 'INV-48219' },
  { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' },
  { type: 'NEXT_CYCLE_INCIDENT' },
  // ST12 and ST13.
  as('marcus'),
  { type: 'CONTAIN_INCIDENT', caseIds: INCIDENT.affectedCases.map((row) => row.id) },
  as('elena'),
  { type: 'COMPLETE_CASE_MANUALLY', caseId: INCIDENT.correction.caseId },
  { type: 'SET_TEACH_ANSWER', answer: 'yes' },
  { type: 'LINK_TEACH_RULE', linked: true },
  { type: 'TEACH' },
  as('marcus'),
  { type: 'VALIDATE_SCOPE', scope: REPAIR.scope },
  { type: 'PROPOSE_REPAIR' },
  // ST14 and ST15.
  { type: 'RUN_REGRESSION' },
  { type: 'COMPLETE_REGRESSION', results: REGRESSION_PASS_RESULTS },
  { type: 'LIMITED_RELEASE' },
  { type: 'VERIFY_COHORT_OUTCOME', index: 0, result: 'verified' },
  { type: 'VERIFY_COHORT_OUTCOME', index: 1, result: 'verified' },
  { type: 'VERIFY_COHORT_OUTCOME', index: 2, result: 'verified' },
  { type: 'EXPAND_RELEASE' },
  { type: 'CLOSE_INCIDENT' },
  // ST16 to ST24 montage.
  { type: 'OPEN_MONTAGE' },
  { type: 'NEXT' },
  { type: 'NEXT' },
  { type: 'NEXT' },
  { type: 'NEXT' },
  { type: 'NEXT' },
  { type: 'NEXT' },
  { type: 'EXPORT_AUDIT_PACK' },
  { type: 'NEXT' },
])

/** Replay that refuses to continue past a rejected action: the script must be self-consistent. */
export function replayStrict(actions: readonly Action[], options: InitialOptions = {}): State {
  let state = createInitialState(options)
  actions.forEach((action, index) => {
    const result = transition(state, action)
    if (!result.ok) throw new Error(`Action ${index} (${action.type}) was rejected: ${result.rejection.reason}`)
    state = result.state
  })
  return state
}

/** Shortest prefix of the canonical script that first enters `target`. ST01 needs none. */
export function scriptTo(target: StateId): readonly Action[] {
  if (target === 'ST01') return []
  let state = createInitialState()
  for (let index = 0; index < CANONICAL_SCRIPT.length; index += 1) {
    const action = CANONICAL_SCRIPT[index]
    if (!action) break
    const result = transition(state, action)
    if (!result.ok) throw new Error(`Canonical script rejected ${action.type} at ${index}: ${result.rejection.reason}`)
    state = result.state
    if (state.phase === target) return CANONICAL_SCRIPT.slice(0, index + 1)
  }
  throw new Error(`The canonical script never enters ${target}`)
}

/** State reached by legitimately replaying the prerequisites of `target`. */
export function reconstruct(target: StateId): State {
  return replayStrict(scriptTo(target))
}

export type DeepLinkResult = { readonly ok: true; readonly state: State } | { readonly ok: false; readonly reason: string }

/**
 * `?screen=SC22&state=ST10`. Query ids are validated against the unions; an unsupported
 * combination is rejected rather than rendered. A permitted link reconstructs its
 * prerequisites, so no guard is bypassed and the route never implies execution.
 */
export function openDeepLink(query: { readonly screen?: string; readonly state?: string }): DeepLinkResult {
  const { screen, state: stateId } = query
  if (screen !== undefined && !isScreenId(screen)) return { ok: false, reason: `${screen} is not a screen.` }
  if (stateId !== undefined && !isStateId(stateId)) return { ok: false, reason: `${stateId} is not a state.` }
  const target: StateId = stateId !== undefined && isStateId(stateId) ? stateId : screen !== undefined && isScreenId(screen) ? SCREEN_MIN_PHASE[screen] : 'ST01'
  if (screen !== undefined && isScreenId(screen) && phaseIndex(SCREEN_MIN_PHASE[screen]) > phaseIndex(target)) {
    return { ok: false, reason: `${screen} needs ${SCREEN_MIN_PHASE[screen]} ${STATES[SCREEN_MIN_PHASE[screen]].name}; it cannot be shown at ${target}.` }
  }
  const base = reconstruct(target)
  if (screen === undefined) return { ok: true, state: base }
  const opened = transition(base, { type: 'OPEN_SCREEN', screen: screen as ScreenId })
  return opened.ok ? { ok: true, state: opened.state } : { ok: false, reason: opened.rejection.reason }
}
