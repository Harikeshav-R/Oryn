import { FPS } from '@/lib/frame'
import { FILM_DEVICE_SCALE_FACTOR, FILM_VIEWPORT } from './motion'
import { sampleGeometry } from './timeline'
import type { CursorPhase, Rect, Timeline } from './types'

/**
 * The BOB-03c cursor and anchor sidecar (`demo/video/clips/<cut>/<clip-id>.json`).
 * One cursor entry and one entry per anchor for every captured frame, in 1280x720 authored CSS
 * pixels after the camera. A hidden pointer or anchor is explicit (`visible: false`, null
 * coordinates); nothing is fabricated. The final frame index is `frameCount - 1`.
 */
export interface SidecarCursorSample {
  readonly frame: number
  readonly x: number | null
  readonly y: number | null
  readonly visible: boolean
  readonly phase: CursorPhase
}

export interface SidecarAnchorSample {
  readonly frame: number
  readonly rect: Rect | null
  readonly visible: boolean
}

export interface Sidecar {
  readonly cut: string
  readonly clipId: string
  readonly fps: 30
  readonly width: number
  readonly height: number
  readonly coordinateSpace: 'authored-css-1280x720'
  readonly frameCount: number
  readonly durationSeconds: number
  readonly cursor: readonly SidecarCursorSample[]
  readonly anchors: Readonly<Record<string, readonly SidecarAnchorSample[]>>
}

/** Round to 1/1000 px so the file is byte-stable and diffable. */
const r3 = (value: number): number => Math.round(value * 1000) / 1000

export function buildSidecar(timeline: Timeline): Sidecar {
  const cursor: SidecarCursorSample[] = []
  const anchors: Record<string, SidecarAnchorSample[]> = Object.fromEntries(Object.keys(timeline.anchors).map((name) => [name, []]))
  for (let frame = 0; frame < timeline.durationFrames; frame += 1) {
    const geometry = sampleGeometry(timeline, frame)
    const { x, y, visible, phase } = geometry.cursor
    cursor.push({ frame, x: x === null ? null : r3(x), y: y === null ? null : r3(y), visible, phase })
    for (const [name, sample] of Object.entries(geometry.anchors)) {
      const rect = sample.rect
      ;(anchors[name] as SidecarAnchorSample[]).push({
        frame,
        rect: rect === null ? null : { x: r3(rect.x), y: r3(rect.y), width: r3(rect.width), height: r3(rect.height) },
        visible: sample.visible,
      })
    }
  }
  return {
    cut: timeline.cut,
    clipId: timeline.clipId,
    fps: 30,
    width: FILM_VIEWPORT.width * FILM_DEVICE_SCALE_FACTOR,
    height: FILM_VIEWPORT.height * FILM_DEVICE_SCALE_FACTOR,
    coordinateSpace: 'authored-css-1280x720',
    frameCount: timeline.durationFrames,
    durationSeconds: timeline.durationFrames / FPS,
    cursor,
    anchors,
  }
}
