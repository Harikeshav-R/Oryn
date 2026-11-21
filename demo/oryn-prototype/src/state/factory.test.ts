import { describe, expect, test } from 'bun:test'
import { AGENT_DEFINITION } from '@/data/versions'
import { CANONICAL_SCRIPT, gateChecks, reconstruct } from '@/state'
import { act, expectRejected } from '@/state/test-helpers'

/** BOB-07: the Agent Factory intent (SC17) and the drawers SC17 and SC18 open. */

const INTENT = AGENT_DEFINITION.intent
const atFactory = act(reconstruct('ST05'), { type: 'OPEN_SCREEN', screen: 'SC17' })

describe('the intent', () => {
  test('SET_INTENT is presentation: it stores the text and moves no business state', () => {
    const typed = act(atFactory, { type: 'SET_INTENT', text: 'Reconcile' })
    expect(typed.ui.factory.intent).toBe('Reconcile')
    expect({ ...typed, ui: atFactory.ui, step: atFactory.step }).toEqual({ ...atFactory, step: atFactory.step })
    expect(typed.phase).toBe('ST05')
    expect(typed.agent.versions).toEqual([])
  })

  test('SET_INTENT applies only while the draft is being written (ST05)', () => {
    expectRejected(reconstruct('ST04'), { type: 'SET_INTENT', text: INTENT }, 'phase')
    expectRejected(reconstruct('ST06'), { type: 'SET_INTENT', text: INTENT }, 'phase')
  })

  test('an intent over 280 characters is refused', () => {
    expectRejected(atFactory, { type: 'SET_INTENT', text: 'x'.repeat(281) }, 'intent')
    expect(act(atFactory, { type: 'SET_INTENT', text: 'x'.repeat(280) }).ui.factory.intent).toHaveLength(280)
  })

  test('a blank or whitespace-only intent blocks CREATE_AGENT', () => {
    expectRejected(atFactory, { type: 'CREATE_AGENT' }, 'intent')
    expectRejected(act(atFactory, { type: 'SET_INTENT', text: '   \n ' }), { type: 'CREATE_AGENT' }, 'intent')
  })

  test('an intent other than the demonstration intent is refused, with no draft created', () => {
    const other = act(atFactory, { type: 'SET_INTENT', text: 'Reconcile everything.' })
    const rejection = expectRejected(other, { type: 'CREATE_AGENT' }, 'intent')
    expect(rejection.reason).toContain('demonstration intent')
    expect(other.agent.versions).toEqual([])
  })

  test('the exact intent creates v0.1 and enters ST06; stray spacing around it is ignored', () => {
    const created = act(atFactory, { type: 'SET_INTENT', text: `  ${INTENT.replace(' against ', '   against ')}\n` }, { type: 'CREATE_AGENT' })
    expect(created.phase).toBe('ST06')
    expect(created.agent.versions).toEqual(['agent-v0.1'])
    expect(created.route).toBe('SC17')
  })

  test('typing the intent confers no authority: a person without the grant is still refused', () => {
    const asPriya = act(atFactory, { type: 'SET_INTENT', text: INTENT }, { type: 'SELECT_ACTOR', personId: 'priya' })
    expectRejected(asPriya, { type: 'CREATE_AGENT' }, 'authority')
  })

  test('the canonical script sets the intent before it creates the agent', () => {
    const types = CANONICAL_SCRIPT.map((action) => action.type)
    expect(types.indexOf('SET_INTENT')).toBe(types.indexOf('CREATE_AGENT') - 1)
  })
})

describe('the drawers of SC17 and SC18', () => {
  const draft = act(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC17' })
  const gate = act(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC18' })

  test('the AP-RULE-009 source opens from the agent draft and closes with Escape', () => {
    const open = act(draft, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' })
    expect(open.ui.discovery.drawer).toBe('AP-RULE-009')
    expect(act(open, { type: 'CLOSE_DRAWER' }).ui.discovery.drawer).toBeNull()
  })

  test('the AP-RULE-017 and evidence drawers still belong to SC14 and SC15, not the draft', () => {
    expectRejected(draft, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-017' }, 'target')
    expectRejected(act(draft, { type: 'SELECT_DEMONSTRATION', demoId: 'D1' }), { type: 'OPEN_DRAWER', drawer: 'evidence' }, 'target')
  })

  test('the examples drawer opens from the release gate only', () => {
    expect(act(gate, { type: 'OPEN_DRAWER', drawer: 'examples' }).ui.discovery.drawer).toBe('examples')
    expectRejected(draft, { type: 'OPEN_DRAWER', drawer: 'examples' }, 'target')
  })

  test('leaving the screen closes the drawer, and opening it approves and verifies nothing', () => {
    const open = act(gate, { type: 'OPEN_DRAWER', drawer: 'examples' })
    expect(act(open, { type: 'OPEN_SCREEN', screen: 'SC17' }).ui.discovery.drawer).toBeNull()
    expect(open.agent).toEqual(gate.agent)
    expect(open.evaluations).toEqual([])
  })
})

describe('the gate on the draft', () => {
  test('after CREATE_AGENT only the examples are evidenced: the evaluation and the owner stay pending', () => {
    const checks = gateChecks(reconstruct('ST06'))
    expect(checks.map((check) => [check.id, check.met])).toEqual([
      ['examples', true],
      ['scenarios', false],
      ['edgeCases', false],
      ['ownerApproval', false],
      ['scopeConfirmation', false],
      ['authorization', true],
    ])
  })
})
