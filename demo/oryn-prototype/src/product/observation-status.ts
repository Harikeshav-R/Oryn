import { isEmployee, observationActive } from '@/state'
import type { State } from '@/state'

export type ObservationStatus = 'Observation active' | 'Observation paused' | 'Observation off'

/**
 * Neutral passive-observation status for the acting person (never cyan: nothing is executing).
 * Active needs enrollment finished and the person's own notice, category and pause to allow it;
 * paused is the person's own pause; everything else, including a declined notice, is off.
 */
export function observationStatus(state: State): ObservationStatus {
  const id = state.actorId
  if (!isEmployee(id)) return 'Observation off'
  if (observationActive(state, id)) return 'Observation active'
  return state.consent[id].paused ? 'Observation paused' : 'Observation off'
}
