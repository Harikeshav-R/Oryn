import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import sampleJson from '../../film/sample/runtime-check.timeline.json'
import { FilmClockProvider, FilmOverlays, FilmTypedText, parseTimeline, resolveFrame, useFilmClock } from './index'

const sample = parseTimeline(sampleJson)
const overlays = (frame: number, reducedMotion = false) => renderToStaticMarkup(<FilmOverlays view={resolveFrame(sample, frame, { reducedMotion }).view} />)

describe('film overlay layer', () => {
  test('draws nothing before the pointer exists', () => {
    const html = overlays(5)
    expect(html).not.toContain('data-film-cursor')
    expect(html).not.toContain('data-film-ring')
  })

  test('the arrow is 20x24, black with a white outline, tip at the pointer position', () => {
    const html = overlays(31)
    expect(html).toContain('data-film-cursor="press"')
    expect(html).toContain('width="20"')
    expect(html).toContain('height="24"')
    expect(html).toContain('fill="#000"')
    expect(html).toContain('stroke="#fff"')
    expect(html).toContain('left:150px;top:132px')
  })

  test('the click ring is foreground ink at an alpha, never the execution cyan', () => {
    const html = overlays(31)
    expect(html).toContain('data-film-ring')
    expect(html).toMatch(/border:1\.5px solid color-mix\(in srgb, var\(--foreground\) [\d.]+%, transparent\)/)
    expect(html.toLowerCase()).not.toContain('--arc')
    expect(html.toLowerCase()).not.toContain('2fd8ff')
  })

  test('outlines are neutral signal ink, 2 px, and never take a click', () => {
    const html = overlays(120)
    expect(html).toContain('data-film-outline="focus"')
    expect(html).toContain('border:2px solid var(--signal)')
    expect(html).toContain('pointer-events:none')
    expect(html).toContain('aria-hidden="true"')
    expect(html.toLowerCase()).not.toContain('--arc')
  })

  test('reduced motion draws the pointer at its destination with no ring', () => {
    const html = overlays(125, true)
    expect(html).toContain('left:200px;top:276px')
    expect(html).not.toContain('data-film-ring')
  })
})

describe('typed text', () => {
  test('renders the exact string with a solid ink caret while typing', () => {
    const typed = resolveFrame(sample, 479).view.texts['url-pill']
    expect(typed).toBeDefined()
    const html = renderToStaticMarkup(<FilmTypedText typed={typed as NonNullable<typeof typed>} />)
    expect(html).toContain('https://github.com/Harikeshav-R/Oryn')
    expect(html).toContain('data-complete="true"')
  })

  test('shows the selected old deadline without a caret', () => {
    const typed = resolveFrame(sample, 116).view.texts['deadline-field']
    const html = renderToStaticMarkup(<FilmTypedText typed={typed as NonNullable<typeof typed>} />)
    expect(html).toContain('Fri 17:00')
    expect(html).not.toContain('data-film-caret')
  })
})

describe('film clock', () => {
  function Probe() {
    const clock = useFilmClock()
    return <b>{`${clock.frame}|${clock.seconds}|${clock.reducedMotion}`}</b>
  }

  test('reads the frame, seconds and reduced-motion flag from the provider', () => {
    expect(renderToStaticMarkup(<FilmClockProvider frame={45} reducedMotion><Probe /></FilmClockProvider>)).toContain('45|1.5|true')
  })

  test('is a stopped neutral clock outside a film', () => {
    expect(renderToStaticMarkup(<Probe />)).toContain('0|0|false')
  })
})
