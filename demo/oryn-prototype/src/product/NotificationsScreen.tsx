import { AlertTriangle, Clock, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NOTIFICATIONS } from '@/data/notifications'
import type { NotificationId } from '@/data/notifications'
import { person } from '@/state'
import type { NotificationFilter } from '@/state'
import { act } from './contract'
import type { ProductProps } from './contract'
import { roleOf } from './destinations'
import { refusal } from './discovery'
import { anchored } from './geometry'
import { NOTICE_IDS, NOTICE_TARGETS, noticeDetails, noticeOpenReason, noticesFor } from './notifications'
import { NOTIFICATIONS_ANCHORS, NOTIFICATIONS_ANCHOR_RECTS as R } from './notifications-layout'
import { HiddenAnchors } from './settings-frame'

const filters: readonly [NotificationFilter, string][] = [['all', 'All'], ['approvals', 'Approvals'], ['incidents', 'Incidents'], ['reminders', 'Reminders']]
const anchorFor = (id: NotificationId) => `notice-${id}` as const

export function NotificationsScreen(props: ProductProps) {
  const { state } = props
  if (roleOf(state) === null) return <><p role="status">Not available: Notifications are available to organizational viewpoints.</p><HiddenAnchors names={NOTIFICATIONS_ANCHORS} /></>
  const visible = noticesFor(state)
  const selected = state.ui.breadth.notifications.open
  const expanded = selected !== null && visible.includes(selected) ? selected : null
  return <>
    <section {...anchored('notification-filters', R['notification-filters'])} className="rounded-lg border bg-surface p-4"><h1 className="type-section m-0">Notifications</h1></section>
    {filters.map(([filter, label]) => {
      const name = `filter-${filter}` as const
      return <button key={filter} type="button" {...anchored(name, R[name])} className={`rounded px-3 text-left type-data transition-none ${state.ui.breadth.notifications.filter === filter ? 'border-2 border-foreground' : ''}`} onClick={() => act(props, { type: 'SET_NOTIFICATION_VIEW', filter })}>{label}</button>
    })}
    <section {...anchored('notifications', R.notifications)} className="rounded-lg border bg-surface p-4"><h2 className="type-card m-0">Notifications</h2></section>
    {NOTICE_IDS.map((id) => {
      const name = anchorFor(id)
      const show = visible.includes(id)
      const item = NOTIFICATIONS[id]
      const Icon = id === 'N-01' ? AlertTriangle : id === 'N-03' ? Clock : Square
      return <button key={id} type="button" {...anchored(name, R[name], show)} className={`box-border rounded-lg border bg-surface-2 p-3 text-left transition-none ${expanded === id ? 'outline outline-2 outline-foreground' : ''}`} onClick={() => act(props, { type: 'SET_NOTIFICATION_VIEW', open: id })}>
        {show && <><span className="flex items-center gap-2 type-data font-semibold"><Icon size={16} aria-hidden="true" />{item.title}</span><span className="block type-micro">{noticeDetails(id)}</span><span className="block type-micro text-muted-foreground">For {person(item.recipient).name} · {state.ui.breadth.notifications.read.includes(id) ? 'Read' : 'Unread'}{id === 'N-01' && state.approval.decision !== 'pending' ? ' · Resolved' : ''}</span></>}
      </button>
    })}
    <section {...anchored('notice-expanded', R['notice-expanded'], expanded !== null)} className="box-border rounded-lg border bg-surface-2 p-4">
      {expanded && (() => {
        const item = NOTIFICATIONS[expanded]
        const openReason = noticeOpenReason(state, expanded)
        const dismissReason = refusal(state, { type: 'DISMISS_NOTIFICATION', id: expanded })
        return <><h3 className="type-card m-0">{item.title}</h3><p className="type-data my-2">{item.detail}</p><Button className="transition-none" disabled={!!openReason} disabledReason={openReason ?? undefined} onClick={() => act(props, { type: 'OPEN_SCREEN', screen: NOTICE_TARGETS[expanded] })}>{item.action}</Button><Button variant="outline" className="ml-2 transition-none" disabled={!!dismissReason} disabledReason={dismissReason ?? undefined} onClick={() => act(props, { type: 'DISMISS_NOTIFICATION', id: expanded })}>Dismiss</Button>{(openReason || dismissReason) && <p className="type-micro m-0 mt-1 text-muted-foreground">{openReason} {dismissReason}</p>}</>
      })()}
    </section>
  </>
}
