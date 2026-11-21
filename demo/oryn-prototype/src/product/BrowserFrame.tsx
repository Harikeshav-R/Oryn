import { ArrowLeft, ArrowRight, LockKeyhole, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { act, filmAnchor, type ProductProps } from './contract'
import { AppView } from './AppViews'
import { APP_TABS, CHROME_MARK, appTabMeta } from './desktop-data'

/**
 * APP-11 Chrome-like frame. Original, nonfunctional, no network: marks are bundled assets, every
 * address is a fictional `.example` host, and nothing here navigates. The window fills below the
 * menu bar: the 48px bar at y28..76 (tab row y28..52, address row y52..76) and the active tab's
 * view from y76. All state is `state.ui.activeTab` / `state.ui.tabHistory`.
 *
 * Geometry never depends on interaction state: tabs are fixed 160x24 cells, nav buttons fixed
 * 24x24, and the address field a fixed 700x24 box.
 */
const TAB_WIDTH = 160
const TAB_HEIGHT = 24

function NavButton({
  label,
  icon,
  left,
  reason,
  onClick,
  film,
}: {
  label: string
  icon: ReactNode
  left: number
  /** Visible reason while the button is aria-disabled; absent when it works. */
  reason?: string
  onClick?: () => void
  film: boolean
}) {
  const disabled = reason !== undefined
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      title={disabled ? reason : label}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'absolute top-0 flex h-6 w-6 items-center justify-center rounded text-foreground hover:bg-border focus-visible:outline-offset-[-2px]',
        'aria-disabled:cursor-not-allowed aria-disabled:text-muted-foreground aria-disabled:opacity-60 aria-disabled:hover:bg-transparent',
        !film && 'transition-colors',
      )}
      style={{ left }}
    >
      {icon}
      {disabled && <span className="sr-only">{reason}</span>}
    </button>
  )
}

export function BrowserFrame(props: ProductProps) {
  const { state } = props
  const film = props.film !== undefined
  const active = state.ui.activeTab
  const activeMeta = appTabMeta(active)
  const canGoBack = state.ui.tabHistory.length > 0

  return (
    <div className="absolute left-0 top-[28px] z-[1] h-[692px] w-[1280px] overflow-hidden bg-background" data-browser-frame aria-label="Browser">
      <div className="relative h-12 w-[1280px] border-b bg-surface-2">
        <div role="tablist" aria-label="Browser tabs" {...filmAnchor('browser-tabs')} className="absolute left-0 top-0 flex" style={{ width: TAB_WIDTH * APP_TABS.length, height: TAB_HEIGHT }}>
          {APP_TABS.map((tab) => {
            const selected = tab.id === active
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`app-view-${tab.id}`}
                {...filmAnchor(`tab-${tab.id}`)}
                onClick={() => act(props, { type: 'SELECT_APP_TAB', tab: tab.id })}
                className={cn(
                  'relative flex shrink-0 items-center gap-1 border-r px-1 text-left font-sans text-[12px] leading-[18px] focus-visible:outline-offset-[-2px]',
                  selected ? 'border-l bg-surface font-semibold text-foreground' : 'font-medium text-muted-foreground hover:bg-background hover:text-foreground',
                  !film && 'transition-colors',
                )}
                style={{ width: TAB_WIDTH, height: TAB_HEIGHT }}
              >
                {selected && <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-signal" />}
                <img src={tab.mark} alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{tab.title}</span>
              </button>
            )
          })}
        </div>

        <div className="absolute left-0 top-6 h-6 w-[1280px]">
          <NavButton
            label="Back"
            icon={<ArrowLeft size={16} />}
            left={12}
            reason={canGoBack ? undefined : 'No earlier view'}
            onClick={() => act(props, { type: 'BROWSER_BACK' })}
            film={film}
          />
          <NavButton label="Forward" icon={<ArrowRight size={16} />} left={48} reason="Forward is not available" film={film} />
          <NavButton label="Reload" icon={<RotateCw size={16} />} left={84} reason="Reload is not available" film={film} />
          <div
            role="textbox"
            aria-readonly="true"
            aria-label="Address"
            className="absolute top-0 flex h-6 w-[700px] items-center gap-2 rounded border bg-surface px-2"
            style={{ left: 240 }}
          >
            <LockKeyhole size={14} aria-hidden className="shrink-0 text-muted-foreground" />
            <span className="type-data truncate">{activeMeta.host}</span>
          </div>
          <img src={CHROME_MARK} alt="" aria-hidden width={16} height={16} className="absolute top-1 h-4 w-4" style={{ left: 1248 }} />
        </div>
      </div>
      <AppView {...props} />
    </div>
  )
}
