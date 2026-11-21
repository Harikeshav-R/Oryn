import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createInitialState, reconstruct, reduce, transition } from '@/state'
import type { Action, State } from '@/state'
import { HOME_CARDS, destinationOf, destinationsFor, homeCards, roleOf } from './destinations'
import { HomeScreen } from './HomeScreen'
import { Shell } from './Shell'

const as = (state: State, personId: Extract<Action, { type: 'SELECT_ACTOR' }>['personId']): State => reduce(state, { type: 'SELECT_ACTOR', personId })
const apply = (state: State, ...actions: readonly Action[]): State => actions.reduce(reduce, state)
const shell = (state: State): string => renderToStaticMarkup(<Shell state={state}>{null}</Shell>)
const home = (state: State): string => renderToStaticMarkup(<HomeScreen state={state} />)
const rows = (html: string): string[] => [...html.matchAll(/data-film-anchor="nav-[a-z-]+"[^>]*>(?:<svg.*?<\/svg>)?([^<]+)</g)].map((match) => match[1] as string)

const atHome = (state: State): State => reduce(state, { type: 'OPEN_SCREEN', screen: 'SC12' })

describe('SC12-FRAME shell', () => {
  test('shows the organization and the selected viewpoint', () => {
    const html = shell(atHome(reconstruct('ST02')))
    expect(html).toContain('Calder &amp; Vance')
    expect(html).toContain('Priya Nair')
    expect(html).toContain('Employee')
    expect(html).toContain('Search workflows, agents and cases')
  })

  test('navigation follows the viewpoint and an unauthorized destination is absent', () => {
    const priya = atHome(reconstruct('ST02'))
    expect(rows(shell(priya))).toEqual(['Home', 'Notifications', 'My Privacy'])
    const marcus = rows(shell(as(priya, 'marcus')))
    expect(marcus).toContain('Playbooks')
    expect(marcus).not.toContain('My Privacy')
    expect(rows(shell(as(priya, 'daniel')))).not.toContain('Agent Factory')
    expect(rows(shell(as(priya, 'tomas')))).toContain('Application Capabilities')
  })

  test('breadcrumb current page and the active nav row name the same destination', () => {
    for (const route of ['SC12', 'SC03'] as const) {
      const state = reduce(reconstruct('ST02'), { type: 'OPEN_SCREEN', screen: route })
      const html = shell(state)
      const destination = destinationOf(route)
      expect(destination).not.toBeNull()
      expect(html).toContain(`<span aria-current="page" class="text-foreground">${destination?.label}</span>`)
      expect(html).toMatch(new RegExp(`aria-current="page"[^>]*>(?:<svg.*?</svg>)?${destination?.label}<`))
    }
  })

  test('a role change is a viewpoint change that grants nothing', () => {
    const before = atHome(reconstruct('ST02'))
    const after = as(before, 'daniel')
    expect(roleOf(after)).toBe('Approver')
    expect(after.authority).toEqual(before.authority)
    // Tier 3 stays with its delegation: the viewpoint cannot approve what it was not delegated.
    expect(destinationsFor(after).map((item) => item.id)).not.toContain('my-privacy')
  })

  test('an external supplier representative has no viewpoint: the reducer refuses to select it', () => {
    const result = transition(createInitialState(), { type: 'SELECT_ACTOR', personId: 'dana' })
    expect(result.ok).toBe(false)
  })

  test('search stays closed until opened, then lists only commands the role may run', () => {
    const closed = shell(atHome(reconstruct('ST02')))
    expect(closed).toMatch(/data-film-anchor="command-palette"[^>]*display:none/)
    const open = apply(atHome(reconstruct('ST02')), { type: 'SET_OVERLAY', overlay: 'search' })
    const palette = shell(open)
    expect(palette).not.toMatch(/data-film-anchor="command-palette"[^>]*display:none/)
    expect(palette).toContain('Pause observation')
    expect(palette).not.toContain('Publish playbook')
    const empty = shell(apply(open, { type: 'SET_SEARCH_QUERY', query: 'zzzz' }))
    expect(empty).toContain('No matching commands')
    const denied = shell(apply(as(open, 'marcus'), { type: 'SET_OVERLAY', overlay: 'search' }, { type: 'SET_SEARCH_QUERY', query: 'pause' }))
    expect(denied).toContain('Commands your role cannot run are not listed.')
  })

  test('the role menu lists the four roles and states that it grants nothing', () => {
    const html = shell(apply(atHome(reconstruct('ST02')), { type: 'SET_OVERLAY', overlay: 'role' }))
    for (const role of ['Employee', 'Workflow Owner', 'Approver', 'Admin']) expect(html).toContain(role)
    expect(html).toContain('Role selection grants neither private evidence access nor financial approval.')
  })

  test('idle shell never draws the execution cyan', () => {
    const html = shell(atHome(reconstruct('ST02'))).toLowerCase()
    expect(html).not.toContain('--arc')
    expect(html).not.toContain('2fd8ff')
  })
})

describe('SC12 Home', () => {
  test('four cards, figures only for the roles that may read them', () => {
    expect(HOME_CARDS.map((card) => card.title)).toEqual(['Approvals', 'Incidents', 'Verified outcomes', 'Recent changes'])
    const employee = home(atHome(reconstruct('ST02')))
    for (const title of ['Approvals', 'Incidents', 'Verified outcomes', 'Recent changes']) expect(employee).toContain(title)
    expect(employee).toContain('Not available for Employee.')
    expect(employee).toContain('1 audit event recorded')
    const owner = home(as(atHome(reconstruct('ST02')), 'marcus'))
    expect(owner).not.toContain('Not available for Workflow Owner.')
    expect(owner).toContain('no job has run yet')
  })

  test('figures come from the snapshot: a waiting approval appears and an unauthorized card stays unavailable', () => {
    const atApproval = as(reconstruct('ST11'), 'daniel')
    const cards = homeCards(atApproval)
    const approvals = cards.find((view) => view.card.id === 'approvals')
    expect(approvals).toMatchObject({ available: true, value: 1 })
    const employee = homeCards(as(atApproval, 'priya'))
    expect(employee.find((view) => view.card.id === 'approvals')).toMatchObject({ available: false })
  })

  test('a card opens its route when the lifecycle has reached it, and the reducer refuses it earlier', () => {
    const early = atHome(reconstruct('ST02'))
    const refused = transition(early, { type: 'OPEN_SCREEN', screen: 'SC23' })
    expect(refused.ok).toBe(false)
    const later = as(atHome(reconstruct('ST11')), 'daniel')
    const opened = transition(later, { type: 'OPEN_SCREEN', screen: 'SC23' })
    expect(opened.ok && opened.state.route).toBe('SC23')
  })

  test('the cards are a fixed 2x2 grid of 480x180 with 16 px gaps', () => {
    const html = home(atHome(reconstruct('ST02')))
    expect(html).toContain('grid-template-columns:480px 480px')
    expect(html).toContain('grid-template-rows:180px 180px')
    expect(html).toContain('gap:16px')
    expect(html).toContain('left:264px;top:128px')
  })
})
