import type { Rect } from '@/film'
import { REGRESSION_PASS_RESULTS } from '@/data/regression'
import { INCIDENT } from '@/data/incident'
import type { Action } from '@/state'
import { ERP_ANCHOR_RECTS } from './apps/erp-layout'
import { GMAIL_ANCHOR_RECTS } from './apps/gmail-layout'
import { OPEN, centre, cut, entryEvery, go, named, place } from './clip-spec-kit'
import type { ClipSpec } from './clip-specs'
import { INCIDENT_ANCHOR_RECTS } from './incident-layout'
import { RELEASE_ANCHOR_RECTS } from './release-layout'
import { REPAIR_ANCHOR_RECTS } from './repair-layout'
import { TEACH_ANCHOR_RECTS } from './teach-layout'
import { VERSIONS_ANCHOR_RECTS } from './versions-layout'

/**
 * BOB-10 clip specs: the self-heal act. `hk-h4g-heal` (H-103 to H-116, 02:08 to 02:22, 420 frames, film frame 3840) and
 * `lk-l10-heal` (L-126 to L-144 and the hold to 02:24, 02:03.50 to 02:24, 615 frames, film frame 3705). Declared once;
 * `scripts/author-product-clips.ts` turns each spec into its timeline and adds the `anchor:<name>` overlays. Read the
 * conventions in `clip-specs.ts` and `clip-specs-job-hackathon.ts` first.
 *
 * - Both clips open at ST11 (`startAt`): the job's one approval and its independent readback replay at f0 as cuts, because
 *   the incident arrives only after the readback verifies the approval (`NEXT_CYCLE_INCIDENT` guard). They are prerequisites.
 * - FX-01: ONE light-to-dark wipe, 12 frames (400 ms), derived from the landing frame of `CONTAIN_INCIDENT` (the
 *   dispatch at the containment boundary, never a theme toggle). Hackathon: f30 to f41 (02:09.00 to 02:09.40 absolute, one second
 *   after the clip boundary at 02:08.00). Launch: f9 to f20 (02:03.80 to 02:04.20 absolute, 0.3 s after the boundary at 02:03.50),
 *   so neither boundary moves and the frame counts stay 420 and 615. The first dark-only frame is f42 / f21.
 * - Separate authorities and events: containment (Marcus), the manual completion (Elena, in the original ERP), the correction
 *   draft (answer, rule) and its explicit save (`TEACH`), the scope validation and proposal (Marcus), the regression run and its
 *   completion, the limited release (Marcus), each independent cohort readback, the expansion and the closure.
 * - Cyan only while `running.regression` (the regression run). The theme returns to light at the hackathon limited release
 *   (storyboard H-114 `hard cut back to light UI`); the launch closure keeps the dark incident theme (L-144), so a
 *   `SET_THEME dark` lands with the release press there. The hypothesis stays unconfirmed on every frame.
 */

const GMAIL = GMAIL_ANCHOR_RECTS
const ERP = ERP_ANCHOR_RECTS
const I = INCIDENT_ANCHOR_RECTS
const T = TEACH_ANCHOR_RECTS
const R = REPAIR_ANCHOR_RECTS
const L = RELEASE_ANCHOR_RECTS

const ANCHORS: Readonly<Record<string, Rect>> = {
  ...named(GMAIL, ['handling-fee', 'document-viewer', 'document-page', 'invoice-total', 'invoice-id', 'po-number']),
  ...named(ERP, ['manual-completion', 'complete-manually', 'teach-correction']),
  ...I,
  ...T,
  ...R,
  ...L,
  ...named(VERSIONS_ANCHOR_RECTS, ['version-row', 'restore-previous', 'version-restore-hint']),
}

const as = (personId: Extract<Action, { type: 'SELECT_ACTOR' }>['personId']): Action => ({ type: 'SELECT_ACTOR', personId })
const AFFECTED = INCIDENT.affectedCases.map((row) => row.id)
const CONTAIN: Action = { type: 'CONTAIN_INCIDENT', caseIds: AFFECTED }
const MANUAL: Action = { type: 'COMPLETE_CASE_MANUALLY', caseId: INCIDENT.correction.caseId }
const verify = (index: 0 | 1 | 2): Action => ({ type: 'VERIFY_COHORT_OUTCOME', index, result: 'verified' })
const runFrames = (frames: number): Action => ({ type: 'SET_SIMULATOR', runFrames: frames })
const COMPLETE: Action = { type: 'COMPLETE_REGRESSION', results: REGRESSION_PASS_RESULTS }

/** The job's approval and its independent readback, then the next supplier cycle's incident, as Marcus. */
const APPROVED: readonly Action[] = [as('daniel'), { type: 'APPROVE', invoice: 'INV-48219' }, { type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' }, as('marcus')]

export const HK_H4G: ClipSpec = {
  cut: 'hackathon',
  clipId: 'hk-h4g-heal',
  scene: 'H4g',
  filmStartFrame: 128 * 30,
  durationFrames: 420,
  seed: 20261214,
  startAt: 'ST11',
  start: [750, 380],
  anchors: ANCHORS,
  moves: [
    // H-103 Layout changes: the paper from H-102 stays, the pointer hovers the handling fee.
    go(1, 15, centre(GMAIL['handling-fee']), 'handling-fee'),
    // H-104 Dark flip: no pointer. The placement releases `handling-fee`, which the cut to SC26 hides.
    place(30, [640, 360]),
    // H-105 Containment first: the pointer travels from (950,310) to the case group.
    place(60, [950, 310]),
    go(61, 15, centre(I['affected-cases']), 'affected-cases'),
    // H-106 Facts versus hypothesis: hover the hypothesis, no press.
    go(90, 15, centre(I['incident-hypothesis']), 'incident-hypothesis'),
    // H-107 Manual correction: Elena's completed INV-48231 in the original ERP; the pointer travels from (890,580) to `Teach Oryn What Changed` and presses it (500 ms, f135). No target: the control disappears with the press.
    place(120, [890, 580]),
    go(121, 14, centre(ERP['teach-correction']), undefined, [OPEN('SC27')]),
    // H-108 Focused question: select `Yes` (f168).
    go(153, 15, centre(T['teach-yes']), 'teach-yes', [{ type: 'SET_TEACH_ANSWER', answer: 'yes' }]),
    // H-109 Source and scope: link AP-RULE-017 (f195), then the explicit save (f207).
    go(180, 15, centre(T['link-rule']), 'link-rule', [{ type: 'LINK_TEACH_RULE', linked: true }]),
    go(196, 11, centre(T['save-correction']), 'save-correction', [{ type: 'TEACH' }]),
    // H-110 Not policy: Marcus confirms the bounded scope (f224).
    go(210, 14, centre(R['validate-scope']), 'validate-scope', [{ type: 'VALIDATE_SCOPE', scope: 'Kestrel Components layout v2 only' }]),
    // H-111 Bounded change: the pointer opens the diff, which proposes the repair (f253).
    go(240, 13, centre(R['open-repair-diff']), undefined, [{ type: 'PROPOSE_REPAIR' }]),
    // H-112 Regression: `Run regression` lands f281; the 34 scenarios execute for 18 frames (600 ms).
    go(270, 11, centre(R['run-regression']), 'run-regression', [{ type: 'RUN_REGRESSION' }]),
    // H-113 Regression result: no pointer.
    place(300, [640, 360]),
    // H-114 Limited release: Marcus presses the authorized limited release (500 ms, f345).
    place(330, [700, 420]),
    go(331, 14, centre(L['approve-limited-release']), undefined, [{ type: 'LIMITED_RELEASE' }]),
    // H-115 Watch: the pointer hovers the verified outcomes.
    go(360, 15, centre(L['verified-three']), 'verified-three'),
    // H-116 Expand and close: Expand (f403), then Close incident (f417), two separate owner decisions.
    go(390, 13, centre(L['expand-release']), 'expand-release', [{ type: 'EXPAND_RELEASE' }]),
    go(406, 11, centre(L['close-incident']), undefined, [{ type: 'CLOSE_INCIDENT' }]),
  ],
  actions: [
    // H-103: prerequisites as cuts, then Kestrel INV-48231's paper in Gmail with the fee line outlined (the H-102 state).
    cut(0, ...APPROVED, OPEN('SC05'), { type: 'OPEN_MESSAGE', record: 'INV-48231' }, { type: 'OPEN_ATTACHMENT' }),
    // H-104: the incident arrives and Marcus contains the three cases at the containment boundary; the wipe runs f30 to f41.
    cut(30, { type: 'NEXT_CYCLE_INCIDENT' }, CONTAIN),
    // Completion predates the ERP shot; the cut reveals the already-completed case.
    cut(119, as('elena'), MANUAL),
    cut(120, OPEN('SC06'), { type: 'OPEN_BILL', record: 'INV-48231' }),
    // H-110: Marcus reviews the bounded repair.
    cut(210, as('marcus'), OPEN('SC28')),
    cut(240, runFrames(18)),
    // H-113: the evidence of the completed 34-scenario run.
    cut(300, COMPLETE),
    // H-114: hard cut back to the light product surface, owner review of the release.
    cut(330, { type: 'SET_THEME', theme: 'light' }, OPEN('SC29')),
    // H-115: three independent readbacks, 100 ms (3 frames) apart.
    cut(366, verify(0)),
    cut(369, verify(1)),
    cut(372, verify(2)),
  ],
  outlines: [
    { frame: 0, target: 'handling-fee', mode: 'selected' },
    { frame: 30, target: null, mode: 'selected' },
  ],
  pointer: [
    { frame: 30, visible: false },
    { frame: 60, visible: true },
    { frame: 300, visible: false },
    { frame: 330, visible: true },
  ],
  entryAt: entryEvery('H', 103, 30),
}

/** L-126 is the half second before the wipe; L-127 starts at f15 (02:04.00); f555 to f614 are L-145 and L-146, the SC30 version history of BOB-11. */
const launchEntry = (frame: number): string => {
  if (frame < 15) return 'L-126'
  if (frame >= 555) return `L-${String(145 + Math.floor((frame - 555) / 30)).padStart(3, '0')}`
  return `L-${String(127 + Math.floor((frame - 15) / 30)).padStart(3, '0')}`
}

export const LK_L10: ClipSpec = {
  cut: 'launch',
  clipId: 'lk-l10-heal',
  scene: 'L10',
  filmStartFrame: 3705,
  durationFrames: 615,
  seed: 20261215,
  startAt: 'ST11',
  start: [600, 300],
  anchors: ANCHORS,
  moves: [
    // L-128 Group: the pointer opens (hovers) the group of three cases.
    go(45, 15, centre(I['affected-cases']), 'affected-cases'),
    // L-129 Expected and actual: the pointer points at the fee line.
    go(75, 15, centre(I['fee-comparison']), 'fee-comparison'),
    // L-130 Hypothesis: hover, no selection.
    go(105, 15, centre(I['incident-hypothesis']), 'incident-hypothesis'),
    // L-131 Human resolution: Elena's completed INV-48231; the pointer presses `Teach Oryn What Changed` (500 ms, f150). No target: the control disappears with the press.
    go(135, 15, centre(ERP['teach-correction']), undefined, [OPEN('SC27')]),
    // L-132 Focused question: the pointer focuses the question and its answer.
    go(165, 12, centre(T['teach-question']), 'teach-question'),
    // L-133 Expert answer: `Yes` (f197), the linked rule (f209) and the explicit save (f221).
    go(186, 11, centre(T['teach-yes']), 'teach-yes', [{ type: 'SET_TEACH_ANSWER', answer: 'yes' }]),
    go(198, 11, centre(T['link-rule']), 'link-rule', [{ type: 'LINK_TEACH_RULE', linked: true }]),
    go(210, 11, centre(T['save-correction']), 'save-correction', [{ type: 'TEACH' }]),
    // L-134 Scope validation: Marcus validates the Kestrel layout v2 scope (500 ms, f240).
    go(225, 15, centre(R['validate-scope']), 'validate-scope', [{ type: 'VALIDATE_SCOPE', scope: 'Kestrel Components layout v2 only' }]),
    // L-135 Proposal: the pointer opens the diff (f267).
    go(255, 12, centre(R['open-repair-diff']), undefined, [{ type: 'PROPOSE_REPAIR' }]),
    // L-136 Regression additions: hover the six new cases.
    go(285, 15, centre(R['regression-case-029']), 'regression-case-029'),
    // L-137 Run repair evaluation: the press lands f329; the 34 scenarios execute for 15 frames (500 ms).
    go(315, 14, centre(R['run-regression']), 'run-regression', [{ type: 'RUN_REGRESSION' }]),
    // L-138 Regression result: no pointer.
    place(345, [640, 360]),
    // L-139 Human release decision: Marcus approves the limited release (500 ms, f390); the incident theme stays dark.
    place(375, [600, 420]),
    go(376, 14, centre(L['approve-limited-release']), undefined, [{ type: 'LIMITED_RELEASE' }, { type: 'SET_THEME', theme: 'dark' }]),
    // L-140 to L-142: no pointer.
    place(405, [640, 360]),
    // L-143 Expand: the owner presses `Expand release` (500 ms, f510).
    place(495, [1100, 420]),
    go(496, 14, centre(L['expand-release']), 'expand-release', [{ type: 'EXPAND_RELEASE' }]),
    // L-144 Close incident: `Close incident` (500 ms, f540), a separate owner decision.
    go(526, 14, centre(L['close-incident']), undefined, [{ type: 'CLOSE_INCIDENT' }]),
    // L-145 Version history (02:22): the pointer hovers `Restore previous approved version`, no press. L-146 keeps it there.
    go(556, 15, centre(VERSIONS_ANCHOR_RECTS['restore-previous']), 'restore-previous'),
  ],
  actions: [
    // L-126: prerequisites as cuts, then the incident is open and the screen shows its light pre-containment state.
    cut(0, ...APPROVED, { type: 'NEXT_CYCLE_INCIDENT' }),
    // L-126 end: Marcus contains the three cases at 02:03.80; the wipe runs f9 to f20.
    cut(9, CONTAIN),
    // Completion predates the ERP shot; the cut reveals the already-completed case.
    cut(134, as('elena'), MANUAL),
    cut(135, OPEN('SC06'), { type: 'OPEN_BILL', record: 'INV-48231' }),
    // L-134: Marcus reviews the bounded repair.
    cut(225, as('marcus'), OPEN('SC28')),
    cut(300, runFrames(15)),
    // L-138: the completed 34-scenario run.
    cut(345, COMPLETE),
    // L-139: owner review of the release.
    cut(375, OPEN('SC29')),
    // L-142: the three independent readbacks land together at +200 ms (f471).
    cut(471, verify(0), verify(1), verify(2)),
    // L-145 (02:22.00): the montage opens at the version history (ST21): ST17 to ST20 are passed in the same frame.
    cut(555, { type: 'OPEN_MONTAGE' }, { type: 'NEXT' }, { type: 'NEXT' }, { type: 'NEXT' }, { type: 'NEXT' }),
    // L-146 (02:23.00): the future-only explanation appears (150 ms) while the pointer stays on the restore control.
    cut(585, { type: 'SET_VERSION_VIEW', hint: true }),
  ],
  pointer: [
    { frame: 0, visible: false },
    // L-127 (02:04.00): the wipe completes, no pointer; an explicit event keeps the entry in the timeline.
    { frame: 15, visible: false },
    { frame: 45, visible: true },
    { frame: 345, visible: false },
    { frame: 375, visible: true },
    { frame: 405, visible: false },
    // L-141 (02:18.00): watch, no pointer.
    { frame: 435, visible: false },
    { frame: 495, visible: true },
    // L-145 (02:22): the version history; the pointer hovers the restore control from f556.
    { frame: 556, visible: true },
  ],
  entryAt: launchEntry,
}
