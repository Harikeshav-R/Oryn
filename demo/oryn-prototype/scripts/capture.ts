import { CLIPS, PRODUCT_CUTS, startFrameOf } from './clips'
import { capture, DEFAULT_FILM_DIR, DEFAULT_OUT_DIR, ENCODED_HEIGHT, ENCODED_WIDTH, REPO_ROOT } from './capture-core'
import { CaptureError } from './errors'
import path from 'node:path'

/**
 * `bun run scripts/capture.ts --cut <hackathon|launch> --clip <clip-id>`
 * Exit codes: 0 captured and verified, 1 capture failed (nothing accepted), 2 usage error.
 */

const rel = (file: string): string => path.relative(REPO_ROOT, file)

export function helpText(): string {
  const table = CLIPS.filter((clip) => clip.cut !== 'sample')
    .map((clip) => `  ${clip.cut.padEnd(9)} ${clip.clipId.padEnd(16)} ${String(clip.frames).padStart(3)} frames  film frame ${String(startFrameOf(clip)).padStart(4)}`)
    .join('\n')
  return `Capture one product clip as a silent ${ENCODED_WIDTH}x${ENCODED_HEIGHT} 30 fps MP4 plus its cursor/anchor sidecar.

Usage:
  bun run scripts/capture.ts --cut <hackathon|launch> --clip <clip-id>
  bun run scripts/capture.ts --help

Options:
  --cut <cut>      hackathon or launch.
  --clip <clip-id> A clip of that cut (listed below).
  --help, -h       Show this help.

Input:
  ${rel(DEFAULT_FILM_DIR)}/<cut>/<clip-id>.timeline.json

Output (replaced only after every check passes):
  ${rel(DEFAULT_OUT_DIR)}/<cut>/<clip-id>.mp4    silent ${ENCODED_WIDTH}x${ENCODED_HEIGHT}, 30 fps, exactly durationFrames frames
  ${rel(DEFAULT_OUT_DIR)}/<cut>/<clip-id>.json   sidecar in 1280x720 authored CSS pixels

Capture is 1280x720 CSS at device pixel ratio 2, headless Chrome on loopback, no network.
Environment: ORYN_CHROME, ORYN_FFMPEG, ORYN_FFPROBE override tool lookup.
Fixture cut: --cut sample --clip runtime-check captures the fixture-backed runtime check;
--cut sample --clip shell-tour captures the SC12-FRAME/APP-11 tour (role change, search, browser tabs).

Clips:
${table}
`
}

interface Args {
  readonly help: boolean
  readonly cut: string | null
  readonly clip: string | null
}

export function parseArgs(argv: readonly string[]): Args {
  let help = false
  let cut: string | null = null
  let clip: string | null = null
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] as string
    const [flag, inline] = arg.startsWith('--') && arg.includes('=') ? [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)] : [arg, undefined]
    const value = (): string => {
      const next = inline ?? argv[++i]
      if (next === undefined || next.startsWith('--')) throw new CaptureError('usage', `${flag} needs a value.`)
      return next
    }
    if (flag === '--help' || flag === '-h') help = true
    else if (flag === '--cut') cut = value()
    else if (flag === '--clip') clip = value()
    else throw new CaptureError('usage', `Unknown argument "${arg}".`)
  }
  return { help, cut, clip }
}

async function main(): Promise<number> {
  let args: Args
  try {
    args = parseArgs(process.argv.slice(2))
    if (args.help) {
      process.stdout.write(helpText())
      return 0
    }
    if (args.cut === null || args.clip === null) {
      throw new CaptureError('usage', `--cut <${PRODUCT_CUTS.join('|')}> and --clip <clip-id> are both required.`)
    }
  } catch (error) {
    if (!(error instanceof CaptureError)) throw error
    process.stderr.write(`error: ${error.message}\n\n${helpText()}`)
    return 2
  }
  try {
    const result = await capture({ cut: args.cut, clip: args.clip })
    const sample = (label: string): string => {
      const found = result.samples.find((entry) => entry.label === label)
      if (!found) return ''
      const cursor = found.cursor.sidecar.visible ? `${found.cursor.sidecar.x},${found.cursor.sidecar.y}` : 'hidden'
      return `${label} f${found.frame}: cursor ${cursor}`
    }
    process.stdout.write(
      [
        `captured ${result.cut}/${result.clipId} (scene ${result.scene})`,
        `  ${rel(result.mp4)}`,
        `  ${rel(result.sidecar)}`,
        `  ${result.frameCount} frames, ${result.durationSeconds} s, ${result.probe.width}x${result.probe.height}, r_frame_rate ${result.probe.rFrameRate}, ${result.probe.audioStreams} audio streams`,
        `  film frame ${result.filmStartFrame} + local 0..${result.frameCount - 1}; entries ${result.entries.join(', ')}`,
        `  ${['start', 'click', 'final'].map(sample).filter(Boolean).join('; ')}`,
        '',
      ].join('\n'),
    )
    return 0
  } catch (error) {
    if (error instanceof CaptureError) process.stderr.write(`capture failed [${error.code}]: ${error.message}\nNo output was accepted; existing clip files are untouched.\n`)
    else process.stderr.write(`capture failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\nNo output was accepted; existing clip files are untouched.\n`)
    return 1
  }
}

if (import.meta.main) process.exit(await main())
