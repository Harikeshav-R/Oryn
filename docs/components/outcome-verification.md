# Independent Outcome Verification and Test Oracle Component Specification

Status: Detailed technical specification — implementation pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§6.6, 9.4, 11.4](../../TECHNICAL.md) | [PRODUCT.md §§15.7, 17, 16.7; ORY-034, ORY-043–044](../../PRODUCT.md) | [ADR-0020](../adr/0020-outcome-verification-and-evidence-finality.md) | [ADR-0016](../adr/0016-application-adapter-qualification-and-dispatch-boundaries.md) | [ADR-0018](../adr/0018-job-orchestration-and-scheduling.md)

### Core Responsibility
Independent Outcome Verification and Test Oracle determines whether the **business effect** of an agent action, case, assist session, simulation attempt, or standalone Graph handoff matches authorized postconditions and business rules, or whether the result is incomplete, incorrect, or unknown. It acts as an independent test oracle operating outside the runner execution loop.

### Owns
- The formal verification specification registry, lifecycle (`draft -> in_review -> approved -> revoked`), and execution engine.
- Pure deterministic business predicate evaluation, three-valued logic resolution (`verified`, `mismatch`, `unknown`), derived fact calculation, and discrepancy quantification.
- Independent, read-only external readback acquisition scheduling, bounded jittered polling, and read-claim lifecycle over application adapters.
- Stage 3 human postcondition assessment collection, attributable reviewer observations, reviewer separation policy enforcement, and attestation signing.
- Pinned standalone Graph handoff postcondition assessment verification.
- Encrypted custody, source manifest tracking, cryptographic destruction, and retention lifecycle for normalized fact snapshots and sensitive business discrepancies.
- Immutable verification results (`VerificationRunResultV1`, `HandoffAssessmentResultV1`) and Vault Ed25519 detached result attestations (`SignedVerificationResultAttestationV1`).
- On-demand, post-verdict advisory explanations (`VerificationExplanationV1`) via governed cloud inference.

### Consumes
- Approved verification specifications and requirement bindings via `VerificationCatalogPort` and `VerificationContextPort`.
- Action submission receipts (`AdapterSubmissionReceiptV1`) with optional certified commit tokens from [application-adapters](application-adapters.md).
- Prepared reads, credential leases, and signed readback evidence (`SignedAdapterReadbackEvidenceV1`) with certified freshness proofs via `AdapterReadbackPort` and `IdentityVerificationReadPort`.
- Signed human postcondition assessments from authorized reviewers matching configured roles and separation policies.
- Pinned Graph handoff verification bindings (`HandoffVerificationBindingV1`) from [operational-graph](operational-graph.md).
- Sealed scenario expectations (`ScenarioExpectationRefV1`) from [flight-simulator](flight-simulator.md) for simulation evaluation.
- Identity principal verification, tenant organization context, and organization policy (`OrganizationPolicyV1.verification_policy`).

### Produces
- Formal verification verdicts (`verified`, `mismatch`, `unknown`) delivered to [job-orchestration](job-orchestration.md) and [local-context-hud](local-context-hud.md) to govern case completion.
- Standalone handoff assessment results (`verified`, `contradicted`, `unknown`) delivered to [operational-graph](operational-graph.md) to govern handoff obligation fulfillment.
- Verification mismatch descriptions, limitation codes, and failure evidence delivered to [incident-correction-repair](incident-correction-repair.md).
- Independent oracle evaluation results delivered to [flight-simulator](flight-simulator.md) and [release-governance](release-governance.md).
- Outbox domain events (`verification.run_completed`, `verification.spec_approved`, `verification.spec_revoked`).

### Does Not Own
- Executing external application mutations or deciding runner actions (owned by [agent-runtime](agent-runtime.md) and [application-adapters](application-adapters.md)).
- Action authorization or mutation credential leasing (owned by [identity-policy](identity-policy.md)).
- Case lifecycle transitions, batch population management, or continuation dispatches (owned by [job-orchestration](job-orchestration.md)).
- Operational Graph handoff state or playbook governance (owned by [operational-graph](operational-graph.md)).
- Scenario definition, suite scoring, or benchmark pass/fail criteria (owned by [flight-simulator](flight-simulator.md)).
- Procedural human demonstration assessments (`DemonstrationVerificationV1`, owned by [workflow-discovery](workflow-discovery.md)); historical demonstration assessments provide read-only evidence references to Operational Graph and do not substitute for runtime postcondition verification during autonomous execution.
- Accepting agent runner self-declarations or UI success banners as proof of business completion.

### Boundary Requirement
An independent authoritative readback is preferred over runner self-reporting. An unconfirmable or ambiguous consequential write is strictly classified as **Outcome Unknown**, never success. The production verifier and simulation oracle share identical business semantics while independently evaluating their respective state sources. Unknown outcomes halt execution and block blind retries. Verification is strictly read-only: the verifier possesses zero mutation authority and cannot modify external application state.

### Component Acceptance Standards
Component acceptance adheres strictly to:
- **ORY-034:** Postcondition Verification Scoring — Cases executing all steps but failing required business postconditions are scored as failures.
- **ORY-043:** Prohibition of Self-Certification — An action submission cannot be marked Verified Complete based solely on runner execution success; independent verification is mandatory.
- **ORY-044:** Hold on Uncertain Outcomes — When verification cannot confirm an external write, the outcome is flagged as uncertain (`unknown`), pausing execution and blocking duplicate retries.
- **ORY-026–030:** Identity, principal construction, least privilege, and role-based access control.
- **ORY-031–039:** Simulation isolation, oracle independence, benchmark integrity, and sealed scenario scoring.
- **ORY-049–050:** Release qualification and candidate verification requirements.
- **ORY-062–064:** Audit trail immutability and cryptographic attestation.
- **ORY-068–075:** Incident emission, safety containment, and discrepancy reporting.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§15.7, 17, 16.7; ORY-034, ORY-043–044](../../PRODUCT.md))
- **Postcondition Verification Scoring (ORY-034):** A case that executes all steps but fails required business postconditions must be scored as a failure (`mismatch`), transitioning the case to `Failed` in Job Orchestration.
- **Prohibition of Self-Certification (ORY-043):** An action submission cannot be marked `Verified Complete` based solely on runner execution success or application submission acknowledgment; independent verification is mandatory.
- **Hold on Uncertain Outcomes (ORY-044):** When verification cannot confirm an external write within the authorized confirmation window, the outcome is classified as `Outcome Unknown`, pausing execution and blocking automatic duplicate retries.
- **Causal Evidence & Freshness Guarantees:** Verification requires causal evidence or a qualification-backed endpoint freshness guarantee. Query timestamps, repeated cached values, opaque source-version text, and runner assertions alone do not establish post-submit freshness.
- **Source Priority and Fallback Rules:** Verification supports owner-approved primary evidence per fact with explicitly qualified fallbacks. Unresolved credible material contradictions yield `unknown`; a declared priority rule resolves only cases it explicitly covers. Never select a source because it passes.
- **Separation of Duties:** For Stage 3 human postcondition assessment, an authorized reviewer must attest observed facts against source locators. Organization policy can enforce distinct author/approver and distinct executor/reviewer requirements.
- **Durable Re-Verification:** Later read-only re-verification requires an explicit currently authorized reconciliation request. It may automatically update an exact-matching current `Outcome Unknown` case to `Verified Complete` if no intervening mutations occurred, but cannot auto-resume execution, override cancellation/newer attempts, or rewrite earlier history.
- **Privacy & Evidence Retention:** Minimized sensitive production evidence expires at the earliest source expiry, **7 days after terminal disposition**, or **30 days without semantic progress**. Content-free verdict/audit metadata follows the **24-month default**.
- **Advisory Model Explanation:** Post-verdict model explanations are strictly on-demand, advisory, and read-only. Inference failure or absence cannot alter or delay business correctness verdicts.

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Compile-time verification catalog (Contract 7 context / Catalog Port):** Advertises owner-defined verification specifications, postcondition predicates, and readback bindings to [agent-factory-ir](agent-factory-ir.md) and [operational-graph](operational-graph.md). Wire schema: [`outcome-verification-v1.schema.json`](../architecture/contracts/outcome-verification-v1.schema.json) (`$id: urn:oryn:schemas:outcome-verification:v1`).
- **Contract Reference #8:** Delivers oracle verification results (`VerificationRunResultV1`) to [flight-simulator](flight-simulator.md) and [release-governance](release-governance.md).
- **Contract Reference #13:** Ingests submission records (`AdapterSubmissionReceiptV1`) and readback evidence (`SignedAdapterReadbackEvidenceV1`) from [application-adapters](application-adapters.md) under wire schema [`application-adapters-v1.schema.json`](../architecture/contracts/application-adapters-v1.schema.json). Outcome Verification prepares reads via `AdapterReadbackPort::prepare`, obtains signed authorization grants via `IdentityVerificationReadPort::authorize`, and executes bounded fetches via `AdapterExecutionPort::readback`.
- **Contract Reference #14:** Delivers verification verdicts (`VerificationRunResultV1`) and mismatch diagnoses to [job-orchestration](job-orchestration.md) (for batch agent jobs), [local-context-hud](local-context-hud.md) (for HUD assist sessions), and [incident-correction-repair](incident-correction-repair.md). Outcome Verification provides authoritative, independent outcome evaluations for incidents and candidate repairs, feeding `RepairReleaseObservationV1` during canary monitoring and progressive rollout. Formal verifier verdicts are strictly immutable: AI diagnosis and repair reasoning models cannot rewrite source facts, predicates, or finalized verdicts. Mismatches map directly to `failed_incorrect_outcome` and permanent unknown dispositions map to `inconclusive`, triggering immediate incident reporting and owner review.
- **Contract Reference #18 ([command-center-analytics](command-center-analytics.md)):** Emits `VerificationReportingFactV1` (`verification.reporting-fact.v1`) via `ReportingSourcePort`. Supplies independent verification facts for each evaluated case and assist session, including verification specification references, readback evidence hashes, oracle verdicts (`verified_complete`, `expected_rejection`, `definitive_mismatch`, `unresolved`), and execution duration benchmarks for authoritative analytics reporting.
- **Contract Reference #22:** Governed model explanation (`text.reason` under purpose `verification_explanation`) via LiteLLM under [cloud-inference](../architecture/cloud-inference.md). Output is validated against `verification.explanation.v1`.

### Rust Domain Ports

```rust
use std::future::Future;
use uuid::Uuid;
use crate::types::*;

pub trait VerificationCatalogPort: Send + Sync {
    fn projections<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        references: &'a [KnowledgeVersionRefV1],
    ) -> impl Future<Output = Result<Vec<VerificationSpecProjectionV1>, VerificationCatalogError>> + Send + 'a;

    fn statuses<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        references: &'a [KnowledgeVersionRefV1],
    ) -> impl Future<Output = Result<Vec<VerificationSpecStatusV1>, VerificationCatalogError>> + Send + 'a;
}

pub trait VerificationExecutionPort: Send + Sync {
    fn request<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: VerificationRunRequestV1,
    ) -> impl Future<Output = Result<VerificationRunStatusV1, VerificationErrorV1>> + Send + 'a;

    fn status<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        query: VerificationStatusQueryV1,
    ) -> impl Future<Output = Result<VerificationRunStatusV1, VerificationErrorV1>> + Send + 'a;
}

pub trait VerificationManagementPort: Send + Sync {
    fn save_draft<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        command: VerificationSpecDraftCommandV1,
    ) -> impl Future<Output = Result<VerificationSpecViewV1, VerificationProblemV1>> + Send + 'a;

    fn decide<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        command: VerificationSpecDecisionCommandV1,
    ) -> impl Future<Output = Result<VerificationSpecViewV1, VerificationProblemV1>> + Send + 'a;

    fn get<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        organization_id: Uuid,
        spec_id: Uuid,
    ) -> impl Future<Output = Result<VerificationSpecViewV1, VerificationProblemV1>> + Send + 'a;
}

pub trait HandoffVerificationPort: Send + Sync {
    fn request<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: HandoffAssessmentRequestV1,
    ) -> impl Future<Output = Result<HandoffAssessmentStatusV1, VerificationErrorV1>> + Send + 'a;

    fn status<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        query: HandoffAssessmentQueryV1,
    ) -> impl Future<Output = Result<HandoffAssessmentStatusV1, VerificationErrorV1>> + Send + 'a;
}

pub trait VerificationContextPort: Send + Sync {
    fn resolve<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: &'a VerificationRunRequestV1,
    ) -> impl Future<Output = Result<VerificationResolvedContextV1, VerificationErrorV1>> + Send + 'a;
}
```

## Trust and deployment boundaries

### Deployment Location
Outcome Verification executes strictly as a Rust domain module within the central Axum/Tokio/SQLx control plane (`oryn-api` and `oryn-worker`). It is logically and physically isolated from runner processes, employee client devices, and vendor credentials:
- **No Microservice/Broker:** It does not introduce standalone HTTP microservices, message brokers (Kafka/RabbitMQ), or separate operational databases. All coordination utilizes PostgreSQL 18 with transactional outbox and worker delivery tables.
- **Pure Core Library (`oryn-verification-core`):** Pure deterministic evaluation logic (AST traversal, three-valued logic, checked arithmetic, fact binding, and aggregation) is compiled into a standalone, pure Rust crate with zero I/O or network dependencies. This core library is shared identically between production execution and Flight Simulator.
- **Tenant Isolation:** Enforced via `TenantTransaction`, mandatory PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`), and strict tenant parameterization on all queries.

### Process & Credential Boundaries
- **Untrusted Runners:** Agent runner processes and local DOM execution results are treated as completely untrusted. Runners cannot self-certify completion, submit synthetic readbacks, or alter verifier state.
- **Zero Actuation Authority:** Outcome Verification has no access to mutation credentials or actuation endpoints. It only holds read-only authority.
- **Dedicated Out-of-Process Read Authority:** Readback queries are prepared through Application Adapters, authorized by Identity under one-use signed grants (`SignedVerificationReadAuthorizationV1`), and executed via dedicated `readback`-role leases through out-of-process credential egress. Runners never observe or handle readback credentials.

## Internal architecture

Outcome Verification comprises eight logical submodules within the control plane:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Outcome Verification Module                        │
│                                                                             │
│  ┌───────────────────────────┐         ┌─────────────────────────────────┐  │
│  │ VerificationSpecRegistry  │         │     VerificationCoordinator     │  │
│  │ (Drafts, Approvals, Proj) │         │ (Admission, Deduplication, FSM) │  │
│  └─────────────┬─────────────┘         └──────────────┬──────────────────┘  │
│                │                                      │                     │
│                ▼                                      ▼                     │
│  ┌───────────────────────────┐         ┌─────────────────────────────────┐  │
│  │    ReadbackCoordinator    │◄───────►│      VerificationFactBinder     │  │
│  │  (Polling, Grants, Egress)│         │ (Pointer Extract, Derivations)  │  │
│  └─────────────┬─────────────┘         └──────────────┬──────────────────┘  │
│                │                                      │                     │
│                ▼                                      ▼                     │
│  ┌───────────────────────────┐         ┌─────────────────────────────────┐  │
│  │ReviewerAssessmentCoord.   │         │      PostconditionEvaluator     │  │
│  │ (Human Stage 3 Reviews)   │         │ (Pure Core, 3-Valued Logic AST) │  │
│  └─────────────┬─────────────┘         └──────────────┬──────────────────┘  │
│                │                                      │                     │
│                ▼                                      ▼                     │
│  ┌───────────────────────────┐         ┌─────────────────────────────────┐  │
│  │VerificationEvidenceCatalog│         │VerificationExplanationCoord.    │  │
│  │ (AES-GCM, Expiry, Purge)  │         │ (On-Demand Advisory LiteLLM)    │  │
│  └───────────────────────────┘         └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Submodule Responsibilities
1. **`VerificationSpecRegistry`:** Manages specification drafts, revisions, optimistic concurrency, authoring/approval commands, RFC 8785 canonical body hashing, capability postcondition references, and compilation catalog projections.
2. **`VerificationCoordinator`:** Admits verification requests, authenticates tenant context, resolves immutable context via `VerificationContextPort`, deduplicates requests, manages execution state transitions, and enqueues domain events.
3. **`ReadbackCoordinator`:** Schedules bounded readback polls across declared sources, applies deterministic jittered backoff, requests prepared reads from Adapters, obtains one-use read grants from Identity, and ingests signed readback evidence.
4. **`VerificationFactBinder`:** Extracts raw values from signed readback payloads using static RFC 6901 JSON pointers, normalizes types, evaluates source priority/freshness, and recomputes flat derived facts (checked decimal subtraction).
5. **`PostconditionEvaluator`:** Implements `oryn-verification-core`. Evaluates Graph `BusinessConditionV1` ASTs with three-valued logic (`verified`, `mismatch`, `unknown`), computes numerical discrepancies, and applies aggregate precedence (`mismatch` > `unknown` > `verified`).
6. **`ReviewerAssessmentCoordinator`:** Ingests attributable Stage 3 human postcondition assessments, verifies reviewer roles and separation policies, validates observation time anchors, and commits signed assessment attestations.
7. **`VerificationEvidenceCatalog`:** Manages encrypted custody of sensitive normalized facts and numeric deltas, binds AAD, tracks source manifests, and executes strict cryptographic destruction upon retention expiry.
8. **`VerificationExplanationCoordinator`:** Generates advisory, on-demand explanations of finalized results via LiteLLM using pinned templates, certified schemas, and strict input/output bounds.

## State and lifecycle

### Specification Lifecycle
`draft -> in_review -> approved -> revoked`
- Published bodies (`approved`) are strictly immutable. Any modification requires authoring a new draft revision.
- Approval requires fresh step-up authentication (MFA) and verifies separation policies.
- Revocation restricts subsequent compilation and execution admission immediately.

### Verification Run Lifecycle
`admitted -> reading -> waiting_readback -> awaiting_reviewer -> evaluating -> finalizing -> complete`

```
  ┌──────────┐
  │ admitted │
  └────┬─────┘
       │
       ├───────────────────────────────────────────────┐
       ▼ (system_evidence)                             ▼ (authorized_reviewer)
  ┌─────────┐                                   ┌───────────────────┐
  │ reading │                                   │ awaiting_reviewer │
  └────┬────┘                                   └─────────┬─────────┘
       │                                                  │
       ├──────────────┐ (fresh mismatch                   │ (human assessment
       ▼              ▼  or complete read)                │  or deadline expiry)
  ┌──────────────────┐                                    │
  │ waiting_readback │                                    │
  └────┬─────────────┘                                    │
       │                                                  │
       ▼ (all sources read / window elapsed)              │
  ┌────────────┐                                          │
  │ evaluating │◄─────────────────────────────────────────┘
  └────┬───────┘
       │
       ▼ (atomic commit & Vault signing)
  ┌────────────┐
  │ finalizing │
  └────┬───────┘
       │
       ▼
  ┌──────────┐
  │ complete │
  └──────────┘
```

### Relational Schema (PostgreSQL 18 DDL)

```sql
-- 1. Verification Specification Head
CREATE TABLE verification_spec_head (
    organization_id UUID NOT NULL,
    spec_id UUID NOT NULL,
    current_revision NUMERIC(20, 0) NOT NULL DEFAULT 1,
    state VARCHAR(32) NOT NULL CHECK (state IN ('draft', 'in_review', 'approved', 'revoked')),
    current_version_id UUID NULL,
    owner_actor_id VARCHAR(128) NOT NULL,
    responsible_team_id VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, spec_id)
);
ALTER TABLE verification_spec_head ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_spec_head FORCE ROW LEVEL SECURITY;
CREATE POLICY spec_head_tenant_isolation ON verification_spec_head
    USING (organization_id = CURRENT_SETTING('app.current_organization_id', true)::UUID);

-- 2. Verification Specification Version (Immutable Bodies)
CREATE TABLE verification_spec_version (
    organization_id UUID NOT NULL,
    spec_id UUID NOT NULL,
    version_id UUID NOT NULL,
    revision NUMERIC(20, 0) NOT NULL,
    body_sha256 CHAR(64) NOT NULL,
    body JSONB NOT NULL,
    author_actor_id VARCHAR(128) NOT NULL,
    approver_actor_id VARCHAR(128) NULL,
    approved_at TIMESTAMPTZ NULL,
    revoked_at TIMESTAMPTZ NULL,
    status_generation BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, version_id),
    UNIQUE (organization_id, spec_id, revision),
    FOREIGN KEY (organization_id, spec_id) REFERENCES verification_spec_head(organization_id, spec_id)
);
ALTER TABLE verification_spec_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_spec_version FORCE ROW LEVEL SECURITY;
CREATE POLICY spec_version_tenant_isolation ON verification_spec_version
    USING (organization_id = CURRENT_SETTING('app.current_organization_id', true)::UUID);

-- 3. Verification Run State
CREATE TABLE verification_run (
    organization_id UUID NOT NULL,
    request_id UUID NOT NULL,
    subject_kind VARCHAR(32) NOT NULL CHECK (subject_kind IN ('execution_verification', 'handoff_assessment')),
    subject_ref VARCHAR(256) NOT NULL,
    request_sha256 CHAR(64) NOT NULL,
    request_binding_sha256 CHAR(64) NOT NULL,
    state VARCHAR(32) NOT NULL CHECK (state IN ('admitted', 'reading', 'waiting_readback', 'awaiting_reviewer', 'evaluating', 'finalizing', 'complete')),
    deadline_at TIMESTAMPTZ NOT NULL,
    source_expires_at TIMESTAMPTZ NOT NULL,
    last_semantic_progress_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lease_owner VARCHAR(128) NULL,
    lease_epoch BIGINT NOT NULL DEFAULT 0,
    lease_expires_at TIMESTAMPTZ NULL,
    next_due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_id VARCHAR(128) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, request_id)
);
CREATE INDEX idx_verification_run_dispatch ON verification_run (organization_id, state, next_due_at);
ALTER TABLE verification_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_run FORCE ROW LEVEL SECURITY;
CREATE POLICY run_tenant_isolation ON verification_run
    USING (organization_id = CURRENT_SETTING('app.current_organization_id', true)::UUID);

-- 4. Verification Read Claim
CREATE TABLE verification_read_claim (
    organization_id UUID NOT NULL,
    request_id UUID NOT NULL,
    requirement_id VARCHAR(128) NOT NULL,
    source_id VARCHAR(128) NOT NULL,
    poll_sequence BIGINT NOT NULL,
    prepared_read_id VARCHAR(128) NOT NULL,
    prepared_read_revision BIGINT NOT NULL,
    attempt_id UUID NOT NULL,
    authorization_id VARCHAR(128) NOT NULL,
    state VARCHAR(32) NOT NULL CHECK (state IN ('prepared', 'authorized', 'dispatched', 'received', 'failed')),
    evidence_id VARCHAR(128) NULL,
    next_poll_at TIMESTAMPTZ NOT NULL,
    lease_epoch BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, request_id, requirement_id, source_id, poll_sequence),
    FOREIGN KEY (organization_id, request_id) REFERENCES verification_run(organization_id, request_id)
);
ALTER TABLE verification_read_claim ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_read_claim FORCE ROW LEVEL SECURITY;
CREATE POLICY read_claim_tenant_isolation ON verification_read_claim
    USING (organization_id = CURRENT_SETTING('app.current_organization_id', true)::UUID);

-- 5. Verification Result (Content-Free Immutable Verdicts)
CREATE TABLE verification_result (
    organization_id UUID NOT NULL,
    verification_id VARCHAR(128) NOT NULL,
    request_id UUID NOT NULL,
    verdict VARCHAR(32) NOT NULL CHECK (verdict IN ('verified', 'mismatch', 'unknown')),
    result_sha256 CHAR(64) NOT NULL,
    request_binding_sha256 CHAR(64) NOT NULL,
    evidence_manifest_sha256 CHAR(64) NOT NULL,
    engine_revision VARCHAR(64) NOT NULL,
    attestation_signature VARCHAR(256) NOT NULL,
    attestation_key_id VARCHAR(128) NOT NULL,
    finalized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    audit_expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (organization_id, verification_id),
    UNIQUE (organization_id, request_id),
    FOREIGN KEY (organization_id, request_id) REFERENCES verification_run(organization_id, request_id)
);
ALTER TABLE verification_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_result FORCE ROW LEVEL SECURITY;
CREATE POLICY result_tenant_isolation ON verification_result
    USING (organization_id = CURRENT_SETTING('app.current_organization_id', true)::UUID);

-- 6. Encrypted Evidence Snapshot (Sensitive Normalized Facts & Deltas)
CREATE TABLE verification_evidence_snapshot (
    organization_id UUID NOT NULL,
    evidence_snapshot_id UUID NOT NULL,
    verification_id VARCHAR(128) NOT NULL,
    key_ref VARCHAR(128) NOT NULL,
    encrypted_payload BYTEA NOT NULL,
    nonce BYTEA NOT NULL,
    payload_sha256 CHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    deletion_generation BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, evidence_snapshot_id),
    FOREIGN KEY (organization_id, verification_id) REFERENCES verification_result(organization_id, verification_id)
);
CREATE INDEX idx_evidence_snapshot_expiry ON verification_evidence_snapshot (organization_id, expires_at);
ALTER TABLE verification_evidence_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_evidence_snapshot FORCE ROW LEVEL SECURITY;
CREATE POLICY evidence_snapshot_tenant_isolation ON verification_evidence_snapshot
    USING (organization_id = CURRENT_SETTING('app.current_organization_id', true)::UUID);

-- 7. Verification Assessment (Stage 3 Human Reviews)
CREATE TABLE verification_assessment (
    organization_id UUID NOT NULL,
    assessment_id UUID NOT NULL,
    request_id UUID NOT NULL,
    requirement_id VARCHAR(128) NOT NULL,
    reviewer_actor_id VARCHAR(128) NOT NULL,
    reviewer_role VARCHAR(128) NOT NULL,
    review_revision BIGINT NOT NULL,
    attestation_signature VARCHAR(256) NOT NULL,
    encrypted_observations_ref UUID NOT NULL,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, assessment_id),
    FOREIGN KEY (organization_id, request_id) REFERENCES verification_run(organization_id, request_id)
);
ALTER TABLE verification_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_assessment FORCE ROW LEVEL SECURITY;
CREATE POLICY assessment_tenant_isolation ON verification_assessment
    USING (organization_id = CURRENT_SETTING('app.current_organization_id', true)::UUID);

-- 8. Verification Replay Tombstone
CREATE TABLE verification_replay_tombstone (
    organization_id UUID NOT NULL,
    request_id UUID NOT NULL,
    request_sha256 CHAR(64) NOT NULL,
    verification_id VARCHAR(128) NOT NULL,
    verdict VARCHAR(32) NOT NULL,
    audit_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, request_id),
    UNIQUE (organization_id, request_sha256)
);
ALTER TABLE verification_replay_tombstone ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_replay_tombstone FORCE ROW LEVEL SECURITY;
CREATE POLICY tombstone_tenant_isolation ON verification_replay_tombstone
    USING (organization_id = CURRENT_SETTING('app.current_organization_id', true)::UUID);

-- 9. Evidence Destruction Journal
CREATE TABLE verification_evidence_destruction (
    organization_id UUID NOT NULL,
    artifact_id UUID NOT NULL,
    deletion_generation BIGINT NOT NULL,
    key_ref VARCHAR(128) NOT NULL,
    destroyed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, artifact_id, deletion_generation)
);
ALTER TABLE verification_evidence_destruction ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_evidence_destruction FORCE ROW LEVEL SECURITY;
CREATE POLICY destruction_tenant_isolation ON verification_evidence_destruction
    USING (organization_id = CURRENT_SETTING('app.current_organization_id', true)::UUID);
```

## Error and edge-case behavior

### Public Error Codes (`VerificationErrorV1`)
Returned by execution and handoff ports:
- `VERIFICATION_NOT_AUTHORIZED` (HTTP 403 / anti-enumeration 404): Principal lacks permission, wrong realm, or tenant mismatch.
- `VERIFICATION_INPUT_INVALID` (HTTP 422): Malformed request, missing requirements, invalid digests, or unresolvable targets.
- `VERIFICATION_UNAVAILABLE` (HTTP 503, retryable): Ephemeral database connection exhaustion or dependency timeout.
- `VERIFICATION_REQUEST_CONFLICT` (HTTP 409): Existing request ID with different canonical request digest.

### Management Problems (`VerificationProblemV1`)
Used by management ports with mapping:
- `VERIFICATION_NOT_AUTHORIZED` -> 403
- `VERIFICATION_INPUT_INVALID` -> 422
- `VERIFICATION_UNAVAILABLE` -> 503 (retryable)
- `VERIFICATION_REQUEST_CONFLICT` -> 409
- `VERIFICATION_SPEC_NOT_FOUND` -> 404
- `VERIFICATION_REVISION_CONFLICT` -> 409
- `VERIFICATION_STATE_INVALID` -> 409
- `VERIFICATION_SPEC_INVALID` -> 422
- `VERIFICATION_EVIDENCE_UNAVAILABLE` -> 409

### Closed Limitations (`VerificationLimitationV1`)
Verdict limitations use the closed enum: `source_unavailable`, `source_timeout`, `freshness_unproven`, `source_conflict`, `evidence_missing`, `evidence_expired`, `value_invalid`, `derivation_invalid`, `readback_limit_exceeded`, `budget_exhausted`, `review_expired`, `reviewer_authority_lost`, `spec_revoked`, `policy_revoked`, `control_superseded`, `predicate_unknown`. No customer payload strings, URLs, or free-text errors are stored in audit verdict metadata.

### Polling, Backoff, and Jitter Schedule
- **Initial Poll:** Immediate upon entering `reading`.
- **Backoff Ladder:** Base delays: 500 ms, 1,000 ms, 2,000 ms, 4,000 ms, 8,000 ms, then capped at 10,000 ms.
- **Deterministic Jitter:** 80% to 120% derived from `SHA256(request_id || source_id || poll_sequence)`.
- **Budgets and Ceilings:** Default confirmation window is 30,000 ms (max 300,000 ms). Individual read timeout is min(source read bound, 30 s, remaining window), authoring default 5,000 ms. Max 64 poll attempts per source; max 2,048 total reads per run. Vendor `Retry-After` is honored without extending the overall deadline.
- **Conclusive vs. Eventual Termination:** Fresh authoritative contradiction (`immediate_if_fresh_authoritative`) terminates immediately as `mismatch`. Unproven or pending eventual states wait until window exhaustion, yielding `unknown` unless conclusive contradictory evidence was obtained.

## Observability and audit

### Telemetry and Audit Records
- Emits metrics: `verification.run.latency_ms`, `verification.verdict.count{verdict}`, `verification.read.poll_count`, `verification.limitation.count{code}`.
- Every completed verification produces an immutable `VerificationRunResultV1` and a detached `SignedVerificationResultAttestationV1` signed by Vault Ed25519 over:
  `SHA256(RFC8785({ organization_id, verification_id, result_sha256, request_binding_sha256, evidence_manifest_sha256, engine_revision, issued_at }))`.
- Audit logs contain zero sensitive business payload values, DOM snapshots, or credentials.

### Dual-Retention Schedule
- **Content-Free Audit Records:** Verdict, timestamps, attestation, limitation codes, and manifest hashes are retained for **24 months**.
- **Sensitive Normalized Evidence:** Raw normalized facts, derived numeric values, reviewer observations, and explanation snapshots expire at the earliest of source expiry, **7 days post-terminal disposition**, or **30 days without semantic progress**.

## Security and threat model

### Cryptographic Envelopes and Storage
- **Per-Immutable-Value Envelope Encryption:** Sensitive evidence snapshots and normalized facts are encrypted using AES-256-GCM with fresh 96-bit nonces. Per-artifact Data Encryption Keys (DEKs) are wrapped by dedicated, independently deletable Vault Transit wrapping keys in the Expiring Payload Vault (`disable_upsert=true`).
- **Additional Authenticated Data (AAD):** Binds canonical bytes `UTF8("oryn.payload-key-binding.v1") + LF + RFC8785(binding)` containing `organization_id`, `verification_id`, `subject_ref`, `key_ref`, `custody_generation`, and purpose.
- **Two-Phase Destruction:** Upon retention expiry or tenant deletion, verification first commits an irreversible `PayloadKeyFenceV1 { state: "destroy_pending" }` to the independent journal; then deletes the Transit key in Expiring Payload Vault; then commits `state: "destroyed"`. Timeouts or unverified deletions never produce false completion receipts.
- **Regional Custody Loss Exception:** Regional destruction or unrecoverable quorum loss of the Expiring Payload Vault permanently loses affected evidence payload decryption. The old generation is marked `lost` and future payloads allocate a new generation; content-free verdict bytes, timestamps, attestations, and audit records remain completely unmutated. Database restores cannot decrypt shredded or lost data.

### Threat Scenarios & Mitigations
1. **Runner Collusion / Self-Certification:** Untrusted runners assert successful completion without external effects. *Mitigation:* Verifier ignores runner logs; execution requires independent readback via out-of-process credential egress.
2. **Stale Cache / Read-Before-Write Race:** Vendor readback returns cached pre-write state. *Mitigation:* Certified freshness proofs require exact commit tokens, monotonic versions, certified read-after-write guarantees, or bounded staleness offsets satisfying `queried_after - max_staleness >= observed_after`.
3. **Manual Success Laundering:** Rogue operator submits fake reviewer approval. *Mitigation:* Reviewers cannot submit verdicts; they submit attributable typed observations with source locators. Verifier evaluates the predicate deterministically.
4. **Scope Escalation via Read Authority:** Verifier readback attempts unauthorized external data extraction. *Mitigation:* Prepared reads enforce static operation templates and qualified scopes. Read grants are single-use, short-lived (<=30s), and restricted to the `readback` role.
5. **Late Result Resurrection:** Stale verification result arrives after case cancellation or superseding mutation. *Mitigation:* Orchestrator compares current control generation and action generation before accepting a result.

## Test strategy

### Verification Matrices and Reference Proofs
- **Pure Core Unit Suite:** Deterministic AST evaluation, three-valued logic truth tables, exact checked decimal arithmetic without float rounding, division-by-zero guards, and currency mismatch rejections.
- **Contract Schema Validation:** Strict Draft 2020-12 validation with zero external network references and full RFC 8785 canonical digest verification.
- **Concrete Scenario Fixtures:**
  1. *Invoice / Purchase Order Reconciliation:* Verified zero variance, decimal mismatch ($100.05 vs $100.00), currency conflict (USD vs EUR -> `unknown`), missing parent fact.
  2. *Customer / Order Status Reconciliation:* Authoritative synchronous readback mismatch terminates immediately; eventual consistency polling verifies within confirmation window; unproven freshness yields `unknown`.
  3. *Support Exception Triage:* Authorized human reviewer assessment with valid source locators passes Stage 3; expired review deadline (86,400,000 ms) yields `unknown`.

## Performance and operations

### Operational Targets and Limits
- **Postcondition Evaluation Latency:** Pure core evaluation completes within 10 ms of evidence acquisition.
- **Concurrency Ceilings:** 32 active runs per tenant, 8 in-flight reads per tenant, 2 concurrent reads per connection, 32 per worker process.
- **Lease Durations:** Worker leases are 30 seconds with 10-second heartbeats. Reclaim increments the lease epoch.
- **Payload Limits:** Maximum 256 KiB per read response; maximum 2 MiB encrypted normalized fact snapshot per verification run.

## Architecture decisions and open questions

### Preserved Implementation Decisions
1. *Postcondition Condition Language:* Reuses Operational Graph `BusinessConditionV1`, typed facts, and three-valued semantics. No SQL predicates or foreign DSLs are introduced.
2. *Third-Party Systems Lacking Read APIs:* Certified as unconfirmable for automated verification; requires Stage 3 human reviewer assessment or remains bounded as `Outcome Unknown`.
3. *Eventual Consistency Handling:* Bounded polling window defaults to 30,000 ms (maximum 300,000 ms) with certified freshness proofs.
4. *Permanent Unknown Disposition:* Pauses case execution, enqueues incident fact, and routes to owner for reconciliation. No background recheck loops or uncoordinated mutation retries.

### Handoff Answers ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Independent outcome verification specifications, readback polling scheduling, pure predicate evaluation, verdict immutability, and evidence snapshot custody.
2. *Data ingress/egress:* Ingests submission receipts, prepared reads, signed readbacks, and reviewer assessments; outputs immutable verdicts, result attestations, mismatch reports, and advisory explanations.
3. *Versions/identities:* Spec UUID and revision, Verification Request UUIDv4, Verification ID, Attempt ID, Read Claim ID, and Result SHA256.
4. *Upstream failure:* Missing or unproven readback evidence yields `Outcome Unknown`, halting downstream progression safely.
5. *Authority:* Sole business correctness authority for autonomous agent execution completion.
6. *Testing without private details:* Tested via pure AST assertions, deterministic digest/signature vectors, and synthetic business state fixtures.
7. *Audit and duplicate prevention:* Every verdict is hashed and signed with Vault Ed25519; requests are deduplicated by `(organization_id, request_id)` with replay tombstones.
8. *Failure blast radius:* Verifier failure blocks case completion; fails closed to prevent unverified mutations from committing.
9. *v1.0 criteria:* Enables ORY-034, ORY-043, and ORY-044 verified through postcondition mismatch, freshness qualification, and timeout test suites.
