/**
 * The product clips of ROADMAP.md section 0.3: one row per `film/<cut>/<clip-id>.timeline.json`.
 * `startFrame` is the absolute film frame of clip-local frame 0 (30 fps); `frames` is the exact
 * capture length. The `sample` cut is the fixture-backed interface check, not a product clip.
 */

export const FPS = 30

export type CutName = 'hackathon' | 'launch' | 'sample'

export interface ClipSpec {
  readonly cut: CutName
  readonly clipId: string
  /** Film interval start in seconds from film frame 0. */
  readonly startSeconds: number
  /** Exact captured frames; null only for the sample fixture. */
  readonly frames: number | null
  /** Pattern every timeline event's `entry` must match. */
  readonly entry: RegExp
}

const H = /^H-\d{3}$/
const L = /^L-\d{3}$/

const hackathon = (clipId: string, startSeconds: number, frames: number): ClipSpec => ({ cut: 'hackathon', clipId, startSeconds, frames, entry: H })
const launch = (clipId: string, startSeconds: number, frames: number): ClipSpec => ({ cut: 'launch', clipId, startSeconds, frames, entry: L })

export const CLIPS: readonly ClipSpec[] = [
  hackathon('hk-h2-problem', 26, 780),
  hackathon('hk-h4a-enroll', 82, 180),
  hackathon('hk-h4b-observe', 88, 210),
  hackathon('hk-h4c-playbook', 95, 210),
  hackathon('hk-h4d-agent', 102, 210),
  hackathon('hk-h4e-simulate', 109, 240),
  hackathon('hk-h4f-job', 117, 330),
  hackathon('hk-h4g-heal', 128, 420),
  hackathon('hk-h4h-breadth', 142, 480),
  launch('lk-l2-chaos', 10, 360),
  launch('lk-l4-privacy', 32, 360),
  launch('lk-l5-observe', 44, 360),
  launch('lk-l6-discover', 56, 480),
  launch('lk-l7-create', 72, 540),
  launch('lk-l8-simulate', 90, 480),
  launch('lk-l9-run', 106, 525),
  launch('lk-l10-heal', 123.5, 615),
  launch('lk-l11-breadth', 144, 600),
  { cut: 'sample', clipId: 'runtime-check', startSeconds: 0, frames: null, entry: /^(RT|FRT)-\d{2}$/ },
  { cut: 'sample', clipId: 'shell-tour', startSeconds: 0, frames: null, entry: /^(RT|FRT)-\d{2}$/ },
]

export const PRODUCT_CUTS = ['hackathon', 'launch'] as const

export const startFrameOf = (clip: ClipSpec): number => Math.round(clip.startSeconds * FPS)

export const findClip = (cut: string, clipId: string): ClipSpec | undefined => CLIPS.find((clip) => clip.cut === cut && clip.clipId === clipId)

export const clipsOf = (cut: string): readonly ClipSpec[] => CLIPS.filter((clip) => clip.cut === cut)

export const isCut = (value: string): value is CutName => CLIPS.some((clip) => clip.cut === value)
