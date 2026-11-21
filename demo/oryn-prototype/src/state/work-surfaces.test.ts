import { describe, expect, test } from 'bun:test'
import { createInitialState } from './initial'
import { reconstruct } from './script'
import { hudKind, recordingActive } from './selectors'
import { act, expectRejected } from './test-helpers'
import type { Action, State } from './types'

/** BOB-05 presentation slice: the work applications, the SC04 card and the SC11 deadline draft. */

const business = (state: State) => ({
  phase: state.phase,
  consent: state.consent,
  commitment: state.commitment,
  approval: state.approval,
  readback: state.readback,
  job: state.job,
  incident: state.incident,
  agent: state.agent,
  evaluations: state.evaluations,
  audit: state.audit,
  selectedCase: state.selectedCase,
})

const MEETING = 'zoom-kestrel'
const enrolled = reconstruct('ST02')
const consented = act(enrolled, { type: 'GRANT_MEETING_CONSENT', meetingId: MEETING })

describe('work screens are free before Oryn observes anything', () => {
  test('SC05 to SC09 open at ST01 and bring their own tab forward; SC04 still needs the confirmed commitment', () => {
    const start = createInitialState()
    expect(start.phase).toBe('ST01')
    const tabs = { SC05: 'gmail', SC06: 'netsuite', SC07: 'tracker', SC08: 'slack', SC09: 'zoom' } as const
    for (const [screen, tab] of Object.entries(tabs)) {
      const opened = act(start, { type: 'OPEN_SCREEN', screen: screen as keyof typeof tabs })
      expect(opened.route).toBe(screen as keyof typeof tabs)
      expect(opened.ui.activeTab).toBe(tab)
    }
    expectRejected(reconstruct('ST03'), { type: 'OPEN_SCREEN', screen: 'SC04' }, 'route')
    expect(act(reconstruct('ST04'), { type: 'OPEN_SCREEN', screen: 'SC04' }).ui.activeTab).toBe('netsuite')
  })

  test('opening the screen of the tab already shown keeps the tab history unchanged', () => {
    const opened = act(createInitialState(), { type: 'OPEN_SCREEN', screen: 'SC05' })
    expect(opened.ui.tabHistory).toEqual([])
  })
})

describe('one record drives the message, its document and the bill together', () => {
  test('opening a message selects its record, closes any document and returns to the inbox on back', () => {
    const open = act(createInitialState(), { type: 'OPEN_MESSAGE', record: 'INV-48210' })
    expect(open.ui.app).toMatchObject({ record: 'INV-48210', mail: 'message', attachment: false, documentView: 'single' })
    const doc = act(open, { type: 'OPEN_ATTACHMENT' })
    expect(doc.ui.app.attachment).toBe(true)
    const bill = act(doc, { type: 'OPEN_BILL', record: 'INV-48219' })
    expect(bill.ui.app).toMatchObject({ record: 'INV-48219', erp: 'bill', attachment: false })
    expect(act(doc, { type: 'CLOSE_MESSAGE' }).ui.app).toMatchObject({ mail: 'inbox', attachment: false })
  })

  test('an attachment needs an open message, and a document needs to be open to close or compare', () => {
    const start = createInitialState()
    expectRejected(start, { type: 'OPEN_ATTACHMENT' }, 'target')
    expectRejected(start, { type: 'CLOSE_ATTACHMENT' }, 'target')
    expectRejected(start, { type: 'CLOSE_MESSAGE' }, 'target')
    expectRejected(start, { type: 'SET_DOCUMENT_VIEW', view: 'compare' }, 'target')
  })

  test('only the Kestrel document compares an earlier and a current layout', () => {
    const brightwater = act(createInitialState(), { type: 'OPEN_MESSAGE', record: 'INV-48219' }, { type: 'OPEN_ATTACHMENT' })
    expectRejected(brightwater, { type: 'SET_DOCUMENT_VIEW', view: 'compare' }, 'record')
    const kestrel = act(createInitialState(), { type: 'OPEN_MESSAGE', record: 'INV-48231' }, { type: 'OPEN_ATTACHMENT' }, { type: 'SET_DOCUMENT_VIEW', view: 'compare' })
    expect(kestrel.ui.app.documentView).toBe('compare')
    // Moving to another record leaves the compare view behind.
    expect(act(kestrel, { type: 'OPEN_BILL', record: 'INV-48219' }).ui.app.documentView).toBe('single')
  })

  test('an unknown record is refused', () => {
    expectRejected(createInitialState(), { type: 'OPEN_MESSAGE', record: 'INV-99999' as never }, 'record')
  })

  test('selecting records, views and tracker cells never changes business state', () => {
    const before = business(enrolled)
    const after = act(
      enrolled,
      { type: 'OPEN_MESSAGE', record: 'INV-48203' },
      { type: 'OPEN_ATTACHMENT' },
      { type: 'OPEN_BILL', record: 'INV-48219' },
      { type: 'OPEN_ERP_VIEW', view: 'vendors' },
      { type: 'OPEN_VENDOR', vendorId: 'kestrel' },
      { type: 'FOCUS_TRACKER_CELL', invoice: 'INV-48220', column: 'state' },
      { type: 'SELECT_CASE', caseId: 'INV-48215' },
    )
    expect(business({ ...after, selectedCase: before.selectedCase })).toEqual(before)
    expect(after.ui.app.trackerFocus).toEqual({ invoice: 'INV-48220', column: 'state' })
  })
})

describe('meeting consent decides whether anything is captured from the call', () => {
  test('no recording and no quotation exist before this meeting is consented to', () => {
    expect(recordingActive(enrolled, 'priya')).toBe(false)
    expectRejected(enrolled, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' }, 'meetingConsent')
  })

  test('declining leaves capture off for the call', () => {
    const declined = act(enrolled, { type: 'DENY_MEETING_CONSENT', meetingId: MEETING })
    expect(recordingActive(declined, 'priya')).toBe(false)
    expectRejected(declined, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' }, 'meetingConsent')
  })

  test('consent starts the recording, and quotes appear in speaking order only', () => {
    expect(recordingActive(consented, 'priya')).toBe(true)
    expectRejected(consented, { type: 'SHOW_MEETING_QUOTE', speaker: 'priya' }, 'meeting')
    const dana = act(consented, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' })
    expect(dana.ui.app.meeting.quote).toBe('dana')
    expectRejected(dana, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' }, 'meeting')
    const both = act(dana, { type: 'SHOW_MEETING_QUOTE', speaker: 'priya' })
    expect(both.ui.app.meeting.quote).toBe('priya')
    expectRejected(both, { type: 'SHOW_MEETING_QUOTE', speaker: 'priya' }, 'meeting')
  })

  test('pausing screen observation stops the meeting recording indicator too, and resuming does not start a meeting that was never consented', () => {
    const paused = act(consented, { type: 'PAUSE_OBSERVATION' })
    expect(recordingActive(paused, 'priya')).toBe(false)
    const generic = act(enrolled, { type: 'PAUSE_OBSERVATION' }, { type: 'RESUME_OBSERVATION' })
    expect(generic.consent.priya.meetings[MEETING]).toBe('absent')
    expect(recordingActive(generic, 'priya')).toBe(false)
  })

  test('an ended meeting takes no further consent or quotation', () => {
    const ended = act(consented, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' }, { type: 'END_MEETING' })
    expect(ended.ui.app.meeting.ended).toBe(true)
    expectRejected(ended, { type: 'SHOW_MEETING_QUOTE', speaker: 'priya' }, 'meeting')
    expectRejected(ended, { type: 'END_MEETING' }, 'meeting')
    expectRejected(act(enrolled, { type: 'END_MEETING' }), { type: 'GRANT_MEETING_CONSENT', meetingId: MEETING }, 'meeting')
  })

  test('only an Employee consents to capture of their own meeting', () => {
    expectRejected(act(enrolled, { type: 'SELECT_ACTOR', personId: 'marcus' }), { type: 'GRANT_MEETING_CONSENT', meetingId: MEETING }, 'actor')
  })
})

describe('SC11 deadline draft stays separate from the commitment', () => {
  const review = act(consented, { type: 'REVIEW_MEETING' })

  test('a draft belongs to the proposal and never changes it until saved', () => {
    expect(review.commitment).toMatchObject({ status: 'proposed', due: 'Fri 17:00', confirmedDue: null })
    const drafting = act(review, { type: 'DRAFT_DEADLINE', text: 'Fri 12' })
    expect(drafting.ui.deadlineDraft).toBe('Fri 12')
    expect(drafting.commitment).toEqual(review.commitment)
    const saved = act(drafting, { type: 'EDIT_COMMITMENT', due: 'Fri 12:00' })
    expect(saved.ui.deadlineDraft).toBeNull()
    expect(saved.commitment).toMatchObject({ status: 'edited', due: 'Fri 12:00', confirmedDue: null })
  })

  test('confirming records the corrected deadline, which the reminder reads', () => {
    const confirmed = act(review, { type: 'EDIT_COMMITMENT', due: 'Fri 12:00' }, { type: 'CONFIRM_COMMITMENT' })
    expect(confirmed.commitment).toMatchObject({ status: 'confirmed', due: 'Fri 12:00', confirmedDue: 'Fri 12:00' })
    expect(confirmed.ui.deadlineDraft).toBeNull()
  })

  test('only the commitment owner drafts, and only while a commitment is proposed', () => {
    expectRejected(act(review, { type: 'SELECT_ACTOR', personId: 'marcus' }), { type: 'DRAFT_DEADLINE', text: 'Fri 09:00' }, 'actor')
    expectRejected(enrolled, { type: 'DRAFT_DEADLINE', text: 'Fri 09:00' }, 'commitment')
    expect(act(enrolled, { type: 'DRAFT_DEADLINE', text: null }).ui.deadlineDraft).toBeNull()
  })
})

describe('SC04 shows one card at a time and never resolves the work it points at', () => {
  const confirmed = act(consented, { type: 'REVIEW_MEETING' }, { type: 'EDIT_COMMITMENT', due: 'Fri 12:00' }, { type: 'CONFIRM_COMMITMENT' })
  const atKestrel = act(confirmed, { type: 'OPEN_SCREEN', screen: 'SC06' }, { type: 'OPEN_ERP_VIEW', view: 'vendors' }, { type: 'OPEN_VENDOR', vendorId: 'kestrel' })

  test('the reminder needs the confirmed commitment and the Kestrel vendor record', () => {
    expect(hudKind(atKestrel)).toBe('commitment')
    expect(hudKind(act(atKestrel, { type: 'OPEN_VENDOR', vendorId: 'brightwater' }))).toBeNull()
    expect(hudKind(act(atKestrel, { type: 'OPEN_BILL', record: 'INV-48231' }))).toBeNull()
    expect(hudKind(act(atKestrel, { type: 'SELECT_APP_TAB', tab: 'gmail' }))).toBeNull()
    const proposed = act(consented, { type: 'REVIEW_MEETING' })
    expect(hudKind(act(proposed, { type: 'OPEN_SCREEN', screen: 'SC06' }, { type: 'OPEN_VENDOR', vendorId: 'kestrel' }))).toBeNull()
  })

  test('dismissing hides this card only, and opening the context again shows it once more', () => {
    const dismissed = act(atKestrel, { type: 'DISMISS_HUD' })
    expect(hudKind(dismissed)).toBeNull()
    expect(dismissed.ui.app.hud.dismissed).toEqual(['commitment'])
    expect(business(dismissed)).toEqual(business(atKestrel))
    expect(hudKind(act(dismissed, { type: 'OPEN_VENDOR', vendorId: 'brightwater' }, { type: 'OPEN_VENDOR', vendorId: 'kestrel' }))).toBe('commitment')
    expectRejected(act(atKestrel, { type: 'OPEN_VENDOR', vendorId: 'brightwater' }), { type: 'DISMISS_HUD' }, 'guide')
  })

  test('the peer fix belongs to SC04 and Guide Me advances only by explicit steps', () => {
    const fix = act(confirmed, { type: 'OPEN_SCREEN', screen: 'SC04' })
    expect(hudKind(fix)).toBe('peerFix')
    expectRejected(fix, { type: 'GUIDE_NEXT' }, 'guide')
    const one = act(fix, { type: 'OPEN_GUIDE' })
    expect(one.ui.app.hud.guide).toBe(1)
    expectRejected(one, { type: 'OPEN_GUIDE' }, 'guide')
    expectRejected(one, { type: 'GUIDE_BACK' }, 'guide')
    const three = act(one, { type: 'GUIDE_NEXT' }, { type: 'GUIDE_NEXT' })
    expect(three.ui.app.hud.guide).toBe(3)
    expectRejected(three, { type: 'GUIDE_NEXT' }, 'guide')
    expect(act(three, { type: 'GUIDE_BACK' }).ui.app.hud.guide).toBe(2)
    expectRejected(one, { type: 'GUIDE_DONE' }, 'guide')
    const done = act(three, { type: 'GUIDE_DONE' })
    expect(done.ui.app.hud.guide).toBe('completed')
    // Guidance is published knowledge: completing it leaves the case unresolved and verifies nothing.
    expect(business(done)).toEqual(business(fix))
    expect(done.audit).toEqual(fix.audit)
  })

  test('dismissing the peer fix closes an open guide and leaves the work unresolved', () => {
    const open = act(confirmed, { type: 'OPEN_SCREEN', screen: 'SC04' }, { type: 'OPEN_GUIDE' }, { type: 'GUIDE_NEXT' })
    const dismissed = act(open, { type: 'DISMISS_HUD' })
    expect(dismissed.ui.app.hud).toMatchObject({ guide: 'closed', dismissed: ['peerFix'] })
    expect(hudKind(dismissed)).toBeNull()
    expect(business(dismissed)).toEqual(business(open))
  })

  test('the card can be placed upper or lower without changing what it says', () => {
    const lower = act(atKestrel, { type: 'PLACE_HUD', placement: 'lower' })
    expect(lower.ui.app.hud.placement).toBe('lower')
    expect(hudKind(lower)).toBe('commitment')
  })
})

describe('presentation actions are deterministic', () => {
  test('replaying the same ordered actions gives equal state', () => {
    const script: readonly Action[] = [
      { type: 'OPEN_SCREEN', screen: 'SC05' },
      { type: 'OPEN_MESSAGE', record: 'INV-48203' },
      { type: 'OPEN_ATTACHMENT' },
      { type: 'OPEN_SCREEN', screen: 'SC09' },
      { type: 'GRANT_MEETING_CONSENT', meetingId: MEETING },
    ]
    expect(act(enrolled, ...script)).toEqual(act(enrolled, ...script))
  })
})
