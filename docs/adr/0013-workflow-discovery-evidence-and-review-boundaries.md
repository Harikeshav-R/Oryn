# 0013: Workflow Discovery Evidence, Review, and Staging Boundaries

- **Status:** Accepted
- **Date:** 2026-11-09
- **Deciders:** Oryn Architecture Guild, Workflow Discovery Owner, Operational Graph Owner, Identity Policy Owner, Privacy Storage Owner
- **Consulted:** Control Plane Owner, Local Context HUD Owner, Enterprise Security Lead
- **Informed:** All Engineering Teams

## Context and Problem Statement

Oryn's core value proposition requires discovering repeatable business workflows from voluntary employee demonstrations without compromising endpoint privacy, organizational boundary controls, or procedural correctness. Under [PRODUCT.md §10](../../PRODUCT.md) and [TECHNICAL.md §5.3](../../TECHNICAL.md), Workflow Discovery must cluster similar task demonstrations around business objectives, synthesize structured candidate procedures, attribute claim-level evidence, manage reviewer revisions, and deliver approved candidates to the Operational Graph.

Key architecture challenges include:
1. **Clustering Integrity vs. Semantic Drift:** Soft similarity thresholds or centroid-based clustering risk "transitive chain merging" where procedure A is similar to B, and B to C, but A and C represent incompatible business operations.
2. **Access Governance vs. Cross-Scope Leakage:** Employees across different departments or security groups may submit demonstrations. Naive audience unions or group member snapshots risk exposing confidential procedures across unauthorized organizational boundaries.
3. **Audit Provenance vs. Reviewer Edits:** Reviewers must be able to rename, reorder, group, or parameterize steps without fabricating evidence or disguising edited assumptions as observed facts.
4. **Guidance Authority vs. Automatic Publication:** Machine-synthesized workflows must never become company policy or HUD guidance without explicit human approval by an authorized domain owner.
5. **Productivity Estimation vs. Workplace Surveillance:** Organizations need opportunity metrics to prioritize automation, but per-step timing or active-versus-idle analytics create unacceptable workplace surveillance vectors.

## Decision

The Oryn Architecture Guild resolves the evidence, review, and publication boundaries for Workflow Discovery as follows:

1. **Conservative Hybrid Discovery with Cluster-Wide Compatibility:**
   - Vector embeddings (`text.embed`) perform candidate retrieval only, selecting the top 20 candidate demonstrations and top 10 published playbook summaries via exact cosine nearest-neighbor search (`<->` or `<=>`) in PostgreSQL `pgvector`.
   - Cluster membership requires explicit pairwise equivalence across business objectives, boundary conditions, eligible case criteria, and required postconditions evaluated by cloud text reasoning (`text.reason`).
   - Every member of a cluster must be compatible with every other member (cluster-wide compatibility); transitive merging without complete pairwise compatibility is prohibited. Ambiguous multi-cluster membership generates a clarification question rather than an arbitrary choice.

2. **Strict Audience Conjunction:**
   - Grouping multiple task contributions requires a non-empty conjunction of their approved audience policy expressions evaluated live through Identity Policy.
   - If the common audience intersection is empty or unprovable, automatic clustering is prohibited and no cross-scope candidate is created. Empty conjunctions fail silently without alerting unauthorized actors to the existence of contributing sources.

3. **Three-Demonstration Gate for Automatic Candidates:**
   - Automatic candidate generation requires at least three distinct, observed-complete Task Instances (`completion_basis = observed_complete`).
   - Revisions, supersessions, and duplicate submissions for the same Task Instance count exactly once.
   - The three instances may originate from a single employee or multiple employees; device enrollment authenticates the issuer attempt tuple `(organization_id, actor_id, device_id, profile_id, demonstration_id)`.
   - Incomplete or employee-reported demonstrations cannot meet the gate; they generate clarification questions only.
   - Manual candidate drafts require zero support but remain `guidance_eligibility = not_ready` until human procedure definition.

4. **Business Equivalents as Explicit Variants:**
   - Different application sequences achieving the same verifiable business outcome with documented conditions are preserved as explicit variants, rather than smoothed over or discarded.

5. **Task-Level Duration Minimization:**
   - Task measurements (`task_measurement`) capture only task-level elapsed and wait durations with monotonic interval completeness flags (`complete_interval = true`).
   - Per-step timings, mouse activity, active-hours tracking, and employee idle-time analytics are strictly prohibited.
   - The Privacy Helper validates durations proposed by the HUD; reviewer estimates are labeled explicitly as estimates.

6. **Rust Core on PostgreSQL with pgvector:**
   - Discovery runs as Rust worker tasks within the Worker role of the control plane.
   - Vectors are stored in PostgreSQL using `pgvector` with model-space isolation; no external vector database service or Python authority layer is introduced.

7. **Immutable Revision Diffs and Optimistic Concurrency:**
   - Reviewer edits replace the editable procedure subset under optimistic concurrency control (`expected_revision`), producing a new immutable `CandidateRevisionV1` with content SHA-256 hashing.
   - New contributing evidence produces a proposed revision diff (`discovery_proposal`); it never silently mutates an active review draft or restores an invalidated approval.

8. **Sanitized Suppression Rules:**
   - Rejections require an owner-reviewed `SuppressionRuleV1` containing only sanitized business descriptions, scope, and reconsideration conditions.
   - Demonstrations, contributor identities, images, and timings are permanently excluded from suppression rules.
   - Suppression rules survive candidate payload expiration; material new evidence triggers an owner-gated reconsideration request.

9. **Acyclic Repetition Guidance:**
   - Repeated work is represented as human procedural guidance with explicit termination descriptions and acyclic subgraphs; executable cycle semantics are not emitted.

10. **Separate Guidance Approval and Publication:**
    - Domain Workflow Owners approve candidates for guidance staging (`CandidatePromotionV1`) into the Operational Graph.
    - Staging does NOT publish guidance. The Operational Graph exclusively owns the final `Publish` command, which re-checks all source fences, rule versions, and staged content hashes before creating an immutable published version.

11. **Workflow-Centric Opportunity Projections:**
    - Opportunity projections are sample-based and workflow-centric. Aggregate metrics are suppressed if the contributor cohort size is less than the privacy threshold (default 5 employees).
    - Financial savings projections require explicit owner-supplied baselines and assumptions (`OpportunityAssumptionsV1`); savings are labeled as potential under declared assumptions, never measured realized savings.

12. **Scope Amendment to ADR-0009 (Contract 25 Minor 2 Cutover):**
    - This decision amends ADR-0009 to advance Contract 25 (`privacy-context.v1`) to `protocol_major: 1`, `protocol_minor: 2`.
    - Minor 2 adds task measurement proposals (`task_measurement`) to `DemonstrationProposalV1` and helper-minted shared demonstration identity (`demonstration_id`) without altering inherited socketpair framing, control reserves, or observation streaming semantics.

## Rationale and Alternatives Considered

- *Rejected Alternative 1: Model-Led Soft Centroid Clustering:* Allowing an embedding model to dynamically group demonstrations based on vector distance alone causes semantic drift. In business procedures, a minor difference (e.g., credit memo vs. invoice debit) fundamentally alters accounting policy. Exact cosine retrieval followed by cluster-wide pairwise reasoning over typed fields prevents this drift.
- *Rejected Alternative 2: Shared Audience Unions:* Combining audiences as a union (`Audience A OR Audience B`) permits cross-departmental data leakage, allowing members of Group B to inspect procedural nuances of Group A. Strict conjunction (`Audience A AND Audience B`) ensures that only individuals authorized to view all underlying sources can access the combined candidate.
- *Rejected Alternative 3: Mutable In-Place Candidate Edits:* Allowing reviewers to edit candidate fields in place without versioning destroys audit provenance and invalidates cryptographic content hashes. Immutable revision lineage with RFC 8785 canonical hashing guarantees reproducible compliance.
- *Rejected Alternative 4: Automatic Publication of Synthesized Workflows:* Automatically deploying AI-discovered candidates as active guidance violates Oryn's foundational safety principle. Domain owner review and separate publication staging are mandatory.
- *Rejected Alternative 5: Granular Per-Step Employee Duration Analytics:* Capturing keystroke timings, per-step speed, or idle time transforms a procedural discovery tool into an invasive employee surveillance engine, damaging employee trust and violating European works-council agreements.

## Consequences

- `contribution-sync-v1.schema.json` requires `demonstration_id`, `completion_basis`, and `task_measurement` in `WorkflowContributionContentV1`.
- `workflow-discovery-v1.schema.json` establishes normative Draft 2020-12 wire schemas for all Discovery DTOs and commands.
- `workflow-discovery-v1.fixtures.json` establishes verified test fixtures across positive, structural negative, and semantic evaluation cases.
- `control-plane-v1.openapi.json` incorporates 21 new Discovery and staging endpoints.
- `control-plane-v1.schema.json` expands `ControlPlaneProblemV1.code` with 12 discovery error codes and `DomainEventV1.event_type` with 7 discovery event types.
- Contract 25 advances to `privacy-context.v1` major 1, minor 2.
- `docs/components/workflow-discovery.md` advances from baseline brief to detailed technical specification.
