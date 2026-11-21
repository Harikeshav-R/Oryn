import { CircleDot, EyeOff, Lock, Pause, Play, Trash2, TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Hatch } from '@/components/ui/hatch'
import { CONSENT_COPY, PRIVACY_LABEL, PROTECTED_FIELD_LABELS } from '@/data/consent'
import { cn } from '@/lib/utils'
import { isEmployee, person } from '@/state'
import { PRIVACY_ANCHORS } from './anchors'
import { CANVAS, act, motionProgress, type ProductProps } from './contract'
import { anchored, at } from './geometry'
import { observationStatus } from './observation-status'
import { B, BLOCK, D, DIALOG } from './privacy-layout'
import { CheckRow, Frame, HiddenAnchors } from './settings-frame'

/**
 * SC03 My Privacy. Rendered inside the shell's content area, in canvas coordinates: one absolutely
 * positioned block at `SHELL.content` (two columns) plus the delete dialog layer over the whole canvas.
 * Every anchored element is placed with authored coordinates (`privacy-layout.ts`); no interaction
 * moves or resizes one. Anchor names: `PRIVACY_ANCHORS` in `anchors.ts`.
 */

/** Generic category entries only: never an account, window title or URL of a real person. */
const EXCLUSION_CATEGORIES: readonly { readonly id: string; readonly label: string; readonly entries: readonly string[] }[] = [
  { id: 'apps', label: 'Excluded apps', entries: ['Password managers', 'Messaging apps'] },
  { id: 'windows', label: 'Excluded windows', entries: ['Private windows', 'Lock screens'] },
  { id: 'urls', label: 'Excluded URLs', entries: ['Banking sites', 'Health portals'] },
]

const STATUS_ICON = { 'Observation active': CircleDot, 'Observation paused': Pause, 'Observation off': EyeOff } as const

const DELETE_BODY = 'Delete eligible local history from this device. Shared contributions and published knowledge are not removed.'
const DELETE_RECEIPT = 'Local history deleted from this device. Shared contributions and published knowledge were not removed.'

export function PrivacyScreen(props: ProductProps) {
  const { state } = props
  const open = state.ui.deleteDialog === 'confirm' && isEmployee(state.actorId)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const interactive = props.film === undefined

  useEffect(() => {
    if (open && interactive) cancelRef.current?.focus()
  }, [open, interactive])

  const block = { position: 'absolute', left: BLOCK.x, top: BLOCK.y, width: BLOCK.width, height: BLOCK.height } as const
  const heading = (
    <h1 className="type-title m-0" style={at(B.heading)}>
      {PRIVACY_LABEL}
    </h1>
  )

  const id = state.actorId
  if (!isEmployee(id)) {
    const actor = person(id)
    return (
      <>
        <div data-screen="SC03" data-view="denied" style={block}>
          {heading}
          <Frame rect={B.exclusions} role="region" aria-label="Not available" className="bg-surface-2">
            <p role="status" className="type-body m-0" style={at({ x: 16, y: 16, width: 568, height: 40 })}>
              Not available: only an Employee manages their own observation consent.
            </p>
            <p className="type-data m-0 text-muted-foreground" style={at({ x: 16, y: 68, width: 568, height: 18 })}>
              {`${actor.name} \u00b7 ${actor.role ?? actor.title}`}
            </p>
          </Frame>
        </div>
        <HiddenAnchors names={PRIVACY_ANCHORS} />
      </>
    )
  }

  const consent = state.consent[id]
  const flat = !interactive
  const status = observationStatus(state)
  const StatusIcon = STATUS_ICON[status]
  const deleted = state.ui.localHistoryDeleted
  const fade = open ? motionProgress(props.film, 'OPEN_DELETE_DIALOG') : 1
  const onDialogKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') act(props, { type: 'CANCEL_DELETE' })
  }

  return (
    <>
      <div data-screen="SC03" data-view={consent.paused ? 'paused' : 'active'} style={block}>
        {heading}

        <Frame as="section" anchor="exclusions" rect={B.exclusions} aria-labelledby="privacy-exclusions-title">
          <h2 id="privacy-exclusions-title" className="type-card m-0" style={at({ x: 16, y: 16, width: 568, height: 22 })}>
            {CONSENT_COPY.exclusions}
          </h2>
          {EXCLUSION_CATEGORIES.map((category, index) => (
            <section key={category.id} aria-labelledby={`privacy-exclusions-${category.id}`} style={at({ x: 16 + index * 196, y: 50, width: 176, height: 76 })}>
              <h3 id={`privacy-exclusions-${category.id}`} className="type-body m-0 mb-2 h-5 font-medium">
                {category.label}
              </h3>
              <ul className="m-0 list-none p-0">
                {category.entries.map((entry) => (
                  <li key={entry} className="type-body flex h-6 items-center gap-2 text-muted-foreground">
                    <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-trace" />
                    {entry}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div aria-hidden="true" className="bg-border" style={at({ x: 16, y: 148, width: 568, height: 1 })} />
          <CheckRow
            id="privacy-mandatory-exclusions"
            label={CONSENT_COPY.mandatoryExclusions}
            checked
            locked
            reason={CONSENT_COPY.mandatoryReason}
            trailing={<Lock aria-hidden="true" className="size-4 text-muted-foreground" />}
            rect={{ x: 16, y: 160, width: 568, height: 32 }}
            flat={flat}
          />
        </Frame>

        <Frame as="section" anchor="retention" rect={B.retention} aria-labelledby="privacy-retention-title">
          <h2 id="privacy-retention-title" className="type-card m-0" style={at({ x: 16, y: 16, width: 568, height: 22 })}>
            {CONSENT_COPY.localRetention}
          </h2>
          <p className="type-prose m-0" style={at({ x: 16, y: 46, width: 568, height: 72 })}>
            Raw capture stays on this device for 7 days. Cloud inference is authorized and transient: it is not kept after the result is returned.
          </p>
        </Frame>

        <Button
          variant="outline"
          className={cn('absolute', flat && 'transition-none')}
          {...anchored('privacy-pause', B.pause)}
          icon={consent.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          onClick={() => act(props, { type: consent.paused ? 'RESUME_OBSERVATION' : 'PAUSE_OBSERVATION' })}
        >
          {consent.paused ? 'Resume observation' : CONSENT_COPY.pause}
        </Button>
        <Button
          variant="outline"
          className={cn('absolute', flat && 'transition-none')}
          {...anchored('delete-local-history', B.deleteHistory)}
          icon={<Trash2 className="size-4" />}
          aria-haspopup="dialog"
          onClick={() => act(props, { type: 'OPEN_DELETE_DIALOG' })}
        >
          {CONSENT_COPY.deleteLocalHistory}
        </Button>
        <p role="status" data-observation={status} className="type-data m-0 flex items-center gap-2" style={at(B.status)}>
          <StatusIcon aria-hidden="true" className="size-4 shrink-0" />
          {status}
        </p>
        <div role="status" className={cn('type-body box-border m-0 rounded-sm px-3 py-2', deleted && 'border bg-surface-2')} style={at(B.receipt)}>
          {deleted ? DELETE_RECEIPT : null}
        </div>

        <Frame as="section" anchor="masked-fields" rect={B.masked} aria-labelledby="privacy-protected-title">
          <h2 id="privacy-protected-title" className="type-card m-0" style={at({ x: 16, y: 16, width: 336, height: 22 })}>
            Protected fields
          </h2>
          {PROTECTED_FIELD_LABELS.map((label, index) => (
            <div key={label} className="flex items-center justify-between" style={at({ x: 16, y: 46 + index * 40, width: 336, height: 40 })}>
              <span className="type-body font-mono">{label}</span>
              <span role="img" aria-label={`${label}: masked`} className="inline-flex">
                <Hatch className="block h-6 w-40 rounded-sm border" />
              </span>
            </div>
          ))}
          <p className="type-micro m-0 text-muted-foreground" style={at({ x: 16, y: 174, width: 336, height: 16 })}>
            Values are masked before storage.
          </p>
        </Frame>

        <Frame as="section" rect={B.summary} aria-labelledby="privacy-summary-title">
          <h2 id="privacy-summary-title" className="type-card m-0" style={at({ x: 16, y: 16, width: 336, height: 22 })}>
            Current status
          </h2>
          <dl className="m-0" style={at({ x: 16, y: 46, width: 336, height: 96 })}>
            {(
              [
                ['Observation', status === 'Observation active' ? 'Active' : status === 'Observation paused' ? 'Paused' : 'Off'],
                ['Retention', '7 days'],
                ['Local history', deleted ? 'Deleted' : 'Retained'],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex h-8 items-center justify-between">
                <dt className="type-body text-muted-foreground">{label}</dt>
                <dd className="type-data m-0">{value}</dd>
              </div>
            ))}
          </dl>
        </Frame>
      </div>

      <div
        data-layer="delete-dialog"
        aria-hidden={open ? undefined : true}
        className="bg-black/80"
        style={{ ...at({ x: 0, y: 0, width: CANVAS.width, height: CANVAS.height }), zIndex: 40, display: open ? undefined : 'none', opacity: fade }}
        onClick={(event) => {
          if (event.target === event.currentTarget) act(props, { type: 'CANCEL_DELETE' })
        }}
      >
        <Frame
          anchor="delete-dialog"
          visible={open}
          rect={DIALOG}
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-delete-title"
          aria-describedby="privacy-delete-body"
          className="shadow-lg"
          style={{ zIndex: 50 }}
          onKeyDown={onDialogKey}
        >
          <TriangleAlert aria-hidden="true" className="text-foreground" size={20} style={at(D.icon)} />
          <h2 id="privacy-delete-title" className="type-section m-0" style={at(D.title)}>
            Delete local history?
          </h2>
          <p id="privacy-delete-body" className="type-body m-0 text-muted-foreground" style={at(D.body)}>
            {DELETE_BODY}
          </p>
          <Button
            ref={cancelRef}
            variant="outline"
            className={cn('absolute', flat && 'transition-none')}
            {...anchored('delete-cancel', D.cancel, open)}
            onClick={() => act(props, { type: 'CANCEL_DELETE' })}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className={cn('absolute', flat && 'transition-none')}
            {...anchored('delete-confirm', D.confirm, open)}
            icon={<Trash2 className="size-4" />}
            onClick={() => act(props, { type: 'CONFIRM_DELETE_LOCAL_HISTORY' })}
          >
            {CONSENT_COPY.deleteLocalHistory}
          </Button>
        </Frame>
      </div>
    </>
  )
}
