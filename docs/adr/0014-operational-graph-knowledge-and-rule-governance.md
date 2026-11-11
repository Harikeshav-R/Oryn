# 0014: Operational Graph Knowledge and Rule Governance

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** Oryn Architecture Guild, Operational Graph Owner, Identity Policy Owner, Workflow Discovery Owner, Control Plane Owner
- **Consulted:** Release Governance Owner, Agent Factory Owner, Outcome Verification Owner, Local Context HUD Owner, Enterprise Security Lead
- **Informed:** All Engineering Teams

## Context and Problem Statement

Under [PRODUCT.md §§5, 10–11, 21.8, 26](../../PRODUCT.md) and [TECHNICAL.md §§3, 5.4, 9.1, 10.2](../../TECHNICAL.md), Oryn's Living Operational Graph must serve as the single authoritative source of truth for approved business capabilities, published playbooks, enterprise business rules, system dependencies, peer fixes, and cross-team handoffs.

Key architectural challenges include:
1. **Relational Consistency vs. Graph/Vector Authority:** Choosing an architecture that guarantees transactional integrity across permissions, version histories, and outbox events without split-brain state or distributed two-phase commits.
2. **Capability vs. Playbook Authority:** Ensuring human-facing guidance text cannot diverge from the underlying approved capability procedure.
3. **Deterministic Business Policy vs. Heuristic Inference:** Enforcing enterprise rules with unambiguous three-valued semantics (`pass`, `fail`, `unknown`) and static non-overlapping proofs, rather than trusting probabilistic model decisions or ambiguous table row ordering.
4. **Immediate Policy Fencing vs. Eventual Analytics:** Guaranteeing that rule activations, revocations, and conflict restrictions take effect immediately at runtime, while permitting background search indexing and large blast-radius impact traversals to compute asynchronously.
5. **Guidance Text Publication vs. HUD Qualification:** Decoupling human guidance publication from deterministic desktop HUD automation qualification.

## Decision

The Oryn Architecture Guild resolves the core architecture and governance boundaries for the Operational Graph as follows:

1. **PostgreSQL 18 Relational Authority with pgvector and Recursive CTEs:**
   - The Operational Graph is implemented as a logical Rust module inside the existing Axum/Tokio/SQLx Control Plane.
   - All authoritative graph entities, versions, edges, manifests, and rules reside in PostgreSQL 18 tables protected by mandatory Row-Level Security (`current_setting('oryn.organization_id', true)::uuid`).
   - Structural dependency and blast-radius traversals use cycle-safe recursive CTEs (`CYCLE` clause).
   - Semantic similarity uses `pgvector` exact cosine distance (`<=>`) within tenant and embedding-space boundaries. Search indexes assist exploratory retrieval only; they never establish structural authority. No separate graph database, vector database, or Python authority service is deployed.

2. **Strict 1:1 Capability-to-Workflow Boundary and Playbook Pinning:**
   - An Operational Capability represents one reusable workflow objective, strictly mapped 1:1 with `workflow_id` per tenant.
   - A Capability Version is an immutable record binding procedure, variants, approved rules, audience, and claim provenance.
   - A Playbook Version is an approved human-facing publication derived directly from exactly one capability version, with its version digest derived from RFC 8785 canonical body hashing (`sha256-<64hex>`). Meaning-changing text divergence is prohibited.

3. **Deterministic Three-Valued Logic and UNIQUE Decision Tables:**
   - Business rules support optional deterministic formalizations as Boolean conditions or decision tables.
   - Evaluation uses three-valued logic (`pass`, `fail`, `unknown`). Missing, untrusted, or ill-typed inputs yield `Unknown`.
   - Decision tables enforce the `UNIQUE` hit policy: all rows must be provably pairwise disjoint.
   - Pairwise disjointness is verified statically using Boolean normalization and interval/set intersection over field-versus-constant comparisons (budgeted at 1,000,000 solver steps).
   - Any overlap or budget exhaustion yields `overlap` or `unproven`, immediately denying automated qualification. Tables must define an explicit `no_match` escalation path; row reordering never resolves an overlap.

4. **Transactional Guard Serialization vs. Asynchronous Impact Analysis:**
   - Dependency manifest registrations, rule activations, and publications serialize on the tenant `graph_knowledge_guard`.
   - Identity admission and Release readiness evaluate live rule effectivity and conflict fences synchronously within the transaction; no event lag permits execution under invalidated policy.
   - Operations Map projections, full-text search indexing, and large blast-radius impact queries traverse the graph asynchronously via background durable workers, emitting 202 `OperationV1` with bounded budgets.

5. **Decoupled Central Publication and HUD Bundle Qualification:**
   - Central publication establishes human-visible procedure authority with `hud_status = 'not_configured'`.
   - Delivering an active guidance bundle to the Local Context HUD requires a separately reviewed `GuidanceProjectionDraftV1` binding procedure steps to certified `ApplicationProfileV1` versions and deterministic HUD predicates.
   - Guidance bundles are hashed via RFC 8785 and signed asynchronously by Vault Ed25519 publisher keys (`SignedPublisherSignatureV1`). Any mapping gap or predicate ambiguity blocks bundle delivery without affecting central publication.

6. **Canonical Handoff Obligations with Separately Authorized Summaries:**
   - Cross-team handoffs are tracked in canonical `graph_handoff` obligations with independent completion verification via `graph_handoff_assessment` (`system_evidence` or `authorized_reviewer`).
   - Contract 24 (`graph_handoff_intake`) manages idempotent intake.
   - Recipient teams access separately reviewed, authorized summaries; restricted source workflows and private demonstration details remain redacted unless the recipient independently satisfies the source audience.

## Consequences

### Positive
- Zero cross-database distributed transaction overhead; all mutations, authority fences, audit logs, and outbox events commit atomically.
- Automated agent execution is protected against ambiguous rule overlaps, unproven edge cases, and stale dependencies.
- Clear separation between human guidance and desktop HUD qualification prevents malformed or uncertified automation triggers.
- Privacy-preserving cross-team handoffs allow coordination without disclosing sensitive departmental demonstrations.

### Negative / Tradeoffs
- Large recursive graph queries require statement timeouts and background offloading to prevent resource exhaustion.
- UNIQUE decision table validation requires strict solver constraints and conservative rejection of unproven conditions.
- Stricter Stage 2 guidance publication gate (minimum two distinct completed examples) prevents immediate one-shot publication of newly observed workflows.

## References
- [docs/components/operational-graph.md](../components/operational-graph.md)
- [docs/architecture/contracts/operational-graph-v1.schema.json](../architecture/contracts/operational-graph-v1.schema.json)
- [ADR-0010: Contribution Delivery and Guidance Sync](0010-contribution-delivery-and-guidance-sync.md)
- [ADR-0011: Identity Authority and Approval Fencing](0011-identity-authority-and-approval-fencing.md)
- [ADR-0012: Control Plane Transport, Durability, and Inference Rails](0012-control-plane-transport-durability-and-inference.md)
- [ADR-0013: Workflow Discovery Evidence, Review, and Staging Boundaries](0013-workflow-discovery-evidence-and-review-boundaries.md)
