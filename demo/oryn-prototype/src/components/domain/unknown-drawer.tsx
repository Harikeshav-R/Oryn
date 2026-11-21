import { Info, Search } from 'lucide-react'
import { useState, type RefObject } from 'react'
import { StatusBadge } from '@/components/domain/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DrawerContent } from '@/components/ui/dialog'
import { Hatch } from '@/components/ui/hatch'
import { Tooltip } from '@/components/ui/tooltip'
import { UNKNOWN_FACTS, UNKNOWN_INVOICE, type JobCounts } from '@/data/approval'
import { formatCents } from '@/data/invoices'

/**
 * CMP-09 / SC24 unknown-outcome drawer for INV-48220.
 *
 * There is no retry, resubmit or approval control anywhere in it. "Resubmit unavailable"
 * is a status, not a disabled button, with a focusable info icon whose tooltip carries the
 * rule. The hatch is a separate square beside the labels, never behind text. A timeout
 * proves neither failure nor submission, so custody and readback stay explicitly unknown,
 * and approving some other case never changes this one: the unknown count is shown from
 * the shared counts, not stored here.
 */
export function UnknownDrawer({
  open,
  onOpenChange,
  counts,
  initialInvestigating = false,
  onInvestigate,
  returnFocusRef,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  counts: JobCounts
  initialInvestigating?: boolean
  onInvestigate?: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        anchor="unknown-drawer"
        title={UNKNOWN_INVOICE.invoice}
        description={UNKNOWN_INVOICE.supplier}
        returnFocusRef={returnFocusRef}
        footer={
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        }
      >
        <UnknownBody counts={counts} initialInvestigating={initialInvestigating} onInvestigate={onInvestigate} />
      </DrawerContent>
    </Dialog>
  )
}

function UnknownBody({
  counts,
  initialInvestigating,
  onInvestigate,
}: {
  counts: JobCounts
  initialInvestigating: boolean
  onInvestigate?: () => void
}) {
  // Local on purpose: the drawer unmounts on close, so every opening starts uninvestigated.
  const [investigating, setInvestigating] = useState(initialInvestigating)
  return (
    <div className="space-y-6">
      <ul className="rounded-lg border px-3" aria-label="Invoice and purchase order">
        <li className="border-b py-2 type-data">Invoice {formatCents(UNKNOWN_INVOICE.amountCents)}</li>
        <li className="py-2 type-data">{UNKNOWN_INVOICE.po}</li>
      </ul>

      <section aria-labelledby="unknown-status" data-anchor="unknown-status" className="rounded-lg border p-4">
        <h3 id="unknown-status" className="sr-only">
          Status
        </h3>
        <div className="flex items-start gap-4">
          <Hatch className="size-14 rounded-sm border border-foreground" />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="unknown" />
              <span aria-hidden="true" className="type-data text-muted-foreground">
                &middot;
              </span>
              <StatusBadge status="held" />
            </div>
            <p className="type-data">{UNKNOWN_FACTS.cause}</p>
            <p className="type-data">{UNKNOWN_FACTS.reconciliation}</p>
            <p className="type-data">{UNKNOWN_FACTS.custody}</p>
          </div>
        </div>
        <p className="mt-4 border-t pt-3 type-data">{UNKNOWN_FACTS.guidance}</p>
        <p className="mt-1 type-data">{UNKNOWN_FACTS.rule}</p>
      </section>

      <div className="flex items-center gap-2 type-data text-muted-foreground" data-resubmit-status="">
        <span>{UNKNOWN_FACTS.unavailable}</span>
        <Tooltip content={UNKNOWN_FACTS.rule} side="right">
          <button
            type="button"
            aria-label="Why resubmit is unavailable"
            className="inline-flex size-6 items-center justify-center rounded-sm text-foreground hover:bg-surface-2"
          >
            <Info aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>

      <section aria-labelledby="unknown-post" className="space-y-2">
        <h3 id="unknown-post" className="type-card">
          {UNKNOWN_FACTS.postcondition}
        </h3>
        <div className="rounded-lg border p-3 type-data">
          <p>{UNKNOWN_FACTS.missingReadback}</p>
          <p className="mt-1 text-muted-foreground">
            A timeout proves neither failure nor submission. Custody stays unknown until reconciliation.
          </p>
        </div>
        {investigating && (
          <p role="status" data-investigation="" className="rounded-lg border p-3 type-data">
            Investigation opened. Evidence available: the timeout record. Readback is missing, so nothing here counts as verified.
          </p>
        )}
        <Button
          variant="outline"
          icon={<Search />}
          onClick={() => {
            setInvestigating(true)
            onInvestigate?.()
          }}
        >
          Investigate
        </Button>
      </section>

      <p className="type-data" data-unknown-count="">
        <Badge variant="neutral">Outcome Unknown {counts.unknown} of 11</Badge>
      </p>
    </div>
  )
}
