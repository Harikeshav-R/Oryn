import { jobCounts } from '@/state'
import type { State } from '@/state'
import { destinationsFor } from './destinations'
import type { Access } from './discovery'

export function commandAccess(state: State): Access {
  return destinationsFor(state).some((destination) => destination.id === 'command-center')
    ? { ok: true }
    : { ok: false, reason: 'Command Center is available to authorized organizational viewpoints.' }
}

export function commandCounts(state: State) {
  const counts = jobCounts(state)
  const before = state.ui.breadth.command.snapshot === 'before' && state.readback.status === 'verified'
  return { ...counts, verified: counts.verified - (before ? 1 : 0), approval: counts.approval + (before ? 1 : 0) }
}
