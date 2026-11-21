import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { useOverlayContainer } from '@/components/ui/overlay-context'
import { ROLES, type Role } from '@/data/labels'
import { ORGANIZATION_SELECTOR, PEOPLE } from '@/data/people'

export interface RoleSelectorProps {
  /** Selected fixture identity, independent of financial delegation. */
  personId: string
  /** Explicitly granted fixture identity IDs; no identity is granted by default. */
  grantedPersonIds: readonly string[]
  onPersonChange: (personId: string) => void
  /** Optional controlled menu state for frame-driven capture. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const identities = PEOPLE.filter((person) => ROLES.some((role) => role === person.role))

/** CMP-37: switching a granted viewpoint never grants private evidence or approval authority. */
export function RoleSelector({ personId, grantedPersonIds, onPersonChange, open, onOpenChange }: RoleSelectorProps) {
  const container = useOverlayContainer()
  const current = identities.find((person) => person.id === personId)
  const currentGranted = current !== undefined && grantedPersonIds.includes(current.id)

  return (
    <SelectPrimitive.Root
      value={currentGranted ? personId : undefined}
      open={open}
      onOpenChange={onOpenChange}
      onValueChange={(next) => {
        if (grantedPersonIds.includes(next) && identities.some((person) => person.id === next)) onPersonChange(next)
      }}
    >
      <SelectPrimitive.Trigger
        data-anchor="role-selector"
        aria-label={`Organization and role: ${ORGANIZATION_SELECTOR}, ${currentGranted ? `${current.name}, ${current.role}` : 'unavailable identity'}`}
        className="flex h-12 w-52 items-center gap-2 rounded-md border bg-surface px-2 text-left outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar name={current?.name ?? ORGANIZATION_SELECTOR} />
        <span className="min-w-0 flex-1">
          <span className="block truncate type-data">{ORGANIZATION_SELECTOR}</span>
          <span className="block truncate type-micro text-muted-foreground">{currentGranted ? current.role : 'Identity unavailable'}</span>
        </span>
        <SelectPrimitive.Icon asChild><ChevronDown aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={container}>
        <SelectPrimitive.Content position="popper" sideOffset={8} collisionPadding={8} className="z-20 w-72 max-w-[var(--radix-select-content-available-width)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
          <SelectPrimitive.Viewport className="p-1">
            {ROLES.map((role: Role) => (
              <SelectPrimitive.Group key={role}>
                <SelectPrimitive.Label className="px-3 pb-1 pt-2 type-micro text-muted-foreground">{role}</SelectPrimitive.Label>
                {identities.filter((person) => person.role === role).map((person) => {
                  const granted = grantedPersonIds.includes(person.id)
                  return (
                    <SelectPrimitive.Item key={person.id} value={person.id} disabled={!granted} className="relative flex min-h-8 select-none items-center gap-2 rounded-md px-3 py-1 pr-8 type-data outline-none data-[highlighted]:bg-surface-2 data-[disabled]:text-muted-foreground">
                      <SelectPrimitive.ItemText>{person.name}</SelectPrimitive.ItemText>
                      {!granted && <span className="ml-auto type-micro">Not granted</span>}
                      <SelectPrimitive.ItemIndicator className="absolute right-3"><Check aria-hidden="true" className="size-4" strokeWidth={1.75} /></SelectPrimitive.ItemIndicator>
                    </SelectPrimitive.Item>
                  )
                })}
              </SelectPrimitive.Group>
            ))}
          </SelectPrimitive.Viewport>
          <div className="border-t px-3 py-2 type-micro text-muted-foreground">Role selection grants neither private evidence access nor financial approval. Delegation is checked separately.</div>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
