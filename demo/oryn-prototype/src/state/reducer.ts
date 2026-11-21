import { createInitialState, type InitialOptions } from './initial'
import { RULES, type Rule } from './rules'
import { STATES } from './states'
import type { Action, ActionType, GuardId, Rejection, State, StateId, Transition } from './types'

/**
 * RT-01 engine. One immutable reducer for film playback and interactive use: it looks up
 * the rule for the action, checks the phase, runs the guard, applies the effect and, for a
 * lifecycle transition, records the exit of the old state and the entry of the new one.
 * A failed guard keeps every business field and carries its reason in `rejection`.
 */

/** Opening a work-application screen brings its browser tab forward, so entering a state whose screen is a work application does too. */
const withTab = (state: State, tab: State['ui']['activeTab']): State =>
  state.ui.activeTab === tab ? state : { ...state, ui: { ...state.ui, activeTab: tab, tabHistory: [...state.ui.tabHistory, state.ui.activeTab] } }

/** Entry effects: view-state that follows a phase, set only when that phase is entered. */
const ENTRY_EFFECTS: Partial<Record<StateId, (state: State) => State>> = {
  ST15: (state) => ({ ...state, theme: 'light' }),
  ST18: (state) => withTab(state, 'netsuite'),
  ST19: (state) => ({ ...state, policy: { ...state.policy, revalidationMarked: true } }),
  ST20: (state) => withTab(state, 'hubspot'),
}

function enter(state: State, via: ActionType, to: StateId): State {
  const open = state.history.length - 1
  const history = state.history.map((record, index) =>
    index === open ? { ...record, exitedBy: via, exitedAtStep: state.step } : record,
  )
  const entered: State = {
    ...state,
    phase: to,
    route: STATES[to].screens[0] ?? state.route,
    history: [...history, { phase: to, enteredBy: via, enteredAtStep: state.step, exitedBy: null, exitedAtStep: null }],
  }
  const effect = ENTRY_EFFECTS[to]
  return effect ? effect(entered) : entered
}

function reject(state: State, type: ActionType, guard: GuardId, reason: string): Transition {
  const rejection: Rejection = { action: type, guard, reason }
  return { ok: false, state: { ...state, rejection }, rejection }
}

/** Full result of an action: accepted state, or the retained state plus the exact reason. */
export function transition(state: State, action: Action): Transition {
  // `action` may come from a URL or a script: never trust `type` to be a key.
  const type = action.type
  if (!Object.hasOwn(RULES, type)) return reject(state, type, 'action', `${String(type)} is not an action.`)
  const rule = RULES[type] as unknown as Rule<Action>

  if (!rule.from.includes(state.phase)) {
    const where = rule.from.map((id) => `${id} ${STATES[id].name}`).join(', ')
    return reject(state, type, 'phase', `${type} is not available in ${state.phase} ${STATES[state.phase].name}; it applies in ${where}.`)
  }
  const failure = rule.guard(state, action)
  if (failure) return reject(state, type, failure.guard, failure.reason)

  const applied = rule.apply(state, action)
  // RESET restores the initial snapshot wholesale, including its own history.
  if (type === 'RESET') return { ok: true, state: applied }

  const stepped: State = { ...applied, step: state.step + 1, rejection: null }
  const to = rule.to ? rule.to(stepped, action) : state.phase
  return { ok: true, state: to === state.phase ? stepped : enter(stepped, type, to) }
}

/** `reduce(state, action)`: a rejected action returns the same business state plus `rejection`. */
export function reduce(state: State, action: Action): State {
  return transition(state, action).state
}

/**
 * Replay ordered actions from the initial snapshot, optionally stopping after `count`.
 * Seeking backward is `replay(actions, { count: earlier })`: the earlier state, its history
 * and its audit are reconstructed exactly, and nothing depends on a previously computed state.
 */
export function replay(actions: readonly Action[], options: InitialOptions & { readonly count?: number } = {}): State {
  const { count = actions.length, ...initial } = options
  return actions.slice(0, count).reduce(reduce, createInitialState(initial))
}
