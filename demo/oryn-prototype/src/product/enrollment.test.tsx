import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createInitialState, reduce, transition } from '@/state'
import type { Action, State } from '@/state'
import { act } from '@/state/test-helpers'
import { ENROLLMENT, type FilmContext } from './contract'
import { ENROLLMENT_ANCHORS } from './anchors'
import { ENROLLMENT_ANCHOR_RECTS } from './enrollment-layout'
import { EnrollmentScreen } from './EnrollmentScreen'

const render = (state: State, film?: FilmContext): string => renderToStaticMarkup(<EnrollmentScreen state={state} film={film} />)

/** The opening tag of the element carrying `data-film-anchor="<name>"`. */
function tag(html: string, name: string): string {
  const match = html.match(new RegExp(`<[^>]*data-film-anchor="${name}"[^>]*>`))
  if (!match) throw new Error(`anchor ${name} is missing`)
  return match[0]
}
const hidden = (html: string, name: string): boolean => tag(html, name).includes('display:none')
const disabled = (html: string, name: string): boolean => tag(html, name).includes('aria-disabled="true"')
const styleOf = (html: string, name: string): string => tag(html, name).match(/style="([^"]*)"/)?.[1] ?? ''
const count = (html: string, needle: string): number => html.split(needle).length - 1

const STEP_ANCHORS = {
  notice: ['notice', 'review-notice', 'understand'],
  capture: ['capture-consent', 'work-applications', 'visual-observation', 'sharing-consent', 'contribution'],
  scope: [],
} as const

const start = (): State => createInitialState()
const accepted = (): State => act(start(), { type: 'ACKNOWLEDGE_NOTICE' })
const onCapture = (): State => act(accepted(), { type: 'WIZARD_NEXT' })
const chosen = (): State => act(onCapture(), { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true })
const onScope = (): State => act(chosen(), { type: 'WIZARD_NEXT' })
const enrolled = (): State => act(onScope(), { type: 'CONSENT' })

describe('SC02 enrollment: notice step', () => {
  const html = render(start())

  test('shows the exact identity, heading and step labels', () => {
    for (const text of ['Your work, your choice', 'Priya Nair', 'Calder &amp; Vance', 'Employee', 'Notice', 'Capture and sharing', 'Work scope', 'Organization notice', 'Review notice', 'I understand', 'Accept and continue', 'Back', 'Decline']) {
      expect(html).toContain(text)
    }
    expect(html).toContain('Priya Nair \u00b7 Calder &amp; Vance \u00b7 Employee')
    expect(html).toContain('Calder &amp; Vance \u00b7 Employee')
  })

  test('only the current step is marked and it carries aria-current', () => {
    expect(count(html, 'aria-current="step"')).toBe(1)
    expect(html).toMatch(/<li aria-current="step" data-step="notice"/)
    expect(render(onCapture())).toMatch(/<li aria-current="step" data-step="capture"/)
    expect(render(onCapture())).toMatch(/data-step="notice" data-state="complete"/)
  })

  test('Accept and continue is unavailable until the notice is acknowledged, and says why in visible text', () => {
    expect(disabled(html, 'continue')).toBe(true)
    expect(html).toContain('Acknowledge the notice to continue.')
    expect(disabled(html, 'back')).toBe(true)
    expect(html).toContain('Notice is the first step.')
  })

  test('unchecked until the person acts; acknowledging checks and locks the row and enables Accept', () => {
    expect(html).toMatch(/aria-checked="false"[^>]*id="enrollment-understand"/)
    const after = render(accepted())
    expect(after).toMatch(/aria-checked="true"[^>]*id="enrollment-understand"/)
    expect(after).toContain('Accepted. Use Decline to withdraw.')
    expect(tag(after, 'understand')).toContain('data-locked="true"')
    expect(disabled(after, 'continue')).toBe(false)
  })

  test('Review notice is a disclosure: expanding shows the notice and is never consent', () => {
    expect(tag(html, 'review-notice')).toContain('aria-expanded="false"')
    const open = act(start(), { type: 'SET_NOTICE_EXPANDED', expanded: true })
    const opened = render(open)
    expect(tag(opened, 'review-notice')).toContain('aria-expanded="true"')
    expect(opened).toContain('Durable private evidence stays on this device.')
    expect(opened).toContain('Authorized cloud inference is transient')
    expect(opened).toContain('Sharing with the organization requires a separate review.')
    expect(opened).toMatch(/aria-checked="false"[^>]*id="enrollment-understand"/)
    expect(disabled(opened, 'continue')).toBe(true)
    expect(open.consent.priya.noticeAccepted).toBe(false)
  })

  test('expanding the notice, ticking and advancing never move or resize an anchor', () => {
    const collapsed = render(start())
    const expanded = render(act(start(), { type: 'SET_NOTICE_EXPANDED', expanded: true }))
    const checked = render(accepted())
    for (const name of ['notice', 'review-notice', 'understand', 'continue', 'back', 'decline']) {
      expect(styleOf(expanded, name)).toBe(styleOf(collapsed, name))
      expect(styleOf(checked, name)).toBe(styleOf(collapsed, name))
    }
    for (const state of [onCapture(), chosen(), onScope(), act(start(), { type: 'DECLINE_NOTICE' })]) {
      for (const name of ['continue', 'back', 'decline']) expect(styleOf(render(state), name)).toBe(styleOf(collapsed, name))
    }
  })
})

describe('SC02 enrollment: anchors', () => {
  const states: Record<string, State> = { notice: start(), capture: onCapture(), scope: onScope() }

  test('every anchor is rendered exactly once on every step and view', () => {
    for (const state of [...Object.values(states), enrolled(), act(start(), { type: 'SELECT_ACTOR', personId: 'marcus' })]) {
      const html = render(state)
      for (const name of ENROLLMENT_ANCHORS) expect(count(html, `data-film-anchor="${name}"`)).toBe(1)
    }
  })

  test('the anchors of other steps are hidden; those of the current step and the footer are shown', () => {
    for (const [step, own] of Object.entries(STEP_ANCHORS)) {
      const html = render(states[step] as State)
      for (const name of ENROLLMENT_ANCHORS) {
        const shown = (own as readonly string[]).includes(name) || ['continue', 'back', 'decline'].includes(name)
        expect(hidden(html, name)).toBe(!shown)
      }
    }
  })

  test('continue is one fixed rectangle on every step, inside the card, at the authored position', () => {
    const rect = ENROLLMENT_ANCHOR_RECTS.continue
    expect(rect.width).toBe(176)
    expect(rect.x + rect.width).toBeLessThanOrEqual(ENROLLMENT.card.x + ENROLLMENT.card.width)
    expect(rect.y).toBe(ENROLLMENT.card.y + 452)
    const styles = Object.values(states).map((state) => styleOf(render(state), 'continue'))
    expect(new Set(styles).size).toBe(1)
    expect(styles[0]).toContain('left:440px;top:452px;width:176px;height:40px')
  })

  test('the Back and Decline rectangles sit in the footer, Back on the left of the card', () => {
    expect(ENROLLMENT_ANCHOR_RECTS.back.x).toBe(ENROLLMENT.card.x + 24)
    expect(ENROLLMENT_ANCHOR_RECTS.back.y + ENROLLMENT_ANCHOR_RECTS.back.height / 2).toBe(572)
    expect(ENROLLMENT_ANCHOR_RECTS.decline.x).toBeGreaterThan(ENROLLMENT_ANCHOR_RECTS.back.x + ENROLLMENT_ANCHOR_RECTS.back.width)
  })
})

describe('SC02 enrollment: capture and sharing step', () => {
  test('capture categories, the locked mandatory exclusion and the separate sharing group', () => {
    const html = render(onCapture())
    for (const text of ['Permitted work observation', 'Work applications', 'Excluded windows', 'Visual observation', 'Organizational contribution', 'Mandatory exclusion: always on', 'Capture acceptance never implies sharing.']) {
      expect(html).toContain(text)
    }
    expect(html).toMatch(/aria-checked="true"[^>]*id="enrollment-excluded-windows"/)
    expect(tag(html, 'capture-consent')).toContain('role="group"')
    expect(tag(html, 'sharing-consent')).toContain('role="group"')
    expect(html).toContain('Not shared')
  })

  test('Continue is blocked with a visible reason until a capture category is on', () => {
    const blocked = render(onCapture())
    expect(disabled(blocked, 'continue')).toBe(true)
    expect(blocked).toContain('Choose at least one capture category to continue.')
    expect(blocked).toContain('>Continue<')
    const open = render(chosen())
    expect(disabled(open, 'continue')).toBe(false)
    expect(open).not.toContain('Choose at least one capture category to continue.')
    expect(render(act(onCapture(), { type: 'SET_CAPTURE_CATEGORY', category: 'visualObservation', enabled: true }))).not.toContain('Choose at least one capture category')
  })

  test('sharing is independent of capture in both directions', () => {
    const sharingOnly = act(onCapture(), { type: 'SET_CONTRIBUTION', enabled: true })
    const html = render(sharingOnly)
    expect(html).toContain('Shared after review')
    expect(disabled(html, 'continue')).toBe(true)
    expect(html).toMatch(/aria-checked="false"[^>]*id="enrollment-work-applications"/)
    const captureOnly = render(chosen())
    expect(captureOnly).toContain('Not shared')
    expect(captureOnly).toMatch(/aria-checked="false"[^>]*id="enrollment-contribution"/)
    expect(disabled(captureOnly, 'continue')).toBe(false)
  })

  test('Back re-opens the previous step and the earlier choices persist', () => {
    const back = act(chosen(), { type: 'WIZARD_BACK' })
    const html = render(back)
    expect(html).toMatch(/<li aria-current="step" data-step="notice"/)
    expect(html).toMatch(/aria-checked="true"[^>]*id="enrollment-understand"/)
    const again = render(act(back, { type: 'WIZARD_NEXT' }))
    expect(again).toMatch(/aria-checked="true"[^>]*id="enrollment-work-applications"/)
    expect(disabled(again, 'back')).toBe(false)
  })
})

describe('SC02 enrollment: work scope step', () => {
  const html = render(act(onScope(), { type: 'SET_CONTRIBUTION', enabled: true }))

  test('lists the approved applications, the locked exclusion and the current choices', () => {
    for (const text of ['Approved work applications', 'Gmail', 'NetSuite', 'AP Exceptions Tracker', 'Slack', 'HubSpot', 'Zoom', 'per-meeting consent only', 'Excluded windows', 'Mandatory exclusion: always on']) {
      expect(html).toContain(text)
    }
    expect(html).toMatch(/Work applications<\/dt><dd[^>]*>On</)
    expect(html).toMatch(/Visual observation<\/dt><dd[^>]*>Off</)
    expect(html).toMatch(/Organizational contribution<\/dt><dd[^>]*>Shared after review</)
    expect(html).toMatch(/aria-checked="true"[^>]*id="enrollment-scope-excluded-windows"/)
    expect(disabled(html, 'continue')).toBe(false)
  })

  test('finishing leads to ST02 and shows the complete panel with a neutral status', () => {
    const done = enrolled()
    expect(done.phase).toBe('ST02')
    const completed = render(done)
    expect(completed).toContain('Enrollment complete')
    expect(completed).toContain('Observation active')
    expect(render(reduce(done, { type: 'PAUSE_OBSERVATION' }))).toContain('Observation paused')
    for (const name of ENROLLMENT_ANCHORS) expect(hidden(completed, name)).toBe(true)
  })

  test('a withdrawn notice blocks finishing with its reason', () => {
    const declined = act(onScope(), { type: 'DECLINE_NOTICE' })
    const view = render(declined)
    expect(disabled(view, 'continue')).toBe(true)
    expect(view).toContain('Observation is off: the notice was declined.')
    expect(transition(declined, { type: 'CONSENT' }).ok).toBe(false)
  })
})

describe('SC02 enrollment: declined and denied', () => {
  test('declining keeps observation off and says so; accepting stays unavailable', () => {
    const declined = act(accepted(), { type: 'DECLINE_NOTICE' })
    const html = render(declined)
    expect(html).toContain('Observation is off: the notice was declined.')
    expect(disabled(html, 'continue')).toBe(true)
    expect(html).toMatch(/aria-checked="false"[^>]*id="enrollment-understand"/)
    expect(declined.phase).toBe('ST01')
    expect(html).not.toContain('Observation active')
  })

  test('another person sees the denial, their own name and role, and no enabled control', () => {
    const html = render(act(start(), { type: 'SELECT_ACTOR', personId: 'marcus' }))
    expect(html).toContain('Enrollment is completed by the employee being enrolled.')
    expect(html).toContain('Marcus Webb')
    expect(html).toContain('Workflow Owner')
    expect(html).not.toContain('<button')
    expect(html).not.toContain('Accept and continue')
    for (const name of ENROLLMENT_ANCHORS) expect(hidden(html, name)).toBe(true)
  })
})

describe('SC02 enrollment: film', () => {
  const film = (frame: number, applied: Partial<Record<Action['type'], number>>): FilmContext => ({ frame, reducedMotion: false, lastApplied: (type) => applied[type] ?? null })

  test('the step swap fades the body mid-motion and never moves an anchor', () => {
    const state = onCapture()
    const mid = render(state, film(3, { WIZARD_NEXT: 1 }))
    expect(mid).toMatch(/opacity:0\.\d+/)
    expect(render(state, film(40, { WIZARD_NEXT: 1 }))).not.toMatch(/opacity:0\.\d+/)
    for (const name of ENROLLMENT_ANCHORS) expect(styleOf(mid, name)).toBe(styleOf(render(state), name))
  })

  test('the notice reveal is an opacity change inside a fixed box', () => {
    const open = act(start(), { type: 'SET_NOTICE_EXPANDED', expanded: true })
    const mid = render(open, film(3, { SET_NOTICE_EXPANDED: 1 }))
    expect(mid).toMatch(/id="enrollment-notice-panel"[^>]*opacity:0\.\d+/)
    for (const name of ['notice', 'review-notice', 'understand']) expect(styleOf(mid, name)).toBe(styleOf(render(open), name))
  })

  test('no animation classes and no cyan anywhere, and equal state renders equal markup', () => {
    for (const state of [start(), onCapture(), onScope(), enrolled(), act(start(), { type: 'DECLINE_NOTICE' })]) {
      const html = render(state, film(5, {}))
      expect(html).not.toMatch(/animate-|--arc|bg-arc|text-arc|border-arc|2fd8ff/i)
      expect(render(state)).toBe(render(state))
      expect(html).toBe(render(state, film(5, {})))
    }
  })
})
