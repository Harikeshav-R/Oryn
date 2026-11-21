import { TEAM } from './people'

/**
 * DAT-04 / DAT-06 agent draft and scope. The six generated sections, the five risk tiers and the six
 * autonomy stages are exact fixture strings. None of it is authority: a draft grants nothing, a tier
 * is a classification, and a stage is a level a release may later earn.
 */
export const AGENT_SECTIONS = [
  { title: 'Purpose', detail: 'Reconcile supplier invoices against purchase orders.' },
  { title: 'Inputs', detail: 'Selected invoice queue and purchase orders.' },
  { title: 'Actions', detail: 'Read, tag and stage within the approved scope.' },
  { title: 'Rules', detail: 'Apply approved variance and supplier handling rules.' },
  { title: 'Outputs', detail: 'Stage the result in the ERP.' },
  { title: 'Stopping points', detail: 'Escalate for approval or an unknown outcome.' },
] as const

/** The branch the draft cannot support yet: the variance exception rule is unverified until an authorized SME review. */
export const UNVERIFIED_BRANCH = Object.freeze({
  title: 'Unverified branch',
  detail: 'Variance exception rule: unverified until SME review.',
  note: 'Elena Ruiz can inspect the source; inspection does not grant authority.',
} as const)

export const RISK_TIERS = {
  0: { label: 'Informational', explanation: 'Read actions are Tier 0.' },
  1: { label: 'Low-risk reversible', explanation: 'Tag and stage actions may be Tier 1 or Tier 2.' },
  2: { label: 'Controlled reversible', explanation: 'Tag and stage actions may be Tier 1 or Tier 2.' },
  3: { label: 'Consequential', explanation: 'Posting and approving variance are Tier 3 actions. Each consequential action requires its own authorization.' },
  4: { label: 'Restricted', explanation: 'Tier 4 actions are prohibited from agent execution; approval does not make them eligible.' },
} as const
export type RiskTierLevel = keyof typeof RISK_TIERS

/** The chip text: `Tier 3 - Consequential`, `Tier 4 Restricted`. */
export const tierLabel = (tier: RiskTierLevel): string => `Tier ${tier} ${tier === 3 ? '- ' : ''}${RISK_TIERS[tier].label}`

/** What the draft may do, by action, with its tier. Scope describes boundaries only. */
export const ACTION_TIERS = [
  { action: 'read', tiers: 'Tier 0', level: 0 },
  { action: 'tag/stage', tiers: 'Tier 1/2', level: 1 },
  { action: 'post/approve variance', tiers: 'Tier 3', level: 3 },
] as const

/** Tier 4 is prohibited from agent execution: not a route that approval opens. */
export const RESTRICTED_NOTE = 'unavailable to agents'

export const AUTONOMY_STAGES = [
  { id: 0, label: 'Observe', description: 'Observe the workflow.' },
  { id: 1, label: 'Suggest', description: 'Suggest actions for a person.' },
  { id: 2, label: 'Guide', description: 'Guide a person through the workflow.' },
  { id: 3, label: 'Supervised Assist', description: 'Assist within scope with human supervision.' },
  { id: 4, label: 'Scoped Autopilot', description: 'Autopilot within an approved scope.' },
  { id: 5, label: 'Self-Maintaining Autopilot', description: 'Self-maintaining autopilot.' },
] as const
export type AutonomyStageId = (typeof AUTONOMY_STAGES)[number]['id']

/** The one stage this release asks for. Stages 4 and 5 stay locked: their gates are not established in this demonstration. */
export const SELECTED_STAGE: AutonomyStageId = 3
export const LOCKED_FROM: AutonomyStageId = 4

/** Scope of the draft (DAT-04): a team, a selected queue and three applications. */
export const SCOPE = Object.freeze({
  team: TEAM,
  queue: 'Selected invoice queue',
  applications: ['Gmail', 'NetSuite', 'Google Sheets'],
  action: 'Run Supervised',
  release: 'v1.0 · Stage 3 Supervised Assist',
} as const)
