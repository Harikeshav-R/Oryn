import { useEffect, useState } from 'react'
import { REGRESSION_PASS_RESULTS, REGRESSION_SUITE_ID } from '@/data/regression'
import type { Action, State } from '@/state'

/** Clickable-app clock; films derive the same frame from their action timeline. */
export function useRegressionClock(state: State, dispatch: (action: Action) => void): number {
  const [clock, setClock] = useState({ run: '', frame: 0 })
  const run = state.evaluations.at(-1)
  const runId = run?.id ?? ''
  const running = state.running.regression && run?.suiteId === REGRESSION_SUITE_ID
  const frames = state.ui.simulator.runFrames
  useEffect(() => {
    if (!running) return undefined
    const started = performance.now()
    const timer = window.setInterval(() => {
      const frame = Math.floor((performance.now() - started) * 30 / 1000)
      if (frame >= frames) {
        window.clearInterval(timer)
        dispatch({ type: 'COMPLETE_REGRESSION', results: REGRESSION_PASS_RESULTS })
      } else setClock({ run: runId, frame })
    }, 33)
    return () => window.clearInterval(timer)
  }, [running, runId, frames, dispatch])
  return clock.run === runId ? clock.frame : 0
}
