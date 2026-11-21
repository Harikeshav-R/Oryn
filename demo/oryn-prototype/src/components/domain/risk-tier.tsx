import { useState } from 'react'
import { Shield, ShieldX } from 'lucide-react'
import { RISK_TIERS } from '@/data/agent-draft'
import type { RiskTierLevel as TierLevel } from '@/data/agent-draft'
import { cn } from '@/lib/utils'

export type RiskTierLevel = TierLevel

const TIERS = RISK_TIERS

/** Risk classification is informational and never grants authority. */
export function RiskTier({
  tier = 3,
  explain = false,
  className,
}: {
  tier?: RiskTierLevel
  /** Allow the chip to reveal its explanation without changing permissions. */
  explain?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const { label, explanation } = TIERS[tier]
  const Icon = tier === 4 ? ShieldX : Shield
  const content = (
    <>
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" />
      <span>Tier {tier} {tier === 3 ? '- ' : ''}{label}</span>
      {tier === 4 && <span>· Blocked</span>}
    </>
  )
  const chipClass = cn(
    'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-sm border bg-surface px-2 type-data text-foreground',
    explain && 'hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    className,
  )

  return (
    <span data-anchor="risk-tier" data-tier={tier} className="inline-flex flex-col items-start gap-1">
      {explain ? (
        <button type="button" className={chipClass} aria-expanded={open} onClick={() => setOpen(!open)}>
          {content}
        </button>
      ) : (
        <span className={chipClass}>{content}</span>
      )}
      {explain && open && <span className="max-w-sm text-xs text-foreground">{explanation}</span>}
    </span>
  )
}
