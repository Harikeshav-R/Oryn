import { Hash, MessageSquare, Paperclip, Send, Smile } from 'lucide-react'
import { StatusBadge } from '@/components/domain/status-badge'
import { INVOICE_CASES, formatCents, type InvoiceCase } from '@/data/invoices'
import { SLACK_CHANNEL, SLACK_COMPOSER_PLACEHOLDER, SLACK_MESSAGES, SLACK_SEND_BLOCKED, SLACK_WORKSPACE, isSlackInvoice } from '@/data/slack-channel'
import { cn } from '@/lib/utils'
import { act, filmAnchor, type ProductProps } from '../contract'
import { appTabMeta } from '../desktop-data'
import { at, within } from '../geometry'
import { appAnchored, appAt } from './frame'
import {
  CASE_PANE,
  CHANNEL_HEADER,
  COMPOSER,
  LEAD_WIDTH,
  MESSAGE_COLUMN,
  RAIL,
  TEXT_X,
  linkRect,
  messageRect,
  slackLinkAnchor,
  slackMessageAnchor,
} from './slack-layout'

/**
 * APP-07 SC08: an original Slack-like workspace: an ink rail, one channel, three separate messages
 * and a composer that cannot send. A message and a case link are evidence of a handoff only: opening
 * a case shows that case's own supplier, PO, amount and outcome, and nothing here implies approval
 * or verification. Pure function of `{ state, film }`; the open case is `state.selectedCase`.
 * Passive observation is neutral ink: no execution cyan appears here.
 *
 * Messages are 740 wide and the Case pane starts at x960, so they never overlap. In a film no CSS
 * transition runs; in the app hover colours transition and reduced motion switches that off.
 */

const MESSAGE_TEXT_Y = 22
const motion = (film: ProductProps['film']): string | undefined => (film ? undefined : 'transition-colors motion-reduce:transition-none')

function caseOf(invoice: string): InvoiceCase {
  const found = INVOICE_CASES.find((row) => row.invoice === invoice)
  if (!found) throw new Error(`Unknown invoice fixture ${invoice}`)
  return found
}

const FIELD = 'type-micro text-muted-foreground'
const VALUE = 'type-data text-foreground'

function CaseFields({ invoice }: { invoice: string }) {
  const row = caseOf(invoice)
  return (
    <>
      <h2 className="m-0 font-sans text-[14px] font-bold leading-5">Case</h2>
      <dl className="m-0 mt-3 grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-2 gap-y-3">
        <dt className={FIELD}>Invoice</dt>
        <dd className={cn('m-0', VALUE)}>{row.invoice}</dd>
        <dt className={FIELD}>Supplier</dt>
        <dd className={cn('m-0 truncate', VALUE)}>{row.supplier}</dd>
        {row.qualifier === undefined ? null : (
          <>
            <dt className={FIELD}>Qualifier</dt>
            <dd className={cn('m-0 truncate', VALUE)}>{row.qualifier}</dd>
          </>
        )}
        <dt className={FIELD}>Amount</dt>
        <dd className={cn('m-0', VALUE)}>{formatCents(row.amountCents)}</dd>
        <dt className={FIELD}>PO</dt>
        <dd className={cn('m-0', VALUE)}>{row.po ?? '\u2014'}</dd>
        <dt className={FIELD}>Outcome</dt>
        <dd className="m-0">
          <StatusBadge status={row.outcome} />
        </dd>
      </dl>
      <p className="m-0 mt-4 type-micro text-muted-foreground">Handoff reference only.</p>
    </>
  )
}

export function SlackView(props: ProductProps) {
  const { state, film } = props
  const meta = appTabMeta('slack')
  const selected = isSlackInvoice(state.selectedCase) ? state.selectedCase : null

  return (
    <section aria-label="Slack" data-app="slack" className="text-foreground">
      <div aria-hidden className="box-border border-l bg-surface" style={appAt({ x: MESSAGE_COLUMN.x, y: CHANNEL_HEADER.y, width: MESSAGE_COLUMN.width, height: 570 })} />

      <nav aria-label="Workspace" className="box-border bg-foreground text-background" style={appAt(RAIL)}>
        <img src={meta.mark} alt="" width={16} height={16} className="absolute" style={{ left: 16, top: 19 }} />
        <p className="absolute m-0 whitespace-nowrap font-sans text-[14px] font-bold leading-5" style={{ left: 40, top: 17, width: 168, height: 20 }}>
          {SLACK_WORKSPACE}
        </p>
        <p className="absolute m-0 flex items-center gap-1 font-mono text-[11px] leading-4 opacity-70" style={{ left: 16, top: 64, height: 16 }}>
          <Hash size={16} aria-hidden />
          <span>Channels</span>
        </p>
        <p aria-current="page" className="absolute m-0 box-border flex items-center rounded bg-background px-2 font-mono text-[12px] font-medium leading-[18px] text-foreground" style={{ left: 8, top: 90, width: 204, height: 32 }}>
          {SLACK_CHANNEL}
        </p>
      </nav>

      <header
        {...appAnchored('slack-channel', CHANNEL_HEADER)}
        className="box-border flex items-center border-b bg-surface px-4 font-mono text-[12px] font-medium leading-[18px] text-foreground"
      >
        <h1 className="m-0 font-mono text-[12px] font-medium leading-[18px]">{SLACK_CHANNEL}</h1>
      </header>

      <div role="list" aria-label={`Messages in ${SLACK_CHANNEL}`}>
        {SLACK_MESSAGES.map((message, index) => {
          const row = messageRect(index)
          const open = selected === message.invoice
          return (
            <div
              key={message.invoice}
              role="listitem"
              data-selected={open ? 'true' : undefined}
              {...appAnchored(slackMessageAnchor(message.invoice), row)}
              className={cn('box-border border-b', open ? 'bg-surface-2' : 'bg-surface')}
            >
              <span aria-hidden className="absolute flex items-center justify-center rounded-sm border bg-surface-2 text-muted-foreground" style={{ left: 12, top: 14, width: 32, height: 32 }}>
                <MessageSquare size={16} />
              </span>
              {message.lead === null ? null : (
                <span className="absolute overflow-hidden whitespace-pre font-sans text-[14px] leading-5" style={{ left: TEXT_X - row.x, top: MESSAGE_TEXT_Y, width: LEAD_WIDTH, height: 20 }}>
                  {message.lead}
                </span>
              )}
              <button
                type="button"
                aria-controls="slack-case-pane"
                aria-expanded={open}
                {...filmAnchor(slackLinkAnchor(message.invoice))}
                onClick={() => act(props, { type: 'SELECT_CASE', caseId: message.invoice })}
                className={cn('box-border rounded-sm px-1 text-left font-mono text-[12px] leading-5 underline underline-offset-2 outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring', motion(film))}
                style={at(within(row, linkRect(index)))}
              >
                {message.invoice}
              </button>
            </div>
          )
        })}
      </div>

      <aside
        id="slack-case-pane"
        aria-label="Case"
        {...appAnchored('slack-case', CASE_PANE, selected !== null)}
        className="box-border overflow-hidden border-l bg-surface p-4"
      >
        {selected === null ? null : <CaseFields invoice={selected} />}
      </aside>

      <div
        role="group"
        aria-label="Message composer"
        {...appAnchored('slack-composer', COMPOSER)}
        className="box-border rounded-md border bg-surface focus-within:ring-2 focus-within:ring-ring"
      >
        <textarea
          aria-label={SLACK_COMPOSER_PLACEHOLDER}
          placeholder={SLACK_COMPOSER_PLACEHOLDER}
          rows={1}
          className="absolute box-border resize-none overflow-y-auto bg-transparent font-sans text-[14px] leading-5 text-foreground outline-none placeholder:text-muted-foreground"
          style={{ left: 12, top: 6, width: 974, height: 28, resize: 'none' }}
        />
        <Paperclip size={16} aria-hidden className="absolute text-muted-foreground" style={{ left: 12, top: 38 }} />
        <Smile size={16} aria-hidden className="absolute text-muted-foreground" style={{ left: 40, top: 38 }} />
        <span id="slack-send-reason" className="absolute whitespace-nowrap text-right type-micro text-muted-foreground" style={{ left: 700, top: 38, width: 256, height: 16 }}>
          {SLACK_SEND_BLOCKED}
        </span>
        <button
          type="button"
          aria-label="Send"
          aria-disabled="true"
          aria-describedby="slack-send-reason"
          onClick={(event) => event.preventDefault()}
          className="absolute flex cursor-not-allowed items-center justify-center rounded-sm border text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ left: 964, top: 34, width: 24, height: 24 }}
        >
          <Send size={16} aria-hidden />
        </button>
      </div>
    </section>
  )
}
