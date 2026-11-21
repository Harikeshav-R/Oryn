import { useEffect } from 'react'
import type { Action, State } from '@/state'

/** Clickable app only: film timelines supply their own readback actions. */
export function useCohortClock(state: State, dispatch: (action: Action) => void): void {
  const index = state.phase === 'ST15' && state.release.stage === 'limited' && state.release.stoppedBy === null
    ? state.release.cohort.findIndex((outcome) => outcome === 'pending')
    : -1
  useEffect(() => {
    if (index < 0) return undefined
    const timer = window.setTimeout(() => dispatch({ type: 'VERIFY_COHORT_OUTCOME', index, result: 'verified' }), 1000)
    return () => window.clearTimeout(timer)
  }, [index, dispatch])
}
