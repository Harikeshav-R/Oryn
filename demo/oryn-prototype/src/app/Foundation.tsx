import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Orbit } from '@/components/domain/orbit'
import { Hatch } from '@/components/ui/hatch'
import { useFontReport } from '@/fonts/context'
import { ORBIT_FRAMES, frameToSeconds } from '@/lib/frame'
import { TYPE_SCALE, type TypeFamily } from '@/lib/type-scale'
import { cn } from '@/lib/utils'
import type { Theme } from './params'

/**
 * CMP-01 / CMP-02 specimen: the tokens, type scale, states and font status the
 * rest of the product layer builds on. Flat surfaces, 1px hairlines, no stage chrome.
 */

const FAMILY_NAME: Record<TypeFamily, string> = {
  sans: 'Space Grotesk',
  mono: 'IBM Plex Mono',
  serif: 'Crimson Text',
}

const TOKENS = [
  ['background', '--background'],
  ['foreground', '--foreground'],
  ['surface', '--surface'],
  ['surface-2', '--surface-2'],
  ['border', '--border'],
  ['muted-foreground', '--muted-foreground'],
  ['trace', '--trace'],
  ['signal', '--signal'],
  ['arc', '--arc'],
  ['arc-ink', '--arc-ink'],
  ['arc-mark', '--arc-mark'],
  ['success', '--success'],
  ['warning', '--warning'],
  ['danger', '--danger'],
] as const

const TYPE_SAMPLES = {
  title: 'Accounts payable reconciliation',
  section: 'Simulation results',
  card: 'SIM-AP-RECON suite',
  body: 'Seven checks ran against the sealed scenario suite.',
  prose: 'INV-48220 stays held until an independent readback shows what the vendor system holds.',
  data: 'JOB-0117 · 11 invoices · 1,204.50',
  micro: 'INDEPENDENT READBACK',
} as const

const SUITE_ROWS = [
  ['Passed', 21, 22],
  ['Passed — Expected Safe Escalation', 6, 6],
  ['Failed', 1, 0],
] as const

const DECIMALS = ['1,204.50', '98.07', '7.00', '10,000.25'] as const

const HATCH_LABEL = { theme: 'Theme', light: 'Light', dark: 'Dark', neutral: 'Neutral' } as const

const buttonClass =
  'inline-flex h-8 items-center gap-2 rounded-md border bg-surface px-3 type-data text-foreground transition-colors hover:bg-surface-2'

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t pt-6">
      <h2 id={id} className="type-section">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Writes the computed token value straight into the DOM, so the specimen shows what the browser resolved. */
function TokenValue({ cssVar, theme }: { cssVar: string; theme: Theme }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (el) el.textContent = getComputedStyle(el).getPropertyValue(cssVar).trim().toUpperCase()
  }, [cssVar, theme])
  return <span ref={ref} />
}

export function Foundation({
  theme,
  onThemeChange,
  initialFrame,
  initialRunning,
}: {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  initialFrame: number
  initialRunning: boolean
}) {
  const fonts = useFontReport()
  const [frame, setFrame] = useState(initialFrame % ORBIT_FRAMES)
  const [running, setRunning] = useState(initialRunning)
  const loadedCount = fonts.faces.filter((face) => face.state === 'loaded').length

  return (
    <main className="mx-auto max-w-[992px] px-6 py-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="type-title">Foundation</h1>
          <p className="mt-2 type-prose text-muted-foreground">
            Tokens, type scale and states for the Oryn product layer.
          </p>
        </div>
        <div role="group" aria-label="Theme" className="flex gap-2">
          {(['light', 'dark'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => onThemeChange(value)}
              className={cn(buttonClass, theme === value && 'bg-foreground text-background hover:bg-foreground')}
            >
              {value === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-8 space-y-12">
        <Section id="tokens" title="Tokens">
          <ul className="grid grid-cols-4 gap-x-4 gap-y-3">
            {TOKENS.map(([name, cssVar]) => (
              <li key={name} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-8 w-8 shrink-0 rounded-sm border"
                  style={{ background: `var(${cssVar})` }}
                />
                <span className="min-w-0">
                  <span className="block truncate type-data">{name}</span>
                  <span className="block type-micro text-muted-foreground">
                    <TokenValue cssVar={cssVar} theme={theme} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="type" title="Type scale">
          <table className="w-full border-collapse">
            <caption className="sr-only">Product type scale</caption>
            <tbody>
              {(Object.keys(TYPE_SCALE) as (keyof typeof TYPE_SCALE)[]).map((role) => {
                const s = TYPE_SCALE[role]
                return (
                  <tr key={role} className="border-b align-baseline">
                    <th scope="row" className="w-56 py-3 pr-4 text-left type-micro font-medium text-muted-foreground">
                      {FAMILY_NAME[s.family]} {s.weight} · {s.size}/{s.line}
                    </th>
                    <td className={cn('py-3', `type-${role}`)}>{TYPE_SAMPLES[role]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Section>

        <Section id="numerals" title="Tabular numerals">
          <div className="grid grid-cols-2 gap-8">
            <table className="w-full border-collapse type-data">
              <caption className="pb-2 text-left type-body text-muted-foreground">SIM-AP-RECON, 28 scenarios</caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="py-2 text-left font-medium">
                    Status
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    First run
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    After fix
                  </th>
                </tr>
              </thead>
              <tbody>
                {SUITE_ROWS.map(([label, first, fixed]) => (
                  <tr key={label} className="border-b">
                    <th scope="row" className="py-2 pr-3 text-left font-medium">
                      {label}
                    </th>
                    <td className="py-2 text-right" data-numeral="">
                      {first}
                    </td>
                    <td className="py-2 text-right" data-numeral="">
                      {fixed}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="py-2 text-left font-medium">
                    Total
                  </th>
                  <td className="py-2 text-right" data-numeral="">
                    28
                  </td>
                  <td className="py-2 text-right" data-numeral="">
                    28
                  </td>
                </tr>
              </tfoot>
            </table>

            <table className="w-full border-collapse">
              <caption className="pb-2 text-left type-body text-muted-foreground">Decimal specimen, not fixture data</caption>
              <thead>
                <tr className="border-b type-data">
                  <th scope="col" className="py-2 text-right font-medium">
                    IBM Plex Mono
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Space Grotesk
                  </th>
                </tr>
              </thead>
              <tbody>
                {DECIMALS.map((value) => (
                  <tr key={value} className="border-b">
                    <td className="py-2 text-right type-data" data-decimal="mono">
                      {value}
                    </td>
                    <td className="py-2 text-right type-body" data-decimal="sans">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="execution" title="Execution arc">
          <div className="flex items-center gap-8">
            <Orbit frame={frame} running={running} size={96} />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  data-run-chip={running ? 'running' : 'stopped'}
                  className={cn(
                    'inline-flex h-6 items-center rounded-sm border px-2 type-data',
                    running ? 'border-arc bg-arc text-arc-ink' : 'bg-surface-2 text-foreground',
                  )}
                >
                  {running ? 'Running' : 'Stopped'}
                </span>
                <button type="button" aria-pressed={running} onClick={() => setRunning(!running)} className={buttonClass}>
                  {running ? 'Stop run' : 'Start run'}
                </button>
              </div>
              <label className="flex items-center gap-3 type-data">
                Frame
                <input
                  type="range"
                  min={0}
                  max={ORBIT_FRAMES - 1}
                  value={frame}
                  onChange={(event) => setFrame(Number(event.target.value))}
                  className="w-56 accent-foreground"
                />
                <span data-frame-readout="" className="inline-block w-[12ch]">
                  {frame} · {frameToSeconds(frame).toFixed(2)} s
                </span>
              </label>
            </div>
          </div>
        </Section>

        <Section id="hatch" title="Unknown hatch">
          <div className="flex items-center gap-6">
            {(['theme', 'light', 'dark', 'neutral'] as const).map((variant) => (
              <figure key={variant} className="flex items-center gap-3">
                <Hatch variant={variant} className="h-8 w-8 rounded-sm border border-foreground" />
                <figcaption className="type-data">{HATCH_LABEL[variant]}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-3 type-body">
            <Hatch className="h-3 w-3 border border-foreground" />
            Outcome Unknown
          </p>
        </Section>

        <Section id="geometry" title="Radii and floating shadows">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex h-16 w-28 items-center justify-center rounded-lg border bg-surface type-data">8 card</div>
            <div className="flex h-12 w-24 items-center justify-center rounded-md border bg-surface type-data">6 control</div>
            <div className="flex h-8 w-20 items-center justify-center rounded-sm border bg-surface type-data">4 nested</div>
            <div className="flex h-12 w-24 items-center justify-center border bg-surface type-data">0 edge</div>
            {(['sm', 'md', 'lg'] as const).map((level) => (
              <div
                key={level}
                className={cn(
                  'flex h-12 w-24 items-center justify-center rounded-md border bg-surface type-data',
                  level === 'sm' && 'shadow-sm',
                  level === 'md' && 'shadow-md',
                  level === 'lg' && 'shadow-lg',
                )}
              >
                shadow-{level}
              </div>
            ))}
          </div>
        </Section>

        <Section id="focus" title="Keyboard focus">
          <div className="flex items-center gap-3">
            <button type="button" className={buttonClass}>
              First action
            </button>
            <button type="button" className={buttonClass}>
              Second action
            </button>
            <input
              aria-label="Sample field"
              placeholder="Sample field"
              className="h-8 w-48 rounded-md border bg-surface px-3 type-data text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </Section>

        <Section id="fonts" title="Bundled fonts">
          <p className="type-body" data-font-summary="">
            {fonts.status === 'loading' && 'Loading fonts'}
            {fonts.status === 'loaded' && `Loaded ${loadedCount} of ${fonts.faces.length} faces`}
            {fonts.status === 'unavailable' && `Unavailable: ${loadedCount} of ${fonts.faces.length} faces loaded`}
          </p>
          <table className="mt-3 w-full border-collapse type-data">
            <caption className="sr-only">Bundled font faces</caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="py-2 font-medium">Face</th>
                <th scope="col" className="py-2 font-medium">File</th>
                <th scope="col" className="py-2 font-medium">State</th>
                <th scope="col" className="py-2 font-medium">Sample</th>
              </tr>
            </thead>
            <tbody>
              {fonts.faces.map(({ spec, state, reason }) => (
                <tr key={spec.path} className="border-b align-baseline" data-face={`${spec.family} ${spec.weight}`}>
                  <td className="py-2 pr-3">
                    {spec.family} {spec.weight}
                  </td>
                  <td className="py-2 pr-3">{spec.path}</td>
                  <td className="py-2 pr-3">{state === 'unavailable' ? `Unavailable · ${reason}` : state === 'loaded' ? 'Loaded' : 'Loading'}</td>
                  <td
                    className="py-2"
                    style={{ fontFamily: `"${spec.family}"`, fontWeight: spec.weight, fontSize: 14 }}
                  >
                    Verified Complete 0123456789
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </main>
  )
}
