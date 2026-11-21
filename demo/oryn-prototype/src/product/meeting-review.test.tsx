import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { COMMITMENT, MEETING_QUOTES } from '@/data/commitment'
import type { Rect, TypedView } from '@/film'
import { reconstruct, transition } from '@/state'
import type { Action, State } from '@/state'
import { act as run } from '@/state/test-helpers'
import type { FilmContext, ProductProps } from './contract'
import { MEETING_REVIEW_ANCHORS, MEETING_REVIEW_ANCHOR_RECTS, COMMITMENT_CARD, TRANSCRIPT_CARD } from './meeting-review-layout'
import { MeetingReviewScreen } from './MeetingReviewScreen'

type Props = Record<string, unknown>

const html = (state: State, film?: FilmContext): string => renderToStaticMarkup(<MeetingReviewScreen state={state} film={film} />)
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&')

const openingTag = (markup: string, name: string): string => {
  const tag = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return tag
}
const hidden = (markup: string, name: string): boolean => openingTag(markup, name).includes('display:none')
const disabled = (markup: string, name: string): boolean => openingTag(markup, name).includes('aria-disabled="true"')

const filmAt = (frame: number, applied: Partial<Record<Action['type'], number>> = {}, texts?: Readonly<Record<string, TypedView>>): FilmContext => ({
  frame,
  reducedMotion: false,
  lastApplied: (type) => applied[type] ?? null,
  texts,
})

/** Canvas rectangle an anchor is placed at: its own left/top/width/height plus the card origin it is nested in. */
function placed(markup: string, name: (typeof MEETING_REVIEW_ANCHORS)[number]): Rect {
  const style = openingTag(markup, name).match(/left:(\d+)px;top:(\d+)px;width:(\d+)px;height:(\d+)px/)
  if (!style) throw new Error(`No placement for ${name}`)
  const [left, top, width, height] = style.slice(1).map(Number) as [number, number, number, number]
  const origin = name === 'transcript' || name === 'commitment-card' ? { x: 0, y: 0 } : { x: COMMITMENT_CARD.x, y: COMMITMENT_CARD.y }
  return { x: origin.x + left, y: origin.y + top, width, height }
}

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

/** Fire one handler of an anchored element and return every action it dispatched. */
function fire(state: State, name: string, handler: string, event: Props = {}): Action[] {
  const dispatched: Action[] = []
  const props: ProductProps = { state, dispatch: (action) => dispatched.push(action) }
  const element = anchoredElements(<MeetingReviewScreen {...props} />).find((candidate) => candidate.props['data-film-anchor'] === name)
  if (!element) throw new Error(`No element for anchor ${name}`)
  ;(element.props[handler] as ((event: Props) => void) | undefined)?.({ preventDefault: () => undefined, ...event })
  return dispatched
}

const proposed = reconstruct('ST03')
const edited = run(proposed, { type: 'EDIT_COMMITMENT', due: 'Fri 12:00' })
const confirmed = run(edited, { type: 'CONFIRM_COMMITMENT' })
const asManager = run(proposed, { type: 'SELECT_ACTOR', personId: 'marcus' })
const withoutOptIn: State = { ...proposed, consent: { ...proposed.consent, priya: { ...proposed.consent.priya, meetings: { 'zoom-kestrel': 'absent' } } } }

const DANA_QUOTE = MEETING_QUOTES[0].quote
const PRIYA_QUOTE = MEETING_QUOTES[1].quote

describe('SC11 exact content', () => {
  test('suggested and unconfirmed: title, owner, proposed due, source, caveat, badge and Confirm', () => {
    const markup = plain(html(proposed))
    for (const text of ['Meeting transcript', 'Confirm Kestrel handling-fee terms in writing', 'Priya Nair', 'Fri 17:00', 'Zoom 00:14:32', 'subject to company approval', 'Suggested', 'Confirm', 'Owner', 'Due', 'Source']) {
      expect(markup).toContain(text)
    }
    expect(markup).toContain("Confirmation does not establish company policy or another person's acceptance.")
    expect(markup).not.toContain('Confirmed Commitment')
    expect(openingTag(markup, 'confirm-commitment')).not.toContain('aria-disabled="true"')
  })

  test('the transcript shows both quotations exactly, Dana with the source time and Priya with an unknown time', () => {
    const markup = plain(html(proposed))
    expect(markup).toContain(DANA_QUOTE)
    expect(markup).toContain(PRIYA_QUOTE)
    expect(markup).toContain('Dana Whitfield · 00:14:32')
    expect(markup).toContain('Priya Nair · Time unknown')
    expect(markup.indexOf(DANA_QUOTE)).toBeLessThan(markup.indexOf(PRIYA_QUOTE))
    expect(COMMITMENT.source).toBe('Zoom 00:14:32')
  })

  test('without this meeting\u2019s opt-in the commitment and transcript are replaced by the opt-in line', () => {
    const markup = plain(html(withoutOptIn))
    expect(markup).toContain('Meeting capture requires per-meeting opt-in.')
    expect(markup).not.toContain(DANA_QUOTE)
    expect(markup).not.toContain('Fri 17:00')
    expect(markup).not.toContain('Suggested')
    for (const name of ['deadline', 'confirm-commitment', 'meeting-source', 'commitment-status', 'commitment-caveat'] as const) expect(hidden(markup, name)).toBe(true)
    expect(hidden(markup, 'transcript')).toBe(false)
    expect(hidden(markup, 'commitment-card')).toBe(false)
  })

  test('another viewpoint sees no transcript text, and a disabled Confirm with its reason', () => {
    const markup = plain(html(asManager))
    expect(markup).not.toContain(DANA_QUOTE)
    expect(markup).not.toContain(PRIYA_QUOTE)
    expect(markup).toContain('This transcript is private to the meeting participant.')
    expect(disabled(markup, 'confirm-commitment')).toBe(true)
    expect(markup).toContain('Only the commitment owner, Priya Nair, confirms it.')
    expect(fire(asManager, 'deadline', 'onChange', { target: { value: 'Fri 9:00' } })).toEqual([])
    expect(transition(asManager, { type: 'CONFIRM_COMMITMENT' }).ok).toBe(false)
  })
})

describe('SC11 deadline', () => {
  test('original and corrected deadlines are distinct and both visible; the original is struck', () => {
    const before = plain(html(proposed))
    expect(before).not.toContain('<s ')
    expect(before).toContain('Fri 17:00')
    const after = plain(html(edited))
    expect(after).toMatch(/<s [^>]*>Fri 17:00<\/s>/)
    expect(after).toContain('value="Fri 12:00"')
    expect(after).toContain('Suggested')
    expect(after).not.toContain('Confirmed Commitment')
    expect(edited.commitment.due).toBe('Fri 12:00')
  })

  test('the field shows the film typed text while it types, through the typed view', () => {
    const typed: TypedView = { target: 'deadline', text: 'Fri 1', full: 'Fri 12:00', count: 5, selected: false, complete: false, caret: true }
    const markup = plain(html(proposed, filmAt(40, {}, { deadline: typed })))
    expect(markup).toContain('data-film-typed="deadline"')
    expect(markup).toContain('Fri 1')
    expect(markup).toContain('data-film-caret')
    expect(plain(html(proposed, filmAt(40)))).not.toContain('data-film-typed')
  })

  test('the clickable field edits a draft: each change dispatches the draft, Enter saves it, Escape cancels it', () => {
    expect(fire(proposed, 'deadline', 'onChange', { target: { value: 'Fri 9:00' } })).toEqual([{ type: 'DRAFT_DEADLINE', text: 'Fri 9:00' }])
    const drafting = run(proposed, { type: 'DRAFT_DEADLINE', text: ' Fri 9:00 ' })
    expect(plain(html(drafting))).toContain('value=" Fri 9:00 "')
    expect(fire(drafting, 'deadline', 'onKeyDown', { key: 'Enter' })).toEqual([{ type: 'EDIT_COMMITMENT', due: 'Fri 9:00' }])
    expect(fire(drafting, 'deadline', 'onKeyDown', { key: 'Escape' })).toEqual([{ type: 'DRAFT_DEADLINE', text: null }])
    expect(fire(proposed, 'deadline', 'onKeyDown', { key: 'Enter' })).toEqual([])
  })

  test('a blank deadline is refused by the reducer and Confirm is disabled with that reason', () => {
    const blank = run(proposed, { type: 'DRAFT_DEADLINE', text: '   ' })
    const refused = transition(blank, { type: 'EDIT_COMMITMENT', due: '' })
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.rejection.reason).toBe('A deadline is required.')
    expect(fire(blank, 'deadline', 'onKeyDown', { key: 'Enter' })).toEqual([{ type: 'EDIT_COMMITMENT', due: '' }])
    const markup = plain(html(blank))
    expect(disabled(markup, 'confirm-commitment')).toBe(true)
    expect(markup).toContain('A deadline is required.')
  })
})

describe('SC11 confirmation', () => {
  test('Confirm dispatches the edit first when the draft differs, then the confirmation, and nothing else', () => {
    const drafting = run(proposed, { type: 'DRAFT_DEADLINE', text: 'Fri 12:00' })
    expect(fire(drafting, 'confirm-commitment', 'onClick')).toEqual([{ type: 'EDIT_COMMITMENT', due: 'Fri 12:00' }, { type: 'CONFIRM_COMMITMENT' }])
    expect(fire(edited, 'confirm-commitment', 'onClick')).toEqual([{ type: 'CONFIRM_COMMITMENT' }])
  })

  test('confirmed: Confirmed Commitment with a check, the caveat and the struck original due remain, and the control reads Confirmed', () => {
    const markup = plain(html(confirmed))
    expect(markup).toContain('Confirmed Commitment')
    expect(markup).not.toContain('Suggested')
    expect(markup).toContain('subject to company approval')
    expect(markup).toContain("Confirmation does not establish company policy or another person's acceptance.")
    expect(markup).toMatch(/<s [^>]*>Fri 17:00<\/s>/)
    expect(markup).toContain('Fri 12:00')
    expect(markup).not.toContain('<input')
    expect(confirmed.commitment.status).toBe('confirmed')
    expect(confirmed.commitment.confirmedDue).toBe('Fri 12:00')
  })

  test('after confirmation the Confirm control stays at its rect as a disabled Confirmed control with no action', () => {
    const markup = plain(html(confirmed))
    expect(hidden(markup, 'confirm-commitment')).toBe(false)
    expect(disabled(markup, 'confirm-commitment')).toBe(true)
    const tag = openingTag(markup, 'confirm-commitment')
    expect(tag).not.toContain('display:none')
    const body = markup.slice(markup.indexOf(tag), markup.indexOf('</button>', markup.indexOf(tag)))
    expect(body).toContain('Confirmed')
    expect(body).toContain('<svg')
    expect(body).not.toContain('Unavailable:')
    expect(fire(confirmed, 'confirm-commitment', 'onClick')).toEqual([])
    expect(transition(confirmed, { type: 'CONFIRM_COMMITMENT' }).ok).toBe(false)
  })

  test('the Source link focuses the transcript in the clickable app and is inert in a film and for another viewpoint', () => {
    expect(openingTag(html(proposed), 'meeting-source')).toMatch(/^<button/)
    expect(openingTag(html(proposed), 'meeting-source')).toContain('aria-controls="meeting-transcript"')
    expect(html(proposed)).toContain('id="meeting-transcript"')
    expect(html(proposed)).toContain('tabindex="-1"')
    expect(openingTag(html(asManager), 'meeting-source')).toMatch(/^<span/)
  })
})

describe('SC11 geometry', () => {
  const states: Readonly<Record<string, State>> = { proposed, edited, confirmed, asManager }

  test('every anchor renders exactly once in every state', () => {
    for (const state of [...Object.values(states), withoutOptIn]) {
      const names = [...html(state).matchAll(/data-film-anchor="([^"]+)"/g)].map((match) => match[1])
      expect([...names].sort()).toEqual([...MEETING_REVIEW_ANCHORS].sort())
    }
  })

  test('each shown anchor sits at its declared canvas rectangle, whatever the state, the typed text or the frame', () => {
    const typed: TypedView = { target: 'deadline', text: 'Fri 12:0', full: 'Fri 12:00', count: 8, selected: false, complete: false, caret: true }
    const renders = [...Object.values(states).map((state) => html(state)), html(proposed, filmAt(10, {}, { deadline: typed })), html(edited, filmAt(3, { EDIT_COMMITMENT: 2 }))]
    for (const markup of renders) {
      for (const name of MEETING_REVIEW_ANCHORS) expect(placed(markup, name)).toEqual(MEETING_REVIEW_ANCHOR_RECTS[name])
    }
    expect(MEETING_REVIEW_ANCHOR_RECTS.transcript).toEqual(TRANSCRIPT_CARD)
    expect(MEETING_REVIEW_ANCHOR_RECTS['commitment-card']).toEqual(COMMITMENT_CARD)
    expect(MEETING_REVIEW_ANCHOR_RECTS.deadline.height).toBe(40)
    expect(MEETING_REVIEW_ANCHOR_RECTS['confirm-commitment'].height).toBe(40)
  })

  test('the anchors are hidden only where the view does not show them', () => {
    for (const state of Object.values(states)) {
      for (const name of MEETING_REVIEW_ANCHORS) expect(hidden(html(state), name)).toBe(false)
    }
  })
})

describe('SC11 film and theme', () => {
  test('no cyan and no network in any state', () => {
    for (const state of [proposed, edited, confirmed, asManager, withoutOptIn]) {
      const markup = html(state).toLowerCase()
      expect(markup).not.toContain('--arc')
      expect(markup).not.toContain('2fd8ff')
      expect(markup).not.toContain('cyan')
      expect(markup).not.toMatch(/https?:\/\/(?!www\.w3\.org\/2000\/svg)/)
    }
  })

  test('a film carries no CSS transition or animation; equal state and frame render equal markup', () => {
    for (const state of [proposed, edited, confirmed]) {
      const film = filmAt(2, { CONFIRM_COMMITMENT: 1, EDIT_COMMITMENT: 1 })
      expect(html(state, film)).not.toMatch(/transition|animate-/)
      expect(html(state, film)).toBe(html(state, filmAt(2, { CONFIRM_COMMITMENT: 1, EDIT_COMMITMENT: 1 })))
    }
  })

  test('the 150 ms status change fades in a film and is settled outside one', () => {
    const mid = html(confirmed, filmAt(11, { CONFIRM_COMMITMENT: 10 }))
    expect(mid).toMatch(/opacity:0\.\d+/)
    expect(html(confirmed, filmAt(30, { CONFIRM_COMMITMENT: 10 }))).not.toMatch(/opacity:0\.\d+/)
    expect(html(confirmed)).not.toMatch(/opacity:0\.\d+/)
  })

  test('minimum text size is 11 px', () => {
    for (const match of html(proposed).matchAll(/text-\[(\d+)px\]/g)) expect(Number(match[1])).toBeGreaterThanOrEqual(11)
  })
})
