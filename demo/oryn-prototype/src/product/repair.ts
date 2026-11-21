import { REGRESSION_SUITE_ID } from '@/data/regression'
import { REGRESSION_SIZE, runSummary } from '@/state'
import type { State } from '@/state'
import type { ProductProps } from './contract'
import type { Access } from './discovery'
import { roleOf } from './destinations'

export function repairAccess(state: State): Access {
  const role = roleOf(state)
  return role === 'Workflow Owner' || role === 'Approver' ? { ok: true } : { ok: false, reason: 'Repair review is available to the Workflow Owner and Approver.' }
}

export function regressionView(props: ProductProps) {
  const { state, film } = props
  const run = [...state.evaluations].reverse().find((entry) => entry.suiteId === REGRESSION_SUITE_ID)
  const start = film?.lastApplied('RUN_REGRESSION') ?? 0
  const end = run?.status === 'cancelled' ? (film?.lastApplied('CANCEL_REGRESSION') ?? film?.frame ?? 0) : (film?.frame ?? 0)
  const elapsed = film ? Math.max(0, end - start) : (props.runFrame ?? 0)
  const position = Math.min(REGRESSION_SIZE - 0.001, Math.max(0, (elapsed + state.ui.simulator.runLead) * REGRESSION_SIZE / state.ui.simulator.runFrames))
  const executed = run?.status === 'complete' ? REGRESSION_SIZE : run ? Math.floor(position) : 0
  const summary = run?.status === 'complete' ? runSummary(run) : { passed: 0, safeEscalation: 0, failed: 0, notRun: REGRESSION_SIZE }
  return { run, position, executed, summary }
}
