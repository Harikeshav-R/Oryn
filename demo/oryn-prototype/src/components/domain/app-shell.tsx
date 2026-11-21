import * as Dialog from '@radix-ui/react-dialog'
import { Bell, BookOpen, Bot, FileClock, FlaskConical, Grid2X2, History, House, LayoutDashboard, ListChecks, Network, Search, Shield, ShieldAlert } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { NotificationCard } from '@/components/domain/notification-card'
import { RoleSelector } from '@/components/domain/role-selector'
import { Kbd } from '@/components/ui/kbd'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { COMMANDS, NO_MATCH, type Command } from '@/data/commands'
import { ROLES, type Role } from '@/data/labels'
import { isNotificationEligible, NOTIFICATIONS, type NotificationEligibility, type NotificationId, type NotificationTarget } from '@/data/notifications'
import { PEOPLE } from '@/data/people'
import { cn } from '@/lib/utils'

const destinations = [
  { label: 'Home', icon: House },
  { label: 'Workflow Discovery', icon: Search },
  { label: 'Playbooks', icon: BookOpen },
  { label: 'Operations Map', icon: Network },
  { label: 'Agent Factory', icon: Bot },
  { label: 'Flight Simulator', icon: FlaskConical },
  { label: 'Jobs', icon: ListChecks },
  { label: 'Incident Center', icon: ShieldAlert },
  { label: 'Versions', icon: History },
  { label: 'Command Center', icon: LayoutDashboard },
  { label: 'Audit & export', icon: FileClock },
  { label: 'Notifications', icon: Bell },
  { label: 'Application Capabilities', icon: Grid2X2 },
  { label: 'My Privacy', icon: Shield },
] as const


const commandDestinations: Readonly<Record<string, AppDestination>> = {
  privacy: 'My Privacy',
  pause: 'My Privacy',
  guide: 'My Privacy',
  publish: 'Playbooks',
  run: 'Flight Simulator',
  unknown: 'Jobs',
  approve: 'Jobs',
  export: 'Audit & export',
}
export type AppDestination = (typeof destinations)[number]['label']

export interface AppShellProps {
  personId: string
  grantedPersonIds: readonly string[]
  onPersonChange: (personId: string) => void
  destination: AppDestination
  grantedDestinations: readonly AppDestination[]
  onNavigate: (destination: AppDestination) => void
  /** Command IDs are explicit grants, separate from both role and navigation grants. */
  grantedCommandIds: readonly string[]
  onCommand: (command: Command) => void
  searchOpen: boolean
  onSearchOpenChange: (open: boolean) => void
  notificationsOpen: boolean
  onNotificationsOpenChange: (open: boolean) => void
  notificationEligibility: NotificationEligibility
  readNotifications?: readonly NotificationId[]
  onNotificationOpen: (target: NotificationTarget) => void
  onNotificationDismiss: (id: NotificationId) => void
  roleSelectorOpen?: boolean
  onRoleSelectorOpenChange?: (open: boolean) => void
  children?: ReactNode
}

/** CMP-38: viewpoint selection and explicit grants remain independent. */
export function AppShell({ personId, grantedPersonIds, onPersonChange, destination, grantedDestinations, onNavigate, grantedCommandIds, onCommand, searchOpen, onSearchOpenChange, notificationsOpen, onNotificationsOpenChange, notificationEligibility, readNotifications = [], onNotificationOpen, onNotificationDismiss, roleSelectorOpen, onRoleSelectorOpenChange, children }: AppShellProps) {
  const searchRef = useRef<HTMLButtonElement>(null)
  const person = PEOPLE.find((item) => item.id === personId && grantedPersonIds.includes(item.id))
  const role = person && ROLES.find((item) => item === person.role)
  const eligibleNotifications = (Object.keys(NOTIFICATIONS) as NotificationId[]).filter((id) =>
    person?.id === notificationEligibility.recipient && isNotificationEligible(id, notificationEligibility),
  )

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k' && role) {
        event.preventDefault()
        onSearchOpenChange(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onSearchOpenChange, role])

  return (
    <div className="flex h-[720px] w-[1280px] overflow-hidden bg-background text-foreground">
      <aside data-anchor="sidebar" className="h-full w-[240px] shrink-0 border-r bg-surface-2 px-4 pt-[30px]">
        <RoleSelector personId={personId} grantedPersonIds={grantedPersonIds} onPersonChange={onPersonChange} open={roleSelectorOpen} onOpenChange={onRoleSelectorOpenChange} />
        <nav aria-label="Main navigation" className="mt-6 flex flex-col gap-0.5">
          {role && destinations.filter((item) => grantedDestinations.includes(item.label)).map(({ label, icon: Icon }) => (
            <button key={label} type="button" aria-current={destination === label ? 'page' : undefined} onClick={() => onNavigate(label)} className={cn('relative flex h-8 w-full items-center gap-3 rounded-md px-3 text-left type-data outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring motion-safe:transition-colors motion-safe:duration-150', destination === label && 'bg-surface font-semibold before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-foreground')}>
              <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />{label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="relative flex h-14 items-center border-b bg-surface">
          <button ref={searchRef} data-anchor="search" type="button" aria-label="Search workflows, agents and cases" aria-keyshortcuts="Meta+K Control+K" disabled={!role} onClick={() => onSearchOpenChange(true)} className="absolute left-[248px] flex h-8 w-[264px] items-center gap-2 rounded-md border bg-surface-2 px-3 text-left type-data text-muted-foreground outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
            <Search aria-hidden="true" className="size-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate">Search workflows, agents and cases</span><Kbd>⌘K</Kbd>
          </button>
          <Popover open={Boolean(role) && notificationsOpen} onOpenChange={onNotificationsOpenChange}>
            <PopoverTrigger asChild>
              <button data-anchor="bell" type="button" aria-label={eligibleNotifications.some((id) => !readNotifications.includes(id)) ? 'Notifications, unread notifications' : 'Notifications'} disabled={!role} className="absolute right-16 flex size-8 items-center justify-center rounded-md outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
                <Bell aria-hidden="true" className="size-4" />
                {eligibleNotifications.some((id) => !readNotifications.includes(id)) && <span aria-hidden="true" className="absolute right-1 top-1 size-1.5 rounded-full bg-foreground" />}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[384px] max-w-[calc(100vw-32px)]">
              <h2 className="mb-3 text-sm font-semibold">Notifications</h2>
              <div className="flex max-h-[480px] flex-col gap-2 overflow-y-auto">
                {eligibleNotifications.length === 0 ? <p className="type-data text-muted-foreground">No notifications</p> : eligibleNotifications.map((id) => <NotificationCard key={id} id={id} {...notificationEligibility} read={readNotifications.includes(id)} onOpen={onNotificationOpen} onDismiss={onNotificationDismiss} />)}
              </div>
            </PopoverContent>
          </Popover>
        </header>
        <main className="h-[664px] overflow-auto">{role && grantedDestinations.includes(destination) ? children : <p className="p-6 type-data text-muted-foreground">Access unavailable</p>}</main>
      </div>
      {role && <AuthorizedPalette open={searchOpen} onOpenChange={onSearchOpenChange} role={role} grantedDestinations={grantedDestinations} grantedCommandIds={grantedCommandIds} onCommand={onCommand} returnFocusRef={searchRef} />}
    </div>
  )
}

function AuthorizedPalette({ open, onOpenChange, role, grantedDestinations, grantedCommandIds, onCommand, returnFocusRef }: { open: boolean; onOpenChange: (open: boolean) => void; role: Role; grantedDestinations: readonly AppDestination[]; grantedCommandIds: readonly string[]; onCommand: (command: Command) => void; returnFocusRef: RefObject<HTMLButtonElement> }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()
  const results = COMMANDS.filter((command) => {
    const destination = commandDestinations[command.id]
    return destination !== undefined && command.roles.includes(role) && grantedCommandIds.includes(command.id) && grantedDestinations.includes(destination) && command.label.toLowerCase().includes(query.trim().toLowerCase())
  })
  const activeIndex = Math.min(active, Math.max(0, results.length - 1))
  function run(command: Command) {
    onCommand(command)
    onOpenChange(false)
  }
  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(Math.min(activeIndex + 1, results.length - 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(Math.max(activeIndex - 1, 0)) }
    else if (event.key === 'Enter' && results[activeIndex]) { event.preventDefault(); run(results[activeIndex]) }
  }
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) { setQuery(''); setActive(0) }; onOpenChange(next) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80" />
        <Dialog.Content data-anchor="command-palette" onCloseAutoFocus={(event) => { if (returnFocusRef.current) { event.preventDefault(); returnFocusRef.current.focus() } }} className="fixed inset-x-0 top-[120px] z-50 mx-auto flex h-[480px] w-[640px] max-w-[calc(100%-32px)] flex-col overflow-hidden rounded-lg border bg-surface text-foreground shadow-lg">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">Search authorized commands. Arrow keys move, Enter runs, Escape closes.</Dialog.Description>
          <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
            <Search aria-hidden="true" className="size-4 text-muted-foreground" />
            <input role="combobox" aria-label="Search commands" aria-expanded={results.length > 0} aria-controls={results.length > 0 ? listId : undefined} aria-autocomplete="list" aria-activedescendant={results[activeIndex] ? `${listId}-${results[activeIndex].id}` : undefined} autoComplete="off" value={query} onChange={(event) => { setQuery(event.target.value); setActive(0) }} onKeyDown={handleKey} placeholder="Type a command…" className="h-9 min-w-0 flex-1 bg-transparent px-2 type-body outline-none" />
            <Kbd>Esc</Kbd>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {results.length ? <ul id={listId} role="listbox" aria-label="Commands">{results.map((command, index) => <li key={command.id} id={`${listId}-${command.id}`} role="option" aria-selected={index === activeIndex} onMouseMove={() => setActive(index)} onClick={() => run(command)} className={cn('flex h-8 cursor-default items-center justify-between rounded-md px-3 type-data', index === activeIndex && 'bg-surface-2')}><span>{command.label}</span><span className="type-micro text-muted-foreground">{command.target}</span></li>)}</ul> : <p role="status" className="px-3 py-10 text-center type-data">{NO_MATCH}</p>}
          </div>
          <div className="flex h-10 shrink-0 items-center gap-4 border-t px-4 type-micro text-muted-foreground"><span><Kbd>↑</Kbd> <Kbd>↓</Kbd> move</span><span><Kbd>Enter</Kbd> run</span></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
