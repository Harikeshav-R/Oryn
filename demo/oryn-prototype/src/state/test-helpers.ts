import { expect } from 'bun:test'
import { DEFAULT_GRANTS } from './permissions'
import { transition } from './reducer'
import type { Action, GuardId, Grant, Rejection, State } from './types'

/** Apply actions in order; any rejection fails the test with its reason. */
export function act(state: State, ...actions: readonly Action[]): State {
  return actions.reduce((current, action) => {
    const result = transition(current, action)
    if (!result.ok) throw new Error(`${action.type} was rejected: ${result.rejection.reason}`)
    return result.state
  }, state)
}

/**
 * Assert an action is rejected with `guard`, that the business state is retained exactly
 * (only `rejection` differs) and that the reason names the actual guard. Returns the rejection.
 */
export function expectRejected(state: State, action: Action, guard: GuardId): Rejection {
  const result = transition(state, action)
  expect(result.ok).toBe(false)
  if (result.ok) throw new Error('unreachable')
  expect(result.rejection.guard).toBe(guard)
  expect(result.rejection.action).toBe(action.type)
  expect(result.rejection.reason.length).toBeGreaterThan(0)
  expect(result.state.rejection).toEqual(result.rejection)
  expect({ ...result.state, rejection: null }).toEqual({ ...state, rejection: null })
  return result.rejection
}

export function withGrant(id: string, patch: Partial<Grant>): readonly Grant[] {
  return DEFAULT_GRANTS.map((grant) => (grant.id === id ? { ...grant, ...patch } : grant))
}

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
