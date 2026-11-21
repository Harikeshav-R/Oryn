import { ArrowRight, Lightbulb, ListChecks, X } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'

export type HudCardVariant = 'peerFix' | 'commitment' | 'guide'

export interface HudCardProps {
  /** Render one card in a host placement beside, never over, the active field. */
  variant: HudCardVariant
  /** Commitment reminders require the confirmed commitment and Kestrel vendor context. */
  vendor?: string
  commitmentConfirmed?: boolean
  dismissed?: boolean
  /** Frames elapsed since the explicit presentation event; omit for a settled card. */
  entryFrame?: number
  reducedMotion?: boolean
  onDismiss?: () => void
}

const GUIDE_STEPS = [
  'Check the vendor tax ID format',
  'Update the permitted field',
  'Review the result',
] as const

export function HudCard({ variant, vendor, commitmentConfirmed = false, dismissed = false, entryFrame, reducedMotion = false, onDismiss }: HudCardProps) {
  if (dismissed || (variant === 'commitment' && (!commitmentConfirmed || !/^kestrel(?: components)?$/i.test(vendor?.trim() ?? '')))) return null
  const progress = reducedMotion || entryFrame === undefined ? 1 : Math.min(1, Math.max(0, entryFrame / 4.5))
  return <HudContent key={variant} variant={variant} onDismiss={onDismiss} opacity={progress} />
}

function HudContent({ variant, onDismiss, opacity }: { variant: HudCardVariant; onDismiss?: () => void; opacity: number }) {
  const [guideOpen, setGuideOpen] = useState(variant === 'guide')
  const [step, setStep] = useState(0)
  const guideTrigger = useRef<HTMLButtonElement>(null)
  const guideStep = useRef<HTMLParagraphElement>(null)
  const restoreFocus = useRef(false)
  const isCommitment = variant === 'commitment'
  const Icon = guideOpen ? ListChecks : isCommitment ? ListChecks : Lightbulb

  useEffect(() => {
    if (guideOpen) {
      guideStep.current?.focus()
    } else if (restoreFocus.current) {
      guideTrigger.current?.focus()
      restoreFocus.current = false
    }
  }, [guideOpen])

  function closeGuide() {
    restoreFocus.current = true
    setGuideOpen(false)
    setStep(0)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && onDismiss) {
      event.stopPropagation()
      onDismiss()
    }
  }

  return (
    <aside data-anchor="hud-card" aria-label={isCommitment ? 'Commitment reminder' : 'Contextual guidance'} onKeyDown={handleKeyDown} className="relative z-30 w-[320px] max-w-full rounded border bg-surface p-3 text-foreground shadow-md" style={{ opacity, transform: `translateY(${(1 - opacity) * -8}px)` }}>
      <div className="flex items-start gap-2">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="type-data font-semibold">{isCommitment ? 'Confirm Kestrel handling-fee terms in writing · Fri 12:00' : 'Known fix from AP East: Vendor tax ID format'}</h3>
          {!isCommitment && <p className="mt-1 text-xs text-muted-foreground">Published guidance</p>}
        </div>
        {onDismiss && <button type="button" aria-label="Dismiss" onClick={onDismiss} className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2"><X aria-hidden="true" className="size-4" /></button>}
      </div>
      {!isCommitment && <div className="mt-3 pl-6">
        <Button ref={guideTrigger} variant="outline" size="sm" hidden={guideOpen} onClick={() => { setStep(0); setGuideOpen(true) }}>Guide Me <ArrowRight aria-hidden="true" className="ml-1 size-4" /></Button>
        {guideOpen && <div aria-live="polite">
          <p ref={guideStep} tabIndex={-1} className="type-data text-muted-foreground">Step {step + 1} of {GUIDE_STEPS.length}</p>
          <p className="mt-1 text-sm">{GUIDE_STEPS[step]}</p>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" disabled={step === 0} disabledReason="Already at the first step" onClick={() => setStep(step - 1)}>Back</Button>
            {step < GUIDE_STEPS.length - 1 ? <Button size="sm" onClick={() => setStep(step + 1)}>Next</Button> : <Button size="sm" onClick={closeGuide}>Done</Button>}
          </div>
        </div>}
      </div>}
    </aside>
  )
}
