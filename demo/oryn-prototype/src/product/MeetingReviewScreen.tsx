import { Check, CircleDashed, Clock, FileText } from 'lucide-react'
import { TranscriptLine } from '@/components/domain/commitment'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { COMMITMENT, MEETING_QUOTES } from '@/data/commitment'
import { person } from '@/state'
import type { State } from '@/state'
import { FilmTypedText } from '@/film'
import { cn } from '@/lib/utils'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { anchored, at } from './geometry'
import { C, COMMITMENT_CARD, T, TRANSCRIPT_CARD } from './meeting-review-layout'
import { Frame, HiddenAnchors } from './settings-frame'

/**
 * SC11 meeting review and confirmed commitment. Rendered inside the shell, in canvas coordinates:
 * the transcript card and the commitment card are placed from `meeting-review-layout.ts`, and no
 * status, deadline text or viewpoint moves or resizes an anchored element. A pure function of
 * `{ state, film }`: the deadline field shows the film's typed view while it is typing, the
 * clickable app dispatches the draft, and nothing is kept locally.
 *
 * Confirmation is neither company policy nor another person's acceptance: the caveat stays after it.
 */

const MEETING = 'zoom-kestrel' as const
const DANA = person('dana').name
const PRIYA = person('priya').name
const SOURCE_TIME = COMMITMENT.source.slice('Zoom '.length)
const OPT_IN = 'Meeting capture requires per-meeting opt-in.'
const PRIVATE_TRANSCRIPT = 'This transcript is private to the meeting participant.'
const DISCLAIMER = "Confirmation does not establish company policy or another person's acceptance."
const REASON_OWNER = `Only the commitment owner, ${PRIYA}, confirms it.`
const REASON_NOTHING = 'There is no proposed commitment to confirm.'
const REASON_DEADLINE = 'A deadline is required.'

const FIELD_ID = 'meeting-deadline'
const DUE_LABEL_ID = 'meeting-due-label'
const TRANSCRIPT_ID = 'meeting-transcript'
const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** Why Confirm is unavailable (the reducer would refuse), or null when it may be used. */
function confirmBlock(state: State, draft: string | null): string | null {
  if (state.actorId !== 'priya') return REASON_OWNER
  const { status } = state.commitment
  if (status !== 'proposed' && status !== 'edited') return REASON_NOTHING
  return draft !== null && draft.trim() === '' ? REASON_DEADLINE : null
}

export function MeetingReviewScreen(props: ProductProps) {
  const { state, film } = props
  const { commitment } = state
  const owner = state.actorId === 'priya'
  const consented = state.consent.priya.meetings[MEETING] === 'granted'
  const confirmed = commitment.status === 'confirmed'
  const proposed = commitment.status === 'proposed' || commitment.status === 'edited'
  const due = commitment.due ?? ''
  const draft = state.ui.deadlineDraft
  const shown = draft ?? due
  const changed = (commitment.status === 'edited' || confirmed) && due !== COMMITMENT.originalDue
  const typed = confirmed ? undefined : film?.texts?.['deadline']
  const editable = owner && proposed && film === undefined
  const block = confirmBlock(state, draft)
  const confirmFade = confirmed ? motionProgress(film, 'CONFIRM_COMMITMENT') : 1
  const strikeFade = changed ? motionProgress(film, 'EDIT_COMMITMENT') : 1

  const onConfirm = () => {
    const text = draft === null ? null : draft.trim()
    if (text !== null && text !== due) act(props, { type: 'EDIT_COMMITMENT', due: text })
    act(props, { type: 'CONFIRM_COMMITMENT' })
  }
  const openSource = () => {
    if (film === undefined) document.getElementById(TRANSCRIPT_ID)?.focus()
  }

  const field = 'box-border flex h-10 w-full items-center rounded-md border bg-surface px-3 type-data text-foreground'

  return (
    <>
      <Frame
        as="section"
        id={TRANSCRIPT_ID}
        anchor="transcript"
        rect={TRANSCRIPT_CARD}
        tabIndex={-1}
        aria-labelledby="meeting-transcript-title"
        className="outline-none focus:ring-2 focus:ring-ring"
      >
        <h2 id="meeting-transcript-title" className="type-section m-0" style={at(T.title)}>
          Meeting transcript
        </h2>
        {consented && (
          <p className="m-0 flex items-center gap-2 type-data" style={at(T.source)}>
            <FileText aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
            <span>Zoom</span>
            <span className="text-muted-foreground">{SOURCE_TIME}</span>
          </p>
        )}
        <div className="overflow-hidden" style={at(T.lines)}>
          {!consented ? (
            <p className="type-body m-0">{OPT_IN}</p>
          ) : !owner ? (
            <p className="type-body m-0 text-muted-foreground">{PRIVATE_TRANSCRIPT}</p>
          ) : (
            MEETING_QUOTES.map((line) => (
              <TranscriptLine
                key={line.speaker}
                speaker={line.speaker === 'Dana' ? DANA : PRIYA}
                timestamp={line.speaker === 'Dana' ? SOURCE_TIME : null}
                quote={line.quote}
              />
            ))
          )}
        </div>
      </Frame>

      <Frame as="section" anchor="commitment-card" rect={COMMITMENT_CARD} aria-labelledby="meeting-commitment-title">
        {!consented ? (
          <>
            <h2 id="meeting-commitment-title" className="type-section m-0 sr-only">
              {COMMITMENT.title}
            </h2>
            <p className="type-body m-0" style={at(C.optIn)}>
              {OPT_IN}
            </p>
            <HiddenAnchors names={['deadline', 'confirm-commitment', 'meeting-source', 'commitment-status', 'commitment-caveat']} />
          </>
        ) : (
          <>
            <div {...anchored('commitment-status', C.status)}>
              <Badge variant={confirmed ? 'outline' : 'neutral'} className="w-full gap-1">
                <span className="inline-flex items-center gap-1" style={{ opacity: confirmFade }}>
                  {confirmed ? <Check aria-hidden="true" className="size-3 shrink-0" strokeWidth={1.75} /> : <CircleDashed aria-hidden="true" className="size-3 shrink-0" strokeWidth={1.75} />}
                  <span>{confirmed ? 'Confirmed Commitment' : 'Suggested'}</span>
                </span>
              </Badge>
            </div>
            <h2 id="meeting-commitment-title" className="type-card m-0 overflow-hidden" style={at(C.title)}>
              {COMMITMENT.title}
            </h2>

            <p className="type-data m-0 text-muted-foreground" style={at(C.ownerLabel)}>
              Owner
            </p>
            <p className="type-body m-0" style={at(C.ownerValue)}>
              {COMMITMENT.owner}
            </p>

            <p className="type-data m-0 text-muted-foreground" style={at(C.proposedLabel)}>
              Proposed from the meeting
            </p>
            <p className="type-body m-0" style={at(C.proposedValue)}>
              {changed ? (
                <s className="line-through" style={strikeFade < 1 ? { textDecorationColor: `color-mix(in srgb, currentColor ${Math.round(strikeFade * 100)}%, transparent)` } : undefined}>
                  {COMMITMENT.originalDue}
                </s>
              ) : (
                COMMITMENT.originalDue
              )}
            </p>

            <p id={DUE_LABEL_ID} className="m-0 flex items-center gap-2 type-data text-muted-foreground" style={at(C.dueLabel)}>
              <Clock aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
              Due
            </p>
            {editable ? (
              <input
                id={FIELD_ID}
                {...anchored('deadline', C.deadline)}
                aria-labelledby={DUE_LABEL_ID}
                className={cn(field, focusRing, 'font-mono')}
                value={shown}
                spellCheck={false}
                onChange={(event) => act(props, { type: 'DRAFT_DEADLINE', text: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    if (draft !== null) act(props, { type: 'EDIT_COMMITMENT', due: draft.trim() })
                  } else if (event.key === 'Escape') {
                    act(props, { type: 'DRAFT_DEADLINE', text: null })
                  }
                }}
              />
            ) : confirmed ? (
              <div {...anchored('deadline', C.deadline)} className={cn(field, 'border-transparent bg-surface-2')}>
                <span style={{ opacity: confirmFade }}>{due}</span>
              </div>
            ) : (
              <div {...anchored('deadline', C.deadline)} role="textbox" aria-readonly="true" aria-labelledby={DUE_LABEL_ID} className={cn(field, 'overflow-hidden whitespace-nowrap')}>
                {typed ? <FilmTypedText typed={typed} /> : shown}
              </div>
            )}

            <p className="type-data m-0 text-muted-foreground" style={at(C.sourceLabel)}>
              Source
            </p>
            {owner ? (
              <button
                type="button"
                {...anchored('meeting-source', C.source)}
                aria-controls={TRANSCRIPT_ID}
                className={cn('flex items-center gap-2 rounded-sm type-data underline underline-offset-4', focusRing)}
                onClick={openSource}
              >
                <FileText aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                {COMMITMENT.source}
              </button>
            ) : (
              <span {...anchored('meeting-source', C.source)} className="flex items-center gap-2 type-data">
                <FileText aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                {COMMITMENT.source}
              </span>
            )}

            <p className="type-data m-0 text-muted-foreground" style={at(C.noteLabel)}>
              Note
            </p>
            <p {...anchored('commitment-caveat', C.caveat)} className="type-body m-0 overflow-hidden whitespace-nowrap">
              {COMMITMENT.qualifier}
            </p>
            <p className="type-body m-0 text-muted-foreground" style={at(C.sentence)}>
              {DISCLAIMER}
            </p>

            <Button
              variant="primary"
              {...anchored('confirm-commitment', C.confirm)}
              className={confirmed ? 'aria-disabled:cursor-default' : undefined}
              icon={confirmed ? <Check className="size-4" strokeWidth={1.75} /> : undefined}
              disabled={block !== null}
              disabledReason={confirmed ? undefined : (block ?? undefined)}
              aria-describedby={!confirmed && block !== null ? 'meeting-confirm-reason' : undefined}
              onClick={confirmed ? undefined : onConfirm}
            >
              {confirmed ? 'Confirmed' : 'Confirm'}
            </Button>
            <p id="meeting-confirm-reason" className="type-micro m-0 overflow-hidden text-muted-foreground" style={{ ...at(C.reason), display: !confirmed && block !== null ? undefined : 'none' }}>
              {block}
            </p>
          </>
        )}
      </Frame>
    </>
  )
}
