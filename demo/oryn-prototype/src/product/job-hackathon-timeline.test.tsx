import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CLIPS, startFrameOf } from '../../scripts/clips'
import { authorClip, formatTimeline } from '../../scripts/author-product-clips'
import { buildSidecar, parseTimeline, resolveFrame, validateTimeline } from '@/film'
import type { ResolvedFrame, Timeline } from '@/film'
import { jobCounts } from '@/state'
import type { Action } from '@/state'
import { HK_H4F } from './clip-specs-job-hackathon'
import { ProductFilmSurface } from './FilmProduct'
import { JOB_ANCHOR_RECTS, JOB_SUMMARY_ANCHOR_RECTS, JOBS_ANCHOR_RECTS } from './job-layout'

/** BOB-09 hackathon clip: hk-h4f-job (H-092 to H-102, 01:57 to 02:08): start, eleven cases, 7/2/1/1, approval, readback, held unknown, next cycle. */

const FILE = path.resolve(import.meta.dir, '../../film', HK_H4F.cut, `${HK_H4F.clipId}.timeline.json`)
const hk: Timeline = parseTimeline(JSON.parse(readFileSync(FILE, 'utf8')))
const at = (frame: number): ResolvedFrame => resolveFrame(hk, frame)
const html = (frame: number): string => renderToStaticMarkup(createElement(ProductFilmSurface, { resolved: at(frame) }))
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
const text = (frame: number): string => plain(html(frame)).replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const range = (first: number, last: number): number[] => Array.from({ length: last - first + 1 }, (_, i) => first + i)
/** Execution cyan: the running glyph and its orbit. */
const hasCyan = (markup: string): boolean => /data-running="true"|bg-arc\b|var\(--arc-mark\)/.test(markup)
const counts = (frame: number): string => {
  const c = jobCounts(at(frame).state)
  return `${c.verified}/${c.escalated}/${c.approval}/${c.unknown}`
}
const sampled: number[] = [...new Set([...range(0, 109).map((i) => i * 3), ...range(0, 10).map((i) => i * 30), hk.durationFrames - 1])].filter((frame) => frame < hk.durationFrames)
const applied = (type: Action['type']): readonly { readonly frame: number; readonly action: Action }[] => at(hk.durationFrames - 1).applied.filter((entry) => entry.action.type === type)
const firstFrame = (type: Action['type']): number => applied(type)[0]?.frame ?? -1
const sidecar = buildSidecar(hk)
const visibleOn = (name: string): number[] => range(0, hk.durationFrames - 1).filter((frame) => sidecar.anchors[name]?.[frame]?.visible)
/** The pointer tip is inside the named anchor's rectangle on `frame`. */
const expectTipIn = (frame: number, name: string): void => {
  const rect = hk.anchors[name]?.rect
  const tip = at(frame).view.cursor
  expect(rect).toBeDefined()
  expect(tip.visible).toBe(true)
  expect(tip.x).toBeGreaterThanOrEqual((rect?.x as number) - 0.5)
  expect(tip.x).toBeLessThanOrEqual((rect?.x as number) + (rect?.width as number) + 0.5)
  expect(tip.y).toBeGreaterThanOrEqual((rect?.y as number) - 0.5)
  expect(tip.y).toBeLessThanOrEqual((rect?.y as number) + (rect?.height as number) + 0.5)
}
const contiguous = (name: string, first: number, last: number): void => {
  expect(visibleOn(name)).toEqual(range(first, last))
}

describe('hk-h4f-job matches the roadmap table and the storyboard entries', () => {
  const clip = CLIPS.find((item) => item.clipId === HK_H4F.clipId)

  test('validates, has the table length and carries clip-local entries H-092 to H-102', () => {
    expect(validateTimeline(hk)).toEqual([])
    expect(clip?.frames).toBe(330)
    expect(hk.durationFrames).toBe(330)
    expect(hk.filmStartFrame).toBe(clip ? startFrameOf(clip) : undefined)
    expect(hk.filmStartFrame).toBe(3510)
    expect(hk.startAt).toBe('ST09')
    for (const event of hk.events) {
      expect(event.entry).toMatch(clip?.entry ?? /^$/)
      expect(event.entry).toBe(HK_H4F.entryAt(event.frame))
    }
  })

  test('the JSON on disk is exactly what the spec generates', () => {
    expect(readFileSync(FILE, 'utf8')).toBe(formatTimeline(authorClip(HK_H4F)))
  }, 120_000)

  test('every storyboard entry H-092 to H-102 appears, each on its own 30-frame block, and no camera or stage text is filmed', () => {
    const expected = range(92, 102).map((n) => `H-${String(n).padStart(3, '0')}`)
    expect([...new Set(hk.events.map((event) => event.entry ?? ''))].sort()).toEqual(expected)
    expected.forEach((entry, index) => {
      const own = hk.events.filter((event) => event.entry === entry)
      expect(own.length).toBeGreaterThan(0)
      expect(own.every((event) => event.frame >= index * 30 && event.frame < (index + 1) * 30)).toBe(true)
    })
    expect(hk.events.some((event) => event.type === 'camera' || event.type === 'type')).toBe(false)
  })
})

describe('H-092: queue, selection, scope and start are separate events', () => {
  test('the invoices are confirmed and the scope dialog is open before the start press, and nothing is running yet', () => {
    const before = at(13)
    expect(before.state.route).toBe('SC21')
    expect(before.state.phase).toBe('ST09')
    expect(before.state.ui.job.selection).toBe('confirmed')
    expect(before.state.ui.job.dialog).toBe('open')
    expect(before.state.running.job).toBe(false)
    expect(counts(13)).toBe('0/0/0/0')
    const page = text(13)
    for (const copy of ['JOB-0117', 'Supplier Invoice Reconciler v1.0', 'AP East', '11 invoices']) expect(page).toContain(copy)
  })

  test('CONFIRM_SELECTION, OPEN_JOB_SCOPE and RELEASE_AND_START are distinct actions, with start on f34', () => {
    const order = at(329).applied.map((entry) => entry.action.type)
    const [selection, scope, start] = ['CONFIRM_SELECTION', 'OPEN_JOB_SCOPE', 'RELEASE_AND_START'].map((type) => order.indexOf(type as Action['type']))
    expect(selection).toBeGreaterThanOrEqual(0)
    expect(selection).toBeLessThan(scope as number)
    expect(scope).toBeLessThan(start as number)
    expect(firstFrame('RELEASE_AND_START')).toBe(34)
    expect(firstFrame('EVALUATE_CASE')).toBeGreaterThan(firstFrame('RELEASE_AND_START'))
    expect(firstFrame('CONFIRM_SELECTION')).toBeLessThanOrEqual(firstFrame('OPEN_JOB_SCOPE'))
    expect(firstFrame('OPEN_JOB_SCOPE')).toBeLessThan(firstFrame('RELEASE_AND_START'))
    expect(applied('RELEASE_AND_START')).toHaveLength(1)
  })

  test('the start closes the dialog and begins the run on f34', () => {
    const started = at(34)
    expect(started.state.phase).toBe('ST10')
    expect(started.state.ui.job.dialog).toBe('closed')
    expect(started.state.running.job).toBe(true)
    expect(counts(34)).toBe('0/0/0/0')
    expect(jobCounts(started.state).queued).toBe(11)
    expect(hasCyan(html(34))).toBe(true)
    expect(hasCyan(html(33))).toBe(false)
  })

  test('the pointer opens scope then travels to Start job', () => {
    const rect = JOBS_ANCHOR_RECTS['start-job']
    const tip = at(34).view.cursor
    expect(tip.visible).toBe(true)
    expect(tip.x).toBeGreaterThanOrEqual(rect.x)
    expect(tip.x).toBeLessThanOrEqual(rect.x + rect.width)
    expect(tip.y).toBeGreaterThanOrEqual(rect.y)
    expect(tip.y).toBeLessThanOrEqual(rect.y + rect.height)
    expect(hk.events.find((event) => event.type === 'cursor' && event.click)?.frame).toBe(0)
  })
})

describe('H-093 to H-095: eleven independent cases', () => {
  test('SC22 shows the first running case before its outcome resolves', () => {
    expect(at(35).state.route).toBe('SC22')
    expect(counts(49)).toBe('0/0/0/0')
    expect(text(40)).toContain('INV-48210 Brightwater Industrial $6,240.00 PO-1031 Running')
    expect(counts(50)).toBe('1/0/0/0')
    const evaluated = applied('EVALUATE_CASE')
    expect(evaluated).toHaveLength(11)
    expect(evaluated.every((entry) => entry.frame > firstFrame('RELEASE_AND_START'))).toBe(true)
    expect(evaluated.map((entry) => entry.frame)).toEqual([...evaluated.map((entry) => entry.frame)].sort((a, b) => a - b))
  })

  test('verified cases and escalations settle independently', () => {
    const frames = Object.fromEntries(applied('EVALUATE_CASE').map((entry) => [(entry.action as Extract<Action, { type: 'EVALUATE_CASE' }>).invoice, entry.frame]))
    const verified = ['INV-48210', 'INV-48211', 'INV-48212', 'INV-48213', 'INV-48214', 'INV-48216', 'INV-48217'].map((invoice) => frames[invoice] as number)
    expect(verified.slice(1).every((frame, i) => frame - (verified[i] as number) === 2 || i === 0)).toBe(true)
    expect(Math.min(...verified.slice(1))).toBeGreaterThanOrEqual(60)
    expect(Math.max(...verified)).toBeLessThan(90)
    expect(counts(89)).toBe('7/0/0/0')
    expect((frames['INV-48218'] as number) - (frames['INV-48215'] as number)).toBe(2)
    expect(frames['INV-48215']).toBeGreaterThanOrEqual(90)
    expect(counts(97)).toBe('7/1/0/0')
    expect(text(97)).toContain('7 Verified Complete · 1 Escalated')
  })

  test('H-095: the two escalations, the approval case and the held unknown are all in by f112; the job is still running until f120', () => {
    expect(counts(111)).toBe('7/2/1/0')
    expect(counts(112)).toBe('7/2/1/1')
    expect(at(119).state.running.job).toBe(true)
    expect(at(119).state.route).toBe('SC22')
    expect(text(119)).toContain('Escalated')
  })

  test('the hover follows the first row (H-093, H-094) and travels to the first exception row (H-095)', () => {
    for (const frame of [50, 60, 75, 89]) expectTipIn(frame, 'case-row-inv-48210')
    expectTipIn(119, 'case-row-inv-48215')
  })
})

describe('H-096 and H-097: the stopped job is Partially Complete 7/2/1/1; the unknown is not success', () => {
  test('f120: PAUSE_FOR_APPROVAL stops the job and the screen cuts to the summary: 7 / 2 / 1 / 1, Partially Complete, Before approval', () => {
    expect(at(119).state.running.job).toBe(true)
    const stopped = at(120)
    expect(stopped.state.phase).toBe('ST11')
    expect(stopped.state.route).toBe('SC25')
    expect(stopped.state.running.job).toBe(false)
    const page = text(130)
    expect(page).toContain('Partially Complete')
    expect(page).toContain('Before approval')
    expect(page).toMatch(/7 Verified Complete\s+2 Escalated\s+1 Approval Required\s+1 Outcome Unknown/)
    expect(counts(130)).toBe('7/2/1/1')
    expect(page).not.toContain('11 successful')
  })

  test('f161: pressing the unknown card filters to it, selects INV-48220 and opens its evidence drawer, still 7 / 2 / 1 / 1', () => {
    expect(at(160).state.route).toBe('SC25')
    const drawer = at(165)
    expect(drawer.state.route).toBe('SC24')
    expect(drawer.state.selectedCase).toBe('INV-48220')
    expect(drawer.state.ui.job.filter).toBe('unknown')
    const page = text(170)
    for (const copy of ['INV-48220', 'Northgate Pallets', '$2,732.50', 'PO-1044', 'Outcome Unknown', 'Held', 'Not resubmitted']) expect(page).toContain(copy)
    expect(counts(170)).toBe('7/2/1/1')
  })

  test('INV-48220 is Outcome Unknown on every frame from f112 and is never decided, read back or retried', () => {
    for (const frame of range(112, hk.durationFrames - 1)) expect(at(frame).state.job.outcomes['INV-48220']).toBe('unknown')
    for (const entry of at(hk.durationFrames - 1).applied) {
      const action = entry.action
      if (action.type === 'APPROVE' || action.type === 'VERIFY_READBACK' || action.type === 'EVALUATE_CASE') {
        if (action.type !== 'EVALUATE_CASE') expect(action.invoice).toBe('INV-48219')
      }
    }
    expect(at(hk.durationFrames - 1).rejections).toEqual([])
  })
})

describe('H-098 to H-100: authorization and verification are separate events', () => {
  test('Daniel is selected at f180 before any decision, and the drawer opens from the approval row at f193', () => {
    expect(at(179).state.actorId).toBe('marcus')
    expect(at(180).state.actorId).toBe('daniel')
    expect(at(180).state.route).toBe('SC22')
    expect(at(180).state.ui.job.filter).toBe('all')
    expect(at(192).state.route).toBe('SC22')
    const drawer = at(193)
    expect(drawer.state.route).toBe('SC23')
    expect(drawer.state.selectedCase).toBe('INV-48219')
    const page = text(200)
    for (const copy of ['INV-48219', 'Brightwater Industrial', 'PO-1042', '$18,420.00', '$17,980.00', '2.45%', 'Daniel Okafor']) expect(page).toContain(copy)
  })

  test('APPROVE lands at f225 and VERIFY_READBACK at f250: different frames, the approval first, and the verified count unchanged until the readback', () => {
    const [approve] = applied('APPROVE')
    const [verify] = applied('VERIFY_READBACK')
    expect(applied('APPROVE')).toHaveLength(1)
    expect(applied('VERIFY_READBACK')).toHaveLength(1)
    expect(approve?.frame).toBe(225)
    expect(verify?.frame).toBe(250)
    expect(verify?.frame).toBeGreaterThan(approve?.frame as number)
    expect(approve?.action).toEqual({ type: 'APPROVE', invoice: 'INV-48219' })
    expect(verify?.action).toEqual({ type: 'VERIFY_READBACK', invoice: 'INV-48219', result: 'verified' })
    expect(at(224).state.approval.decision).toBe('pending')
    expect(at(225).state.approval.decision).toBe('approved')
    expect(at(225).state.approval.by).toBe('daniel')
    for (const frame of range(120, 249)) {
      expect(counts(frame)).toBe('7/2/1/1')
      expect(at(frame).state.job.outcomes['INV-48219']).toBe('approval')
    }
    for (const frame of range(225, 249)) expect(at(frame).state.readback.status).toBe('pending')
    for (const frame of range(250, hk.durationFrames - 1)) {
      expect(counts(frame)).toBe('8/2/0/1')
      expect(at(frame).state.readback.status).toBe('verified')
    }
  })

  test('the awaiting-verification overlay is on from the APPROVE landing to the readback frame', () => {
    for (const frame of range(0, hk.durationFrames - 1)) {
      const on = at(frame).view.overlays['job:awaiting-verification'] === true
      expect(on).toBe(frame >= 225 && frame < 250)
    }
  })

  test('H-100: the summary shows the approval as awaiting verification, then swaps to 8 / 2 / 0 / 1 without an intermediate number', () => {
    expect(at(240).state.route).toBe('SC25')
    const pending = text(245)
    expect(pending).toContain('Before approval')
    expect(pending).toContain('INV-48219 approved by Daniel Okafor · Awaiting verification · counts unchanged until independent readback')
    expect(pending).toMatch(/7 Verified Complete\s+2 Escalated\s+1 Approval Required\s+1 Outcome Unknown/)
    const verified = text(260)
    expect(verified).toContain('After approval and verification')
    expect(verified).toMatch(/8 Verified Complete\s+2 Escalated\s+0 Approval Required\s+1 Outcome Unknown/)
    expect(verified).toContain('INV-48219 independently read back: Matched - Variance Approved')
    expect(verified).toContain('Partially Complete')
    expect(verified).not.toContain('11 successful')
    expect(counts(249)).toBe('7/2/1/1')
    expect(counts(250)).toBe('8/2/0/1')
  })

  test('the pointer presses the approval row at f193 and Approve at f225, and holds on each until the next move', () => {
    for (const frame of [193, 200, 209]) expectTipIn(frame, 'approval-row')
    for (const frame of [225, 232, 239]) expectTipIn(frame, 'approve')
    expectTipIn(130, 'summary-approval')
    expectTipIn(149, 'summary-approval')
  })

  test('H-100: no pointer from f240 to f269', () => {
    for (const frame of range(240, 269)) expect(at(frame).view.cursor.visible).toBe(false)
    for (const frame of [230, 239, 270, 285, 329]) expect(at(frame).view.cursor.visible).toBe(true)
  })
})

describe('H-101 and H-102: no blind retry, then the next supplier', () => {
  test('f270: the drawer returns to INV-48220 held and not resubmitted, neutral, with no success mark and no retry control', () => {
    const state = at(270).state
    expect(state.route).toBe('SC24')
    expect(state.selectedCase).toBe('INV-48220')
    const page = text(285)
    for (const copy of ['INV-48220', 'Held', 'Reconciliation required', 'Not resubmitted', 'Outcome Unknown']) expect(page).toContain(copy)
    expect(page).toContain('Investigate')
    expect(hasCyan(html(285))).toBe(false)
    expect(at(285).state.job.outcomes['INV-48220']).toBe('unknown')
  })

  test('the pointer hovers Investigate and then the independent evidence without clicking', () => {
    expectTipIn(286, 'investigate')
    expectTipIn(299, 'unknown-evidence')
    expect(at(299).state.ui.job.investigating).toBe(false)
    expect(hk.events.filter((event) => event.type === 'cursor' && event.click && event.frame >= 270)).toEqual([])
    expect(applied('SET_JOB_VIEW')).toEqual([])
  })

  test('f300 to f329: SC05 shows Kestrel INV-48231 with the handling fee isolated; the next-cycle incident is not entered', () => {
    expect(at(299).state.route).toBe('SC24')
    const doc = at(329)
    expect(doc.state.route).toBe('SC05')
    expect(doc.state.phase).toBe('ST11')
    expect(applied('NEXT_CYCLE_INCIDENT')).toEqual([])
    expect(doc.state.theme).not.toBe('dark')
    const page = text(329)
    for (const copy of ['Kestrel Components', 'INV-48231', 'Handling fee', '$38.50', 'PO-1051', '$4,213.50']) expect(page).toContain(copy)
    expect(doc.view.outlines.some((outline) => outline.anchor === 'handling-fee')).toBe(true)
    expect(at(314).view.outlines.some((outline) => outline.anchor === 'handling-fee' && outline.kind === 'selected')).toBe(false)
  })
})

describe('cyan and the stopped job', () => {
  test('execution cyan exists only while the job runs', () => {
    for (const frame of sampled) {
      const resolved = at(frame)
      expect(hasCyan(html(frame))).toBe(resolved.state.running.job)
      expect(resolved.state.running.job).toBe(frame >= 34 && frame < 120)
    }
  })

  test('no cyan markup from f120 on, and none anywhere in f240-f329', () => {
    for (const frame of [...range(120, 329).filter((f) => f % 3 === 0), 120, 121, 239, 240, 250, 251, 329]) expect(hasCyan(html(frame))).toBe(false)
  })

  test('the stopped job shows no Running, never a retry control and never `11 successful`', () => {
    for (const frame of range(120, 299).filter((f) => f % 4 === 0)) {
      const page = text(frame)
      expect(page).not.toMatch(/\bRunning\b/)
      expect(page).not.toMatch(/retry|Retry|resubmit now|Resubmit job/)
      expect(page).not.toContain('11 successful')
      expect(page).not.toContain('Completed with exceptions')
    }
    for (const frame of range(0, 119).filter((f) => f % 6 === 0)) {
      expect(text(frame)).not.toMatch(/retry|Retry/)
      expect(text(frame)).not.toContain('11 successful')
    }
    expect(text(130)).toContain('Partially Complete')
  })
})

describe('the sidecar exposes the anchors on the frames the screens show them', () => {
  const names = ['start-job', 'case-row-inv-48210', 'case-row-inv-48215', 'approval-row', 'approve', 'investigate', 'summary-approval', 'summary-unknown', 'handling-fee', 'deploy', 'job-table']

  test('every named anchor is sampled on every one of the 330 frames and the rectangles are the layout modules', () => {
    expect(sidecar.frameCount).toBe(330)
    for (const name of names) expect(sidecar.anchors[name]).toHaveLength(330)
    expect(hk.anchors['start-job']?.rect).toEqual(JOBS_ANCHOR_RECTS['start-job'])
    expect(hk.anchors.approve?.rect).toEqual(JOB_ANCHOR_RECTS.approve)
    expect(hk.anchors['summary-unknown']?.rect).toEqual(JOB_SUMMARY_ANCHOR_RECTS['summary-unknown'])
    expect(hk.anchors['summary-approval']?.rect).toEqual(JOB_SUMMARY_ANCHOR_RECTS['summary-approval'])
  })

  test('Start job is visible while the dialog is open', () => {
    contiguous('start-job', 11, 33)
  })

  test('Approve is visible while the approval drawer is open (f193-f239), covering the press at f210-f229', () => {
    contiguous('approve', 193, 239)
    for (const frame of range(210, 229)) expect(sidecar.anchors.approve?.[frame]?.visible).toBe(true)
  })

  test('the case rows are visible on SC22 to SC24 only; the summary cards on SC25 only; Investigate on the unknown drawer', () => {
    const table = [...range(35, 119), ...range(161, 239), ...range(270, 299)]
    expect(visibleOn('case-row-inv-48210')).toEqual(table)
    expect(visibleOn('case-row-inv-48215')).toEqual(table)
    expect(visibleOn('job-table')).toEqual(table)
    expect(visibleOn('summary-approval')).toEqual([...range(120, 160), ...range(240, 269)])
    expect(visibleOn('summary-unknown')).toEqual([...range(120, 160), ...range(240, 269)])
    expect(visibleOn('approval-row')).toEqual([...range(161, 239), ...range(270, 299)])
    expect(visibleOn('investigate')).toEqual([...range(161, 179), ...range(270, 299)])
  })

  test('the handling fee is visible on SC05 (f300-f329) and the gate Deploy anchor never again after f0', () => {
    contiguous('handling-fee', 300, 329)
    expect(visibleOn('deploy')).toEqual([])
  })
})

describe('seeking: a reverse pass and a shuffled direct pass equal the linear pass', () => {
  const signature = (frame: number): string => JSON.stringify(at(frame)) + html(frame)
  test('the sampled frames resolve identically in any order', () => {
    const list = sampled
    const linear = list.map(signature)
    const reverse = [...list].reverse().map(signature).reverse()
    expect(reverse).toEqual(linear)
    const shuffled = list.map((_, i) => list[(i * 7) % list.length] as number)
    expect(shuffled.map(signature)).toEqual(shuffled.map((frame) => linear[list.indexOf(frame)] as string))
  })
})
