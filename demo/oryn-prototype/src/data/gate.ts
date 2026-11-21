import { DEMONSTRATIONS } from './demonstrations'

/**
 * DAT-03 release-gate provenance. The five examples are three observed this week and two
 * SME-verified archived cases. No archived case identity is invented.
 */
export const GATE = { observed: DEMONSTRATIONS.length, archivedSmeVerified: 2, required: 5 } as const

export const GATE_TOTAL = GATE.observed + GATE.archivedSmeVerified

export const GATE_PROVENANCE = `${GATE.observed} observed this week + ${GATE.archivedSmeVerified} SME-verified archived cases`
export const GATE_SUMMARY = `${GATE_TOTAL}/${GATE.required} verified human examples`

/** Requirement against suite coverage: at least 25 correct scenarios of which at least 5 edge/negative; the suite holds 28 including 6. These are requirements, not proof of completion. */
export const GATE_SCENARIOS_LABEL = '28/25 representative scenarios'
export const GATE_EDGE_LABEL = '6/5 edge/negative'
export const GATE_OWNER_LABEL = 'Owner approval'

