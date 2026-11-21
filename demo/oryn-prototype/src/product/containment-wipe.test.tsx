import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import { ContainmentWipe } from './ContainmentWipe'
import { wipeEdge } from './incident'
import type { FilmContext } from './contract'

const state = reconstruct('ST12')
const film = (frame: number, reducedMotion = false): FilmContext => ({ frame, reducedMotion, lastApplied: (type) => type === 'CONTAIN_INCIDENT' ? 10 : null })
const render = (context?: FilmContext) => renderToStaticMarkup(<ContainmentWipe state={state} film={context} />)

describe('containment wipe', () => {
  test('moves its edge over exactly twelve frames', () => {
    expect([wipeEdge(0), wipeEdge(5), wipeEdge(11)]).toEqual([107, 640, 1280])
    for (const frame of [10, 15, 21]) expect(render(film(frame))).toContain('data-containment-wipe')
    expect(render(film(9))).not.toContain('data-containment-wipe')
    expect(render(film(22))).not.toContain('data-containment-wipe')
  })
  test('does not wipe in app or with reduced motion', () => {
    expect(render()).not.toContain('data-containment-wipe')
    expect(render(film(10, true))).not.toContain('data-containment-wipe')
  })
  test('places the real dark layer before the hidden light underlay', () => {
    const html = render(film(15))
    expect(html.indexOf('data-wipe-main')).toBeLessThan(html.indexOf('data-wipe-underlay'))
    expect(html).toContain('aria-hidden="true"')
  })
})
