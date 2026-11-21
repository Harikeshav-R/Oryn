import type { Server } from 'bun'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import { build } from 'vite'
import { FONT_FACES } from '@/fonts/faces'
import {
  FILM_DEVICE_SCALE_FACTOR,
  FILM_LOCALE,
  FILM_TIME_ZONE,
  FILM_VIEWPORT,
  buildSidecar,
  landingFrame,
  parseTimeline,
  validateTimeline,
} from '@/film'
import type { CursorEvent, Sidecar, Timeline } from '@/film'
import type { LoadReport, SeekReport, SeekResult } from '@/film/capture-api'
import { CLIPS, FPS, PRODUCT_CUTS, clipsOf, findClip, isCut, startFrameOf, type ClipSpec } from './clips'
import { checkContract } from './contract'
import { CaptureError } from './errors'

/**
 * BOB-03d capture. For one clip it validates `film/<cut>/<clip-id>.timeline.json`, builds the app,
 * serves it on loopback, drives headless Chrome at 1280x720 CSS / DPR 2 and seeks frames 0 to
 * `durationFrames - 1`. Each frame is reconstructed from the fixture baseline plus every prior
 * ordered event (`resolveFrame`), never from the previous screenshot. PNG frames are piped to
 * ffmpeg for a silent 2560x1440 30 fps MP4 and the sidecar is written beside it. Both files are
 * written under `.partial` names and replace the accepted files only after every check passes.
 */

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
export const APP_ROOT = path.resolve(SCRIPT_DIR, '..')
export const REPO_ROOT = path.resolve(APP_ROOT, '../..')
export const DEFAULT_FILM_DIR = path.join(APP_ROOT, 'film')
export const DEFAULT_OUT_DIR = path.join(REPO_ROOT, 'demo', 'video', 'clips')
export const DEFAULT_PUBLIC_DIR = path.join(APP_ROOT, 'public')

export const ENCODED_WIDTH = FILM_VIEWPORT.width * FILM_DEVICE_SCALE_FACTOR
export const ENCODED_HEIGHT = FILM_VIEWPORT.height * FILM_DEVICE_SCALE_FACTOR
/** Owner decision (BOB-03c): the DOM rectangle of an anchor may differ from the sidecar by at most 1 CSS px. */
export const ANCHOR_TOLERANCE_PX = 1
/** The arrow tip is placed from the same number the sidecar rounds to 1/1000 px; allow layout rounding only. */
export const CURSOR_TOLERANCE_PX = 0.1
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export interface CaptureOptions {
  readonly cut: string
  readonly clip: string
  /** Directory holding `<cut>/<clip-id>.timeline.json`. Default `demo/oryn-prototype/film`. */
  readonly filmDir?: string
  /** Directory receiving `<cut>/<clip-id>.mp4` and `.json`. Default `demo/video/clips`. */
  readonly outDir?: string
  /** Static files served at the app root: bundled fonts and image assets. Default `public`. */
  readonly publicDir?: string
  readonly chrome?: string
  readonly ffmpeg?: string
  readonly ffprobe?: string
  readonly log?: (line: string) => void
}

export interface SampleCheck {
  readonly label: 'start' | 'click' | 'middle' | 'final'
  readonly frame: number
  readonly cursor: { readonly sidecar: { x: number | null; y: number | null; visible: boolean }; readonly dom: { x: number; y: number } | null }
  readonly anchor: { readonly name: string; readonly sidecar: Sidecar['anchors'][string][number]; readonly dom: SeekReport['anchors'][string] } | null
  readonly pngSha256: string
  readonly domDigest: string
}

export interface CaptureResult {
  readonly cut: string
  readonly clipId: string
  readonly scene: string
  readonly filmStartFrame: number
  readonly frameCount: number
  readonly durationSeconds: number
  readonly mp4: string
  readonly sidecar: string
  readonly entries: readonly string[]
  readonly samples: readonly SampleCheck[]
  readonly reverseSeekFrames: readonly number[]
  readonly probe: { readonly width: number; readonly height: number; readonly rFrameRate: string; readonly frames: number; readonly duration: number; readonly audioStreams: number; readonly codec: string; readonly pixFmt: string }
}

const rel = (file: string): string => path.relative(REPO_ROOT, file) || file

// ---------------------------------------------------------------------------
// Inputs: clip, timeline, fonts, assets, tools
// ---------------------------------------------------------------------------

export function resolveClip(cut: string, clip: string): ClipSpec {
  if (!isCut(cut)) throw new CaptureError('unknown-cut', `Unknown cut "${cut}". Use ${PRODUCT_CUTS.join(' or ')}.`)
  const spec = findClip(cut, clip)
  if (!spec) {
    throw new CaptureError('unknown-clip', `Unknown clip "${clip}" for cut ${cut}. Known clips: ${clipsOf(cut).map((entry) => entry.clipId).join(', ')}.`)
  }
  return spec
}

export interface LoadedTimeline {
  readonly spec: ClipSpec
  readonly timeline: Timeline
  readonly raw: unknown
  readonly file: string
}

/** Read, shape-check, validate and contract-check the timeline. Throws one `CaptureError` naming the file and every problem. */
export async function loadTimeline(options: Pick<CaptureOptions, 'cut' | 'clip' | 'filmDir'>): Promise<LoadedTimeline> {
  const spec = resolveClip(options.cut, options.clip)
  const file = path.join(options.filmDir ?? DEFAULT_FILM_DIR, spec.cut, `${spec.clipId}.timeline.json`)
  if (!existsSync(file)) {
    throw new CaptureError('timeline-missing', `No timeline at ${rel(file)}. Author film/${spec.cut}/${spec.clipId}.timeline.json before capturing ${spec.clipId}.`)
  }
  let raw: unknown
  try {
    raw = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    throw new CaptureError('timeline-malformed', `${rel(file)} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
  let timeline: Timeline
  try {
    timeline = parseTimeline(raw)
  } catch (error) {
    throw new CaptureError('timeline-malformed', `${rel(file)}: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
  const problems = [...validateTimeline(timeline).map((problem) => `timeline: ${problem}`), ...checkContract(timeline, spec).map((problem) => `contract: ${problem}`)]
  if (problems.length > 0) {
    throw new CaptureError(problems.some((problem) => problem.startsWith('timeline:')) ? 'timeline-invalid' : 'contract', `${rel(file)} cannot be captured:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`)
  }
  return { spec, timeline, raw, file }
}

/** Every bundled font and declared asset must exist on disk and be non-empty before a browser starts. */
export async function checkStaticInputs(timeline: Timeline, publicDir: string): Promise<void> {
  for (const face of FONT_FACES) {
    const file = path.join(publicDir, face.path)
    const size = await stat(file).then((info) => info.size, () => -1)
    if (size <= 0) {
      throw new CaptureError('font-missing', `Missing font file ${rel(file)} (${face.family} ${face.weight}); ${size === 0 ? 'the file is empty' : 'the file does not exist'}. Restore it from public/fonts/ before capturing; no fallback font is substituted.`)
    }
  }
  for (const asset of timeline.assets ?? []) {
    const file = path.join(publicDir, asset)
    const size = await stat(file).then((info) => info.size, () => -1)
    if (size <= 0) {
      throw new CaptureError('asset-missing', `Missing required asset ${rel(file)} (declared in ${timeline.cut}/${timeline.clipId}.timeline.json assets); ${size === 0 ? 'the file is empty' : 'the file does not exist'}. No substitute is used.`)
    }
  }
}

function resolveTool(name: string, override: string | undefined, env: string, alternatives: readonly string[] = []): string {
  const found = override ?? process.env[env] ?? [name, ...alternatives].map((candidate) => (path.isAbsolute(candidate) ? (existsSync(candidate) ? candidate : null) : Bun.which(candidate))).find((candidate) => candidate)
  if (!found) throw new CaptureError('tool-missing', `${name} not found. Install it or set ${env} to its path.`)
  return found
}

// ---------------------------------------------------------------------------
// Sidecar
// ---------------------------------------------------------------------------

/** One sample per line so a 600-frame sidecar stays reviewable and diffs stay local. */
export function formatSidecar(sidecar: Sidecar): string {
  const scalar = (key: keyof Sidecar): string => `  ${JSON.stringify(key)}: ${JSON.stringify(sidecar[key])}`
  const rows = (items: readonly unknown[], indent: string): string => items.map((item) => `${indent}${JSON.stringify(item)}`).join(',\n')
  const anchors = Object.entries(sidecar.anchors)
    .map(([name, samples]) => `    ${JSON.stringify(name)}: [\n${rows(samples, '      ')}\n    ]`)
    .join(',\n')
  return [
    '{',
    `${(['cut', 'clipId', 'fps', 'width', 'height', 'coordinateSpace', 'frameCount', 'durationSeconds'] as const).map(scalar).join(',\n')},`,
    `  "cursor": [\n${rows(sidecar.cursor, '    ')}\n  ],`,
    `  "anchors": {\n${anchors}\n  }`,
    '}',
    '',
  ].join('\n')
}

/** Frame count and duration must agree across the timeline, the sidecar and every per-frame array. */
export function checkSidecar(sidecar: Sidecar, timeline: Timeline): void {
  const fail = (message: string): never => {
    throw new CaptureError('verify', `Sidecar ${timeline.cut}/${timeline.clipId}: ${message}`)
  }
  if (sidecar.frameCount !== timeline.durationFrames) fail(`frameCount ${sidecar.frameCount} differs from the timeline durationFrames ${timeline.durationFrames}.`)
  if (sidecar.durationSeconds !== sidecar.frameCount / FPS) fail(`durationSeconds ${sidecar.durationSeconds} is not frameCount / ${FPS}.`)
  if (sidecar.fps !== FPS || sidecar.width !== ENCODED_WIDTH || sidecar.height !== ENCODED_HEIGHT) fail(`fps/width/height are ${sidecar.fps}/${sidecar.width}/${sidecar.height}, expected ${FPS}/${ENCODED_WIDTH}/${ENCODED_HEIGHT}.`)
  if (sidecar.cursor.length !== sidecar.frameCount) fail(`cursor has ${sidecar.cursor.length} samples for ${sidecar.frameCount} frames.`)
  for (const [name, samples] of Object.entries(sidecar.anchors)) {
    if (samples.length !== sidecar.frameCount) fail(`anchor ${name} has ${samples.length} samples for ${sidecar.frameCount} frames.`)
  }
  for (let frame = 0; frame < sidecar.frameCount; frame += 1) {
    if (sidecar.cursor[frame]?.frame !== frame) fail(`cursor sample ${frame} carries frame ${String(sidecar.cursor[frame]?.frame)}.`)
  }
}

// ---------------------------------------------------------------------------
// App build, server, browser
// ---------------------------------------------------------------------------

export async function buildApp(publicDir: string): Promise<string> {
  const dist = await mkdtemp(path.join(tmpdir(), 'oryn-capture-'))
  try {
    await build({
      root: APP_ROOT,
      configFile: path.join(APP_ROOT, 'vite.config.ts'),
      publicDir,
      logLevel: 'error',
      build: { outDir: dist, emptyOutDir: true, reportCompressedSize: false },
    })
  } catch (error) {
    await rm(dist, { recursive: true, force: true })
    throw new CaptureError('browser', `Building the app for capture failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
  return dist
}

export function serve(dist: string): Server<undefined> {
  return Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(request) {
      const pathname = decodeURIComponent(new URL(request.url).pathname)
      const file = path.join(dist, path.normalize(pathname === '/' ? '/index.html' : pathname))
      if (!file.startsWith(dist + path.sep)) return new Response('forbidden', { status: 403 })
      const body = Bun.file(file)
      return (await body.exists()) ? new Response(body) : new Response('not found', { status: 404 })
    },
  })
}

export interface Session {
  readonly browser: Browser
  readonly page: Page
  readonly blocked: string[]
  readonly pageErrors: string[]
}

export async function openPage(chrome: string, origin: string): Promise<Session> {
  const browser = await puppeteer
    .launch({
      executablePath: chrome,
      headless: true,
      defaultViewport: null,
      args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--disable-gpu', '--disable-gpu-rasterization', `--lang=${FILM_LOCALE}`, '--no-first-run', '--no-default-browser-check', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'],
    })
    .catch((error: unknown) => {
      throw new CaptureError('browser', `Chrome did not start (${chrome}): ${error instanceof Error ? error.message : String(error)}. Set ORYN_CHROME to a Chrome or Chromium binary.`, { cause: error })
    })
  const page = await browser.newPage()
  const blocked: string[] = []
  const pageErrors: string[] = []
  await page.emulateTimezone(FILM_TIME_ZONE)
  await page.setViewport({ width: FILM_VIEWPORT.width, height: FILM_VIEWPORT.height, deviceScaleFactor: FILM_DEVICE_SCALE_FACTOR })
  await page.setExtraHTTPHeaders({ 'Accept-Language': FILM_LOCALE })
  // The film never reaches a live service: only the loopback app itself is allowed.
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const url = request.url()
    if (url.startsWith(origin) || url.startsWith('data:') || url.startsWith('blob:')) void request.continue()
    else {
      blocked.push(url)
      void request.abort('blockedbyclient')
    }
  })
  page.on('pageerror', (error) => void pageErrors.push(error instanceof Error ? error.message : String(error)))
  return { browser, page, blocked, pageErrors }
}

export function guard(session: Session): void {
  if (session.blocked.length > 0) throw new CaptureError('network', `The page requested a non-local URL, which is blocked: ${session.blocked[0]}. Captures never call external services.`)
  if (session.pageErrors.length > 0) throw new CaptureError('browser', `The page raised an error: ${session.pageErrors[0]}`)
}

export async function waitForFontsAndApi(session: Session): Promise<void> {
  const { page } = session
  try {
    await page.waitForFunction(() => window.__ORYN_FONTS__ !== undefined && window.__ORYN_FONTS__.status !== 'loading', { timeout: 30_000 })
  } catch (error) {
    guard(session)
    throw new CaptureError('font-unavailable', `Bundled fonts did not finish loading within 30 s: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
  const report = await page.evaluate(() => window.__ORYN_FONTS__)
  if (!report || report.status !== 'loaded') {
    const failed = (report?.faces ?? []).filter((face) => face.state !== 'loaded')
    throw new CaptureError('font-unavailable', `Bundled fonts unavailable; capture blocked:\n${failed.map((face) => `  - ${face.spec.family} ${face.spec.weight} ${face.spec.path}: ${face.reason}`).join('\n')}`)
  }
  try {
    await page.waitForFunction(() => window.__filmCapture !== undefined, { timeout: 15_000 })
  } catch (error) {
    guard(session)
    throw new CaptureError('browser', `The film-capture page did not publish window.__filmCapture: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
}

export async function loadInPage(session: Session, loaded: LoadedTimeline): Promise<void> {
  const report: LoadReport = await session.page.evaluate(async (raw) => {
    const api = window.__filmCapture
    if (!api) throw new Error('window.__filmCapture is missing')
    return api.load(raw)
  }, loaded.raw)
  guard(session)
  if (report.ok) return
  const code = report.kind === 'asset' ? 'asset-undecodable' : report.kind === 'surface' ? 'surface-missing' : 'timeline-malformed'
  throw new CaptureError(code, `${rel(loaded.file)}: ${report.message}`)
}

export async function seekInPage(session: Session, frame: number): Promise<SeekReport> {
  const result: SeekResult = await session.page.evaluate(async (target) => {
    const api = window.__filmCapture
    if (!api) throw new Error('window.__filmCapture is missing')
    return api.seek(target)
  }, frame)
  guard(session)
  if (!result.ok) throw new CaptureError('browser', `Seeking frame ${frame} failed: ${result.message}`)
  return result
}

// ---------------------------------------------------------------------------
// Frame checks
// ---------------------------------------------------------------------------

/** Compare what the DOM shows at `frame` with the sidecar samples for that frame. */
export function compareFrame(report: SeekReport, sidecar: Sidecar, timeline: Timeline): void {
  const key = `${timeline.cut}/${timeline.clipId}`
  const { frame } = report
  if (report.canvas.x !== 0 || report.canvas.y !== 0 || report.canvas.width !== FILM_VIEWPORT.width || report.canvas.height !== FILM_VIEWPORT.height) {
    throw new CaptureError('browser', `Frame ${frame}: the film canvas is ${JSON.stringify(report.canvas)}, expected 0,0 ${FILM_VIEWPORT.width}x${FILM_VIEWPORT.height} CSS px.`)
  }
  if (report.imageFailures.length > 0) throw new CaptureError('asset-undecodable', `Frame ${frame}: image did not decode: ${report.imageFailures.join(', ')}.`)
  for (const name of Object.keys(timeline.anchors)) {
    const measured = report.anchors[name]
    if (!measured?.found) {
      throw new CaptureError('anchor-missing', `Anchor "${name}" has no element on the ${key} surface (frame ${frame}). Add data-film-anchor="${name}" to the element it names, or remove the anchor from the timeline.`)
    }
    const expected = sidecar.anchors[name]?.[frame]
    if (!expected) throw new CaptureError('verify', `Sidecar has no sample for anchor "${name}" at frame ${frame}.`)
    if (expected.rect === null || measured.rect === null) {
      if (expected.rect !== measured.rect) {
        throw new CaptureError('anchor-mismatch', `Anchor "${name}" at frame ${frame}: the sidecar says ${expected.rect === null ? 'hidden' : JSON.stringify(expected.rect)} but the DOM shows ${measured.rect === null ? 'hidden' : JSON.stringify(measured.rect)}.`)
      }
      continue
    }
    const { x, y, width, height } = expected.rect
    const worst = Math.max(Math.abs(measured.rect.x - x), Math.abs(measured.rect.y - y), Math.abs(measured.rect.width - width), Math.abs(measured.rect.height - height))
    if (worst > ANCHOR_TOLERANCE_PX) {
      throw new CaptureError('anchor-mismatch', `Anchor "${name}" at frame ${frame}: DOM ${JSON.stringify(measured.rect)} differs from sidecar ${JSON.stringify(expected.rect)} by ${worst.toFixed(3)} CSS px (limit ${ANCHOR_TOLERANCE_PX}).`)
    }
  }
  const cursor = sidecar.cursor[frame]
  if (!cursor) throw new CaptureError('verify', `Sidecar has no cursor sample at frame ${frame}.`)
  if (!cursor.visible) {
    if (report.cursor !== null) throw new CaptureError('cursor-mismatch', `Frame ${frame}: the sidecar says the pointer is hidden but the DOM draws it at ${report.cursor.x},${report.cursor.y}.`)
  } else if (report.cursor === null || cursor.x === null || cursor.y === null) {
    throw new CaptureError('cursor-mismatch', `Frame ${frame}: the sidecar places the pointer at ${String(cursor.x)},${String(cursor.y)} but the DOM does not draw it.`)
  } else if (Math.abs(report.cursor.x - cursor.x) > CURSOR_TOLERANCE_PX || Math.abs(report.cursor.y - cursor.y) > CURSOR_TOLERANCE_PX) {
    throw new CaptureError('cursor-mismatch', `Frame ${frame}: the DOM pointer tip is ${report.cursor.x},${report.cursor.y} but the sidecar says ${cursor.x},${cursor.y}.`)
  }
}

function pngSize(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  const signature = png.length > 24 && png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4e && png[3] === 0x47
  return signature ? { width: view.getUint32(16), height: view.getUint32(20) } : { width: 0, height: 0 }
}

async function screenshot(session: Session, frame: number): Promise<Uint8Array> {
  const png = await session.page.screenshot({ type: 'png', optimizeForSpeed: true, captureBeyondViewport: false })
  const { width, height } = pngSize(png)
  if (width !== ENCODED_WIDTH || height !== ENCODED_HEIGHT) {
    throw new CaptureError('screenshot', `Frame ${frame}: the screenshot is ${width}x${height}, expected ${ENCODED_WIDTH}x${ENCODED_HEIGHT} (1280x720 CSS at DPR ${FILM_DEVICE_SCALE_FACTOR}).`)
  }
  return png
}

const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex')

/** Frames compared after the linear pass: start, the first click landing, the middle and the final frame. */
export function sampleFrames(timeline: Timeline): readonly { label: SampleCheck['label']; frame: number }[] {
  const last = timeline.durationFrames - 1
  const click = timeline.events.find((event): event is CursorEvent => event.type === 'cursor' && event.click)
  const picks: { label: SampleCheck['label']; frame: number }[] = [{ label: 'start', frame: 0 }]
  if (click) picks.push({ label: 'click', frame: Math.min(landingFrame(click), last) })
  picks.push({ label: 'middle', frame: Math.floor(last / 2) }, { label: 'final', frame: last })
  const seen = new Set<number>()
  return picks.filter((pick) => (seen.has(pick.frame) ? false : (seen.add(pick.frame), true)))
}

// ---------------------------------------------------------------------------
// Encoding and verification
// ---------------------------------------------------------------------------

interface Encoder {
  write(png: Uint8Array): Promise<void>
  finish(): Promise<void>
  abort(): void
}

function startEncoder(ffmpeg: string, frames: number, output: string): Encoder {
  const args = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', 'pipe:0',
    '-frames:v', String(frames),
    '-an',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-r', String(FPS),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-movflags', '+faststart', '-f', 'mp4', output,
  ]
  const proc = Bun.spawn([ffmpeg, ...args], { stdin: 'pipe', stdout: 'ignore', stderr: 'pipe' })
  const stderr = new Response(proc.stderr).text()
  const failure = async (cause: unknown): Promise<CaptureError> => {
    proc.kill()
    const code = await proc.exited
    const tail = (await stderr).trim().split('\n').slice(-12).join('\n')
    return new CaptureError('encode', `ffmpeg failed (exit ${code}) writing ${rel(output)}: ${cause instanceof Error ? cause.message : String(cause)}\n${tail}`, { cause })
  }
  return {
    async write(png) {
      try {
        proc.stdin.write(png)
        await proc.stdin.flush()
      } catch (error) {
        throw await failure(error)
      }
    },
    async finish() {
      try {
        await proc.stdin.end()
      } catch (error) {
        throw await failure(error)
      }
      const code = await proc.exited
      if (code !== 0) {
        const tail = (await stderr).trim().split('\n').slice(-12).join('\n')
        throw new CaptureError('encode', `ffmpeg exited ${code} writing ${rel(output)}:\n${tail}`)
      }
    },
    abort() {
      proc.kill()
    },
  }
}

interface ProbeStream {
  readonly codec_type?: string
  readonly codec_name?: string
  readonly width?: number
  readonly height?: number
  readonly r_frame_rate?: string
  readonly nb_read_frames?: string
  readonly duration?: string
  readonly pix_fmt?: string
}

export async function probeMp4(ffprobe: string, file: string): Promise<CaptureResult['probe']> {
  const proc = Bun.spawn([ffprobe, '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file], { stdout: 'pipe', stderr: 'pipe' })
  const [out, err, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])
  if (code !== 0) throw new CaptureError('verify', `ffprobe failed (exit ${code}) on ${rel(file)}: ${err.trim()}`)
  const parsed = JSON.parse(out) as { streams?: ProbeStream[]; format?: { duration?: string } }
  const streams = parsed.streams ?? []
  const video = streams.filter((stream) => stream.codec_type === 'video')
  const audio = streams.filter((stream) => stream.codec_type === 'audio')
  const first = video[0]
  if (video.length !== 1 || !first) throw new CaptureError('verify', `${rel(file)} has ${video.length} video streams, expected 1.`)
  return {
    width: first.width ?? 0,
    height: first.height ?? 0,
    rFrameRate: first.r_frame_rate ?? '',
    frames: Number(first.nb_read_frames),
    duration: Number(first.duration ?? parsed.format?.duration),
    audioStreams: audio.length,
    codec: first.codec_name ?? '',
    pixFmt: first.pix_fmt ?? '',
  }
}

/** The encoded file must match the timeline and the sidecar exactly, by frame count and by duration in frames. */
export function checkProbe(probe: CaptureResult['probe'], timeline: Timeline, sidecar: Sidecar): void {
  const problems: string[] = []
  if (probe.audioStreams !== 0) problems.push(`${probe.audioStreams} audio stream(s); product clips are silent`)
  if (probe.rFrameRate !== `${FPS}/1`) problems.push(`r_frame_rate is ${probe.rFrameRate}, expected ${FPS}/1`)
  if (probe.width !== ENCODED_WIDTH || probe.height !== ENCODED_HEIGHT) problems.push(`size is ${probe.width}x${probe.height}, expected ${ENCODED_WIDTH}x${ENCODED_HEIGHT}`)
  if (probe.frames !== timeline.durationFrames) problems.push(`${probe.frames} frames, but the timeline durationFrames is ${timeline.durationFrames}`)
  if (probe.frames !== sidecar.frameCount) problems.push(`${probe.frames} frames, but the sidecar frameCount is ${sidecar.frameCount}`)
  if (!(Math.abs(probe.duration - sidecar.frameCount / FPS) < 0.5 / FPS)) problems.push(`duration ${probe.duration} s differs from frameCount / ${FPS} = ${sidecar.frameCount / FPS} s`)
  if (problems.length > 0) throw new CaptureError('verify', `Encoded clip rejected:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`)
}

// ---------------------------------------------------------------------------
// The capture
// ---------------------------------------------------------------------------

export async function capture(options: CaptureOptions): Promise<CaptureResult> {
  const log = options.log ?? ((line: string) => void console.error(line))
  const publicDir = options.publicDir ?? DEFAULT_PUBLIC_DIR
  const loaded = await loadTimeline(options)
  const { spec, timeline } = loaded
  await checkStaticInputs(timeline, publicDir)
  const chrome = resolveTool('Chrome', options.chrome, 'ORYN_CHROME', [MAC_CHROME, 'google-chrome', 'chromium'])
  const ffmpeg = resolveTool('ffmpeg', options.ffmpeg, 'ORYN_FFMPEG')
  const ffprobe = resolveTool('ffprobe', options.ffprobe, 'ORYN_FFPROBE')

  const sidecar = buildSidecar(timeline)
  checkSidecar(sidecar, timeline)

  const outDir = path.join(options.outDir ?? DEFAULT_OUT_DIR, spec.cut)
  const mp4 = path.join(outDir, `${spec.clipId}.mp4`)
  const json = path.join(outDir, `${spec.clipId}.json`)
  const partial = { mp4: `${mp4}.partial`, json: `${json}.partial` }
  await mkdir(outDir, { recursive: true })

  log(`${spec.cut}/${spec.clipId}: ${timeline.durationFrames} frames, film frame ${startFrameOf(spec)} (${spec.startSeconds} s), scene ${String(timeline.scene)}`)
  log('building the app and starting headless Chrome on loopback')
  const dist = await buildApp(publicDir)
  const server = serve(dist)
  let session: Session | null = null
  let encoder: Encoder | null = null
  try {
    session = await openPage(chrome, `http://127.0.0.1:${server.port}`)
    await session.page.goto(`http://127.0.0.1:${server.port}/index.html?view=film-capture&mode=film&theme=${timeline.theme ?? 'light'}`, { waitUntil: 'load' })
    guard(session)
    await waitForFontsAndApi(session)
    await loadInPage(session, loaded)

    const picks = sampleFrames(timeline)
    const pickAt = new Map(picks.map((pick) => [pick.frame, pick.label]))
    const linear = new Map<number, { png: string; digest: string; report: SeekReport }>()

    // Frame 0 first: a missing anchor or element stops the run before any file is written.
    compareFrame(await seekInPage(session, 0), sidecar, timeline)

    encoder = startEncoder(ffmpeg, timeline.durationFrames, partial.mp4)
    for (let frame = 0; frame < timeline.durationFrames; frame += 1) {
      const report = await seekInPage(session, frame)
      compareFrame(report, sidecar, timeline)
      const png = await screenshot(session, frame)
      if (pickAt.has(frame)) linear.set(frame, { png: sha256(png), digest: report.digest, report })
      await encoder.write(png)
      if (frame % 60 === 59 || frame === timeline.durationFrames - 1) log(`  frame ${frame + 1}/${timeline.durationFrames}`)
    }
    await encoder.finish()
    encoder = null

    // Reverse seeks must rebuild the same state from the baseline: compare with the linear pass.
    const reverse = [...picks].map((pick) => pick.frame).sort((a, b) => b - a)
    for (const frame of reverse) {
      const before = linear.get(frame)
      if (!before) throw new CaptureError('verify', `No linear sample was kept for frame ${frame}.`)
      const report = await seekInPage(session, frame)
      compareFrame(report, sidecar, timeline)
      const again = sha256(await screenshot(session, frame))
      if (report.digest !== before.digest || again !== before.png) {
        throw new CaptureError('seek-mismatch', `Frame ${frame} differs after a reverse seek (DOM ${before.digest} -> ${report.digest}, PNG ${before.png.slice(0, 12)} -> ${again.slice(0, 12)}). Frames must reconstruct from the baseline and prior events only.`)
      }
    }
    log(`  reverse seeks match the linear pass at frames ${reverse.join(', ')}`)

    const probe = await probeMp4(ffprobe, partial.mp4)
    checkProbe(probe, timeline, sidecar)

    const text = formatSidecar(sidecar)
    checkSidecar(JSON.parse(text) as Sidecar, timeline)
    await writeFile(partial.json, text)
    await rename(partial.json, json)
    await rename(partial.mp4, mp4)

    const clickEvent = timeline.events.find((event): event is CursorEvent => event.type === 'cursor' && event.click)
    const samples: SampleCheck[] = picks.map(({ label, frame }) => {
      const kept = linear.get(frame) as { png: string; digest: string; report: SeekReport }
      const name = clickEvent?.target ?? Object.keys(timeline.anchors)[0]
      const cursor = sidecar.cursor[frame] as Sidecar['cursor'][number]
      return {
        label,
        frame,
        cursor: { sidecar: { x: cursor.x, y: cursor.y, visible: cursor.visible }, dom: kept.report.cursor },
        anchor: name === undefined ? null : { name, sidecar: (sidecar.anchors[name] as Sidecar['anchors'][string])[frame] as Sidecar['anchors'][string][number], dom: kept.report.anchors[name] as SeekReport['anchors'][string] },
        pngSha256: kept.png,
        domDigest: kept.digest,
      }
    })
    const entries = [...new Set(timeline.events.flatMap((event) => (event.entry ? [event.entry] : [])))].sort()
    return {
      cut: spec.cut,
      clipId: spec.clipId,
      scene: timeline.scene as string,
      filmStartFrame: timeline.filmStartFrame as number,
      frameCount: sidecar.frameCount,
      durationSeconds: sidecar.durationSeconds,
      mp4,
      sidecar: json,
      entries,
      samples,
      reverseSeekFrames: reverse,
      probe,
    }
  } finally {
    encoder?.abort()
    await session?.browser.close().catch(() => undefined)
    await server.stop(true)
    await rm(dist, { recursive: true, force: true })
    await rm(partial.mp4, { force: true })
    await rm(partial.json, { force: true })
  }
}

export { CLIPS }
