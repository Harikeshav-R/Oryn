import { describe, expect, test } from 'bun:test'
import { audit, type Dump } from './audit-rules'
import type { FrameRecord } from './audit-harvest'

const record = (patch: Partial<FrameRecord>): FrameRecord => ({ text: '', cyan: [], executing: 0, rows: [], anchors: [], hiddenAnchors: [], badAnchors: [], anchorText: {}, captions: [], ...patch })

const dumpOf = (clipId: string, ranges: readonly { from: number; to: number; record: FrameRecord }[], extra: Partial<Dump['clips'][number]> = {}): Dump => ({
  clips: [{ cut: 'hackathon', clipId, frames: Math.max(...ranges.map((range) => range.to)) + 1, filmStartFrame: 0, theme: 'light', ranges, clickTargets: [], ...extra }],
})

const rules = (dump: Dump): string[] => [...new Set(audit(dump).map((finding) => finding.rule))].sort()

const SUMMARY = (counts: string): string => `JOB-0117 | ${counts.split('/').map((n, i) => `${n} ${['Verified Complete', 'Escalated', 'Approval Required', 'Outcome Unknown'][i]}`).join(' · ')} | Partially Complete`

describe('BOB-13 audit rules reject the contradictions they exist for', () => {
  test('a frame that matches the fixtures produces no finding', () => {
    expect(audit(dumpOf('hk-h4f-job', [{ from: 0, to: 4, record: record({ text: SUMMARY('7/2/1/1') }) }]))).toEqual([])
  })

  test('cyan outside an execution flag, or on a stopped run, fails', () => {
    const stray = record({ text: 'Partially Complete', cyan: [{ element: 'div.bg-arc', property: 'background-color', justified: false }] })
    expect(rules(dumpOf('hk-h4f-job', [{ from: 0, to: 0, record: stray }]))).toEqual(['CYAN-1', 'CYAN-2', 'CYAN-3'])
  })

  test('8/2/0/1 needs independent readback evidence; an approval is not a readback', () => {
    expect(rules(dumpOf('hk-h4f-job', [{ from: 0, to: 0, record: record({ text: SUMMARY('8/2/0/1') }) }]))).toEqual(['NUM-1'])
    const approvedOnly = record({ text: `${SUMMARY('8/2/0/1')} | Approved by Daniel Okafor · awaiting independent verification` })
    expect(audit(dumpOf('hk-h4f-job', [{ from: 0, to: 0, record: approvedOnly }])).map((finding) => finding.detail)).toContain('approval counted as verified')
    const verified = record({ text: `${SUMMARY('8/2/0/1')} | Independent NetSuite readback: | Matched - Variance Approved` })
    expect(audit(dumpOf('hk-h4f-job', [{ from: 0, to: 0, record: verified }]))).toEqual([])
    // Evidence earlier in the clip keeps later frames verified.
    expect(audit(dumpOf('hk-h4f-job', [{ from: 0, to: 0, record: verified }, { from: 1, to: 1, record: record({ text: SUMMARY('8/2/0/1') }) }]))).toEqual([])
  })

  test('a later invoice outcome on the D1 day fails, a context row does not', () => {
    const later = record({ rows: [{ id: 'INV-48220', text: 'INV-48220 Northgate Pallets ERP submit timed out Outcome Unknown' }] })
    expect(rules(dumpOf('hk-h4e-simulate', [{ from: 48, to: 48, record: later }]))).toEqual(['ID-3'])
    const context = record({ rows: [{ id: 'INV-48203', text: 'INV-48203 Brightwater Industrial —' }] })
    expect(audit(dumpOf('hk-h4e-simulate', [{ from: 48, to: 48, record: context }]))).toEqual([])
  })

  test('obsolete counts and a wrong variance fail', () => {
    expect(rules(dumpOf('hk-h4h-breadth', [{ from: 0, to: 0, record: record({ text: '33 scenarios | 27 Passed' }) }]))).toEqual(['NUM-3', 'TXT-1'])
    expect(rules(dumpOf('hk-h4f-job', [{ from: 0, to: 0, record: record({ text: 'Variance $440.00 / 2.54%' }) }]))).toEqual(['NUM-2'])
  })

  test('a caption, an unreachable click target and a row amount that is not a fixture fail', () => {
    expect(rules(dumpOf('hk-h4f-job', [{ from: 0, to: 0, record: record({ captions: ['subtitle-strip div: Oryn watches'] }) }]))).toEqual(['CAP-1'])
    expect(rules(dumpOf('hk-h4f-job', [{ from: 0, to: 9, record: record({}) }], { clickTargets: [{ frame: 5, target: 'start-job' }] }))).toEqual(['ANC-2'])
    const wrong = record({ rows: [{ id: 'INV-48219', text: 'INV-48219 Brightwater Industrial $18,000.00 PO-1042' }] })
    expect(rules(dumpOf('hk-h4f-job', [{ from: 0, to: 0, record: wrong }]))).toEqual(['ID-2'])
  })
})
