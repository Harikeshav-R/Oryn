import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Neutral unknown-status hatch: 45 degrees, 1px strokes, 6px spacing.
 * `theme` follows the active theme (strokes reverse luminance in dark);
 * `light`, `dark` and `neutral` pin the stroke/background pair.
 * It accepts no children by design: hatch must never sit behind text.
 */
const hatchVariants = cva('hatch inline-block shrink-0', {
  variants: {
    variant: {
      theme: '',
      light: 'hatch-light',
      dark: 'hatch-dark',
      neutral: 'hatch-neutral',
    },
  },
  defaultVariants: { variant: 'theme' },
})

export interface HatchProps extends VariantProps<typeof hatchVariants> {
  className?: string
}

export function Hatch({ variant, className }: HatchProps) {
  return <span aria-hidden="true" data-hatch={variant ?? 'theme'} className={cn(hatchVariants({ variant }), className)} />
}
