import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { REGRESSION_PASS_RESULTS } from '@/data/regression'
import { reconstruct } from '@/state'
import { act } from '@/state/test-helpers'
import { RepairScreen } from './RepairScreen'
import { regressionView } from './repair'
import { refusal } from './discovery'

const start = reconstruct('ST14')
const running = act(start, { type: 'RUN_REGRESSION' })
const complete = act(running, { type: 'COMPLETE_REGRESSION', results: REGRESSION_PASS_RESULTS })
const html = (state: typeof start) => renderToStaticMarkup(<RepairScreen state={state} />)

describe('SC28 regression', () => {
  test('reports 34 outcomes only after completion', () => {
    const before = regressionView({ state: running, runFrame: 10 })
    expect(before.summary.passed + before.summary.safeEscalation + before.summary.failed + before.summary.notRun).toBe(34)
    const after = regressionView({ state: complete })
    expect(after.summary.passed).toBe(28)
    expect(after.summary.safeEscalation).toBe(6)
    expect(after.summary.failed).toBe(0)
    expect(html(complete)).toContain('Expected Safe Escalation')
    expect(html(complete)).not.toContain('bg-trace')
  })
  test('film and clickable clocks produce the same progress', () => {
    const app = regressionView({ state: running, runFrame: 12 })
    const film = regressionView({ state: running, film: { frame: 22, reducedMotion: false, lastApplied: (type) => type === 'RUN_REGRESSION' ? 10 : null } })
    expect(film.position).toBe(app.position)
    const filmContext = { frame: 12, reducedMotion: false, lastApplied: (type: string) => type === 'RUN_REGRESSION' ? 0 : null }
    expect(renderToStaticMarkup(<RepairScreen state={running} runFrame={12} />)).toBe(renderToStaticMarkup(<RepairScreen state={running} film={filmContext} />))
  })
  test('blocks release for unfinished and failed evaluations and removes cyan after stopping', () => {
    const cancelled = act(running, { type: 'CANCEL_REGRESSION' })
    const failed = act(running, { type: 'COMPLETE_REGRESSION', results: REGRESSION_PASS_RESULTS.map((result, index) => index === 0 ? { ...result, verdict: 'failed' as const } : result) })
    for (const state of [start, running, cancelled, failed]) {
      const reason = refusal(state, { type: 'LIMITED_RELEASE' })
      expect(reason).not.toBeNull()
      expect(html(state)).toContain(reason!)
    }
    expect(html(running)).toContain('bg-trace')
    expect(html(cancelled)).not.toContain('bg-trace')
    expect(html(failed)).not.toContain('bg-trace')
  })
})
