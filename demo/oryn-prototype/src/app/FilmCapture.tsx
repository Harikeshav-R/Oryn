import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { FilmClockProvider, FilmOverlays, parseTimeline, resolveFrame } from '@/film'
import type { AnchorMeasure, FilmCaptureApi, LoadReport, SeekResult } from '@/film/capture-api'
import type { Rect, Timeline } from '@/film'
import { FILM_SURFACES } from './film-surfaces'

/**
 * Capture page (BOB-03d): `?view=film-capture&mode=film`. `scripts/capture.ts` loads one timeline
 * through `window.__filmCapture.load` and then seeks frames in any order. Every frame is
 * `resolveFrame(timeline, frame)` from the fixture baseline: no previous frame, timer or
 * animation is involved, so an out-of-order seek renders exactly what a linear pass renders.
 */

interface Loaded {
  readonly timeline: Timeline
  readonly frame: number
}

const toRect = (box: DOMRect): Rect => ({ x: box.x, y: box.y, width: box.width, height: box.height })

function fnv1a(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

/**
 * Serialisation of the canvas that does not depend on how the DOM got here. `outerHTML` lists
 * attributes, and a `style` attribute lists declarations, in the order React first set them, and
 * React's `useId` values (`:r3:`) count mounts, so a frame reached by a jump can differ from the
 * same frame reached linearly by order or by id counter alone. Sorting both and masking the id
 * counter keeps the digest a statement about what is drawn.
 */
const REACT_ID = /:r[0-9a-z]+:/g

function canonicalHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (!(node instanceof Element)) return ''
  const style = node instanceof HTMLElement || node instanceof SVGElement ? node.style : null
  const attributes = [...node.attributes]
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map((attribute) => {
      if (attribute.name !== 'style' || style === null) return ` ${attribute.name}="${attribute.value.replace(REACT_ID, ':id:')}"`
      // An empty `style=""` is what React leaves after it clears the last declaration: nothing is drawn differently.
      if (style.length === 0) return ''
      const declarations = [...style].sort().map((property) => `${property}:${style.getPropertyValue(property)}`)
      return ` style="${declarations.join(';')}"`
    })
  return `<${node.localName}${attributes.join('')}>${[...node.childNodes].map(canonicalHtml).join('')}</${node.localName}>`
}

async function decodeImage(image: HTMLImageElement): Promise<string | null> {
  try {
    await image.decode()
    return image.naturalWidth > 0 ? null : image.currentSrc || image.src
  } catch {
    return image.currentSrc || image.src
  }
}

async function decodedFailures(): Promise<string[]> {
  const results = await Promise.all([...document.images].map(decodeImage))
  return results.filter((src): src is string => src !== null)
}

function measureAnchors(timeline: Timeline): Record<string, AnchorMeasure> {
  const measured: Record<string, AnchorMeasure> = {}
  for (const name of Object.keys(timeline.anchors)) {
    const element = document.querySelector<HTMLElement>(`[data-film-anchor="${CSS.escape(name)}"]`)
    measured[name] = !element
      ? { found: false, rect: null }
      : { found: true, rect: getComputedStyle(element).display === 'none' ? null : toRect(element.getBoundingClientRect()) }
  }
  return measured
}

export function FilmCapture() {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const current = useRef<Timeline | null>(null)

  useEffect(() => {
    const api: FilmCaptureApi = {
      async load(raw): Promise<LoadReport> {
        let timeline: Timeline
        try {
          timeline = parseTimeline(raw)
        } catch (error) {
          return { ok: false, kind: 'timeline', message: error instanceof Error ? error.message : String(error) }
        }
        const key = `${timeline.cut}/${timeline.clipId}`
        if (!(key in FILM_SURFACES)) {
          return { ok: false, kind: 'surface', message: `No film surface is registered for ${key} in src/app/film-surfaces.ts; the screen this clip films is not built yet.` }
        }
        for (const path of timeline.assets ?? []) {
          const image = new Image()
          image.src = new URL(path, document.baseURI).href
          const failure = await decodeImage(image)
          if (failure !== null) return { ok: false, kind: 'asset', message: `Required asset ${path} did not decode (${failure}).` }
        }
        current.current = timeline
        flushSync(() => setLoaded({ timeline, frame: 0 }))
        return { ok: true, cut: timeline.cut, clipId: timeline.clipId, durationFrames: timeline.durationFrames }
      },

      async seek(frame): Promise<SeekResult> {
        const timeline = current.current
        if (!timeline) return { ok: false, message: 'seek before load.' }
        if (!Number.isInteger(frame) || frame < 0 || frame >= timeline.durationFrames) {
          return { ok: false, message: `Frame ${frame} is outside 0-${timeline.durationFrames - 1}.` }
        }
        flushSync(() => setLoaded({ timeline, frame }))
        await document.fonts.ready
        const imageFailures = await decodedFailures()
        const canvas = document.querySelector<HTMLElement>('[data-film-canvas]')
        if (!canvas) return { ok: false, message: 'The film canvas is not mounted.' }
        const cursor = document.querySelector('[data-film-cursor]')?.getBoundingClientRect()
        return {
          ok: true,
          frame,
          canvas: toRect(canvas.getBoundingClientRect()),
          anchors: measureAnchors(timeline),
          cursor: cursor ? { x: cursor.left, y: cursor.top } : null,
          digest: fnv1a(canonicalHtml(canvas)),
          imageFailures,
        }
      },
    }
    window.__filmCapture = api
    return () => {
      delete window.__filmCapture
    }
  }, [])

  const resolved = loaded ? resolveFrame(loaded.timeline, loaded.frame) : null
  const Surface = loaded ? FILM_SURFACES[`${loaded.timeline.cut}/${loaded.timeline.clipId}`] : undefined

  return (
    <main>
      <style>{'[data-film-canvas], [data-film-canvas] *, [data-film-canvas] *::before, [data-film-canvas] *::after { transition: none !important; animation: none !important; }'}</style>
      <FilmClockProvider frame={loaded?.frame ?? 0} reducedMotion={false}>
        <div data-film-canvas="" style={{ position: 'relative', width: 1280, height: 720, overflow: 'hidden', background: 'var(--background)', color: 'var(--foreground)' }}>
          {resolved && Surface && (
            <>
              <Surface resolved={resolved} />
              <FilmOverlays view={resolved.view} />
            </>
          )}
        </div>
      </FilmClockProvider>
    </main>
  )
}
