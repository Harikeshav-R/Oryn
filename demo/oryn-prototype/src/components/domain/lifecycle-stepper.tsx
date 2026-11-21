import { Check } from 'lucide-react'
import { OrbitNode } from '@/components/domain/orbit'
import { LIFECYCLE_STEPS, type LifecycleStep } from '@/data/labels'
import { cn } from '@/lib/utils'

/**
 * CMP-08 product lifecycle stepper: fourteen labelled steps, 18px nodes, 1px edges.
 * Step states: past, current (idle), executing, future. Only the executing node carries
 * arc: its orbit derives from `frame` at 1.8 s per turn and freezes neutral when `running`
 * turns false. State is also written as text (`Running` / `Current`) and in the accessible
 * name, so the marker never depends on colour or motion and static mode stays readable.
 *
 * Steps are informational. Pass `onStepSelect` to make labels navigable buttons; selecting
 * a step only navigates and never starts anything. `Publish` is guidance; `Release` is a
 * separate authorization. The orbit never indicates inferred success.
 */
export type StepperOrientation = 'horizontal' | 'vertical' | 'orbit'
type StepState = 'past' | 'current' | 'executing' | 'future'

const STATE_TEXT: Record<StepState, string> = {
  past: 'completed',
  current: 'current',
  executing: 'running',
  future: 'not started',
}

function Node({ state, frame }: { state: StepState; frame: number }) {
  if (state === 'executing' || state === 'current') {
    // 18px node: the orbit mark itself. Neutral and frozen unless executing.
    return (
      <span className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-background">
        <OrbitNode frame={frame} running={state === 'executing'} size={18} decorative className="text-foreground" />
      </span>
    )
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border bg-background',
        state === 'past' ? 'border-foreground bg-foreground text-background' : 'border-trace',
      )}
    >
      {state === 'past' && <Check className="size-3" strokeWidth={2.25} />}
    </span>
  )
}

export function LifecycleStepper({
  current,
  running = false,
  frame = 0,
  orientation = 'horizontal',
  onStepSelect,
}: {
  current: LifecycleStep
  running?: boolean
  frame?: number
  orientation?: StepperOrientation
  onStepSelect?: (step: LifecycleStep) => void
}) {
  const currentIndex = LIFECYCLE_STEPS.indexOf(current)
  const stateOf = (index: number): StepState =>
    index < currentIndex ? 'past' : index > currentIndex ? 'future' : running ? 'executing' : 'current'

  const label = (step: LifecycleStep, state: StepState, align: 'center' | 'start' | 'end') => {
    const text = (
      <>
        <span className="whitespace-nowrap">{step}</span>
        <span className="sr-only">{`, ${STATE_TEXT[state]}`}</span>
        {(state === 'current' || state === 'executing') && (
          <span aria-hidden="true" className="type-micro text-muted-foreground">
            {state === 'executing' ? 'Running' : 'Current'}
          </span>
        )}
      </>
    )
    const cls = cn(
      'flex flex-col type-micro',
      align === 'center' && 'items-center text-center',
      align === 'start' && 'items-start text-left',
      align === 'end' && 'items-end text-right',
      state === 'future' ? 'text-muted-foreground' : 'text-foreground',
      (state === 'current' || state === 'executing') && 'font-bold',
    )
    return onStepSelect ? (
      <button type="button" className={cn(cls, 'rounded-sm')} onClick={() => onStepSelect(step)}>
        {text}
      </button>
    ) : (
      <span className={cls}>{text}</span>
    )
  }

  if (orientation === 'orbit') {
    const size = 480
    const radius = 176
    return (
      <ol
        data-anchor="lifecycle-stepper"
        data-orientation="orbit"
        data-running={running ? 'true' : 'false'}
        aria-label="Lifecycle"
        className="relative mx-auto"
        style={{ width: size, height: size }}
      >
        <svg aria-hidden="true" width={size} height={size} className="absolute inset-0 text-trace">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={1} />
        </svg>
        {LIFECYCLE_STEPS.map((step, index) => {
          const state = stateOf(index)
          const angle = (index / LIFECYCLE_STEPS.length) * 2 * Math.PI - Math.PI / 2
          const x = size / 2 + radius * Math.cos(angle)
          const y = size / 2 + radius * Math.sin(angle)
          const cos = Math.cos(angle)
          // Top and bottom nodes stack their label above/below so it never sits on the ring.
          const place = Math.abs(cos) < 0.01 ? (Math.sin(angle) < 0 ? 'top' : 'bottom') : cos > 0 ? 'right' : 'left'
          const layout = {
            right: { transform: 'translate(-9px, -50%)', flexDirection: 'row', align: 'start' },
            left: { transform: 'translate(calc(-100% + 9px), -50%)', flexDirection: 'row-reverse', align: 'end' },
            top: { transform: 'translate(-50%, calc(-100% + 9px))', flexDirection: 'column-reverse', align: 'center' },
            bottom: { transform: 'translate(-50%, -9px)', flexDirection: 'column', align: 'center' },
          } as const
          const spot = layout[place]
          return (
            <li
              key={step}
              data-step={step}
              data-state={state}
              aria-current={state === 'current' || state === 'executing' ? 'step' : undefined}
              className="absolute flex items-center gap-2"
              style={{ left: x, top: y, transform: spot.transform, flexDirection: spot.flexDirection }}
            >
              <Node state={state} frame={frame} />
              {label(step, state, spot.align)}
            </li>
          )
        })}
      </ol>
    )
  }

  if (orientation === 'vertical') {
    return (
      <ol data-anchor="lifecycle-stepper" data-orientation="vertical" data-running={running ? 'true' : 'false'} aria-label="Lifecycle">
        {LIFECYCLE_STEPS.map((step, index) => {
          const state = stateOf(index)
          const last = index === LIFECYCLE_STEPS.length - 1
          return (
            <li
              key={step}
              data-step={step}
              data-state={state}
              aria-current={state === 'current' || state === 'executing' ? 'step' : undefined}
              className="relative flex items-start gap-3 pb-3"
            >
              {!last && <span aria-hidden="true" className="absolute left-[8.5px] top-[18px] h-[calc(100%-18px)] w-px bg-trace" />}
              <Node state={state} frame={frame} />
              <span className="pt-px">{label(step, state, 'start')}</span>
            </li>
          )
        })}
      </ol>
    )
  }

  // Horizontal: seven steps per row so every label stays on one line at 992px.
  return (
    <ol
      data-anchor="lifecycle-stepper"
      data-orientation="horizontal"
      data-running={running ? 'true' : 'false'}
      aria-label="Lifecycle"
      className="grid grid-cols-7 gap-y-6"
    >
      {LIFECYCLE_STEPS.map((step, index) => {
        const state = stateOf(index)
        const first = index % 7 === 0
        const lastInRow = index % 7 === 6
        return (
          <li
            key={step}
            data-step={step}
            data-state={state}
            aria-current={state === 'current' || state === 'executing' ? 'step' : undefined}
            className="relative flex flex-col items-center gap-2"
          >
            {!first && <span aria-hidden="true" className="absolute right-1/2 top-[8.5px] h-px w-[calc(50%-9px)] -translate-x-[9px] bg-trace" />}
            {!lastInRow && <span aria-hidden="true" className="absolute left-1/2 top-[8.5px] h-px w-[calc(50%-9px)] translate-x-[9px] bg-trace" />}
            <Node state={state} frame={frame} />
            {label(step, state, 'center')}
          </li>
        )
      })}
    </ol>
  )
}
