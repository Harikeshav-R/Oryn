import type { State } from '@/state'
import { destinationsFor } from './destinations'
import type { Access } from './discovery'

export function auditAccess(state: State): Access {
  return destinationsFor(state).some((destination) => destination.id === 'audit-export')
    ? { ok: true }
    : { ok: false, reason: 'Audit history is available to authorized reviewers.' }
}
