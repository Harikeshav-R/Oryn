import { Check, ChevronRight, CircleDashed, TriangleAlert } from 'lucide-react'
import { StatusBadge } from '@/components/domain/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DEMONSTRATIONS } from '@/data/demonstrations'
import { supplierName } from '@/data/people'
import { CANDIDATE, PLAYBOOK } from '@/data/playbook'
import { DISCOVERY_FILTERS } from '@/state'
import type { DiscoveryFilter } from '@/state'
import { cn } from '@/lib/utils'
import { act } from './contract'
import type { ProductProps } from './contract'
import { candidateStage, contributorName, discoveryAccess, isApproved } from './discovery'
import {
  COLUMNS,
  COLUMN_HEADER,
  CANDIDATE_ROW,
  DEMONSTRATIONS_BLOCK,
  DEMONSTRATIONS_LABEL,
  DENIED_STATE,
  DISCOVERY_ANCHORS,
  DISCOVERY_HEADING,
  DISCOVERY_NOTE,
  EMPTY_ACTION,
  EMPTY_BODY,
  EMPTY_STATE,
  EMPTY_TITLE,
  FILTER_CHIPS,
  FILTER_ROW,
  demonstrationRow,
} from './discovery-layout'
import { anchored, at } from './geometry'
import { HiddenAnchors } from './settings-frame'

/**
 * SC13 Workflow Discovery inbox. Rendered inside the shell, in canvas coordinates from
 * `discovery-layout.ts`. One candidate (the workflow the three demonstrations suggest) and the
 * three demonstrations behind it. A pure function of `{ state, film }`: selection, filter and
 * contribution status come from the reducer state, and nothing is kept locally.
 *
 * Three demonstrations are observations, not five verified examples, and they set no policy: the
 * row shows `Needs Review` in neutral ink and no confidence figure.
 */

const FILTER_LABEL: Readonly<Record<DiscoveryFilter, string>> = { all: 'All', 'needs-review': 'Needs Review', published: 'Published' }
const EMPTY_TEXT = 'Candidates appear here once demonstrations are observed and reviewed. Nothing matches this filter.'
const NOTE = `${DEMONSTRATIONS.length} demonstrations suggest this workflow. They are observations, not verified examples, and they do not set policy.`

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'
const flat = 'transition-none'

export function DiscoveryScreen(props: ProductProps) {
  const { state } = props
  const access = discoveryAccess(state)
  const { filter, candidateSelected, demonstration } = state.ui.discovery
  const stage = candidateStage(state)
  const listed = access.ok && (filter === 'all' || filter === stage)

  const heading = (
    <h1 className="type-title m-0" style={at(DISCOVERY_HEADING)}>
      Workflow Discovery
    </h1>
  )

  if (!access.ok) {
    return (
      <>
        {heading}
        <p role="status" className="type-body m-0 rounded-lg border bg-surface-2 p-4" data-view="denied" style={at(DENIED_STATE)}>
          Not available: {access.reason}
        </p>
        <HiddenAnchors names={DISCOVERY_ANCHORS} />
      </>
    )
  }

  const hiddenWhenEmpty = ['candidate-row', 'demonstrations', 'demo-row-d1', 'demo-row-d2', 'demo-row-d3']
  const hiddenWhenListed = ['empty-state', 'empty-action']

  return (
    <>
      {heading}

      <div role="group" aria-label="Filter candidates" style={{ display: 'contents' }}>
        <div aria-hidden="true" {...anchored('discovery-filters', FILTER_ROW)} />
        {DISCOVERY_FILTERS.map((id) => (
          <button
            key={id}
            type="button"
            {...anchored(`filter-${id}`, FILTER_CHIPS[id])}
            aria-pressed={filter === id}
            className={cn('flex items-center justify-center rounded-md border bg-surface type-data hover:bg-surface-2', flat, focusRing, filter === id && 'border-foreground bg-surface-2')}
            onClick={() => act(props, { type: 'SET_DISCOVERY_FILTER', filter: id })}
          >
            {FILTER_LABEL[id]}
          </button>
        ))}
      </div>

      {listed ? (
        <>
          <div aria-hidden="true" className="flex items-center type-micro text-muted-foreground" data-view="candidate" style={{ ...at(COLUMN_HEADER), paddingLeft: COLUMNS.pad, paddingRight: COLUMNS.pad }}>
            <span className="min-w-0 flex-1">Workflow</span>
            <span style={{ width: COLUMNS.demonstrations }}>Demonstrations</span>
            <span style={{ width: COLUMNS.status }}>Status</span>
            <span style={{ width: COLUMNS.trailing }} />
          </div>

          <button
            type="button"
            {...anchored('candidate-row', CANDIDATE_ROW)}
            aria-label={`${PLAYBOOK.title}, ${DEMONSTRATIONS.length} demonstrations, ${stage === 'published' ? 'Approved for Guidance' : CANDIDATE.status}. Opens the candidate review.`}
            aria-pressed={candidateSelected}
            className={cn('flex items-center rounded-lg border bg-surface text-left hover:bg-surface-2', flat, focusRing, candidateSelected && 'ring-2 ring-inset ring-foreground')}
            style={{ ...at(CANDIDATE_ROW), paddingLeft: COLUMNS.pad, paddingRight: COLUMNS.pad }}
            onClick={() => {
              act(props, { type: 'SELECT_CANDIDATE' })
              act(props, { type: 'OPEN_SCREEN', screen: 'SC14' })
            }}
          >
            <span className="type-card min-w-0 flex-1 truncate">{PLAYBOOK.title}</span>
            <span className="type-data" style={{ width: COLUMNS.demonstrations }}>{`${DEMONSTRATIONS.length} demonstrations`}</span>
            <span className="flex items-center" style={{ width: COLUMNS.status }}>
              {stage === 'published' ? (
                <StatusBadge status="approved" />
              ) : (
                <Badge variant="outline" className="gap-1">
                  <TriangleAlert aria-hidden="true" className="size-3 shrink-0 text-warning" strokeWidth={1.75} />
                  {CANDIDATE.status}
                </Badge>
              )}
            </span>
            <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" strokeWidth={1.75} style={{ width: COLUMNS.trailing }} />
          </button>

          <div aria-hidden="true" className="rounded-lg border bg-surface" {...anchored('demonstrations', DEMONSTRATIONS_BLOCK)} />
          <p className="type-micro m-0 flex items-center text-muted-foreground" style={{ ...at(DEMONSTRATIONS_LABEL), paddingLeft: COLUMNS.pad }}>
            Demonstrations
          </p>
          <ul aria-label="Demonstrations" className="m-0 list-none p-0" style={{ display: 'contents' }}>
            {DEMONSTRATIONS.map((demo, index) => {
              const approved = isApproved(state, demo.id)
              const selected = demonstration === demo.id
              return (
                <li key={demo.id} style={{ display: 'contents' }}>
                  <button
                    type="button"
                    {...anchored(`demo-row-${demo.id.toLowerCase()}`, demonstrationRow(index))}
                    aria-pressed={selected}
                    className={cn('flex items-center gap-3 border-t bg-transparent text-left hover:bg-surface-2', flat, focusRing, selected && 'ring-2 ring-inset ring-foreground')}
                    style={{ ...at(demonstrationRow(index)), paddingLeft: COLUMNS.pad, paddingRight: COLUMNS.pad }}
                    onClick={() => act(props, { type: 'SELECT_DEMONSTRATION', demoId: demo.id })}
                  >
                    <span className="type-data min-w-0 flex-1 truncate">{`${demo.id} · ${contributorName(demo)} · ${demo.time} · ${demo.invoice} · ${supplierName(demo.supplierId)}`}</span>
                    <span className="type-micro flex items-center gap-1 text-muted-foreground">
                      {approved ? <Check aria-hidden="true" className="size-3 shrink-0" strokeWidth={1.75} /> : <CircleDashed aria-hidden="true" className="size-3 shrink-0" strokeWidth={1.75} />}
                      {approved ? 'Contribution approved' : 'Observed'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="type-body m-0 text-muted-foreground" style={at(DISCOVERY_NOTE)}>
            {NOTE}
          </p>
          <HiddenAnchors names={hiddenWhenListed} />
        </>
      ) : (
        <>
          <div aria-hidden="true" data-view="empty" className="rounded-lg border bg-surface" {...anchored('empty-state', EMPTY_STATE)} />
          <div role="status" style={{ display: 'contents' }}>
            <h2 className="type-section m-0" style={at(EMPTY_TITLE)}>
              No candidates yet
            </h2>
            <p className="type-body m-0 text-muted-foreground" style={at(EMPTY_BODY)}>
              {EMPTY_TEXT}
            </p>
          </div>
          <Button variant="outline" {...anchored('empty-action', EMPTY_ACTION)} className={cn('absolute', flat)} onClick={() => act(props, { type: 'SET_DISCOVERY_FILTER', filter: 'all' })}>
            Show all candidates
          </Button>
          <HiddenAnchors names={hiddenWhenEmpty} />
        </>
      )}
    </>
  )
}
