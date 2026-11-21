import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import { act } from '@/state/test-helpers'
import { TeachScreen } from './TeachScreen'
import { refusal } from './discovery'

const start = act(reconstruct('ST12'), { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'CONTAIN_INCIDENT', caseIds: ['INV-48231', 'INV-48233', 'INV-48236'] }, { type: 'SELECT_ACTOR', personId: 'elena' }, { type: 'COMPLETE_CASE_MANUALLY', caseId: 'INV-48231' }, { type: 'OPEN_SCREEN', screen: 'SC27' })
const draft = act(start, { type: 'SET_TEACH_ANSWER', answer: 'yes' }, { type: 'LINK_TEACH_RULE', linked: true })
const html = (state: typeof start) => renderToStaticMarkup(<TeachScreen state={state} />)

describe('SC27 correction', () => {
  test('requires an explicit answer and source before saving', () => {
    expect(html(start)).toContain('Is the $38.50 handling fee part of the invoice total')
    expect(html(start)).toContain(refusal(start, { type: 'TEACH' })!)
    expect(refusal(draft, { type: 'TEACH' })).toBeNull()
    expect(html(draft)).toContain('Billed on top of subtotal; within approved terms')
  })
  test('preserves the draft across navigation', () => {
    const returned = act(draft, { type: 'OPEN_SCREEN', screen: 'SC26' }, { type: 'OPEN_SCREEN', screen: 'SC27' })
    expect(returned.ui.incident.answer).toBe('yes')
    expect(returned.ui.incident.ruleLinked).toBe(true)
    expect(html(returned)).toContain('Kestrel Components layout v2 only')
  })
})
