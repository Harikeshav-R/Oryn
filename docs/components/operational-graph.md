# Living Operational Graph and Knowledge Governance Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§3, 5.4, 9.1, 10.2](../../TECHNICAL.md) | [PRODUCT.md §§5, 10–11, 21.8, 26; ORY-015–018, ORY-061–062](../../PRODUCT.md)

### Core Responsibility
The Living Operational Graph and Knowledge Governance component maintains the authoritative, versioned network of approved business processes, published playbooks, domain rules, system dependencies, peer fixes, and cross-team handoffs.

### Owns
- The authoritative Operational Capability entity model and playbook registry.
- Knowledge relationship mapping connecting workflows, applications, business rules, exceptions, and agents.
- Version lineage and immutable history for all approved procedures and rules.
- Scoped search and dependency query traversal (e.g., impact analysis for changed rules).
- Knowledge conflict detection, rule freshness monitoring, and deprecation lifecycles.

### Consumes
- Approved workflow candidates from domain reviewers via [workflow-discovery](workflow-discovery.md) and [control-plane](control-plane.md).
- Accepted expert corrections and rule proposals from [incident-correction-repair](incident-correction-repair.md).
- Authorized cross-team handoff commitments and reviewed meeting handoffs (`ReviewedMeetingHandoffProposal`) from [contribution-sync](contribution-sync.md) via Contract 24.
- Agent evaluation and release outcomes from [release-governance](release-governance.md).
- Governed cloud embedding and reranking operations (`text.embed`, `text.rerank`) via [cloud-inference](../architecture/cloud-inference.md).
### Produces
- Published playbooks and peer error resolutions delivered to [local-context-hud](local-context-hud.md) via [contribution-sync](contribution-sync.md).
- Approved capability definitions and business postconditions delivered to [agent-factory-ir](agent-factory-ir.md).
- Operations Map graph projections delivered to [command-center-analytics](command-center-analytics.md).
- Blast radius queries identifying affected workflows and agents when a rule or application changes.

### Does Not Own
- Raw desktop media, screen capture, or unreviewed personal history (strictly prohibited).
- Authorizing production execution or evaluating runtime permissions (owned by [identity-policy](identity-policy.md)).
- Generating executable agent code or test suites (owned by [agent-factory-ir](agent-factory-ir.md)).

### Boundary Requirement
Strictly separate observational evidence, proposed interpretations, and authoritative rules. Graph traversal must answer authoritative dependency questions based on verified links; semantic vector retrieval may assist exploration but cannot override structural relationships. Policy conflicts must be flagged explicitly and block automatic execution.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§5, 10–11, 21.8, 26; ORY-015–018, ORY-061–062](../../PRODUCT.md))
- **Team-Scoped Publication:** Verified playbooks can be published to specific authorized teams; unauthorized users are restricted from viewing details (ORY-015).
- **Operations Map Visualization:** Displays approved workflows, owners, business rules, exceptions, application dependencies, and linked agents (ORY-016, ORY-061).
- **Conflict Resolution Blocking:** Policy conflicts are displayed as unresolved and automatically block execution of the affected workflow branch (ORY-017).
- **Peer Error Resolution with Provenance:** Stores published peer fixes for specific error codes, displaying verifiable provenance to searching employees (ORY-018).
- **Cross-Team Handoff Tracking:** Links source workflow, destination workflow, expected state, owner, and due date for inter-team handoffs (ORY-062).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #3 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers published, access-filtered playbooks and peer fixes to [local-context-hud](local-context-hud.md).
- **Contract Reference #5 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers approved capability models, business rules, and postconditions to [agent-factory-ir](agent-factory-ir.md).
- **Contract Reference #16 in [Contracts Catalog](../architecture/contracts/README.md):** Receives accepted expert corrections and candidate rule changes from [incident-correction-repair](incident-correction-repair.md).
- **Contract Reference #22 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes `text.embed` and `text.rerank` via LiteLLM gateway under [cloud-inference](../architecture/cloud-inference.md) for semantic knowledge retrieval and node search.
- **Contract Reference #24 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests `ReviewedMeetingHandoffProposal` from [contribution-sync](contribution-sync.md); manages canonical shared status, recipient authorization, and duplicate prevention.
- **Operations Map Projections:** Serves graph queries to [command-center-analytics](command-center-analytics.md).
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Core control-plane service backed by persistent graph/relational storage.
- **Access Control:** Every node and relationship is bounded by tenant isolation and team-level access policies.
- **Rule Authority:** Procedural steps and business policy rules have distinct approval authorities; a workflow owner cannot unilaterally overwrite an enterprise compliance rule.

## Internal architecture

### Logical Submodules
- **Capability and Playbook Registry:** Manages versioned records of operational capabilities and published steps.
- **Graph Traversal Engine:** Executes fast dependency, impact, and blast-radius queries across knowledge entities.
- **Conflict and Freshness Monitor:** Detects contradictory rules, overlapping playbooks, and stale application references.
- **Handoff Coordinator:** Manages cross-team handoff commitments and verifies downstream acceptance.

## State and lifecycle

### State and Persistence
- **Persisted State:** Nodes (Capabilities, Playbooks, Rules, Applications, Exceptions, Handoffs) and edges in central storage.
- **Lifecycle Transitions:** `Candidate Review → Approved & Published ↔ Conflict Flagged ↔ Revised (New Version) → Deprecated → Archived`.
- **Immutable Versioning:** Published playbooks and rules are append-only and immutable; updates instantiate a new version with lineage links.

## Error and edge-case behavior

### Failure Handling
- **Detected Policy Contradiction:** Immediately flags affected nodes with `Conflict Detected`, emits alerts, and notifies connected agents.
- **Dangling Reference:** If an application adapter or rule is deleted, dependent playbooks are marked `Revalidation Required`.
- **Query Timeout:** Deep recursive graph traversals enforce depth limits to prevent resource exhaustion.

## Observability and audit

### Telemetry and Diagnostics
- Logs graph mutation history, version diffs, approval author identities, and query performance metrics.
- All playbook publication, revision, and deprecation events generate immutable audit records (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Unauthorized Rule Alteration:** Rule modifications require specific policy-owner privileges; workflow builders cannot alter compliance rules.
- **Cross-Tenant Knowledge Leakage:** Strict tenant filtering on all graph traversals prevents multi-tenant leakage.
- **Stale Knowledge Risks:** Rules tagged with expiration dates trigger automatic revalidation warnings to prevent obsolete agent actions.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.2: ORY-015–018; §31.7: ORY-061–062](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* A compliance admin updates a financial threshold rule; the operational graph detects that two active playbooks contradict the new rule.
  - *Expected Observable Result:* The graph flags the affected playbooks with an unresolved conflict; the Operations Map displays a conflict warning; automated execution of the affected branch is immediately blocked.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Low-latency sub-50ms reads for cached playbook lookups.
- Scalable graph queries capable of traversing multi-hop dependency chains across thousands of enterprise workflows.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What database model (dedicated graph DB vs. relational with recursive CTEs and vector search) best supports versioned knowledge?
- How should conflict detection algorithms balance semantic ambiguity against strict rule contradictions?
- What schema structure best tracks cross-team handoffs with independent downstream verification?
- How should search indexing combine keyword, vector, and structural graph filters?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Authoritative capability models, published playbook versions, rule provenance, and dependency graphs.
2. *Data ingress/egress:* Ingests approved candidates and expert corrections; outputs published playbooks and dependency queries.
3. *Versions/identities:* Capability ID, Playbook version UUID, Rule version hash, and Organization ID.
4. *Upstream failure:* If discovery services stall, existing published playbooks remain active and authoritative.
5. *Authority:* Assigned domain and policy owners are authoritative for approving graph nodes.
6. *Testing without private details:* Tested via synthetic capability networks and automated graph consistency suites.
7. *Audit and duplicate prevention:* Version increments are strictly monotonic and cryptographically hashed.
8. *Failure blast radius:* Graph service failure prevents new publications; cached endpoint playbooks continue serving local HUDs.
9. *v1.0 criteria:* Enables ORY-015, ORY-016, ORY-017, ORY-018, ORY-061, and ORY-062 verified via graph navigation tests.
