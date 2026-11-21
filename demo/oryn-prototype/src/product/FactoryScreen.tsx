import { TriangleAlert } from 'lucide-react'
import { FilmTypedText, sampleMotion, staggerDelayFrames } from '@/film'
import { Button } from '@/components/ui/button'
import { AGENT_SECTIONS, UNVERIFIED_BRANCH } from '@/data/agent-draft'
import { cn } from '@/lib/utils'
import { act } from './contract'
import type { FilmContext, ProductProps } from './contract'
import { EvidenceDrawer } from './EvidenceDrawer'
import { continueBlock, factoryAccess, hasDraft } from './factory'
import {
  BRANCH_PARTS,
  BRANCH_ROW,
  CONTINUE_BUTTON,
  CONTINUE_REASON,
  DENIED,
  FACTORY_ANCHORS,
  FACTORY_HEADING,
  INTENT_FIELD,
  SECTIONS_LIST,
  SECTION_ROW,
  sectionRow,
} from './factory-layout'
import { anchored, at } from './geometry'
import { Frame, HiddenAnchors } from './settings-frame'

/**
 * SC17 Agent Factory. Rendered inside the shell, in canvas coordinates from `factory-layout.ts`.
 * A pure function of `{ state, film }`: the intent text, the generated draft and the drawer come
 * from the reducer state, plus the film's typed view of the intent field while it is being typed.
 *
 * Four states: empty (no intent), typing (the field shows the typed prefix), generated (six
 * sections and the unverified branch, v0.1) and the branch's source drawer. The draft grants no
 * authority and no release; the variance exception rule stays flagged as unverified. Intent is
 * only ever typed text: there is no model selector, and nothing here reads the network.
 */

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const flat = 'transition-none'
const SECTION_IDS = ['purpose', 'inputs', 'actions', 'rules', 'outputs', 'stopping-points'] as const

/** 150 ms fade of the `index`-th generated row, 60 ms after the one before it (capped at 360 ms), from the frame `CREATE_AGENT` landed. */
function rowFade(film: FilmContext | undefined, index: number): number {
  const since = film?.lastApplied('CREATE_AGENT') ?? null
  if (!film || since === null) return 1
  return sampleMotion(since + staggerDelayFrames(index), 4.5, 'product')(film).progress
}

export function FactoryScreen(props: ProductProps) {
  const { state, film } = props
  const access = factoryAccess(state)

  if (!access.ok) {
    return (
      <>
        <h1 className="type-title m-0" style={at(FACTORY_HEADING)}>
          Create Agent
        </h1>
        <p role="status" className="type-body m-0 rounded-lg border bg-surface-2 p-4" data-view="denied" style={at(DENIED)}>
          Not available: {access.reason}
        </p>
        <HiddenAnchors names={FACTORY_ANCHORS.filter((name) => name !== 'rule-drawer' && name !== 'drawer-close')} />
        <EvidenceDrawer {...props} />
      </>
    )
  }

  const generated = hasDraft(state)
  const editable = film === undefined && state.phase === 'ST05'
  const typed = film?.texts?.intent
  const intent = state.ui.factory.intent
  const block = continueBlock(state)
  /** A film types into the field before the intent reaches the reducer; the reason waits for the last character. */
  const typing = typed !== undefined && !typed.complete && intent === ''
  const fieldClass = cn('box-border block w-full overflow-hidden rounded-md border bg-surface px-3 py-3 font-mono text-[15px] leading-6 text-foreground', focusRing)

  const onContinue = () => {
    if (state.phase === 'ST05') act(props, { type: 'CREATE_AGENT' })
    act(props, { type: 'OPEN_SCREEN', screen: 'SC18' })
  }

  return (
    <>
      <h1 className="type-title m-0" style={at(FACTORY_HEADING)}>
        {generated ? 'Create Agent · v0.1' : 'Create Agent'}
      </h1>

      {editable ? (
        <textarea
          {...anchored('intent', INTENT_FIELD)}
          aria-label="Intent"
          aria-describedby="factory-continue-reason"
          className={cn(fieldClass, 'resize-none')}
          value={intent}
          spellCheck={false}
          onChange={(event) => act(props, { type: 'SET_INTENT', text: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              if (block === null) act(props, { type: 'CREATE_AGENT' })
            }
          }}
        />
      ) : (
        <div {...anchored('intent', INTENT_FIELD)} role="textbox" aria-readonly="true" aria-label="Intent" className={fieldClass}>
          {typed ? <FilmTypedText typed={typed} /> : intent}
        </div>
      )}

      <Frame as="section" anchor="agent-sections" visible={generated} rect={SECTIONS_LIST} aria-label="Agent definition" style={{ opacity: rowFade(film, 0) }} />
      {AGENT_SECTIONS.map((section, index) => {
        const id = `section-${SECTION_IDS[index]}`
        const place = anchored(id, sectionRow(index), generated)
        return (
          <div key={section.title} data-film-anchor={id} className={cn('flex items-center gap-3 px-3', index > 0 && 'border-t')} style={{ ...place.style, opacity: rowFade(film, index) }}>
            <span className="type-card shrink-0" style={{ width: SECTION_ROW.title.width }}>
              {section.title}
            </span>
            <span className="type-body min-w-0 flex-1 truncate text-muted-foreground">{section.detail}</span>
          </div>
        )
      })}

      <Frame as="section" anchor="unverified-branch" visible={generated} rect={BRANCH_ROW} aria-label={UNVERIFIED_BRANCH.title} data-view="unverified" style={{ opacity: rowFade(film, AGENT_SECTIONS.length) }}>
        <TriangleAlert aria-hidden="true" className="absolute size-4 text-warning" strokeWidth={1.75} style={at(BRANCH_PARTS.icon)} />
        <p className="type-card m-0" style={at(BRANCH_PARTS.title)}>
          {UNVERIFIED_BRANCH.title}
        </p>
        <p className="type-body m-0 truncate text-muted-foreground" style={at(BRANCH_PARTS.detail)}>
          {UNVERIFIED_BRANCH.detail}
        </p>
        <Button variant="outline" {...anchored('branch-evidence', BRANCH_PARTS.evidence, generated)} className={flat} onClick={() => act(props, { type: 'OPEN_DRAWER', drawer: 'AP-RULE-009' })}>
          Review evidence
        </Button>
      </Frame>

      <p id="factory-continue-reason" className="type-micro m-0 overflow-hidden text-muted-foreground" style={{ ...at(CONTINUE_REASON), display: block === null || typing ? 'none' : undefined }}>
        {block}
      </p>
      <Button
        variant="primary"
        {...anchored('continue', CONTINUE_BUTTON)}
        className={flat}
        disabled={block !== null}
        disabledReason={block ?? undefined}
        aria-describedby={block !== null ? 'factory-continue-reason' : undefined}
        onClick={onContinue}
      >
        Continue
      </Button>

      <EvidenceDrawer {...props} />
    </>
  )
}
