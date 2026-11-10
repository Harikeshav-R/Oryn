# Workflow Discovery and Procedure Synthesis Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§5.3, 8.1, 9.1](../../TECHNICAL.md) | [PRODUCT.md §§10, 27.1, 28.2; ORY-011–014](../../PRODUCT.md)

### Core Responsibility
Workflow Discovery and Procedure Synthesis analyzes employee-approved task contributions across the organization, clustering similar demonstrations to synthesize candidate repeatable workflows, identifying procedural variations, and generating clarifying questions for domain reviewers.

### Owns
- Task contribution clustering and pattern recognition across multiple user demonstrations.
- Synthesis of canonical step sequences, branching conditions, and observed decision points.
- Discovery confidence scoring and identifying missing procedural evidence or unexplained variations.
- Generating candidate workflow specifications and review requests for domain owners.
- Calculating opportunity and automation feasibility metrics.

### Consumes
- Sanitized, employee-approved task contributions from [contribution-sync](contribution-sync.md).
- Existing published playbooks and capability definitions from [operational-graph](operational-graph.md).
- Domain expert explanations and feedback on candidate variations.
- Governed cloud inference operations (`text.reason`, `text.embed`) via [cloud-inference](../architecture/cloud-inference.md).
### Produces
- Candidate workflows with inferred objectives, step sequences, input/output variables, and branch logic.
- Reviewer clarification requests highlighting unresolved procedural contradictions.
- Candidate promotion requests submitted to [operational-graph](operational-graph.md).

### Does Not Own
- Unilateral publication of candidate workflows as approved company policy (owned by [operational-graph](operational-graph.md)).
- Direct deployment or execution of automated agents (owned by [agent-factory-ir](agent-factory-ir.md) / [release-governance](release-governance.md)).
- Ingestion of raw unreviewed desktop media (strictly prohibited).

### Boundary Requirement
Workflow discovery operates asynchronously. Ambiguous demonstrations, conflicting employee methods, and edge cases must be surfaced as explicit uncertainties and review questions, rather than silently smoothed over or averaged out. A candidate cannot be auto-published; domain owner review is mandatory.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§10, 27.1, 28.2; ORY-011–014](../../PRODUCT.md))
- **Candidate Clustering Threshold:** At least three similar permitted task demonstrations are required to generate a candidate workflow; candidates are never automatically published (ORY-011).
- **Comprehensive Candidate Details:** Candidates must expose objective, main steps, inputs, applications, suspected outputs, and missing evidence (ORY-012).
- **Reviewer Editability:** Domain reviewers must be able to correct objectives, adjust decision branches, alter scope, and reorder steps before publication (ORY-013).
- **Rejection Handling:** If an owner rejects a candidate, the content must be permanently excluded from published guidance (ORY-014).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #2 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests employee-approved sanitized task contributions from [local-privacy-storage](local-privacy-storage.md) via [contribution-sync](contribution-sync.md) through the `discovery_contribution_intake` destination queue.
- **Contract Reference #4 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers candidate workflows, observed variants, and clarifying questions to [operational-graph](operational-graph.md).
- **Contract Reference #22 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes `text.reason` and `text.embed` via the LiteLLM gateway under [cloud-inference](../architecture/cloud-inference.md) for task clustering and procedure synthesis; inferred candidates remain unapproved drafts until human verification.
- **Review Notification Contract:** Emits `workflow.candidate_created` domain events to alert assigned domain owners in [command-center-analytics](command-center-analytics.md).

### Contribution Ingestion and Deduplication Lifecycle
- **Destination Intake Queue (`discovery_contribution_intake`):** Workflow Discovery polls the PostgreSQL queue populated atomically by [contribution-sync](contribution-sync.md) for contributions where `kind = 'task_demonstration'`.
- **Transport Idempotency vs. Semantic Clustering:** Transport idempotency on `(organization_id, contribution_id, revision)` prevents duplicate queue insertion at the API layer. Downstream, the Discovery inbox worker deduplicates by `(organization_id, contribution_id)` to process only the latest revision, feeding distinct demonstrations into semantic clustering algorithms.
- **Immediate Exclusion of Withdrawn Contributions:** When a contribution is withdrawn via `sync.withdrawal-notice.v1`, the sync transaction writes a withdrawal tombstone to `discovery_contribution_intake`. The discovery worker immediately excludes withdrawn contributions from active clusters and candidate generation pipelines. If an unpublished candidate workflow was derived from a withdrawn contribution and now has fewer than 3 qualifying demonstrations, the candidate is revoked.
- **Late-Result Fencing:** Before committing any synthesized candidate workflow or clustering output to the database, the worker validates against `sync_submission_identity` that all constituent contribution IDs remain active (`disposition = 'accepted'`). Any late-arriving inference result referencing a withdrawn contribution is fenced and discarded.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Background analytics and model pipeline running in the organizational control plane.
- **Data Minimization:** Processes only sanitized contributions stripped of raw media and redacted of PII.
- **Tenant Isolation:** Discovery clustering is strictly isolated per tenant; cross-customer workflow synthesis is prohibited.

## Internal architecture

### Logical Submodules
- **Demonstration Clusterer:** Groups similar sanitized task sessions based on application transitions, UI actions, and timing.
- **Process Synthesis Engine:** Infers directed acyclic graph (DAG) workflows, parameterizing variables and identifying decision branches.
- **Ambiguity and Gap Detector:** Highlights missing pre-conditions, unobserved data transformations, and conflicting branches.
- **Review Request Formatter:** Packages synthesized workflows into structured review packets with supporting evidence links.

## State and lifecycle

### State and Persistence
- **Persisted State:** Ingested contribution store, intermediate clustering indexes, candidate workflow drafts, and reviewer questions.
- **Lifecycle Transitions:** `Ingested → Clustered → In Synthesis → Candidate Proposed → Under Review → Approved / Rejected / Expired`.
- **Candidate Expiration:** Unapproved candidates expire according to the default 365-day retention schedule unless refreshed.

## Error and edge-case behavior

### Failure Handling
- **Insufficient Demonstrations:** If fewer than three demonstrations exist, the cluster remains open in gathering state without proposing a candidate.
- **Irreconcilable Branching:** If demonstrations exhibit contradictory outcomes for identical inputs, the system generates an explicit reviewer question rather than synthesizing an invalid branch.
- **Model Processing Timeout:** Background batch tasks use idempotent checkpointing to resume upon worker failure.

## Observability and audit

### Telemetry and Diagnostics
- Tracks clustering accuracy, candidate generation rates, reviewer acceptance rates, and synthesis pipeline latency.
- Excludes business payload contents and proprietary field values from diagnostic logs.

## Security and threat model

### Security and Safety Considerations
- **Poisoned Demonstration Resistance:** A single malicious or erroneous demonstration cannot skew a candidate because synthesis requires multiple concordant instances and human review.
- **Prompt Injection Defense:** Synthesized step names and descriptions derived from user content are sanitized to prevent prompt injection into downstream compiler components.
- **Confidentiality Preservation:** Candidate summaries preserve data masking tokens to prevent indirect leakage across team boundaries.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.2: ORY-011, ORY-012, ORY-013, ORY-014](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* Three distinct employees submit sanitized demonstrations of an invoice entry task; the discovery engine groups them and generates Candidate WF-101; the assigned finance domain owner opens the candidate and clicks Reject.
  - *Expected Observable Result:* Candidate WF-101 is transitioned to Rejected; it never publishes as a playbook; local HUD caches never receive the rejected guidance; the rejection reason is logged in audit history.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Asynchronous batch processing designed to handle large volumes of daily contributions without blocking interactive APIs.
- Incremental graph clustering to accommodate new demonstrations without re-clustering the entire historical corpus.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What clustering algorithms (graph community detection vs. sequence embeddings) best group noisy user interaction traces?
- How should step abstraction represent variations across different versions of the same web or desktop application?
- What scoring model best measures automation opportunity without relying on unreliable time-saved estimates?
- How should reviewer questions be phrased to minimize cognitive load on busy business experts?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Demonstration clustering, workflow synthesis, variation detection, and candidate generation.
2. *Data ingress/egress:* Ingests sanitized task contributions; outputs structured candidate workflows and review questions.
3. *Versions/identities:* Candidate workflow ID, source contribution IDs, and synthesis algorithm version.
4. *Upstream failure:* If contributions are delayed or sparse, discovery waits safely without synthesizing premature candidates.
5. *Authority:* The assigned domain owner is authoritative for approving or rejecting candidate workflows.
6. *Testing without private details:* Tested via synthetic demonstration traces with known reference workflows.
7. *Audit and duplicate prevention:* Ingested contributions carry deduplication hashes to prevent redundant processing.
8. *Failure blast radius:* Discovery failure delays new candidate proposals; does not affect active playbooks or running jobs.
9. *v1.0 criteria:* Enables ORY-011, ORY-012, ORY-013, and ORY-014 verified through candidate lifecycle tests.
