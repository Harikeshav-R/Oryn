import { MarkerType, ReactFlow, type Edge, type Node, type OnNodesChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { OPERATIONS_NODES, OPERATIONS_RELATIONS, type OperationsNodeId } from '@/data/operations-graph'
import { cn } from '@/lib/utils'

export type OperationsGraphView = 'graph' | 'table'

export interface OperationsGraphProps {
  selectedId: OperationsNodeId | null
  onSelect: (id: OperationsNodeId | null) => void
  view: OperationsGraphView
  onViewChange: (view: OperationsGraphView) => void
  className?: string
}

const nodeNames = Object.fromEntries(OPERATIONS_NODES.map((node) => [node.id, node.name])) as Record<OperationsNodeId, string>

export function OperationsGraph({ selectedId, onSelect, view, onViewChange, className }: OperationsGraphProps) {
  const nodes: Node[] = OPERATIONS_NODES.map((node) => ({
    id: node.id,
    position: node.position,
    data: {
      label: <span data-anchor={node.id === 'agent' ? 'graph-agent' : undefined} className="flex h-full flex-col justify-center text-left"><span className="type-data text-[11px] leading-4 text-muted-foreground">{node.kind}</span><span className="text-xs font-semibold leading-4">{node.name}</span></span>,
    },
    ariaLabel: `${node.kind}: ${node.name}`,
    selected: selectedId === node.id,
    style: {
      width: node.id === 'incident' ? 160 : 188,
      height: 64,
      padding: '6px 10px',
      border: `${selectedId === node.id ? 2 : 1}px solid ${selectedId === node.id ? 'var(--foreground)' : 'var(--border)'}`,
      borderRadius: 6,
      background: 'var(--surface)',
      color: 'var(--foreground)',
      boxShadow: 'none',
    },
  }))

  const edges: Edge[] = OPERATIONS_RELATIONS.map((relation) => {
    const other = relation.source === 'agent' ? relation.target : relation.target === 'agent' ? relation.source : null
    const emphasized = selectedId === 'agent' && (other === 'rule-009' || other === 'rule-017' || other === 'incident')
    const color = emphasized ? 'var(--signal)' : 'var(--trace)'
    return {
      id: relation.id,
      source: relation.source,
      target: relation.target,
      type: 'default',
      label: relation.name,
      labelStyle: { fill: 'var(--foreground)', fontSize: 11 },
      labelBgStyle: { fill: 'var(--background)' },
      ariaLabel: `${nodeNames[relation.source]} ${relation.name.toLowerCase()} ${nodeNames[relation.target]}, ${relation.status}`,
      markerEnd: { type: MarkerType.ArrowClosed, color },
      style: { stroke: color, strokeWidth: emphasized ? 2 : 1.5, strokeDasharray: relation.status === 'candidate' ? '5 3' : undefined },
    }
  })

  const handleNodesChange: OnNodesChange = (changes) => {
    const selectionChanges = changes.getByType('select')
    const selectedChange = selectionChanges.find((change) => change.selected)
    if (selectedChange) {
      const node = OPERATIONS_NODES.find((item) => item.id === selectedChange.id)
      if (node && node.id !== selectedId) onSelect(node.id)
    } else if (selectedId && selectionChanges.some((change) => change.id === selectedId && !change.selected)) {
      onSelect(null)
    }
  }

  return (
    <section aria-label="Operations Map" className={cn('w-full overflow-hidden rounded-md border bg-background text-foreground', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-surface px-4 py-3">
        <h2 className="text-sm font-semibold">Operations Map</h2>
        <div role="group" aria-label="Operations map view" className="flex gap-1">
          {(['graph', 'table'] as const).map((option) => <button key={option} type="button" aria-pressed={view === option} onClick={() => onViewChange(option)} className={cn('min-h-9 rounded px-3 text-sm focus-visible:outline focus-visible:outline-2', view === option ? 'bg-foreground text-background' : 'text-foreground hover:bg-surface-2')}>{option === 'graph' ? 'Graph' : 'Table'}</button>)}
        </div>
      </header>
      {view === 'graph' ? (
        <div className="overflow-x-auto">
          <div className="h-[500px] min-w-[960px]" aria-label="Operational dependency graph">
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={handleNodesChange} nodesDraggable={false} nodesConnectable={false} elementsSelectable panOnDrag={false} zoomOnScroll={false} zoomOnPinch={false} zoomOnDoubleClick={false} preventScrolling={false} proOptions={{ hideAttribution: true }} />
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto p-4">
          <h3 className="text-sm font-semibold">Objects</h3>
          <ul className="mt-2 divide-y divide-border border-y">{OPERATIONS_NODES.map((node) => <li key={node.id}><button type="button" aria-pressed={selectedId === node.id} onClick={() => onSelect(node.id)} className={cn('flex min-h-10 w-full gap-4 px-2 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]', selectedId === node.id && 'bg-surface-2')}><span className="w-20 shrink-0 text-muted-foreground">{node.kind}</span><span>{node.name}</span></button></li>)}</ul>
          <h3 className="mt-5 text-sm font-semibold">Relationships</h3>
          <table className="mt-2 w-full min-w-[600px] border-collapse text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th scope="col" className="p-2 font-normal">From</th><th scope="col" className="p-2 font-normal">Relationship</th><th scope="col" className="p-2 font-normal">To</th><th scope="col" className="p-2 font-normal">Status</th></tr></thead><tbody>{OPERATIONS_RELATIONS.map((relation) => <tr key={relation.id} className="border-b"><td className="p-2">{nodeNames[relation.source]}</td><td className="p-2">{relation.name}</td><td className="p-2">{nodeNames[relation.target]}</td><td className="p-2 capitalize">{relation.status}</td></tr>)}</tbody></table>
        </div>
      )}
      {selectedId === 'agent' && <aside aria-label="Supplier Invoice Reconciler details" className="border-t bg-surface px-4 py-3"><h3 className="text-sm font-semibold">Supplier Invoice Reconciler</h3><p className="mt-1 text-xs text-muted-foreground">Evidence</p><ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm"><li>AP-RULE-009 Variance threshold</li><li>AP-RULE-017 Supplier handling fees</li><li>INC-0042</li></ul></aside>}
    </section>
  )
}
