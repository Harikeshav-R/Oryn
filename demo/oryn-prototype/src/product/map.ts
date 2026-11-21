import type { State } from '@/state'
import { destinationsFor } from './destinations'
import type { Access } from './discovery'

export function mapAccess(state: State): Access {
  return destinationsFor(state).some((destination) => destination.id === 'operations-map')
    ? { ok: true }
    : { ok: false, reason: 'Operations Map is available to the Workflow Owner and Admin.' }
}
