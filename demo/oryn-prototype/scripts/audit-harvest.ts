import { mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { CLIPS } from './clips'
import { APP_ROOT, DEFAULT_PUBLIC_DIR, buildApp, guard, loadInPage, loadTimeline, openPage, seekInPage, serve, waitForFontsAndApi } from './capture-core'
import { FILM_VIEWPORT } from '@/film'

/**
 * BOB-13 harvest. For every product timeline it seeks each frame in the same film-capture page the
 * capture script uses (no screenshots) and records what the DOM shows: the visible text, every
 * element that draws arc cyan and whether an execution flag justifies it, the invoice rows, the
 * visible named anchors and anything that looks like a product caption. Consecutive frames with
 * an identical record are stored once as a range, so the dump stays reviewable.
 *
 * `bun run scripts/audit-harvest.ts [--out <file>] [--clip <clip-id>]` (default out: /tmp/bob13-frames.json).
 * The rules that judge this dump live in `scripts/audit-rules.ts`.
 */

export interface CyanHit {
  readonly element: string
  readonly property: string
  /** An ancestor-or-self carries an execution flag (data-running / data-executing / an in-flight progressbar). */
  readonly justified: boolean
}

export interface RowRecord {
  readonly id: string
  readonly text: string
}

export interface FrameRecord {
  readonly text: string
  readonly cyan: readonly CyanHit[]
  /** Elements flagged data-running="true" or data-executing="true", plus in-flight progress bars. */
  readonly executing: number
  readonly rows: readonly RowRecord[]
  /** Anchor names whose rectangle is shown (non-null, non-empty). */
  readonly anchors: readonly string[]
  /** Anchor names the timeline declares but whose rectangle is hidden. */
  readonly hiddenAnchors: readonly string[]
  /** Visible anchor rectangles that leave the 1280x720 canvas or have no area. */
  readonly badAnchors: readonly string[]
  /** Visible text of each anchor element, for the anchors the audit reads. */
  readonly anchorText: Readonly<Record<string, string>>
  readonly captions: readonly string[]
}

export interface Range {
  readonly from: number
  readonly to: number
  readonly record: FrameRecord
}

export interface ClipDump {
  readonly cut: string
  readonly clipId: string
  readonly frames: number
  readonly filmStartFrame: number
  readonly theme: string
  readonly ranges: readonly Range[]
  readonly clickTargets: readonly { frame: number; target: string }[]
}

const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/** Runs inside the page. No outer-scope references. */
function observe(declared: readonly string[]) {
  const canvas = document.querySelector<HTMLElement>('[data-film-canvas]')
  if (!canvas) throw new Error('no [data-film-canvas]')
  const TARGETS = [
    [47, 216, 255],
    [11, 125, 142],
  ]
  const near = (value: string): boolean => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(value)
    if (!m) return false
    if (m[4] !== undefined && Number(m[4]) === 0) return false
    return TARGETS.some((t) => Math.abs(Number(m[1]) - (t[0] as number)) <= 8 && Math.abs(Number(m[2]) - (t[1] as number)) <= 8 && Math.abs(Number(m[3]) - (t[2] as number)) <= 8)
  }
  const containsCyan = (value: string): boolean => {
    for (const m of value.matchAll(/rgba?\([^)]*\)/g)) if (near(m[0])) return true
    return false
  }
  const describe = (el: Element): string => `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? '.' + el.className.split(/\s+/).slice(0, 3).join('.') : ''}`
  const inFlight = (el: Element): boolean => {
    const bar = el.closest('[role="progressbar"]')
    if (!bar) return false
    const now = Number(bar.getAttribute('aria-valuenow'))
    const max = Number(bar.getAttribute('aria-valuemax') ?? '100')
    return Number.isFinite(now) && Number.isFinite(max) && now < max
  }
  const justified = (el: Element): boolean => el.closest('[data-running="true"],[data-executing="true"]') !== null || inFlight(el)

  const cyan: { element: string; property: string; justified: boolean }[] = []
  const SHAPES = new Set(['path', 'circle', 'rect', 'ellipse', 'polygon', 'polyline', 'line'])
  for (const el of Array.from(canvas.querySelectorAll('*'))) {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue
    const props: [string, string][] = []
    if (el instanceof SVGElement) {
      if (SHAPES.has(el.tagName.toLowerCase())) {
        if (cs.fill !== 'none') props.push(['fill', cs.fill])
        if (cs.stroke !== 'none') props.push(['stroke', cs.stroke])
      }
    } else {
      props.push(['background-color', cs.backgroundColor], ['box-shadow', cs.boxShadow], ['background-image', cs.backgroundImage])
      for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
        if (Number.parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== 'none') props.push([`border-${side.toLowerCase()}-color`, cs[`border${side}Color`]])
      }
      if (cs.outlineStyle !== 'none' && Number.parseFloat(cs.outlineWidth) > 0) props.push(['outline-color', cs.outlineColor])
      if (Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim() !== '')) props.push(['color', cs.color])
    }
    for (const [name, value] of props) if (value && containsCyan(value)) cyan.push({ element: describe(el), property: name, justified: justified(el) })
  }

  const executing = canvas.querySelectorAll('[data-running="true"],[data-executing="true"]').length + Array.from(canvas.querySelectorAll('[role="progressbar"]')).filter((bar) => inFlight(bar)).length

  // Smallest elements whose text names exactly one invoice.
  const ID = /INV-\d{5}/g
  const candidates: { el: Element; id: string; text: string }[] = []
  for (const el of Array.from(canvas.querySelectorAll<HTMLElement>('*'))) {
    if (!el.innerText || !/INV-\d{5}/.test(el.innerText)) continue
    const ids = new Set(el.innerText.match(ID))
    if (ids.size !== 1) continue
    candidates.push({ el, id: [...ids][0] as string, text: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 240) })
  }
  // Climb from the smallest element to the widest ancestor that still names only this invoice in a short row of text.
  const rows = candidates
    .filter((c) => !candidates.some((o) => o !== c && c.el.contains(o.el)))
    .map((c) => {
      let widest: HTMLElement = c.el as HTMLElement
      for (let parent = widest.parentElement; parent && parent !== canvas; parent = parent.parentElement) {
        const names = new Set(parent.innerText.match(ID))
        if (names.size !== 1 || parent.innerText.length > 300) break
        widest = parent
      }
      return { id: c.id, text: widest.innerText.replace(/\s+/g, ' ').trim().slice(0, 300) }
    })

  const anchors: string[] = []
  const hiddenAnchors: string[] = []
  const badAnchors: string[] = []
  const anchorText: Record<string, string> = {}
  for (const name of declared) {
    const el = canvas.querySelector<HTMLElement>(`[data-film-anchor="${CSS.escape(name)}"]`)
    if (!el) continue
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || r.width === 0 || r.height === 0) {
      hiddenAnchors.push(name)
      continue
    }
    anchors.push(name)
    const c = canvas.getBoundingClientRect()
    if (r.left < c.left - 1 || r.top < c.top - 1 || r.right > c.right + 1 || r.bottom > c.bottom + 1) badAnchors.push(name)
    anchorText[name] = (el.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
  }

  const captions: string[] = []
  for (const el of Array.from(canvas.querySelectorAll<HTMLElement>('figcaption,[data-caption],[class*="caption"],[role="caption"],track'))) captions.push(`${describe(el)}: ${(el.innerText ?? '').trim().slice(0, 80)}`)
  for (const el of Array.from(canvas.querySelectorAll<HTMLElement>('*'))) {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    if (cs.backgroundColor === 'rgb(10, 10, 10)' && r.width >= 400 && r.top >= 622 && r.bottom <= 696 && r.height <= 70 && (el.innerText ?? '').trim() !== '') captions.push(`subtitle-strip ${describe(el)}: ${(el.innerText ?? '').trim().slice(0, 80)}`)
  }
  // Text for the audit is what a viewer can read: screen-reader-only spans (disabled reasons) are not on screen.
  const hiddenForReaders = Array.from(canvas.querySelectorAll<HTMLElement>('.sr-only'))
  const previous = hiddenForReaders.map((el) => el.style.display)
  for (const el of hiddenForReaders) el.style.display = 'none'
  const visibleText = canvas.innerText
  hiddenForReaders.forEach((el, i) => {
    el.style.display = previous[i] ?? ''
  })
  return { text: visibleText, cyan, executing, rows, anchors, hiddenAnchors, badAnchors, anchorText, captions }
}

const key = (record: FrameRecord): string => JSON.stringify(record)

export async function harvest(options: { readonly out: string; readonly clip?: string }): Promise<void> {
  const publicDir = DEFAULT_PUBLIC_DIR
  const clips = CLIPS.filter((clip) => clip.cut !== 'sample' && (options.clip === undefined || clip.clipId === options.clip))
  const dist = await buildApp(publicDir)
  const server = serve(dist)
  const chrome = existsSync(MAC_CHROME) ? MAC_CHROME : (Bun.which('google-chrome') ?? Bun.which('chromium') ?? MAC_CHROME)
  const session = await openPage(chrome, `http://127.0.0.1:${server.port}`)
  const dumps: ClipDump[] = []
  try {
    for (const spec of clips) {
      const loaded = await loadTimeline({ cut: spec.cut, clip: spec.clipId })
      const { timeline } = loaded
      await session.page.goto(`http://127.0.0.1:${server.port}/index.html?view=film-capture&mode=film&theme=${timeline.theme ?? 'light'}`, { waitUntil: 'load' })
      guard(session)
      await waitForFontsAndApi(session)
      await loadInPage(session, loaded)
      const declared = Object.keys(timeline.anchors)
      const ranges: { from: number; to: number; record: FrameRecord }[] = []
      for (let frame = 0; frame < timeline.durationFrames; frame += 1) {
        await seekInPage(session, frame)
        const record = (await session.page.evaluate(observe, declared)) as FrameRecord
        guard(session)
        const last = ranges[ranges.length - 1]
        if (last && key(last.record) === key(record)) last.to = frame
        else ranges.push({ from: frame, to: frame, record })
      }
      const clickTargets = timeline.events.flatMap((event) => (event.type === 'cursor' && event.click && event.target !== undefined ? [{ frame: event.frame + event.duration, target: event.target }] : []))
      dumps.push({ cut: spec.cut, clipId: spec.clipId, frames: timeline.durationFrames, filmStartFrame: timeline.filmStartFrame ?? 0, theme: timeline.theme ?? 'light', ranges, clickTargets })
      console.error(`${spec.cut}/${spec.clipId}: ${timeline.durationFrames} frames, ${ranges.length} distinct ranges`)
    }
  } finally {
    await session.browser.close().catch(() => undefined)
    await server.stop(true)
    await rm(dist, { recursive: true, force: true })
  }
  await mkdir(path.dirname(options.out), { recursive: true })
  await writeFile(options.out, JSON.stringify({ viewport: FILM_VIEWPORT, appRoot: APP_ROOT, clips: dumps }))
}

if (import.meta.main) {
  const args = process.argv.slice(2)
  const take = (flag: string): string | undefined => {
    const i = args.indexOf(flag)
    return i >= 0 ? args[i + 1] : undefined
  }
  await harvest({ out: take('--out') ?? '/tmp/bob13-frames.json', clip: take('--clip') })
}
