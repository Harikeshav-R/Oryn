import { Bell, BookOpen, Bot, Check, ChevronDown, Command, FileClock, FlaskConical, Grid2X2, History, House, LayoutDashboard, ListChecks, Network, Search, Shield, ShieldAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Kbd } from '@/components/ui/kbd'
import { COMMANDS, NO_MATCH, NOT_LISTED, searchCommands } from '@/data/commands'
import type { Command as PaletteCommand } from '@/data/commands'
import { ROLES } from '@/data/labels'
import type { Role } from '@/data/labels'
import { ORGANIZATION_SELECTOR, PEOPLE } from '@/data/people'
import { cn } from '@/lib/utils'
import type { Action, ScreenId } from '@/state'
import { act, filmAnchor, motionProgress, SHELL } from './contract'
import type { ProductProps } from './contract'
import { DESTINATIONS, destinationOf, destinationsFor, roleOf, screenLabel } from './destinations'
import type { DestinationId } from './destinations'

/**
 * SC12-FRAME: the fixed 1280x720 instrument around every organizational screen. Sidebar
 * [0,0,240,720], top bar [240,0,1040,56], breadcrumbs [264,72,700,24], content [264,112,992,584].
 * The shell never resizes. A role selection is a viewpoint change: it never grants authority
 * (RT-02), and no state here is cyan.
 */

const ICONS: Readonly<Record<DestinationId, LucideIcon>> = {
  home: House,
  'workflow-discovery': Search,
  playbooks: BookOpen,
  'operations-map': Network,
  'agent-factory': Bot,
  'flight-simulator': FlaskConical,
  jobs: ListChecks,
  'incident-center': ShieldAlert,
  'version-history': History,
  'command-center': LayoutDashboard,
  'audit-export': FileClock,
  notifications: Bell,
  'application-capabilities': Grid2X2,
  'my-privacy': Shield,
}

const SELECTOR = { x: 24, y: 24, width: 192, height: 64 } as const
const NAV_TOP = 104
const ROW = 32
const SEARCH = { x: 440, y: 12, width: 360, height: 32 } as const
const BELL = { x: 1184, y: 12, width: 32, height: 32 } as const
const PALETTE = { x: 320, y: 120, width: 640, height: 480 } as const

const abs = (rect: { x: number; y: number; width: number; height: number }) => ({ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }) as const

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** The reducer actions a palette command runs. Authority is checked by the reducer, never by the palette. */
function commandActions(command: PaletteCommand): readonly Action[] {
  const open = (screen: ScreenId): Action => ({ type: 'OPEN_SCREEN', screen })
  switch (command.id) {
    case 'privacy':
      return [open('SC03')]
    case 'pause':
      return [{ type: 'PAUSE_OBSERVATION' }]
    case 'guide':
      return [open('SC04')]
    case 'publish':
      return [open('SC15')]
    case 'run':
      return [open('SC19')]
    case 'unknown':
      return [open('SC24')]
    case 'approve':
      return [open('SC23')]
    case 'export':
      return [open('SC34')]
    default:
      return []
  }
}

export function Shell(props: ProductProps & { children?: ReactNode }) {
  const { state, film, children } = props
  const role = roleOf(state)
  const destination = destinationOf(state.route)
  const actor = PEOPLE.find((person) => person.id === state.actorId)
  const rows = destinationsFor(state)
  const crumbs = [{ label: ORGANIZATION_SELECTOR }, { label: screenLabel(state.route) }]
  const roleOpen = state.ui.overlay === 'role'
  const searchOpen = state.ui.overlay === 'search' && role !== null

  return (
    <>
      <aside aria-label="Sidebar" style={abs(SHELL.sidebar)} className="border-r bg-surface-2" />

      <button
        type="button"
        {...filmAnchor('role-selector')}
        aria-haspopup="listbox"
        aria-expanded={roleOpen}
        aria-label={`Organization and role: ${ORGANIZATION_SELECTOR}, ${actor?.name ?? 'unavailable identity'}, ${actor?.role ?? 'no role'}`}
        onClick={() => act(props, { type: 'SET_OVERLAY', overlay: roleOpen ? null : 'role' })}
        style={abs(SELECTOR)}
        className={cn('flex items-center gap-2 rounded-md border bg-surface px-2 text-left hover:bg-surface-2', focusRing)}
      >
        <Avatar name={actor?.name ?? ORGANIZATION_SELECTOR} className="size-6" />
        <span className="min-w-0 flex-1">
          <span className="block truncate type-data">{ORGANIZATION_SELECTOR}</span>
          <span className="block type-micro leading-[14px] text-muted-foreground">{`${actor?.name ?? 'Identity unavailable'} · ${actor?.role ?? 'No internal viewpoint'}`}</span>
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
      </button>

      <nav
        aria-label="Main navigation"
        {...filmAnchor('navigation')}
        style={{ position: 'absolute', left: 24, top: NAV_TOP, width: 192, height: DESTINATIONS.length * ROW }}
      >
        {rows.map((item) => {
          const Icon = ICONS[item.id]
          const current = destination?.id === item.id
          return (
            <button
              key={item.id}
              type="button"
              {...filmAnchor(`nav-${item.id}`)}
              aria-current={current ? 'page' : undefined}
              onClick={() => act(props, { type: 'OPEN_SCREEN', screen: item.screen })}
              style={{ height: ROW }}
              className={cn('relative flex w-full items-center gap-3 rounded-md px-3 text-left type-data leading-4 hover:bg-surface', focusRing, current && 'bg-surface font-semibold before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-signal')}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </button>
          )
        })}
      </nav>
      {DESTINATIONS.filter((item) => !rows.some((row) => row.id === item.id)).map((item) => (
        <div key={item.id} aria-hidden="true" {...filmAnchor(`nav-${item.id}`)} style={{ display: 'none' }} />
      ))}

      <header aria-label="Top bar" style={abs(SHELL.topbar)} className="border-b bg-surface" />
      <button
        type="button"
        {...filmAnchor('search')}
        aria-label="Search workflows, agents and cases"
        aria-keyshortcuts="Meta+K Control+K"
        aria-disabled={role === null || undefined}
        onClick={() => role !== null && act(props, { type: 'SET_OVERLAY', overlay: 'search' })}
        style={abs(SEARCH)}
        className={cn('flex items-center gap-2 rounded-md border bg-surface-2 px-3 text-left type-data text-muted-foreground hover:bg-surface', focusRing, role === null && 'opacity-50')}
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">Search workflows, agents and cases</span>
        <Kbd>
          <Command aria-label="Command" className="size-3" />K
        </Kbd>
      </button>
      <button
        type="button"
        {...filmAnchor('bell')}
        aria-label="Notifications"
        aria-disabled={role === null || undefined}
        onClick={() => role !== null && act(props, { type: 'OPEN_SCREEN', screen: 'SC35' })}
        style={abs(BELL)}
        className={cn('flex items-center justify-center rounded-md hover:bg-surface-2', focusRing, role === null && 'opacity-50')}
      >
        <Bell aria-hidden="true" className="size-4" />
      </button>

      <div {...filmAnchor('breadcrumbs')} style={abs(SHELL.breadcrumbs)}>
        <Breadcrumb items={crumbs} onNavigate={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC12' })} />
      </div>

      {children}

      <div
        role="listbox"
        aria-label="Role and viewpoint"
        style={{ position: 'absolute', left: 24, top: 96, width: 288, zIndex: 30, display: roleOpen ? undefined : 'none', opacity: motionProgress(film, 'SET_OVERLAY') }}
        className="overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md"
      >
        <div className="p-1">
          {ROLES.map((roleName) => (
            <div key={roleName} role="group" aria-label={roleName}>
              <p className="px-3 pb-1 pt-2 type-micro text-muted-foreground">{roleName}</p>
              {PEOPLE.filter((person) => person.role === roleName).map((person) => (
                <button
                  key={person.id}
                  type="button"
                  {...filmAnchor(`role-option-${person.id}`)}
                  style={roleOpen ? undefined : { display: 'none' }}
                  role="option"
                  aria-selected={person.id === state.actorId}
                  onClick={() => {
                    act(props, { type: 'SELECT_ACTOR', personId: person.id as Extract<Action, { type: 'SELECT_ACTOR' }>['personId'] })
                    act(props, { type: 'SET_OVERLAY', overlay: null })
                  }}
                  className={cn('flex min-h-8 w-full items-center gap-2 rounded-md px-3 text-left type-data hover:bg-surface-2', focusRing)}
                >
                  <span className="flex-1">{person.name}</span>
                  {person.id === state.actorId && <Check aria-hidden="true" className="size-4" strokeWidth={1.75} />}
                </button>
              ))}
            </div>
          ))}
        </div>
        <p className="border-t px-3 py-2 type-micro text-muted-foreground">Role selection grants neither private evidence access nor financial approval. Delegation is checked separately.</p>
      </div>

      <div aria-hidden="true" style={{ ...abs({ x: 0, y: 0, width: 1280, height: 720 }), zIndex: 40, background: 'rgb(0 0 0 / 0.8)', display: searchOpen ? undefined : 'none' }} />
      <CommandPalette {...props} role={role} open={searchOpen} />
    </>
  )
}

function CommandPalette(props: ProductProps & { role: Role | null; open: boolean }) {
  const { state, film, role, open } = props
  const input = useRef<HTMLInputElement>(null)
  // The palette stays mounted (a film needs its anchor on every frame), so focus moves in when it opens.
  useEffect(() => {
    if (open && film === undefined) input.current?.focus()
  }, [open, film])
  const query = state.ui.searchQuery
  const search = role === null ? { results: [], denied: false } : searchCommands(role, query)
  const run = (command: PaletteCommand): void => {
    for (const action of commandActions(command)) act(props, action)
    act(props, { type: 'SET_OVERLAY', overlay: null })
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      {...filmAnchor('command-palette')}
      style={{ ...abs(PALETTE), zIndex: 50, opacity: motionProgress(film, 'SET_OVERLAY'), display: open ? undefined : 'none' }}
      className="flex flex-col overflow-hidden rounded-lg border bg-surface text-foreground shadow-lg"
    >
      <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <Search aria-hidden="true" className="size-4 text-muted-foreground" />
        <input
          ref={input}
          role="combobox"
          aria-label="Search commands"
          aria-expanded={search.results.length > 0}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          readOnly={props.dispatch === undefined}
          placeholder="Type a command…"
          onChange={(event) => act(props, { type: 'SET_SEARCH_QUERY', query: event.target.value })}
          onKeyDown={(event) => {
            const first = search.results[0]
            if (event.key === 'Enter' && first) {
              event.preventDefault()
              run(first)
            }
          }}
          className="h-9 min-w-0 flex-1 bg-transparent px-2 type-body outline-none"
        />
        <Kbd>Esc</Kbd>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {search.results.length > 0 ? (
          <ul role="listbox" aria-label="Commands">
            {search.results.map((command) => (
              <li key={command.id} role="option" aria-selected={false}>
                <button type="button" onClick={() => run(command)} className={cn('flex h-8 w-full items-center justify-between rounded-md px-3 type-data hover:bg-surface-2', focusRing)}>
                  <span>{command.label}</span>
                  <span className="type-micro text-muted-foreground">{command.target}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div role="status" className="px-3 py-10 text-center type-data">
            <p>{NO_MATCH}</p>
            {search.denied && <p className="mt-2 type-micro text-muted-foreground">{NOT_LISTED}</p>}
          </div>
        )}
      </div>
      <div className="flex h-10 shrink-0 items-center gap-4 border-t px-4 type-micro text-muted-foreground">
        <span>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> move
        </span>
        <span>
          <Kbd>Enter</Kbd> run
        </span>
        <span className="ml-auto">{COMMANDS.length} commands, filtered by your viewpoint</span>
      </div>
    </div>
  )
}
