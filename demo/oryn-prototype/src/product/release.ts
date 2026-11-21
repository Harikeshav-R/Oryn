import type { State } from '@/state'
import { roleOf } from './destinations'
import type { Access } from './discovery'

/** Reading release evidence does not confer decision authority. */
export function releaseAccess(state: State): Access {
  const role = roleOf(state)
  return role === 'Workflow Owner' || role === 'Approver'
    ? { ok: true }
    : { ok: false, reason: 'Release evidence is read by the Workflow Owner and the Approver.' }
}
