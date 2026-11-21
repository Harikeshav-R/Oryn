import type { Rect, Vec2 } from '@/film'
import type { Action } from '@/state'
import { GMAIL_ANCHOR_RECTS } from './apps/gmail-layout'
import { OPEN, centre, cut, entryEvery, go, named, place } from './clip-spec-kit'
import type { ClipSpec } from './clip-specs'
import { JOBS_ANCHOR_RECTS, JOB_ANCHOR_RECTS, JOB_SUMMARY_ANCHOR_RECTS } from './job-layout'

/**
 * BOB-09 launch clip (lk-l9-run, L-109 to L-126, 01:46 to 02:03.50, 525 frames): the job starts, runs its
 * eleven cases, pauses at the one approval, is decided, read back independently, and summarised. It ends in the
 * middle of L-126: f510-524 are the first half of that entry. `scripts/author-product-clips.ts` turns this spec
 * into `film/launch/lk-l9-run.timeline.json`. Read the conventions in `clip-specs.ts` and `clip-specs-work.ts` first.
 *
 * - The clip opens on ST09 for Marcus with the gate not yet approved: `startAt: 'ST09'` reconstructs the
 *   prerequisites without `APPROVE_RELEASE` and `CONFIRM_SCOPE`, so the f0 cut replays what `lk-l8-simulate` did
 *   (release approved, scope confirmed, the eleven invoices confirmed). They are prerequisites, not storyboard actions.
 * - Four authorities stay separate events at separate frames: the selection (`CONFIRM_SELECTION`, replayed at f0),
 *   the start (`RELEASE_AND_START`, f15, from the open `Confirm job scope` dialog), the decision (`SELECT_ACTOR daniel`
 *   at f150, then `APPROVE` at f255) and the independent readback (`VERIFY_READBACK`, f285, thirty frames after the
 *   approval, never the same frame). Only the readback moves the counts, 7 / 2 / 1 / 1 to 8 / 2 / 0 / 1.
 * - `job:awaiting-verification` is on from the approval to the readback. The stage layer reads it for the pending label.
 * - L-122 shows the stored pre-approval snapshot (`SET_JOB_VIEW snapshot: 'before'`, labelled `Before approval`)
 *   although the readback has already landed; L-123 swaps to the current one in 150 ms. The reducer stays at ST11.
 * - The pointer is hidden where the storyboard says CURSOR none. Cyan exists only while the job runs (f15-f149).
 * - The stopped job holds no retry control. `NEXT_CYCLE_INCIDENT` is never filmed here: it flips the theme inside
 *   `lk-l10-heal`. L-125 opens the Kestrel document; the three-card composition and the dark wipe of L-126 belong to
 *   the stage layer and to the next clip.
 */

const J = JOBS_ANCHOR_RECTS
const W = JOB_ANCHOR_RECTS
const S = JOB_SUMMARY_ANCHOR_RECTS

const APPROVAL = 'INV-48219'
const UNKNOWN = 'INV-48220'

const evaluate = (invoice: string): Action => ({ type: 'EVALUATE_CASE', invoice })
const selectCase = (caseId: string): Action => ({ type: 'SELECT_CASE', caseId })
const view = (patch: Omit<Extract<Action, { type: 'SET_JOB_VIEW' }>, 'type'>): Action => ({ type: 'SET_JOB_VIEW', ...patch })

/** A point inside a rectangle at fractions of its width and height. */
const inside = (rect: Rect, fx: number, fy: number): Vec2 => [Math.round(rect.x + rect.width * fx), Math.round(rect.y + rect.height * fy)]

/** The SC22 to SC24 anchor rectangle by name; the row anchors are open-ended, so a missing name is an authoring error. */
const jobRect = (name: string): Rect => {
  const rect = W[name]
  if (!rect) throw new Error(`No job anchor named ${name}.`)
  return rect
}

export const LK_L9: ClipSpec = {
  cut: 'launch',
  clipId: 'lk-l9-run',
  scene: 'L9',
  filmStartFrame: 106 * 30,
  durationFrames: 525,
  seed: 20261213,
  startAt: 'ST09',
  start: centre(J['confirm-selection']),
  anchors: {
    ...J,
    ...W,
    ...S,
    ...named(GMAIL_ANCHOR_RECTS, ['handling-fee', 'document-viewer', 'document-page', 'invoice-id', 'po-number', 'invoice-total', 'message-pane', 'attachment']),
  },
  moves: [
    // L-109 Preflight: the pointer travels to `Start job` (500 ms) and presses it at f15. No target: the dialog closes with the press.
    go(0, 15, centre(J['start-job']), undefined, [{ type: 'RELEASE_AND_START' }]),
    // L-110 to L-113: no pointer. L-114 Approval queue: the pointer opens the Brightwater approval drawer (500 ms).
    go(150, 15, centre(jobRect('approval-row')), 'approval-row', [selectCase(APPROVAL), OPEN('SC23')]),
    // L-115 Evidence: the pointer hovers the evidence link.
    go(180, 12, centre(jobRect('approval-evidence')), 'approval-evidence'),
    // L-116 Before and after: the pointer points left, then right (600 ms in all).
    go(210, 12, inside(jobRect('approval-diff'), 0.25, 0.5), 'approval-diff'),
    go(224, 14, inside(jobRect('approval-diff'), 0.75, 0.5), 'approval-diff'),
    // L-117 Approve: Daniel presses `Approve` (500 ms); the approval is recorded, the outcome is not.
    go(240, 15, centre(jobRect('approve')), 'approve', [{ type: 'APPROVE', invoice: APPROVAL }]),
    place(270, centre(jobRect('approve'))),
    // L-118 Readback: no pointer. L-119 Unknown record: the pointer opens INV-48220's drawer.
    go(300, 15, centre(jobRect('unknown-row')), 'unknown-row', [selectCase(UNKNOWN), OPEN('SC24')]),
    // L-120 Hold: the pointer hovers `Investigate outcome` and takes no action.
    go(330, 15, centre(jobRect('investigate')), 'investigate'),
    place(360, centre(jobRect('investigate'))),
    // L-121 to L-123: no pointer. L-124 Job and cases: the pointer hovers the unknown count.
    go(450, 15, centre(S['summary-unknown']), 'summary-unknown'),
    place(480, centre(S['summary-unknown'])),
  ],
  actions: [
    // L-109: the f0 prerequisites replay lk-l8, then the preflight dialog opens over SC21.
    cut(0, { type: 'APPROVE_RELEASE' }, { type: 'CONFIRM_SCOPE' }, { type: 'CONFIRM_SELECTION' }, OPEN('SC21'), { type: 'OPEN_JOB_SCOPE' }),
    // L-110 to L-113: the job table, and the cases settle in table order with a 100 ms stagger inside each entry.
    cut(30, OPEN('SC22')),
    cut(33, evaluate('INV-48210')),
    cut(36, evaluate('INV-48211')),
    cut(63, evaluate('INV-48212')),
    cut(66, evaluate('INV-48213')),
    cut(69, evaluate('INV-48214')),
    cut(93, evaluate('INV-48215')),
    cut(96, evaluate('INV-48218')),
    cut(123, evaluate('INV-48216')),
    cut(126, evaluate('INV-48217')),
    // L-114: the last two cases settle, the job pauses for the approval and Daniel's viewpoint is selected.
    cut(150, evaluate(APPROVAL), evaluate(UNKNOWN), { type: 'PAUSE_FOR_APPROVAL' }, { type: 'SELECT_ACTOR', personId: 'daniel' }, OPEN('SC22')),
    // L-115: the evidence disclosure.
    cut(180, view({ evidence: true })),
    // L-118: the independent readback, a separate event thirty frames after the approval.
    cut(285, { type: 'VERIFY_READBACK', invoice: APPROVAL, result: 'verified' }),
    // L-119: the drawer closes before the unknown case's drawer opens.
    cut(300, OPEN('SC22')),
    // L-120: the tip on the held case.
    cut(345, view({ tip: true })),
    // L-122 Initial summary: the stored pre-approval snapshot. L-123: the current one after the readback.
    cut(390, OPEN('SC25'), view({ snapshot: 'before' })),
    cut(420, view({ snapshot: 'current' })),
    // L-125 Next cycle: the Kestrel invoice document, without the incident (it belongs to lk-l10-heal).
    cut(480, OPEN('SC05'), { type: 'OPEN_MESSAGE', record: 'INV-48231' }, { type: 'OPEN_ATTACHMENT' }),
  ],
  outlines: [
    // L-125: the handling fee gets a 1px ink rectangle once the document has settled (never cyan).
    { frame: 495, target: 'handling-fee', mode: 'selected' },
  ],
  overlays: [
    // L-117 to L-118: the approval is recorded and not yet verified, until the readback lands.
    { frame: 255, id: 'job:awaiting-verification', visible: true },
    { frame: 285, id: 'job:awaiting-verification', visible: false },
  ],
  pointer: [
    { frame: 0, visible: true },
    { frame: 30, visible: false },
    { frame: 150, visible: true },
    { frame: 270, visible: false },
    { frame: 300, visible: true },
    { frame: 360, visible: false },
    { frame: 450, visible: true },
    { frame: 480, visible: false },
    // L-126 (first half) carries no product action: an explicit hidden pointer keeps its entry in the timeline.
    { frame: 510, visible: false },
  ],
  entryAt: entryEvery('L', 109, 30),
}
