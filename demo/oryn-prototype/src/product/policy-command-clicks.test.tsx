import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import type { Action, State } from '@/state'
import { act } from '@/state/test-helpers'
import { CommandScreen } from './CommandScreen'
import { PolicyScreen } from './PolicyScreen'

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(node)) return []
  if (typeof node.type === 'function') return elements(Reflect.apply(node.type, undefined, [node.props]))
  return [node, ...elements(node.props.children as ReactNode)]
}

/** Press the element with `data-film-anchor="name"` and return the reducer actions it dispatched. */
function press(tree: ReactElement, name: string): Action[] {
  const found = elements(tree).find((item) => item.props['data-film-anchor'] === name)
  const onClick = found?.props.onClick
  if (typeof onClick !== 'function') throw new Error(`No pressable ${name}`)
  onClick()
  return dispatched
}

let dispatched: Action[] = []
const policyState = (): State => act(reconstruct('ST19'), { type: 'OPEN_SCREEN', screen: 'SC31' })
const commandState = (): State => act(reconstruct('ST22'), { type: 'OPEN_SCREEN', screen: 'SC33' })
const policy = (state: State) => {
  dispatched = []
  return <PolicyScreen state={state} dispatch={(action) => dispatched.push(action)} />
}
const command = (state: State) => {
  dispatched = []
  return <CommandScreen state={state} dispatch={(action) => dispatched.push(action)} />
}

describe('SC31 policy change interactions', () => {
  test('Review boundary tests only shows the proposals: no release, no revalidation, no grant', () => {
    const actions = press(policy(policyState()), 'review-boundary-tests')
    expect(actions).toEqual([{ type: 'SET_POLICY_VIEW', tests: true }])
    const after = act(policyState(), ...actions)
    expect(after.release).toEqual(policyState().release)
    expect(after.authority).toEqual(policyState().authority)
    expect(after.agent).toEqual(policyState().agent)
  })

  test('each dependency row opens its own asset', () => {
    expect(press(policy(policyState()), 'impact-playbook')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC15' }])
    expect(press(policy(policyState()), 'impact-agent')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC17' }])
    expect(press(policy(policyState()), 'impact-tests')).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC20' }])
  })
})

describe('SC33 Command Center interactions', () => {
  test('tabs, the Job card and the incident card set their own view and nothing else', () => {
    expect(press(command(commandState()), 'cc-tab-xray')).toEqual([{ type: 'SET_COMMAND_VIEW', tab: 'xray' }])
    expect(press(command(commandState()), 'cc-verified')).toEqual([{ type: 'SET_COMMAND_VIEW', detail: 'job' }])
    expect(press(command(commandState()), 'cc-incidents')).toEqual([{ type: 'SET_COMMAND_VIEW', detail: 'incident' }])
  })

  test('the incident population stays separate from the Job population when the incident detail opens', () => {
    const state = act(commandState(), { type: 'SET_COMMAND_VIEW', detail: 'incident' })
    const markup = renderToStaticMarkup(<CommandScreen state={state} />).replaceAll('<!-- -->', '')
    expect(markup).toContain('INC-0042 · Closed')
    expect(markup).toContain('Open incident')
    expect(markup).not.toContain('Open job')
  })
})
