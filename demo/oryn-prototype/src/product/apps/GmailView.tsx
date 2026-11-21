import { ArrowLeft, Download, FileText, Mail, Paperclip, Search, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { INBOX_ROWS } from '@/data/inbox'
import type { InboxRow } from '@/data/inbox'
import { ORGANIZATION } from '@/data/people'
import { KESTREL_DOCUMENT, centsOrDash, workRecord } from '@/data/work-records'
import type { WorkRecord } from '@/data/work-records'
import { formatCents } from '@/data/invoices'
import { cn } from '@/lib/utils'
import { person } from '@/state'
import type { RecordId } from '@/state/types'
import { act, motionProgress } from '../contract'
import type { ProductProps } from '../contract'
import { appTabMeta } from '../desktop-data'
import { appAnchored, appAt } from './frame'
import { InvoiceDocument } from './InvoiceDocument'
import {
  ATTACHMENT,
  BACK,
  BODY_LINE,
  CLOSE_DOCUMENT,
  COMPARE_TOGGLE,
  DOWNLOAD,
  LIST,
  MESSAGE_RULE,
  PANE,
  RAIL,
  RECEIVED,
  RECIPIENT,
  ROW_ANCHORS,
  SEARCH_FIELD,
  SENDER,
  SUBJECT,
  TOOLBAR,
  TOP_BAR,
  VIEWER,
  anchorIn,
  placeIn,
  rowRect,
} from './gmail-layout'

/**
 * APP-01: the original Gmail-like inbox and open message, with the APP-02 document viewer on the
 * right while an attachment is open. A pure function of `{ state, film }`: the record, the mail
 * mode, the attachment and the document layout all come from `state.ui.app`, so the message, the
 * attachment card and the document can never show different identities. Nothing here is cyan and
 * nothing here carries authority: opening a message only changes what is on screen.
 */
const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const KESTREL: RecordId = 'INV-48231'

/** The 150 ms reveal: a film derives it from the frame; the clickable app uses a reduced-motion-safe CSS fade. */
function reveal(film: ProductProps['film'], type: 'OPEN_MESSAGE' | 'OPEN_ATTACHMENT'): { readonly style?: CSSProperties; readonly className?: string } {
  if (!film) return { className: 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150' }
  const progress = motionProgress(film, type)
  return progress < 1 ? { style: { opacity: progress } } : {}
}

function TopBar() {
  return (
    <div className="border-b bg-surface" style={appAt(TOP_BAR)}>
      <img src={appTabMeta('gmail').mark} alt="Gmail" width={20} height={20} className="absolute left-4 top-[18px] h-5 w-5" />
      <div role="search" aria-label="Search mail" className="box-border flex items-center gap-2 rounded border bg-background px-3" style={placeIn(TOP_BAR, SEARCH_FIELD)}>
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
        <span className="type-body text-muted-foreground">Search mail</span>
      </div>
    </div>
  )
}

function Rail({ props, inMessage }: { props: ProductProps; inMessage: boolean }) {
  return (
    <nav aria-label="Mail folders" className="bg-background shadow-[inset_-1px_0_0_var(--border)]" style={appAt(RAIL)}>
      <ul className="m-0 list-none p-2 pt-3">
        <li>
          <button
            type="button"
            aria-current={inMessage ? undefined : 'page'}
            onClick={() => (inMessage ? act(props, { type: 'CLOSE_MESSAGE' }) : undefined)}
            className={cn('type-body flex h-10 w-full items-center gap-2 rounded px-2 text-left', focusRing, inMessage ? 'hover:bg-surface-2' : 'bg-surface-2 font-medium')}
          >
            <Mail className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Inbox
          </button>
        </li>
        <li className="type-body flex h-10 items-center pl-8 text-muted-foreground">Sent</li>
        <li className="type-body flex h-10 items-center pl-8 text-muted-foreground">Drafts</li>
      </ul>
    </nav>
  )
}

const ROW_TEXT = 'type-body min-w-0 truncate'

function RowContent({ row }: { row: InboxRow }) {
  return (
    <>
      <span className={cn(ROW_TEXT, 'w-[172px] shrink-0 font-medium')}>{row.supplier}</span>
      <span className={cn(ROW_TEXT, 'flex-1 text-muted-foreground')}>{row.subject}</span>
      <Paperclip role="img" aria-label="Has attachment" className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
    </>
  )
}

function InboxList({ props, shown }: { props: ProductProps; shown: boolean }) {
  const selected = props.state.ui.app.record
  return (
    <ul aria-label="Inbox" {...appAnchored('inbox-list', LIST, shown)} className="m-0 list-none bg-surface p-0 shadow-[inset_-1px_0_0_var(--border)]">
      {INBOX_ROWS.map((row, index) => {
        const rect = rowRect(index)
        if (row.record === null) {
          return (
            <li key={row.id} style={placeIn(LIST, rect)}>
              <div className="box-border flex h-full w-full items-center gap-4 border-b px-4">
                <RowContent row={row} />
              </div>
            </li>
          )
        }
        const record = row.record
        const current = record === selected
        const anchor = anchorIn(ROW_ANCHORS[record], LIST, rect, shown)
        return (
          <li key={row.id} {...anchor}>
            <button
              type="button"
              aria-current={current ? 'true' : undefined}
              onClick={() => act(props, { type: 'OPEN_MESSAGE', record })}
              className={cn('box-border flex h-full w-full items-center gap-4 border-b px-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', current ? 'bg-surface-2' : 'hover:bg-surface-2')}
            >
              <RowContent row={row} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/** `Priya Nair · Mon 09:14`: only the Demonstration D1 message carries a time. */
function receivedLine(record: WorkRecord): string | null {
  if (record.receivedLabel === null) return null
  const demonstration = DEMONSTRATIONS.find((demo) => demo.invoice === record.id)
  return demonstration ? `${person(demonstration.contributorId).name} \u00b7 ${record.receivedLabel}` : record.receivedLabel
}

function AttachmentCard({ props, record, open, shown }: { props: ProductProps; record: WorkRecord; open: boolean; shown: boolean }) {
  return (
    <button
      type="button"
      aria-controls="gmail-document-viewer"
      aria-expanded={open}
      onClick={() => act(props, { type: 'OPEN_ATTACHMENT' })}
      {...anchorIn('attachment', PANE, ATTACHMENT, shown)}
      className={cn('box-border flex flex-col justify-center overflow-hidden rounded border bg-surface px-3 text-left hover:bg-surface-2', focusRing)}
    >
      <span className="type-data flex h-[18px] items-center gap-2 whitespace-nowrap font-medium">
        <Paperclip className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {record.id}
      </span>
      {record.po !== null ? <span className="type-data h-[18px] whitespace-nowrap text-muted-foreground">{record.po}</span> : null}
      {record.totalCents !== null ? <span className="type-data h-[18px] whitespace-nowrap">{centsOrDash(record.totalCents)}</span> : null}
    </button>
  )
}

function MessagePane({ props, record, shown }: { props: ProductProps; record: WorkRecord; shown: boolean }) {
  const received = receivedLine(record)
  const motion = reveal(props.film, 'OPEN_MESSAGE')
  const anchor = appAnchored('message-pane', PANE, shown)
  return (
    <section aria-label="Message" data-film-anchor={anchor['data-film-anchor']} style={{ ...anchor.style, ...motion.style }} className={cn('bg-surface shadow-[inset_-1px_0_0_var(--border)]', motion.className)}>
      <button
        type="button"
        aria-label="Back to inbox"
        onClick={() => act(props, { type: 'CLOSE_MESSAGE' })}
        {...anchorIn('gmail-back', PANE, BACK, shown)}
        className={cn('type-body flex items-center gap-2 rounded px-2 text-left hover:bg-surface-2', focusRing)}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        Back
      </button>
      <h2 className="type-card truncate" style={placeIn(PANE, SUBJECT)}>{`Invoice ${record.id}`}</h2>
      <p className="type-body truncate font-medium" style={placeIn(PANE, SENDER)}>{record.supplier}</p>
      <p className="type-body truncate text-muted-foreground" style={placeIn(PANE, RECIPIENT)}>{`to ${ORGANIZATION}`}</p>
      {received !== null ? (
        <p className="type-data truncate text-muted-foreground" style={placeIn(PANE, RECEIVED)}>
          {received}
        </p>
      ) : null}
      <div aria-hidden="true" className="bg-border" style={placeIn(PANE, MESSAGE_RULE)} />
      {record.id === KESTREL ? (
        <p className="type-prose truncate" style={placeIn(PANE, BODY_LINE)}>{`Handling fee ${formatCents(KESTREL_DOCUMENT.handlingFeeCents)}`}</p>
      ) : null}
      <AttachmentCard props={props} record={record} open={props.state.ui.app.attachment} shown={shown} />
    </section>
  )
}

function Viewer({ props, record, shown }: { props: ProductProps; record: WorkRecord; shown: boolean }) {
  const { documentView } = props.state.ui.app
  const compare = documentView === 'compare'
  const comparable = record.id === KESTREL
  const motion = reveal(props.film, 'OPEN_ATTACHMENT')
  const anchor = appAnchored('document-viewer', VIEWER, shown)
  return (
    <section
      id="gmail-document-viewer"
      aria-label="Document viewer"
      data-film-anchor={anchor['data-film-anchor']}
      style={{ ...anchor.style, ...motion.style }}
      className={cn('overflow-hidden bg-background shadow-[inset_1px_0_0_var(--border)]', motion.className)}
    >
      <div role="toolbar" aria-label="Document" className="border-b bg-surface" style={placeIn(VIEWER, TOOLBAR)}>
        <div className="type-body absolute left-4 top-0 flex h-10 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          Invoice document
        </div>
        <button
          type="button"
          onClick={() => act(props, { type: 'SET_DOCUMENT_VIEW', view: compare ? 'single' : 'compare' })}
          {...anchorIn('gmail-compare-toggle', TOOLBAR, COMPARE_TOGGLE, shown && comparable)}
          className={cn('type-body flex items-center justify-center whitespace-nowrap rounded px-2 hover:bg-surface-2', focusRing)}
        >
          {compare ? 'Single layout' : 'Compare layouts'}
        </button>
        <span className="type-data flex items-center gap-2 whitespace-nowrap px-2 text-muted-foreground" style={placeIn(TOOLBAR, DOWNLOAD)}>
          <Download className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          Download
        </span>
        <button
          type="button"
          aria-label="Close document"
          onClick={() => act(props, { type: 'CLOSE_ATTACHMENT' })}
          {...anchorIn('gmail-close-document', TOOLBAR, CLOSE_DOCUMENT, shown)}
          className={cn('flex items-center justify-center rounded hover:bg-surface-2', focusRing)}
        >
          <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <InvoiceDocument record={record} view={documentView} shown={shown} film={props.film} />
    </section>
  )
}

export function GmailView(props: ProductProps) {
  const app = props.state.ui.app
  const record = workRecord(app.record)
  const inMessage = app.mail === 'message'
  const viewerOpen = inMessage && app.attachment
  return (
    <>
      <TopBar />
      <Rail props={props} inMessage={inMessage} />
      <InboxList props={props} shown={!inMessage} />
      <MessagePane props={props} record={record} shown={inMessage} />
      <Viewer props={props} record={record} shown={viewerOpen} />
    </>
  )
}
