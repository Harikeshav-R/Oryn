# Agent Runtime Technical Specification Plan

## Context

Fully flesh out `agent-runtime` implementation details using `PRODUCT.md` as product authority and `TECHNICAL.md` as architectural authority. Produce documentation, normative schemas and executable contract fixtures—not runtime software. Preserve the 12 canonical component headings and mark the result `Detailed technical specification — implementation pending`.

The design uses a shared Rust interpreter; mandatory gVisor cloud isolation; PostgreSQL-owned checkpoints; minimal encrypted typed values; one pinned host per case; resource release during human waits; fresh cloud sandboxes per assignment; live model evaluation plus diagnostic replay; a 15-minute default active budget; 24-hour clarification expiry; safe automatic crash recovery; operator-controlled continuation after submission uncertainty; and active-data purge with honest backup-retention disclosure.

## Confirmed repository anchors

- `docs/components/agent-runtime.md` is a baseline brief, not implemented software. Its sections currently leave sandbox, checkpoint, local-host and recovery mechanics open.
- `docs/adr/0015-agent-factory-ir-and-candidate-qualification.md` and `docs/components/agent-factory-ir.md` fix the closed ten-node DAG IR, exact transforms and outcomes, evidence/taint rules, two foreach levels, 1,000 items per loop and 10,000 worst-case visits. Runtime must implement these semantics, not invent another IR.
- `docs/adr/0016-application-adapter-qualification-and-dispatch-boundaries.md` fixes signed first-party Rust adapter workers, out-of-process egress, opaque credentials, per-operation qualifications and one-shot mutation attempts. Adapter journal, Identity fence and Orchestrator checkpoint are distinct records.
- `docs/components/job-orchestration.md` owns assignment, durable checkpoint persistence, job/case state and recovery. Its workflow-engine choice is still open; this design resolves only the PostgreSQL execution protocol needed by Runtime.
- `docs/architecture/contracts/identity-policy-v1.schema.json` defines the closed `ExecutionContextV1` job/assist union. `AuthorizationRequestV1` has no caller-supplied worker ID; Identity constructs that binding from verified principal context. Consume request and attempt IDs require UUIDv4.
- `docs/architecture/contracts/application-adapters-v1.schema.json` defines `AdapterSubmissionReceiptV1`, not `SignedAdapterSubmissionReceiptV1`. It provides prepare/execute/status/readback but no typed operation-value retrieval interface. `outcome-verification-v1.schema.json` currently defines compile-time projections, not runtime request/verdict records. Contract 10 has no normative assignment/checkpoint wire schema.
- `docs/architecture/cloud-inference.md` §3.10 fixes `agent_runtime_reason`, `text.reason`, `agent.runtime-value.v1`, pinned model configuration, 32 KiB input, 16 KiB output and a 30,000 ms maximum timeout. The Factory wire result requires `schema_id` even where prose abbreviates it.
- Existing PostgreSQL delivery leases last 30 seconds and renew every 10 seconds. Generic delivery retry is not permission to replay an application mutation.
- Existing `GLOSSARY.md` distinguishes Agent Version, Action Authorization, Submission Receipt, Readback Evidence, Application Connection and Assist Session. Do not replace those definitions with implementation details.

## Approach

### 1. Establish one interpreter and three hosts

Expand `docs/components/agent-runtime.md` under the existing 12 headings. Use normal technical prose, exact field tables, Rust interface declarations, state transitions and crash-window matrices.

Name the shared pure Rust module `oryn-runtime-core` and signed host binary `oryn-runtime-worker`. The same semantic revision, node evaluator and value/evidence implementation run in cloud production, employee-local jobs and simulation. Reuse Factory-owned `AgentIRV1`, `ExecutableAgentBodyV1`, `ValueRefV1`, `ValueEvidenceV1`, `RuntimeModelBindingV1`, `RuntimeModelResultV1`, application-owned `DataTypeV1`, and Graph rule evaluation. Do not duplicate their wire definitions.

Specify this core entry point:

```rust
pub fn advance(
    program: &ExecutableAgentBodyV1,
    checkpoint: &ExecutionCheckpointV1,
    inputs: &RuntimeInputs<'_>,
    event: &RuntimeEventV1,
    clock: RuntimeClockV1,
) -> Result<RuntimeTransitionV1, RuntimeErrorV1>;
```

`RuntimeClockV1` supplies trusted UTC and monotonic elapsed time; the core reads no wall clock directly. `RuntimeTransitionV1` contains the next logical checkpoint, at most one requested effect and a disposition. Core events are `start`, `effect_result`, `human_response`, `verification_result`, `resume`, `pause`, `cancel`. Effects are `adapter_prepare`, `action_authorize`, `action_consume`, `adapter_dispatch`, `adapter_value`, `inference`, `verification`, `human_question`, `escalation`. Dispositions are `continue`, `yield`, `completion_requested`, `stopped`. A disposition never asserts business success.

The core has no database, vendor, provider, filesystem, OS-actuation or credential access. Index immutable nodes/regions once; borrow immutable program data and retain only live bindings instead of cloning program bodies and all prior outputs at every step. Host interfaces perform effects only after their intent is durably accepted.

Put `RuntimeCoordinator` in the existing Control Plane execution modules. Recompute deterministic node results, checked transforms, rule outcomes, evidence lineage, selected edges and requested effect arguments from canonical bindings and authenticated producer events before committing each proposed transition. Merely checking that an edge exists is insufficient. The Coordinator validates executable semantics, not business permission: Identity still evaluates permission and Verifier still evaluates correctness. A compromised runner cannot forge a pass branch, transform output, verified source, skipped verifier or cursor.

`RuntimeInputs<'a>` is `{bindings:&'a [MaterializedBinding<'a>],rules:&'a [BusinessRuleVersionV1]}`; `MaterializedBinding<'a>` is `{reference:&'a RuntimeBindingRefV1,value:&'a PortableJsonValueV1}`. Coordinator/host hydrates only live referenced inputs and pinned approved rule bodies before calling the pure core. Add authenticated `GET /internal/v1/runtime/assignments/{assignment_id}/values/{binding_id}?revision={value_revision}` returning `RuntimeMaterializedValueV1 {schema_id:"runtime.materialized-value.v1",binding,value}` after expiry, classification, digest, current assignment and restore-fence checks. Cap the full canonical response at 256 KiB; missing/expired values return RUNTIME_VALUE_UNAVAILABLE/STALE, never an implicit reread. Plaintext remains outside checkpoint metadata. The response is an authorized internal execution projection, not telemetry or public audit.

Pin placement for the entire case: cloud host for API-only execution; employee-local host when any operation requires that employee device, including mixed API/browser cases. Local hosts call authorized cloud adapter interfaces rather than migrating interpreter state. Preserve the exact device/profile binding through suspension; device loss pauses the case. Never perform automatic cloud/local migration.

Keep HUD Assist Session ownership and its existing reducer in `docs/components/local-context-hud.md`; do not convert assists into fabricated jobs or add a second assist lifecycle. Shared action/reservation/Identity interfaces accept the existing job/assist contexts, while Runtime assignment admission requires the job variant. Simulation uses real simulation-scoped job/case execution records and environment `simulation`, not a new Identity context variant.

### 2. Define assignment, lease and checkpoint contracts

Create `docs/architecture/contracts/agent-runtime-v1.schema.json`, Draft 2020-12, `$id` `urn:oryn:schemas:agent-runtime:v1`. Use closed objects, explicit nullable fields, existing Identifier/UUID/timestamp/hash definitions, decimal-string U64 revisions and counters, and existing portable business values without JSON numbers. Do not make business-value schemas permissive merely to allow integer transport metadata.

Use these records and exact field sets; `schema_id` is required on every top-level wire record:

| Record / schema ID | Required fields beyond `schema_id` |
|---|---|
| `RuntimeAssignmentV1` / `runtime.assignment.v1` | `organization_id`, `execution_id`, `assignment_id`, `assignment_epoch`, `worker_id`, `execution_context`, `environment`, `agent_version_id`, `behavior_sha256`, `manifest_sha256`, `host`, `checkpoint_revision`, `control_generation`, `limits`, `issued_at`, `lease_not_after` |
| `RuntimeHostV1` | tagged `kind:"cloud"` with null `device_id`/`profile_id`, or `kind:"local"` with both non-null |
| `RuntimeLimitsV1` | `max_node_executions`, `max_active_ms`, `max_checkpoint_bytes`, `max_value_bytes`, `max_program_bytes` |
| `ExecutionCheckpointV1` / `runtime.checkpoint.v1` | `organization_id`, `execution_id`, `execution_context`, `agent_version_id`, `behavior_sha256`, `revision`, `control_generation`, `region_id`, `node_id`, `phase`, `loop_frames`, `binding_refs`, `pending_effect`, `node_executions`, `active_elapsed_ms`, `wait`, `last_progress_at` |
| `RuntimeLoopFrameV1` | `foreach_node_id`, `body_region_id`, `collection_binding_id`, `collection_sha256`, `item_count`, `next_index`, `completed_output_binding_ids` |
| `RuntimeBindingRefV1` | `binding_id`, `slot`, `type_sha256`, `value_sha256`, `evidence`, `value_revision`, `expires_at` |
| `RuntimePendingEffectV1` | `effect_id`, `kind`, `node_id`, `iteration_path`, `state`, `action_id`, `attempt_id`, `owner_result_ref`; nullable fields are explicit |
| `RuntimeWaitV1` | `kind`, `reference_id`, `expires_at`, `resume_required`; kinds are `approval`, `human_input`, `verification`, `clarification`, `restriction`, `authority_unknown`, `submission_unknown`, `inference_unknown`, `resource_limit` |
| `RuntimeHeartbeatV1` / `runtime.heartbeat.v1` | `command_id`, `assignment_id`, `assignment_epoch`, `checkpoint_revision`, `control_generation`, `active_elapsed_ms` |
| `RuntimeCheckpointCommitV1` / `runtime.checkpoint-commit.v1` | `command_id`, `assignment_id`, `assignment_epoch`, `expected_revision`, `expected_control_generation`, `transition`, `value_blob_refs`, `owner_result_refs` |
| `RuntimeControlV1` / `runtime.control.v1` | `command_id`, `execution_id`, `expected_control_generation`, `command`, `reason_code`; commands are `pause`, `cancel`, `resume` |
| `RuntimeProgressV1` / `runtime.progress.v1` | `organization_id`, `execution_id`, `assignment_id`, `checkpoint_revision`, `control_generation`, `node_id`, `iteration_path`, `disposition`, `reason_code`, `action_ids`, `verification_refs`, `timestamp_utc` |
| `RuntimeHumanQuestionV1` / `runtime.human-question.v1` | `question_id`, `organization_id`, `execution_id`, `execution_context`, `agent_version_id`, `behavior_sha256`, `node_id`, `iteration_path`, `checkpoint_revision`, `question_template`, `response_type`, `responder_role`, `issued_at`, `not_after` |
| `RuntimeHumanResponseV1` / `runtime.human-response.v1` | `command_id`, `question_id`, `expected_checkpoint_revision`, `decision`, `value`; decisions are `answer`, `reject`, with null value for rejection |

`RuntimeCheckpointCommitV1.transition` uses the wire-only `RuntimeCheckpointProposalV1 {checkpoint,requested_effect_id,disposition}`, not the transient core RuntimeTransitionV1. Requested effect ID is nullable; the checkpoint carries metadata-only pending effect. Coordinator derives actual effect requests from the canonical program/bindings and authenticated owner results. Never send an authority-bearing RuntimeEffectV1 inside a durable commit envelope. The canonical checkpoint metadata and commit body must fit the 256 KiB command cap independently of the 2 MiB live-value cap; reject larger metadata before admitting another effect.

`phase` is `ready`, `effect_pending`, `waiting`, `held`, `completion_requested`, or `stopped`. Pending-effect states are `prepared`, `requested`, `owner_acknowledged`, `unknown`. `iteration_path` is an ordered array of at most two `{foreach_node_id,index}` frames. Loop indexes are integer metadata; the core still forbids floating-point business numbers. Human actor identity always comes from the verified request principal, never a response field.

`RuntimeValueSlotV1` is exactly `{kind:"input",name}` or `{kind:"node_output",node_id,iteration_path}`. Loop items resolve through frozen loop-frame collection bindings rather than a second copy. Slots are unique within a checkpoint; binding IDs are immutable opaque Identifiers. `next_index` is zero-based and advances only when that iteration's output commits. The failed iteration remains current.

The core's node-entry transition consumes one visit exactly once, persisted before its first effect; delivering results and resuming the same suspended node do not consume another visit. Only the Coordinator's trusted elapsed measurement changes `active_elapsed_ms`; worker-supplied heartbeat timing is diagnostic. Persist `recoveries_without_progress` on the execution row. Reset it only after a completed node, newly accepted human answer, or newly established owner receipt/verdict—not a heartbeat or no-op checkpoint.

`RuntimeEventV1` is the closed tagged union described in step 1. Effect-result payloads reference the corresponding producer-owned typed record; no arbitrary `object` payloads. `RuntimeTransitionV1` is `{checkpoint, effect, disposition}`. `RuntimeErrorV1` is `{code, node_id, retryability, action_id}` with explicit nullable IDs, content-free messages and retryability `never`, `after_revalidation`, or `safe_read_only`.

Use a 30-second assignment lease and 10-second heartbeat interval. Assignment epoch increases on each reassignment. Exactly one active assignment owns a case. Current worker registration, assignment epoch, lease, control generation and recovery epoch are checked by Coordinator and trusted action admission paths—not by caller-provided assertions alone. Heartbeats renew a lease but never reset checkpoint retention or node/time budgets. Current worker IDs identify process incarnations and are not reused.

Expose only internal execution transport through existing authenticated Control Plane machinery: `POST /internal/v1/runtime/assignments/{assignment_id}/commands`, `GET /internal/v1/runtime/assignments/{assignment_id}`, and `PUT /internal/v1/runtime/assignments/{assignment_id}/values/{binding_id}`. The command envelope is a closed union for claim, heartbeat, checkpoint commit, yield and control acknowledgment. Define matching request/response records in the runtime schema and methods in `RuntimeCheckpointPort`; they return the authoritative assignment/checkpoint snapshot or a closed Runtime error. General JSON command bodies remain at most 256 KiB. Value upload is a separately bounded encrypted octet stream, at most 256 KiB per value; no arbitrary artifact upload or signed URL. Human response/control commands remain on owner-authorized management transport and cannot be invoked by execution workers.

Document `RuntimeCheckpointPort` as asynchronous `claim`, `heartbeat`, `load`, `commit`, `yield_assignment`, each borrowing `VerifiedPrincipal` and receiving/returning the corresponding closed records. No equivalent runtime port currently exists. Put its implementation and tables under Orchestrator ownership, not a parallel Runtime database.

Freeze the remaining nested contracts rather than leaving them to implementation:

- `RuntimeOwnerResultRefV1` is `{owner,id,sha256}`, owner enum `adapter`, `identity`, `inference`, `verification`, `human_input`. All owner result references, pending-effect owner results, progress verification refs and commit owner refs use this record; UUID-like owner IDs stay Identifiers. `RuntimeValueBlobRefV1` is `{binding_id,value_revision,bytes,sha256}`; value upload uses existing assignment/type binding, never caller-selected organization or type.
- `RuntimeClaimV1` (`runtime.claim.v1`) is `{schema_id,command_id,assignment_id,expected_epoch}`; `RuntimeYieldV1` (`runtime.yield.v1`) is `{schema_id,command_id,assignment_id,assignment_epoch,expected_checkpoint_revision,expected_control_generation,reason}` with reason `approval`, `human_input`, `verification`, `pause`, `cancel`, `restriction`, `resource_limit`, `authority_unknown`, `submission_unknown`, `inference_unknown`, or `complete`. `RuntimeControlAckV1` (`runtime.control-ack.v1`) is `{schema_id,command_id,assignment_id,assignment_epoch,control_generation,pending_action_id}`.
- `RuntimeCommandV1` (`runtime.command.v1`) is `{schema_id,kind,payload}` with kind/payload pairs exactly `claim`/RuntimeClaim, `heartbeat`/RuntimeHeartbeat, `commit`/RuntimeCheckpointCommit, `yield`/RuntimeYield, `control_ack`/RuntimeControlAck. Management `RuntimeControlV1` and human answers are not valid worker-command payloads.
- `RuntimeSnapshotV1` (`runtime.snapshot.v1`) is `{schema_id,assignment,checkpoint,value_refs}`; initial checkpoint uses revision `"0"` and the compiled root entry cursor. `RuntimeCommandResultV1` (`runtime.command-result.v1`) is `{schema_id,command_id,snapshot}`. `RuntimeProblemV1` (`runtime.problem.v1`) is `{schema_id,code,execution_id,checkpoint_revision,control_generation}` and contains no business values. Read returns RuntimeSnapshot, successful commands return RuntimeCommandResult, value upload returns RuntimeValueBlobRef, failures return RuntimeProblem. Map stale/CAS to HTTP 409, oversized to 413, malformed to 400, owner dependency unavailability to 503, and unauthorized/existence-sensitive access to existing Control Plane masking behavior.
- UUID fields are organization/execution/assignment/agent-version/command IDs; worker/binding/node/region/effect/action/reference IDs reuse Identifier. All epochs, revisions and visit/time counters use canonical decimal U64 strings. Only bounded collection indexes/counts and byte limits use JSON integer metadata. Environment is exactly `production` or `simulation`. Assignment/checkpoint contexts must be the job union variant. Snapshot/transition data cannot change pinned host, body identity or execution context.
- List caps: loop frames/path two, bindings 10,000, per-commit owner/value refs 256, action/progress refs 256. Unbounded lists and duplicate refs are invalid. The tighter byte caps still apply. Nullable checkpoint fields are `pending_effect` and `wait`; cursor/node remain the last exact location even for a yield/stop. Nullable pending-effect fields are action ID, attempt ID and owner result ref. Question answer values follow response_type nullability; rejection value must be null. Wait expiry is nullable only for restriction, verification, authority_unknown, submission_unknown and inference_unknown holds. Authority uncertainty with proven zero dispatch is Blocked, not a fabricated unknown business effect; if dispatch itself is uncertain use Outcome Unknown.
- Define RuntimeCheckpointPort with these exact asynchronous methods; none exposes mutable database handles:

```rust
pub trait RuntimeCheckpointPort: Send + Sync {
    fn claim<'a>(&'a self, principal: &'a VerifiedPrincipal, request: RuntimeClaimV1)
        -> impl Future<Output = Result<RuntimeCommandResultV1, RuntimeProblemV1>> + Send + 'a;
    fn heartbeat<'a>(&'a self, principal: &'a VerifiedPrincipal, request: RuntimeHeartbeatV1)
        -> impl Future<Output = Result<RuntimeCommandResultV1, RuntimeProblemV1>> + Send + 'a;
    fn load<'a>(&'a self, principal: &'a VerifiedPrincipal, assignment_id: Uuid)
        -> impl Future<Output = Result<RuntimeSnapshotV1, RuntimeProblemV1>> + Send + 'a;
    fn commit<'a>(&'a self, principal: &'a VerifiedPrincipal, request: RuntimeCheckpointCommitV1)
        -> impl Future<Output = Result<RuntimeCommandResultV1, RuntimeProblemV1>> + Send + 'a;
    fn yield_assignment<'a>(&'a self, principal: &'a VerifiedPrincipal, request: RuntimeYieldV1)
        -> impl Future<Output = Result<RuntimeCommandResultV1, RuntimeProblemV1>> + Send + 'a;
}
```
- Pure core `RuntimeEventV1` uses `{kind:"start"}`, `{kind:"effect_result",effect_id,result}`, `{kind:"human_response",response}`, `{kind:"verification_result",result}`, `{kind:"resume",control_generation}`, or `{kind:"pause"|"cancel",control_generation,reason_code}`. `RuntimeOwnedResultV1` is a closed tag/value union of AdapterPreparedOperation, AuthorizationDecision, ActionConsumption, AdapterSubmissionReceipt, AdapterOperationValue, RuntimeModelResult and RuntimeHumanQuestion. Verification/human responses use their dedicated event variants. Coordinator constructs these internal events only after retrieving/validating the producer result. Worker command transport carries owner result references, never an unauthenticated claimed result payload.
- `RuntimeEffectV1` is `{effect_id,kind,node_id,iteration_path,request}`. Request type is selected by kind: AdapterPrepareRequest, AuthorizationRequest, ConsumeAction, AdapterExecuteRequest, AdapterValueQuery, InferenceRequest, VerificationRunRequest, RuntimeHumanQuestion, or `{reason_code,recipient_role,evidence_refs}` for escalation, respectively. Effect requests that include authority are transient host data; persisted pending effects contain IDs/digests only. Distinguish the ephemeral core/host event/effect interface from the persisted wire checkpoint format; never serialize credentials into a checkpoint through this union.

- For model effects, count the complete transmitted prompt/template, bindings and manifest content against the smaller of the pinned input-byte limit and 32 KiB. Never truncate or substitute content to fit. RuntimeCoordinator submits governed inference on behalf of the registered execution principal; no extra provider or inference authority is implied by an execution child token.


### 3. Specify authoritative persistence and safe recovery

Add owner-scoped execution protocol sections to `docs/components/job-orchestration.md`; do not mark the whole scheduling specification complete. Include concrete PostgreSQL DDL for these new Orchestrator-owned tables:

- `orchestration_execution`: organization/execution UUID composite PK; unique `(organization_id, execution_context_sha256)`; pinned context/version/body/manifest hashes and host; current assignment UUID and incarnation worker ID; U64 epoch, control generation and checkpoint revision; lease deadline; runtime phase, active budget/elapsed counters, last progress and terminal timestamps.
- `orchestration_checkpoint`: PK `(organization_id, execution_id, revision)` and composite FK to execution; canonical metadata JSONB, metadata SHA-256, created timestamp. Contains binding references, not plaintext business values or tokens.
- `orchestration_value`: PK `(organization_id, execution_id, binding_id, value_revision)`; type/value digests; nonce, encrypted typed bytes, wrapped DEK, source expiry and retention deadline. Enforce value and total checkpoint byte caps before accepting new state.
- `orchestration_effect`: PK `(organization_id, execution_id, effect_id)`; unique node/iteration/invocation identity; kind/state; stable action ID; attempt UUID; owner result reference and receipt digest; no vendor payloads or signed bearer/admission tokens.
- `orchestration_trace`: PK `(organization_id, execution_id, sequence)`; checkpoint revision, node/path, content-free event tag, action/result refs and timestamp; append-only.
- `orchestration_human_question`: PK `(organization_id, question_id)`; execution/node/path/version/revision binding, role, deadline and state `open`, `answered`, `rejected`, `expired`, `invalidated`; typed response references live in the encrypted value store.

Use UUID, TEXT, TIMESTAMPTZ, BYTEA, JSONB and `NUMERIC(20,0)` as appropriate. Define tenant-safe composite foreign keys, unique constraints, checks, lease/retention indexes, and `ENABLE`/`FORCE ROW LEVEL SECURITY` policies using the existing `oryn.organization_id` convention. Do not invent missing canonical job-table names; bind the existing execution context through its owner.

Commit cursor, changed binding references, effect intent/result, trace append, counters and outbox progress in one `TenantTransaction` with revision/control-generation CAS. SQL updates are deltas; immutable program and unchanged value blobs are not copied into every checkpoint. Repeated command ID with identical content returns the committed result; conflicting content returns `RUNTIME_CHECKPOINT_CONFLICT`. Stale worker/control writes cannot change canonical state. Late owner receipts remain ingestible as historical evidence through trusted owner delivery, even after worker loss; stale workers cannot use that exception to advance execution.

No external calls or signing occur while row locks are held. Respect existing Identity/adapter/Graph lock order. Add an execution guard consulted by Identity admission and Adapter journal/broker paths; when combined locks are necessary, take existing Identity guards, adapter/Graph guards in their established order, then the execution guard, then checkpoint/effect rows. Orchestrator-only stop/reassignment locks the execution guard and never calls back into an earlier lock tier while holding it.

Default mutation action ID is stable across worker restarts and relational restore: `"act_" + SHA256(RFC8785({organization_id,execution_context,node_id,iteration_path}))` in lowercase hex. Each compiled node/path executes once in the acyclic IR. Generate and checkpoint UUIDv4 request/attempt IDs before authority consumption. Explicit reconciled retry uses a new action intent and existing `AdapterRetryContextV1`; never derive another mutation action ID merely from worker epoch or a delivery retry.

Specify this crash matrix:

| Crash window | Recovery |
|---|---|
| Before committed effect intent | Resume exact committed cursor; no external effect was admitted |
| After prepare, before consumption | Reload staged state; revalidate target, lease, scope and approval; fresh expired authority may be requested for the same unconsumed action |
| Consume response lost / durability unknown | Query Identity status to classify the hold only. AuthorizationStatusV1 does not return an admission or durability proof. Without the original confirmed, unexpired admission, perform zero dispatches, persist an authority-uncertainty hold and require reconciliation before any fresh intent; never consume again as a recovery shortcut |
| Worker replaced after fence consumption, even if no dispatch is known | Never transfer old admission to new worker; query Adapter status and hold unless existing independent reconciliation supports a fresh intent |
| Dispatch possibly started, receipt absent | `Outcome Unknown`; independent verification/reconciliation only, no resend |
| Adapter receipt durable, Runtime checkpoint missing | Fetch trusted Adapter status, persist the receipt, request verification; do not repeat mutation |
| Verification result durable, Runtime notification lost | Fetch the Verifier-owned result by request ID and commit it once |
| Model response uncertain and no typed value committed | `inference_unknown`; explicit fresh request required, not automatic replay |
| Ordinary crash with no unresolved effect | Fresh assignment at exact cursor, same pinned host, current authority/evidence checks; no whole-case replay |
| Database restore loses checkpoint/receipt but Identity fence survives | Fail closed, invalidate old assignments under new recovery epoch, reconstruct from owner journals where possible; hold otherwise. Surviving fence is not proof of no-send |

Automatic crash recovery is limited to the proven-safe row. Repeated crash without durable progress yields `RUNTIME_WORKER_UNHEALTHY` after three recoveries at the same cursor; hold instead of infinite respawn. Recovery never resets budgets, input expiry or prior effects.

### 4. Close the runner-to-executor authority seam

Reuse `AdapterExecutionPort::prepare`, `execute`, `status`, `readback`, asynchronous capability `snapshot`/`statuses`, Identity authorize/consume/status, and the existing authority bundle unchanged. Document: prepare and resolve exact target → persist intent → authorize/review → consume durable fence → executor preflight → journal claim → one-shot broker/OS dispatch → persist receipt → independent verification.

Register one Identity-owned execution principal per current interpreter incarnation, authenticated by cloud workload mTLS or an enrolled local device's audience-bound execution child credential. Extend the owner’s execution registration to bind organization, execution context, host/device/profile, assignment ID/epoch, recovery epoch and allowed execution scopes. Runtime cannot construct a `VerifiedPrincipal` from JSON. Worker ID in signed authority identifies this authenticated dispatching principal; adapter process identity remains a separate delegate recorded in the trusted dispatch journal. Adapter and broker validate the delegate against that server-owned winning action/attempt and current execution guard. Do not treat matching tenant alone as delegation.

Add exact execution token scopes `runtime:claim`, `runtime:read`, `runtime:advance`, `runtime:heartbeat`, `runtime:yield` under audience `execution`, bounded by the existing five-minute child-token maximum. Scope registration never grants job launch, approval, policy administration or vendor credentials. Inference requires separate existing inference authorization.

Guard checks reject stopped, superseded, expired and wrong-epoch dispatchers before new admission/dispatch acceptance. A dispatch accepted before stop/takeover may already be in flight; cancellation is best-effort after the existing irreversible boundary, not a promise that external transmission can be recalled. Replacement workers cannot start further mutations while any older accepted effect remains uncertain.

In addition to lease/scope checks, trusted Adapter preparation and Identity authorization/consumption must resolve the committed pending effect under the execution guard. Match execution principal, assignment ID/epoch, node/path, effect kind, stable action ID, attempt, capability, operation and canonical staged argument digest. Broker/journal dispatch must resolve that same accepted intent and delegate. The worker cannot bypass Coordinator by directly calling these existing owner interfaces. Existing wire requests need no caller-minted proof token: owner services derive the lookup from verified execution principal and action ID, and reject missing/mismatched canonical intents. Apply an equivalent owner-resolved approved assist step for HUD contexts, never a fake Runtime assignment.

Reads also require scoped read authority; `effect=read` has zero diffs, draft/write have 1–128. Preserve exact `sha256_` action and `sha256-` proposal digest conventions, UUIDv4 attempts and checked conversion between adapter JSON-integer revisions and Identity decimal-string U64 revisions. No JavaScript-number intermediary.

The existing Adapter port returns receipts, not typed read values. Add producer-owned internal `AdapterExecutionPort::value(principal, AdapterValueQueryV1) -> Future<Result<AdapterOperationValueV1, AdapterError>>` in `docs/components/application-adapters.md`. Query fields: `{organization_id,execution_context,action_id,receipt_id}`. Result fields: `{schema_id:"adapter.operation-value.v1",organization_id,execution_context,action_id,receipt_id,output_type,value,value_sha256,evidence,expires_at}`. Reference Factory-owned portable JSON/evidence and application-owned type schemas rather than duplicate them. This is retrieval of an already authorized operation result, never another vendor read or a self-verified business verdict. Internal authenticated projection may carry only the declared typed business fields, at most 256 KiB; telemetry and public receipt responses remain content-free. Missing/expired result follows unknown or holds if an earlier mutation needs reconciliation. Values originating in private observations cannot be promoted through this route.

Document stable connection revision as binding external account and vendor subject: changing either requires a new revision and invalidates staging; do not widen action digests speculatively. Distinguish internal journal phase `dispatching` from wire state `dispatched`. Preserve one mutation attempt even for HTTP 429/5xx unless positive no-send evidence exists; positive no-send still never unconsumes an admitted fence.

### 5. Define node execution, evidence and verification behavior

Specify every node's exact input validation, output/evidence shape, selected transition and suspension behavior by referencing Factory semantics:

- `read`: retrieve a scoped Adapter result and producer evidence; a receipt alone supplies no value or verdict.
- `transform`: implement the existing closed operators with checked Graph-compatible decimal strings, explicit rounding authority, equal-currency money and unknown on invalid/overflow/stale/null input. Derived taint is never cleared by parsing.
- `reason`: use the exact material model/template/schema pins. Validate envelope `schema_id`, binding ID, declared type and branch membership. Only an already committed, still-valid typed value can be reused after crash. Unavailable/revoked binding pauses rather than using a different graph edge/provider. Ordinary typed unknown values follow the declared unknown edge.
- `decision`: evaluate approved formal rules with Graph's existing pure three-valued evaluator. No model-authored policy facts, arbitrary fallback choice or latest-version lookup.
- `action`: stage exact before/after values and source requirements; denied/not-submitted outcomes follow only their explicit safe edges. Submission uncertainty yields directly to reconciliation and cannot reach another mutation.
- `foreach`: freeze membership/order and binding digest at entry; zero items execute no body; oversize pauses without truncation. Persist at most two loop frames and exact current iteration. Preserve earlier effects and completed iteration outputs. Never skip, restart or compensate a failed child generically.
- `verify`: submit a producer-owned request and yield while Verifier works. Mandatory `on_unknown`/`on_mismatch` remains `pause_case`; do not traverse into another mutation. Orchestrator may subsequently finalize a business-incorrect case as Failed, preserving the immediate safety pause.
- `human_input`: yield a typed, case/version/node/iteration/revision-bound question. Current responder role/remit and response type are checked server-side. Duplicate identical answer is idempotent; conflicting/stale answer rejects. Expire after 24 hours into Needs Clarification, not approval/rejection. Human answer does not automatically become independent evidence or business authority.
- `escalate`: persist recipient/reason/evidence and yield a terminal execution pause, not case success.
- `finish`: preserve Factory dispositions and request owner assessment. A root finish cannot emit `iteration_complete` or mark Verified Complete.

Resolve Factory join wording conservatively: existing `ValueRefV1` contains no phi/merge binding. A node-output reference must dominate its consumer. Do not infer a common port from equal labels on different branch nodes; add no new IR node or semantic revision. Reconcile the prose in `docs/components/agent-factory-ir.md` without silently broadening its schema.

Extend `outcome-verification-v1.schema.json` and `docs/components/outcome-verification.md` with the minimal owner-owned `VerificationRunRequestV1` / `VerificationRunResultV1` exchange. Request fields: `{schema_id:"verification.run-request.v1",request_id,organization_id,execution_context,agent_version_id,behavior_sha256,requirement_ids,action_ids,checkpoint_revision,environment}`. Result fields: `{schema_id:"verification.run-result.v1",request_id,verification_id,organization_id,execution_context,behavior_sha256,requirement_results,verdict,evidence_refs,verified_at}`. Each requirement result is `{requirement_id,verdict,evidence_refs,limitations}`; verdicts are `verified`, `mismatch`, `unknown`. Add an async `VerificationExecutionPort` with `request` and `status` methods borrowing `VerifiedPrincipal`; the Verifier owns durable idempotency by request ID. Coordinator fetches owner records rather than accepting a worker's claimed verdict. Polling/source precedence and the verifier engine stay with that owner; this task does not redesign them.

Freeze `VerificationExecutionPort` signatures: `request<'a>(&'a self, principal:&'a VerifiedPrincipal, request:VerificationRunRequestV1) -> impl Future<Output=Result<VerificationRunStatusV1,VerificationErrorV1>> + Send + 'a` and `status<'a>(&'a self, principal:&'a VerifiedPrincipal, query:VerificationStatusQueryV1) -> impl Future<Output=Result<VerificationRunStatusV1,VerificationErrorV1>> + Send + 'a`. Query is `{schema_id:"verification.status-query.v1",organization_id,execution_context,request_id}`. Status is the closed union `{schema_id:"verification.run-status.v1",state:"pending",request_id}` or `{schema_id:"verification.run-status.v1",state:"complete",result:VerificationRunResultV1}`. Error is `{code,request_id}` with codes `VERIFICATION_NOT_AUTHORIZED`, `VERIFICATION_INPUT_INVALID`, `VERIFICATION_UNAVAILABLE`, `VERIFICATION_REQUEST_CONFLICT`. Requirement/action/evidence lists cap at 256; limitations cap at 32 strings of 1024 characters. Result aggregate verdict is mismatch if any required result mismatches, unknown if none mismatch but any is unknown, otherwise verified; missing requirements cannot produce verified.

Approval rejection or expiry before any effect can request the compiled expected-rejection path. If prior business effects exist, preserve them and let Orchestrator/Verifier determine partial, failed or unresolved status; do not automatically report a clean rejection. Submission acknowledgment is not completion.

### 6. Define stop, wait and local reservation mechanics

A durable pause/cancel increments execution `control_generation` and blocks new accepted effects. Stop dispatch takes priority over new work; target connected notification acknowledgment is two seconds, not guaranteed external rollback. Cancel active inference; discard late results by assignment epoch, control generation and input binding. CPU-bound core processing checks controls at every node and at least every 10 ms of bounded work.

At human waits, safely checkpoint and yield; destroy cloud sandbox or terminate local worker, release device reservation and all transient operation handles. A consumed/in-flight action is recorded as pending or unknown before yielding; releasing compute never clears an effect hold. Resume rechecks active release, pinned dependencies, policy, actor authority, current evidence and target before-state. Reacquiring a reservation may not repurpose a changed proposal; material drift requires fresh review. Approved sign-off remains 15 minutes; pending proposal expiry remains 24 hours; short-lived action authorization follows Identity's 30-second example, never Control Plane's stale 300-second wording.

Extend the existing Privacy-Helper-owned `LocalExecutionReservationBroker`, not another mutex. Specify a 30-second renewable reservation with 10-second renewal, bound to organization/device/profile/context/workstation-session epoch and a closed holder union: `{kind:"job",assignment_id,assignment_epoch}` or `{kind:"assist",assist_session_id,assist_incarnation}`. The assist incarnation is a fresh UUID per current HUD assist executor, not a Runtime assignment. Context equality is checked against the exact existing ExecutionContextV1; remove the stale local shorthand that adds user/window fields to its assist variant. Helper restart, session epoch change, pause, lock/sleep, visibility loss or disconnect revokes local actuation. Requests fail immediately when busy; Orchestrator owns any job waiting queue. Browser/native jobs and assists share the lock.

Define Helper-owned `LocalExecutionReservationV1 {reservation_id,organization_id,device_id,profile_id,execution_context,workstation_session_epoch,holder,modality,state,issued_at,not_after}`; modality is browser/native and state is `reserved`, `quiescing`, `exclusion_hold`, `released`. Acquire is `{command_id,organization_id,device_id,profile_id,execution_context,workstation_session_epoch,holder,modality}`; renew/release is `{command_id,reservation_id,workstation_session_epoch,holder}`; revoke adds `reason_code`; safe-boundary acknowledgment is `{reservation_id,holder,executor_incarnation,action_id,dispatch_state,primitive_stopped}`. All top-level records have matching `execution.reservation*.v1` schema IDs in the Adapter schema. Holder, epoch and context must match on every operation.

Revoke immediately denies new primitives and enters quiescing, not an unsafe unlocked state. Verified executor acknowledgment with `primitive_stopped=true` releases the active device lock; an already uncertain business outcome retains its case/record exclusion hold independently. Absent acknowledgment, enter exclusion_hold and deny competing local actuation until the executor is proven terminated or owner reconciliation completes. The first accepted release/renewal wins CAS; duplicate identical commands are idempotent, conflicting commands fail. Renew cannot revive an expired/revoked lease.

Carry the reservation grant/holder/deadline on browser reserve, renewal, action and receipt payloads; browser/native executors enforce the same live lease. Negotiate `browser-bridge.v1` major 1 minor 5 with required capability `execution_reservation_lease_v1` in addition to the two existing authority/reservation capabilities; native `shell-adapter.v1` advances to major 1 minor 1. Migrate all current producer/consumer examples and exact-version references returned by searching these protocol literals in TECHNICAL.md and docs; historical ADR statements remain historical with an amendment. Do not silently accept older peers for this lease-enforced execution path.

Add signed unprivileged `oryn-runtime-worker` supervision to Desktop Shell using private inherited duplex `shell-runtime.v1` major 1, minor 0. Use four-byte little-endian length-prefixed JSON frames, maximum 256 KiB, protocol handshake binding organization/device/profile/assignment/epoch. Bound queues to 64 frames / 4 MiB with eight reserved control slots; value transfers use chunks at most 64 KiB. No new public listener, accessibility permission, browser renderer or vendor connection. Existing `SessionBroker` provides only the current audience-bound execution child credential to this signed child. Add a narrowly allowlisted Rust `RuntimeControlPlaneClient` in the local host for the internal Runtime endpoints; this is a new client, not a claim that an existing shell relay implements this interface. It receives no refresh token or raw vendor credential. Model effects execute through the central RuntimeCoordinator and governed inference interfaces on authorized job values, never through a new local provider client. Worker memory is ephemeral; central Orchestrator owns durable job checkpoints. Screen pause/Pause All stops local action dispatch at a safe boundary without disturbing independently authorized meeting capture. Offline execution remains prohibited.

Preserve deterministic target handles and fresh geometry while advancing browser/native execution peers to the lease-enforced versions defined above. Native actuation remains Stage 3 only. HUD assists keep their own lifecycle/authority contexts while sharing this reservation protocol; no old-version bypass is retained.

### 7. Bound resources, sensitive state and diagnostic replay

Document these defaults as operational admission limits, not benchmark results or new executable-body fields: 900,000 ms active execution per case; min(10,000, compiler-proven bound) node visits; 8 MiB decoded program; 2 MiB total live checkpoint values; 256 KiB per typed value; one in-flight effect per assignment. Oversize inputs fail before work; oversize later results preserve receipt/hold metadata and stop instead of truncating or repeating an effect. Organization limits can tighten; a different finite time budget requires explicit approved workflow/release execution configuration carried in the assignment. All counters survive restart. Approval/human/verification yields do not consume active time; crash recovery conservatively charges the elapsed unaccounted lease interval rather than refunding it.

Fresh cloud gVisor sandbox per assignment, non-root UID 10001, read-only root, dropped capabilities, no service-account token, no swap/core dumps, no host mounts and no direct database/Vault/vendor/provider egress. Allow only authenticated owner/control interfaces. Declare a 1 vCPU / 512 MiB runtime limit and 16 MiB memory-only scratch; OOM/resource exhaustion yields a recoverable hold, never automatic mutation replay. Missing gVisor registration blocks admission. Infrastructure config uses RuntimeClass `gvisor`, handler `runsc`, and pod `runtimeClassName: gvisor`; actual sandbox certification is an infrastructure prerequisite, not a name-only check. Local hosts use signed child isolation under the existing trusted-OS assumption and receive no claim of Linux/gVisor isolation.

Encrypt typed checkpoint values with AES-256-GCM, random 96-bit nonce, per-execution DEK wrapped through existing Vault custody. AAD binds organization, execution, binding identity, value revision and behavior digest. Coordinator alone unwraps for an authenticated current assignment or authorized owner review; workers never access Vault directly. Store no raw prompt/completion, chain-of-thought, DOM, screenshots, audio, transcripts, vendor credentials or bearer/admission tokens. A validated typed model result remains unverified business data with provenance; it is not retained raw completion text.

Authorized execution reads are distinct from passive observation. Local-private values and 30-second volatile observation-derived data cannot become durable central checkpoints; an expired/private source pauses the dependent path rather than silently changing classification. Retention-off observation preferences do not erase content-free business receipts or independently authorized execution records.

Purge active checkpoint values seven days after terminal disposition; expire resumability after 30 days without durable semantic progress. Heartbeats, reloads, rejected CAS, repeated same-state checkpoints and diagnostic replay do not reset progress. Effective value expiry is the earliest source expiry and checkpoint policy deadline. Remove active ciphertext/wrapped-key rows; retain content-free action/effect exclusion metadata and consequential audit under the existing 24-month default. Encrypted backups follow the approved infrastructure schedule; filter expired values before any restored read. No claim of instant physical backup erasure or new per-execution key-destruction journal.

Restore filtering must use non-rollback deadlines, not just restored checkpoint rows. Append minimal `runtime_retention_fence` records to the existing independent consequential audit/recovery journal before acknowledging terminal disposition, source invalidation, policy shortening or active purge. Record `{organization_id,execution_id,retention_generation,terminal_at,last_progress_high_watermark,source_deadline,retention_deadline,invalidated_binding_ids,event_at}` with explicit nullable timestamps and no business values. Deadline restrictions take minimum and never relax under replay; progress high-watermark uses max of committed semantic progress. During restore, replay these records before any unwrapping, including owner review; missing/gapped reconciliation denies value reads. This extends existing audit durability, not a new cryptographic key-destruction service or an instant backup-erasure promise.

Extend `AuthorityJournalEntryV1.kind` with `runtime_retention_fenced` and `RecordAfterImageV1.table_name` with `orchestration_retention_fence`; conditionally constrain that table's `state_after` to the closed `RuntimeRetentionFenceV1` projection above. Add the matching Orchestrator-owned RLS table keyed by `(organization_id,execution_id,retention_generation)` and record_id `execution_id/retention_generation`. Invalidated binding IDs cap at 256; larger invalidations use ordered entries under one generation and deny reads until its complete journal checkpoint is confirmed. Reuse existing append-on-commit/durability_pending/signed-checkpoint release rules. No new unbounded journal payload or raw-value after-image is allowed.

Trace schema contains sequence, checkpoint/node/path, effect kind, owner IDs/digests, outcome tags, timing and token/cost counts. Raw tool arguments/customer values stay out of telemetry; authorized replay dereferences encrypted values only while accessible, otherwise shows Evidence Unavailable.

Simulation invokes the same core and body hash with existing `AdapterEnvironmentBindingV1` outside executable identity. `live` mode uses certified pinned inference for readiness coverage. `recorded_diagnostic` injects previously validated typed results bound to node/path/model pins/input digest and never establishes release coverage for model reasoning. Replay cannot dispatch production effects, upgrade inferred evidence or conceal fidelity gaps. Absence of retained values makes that replay incomplete, not silently live or passed.

Use these closed Runtime error literals: `RUNTIME_ASSIGNMENT_STALE`, `RUNTIME_LEASE_EXPIRED`, `RUNTIME_CONTEXT_MISMATCH`, `RUNTIME_VERSION_INVALID`, `RUNTIME_DEPENDENCY_UNAVAILABLE`, `RUNTIME_CHECKPOINT_CONFLICT`, `RUNTIME_CHECKPOINT_UNAVAILABLE`, `RUNTIME_VALUE_UNAVAILABLE`, `RUNTIME_VALUE_STALE`, `RUNTIME_INPUT_INVALID`, `RUNTIME_LIMIT_EXCEEDED`, `RUNTIME_WORKER_UNHEALTHY`, `RUNTIME_AUTHORITY_UNAVAILABLE`, `RUNTIME_SUBMISSION_UNKNOWN`, `RUNTIME_INFERENCE_UNKNOWN`, `RUNTIME_HUMAN_RESPONSE_STALE`, `RUNTIME_STOPPED`, `RUNTIME_SANDBOX_UNAVAILABLE`. Preserve underlying Identity, Adapter and Inference codes as separately typed owner errors, not unstructured strings or swallowed failures.

### 8. Reconcile the narrow shared-contract changes

Update `TECHNICAL.md` §§6.2, 7.2, 11.4–5 and the Agent Runtime row in §13.2 to reference the resolved runtime design, host placement, checkpoint ownership, worker fencing and recovery. Product behavior does not change; do not rewrite `PRODUCT.md` merely to mirror implementation choices.

Apply only required interface amendments to `docs/components/job-orchestration.md`, `application-adapters.md`, `identity-policy.md`, `control-plane.md`, `desktop-shell.md`, `local-privacy-storage.md`, `local-context-hud.md`, `browser-extension.md`, `flight-simulator.md` and `outcome-verification.md`: owner delegation/guards, local worker transport, reservation lifecycle, result retrieval, independent verdict exchange, diagnostic replay and truthful stop/rejection semantics. Do not flesh out unrelated scheduler, verifier, simulator or infrastructure internals.

Add runtime internal transport and owner DTO references to `control-plane-v1.openapi.json`; add only necessary runtime scopes/registration definitions to `identity-policy-v1.schema.json`, Adapter value definitions to `application-adapters-v1.schema.json`, and verification exchange definitions to `outcome-verification-v1.schema.json`. Root unions must include newly exposed top-level records. Preserve existing closed schemas and caller migrations. No compatibility aliases or generic dictionary envelopes.

Fix runtime-relevant contradictory wording: nonexistent signed submission receipt references in catalog/verifier/data classification → `AdapterSubmissionReceiptV1`; fake transparent model failover → pause; stop rollback/automatic clean rejection → recorded partial effects; Factory branch-join wording → actual dominance; Factory result shorthand → complete schema envelope; simulator crash core-dump capture → dumps disabled and sanitized metadata. Keep unrelated historical ADR text and unrelated idempotency defects outside this change.

Create `docs/adr/0017-agent-runtime-execution-and-recovery.md` if 0017 remains unused; otherwise use the next actual sequential number. Record the hard-to-reverse decisions: shared Rust core; Orchestrator-owned PostgreSQL CAS; gVisor per assignment; pinned placement; externally fenced one-shot dispatch; sensitive value/backup retention split. Cross-reference ADR-0011, ADR-0012, ADR-0015 and ADR-0016 and add narrow amendments where execution delegation/reservation requires them. Maintain normal ADR prose, not interview notes.

Add only domain terms to `GLOSSARY.md`, each one or two sentences, no schema/SQL/technology details:

- **Execution Assignment:** Bounded responsibility to continue one case under a fixed agent version and declared scope. It does not itself authorize a business action. Avoid: blanket permission, job launch.
- **Execution Checkpoint:** A recorded continuation point and necessary case context that preserve completed effects without treating them as permission to repeat work. Avoid: rollback snapshot, success receipt.
- **Reconciliation:** An evidence-backed determination of what happened after an uncertain business action, used to decide safe next work. It does not itself authorize another action. Avoid: automatic retry, assumed rollback.

Keep glossary additions singular/canonical; reuse equivalent existing terms if user edits introduce them during execution. Update the contract catalog, data classification and threat-model execution sections for these new normative contracts. Ordinary index/status synchronization follows the repository's documentation completion convention, without claiming Runtime software exists.

### 9. Supply runnable contract fixtures and behavioral proofs

Create `docs/architecture/contracts/agent-runtime-v1.fixtures.json` using the existing `{case_id,schema_ref,instance,expected_valid}` validation-case convention. Add `binding_vectors` with closed kinds and concrete complete inputs/events/expected outputs, not narrative-only test descriptions. No real customer data or production keys.

Required schema negatives: missing/extra fields; assist context where a job assignment requires job; invalid host/device pairing; U64 overflow; numeric business value; missing/wrong model envelope discriminator; over-depth loop path; malformed digest prefixes. Structurally valid wrong model-binding IDs and cross-tenant references belong in semantic binding vectors with authoritative context, not expected schema failures. Include valid assignment/checkpoint/progress/question/response, Adapter value and Verification run/result examples.

Required executable binding vectors:

1. Two workers race claim/CAS: exactly one epoch/revision wins; loser cannot admit/dispatch.
2. Old-epoch result after reassignment and late inference after stop: no cursor/value change; owner receipts still retained historically.
3. Crash before consumption versus consumed acknowledgment lost versus after application acknowledgment: expected action ID, dispatch count, next cursor and hold differ correctly.
4. Stable mutation ID across worker restart/restore; new epoch does not generate another write intent.
5. Stop before accepted dispatch: zero sends. Stop after accepted dispatch: known effects or Outcome Unknown, never fabricated rollback.
6. Third foreach iteration fails after two committed iterations: preserve first two, exact third cursor, zero replay/skip; zero/oversize collections follow existing Factory semantics.
7. Tainted model target/Tier 2 or Tier 3 argument: denied until matching independently verified evidence exists; transformation does not clear taint.
8. Approval wait releases reservation; resume after unchanged state can reacquire, changed generation requires fresh proposal.
9. Human response to wrong question/revision/iteration/role or after 24 hours rejects; unanswered state stays Needs Clarification.
10. Mandatory verification mismatch/unknown pauses before further mutation; acknowledged-but-unverified write never completes the case.
11. Independently resolved uncertain submission: prior effect updates, remaining writes require operator resume; verified final-only case can close.
12. Valid saved model value survives crash without extra inference; stale input/route revocation pauses; missing in-flight result is inference_unknown.
13. Recorded diagnostic inference cannot count as live readiness coverage; environment/account crossover rejects.
14. Active elapsed/node budget survives three reassignments; waits excluded, unaccounted crash interval conservatively charged; no-progress recovery cap holds.
15. Heartbeat does not renew sensitive-value retention. Source expiry, terminal seven-day expiry and 30-day inactivity suppress value access while retaining unresolved effect exclusion.
16. Restore filters expired values and does not use a surviving Identity fence as proof that a lost Adapter receipt means no send.
17. Typed read result lookup does not cause another vendor read and cannot substitute a submission receipt for output data.
18. Dominance join rejects branch-local references without a dominating producer; no implicit phi or added IR node.

Each vector includes expected externally visible disposition, cursor/path, dispatch count, authority identity and evidence/value-access consequences where applicable. Update changed existing fixture DTOs, but do not regenerate Factory behavior digests/signatures unless executable content really changes. This plan deliberately preserves the existing executable body.

## Critical files and anchors

1. `docs/components/agent-factory-ir.md:394–453`: authoritative node/dataflow/value semantics; reread before making the two narrow prose clarifications.
2. `docs/components/application-adapters.md:126–161,294–305`: reuse ordered action lifecycle and ports; add only typed-result retrieval/delegation refinements.
3. `docs/architecture/contracts/identity-policy-v1.schema.json:2597–2643,3109–3210,3550–3616`: principal-derived worker identity, UUIDv4 attempts and immutable admission binding.
4. `docs/architecture/contracts/outcome-verification-v1.schema.json:234–303`: mandatory pause_case requirements must constrain runtime verdict transitions.
5. `docs/components/browser-extension.md:939–1000`: existing reservation examples lack lifetime/renewal; align them with the one helper-owned lease protocol rather than adding a second reservation authority.

## Verification

Run after execution approval and integrated edits, from `/Users/hari/Developer/Oryn`. `uv` is `/opt/homebrew/bin/uv`; base Python lacks `jsonschema`. This verifies document/contract coherence, not Runtime software or sandbox certification.

Define `RuntimeFixtureSetV1` as `{schema_id:"runtime.fixture-set.v1",validation_cases,binding_vectors}`. Each binding vector is `{case_id,kind,inputs,expected}`. Freeze tagged input shapes to the exact keys used by each `evaluate` branch below. Business amounts are strings; synthetic clock/counter values are integer metadata. Include every scenario in step 9, at least 18 vectors, every supported kind below, and exactly one `eleven_case_batch` vector.

Batch inputs: IDs inv_01–inv_11 with explicit event traces. First seven use `intent,consume,dispatch,ack,verify`. Next two use `clarification`. Tenth uses `approval`. Eleventh uses `intent,consume,dispatch,disconnect,reclaim,dispatch`. The second dispatch in the eleventh trace must be rejected; derive counts from accepted events, not a supplied send count or expected status.

For `guard`, canonical/received projections have exactly organization_id, execution_context, worker_id, assignment_epoch, control_generation, effect_id, action_id, argument_sha256, model_binding_id and evidence_verification. For `human_response`, question/response binding projections have exactly question_id, execution_context, agent_version_id, node_id, iteration_path and checkpoint_revision. Nullable model/action IDs are explicit. Other vector input shapes are fully determined by the corresponding function branch; reject missing or extra input keys in RuntimeFixtureSetV1. These normalized test projections are not new production authority records.

Use the following isolated throwaway checker. No permanent test framework or repository dependency is added.

```sh
uv run --with 'jsonschema[format-nongpl]' --with referencing --with cryptography --with rfc8785 python - <<'PY'
from __future__ import annotations
import base64
import hashlib
import json
import re
from collections import Counter
from decimal import Decimal
from pathlib import Path
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource
import rfc8785

ROOT = Path.cwd()
C = ROOT / "docs/architecture/contracts"
counts: Counter[str] = Counter()

def obj(v: object) -> dict[str, object]:
    assert isinstance(v, dict) and all(isinstance(k, str) for k in v)
    return {str(k): x for k, x in v.items()}

def arr(v: object) -> list[object]:
    assert isinstance(v, list)
    return list(v)

def s(v: object) -> str:
    assert isinstance(v, str)
    return v

def n(v: object) -> int:
    assert type(v) is int and v >= 0
    return v

def b(v: object) -> bool:
    assert isinstance(v, bool)
    return v

def pairs(items: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in items:
        assert key not in result, ("duplicate key", key)
        result[key] = value
    return result

def load(path: Path) -> dict[str, object]:
    return obj(json.loads(path.read_text(), object_pairs_hook=pairs))

def sha(v: object) -> str:
    return hashlib.sha256(rfc8785.dumps(v)).hexdigest()

def dec(v: object) -> bytes:
    token = s(v)
    return base64.urlsafe_b64decode(token + "=" * (-len(token) % 4))

def reachable(edges: list[object], entry: str, skip: str | None) -> set[str]:
    seen: set[str] = set()
    pending = [entry]
    while pending:
        node = pending.pop()
        if node == skip or node in seen:
            continue
        seen.add(node)
        for raw in edges:
            edge = arr(raw)
            assert len(edge) == 2
            if s(edge[0]) == node:
                pending.append(s(edge[1]))
    return seen

def trace(events: list[object]) -> dict[str, object]:
    epoch, admission_epoch, dispatches = 0, -1, 0
    prepared, consumed, sent, stopped = False, False, False, False
    state = "Not Started"
    for event in events:
        tag = s(event)
        if tag == "intent":
            if not consumed and not stopped:
                prepared, state = True, "Prepared"
        elif tag == "consume":
            if prepared and not consumed and not stopped:
                consumed, admission_epoch = True, epoch
        elif tag == "dispatch":
            if consumed and admission_epoch == epoch and not sent and not stopped:
                sent, dispatches, state = True, dispatches + 1, "Awaiting Verification"
        elif tag == "ack":
            assert sent
            state = "Awaiting Verification"
        elif tag == "disconnect":
            state = "Outcome Unknown" if sent else "Blocked" if consumed else state
        elif tag == "reclaim":
            epoch += 1
        elif tag == "verify":
            assert sent
            state = "Verified Complete"
        elif tag == "clarification":
            state = "Needs Clarification"
        elif tag == "approval":
            assert not consumed
            state = "Awaiting Approval"
        elif tag == "stop":
            stopped = True
            if not sent:
                state = "Canceled"
        else:
            raise ValueError(f"Unknown trace event: {tag}")
    return {"state": state, "dispatches": dispatches}

def evaluate(kind: str, d: dict[str, object]) -> dict[str, object]:
    if kind == "guard":
        return {"accepted": obj(d["canonical"]) == obj(d["received"]) and n(d["now"]) < n(d["lease_not_after"])}
    if kind == "cas":
        ok = (d["revision"] == d["expected_revision"] and d["epoch"] == d["expected_epoch"]
              and d["control"] == d["expected_control"] and n(d["now"]) < n(d["lease_not_after"]))
        return {"accepted": ok, "revision": n(d["revision"]) + int(ok)}
    if kind == "action_identity":
        before, after = "act_" + sha(d["before"]), "act_" + sha(d["after"])
        return {"before": before, "after": after, "same": before == after}
    if kind == "recovery":
        receipt, verdict = s(d["receipt"]), s(d["verdict"])
        if not b(d["guard_valid"]) or b(d["restore_gap"]):
            state = "blocked"
        elif verdict == "mismatch":
            state = "paused_business_incorrect"
        elif receipt in {"dispatched", "unknown"} and verdict != "verified":
            state = "submission_unknown"
        elif verdict == "verified":
            state = ("operator_resume" if b(d["had_unknown"]) and b(d["remaining_writes"])
                     else "resume_cursor" if b(d["remaining_writes"]) else "completion_requested")
        elif receipt == "application_acknowledged":
            state = "awaiting_verification"
        elif b(d["inference_unresolved"]):
            state = "inference_unknown"
        elif b(d["consumed"]):
            state = ("reconciliation_required" if receipt == "not_dispatched"
                     else "dispatch_permitted" if b(d["same_worker"]) and b(d["admission_valid"])
                     else "authority_unknown")
        else:
            state = "resume_prepared" if b(d["intent_committed"]) else "resume_cursor"
        return {"state": state, "cursor": d["saved_cursor"], "dispatches": trace(arr(d["events"]))["dispatches"]}
    if kind == "iteration":
        collection, completed, state = arr(d["collection"]), 0, "complete"
        if len(collection) > n(d["max_items"]):
            return {"state": "paused", "next_index": 0, "completed": 0, "replay": False}
        for event in arr(d["events"]):
            assert completed < len(collection)
            if event == "fail":
                state = "paused"
                break
            assert event == "commit"
            completed += 1
        if completed < len(collection) and state != "paused":
            state = "in_progress"
        return {"state": state, "next_index": completed, "completed": completed, "replay": False}
    if kind == "model_recovery":
        current = b(d["epoch_matches"]) and b(d["control_matches"])
        reuse = (current and b(d["saved_value_present"]) and b(d["pins_match"])
                 and b(d["evidence_fresh"]) and d["saved_input_sha256"] == d["current_input_sha256"])
        state = ("discarded" if not current else "reused" if reuse
                 else "inference_unknown" if b(d["inflight_without_result"]) else "paused")
        return {"state": state, "reuse": reuse, "extra_inference_requests": 0}
    if kind == "human_response":
        ok = (obj(d["question_binding"]) == obj(d["response_binding"]) and b(d["role_allowed"])
              and b(d["type_valid"]) and n(d["now"]) < n(d["not_after"]))
        return {"accepted": ok, "state": "answered" if ok else "needs_clarification", "grants_action_authority": False}
    if kind == "retention":
        limits = [n(d["source_deadline"]),
                  n(d["last_progress"]) + 2_592_000 if d["terminal_at"] is None else n(d["terminal_at"]) + 604_800]
        if d["journal_deadline"] is not None:
            limits.append(n(d["journal_deadline"]))
        ok = b(d["restore_reconciled"]) and not b(d["invalidated"]) and n(d["now"]) < min(limits)
        return {"readable": ok, "deadline": min(limits), "effect_exclusion_retained": True}
    if kind == "reservation":
        match = d["owner"] is None or obj(d["owner"]) == obj(d["request"])
        revoked, stopped = b(d["expired"]) or b(d["revoked"]), b(d["primitive_stopped"]) or b(d["executor_terminated"])
        state = "released" if revoked and stopped else "exclusion_hold" if revoked else "reserved" if match else "busy"
        return {"allowed": match and not revoked, "state": state}
    if kind == "budget":
        elapsed = n(d["initial_active_ms"])
        for raw in arr(d["intervals"]):
            interval = obj(raw)
            assert interval["kind"] in {"active", "wait", "crash"}
            if interval["kind"] != "wait":
                elapsed += n(interval["elapsed_ms"])
        return {"active_elapsed_ms": elapsed, "hold": elapsed >= n(d["limit_ms"]) or n(d["visits"]) > n(d["max_visits"])
                or n(d["recoveries_without_progress"]) >= 3}
    if kind == "verification":
        required, results = set(map(s, arr(d["required"]))), {}
        for raw in arr(d["results"]):
            item = obj(raw)
            key, verdict = s(item["requirement_id"]), s(item["verdict"])
            assert key not in results and verdict in {"verified", "mismatch", "unknown"}
            results[key] = verdict
        verdict = ("mismatch" if any(results.get(k) == "mismatch" for k in required)
                   else "unknown" if not required or any(results.get(k) != "verified" for k in required) else "verified")
        return {"verdict": verdict, "further_mutation_allowed": verdict == "verified"}
    if kind == "read_value":
        ok = b(d["authorized"]) and not b(d["expired"]) and b(d["digest_matches"]) and not b(d["receipt_only"])
        return {"value_available": ok, "vendor_reads": n(d["existing_vendor_reads"])}
    if kind == "dominance":
        edges, entry, producer, consumer = arr(d["edges"]), s(d["entry"]), s(d["producer"]), s(d["consumer"])
        nodes = reachable(edges, entry, None)
        return {"allowed": producer in nodes and consumer in nodes and consumer not in reachable(edges, entry, producer)}
    if kind == "environment":
        ok = b(d["candidate_matches"]) and b(d["input_matches"]) and b(d["account_isolated"]) and not b(d["production_credentials"])
        assert d["mode"] in {"live", "recorded_diagnostic"}
        return {"allowed": ok, "reasoning_release_coverage": ok and d["mode"] == "live"}
    if kind == "semantic_transition":
        left, right, operation = Decimal(s(d["left"])), Decimal(s(d["right"])), s(d["operation"])
        assert operation in {"add", "subtract", "lte"}
        calculated: Decimal | bool = left <= right if operation == "lte" else left + right if operation == "add" else left - right
        claimed: Decimal | bool = b(d["claimed"]) if operation == "lte" else Decimal(s(d["claimed"]))
        verified = all(b(v) for v in arr(d["parents_verified"]))
        return {"accepted": calculated == claimed and verified == b(d["claimed_verified"]), "verified": verified}
    if kind == "dispatch_trace":
        return trace(arr(d["events"]))
    if kind == "eleven_case_batch":
        cases, statuses, unknown_dispatches = arr(d["cases"]), Counter(), 0
        assert len(cases) == 11
        for raw in cases:
            case = obj(raw)
            outcome = trace(arr(case["events"]))
            status = s(outcome["state"])
            statuses[status] += 1
            if status == "Outcome Unknown":
                unknown_dispatches += n(outcome["dispatches"])
        return {"counts": dict(statuses), "unknown_dispatches": unknown_dispatches}
    raise ValueError(f"Unsupported runtime vector kind: {kind}")

registry = Registry()
schemas: list[dict[str, object]] = []
for path in sorted(C.glob("*.schema.json")):
    schema = load(path)
    Draft202012Validator.check_schema(schema)
    resource = Resource.from_contents(schema)
    registry = registry.with_resource(s(schema["$id"]), resource).with_resource(path.resolve().as_uri(), resource)
    schemas.append(schema)
    counts["schemas"] += 1

seen_refs: set[tuple[str, str]] = set()
def refs(value: object, base: str) -> None:
    if isinstance(value, dict):
        node = obj(value)
        if "$ref" in node and (base, s(node["$ref"])) not in seen_refs:
            registry.resolver(base).lookup(s(node["$ref"]))
            seen_refs.add((base, s(node["$ref"])))
        for child in node.values():
            refs(child, base)
    elif isinstance(value, list):
        for child in value:
            refs(child, base)

for schema in schemas:
    refs(schema, s(schema["$id"]))
for path in sorted(C.glob("*.fixtures.json")):
    fixture = load(path)
    for raw in arr(fixture.get("validation_cases", [])):
        case = obj(raw)
        validator = Draft202012Validator({"$ref": case["schema_ref"]}, registry=registry, format_checker=FormatChecker())
        assert validator.is_valid(case["instance"]) is case["expected_valid"], (path.name, case["case_id"])
        counts["schema_cases"] += 1
    if path.name not in {"agent-factory-v1.fixtures.json", "application-adapters-v1.fixtures.json"}:
        continue
    for raw in arr(fixture["digest_vectors"]):
        vector = obj(raw)
        assert sha(vector["preimage"]) == vector.get("expected_sha256", vector.get("sha256")), (path.name, vector["case_id"])
        counts["digests"] += 1
    keys = {s(obj(key)["key_id"]): obj(key) for key in arr(fixture["public_keys"])}
    for raw in arr(fixture["signed_envelope_examples"]):
        vector = obj(raw)
        envelope, key = obj(vector["envelope"]), keys[s(vector["public_key_id"])]
        preimage = s(envelope["schema_id"]).encode() + b"\n" + rfc8785.dumps(envelope["payload"])
        valid = True
        try:
            Ed25519PublicKey.from_public_bytes(dec(key["public_key_base64url"])).verify(dec(envelope["signature"]), preimage)
        except InvalidSignature:
            valid = False
        assert valid is vector["expected_valid"], (path.name, vector["case_id"])
        counts["signatures"] += 1

fixture = load(C / "agent-runtime-v1.fixtures.json")
Draft202012Validator(
    {"$ref": "urn:oryn:schemas:agent-runtime:v1#/$defs/RuntimeFixtureSetV1"},
    registry=registry, format_checker=FormatChecker(),
).validate(fixture)
assert fixture["schema_id"] == "runtime.fixture-set.v1"
covered: set[str] = set()
batch: dict[str, object] | None = None
for raw in arr(fixture["binding_vectors"]):
    vector = obj(raw)
    kind = s(vector["kind"])
    result = evaluate(kind, obj(vector["inputs"]))
    assert result == vector["expected"], (vector["case_id"], result, vector["expected"])
    covered.add(kind)
    counts["runtime_vectors"] += 1
    if kind == "eleven_case_batch":
        assert batch is None
        batch = result
assert covered == {"guard", "cas", "action_identity", "recovery", "iteration", "model_recovery",
                   "human_response", "retention", "reservation", "budget", "verification", "read_value",
                   "dominance", "environment", "semantic_transition", "dispatch_trace", "eleven_case_batch"}
assert counts["runtime_vectors"] >= 18
assert batch == {"counts": {"Verified Complete": 7, "Needs Clarification": 2,
                            "Awaiting Approval": 1, "Outcome Unknown": 1}, "unknown_dispatches": 1}

runtime = ROOT / "docs/components/agent-runtime.md"
body = runtime.read_text()
headings = ["Purpose and ownership", "Product requirements", "Upstream and downstream contracts",
            "Trust and deployment boundaries", "Internal architecture", "State and lifecycle",
            "Error and edge-case behavior", "Observability and audit", "Security and threat model",
            "Test strategy", "Performance and operations", "Architecture decisions and open questions"]
assert re.findall(r"^## (.+)$", body, re.M) == headings
assert "Detailed technical specification — implementation pending" in body
assert not re.search(r"\b(?:TODO|TBD|FIXME)\b", body)
assert all("ORY-" + k in body for k in ("026", "027", "028", "041", "043", "044", "045", "070", "071", "074"))
assert all(part.strip() for part in re.split(r"^## .+$", body, flags=re.M)[1:])
assert all(counts[k] > 0 for k in ("schemas", "schema_cases", "digests", "signatures", "runtime_vectors"))
print("PASS", dict(counts))
print("BATCH", batch)
PY
```

Reference cycles are legal: register all resources first, track visited resource/ref pairs, and never inline references recursively. Validate the runtime fixture root against its new schema as well as standalone DTO cases. Keep mismatched authority/principal/model state in behavioral vectors, not invalid-schema assertions.

After the command, inspect relative Markdown link targets and JSON fragments in the changed documents; compare main Runtime field sets, limits, errors, crash rows and owner interfaces with this plan. Every crash row must have a vector. Failures are diagnosed, not muted. Existing non-Runtime semantic vectors are not claimed executed merely because their schema-validation cases passed.

Authoritative references consulted: `https://gvisor.dev/docs/user_guide/containerd/quick_start` and `https://python-jsonschema.readthedocs.io/en/stable/referencing/`. RuntimeClass naming alone does not prove isolation.

## Assumptions and contingencies

- Scope is implementation-ready specification and shared-contract reconciliation, not Runtime product code. Every software status remains implementation pending.
- Fixed choices are stated in Context and concretely specified in Approach. Reopen only when new repository evidence conflicts with a load-bearing choice; never silently weaken gVisor, authority, privacy or recovery requirements.
- If approved workflow configuration provides no active budget, use 900,000 ms; finite approved overrides cannot exceed stricter organization limits or bypass the compiled visit cap.
- If gVisor certification, current central authority, a retained value or independent owner evidence is unavailable, specify explicit blocked/held behavior; never replace it with a fake fallback or claim deployment was verified.
- If 0017 is occupied when writing the ADR, choose the next actual unused sequential number and update all new links consistently.
- If concurrent user edits already define an equivalent owner record/port, reuse that exact owner definition and migrate this specification’s callers to it. Do not create competing state authorities or compatibility aliases.
- A changed executable schema would require canonical hashes/signatures/fixture migration. This design adds execution configuration and result protocols outside the executable body; if implementation discovers a body change is unavoidable, return to that design decision before editing it.
