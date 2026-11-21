import { NOTIFICATIONS } from '@/data/notifications'
import type { NotificationId } from '@/data/notifications'
import { noticeOccurred, visibleNotifications } from '@/state'
import type { NotificationFilter, ScreenId, State } from '@/state'
import { roleOf } from './destinations'
import { refusal } from './discovery'
import { incidentAccess } from './incident'
import { jobAccess } from './job'
import { releaseAccess } from './release'

export const NOTICE_IDS = ['N-01', 'N-02', 'N-03', 'N-04', 'N-05'] as const
export const NOTICE_TARGETS: Readonly<Record<NotificationId, ScreenId>> = { 'N-01': 'SC23', 'N-02': 'SC26', 'N-03': 'SC11', 'N-04': 'SC28', 'N-05': 'SC29' }

export function noticesFor(state: State): readonly NotificationId[] {
  const role = roleOf(state)
  if (role === null) return []
  const notices = role === 'Employee' ? visibleNotifications(state) : NOTICE_IDS.filter((id) => noticeOccurred(state, id) && !state.notificationsDismissed.includes(id))
  const filter = state.ui.breadth.notifications.filter
  return notices.filter((id) => filter === 'all' || noticeFilter(id) === filter)
}

export function noticeFilter(id: NotificationId): NotificationFilter {
  return id === 'N-01' ? 'approvals' : id === 'N-03' ? 'reminders' : 'incidents'
}

export function noticeOpenReason(state: State, id: NotificationId): string | null {
  const access = id === 'N-01' ? jobAccess(state) : id === 'N-03' ? (state.actorId === 'priya' ? { ok: true as const } : { ok: false as const, reason: 'Only Priya can view this commitment.' }) : id === 'N-05' ? releaseAccess(state) : incidentAccess(state)
  if (!access.ok) return access.reason
  return refusal(state, { type: 'OPEN_SCREEN', screen: NOTICE_TARGETS[id] })
}

export const noticeDetails = (id: NotificationId): string => id === 'N-02' ? '3 affected cases paused' : NOTIFICATIONS[id].detail
