import { DEMONSTRATIONS } from './demonstrations'
import { TEAM } from './people'

/** Suggested workflow and published guidance are distinct states, not authorization. */
export const CANDIDATE = {
  title: 'Match supplier invoice to purchase order and stage result in ERP',
  status: 'Needs Review',
  uncertainty: 'variance exception rule: unverified until SME review',
  demonstrationIds: DEMONSTRATIONS.map((example) => example.id),
} as const

export const PLAYBOOK = {
  id: 'PB-AP-RECON',
  title: 'Supplier invoice vs purchase order reconciliation',
  version: '1.0',
  status: 'Approved for Guidance',
  ownerId: 'marcus',
} as const

export const PLAYBOOK_STEPS = [
  { id: 'AP-STEP-01', title: 'Receive invoice and identify supplier' },
  { id: 'AP-STEP-02', title: 'Locate purchase order and verify identity' },
  { id: 'AP-STEP-03', title: 'Interpret invoice totals' },
  { id: 'AP-STEP-04', title: 'Compare totals against approved variance rule' },
  { id: 'AP-STEP-05', title: 'Stage ERP result or escalate' },
  { id: 'AP-STEP-06', title: 'Verify authoritative business outcome' },
] as const

export const PLAYBOOK_RULES = [
  {
    id: 'AP-RULE-009',
    title: 'Variance threshold',
    ownerId: 'daniel',
    description: 'variance > 2.00% of PO requires Tier 3 approval; <= 2.00% auto-accepts within match',
  },
  {
    id: 'AP-RULE-017',
    title: 'Supplier handling fees',
    ownerId: 'daniel',
    description: 'Use approved supplier terms; interpretation alone does not change policy',
  },
] as const

export const PLAYBOOK_EXCEPTIONS = [
  'Missing Purchase Order',
  'Duplicate invoice',
  'Approval Required',
  'Outcome Unknown',
  'Unreadable PDF',
] as const

/** Scope describes boundaries only; it does not grant permission. */
export const PLAYBOOK_SCOPE = {
  team: TEAM,
  queue: 'selected invoice queue',
  applications: ['Gmail', 'NetSuite', 'Google Sheets'],
  actions: [
    { action: 'read', tier: 0 },
    { action: 'tag/stage', tiers: [1, 2] },
    { action: 'post/approve variance', tier: 3 },
  ],
} as const
