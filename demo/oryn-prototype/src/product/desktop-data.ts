import chrome from '@/assets/marks/chrome.svg'
import gmail from '@/assets/marks/gmail.svg'
import sheets from '@/assets/marks/google-sheets.svg'
import hubspot from '@/assets/marks/hubspot.svg'
import netsuite from '@/assets/marks/netsuite-favicon.png'
import slack from '@/assets/marks/slack.svg'
import zoom from '@/assets/marks/zoom.svg'
import type { AppTabId } from '@/state'

/** Fixed data of the desktop screen: the APP-11 tabs and the SC01 excluded-window geometry. */

export interface AppTabMeta {
  readonly id: AppTabId
  readonly title: string
  /** Fictional `.example` host: the only address text ever shown. */
  readonly host: string
  /** Bundled asset; no remote request is ever made for a mark. */
  readonly mark: string
}

/** Tab order is the APP-11 order; `APP_TAB_IDS` from the reducer lists the same ids. */
export const APP_TABS: readonly AppTabMeta[] = [
  { id: 'gmail', title: 'Gmail', host: 'mail.example', mark: gmail },
  { id: 'netsuite', title: 'NetSuite', host: 'erp.example', mark: netsuite },
  { id: 'tracker', title: 'AP Exceptions Tracker', host: 'sheets.example', mark: sheets },
  { id: 'slack', title: 'Slack', host: 'chat.example', mark: slack },
  { id: 'zoom', title: 'Zoom', host: 'meeting.example', mark: zoom },
  { id: 'hubspot', title: 'HubSpot', host: 'crm.example', mark: hubspot },
]

export const CHROME_MARK = chrome

export function appTabMeta(id: AppTabId): AppTabMeta {
  const meta = APP_TABS.find((tab) => tab.id === id)
  if (!meta) throw new Error(`Unknown app tab ${id}`)
  return meta
}

/** Excluded window and its cue (SC01). The cue sits adjacent below the window, never over its body. */
export const EXCLUDED = Object.freeze({
  window: { x: 140, y: 150, width: 560, height: 340 },
  cue: { x: 140, y: 498, width: 256, height: 24 },
})
