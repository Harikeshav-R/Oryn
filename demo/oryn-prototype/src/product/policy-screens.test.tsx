import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct, REGRESSION_SIZE } from '@/state'
import { act } from '@/state/test-helpers'
import { POLICY_IMPACT } from '@/data/policy-impact'
import { PolicyScreen } from './PolicyScreen'

const state = act(reconstruct('ST19'), { type: 'OPEN_SCREEN', screen: 'SC31' })
const html = (s: typeof state) => renderToStaticMarkup(<PolicyScreen state={s} />).replaceAll('<!-- -->', '')
describe('policy impact', () => {
  test('shows historical and new threshold and exact impact', () => {
    const output = html(state)
    for (const text of ['2.00%', '1.50%', 'effective Dec 1', '1 playbook', '1 agent', '34 tests', 'Needs Revalidation', 'AP-RULE-009']) expect(output).toContain(text)
    expect<number>(POLICY_IMPACT.dependencies.find((item) => item.kind === 'tests')?.count ?? 0).toBe(REGRESSION_SIZE)
    expect(output).toContain('Release blocked until Evaluation and Required approvals')
  })
  test('shows proposed boundary tests only after review', () => {
    const output = html(act(state, { type: 'SET_POLICY_VIEW', tests: true }))
    for (const text of ['below', 'at', 'above', 'Proposed']) expect(output).toContain(text)
  })
  test('marks impact only when revalidation is recorded and restricts employee access', () => {
    const before = act(reconstruct('ST18'), { type: 'SELECT_ACTOR', personId: 'marcus' })
    const markup = renderToStaticMarkup(<PolicyScreen state={before} />)
    expect(markup).toContain('Authorized change recorded')
    expect(markup.match(/<[^>]*data-film-anchor="impact-tests"[^>]*>/)?.[0]).toContain('display:none')
    expect(html(act(state, { type: 'SELECT_ACTOR', personId: 'priya' }))).toContain('Not available:')
  })
})
