# 0018. Job Orchestration, Qualified Selection, and Scheduling Architecture

Date: 2026-11-15

## Status

Accepted

Amends [0017-agent-runtime-execution-and-recovery.md](0017-agent-runtime-execution-and-recovery.md) (value custody, continuation executions, wide owner identifiers, and synchronous containment fencing).
Amended by [0019-flight-simulator-isolation-and-evaluation-evidence.md](0019-flight-simulator-isolation-and-evaluation-evidence.md) (evaluation-owned execution persistence in `orchestration_execution`), [0021-incident-correction-and-repair-governance.md](0021-incident-correction-and-repair-governance.md) (`incident_restriction` safety fences), [0022-release-eligibility-and-rollout-governance.md](0022-release-eligibility-and-rollout-governance.md) (`ReleaseJobAdmissionPort` cutover, named cohorts in preview/schedule, and `release_cohort` safety fences), [0024-infrastructure-security-custody-and-recovery.md](0024-infrastructure-security-custody-and-recovery.md) (post-restore replay fences, per-value DEK lifecycle, and occurrence lock recovery).

## Context

Oryn requires a durable, deterministic orchestration and scheduling architecture to coordinate agent executions across business populations, enforce operational concurrency and monetary budget caps, preserve cross-job mutation exclusions, manage human approval suspensions, and guarantee honest batch reporting.

Five grilling rounds established the following binding architectural choices:
1. Orchestration must operate as a PostgreSQL-backed Rust state machine within existing Control Plane API and Durable Worker roles; no Temporal, Cadence, or separate external workflow engine.
2. Job membership is strictly frozen at confirmation; no dynamic queue refill or silent record substitution during execution.
3. Recurring and event-driven schedules resolve eligible release versions per occurrence, pin the resulting job, and enforce an accountable execution sponsor whose current `job.run` authority is independently verified.
4. Cross-job mutation exclusions must conservatively protect vendor records across multiple connections and agents without depending on worker lease expirations to release locks.
5. Action generation formulas must durably record and enforce non-idempotent action intent across linked continuation executions.
6. Checkpoint values must remain encrypted under central coordinator custody without distributing DEKs to untrusted workers.

## Decision

### 1. Relational State Machine Over Dedicated Workflow Broker
Job Orchestration runs directly as a deep Rust module (`JobOrchestrationPort`) inside the Control Plane API and Durable Worker roles, sharing the authoritative PostgreSQL 18 database with existing transactional outbox, Identity fences, and checkpoint tables. We explicitly reject introducing Temporal or Cadence:
- Temporal adds operational overhead, an external dependency, and disjoint persistence boundaries that violate Oryn's single transactional durability model.
- PostgreSQL state machines leverage existing row-level security (`FORCE ROW LEVEL SECURITY`), composite tenant keys `(organization_id, ...)`, and atomic lock ordering across Identity, Adapter, and Execution tiers.
- A dedicated global capacity semaphore table (`orchestration_global_dispatch_slot`) with exactly eight rows is governed by `SECURITY DEFINER` claim and release functions executable only by trusted Durable Workers, strictly separating compute allocation from business authority.

### 2. Qualified Selection and Frozen Population
Job populations are determined through an explicit two-phase admission protocol:
- **Phase 1: Preview.** The orchestrator invokes the producer-owned `AdapterRecordSelectionPort::select` seam to obtain an ordered, qualified prefix or explicit list of application records (capped at 1,000 members per job, 100 per page). The preview atomically hashes canonical record identities (`record_identity_sha256`), computes the population digest (`population_sha256`), records preflight findings, and seals the preview with a strict five-minute expiry.
- **Phase 2: Confirmation.** The operator confirms the exact preview. The orchestrator maps members to generated case UUIDs and freezes membership in `orchestration_case`. Source data changes or record removals during execution never substitute replacement records; missing or unavailable records transition to `Blocked`, preserving truthful population accounting.

### 3. Accountable Schedules and Deterministic Occurrences
Schedules are owned, approved rules (`ScheduleDefinitionV1`) evaluated every second by Durable Workers using `FOR UPDATE SKIP LOCKED` batches:
- Each schedule requires both Workflow Owner approval (`schedule.manage`) and an accountable Execution Sponsor (`job.run`). Identity continuously evaluates `ScheduledExecutionAuthorityV1`; loss of sponsor or owner authority immediately pauses the schedule.
- Triggers support one-shot UTC timestamps, daily/weekly recurring local times with IANA time zones, and registered business events. Arbitrary cron expressions, scripts, and public unauthenticated webhooks are prohibited.
- Occurrences are deterministically deduplicated by hashing `{schedule_id, trigger_kind, local_date, local_time}`. DST spring-forward gaps transition to `missed`; fall-back folds execute once at the earlier UTC instant.
- Any unresolved prior run (including approval waits or unknown outcomes) blocks subsequent occurrences (`skipped_overlap`). Timed occurrence admission grace is 60 seconds; business events must arrive within five minutes of occurrence time.

### 4. Cross-Job Record Mutation Exclusions
To prevent conflicting mutations across concurrent jobs or multiple connections to the same enterprise account:
- Application Adapters compute canonical RFC 8785 digests: `SHA256(RFC8785({application_id, vendor_account_id, environment, record_type, native_record_id}))`.
- The orchestrator acquires whole-record reservations in `orchestration_record_reservation` prior to case dispatch.
- Active reservations are state-based, not lease-based: worker lease expirations, human approval waits, and network timeouts never silently release reservations while outcome uncertainty persists. Conflicting cases transition to `Blocked` (`JOB_RECORD_CONFLICT`).

### 5. Generation-Inclusive Action Identity and Safe Continuations
To prevent duplicate non-idempotent writes across worker crashes and retries:
- Action IDs are strictly derived:
  `action_id = "act_" + hex(SHA256(RFC8785({organization_id, execution_context, node_id, iteration_path, action_generation})))`
- The initial invocation uses `action_generation = "0"`.
- Network retries, worker restarts, and ordinary resumes reuse generation zero and replay identical committed commands.
- An authorized retry of remaining unexecuted nodes after an uncertain outcome creates a linked `orchestration_case_execution` continuation, allocates generation `"1"` on the durable `orchestration_action_intent` ledger, and carries explicit predecessor and reconciliation references.

### 6. Central Value Custody and AEAD Encryption
Amending ADR-0017:
- Encrypted runtime value blobs and wrapped data encryption keys (DEKs) remain under central coordinator custody. Execution workers never receive unwrapped DEKs or cryptographic keys.
- Uploaded values (`RuntimeValueUploadV1`) are validated against declared plan bindings, canonical digests, and producer result references before the coordinator wraps them using AES-256-GCM with authenticated additional data (AAD) bound to organization, execution ID, binding ID, and value revision.
- Continuations reference surviving predecessor values via `value_execution_id` without copying blobs or altering retention deadlines.

### 7. Synchronous Containment and Safety Fences
Emergency stops and high/critical security containment commands execute synchronously:
- A control command synchronously advances `control_generation` and writes to `orchestration_safety_fence`.
- Identity's recovery journal records `orchestration_safety_fenced` entries before returning the updated job projection.
- Point-in-time recovery (PITR) replays all journaled safety fences prior to admitting scheduler occurrences, slot claims, or value unwraps, guaranteeing that canceled schedules or unresolved exclusions cannot revive after restore.

## Consequences

### Positive
- Strict alignment with product requirements ORY-040 through ORY-048.
- Elimination of duplicate writes and phantom executions during failure recovery.
- Full tenant isolation via PostgreSQL RLS and strict multi-table lock ordering.
- Predictable, bounded resource consumption with hard monetary spend caps and preallocated compute slots.
- Accurate, truthful operational reporting separating verified successes, expected rejections, and unresolved exceptions.

### Negative
- Requires maintaining detailed PostgreSQL state machines, indexes, and lock ordering across seven core orchestration tables and supporting control tables.
- Conservative record exclusions block concurrent cases targeting the same record until uncertainty is manually or automatically reconciled.
- Disallowing catch-up runs after schedule pauses requires explicit operator confirmation for backlog processing.

## Amendment: Evaluation-Owned Execution Persistence (ADR-0019)

[ADR-0019](0019-flight-simulator-isolation-and-evaluation-evidence.md) amends the `orchestration_execution` table DDL:
1. Adds `environment TEXT NOT NULL CHECK (environment IN ('production', 'simulation'))`.
2. Adds nullable `evaluation_attempt_id UUID`.
3. Makes `job_id` and `case_id` nullable, adding composite foreign key `fk_exec_sim_attempt` referencing `simulation_attempt (organization_id, attempt_id)`.
4. Enforces check constraint `ck_orchestration_execution_owner`: requires either `(environment = 'production' AND job_id IS NOT NULL AND case_id IS NOT NULL AND evaluation_attempt_id IS NULL)` or `(environment = 'simulation' AND job_id IS NULL AND case_id IS NULL AND evaluation_attempt_id IS NOT NULL)`.
This allows Flight Simulator evaluations to share existing checkpoint, encrypted value custody, action generation CAS, and worker seams without fabricating dummy production jobs or cases.

## Amendment: Release Cohort Admission and Scoped Fences (ADR-0022)

[ADR-0022](0022-release-eligibility-and-rollout-governance.md) amends Job Orchestration interfaces and safety boundaries:
1. Replaces `ReleaseJobAdmissionPort::resolve` signature to take `ReleaseJobAdmissionRequestV1` (with required concrete ordered population for final resolution).
2. Adds required nullable `cohort_id` to `JobPreviewRequestV1` and required non-null `cohort_id` to `JobPreviewV1` and `ScheduleDefinitionV1`.
3. Adds `release_cohort` subject kind to `OrchestrationSafetyFenceV1`, referencing `ReleaseCohortFenceV1` directly as closed after-state.
4. Requires allocating supervised sequence ordinals synchronously before real case execution start, locking sequence heads before case rows.

## Amendment: Infrastructure Custody, Restore Replay Fences, and Scheduler Locks (ADR-0024)

[ADR-0024](0024-infrastructure-security-custody-and-recovery.md) amends Job Orchestration in the following specific areas:
1. **Per-Immutable-Value DEK Lifecycle:** Coordinates encrypted value payloads under per-immutable-value DEKs with two-phase destruction, preventing resurrection upon database restore.
2. **Post-Restore Recovery Replay Fences:** Following database restore, orchestration reconstructs highest admitted generations and occurrence keys from WORM recovery journals before admitting fresh scheduler or worker dispatch.
3. **Occurrence Lock Governance:** Schedulers acquire and lock `orchestration_occurrence` keys before case rows are dispatched, preventing duplicate executions during failover recovery.


