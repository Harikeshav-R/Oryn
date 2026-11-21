import { useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { AUTONOMY_STAGES } from '@/data/agent-draft'
import type { AutonomyStageId } from '@/data/agent-draft'
import { cn } from '@/lib/utils'

export type AutonomyStage = AutonomyStageId

const STAGES = AUTONOMY_STAGES

/** Selecting a stage is informational; it does not release or authorize a job. */
export function AutonomyLadder({
  selected,
  gateSatisfied = false,
  onSelect,
  dense = false,
  className,
}: {
  selected?: AutonomyStage
  gateSatisfied?: boolean
  onSelect?: (stage: AutonomyStage) => void
  dense?: boolean
  className?: string
}) {
  const [explained, setExplained] = useState<AutonomyStage | null>(null)

  const [localSelected, setLocalSelected] = useState<AutonomyStage>(3)
  const selectedStage = selected ?? localSelected
  return (
    <div data-anchor="autonomy-ladder" className={className}>
      <ol aria-label="Autonomy stages" className="divide-y divide-border border-y">
        {STAGES.map((stage) => {
          const locked = stage.id >= 4
          const active = selectedStage === stage.id && !locked
          const gate = locked ? 'Locked' : stage.id === 3 ? (gateSatisfied ? 'Gate satisfied' : 'Gate pending') : 'Available'
          return (
            <li key={stage.id}>
              <button
                type="button"
                aria-pressed={locked ? undefined : active}
                aria-expanded={locked ? explained === stage.id : undefined}
                onClick={() => {
                  if (locked) setExplained(explained === stage.id ? null : stage.id)
                  else {
                    if (selected === undefined) setLocalSelected(stage.id)
                    onSelect?.(stage.id)
                  }
                }}
                className={cn(
                  'flex w-full items-center gap-3 border-l-2 px-3 text-left text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]',
                  dense ? 'min-h-8 py-1' : 'min-h-[54px] py-2',
                  active ? 'border-l-foreground bg-surface' : 'border-l-transparent',
                )}
              >
                <span className="w-4 shrink-0 type-data">{stage.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{stage.label}</span>
                  {!dense && <span className="block text-xs text-muted-foreground">{stage.description}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  {locked && <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />}
                  {gate}
                </span>
              </button>
              {locked && explained === stage.id && (
                <p className="px-10 pb-2 text-xs text-foreground">This stage is locked. Its release gates have not been established in this demonstration.</p>
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">Starting a job does not approve Tier 3 actions.</p>
    </div>
  )
}
