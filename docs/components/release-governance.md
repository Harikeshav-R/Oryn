# Release, Rollout, and Change Governance Component Specification

Status: Detailed technical specification — implementation pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§6.10, 7.2, 9.2, 9.5](../../TECHNICAL.md) | [PRODUCT.md §§14, 20.6, 21, 29.7; ORY-030, ORY-055–058, ORY-067](../../PRODUCT.md) | [ADR-0022](../adr/0022-release-eligibility-and-rollout-governance.md)

### Core Responsibility
Release, Rollout, and Change Governance authorizes which immutable agent candidate version or assist plan is eligible to serve which organization, workflow, explicit case cohort, and autonomy stage. It governs progressive named-cohort rollouts, enforces empirical readiness gates, evaluates rollout health telemetry via deterministic integer arithmetic, issues synchronous execution fences, and conducts atomic version restorations.

### Owns
- Formal release lifecycle and stage gate verification (Stage 0 through Stage 5) across agents and assist plans.
- Immutable mapping of approved versions to explicit tenant workflows and named case cohorts (`ReleaseCohortV1`).
- Progressive rollout policies (`RolloutPolicyV1`), phased cohort expansions, and deterministic health thresholds (`RolloutHealthPolicyV1`).
- Scoped cohort safety fences (`ReleaseCohortFenceV1`) and atomic version restoration (`restore_named`).
- Narrow Stage 5 automated repair preauthorizations (`ReleasePreauthorizationV1`) and patch qualification.
- Dual-signed assist release eligibility attestations (`SignedAssistReleaseEligibilityV1`).
- Authoritative release history, semantic diff evaluation (`ReleaseDiffV1`), and audit journals.

### Consumes
- Immutable candidate bundles and manifests from [agent-factory-ir](agent-factory-ir.md) (Contract 7).
- Vault-signed scenario evaluation reports and coverage matrices from [flight-simulator](flight-simulator.md) (Contract 8).
- Formal governance proposals and one-use approval consumptions from [identity-policy](identity-policy.md) (Contract 11).
- Live 30-day operation qualification attestations from [application-adapters](application-adapters.md) (Contract 12).
- Transactional dependency registration and live rule eligibility from [operational-graph](operational-graph.md) (Contract 15).
- Real-time case execution outcomes and telemetry checkpoints from [job-orchestration](job-orchestration.md) (Contract 9) and [outcome-verification](outcome-verification.md) (Contract 18).
- High-severity incident restrictions and containment directives from [incident-correction-repair](incident-correction-repair.md) (Contract 21).

### Produces
- Authoritative job release eligibility assignments (`JobReleaseEligibilityV1`) delivered via `ReleaseJobAdmissionPort::resolve` to [job-orchestration](job-orchestration.md).
- Vault-signed assist plan release attestations (`SignedAssistReleaseEligibilityV1`) delivered via `resolve_assist` to [local-context-hud](local-context-hud.md) and [operational-graph](operational-graph.md).
- Scoped cohort safety fences (`ReleaseCohortFenceV1`) dispatched to [job-orchestration](job-orchestration.md) and [identity-policy](identity-policy.md).
- Bounded repair rollout observation summaries (`RepairReleaseObservationV1`) delivered to [incident-correction-repair](incident-correction-repair.md).
- Material change diffs (`ReleaseDiffV1`) and release projection views (`ReleaseViewV1`) delivered to [command-center-analytics](command-center-analytics.md).
- Audit journal entries (`AuthorityJournalEntryV1`) and outbox lifecycle events to the enterprise audit trail.

### Does Not Own
- Generating or editing behavioral IR, playbooks, or executable plans (owned by [agent-factory-ir](agent-factory-ir.md) and [contribution-sync](contribution-sync.md)).
- Executing simulation suites, synthetic trials, or regression evaluations (owned by [flight-simulator](flight-simulator.md)).
- Granting actor roles, evaluating user permissions, or overriding organizational authority (owned by [identity-policy](identity-policy.md)).
- Admitting jobs directly or executing runtime steps (owned by [job-orchestration](job-orchestration.md) and [agent-runtime](agent-runtime.md)).
- Investigating root-cause defects or closing incident records (owned by [incident-correction-repair](incident-correction-repair.md)).

### Boundary Requirement
- **No Synthetic Percentage Traffic Routers:** Traffic allocation is governed strictly by explicit named cohorts (`ReleaseCohortV1`) bound to unambiguous connection environments, vendor accounts, record types, and scopes. Synthetic hash-modulo or floating-point percentages are forbidden.
- **Product-Minimum Remits:** Production release authorization defaults to the designated Workflow Owner. Security Officer approval is required only when permissions expand or organizational policy explicitly demands stricter fencing. Universal dual Owner/Security sign-offs are not required for standard releases.
- **Independence of Simulation and Release:** Simulation passage in [flight-simulator](flight-simulator.md) is a necessary prerequisite, never an autonomous grant of production authority. Production execution strictly requires an active, unexpired 30-day operation qualification certificate under Contract 12.
- **Restoration Truthfulness:** Version restoration (`restore_named`) restores execution eligibility for new jobs by pointing the active cohort mapping to an exact, fully re-validated historical predecessor. Restoration never claims to undo, cancel, or rewrite external mutations already committed by running or superseded versions.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§14, 20.6, 21, 29.7; ORY-030, ORY-055–058, ORY-067](../../PRODUCT.md))
- **Enforced Autonomy Gates (ORY-030):** Enforces rigorous empirical prerequisites before granting autonomy stages:
  - *Stage 3 (Supervised Task Execution):* Minimum 5 distinct verified real human Task Instances, 25 semantically distinct scenarios (including 5 edge/negative cases), 100% branch coverage, passing mandatory checks, and Workflow Owner sign-off.
  - *Stage 4 (Supervised Job Execution):* Minimum 100 distinct scenarios (including 20 edge/negative/failure cases), 20 consecutive independently system-evidenced supervised cases (`system_evidence: true`) without deviation or streak interruption, and zero unresolved safety failures.
  - *Stage 5 (Monitored Autonomous Execution):* Established Stage 4 lineage, complete regression obligation fulfillment, verified prevention specs, 5 new nearby variations, and zero applicable regressions.
- **Regression Release Prevention (ORY-055):** Strictly blocks deployment of any candidate version or repair that introduces critical regressions, safety breaches, or unhandled exceptions in evaluation.
- **Restricted Canary Rollouts (ORY-056):** Enforces progressive rollout across ordered phases of named cohorts with explicit customer-approved health thresholds and fresh telemetry requirements.
- **Version Restoration Semantics (ORY-057):** Provides atomic version restoration that halts failing versions and re-establishes historical predecessor eligibility without manufacturing retroactive data rollback claims.
- **Automated Stage 5 Limits (ORY-058):** Limits automated repair releases strictly to narrow Tier 0/1 patches (`interaction_binding` and `string_format` with proved transitive dataflow safety) within an active, dual-authorized `ReleasePreauthorizationV1`.
- **Material Change Diffs (ORY-067):** Requires deterministic, reviewable visual and structural diffs (`ReleaseDiffV1`) identifying all affected JSON pointers, change classes, and dependency updates prior to approval.

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #8 (Flight Simulator Evaluation Ingress):** Ingests immutable `SignedEvaluationReportV1` (`simulation.evaluation-report.v1`) signed by the Vault `evaluation` key. Binds the evaluation report to the exact immutable `(agent_id, agent_version_id, behavior_sha256, manifest_sha256)` tuple. Re-verifies report validity, suite conditions, semantic fingerprint, and regression suite completeness. Production equivalence must already be established in the evaluation conditions for targeted connections; later equivalence certificates require a complete fresh evaluation.
- **Contract Reference #9 (Job Orchestration Admission Egress):** Implements `ReleaseJobAdmissionPort::resolve` delivering `JobReleaseEligibilityV1` to [job-orchestration](job-orchestration.md):
  ```rust
  #[async_trait]
  pub trait ReleaseJobAdmissionPort: Send + Sync {
      async fn resolve(
          &self,
          tx: &mut TenantTransaction,
          principal: &VerifiedPrincipal,
          request: &ReleaseJobAdmissionRequestV1,
      ) -> Result<JobReleaseEligibilityV1, JobProblemV1>;
  }
  ```
  Populates `canary_bucket_id` with the chosen named `cohort_id`. Enforces two-stage admission: preselection context check and final population validation using `population_sha256 = SHA256(RFC8785(ordered_records))`. Dispatches synchronous `ReleaseCohortFenceV1` to halt compromised cohorts.
- **Contract Reference #11 (Identity and Policy Authority):** Submits formal `SignedGovernanceProposalV1` (`identity.governance-proposal.v1`) for all human release decisions, binding the canonical `ReleaseApprovalSubjectV1` digest. Consumes approvals atomically within a 15-minute window via `consume_governance`:
  ```rust
  async fn consume_governance(
      &self,
      tx: &mut TenantTransaction,
      principal: &VerifiedPrincipal,
      proposal_id: Uuid,
      expected_object_sha256: &str,
  ) -> Result<GovernanceConsumptionV1, IdentityProblemV1>;
  ```
  Applies fresh MFA requirements within 5 minutes for consequential actions. Enforces strict proposer-approver separation.
- **Contract Reference #12 (Application Adapter Qualifications):** Validates active `SignedQualificationAttestationV1` instances. Candidate versions targeting live application capabilities require active, unexpired 30-day operation qualifications across all targeted connection environments.
- **Contract Reference #15 (Operational Graph Ingress/Egress):** Verifies transactional `DependencyManifestV1` registration and live rule eligibility via `resolve_eligibility`. Enforces the tenant `graph_knowledge_guard`. Produces `SignedAssistReleaseEligibilityV1` for assist plans.
- **Assist Guidance Admission Egress:** Exposes `resolve_assist` for local desktop HUD guidance plans:
  ```rust
  async fn resolve_assist(
      &self,
      tx: &mut TenantTransaction,
      principal: &VerifiedPrincipal,
      request: &AssistReleaseAdmissionRequestV1,
  ) -> Result<SignedAssistReleaseEligibilityV1, ReleaseProblemV1>;
  ```
- **Contract Reference #18 (Outcome Verification Integration):** Synchronously ingests case completion outcomes and system evidence attestations to track the 20-case consecutive supervised streak. Streak sequence is locked to the exact candidate identity, context, and declared evidence scope.
- **Contract Reference #21 (Incident Correction and Repair Interface):** Delivers bounded `RepairReleaseObservationV1` records with exact `observation_ref` bindings and complete incident manifests. Synchronously respects containment restrictions.
- **Contract Reference #22 (Cloud Inference Baseline):** Diff categorization and presentation formatting may consume `text.reason` via LiteLLM under [cloud-inference](../architecture/cloud-inference.md); release gating and authority promotion never execute AI inference.

### Management Transport Routes (OpenAPI 3.1)
All routes operate over confidential TLS, require tenant-scoped authentication, enforce CSRF protection, and support RFC 9457 problem details:

| Route | Input / Output | Required Permission | Description |
|---|---|---|---|
| `POST /v1/releases` | `ReleaseDefinitionV1` -> 201 `ReleaseViewV1` | `agent.edit` | Creates draft release definition. |
| `GET /v1/releases` | Cursor query -> 200 `ReleaseViewV1` page | `agent.edit` or `release.approve` | Lists authorized releases with pagination (max 100). |
| `GET /v1/releases/{release_id}` | Path param -> 200 `ReleaseViewV1` | Scoped release read | Retrieves release details and active cohort states. |
| `GET /v1/releases/{release_id}/readiness` | Path param -> 200 `ReleaseReadinessV1` | Scoped release read | Returns empirical readiness assessment and findings. |
| `GET /v1/releases/{release_id}/diff` | Path param -> 200 `ReleaseDiffV1` | Scoped release read + source visibility | Evaluates structural and behavioral diff against base. |
| `POST /v1/releases/{release_id}/commands` | `ReleaseCommandV1` -> 200 `ReleaseViewV1` or 202 `OperationV1` | Command-specific (see Section 6) | Dispatches release lifecycle transitions. |
| `GET /v1/releases/{release_id}/observations` | Path param -> 200 `RolloutObservationV1` page | Scoped release read | Returns paginated rollout telemetry observations. |
| `GET /v1/releases/{release_id}/observations/{observation_id}/members` | Path param -> 200 member page | Scoped release/evidence read | Returns content-free case and incident references. |
| `POST /v1/releases/preauthorizations` | `ReleasePreauthorizationV1` -> 201 grant | `release.approve` + Owner approval | Registers Stage 5 automated repair preauthorization. |
| `POST /v1/releases/preauthorizations/{preauthorization_id}/revocations` | Revocation payload -> 200 grant | Owner `release.approve` or Security authority | Revokes Stage 5 preauthorization grant. |

### Release Error Codes (`ReleaseErrorCodeV1`)
1. `RELEASE_NOT_AUTHORIZED` (403): Caller lacks required remit or separation of duties is breached.
2. `RELEASE_REVISION_CONFLICT` (409): Concurrent CAS mutation conflict on release head or policy.
3. `RELEASE_TARGET_MISMATCH` (422): Candidate identity digest does not match evaluation target.
4. `RELEASE_EVALUATION_INVALID` (422): Simulator report signature invalid, expired, or incomplete.
5. `RELEASE_STAGE_GATE_UNMET` (422): Empirical thresholds (human examples, scenarios, streak) unsatisfied.
6. `RELEASE_REGRESSION_PRESENT` (422): Unresolved regression or safety failure detected in candidate.
7. `RELEASE_KNOWLEDGE_INELIGIBLE` (422): Operational graph rule conflict, supersession, or missing manifest.
8. `RELEASE_QUALIFICATION_INVALID` (422): Targeted connection operation qualification missing or expired.
9. `RELEASE_SCOPE_UNPROVEN` (422): Requested cohort scope exceeds evaluated and authorized scope.
10. `RELEASE_COHORT_AMBIGUOUS` (409): Unspecified cohort matches multiple active cohorts.
11. `RELEASE_COHORT_INELIGIBLE` (422): Specified cohort does not match selection scope or connection.
12. `RELEASE_POLICY_INCOMPLETE` (422): Rollout policy missing mandatory health criteria or phases.
13. `RELEASE_APPROVAL_STALE` (409): Proposal approval expired (15m window) or unconsumed.
14. `RELEASE_PREAUTHORIZATION_INVALID` (422): Preauthorization grant expired, revoked, or mismatched.
15. `RELEASE_PATCH_INELIGIBLE` (422): Diff exceeds allowed patch categories or fails dataflow proof.
16. `RELEASE_OBSERVATION_INCOMPLETE` (422): Telemetry window unelapsed or pending cases unresolved.
17. `RELEASE_TELEMETRY_STALE` (422): Telemetry lag exceeds approved threshold (`max_telemetry_lag_seconds`).
18. `RELEASE_RESTORE_INELIGIBLE` (422): Named restoration predecessor missing, conflicting, or ineligible.
19. `RELEASE_RECOVERY_INCOMPLETE` (503): Durability checkpoint pending or journal gap detected.
20. `RELEASE_LIMIT_EXCEEDED` (422): Request size, entity count, or cohort limit exceeded.

## Trust and deployment boundaries

### Process and Security Boundaries
- **Control Plane Isolation:** Release Governance runs within the trusted control-plane boundary. It exposes APIs exclusively through the authenticated API Gateway and communicates with databases over mutual TLS.
- **Proposer-Approver Separation:** The actor who authored, modified, or proposed an agent candidate or release definition cannot approve that release. Enforced cryptographically via Identity governance proposals.
- **Workload Security:** Background automation controllers operate under dedicated service principals restricted strictly to preauthorized actions. Service principals can never manufacture or forge human approval verdicts.
- **Tenant Isolation:** All relational tables enforce PostgreSQL Row-Level Security (RLS) keyed by `organization_id`. Cross-tenant release references, predecessors, or approvals fail validation immediately.
- **Cloud Inference Boundary:** Candidate diff rendering may utilize LiteLLM for markdown formatting; the evaluation of safety gates, thresholds, and admission decisions is 100% deterministic local Rust code.

## Internal architecture

### Logical Submodules
1. **ReadinessEvaluator:** Evaluates candidate version compliance against Stage 3, Stage 4, and Stage 5 requirements. Ingests evaluation reports, checks 30-day operation qualifications, validates graph eligibility snapshots, and tracks the 20-case consecutive supervised streak.
2. **ReleaseDiffClassifier:** Analyzes structural AST and IR differences between base and candidate definitions. Categorizes changes into 10 closed classes, verifies RFC 6901 JSON pointers, and performs deterministic transitive dataflow analysis for `string_format` patches.
3. **RolloutHealthEvaluator:** Processes real-time case disposition telemetry. Uses exact integer arithmetic (`numerator * 10000 > limit_bps * started_case_count`) to detect error spikes, monitors telemetry lag, and identifies regressions.
4. **ReleaseCoordinator:** Orchestrates release lifecycle transitions, manages formal Identity proposal creation and consumption, executes CAS head mutations, splits journal after-images, and manages the `durability_pending` commit protocol.
5. **ReleaseAdmission:** Implements `ReleaseJobAdmissionPort::resolve` and `resolve_assist`. Enforces two-stage population validation, verifies cohort bindings, detects ambiguous cohort matches, and prevents cross-cohort population leakage.
6. **RolloutController:** Manages monotonic phase transitions across named cohorts, schedules telemetry reconciliations, and issues synchronous safety fences (`ReleaseCohortFenceV1`).

```
                                  +---------------------------------------------+
                                  |         Control Plane API Gateway           |
                                  +---------------------------------------------+
                                                         |
                                                         v
                                  +---------------------------------------------+
                                  |             ReleaseCoordinator              |
                                  +---------------------------------------------+
                                    /       |                     |                                             /        |                     |                                             v         v                     v            v
           +-----------------------+ +------------------+ +---------------+ +-----------------------+
           |   ReadinessEvaluator  | |DiffClassifier    | |AdmissionPort  | |RolloutHealthEvaluator |
           +-----------------------+ +------------------+ +---------------+ +-----------------------+
              |           |                  |                   |                      |
              v           v                  v                   v                      v
        +-----------+ +-----------+    +-----------+      +---------------+       +-----------+
        | Simulator | | Graph     |    | IR AST    |      | Orchestration |       | Outcome   |
        | Report    | | Knowledge |    | Dataflow  |      | Job Admission |       | Telemetry |
        | Ingress   | | Guard     |    | Engine    |      | Port          |       | Checkpoint|
        +-----------+ +-----------+    +-----------+      +---------------+       +-----------+
```

### Relational Database Schema (PostgreSQL DDL)

```sql
-- 1. Immutable release definitions
CREATE TABLE release_definition (
    organization_id UUID NOT NULL,
    release_id UUID NOT NULL,
    definition_revision NUMERIC(20,0) NOT NULL,
    definition_sha256 VARCHAR(64) NOT NULL,
    target_kind VARCHAR(32) NOT NULL,
    agent_id VARCHAR(128),
    workflow_id VARCHAR(128) NOT NULL,
    requested_autonomy_stage SMALLINT NOT NULL CHECK (requested_autonomy_stage IN (3, 4, 5)),
    risk_tier SMALLINT NOT NULL CHECK (risk_tier BETWEEN 0 AND 3),
    owner_actor_id VARCHAR(128) NOT NULL,
    proposer_actor_id VARCHAR(128) NOT NULL,
    predecessor_release_id UUID,
    evaluation_report_id UUID NOT NULL,
    rollout_policy_id UUID NOT NULL,
    rollout_policy_revision NUMERIC(20,0) NOT NULL,
    preauthorization_id UUID,
    canonical_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, release_id, definition_revision),
    CONSTRAINT chk_agent_target CHECK (
        (target_kind = 'agent' AND agent_id IS NOT NULL) OR
        (target_kind = 'assist_plan' AND agent_id IS NULL AND requested_autonomy_stage = 3)
    )
);
ALTER TABLE release_definition ENABLE ROW LEVEL SECURITY;

-- 2. Release head and state CAS pointer
CREATE TABLE release_head (
    organization_id UUID NOT NULL,
    release_id UUID NOT NULL,
    head_revision NUMERIC(20,0) NOT NULL,
    definition_revision NUMERIC(20,0) NOT NULL,
    lifecycle_state VARCHAR(32) NOT NULL,
    active_phase_id VARCHAR(128),
    durability_pending BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, release_id),
    FOREIGN KEY (organization_id, release_id, definition_revision) 
        REFERENCES release_definition(organization_id, release_id, definition_revision)
);
ALTER TABLE release_head ENABLE ROW LEVEL SECURITY;

-- 3. Named cohort bindings
CREATE TABLE release_cohort_binding (
    organization_id UUID NOT NULL,
    binding_id UUID NOT NULL,
    target_identity_key VARCHAR(256) NOT NULL,
    cohort_id VARCHAR(128) NOT NULL,
    release_id UUID NOT NULL,
    definition_revision NUMERIC(20,0) NOT NULL,
    autonomy_stage SMALLINT NOT NULL CHECK (autonomy_stage IN (3, 4, 5)),
    eligibility_generation NUMERIC(20,0) NOT NULL,
    cohort_payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, binding_id),
    UNIQUE (organization_id, target_identity_key, cohort_id)
);
ALTER TABLE release_cohort_binding ENABLE ROW LEVEL SECURITY;

-- 4. Identity proposal consumption ledger
CREATE TABLE release_approval_consumption (
    organization_id UUID NOT NULL,
    consumption_id UUID NOT NULL,
    proposal_id UUID NOT NULL,
    proposal_revision NUMERIC(20,0) NOT NULL,
    release_id UUID NOT NULL,
    definition_sha256 VARCHAR(64) NOT NULL,
    object_digest VARCHAR(64) NOT NULL,
    approval_subject JSONB NOT NULL,
    consumed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, consumption_id),
    UNIQUE (organization_id, proposal_id, proposal_revision)
);
ALTER TABLE release_approval_consumption ENABLE ROW LEVEL SECURITY;

-- 5. Stage 5 repair preauthorization grants
CREATE TABLE release_preauthorization (
    organization_id UUID NOT NULL,
    preauthorization_id UUID NOT NULL,
    revision NUMERIC(20,0) NOT NULL,
    workflow_id VARCHAR(128) NOT NULL,
    base_release_id UUID NOT NULL,
    base_definition_sha256 VARCHAR(64) NOT NULL,
    rollout_policy_sha256 VARCHAR(64) NOT NULL,
    organization_policy_revision NUMERIC(20,0) NOT NULL,
    generation NUMERIC(20,0) NOT NULL,
    state VARCHAR(32) NOT NULL CHECK (state IN ('enabled', 'revoked')),
    valid_from TIMESTAMPTZ NOT NULL,
    not_after TIMESTAMPTZ NOT NULL,
    grant_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, preauthorization_id, revision)
);
ALTER TABLE release_preauthorization ENABLE ROW LEVEL SECURITY;

-- 6. Cohort safety fences
CREATE TABLE release_cohort_fence (
    organization_id UUID NOT NULL,
    release_id UUID NOT NULL,
    cohort_id VARCHAR(128) NOT NULL,
    generation NUMERIC(20,0) NOT NULL,
    state VARCHAR(32) NOT NULL CHECK (state IN ('active', 'cleared')),
    effect VARCHAR(32) NOT NULL CHECK (effect IN ('pause_execution', 'pause_writes', 'stop_new_jobs')),
    reason_code VARCHAR(64) NOT NULL,
    fence_payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, release_id, cohort_id)
);
ALTER TABLE release_cohort_fence ENABLE ROW LEVEL SECURITY;

-- 7. Supervised case streak ledger
CREATE TABLE release_case_evidence (
    organization_id UUID NOT NULL,
    job_id UUID NOT NULL,
    case_id VARCHAR(128) NOT NULL,
    sequence_head_id UUID NOT NULL,
    case_ordinal NUMERIC(20,0) NOT NULL,
    release_id UUID NOT NULL,
    cohort_id VARCHAR(128) NOT NULL,
    candidate_identity VARCHAR(256) NOT NULL,
    connection_id VARCHAR(128) NOT NULL,
    disposition VARCHAR(32) NOT NULL,
    system_evidence BOOLEAN NOT NULL,
    ever_disqualified BOOLEAN NOT NULL,
    first_disqualifier VARCHAR(64),
    verifier_attestation_ref VARCHAR(256),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, job_id, case_id),
    UNIQUE (organization_id, sequence_head_id, case_ordinal)
);
ALTER TABLE release_case_evidence ENABLE ROW LEVEL SECURITY;

-- 8. Monotonic sequence heads for supervised streaks
CREATE TABLE release_sequence_head (
    organization_id UUID NOT NULL,
    sequence_head_id UUID NOT NULL,
    candidate_identity VARCHAR(256) NOT NULL,
    cohort_id VARCHAR(128) NOT NULL,
    connection_id VARCHAR(128) NOT NULL,
    evidence_scope_sha256 VARCHAR(64) NOT NULL,
    current_ordinal NUMERIC(20,0) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, sequence_head_id),
    UNIQUE (organization_id, candidate_identity, cohort_id, connection_id, evidence_scope_sha256)
);
ALTER TABLE release_sequence_head ENABLE ROW LEVEL SECURITY;

-- 9. Rollout observations
CREATE TABLE release_observation (
    organization_id UUID NOT NULL,
    observation_id UUID NOT NULL,
    revision NUMERIC(20,0) NOT NULL,
    release_id UUID NOT NULL,
    definition_sha256 VARCHAR(64) NOT NULL,
    phase_id VARCHAR(128) NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    source_high_watermark NUMERIC(20,0) NOT NULL,
    started_case_count NUMERIC(20,0) NOT NULL,
    verified_case_count NUMERIC(20,0) NOT NULL,
    failed_case_count NUMERIC(20,0) NOT NULL,
    mismatch_case_count NUMERIC(20,0) NOT NULL,
    unknown_case_count NUMERIC(20,0) NOT NULL,
    pending_case_count NUMERIC(20,0) NOT NULL,
    new_incident_count NUMERIC(20,0) NOT NULL,
    health_status VARCHAR(32) NOT NULL,
    completeness VARCHAR(32) NOT NULL,
    case_manifest_sha256 VARCHAR(64) NOT NULL,
    incident_manifest_sha256 VARCHAR(64) NOT NULL,
    PRIMARY KEY (organization_id, observation_id, revision)
);
ALTER TABLE release_observation ENABLE ROW LEVEL SECURITY;

-- 10. Observation membership mapping (content-free references)
CREATE TABLE release_observation_member (
    organization_id UUID NOT NULL,
    observation_id UUID NOT NULL,
    member_type VARCHAR(16) NOT NULL CHECK (member_type IN ('case', 'incident')),
    member_ordinal NUMERIC(20,0) NOT NULL,
    resource_id VARCHAR(128) NOT NULL,
    version_id VARCHAR(128) NOT NULL,
    content_sha256 VARCHAR(64) NOT NULL,
    PRIMARY KEY (organization_id, observation_id, member_type, member_ordinal)
);
ALTER TABLE release_observation_member ENABLE ROW LEVEL SECURITY;

-- 11. Authoritative telemetry checkpoint
CREATE TABLE release_telemetry_checkpoint (
    organization_id UUID NOT NULL,
    release_id UUID NOT NULL,
    phase_id VARCHAR(128) NOT NULL,
    source_high_watermark NUMERIC(20,0) NOT NULL,
    source_reconciled_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (organization_id, release_id, phase_id)
);
ALTER TABLE release_telemetry_checkpoint ENABLE ROW LEVEL SECURITY;

-- 12. Tamper-evident release history
CREATE TABLE release_history (
    organization_id UUID NOT NULL,
    history_id UUID NOT NULL,
    release_id UUID NOT NULL,
    command_action VARCHAR(32) NOT NULL,
    prior_state VARCHAR(32) NOT NULL,
    new_state VARCHAR(32) NOT NULL,
    actor_principal VARCHAR(128) NOT NULL,
    subject_digest VARCHAR(64) NOT NULL,
    reason TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, history_id)
);
ALTER TABLE release_history ENABLE ROW LEVEL SECURITY;
```

### Global Lock Ordering and Concurrency Rules
To guarantee deadlock-free concurrency across all participating control plane services, locks must be acquired strictly in the following published order:
1. **Identity Authority Guards:** Sorted by `(organization_id, principal_id)`.
2. **Custody / Stage / Factory Guards:** When applicable for candidate lifecycle operations.
3. **Adapter Registry Guard:** Global tenant adapter qualification lock.
4. **Tenant Operational Graph Guard:** Global tenant `graph_knowledge_guard` and canonical graph entity rows.
5. **Release Heads, Cohort Bindings, and Fences:** Sorted ascending by primary key UUID / ID.
6. **Release Sequence Heads:** Monotonic ordinal sequence head rows.
7. **Orchestration Job and Case Rows:** Specific job execution rows and reservations.

**Concurrency Constraints:**
- **Zero I/O under Locks:** No network calls, Vault Ed25519 signing operations, cloud inference requests, or unindexed database scans may execute while holding locks.
- **Two-Phase Commit Protocol (`durability_pending`):** Mutations commit prepared state with `durability_pending = true`. Expanded authority is exposed only after the matching `AuthorityJournalEntryV1` checkpoint is fully committed. Fences deny immediately even while `durability_pending = true`.
- **Journal Split Rule:** If a single atomic transaction produces more than 128 journal after-images, after-images are split into consecutive entries of at most 128, tied by one mutation ID, with a single checkpoint on the final entry.

## State and lifecycle

### Complete 14-State Lifecycle Machine

```
                    +--------------------+
                    |       Draft        |<----------------------+
                    +--------------------+                       |
                              | request_review                   |
                              v                                  |
                    +--------------------+                       |
     +------------->|  Review Requested  |                       |
     |              +--------------------+                       |
     |                /        |        \                        |
     | changes_      /         |         \ reject                |
     | requested    v          |          v                      |
     |     +-------------+     |     +------------+              |
     +-----|Changes Req. |     |     |  Rejected  |              |
           +-------------+     |     +------------+              |
                               v approve                         |
                        +--------------+                         |
                        |   Approved   |                         |
                        +--------------+                         |
                               | activate (phase 1)              |
                               v                                 |
                        +--------------+                         |
          +------------>|LimitedRelease|                         |
          | expand      +--------------+                         |
          +--(next phase) /    |   \                             |
                         /     |    \ pause / restrict           |
            all phases  /      |     v                           |
             complete  /       |   +-----------------------+     |
                      v        |   | Paused / Restricted   |     |
              +--------------+ |   | Needs Revalidation    |     |
              |    Active    | |   +-----------------------+     |
              +--------------+ |          |                      |
                      |        |          | restore_named        |
                      |        |          v                      |
                      |        |   +-----------------------+     |
                      |        +-->|        Reverted       |-----+
                      |            +-----------------------+ (re-establish
                      v supersede                               predecessor)
              +--------------+
              |  Superseded  |
              +--------------+
                      | retire
                      v
              +--------------+
              |   Retired    |
              +--------------+
                      | archive
                      v
              +--------------+
              |   Archived   |
              +--------------+
```

### State Definitions and Transition Rules
1. `draft`: Initial definition authored under `agent.edit`. No execution authority. Can transition to `review_requested` or `withdrawn`.
2. `review_requested`: Formal Identity governance proposal active. Awaiting Workflow Owner decision. Can transition to `approved`, `changes_requested`, `rejected`, or `withdrawn`.
3. `changes_requested`: Owner requested revisions. Requires new definition revision; closes proposal.
4. `rejected`: Owner rejected proposal. Terminal for this definition revision.
5. `approved`: Proposal approved via `SignedGovernanceProposalV1`. Ready for Phase 1 activation.
6. `limited_release`: Actively routing traffic to an initial named cohort subset (Phase 1..N-1). Monitored under `RolloutHealthPolicyV1`. Can transition to next phase, `active`, `paused`, `restricted`, or `needs_revalidation`.
7. `active`: All configured phases complete; fully active across all authorized cohorts. Monitored continuously.
8. `paused`: Temporarily halted across some or all cohorts due to operator command or error threshold breach. Running jobs pin; new jobs blocked. Can `resume` to `limited_release` or `restore_named`.
9. `restricted`: Synchronously halted due to high-severity incident or safety fence. Requires formal sign-off to lift.
10. `needs_revalidation`: Telemetry lag exceeded or operational graph dependency updated. Re-evaluates before resuming.
11. `superseded`: Atomically replaced by a newer approved release definition on all cohorts. Existing running jobs remain pinned until completion.
12. `reverted`: Replaced by a historical predecessor via `restore_named`. Retains audit facts; new jobs route to restored version.
13. `retired`: Release taken out of service permanently.
14. `withdrawn`: Author pulled draft/review prior to deployment.
15. `archived`: Historical record preserved under 24-month audit retention; unreferenced by active routing.

### Version Restoration Protocol (`restore_named`)
1. **Immediate Synchronous Fencing:** Dispatches a `ReleaseCohortFenceV1` halting new job starts on the failing release across affected cohorts.
2. **Predecessor Re-Verification:** Resolves the exact named predecessor definition (`predecessor_release_id`, `predecessor_definition_sha256`). Re-verifies all empirical gates, operation qualifications, and operational graph rules against live state. If stale or conflicted, returns `RELEASE_RESTORE_INELIGIBLE` and remains paused.
3. **Atomic Pointer Repointing:** Under tenant lock, updates `release_cohort_binding` for affected cohorts to point to the restored predecessor with an incremented `eligibility_generation`.
4. **Running Job Invariance:** Running jobs remain pinned to their original release/version; restoration never cancels or retroactively alters running or completed jobs.
5. **Audit Trail Preservation:** Transitions the failing release to `reverted` and logs a full audit entry in `release_history`.

## Error and edge-case behavior

### Rollout Health Integer Arithmetic
Health evaluations avoid floating-point math entirely. For an observation with `started` cases, `failed` cases, and `unknown` cases:
- **Failure Rate Breach:** `failed * 10000 > max_failure_rate_bps * started`
- **Unknown Rate Breach:** `unknown * 10000 > max_unknown_rate_bps * started`
- **Absolute Count Breach:** `failed > max_failed_cases` OR `unknown > max_unknown_cases`
- **Telemetry Lag Breach:** `(now - source_reconciled_at) > max_telemetry_lag_seconds`

### Handling Stale Telemetry and Network Realities
- **Telemetry Stale Halt:** If telemetry reconciliation lags, the system transitions the phase to `telemetry_stale` and synchronously fences new job admissions. It never assumes silence means success.
- **Network Boundary Realism:** In-flight HTTP/RPC requests already transmitted to external vendor endpoints cannot be recalled or rolled back by a release fence. Fences act strictly as barriers against future job admission and future action dispatches at safe primitive boundaries.
- **Ambiguous Cohorts:** If a job request does not supply a `cohort_id` and selection attributes match multiple active cohorts, the request fails with `RELEASE_COHORT_AMBIGUOUS`. Automatic fallback routing is strictly forbidden.

## Observability and audit

### Outbox Event Bus Architecture
All release state transitions emit structured events to the transactional outbox:
- `release.requested`: Review requested for candidate release definition.
- `release.approved`: Formal approval registered (human or Stage 5 preauthorized).
- `release.activated`: Phase 1 rollout initiated on named cohort.
- `release.expanded`: Rollout advanced to subsequent named cohort phase.
- `release.paused`: Rollout halted across specified cohorts.
- `release.reverted`: Historical version restored; failing version marked reverted.
- `release.revalidation_required`: Telemetry lag or graph dependency change triggered recheck.
- `release.retired`: Release retired from active service.

### Tamper-Evident Audit Ledger
All transitions, approval digests, observations, and fences are captured in `release_history` and `AuthorityJournalEntryV1`. Records include tenant ID, release ID, actor principal, command action, prior state, new state, subject digest, evidence refs, and timestamps. Retained for 24 months under enterprise audit compliance.

## Security and threat model

### Threat Analysis and Mitigations
1. **Bypassing Release Gates:** Attacker attempts to deploy unverified code. *Mitigation:* Cryptographic verification of Vault `evaluation` Ed25519 signature on simulation report, strict check of 20-case supervised streak, and verification of 30-day adapter qualification.
2. **Unauthorized Version Promotion:** Attacker attempts to promote candidate to autonomous stage. *Mitigation:* Identity governance proposal requirement with MFA within 5 minutes, enforcing Workflow Owner remit and proposer-approver separation.
3. **Canary Poisoning via Duplicate Verification:** Attacker re-verifies failed cases to game pass counts. *Mitigation:* Monotonic sequence head assigns case ordinal once; re-verifications update outcome but can never erase a streak break or historical disqualifier.
4. **Cross-Cohort Contamination:** Attacker attempts to run broad population against a narrow canary. *Mitigation:* Two-stage population validation hashing exact record references (`population_sha256 = SHA256(RFC8785(ordered_records))`).
5. **Replay of Stale Governance Approvals:** Attacker replays historical approval. *Mitigation:* Strict 15-minute consumption window (`GovernanceConsumptionV1`) keyed by `(organization_id, proposal_id, proposal_revision)` enforced under database constraint.

## Test strategy

### Contract Verification Reference Proof
The normative wire contracts, canonical digest algorithms, signature verifications, and pure reference semantic calculations are validated by the executable test harness in [release-governance-v1.fixtures.json](../architecture/contracts/release-governance-v1.fixtures.json), passing 191 contract cases:
- 19 direct wire schema validation cases covering all release definitions, policies, readiness records, observations, and cross-schema bindings.
- 21 semantic cases covering cohort selection resolution, supervised streak calculations, and integer rollout health evaluations.
- 4 canonical RFC 8785 digest vectors.
- 5 Ed25519 signature vectors for assist release eligibility envelopes.

### Runtime Acceptance Scenarios (12 Scenarios)

| Scenario ID | Test Input & Preconditions | Execution Interleaving | Durable State Verification | Visible Outcome & Assertions |
|---|---|---|---|---|
| `scen_stage3_human_examples_enforced` | Candidate agent submitted with 4 verified human examples and 25 scenarios. | Proposer submits `POST /v1/releases/{id}/commands` with `action: "request_review"`. | `release_head.lifecycle_state = 'review_requested'`. Readiness evaluator executes. | `ReleaseReadinessV1.status = 'blocked'`; findings include `RELEASE_STAGE_GATE_UNMET` citing human example count < 5. Promotion blocked. |
| `scen_stage4_supervised_streak_broken` | Candidate agent at Stage 3 with 19 verified supervised cases; case 20 encounters mismatch. | Case 20 outcome reported via Outcome Verification attestation. | `release_case_evidence` marks case 20 `ever_disqualified = true`, `disposition = 'mismatch'`. | Maximal qualifying streak resets to 0. Stage 4 readiness evaluation returns `RELEASE_STAGE_GATE_UNMET`. |
| `scen_stage5_preauth_interaction_binding` | Stage 5 agent with preauthorized grant for `interaction_binding`; candidate updates ERP adapter version ref. | Service principal submits `POST /v1/releases/preauthorizations` automated repair. | `ReleaseDiffClassifier` verifies semantic schemas, permissions, and topology equality. | `ReleasePreauthorizationV1` consumes grant; release approved automatically with workload attribution; `release.approved` emitted. |
| `scen_stage5_preauth_rejected_dataflow` | Stage 5 candidate modifies literal string in `concat` node reaching SQL query condition. | Preauthorized patch evaluation runs through `ReleaseDiffClassifier`. | Transitive dataflow engine traces string destination to record lookup fact. | Patch rejected with `RELEASE_PATCH_INELIGIBLE`; automatic release denied; routed to mandatory human review. |
| `scen_cohort_ambiguous_preflight_block` | Two active cohorts match selection scope; `JobPreviewRequestV1` omits `cohort_id`. | Job Orchestration calls `ReleaseJobAdmissionPort::resolve`. | Database bindings queried; exactly 2 matches returned. | Resolution returns `RELEASE_COHORT_AMBIGUOUS`; job preview blocked with actionable prompt to specify cohort. |
| `scen_cohort_population_partition_reject` | Selected population contains records from both `cohort_us_east` and `cohort_us_west`. | Adapter returns ordered records; `population_sha256` computed; resolve called. | Record vendor accounts and connections checked against cohort definition. | Admission fails with `RELEASE_COHORT_INELIGIBLE`; job start rejected; preview refuses to seal. |
| `scen_rollout_health_integer_breach` | Phase 1 running with `max_failure_rate_bps: 500` (5%); 100 cases started, 6 fail. | 6th failure recorded; RolloutHealthEvaluator evaluates `6 * 10000 > 500 * 100` (60000 > 50000). | `RolloutObservationV1.health = 'breached'`; `ReleaseCohortFenceV1` inserted with `effect = 'pause_execution'`. | New job admission denied; running jobs halted at boundary; Command Center displays breached status. |
| `scen_telemetry_lag_stale_fence` | Phase running with `max_telemetry_lag_seconds: 300`; last checkpoint 350s ago. | Health reconciliation loop executes periodic audit. | `now - source_reconciled_at > 300`; checkpoint marked stale. | `RolloutObservationV1.health = 'telemetry_stale'`; synchronous cohort fence issued; expansion blocked. |
| `scen_emergency_restore_named_predecessor` | Release 2 breached; operator commands restore to named Release 1. | `ReleaseCommandV1` with `action: "restore"`, `predecessor_release_id = Release 1`. | Restores Release 1 after verifying live eligibility; updates `release_cohort_binding` atomically. | Release 2 marked `reverted`; Release 1 cohort binding generation incremented; running Release 2 jobs complete or fence; new jobs route to Release 1. |
| `scen_assist_dual_signature_verification` | Desktop HUD receives assist plan guidance bundle. | HUD validates Graph publisher signature, then validates Release Vault `policy` signature on eligibility. | Both public keys evaluated against trust store; plan digest verified. | Eligibility accepted; HUD renders guidance overlay. If Release signature corrupted, HUD rejects with `RELEASE_EVALUATION_INVALID`. |
| `scen_journal_durability_pending_split` | Large restoration mutates 200 cohort bindings across organizations. | `ReleaseCoordinator` prepares authority journal entries. | After-images split into two entries: Entry 1 (128 images), Entry 2 (72 images) with final checkpoint. | State committed with `durability_pending = true`; authority exposed only after Entry 2 checkpoint finalizes. |
| `scen_identity_governance_consumption_window` | Proposal approved; operator attempts consumption 16 minutes later. | `consume_governance` invoked with proposal ID. | `consumed_at - approved_at > 15 minutes` detected. | Consumption rejected with `RELEASE_APPROVAL_STALE`; release activation denied; requires fresh proposal. |

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- **Sub-Second Fence Durability:** Cohort safety fences (`ReleaseCohortFenceV1`) persist synchronously in PostgreSQL and Identity authority journals in < 250ms. Connected runtime workers acknowledge containment at safe primitive boundaries within ≤ 2 seconds.
- **Bounded Algorithmic Complexity:**
  - Diff classification executes in $O(V + E + P)$ where $V$ is IR nodes, $E$ transitions, and $P$ changed JSON pointers.
  - Admission resolve executes in $O(R)$ where $R$ is population size (bounded to max 1,000 records).
  - Manifest pages are strictly bounded to 100 rows per page.
- **Data Retention and Archiving:**
  - Active release definitions, heads, cohort bindings, and active preauthorizations are retained indefinitely while referenced.
  - Superseded release definitions, historical observations, member mappings, and journal audit logs follow the standard 24-month audit retention schedule.

## Architecture decisions and open questions

### Resolved Architecture Decisions (ADR-0022 Integration)
1. *Named Cohorts vs. Synthetic Percentages:* Resolved in ADR-0022. Oryn explicitly rejects synthetic percentage-based traffic routers. Progressive rollout operates exclusively across customer-defined named cohorts (`ReleaseCohortV1`) bound to specific connection environments, vendor accounts, and record types.
2. *Supervised Streak Inheritance:* Resolved in ADR-0022. Any material candidate replacement resets the 20-case consecutive supervised streak to zero. Candidates earn readiness through their own exact behavioral history. The sole exception is narrow Stage 5 preauthorized patches (`interaction_binding` and `string_format`) which preserve maintenance lineage under unchanged safety contracts.
3. *Truthful Version Restoration:* Resolved in ADR-0022. Restoring a version re-establishes routing eligibility for new jobs. It does not retroactively alter or claim to undo external vendor mutations committed by running or superseded versions.
4. *Single Assist Eligibility Contract:* Resolved in ADR-0022. `SignedAssistReleaseEligibilityV1` encapsulates the assist eligibility payload within a Vault-signed envelope, verified by Desktop HUD alongside the Graph publisher signature.

### Resolution of Specific Historic Questions
- **Question 1: Statistical thresholds for canary progression without false positives?**
  *Resolution:* Oryn enforces customer-defined integer thresholds (`RolloutHealthPolicyV1`) requiring elapsed time windows, minimum verified case counts, zero pending/unknown cases, and exact integer bps limits. Oryn never infers statistical thresholds or assumes absence of telemetry implies safety.
- **Question 2: How emergency stops handle in-flight multi-step transactions?**
  *Resolution:* Emergency stops synchronously persist safety fences in PostgreSQL and Identity journals. Runtime workers acknowledge containment at the nearest safe primitive step boundary. External network mutations already transmitted cannot be recalled and are logged for independent human reconciliation.
- **Question 3: UI diff representation for domain owners reviewing IR changes?**
  *Resolution:* `ReleaseDiffV1` generates structured, source-linked before/after business value comparisons across 10 closed change classes and RFC 6901 pointers, rather than unverified LLM summaries.
- **Question 4: Version restore coordination with external system reconciliation?**
  *Resolution:* Version restoration is decoupled from data compensation. Restoration atomically updates the cohort admission mapping for new jobs. External reconciliation is handled by Incident Detection and Correction ([incident-correction-repair](incident-correction-repair.md)).

### Component Handoff Contract ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. **Owns Exclusively:** Release readiness evaluation, named cohort mapping, progressive rollout health tracking, cohort safety fencing, version restoration, Stage 5 repair preauthorizations, and signed assist release eligibility attestations.
2. **Data Ingress / Egress:** Ingresses simulation reports, adapter qualifications, graph rule states, and execution telemetry; egresses active cohort admission eligibility, safety fences, signed assist attestations, and audit logs.
3. **Identities & Versions:** Organization ID (UUID), Release ID (UUID), Definition Revision (U64), Agent ID / Version UUID, Target Identity Digest (SHA-256), Cohort ID (Identifier).
4. **Upstream Failure Handling:** If simulator evidence is missing, expired, or unestablished in production equivalence, release evaluation fails closed (`RELEASE_EVALUATION_INVALID`). If telemetry lags, rollout halts (`telemetry_stale`).
5. **Authority & Decision Governance:** Workflow Owner is authoritative for production release approval; Security Officer required only for permission expansion or stricter policy. Automated Stage 5 authority strictly confined to active preauthorizations.
6. **Testing Without Secrets:** Verified via pure contract reference harnesses in `release-governance-v1.fixtures.json`, synthetic tenant keys, and deterministic AST dataflow fixtures.
7. **Audit & Duplicate Prevention:** Every decision recorded in append-only `release_history` and `AuthorityJournalEntryV1`. Proposals enforce 15-minute one-use consumption.
8. **Failure Blast Radius:** Governance failure halts new deployments and job admissions; existing running jobs continue under their pinned release and active safety fences.
9. **v1.0 Acceptance Criteria:** Full enforcement of ORY-030, ORY-055, ORY-056, ORY-057, ORY-058, and ORY-067 verified across 191 contract fixture cases and 12 runtime acceptance scenarios.
