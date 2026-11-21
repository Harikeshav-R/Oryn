import { ArrowRight, Circle, CircleDot, Compass, Folder, Mail, MessageSquare, Pause, Play, Search, Settings, Shield, SlidersHorizontal, Table2, Video, type LucideIcon } from 'lucide-react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { CAPTURE_BLOCK_TEXT, captureBlock } from '@/data/consent'
import { cn } from '@/lib/utils'
import { isEmployee, observationActive, type EmployeeId, type MeetingConsent } from '@/state'
import { BrowserFrame } from './BrowserFrame'
import { DESKTOP, act, filmAnchor, motionProgress, type ProductProps } from './contract'
import { EXCLUDED } from './desktop-data'

/**
 * SC01 + APP-12: the original macOS-like desktop (not a screenshot, no Apple art), the Oryn tray
 * status button, the companion menu and the excluded-window moment. The APP-11 browser sits on the
 * wallpaper. Full canvas, no Oryn sidebar.
 *
 * Film rules honoured here: every anchor element is always rendered and hidden with its own
 * `display: none`; no anchored rect depends on interaction state; the menu's 150 ms motion is
 * derived from `motionProgress`, never from a CSS transition in a film.
 *
 * Presentation state is `state.ui` (`overlay`, `foreground`, `activeTab`). Observation, pause and
 * meeting consent come from `state.consent[personId]`; the tray reads, never owns, them.
 */
const MENU_PAD = 12
const MENU_SLIDE_PX = 4
const MEETING_ID = 'zoom-kestrel'

const show = (shown: boolean): CSSProperties | undefined => (shown ? undefined : { display: 'none' })

type ObservationKind = 'active' | 'paused' | 'off'

interface Observation {
  readonly kind: ObservationKind
  readonly text: string
  readonly caption: string
  /** Why Pause is unavailable while observation is off; null when it works. */
  readonly blocked: string | null
}

/** One reading of the acting Employee's observation, from the same selectors the reducer guards use. */
function readObservation(props: ProductProps, personId: EmployeeId): Observation {
  const { state } = props
  const consent = state.consent[personId]
  if (observationActive(state, personId)) return { kind: 'active', text: 'Observation active', caption: 'Capture active', blocked: null }
  if (consent.paused && consent.noticeAccepted && !consent.noticeDeclined) return { kind: 'paused', text: 'Observation paused', caption: 'Paused', blocked: null }
  const block = consent.noticeDeclined ? 'Capture is off: notice declined.' : consent.noticeAccepted ? null : CAPTURE_BLOCK_TEXT.notice
  const category = consent.noticeAccepted && !consent.noticeDeclined ? captureBlock(consent) : null
  return {
    kind: 'off',
    text: 'Observation off',
    caption: 'Not capturing',
    blocked: block ?? (category === 'category' ? CAPTURE_BLOCK_TEXT.category : 'Capture starts when enrollment is complete.'),
  }
}

const MEETING_TEXT: Readonly<Record<MeetingConsent, string>> = {
  absent: 'Meeting: off, needs per-meeting consent',
  granted: 'Meeting: consented for this meeting',
  denied: 'Meeting: declined',
}

function TrayGlyph({ kind }: { kind: ObservationKind }) {
  if (kind === 'active') return <CircleDot size={14} strokeWidth={1.75} aria-hidden className="text-foreground" />
  if (kind === 'paused') {
    return (
      <span aria-hidden className="inline-flex h-[14px] w-[14px] items-center justify-center rounded-sm border border-trace text-muted-foreground">
        <Pause size={9} strokeWidth={2} />
      </span>
    )
  }
  return <Circle size={14} strokeWidth={1.75} aria-hidden className="text-muted-foreground" />
}

function StatusIcon({ kind }: { kind: ObservationKind }) {
  if (kind === 'active') return <CircleDot size={16} aria-hidden className="text-foreground" />
  if (kind === 'paused') return <Pause size={16} aria-hidden className="text-muted-foreground" />
  return <Circle size={16} aria-hidden className="text-muted-foreground" />
}

const MENU_BAR_TITLES = ['File', 'Edit', 'View', 'Window'] as const

function MenuBar({ props, kind, open }: { props: ProductProps; kind: ObservationKind; open: boolean }) {
  const bar = DESKTOP.menuBar
  return (
    <div
      className="absolute z-30 flex items-center border-b font-sans text-[12px] leading-[18px]"
      style={{
        left: bar.x,
        top: bar.y,
        width: bar.width,
        height: bar.height,
        background: 'color-mix(in srgb, var(--surface) 78%, transparent)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <span className="absolute font-bold" style={{ left: 16 }}>
        Oryn
      </span>
      {MENU_BAR_TITLES.map((title, index) => (
        <span key={title} aria-hidden className="absolute text-muted-foreground" style={{ left: 64 + index * 52 }}>
          {title}
        </span>
      ))}
      <button
        type="button"
        aria-label="Oryn observation status"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-observation={kind}
        {...filmAnchor('tray-icon')}
        onClick={() => act(props, { type: 'SET_OVERLAY', overlay: open ? null : 'companion' })}
        className={cn('absolute flex items-center justify-center rounded hover:bg-surface-2', !props.film && 'transition-colors', open && 'bg-surface-2')}
        style={{ left: DESKTOP.trayIcon.x - 10, top: DESKTOP.trayIcon.y - 10, width: 20, height: 20 }}
      >
        <TrayGlyph kind={kind} />
      </button>
      <SlidersHorizontal size={14} aria-hidden className="absolute text-muted-foreground" style={{ left: 1133 }} />
      <Search size={14} aria-hidden className="absolute text-muted-foreground" style={{ left: 1169 }} />
    </div>
  )
}

const DOCK_ICONS: readonly LucideIcon[] = [Folder, Compass, Mail, Table2, MessageSquare, Video, Settings]

function Dock() {
  const dock = DESKTOP.dock
  return (
    <div
      aria-hidden
      {...filmAnchor('dock')}
      className="absolute z-10 flex items-center justify-evenly rounded-lg border"
      style={{
        left: dock.x,
        top: dock.y,
        width: dock.width,
        height: dock.height,
        background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {DOCK_ICONS.map((Icon, index) => (
        <span
          key={index}
          className={cn('flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground', index % 2 === 0 ? 'bg-surface-2' : 'bg-surface')}
        >
          <Icon size={18} strokeWidth={1.75} />
        </span>
      ))}
    </div>
  )
}

/** Abstract, unlicensed wallpaper: warm bone to grey gradient and a few soft shapes. */
function Wallpaper() {
  const rect = DESKTOP.wallpaper
  return (
    <div
      aria-hidden
      className="absolute z-0 overflow-hidden"
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height, background: 'linear-gradient(135deg, #efece4 0%, #e3dfd5 48%, #d3cec3 100%)' }}
    >
      <div className="absolute rounded-full" style={{ left: -120, top: 360, width: 640, height: 640, background: 'radial-gradient(circle at 40% 40%, #f6f4ee 0%, rgba(246,244,238,0) 70%)' }} />
      <div className="absolute rounded-full" style={{ left: 760, top: -180, width: 720, height: 720, background: 'radial-gradient(circle at 50% 50%, #c9c4b8 0%, rgba(201,196,184,0) 68%)' }} />
      <div className="absolute" style={{ left: 420, top: 220, width: 520, height: 520, transform: 'rotate(18deg)', borderRadius: 96, border: '1px solid rgba(120,116,104,0.18)' }} />
      <div className="absolute" style={{ left: 560, top: 300, width: 360, height: 360, transform: 'rotate(18deg)', borderRadius: 72, border: '1px solid rgba(120,116,104,0.14)' }} />
    </div>
  )
}

function MenuRow({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn('flex shrink-0 items-center', className)} style={style}>
      {children}
    </div>
  )
}

const MENU_BUTTON =
  'flex h-8 w-full shrink-0 items-center gap-2 rounded border border-transparent bg-transparent px-2 text-left font-sans text-[12px] leading-[18px] text-foreground hover:bg-surface-2 aria-disabled:cursor-not-allowed aria-disabled:text-muted-foreground aria-disabled:hover:bg-transparent'

/**
 * The companion menu at the exact authored box [950,28,310,232]. The anchored outer box is static;
 * only the inner panel slides. In a film the two anchored rows counter-slide so their rects stay put.
 */
function CompanionMenu({ props, observation, personId, open }: { props: ProductProps; observation: Observation | null; personId: EmployeeId | null; open: boolean }) {
  const { state } = props
  const box = DESKTOP.companionMenu
  const progress = open ? motionProgress(props.film, 'SET_OVERLAY') : 1
  const slide = (1 - progress) * MENU_SLIDE_PX
  const inApp = props.film === undefined
  const controls = open && observation !== null
  const paused = observation?.kind === 'paused'
  const blocked = observation?.blocked ?? null
  const meeting = personId === null ? null : state.consent[personId].meetings[MEETING_ID]
  const counterSlide = slide === 0 ? undefined : `translateY(${slide}px)`

  return (
    <div
      role="dialog"
      aria-label="Oryn companion"
      {...filmAnchor('companion-menu')}
      className="absolute z-20"
      style={{ left: box.x, top: box.y, width: box.width, height: box.height, ...show(open) }}
    >
      <div
        className={cn('box-border flex h-full w-full flex-col rounded-lg border bg-surface shadow-md', inApp && 'animate-in fade-in-0 slide-in-from-top-1 duration-150 motion-reduce:animate-none')}
        style={{ padding: MENU_PAD - 1, opacity: progress, transform: slide === 0 ? undefined : `translateY(${-slide}px)` }}
      >
        <MenuRow className="font-sans text-[12px] font-bold leading-[18px]" style={{ height: 24 }}>
          Oryn
        </MenuRow>

        {observation === null ? (
          <MenuRow className="px-2 font-sans text-[12px] leading-[18px] text-muted-foreground" style={{ height: 30 }}>
            Only an Employee observes their own work.
          </MenuRow>
        ) : (
          <MenuRow className="gap-2 px-2" style={{ height: 30 }}>
            <span className="w-12 shrink-0 self-start font-sans text-[11px] leading-4 text-muted-foreground">Screen</span>
            <StatusIcon kind={observation.kind} />
            <span className="flex min-w-0 flex-col">
              <span role="status" className="font-sans text-[12px] font-medium leading-4">
                {observation.text}
              </span>
              <span className="font-sans text-[11px] leading-[14px] text-muted-foreground">{observation.caption}</span>
            </span>
          </MenuRow>
        )}
        <div className="shrink-0" style={{ height: 2 }} />

        <button
          type="button"
          {...filmAnchor('pause-observation')}
          aria-disabled={blocked !== null || undefined}
          aria-describedby={blocked !== null ? 'companion-pause-reason' : undefined}
          onClick={blocked !== null ? undefined : () => act(props, paused ? { type: 'RESUME_OBSERVATION' } : { type: 'PAUSE_OBSERVATION' })}
          className={cn(MENU_BUTTON, !props.film && 'transition-colors')}
          style={{ ...show(controls), transform: counterSlide }}
        >
          {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
          <span className="flex-1">{paused ? 'Resume observation' : 'Pause observation'}</span>
          <span className="rounded-sm border px-[6px] text-[11px] leading-4 text-muted-foreground">{paused ? 'Resume' : 'Pause'}</span>
        </button>
        <div id="companion-pause-reason" className="shrink-0 pl-2 font-sans text-[11px] leading-4 text-muted-foreground" style={{ height: 16, ...show(controls) }}>
          {blocked}
        </div>

        <button
          type="button"
          {...filmAnchor('my-privacy-link')}
          onClick={() => {
            act(props, { type: 'OPEN_SCREEN', screen: 'SC03' })
            act(props, { type: 'SET_OVERLAY', overlay: null })
          }}
          className={cn(MENU_BUTTON, !props.film && 'transition-colors')}
          style={{ ...show(controls), transform: counterSlide }}
        >
          <Shield size={16} aria-hidden />
          <span className="flex-1">My Privacy</span>
          <ArrowRight size={16} aria-hidden className="text-muted-foreground" />
        </button>

        <div className="shrink-0 border-b" style={{ height: 7, marginBottom: 7, ...show(controls) }} />

        <section aria-label="Meeting consent" className="flex shrink-0 flex-col gap-1 px-2" style={{ height: 58, ...show(controls) }}>
          <p className="flex items-center gap-2 font-sans text-[12px] leading-[18px]">
            <Video size={16} aria-hidden className="shrink-0 text-muted-foreground" />
            <span>{meeting === null ? '' : MEETING_TEXT[meeting]}</span>
          </p>
          <p className="font-sans text-[11px] leading-4 text-muted-foreground" style={{ paddingLeft: 24 }}>
            Resume applies to screen observation only.
          </p>
        </section>
      </div>
    </div>
  )
}

/** Title-bar traffic circles: neutral outlined, centred x20/40/60, never red/yellow/green. */
function TrafficCircles() {
  return (
    <>
      {[20, 40, 60].map((cx) => (
        <span key={cx} aria-hidden className="absolute rounded-full border border-trace bg-transparent" style={{ left: cx - 6, top: 13, width: 12, height: 12 }} />
      ))}
    </>
  )
}

/** The excluded window: blank body by design. Nothing of its content exists to be rendered. */
function ExcludedWindow({ shown }: { shown: boolean }) {
  const win = EXCLUDED.window
  const cue = EXCLUDED.cue
  return (
    <>
      <div
        role="group"
        aria-label="Private window"
        {...filmAnchor('excluded-window')}
        className="absolute z-[15] overflow-hidden rounded-lg border bg-surface shadow-md"
        style={{ left: win.x, top: win.y, width: win.width, height: win.height, ...show(shown) }}
      >
        <div className="relative border-b bg-surface-2" style={{ height: 38 }}>
          <TrafficCircles />
          <span className="absolute inset-x-0 top-0 flex items-center justify-center font-sans text-[12px] leading-[38px] text-muted-foreground">Private window</span>
        </div>
      </div>
      <div
        role="note"
        {...filmAnchor('excluded-cue')}
        className="absolute z-[15] flex items-center justify-center gap-2 rounded border bg-surface font-sans text-[12px] leading-[18px] text-foreground"
        style={{ left: cue.x, top: cue.y, width: cue.width, height: cue.height, ...show(shown) }}
      >
        Excluded window — not captured
      </div>
    </>
  )
}

export function DesktopScreen(props: ProductProps) {
  const { state } = props
  const personId = isEmployee(state.actorId) ? state.actorId : null
  const observation = personId === null ? null : readObservation(props, personId)
  const open = state.ui.overlay === 'companion'

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) act(props, { type: 'SET_OVERLAY', overlay: null })
  }

  return (
    <section aria-label="Desktop" data-screen="desktop" onKeyDown={onKeyDown} className="relative h-[720px] w-[1280px] overflow-hidden bg-background text-foreground">
      <Wallpaper />
      <BrowserFrame {...props} />
      <ExcludedWindow shown={state.ui.foreground === 'excluded'} />
      <Dock />
      <MenuBar props={props} kind={observation?.kind ?? 'off'} open={open} />
      <CompanionMenu props={props} observation={observation} personId={personId} open={open} />
    </section>
  )
}
