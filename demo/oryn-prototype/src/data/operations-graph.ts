export type OperationsNodeId = 'workflow' | 'rule-009' | 'rule-017' | 'agent' | 'incident'
export type OperationsNodeKind = 'Workflow' | 'Rule' | 'Agent' | 'Incident'
export type OperationsRelationStatus = 'approved' | 'candidate'

export interface OperationsNode {
  id: OperationsNodeId
  kind: OperationsNodeKind
  name: string
  position: { x: number; y: number }
}

export interface OperationsRelation {
  id: string
  source: OperationsNodeId
  target: OperationsNodeId
  name: string
  status: OperationsRelationStatus
}

export const OPERATIONS_NODES: readonly OperationsNode[] = [
  { id: 'workflow', kind: 'Workflow', name: 'Supplier invoice vs purchase order reconciliation', position: { x: 50, y: 210 } },
  { id: 'rule-009', kind: 'Rule', name: 'AP-RULE-009 Variance threshold', position: { x: 295, y: 120 } },
  { id: 'rule-017', kind: 'Rule', name: 'AP-RULE-017 Supplier handling fees', position: { x: 295, y: 300 } },
  { id: 'agent', kind: 'Agent', name: 'Supplier Invoice Reconciler', position: { x: 570, y: 210 } },
  { id: 'incident', kind: 'Incident', name: 'INC-0042', position: { x: 790, y: 350 } },
]

export const OPERATIONS_RELATIONS: readonly OperationsRelation[] = [
  { id: 'workflow-rule-009', source: 'workflow', target: 'rule-009', name: 'References', status: 'approved' },
  { id: 'workflow-rule-017', source: 'workflow', target: 'rule-017', name: 'References', status: 'candidate' },
  { id: 'rule-009-agent', source: 'rule-009', target: 'agent', name: 'Guides', status: 'approved' },
  { id: 'rule-017-agent', source: 'rule-017', target: 'agent', name: 'Guides', status: 'approved' },
  { id: 'agent-incident', source: 'agent', target: 'incident', name: 'Associated incident', status: 'approved' },
]
