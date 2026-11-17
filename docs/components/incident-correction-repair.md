# Incident Detection, Correction, and Repair Engine Component Specification

Status: Detailed technical specification — implementation pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§6.7–9, 8.5, 9.6](../../TECHNICAL.md) | [PRODUCT.md §§18–20, 28.4, 29.8; ORY-049–059](../../PRODUCT.md) | [ADR-0021](../adr/0021-incident-correction-and-repair-governance.md) | [ADR-0011](../adr/0011-identity-authority-and-approval-fencing.md) | [ADR-0012](../adr/0012-control-plane-transport-durability-and-inference.md) | [ADR-0018](../adr/0018-job-orchestration-and-scheduling.md) | [ADR-0019](../adr/0019-flight-simulator-isolation-and-evaluation-evidence.md) | [ADR-0020](../adr/0020-outcome-verification-and-evidence-finality.md)

### Core Responsibility
The Incident Detection, Correction, and Repair Engine converts execution failures, independent outcome verification mismatches, and safety anomalies into governed, authoritative incident records. It triggers synchronous containment to stop unsafe work, collects attributable human domain corrections without conflating explanations with company policy, coordinates bounded AI diagnosis and repair generation, registers stable regression and prevention requirements, and oversees candidate verification and canary rollout through final accountable resolution.

The pure deterministic decision core is implemented as `oryn-reliability-core`, embedded directly within the Rust Control Plane. State persistence and transactional outbox messaging leverage PostgreSQL 18 Row-Level Security (RLS), SQLx `TenantTransaction`, `domain_outbox`, `domain_delivery`, `domain_inbox`, and standard command replay. External workflows avoid external orchestrators (such as Temporal), third-party message brokers, standalone microservices, or competing authority evaluators.

### Owns
- The formal incident lifecycle (`open`, `triaged`, `contained`, `investigating`, `repair_proposed`, `testing`, `awaiting_approval`, `limited_release`, `monitoring`, `resolved`, `dismissed_non_issue`, `reopened`).
- Ingesting authoritative source failure facts and deduplicating deliveries by `(organization_id, producer, source_event_id)`.
- Incident correlation and grouping (`IncidentGroupV1`), computing deterministic canonical signatures over failure categories and execution contexts while preserving individual incident identities, evidence, and ownership.
- Determining failure blast radii and coordinating synchronous safety restrictions via `OrchestrationSafetyFenceV1` (`subject_kind: "incident_restriction"`).
- Collecting attributable written and desktop-dictated domain corrections (`CorrectionV1`, `ReviewedCorrectionV1`) and managing focused single-question micro-interviews (`CorrectionQuestionV1`).
- Coordinating bounded root-cause diagnoses (`DiagnosisV1`) and labeled hypothesis trees (`HypothesisV1`) under governed cloud inference.
- Synthesizing bounded candidate repair proposals (`RepairProposalV1`) with structural JSON-pointer scopes (`RepairScopeV1`) for agents, application adapters, and HUD assist plans.
- Defining immutable prevention specifications (`PreventionSpecificationV1`) and registering base-bound regression test requirements with [flight-simulator](flight-simulator.md).
- Tracking recovery metrics and canary rollout evidence (`RepairReleaseObservationV1`) for Release Governance canary evaluations.
- Encrypted custody, envelope DEK lifecycle, cryptographic key destruction, and retention barriers for sensitive incident payloads and audio transcripts.
- Authoritative incident, correction, and repair event emission to the Control Plane outbox.

### Consumes
- Authoritative outcome verification verdicts, mismatch descriptions, and readback discrepancy evidence from [outcome-verification](outcome-verification.md) (Contract 14).
- Runtime failure signals, unhandled execution exceptions, and panic reports from [agent-runtime](agent-runtime.md) and [job-orchestration](job-orchestration.md).
- Attributable domain corrections, reviewed explanations, and verified desktop audio dictation receipts delivered via [contribution-sync](contribution-sync.md) from [local-privacy-storage](local-privacy-storage.md) and [desktop-shell](desktop-shell.md).
- Verified principal identities, RBAC permissions (`incident.review`, `repair.approve`, `agent.edit`, `rule.approve`, `release.approve`), and organization response policies (`IncidentResponsePolicyV1`) from [identity-policy](identity-policy.md).
- Dependency relationships, active rules, and capability versions from [operational-graph](operational-graph.md).
- Governed reasoning (`text.reason`) and batch audio transcription (`incident.transcribe_correction`) via LiteLLM under [cloud-inference](../architecture/cloud-inference.md) (Contract 22).
- Candidate evaluation reports, scenario results, and test oracle evidence from [flight-simulator](flight-simulator.md) (Contract 8).
- Canary rollout progression states, traffic fractions, and restore signals from [release-governance](release-governance.md).

### Produces
- Authoritative incident records (`IncidentV1`), signal intake records (`IncidentSignalV1`), and correlation groups (`IncidentGroupV1`).
- Scoped synchronous containment commands (`SetIncidentRestrictionCommandV1`, `ClearIncidentRestrictionCommandV1`) dispatched to [job-orchestration](job-orchestration.md) and journaled to Identity.
- Proposed business rules (`ProposeRuleCommandV1`) and knowledge conflict reports (`KnowledgeConflictV1`) delivered to [operational-graph](operational-graph.md) (Contract 16).
- Candidate repair commands (`RepairCandidateCommandV1`) delivered to [agent-factory-ir](agent-factory-ir.md) (Contract 17).
- Prevention specifications (`PreventionSpecificationV1`) and stable regression requirements (`SimulationRegressionRequirementV1`) registered with [flight-simulator](flight-simulator.md).
- Outbox domain events (`incident.created`, `incident.changed`, `incident.contained`, `incident.reopened`, `incident.resolved`, `incident.group_changed`, `correction.requested`, `correction.submitted`, `correction.accepted`, `correction.conflicted`, `repair.proposed`, `repair.blocked`, `repair.validated`, `repair.monitoring_changed`).
- Incident query projections and evidence pages delivered to [command-center-analytics](command-center-analytics.md).

### Does Not Own
- Unilateral approval or publication of organizational business policy, compliance rules, or playbooks (owned exclusively by [operational-graph](operational-graph.md) and designated domain owners).
- Mutating active production agent versions, executable artifacts, or database rows in place (strictly prohibited; repairs yield immutable version candidates).
- Compiling, assembling, or signing agent IR candidates (owned exclusively by [agent-factory-ir](agent-factory-ir.md)).
- Running evaluation attempts, test benchmarks, or executing test oracles (owned by [flight-simulator](flight-simulator.md) and [outcome-verification](outcome-verification.md)).
- Approving production promotions, canary progression, or restoring previous agent versions (owned by [release-governance](release-governance.md)).
- Granting principal execution authority or overriding separation of duties (owned by [identity-policy](identity-policy.md)).

### Boundary Requirement
Containment actions must execute synchronously within the database transaction and target the smallest safe blast radius (case, job, connection, schedule, agent version, operation, capability, rule, worker, or organization) without unnecessarily stopping unrelated work. Model-generated root causes must be strictly labeled as unverified hypotheses until supported by verified facts. Attributable human corrections serve as evidence for candidate repairs, not automatic enterprise policy. Repair candidates must be bounded by explicit structural scopes and pass rigorous regression evaluation before consideration for release.

### Component Acceptance Standards
Component implementation and operational conformance adhere strictly to PRODUCT standards:
- **ORY-049:** Incident Creation on Failure — Every verification mismatch or important unexpected state atomically creates an incident linking agent, case, severity, and evidence.
- **ORY-050:** Hypothesis vs. Fact Separation — The incident record strictly distinguishes verified factual observations from AI-generated diagnostic hypotheses.
- **ORY-051:** Critical Containment & Escalation — Critical incidents halt affected operations immediately and notify assigned team owners and security reviewers.
- **ORY-052:** Expert Correction Governance — Authorized experts can explain a correction without automatically converting their explanation into authoritative company policy.
- **ORY-053:** Exception Rule Review — Domain owners must explicitly review and approve, reject, or request evidence for any proposed business rule or exception.
- **ORY-054:** Linked Regression Generation — Accepted corrections automatically enqueue proposed repairs and linked regression test requirements.
- **ORY-055:** Regression Blocking — Candidate repairs that fix the target bug but introduce any known applicable regression cannot be released.
- **ORY-056:** Canary Evidence & Monitoring — Approved repairs roll out to restricted cohorts with visible test evidence and continuous recovery monitoring.
- **ORY-057:** Non-Rollback of External Effects — Restoring a previous agent version or clearing a fence never claims to roll back external application mutations already committed.
- **ORY-058:** Preauthorized Stage 5 Gating — Only narrowly preauthorized Tier 0/1 changes can be automatically released; all other changes require explicit human governance approval.
- **ORY-059:** Grouping Without Member Loss — Repeated failures are grouped intelligently without merging records, obscuring underlying case lists, or dropping independent evidence.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§18–20, 28.4, 29.8; ORY-049–059](../../PRODUCT.md))
- **Authoritative Fact Ingestion (ORY-049):** Ingests signals from outcome verification, agent runtime, orchestrator, and operators. Verifier mismatches keyed by authoritative `request_id` guarantee that replayed deliveries return the original incident without duplicate creation.
- **Strict Hypothesis Tagging (ORY-050):** Observed execution traces, readback discrepancies, and error codes are persisted as `Observed Fact`. Root-cause analyses from cloud inference are persisted as `Hypothesis` with review state `unverified`, `supported`, or `rejected`. Only human reviewers can elevate a hypothesis to supported based on evidence.
- **Synchronous Containment (ORY-051):** High and Critical incidents trigger immediate containment fences committing within the same `TenantTransaction` as signal admission. Durable restriction commitment is sub-second; connected workers acknowledge safe boundaries within <=2 seconds. Unacknowledged workers remain in an explicit pending state rather than falsely assumed stopped.
- **Attributable Corrections (ORY-052):** Domain experts provide corrections via web forms or verified desktop voice dictation. Reviewers accept corrections as evidence for proposed repairs, not organizational policy. Reusable proposals require explicit upstream owner approval.
- **Owner Review of Proposed Rules (ORY-053):** Proposed business rules or policy changes emit `ProposeRuleCommandV1` to Operational Graph. Contradictory expert explanations trigger `KnowledgeConflictV1`, restricting execution of affected branches until owner adjudication.
- **Automated Repair & Regression Pipeline (ORY-054):** Accepted reusable corrections automatically enqueue proposed agent plan diffs (`RepairProposalV1`) and linked regression requirements (`SimulationRegressionRequirementV1`) with original and material nearby variations.
- **Zero-Tolerance Regression Gate (ORY-055):** A candidate repair version cannot be released if any known applicable scenario in the regression suite regresses, regardless of whether the new failure is classified Critical, High, or Medium.
- **Rollout Recovery & Canary Monitoring (ORY-056):** Limited release progresses under Release Governance canary rules across explicit named cohorts. The incident engine collects authoritative `RepairReleaseObservationV1` metrics binding `release_ref`, `observation_ref` (the exact immutable `RolloutObservationV1` revision and digest), `new_incident_count`, `new_incident_refs` (first 32 unique refs in canonical order), `incident_refs_complete`, and `incident_manifest_sha256` linking to the complete observation manifest. Recovery criteria derive from the complete observation and incident obligations; incident closure remains an accountable human decision (`ResolveIncidentCommandV1`) rather than an automatic side effect of observation thresholds.
- **Truthful Recovery Limits (ORY-057):** Clearing a fence or deploying a repair restores future dispatch; it cannot undo committed external effects. Synchronous safety containment fences (`OrchestrationSafetyFenceV1`) act strictly as forward barriers against future job admission and future action dispatches at safe step boundaries. External mutations already committed or in flight cannot be recalled or rolled back over the network; unresolved effects remain explicitly flagged until reconciled by `JobOrchestrationPort::reconcile`.
- **Governed Discretionary Autonomy (ORY-058):** Background diagnosis is disabled by default and requires opt-in organization policy. Automated Stage 5 release is restricted to Tier 0/1 preauthorized changes.
- **Group Correlation Without Data Loss (ORY-059):** Repeated incidents matching a canonical signature are correlated into an `IncidentGroupV1`. Each incident preserves its own evidence, ownership, audit history, and lifecycle disposition.

### Failure Classification Categories
The engine classifies failures into the eleven canonical snake-case categories defined in PRODUCT §18.5:
1. `interface_drift`: Upstream application UI or API structural alterations.
2. `data_document_format_drift`: Unexpected schema, date, currency, or numerical representations.
3. `missing_business_rule`: Novel business situations lacking an encoded decision path.
4. `changed_business_policy`: Outdated organizational rules contradicted by current expectations.
5. `reasoning_decision_failure`: Faulty LLM plan selection or invalid tool dispatch.
6. `external_service_failure`: Outages, timeouts, or connection failures in third-party systems.
7. `permission_authorization_failure`: Missing credentials, expired OAuth tokens, or RBAC denials.
8. `inconsistent_source_data`: Contradictory inputs across authoritative business systems.
9. `duplicate_or_partial_submission`: Idempotency collisions or incomplete multi-step transactions.
10. `verification_failure`: Independent readback contradiction or missing postconditions.
11. `unknown`: Unclassified anomalies requiring investigation.

### Deterministic Severity Floors
Severity is determined by deterministic policy floors:
- `critical`: Unauthorized consequential actions, prohibited operations, privacy/security breaches, plausible unauthorized mutations with uncertain impact.
- `high`: Incorrect verified business outcomes, repeated unhandled uncertainty conditions, write failures in core workflows.
- `medium`: Isolated recoverable errors, transient external service failures, recoverable validation rejections.
- `low`: Non-correctness visual drift, non-blocking telemetry gaps, advisory warnings.

Raising severity requires `incident.review`. Lowering High requires a named owner and recorded justification. Lowering Critical additionally requires Security review sign-off.

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #14:** Ingests verification verdicts and readback discrepancies from [outcome-verification](outcome-verification.md). Mismatches emit signals keyed by verifier `request_id`, ensuring idempotent delivery.
- **Contract Reference #15:** Internally formulates failure classifications, links evidence metadata, and tracks canonical group signatures.
- **Contract Reference #16:** Delivers accepted domain corrections and proposed rule modifications to [operational-graph](operational-graph.md) via `ProposeRuleCommandV1`. If expert explanations conflict, emits `KnowledgeConflictV1` to fence affected decision points.
- **Contract Reference #18 ([command-center-analytics](command-center-analytics.md)):** Emits `ReliabilityReportingFactV1` (`incident.reliability-reporting-fact.v1`) via `ReportingSourcePort`. Supplies incident lifecycle timestamps (`opened_at`, `recovered_at`), severity classifications, incident group fingerprints, containment effects, and recovery durations for Mean Time to Recover (MTTR) evaluation and operational reliability rollups.
- **Contract Reference #17:** Delivers candidate repair proposals and regression requirements to [agent-factory-ir](agent-factory-ir.md) and [flight-simulator](flight-simulator.md). `RepairCandidateCommandV1` accepts `{base_agent_version_id, expected_draft_revision, incident_refs, repair_ref, regression_requirement_refs, replacement}`. Stale base versions reject with 409 `FACTORY_REVISION_CONFLICT`. Factory atomically binds `AgentRepairContextV1` and upon compilation commits `RepairCandidateBindingV1`.
- **Contract Reference #22:** Consumes governed cloud reasoning (`text.reason`) via LiteLLM for `incident_diagnose` (producing `incident.diagnosis.v1`) and `repair_propose` (producing `repair.patch.v1`), and batch audio transcription (`incident.transcribe_correction` producing `incident.correction-transcript.v1`).

### Rust Domain Ports

The Control Plane exposes the engine via `IncidentRepairPort`:

```rust
use std::future::Future;
use crate::types::*;

pub trait IncidentRepairPort: Send + Sync {
    fn ingest<'a>(
        &'a self,
        tx: &'a mut TenantTransaction,
        principal: &'a VerifiedPrincipal,
        signal: IncidentSignalV1,
    ) -> impl Future<Output = Result<IncidentV1, IncidentErrorV1>> + Send + 'a;

    fn apply<'a>(
        &'a self,
        tx: &'a mut TenantTransaction,
        principal: &'a VerifiedPrincipal,
        command: IncidentCommandV1,
    ) -> impl Future<Output = Result<IncidentCommandResultV1, IncidentErrorV1>> + Send + 'a;

    fn query<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        query: IncidentQueryV1,
    ) -> impl Future<Output = Result<IncidentPageV1, IncidentErrorV1>> + Send + 'a;
}
```

`IncidentCommandV1` is a closed tagged union:
- `Transition(TransitionIncidentCommandV1)`
- `SetRestriction(SetIncidentRestrictionCommandV1)`
- `ClearRestriction(ClearIncidentRestrictionCommandV1)`
- `SubmitCorrection(SubmitCorrectionCommandV1)`
- `ReviewCorrection(ReviewCorrectionCommandV1)`
- `AnswerQuestion(AnswerCorrectionQuestionCommandV1)`
- `RequestDiagnosis(RequestDiagnosisCommandV1)`
- `ProposeRepair(ProposeRepairCommandV1)`
- `ReviewRepair(ReviewRepairCommandV1)`
- `Resolve(ResolveIncidentCommandV1)`
- `Dismiss(DismissIncidentCommandV1)`
- `DecideGroupMembership(DecideGroupMembershipCommandV1)`

## Trust and deployment boundaries

### Process and Boundary Model
- **Deployment Topology:** Embedded directly within the multi-tenant Rust Control Plane backend service (`oryn-reliability-core`). Pure decision logic is decoupled from database and inference I/O.
- **Tenant Isolation:** Enforced via PostgreSQL 18 Row-Level Security (RLS) on all tenant tables using `oryn.organization_id`. Handlers execute within `TenantTransaction` with non-BYPASSRLS application roles.
- **Hypothesis Separation:** Machine learning outputs are stored as `HypothesisV1` records flagged `unverified`. Factual execution events are stored as `OwnerRecordRefV1`.
- **Zero In-Place Mutation:** Running agent definitions, released code, and production database rows are immutable. Repairs generate candidate drafts that must be compiled, attested, evaluated, and approved through release governance.
- **Private Data Containment:** Raw audio, full meeting transcripts, and unsanitized screen captures reside strictly within client-side encrypted local storage (`oryn-privacy-helper`). Only sanitized, reviewed text wrapped in `ReviewedCorrectionV1` enters Control Plane custody.

## Internal architecture

### Logical Submodules
1. **IncidentIntake:** Deduplicates and validates incoming `IncidentSignalV1` records. Determines initial severity floors, creates `IncidentV1`, and commits initial synchronous containment within the ingest transaction.
2. **IncidentCorrelator:** Calculates canonical SHA-256 group signatures across failure category, agent behavior digest, branch/node identity, adapter version, operation ID, governing rule version, and normalized error code. Correlates matching incidents into `IncidentGroupV1`.
3. **ContainmentCoordinator:** Evaluates containment targets and scopes. Emits synchronous commands to `orchestration_incident_restriction` and `orchestration_safety_fence`, taking the Identity authority guard before adapter guards.
4. **CorrectionCoordinator:** Manages `CorrectionV1` submissions, assigns expert micro-interviews (`CorrectionQuestionV1`), and verifies device review attestations on incoming `ReviewedCorrectionV1` payloads.
5. **DiagnosisCoordinator:** Assembles authorized failure context and verified successful peer examples. Dispatches bounded, non-streaming `text.reason` requests to LiteLLM under purpose `incident_diagnose`.
6. **RepairCoordinator:** Validates `RepairScopeV1` structural boundaries, ensuring proposed JSON pointers stay within permitted sub-trees. Enqueues Factory repair commands and Simulator prevention specifications.
7. **IncidentQuery:** Serves paginated, cursor-bounded incident views, group listings, and evidence metadata to Command Center, respecting team remits and confidentiality boundaries.

## State and lifecycle

### Incident Lifecycle State Machine
Wire statuses map directly to PRODUCT §18.4 labels:
- `open`: Initial state upon fact ingestion. Containment may already be active.
- `triaged`: Responsible team and initial severity confirmed.
- `contained`: Synchronous safety fences actively restricting affected blast radius.
- `investigating`: Diagnostic evidence gathering and hypothesis formulation in progress.
- `repair_proposed`: Candidate behavioral patch or exception rule generated.
- `testing`: Candidate repair compiled and undergoing Flight Simulator evaluation.
- `awaiting_approval`: Evaluation passed; awaiting governance or owner sign-off.
- `limited_release`: Canary rollout active under Release Governance monitoring.
- `monitoring`: Post-rollout recovery criteria under observation.
- `resolved`: Accountable owner confirmed recovery or accepted containment disposition.
- `dismissed_non_issue`: Justified non-issue closure with recorded rationale.
- `reopened`: Recurrence or new evidence discovered after resolution or dismissal.

### Resolution Dispositions
Closing an incident requires `ResolveIncidentCommandV1` with an explicit disposition:
- `recovery_confirmed`: Authoritative monitoring fixtures confirm zero regressions, required case volume, and satisfied criteria. Fences are cleared.
- `accepted_containment`: The organization consciously retains documented safety restrictions rather than repairing root-cause code. Requires accountable owner, documented operational consequences, and optional review deadline. Critical accepted containment additionally mandates Security sign-off.

### Evidence Retention and Cryptographic Erasure
- **Per-Immutable-Value Envelope Encryption:** Sensitive explanation bodies, interview transcripts, and diagnosis details are encrypted using AES-256-GCM with fresh 96-bit nonces. Per-artifact Data Encryption Keys (DEKs) are wrapped by dedicated, independently deletable Vault Transit wrapping keys in the Expiring Payload Vault (`disable_upsert=true`).
- **Canonical AAD Binding:** Additional Authenticated Data binds canonical bytes `UTF8("oryn.payload-key-binding.v1") + LF + RFC8785(binding)` containing `organization_id`, `incident_id`, `subject_ref`, `key_ref`, `custody_generation`, and purpose.
- **Retention Schedule:**
  - Earliest source expiry.
  - 7 days following terminal disposition (`resolved` or `dismissed_non_issue`).
  - 30 days without semantic progress.
- **Two-Phase Destruction:** Upon reaching the deadline, the coordinator first commits an irreversible `PayloadKeyFenceV1 { state: "destroy_pending" }` to the independent journal, deletes the Transit key in Expiring Payload Vault, and commits `state: "destroyed"`. Subsequent read attempts return HTTP 410 (`INCIDENT_EVIDENCE_UNAVAILABLE` / `INFRA_CUSTODY_UNAVAILABLE`).
- **Regional Custody Loss Exception:** Regional loss or unrecoverable quorum loss of the Expiring Payload Vault permanently loses affected evidence payload access. The old generation is marked `lost` and future payloads allocate a fresh generation; immutable content-free audit logs and RFC 8785 hashes persist for 24 months. Database restores cannot decrypt shredded or lost data.

## Error and edge-case behavior

### Failure Handling Protocols
- **Duplicate Signal Delivery:** Replayed signal with identical content returns the existing incident (200 OK). Conflicting payload under the same source key returns 409 `INCIDENT_SOURCE_CONFLICT`.
- **Worker Containment Acknowledgment Lag:** If database fence commits but worker fails to acknowledge within 2 seconds, status reflects `acknowledgment_pending`. Dispatch remains blocked; external effects are truthfully marked unresolved.
- **Contradictory Domain Corrections:** Two credible experts submitting conflicting explanations triggers `KnowledgeConflictV1` in Operational Graph. Automated execution halts on affected branches; no majority voting or AI model selects the winner.
- **Repair Scope Violations:** If generated repair diff touches JSON pointers outside `RepairScopeV1` or weakens verification gates, validation rejects with 409 `INCIDENT_REPAIR_SCOPE_INVALID`.
- **Stale Factory Head:** Submitting a repair against an outdated draft revision returns 409 `FACTORY_REVISION_CONFLICT`. Proposals are marked `superseded` rather than silently rebased.
- **Regression Detection:** Any regression detected during Flight Simulator evaluation immediately transitions the repair to `rejected` or `changes_requested`, blocking advancement to Release Governance.
- **Inference Service Outage:** Failure of cloud inference returns 503 `INCIDENT_DEPENDENCY_UNAVAILABLE` for diagnosis or repair generation, leaving deterministic containment and incident records fully operational.

## Observability and audit

### Operational Telemetry
The engine records operational metrics without exposing employee surveillance data:
- Mean Time to Detection (MTTD) from failure occurrence to incident creation.
- Durable containment commit latency (target: sub-second).
- Worker safe-boundary acknowledgment lag (target: <=2 seconds).
- Turnaround time for expert micro-interviews.
- Ratio of repair attempts passing simulation on first compilation.
- Canary recovery progress, mismatch ratios, and recurrence rates.

### Audit Immutability
All status transitions, severity adjustments, containment commands, and review decisions commit atomically to `incident_history` within the caller's transaction. Every entry includes `organization_id`, `incident_id`, `event_id`, `revision`, `actor_ref`, `causation_ref`, `before_status`, `after_status`, `reason_ref`, and `occurred_at`.

## Security and threat model

### Threat Vectors and Mitigations
- **Tampered Correction Ingestion:** Malicious corrections submitted to poison agent memory cannot become policy. Every correction undergoes reviewer evidence acceptance (`ReviewCorrectionCommandV1`), and procedural changes require domain owner `ApproveRuleCommandV1`.
- **Containment Denial:** High/Critical containment commands execute synchronously and take the exclusive tenant containment guard, preventing concurrent action execution from racing past the fence.
- **Privilege Escalation via Scope Expansion:** `RepairScopeV1` enforces exact permitted node IDs and JSON pointers. Permissions, roles, and allowed external connections cannot be broadened by a repair patch.
- **Voice Spoofing & Unauthorized Audio Recording:** Desktop dictation requires native held input, active foreground window, and independent `incident_correction_audio` consent. Frames use distinct `ORYC` tags. System/loopback audio is rejected.
- **Cross-Tenant Leakage:** Enforced by PostgreSQL RLS. Cross-tenant references in commands or signals fail closed with 404/403 concealment.

## Test strategy

### Verification & Conformance Scenarios
- **Authoritative Ingestion & Dedup:** Ingest identical verifier signal twice; verify exactly one incident created and replayed without duplicate side effects. Ingest same key with different payload; verify `INCIDENT_SOURCE_CONFLICT`.
- **Synchronous Containment:** Verify `SetIncidentRestrictionCommandV1` atomically inserts `orchestration_incident_restriction` and journals `OrchestrationSafetyFenceV1` with `subject_kind: "incident_restriction"`.
- **Desktop Voice Dictation Gate:** Verify capture rejects without explicit `incident_correction_audio` consent even if meeting audio consent is present. Verify hold expiration after 300 ms.
- **Cycle-Free Repair Pipeline:** Register `PreventionSpecificationV1` and `SimulationRegressionRequirementV1` without candidate target; verify Factory binds candidate during asynchronous guarded compilation; verify Simulator validates exact candidate binding.
- **Regression Enforcement:** Inject passing target scenario alongside a regressing known case; verify repair release is strictly blocked.
- **Cryptographic Erasure Barrier:** Advance time past retention deadline; verify payload DEK destroyed and subsequent reads return HTTP 410.

## Performance and operations

### Operational Boundaries
- Durable containment fence insertion commits in <100 ms under normal database loads.
- Active incident queue indexes optimize queries by `(organization_id, responsible_team_id, status, severity, updated_at, incident_id)`.
- Incident signal deduplication uses unique index on `(organization_id, producer, source_event_id)`.
- Reasoning calls respect strict tenant concurrency ceilings (maximum 2 concurrent reasoning jobs per tenant shared across diagnosis and repair).
- Audio transcription requests are limited to 1 in-flight request per device and 2 per tenant.

## Architecture decisions and open questions

### Resolved Architecture Commitments (ADR-0021)
1. **Independent Incidents vs. Correlation Groups:** Incidents represent distinct factual failures with independent ownership and evidence. Incident groups provide correlation views over shared signatures without merging underlying records.
2. **Synchronous Scoped Containment:** Containment fences execute synchronously in the Control Plane database transaction, logging to the Identity journal. Truthful acknowledgment separation distinguishes durable database fences from connected worker boundary acknowledgments.
3. **Stable Regression Specifications:** Regression requirements and prevention specifications are registered with the base target before candidate creation, breaking the circular dependency between Factory compilation and Simulator requirements. Candidate binding occurs atomically at finalization.
4. **Correction Evidence vs. Policy Authority:** Human corrections provide case-level evidence for repair synthesis. Policy alterations require separate Operational Graph rule proposals and domain owner approval.
5. **Desktop Dictation Isolation:** Online correction audio uses dedicated `incident_correction_audio` consent, distinct `ORYC` native audio frames, and volatile memory spooling when personal retention is disabled.

### Open Operational Questions
- What dynamic sampling thresholds best balance canary confidence against rollout latency for low-volume enterprise agents?
- How should multi-expert consensus scoring evolve when an incident spans overlapping domain boundaries?
