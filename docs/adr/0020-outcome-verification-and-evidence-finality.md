# 0020. Outcome Verification and Evidence Finality

Date: 2026-11-15

## Status

Accepted

Amends:
- [0011-identity-authority-and-approval-fencing.md](0011-identity-authority-and-approval-fencing.md) (Dedicated `verification_read` token purpose, `OrganizationPolicyV1.verification_policy`, `VerificationReadContextV1`, `SignedVerificationReadAuthorizationV1`, and single-use `SignedVerificationReadLeaseV1`).
- [0012-control-plane-transport-durability-and-inference.md](0012-control-plane-transport-durability-and-inference.md) (Outcome verification transport routes, pure `oryn-verification-core` control-plane module, and advisory `verification_explanation` inference purpose).
- [0014-operational-graph-knowledge-and-rule-governance.md](0014-operational-graph-knowledge-and-rule-governance.md) (`HandoffVerificationBindingV1`, closed-union `HandoffAssessmentInputV1` lookup, and transactional handoff completion fencing).
- [0015-agent-factory-ir-and-candidate-qualification.md](0015-agent-factory-ir-and-candidate-qualification.md) (Normative `VerificationSpecProjectionV1`, `VerificationRequirementV1.source_bindings`, and removal of legacy inline readback fields).
- [0016-application-adapter-qualification-and-dispatch-boundaries.md](0016-application-adapter-qualification-and-dispatch-boundaries.md) (`ReadbackFreshnessProofV1`, `source_commit_token` in `AdapterSubmissionReceiptV1`, `AdapterReadPrepareRequestV1`, and `AdapterReadEvidencePort`).
- [0017-agent-runtime-execution-and-recovery.md](0017-agent-runtime-execution-and-recovery.md) (Post-submit verification delegation to Job Orchestration, removal of runner self-certification, and immutable verdict handling).
- [0018-job-orchestration-and-scheduling.md](0018-job-orchestration-and-scheduling.md) (Orchestrator-driven verification dispatch, case mapping for `verified`/`mismatch`/`unknown`, and non-mutating `reverify_only` continuation).
- [0019-flight-simulator-isolation-and-evaluation-evidence.md](0019-flight-simulator-isolation-and-evaluation-evidence.md) (Independent simulation oracle verification over `ScenarioExpectationRefV1` within attempt budget).

## Context

In enterprise automation, submission success does not equal business success. An HTTP 200 receipt or message queue acknowledgment proves only that a target system accepted an ingress payload—not that the invoice posted, the ledger balanced, the shipment scheduled, or the record committed with correct values.

Historically, automation systems conflate four distinct moments:
1. **Execution completion:** The agent finished its scripted or generative tool calls without local runtime panics.
2. **Submission receipt:** The target API returned an acknowledgment token or receipt.
3. **Outcome verification:** Authoritative business records independently prove that required business postconditions hold true.
4. **Execution authorization:** Approval granted by a human or policy engine before the action took place.

Conflating these moments leads to severe architectural pathologies:
- **Agent self-certification:** Agents inspect their own tool output or HTTP responses and self-report success, hiding silent API drops, unhandled background rejections, and stale reads.
- **Premature completion under eventual consistency:** Fast subsequent reads hit stale read-replicas or uncommitted caches, reading pre-mutation state and erroneously asserting failure or false success.
- **Security scope creep:** Granting autonomous agents broad read permissions across core ERP, CRM, and financial databases so they can inspect their own postconditions violates the principle of least privilege.
- **Destructive overwrite of diagnostic truth:** Systems that retry verification mutable-in-place overwrite original failure or unknown states, destroying audit trails and diagnostic evidence required for root-cause analysis.
- **Evidence lifetime misalignment:** Retaining sensitive transaction records (PII, customer financial data, screenshots) for 24-month audit compliance creates catastrophic data-retention liabilities; conversely, purging audit logs prematurely violates regulatory requirements.

## Decision

### 1. Pure Verification Core and Immutable Tri-State Verdicts
Oryn establishes an independent verification subsystem powered by a pure, deterministic library (`oryn-verification-core`) integrated into the Control Plane. Outcome verification evaluates fixed business postconditions against independent application state or signed human assessments.

The Verifier produces exactly one of three immutable verdicts:
- `verified`: All required postconditions are conclusively proven by certified fresh authoritative evidence or valid human assessment.
- `mismatch`: One or more required postconditions are conclusively contradicted by authoritative evidence. Execution pauses immediately; no subsequent mutations are dispatched; an incident fact is emitted.
- `unknown`: Evidence is missing, unproven, contradictory between credible sources, expired, stale, or unparseable. Unknown never defaults to success.

Verification results (`VerificationRunResultV1`) are immutable once issued. Re-verification never mutates, overwrites, or deletes an existing result; it dispatches a new `VerificationRunRequestV1` with a fresh UUIDv4, referencing original effects and frozen spec versions.

### 2. Dedicated Non-Actuating Read Authority
Verification readbacks execute under a dedicated, cryptographically partitioned identity token purpose: `verification_read`.
- **Non-Actuating Claims:** Verification read tokens contain only read and read-lease scopes. They are structurally incapable of authorizing writes, mutations, or workflow transitions.
- **Single-Use Logical Grants:** Identity issues `SignedVerificationReadAuthorizationV1` and single-use `SignedVerificationReadLeaseV1` cryptographically bound to exact prepared read targets (`target_digest`), source connections, tenant contexts, attempt epochs, and qualification certificates.
- **Least-Privilege Isolation:** Agents executing mutations never receive read access to verification readback endpoints. Readbacks are performed by Application Adapters on behalf of the Verifier coordinator, ensuring complete separation of duties between actors and verifiers.

### 3. Declarative Verification Specifications
Verification requirements are defined by declarative specifications (`VerificationSpecProjectionV1`):
- **Predicate Semantics:** Postconditions evaluate direct and derived facts against typed expressions (`eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `in`, `is_null`, `not_null`, `matches_regex`).
- **Checked Decimal Math:** Derived arithmetic expressions (`add`, `subtract`, `multiply`, `divide`, `abs`, `round`) use exact checked decimal semantics. Float approximations, epsilon comparisons, and silent overflow are strictly prohibited.
- **Strict Null Propagation:** Expressions evaluate to `null` on missing fields, division by zero, or incompatible types. A comparison against `null` yields `unknown`, not `true`.

### 4. Certified Readback Freshness vs. Success Heuristics
Authoritative readbacks require explicit, cryptographic freshness proofs (`ReadbackFreshnessProofV1`). Heuristic sleep timers, arbitrary poll counts, and blind delays are rejected:
- **Proof Modes:** Freshness is certified via:
  1. `matching_commit_token`: Exact match against external version, LSN, sequence number, or commit token returned in the submission receipt.
  2. `certified_monotonic_coverage`: Proof that source changelog or transaction stream is processed past the mutation's effect anchor timestamp.
  3. `certified_read_after_write`: External system guarantees immediate monotonic read-after-write consistency.
- **Rejection of Stale Caches:** Bounded-staleness read replicas or caches whose consistency window precedes the effect anchor cannot verify. If fresh authoritative evidence is unavailable before the bounded deadline (default 30 seconds, approved maximum 5 minutes), the verification finalizes as `unknown`.

### 5. Attributable Human Postcondition Assessment
When business systems lack automated readback surfaces (Stage 3 workflows), human review can establish postconditions via `PostconditionAssessmentRequestV1`:
- **Attributable Fact Observations:** The authorized reviewer submits direct observed facts (`ReviewerFactObservationV1`), source locators, and evidence references. The reviewer does not submit a verdict field.
- **Deterministic Engine Evaluation:** The Verifier core evaluates the signed facts against the approved specification predicates and issues the authoritative verdict.
- **Separation of Duties:** Separation-of-duty policies are enforced server-side. The actor who executed or approved the mutation cannot serve as the postcondition reviewer. Assignments expire after a strict 24-hour deadline; expired reviews reroute to domain owners and never default to verified.

### 6. Standalone Graph Handoff Assessment
Operational Graph handoffs establish verifiable completion via `HandoffVerificationBindingV1`:
- **Closed Method Union:** `HandoffAssessmentInputV1` is a closed union between `system_evidence` (referencing an authoritative Verifier `verification_id`) and `authorized_reviewer`.
- **Pre-Approved Standalone Bindings:** Standalone handoffs require an approved, pinned `HandoffVerificationBindingV1` with immutable requirements and source bindings.
- **Zero Hallucination:** Graph retrieves results directly from Verifier storage via workload mTLS. Caller-authored verdicts, invented execution IDs, or unstructured text assertions are rejected. Mismatch maps to Graph status `contradicted`.

### 7. Tiered Retention and Cryptographic Evidence Destruction
To resolve the tension between regulatory audit requirements and data minimization:
- **Dual Retention Model:**
  - **Content-Free Audit Records:** `VerificationRunResultV1`, `SignedVerificationResultAttestationV1`, and audit metadata are retained for **24 months**.
  - **Sensitive Evidence Payloads:** Normalized facts, raw readback snapshots, reviewer rationales, and explanation inputs are encrypted with AES-256-GCM using per-artifact DEKs wrapped by HashiCorp Vault.
- **Automated Destruction:** Sensitive evidence payloads expire after **7 days** (terminal completion) or **30 days** (no progress). Upon expiry:
  1. Cryptographic keys are destroyed in Vault.
  2. Destruction is committed to the immutable `verification_evidence_destruction` journal.
  3. Restore-overlay barriers prevent unwrap of restored database backups.
  4. Payload materialization returns `410 Gone` / unavailable metadata. Historical verdicts remain immutable.

### 8. Advisory On-Demand Explanations
Explanations (`VerificationExplanationV1`) are generated on demand via the Control Plane LiteLLM gateway:
- **Advisory Only:** Explanations provide human-readable summaries and citations (`{requirement_id, evidence_ref}`). They cannot modify facts, predicates, or verdicts.
- **Bounded Resources:** Bounded to 16 KiB input, 8 KiB output, 10-second timeout, and max 2 concurrent requests per tenant.
- **Zero Content Retention:** Raw prompts and model completions are discarded; only certified advisory outputs are retained in expiring encrypted custody. Model outages leave verdicts intact.

## Rationale and Alternatives

- **Primary/Fallback Freshness vs. Success Heuristics:** Heuristics such as "wait 5 seconds and assume OK if no error" cause silent data corruption in eventual-consistency systems. Requiring explicit cryptographic freshness proofs guarantees that Oryn asserts verification only over ground truth.
- **Immutable Unknown & Re-Verification vs. Mutable Retries:** In-place mutable retries destroy diagnostic lineage and race with concurrent observers. Creating a fresh `VerificationRunRequestV1` for re-verification preserves complete provenance and enables truthful incident analysis.
- **Unified Non-Actuating Read Authority vs. Widening Execution Context:** Reusing agent mutation tokens for verification invites privilege escalation and lateral movement. Dedicated `verification_read` tokens strictly confine verification to readback operations.
- **Tiered Evidence Retention (7d/30d vs. 24mo):** Storing full application snapshots for 24 months creates massive GDPR/HIPAA compliance risks. Encrypting evidence with disposable DEKs and retaining only content-free attestations satisfies both auditability and privacy constraints.

## Consequences

- **Identity & Policy:** Implements `verification_read` token purpose, `SignedVerificationReadAuthorizationV1`, single-use leases, and server-side separation-of-duty checks.
- **Application Adapters:** Generates `ReadbackFreshnessProofV1` during qualification, provides `source_commit_token` in submission receipts, and serves prepared readbacks via `AdapterReadEvidencePort`.
- **Control Plane:** Mounts 13 OpenAPI routes, embeds `oryn-verification-core`, executes coordinator workflows, and manages PostgreSQL 18 RLS tables.
- **Agent Factory IR:** Emits normalized `VerificationSpecProjectionV1` in candidate bundles, pins source bindings, and computes canonical specification digests.
- **Agent Runtime:** Yields execution completion to Orchestration without asserting outcome verdicts.
- **Job Orchestration:** Orchestrates verification runs, maps verdicts to case state (`verified` -> ready to complete; `mismatch` -> failed/incident; `unknown` -> outcome_unknown), and schedules non-mutating `reverify_only` continuations.
- **Operational Graph:** Validates handoff obligations via standalone verification bindings and trusted Verifier lookups.
- **Flight Simulator:** Evaluates candidate agent postconditions against sealed scenario expectations within bounded simulation attempts.
