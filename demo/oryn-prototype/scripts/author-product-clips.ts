import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProductFilmSurface } from '@/product/FilmProduct'
import { CLIP_SPECS } from '@/product/clip-specs'
import type { ClipSpec } from '@/product/clip-specs'
import { landingFrame, parseTimeline, resolveFrame, validateTimeline } from '@/film'
import type { CursorEvent, FilmEvent, OverlayEvent, Timeline, Vec2 } from '@/film'

const FILM_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'film')

/**
 * BOB-04 authoring tool: turns each declarative clip spec (`src/product/clip-specs.ts`) into
 * `film/<cut>/<clip-id>.timeline.json`. The spec lists the pointer moves, the reducer actions each
 * click lands and the screen cuts; this tool adds the one thing that must agree with the rendered
 * DOM: an `anchor:<name>` overlay event wherever an anchored element is `display: none`. It derives
 * that from the real surface markup for every frame, so the sidecar hides exactly what the screen
 * hides. Run `bun run scripts/author-product-clips.ts`, then capture. The JSON is the product:
 * edit the spec, not the JSON.
 */

const round = (value: number): number => Math.round(value * 10) / 10

function curve(from: Vec2, to: Vec2, index: number): { c1: Vec2; c2: Vec2 } {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const length = Math.hypot(dx, dy)
  if (length < 24) return { c1: from, c2: to }
  const sign = index % 2 === 0 ? 1 : -1
  const nx = (-dy / length) * sign
  const ny = (dx / length) * sign
  const bend = length * 0.07
  return {
    c1: [round(from[0] + dx * 0.3 + nx * bend), round(from[1] + dy * 0.3 + ny * bend)],
    c2: [round(from[0] + dx * 0.75 - nx * bend * 0.4), round(from[1] + dy * 0.75 - ny * bend * 0.4)],
  }
}

const entryOf = (spec: ClipSpec, frame: number): string => spec.entryAt(frame)

export function buildEvents(spec: ClipSpec): FilmEvent[] {
  const events: FilmEvent[] = []
  let from: Vec2 = spec.start
  spec.moves.forEach((move, index) => {
    // A placed pointer (duration 0) appears at `to`: it did not travel from the previous spot.
    const origin: Vec2 = move.duration === 0 ? move.to : from
    const { c1, c2 } = curve(origin, move.to, index)
    const click = move.click !== undefined
    const cursor: CursorEvent = {
      frame: move.frame,
      seq: 0,
      entry: entryOf(spec, move.frame),
      type: 'cursor',
      from: origin,
      c1,
      c2,
      to: move.to,
      duration: move.duration,
      click,
      ...(click && move.click?.length === 0 ? { inert: true as const } : {}),
      ...(move.target ? { target: move.target } : {}),
    }
    events.push(cursor)
    const landing = landingFrame(cursor)
    ;(move.click ?? []).forEach((action, i) =>
      events.push({ frame: landing, seq: 1 + i, entry: entryOf(spec, landing), type: 'action', action, ...(move.rejected ? { expect: 'rejected' as const } : {}) }),
    )
    from = move.to
  })
  for (const cut of spec.actions) {
    cut.actions.forEach((action, i) => events.push({ frame: cut.frame, seq: 10 + i, entry: entryOf(spec, cut.frame), type: 'action', action }))
  }
  spec.pointer.forEach((change, i) => events.push({ frame: change.frame, seq: 50 + i, entry: entryOf(spec, change.frame), type: 'overlay', id: 'cursor', visible: change.visible }))
  ;(spec.outlines ?? []).forEach((outline, i) =>
    events.push({ frame: outline.frame, seq: 60 + i, entry: entryOf(spec, outline.frame), type: 'outline', target: outline.target, mode: outline.mode }),
  )
  ;(spec.overlays ?? []).forEach((overlay, i) => events.push({ frame: overlay.frame, seq: 90 + i, entry: entryOf(spec, overlay.frame), type: 'overlay', id: overlay.id, visible: overlay.visible }))
  ;(spec.types ?? []).forEach((typed, i) =>
    events.push({
      frame: typed.frame,
      seq: 70 + i,
      entry: entryOf(spec, typed.frame),
      type: 'type',
      target: typed.target,
      text: typed.text,
      charsPerSecond: typed.charsPerSecond,
      seed: typed.seed,
      ...(typed.before !== undefined ? { before: typed.before } : {}),
      ...(typed.selectHoldFrames !== undefined ? { selectHoldFrames: typed.selectHoldFrames } : {}),
    }),
  )
  return events
}

const sorted = (events: readonly FilmEvent[]): FilmEvent[] => [...events].sort((a, b) => a.frame - b.frame || a.seq - b.seq)

function baseTimeline(spec: ClipSpec, events: readonly FilmEvent[]): Timeline {
  return parseTimeline({
    fps: 30,
    durationFrames: spec.durationFrames,
    seed: spec.seed,
    cut: spec.cut,
    clipId: spec.clipId,
    scene: spec.scene,
    filmStartFrame: spec.filmStartFrame,
    ...(spec.startAt ? { startAt: spec.startAt } : {}),
    anchors: Object.fromEntries(Object.entries(spec.anchors).map(([name, rect]) => [name, { rect }])),
    events: sorted(events),
  })
}

/** Is the element carrying `data-film-anchor="name"` hidden in this markup? Throws when it is missing. */
export function anchorHidden(markup: string, name: string): boolean {
  const tag = new RegExp(`<[^>]*data-film-anchor="${name}"[^>]*>`).exec(markup)
  if (!tag) throw new Error(`The surface renders no element for anchor "${name}".`)
  return /display:\s*none/.test(tag[0])
}

/** `anchor:<name>` overlay events wherever the rendered element hides or shows, from frame 0. */
export function visibilityEvents(spec: ClipSpec, timeline: Timeline): OverlayEvent[] {
  const overlays: OverlayEvent[] = []
  const hidden = new Map<string, boolean>(Object.keys(spec.anchors).map((name) => [name, false]))
  for (let frame = 0; frame < spec.durationFrames; frame += 1) {
    const markup = renderToStaticMarkup(createElement(ProductFilmSurface, { resolved: resolveFrame(timeline, frame) }))
    for (const name of Object.keys(spec.anchors)) {
      const now = anchorHidden(markup, name)
      if (now === hidden.get(name)) continue
      hidden.set(name, now)
      overlays.push({ frame, seq: 100 + overlays.filter((event) => event.frame === frame).length, entry: entryOf(spec, frame), type: 'overlay', id: `anchor:${name}`, visible: !now })
    }
  }
  return overlays
}

export function authorClip(spec: ClipSpec): Timeline {
  const events = buildEvents(spec)
  const visibility = visibilityEvents(spec, baseTimeline(spec, events))
  return baseTimeline(spec, [...events, ...visibility])
}

const eventLine = (event: FilmEvent): string => `    ${JSON.stringify(event)}`

export function formatTimeline(timeline: Timeline): string {
  const anchors = Object.entries(timeline.anchors).map(([name, spec]) => `    ${JSON.stringify(name)}: ${JSON.stringify(spec)}`)
  const head = [
    `  "fps": 30,`,
    `  "durationFrames": ${timeline.durationFrames},`,
    `  "seed": ${timeline.seed},`,
    `  "cut": ${JSON.stringify(timeline.cut)},`,
    `  "clipId": ${JSON.stringify(timeline.clipId)},`,
    `  "scene": ${JSON.stringify(timeline.scene)},`,
    `  "filmStartFrame": ${timeline.filmStartFrame},`,
    ...(timeline.startAt ? [`  "startAt": ${JSON.stringify(timeline.startAt)},`] : []),
  ]
  return `{\n${head.join('\n')}\n  "anchors": {\n${anchors.join(',\n')}\n  },\n  "events": [\n${sorted(timeline.events).map(eventLine).join(',\n')}\n  ]\n}\n`
}

async function main(): Promise<void> {
  for (const spec of CLIP_SPECS) {
    const timeline = authorClip(spec)
    const problems = validateTimeline(timeline)
    if (problems.length > 0) {
      console.error(`${spec.cut}/${spec.clipId}: ${problems.length} problem(s)\n${problems.map((problem) => `  - ${problem}`).join('\n')}`)
      process.exitCode = 1
      continue
    }
    const file = path.join(FILM_DIR, spec.cut, `${spec.clipId}.timeline.json`)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, formatTimeline(timeline))
    console.error(`wrote ${path.relative(process.cwd(), file)} (${timeline.events.length} events)`)
  }
}

if (import.meta.main) await main()
