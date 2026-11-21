import { describe, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { FONT_FACES } from './faces'

/**
 * GAP-CMP-H-font and GAP-CMP-L-01: IBM Plex Mono 700 is a real bundled face (never a synthesized
 * weight) next to 400/500/600, declared identically in fonts.css and faces.ts, and the files are the
 * upstream ones recorded in public/fonts/PROVENANCE.md.
 */
const ROOT = path.resolve(import.meta.dir, '../..')
const read = (...parts: string[]): string => readFileSync(path.join(ROOT, ...parts), 'utf8')

describe('bundled faces', () => {
  const css = read('src', 'styles', 'fonts.css')
  const declared = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((match) => {
    const body = match[1] ?? ''
    const family = /font-family:\s*'([^']+)'/.exec(body)?.[1]
    const weight = Number(/font-weight:\s*(\d+)/.exec(body)?.[1])
    const source = /url\('([^']+)'\)/.exec(body)?.[1]
    return { family, weight, path: source }
  })

  test('IBM Plex Mono ships 400, 500, 600 and a real 700 face', () => {
    const plex = FONT_FACES.filter((face) => face.family === 'IBM Plex Mono').map((face) => face.weight)
    expect(plex).toEqual([400, 500, 600, 700])
  })

  test('fonts.css and the loader manifest declare the same faces', () => {
    expect(declared).toEqual(FONT_FACES.map((face) => ({ family: face.family, weight: face.weight, path: face.path })))
  })

  test('no weight is synthesized and no declared face reads a remote or local() source', () => {
    expect(read('src', 'styles', 'product.css')).toContain('font-synthesis: none')
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/local\(|https?:/)
  })

  test('every file is the unmodified upstream face recorded in PROVENANCE.md', () => {
    const provenance = read('public', 'fonts', 'PROVENANCE.md')
    const recorded = new Map([...provenance.matchAll(/^([0-9a-f]{64})\s{2}(\S+\.woff2)$/gm)].map((match) => [match[2] ?? '', match[1] ?? '']))
    expect(recorded.size).toBe(FONT_FACES.length)
    const digests = new Set<string>()
    for (const face of FONT_FACES) {
      const file = path.basename(face.path)
      const digest = createHash('sha256').update(readFileSync(path.join(ROOT, 'public', 'fonts', file))).digest('hex')
      expect(`${file} ${digest}`).toBe(`${file} ${recorded.get(file)}`)
      digests.add(digest)
    }
    // A bold face that is a copy of another weight would share its digest.
    expect(digests.size).toBe(FONT_FACES.length)
  })
})
