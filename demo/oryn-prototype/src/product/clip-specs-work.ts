import { typingCompleteFrame } from '@/film'
import type { Rect, Vec2 } from '@/film'
import type { Action } from '@/state'
import { ERP_ANCHOR_RECTS, hudAnchorRects } from './apps/erp-layout'
import { GMAIL_ANCHOR_RECTS } from './apps/gmail-layout'
import { SLACK_ANCHOR_RECTS } from './apps/slack-layout'
import { TRACKER_ANCHOR_RECTS } from './apps/tracker-layout'
import { ZOOM_ANCHOR_RECTS } from './apps/zoom-layout'
import type { ClipSpec, TypeSpec } from './clip-specs'
import { MEETING_REVIEW_ANCHOR_RECTS } from './meeting-review-layout'
import { DISCOVERY_ANCHOR_RECTS } from './discovery-layout'
import { OPEN, centre, cut, entryEvery, go, named, place } from './clip-spec-kit'

/**
 * BOB-05 clip specs (hk-h2-problem, hk-h4b-observe, lk-l2-chaos, lk-l5-observe): what each work
 * surface clip does, declared once. `scripts/author-product-clips.ts` turns a spec into
 * `film/<cut>/<clip-id>.timeline.json` and adds the `anchor:<name>` visibility overlays from the
 * rendered markup. Read the conventions in `clip-specs.ts` first.
 *
 * Conventions specific to these clips:
 * - Every storyboard "hard cut" is a `Cut` of reducer actions on its entry's first frame (an
 *   `OPEN_SCREEN` brings that application's tab forward). Third-party mock apps have no reducer
 *   effect for a click, so those clicks are `inert` (an empty `click` list).
 * - A pointer `target` must stay visible, with the pointer visible, until the NEXT pointer event.
 *   So a cut that hides the current target is preceded in the same frame by a placed pointer
 *   (`place`, duration 0) at the same spot with no target, and a click on a control that disappears
 *   after the click (an inbox row, a vendor row) names no target.
 * - The pointer is hidden where the storyboard says CURSOR none and placed again where the next
 *   entry names a start point; the storyboard's start coordinates are honoured with placements, so
 *   a hard cut between applications does not draw a pointer sweeping across the cut.
 * - Entries that are stage compositions of several windows (a triptych, a "Why?" card with cropped
 *   apps) use frames of the same clip for each window; the frame map is in the README.
 */

/** The macOS tray status icon (APP-12), identical to the BOB-04 clips; the capture indicator stays in the chrome. */
const TRAY_ICON: Rect = { x: 1090, y: 4, width: 20, height: 20 }

const MESSAGE = (record: Extract<Action, { type: 'OPEN_MESSAGE' }>['record']): Action => ({ type: 'OPEN_MESSAGE', record })

const GMAIL = GMAIL_ANCHOR_RECTS
const ERP = ERP_ANCHOR_RECTS
/** The Confirm click: it confirms and enters ST04. The film holds the review for the storyboard's confirmed beat (H-068, L-055) with an explicit cut back to SC11; the clickable app follows the lifecycle route to SC13. */
const CONFIRM: readonly Action[] = [{ type: 'CONFIRM_COMMITMENT' }, OPEN('SC11')]
/** Enrollment as the hackathon and launch privacy clips leave it: notice acknowledged, work applications only, sharing never touched. */
const ENROLL: readonly Action[] = [{ type: 'ACKNOWLEDGE_NOTICE' }, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }, { type: 'CONSENT' }]
const TRACKER = TRACKER_ANCHOR_RECTS
const SLACK = SLACK_ANCHOR_RECTS
const ZOOM = ZOOM_ANCHOR_RECTS
const REVIEW = MEETING_REVIEW_ANCHOR_RECTS

const ATTACHMENT_POINT = centre(GMAIL.attachment)
/** The click lands anywhere in the banner; the anchored object is the banner so it stays visible after consent. */
const CONSENT_POINT = centre(ZOOM['consent-action'])
const CONFIRM_POINT = centre(REVIEW['confirm-commitment'])
const DEADLINE_RECT = REVIEW.deadline
/** Two points inside the deadline field: the pointer arrives at the first and clicks at the second. */
const DEADLINE_ARRIVE: Vec2 = [DEADLINE_RECT.x + 230, DEADLINE_RECT.y + 20]
const DEADLINE_CLICK: Vec2 = [DEADLINE_RECT.x + 190, DEADLINE_RECT.y + 20]
const PO_POINT: Vec2 = [820, 374]
const MATCH_POINT = centre(ERP['erp-match-action'])

const complete = (typed: TypeSpec): number => typingCompleteFrame({ type: 'type', seq: 0, ...typed })

// -- hk-h2-problem (H-014 to H-026, 00:26 to 00:52, 780 frames) -------------------------------

const H2_ROW_POINT: Vec2 = [700, centre(TRACKER['tracker-row-inv-48210'])[1]]

/**
 * The problem montage. The work applications are shown as the employee's own, before any Oryn
 * observation (state ST01: the tray reads "not capturing"). One invoice, INV-48210, crosses Gmail,
 * NetSuite and the tracker; INV-48231 (Kestrel layout v2) closes the clip. H-017 to H-022 are
 * stage cards: the product holds its last view with no pointer, except H-021 which needs the
 * pointer's inert click on an ERP control.
 */
const HK_H2: ClipSpec = {
  cut: 'hackathon',
  clipId: 'hk-h2-problem',
  scene: 'H2',
  filmStartFrame: 26 * 30,
  durationFrames: 780,
  seed: 20261201,
  start: [220, 250],
  anchors: {
    ...named(GMAIL, ['message-pane', 'attachment', 'document-viewer', 'document-page', 'invoice-id', 'po-number', 'invoice-total', 'handling-fee', 'invoice-v1']),
    ...named(ERP, ['erp-bill', 'erp-po', 'erp-invoice-total', 'po-total', 'erp-match-action']),
    ...named(TRACKER, ['tracker-grid', 'tracker-row-inv-48210', 'tracker-cell-inv-48210']),
    ...named(SLACK, ['slack-channel', 'slack-message-inv-48215', 'slack-message-inv-48218', 'slack-message-inv-48219']),
    'tray-icon': TRAY_ICON,
  },
  moves: [
    // H-014 Inbox: the pointer travels to the INV-48210 attachment; clicking it opens the document.
    go(0, 18, ATTACHMENT_POINT, 'attachment', [{ type: 'OPEN_ATTACHMENT' }]),
    // H-015 Cross-app work: the cut to NetSuite releases the attachment target; the pointer holds.
    place(60, ATTACHMENT_POINT),
    // H-016 Messages: the tracker is already on screen (H-015's sliver); the pointer returns at its start point and hovers the INV-48210 row. No click.
    place(120, [780, 350]),
    go(121, 17, H2_ROW_POINT, 'tracker-row-inv-48210'),
    place(150, H2_ROW_POINT),
    // H-021 False confidence: the pointer is back for one illustrative click on an ERP control (inert: no transaction).
    place(420, [940, 450]),
    go(421, 18, MATCH_POINT, 'erp-match-action', []),
    place(480, MATCH_POINT),
  ],
  actions: [
    cut(0, OPEN('SC05'), MESSAGE('INV-48210')),
    cut(60, OPEN('SC06')),
    cut(90, OPEN('SC07')),
    cut(150, OPEN('SC08')),
    cut(420, OPEN('SC06')),
    // H-023 Supplier changes format: Kestrel INV-48231 document, earlier and current layouts overlapping.
    cut(540, OPEN('SC05'), MESSAGE('INV-48231'), { type: 'OPEN_ATTACHMENT' }, { type: 'SET_DOCUMENT_VIEW', view: 'compare' }),
  ],
  outlines: [
    // The handling fee gets a 1px ink rectangle once the two sheets have settled (never cyan).
    { frame: 558, target: 'handling-fee', mode: 'selected' },
  ],
  // H-017 to H-020 and H-024 to H-026 are stage cards or stage compositions: no pointer (CURSOR none), tagged per entry.
  pointer: [
    { frame: 180, visible: false },
    { frame: 240, visible: false },
    { frame: 300, visible: false },
    { frame: 360, visible: false },
    { frame: 420, visible: true },
    { frame: 480, visible: false },
    { frame: 540, visible: false },
    { frame: 600, visible: false },
    { frame: 660, visible: false },
    { frame: 720, visible: false },
  ],
  entryAt: entryEvery('H', 14, 60),
}

// -- hk-h4b-observe (H-063 to H-069, 01:28 to 01:35, 210 frames) --------------------------------

const H4B_TYPE: TypeSpec = { frame: 150, target: 'deadline', text: 'Fri 12:00', charsPerSecond: 31, seed: 20261211, before: 'Fri 17:00', selectHoldFrames: 3 }
const H4B_EDIT = complete(H4B_TYPE)
const H4B_CONFIRM_DURATION = 11
const H4B_CONFIRMED = H4B_EDIT + H4B_CONFIRM_DURATION

/**
 * Priya's observed work: Demonstration D1 across Gmail, NetSuite and the tracker, the Kestrel call
 * with per-meeting consent, the SC11 review with the deadline corrected before an explicit Confirm,
 * and the reminder on the Kestrel vendor record. Enrollment replays at frame 0 exactly as H-057
 * to H-062 left it: work applications only, sharing off, observation active. The Sheets crop of
 * H-064 is the tracker view from frame 48; the reminder uses the corrected `Fri 12:00`.
 */
const HK_H4B: ClipSpec = {
  cut: 'hackathon',
  clipId: 'hk-h4b-observe',
  scene: 'H4b',
  filmStartFrame: 88 * 30,
  durationFrames: 210,
  seed: 20261202,
  start: [550, 250],
  anchors: {
    ...named(GMAIL, ['message-pane', 'attachment', 'document-viewer', 'document-page', 'invoice-id', 'po-number', 'invoice-total']),
    ...named(ERP, ['erp-bill', 'erp-po', 'erp-invoice-total', 'po-total', 'vendor-record', 'vendor-name', 'hud-reminder', 'hud-dismiss']),
    ...named(TRACKER, ['tracker-grid', 'tracker-row-inv-48203', 'tracker-cell-inv-48203']),
    ...named(ZOOM, ['meeting-consent', 'consent-action', 'recording-indicator', 'tile-dana', 'tile-priya', 'meeting-quote', 'quote-dana']),
    ...named(REVIEW, ['transcript', 'commitment-card', 'deadline', 'confirm-commitment', 'meeting-source', 'commitment-status', 'commitment-caveat']),
    'tray-icon': TRAY_ICON,
  },
  moves: [
    // H-063 Work in context: the pointer opens the D1 invoice document from its attachment.
    go(0, 15, ATTACHMENT_POINT, 'attachment', [{ type: 'OPEN_ATTACHMENT' }]),
    // H-064 Cross-app demonstration: NetSuite (the PO panel states no PO for D1), then the tracker row for the Sheets crop.
    place(30, [800, 310]),
    go(31, 14, PO_POINT, 'erp-po'),
    place(48, PO_POINT),
    // H-065 Separate meeting consent: the pointer selects Start for this meeting; the recording indicator follows only after it.
    place(60, [850, 110]),
    go(61, 16, CONSENT_POINT, 'meeting-consent', [{ type: 'GRANT_MEETING_CONSENT', meetingId: 'zoom-kestrel' }]),
    // H-066 Meeting context: no pointer while Dana's statement shows.
    place(90, CONSENT_POINT),
    // H-067 Review proposal: the pointer reaches the deadline field and clicks it (inert: it only focuses the field).
    place(120, [810, 442]),
    go(121, 15, DEADLINE_ARRIVE, 'deadline'),
    go(136, 11, DEADLINE_CLICK, 'deadline', []),
    // H-068 Change deadline: the typed correction saves, then the pointer clicks Confirm.
    go(H4B_EDIT, H4B_CONFIRM_DURATION, CONFIRM_POINT, 'confirm-commitment', CONFIRM),
    // H-069 Reminder: the pointer moves to the vendor name on the Kestrel record.
    place(180, [500, 300]),
    go(181, 15, centre(ERP['vendor-name']), 'vendor-name'),
  ],
  actions: [
    cut(0, ...ENROLL, OPEN('SC05'), MESSAGE('INV-48203')),
    cut(30, OPEN('SC06')),
    cut(48, OPEN('SC07'), { type: 'FOCUS_TRACKER_CELL', invoice: 'INV-48203', column: 'invoice' }),
    cut(60, OPEN('SC09')),
    cut(90, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' }),
    // The review opens on the proposal (`Fri 17:00`); nothing is confirmed until the explicit click.
    cut(120, { type: 'REVIEW_MEETING' }),
    cut(H4B_EDIT, { type: 'EDIT_COMMITMENT', due: 'Fri 12:00' }),
    // The reminder shows because the Kestrel vendor record is opened after the commitment is confirmed.
    cut(180, OPEN('SC06'), { type: 'OPEN_VENDOR', vendorId: 'kestrel' }),
  ],
  types: [H4B_TYPE],
  outlines: [
    { frame: 150, target: 'deadline', mode: 'focus' },
    { frame: H4B_CONFIRMED, target: null, mode: 'focus' },
  ],
  pointer: [
    { frame: 90, visible: false },
    { frame: 120, visible: true },
  ],
  entryAt: entryEvery('H', 63, 30),
}

// -- lk-l2-chaos (L-009 to L-024, 00:10 to 00:22, 360 frames) -----------------------------------

const lastOf = (frame: number): string => {
  // L-009 to L-016 are half-second entries (15 frames); L-017 onward are one second (30 frames).
  if (frame < 120) return `L-${String(9 + Math.floor(frame / 15)).padStart(3, '0')}`
  return `L-${String(17 + Math.floor((frame - 120) / 30)).padStart(3, '0')}`
}

const L2_PO_END: Vec2 = [848, 390]

/**
 * One invoice, INV-48219, scattered across tools. Gmail (L-009), the PDF crop (L-010), NetSuite
 * (L-011), the tracker (L-012), Slack (L-013), Zoom (L-015) and the ERP again for the oversized-pointer
 * click (L-017). L-014 (calendar), L-016's toast and L-018 onward are stage graphics: the product
 * holds the ERP, then Gmail with the document open as the foreground invoice (L-021 to L-023).
 */
const LK_L2: ClipSpec = {
  cut: 'launch',
  clipId: 'lk-l2-chaos',
  scene: 'L2',
  filmStartFrame: 10 * 30,
  durationFrames: 360,
  seed: 20261203,
  start: [980, 390],
  anchors: {
    ...named(GMAIL, ['message-pane', 'attachment', 'document-viewer', 'document-page', 'invoice-id', 'po-number', 'invoice-total']),
    ...named(ERP, ['erp-bill', 'erp-po', 'erp-invoice-total', 'po-total', 'erp-variance', 'erp-status']),
    ...named(TRACKER, ['tracker-grid', 'tracker-row-inv-48219', 'tracker-cell-inv-48219']),
    ...named(SLACK, ['slack-channel', 'slack-message-inv-48219', 'slack-link-inv-48219']),
    ...named(ZOOM, ['meeting-consent', 'tile-dana', 'tile-priya']),
    'tray-icon': TRAY_ICON,
  },
  moves: [
    // L-017 Click is not proof: the pointer travels 350 ms and presses on the PO panel. Inert: no transaction, no state change.
    place(120, [980, 390]),
    go(121, 11, L2_PO_END, 'erp-po', []),
    place(150, L2_PO_END),
  ],
  actions: [
    cut(0, OPEN('SC05'), MESSAGE('INV-48219')),
    cut(15, { type: 'OPEN_ATTACHMENT' }),
    cut(30, OPEN('SC06')),
    cut(45, OPEN('SC07')),
    cut(60, OPEN('SC08')),
    cut(90, OPEN('SC09')),
    cut(105, OPEN('SC06')),
    cut(180, OPEN('SC05')),
  ],
  outlines: [
    // L-010: a 150 ms ink outline follows the amount. L-012: one tracker cell is outlined for 150 ms.
    { frame: 15, target: 'invoice-total', mode: 'selected' },
    { frame: 29, target: null, mode: 'selected' },
    { frame: 45, target: 'tracker-cell-inv-48219', mode: 'selected' },
    { frame: 50, target: null, mode: 'selected' },
  ],
  // L-014 and L-018 to L-024 have no pointer (CURSOR none); the entries are tagged so each one is present in the timeline.
  pointer: [
    { frame: 75, visible: false },
    { frame: 120, visible: true },
    { frame: 150, visible: false },
    { frame: 210, visible: false },
    { frame: 240, visible: false },
    { frame: 270, visible: false },
    { frame: 300, visible: false },
    { frame: 330, visible: false },
  ],
  entryAt: lastOf,
}

// -- lk-l5-observe (L-047 to L-058, 00:44 to 00:56, 360 frames) --------------------------------

const L5_TYPE: TypeSpec = { frame: 211, target: 'deadline', text: 'Fri 12:00', charsPerSecond: 30, seed: 20261212, before: 'Fri 17:00' }
const L5_EDIT = complete(L5_TYPE)
const L5_ROW_POINT: Vec2 = [450, 328]
const L5_HUD = hudAnchorRects('lower')
const KESTREL_ROW: Rect = ERP['vendor-row-kestrel']

/**
 * The launch cut's observed demonstration: D1 in Gmail, NetSuite and the tracker, the Kestrel call
 * (consent, then both quotations), the SC11 review with the deadline corrected before Confirm, and
 * the reminder at the lower edge of the Kestrel vendor record. L-057 is a stage composition; L-058
 * is SC13 `Needs Review` (BOB-06): the pointer enters from (1100, 420) and travels to the candidate in 700 ms.
 */
const LK_L5: ClipSpec = {
  cut: 'launch',
  clipId: 'lk-l5-observe',
  scene: 'L5',
  filmStartFrame: 44 * 30,
  durationFrames: 360,
  seed: 20261204,
  start: [430, 330],
  anchors: {
    ...named(GMAIL, ['message-pane', 'attachment', 'document-viewer', 'document-page', 'invoice-id', 'po-number']),
    ...named(ERP, ['erp-bill', 'erp-po', 'erp-invoice-total', 'po-total', 'vendor-record', 'vendor-name']),
    'hud-reminder': L5_HUD['hud-reminder'],
    'hud-dismiss': L5_HUD['hud-dismiss'],
    ...named(TRACKER, ['tracker-grid', 'tracker-row-inv-48203', 'tracker-cell-inv-48203']),
    ...named(ZOOM, ['meeting-consent', 'consent-action', 'recording-indicator', 'tile-dana', 'tile-priya', 'meeting-quote', 'quote-dana', 'quote-priya']),
    ...named(REVIEW, ['transcript', 'commitment-card', 'deadline', 'confirm-commitment', 'meeting-source', 'commitment-status', 'commitment-caveat']),
    ...named(DISCOVERY_ANCHOR_RECTS, ['candidate-row', 'demonstrations']),
    'tray-icon': TRAY_ICON,
  },
  moves: [
    // L-047 First demonstration: the pointer clicks the D1 inbox row (no target: the list hides once the message opens), then the attachment.
    go(0, 11, L5_ROW_POINT, undefined, [MESSAGE('INV-48203')]),
    go(11, 15, ATTACHMENT_POINT, 'attachment', [{ type: 'OPEN_ATTACHMENT' }]),
    // L-048 Match: invoice field to PO field in 700 ms. No click.
    place(30, centre(ERP['erp-invoice-total'])),
    go(31, 21, PO_POINT, 'erp-po'),
    // L-049 Tracker: the pointer selects the D1 invoice cell.
    place(60, [700, 330]),
    go(61, 14, centre(TRACKER['tracker-cell-inv-48203']), 'tracker-cell-inv-48203', [{ type: 'FOCUS_TRACKER_CELL', invoice: 'INV-48203', column: 'invoice' }]),
    // L-050 Meeting consent.
    place(90, [850, 110]),
    go(91, 15, CONSENT_POINT, 'meeting-consent', [{ type: 'GRANT_MEETING_CONSENT', meetingId: 'zoom-kestrel' }]),
    // L-051 and L-052 have no pointer.
    place(120, CONSENT_POINT),
    // L-053 Review proposal: the pointer travels to the deadline field; L-054 clicks into it (inert).
    place(180, [760, 330]),
    go(181, 15, DEADLINE_ARRIVE, 'deadline'),
    go(199, 11, DEADLINE_CLICK, 'deadline', []),
    // L-055 Confirm.
    go(240, 15, CONFIRM_POINT, 'confirm-commitment', CONFIRM),
    // L-056 Contextual reminder: the pointer opens the Kestrel vendor record (no target: the list hides), then rests.
    place(270, [500, 300]),
    go(271, 11, centre(KESTREL_ROW), undefined, [{ type: 'OPEN_VENDOR', vendorId: 'kestrel' }]),
    // L-058 Discovery inbox: the pointer enters from (1100, 420) and reaches the candidate row in 700 ms. No click.
    place(330, [1100, 420]),
    go(331, 21, centre(DISCOVERY_ANCHOR_RECTS['candidate-row']), 'candidate-row'),
  ],
  actions: [
    // The inbox opens with the D1 row current, so the click reads as choosing the message that is already highlighted.
    cut(0, ...ENROLL, OPEN('SC05'), MESSAGE('INV-48203'), { type: 'CLOSE_MESSAGE' }),
    cut(30, OPEN('SC06')),
    cut(60, OPEN('SC07')),
    cut(90, OPEN('SC09')),
    cut(120, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' }),
    cut(150, { type: 'SHOW_MEETING_QUOTE', speaker: 'priya' }),
    cut(180, { type: 'REVIEW_MEETING' }),
    cut(L5_EDIT, { type: 'EDIT_COMMITMENT', due: 'Fri 12:00' }),
    // The reminder sits at the lower edge of the vendor record and enters slowly (500 ms, 20 px from the right).
    cut(270, OPEN('SC06'), { type: 'OPEN_ERP_VIEW', view: 'vendors' }, { type: 'PLACE_HUD', placement: 'lower', motion: 'long' }),
    // L-058 the inbox opens on the candidate, Needs Review. Priya's own contribution is only observed (sharing is off in this cut), so the rows read Observed.
    cut(330, OPEN('SC13')),
  ],
  types: [L5_TYPE],
  outlines: [
    { frame: 211, target: 'deadline', mode: 'focus' },
    { frame: 255, target: null, mode: 'focus' },
  ],
  pointer: [
    { frame: 120, visible: false },
    { frame: 180, visible: true },
    { frame: 300, visible: false },
    { frame: 330, visible: true },
  ],
  entryAt: entryEvery('L', 47, 30),
}

export const WORK_CLIP_SPECS: readonly ClipSpec[] = [HK_H2, HK_H4B, LK_L2, LK_L5]

