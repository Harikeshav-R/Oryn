import { describe, expect, test } from 'bun:test'
import { reconstruct } from './script'
import { createInitialState } from './initial'
import { act, expectRejected } from './test-helpers'
import type { State } from './types'

/** BOB-06 presentation actions: Workflow Discovery filter and selection, the evidence drawer. None changes business state. */

const candidate = reconstruct('ST04')
const withoutPresentation = (state: State): State => ({ ...state, ui: candidate.ui, step: candidate.step })

describe('the candidate exists only once the commitment is confirmed', () => {
  test('selection, filter-independent actions and the drawer are refused before ST04', () => {
    const early = reconstruct('ST03')
    expectRejected(early, { type: 'SELECT_CANDIDATE' }, 'route')
    expectRejected(early, { type: 'SELECT_DEMONSTRATION', demoId: 'D1' }, 'route')
    expectRejected(early, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }, 'route')
  })

  test('confirming the commitment routes to Workflow Discovery with nothing selected and no drawer open', () => {
    expect(candidate.route).toBe('SC13')
    expect(candidate.ui.discovery).toEqual({ filter: 'all', candidateSelected: false, demonstration: null, drawer: null })
    expect(createInitialState().ui.discovery.drawer).toBeNull()
  })
})

describe('selection and filter are presentation only', () => {
  test('they change the discovery slice and nothing else', () => {
    const next = act(candidate, { type: 'SELECT_CANDIDATE' }, { type: 'SELECT_DEMONSTRATION', demoId: 'D2' }, { type: 'SET_DISCOVERY_FILTER', filter: 'published' })
    expect(withoutPresentation(next)).toEqual(candidate)
    expect(next.ui.discovery).toEqual({ filter: 'published', candidateSelected: true, demonstration: 'D2', drawer: null })
    expect(next.demonstrations).toEqual(candidate.demonstrations)
    expect(next.playbookPublished).toBe(false)
  })

  test('an unknown filter or demonstration is rejected, not stored', () => {
    expectRejected(candidate, { type: 'SET_DISCOVERY_FILTER', filter: 'everything' as 'all' }, 'target')
    expectRejected(candidate, { type: 'SELECT_DEMONSTRATION', demoId: 'D9' as 'D1' }, 'target')
  })
})

describe('the evidence drawer', () => {
  const review = act(candidate, { type: 'OPEN_SCREEN', screen: 'SC14' })

  test('opens only from the candidate review or the playbook, and evidence needs a selected Demonstration', () => {
    expectRejected(candidate, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }, 'target')
    expectRejected(review, { type: 'OPEN_DRAWER', drawer: 'evidence' }, 'target')
    expectRejected(review, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-001' as 'evidence' }, 'target')
    expect(act(review, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }).ui.discovery.drawer).toBe('AP-RULE-009')
    expect(act(review, { type: 'SELECT_DEMONSTRATION', demoId: 'D1' }, { type: 'OPEN_DRAWER', drawer: 'evidence' }).ui.discovery.drawer).toBe('evidence')
  })

  test('closing needs an open drawer; leaving the screen closes it', () => {
    expectRejected(review, { type: 'CLOSE_DRAWER' }, 'target')
    const open = act(review, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' })
    expect(act(open, { type: 'CLOSE_DRAWER' }).ui.discovery.drawer).toBeNull()
    expect(act(open, { type: 'OPEN_SCREEN', screen: 'SC15' }).ui.discovery.drawer).toBeNull()
    expect(act(open, { type: 'OPEN_SCREEN', screen: 'SC14' }).ui.discovery.drawer).toBe('AP-RULE-009')
  })

  test('opening it approves, publishes and verifies nothing', () => {
    const open = act(review, { type: 'SELECT_DEMONSTRATION', demoId: 'D3' }, { type: 'OPEN_DRAWER', drawer: 'evidence' })
    expect(open.demonstrations).toEqual(review.demonstrations)
    expect(open.ownerReviewRequestedBy).toBeNull()
    expect(open.playbookPublished).toBe(false)
    expect(open.audit).toEqual(review.audit)
  })

  test('publishing closes a drawer left open', () => {
    const ready = act(
      review,
      { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' },
      { type: 'APPROVE_DEMONSTRATION', demoId: 'D2' },
      { type: 'SELECT_ACTOR', personId: 'jamal' },
      { type: 'ACKNOWLEDGE_NOTICE' },
      { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true },
      { type: 'SET_CONTRIBUTION', enabled: true },
      { type: 'APPROVE_DEMONSTRATION', demoId: 'D3' },
      { type: 'REQUEST_OWNER_REVIEW' },
      { type: 'SELECT_ACTOR', personId: 'marcus' },
      { type: 'OPEN_SCREEN', screen: 'SC15' },
      { type: 'OPEN_DRAWER', drawer: 'AP-RULE-017' },
    )
    expect(ready.ui.discovery.drawer).toBe('AP-RULE-017')
    const published = act(ready, { type: 'PUBLISH' })
    expect(published.ui.discovery.drawer).toBeNull()
    expect(published.route).toBe('SC15')
  })
})
