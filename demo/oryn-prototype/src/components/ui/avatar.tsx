import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { initials } from '@/data/people'
import { cn } from '@/lib/utils'

/**
 * CMP-12 avatar: 32px neutral circle. The image is optional and never invented; when it
 * is missing or fails to load, the initials fallback shows. The accessible name is the
 * full name, so the fallback letters are not read as a word.
 */
export function Avatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  return (
    <AvatarPrimitive.Root
      role="img"
      aria-label={name}
      className={cn('relative inline-flex size-8 shrink-0 overflow-hidden rounded-full border bg-surface-2', className)}
    >
      {src && <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" />}
      <AvatarPrimitive.Fallback
        aria-hidden="true"
        className="flex size-full items-center justify-center type-micro text-foreground"
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
