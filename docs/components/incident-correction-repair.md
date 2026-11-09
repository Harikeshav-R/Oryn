# Incident Detection, Correction, and Repair Engine Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§6.7–9, 8.5, 9.6](../../TECHNICAL.md) | [PRODUCT.md §§18–20, 28.4, 29.8; ORY-049–055, ORY-059](../../PRODUCT.md)

### Core Responsibility
The Incident Detection, Correction, and Repair Engine converts execution failures, verification mismatches, and safety anomalies into governed incident records, triggers immediate containment, collects expert human corrections, and compiles bounded, explainable repair proposals.

### Owns
- The incident lifecycle (Detected, Contained, Investigating, Awaiting Correction, Repair Proposed, Resolved).
- Failure classification and containment blast-radius determination (pausing a single case, batch, adapter, or agent version).
- Collecting structured expert human explanations, demonstrations, and rule clarifications.
- Generating candidate behavioral patches, new business rule proposals, and required regression scenarios.
- Linking incidents directly to originating execution traces, expert corrections, and candidate repair versions.

### Consumes
- Verification verdicts and discrepancy evidence from [outcome-verification](outcome-verification.md).
- Execution failure signals and unhandled exceptions from [agent-runtime](agent-runtime.md) and [job-orchestration](job-orchestration.md).
- Expert human explanations and demonstrations submitted via [command-center-analytics](command-center-analytics.md).
- Dependency relationships from [operational-graph](operational-graph.md).
- Governed cloud reasoning operations (`text.reason`) via [cloud-inference](../architecture/cloud-inference.md).
### Produces
- Governed incident records with observed facts and labeled diagnostic hypotheses.
- Immediate containment instructions dispatched to [job-orchestration](job-orchestration.md) and [release-governance](release-governance.md).
- Proposed business rule changes delivered to [operational-graph](operational-graph.md).
- New candidate agent repair bundles and regression test requirements delivered to [agent-factory-ir](agent-factory-ir.md) and [flight-simulator](flight-simulator.md).

### Does Not Own
- Unilateral approval of business policies or compliance rules (owned by [identity-policy](identity-policy.md) / [operational-graph](operational-graph.md)).
- Mutating active production agent versions in place (strictly prohibited; repairs produce new version candidates).
- Releasing repaired agents to production without governance gates (owned by [release-governance](release-governance.md)).

### Boundary Requirement
Containment actions must be scoped to the actual failure blast radius (case, worker, adapter, or version) without unnecessarily stopping unrelated work. Model-generated root cause analyses must be labeled as unverified hypotheses until supported by verified evidence. Classify interaction fixes, data-interpretation fixes, and policy changes separately, as each requires distinct approval authorities. Prefer narrow, explainable repairs over sweeping rewrites.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§18–20, 28.4, 29.8; ORY-049–055, ORY-059](../../PRODUCT.md))
- **Incident Creation on Failure:** Verification failures or critical unexpected states create an incident linking agent, case, severity, and evidence (ORY-049).
- **Hypothesis Labeling:** Incidents clearly distinguish observed factual evidence from suspected AI-generated root causes (ORY-050).
- **Critical Containment:** Critical incidents halt affected operations immediately and notify assigned owners and security reviewers (ORY-051).
- **Expert Correction Governance:** Experts can provide procedural corrections without automatically making them company policy (ORY-052).
- **Exception Rule Review:** Proposed exception rules require explicit review and approval by domain owners (ORY-053).
- **Linked Regression Generation:** Corrections automatically generate proposed agent patches and at least one linked regression scenario (ORY-054).
- **Regression Blocking:** Candidate repairs that fix the target bug but introduce a critical regression cannot be released (ORY-055).
- **Failure Grouping:** Repeated failures are grouped intelligently without obscuring underlying case lists or evidence (ORY-059).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #14 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests verification verdicts and mismatch diagnoses from [outcome-verification](outcome-verification.md).
- **Contract Reference #15 in [Contracts Catalog](../architecture/contracts/README.md):** Formulates failure classifications and links evidence references internally.
- **Contract Reference #16 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers accepted expert corrections or candidate rules to [operational-graph](operational-graph.md).
- **Contract Reference #17 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers new candidate versions and regression requirements to [agent-factory-ir](agent-factory-ir.md) and [flight-simulator](flight-simulator.md).
- **Contract Reference #22 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes `text.reason` via LiteLLM gateway under [cloud-inference](../architecture/cloud-inference.md) for diagnostic reasoning and patch proposal; model diagnoses remain labeled hypotheses and candidate repairs require simulator verification.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Control-plane backend service managing incident state and automated repair generation pipelines.
- **Hypothesis vs. Fact Separation:** Diagnostic outputs from LLMs are tagged with a strict `Hypothesis` flag; only verified system events are marked `Observed Fact`.
- **Zero In-Place Mutation:** Cannot alter active executable files or database rows of running agents; repairs strictly generate new immutable version drafts.

## Internal architecture

### Logical Submodules
- **Incident Correlator:** Aggregates error events across cases, groups repeated patterns, and assigns severity tiers.
- **Containment Dispatcher:** Determines failure blast radius and emits pause/stop commands to orchestrators.
- **Expert Feedback Collector:** Presents structured inquiry forms to human domain experts to capture resolution explanations.
- **Repair Proposal Synthesizer:** Compiles expert demonstrations and corrected branches into candidate IR patches and linked regression tests.

## State and lifecycle

### State and Persistence
- **Persisted State:** Incident records, diagnostic logs, containment markers, expert feedback transcripts, and repair proposal diffs.
- **Lifecycle Transitions:** `Detected → Contained → Under Investigation ↔ Awaiting Expert Input → Repair Proposed → Evaluating → Resolved / Closed`.
- **Incident Audit Trail:** Every status change, containment action, and expert comment produces an immutable audit record (ORY-070).

## Error and edge-case behavior

### Failure Handling
- **Conflicting Expert Responses:** If two domain experts submit contradictory corrections, the incident remains in an unresolved escalation state.
- **Repair Generation Timeout:** If automated patch synthesis fails, the incident is flagged for manual engineering review.
- **Uncontained Failure Cascade:** If repeated failures occur across multiple jobs, containment escalates automatically to version-level suspension.

## Observability and audit

### Telemetry and Diagnostics
- Tracks mean time to detection (MTTD), containment response latency, expert resolution turnaround, and repair success ratios.
- Comprehensive incident history viewable in Command Center without exposing employee private personal capture.

## Security and threat model

### Security and Safety Considerations
- **Poisoned Repair Attacks:** Repairs generated from malicious or compromised expert accounts cannot bypass regression evaluation gates.
- **Containment Denial:** High-severity containment commands bypass asynchronous queues and execute synchronously to halt damage immediately.
- **Scope Creep in Patches:** Synthesizer strictly constrains patch diffs to the affected sub-branch; unauthorized permission expansions are rejected.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.6: ORY-049–055, ORY-059](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* A vendor invoice with an unusual currency format causes an outcome verification failure in a live job; an incident is generated; a domain expert provides an explanatory correction.
  - *Expected Observable Result:* The incident engine contains future processing for that vendor; captures the expert explanation; compiles Candidate Version 1.0.1 and generates Scenario SC-CURR-01; simulation evaluation confirms the fix; no regression occurs; the patch advances to release governance.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Sub-second containment trigger execution upon detecting high-severity failure patterns.
- Efficient aggregation of thousands of case errors into consolidated incident clusters.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What clustering algorithms best group disparate runtime exceptions into unified incident entities?
- How should expert feedback capture balance structured UI forms against free-text explanations?
- What heuristic should determine whether a failure requires case-level, batch-level, or version-level containment?
- How can automated repair generation guarantee that a patch produces a minimal behavioral diff?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Incident records, failure containment triggers, expert correction collection, and repair proposal generation.
2. *Data ingress/egress:* Ingests verification mismatches and expert explanations; outputs containment commands and repair proposals.
3. *Versions/identities:* Incident ID, Affected Agent UUID, Case ID, Expert User ID, and Proposed Version UUID.
4. *Upstream failure:* If verifier is unavailable, unexpected runtime exceptions still trigger incident creation.
5. *Authority:* Domain experts provide corrections; domain owners approve rules; release governance approves repaired agent release.
6. *Testing without private details:* Tested via injected synthetic faults and automated incident lifecycle suites.
7. *Audit and duplicate prevention:* Incidents deduplicate repeated identical errors using signature hashes.
8. *Failure blast radius:* Incident engine failure pauses automated repair synthesis; manual containment remains available.
9. *v1.0 criteria:* Enables ORY-049, ORY-050, ORY-051, ORY-052, ORY-053, ORY-054, ORY-055, and ORY-059.
