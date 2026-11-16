# 0021. Incident, Correction, and Repair Governance

Date: 2026-11-15

## Status

Accepted

Amends:
- [0011-identity-authority-and-approval-fencing.md](0011-identity-authority-and-approval-fencing.md) (Adds `IncidentResponsePolicyV1` to `OrganizationPolicyV1`, `incident_restriction` authority recovery journaling, and `incident_correction_audio_permitted` to `CapturePolicyLeasePayloadV1`).
- [0012-control-plane-transport-durability-and-inference.md](0012-control-plane-transport-durability-and-inference.md) (Adds `IncidentRepairCoordinator`, 18 closed incident/correction/repair/containment/group routes, `incident.transcribe_correction` operation, and 16 `INCIDENT_*` error codes).
- [0014-operational-graph-knowledge-and-rule-governance.md](0014-operational-graph-knowledge-and-rule-governance.md) (Contradictory credible corrections create `ReportConflictCommandV1` / `KnowledgeConflictV1` restricting branches via `KnowledgeEligibilitySnapshotV1`; rule changes require owner `ApproveRuleCommandV1`).
- [0015-agent-factory-ir-and-candidate-qualification.md](0015-agent-factory-ir-and-candidate-qualification.md) (Narrows `incident_refs` and `repair_ref` in `RepairCandidateCommandV1`; binds immutable `AgentRepairContextV1` at draft creation; adds `repair_bindings` to `CandidateEvaluationBundleV1`).
- [0016-application-adapter-qualification-and-dispatch-boundaries.md](0016-application-adapter-qualification-and-dispatch-boundaries.md) (`AdapterChangeProposalV1` consumption by maintainers into signed first-party pack authoring; synchronous containment enforcement).
- [0017-agent-runtime-execution-and-recovery.md](0017-agent-runtime-execution-and-recovery.md) (Synchronous containment checking at dispatch and action consumption; connected workers acknowledge safe boundaries within ≤ 2s).
- [0018-job-orchestration-and-scheduling.md](0018-job-orchestration-and-scheduling.md) (Adds `incident_restriction` subject kind to `OrchestrationSafetyFenceV1`; synchronous selector containment storage `orchestration_incident_restriction`; `SetIncidentRestrictionCommandV1`).
- [0019-flight-simulator-isolation-and-evaluation-evidence.md](0019-flight-simulator-isolation-and-evaluation-evidence.md) (Removes `candidate_target` from stable `SimulationRegressionRequirementV1`; narrows `incident_refs` and `repair_ref` to incident-owned schemas; adds `SimulationScenarioRefV1` and `PreventionSpecificationV1`).
- [0020-outcome-verification-and-evidence-finality.md](0020-outcome-verification-and-evidence-finality.md) (Authoritative outcome evaluation feeding `RepairReleaseObservationV1`; immutable verifier verdicts cannot be rewritten by AI diagnosis or models).

Amended by:
- [0022-release-eligibility-and-rollout-governance.md](0022-release-eligibility-and-rollout-governance.md) (Amends `RepairReleaseObservationV1` with `observation_ref`, `new_incident_count`, `incident_refs_complete`, and `incident_manifest_sha256`; requires complete observation provenance and qualifies containment claims).

## Context

Enterprise autonomous agents encounter operational anomalies, verification mismatches, policy deviations, and unexpected external application drift. Without a formal, coordinated governance framework, automated reliability systems suffer from critical architectural failures:
1. **Eventual-Consistency Containment Delays:** Delegating emergency stops to background event buses, streaming message queues, or AI correlation models allows rogue or failing workers to continue committing irreversible external mutations during the detection-to-enforcement window.
2. **Creation-Order Deadlocks in Regression Verification:** When regression requirements require candidate identities before compilation, but compilation requires regression requirements before admitting candidate drafts, the system enters an impossible circular dependency.
3. **Unchecked Policy Hallucination from Human Corrections:** Treating individual employee or expert explanations as immediate autonomous rules bypasses organizational policy review, injecting unverified exceptions into production knowledge bases.
4. **False Claims of External Rollback:** Asserting that a containment fence rolls back external side effects conceals the uncertainty of in-flight network requests that have already crossed vendor boundaries.
5. **Data Retention Liabilities in Failure Evidence:** Retaining sensitive transaction payloads, screen captures, and interview explanations indefinitely for audit purposes violates privacy commitments, while premature destruction obliterates diagnostic evidence.

## Decision

### 1. Independent Incidents versus Heuristic Correlation Groups
- **Authoritative Incident Individuality:** Every observed failure, mismatch, or abnormal outcome is persisted as an independent, immutable `IncidentV1` record with cryptographic source provenance and verifiable evidence references. Incidents are never silently merged, discarded, or overwritten.
- **Explainable Grouping Projections:** Heuristic or embedding-based similarity creates append-only `IncidentGroupV1` projections. Groups provide operational visibility and triage summarization; they never absorb individual incidents or grant blanket closures. Resolving an incident group requires independent, verified resolution of every underlying constituent incident.

### 2. Orchestration/Identity-Owned Synchronous Scoped Restrictions with Truthful External-Effect Uncertainty
- **Synchronous Containment Enforcement:** Containment restrictions (`SetIncidentRestrictionCommandV1`) execute synchronously through Job Orchestration and Identity, persisting selectors in `orchestration_incident_restriction` with durable journaling in `orchestration_safety_fence`. Commitment occurs with sub-second database durability.
- **Zero AI Inference in Safety Path:** Containment evaluation is strictly deterministic. It never waits for cloud model reasoning, notification delivery, worker acknowledgment, or correlation clustering.
- **Ten Bounded Target Scopes:** Restrictions apply the smallest proven safe blast radius across ten explicit targets: `case`, `job`, `schedule`, `agent_version`, `connection`, `operation`, `capability`, `rule`, `worker`, or `organization`.
- **Worker Safe-Boundary Acknowledgment:** Connected workers acknowledge safe boundaries within ≤ 2 seconds; unacknowledged workers remain in `acknowledgment_pending`, never falsely assumed stopped.
- **Truthful External Side-Effect Tracking:** Containment stops new dispatches and write actions immediately. However, requests already transmitted to external vendor networks cannot be recalled by local database fences; they are tracked as unresolved until confirmed or reconciled through `JobOrchestrationPort::reconcile`.

### 3. Stable Regression Requirements plus Finalization-Time Candidate Binding
- **Cycle-Free Creation Order:** `SimulationRegressionRequirementV1` is registered stably against the base agent target, incident lineage, and repair lineage. The circular `candidate_target` field is completely eliminated from the requirement schema.
- **Prevention Specifications:** Incident prevention is formalized through immutable `PreventionSpecificationV1` records referencing executable Simulator scenarios, allowing `original_scenario_refs` to be empty when historical non-deterministic failures cannot be replayed verbatim.
- **Finalization-Time Candidate Binding:** Factory accepts `RepairCandidateCommandV1` into draft revisions accompanied by immutable `AgentRepairContextV1`. Asynchronous compilation includes this context in compile-attempt fingerprints. Upon guarded finalization, Factory commits the candidate and atomically records `RepairCandidateBindingV1`, surfaced to Simulator via `CandidateEvaluationBundleV1.repair_bindings` without altering executable bytecode digests.
- **Strict Regression Rejection:** Simulator evaluates repairs against full regression suites, original/prevention obligations, and at least 5 nearby variations. In accordance with `PRODUCT.md` §28.4, release is rejected if any known applicable case regresses.

### 4. Necessary Architectural Consequences
- **Attributable Corrections vs. Policy Authority:** Subject-matter expert corrections (`CorrectionV1`) capture immutable, attributable learning types (`mistake_correction`, `legitimate_exception`, etc.). Accepted reusable corrections trigger proposed repairs; they never directly create business rules or modify Graph policies. Upstream rule amendments require explicit domain owner approval via `ProposeRuleCommandV1` and `ApproveRuleCommandV1`. Contradictory explanations report material Graph conflicts (`ReportConflictCommandV1`) rather than relying on automated votes or LLM arbitration.
- **Expiring Sensitive Payloads vs. Content-Free Audit Split:** Sensitive incident explanations, customer values, interview transcripts, and diagnostic bodies (`incident_payload`) are encrypted with AES-256-GCM per-payload DEKs wrapped by Vault. DEKs are destroyed at earliest source deadline, 7 days post-terminal disposition (`recovery_confirmed` or `accepted_containment`), or 30 days without semantic progress, establishing a cryptographic barrier against resurrection. Content-free operational audit records (`incident_signal`, `incident_head`, `incident_revision`, `incident_history`) persist for 24 months.
- **Dedicated Desktop Correction Audio Dictation:** Desktop dictation uses Privacy Helper's `CorrectionMicrophoneSource` mode over binary `ORYC` v1 frames (16-kHz mono PCM, signed 16-bit LE, ≤ 3,200 bytes per 100 ms), distinct from meeting `'ORYA'`. Dictation is governed by employee category consent `incident_correction_audio`, signed lease `incident_correction_audio_permitted`, native push-to-talk hold heartbeats (`RenewCorrectionHold`), and volatile RAM ceilings (max 10s / 30s lifetime when personal retention is disabled). It fails closed if a meeting capture starts.

## Consequences

### Positive
- Sub-second containment guarantees zero autonomous mutation escape upon high-severity incident detection.
- Complete elimination of circular dependencies between Simulator regression requirements and Factory compilation.
- Strict separation of duties between human fact explanation, domain policy ownership, and candidate compilation.
- Truthful tracking of in-flight external side effects without false rollback claims.
- Cryptographic data destruction reconciles GDPR/CCPA privacy rights with enterprise audit compliance.

### Negative
- Requires maintaining dual selector tables (`orchestration_incident_restriction` and `orchestration_safety_fence`) during transactional admission checks.
- Repair evaluation requires running full regression suites plus 5 nearby variations, increasing Simulator compute requirements.
- Desktop dictation requires native push-to-talk coordination and dual audio framing (`ORYC` vs. `ORYA`).
