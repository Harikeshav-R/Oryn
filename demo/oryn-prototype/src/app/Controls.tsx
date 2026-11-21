import { Download, Check, Pause, Play, Send, UserCheck, X, MessageSquareMore, Compass } from 'lucide-react'
import { useState } from 'react'
import { AuditTable } from '@/components/domain/audit-table'
import { CaseTable } from '@/components/domain/case-table'
import { LifecycleStepper, type StepperOrientation } from '@/components/domain/lifecycle-stepper'
import { StatusBadge } from '@/components/domain/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TableState } from '@/components/ui/table'
import { INVOICE_CASES } from '@/data/invoices'
import {
  CAPABILITIES,
  COMMAND_PLACEHOLDER,
  DEADLINE_CONFIRMED,
  DEADLINE_DRAFT,
  INTENT,
  LIFECYCLE_STEPS,
  ROLES,
  type LifecycleStep,
} from '@/data/labels'
import { PLAIN_BADGES, STATUS_IDS, type StatusId } from '@/data/status'
import { ORBIT_FRAMES, frameToSeconds } from '@/lib/frame'
import { typedText } from '@/lib/typing'
import { cn } from '@/lib/utils'
import type { Theme } from './params'
import { Section, Sub, buttonClass } from './specimen'

/**
 * BOB-01a specimen: CMP-03 button, CMP-04 input/textarea, CMP-05 select/tabs,
 * CMP-06 badges, CMP-07 tables, CMP-08 stepper. Open with `?view=controls`.
 * One frame scrubber drives every film-derived value: orbit phase, typing and press.
 */

const TYPE_SEED = 1
/** Film click on the Approve specimen: press starts at this frame and is released 6 frames later. */
const PRESS_START = 60
const PRESS_END = 66

const VARIANTS: readonly ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link']
const SIZES: readonly ButtonSize[] = ['sm', 'default', 'lg']
const ORIENTATIONS: readonly StepperOrientation[] = ['horizontal', 'vertical', 'orbit']

export function Controls({
  theme,
  onThemeChange,
  initialFrame,
  initialRunning,
  initialRoleOpen,
}: {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  initialFrame: number
  initialRunning: boolean
  initialRoleOpen: boolean
}) {
  const [frame, setFrame] = useState(initialFrame)
  const [running, setRunning] = useState(initialRunning)
  const [role, setRole] = useState<string>('Workflow Owner')
  const [roleOpen, setRoleOpen] = useState(initialRoleOpen)
  const [capability, setCapability] = useState<string>('Observe')
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null)
  const [auditVisible, setAuditVisible] = useState(15)
  const [tableState, setTableState] = useState<TableState>('ready')
  const [orientation, setOrientation] = useState<StepperOrientation>('horizontal')
  const [step, setStep] = useState<LifecycleStep>('Simulate')
  const [lastAction, setLastAction] = useState('No action taken')
  const [command, setCommand] = useState('')

  const pressFrame = frame >= PRESS_START && frame < PRESS_END ? frame - PRESS_START : null
  const typedIntent = typedText(INTENT, TYPE_SEED, 'intent-field', frame)
  const selectedRow = INVOICE_CASES.find((row) => row.invoice === selectedCase)

  return (
    <main className="mx-auto max-w-[1040px] px-6 py-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="type-title">Basic controls</h1>
          <p className="mt-2 type-prose text-muted-foreground">
            Button, field, select, tabs, status, table and lifecycle stepper for the Oryn product layer.
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

      <div className="mt-6 flex flex-wrap items-center gap-6 border-y py-3">
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
            {frame} · {frameToSeconds(frame).toFixed(2)} s
          </span>
        </label>
        <button type="button" aria-pressed={running} onClick={() => setRunning(!running)} className={buttonClass}>
          {running ? 'Stop run' : 'Start run'}
        </button>
        <span className="type-micro text-muted-foreground" data-orbit-phase="">
          Orbit turn {ORBIT_FRAMES} frames
        </span>
      </div>

      <div className="mt-8 space-y-12">
        <Section id="buttons" title="Button (CMP-03)">
          <Sub title="Variants and sizes">
            <table className="border-collapse">
              <caption className="sr-only">Button variants by size</caption>
              <thead>
                <tr className="text-left type-micro text-muted-foreground">
                  <th scope="col" className="pb-2 pr-6 font-medium">Variant</th>
                  {SIZES.map((size) => (
                    <th key={size} scope="col" className="pb-2 pr-6 font-medium">
                      {size} {size === 'sm' ? '32' : size === 'lg' ? '44' : '40'}
                    </th>
                  ))}
                  <th scope="col" className="pb-2 font-medium">icon 40</th>
                </tr>
              </thead>
              <tbody>
                {VARIANTS.map((variant) => (
                  <tr key={variant}>
                    <th scope="row" className="py-1 pr-6 text-left type-data">{variant}</th>
                    {SIZES.map((size) => (
                      <td key={size} className="py-1 pr-6">
                        <Button variant={variant} size={size} icon={variant === 'link' ? undefined : <Check />}>
                          Confirm
                        </Button>
                      </td>
                    ))}
                    <td className="py-1">
                      <Button variant={variant} size="icon" icon={<Check />} aria-label={`Confirm (${variant} icon)`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Sub>

          <Sub title="Exact labels">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" icon={<Check />} onClick={() => setLastAction('Accept and continue pressed')}>
                Accept and continue
              </Button>
              <Button variant="secondary" icon={<Pause />} onClick={() => setLastAction('Pause pressed')}>
                Pause
              </Button>
              <Button variant="primary" onClick={() => setLastAction('Confirm pressed')}>Confirm</Button>
              <Button variant="primary" icon={<Send />} onClick={() => setLastAction('Publish pressed')}>
                Publish
              </Button>
              <Button variant="outline" icon={<Play />} onClick={() => setLastAction('Run scenarios pressed')}>
                Run scenarios
              </Button>
              <Button
                variant="primary"
                icon={<UserCheck />}
                pressFrame={pressFrame}
                onClick={() => setLastAction('Approve pressed')}
              >
                Approve
              </Button>
              <Button variant="danger" icon={<X />} onClick={() => setLastAction('Reject pressed')}>
                Reject
              </Button>
              <Button variant="outline" icon={<MessageSquareMore />} onClick={() => setLastAction('Request Changes pressed')}>
                Request Changes
              </Button>
              <Button variant="ghost" icon={<Compass />} onClick={() => setLastAction('Guide Me pressed')}>
                Guide Me
              </Button>
              <Button variant="secondary" onClick={() => setLastAction('Request approval pressed')}>
                Request approval
              </Button>
              <Button variant="outline" icon={<Download />} onClick={() => setLastAction('Export audit pack pressed')}>
                Export audit pack
              </Button>
            </div>
            <p className="mt-3 type-data" data-last-action="" role="status">
              {lastAction}
            </p>
            <p className="mt-1 type-micro text-muted-foreground">
              The Approve button presses to scale .97 between frames {PRESS_START} and {PRESS_END}. Pressing a
              button here records a label only; nothing is approved or published.
            </p>
          </Sub>

          <Sub title="Disabled and loading">
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex flex-col items-start gap-1">
                <Button
                  variant="primary"
                  icon={<UserCheck />}
                  disabled
                  disabledReason="Requires Tier 3 approval - Daniel Okafor"
                  onClick={() => setLastAction('Approve pressed while disabled (must never appear)')}
                >
                  Approve
                </Button>
                <p className="type-micro text-muted-foreground">Requires Tier 3 approval - Daniel Okafor</p>
              </div>
              <div className="flex flex-col items-start gap-1">
                <Button variant="outline" disabled disabledReason="Select an invoice case first">
                  Request approval
                </Button>
                <p className="type-micro text-muted-foreground">Select an invoice case first</p>
              </div>
              <div className="flex flex-col items-start gap-1">
                <Button variant="primary" icon={<Send />} loading loadingLabel="Publishing in progress" frame={frame}>
                  Publish
                </Button>
                <p className="type-micro text-muted-foreground">Loading: neutral ring, no success mark</p>
              </div>
              <div className="flex flex-col items-start gap-1">
                <Button variant="outline" icon={<Play />} loading executing={running} frame={frame} loadingLabel="Scenarios in progress">
                  Run scenarios
                </Button>
                <p className="type-micro text-muted-foreground">Arc node only while the run is started</p>
              </div>
              <div className="flex flex-col items-start gap-1">
                <Button variant="primary" loading frame={frame}>
                  Confirm
                </Button>
                <p className="type-micro text-muted-foreground">No icon: ring centred, width unchanged</p>
              </div>
            </div>
          </Sub>
        </Section>

        <Section id="fields" title="Input and textarea (CMP-04)">
          <div className="grid grid-cols-2 gap-6">
            <Field label="Intent" hint="Draft. Not submitted until confirmed.">
              {(control) => (
                <Textarea data-anchor="intent-field" rows={3} defaultValue={INTENT} {...control} />
              )}
            </Field>
            <Field label="Intent (film typing)" hint={`Revealed from frame 0 at 28\u201334 chars/s, seed ${TYPE_SEED}.`}>
              {(control) => (
                <Textarea rows={3} readOnly value={typedIntent} {...control} />
              )}
            </Field>
            <Field label="Deadline (draft)" hint="Proposed in the meeting. Not yet a commitment.">
              {(control) => <Input data-anchor="deadline-field" readOnly value={DEADLINE_DRAFT} {...control} />}
            </Field>
            <Field label="Deadline (confirmed)" hint="Confirmed commitment.">
              {(control) => <Input readOnly value={DEADLINE_CONFIRMED} {...control} />}
            </Field>
            <Field label="Command search">
              {(control) => (
                <Input
                  placeholder={COMMAND_PLACEHOLDER}
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  {...control}
                />
              )}
            </Field>
            <Field label="Command search (dense, filled)">
              {(control) => <Input density="dense" defaultValue="Export audit pack" {...control} />}
            </Field>
            <Field label="Deadline (read-only)" hint="Read-only: set by the confirmed commitment.">
              {(control) => <Input readOnly defaultValue={DEADLINE_CONFIRMED} {...control} />}
            </Field>
            <Field label="Deadline (invalid)" error="Enter a day and 24-hour time, for example Fri 12:00.">
              {(control) => <Input defaultValue="Friday noon-ish" {...control} />}
            </Field>
            <Field label="Intent (disabled)" hint="Disabled: the agent version is locked.">
              {(control) => <Textarea disabled rows={3} defaultValue={INTENT} {...control} />}
            </Field>
          </div>
        </Section>

        <Section id="select-tabs" title="Select and tabs (CMP-05)">
          <div className="grid grid-cols-2 gap-6">
            <Field label="Role" hint="Choosing a role does not confer authority.">
              {(control) => (
                <>
                  <Select
                    {...control}
                    options={ROLES.map((value) => ({ value, label: value }))}
                    value={role}
                    onValueChange={setRole}
                    open={roleOpen}
                    onOpenChange={setRoleOpen}
                  />
                  <div>
                    <Button variant="outline" size="sm" onClick={() => setRoleOpen(true)}>
                      Open role menu
                    </Button>
                  </div>
                </>
              )}
            </Field>
            <Field label="Role (option unavailable)" hint="Admin is listed with its reason.">
              {(control) => (
                <Select
                  {...control}
                  options={ROLES.map((value) => ({
                    value,
                    label: value,
                    disabled: value === 'Admin',
                    reason: value === 'Admin' ? 'Cannot approve finance by default' : undefined,
                  }))}
                  placeholder="Choose a role"
                />
              )}
            </Field>
            <Field label="Role (invalid)" error="Choose a role. A role does not grant authority.">
              {(control) => (
                <Select {...control} options={ROLES.map((value) => ({ value, label: value }))} placeholder="Choose a role" />
              )}
            </Field>
            <Field label="Role (disabled)" hint="Viewpoint is locked while an approval is open.">
              {(control) => (
                <Select {...control} options={ROLES.map((value) => ({ value, label: value }))} value="Approver" disabled />
              )}
            </Field>
          </div>

          <Sub title="Tabs: underline">
            <Tabs value={capability} onValueChange={setCapability}>
              <TabsList aria-label="Capability">
                {CAPABILITIES.map((label) => (
                  <TabsTrigger key={label} value={label}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {CAPABILITIES.map((label) => (
                <TabsContent key={label} value={label}>
                  <p className="type-body">
                    {label} is shown. Selecting a tab only changes this panel; nothing starts and no authority is granted.
                  </p>
                </TabsContent>
              ))}
            </Tabs>
          </Sub>
          <Sub title="Tabs: segmented, one disabled">
            <Tabs variant="segmented" defaultValue="Guide">
              <TabsList aria-label="Capability, segmented">
                {CAPABILITIES.map((label) => (
                  <TabsTrigger
                    key={label}
                    value={label}
                    disabled={label === 'Run Autonomously'}
                    aria-describedby={label === 'Run Autonomously' ? 'tab-disabled-reason' : undefined}
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p id="tab-disabled-reason" className="mt-2 type-micro text-muted-foreground">
              Run Autonomously is unavailable: running needs a separate authorization.
            </p>
          </Sub>
        </Section>

        <Section id="status" title="Status badge (CMP-06)">
          <Sub title="Twelve statuses">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
              {STATUS_IDS.map((status: StatusId) => (
                <li key={status}>
                  <StatusBadge status={status} frame={frame} running={running} />
                </li>
              ))}
            </ul>
            <p className="mt-3 type-micro text-muted-foreground">
              Running turns arc only while the run is started. Stopped reads &ldquo;Stopped&rdquo; in neutral.
            </p>
          </Sub>
          <Sub title="Plain badges">
            <div className="flex flex-wrap gap-2">
              {PLAIN_BADGES.map((label, index) => (
                <Badge key={label} variant={index % 2 === 0 ? 'neutral' : 'outline'}>
                  {label}
                </Badge>
              ))}
            </div>
          </Sub>
        </Section>

        <Section id="tables" title="Dense table (CMP-07)">
          <Sub title="Cases, JOB-0117">
            <div className="mb-3 flex flex-wrap items-center gap-2 type-data">
              <span>State</span>
              {(['ready', 'loading', 'empty', 'error', 'unauthorized'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={tableState === value}
                  onClick={() => setTableState(value)}
                  className={cn(buttonClass, tableState === value && 'bg-foreground text-background hover:bg-foreground')}
                >
                  {value}
                </button>
              ))}
            </div>
            <CaseTable
              selectedId={selectedCase}
              onSelect={setSelectedCase}
              state={tableState}
              onRecover={() => setTableState('ready')}
              frame={frame}
            />
            <p className="mt-3 type-data" data-selection-readout="" role="status">
              {selectedRow
                ? `Selected ${selectedRow.invoice}. Selection is display only; its outcome is unchanged.`
                : 'No row selected'}
            </p>
          </Sub>
          <Sub title="Audit history">
            <label className="mb-3 flex items-center gap-3 type-data">
              Events visible
              <input
                type="range"
                min={0}
                max={15}
                value={auditVisible}
                onChange={(event) => setAuditVisible(Number(event.target.value))}
                className="w-56 accent-foreground"
              />
              <span className="inline-block w-[8ch]">{auditVisible} / 15</span>
            </label>
            <AuditTable
              visibleCount={auditVisible}
              selectedId={selectedAudit}
              onSelect={setSelectedAudit}
              state={auditVisible === 0 ? 'empty' : 'ready'}
            />
          </Sub>
        </Section>

        <Section id="stepper" title="Lifecycle stepper (CMP-08)">
          <div className="flex flex-wrap items-center gap-3 type-data">
            <span>Layout</span>
            {ORIENTATIONS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={orientation === value}
                onClick={() => setOrientation(value)}
                className={cn(buttonClass, orientation === value && 'bg-foreground text-background hover:bg-foreground')}
              >
                {value}
              </button>
            ))}
            <label className="flex items-center gap-2">
              Current
              <select
                value={step}
                onChange={(event) => setStep(event.target.value as LifecycleStep)}
                className="h-8 rounded-md border bg-surface px-2 type-data text-foreground"
              >
                {LIFECYCLE_STEPS.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <LifecycleStepper current={step} running={running} frame={frame} orientation={orientation} onStepSelect={setStep} />
          <p className="type-micro text-muted-foreground">
            Publish is guidance. Release is a separate authorization. Selecting a step only moves the marker.
          </p>
        </Section>
      </div>
    </main>
  )
}
