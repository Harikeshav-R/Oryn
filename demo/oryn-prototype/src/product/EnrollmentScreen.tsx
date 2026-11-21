import { ArrowLeft, Check, ChevronDown, ChevronRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import apTrackerMark from '@/assets/marks/google-sheets.svg'
import gmailMark from '@/assets/marks/gmail.svg'
import hubspotMark from '@/assets/marks/hubspot.svg'
import netsuiteMark from '@/assets/marks/netsuite-favicon.png'
import slackMark from '@/assets/marks/slack.svg'
import zoomMark from '@/assets/marks/zoom.svg'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CAPTURE_BLOCK_TEXT, CONSENT_COPY, captureBlock } from '@/data/consent'
import { ORGANIZATION_SELECTOR } from '@/data/people'
import { cn } from '@/lib/utils'
import { WIZARD_STEPS, isEmployee, person } from '@/state'
import type { State, WizardStep } from '@/state'
import { ENROLLMENT_ANCHORS } from './anchors'
import { act, filmAnchor, motionProgress, type FilmContext, type ProductProps } from './contract'
import { C, CARD, FOOTER_ANCHORS, STEP_ANCHORS } from './enrollment-layout'
import { anchored, at, within } from './geometry'
import { observationStatus } from './observation-status'
import { CheckRow, Frame, HiddenAnchors } from './settings-frame'

/**
 * SC02 enrollment wizard. Standalone 1280x720 canvas (no sidebar). Every anchored element is placed
 * with authored coordinates (`enrollment-layout.ts`), so no interaction (expanding the notice,
 * ticking a box, a label change, a step swap) moves or resizes an anchor. State lives only in
 * `props.state`. Anchor names: `ENROLLMENT_ANCHORS` in `anchors.ts`.
 */

const STEP_LABELS: Readonly<Record<WizardStep, string>> = {
  notice: 'Notice',
  capture: 'Capture and sharing',
  scope: 'Work scope',
}

const REASON = {
  notice: 'Acknowledge the notice to continue.',
  category: 'Choose at least one capture category to continue.',
  noticeAccepted: 'Accepted. Use Decline to withdraw.',
  declined: 'Observation is off: the notice was declined.',
  firstStep: 'Notice is the first step.',
  notEnrollee: 'Enrollment is completed by the employee being enrolled, Priya Nair.',
} as const

const NOTICE_PROSE = [
  'Durable private evidence stays on this device.',
  'Authorized cloud inference is transient: nothing is kept by it.',
  'Sharing with the organization requires a separate review.',
] as const

const APPLICATIONS: readonly { readonly name: string; readonly mark: string; readonly note?: string }[] = [
  { name: 'Gmail', mark: gmailMark },
  { name: 'NetSuite', mark: netsuiteMark },
  { name: 'AP Exceptions Tracker', mark: apTrackerMark },
  { name: 'Slack', mark: slackMark },
  { name: 'HubSpot', mark: hubspotMark },
  { name: 'Zoom', mark: zoomMark, note: 'per-meeting consent only' },
]

const onOff = (value: boolean): 'On' | 'Off' => (value ? 'On' : 'Off')
const sharingText = (shared: boolean): 'Shared after review' | 'Not shared' => (shared ? 'Shared after review' : 'Not shared')

/** Opacity of the step body after the latest Next/Back: a 150 ms fade (opacity only, so no anchor ever moves). */
function swapOpacity(film: FilmContext | undefined): number {
  const next = film?.lastApplied('WIZARD_NEXT') ?? null
  const back = film?.lastApplied('WIZARD_BACK') ?? null
  if (next === null && back === null) return 1
  return motionProgress(film, back !== null && (next === null || back > next) ? 'WIZARD_BACK' : 'WIZARD_NEXT')
}

/** Why the primary control is unavailable on this step, or null when it may be used. */
function continueBlock(state: State, step: WizardStep): string | null {
  const id = state.actorId
  if (!isEmployee(id)) return REASON.notEnrollee
  const consent = state.consent[id]
  if (step === 'notice') return consent.noticeAccepted ? null : REASON.notice
  if (step === 'capture') return consent.workApplications || consent.visualObservation ? null : REASON.category
  if (id !== 'priya') return REASON.notEnrollee
  if (consent.noticeDeclined) return REASON.declined
  const block = captureBlock(consent)
  return block ? CAPTURE_BLOCK_TEXT[block] : null
}

function Stepper({ state, complete }: { readonly state: State; readonly complete: boolean }) {
  const current = WIZARD_STEPS.indexOf(state.ui.wizardStep)
  return (
    <ol aria-label="Enrollment progress" className="m-0 list-none p-0" style={{ ...at({ x: CARD.x, y: 40, width: CARD.width, height: 48 }), display: 'flex', gap: 8 }}>
      {WIZARD_STEPS.map((step, index) => {
        const done = complete || index < current
        const isCurrent = !complete && index === current
        return (
          <li key={step} aria-current={isCurrent ? 'step' : undefined} data-step={step} data-state={done ? 'complete' : isCurrent ? 'current' : 'upcoming'} className="relative h-12 w-[208px]">
            <span className={cn('flex h-[44px] items-center gap-2 type-data', isCurrent ? 'text-foreground' : 'text-muted-foreground')}>
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex size-5 shrink-0 items-center justify-center rounded-full border type-micro tracking-normal',
                  isCurrent ? 'border-foreground bg-foreground text-background' : done ? 'border-foreground text-foreground' : 'border-border',
                )}
              >
                {done ? <Check className="size-3" strokeWidth={2.5} /> : index + 1}
              </span>
              <span>{STEP_LABELS[step]}</span>
              {done && <span className="sr-only">complete</span>}
            </span>
            <span aria-hidden="true" className={cn('absolute inset-x-0 bottom-0', isCurrent ? 'h-[2px] bg-signal' : done ? 'h-px bg-trace' : 'h-px bg-border')} />
          </li>
        )
      })}
    </ol>
  )
}

function NoticeStep(props: ProductProps) {
  const { state } = props
  const id = state.actorId
  if (!isEmployee(id)) return null
  const consent = state.consent[id]
  const flat = props.film !== undefined
  const expanded = state.ui.noticeExpanded
  const reveal = motionProgress(props.film, 'SET_NOTICE_EXPANDED')
  const expandedOpacity = expanded ? reveal : 1 - reveal
  const box = C.notice
  return (
    <>
      <Frame as="section" anchor="notice" rect={box} aria-labelledby="enrollment-notice-title" className="rounded-sm bg-transparent">
        <h3 id="enrollment-notice-title" className="type-card" style={at({ x: 16, y: 16, width: 560, height: 22 })}>
          Organization notice
        </h3>
        <Button
          variant="outline"
          size="sm"
          className={cn('absolute', flat && 'transition-none')}
          {...filmAnchor('review-notice')}
          style={at(within(box, C.reviewNotice))}
          icon={expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          aria-expanded={expanded}
          aria-controls="enrollment-notice-panel"
          onClick={() => act(props, { type: 'SET_NOTICE_EXPANDED', expanded: !expanded })}
        >
          Review notice
        </Button>
        <div style={at({ x: 16, y: 88, width: 560, height: 112 })}>
          <div id="enrollment-notice-panel" data-expanded={expanded} className="type-prose" style={{ opacity: expandedOpacity, display: expandedOpacity === 0 ? 'none' : undefined }}>
            {NOTICE_PROSE.map((line) => (
              <p key={line} className="m-0 mb-1">
                {line}
              </p>
            ))}
          </div>
          <p className="type-body m-0 text-muted-foreground" style={{ opacity: 1 - expandedOpacity, display: expandedOpacity === 1 ? 'none' : undefined }}>
            Select Review notice to read how your work is handled. Reading it is not consent.
          </p>
        </div>
      </Frame>
      <CheckRow
        id="enrollment-understand"
        label={CONSENT_COPY.notice}
        checked={consent.noticeAccepted}
        locked={consent.noticeAccepted}
        reason={consent.noticeAccepted ? REASON.noticeAccepted : undefined}
        onCheckedChange={(next) => {
          if (next) act(props, { type: 'ACKNOWLEDGE_NOTICE' })
        }}
        rect={C.understand}
        anchor="understand"
        flat={flat}
        className="box-border px-4"
      />
    </>
  )
}

function CaptureStep(props: ProductProps) {
  const { state } = props
  const id = state.actorId
  if (!isEmployee(id)) return null
  const consent = state.consent[id]
  const flat = props.film !== undefined
  const capture = C.captureConsent
  const sharing = C.sharingConsent
  return (
    <>
      <Frame role="group" anchor="capture-consent" rect={capture} aria-labelledby="enrollment-capture-title" className="rounded-sm bg-transparent">
        <p id="enrollment-capture-title" className="type-card m-0" style={at({ x: 16, y: 12, width: 560, height: 22 })}>
          Permitted work observation
        </p>
        <CheckRow
          id="enrollment-work-applications"
          label={CONSENT_COPY.workApplications}
          checked={consent.workApplications}
          onCheckedChange={(enabled) => act(props, { type: 'SET_CAPTURE_CATEGORY', category: 'workApplications', enabled })}
          rect={within(capture, C.workApplications)}
          anchor="work-applications"
          flat={flat}
        />
        <CheckRow
          id="enrollment-excluded-windows"
          label={CONSENT_COPY.excludedWindows}
          checked
          locked
          reason={CONSENT_COPY.mandatoryReason}
          rect={within(capture, C.excludedWindows)}
          flat={flat}
        />
        <CheckRow
          id="enrollment-visual-observation"
          label={CONSENT_COPY.visualObservation}
          checked={consent.visualObservation}
          onCheckedChange={(enabled) => act(props, { type: 'SET_CAPTURE_CATEGORY', category: 'visualObservation', enabled })}
          rect={within(capture, C.visualObservation)}
          anchor="visual-observation"
          flat={flat}
        />
      </Frame>
      <Frame role="group" anchor="sharing-consent" rect={sharing} aria-labelledby="enrollment-sharing-title" className="rounded-sm bg-transparent">
        <p id="enrollment-sharing-title" className="type-card m-0" style={at({ x: 16, y: 12, width: 560, height: 22 })}>
          {CONSENT_COPY.contribution}
        </p>
        <CheckRow
          id="enrollment-contribution"
          label={CONSENT_COPY.contribution}
          checked={consent.contribution}
          onCheckedChange={(enabled) => act(props, { type: 'SET_CONTRIBUTION', enabled })}
          trailing={<span className="type-micro text-muted-foreground">{sharingText(consent.contribution)}</span>}
          rect={within(sharing, C.contribution)}
          anchor="contribution"
          flat={flat}
        />
        <p className="type-body m-0 text-muted-foreground" style={at({ x: 16, y: 78, width: 560, height: 40 })}>
          Capture acceptance never implies sharing. Sharing is a separate choice, and a contribution is reviewed before anything is shared.
        </p>
      </Frame>
    </>
  )
}

function ScopeStep({ state }: { readonly state: State }) {
  const id = state.actorId
  if (!isEmployee(id)) return null
  const consent = state.consent[id]
  const rows: readonly (readonly [string, string])[] = [
    [CONSENT_COPY.workApplications, onOff(consent.workApplications)],
    [CONSENT_COPY.visualObservation, onOff(consent.visualObservation)],
    [CONSENT_COPY.contribution, sharingText(consent.contribution)],
  ]
  return (
    <>
      <section aria-labelledby="enrollment-scope-apps" style={at({ x: 24, y: 120, width: 232, height: 224 })}>
        <h3 id="enrollment-scope-apps" className="type-card m-0 h-[22px]">
          Approved work applications
        </h3>
        <ul className="m-0 mt-2 list-none p-0">
          {APPLICATIONS.map((app) => (
            <li key={app.name} className="flex h-8 items-center gap-2 type-data">
              <img src={app.mark} alt="" width={16} height={16} className="size-4 shrink-0" />
              <span>{app.name}</span>
              {app.note && <span className="type-micro text-muted-foreground">{app.note}</span>}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="enrollment-scope-excluded" style={at({ x: 272, y: 120, width: 344, height: 96 })}>
        <h3 id="enrollment-scope-excluded" className="type-card m-0 h-[22px]">
          {CONSENT_COPY.mandatoryExclusions}
        </h3>
        <label htmlFor="enrollment-scope-excluded-windows" className="mt-2 flex h-8 cursor-not-allowed items-center gap-3 type-data">
          <Checkbox id="enrollment-scope-excluded-windows" checked locked aria-describedby="enrollment-scope-excluded-reason" />
          <span>{CONSENT_COPY.excludedWindows}</span>
        </label>
        <p id="enrollment-scope-excluded-reason" className="type-micro m-0 text-muted-foreground">
          {CONSENT_COPY.mandatoryReason}
        </p>
      </section>
      <section aria-labelledby="enrollment-scope-choices" style={at({ x: 272, y: 224, width: 344, height: 128 })}>
        <h3 id="enrollment-scope-choices" className="type-card m-0 h-[22px]">
          Your choices
        </h3>
        <dl className="m-0 mt-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex h-8 items-center justify-between gap-3">
              <dt className="type-body whitespace-nowrap">{label}</dt>
              <dd className="type-data m-0 whitespace-nowrap text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}

function CompletePanel({ state }: { readonly state: State }) {
  const id = state.actorId
  if (!isEmployee(id)) return null
  const consent = state.consent[id]
  const rows: readonly (readonly [string, string])[] = [
    [CONSENT_COPY.notice, consent.noticeAccepted ? 'Accepted' : 'Not accepted'],
    [CONSENT_COPY.workApplications, onOff(consent.workApplications)],
    [CONSENT_COPY.visualObservation, onOff(consent.visualObservation)],
    [CONSENT_COPY.contribution, sharingText(consent.contribution)],
  ]
  return (
    <section aria-labelledby="enrollment-complete-title" style={at({ x: 24, y: 120, width: 592, height: 280 })}>
      <h2 id="enrollment-complete-title" className="type-section m-0">
        Enrollment complete
      </h2>
      <dl className="m-0 mt-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex h-8 items-center justify-between gap-3 border-b">
            <dt className="type-body">{label}</dt>
            <dd className="type-data m-0 text-muted-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <p role="status" className="type-data m-0 mt-4">
        {observationStatus(state)}
      </p>
    </section>
  )
}

export function EnrollmentScreen(props: ProductProps) {
  const { state } = props
  const root: CSSProperties = { position: 'absolute', inset: 0, background: 'var(--background)', color: 'var(--foreground)' }
  const actor = person(state.actorId)
  const role = actor.role ?? actor.title
  const identity = `${ORGANIZATION_SELECTOR} \u00b7 ${role}`
  const subtitle = `${actor.name} \u00b7 ${ORGANIZATION_SELECTOR} \u00b7 ${role}`

  if (!isEmployee(state.actorId)) {
    return (
      <div data-screen="SC02" data-view="denied" style={root}>
        <p className="type-data m-0 text-center" style={at({ x: 0, y: 12, width: 1280, height: 20 })}>
          {identity}
        </p>
        <Frame rect={CARD} role="region" aria-labelledby="enrollment-title" className="shadow-none">
          <h1 id="enrollment-title" className="type-title m-0" style={at(C.title)}>
            {CONSENT_COPY.title}
          </h1>
          <p className="type-body m-0 text-muted-foreground" style={at(C.subtitle)}>
            {subtitle}
          </p>
          <p role="status" className="type-body m-0" style={at({ x: 24, y: 120, width: 592, height: 40 })}>
            Enrollment is completed by the employee being enrolled.
          </p>
        </Frame>
        <HiddenAnchors names={ENROLLMENT_ANCHORS} />
      </div>
    )
  }

  const consent = state.consent[state.actorId]
  const complete = state.phase !== 'ST01'
  const step = state.ui.wizardStep
  const flat = props.film !== undefined
  const declined = consent.noticeDeclined
  const block = continueBlock(state, step)
  const primary = step === 'notice' ? CONSENT_COPY.accept : 'Continue'
  const onFirstStep = step === 'notice'
  const hiddenNames = complete ? ENROLLMENT_ANCHORS : ENROLLMENT_ANCHORS.filter((name) => !STEP_ANCHORS[step].includes(name) && !FOOTER_ANCHORS.includes(name))

  return (
    <div data-screen="SC02" data-view={complete ? 'complete' : step} style={root}>
      <p className="type-data m-0 text-center" style={at({ x: 0, y: 12, width: 1280, height: 20 })}>
        {identity}
      </p>
      <Stepper state={state} complete={complete} />
      <Frame rect={CARD} role="region" aria-labelledby="enrollment-title">
        <h1 id="enrollment-title" className="type-title m-0" style={at(C.title)}>
          {CONSENT_COPY.title}
        </h1>
        <p className="type-body m-0 text-muted-foreground" style={at(C.subtitle)}>
          {subtitle}
        </p>
        <div aria-hidden="true" className="bg-border" style={at(C.headerRule)} />
        <div style={{ ...at({ x: 0, y: 0, width: CARD.width, height: CARD.height }), opacity: complete ? 1 : swapOpacity(props.film) }}>
          {complete ? <CompletePanel state={state} /> : step === 'notice' ? <NoticeStep {...props} /> : step === 'capture' ? <CaptureStep {...props} /> : <ScopeStep state={state} />}
        </div>
        {!complete && (
          <>
            <div aria-hidden="true" className="bg-border" style={at(C.footerRule)} />
            <Button
              variant="outline"
              className={cn('absolute', flat && 'transition-none')}
              {...anchored('back', C.back)}
              icon={<ArrowLeft className="size-4" />}
              disabled={onFirstStep}
              disabledReason={REASON.firstStep}
              onClick={() => act(props, { type: 'WIZARD_BACK' })}
            >
              Back
            </Button>
            <p id="enrollment-continue-reason" className="type-data m-0 text-muted-foreground" style={at(C.reason)}>
              {block}
            </p>
            <Button
              variant="outline"
              className={cn('absolute', flat && 'transition-none')}
              {...anchored('decline', C.decline)}
              onClick={() => act(props, { type: 'DECLINE_NOTICE' })}
            >
              Decline
            </Button>
            <Button
              variant="primary"
              className={cn('absolute', flat && 'transition-none')}
              {...anchored('continue', C.continue)}
              disabled={block !== null}
              aria-describedby={block !== null ? 'enrollment-continue-reason' : undefined}
              onClick={() => act(props, step === 'scope' ? { type: 'CONSENT' } : { type: 'WIZARD_NEXT' })}
            >
              {primary}
            </Button>
          </>
        )}
      </Frame>
      {declined && !complete && (
        <p role="status" className="type-data m-0 box-border flex items-center rounded-sm border bg-surface-2 px-3" style={at({ x: CARD.x, y: 632, width: CARD.width, height: 32 })}>
          Observation is off: the notice was declined.
        </p>
      )}
      <HiddenAnchors names={hiddenNames} />
    </div>
  )
}
