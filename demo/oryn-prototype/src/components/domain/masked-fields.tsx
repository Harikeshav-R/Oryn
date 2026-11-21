import { PROTECTED_FIELD_LABELS } from '@/data/consent'
import { cn } from '@/lib/utils'

/** Protected values are deliberately not accepted as props or stored in the DOM. */
export function MaskedFields({ className }: { className?: string }) {
  return (
    <section data-anchor="masked-fields" aria-label="Mandatory exclusions" className={cn('w-full min-w-0 max-w-[480px] rounded-lg border bg-surface p-4', className)}>
      <p className="mb-2 text-xs text-muted-foreground">Mandatory exclusion · always masked</p>
      {PROTECTED_FIELD_LABELS.map((label) => (
        <div key={label} className="flex min-h-10 items-center justify-between gap-4">
          <span className="font-mono text-[14px] leading-5">{label}</span>
          <span role="img" aria-label={`${label}: masked`} className="h-6 w-40 max-w-[50%] rounded-sm border" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 5px, currentColor 5px 6px)', color: 'var(--muted-foreground)' }} />
        </div>
      ))}
    </section>
  )
}
