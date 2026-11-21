import { CAPABILITY_MATRIX } from '@/data/capabilities'
import type { CapabilitySelection } from '@/data/capabilities'
import type { State } from '@/state'
import { destinationsFor } from './destinations'
import type { Access } from './discovery'

export function capabilityAccess(state: State): Access {
  return destinationsFor(state).some((destination) => destination.id === 'application-capabilities')
    ? { ok: true }
    : { ok: false, reason: 'Application capabilities are available to the Workflow Owner and Admin.' }
}

export function capabilityAvailability(selection: CapabilitySelection) {
  return CAPABILITY_MATRIX.find((row) => row.application === selection.application)?.capabilities[selection.capability] ?? 'unavailable'
}
