import { JOB_ID, JOB_NAME } from '@/data/invoices'
import { APPROVER_AUTHORITY } from '@/data/approval'
import { APPROVAL_REQUIRED_LABEL, ROLES } from '@/data/labels'
import { ORGANIZATION, PEOPLE, TEAM, TIER3_REASON } from '@/data/people'
import { AGENT_DEFINITION } from '@/data/versions'
import { REPAIR } from '@/data/incident'
import type { AuthAction, AuthDecision, AuthGuard, AuthRequest, Grant, PolicyState, State, Tier } from './types'

/**
 * RT-02. Authority is a set of explicit grants, checked as: actor, delegation, action,
 * tier, object, scope and current policy. Selecting a viewpoint (SELECT_ACTOR) never
 * creates, widens or copies a grant, so this module has no dependency on the selection.
 */

/** Exact copy the surfaces render (RT-02 "Exact content"). */
export const COPY = Object.freeze({
  roles: ROLES,
  approverAuthority: APPROVER_AUTHORITY,
  tier3Required: APPROVAL_REQUIRED_LABEL,
  correctionIsEvidence: 'Correction is evidence, not new policy',
  resubmissionUnavailable: 'Resubmission unavailable',
} as const)

if (COPY.tier3Required !== TIER3_REASON) throw new Error('Tier 3 label and guard reason must be the same string')

export const AGENT_NAME = AGENT_DEFINITION.name
export const AGENT_V10_OBJECT = JOB_NAME
export const AGENT_V11_OBJECT = `${AGENT_NAME} v1.1`
export const KESTREL_SCOPE = 'Kestrel Components \u00b7 AP East'
export const AUDIT_PACK_OBJECT = 'audit-pack'
export const VARIANCE_THRESHOLD = '2.00%'

const marcusGrant = (action: AuthAction, maxTier: Tier, object: string, scope: string = TEAM): Grant => ({
  id: `grant-marcus-${action}`,
  holderId: 'marcus',
  action,
  maxTier,
  object,
  scope,
  status: 'valid',
})

/**
 * Demonstration authority table. Workflow publication, release, job start and action
 * approval are separate grants: holding one never implies another. Daniel's Tier 3
 * delegation covers one invoice, one scope and one threshold. Tomas (Admin) holds no
 * finance grant. Dana is external and holds nothing.
 */
export const DEFAULT_GRANTS: readonly Grant[] = Object.freeze([
  marcusGrant('publish-playbook', 1, 'PB-AP-RECON'),
  marcusGrant('create-agent', 1, AGENT_NAME),
  marcusGrant('run-simulation', 0, '*'),
  marcusGrant('approve-release', 2, AGENT_V10_OBJECT),
  marcusGrant('confirm-scope', 2, AGENT_V10_OBJECT),
  marcusGrant('start-job', 2, JOB_ID),
  marcusGrant('contain-incident', 1, 'INC-0042'),
  marcusGrant('validate-scope', 1, REPAIR.id),
  marcusGrant('propose-repair', 1, REPAIR.id),
  marcusGrant('authorize-limited-release', 2, AGENT_V11_OBJECT, KESTREL_SCOPE),
  marcusGrant('expand-and-close', 2, 'INC-0042'),
  marcusGrant('export-audit', 0, AUDIT_PACK_OBJECT),
  marcusGrant('restore-version', 2, AGENT_NAME),
  { id: 'grant-elena-complete-case-manually', holderId: 'elena', action: 'complete-case-manually', maxTier: 1, object: '*', scope: TEAM, status: 'valid' },
  { id: 'grant-elena-record-correction', holderId: 'elena', action: 'record-correction', maxTier: 0, object: '*', scope: TEAM, status: 'valid' },
  { id: 'grant-tomas-export-audit', holderId: 'tomas', action: 'export-audit', maxTier: 0, object: AUDIT_PACK_OBJECT, scope: ORGANIZATION, status: 'valid' },
  {
    id: 'delegation-daniel-tier3',
    holderId: 'daniel',
    action: 'approve-variance',
    maxTier: 3,
    object: 'INV-48219',
    scope: TEAM,
    status: 'valid',
    policyThreshold: VARIANCE_THRESHOLD,
  },
])

const ACTION_LABEL: Record<AuthAction, string> = {
  'publish-playbook': 'publish a playbook',
  'create-agent': 'create an agent',
  'run-simulation': 'run an evaluation',
  'approve-release': 'approve a release',
  'confirm-scope': 'confirm job scope',
  'start-job': 'start a job',
  'approve-variance': 'approve a variance',
  'contain-incident': 'contain an incident',
  'complete-case-manually': 'complete a case manually',
  'record-correction': 'record a correction',
  'validate-scope': 'validate a repair scope',
  'propose-repair': 'propose a repair',
  'authorize-limited-release': 'authorize a limited release',
  'expand-and-close': 'expand a release and close an incident',
  'export-audit': 'export an audit pack',
  'apply-discount': 'apply an invoice discount',
  'restore-version': 'restore a prior approved version',
}

/** A grant covers its own scope; an organization-wide grant also covers its teams. */
function scopeCovers(grantScope: string, requested: string): boolean {
  return grantScope === requested || (grantScope === ORGANIZATION && requested === TEAM)
}

type GrantFailure = { readonly rank: number; readonly guard: AuthGuard; readonly reason: string }

function checkGrant(grant: Grant, request: AuthRequest, policy: PolicyState): GrantFailure | null {
  const tier3 = request.tier === 3 ? `${TIER3_REASON}. ` : ''
  if (grant.status !== 'valid') return { rank: 1, guard: 'status', reason: `${tier3}The delegation has ${grant.status}.` }
  if (request.tier > grant.maxTier) {
    return { rank: 2, guard: 'tier', reason: `${tier3}The grant covers up to Tier ${grant.maxTier}; this action is Tier ${request.tier}.` }
  }
  if (grant.object !== '*' && grant.object !== request.object) {
    return { rank: 3, guard: 'object', reason: `${tier3}The delegation covers ${grant.object}, not ${request.object}.` }
  }
  if (!scopeCovers(grant.scope, request.scope)) {
    return { rank: 4, guard: 'scope', reason: `${tier3}The delegation covers ${grant.scope}, not ${request.scope}.` }
  }
  if (grant.policyThreshold !== undefined && grant.policyThreshold !== policy.threshold) {
    return {
      rank: 5,
      guard: 'policy',
      reason: `${tier3}The delegation was issued under a ${grant.policyThreshold} threshold; current policy is ${policy.threshold}.`,
    }
  }
  return null
}

/**
 * Evaluate actor, delegation, action, tier, object, scope and current policy. Returns the
 * first guard that fails for the closest-matching grant, with the exact reason.
 */
export function authorize(state: Pick<State, 'authority' | 'policy'>, request: AuthRequest): AuthDecision {
  const person = PEOPLE.find((candidate) => candidate.id === request.actorId)
  if (!person) return { allowed: false, guard: 'actor', reason: `Unknown actor ${request.actorId}.` }
  if (person.role === null) {
    return {
      allowed: false,
      guard: 'external',
      reason: `${person.name} is an external supplier representative and holds no internal authority.`,
    }
  }
  const own = state.authority.grants.filter((grant) => grant.holderId === request.actorId && grant.action === request.action)
  if (own.length === 0) {
    const tier3 = request.tier === 3 ? `${TIER3_REASON}. ` : ''
    const finance = request.action === 'approve-variance' ? ' holds no finance approval grant.' : ` holds no grant to ${ACTION_LABEL[request.action]}.`
    return {
      allowed: false,
      guard: 'grant',
      reason: `${tier3}${person.name} (${person.role})${finance} Selecting a role does not grant authority.`,
    }
  }
  let closest: GrantFailure | null = null
  for (const grant of own) {
    const failure = checkGrant(grant, request, state.policy)
    if (failure === null) return { allowed: true, grantId: grant.id }
    if (closest === null || failure.rank > closest.rank) closest = failure
  }
  // `own` is non-empty and every grant failed, so a failure exists.
  const failure = closest as GrantFailure
  return { allowed: false, guard: failure.guard, reason: failure.reason }
}

/**
 * Exact integer-cent comparison: variance exceeds the threshold when
 * |invoice - po| * 10000 > thresholdHundredths * po. Equality is NOT over the threshold
 * (2.00% exactly auto-accepts). No floating point is involved.
 */
export function exceedsThreshold(invoiceCents: number, poCents: number, thresholdHundredths: number): boolean {
  if (!Number.isInteger(invoiceCents) || !Number.isInteger(poCents) || !Number.isInteger(thresholdHundredths)) {
    throw new Error('Threshold comparison requires integer cents and integer hundredths of a percent')
  }
  if (poCents <= 0) throw new Error('Threshold comparison requires a known, positive PO amount')
  return Math.abs(invoiceCents - poCents) * 10_000 > thresholdHundredths * poCents
}

/**
 * The comparator agent v0.1 shipped with, kept as the executable record of its defect (DAT-05 SCN-022): it treated a
 * variance AT the threshold as over it (`>=`), so exactly 2.00% escalated. It is never used for a decision; v0.2 and
 * every later version use `exceedsThreshold`.
 */
export function exceedsThresholdV01(invoiceCents: number, poCents: number, thresholdHundredths: number): boolean {
  if (!Number.isInteger(invoiceCents) || !Number.isInteger(poCents) || !Number.isInteger(thresholdHundredths)) {
    throw new Error('Threshold comparison requires integer cents and integer hundredths of a percent')
  }
  if (poCents <= 0) throw new Error('Threshold comparison requires a known, positive PO amount')
  return Math.abs(invoiceCents - poCents) * 10_000 >= thresholdHundredths * poCents
}

/** `2.00%` to 200. Only the fixture format is accepted. */
export function thresholdHundredths(threshold: string): number {
  const match = /^(\d+)\.(\d{2})%$/.exec(threshold)
  if (!match) throw new Error(`Unsupported threshold format ${threshold}`)
  return Number(match[1]) * 100 + Number(match[2])
}
