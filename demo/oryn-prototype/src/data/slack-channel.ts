import { ORGANIZATION_SELECTOR } from './people'

/**
 * APP-07 Slack workspace: one channel, three separate messages. A message is evidence of a handoff
 * only; it is never outcome verification and it states no approval. No sender name and no
 * timestamp is shown because no fixture provides one.
 */
export const SLACK_WORKSPACE = ORGANIZATION_SELECTOR
export const SLACK_CHANNEL = '#ap-escalations'
export const SLACK_COMPOSER_PLACEHOLDER = 'Message #ap-escalations'
export const SLACK_SEND_BLOCKED = 'Sending needs authorization'

/** The three invoices the channel links, in message order. */
export const SLACK_INVOICES = ['INV-48215', 'INV-48218', 'INV-48219'] as const
export type SlackInvoice = (typeof SLACK_INVOICES)[number]

export interface SlackMessage {
  readonly invoice: SlackInvoice
  /** Text before the case link; `null` for the bare reference message. */
  readonly lead: string | null
}

const MISSING_PO_LEAD = 'Missing purchase order: '

export const SLACK_MESSAGES: readonly SlackMessage[] = Object.freeze([
  { invoice: 'INV-48215', lead: MISSING_PO_LEAD },
  { invoice: 'INV-48218', lead: MISSING_PO_LEAD },
  { invoice: 'INV-48219', lead: null },
])

export const isSlackInvoice = (value: string | null): value is SlackInvoice => value !== null && (SLACK_INVOICES as readonly string[]).includes(value)
