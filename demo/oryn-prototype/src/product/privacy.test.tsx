import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createInitialState, reduce, transition } from '@/state'
import type { Action, State } from '@/state'
import { act } from '@/state/test-helpers'
import type { FilmContext } from './contract'
import { PRIVACY_ANCHORS } from './anchors'
import { PrivacyScreen } from './PrivacyScreen'
import { PRIVACY_ANCHOR_RECTS } from './privacy-layout'

const render = (state: State, film?: FilmContext): string => renderToStaticMarkup(<PrivacyScreen state={state} film={film} />)

function tag(html: string, name: string): string {
  const match = html.match(new RegExp(`<[^>]*data-film-anchor="${name}"[^>]*>`))
  if (!match) throw new Error(`anchor ${name} is missing`)
  return match[0]
}
const hidden = (html: string, name: string): boolean => tag(html, name).includes('display:none')
const styleOf = (html: string, name: string): string => tag(html, name).match(/style="([^"]*)"/)?.[1] ?? ''
const count = (html: string, needle: string): number => html.split(needle).length - 1

const enrolled = (): State =>
  act(createInitialState(), { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }, { type: 'CONSENT' })
const asMarcus = (): State => act(enrolled(), { type: 'SELECT_ACTOR', personId: 'marcus' })

describe('SC03 My Privacy: content', () => {
  const html = render(enrolled())

  test('shows the exact labels', () => {
    for (const text of ['My Privacy', 'Excluded apps, windows and URLs', 'Mandatory exclusions', 'Local retention: 7 days', 'Pause observation', 'Delete local history', 'BANK ACCT', 'TAX ID', 'CARD', 'Protected fields']) {
      expect(html).toContain(text)
    }
  })

  test('three separate exclusion categories are named in text and each lists two generic entries', () => {
    for (const label of ['Excluded apps', 'Excluded windows', 'Excluded URLs']) expect(html).toContain(`>${label}</h3>`)
    for (const entry of ['Password managers', 'Messaging apps', 'Private windows', 'Lock screens', 'Banking sites', 'Health portals']) {
      expect(html).toContain(entry)
    }
    expect(count(html, 'privacy-exclusions-apps')).toBeGreaterThan(0)
    expect(html.match(/<li class="[^"]*flex h-6/g)?.length).toBe(6)
  })

  test('the mandatory exclusion is a locked, checked, explained row that nothing can switch off', () => {
    const row = html.match(/<label[^>]*>(?:(?!<\/label>).)*privacy-mandatory-exclusions(?:(?!<\/label>).)*<\/label>/s)?.[0] ?? ''
    expect(row).toContain('aria-checked="true"')
    expect(row).toContain('aria-disabled="true"')
    expect(row).toContain('data-locked="true"')
    expect(row).toContain('Mandatory exclusion: always on')
    expect(row).toContain('lucide-lock')
    expect(row).toMatch(/aria-describedby="privacy-mandatory-exclusions-reason"/)
  })

  test('all three protected fields are masked from the first frame and no value exists', () => {
    for (const label of ['BANK ACCT', 'TAX ID', 'CARD']) expect(html).toContain(`role="img" aria-label="${label}: masked"`)
    expect(count(html, 'data-hatch=')).toBe(3)
    expect(count(html, 'role="img"')).toBe(3)
    expect(html).not.toMatch(/\d{2}-\d{7}|\d{4} \d{4}|\*{3,}|\u2022{2,}/)
  })

  test('retention is accurate: local for 7 days, cloud inference authorized and transient, never local AI', () => {
    expect(html).toContain('Raw capture stays on this device for 7 days.')
    expect(html).toContain('Cloud inference is authorized and transient')
    expect(html).not.toMatch(/on-device (AI|model|inference)|local (AI|model|inference)/i)
  })
})

describe('SC03 My Privacy: pause', () => {
  test('active offers Pause observation; paused offers Resume observation; status is explicit text', () => {
    const active = render(enrolled())
    expect(active).toContain('Observation active')
    expect(active).toContain('>Pause observation<')
    expect(active).not.toContain('Resume observation')
    const paused = render(reduce(enrolled(), { type: 'PAUSE_OBSERVATION' }))
    expect(paused).toContain('Observation paused')
    expect(paused).toContain('>Resume observation<')
    expect(paused).not.toContain('>Pause observation<')
    const resumed = render(act(enrolled(), { type: 'PAUSE_OBSERVATION' }, { type: 'RESUME_OBSERVATION' }))
    expect(resumed).toContain('Observation active')
  })

  test('before enrollment completes, observation reads off', () => {
    expect(render(createInitialState())).toContain('Observation off')
  })

  test('the pause control keeps one rectangle when its label changes', () => {
    const paused = render(reduce(enrolled(), { type: 'PAUSE_OBSERVATION' }))
    for (const name of PRIVACY_ANCHORS) expect(styleOf(paused, name)).toBe(styleOf(render(enrolled()), name))
  })
})

describe('SC03 My Privacy: delete local history', () => {
  test('the dialog is rendered but hidden until opened', () => {
    const closed = render(enrolled())
    expect(hidden(closed, 'delete-dialog')).toBe(true)
    expect(hidden(closed, 'delete-confirm')).toBe(true)
    expect(hidden(closed, 'delete-cancel')).toBe(true)
    expect(hidden(closed, 'delete-local-history')).toBe(false)
  })

  test('opening it warns that only local history is removed', () => {
    const open = render(act(enrolled(), { type: 'OPEN_DELETE_DIALOG' }))
    expect(tag(open, 'delete-dialog')).toContain('role="dialog"')
    expect(tag(open, 'delete-dialog')).toContain('aria-modal="true"')
    expect(hidden(open, 'delete-dialog')).toBe(false)
    expect(hidden(open, 'delete-confirm')).toBe(false)
    expect(open).toContain('Delete local history?')
    expect(open).toContain('Delete eligible local history from this device. Shared contributions and published knowledge are not removed.')
    expect(open).toContain('>Cancel<')
    expect(open).toContain('bg-black/80')
  })

  test('cancel keeps history; confirming deletes local history only and shows the receipt', () => {
    const cancelled = render(act(enrolled(), { type: 'OPEN_DELETE_DIALOG' }, { type: 'CANCEL_DELETE' }))
    expect(hidden(cancelled, 'delete-dialog')).toBe(true)
    expect(cancelled).not.toContain('Local history deleted from this device.')
    expect(cancelled).toMatch(/Local history<\/dt><dd[^>]*>Retained</)
    const deleted = render(act(enrolled(), { type: 'OPEN_DELETE_DIALOG' }, { type: 'CONFIRM_DELETE_LOCAL_HISTORY' }))
    expect(hidden(deleted, 'delete-dialog')).toBe(true)
    expect(deleted).toContain('Local history deleted from this device. Shared contributions and published knowledge were not removed.')
    expect(deleted).toMatch(/Local history<\/dt><dd[^>]*>Deleted</)
  })

  test('the dialog never leaves an anchor out of place when it opens', () => {
    const closed = render(enrolled())
    const open = render(act(enrolled(), { type: 'OPEN_DELETE_DIALOG' }))
    for (const name of ['exclusions', 'retention', 'masked-fields', 'privacy-pause', 'delete-local-history']) expect(styleOf(open, name)).toBe(styleOf(closed, name))
  })

  test('the dialog is centred, at most 512 px wide, over the whole canvas', () => {
    const rect = PRIVACY_ANCHOR_RECTS['delete-dialog']
    expect(rect.width).toBeLessThanOrEqual(512)
    expect(rect.x + rect.width / 2).toBe(640)
    const open = render(act(enrolled(), { type: 'OPEN_DELETE_DIALOG' }))
    expect(open).toContain('position:absolute;left:0;top:0;width:1280px;height:720px;z-index:40')
    expect(PRIVACY_ANCHOR_RECTS['delete-confirm'].x).toBeGreaterThan(PRIVACY_ANCHOR_RECTS['delete-cancel'].x)
  })
})

describe('SC03 My Privacy: anchors, denial and film', () => {
  test('every anchor is rendered exactly once in every view', () => {
    for (const state of [enrolled(), createInitialState(), asMarcus(), act(enrolled(), { type: 'OPEN_DELETE_DIALOG' })]) {
      const html = render(state)
      for (const name of PRIVACY_ANCHORS) expect(count(html, `data-film-anchor="${name}"`)).toBe(1)
    }
  })

  test('the columns and cards sit at the authored canvas rectangles', () => {
    expect(PRIVACY_ANCHOR_RECTS.exclusions).toEqual({ x: 264, y: 160, width: 600, height: 208 })
    expect(PRIVACY_ANCHOR_RECTS['masked-fields']).toEqual({ x: 888, y: 160, width: 368, height: 208 })
    expect(PRIVACY_ANCHOR_RECTS.retention.x).toBe(264)
    expect(PRIVACY_ANCHOR_RECTS['privacy-pause'].y).toBe(PRIVACY_ANCHOR_RECTS['delete-local-history'].y)
    expect(render(enrolled())).toContain('position:absolute;left:264px;top:112px;width:992px;height:584px')
  })

  test('another viewpoint is told it is not available and gets no controls or anchors', () => {
    const state = asMarcus()
    const html = render(state)
    expect(html).toContain('Not available: only an Employee manages their own observation consent.')
    expect(html).toContain('Marcus Webb')
    expect(html).toContain('Workflow Owner')
    expect(html).not.toContain('<button')
    expect(html).not.toContain('Protected fields')
    for (const name of PRIVACY_ANCHORS) expect(hidden(html, name)).toBe(true)
    expect(transition(state, { type: 'OPEN_DELETE_DIALOG' }).ok).toBe(false)
  })

  test('the dialog fades by opacity only, with no animation classes and no cyan', () => {
    const open = act(enrolled(), { type: 'OPEN_DELETE_DIALOG' })
    const film = (frame: number): FilmContext => ({ frame, reducedMotion: false, lastApplied: (type: Action['type']) => (type === 'OPEN_DELETE_DIALOG' ? 1 : null) })
    const mid = render(open, film(3))
    expect(mid).toMatch(/z-index:40;[^"]*opacity:0\.\d+/)
    expect(render(open, film(60))).not.toMatch(/opacity:0\.\d+/)
    for (const name of PRIVACY_ANCHORS) expect(styleOf(mid, name)).toBe(styleOf(render(open), name))
    for (const state of [enrolled(), open, asMarcus()]) {
      const html = render(state, film(5))
      expect(html).not.toMatch(/animate-|--arc|bg-arc|text-arc|border-arc|2fd8ff/i)
      expect(html).toBe(render(state, film(5)))
    }
  })
})
