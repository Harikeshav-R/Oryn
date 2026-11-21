import { Check, Circle, Eye, LockKeyhole, Shield, ShieldX, Tag } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ACTION_TIERS, AUTONOMY_STAGES, LOCKED_FROM, RESTRICTED_NOTE, SCOPE, SELECTED_STAGE, tierLabel } from '@/data/agent-draft'
import { GATE_EDGE_LABEL, GATE_OWNER_LABEL, GATE_PROVENANCE, GATE_SCENARIOS_LABEL } from '@/data/gate'
import { cn } from '@/lib/utils'
import type { Rect } from '@/film'
import type { ActionType } from '@/state'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { EvidenceDrawer } from './EvidenceDrawer'
import { approveBlock, confirmScopeBlock, deployBlock, factoryAccess, gateRows, gateRowsMet } from './factory'
import { FACTORY_HEADING } from './factory-layout'
import { anchored, at, within } from './geometry'
import {
  APPROVE_RELEASE,
  DENIED,
  DEPLOY,
  GATE_HEADING,
  GATE_PANEL,
  GATE_STATUS,
  LADDER_HEADING,
  LADDER_NOTE,
  LADDER_PANEL,
  OPEN_SIMULATOR,
  PROVENANCE,
  RELEASE_LINE,
  RELEASE_NOTE,
  RISK_CHIP,
  RISK_HEADING,
  RISK_PANEL,
  SCOPE_ANCHORS,
  SCOPE_PANEL,
  SCOPE_PARTS,
  TIER_4_ROW,
  actionRow,
  gateRow,
  ladderRow,
} from './scope-layout'
import { HiddenAnchors } from './settings-frame'

/**
 * SC18 scope, risk, autonomy and release gate. Rendered inside the shell, in canvas coordinates
 * from `scope-layout.ts`. A pure function of `{ state, film }`: every gate row is checked only by
 * its own evidence or authorization event, read from the reducer (`gateChecks`), so a pending gate
 * is never pre-checked and a satisfied one needs the evaluation and the owner's approval.
 *
 * Stage 3 is selected in neutral ink, never execution cyan. Tier 4 is barred with a cross and no
 * action. Deploy needs every gate condition, the confirmed scope and a start-job grant: one granted
 * job is not blanket approval of a Tier 3 action. The numbers `28/25` and `6/5` are requirements
 * against suite coverage, not proof of completion.
 */

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const flat = 'transition-none'
const ACTION_ICONS = [Eye, Tag, Shield] as const
const ACTION_NOTE = ['Informational', 'Low-risk and controlled reversible', 'Consequential'] as const

/** The action whose landing frame times each gate row's 150 ms check. */
const CHECK_EVENT: Readonly<Record<'examples' | 'scenarios' | 'edgeCases' | 'ownerApproval', ActionType>> = {
  examples: 'APPROVE_DEMONSTRATION',
  scenarios: 'COMPLETE_SIMULATION',
  edgeCases: 'COMPLETE_SIMULATION',
  ownerApproval: 'APPROVE_RELEASE',
}

const Heading = ({ rect, children }: { readonly rect: Rect; readonly children: string }) => (
  <h2 className="type-card m-0" style={at(rect)}>
    {children}
  </h2>
)

const field = 'flex items-center justify-between gap-3'

function Row({ label, children, rect, anchor, tall = false }: { readonly label: string; readonly children: ReactNode; readonly rect: Rect; readonly anchor: string; readonly tall?: boolean }) {
  return (
    <div {...anchored(anchor, rect)} className={cn(field, 'border-b', tall && 'items-start py-1')}>
      <span className="type-body shrink-0">{label}</span>
      <span className="type-data min-w-0 text-right">{children}</span>
    </div>
  )
}

export function ScopeScreen(props: ProductProps) {
  const { state, film } = props
  const access = factoryAccess(state)

  if (!access.ok) {
    return (
      <>
        <h1 className="type-title m-0" style={at(FACTORY_HEADING)}>
          Scope and gates
        </h1>
        <p role="status" className="type-body m-0 rounded-lg border bg-surface-2 p-4" data-view="denied" style={at(DENIED)}>
          Not available: {access.reason}
        </p>
        <HiddenAnchors names={SCOPE_ANCHORS.filter((name) => name !== 'rule-drawer' && name !== 'drawer-close')} />
        <EvidenceDrawer {...props} />
      </>
    )
  }

  const rows = gateRows(state)
  const satisfied = gateRowsMet(state)
  const met = (id: (typeof rows)[number]['id']): boolean => rows.find((row) => row.id === id)?.met === true
  const checkAlpha = (id: keyof typeof CHECK_EVENT): number => (met(id) ? motionProgress(film, CHECK_EVENT[id]) : 0)
  const approveReason = approveBlock(state)
  const confirmReason = confirmScopeBlock(state)
  const deployReason = deployBlock(state)

  const gateLine = (index: number, id: keyof typeof CHECK_EVENT, anchor: string, label: string, trailing?: ReactNode, open?: () => void) => {
    const done = met(id)
    const inner = (
      <>
        <span className="relative flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
          <Circle className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <Check className="absolute size-3 text-foreground" strokeWidth={2} style={{ opacity: checkAlpha(id) }} />
        </span>
        <span className="type-data min-w-0 flex-1 text-left">{label}</span>
        <span className="type-micro shrink-0 text-muted-foreground">{done ? 'Satisfied' : 'Pending'}</span>
        {trailing}
      </>
    )
    const place = anchored(anchor, within(GATE_PANEL, gateRow(index)))
    return open ? (
      <button key={anchor} type="button" {...place} className={cn(field, 'border-b text-left hover:bg-surface-2', flat, focusRing)} aria-label={`${label}: ${done ? 'satisfied' : 'pending'}. Show where it comes from.`} onClick={open}>
        {inner}
      </button>
    ) : (
      <div key={anchor} {...place} className={cn(field, 'border-b', trailing && 'pr-[160px]')}>
        {inner}
      </div>
    )
  }

  return (
    <>
      <h1 className="sr-only">Scope and gates</h1>

      {/* Scope: team, queue, applications, agent, action and authority. Capability is not permission. */}
      <section {...anchored('scope', SCOPE_PANEL)} aria-label="Scope">
        <Heading rect={within(SCOPE_PANEL, SCOPE_PARTS.heading)}>Scope</Heading>
        <Row label="Team" anchor="scope-team" rect={within(SCOPE_PANEL, SCOPE_PARTS.team)}>
          {SCOPE.team}
        </Row>
        <div {...anchored('scope-queue', within(SCOPE_PANEL, SCOPE_PARTS.queue))} className="box-border flex items-center justify-between rounded-md border border-foreground bg-surface px-3">
          <span className="type-data">{SCOPE.queue}</span>
          <span className="type-micro text-muted-foreground">{SCOPE.team}</span>
        </div>
        <div {...anchored('scope-apps', within(SCOPE_PANEL, SCOPE_PARTS.applications))} className={cn(field, 'border-b')}>
          <span className="type-body">Applications</span>
          <span className="flex gap-2">
            {SCOPE.applications.map((app) => (
              <span key={app} className="inline-flex h-6 items-center rounded-sm border bg-surface px-2 type-data">
                {app}
              </span>
            ))}
          </span>
        </div>
        <Row label="Agent" anchor="scope-agent" rect={within(SCOPE_PANEL, SCOPE_PARTS.agent)}>
          Supplier Invoice Reconciler
        </Row>
        <Row label="Action" anchor="scope-action" rect={within(SCOPE_PANEL, SCOPE_PARTS.action)} tall>
          {`NetSuite · ${SCOPE.action}`}
          <span className="block type-micro text-muted-foreground">Approving a job does not approve Tier 3 actions.</span>
        </Row>
        <Row label="Authority" anchor="scope-authority" rect={within(SCOPE_PANEL, SCOPE_PARTS.authority)} tall>
          {tierLabel(3)}
          <span className="block type-micro text-muted-foreground">Tier 3 needs separate delegated human authority.</span>
        </Row>
        <Button
          variant="outline"
          size="sm"
          {...anchored('confirm-scope', within(SCOPE_PANEL, SCOPE_PARTS.confirm))}
          className={flat}
          disabled={confirmReason !== null}
          disabledReason={confirmReason ?? undefined}
          icon={state.agent.scopeConfirmed ? <Check className="size-4" strokeWidth={1.75} /> : undefined}
          onClick={() => act(props, { type: 'CONFIRM_SCOPE' })}
        >
          {state.agent.scopeConfirmed ? 'Scope confirmed' : 'Confirm scope'}
        </Button>
        <p className="type-micro m-0 flex items-center overflow-hidden text-muted-foreground" style={at(within(SCOPE_PANEL, SCOPE_PARTS.confirmNote))}>
          {state.agent.scopeConfirmed ? 'Confirming the scope starts no job and approves no Tier 3 action.' : confirmReason}
        </p>
      </section>

      <Heading rect={LADDER_HEADING}>Autonomy ladder</Heading>
      <ol {...anchored('autonomy-ladder', LADDER_PANEL)} aria-label="Autonomy stages" className="m-0 list-none p-0">
        {AUTONOMY_STAGES.map((stage) => {
          const locked = stage.id >= LOCKED_FROM
          const selected = stage.id === SELECTED_STAGE
          const gate = locked ? 'Locked' : selected ? (satisfied ? 'Gate satisfied' : 'Gate pending') : 'Available'
          return (
            <li
              key={stage.id}
              {...anchored(`ladder-stage-${stage.id}`, within(LADDER_PANEL, ladderRow(stage.id)))}
              aria-current={selected ? 'true' : undefined}
              className={cn('box-border flex items-center gap-3 border-b border-l-2 px-3', selected ? 'border-l-foreground bg-surface' : 'border-l-transparent')}
            >
              <span className="type-data w-4 shrink-0">{stage.id}</span>
              <span className="type-body min-w-0 flex-1 truncate font-medium">{stage.label}</span>
              <span className="flex shrink-0 items-center gap-1 type-micro text-muted-foreground">
                {locked && <LockKeyhole aria-hidden="true" className="size-3.5" strokeWidth={1.75} />}
                {gate}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="type-micro m-0 overflow-hidden text-muted-foreground" style={at(LADDER_NOTE)}>
        Stages 4 and 5 are locked: their gates are not established here. A job does not approve Tier 3 actions.
      </p>

      {/* Risk: the workflow's tier and each action's tier. A tier classifies; it grants nothing. */}
      <section {...anchored('risk', RISK_PANEL)} aria-label="Risk and authority">
        <Heading rect={within(RISK_PANEL, RISK_HEADING)}>Risk and authority</Heading>
        <span {...anchored('risk-tier', within(RISK_PANEL, RISK_CHIP))} className="box-border inline-flex items-center gap-2 rounded-sm border bg-surface px-2 type-data">
          <Shield aria-hidden="true" className="size-3 shrink-0" strokeWidth={1.75} />
          {tierLabel(3)}
        </span>
        {ACTION_TIERS.map((item, index) => {
          const Icon = ACTION_ICONS[index] ?? Shield
          return (
            <div key={item.action} style={at(within(RISK_PANEL, actionRow(index)))} className={cn(field, 'type-data')}>
              <span className="flex items-center gap-2">
                <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
                {`${item.action} · ${item.tiers}`}
              </span>
              <span className="type-micro text-muted-foreground">{ACTION_NOTE[index]}</span>
            </div>
          )
        })}
        <div {...anchored('tier-4', within(RISK_PANEL, TIER_4_ROW))} className={cn(field, 'border-t')}>
          <span className="flex items-center gap-2 type-data">
            <ShieldX aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
            {tierLabel(4)}
          </span>
          <span className="type-micro text-muted-foreground">{RESTRICTED_NOTE}</span>
        </div>
      </section>

      {/* Release gate: each row is checked by its own event. */}
      <section {...anchored('gate', GATE_PANEL)} aria-label="Release gate" data-view={satisfied ? 'satisfied' : 'pending'}>
        <Heading rect={within(GATE_PANEL, GATE_HEADING)}>Release gate</Heading>
        <span className="inline-flex items-center justify-end type-micro text-muted-foreground" style={at(within(GATE_PANEL, GATE_STATUS))}>
          {satisfied ? 'Satisfied' : 'Pending'}
        </span>
        {gateLine(0, 'examples', 'gate-examples', rows.find((row) => row.id === 'examples')?.label ?? '', undefined, () => act(props, { type: 'OPEN_DRAWER', drawer: 'examples' }))}
        {gateLine(1, 'scenarios', 'gate-scenarios', GATE_SCENARIOS_LABEL)}
        {gateLine(2, 'edgeCases', 'gate-edge', GATE_EDGE_LABEL)}
        {gateLine(
          3,
          'ownerApproval',
          'gate-owner',
          GATE_OWNER_LABEL,
          <Button
            variant="outline"
            size="sm"
            {...anchored('approve-release', within(gateRow(3), APPROVE_RELEASE))}
            className={flat}
            disabled={approveReason !== null}
            disabledReason={approveReason ?? undefined}
            onClick={() => act(props, { type: 'APPROVE_RELEASE' })}
          >
            {state.agent.releaseApproved ? 'Release approved' : 'Approve release'}
          </Button>,
        )}
        <p {...anchored('gate-provenance', within(GATE_PANEL, PROVENANCE))} className="type-data m-0 flex items-center text-muted-foreground">
          {GATE_PROVENANCE}
        </p>
      </section>

      <p className="type-data m-0 flex items-center" style={at(RELEASE_LINE)}>
        {`Release target: ${SCOPE.release}`}
      </p>
      <p className="type-micro m-0 overflow-hidden text-muted-foreground" style={{ ...at(RELEASE_NOTE), display: deployReason === null ? 'none' : undefined }}>
        {deployReason}
      </p>
      <Button variant="outline" {...anchored('open-simulator', OPEN_SIMULATOR)} className={flat} onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC19' })}>
        Open Flight Simulator
      </Button>
      <Button
        variant="primary"
        {...anchored('deploy', DEPLOY)}
        className={flat}
        disabled={deployReason !== null}
        disabledReason={deployReason ?? undefined}
        onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC21' })}
      >
        Deploy
      </Button>

      <EvidenceDrawer {...props} />
    </>
  )
}
