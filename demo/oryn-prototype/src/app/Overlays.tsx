import { Command as CommandIcon, FileSearch, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { ApprovalDrawer, type ApprovalAuthority } from '@/components/domain/approval-drawer'
import { CommandPalette } from '@/components/domain/command-palette'
import { ConsentControls } from '@/components/domain/consent-controls'
import { GateProvenance } from '@/components/domain/gate-provenance'
import { PrivacyPopover } from '@/components/domain/privacy-popover'
import { SimulationProgress } from '@/components/domain/simulation-progress'
import { UnknownDrawer } from '@/components/domain/unknown-drawer'
import { UserChip } from '@/components/domain/user-chip'
import { Breadcrumb, type Crumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ToastRegion } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { JOB_ID } from '@/data/invoices'
import { COUNTS_INITIAL, jobCounts, type DecisionState } from '@/data/approval'
import { CONSENT_INITIAL, type ConsentState } from '@/data/consent'
import { ROLES, type Role } from '@/data/labels'
import { ORGANIZATION_SELECTOR, PEOPLE } from '@/data/people'
import { SUITE_SIZE, type RunEvent, type SuiteVersion } from '@/data/simulation'
import { frameToSeconds } from '@/lib/frame'
import { useCommandShortcut } from '@/lib/shortcut'
import type { ToastItem } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { OverlayState, Theme } from './params'
import { Section, Sub, buttonClass } from './specimen'

/**
 * BOB-01b specimen: CMP-09 drawer and dialog, CMP-10 popover and tooltip, CMP-11 toast and
 * command palette, CMP-12 breadcrumb, keycap, separator and avatar, CMP-13 switch and
 * checkbox, CMP-14 progress, skeleton and scroll area. Open with `?view=overlays`;
 * `?open=<state>` starts with a surface open (see OVERLAY_STATES in params.ts).
 *
 * Nothing here has a timer. Run progress is a pure function of the event list and the
 * frame scrubber, so a seek is repeatable.
 */

const RUN_START = 10
const RUN_END = 100
const RUN_SCRIPTS = {
  complete: [
    { frame: RUN_START, type: 'start' },
    { frame: RUN_END, type: 'complete' },
  ],
  cancel: [
    { frame: RUN_START, type: 'start' },
    { frame: 55, type: 'cancel' },
  ],
  none: [],
} as const satisfies Record<string, readonly RunEvent[]>
type RunScript = keyof typeof RUN_SCRIPTS

const TIMEOUT_TOAST: ToastItem = {
  id: 'timeout',
  kind: 'warning',
  title: 'Submission timed out',
  description: 'INV-48220 \u00b7 ERP submit timed out. Outcome Unknown.',
  actionLabel: 'Open INV-48220',
  anchor: 'timeout-toast',
}
const APPROVAL_TOAST: ToastItem = { id: 'approval', kind: 'info', title: 'Approval Required', description: 'INV-48219' }
const CONTAINED_TOAST: ToastItem = {
  id: 'contained',
  kind: 'warning',
  title: 'INC-0042 Contained',
  description: 'three Kestrel cases paused',
}

const ROUTE: readonly Crumb[] = [
  { label: ORGANIZATION_SELECTOR, href: '#home' },
  { label: 'Jobs', href: '#jobs' },
  { label: JOB_ID },
]

/** A deliberately invalid image, so the fallback path is exercised without any network request. */
const BROKEN_IMAGE = 'data:image/png;base64,AAAA'

const SPECIMEN_ROLES = ['priya', 'marcus', 'daniel', 'tomas'].map((id) => {
  const person = PEOPLE.find((candidate) => candidate.id === id)
  if (!person) throw new Error(`Missing person fixture ${id}`)
  return person
})

export function Overlays({
  theme,
  onThemeChange,
  initialFrame,
  initialOverlay,
}: {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  initialFrame: number
  initialOverlay: OverlayState | null
}) {
  const opener = useRef<HTMLElement | null>(null)
  const remember = (element: HTMLElement | null) => {
    opener.current = element
  }

  const [lastAction, setLastAction] = useState('No action taken')

  const [approvalOpen, setApprovalOpen] = useState(initialOverlay === 'approval' || initialOverlay === 'approval-blocked')
  const [authority, setAuthority] = useState<ApprovalAuthority>(initialOverlay === 'approval-blocked' ? 'absent' : 'valid')
  const [decision, setDecision] = useState<DecisionState>('pending')
  const [readback, setReadback] = useState(false)
  const [unknownOpen, setUnknownOpen] = useState(initialOverlay === 'unknown' || initialOverlay === 'investigate')
  const counts = jobCounts(decision, readback)

  const [consent, setConsent] = useState<ConsentState>(CONSENT_INITIAL)
  const [privacyOpen, setPrivacyOpen] = useState(initialOverlay === 'privacy')
  const [gateOpen, setGateOpen] = useState(initialOverlay === 'gate')

  const [paletteOpen, setPaletteOpen] = useState(
    initialOverlay === 'palette' || initialOverlay === 'palette-empty' || initialOverlay === 'palette-denied',
  )
  const [paletteRole, setPaletteRole] = useState<Role>(initialOverlay === 'palette-denied' ? 'Employee' : 'Workflow Owner')
  const [paletteQuery, setPaletteQuery] = useState(
    initialOverlay === 'palette-empty' ? 'zzz' : initialOverlay === 'palette-denied' ? 'approval' : '',
  )
  const [toasts, setToasts] = useState<readonly ToastItem[]>(initialOverlay === 'toast' ? [TIMEOUT_TOAST] : [])

  const [frame, setFrame] = useState(initialFrame)
  const [script, setScript] = useState<RunScript>('complete')
  const [version, setVersion] = useState<SuiteVersion>('v0.1')
  const [loading, setLoading] = useState(false)

  function openPalette(options: { role: Role; query: string }, from: HTMLElement | null) {
    remember(from)
    setPaletteRole(options.role)
    setPaletteQuery(options.query)
    setPaletteOpen(true)
  }

  useCommandShortcut((active) => openPalette({ role: paletteRole, query: '' }, active))

  function addToast(toast: ToastItem) {
    setToasts((current) => (current.some((item) => item.id === toast.id) ? current : [...current, toast]))
  }

  function openApproval(next: ApprovalAuthority, from: HTMLElement) {
    remember(from)
    setAuthority(next)
    setApprovalOpen(true)
  }

  return (
    <TooltipProvider>
      <main className="mx-auto max-w-[1040px] px-6 py-8">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="type-title">Overlays and consent</h1>
            <p className="mt-2 type-prose text-muted-foreground">
              Drawer, dialog, popover, tooltip, toast, command palette, breadcrumb, keycap, avatar, switch,
              checkbox and progress for the Oryn product layer.
            </p>
          </div>
          <div role="group" aria-label="Theme" className="flex gap-2">
            {(['light', 'dark'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={theme === value}
                onClick={() => onThemeChange(value)}
                className={cn(buttonClass, theme === value && 'bg-foreground text-background hover:bg-foreground')}
              >
                {value === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </header>

        <p className="mt-6 border-y py-3 type-data" role="status" data-last-action="">
          {lastAction}
        </p>

        <div className="mt-8 space-y-12">
          <Section id="drawer" title="Drawer and dialog (CMP-09)">
            <Sub title="Approval drawer, INV-48219">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" icon={<ShieldCheck />} onClick={(event) => openApproval('valid', event.currentTarget)}>
                  Open approval drawer
                </Button>
                <Button
                  variant="outline"
                  icon={<ShieldAlert />}
                  onClick={(event) => openApproval('absent', event.currentTarget)}
                >
                  Open blocked approval drawer
                </Button>
                <Button
                  variant="secondary"
                  disabled={decision !== 'approved' || readback}
                  disabledReason={readback ? 'Readback already recorded' : 'Approve INV-48219 first'}
                  onClick={() => {
                    setReadback(true)
                    setLastAction('Independent readback recorded (specimen event, separate from approval)')
                  }}
                >
                  Record independent readback
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDecision('pending')
                    setReadback(false)
                    setLastAction('Specimen reset')
                  }}
                >
                  Reset
                </Button>
              </div>
              <p className="mt-3 type-data" data-counts-readout="">
                Verified {counts.verified} &middot; Escalated {counts.escalated} &middot; Approval Required {counts.approval}{' '}
                &middot; Outcome Unknown {counts.unknown} (initial {COUNTS_INITIAL.verified}/{COUNTS_INITIAL.escalated}/
                {COUNTS_INITIAL.approval}/{COUNTS_INITIAL.unknown})
              </p>
              <p className="mt-1 type-micro text-muted-foreground">
                Approving moves nothing. The readback button stands in for the separate independent-evidence event.
              </p>
            </Sub>

            <Sub title="Unknown-outcome drawer, INV-48220">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  icon={<FileSearch />}
                  onClick={(event) => {
                    remember(event.currentTarget)
                    setUnknownOpen(true)
                  }}
                >
                  Open unknown drawer
                </Button>
              </div>
              <p className="mt-2 type-micro text-muted-foreground">There is no retry, resubmit or approve control in it.</p>
            </Sub>

            <Sub title="Dialog (destructive confirm)">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Delete local history</Button>
                </DialogTrigger>
                <DialogContent
                  title="Delete local history?"
                  description="Delete eligible local history from this device. Shared contributions and published knowledge are not removed."
                  footer={
                    <>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          variant="danger"
                          onClick={() => setLastAction('Delete confirmed (specimen: nothing deleted)')}
                        >
                          Delete local history
                        </Button>
                      </DialogClose>
                    </>
                  }
                >
                  <p className="type-data text-muted-foreground">Local retention: 7 days</p>
                </DialogContent>
              </Dialog>
            </Sub>
          </Section>

          <Section id="popover" title="Popover and tooltip (CMP-10)">
            <div className="grid grid-cols-2 gap-6">
              <Sub title="Gate provenance (hover or focus the chip)">
                <GateProvenance open={gateOpen} onOpenChange={setGateOpen} />
                <div className="mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setGateOpen(!gateOpen)}>
                    {gateOpen ? 'Hide tooltip' : 'Show tooltip'}
                  </Button>
                </div>
              </Sub>
              <Sub title="Gate provenance (disabled)">
                <GateProvenance disabled disabledReason="Provenance is hidden for a role without gate access" />
              </Sub>
              <Sub title="Privacy popover (click to open)">
                <PrivacyPopover
                  paused={consent.paused}
                  onPausedChange={(paused) => {
                    setConsent({ ...consent, paused })
                    setLastAction(paused ? 'Observation paused (one action)' : 'Observation resumed')
                  }}
                  onOpenMyPrivacy={() => setLastAction('My Privacy opened (specimen)')}
                  open={privacyOpen}
                  onOpenChange={setPrivacyOpen}
                />
              </Sub>
              <Sub title="Privacy popover (disabled)">
                <PrivacyPopover
                  paused={false}
                  onPausedChange={() => undefined}
                  disabled
                  disabledReason="Only the employee can change their own observation settings"
                />
              </Sub>
            </div>
          </Section>

          <Section id="toast-command" title="Toast and command palette (CMP-11)">
            <Sub title="Toast: one at a time">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => addToast(TIMEOUT_TOAST)}>
                  Show timeout toast
                </Button>
                <Button variant="outline" onClick={() => addToast(APPROVAL_TOAST)}>
                  Queue an info toast
                </Button>
                <Button variant="outline" onClick={() => addToast(CONTAINED_TOAST)}>
                  Queue a containment toast
                </Button>
              </div>
              <p className="mt-2 type-data" data-toast-queue="">
                {toasts.length} in queue &middot; 1 visible at most
              </p>
            </Sub>

            <Sub title="Command palette">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 type-data">
                  Role
                  <select
                    value={paletteRole}
                    onChange={(event) => setPaletteRole(event.target.value as Role)}
                    className="h-8 rounded-md border bg-surface px-2 type-data text-foreground"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  variant="outline"
                  icon={<CommandIcon />}
                  trailingIcon={<Kbd>&#8984;K</Kbd>}
                  onClick={(event) => openPalette({ role: paletteRole, query: '' }, event.currentTarget)}
                >
                  Open command palette
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => openPalette({ role: paletteRole, query: 'zzz' }, event.currentTarget)}
                >
                  Open with no match
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => openPalette({ role: 'Employee', query: 'approval' }, event.currentTarget)}
                >
                  Open denied (Employee)
                </Button>
              </div>
              <p className="mt-2 type-micro text-muted-foreground">
                Only commands the selected role may run are listed. Running one records a label here and changes nothing.
              </p>
            </Sub>
          </Section>

          <Section id="breadcrumb" title="Breadcrumb, keycap, separator and avatar (CMP-12)">
            <Sub title="Breadcrumb, current route">
              <Breadcrumb items={ROUTE} onNavigate={(crumb) => setLastAction(`Navigated to ${crumb.label} (specimen)`)} />
            </Sub>
            <Sub title="Breadcrumb, single page">
              <Breadcrumb items={[{ label: ORGANIZATION_SELECTOR }]} />
            </Sub>
            <Sub title="Keycaps and separators">
              <div className="flex flex-wrap items-center gap-4">
                <Kbd>&#8984;K</Kbd>
                <Kbd>Esc</Kbd>
                <span className="type-data text-muted-foreground">Open palette</span>
                <div className="flex h-6 items-center gap-3 type-data">
                  Settings
                  <Separator orientation="vertical" />
                  Privacy
                </div>
              </div>
              <div className="mt-3 w-64">
                <Separator />
              </div>
            </Sub>
            <Sub title="Avatars and roles">
              <div className="flex flex-wrap items-center gap-8">
                {SPECIMEN_ROLES.map((person) => (
                  <UserChip key={person.id} name={person.name} role={person.role ?? undefined} />
                ))}
                <UserChip name={ORGANIZATION_SELECTOR} />
                <UserChip name="Priya Nair" role="Image failed to load" src={BROKEN_IMAGE} />
              </div>
            </Sub>
          </Section>

          <Section id="consent" title="Switch and checkbox (CMP-13)">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <ConsentControls state={consent} onChange={setConsent} />
                <Button
                  variant="primary"
                  disabled={!consent.noticeAccepted}
                  disabledReason="Accept the organization notice first"
                  onClick={() => setLastAction('Accept and continue pressed (specimen: no capture starts here)')}
                >
                  Accept and continue
                </Button>
                {!consent.noticeAccepted && (
                  <p className="type-micro text-muted-foreground">Accept the organization notice first</p>
                )}
              </div>
              <div className="space-y-3">
                <Sub title="Checkbox states">
                  <ul className="space-y-2 type-data">
                    <li className="flex items-center gap-3">
                      <Checkbox checked={false} aria-label="Unchecked example" />
                      Unchecked
                    </li>
                    <li className="flex items-center gap-3">
                      <Checkbox checked aria-label="Checked example" />
                      Checked
                    </li>
                    <li className="flex items-center gap-3">
                      <Checkbox checked locked aria-label="Locked example" />
                      Mandatory, locked on
                    </li>
                  </ul>
                </Sub>
                <Sub title="Switch states">
                  <ul className="space-y-2 type-data">
                    <li className="flex items-center gap-3">
                      <Switch checked={false} aria-label="Off example" />
                      Off
                    </li>
                    <li className="flex items-center gap-3">
                      <Switch checked aria-label="On example" />
                      On
                    </li>
                  </ul>
                </Sub>
              </div>
            </div>
          </Section>

          <Section id="progress" title="Progress, skeleton and scroll area (CMP-14)">
            <div className="flex flex-wrap items-center gap-6 border-y py-3">
              <label className="flex items-center gap-3 type-data">
                Frame
                <input
                  type="range"
                  min={0}
                  max={120}
                  value={frame}
                  onChange={(event) => setFrame(Number(event.target.value))}
                  className="w-56 accent-foreground"
                />
                <span data-frame-readout="" className="inline-block w-[12ch]">
                  {frame} &middot; {frameToSeconds(frame).toFixed(2)} s
                </span>
              </label>
              <div role="group" aria-label="Run events" className="flex gap-2">
                {(Object.keys(RUN_SCRIPTS) as RunScript[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={script === value}
                    onClick={() => setScript(value)}
                    className={cn(buttonClass, script === value && 'bg-foreground text-background hover:bg-foreground')}
                  >
                    {value === 'complete' ? 'Start, complete' : value === 'cancel' ? 'Start, cancel' : 'No events'}
                  </button>
                ))}
              </div>
              <div role="group" aria-label="Suite version" className="flex gap-2">
                {(['v0.1', 'v0.2'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={version === value}
                    onClick={() => setVersion(value)}
                    className={cn(buttonClass, version === value && 'bg-foreground text-background hover:bg-foreground')}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <button type="button" aria-pressed={loading} onClick={() => setLoading(!loading)} className={buttonClass}>
                Loading skeleton
              </button>
            </div>
            <div className="max-w-[640px]">
              <SimulationProgress events={RUN_SCRIPTS[script]} frame={frame} version={version} loading={loading} />
            </div>
            <p className="type-micro text-muted-foreground">
              Run starts at frame {RUN_START}; the complete event is at frame {RUN_END}; cancel is at frame 55. Seek in any
              order: the bar, caption and cyan are the same every time.
            </p>
            <Sub title="Progress states">
              <div className="grid max-w-[480px] gap-3 type-data">
                <Progress value={0} max={SUITE_SIZE} label="Not started" />
                <Progress value={11} max={SUITE_SIZE} label="Executing" executing />
                <Progress value={SUITE_SIZE} max={SUITE_SIZE} label="Complete" />
                <Progress value={11} max={SUITE_SIZE} label="Cancelled" />
                <Progress value={null} label="Count unknown" />
              </div>
              <p className="mt-2 type-micro text-muted-foreground">
                Not started, executing (the only cyan), complete, cancelled, count unknown.
              </p>
            </Sub>
          </Section>
        </div>
      </main>

      <ApprovalDrawer
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        authority={authority}
        decision={decision}
        onDecide={(next) => {
          setDecision(next)
          setLastAction(`INV-48219 decision: ${next} (counts unchanged until readback)`)
        }}
        readbackVerified={readback}
        counts={counts}
        onOpenSource={(source) => setLastAction(`Open source ${source} (specimen)`)}
        returnFocusRef={opener}
      />
      <UnknownDrawer
        open={unknownOpen}
        onOpenChange={setUnknownOpen}
        counts={counts}
        initialInvestigating={initialOverlay === 'investigate'}
        onInvestigate={() => setLastAction('Investigation opened for INV-48220 (nothing resubmitted)')}
        returnFocusRef={opener}
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        role={paletteRole}
        initialQuery={paletteQuery}
        onRun={(command) => setLastAction(`Ran "${command.label}" (specimen: no change)`)}
        returnFocusRef={opener}
      />
      <ToastRegion
        toasts={toasts}
        onAction={(toast) => {
          setLastAction(`Toast action: ${toast.actionLabel} (the case is not resolved)`)
          if (toast.id === TIMEOUT_TOAST.id) setUnknownOpen(true)
        }}
        onDismiss={(toast) => setToasts((current) => current.filter((item) => item.id !== toast.id))}
      />
    </TooltipProvider>
  )
}
