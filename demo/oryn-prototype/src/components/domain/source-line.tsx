import { ARDENT_SOURCE } from '@/data/sources'
import { cn } from '@/lib/utils'

export interface SourceLineProps {
  /** Film capture remains static; interactive mode links to the cited source. */
  interactive?: boolean
  className?: string
}

export function SourceLine({ interactive = false, className }: SourceLineProps) {
  const classes = cn('block max-w-full font-mono text-[11px] font-medium leading-4 text-muted-foreground', className)
  return (
    <div data-anchor="source-line" className={classes}>
      {interactive ? <a href={ARDENT_SOURCE.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={`${ARDENT_SOURCE.citation} (opens in a new tab)`}>{ARDENT_SOURCE.citation}</a> : <span>{ARDENT_SOURCE.citation}</span>}
    </div>
  )
}
