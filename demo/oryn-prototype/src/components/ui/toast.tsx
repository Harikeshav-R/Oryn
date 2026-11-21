import { CircleAlert, CircleCheck, Info, OctagonX, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { visibleToast, type ToastItem, type ToastKind } from '@/lib/toast'
import { cn } from '@/lib/utils'

/**
 * CMP-11 toast region. Shows the one visible toast chosen by `visibleToast`; toasts never
 * stack. A toast is manual-dismiss only: there is no timer, and a critical notice persists.
 *
 * Geometry `[896,72,360,88]`, 8px radius, md shadow, z-60, enters y-12 to 0 over 150 ms
 * (reduced motion: static). A toast action navigates; it never resolves the object, and
 * a timeout toast is a warning, never a success.
 */
const ICONS: Record<ToastKind, LucideIcon> = {
  info: Info,
  warning: CircleAlert,
  danger: OctagonX,
  success: CircleCheck,
}

const KIND_LABEL: Record<ToastKind, string> = {
  info: 'Information',
  warning: 'Warning',
  danger: 'Critical',
  success: 'Success',
}

export function ToastRegion({
  toasts,
  onAction,
  onDismiss,
}: {
  toasts: readonly ToastItem[]
  onAction?: (toast: ToastItem) => void
  onDismiss: (toast: ToastItem) => void
}) {
  const toast = visibleToast(toasts)
  const Icon = toast ? ICONS[toast.kind] : null
  const critical = toast?.kind === 'danger'
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed right-6 top-[72px] z-[60] w-[360px]"
    >
      {toast && Icon && (
        <div
          key={toast.id}
          role={critical ? 'alert' : 'status'}
          data-anchor={toast.anchor}
          data-toast-kind={toast.kind}
          className={cn(
            'pointer-events-auto flex min-h-[88px] items-start gap-3 rounded-lg border bg-surface p-3 text-foreground shadow-md',
            'animate-in fade-in-0 slide-in-from-top-3 duration-150',
            critical && 'border-danger',
          )}
        >
          <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <p className="type-card">
              <span className="sr-only">{KIND_LABEL[toast.kind]}: </span>
              {toast.title}
            </p>
            {toast.description && <p className="mt-1 type-data text-muted-foreground">{toast.description}</p>}
            {toast.actionLabel && (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => onAction?.(toast)}>
                {toast.actionLabel}
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon" icon={<X />} aria-label="Dismiss notification" onClick={() => onDismiss(toast)} />
        </div>
      )}
    </div>
  )
}
