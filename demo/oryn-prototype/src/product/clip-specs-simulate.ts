import type { Rect } from '@/film'
import type { Action } from '@/state'
import { OPEN, centre, cut, entryEvery, go, place } from './clip-spec-kit'
import type { ClipSpec } from './clip-specs'
import { JOBS_ANCHOR_RECTS } from './job-layout'
import { SCOPE_ANCHOR_RECTS } from './scope-layout'
import { RESULT_ANCHOR_RECTS, SIMULATOR_ANCHOR_RECTS } from './simulator-layout'

/**
 * BOB-08 clip specs (hk-h4e-simulate, lk-l8-simulate): the evaluation, its failure at the exact
 * 2.00% boundary, the replay, the correction and the rerun, declared once. `scripts/author-product-clips.ts`
 * turns a spec into `film/<cut>/<clip-id>.timeline.json` and adds the `anchor:<name>` visibility
 * overlays from the rendered markup. Read the conventions in `clip-specs.ts` and `clip-specs-work.ts` first.
 *
 * Both clips start from a candidate that exists and has run nothing (hackathon, ST06) or whose first
 * evaluation is already running (launch, ST07: the run began in the last frames of `lk-l7-create`).
 * Every verdict on screen is read from a completed run: the reducer's own `COMPLETE_SIMULATION` is
 * the event that turns the screen from the running suite to its results, a cancelled or running
 * suite shows none, and the gate's scenario rows are checked by that evaluation and not before.
 * Owner approval and scope confirmation are separate pointer actions at the end.
 */

const RECTS: Readonly<Record<string, Rect>> = { ...SIMULATOR_ANCHOR_RECTS, ...RESULT_ANCHOR_RECTS, ...SCOPE_ANCHOR_RECTS }

const R = RESULT_ANCHOR_RECTS
const S = SCOPE_ANCHOR_RECTS
const M = SIMULATOR_ANCHOR_RECTS

const RUN = centre(M['run-scenarios'])
const FAILED_TILE = centre(R['failed-scenario'])

const RUN_SIMULATION: Action = { type: 'RUN_SIMULATION' }
const FIX_AND_RUN: Action = { type: 'FIX_AND_RUN' }
const COMPLETE: Action = { type: 'COMPLETE_SIMULATION' }
const REPLAY: Action = { type: 'OPEN_DRAWER', drawer: 'replay' }
const RULE: Action = { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }
const SELECT_FAILED: Action = { type: 'SELECT_SCENARIO', scenarioId: 'SCN-022' }
const COMPARE_ON: Action = { type: 'SET_COMPARE', open: true }

/** A point a few pixels inside a rectangle's centre: a click is a small final adjustment of a hover, not a second arrival. */
const nudge = (rect: Rect): [number, number] => {
  const [x, y] = centre(rect)
  return [x - 6, y + 4]
}

// -- hk-h4e-simulate (H-084 to H-091, 01:49 to 01:57, 240 frames) -------------------------------

/**
 * H-084 the pointer presses `Run scenarios` and the suite executes for 500 ms (15 frames), the only
 * cyan of the clip; H-085 the run completes and the reducer opens its results, v0.1 at 21 / 6 / 1,
 * and the pointer rests on the failed scenario; H-086 a press on it selects SCN-022 and opens the
 * replay (`Expected: accept`, `Actual: escalate`); H-087 the replay's rule link opens AP-RULE-009
 * with the replay still named in it; H-088 the drawer closes and `Compare versions` shows v0.1 against
 * the proposed v0.2 comparator; H-089 SC19 is bound to the corrected v0.2 and `Run scenarios` runs it
 * (the six expected safe escalations are listed beside the grid); H-090 v0.2 completes at 22 / 6 / 0,
 * 28/28 intended outcomes, no pointer; H-091 the gate on SC18: the evaluation has checked its two
 * rows, Marcus approves the release and confirms the scope as two separate presses. `Deploy` is
 * enabled at the end and is not pressed: starting the job is BOB-09's.
 */
const HK_H4E: ClipSpec = {
  cut: 'hackathon',
  clipId: 'hk-h4e-simulate',
  scene: 'H4e',
  filmStartFrame: 109 * 30,
  durationFrames: 240,
  seed: 20261209,
  startAt: 'ST06',
  start: centre(S['gate-examples']),
  anchors: RECTS,
  moves: [
    // H-084 Simulator suite: the pointer travels to `Run scenarios` in 500 ms and presses it; the suite executes from the landing frame.
    go(0, 15, RUN, 'run-scenarios', [RUN_SIMULATION]),
    // H-085 First result: the pointer moves to the failed scenario's tile.
    go(30, 15, FAILED_TILE, 'failed-scenario'),
    // H-086 Boundary replay: a press on the failed scenario selects it and opens its replay.
    go(60, 11, nudge(R['failed-scenario']), 'failed-scenario', [SELECT_FAILED, REPLAY]),
    // H-087 Rule: the pointer opens the source while the selected replay remains visible on the left.
    go(90, 15, centre(R['replay-rule-link']), undefined, [RULE]),
    // H-088 Fix version: the drawer has closed (a cut); the pointer presses `Compare versions`.
    go(120, 15, centre(R['compare-versions']), 'compare-versions', [COMPARE_ON]),
    // H-089 Rerun: SC19 is bound to v0.2; the pointer presses `Run scenarios`.
    go(150, 15, RUN, 'run-scenarios', [FIX_AND_RUN]),
    // H-090 Passing suite: no pointer.
    place(180, RUN),
    // H-091 Stage 3 satisfied: Marcus approves the release, then confirms the scope.
    place(210, [900, 470]),
    go(211, 11, centre(S['approve-release']), 'approve-release', [{ type: 'APPROVE_RELEASE' }]),
    go(223, 11, centre(S['confirm-scope']), 'confirm-scope', [{ type: 'CONFIRM_SCOPE' }]),
  ],
  actions: [
    cut(0, OPEN('SC19'), { type: 'SET_SIMULATOR', runFrames: 15 }),
    cut(30, COMPLETE),
    cut(120, { type: 'CLOSE_DRAWER' }),
    cut(150, OPEN('SC19')),
    cut(180, COMPLETE),
    cut(210, OPEN('SC18')),
  ],
  pointer: [
    { frame: 180, visible: false },
    { frame: 210, visible: true },
  ],
  entryAt: entryEvery('H', 84, 30),
}

// -- lk-l8-simulate (L-093 to L-108, 01:30 to 01:46, 480 frames) --------------------------------

/**
 * The run that `lk-l7-create` began at its f522 continues: it has executed 18 frames of its 48 when
 * this clip opens (`runLead`), so the count carries across the clip boundary. L-093 the row stream of
 * the same 28 scenarios follows the running one; L-094 the run completes at f30 and the reducer
 * opens v0.1's results, 21 / 6 / 1; L-095 a press on the failed scenario selects SCN-022 and opens its
 * replay at f90 (L-096, expected and actual); L-097 the replay's rule link opens AP-RULE-009; L-098 the
 * drawer closes and the missing-PO safe escalation is selected; L-099 holds for the stage text; L-100
 * clears the selection so the six safe escalations read as one list; L-101 `Compare versions` shows
 * v0.1 against the proposed v0.2; L-102 SC19 runs v0.2 (16 frames) from the press at f284; L-103 v0.2
 * completes at 22 / 6 / 0, no pointer; L-104 the comparison again, with the equality row aligned;
 * L-105 SC18 with the evaluation's two rows checked, the owner's row pending; L-106 Marcus presses
 * `Confirm scope`; L-107 holds the approved gate; L-108 SC21 Choose batch: the queue opens (the `Deploy` press is not
 * storyboarded), the pointer travels 15 frames to `Confirm 11 invoices` and its press lands at f465 (+500 ms) as
 * `CONFIRM_SELECTION`, which confirms the eleven invoices and starts nothing; the fixed selection then holds to f479.
 * The row stream translates 120 px over the first 27 frames, while the run continues across the cut.
 */
const LK_L8: ClipSpec = {
  cut: 'launch',
  clipId: 'lk-l8-simulate',
  scene: 'L8',
  filmStartFrame: 90 * 30,
  durationFrames: 480,
  seed: 20261211,
  startAt: 'ST07',
  start: RUN,
  anchors: { ...RECTS, ...JOBS_ANCHOR_RECTS },
  moves: [
    // L-095 Failed case: the pointer travels to the failed scenario (900 ms) and presses it at f90, which opens the replay.
    go(63, 27, FAILED_TILE, 'failed-scenario', [SELECT_FAILED, REPLAY]),
    // L-096 Expected versus actual: the pointer points at the divergence, the actual column.
    go(91, 15, [1152, 160], 'replay'),
    // L-097 Rule: the pointer travels to the replay's rule link and presses it. No target: the replay is replaced by the rule.
    go(120, 15, centre(R['replay-rule-link']), undefined, [RULE]),
    // L-098 Safe stop: the drawer closes; the pointer selects the missing-PO safe escalation.
    go(150, 14, centre(R['safe-result-scn-023']), 'safe-result-scn-023', [{ type: 'SELECT_SCENARIO', scenarioId: 'SCN-023' }]),
    // L-099 Not a failure, L-100 Six safety cases: no pointer.
    place(180, centre(R['safe-result-scn-023'])),
    // L-101 Fix candidate: the pointer presses `Compare versions`.
    go(240, 15, centre(R['compare-versions']), 'compare-versions', [COMPARE_ON]),
    // L-102 Re-evaluate: SC19 is bound to v0.2 and the pointer presses `Run Evaluation`.
    go(270, 14, RUN, 'run-scenarios', [FIX_AND_RUN]),
    // L-103 Corrected result: no pointer.
    place(300, RUN),
    // L-104 Compare: the pointer presses `Compare versions`, then points at the aligned equality row.
    go(330, 11, centre(R['compare-versions']), 'compare-versions', [COMPARE_ON]),
    go(342, 17, centre(R['equality-row']), 'equality-row'),
    // L-105 Gate satisfied: no pointer.
    place(360, centre(R['equality-row'])),
    // L-106 Owner approval: Marcus presses `Approve release`, then `Confirm scope`.
    go(390, 15, centre(S['approve-release']), 'approve-release', [{ type: 'APPROVE_RELEASE' }]),
    go(406, 11, centre(S['confirm-scope']), 'confirm-scope', [{ type: 'CONFIRM_SCOPE' }]),
    // L-107 Released: no pointer, SC18 held.
    place(420, centre(S['confirm-scope'])),
    // L-108 Choose batch: SC21 opens and the pointer travels from where it rested to `Confirm 11 invoices`; the press lands at f465 and confirms the selection only.
    go(450, 15, centre(JOBS_ANCHOR_RECTS['confirm-selection']), 'confirm-selection', [{ type: 'CONFIRM_SELECTION' }]),
  ],
  actions: [
    cut(0, OPEN('SC19'), { type: 'SET_SIMULATOR', view: 'stream', runLabel: 'Run Evaluation', runFrames: 48, runLead: 18 }),
    cut(30, COMPLETE),
    cut(150, { type: 'CLOSE_DRAWER' }),
    cut(210, { type: 'SELECT_SCENARIO', scenarioId: null }),
    cut(270, OPEN('SC19'), { type: 'SET_SIMULATOR', view: 'grid', runFrames: 16 }),
    cut(300, COMPLETE),
    cut(360, OPEN('SC18')),
    cut(450, OPEN('SC21')),
  ],
  pointer: [
    { frame: 0, visible: false },
    { frame: 63, visible: true },
    { frame: 180, visible: false },
    { frame: 240, visible: true },
    { frame: 300, visible: false },
    { frame: 330, visible: true },
    { frame: 360, visible: false },
    { frame: 390, visible: true },
    { frame: 420, visible: false },
    // L-108 the pointer returns at its rest point and travels to the selection button.
    { frame: 450, visible: true },
  ],
  entryAt: entryEvery('L', 93, 30),
}

export const SIMULATE_CLIP_SPECS: readonly ClipSpec[] = [HK_H4E, LK_L8]
