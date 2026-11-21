import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MEETING_QUOTES } from '@/data/commitment'
import { PEOPLE } from '@/data/people'
import { createInitialState, reconstruct, transition } from '@/state'
import type { Action, ActionType, State } from '@/state'
import { act as run } from '@/state/test-helpers'
import type { FilmContext, ProductProps } from '../contract'
import { ZoomView } from './ZoomView'
import { ZOOM_ANCHORS, ZOOM_ANCHOR_RECTS } from './zoom-layout'

type Props = Record<string, unknown>

const html = (state: State, film?: FilmContext): string => renderToStaticMarkup(<ZoomView state={state} film={film} />)
/** Visible text and attribute text with React's comment separators and entities undone. */
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&')

const openingTag = (markup: string, name: string): string => {
  const tag = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return tag
}
const hidden = (markup: string, name: string): boolean => openingTag(markup, name).includes('display:none')
const recordingShown = (markup: string): boolean => markup.includes('>Recording<')

const filmAt = (frame: number, applied: Partial<Record<ActionType, number>> = {}, reducedMotion = false): FilmContext => ({
  frame,
  reducedMotion,
  lastApplied: (type) => applied[type] ?? null,
})

/** Every element carrying a film anchor, in document order. Function components are expanded; Button is kept whole. */
function anchoredElements(node: ReactNode, out: ReactElement<Props>[] = []): ReactElement<Props>[] {
  if (Array.isArray(node)) {
    node.forEach((child) => anchoredElements(child as ReactNode, out))
    return out
  }
  if (!isValidElement<Props>(node)) return out
  if (node.props['data-film-anchor'] !== undefined) out.push(node)
  if (typeof node.type === 'function') return anchoredElements((node.type as (props: Props) => ReactNode)(node.props), out)
  return anchoredElements(node.props.children as ReactNode, out)
}

/** Click the element for an anchor and return every action it dispatched. */
function click(state: State, name: string): Action[] {
  const dispatched: Action[] = []
  const props: ProductProps = { state, dispatch: (action) => dispatched.push(action) }
  const element = anchoredElements(<ZoomView {...props} />).find((candidate) => candidate.props['data-film-anchor'] === name)
  if (!element) throw new Error(`No element for anchor ${name}`)
  ;(element.props.onClick as (() => void) | undefined)?.()
  return dispatched
}

const enrolled = reconstruct('ST02')
const granted = run(enrolled, { type: 'GRANT_MEETING_CONSENT', meetingId: 'zoom-kestrel' })
const declined = run(enrolled, { type: 'DENY_MEETING_CONSENT', meetingId: 'zoom-kestrel' })
const danaSpoke = run(granted, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' })
const priyaReplied = run(danaSpoke, { type: 'SHOW_MEETING_QUOTE', speaker: 'priya' })
const ended = run(priyaReplied, { type: 'END_MEETING' })
const endedUnconsented = run(enrolled, { type: 'END_MEETING' })
const paused = run(granted, { type: 'PAUSE_OBSERVATION' })
const asManager = run(enrolled, { type: 'SELECT_ACTOR', personId: 'marcus' })
const grantedAsManager = run(granted, { type: 'SELECT_ACTOR', personId: 'marcus' })
const asColleague = run(enrolled, { type: 'SELECT_ACTOR', personId: 'jamal' })

const DANA_QUOTE = MEETING_QUOTES[0].quote
const PRIYA_QUOTE = MEETING_QUOTES[1].quote

describe('APP-08 per-meeting consent', () => {
  test('before consent: the notice, both choices and no recording indicator', () => {
    const markup = plain(html(enrolled))
    expect(markup).toContain('Meeting notice and consent')
    expect(markup).toContain('Meeting capture: consent required')
    expect(markup).toContain('Start for this meeting')
    expect(markup).toContain('Not for this meeting')
    expect(recordingShown(markup)).toBe(false)
    expect(hidden(markup, 'recording-indicator')).toBe(true)
    expect(hidden(markup, 'consent-action')).toBe(false)
    expect(hidden(markup, 'consent-decline')).toBe(false)
    expect(markup).not.toContain('data-wave')
  })

  test('the explicit action alone starts the meeting capture: it dispatches the grant for this meeting', () => {
    expect(click(enrolled, 'consent-action')).toEqual([{ type: 'GRANT_MEETING_CONSENT', meetingId: 'zoom-kestrel' }])
    expect(click(enrolled, 'consent-decline')).toEqual([{ type: 'DENY_MEETING_CONSENT', meetingId: 'zoom-kestrel' }])
  })

  test('general enrollment and a screen resume start nothing: no indicator without the per-meeting grant', () => {
    expect(recordingShown(html(createInitialState()))).toBe(false)
    expect(recordingShown(html(enrolled))).toBe(false)
    expect(recordingShown(html(run(enrolled, { type: 'OPEN_SCREEN', screen: 'SC09' })))).toBe(false)
    expect(recordingShown(html(run(enrolled, { type: 'PAUSE_OBSERVATION' }, { type: 'RESUME_OBSERVATION' })))).toBe(false)
  })

  test('after the grant the banner resolves to the Recording line and the choices leave', () => {
    const markup = plain(html(granted))
    expect(recordingShown(markup)).toBe(true)
    expect(markup).toContain('Capture is on for this meeting only')
    expect(markup).not.toContain('Meeting capture: consent required')
    expect(hidden(markup, 'recording-indicator')).toBe(false)
    expect(hidden(markup, 'consent-action')).toBe(true)
    expect(hidden(markup, 'consent-decline')).toBe(true)
    expect(markup).toContain('data-wave')
  })

  test('the banner cross-fades over 150 ms in a film: the notice is still fading, then gone', () => {
    const early = plain(html(granted, filmAt(11, { GRANT_MEETING_CONSENT: 10 })))
    expect(early).toContain('Meeting capture: consent required')
    expect(early).toMatch(/opacity:0\.\d+/)
    expect(recordingShown(early)).toBe(true)
    const settled = plain(html(granted, filmAt(20, { GRANT_MEETING_CONSENT: 10 })))
    expect(settled).not.toContain('Meeting capture: consent required')
    expect(settled).toContain('Capture is on for this meeting only')
  })

  test('declined: the decline copy, no indicator, no quotation, and the reducer refuses a quotation', () => {
    const markup = plain(html(declined))
    expect(markup).toContain('Meeting capture declined for this meeting')
    expect(recordingShown(markup)).toBe(false)
    expect(hidden(markup, 'meeting-quote')).toBe(true)
    expect(hidden(markup, 'consent-action')).toBe(true)
    expect(transition(declined, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' }).ok).toBe(false)
  })

  test('paused observation: consent given but no indicator, and the banner says capture is not active', () => {
    const markup = plain(html(paused))
    expect(recordingShown(markup)).toBe(false)
    expect(markup).toContain('capture is not active')
    expect(markup).not.toContain('data-wave')
  })

  test('another viewpoint cannot choose and never sees the indicator or a quotation', () => {
    const markup = plain(html(asManager))
    expect(markup).toContain('Only an Employee manages their own observation consent.')
    expect(openingTag(markup, 'consent-action')).toContain('aria-disabled="true"')
    expect(openingTag(markup, 'consent-decline')).toContain('aria-disabled="true"')
    expect(plain(html(asColleague))).toContain('Priya Nair, the meeting participant')
    const watching = plain(html(grantedAsManager))
    expect(recordingShown(watching)).toBe(false)
    expect(watching).not.toContain('data-wave')
    const quoted = html(run(granted, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' }, { type: 'SELECT_ACTOR', personId: 'marcus' }))
    expect(plain(quoted)).not.toContain(DANA_QUOTE)
    expect(hidden(quoted, 'meeting-quote')).toBe(true)
  })
})

describe('APP-08 participants and quotations', () => {
  test('only Priya Nair and Dana Whitfield appear, side by side, and no third person', () => {
    for (const state of [enrolled, granted, priyaReplied, ended]) {
      const markup = plain(html(state))
      expect(markup).toContain('Dana Whitfield')
      expect(markup).toContain('Priya Nair')
      for (const other of PEOPLE.filter((candidate) => candidate.id !== 'dana' && candidate.id !== 'priya')) expect(markup).not.toContain(other.name)
      expect(markup.match(/video tile/g)?.length).toBe(2)
    }
    expect(ZOOM_ANCHOR_RECTS['tile-dana'].x).toBeLessThan(ZOOM_ANCHOR_RECTS['tile-priya'].x)
    expect(ZOOM_ANCHOR_RECTS['tile-dana'].y).toBe(ZOOM_ANCHOR_RECTS['tile-priya'].y)
  })

  test('no portrait or remote image: the only picture is the bundled Zoom mark', () => {
    const markup = html(priyaReplied)
    expect(markup.match(/<img/g)?.length).toBe(1)
    expect(markup).not.toMatch(/https?:\/\/(?!www\.w3\.org\/2000\/svg)/)
  })

  test('no quotation before Dana speaks; Dana alone first; Priya replies beneath', () => {
    const none = plain(html(granted))
    expect(none).not.toContain(DANA_QUOTE)
    expect(none).not.toContain(PRIYA_QUOTE)
    expect(hidden(none, 'meeting-quote')).toBe(true)

    const first = plain(html(danaSpoke))
    expect(first).toContain(DANA_QUOTE)
    expect(first).toContain('00:14:32')
    expect(first).not.toContain(PRIYA_QUOTE)
    expect(hidden(first, 'meeting-quote')).toBe(false)
    expect(hidden(first, 'quote-dana')).toBe(false)
    expect(hidden(first, 'quote-priya')).toBe(true)

    const both = plain(html(priyaReplied))
    expect(both).toContain(DANA_QUOTE)
    expect(both).toContain(PRIYA_QUOTE)
    expect(both.indexOf(DANA_QUOTE)).toBeLessThan(both.indexOf(PRIYA_QUOTE))
    expect(hidden(both, 'quote-priya')).toBe(false)
  })

  test('the quotation panel and its rows keep one box whatever is shown', () => {
    for (const name of ['meeting-quote', 'quote-dana', 'quote-priya'] as const) {
      const styles = [danaSpoke, priyaReplied].map((state) => openingTag(html(state), name).match(/style="([^"]*)"/)?.[1]?.replace(';display:none', ''))
      expect(styles[0]).toBe(styles[1])
    }
  })

  test('Dana enters over 500 ms and Priya is revealed left to right over 900 ms, then both settle', () => {
    const danaMid = html(danaSpoke, filmAt(101, { SHOW_MEETING_QUOTE: 100 }))
    expect(danaMid).toMatch(/opacity:0\.\d+/)
    expect(danaMid).toMatch(/translateY\([1-8]px\)/)
    const danaSettled = html(danaSpoke, filmAt(130, { SHOW_MEETING_QUOTE: 100 }))
    expect(danaSettled).toContain('translateY(0px)')
    expect(danaSettled).not.toMatch(/opacity:0\.\d+/)

    const mask = (markup: string): number => Number(markup.match(/clip-path:inset\(0 ([\d.]+)% 0 0\)/)?.[1])
    const start = mask(html(priyaReplied, filmAt(100, { SHOW_MEETING_QUOTE: 100 })))
    const middle = mask(html(priyaReplied, filmAt(114, { SHOW_MEETING_QUOTE: 100 })))
    const done = mask(html(priyaReplied, filmAt(127, { SHOW_MEETING_QUOTE: 100 })))
    expect(start).toBe(100)
    expect(middle).toBeGreaterThan(0)
    expect(middle).toBeLessThan(100)
    expect(done).toBe(0)
    // The whole sentence is in the markup from the first frame: it is revealed by a mask, never typed.
    expect(plain(html(priyaReplied, filmAt(101, { SHOW_MEETING_QUOTE: 100 })))).toContain(PRIYA_QUOTE)
  })

  test('reduced motion and the clickable app show the settled text at once', () => {
    const reduced = html(priyaReplied, filmAt(101, { SHOW_MEETING_QUOTE: 100 }, true))
    expect(reduced).toContain('clip-path:inset(0 0% 0 0)')
    expect(html(priyaReplied)).toContain('clip-path:inset(0 0% 0 0)')
    expect(html(danaSpoke)).toContain('translateY(0px)')
  })

  test('a quotation opens the review only where it is appropriate', () => {
    expect(click(priyaReplied, 'meeting-quote')).toEqual([{ type: 'REVIEW_MEETING' }])
    expect(click(danaSpoke, 'meeting-quote')).toEqual([])
    expect(openingTag(html(priyaReplied), 'meeting-quote')).toMatch(/^<button/)
    expect(openingTag(html(danaSpoke), 'meeting-quote')).toMatch(/^<section/)
  })

  test('the clickable app can move the call on one caption at a time; a film has no such control', () => {
    expect(click(granted, 'quote-dana')).toEqual([])
    expect(plain(html(granted))).toContain('Show next caption')
    expect(plain(html(priyaReplied))).not.toContain('Show next caption')
    expect(plain(html(granted, filmAt(5)))).not.toContain('Show next caption')
    expect(plain(html(enrolled))).not.toContain('Show next caption')
  })
})

describe('APP-08 ended meeting', () => {
  test('Meeting ended replaces the indicator; capture and the quotations stop', () => {
    const markup = plain(html(ended))
    expect(markup).toContain('Meeting ended')
    expect(recordingShown(markup)).toBe(false)
    expect(markup).not.toContain('data-wave')
    expect(hidden(markup, 'recording-indicator')).toBe(true)
    expect(hidden(markup, 'meeting-ended')).toBe(false)
    expect(hidden(markup, 'consent-action')).toBe(true)
    expect(transition(ended, { type: 'SHOW_MEETING_QUOTE', speaker: 'dana' }).ok).toBe(false)
    expect(transition(endedUnconsented, { type: 'GRANT_MEETING_CONSENT', meetingId: 'zoom-kestrel' }).ok).toBe(false)
  })

  test('the end control is live while the call runs, and disabled with its reason afterwards', () => {
    expect(click(granted, 'end-meeting')).toEqual([{ type: 'END_MEETING' }])
    expect(openingTag(html(granted), 'end-meeting')).not.toContain('aria-disabled="true"')
    const markup = plain(html(ended))
    expect(openingTag(markup, 'end-meeting')).toContain('aria-disabled="true"')
    expect(markup).toContain('The meeting has already ended.')
    expect(plain(html(endedUnconsented))).toContain('No capture was started for this meeting.')
    expect(markup).toContain('Capture for this meeting has stopped.')
    expect(hidden(html(granted), 'meeting-ended')).toBe(true)
  })

  test('the quotations stay readable after the call ends', () => {
    expect(plain(html(ended))).toContain(PRIYA_QUOTE)
  })
})

describe('APP-08 waveform', () => {
  test('bar heights are a pure function of the film frame; static in the clickable app and under reduced motion', () => {
    const bars = (markup: string): string => markup.match(/data-wave="".*?<\/div>/)?.[0] ?? ''
    const at3 = bars(html(granted, filmAt(3)))
    expect(at3).not.toBe('')
    expect(bars(html(granted, filmAt(3)))).toBe(at3)
    expect(bars(html(granted, filmAt(9)))).not.toBe(at3)
    expect(bars(html(granted))).toBe(bars(html(granted, filmAt(9, {}, true))))
  })
})

describe('APP-08 anchors, film and theme', () => {
  test('every anchor renders exactly once, in every state, and each hidden one is display:none', () => {
    for (const state of [enrolled, granted, declined, danaSpoke, priyaReplied, ended, endedUnconsented, paused, asManager]) {
      const names = [...html(state).matchAll(/data-film-anchor="([^"]+)"/g)].map((match) => match[1])
      expect([...names].sort()).toEqual([...ZOOM_ANCHORS].sort())
    }
    expect(Object.keys(ZOOM_ANCHOR_RECTS).sort()).toEqual([...ZOOM_ANCHORS].sort())
  })

  test('a shown anchor sits at its declared rectangle (the application area starts at canvas y 76)', () => {
    const markup = html(priyaReplied)
    const origin = (name: 'tile-dana' | 'meeting-consent' | 'end-meeting'): { left: number; top: number } => {
      const style = openingTag(markup, name).match(/left:(\d+)px;top:(\d+)px;width:(\d+)px;height:(\d+)px/)
      if (!style) throw new Error(`no placement for ${name}`)
      return { left: Number(style[1]), top: Number(style[2]) }
    }
    expect(origin('meeting-consent')).toEqual({ left: ZOOM_ANCHOR_RECTS['meeting-consent'].x, top: ZOOM_ANCHOR_RECTS['meeting-consent'].y - 76 })
    expect(origin('end-meeting').left).toBe(ZOOM_ANCHOR_RECTS['end-meeting'].x - 200)
    expect(openingTag(markup, 'tile-priya')).toContain(`width:${ZOOM_ANCHOR_RECTS['tile-priya'].width}px;height:${ZOOM_ANCHOR_RECTS['tile-priya'].height}px`)
  })

  test('nothing here is the execution cyan, and nothing is green: passive capture is neutral ink', () => {
    for (const state of [enrolled, granted, priyaReplied, ended, declined]) {
      const markup = html(state).toLowerCase()
      expect(markup).not.toContain('--arc')
      expect(markup).not.toContain('2fd8ff')
      expect(markup).not.toContain('cyan')
      expect(markup).not.toContain('text-success')
      expect(markup).not.toContain('bg-success')
    }
  })

  test('a film carries no CSS transition or animation, and equal state and frame render equal markup', () => {
    for (const state of [enrolled, granted, danaSpoke, priyaReplied, ended]) {
      const markup = html(state, filmAt(2, { GRANT_MEETING_CONSENT: 1, SHOW_MEETING_QUOTE: 1 }))
      expect(markup).not.toMatch(/transition|animate-/)
      expect(html(state, filmAt(2, { GRANT_MEETING_CONSENT: 1 }))).toBe(html(state, filmAt(2, { GRANT_MEETING_CONSENT: 1 })))
    }
  })

  test('minimum text size is 11 px', () => {
    for (const match of html(priyaReplied).matchAll(/text-\[(\d+)px\]/g)) expect(Number(match[1])).toBeGreaterThanOrEqual(11)
  })

  test('both themes: tile surfaces are token-based, not fixed colours', () => {
    const markup = html(priyaReplied)
    expect(markup).toContain('bg-foreground dark:bg-surface-2')
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
