import { PLAYBOOK } from '@/data/playbook'
import { gateChecks, person, phaseIndex } from '@/state'
import type { GateCheck, State } from '@/state'
import { roleOf } from './destinations'
import { refusal } from './discovery'
import type { Access } from './discovery'

/**
 * View decisions shared by SC17 and SC18. Access here only decides what a viewpoint sees: it grants
 * nothing (RT-02). Every refusal text comes from the reducer's own guard or from the release gate,
 * so a disabled control and the rejected action explain themselves in the same words.
 */

/** The Agent Factory, its scope and its gate are managed by the Workflow Owner. */
export function factoryAccess(state: State): Access {
  return roleOf(state) === 'Workflow Owner' ? { ok: true } : { ok: false, reason: `The Agent Factory is managed by the Workflow Owner, ${person(PLAYBOOK.ownerId).name}.` }
}

/** A candidate exists from `CREATE_AGENT` on: the draft is v0.1 and nothing has run. */
export const hasDraft = (state: State): boolean => state.agent.versions.length > 0

/** Why Continue is unavailable, or null. Blank or unsupported intent and a missing grant come from the reducer's own `CREATE_AGENT` guard. */
export function continueBlock(state: State): string | null {
  return state.phase === 'ST05' ? refusal(state, { type: 'CREATE_AGENT' }) : null
}

const GATE_ROWS: readonly GateCheck['id'][] = ['examples', 'scenarios', 'edgeCases', 'ownerApproval']

/** The four rows the gate shows, each met only by its own evidence or authorization event. */
export const gateRows = (state: State): readonly GateCheck[] => gateChecks(state).filter((check) => GATE_ROWS.includes(check.id))

export const gateRowsMet = (state: State): boolean => gateRows(state).every((check) => check.met)

/** Why `Approve release` is unavailable, or null. Owner approval is separate from evaluation and needs the passed evaluation first. */
export function approveBlock(state: State): string | null {
  if (state.agent.releaseApproved) return 'The release is already approved.'
  const scenarios = gateChecks(state).find((check) => check.id === 'scenarios')
  if (scenarios && !scenarios.met) return `Release cannot be approved before the evaluation passes. ${scenarios.detail}`
  return refusal(state, { type: 'APPROVE_RELEASE' })
}

/** Why `Confirm scope` is unavailable, or null. Confirming the scope grants no job start and no Tier 3 approval. */
export function confirmScopeBlock(state: State): string | null {
  if (state.agent.scopeConfirmed) return 'The scope is already confirmed.'
  if (state.phase !== 'ST09') return 'The scope can be confirmed once the evaluation has passed.'
  return refusal(state, { type: 'CONFIRM_SCOPE' })
}

/**
 * Why `Deploy` is unavailable, or null: the first unmet gate condition. `Deploy` releases v1.0 to the job queue (SC21); it
 * starts nothing. Starting needs the separate start-job authority, the confirmed 11 invoices and the confirmed job scope there.
 */
export function deployBlock(state: State): string | null {
  if (phaseIndex(state.phase) >= phaseIndex('ST10')) return 'v1.0 is already deployed.'
  if (state.phase !== 'ST09') return 'v1.0 is deployed once the evaluation has passed.'
  const unmet = gateChecks(state).find((check) => !check.met && check.id !== 'authorization')
  return unmet ? unmet.detail : null
}
