import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { AGENT_DEFINITION } from '@/data/versions'
import { createInitialState, reconstruct, reduce } from '@/state'
import type { Action, State } from '@/state'
import { sceneAnchors, sceneOf } from './anchors'
import { ProductScreen } from './ProductScreen'

const apply = (state: State, ...actions: readonly Action[]): State => actions.reduce(reduce, state)
const names = (state: State): string[] => [...renderToStaticMarkup(<ProductScreen state={state} />).matchAll(/data-film-anchor="([^"]+)"/g)].map((match) => match[1] as string)

/** Every route state a film can reach, one per scene variant the anchors depend on. */
const STATES: Readonly<Record<string, State>> = {
  'enrollment notice': createInitialState(),
  'enrollment capture': apply(createInitialState(), { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'WIZARD_NEXT' }),
  'enrollment scope': apply(createInitialState(), { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'WIZARD_NEXT' }, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }, { type: 'WIZARD_NEXT' }),
  'enrollment complete': apply(reconstruct('ST02'), { type: 'OPEN_SCREEN', screen: 'SC02' }),
  'enrollment, not an employee': apply(createInitialState(), { type: 'SELECT_ACTOR', personId: 'marcus' }),
  'desktop, menu closed': reconstruct('ST02'),
  'desktop, menu open': apply(reconstruct('ST02'), { type: 'SET_OVERLAY', overlay: 'companion' }),
  'desktop, excluded window': apply(reconstruct('ST02'), { type: 'SET_FOREGROUND', window: 'excluded' }),
  'privacy': apply(reconstruct('ST02'), { type: 'OPEN_SCREEN', screen: 'SC03' }),
  'privacy, delete dialog': apply(reconstruct('ST02'), { type: 'OPEN_SCREEN', screen: 'SC03' }, { type: 'OPEN_DELETE_DIALOG' }),
  'privacy, not an employee': apply(reconstruct('ST02'), { type: 'OPEN_SCREEN', screen: 'SC03' }, { type: 'SELECT_ACTOR', personId: 'daniel' }),
  'home as employee': apply(reconstruct('ST02'), { type: 'OPEN_SCREEN', screen: 'SC12' }),
  'home as approver, role menu open': apply(reconstruct('ST11'), { type: 'OPEN_SCREEN', screen: 'SC12' }, { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'SET_OVERLAY', overlay: 'role' }),
  'home, search open': apply(reconstruct('ST02'), { type: 'OPEN_SCREEN', screen: 'SC12' }, { type: 'SET_OVERLAY', overlay: 'search' }),
  'route not built yet': apply(reconstruct('ST21'), { type: 'OPEN_SCREEN', screen: 'SC37' }),
  'discovery, candidate listed': reconstruct('ST04'),
  'discovery, empty filter': apply(reconstruct('ST04'), { type: 'SET_DISCOVERY_FILTER', filter: 'published' }),
  'discovery, no access': apply(reconstruct('ST04'), { type: 'SELECT_ACTOR', personId: 'daniel' }),
  'candidate review': apply(reconstruct('ST04'), { type: 'OPEN_SCREEN', screen: 'SC14' }),
  'candidate review, rule drawer open': apply(reconstruct('ST04'), { type: 'OPEN_SCREEN', screen: 'SC14' }, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }),
  'candidate review, evidence drawer open': apply(reconstruct('ST04'), { type: 'OPEN_SCREEN', screen: 'SC14' }, { type: 'SELECT_DEMONSTRATION', demoId: 'D2' }, { type: 'OPEN_DRAWER', drawer: 'evidence' }),
  'candidate review, no access': apply(reconstruct('ST04'), { type: 'OPEN_SCREEN', screen: 'SC14' }, { type: 'SELECT_ACTOR', personId: 'tomas' }),
  'playbook draft': apply(reconstruct('ST04'), { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'OPEN_SCREEN', screen: 'SC15' }),
  'playbook published': reconstruct('ST05'),
  'playbook, rule drawer open': apply(reconstruct('ST05'), { type: 'OPEN_DRAWER', drawer: 'AP-RULE-017' }),
  'playbook, no access': apply(reconstruct('ST05'), { type: 'SELECT_ACTOR', personId: 'priya' }),
  'agent factory, empty': apply(reconstruct('ST05'), { type: 'OPEN_SCREEN', screen: 'SC17' }),
  'agent factory, intent typed': apply(reconstruct('ST05'), { type: 'OPEN_SCREEN', screen: 'SC17' }, { type: 'SET_INTENT', text: AGENT_DEFINITION.intent }),
  'agent factory, draft': apply(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC17' }),
  'agent factory, source drawer open': apply(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC17' }, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }),
  'agent factory, no access': apply(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC17' }, { type: 'SELECT_ACTOR', personId: 'priya' }),
  'scope, gate pending': apply(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC18' }),
  'scope, examples drawer open': apply(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC18' }, { type: 'OPEN_DRAWER', drawer: 'examples' }),
  'scope, gate satisfied': apply(reconstruct('ST09'), { type: 'OPEN_SCREEN', screen: 'SC18' }, { type: 'APPROVE_RELEASE' }, { type: 'CONFIRM_SCOPE' }),
  'scope, no access': apply(reconstruct('ST06'), { type: 'OPEN_SCREEN', screen: 'SC18' }, { type: 'SELECT_ACTOR', personId: 'daniel' }),
  'jobs, queue proposed': apply(reconstruct('ST09'), { type: 'APPROVE_RELEASE' }, { type: 'CONFIRM_SCOPE' }, { type: 'OPEN_SCREEN', screen: 'SC21' }),
  'jobs, selection confirmed': apply(reconstruct('ST09'), { type: 'APPROVE_RELEASE' }, { type: 'CONFIRM_SCOPE' }, { type: 'OPEN_SCREEN', screen: 'SC21' }, { type: 'CONFIRM_SELECTION' }),
  'jobs, scope dialog open': apply(reconstruct('ST09'), { type: 'APPROVE_RELEASE' }, { type: 'CONFIRM_SCOPE' }, { type: 'OPEN_SCREEN', screen: 'SC21' }, { type: 'CONFIRM_SELECTION' }, { type: 'OPEN_JOB_SCOPE' }),
  'jobs, no access': apply(reconstruct('ST10'), { type: 'OPEN_SCREEN', screen: 'SC21' }, { type: 'SELECT_ACTOR', personId: 'priya' }),
  'job, running': apply(reconstruct('ST10'), { type: 'OPEN_SCREEN', screen: 'SC22' }),
  'job, snapshot': apply(reconstruct('ST11'), { type: 'OPEN_SCREEN', screen: 'SC22' }),
  'job, approval drawer': apply(reconstruct('ST11'), { type: 'OPEN_SCREEN', screen: 'SC23' }, { type: 'SELECT_ACTOR', personId: 'daniel' }),
  'job, unknown drawer': apply(reconstruct('ST11'), { type: 'OPEN_SCREEN', screen: 'SC24' }),
  'job, no access': apply(reconstruct('ST11'), { type: 'OPEN_SCREEN', screen: 'SC22' }, { type: 'SELECT_ACTOR', personId: 'priya' }),
  'job summary': apply(reconstruct('ST11'), { type: 'OPEN_SCREEN', screen: 'SC25' }),
  'job summary, no access': apply(reconstruct('ST11'), { type: 'OPEN_SCREEN', screen: 'SC25' }, { type: 'SELECT_ACTOR', personId: 'priya' }),
  'operations map': reconstruct('ST17'),
  'operations map, table, agent selected': apply(reconstruct('ST17'), { type: 'SET_MAP_VIEW', view: 'table' }, { type: 'SELECT_MAP_NODE', node: 'agent' }),
  'policy change': apply(reconstruct('ST19'), { type: 'OPEN_SCREEN', screen: 'SC31' }),
  'policy change, boundary tests': apply(reconstruct('ST19'), { type: 'OPEN_SCREEN', screen: 'SC31' }, { type: 'SET_POLICY_VIEW', tests: true }),
  'hubspot, blocked draft': reconstruct('ST20'),
  'hubspot, approval requested': apply(reconstruct('ST20'), { type: 'REQUEST_APPROVAL' }),
  'versions': reconstruct('ST21'),
  'versions, comparison and restore dialog': apply(reconstruct('ST21'), { type: 'SET_VERSION_VIEW', compare: 'repair', restore: 'confirm' }),
  'command center': reconstruct('ST22'),
  'command center, x-ray': apply(reconstruct('ST22'), { type: 'SET_COMMAND_VIEW', tab: 'xray' }),
  'audit': reconstruct('ST23'),
  'audit, export drawer': apply(reconstruct('ST23'), { type: 'SET_AUDIT_EXPORT', step: 'drawer' }),
  'audit, export confirmation': apply(reconstruct('ST23'), { type: 'SET_AUDIT_EXPORT', step: 'drawer' }, { type: 'SET_AUDIT_EXPORT', step: 'confirm' }),
  'notifications': reconstruct('ST24'),
  'notifications, one toast and one expanded notice': apply(reconstruct('ST24'), { type: 'SURFACE_TOAST', id: 'N-02' }, { type: 'SET_NOTIFICATION_VIEW', open: 'N-03' }),
  'capability matrix': apply(reconstruct('ST22'), { type: 'OPEN_SCREEN', screen: 'SC36' }),
  'capability matrix, selected cell': apply(reconstruct('ST22'), { type: 'OPEN_SCREEN', screen: 'SC36' }, { type: 'SET_CAPABILITY_VIEW', selected: { application: 'Gmail', capability: 'Observe' } }),
  'capability tiles': apply(reconstruct('ST22'), { type: 'OPEN_SCREEN', screen: 'SC36' }, { type: 'SET_CAPABILITY_VIEW', view: 'tiles' }),
}

describe('film anchors: the scene lists and the rendered DOM agree', () => {
  for (const [label, state] of Object.entries(STATES)) {
    test(`${label}: every listed anchor renders once and nothing else is anchored`, () => {
      const rendered = names(state)
      expect(new Set(rendered).size).toBe(rendered.length)
      expect([...rendered].sort()).toEqual([...sceneAnchors(state)].sort())
    })
  }

  test('routes map to the scene that draws them', () => {
    expect(sceneOf('SC02')).toBe('enrollment')
    expect(sceneOf('SC01')).toBe('desktop')
    expect(sceneOf('SC03')).toBe('privacy')
    expect(sceneOf('SC12')).toBe('home')
    expect(sceneOf('SC21')).toBe('jobs')
    for (const route of ['SC22', 'SC23', 'SC24'] as const) expect(sceneOf(route)).toBe('job')
    expect(sceneOf('SC25')).toBe('job-summary')
    expect(sceneOf('SC26')).toBe('incident')
    expect(sceneOf('SC27')).toBe('teach')
    expect(sceneOf('SC28')).toBe('repair')
    expect(sceneOf('SC29')).toBe('release')
    for (const [route, scene] of [['SC16', 'map'], ['SC30', 'versions'], ['SC31', 'policy'], ['SC33', 'command'], ['SC34', 'audit'], ['SC35', 'notifications'], ['SC36', 'capabilities'], ['SC10', 'desktop'], ['SC32', 'desktop'], ['SC37', 'pending']] as const) expect(sceneOf(route)).toBe(scene)
    expect(sceneOf('SC13')).toBe('discovery')
    expect(sceneOf('SC14')).toBe('candidate')
    expect(sceneOf('SC15')).toBe('playbook')
    expect(sceneOf('SC17')).toBe('factory')
    expect(sceneOf('SC18')).toBe('scope')
  })
})
