import { Avatar } from '@/components/ui/avatar'
import type { Role } from '@/data/labels'

/**
 * CMP-12 identity chip: 32px avatar (initials fallback), name, and an optional role label.
 * The role is a viewpoint label only. It never implies authority and is not a switch.
 */
export function UserChip({ name, role, src }: { name: string; role?: Role | string; src?: string }) {
  return (
    <div className="inline-flex items-center gap-3">
      <Avatar name={name} src={src} />
      <div className="min-w-0">
        <p className="type-body text-foreground">{name}</p>
        {role && <p className="type-micro text-muted-foreground">{role}</p>}
      </div>
    </div>
  )
}
