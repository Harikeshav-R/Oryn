import type { ReactNode } from 'react'
import type { AppTabId } from '@/state'
import { GmailView } from './apps/GmailView'
import { HubSpotView } from './apps/HubSpotView'
import { NetSuiteView } from './apps/NetSuiteView'
import { SlackView } from './apps/SlackView'
import { TrackerView } from './apps/TrackerView'
import { ZoomView } from './apps/ZoomView'
import type { ProductProps } from './contract'
import { appTabMeta } from './desktop-data'

/** APP-11 original application views fill the content area beneath the browser bar. */
const APP_VIEW_HEIGHT = 644
const REAL_VIEWS: Readonly<Record<AppTabId, (props: ProductProps) => ReactNode>> = {
  gmail: GmailView,
  netsuite: NetSuiteView,
  tracker: TrackerView,
  slack: SlackView,
  zoom: ZoomView,
  hubspot: HubSpotView,
}

/**
 * The content area (y76..720) of the active tab. One owner of app selection: `state.ui.activeTab`.
 * Switching tabs never touches invoice or business data; each real view reads `state.ui.app`.
 */
export function AppView(props: ProductProps) {
  const tab = props.state.ui.activeTab
  const meta = appTabMeta(tab)
  const Real = REAL_VIEWS[tab]
  return (
    <div
      id={`app-view-${tab}`}
      role="tabpanel"
      data-app-view={tab}
      aria-label={`${meta.title} view`}
      className="relative w-[1280px] overflow-hidden bg-background"
      style={{ height: APP_VIEW_HEIGHT }}
    >
      <Real {...props} />
    </div>
  )
}
