import type { Rect } from '@/film'
import { SLACK_INVOICES, type SlackInvoice } from '@/data/slack-channel'

/**
 * APP-07 Slack geometry. Every rectangle is an absolute 1280x720 canvas coordinate (the space a
 * timeline anchor is declared in) and never depends on interaction state or content length. Messages
 * are 740 wide and the Case pane starts at x960, so the two never overlap. The view is built from
 * these same constants.
 */

export const RAIL: Rect = { x: 0, y: 76, width: 220, height: 570 }
export const CHANNEL_HEADER: Rect = { x: 220, y: 76, width: 1060, height: 56 }
export const MESSAGE_COLUMN: Rect = { x: 220, y: 132, width: 1060, height: 450 }
export const CASE_PANE: Rect = { x: 960, y: 132, width: 320, height: 450 }
export const COMPOSER: Rect = { x: 240, y: 582, width: 1000, height: 64 }

export const MESSAGE_FIRST_TOP = 150
export const MESSAGE_STRIDE = 70
export const MESSAGE_WIDTH = 740
export const MESSAGE_HEIGHT = 64

/** Message text starts at x276; the lead text box is 172 wide, so a case link follows at x448. */
export const TEXT_X = 276
export const LEAD_WIDTH = 172
export const LINK_WIDTH = 76
export const LINK_HEIGHT = 20

export const messageRect = (index: number): Rect => ({ x: 220, y: MESSAGE_FIRST_TOP + index * MESSAGE_STRIDE, width: MESSAGE_WIDTH, height: MESSAGE_HEIGHT })

/** The case link: after the lead text in the two handoffs, at the text start in the bare reference. */
export const linkRect = (index: number): Rect => {
  const row = messageRect(index)
  return { x: index === SLACK_INVOICES.indexOf('INV-48219') ? TEXT_X : TEXT_X + LEAD_WIDTH, y: row.y + 22, width: LINK_WIDTH, height: LINK_HEIGHT }
}

const slug = (invoice: SlackInvoice): string => invoice.toLowerCase()

export const slackMessageAnchor = (invoice: SlackInvoice) => `slack-message-${slug(invoice)}` as const
export const slackLinkAnchor = (invoice: SlackInvoice) => `slack-link-${slug(invoice)}` as const

export const SLACK_ANCHORS = [
  'slack-channel',
  'slack-message-inv-48215',
  'slack-message-inv-48218',
  'slack-message-inv-48219',
  'slack-link-inv-48215',
  'slack-link-inv-48218',
  'slack-link-inv-48219',
  'slack-case',
  'slack-composer',
] as const
export type SLACKAnchor = (typeof SLACK_ANCHORS)[number]

/** Canvas rectangle of every anchor WHEN SHOWN. `slack-case` is shown only while one of the three cases is selected. */
export const SLACK_ANCHOR_RECTS: Readonly<Record<SLACKAnchor, Rect>> = Object.freeze({
  'slack-channel': CHANNEL_HEADER,
  'slack-message-inv-48215': messageRect(0),
  'slack-message-inv-48218': messageRect(1),
  'slack-message-inv-48219': messageRect(2),
  'slack-link-inv-48215': linkRect(0),
  'slack-link-inv-48218': linkRect(1),
  'slack-link-inv-48219': linkRect(2),
  'slack-case': CASE_PANE,
  'slack-composer': COMPOSER,
})
