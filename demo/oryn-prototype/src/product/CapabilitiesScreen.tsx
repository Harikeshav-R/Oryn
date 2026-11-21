import { Check } from 'lucide-react'
import gmail from '@/assets/marks/gmail.svg'
import netsuite from '@/assets/marks/netsuite-favicon.png'
import sheets from '@/assets/marks/google-sheets.svg'
import slack from '@/assets/marks/slack.svg'
import zoom from '@/assets/marks/zoom.svg'
import hubspot from '@/assets/marks/hubspot.svg'
import chrome from '@/assets/marks/chrome.svg'
import salesforce from '@/assets/marks/salesforce.svg'
import outlook from '@/assets/marks/outlook.svg'
import excel from '@/assets/marks/excel.svg'
import teams from '@/assets/marks/teams.svg'
import meet from '@/assets/marks/meet.svg'
import edge from '@/assets/marks/edge.svg'
import { CAPABILITY_COLUMNS, CAPABILITY_MATRIX, OTHER_APPLICATIONS } from '@/data/capabilities'
import type { CapabilityApplication } from '@/data/capabilities'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { capabilityAccess, capabilityAvailability } from './capabilities'
import { CAPABILITY_ANCHORS, CAPABILITY_ANCHOR_RECTS as R } from './capabilities-layout'
import type { CapabilityAnchor } from './capabilities-layout'
import { anchored, at } from './geometry'
import { HiddenAnchors } from './settings-frame'

const marks: Readonly<Record<string, string>> = { Gmail: gmail, NetSuite: netsuite, 'Google Sheets': sheets, Slack: slack, Zoom: zoom, HubSpot: hubspot, Chrome: chrome, Salesforce: salesforce, Outlook: outlook, Excel: excel, Teams: teams, Meet: meet, Edge: edge }
const rowNames: Readonly<Record<CapabilityApplication, CapabilityAnchor>> = { Gmail: 'cap-row-gmail', NetSuite: 'cap-row-netsuite', 'Google Sheets': 'cap-row-google-sheets', Slack: 'cap-row-slack', Zoom: 'cap-row-zoom', HubSpot: 'cap-row-hubspot', Chrome: 'cap-row-chrome' }

export function CapabilitiesScreen(props: ProductProps) {
  const { state } = props
  const access = capabilityAccess(state)
  if (!access.ok) return <><p role="status" className="type-body rounded-lg border bg-surface-2 p-4" style={at({ x: 264, y: 176, width: 992, height: 88 })}>Not available: {access.reason}</p><HiddenAnchors names={CAPABILITY_ANCHORS} /></>
  const { view, selected } = state.ui.breadth.capability
  const matrix = view === 'matrix'
  const availability = selected ? capabilityAvailability(selected) : null
  const progress = props.film?.reducedMotion ? 1 : motionProgress(props.film, 'SET_CAPABILITY_VIEW')
  return <>
    <section {...anchored('capability-matrix', R['capability-matrix'], matrix)} className="box-border rounded-lg border bg-surface" />
    <h1 style={at({ x: 280, y: 120, width: 600, height: 32 })} className="type-section m-0">Supported application validation</h1>
    <div style={at({ x: 1024, y: 120, width: 192, height: 32 })} className="flex gap-2">
      <button type="button" aria-pressed={matrix} className="rounded border bg-surface-2 px-3 type-micro" onClick={() => act(props, { type: 'SET_CAPABILITY_VIEW', view: 'matrix' })}>Matrix</button>
      <button type="button" aria-pressed={!matrix} className="rounded border bg-surface-2 px-3 type-micro" onClick={() => act(props, { type: 'SET_CAPABILITY_VIEW', view: 'tiles' })}>Tiles</button>
    </div>
    <div {...anchored('cap-headers', R['cap-headers'], matrix)} className="grid grid-cols-5 items-center type-micro font-semibold">{CAPABILITY_COLUMNS.map((column) => <span key={column} className="px-2">{column}</span>)}</div>
    {CAPABILITY_MATRIX.map((row, rowIndex) => <div key={row.application}>
      <div {...anchored(rowNames[row.application], R[rowNames[row.application]], matrix)} className="box-border flex items-center gap-2 border bg-surface-2 px-2 type-micro"><img src={marks[row.application]} alt="" width={16} height={16} />{row.application}</div>
      {CAPABILITY_COLUMNS.map((column, columnIndex) => {
        const value = row.capabilities[column]
        const first = rowIndex === 0 && columnIndex === 0
        const rect = { x: 400 + columnIndex * 160, y: 198 + rowIndex * 54, width: 160, height: 54 }
        const chosen = selected?.application === row.application && selected.capability === column
        return <button key={column} type="button" {...(first ? anchored('cap-cell-gmail-observe', R['cap-cell-gmail-observe'], matrix) : { style: { ...at(rect), ...(matrix ? {} : { display: 'none' }) } })} data-capability-cell={`${row.application}:${column}`} aria-label={`${row.application} ${column}: ${value === 'unavailable' ? 'Unavailable' : value === 'per-meeting-opt-in' ? 'Observe by per-meeting opt-in' : 'Available'}`} aria-pressed={chosen} className={`box-border flex items-center gap-1 border bg-surface px-2 text-left type-micro transition-none focus-visible:outline focus-visible:outline-2 ${chosen ? 'outline outline-2 outline-foreground' : ''}`} onClick={() => act(props, { type: 'SET_CAPABILITY_VIEW', selected: { application: row.application, capability: column } })} onKeyDown={(event) => { if (event.key === 'Escape') act(props, { type: 'SET_CAPABILITY_VIEW', selected: null }) }}>
          {value === 'unavailable' ? '— Unavailable' : value === 'per-meeting-opt-in' ? 'Observe by per-meeting opt-in' : <><Check size={16} aria-hidden="true" />Available</>}
        </button>
      })}
    </div>)}
    <div {...anchored('cap-extras', R['cap-extras'], matrix)} className="box-border flex items-center gap-4 border-t type-micro text-muted-foreground"><span>Other application marks · no capability asserted</span>{OTHER_APPLICATIONS.map((app) => <span key={app} className="flex items-center gap-1"><img src={marks[app]} alt="" width={16} height={16} className="grayscale" />{app}</span>)}</div>
    <div {...anchored('adapter-tiles', R['adapter-tiles'], !matrix)} className="grid grid-cols-7 gap-3">
      {[...CAPABILITY_MATRIX.map((row) => row.application), ...OTHER_APPLICATIONS].map((app, index) => <div key={app} data-extra-mark={index >= 7 ? 'true' : undefined} className={`box-border flex h-[72px] items-center gap-2 rounded border bg-surface-2 px-3 type-micro ${index >= 7 ? 'text-muted-foreground grayscale' : ''}`}><img src={marks[app]} alt="" width={24} height={24} /><span>{app}</span></div>)}
    </div>
    {!matrix && <p style={at({ x: 280, y: 370, width: 800, height: 48 })} className="type-micro">Zoom: per-meeting opt-in. Unavailable intersections are listed in the matrix.</p>}
    <aside {...anchored('cap-detail', R['cap-detail'], matrix && selected !== null)} role="dialog" aria-label="Capability detail" className="box-border rounded border bg-surface p-4 shadow-md" style={{ ...anchored('cap-detail', R['cap-detail'], matrix && selected !== null).style, opacity: 0.65 + 0.35 * progress }} onKeyDown={(event) => { if (event.key === 'Escape') act(props, { type: 'SET_CAPABILITY_VIEW', selected: null }) }}>
      <p className="type-card m-0">{selected?.application} · {selected?.capability}</p>
      <p className="type-micro">{availability === 'unavailable' ? 'Unavailable. No action is available for this intersection.' : availability === 'per-meeting-opt-in' ? 'Opt-in is required for each meeting. Capture consent never implies meeting consent.' : `${selected?.capability} is available for this application.`}</p>
      {availability !== 'unavailable' && <p className="type-micro">Capability is not authorization.</p>}
      <button type="button" className="type-micro underline" onClick={() => act(props, { type: 'SET_CAPABILITY_VIEW', selected: null })}>Close</button>
    </aside>
  </>
}
