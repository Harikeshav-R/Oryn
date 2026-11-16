# Application Adapters and Integration Management Component Specification

Status: Detailed technical specification — implementation pending

## 1. Purpose and ownership

**Source references:** [TECHNICAL.md §§4.1, 4.3, 4.5, 4.7, 5.6, 6.3, 7.2 Contracts 6/11–13, 11.4](../../TECHNICAL.md) | [PRODUCT.md §§3.3–6, 13.5, 16.4–7, 17; ORY-028, ORY-041, ORY-043–044](../../PRODUCT.md) | [GLOSSARY.md](../../GLOSSARY.md) | [ADR-0016](../adr/0016-application-adapter-qualification-and-dispatch-boundaries.md)

### Core Responsibility
The Application Adapters and Integration Management component defines, qualifies, brokers, and deterministically executes permitted interactions across external business applications (cloud SaaS APIs, web portals, and local desktop applications). It maintains immutable capability snapshots, brokers least-privileged credential leases via an out-of-process egress broker, enforces device-wide local execution reservations, executes operations with strict one-shot submission journaling, and provides independent readback evidence for downstream verification.

### Authoritative Units and Ownership Boundaries

| Unit | Location / Component Owner | Responsibility |
|---|---|---|
| `ApplicationCapabilityRegistry` | Rust module in existing Axum/Tokio/SQLx Control Plane | Immutable capability definitions, live status, qualification records, compatibility projections |
| `ConnectionManager` | Rust module in existing Control Plane | Connection metadata, OAuth transaction orchestration, account/environment verification, health probes, and revocation |
| `AdapterPreparation` | Adapter component; executed in cloud worker or local worker | Validates declared arguments against schema, resolves exact records, captures expected before-state, stages diffs, and registers trusted policy facts with Identity |
| `AdapterSubmissionJournal` | Adapter component; PostgreSQL 18 for cloud, local execution audit for device dispatch | Durable external dispatch identity, attempt claims, and submission receipts; never acts as case checkpoints or authority fences |
| `oryn-adapter-worker` | Signed first-party Rust executable; cloud container or unprivileged Shell-supervised local child | Deterministic operation implementation; zero model inference, arbitrary scripts, or runtime third-party plugins |
| `AdapterEgressBroker` | Infrastructure-owned credential/egress enforcement process | Vault credential custody and injection; enforces HTTP method, registered vendor origin, URL path template, resource scope, environment, and operation restrictions independently of worker requests |
| `AdapterReadback` | Separate worker/credential role | Fetches independently requested application evidence; never issues business verdicts or outcome assessments |
| `LocalExecutionReservationBroker` | Privacy Helper; relayed by Desktop Shell / browser broker | Manages one device-wide reservation across browser and native execution modalities, covering both batch jobs and HUD assists |

### Cloud Worker Isolation Key
Cloud worker processes are strictly isolated by the tuple:
```text
(organization_id, connection_id, environment, credential_role)
```
Bounded worker reuse is permitted only within this exact tuple. Credential roles are strictly segregated into `actuation` and `readback`. Workers and runners receive opaque, operation-scoped handles, never vendor access tokens or client secrets. No AI model or provider networking belongs in this component; local deterministic processing and cloud LiteLLM inference boundaries remain decoupled.

---

## 2. Product requirements

### Key Product Requirements ([PRODUCT.md §§3.3–6, 13.5, 16.4–7, 17](../../PRODUCT.md))
- **Strict Scope Boundaries (ORY-028):** Adapters enforce that an agent or assist session cannot access applications, endpoints, records, or fields outside its approved resource scope and customer allowlist.
- **Preflight Connection & Qualification Validation (ORY-041):** Verifies connection health, account binding, and renewable 30-day operation qualification before job execution or action dispatch begins.
- **Independent Readback Evidence Generation (ORY-043):** Provides independently acquired readback evidence following action submission; prevents unverified actions from being marked complete.
- **Ambiguous Submission Protection (ORY-044):** When an external request times out, drops connection, or returns an ambiguous status, the adapter records the submission outcome as `unknown`, halting automated retries and requiring workflow-level reconciliation.

---

## 3. Upstream and downstream contracts

**Catalog references:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md) (Contracts 6, 11, 12, 13)

### Upstream Consumed Contracts
- **Identity & Authority (Contract 11):** Consumes `VerifiedPrincipal`, `SignedActionAuthorizationV1`, `SignedActionApprovalV1`, and `SignedActionAdmissionV1` from [identity-policy](identity-policy.md). Consumes consumed-fence receipts; registers trusted `ActionPolicyFactsV1`.
- **Infrastructure Security:** Consumes credential leases from HashiCorp Vault via `AdapterEgressBroker` under [infrastructure-security](infrastructure-security.md).
- **Desktop Shell & Privacy Helper:** Consumes local reservation state (`local_execution_reservation_v1`, `execution_reservation_lease_v1`, and `evaluation_execution_v1` under `browser-bridge.v1` major 1, minor 6) and supervised process channels (`shell-adapter.v1` major 1, minor 2) from [desktop-shell](desktop-shell.md) and [local-privacy-storage](local-privacy-storage.md).

### Downstream Produced Contracts
- **Contract 6 (`application-capability-v1.schema.json`):** Produces immutable `ApplicationCapabilitySnapshotV1` and live `ApplicationCapabilityStatusV1` via `ApplicationCapabilityPort`:
  ```rust
  pub trait ApplicationCapabilityPort: Send + Sync {
      fn snapshot<'a>(
          &'a self,
          principal: &'a VerifiedPrincipal,
          capability_ref: &'a ApplicationCapabilityRefV1,
      ) -> impl Future<Output = Result<ApplicationCapabilitySnapshotV1, AdapterError>> + Send + 'a;

      fn statuses<'a>(
          &'a self,
          principal: &'a VerifiedPrincipal,
          capability_ref: &'a ApplicationCapabilityRefV1,
      ) -> impl Future<Output = Result<ApplicationCapabilityStatusV1, AdapterError>> + Send + 'a;
  }
  ```
  Operations with read effects declare optional `selection` capabilities referencing `RecordSelectionCapabilityV1` (`record_type`, `ordering_ids`, `stable_snapshot`, `explicit_resolution`, `max_page_items`).
- **Record Selection Contract (`application-adapters-v1.schema.json`):** Produces bounded, ordered candidate record selection pages via `AdapterRecordSelectionPort`:
  ```rust
  #[async_trait]
  pub trait AdapterRecordSelectionPort: Send + Sync {
      async fn select(
          &self,
          principal: &VerifiedPrincipal,
          request: AdapterRecordSelectionRequestV1,
      ) -> Result<AdapterRecordSelectionPageV1, AdapterErrorV1>;
  }
  ```
  Returns `ApplicationRecordRefV1` items containing canonical `record_identity_sha256 = SHA256(RFC8785({application_id, vendor_account_id, environment, record_type, native_record_id}))`. Cross-connection canonical mapping guarantees that multiple distinct connections targeting the same underlying vendor account and native record produce the exact same identity digest.
- **Contract 12 (`application-adapters-v1.schema.json`):** Consumes authorized prepare, execute, and value query requests (`AdapterPrepareRequestV1`, `AdapterExecuteRequestV1`, `AdapterValueQueryV1`) from [agent-runtime](agent-runtime.md) and [local-context-hud](local-context-hud.md). Produces typed operation output values (`AdapterOperationValueV1`) capped at 256 KiB. Attempt identifiers (`attempt_id`) across Identity admission and submission journals are valid UUIDv4.
- **Contract 13 (`application-adapters-v1.schema.json`):** Produces immutable submission receipts (`AdapterSubmissionReceiptV1`) and signed readback evidence (`SignedAdapterReadbackEvidenceV1`) to [outcome-verification](outcome-verification.md).

---

## 4. Trust and deployment boundaries

### Process Isolation and Credential Custody
```
+---------------------------------------------------------------------------------------------------------+
|                                        Control Plane (Axum / Tokio / SQLx)                               |
|  +------------------------------------+  +--------------------+  +-----------------------------------+  |
|  |   ApplicationCapabilityRegistry    |  | ConnectionManager  |  |      adapter_registry_guard       |  |
|  +------------------------------------+  +--------------------+  +-----------------------------------+  |
+---------------------------------------------------|-----------------------------------------------------+
                                                    |
                                    Opaque Lease    |
                                    Handle (No Key) |
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                     Cloud / Local Execution Worker                                      |
|                                         oryn-adapter-worker                                             |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Isolation Key: (organization_id, connection_id, environment, credential_role)                     |  |
|  | - Deterministic pack operations (Gmail, Outlook, Sheets, Excel, Salesforce, HubSpot, NetSuite)   |  |
|  | - Local UI Automation / macOS Accessibility (Native Stage 3) via shell-adapter.v1 (major 1, minor 2)|  |
|  | - Direct Vendor Network Access: STRICTLY BLOCKED                                                  |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------|-----------------------------------------------------+
                                                    |
                           AdapterEgressRequestV1   | (Template ID, Lease ID, Bounded Body)
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                       AdapterEgressBroker                                               |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Out-of-process mediation process:                                                                 |  |
|  | 1. Verifies lease validity, attempt claim, role (actuation vs readback), environment              |  |
|  | 2. Enforces registered vendor origin, URL template, HTTP method, and schema                       |  |
|  | 3. Injects Vault credential token at egress boundary                                              |  |
|  | 4. Blocks arbitrary URLs, query overrides, DNS rebinding, and cross-account references             |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------|-----------------------------------------------------+
                                                    | HTTPS TLS 1.3
                                                    v
                                    External SaaS Vendor Endpoints
```

### Network and Host Constraints
- Cloud workers run in unprivileged containers with zero default external network routes; all outbound traffic is routed strictly through Unix domain sockets or internal mTLS to `AdapterEgressBroker`.
- Production and simulation connections operate on segregated network namespaces, Vault paths, and account credentials. Shared hostnames across environments require account-level and credential-level validation.

---

## 5. Internal architecture

### Execution Port Interface
```rust
pub trait AdapterExecutionPort: Send + Sync {
    fn prepare<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: AdapterPrepareRequestV1,
    ) -> impl Future<Output = Result<AdapterPreparedOperationV1, AdapterError>> + Send + 'a;

    fn execute<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: AdapterExecuteRequestV1,
    ) -> impl Future<Output = Result<AdapterSubmissionReceiptV1, AdapterError>> + Send + 'a;

    fn status<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        query: AdapterSubmissionQueryV1,
    ) -> impl Future<Output = Result<AdapterSubmissionReceiptV1, AdapterError>> + Send + 'a;

    fn readback<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: AdapterReadbackRequestV1,
    ) -> impl Future<Output = Result<SignedAdapterReadbackEvidenceV1, AdapterError>> + Send + 'a;

    fn value<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        query: AdapterValueQueryV1,
    ) -> impl Future<Output = Result<AdapterOperationValueV1, AdapterError>> + Send + 'a;
}
```

### Ordered Action Lifecycle
1. **Validation & Resolution:** Worker verifies principal, execution context, exact capability reference, qualification validity, and connection health. Resolves unique target record (returns `ADAPTER_RECORD_NOT_FOUND` or `ADAPTER_RECORD_AMBIGUOUS` on zero or multiple matches).
2. **State Capture & Diff Staging:** Resolves current before-state, vendor revision, strong precondition validator, or exclusive scope epoch. Stages canonical arguments (≤16 KiB) and diffs (0 for read, 1–128 for mutations) in `AdapterStagedActionV1`. Registers trusted `ActionPolicyFactsV1` with Identity via internal async port `register_action_facts`.
3. **Authority Acquisition:** Calling runner obtains `SignedActionAuthorizationV1`, required human `SignedActionApprovalV1`, and commits fence consumption to acquire `SignedActionAdmissionV1`.
4. **Preflight Verification:** Worker rechecks target before-state and verifies admission monotonic deadline before external dispatch.
5. **Attempt Journaling:** Atomically claims attempt in `AdapterSubmissionJournal`, setting state to `dispatching`. Old worker epochs are revoked.
6. **Egress Mediation:** Broker verifies winning attempt and lease parameters, injects tokens, and transmits single HTTP request or UI primitive. Automatic retry loops are disabled.
7. **Receipt Delivery:** Journal records final submission state (`application_acknowledged`, `unknown`, or `not_dispatched`) and delivers `AdapterSubmissionReceiptV1` to Runtime and Verifier.

### Typed Output Value Retrieval (`AdapterExecutionPort::value`)
The standard `AdapterExecutionPort` produces receipts (`AdapterSubmissionReceiptV1`), which confirm transmission or rejection but contain zero customer data. To provide downstream workflow nodes with output values without issuing duplicate external vendor reads, adapters expose the producer-owned internal `AdapterExecutionPort::value` method.

- **Query (`AdapterValueQueryV1`):** `{organization_id, execution_context, action_id, receipt_id}`.
- **Result (`AdapterOperationValueV1`):** `{schema_id: "adapter.operation-value.v1", organization_id, execution_context, action_id, receipt_id, output_type, value, value_sha256, evidence, expires_at}`.
- **Constraints:**
  - Carries only declared typed business fields, strictly bounded to 256 KiB.
  - References Factory-owned portable JSON/evidence and application-owned type schemas.
  - Represents retrieval of an already authorized and completed operation result; never performs another vendor read or acts as a self-verified business verdict.
  - Telemetry and public receipt responses remain strictly content-free.
  - Missing or expired results yield unknown or hold if an earlier mutation requires reconciliation.
  - Values originating in private local observations cannot be promoted through this route.

### Execution Delegation and Execution Guard
- **Dispatching Principal vs Delegate:** The worker ID in signed authority identifies the authenticated dispatching principal (e.g. `oryn-runtime-worker`). The adapter process identity is a separate delegate recorded in the trusted dispatch journal. The adapter and egress broker validate the delegate against the server-owned winning action/attempt and the active execution guard. Tenant matching alone is never treated as valid delegation.
- **Execution Guard Checks:** Guard checks reject stopped, superseded, expired, and wrong-epoch dispatchers before new admission or dispatch acceptance. Adapter preparation and Identity authorization/consumption resolve the committed pending effect under the execution guard:
  - Exact match of execution principal, assignment ID/epoch, node/path, effect kind, stable action ID, attempt, capability, operation, and canonical staged argument digest.
  - Dispatch accepted before stop/takeover may already be in-flight; cancellation is best-effort and does not promise recall of external network transmission. Replacement workers cannot perform mutations while prior accepted effects remain uncertain.
- **Connection Revisions:** Stable connection revisions bind external vendor accounts and subjects. Any change requires a new revision and invalidates staging. Distinguish internal journal phase `dispatching` from terminal wire state `application_acknowledged`. Preserves single mutation attempt on HTTP 429/5xx unless positive no-send evidence exists (which still never unconsumes an admitted fence).

### Local Execution Reservation Broker
Local UI and browser actuation require exclusive single-tenant lock ownership via the Privacy-Helper-owned `LocalExecutionReservationBroker`:
- **Lease Parameters:** 30-second renewable reservation with 10-second renewal cadence. Bound to `(organization_id, device_id, profile_id, execution_context, workstation_session_epoch)` and a closed holder union:
  - `{kind: "job", assignment_id, assignment_epoch}`
  - `{kind: "assist", assist_session_id, assist_incarnation}`
  - `{kind: "evaluation", attempt_id, assignment_id, assignment_epoch}`
- **Context Validation:** Checked strictly against canonical `ExecutionContextV1`.
- **Revocation & Quiescence:** Helper restart, session epoch change, pause, lock/sleep, window visibility loss, or disconnect immediately revokes local actuation. Revocation moves the reservation to `quiescing`, denying new primitives.
- **Safe Boundary Acknowledgment (`ExecutionReservationBoundaryAckV1`):** Verified executor acknowledgment with `primitive_stopped = true` transitions the lease to `released`. If acknowledgment is missing, the reservation enters `exclusion_hold`, denying competing actuation until process termination or owner reconciliation completes.
- **Protocol Versions:** Negotiates `browser-bridge.v1` major 1, minor 6 (requiring `evaluation_execution_v1` alongside `identity_authority_v1`, `local_execution_reservation_v1`, and `execution_reservation_lease_v1`). Native macOS actuation uses `shell-adapter.v1` major 1, minor 2.

### Simulation Bindings and Vendor Fidelity (`AdapterEnvironmentBindingV1`)
External environment mapping is decoupled from candidate behavior hashes:
- `AdapterEnvironmentBindingV1` binds:
  - `adapter_pack_ref`, `operation_id`, `simulation_qualification_ref`, `simulation_connection_id`, `simulation_account_id`, `simulation_environment`, `fidelity_gaps`.
  - `production_equivalence_status`: `"established" | "not_established"`.
  - Nullable `production_qualification_ref` and nullable `configuration_equivalence_evidence_ref`.
- **Pre-Production Simulation Evaluation:** An unestablished production equivalence (`not_established` with null production references) allows behavioral evaluations in Flight Simulator, but Release Governance strictly denies production readiness until equivalence is established.
- **Credential Isolation:** Workers receive simulation configuration metadata only; production connection IDs and credentials remain sealed in Control Plane / HashiCorp Vault. Vendor sandbox egress is mediated solely by `AdapterEgressBroker`.
- **Synthetic Reference Packs:** First-party deterministic synthetic adapters (`synthetic.erp`, `synthetic.crm`, `synthetic.support`) replicate external business APIs with declared argument and side-effect parity.

### Storage Architecture and Schema DDL
The component uses PostgreSQL 18 with Row-Level Security (RLS) under existing `TenantTransaction` boundaries:

```sql
-- Adapter pack publication metadata
CREATE TABLE adapter_pack_version (
    organization_id UUID NOT NULL,
    pack_id TEXT NOT NULL,
    revision TEXT NOT NULL,
    implementation_sha256 BYTEA NOT NULL,
    supported_api_versions TEXT[] NOT NULL,
    body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, pack_id, revision)
);

-- Connection configuration and health
CREATE TABLE adapter_connection (
    organization_id UUID NOT NULL,
    connection_id TEXT NOT NULL,
    revision BIGINT NOT NULL DEFAULT 1,
    application_id TEXT NOT NULL,
    identity_kind TEXT NOT NULL CHECK (identity_kind IN ('employee_delegated', 'integration_identity')),
    owner_actor_id UUID,
    vendor_account_id TEXT NOT NULL,
    vendor_subject_id TEXT NOT NULL,
    environment TEXT NOT NULL CHECK (environment IN ('production', 'simulation')),
    endpoint_ref TEXT NOT NULL,
    granted_scopes TEXT[] NOT NULL,
    approved_resource_scope TEXT NOT NULL,
    configuration_sha256 BYTEA NOT NULL,
    secret_ref TEXT,
    secret_generation BIGINT NOT NULL DEFAULT 1,
    state TEXT NOT NULL CHECK (state IN ('disconnected', 'testing', 'active', 'degraded', 'rate_limited', 'suspended', 'revoked', 'deprecated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, connection_id)
);

-- Immutable operation qualification definitions
CREATE TABLE adapter_qualification_definition (
    organization_id UUID NOT NULL,
    qualification_id TEXT NOT NULL,
    version_id UUID NOT NULL,
    content_sha256 BYTEA NOT NULL,
    application_id TEXT NOT NULL,
    pack_ref TEXT NOT NULL,
    operation_id TEXT NOT NULL,
    environment TEXT NOT NULL,
    body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, qualification_id, version_id),
    UNIQUE (organization_id, content_sha256)
);

-- Renewable qualification attestations (max 30-day validity)
CREATE TABLE adapter_qualification_attestation (
    organization_id UUID NOT NULL,
    qualification_id TEXT NOT NULL,
    version_id UUID NOT NULL,
    generation BIGINT NOT NULL,
    configuration_sha256 BYTEA NOT NULL,
    evidence_sha256 BYTEA NOT NULL,
    attestation_signature BYTEA NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    not_after TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (organization_id, qualification_id, version_id, generation),
    FOREIGN KEY (organization_id, qualification_id, version_id)
        REFERENCES adapter_qualification_definition (organization_id, qualification_id, version_id),
    CONSTRAINT chk_attestation_ttl CHECK (not_after <= issued_at + INTERVAL '30 days')
);

-- Live registry synchronization guard
CREATE TABLE adapter_registry_guard (
    organization_id UUID NOT NULL PRIMARY KEY,
    generation BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Durable external submission journal
CREATE TABLE adapter_submission (
    organization_id UUID NOT NULL,
    execution_context_sha256 BYTEA NOT NULL,
    action_id TEXT NOT NULL,
    attempt_id TEXT NOT NULL,
    connection_id TEXT NOT NULL,
    connection_revision BIGINT NOT NULL,
    capability_ref JSONB NOT NULL,
    operation_id TEXT NOT NULL,
    action_sha256 TEXT NOT NULL,
    authorization_ref TEXT NOT NULL,
    approval_ref TEXT,
    submission_state TEXT NOT NULL CHECK (submission_state IN ('not_dispatched', 'dispatched', 'application_acknowledged', 'unknown')),
    external_correlation_ref TEXT,
    evidence_ref JSONB,
    error_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, execution_context_sha256, action_id, attempt_id)
);

ALTER TABLE adapter_pack_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE adapter_connection ENABLE ROW LEVEL SECURITY;
ALTER TABLE adapter_qualification_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE adapter_qualification_attestation ENABLE ROW LEVEL SECURITY;
ALTER TABLE adapter_registry_guard ENABLE ROW LEVEL SECURITY;
ALTER TABLE adapter_submission ENABLE ROW LEVEL SECURITY;
```

---

## 6. State and lifecycle

### Connection Lifecycle State Machine
```
   [disconnected] --------> [testing] --------> [active]
         ^                     |                  |   |
         |                     v                  |   v
         |               [degraded] <-------------+   [rate_limited]
         |                     |                          |
         |                     v                          v
         +---------------- [suspended] <------------------+
                               |
                               v
                           [revoked] (Terminal for revision)
```
- **testing:** Non-mutating probe verifies external account, environment, and granted scopes against approved configuration.
- **active:** All qualification and health probes pass; permits action dispatch.
- **degraded:** External API returned 401/403 or health probe failed. New actuation blocked; safe readback permitted if credential role allows.
- **rate_limited:** Vendor returned 429; worker exposes backoff delay without internal retries.
- **suspended:** Administrative hold; immediate block of new dispatches.
- **revoked:** Terminal. Re-authorization requires minting a new connection identity and revision.

### Submission Journal State Machine
```
[prepared] ---> [admitted] ---> [dispatching] ---> [application_acknowledged]
     |              |                 |
     |              |                 +----------> [unknown] (timeout / crash / lost response)
     |              |
     +--------------+----------------------------> [not_dispatched] (preflight fail / positive no-send)
```
- Consumed Identity fences are NEVER unconsumed.
- Recovery from `unknown` requires out-of-band workflow reconciliation and a new action intent (`AdapterPrepareRequestV1.retry_context`).

---

## 7. Error and edge-case behavior

### Closed Error Codes (`AdapterErrorCodeV1`)
1. `ADAPTER_SCHEMA_INVALID`: Canonical argument does not match operation schema or exceeds 16 KiB limit.
2. `ADAPTER_LIMIT_EXCEEDED`: Collection size (>1,000 items), body size (>256 KiB), or attachment cap exceeded.
3. `ADAPTER_SCOPE_DENIED`: Operation requested outside customer-approved resource or field allowlist.
4. `ADAPTER_CONNECTION_UNAVAILABLE`: Connection in disconnected, degraded, suspended, or revoked state.
5. `ADAPTER_AUTH_REQUIRED`: Expired or invalid vendor credential token; re-authorization required.
6. `ADAPTER_ACCOUNT_MISMATCH`: Target account does not match bound connection account ID.
7. `ADAPTER_CAPABILITY_UNAVAILABLE`: Operation not published in active capability snapshot.
8. `ADAPTER_QUALIFICATION_EXPIRED`: 30-day qualification attestation expired without passing renewal.
9. `ADAPTER_CONFIGURATION_CHANGED`: Field set, automation rule, or permission configuration changed in external tenant.
10. `ADAPTER_RECORD_NOT_FOUND`: Target record does not exist in target application.
11. `ADAPTER_RECORD_AMBIGUOUS`: Search filter returned multiple candidate records.
12. `ADAPTER_STATE_STALE`: Preflight check detected target record version or field mismatch before dispatch.
13. `ADAPTER_EXCLUSIVE_SCOPE_REQUIRED`: Mutation requires customer-enforced writer exclusion, which was absent or expired.
14. `ADAPTER_AUTHORITY_INVALID`: Signed authorization bundle invalid, expired, or tampered.
15. `ADAPTER_ADMISSION_UNCONFIRMED`: Identity admission fence not durably confirmed before dispatch attempt.
16. `ADAPTER_ALREADY_DISPATCHED`: Action ID already has a recorded attempt in submission journal.
17. `ADAPTER_RATE_LIMITED`: External application rate limit (HTTP 429); retry delayed.
18. `ADAPTER_UNSUPPORTED`: Requested modality or operation unsupported on this platform or tier.
19. `ADAPTER_RESPONSE_INVALID`: Vendor response could not be parsed according to declared template schema.
20. `ADAPTER_ARTIFACT_CHANGED`: Opaque business artifact attachment changed digest between approval and send.
21. `ADAPTER_CANCELLED`: Cooperative operation cancellation received prior to dispatch.
22. `ADAPTER_OUTCOME_UNKNOWN`: Network dropped or timed out after transmission began; outcome ambiguous.
23. `ADAPTER_READBACK_UNAVAILABLE`: Independent readback endpoint or certified egress enforcement unavailable.
24. `ADAPTER_SELECTION_UNSUPPORTED`: Record selection requested on an operation without qualified `selection` declaration; maps to `JOB_SELECTION_UNSUPPORTED`.
25. `ADAPTER_SELECTION_STALE`: Source record snapshot changed or session expired during selection pagination; maps to `JOB_SELECTION_STALE`.
26. `ADAPTER_SELECTION_INCOMPLETE`: Selection stream truncated or incomplete without definitive end-of-queue; maps to `JOB_SELECTION_INCOMPLETE`.
27. `ADAPTER_SELECTION_LIMIT_EXCEEDED`: Selection query exceeded page limit (100) or population cap (1,000); maps to `JOB_SELECTION_LIMIT_EXCEEDED`.

---

## 8. Observability and audit

### Content-Free Execution Telemetry
- All journal entries and public API responses contain zero plaintext customer records, raw DOM payloads, email bodies, or credentials.
- Telemetry emits structured audit events:
  - `adapter.connection.probed`
  - `adapter.qualification.attested`
  - `adapter.action.prepared`
  - `adapter.action.dispatched`
  - `adapter.action.acknowledged`
  - `adapter.action.unknown`
  - `adapter.readback.acquired`
- Audit retention strictly adheres to the 24-month compliance schedule; staging buffers expire after 24 hours (or 30 seconds for local unconsented volatile observations).

---

## 9. Security and threat model

### Threat Mitigations
- **Cross-Account Substitution:** Bound `vendor_account_id` and `vendor_subject_id` enter `AdapterTargetProjectionV1` preimage; changing connection or account invalidates cryptographic authorization.
- **Zombie Dispatch / Worker Crash:** Broker validates caller attempt ID and worker epoch before egress transmission. Recovering an action revokes old worker epochs before issuing fresh admission.
- **Broader Token Scope Misuse:** Egress broker verifies requested HTTP verb and path template against declared operation role. Tokens held by `readback` role cannot transmit mutating verbs (POST/PUT/PATCH/DELETE) even if underlying OAuth grant permits them.
- **Draft Overwrite / Mailbox Race:** Approved emails are transmitted as immutable snapshots via `messages.send` or `sendMail`. Employee drafts are never overwritten or deleted.
- **Shared Hostname Contamination:** Multi-tenant providers sharing endpoints require strict account ID matching and L7 header enforcement; hostname checks alone are insufficient.

---

## 10. Test strategy

### Contract Fixtures and Deterministic Evaluators
The test harness validates contract compliance via `docs/architecture/contracts/application-adapters-v1.fixtures.json`, providing deterministic evaluators for:
1. `scope_binding`: Verifies requested fields and record keys against customer allowlists.
2. `qualification_lifecycle`: Asserts 30-day expiry and definition body immutability across renewals.
3. `submission_transition`: Simulates crash, response loss, and duplicate attempt blocking.
4. `write_guard`: Enforces preconditions, immutable inputs, and exclusive scopes.
5. `readback_binding`: Verifies independent verifier role, querying time, and SHA-256 data matching.
6. `environment_binding`: Verifies sandbox vs. production account isolation.
7. `cell_normalization`: Deterministic matrix normalization, formula injection protection, and skip/clear semantics.
8. `mail_snapshot`: Verifies exact payload matching and independent sent-copy evidence.
9. `reservation`: Enforces device-wide mutually exclusive local execution.

---

## 11. Performance and operations

### Configured Operational Limits
- **Read & Preflight Deadline:** Default 5.0 seconds; maximum 30.0 seconds per request.
- **Submission Deadline:** Monotonic deadline capped at 30.0 seconds, bounded by authority token expiry.
- **Canonical Argument Cap:** 16 KiB maximum canonical RFC 8785 JSON bytes.
- **Batch / Collection Cap:** Maximum 1,000 items and 256 KiB typed JSON per response.
- **Email Bounds:** Body text ≤4,096 characters, subject ≤255 characters, recipients ≤50, attachments ≤4 (each ≤512 KiB, total ≤2 MiB).
- **Spreadsheet Bounds:** Explicit finite rectangle matrices; scalar broadcasting rejected.

---

## 12. Architecture decisions and open questions

### Resolved Decisions
- **Signed First-Party Workers:** Rust executables only; third-party WASM or interpreted script plugins rejected.
- **Renewable 30-Day Qualification:** Layered, per-account, per-operation qualification with mandatory evidence renewal.
- **Out-of-Process Egress Broker:** Workers hold opaque handles; Vault tokens injected only by isolated broker.
- **One-Shot Durable Journaling:** Ambiguous submissions transition to `unknown`; consumed Identity fences stay consumed.
- **Unified Device Reservation:** Managed by Privacy Helper across native and browser execution modalities.

### Implementation and Certification Obligations
1. **Google Workspace API Client Review:** Production deployment requires completing Google Cloud Restricted Scope security assessment for Gmail and Drive scopes.
2. **Microsoft Partner Center Application Certification:** Graph application registration requires publisher domain verification and tenant admin consent flows.
3. **Synthetic OS Fixtures:** Local native execution requires signed synthetic fixture applications on macOS (Accessibility API) and Windows (UI Automation) to certify pattern bridges prior to release.
4. **Vault Broker Transit Key Custody:** Infrastructure must certify KMS-backed root-of-trust for Vault credential egress brokers.
