import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { reconstruct } from '@/state'
import { act } from '@/state/test-helpers'
import { CommandScreen } from './CommandScreen'

const state = act(reconstruct('ST22'), { type: 'OPEN_SCREEN', screen: 'SC33' })
const html = (s: typeof state) => renderToStaticMarkup(<CommandScreen state={s} />).replaceAll('<!-- -->', '')
describe('command center', () => {
  test('separates job outcomes from the incident and release', () => {
    const output = html(state)
    for (const text of ['JOB-0117', '8 Verified Complete', '2 Escalated', '0 Approval Required', '1 Outcome Unknown', '1 contained incident', 'INC-0042 · Closed', 'v1.1 · Expanded']) expect(output).toContain(text)
    expect(output).not.toContain('11 successful')
  })
  test('earlier snapshot remains before approval', () => {
    const output = html(act(state, { type: 'SET_COMMAND_VIEW', snapshot: 'before' }))
    for (const text of ['Before approval', '7 Verified Complete', '1 Approval Required']) expect(output).toContain(text)
  })
  test('x-ray states scope, privacy and unestablished eligibility', () => {
    const output = html(act(state, { type: 'SET_COMMAND_VIEW', tab: 'xray' }))
    for (const text of ['Scope', 'Evidence quality', 'Privacy', 'At least 5 participating enrolled employees required', 'Not established']) expect(output).toContain(text)
    expect(output).not.toContain('ROI')
  })
})

test('switches visible panel and denies employee access', () => {
  const before = html(state)
  const after = html(act(state, { type: 'SET_COMMAND_VIEW', tab: 'xray' }))
  const tag = (markup: string, name: string) => markup.match(new RegExp(`<[^>]*data-film-anchor="${name}"[^>]*>`))?.[0] ?? ''
  expect(tag(before, 'cc-xray')).toContain('display:none')
  expect(tag(after, 'cc-xray')).not.toContain('display:none')
  expect(tag(after, 'cc-verified')).toContain('display:none')
  expect(html(act(state, { type: 'SELECT_ACTOR', personId: 'priya' }))).toContain('Not available:')
})