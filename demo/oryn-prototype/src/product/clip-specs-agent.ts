import { typingCompleteFrame } from '@/film'
import type { Rect } from '@/film'
import { AGENT_DEFINITION } from '@/data/versions'
import type { Action } from '@/state'
import { OPEN, centre, cut, entryEvery, go, place } from './clip-spec-kit'
import type { ClipSpec, TypeSpec } from './clip-specs'
import { FACTORY_ANCHOR_RECTS } from './factory-layout'
import { SCOPE_ANCHOR_RECTS } from './scope-layout'
import { SIMULATOR_ANCHOR_RECTS } from './simulator-layout'

/**
 * BOB-07 clip specs (hk-h4d-agent, lk-l7-create): what each Agent Factory clip does, declared once.
 * `scripts/author-product-clips.ts` turns a spec into `film/<cut>/<clip-id>.timeline.json` and adds
 * the `anchor:<name>` visibility overlays from the rendered markup. Read the conventions in
 * `clip-specs.ts` and `clip-specs-work.ts` first.
 *
 * Both clips start at ST05 (`startAt`): Marcus Webb has published the playbook for guidance, and
 * `CREATE_AGENT` lands in the clip itself, at the frame the typed intent completes. The release
 * gate stays pending throughout: the examples row is the only one an event has satisfied (the three
 * approved demonstrations and the two archived cases), and the evaluation and the owner's approval
 * belong to later clips. The cinematic intent pill (STG-14) is the stage layer's; the product field
 * is the separate fixed-height one beneath it.
 */

const RECTS: Readonly<Record<string, Rect>> = { ...FACTORY_ANCHOR_RECTS, ...SCOPE_ANCHOR_RECTS }
/** The launch clip also films the simulator from f480 (L-091 and L-092), so it carries the simulator's anchors. */
const L7_RECTS: Readonly<Record<string, Rect>> = { ...RECTS, ...SIMULATOR_ANCHOR_RECTS }

const F = FACTORY_ANCHOR_RECTS
const S = SCOPE_ANCHOR_RECTS
const SIM = SIMULATOR_ANCHOR_RECTS
const INTENT = AGENT_DEFINITION.intent

const FIELD = centre(F['intent'])

/** Frame the last character of `typed` is on. */
const completeFrame = (typed: TypeSpec): number =>
  typingCompleteFrame({ type: 'type', frame: typed.frame, seq: 0, target: typed.target, text: typed.text, charsPerSecond: typed.charsPerSecond, seed: typed.seed })

const SET_INTENT: Action = { type: 'SET_INTENT', text: INTENT }
const CREATE_AGENT: Action = { type: 'CREATE_AGENT' }

// -- hk-h4d-agent (H-077 to H-083, 01:42 to 01:49, 210 frames) ---------------------------------

const H_TYPE: TypeSpec = { frame: 12, target: 'intent', text: INTENT, charsPerSecond: 34, seed: 20261207 }
const H_DONE = completeFrame(H_TYPE)

/**
 * The empty field, the typed intent, the generated draft and the scope and gate. Marcus clicks the
 * empty field (H-077, the click lands f11 and focuses it) and the exact intent types at the fastest
 * permitted rate, 34 characters a second (H-078); the last character lands at f87 and the same
 * frame submits it, so the six sections and the unverified branch appear from f87 (H-079). The
 * storyboard window for typing and generation is 90 frames and the intent alone needs 75 at 34
 * characters a second after the click, so the generated rows have 3 frames before the cut to SC18
 * at f90 (H-080): a conflict reported, not hidden. SC18 then shows the scope and the Tier 3 risk
 * (H-080), the autonomy ladder with Stage 3 outlined (H-081), the four gate rows with no pointer
 * (H-082) and the provenance drawer opened from the 5/5 row (H-083). The pointer of H-079 travels
 * to where the branch will appear: the anchor does not exist before f87.
 */
const HK_H4D: ClipSpec = {
  cut: 'hackathon',
  clipId: 'hk-h4d-agent',
  scene: 'H4d',
  filmStartFrame: 102 * 30,
  durationFrames: 210,
  seed: 20261207,
  startAt: 'ST05',
  start: [700, 400],
  anchors: RECTS,
  moves: [
    // H-077 Factory intent: the pointer travels to the empty field and clicks it (tick-click at 370 ms); the click lands no reducer action.
    go(0, 11, FIELD, 'intent', []),
    // H-078 Type intent: no pointer, the caret is the cursor.
    place(30, FIELD),
    // H-079 Inferred definition: the pointer travels to where the unverified branch appears, in 500 ms.
    go(60, 15, centre(F['unverified-branch'])),
    // H-080 Risk and scope: hard cut to SC18; the pointer travels to the scope panel in 500 ms.
    place(90, [820, 470]),
    go(91, 15, centre(S['scope']), 'scope'),
    // H-081 Autonomy ladder: the pointer hovers Stage 3.
    go(120, 15, centre(S['ladder-stage-3']), 'ladder-stage-3'),
    // H-082 Release prerequisites: no pointer.
    place(150, centre(S['ladder-stage-3'])),
    // H-083 Human evidence: the pointer travels to the 5/5 row and opens its provenance (pop-card at +300 ms).
    place(180, [900, 520]),
    go(181, 11, centre(S['gate-examples']), 'gate-examples', [{ type: 'OPEN_DRAWER', drawer: 'examples' }]),
  ],
  actions: [cut(0, OPEN('SC17')), cut(H_DONE, SET_INTENT, CREATE_AGENT), cut(90, OPEN('SC18'))],
  types: [H_TYPE],
  outlines: [
    { frame: 11, target: 'intent', mode: 'focus' },
    { frame: H_DONE, target: null, mode: 'focus' },
    { frame: 120, target: 'ladder-stage-3', mode: 'selected' },
    { frame: 150, target: null, mode: 'selected' },
  ],
  overlays: [{ frame: H_DONE, id: 'caret:intent', visible: false }],
  pointer: [
    { frame: 30, visible: false },
    { frame: 60, visible: true },
    { frame: 150, visible: false },
    { frame: 180, visible: true },
  ],
  entryAt: entryEvery('H', 77, 30),
}

// -- lk-l7-create (L-075 to L-092, 01:12 to 01:30, 540 frames) ---------------------------------

const L_TYPE: TypeSpec = { frame: 30, target: 'intent', text: INTENT, charsPerSecond: 30, seed: 20261208 }
const L_DONE = completeFrame(L_TYPE)

/**
 * The same flow at the launch pace. The pointer clicks the empty field (L-075, lands f14), the
 * intent types at 30 characters a second from f30 (L-076 to L-078) and its last character lands
 * just before the stage's send press at +800 ms; the submission lands at f120 (L-079), when the six
 * sections and the unverified branch appear 60 ms apart. The branch is flagged (L-080) and its
 * source opens beside the draft with Elena Ruiz named (L-081, GAP-SC-L-04). SC18 follows: the scope
 * (L-082), the risk tiers with Tier 4 barred (L-083, L-084), the autonomy ladder (L-085), the 5/5
 * examples with their provenance (L-086), and the requirement rows and the owner row, all pending
 * (L-087, L-088); the pointer rests on the action boundary (L-089) and travels to
 * `Open Flight Simulator` (L-090) without pressing it. The simulator follows at the cut at f480
 * (L-091): the pointer hovers `Run Evaluation`, the press lands at f522 (L-092, +400 ms) and the
 * suite executes 48 frames from there, 18 of them in this clip: `lk-l8-simulate` continues the run
 * (`runLead` 18). The running glyph of L-079, the tooltip of L-089 and the matched-edge
 * slide of L-090 are stage-layer work.
 */
const LK_L7: ClipSpec = {
  cut: 'launch',
  clipId: 'lk-l7-create',
  scene: 'L7',
  filmStartFrame: 72 * 30,
  durationFrames: 540,
  seed: 20261208,
  startAt: 'ST05',
  start: [820, 430],
  anchors: L7_RECTS,
  moves: [
    // L-075 Prompt seed: the pointer clicks the empty field in 467 ms (tick-click at +450 ms); the click lands no reducer action.
    go(0, 14, FIELD, 'intent', []),
    // L-076 to L-079 have no pointer.
    place(30, FIELD),
    // L-080 Unverified branch: the pointer points at the branch in 500 ms.
    go(150, 15, centre(F['unverified-branch']), 'unverified-branch'),
    // L-081 Resolve branch: the pointer presses `Review evidence` in 467 ms and the source drawer opens.
    go(180, 14, centre(F['branch-evidence']), 'branch-evidence', [{ type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' }]),
    // L-082 Scope: hard cut to SC18; the pointer hovers the scope boundary, no click.
    place(210, [780, 430]),
    go(211, 15, centre(S['scope']), 'scope'),
    // L-083 to L-085 have no pointer.
    place(240, centre(S['scope'])),
    // L-086 Human examples: the pointer hovers the 5/5 count, no click.
    place(330, [800, 520]),
    go(331, 15, centre(S['gate-examples']), 'gate-examples'),
    // L-087 and L-088 have no pointer.
    place(360, centre(S['gate-examples'])),
    // L-089 Capability boundaries: the pointer hovers the action boundary in 500 ms.
    place(420, [800, 470]),
    go(421, 15, centre(S['scope-action']), 'scope-action'),
    // L-090 Candidate to simulation: the pointer travels to `Open Flight Simulator` in 500 ms and stops there.
    go(450, 15, centre(S['open-simulator']), 'open-simulator'),
    // L-091 Suite preview: the cut to SC19; the pointer travels to `Run Evaluation` (900 ms) and hovers it.
    go(480, 27, centre(SIM['run-scenarios']), 'run-scenarios'),
    // L-092 Start evaluation: the press lands at +400 ms; the suite executes from the landing frame.
    go(511, 11, [centre(SIM['run-scenarios'])[0] - 6, centre(SIM['run-scenarios'])[1] + 4], 'run-scenarios', [{ type: 'RUN_SIMULATION' }]),
  ],
  actions: [cut(0, OPEN('SC17')), cut(L_DONE, SET_INTENT), cut(120, CREATE_AGENT), cut(210, OPEN('SC18')), cut(480, OPEN('SC19'), { type: 'SET_SIMULATOR', runLabel: 'Run Evaluation', runFrames: 48 })],
  types: [L_TYPE],
  outlines: [
    { frame: 14, target: 'intent', mode: 'focus' },
    { frame: 120, target: null, mode: 'focus' },
  ],
  overlays: [{ frame: 120, id: 'caret:intent', visible: false }],
  pointer: [
    ...[30, 60, 90, 120].map((frame) => ({ frame, visible: false })),
    { frame: 150, visible: true },
    ...[240, 270, 300].map((frame) => ({ frame, visible: false })),
    { frame: 330, visible: true },
    ...[360, 390].map((frame) => ({ frame, visible: false })),
    { frame: 420, visible: true },
    // The pointer stays visible from L-089 to the end of the clip: it hovers, then presses, `Run Evaluation`.
  ],
  entryAt: entryEvery('L', 75, 30),
}

export const AGENT_CLIP_SPECS: readonly ClipSpec[] = [HK_H4D, LK_L7]
