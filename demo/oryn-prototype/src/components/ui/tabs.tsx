import * as TabsPrimitive from '@radix-ui/react-tabs'
import { createContext, useContext, type ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * CMP-05 tabs (Radix). `underline`: 40px bar, 24px gaps, 2px neutral underline.
 * `segmented`: a 6px control track. TabsTrigger lives inside TabsList; arrow keys and
 * Home/End come from Radix. Selecting a tab only changes the visible panel: tabs never
 * start work or grant authority. Selection is neutral foreground, never arc.
 */
type TabsVariant = 'underline' | 'segmented'
const VariantContext = createContext<TabsVariant>('underline')

export function Tabs({
  variant = 'underline',
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & { variant?: TabsVariant }) {
  return (
    <VariantContext.Provider value={variant}>
      <TabsPrimitive.Root {...props} />
    </VariantContext.Provider>
  )
}

export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  const variant = useContext(VariantContext)
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center',
        variant === 'underline' ? 'h-10 gap-6 border-b' : 'h-10 gap-1 rounded-md border bg-surface-2 p-1',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  const variant = useContext(VariantContext)
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap type-data text-muted-foreground transition-colors',
        'hover:text-foreground data-[state=active]:text-foreground',
        'disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-60 disabled:hover:text-muted-foreground',
        variant === 'underline'
          ? '-mb-px h-10 border-b-2 border-transparent data-[state=active]:border-foreground'
          : 'h-8 rounded-sm border border-transparent px-3 data-[state=active]:border-border data-[state=active]:bg-surface',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('pt-4', className)} {...props} />
}
