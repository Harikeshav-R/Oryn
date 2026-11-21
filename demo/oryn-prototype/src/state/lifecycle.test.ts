import { describe, expect, test } from 'bun:test'
import {
  CANONICAL_SCRIPT,
  SCREEN_MIN_PHASE,
  STATES,
  TRANSITIONS,
  auditSlice,
  createInitialState,
  isRunning,
  jobCounts,
  jobLabel,
  openDeepLink,
  reconstruct,
  reduce,
  replay,
  replayStrict,
  scriptTo,
  transition,
  type Action,
  type ScreenId,
  type State,
  type StateId,
  STATE_IDS,
} from '@/state'
import type { PersonId } from '@/data/people'
import { RULES } from '@/state/rules'
import { act, deepFreeze, expectRejected } from '@/state/test-helpers'

/** Every state of the canonical run, after each accepted action, starting from the initial snapshot. */
function trace(): State[] {
  const states = [createInitialState()]
  for (const action of CANONICAL_SCRIPT) states.push(act(states[states.length - 1] as State, action))
  return states
}

describe('RT-01 lifecycle graph', () => {
  test('ST01 to ST24 each have a name, entry action and exit action', () => {
    expect(STATE_IDS).toHaveLength(24)
    for (const id of STATE_IDS) {
      const def = STATES[id]
      expect(def.name.length).toBeGreaterThan(0)
      expect(def.entry.length).toBeGreaterThan(0)
      expect(RULES[def.exit].from).toContain(id)
    }
    expect(STATES.ST01.entry).toEqual(['INIT', 'RESET'])
    expect(STATES.ST07.entry).toEqual(['RUN_SIMULATION', 'FIX_AND_RUN'])
  })

  test('the replayed run records entry and exit of every state, in order', () => {
    const final = replayStrict(CANONICAL_SCRIPT)
    expect(final.phase).toBe('ST24')
    expect(final.history.map((record) => record.phase)).toEqual([
      'ST01', 'ST02', 'ST03', 'ST04', 'ST05', 'ST06', 'ST07', 'ST08', 'ST07', 'ST09', 'ST10', 'ST11', 'ST12', 'ST13',
      'ST14', 'ST15', 'ST16', 'ST17', 'ST18', 'ST19', 'ST20', 'ST21', 'ST22', 'ST23', 'ST24',
    ])
    final.history.forEach((record, index) => {
      expect(STATES[record.phase].entry).toContain(record.enteredBy)
      const next = final.history[index + 1]
      if (next) {
        expect(record.exitedBy).toBe(STATES[record.phase].exit)
        expect(next.enteredBy).toBe(record.exitedBy as Action['type'])
        expect(record.exitedAtStep).toBe(next.enteredAtStep)
        const edge = TRANSITIONS.find((candidate) => candidate.from === record.phase && candidate.action === record.exitedBy)
        expect(edge?.to).toContain(next.phase)
      } else {
        expect(record.exitedBy).toBeNull()
      }
    })
  })

  test('every lifecycle action is rejected outside its own state and leaves the state intact', () => {
    const exits = [...new Set(TRANSITIONS.map((edge) => edge.action))]
    for (const phase of STATE_IDS) {
      const state = reconstruct(phase)
      for (const type of exits) {
        if (RULES[type].from.includes(phase)) continue
        const rejection = expectRejected(state, { type } as Action, 'phase')
        expect(rejection.reason).toContain(`${type} is not available in ${phase}`)
      }
    }
  })

  test('an unknown action is rejected, never treated as a no-op transition', () => {
    const state = createInitialState()
    expectRejected(state, { type: 'RESUBMIT' } as unknown as Action, 'action')
    expectRejected(state, { type: 'toString' } as unknown as Action, 'action')
    expect(Object.keys(RULES).filter((type) => /RETRY|RESUBMIT/.test(type))).toEqual([])
  })

  test('RESET only applies at ST24 and restores the initial snapshot', () => {
    expectRejected(reconstruct('ST05'), { type: 'RESET' }, 'phase')
    expect(reduce(replayStrict(CANONICAL_SCRIPT), { type: 'RESET' })).toEqual(createInitialState())
  })
})

describe('RT-01 invariants over every step of the run', () => {
  const states = trace()

  test('counts stay consistent: four outcomes plus queued always sum to eleven or zero', () => {
    for (const state of states) {
      const counts = jobCounts(state)
      expect(counts.verified + counts.escalated + counts.approval + counts.unknown + counts.queued).toBe(counts.total)
      expect([0, 11]).toContain(counts.total)
    }
  })

  test('execution flags track the runs, so cyan appears only while something executes', () => {
    for (const state of states) {
      const last = state.evaluations[state.evaluations.length - 1]
      const simulating = last?.suiteId === 'SIM-AP-RECON' && last.status === 'running'
      const regressing = last?.suiteId === 'SIM-AP-RECON-34' && last.status === 'running'
      expect(state.running.simulation).toBe(simulating)
      expect(state.running.regression).toBe(regressing)
      expect(state.running.job).toBe(state.job.status === 'running')
      expect(isRunning(state)).toBe(simulating || regressing || state.job.status === 'running')
    }
    expect(states.some((state) => state.running.simulation)).toBe(true)
    expect(states.some((state) => state.running.job)).toBe(true)
    expect(states.some((state) => state.running.regression)).toBe(true)
    expect(isRunning(states[states.length - 1] as State)).toBe(false)
  })

  test('audit history is ordered, immutable and only grows', () => {
    states.forEach((state, index) => {
      const ids = state.audit
      expect(ids).toEqual([...ids].sort())
      const previous = states[index - 1]
      if (previous) expect(ids.slice(0, previous.audit.length)).toEqual([...previous.audit])
    })
    expect(replayStrict(CANONICAL_SCRIPT).audit).toHaveLength(15)
  })

  test('theme is dark only from the containment (ST12) to ST14', () => {
    for (const state of states) {
      const incidentContext = ['ST12', 'ST13', 'ST14'].includes(state.phase) && state.incident.status === 'contained'
      expect(state.theme).toBe(incidentContext ? 'dark' : 'light')
    }
  })

  test('the unknown case stays held from its first outcome to the last state', () => {
    const evaluated = states.filter((state) => state.job.outcomes['INV-48220'] !== undefined && state.job.outcomes['INV-48220'] !== 'queued')
    expect(evaluated.length).toBeGreaterThan(0)
    for (const state of evaluated) expect(state.job.outcomes['INV-48220']).toBe('unknown')
  })

  test('reducing never mutates: the whole run works on deeply frozen states', () => {
    let state = deepFreeze(createInitialState())
    for (const action of CANONICAL_SCRIPT) state = deepFreeze(act(state, action))
    expect(state.phase).toBe('ST24')
    expectRejected(deepFreeze(createInitialState()), { type: 'CONSENT' }, 'notice')
  })
})

describe('seeking', () => {
  const forward = trace()

  test('seeking backward restores the exact earlier state, history and audit', () => {
    for (let count = CANONICAL_SCRIPT.length; count >= 0; count -= 1) {
      expect(replay(CANONICAL_SCRIPT, { count })).toEqual(forward[count] as State)
    }
  })

  test('arbitrary forward and backward jumps agree', () => {
    for (const count of [40, 3, 52, 0, 27, 64, 11, 33, 12]) {
      expect(replay(CANONICAL_SCRIPT, { count })).toEqual(forward[count] as State)
    }
  })

  test('a prefix never shows later audit events or later history', () => {
    const atJobStart = reconstruct('ST10')
    expect(auditSlice(atJobStart).map((event) => event.id)).toEqual(['A01', 'A02', 'A03', 'A04', 'A05'])
    expect(atJobStart.history[atJobStart.history.length - 1]?.phase).toBe('ST10')
    expect(reconstruct('ST11').audit).toHaveLength(5)
  })
})

describe('montage and routes', () => {
  test('navigating to an earlier view changes the route only and rewrites no outcome', () => {
    const end = replayStrict(CANONICAL_SCRIPT)
    for (const screen of ['SC22', 'SC16', 'SC23', 'SC02'] as const) {
      const moved = act(end, { type: 'OPEN_SCREEN', screen })
      expect(moved.route).toBe(screen)
      expect({ ...moved, route: end.route, step: end.step }).toEqual(end)
    }
  })

  test('a route never implies execution: opening the job screen does not start the job', () => {
    const early = reconstruct('ST09')
    expectRejected(early, { type: 'OPEN_SCREEN', screen: 'SC22' }, 'route')
    const link = openDeepLink({ screen: 'SC22' })
    expect(link.ok && link.state.phase).toBe('ST10')
    const opened = link.ok ? link.state : null
    expect(opened?.route).toBe('SC22')
    // Prerequisites were replayed, not skipped: release was approved and the job was started by a guarded action.
    expect(opened?.audit).toEqual(['A01', 'A02', 'A03', 'A04', 'A05'])
    expect(jobLabel(opened as State)).toBe('Queued')
  })

  test('a deep link reconstructs prerequisites for every state and never bypasses a guard', () => {
    for (const id of STATE_IDS) {
      const result = openDeepLink({ state: id })
      expect(result.ok).toBe(true)
      expect(result.ok && result.state.phase).toBe(id)
      expect(replayStrict(scriptTo(id)).phase).toBe(id)
    }
  })

  test('deep-link ids and combinations are validated', () => {
    expect(openDeepLink({ screen: 'SC99' }).ok).toBe(false)
    expect(openDeepLink({ state: 'ST99' }).ok).toBe(false)
    const mismatch = openDeepLink({ screen: 'SC28', state: 'ST05' })
    expect(mismatch.ok).toBe(false)
    expect(SCREEN_MIN_PHASE.SC28).toBe('ST13')
  })

  test('a screen that carries the control for the next state is reachable one state earlier', () => {
    const cases: [ScreenId, StateId, StateId][] = [
      ['SC15', 'ST04', 'ST03'],
      ['SC17', 'ST05', 'ST04'],
      ['SC19', 'ST06', 'ST05'],
      ['SC21', 'ST09', 'ST08'],
      ['SC27', 'ST12', 'ST11'],
      ['SC28', 'ST13', 'ST12'],
    ]
    for (const [screen, reachable, tooEarly] of cases) {
      expect(act(reconstruct(reachable), { type: 'OPEN_SCREEN', screen }).route).toBe(screen)
      expectRejected(reconstruct(tooEarly), { type: 'OPEN_SCREEN', screen }, 'route')
    }
    // Opening the screen that holds the Run button does not run anything.
    expect(act(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC19' }).evaluations).toEqual([])
  })

  test('an unknown person id is rejected, not thrown', () => {
    expectRejected(createInitialState(), { type: 'SELECT_ACTOR', personId: 'nobody' as PersonId }, 'target')
  })

  test('selection and theme actions never touch business state', () => {
    const state = reconstruct('ST10')
    const next = act(state, { type: 'SELECT_CASE', caseId: 'INV-48219' }, { type: 'SELECT_SCENARIO', scenarioId: 'SCN-022' }, { type: 'SET_THEME', theme: 'dark' })
    expect(next.selectedCase).toBe('INV-48219')
    expect(next.selectedScenario).toBe('SCN-022')
    expect(jobCounts(next)).toEqual(jobCounts(state))
    expect(next.phase).toBe('ST10')
    expectRejected(state, { type: 'SELECT_CASE', caseId: 'INV-99999' }, 'target')
    expectRejected(state, { type: 'SELECT_SCENARIO', scenarioId: 'SCN-099' }, 'target')
  })

  test('rejected actions do not advance the step and a later accepted one clears the reason', () => {
    const state = createInitialState()
    const rejected = transition(state, { type: 'CONSENT' })
    expect(rejected.state.step).toBe(0)
    expect(rejected.state.rejection?.guard).toBe('notice')
    const accepted = reduce(rejected.state, { type: 'ACKNOWLEDGE_NOTICE' })
    expect(accepted.rejection).toBeNull()
    expect(accepted.step).toBe(1)
  })
})
