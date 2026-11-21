import { Bell, CircleCheck, History, ShieldAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { person } from '@/state'
import { act, filmAnchor, SHELL } from './contract'
import type { ProductProps } from './contract'
import { homeCards, roleOf } from './destinations'
import type { HomeCardId } from './destinations'

/**
 * SC12 Home: four cards in a 2x2 grid starting [264,128], each 480x180, 16 px gaps. Figures are
 * derived from the current snapshot and are never summed across reporting periods. A card the
 * viewpoint may not read shows its reason instead of figures; selecting a role never grants a card.
 */

const ICONS: Readonly<Record<HomeCardId, LucideIcon>> = {
  approvals: Bell,
  incidents: ShieldAlert,
  'verified-outcomes': CircleCheck,
  'recent-changes': History,
}

const GRID = { x: SHELL.content.x, y: 128, width: 976, height: 376 } as const

export function HomeScreen(props: ProductProps) {
  const { state } = props
  const cards = homeCards(state)
  const actor = person(state.actorId)
  const role = roleOf(state)

  return (
    <>
      <div
        {...filmAnchor('home-cards')}
        role="group"
        aria-label="Home"
        style={{ position: 'absolute', left: GRID.x, top: GRID.y, width: GRID.width, height: GRID.height, display: 'grid', gridTemplateColumns: '480px 480px', gridTemplateRows: '180px 180px', gap: 16 }}
      >
        {cards.map((view) => {
          const Icon = ICONS[view.card.id]
          const body = view.available ? (
            <>
              <span className="type-title">{view.value}</span>
              <span className="type-body text-muted-foreground">{view.detail}</span>
            </>
          ) : (
            <span className="type-body text-muted-foreground">{view.reason}</span>
          )
          return (
            <button
              key={view.card.id}
              type="button"
              {...filmAnchor(`card-${view.card.id}`)}
              aria-disabled={view.available ? undefined : true}
              aria-label={view.available ? `${view.card.title}: ${view.value} ${view.detail}. Open ${view.card.title}` : `${view.card.title}: ${view.reason}`}
              onClick={() => view.available && act(props, { type: 'OPEN_SCREEN', screen: view.card.screen })}
              className={cn(
                'flex flex-col items-start gap-3 rounded-lg border bg-surface p-6 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
                view.available ? 'hover:bg-surface-2' : 'cursor-not-allowed text-muted-foreground',
              )}
            >
              <span className="flex items-center gap-2 type-card">
                <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
                {view.card.title}
              </span>
              {body}
            </button>
          )
        })}
      </div>
      <p style={{ position: 'absolute', left: GRID.x, top: GRID.y + GRID.height + 24, width: GRID.width }} className="type-prose text-muted-foreground">
        {role === null
          ? 'No internal viewpoint is selected, so no organizational content is available.'
          : `Viewing as ${actor.name}, ${role}. Selecting a role changes the view only; it does not grant authority.`}
      </p>
    </>
  )
}
