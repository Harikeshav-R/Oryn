# Control Plane API and Domain Coordination Component Specification

Status: Detailed technical specification — implementation pending

## 1. Purpose and scope

**Source references:** [PRODUCT.md §§6–7, 14, 16.6, 25.6–9; ORY-001, ORY-006, ORY-007, ORY-026–030, ORY-040–048, ORY-060, ORY-064, ORY-067–076](../../PRODUCT.md) | [TECHNICAL.md §§5.1, 5.2, 7.2 (Contracts 2, 3, 11, 18, 20, 22, 24), 9.2–3, 11.3–5, 13.2](../../TECHNICAL.md) | [ADR-0010](../adr/0010-contribution-delivery-and-guidance-sync.md) | [ADR-0011](../adr/0011-identity-authority-and-approval-fencing.md) | [ADR-0012](../adr/0012-control-plane-transport-durability-and-inference.md) | [control-plane-v1.schema.json](../architecture/contracts/control-plane-v1.schema.json) | [cloud-inference-v1.schema.json](../architecture/contracts/cloud-inference-v1.schema.json) | [control-plane-v1.openapi.json](../architecture/contracts/control-plane-v1.openapi.json)

### Core Responsibility
The Control Plane API and Domain Coordination component (Catalog Component 9) is the authoritative, organization-scoped HTTP, WebSocket, and transactional messaging gateway for the Oryn platform. It provides unified ingress for web management consoles, desktop companion endpoints, background workers, and external systems, coordinating multi-tenant transactional boundaries, enforcing command idempotency, scheduling durable domain deliveries, managing authorized change feeds, and orchestrating transient cloud inference admission under strict privacy and cryptographic binding guarantees.

The repository currently contains normative wire schemas, contract fixtures, OpenAPI definitions, and component specifications; backend application packages, database migration scripts, and production deployment charts are implementation-pending.

### Primary Ownership Boundaries
Control Plane strictly delineates transport, transaction mechanics, and durable delivery from domain business logic and formal policy evaluation:

- **Owns:**
  - HTTP/HTTPS REST and WebSocket transport ingress, termination, and protocol negotiation.
  - Web BFF session management (secure `__Host-` cookies, transaction state, 30-minute idle locks) and physical storage of session secret digests.
  - General command transport idempotency scoping, canonical hashing (RFC 8785), deduplication, and 7-day sanitized mutation response replay.
  - Multi-tenant transaction coordination (`TenantTransaction`), transaction-local Row-Level Security (RLS) variable configuration, and deterministic authority guard acquisition.
  - Asynchronous operation tracking (`OperationV1`), lifecycle transitions, and owner cancellation dispatch.
  - PostgreSQL-backed transactional outbox/inbox fabric, consumer lease management, fair tenant scheduling, and quarantine mechanics.
  - Authorized, cursor-based management change feeds (`ChangePageV1`) with bounded 25-second long-polling.
  - Authoritative cloud sync transport endpoints for contribution intake (Contract 2), review-key registration, and guidance distribution (Contract 3).
  - Transient inference admission, budget reservation, cryptographic binding verification, and WebSocket streaming coordination (Contract 22).

- **Does Not Own:**
  - Policy evaluation, verified principal construction, role-based authorization, MFA verification, or formal approval integrity (owned exclusively by [identity-policy](identity-policy.md)).
  - Deciding whether domain business state transitions or outcomes are valid (owned by respective domain owners such as [operational-graph](operational-graph.md), [job-orchestration](job-orchestration.md), [release-governance](release-governance.md), and [outcome-verification](outcome-verification.md)).
  - Storing or caching private raw capture payloads, prompts, model completions, audio bytes, or transcript excerpts (zero private data retention; transient processing only).
  - Webhook routing or external notification presentation (owned by [command-center-analytics](command-center-analytics.md)).
  - Certificate issuance, Vault KMS operation, PostgreSQL server operation, or physical immutable WORM storage management (owned by [infrastructure-security](infrastructure-security.md)).

### Planned Rust Module Architecture
Control Plane is architected as an Axum/Tokio/Tower modular Rust application. Domain logic remains strictly independent of the HTTP framework.

The component is partitioned into ten internal modules:
1. `HttpIngress`: TLS termination metadata validation, request/trace ID propagation, body streaming limits, rate limiting, and CORS/Origin enforcement.
2. `SessionTransport`: Web BFF cookie lifecycle, PKCE verifier vaulting, Auth0 callback handling, CSRF token validation, and activity tracking.
3. `CommandDispatcher`: Generic typed command routing, RFC 8785 canonical hashing, idempotency locking, and response projection sanitization.
4. `TenantTransaction`: Private wrapper around SQLx PostgreSQL transactions, enforcing transaction-local RLS configuration and deterministic guard locking.
5. `OperationRegistry`: Asynchronous operation state tracking (`OperationV1`), milestone updates, and cancellation signaling.
6. `DomainDelivery`: PostgreSQL durable queue processor, outbox fanout, consumer leases, exponential backoff, and poisoned aggregate quarantine.
7. `ChangeFeed`: Per-organization committed sequence counter, signed cursor generation, and 25-second long-poll notification dispatch.
8. `AuditWriter`: Transactionally co-located audit logging, ensuring mandatory audit entries commit atomically with domain state changes.
9. `InferenceAdmission`: Verification of signed policy/privacy grants, route pricing validation, and atomic budget reservation.
10. `InferenceSessionCoordinator`: WebSocket connection affinity, chunk proof verification, and streaming proxying to LiteLLM.

```rust
// Core Domain Command & Handler Interfaces (Specification Reference)

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

`VerifiedPrincipal` is constructed exclusively by [identity-policy](identity-policy.md). Its closed enum variants are `BootstrapPerson`, `WebMember`, `DesktopMember`, `ChildPrincipal`, and `WorkloadPrincipal`. Constructors and context-variable setters are not public; handlers cannot forge principal identities, roles, or tenant bindings from request JSON.

`TenantTransaction` wraps a SQLx transaction and verified context:
- Handlers cannot access raw unscoped connection pools or commit independently.
- `Revision` is an unsigned 64-bit integer serialized as a decimal string over wire protocols.
- `ResourceKey` contains `organization_id`, `resource_type`, and `resource_id`.
- `DomainError` projects exclusively to closed `ControlPlaneProblemV1` error variants.
- Authorization decisions reuse `evaluate_authorization` exactly as specified in `docs/components/identity-policy.md`.

## 2. System and organizational context

Control Plane sits at the central crossroads of Oryn multi-tenant operations, serving external clients and coordinating internal subsystems:

```
+----------------------------------------------------------------------------------------------------+
|                                      CONTROL PLANE API GATEWAY                                     |
|                                                                                                    |
|  +---------------------------+  +-------------------------------+  +----------------------------+  |
|  | Contract 18: Changes/Ops  |  | Contract 2 & 24: Sync Intake  |  | Contract 22: Cloud Infer   |  |
|  | - GET /v1/changes         |  | - POST /v1/sync/submissions   |  | - POST /v1/inference/auth  |  |
|  | - GET /v1/operations/{id} |  | - POST /v1/sync/withdrawals   |  | - GET /v1/inference/stream |  |
|  +---------------------------+  +-------------------------------+  +----------------------------+  |
|                |                                |                                 |                |
+----------------|--------------------------------|---------------------------------|----------------+
                 |                                |                                 |
                 v                                v                                 v
   +---------------------------+    +---------------------------+     +---------------------------+
   |   Command Center & Web    |    |  Contribution Sync Engine |     |   Managed LiteLLM Proxy   |
   |   (Operational Console)   |    |  (Desktop / HUD Clients)  |     |   (US Pinned / Zero Ret)  |
   +---------------------------+    +---------------------------+     +---------------------------+
```

### Upstream and Downstream Contract Inventory
Control Plane coordinates transport across eight authoritative platform contracts:
1. **Contract 2 (Workflow Contributions):** Ingests reviewed workflow contributions (`sync.reviewed-contribution.v1`) over `POST /v1/sync/submissions`. Enforces 5 MiB body cap, max 4 PNG artifacts (≤ 1 MiB each, ≤ 1920x1080), and returns `DeliveryReceiptV1` or `SubmissionStatusV1`.
2. **Contract 3 (Guidance Distribution):** Serves signed guidance manifests and immutable guidance bundles over `/v1/sync/guidance/*` for employee working set sync.
3. **Contract 4 (Candidate Guidance Staging):** Stages approved workflow candidates (`CandidatePromotionV1`) into [operational-graph](operational-graph.md) over `POST /v1/discovery/candidates/{candidate_id}/approvals`, returning `GraphCandidateReceiptV1`. Operational Graph separately publishes playbooks over `POST /v1/knowledge/candidate-stages/{graph_draft_id}/publications`.
4. **Contract 11 (Action Execution Credentials):** Validates child tokens and mTLS workload principals for autonomous execution.
5. **Contract 18 (Authorized Management Projections):** Serves `ChangePageV1` metadata feeds and `OperationV1` progress projections to administrative consoles.
6. **Local Presentation Decoupling:** Control Plane does not participate in endpoint UI presentation; local HUD display and coordinate highlighting use Contract 20 (`shell-hud.v1`) entirely on-device, while central guidance distribution uses Contract 3.
7. **Contract 22 (Cloud Inference):** Transports transient single-shot requests and real-time audio WebSocket streams to LiteLLM under signed chunk proofs.
8. **Contract 24 (Reviewed Meeting Handoffs):** Coordinates reviewed meeting action handoffs without private audio or meeting identifiers.
9. **Contract 25 (Privacy Context Feed):** Ingests signed local privacy authorization proofs from Desktop Privacy Helper.

### Canonical HTTP Route Specifications
Control Plane exposes the following canonical endpoints (documented in `docs/architecture/contracts/control-plane-v1.openapi.json`):

#### 1. Web BFF Session Management
- `POST /v1/session/login`: Initiates confidential web login/step-up. Accepts `WebLoginStartV1`, generates PKCE challenge, sets 5-minute `__Host-oryn_login` cookie, returns Auth0 authorization URL.
- `GET /v1/identity/auth0/callback`: Confidential callback redemption. Validates state, nonce, PKCE verifier, sets 12-hour `__Host-oryn_session` cookie, redirects to same-origin `return_path`.
- `GET /v1/session`: Returns `WebSessionPresentationV1` containing session state, active organization, actor ID, and in-memory CSRF token.
- `POST /v1/session/activity`: Heartbeat updating `last_human_activity_at` when foreground UI detects real human input (coalesced 1/min).
- `POST /v1/identity/sessions/select-organization`: Switches active organization; validates live membership policy, rotates CSRF token, and invalidates old-tab subscriptions.
- `POST /v1/identity/sessions/logout`: Terminates session, revokes credential family in PostgreSQL, and clears cookies.

#### 2. Operations & Changes
- `GET /v1/operations/{operation_id}`: Returns `OperationV1` state, progress, and safe problem details.
- `POST /v1/operations/{operation_id}/cancellation`: Requests cooperative cancellation of running operation.
- `GET /v1/changes`: 25-second long poll returning `ChangePageV1` metadata invalidations.

#### 3. Contribution Synchronization
- `POST /v1/sync/bootstrap`: Returns sync control epoch and initial guidance cursor.
- `GET /v1/sync/changes`: Long poll for sync control changes.
- `POST /v1/sync/submissions`: Multipart contribution ingestion (envelope + artifacts).
- `GET /v1/sync/submissions/{id}/revisions/{rev}`: Custody status check returning `SubmissionStatusV1`.
- `POST /v1/sync/submissions/{id}/revisions/{rev}/withdrawals`: Submits `SubmissionClosureRequestV1`.
- `GET /v1/sync/guidance/manifest`: Streams guidance bundle manifest headers.
- `GET /v1/sync/guidance/bundles/{sha256}`: Downloads immutable signed guidance bundle.
- `POST /v1/sync/guidance/lease`: Obtains signed offline guidance access lease.
- `POST /v1/sync/review-keys/challenge`: Requests challenge for review key enrollment.
- `POST /v1/sync/review-keys/registrations`: Registers device review public key using `device:enroll` scope.

#### 4. Transient Cloud Inference
- `POST /v1/inference/authorizations`: Validates `InferenceAuthorizationRequestV1`, reserves budget, delegates grant signing to Identity.
- `POST /v1/inference/requests`: Single-shot batch dispatch with `X-Inference-Authorization` header; returns `InferenceResultV1`.
- `GET /v1/inference/streams/{stream_id}`: WebSocket upgrade (`Sec-WebSocket-Protocol: oryn.inference.v1`) using `X-Inference-Session` handle.
- `POST /v1/inference/streams/{stream_id}/renewals`: Renews 60-second authorization quantum for active stream.
- `POST /v1/inference/requests/{request_id}/cancellation`: Cancels request or stream; stops upstream provider immediately.
- `GET /v1/inference/routes/{operation}`: Returns certified limits and pricing descriptor (`InferenceRoutePricingV1`).

#### 5. Workflow Discovery and Candidate Review
- `GET /v1/discovery/candidates`: Access-filtered cursor-paginated list of candidates, filtered by caller's authorized audience expressions, team, and lifecycle state.
- `POST /v1/discovery/candidates`: Creates an explicit manual candidate draft with an authorized responsible team and audience expression; initializes with zero automatic repetition claims.
- `GET /v1/discovery/candidates/{candidate_id}`: Retrieves candidate header and current revision; revalidates caller permissions against contributing sources in real-time.
- `GET /v1/discovery/candidates/{candidate_id}/revisions/{revision}`: Retrieves specific immutable revision; invalidated or expired payloads report status without replaying purged text.
- `GET /v1/discovery/candidates/{candidate_id}/revisions/{revision}/sections/{section}`: Bounded section retrieval (`procedure`, `evidence`, `questions`, `history`) enforcing standard 256 KiB response caps.
- `POST /v1/discovery/candidates/{candidate_id}/reviews`: Transition candidate state (`begin_review`, `request_evidence`) under optimistic concurrency (`expected_revision`).
- `POST /v1/discovery/candidates/{candidate_id}/revisions`: Submits reviewer edits (`CandidateEditV1`) applying full replacement of the editable procedure subset.
- `POST /v1/discovery/candidates/{candidate_id}/proposals/{proposal_id}/decisions`: Accepts or declines proposed evidence diffs.
- `POST /v1/discovery/candidates/{candidate_id}/questions/{question_id}/answers`: Submits reviewer answers to open clarification questions.
- `POST /v1/discovery/candidates/{candidate_id}/approvals`: Approves candidate for guidance publication staging; verifies assigned owner remit, current source generation fence, and absence of blocking questions. Stages proposal to Operational Graph; does NOT publish.
- `POST /v1/discovery/candidates/{candidate_id}/rejections`: Owner rejects candidate and activates an owner-reviewed `SuppressionRuleV1`.
- `POST /v1/discovery/candidates/{candidate_id}/reconsiderations/{reconsideration_id}/decisions`: Owner decision (`accept`, `decline`) on suppression reconsideration requests.
- `POST /v1/discovery/candidates/{candidate_id}/splits`: Asynchronous candidate split operation returning 202 `OperationV1`.
- `POST /v1/discovery/candidate-merges`: Asynchronous candidate merge operation returning 202 `OperationV1`.
- `POST /v1/discovery/candidates/{candidate_id}/regenerations`: Triggers authorized re-synthesis from pinned source manifest returning 202 `OperationV1`.
- `POST /v1/discovery/suppression-rules/{rule_id}/retirements`: Owner-only retirement of active suppression rule.
- `POST /v1/discovery/candidates/{candidate_id}/retention-decisions`: Extends candidate retention under explicit enterprise policy grant.
- `POST /v1/discovery/demonstrations/{demonstration_id}/verifications`: Records evidenced outcome verification assessment for human demonstration.
- `GET /v1/discovery/opportunities`: Privacy-policy-filtered aggregate opportunity metrics with cohort privacy suppression.
- `PUT /v1/discovery/candidates/{candidate_id}/opportunity-assumptions`: Sets owner-supplied baseline and volume assumptions for potential savings projections.
- `GET /v1/discovery/configuration` & `PUT /v1/discovery/configuration`: Manages organization-level discovery configuration, certified embedding spaces, and responsible routing team. Requires `security_policy.manage` authority.
- `POST /v1/knowledge/candidate-stages/{graph_draft_id}/publications`: Operational Graph-owned publication boundary. Revalidates source fences and staged content hash before publishing immutable playbook.

### Product Requirements and Acceptance Mappings
Control Plane fulfills core enterprise coordination, tenant isolation, and privacy governance requirements defined in [PRODUCT.md](../../PRODUCT.md):

| Requirement ID | Summary | Control Plane Implementation Mapping |
|---|---|---|
| **ORY-001** | Zero data retention for raw private capture & transient processing | Enforces ephemeral inference proxying with zero disk caching, zero proxy body logging, and instant zeroing/unlinking of transient memory spools. |
| **ORY-006** | Voluntary contribution & custody integrity | Implements atomic 8-step contribution intake (Contract 2), verifying review signatures, storing 5-field lifetime identity, and enforcing independent checkpoint durability guards. |
| **ORY-007** | Immediate withdrawal propagation | Ingests withdrawal notices transactionally, fencing intake rows and invalidating downstream synthesis within the same PostgreSQL commit. |
| **ORY-026** | Multi-tenant organization isolation | Enforces PostgreSQL Row-Level Security (RLS) on all tenant tables, verifies session-organization bindings, and isolates pooled connections. |
| **ORY-027** | Web BFF session security | Employs single opaque `__Host-oryn_session` cookie, same-origin restrictions, CSRF tokens, and automatic 30-minute idle locking. |
| **ORY-028** | Command idempotency & deduplication | Scopes idempotency keys by organization, principal, method, and RFC 8785 body digest; retains sanitized 7-day replay responses and 24-month tombstones. |
| **ORY-029** | Asynchronous operation governance | Tracks slow work via `OperationV1` projections, HTTP 202 acceptance, and cooperative cancellation signaling. |
| **ORY-030** | Durable domain event fabric | Implements PostgreSQL transactional outbox and consumer delivery queues with FIFO per aggregate, 30s leases, and quarantine after 8 retries. |
| **ORY-040** | Execution context binding and validation | Binds execution context (`job` or `assist`) to tenant boundaries, case IDs, and authorized agent lineages. |
| **ORY-041** | Autonomous action authorization & fencing | Enforces deterministic authority guard ordering, validates signed admission receipts, and coordinates dual-digest consumption fences. |
| **ORY-042** | Step-up authentication verification | Re-authenticates privileged operations with mandatory fresh MFA verification within 5 minutes. |
| **ORY-043** | Action authorization expiration enforcement | Enforces strict monotonic deadlines (max 300s) on action authorizations; expired grants are rejected fail-closed. |
| **ORY-044** | Consequential action outcome readback verification | Binds action consumption to verified external readback; ambiguous outcomes transition to `Outcome Unknown`. |
| **ORY-045** | Authorized change notification & long polling | Provides 25-second bounded long polling with signed cursor envelopes, waking connected clients within 2 seconds of security revocations. |
| **ORY-046** | Honest outcome reporting boundary | Enforces strict separation between command admission and external mutation confirmation (`Outcome Unknown`). |
| **ORY-047** | Authority recovery protection & journal replay | Replays WORM recovery journal through latest checkpoint before opening restored database to production traffic. |
| **ORY-048** | Separation of duties enforcement | Prohibits self-approval of consequential actions without active delegation policies within ceiling limits. |
| **ORY-060** | Disaster recovery & site failover | Enforces RPO ≤ 15 minutes, RTO ≤ 4 hours, rejecting pre-recovery idempotency keys and maintaining independent recovery journal checkpoints. |
| **ORY-064** | Resource lifecycle and retention management | Enforces automated 7-day mutation response pruning, 24-month idempotency tombstone retention, and zero private capture storage. |
| **ORY-067** | Legal hold governance | Preserves audited submission records and custodial journals under active enterprise legal hold overrides. |
| **ORY-068** | Immediate security policy enforcement | Evaluates canonical authority guards within active transactions; policy increments immediately invalidate unconsumed tokens. |
| **ORY-069** | Controlled tenant offboarding | Terminates sessions, revokes active leases, halts async operations, and tombstoned organization data on suspension. |
| **ORY-070** | Tenant budget & spending caps | Atomically reserves monthly and purpose inference budgets prior to upstream invocation; encumbers unknown spend until operator reconciliation. |
| **ORY-071** | Route certification & server-side resolution | Resolves LiteLLM model endpoints exclusively server-side from operator vault configurations; client route overrides rejected. |
| **ORY-072** | Zero data retention verification for cloud inference | Verifies upstream provider agreements prohibiting model training and log persistence for all dispatched routes. |
| **ORY-073** | Conformance to US-only processing boundaries | Validates geographic confinement to US data centers across entire subprocessor chain. |
| **ORY-074** | Ephemeral inference proxying with zero body persistence | Operates inference pods with read-only filesystems, memory-only scratch spools, and disabled disk swap. |
| **ORY-075** | WebSocket streaming audio transport & chunk verification | Authenticates 100ms audio chunks over WebSocket with signed cryptographic proofs and cumulative hash chaining. |
| **ORY-076** | Single-shot batch inference coordination & route pricing | Coordinates transient vision and text analysis under published route pricing descriptors and 5-minute signed grants. |

## 3. Architectural invariants and non-negotiables

The Control Plane architecture enforces eight non-negotiable invariants across all operations:

1. **Transactional Tenant Isolation & Mandatory RLS:** Every database session opened for tenant work executes `SET LOCAL app.current_organization_id = $1` inside a PostgreSQL transaction before issuing queries. Direct table access without RLS is architecturally prohibited. Cross-tenant queries return 403 Forbidden without entity existence leakage.
2. **Strict Command Idempotency & 7-Day Sanitized Replay:** Every mutating operation requires a client-supplied idempotency key. Identical replays within 7 days receive the exact cached HTTP response without re-executing domain side effects. Replays with conflicting payload digests fail with HTTP 409 Conflict.
3. **Ephemeral Zero-Retention Cloud Inference Rails:** The Control Plane never persists prompts, raw screen frames, audio bytes, or transcript excerpts to non-volatile storage. Transient spooling uses in-memory `tmpfs` disks unlinked immediately upon request completion. Upstream requests route strictly to US-confined zero-retention LiteLLM endpoints.
4. **Transactional Outbox Durability & Aggregate FIFO:** Domain events and background worker deliveries commit atomically within the same PostgreSQL transaction as state mutations. Events for a given aggregate process in strict sequential order under 30-second renewable consumer leases. Poisoned events quarantine after 8 retries.
5. **Monotonic Sequence & Cursor Progression:** Every organization maintains a strictly increasing 64-bit sequence counter. Change notifications stream ordered diffs anchored by signed cursor envelopes. Stale or cross-organization cursors are rejected fail-closed.
6. **Atomic Contribution Custody Gating:** Contribution intake (Contract 2) commits atomically across review verification, 5-field lifetime identity insertion, payload storage, and outbox delivery. Unreconciled restore gaps mark payloads `lost_after_restore` without data resurrection.
7. **Embedded Stateless Authority Evaluation:** Consequential action authority is evaluated synchronously within the database transaction by the embedded Rust policy engine using `FOR SHARE` locks on canonical authority guards, eliminating distributed race conditions.
8. **Honest Outcome Reporting Boundary:** Command admission commits represent acceptance of requests, not proof of third-party external execution. Unverified external system outcomes report `Outcome Unknown` and prohibit automated retry.

## 4. Trust and deployment boundaries

### Process Roles and Isolation
Control Plane binaries are deployed into three distinct, non-overlapping Kubernetes process roles built from a unified Rust workspace:

```
+----------------------------------------------------------------------------------------------------+
|                                    KUBERNETES CLUSTER BOUNDARY                                     |
|                                                                                                    |
|  +---------------------------+  +-------------------------------+  +----------------------------+  |
|  |      API / BFF Pods       |  |     Durable Worker Pods       |  |   Inference Worker Pods    |  |
|  | - HTTP Ingress & Sessions |  | - Outbox / Inbox Queues       |  | - WebSocket Audio Streams  |  |
|  | - Synchronous Commands    |  | - Batch Background Handlers   |  | - LiteLLM Proxy / Memory   |  |
|  | - Change Long Polls       |  | - Quarantine Manager          |  | - Zero Body Persistence    |  |
|  | Replicas: 2 | Pool: 12    |  | Replicas: 2 | Pool: 8         |  | Replicas: 2 | Pool: 4      |  |
|  +-------------+-------------+  +---------------+---------------+  +-------------+--------------+  |
|                |                                |                                |                 |
|                +------------------------+       |       +------------------------+                 |
|                                         v       v       v                                          |
|                         +-----------------------------------------------+                          |
|                         |      PostgreSQL 18 HA Cluster (3 AZ)          |                          |
|                         |    (RLS Enforced, Max App Pool = 64)          |                          |
|                         +-----------------------------------------------+                          |
+----------------------------------------------------------------------------------------------------+
```

1. **API / BFF Role (`oryn-api`):**
   - Serves public and client-facing HTTPS traffic.
   - Manages web cookies, session secret digests, request admission, command dispatch, and change long polls.
   - Replicas: 2 | CPU: 250m req / 1000m lim | RAM: 256Mi req / 512Mi lim | DB Pool: 12 per pod.

2. **Durable Worker Role (`oryn-worker`):**
   - Consumes PostgreSQL transactional outbox rows and executes asynchronous background jobs.
   - Manages queue delivery leases, consumer retries, and quarantine handling.
   - Replicas: 2 | CPU: 250m req / 1000m lim | RAM: 256Mi req / 512Mi lim | DB Pool: 8 per pod.

3. **Inference Worker Role (`oryn-inference`):**
   - Terminates WebSocket connections and streams live audio to LiteLLM.
   - Operates entirely in memory; mounts no writable disk volumes.
   - Replicas: 2 | CPU: 500m req / 2000m lim | RAM: 512Mi req / 1Gi lim | DB Pool: 4 per pod.
   - Admitted pilot capacity: 20 concurrent sessions cluster-wide (12 max per pod).

### Database Connection Allocation
The total application PostgreSQL connection budget is capped at 64 connections across the cluster:
- 2 API pods × 12 connections = 24
- 2 Worker pods × 8 connections = 16
- 2 Inference pods × 4 connections = 8
- Dedicated reserve for LISTEN notifications, recovery journal completion, and safety operations = 16.
Long polls and streaming WebSocket connections release database connections immediately after query execution and must NEVER hold connection pool slots while waiting.

### Container Security Hardening
All pods adhere to restricted security standards:
- Read-only root filesystem (`readOnlyRootFilesystem: true`).
- Non-root user execution (`runAsNonRoot: true`, UID 10001).
- Drop all Linux capabilities (`capabilities: { drop: ["ALL"] }`).
- Seccomp profile `RuntimeDefault`.
- Ephemeral scratch memory: Inference pods mount `emptyDir: { medium: "Memory", sizeLimit: "256Mi" }` for transient chunk assembly; data is actively zeroed and unlinked upon socket close.
- HostPath volumes, swap space, and core dump generation are strictly disabled across all certified inference nodes.

### Network Segmentation
- API and Worker pods have no outbound Internet egress; they communicate exclusively with internal Kubernetes services and PostgreSQL.
- Inference pods have outbound egress strictly restricted to the internal LiteLLM gateway service over mTLS. LiteLLM alone possesses cloud model provider keys.
- Interservice communication requires mutual TLS with Infrastructure-issued certificates validating workload identity.

## 5. Internal architecture

### Ingress Pipeline and Execution Ordering
Incoming HTTP requests pass through a strictly ordered 14-stage validation and execution pipeline:

```
[1. Trusted TLS/Proxy Metadata]
       │
[2. Request & Trace Identity] ──> (Generate UUIDv4 X-Request-ID, W3C TraceId)
       │
[3. Size Admission] ────────────> (Headers ≤ 16KiB, URI ≤ 4KiB, Standard JSON ≤ 256KiB)
       │
[4. Abuse Ceiling] ─────────────> (IP/Endpoint keyed leaky bucket; login ≤ 10/min)
       │
[5. Credential Auth] ───────────> (Reject dual cookie+bearer; decode session/child token)
       │
[6. Session & Recovery Check] ──> (Check idle lock ≤ 30m, absolute ≤ 12h, recovery floor)
       │
[7. Browser Origin & CSRF] ─────> (Verify ORYN_PUBLIC_ORIGIN, validate X-CSRF-Token)
       │
[8. Schema Decoding] ───────────> (Strict Draft 2020-12 validation; reject unknown fields)
       │
[9. Policy Authorization] ──────> (evaluate_authorization via Identity Policy PDP)
       │
[10. Tenant Tx & Idempotency] ──> (Begin READ COMMITTED tx; set RLS vars; lock Idempotency-Key)
       │
[11. Domain Owner Execution] ───> (Invoke CommandHandler with shared TenantTransaction)
       │
[12. Outbox & Audit Insert] ────> (Insert domain_outbox event and audit row in same tx)
       │
[13. Commit & Checkpoint] ──────> (PostgreSQL commit; append recovery journal checkpoint)
       │
[14. Response Transmission] ────> (Echo X-Request-ID, return sanitized projection)
```

### Tenant Isolation and Database Row-Level Security
Multi-tenant isolation is enforced inside PostgreSQL:
1. Every tenant table has `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`.
2. When a `TenantTransaction` begins, it executes:
   ```sql
   SELECT set_config('oryn.organization_id', $1, true),
          set_config('oryn.actor_id', $2, true),
          set_config('oryn.principal_kind', $3, true),
          set_config('oryn.recovery_epoch', $4, true);
   ```
3. Application database roles are neither superusers nor have `BYPASSRLS`. If context variables are absent or invalid, RLS policies deny all rows.
4. When connections return to the pool, `RESET ALL` cleanses session state.

### Physical PostgreSQL Database Schemas
Control Plane persists transport and coordination state across twelve tables:

```sql
-- 1. Web Login Transactions
CREATE TABLE cp_login_transaction (
    transaction_id UUID PRIMARY KEY,
    request_id UUID NOT NULL,
    client_kind VARCHAR(32) NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    organization_id UUID,
    bound_actor_id VARCHAR(128),
    callback_url VARCHAR(512) NOT NULL,
    return_path VARCHAR(256) NOT NULL,
    state_digest VARCHAR(64) NOT NULL,
    nonce_digest VARCHAR(64) NOT NULL,
    encrypted_pkce_verifier BYTEA NOT NULL,
    code_challenge VARCHAR(128) NOT NULL,
    broker_issuer VARCHAR(256) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ
);
CREATE INDEX idx_cp_login_expiry ON cp_login_transaction(expires_at) WHERE consumed_at IS NULL;

-- 2. BFF Web & API Sessions
CREATE TABLE cp_session (
    session_id UUID PRIMARY KEY,
    person_session_id UUID NOT NULL,
    credential_family_id UUID NOT NULL,
    client_kind VARCHAR(32) NOT NULL,
    organization_id UUID,
    actor_id VARCHAR(128),
    device_id VARCHAR(128),
    profile_id VARCHAR(128),
    verified_subject VARCHAR(256) NOT NULL,
    absolute_not_after TIMESTAMPTZ NOT NULL,
    last_human_activity_at TIMESTAMPTZ NOT NULL,
    mfa_completed_at TIMESTAMPTZ,
    session_state VARCHAR(32) NOT NULL, -- bootstrap, active, locked, revoked
    recovery_epoch UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cp_session_org_actor ON cp_session(organization_id, actor_id);
CREATE INDEX idx_cp_session_expiry ON cp_session(absolute_not_after);

-- 3. Credential Digests (Secrets never stored in plaintext)
CREATE TABLE cp_credential_digest (
    digest_sha256 VARCHAR(64) PRIMARY KEY,
    credential_kind VARCHAR(32) NOT NULL, -- web_session, desktop_access, desktop_refresh, child_access
    session_id UUID NOT NULL REFERENCES cp_session(session_id) ON DELETE CASCADE,
    family_id UUID NOT NULL,
    generation BIGINT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    spent_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_cp_cred_session ON cp_credential_digest(session_id);
CREATE INDEX idx_cp_cred_family ON cp_credential_digest(family_id, generation);

-- 4. CSRF Secret Digests
CREATE TABLE cp_csrf_digest (
    session_id UUID PRIMARY KEY REFERENCES cp_session(session_id) ON DELETE CASCADE,
    digest_sha256 VARCHAR(64) NOT NULL,
    generation BIGINT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 5. Command Idempotency
CREATE TABLE cp_idempotency (
    organization_id UUID NOT NULL,
    principal_id VARCHAR(128) NOT NULL,
    method VARCHAR(16) NOT NULL,
    canonical_path VARCHAR(256) NOT NULL,
    idempotency_key UUID NOT NULL, -- UUIDv7
    request_digest VARCHAR(64) NOT NULL, -- RFC 8785 SHA-256
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128) NOT NULL,
    response_status INT NOT NULL,
    response_headers JSONB NOT NULL,
    sanitized_response_body JSONB NOT NULL,
    response_expires_at TIMESTAMPTZ NOT NULL, -- 7 days
    tombstone_expires_at TIMESTAMPTZ NOT NULL, -- 24 months
    recovery_epoch UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, principal_id, method, canonical_path, idempotency_key)
);
CREATE INDEX idx_cp_idemp_cleanup ON cp_idempotency(response_expires_at);

-- 6. Asynchronous Operations
CREATE TABLE cp_operation (
    operation_id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    owning_module VARCHAR(64) NOT NULL,
    initiator_kind VARCHAR(32) NOT NULL,
    initiator_id VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128) NOT NULL,
    state VARCHAR(32) NOT NULL, -- accepted, running, waiting_for_review, succeeded, failed, cancelled, outcome_unknown
    progress_completed INT,
    progress_total INT,
    problem_payload JSONB,
    result_ref JSONB,
    cancel_requested BOOLEAN NOT NULL DEFAULT FALSE,
    revision BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cp_op_org_state ON cp_operation(organization_id, state);

-- 7. Transactional Outbox
CREATE TABLE domain_outbox (
    organization_id UUID NOT NULL,
    event_id UUID NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(128) NOT NULL,
    aggregate_revision BIGINT NOT NULL,
    schema_revision BIGINT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    causation_id UUID NOT NULL,
    correlation_id UUID NOT NULL,
    sensitivity VARCHAR(32) NOT NULL,
    payload JSONB NOT NULL,
    published_at TIMESTAMPTZ, -- local fanout completion
    retained_until TIMESTAMPTZ NOT NULL, -- 7 days
    PRIMARY KEY (organization_id, event_id)
);
CREATE INDEX idx_outbox_unpublished ON domain_outbox(published_at) WHERE published_at IS NULL;

-- 8. Durable Queue Deliveries
CREATE TABLE domain_delivery (
    organization_id UUID NOT NULL,
    event_id UUID NOT NULL,
    consumer_name VARCHAR(64) NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(128) NOT NULL,
    aggregate_revision BIGINT NOT NULL,
    delivery_state VARCHAR(32) NOT NULL, -- pending, leased, retry_wait, succeeded, quarantined
    lease_owner VARCHAR(128),
    lease_token UUID,
    lease_expires_at TIMESTAMPTZ,
    attempt_count INT NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_code VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, event_id, consumer_name),
    FOREIGN KEY (organization_id, event_id) REFERENCES domain_outbox(organization_id, event_id) ON DELETE CASCADE
);
CREATE INDEX idx_delivery_claim ON domain_delivery(consumer_name, available_at) 
    WHERE delivery_state IN ('pending', 'retry_wait');
CREATE INDEX idx_delivery_agg_order ON domain_delivery(organization_id, aggregate_type, aggregate_id, aggregate_revision);

-- 9. Consumer Inbox Deduplication
CREATE TABLE domain_inbox (
    consumer_name VARCHAR(64) NOT NULL,
    organization_id UUID NOT NULL,
    event_id UUID NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retained_until TIMESTAMPTZ NOT NULL, -- 7 days
    PRIMARY KEY (consumer_name, organization_id, event_id)
);

-- 10. Inference Budget Buckets
CREATE TABLE inference_budget_bucket (
    organization_id UUID NOT NULL,
    utc_month VARCHAR(7) NOT NULL, -- YYYY-MM
    bucket_kind VARCHAR(32) NOT NULL, -- organization, purpose
    purpose VARCHAR(128),
    operation VARCHAR(128),
    budget_limit_microusd BIGINT NOT NULL,
    settled_microusd BIGINT NOT NULL DEFAULT 0,
    reserved_microusd BIGINT NOT NULL DEFAULT 0,
    policy_revision BIGINT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, utc_month, bucket_kind, purpose, operation),
    CONSTRAINT chk_positive_settled CHECK (settled_microusd >= 0),
    CONSTRAINT chk_positive_reserved CHECK (reserved_microusd >= 0)
);

-- 11. Inference Reservations
CREATE TABLE inference_reservation (
    reservation_id UUID PRIMARY KEY,
    request_id UUID NOT NULL UNIQUE,
    authorization_id UUID NOT NULL UNIQUE,
    organization_id UUID NOT NULL,
    purpose VARCHAR(128) NOT NULL,
    operation VARCHAR(128) NOT NULL,
    route_id VARCHAR(128) NOT NULL,
    route_revision BIGINT NOT NULL,
    policy_revision BIGINT NOT NULL,
    reserved_microusd BIGINT NOT NULL,
    settled_microusd BIGINT NOT NULL DEFAULT 0,
    reservation_state VARCHAR(32) NOT NULL, -- reserved, dispatched, settled, released, usage_unknown
    owner_instance VARCHAR(128) NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);
CREATE INDEX idx_res_cleanup ON inference_reservation(deadline) WHERE reservation_state = 'reserved';

-- 12. Inference Owner Leases (WebSocket Affinity)
CREATE TABLE inference_owner_lease (
    stream_id UUID PRIMARY KEY,
    session_handle_sha256 VARCHAR(64) NOT NULL UNIQUE,
    owner_pod_ip VARCHAR(64) NOT NULL,
    owner_mtls_identity VARCHAR(256) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
```

## 6. State and lifecycle

### Web BFF Session Protocol
The confidential web BFF flow avoids exposing sensitive bearer tokens, refresh tokens, or raw credentials to the browser:
1. **Initiation:** Client calls `POST /v1/session/login`. BFF creates `cp_login_transaction`, stores SHA-256 digests of `state` and `nonce`, encrypts the PKCE verifier into Vault, and sets `__Host-oryn_login` cookie (HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age=300s).
2. **Redemption:** Auth0 redirects to `GET /v1/identity/auth0/callback`. BFF validates cookie, state, nonce, and single-use status. It redeems the code server-side against Auth0, validates token signatures, and purges the PKCE verifier ciphertext.
3. **Session Establishment:** BFF creates `cp_session` and stores the SHA-256 digest of an opaque 256-bit secret in `cp_credential_digest`. It sets `__Host-oryn_session` (Secure, HttpOnly, SameSite=Lax, Path=/, no Domain, Max-Age ≤ 12h).
4. **CSRF Protection:** Browser requests obtain a distinct 256-bit CSRF secret in memory via `GET /v1/session`. Unsafe mutations (`POST`, `PUT`, `DELETE`, `PATCH`) must supply exact `Origin: <ORYN_PUBLIC_ORIGIN>` and `X-CSRF-Token: <token>`.
5. **Idle Timeout:** Foreground client periodically reports user interactions via `POST /v1/session/activity` (coalesced 1/min). If `last_human_activity_at` exceeds 30 minutes, operations fail with `CP_SESSION_LOCKED`. Re-authentication via Auth0 unlocks the session without extending the original 12-hour absolute deadline.
6. **Organization Switching:** Client submits `POST /v1/identity/sessions/select-organization`. Identity Policy validates membership. BFF rotates the CSRF token, replaces session organization scope, and assigns a new session ID. Requests with old `X-Oryn-Session-ID` return `CP_SCOPE_CHANGED` to prevent multi-tab cross-organization corruption.

### Mutation Replay and Concurrency Control
General mutations enforce strict idempotency via UUIDv7 `Idempotency-Key`:
1. **Scope:** Key is scoped to `(organization_id, principal_id, method, canonical_path, key)`.
2. **Pre-Validation:** UUIDv7 timestamp must be within the last 24 hours and no more than 5 seconds in the future.
3. **Hashing:** Canonical request body is hashed using RFC 8785 JSON Canonicalization Scheme (JCS).
4. **Atomic Lock & Execute:** Inside a PostgreSQL transaction, Control Plane attempts to insert `cp_idempotency`.
   - If key does not exist: Handler executes, committed response status, headers, and sanitized body are stored, and transaction commits atomically.
   - If matching key and digest exist: Returns exact committed response.
   - If key exists with different digest: Rejects with 409 `CP_IDEMPOTENCY_CONFLICT`.
   - If key expired (> 7 days): Rejects with 410 `CP_IDEMPOTENCY_EXPIRED` (`retry_safety: status_only`).
5. **Tombstone Retention:** Compact key/digest/outcome tombstones are retained for 24 months to satisfy audit schedules.

### Queue, Outbox, and Delivery Protocol
Domain events adhere to an immutable transactional outbox pattern:
1. **Outbox Commitment:** Domain commands atomically insert business state, `domain_outbox` rows, and audit records in one transaction.
2. **Local Fanout:** Background worker polls `domain_outbox` with `FOR UPDATE SKIP LOCKED`. For each event, it inserts `domain_delivery` rows for all registered consumers and marks `published_at = NOW()` in the same transaction.
3. **Ordered Claiming:** Consumers query `domain_delivery` for the lowest incomplete `aggregate_revision` for their consumer name.
4. **Leasing:** Worker claims a 30-second lease with an opaque `lease_token`, renewing every 10 seconds.
5. **Deduplication:** Local consumer executes business logic, inserts a dedup row into `domain_inbox`, and marks delivery `succeeded` within a single transaction.
6. **Poison Quarantine:** Deliveries retry up to 8 times with full exponential backoff and jitter `uniform(0, min(300s, 1s * 2^attempt))`. Upon the 8th failure, the row transitions to `quarantined`. That specific aggregate is blocked for that consumer until audited administrative repair; other aggregates and consumers continue unobstructed.
7. **Fair Tenant Scheduling:** Workers cycle across ready organizations, capping any single tenant at 4 concurrent deliveries out of 8 total worker slots.

### Contribution Sync Acceptance & Custody Protocol
Sync submission intake follows an atomic 8-step protocol:
1. **Authentication & Preflight:** Verify child token (`audience: "sync"`), membership, device enrollment, PNG bounds (≤ 4 images, ≤ 1 MiB each, ≤ 1920x1080), and multipart body cap (≤ 5 MiB).
2. **Authority Guard Lock:** Begin `READ COMMITTED` transaction; lock authority guards in established sorted order.
3. **Identity Insertion:** Execute `INSERT INTO sync_submission_identity (submission_id, organization_id, profile_id, device_id, client_assigned_number) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (organization_id, profile_id, client_assigned_number) DO NOTHING RETURNING submission_id`. Lock canonical row `FOR UPDATE`.
4. **Terminal / Conflict Evaluation:**
   - If terminal (`withdrawn`): Return 410 `SYNC_RELEASE_CANCELLED`.
   - If existing differing digest: Return 409 `SYNC_DIGEST_CONFLICT`.
   - If matching identity with receipt: Return 200 with original receipt.
5. **Atomic Ingestion:** For new identity, insert destination intake queue rows, artifacts into `sync_artifact`, signed delivery receipt, audit entry, and recovery journal outbox entry. Commit transaction.
6. **Vault Receipt Signing:** Sign delivery receipt via Vault Transit under 500 ms timeout.
7. **Durability Checkpoint:** Append minimal 5-field custody projection `{organization_id, contribution_id, revision, content_digest, disposition}` to the independent recovery journal. Return HTTP 201 only after checkpoint acknowledgment.
8. **Truthful Status Surface:** Status check `GET /v1/sync/submissions/{id}/revisions/{rev}` returns `SubmissionStatusV1` with `content_state`. If intake was pruned or lost after disaster restore, `content_state` is set to `pruned` or `lost_after_restore`, and `delivery_receipt` may be null.

### Transient Cloud Inference Lifecycle
Cloud inference execution adheres to strict ephemeral constraints:
1. **Admission & Reservation:** Client calls `POST /v1/inference/authorizations`. Control Plane locks organization and purpose budget buckets, checks concurrency, reserves maximum bounded spend in `inference_reservation`, and requests Identity Policy to issue `SignedInferenceAuthorizationV1`. Returns signed grant and 256-bit random session handle.
2. **Single-Shot Batch:** Client calls `POST /v1/inference/requests` passing signed grant in `X-Inference-Authorization`. Server validates exact RFC 8785 hash match of `input_scope` and `input_manifest`. Streams payload to LiteLLM, records actual tokens, settles budget reservation once, and returns `InferenceResultV1`. No prompt or response is ever written to disk or database.
3. **WebSocket Audio Streaming:**
   - Client initiates WebSocket connection to `/v1/inference/streams/{stream_id}` with `X-Inference-Session` handle.
   - Initial text frame submits signed authorization grant; server verifies handle digest in `inference_owner_lease`.
   - Audio chunks (100 ms, 16 kHz mono PCM, max 3,200 bytes) are sent as binary messages prefixed by signed chunk proof `SignedInferenceChunkProofV1`.
   - Server verifies sample ranges, sequential monotonicity, consent revision, and device signature before forwarding PCM bytes to LiteLLM.
   - Authority is renewed every 60 seconds (`POST /v1/inference/streams/{stream_id}/renewals`); streams terminate immediately if renewal fails or connection drops.
4. **Budget Settlement:** Upon completion or cancellation, actual usage settles in `inference_budget_bucket`. If a worker crashes ambiguously after dispatch, reservation transitions to `usage_unknown` and encumbers funds until operator reconciliation.

## 7. Error and edge-case behavior

### Standard RFC Problem Payload
All non-2xx responses return RFC 7807 problem payloads conforming to `ControlPlaneProblemV1`:

```json
{
  "schema_id": "control-plane.problem.v1",
  "type": "urn:oryn:problem:revision-conflict",
  "title": "Revision Conflict",
  "status": 409,
  "detail": "Resource revision drift detected. Client expected revision 4, but current revision is 5.",
  "code": "CP_REVISION_CONFLICT",
  "request_id": "99999999-8888-4777-8666-555555555555",
  "retry_safety": "status_only",
  "retry_after_seconds": null,
  "operation_id": null
}
```

### Problem Code and HTTP Status Mapping
Control Plane defines twenty closed problem codes:

| HTTP Status | Error Code | Meaning and Edge-Case Behavior |
|---|---|---|
| **400** | `CP_SCHEMA_INVALID` | Malformed JSON body, unparseable headers, or schema validation failure. |
| **400** | `CP_CREDENTIAL_CONFLICT` | Simultaneous cookie and bearer credentials supplied. |
| **400** | `CP_CURSOR_INVALID` | Tampered, unparseable, or out-of-order change feed cursor token. |
| **401** | `CP_AUTH_REQUIRED` | Missing, expired, or revoked authentication credentials. |
| **401** | `CP_SESSION_LOCKED` | Web session locked due to 30 minutes of human inactivity. Re-auth required. |
| **403** | `CP_ACCESS_DENIED` | Authorization denied by Identity Policy evaluator. |
| **403** | `CP_CSRF_INVALID` | Missing or invalid `X-CSRF-Token` header on unsafe web request. |
| **403** | `CP_SCOPE_CHANGED` | Browser tab targeted an organization superseded by another tab switch. |
| **404** | `CP_RESOURCE_NOT_FOUND` | Resource does not exist or belongs to another organization (no count leakage). |
| **409** | `CP_REVISION_CONFLICT` | `If-Match` revision header does not match current database revision. |
| **409** | `CP_IDEMPOTENCY_CONFLICT` | Reused idempotency key with differing RFC 8785 request body digest. |
| **409** | `CP_RESYNC_REQUIRED` | Change feed cursor older than 7-day retention log; fresh snapshot required. |
| **410** | `CP_IDEMPOTENCY_EXPIRED` | Mutation previously completed, but 7-day response replay has expired. |
| **410** | `CP_OPERATION_EXPIRED` | Asynchronous operation projection pruned (> 30 days old). |
| **413** | `CP_PAYLOAD_TOO_LARGE` | Body exceeds limit (256 KiB JSON, 5 MiB sync multipart, route inference cap). |
| **428** | `CP_PRECONDITION_REQUIRED` | Mutation requires `If-Match` revision header. |
| **429** | `CP_RATE_LIMITED` | Coarse IP rate limit, per-tenant burst cap, or inference concurrency exceeded. |
| **503** | `CP_DEPENDENCY_UNAVAILABLE` | Vault Transit or database connection pool exhausted. |
| **503** | `CP_DELIVERY_UNKNOWN` | Transaction commit state uncertain following database timeout. |
| **503** | `CP_RECOVERY_REQUIRED` | Database restored from backup; pre-recovery idempotency key blocked. |

### Inherited Domain Error Namespaces
Preserve domain-specific error literals on respective endpoints without translation to `CP_*` aliases:
- Identity endpoints return `IdentityProblemV1` (`IDENTITY_*` error codes).
- Contribution sync endpoints return `SyncProblemV1` (`SYNC_*` error codes).
- Cloud inference endpoints return eleven canonical `INFERENCE_*` codes (`INFERENCE_AUTH_INVALID`, `INFERENCE_ROUTE_UNAVAILABLE`, `INFERENCE_CAPABILITY_UNSUPPORTED`, `INFERENCE_REGION_DISALLOWED`, `INFERENCE_BUDGET_EXCEEDED`, `INFERENCE_LIMIT_EXCEEDED`, `INFERENCE_UPSTREAM_FAILURE`, `INFERENCE_INPUT_STALE`, `INFERENCE_OUTPUT_INVALID`, `INFERENCE_CANCELLED`, `INFERENCE_RETRY_PAUSED`).

## 8. Observability and audit

### Transactional Audit Logging
Every security decision, role assignment, policy revision, contribution acceptance, and consequential domain mutation emits an audit entry committed inside the same PostgreSQL transaction. If audit insertion fails, the entire business transaction rolls back.

Audit records capture:
- Unique event UUID, request UUID, trace ID.
- Organization ID, actor ID, or workload ID.
- Owning module, resource key, and operation name.
- Policy revision, access revision, and schema versions.
- Outcome (`admitted`, `rejected`, `consumed`, `reconciled`), reason code, and UTC timestamp.
- Causation and correlation IDs.

Routine polling requests, WebSocket audio chunks, and session activity heartbeats do not emit persistent audit rows. Consequential audit records are retained for 24 months.

### Safe Metrics and Telemetry
All metrics export bounded categorical labels; raw URLs, IDs, prompts, and headers are excluded:
- `oryn_http_request_duration_seconds` (route template, method, status code).
- `oryn_queue_lag_seconds` (consumer name, aggregate type).
- `oryn_queue_quarantine_total` (consumer name, aggregate type, error code).
- `oryn_db_pool_wait_duration_seconds` (pool name).
- `oryn_recovery_pending_checkpoints` (organization).
- `oryn_inference_active_sessions` (operation, route).
- `oryn_inference_budget_encumbered_microusd` (organization, purpose).

## 9. Security and threat model

### Threat Mitigation Matrix
Control Plane enforces defenses against the major platform threats identified in [threat-model.md](../architecture/threat-model.md):

| Threat Vector | Attack Scenario | Control Plane Defense |
|---|---|---|
| **Cross-Tenant Leakage** | Tenant A queries Tenant B resource ID, cursor, or delivery. | PostgreSQL RLS denies row retrieval; missing context returns identical 404; pool reuse executes `RESET ALL`. |
| **Session Fixation & CSRF** | Malicious site executes browser mutation on behalf of active web session. | `__Host-oryn_session` cookie is SameSite=Lax/Secure; unsafe methods require exact `Origin` match plus memory-bound `X-CSRF-Token`. |
| **Multi-Tab Stale Org Drift** | User switches organization in Tab A; Tab B issues command. | Session scope is switched atomically; requests must provide matching `X-Oryn-Session-ID`; stale tabs receive 403 `CP_SCOPE_CHANGED`. |
| **Ancient Key Mutation Replay** | Attacker replays deleted command key after tombstone pruning. | Rejects first-use UUIDv7 keys older than 24 hours or newer than +5 seconds; tombstones retained 24 months. |
| **Disaster Recovery Replay** | Backup restored; attacker replays command that committed after backup snapshot. | Reopening sets `recovery_admission_floor` to reopening UTC + 5s; pre-restore keys fail with 503 `CP_RECOVERY_REQUIRED`. |
| **Audio Stream Substitution** | Rogue client attempts to inject unverified audio into meeting stream. | Every 100 ms chunk requires `SignedInferenceChunkProofV1` signed by enrolled device key, binding sequence, samples, and consent. |
| **Prompt & Transcript Disclosure** | Compromised worker memory dump or debug log discloses private audio. | Zero disk caching, zero proxy body logging, memory-only spools zeroed on exit, LiteLLM US-only ZDR route pinning. |
| **Budget Exhaustion Attack** | Concurrency burst drains organization monthly inference allowance. | Atomic bucket lock and reservation prior to upstream dispatch; zero/missing allowance blocks admission immediately. |

## 10. Test strategy

### Conformance Verification Procedures
Specification conformance is verified using offline schema registries and deterministic test fixtures:
- `docs/architecture/contracts/control-plane-v1.schema.json`
- `docs/architecture/contracts/cloud-inference-v1.schema.json`
- `docs/architecture/contracts/control-plane-v1.fixtures.json`
- `docs/architecture/contracts/cloud-inference-v1.fixtures.json`
- Validation cases verify positive and negative schema boundaries.
- Cryptographic binding vectors verify exact Ed25519 signature checks, hash bindings, and substitution tamper resistance.

### Stateful Implementation Acceptance Test Procedures
Future backend implementation will be validated against sixteen rigorous stateful scenarios:

```
+----------------------------------------------------------------------------------------------------+
|                                    STATEFUL ACCEPTANCE SCENARIOS                                   |
|                                                                                                    |
|  1. Multi-Tenant RLS Query Leakage       9. Concurrent Contribution & Withdrawal                   |
|  2. Cross-Tab Organization Switching    10. Restored Identity & Truthful Status                   |
|  3. 30-Minute Inactivity Session Lock   11. Checkpoint Signing Failure & Rollback                 |
|  4. Native Refresh Race & Loss          12. Admission Loss After Checkpoint Commit                |
|  5. Idempotent Command Replay & Conflict 13. Inference Grant & Proof Substitution                  |
|  6. Post-PITR Pre-Recovery Key Fence    14. WebSocket Owner Crash & Socket Loss                   |
|  7. Invalid Job Start Preflight         15. PauseCapture vs Normal Meeting Stop                   |
|  8. Outbox Poison Event Quarantine      16. Concurrency Last-Dollar Budget Race                   |
+----------------------------------------------------------------------------------------------------+
```

1. **Multi-Tenant RLS Query Leakage:**
   - *Input:* OrgA principal queries OrgB object ID, change cursor, or delivery row.
   - *Observable Result:* HTTP 404 `CP_RESOURCE_NOT_FOUND` without leaking object existence or total count.
   - *Failure Injection:* Omit `oryn.organization_id` session setting; verify RLS denies all reads and writes.

2. **Cross-Tab Organization Switching:**
   - *Input:* Browser session switches organization in Tab A; Tab B sends mutation with old organization session header.
   - *Observable Result:* Tab B rejected with HTTP 403 `CP_SCOPE_CHANGED`; no mutation applied.

3. **30-Minute Inactivity Session Lock:**
   - *Input:* Web session maintains long poll for 35 minutes with no human activity reported.
   - *Observable Result:* Next privileged command returns HTTP 401 `CP_SESSION_LOCKED`; polls did not extend activity timer.

4. **Native Refresh Race & Loss:**
   - *Input:* Native client issues refresh; response is lost in transit; client replays spent refresh token.
   - *Observable Result:* Second refresh rejected; entire credential family revoked; fresh login required.

5. **Idempotent Command Replay & Conflict:**
   - *Input:* Two identical commands race with same UUIDv7 key; then third request with same key but differing body.
   - *Observable Result:* Exactly one execution; first replay returns original result; altered body returns 409 `CP_IDEMPOTENCY_CONFLICT`.

6. **Post-PITR Pre-Recovery Key Fence:**
   - *Input:* Database restored to 14:00 UTC. Client submits command with key generated at 14:05 UTC.
   - *Observable Result:* Rejected with HTTP 503 `CP_RECOVERY_REQUIRED`; command never re-executes.

7. **Invalid Job Start Preflight (ORY-041):**
   - *Input:* Client initiates workflow job with missing parameters or stale playbook revision.
   - *Observable Result:* HTTP 400 rejection; no job row or execution principal minted; rejection audited.

8. **Outbox Poison Event Quarantine:**
   - *Input:* Consumer fails processing event 8 consecutive times.
   - *Observable Result:* Delivery row transitions to `quarantined`; subsequent events for that aggregate block; unrelated aggregates process normally.

9. **Concurrent Contribution & Withdrawal:**
   - *Input:* Worker attempts simultaneous `POST /submissions` and `POST /withdrawals` for same contribution UUID.
   - *Observable Result:* Terminal withdrawal wins serialization; identity marked `withdrawn`; no synthesis occurs.

10. **Restored Identity & Truthful Status:**
    - *Input:* Query status of historically accepted contribution whose payload was lost during PITR restore.
    - *Observable Result:* HTTP 200 `SubmissionStatusV1` with `disposition: "accepted"`, `content_state: "lost_after_restore"`, and `delivery_receipt: null`.

11. **Checkpoint Signing Failure & Rollback:**
    - *Input:* Vault KMS signing timeout during sync submission or authority change.
    - *Observable Result:* Entire PostgreSQL transaction rolls back; no partial intake row or uncheckpointed receipt issued.

12. **Admission Loss After Checkpoint Commit:**
    - *Input:* Action admission commits and checkpoints; client disconnects before receiving HTTP 200.
    - *Observable Result:* Status reconciliation confirms consumed state; action is never dispatched twice.

13. **Inference Grant & Proof Substitution:**
    - *Input:* Client submits audio chunk with altered sample byte or request ID.
    - *Observable Result:* Chunk proof verification fails; chunk discarded immediately; stream closes with error.

14. **WebSocket Owner Crash & Socket Loss:**
    - *Input:* Inference worker pod terminates during active audio stream.
    - *Observable Result:* Upstream LiteLLM stream cancelled; memory zeroed; client observes interruption; no cross-pod session transfer.

15. **PauseCapture vs Normal Meeting Stop:**
    - *Input:* Meeting intelligence signals `PauseCapture` vs normal meeting completion.
    - *Observable Result:* `PauseCapture` cancels active stream; normal stop allows bounded final transcribe route under certified cap.

16. **Concurrency Last-Dollar Budget Race:**
    - *Input:* Multiple requests concurrently consume the last $1.00 of organizational inference budget.
    - *Observable Result:* Atomic row lock admits exactly one request; subsequent requests return 429 `INFERENCE_BUDGET_EXCEEDED`; zero overspend.

## 11. Performance and operations

### Pilot Load Envelope
The initial pilot deployment is dimensioned and admission-controlled for:
- 10 enrolled enterprise organizations.
- 2,000 enrolled endpoints (desktop companions and mobile agents).
- 200 concurrently active endpoints (including 25-second long-poll connections).
- 25 steady-state management requests per second (peak burst 50 req/s, excluding polls/streams).
- 20 concurrent cloud inference sessions cluster-wide (capped at 12 per inference pod).

### Latency and Availability Service Level Objectives (SLOs)
Control Plane targets the following operational boundaries at admitted pilot load:
- **Service Availability:** 99.9% uptime excluding scheduled maintenance.
- **Ordinary Reads:** p95 latency ≤ 250 ms.
- **Committed Commands:** p95 acknowledgment latency ≤ 500 ms (database commit + audit).
- **Identity Authorization:** Pure evaluator p95 ≤ 1 ms; authorization/consume p95 ≤ 100 ms.
- **Change Notification Propagation:** Safety revocations wake connected long polls within ≤ 2 seconds.

### Disaster Recovery and Site-Loss Targets
- **Ordinary Canonical Data:** Recovery Point Objective (RPO) ≤ 15 minutes; Recovery Time Objective (RTO) ≤ 4 hours.
- **Authority and Custody Guarantees:** Acknowledged authority decisions, action consumption fences, and submission custody records are backed by the independent immutable recovery journal; they remain fail-closed, non-rollback, and immune to snapshot loss.

### Graceful Termination Sequence
Upon receiving SIGTERM, pods execute a 30-second graceful termination sequence:
1. Mark Kubernetes readiness probe unready; stop accepting new ingress connections.
2. Allow active HTTP requests up to 10 seconds to complete.
3. Allow active database worker transactions up to 1 second to commit or roll back.
4. Active WebSocket inference streams transmit `session.failed` with reason `interrupted`, cancel upstream LiteLLM calls, zero memory buffers, and close sockets.
5. Settle active reservations as `usage_unknown` if upstream outcome is unconfirmed.
6. Terminate process.

## 12. Architecture decisions and open questions

### Resolved Architecture Decisions (ADR Summary)
Key architectural decisions settled for the Control Plane component (formalized in [ADR-0012](../adr/0012-control-plane-transport-durability-and-inference.md)):
1. **Rust / Axum / SQLx Framework Family:** Axum and Tower provide type-safe HTTP routing and middleware composition; SQLx ensures compile-time checked PostgreSQL queries. Domain logic remains decoupled from HTTP transport types.
2. **PostgreSQL-Only Transactional Event Fabric:** Rejected dedicated message brokers (Kafka/RabbitMQ) for pilot. PostgreSQL transactional outbox (`domain_outbox`), delivery queues (`domain_delivery`), and inbox deduplication (`domain_inbox`) provide atomic multi-tenant consistency with zero operational broker overhead.
3. **Confidential BFF Web Session Architecture:** Rejected browser-stored JWT access/refresh tokens. Control Plane issues a single opaque, HttpOnly, SameSite=Lax `__Host-oryn_session` cookie tied to server-side session records, protected by memory-bound CSRF tokens and 30-minute idle locks.
4. **Transient Non-Resumable Cloud Inference:** Rejected inference session resumption across pods. Interservice inference uses ephemeral WebSocket connections bound to pod IP; socket disconnect or node failure immediately terminates upstream model calls and discards transient state.
5. **Independent Recovery Journal Custody Extension:** Extended the independent recovery journal to record minimal 5-field custody projections, ensuring contribution acceptance and action fences survive PostgreSQL PITR restores.

### Infrastructure Prerequisites and Dependencies
The following capabilities are provided by [infrastructure-security](infrastructure-security.md) and must be operational before Control Plane deployment:
- Conformance-certified Kubernetes cluster with three failure domains.
- PostgreSQL 18 HA cluster with streaming replication and automated PITR backup.
- HashiCorp Vault Transit engine for Ed25519 cryptographic signing and envelope encryption.
- Pinned, US-only, zero-data-retention LiteLLM gateway with certified route pricing.
- WORM immutable audit storage and independent recovery journal append service.
