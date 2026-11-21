import type { Rect, Vec2 } from '@/film'
import type { Action } from '@/state'
import { CANDIDATE_ANCHOR_RECTS } from './candidate-layout'
import { OPEN, centre, cut, entryEvery, go, place } from './clip-spec-kit'
import type { ClipSpec } from './clip-specs'
import { DISCOVERY_ANCHOR_RECTS } from './discovery-layout'
import { PLAYBOOK_ANCHOR_RECTS } from './playbook-layout'

/**
 * BOB-06 clip specs (hk-h4c-playbook, lk-l6-discover): what each discovery clip does, declared
 * once. `scripts/author-product-clips.ts` turns a spec into `film/<cut>/<clip-id>.timeline.json`
 * and adds the `anchor:<name>` visibility overlays from the rendered markup. Read the conventions
 * in `clip-specs.ts` and `clip-specs-work.ts` first.
 *
 * Both clips start at ST04 (`startAt`): the canonical prerequisites replay the commitment as
 * confirmed. The contributor decisions that precede the owner's review are scripted at frame 0
 * (`REVIEWED`): Priya approves D1 and D2, Jamal turns his own sharing on and approves D3 (a
 * contributor must share before approving, and the earlier clips leave sharing off, so this is the
 * one place a reconstructed prerequisite differs from the previous clip), and he asks the owner to
 * review. None of it is shown; every SC13 and SC14 row reads from that state.
 */

const ROLE_SELECTOR: Rect = { x: 24, y: 24, width: 192, height: 64 }
/** `Marcus Webb` in the open role menu (Workflow Owner group); verified against the DOM at capture. */
const ROLE_OPTION_MARCUS: Rect = { x: 29, y: 221, width: 278, height: 32 }

const RECTS: Readonly<Record<string, Rect>> = {
  'role-selector': ROLE_SELECTOR,
  'role-option-marcus': ROLE_OPTION_MARCUS,
  ...DISCOVERY_ANCHOR_RECTS,
  ...CANDIDATE_ANCHOR_RECTS,
  ...PLAYBOOK_ANCHOR_RECTS,
}

const D = DISCOVERY_ANCHOR_RECTS
const C = CANDIDATE_ANCHOR_RECTS
const P = PLAYBOOK_ANCHOR_RECTS

/** Contributions approved (Priya D1 and D2, Jamal D3) and owner review requested by Jamal, the last contributor to approve. */
const REVIEWED: readonly Action[] = [
  { type: 'APPROVE_DEMONSTRATION', demoId: 'D1' },
  { type: 'APPROVE_DEMONSTRATION', demoId: 'D2' },
  { type: 'SELECT_ACTOR', personId: 'jamal' },
  { type: 'ACKNOWLEDGE_NOTICE' },
  { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true },
  { type: 'SET_CONTRIBUTION', enabled: true },
  { type: 'APPROVE_DEMONSTRATION', demoId: 'D3' },
  { type: 'REQUEST_OWNER_REVIEW' },
]

const SELECT = (demoId: 'D1' | 'D2' | 'D3'): Action => ({ type: 'SELECT_DEMONSTRATION', demoId })

// -- hk-h4c-playbook (H-070 to H-076, 01:35 to 01:42, 210 frames) ------------------------------

const CANDIDATE_POINT = centre(D['candidate-row'])
/** A second point on the row: the pointer arrives at the first and clicks at the second. */
const CANDIDATE_CLICK: Vec2 = [CANDIDATE_POINT[0] + 40, CANDIDATE_POINT[1]]

/**
 * Three demonstrations become a candidate, a Workflow Owner reviews it and publishes it for
 * guidance. Priya's viewpoint: the inbox (H-070), the candidate review opened with one click
 * (H-071), the evidence sources (H-072). Marcus is chosen through the sidebar selector (H-073,
 * GAP-SC-H-role: the canonical selector, no top-right one), opens AP-RULE-009 in the drawer
 * (H-074), cuts to the playbook and publishes it (H-075), and rests on the Evidence section
 * (H-076). The pointer and the clicks land the reducer actions; the camera push of H-076 and the
 * stage captions belong to the stage layer.
 */
const HK_H4C: ClipSpec = {
  cut: 'hackathon',
  clipId: 'hk-h4c-playbook',
  scene: 'H4c',
  filmStartFrame: 95 * 30,
  durationFrames: 210,
  seed: 20261205,
  startAt: 'ST04',
  start: [280, 240],
  anchors: RECTS,
  moves: [
    // H-070 Three demonstrations: the pointer travels from (280, 240) to the candidate row in 600 ms.
    go(0, 18, CANDIDATE_POINT, 'candidate-row'),
    // H-071 Proposed candidate: one click on the row opens the review (tick-click at 150 ms). The row disappears with the click, so it names no target.
    go(23, 11, CANDIDATE_CLICK, undefined, [{ type: 'SELECT_CANDIDATE' }, OPEN('SC14')]),
    // H-072 Uncertainty: the pointer rests on the first evidence source in 500 ms.
    go(60, 15, centre(C['evidence-link-d1']), 'evidence-link-d1'),
    // H-073 Owner review: the sidebar selector opens, then Marcus Webb is chosen (the menu closes, so the option names no target).
    go(90, 14, centre(ROLE_SELECTOR), 'role-selector', [{ type: 'SET_OVERLAY', overlay: 'role' }]),
    go(105, 11, centre(ROLE_OPTION_MARCUS), undefined, [{ type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'SET_OVERLAY', overlay: null }]),
    // H-074 SME check: the rule evidence opens AP-RULE-009 in the drawer after 500 ms.
    go(120, 15, centre(C['rule-link']), 'rule-link', [{ type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }]),
    // H-075 Publish: hard cut to the playbook; the pointer is placed below the publication card and clicks Publish (tick-click at 550 ms).
    place(150, [1000, 530]),
    go(151, 15, centre(P['publish']), 'publish', [{ type: 'PUBLISH' }]),
    // H-076 Playbook evidence: the pointer rests on the Evidence section in 500 ms.
    go(180, 15, centre(P['playbook-evidence']), 'playbook-evidence'),
  ],
  actions: [cut(0, ...REVIEWED, { type: 'SELECT_ACTOR', personId: 'priya' }), cut(150, OPEN('SC15'))],
  pointer: [],
  entryAt: entryEvery('H', 70, 30),
}

// -- lk-l6-discover (L-059 to L-074, 00:56 to 01:12, 480 frames) -------------------------------

/** The pointer where lk-l5-observe leaves it: on the SC13 candidate row. */
const L6_START = centre(D['candidate-row'])

/**
 * Evidence for the candidate, then the playbook (the lifecycle ring of L-063 to L-072 is a stage
 * diagram, so the product holds the published playbook there). Marcus's viewpoint throughout: the
 * owner reviews the three demonstrations (L-059 to L-061), publishes for guidance with one press
 * (L-062), and the clip returns to the candidate (L-073, Confidence: Medium, the exception still
 * unverified) and the playbook (L-074, AP-RULE-009 at the exact 2.00% boundary). D2 arrives by
 * selection, not by pointer, as the storyboard has no cursor there. The 150 ms status entry of
 * L-074 is the badge appearing at the publication press (L-062); at L-074 it is already settled.
 */
const LK_L6: ClipSpec = {
  cut: 'launch',
  clipId: 'lk-l6-discover',
  scene: 'L6',
  filmStartFrame: 56 * 30,
  durationFrames: 480,
  seed: 20261206,
  startAt: 'ST04',
  start: L6_START,
  anchors: RECTS,
  moves: [
    // L-059 Observe: select D1 in 500 ms (tick-click at +500 ms).
    go(0, 15, centre(C['demo-card-d1']), 'demo-card-d1', [SELECT('D1')]),
    // L-060 has no pointer: it rests where it is, then hides.
    place(30, centre(C['demo-card-d1'])),
    // L-061 Review: select the third evidence card in 450 ms.
    go(60, 14, centre(C['demo-card-d3']), 'demo-card-d3', [SELECT('D3')]),
    // L-062 Publish: hard cut to the playbook preview; the pointer presses Publish at +500 ms.
    place(90, [1000, 530]),
    go(91, 14, centre(P['publish']), 'publish', [{ type: 'PUBLISH' }]),
    // L-063 to L-072 have no pointer.
    place(120, centre(P['publish'])),
    // L-073 Candidate evidence: the pointer hovers the first evidence card in 600 ms.
    place(420, [700, 500]),
    go(421, 18, centre(C['demo-card-d1']), 'demo-card-d1'),
    // L-074 Approved guidance: the pointer points at the AP-RULE-009 rule evidence, no click.
    place(450, [700, 540]),
    go(451, 15, centre(P['rule-009']), 'rule-009'),
  ],
  actions: [
    cut(0, ...REVIEWED, { type: 'SELECT_ACTOR', personId: 'marcus' }, OPEN('SC14')),
    cut(30, SELECT('D2')),
    cut(90, OPEN('SC15')),
    cut(420, OPEN('SC14')),
    cut(450, OPEN('SC15')),
  ],
  pointer: [
    { frame: 30, visible: false },
    { frame: 60, visible: true },
    // L-063 to L-072 have no pointer: each entry carries its own explicit hidden event, so every storyboard entry is in the timeline.
    ...[120, 150, 180, 210, 240, 270, 300, 330, 360, 390].map((frame) => ({ frame, visible: false })),
    { frame: 420, visible: true },
  ],
  entryAt: entryEvery('L', 59, 30),
}

export const DISCOVERY_CLIP_SPECS: readonly ClipSpec[] = [HK_H4C, LK_L6]
