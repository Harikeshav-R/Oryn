# Control Plane Detailed Specification — Execution Plan

## Context

The user requests fully fleshed-out technical implementation details for `control-plane`, grounded in `PRODUCT.md` and `TECHNICAL.md`, using grilling and domain modeling. Produce an implementation-ready component specification, executable wire contracts, and consistent adjacent documentation; do not implement the backend. The named component is authoritative: current `docs/README.md:48-56` indexes Control Plane ninth, while Local Privacy Storage is fifth.

The repository currently contains specifications and contract schemas, not an implemented control plane. Keep the final status `Detailed technical specification — implementation pending`; document targets and acceptance procedures without claiming deployed services, certified providers, passing application tests, or measured availability.

## Settled design

These choices were selected by the user and must survive execution without reopening them.

| Area | Decision |
|---|---|
| Language/API | Rust; REST/OpenAPI; generated typed clients when application code is built. |
| Framework family | Axum/Tokio/Tower, SQLx, utoipa; domain code independent of HTTP framework. |
| Deployment | Portable Kubernetes, US-only content processing; no AWS/Azure dependency. |
| Process roles | Separate API/BFF, durable-worker, and transient inference-worker processes from one modular Rust workspace. |
| Pilot envelope | 10 organizations; 2,000 enrolled endpoints; 200 active endpoints including long polls; 25 management requests/second excluding polls/streams; 20 concurrent inference sessions. These are proof targets, not product limits. |
| Event fabric | PostgreSQL durable queues; transactional outbox/inbox; no separate broker. LISTEN/NOTIFY provides hints only. |
| Delivery ordering | FIFO per organization/aggregate/consumer. Exhausted deliveries block only that aggregate for that consumer. Security restrictions use priority propagation and canonical authority checks. |
| Management updates | Authorized cursor-based bounded long polling. Existing sync wait remains 25 seconds. |
| Inference transport | HTTPS for bounded requests; WebSocket for live audio/results. Disconnect or owner loss terminates the stream; no resumption or content replay. |
| Live authority | Renewable bounded policy grant plus Privacy Helper-signed chunk proofs, with exact sequence/sample/hash/consent bindings. Renew within five minutes; use shorter accounting quanta below. |
| Budgets | Explicit organization monthly cap plus purpose caps; no per-user tier. Unknown usage retains its reservation until verified reconciliation. |
| Web session | One stable opaque HttpOnly BFF session cookie, not a browser access/refresh pair. One active organization across browser tabs. |
| General mutation replay | Seven days of sanitized response replay; compact tombstones under applicable audit retention; reject expired reused keys. Credentials, inference content, and sync/action domain fences have separate rules. |
| Audit | Meaningful domain changes and security decisions/rejections; no routine polling, heartbeats, or internal bookkeeping. Metadata/references only. |
| Service targets | 99.9% availability; ordinary reads p95 ≤250 ms; committed command acknowledgments p95 ≤500 ms at admitted pilot load. Preserve Identity's authorization/consume p95 ≤100 ms and stricter operation-specific limits. |
| Site-loss recovery | Ordinary canonical data RPO ≤15 minutes, RTO ≤4 hours. Acknowledged authority remains non-rollback and fail-closed through its independent journal. |
| Sync recovery | Extend the independent journal with minimal sync custody identities/dispositions. Acknowledge custody changes after checkpoint; no contributor identity, content, images, or private evidence IDs in custody projections. |

## Approach

Execute the following behavior groups in order. The documentation and schemas are the deliverable; do not create application packages, database migrations, deployment charts, installed services, or production test scaffolding.

### 1. Establish the transport/authority boundary and browser session protocol

Promote `docs/components/control-plane.md` from baseline brief to a detailed specification. Preserve exactly its twelve existing top-level headings, in existing order:

1. Purpose and ownership
2. Product requirements
3. Upstream and downstream contracts
4. Trust and deployment boundaries
5. Internal architecture
6. State and lifecycle
7. Error and edge-case behavior
8. Observability and audit
9. Security and threat model
10. Test strategy
11. Performance and operations
12. Architecture decisions and open questions

Populate these headings with the concrete design below rather than appending an unrelated second specification. Consolidate the duplicate `Does Not Own` subsections. Remove resolved open questions; the last heading records resolved decisions and explicit owner-owned implementation prerequisites, not unspecified Control Plane choices.

#### Ownership and internal interfaces

Specify modules `HttpIngress`, `SessionTransport`, `CommandDispatcher`, `TenantTransaction`, `OperationRegistry`, `DomainDelivery`, `ChangeFeed`, `AuditWriter`, `InferenceAdmission`, and `InferenceSessionCoordinator`.

- Control Plane owns HTTP transport, physical session-secret digests, command transport/idempotency, transaction coordination, durable delivery machinery, authorized change feeds, and inference admission/session mechanics.
- Identity Policy owns admission, verified principals, authorization, roles, MFA, approval decisions, policy configuration, and signatures with authority semantics.
- Domain owners own business state transitions and canonical records. The generic dispatcher must not become a universal business command endpoint or a second authorization engine.
- Graph owns published knowledge; Orchestrator owns jobs/cases; Release Governance owns release eligibility; Verification owns business verdicts; Command Center owns notification presentation/delivery preferences; Infrastructure owns certificates, Vault, PostgreSQL operation, immutable storage, and independent-journal operation.

Document the following planned Rust interfaces, including the associated types rather than accepting arbitrary JSON:

```rust
pub struct RequestContext {
    pub request_id: Uuid,
    pub trace_id: TraceId,
    pub principal: VerifiedPrincipal,
    pub deadline: MonotonicDeadline,
}

pub trait DomainCommand: Send {
    type Response: Send;
    const NAME: &'static str;
    const SCHEMA_ID: &'static str;
    fn resource_key(&self) -> ResourceKey;
    fn expected_revision(&self) -> Option<Revision>;
}

pub trait CommandHandler<C: DomainCommand>: Send + Sync {
    fn handle<'a>(
        &'a self,
        tx: &'a mut TenantTransaction,
        context: &'a RequestContext,
        command: C,
    ) -> impl Future<Output = Result<C::Response, DomainError>> + Send + 'a;
}
```

`VerifiedPrincipal` is constructed exclusively by Identity Policy. Its closed variants are `BootstrapPerson`, `WebMember`, `DesktopMember`, `ChildPrincipal`, and `WorkloadPrincipal`; expose only authenticated person/session/organization/actor/device/profile/workload, environment, audience, scope, and assurance bindings appropriate to each variant. Constructors and arbitrary context-variable setters are not public. Do not accept actor roles, risk tiers, tenant identity, or worker privileges from request JSON.

Define `TenantTransaction` as a private wrapper around one SQLx PostgreSQL transaction plus a verified organization/principal context; handlers cannot obtain an unscoped pool or independently commit it. Define `Revision` as the existing decimal-string unsigned 64-bit wire convention with numeric database storage. `ResourceKey` contains `organization_id`, `resource_type`, and `resource_id`. `DomainError` projects to the closed error vocabulary below. `TraceId` is the W3C 16-byte trace identity; `MonotonicDeadline` is a process-local monotonic deadline derived from a bounded server timeout. These are specification interfaces, not requests to write production Rust files.

Reuse `evaluate_authorization` exactly as specified in `docs/components/identity-policy.md:340-364`; do not change its signature or evaluation order.

#### Ingress ordering and errors

Specify execution order explicitly: trusted proxy/TLS metadata → request/trace identity → header/body declared-size admission → coarse abuse limit → credential authentication → live session/organization/recovery checks → browser Origin/CSRF checks where applicable → schema decoding and bounded streaming validation → object/operation authorization → tenant transaction/idempotency → owner handler → atomic audit/outbox → commit → required independent checkpoint → response.

- `X-Request-ID` is a UUIDv4, generated server-side when absent; malformed supplied values are rejected. Echo it without treating it as authority.
- Reject simultaneous cookie and bearer authentication; do not select whichever is more privileged.
- Same-origin web API only. `ORYN_PUBLIC_ORIGIN` is a single configured HTTPS origin. No wildcard CORS and no credentialed cross-origin browser API.
- Browser unsafe requests require exact Origin plus `X-CSRF-Token`. Native bearer/mTLS routes do not require browser Origin but cannot bypass their audience or device/workload proof requirements.
- Standard JSON bodies ≤256 KiB, headers ≤16 KiB, URI ≤4 KiB. Sync multipart has its separate 5 MiB total cap. Inference follows its separately reserved route-certified body cap.
- Generic request deadline 10 seconds, database transaction deadline 1 second, signer deadline 500 ms. Long polls and active inference use their separate deadlines. A timeout after an uncertain commit is not proof of rejection.
- Enforce both declared Content-Length and actual streamed byte count. Reject unsupported content encodings rather than admitting compressed bombs.

Create `ControlPlaneProblemV1`, `schema_id:"control-plane.problem.v1"`, using RFC problem fields plus `code`, `request_id`, `retry_safety`, nullable `retry_after_seconds`, and nullable `operation_id`. `retry_safety` is `never|status_only|idempotent_replay`. Problems contain safe field paths, not rejected content, SQL, prompts, bearer values, or unauthorized object details.

Use these exact general codes/statuses:

| Status | Code |
|---|---|
| 400 | `CP_SCHEMA_INVALID`, `CP_CREDENTIAL_CONFLICT`, `CP_CURSOR_INVALID` |
| 401 | `CP_AUTH_REQUIRED`, `CP_SESSION_LOCKED` |
| 403 | `CP_ACCESS_DENIED`, `CP_CSRF_INVALID`, `CP_SCOPE_CHANGED` |
| 404 | `CP_RESOURCE_NOT_FOUND` |
| 409 | `CP_REVISION_CONFLICT`, `CP_IDEMPOTENCY_CONFLICT`, `CP_RESYNC_REQUIRED` |
| 410 | `CP_IDEMPOTENCY_EXPIRED`, `CP_OPERATION_EXPIRED` |
| 413 | `CP_PAYLOAD_TOO_LARGE` |
| 428 | `CP_PRECONDITION_REQUIRED` |
| 429 | `CP_RATE_LIMITED` |
| 503 | `CP_DEPENDENCY_UNAVAILABLE`, `CP_DELIVERY_UNKNOWN`, `CP_RECOVERY_REQUIRED` |

Preserve Identity, Sync, and Inference's existing exact error namespaces on their own routes. They do not get silently translated into `CP_*` aliases. Explicit caller-supplied organization mismatch returns 403; opaque object identifiers return the same 404 for absent and out-of-scope objects.

#### Native and browser authentication

Preserve the accepted native flow: external browser and Auth0 public-client PKCE redemption occur in Desktop SessionBroker; native then submits existing `SessionExchangeV1` broker-token fields to Oryn. Keep the exact loopback callback pool `http://127.0.0.1:49152..49183/callback`. Remove `code_verifier` from the misleading token-exchange diagram; do not add a native code-relay topology.

Specify a separate confidential web BFF flow:

- `POST /v1/session/login` accepts `WebLoginStartV1 {schema_id:"control-plane.web-login-start.v1", request_id:UUIDv4, purpose:login|step_up|link_subject, organization_id:OrganizationId|null, return_path:string}`.
- BFF generates state, nonce, and PKCE verifier. Return paths are same-origin absolute paths, at most 256 characters, with no `//` prefix, `..` component, encoded path separators, query, fragment, or external URL.
- Persist only state/nonce digests plus the five-minute transaction binding. Store the needed web verifier encrypted using an Infrastructure-provided Vault encryption key; its plaintext exists only during redemption. Delete verifier ciphertext when consumed/expired. Session secret digest-only storage does not mean a PKCE verifier can be replaced by its hash.
- Set a five-minute `__Host-oryn_login` HttpOnly/Secure/SameSite=Lax/Path=/ transaction-binding cookie.
- `GET /v1/identity/auth0/callback` validates exact registered callback, transaction cookie, state, nonce, issuer/audience/signature, configured connection, purpose/session binding, and single use; redeem confidentially server-side. Discard Auth0 tokens after validation.
- Browser never receives `SessionCredentialsV1`, Auth0 tokens, Oryn access/refresh secrets, or native child credentials as JSON.
- Successful web admission sets `__Host-oryn_session`: 256-bit opaque random secret, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no Domain, bounded by original absolute deadline ≤12 hours. It selects one BFF session, not a transferable organization grant.
- `GET /v1/session` returns `WebSessionPresentationV1 {schema_id:"control-plane.web-session.v1", request_id, session_id, organization_id:null|OrganizationId, actor_id:null|Identifier, state:bootstrap|active|locked, csrf_token:Secret, absolute_not_after:Utc, mfa_completed_at:Utc|null}` with `Cache-Control:no-store`. CSRF is a distinct 256-bit secret; persist only its digest and keep its browser copy in memory.
- `POST /v1/session/activity` updates one `last_human_activity_at` field only when the trusted foreground UI reports a recent actual interaction; coalesce to one update/minute. Polling, streaming, model work, and refresh do not reset inactivity. Keep no activity history and produce no activity analytics. State the intact-renderer assumption; this is not cryptographic proof of human presence.
- At 30 minutes' inactivity, privileged operations fail with `CP_SESSION_LOCKED`. Unlock uses a purpose-bound Auth0 reauthentication flow and does not extend the existing absolute deadline. At absolute expiry require a new login.
- On organization selection/switch, use existing `OrganizationSelectionV1` and route `/v1/identity/sessions/select-organization`; Identity rechecks live membership and connection policy. Replace browser session scope and CSRF, terminate old change subscriptions, and return `CP_SCOPE_CHANGED` for old-tab bindings. Require `X-Oryn-Session-ID` on authenticated browser requests so a stale tab cannot mutate the newly selected organization accidentally.
- On step-up, preserve the session's original absolute deadline and verified subject. Rotate CSRF; do not treat refresh or a second credential as MFA.
- Logout uses `/v1/identity/sessions/logout`, revokes family before acknowledgment, and clears both cookies locally regardless of response loss.
- Native refresh remains atomic, strict, and non-recoverable by secret-response replay. Retain spent refresh digests to family expiry. Serialize native refresh; ambiguous success requires fresh login. Generic idempotency storage must never hold credential responses.

Global bootstrap person sessions have a five-minute absolute deadline and only own-membership listing, selection, invitation acceptance, restricted organization creation, linking, or logout routes. They have no tenant business/sync/inference/capture/execute authority. Global person mapping uses a narrow authentication adapter, never a tenant-query bypass exposed to handlers. Couple `SessionCredentialsV1.organization_id` and `actor_id`: both null or both non-null.

Document planned physical tables `cp_login_transaction`, `cp_session`, `cp_credential_digest`, and `cp_csrf_digest`, with explicit SQL types, keys, expiry indexes, and purge rules:

- Login transaction: transaction/request IDs, client kind, purpose, nullable organization and bound prior session/person, callback/return path, state/nonce digests, encrypted web verifier, code challenge, configured broker issuer/client, expiry/consumption times.
- Session: session/person/family IDs, client kind, paired nullable organization/actor, nullable device/profile, verified subject binding, original absolute deadline, current single activity timestamp, MFA time, state/revocation, recovery epoch.
- Credential: digest, kind (`web_session|desktop_access|desktop_refresh|child_access`), session/family/generation, audience/scope/context bindings when applicable, issue/expiry/spent/revoked times.
- CSRF: session, digest, generation, issue/expiry. No CSRF plaintext or recoverable bearer response.

Tenant session rows enforce RLS. Bootstrap/global rows are accessible only through the authentication adapter's separately scoped database role. Never journal session digests or restore live sessions from backup.

### 2. Define owner transactions, idempotency, operations, and durable domain delivery

Reuse the existing PostgreSQL persistence boundary and `domain_outbox`/`domain_inbox` in `docs/components/contribution-sync.md:993-1009`. Extend those contracts in place; do not define competing tables with different semantics.

#### Tenant isolation and transaction composition

- Ordinary owner commands run `READ COMMITTED` inside a single transaction. Set transaction-local `oryn.organization_id`, `oryn.actor_id`, `oryn.principal_kind`, and `oryn.recovery_epoch` using bound `set_config(..., true)` calls after verified principal construction.
- All tenant tables use `ENABLE` and `FORCE ROW LEVEL SECURITY`. Tenant application roles are neither owners, superusers, nor `BYPASSRLS`. Missing/invalid context denies reads/writes.
- Migration ownership is a different credential. The runtime cannot mint it or call unrestricted SECURITY DEFINER functions. Global authentication and delivery scheduling adapters expose narrow fixed operations only.
- Reset transaction state through commit/rollback and verify pool reuse across organizations. No session-scoped tenant settings or pooled cross-tenant state.
- Acquire authority guards in established sorted `(organization_id, guard_kind, guard_id)` order; reads/consume use `FOR SHARE`, restrictions use `FOR UPDATE`. Acquire aggregate serialization locks after authority guards, then resource rows; all paths use that order.
- Within one database transaction, call each owning module through typed handlers using the shared transaction. For long-running work, persist an owner command/reference and return an Operation, rather than holding locks through inference/network work.
- Do not add 2PC, a generic saga engine, or a second job state machine. External effects stay with their owners and remain potentially unknown.

#### Mutation replay and concurrency

Define `Idempotency-Key` for new general commands as UUIDv7. Sync keeps its existing domain-specific key contract; Identity credential operations remain excluded.

- Scope a key to `(organization_id, authenticated principal binding, canonical method, canonical path, key)`.
- Hash the validated canonical request with RFC 8785; include the required expected revision and intended resource identity. Do not hash headers whose values are incidental trace data.
- First use must have a UUIDv7 timestamp within the last 24 hours and no more than five seconds in the future. Existing retained records replay within their seven-day window even when older than 24 hours.
- Under live authorization, atomically lock/insert the key, compare digest, execute owner mutation, and store sanitized status/headers/body plus audit/outbox in the same commit. First request must not leave a durable `in_progress` row without its associated operation.
- Matching duplicate returns original committed result after current access checks. Different digest returns 409 `CP_IDEMPOTENCY_CONFLICT`. Completed-but-expired record returns 410 `CP_IDEMPOTENCY_EXPIRED` with `retry_safety:status_only`.
- Retain compact key/digest/resource/outcome tombstones for the approved audit schedule, default 24 months. UUIDv7 timestamp rejection prevents an ancient deleted key from becoming a new command after tombstone pruning.
- On restore, reject missing keys whose UUIDv7 timestamp precedes `recovery_admission_floor` with `CP_RECOVERY_REQUIRED`; never execute them again. Set that floor to trusted UTC at reopening plus five-second clock-skew allowance; reject new commands until it is reached. Retained results reconcile after current authorization. This fence also applies to fresh sessions replaying old keys, without journaling ordinary bodies or reapplying lost canonical state.
- Require `If-Match` for revisioned updates; missing →428, drift →409. Creation uses stable caller-provided object ID or owner natural-key uniqueness. A fresh idempotency key never bypasses a domain action fence.
- Never replay credential issuance/refresh, signed live authorization content, private inference results, or an external business action through this mechanism.

Specify `cp_idempotency` with composite key/digest, resource identity, committed response, response expiry, tombstone expiry, outcome, and recovery epoch; redact response projections at construction rather than logging then filtering.

#### Asynchronous operations

Create `OperationV1`, `schema_id:"control-plane.operation.v1"`, with `operation_id`, organization, owning module, initiator reference, closed resource reference, `state:accepted|running|waiting_for_review|succeeded|failed|cancelled|outcome_unknown`, created/updated timestamps, revision, nullable progress `{completed,total}`, nullable safe problem, nullable result reference, and `cancel_requested:boolean`.

- An Operation is a transport/progress projection, not authority, job completion, or verification.
- Slow owner work returns HTTP 202 plus `Location:/v1/operations/{operation_id}` only after durable acceptance. `GET /v1/operations/{operation_id}` is access-filtered. `POST /v1/operations/{operation_id}/cancellation` records an owner request; it does not promise undo.
- Owner completion and operation projection update atomically when colocated; otherwise duplicate-safe events update the projection. Missing source progress is unknown, not fabricated percentages. Keep terminal operations 30 days; associated consequential audit follows its own schedule.
- State transitions: accepted→running/cancelled/failed; running↔waiting_for_review; running/waiting→succeeded/failed/cancelled/outcome_unknown. Terminal states never return to running under the same operation ID. A late completion after accepted cancellation requires owner reconciliation and cannot overwrite a terminal result blindly.

Specify `cp_operation` as transport metadata with canonical owner/resource reference and revision. No private input bodies or duplicated agent/job business records.

#### Queue/outbox/inbox protocol

Create closed `DomainEventV1`, `schema_id:"control-plane.domain-event.v1"`: `event_id`, `organization_id`, `event_type`, `aggregate_type`, `aggregate_id`, `aggregate_revision`, `occurred_at`, `causation_id`, `correlation_id`, `schema_revision`, `sensitivity:shared_procedural|operational_audit`, and a closed event-specific reference payload. Never include raw content or a generic arbitrary JSON payload in newly specified events.

Register these initial event names: `contribution.accepted`, `workflow.published`, `job.requested`, `job.case_state_changed`, `job.completed`, `incident.created`, `policy.changed`, `access.revoked`, and `operation.changed`. Each payload contains the corresponding resource ID/version/reference and safe state label only. Domain owners retain their event-specific canonical records and eligibility checks.

- `domain_outbox` remains the immutable committed event source. Add aggregate identity/revision, schema reference, causation/correlation, fanout state, and retention fields. Preserve `(organization_id,event_id)` identity.
- Introduce `domain_delivery` per `(organization_id,event_id,consumer)` with aggregate key/revision, `state:pending|leased|retry_wait|succeeded|quarantined`, lease owner/token/deadline, attempt count, `available_at`, and safe error code. Index pending availability and per-aggregate predecessor lookup.
- Fanout claims committed unpublished rows with `FOR UPDATE SKIP LOCKED`, inserts delivery rows idempotently, then marks fanout complete in the same transaction. Existing `published_at` means durable local fanout complete, not remote business completion.
- Consumers can claim only the earliest incomplete aggregate revision for their consumer. Use a 30-second lease, renew every 10 seconds, and require the matching lease token for completion. A worker losing lease cannot commit stale completion.
- For local consumer mutations, insert `domain_inbox` dedup row, invoke owner mutation, and acknowledge delivery in one transaction. Rollback preserves retryability. No external I/O while holding this transaction.
- External/AI work uses a durable owner operation/intention, releases transaction, then invokes governed services. A lease retry cannot redispatch an ambiguous external effect or private inference input.
- Retry at most eight times with full jitter `uniform(0,min(300s,1s*2^attempt))`; then quarantine and alert the owning module. Its later aggregate events remain blocked for that consumer. Other aggregates/consumers continue.
- Quarantine recovery requires authorized repair/retry, audited with reason; no generic skip that discards a missing predecessor. Safety revocations are not dependent on these ordinary queues.
- Retain pending/quarantined rows until resolution or explicit organization deletion; do not expire undelivered work silently. Retain delivered ordinary events and dedup records seven days after all consumers acknowledge; consequential audit has its separate 24-month schedule. Manual replay outside dedup retention is forbidden; rebuild projections from canonical owner snapshots instead.
- Periodically scan every 250 ms for safety changes and every second for ordinary work, even without notifications. LISTEN setup commits first, then initial queue scan; reconnect repeats this sequence. NOTIFY carries an opaque wake token only.
- Fair scheduling rotates ready organizations and caps one tenant at four concurrently leased ordinary deliveries; total eight ordinary deliveries per worker. Add an independent capacity reservation for revocations/journal completion so ordinary backlog cannot starve safety.

#### Management changes

`GET /v1/changes?cursor={cursor}&wait_seconds=25&limit=100` returns `ChangePageV1`, `schema_id:"control-plane.change-page.v1"`: epoch, ordered entries, next cursor, high-water sequence, `has_more`, and server time. Limit may be 1–500, but a page remains ≤1 MiB.

- Management changes are authorized resource invalidations/status references, not a raw domain-event subscription or a grant to fetch the object.
- Keep a seven-day metadata change log. Allocate per-organization committed sequences under a locked counter; rolled-back transactions do not expose cursor gaps or out-of-order commit holes.
- Cursor payload binds organization, actor, session, access revision, recovery epoch, feed kind, scan high-water, last sequence, and expiry. Use a policy-purpose signed cursor envelope encoded opaquely; Identity supplies bounded signing, not private keys. TTL ≤15 minutes and session expiry. Reject wrong feed/principal/epoch/expiry; access revision change requires a new authorized snapshot.
- Paginated snapshots freeze their high-water for consistency and apply current authorization on every page. Access changes invalidate the snapshot rather than leaking stale entries.
- Empty long polls return heartbeat pages at 25 seconds. Release database transactions/connections while waiting. Server restarts or notification loss cannot lose durable entries.
- Expired/pruned cursor →409 `CP_RESYNC_REQUIRED`; malformed/tampered cursor →400 `CP_CURSOR_INVALID`. Client must obtain a fresh owner-filtered snapshot, not start at an arbitrary supplied sequence.
- `policy.changed`/`access.revoked` wake connected polls within the inherited two-second target. A renewed response checks current session/access before returning any references. Existing sync control epochs, signatures, 500 ms local acknowledgment barrier, and reconnection ordering remain authoritative.

### 3. Reconcile sync acceptance, pruning, and disaster-safe custody

Use the exact routes in `docs/components/contribution-sync.md:120-129`, not the stale Control Plane brief:

- `POST /v1/sync/bootstrap`
- `GET /v1/sync/changes?cursor={c}&wait_seconds=25`
- `POST /v1/sync/submissions`
- `GET /v1/sync/submissions/{id}/revisions/{rev}`
- `POST /v1/sync/submissions/{id}/revisions/{rev}/withdrawals`
- `GET /v1/sync/guidance/manifest?cursor={c}`
- `GET /v1/sync/guidance/bundles/{sha256}`
- `POST /v1/sync/guidance/lease`

Preserve existing review-key challenge and registration routes. Reconcile their scope discrepancy by using published Identity's `device:enroll`; amend Sync's stale `device:register_review_key` text. Do not introduce a new capability or a compatibility alias.

#### Atomic create/replay algorithm

Repair `docs/components/contribution-sync.md:1012-1032` and mirror the protocol in Control Plane:

1. Authenticate, validate audience/current membership/device/key/policy, strict schema, review/release signatures, and PNG bounds. Max total multipart body 5 MiB; max four 8-bit PNGs, each ≤1 MiB and ≤1920×1080; bounded decode and IHDR/IDAT/IEND-only chunks. Handoffs have empty artifacts and no private meeting identifiers.
2. Begin `READ COMMITTED`; lock existing authority guards in prescribed sorted order and recheck current authority.
3. Insert minimal accepted identity using `INSERT ... ON CONFLICT DO NOTHING RETURNING ...`. The insertion is part of this still-uncommitted acceptance transaction. Record whether this transaction actually inserted it. Then lock the canonical row `FOR UPDATE`. Unique insertion waits serialize the missing-row race; do not invent a visible reservation disposition or insert the identity twice.
4. For an existing terminal identity, return 410 `SYNC_RELEASE_CANCELLED`; for existing accepted differing digest, 409 `SYNC_DIGEST_CONFLICT`; for an existing matching accepted identity with retained receipt, 200 with exact original receipt. Validate current caller access before replay.
5. For a newly inserted identity only, insert destination-owned intake, bounded artifacts into existing `sync_artifact`, original signed receipt, audit as applicable, committed event, and minimal recovery-journal outbox entry in this single transaction. Return first-acceptance HTTP 201 only after commit and custody checkpoint.
6. Sign receipt with the existing Vault receipt-purpose signing port under 500 ms timeout. Do not export the key. Failure before commit rolls back every row.
7. Journal append/checkpoint happens after commit; no SQL transaction remains open during the independent append. Checkpoint failure returns an explicitly unknown/reconcile response, not a second acceptance. Consumers cannot use intake behind a pending custody durability guard.
8. On exact replay, pending checkpoint is reconciled idempotently before releasing a durable receipt. Downstream synthesis always rechecks live eligibility under lock.

Make `sync_submission_identity` exactly the five lifetime fields allowed by ADR-0010: organization, contribution UUID, revision, digest, disposition. Remove lifetime actor/time history; keep operational timestamps only in their separately expiring receipt/intake/custody metadata. Define lifetime ledger ownership as central Control Plane, not the local transport bookkeeping ledger.

Define the existing sync `Idempotency-Key` deterministically as lowercase hex SHA-256 over UTF-8 `sync.submission.v1\n` followed by RFC8785 JCS of `{organization_id,contribution_id,revision,content_digest}`. Compare it to the parsed envelope. Matching relational identity is still the durable authority; wrong header fails with existing `SYNC_DIGEST_CONFLICT`. This does not change contribution content-digest rules or grant a second replay store.

#### Pruning and truthful status

- Retain original signed delivery receipts for the approved consequential/audit schedule, default 24 months, separate from intake/artifact expiration. Artifacts retain existing signed-policy deadlines, never this receipt lifetime.
- After receipt pruning, matching identity remains terminal. `POST /submissions` returns 200 `SubmissionStatusV1` with nullable receipt rather than recreating intake or returning a fabricated original receipt. Update OpenAPI's success union and sync clients' documented handling together.
- Extend signed status payload with `content_state:available|pruned|lost_after_restore|not_applicable`, requiring it on every status. Preserve existing disposition literals. `accepted` means custody historically accepted; it does not claim currently available content or publication.
- `accepted` with missing restored payload uses `lost_after_restore`; receipt may be null. Surface data loss. Do not regenerate a receipt with a new acceptance time, re-upload old private input, restart synthesis, or claim publication. Any replacement contribution needs a new explicit employee review and new identity.
- A withdrawn/expired disposition cannot transition back to accepted. Withdrawal and acceptance serialize on the same identity, including a metadata-only tombstone when a withdrawal reaches a not-yet-inserted row. Its verified closure digest supplies the missing identity digest.
- Unpublished withdrawal immediately excludes intake and invalidates dependent drafts. Published derivatives follow Graph's governed removal review. Legal hold cannot restore synthesis eligibility.

Map HTTP sync errors from the existing `SyncProblemV1` enum, not the obsolete brief's invented literals: schema→400 `SYNC_SCHEMA_UNSUPPORTED`; digest conflict→409 `SYNC_DIGEST_CONFLICT`; authentication→401 `SYNC_AUTH_REQUIRED`; authorization→403 `SYNC_ACCESS_DENIED`; stale policy→403 `SYNC_POLICY_STALE`; bad/untrusted review→403 `SYNC_REVIEW_INVALID`/`SYNC_KEY_UNTRUSTED`; payload→413 `SYNC_PAYLOAD_TOO_LARGE`; artifact→400 `SYNC_ARTIFACT_INVALID`; missing artifact policy→403 `SYNC_ARTIFACT_POLICY_REQUIRED`; overload→429 `SYNC_RETRY_PAUSED`; ambiguous committed delivery→503 `SYNC_DELIVERY_UNKNOWN`; cursor rebuild→409 `SYNC_RESYNC_REQUIRED`. Do not expose certificate/SPKI failures as HTTP responses received over an untrusted connection.

Correct Contract numbering: 2 workflow contributions; 3 guidance distribution; 18 authorized management projections; 20 local HUD presentation only; 22 inference; 24 reviewed meeting handoffs.

### 4. Specify transient inference admission, stream proofs, and budget accounting

Keep all operations and eleven error literals in `docs/architecture/cloud-inference.md:74-242` unchanged. All model traffic goes through managed LiteLLM, pinned US/ZDR/no-training routes; no provider URLs, provider keys, local models, silent fallback, arbitrary provider parameters, or body logging.

Create `docs/architecture/contracts/cloud-inference-v1.schema.json`, `$id:"urn:oryn:schemas:cloud-inference:v1"`, Draft 2020-12. Identity continues owning signed policy/privacy authorization definitions; the new file owns request/manifest/stream/event/result/budget-transport contracts and references existing primitives. No equivalent complete request/stream schema currently exists in the contract inventory.

#### Exact bindings

Extend existing `InferenceAuthorizationPayloadV1` in `identity-policy-v1.schema.json` with required:

- `request_id:UUIDv4`
- `policy_revision:U64`
- `access_revision:U64`
- `privacy_context_sha256:Sha256Hex|null`
- `input_binding:InputBindingV1` referenced from the new inference schema.

`InputBindingV1` is a closed tagged union:

- `kind:"batch"`: `{input_scope_sha256, input_manifest_sha256}`.
- `kind:"stream"`: `{stream_scope_sha256, stream_id:UUIDv4, stream_epoch:UUIDv4}`.

Employees require non-null device/profile, null workload, and non-null privacy-context digest. Workloads require a registered workload ID, null device/profile/privacy digest, and fixed purpose/operation permissions. Workload input binding still covers actual authorized organizational input; no fabricated employee proof.

Hash linkage uses lowercase SHA-256 of exact RFC8785 canonical bytes. `privacy_context_sha256` hashes the entire signed privacy envelope, not merely its payload. Require equality of authenticated principal, token, request, purpose/operation, request ID, policy/access/input/deletion revisions, and applicable scope/manifest hashes. Bind consent/notice through the signed local proof and current helper enforcement; historical signatures alone cannot establish freshness.

`InputManifestV1` is an ordered list of closed entries `{part_id:Identifier, media_type:text/plain|application/json|image/png|audio/ogg|audio/wav|audio/pcm, byte_length:U64, sha256:Sha256Hex, sample_start:U64|null, sample_end:U64|null}`. `sample_*` appear together only for audio. Define UTF-8 text bytes, RFC8785 JSON bytes, and exact encoded binary bytes; sort by explicitly declared part order, reject duplicate part IDs and overlapping unauthorized audio ranges. Hash each part and the canonical manifest; do not reinterpret multipart framing as content bytes. `InputScopeV1` contains only transient purpose/source-range authorization references and revisions; it is signed/verified in RAM and never copied to durable metadata.

`InputScopeV1` is a closed batch object `{purpose:Identifier, sources:SourceScopeV1[1..128]}`. Each source is `{part_id:Identifier, source_kind:screen|meeting|organizational_artifact, source_ref:Identifier, source_revision:U64, acquired_at:Utc, expires_at:Utc, retention_mode:ephemeral|retained}`. These source references remain RAM-only. Part IDs exactly cover the manifest. Ephemeral screen expiry is ≤acquisition+30s and applicable current source deadlines. For stream opening proofs, `input_scope_sha256=SHA256(JCS(StreamScopeV1))` and `input_manifest_sha256=SHA256(JCS([]))`; future bytes require the bounded stream scope and fresh chunk proofs, never authority inferred from the empty manifest.

Define `InferenceAuthorizationRequestV1` as `{schema_id:"inference.authorization-request.v1", request_id:UUIDv4, purpose:Identifier, operation:InferenceOperation, input_revision:U64, deletion_generation:U64, input_binding:InputBindingV1, privacy_context:SignedPrivacyAuthorizationContextV1|null, input_scope:InputScopeV1|null, input_manifest:InputManifestV1|null, stream_scope:StreamScopeV1|null, output_schema_id:Identifier}`. Batch requires scope/manifest and null stream scope; stream requires stream scope and null batch fields. Workloads use authorized organizational artifacts only. Server policy selects route/pricing.

Define `InferenceAdmissionResultV1` as `{schema_id:"inference.admission-result.v1", request_id, authorization:SignedInferenceAuthorizationV1, session_handle:Secret, not_after:Utc}`. The handle is random256-bit, digest-bound to principal/worker metadata, not a signed grant or URL secret. Define `InferenceRequestV1` with existing envelope names `request_id`, `authorization_ref`, `operation`, `route_id`, `route_revision`, `schema_id` (registered output schema), `input_revision`, `deletion_generation`, and `input_manifest`. Its `content` is a bounded closed union of manifest-keyed UTF-8 text parts, canonical JSON UTF-8 strings, or authenticated multipart binary parts. Validate JSON strings against the server-registered purpose input schema; no arbitrary provider-parameter object. Manifest≤128 entries; actual payload uses the route byte cap.

Fresh privacy proof TTL ≤5 seconds; policy authorization TTL ≤5 minutes, clamped by source/key/session/route deadlines; HUD retains its five-second execution and acquisition-based volatile deadlines. Rechecking source eligibility before every edge transmission remains Privacy Helper's responsibility.

#### Routes and lifecycle

Document these exact client routes:

| Route | Behavior |
|---|---|
| `POST /v1/inference/authorizations` | Bounded metadata/proof admission; reserve budget then delegate signing to Identity. Returns signed grant and opaque owner-bound handle; no content persistence. |
| `POST /v1/inference/requests` | Consume a batch grant once; stream-validate body; synchronous bounded `InferenceResult`. Never store result for replay. |
| `GET /v1/inference/streams/{stream_id}` | WebSocket upgrade, subprotocol `oryn.inference.v1`; initial metadata-only authentication/grant validation before any binary payload. |
| `POST /v1/inference/streams/{stream_id}/renewals` | New bounded grant for same healthy stream, exact pinned route and continuing sequence; no reconnect/resume. |
| `POST /v1/inference/requests/{request_id}/cancellation` | Idempotent cancellation and metadata-only cancellation receipt. |
| `GET /v1/inference/routes/{operation}` | Certified availability/limits only, never provider URL or credentials. |

Employee inference uses Identity child tokens with audience `inference`; add this literal cleanly to the existing child-token schema, identity transport, Desktop SessionBroker/HUD/Privacy Helper documentation and relevant diagrams. It permits only inference-purpose scopes, never execution/admin/sync authority. Existing `inference-admission` remains the signed grant's audience, not the Oryn child-token audience. Workloads authenticate using scoped mTLS principals. Browser management sessions do not upload private captures.

Inference-audience child scopes are exactly `inference:authorize`, `inference:submit`, `inference:cancel`, `inference:read_route`; `execution_context` is null. Issuance needs current enrolled employee/device/profile and purpose policy, or separately registered workload authority. These transport scopes do not add business roles or alter the fixed CapabilityId matrix.

At request admission reserve memory and concurrency before consuming payload bytes. Proxy/body logging, request buffering to disk, response caching, dumps, swap, analytics callbacks, and arbitrary headers/parameters are disabled on this path. API/BFF may route metadata but private body termination and parsing occur only in the inference pool and hardened proxy. No durable worker queue receives body bytes, hashes of private scopes, prompts, results, or private stream event payloads.

Define in-memory session states `created→admitted→active→completed|failed|cancelled|expired`; terminal CAS prevents late results from reopening a request. Durable metadata records only request/authorization/reservation IDs, organization/purpose/route/policy references, counters, owner instance, and outcome; no input manifest/scope or private source IDs.

WebSocket affinity uses the random session handle's SHA-256 lookup to an authenticated inference owner over mTLS. Send it only in `X-Inference-Session`, never URL/query/subprotocol logs. Batch sends its signed grant in `X-Inference-Authorization` (base64url JCS envelope) alongside its bearer child credential; WebSocket sends the grant in the initial bounded control message. Reject a wrong/missing/dead owner rather than reassigning. Pod/socket loss ends the provider stream and invalidates the handle. No sticky-load-balancer cookie or handle alone grants inference authority.

`InferenceEventV1` has request/stream IDs, epoch, U64 sequence, event type, input/deletion revisions, and closed event payload. Types: `session.started`, `transcript.partial`, `transcript.final`, `output.delta`, `usage.updated`, `gap`, `session.completed`, `session.failed`, `session.cancelled`. Content-bearing payloads exist only in RAM/socket transit. Emit exactly one terminal event when connection survives; abrupt loss is observed as interruption, not successful completion. No reconnection replay buffer. `SubscribeInference` attaches only to the active owner connection; an old `afterSequence`, gap, or epoch mismatch fails closed rather than promising unavailable replay.

Root event request_id remains the opening request. Renewal uses a fresh authorization request UUID/reservation while retaining stream ID/epoch/track sequence. Chunk proof request_id matches its current grant, not the expired opening grant. Include current authorization_id in event metadata; root IDs never permit grant substitution.

Use WebSocket ping every 10 seconds; terminate after 20 seconds without peer liveness. Require audio to progress or explicit authorized no-audio heartbeat within 5 seconds. Bound incoming/outgoing queues to 64 messages/256 KiB each and live audio backlog to one second per track; stop with explicit gap on pressure, never accumulate a shadow backlog. Declared control frames ≤16 KiB; signed audio header ≤4 KiB; binary audio chunk ≤3,200 PCM bytes per track for the existing 100 ms, 16 kHz mono format. Preserve normal online meeting stop's separately authorized finalization versus privacy pause/withdrawal cancellation.

#### Future audio authority

`StreamScopeV1` contains `{stream_id, stream_epoch, meeting_session_id, segment_id, track_ids, encoding:"pcm_s16le", sample_rate:16000, channels:1, max_bytes:U64, max_samples:U64, absolute_not_after:Utc}`. Meeting/source IDs remain transient; durable accounting uses random request/stream handles, not local meeting identifiers. Bind its canonical digest into policy and privacy grants.

Track IDs are the explicitly authorized one or two current meeting tracks. Grant byte/sample limits count data within its quantum, while sample indices remain absolute within the segment. Validate both separately. Renewal cannot extend the original four-hour meeting bound.

Use 60-second authorization/accounting quanta, clamped at the UTC month boundary, source consent, route limit, and grant expiry. This is within the user's ≤5-minute renewal ceiling. Renew before expiry without changing provider/route/speaker-session identity; if renewal fails, stop forwarding at the boundary. A new provider connection is a new stream/epoch and cannot inherit speaker identities.

`SignedInferenceChunkProofV1`, `schema_id:"privacy.inference-chunk.v1"`, uses the enrolled device key and existing schema-ID/LF/JCS signing rule. Payload: `{request_id:UUIDv4, authorization_id:UUIDv4, stream_id:UUIDv4, stream_epoch:UUIDv4, track_id:Identifier, sequence:U64, sample_start:U64, sample_end:U64, byte_length:U64, sha256:Sha256Hex, consent_revision:U64, notice_revision:U64, input_revision:U64, deletion_generation:U64, issued_at:Utc, not_after:Utc}`. Proof TTL ≤5 seconds; exact size/range/hash/proof verification precedes forwarding the chunk. Sequence is monotonic per track, with `sample_end` exclusive and equal to next start; gaps are explicit, duplicates/out-of-order chunks are rejected without forwarding twice.

Send one binary WebSocket message containing four-byte big-endian header length, UTF-8 JCS signed header, then exact PCM bytes. Validate length and signature before exposing payload to LiteLLM. A terminal cancellation or stale revision wins against buffered chunks and late results. Revalidate central policy/access at least every second and immediately on received restriction; inability to renew freshness fails closed before the inherited two-second propagation budget expires.

For final audio, current meeting limits permit 128 MiB encoded content whereas `InferencePurposePolicyV1` currently caps all inputs at 10 MiB. Resolve this real contract hole: allow up to 134217728 bytes only for `meeting.transcribe.final`; other operations retain ≤10485760. A final-audio route must certify bounded streaming multipart through LiteLLM and the full required duration/diarization capability. Use declared per-part hashes with ≤1 MiB verified chunks; no disk spool, silent segmentation that loses session diarization, or fabricated authoritative finalization. If no compatible certified route exists, report `INFERENCE_CAPABILITY_UNSUPPORTED` and keep finalization unavailable; do not claim provider certification in this documentation task.

#### Budget/accounting

Add required `OrganizationPolicyV1.inference_budget_limit_microusd` using existing nonnegative decimal integer string convention and `OrganizationPolicyV1.inference_budget_window` with const `"calendar_month_utc"`. Purpose entries are unique by `(purpose,operation)`; every organization/purpose/route/concurrency bound applies. Zero or missing allowance blocks admission. Do not invent customer spend limits. Validate U64 strings against `0..18446744073709551615`, not just a twenty-digit regex.

Define metadata-only tables `inference_budget_bucket`, `inference_reservation`, and `inference_owner_lease`. Bucket key: organization, UTC month, bucket kind `organization|purpose`, purpose/operation when applicable. Track limit, settled amount, reserved amount, and policy revision with nonnegative integer arithmetic and check constraints.

Reservation states are `reserved|dispatched|settled|released|usage_unknown`; fields: reservation/request/authorization IDs, organization/purpose/operation, bucket/window references, pinned route/pricing/policy revisions, reserved/settled micro-USD, usage counters/status, owner, timestamps/deadline. No private content, input hashes, or manifest. Enforce unique request/authorization binding and compare-and-set transitions.

- Infrastructure-certified route pricing describes fixed micro-USD plus rational per-unit charges and certified upper bounds for the operation's billable units. Supported units are input/output tokens, audio milliseconds, image count, embedding tokens, and rerank pairs. Use `fixed + sum(ceil(max_units*rate_numerator/rate_denominator))`; denominator >0; all arithmetic checked; provider-specific bounds must be certified, not guessed from byte length. Missing/stale pricing blocks admission.
- Admission locks organization then purpose buckets in deterministic order, checks limits/concurrency, and reserves the maximum bounded amount atomically. Identity signs only against that matching live reservation.
- Sign/admission failure before upstream dispatch releases the reservation once. Claiming a grant for dispatch is a single irreversible CAS; duplicates cannot create another allowance or upstream invocation.
- Mark dispatched before first upstream transmission. A worker crash after that point is ambiguous and never automatically redispatched. Known provider usage settles once; cancellation/result races cannot settle/refund twice.
- Unknown usage remains encumbered and produces an operator reconciliation item. Only authenticated billing/usage evidence can adjust it. Do not expose reservations as verified actual spend.
- At month rollover, prior reservations stay in the prior window. Live continuation requires a new quantum/reservation in the new month; no borrowing, reset-based replay, or implicit carryover authorization.
- The eleven existing inference errors remain exhaustive; HTTP mappings: authorization 401/403; unavailable route/certification 503; unsupported capability 422; region/retention 403; budget 429; limits 413 for size or 429 for concurrency; upstream 502/504; stale input 409; invalid output 502; explicit cancellation 409. Streaming errors use the same code in a terminal event and then close.

### 5. Define recovery gates, runtime budgets, and privacy-safe operations

#### Independent recovery journal

Retain existing `AuthorityJournalEntryV1` and checkpoint signature formats/authority. Extend its closed `kind` union with `sync_custody_changed` and closed recovery variants for `sync_submission_identity` and its transient durability guard. Keep authority versus custody records visibly distinct; do not rename existing schema IDs or create a second competing journal.

- Allocate contiguous organization journal sequence/hash under a locked state row after authority/aggregate guards. Append exact committed entry bytes idempotently by organization/epoch/sequence; reject conflicting bytes. Append occurs after database commit; bounded pending rows are durable.
- Infrastructure logical APIs are `AppendRecoveryEntry(entry)->SignedAuthorityCheckpointV1`, `GetLatestRecoveryCheckpoint(organization_id)->SignedAuthorityCheckpointV1`, and `ReadRecoveryRange(organization_id,epoch,from_sequence,through_sequence)->ordered entries`. Authenticate workload, bind request nonce, verify signature/hash chain/sequence, and never accept a lower checkpoint or client-selected authority.
- `durability_pending` denies new dependent privilege and synthesis. Restrictions already deny locally. Clearing pending is a short second transaction conditional on exact checkpoint and current revision. A later restriction cannot be overwritten by a stale checkpoint completion.
- Approval `consumed` means the consume transaction atomically consumed proposal/approval/authorization and admitted the logical fence, not token issuance. External dispatch requires the first verified durable admission response. Lost response is status reconciliation, never replaying an external actuation.
- The sync journal projection is exactly `{organization_id,contribution_id,revision,content_digest,disposition}`. No actor/time history, signed delivery receipt, image/narrative, or private evidence ID. A temporary checkpoint guard is operational metadata, not an added lifetime replay field.
- Close existing unrestricted `RecordAfterImageV1.state_after`: table-discriminated, owner-typed security recovery projections; prohibit arbitrary JSON, live tokens, credential digests, private keys, full signed bearer artifacts, and private inference scopes. Reuse canonical existing field types and restore only fields represented by the declared owner recovery projection. Where full business rows cannot be reconstructed, retain restrictive recovery overlays and keep the affected resource/organization blocked rather than inventing values.

Use this exact closed recovery projection map. Every `state_after` includes organization matching its envelope. `?` means required-but-nullable; primitive types and existing enum literals come from Identity/Sync schemas. `present` is journal-only deletion metadata: when false, permit only organization and exact key fields. These are restrictive recovery projections, not whole replacement business rows.

| `table_name` | Projection beyond organization | Restore behavior |
|---|---|---|
| `identity_organization` | status, current policy/access revisions | Restore floors/status; missing canonical organization stays restricted, without fabricated name/time. |
| `identity_membership` | actor ID, person UUID, status, created_at | Restore binding; absent global person/subject mapping blocks activation. |
| `identity_team` | No extra fields; exact record_id retained in envelope | Explicitly invalidate pre-restore team authority pending owner reconstruction. |
| `identity_team_member` | team ID, actor ID, present | Restore removal; presence grants nothing without recovered team/member authority. |
| `identity_invitation` | No extra fields; exact record_id | Invalidate every pre-restore invitation; never recover invitation secret/email/grants. |
| `identity_role_assignment` | present, assignment UUID; when present exact `RoleAssignmentV1` | Replay deletion/typed assignment; missing scope never widens authority. |
| `identity_restriction` | present, restriction UUID; when present exact `CapabilityRestrictionV1` | Restore denies first; unknown scope blocks organization. |
| `identity_approval_delegation` | present, delegation UUID; when present exact `ApprovalDelegationV1` | Missing ceiling/approval evidence disables; null is never unlimited authority. |
| `identity_policy_version` | Exact updated `OrganizationPolicyV1`, lifecycle draft/approved/effective/superseded/revoked, approval_ids UUID[0..128] | Only effective policy with recovered approval evidence may activate; otherwise restrict. |
| `identity_authority_guard` | guard_kind, guard_id, revision, durability_pending, updated_at | Preserve floors; clear pending only against verified checkpoint. |
| `identity_device` | No extra fields; exact record_id | Invalidate pre-restore device authority; require verified owner enrollment/reconstruction. |
| `identity_review_key` | Exact existing Sync control-snapshot review_keys item | Public key/status/bindings only; preserve revocation; no private key/proof. |
| `identity_execution_principal` | No extra fields; exact record_id | Invalidate all old execution/service assignments; reissue through current owner authority. |
| `identity_action_fence` | execution_context_sha256, action_id, action_sha256, state, winning_authorization_id?, winning_attempt_id?, revision, created_at, updated_at | Never downgrade admitted/reconciled; missing winners cannot enable retry. |
| `identity_approval_proposal` | proposal_id/revision/digest, kind action/governance, state, issued_at, not_after; action branch adds action_id/action_sha256 | Preserve terminal/consumed states; invalidate pending/approved. No fabricated governance action or full signed proposal. |
| `identity_approval` | approval_id, proposal_id/revision, approver_actor_id, decision, decided_at, not_after, consumed_at? | Preserve consumption/negative decisions; unconsumed restored approval grants nothing. |
| `identity_action_authorization` | authorization_id, action_id, action_sha256, approval_id?, issued_at, not_after, state | Preserve consumed; revoke issued; omit nonce/signature and retain deny overlay where full SQL row cannot be restored. |
| `identity_action_consumption` | authorization_id, attempt_id UUIDv4, consumed_at | Preserve both unique constraints; missing parent means deny overlay, never synthetic authority. |
| `identity_legal_hold` | present, hold_id; when present exact `ActiveHoldV1` | Preserve holds/releases; interval expiry is not release; missing history blocks voluntary destruction. |
| `identity_emergency_account` | No extra fields; exact record_id | Disable old slots pending independently verified recovery; never invent MFA/grants. |
| `sync_submission_identity` | Exact other four fields from selected five-field custody projection | Preserve accepted/terminal identity; missing payload is explicit loss, not new acceptance. |

Add restrictive `identity_recovery_overlay {organization_id,table_name,record_id,recovery_epoch,reason_code,source_sequence,resolution_state:blocked|resolved}`. Only Identity's current owner reconstruction transaction may resolve it, with complete canonical dependencies, fresh administrative MFA where required, guard update and independent checkpoint. No caller-supplied recovered-row endpoint. Keep affected scope blocked until resolution; this is specified fail-closed behavior, not a placeholder.

Correct documented Identity SQL tenant lineage: approval/authorization primary keys and their consumption/approval foreign keys include organization_id. Preserve public IDs. Add the policy lifecycle/effective/approval mapping and action/governance proposal distinction to Identity-owned persistence documentation. Do not edit the old root `IDENTITY_POLICY_SPEC_PLAN.md` or make it normative.

Add closed recovery variant `identity_recovery_epoch_state {organization_id,recovery_epoch,keyset_revision:Rev,control_sequence:Rev,revocation_generation:Rev}` for omitted key/control floors. Missing or unverifiable floors block issuance; never reset them to1. This owner record is metadata only and contains no signing private keys or live bearer artifacts.

- Journal independently stored custody tombstones/accepted identities must survive ordinary PostgreSQL site-loss RPO and be replayed before any sync ingress or synthesis. Recovered accepted identities with lost payload remain fenced with truthful `lost_after_restore` status.
- Restore enters global `recovering`; terminate ingress/worker dispatch, restore PITR, verify latest independent checkpoints and contiguous ranges, rebuild guards/fences/custody, filter expired/revoked artifacts, invalidate all old sessions/unconsumed tokens/approvals/worker assignments, advance epoch and mutation admission floor, then reopen only reconciled scopes. Unavailable/gapped/unverified ranges return `IDENTITY_RECOVERY_INCOMPLETE`/`CP_RECOVERY_REQUIRED`; never lower revision floors.
- Reconcile admitted actions through owners and independent readback before any new action intent. Ordinary lost canonical data is reported, not invented from event metadata. Lost global identity mappings require verified identity recovery, never email matching or fabricated person/organization rows.

#### Kubernetes application contract

Document Kubernetes-native Deployments/Services/NetworkPolicies, not an infrastructure-provider selection or production manifests. Use a currently supported conformant Kubernetes release and PostgreSQL 18 reference semantics; explicit patches/security rollout belong to Infrastructure implementation, not this documentation change.

Initial sizing per process role:

| Role | Replicas | CPU request/limit | Memory request/limit | Database pool/pod |
|---|---:|---|---|---:|
| API/BFF | 2 | 250m/1000m | 256Mi/512Mi | 12 |
| Durable worker | 2 | 250m/1000m | 256Mi/512Mi | 8 |
| Inference worker | 2 | 500m/2000m | 512Mi/1Gi | 4 |

Reserve separate small listener connections (not request transactions); total application connection budget 64 with at least 16 reserved outside the per-pod pools for journal completion, safety work, and maintenance. Long polls and streams must not pin ordinary pool connections.

- Admission caps pilot inference at 20 concurrent sessions total, 12 per inference pod; route/purpose limits can reduce these. Final-audio memory reservations and live sessions share real bounded memory accounting; do not multiply every route's theoretical cap by all sessions without reservation.
- General JSON requests are bounded; public API initially admits 25 requests/second steady, burst 50; per organization 10/s burst20; actor5/s burst10. Apply separate budgets to the established low-volume 25-second long-poll channels, inference streams/bytes, sync uploads, and auth attempts. Allow one sync poll/device and one management poll/browser session; coalesce tabs. Login abuse ceiling10 attempts/minute/IP, burst5, with safe metadata-only keyed counters and no raw credential data. Safety cancellations/revocations have reserved capacity and current authority checks.
- Use read-only root filesystem, non-root UID, drop Linux capabilities, restricted seccomp, no writable persistent volume for inference, bounded memory `emptyDir`, no hostPath, no swap/core dumps on certified inference nodes, no body buffering at ingress/mesh, and no debug collection of process memory. RAM spool uses `emptyDir.medium:Memory`, explicit sizeLimit256Mi, bounded allocations, zero/unlink on every terminal path.
- Inference network egress only to internal policy/admission metadata dependencies and approved LiteLLM. LiteLLM alone holds provider access; no API/BFF or durable worker has arbitrary provider egress. Execution and simulation credentials/networks remain separate.
- Infrastructure supplies short-lived mTLS certificates bound to registered workload/service-account identity. Verify trusted issuer, SAN, environment, revocation/expiry and current Identity registration; do not trust forwarded workload-ID headers unless a mutually authenticated trusted gateway strips/reconstructs them. A service certificate authenticates a workload, not a tenant or business action. Certificate issuance and WORM product operation stay in Infrastructure's component.
- Readiness is role-specific. API can serve allowed reads during an unrelated inference outage, but privilege/sync paths respect recovery and signing gates. Worker readiness requires database/registered handlers; inference readiness requires hardened memory/no-logging configuration plus certified route reachability. Never make unavailable dependency health look like authorized degraded execution.
- Graceful termination: mark unready, stop new claims/admission, give ordinary requests ≤10s and worker transaction ≤1s to finish, terminate inference with explicit interruption, cancel upstream, zero memory; overall termination grace30s. Persist metadata/unknown usage, never private bodies. Surviving streams on a healthy pod are not resumed elsewhere.
- Three failure-domain database placement, synchronous local durability and tested failover are Infrastructure prerequisites for existing ≤30s/no-acknowledged-data-loss node-failover target. Keep this distinct from site-loss RPO15m/RTO4h and report unproven infrastructure targets as acceptance prerequisites, not achieved guarantees.
- Scale API by active connections/latency, durable workers by oldest ready delivery and fair queue lag, inference by admitted session/memory headroom. HPA cannot expand the database or provider caps silently. Pilot ceilings require an explicit capacity review before higher admitted load.

#### Observability/audit

Persist meaningful audit with owner mutation/outbox in the same transaction; fail closed for consequential mutation when mandatory audit cannot be persisted. Durable forwarding to Infrastructure's tamper-evident store follows commit and is duplicate-safe. Audit content: event/request/organization/actor-or-workload, owner/resource, operation, policy/access/relevant version refs, outcome/reason, causation/correlation, and UTC time. Do not audit every housekeeping counter or activity renewal.

Trace route templates and bounded safe error categories, not full URLs, identifiers as metric labels, headers, query tokens, body content, model output, private source hashes, or transcript excerpts. Metrics: request latency/status, queue age/quarantine, pool wait, pending checkpoints, revocation propagation, stream interruptions, buffer pressure, reservation/unknown-usage counters, recovery state. Do not create employee performance/activity metrics. Default consequential audit retention24 months; private inference content retention remains zero.

### 6. Publish executable contracts and reconcile the component boundary

Create these normative artifacts because no equivalent full Control Plane request/event/stream contracts exist:

- `docs/architecture/contracts/control-plane-v1.schema.json`, `$id:"urn:oryn:schemas:control-plane:v1"`, Draft2020-12: web login/session, safe problem, resource references, operations/cancellation, domain event/reference payloads, change page/cursor, and fixture envelope.
- `docs/architecture/contracts/control-plane-v1.openapi.json`, OpenAPI3.1.0: exact infrastructure/session/operation/change routes above, established Identity/Sync routes by reference, and inference transport routes. Keep WebSocket frame semantics in the inference schema/spec; OpenAPI describes upgrade/auth/metadata rather than pretending frames are ordinary JSON responses.
- `docs/architecture/contracts/cloud-inference-v1.schema.json` described in step4.
- `docs/architecture/contracts/control-plane-v1.fixtures.json` and `cloud-inference-v1.fixtures.json`: use the existing identity fixture convention for public test keys, signed examples, digest vectors, and named behavioral cases; add closed `validation_cases` for actual schema positive/negative checks and `binding_vectors` for input/proof substitution checks. Values are synthetic; never production private keys.
- `docs/adr/0012-control-plane-transport-durability-and-inference.md`: accepted after this plan is approved, date2026-11-10, amends ADR-0010/0011 only where this design explicitly changes the shared contract. Explain PostgreSQL-only delivery versus broker complexity, three-role isolation, browser cookie/native separation, transient non-resumable inference, and minimal custody journal extension. Preserve old ADR history with an amendment link, not rewritten historical decisions.

Use closed objects (`additionalProperties:false`), explicit nullable fields, decimal U64/money strings, bounded arrays/strings, unique discriminating `schema_id` values, and root discriminated unions matching the three existing schema files. Reuse existing definitions by resolvable `$ref`; do not copy conflicting Identity/Sync definitions into the new files. Stable HTTP paths share one canonical OpenAPI operationId each. OpenAPI security schemes: BFF cookie + CSRF header, opaque bearer by audience, and internal mTLS; anonymous bootstrap routes explicitly declared. No unbounded `object` for domain commands or private content.

Fixture definitions are `ControlPlaneFixtureSetV1` and `InferenceFixtureSetV1`, schema IDs `control-plane.fixture-set.v1` and `inference.fixture-set.v1`. Each contains public_keys, signed_envelope_examples, digest_vectors, validation_cases, binding_vectors and descriptive cases. Validation rows are `{case_id,schema_ref,instance,expected_valid:boolean}`. Binding vectors are `{case_id,authorization,privacy_context:null|signed_context,request:InferenceAuthorizationRequestV1,stream_scope:null|StreamScopeV1,chunk_proof:null|SignedInferenceChunkProofV1,chunk_base64:null|string,checked_at:Utc,expected_valid:boolean}`. Control Plane has an empty binding-vector list; Inference includes positive and substitution-negative vectors. Descriptive stateful outcomes are not executed application tests.

Update existing `identity-policy-v1.schema.json` and identity fixtures for the new fields, principal/nullability conditionals, inference child audience, final-audio cap, organization budget, and closed recovery projections. Regenerate only signed examples whose payload changed, using clearly public deterministic fixture seeds; preserve unrelated signatures. Update `contribution-sync-v1.schema.json` for `content_state` and any closed recovery/status references without changing unrelated IPC contracts.

Reconcile affected prose at its authoritative owner:

- `docs/components/identity-policy.md`: BFF/native sequence separation, missing session transport routes, consumed timing, child audience and budgets, hash/proof linkage, closed recovery projections/checkpoint gate. Preserve pure evaluator and fixed role/risk policy.
- `docs/components/contribution-sync.md`: canonical route/status/error/key semantics, insert-once algorithm, exact tables, checkpoint gating, five-field lifetime ledger, receipt pruning and restore loss, local versus central ledger ownership, PostgreSQL delivery instead of brokers.
- `docs/architecture/cloud-inference.md`: exact new wire refs, HTTP/WebSocket lifecycle, metadata/private separation, bindings/stream proofs, renewals, cancellation/finalization distinction, accounting and final-audio limits.
- `docs/components/meeting-intelligence.md`: consume new grants/chunk frames and no-resume behavior; correct its diagram's misleading Screen Pause edge to preserve the transition table's independent meeting category. Preserve four-hour/128MiB/8MiB local limits and per-meeting consent.
- `docs/components/local-privacy-storage.md`, `desktop-shell.md`, `local-context-hud.md`: only affected inference credential/grant/stream handoff paragraphs and SessionBroker audience references. Privacy Helper still owns private egress; extension/OS/meeting capture workers get no direct cloud access.
- `docs/components/infrastructure-security.md`: application-facing portable Kubernetes/connection/memory/US-processing contracts, current mandatory RLS, custody journal extension and honest node-failover versus site-loss recovery. Do not flesh out its unrelated KMS/CMEK/provider/operator internals.
- `docs/architecture/threat-model.md`: separate public native/confidential web redemption; embedded evaluator rather than contradictory separate policy process; add cursor/session confusion, post-checkpoint ambiguity, custody restore replay, stream substitution, and unknown-budget threats.
- `docs/architecture/data-classification.md`: minimal custody and replay metadata retention, seven-day response retention, zero private inference durability, exact `inference.authorization.v1` schema literal instead of stale `identity.inference-authorization.v1`.
- `TECHNICAL.md`: §§5.1/5.2, communication/consistency metadata, recovery and §13 deferred-decision rows only where these choices become resolved; preserve high-level purpose. Keep workflow engines/search/Graph schemas owned by their later component designs.
- `docs/architecture/contracts/README.md`: correct scope/numbering, new normative schemas/OpenAPI, resolved PostgreSQL event fabric, key-purpose/signing rules, expanded inference contract.
- `docs/README.md`, `docs/adr/README.md`: index the completed specification and ADR with truthful implementation-pending status.
- `GLOSSARY.md`: add only domain meanings resolved by this design, not Rust/PostgreSQL/HTTP details. `Operation`: a tracked request for work, not proof that business work completed. `Domain Event`: a committed organizational fact, not authority. `Submission Custody`: organizational acceptance of a reviewed contribution, not publication or current content availability. `Inference Reservation`: bounded permission to consume configured inference allowance, not confirmed actual cost. Use existing `**Term**:` and `_Avoid_:` style; avoid `Job` for Operation and `Publication` for custody.

Do not modify `PRODUCT.md` merely to bless stale technical claims; its product requirements already permit these implementation choices. If another change arrives during execution, reread the relevant owner sections before editing. Do not create an alternative numbered component or duplicate source-of-truth file.

## Critical files and anchors

Line numbers are discovery hints; reread changed regions before editing.

| File | Anchor | Why it matters |
|---|---|---|
| `docs/components/control-plane.md` | Twelve headings; lines12-22,63-110,140-157 | Primary deliverable; stale JWT, routes, tables, broker wording and uncommitted-event language. |
| `docs/components/identity-policy.md` | §§Authentication259-335; SQL366-498; consumed545; operations646-652 | Accepted session, deterministic authority, concurrency, and independent checkpoint constraints. |
| `docs/components/contribution-sync.md` | Routes120-129; PostgreSQL922-1032; decisions1663-1680 | Fixed transport/intake contract and create/replay/pruning contradictions. |
| `docs/architecture/contracts/identity-policy-v1.schema.json` | `$defs.InferenceAuthorizationPayloadV1`, `RecordAfterImageV1`, `SessionCredentialsV1`, `ChildTokenRequestV1`, `OrganizationPolicyV1` | Closed schemas must actually encode the revised authority contract. |
| `docs/architecture/cloud-inference.md` | Logical APIs318-344; pinning350-371; hardening406-445 | All consumers inherit no durable private content, pinned routes, bounded streams, and cancellation semantics. |

## Verification

### Documentation/contract proof to execute in this task

Working directory: repository root. No customer secrets, Auth0 tenant, live model provider, database cluster, browser, or application runtime is required for this documentation deliverable. Do not run cargo/npm suites that do not exist.

Use an external temporary virtual environment for verification dependencies, not a new repository manifest. After approval, create it with `python3 -m venv /tmp/oryn-control-plane-spec-check`, then `/tmp/oryn-control-plane-spec-check/bin/python -m pip install jsonschema referencing rfc8785 cryptography openapi-spec-validator`. If that exact temporary path already belongs to another task, use `mktemp -d /tmp/oryn-control-plane-spec-check.XXXXXX` and retain the resulting path for the commands. Never overwrite another task's environment.

Execute one throwaway Python verification cell/script with these concrete operations and fail-fast assertions:

1. Load all five contract schemas (existing Identity, Contribution Sync, Guidance Sync; new Control Plane and Cloud Inference), build an offline `referencing.Registry` keyed by their exact `$id` and file URIs, and run `Draft202012Validator.check_schema` on each. Network reference resolution is prohibited. Traverse every `$ref` and require it to resolve locally, including cross-file fragments.
2. Validate existing identity fixtures against `$defs.IdentityFixtureSetV1`, each signed example against its corresponding root union, and both new fixture envelopes against their closed fixture definitions. For every `validation_cases` row, run the referenced Draft202012 validator with FormatChecker and assert actual validity equals `expected_valid`; require at least one positive and one negative per changed boundary.
3. Decode fixture public keys/signatures with unpadded base64url; verify each signed example with Ed25519 over `schema_id + LF + rfc8785.dumps(payload)`. Recompute existing action/proposal vectors using their documented distinct prefixes. Recompute manifest/privacy/stream/chunk binding vectors exactly as specified; alter one audio byte, request ID, stream epoch, consent generation, and manifest entry independently and require verification or equality checks to reject each altered case. Do not merely assert fixture-provided expected labels.
4. Run `openapi-spec-validator` on `docs/architecture/contracts/control-plane-v1.openapi.json` using file URI base resolution. Resolve external refs through the offline schema registry; if the CLI cannot use that resolver, invoke its Python API with the local base URI. Require unique operationIds; each route's declared schema/status/code must agree with the component tables, and every established sync route must exist under its canonical path.
5. Parse top-level headings in the promoted component and require the exact twelve-heading sequence above, nonempty content under each, no unresolved placeholder markers, and primary acceptance mappings ORY-001/041/060/070 plus supporting ORY-006/007/026-030/040-048/064/067-076. Check all changed Markdown relative file links and heading fragments against actual local files; ignore external links only for local-target validation.
6. Search changed documents for old `/v1/sync/contributions` routes, wrong Contract20 guidance polling, `identity.inference-authorization.v1`, direct Auth0 JWT request authentication, broker-selected-as-open wording, and `consumed` defined at token issuance. Require these stale claims absent from active normative prose; historical ADR rationale remains historical and receives amendment links.

The execute agent may construct this throwaway checker inline in Eval or a temporary external file; it must implement the specified checks, not replace them with text-presence smoke assertions. Print counts and exact check classes, e.g. `PASS: schemas, refs, fixture validity, signatures, binding substitutions, OpenAPI, headings, links`. Report actual counts only. If a dependency or existing fixture fails, fix the owned contract inconsistency; do not suppress the assertion or re-pin expected output blindly.

Write the described complete checker into the external verification directory and run these exact commands, substituting its actual unique path only if the default directory was occupied:

```text
/tmp/oryn-control-plane-spec-check/bin/python /tmp/oryn-control-plane-spec-check/verify_contracts.py
/tmp/oryn-control-plane-spec-check/bin/python -m openapi_spec_validator docs/architecture/contracts/control-plane-v1.openapi.json
```

Include this concrete new-behavior check in that checker. `inference_fixtures` is the loaded inference fixture object. `public_keys` maps fixture key IDs to decoded32-byte public keys, rejecting conflicting duplicate IDs. Execute the schema/signature/ref/docs checks above as well.

```python
import base64
import copy
import hashlib
from datetime import datetime
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
import rfc8785

def b64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))

def digest(value: object) -> str:
    return hashlib.sha256(rfc8785.dumps(value)).hexdigest()

def instant(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))

def signed_payload(envelope: dict, public_keys: dict[str, bytes]) -> dict:
    message = envelope["schema_id"].encode() + b"\n" + rfc8785.dumps(envelope["payload"])
    Ed25519PublicKey.from_public_bytes(public_keys[envelope["key_id"]]).verify(
        b64(envelope["signature"]), message
    )
    return envelope["payload"]

def binding_valid(vector: dict, public_keys: dict[str, bytes]) -> bool:
    try:
        grant = signed_payload(vector["authorization"], public_keys)
        request = vector["request"]
        now = instant(vector["checked_at"])
        if not instant(grant["issued_at"]) <= now < instant(grant["not_after"]):
            return False
        if (instant(grant["not_after"]) - instant(grant["issued_at"])).total_seconds() > 300:
            return False
        for field in ("request_id", "purpose", "operation", "input_revision", "deletion_generation"):
            if grant[field] != request[field]:
                return False
        if grant["input_binding"] != request["input_binding"]:
            return False
        proof = vector["privacy_context"]
        if grant["principal_kind"] == "employee":
            if proof is None or digest(proof) != grant["privacy_context_sha256"]:
                return False
            local = signed_payload(proof, public_keys)
            if not instant(local["issued_at"]) <= now < instant(local["not_after"]):
                return False
            if (instant(local["not_after"]) - instant(local["issued_at"])).total_seconds() > 5:
                return False
            for field in ("organization_id", "actor_id", "device_id", "profile_id",
                          "request_id", "purpose", "operation", "input_revision", "deletion_generation"):
                if local[field] != grant[field]:
                    return False
        else:
            if proof is not None or grant["privacy_context_sha256"] is not None:
                return False
            local = None
        binding = grant["input_binding"]
        if binding["kind"] == "batch":
            scope_hash = digest(request["input_scope"])
            manifest_hash = digest(request["input_manifest"])
            if scope_hash != binding["input_scope_sha256"] or manifest_hash != binding["input_manifest_sha256"]:
                return False
        else:
            scope_hash = digest(vector["stream_scope"])
            manifest_hash = digest([])
            if scope_hash != binding["stream_scope_sha256"]:
                return False
            for field in ("stream_id", "stream_epoch"):
                if vector["stream_scope"][field] != binding[field]:
                    return False
            chunk = signed_payload(vector["chunk_proof"], public_keys)
            data = b64(vector["chunk_base64"])
            if hashlib.sha256(data).hexdigest() != chunk["sha256"] or len(data) != int(chunk["byte_length"]):
                return False
            if not instant(chunk["issued_at"]) <= now < instant(chunk["not_after"]):
                return False
            if (instant(chunk["not_after"]) - instant(chunk["issued_at"])).total_seconds() > 5:
                return False
            if (int(chunk["sample_end"]) - int(chunk["sample_start"])) * 2 != len(data):
                return False
            for field in ("request_id", "authorization_id", "input_revision", "deletion_generation"):
                if chunk[field] != grant[field]:
                    return False
            for field in ("stream_id", "stream_epoch"):
                if chunk[field] != binding[field]:
                    return False
            if local is None or vector["chunk_proof"]["key_id"] != proof["key_id"]:
                return False
            if chunk["consent_revision"] != local["consent_revision"] or chunk["notice_revision"] != local["notice_revision"]:
                return False
        if local is not None:
            if local["input_scope_sha256"] != scope_hash or local["input_manifest_sha256"] != manifest_hash:
                return False
        return True
    except (InvalidSignature, KeyError, ValueError, TypeError):
        return False

for vector in inference_fixtures["binding_vectors"]:
    actual = binding_valid(vector, public_keys)
    assert actual is vector["expected_valid"], vector["case_id"]
    if actual:
        changed = copy.deepcopy(vector)
        changed["request"]["request_id"] = "ffffffff-ffff-4fff-8fff-ffffffffffff"
        assert not binding_valid(changed, public_keys), "request substitution accepted"
        if vector["chunk_base64"] is not None:
            changed = copy.deepcopy(vector)
            data = bytearray(b64(changed["chunk_base64"]))
            assert data, "positive chunk fixture must contain audio"
            data[0] ^= 1
            changed["chunk_base64"] = base64.urlsafe_b64encode(data).rstrip(b"=").decode()
            assert not binding_valid(changed, public_keys), "audio substitution accepted"
```

This is a cryptographic binding reference check, not a gateway implementation or proof of stateful sequence/revocation enforcement. Keep additional negative epoch/consent/manifest vectors and the future runtime acceptance cases separate from claims about what this checker exercised.


### Stateful acceptance procedures to specify, not claim executed

The final component's Test strategy must give concrete input, observable result, failure injection, and owning prerequisite for each scenario below. These are future implementation acceptance tests, not proof this documentation task built a server.

| Scenario | Required result |
|---|---|
| OrgA principal queries OrgB ID, cursor, artifact, operation, or worker assignment | Denied without data/count leakage; missing RLS context cannot read or write; pool reuse does not retain tenant context. |
| Organization switch with another browser tab still open | Old tab's session binding is rejected; no command lands in new organization accidentally. |
| Background polls run past30m with no interaction | Web locks; polls do not extend human activity; unlock preserves original absolute deadline. |
| Native refresh success response is lost | No secret replay cache or grace acceptance; reconcile/re-authenticate; replay revokes family. |
| Two identical ordinary commands race; then same key/different body; then seven-day expiry | One owner mutation/audit/event; exact result replay;409 conflict;410/status-only after expiry. |
| Database restored before an ordinary command's lost row | Pre-recovery key is not re-executed; reconciliation reports missing/lost state. |
| Invalid job start (missing inputs, stale version, wrong scope/role) | Owner preflight returns explicit rejection; no job or execution authority created; meaningful rejection audit. ORY-041. |
| Crash before/after domain fanout or inbox commit; duplicate delivery; dropped NOTIFY | Committed state/events survive; uncommitted facts never publish; dedup and periodic scans recover without duplicate mutation. |
| Eight poison-event failures for one aggregate | That aggregate/consumer quarantines; unrelated work continues; security restrictions still propagate≤2s. |
| Concurrent new contribution acceptance and withdrawal | One serialized terminal identity; no double insert; withdrawn source cannot synthesize or resurrect after restore. |
| Receipt pruned or payload lost after RPO restore | Matching replay returns signed truthful status/null receipt, never new intake/acceptance/publication. |
| Signing/journal failure after authority or custody commit | Pending restriction/fence remains; no dependent dispatch/synthesis or false success acknowledgment. |
| Consume commits; checkpoint succeeds; admission response is lost | Approval/fence stays consumed; status reconciliation never causes duplicate external actuation; outcome remains independently verified/unknown. |
| Wrong grant/proof hash, route, input generation, chunk range/sequence/epoch | No affected bytes forwarded; exact existing inference rejection; no replay/fallback. |
| WebSocket owner dies or client disconnects | Stop upstream, zero RAM, explicit interruption; no cross-pod resumption or speaker inheritance. |
| PauseScreenObservation versus PauseCapture versus normal meeting stop | Meeting continues for screen-only pause; PauseAll cancels; normal stop permits only separately authorized finalization. |
| Concurrent last-dollar reservations, midnight rollover, cancellation/result race | No bucket overspend; one reservation consumption/settlement; unknown usage stays encumbered in original window; new quantum needs new budget. |
| 128MiB final audio with unsupported route | Explicit capability unavailable; no disk spool, silent split/diarization claim, or fabricated final transcript. |
| No-swap/no-body-log certification missing, spoofed workload, simulation credential to production | Fail closed before payload/privilege admission. |
| Pilot load plus node loss/site restore | Meet stated admitted-load targets, distinguish failover from disaster RPO/RTO, retain safety gates; do not count provider latency as API execution. |

Include exact future implementation test prerequisites: two synthetic organizations, distinct role/delegation fixtures, an enrolled synthetic device key, test-only signer/journal, PostgreSQL RLS roles, deterministic fault injection, fake upstream that records bytes without representing certified production capability, and no real business writes. Do not select Orchestrator's workflow engine or implement its business state machine within this component.

## Assumptions and contingencies

- Scope is the explicitly named Control Plane API and Domain Coordination component; numbering mismatch does not redirect work to Local Privacy Storage.
- A currently supported Kubernetes platform, PostgreSQL, Vault Transit, authenticated internal network, independent immutable journal, and route certification are Infrastructure prerequisites, not services to provision during this documentation task. Where absent, final docs say implementation/certification pending; runtime design fails closed.
- User selected pilot regional RPO15m/RTO4h with stronger authority/custody guarantees. If Infrastructure cannot meet the independent-journal contract, block authority/custody acknowledgment and privileged reopening; do not quietly weaken non-rollback semantics or claim the recovery target was exercised.
- If a new conflicting repo change appears, preserve it, reread the affected owner contract, and update the same chosen protocol consistently. Do not create compatibility aliases or parallel APIs.
- New schemas are clean pre-implementation v1 cutovers. Update every affected existing fixture/example/caller specification together; no deprecated wire branches or runtime shims.
- Final completion reports only documentation/schema/fixture/OpenAPI checks actually executed. Application safety, SLOs, infrastructure isolation, provider certification, and end-to-end product acceptance remain future implementation evidence.
