import type { State } from '@/state'
import type { Access } from './discovery'
import { roleOf } from './destinations'

export function teachAccess(state: State): Access {
  return state.actorId === 'elena' || roleOf(state) === 'Workflow Owner'
    ? { ok: true }
    : { ok: false, reason: 'The correction is available to Elena Ruiz and the Workflow Owner.' }
}
