import { describe, expect, test } from 'bun:test'
import { SCENARIOS, SUITE_SIZE, executedAfter, positionAfter } from '@/data/simulation'
import { gateChecks, latestRun, reconstruct, runSummary, suiteVerdicts } from './index'
import { act, expectRejected } from './test-helpers'
import type { Action, State } from './types'

const SET = (patch: Omit<Extract<Action, { type: 'SET_SIMULATOR' }>, 'type'>): Action => ({ type: 'SET_SIMULATOR', ...patch })
const business = (state: State) => ({ phase: state.phase, route: state.route, evaluations: state.evaluations, agent: state.agent, audit: state.audit, running: state.running })

const st08 = (): State => reconstruct('ST08')
const st09 = (): State => reconstruct('ST09')

describe('SET_SIMULATOR', () => {
  test('accepts each field alone and together, writing only the simulator slice', () => {
    const start = reconstruct('ST06')
    const base = start.ui.simulator

    const view = act(start, SET({ view: 'stream' }))
    expect(view.ui.simulator).toEqual({ ...base, view: 'stream' })

    const label = act(start, SET({ runLabel: 'Run Evaluation' }))
    expect(label.ui.simulator).toEqual({ ...base, runLabel: 'Run Evaluation' })

    const frames = act(start, SET({ runFrames: 48 }))
    expect(frames.ui.simulator).toEqual({ ...base, runFrames: 48 })

    const lead = act(start, SET({ runLead: 18 }))
    expect(lead.ui.simulator).toEqual({ ...base, runLead: 18 })

    const all = act(start, SET({ view: 'stream', runLabel: 'Run Evaluation', runFrames: 300, runLead: 300 }))
    expect(all.ui.simulator).toEqual({ ...base, view: 'stream', runLabel: 'Run Evaluation', runFrames: 300, runLead: 300 })

    for (const next of [view, label, frames, lead, all]) expect(business(next)).toEqual(business(start))
  })

  test('accepts the inclusive bounds runFrames 1 and runLead 0', () => {
    const next = act(reconstruct('ST06'), SET({ runFrames: 1, runLead: 0 }))
    expect(next.ui.simulator.runFrames).toBe(1)
    expect(next.ui.simulator.runLead).toBe(0)
  })

  test.each([
    ['unknown view', { view: 'list' }],
    ['unknown run label', { runLabel: 'Go' }],
    ['runFrames 0', { runFrames: 0 }],
    ['runFrames 301', { runFrames: 301 }],
    ['fractional runFrames', { runFrames: 1.5 }],
    ['runLead -1', { runLead: -1 }],
    ['runLead 301', { runLead: 301 }],
    ['a valid field next to an invalid one', { view: 'stream', runFrames: 0 }],
  ])('rejects %s with guard target and keeps state', (_name, patch) => {
    expectRejected(reconstruct('ST06'), SET(patch as Omit<Extract<Action, { type: 'SET_SIMULATOR' }>, 'type'>), 'target')
  })
})

describe('SET_COMPARE', () => {
  test('open is rejected before any completed SIM-AP-RECON run', () => {
    expectRejected(reconstruct('ST06'), { type: 'SET_COMPARE', open: true }, 'run')
    const running = act(reconstruct('ST06'), { type: 'RUN_SIMULATION' })
    expect(running.phase).toBe('ST07')
    expectRejected(running, { type: 'SET_COMPARE', open: true }, 'run')
  })

  test('open is rejected while a cancelled run is the only run', () => {
    const cancelled = act(reconstruct('ST06'), { type: 'RUN_SIMULATION' }, { type: 'CANCEL_SIMULATION' })
    expectRejected(cancelled, { type: 'SET_COMPARE', open: true }, 'run')
  })

  test('open is accepted at ST08 and ST09 once a run completed', () => {
    for (const state of [st08(), st09()]) {
      const open = act(state, { type: 'SET_COMPARE', open: true })
      expect(open.ui.simulator.compare).toBe(true)
      expect(business(open)).toEqual(business(state))
    }
  })

  test('close is always accepted', () => {
    const before = reconstruct('ST06')
    expect(act(before, { type: 'SET_COMPARE', open: false }).ui.simulator.compare).toBe(false)
    const open = act(st08(), { type: 'SET_COMPARE', open: true })
    expect(act(open, { type: 'SET_COMPARE', open: false }).ui.simulator.compare).toBe(false)
  })

  test('FIX_AND_RUN clears compare and the scenario selection', () => {
    const open = act(st08(), { type: 'SELECT_SCENARIO', scenarioId: 'SCN-022' }, { type: 'SET_COMPARE', open: true })
    expect(open.ui.simulator.compare).toBe(true)
    expect(open.selectedScenario).toBe('SCN-022')
    const fixed = act(open, { type: 'FIX_AND_RUN' })
    expect(fixed.ui.simulator.compare).toBe(false)
    expect(fixed.selectedScenario).toBeNull()
  })
})

describe('OPEN_DRAWER replay', () => {
  test('is rejected off SC20', () => {
    const running = act(reconstruct('ST06'), { type: 'RUN_SIMULATION' }, { type: 'SELECT_SCENARIO', scenarioId: 'SCN-022' })
    expect(running.route).toBe('SC19')
    expectRejected(running, { type: 'OPEN_DRAWER', drawer: 'replay' }, 'target')
  })

  test('is rejected on SC20 without a selected scenario', () => {
    const state = st08()
    expect(state.route).toBe('SC20')
    expect(state.selectedScenario).toBeNull()
    expectRejected(state, { type: 'OPEN_DRAWER', drawer: 'replay' }, 'target')
  })

  test('is rejected on SC20 when another scenario is selected', () => {
    const state = act(st08(), { type: 'SELECT_SCENARIO', scenarioId: 'SCN-023' })
    expectRejected(state, { type: 'OPEN_DRAWER', drawer: 'replay' }, 'target')
  })

  test('opens on SC20 at ST08 with SCN-022 selected, and closes', () => {
    const selected = act(st08(), { type: 'SELECT_SCENARIO', scenarioId: 'SCN-022' })
    const open = act(selected, { type: 'OPEN_DRAWER', drawer: 'replay' })
    expect(open.ui.discovery.drawer).toBe('replay')
    expect(business(open)).toEqual(business(selected))
    expect(act(open, { type: 'CLOSE_DRAWER' }).ui.discovery.drawer).toBeNull()
  })

  test('AP-RULE-009 opens from SC20 at ST08', () => {
    const state = st08()
    expect(state.route).toBe('SC20')
    expect(act(state, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }).ui.discovery.drawer).toBe('AP-RULE-009')
  })
})

describe('SELECT_SCENARIO', () => {
  test('accepts null and clears the selection', () => {
    const selected = act(st08(), { type: 'SELECT_SCENARIO', scenarioId: 'SCN-022' })
    expect(selected.selectedScenario).toBe('SCN-022')
    expect(act(selected, { type: 'SELECT_SCENARIO', scenarioId: null }).selectedScenario).toBeNull()
  })

  test('rejects an unknown scenario', () => {
    expectRejected(st08(), { type: 'SELECT_SCENARIO', scenarioId: 'SCN-099' }, 'target')
  })
})

describe('simulation lifecycle through the reducer', () => {
  test('RUN_SIMULATION starts one running v0.1 run on SC19 at ST07', () => {
    const state = act(reconstruct('ST06'), { type: 'RUN_SIMULATION' })
    expect(state.phase).toBe('ST07')
    expect(state.route).toBe('SC19')
    expect(state.running.simulation).toBe(true)
    expect(state.evaluations).toHaveLength(1)
    expect(state.evaluations[0]).toMatchObject({ versionId: 'agent-v0.1', suiteId: 'SIM-AP-RECON', status: 'running', results: [] })
  })

  test('a running run carries no verdict', () => {
    const state = act(reconstruct('ST06'), { type: 'RUN_SIMULATION' })
    expect(suiteVerdicts(state).every((row) => row.verdict === 'notRun')).toBe(true)
  })

  test('CANCEL_SIMULATION leaves the run incomplete, in ST07, with no verdicts', () => {
    const state = act(reconstruct('ST06'), { type: 'RUN_SIMULATION' }, { type: 'CANCEL_SIMULATION' })
    expect(state.phase).toBe('ST07')
    expect(state.route).toBe('SC19')
    expect(state.running.simulation).toBe(false)
    const run = latestRun(state)
    expect(run?.status).toBe('cancelled')
    expect(run?.results).toEqual([])
    expect(suiteVerdicts(state)).toHaveLength(SUITE_SIZE)
    expect(suiteVerdicts(state).every((row) => row.verdict === 'notRun')).toBe(true)
    expect(suiteVerdicts(state, 'agent-v0.1').every((row) => row.verdict === 'notRun')).toBe(true)
    expect(run && runSummary(run)).toMatchObject({ complete: false, passed: 0, safeEscalation: 0, failed: 0, notRun: SUITE_SIZE })
  })

  test('a second RUN_SIMULATION after cancel starts a new v0.1 run and keeps the cancelled one', () => {
    const cancelled = act(reconstruct('ST06'), { type: 'RUN_SIMULATION' }, { type: 'CANCEL_SIMULATION' })
    const again = act(cancelled, { type: 'RUN_SIMULATION' })
    expect(again.phase).toBe('ST07')
    expect(again.running.simulation).toBe(true)
    expect(again.evaluations).toHaveLength(2)
    expect(again.evaluations[0]).toEqual(cancelled.evaluations[0])
    expect(again.evaluations[1]).toMatchObject({ versionId: 'agent-v0.1', status: 'running', results: [] })
  })

  test('a run that is still running cannot be started again', () => {
    expectRejected(act(reconstruct('ST06'), { type: 'RUN_SIMULATION' }), { type: 'RUN_SIMULATION' }, 'run')
  })

  test('a cancelled run cannot be completed, so it never reaches ST08 or ST09', () => {
    const cancelled = act(reconstruct('ST06'), { type: 'RUN_SIMULATION' }, { type: 'CANCEL_SIMULATION' })
    expectRejected(cancelled, { type: 'COMPLETE_SIMULATION' }, 'run')
  })

  test('v0.1 completes to ST08 with 21 passed, 6 safe escalations, 1 failed (SCN-022 only)', () => {
    const state = st08()
    expect(state.phase).toBe('ST08')
    expect(state.route).toBe('SC20')
    expect(state.running.simulation).toBe(false)
    const run = latestRun(state)
    expect(run?.versionId).toBe('agent-v0.1')
    expect(run && runSummary(run)).toEqual({ complete: true, passed: 21, safeEscalation: 6, failed: 1, notRun: 0 })
    const failed = suiteVerdicts(state).filter((row) => row.verdict === 'failed')
    expect(failed.map((row) => row.id)).toEqual(['SCN-022'])
  })

  test('FIX_AND_RUN adds v0.2 and leaves the completed v0.1 run untouched', () => {
    const before = st08()
    const v01 = before.evaluations[0]
    const fixed = act(before, { type: 'FIX_AND_RUN' })
    expect(fixed.phase).toBe('ST07')
    expect(fixed.route).toBe('SC19')
    expect(fixed.running.simulation).toBe(true)
    expect(fixed.agent.versions).toContain('agent-v0.2')
    expect(fixed.evaluations).toHaveLength(2)
    expect(fixed.evaluations[0]).toEqual(v01)
    expect(fixed.evaluations[1]).toMatchObject({ versionId: 'agent-v0.2', status: 'running', results: [] })
    expect(runSummary(fixed.evaluations[0]!)).toEqual({ complete: true, passed: 21, safeEscalation: 6, failed: 1, notRun: 0 })
  })

  test('FIX_AND_RUN is rejected outside ST08', () => {
    expectRejected(reconstruct('ST06'), { type: 'FIX_AND_RUN' }, 'phase')
  })

  test('v0.2 completes to ST09 with 22 / 6 / 0 and v0.1 is never rewritten', () => {
    const state = st09()
    expect(state.phase).toBe('ST09')
    expect(state.route).toBe('SC20')
    expect(state.evaluations).toHaveLength(2)
    const [v01, v02] = state.evaluations
    expect(v01).toEqual(st08().evaluations[0])
    expect(v01!.versionId).toBe('agent-v0.1')
    expect(v02!.versionId).toBe('agent-v0.2')
    const s01 = runSummary(v01!)
    const s02 = runSummary(v02!)
    expect(s01).toEqual({ complete: true, passed: 21, safeEscalation: 6, failed: 1, notRun: 0 })
    expect(s02).toEqual({ complete: true, passed: 22, safeEscalation: 6, failed: 0, notRun: 0 })
    expect(s01.passed + s01.safeEscalation + s01.failed).toBe(28)
    expect(s02.passed + s02.safeEscalation + s02.failed).toBe(28)
    expect(s01.passed + s01.safeEscalation).toBe(27)
    expect(s02.passed + s02.safeEscalation).toBe(28)
  })

  test('SCN-022 is the only scenario whose verdict differs between the two runs', () => {
    const state = st09()
    const old = suiteVerdicts(state, 'agent-v0.1')
    const next = suiteVerdicts(state, 'agent-v0.2')
    expect(old).toHaveLength(SCENARIOS.length)
    const differing = old.filter((row, index) => row.verdict !== next[index]!.verdict)
    expect(differing.map((row) => row.id)).toEqual(['SCN-022'])
    expect(old.find((row) => row.id === 'SCN-022')?.verdict).toBe('failed')
    expect(next.find((row) => row.id === 'SCN-022')?.verdict).toBe('passed')
  })

  test('the six safe escalations are intended passes in both versions', () => {
    const state = st09()
    for (const version of ['agent-v0.1', 'agent-v0.2'] as const) {
      const escalated = suiteVerdicts(state, version).filter((row) => row.verdict === 'safeEscalation')
      expect(escalated.map((row) => row.id)).toEqual(['SCN-023', 'SCN-024', 'SCN-025', 'SCN-026', 'SCN-027', 'SCN-028'])
    }
  })
})

describe('runLead reset', () => {
  test('RUN_SIMULATION resets runLead but keeps runFrames and runLabel', () => {
    const set = act(reconstruct('ST06'), SET({ runLead: 18, runFrames: 48, runLabel: 'Run Evaluation' }))
    expect(set.ui.simulator.runLead).toBe(18)
    const run = act(set, { type: 'RUN_SIMULATION' })
    expect(run.ui.simulator).toMatchObject({ runLead: 0, runFrames: 48, runLabel: 'Run Evaluation' })
  })

  test('FIX_AND_RUN resets runLead but keeps runFrames and runLabel', () => {
    const set = act(st08(), SET({ runLead: 18, runFrames: 60, runLabel: 'Run Evaluation' }))
    expect(set.ui.simulator.runLead).toBe(18)
    const run = act(set, { type: 'FIX_AND_RUN' })
    expect(run.ui.simulator).toMatchObject({ runLead: 0, runFrames: 60, runLabel: 'Run Evaluation' })
  })

  test('a RUN_SIMULATION after cancel also starts from no lead', () => {
    const cancelled = act(reconstruct('ST06'), { type: 'RUN_SIMULATION' }, { type: 'CANCEL_SIMULATION' }, SET({ runLead: 30 }))
    expect(act(cancelled, { type: 'RUN_SIMULATION' }).ui.simulator.runLead).toBe(0)
  })
})

describe('run sampler helpers', () => {
  const frames = [1, 30, 48, 90, 300]

  test('never reach 28 for any elapsed time', () => {
    for (const runFrames of frames) {
      for (const elapsed of [0, 1, runFrames - 1, runFrames, runFrames + 1, 10 * runFrames, 1_000_000]) {
        expect(positionAfter(elapsed, runFrames)).toBeLessThan(SUITE_SIZE)
        expect(executedAfter(elapsed, runFrames)).toBeLessThanOrEqual(SUITE_SIZE - 1)
      }
    }
  })

  test('are 0 for negative elapsed and 0 at the start', () => {
    for (const runFrames of frames) {
      for (const elapsed of [-1, -runFrames, -1000, 0]) {
        expect(positionAfter(elapsed, runFrames)).toBe(0)
        expect(executedAfter(elapsed, runFrames)).toBe(0)
      }
    }
  })

  test('are monotone non-decreasing', () => {
    for (const runFrames of frames) {
      let position = -1
      let executed = -1
      for (let elapsed = -3; elapsed <= 3 * runFrames; elapsed += 1) {
        const p = positionAfter(elapsed, runFrames)
        const e = executedAfter(elapsed, runFrames)
        expect(p).toBeGreaterThanOrEqual(position)
        expect(e).toBeGreaterThanOrEqual(executed)
        position = p
        executed = e
      }
    }
  })

  test('with 48 frames, 24 elapsed is position 14', () => {
    expect(positionAfter(24, 48)).toBe(14)
    expect(executedAfter(24, 48)).toBe(14)
  })

  test('the default run length applies when none is given', () => {
    expect(positionAfter(45)).toBe(14)
  })
})

describe('release gate honesty', () => {
  const row = (state: State, id: string) => gateChecks(state).find((check) => check.id === id)

  test('v0.1 completed run never satisfies the scenarios or edge rows', () => {
    const state = st08()
    const scenarios = row(state, 'scenarios')
    const edge = row(state, 'edgeCases')
    expect(scenarios?.met).toBe(false)
    expect(scenarios?.label).toBe('0/25 representative scenarios')
    expect(edge?.met).toBe(false)
    expect(edge?.label).toBe('0/5 edge/negative')
  })

  test('v0.2 running does not satisfy the scenarios or edge rows', () => {
    const state = act(st08(), { type: 'FIX_AND_RUN' })
    expect(row(state, 'scenarios')?.met).toBe(false)
    expect(row(state, 'edgeCases')?.met).toBe(false)
  })

  test('a completed v0.2 run meets scenarios and edge while owner approval stays unmet', () => {
    const state = st09()
    expect(row(state, 'scenarios')).toMatchObject({ met: true, label: '28/25 representative scenarios', detail: '' })
    expect(row(state, 'edgeCases')).toMatchObject({ met: true, label: '6/5 edge/negative', detail: '' })
    expect(row(state, 'ownerApproval')?.met).toBe(false)
    expect(row(state, 'scopeConfirmation')?.met).toBe(false)
  })

  test('APPROVE_RELEASE meets only owner approval', () => {
    const state = act(st09(), { type: 'APPROVE_RELEASE' })
    expect(row(state, 'ownerApproval')?.met).toBe(true)
    expect(row(state, 'scopeConfirmation')?.met).toBe(false)
  })

  test('APPROVE_RELEASE is refused at ST08, while v0.1 is the only completed run', () => {
    expectRejected(st08(), { type: 'APPROVE_RELEASE' }, 'phase')
  })
})
