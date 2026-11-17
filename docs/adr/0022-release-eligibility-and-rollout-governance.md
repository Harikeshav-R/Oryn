# 0022. Release Eligibility and Rollout Governance

Date: 2026-11-16

## Status

Accepted — detailed technical specification complete, implementation pending

Amends:
- [0009-local-context-guidance-and-assist-boundaries.md](0009-local-context-guidance-and-assist-boundaries.md) (Adds `SignedAssistReleaseEligibilityV1` requirement to assist plan eligibility, adds release identity fields `release_id`, `release_cohort_id`, `release_eligibility_generation`, and `plan_sha256` to Identity `ExecutionContextV1` assist arm).
- [0010-contribution-delivery-and-guidance-sync.md](0010-contribution-delivery-and-guidance-sync.md) (Requires signed release eligibility envelope preserved in publisher bundles, online generation verification, and dual-signature verification by HUD).
- [0011-identity-authority-and-approval-fencing.md](0011-identity-authority-and-approval-fencing.md) (Replaces universal dual-remit wording with product-minimum remits; adds formal consumption seam `consume_governance`, `GovernanceConsumptionV1`, expiring `ReleaseAutomationPolicyV1` on `OrganizationPolicyV1`, journal kinds `release_changed` and `release_preauthorization_changed`, and release after-images).
- [0012-control-plane-transport-durability-and-inference.md](0012-control-plane-transport-durability-and-inference.md) (Adds release routes, `ReleaseCoordinator`, `durability_pending` commit protocol, and 20 `RELEASE_*` error codes).
- [0014-operational-graph-knowledge-and-rule-governance.md](0014-operational-graph-knowledge-and-rule-governance.md) (Signed assist release envelope verification before publication; live knowledge guard and dependency registration at release gate).
- [0015-agent-factory-ir-and-candidate-qualification.md](0015-agent-factory-ir-and-candidate-qualification.md) (Decouples Factory compilation `requested_stage` ceiling from granted release stage; candidate promotion preserves immutable bytecode hash; protected diff projection for automated repair classifier).
- [0018-job-orchestration-and-scheduling.md](0018-job-orchestration-and-scheduling.md) (Updates `ReleaseJobAdmissionPort::resolve` with `ReleaseJobAdmissionRequestV1`; adds required `cohort_id` to preview and schedule definitions; adds `release_cohort` subject kind to `OrchestrationSafetyFenceV1`; synchronous evidence sequence head).
- [0019-flight-simulator-isolation-and-evaluation-evidence.md](0019-flight-simulator-isolation-and-evaluation-evidence.md) (Maintains Simulator report `requested_stage: [3, 4]`; Stage 5 release is a composite governance check reading Stage 4 report plus repair bindings/obligations; clarifies renewable 30-day adapter qualification validity vs. waiting periods).
- [0021-incident-correction-and-repair-governance.md](0021-incident-correction-and-repair-governance.md) (Authoritative complete `RolloutObservationV1` provenance for `RepairReleaseObservationV1`; adds `observation_ref`, `new_incident_count`, `incident_refs_complete`, and `incident_manifest_sha256`; containment fence integration with named cohort fences).

## Context

Enterprise autonomous systems require strict authorization, progression, and safety boundaries before allowing agent candidates or assist plans to interact with production business systems. Previous designs contained critical tensions and ambiguities across six architectural dimensions:
1. **Percentage-Based Routing vs. Deterministic Cohort Isolation:** Floating canary percentages (e.g., "10% canary") create probabilistic admission where concurrent jobs or overlapping selectors silently route work across mismatched versions, making deterministic audit and side-effect attribution impossible.
2. **Supervised Streak Integrity vs. Completion-Order Exploits:** Allowing supervised streaks to be counted by out-of-order verification completion allows concurrent pending, failed, or cancelled work to be bypassed by cherry-picking early successes, undermining Stage 4 autonomy proof.
3. **Inherited Readiness vs. Exact-Behavior Verification:** Permitting ordinary material replacement candidates to inherit historical supervised streaks from earlier agent versions introduces unproven code directly into autonomous execution without empirical safety proof.
4. **Universal Dual-Approval Friction vs. Product Remit Realities:** Imposing blanket dual-approval (requiring both Workflow Owner and Security Officer) across all releases creates operational paralysis for ordinary low-risk operational changes while diluting Security focus.
5. **Rollback Misconceptions vs. Truthful Version Restoration:** Confusing deployment version reversion with business rollback conceals external mutations committed by replaced candidates and risks resurrecting obsolete or unverified predecessors.
6. **Assist Release Integrity vs. Offline Guidance Desynchronization:** Permitting client HUDs to execute assist plans based solely on Graph knowledge publication allows unvetted or locally cached guidance to trigger unauthorized production actions.

## Decision

### 1. Named Cohorts and Strict Single-Version Admission
- **Deterministic Cohort Binding:** All rollout exposure is partitioned into named `ReleaseCohortV1` structures bound to specific teams, application connection revisions, vendor accounts, record types, selection capabilities, and operation bindings. Percentage routers are eliminated.
- **Unambiguous Admission:** A Job belongs wholly to exactly one cohort and pins exactly one agent version. When multiple cohorts overlap a candidate record set without explicit selection, admission fails closed with `RELEASE_COHORT_AMBIGUOUS`. Silent fallback or version preference is strictly prohibited.
- **Two-Stage Population Validation:** Preselection provides dry-run compatibility checks only. Final preview sealing and job execution require the concrete ordered `ApplicationRecordRefV1` population sealed by SHA-256 digest.

### 2. Execution-Order Supervised Streaks
- **Start-Order Ordinal Sequencing:** Supervised streaks required for Stage 4 autonomy (20 consecutive cases) are keyed by candidate identity and context, with monotonic ordinals assigned synchronously at real case execution start, not at verification completion.
- **Strict Disqualification Rules:** Only terminal `verified_complete` cases with independent `system_evidence` and no prior disqualifier count toward the streak. Any started case that encounters failure, unknown outcome, unexpected rejection, escalation, or cancellation permanently breaks the streak.
- **Contiguous Qualifying Suffix:** The qualifying streak is evaluated over the contiguous qualifying suffix through the highest started ordinal; pending started cases act as barriers that prevent streak completion.

### 3. Exact-Behavior Lineage and Narrow Automated Preauthorizations
- **Streak Inheritance Prohibition:** Ordinary material replacement behavior must earn its own 20 consecutive verified supervised cases before receiving autonomous Stage 4/5 release approval. Body digest changes reset ordinary history.
- **Narrow Stage 5 Preauthorization Exception:** Standing automatic release authority is restricted to narrow, customer-approved `ReleasePreauthorizationV1` grants covering only two closed patch categories:
  - `interaction_binding`: Rebinding to already-reviewed, signed, production-qualified application capability configurations with identical semantic contracts.
  - `string_format`: String-literal changes in existing `concat` transforms with deterministic dataflow proof that affected strings cannot reach decision rules, record identities, destinations, parsing, or critical values.
- **Immutable Lineage Root:** Repeated repairs must be verified descendants of the grant's immutable base release, satisfying both immediate and cumulative protected-diff projections without widening authority.

### 4. Product-Minimum Approval Remits and Formal Atomic Consumption
- **Tier-Directed Approvals:** Human release approvals follow product remits: Workflow Owner governs standard releases and autonomy promotions; Security approval is required only for permission expansion, security policy changes, or stricter organization policies.
- **Separation of Duties:** Tier 3 releases strictly require an Owner distinct from the proposer. Tier 2 permits organizational separation exceptions where configured.
- **Atomic One-Use Consumption:** Identity exposes a transaction-taking `consume_governance` seam producing immutable `GovernanceConsumptionV1` records. Approvals carry strict 24-hour pending and 15-minute unconsumed validity ceilings, requiring fresh MFA within 5 minutes.

### 5. Truthful Version Restoration and Scoped Fencing
- **Restoration Semantics:** Re-establishing an earlier version creates a new active cohort mapping for future jobs only. It never undoes external business effects, never repins running jobs, never clears incident restrictions, and never resumes cancelled work.
- **Named Predecessor Verification:** Restoration requires an approved policy explicitly naming the exact predecessor release ID and definition digest, with full live re-verification of predecessor eligibility.
- **Cohort-Scoped Fences:** Orchestration supports `release_cohort` safety fences, allowing fine-grained isolation of failing cohorts without stopping healthy cohorts sharing the same agent version.

### 6. Signed Assist Release Attestation
- **Release-Owned Signing:** Assist plans require an independent `SignedAssistReleaseEligibilityV1` signed by Vault with the `policy` purpose, sealing exact plan hashes, cohort bindings, and validity limits.
- **Dual-Signature HUD Verification:** Local Context HUD verifies both Graph publisher and Release governance signatures before preparation.
- **Identity Context Binding:** Identity `ExecutionContextV1` assist arm is extended with required `release_id`, `release_cohort_id`, `release_eligibility_generation`, and `plan_sha256`, preventing online authorization desynchronization.

## Rationale and Alternatives

- **Why Named Cohorts over Percentage Routing:** Percentage routing provides an illusion of safety while introducing nondeterminism. Under percentage routing, identical records may be processed by different versions across executions, poisoning canary telemetry and making incident attribution ambiguous. Named cohorts provide absolute deterministic boundaries.
- **Why Execution-Start Ordinals over Completion-Order Streaks:** Completion-order counting incentivizes running many cases in parallel and cherry-picking the fastest passes while ignoring slow failures or hanging cases. Ordering by execution start guarantees that every admitted case is accounted for in order.
- **Why Strict Streak Reset over Ordinary Inheritance:** Minor behavioral modifications can introduce subtle semantic deviations. Assuming an edit is safe based on past history violates empirical verification. Only narrow, proven non-semantic patches under explicit standing preauthorization bypass full human review.
- **Why Named Predecessor Restoration over Automatic Rollback:** Automatic rollback to "latest passing version" frequently resurrects stale versions that violate current business rules or lack active adapter qualifications. Explicit named predecessor re-verification prevents cascading failures.

## Consequences

### Positive
- Completely deterministic job admission and canary exposure with zero version ambiguity.
- Robust, tamper-proof supervised streak verification that reflects true operational reliability.
- Tight cryptographic confinement of automated self-repair to provably non-harmful changes.
- Elimination of false rollback claims, aligning technical state with real-world business realities.
- End-to-end cryptographic integrity for assist guidance from authoring through HUD execution.

### Negative
- Requires explicit cohort definition and selection configuration from operators.
- Increased governance rigor resets streaks on material changes, requiring intentional supervision periods.
- Re-verifying predecessors on restoration introduces admission latency during emergency recoveries.
