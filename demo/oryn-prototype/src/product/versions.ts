import type { State } from '@/state'
import { destinationsFor } from './destinations'
import type { Access } from './discovery'

export function versionsAccess(state: State): Access {
  return destinationsFor(state).some((destination) => destination.id === 'version-history')
    ? { ok: true }
    : { ok: false, reason: 'Version history is available to authorized organizational viewpoints.' }
}
