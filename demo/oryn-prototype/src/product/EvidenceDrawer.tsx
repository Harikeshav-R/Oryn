import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { GATE, GATE_PROVENANCE } from '@/data/gate'
import { supplierName } from '@/data/people'
import { PLAYBOOK_RULES } from '@/data/playbook'
import { AGENT_DEFINITION } from '@/data/versions'
import { BOUNDARY_REPLAY, verdictOf } from '@/data/simulation'
import type { Scenario, SuiteVersion } from '@/data/simulation'
import { STATUS_META } from '@/data/status'
import { exampleCount, person } from '@/state'
import type { DrawerKind } from '@/state'
import { CANVAS, act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { DRAWER, DRAWER_PARTS } from './candidate-layout'
import { contributorName, isApproved } from './discovery'
import { trapTab } from './focus-trap'
import { replayOf, resultView, scenarioById } from './simulator'
import { REPLAY_PARTS } from './simulator-layout'
import { anchored, at } from './geometry'
import { Frame, HiddenAnchors } from './settings-frame'

/**
 * The evidence, rule and examples drawer of SC14, SC15, SC17 and SC18: `[800,0,480,720]` over a scrim, a 64 px sticky
 * footer. Read-only: opening it approves, publishes and verifies nothing. In the clickable app it
 * is modal: focus moves to Close when it opens, Tab cycles inside it, Escape and the scrim close
 * it, and focus returns to the control that opened it. In a film there is no focus handling and
 * the 150 ms entry is an opacity ramp, so the anchored rectangle never moves.
 */

const SENTENCE = 'variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept'
const UNVERIFIED = 'Variance exception rule: unverified until SME review'
const READ_ONLY = 'Opening this does not approve, publish or verify anything.'

type RuleId = 'AP-RULE-009' | 'AP-RULE-017'
const rule = (id: RuleId) => PLAYBOOK_RULES.find((item) => item.id === id) as (typeof PLAYBOOK_RULES)[number]

function Field({ label, children }: { readonly label: string; readonly children: string }) {
  return (
    <div className="border-b py-2">
      <dt className="type-data text-muted-foreground">{label}</dt>
      <dd className="type-body m-0">{children}</dd>
    </div>
  )
}

function EvidenceBody(props: ProductProps) {
  const { state } = props
  const demo = DEMONSTRATIONS.find((item) => item.id === state.ui.discovery.demonstration)
  if (!demo) return null
  const approved = isApproved(state, demo.id)
  return (
    <>
      <dl className="m-0">
        <Field label="Contributor">{contributorName(demo)}</Field>
        <Field label="Time">{demo.time}</Field>
        <Field label="Invoice">{demo.invoice}</Field>
        <Field label="Supplier">{supplierName(demo.supplierId)}</Field>
        <Field label="Contribution">{approved ? `Approved by ${contributorName(demo)}` : `Awaiting approval by ${contributorName(demo)}`}</Field>
      </dl>
      <p className="type-body mt-4 text-muted-foreground">
        This is the authorized sanitized derivative of the contribution. The contributor&apos;s raw local evidence is not shown. {READ_ONLY}
      </p>
    </>
  )
}

function ExamplesBody({ state }: ProductProps) {
  return (
    <>
      <p className="m-0 font-mono text-[14px] font-medium leading-5">{GATE_PROVENANCE}</p>
      <dl className="m-0 mt-3">
        {DEMONSTRATIONS.map((demo) => (
          <Field key={demo.id} label={`${demo.id} · observed this week`}>
            {`${contributorName(demo)} · ${demo.time} · ${demo.invoice} · ${supplierName(demo.supplierId)} · ${isApproved(state, demo.id) ? `approved by ${contributorName(demo)}` : 'awaiting approval'}`}
          </Field>
        ))}
        <Field label="Archived">2 SME-verified archived cases. No archived case identities are shown.</Field>
      </dl>
      <p className="type-body mt-4 text-muted-foreground">
        Three demonstrations are observations; the gate counts each only once its contributor approves, and adds the two archived cases. {READ_ONLY}
      </p>
    </>
  )
}

function RuleBody({ id, draft, replay }: { readonly id: RuleId; readonly draft: boolean; readonly replay: { readonly expected: string; readonly actual: string } | null }) {
  const item = rule(id)
  return (
    <>
      {draft && (
        <dl className="m-0 mb-4">
          <Field label="Draft">{`v0.1 · ${AGENT_DEFINITION.name}`}</Field>
          <Field label="Reviewer">{`${person('elena').name} · ${person('elena').title}`}</Field>
          <Field label="Branch">Unverified branch</Field>
        </dl>
      )}
      {replay && (
        <div className="m-0 mb-4 border-b pb-3">
          <p className="type-data m-0">{`${BOUNDARY_REPLAY.scenarioId} · ${BOUNDARY_REPLAY.key}`}</p>
          <p className="type-data m-0 mt-2">{`Expected: ${replay.expected}`}</p>
          <p className="type-data m-0">{`Actual: ${replay.actual}`}</p>
        </div>
      )}
      <p className="m-0 font-mono text-[14px] font-medium leading-5">{id === 'AP-RULE-009' ? SENTENCE : item.description}</p>
      {id === 'AP-RULE-009' && (
        <>
          <p className="type-body mt-3">Exactly 2.00% auto-accepts. Only a variance above 2.00% requires Tier 3 approval.</p>
          {replay && <p className="type-data mt-3">{BOUNDARY_REPLAY.correctedComparison}</p>}
          {!replay && (
            <p className="type-body mt-4 flex items-start gap-2">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" strokeWidth={1.75} />
              <span>{UNVERIFIED}</span>
            </p>
          )}
        </>
      )}
      <p className="type-body mt-4 text-muted-foreground">
        {draft ? 'Inspecting the source does not verify the branch, clear the simulator or grant authority. ' : 'The candidate does not change this rule. Reading it grants no approval authority. '}
        {READ_ONLY}
      </p>
    </>
  )
}

/** SC20 replay of the boundary scenario for the version shown: what it expected, what that version did, and the rule it is judged by. */
function ReplayBody(props: ProductProps) {
  const result = resultView(props.state)
  const version: SuiteVersion = result?.version ?? 'v0.1'
  const replay = replayOf(version)
  const diverged = replay.expected !== replay.actual
  const Icon = diverged ? CircleX : CircleCheck
  return (
    <>
      <div className="box-border rounded-sm border bg-surface p-3" style={at(REPLAY_PARTS.expected)}>
        <p className="type-micro m-0 text-muted-foreground">Expected</p>
        <p className="type-data m-0 mt-2 flex items-start gap-2">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          <span>{`Expected: ${replay.expected}`}</span>
        </p>
      </div>
      <div className="box-border rounded-sm border bg-surface p-3" style={at(REPLAY_PARTS.actual)}>
        <p className="type-micro m-0 text-muted-foreground">{`Actual · ${version}`}</p>
        <p className="type-data m-0 mt-2 flex items-start gap-2">
          <Icon aria-hidden="true" className={diverged ? 'mt-0.5 size-4 shrink-0 text-danger' : 'mt-0.5 size-4 shrink-0'} strokeWidth={1.75} />
          <span>{`Actual: ${replay.actual}`}</span>
        </p>
      </div>
      <div style={at(REPLAY_PARTS.threshold)}>
        <p className="type-data m-0">{BOUNDARY_REPLAY.correctedComparison}</p>
        <p className="type-micro m-0 mt-1 text-muted-foreground">Exactly 2.00% is at or below the threshold, so it auto-accepts.</p>
      </div>
      <Button variant="outline" {...anchored('replay-rule-link', REPLAY_PARTS.ruleLink)} className="justify-start" onClick={() => props.dispatch?.({ type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' })}>
        Open AP-RULE-009
      </Button>
      <p className="type-micro m-0 text-muted-foreground" style={at(REPLAY_PARTS.note)}>
        This replay shows what the evaluation recorded. It changes no result and no version, and it grants no authority.
      </p>
    </>
  )
}

export function EvidenceDrawer(props: ProductProps) {
  const { state, film } = props
  const kind: DrawerKind | null = state.ui.discovery.drawer
  const open = kind !== null
  const interactive = film === undefined
  const results = state.route === 'SC20'
  const replay = open && kind === 'replay'
  const closeRef = useRef<HTMLButtonElement>(null)
  const replayCloseRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open || !interactive) return undefined
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    ;(kind === 'replay' ? replayCloseRef : closeRef).current?.focus()
    return () => opener?.focus()
  }, [open, interactive, kind])

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      act(props, { type: 'CLOSE_DRAWER' })
    } else trapTab(event, event.currentTarget)
  }

  const demo = kind === 'evidence' ? DEMONSTRATIONS.find((item) => item.id === state.ui.discovery.demonstration) : undefined
  const ruleId: RuleId | null = kind === 'AP-RULE-009' || kind === 'AP-RULE-017' ? kind : null
  const replayResult = resultView(state)
  const title = kind === 'examples' ? 'Verified human examples' : kind === 'replay' ? BOUNDARY_REPLAY.key : (ruleId ?? (demo ? `${demo.id} evidence` : 'Evidence'))
  const subtitle =
    kind === 'examples'
      ? `${exampleCount(state)}/${GATE.required} verified · release gate`
      : kind === 'replay'
        ? `${BOUNDARY_REPLAY.scenarioId} · ${replayResult?.version ?? 'v0.1'} · ${STATUS_META[verdictOf(scenarioById(BOUNDARY_REPLAY.scenarioId) as Scenario, replayResult?.version ?? 'v0.1')].label}`
        : ruleId
          ? `${rule(ruleId).title} · Owner: ${person(rule(ruleId).ownerId).name}`
          : demo
            ? `Sanitized source · ${contributorName(demo)}`
            : ''
  const fade = open ? motionProgress(film, 'OPEN_DRAWER') : 1

  return (
    <div data-layer="evidence-drawer" aria-hidden={open ? undefined : true} style={{ ...at({ x: 0, y: 0, width: CANVAS.width, height: CANVAS.height }), zIndex: 40, display: open ? undefined : 'none', opacity: fade }}>
      <div aria-hidden="true" className={state.route === 'SC20' && kind === 'AP-RULE-009' ? 'bg-transparent' : state.route === 'SC17' ? 'bg-black/20' : 'bg-black/80'} style={at({ x: 0, y: 0, width: DRAWER.x, height: CANVAS.height })} onClick={() => act(props, { type: 'CLOSE_DRAWER' })} />
      <Frame
        as="section"
        anchor="rule-drawer"
        visible={open && !replay}
        rect={DRAWER}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="rounded-none shadow-lg"
        style={{ zIndex: 50 }}
        onKeyDown={onKeyDown}
      >
        <h2 id="drawer-title" className="type-section m-0" style={at(DRAWER_PARTS.title)}>
          {title}
        </h2>
        <p className="type-data m-0 text-muted-foreground" style={at(DRAWER_PARTS.subtitle)}>
          {subtitle}
        </p>
        <div className="overflow-hidden" style={at(DRAWER_PARTS.body)}>
          {kind === 'evidence' ? <EvidenceBody {...props} /> : kind === 'examples' ? <ExamplesBody {...props} /> : ruleId ? <RuleBody id={ruleId} draft={state.route === 'SC17'} replay={results ? replayOf(replayResult?.version ?? 'v0.1') : null} /> : null}
        </div>
        <div className="border-t bg-surface" style={at(DRAWER_PARTS.footer)}>
          <Button ref={closeRef} variant="outline" {...anchored('drawer-close', DRAWER_PARTS.close, open && !replay)} onClick={() => act(props, { type: 'CLOSE_DRAWER' })}>
            Close
          </Button>
        </div>
      </Frame>
      {results && (
        <Frame
          as="section"
          anchor="replay"
          visible={replay}
          rect={DRAWER}
          role="dialog"
          aria-modal="true"
          aria-labelledby="replay-title"
          className="rounded-none shadow-lg"
          style={{ zIndex: 50 }}
          onKeyDown={onKeyDown}
        >
          <h2 id="replay-title" className="type-section m-0" style={at(DRAWER_PARTS.title)}>
            {BOUNDARY_REPLAY.key}
          </h2>
          <p className="type-data m-0 text-muted-foreground" style={at(DRAWER_PARTS.subtitle)}>
            {subtitle}
          </p>
          <div className="overflow-hidden" style={at(DRAWER_PARTS.body)}>
            {replay ? <ReplayBody {...props} /> : <HiddenAnchors names={['replay-rule-link']} />}
          </div>
          <div className="border-t bg-surface" style={at(DRAWER_PARTS.footer)}>
            <Button ref={replayCloseRef} variant="outline" style={at(DRAWER_PARTS.close)} onClick={() => act(props, { type: 'CLOSE_DRAWER' })}>
              Close
            </Button>
          </div>
        </Frame>
      )}
    </div>
  )
}
