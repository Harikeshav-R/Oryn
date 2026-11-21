import { DEMONSTRATIONS } from '@/data/demonstrations'
import type { Demonstration } from '@/data/demonstrations'
import { PLAYBOOK } from '@/data/playbook'
import { person, transition } from '@/state'
import type { Action, DemonstrationId, State } from '@/state'
import { roleOf } from './destinations'

/**
 * View decisions shared by SC13, SC14 and SC15. Access here only decides what a viewpoint sees: it
 * grants nothing (RT-02). Every refusal text comes from the reducer's own guard (`refusal`), so a
 * disabled control and the rejected action explain themselves in the same words.
 */

export type Access = { readonly ok: true } | { readonly ok: false; readonly reason: string }
const OPEN: Access = { ok: true }

const CONTRIBUTORS: readonly string[] = DEMONSTRATIONS.map((demo) => demo.contributorId)

/** Workflow Discovery and the candidate review: the Workflow Owner and the contributors to the candidate. */
export function discoveryAccess(state: State): Access {
  if (roleOf(state) === 'Workflow Owner' || CONTRIBUTORS.includes(state.actorId)) return OPEN
  return { ok: false, reason: 'Workflow Discovery is limited to the Workflow Owner and the people who contributed a Demonstration.' }
}

/** Playbooks are managed by the Workflow Owner. */
export function playbookAccess(state: State): Access {
  return roleOf(state) === 'Workflow Owner' ? OPEN : { ok: false, reason: `Playbooks are managed by the Workflow Owner, ${person(PLAYBOOK.ownerId).name}.` }
}

/** The reason the reducer would refuse `action` for this state, or null when it would accept it. */
export function refusal(state: State, action: Action): string | null {
  const result = transition(state, action)
  return result.ok ? null : result.rejection.reason
}

export const isApproved = (state: State, id: DemonstrationId): boolean => state.demonstrations[id] === 'approved'

export const contributorName = (demo: Demonstration): string => person(demo.contributorId).name

/** The current person's own Demonstrations that still await their approval. */
export const ownPending = (state: State): readonly Demonstration[] => DEMONSTRATIONS.filter((demo) => demo.contributorId === state.actorId && !isApproved(state, demo.id))

export type CandidateStage = 'needs-review' | 'published'
export const candidateStage = (state: State): CandidateStage => (state.playbookPublished ? 'published' : 'needs-review')

/** Why `Approve contribution` is unavailable, or null when it may be used. */
export function approveBlock(state: State): string | null {
  const [first] = ownPending(state)
  if (first) return refusal(state, { type: 'APPROVE_DEMONSTRATION', demoId: first.id })
  if (CONTRIBUTORS.includes(state.actorId)) return 'Your contributions are already approved.'
  return `Only a contributor approves their own contribution. Current person is ${person(state.actorId).name}.`
}

/** Why `Request owner review` is unavailable, or null when it may be used. */
export function requestBlock(state: State): string | null {
  if (state.playbookPublished) return 'The playbook is already published for guidance.'
  return refusal(state, { type: 'REQUEST_OWNER_REVIEW' })
}

/** Why `Publish` is unavailable, or null when the reducer would accept it. */
export function publishBlock(state: State): string | null {
  return state.playbookPublished ? 'Already published for guidance.' : refusal(state, { type: 'PUBLISH' })
}
