import { INCIDENT } from '@/data/incident'
import type { State } from '@/state'
import { roleOf } from './destinations'
import type { Access } from './discovery'

/** View access does not grant authority to act. */
export function incidentAccess(state: State): Access {
  const role = roleOf(state)
  return role === 'Workflow Owner' || role === 'Approver' || state.actorId === 'elena'
    ? { ok: true }
    : { ok: false, reason: 'Incident Center is available to the Workflow Owner, Approver and SME.' }
}

export const affectedCases = INCIDENT.affectedCases
export const selectedIncidentCase = (state: State): string => affectedCases.find((item) => item.id === state.selectedCase)?.id ?? affectedCases[0].id

export const CONTAINMENT_WIPE_FRAMES = 12
export const wipeEdge = (frameIndex: number): number => Math.round(1280 * (frameIndex + 1) / CONTAINMENT_WIPE_FRAMES)

/** Reconstruct only the theme and containment fields; all other state stays identical. */
export function preContainmentState(state: State): State {
  return { ...state, theme: 'light', incident: { ...state.incident, status: 'open', containedCaseIds: [] } }
}
