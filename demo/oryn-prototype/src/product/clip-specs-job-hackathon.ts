import type { Rect } from '@/film'
import type { Action } from '@/state'
import { GMAIL_ANCHOR_RECTS } from './apps/gmail-layout'
import { OPEN, centre, cut, entryEvery, go, named, place } from './clip-spec-kit'
import type { ClipSpec } from './clip-specs'
import { JOBS_ANCHOR_RECTS, JOB_ANCHOR_RECTS, JOB_SUMMARY_ANCHOR_RECTS } from './job-layout'
import { SCOPE_ANCHOR_RECTS } from './scope-layout'

/**
 * BOB-09 clip spec (hk-h4f-job, H-092 to H-102, 01:57 to 02:08, 330 frames): the queue is started, the eleven
 * cases are evaluated independently, the job stops as `Partially Complete` with 7 / 2 / 1 / 1, the unknown case
 * is shown held, Daniel decides the one approval, the independent readback lands as a separate later event
 * (8 / 2 / 0 / 1), the unknown stays held with no retry, and the next supplier layout opens. Declared once;
 * `scripts/author-product-clips.ts` turns it into `film/hackathon/hk-h4f-job.timeline.json` and adds the
 * `anchor:<name>` visibility overlays from the rendered markup. Read the conventions in `clip-specs.ts` and
 * `clip-specs-work.ts` first.
 *
 * The clip starts at ST09 (SC18's gate): the canonical prerequisites replay up to the first entry of ST09 as
 * Marcus without the owner approval and the scope confirmation, so those two are film events on f0 (`cut(0)`).
 * The fixed selection is reconstructed at f0. The operator opens scope at f11 and starts at f34,
 * leaving the dialog visible into H-093 before execution begins.
 *
 * Authorization and verification are separate events on separate frames: the decision (`SELECT_ACTOR daniel`
 * at f180, `APPROVE` at f225) never moves the verified count; the `job:awaiting-verification` overlay is on
 * from the APPROVE landing to the independent `VERIFY_READBACK` (f250), and only that action moves the counts.
 * Cyan only while `running.job` (f34 to the `PAUSE_FOR_APPROVAL` at f120); the stopped job is neutral and no
 * control retries a case. INV-48220 is never decided: no `APPROVE`, `VERIFY_READBACK` or resubmission names it.
 */

const GMAIL = GMAIL_ANCHOR_RECTS
const J = JOB_ANCHOR_RECTS
const S = JOB_SUMMARY_ANCHOR_RECTS

const RECTS: Readonly<Record<string, Rect>> = {
  ...JOBS_ANCHOR_RECTS,
  ...JOB_ANCHOR_RECTS,
  ...JOB_SUMMARY_ANCHOR_RECTS,
  ...SCOPE_ANCHOR_RECTS,
  ...named(GMAIL, ['message-pane', 'attachment', 'document-viewer', 'document-page', 'invoice-id', 'po-number', 'invoice-total', 'handling-fee', 'invoice-v1']),
}

const START_JOB_POINT = centre(JOBS_ANCHOR_RECTS['start-job'])
/** The pointer's x on the case table: a hover inside the row, left of the status column's centre. */
const ROW_X = 740
const jobRect = (name: string): Rect => {
  const rect = J[name]
  if (!rect) throw new Error(`No job anchor ${name}`)
  return rect
}
const rowPoint = (name: string): [number, number] => [ROW_X, centre(jobRect(name))[1]]
const APPROVE_POINT = centre(jobRect('approve'))
const INVESTIGATE_POINT = centre(jobRect('investigate'))

const evaluate = (invoice: string): Action => ({ type: 'EVALUATE_CASE', invoice })
const SELECT = (caseId: string): Action => ({ type: 'SELECT_CASE', caseId })
const MESSAGE: Action = { type: 'OPEN_MESSAGE', record: 'INV-48231' }

export const HK_H4F: ClipSpec = {
  cut: 'hackathon',
  clipId: 'hk-h4f-job',
  scene: 'H4f',
  filmStartFrame: 117 * 30,
  durationFrames: 330,
  seed: 20261212,
  startAt: 'ST09',
  start: centre(SCOPE_ANCHOR_RECTS.deploy),
  anchors: RECTS,
  moves: [
    // Scope opens first; the separate start click lands in H-093 after a readable preflight beat.
    go(0, 11, [1110, 170], undefined, [{ type: 'OPEN_JOB_SCOPE' }]),
    go(18, 16, START_JOB_POINT, undefined, [{ type: 'RELEASE_AND_START' }]),
    go(35, 15, rowPoint('case-row-inv-48210'), 'case-row-inv-48210'),
    // H-094 Verified: the pointer holds on the first verified row (no pointer event: the previous target holds).
    // H-095 Exceptions: the pointer travels to the first escalated row.
    go(90, 15, rowPoint('case-row-inv-48215'), 'case-row-inv-48215'),
    // H-096 Approval and unknown: the summary of the stopped job; the pointer hovers its approval card.
    go(120, 15, centre(S['summary-approval']), 'summary-approval'),
    // H-097 Unknown is not success: a press on the unknown card filters to it, selects INV-48220 and opens its drawer. No target: the card is replaced by the drawer.
    go(150, 11, centre(S['summary-unknown']), undefined, [{ type: 'SET_JOB_FILTER', filter: 'unknown' }, SELECT('INV-48220'), OPEN('SC24')]),
    // H-098 Authority check: Daniel's table; a press on the approval row opens its drawer. The row stays on screen under the drawer.
    go(180, 13, rowPoint('case-row-inv-48219'), 'approval-row', [SELECT('INV-48219'), OPEN('SC23')]),
    // H-099 Explicit diff: the pointer travels to `Approve` and presses it; the approval is recorded and awaits its independent verification.
    go(210, 15, APPROVE_POINT, 'approve', [{ type: 'APPROVE', invoice: 'INV-48219' }]),
    // H-100 Verify after approval: no pointer. The placement releases `approve`, which the cut to SC25 hides.
    place(240, APPROVE_POINT),
    // H-101 No blind retry: the pointer returns on the unknown drawer and hovers `Investigate`; no click.
    place(270, [900, 540]),
    go(271, 15, INVESTIGATE_POINT, 'investigate'),
    // H-140 source still: move to the independent timeout evidence without asserting fulfillment.
    go(287, 11, [900, 540], 'unknown-evidence'),
    // H-102 Next cycle: the cut to Gmail releases `investigate`; the pointer starts at the storyboard's point and travels to the handling fee.
    place(300, [750, 380]),
    go(301, 15, centre(GMAIL['handling-fee']), 'handling-fee'),
  ],
  actions: [
    // Gate and selection are prerequisites; opening the dialog is the first visible action.
    cut(0, { type: 'APPROVE_RELEASE' }, { type: 'CONFIRM_SCOPE' }, OPEN('SC21'), { type: 'CONFIRM_SELECTION' }),
    cut(35, OPEN('SC22')),
    cut(50, evaluate('INV-48210')),
    // H-094: seven verified cases resolve about 70 ms apart (two frames).
    cut(62, evaluate('INV-48211')),
    cut(64, evaluate('INV-48212')),
    cut(66, evaluate('INV-48213')),
    cut(68, evaluate('INV-48214')),
    cut(70, evaluate('INV-48216')),
    cut(72, evaluate('INV-48217')),
    // The separate escalations settle two frames apart (approximately 60 ms).
    cut(96, evaluate('INV-48215')),
    cut(98, evaluate('INV-48218')),
    cut(108, evaluate('INV-48219')),
    cut(112, evaluate('INV-48220')),
    // H-096: every case has an outcome; the job stops partially complete and the screen cuts to the summary of the stopped job.
    cut(120, { type: 'PAUSE_FOR_APPROVAL' }, OPEN('SC25')),
    // H-098: Daniel's viewpoint on the table, unfiltered again.
    cut(180, { type: 'SELECT_ACTOR', personId: 'daniel' }, OPEN('SC22'), { type: 'SET_JOB_FILTER', filter: 'all' }),
    // H-100: the summary, still before the independent readback; the readback is its own later event.
    cut(240, OPEN('SC25')),
    cut(250, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' }),
    // H-101: the held case's drawer.
    cut(270, SELECT('INV-48220'), OPEN('SC24')),
    // H-102: Kestrel INV-48231 as a paper document in Gmail (NEXT_CYCLE_INCIDENT belongs to the next clip).
    cut(300, OPEN('SC05'), MESSAGE, { type: 'OPEN_ATTACHMENT' }),
  ],
  outlines: [
    // The handling fee gets a 1px ink rectangle once the paper has settled (never cyan).
    { frame: 315, target: 'handling-fee', mode: 'selected' },
  ],
  overlays: [
    { frame: 225, id: 'job:awaiting-verification', visible: true },
    { frame: 250, id: 'job:awaiting-verification', visible: false },
  ],
  // H-100 is a summary swap with CURSOR none; the pointer returns for H-101.
  pointer: [
    { frame: 240, visible: false },
    { frame: 270, visible: true },
  ],
  entryAt: entryEvery('H', 92, 30),
}
