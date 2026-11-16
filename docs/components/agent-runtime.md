# Production Agent Runtime and Scoped Workers Component Specification

Status: Detailed technical specification — implementation pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§6.2–3, 7.2, 11.4–5, 13.2](../../TECHNICAL.md) | [PRODUCT.md §§14, 16–17, 28.3; ORY-026–028, ORY-041, ORY-043–045, ORY-070, ORY-071, ORY-074](../../PRODUCT.md) | [ADR-0015](../adr/0015-agent-factory-ir-and-candidate-qualification.md) | [ADR-0016](../adr/0016-application-adapter-qualification-and-dispatch-boundaries.md) | [ADR-0017](../adr/0017-agent-runtime-execution-and-recovery.md)

### Core Responsibility
The Production Agent Runtime executes approved, immutable agent candidate versions against assigned cases through validated application adapters, governed cloud inference, and independent outcome verification under strict external policy interception and sandboxed execution boundaries.

### Owns
- The pure deterministic execution lifecycle of individual structured agent steps defined in the compiled closed ten-node IR (`oryn-runtime-core`).
- Incremental advancement of case execution checkpoints via authoritative state transitions.
- Invocation of approved model assistance exclusively for designated non-deterministic reasoning steps via governed cloud inference (`text.reason` / `agent_runtime_reason`).
- External operation staging and requested effect generation delivered to application adapters and identity governance.
- Step-level progress reporting, content-free execution trace generation, and bounded failure escalation.
- Strict evaluation budgets (active time, node execution count, and memory/value size bounds).

### Consumes
- Bounded work assignments (`RuntimeAssignmentV1`) from [job-orchestration](job-orchestration.md) with pinned agent version UUIDs, behavior hashes, and environment bindings.
- Authoritative per-action authorization verdicts and one-use admission consumption (`SignedActionAdmissionV1`) from [identity-policy](identity-policy.md).
- Scoped operation execution, receipts (`AdapterSubmissionReceiptV1`), and materialized typed operation values (`AdapterOperationValueV1`) from [application-adapters](application-adapters.md).
- Governed cloud reasoning operations (`text.reason`, `agent.runtime-value.v1`) via [cloud-inference](../architecture/cloud-inference.md).
- Independent postcondition verification verdicts (`VerificationRunResultV1`) from [outcome-verification](outcome-verification.md).
- Approved, immutable rules and capability declarations from [operational-graph](operational-graph.md).

### Produces
- Action authorization and consumption requests submitted to [identity-policy](identity-policy.md) prior to dispatching any external mutation.
- Prepared operations and dispatch intents delivered to [application-adapters](application-adapters.md).
- Independent outcome verification run requests delivered to [outcome-verification](outcome-verification.md).
- Checkpoint proposals, lease heartbeats, and assignment yield requests committed through [job-orchestration](job-orchestration.md).
- Typed clarification questions submitted to human operators via [control-plane](control-plane.md).

### Does Not Own
- Business authorization or policy decisions (exclusively owned by [identity-policy](identity-policy.md)).
- Consequential business outcome verification (exclusively owned by [outcome-verification](outcome-verification.md)).
- Durable case queueing, job scheduling, lease allocation, or persistent table lifecycle (exclusively owned by [job-orchestration](job-orchestration.md)).
- Direct vendor credential custody or external API networking (exclusively owned by [application-adapters](application-adapters.md) and egress broker).
- Direct database mutation, filesystem persistence, or ambient operating system access.

### Boundary Requirement
The runtime is treated as **less trusted than the authorization, verification, and release authorities**. Even if a language model completion is adversarial or an ingested document contains prompt injections, action permissions, credential scopes, and business completion remain enforced strictly outside model reasoning. Local and remote runners execute the identical pure Rust core. Self-certified success from an agent runner is never accepted as business completion.

---

## Product requirements

The runtime directly enforces and participates in the following product requirements from [PRODUCT.md](../../PRODUCT.md):

| Requirement ID | Platform Mandate | Runtime Implementation Mechanism |
|---|---|---|
| **ORY-026** | A Tier 3 action triggers item-level human approval before its consequential commit. | The runtime halts at `action` nodes requiring approval, yielding an `approval` wait, releasing device reservations, and resuming only when presented with a valid `SignedActionApprovalV1` matching `action_sha256`. |
| **ORY-027** | A Tier 4 action is unavailable to agents regardless of historical human demonstrations. | The runtime compiles and loads only closed IR graphs where Tier 4 operations are structurally prohibited; preflight and Identity PDP interceptors unconditionally reject any Tier 4 dispatch attempt. |
| **ORY-028** | An agent cannot access additional applications or record populations outside its approved scope. | Sandboxed workers run in network-isolated gVisor containers with dropped capabilities, possessing no ambient credentials or egress routes outside registered adapter endpoints and pinned case bounds. |
| **ORY-041** | Preflight blocks execution when agent scope, role, required input, or critical permissions are invalid. | Assignment claim validates agent version attestation, manifest hash, input bindings, approved rule revisions, and execution principal scopes before admitting the initial checkpoint. |
| **ORY-043** | A submitted but unverified consequential action is not marked Verified Complete. | The runtime yields to `verification` at `verify` nodes; submission receipts record dispatch only. The case cannot close or mark completion until an independent Verifier returns `verified`. |
| **ORY-044** | An uncertain external submission is held to prevent blind duplicate retry. | Ambiguous adapter timeouts or dropped network responses transition the pending effect to `state="unknown"`, placing the checkpoint in `submission_unknown` hold and preventing automatic replay. |
| **ORY-045** | The operator can stop future actions and see which effects already occurred and which cases remain. | Stop commands increment `control_generation`, immediately canceling in-flight non-committed work, checkpointing completed effects, and reporting accurate partial progress without fabricating rollback. |
| **ORY-070** | Every meaningful approval, release, permission change, consequential action, and incident intervention produces an audit record. | Checkpoint commits append content-free trace entries (`orchestration_trace`) recording every transition, effect kind, action ID, and verification reference. |
| **ORY-071** | Every Oryn-owned v1.0 AI operation routes through the governed LiteLLM path; no local inference or direct-provider fallback executes. | All `reason` node model assistance invokes central `agent_runtime_reason` via LiteLLM; direct-provider egress and local on-device LLM inference are strictly blocked. |
| **ORY-074** | Every operation pins an approved US-processing provider/model/route/policy binding; disallowed region or provider fallback is rejected. | The runtime binds immutable `RuntimeModelBindingV1` records specifying certified US routes; unavailable or rate-limited routes pause the case rather than falling back to uncertified models. |

---

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### 1. Consumed Upstream Contracts
- **Contract Reference #5 & #7 ([agent-factory-ir](agent-factory-ir.md)):** Consumes immutable `AgentVersionV1` containing `AgentIRV1`, `ExecutableAgentBodyV1`, and `RuntimeModelBindingV1` under [`agent-factory-v1.schema.json`](../architecture/contracts/agent-factory-v1.schema.json).
  - The runtime executes the closed ten-node DAG IR (`read`, `transform`, `reason`, `decision`, `action`, `foreach`, `verify`, `human_input`, `escalate`, `finish`). Dynamic graph generation, recursive loops, and scripting are strictly forbidden.
  - Value references (`ValueRefV1`) require strict dominance: an output reference must strictly dominate its consumer. Branch-local outputs cannot cross joins without a common dominating producer; there are no implicit phi nodes.
- **Contract Reference #10 ([job-orchestration](job-orchestration.md)):** Ingests bounded work assignments (`RuntimeAssignmentV1`) and commits state transitions through [`agent-runtime-v1.schema.json`](../architecture/contracts/agent-runtime-v1.schema.json).
  - Negotiates `runtime_reporting_v1` capability over worker IPC rails. Checkpoint commits (`RuntimeCheckpointCommitV1`) convey `intervention_facts`, monotonic `intervention_through_sequence`, `reporting_events`, and monotonic `reporting_through_sequence`.
  - Execution progress notifications (`RuntimeProgressV1`) carry required nullable `reporting_event` (`RuntimeReportingEventPayloadV1`) for live milestone streaming to Job Orchestration and Command Center Analytics.
- **Contract Reference #11 ([identity-policy](identity-policy.md)):** Submits authorization requests (`AuthorizationRequestV1`) and consumes one-use action admission (`ConsumeActionV1`) under [`identity-policy-v1.schema.json`](../architecture/contracts/identity-policy-v1.schema.json).
  - Execution workers authenticate using identity execution child tokens (`audience: "execution"`) with narrow scopes (`runtime:claim`, `runtime:read`, `runtime:advance`, `runtime:heartbeat`, `runtime:yield`).
  - Worker identity is derived by the Identity PDP from verified principal context, not caller assertions.
- **Contract Reference #12 ([application-adapters](application-adapters.md)):** Dispatches operations via `AdapterExecutionPort` (`prepare`, `execute`, `status`, and typed `value`) under [`application-adapters-v1.schema.json`](../architecture/contracts/application-adapters-v1.schema.json).
  - Browser actuation executes over `browser-bridge.v1` (major 1, minor 5 with required capability `execution_reservation_lease_v1`).
  - Native actuation executes over `shell-adapter.v1` (major 1, minor 1) supervised by Desktop Shell.
- **Contract Reference #14 ([outcome-verification](outcome-verification.md)):** Submits verification requests (`VerificationRunRequestV1`) and receives independent verdicts (`VerificationRunResultV1`) under [`outcome-verification-v1.schema.json`](../architecture/contracts/outcome-verification-v1.schema.json).
- **Contract Reference #22 ([cloud-inference](../architecture/cloud-inference.md)):** Dispatches `agent_runtime_reason` (`agent.runtime-value.v1`) through governed LiteLLM gateway under [`cloud-inference-v1.schema.json`](../architecture/contracts/cloud-inference-v1.schema.json). Input is capped at 32 KiB and output at 16 KiB with a maximum 30,000 ms timeout.

### 2. Normative Wire Schemas
The agent runtime contracts are formally codified in `urn:oryn:schemas:agent-runtime:v1` ([`agent-runtime-v1.schema.json`](../architecture/contracts/agent-runtime-v1.schema.json)). Every top-level record mandates `schema_id`:

| Wire Record | Schema ID (`schema_id`) | Purpose |
|---|---|---|
| `RuntimeAssignmentV1` | `runtime.assignment.v1` | Bounded case execution assignment to a specific worker incarnation. |
| `ExecutionCheckpointV1` | `runtime.checkpoint.v1` | Authoritative continuation checkpoint carrying cursor, bindings, and pending effect state. |
| `RuntimeHeartbeatV1` | `runtime.heartbeat.v1` | Worker lease renewal command sent every 10 seconds. |
| `RuntimeCheckpointCommitV1` | `runtime.checkpoint-commit.v1` | Transactional commit proposing a state transition, value blob refs, and owner result refs. |
| `RuntimeControlV1` | `runtime.control.v1` | Management control command (`pause`, `cancel`, `resume`). |
| `RuntimeProgressV1` | `runtime.progress.v1` | Content-free execution progress notification. |
| `RuntimeHumanQuestionV1` | `runtime.human-question.v1` | Typed question emitted when execution yields to human input. |
| `RuntimeHumanResponseV1` | `runtime.human-response.v1` | Human operator response answering or rejecting a pending question. |
| `RuntimeClaimV1` | `runtime.claim.v1` | Worker assignment claim envelope. |
| `RuntimeYieldV1` | `runtime.yield.v1` | Worker voluntary yield on wait, pause, or completion. |
| `RuntimeControlAckV1` | `runtime.control-ack.v1` | Worker acknowledgment of a management control signal. |
| `RuntimeCommandV1` | `runtime.command.v1` | Closed union command envelope for worker transport. |
| `RuntimeSnapshotV1` | `runtime.snapshot.v1` | Authoritative assignment and checkpoint snapshot returned on query or claim. |
| `RuntimeCommandResultV1` | `runtime.command-result.v1` | Authoritative command execution result containing current snapshot. |
| `RuntimeProblemV1` | `runtime.problem.v1` | Standard error problem payload returning closed error code. |
| `RuntimeMaterializedValueV1` | `runtime.materialized-value.v1` | Internal projection of a decrypted, verified runtime binding value. |
| `RuntimeValueUploadV1` | `runtime.value-upload.v1` | Worker payload uploading an encrypted typed binding value. |
| `RuntimeValueQueryV1` | `runtime.value-query.v1` | Worker query payload requesting decryption and materialization of a binding value. |
| `RuntimeRetentionFenceV1` | (Defined in schema) | Immutable journal record bounding retention deadlines and progress watermarks. |
| `RuntimeInterventionFactV1` | `runtime.intervention-fact.v1` | Fact capturing human steering, step overrides, or rejections during agent execution. |
| `RuntimeReportingEventV1` | `runtime.reporting-event.v1` | Real-time reporting telemetry envelope carrying content-free lifecycle and milestone progress. |

### Identifier Scoping and Generation Preimage
- **Identifier Separation:** Generic `$defs.Identifier` in `agent-runtime-v1.schema.json` references Graph Identifier, accepting full 68-character `act_` digests and UUID owner IDs. Compiler-owned structures (`PlanIdentifier`) strictly govern node IDs, region IDs, loop variables, slot names, and compiler binding IDs.
- **Value Lineage (`value_execution_id`):** `RuntimeBindingRefV1`, `RuntimeValueBlobRefV1`, and `RuntimeValueQueryV1` mandate `value_execution_id: Uuid`. Linked continuation executions reference surviving predecessor values without copying blobs or resetting retention deadlines. Checkpoint commits verify ancestor execution membership in `orchestration_case_execution`.
- **Action Identity & Generation:** `RuntimePendingEffectV1` includes required `action_generation: U64`, nullable `retry_of_action_id: Identifier`, and nullable `reconciliation_ref: Identifier`. Action identity is computed identically across all workers and restarts:
  ```text
  action_id = "act_" + lowercase_hex(SHA256(RFC8785({
    organization_id,
    execution_context,
    node_id,
    iteration_path,
    action_generation
  })))
  ```
  Initial action uses generation zero. Generation increments occur solely via explicit owner-authorized reconciliation recorded in `orchestration_action_intent`. Single-current execution invariant ensures that multiple linked executions for a case never run concurrently.

---

## Trust and deployment boundaries

### Process Isolation, Hosts, and Environments
Execution placement is pinned for the entire lifetime of an execution across one of two supported host kinds (`RuntimeHostV1 = "cloud" | "local"`), operating in either `production` or `simulation` environment:

1. **Cloud Host (`RuntimeHostV1::Cloud`):**
   - Mandatory Linux container isolation under **gVisor** (`runsc` sandbox, RuntimeClass `gvisor`).
   - Hardened security profile: non-root UID 10001, read-only root filesystem, dropped Linux capabilities, no service-account tokens, swap and core dumps disabled.
   - Resource ceilings: 1 vCPU, 512 MiB RAM limit, 16 MiB memory-only scratch (`tmpfs`).
   - Zero ambient network egress: workers cannot reach database instances, HashiCorp Vault, cloud providers, or the public internet. All interactions occur via authenticated Control Plane APIs over mTLS.
   - In `simulation` environment, each attempt receives a fresh, non-reused gVisor sandbox and fresh synthetic state.
2. **Local Workstation / Lab Host (`RuntimeHostV1::Local`):**
   - In `production`, pinned to employee workstation (`device_id` and `profile_id` non-null) when any case operation requires that employee's local device, browser session, or desktop application.
   - In `simulation`, pinned strictly to dedicated enrolled Windows/macOS lab devices (`identity_simulation_lab_device`), never ordinary employee workstations.
   - Signed first-party Rust binary (`oryn-runtime-worker`) supervised by Desktop Shell via private inherited length-prefixed duplex IPC (`shell-runtime.v1` major 1, minor 1, negotiating `evaluation_execution_v1`).
   - Local workers access central runtime endpoints via a narrowly allowlisted `RuntimeControlPlaneClient`. Local workers possess no persistent credentials, refresh tokens, or direct Vault access.
   - Device loss, workstation lock/sleep, or user pause halts execution; local state never automatically migrates to cloud workers.

### Execution Context Typing and Environment Constraints
`RuntimeAssignmentV1.execution_context` and `ExecutionCheckpointV1.execution_context` use `RuntimeExecutionContextV1`:
- `job`: Production job execution binding `job_id`, `case_id`, `job_type`, `agent_version_id`, `risk_tier`. Enforces `environment = "production"`.
- `evaluation`: Flight simulator candidate evaluation binding `evaluation_id`, `scenario_version_id`, `attempt_id`, and `evaluation_target: { kind: "agent", agent_version: UUID }`. Enforces `environment = "simulation"`.
The obsolete `ExecutionContextJobV1` definition is eliminated. `job` implies `production`; `evaluation` implies `simulation`. Agent version and behavior hashes in runtime state must resolve to the exact evaluation target.

### Identity and Delegation
- Each runner incarnation authenticates as an Identity-owned `identity_execution_principal` via infrastructure mTLS (cloud) or an enrolled local device child token (local).
- Short-lived child access tokens have a strict 5-minute maximum lifetime and require audience `execution`.
- The execution principal binds `organization_id`, `execution_context`, `host`, `assignment_id`, `assignment_epoch`, and `recovery_epoch`.
- When adapters dispatch operations, the adapter process records the worker ID as an authenticated dispatching principal while acting as an authorized delegate. Adapter and broker validate the delegate against the server-owned winning action/attempt and execution guard.

### Synchronous Containment Enforcement
Before assignment dispatch, action admission, or step execution, `RuntimeCoordinator` enforces active incident restrictions (`orchestration_incident_restriction`) and safety fences (`OrchestrationSafetyFenceV1`) within the current `TenantTransaction`. Fences take the Identity authority guard before adapter or Graph guards. If an active containment restriction matches the running case, job, schedule, agent version, connection, operation, capability, rule, or worker, dispatch immediately halts (`pause_execution`), mutations are blocked (`pause_writes`), or job admission is denied (`stop_new_jobs`). Containment commits synchronously in PostgreSQL with sub-second latency; connected workers acknowledge safe boundaries within <=2 seconds or remain in an explicit `acknowledgment_pending` state. Containment never rolls back already-transmitted external actions; unconfirmed external mutations remain flagged as unresolved until reconciled by `JobOrchestrationPort::reconcile`.

---

## Internal architecture

The runtime architecture strictly separates pure state evaluation from impure I/O actuation:

```
+-----------------------------------------------------------------------------------+
|                               CONTROL PLANE / COORDINATOR                         |
|  +-----------------------------------------------------------------------------+  |
|  |                           RuntimeCoordinator                                |  |
|  | - Validates proposed transitions & CAS revisions                             |  |
|  | - Recomputes deterministic node logic, transforms, and rule outcomes        |  |
|  | - Intercepts effects; invokes Identity, Adapters, Verifier, LiteLLM        |  |
|  | - Hydrates minimal referenced values; unwraps AES-256-GCM DEKs              |  |
|  +---------------------------------------+-------------------------------------+  |
+------------------------------------------|----------------------------------------+
                                           | Internal Command Transport (mTLS)
                                           v
+-----------------------------------------------------------------------------------+
|                        HARDENED RUNNER HOST (oryn-runtime-worker)                 |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                         Pure Rust Interpreter (oryn-runtime-core)         |   |
|   |                                                                           |   |
|   |   advance(program, checkpoint, inputs, event, clock) -> Result<Trans,Err> |   |
|   |                                                                           |   |
|   |   - Immutable DAG indexing (nodes, regions, rules)                        |   |
|   |   - Pure three-valued rule evaluation                                     |   |
|   |   - Exact decimal arithmetic & taint propagation                          |   |
|   |   - Bounded foreach loop frames (depth <= 2, items <= 1,000)              |   |
|   |   - Zero ambient system access, zero wall clock, zero network              |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

### 1. Pure Rust Interpreter (`oryn-runtime-core`)
The pure engine defines the following interface:

```rust
pub fn advance(
    program: &ExecutableAgentBodyV1,
    checkpoint: &ExecutionCheckpointV1,
    inputs: &RuntimeInputs<'_>,
    event: &RuntimeEventV1,
    clock: RuntimeClockV1,
) -> Result<RuntimeTransitionV1, RuntimeErrorV1>;
```

- `RuntimeClockV1`: Supplies trusted UTC timestamp and monotonic elapsed time. The pure core never reads system time.
- `RuntimeInputs<'a>`: Borrows only live materialized bindings and approved rule bodies:
  ```rust
  pub struct RuntimeInputs<'a> {
      pub bindings: &'a [MaterializedBinding<'a>],
      pub rules: &'a [BusinessRuleVersionV1],
  }
  pub struct MaterializedBinding<'a> {
      pub reference: &'a RuntimeBindingRefV1,
      pub value: &'a PortableJsonValueV1,
  }
  ```
- `RuntimeTransitionV1`: Emits `{checkpoint: ExecutionCheckpointV1, effect: Option<RuntimeEffectV1>, disposition: RuntimeDispositionV1}`.
  - Dispositions are `continue`, `yield`, `completion_requested`, `stopped`. A disposition never self-asserts business success.
- `RuntimeEventV1`: Closed tagged union:
  - `start`
  - `effect_result { effect_id: Identifier, result: RuntimeOwnedResultV1 }`
  - `human_response { response: RuntimeHumanResponseV1 }`
  - `verification_result { result: VerificationRunResultV1 }`
  - `resume { control_generation: U64 }`
  - `pause { control_generation: U64, reason_code: Identifier }`
  - `cancel { control_generation: U64, reason_code: Identifier }`

### 2. Runtime Checkpoint Port (`RuntimeCheckpointPort`)
The host interacts with central Orchestration storage through an asynchronous port borrowing `VerifiedPrincipal`:

```rust
pub trait RuntimeCheckpointPort: Send + Sync {
    fn claim<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: RuntimeClaimV1,
    ) -> impl Future<Output = Result<RuntimeCommandResultV1, RuntimeProblemV1>> + Send + 'a;

    fn heartbeat<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: RuntimeHeartbeatV1,
    ) -> impl Future<Output = Result<RuntimeCommandResultV1, RuntimeProblemV1>> + Send + 'a;

    fn load<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        assignment_id: Uuid,
    ) -> impl Future<Output = Result<RuntimeSnapshotV1, RuntimeProblemV1>> + Send + 'a;

    fn commit<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: RuntimeCheckpointCommitV1,
    ) -> impl Future<Output = Result<RuntimeCommandResultV1, RuntimeProblemV1>> + Send + 'a;

    fn yield_assignment<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: RuntimeYieldV1,
    ) -> impl Future<Output = Result<RuntimeCommandResultV1, RuntimeProblemV1>> + Send + 'a;
}
```

### 3. Runtime Value Port (`RuntimeValuePort`)
Central Coordinator custody manages encrypted intermediate values. Workers do not store plaintext values on disk or exchange keys:
```rust
#[async_trait]
pub trait RuntimeValuePort: Send + Sync {
    async fn upload(
        &self,
        principal: &VerifiedPrincipal,
        request: RuntimeValueUploadV1,
    ) -> Result<RuntimeValueBlobRefV1, RuntimeErrorV1>;

    async fn materialize(
        &self,
        principal: &VerifiedPrincipal,
        request: RuntimeValueQueryV1,
    ) -> Result<RuntimeMaterializedValueV1, RuntimeErrorV1>;
}
```
- **Endpoints:** Upload operates via `PUT /internal/v1/runtime/assignments/{assignment_id}/values/{binding_id}` accepting `RuntimeValueUploadV1`. Query operates via `GET` on that same path with query parameters `epoch`, `revision`, and `value_revision` for `RuntimeValueQueryV1`.
- **Value Custody:** Plaintext JSON (reusing `PortableJsonValueV1`) is uploaded over TLS, validated against size caps (256 KiB envelope and canonical payload; 2 MiB aggregate live values), and encrypted in PostgreSQL (`orchestration_value`) using AES-GCM-256 with 96-bit nonce and bound AAD. Keys are per-execution DEKs wrapped with Vault Transit keys. Staged unattached values are purged after five minutes.

---

## State and lifecycle

### Execution Phases and State Transitions
Case execution advances through explicit lifecycle phases:
- `ready`: Checkpoint is admitted and ready to evaluate the current node.
- `effect_pending`: An external effect has been admitted and staged; awaiting owner dispatch/result.
- `waiting`: Execution has yielded for human input, approval, verification, or resource restrictions.
- `held`: Execution is suspended due to an uncertain submission, policy hold, or unrecoverable error.
- `completion_requested`: The root `finish` node has completed; awaiting final verifier and orchestrator closing.
- `stopped`: Execution has reached a terminal stopped or canceled state.

```
       +-------------------------------------------------------------+
       |                                                             |
       v                                                             |
   [ ready ] ----------> [ effect_pending ] ----------> [ waiting ] -+
       |                        |                              |
       |                        v                              |
       +------------------> [ held ] <-------------------------+
       |                        |
       v                        v
[ completion_requested ]   [ stopped ]
```

### Node Execution Semantics
1. **`read`:** Stages an adapter query. Returns typed value and evidence. A submission receipt alone provides no business value.
2. **`transform`:** Executes closed pure functions (e.g., `add`, `subtract`, `lte`, `quantize`). Arithmetic uses exact decimal strings; unverified parent taint is never cleared by parsing.
3. **`reason`:** Invokes governed `agent_runtime_reason` using pinned model, template, and schema. Revoked or unavailable route pauses without provider fallback.
4. **`decision`:** Executes approved Operational Graph rules with pure three-valued logic. Missing facts evaluate to unknown; model completions cannot fabricate policy facts.
5. **`action`:** Resolves target state, stages canonical arguments, consumes Identity action fence, dispatches via adapter, and records submission receipt. Ambiguous dispatch halts to `submission_unknown`.
6. **`foreach`:** Freezes collection membership and ordering at entry. Max items: 1,000; max nesting depth: 2. Iterations execute sequentially. An iteration failure pauses the loop; earlier iteration effects are preserved.
7. **`verify`:** Emits `VerificationRunRequestV1` and yields to `waiting`. Mandatory `on_unknown` and `on_mismatch` transition to `pause_case`.
8. **`human_input`:** Yields typed `RuntimeHumanQuestionV1` bound to case, version, node, iteration, and revision. Expires after 24 hours to Needs Clarification.
9. **`escalate`:** Emits terminal execution pause with reason code and evidence bindings.
10. **`finish`:** Resolves output bindings. Child finish completes loop iteration; root finish requests completion.

---

## Error and edge-case behavior

### Authoritative Crash Recovery Matrix

| Crash Window | Recovery Action and State Transition | Dispatches Allowed |
|---|---|:---:|
| **Before committed effect intent** | Reload exact committed checkpoint revision. Re-evaluate node entry; no external effect was admitted. | 0 |
| **After prepare, before consumption** | Reload staged intent. Revalidate lease, target state, and approvals. A fresh admission may be requested for the same unconsumed action ID. | 0 |
| **Consume response lost / durability unknown** | Query Identity status. Without confirmed, unexpired admission, execute zero dispatches, enter `authority_unknown` hold, and require operator reconciliation. | 0 |
| **Worker replaced after fence consumption** | Query Adapter status. Old admission is never transferred to a replacement worker. Hold in `authority_unknown` unless independent reconciliation proves no-send. | 0 |
| **Dispatch possibly started, receipt absent** | Mark `submission_unknown`. Enter `Outcome Unknown` hold; await independent verification or operator reconciliation. Never resend. | 0 |
| **Adapter receipt durable, Runtime checkpoint missing** | Fetch trusted receipt from Adapter status, commit receipt into Runtime checkpoint, and transition to `awaiting_verification`. Do not repeat mutation. | 0 |
| **Verification result durable, Runtime notification lost** | Fetch authoritative result from Verifier by `request_id` and commit transition. | 0 |
| **Model response uncertain and no typed value committed** | Transition to `inference_unknown` hold. A fresh inference request requires explicit operator continuation. | 0 |
| **Ordinary crash with no unresolved effect** | Spawn fresh assignment at exact cursor with same pinned host. Revalidate credentials; resume without whole-case replay. | 0 |
| **Database restore loses checkpoint but Identity fence survives** | Fail closed. Invalidate old assignments under new recovery epoch. Enter `blocked` hold; reconstruct from owner journals. | 0 |

Automatic recovery is permitted only when proven safe. If three consecutive recoveries occur at the same checkpoint cursor without durable progress, the case transitions to `RUNTIME_WORKER_UNHEALTHY` hold.

### Closed Runtime Error Literals

```rust
pub enum RuntimeErrorCodeV1 {
    RUNTIME_ASSIGNMENT_STALE,
    RUNTIME_LEASE_EXPIRED,
    RUNTIME_CONTEXT_MISMATCH,
    RUNTIME_VERSION_INVALID,
    RUNTIME_DEPENDENCY_UNAVAILABLE,
    RUNTIME_CHECKPOINT_CONFLICT,
    RUNTIME_CHECKPOINT_UNAVAILABLE,
    RUNTIME_VALUE_UNAVAILABLE,
    RUNTIME_VALUE_STALE,
    RUNTIME_INPUT_INVALID,
    RUNTIME_LIMIT_EXCEEDED,
    RUNTIME_WORKER_UNHEALTHY,
    RUNTIME_AUTHORITY_UNAVAILABLE,
    RUNTIME_SUBMISSION_UNKNOWN,
    RUNTIME_INFERENCE_UNKNOWN,
    RUNTIME_HUMAN_RESPONSE_STALE,
    RUNTIME_STOPPED,
    RUNTIME_SANDBOX_UNAVAILABLE,
}
```

---

## Observability and audit

### Content-Free Trace Stream
Every committed step appends an append-only trace record to `orchestration_trace`:
- Sequence number, checkpoint revision, node ID, iteration path.
- Event tag, effect kind, stable action ID, attempt UUID, and owner result references.
- Active elapsed time, monotonic clock delta, model token counts, and certified route pricing.
- **Content-Free Boundary:** Raw prompt text, LLM completions, DOM trees, screenshots, customer PII, and vendor tokens are strictly excluded from telemetry and traces.

### Sensitive Value Encryption and Custody
- Typed checkpoint values are encrypted with **AES-256-GCM** using a 96-bit random nonce and per-execution DEK wrapped through HashiCorp Vault.
- Additional Authenticated Data (AAD) cryptographically binds `organization_id`, `execution_id`, `binding_id`, `value_revision`, and `behavior_sha256`.
- Only the central Coordinator unwraps keys for active, authenticated assignments or authorized human audit. Workers possess no direct key custody.
- Plaintext values are purged 7 days after case termination; resumability expires after 30 days of inactivity.

---

## Security and threat model

### Isolation and Defense in Depth
1. **Adversarial Prompt Injection:** Ingested invoices, emails, or third-party web content cannot alter graph control flow, grant permissions, or alter tool targets. Action dispatch requires deterministic postconditions and external Identity PDP authorization.
2. **Credential Theft Defense:** Workers receive no permanent credentials or Vault tokens. Egress brokers inject credentials out-of-process for registered URL templates.
3. **Execution Guard and Race Protection:** Checkpoint commits enforce Compare-And-Swap (CAS) on `(expected_revision, expected_control_generation, assignment_epoch)`. Stale or partitioned workers are rejected with HTTP 409 (`RUNTIME_CHECKPOINT_CONFLICT`).
4. **Local Workstation Reservation:** Actuation on employee machines requires exclusive 30-second renewable reservations via `LocalExecutionReservationBroker`. Screen observation pause immediately revokes the reservation and stops local actuation at a safe primitive boundary.

---

## Test strategy

Contract compliance and behavioral invariants are verified through formal schemas and normative fixtures:

### 1. Normative Contract Validation
All wire messages are validated against Draft 2020-12 schemas in `docs/architecture/contracts/`:
- `agent-runtime-v1.schema.json`
- `application-adapters-v1.schema.json`
- `identity-policy-v1.schema.json`
- `outcome-verification-v1.schema.json`
- `control-plane-v1.openapi.json`

### 2. Behavioral Verification Vectors
Executable test vectors in [`agent-runtime-v1.fixtures.json`](../architecture/contracts/agent-runtime-v1.fixtures.json) prove:
- **CAS & Epoch Racing:** Dual workers racing to claim an assignment result in exactly one winning epoch.
- **Action Identity Stability:** `act_` digests remain deterministic across restarts and restores.
- **Foreach Isolation:** Iteration failure preserves previous committed iterations with zero replay.
- **Model Taint Tracking:** Inferred values cannot satisfy Tier 2/3 mutation arguments without independent verification.
- **Reservation Lifecycle:** Wait states release workstation locks; revoked reservations enter exclusion holds.
- **Eleven-Case Batch Audit:** Comprehensive batch execution covering standard completion, human clarification, approval waits, and disconnected dispatches yielding exact expected aggregate counts.

---

## Performance and operations

### Operational Limits and Resource Caps
- **Active Execution Budget:** Default 900,000 ms (15 minutes) active CPU/elapsed budget per case.
- **Node Visit Bound:** Maximum $\min(10000, \text{compiler-proven bound})$ node executions.
- **Program Size Cap:** Maximum 8 MiB decoded `ExecutableAgentBodyV1`.
- **Value Storage Limits:** Maximum 256 KiB per typed value; maximum 2 MiB aggregate live values per checkpoint.
- **Command Envelope Cap:** 256 KiB maximum JSON payload for runtime commands and snapshots.
- **Assignment Lease:** 30-second lease renewed every 10 seconds via heartbeat.
- **Human Clarification Window:** 24-hour expiration on unanswered questions before transition to Needs Clarification.

---

## Architecture decisions and open questions

### Resolved Architectural Decisions ([ADR-0017](../adr/0017-agent-runtime-execution-and-recovery.md))
1. **Shared Pure Rust Core:** Single deterministic evaluator (`oryn-runtime-core`) shared across cloud, desktop, and simulation.
2. **Orchestrator-Owned Checkpoints:** PostgreSQL CAS owns durable state; no independent runtime database.
3. **Mandatory gVisor Cloud Isolation:** Fresh sandbox per assignment with non-root UID 10001 and dropped capabilities.
4. **Pinned Case Host Placement:** Case binds permanently to cloud or local device; no runtime state migration.
5. **One-Shot Dispatch Fencing:** Durable `identity_action_fence` consumed before dispatch; ambiguous outcomes hold to prevent duplicates.
6. **Encrypted Value Split:** Ciphertext values purged 7 days post-termination; content-free exclusion metadata retained 24 months.

### Handoff Answers ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Pure IR step evaluation, transition proposal generation, and execution budget enforcement.
2. *Data ingress/egress:* Ingests job assignments and validated inputs; outputs authorization requests, adapter dispatches, and verification requests.
3. *Versions/identities:* Execution ID, Assignment ID, Assignment Epoch, Checkpoint Revision, Control Generation, and Action ID.
4. *Upstream failure:* Denials or timeouts from Identity, Adapters, or Inference halt execution into safe hold states.
5. *Authority:* Identity Policy is authoritative for permission; Outcome Verification is authoritative for business correctness.
6. *Testing without private details:* Validated via synthetic fixtures and deterministic binding vectors.
7. *Audit and duplicate prevention:* Stable action IDs and single-use consumption fences prevent duplicate execution.
8. *Failure blast radius:* Worker crashes affect only the current assignment; persistent checkpoints enable safe resumption.
9. *v1.0 criteria:* Enables ORY-026, ORY-027, ORY-028, ORY-041, ORY-043, ORY-044, ORY-045, ORY-070, ORY-071, and ORY-074 under verified containment.
