# Application Adapters Specification Authoring Plan

## Context

Produce an implementation-ready technical specification for `application-adapters`, not application source code. Flesh out registry, qualified vendor operations, connection authority, isolated execution, native/browser interaction, submission recovery, independent readback, and simulation bindings. Preserve `PRODUCT.md` authority, the twelve canonical component headings, and accepted architecture boundaries; reconcile affected producer and consumer documents rather than leaving contradictory contracts.

The design is settled: signed first-party Rust workers; bounded packs for all seven named business applications; API-first selection with pinned transport; customer-specific qualification; explicit employee versus integration identities; strict concurrency protection; separately approved email sending; and native Stage 3 semantic actuation.

## Approach

### 1. Establish component boundaries and domain language

Replace `docs/components/application-adapters.md` with `Status: Detailed technical specification — implementation pending`, retaining these exact twelve level-two headings in this order:

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

Use subordinate headings for the detailed contracts below. The last section records resolved decisions and implementation/certification obligations, not unresolved design choices. Do not describe specifications, synthetic vectors, or cited vendor APIs as deployed or certified software.

Specify these logical units, with one authoritative owner each:

| Unit | Location/owner | Responsibility |
|---|---|---|
| `ApplicationCapabilityRegistry` | Rust module in existing Axum/Tokio/SQLx Control Plane | Immutable capability definitions, live status, qualification, compatibility projections |
| `ConnectionManager` | Same component/module boundary | Connection metadata, OAuth transaction orchestration, account/environment verification, health and revocation |
| `AdapterPreparation` | Adapter component, executed in appropriate cloud/local worker | Validate declared arguments, resolve exact record, capture preconditions, stage diffs, register trusted policy facts |
| `AdapterSubmissionJournal` | Adapter component; PostgreSQL for cloud, local execution audit for device dispatch | Durable external dispatch identity and receipts; never case checkpoints or authority fences |
| `oryn-adapter-worker` | Signed first-party Rust executable; cloud execution worker or unprivileged Shell-supervised local child | Deterministic operation implementation; no model inference, arbitrary scripts, or runtime third-party plugins |
| `AdapterEgressBroker` | Infrastructure-owned credential/egress enforcement process, isolated from adapter worker | Vault credential custody/injection; enforce method, origin, path, resource, environment, and operation restrictions independently of worker requests |
| `AdapterReadback` | Separate worker/credential role | Fetch independently requested evidence; never issue business verdicts |
| `LocalExecutionReservationBroker` | Privacy Helper; relayed by existing Shell/browser broker | One device-wide reservation across browser and native execution, jobs and assists |

Cloud worker isolation key is `(organization_id, connection_id, environment, credential_role)`; bounded worker reuse is allowed only inside that tuple. Credential roles are `actuation` and `readback`. Workers and runners receive opaque operation-scoped handles, not vendor tokens. No model/provider networking belongs here. Retain deterministic local processing and shared LiteLLM inference boundaries without adding a new inference purpose.

Add the following glossary entries to `GLOSSARY.md`, using its existing format and keeping all implementation details out:

- **Application Capability:** Declared supported interactions and limitations for a business application, distinct from an Operational Capability and from permission to act. Avoid: blanket compatibility, business workflow.
- **Application Connection:** An approved binding to an external account, environment, and execution identity with a defined resource scope; it is not the credential itself. Avoid: API key, browser session.
- **Adapter Pack:** A reviewed set of application-specific operation definitions and supported interactions; it grants no customer access or execution authority. Avoid: universal connector, customer plugin.
- **Operation Qualification:** Evidence-backed confirmation that a declared operation is supported in a particular application configuration and execution mode; it is not an agent release. Avoid: deployment approval, blanket application certification.
- **Exclusive Target Scope:** A customer-enforced resource scope that excludes conflicting writers for a defined period; an Oryn-only reservation does not establish it. Avoid: local mutex, best-effort lock.
- **Submission Receipt:** A record describing whether an operation may have reached an external application; it does not establish a correct business outcome. Avoid: success verdict, completed case.
- **Readback Evidence:** Independently acquired application state used to assess business postconditions, distinct from a submission acknowledgment or verdict. Avoid: response echo, agent self-report.

Add `docs/adr/0016-application-adapter-qualification-and-dispatch-boundaries.md`. Highest ADR observed is 0015. Record the costly tradeoffs: first-party workers rather than extensible plugin ABI; layered, renewable qualification rather than application-wide claims; independent credential egress enforcement; pinned transports; immutable snapshot sending; and journaled one-shot submission rather than automatic replay. Explicitly amend relevant execution/credential assumptions in ADR-0004, ADR-0009, ADR-0011, and ADR-0015 by cross-reference, without rewriting their historical decisions.

### 2. Define executable capabilities separately from compatibility and renewable qualification

Extend existing `docs/architecture/contracts/application-capability-v1.schema.json`; reuse its portable `DataTypeV1` and Graph version-reference types. No second type system, predicate DSL, or arbitrary JSON Schema execution language. Existing bounds remain: 128 operations, 16 KiB maximum canonical argument bytes, 32 record types/fact fields/verifier refs, type depth eight, strings 4,096 characters, arrays 1,000 items, business decimals encoded as strings.

Preserve `ApplicationCapabilityPort::snapshot` and `statuses` exactly as asynchronous producer-owned interfaces. Normalize the synchronous copies in `docs/components/agent-factory-ir.md` to those signatures. Registry reads remain authenticated metadata reads with zero production endpoint, credential, or plugin access during compilation.

Make these clean schema changes; migrate every affected example/fixture rather than retaining legacy aliases:

- Add `api` to `ApplicationCapabilityBodyV1.platform`. API snapshots use `execution_location="cloud"`; browser/native snapshots use `employee_device`. Native snapshots permit Stage 3 only. Browser remains `platform="browser"`; native remains `macos|windows`.
- Add required `qualification_refs` to the snapshot body: an ordered array of closed `{operation_id, qualification_ref}` bindings to immutable `OperationQualificationDefinitionV1` identities/content hashes. Preserve existing operation grouping and 128-operation bound. Require exactly one matching qualification per declared operation, no missing/duplicate/extra bindings, and order bindings by operation ID.
- Add required `write_guard` to `OperationDeclarationV1`: `not_applicable|immutable_input|strong_precondition|exclusive_scope`. Reads require `not_applicable`. Updates to existing mutable state require strong preconditions or exclusive scope. Append-only creation and snapshot sending may use `immutable_input`, binding approved bytes, references and destinations without claiming duplicate suppression. Weak timestamp checks never count as strong preconditions.
- Add required `operation_statuses` to live `ApplicationCapabilityStatusV1`, an array of closed `{operation_id,status,reason_codes}` objects. Keep existing coarse status and generation outside the immutable body hash. Resolve coarse status as revoked if definition/pack revoked; unknown if absent/unresolved; available only when all included operations are available; otherwise degraded. Actual dispatch always checks the named operation, not just coarse status.
- Keep `idempotency=native_key|read_reconcile|none`, `reversibility=reversible|irreversible|unknown`, `effect=read|draft|write`, and existing numeric stages. Do not infer `native_key` from a correlation header, HTTP PUT, or internal fence.

Create `docs/architecture/contracts/application-adapters-v1.schema.json`, Draft 2020-12, `$id="urn:oryn:schemas:application-adapters:v1"`. All objects are closed; nullable fields remain required. Reference producer-owned Identity, Graph, application-capability, and Control Plane types rather than copying them. Include top-level variants with exact schema IDs and definitions specified in the following steps.

Define these registry types:

| Type | Required content |
|---|---|
| `AdapterPackV1` | `schema_id="adapter.pack.v1"`, `pack_id`, `revision`, `implementation_sha256`, `operation_definitions`, `supported_api_versions`, `profile_refs`, `validation_evidence_refs`; approved publisher signature is a separate envelope |
| `OperationQualificationRefV1` | `qualification_id`, `version_id`, `content_sha256` |
| `OperationQualificationDefinitionV1` | `schema_id="application.operation-qualification.v1"`, `organization_id`, `ref`, `body` |
| Qualification `body` | `application_id`, `pack_ref`, `application_profile_ref`, `operation_id`, `platform`, `execution_location`, `environment`, `external_account_id`, `configuration_sha256`, `resource_scope`, `allowed_stages`, `verification_binding`, `write_guard`, `automation_effects_sha256` |
| `QualificationAttestationV1` | `qualification_ref`, `configuration_sha256`, `evidence_refs`, `evidence_sha256`, `generation`, `issued_at`, `not_after` |
| `SignedQualificationAttestationV1` | Standard Ed25519 publisher envelope, `schema_id="application.qualification-attestation.v1"`, signing the attestation payload |
| `ApplicationCompatibilityReportV1` | `schema_id="application.compatibility-report.v1"`, `organization_id`, `application_id`, `configuration_sha256`, `observed_at`, `entries` |
| Compatibility entry | `operation_id` nullable for non-execution observation/guidance support, `mode`, `support`, `qualification_ref` nullable, `verification_support`, `reason_codes`, `evidence_refs` |

Compatibility `mode` is `observe|guide|assist|run_supervised|run_autonomously`; `support` is `supported|restricted|unsupported|unverified`; `verification_support` is `system_evidence|authorized_reviewer|unavailable`. Observe/Guide entries consume existing source-owned observation/profile/guidance validation; do not invent executable operations or grants for those modes. Permission, present connection health, qualified support, autonomy stage, and verification strength are separate axes.

Hash qualification definition `body` via RFC 8785/SHA-256 into its reference. Renewal evidence/timestamps/generation/approvals stay outside executable behavior hashes. Unchanged renewal must not force recompilation or new agent evaluation. Material pack/profile/operation/configuration/transport/field-scope changes create new immutable definitions and capability snapshots, invalidating dependent qualification/evaluation readiness. No silent latest-version resolution or transport fallback.

Pack publication requires Oryn integration maintainer plus Security. Customer Workflow Owner approves initial/changed operation qualification. Customer Security additionally approves new connection authority, scope expansion, or broader-grant enforcement exceptions. Initial approval records bind the definition hash; renewals cannot amend it. Attestations expire at most 30 days after issuance. Automatic renewal requires unchanged configuration and passing required evidence; failure/absence expires or restricts support, never extends the prior deadline. Safe renewal probes perform no surprise production mutations.

Live invalidation triggers: pack/profile revocation, changed field/automation/permission configuration, external account mismatch, credential authority change, failed mandatory probe, missing required evidence, expiry, and customer suspension. Stop new affected dispatches, including pending steps of pinned jobs. Still permit separately authorized read-only reconciliation for previously submitted actions when the readback pack itself remains safe. Do not disable all recovery merely because actuation was revoked.

Specify `adapter_registry_guard(organization_id,generation)` with shared finalization locks and exclusive registry-update locks. Factory finalization locks this guard after its Factory head and before `graph_knowledge_guard`, compares expected generation, and performs no external calls under locks. Use an asynchronous internal `guard_catalog_generation(tx: &mut TenantTransaction, principal: &VerifiedPrincipal, expected_generation: u64) -> Result<(), CapabilityError>`. Registry updates increment the guard and commit status/audit/outbox atomically. New dispatch consults authoritative live eligibility even while asynchronous Graph impact projections lag.

### 3. Specify connection admission and independently enforced credential access

Define `ApplicationConnectionV1` (`adapter.connection.v1`) with required `organization_id`, `connection_id`, `revision`, `application_id`, `identity_kind`, `owner_actor_id` nullable, `vendor_account_id`, `vendor_subject_id`, `environment`, `endpoint_ref`, `granted_scopes`, `approved_resource_scope`, `configuration_sha256`, `secret_ref`, `secret_generation`, `state`, and timestamps. Public DTOs omit `secret_ref`; no response ever carries access/refresh tokens. `identity_kind=employee_delegated|integration_identity`; `environment=production|simulation`.

Connection states are `disconnected|testing|active|degraded|rate_limited|suspended|revoked|deprecated`. Define transition/command tables: explicit connect/probe activates only after verified account/environment/scopes; 401/403 causes degradation and reauthorization; 429 causes bounded rate-limited restriction; suspension blocks new actions; revocation is terminal for that connection revision. Reauthorization after revoked identity creates a new connection identity/revision and qualification, not resurrection of old authority. Token refresh with unchanged subject/scopes increments secret generation only; account/scope/config changes increment material connection revision and suspend affected eligibility.

Employee mail/personal-document connections use delegated OAuth. Shared CRM/ERP connections use explicit integration identities; vendor installation OAuth may still represent account-wide integration authority. A HubSpot installer identity is not proof of employee-scoped record access. No domain-wide delegation, app-only replacement, browser cookie export, password collection, or login automation is implicit.

OAuth flow: preauthorized connection metadata → single-use server transaction with random state, PKCE S256 when supported, exact registered callback, authenticated initiating actor/organization/connection/environment → provider consent → backend redemption → account/subject/scope verification → Vault storage → safe status-only redirect. Transaction TTL is five minutes. Callback must match the initiating transaction, not a newly supplied tenant ID. Employees complete only their own preauthorized delegated consent. Customer-managed certificate/secret enrollment goes directly into Infrastructure's secret enrollment boundary; application UI/API never returns secrets. Never reuse Oryn/Auth0 session credentials as vendor credentials.

Add Identity capabilities `application.read`, `integration.manage`, `application.qualify`. Default `integration.manage` to Security Admin in application/team scope; default `application.qualify` to Workflow Owner in workflow/application remit; authorized organization roles may read compatibility within their existing audience restrictions. Organization Admin does not gain arbitrary vendor data or private evidence access. Employee consent completion is an ownership-checked action for the preauthorized connection, not `integration.manage`. Apply existing restriction subtraction, MFA, approval delegation, and permission-expansion governance. Token scopes map respectively to `application:read`, `integration:manage`, `application:qualify`.

Credential interfaces are internal, not general-purpose HTTP proxies:

- `CredentialLeaseRequestV1`: organization, connection/revision, execution context, caller workload, environment, credential role, capability/operation, resource scope, deadline.
- `CredentialLeaseV1`: opaque `lease_id`, connection/revision, subject/account, role, environment, allowed operation/resource digest, issued/expiry times; no vendor secret.
- `AdapterEgressRequestV1`: lease ID, attempt ID, prepared-action reference, declared request-template ID, bounded typed request data. Caller cannot supply arbitrary URL, method, credential, redirect, or scope.
- `AdapterEgressResultV1`: receipt identity, bounded response/evidence reference, external status, correlation metadata, and submission state.

Infrastructure egress broker verifies authenticated workload, admission/attempt, role, live generation, registered vendor origin, exact path/resource template, fields/body schema, TLS server identity, and bound vendor account/environment. Inject tokens only after checks. Reject undeclared redirects, DNS rebinding, arbitrary hosts, and cross-account identifiers. Worker direct vendor networking is blocked. Readback role cannot request mutation endpoints even when underlying OAuth grant permits writes. If this enforcement cannot be certified, expose affected readback as unavailable; never quietly fall back to in-process checks.

Production/simulation have separate workloads, secrets, installations/accounts, allowlists, and grants. Some vendors share the same public hostname; environment isolation must therefore include account identity and L7 credential/resource binding, not an impossible claim of host-level separation alone.

Document SQL DDL, tenant-composite keys, foreign keys, check constraints, RLS, and indexes for `adapter_pack_version`, `adapter_connection`, `adapter_qualification_definition`, `adapter_qualification_attestation`, `adapter_capability_version`, `adapter_registry_guard`, `adapter_staged_action`, and `adapter_submission`. Existing `TenantTransaction`, Identity guards, Control Plane idempotency/outbox, and Infrastructure Vault custody are reused. No new message broker or general workflow queue.

Document these management routes in shared `control-plane-v1.openapi.json` and `docs/components/control-plane.md`:

| Method/path | Purpose |
|---|---|
| `GET /v1/applications/{application_id}/compatibility` | Authorized compatibility report |
| `GET/POST /v1/integrations/connections` | List/create scoped connection metadata |
| `GET /v1/integrations/connections/{connection_id}` | Redacted connection detail |
| `POST /v1/integrations/connections/{connection_id}/authorization-transactions` | Start ownership-checked delegated consent |
| `GET /v1/integrations/oauth/callback` | Single-use transaction redemption and status redirect |
| `POST /v1/integrations/connections/{connection_id}/probes` | Explicit nonmutating health/account probe |
| `POST /v1/integrations/connections/{connection_id}/suspensions` | Suspend new use |
| `POST /v1/integrations/connections/{connection_id}/revocations` | Revoke metadata and secret handles |
| `POST /v1/integrations/qualifications` | Stage immutable definition/evidence |
| `POST /v1/integrations/qualifications/{qualification_id}/approvals` | Record authorized qualification approval |
| `POST /v1/integrations/qualifications/{qualification_id}/renewals` | Evidence-only unchanged renewal |

Mutations reuse UUIDv7 `Idempotency-Key`, expected revision, BFF CSRF, and Control Plane `OperationV1` for asynchronous probes/qualification. Define route-specific closed request/response types in the new adapter schema from the corresponding domain fields, with no client-supplied live status, arbitrary scopes, or fabricated approval fields. OAuth callback uses provider state/code protocol, not generic command idempotency. No public arbitrary execute/proxy endpoint.

### 4. Define preparation, authority binding, one-shot submission, and recovery

Extend `identity-policy-v1.schema.json` and its owning component specification rather than creating parallel authorization types.

Replace adapter target projection's legacy `adapter_capability_version` and browser-only expected state with this exact required projection:

```text
AdapterTargetProjectionV1 {
  kind: "adapter", organization_id, action_id, execution_context,
  connection_id, connection_revision, vendor_account_id,
  application_id, capability_ref, operation_id, record_key,
  expected_state: AdapterExpectedStateV1, environment, argument_sha256
}
```

Connection/vendor-account fields are action-digest inputs. `capability_ref` is existing `ApplicationCapabilityRefV1`. Define `AdapterExpectedStateV1` as a closed API/native tagged union. API state contains opaque nullable vendor revision, declared typed before-fields, and guard (`read_only`, immutable-input content digest, strong vendor validator, or exclusive-scope ID plus epoch). Native state additionally binds signed application/process identity, window identity, surface generation, and packaged target key. Guard identity enters the hash; observation timestamps and renewable lease-expiry timestamps do not. Recheck current validity live. Read state is explicit and never a fabricated mutation diff.

Adapter action digest is `"sha256_" + lowercase_hex(SHA256(RFC8785_JCS(the complete adapter target projection)))`. Keep browser digest unchanged: hash its existing documented preimage, excluding target discriminator `kind`, ephemeral reservation/handle, authority references, and deadlines. Proposal digest retains `sha256-` prefix. Add signed/digest test vectors proving cross-account or connection-revision changes invalidate adapter authority.

Add required `effect=read|draft|write` to Identity-owned `AdapterStagedActionV1`. Set `parameter_diffs` bounds to 0–128, with semantic/conditional rule: reads require zero; draft/write require 1–128 meaningful diffs. Human approval proposals continue requiring meaningful diffs. No fake read diff and no relaxation for mutations. Canonical arguments remain ≤16 KiB and within declared operation type/byte bound.

Reuse `ActionPolicyFactsV1` and define authenticated internal async port `register_action_facts(principal: &VerifiedPrincipal, staged: &AdapterStagedActionV1, facts: ActionPolicyFactsV1) -> Result<(), IdentityError>`. Identity verifies producer workload, staging identity/revision, argument/state/digest bindings, registered operation classification floor, current scope, and ≤30-second validity before storing trusted facts. Caller-provided monetary/category/destination facts cannot override adapter-derived facts. Identity remains final risk classifier; Tier 3 approval is item-specific; Tier 4 always denies.

Define the new execution types in adapter schema:

| Type/schema ID | Required fields |
|---|---|
| `AdapterPrepareRequestV1`, `adapter.prepare-request.v1` | `request_id`, `execution_context`, `action_id`, `connection_id`, `expected_connection_revision`, `capability_ref`, `operation_id`, `record_key`, `argument_canonical_base64url`, `retry_context` (required nullable; otherwise closed `{retry_of_action_id,reconciliation_ref}`) |
| `AdapterPreparedOperationV1`, `adapter.prepared-operation.v1` | `staged` (Identity-owned type), `target` (Identity target union), `policy_facts_id`, `qualification_ref`, `preflight_not_after` |
| `AdapterExecuteRequestV1`, `adapter.execute-request.v1` | `request_id`, `staged_action_id`, `staged_action_revision`, `attempt_id`, `authority` |
| Authority bundle | `authorization: SignedActionAuthorizationV1`, `approval: SignedActionApprovalV1|null`, `admission: SignedActionAdmissionV1` |
| `AdapterSubmissionReceiptV1`, `adapter.submission-receipt.v1` | `receipt_id`, `organization_id`, `execution_context`, `action_id`, `action_sha256`, `attempt_id`, `connection_id`, `connection_revision`, `capability_ref`, `operation_id`, `authorization_ref`, `approval_ref`, `submission_state`, `timestamp_utc`, `external_correlation_ref` nullable, `evidence_ref` nullable, `error_code` nullable |
| `AdapterSubmissionQueryV1` | organization/context/action identity; no caller-selected vendor URL or search string |

Every schema row additionally requires its `schema_id` when one is specified. UUID fields reuse existing UUID types; action/operation/resource IDs reuse existing Identifier types. Do not introduce another action-ID convention. Public request UUIDs remain distinct from action IDs and command-idempotency UUIDv7 keys.

Specify asynchronous Rust `AdapterExecutionPort: Send + Sync` methods with established `fn ... -> impl Future<Output = Result<T, AdapterError>> + Send + 'a` style: `prepare(principal, AdapterPrepareRequestV1) -> AdapterPreparedOperationV1`; `execute(principal, AdapterExecuteRequestV1) -> AdapterSubmissionReceiptV1`; `status(principal, AdapterSubmissionQueryV1) -> AdapterSubmissionReceiptV1`; `readback(principal, AdapterReadbackRequestV1) -> SignedAdapterReadbackEvidenceV1`. Borrow the principal/self with the same lifetime as existing producer ports.

Define ordered action flow:

1. Validate principal/context, exact capability/qualification/connection, declared argument type and resource allowlist. Unique record lookup returns no-match/ambiguous errors, never first-match selection.
2. Resolve current account, before-values, revision/strong validator or live exclusive scope. Stage immutable canonical inputs/diffs; persist only permitted execution data. Obtain trusted policy facts.
3. Caller obtains Identity authorization and any human approval. Approval binds actual content, recipients, affected record, and consequences, not merely a draft ID. Expired facts refresh; changed material content requires revised proposal.
4. Immediately before `consume`, adapter preflight rechecks required state and returns freshness. Runtime/assist caller retains existing ownership of Identity consumption. Only journal-durable acknowledged admission permits dispatch. `unknown_delivery` never permits dispatch.
5. Adapter verifies signed authority, worker/caller/context/attempt/digest/staging identity, admission expiry, live restriction generation, and before-state again. Browser/native may reject stale target after consumption; record no-dispatch evidence without reopening the fence.
6. Atomically claim one dispatch attempt in adapter journal; persist `dispatching` before egress/OS invocation. Broker verifies winning attempt and worker epoch. Issue one external mutation request or one UI primitive; disable transparent transport/SDK mutation retries.
7. Record bounded submission receipt and deliver to Runtime/Verifier. Submission acknowledgment never establishes business success.

Internal journal states: `prepared -> admitted -> dispatching -> acknowledged|unknown`; `prepared|admitted -> not_dispatched` only with positive no-send evidence; resolved states append reconciliation records, never overwrite history. Contract submission states reuse `not_dispatched|dispatched|application_acknowledged|unknown`; transient `dispatched` is not a terminal durable receipt. `status` reads Oryn's journal, not a reason to resubmit.

Fence/journal uniqueness uses organization, execution-context hash, and action ID; bind winning attempt and caller worker epoch. Revoke old broker leases/worker epochs before allowing a fresh reconciled attempt, preventing a zombie sender. Crash after admission, missing acknowledgment, timeout, partial response, and process death do not automatically resend. Mark unknown unless positive dispatch-boundary evidence establishes no submission. Even confirmed no-send recovery requires a new action intent, distinct action ID, `retry_of_action_id`, current authorization, and reconciliation evidence; never unconsume a fence. Native idempotency is additional evidence, not permission to replay consumed actions.

Validate `retry_context` against authoritative original action reconciliation and revoked old worker epochs before preparation. A client-supplied string is not reconciliation evidence. An operation declared immutable-input must not overwrite existing mutable records; enforce this against the pack's fixed endpoint/template classification.

Update `agent-runtime.md` and `job-orchestration.md`: orchestration owns workflow retries/checkpoints and fresh-action intent; adapter owns external journal; Identity owns fences/recovery durability. Correct stale `ActionAuthorizationV1`/`SignedApprovalProposalV1` execution-bundle names. Runtime receives opaque handles only. Partial multi-item operations preserve previous committed effects and exact remaining scope. No generic rollback, compensation, or whole-case replay.

Closed `AdapterErrorCodeV1`: `ADAPTER_SCHEMA_INVALID`, `ADAPTER_LIMIT_EXCEEDED`, `ADAPTER_SCOPE_DENIED`, `ADAPTER_CONNECTION_UNAVAILABLE`, `ADAPTER_AUTH_REQUIRED`, `ADAPTER_ACCOUNT_MISMATCH`, `ADAPTER_CAPABILITY_UNAVAILABLE`, `ADAPTER_QUALIFICATION_EXPIRED`, `ADAPTER_CONFIGURATION_CHANGED`, `ADAPTER_RECORD_NOT_FOUND`, `ADAPTER_RECORD_AMBIGUOUS`, `ADAPTER_STATE_STALE`, `ADAPTER_EXCLUSIVE_SCOPE_REQUIRED`, `ADAPTER_AUTHORITY_INVALID`, `ADAPTER_ADMISSION_UNCONFIRMED`, `ADAPTER_ALREADY_DISPATCHED`, `ADAPTER_RATE_LIMITED`, `ADAPTER_UNSUPPORTED`, `ADAPTER_RESPONSE_INVALID`, `ADAPTER_ARTIFACT_CHANGED`, `ADAPTER_CANCELLED`, `ADAPTER_OUTCOME_UNKNOWN`, `ADAPTER_READBACK_UNAVAILABLE`.

Describe HTTP mappings in `ControlPlaneProblemV1` and distinguish error class from submission state. Timeout/cancel after transmission is unknown, not safe-to-retry. Pre-dispatch schema/authority/target errors are not dispatched. After submission, invalid provider response is unknown unless independent evidence resolves it. Expose rate-limit delay to caller; adapter does not create a durable mutation retry queue.

### 5. Specify the bounded vendor packs and exact operation semantics

Each pack defines all input/output records with existing `DataTypeV1`, customer-selected field/resource allowlists, concrete request templates, credential scopes, side effects, write guard, readback binding, and error mapping. No generic REST/GraphQL client, arbitrary SOQL/query execution, scripts, HTML email, formula writes, deletes, permission changes, or financial posting operations. Field names and business policies for actual customers are required configuration, never Oryn-invented defaults.

| Pack | Exact operation IDs | Binding and limits |
|---|---|---|
| Gmail | `gmail.message.read`, `gmail.thread.read`, `gmail.attachment.read`, `gmail.draft.create`, `gmail.draft.update`, `gmail.message.send` | Gmail REST v1; delegated `gmail.readonly` plus `gmail.compose`, optionally separately consented `gmail.send` for snapshot-send-only identity. Compose itself permits send; Oryn still enforces Tier 3 approval independently. |
| Outlook | `outlook.message.read`, `outlook.thread.read`, `outlook.attachment.read`, `outlook.draft.create`, `outlook.draft.update`, `outlook.message.send` | Microsoft Graph v1.0; delegated Mail.ReadWrite for drafts, separately enabled Mail.Send. Conversation read expands to bounded message reads. |
| Sheets | `sheets.range.read`, `sheets.table.read`, `sheets.range.set_values` | Sheets v4; `drive.file` with actual selected-file grant. Read/resolve named tables/ranges to a finite rectangle before approval; values writes use RAW. |
| Excel web | `excel.range.read`, `excel.table.read`, `excel.range.set_values` | Graph v1.0 workbook APIs, delegated work/school Files.ReadWrite; no app-only or arbitrary consumer/legacy workbook promise. |
| Salesforce | `salesforce.record.lookup`, `salesforce.record.read`, `salesforce.record.update_fields`, `salesforce.note.create` | Exact tenant-approved REST API version is required connection/qualification configuration, never `latest`; External Client App OAuth, My Domain/organization/user/environment binding. |
| HubSpot | `hubspot.record.lookup`, `hubspot.record.read`, `hubspot.record.update_fields`, `hubspot.note.create` | Version 2026-09 operation templates; multi-customer OAuth installation or explicitly enrolled customer Service Key, not deprecated new legacy private apps. Bind portal/install identity. |
| NetSuite | `netsuite.invoice.read`, `netsuite.purchase_order.read`, `netsuite.reconciliation.read`, `netsuite.reconciliation.create`, `netsuite.reconciliation.update_fields` | Account-specific SuiteTalk REST v1; certificate-backed OAuth M2M entity/role/application mapping. Reconciliation means preprovisioned custom record, never custom transaction or invoice/PO mutation. |

All reads project declared required fields; no full-record dumps. Lookups use fixed operation filters over approved record types and resource scope, bounded to 100 candidates; zero/ambiguous matches are explicit. Returned business collections are ≤1,000 items and 256 KiB per typed JSON call; no silent truncation. Exceeding an operation bound returns `ADAPTER_LIMIT_EXCEEDED`, never partial success. General request bodies remain ≤256 KiB; canonical action arguments remain ≤16 KiB. Attachment byte acquisition is a separate bounded binary stream governed by the attachment limits below, not the typed JSON response cap.

**Email snapshots and attachments:** plain-text body ≤4,096 characters, subject ≤255, total To/Cc/Bcc ≤50 recipients, ≤4 attachments, each ≤512 KiB and total ≤2 MiB. Recipients, sender/account, body, subject, attachment filename/type/byte digest/size are approved action arguments. Attachment arguments contain opaque authorized business-artifact source references and hashes, never inline bytes or arbitrary URLs. Implement sources through declared Gmail/Outlook message-file attachment-read operations; other already authorized business-artifact sources require an existing producer-owned byte-resolution contract, otherwise reject. V1 fixture coverage includes both mail sources. Reject nested message/item/reference attachments; no arbitrary local path, private capture, audio/video, or observation artifact source. Do not introduce a generic upload service.

Fetch attachment bytes through authorized readback/egress scope before consume; verify size/type/hash in bounded volatile memory, then freeze the exact send payload. Do not persist full mailbox messages or attachment bodies as adapter logs. Use Gmail `messages.send` and Outlook `sendMail` to send the approved snapshot; keep source drafts unchanged and identify the snapshot/source relationship in Oryn's execution record. Do not silently clear or delete an employee draft. Set/retain Sent Items saving. Correlation IDs aid lookup but do not deduplicate vendor processing.

A successful send endpoint response is only acknowledged submission. Verifier must independently match sender mailbox sent-copy evidence to approved semantic content, recipients and attachment hashes. No unique match, multiple matches, hidden required recipient/content evidence, or delayed unavailable copy remains unknown. Normal send verification claims `sent_copy_observed`, never recipient delivery. Delivery-dependent workflows require additional independently qualified evidence; later bounce/rejection remains a separate incident signal. Existing provider limits or unavailable send/readback consent block qualification honestly.

**Spreadsheets:** explicit finite rectangles and exact row/column matrix dimensions; reject scalar broadcasting. Define cell update union `set|clear|skip`, with typed value only for set. Lower clear to empty string, skip to vendor null semantics without conflating absent/trailing empty cells. Preserve existing formulas and formats; reject formula-bearing targets and unqualified formula-looking strings; typed negative numbers remain numeric values. Excel literal treatment must pass targeted certification; no assumption that a Graph values property behaves like Sheets RAW. Excel writes use persistent workbook sessions; readback queries persisted workbook state independently after the session mutation. Serialize Oryn requests per workbook, but never call that an external writer lock.

Conditional writes must be vendor-enforced exact validators. Otherwise require customer-enforced exclusive target ownership with qualified evidence and live scope epoch. A second GET, human approval, weak timestamp, or Oryn mutex is insufficient. If exclusivity cannot be established, the update operation is unavailable; read/guide support can remain. Spreadsheet recalculation and configured automation are declared side effects, not promised absent.

**CRM:** allow only customer-approved object/record/field/value sets. Review personalized metadata, field permissions, calculated/read-only/sensitive fields, and downstream automation. Salesforce Account strong ETag support does not imply generic CAS for all objects; weak If-Unmodified-Since checks do not satisfy the strong guard. HubSpot updatedAt/check-only behavior does not establish CAS. Apply exclusive scope where required.

Salesforce notes use a fixed approved composite request creating ContentNote and ContentDocumentLink with allOrNone=true, approved association, and restricted visibility; inspect every subresponse even for HTTP 200. Do not use generic upsert for update-only operations. HubSpot notes bind body, timestamp, approved associations, and truthful integration ownership; never impersonate an employee. Separate readback checks both content and association/sharing. Permit note creation without native deduplication, but lost response without unique authoritative recovery stays unknown indefinitely pending review; do not infer absence from eventually indexed search. No automatic retry.

**NetSuite:** pin approved account URL, entity, role, integration, certificate, record metadata, enabled features, and environment. Strict property-name/value validation headers use `error`. Required PO line/tax availability is qualified against the actual account; documented ambiguity or missing required evidence blocks the affected reconciliation claim rather than inventing complete coverage. Custom-record types are preprovisioned by customer; Oryn does not create schemas/transactions. Reads/writes can invoke scripts/workflows, so review transitive effects even for custom records and read probes. Use declared account capability: native async idempotency exists only for qualified async requests; never advertise it for generic synchronous calls. If async is qualified, queue acknowledgment is not completed mutation and every status fetch remains read-only. Sandbox refresh invalidates identity/configuration qualification and requires reenrollment.

Cite the following primary sources in the specification and operation tables, with limits treated as provider-version evidence rather than timeless platform guarantees:

- Gmail scopes: https://developers.google.com/workspace/gmail/api/auth/scopes
- Gmail draft lifecycle: https://developers.google.com/workspace/gmail/api/guides/drafts
- Gmail send: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send
- Gmail attachment bytes: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages.attachments/get
- Gmail errors/acknowledgment: https://developers.google.com/workspace/gmail/api/guides/handle-errors
- Sheets scope: https://developers.google.com/workspace/sheets/api/scopes
- Sheets write/null/render semantics: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/update ; https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values ; https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueInputOption
- Outlook send: https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0
- Outlook attachment bytes: https://learn.microsoft.com/en-us/graph/api/attachment-get?view=graph-rest-1.0
- Outlook sent IDs/delivery: https://learn.microsoft.com/en-us/graph/outlook-immutable-id ; https://learn.microsoft.com/en-us/graph/outlook-things-to-know-about-send-mail
- Excel permissions/values/sessions: https://learn.microsoft.com/en-us/graph/api/worksheet-range?view=graph-rest-1.0 ; https://learn.microsoft.com/en-us/graph/api/range-update?view=graph-rest-1.0 ; https://learn.microsoft.com/en-us/graph/api/resources/excel?view=graph-rest-1.0 ; https://learn.microsoft.com/en-us/graph/api/workbook-createsession?view=graph-rest-1.0 ; https://learn.microsoft.com/en-us/graph/workbook-best-practice
- Salesforce conditional writes: https://developer.salesforce.com/docs/platform/api-rest/guide/intro-rest-conditional-requests.html
- Salesforce OAuth/metadata: https://developer.salesforce.com/docs/platform/api-rest/guide/intro-oauth-and-connected-apps.html ; https://developer.salesforce.com/docs/platform/api-rest/guide/resources-sobject-describe.html
- HubSpot OAuth: https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/oauth/working-with-oauth.md
- HubSpot object/property/note contracts: https://developers.hubspot.com/docs/api-reference/latest/crm/using-object-apis.md ; https://developers.hubspot.com/docs/api-reference/latest/crm/properties/guide.md ; https://developers.hubspot.com/docs/api-reference/latest/crm/activities/notes/guide.md
- NetSuite OAuth mapping: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_162686838198.html
- NetSuite custom records/metadata: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_158100110171.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540810168.html
- NetSuite script effects: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1512409310.html ; https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_157927488310.html
- NetSuite async idempotency: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/subsect_164494900632.html

### 6. Complete local browser/native execution and independent readback seams

**Browser:** keep existing `ExecuteBrowserAction` and six packaged primitives `read|click|fill|select|check|navigate`. Browser-backed operation definitions lower to exactly one declared primitive and target; do not hide a multi-step browser macro inside one authorization. Multi-step procedures remain explicit IR/assist steps. Profiles and validated work context stay separate from capability qualification. Map exact connection account identity to a mandatory packaged expected-state field; unavailable account binding blocks actuation. Preserve unique unanimous locators, ≤250 ms handles, DNR navigation guards, live document/surface generations, and no coordinate/fuzzy fallback.

Privacy Helper owns one local reservation record keyed by enrolled device, context, adapter modality, and epoch. Browser reservation handling first acquires this common record, then extension reservation/guard; failure releases the record. Native obtains the same record. Reject competing jobs/assists/profiles/modalities. Preserve existing browser wire reservation messages; add capability `local_execution_reservation_v1` and negotiate browser bridge major 1/minor 4 for common-reservation enforcement and required execution context in result messages. Existing major 1/minor 3 clients must not claim native/browser joint execution support. Update active normative references throughout affected docs and add amendment notes to historical ADRs; no compatibility shim or second reservation lock.

Correct `BrowserActionResult` example to include `execution_context`; define action IDs as Identity `Identifier`, not a conflicting UUIDv4 convention. Correct browser state-machine wording that confuses local primitive completion with business verification. Browser preflight verifies complete signed bundle and admission, not just authorization/approval. No new browser prepare/commit message: adapter preparation uses existing permitted observations/target-resolution interfaces; final executor preflight remains authoritative at the boundary.

**Native:** signed `oryn-adapter-worker` is a Shell-supervised child, not `oryn-observation-worker` and not HUD. Define new private inherited `shell-adapter.v1` major 1/minor 0 under Contract 12; length-prefixed JSON frames ≤256 KiB, no public TCP/named-pipe rendezvous. Shell relays context/authority and presents controls; Privacy Helper gates local observation-derived inputs and reservations. Local worker uses Windows UI Automation supported patterns and macOS Accessibility actions behind deterministic platform bridges, without privilege elevation. Closed primitives: `read|invoke|set_value|select|toggle`. Bind signed app identity, process/window, permitted workspace, target identity, surface generation, exact expected state, and signed authority. Native mutating operations need qualified strong/exclusive business-resource protection in addition to device reservation; user reservation alone does not exclude remote writers.

No coordinates, keyboard/mouse injection, OCR targeting, inaccessible control guessing, credential fields, permission dialogs, or arbitrary action names. Every primitive resolves one live semantic target and validates supported pattern/action. Restrict execution to approved visible foreground workspace; input interference, focus/window change, ambiguity, generation drift, lock/sleep, pause, lost policy/consent/visibility, or helper failure blocks pending dispatch. Screen pause blocks local execution; Pause All and quit terminate new local dispatch; never claim already submitted work was undone. Native Stage 3 only. Use signed synthetic Windows/macOS fixture applications as implementation-time certification obligations; this documentation work supplies contract vectors, not fabricated native runtime evidence.

Local minimal receipts are content-free and independent of personal-history retention. Raw native/browser observations never become a central execution transcript. Observation-derived preparation buffers remain within Privacy Helper consent/retention rules; when retention is off, preserve the 30-second volatile ceiling and require fresh preparation after expiry. Signed hashes/approval records do not justify retaining captured before-values. API-authorized business inputs remain distinct from employee capture.

**Readback:** verifier alone owns source priority, freshness predicates, bounded polling, and final verdict. Adapter executes one bounded fetch per request, with no hidden polling/retry/verdict policy. Default read/preflight deadline 5 seconds, maximum per request 30 seconds; submission deadline 30 seconds, additionally bounded by authority before dispatch. Once bytes/actuation may have been sent, deadline expiry yields unknown regardless of token expiry. Document these as configured operational limits, not measured vendor latency guarantees.

Define `AdapterReadbackRequestV1` (`adapter.readback-request.v1`) with `request_id`, `subject_action_id`, `verification_spec_ref`, `prepared_read` (AdapterExecuteRequestV1 for independently authorized read action), `observed_after`, `max_bytes` (≤256 KiB), and `deadline_at`. It accepts no arbitrary source URL or runner-supplied evidence. Verify caller is independent verifier workload, prepared operation is effect read and readback-role scoped, and account/environment/record match the subject action. Each poll is a new authorized bounded read; no mutation fence is reopened.

Define `AdapterReadbackEvidenceV1` payload with `evidence_id`, `organization_id`, `execution_context`, `subject_action_id`, `read_action_id`, `verification_spec_ref`, `connection_id`, `connection_revision`, `vendor_account_id`, `environment`, `capability_ref`, `operation_id`, `record_key`, `source_version` nullable, `observed_at`, `queried_after`, `consistency=authoritative|eventual|unknown`, `data_sha256`, `content_ref`, `field_provenance`, `limitations`. Standard `SignedAdapterReadbackEvidenceV1` receipt envelope uses `schema_id="adapter.readback-evidence.v1"`. It attests acquired evidence, never a verdict. Normalized data and content references remain authorized evidence, not logs; native private content remains local with metadata-only central references.

Amend `outcome-verification.md` to accept independent readback-role authority with vendor read-only grants when available, or certified L7 read-only enforcement for broader grants. Delete unconditional promises of bypassing vendor caches/direct primary-database access: report real authoritative endpoint, observed version/time, and consistency limits. Reuse existing Graph predicates and three-valued semantics. Human assessment remains Stage 3 only; commit approval is not outcome assessment.

### 7. Specify simulation bindings, evidence fixtures, and cross-document cutover

Define `AdapterEnvironmentBindingV1` (`adapter.environment-binding.v1`) with candidate/behavior/manifest hashes, exact capability/operation/pack references, production qualification reference, simulation qualification reference, simulation connection/account/environment, configuration equivalence evidence, and explicit fidelity gaps. Bind sandbox endpoints and credentials outside immutable executable body; never rewrite candidate behavior to run tests. Reject mapping when behavior-relevant semantics differ without a declared gap; gaps do not become passed coverage or production authority.

Simulator may target isolated vendor sandboxes or deterministic synthetic adapters using the same operation argument/result/side-effect semantics. No production connection grants, credentials, account IDs, or resource routes can enter simulation. Shared provider hostname is not an exception to account isolation. Production browser profiles cannot be repurposed as synthetic environments without separate qualified profile/config binding.

Provide three synthetic reference packs in the contract fixture data: `synthetic.erp`, `synthetic.crm`, `synthetic.support`, covering invoice/PO reconciliation, customer/order status reconciliation, and support exception triage. Supply named records, allowed operations, starting state, expected independently observed outcomes, and injected failures. At least the ERP reference pack describes the entire observe→guide→generate→simulate→supervised execute→incident→correct→repair→re-evaluate→controlled release journey, linking each boundary owner. Do not implement future Runtime/Simulator/Release internals in this documentation task or claim its fixture passes prove full product acceptance.

Create `docs/architecture/contracts/application-adapters-v1.fixtures.json` with these top-level collections:

- `validation_cases`: existing convention `{case_id,schema_ref,instance,expected_valid}`; include negative malformed/cross-variant cases.
- `digest_vectors`: `{case_id,kind,preimage,expected_sha256}`; kinds `capability_body|qualification_body|adapter_action|browser_action|mail_content`.
- `signed_envelope_examples`: public test keys, exact preimage/signature, expected validity; never production keys.
- `binding_vectors`: `{case_id,kind,inputs,expected}`. Kinds `scope_binding|qualification_lifecycle|submission_transition|write_guard|readback_binding|environment_binding|cell_normalization|mail_snapshot|reservation`.
- `reference_workflows`: exact three synthetic workflows with initial state, operations, postconditions and fault expectations.

Fixtures must contain actual instances and computed outputs, not labels claiming success. Document deterministic evaluators for each binding-vector kind as tables/algorithms so a throwaway verifier can independently compute expected output. At minimum cover all Verification scenarios below. Keep positive/negative pairs where changing one business-visible binding must flip the outcome.

Migrate all changed capability bodies and their transitive hashes, manifests, candidate signatures, and evaluation bindings in `agent-factory-v1.fixtures.json`. Do not merely update a required field and leave stale hashes/signatures or weaken expected failures. Locate every affected literal using:

```sh
rg -n 'adapter_capability_version|adapter_revision|ApplicationCapabilityPort|ActionAuthorizationV1|SignedApprovalProposalV1|BrowserActionResult|browser-bridge\.v1|identity_authority_v1|parameter_diffs' TECHNICAL.md GLOSSARY.md docs
```

This is a document/schema caller search, not a source-code symbol search. Read exact matches before edits. Legitimate `SignedApprovalProposalV1` remains in proposal issuance; replace only its incorrect use as an execution approval receipt. Preserve historical bridge versions in ADR chronology while marking current amendment; update active current references everywhere the new contract applies.

Reconcile behavior-defining seams in these existing files, without completing unrelated component internals:

- `TECHNICAL.md` §§4.1/4.3/4.5/4.7, 5.6, 6.3, 7.2 Contracts 6/11–13, 11.4: registry/worker/reservation/credential/digest ownership and current bridge version.
- `docs/components/identity-policy.md` and its schema: connection-bound adapter targets, read staging, trusted facts registration, new management capabilities, exact signed bundle and shared guard semantics.
- `docs/components/agent-factory-ir.md`: async discovery ports, platform api, new qualification/write-guard/operation-status fields, finalization guard, materiality and safe renewal.
- `docs/components/agent-runtime.md`, `job-orchestration.md`: opaque adapter access, one-shot submission journal ownership, fresh-action retries, correct authority bundle.
- `docs/components/browser-extension.md`, `local-context-hud.md`, `desktop-shell.md`, `local-privacy-storage.md`: joint local reservation, native worker supervision, pause/retention/visibility rules, bridge minor 4 capability and result context.
- `docs/components/outcome-verification.md`, `flight-simulator.md`, `release-governance.md`: independent role-constrained readback, environment binding, no readiness transfer or candidate mutation.
- `docs/components/infrastructure-security.md`: broker-enforced credential injection, worker egress denial, vendor consent/compliance enrollment, credential revocation and restore fencing.
- `docs/architecture/contracts/README.md`: Contract 6 versus new Contracts 12/13 schema authority and current local rails.
- `docs/architecture/threat-model.md`: cross-account substitution, broader OAuth token misuse, shared-host test contamination, consume-to-send/zombie dispatch, mailbox draft/content race, external writer race, vendor automation side effects, and stale/forged readback.
- `docs/architecture/data-classification.md`: separate connection secrets, staged authorized business arguments, content-free submission audit, independent evidence, and employee-local raw observations. Metadata/audit follows existing 24-month schedule; unsubmitted staging expires after 24 hours, or sooner under local volatile-source rules. No central raw DOM/media, full mailbox archive, request/response-body logging, or secret recovery through audit.

Keep `PRODUCT.md` behavior unchanged. Native/browser execution remains permissioned and qualified; Tier 4 stays prohibited; all advertised real-vendor support remains unqualified until implementation-time evidence exists.

## Critical files and anchors

Reread before editing; line numbers are hints.

1. `docs/architecture/contracts/identity-policy-v1.schema.json`: AdapterTargetProjectionV1 around 537–588; AdapterStagedActionV1 around 1078–1138; AuthorizationRequestV1 around 2425–2471. Closed existing contracts require coordinated changes.
2. `docs/components/identity-policy.md`: dual digests 241–258, signed execution bundle 308–317, durable fences/journal 424–505. Do not replace or weaken authority ownership.
3. `docs/components/browser-extension.md`: ExecuteBrowserAction 1001–1147, result example 1149–1184, packaged targets/preflight 1303–1386, durable receipt 1507–1519. Browser primitives and digest remain authoritative.
4. `docs/components/agent-factory-ir.md`: producer projections 191–214 and finalization 684–693. Metadata-only compilation and dependency freshness must survive extension.
5. `docs/architecture/contracts/agent-factory-v1.fixtures.json`: digest vectors near 33, shared capability validation near 4267, binding vectors near 11784, capability instances at adapter_revision matches. Material body changes require recomputation through the lineage, not superficial fixture edits.

## Verification

### Authoring-time checks

Working directory: `/Users/hari/Developer/Oryn`. `python3` and `uv` were located; base Python lacks the validation packages. After execution approval, run the following isolated checker once after integration. This installs no product dependency and creates no repository test framework. Fixture `binding_vectors.inputs` and `expected` must use the exact model shapes below; these are document-validation oracles, not a claim of runtime implementation.

```sh
uv run --with 'jsonschema[format-nongpl]' --with referencing --with cryptography --with rfc8785 python - <<'PY'
from __future__ import annotations
import base64
import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource
import rfc8785

ROOT = Path.cwd()
CONTRACTS = ROOT / "docs/architecture/contracts"
COUNTS: dict[str, int] = {"schemas": 0, "validation": 0, "digests": 0, "signatures": 0, "bindings": 0}
BINDING_KEYS = ("organization_id", "execution_context", "connection_id", "connection_revision",
                "vendor_account_id", "environment", "capability_ref", "record_key")

def obj(value: object) -> dict[str, object]:
    if not isinstance(value, dict) or not all(isinstance(k, str) for k in value):
        raise TypeError("Expected JSON object")
    return {k: v for k, v in value.items()}

def arr(value: object) -> list[object]:
    if not isinstance(value, list):
        raise TypeError("Expected JSON array")
    return list(value)

def text(value: object) -> str:
    if not isinstance(value, str):
        raise TypeError("Expected string")
    return value

def pairs(items: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in items:
        if key in result:
            raise ValueError(f"Duplicate JSON key: {key}")
        result[key] = value
    return result

def load(path: Path) -> dict[str, object]:
    return obj(json.loads(path.read_text(), object_pairs_hook=pairs))

def digest(value: object) -> str:
    return hashlib.sha256(rfc8785.dumps(value)).hexdigest()

def moment(value: object) -> datetime:
    return datetime.fromisoformat(text(value).replace("Z", "+00:00"))

def decode(value: object) -> bytes:
    token = text(value)
    return base64.urlsafe_b64decode(token + "=" * (-len(token) % 4))

def same_binding(left: object, right: object) -> bool:
    a, b = obj(left), obj(right)
    return all(k in a and k in b and a[k] == b[k] for k in BINDING_KEYS)

def evaluate(kind: str, data: dict[str, object]) -> dict[str, object]:
    if kind == "scope_binding":
        fields = set(map(text, arr(data["requested_fields"])))
        allowed = set(map(text, arr(data["allowed_fields"])))
        records = set(map(text, arr(data["allowed_record_ids"])))
        return {"allowed": same_binding(data["registered"], data["request"])
                and fields <= allowed and data["record_key"] in records}
    if kind == "qualification_lifecycle":
        same = digest(data["definition_before"]) == digest(data["definition_after"])
        issued, expiry, now = map(moment, (data["issued_at"], data["not_after"], data["now"]))
        active = issued <= now < expiry <= issued + timedelta(days=30)
        return {"behavior_unchanged": same,
                "dispatch_allowed": same and active and data["checks_passed"] is True and data["revoked"] is False}
    if kind == "submission_transition":
        state, sends, blocked, live = "prepared", 0, False, True
        for raw_event in arr(data["events"]):
            event = text(raw_event)
            if event == "admit" and state == "prepared":
                state = "admitted"
            elif event == "dispatch":
                if state == "admitted" and sends == 0 and live:
                    state, sends = "dispatched", 1
                else:
                    blocked = True
            elif event == "acknowledge" and state == "dispatched":
                state = "application_acknowledged"
            elif event in ("lose_response", "crash", "admission_ack_lost"):
                state = "unknown"
            elif event == "prove_not_dispatched":
                if sends != 0:
                    raise ValueError("Cannot prove no-send after observed dispatch")
                state = "not_dispatched"
            elif event == "revoke_epoch":
                live = False
            elif event == "retry_same_action":
                blocked = True
            else:
                raise ValueError(f"Invalid submission event/state: {event}/{state}")
        return {"submission_state": state, "dispatch_count": sends, "duplicate_blocked": blocked}
    if kind == "write_guard":
        guard = text(data["guard"])
        if data["effect"] == "read":
            allowed = guard == "not_applicable"
        elif guard == "immutable_input":
            allowed = data["operation_kind"] in ("create", "send") and data["content_matches"] is True
        elif guard == "strong_precondition":
            allowed = (data["validator_kind"] == "strong" and data["expected_validator"] not in (None, "")
                       and data["expected_validator"] == data["live_validator"])
        else:
            allowed = (guard == "exclusive_scope" and data["exclusive_valid"] is True
                       and data["expected_epoch"] == data["live_epoch"])
        return {"allowed": allowed and (data["effect"] == "read" or data.get("formula_target", False) is False)}
    if kind == "readback_binding":
        return {"accepted": same_binding(data["subject"], data["evidence"])
                and data["caller_role"] == "verifier" and data["operation_effect"] == "read"
                and moment(data["queried_at"]) >= moment(data["submitted_at"])
                and digest(data["observed_data"]) == data["data_sha256"]}
    if kind == "environment_binding":
        account = text(data["actual_account"])
        return {"allowed": data["environment"] == "simulation"
                and account in arr(data["allowed_simulation_accounts"])
                and account not in arr(data["production_accounts"])
                and data["credential_environment"] == "simulation"
                and data["pinned_behavior_sha256"] == data["mapped_behavior_sha256"]
                and data["pinned_operation_id"] == data["mapped_operation_id"]}
    if kind == "cell_normalization":
        before = [arr(row) for row in arr(data["before"])]
        changes = [arr(row) for row in arr(data["changes"])]
        if not before or not before[0] or len(changes) != len(before):
            return {"accepted": False, "values": None}
        width = len(before[0])
        if any(len(row) != width for row in before + changes):
            return {"accepted": False, "values": None}
        protected = {tuple(arr(position)) for position in arr(data["formula_cells"])}
        result: list[list[object]] = []
        for r, row in enumerate(changes):
            output: list[object] = []
            for c, raw in enumerate(row):
                cell = obj(raw)
                if cell["kind"] == "skip":
                    output.append(before[r][c])
                    continue
                if (r, c) in protected:
                    return {"accepted": False, "values": None}
                if cell["kind"] == "clear":
                    output.append({"kind": "string", "value": ""})
                elif cell["kind"] == "set":
                    value = obj(cell["value"])
                    if (value["kind"] == "string"
                            and text(value["value"]).lstrip().startswith(("=", "+", "-", "@"))
                            and data["literal_text_certified"] is False):
                        return {"accepted": False, "values": None}
                    output.append(value)
                else:
                    raise ValueError("Unknown cell update kind")
            result.append(output)
        return {"accepted": True, "values": result}
    if kind == "mail_snapshot":
        approved_hash = digest(data["approved"])
        matches = sum(digest(copy) == approved_hash for copy in arr(data["observed_sent_copies"]))
        return {"dispatch_allowed": digest(data["prepared"]) == approved_hash,
                "send_verified": matches == 1, "delivery_verified": False}
    if kind == "reservation":
        owner, request = data["owner"], obj(data["request"])
        return {"allowed": owner is None or obj(owner) == request}
    raise ValueError(f"Unknown binding kind: {kind}")

registry = Registry()
schemas: list[dict[str, object]] = []
for path in sorted(CONTRACTS.glob("*.schema.json")):
    schema = load(path)
    Draft202012Validator.check_schema(schema)
    resource = Resource.from_contents(schema)
    registry = registry.with_resource(text(schema["$id"]), resource).with_resource(path.resolve().as_uri(), resource)
    schemas.append(schema)
    COUNTS["schemas"] += 1

def refs(value: object, base: str) -> None:
    if isinstance(value, dict):
        item = obj(value)
        if "$ref" in item:
            registry.resolver(base).lookup(text(item["$ref"]))
        for child in item.values():
            refs(child, base)
    elif isinstance(value, list):
        for child in value:
            refs(child, base)

for schema in schemas:
    refs(schema, text(schema["$id"]))

for name in ("agent-factory-v1.fixtures.json", "application-adapters-v1.fixtures.json"):
    fixture = load(CONTRACTS / name)
    for raw in arr(fixture["validation_cases"]):
        case = obj(raw)
        validator = Draft202012Validator({"$ref": case["schema_ref"]}, registry=registry, format_checker=FormatChecker())
        assert validator.is_valid(case["instance"]) is case["expected_valid"], (name, case["case_id"])
        COUNTS["validation"] += 1
    for raw in arr(fixture["digest_vectors"]):
        case = obj(raw)
        expected = case["expected_sha256"] if "expected_sha256" in case else case["sha256"]
        assert digest(case["preimage"]) == expected, (name, case["case_id"])
        COUNTS["digests"] += 1
    keys = {text(obj(key)["key_id"]): obj(key) for key in arr(fixture["public_keys"])}
    for raw in arr(fixture["signed_envelope_examples"]):
        case = obj(raw)
        envelope = obj(case["envelope"])
        key = keys[text(case["public_key_id"])]
        preimage = text(envelope["schema_id"]).encode() + b"\n" + rfc8785.dumps(envelope["payload"])
        public = Ed25519PublicKey.from_public_bytes(decode(key["public_key_base64url"]))
        valid = True
        try:
            public.verify(decode(envelope["signature"]), preimage)
        except InvalidSignature:
            valid = False
        assert valid is case["expected_valid"], (name, case["case_id"])
        COUNTS["signatures"] += 1
    if name.startswith("application-adapters"):
        covered: set[str] = set()
        for raw in arr(fixture["binding_vectors"]):
            case = obj(raw)
            kind = text(case["kind"])
            assert evaluate(kind, obj(case["inputs"])) == case["expected"], case["case_id"]
            covered.add(kind)
            COUNTS["bindings"] += 1
        assert covered == {"scope_binding", "qualification_lifecycle", "submission_transition", "write_guard",
                           "readback_binding", "environment_binding", "cell_normalization", "mail_snapshot", "reservation"}
assert all(value > 0 for value in COUNTS.values())
print("PASS", COUNTS)
PY
```

Use the existing Factory fixture `public_keys`/envelope layout in the new fixture too. `digest_vectors.expected_sha256` stores bare lowercase hex; encode action/proposal prefixes in actual DTO fields, not the raw hash expectation. Each binding input is a normalized typed model of the named boundary, not caller authority. `mail_snapshot` models semantic content already normalized by the pack. The checker intentionally does not execute a future adapter/runtime or replace full consumer qualification.

In the same focused proof, separately check canonical twelve headings, meaningful section content, changed relative links, OpenAPI local references/security/idempotency/CSRF fields, and all changed transitive Factory candidate/manifest/reference hashes. These are document-integration assertions; do not label them runtime tests. Add assertions to the same throwaway invocation if needed, using the exact changed DTOs and preimages rather than source-string echoes.

Report the actual command, counts, and any unavailable check. No vendor accounts, OAuth secrets, native permissions, or production mutations are needed. If package downloads fail and no equivalent installed validator exists, report validation unavailable; JSON parsing alone is not a substitute. Keep vendor/native/end-to-end certification explicitly implementation pending.

### Required new-behavior vectors and observable results

| Input/condition | Expected computed result |
|---|---|
| Same approved content, same account, valid qualification/admission | Exactly one dispatch claim and acknowledged submission; no business verdict |
| Same action with competing worker/attempt, including restored/zombie epoch | Second dispatch denied; old epoch cannot transmit |
| Admission commit or acknowledgment lost before send | No inferred authority; no automatic dispatch/replay |
| Worker dies after admission or broker loses response after write | Unknown unless positive no-send evidence; consumed fence remains consumed |
| Explicit no-send reconciliation followed by fresh request | New action ID and retry lineage required; original action cannot replay |
| Connection/vendor account/revision changed under identical record key | Digest mismatch or scope denial before dispatch |
| Customer qualification expires or pack revoked between stages | New affected dispatch blocked; separately safe readback can continue |
| Unchanged renewal with new timestamps/evidence generation | Same executable body/capability digest; no automatic release/evaluation pass |
| Argument/recipient/Bcc/body/attachment hash changes after approval | Stale proposal; no send |
| Outlook 202 or Gmail response without independently matched sent copy | Acknowledged or unknown, never delivery/verified-send claim |
| Two possible sent-copy matches | Unknown; no automatic resend |
| Gmail compose token requests send without Tier 3 receipt | Denied by broker/action authority despite broad OAuth scope |
| Excel write-capable token held in readback role requests PATCH | Egress denied; absence of enforcement makes qualification unavailable |
| Sheet cell changed by another actor without strong/exclusive protection | Update unavailable; second GET/local mutex does not qualify |
| Formula-bearing target, invalid matrix dimensions, or unqualified formula-like string | Reject before submission; typed negative numeric value remains valid |
| Cell skip versus clear; vendor omitted trailing blanks | Correct deterministic normalization; no accidental clearing/broadcast |
| CRM note accepted but returned ID lost; search has no immediate match | Unknown; no duplicate create |
| Salesforce composite top-level 200 with failed subrequest | Not successful note/association; inspect rollback/evidence and classify |
| NetSuite custom-record script/config changes or required PO/tax evidence missing | Qualification invalidated or affected reconciliation blocked |
| Simulation connection points at production account on shared provider host | Environment binding denied even though hostname matches |
| Runner supplies fabricated readback, wrong record/account, stale observation | Evidence rejected or verifier receives explicit unknown/freshness limitation |
| Browser assist holds reservation; native/job requests another | Busy/denied; never parallel local actuation |
| Screen pause, lock, visibility loss, or stale native generation before call | No new local dispatch; prior submitted effects preserved |
| Duplicate JSON key, invalid profile kind, missing new field, wrong signature | Schema/semantic/cryptographic failure, never permissive fallback |

## Assumptions and contingencies

- This is specification authoring only. Source implementation, real credential enrollment, Google restricted-scope assessments, vendor sandbox execution, and Windows/macOS certification are not performed or claimed by this task. The specification defines their exact qualification evidence obligations.
- Customer-specific record/field/value allowlists, vendor API version, resource ownership, approved automation effects, and business policies are required deployment inputs. Missing configuration blocks that operation; do not invent a default policy or substitute another transport.
- Exclusive scopes require customer-enforced evidence and live validity, not a promise inferred from Oryn's queue. If customer/vendor cannot supply this or strong preconditions, publish read/guide support and unavailable mutation support honestly.
- Vendor support contradicted by newer primary documentation must not silently widen scope. Preserve agreed safe behavior, update cited constraint and affected qualification requirement, and mark unsupported operation explicitly if no compliant binding exists.
- The documented filesystem contains specifications, not an application implementation. Make a clean schema/example cutover now; do not add compatibility aliases for hypothetical deployed consumers.
- If a new ADR is added concurrently, use the next available number and update all new references consistently. Preserve unrelated user changes and comments.
