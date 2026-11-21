/**
 * CMP-11 toast model. Exactly one toast is visible at a time: the highest-priority item
 * (danger, then warning, then info, then success; first in the list wins a tie). The rest
 * wait in the queue and appear only after the visible one is dismissed, so toasts never
 * stack.
 */
export type ToastKind = 'info' | 'warning' | 'danger' | 'success'

export interface ToastItem {
  id: string
  kind: ToastKind
  title: string
  description?: string
  actionLabel?: string
  /** Film anchor, e.g. `timeout-toast`. */
  anchor?: string
}

const PRIORITY: Record<ToastKind, number> = { danger: 0, warning: 1, info: 2, success: 3 }

/** The one toast to show, or `null`. */
export function visibleToast(toasts: readonly ToastItem[]): ToastItem | null {
  let best: ToastItem | null = null
  for (const toast of toasts) {
    if (best === null || PRIORITY[toast.kind] < PRIORITY[best.kind]) best = toast
  }
  return best
}
