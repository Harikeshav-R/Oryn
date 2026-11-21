import type { State } from '@/state'
import { roleOf } from './destinations'
import type { Access } from './discovery'

export function policyAccess(state: State): Access {
  const role = roleOf(state)
  return role === 'Workflow Owner' || role === 'Admin'
    ? { ok: true }
    : { ok: false, reason: 'Policy impact is available to the Workflow Owner and Admin.' }
}
