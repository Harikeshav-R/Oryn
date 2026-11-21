import { describe, expect, test } from 'bun:test'
import { observationActive } from './selectors'
import { createInitialState } from './initial'
import { act, expectRejected } from './test-helpers'
import { reconstruct } from './script'

const fresh = createInitialState

describe('SC02 enrollment steps (presentation slice)', () => {
  test('Accept and continue is blocked until the notice is acknowledged', () => {
    const state = fresh()
    expect(state.ui.wizardStep).toBe('notice')
    expectRejected(state, { type: 'WIZARD_NEXT' }, 'notice')
    expect(act(state, { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'WIZARD_NEXT' }).ui.wizardStep).toBe('capture')
  })

  test('Continue from Capture and sharing needs a capture category, and sharing is independent of it', () => {
    const noticed = act(fresh(), { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'WIZARD_NEXT' })
    expectRejected(noticed, { type: 'WIZARD_NEXT' }, 'category')
    // Sharing alone does not unlock capture.
    const sharingOnly = act(noticed, { type: 'SET_CONTRIBUTION', enabled: true })
    expectRejected(sharingOnly, { type: 'WIZARD_NEXT' }, 'category')
    // Capture alone advances while sharing stays off: the two choices can differ.
    const captureOnly = act(noticed, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true })
    expect(captureOnly.consent.priya.contribution).toBe(false)
    expect(act(captureOnly, { type: 'WIZARD_NEXT' }).ui.wizardStep).toBe('scope')
  })

  test('accepted path: finishing enrollment starts observation only for the categories chosen, sharing stays off', () => {
    const state = act(
      fresh(),
      { type: 'SET_NOTICE_EXPANDED', expanded: true },
      { type: 'ACKNOWLEDGE_NOTICE' },
      { type: 'WIZARD_NEXT' },
      { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true },
      { type: 'WIZARD_NEXT' },
    )
    expect(observationActive(state, 'priya')).toBe(false)
    const done = act(state, { type: 'CONSENT' })
    expect(done.phase).toBe('ST02')
    expect(observationActive(done, 'priya')).toBe(true)
    expect(done.consent.priya.contribution).toBe(false)
  })

  test('denied path: declining never starts observation and blocks the lifecycle step', () => {
    const declined = act(fresh(), { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }, { type: 'DECLINE_NOTICE' })
    expect(declined.consent.priya).toMatchObject({ noticeDeclined: true, noticeAccepted: false, workApplications: false, visualObservation: false })
    expectRejected(declined, { type: 'WIZARD_NEXT' }, 'notice')
    expectRejected(declined, { type: 'CONSENT' }, 'declined')
    expect(observationActive(declined, 'priya')).toBe(false)
    expect(declined.phase).toBe('ST01')
  })

  test('Back keeps earlier choices and is unavailable on the first step', () => {
    const second = act(fresh(), { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'WIZARD_NEXT' }, { type: 'SET_CONTRIBUTION', enabled: true })
    expectRejected(fresh(), { type: 'WIZARD_BACK' }, 'target')
    const back = act(second, { type: 'WIZARD_BACK' })
    expect(back.ui.wizardStep).toBe('notice')
    expect(back.consent.priya).toMatchObject({ noticeAccepted: true, contribution: true })
  })

  test('only an Employee drives the wizard', () => {
    const marcus = act(fresh(), { type: 'SELECT_ACTOR', personId: 'marcus' })
    expectRejected(marcus, { type: 'WIZARD_NEXT' }, 'actor')
  })
})

describe('overlays, search and the delete dialog', () => {
  test('one overlay at a time; closing the search clears its query', () => {
    const open = act(fresh(), { type: 'SET_OVERLAY', overlay: 'role' }, { type: 'SET_OVERLAY', overlay: 'search' }, { type: 'SET_SEARCH_QUERY', query: 'pause' })
    expect(open.ui).toMatchObject({ overlay: 'search', searchQuery: 'pause' })
    const closed = act(open, { type: 'SET_OVERLAY', overlay: null })
    expect(closed.ui).toMatchObject({ overlay: null, searchQuery: '' })
    expectRejected(closed, { type: 'SET_SEARCH_QUERY', query: 'x' }, 'target')
  })

  test('the companion menu belongs to an Employee', () => {
    expectRejected(act(fresh(), { type: 'SELECT_ACTOR', personId: 'daniel' }), { type: 'SET_OVERLAY', overlay: 'companion' }, 'actor')
  })

  test('deletion needs confirmation, can be cancelled, and removes only local history', () => {
    const state = fresh()
    expectRejected(state, { type: 'CONFIRM_DELETE_LOCAL_HISTORY' }, 'target')
    const asking = act(state, { type: 'OPEN_DELETE_DIALOG' })
    expect(act(asking, { type: 'CANCEL_DELETE' }).ui).toMatchObject({ deleteDialog: 'closed', localHistoryDeleted: false })
    const deleted = act(asking, { type: 'CONFIRM_DELETE_LOCAL_HISTORY' })
    expect(deleted.ui).toMatchObject({ deleteDialog: 'closed', localHistoryDeleted: true })
    // Consent, contribution and lifecycle are untouched by a local deletion.
    expect({ ...deleted, ui: state.ui, step: state.step, rejection: state.rejection }).toEqual(state)
  })
})

describe('APP-11 tabs and APP-12 desktop foreground', () => {
  test('selecting a tab changes only the view and Back returns through history', () => {
    const state = reconstruct('ST02')
    const netsuite = act(state, { type: 'SELECT_APP_TAB', tab: 'netsuite' })
    const slack = act(netsuite, { type: 'SELECT_APP_TAB', tab: 'slack' })
    expect(slack.ui).toMatchObject({ activeTab: 'slack', tabHistory: ['gmail', 'netsuite'] })
    expect(act(slack, { type: 'BROWSER_BACK' }).ui.activeTab).toBe('netsuite')
    expect({ ...slack, ui: state.ui, step: state.step }).toEqual(state)
    expectRejected(state, { type: 'BROWSER_BACK' }, 'target')
  })

  test('re-selecting the active tab keeps history unchanged', () => {
    const same = act(fresh(), { type: 'SELECT_APP_TAB', tab: 'gmail' })
    expect(same.ui.tabHistory).toEqual([])
  })

  test('the excluded window is a foreground state, not captured evidence', () => {
    const excluded = act(reconstruct('ST02'), { type: 'SET_FOREGROUND', window: 'excluded' })
    expect(excluded.ui.foreground).toBe('excluded')
    expect(excluded.audit).toEqual(reconstruct('ST02').audit)
  })
})
