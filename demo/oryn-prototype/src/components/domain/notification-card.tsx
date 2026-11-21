import { BellRing, Clock3, GitPullRequest, ShieldAlert, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { isNotificationEligible, NOTIFICATIONS, type NotificationEligibility, type NotificationId, type NotificationTarget } from '@/data/notifications'

export interface NotificationCardProps extends NotificationEligibility {
  id: NotificationId
  read?: boolean
  expanded?: boolean
  overlay?: boolean
  /** Frames elapsed since the explicit presentation event; omit for a settled card. */
  entryFrame?: number
  reducedMotion?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onOpen?: (target: NotificationTarget) => void
  /** Removes only the notice; it must not resolve its target. */
  onDismiss?: (id: NotificationId) => void
}

export function NotificationCard({ id, recipient, approvalRequired, incidentContained, commitmentConfirmed, regressionPassed, releaseAuthorized, canAccess, dismissed = [], read = false, expanded = true, overlay = false, entryFrame, reducedMotion = false, onExpandedChange, onOpen, onDismiss }: NotificationCardProps) {
  const item = NOTIFICATIONS[id]
  if (!isNotificationEligible(id, { recipient, approvalRequired, incidentContained, commitmentConfirmed, regressionPassed, releaseAuthorized, canAccess, dismissed })) return null
  const Icon = id === 'N-01' ? ShieldAlert : id === 'N-02' ? Square : id === 'N-03' ? Clock3 : id === 'N-04' ? GitPullRequest : BellRing
  const progress = reducedMotion || entryFrame === undefined ? 1 : Math.min(1, Math.max(0, entryFrame / 4.5))

  return (
    <article data-anchor="notification-card" aria-label={item.title} className={cn('flex w-[360px] max-w-full gap-3 rounded border bg-surface p-3 text-foreground', overlay && 'shadow-md')} style={{ opacity: progress, transform: overlay ? `translateY(${(1 - progress) * -12}px)` : undefined }}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><h3 className="text-sm font-semibold leading-5">{item.title}</h3><span className="sr-only">{read ? 'Read' : 'Unread'}</span></div>
          {onDismiss && <button type="button" aria-label="Dismiss" onClick={() => onDismiss(id)} className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2"><X aria-hidden="true" className="size-4" /></button>}
        </div>
        <p className="type-data text-muted-foreground">{item.detail}</p>
        {expanded && <Button variant="link" size="sm" className="h-auto p-0" disabled={!onOpen} disabledReason="Target unavailable" onClick={() => { if (canAccess(item.target)) onOpen?.(item.target) }}>{item.action}</Button>}
        {onExpandedChange && <button type="button" aria-expanded={expanded} onClick={() => onExpandedChange(!expanded)} className="ml-2 text-xs underline underline-offset-2">{expanded ? 'Collapse' : 'Expand'}</button>}
      </div>
    </article>
  )
}
