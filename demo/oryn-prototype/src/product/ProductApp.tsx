import { useEffect, useReducer, useRef, useState } from 'react'
import { ProductRoot } from '@/app/ProductRoot'
import type { Mode } from '@/app/params'
import { isScreenId, isStateId, openDeepLink, reduce, createInitialState } from '@/state'
import type { Action, State } from '@/state'
import { PEOPLE } from '@/data/people'
import { INVOICE_CASES } from '@/data/invoices'
import { roleOf } from './destinations'
import { ProductScreen } from './ProductScreen'
import { useCohortClock } from './use-cohort-clock'
import { useRegressionClock } from './use-regression-clock'

/**
 * The clickable product (`/?view=product`). It owns exactly one thing: the reducer. Every screen
 * renders from that state and dispatches the same actions the film replays.
 *
 * Deep link: `?screen=SC12&state=ST02&actor=marcus&theme=dark&actions=[...]`. A link reconstructs its
 * prerequisites through the reducer's own guards; an unsupported combination is shown, not rendered.
 */
interface Start {
  readonly state: State
  readonly error: string | null
}

/** `?actions=[{"type":"OPEN_MESSAGE","record":"INV-48231"}]`: ordered reducer actions applied after the link, guards included. */
function parseActions(raw: string): { readonly actions: readonly Action[]; readonly error: string | null } {
  try {
    const data: unknown = JSON.parse(raw)
    const valid = Array.isArray(data) && data.every((item: unknown) => typeof item === 'object' && item !== null && 'type' in item && typeof item.type === 'string')
    return valid ? { actions: data as Action[], error: null } : { actions: [], error: 'actions must be a JSON array of {type, ...} objects.' }
  } catch {
    return { actions: [], error: 'actions is not valid JSON.' }
  }
}

function startFrom(search: string): Start {
  const query = new URLSearchParams(search)
  const screen = query.get('screen')
  const phase = query.get('state')
  const link = openDeepLink({ screen: screen !== null && isScreenId(screen) ? screen : undefined, state: phase !== null && isStateId(phase) ? phase : undefined })
  const rawActions = query.get('actions')
  const scripted = rawActions === null ? { actions: [], error: null } : parseActions(rawActions)
  const error = (screen !== null && !isScreenId(screen) ? `${screen} is not a screen.` : null) ?? (phase !== null && !isStateId(phase) ? `${phase} is not a state.` : null) ?? (link.ok ? null : link.reason) ?? scripted.error
  let state = link.ok ? link.state : createInitialState()
  const actor = PEOPLE.find((person) => person.id === query.get('actor'))
  if (actor) state = reduce(state, { type: 'SELECT_ACTOR', personId: actor.id as Extract<Action, { type: 'SELECT_ACTOR' }>['personId'] })
  if (query.get('theme') === 'dark') state = reduce(state, { type: 'SET_THEME', theme: 'dark' })
  state = scripted.actions.reduce(reduce, state)
  return { state, error }
}

export function ProductApp({ search, mode }: { search: string; mode: Mode }) {
  const [start] = useState(() => startFrom(search))
  const [state, dispatch] = useReducer(reduce, start.state)
  // The clickable app's own clocks for the regression run (SC28) and the independent cohort readbacks (SC29). A film replays the same actions from its timeline.
  const regressionFrame = useRegressionClock(state, dispatch)
  useCohortClock(state, dispatch)
  const previousOverlay = useRef(state.ui.overlay)
  const [clock, setClock] = useState({ run: '', frame: 0 })
  const latestRun = state.evaluations.at(-1)
  const runId = latestRun?.id ?? ''
  const simulating = state.running.simulation && latestRun?.suiteId === 'SIM-AP-RECON'
  const runFrames = state.ui.simulator.runFrames

  // The clickable app's own clock for a running evaluation: 30 ticks a second from the run's start, then the run completes.
  // It lives here, never in a screen or in a film: the film derives the same count from its frame. A cancelled run keeps its frozen frame.
  useEffect(() => {
    if (!simulating) return undefined
    const started = performance.now()
    const timer = window.setInterval(() => {
      const frames = Math.floor(((performance.now() - started) / 1000) * 30)
      if (frames >= runFrames) {
        window.clearInterval(timer)
        dispatch({ type: 'COMPLETE_SIMULATION' })
      } else setClock({ run: runId, frame: frames })
    }, 33)
    return () => window.clearInterval(timer)
  }, [simulating, runId, runFrames])

  // The clickable app's own job clock. A film replays the same EVALUATE_CASE and PAUSE_FOR_APPROVAL actions from its timeline.
  // Cases are evaluated one at a time in table order, then the job stops for the approval it cannot decide itself; a viewer on the
  // job queue or table stays on the table instead of being moved to the approval drawer the lifecycle opens.
  const watching = state.route === 'SC21' || state.route === 'SC22'
  const nextQueued = state.phase === 'ST10' && state.running.job ? INVOICE_CASES.find((row) => state.job.outcomes[row.invoice] === 'queued') : undefined
  const jobRunning = state.phase === 'ST10' && state.running.job
  useEffect(() => {
    if (!jobRunning) return undefined
    const timer = window.setTimeout(() => {
      if (nextQueued) dispatch({ type: 'EVALUATE_CASE', invoice: nextQueued.invoice })
      else {
        // The table viewer stays on the table.
        dispatch({ type: 'PAUSE_FOR_APPROVAL' })
        if (watching) dispatch({ type: 'OPEN_SCREEN', screen: 'SC22' })
      }
    }, nextQueued ? 450 : 900)
    return () => window.clearTimeout(timer)
  }, [jobRunning, nextQueued, watching])

  // The independent ERP readback that follows an approval is its own event: it lands later, and only then does the verified count move.
  const readbackPending = state.phase === 'ST11' && state.approval.decision === 'approved' && state.readback.status === 'pending'
  useEffect(() => {
    if (!readbackPending) return undefined
    const timer = window.setTimeout(() => dispatch({ type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' }), 1500)
    return () => window.clearTimeout(timer)
  }, [readbackPending])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k' && roleOf(state) !== null) {
        event.preventDefault()
        dispatch({ type: 'SET_OVERLAY', overlay: 'search' })
      } else if (event.key === 'Escape') {
        if (state.ui.deleteDialog === 'confirm') dispatch({ type: 'CANCEL_DELETE' })
        else if (state.ui.overlay !== null) dispatch({ type: 'SET_OVERLAY', overlay: null })
        else return
        event.preventDefault()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [state])

  // Escape or a choice closes the palette or menu; focus goes back to the control that opened it.
  useEffect(() => {
    const closed = previousOverlay.current
    previousOverlay.current = state.ui.overlay
    if (closed !== null && state.ui.overlay === null) {
      const target = closed === 'search' ? 'search' : closed === 'role' ? 'role-selector' : 'tray-icon'
      document.querySelector<HTMLElement>(`[data-film-anchor="${target}"]`)?.focus()
    }
  }, [state.ui.overlay])

  return (
    <ProductRoot theme={state.theme} mode={mode}>
      {start.error !== null && (
        <p role="alert" className="p-4 type-data">
          {start.error}
        </p>
      )}
      <div style={{ width: 1280, height: 720 }}>
        <ProductScreen state={state} dispatch={dispatch} runFrame={latestRun?.suiteId === 'SIM-AP-RECON-34' ? regressionFrame : clock.run === runId ? clock.frame : 0} />
      </div>
    </ProductRoot>
  )
}
