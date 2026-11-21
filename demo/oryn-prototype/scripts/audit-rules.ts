import { readFile } from 'node:fs/promises'
import { INCIDENT } from '@/data/incident'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { INVOICE_CASES, formatCents } from '@/data/invoices'
import { SUPPLIERS, supplierName } from '@/data/people'
import { KESTREL_DOCUMENT } from '@/data/work-records'
import type { ClipDump, FrameRecord } from './audit-harvest'

/**
 * BOB-13 rules. They judge the per-frame dump written by `audit-harvest.ts` against the product
 * facts of inventory DAT-01 to DAT-13 and the resolved decisions (section 4). A rule never
 * loosens to make a frame pass: a finding names the clip, the frame range and the rule.
 *
 * `bun run scripts/audit-rules.ts [--in <dump>]` prints the matrix and exits 1 on any finding.
 */

export interface Finding {
  readonly rule: string
  readonly clipId: string
  readonly from: number
  readonly to: number
  readonly detail: string
}

export interface Dump {
  readonly clips: readonly ClipDump[]
}

export const RULES: Readonly<Record<string, string>> = {
  'CYAN-1': 'Arc cyan is drawn only inside an execution-flagged element (running simulator, job or regression).',
  'CYAN-2': 'No cyan and no execution flag while the frame states a stopped run (Partially Complete, Run complete, Evaluation complete).',
  'CYAN-3': 'A frame that says Running draws cyan; a frame with cyan says Running or Queued (a started job).',
  'CYAN-4': 'Cyan is in the same state on the last frame of a clip and the first frame of the next contiguous clip.',
  'CAP-1': 'No product caption, subtitle strip or caption element is drawn by the product layer.',
  'TXT-1': 'No obsolete or forbidden copy: Completed with exceptions, 33 scenarios/tests, 27 Passed, 60 fps, Retry, a bare Resubmit, prototype or live disclosure words.',
  'ID-1': 'Every invoice ID shown is a fixture ID (DAT-02, DAT-03, DAT-07).',
  'ID-2': 'Every single-invoice row keeps its fixture supplier, PO and amounts (INV-48233 and INV-48236 never show an amount).',
  'ID-3': 'Before JOB-0117 starts, no invoice row states a job outcome (Escalated, Approval Required, Outcome Unknown, Verified Complete, Held); the ST01 problem montage is exempt.',
  'NUM-1': 'JOB-0117 counts are 7+2+1+1=11 before approval and 8+2+0+1=11 only with independent readback evidence in the frame; an approval never counts as verified.',
  'NUM-2': 'INV-48219 shows Invoice $18,420.00, PO $17,980.00, variance $440.00 / 2.45%.',
  'NUM-3': 'Suite counts are 0+0+0 (not run), 21+6+1, 22+6+0 or 28+6+0 on a stopped suite; suites are 28 or 34 scenarios; 27/28 only as the v0.1 intended-outcome count.',
  'NUM-4': 'Handling fee is $38.50 (invoice $4,213.50 = $4,175.00 + $38.50); INC-0042 has exactly 3 affected cases; cohort readbacks are N/3 and 3/3 only with all three rows verified.',
  'ANC-1': 'No visible anchor rectangle leaves the 1280x720 canvas or has no area.',
  'ANC-2': 'Every click target anchor is visible on the click landing frame or the frame before it.',
  'ANC-3': 'The anchors the BOB-12 ledger names for the stage are visible on their frames with the fixture text.',
  'CONT-1': 'hk-h4f-job ends on the exact view hk-h4g-heal starts on.',
}

const JOB_OUTCOME_WORDS = /Escalated|Approval Required|Outcome Unknown|Verified Complete|\bHeld\b/
const FORBIDDEN: readonly (readonly [string, RegExp])[] = [
  ['Completed with exceptions', /Completed with exceptions/],
  ['33 scenarios/tests/Passed', /\b33 (?:scenarios|tests|Passed)\b/],
  ['27 Passed', /\b27 Passed\b/],
  ['60 fps', /\b60 ?fps\b/i],
  ['Retry', /\bRetry\b/],
  ['bare Resubmit', /\bResubmit(?! unavailable|ion unavailable)\b/],
  ['disclosure word', /\b(?:prototype|fictional|disclaimer|real data|in production)\b|\blive\b/i],
]
const PRE_JOB = new Set(['hk-h4a-enroll', 'hk-h4b-observe', 'hk-h4c-playbook', 'hk-h4d-agent', 'hk-h4e-simulate', 'lk-l4-privacy', 'lk-l5-observe', 'lk-l6-discover', 'lk-l7-create', 'lk-l8-simulate'])

const SUPPLIER_NAMES: readonly string[] = SUPPLIERS.map((supplier) => supplier.name)

interface Fact {
  readonly supplier: string
  readonly po: string | null
  /** Amounts this invoice may show, as display strings; null amounts never appear. */
  readonly amounts: ReadonlySet<string>
}

function buildFacts(): ReadonlyMap<string, Fact> {
  const facts = new Map<string, Fact>()
  for (const row of INVOICE_CASES) {
    const amounts = new Set<string>([formatCents(row.amountCents)])
    if (row.poAmountCents != null) {
      amounts.add(formatCents(row.poAmountCents))
      amounts.add(formatCents(Math.abs(row.amountCents - row.poAmountCents)))
    }
    facts.set(row.invoice, { supplier: row.supplier, po: row.po, amounts })
  }
  for (const demo of DEMONSTRATIONS) facts.set(demo.invoice, { supplier: supplierName(demo.supplierId), po: null, amounts: new Set() })
  const kestrel = new Set([formatCents(KESTREL_DOCUMENT.totalCents), formatCents(KESTREL_DOCUMENT.subtotalCents), formatCents(KESTREL_DOCUMENT.handlingFeeCents)])
  facts.set(KESTREL_DOCUMENT.invoice, { supplier: KESTREL_DOCUMENT.supplier, po: KESTREL_DOCUMENT.po, amounts: kestrel })
  for (const affected of INCIDENT.affectedCases) {
    if (!facts.has(affected.id)) facts.set(affected.id, { supplier: supplierName('kestrel'), po: null, amounts: new Set() })
  }
  return facts
}

const norm = (text: string): string => text.replace(/\s*\n\s*/g, ' | ')

/** What an earlier frame of the same clip already showed: a verified readback stays verified. */
interface Seen {
  verified: boolean
}

type Check = (record: FrameRecord, clip: ClipDump, seen: Seen) => readonly string[]

/** Checks that read one frame record. */
const FRAME_RULES: readonly (readonly [string, Check])[] = (() => {
  const facts = buildFacts()
  return [
    ['CYAN-1', (record) => record.cyan.filter((hit) => !hit.justified).map((hit) => `${hit.element} draws cyan through ${hit.property} outside an execution flag`)],
    [
      'CYAN-2',
      (record) => (/Partially Complete|Run complete|Evaluation complete/.test(record.text) && (record.cyan.length > 0 || /\bRunning\b/.test(record.text)) ? ['a stopped run still draws cyan or says Running'] : []),
    ],
    [
      'CYAN-3',
      (record) => {
        const running = /\bRunning\b/.test(record.text)
        if (running && record.cyan.length === 0) return ['text says Running but no cyan is drawn']
        if (!running && !/\bQueued\b/.test(record.text) && record.cyan.length > 0) return ['cyan is drawn while neither Running nor Queued is shown']
        return []
      },
    ],
    ['CAP-1', (record) => record.captions.map((caption) => `caption element: ${caption}`)],
    [
      'TXT-1',
      (record) => FORBIDDEN.flatMap(([name, pattern]) => (pattern.test(record.text) ? [`forbidden copy: ${name}`] : [])),
    ],
    [
      'ID-1',
      (record) => [...new Set(record.text.match(/INV-\d{5}/g) ?? [])].filter((id) => !facts.has(id)).map((id) => `${id} is not a fixture invoice`),
    ],
    [
      'ID-2',
      (record) =>
        record.rows.flatMap((row) => {
          const fact = facts.get(row.id)
          if (!fact) return []
          const problems: string[] = []
          for (const amount of row.text.match(/\$[\d,]+\.\d\d/g) ?? []) if (!fact.amounts.has(amount)) problems.push(`${row.id} row shows ${amount}`)
          for (const name of SUPPLIER_NAMES) if (row.text.includes(name) && name !== fact.supplier) problems.push(`${row.id} row names ${name}, not ${fact.supplier}`)
          for (const po of row.text.match(/PO-\d{4}/g) ?? []) if (po !== fact.po) problems.push(`${row.id} row shows ${po}, not ${String(fact.po)}`)
          return problems
        }),
    ],
    [
      'ID-3',
      (record, clip) => (PRE_JOB.has(clip.clipId) ? record.rows.filter((row) => JOB_OUTCOME_WORDS.test(row.text)).map((row) => `${row.id} states a job outcome before the job: ${row.text.slice(0, 80)}`) : []),
    ],
    [
      'NUM-1',
      (record, _clip, seen) => {
        const text = norm(record.text)
        const problems: string[] = []
        const summary = /(\d+) Verified Complete · (\d+) Escalated · (\d+) Approval Required · (\d+) Outcome Unknown/.exec(text)
        const evidence = /readback: \| Matched - Variance Approved|independently read back/.test(text)
        if (summary) {
          const counts = summary.slice(1, 5).map(Number)
          const key = counts.join('/')
          const total = counts.reduce((a, b) => a + b, 0)
          if (total === 11 && key !== '7/2/1/1' && key !== '8/2/0/1') problems.push(`counts ${key} sum to 11 but are neither 7/2/1/1 nor 8/2/0/1`)
          if (key === '8/2/0/1' && !evidence && !seen.verified) problems.push('8/2/0/1 shown without independent readback evidence in the frame or earlier in the clip')
          if (key === '7/2/1/1' && evidence) problems.push('7/2/1/1 shown after the independent readback evidence')
        }
        if (/awaiting independent verification/.test(text) && summary && summary.slice(1, 5).join('/') === '8/2/0/1') problems.push('approval counted as verified')
        for (const equation of text.matchAll(/(\d+) \+ (\d+) \+ (\d+) \+ (\d+) = (\d+)/g)) {
          const parts = equation.slice(1, 5).map(Number)
          const key = parts.join('/')
          if (parts.reduce((a, b) => a + b, 0) !== Number(equation[5]) || (key !== '7/2/1/1' && key !== '8/2/0/1')) problems.push(`equation ${equation[0]} is not a fixture snapshot`)
        }
        return problems
      },
    ],
    [
      'NUM-2',
      (record) => {
        const text = norm(record.text)
        const problems: string[] = []
        for (const variance of text.matchAll(/Variance \$([\d,]+\.\d\d) \/ ([\d.]+)%/g)) if (variance[1] !== '440.00' || variance[2] !== '2.45') problems.push(`variance ${variance[0]}`)
        if (/Invoice \$18,420\.00/.test(text) && /PO-1042 \$(?!17,980\.00)[\d,.]+/.test(text)) problems.push('PO-1042 amount is not $17,980.00')
        return problems
      },
    ],
    [
      'NUM-3',
      (record) => {
        const text = norm(record.text)
        const problems: string[] = []
        const running = /\bRunning\b/.test(text)
        const finished = new Set(['0/0/0', '21/6/1', '22/6/0', '28/6/0'])
        for (const triple of text.matchAll(/(\d+) Passed(?! —)[^\d]{0,6}(\d+) Passed — Expected Safe Escalation[^\d]{0,6}(\d+) Failed/g)) {
          const key = `${triple[1]}/${triple[2]}/${triple[3]}`
          if (!running && !finished.has(key)) problems.push(`suite counts ${key}`)
        }
        for (const size of text.matchAll(/\b(\d+) (?:scenarios|tests)\b/g)) if (size[1] !== '28' && size[1] !== '34') problems.push(`suite size ${size[0]}`)
        for (const ratio of text.matchAll(/\b(\d+)\/(\d+) intended outcomes correct/g)) {
          if (ratio[2] !== '28' && ratio[2] !== '34') problems.push(`intended outcomes ${ratio[0]}`)
          if (ratio[1] !== '27' && ratio[1] !== '28' && ratio[1] !== '34') problems.push(`intended outcomes ${ratio[0]}`)
        }
        return problems
      },
    ],
    [
      'NUM-4',
      (record) => {
        const text = norm(record.text)
        const problems: string[] = []
        for (const fee of text.matchAll(/Handling fee(?: \|)? \$([\d,]+\.\d\d)/g)) if (fee[1] !== '38.50') problems.push(`handling fee ${fee[0]}`)
        for (const cases of text.matchAll(/(\d+) affected cases/g)) if (cases[1] !== '3') problems.push(`${cases[0]}`)
        if (/\b3\/3 Verified Complete/.test(text)) {
          for (const id of INCIDENT.affectedCases.map((row) => row.id)) if (!new RegExp(`${id} \\| Verified Complete`).test(text)) problems.push(`3/3 shown but ${id} is not Verified Complete`)
        }
        return problems
      },
    ],
    ['ANC-1', (record) => record.badAnchors.map((name) => `anchor ${name} leaves the canvas or has no area`)],
  ]
})()

interface Slot {
  readonly clip: ClipDump
  readonly from: number
  readonly to: number
  readonly record: FrameRecord
}

const slots = (dump: Dump): Slot[] => dump.clips.flatMap((clip) => clip.ranges.map((range) => ({ clip, from: range.from, to: range.to, record: range.record })))

const recordAt = (clip: ClipDump, frame: number): FrameRecord | undefined => clip.ranges.find((range) => range.from <= frame && frame <= range.to)?.record

function mergeFindings(raw: readonly Finding[]): Finding[] {
  const merged: Finding[] = []
  for (const finding of raw) {
    const last = merged[merged.length - 1]
    if (last && last.rule === finding.rule && last.clipId === finding.clipId && last.detail === finding.detail && finding.from <= last.to + 1) merged[merged.length - 1] = { ...last, to: Math.max(last.to, finding.to) }
    else merged.push(finding)
  }
  return merged
}

const LEDGER_ANCHORS: readonly { clipId: string; from: number; to: number; anchors: readonly string[]; texts: Readonly<Record<string, string>> }[] = [
  { clipId: 'hk-h4g-heal', from: 0, to: 29, anchors: ['document-page', 'po-number', 'invoice-total', 'handling-fee'], texts: { 'po-number': 'PO-1051', 'invoice-total': '$4,213.50', 'handling-fee': '$38.50' } },
  { clipId: 'hk-h4b-observe', from: 30, to: 30, anchors: ['erp-bill', 'erp-po'], texts: {} },
  { clipId: 'hk-h4b-observe', from: 48, to: 48, anchors: ['tracker-grid', 'tracker-row-inv-48203', 'tracker-cell-inv-48203'], texts: {} },
]

/** Apply every rule to the dump. */
export function audit(dump: Dump): Finding[] {
  const raw: Finding[] = []
  const push = (rule: string, clipId: string, from: number, to: number, detail: string): void => void raw.push({ rule, clipId, from, to, detail })

  let seen: Seen = { verified: false }
  let seenClip = ''
  for (const slot of slots(dump)) {
    if (slot.clip.clipId !== seenClip) {
      seen = { verified: false }
      seenClip = slot.clip.clipId
    }
    for (const [rule, check] of FRAME_RULES) for (const detail of check(slot.record, slot.clip, seen)) push(rule, slot.clip.clipId, slot.from, slot.to, detail)
    if (/readback: \| Matched - Variance Approved|independently read back/.test(norm(slot.record.text))) seen.verified = true
  }

  for (const clip of dump.clips) {
    for (const target of clip.clickTargets) {
      const landing = Math.min(target.frame, clip.frames - 1)
      const visible = (frame: number): boolean => recordAt(clip, Math.max(frame, 0))?.anchors.includes(target.target) === true
      if (!visible(landing) && !visible(landing - 1)) push('ANC-2', clip.clipId, landing, landing, `click target ${target.target} is not visible at the landing frame or the frame before`)
    }
  }

  for (const expected of LEDGER_ANCHORS) {
    const clip = dump.clips.find((candidate) => candidate.clipId === expected.clipId)
    if (!clip) continue
    for (let frame = expected.from; frame <= expected.to; frame += 1) {
      const record = recordAt(clip, frame)
      if (!record) continue
      for (const name of expected.anchors) if (!record.anchors.includes(name)) push('ANC-3', clip.clipId, frame, frame, `anchor ${name} is not visible`)
      for (const [name, text] of Object.entries(expected.texts)) if (record.anchors.includes(name) && !(record.anchorText[name] ?? '').includes(text)) push('ANC-3', clip.clipId, frame, frame, `anchor ${name} reads "${record.anchorText[name] ?? ''}", expected ${text}`)
    }
  }

  for (const cut of ['hackathon', 'launch']) {
    const clips = dump.clips.filter((clip) => clip.cut === cut).sort((a, b) => a.filmStartFrame - b.filmStartFrame)
    clips.slice(0, -1).forEach((clip, index) => {
      const next = clips[index + 1]
      if (!next || next.filmStartFrame !== clip.filmStartFrame + clip.frames) return
      const end = recordAt(clip, clip.frames - 1)
      const start = recordAt(next, 0)
      if (!end || !start) return
      if (end.cyan.length > 0 !== start.cyan.length > 0) push('CYAN-4', next.clipId, 0, 0, `cyan is ${end.cyan.length > 0 ? 'on' : 'off'} at the end of ${clip.clipId} and ${start.cyan.length > 0 ? 'on' : 'off'} at the start of ${next.clipId}`)
      if (clip.clipId === 'hk-h4f-job' && next.clipId === 'hk-h4g-heal' && end.text !== start.text) push('CONT-1', next.clipId, 0, 0, 'the last frame of hk-h4f-job and the first frame of hk-h4g-heal show different text')
    })
  }

  return mergeFindings(raw.sort((a, b) => a.rule.localeCompare(b.rule) || a.clipId.localeCompare(b.clipId) || a.from - b.from))
}

export function matrix(dump: Dump, findings: readonly Finding[]): string {
  const lines = Object.entries(RULES).map(([rule, statement]) => {
    const failures = findings.filter((finding) => finding.rule === rule)
    return `${failures.length === 0 ? 'PASS' : 'FAIL'}  ${rule.padEnd(7)} ${statement}${failures.length === 0 ? '' : `  (${failures.length} finding${failures.length === 1 ? '' : 's'})`}`
  })
  const frames = dump.clips.reduce((sum, clip) => sum + clip.frames, 0)
  return `${dump.clips.length} timelines, ${frames} frames\n${lines.join('\n')}`
}

if (import.meta.main) {
  const args = process.argv.slice(2)
  const index = args.indexOf('--in')
  const file = index >= 0 ? (args[index + 1] ?? '/tmp/bob13-frames.json') : '/tmp/bob13-frames.json'
  const dump = JSON.parse(await readFile(file, 'utf8')) as Dump
  const findings = audit(dump)
  console.log(matrix(dump, findings))
  for (const finding of findings) console.log(`  ${finding.rule} ${finding.clipId} f${finding.from}-f${finding.to}: ${finding.detail}`)
  process.exit(findings.length === 0 ? 0 : 1)
}
