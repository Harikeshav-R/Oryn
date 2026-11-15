# 0017: Agent Runtime Execution and Recovery Architecture

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Oryn Architecture Guild, Agent Runtime Owner, Job Orchestration Owner, Identity Policy Owner, Application Adapters Owner, Outcome Verification Owner, Infrastructure Security Lead
- **Consulted:** Desktop Shell Owner, Browser Extension Owner, Local Context HUD Owner, Operational Graph Owner
- **Informed:** All Engineering Teams

## Context and Problem Statement

Under [PRODUCT.md §§14, 16–17, 28.3; ORY-026–028, ORY-041, ORY-043–045, ORY-070–071, ORY-074](../../PRODUCT.md) and [TECHNICAL.md §§6.2–3, 7.2, 11.4–5, 13.2](../../TECHNICAL.md), Oryn must execute approved, immutable agent candidate versions against assigned business cases across SaaS APIs, browser sessions, and desktop applications.

Key architectural challenges include:
1. **Interpreter Architecture and Engine Sharing:** Whether to build divergent runtimes across cloud, employee desktop, and flight simulator environments, or unify execution around a single pure Rust evaluation core (`oryn-runtime-core`) with pluggable host supervisors (`oryn-runtime-worker`).
2. **Checkpoint Durability and Workflow Engine Coupling:** Whether to couple runtime execution to a specific third-party durable workflow engine (Temporal, Cadence) or define an authoritative, PostgreSQL-backed checkpoint protocol owned by Job Orchestration with strict revision Compare-And-Swap (CAS).
3. **Cloud Sandbox Technology:** Whether to isolate cloud worker execution via container boundaries, Firecracker microVMs, WebAssembly, or Linux kernel sandboxing via gVisor.
4. **Host Placement and Migration:** Whether to migrate in-flight interpreter state dynamically between employee workstations and cloud clusters, or pin host placement permanently for the case duration while letting local hosts invoke cloud adapters.
5. **Worker Fencing and One-Shot Dispatch:** How to close the runner-to-executor authority seam so that replacement workers, network partitions, or recovery epochs cannot replay external mutations.
6. **Sensitive State Storage and Backup Retention Split:** How to maintain encrypted, verifiable runtime checkpoints while honoring tenant privacy purge schedules (7-day active value purge, 30-day inactivity expiration) without making dishonest claims of instant physical backup destruction.

## Decision

The Oryn Architecture Guild resolves the agent runtime execution, persistence, and recovery architecture as follows:

1. **Shared Pure Rust Core (`oryn-runtime-core`):**
   - Execution semantics across cloud production, employee-local desktop jobs, and flight simulation use a single pure Rust core crate (`oryn-runtime-core`).
   - The core exposes a single pure advancement function:
     ```rust
     pub fn advance(
         program: &ExecutableAgentBodyV1,
         checkpoint: &ExecutionCheckpointV1,
         inputs: &RuntimeInputs<'_>,
         event: &RuntimeEventV1,
         clock: RuntimeClockV1,
     ) -> Result<RuntimeTransitionV1, RuntimeErrorV1>;
     ```
   - The core possesses zero direct database access, network egress, filesystem access, operating system actuation, or ambient credential access. Time is supplied exclusively via `RuntimeClockV1`.
   - Immutable nodes and regions are indexed once; live materialized inputs and approved rule bodies are borrowed during advancement, avoiding repetitive graph cloning.

2. **Orchestrator-Owned PostgreSQL Checkpoints with CAS:**
   - Runtime and Orchestrator decouple scheduling choice from execution durability. Durable checkpoints are persisted in PostgreSQL tables owned by Job Orchestration: `orchestration_execution`, `orchestration_checkpoint`, `orchestration_value`, `orchestration_effect`, `orchestration_trace`, `orchestration_human_question`, and `orchestration_retention_fence`.
   - State advancement commits in an atomic `TenantTransaction` using strict revision and control generation Compare-And-Swap (`expected_revision`, `expected_control_generation`, `assignment_epoch`).
   - SQL updates commit deltas; unchanged value blobs and immutable IR programs are never copied across checkpoints.

3. **Mandatory gVisor Cloud Isolation:**
   - Cloud production workers run in fresh per-assignment gVisor sandboxes (`runsc`, RuntimeClass `gvisor`).
   - Hardened isolation profile: non-root UID 10001, read-only root filesystem, dropped capabilities, no service-account tokens, swap and core dumps disabled.
   - Resource ceilings: 1 vCPU, 512 MiB memory limit, 16 MiB memory-only scratch (`tmpfs`). Network egress is blocked to all endpoints except authenticated internal Control Plane APIs over mTLS.

4. **Pinned Case Host Placement (No Dynamic State Migration):**
   - Case placement is pinned permanently to cloud host or employee workstation upon initial assignment.
   - When any case operation requires an employee device, browser session, or native application, the case executes on that employee's local host (`oryn-runtime-worker` supervised by Desktop Shell via private `shell-runtime.v1`).
   - Local runners call cloud adapter endpoints for non-local API operations. Interpreter memory never migrates between machines. Device loss or workstation lock pauses the case.

5. **Closed Runner-to-Executor Authority Seam:**
   - Each runner incarnation authenticates as an Identity-owned `identity_execution_principal` with audience `execution` and narrow scopes (`runtime:claim`, `runtime:read`, `runtime:advance`, `runtime:heartbeat`, `runtime:yield`).
   - Action dispatch requires pre-dispatch intent commitment, one-use Identity action fence consumption (`POST /v1/identity/actions/consume`), and journaled adapter execution claim.
   - Mutation action IDs are deterministic and stable across restarts and relational restore (`"act_" + SHA256(RFC8785({organization_id, execution_context, node_id, iteration_path}))`).
   - Ambiguous timeouts or missing receipts transition the pending effect to `state="unknown"` and hold the case in `submission_unknown`. Consumed fences are never unconsumed, and mutations are never replayed automatically.

6. **Sensitive Value Encryption and Backup Retention Split:**
   - Typed checkpoint values are encrypted with AES-256-GCM using random 96-bit nonces and per-execution DEKs wrapped through HashiCorp Vault.
   - AAD cryptographically binds organization, execution, binding ID, value revision, and behavior hash.
   - Plaintext values are purged 7 days after case termination; resumability expires after 30 days without durable semantic progress. Content-free action/effect exclusion metadata is retained for 24 months.
   - Database restore filtering replays immutable `orchestration_retention_fence` journal entries before any key unwrap, preventing rollback of privacy deadlines or progress high-watermarks.

## Historical ADR Amendments

This decision amends relevant execution, authority, and reservation assumptions in prior ADRs:

1. **Amendment to [ADR-0011](0011-identity-authority-and-approval-fencing.md) (Identity Authority and Approval Fencing):**
   - Extends `AuthorityJournalEntryV1.kind` to include `runtime_retention_fenced`.
   - Extends `RecordAfterImageV1.table_name` to include `orchestration_retention_fence`, conditionally constraining its after-state to `RuntimeRetentionFenceV1`.
   - Confirms that execution worker identities are derived from verified principal credentials, not caller-supplied payload parameters.
   - Reaffirms that a surviving Identity fence without a matching adapter receipt does not prove that an external mutation did not occur.

2. **Amendment to [ADR-0012](0012-control-plane-transport-durability-and-inference.md) (Control Plane Transport Durability and Inference):**
   - Clarifies that delivery leases (30 seconds, 10-second renewal) govern transport and worker assignment ownership only; a transport lease retry is not authority to repeat an external application mutation.
   - Adds internal execution transport endpoints under `/internal/v1/runtime/assignments/...` bounded to 256 KiB command envelopes.

3. **Amendment to [ADR-0015](0015-agent-factory-ir-and-candidate-qualification.md) (Agent Factory IR and Candidate Qualification):**
   - Clarifies that `ValueRefV1` requires strict dominance: a node output reference must strictly dominate its consumer. Equal port labels across divergent branches do not create an implicit phi/join node.
   - Confirms that model inference results (`RuntimeModelResultV1`) require explicit schema envelope identification and that revoked or unavailable model routes pause case execution rather than substituting providers.

4. **Amendment to [ADR-0016](0016-application-adapter-qualification-and-dispatch-boundaries.md) (Application Adapter Qualification and Dispatch Boundaries):**
   - Adds producer-owned typed value retrieval (`AdapterExecutionPort::value`) to retrieve authorized read operation results, avoiding duplicate vendor reads.
   - Upgrades `browser-bridge.v1` to major 1, minor 5 with required capability `execution_reservation_lease_v1`.
   - Advances native `shell-adapter.v1` to major 1, minor 1 to enforce unified workstation reservation leases managed by `LocalExecutionReservationBroker`.

## Consequences

### Positive
- Unified execution semantics across cloud production, local desktop, and simulation via a single pure Rust module.
- Strict containment: runner compromise cannot forge permissions, bypass verifiers, unconsume fences, or leak credentials.
- Safe crash recovery: exact 10-window recovery matrix prevents duplicate external mutations while enabling automatic recovery where provably safe.
- Honest privacy and retention: cryptographic separation between encrypted customer data and content-free audit records, backed by restore-replay retention fences.

### Negative / Trade-offs
- Local host cases cannot automatically migrate to the cloud if the employee closes their laptop; execution pauses until reconnected.
- Disambiguation of uncertain external mutations requires human or out-of-band operator reconciliation rather than automatic blind retry.
- gVisor startup overhead requires container warming strategies in execution clusters.

## Amendment: Integration with Job Orchestration and Scheduling (ADR-0018)

[ADR-0018](0018-job-orchestration-and-scheduling.md) amends this record in the following specific areas:
1. **Value Custody and DEK Boundary:** Active runtime values are stored encrypted in PostgreSQL under central coordinator custody using AES-256-GCM with authenticated additional data (AAD). Unwrapped DEKs are never distributed to untrusted execution workers; workers upload canonical typed payloads (`RuntimeValueUploadV1`), which the coordinator validates, encrypts, and records.
2. **Continuation Executions and Ancestor Values:** Multiple linked executions may share a case context across authorized safe retries. `RuntimeBindingRefV1`, `RuntimeValueBlobRefV1`, and `RuntimeValueQueryV1` require `value_execution_id` so continuations can reference surviving predecessor values without copying ciphertext blobs or resetting retention clocks.
3. **Action Generation and Deterministic Action Identity:** `RuntimePendingEffectV1` requires `action_generation: U64`, nullable `retry_of_action_id: Identifier`, and nullable `reconciliation_ref: Identifier`. Action IDs are derived deterministically using the generation-inclusive formula; only authorized safe reconciliation advances generation from `"0"` to `"1"`.
4. **Identifier Scoping:** Compiler-owned node, region, loop, and binding names are strictly bound to Factory `PlanIdentifier`, while runtime-generated action, effect, and owner IDs reference wide Graph `Identifier` supporting 68-character action digests and UUIDs.
5. **Synchronous Containment Fencing:** Emergency stop and containment commands synchronously advance control generations and write `OrchestrationSafetyFenceV1` records directly to the database and Identity recovery journal (`orchestration_safety_fenced`), bypassing ordinary queue fanout latency.

