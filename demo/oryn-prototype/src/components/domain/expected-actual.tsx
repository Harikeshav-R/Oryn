import { CircleCheck, CircleX } from 'lucide-react'
import { EvidenceCard, type EvidenceCardState } from '@/components/domain/evidence-card'

export type ExpectedActualVariant = 'boundary' | 'incident' | 'source-missing'

export interface ExpectedActualProps {
  variant?: ExpectedActualVariant
  /** Inaccessible sources do not expose their contents or invoke the callback. */
  sourceState?: Extract<EvidenceCardState, 'available' | 'restricted' | 'unavailable'>
  sourceUnavailableReason?: string
  onOpenSource?: (id: string) => void
}

export function ExpectedActual({ variant = 'incident', sourceState = 'available', sourceUnavailableReason, onOpenSource }: ExpectedActualProps) {
  const boundary = variant === 'boundary'
  const missing = variant === 'source-missing'
  const accessible = !missing && sourceState === 'available'

  return (
    <section data-anchor="expected-actual" aria-label="Expected versus actual" className={`min-w-0 rounded border bg-surface text-foreground ${variant === 'incident' ? 'min-h-[140px]' : ''}`}>
      <div className="grid grid-cols-2">
        <div className="min-w-0 border-r p-3">
          <p className="type-data text-muted-foreground">Expected</p>
          <p className="mt-2 flex items-start gap-2 text-sm leading-5"><CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span>{boundary ? 'accept' : 'verifiable invoice total'}</span></p>
        </div>
        <div className="min-w-0 p-3">
          <p className="type-data text-muted-foreground">Actual</p>
          <p className="mt-2 flex items-start gap-2 text-sm leading-5"><CircleX aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" /><span>{boundary ? 'escalate' : 'cannot verify'}</span></p>
        </div>
      </div>
      <div className="border-t px-3 py-2">
        {boundary ? (
          <><p className="mb-2 text-xs text-muted-foreground">SCN-022 · variance_exactly_2.00pct</p><EvidenceCard source="rule009" state={sourceState} compact reason={sourceUnavailableReason} onOpenSource={onOpenSource} /></>
        ) : missing ? (
          <p className="text-xs text-muted-foreground">Source unavailable</p>
        ) : (
          <details>
            <summary className="cursor-pointer text-xs font-medium underline underline-offset-2">{accessible ? 'Invoice $4,213.50 · PO $4,175.00 · handling $38.50' : 'Source evidence unavailable'}</summary>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              <div><EvidenceCard source="invoice" state={sourceState} compact reason={sourceUnavailableReason} onOpenSource={onOpenSource} />{accessible && <p className="mt-1 text-xs">Invoice $4,213.50</p>}</div>
              <div><EvidenceCard source="purchaseOrder" state={sourceState} compact reason={sourceUnavailableReason} onOpenSource={onOpenSource} />{accessible && <p className="mt-1 text-xs">PO $4,175.00</p>}</div>
              <div><EvidenceCard source="handling" state={sourceState} compact reason={sourceUnavailableReason} onOpenSource={onOpenSource} />{accessible && <p className="mt-1 text-xs">$38.50 handling line after subtotal</p>}</div>
              <div><EvidenceCard source="rule017" state={sourceState} compact reason={sourceUnavailableReason} onOpenSource={onOpenSource} />{accessible && <p className="mt-1 text-xs">Approved terms cover handling fee</p>}</div>
            </div>
          </details>
        )}
      </div>
    </section>
  )
}
