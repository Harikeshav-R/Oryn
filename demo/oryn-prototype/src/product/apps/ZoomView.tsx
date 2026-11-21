import { ChevronRight, CircleStop, Mic, PhoneOff, Users, Video } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { COMMITMENT, MEETING_QUOTES } from '@/data/commitment'
import { sampleMotion } from '@/film'
import type { Rect } from '@/film'
import { cn } from '@/lib/utils'
import { isEmployee, person, recordingActive } from '@/state'
import type { State } from '@/state'
import { act, motionProgress } from '../contract'
import type { FilmContext, ProductProps } from '../contract'
import { appTabMeta } from '../desktop-data'
import { anchored, at, within } from '../geometry'
import { appAnchored, appAt } from './frame'
import { ZOOM_ANCHOR_RECTS as R, ZOOM_BANNER, ZOOM_CONTROLS, ZOOM_GRID, ZOOM_QUOTE, ZOOM_RAIL, ZOOM_TILE, ZOOM_TOP_BAR } from './zoom-layout'

/**
 * APP-08 original generic meeting view: two named tiles (Dana Whitfield, Priya Nair), the
 * per-meeting consent banner, a quotation panel and the controls rail. A pure function of
 * `{ state, film }`: the consent banner, the recording indicator, the waveform and the quotations
 * all derive from reducer state and the film frame, never from a timer or local state.
 *
 * The recording indicator needs capture AND this meeting's own consent AND a live meeting, and is
 * shown only to the participant whose capture it is. Passive observation is neutral ink: the
 * execution cyan never appears here.
 */

const MEETING = 'zoom-kestrel' as const
const MARK = appTabMeta('zoom').mark
const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

const DANA = person('dana').name
const PRIYA = person('priya').name
const DANA_QUOTE = MEETING_QUOTES[0].quote
const PRIYA_QUOTE = MEETING_QUOTES[1].quote
const SOURCE_TIME = COMMITMENT.source.slice('Zoom '.length)

const REASON_NOT_EMPLOYEE = 'Only an Employee manages their own observation consent.'
const REASON_NOT_PARTICIPANT = `Only ${PRIYA}, the meeting participant, decides capture for this meeting.`
const REASON_ENDED = 'The meeting has already ended.'

/** Dana's statement enters over 500 ms; Priya's pre-composed reply is revealed left to right over 900 ms. */
const DANA_ENTER_FRAMES = 15
const PRIYA_REVEAL_FRAMES = 27

const WAVE_SETTLED: readonly number[] = [10, 18, 26, 14, 22, 12, 20]

/** Bar heights from the film frame alone; the settled shape in the clickable app and under reduced motion. */
function waveHeights(film: FilmContext | undefined): readonly number[] {
  if (film === undefined || film.reducedMotion) return WAVE_SETTLED
  return WAVE_SETTLED.map((_, index) => 6 + Math.round(20 * Math.abs(Math.sin(film.frame * 0.4 + index * 1.7))))
}

/** Eased 0..1 progress since the last accepted quotation; 1 when none landed in this clip or outside a film. */
function quoteProgress(film: FilmContext | undefined, frames: number, easing: 'reveal' | 'linear'): number {
  if (film === undefined) return 1
  const since = film.lastApplied('SHOW_MEETING_QUOTE')
  if (since === null) return 1
  return sampleMotion(since, frames, easing)(film).progress
}

/** Why this viewpoint cannot start or decline capture for this meeting, or null when it may. */
function consentBlock(state: State): string | null {
  if (!isEmployee(state.actorId)) return REASON_NOT_EMPLOYEE
  return state.actorId === 'priya' ? null : REASON_NOT_PARTICIPANT
}

function Tile({ anchor, rect, name, initials, children }: { readonly anchor: 'tile-dana' | 'tile-priya'; readonly rect: Rect; readonly name: string; readonly initials: string; readonly children?: ReactNode }) {
  return (
    <div {...anchored(anchor, within(ZOOM_GRID, rect))} role="group" aria-label={`${name} video tile`} className="overflow-hidden bg-foreground dark:bg-surface-2">
      <div
        aria-hidden="true"
        className="flex items-center justify-center rounded-full bg-signal font-sans text-[28px] font-bold leading-[34px] text-background dark:bg-border dark:text-foreground"
        style={at(ZOOM_TILE.avatar)}
      >
        {initials}
      </div>
      {children}
      <div className="box-border flex items-center border-t border-signal bg-foreground px-3 type-data text-background dark:border-border dark:bg-background dark:text-foreground" style={at(ZOOM_TILE.strip)}>
        {name}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 border border-border" />
    </div>
  )
}

export function ZoomView(props: ProductProps) {
  const { state, film } = props
  const meeting = state.ui.app.meeting
  const ended = meeting.ended
  const consent = state.consent.priya.meetings[MEETING]
  const owner = state.actorId === 'priya'
  const recording = owner && !ended && recordingActive(state, 'priya')
  const block = consentBlock(state)
  const banner = R['meeting-consent']
  const panel = R['meeting-quote']
  const rail = ZOOM_RAIL

  // Consent banner: which copy shows, and the 150 ms resolve once the choice has landed.
  const choice = consent === 'granted' ? 'GRANT_MEETING_CONSENT' : 'DENY_MEETING_CONSENT'
  const resolve = consent === 'absent' ? 1 : motionProgress(film, choice)
  const absent = consent === 'absent' && !ended
  const resolvedLine = !ended && consent === 'granted' && recording

  // Quotations.
  const quotesShown = owner && meeting.quote !== 'none'
  const danaEnter = meeting.quote === 'dana' ? quoteProgress(film, DANA_ENTER_FRAMES, 'reveal') : 1
  const priyaReveal = meeting.quote === 'priya' ? quoteProgress(film, PRIYA_REVEAL_FRAMES, 'linear') : 0
  const canReview = quotesShown && meeting.quote === 'priya' && state.phase === 'ST02' && owner
  const nextSpeaker = meeting.quote === 'none' ? 'dana' : 'priya'
  const canCaption = film === undefined && recording && meeting.quote !== 'priya'

  const bannerText = (
    <>
      <p className="type-data m-0 overflow-hidden whitespace-nowrap" style={at(within(banner, ZOOM_BANNER.heading))}>
        Meeting notice and consent
      </p>
      <p className="type-body m-0 overflow-hidden whitespace-nowrap" style={at(within(banner, ZOOM_BANNER.body))}>
        Meeting capture: consent required
      </p>
    </>
  )

  const incoming = (): ReactNode => {
    if (ended) {
      return (
        <p className="type-body m-0 overflow-hidden whitespace-nowrap text-muted-foreground" style={at(within(banner, ZOOM_BANNER.ended))}>
          {consent === 'granted' ? 'Capture for this meeting has stopped.' : 'No capture was started for this meeting.'}
        </p>
      )
    }
    if (consent === 'absent') {
      return (
        <>
          <p className="type-data m-0 overflow-hidden whitespace-nowrap" style={at(within(banner, ZOOM_BANNER.heading))}>
            Meeting notice and consent
          </p>
          <p
            id="zoom-consent-state"
            className={cn('m-0 overflow-hidden whitespace-nowrap', block === null ? 'type-body' : 'type-body text-muted-foreground')}
            style={at(within(banner, ZOOM_BANNER.body))}
          >
            {block ?? 'Meeting capture: consent required'}
          </p>
        </>
      )
    }
    if (consent === 'denied') {
      return (
        <>
          <p className="type-data m-0 overflow-hidden whitespace-nowrap" style={at(within(banner, ZOOM_BANNER.heading))}>
            Meeting notice and consent
          </p>
          <p role="status" className="type-body m-0 overflow-hidden whitespace-nowrap" style={at(within(banner, ZOOM_BANNER.body))}>
            Meeting capture declined for this meeting
          </p>
        </>
      )
    }
    if (resolvedLine) {
      return (
        <p role="status" className="m-0" style={at(within(banner, ZOOM_BANNER.resolved))}>
          <span className="type-body overflow-hidden whitespace-nowrap">Capture is on for this meeting only</span>
        </p>
      )
    }
    return (
      <>
        <p className="type-data m-0 overflow-hidden whitespace-nowrap" style={at(within(banner, ZOOM_BANNER.heading))}>
          Meeting notice and consent
        </p>
        <p role="status" className="type-body m-0 overflow-hidden whitespace-nowrap text-muted-foreground" style={at(within(banner, ZOOM_BANNER.body))}>
          {owner ? 'Consent given for this meeting; capture is not active.' : 'Meeting capture status is private to its participant.'}
        </p>
      </>
    )
  }

  const priyaShown = quotesShown && meeting.quote === 'priya'
  const quoteRows = (
    <>
      <span {...anchored('quote-dana', within(panel, R['quote-dana']), quotesShown)} className="block overflow-hidden">
        {quotesShown && (
          <span className="relative block h-full w-full" style={{ transform: `translateY(${Math.round((1 - danaEnter) * 8)}px)` }}>
            <span className="absolute block type-data" style={at(ZOOM_QUOTE.label)}>
              <span className="block">{DANA}</span>
              <span className="block font-mono text-[11px] leading-4 text-muted-foreground">{SOURCE_TIME}</span>
            </span>
            <span className="absolute block font-serif text-[16px] leading-6" style={at(ZOOM_QUOTE.text)}>
              {`\u201c${DANA_QUOTE}\u201d`}
            </span>
          </span>
        )}
      </span>
      <span aria-hidden="true" className="absolute block bg-border" style={{ ...at(within(panel, ZOOM_QUOTE.rule)), display: priyaShown ? undefined : 'none' }} />
      <span {...anchored('quote-priya', within(panel, R['quote-priya']), priyaShown)} className="block overflow-hidden">
        {priyaShown && (
          <span className="relative block h-full w-full">
            <span className="absolute block type-data" style={at(ZOOM_QUOTE.label)}>
              <span className="block">{PRIYA}</span>
              <span className="block font-mono text-[11px] leading-4 text-muted-foreground">Time unknown</span>
            </span>
            <span className="absolute block font-serif text-[16px] leading-6" style={at(ZOOM_QUOTE.text)}>
              <span className="inline-block whitespace-nowrap" style={{ clipPath: `inset(0 ${Number(((1 - priyaReveal) * 100).toFixed(2))}% 0 0)` }}>
                {`\u201c${PRIYA_QUOTE}\u201d`}
              </span>
            </span>
            {canReview && <ChevronRight aria-hidden="true" className="absolute size-4" strokeWidth={1.75} style={{ left: 792, top: 10 }} />}
          </span>
        )}
      </span>
    </>
  )

  const panelProps = {
    ...appAnchored('meeting-quote', panel, quotesShown),
    className: cn('box-border block overflow-hidden rounded-lg bg-surface text-left text-foreground', canReview && cn('hover:bg-surface-2', focusRing)),
  }
  const panelStyle = { ...panelProps.style, opacity: danaEnter }

  const bars = waveHeights(film)

  return (
    <>
      <div className="flex items-center gap-3 border-b bg-surface px-4" style={appAt(ZOOM_TOP_BAR)}>
        <img src={MARK} alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
        <span className="font-sans text-[14px] font-medium leading-5">Zoom</span>
        <span className="type-micro text-muted-foreground">{appTabMeta('zoom').host}</span>
        <span className="ml-auto type-micro text-muted-foreground">Participants: 2</span>
      </div>

      <section {...appAnchored('meeting-consent', banner)} aria-label="Meeting consent" className="rounded-lg bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg border" />
        {resolve < 1 && (consent === 'granted' || consent === 'denied') && !ended && (
          <div aria-hidden="true" style={{ opacity: 1 - resolve }}>
            {bannerText}
          </div>
        )}
        <div style={{ opacity: resolve }}>
          {incoming()}
        </div>
        <div
          {...anchored('meeting-ended', within(banner, R['meeting-ended']), ended)}
          className="box-border flex items-center gap-2 rounded-sm border bg-surface-2 px-2 type-data"
        >
          {ended && (
            <>
              <PhoneOff aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
              <span>Meeting ended</span>
            </>
          )}
        </div>
        <div
          {...anchored('recording-indicator', within(banner, R['recording-indicator']), resolvedLine)}
          className="box-border flex items-center gap-2 rounded-sm border bg-surface-2 px-2 type-data"
        >
          {resolvedLine && (
            <>
              <span aria-hidden="true" className="inline-block size-2 shrink-0 rounded-full bg-foreground" style={{ opacity: resolve }} />
              <span style={{ opacity: resolve }}>Recording</span>
            </>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          {...anchored('consent-action', within(banner, R['consent-action']), absent)}
          disabled={block !== null}
          disabledReason={block ?? undefined}
          aria-describedby={block !== null ? 'zoom-consent-state' : undefined}
          onClick={() => act(props, { type: 'GRANT_MEETING_CONSENT', meetingId: MEETING })}
        >
          Start for this meeting
        </Button>
        <Button
          variant="ghost"
          size="sm"
          {...anchored('consent-decline', within(banner, R['consent-decline']), absent)}
          disabled={block !== null}
          disabledReason={block ?? undefined}
          aria-describedby={block !== null ? 'zoom-consent-state' : undefined}
          onClick={() => act(props, { type: 'DENY_MEETING_CONSENT', meetingId: MEETING })}
        >
          Not for this meeting
        </Button>
      </section>

      <div role="group" aria-label="Participants" style={appAt(ZOOM_GRID)}>
        <Tile anchor="tile-dana" rect={R['tile-dana']} name={DANA} initials="DW">
          {recording && (
            <div aria-hidden="true" data-wave="" className="flex items-end justify-center gap-1" style={at(ZOOM_TILE.wave)}>
              {bars.map((height, index) => (
                <span key={`bar-${index}`} className="w-1 rounded-full bg-background dark:bg-foreground" style={{ height }} />
              ))}
            </div>
          )}
        </Tile>
        <Tile anchor="tile-priya" rect={R['tile-priya']} name={PRIYA} initials="PN" />
      </div>

      {canReview ? (
        <button
          type="button"
          {...panelProps}
          style={panelStyle}
          onClick={() => act(props, { type: 'REVIEW_MEETING' })}
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg border" />
          {quoteRows}
          <span className="sr-only">Open the meeting review</span>
        </button>
      ) : (
        <section {...panelProps} aria-label="Meeting quotations" style={panelStyle}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg border" />
          {quoteRows}
        </section>
      )}

      <div role="group" aria-label="Meeting controls" style={appAt(rail)} className="rounded-lg bg-surface">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg border" />
        <div aria-hidden="true" className="flex items-center gap-2 type-data text-muted-foreground" style={at(within(rail, ZOOM_CONTROLS.mic))}>
          <Mic className="size-4 shrink-0" strokeWidth={1.75} />
          Mute
        </div>
        <div aria-hidden="true" className="flex items-center gap-2 type-data text-muted-foreground" style={at(within(rail, ZOOM_CONTROLS.video))}>
          <Video className="size-4 shrink-0" strokeWidth={1.75} />
          Video
        </div>
        <div aria-hidden="true" className="flex items-center gap-2 type-data text-muted-foreground" style={at(within(rail, ZOOM_CONTROLS.users))}>
          <Users className="size-4 shrink-0" strokeWidth={1.75} />
          Participants
        </div>
        {canCaption && (
          <Button
            variant="outline"
            size="sm"
            style={at(within(rail, ZOOM_CONTROLS.caption))}
            onClick={() => act(props, { type: 'SHOW_MEETING_QUOTE', speaker: nextSpeaker })}
          >
            Show next caption
          </Button>
        )}
        <p id="zoom-end-reason" className="type-micro m-0 overflow-hidden whitespace-nowrap text-right text-muted-foreground" style={{ ...at(within(rail, ZOOM_CONTROLS.reason)), display: ended ? undefined : 'none' }}>
          {REASON_ENDED}
        </p>
        <Button
          variant="outline"
          {...anchored('end-meeting', within(rail, R['end-meeting']))}
          icon={<CircleStop className="size-4" strokeWidth={1.75} />}
          disabled={ended}
          disabledReason={REASON_ENDED}
          aria-describedby={ended ? 'zoom-end-reason' : undefined}
          onClick={() => act(props, { type: 'END_MEETING' })}
        >
          End meeting
        </Button>
      </div>
    </>
  )
}
