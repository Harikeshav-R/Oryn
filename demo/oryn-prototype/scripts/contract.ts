import type { Timeline } from '@/film'
import { startFrameOf, type ClipSpec } from './clips'

/**
 * What a timeline must state before it is captured, beyond what `validateTimeline` already checks:
 * it is the clip the roadmap names, has the roadmap's exact length, says which scene it is and
 * where it sits in the film, cites a storyboard entry on every event and names only safe assets.
 * Returns every problem, empty when the timeline may be captured.
 */
export function checkContract(timeline: Timeline, spec: ClipSpec): readonly string[] {
  const problems: string[] = []
  if (timeline.cut !== spec.cut) problems.push(`cut is "${timeline.cut}" but the file is under film/${spec.cut}/.`)
  if (timeline.clipId !== spec.clipId) problems.push(`clipId is "${timeline.clipId}" but the file is ${spec.clipId}.timeline.json.`)
  if (spec.frames !== null && timeline.durationFrames !== spec.frames) {
    problems.push(`durationFrames is ${timeline.durationFrames}; ${spec.clipId} captures exactly ${spec.frames} frames (ROADMAP.md section 0.3).`)
  }
  if (typeof timeline.scene !== 'string' || timeline.scene.length === 0) problems.push('scene is required (the storyboard scene, for example "H4a").')
  const start = startFrameOf(spec)
  if (timeline.filmStartFrame === undefined) {
    problems.push(`filmStartFrame is required; ${spec.clipId} starts at film frame ${start}.`)
  } else if (timeline.filmStartFrame !== start) {
    problems.push(`filmStartFrame is ${timeline.filmStartFrame}; ${spec.clipId} starts at film frame ${start} (${spec.startSeconds} s).`)
  }
  timeline.events.forEach((event, i) => {
    if (event.entry === undefined) problems.push(`event ${i} (${event.type} @ ${event.frame}/${event.seq}): entry is required (matching ${String(spec.entry)}).`)
    else if (!spec.entry.test(event.entry)) problems.push(`event ${i} (${event.type} @ ${event.frame}/${event.seq}): entry "${event.entry}" does not match ${String(spec.entry)}.`)
  })
  for (const asset of timeline.assets ?? []) {
    if (asset.length === 0 || asset.startsWith('/') || asset.includes('..') || asset.includes(':') || asset.includes('\\')) {
      problems.push(`asset "${asset}" must be a relative path under public/ with no "..", scheme or backslash.`)
    }
  }
  return problems
}
