import type { Rect } from '@/film'

export const NOTIFICATIONS_ANCHORS = ['notifications', 'notification-filters', 'filter-all', 'filter-approvals', 'filter-incidents', 'filter-reminders', 'notice-N-01', 'notice-N-02', 'notice-N-03', 'notice-N-04', 'notice-N-05', 'notice-expanded'] as const
type Anchor = (typeof NOTIFICATIONS_ANCHORS)[number]
export const NOTIFICATIONS_ANCHOR_RECTS: Readonly<Record<Anchor, Rect>> = Object.freeze({
  notifications: { x: 508, y: 112, width: 724, height: 560 },
  'notification-filters': { x: 264, y: 112, width: 220, height: 560 },
  'filter-all': { x: 280, y: 176, width: 188, height: 40 },
  'filter-approvals': { x: 280, y: 220, width: 188, height: 40 },
  'filter-incidents': { x: 280, y: 264, width: 188, height: 40 },
  'filter-reminders': { x: 280, y: 308, width: 188, height: 40 },
  'notice-N-01': { x: 510, y: 176, width: 360, height: 92 },
  'notice-N-02': { x: 872, y: 176, width: 360, height: 92 },
  'notice-N-03': { x: 510, y: 280, width: 360, height: 92 },
  'notice-N-04': { x: 872, y: 280, width: 360, height: 92 },
  'notice-N-05': { x: 510, y: 384, width: 360, height: 92 },
  'notice-expanded': { x: 524, y: 492, width: 688, height: 164 },
})
export const NOTIFICATION_TOAST_ANCHORS = ['notification-toast', 'toast-dismiss', 'toast-open'] as const
type ToastAnchor = (typeof NOTIFICATION_TOAST_ANCHORS)[number]
export const NOTIFICATION_TOAST_ANCHOR_RECTS: Readonly<Record<ToastAnchor, Rect>> = Object.freeze({
  'notification-toast': { x: 896, y: 72, width: 360, height: 88 },
  'toast-dismiss': { x: 1176, y: 124, width: 68, height: 24 },
  'toast-open': { x: 932, y: 124, width: 228, height: 24 },
})
