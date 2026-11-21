import type { Rect } from '@/film'
import { DRAWER, DRAWER_PARTS } from './candidate-layout'
import { offset } from './geometry'

/**
 * SC21 Jobs queue and scope confirmation, SC22 eleven-case job, SC23 approval drawer, SC24 unknown-outcome
 * drawer and SC25 job summary. Absolute 1280x720 canvas coordinates inside the shell's content area
 * (`[264,112,992,584]`). Status, outcome, filter, selection and viewpoint never move or resize an anchor:
 * a state change only changes what an element says. Drawer parts are body-local (origin the drawer body
 * `[824,96]`) unless a name says footer; the drawer frame itself is `DRAWER` (`[800,0,480,720]`).
 */

// -- SC21 Jobs ----------------------------------------------------------------------------------

export const JOBS_HEADING: Rect = { x: 264, y: 112, width: 400, height: 36 }
/** The one queue row: JOB-0117, its version, team, population, status and the `Confirm job scope` action. */
export const JOB_ROW: Rect = { x: 264, y: 160, width: 992, height: 40 }
export const CONFIRM_JOB_SCOPE: Rect = { x: 1032, y: 164, width: 216, height: 32 }
/** Row-local column rectangles of the job row. */
export const JOB_ROW_PARTS = Object.freeze({
  id: { x: 12, y: 0, width: 88, height: 40 } satisfies Rect,
  name: { x: 108, y: 0, width: 248, height: 40 } satisfies Rect,
  team: { x: 364, y: 0, width: 80, height: 40 } satisfies Rect,
  population: { x: 452, y: 0, width: 104, height: 40 } satisfies Rect,
  status: { x: 564, y: 0, width: 196, height: 40 } satisfies Rect,
})

/** The fixed population: a 32 px header, then eleven 32 px rows. */
export const QUEUE: Rect = { x: 264, y: 216, width: 640, height: 384 }
export const QUEUE_ROW = 32
export const queueRow = (index: number): Rect => ({ x: 264, y: 248 + index * QUEUE_ROW, width: 640, height: QUEUE_ROW })
/** Queue columns, queue-local: mark 32, invoice 120, supplier 200, amount 100, PO 100, rest 88 (selection state). */
export const QUEUE_COLUMNS = Object.freeze([32, 120, 200, 100, 100, 88] as const)

export const PREFLIGHT: Rect = { x: 928, y: 216, width: 328, height: 384 }
export const preflightRow = (index: number): Rect => ({ x: 0, y: 40 + index * 56, width: 328, height: 56 })

export const CONFIRM_SELECTION: Rect = { x: 264, y: 612, width: 200, height: 40 }
export const JOBS_NOTICE: Rect = { x: 476, y: 612, width: 780, height: 48 }

/** `Confirm job scope` dialog, centred, 512 wide, over a z40 scrim. Dialog-local parts below. */
export const SCOPE_DIALOG: Rect = { x: 384, y: 168, width: 512, height: 384 }
export const SCOPE_DIALOG_PARTS = Object.freeze({
  title: { x: 24, y: 24, width: 464, height: 28 } satisfies Rect,
  lines: { x: 24, y: 64, width: 464, height: 128 } satisfies Rect,
  applications: { x: 24, y: 200, width: 464, height: 56 } satisfies Rect,
  policy: { x: 24, y: 264, width: 464, height: 72 } satisfies Rect,
  cancel: { x: 188, y: 336, width: 112, height: 32 } satisfies Rect,
  start: { x: 316, y: 336, width: 176, height: 32 } satisfies Rect,
})
export const START_JOB: Rect = offset(SCOPE_DIALOG, SCOPE_DIALOG_PARTS.start)
export const CANCEL_JOB_START: Rect = offset(SCOPE_DIALOG, SCOPE_DIALOG_PARTS.cancel)

export const JOBS_ANCHORS = ['jobs-queue', 'job-row', 'confirm-job-scope', 'confirm-selection', 'job-preflight', 'job-scope-dialog', 'start-job', 'cancel-job-start'] as const
export type JobsAnchor = (typeof JOBS_ANCHORS)[number]

/** Canvas rectangle of every SC21 anchor when it is shown. The dialog anchors are shown only while the dialog is open. */
export const JOBS_ANCHOR_RECTS: Readonly<Record<JobsAnchor, Rect>> = Object.freeze({
  'jobs-queue': QUEUE,
  'job-row': JOB_ROW,
  'confirm-job-scope': CONFIRM_JOB_SCOPE,
  'confirm-selection': CONFIRM_SELECTION,
  'job-preflight': PREFLIGHT,
  'job-scope-dialog': SCOPE_DIALOG,
  'start-job': START_JOB,
  'cancel-job-start': CANCEL_JOB_START,
})

// -- SC22 eleven-case job -----------------------------------------------------------------------

/** Progress summary: title, segmented bar, labelled counts; status and the summary action at the right. */
export const JOB_PROGRESS: Rect = { x: 264, y: 112, width: 992, height: 72 }
export const PROGRESS_PARTS = Object.freeze({
  title: { x: 0, y: 0, width: 640, height: 24 } satisfies Rect,
  bar: { x: 0, y: 34, width: 640, height: 8 } satisfies Rect,
  counts: { x: 0, y: 48, width: 640, height: 22 } satisfies Rect,
  status: { x: 664, y: 0, width: 192, height: 28 } satisfies Rect,
  filter: { x: 664, y: 36, width: 328, height: 32 } satisfies Rect,
  summary: { x: 864, y: 0, width: 128, height: 32 } satisfies Rect,
})
export const OPEN_SUMMARY: Rect = offset(JOB_PROGRESS, PROGRESS_PARTS.summary)

/** Header at y 188, eleven 32 px rows from y 220: the approval row centres on y 524 and the unknown row on y 556 (inventory SC22). */
export const CASE_TABLE: Rect = { x: 264, y: 188, width: 992, height: 384 }
export const CASE_ROW = 32
export const caseRow = (index: number): Rect => ({ x: 264, y: 220 + index * CASE_ROW, width: 992, height: CASE_ROW })
/** Columns: invoice 120, supplier 184, amount 100, PO 100, status 408, action 80. */
export const CASE_COLUMNS = Object.freeze([120, 184, 100, 100, 408, 80] as const)
export const APPROVAL_ROW_INDEX = 9
export const UNKNOWN_ROW_INDEX = 10
export const CASE_ROW_ANCHORS = Object.freeze(
  ['inv-48210', 'inv-48211', 'inv-48212', 'inv-48213', 'inv-48214', 'inv-48215', 'inv-48216', 'inv-48217', 'inv-48218', 'inv-48219', 'inv-48220'].map((id) => `case-row-${id}`),
)

// -- SC23 approval drawer (body-local) ----------------------------------------------------------

export const APPROVAL_PARTS = Object.freeze({
  record: { x: 0, y: 0, width: 432, height: 20 } satisfies Rect,
  invoice: { x: 0, y: 28, width: 212, height: 64 } satisfies Rect,
  po: { x: 220, y: 28, width: 212, height: 64 } satisfies Rect,
  variance: { x: 0, y: 100, width: 432, height: 24 } satisfies Rect,
  diff: { x: 0, y: 132, width: 432, height: 116 } satisfies Rect,
  authority: { x: 0, y: 256, width: 432, height: 72 } satisfies Rect,
  evidence: { x: 0, y: 336, width: 432, height: 144 } satisfies Rect,
  readback: { x: 0, y: 488, width: 432, height: 48 } satisfies Rect,
})
/** Footer buttons in canvas coordinates: the sticky footer is `[800,656,480,64]`. */
export const APPROVAL_BUTTONS = Object.freeze({
  requestChanges: { x: 816, y: 668, width: 144, height: 40 } satisfies Rect,
  reject: { x: 968, y: 668, width: 88, height: 40 } satisfies Rect,
  approve: { x: 1064, y: 668, width: 112, height: 40 } satisfies Rect,
  close: { x: 1184, y: 668, width: 80, height: 40 } satisfies Rect,
})
const APPROVAL_BODY = offset(DRAWER, DRAWER_PARTS.body)
export const APPROVAL_DIFF: Rect = offset(APPROVAL_BODY, APPROVAL_PARTS.diff)
export const APPROVAL_AUTHORITY: Rect = offset(APPROVAL_BODY, APPROVAL_PARTS.authority)
export const APPROVAL_EVIDENCE: Rect = offset(APPROVAL_BODY, APPROVAL_PARTS.evidence)
export const READBACK: Rect = offset(APPROVAL_BODY, APPROVAL_PARTS.readback)

// -- SC24 unknown-outcome drawer (body-local) ---------------------------------------------------

export const UNKNOWN_PARTS = Object.freeze({
  facts: { x: 0, y: 0, width: 432, height: 96 } satisfies Rect,
  hold: { x: 0, y: 108, width: 432, height: 140 } satisfies Rect,
  /** Hold-panel local: the hatched square and, beside it, the labels (the hatch never sits behind text). */
  holdHatch: { x: 16, y: 16, width: 56, height: 56 } satisfies Rect,
  holdLabels: { x: 88, y: 12, width: 328, height: 116 } satisfies Rect,
  guidance: { x: 0, y: 256, width: 432, height: 48 } satisfies Rect,
  unavailable: { x: 0, y: 312, width: 432, height: 32 } satisfies Rect,
  tip: { x: 0, y: 348, width: 432, height: 56 } satisfies Rect,
  evidence: { x: 0, y: 412, width: 432, height: 124 } satisfies Rect,
})
export const UNKNOWN_BUTTONS = Object.freeze({
  investigate: { x: 1064, y: 668, width: 112, height: 40 } satisfies Rect,
  close: { x: 1184, y: 668, width: 80, height: 40 } satisfies Rect,
})
const UNKNOWN_BODY = offset(DRAWER, DRAWER_PARTS.body)
export const UNKNOWN_HOLD: Rect = offset(UNKNOWN_BODY, UNKNOWN_PARTS.hold)
export const RESUBMIT_UNAVAILABLE: Rect = offset(UNKNOWN_BODY, UNKNOWN_PARTS.unavailable)
export const UNKNOWN_EVIDENCE: Rect = offset(UNKNOWN_BODY, UNKNOWN_PARTS.evidence)

// -- SC25 job summary ---------------------------------------------------------------------------

export const SUMMARY_STATUS: Rect = { x: 264, y: 112, width: 300, height: 36 }
export const SUMMARY_SNAPSHOT: Rect = { x: 580, y: 116, width: 676, height: 28 }
/** Four 232 x 160 cards at x 264/512/760/1008, y 160, 16 px gaps. */
export const SUMMARY_CARD = Object.freeze({ width: 232, height: 160, y: 160, xs: [264, 512, 760, 1008] as const })
export const summaryCard = (index: number): Rect => ({ x: SUMMARY_CARD.xs[index] ?? 264, y: SUMMARY_CARD.y, width: SUMMARY_CARD.width, height: SUMMARY_CARD.height })
export const JOB_SUMMARY: Rect = { x: 264, y: 112, width: 992, height: 208 }
export const OPEN_CASES: Rect = { x: 264, y: 336, width: 160, height: 32 }
export const SUMMARY_READBACK: Rect = { x: 264, y: 384, width: 992, height: 64 }
export const SUMMARY_META: Rect = { x: 264, y: 464, width: 992, height: 48 }
export const SUMMARY_CATEGORIES = ['verified', 'escalated', 'approval', 'unknown'] as const

// -- anchors ------------------------------------------------------------------------------------

/** SC22, SC23 and SC24 share one scene: the drawers open over the case table, so every anchor below is rendered on all three routes and hidden where it is not shown. */
export const JOB_ANCHORS = [
  'job-progress',
  'open-summary',
  'job-table',
  'approval-row',
  'unknown-row',
  ...CASE_ROW_ANCHORS,
  'approval-drawer',
  'approval-diff',
  'approval-authority',
  'approval-evidence',
  'approve',
  'reject',
  'request-changes',
  'readback',
  'approval-close',
  'unknown-case',
  'unknown-hold',
  'resubmit-unavailable',
  'unknown-evidence',
  'investigate',
  'unknown-close',
] as const
export type JobAnchor = (typeof JOB_ANCHORS)[number]

export const JOB_SUMMARY_ANCHORS = ['job-summary', 'summary-status', 'summary-snapshot', 'summary-verified', 'summary-escalated', 'summary-approval', 'summary-unknown', 'summary-readback', 'open-cases'] as const
export type JobSummaryAnchor = (typeof JOB_SUMMARY_ANCHORS)[number]

export const JOB_ANCHOR_RECTS: Readonly<Record<JobAnchor, Rect>> = Object.freeze({
  'job-progress': JOB_PROGRESS,
  'open-summary': OPEN_SUMMARY,
  'job-table': CASE_TABLE,
  'approval-row': caseRow(APPROVAL_ROW_INDEX),
  'unknown-row': caseRow(UNKNOWN_ROW_INDEX),
  ...(Object.fromEntries(CASE_ROW_ANCHORS.map((name, index) => [name, caseRow(index)])) as Record<string, Rect>),
  'approval-drawer': DRAWER,
  'approval-diff': APPROVAL_DIFF,
  'approval-authority': APPROVAL_AUTHORITY,
  'approval-evidence': APPROVAL_EVIDENCE,
  approve: APPROVAL_BUTTONS.approve,
  reject: APPROVAL_BUTTONS.reject,
  'request-changes': APPROVAL_BUTTONS.requestChanges,
  readback: READBACK,
  'approval-close': APPROVAL_BUTTONS.close,
  'unknown-case': DRAWER,
  'unknown-hold': UNKNOWN_HOLD,
  'resubmit-unavailable': RESUBMIT_UNAVAILABLE,
  'unknown-evidence': UNKNOWN_EVIDENCE,
  investigate: UNKNOWN_BUTTONS.investigate,
  'unknown-close': UNKNOWN_BUTTONS.close,
} as Record<JobAnchor, Rect>)

export const JOB_SUMMARY_ANCHOR_RECTS: Readonly<Record<JobSummaryAnchor, Rect>> = Object.freeze({
  'job-summary': JOB_SUMMARY,
  'summary-status': SUMMARY_STATUS,
  'summary-snapshot': SUMMARY_SNAPSHOT,
  'summary-verified': summaryCard(0),
  'summary-escalated': summaryCard(1),
  'summary-approval': summaryCard(2),
  'summary-unknown': summaryCard(3),
  'summary-readback': SUMMARY_READBACK,
  'open-cases': OPEN_CASES,
})
