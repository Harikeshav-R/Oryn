import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import { act } from '@/state/test-helpers'
import { IncidentScreen } from './IncidentScreen'

const open = act(reconstruct('ST12'), { type: 'SELECT_ACTOR', personId: 'marcus' })
const contained = act(open, { type: 'CONTAIN_INCIDENT', caseIds: ['INV-48231', 'INV-48233', 'INV-48236'] })
const markup = (state: typeof open) => renderToStaticMarkup(<IncidentScreen state={state} />)

describe('Incident Center', () => {
  test('shows the three cases as unavailable before containment and paused after it', () => {
    const before = markup(open)
    const after = markup(contained)
    expect((before.match(/Verification unavailable/g) ?? []).length).toBe(3)
    expect((after.match(/data-glyph="paused"/g) ?? []).length).toBe(3)
    expect(before).not.toContain('data-glyph="paused"')
    for (const id of ['INV-48231', 'INV-48233', 'INV-48236']) expect(after).toContain(id)
    expect(after).toContain('Only these 3 cases are paused')
    expect(after).not.toContain('text-arc')
  })
  test('keeps the evidence arithmetic and unconfirmed hypothesis explicit', () => {
    const html = markup(contained)
    for (const value of ['$4,213.50', '$4,175.00', '$38.50', 'Expected: verifiable invoice total', 'Actual: cannot verify', 'Supplier document format change — unconfirmed']) expect(html).toContain(value)
    expect(html).not.toContain('Confirmed cause')
  })
  test('does not invent amounts for other cases', () => {
    const other = act(contained, { type: 'SELECT_CASE', caseId: 'INV-48233' }, { type: 'SET_INCIDENT_VIEW', evidence: true })
    const html = markup(other)
    expect(html).toContain('No amount recorded')
    expect(html).toContain('—')
  })
  test('reveals containment and paused glyphs after the wipe in sequence', () => {
    const frame = (n: number) => renderToStaticMarkup(<IncidentScreen state={contained} film={{ frame: n, reducedMotion: false, lastApplied: (type) => type === 'CONTAIN_INCIDENT' ? 10 : null }} />)
    expect(frame(21)).not.toContain('data-glyph="contained"')
    expect(frame(22)).toContain('data-glyph="contained"')
    expect((frame(22).match(/data-glyph="paused"/g) ?? []).length).toBe(1)
    expect((frame(25).match(/data-glyph="paused"/g) ?? []).length).toBe(2)
    expect((frame(27).match(/data-glyph="paused"/g) ?? []).length).toBe(3)
  })
  test('requires manual completion before teaching', () => {
    expect(markup(contained)).toContain('INV-48231 must be completed manually before the correction is taught.')
    const done = act(contained, { type: 'SELECT_ACTOR', personId: 'elena' }, { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48231' })
    expect(markup(done)).not.toContain('INV-48231 must be completed manually before the correction is taught.')
  })
})
