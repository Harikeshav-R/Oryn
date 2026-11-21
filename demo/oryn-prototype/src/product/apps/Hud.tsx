import { ArrowRight, Lightbulb, ListChecks, X } from 'lucide-react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { COMMITMENT } from '@/data/commitment'
import { sampleMotion } from '@/film'
import type { Rect } from '@/film'
import { cn } from '@/lib/utils'
import { hudKind } from '@/state'
import type { ActionType, HudGuide, HudKind, HudMotion } from '@/state'
import { act, filmAnchor, type FilmContext, type ProductProps } from '../contract'
import { appAt } from './frame'
import { HUD_LOCAL, HUD_RECTS } from './erp-layout'

/**
 * SC04 contextual card. Driven only by state: which card shows is `hudKind(state)`, the guide step
 * is `state.ui.app.hud.guide`, the placement is `state.ui.app.hud.placement`. The card box and its
 * controls are anchored at fixed offsets, so a rectangle never changes with the guide step: the SAME
 * box swaps its content. Dismissing or completing guidance changes nothing but this card.
 *
 * Entry motion moves only inner layers (opacity plus a short settle), never an anchored box. A film
 * derives it from the last accepted action; the clickable app uses a CSS animation that the global
 * reduced-motion rule switches off.
 */

const GUIDE_STEPS = ['Check the vendor tax ID format', 'Update the permitted field', 'Review the result'] as const
const FIRST_STEP_REASON = 'Step 1 is the first step.'
const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const BUTTON = `box-border inline-flex h-full w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border type-data ${FOCUS} aria-disabled:cursor-not-allowed aria-disabled:bg-surface-2 aria-disabled:text-muted-foreground`
const OUTLINE = 'border-border bg-surface text-foreground hover:bg-surface-2'
const PRIMARY = 'border-primary bg-primary text-primary-foreground hover:border-foreground hover:bg-background hover:text-foreground'

const SHORT_FRAMES = 4.5
const LONG_FRAMES = 15
const GUIDE_ACTIONS: readonly ActionType[] = ['OPEN_GUIDE', 'GUIDE_NEXT', 'GUIDE_BACK', 'GUIDE_DONE']

/** Clickable app only: CSS keyframes for entry and step change. Reduced motion is handled globally. */
const APP_MOTION_CSS = `
@keyframes hud-enter-short{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes hud-enter-long{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
@keyframes hud-swap{from{opacity:0}to{opacity:1}}
.hud-enter-short{animation:hud-enter-short 150ms cubic-bezier(.4,0,.2,1) both}
.hud-enter-long{animation:hud-enter-long 500ms cubic-bezier(.4,0,.2,1) both}
.hud-swap{animation:hud-swap 150ms cubic-bezier(.4,0,.2,1) both}
@media (prefers-reduced-motion: reduce){.hud-enter-short,.hud-enter-long,.hud-swap{animation:none}}
`

interface Layer {
  readonly className?: string
  readonly style?: CSSProperties
}

function progressSince(film: FilmContext, since: number | null, frames: number): number {
  return since === null ? 1 : sampleMotion(since, frames, 'product')(film).progress
}

/** Opacity plus the settle (10 px vertical for `short`, 20 px horizontal for `long`) of the card's inner layers. */
function entryLayer(props: ProductProps, kind: HudKind, motion: HudMotion): Layer {
  const { film } = props
  if (!film) return { className: `hud-enter-${motion}` }
  const since = film.lastApplied(kind === 'commitment' ? 'OPEN_VENDOR' : 'OPEN_SCREEN')
  const progress = progressSince(film, since, motion === 'long' ? LONG_FRAMES : SHORT_FRAMES)
  if (progress >= 1) return {}
  const left = 1 - progress
  return { style: { opacity: progress, transform: motion === 'long' ? `translateX(${20 * left}px)` : `translateY(${-10 * left}px)` } }
}

/** 150 ms opacity swap of the card text after a guide action. */
function swapLayer(props: ProductProps): Layer {
  const { film } = props
  if (!film) return { className: 'hud-swap' }
  let since: number | null = null
  for (const type of GUIDE_ACTIONS) {
    const frame = film.lastApplied(type)
    if (frame !== null && (since === null || frame > since)) since = frame
  }
  const progress = progressSince(film, since, SHORT_FRAMES)
  return progress >= 1 ? {} : { style: { opacity: progress } }
}

const local = (rect: Rect): CSSProperties => ({ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height })
const hideUnless = (visible: boolean): CSSProperties => (visible ? {} : { display: 'none' })

/** An anchored control: the outer box is the fixed rect, the inner layer carries the entry motion. */
function Slot({ name, rect, visible, layer, children }: { readonly name: string; readonly rect: Rect; readonly visible: boolean; readonly layer: Layer; readonly children: ReactNode }) {
  return (
    <div {...filmAnchor(name)} style={{ ...local(rect), ...hideUnless(visible) }}>
      <div className={cn('h-full w-full', layer.className)} style={layer.style}>
        {children}
      </div>
    </div>
  )
}

function CommitmentBody({ due, swap }: { readonly due: string; readonly swap: Layer }) {
  return (
    <div className={swap.className} style={{ position: 'absolute', inset: 0, ...swap.style }}>
      <ListChecks aria-hidden="true" className="absolute size-4" style={{ left: HUD_LOCAL.icon.x, top: HUD_LOCAL.icon.y }} />
      <h3 className="type-card m-0 overflow-hidden" style={local(HUD_LOCAL.title)}>
        {COMMITMENT.title}
      </h3>
      <div className="type-data overflow-hidden text-muted-foreground" style={local(HUD_LOCAL.evidence)}>
        <p className="m-0 text-foreground">{`${COMMITMENT.owner} \u00b7 ${due}`}</p>
        <p className="m-0">{COMMITMENT.qualifier}</p>
      </div>
    </div>
  )
}

function PeerFixBody({ guide, swap }: { readonly guide: HudGuide; readonly swap: Layer }) {
  const step = guide === 1 || guide === 2 || guide === 3 ? guide : null
  const Icon = guide === 'closed' ? Lightbulb : ListChecks
  return (
    <div className={swap.className} style={{ position: 'absolute', inset: 0, ...swap.style }}>
      <Icon aria-hidden="true" className="absolute size-4" style={{ left: HUD_LOCAL.icon.x, top: HUD_LOCAL.icon.y }} />
      {guide === 'closed' && (
        <>
          <h3 className="type-card m-0 overflow-hidden" style={local(HUD_LOCAL.title)}>
            Known fix from AP East: Vendor tax ID format
          </h3>
          <p className="type-data m-0 overflow-hidden text-muted-foreground" style={local({ ...HUD_LOCAL.caption, y: 60 })}>
            Published guidance
          </p>
        </>
      )}
      {step !== null && (
        <div aria-live="polite">
          <p className="type-data m-0 overflow-hidden text-muted-foreground" style={local(HUD_LOCAL.caption)}>{`Step ${step} of 3`}</p>
          <p className="type-body m-0 overflow-hidden" style={local(HUD_LOCAL.step)}>
            {GUIDE_STEPS[step - 1]}
          </p>
          {step === 1 && (
            <p id="hud-back-reason" className="type-micro m-0 overflow-hidden text-muted-foreground" style={local(HUD_LOCAL.reason)}>
              {FIRST_STEP_REASON}
            </p>
          )}
        </div>
      )}
      {guide === 'completed' && (
        <div aria-live="polite">
          <p className="type-card m-0 overflow-hidden" style={local({ ...HUD_LOCAL.caption, height: 22 })}>
            Guidance complete
          </p>
          <p className="type-data m-0 overflow-hidden text-muted-foreground" style={local({ ...HUD_LOCAL.step, y: 40 })}>
            The source case stays open.
          </p>
        </div>
      )}
    </div>
  )
}

/** One card, never two. The wrapper is `display: none` when no card applies; every anchor is always rendered. */
export function Hud(props: ProductProps) {
  const { state } = props
  const kind = hudKind(state)
  const { placement, motion, guide } = state.ui.app.hud
  const card = HUD_RECTS[placement]
  const entry: Layer = kind === null ? {} : entryLayer(props, kind, motion)
  const swap = swapLayer(props)
  const peer = kind === 'peerFix'
  const dismiss = (): void => act(props, { type: 'DISMISS_HUD' })
  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    dismiss()
  }
  const surface = cn('absolute inset-0 box-border rounded-[8px] border bg-surface text-foreground shadow-md', entry.className)
  const open = peer && (guide === 1 || guide === 2 || guide === 3)

  return (
    <>
      {props.film === undefined && <style>{APP_MOTION_CSS}</style>}
      <aside
        data-hud={kind ?? 'none'}
        aria-label={kind === 'commitment' ? 'Commitment reminder' : 'Contextual guidance'}
        onKeyDown={onKeyDown}
        style={{ ...appAt(card), zIndex: 30, ...hideUnless(kind !== null) }}
      >
        <div {...filmAnchor('hud-reminder')} style={{ ...local({ x: 0, y: 0, width: card.width, height: card.height }), ...hideUnless(kind === 'commitment') }}>
          {kind === 'commitment' && (
            <div className={surface} style={entry.style}>
              <CommitmentBody due={state.commitment.confirmedDue ?? '\u2014'} swap={swap} />
            </div>
          )}
        </div>
        <div {...filmAnchor('hud-peer-fix')} style={{ ...local({ x: 0, y: 0, width: card.width, height: card.height }), ...hideUnless(peer) }}>
          {peer && (
            <div className={surface} style={entry.style}>
              <PeerFixBody key={String(guide)} guide={guide} swap={swap} />
            </div>
          )}
        </div>
        <Slot name="hud-dismiss" rect={HUD_LOCAL.dismiss} visible={kind !== null} layer={entry}>
          <button type="button" aria-label="Dismiss" onClick={dismiss} className={cn(BUTTON, 'relative border-transparent bg-transparent p-0 text-muted-foreground hover:text-foreground before:absolute before:-inset-2 before:content-[""]')}>
            <X aria-hidden="true" className="size-4" />
          </button>
        </Slot>
        <Slot name="guide-me" rect={HUD_LOCAL.guideMe} visible={peer && guide === 'closed'} layer={entry}>
          <button type="button" onClick={() => act(props, { type: 'OPEN_GUIDE' })} className={cn(BUTTON, OUTLINE)}>
            Guide Me
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </Slot>
        <Slot name="guide-back" rect={HUD_LOCAL.guideBack} visible={open} layer={entry}>
          <button
            type="button"
            aria-disabled={guide === 1 || undefined}
            aria-describedby={guide === 1 ? 'hud-back-reason' : undefined}
            onClick={() => {
              if (guide !== 1) act(props, { type: 'GUIDE_BACK' })
            }}
            className={cn(BUTTON, OUTLINE)}
          >
            Back
          </button>
        </Slot>
        <Slot name="guide-next" rect={HUD_LOCAL.guideNext} visible={peer && (guide === 1 || guide === 2)} layer={entry}>
          <button type="button" onClick={() => act(props, { type: 'GUIDE_NEXT' })} className={cn(BUTTON, PRIMARY)}>
            Next
          </button>
        </Slot>
        <Slot name="guide-done" rect={HUD_LOCAL.guideDone} visible={peer && guide === 3} layer={entry}>
          <button type="button" onClick={() => act(props, { type: 'GUIDE_DONE' })} className={cn(BUTTON, PRIMARY)}>
            Done
          </button>
        </Slot>
      </aside>
    </>
  )
}
