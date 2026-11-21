import { CircleAlert } from 'lucide-react'
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * CMP-04 input and textarea. White/dark surface, 1px border, 6px radius, mono 12/18,
 * 2px focus ring from the global :focus-visible rule. Border and focus ring animate 150 ms.
 *
 * States: empty, focused, filled, readonly, invalid, disabled.
 * - Invalid always has text: `Field` renders the error and links it with `aria-describedby`.
 * - Nothing here submits. Escape is left to the enclosing palette, never handled by a field.
 */
const base =
  'w-full rounded-md border bg-surface px-3 type-data text-foreground placeholder:text-muted-foreground transition-colors ' +
  'read-only:bg-surface-2 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted-foreground'

function stateClass(invalid: boolean | undefined) {
  return invalid ? 'border-danger' : 'border-border hover:border-trace'
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 40px default, 32px dense. */
  density?: 'default' | 'dense'
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { density = 'default', invalid, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(base, density === 'dense' ? 'h-8' : 'h-10', stateClass(invalid), className)}
      {...rest}
    />
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(base, 'min-h-[72px] py-3', stateClass(invalid), className)}
      {...rest}
    />
  )
})

export interface FieldControlProps {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
}

/**
 * Label (4px gap), control, hint (4px gap) and error. The label is associated with
 * `htmlFor`; hint and error are linked with `aria-describedby`.
 */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string
  hint?: ReactNode
  error?: string
  children: (control: FieldControlProps) => ReactNode
  className?: string
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : undefined, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="type-body font-medium">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && (
        <p id={hintId} className="type-micro text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1 type-data text-foreground">
          <CircleAlert aria-hidden="true" className="size-3.5 shrink-0 text-danger" strokeWidth={1.75} />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
