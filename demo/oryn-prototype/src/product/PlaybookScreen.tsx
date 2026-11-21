import { Check } from 'lucide-react'
import { StatusBadge } from '@/components/domain/status-badge'
import { Button } from '@/components/ui/button'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { PLAYBOOK, PLAYBOOK_EXCEPTIONS, PLAYBOOK_RULES, PLAYBOOK_STEPS } from '@/data/playbook'
import { person } from '@/state'
import { cn } from '@/lib/utils'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { contributorName, playbookAccess, publishBlock } from './discovery'
import { EvidenceDrawer } from './EvidenceDrawer'
import { DENIED_STATE } from './discovery-layout'
import { anchored, at } from './geometry'
import {
  DECISIONS_CARD,
  DECISIONS_PARTS,
  EVIDENCE_CARD,
  EVIDENCE_PARTS,
  EXCEPTIONS_CARD,
  EXCEPTIONS_PARTS,
  PLAYBOOK_ANCHORS,
  PLAYBOOK_OWNER,
  PLAYBOOK_REGION,
  PLAYBOOK_STATUS,
  PLAYBOOK_TITLE,
  PUBLICATION_CARD,
  PUBLICATION_PARTS,
  STEPS_CARD,
  STEPS_PARTS,
} from './playbook-layout'
import { Frame, HiddenAnchors } from './settings-frame'

/**
 * SC15 playbook. Rendered inside the shell, in canvas coordinates from `playbook-layout.ts`, with
 * the evidence drawer layered over it. Publication is human guidance only: the `Approved for
 * Guidance` badge is neutral ink, appears only after the owner's `Publish`, and nothing here
 * creates, releases or authorizes an agent. A pure function of `{ state, film }`.
 */

const owner = person(PLAYBOOK.ownerId).name
const [RULE_009, RULE_017] = PLAYBOOK_RULES
const GUIDANCE_ONLY = 'Publishing is guidance only, not an agent.'
const AGENT_BLOCK = 'Publish the playbook for guidance first. Guidance does not create an agent.'

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const flat = 'transition-none'
const link = cn('rounded-md border bg-surface px-2 text-left hover:bg-surface-2', flat, focusRing)

export function PlaybookScreen(props: ProductProps) {
  const { state, film } = props
  const access = playbookAccess(state)

  if (!access.ok) {
    return (
      <>
        <h1 className="type-section m-0" style={at(PLAYBOOK_TITLE)}>
          Playbooks
        </h1>
        <p role="status" className="type-body m-0 rounded-lg border bg-surface-2 p-4" data-view="denied" style={at(DENIED_STATE)}>
          Not available: {access.reason}
        </p>
        <HiddenAnchors names={PLAYBOOK_ANCHORS.filter((name) => name !== 'rule-drawer' && name !== 'drawer-close')} />
        <EvidenceDrawer {...props} />
      </>
    )
  }

  const published = state.playbookPublished
  const requestedBy = state.ownerReviewRequestedBy
  const block = publishBlock(state)
  const draftLabel = requestedBy === null ? 'Draft · Review pending' : 'Draft · Review requested'
  const statusFade = published ? motionProgress(film, 'PUBLISH') : 1
  const publicationText = published
    ? 'Published for guidance. This does not create, release or authorize an agent.'
    : (block ?? `Owner review requested by ${person(requestedBy ?? 'marcus').name}. ${GUIDANCE_ONLY}`)

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none" {...anchored('playbook', PLAYBOOK_REGION)} />
      <h1 className="type-section m-0 overflow-hidden" {...anchored('playbook-title', PLAYBOOK_TITLE)}>
        {`${PLAYBOOK.title} · v${PLAYBOOK.version}`}
      </h1>
      <p className="type-data m-0 flex items-center" {...anchored('playbook-owner', PLAYBOOK_OWNER)}>
        {`Owner: ${owner}`}
      </p>
      <div className="flex items-center" data-view={published ? 'approved' : 'draft'} {...anchored('playbook-status', PLAYBOOK_STATUS)}>
        <span style={{ opacity: statusFade }}>
          {published ? (
            <StatusBadge status="approved" />
          ) : (
            <span className="inline-flex h-6 items-center whitespace-nowrap rounded-sm border px-2 type-data">{draftLabel}</span>
          )}
        </span>
      </div>

      <Frame as="section" anchor="playbook-steps" rect={STEPS_CARD} aria-labelledby="playbook-steps-title">
        <h2 id="playbook-steps-title" className="type-card m-0" style={at(STEPS_PARTS.heading)}>
          Steps
        </h2>
        <ol className="m-0 list-none p-0">
          {PLAYBOOK_STEPS.map((step, index) => (
            <li key={step.id} className="flex items-center gap-3 border-t" style={at({ ...STEPS_PARTS.firstRow, y: STEPS_PARTS.firstRow.y + index * STEPS_PARTS.rowStep })}>
              <span className="type-data w-[88px] shrink-0 text-muted-foreground">{step.id}</span>
              <span className="type-body min-w-0 flex-1 truncate">{step.title}</span>
            </li>
          ))}
        </ol>
      </Frame>

      <Frame as="section" anchor="playbook-exceptions" rect={EXCEPTIONS_CARD} aria-labelledby="playbook-exceptions-title">
        <h2 id="playbook-exceptions-title" className="type-card m-0" style={at(EXCEPTIONS_PARTS.heading)}>
          Exceptions
        </h2>
        <ul className="m-0 list-none p-0">
          {PLAYBOOK_EXCEPTIONS.map((item, index) => (
            <li key={item} className="type-body flex items-center border-t" style={at({ ...EXCEPTIONS_PARTS.firstRow, y: EXCEPTIONS_PARTS.firstRow.y + index * EXCEPTIONS_PARTS.rowStep })}>
              {item}
            </li>
          ))}
        </ul>
      </Frame>

      <Frame as="section" anchor="playbook-decisions" rect={DECISIONS_CARD} aria-labelledby="playbook-decisions-title">
        <h2 id="playbook-decisions-title" className="type-card m-0" style={at(DECISIONS_PARTS.heading)}>
          Decisions
        </h2>
        <button type="button" {...anchored('rule-009', DECISIONS_PARTS.rule009)} className={cn(link, 'py-1')} onClick={() => act(props, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' })}>
          <span className="type-body block font-medium">{`${RULE_009.id} ${RULE_009.title}`}</span>
          <span className="block font-mono text-[14px] font-medium leading-5">&gt; 2.00%: Tier 3 approval</span>
          <span className="block font-mono text-[14px] font-medium leading-5">&le; 2.00%: auto-accept within match</span>
          <span className="type-data block text-muted-foreground">{`Owner: ${person(RULE_009.ownerId).name}`}</span>
        </button>
        <button type="button" {...anchored('rule-017', DECISIONS_PARTS.rule017)} className={cn(link, 'py-1')} onClick={() => act(props, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-017' })}>
          <span className="type-body block font-medium">{`${RULE_017.id} ${RULE_017.title}`}</span>
          <span className="type-data block text-muted-foreground">{RULE_017.description}</span>
          <span className="type-data block text-muted-foreground">{`Owner: ${person(RULE_017.ownerId).name}`}</span>
        </button>
      </Frame>

      <Frame as="section" anchor="playbook-evidence" rect={EVIDENCE_CARD} aria-labelledby="playbook-evidence-title">
        <h2 id="playbook-evidence-title" className="type-card m-0" style={at(EVIDENCE_PARTS.heading)}>
          Evidence
        </h2>
        {DEMONSTRATIONS.map((demo, index) => (
          <button
            key={demo.id}
            type="button"
            {...anchored(`demo-link-${demo.id.toLowerCase()}`, EVIDENCE_PARTS.link(index))}
            className={cn(link, 'flex items-center type-data')}
            onClick={() => {
              act(props, { type: 'SELECT_DEMONSTRATION', demoId: demo.id })
              act(props, { type: 'OPEN_DRAWER', drawer: 'evidence' })
            }}
          >
            {`${demo.id} · ${contributorName(demo)} · ${demo.time}`}
          </button>
        ))}
      </Frame>

      <Frame as="section" rect={PUBLICATION_CARD} aria-labelledby="playbook-publication-title" data-view={published ? 'published' : 'unpublished'}>
        <h2 id="playbook-publication-title" className="type-card m-0" style={at(PUBLICATION_PARTS.heading)}>
          Publish for Guidance
        </h2>
        <p className="type-data m-0 overflow-hidden text-muted-foreground" style={at(PUBLICATION_PARTS.text)}>
          {publicationText}
        </p>
        <Button
          variant="primary"
          {...anchored('publish', PUBLICATION_PARTS.publish)}
          className={cn(flat, published && 'aria-disabled:cursor-default')}
          icon={published ? <Check className="size-4" strokeWidth={1.75} /> : undefined}
          disabled={block !== null}
          disabledReason={published ? undefined : (block ?? undefined)}
          onClick={published ? undefined : () => act(props, { type: 'PUBLISH' })}
        >
          {published ? 'Published' : 'Publish'}
        </Button>
        <Button
          variant="outline"
          {...anchored('agent-factory', PUBLICATION_PARTS.agentFactory)}
          className={flat}
          disabled={!published}
          disabledReason={published ? undefined : AGENT_BLOCK}
          onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC17' })}
        >
          Agent Factory
        </Button>
      </Frame>

      <EvidenceDrawer {...props} />
    </>
  )
}
