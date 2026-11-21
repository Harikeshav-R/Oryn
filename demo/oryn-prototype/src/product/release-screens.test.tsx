import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import { act } from '@/state/test-helpers'
import { REGRESSION_PASS_RESULTS } from '@/data/regression'
import { ReleaseScreen } from './ReleaseScreen'
import { refusal } from './discovery'
import { RELEASE_ANCHOR_RECTS } from './release-layout'

const review = act(reconstruct('ST14'), { type: 'OPEN_SCREEN', screen: 'SC29' })
const passed = act(review, { type: 'RUN_REGRESSION' }, { type: 'COMPLETE_REGRESSION', results: REGRESSION_PASS_RESULTS })
const limited = act(passed, { type: 'LIMITED_RELEASE' })
const verified = act(limited, ...[0, 1, 2].map((index) => ({ type: 'VERIFY_COHORT_OUTCOME' as const, index, result: 'verified' as const })))
const expanded = act(verified, { type: 'EXPAND_RELEASE' })
const closed = act(expanded, { type: 'CLOSE_INCIDENT' })
const html = (state: typeof review) => renderToStaticMarkup(<ReleaseScreen state={state} />).replaceAll('<!-- -->', '')

describe('SC29 release', () => {
  test('requires passing regression and names its scope', () => {
    const pending = html(review)
    expect(pending).toContain(refusal(review, { type: 'LIMITED_RELEASE' })!)
    const markup = html(passed)
    for (const label of ['Kestrel Components invoices only', 'AP East only', '34 scenarios', '28 Passed', '6 Passed — Expected Safe Escalation', '0 Failed', 'Approve limited release']) expect(markup).toContain(label)
  })
  test('counts independent outcomes and requires expansion before closure', () => {
    expect(html(limited)).toContain('First 0/3 Verified Complete')
    expect(html(limited)).toContain(refusal(limited, { type: 'EXPAND_RELEASE' })!)
    expect(html(limited)).toContain(refusal(limited, { type: 'CLOSE_INCIDENT' })!)
    const one = act(limited, { type: 'VERIFY_COHORT_OUTCOME', index: 1, result: 'verified' })
    expect(html(one)).toContain('First 1/3 Verified Complete')
    expect(html(verified)).toContain('First 3/3 Verified Complete')
    expect(html(expanded)).toContain('Owner decision recorded')
  })
  test('keeps outcome evidence separate and explains owner and stop restrictions', () => {
    const second = act(limited, { type: 'VERIFY_COHORT_OUTCOME', index: 1, result: 'verified' }, { type: 'SET_INCIDENT_VIEW', outcome: 1 })
    expect(html(second)).toContain('Independent readback · outcome 2 of 3')
    expect(html(second).match(/data-glyph="verified"/g)).toHaveLength(1)
    const approver = act(verified, { type: 'SELECT_ACTOR', personId: 'daniel' })
    expect(html(approver)).toContain(refusal(approver, { type: 'EXPAND_RELEASE' })!)
    const stopped = act(limited, { type: 'VERIFY_COHORT_OUTCOME', index: 0, result: 'unknown' })
    expect(html(stopped)).toContain(refusal(stopped, { type: 'EXPAND_RELEASE' })!)
  })
  test('keeps the expansion and closure controls inside the watch panel without overlap', () => {
    const panel = RELEASE_ANCHOR_RECTS['verified-three']
    const expand = RELEASE_ANCHOR_RECTS['expand-release']
    const close = RELEASE_ANCHOR_RECTS['close-incident']
    for (const rect of [expand, close]) {
      expect(rect.x).toBeGreaterThanOrEqual(panel.x)
      expect(rect.y).toBeGreaterThanOrEqual(panel.y)
      expect(rect.x + rect.width).toBeLessThanOrEqual(panel.x + panel.width)
      expect(rect.y + rect.height).toBeLessThanOrEqual(panel.y + panel.height)
    }
    expect(expand.y + expand.height).toBeLessThanOrEqual(close.y)
  })
  test('keeps step-specific anchors present and hidden where unavailable', () => {
    const tag = (markup: string, name: string) => markup.match(new RegExp(`<[^>]+data-film-anchor="${name}"[^>]*>`))?.[0] ?? ''
    expect(tag(html(review), 'cohort-outcome-1')).toContain('display:none')
    expect(tag(html(limited), 'cohort-outcome-1')).not.toContain('display:none')
    expect(tag(html(limited), 'affected-case-history')).toContain('display:none')
    expect(tag(html(closed), 'affected-case-history')).not.toContain('display:none')
    expect(limited.theme).toBe('light')
    const denied = act(limited, { type: 'SELECT_ACTOR', personId: 'priya' })
    expect(html(denied)).toContain('Not available')
  })
  test('film decisions settle over 150 ms and reduced motion is immediate', () => {
    const samples = [
      [limited, 'LIMITED_RELEASE'],
      [verified, 'VERIFY_COHORT_OUTCOME'],
      [expanded, 'EXPAND_RELEASE'],
      [closed, 'CLOSE_INCIDENT'],
    ] as const
    for (const [state, action] of samples) {
      const render = (frame: number, reducedMotion: boolean) => renderToStaticMarkup(<ReleaseScreen state={state} film={{ frame, reducedMotion, lastApplied: (type) => type === action ? 10 : null }} />)
      expect(render(10, false)).toContain('opacity:0.65')
      expect(render(15, false)).not.toContain('opacity:0.65')
      expect(render(10, true)).not.toContain('opacity:0.65')
    }
  })
  test('retains affected history without inventing watched case identities', () => {
    const markup = html(closed)
    for (const label of ['INC-0042 · Closed', 'Repaired - Validated', 'Affected-case history', 'INV-48231', 'INV-48233', 'INV-48236']) expect(markup).toContain(label)
    expect(new Set(markup.match(/INV-\d+/g))).toEqual(new Set(['INV-48231', 'INV-48233', 'INV-48236']))
    expect(markup).not.toMatch(/\b\d{1,2}:\d{2}\b/)
    expect(markup).not.toContain('text-arc')
  })
})
