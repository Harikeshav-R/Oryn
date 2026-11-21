import { AlertTriangle, Bot, FileText, Workflow } from 'lucide-react'
import { OPERATIONS_NODES, OPERATIONS_RELATIONS } from '@/data/operations-graph'
import type { OperationsNodeId, OperationsNodeKind } from '@/data/operations-graph'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { anchored, at } from './geometry'
import { MAP_ANCHORS, MAP_ANCHOR_RECTS as R } from './map-layout'
import type { MapAnchor } from './map-layout'
import { mapAccess } from './map'
import { HiddenAnchors } from './settings-frame'

const icons = { Workflow, Rule: FileText, Agent: Bot, Incident: AlertTriangle } satisfies Record<OperationsNodeKind, typeof Workflow>
const paths: Readonly<Record<string, string>> = {
  'workflow-rule-009': 'M264 180 C310 180 310 90 356 90',
  'workflow-rule-017': 'M264 180 C310 180 310 270 356 270',
  'rule-009-agent': 'M544 90 C580 90 580 180 616 180',
  'rule-017-agent': 'M544 270 C580 270 580 180 616 180',
  'agent-incident': 'M804 180 C850 180 850 320 816 320',
}
/** Where each relationship's fixture name sits: beside the middle of its edge, clear of the nodes. */
const labelAt: Readonly<Record<string, readonly [number, number]>> = {
  'workflow-rule-009': [306, 128],
  'workflow-rule-017': [306, 236],
  'rule-009-agent': [580, 128],
  'rule-017-agent': [580, 236],
  'agent-incident': [840, 256],
}

export function MapScreen(props: ProductProps) {
  const { state } = props
  const access = mapAccess(state)
  if (!access.ok) return <><p role="status" className="type-body rounded-lg border bg-surface-2 p-4" style={at({ x: 264, y: 176, width: 992, height: 88 })}>Not available: {access.reason}</p><HiddenAnchors names={MAP_ANCHORS} /></>
  const { view, selected } = state.ui.breadth.map
  const graph = view === 'graph'
  const selectedNode = OPERATIONS_NODES.find((node) => node.id === selected)
  const progress = props.film?.reducedMotion ? 1 : motionProgress(props.film, 'SELECT_MAP_NODE')
  const select = (node: OperationsNodeId) => act(props, { type: 'SELECT_MAP_NODE', node })
  return <>
    <section {...anchored('map-graph', R['map-graph'], graph)} className="box-border rounded-lg border bg-surface" />
    <section {...anchored('map-table', R['map-table'], !graph)} className="box-border rounded-lg border bg-surface" />
    <h1 style={at({ x: 288, y: 120, width: 400, height: 32 })} className="type-section m-0">Operations Map</h1>
    {OPERATIONS_RELATIONS.map((edge) => {
      const name = `map-edge-${edge.id}` as MapAnchor
      const highlighted = selected !== null && (edge.source === selected || edge.target === selected)
      return <svg key={edge.id} {...anchored(name, R[name], graph)} viewBox="0 0 992 560" className="pointer-events-none text-foreground" aria-hidden="true">
        <defs><marker id={`arrow-${edge.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
        <path d={paths[edge.id]} fill="none" stroke="currentColor" strokeWidth={highlighted ? 2 : 1.5} strokeDasharray={edge.status === 'candidate' ? '5 3' : undefined} opacity={highlighted ? 0.65 + 0.35 * progress : 0.55} markerEnd={`url(#arrow-${edge.id})`} />
        <text x={labelAt[edge.id]?.[0]} y={labelAt[edge.id]?.[1]} textAnchor="middle" fontSize="11" className="fill-current font-mono">{edge.name}</text>
      </svg>
    })}
    {OPERATIONS_NODES.map((node) => {
      const name = `map-${node.id}` as MapAnchor
      const Icon = icons[node.kind]
      return <button key={node.id} type="button" {...anchored(name, R[name], graph)} onClick={() => select(node.id)} aria-pressed={selected === node.id} className={`box-border rounded-md border bg-surface p-2 text-left transition-none focus-visible:outline focus-visible:outline-2 ${selected === node.id ? 'outline outline-2 outline-foreground' : ''}`}>
        <span className="type-micro flex items-center gap-1 text-muted-foreground"><Icon size={16} aria-hidden="true" />{node.kind}</span><span className="type-micro block">{node.name}</span>
      </button>
    })}
    {!graph && <div style={at({ x: 288, y: 164, width: 920, height: 486 })} className="overflow-auto type-micro">
      <h2 className="type-card">Objects</h2>
      {OPERATIONS_NODES.map((node) => <button key={node.id} type="button" onClick={() => select(node.id)} aria-pressed={selected === node.id} className={`flex h-9 w-full items-center gap-5 border-b text-left transition-none ${selected === node.id ? 'outline outline-2 outline-foreground' : ''}`}><span className="w-24">{node.kind}</span>{node.name}</button>)}
      <h2 className="type-card mt-4">Relationships</h2>
      <table className="w-full text-left"><thead><tr><th>Source</th><th>Relation</th><th>Target</th><th>Status</th></tr></thead><tbody>{OPERATIONS_RELATIONS.map((edge) => <tr key={edge.id} className="h-8 border-b"><td>{OPERATIONS_NODES.find((node) => node.id === edge.source)?.name}</td><td>{edge.name}</td><td>{OPERATIONS_NODES.find((node) => node.id === edge.target)?.name}</td><td>{edge.status}</td></tr>)}</tbody></table>
    </div>}
    <button type="button" {...anchored('map-toggle-graph', R['map-toggle-graph'])} aria-pressed={graph} className="rounded-l border bg-surface-2 type-data transition-none" onClick={() => act(props, { type: 'SET_MAP_VIEW', view: 'graph' })}>Graph</button>
    <button type="button" {...anchored('map-toggle-table', R['map-toggle-table'])} aria-pressed={!graph} className="rounded-r border bg-surface-2 type-data transition-none" onClick={() => act(props, { type: 'SET_MAP_VIEW', view: 'table' })}>Table</button>
    <aside {...anchored('map-detail', R['map-detail'], graph && selected !== null)} className="box-border rounded-md border bg-surface p-4 shadow-md" style={{ ...anchored('map-detail', R['map-detail'], graph && selected !== null).style, opacity: 0.65 + 0.35 * progress }}>
      <p className="type-card m-0">{selectedNode?.name}</p>
      {selected === 'agent' ? <div className="type-micro mt-3 space-y-2"><p>AP-RULE-009 Variance threshold · <button type="button" className="underline" onClick={() => select('rule-009')}>Evidence</button></p><p>INC-0042 · <button type="button" className="underline" onClick={() => select('incident')}>Evidence</button></p></div> : <p className="type-micro mt-3">{selectedNode?.kind}</p>}
      <button type="button" className="type-micro underline" onClick={() => act(props, { type: 'SELECT_MAP_NODE', node: null })}>Close</button>
    </aside>
  </>
}
