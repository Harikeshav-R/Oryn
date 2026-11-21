import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Search } from 'lucide-react'
import { useId, useState, type KeyboardEvent, type RefObject } from 'react'
import { Kbd } from '@/components/ui/kbd'
import { OverlayContainerContext } from '@/components/ui/overlay-context'
import { NO_MATCH, NOT_LISTED, searchCommands, type Command } from '@/data/commands'
import { COMMAND_PLACEHOLDER, type Role } from '@/data/labels'
import { cn } from '@/lib/utils'

/**
 * CMP-11 command palette (anchor `command-palette`): a Radix Dialog around an ARIA
 * combobox and listbox. Geometry `[320,120,640,480]`, 48px search row, 32px results.
 *
 * - Only commands the current role may run are listed (`searchCommands`). Matches the role
 *   may not run are never shown; the denied state says so without naming them.
 * - ArrowUp/Down move the active result, Enter runs it, Escape closes and focus returns to
 *   the opener. Running a command reports it and closes; it changes no domain state.
 * - Results are fixture command names only: no evidence, document or private content.
 */
export function CommandPalette({
  open,
  onOpenChange,
  role,
  onRun,
  initialQuery = '',
  returnFocusRef,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
  onRun: (command: Command) => void
  initialQuery?: string
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/80 duration-150 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <PaletteSurface
          role={role}
          initialQuery={initialQuery}
          onRun={(command) => {
            onRun(command)
            onOpenChange(false)
          }}
          returnFocusRef={returnFocusRef}
        />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function PaletteSurface({
  role,
  initialQuery,
  onRun,
  returnFocusRef,
}: {
  role: Role
  initialQuery: string
  onRun: (command: Command) => void
  returnFocusRef?: RefObject<HTMLElement | null>
}) {
  const [panel, setPanel] = useState<HTMLDivElement | null>(null)
  const [query, setQuery] = useState(initialQuery)
  const [active, setActive] = useState(0)
  const listId = useId()
  const { results, denied } = searchCommands(role, query)
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0))
  const optionId = (command: Command) => `${listId}-${command.id}`

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive(Math.min(activeIndex + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(Math.max(activeIndex - 1, 0))
    } else if (event.key === 'Enter') {
      const command = results[activeIndex]
      if (command) {
        event.preventDefault()
        onRun(command)
      }
    }
  }

  return (
    <DialogPrimitive.Content
      ref={setPanel}
      data-anchor="command-palette"
      onCloseAutoFocus={(event) => {
        if (!returnFocusRef?.current) return
        event.preventDefault()
        returnFocusRef.current.focus()
      }}
      className={cn(
        'fixed inset-x-0 top-[120px] z-50 mx-auto flex h-[480px] w-[640px] max-w-[calc(100%-32px)] flex-col overflow-hidden rounded-lg border bg-surface text-foreground shadow-lg',
        'duration-150 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      )}
    >
      <OverlayContainerContext.Provider value={panel}>
        <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">
          Search the commands your role may run. Arrow keys move, Enter runs, Escape closes.
        </DialogPrimitive.Description>

        <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
          <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <input
            role="combobox"
            aria-label="Search commands"
            aria-expanded={results.length > 0}
            aria-controls={results.length > 0 ? listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={results[activeIndex] ? optionId(results[activeIndex]) : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder={COMMAND_PLACEHOLDER}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            className="h-9 min-w-0 flex-1 rounded-md bg-transparent px-2 type-body text-foreground placeholder:text-muted-foreground focus-visible:outline-offset-0"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {results.length > 0 ? (
            <>
              <p role="status" className="sr-only">
                {results.length} {results.length === 1 ? 'command' : 'commands'}
              </p>
              <ul id={listId} role="listbox" aria-label="Commands" data-palette-results="">
                {results.map((command, index) => (
                  <li
                    key={command.id}
                    id={optionId(command)}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseMove={() => setActive(index)}
                    onClick={() => onRun(command)}
                    className={cn(
                      'flex h-8 cursor-default items-center justify-between rounded-md px-3 type-data',
                      index === activeIndex && 'bg-surface-2',
                    )}
                  >
                    <span>{command.label}</span>
                    <span className="type-micro text-muted-foreground">{command.target}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div role="status" data-palette-empty={denied ? 'denied' : 'empty'} className="px-3 py-10 text-center">
              <p className="type-data">{NO_MATCH}</p>
              {denied && <p className="mt-1 type-micro text-muted-foreground">{NOT_LISTED}</p>}
            </div>
          )}
        </div>

        <div className="flex h-10 shrink-0 items-center gap-4 border-t px-4 type-micro text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Kbd>&uarr;</Kbd>
            <Kbd>&darr;</Kbd> move
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Enter</Kbd> run
          </span>
        </div>
      </OverlayContainerContext.Provider>
    </DialogPrimitive.Content>
  )
}
