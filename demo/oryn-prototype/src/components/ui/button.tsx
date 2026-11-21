import { cva } from 'class-variance-authority'
import { forwardRef, useId, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { OrbitNode } from '@/components/domain/orbit'
import { pressScale } from '@/lib/frame'
import { cn } from '@/lib/utils'

/**
 * CMP-03 button. Heights 32/40/44 and icon 40 (44px hit area); mono 12/18; 6px radius.
 * No cyan fill: arc appears only on the loading ring while `executing` is true.
 *
 * - Disabled uses `aria-disabled`, not the native attribute, so the button stays in the
 *   tab order and `disabledReason` is reachable by keyboard and assistive tech.
 * - Loading shows a neutral ring in place of the icon and never a success mark.
 * - The button owns no business logic: `onClick` is the caller's guarded action and is
 *   not called while disabled or loading.
 * - `pressFrame` is the film press: frames since the click started; scale ramps to .97
 *   over 90 ms and holds. `null` = not pressed. Interactive :active uses the same scale.
 */
const buttonVariants = cva(
  [
    'oryn-press relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md border type-data',
    'aria-disabled:cursor-not-allowed aria-disabled:border-border aria-disabled:bg-surface-2 aria-disabled:text-muted-foreground aria-disabled:hover:bg-surface-2 aria-disabled:hover:text-muted-foreground',
  ],
  {
    variants: {
      variant: {
        primary: 'border-primary bg-primary text-primary-foreground hover:border-foreground hover:bg-background hover:text-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-border',
        outline: 'border-border bg-surface text-foreground hover:bg-surface-2',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-surface-2',
        danger: 'border-danger bg-surface text-foreground hover:bg-surface-2',
        link: 'h-auto rounded-sm border-transparent bg-transparent px-0 text-foreground underline underline-offset-4 hover:bg-transparent',
      },
      size: {
        sm: 'h-8 px-3',
        default: 'h-10 px-4',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10 p-0 before:absolute before:-inset-[2px] before:content-[""]',
      },
    },
    compoundVariants: [
      // A link is text: it never takes a control height or horizontal padding.
      { variant: 'link', size: ['sm', 'default', 'lg'], class: 'h-auto px-0' },
    ],
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Leading 16px icon. Replaced by the loading ring while loading. */
  icon?: ReactNode
  trailingIcon?: ReactNode
  disabled?: boolean
  /** Names the missing prerequisite. Required in practice whenever `disabled` is true. */
  disabledReason?: string
  loading?: boolean
  /** Accessible text for the loading state. Never implies success. */
  loadingLabel?: string
  /** True only while the action is really executing: the ring node turns arc. */
  executing?: boolean
  /** Film frame for the loading ring orbit. Defaults to a static frame. */
  frame?: number
  pressFrame?: number | null
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'default',
    icon,
    trailingIcon,
    disabled = false,
    disabledReason,
    loading = false,
    loadingLabel = 'In progress',
    executing = false,
    frame = 0,
    pressFrame = null,
    className,
    style,
    children,
    onClick,
    type = 'button',
    'aria-describedby': describedBy,
    ...rest
  },
  ref,
) {
  const reasonId = useId()
  const blocked = disabled || loading
  const showReason = disabled && Boolean(disabledReason)
  const ring = <OrbitNode frame={frame} running={executing} size={16} decorative />
  const pressStyle = pressFrame === null ? undefined : ({ '--press-scale': pressScale(pressFrame) } as CSSProperties)
  const hasLeading = Boolean(icon)
  const label = size === 'icon' ? null : children

  return (
    <button
      ref={ref}
      type={type}
      data-anchor="action-button"
      data-variant={variant}
      data-loading={loading ? 'true' : undefined}
      data-pressed={pressFrame === null ? undefined : 'true'}
      aria-disabled={blocked || undefined}
      aria-busy={loading || undefined}
      aria-describedby={[describedBy, showReason ? reasonId : undefined].filter(Boolean).join(' ') || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      style={{ ...pressStyle, ...style }}
      onClick={(event) => {
        if (blocked) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      {...rest}
    >
      {loading && !hasLeading && size !== 'icon' && (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          {ring}
        </span>
      )}
      {loading && hasLeading ? (
        <span aria-hidden="true" className="inline-flex size-4 items-center justify-center">
          {ring}
        </span>
      ) : loading && size === 'icon' ? (
        <span aria-hidden="true" className="inline-flex size-4 items-center justify-center">
          {ring}
        </span>
      ) : (
        icon && <span aria-hidden="true" className="inline-flex size-4 items-center justify-center">{icon}</span>
      )}
      {label !== null && label !== undefined && (
        <span className={cn(loading && !hasLeading && 'opacity-0')}>{label}</span>
      )}
      {trailingIcon && !loading && (
        <span aria-hidden="true" className="inline-flex size-4 items-center justify-center">{trailingIcon}</span>
      )}
      {loading && <span className="sr-only">{loadingLabel}</span>}
      {showReason && <span id={reasonId} className="sr-only">{`Unavailable: ${disabledReason}`}</span>}
    </button>
  )
})
