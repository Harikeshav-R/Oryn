import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import type { Rect } from '@/film'
import { cn } from '@/lib/utils'
import { filmAnchor } from './contract'
import { at } from './geometry'

/**
 * Components for SC02 and SC03. A `Frame` is a 1px-bordered box whose children are positioned from
 * the box's own border-box origin (the inner layer cancels the border), which keeps child
 * coordinates equal to `parent + local` with no off-by-one.
 */

/** Stand-ins for anchors that have no visible element in the current view: present, and hidden. */
export function HiddenAnchors({ names }: { readonly names: readonly string[] }) {
  return (
    <>
      {names.map((name) => (
        <div key={name} {...filmAnchor(name)} aria-hidden="true" style={{ display: 'none' }} />
      ))}
    </>
  )
}

export interface FrameProps extends Omit<HTMLAttributes<HTMLElement>, 'style' | 'className' | 'children'> {
  readonly rect: Rect
  readonly anchor?: string
  readonly visible?: boolean
  readonly as?: 'div' | 'section'
  readonly className?: string
  readonly style?: CSSProperties
  readonly children?: ReactNode
}

export function Frame({ rect, anchor, visible = true, as: Tag = 'div', className, style, children, ...rest }: FrameProps) {
  return (
    <Tag
      {...rest}
      {...(anchor ? filmAnchor(anchor) : {})}
      className={cn('box-border rounded-lg border bg-surface', className)}
      style={{ ...at(rect), ...style, ...(visible ? {} : { display: 'none' }) }}
    >
      <div style={{ position: 'absolute', left: -1, top: -1, width: rect.width, height: rect.height }}>{children}</div>
    </Tag>
  )
}

export interface CheckRowProps {
  readonly id: string
  readonly label: string
  readonly checked: boolean
  readonly locked?: boolean
  /** Visible explanation of a locked row, read by assistive tech through `aria-describedby`. */
  readonly reason?: string
  readonly trailing?: ReactNode
  readonly onCheckedChange?: (checked: boolean) => void
  readonly rect: Rect
  readonly anchor?: string
  readonly visible?: boolean
  /** Film: no CSS transition on the checkbox. */
  readonly flat?: boolean
  readonly className?: string
}

/** CMP-13 row: the whole 32px row is the label, so clicking anywhere on it toggles the checkbox. */
export function CheckRow({ id, label, checked, locked = false, reason, trailing, onCheckedChange, rect, anchor, visible = true, flat = false, className }: CheckRowProps) {
  const reasonId = `${id}-reason`
  return (
    <label
      htmlFor={id}
      {...(anchor ? filmAnchor(anchor) : {})}
      data-locked={locked ? 'true' : undefined}
      className={cn('flex items-center gap-3 type-data', locked ? 'cursor-not-allowed' : 'cursor-pointer', className)}
      style={visible ? at(rect) : { ...at(rect), display: 'none' }}
    >
      <Checkbox
        id={id}
        checked={checked}
        locked={locked}
        aria-describedby={locked && reason ? reasonId : undefined}
        className={flat ? 'transition-none' : undefined}
        onCheckedChange={(value) => onCheckedChange?.(value === true)}
      />
      <span>{label}</span>
      {(trailing || reason) && (
        <span className="ml-auto flex items-center gap-2">
          {trailing}
          {reason && (
            <span id={reasonId} className="type-micro text-muted-foreground">
              {reason}
            </span>
          )}
        </span>
      )}
    </label>
  )
}
