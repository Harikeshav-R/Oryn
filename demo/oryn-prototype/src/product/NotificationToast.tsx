import { AlertTriangle, Clock, Square } from 'lucide-react'
import { NOTIFICATIONS } from '@/data/notifications'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { anchored } from './geometry'
import { NOTICE_TARGETS, noticeDetails, noticeOpenReason } from './notifications'
import { NOTIFICATION_TOAST_ANCHOR_RECTS as R } from './notifications-layout'

export function NotificationToast(props: ProductProps) {
  const id = props.state.ui.breadth.notifications.toast
  const progress = props.film?.reducedMotion ? 1 : motionProgress(props.film, 'SURFACE_TOAST')
  const item = id ? NOTIFICATIONS[id] : null
  const reason = id ? noticeOpenReason(props.state, id) : null
  const Icon = id === 'N-01' ? AlertTriangle : id === 'N-03' ? Clock : Square
  return <>
    <div {...anchored('notification-toast', R['notification-toast'], id !== null)} className="z-[60] box-border rounded-lg border bg-surface p-3 shadow-md">
      {item && <div style={{ opacity: progress, transform: `translateY(${(1 - progress) * -12}px)` }}><p className="type-data m-0 flex items-center gap-2 font-semibold"><Icon size={16} aria-hidden="true" />{item.title}</p><p className="type-micro m-0 ml-6">{noticeDetails(id!)}</p></div>}
    </div>
    <button type="button" {...anchored('toast-open', R['toast-open'], id !== null)} className="z-[60] text-left type-micro underline" aria-disabled={!!reason} title={reason ?? undefined} onClick={() => { if (id && !reason) act(props, { type: 'OPEN_SCREEN', screen: NOTICE_TARGETS[id] }) }}>{item?.action}{reason ? ` — ${reason}` : ''}</button>
    <button type="button" {...anchored('toast-dismiss', R['toast-dismiss'], id !== null)} className="z-[60] type-micro underline" onClick={() => act(props, { type: 'DISMISS_TOAST' })}>Dismiss</button>
  </>
}
