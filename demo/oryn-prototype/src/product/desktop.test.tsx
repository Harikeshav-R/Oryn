import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { APP_TAB_IDS, createInitialState, transition, type Action, type State } from '@/state'
import { act as run } from '@/state/test-helpers'
import { APP_TABS, EXCLUDED } from './desktop-data'
import { DESKTOP_ANCHORS } from './anchors'
import { DesktopScreen } from './DesktopScreen'
import { DESKTOP, type FilmContext, type ProductProps } from './contract'

type Props = Record<string, unknown>

const html = (state: State, film?: FilmContext): string => renderToStaticMarkup(<DesktopScreen state={state} film={film} />)

/** Host elements of the rendered tree in document order. Screens use no hooks, so components can be called directly. */
function flatten(node: ReactNode, out: ReactElement<Props>[] = []): ReactElement<Props>[] {
  if (Array.isArray(node)) {
    node.forEach((child) => flatten(child as ReactNode, out))
    return out
  }
  if (!isValidElement<Props>(node)) return out
  if (typeof node.type === 'function') return flatten((node.type as (props: Props) => ReactNode)(node.props), out)
  if (typeof node.type === 'string') out.push(node)
  return flatten(node.props.children as ReactNode, out)
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map((child) => textOf(child as ReactNode)).join('')
  if (!isValidElement<Props>(node)) return ''
  if (typeof node.type === 'function') return textOf((node.type as (props: Props) => ReactNode)(node.props))
  return textOf(node.props.children as ReactNode)
}

function byAnchor(props: ProductProps, name: string): ReactElement<Props> {
  const found = flatten(<DesktopScreen {...props} />).find((element) => element.props['data-film-anchor'] === name)
  if (!found) throw new Error(`No element for anchor ${name}`)
  return found
}

/** Click the element for an anchor and return every action it dispatched. */
function click(state: State, name: string): Action[] {
  const dispatched: Action[] = []
  const onClick = byAnchor({ state, dispatch: (action) => dispatched.push(action) }, name).props.onClick as (() => void) | undefined
  onClick?.()
  return dispatched
}

const openingTag = (markup: string, name: string): string => {
  const tag = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return tag
}
const hidden = (markup: string, name: string): boolean => openingTag(markup, name).includes('display:none')
const count = (markup: string, needle: string): number => markup.split(needle).length - 1

const initial = createInitialState()
const enrolled = run(initial, { type: 'ACKNOWLEDGE_NOTICE' }, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled: true }, { type: 'CONSENT' })
const opened = (state: State): State => run(state, { type: 'SET_OVERLAY', overlay: 'companion' })
const active = opened(enrolled)
const paused = run(active, { type: 'PAUSE_OBSERVATION' })

/** Frames are counted from the landing of SET_OVERLAY, which is clip frame 1: a landing on frame 0 is the start state and has no motion. */
const filmAt = (frame: number): FilmContext => ({ frame: frame + 1, reducedMotion: false, lastApplied: (type) => (type === 'SET_OVERLAY' ? 1 : null) })

describe('desktop anchors', () => {
  test('exports the fourteen anchors in the authored order', () => {
    expect([...DESKTOP_ANCHORS]).toEqual([
      'browser-tabs',
      'tab-gmail',
      'tab-netsuite',
      'tab-tracker',
      'tab-slack',
      'tab-zoom',
      'tab-hubspot',
      'tray-icon',
      'companion-menu',
      'pause-observation',
      'my-privacy-link',
      'excluded-window',
      'excluded-cue',
      'dock',
    ])
  })

  test.each([
    ['initial', initial],
    ['menu open', active],
    ['paused', paused],
    ['excluded window', run(enrolled, { type: 'SET_FOREGROUND', window: 'excluded' })],
    ['non-employee', run(initial, { type: 'SELECT_ACTOR', personId: 'daniel' })],
  ])('renders every anchor exactly once: %s', (_label, state) => {
    const markup = html(state)
    for (const name of DESKTOP_ANCHORS) expect(count(markup, `data-film-anchor="${name}"`)).toBe(1)
  })

  test('the menu and its two rows are display:none, each on its own element, until the menu opens', () => {
    const closed = html(enrolled)
    const open = html(active)
    for (const name of ['companion-menu', 'pause-observation', 'my-privacy-link']) {
      expect(hidden(closed, name)).toBe(true)
      expect(hidden(open, name)).toBe(false)
    }
  })

  test('the excluded window and its cue are hidden while the foreground is work, shown when it is excluded', () => {
    const work = html(enrolled)
    const excluded = html(run(enrolled, { type: 'SET_FOREGROUND', window: 'excluded' }))
    for (const name of ['excluded-window', 'excluded-cue']) {
      expect(hidden(work, name)).toBe(true)
      expect(hidden(excluded, name)).toBe(false)
    }
  })

  test('tray, dock and tabs are always shown at their authored boxes', () => {
    const markup = html(initial)
    for (const name of ['tray-icon', 'dock', 'browser-tabs', ...APP_TABS.map((tab) => `tab-${tab.id}`)]) expect(hidden(markup, name)).toBe(false)
    expect(openingTag(markup, 'tray-icon')).toContain(`left:${DESKTOP.trayIcon.x - 10}px;top:${DESKTOP.trayIcon.y - 10}px;width:20px;height:20px`)
    expect(openingTag(markup, 'dock')).toContain(`left:${DESKTOP.dock.x}px;top:${DESKTOP.dock.y}px;width:${DESKTOP.dock.width}px;height:${DESKTOP.dock.height}px`)
    expect(openingTag(markup, 'companion-menu')).toContain(`left:${DESKTOP.companionMenu.x}px;top:${DESKTOP.companionMenu.y}px;width:310px;height:232px`)
  })
})

describe('SC01 companion menu', () => {
  test('active and paused text differ', () => {
    const on = html(active)
    const off = html(paused)
    expect(on).toContain('Observation active')
    expect(on).toContain('Capture active')
    expect(on).toContain('Pause observation')
    expect(on).not.toContain('Observation paused')
    expect(off).toContain('Observation paused')
    expect(off).toContain('Resume observation')
    expect(off).not.toContain('Observation active')
    expect(off).not.toContain('Capture active')
  })

  test('pause is one action and resume is an explicit action', () => {
    expect(click(active, 'pause-observation')).toEqual([{ type: 'PAUSE_OBSERVATION' }])
    expect(click(paused, 'pause-observation')).toEqual([{ type: 'RESUME_OBSERVATION' }])
    const after = transition(active, { type: 'PAUSE_OBSERVATION' })
    expect(after.ok).toBe(true)
    expect(html(after.state)).toContain('Observation paused')
  })

  test('My Privacy opens SC03 in one click and closes the menu', () => {
    expect(click(active, 'my-privacy-link')).toEqual([
      { type: 'OPEN_SCREEN', screen: 'SC03' },
      { type: 'SET_OVERLAY', overlay: null },
    ])
  })

  test('the tray toggles the menu', () => {
    expect(click(enrolled, 'tray-icon')).toEqual([{ type: 'SET_OVERLAY', overlay: 'companion' }])
    expect(click(active, 'tray-icon')).toEqual([{ type: 'SET_OVERLAY', overlay: null }])
    const tray = openingTag(html(active), 'tray-icon')
    expect(tray).toContain('aria-label="Oryn observation status"')
    expect(tray).toContain('aria-expanded="true"')
    expect(openingTag(html(enrolled), 'tray-icon')).toContain('aria-expanded="false"')
  })

  test('the tray glyph tells active, paused and off apart', () => {
    expect(openingTag(html(enrolled), 'tray-icon')).toContain('data-observation="active"')
    expect(openingTag(html(paused), 'tray-icon')).toContain('data-observation="paused"')
    expect(openingTag(html(initial), 'tray-icon')).toContain('data-observation="off"')
  })

  test('with the notice not accepted observation is off and Pause is disabled with a visible reason', () => {
    const off = opened(initial)
    const markup = html(off)
    expect(markup).toContain('Observation off')
    expect(markup).toContain('Not capturing')
    expect(markup).toContain('Capture is off: accept the notice first.')
    expect(openingTag(markup, 'pause-observation')).toContain('aria-disabled="true"')
    expect(click(off, 'pause-observation')).toEqual([])
  })

  test('a declined notice keeps observation off and names why', () => {
    const declined = opened(run(initial, { type: 'DECLINE_NOTICE' }))
    expect(html(declined)).toContain('Capture is off: notice declined.')
    expect(html(declined)).toContain('Observation off')
  })

  test('meeting status is independent of screen pause and resume', () => {
    const meetingText = (state: State): string[] =>
      flatten(<DesktopScreen state={state} />)
        .filter((el) => el.type === 'span')
        .map((el) => textOf(el.props.children as ReactNode))
        .filter((text) => text.startsWith('Meeting:'))
    expect(meetingText(active)).toEqual(['Meeting: off, needs per-meeting consent'])
    const granted = opened(run(enrolled, { type: 'GRANT_MEETING_CONSENT', meetingId: 'zoom-kestrel' }))
    const denied = opened(run(enrolled, { type: 'DENY_MEETING_CONSENT', meetingId: 'zoom-kestrel' }))
    expect(meetingText(granted)).toEqual(['Meeting: consented for this meeting'])
    expect(meetingText(denied)).toEqual(['Meeting: declined'])
    expect(meetingText(run(granted, { type: 'PAUSE_OBSERVATION' }))).toEqual(['Meeting: consented for this meeting'])
    expect(meetingText(run(granted, { type: 'PAUSE_OBSERVATION' }, { type: 'RESUME_OBSERVATION' }))).toEqual(['Meeting: consented for this meeting'])
    expect(meetingText(run(denied, { type: 'PAUSE_OBSERVATION' }, { type: 'RESUME_OBSERVATION' }))).toEqual(['Meeting: declined'])
    expect(html(granted)).toContain('Resume applies to screen observation only.')
  })

  test('only an Employee observes their own work: other people get a read-only line and no controls', () => {
    const external = run(enrolled, { type: 'SELECT_ACTOR', personId: 'daniel' })
    const markup = html({ ...external, ui: { ...external.ui, overlay: 'companion' } })
    expect(markup).toContain('Only an Employee observes their own work.')
    expect(hidden(markup, 'pause-observation')).toBe(true)
    expect(hidden(markup, 'my-privacy-link')).toBe(true)
    expect(markup).not.toContain('Observation active')
    expect(markup).not.toContain('Meeting:')
  })

  test('the menu opens under the tray: box [950,28,310,232]', () => {
    const box = DESKTOP.companionMenu
    expect(box.x + box.width).toBe(1260)
    expect(box.y).toBe(28)
    expect(DESKTOP.trayIcon.x).toBeGreaterThan(box.x)
    expect(DESKTOP.trayIcon.x).toBeLessThan(box.x + box.width)
  })
})

describe('excluded-window moment', () => {
  const excluded = run(enrolled, { type: 'SET_FOREGROUND', window: 'excluded' })

  test('the window body is blank and the cue sits below it, never over its body', () => {
    const props: ProductProps = { state: excluded }
    const window = byAnchor(props, 'excluded-window')
    const inside = flatten(window.props.children as ReactNode)
    expect(textOf(window.props.children as ReactNode)).toBe('Private window')
    expect(inside.filter((el) => el.type === 'img' || el.type === 'svg' || el.type === 'canvas')).toEqual([])
    expect(inside.some((el) => el.props['data-film-anchor'] === 'excluded-cue')).toBe(false)
    expect(textOf(byAnchor(props, 'excluded-cue').props.children as ReactNode)).toBe('Excluded window — not captured')
    const { window: win, cue } = EXCLUDED
    expect(cue.y).toBeGreaterThanOrEqual(win.y + win.height)
    expect(cue.x).toBe(win.x)
    const markup = html(excluded)
    expect(openingTag(markup, 'excluded-window')).toContain(`left:${win.x}px;top:${win.y}px;width:${win.width}px;height:${win.height}px`)
    expect(openingTag(markup, 'excluded-cue')).toContain(`top:${cue.y}px`)
  })

  test('the title bar uses neutral outlined traffic circles centred at x20, x40 and x60', () => {
    const markup = html(excluded)
    for (const left of [14, 34, 54]) expect(markup).toContain(`left:${left}px;top:13px;width:12px;height:12px`)
    expect(count(markup, 'border border-trace bg-transparent')).toBe(3)
    expect(markup.toLowerCase()).not.toMatch(/#ff5f56|#ffbd2e|#27c93f/)
  })

  test('the cue never animates', () => {
    const cueTag = openingTag(html(excluded, filmAt(2)), 'excluded-cue')
    expect(cueTag).not.toMatch(/animate|transition/)
  })
})

describe('no cyan and no network', () => {
  const states = [initial, enrolled, active, paused, run(active, { type: 'SET_FOREGROUND', window: 'excluded' })]

  test('no state renders the execution cyan', () => {
    for (const state of states) {
      const markup = html(state).toLowerCase()
      expect(markup).not.toContain('--arc')
      expect(markup).not.toContain('2fd8ff')
      expect(markup).not.toContain('cyan')
    }
  })

  test('nothing refers to a remote host, and every image is a bundled asset', () => {
    for (const tab of APP_TAB_IDS) {
      const state = run(enrolled, { type: 'SELECT_APP_TAB', tab })
      const markup = html(state)
      expect(markup).not.toMatch(/https?:\/\/(?!www\.w3\.org\/2000\/svg)/)
      for (const src of markup.matchAll(/<img[^>]*src="([^"]*)"/g)) expect(src[1]).not.toMatch(/^(https?:)?\/\//)
    }
  })
})

describe('APP-11 browser frame', () => {
  test('six tabs in order, each with a mark and only its fictional .example host', () => {
    const markup = html(initial)
    expect(APP_TABS.map((tab) => tab.title)).toEqual(['Gmail', 'NetSuite', 'AP Exceptions Tracker', 'Slack', 'Zoom', 'HubSpot'])
    expect(APP_TABS.map((tab) => tab.host)).toEqual(['mail.example', 'erp.example', 'sheets.example', 'chat.example', 'meeting.example', 'crm.example'])
    expect(APP_TABS.map((tab) => tab.id)).toEqual([...APP_TAB_IDS])
    const positions = APP_TABS.map((tab) => markup.indexOf(`>${tab.title}</span>`))
    expect(positions.every((position) => position > 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    for (const tab of APP_TABS) {
      const state = run(initial, { type: 'SELECT_APP_TAB', tab: tab.id })
      expect(html(state)).toContain(`<span class="type-data truncate">${tab.host}</span>`)
    }
  })

  test.each(APP_TABS.map((tab) => [tab.id, tab.title] as const))('selecting %s shows its view and only its view', (id, title) => {
    expect(click(initial, `tab-${id}`)).toEqual([{ type: 'SELECT_APP_TAB', tab: id }])
    const markup = html(run(initial, { type: 'SELECT_APP_TAB', tab: id }))
    expect(count(markup, 'data-app-view=')).toBe(1)
    expect(markup).toContain(`data-app-view="${id}"`)
    expect(markup).toContain(`aria-label="${title} view"`)
    expect(count(markup, 'aria-selected="true"')).toBe(1)
    expect(openingTag(markup, `tab-${id}`)).toContain('aria-selected="true"')
  })

  test('the active tab is clear in grayscale: white fill, 2px signal rail, semibold', () => {
    const markup = html(initial)
    const tag = openingTag(markup, 'tab-gmail')
    expect(tag).toContain('bg-surface')
    expect(tag).toContain('font-semibold')
    expect(markup).toContain('h-[2px] bg-signal')
    expect(count(markup, 'h-[2px] bg-signal')).toBe(1)
    expect(openingTag(markup, 'tab-netsuite')).toContain('text-muted-foreground')
    expect(openingTag(markup, 'tab-netsuite')).not.toContain('font-semibold')
  })

  test('Back is aria-disabled with a reason until a tab was left behind; Forward and Reload stay disabled', () => {
    const first = html(initial)
    expect(first).toContain('aria-label="Back" aria-disabled="true" title="No earlier view"')
    expect(first).toContain('No earlier view')
    expect(first).toContain('aria-label="Forward" aria-disabled="true"')
    expect(first).toContain('aria-label="Reload" aria-disabled="true"')

    const visited = run(initial, { type: 'SELECT_APP_TAB', tab: 'netsuite' })
    const second = html(visited)
    expect(second).toContain('aria-label="Back" title="Back"')
    expect(second).not.toContain('No earlier view')
    const dispatched: Action[] = []
    const onBack = flatten(<DesktopScreen state={visited} dispatch={(a) => dispatched.push(a)} />).find((el) => el.props['aria-label'] === 'Back')?.props.onClick as (() => void) | undefined
    onBack?.()
    expect(dispatched).toEqual([{ type: 'BROWSER_BACK' }])
    expect(html(run(visited, { type: 'BROWSER_BACK' }))).toContain('data-app-view="gmail"')
  })

  test('switching tabs changes only presentation, never invoice or business data', () => {
    const next = run(enrolled, { type: 'SELECT_APP_TAB', tab: 'tracker' })
    const business = (state: State) => ({
      phase: state.phase,
      consent: state.consent,
      commitment: state.commitment,
      approval: state.approval,
      readback: state.readback,
      job: state.job,
      incident: state.incident,
      agent: state.agent,
      evaluations: state.evaluations,
      audit: state.audit,
    })
    expect(business(next)).toEqual(business(enrolled))
    expect(next.ui.activeTab).toBe('tracker')
  })
})

describe('app view skins', () => {
  const views = APP_TAB_IDS.map((tab) => html(run(initial, { type: 'SELECT_APP_TAB', tab })))

  test('each skin is distinct from the others', () => {
    expect(new Set(views.map((view) => view.slice(view.indexOf('data-app-view')))).size).toBe(APP_TAB_IDS.length)
  })

  test('the HubSpot view shows the blocked draft without unrelated deal facts', () => {
    const view = views[APP_TAB_IDS.indexOf('hubspot')] ?? ''
    expect(view).toContain('12% discount')
    expect(view).toContain('Requires Tier 3 approval - Daniel Okafor')
    expect(view).toContain('Action blocked until authorized')
    expect(view).not.toMatch(/INV-|\$\d|hatch/i)
  })
})

describe('film determinism', () => {
  test('equal state and frame render equal markup', () => {
    expect(html(active, filmAt(3))).toBe(html(active, filmAt(3)))
    expect(html(paused)).toBe(html(paused))
  })

  test('the menu fades and slides 4px over its first frames while anchored boxes do not move', () => {
    const mid = html(active, filmAt(1))
    const rest = html(active, filmAt(10))
    expect(mid).toMatch(/opacity:0\.\d+;transform:translateY\(-[\d.]+px\)/)
    expect(rest).not.toContain('translateY')
    for (const name of ['companion-menu']) expect(openingTag(mid, name)).toBe(openingTag(rest, name))
    expect(openingTag(mid, 'pause-observation')).toMatch(/transform:translateY\([\d.]+px\)/)
    expect(openingTag(rest, 'pause-observation')).not.toContain('transform')
  })

  test('a film never carries a CSS transition or animation', () => {
    for (const state of [initial, active, paused]) {
      const markup = html(state, filmAt(2))
      expect(markup).not.toMatch(/transition|animate-/)
    }
  })

  test('reduced motion draws the menu at rest at once', () => {
    const markup = html(active, { ...filmAt(1), reducedMotion: true })
    expect(markup).not.toContain('translateY')
  })
})
