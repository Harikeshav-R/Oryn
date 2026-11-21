import type { ReactNode } from 'react'

/** Shared layout for the development specimens (`?view=controls`, `?view=overlays`). */

export const buttonClass =
  'inline-flex h-8 items-center gap-2 rounded-md border bg-surface px-3 type-data text-foreground transition-colors hover:bg-surface-2'

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t pt-6">
      <h2 id={id} className="type-section">
        {title}
      </h2>
      <div className="mt-4 space-y-6">{children}</div>
    </section>
  )
}

export function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 type-card">{title}</h3>
      {children}
    </div>
  )
}
