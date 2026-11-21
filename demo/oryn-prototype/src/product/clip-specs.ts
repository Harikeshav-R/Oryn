import type { Rect, Vec2 } from '@/film'
import type { Action, StateId } from '@/state'
import { ENROLLMENT_ANCHOR_RECTS } from './enrollment-layout'
import { AGENT_CLIP_SPECS } from './clip-specs-agent'
import { DISCOVERY_CLIP_SPECS } from './clip-specs-discovery'
import { WORK_CLIP_SPECS } from './clip-specs-work'
import { PRIVACY_ANCHOR_RECTS } from './privacy-layout'
import { SIMULATE_CLIP_SPECS } from './clip-specs-simulate'
import { HK_H4F } from './clip-specs-job-hackathon'
import { LK_L9 } from './clip-specs-job-launch'
import { HK_H4G, LK_L10 } from './clip-specs-heal'
import { BREADTH_CLIP_SPECS } from './clip-specs-breadth'

/**
 * BOB-04 clip specs: what each product clip does, declared once. `scripts/author-product-clips.ts`
 * turns a spec into `film/<cut>/<clip-id>.timeline.json`. A move is one pointer travel (11-27
 * frames) that ends on an anchor; a click move lands its reducer actions on its landing frame, so
 * the click and the state change coincide. `actions` are screen cuts that have no pointer: the
 * storyboard's hard cuts. No camera events and no stage text live here: the stage layer adds both.
 */
export interface Move {
  readonly frame: number
  /** 11-27 frames of travel, or 0 to place the pointer at `to` (a hard cut: the pointer is at a new spot with no travel). */
  readonly duration: number
  readonly to: Vec2
  /** Anchor the tip must land inside. */
  readonly target?: string
  /** Present for a click: the reducer actions it lands. An empty list is an `inert` click on a third-party mock app. */
  readonly click?: readonly Action[]
  /** The click is a blocked action: the reducer must reject it (an unreachable screen, a missing grant). */
  readonly rejected?: true
}

export interface Cut {
  readonly frame: number
  readonly actions: readonly Action[]
}

/** FRT-03 synthetic typing: the field text replaces `before` (shown selected first) at 28-34 characters a second. */
export interface TypeSpec {
  readonly frame: number
  readonly target: string
  readonly text: string
  readonly charsPerSecond: number
  readonly seed: number
  readonly before?: string
  readonly selectHoldFrames?: number
}

/** FRT-02 film outline on an anchor; `target: null` clears it. */
export interface OutlineSpec {
  readonly frame: number
  readonly target: string | null
  readonly mode: 'focus' | 'selected'
}

/** A film overlay switch other than the pointer, such as `caret:<target>` (`visible: false` stops that field's caret). */
export interface OverlaySpec {
  readonly frame: number
  readonly id: string
  readonly visible: boolean
}

export interface ClipSpec {
  readonly cut: 'hackathon' | 'launch' | 'sample'
  readonly clipId: string
  readonly scene: string
  readonly filmStartFrame: number
  readonly durationFrames: number
  readonly seed: number
  readonly startAt?: StateId
  /** Where the pointer is when its first move begins. */
  readonly start: Vec2
  readonly anchors: Readonly<Record<string, Rect>>
  readonly moves: readonly Move[]
  readonly actions: readonly Cut[]
  readonly types?: readonly TypeSpec[]
  readonly outlines?: readonly OutlineSpec[]
  readonly overlays?: readonly OverlaySpec[]
  /** Overlay-pointer visibility: the pointer is shown from its first move until it is hidden. */
  readonly pointer: readonly { readonly frame: number; readonly visible: boolean }[]
  /** Storyboard entry covering a clip-local frame. */
  readonly entryAt: (frame: number) => string
}

const entry = (prefix: 'H' | 'L', first: number) => (frame: number): string => `${prefix}-${String(first + Math.floor(frame / 30)).padStart(3, '0')}`

// Canvas rectangles outside SC02 / SC03 (APP-11, APP-12, SC12-FRAME). Verified against the DOM at capture.
const DESKTOP_RECTS = {
  'tray-icon': { x: 1090, y: 4, width: 20, height: 20 },
  'companion-menu': { x: 950, y: 28, width: 310, height: 232 },
  'pause-observation': { x: 962, y: 96, width: 286, height: 32 },
  'my-privacy-link': { x: 962, y: 144, width: 286, height: 32 },
} as const satisfies Record<string, Rect>

/** Employee navigation: Home, Notifications, My Privacy at 32 px rows from y 104. */
const NAV_MY_PRIVACY: Rect = { x: 24, y: 168, width: 192, height: 32 }

const enrollment = ENROLLMENT_ANCHOR_RECTS
const privacy = PRIVACY_ANCHOR_RECTS

const REVIEW: Vec2 = [440, 282]
const UNDERSTAND: Vec2 = [700, 464]
const CONTINUE: Vec2 = [848, 572]
const CONTINUE_AGAIN: Vec2 = [860, 576]
const WORK_APPS: Vec2 = [500, 276]

const HACKATHON: ClipSpec = {
  cut: 'hackathon',
  clipId: 'hk-h4a-enroll',
  scene: 'H4a',
  filmStartFrame: 82 * 30,
  durationFrames: 180,
  seed: 20261120,
  start: [950, 588],
  anchors: {
    notice: enrollment.notice,
    'review-notice': enrollment['review-notice'],
    understand: enrollment.understand,
    'capture-consent': enrollment['capture-consent'],
    'work-applications': enrollment['work-applications'],
    'sharing-consent': enrollment['sharing-consent'],
    continue: enrollment.continue,
    'nav-my-privacy': NAV_MY_PRIVACY,
    exclusions: privacy.exclusions,
    'masked-fields': privacy['masked-fields'],
    'privacy-pause': privacy['privacy-pause'],
    'delete-local-history': privacy['delete-local-history'],
    'tray-icon': DESKTOP_RECTS['tray-icon'],
    'companion-menu': DESKTOP_RECTS['companion-menu'],
    'pause-observation': DESKTOP_RECTS['pause-observation'],
  },
  moves: [
    // H-057 Enrollment notice: Review notice opens the disclosure. Acknowledging is a separate click.
    { frame: 0, duration: 13, to: REVIEW, target: 'review-notice', click: [{ type: 'SET_NOTICE_EXPANDED', expanded: true }] },
    // H-058 Choice: I understand, then Accept and continue. Neither grants capture or sharing.
    { frame: 30, duration: 16, to: UNDERSTAND, target: 'understand', click: [{ type: 'ACKNOWLEDGE_NOTICE' }] },
    { frame: 46, duration: 11, to: CONTINUE, target: 'continue', click: [{ type: 'WIZARD_NEXT' }] },
    // H-059 Scope: work applications only. Organizational contribution stays off.
    { frame: 57, duration: 11, to: WORK_APPS, target: 'work-applications', click: [{ type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }] },
    { frame: 68, duration: 11, to: CONTINUE, target: 'continue', click: [{ type: 'WIZARD_NEXT' }] },
    { frame: 79, duration: 11, to: CONTINUE_AGAIN, target: 'continue', click: [{ type: 'CONSENT' }] },
    // H-060 Privacy: the shell opens on Home; My Privacy is chosen from the navigation.
    { frame: 90, duration: 15, to: [130, 186], target: 'nav-my-privacy', click: [{ type: 'OPEN_SCREEN', screen: 'SC03' }] },
    // H-061 has no pointer; it travels unseen to the menu bar and is shown again at H-062.
    { frame: 120, duration: 27, to: [1000, 24] },
    // H-062 Visible capture control: tray icon opens the menu; the pointer hovers Pause and does not click it.
    { frame: 150, duration: 12, to: [1100, 14], target: 'tray-icon', click: [{ type: 'SET_OVERLAY', overlay: 'companion' }] },
    { frame: 162, duration: 14, to: [1060, 112], target: 'pause-observation' },
  ],
  actions: [
    { frame: 90, actions: [{ type: 'OPEN_SCREEN', screen: 'SC12' }] },
    { frame: 150, actions: [{ type: 'OPEN_SCREEN', screen: 'SC01' }] },
  ],
  pointer: [
    { frame: 120, visible: false },
    { frame: 150, visible: true },
  ],
  entryAt: entry('H', 57),
}

const LAUNCH: ClipSpec = {
  cut: 'launch',
  clipId: 'lk-l4-privacy',
  scene: 'L4',
  filmStartFrame: 32 * 30,
  durationFrames: 360,
  seed: 20261121,
  start: [730, 430],
  anchors: {
    notice: enrollment.notice,
    understand: enrollment.understand,
    'capture-consent': enrollment['capture-consent'],
    'work-applications': enrollment['work-applications'],
    'sharing-consent': enrollment['sharing-consent'],
    contribution: enrollment.contribution,
    continue: enrollment.continue,
    exclusions: privacy.exclusions,
    retention: privacy.retention,
    'masked-fields': privacy['masked-fields'],
    'privacy-pause': privacy['privacy-pause'],
    'delete-local-history': privacy['delete-local-history'],
    'tray-icon': DESKTOP_RECTS['tray-icon'],
    'companion-menu': DESKTOP_RECTS['companion-menu'],
    'pause-observation': DESKTOP_RECTS['pause-observation'],
    'my-privacy-link': DESKTOP_RECTS['my-privacy-link'],
  },
  moves: [
    // L-035 Notice: I understand. Nothing else is chosen yet.
    { frame: 0, duration: 16, to: UNDERSTAND, target: 'understand', click: [{ type: 'ACKNOWLEDGE_NOTICE' }] },
    { frame: 16, duration: 11, to: CONTINUE, target: 'continue', click: [{ type: 'WIZARD_NEXT' }] },
    // L-036 Scope: permitted work observation is enabled; the sharing control is never touched.
    { frame: 27, duration: 11, to: WORK_APPS, target: 'work-applications', click: [{ type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }] },
    { frame: 38, duration: 11, to: CONTINUE, target: 'continue', click: [{ type: 'WIZARD_NEXT' }] },
    { frame: 49, duration: 11, to: CONTINUE_AGAIN, target: 'continue', click: [{ type: 'CONSENT' }, { type: 'OPEN_SCREEN', screen: 'SC03' }] },
    // L-037 Exclusions: the pointer points at the list and does not click.
    { frame: 60, duration: 11, to: [500, 260], target: 'exclusions' },
    // L-038 Pause: the pointer crosses to the menu bar, opens the tray menu, then Pause observation.
    { frame: 71, duration: 14, to: [1010, 60] },
    { frame: 85, duration: 11, to: [1100, 14], target: 'tray-icon', click: [{ type: 'SET_OVERLAY', overlay: 'companion' }] },
    { frame: 96, duration: 11, to: [1060, 112], target: 'pause-observation', click: [{ type: 'PAUSE_OBSERVATION' }] },
    // L-039 Resume only by an explicit click on the same row.
    { frame: 119, duration: 11, to: [1140, 112], target: 'pause-observation', click: [{ type: 'RESUME_OBSERVATION' }] },
    // L-040: My Privacy opens from the menu. The pointer is hidden for L-040 to L-042.
    { frame: 130, duration: 15, to: [1100, 160], target: 'my-privacy-link', click: [{ type: 'OPEN_SCREEN', screen: 'SC03' }, { type: 'SET_OVERLAY', overlay: null }] },
    { frame: 145, duration: 27, to: [900, 420] },
    // L-043 Retention: hover Delete local history. No activation.
    { frame: 216, duration: 24, to: [580, 548], target: 'delete-local-history' },
  ],
  actions: [{ frame: 90, actions: [{ type: 'OPEN_SCREEN', screen: 'SC01' }] }],
  pointer: [
    { frame: 154, visible: false },
    { frame: 216, visible: true },
  ],
  entryAt: entry('L', 35),
}

/**
 * Fixture-backed tour of SC12-FRAME, SC12 and APP-11 (`sample/shell-tour`; not a storyboard clip).
 * It proves what the two storyboard clips do not show: a viewpoint change through the role
 * selector, the search palette opening and being dismissed, a Home card whose route is unreachable
 * (the reducer rejects it), and all six browser tabs selected in turn.
 */
const BROWSER_TAB_ANCHORS = {
  'browser-tabs': { x: 0, y: 28, width: 960, height: 24 },
  'tab-gmail': { x: 0, y: 28, width: 160, height: 24 },
  'tab-netsuite': { x: 160, y: 28, width: 160, height: 24 },
  'tab-tracker': { x: 320, y: 28, width: 160, height: 24 },
  'tab-slack': { x: 480, y: 28, width: 160, height: 24 },
  'tab-zoom': { x: 640, y: 28, width: 160, height: 24 },
  'tab-hubspot': { x: 800, y: 28, width: 160, height: 24 },
} as const satisfies Record<string, Rect>

const SHELL_TOUR: ClipSpec = {
  cut: 'sample',
  clipId: 'shell-tour',
  scene: 'shell-tour',
  filmStartFrame: 0,
  durationFrames: 270,
  seed: 20261122,
  startAt: 'ST02',
  start: [640, 400],
  anchors: {
    'role-selector': { x: 24, y: 24, width: 192, height: 64 },
    'role-option-marcus': { x: 29, y: 221, width: 278, height: 32 },
    search: { x: 440, y: 12, width: 360, height: 32 },
    'command-palette': { x: 320, y: 120, width: 640, height: 480 },
    navigation: { x: 24, y: 104, width: 192, height: 448 },
    'home-cards': { x: 264, y: 128, width: 976, height: 376 },
    'card-approvals': { x: 264, y: 128, width: 480, height: 180 },
    ...BROWSER_TAB_ANCHORS,
    'excluded-window': { x: 140, y: 150, width: 560, height: 340 },
    'excluded-cue': { x: 140, y: 498, width: 256, height: 24 },
  },
  moves: [
    { frame: 0, duration: 14, to: [120, 56], target: 'role-selector', click: [{ type: 'SET_OVERLAY', overlay: 'role' }] },
    { frame: 20, duration: 14, to: [150, 237], target: 'role-option-marcus', click: [{ type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'SET_OVERLAY', overlay: null }] },
    { frame: 34, duration: 14, to: [620, 28], target: 'search', click: [{ type: 'SET_OVERLAY', overlay: 'search' }] },
    { frame: 96, duration: 16, to: [504, 218], target: 'card-approvals', click: [{ type: 'OPEN_SCREEN', screen: 'SC23' }], rejected: true },
    { frame: 120, duration: 14, to: [240, 40], target: 'tab-netsuite', click: [{ type: 'SELECT_APP_TAB', tab: 'netsuite' }] },
    { frame: 134, duration: 11, to: [400, 40], target: 'tab-tracker', click: [{ type: 'SELECT_APP_TAB', tab: 'tracker' }] },
    { frame: 145, duration: 11, to: [560, 40], target: 'tab-slack', click: [{ type: 'SELECT_APP_TAB', tab: 'slack' }] },
    { frame: 156, duration: 11, to: [720, 40], target: 'tab-zoom', click: [{ type: 'SELECT_APP_TAB', tab: 'zoom' }] },
    { frame: 167, duration: 11, to: [880, 40], target: 'tab-hubspot', click: [{ type: 'SELECT_APP_TAB', tab: 'hubspot' }] },
    { frame: 178, duration: 14, to: [80, 40], target: 'tab-gmail', click: [{ type: 'SELECT_APP_TAB', tab: 'gmail' }] },
  ],
  actions: [
    { frame: 0, actions: [{ type: 'OPEN_SCREEN', screen: 'SC12' }] },
    // Keyboard: type a command Marcus may not run, then Escape closes the palette.
    { frame: 60, actions: [{ type: 'SET_SEARCH_QUERY', query: 'pause' }] },
    { frame: 90, actions: [{ type: 'SET_OVERLAY', overlay: null }] },
    { frame: 120, actions: [{ type: 'OPEN_SCREEN', screen: 'SC01' }] },
    // SC01 excluded-window moment: a blank window with its cue below it, then back to work. No pointer, no content.
    { frame: 210, actions: [{ type: 'SET_FOREGROUND', window: 'excluded' }] },
    { frame: 255, actions: [{ type: 'SET_FOREGROUND', window: 'work' }] },
  ],
  pointer: [],
  entryAt: () => 'RT-03',
}

export const CLIP_SPECS: readonly ClipSpec[] = [HACKATHON, LAUNCH, SHELL_TOUR, ...WORK_CLIP_SPECS, ...DISCOVERY_CLIP_SPECS, ...AGENT_CLIP_SPECS, ...SIMULATE_CLIP_SPECS, HK_H4F, LK_L9, HK_H4G, LK_L10, ...BREADTH_CLIP_SPECS]
