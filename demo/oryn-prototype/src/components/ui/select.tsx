import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * CMP-05 select (Radix). 40px trigger (32px dense), 32px rows, 16px chevron, 6px controls,
 * 8px popover with shadow-md at z-20. Arrow keys, Home/End, Enter, typeahead and Escape come
 * from Radix. Choosing a value only reports it: a role is a viewpoint and confers no authority.
 *
 * A disabled option cannot take focus, so its reason is rendered inline in the row.
 * The anchor `role-select` marks the trigger for film timelines.
 */
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  /** Why the option is unavailable. Shown in the row. */
  reason?: string
}

export interface SelectProps {
  id?: string
  options: readonly SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  /** Controlled open state, for film frames. Omit for interactive use. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  invalid?: boolean
  density?: 'default' | 'dense'
  anchor?: string
  className?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    id,
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    open,
    onOpenChange,
    disabled,
    invalid,
    density = 'default',
    anchor = 'role-select',
    className,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const isInvalid = invalid || ariaInvalid
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      open={open}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        data-anchor={anchor}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 type-data text-foreground transition-colors',
          'data-[placeholder]:text-muted-foreground data-[state=open]:bg-surface-2',
          'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted-foreground',
          density === 'dense' ? 'h-8' : 'h-10',
          isInvalid ? 'border-danger' : 'border-border hover:border-trace',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-20 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'relative flex h-8 cursor-default select-none items-center gap-3 rounded-md pl-3 pr-8 type-data outline-none transition-colors',
                  'data-[highlighted]:bg-surface-2 data-[disabled]:text-muted-foreground',
                )}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                {option.disabled && option.reason && (
                  <span className="ml-auto whitespace-nowrap type-micro text-muted-foreground">{option.reason}</span>
                )}
                <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex">
                  <Check aria-hidden="true" className="size-4" strokeWidth={1.75} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
})
