# Job Orchestration Detailed Specification Plan

## Context

Fully flesh out technical implementation details for Oryn's job-orchestration component, using `PRODUCT.md` as product authority and `TECHNICAL.md` as cross-component authority. Deliver documentation, normative JSON schemas/OpenAPI, conformance fixtures, domain terms, and an architecture decision; do not implement runtime software. Expand `docs/components/job-orchestration.md` in place, preserve its twelve level-two headings, and set its status to `Detailed technical specification — implementation pending`.

The repository currently contains specifications, not an application implementation. Existing runtime checkpoint PostgreSQL tables, Identity action fences, Adapter submission journals, and Verifier verdict ownership are binding. This plan specifies their integration rather than replacing those authorities.

## Accepted design decisions

The user explicitly selected all of the following through five grilling rounds:

1. PostgreSQL-backed Rust state machines in existing Control Plane API/Durable Worker roles; no Temporal/Cadence or second workflow store.
2. Immutable membership per job; never silently refill removed or ineligible records.
3. Schedules resolve the currently eligible release per occurrence, then pin the resulting job within unchanged schedule authority.
4. Named execution sponsor with current `job.run`, plus Workflow Owner schedule approval. Scheduler authenticates as itself, not as a human session. Lost sponsor/owner authority pauses the schedule.
5. One-shot, daily, and weekly schedules using IANA zones, plus registered typed business-event triggers. No arbitrary cron, scripts, or public webhooks.
6. No automatic missed-occurrence backlog. Skip nonexistent DST times; run repeated wall times once at the earlier instant. Catch-up is a separately confirmed manual job.
7. An unresolved prior scheduled job blocks the next occurrence, including approval waits and unknown outcomes. No disjoint-overlap option.
8. Approval timeout becomes Blocked; Request Changes becomes Needs Clarification. Rejection is Expectedly Rejected only if the approved workflow defines that outcome.
9. Hard monetary caps require bounded, priced consumption and reservations before chargeable work. Unknown usage remains encumbered; unbounded/unpriced covered costs block admission.
10. Running takes precedence while independent work progresses; otherwise human waits produce Waiting for Review, including mixed unknown holds; otherwise unresolved mixed outcomes produce Partially Complete.
11. Safe retries create linked continuation executions within the original case and pinned version, preserving prior effects/verdicts. Version changes require another confirmed job.
12. Conservative whole-record cross-job mutation exclusion across agents/connections. Preserve reservations during approval/uncertainty; worker lease expiry never releases them.
13. Stop acknowledges durable dispatch fencing, not external recall. Show boundary acknowledgments and unresolved effects; permit authorized read-only reconciliation.
14. Local schedules require explicit device binding, employee consent, current session, availability, and reservation. Never wake/unlock devices, bypass pause, or migrate host.
15. Separate active-case caps: initially 8 global, 4/organization, 2/job, 1/connection. Equal tenant round-robin; FIFO jobs/cases; no priority tiers or preemption. Waits release compute, not business reservations.
16. Explicit record lists or qualified stable enumeration only; 1,000 members/job, 100/page, five-minute manual confirmation. Reject incomplete/changing enumeration.
17. One generation-inclusive action-ID formula, starting with decimal string `"0"`; only authorized safe reconciliation allocates a later generation.
18. Coordinator encrypts validated typed uploads; workers never receive DEKs. Preserve independent producer provenance.
19. Bounded within-job acyclic case dependencies; Graph owns cross-team Handoffs. No cross-job agent DAG.
20. Explicitly approved stable first-N queue prefixes are allowed; show `more_available` separately. Oversized explicit lists fail, never truncate.
21. Shared preflight failure blocks the job; item-only failure blocks that case and preserves its membership while independent cases continue.
22. Timed occurrence admission grace is 60 seconds; business events must arrive within five minutes of authoritative occurrence time. Late occurrences are recorded as missed, never silently caught up.

## Grounded integration constraints

- `docs/components/job-orchestration.md:88–316` already defines seven authoritative `orchestration_*` tables, revision/control/assignment CAS, and lock order. Preserve their ownership and encryption split.
- `docs/adr/0012-control-plane-transport-durability-and-inference.md:24–38` fixes PostgreSQL outbox/delivery/inbox, aggregate FIFO, 30-second delivery leases, 10-second renewal, eight transport retries, and API/BFF/Durable Worker/Inference Worker roles. No dedicated broker.
- `docs/adr/0017-agent-runtime-execution-and-recovery.md:40–65` fixes PostgreSQL checkpoint authority, pinned hosts, externally fenced one-shot dispatch, seven-day post-terminal value disposal, 30-day semantic-inactivity resumability, and 24-month content-free audit.
- `docs/components/agent-runtime.md:206–242,269–300,338–387` defines `RuntimeCheckpointPort`, `completion_requested`, ten crash windows, three-recoveries-without-progress hold, coordinator key custody, and runtime caps.
- `docs/components/outcome-verification.md:108–135` defines durable request-ID deduplication, immutable verdicts, `mismatch > unknown > verified`, no missing mandatory requirements, and owner-result lookup.
- `docs/components/identity-policy.md:133–159` separates `job.run`, `schedule.manage`, and approval delegation. `ExecutionContextV1` uses an agent version label, while runtime assignments separately carry a UUID; validate both against one canonical Agent Registry record.
- `PRODUCT.md` §§16, 20.5, 21.7, 28.3, 28.5 and ORY-040–048 define exact scope, statuses, mixed results, stops, safe remaining-action retries, and pinning. §16.6 fixes maximum pending approval at 24 hours and approved validity at 15 minutes; Identity may shorten both.
- `docs/architecture/cloud-inference.md` governs all worker inference. Orchestration itself is deterministic and introduces no model operation.

## Approach

### 1. Establish the authoritative orchestration model and public contracts

Work in `docs/components/job-orchestration.md`; add `docs/architecture/contracts/job-orchestration-v1.schema.json` with `$id` `urn:oryn:schemas:job-orchestration:v1`, Draft 2020-12. All new object DTOs are closed (`additionalProperties: false`); every listed field is required, and optional values use explicit null. Reuse existing Graph `Uuid`, `Identifier`, `Sha256`, Identity `ScopeV1`/`ExecutionContextV1`, Graph `BusinessConditionV1`, Runtime `RuntimeHostV1`, Factory `AgentVersionV1`, and Control Plane `OperationV1` rather than parallel representations. Decimal counters/spend are canonical nonnegative decimal strings, semantically bounded to u64 or signed BIGINT for monetary storage; timestamps are UTC, with IANA zone stored separately for recurrence.

Define these domain meanings in `GLOSSARY.md`, without implementation details:

- **Job:** one confirmed or approved scheduled request to execute a fixed agent version against a defined population.
- **Case:** one business item within a Job, retaining its own progress, outcomes, and execution history.
- **Work Queue:** an approved source and selection rule for eligible business items; not an execution assignment or transport queue.
- **Schedule:** an owner-approved recurring/time/event rule with bounded scope and an accountable execution sponsor; not blanket action approval.
- **Schedule Occurrence:** one intended triggering of a Schedule, including a recorded skipped or missed triggering.
- **Execution Sponsor:** the named person whose current job-execution remit supports a Schedule; not its action approver by default.
- **Frozen Population:** the exact confirmed membership of a Job; later source changes do not add replacement items.
- **Continuation Execution:** a linked attempt to perform proven-safe remaining work for a Case; not a replay of prior effects.

Retain existing Execution Assignment, Execution Checkpoint, Reconciliation, Approval Proposal, Action Authorization, Submission Receipt, Exclusive Target Scope, Application Connection, and Handoff definitions.

Use the exact job wire states `draft`, `preflight_check`, `queued`, `running`, `waiting_for_review`, `partially_complete`, `completed`, `completed_with_exceptions`, `paused`, `failed`, `canceled`. Case wire states: `not_started`, `in_progress`, `prepared`, `awaiting_approval`, `verified_complete`, `expectedly_rejected`, `needs_clarification`, `blocked`, `failed`, `canceled`, `outcome_unknown`. Publish their exact PRODUCT.md display labels in one mapping table. Do not add a product state for internal checkpoint phases or Submitted; expose submission state independently.

Define the following public wire objects. Stable IDs use Graph Identifier unless explicitly UUID; internal job/case IDs are generated UUIDv4 values rendered as lowercase identifiers, preserving existing symbolic fixture IDs as valid examples. Revision fields use canonical decimal strings.

- `JobLimitsV1`: `{max_items: integer 1..1000, max_active_cases: integer 1..2, max_active_ms: integer 1..900000, spend_limit_microusd: decimal|null}`. Null means no job-specific monetary cap, never exemption from configured organization caps. Limits may be tightened, not silently increased.
- `JobSelectionSpecV1`: tagged union of `{kind:"explicit", connection_id, connection_revision, capability_ref, selection_operation_id, record_type, record_keys: unique Identifier[1..1000]}` and `{kind:"queue_prefix", connection_id, connection_revision, capability_ref, selection_operation_id, record_type, queue_id, filter: BusinessConditionV1, ordering_id: Identifier, max_items: integer 1..1000}`. No SQL, arbitrary URLs, scripts, or user-defined sorting expressions.
- `JobPreviewRequestV1`: `{schema_id:"job.preview-request.v1", agent_id, agent_version_id:Uuid, selection:JobSelectionSpecV1, limits:JobLimitsV1, host:RuntimeHostV1}`.
- `JobPreviewV1`: `{schema_id:"job.preview.v1", organization_id:Uuid, preview_id:Uuid, requester_actor_id:Uuid, agent_id, agent_version_id:Uuid, agent_version:Identifier, behavior_sha256, manifest_sha256, release_id:Uuid, release_revision, selection, population_count:integer 1..1000, population_sha256, more_available:boolean, host, limits, shared_preflight:PreflightFindingV1[], case_preflight:CasePreflightV1[], created_at, expires_at}`. The ordered member rows are fetched through a bounded page endpoint, not embedded as a potentially oversized response. All previews expire five minutes after sealing or earlier on source/authority invalidation.
- `PreflightFindingV1`: `{code:JobErrorCodeV1, subject_ref:Identifier|null, next_action: nonempty string <=512}`. `CasePreflightV1`: `{member_ordinal:integer 0..999, findings:PreflightFindingV1[] <=32}`; empty means eligible.
- `StartJobCommandV1`: `{schema_id:"job.start-command.v1", preview_id:Uuid, population_sha256, expected_release_revision, expected_policy_revision}`. Server derives tenant/requester from verified principal. It never accepts replacement member IDs at confirmation.
- `JobDependencySpecV1`: `{predecessor_ordinal:integer 0..999,successor_ordinal:integer 0..999,condition}` using the same condition union as CaseDependencyV1. Add required `dependencies:JobDependencySpecV1[] <=4000` to JobPreviewRequestV1 and JobPreviewV1. Confirmed preview seals these edges into its population digest; start maps member ordinals to generated case IDs and persists CaseDependencyV1. Explicit lists retain requested order; queue prefixes retain registered order. Cross-page membership reorder invalidates the preview.
- `JobControlCommandV1`: `{schema_id:"job.control-command.v1", expected_revision, action:"pause"|"resume"|"cancel", case_ids: unique Identifier[1..1000]|null, reason:nonempty string <=512}`. Null targets whole job. Cancel is irreversible for that job/case; resume applies only to paused work, not canceled work or unresolved unknown writes.
- `CaseDependencyV1`: `{predecessor_case_id, successor_case_id, condition}` where condition is `{kind:"verified_complete"}` or `{kind:"approved_handoff", handoff_id:Uuid, handoff_revision}`. IDs must exist in the same frozen job; no self-edges, duplicate edges, or cycles. Cap 4,000 edges.
- `CaseReconciliationCommandV1`: `{schema_id:"job.case-reconciliation-command.v1", expected_case_revision, execution_id:Uuid, action_id:Identifier|null, disposition:"reverify_only"|"continue_remaining"|"handoff", reconciliation_ref:Identifier, proposed_remaining_node_ids: unique PlanIdentifier[] <=10000, handoff_id:Uuid|null, reason:nonempty string <=512}`. Empty remaining nodes are allowed only for reverify/handoff. The server recomputes allowed remaining work; client lists never grant scope.
- `JobCountsV1`: one nonnegative integer for each case wire state plus `already_satisfied` and `handed_off` subset counters; `population_count` is authoritative. The eleven state counts sum exactly to population_count. Subset counters never inflate the total.
- `JobViewV1`: `{schema_id:"job.view.v1", organization_id:Uuid, job_id, revision, state, agent_id, agent_version_id:Uuid, agent_version, behavior_sha256, manifest_sha256, release_id:Uuid, population_count, population_sha256, counts:JobCountsV1, control_intent:"none"|"pause"|"cancel", control_generation, pending_boundary_acknowledgments:integer, has_unresolved_effects:boolean, required_outputs_available:boolean, blockers:PreflightFindingV1[] <=32, result_ref:Identifier|null, created_at, updated_at, terminal_at:null|timestamp}`.
- `CaseViewV1`: `{schema_id:"job.case-view.v1", organization_id:Uuid, job_id, case_id, revision, member_ordinal, record:ApplicationRecordRefV1, state, current_execution_id:Uuid|null, latest_verification_ref:Identifier|null, submission_state:"not_dispatched"|"dispatched"|"application_acknowledged"|"unknown"|null, assigned_team_id:Uuid, assigned_actor_id:Uuid|null, handoff_id:Uuid|null, already_satisfied:boolean, control_intent, blockers:PreflightFindingV1[] <=32}`. Authorization filters source values/evidence independently of metadata visibility.
- `JobPageV1`, `CasePageV1`, and `JobMemberPageV1`: `{schema_id, items:[matching view/ref] <=100, next_cursor:string <=256|null}`. Cursor is opaque, principal/tenant/filter/order/revision-bound and expires in five minutes; response ceiling 256 KiB may lower item count.
- `JobProblemV1`: define the same closed safe transport fields as existing ControlPlaneProblemV1, but `schema_id:"job.problem.v1"` and `code:JobErrorCodeV1`; do not intersect an existing closed object with incompatible schema_id/code. Add required `next_action:string <=512` and nullable `owner_problem_ref:Identifier`. Existing Control Plane resource/operation reference definitions remain shared. Never attach vendor payloads or secrets.

Exact new error literals: `JOB_NOT_AUTHORIZED`, `JOB_SCOPE_INVALID`, `JOB_VERSION_INELIGIBLE`, `JOB_PREFLIGHT_BLOCKED`, `JOB_SELECTION_UNSUPPORTED`, `JOB_SELECTION_INCOMPLETE`, `JOB_SELECTION_STALE`, `JOB_SELECTION_LIMIT_EXCEEDED`, `JOB_REVISION_CONFLICT`, `JOB_RECORD_CONFLICT`, `JOB_DEPENDENCY_BLOCKED`, `JOB_LIMIT_REACHED`, `JOB_COST_UNBOUNDED`, `JOB_OUTCOME_UNRESOLVED`, `JOB_RECONCILIATION_REQUIRED`, `JOB_DEVICE_UNAVAILABLE`, `JOB_SCHEDULE_OVERLAP`, `JOB_SCHEDULE_MISSED`, `JOB_SCHEDULE_AUTHORITY_LOST`, `JOB_RECOVERY_REQUIRED`. Use 403 for allowed-to-see authorization failures, 404 for inaccessible resources, 409 for stale/conflict/held-operation errors, 422 for invalid/unsupported/unbounded requests, 413 for size limits, 503 for unavailable authority/recovery. Do not replace upstream Identity/Adapter/Runtime error codes; preserve owner error references under the safe orchestration problem.

Document one deep module interface, with types defined above/in later steps, rather than a separate network service for each internal concern:

```rust
#[async_trait]
pub trait JobOrchestrationPort: Send + Sync {
    async fn preview(&self, principal: &VerifiedPrincipal, request: JobPreviewRequestV1)
        -> Result<JobPreviewV1, JobProblemV1>;
    async fn start(&self, principal: &VerifiedPrincipal, command: StartJobCommandV1)
        -> Result<JobViewV1, JobProblemV1>;
    async fn control(&self, principal: &VerifiedPrincipal, job_id: &str, command: JobControlCommandV1)
        -> Result<JobViewV1, JobProblemV1>;
    async fn reconcile(&self, principal: &VerifiedPrincipal, job_id: &str, case_id: &str,
        command: CaseReconciliationCommandV1) -> Result<CaseViewV1, JobProblemV1>;
}
```

Internal logical responsibilities are selection, schedule occurrence generation, preflight/admission, fair dispatch, runtime checkpoint/value custody, approval wait coordination, reconciliation, budget reservations, and read-model projection. Keep HTTP transport in Control Plane and business transitions in this module.

### 2. Define qualified record selection and immutable admission

No equivalent business-record enumeration contract exists in the inspected Adapter/Capability/Graph specifications. Add this producer-owned seam to `docs/components/application-adapters.md` and `application-adapters-v1.schema.json`; never repurpose Graph knowledge pagination or Adapter `value()` as a fresh vendor query.

- `ApplicationRecordRefV1`: `{organization_id:Uuid, application_id:Identifier, connection_id:Identifier, connection_revision:integer u64-range, vendor_account_id:string 1..1024, environment:"production"|"simulation", record_type:Identifier, record_key:Identifier, record_identity_sha256:Sha256, source_revision:string 1..256|null}`. The adapter computes `record_identity_sha256 = SHA256(RFC8785({application_id,vendor_account_id,environment,record_type,native_record_id}))` from exact provider-native identity; preserve case and codepoints, do not guess normalization. The first-party pack must return the same canonical account/native-record identity across connections to that account. This digest is an internal conflict key, not an action authorization or source of permission. `record_key` remains the existing adapter-addressable opaque key and must resolve back to that same digest; ambiguous mapping blocks qualification.
- `AdapterRecordSelectionRequestV1`: `{schema_id:"adapter.record-selection-request.v1", request_id:Uuid, selection_session_id:Uuid|null, selection:JobSelectionSpecV1, cursor:string<=256|null, page_size:integer 1..100}`. Enforce current `application.read`, scope and connection access through VerifiedPrincipal before any vendor read; pre-case enumeration does not fabricate an ExecutionContext.
- `AdapterRecordSelectionPageV1`: `{schema_id:"adapter.record-selection-page.v1", request_id:Uuid, selection_session_id:Uuid, query_sha256, source_snapshot_ref:string<=256, ordering_id, items:ApplicationRecordRefV1[]<=100, next_cursor:string<=256|null, selection_complete:boolean, more_available:boolean, expires_at}`. Entire page <=256 KiB. First request creates a stable selection session; later pages bind the same principal, query, connection revision, snapshot and order. Selection total deadline 30 seconds; session expires five minutes after initial creation. Explicit-list mode resolves all requested identities with authoritative reads under the same deadline.
- `AdapterRecordSelectionPort::select(&self, principal: &VerifiedPrincipal, request: AdapterRecordSelectionRequestV1) -> Result<AdapterRecordSelectionPageV1, AdapterErrorV1>` is async, authenticated, read-only and broker-mediated. Add `ADAPTER_SELECTION_UNSUPPORTED`, `ADAPTER_SELECTION_STALE`, `ADAPTER_SELECTION_INCOMPLETE`, `ADAPTER_SELECTION_LIMIT_EXCEEDED` to Adapter's existing closed errors and document the mapping to Job errors.
- Extend `OperationDeclarationV1` with required nullable `selection` referencing `RecordSelectionCapabilityV1`: `{record_type, ordering_ids:unique Identifier[1..16], stable_snapshot:boolean, explicit_resolution:boolean, max_page_items:integer 1..100}`. Selection declaration is allowed only for `effect="read"`; existing non-selection operations set null. Update all affected snapshot fixtures, not aliases or optional legacy fields. Require current operation qualification evidence to cover stable enumeration, deterministic order, cross-connection identity, cursor binding, and source churn. Missing proof makes queue enumeration unavailable; explicit resolution remains available only if independently qualified.
- Account names `OperationQualificationBodyV1.external_account_id` and connection `vendor_account_id` must identify the same certified account; recheck this at selection and dispatch, never infer equality from display names.

Frozen selection algorithm: validate shared scope and release; obtain qualified pages outside SQL row locks; verify a single query/snapshot/order, unique record identities, explicit completeness for the requested list/prefix, total count <=1,000, and source deadline. Duplicate identities across pages are an integrity failure, not silently dropped. For `queue_prefix`, stop only when the adapter proves the exact approved first-N prefix is complete, or source ends; `more_available=true` truthfully signals records beyond that approved prefix. Source order must be registered, total and deterministic with a stable identity tie-break. Never treat a truncated/unproven scan as complete.

Seal ordered member rows, count, canonical population SHA256, source provenance and preview atomically. Hash only ordered immutable record identities plus selection/query binding, not changing business values. Manual confirmation checks current principal, preview owner/expiry, exact population digest, policy/release revisions and same immutable version; if A becomes ineligible while previewing, require another preview rather than silently using B. A newer eligible version does not repin an already confirmed job. Changed record values require live action preflight, not changed membership.

Manual zero-member selection returns `JOB_SELECTION_INCOMPLETE` with no execution. Scheduled zero-member selection records `no_work` occurrence and creates no empty successful job. Shared failures leave a draft/preflight-blocked request with no assignments. Item-only findings create Blocked cases with accountable team/actor and do not prevent unrelated eligible cases.

### 3. Specify durable state, claims, exclusions, and transaction ordering

Retain existing seven orchestration tables. Add complete SQL DDL to the component specification for the tables below. All tenant-owned tables use organization-composite keys/FKs, `ENABLE` plus `FORCE ROW LEVEL SECURITY`, and the existing `oryn.organization_id` policy pattern. No cross-tenant foreign key or worker-controlled organization context. The separate global capacity semaphore below stores only opaque lease tokens, has no tenant business data, and is accessible only through the trusted Durable Worker capacity function.

- `orchestration_job`: `(organization_id UUID, job_id TEXT)` PK; `revision NUMERIC(20,0)`, `state TEXT CHECK(job states)`, `agent_id TEXT`, `agent_version_id UUID`, `agent_version TEXT`, `behavior_sha256 TEXT`, `manifest_sha256 TEXT`, `release_id UUID`, `release_revision NUMERIC(20,0)`, `population_sha256 TEXT`, `population_count INTEGER CHECK 1..1000`, `host JSONB`, `limits JSONB`, `initiator_actor_id UUID`, nullable `schedule_id UUID`/`occurrence_id UUID`, `control_intent TEXT CHECK none/pause/cancel`, `control_generation NUMERIC(20,0) DEFAULT 1`, `required_outputs_available BOOLEAN DEFAULT false`, nullable `result_ref TEXT`, `created_at/updated_at TIMESTAMPTZ`, nullable `terminal_at TIMESTAMPTZ`.
- `orchestration_case`: `(organization_id, case_id TEXT)` PK; composite FK to job; `member_ordinal INTEGER`, `record_ref JSONB`, `record_identity_sha256 TEXT`, `revision NUMERIC(20,0)`, `state TEXT CHECK(case states)`, `assigned_team_id UUID`, nullable `assigned_actor_id UUID`, `already_satisfied BOOLEAN`, nullable `handoff_id UUID`, nullable `current_execution_id UUID`, nullable `latest_verification_ref TEXT`, `control_intent TEXT`, nullable `blocker_code TEXT`, `created_at/updated_at`, nullable `terminal_at`; unique `(organization_id,job_id,member_ordinal)` and `(organization_id,job_id,record_identity_sha256)`.
- `orchestration_selection`: `(organization_id,preview_id UUID)` PK; principal UUID, agent/release/version/hash binding, selection/session/snapshot metadata, `population_sha256`, `population_count`, `more_available`, `host/limits JSONB`, `state CHECK building/sealed/consumed/invalidated/expired`, `created_at/expires_at`, nullable `consumed_job_id`. `orchestration_selection_member`: `(organization_id,preview_id,ordinal)` PK, `record_ref JSONB`, unique record identity per preview. One preview may start at most one job; HTTP retries return that same job.
- `orchestration_case_dependency`: `(organization_id,job_id,predecessor_case_id,successor_case_id)` PK; `condition JSONB`; composite same-job FKs and self-edge check. Validate DAG and 4,000-edge cap before sealing; never let a missing predecessor mean satisfied.
- `orchestration_case_execution`: `(organization_id,execution_id UUID)` PK/FK to existing `orchestration_execution`; job/case composite FKs; `execution_ordinal INTEGER`, nullable `predecessor_execution_id UUID`, nullable `reconciliation_ref TEXT`, `remaining_scope_sha256 TEXT`, `created_at`, nullable `terminal_at`; unique ordinal/case. One case has one current execution.
- `orchestration_record_reservation`: `(organization_id,record_identity_sha256)` PK; job/case FKs, `state CHECK active/quiescing/uncertain`, `control_generation`, `acquired_at`, nullable `resolved_at`. Active rows are not lease-based. Keep resolved history in audit, remove the active row only after safe release. Index `(organization_id,job_id,case_id)`.
- `orchestration_case.resolution`: required `unresolved|terminal|handed_off`, default unresolved. Terminal successful/expectedly-rejected/safely-canceled states set terminal; Failed/Blocked/Needs Clarification may set handed_off only after Graph confirms an accepted handoff with safe disposition. Outcome Unknown remains unresolved while any prior business effect is uncertain, even when an incident/handoff owner exists. Add the same `resolution` field to CaseViewV1; handed_off counter derives from it without rewriting the case's original failure/clarification status.
- `orchestration_dispatch_slot`: tenant-owned preallocated `(organization_id UUID,slot_kind TEXT,scope_key TEXT,slot_number INTEGER)` PK; nullable job/execution/assignment IDs, epoch, `lease_not_after`, and opaque `global_slot_token UUID`. Kinds organization/job/connection; defaults 4/2/1. Allocate in canonical kind/key/slot order in a short transaction. Add internal `orchestration_global_dispatch_slot` with exactly eight rows `(slot_number SMALLINT PRIMARY KEY CHECK 1..8,lease_token UUID UNIQUE NULL,lease_not_after TIMESTAMPTZ NULL)`. Grant no direct table access to oryn_app or execution workers; only fixed SECURITY DEFINER `claim_global_case_slot(lease_token UUID,not_after TIMESTAMPTZ) RETURNS SMALLINT` and `release_global_case_slot(lease_token UUID) RETURNS BOOLEAN`, owned by a dedicated no-login capacity role and executable only by trusted Durable Worker. Pin function search_path and qualify all table names; neither function accesses tenant data or takes caller SQL/tenant claims. A claim grants capacity only, never business authority. Acquire global slot first within the slot lock tier, then tenant slots; transaction rollback releases all. Do not hold compute slots during human/unknown waits or long polls. Before reclaiming an expired capacity token, the coordinator fences its prior tenant assignment through the normal tenant transaction; business reservations survive. Record this control-table exception explicitly rather than weakening tenant RLS.
- `orchestration_runtime_command`: `(organization_id,execution_id,command_id UUID)` PK; authenticated principal ID/assignment UUID/epoch, canonical request digest, safe committed result JSON or result-ref, created_at, replay_deadline, tombstone_deadline. Domain UUIDv4 command deduplication is distinct from Control Plane UUIDv7 HTTP idempotency, not another generic HTTP subsystem. Same command/content/principal replays the committed result before stale-CAS checks. Different content conflicts. Reauthenticate read/replay access; new worker incarnations load snapshots, not old authority. Seven-day response replay, 24-month tombstones; earlier source deletion never re-exposes values through replay.
- `orchestration_action_intent`: `(organization_id,execution_context_sha256,node_id,iteration_path_sha256,action_generation NUMERIC(20,0))` PK; logical action ID unique per organization/context, creator execution UUID, nullable predecessor action ID/reconciliation ref, created_at. This durable ledger preserves generations across continuation executions.
- Amend `orchestration_execution` to add job/case lineage FKs and internal `last_cursor_sha256`; replace unique `(organization_id,execution_context_sha256)` with the case-execution lineage and one-current-execution invariant, because multiple linked executions now share a case context. Do not permit two simultaneously current executions for the same case.
- In `orchestration_effect`, rename `invocation_index` to `action_generation NUMERIC(20,0)` and include `kind` in invocation uniqueness `(organization_id,execution_id,node_id,iteration_path,action_generation,kind)`. Each effect kind has one lifecycle row for that logical invocation; prepare/authorize/consume/dispatch phases cannot collide. Retain prior generations and owner results.

Add indexes for ready jobs `(organization_id,state,created_at,job_id)`, ready cases `(organization_id,job_id,state,member_ordinal)`, current execution lease expiry, schedule due times, approval deadlines, record exclusions, and retention deadlines. JSON blobs are bounded by schema/byte limits, not unbounded alternate event stores. Execution checkpoints stay delta-written; do not duplicate immutable programs or unchanged values.

Preserve `Identity Guards -> Adapter / Graph Guards -> Execution Guard -> Checkpoint / Effect Rows`; add orchestration job/case/reservation/slot guards within the execution-guard tier in the order job -> sorted case IDs -> sorted record digests -> sorted slot keys -> execution IDs. Any transaction needing an earlier tier acquires it first. No vendor calls, Vault work, signature creation, or remote RPC under SQL row locks. Prepare external facts first; final transaction rechecks their revision/expiry and all guards. A stop changes the job-level dispatch fence synchronously, then advances affected execution control generations; adapters must check the job fence as well as execution guards so fanout latency cannot admit another action.

### 4. Define preflight, fair dispatch, dependencies, and live authority checks

Separate job admission from per-action authorization. Before admission, check `job.run`, exact release/manifest/version, declared scope, required inputs, approved connections/qualifications/verifiers, rule eligibility, configured budgets, host availability, and dependency validity. Use Graph's existing bounded scope-implication machinery; unproven subset means deny, never model judgment. Check current policy/release/qualification again before every real write through existing Identity/Adapter seams.

Release owns new `JobReleaseEligibilityV1` in the job schema: `{schema_id:"job.release-eligibility.v1", organization_id:Uuid, release_id:Uuid, release_revision, agent_id, agent_version_id:Uuid, agent_version, behavior_sha256, manifest_sha256, allowed_scope:ScopeV1, autonomy_stage:integer 3..5, canary_bucket_id:Identifier|null, eligibility_generation, checked_at}`. Document `ReleaseJobAdmissionPort::resolve(principal, agent_id, requested_version_id:Option<Uuid>, selection_scope:&ScopeV1) -> Result<JobReleaseEligibilityV1, JobProblemV1>` as an async module seam. Manual preview supplies requested version; scheduled occurrence passes none. Retain canary bucket/release binding across continuation/retry. A schedule may use Stage 4/5 only; Tier 3 steps still require item-level approval. No Stage 3 unattended scheduling.

Dispatch equal-share round-robin across organizations with queued work. Within an organization, rotate FIFO jobs by `(created_at,job_id)` so a single large job cannot monopolize its organization; within a job, use member ordinal among dependency-ready cases. Acquire separate compute slots and all required business-record reservations before assignment; if a record is already held, mark the case Blocked with `JOB_RECORD_CONFLICT`, owner and safe conflict metadata. Do not reveal another case's details without access. Unrelated cases continue.

Case write targets include the primary record and any statically declared additional mutation records derived from verified inputs. Resolve all identities through adapters before dispatch, sort digests, and acquire them atomically. An action targeting a newly discovered mutation record pauses for a new scope/record-reservation preflight before authorization; it never obtains an implicit reservation or expands scope. Adapter preparation and the orchestration execution gate compare the resolved record digest with the reserved set even if different connections use different opaque record keys. This is an Oryn exclusion only; retain the Adapter's conditional-write/exclusive-external-scope safeguards against non-Oryn writers.

Reuse `RuntimeAssignmentV1`, `RuntimeCheckpointPort`, 30-second assignment leases and 10-second heartbeats. Claim increments assignment_epoch exactly once and invalidates former worker ownership. Heartbeat renews only matching epoch/control/generation under current job fence; it does not advance cursor or semantic progress. Yield invalidates the assignment, persists checkpoint, and frees compute safely. Enforce current Identity execution principals and recovery epochs. Pinned local hosts resume only on the same device after explicit permitted recovery; no live host migration.

Approved-handoff dependency conditions query current Graph-owned assessment, including revision/permission. Unknown, failed, or missing dependencies block successors. Expected rejection alone never satisfies a `verified_complete` dependency. A dependency resume revalidates current rule/release/authority and does not silently update pinned versions.

### 5. Specify schedule rules, occurrence deduplication, and sponsor authority

Add these closed DTOs to the job schema:

- `ScheduleTriggerV1`: `{kind:"once", at:UTC timestamp}`; `{kind:"daily", local_time:"HH:MM", time_zone:IANA string}`; `{kind:"weekly", local_time, time_zone, weekdays:unique integer[1..7] in 1..7 (Monday=1)}`; or `{kind:"business_event", source_id:Identifier, event_type:Identifier, predicate:BusinessConditionV1}`.
- `PermittedHoursV1`: `{time_zone, weekdays:unique integer[1..7], start_local:"HH:MM", end_local:"HH:MM"}`; use half-open intervals. Require start<end within a local day; express overnight windows as two entries rather than infer rollover. A daily/weekly trigger must use the same IANA zone as its permitted-hours entries. Invalid zones/dates, empty weekdays, duplicate times, and out-of-window one-shot times fail validation.
- `ScheduleDefinitionV1`: `{schema_id:"job.schedule-definition.v1", organization_id:Uuid, schedule_id:Uuid, revision, workflow_id:Uuid, agent_id, owner_actor_id:Uuid, sponsor_actor_id:Uuid, trigger:ScheduleTriggerV1, selection:JobSelectionSpecV1, limits:JobLimitsV1, permitted_hours:PermittedHoursV1[1..14], escalation_team_id:Uuid, escalation_actor_id:Uuid|null, local_binding:LocalScheduleBindingV1|null, state:"draft"|"active"|"paused"|"retired", approved_scope:ScopeV1, approved_autonomy_stage:integer 4..5, approved_at:timestamp|null, created_at, updated_at}`. A null local binding requires cloud-only placement; local binding requires a device-capable release and explicit employee consent.
- `LocalScheduleBindingV1`: `{device_id:Identifier, profile_id:Identifier, employee_actor_id:Uuid, consent_revision, consented_at, not_after}`. Only that authenticated employee can grant/revoke it. Expiry is no later than its underlying current Desktop session (maximum seven days); logout/profile switch/pause/lock/availability loss invalidates current dispatch. Session renewal alone never silently extends consent. Device owner, sponsor and workflow owner may differ but each scope must independently authorize the use.
- `ScheduleMutationV1`: `{schema_id:"job.schedule-mutation.v1", expected_revision, definition:ScheduleDefinitionV1}`. Revisions replace editable configuration; no partial ambiguous policy merge. Existing schedule identity/organization/creation fields cannot change. Widening requires fresh owner and sponsor confirmation; material edits pause until activation.
- `ScheduleActivationV1`: `{schema_id:"job.schedule-activation.v1", expected_revision, confirmed_scope_sha256}`. Workflow Owner needs schedule.manage; sponsor must explicitly confirm its execution remit, including when sponsor differs from owner. Activation occurs only once both confirmations match the same revision.
- `ScheduleOccurrenceV1`: `{schema_id:"job.schedule-occurrence.v1", organization_id:Uuid, occurrence_id:Uuid, schedule_id:Uuid, schedule_revision, occurrence_key:Sha256, intended_at, admitted_at:timestamp|null, source_event_id:Uuid|null, state:"pending"|"admitted"|"no_work"|"missed"|"skipped_overlap"|"blocked"|"canceled", job_id:Identifier|null, reason_code:JobErrorCodeV1|null}`.
- `BusinessTriggerEventV1`: `{schema_id:"job.business-trigger-event.v1", organization_id:Uuid, source_id, event_type, event_id:Uuid, occurred_at, source_revision, subject_record:ApplicationRecordRefV1|null, evidence_ref:Identifier|null}`. Source registration defines permitted event type/schema, workload identity, scope, and authoritative timestamp origin. Input cannot include executable commands, arbitrary selection filters, credentials or model instructions. Event predicates and subject records may only narrow approved selection.

New tables: `orchestration_schedule` keyed organization/schedule UUID, with revision, definition JSON, state, owner/sponsor/employee confirmation revisions, control_generation, next_due_at, time_zone_database_revision, created_at/updated_at; `orchestration_occurrence` keyed organization/occurrence UUID, unique `(organization_id,schedule_id,occurrence_key)`, intended/admitted timestamps, source event/ref, state, nullable job_id and safe reason; `orchestration_trigger_source` keyed organization/source ID with registered workload ID, event/schema ID, approved scope, status/revision; `orchestration_schedule_overlap` keyed organization/schedule UUID with nullable current unresolved job and generation. Define full DDL, enums, FKs, RLS, due-state partial indexes, and safe retention.

Time generation uses a pinned deployment time-zone database revision and database UTC clock; persist local intended date/time and chosen UTC instant. Occurrence key hashes `{schedule_id, trigger_kind, local_date, local_time}` for recurring wall times, `{schedule_id,at}` for once, or `{schedule_id,source_id,event_id}` for events. Do not include schedule revision in the logical dedupe key: edits cannot replay an already recorded same occurrence. Record revision separately for audit. DST gaps create `missed`; folds use the earlier instant only. Time-zone database updates require recomputing only future unrecorded occurrences; do not alter recorded instants or generate a second fold occurrence.

Poll due schedules every second using bounded `FOR UPDATE SKIP LOCKED` batches of 100; this is not a cluster-wide singleton leader. Each occurrence is inserted once transactionally. Admit only at or after intended time and at most 60 seconds later, within permitted hours. Business events must have a valid authoritative occurred_at, not more than five minutes old or five seconds in the future; future-skew beyond five seconds is rejected. At occurrence admission, recheck sponsor job.run, owner schedule.manage, organization status, exact scope implication, current Stage 4/5 eligible release, budget, no unresolved prior run, connection/source qualification, and local availability where required. Resolve and pin the release, freeze selection and create at most one job linked to the occurrence. No work creates no job. Device or authority unavailable creates blocked occurrence with notification, not deferred automatic execution.

Already confirmed/admitted jobs may queue under resource limits within their approved permitted-hours window. If no case starts before that occurrence's window closes, pause for owner review rather than carry an unstarted backlog into another window. If work has started, reaching the window boundary fences new actions and pauses remaining work with an owner; never continue outside the window silently. Approval/readback reconciliation may continue under independent read authority. Resumption requires an authorized explicit command within permitted hours.

Any prior scheduled job with unresolved cases, pending approvals, unknown effects, or outstanding required outputs retains the overlap guard even if its dispatch was canceled. Safe resolved/handed-off dispositions release the guard; assignment alone never releases an unknown-effect guard. A scheduled source replay or late event is recorded/deduplicated, not re-executed. Old events cannot replay after tombstone disposal because freshness/recovery-floor checks reject them.

Add Identity-owned `ScheduledExecutionAuthorityV1`: `{schema_id:"identity.scheduled-execution-authority.v1", organization_id:Uuid, schedule_id:Uuid, schedule_revision, owner_actor_id:Uuid, sponsor_actor_id:Uuid, approved_scope:ScopeV1, policy_revision, owner_role_revision, sponsor_role_revision, checked_at}` to `identity-policy-v1.schema.json` and the Identity specification. It is an internal evaluated record, not a long-lived bearer approval and not an Action Authorization. Scheduler's existing WorkloadPrincipal is the authenticated caller; Identity evaluates current human sponsor/owner remits without creating a WebMember or pretending fresh MFA. Tier 3 approval/MFA is always a separate real human action. Loss of authority pauses schedule and any affected live job actions via current guards.

### 6. Specify approval waits, outcome aggregation, and honest terminal states

Reuse Identity proposals/decisions and existing human-question types. Do not build an orchestration approval authority. Persist approval refs/deadlines on durable waits, release compute and local workstation actuation reservation at safe boundary, but retain business-record exclusion. Before resuming, reacquire compute/device reservation, refresh preparation, and revalidate target generation, current scope and action approval. An expired approval is never extended by job resume.

Add `orchestration_approval_wait`: `(organization_id,proposal_id UUID)` PK, job/case/execution FKs, action ID/generation, proposal digest, Identity revision, pending/approved deadlines, `state CHECK pending/approved/rejected/changes_requested/expired/invalidated/consumed`, owner team/actor and updated_at. Identity remains authoritative; consumer notification loss is repaired by querying the owner.

Publish a transition table for every case state, allowed input, required owner evidence and next state. Important edges:

- assignment starts Not Started -> In Progress; exact proposal prepared -> Prepared -> Awaiting Approval when required;
- approval expiry -> Blocked; request changes -> Needs Clarification; known approved rejection branch -> Expectedly Rejected, otherwise Needs Clarification;
- submission receipt updates submission_state, never Verified Complete;
- possible dispatch/no reliable result -> Outcome Unknown with exclusion retained;
- verifier mismatch -> Failed case classification plus execution halt (`pause_case`) and incident; this reconciles existing Failed versus pause wording without letting later mutation run;
- missing/unknown mandatory verdict -> Outcome Unknown; unavailable pre-dispatch prerequisites -> Blocked;
- root `completion_requested` -> fetch complete pinned verifier requirement results; only independent verified postconditions plus required outputs authorize Verified Complete;
- already-desired state -> independent verification, Verified Complete plus already_satisfied subset marker, zero write;
- cancel before any uncertain/in-flight effect -> Canceled; cancel with admitted/in-flight/unknown action preserves truthful effect/outcome state while setting control intent; it never relabels an unknown effect Canceled;
- clarified/resolved hold resumes only through explicit owner-authorized command with fresh preflight; no unsolicited whole-case replay.

Unknown readback correction uses a new Verifier request/result ID and preserves the earlier immutable verdict. Document that “new execution records” in the Verifier spec means new verification-run records for read-only re-evaluation; an actual new mutation attempt additionally requires a linked runtime continuation. Reconciliation that proves the original effect correct may update the case's current projection to Verified Complete using that later verdict, without rewriting earlier history.

Compute job state from current authoritative case records plus control/output fields, in this order:

1. Explicit pause fence -> Paused, with unresolved effects still counted. Cancel request becomes Canceled only after workers reached safe boundaries or their remaining effects were explicitly classified unknown; retain `has_unresolved_effects` and case states/reservations, so cancellation is dispatch termination, not outcome resolution.
2. Shared admission failure before dispatch -> Preflight Check with blockers; admitted but unstarted eligible work -> Queued.
3. Any executing case, queued independently runnable case in a started job, or output finalization underway -> Running.
4. No runnable work and any Awaiting Approval/Needs Clarification/human-owned clarification wait -> Waiting for Review, even if other cases are Outcome Unknown.
5. Any remaining unresolved case/output with at least one verified/resolved case -> Partially Complete; no resolved case -> Paused (awaiting owned remediation), except all cases failed -> Failed.
6. All cases are Verified Complete and required output exists -> Completed. All cases are in approved terminal states, with at least one Expectedly Rejected or explicitly accepted exception handoff, and required outputs exist -> Completed with Exceptions.
7. All cases safely canceled -> Canceled; all cases failed -> Failed. Mixed safe cancellation/failure with some success and no approved resolution remains Partially Complete until an explicit owned disposition; never turn a failed case into expected rejection automatically.

The same projection function governs APIs, change feeds, exports and result notifications. Status counters count case states, not executions or attempts. Emit `job.completed` only on verified completed/completed-with-exceptions transition, not on failed, canceled or partial. Every significant state transition retains revision/actor/reason and safe evidence refs.

### 7. Repair action identity, runtime command replay, and value custody cleanly

In `agent-runtime-v1.schema.json`, make generic `$defs.Identifier` reference Graph Identifier, which accepts existing 68-character act_ digests and UUID owner IDs. Do not widen compiler-owned names: explicitly bind node/region/foreach/input-name and compiler binding-ID fields to Factory `PlanIdentifier`. Runtime-generated effect/action/worker/owner IDs remain generic. Keep strict Factory binding IDs, loop field names, slot name/node IDs, and the checkpoint node/region IDs consistently pinned to compiler names. Do not change Identity/Graph global identifiers.

Attempt IDs crossing Identity admission are UUIDv4. Adapter's broad Identifier already accepts UUIDv4; replace end-to-end `att_001`-style fixture attempts in Adapter fixtures with valid UUIDv4 and update linked receipts/digests. Do not invent an incompatible global attempt type migration.

Add required `action_generation:U64`, nullable `retry_of_action_id:Identifier`, and nullable `reconciliation_ref:Identifier` to `RuntimePendingEffectV1`. Non-action effects use generation `"0"` with null retry metadata; action-related phase effects use the durable logical generation. Initial action has generation zero and both nullable fields null. Later action generations require both references. Generation overflow holds with `RUNTIME_LIMIT_EXCEEDED`.

One exact formula for all generations:

```text
action_id = "act_" + lowercase_hex(SHA256(RFC8785({
  organization_id,
  execution_context,
  node_id,
  iteration_path,
  action_generation
})))
```

No assignment/execution/worker/recovery-epoch ID enters this preimage. Restarting/reassigning at the same generation preserves identity. An authorized reconciled retry allocates a new generation on the case-context action-intent ledger, not on a worker-local counter. Persist predecessor/reconciliation evidence before authorization; prepare anew and obtain fresh authorization/approval/admission. Never increment on transport retry, ordinary crash, user resume without new intent, or an unknown outcome. Preserve consumed fences forever within their governed audit/exclusion lifetime.

Reconciliation continuation transaction: verify authorized operator and evidence; query Identity/Adapter/Verifier owner records outside locks; prove old dispatch state and allowed remaining scope; fence prior execution, lock current case/action-intent rows, allocate next intent generation only where a new action is required, create linked execution, set current pointer, commit audit/outbox. Recheck owner revisions and recovery barriers. If no-send/correct-state proof is unavailable, keep Outcome Unknown and reject continuation. Recovery after PITR must reconstruct highest admitted generations from authority/action-owner journals before allocating anything; a gap returns `JOB_RECOVERY_REQUIRED`.

Connect existing runtime command dispatcher to the command ledger from step 3. Same command with lost response returns the committed result without incrementing revision, active-time counters, node visits or trace twice. CAS remains necessary for new commands. Existing UUIDv7 Idempotency-Key protects HTTP mutations independently; domain command_id remains UUIDv4.

Add `RuntimeValueUploadV1` and `RuntimeValueQueryV1` to runtime schema and document `RuntimeValuePort` beside `RuntimeCheckpointPort`:

- Upload `{schema_id:"runtime.value-upload.v1", command_id:UUIDv4, assignment_id:Uuid, assignment_epoch:U64, expected_checkpoint_revision:U64, expected_control_generation:U64, binding_id:PlanIdentifier, value_revision:U64, type_sha256:Sha256, value_sha256:Sha256, evidence:ValueEvidenceV1, owner_result_ref:RuntimeOwnerResultRefV1|null, source_expires_at:timestamp|null, value:PortableJsonValueV1}`. Reuse exactly `urn:oryn:schemas:agent-factory:v1#/$defs/PortableJsonValueV1`, as existing RuntimeMaterializedValueV1 does; no new arbitrary JSON type and no JSON numeric business values. Full upload envelope <=256 KiB and canonical value <=256 KiB; aggregate live values <=2 MiB. System/reviewer/inference-derived uploads require independently retrievable owner_result_ref; derived values require validated parent binding ancestry. Approved literals must match pinned program literals. Existing ValueEvidenceV1.verification remains `verified|unverified`; origins remain its existing closed vocabulary, never new `system_verified` enum members.
- Linked continuations may reference surviving predecessor values without copying blobs or resetting retention. Add required `value_execution_id:Uuid` to RuntimeBindingRefV1, RuntimeValueBlobRefV1 and RuntimeValueQueryV1, and update all producer/consumer fixtures. New uploads use their current execution ID. Materialization permits the current execution or a same-case ancestor explicitly recorded in orchestration_case_execution, with matching behavior/binding/type/hash and unexpired source; no arbitrary execution lookup. AAD/DEK remain bound to the value's original execution. Checkpoint commit verifies this ancestry and inherited binding membership. A missing ancestor value holds work; it never manufactures a fresh value or silently changes its source.
- Query `{schema_id:"runtime.value-query.v1", assignment_id:Uuid, assignment_epoch:U64, checkpoint_revision:U64, binding_id:PlanIdentifier, value_revision:U64}`. Return existing `RuntimeMaterializedValueV1` only for a current authorized binding. Upload returns existing `RuntimeValueBlobRefV1`.
- `RuntimeValuePort::upload(principal:&VerifiedPrincipal, request:RuntimeValueUploadV1) -> Result<RuntimeValueBlobRefV1,RuntimeErrorV1>` and `materialize(principal:&VerifiedPrincipal, request:RuntimeValueQueryV1) -> Result<RuntimeMaterializedValueV1,RuntimeErrorV1>` are async.

Coordinator validates canonical plaintext digest/type/size, declared binding, dataflow dominance, taint, expiry and independently retrievable producer refs. Worker-uploaded evidence cannot promote a value to system_verified/reviewer_verified without checking that owner. It obtains/unwraps the existing per-execution DEK and encrypts with fresh 96-bit nonce/AAD outside row locks, then final transaction rechecks assignment, revision, control, source lifetime and digest. Return bytes/sha256 for canonical plaintext; ciphertext overhead stays internal. Identical binding/revision/content replay succeeds, changed content conflicts. Unattached uploads remain unmaterializable and are purged after five minutes or earlier source expiry; cap uncommitted staging at 2 MiB/execution.

Update existing PUT `/internal/v1/runtime/assignments/{assignment_id}/values/{binding_id}` to application/json `RuntimeValueUploadV1`, exact path/body equality and 409/403/413 responses. Add GET on that path with epoch/revision/value_revision query parameters for `RuntimeValueQueryV1`; no DEKs or arbitrary historical-value read endpoint. Amend Runtime/ADR wording to disposal of active encrypted values/wrapped keys, not misleading plaintext-on-disk storage. No worker key protocol or public-key upload layer.

### 8. Specify budget admission, control fencing, recovery, and retention

Execution spend accounting belongs to Orchestration; inference policy/organization buckets remain Identity/Control Plane owned. Add `JobBudgetReservationV1`: `{schema_id:"job.budget-reservation.v1", organization_id:Uuid, job_id, reservation_id:Uuid, execution_id:Uuid, owner:"inference"|"runtime"|"adapter", owner_request_id:Uuid, pricing_revision:Identifier, reserved_microusd:decimal, settled_microusd:decimal, state:"reserved"|"dispatched"|"settled"|"released"|"usage_unknown", created_at}`. One logical owner request is charged at most once. Extend the existing inference admission's internal job-context binding to identify the job budget envelope; do not double charge inference in a separate billing system.

Add `orchestration_budget` keyed organization/job with nullable configured cap, reserved/settled nonnegative BIGINT and pricing/config revision. Add `orchestration_budget_reservation` keyed organization/reservation UUID, unique `(organization_id,owner,owner_request_id)`, execution FK, bounded amount/pricing revision/state/timestamps. Reserve job budget before obtaining owner reservation; on owner rejection release only the confirmed undispatched reservation. If either reservation outcome is ambiguous, keep encumbered until owner reconciliation. Final settlement is idempotent. Unknown usage cannot be released because a timer expired. Reserve maximum chargeable tokens/time/API units under approved price/rate bounds before dispatch. Absent a certified finite bound for a covered cost, return JOB_COST_UNBOUNDED; absent a monetary cap, still apply runtime/time/concurrency/tenant inference caps. Show separate known metered consumption, unknown encumbrance, external/unavailable cost disclosures and estimates. Increasing a paused job cap requires administrator authority and a fresh explicit job authorization; no automatic top-up.

Use configured organization limits plus per-job tighter limits. Add nullable `execution_limits` to Identity's `OrganizationPolicyV1`, using new `ExecutionLimitsPolicyV1` `{max_active_cases:integer 1..4, max_active_cases_per_job:integer 1..2, max_active_cases_per_connection:integer 1, default_max_active_ms:integer 1..900000, job_spend_limit_microusd:decimal|null}`. Null uses the approved pilot limits above; existing policy and fixture objects must explicitly include null, not an optional compatibility convention. Add internal capability `execution_limits.manage` (OAuth scope `execution_limits:manage`) to the existing role/capability catalog, granted to Organization Admin only; it grants no job.run, release or action-approval authority. Security Admin retains security_policy.manage for mandatory ceilings, not implicit run-budget administration. Identity evaluates these capabilities and records policy revisions. Global eight-case capacity is deployment-owned, not a customer privilege.

Stop/pause is a synchronous domain command: authorize, set job fence/control_generation under canonical guards, invalidate future dispatch, journal safety metadata, then return current projection. High/Critical containment uses the same synchronous fence seam, never waits behind ordinary outbox delivery. Use the existing control-plane 250 ms safety scan and hints for fanout; target sub-second durable fence acknowledgment and <=2-second connected-worker notification as measured targets, not proven guarantees. Connected workers acknowledge safe primitive boundaries; unresponsive/unreachable ones retain explicit pending acknowledgment/uncertain state. An already admitted vendor request may still finish. Canceled jobs do not auto-resume; operator work on canceled populations requires a new confirmed job with lineage and duplicate checks.

Extend Identity's existing recovery journal, not a second independent journal, with `orchestration_safety_fenced` entries containing `OrchestrationSafetyFenceV1`: `{schema_id:"job.safety-fence.v1", organization_id:Uuid, fence_id:Uuid, generation:U64, subject_kind:"job"|"schedule"|"case"|"action_intent"|"budget"|"occurrence", subject_id:Identifier, state_ref_sha256:Sha256, after_state}`. `state_ref_sha256` hashes canonical `after_state`; `subject_kind` must match its kind. Closed after-state variants are:

- job: `{kind:"job",job_id,control_generation,control_intent:"none"|"pause"|"cancel",state,has_unresolved_effects:boolean}`.
- schedule: `{kind:"schedule",schedule_id:Uuid,revision,state:"draft"|"active"|"paused"|"retired",control_generation,owner_actor_id:Uuid,sponsor_actor_id:Uuid,confirmed_definition_sha256:Sha256|null,current_unresolved_job_id:Identifier|null,last_recorded_occurrence_key:Sha256|null}`. Hash approved scope/definition rather than put business predicates into recovery audit.
- case: `{kind:"case",job_id,case_id,current_execution_id:Uuid|null,control_generation,reservation_state:"active"|"quiescing"|"uncertain"|"released",record_identity_sha256s:unique Sha256[0..256],has_unresolved_effects:boolean}`. Empty identities are allowed only for released/read-only cases.
- action_intent: `{kind:"action_intent",execution_context_sha256,node_id:PlanIdentifier,iteration_path_sha256,highest_allocated_generation:U64,highest_admitted_generation:U64|null,action_id,retry_of_action_id:Identifier|null,reconciliation_ref:Identifier|null}`. Generations never decrease.
- budget: `{kind:"budget",job_id,reservation_id:Uuid,owner:"inference"|"runtime"|"adapter",owner_request_id:Uuid,pricing_revision:Identifier,reserved_microusd:decimal,settled_microusd:decimal,state:"reserved"|"dispatched"|"settled"|"released"|"usage_unknown"}`.

Store these rows in `orchestration_safety_fence` keyed `(organization_id,fence_id)` with subject kind/ID, per-subject monotonic generation, typed after-state JSON, digest and event_at; unique `(organization_id,subject_kind,subject_id,generation)`. Add that exact table-name/after-image binding to `RecordAfterImageV1` and existing Authority journal envelope. No business payloads enter these records. Authority journal checkpoint acknowledgment follows existing Identity protocol; if unavailable, keep local fence effective but return recovery/unavailability rather than claiming restore-safe acceptance. On restore, replay control/generation/overlap/record/budget safety fences and existing retention/action journals before any scheduler, slot claimant, value unwrap or mutation admission starts. Missing proof means affected-scope dispatch freeze, not guessed reconstruction. Reconstruct all recorded occurrence keys from journaled occurrence admission entries, not only the latest key: add `occurrence` to subject kinds with after-state `{kind:"occurrence",schedule_id:Uuid,occurrence_key:Sha256,occurrence_id:Uuid,schedule_revision,state,job_id:Identifier|null,intended_at}`; schedule admission and occurrence recording journal these content-free keys before accepting a job.

Preserve existing restore-replay `orchestration_retention_fence`. Values expire at the earliest of source expiry, seven days after case termination and 30 days without durable semantic progress. Cursor/binding/effect-owner advancement qualifies as progress; heartbeat/retry/timestamp touches do not. Values for superseded continuation executions retain original source/deadline bounds, never reset because another execution was created. Dispose active encrypted value/wrapped-key rows; disclose existing backup-expiry boundaries. Loss of values makes work nonresumable and requires fresh separately authorized inputs; it does not clear unknown-effect exclusions.

Store selection-sensitive data encrypted under existing central execution custody. Dispose unconsumed previews at five minutes and staging at its earlier deadline. Accepted job member identity, case/job state, owner refs, generation/exclusion metadata, occurrence/dedup history and command tombstones follow 24 months after safe terminal disposition under audit policy. Unresolved safety reservations/obligations retain minimal content-free identity while operationally required; ending resumability never releases them. Do not extend raw local capture retention, create central media, or persist inference prompts/completions.

### 9. Define transport, events, projections, and focused cross-document reconciliation

Extend `docs/architecture/contracts/control-plane-v1.openapi.json` using existing security/CSRF/idempotency/problem patterns; no second OpenAPI file:

- POST `/v1/jobs/previews`: JobPreviewRequestV1 -> 201 JobPreviewV1, or 202 OperationV1 while bounded enumeration completes.
- GET `/v1/jobs/previews/{preview_id}` -> JobPreviewV1; GET `/v1/jobs/previews/{preview_id}/members` -> JobMemberPageV1.
- POST `/v1/jobs` with StartJobCommandV1 -> 201 JobViewV1.
- POST `/v1/jobs/{job_id}/limits` with `JobLimitChangeV1` `{schema_id:"job.limit-change.v1",expected_revision,limits:JobLimitsV1,reason:string 1..512}` -> 200 JobViewV1. Job must be Paused. Require current execution_limits.manage and current security ceilings. Lowering applies immediately; increasing never auto-resumes. A subsequent existing resume command requires current job.run and exact new job revision, explicitly authorizing the displayed revised limits. Do not add a second combined-role approval workflow. Population size cannot increase after sealing.
- GET `/v1/jobs` -> JobPageV1; GET `/v1/jobs/{job_id}` -> JobViewV1.
- GET `/v1/jobs/{job_id}/cases` -> CasePageV1; GET `/v1/jobs/{job_id}/cases/{case_id}` -> CaseViewV1.
- POST `/v1/jobs/{job_id}/controls` with JobControlCommandV1 -> 200 JobViewV1.
- POST `/v1/jobs/{job_id}/cases/{case_id}/reconciliations` with CaseReconciliationCommandV1 -> 200 CaseViewV1 or 202 OperationV1 while owner evidence is collected.
- POST `/v1/job-schedules` and PUT `/v1/job-schedules/{schedule_id}` with ScheduleMutationV1 -> 201/200 ScheduleDefinitionV1.
- POST `/v1/job-schedules/{schedule_id}/activations` with ScheduleActivationV1 -> 200 ScheduleDefinitionV1; require matching owner and sponsor confirmations.
- POST `/v1/job-schedules/{schedule_id}/sponsor-confirmations` with ScheduleActivationV1 -> 200 ScheduleDefinitionV1, sponsor only.
- POST `/v1/job-schedules/{schedule_id}/local-consents` with LocalScheduleBindingV1 -> 200 ScheduleDefinitionV1, named employee only; DELETE same path revokes and fences affected local dispatch.
- POST `/v1/job-schedules/{schedule_id}/controls` with `{schema_id:"job.schedule-control.v1",expected_revision,action:"pause"|"retire",reason}` -> 200 ScheduleDefinitionV1. Reactivation uses existing activations after revalidation, never hidden resume.
- GET `/v1/job-schedules/{schedule_id}` -> ScheduleDefinitionV1; GET `/v1/job-schedules/{schedule_id}/occurrences` -> page of ScheduleOccurrenceV1 (<=100 items, opaque cursor); GET `/v1/job-schedules` -> equivalent page of ScheduleDefinitionV1. Add named SchedulePageV1 and OccurrencePageV1 schema definitions.
- POST `/internal/v1/job-trigger-events` with BusinessTriggerEventV1 -> 202 OperationV1 after durable authenticated intake/dedup. mTLS plus registered workload identity is required; it is not a public webhook or a bypass around current schedule authority.

All mutating management routes reuse existing UUIDv7 Idempotency-Key, exact request hashing, 7-day replay/24-month tombstone and current authorization. Their domain commands use optimistic revisions; inaccessible references return 404. Do not cache long-poll responses while holding SQL connections. Reuse `GET /v1/operations/{operation_id}`, owner-directed cancellation and `GET /v1/changes` bounded 25-second long poll; no new management WebSocket/SSE transport.

Publish new event literals `job.changed`, `job.schedule_changed`, `job.occurrence_recorded`, `job.control_fenced`, `job.reconciliation_recorded` alongside existing `job.requested`, `job.case_state_changed`, `job.completed`. Add required consumed producer literals `release.approved`, `release.paused`, `release.expanded`, `release.reverted`, `outcome.verified`, `outcome.unknown`, `approval.requested`, `approval.decided` to Control Plane's closed event vocabulary and constrain safe payloads by event_type. Job/schedule event payload contains resource refs/revisions and no business values. Events are wake facts; current live owner guards, not event receipt, grant authority. Domain state, audit and outbox commit together; inbox dedup covers redelivery. Avoid adding unrelated missing event literals.

Update actual owning documents in the same behavioral steps, not a deferred reconciliation note:

- `TECHNICAL.md` §§6.1, 7.2 Contracts 6/9/10/11/14/18, 9.4, 11.4 and 13.2: settled engine, frozen populations/schedules, generation identity, controls and safe lineage.
- Contracts catalog entries 6/9/10/11/14/18 and normative schema inventory: add job schema/fixtures and explicit producer ownership.
- `identity-policy.md` and schema: sponsor authority, new organization execution policy, recovery safety-fence envelope and live gate ordering.
- `application-adapters.md`, Adapter/Capability schemas and Adapter fixtures: selection, canonical identity mapping, current reservation checks and UUIDv4 examples.
- `agent-runtime.md`, runtime schema/fixtures and ADR-0017 amendment: wide owner IDs versus strict plan names, generation metadata/formula, one-current execution, command replay, typed value seam and correct encrypted retention wording.
- `outcome-verification.md`: reconcile Failed classification versus execution halt; fresh immutable verification records for later readback and explicit consumer mapping.
- `release-governance.md`: define JobReleaseEligibilityV1/resolve seam and remove only the directly conflicting claim that revocation guarantees external worker/request recall; future versions never repin running jobs.
- `incident-correction-repair.md`: route job/case/scope containment to synchronous fences with acknowledgment distinction; retain severity owner.
- `desktop-shell.md`: authenticated employee local schedule consent presentation/registration, availability/lock/pause/session invalidation; keep existing shell-runtime and reservation ownership. No new capture-consent category.
- `command-center-analytics.md`: exact job/case/approval/schedule projections, source visibility, stop status, counters, exports and existing REST/long-poll transport. Remove only conflicting job-management WebSocket claims, not independent future UI work.
- `control-plane.md`: integrate new routes/module and job-budget linkage into existing request/queue/idempotency/inference machinery without changing its transport delivery limits.
- `data-classification.md`: add selection/value/command/occurrence/safety-fence lifecycle distinctions under execution records. `threat-model.md`: add focused job-selection substitution, cross-connection duplicate writer, stale scheduled sponsor, consumed-generation replay, unsafe stop/restore, and unknown-budget release threats; leave unrelated legacy inconsistencies alone.

Record one accepted `docs/adr/0018-job-orchestration-and-scheduling.md`: PostgreSQL state machines versus Temporal, frozen population/qualified selection, sponsor-linked schedules, cross-job record exclusions, generation-inclusive recovery, and coordinated checkpoint value custody. Cite user-approved design, not fictitious committees. Amend ADR-0017 with a clearly linked amendment; do not erase historical rationale. If 0018 is already occupied by unrelated user work at execution, allocate the next sequential number and use that number consistently everywhere. Keep component status implementation-pending and factual documentation-only claims.

### 10. Supply conformance fixtures and a complete twelve-section component specification

Create `docs/architecture/contracts/job-orchestration-v1.fixtures.json`. Use existing fixture convention: `{schema_id:"job.fixture-set.v1", validation_cases:[{case_id,schema_ref,instance,expected_valid}], semantic_cases:[{case_id,kind,inputs,expected}]}`. Add `JobFixtureSetV1` with closed fixture envelopes; semantic case kinds have closed typed input/expected schemas, not unbounded opaque examples. Each semantic case states `implementation_conformance_pending:true`; schema/math/reference-model verification does not prove future backend behavior.

Within existing twelve headings, include exact module interfaces, full SQL DDL, transaction/lock matrices, state/input/evidence transition tables, recurrence/dedup algorithms, approval deadline matrix, error/action table, sequence diagram for admission→approval→submit→verify, state diagram separating job/case/control phases, retry crash-window matrix, budget owners/reservations, retention/restore gates, and concrete acceptance mappings. Preserve unrelated comments and all normative inherited constraints. Replace stale “specific preserved implementation questions” with settled decisions and owner-interface obligations; leave no unresolved choice, TODO, stub or fake implementation assertion. Answer TECHNICAL.md §14.2's nine handoff questions explicitly.

Add structural positive/negative fixtures and semantic vectors for every scenario in Verification below. Extend existing runtime/adapter/identity/control-plane fixtures where new required fields change those contracts. Do not weaken unrelated negatives to make tests pass. Regenerate affected RFC8785 hashes/signatures using existing fixture-declared synthetic keys; if an old affected signed fixture lacks a usable synthetic key, replace that fixture and its dependent expected values with an explicitly synthetic reproducible key, never invent a valid signature.

## Critical files & anchors

Line numbers are hints; reread changed targets before edits.

1. `docs/components/job-orchestration.md`, State and lifecycle / authoritative execution DDL / CAS: preserve existing runtime persistence ownership while extending job/case coordination.
2. `docs/architecture/contracts/agent-runtime-v1.schema.json`, Identifier, RuntimePendingEffectV1, RuntimeOwnerResultRefV1, RuntimeValueBlobRefV1: prevent valid runtime IDs from rejecting themselves; encode recoverable fresh intent and value custody.
3. `docs/components/identity-policy.md`, Fixed Role Catalog, Approval Delegations, consumption/recovery: schedule.manage does not grant job.run; stop/retry must preserve one-use action authority.
4. `docs/components/outcome-verification.md`, Runtime Verification Execution Port / Verdict Immutability: new readback records can correct projections without rewriting old verdicts or granting retry authority.
5. `docs/adr/0017-agent-runtime-execution-and-recovery.md`, decisions 2/4/5/6: inherited checkpoint, placement, identity and privacy constraints requiring explicit amendments.

## Verification

### Documentation/contract checks to execute once after all edits

Working directory: `/Users/hari/Developer/Oryn`. No production credentials or business data. Current `/opt/homebrew/bin/python3` was checked during planning and lacks jsonschema/referencing/rfc8785/cryptography. After execution approval, use an isolated uv tool environment; do not add project dependencies or package scaffolding. Keep validators in heredocs, not permanent repo scripts.

Run:

```bash
uv run --no-project --with jsonschema --with referencing --with rfc8785 --with cryptography python -B - <<'PY'
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource
from referencing.exceptions import NoSuchResource

root = Path('docs/architecture/contracts').resolve()
documents = {p: json.loads(p.read_text()) for p in root.glob('*.schema.json')}

def deny_remote(uri: str) -> Resource:
    raise NoSuchResource(ref=uri)

registry = Registry(retrieve=deny_remote)
for path, schema in documents.items():
    resource = Resource.from_contents(schema)
    registry = registry.with_resource(schema['$id'], resource)
    registry = registry.with_resource(path.as_uri(), resource)

targets = {
    'job-orchestration-v1.schema.json', 'agent-runtime-v1.schema.json',
    'application-adapters-v1.schema.json', 'application-capability-v1.schema.json',
    'identity-policy-v1.schema.json', 'control-plane-v1.schema.json',
}

def refs(value: object, base: str) -> None:
    if isinstance(value, dict):
        nested_base = value.get('$id', base)
        for keyword in ('$ref', '$dynamicRef'):
            if keyword in value:
                registry.resolver(nested_base).lookup(value[keyword])
        for child in value.values():
            refs(child, nested_base)
    elif isinstance(value, list):
        for child in value:
            refs(child, base)

for path, schema in documents.items():
    if path.name in targets:
        Draft202012Validator.check_schema(schema)
        refs(schema, schema['$id'])

fixtures = [
    'job-orchestration-v1.fixtures.json', 'agent-runtime-v1.fixtures.json',
    'application-adapters-v1.fixtures.json', 'identity-policy-v1.fixtures.json',
    'control-plane-v1.fixtures.json',
]
case_count = 0
for name in fixtures:
    data = json.loads((root / name).read_text())
    for case in data.get('validation_cases', []):
        validator = Draft202012Validator(
            {'$ref': case['schema_ref']}, registry=registry, format_checker=FormatChecker()
        )
        actual = validator.is_valid(case['instance'])
        assert actual == case['expected_valid'], (name, case['case_id'], list(validator.iter_errors(case['instance'])))
        case_count += 1

api_path = root / 'control-plane-v1.openapi.json'
api = json.loads(api_path.read_text())
assert api['openapi'].startswith('3.1.')
registry = registry.with_resource(api_path.as_uri(), Resource.from_contents({
    '$schema': 'https://json-schema.org/draft/2020-12/schema', **api
}))
refs(api, api_path.as_uri())

expected_headings = [
    'Purpose and ownership', 'Product requirements', 'Upstream and downstream contracts',
    'Trust and deployment boundaries', 'Internal architecture', 'State and lifecycle',
    'Error and edge-case behavior', 'Observability and audit', 'Security and threat model',
    'Test strategy', 'Performance and operations', 'Architecture decisions and open questions',
]
component = Path('docs/components/job-orchestration.md').read_text()
assert re.findall(r'^## (.+)$', component, re.M) == expected_headings
assert 'Detailed technical specification — implementation pending' in component
assert not re.search(r'\b(?:TODO|TBD)\b', component)
assert all(f'ORY-{n:03}' in component for n in range(40, 49))
print(f'PASS: {len(targets)} target schemas, local refs/OpenAPI, {case_count} fixture cases, 12 sections and ORY-040–048')
PY
```

The fixture families may also use `positive_cases`/`structural_negative_cases`; include those actual existing formats if affected fixtures use them, treating their validity expectation as true/false respectively. This adaptation is mechanical, not permission to omit changed cases. Validate changed fixture envelopes against their declared fixture-set definitions. For Markdown links, inspect changed documents only: parse local links, ignore external/anchor-only links, URL-decode targets, and assert each referenced local path exists. Do not run unrelated repository audits.

Run a second inline Python proof in the same uv environment to independently evaluate the new typed `semantic_cases`: use `rfc8785.dumps`, hashlib, zoneinfo, and Ed25519/AESGCM from cryptography. Evaluate the cases below from inputs, not by echoing expected records. No unrecognized kind may silently skip. Run existing affected action-ID/digest/signature vectors too; report any pre-existing unrelated fixture inconsistency separately rather than weaken it.

### Required new-behavior evidence

1. **Mixed batch:** 11 input case records -> seven Verified Complete, two Needs Clarification, one Awaiting Approval, one Outcome Unknown. Counts sum to eleven; job Waiting for Review after runnable work drains; no duplicate write admitted. With an independent runnable case, job remains Running.
2. **Frozen selection:** seal records A/B, then source adds C/removes A -> frozen members remain A/B; A becomes Blocked if unavailable, C never enters. Expired preview/release change requires fresh preview, not a broader queue or a silently newer version.
3. **Qualified prefix:** stable ordered queue of 1,001 records with approved max_items=100 -> exactly first 100, more_available=true. Explicit list of 1,001 -> rejection. Duplicate page member, changed snapshot, substituted cursor/tenant/connection, incomplete prefix -> rejection, zero assignments.
4. **Record exclusion:** two connections to the same canonical account/native record produce one identity digest and one mutation reservation winner. Same record key in different accounts produces distinct digest. Pending approval/unknown effects retain reservation after compute/assignment lease expiry.
5. **Dependency isolation:** A->B, C independent; A unknown -> B Blocked, C dispatchable. A-B-A cycle or cross-job predecessor -> admission rejection.
6. **Schedule dedup:** duplicate deliveries of one source event/one timed occurrence -> one occurrence and at most one job. Edited schedule revision cannot replay same recorded occurrence. Unresolved prior run -> skipped_overlap and zero new assignments.
7. **DST:** America/New_York 2027-03-14 02:30 -> missed; 2027-11-07 01:30 -> exactly 05:30Z, never also 06:30Z. Normal timed event at +60 seconds is within grace, +61 seconds is missed. Business event age 300 seconds accepted if otherwise eligible, 301 seconds missed. No silent catch-up.
8. **Authority:** schedule owner without sponsor job.run -> no job. Sponsor revocation, owner loss, organization deactivation, scope expansion, unqualified operation or current release outside approved scope -> blocked/paused with alert. No fresh human MFA fabricated for scheduler.
9. **Local device:** locked/offline/paused/wrong-profile/expired-consent device -> zero local dispatch, explicit blocked occurrence. New cloud-capable release never migrates a pinned local case.
10. **Preflight:** one invalid item among otherwise eligible fixed members -> one Blocked case, independent cases proceed. Shared permission/release failure -> zero dispatches for entire job.
11. **Approval:** timeout -> Blocked; Request Changes -> Needs Clarification; only a workflow-defined rejection -> Expectedly Rejected. Pending/approved deadlines stay distinct from 30-second worker/action leases. Approval is not postcondition verification.
12. **No false completion:** application_acknowledged plus unknown/missing mandatory verifier requirement -> not Verified Complete/Completed. Later independent reverify record may correct current projection; original unknown verdict remains unchanged. Already-satisfied verified target causes zero writes and increments subset counter only.
13. **Action identity:** same context/node/path/generation across workers/restarts -> same 68-character act_ ID. Generation "1" -> distinct ID. Only explicit authorized safe reconciliation allocates it; no missing reconciliation ref, counter overflow, or generation reset after restore. Schema accepts full IDs/UUID owner refs but rejects invalid compiler node names.
14. **Command replay/CAS:** lost successful commit response + identical command -> same committed result, no duplicate counters/trace/effect. Same command ID with changed payload -> conflict. New command with stale epoch/control/revision -> conflict. Replacement worker cannot use predecessor admission.
15. **Crash windows:** enumerate all ten existing Runtime windows with zero automatic redispatch after possible consumption/send. Durable receipt/verdict recovery fetches owner result without redoing external work. Three no-progress recoveries -> unhealthy hold; heartbeat-only activity never resets semantic inactivity.
16. **Value custody:** canonical typed upload round-trips through AES-GCM with bound AAD; changed organization/binding/revision/behavior fails decryption. Same upload replays; conflicting digest, forged provenance, stale assignment, expired source and oversize envelope reject. Unattached value cannot materialize and expires within five minutes.
17. **Budget races:** cap 100, concurrent requests reserve 60 each -> at most one admitted. Duplicate owner settlement charges once. Unknown 60 remains encumbered after lease/TTL; requested cap with unpriced covered cost -> blocked, not an estimate presented as guarantee.
18. **Stop/containment:** fence commits before a newly attempted consume/dispatch -> new action denied, old admitted request may finish and is reconciled. Stop response exposes pending acknowledgments. Worker/device unreachable cannot imply released local reservation or resolved business effect. High/Critical stop bypasses asynchronous queue.
19. **Restore:** restored relational state cannot revive a canceled schedule/job, old generation, released budget encumbrance, cleared unknown reservation, consumed action or expired value. Missing safety/authority journal coverage -> no scheduler/dispatch/value unwrap. Seven-day/30-day value disposal does not clear uncertain-action exclusions.
20. **Truthful results:** verified successes, expected rejections, known failures, canceled work, handed-off exceptions, approvals and unknowns remain distinct. Canceling an uncertain job may stop dispatch but preserves unknown counters and overlap guard. Completed with Exceptions requires accepted safe handoff/terminal evidence, not merely assigning an owner.

For semantic state-machine/crash/authority vectors, validate complete typed inputs/expected outputs and exercise an independent throwaway reference model of the documented algorithms. State clearly that backend integration/lease/fencing/latency/fault-injection tests remain implementation-conformance requirements, not completed software verification. Do not describe fixture validation as proof of production execution safety or measured SLOs.

## Assumptions & contingencies

- Deliverable is specifications/contracts/fixtures only; no application source, deployment, database migration execution or production certification. User must request software implementation separately.
- Preserve runtime/adapter/verifier ownership. If execution reveals an owner contract changed after planning, reread it, retain stricter safety semantics, and reconcile named fields without reverting user changes. A changed safety/product guarantee that cannot satisfy both authorities requires another design question, never silent scope reduction.
- ADR numbering may advance; allocate next available sequential number as specified above. No other new path is optional.
- Validation dependencies are installed only in an isolated uv environment after execution approval. If downloads are unavailable, locate an already equipped interpreter; never fabricate schema/crypto verification. Run reachable stdlib link/JSON/heading/count/hash/zoneinfo checks and report exactly which dependency-backed checks remain unexecuted.
- User explicitly confirmed the complete shared technical design. Submit this exact plan for execution selection through `xd://propose` using slug `job-orchestration`; no additional conversational design approval is outstanding.
