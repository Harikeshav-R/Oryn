import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildSidecar, parseTimeline } from '@/film'
import type { Sidecar } from '@/film'
import type { SeekReport } from '@/film/capture-api'
import { helpText, parseArgs } from './capture'
import { DEFAULT_FILM_DIR, DEFAULT_PUBLIC_DIR, capture, checkProbe, checkSidecar, checkStaticInputs, compareFrame, formatSidecar, loadTimeline, probeMp4, sampleFrames } from './capture-core'
import type { CaptureResult } from './capture-core'
import { CLIPS, startFrameOf } from './clips'
import { checkContract } from './contract'
import { CaptureError } from './errors'
import { FILM_SURFACES } from '../src/app/film-surfaces'

const SAMPLE = path.join(DEFAULT_FILM_DIR, 'sample', 'runtime-check.timeline.json')
const sampleRaw = async (): Promise<Record<string, unknown>> => JSON.parse(await readFile(SAMPLE, 'utf8')) as Record<string, unknown>

let work: string
beforeAll(async () => {
  work = await mkdtemp(path.join(tmpdir(), 'oryn-capture-test-'))
})
afterAll(async () => {
  await rm(work, { recursive: true, force: true })
})

/** A film dir holding the sample clip with `mutate` applied, and a fresh output dir beside it. */
async function sandbox(name: string, mutate: (timeline: Record<string, unknown>) => void = () => undefined): Promise<{ filmDir: string; outDir: string; publicDir: string }> {
  const root = path.join(work, name)
  const raw = await sampleRaw()
  mutate(raw)
  await mkdir(path.join(root, 'film', 'sample'), { recursive: true })
  await writeFile(path.join(root, 'film', 'sample', 'runtime-check.timeline.json'), JSON.stringify(raw))
  return { filmDir: path.join(root, 'film'), outDir: path.join(root, 'out'), publicDir: DEFAULT_PUBLIC_DIR }
}

/** The first 60 frames of the sample: every event lands inside the clip, so it validates unchanged. */
const shorten = (timeline: Record<string, unknown>): void => {
  timeline.durationFrames = 60
  timeline.events = (timeline.events as { frame: number }[]).filter((event) => event.frame <= 59)
}

async function publicCopy(name: string): Promise<string> {
  const dir = path.join(work, name, 'public')
  await cp(path.join(DEFAULT_PUBLIC_DIR, 'fonts'), path.join(dir, 'fonts'), { recursive: true })
  return dir
}

const rejection = async (run: () => Promise<unknown>): Promise<CaptureError> => {
  try {
    await run()
  } catch (error) {
    if (error instanceof CaptureError) return error
    throw error
  }
  throw new Error('expected a CaptureError')
}

describe('clip table (ROADMAP.md section 0.3)', () => {
  test('hackathon and launch clips tile their film intervals without gaps or overlap', () => {
    for (const cut of ['hackathon', 'launch'] as const) {
      const clips = CLIPS.filter((clip) => clip.cut === cut)
      for (let i = 1; i < clips.length; i += 1) {
        const previous = clips[i - 1]!
        const clip = clips[i]!
        if (cut === 'hackathon' && previous.clipId === 'hk-h2-problem') continue // H3 footage sits between H2 and H4a
        if (cut === 'launch' && clip.clipId === 'lk-l4-privacy') continue // L3 footage
        if (cut === 'launch' && previous.clipId === 'lk-l2-chaos') continue
        expect(startFrameOf(previous) + (previous.frames ?? 0)).toBe(startFrameOf(clip))
      }
    }
  })

  test('the launch run ends at 02:03.50 and heal starts there: 525 and 615 frames', () => {
    const run = CLIPS.find((clip) => clip.clipId === 'lk-l9-run')!
    const heal = CLIPS.find((clip) => clip.clipId === 'lk-l10-heal')!
    expect([run.frames, heal.frames]).toEqual([525, 615])
    expect(startFrameOf(heal)).toBe(Math.round(123.5 * 30))
    expect(startFrameOf(run) + 525).toBe(startFrameOf(heal))
  })
})

describe('command line', () => {
  test('--help documents the flags, the input and the output destination', () => {
    const text = helpText()
    for (const needle of ['--cut <hackathon|launch>', '--clip <clip-id>', '--help', 'film/<cut>/<clip-id>.timeline.json', 'demo/video/clips/<cut>/<clip-id>.mp4', 'demo/video/clips/<cut>/<clip-id>.json', '2560x1440', 'lk-l10-heal']) {
      expect(text).toContain(needle)
    }
    expect(parseArgs(['--help']).help).toBe(true)
    expect(parseArgs(['--cut=launch', '--clip', 'lk-l9-run'])).toEqual({ help: false, cut: 'launch', clip: 'lk-l9-run' })
  })

  test('a missing value or unknown flag is a usage error', () => {
    expect(() => parseArgs(['--cut'])).toThrow('--cut needs a value')
    expect(() => parseArgs(['--clip', '--cut', 'launch'])).toThrow('--clip needs a value')
    expect(() => parseArgs(['--bogus'])).toThrow('Unknown argument "--bogus"')
  })
})

describe('timeline loading', () => {
  test('unknown cut and unknown clip are rejected with the valid choices', async () => {
    expect((await rejection(() => loadTimeline({ cut: 'teaser', clip: 'x' }))).code).toBe('unknown-cut')
    const error = await rejection(() => loadTimeline({ cut: 'launch', clip: 'lk-l99-nope' }))
    expect(error.code).toBe('unknown-clip')
    expect(error.message).toContain('lk-l10-heal')
  })

  test('a known clip with no timeline file names the path to author', async () => {
    const error = await rejection(() => loadTimeline({ cut: 'hackathon', clip: 'hk-h4a-enroll', filmDir: path.join(work, 'empty-film') }))
    expect(error.code).toBe('timeline-missing')
    expect(error.message).toContain('hk-h4a-enroll.timeline.json')
  })

  test('malformed JSON and a malformed shape each name the file and the field', async () => {
    const broken = await sandbox('malformed-json')
    await writeFile(path.join(broken.filmDir, 'sample', 'runtime-check.timeline.json'), '{ "fps": 30,')
    const json = await rejection(() => loadTimeline({ cut: 'sample', clip: 'runtime-check', filmDir: broken.filmDir }))
    expect(json.code).toBe('timeline-malformed')
    expect(json.message).toContain('runtime-check.timeline.json')

    const shape = await sandbox('malformed-shape', (timeline) => {
      ;(timeline.events as Record<string, unknown>[])[1]!.duration = 'long'
    })
    const error = await rejection(() => loadTimeline({ cut: 'sample', clip: 'runtime-check', filmDir: shape.filmDir }))
    expect(error.code).toBe('timeline-malformed')
    expect(error.message).toContain('events[1].duration')
  })

  test('non-integral frames are rejected', async () => {
    const fractional = await sandbox('fractional', (timeline) => {
      ;(timeline.events as Record<string, unknown>[])[2]!.frame = 30.5
    })
    const error = await rejection(() => loadTimeline({ cut: 'sample', clip: 'runtime-check', filmDir: fractional.filmDir }))
    expect(error.code).toBe('timeline-invalid')
    expect(error.message).toContain('frame is outside')
  })

  test('the shipped sample timeline loads', async () => {
    const loaded = await loadTimeline({ cut: 'sample', clip: 'runtime-check' })
    expect(loaded.timeline.durationFrames).toBe(480)
  })
})

describe('capture contract', () => {
  test('wrong length, offset, scene and entry are each named', async () => {
    const timeline = parseTimeline(await sampleRaw())
    const spec = { cut: 'launch', clipId: 'lk-l9-run', startSeconds: 106, frames: 525, entry: /^L-\d{3}$/ } as const
    const problems = checkContract({ ...timeline, cut: 'launch', clipId: 'lk-l9-run', filmStartFrame: 3000, scene: '' }, spec)
    expect(problems.some((problem) => problem.includes('exactly 525 frames'))).toBe(true)
    expect(problems.some((problem) => problem.includes('film frame 3180'))).toBe(true)
    expect(problems.some((problem) => problem.includes('scene is required'))).toBe(true)
    expect(problems.some((problem) => problem.includes('entry "FRT-01" does not match'))).toBe(true)
  })

  test('assets must be plain relative paths', async () => {
    const timeline = parseTimeline(await sampleRaw())
    const spec = CLIPS.find((clip) => clip.clipId === 'runtime-check')!
    const problems = checkContract({ ...timeline, assets: ['../secret.png', 'https://example.com/a.png', 'marks/ok.png'] }, spec)
    expect(problems).toHaveLength(2)
  })
})

describe('inputs checked before any browser starts', () => {
  test('a missing font file is named and no output appears', async () => {
    const box = await sandbox('missing-font')
    const publicDir = await publicCopy('missing-font')
    await rm(path.join(publicDir, 'fonts', 'IBMPlexMono-Medium.woff2'))
    const error = await rejection(() => capture({ cut: 'sample', clip: 'runtime-check', ...box, publicDir, log: () => undefined }))
    expect(error.code).toBe('font-missing')
    expect(error.message).toContain('IBMPlexMono-Medium.woff2')
    expect(error.message).toContain('IBM Plex Mono 500')
    await expect(readdir(box.outDir)).rejects.toThrow()
  })

  test('a missing declared asset is named', async () => {
    const box = await sandbox('missing-asset', (timeline) => {
      timeline.assets = ['marks/github.svg']
    })
    const timeline = (await loadTimeline({ cut: 'sample', clip: 'runtime-check', filmDir: box.filmDir })).timeline
    const error = await rejection(async () => checkStaticInputs(timeline, await publicCopy('missing-asset')))
    expect(error.code).toBe('asset-missing')
    expect(error.message).toContain('marks/github.svg')
  })
})

describe('verification helpers', () => {
  test('the sidecar has one cursor sample and one rectangle-or-null per anchor per frame and round-trips', async () => {
    const timeline = parseTimeline(await sampleRaw())
    const sidecar = buildSidecar(timeline)
    checkSidecar(sidecar, timeline)
    expect(sidecar.cursor).toHaveLength(480)
    for (const samples of Object.values(sidecar.anchors)) expect(samples).toHaveLength(480)
    expect(JSON.parse(formatSidecar(sidecar))).toEqual(JSON.parse(JSON.stringify(sidecar)))
    expect(() => checkSidecar({ ...sidecar, frameCount: 479 }, timeline)).toThrow('differs from the timeline durationFrames')
    expect(() => checkSidecar({ ...sidecar, durationSeconds: 16.5 }, timeline)).toThrow('durationSeconds')
  })

  test('an encoded clip off by one frame, with audio, or at the wrong rate is rejected against timeline and sidecar', async () => {
    const timeline = parseTimeline(await sampleRaw())
    const sidecar = buildSidecar(timeline)
    const good = { width: 2560, height: 1440, rFrameRate: '30/1', frames: 480, duration: 16, audioStreams: 0, codec: 'h264', pixFmt: 'yuv420p' }
    checkProbe(good, timeline, sidecar)
    expect(() => checkProbe({ ...good, frames: 479 }, timeline, sidecar)).toThrow('479 frames, but the timeline durationFrames is 480')
    expect(() => checkProbe({ ...good, audioStreams: 1 }, timeline, sidecar)).toThrow('audio stream')
    expect(() => checkProbe({ ...good, rFrameRate: '60/1' }, timeline, sidecar)).toThrow('r_frame_rate')
    // 16.4 s rounds to 16 s in a player, but is 12 frames long: the frame-level check still rejects it.
    expect(() => checkProbe({ ...good, duration: 16.4 }, timeline, sidecar)).toThrow('duration')
  })

  test('frame comparison names the anchor or pointer that disagrees with the sidecar', async () => {
    const timeline = parseTimeline(await sampleRaw())
    const sidecar = buildSidecar(timeline)
    const frame = 30
    const anchors = Object.fromEntries(Object.entries(sidecar.anchors).map(([name, samples]) => [name, { found: true, rect: samples[frame]!.rect }]))
    const cursor = sidecar.cursor[frame]!
    const report: SeekReport = { ok: true, frame, canvas: { x: 0, y: 0, width: 1280, height: 720 }, anchors, cursor: { x: cursor.x!, y: cursor.y! }, digest: '0', imageFailures: [] }
    compareFrame(report, sidecar, timeline)
    const moved = { ...anchors, 'deadline-field': { found: true, rect: { ...anchors['deadline-field']!.rect!, x: anchors['deadline-field']!.rect!.x + 1.5 } } }
    expect(() => compareFrame({ ...report, anchors: moved }, sidecar, timeline)).toThrow('Anchor "deadline-field" at frame 30')
    expect(() => compareFrame({ ...report, cursor: { x: cursor.x! + 2, y: cursor.y! } }, sidecar, timeline)).toThrow('pointer tip')
    expect(() => compareFrame({ ...report, cursor: null }, sidecar, timeline)).toThrow('does not draw it')
  })

  test('sample frames are start, first click landing, middle and final', async () => {
    const timeline = parseTimeline(await sampleRaw())
    expect(sampleFrames(timeline)).toEqual([
      { label: 'start', frame: 0 },
      { label: 'click', frame: 30 },
      { label: 'middle', frame: 239 },
      { label: 'final', frame: 479 },
    ])
  })
})

describe('browser capture of the fixture-backed sample (needs Chrome, ffmpeg)', () => {
  let result: CaptureResult
  let outDir: string

  test(
    'a 60-frame sample is exactly 60 frames, silent, 2560x1440, 30 fps, and reverse seeks match',
    async () => {
      const box = await sandbox('happy', shorten)
      outDir = box.outDir
      result = await capture({ cut: 'sample', clip: 'runtime-check', ...box, log: () => undefined })
      const probe = await probeMp4('ffprobe', result.mp4)
      expect(probe).toMatchObject({ width: 2560, height: 1440, rFrameRate: '30/1', frames: 60, audioStreams: 0 })
      const sidecar = JSON.parse(await readFile(result.sidecar, 'utf8')) as Sidecar
      expect(sidecar.frameCount).toBe(60)
      expect(sidecar.durationSeconds).toBe(2)
      expect(sidecar.cursor.at(-1)?.frame).toBe(59)
      expect(result.reverseSeekFrames).toEqual([59, 30, 29, 0])
      expect((await readdir(path.join(outDir, 'sample'))).sort()).toEqual(['runtime-check.json', 'runtime-check.mp4'])
    },
    180_000,
  )

  test(
    'a failed recapture leaves the accepted files untouched and no partial file behind',
    async () => {
      const before = await readFile(result.mp4)
      const box = await sandbox('ghost-anchor', (timeline) => {
        shorten(timeline)
        ;(timeline.anchors as Record<string, unknown>).ghost = { rect: { x: 600, y: 100, width: 80, height: 24 } }
      })
      const error = await rejection(() => capture({ cut: 'sample', clip: 'runtime-check', ...box, outDir, log: () => undefined }))
      expect(error.code).toBe('anchor-missing')
      expect(error.message).toContain('"ghost"')
      expect(error.message).toContain('data-film-anchor="ghost"')
      expect(Buffer.compare(before, await readFile(result.mp4))).toBe(0)
      expect((await readdir(path.join(outDir, 'sample'))).sort()).toEqual(['runtime-check.json', 'runtime-check.mp4'])
    },
    180_000,
  )

  test(
    'theme "dark" reaches the page: the encoded frame is dark, and the default is light',
    async () => {
      const luma = async (file: string): Promise<number> => {
        const proc = Bun.spawn(['ffmpeg', '-v', 'error', '-i', file, '-vf', 'select=eq(n\\,0),signalstats,metadata=print:file=-', '-an', '-f', 'null', '-'], { stdout: 'pipe', stderr: 'pipe' })
        const out = await new Response(proc.stdout).text()
        await proc.exited
        return Number(/lavfi\.signalstats\.YAVG=([\d.]+)/.exec(out)?.[1])
      }
      const dark = await sandbox('dark', (timeline) => {
        shorten(timeline)
        timeline.theme = 'dark'
      })
      const light = await sandbox('light', shorten)
      const darkResult = await capture({ cut: 'sample', clip: 'runtime-check', ...dark, log: () => undefined })
      const lightResult = await capture({ cut: 'sample', clip: 'runtime-check', ...light, log: () => undefined })
      expect(await luma(darkResult.mp4)).toBeLessThan(80)
      expect(await luma(lightResult.mp4)).toBeGreaterThan(180)
    },
    240_000,
  )

  test('an unknown theme is a malformed timeline', async () => {
    const bad = await sandbox('bad-theme', (timeline) => {
      timeline.theme = 'sepia'
    })
    const error = await rejection(() => loadTimeline({ cut: 'sample', clip: 'runtime-check', filmDir: bad.filmDir }))
    expect(error.code).toBe('timeline-malformed')
    expect(error.message).toContain('theme')
  })

  test(
    'an undecodable font is reported by name and blocks the capture',
    async () => {
      const box = await sandbox('corrupt-font', shorten)
      const publicDir = await publicCopy('corrupt-font')
      await writeFile(path.join(publicDir, 'fonts', 'SpaceGrotesk-Bold.woff2'), 'not a font')
      const error = await rejection(() => capture({ cut: 'sample', clip: 'runtime-check', ...box, publicDir, log: () => undefined }))
      expect(error.code).toBe('font-unavailable')
      expect(error.message).toContain('Space Grotesk 700 /fonts/SpaceGrotesk-Bold.woff2')
      await expect(readdir(box.outDir)).resolves.not.toContain('runtime-check.mp4')
    },
    180_000,
  )

  test(
    'a declared asset that does not decode is reported by path',
    async () => {
      const box = await sandbox('bad-asset', (timeline) => {
        shorten(timeline)
        timeline.assets = ['marks/broken.png']
      })
      const publicDir = await publicCopy('bad-asset')
      await mkdir(path.join(publicDir, 'marks'), { recursive: true })
      await writeFile(path.join(publicDir, 'marks', 'broken.png'), 'not a png')
      const error = await rejection(() => capture({ cut: 'sample', clip: 'runtime-check', ...box, publicDir, log: () => undefined }))
      expect(error.code).toBe('asset-undecodable')
      expect(error.message).toContain('marks/broken.png')
    },
    180_000,
  )

  // Every registered product clip is built now (BOB-11 was the last): the `surface-missing` path has no registered clip left to film, so the contract is that none is unbuilt.
  test('every registered clip has a film surface, so none is filmed from a stand-in', () => {
    const missing = CLIPS.filter((clip) => !(`${clip.cut}/${clip.clipId}` in FILM_SURFACES)).map((clip) => `${clip.cut}/${clip.clipId}`)
    expect(missing).toEqual([])
  })
})
