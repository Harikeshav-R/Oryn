import { describe, expect, test } from 'bun:test'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { INVOICE_CASES, formatCents } from '@/data/invoices'
import { reconstruct, transition } from '@/state'
import type { Action, State } from '@/state'
import { act as run } from '@/state/test-helpers'
import type { Rect } from '@/film'
import type { FilmContext } from './contract'
import { FocusOnOpen } from './focus-on-open'
import { JOBS_ANCHORS, JOBS_ANCHOR_RECTS, SCOPE_DIALOG } from './job-layout'
import { JobsScreen } from './JobsScreen'

/** SC21 Jobs queue and scope confirmation: the fixed population, the confirmation that precedes a start, and what a start does and does not do. */

type Props = Record<string, unknown>

const html = (state: State, film?: FilmContext): string => renderToStaticMarkup(<JobsScreen state={state} film={film} />)
const plain = (markup: string): string => markup.replaceAll('<!-- -->', '').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
const text = (markup: string): string => plain(markup.replace(/<[^>]*>/g, ''))

const openingTag = (markup: string, name: string): string => {
  const tag = markup.match(new RegExp(`<[^<>]*data-film-anchor="${name}"[^<>]*>`))?.[0]
  if (!tag) throw new Error(`No tag for anchor ${name}`)
  return tag
}
const hidden = (markup: string, name: string): boolean => openingTag(markup, name).includes('display:none')
const disabled = (markup: string, name: string): boolean => openingTag(markup, name).includes('aria-disabled="true"')

/** Markup of the element carrying an anchor, from its opening tag to its matching closing tag. */
function elementOf(markup: string, name: string): string {
  const tag = openingTag(markup, name)
  const start = markup.indexOf(tag)
  const tagName = (tag.match(/^<(\w+)/) as RegExpMatchArray)[1]
  const tags = new RegExp(`<${tagName}\\b|</${tagName}>`, 'g')
  tags.lastIndex = start
  let depth = 0
  for (let found = tags.exec(markup); found; found = tags.exec(markup)) {
    depth += found[0].startsWith('</') ? -1 : 1
    if (depth === 0) return markup.slice(start, tags.lastIndex)
  }
  throw new Error(`Anchor ${name} is not closed`)
}

const rectOf = (markup: string, name: string): Rect => {
  const style = openingTag(markup, name).match(/style="([^"]*)"/)?.[1] ?? ''
  const px = (property: string): number => Number(style.match(new RegExp(`(?:^|;)${property}:(-?\\d+(?:\\.\\d+)?)px`))?.[1])
  return { x: px('left'), y: px('top'), width: px('width'), height: px('height') }
}

const notice = (markup: string): { readonly kind: string; readonly text: string; readonly shown: boolean } => {
  const match = markup.match(/<p role="status" data-notice="(\w+)"([^>]*)>(.*?)<\/p>/) as RegExpMatchArray
  return { kind: match[1] as string, text: text(match[3] as string), shown: !(match[2] as string).includes('display:none') }
}

/** Cyan: the running orbit's marker and its node fill (the ring itself is always neutral). Nothing here may carry it while the job is not executing. */
const CYAN = /data-running="true"|data-executing="true"|(?:text|bg|border|ring|stroke|fill)-arc\b|var\(--arc-mark\)/

const filmAt = (frame: number, applied: Partial<Record<Action['type'], number>> = {}): FilmContext => ({ frame, reducedMotion: false, lastApplied: (type) => applied[type] ?? null })

/** Every element of the screen. The focus helper uses hooks, which only a renderer may run. */
function elementsOf(node: ReactNode, out: ReactElement<Props>[] = []): ReactElement<Props>[] {
  if (Array.isArray(node)) {
    node.forEach((child) => elementsOf(child as ReactNode, out))
    return out
  }
  if (!isValidElement<Props>(node)) return out
  out.push(node)
  if (node.type === FocusOnOpen) return out
  if (typeof node.type === 'function') return elementsOf((node.type as (props: Props) => ReactNode)(node.props), out)
  return elementsOf(node.props.children as ReactNode, out)
}

/** The actions the one element `pick` selects dispatches when `fire` is called on it. */
function dispatched(state: State, pick: (props: Props) => boolean, fire: (props: Props) => void): Action[] {
  const actions: Action[] = []
  const element = elementsOf(<JobsScreen state={state} dispatch={(action) => actions.push(action)} />).find((candidate) => pick(candidate.props))
  if (!element) throw new Error('No element matches')
  fire(element.props)
  return actions
}
const clickAnchor = (state: State, name: string): Action[] => dispatched(state, (props) => props['data-film-anchor'] === name, (props) => (props.onClick as () => void)())

const atGate = reconstruct('ST09')
const ready = run(atGate, { type: 'APPROVE_RELEASE' }, { type: 'CONFIRM_SCOPE' })
const confirmed = run(ready, { type: 'CONFIRM_SELECTION' })
const dialogOpen = run(confirmed, { type: 'OPEN_JOB_SCOPE' })
const cancelled = run(dialogOpen, { type: 'CANCEL_JOB_START' })
const started = run(dialogOpen, { type: 'RELEASE_AND_START' })
const midRun = run(started, { type: 'EVALUATE_CASE', invoice: 'INV-48210' }, { type: 'EVALUATE_CASE', invoice: 'INV-48211' })
const asDaniel = (state: State): State => run(state, { type: 'SELECT_ACTOR', personId: 'daniel' })
const asPriya = (state: State): State => run(state, { type: 'SELECT_ACTOR', personId: 'priya' })

describe('SC21 eligible queue, selection proposed', () => {
  const markup = html(ready)

  test('shows the job row: JOB-0117, the version, the team, the population and a not-started status', () => {
    const row = text(elementOf(markup, 'job-row'))
    expect(row).toBe('JOB-0117Supplier Invoice Reconciler v1.0AP East11 invoicesNot started')
    expect(text(markup)).toContain('Jobs')
  })

  test('lists exactly the eleven frozen invoices with exact amounts and an em dash for a missing PO', () => {
    const queue = elementOf(markup, 'jobs-queue')
    const rows = [...queue.matchAll(/<div role="row" data-invoice="(INV-\d+)"[^>]*>(.*?)<\/div>/g)]
    expect(rows.map((row) => row[1])).toEqual(INVOICE_CASES.map((row) => row.invoice))
    expect(rows).toHaveLength(11)
    rows.forEach((row, index) => {
      const fixture = INVOICE_CASES[index]
      expect(text(row[2] as string)).toBe(`${fixture?.invoice}${fixture?.supplier}${formatCents(fixture?.amountCents ?? 0)}${fixture?.po ?? '\u2014'}Proposed`)
    })
    expect(text(queue)).toContain('INV-48215Ironbark Fasteners$2,260.00\u2014')
    expect(text(queue)).toContain('INV-48219Brightwater Industrial$18,420.00PO-1042')
  })

  test('the header says Proposed selection and the selection marks are not success checks', () => {
    const queue = elementOf(markup, 'jobs-queue')
    expect(text(queue)).toContain('Proposed selection')
    expect(text(queue)).not.toContain('Selection fixed')
    expect(queue).not.toContain('data-glyph="verified"')
    expect(queue).not.toContain('lucide-check')
    expect(queue).not.toContain('lucide-lock')
  })

  test('Confirm 11 invoices is enabled; Confirm job scope is disabled until the selection is confirmed, with the reducer reason', () => {
    expect(text(elementOf(markup, 'confirm-selection'))).toBe('Confirm 11 invoices')
    expect(disabled(markup, 'confirm-selection')).toBe(false)
    expect(disabled(markup, 'confirm-job-scope')).toBe(true)
    expect(text(elementOf(markup, 'confirm-job-scope'))).toBe('Confirm job scopeUnavailable: Confirm the 11 invoices before the job scope.')
  })

  test('the preflight shows the version, AP East, the three applications, the 2.00% policy, the population and the authority', () => {
    const preflight = text(elementOf(markup, 'job-preflight'))
    expect(preflight).toContain('VersionSupplier Invoice Reconciler v1.0Released \u00b7 Stage 3 Supervised Assist')
    expect(preflight).toContain('ScopeAP East')
    expect(preflight).toContain('Permitted applicationsGmail, NetSuite, Google Sheets')
    expect(preflight).toContain('PolicyInvoice approval threshold 2.00%Above it: Tier 3 approval by a person')
    expect(preflight).toContain('Population11 invoicesProposed: not frozen until confirmed.')
    expect(preflight).toContain('Authoritystart-job \u00b7 Marcus Webb')
    expect(preflight).toContain('Starting this job does not authorize consequential variance posting.')
  })

  test('before the release is approved the preflight does not call the version released', () => {
    expect(text(elementOf(html(atGate), 'job-preflight'))).toContain('Release approval pending \u00b7 Stage 3 Supervised Assist')
    expect(text(elementOf(html(atGate), 'job-preflight'))).not.toContain('Released')
  })

  test('nothing has started: no notice, no dialog, no cyan, no Retry or Resubmit control', () => {
    expect(notice(markup)).toMatchObject({ kind: 'none', shown: false })
    for (const name of ['job-scope-dialog', 'start-job', 'cancel-job-start']) expect(hidden(markup, name)).toBe(true)
    expect(markup).not.toMatch(CYAN)
    expect(text(markup)).not.toMatch(/Retry|Resubmit|11 successful|Completed with exceptions/)
    expect(markup).not.toContain('Open job progress')
  })

  test('renders all eight anchors exactly once, in canvas coordinates equal to the layout', () => {
    for (const name of JOBS_ANCHORS) expect(markup.split(`data-film-anchor="${name}"`)).toHaveLength(2)
    for (const name of ['jobs-queue', 'job-row', 'confirm-job-scope', 'confirm-selection', 'job-preflight'] as const) expect(rectOf(markup, name)).toEqual(JOBS_ANCHOR_RECTS[name])
  })
})

describe('SC21 selection confirmed', () => {
  const markup = html(confirmed)

  test('the header reads Selection fixed · 11 invoices, the marks lock and the control stays as a disabled Selection confirmed', () => {
    const queue = elementOf(markup, 'jobs-queue')
    expect(text(queue)).toContain('Selection fixed \u00b7 11 invoices')
    expect(text(queue)).not.toContain('Proposed selection')
    expect(queue.split('lucide-lock')).toHaveLength(12)
    expect(text(elementOf(markup, 'confirm-selection'))).toBe('Selection confirmedUnavailable: The 11 invoices of JOB-0117 are already confirmed.')
    expect(disabled(markup, 'confirm-selection')).toBe(true)
    expect(text(elementOf(markup, 'job-preflight'))).toContain('Population11 invoicesFrozen: no case can be added or removed.')
  })

  test('Confirm job scope is now enabled, and confirming the selection starts nothing', () => {
    expect(disabled(markup, 'confirm-job-scope')).toBe(false)
    expect(confirmed.phase).toBe('ST09')
    expect(confirmed.job.status).toBe('notStarted')
    expect(Object.keys(confirmed.job.outcomes)).toHaveLength(0)
    expect(text(elementOf(markup, 'job-row'))).toContain('Not started')
    expect(hidden(markup, 'start-job')).toBe(true)
  })

  test('the controls dispatch the reducer actions', () => {
    expect(clickAnchor(ready, 'confirm-selection')).toEqual([{ type: 'CONFIRM_SELECTION' }])
    expect(clickAnchor(confirmed, 'confirm-job-scope')).toEqual([{ type: 'OPEN_JOB_SCOPE' }])
  })
})

describe('SC21 scope confirmation dialog', () => {
  const markup = html(dialogOpen)

  test('shows the dialog, its three anchors and the text of the confirmation', () => {
    for (const name of ['job-scope-dialog', 'start-job', 'cancel-job-start']) expect(hidden(markup, name)).toBe(false)
    const dialog = text(elementOf(markup, 'job-scope-dialog'))
    expect(dialog).toContain('Confirm job scope')
    expect(dialog).toContain('JOB-0117 \u00b7 Supplier Invoice Reconciler v1.0')
    expect(dialog).toContain('AP East \u00b7 11 invoices')
    expect(dialog).toContain('Permitted applicationsGmailNetSuiteGoogle Sheets')
    expect(dialog).toContain('Policy')
    expect(dialog).toContain('Invoice approval threshold 2.00%. Variance above it needs Tier 3 approval by a person.')
    expect(dialog).toContain('Starting this job does not authorize consequential variance posting.')
    expect(text(elementOf(markup, 'cancel-job-start'))).toBe('Cancel')
    expect(text(elementOf(markup, 'start-job'))).toBe('Start job')
  })

  test('Start job is enabled only here, for the viewpoint that holds start-job and meets the gate', () => {
    expect(disabled(markup, 'start-job')).toBe(false)
    expect(disabled(markup, 'cancel-job-start')).toBe(false)
    expect(hidden(html(confirmed), 'start-job')).toBe(true)
    expect(hidden(html(cancelled), 'start-job')).toBe(true)
    expect(hidden(html(started), 'start-job')).toBe(true)
  })

  test('the scrim covers the whole canvas at z40 and the dialog sits above it', () => {
    expect(markup).toContain('data-layer="job-scope-dialog"')
    expect(markup).toMatch(/data-layer="job-scope-dialog"[^>]*style="[^"]*left:0;top:0;width:1280px;height:720px;z-index:40/)
    expect(openingTag(markup, 'job-scope-dialog')).toContain('z-index:50')
  })

  test('dialog anchors sit at the layout rects (dialog-local plus the dialog origin)', () => {
    expect(rectOf(markup, 'job-scope-dialog')).toEqual(JOBS_ANCHOR_RECTS['job-scope-dialog'])
    for (const name of ['start-job', 'cancel-job-start'] as const) {
      const local = rectOf(markup, name)
      expect({ x: SCOPE_DIALOG.x + local.x, y: SCOPE_DIALOG.y + local.y, width: local.width, height: local.height }).toEqual(JOBS_ANCHOR_RECTS[name])
    }
  })

  test('Start job dispatches RELEASE_AND_START, Cancel, Escape and the scrim dispatch CANCEL_JOB_START', () => {
    expect(clickAnchor(dialogOpen, 'start-job')).toEqual([{ type: 'RELEASE_AND_START' }])
    expect(clickAnchor(dialogOpen, 'cancel-job-start')).toEqual([{ type: 'CANCEL_JOB_START' }])
    const stop = (): void => undefined
    expect(dispatched(dialogOpen, (props) => props.role === 'dialog', (props) => (props.onKeyDown as (event: Props) => void)({ key: 'Escape', stopPropagation: stop }))).toEqual([{ type: 'CANCEL_JOB_START' }])
    const layer = (props: Props): boolean => props['data-layer'] === 'job-scope-dialog'
    const outside = {}
    expect(dispatched(dialogOpen, layer, (props) => (props.onClick as (event: Props) => void)({ target: outside, currentTarget: outside }))).toEqual([{ type: 'CANCEL_JOB_START' }])
    // A click that lands inside the dialog bubbles to the scrim and must not cancel.
    expect(dispatched(dialogOpen, layer, (props) => (props.onClick as (event: Props) => void)({ target: {}, currentTarget: outside }))).toEqual([])
  })

  test('in a film the dialog fades in over 150 ms from the frame OPEN_JOB_SCOPE landed on, with no CSS transition', () => {
    const frameOf = (frame: number): string => html(dialogOpen, filmAt(frame, { OPEN_JOB_SCOPE: 10 }))
    const opacity = (markup: string): number => Number(markup.match(/data-layer="job-scope-dialog"[^>]*opacity:([\d.]+)/)?.[1])
    expect(opacity(frameOf(10))).toBeLessThan(opacity(frameOf(12)))
    expect(opacity(frameOf(12))).toBeLessThan(1)
    expect(opacity(frameOf(40))).toBe(1)
    expect(frameOf(11)).toBe(frameOf(11))
    expect(frameOf(11)).not.toMatch(/\btransition(?!-none)/)
  })
})

describe('SC21 start blocked', () => {
  test('Daniel (Approver) reads the queue but may not start: the reducer reason is shown and every start control is disabled', () => {
    const daniel = asDaniel(ready)
    const reason = (() => {
      const result = transition(daniel, { type: 'CONFIRM_SELECTION' })
      if (result.ok) throw new Error('Daniel must not confirm the selection')
      return result.rejection.reason
    })()
    const markup = html(daniel)
    expect(reason.length).toBeGreaterThan(0)
    expect(notice(markup)).toEqual({ kind: 'blocked', text: reason, shown: true })
    expect(disabled(markup, 'confirm-selection')).toBe(true)
    expect(disabled(markup, 'confirm-job-scope')).toBe(true)
    expect(text(elementOf(markup, 'confirm-selection'))).toContain(`Unavailable: ${reason}`)
    expect(text(elementOf(markup, 'job-preflight'))).toContain('Start blocked')
    expect(hidden(markup, 'start-job')).toBe(true)
    expect(daniel.phase).toBe('ST09')
  })

  test('a forced-open dialog for a viewpoint without the grant still cannot enable Start job', () => {
    const forced: State = { ...asDaniel(ready), ui: { ...ready.ui, job: { ...ready.ui.job, selection: 'confirmed', dialog: 'open' } } }
    const markup = html(forced)
    expect(hidden(markup, 'start-job')).toBe(false)
    expect(disabled(markup, 'start-job')).toBe(true)
    expect(text(elementOf(markup, 'start-job'))).toContain('Unavailable:')
  })

  test('Marcus before the release is approved gets the release gate reason, not a start', () => {
    const markup = html(atGate)
    const shown = notice(markup)
    expect(shown.kind).toBe('blocked')
    expect(shown.text).toBe('The workflow owner has not approved this release.')
    expect(disabled(markup, 'confirm-selection')).toBe(true)
    expect(disabled(markup, 'confirm-job-scope')).toBe(true)
    expect(text(elementOf(markup, 'job-preflight'))).toContain('Start blocked')
    expect(clickAnchor(atGate, 'confirm-selection')).toEqual([{ type: 'CONFIRM_SELECTION' }])
    expect(transition(atGate, { type: 'CONFIRM_SELECTION' }).ok).toBe(false)
  })

  test('an Employee has no access: Not available with every anchor present and hidden', () => {
    const markup = html(asPriya(ready))
    expect(text(markup)).toContain('Not available: Jobs are read by the Workflow Owner and the Approver.')
    for (const name of JOBS_ANCHORS) expect(hidden(markup, name)).toBe(true)
  })
})

describe('SC21 cancelled', () => {
  const markup = html(cancelled)

  test('Cancel starts nothing: still ST09, not started, no outcomes, the queue unchanged', () => {
    expect(cancelled.phase).toBe('ST09')
    expect(cancelled.job.status).toBe('notStarted')
    expect(cancelled.job.outcomes).toEqual({})
    expect(cancelled.running.job).toBe(false)
    expect(cancelled.ui.job.startCancelled).toBe(true)
    expect(text(elementOf(markup, 'job-row'))).toBe('JOB-0117Supplier Invoice Reconciler v1.0AP East11 invoicesNot started')
    expect(text(elementOf(markup, 'jobs-queue'))).toContain('Selection fixed \u00b7 11 invoices')
  })

  test('says so, closes the dialog and leaves Confirm job scope available', () => {
    expect(notice(markup)).toEqual({ kind: 'cancelled', text: 'Job start cancelled. Nothing was started; the queue is unchanged.', shown: true })
    for (const name of ['job-scope-dialog', 'start-job', 'cancel-job-start']) expect(hidden(markup, name)).toBe(true)
    expect(disabled(markup, 'confirm-job-scope')).toBe(false)
    expect(markup).not.toMatch(CYAN)
    expect(markup).not.toContain('Open job progress')
  })

  test('opening the confirmation again clears the cancelled note', () => {
    expect(notice(html(run(cancelled, { type: 'OPEN_JOB_SCOPE' }))).kind).toBe('none')
  })
})

describe('SC21 started', () => {
  const markup = html(started)

  test('RELEASE_AND_START enters ST10 with eleven queued cases and a running job', () => {
    expect(started.phase).toBe('ST10')
    expect(started.job.status).toBe('running')
    expect(Object.values(started.job.outcomes)).toEqual(Array(11).fill('queued'))
    expect(started.running.job).toBe(true)
    expect(started.ui.job.dialog).toBe('closed')
  })

  test('shows Queued with the running orbit, the started note and the way to the job; the dialog is closed', () => {
    expect(text(elementOf(markup, 'job-row'))).toBe('JOB-0117Supplier Invoice Reconciler v1.0AP East11 invoicesQueued')
    expect(elementOf(markup, 'job-row')).toMatch(CYAN)
    expect(notice(markup)).toEqual({
      kind: 'started',
      text: 'JOB-0117 started on v1.0. Cases are evaluated independently; a finished pass is not an all-success outcome.',
      shown: true,
    })
    expect(text(markup)).toContain('Open job progress')
    for (const name of ['job-scope-dialog', 'start-job', 'cancel-job-start']) expect(hidden(markup, name)).toBe(true)
    expect(disabled(markup, 'confirm-job-scope')).toBe(true)
    expect(text(elementOf(markup, 'confirm-job-scope'))).toContain('JOB-0117 is already started.')
    expect(text(markup)).not.toMatch(/Retry|Resubmit|11 successful|Completed with exceptions/)
  })

  test('Open job progress opens SC22, and the preflight records that start-job was used', () => {
    const actions = dispatched(started, (props) => props.children === 'Open job progress', (props) => (props.onClick as () => void)())
    expect(actions).toEqual([{ type: 'OPEN_SCREEN', screen: 'SC22' }])
    expect(text(elementOf(markup, 'job-preflight'))).toContain('start-job used by Marcus Webb')
  })

  test('the status follows the job: Running after the first case, Partially Complete and neutral once the run stops', () => {
    const running = html(midRun)
    expect(text(elementOf(running, 'job-row'))).toContain('Running')
    expect(elementOf(running, 'job-row')).toMatch(CYAN)

    const stopped = reconstruct('ST11')
    expect(stopped.running.job).toBe(false)
    const after = html(stopped)
    expect(text(elementOf(after, 'job-row'))).toContain('Partially Complete')
    expect(after).not.toMatch(CYAN)
    expect(text(after)).not.toMatch(/Completed with exceptions|11 successful|Retry|Resubmit/)
  })

  test('a job that is running but not executing reads Stopped in neutral ink, never cyan', () => {
    const idle: State = { ...midRun, running: { ...midRun.running, job: false } }
    const row = elementOf(html(idle), 'job-row')
    expect(text(row)).toContain('Stopped')
    expect(row).not.toMatch(CYAN)
  })

  test('every anchor stays rendered and the visible ones keep their layout rects after the start', () => {
    for (const name of JOBS_ANCHORS) expect(markup.split(`data-film-anchor="${name}"`)).toHaveLength(2)
    for (const name of ['jobs-queue', 'job-row', 'confirm-job-scope', 'confirm-selection', 'job-preflight'] as const) expect(rectOf(markup, name)).toEqual(JOBS_ANCHOR_RECTS[name])
    expect(text(elementOf(markup, 'confirm-selection'))).toContain('Selection confirmed')
  })
})
