import { describe, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { FPS } from '@/lib/frame'
import { TYPE_MAX_CPS, TYPE_MIN_CPS, typedText, typingSchedule } from '@/lib/typing'
import {
  FILM_DEVICE_SCALE_FACTOR,
  FILM_LOCALE,
  FILM_TIME_ZONE,
  FILM_VIEWPORT,
  OVERSHOOT_MAX,
  OVERSHOOT_MIN,
  TRAVEL_MAX_FRAMES,
  TRAVEL_MIN_FRAMES,
  cubicBezier,
  cursorPoint,
  overshootOf,
  sampleMotion,
  staggerDelayFrames,
} from './index'
import type { CursorEvent } from './types'

const URL_TEXT = 'https://github.com/Harikeshav-R/Oryn'
const INTENT = 'Reconcile supplier invoices against purchase orders and stage the result in the ERP.'

describe('seeded typing', () => {
  test('every per-character rate stays inside 28-34 chars/s for any nominal rate and seed', () => {
    for (const cps of [28, 29.5, 31, 33, 34]) {
      for (const seed of [0, 1, 4242, 0xffffffff]) {
        const schedule = typingSchedule(INTENT, seed, 'intent-field', cps)
        schedule.forEach((time, i) => {
          const rate = 1 / (time - (schedule[i - 1] ?? 0))
          expect(rate).toBeGreaterThanOrEqual(TYPE_MIN_CPS - 1e-9)
          expect(rate).toBeLessThanOrEqual(TYPE_MAX_CPS + 1e-9)
        })
      }
    }
  })

  test('a nominal rate outside the range is refused', () => {
    expect(() => typingSchedule('x', 1, 't', 27.9)).toThrow(RangeError)
    expect(() => typingSchedule('x', 1, 't', 34.1)).toThrow(RangeError)
  })

  test('the revealed prefix depends only on (text, seed, target, rate, frame)', () => {
    const at = (frame: number) => typedText(URL_TEXT, 9, 'url-pill', frame, 100, 32)
    const forward = Array.from({ length: 60 }, (_, i) => at(100 + i))
    const backward = Array.from({ length: 60 }, (_, i) => at(159 - i)).reverse()
    expect(backward).toEqual(forward)
    expect(forward[59]).toBe(URL_TEXT)
    expect(at(100)).toBe('')
  })

  test('prefixes only ever grow, one by one, and end on the exact text', () => {
    let previous = ''
    for (let frame = 0; frame < 120; frame += 1) {
      const shown = typedText(INTENT, 7, 'intent-field', frame, 0, 30)
      expect(shown.startsWith(previous)).toBe(true)
      previous = shown
    }
    expect(previous).toBe(INTENT)
  })

  test('different seeds give a different cadence for the same text', () => {
    expect(typingSchedule(URL_TEXT, 1, 't')).not.toEqual(typingSchedule(URL_TEXT, 2, 't'))
  })

  test('never splits a code point', () => {
    for (let frame = 0; frame < 12; frame += 1) {
      const shown = typedText('a\u{1F600}b', 3, 't', frame)
      expect(['', 'a', 'a\u{1F600}', 'a\u{1F600}b']).toContain(shown)
    }
  })

  test('the 36-character URL takes between 1.05 and 1.30 s', () => {
    const last = typingSchedule(URL_TEXT, 9, 'url-pill', 31).at(-1) as number
    expect(URL_TEXT).toHaveLength(36)
    expect(last).toBeGreaterThan(36 / 34 - 0.01)
    expect(last).toBeLessThan(36 / 28 + 0.01)
  })
})

describe('cursor path', () => {
  const event: CursorEvent = { frame: 0, seq: 0, type: 'cursor', from: [40, 40], c1: [90, 60], c2: [300, 220], to: [420, 300], duration: 20, click: false }
  const distance = Math.hypot(380, 260)

  test('starts on from, ends exactly on to, and travel limits are 350-900 ms', () => {
    expect(cursorPoint(event, 0.02, 0)).toEqual([40, 40])
    expect(cursorPoint(event, 0.02, 1)).toEqual([420, 300])
    expect(TRAVEL_MIN_FRAMES).toBe(11)
    expect(TRAVEL_MAX_FRAMES).toBe(27)
    expect((TRAVEL_MIN_FRAMES / FPS) * 1000).toBeGreaterThanOrEqual(350)
    expect((TRAVEL_MAX_FRAMES / FPS) * 1000).toBeLessThanOrEqual(900)
  })

  test('peaks 1-3% of the distance past the target along its end tangent, then settles back', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const overshoot = overshootOf(seed * 7919, { frame: seed, seq: 0 })
      expect(overshoot).toBeGreaterThanOrEqual(OVERSHOOT_MIN)
      expect(overshoot).toBeLessThanOrEqual(OVERSHOOT_MAX)
    }
    const overshoot = overshootOf(20261119, event)
    let peak = 0
    let peakT = 0
    for (let i = 0; i <= 4000; i += 1) {
      const [x, y] = cursorPoint(event, overshoot, i / 4000)
      // Signed progress past `to` along the end direction (to - c2).
      const ex = (420 - 300) / Math.hypot(120, 80)
      const ey = (300 - 220) / Math.hypot(120, 80)
      const past = (x - 420) * ex + (y - 300) * ey
      if (past > peak) {
        peak = past
        peakT = i / 4000
      }
    }
    expect(peak / distance).toBeCloseTo(overshoot, 3)
    expect(peakT).toBeGreaterThan(0.7)
    expect(peakT).toBeLessThan(0.9)
  })

  test('is a pure function of the event, seed and fraction', () => {
    expect(cursorPoint(event, 0.015, 0.37)).toEqual(cursorPoint({ ...event }, 0.015, 0.37))
  })
})

describe('sampleMotion and easing', () => {
  test('clamps the local fraction and reports active and complete', () => {
    const read = sampleMotion(10, 20, 'linear')
    expect(read({ frame: 9 })).toEqual({ progress: 0, active: false, complete: false })
    expect(read({ frame: 20 })).toEqual({ progress: 0.5, active: true, complete: false })
    expect(read({ frame: 30 })).toEqual({ progress: 1, active: false, complete: true })
    expect(read({ frame: 500 }).progress).toBe(1)
  })

  test('reduced motion has no in-between value', () => {
    const read = sampleMotion(10, 20, 'reveal')
    expect(read({ frame: 9, reducedMotion: true }).progress).toBe(0)
    expect(read({ frame: 10, reducedMotion: true })).toEqual({ progress: 1, active: false, complete: true })
  })

  test('easing curves are monotonic and hit their endpoints', () => {
    for (const curve of [cubicBezier(0.4, 0, 0.2, 1), cubicBezier(0.16, 1, 0.3, 1)]) {
      expect(curve(0)).toBe(0)
      expect(curve(1)).toBe(1)
      let last = 0
      for (let i = 1; i <= 100; i += 1) {
        const value = curve(i / 100)
        expect(value).toBeGreaterThanOrEqual(last)
        last = value
      }
    }
  })

  test('stagger is 60 ms per item and never passes the 360 ms cap', () => {
    expect([0, 1, 2, 3].map(staggerDelayFrames)).toEqual([0, 2, 4, 5])
    for (let i = 0; i < 30; i += 1) expect((staggerDelayFrames(i) / FPS) * 1000).toBeLessThanOrEqual(360)
  })
})

describe('fixed environment', () => {
  test('locale, time zone, viewport and device scale are the film constants', () => {
    expect(FILM_LOCALE).toBe('en-US')
    expect(FILM_TIME_ZONE).toBe('America/New_York')
    expect(FILM_VIEWPORT).toEqual({ width: 1280, height: 720 })
    expect(FILM_DEVICE_SCALE_FACTOR).toBe(2)
  })

  test('the bundled font bytes match the recorded checksums', () => {
    const root = resolve(import.meta.dir, '../../public/fonts')
    const provenance = readFileSync(resolve(root, 'PROVENANCE.md'), 'utf8')
    const section = provenance.split('## Staged file checksums (sha256)')[1] as string
    const recorded = [...section.matchAll(/^([0-9a-f]{64}) {2}(\S+\.woff2)$/gm)]
    expect(recorded).toHaveLength(10)
    for (const [, sum, file] of recorded) {
      expect(createHash('sha256').update(readFileSync(resolve(root, file as string))).digest('hex')).toBe(sum as string)
    }
  })
})
