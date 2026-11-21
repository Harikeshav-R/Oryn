import { SCENARIOS } from '@/data/simulation'

export type RegressionVerdict = 'passed' | 'safeEscalation' | 'failed'
export interface RegressionResult { readonly id: string; readonly verdict: RegressionVerdict }

export const REGRESSION_SUITE_ID = 'SIM-AP-RECON-34'
export const REGRESSION_CASES = Object.freeze([
  Object.freeze({ id: 'SCN-029', description: 'Kestrel layout v2, $4,175 subtotal + $38.50 handling = $4,213.50, PO terms cover fee' } as const),
  Object.freeze({ id: 'SCN-030', description: 'Kestrel layout v2, same handling line after subtotal with different spacing' } as const),
  Object.freeze({ id: 'SCN-031', description: 'Kestrel layout v2, handling line before total, permitted terms' } as const),
  Object.freeze({ id: 'SCN-032', description: 'Kestrel layout v2, zero handling amount under permitted terms' } as const),
  Object.freeze({ id: 'SCN-033', description: 'Kestrel layout v2, handling label capitalization differs, permitted terms' } as const),
  Object.freeze({ id: 'SCN-034', description: 'Kestrel layout v2, approved handling line with an additional separating rule above the total' } as const),
] as const)

/** The expected results for a completed v1.1 run, including the unchanged base suite. */
export const REGRESSION_PASS_RESULTS: readonly RegressionResult[] = Object.freeze([
  ...SCENARIOS.map((scenario) => Object.freeze({ id: scenario.id, verdict: scenario.v02 })),
  ...REGRESSION_CASES.map(({ id }) => Object.freeze({ id, verdict: 'passed' as const })),
])
