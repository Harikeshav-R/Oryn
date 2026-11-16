# Identity, Organization, Access, and Approval Governance Component Specification

Status: Detailed technical specification — implementation pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§5.2, 7.2 (Contracts 11, 18, 22), 9.2–3, 11.3–5, 13.2](../../TECHNICAL.md) | [PRODUCT.md §§6–7, 14, 16.6, 25.6–9; ORY-001, ORY-026–030, ORY-041, ORY-045–048, ORY-067–070, ORY-071–076](../../PRODUCT.md) | [ADR-0011](../adr/0011-identity-authority-and-approval-fencing.md) | [identity-policy-v1.schema.json](../architecture/contracts/identity-policy-v1.schema.json) | [identity-policy-v1.fixtures.json](../architecture/contracts/identity-policy-v1.fixtures.json)

### Core Responsibility
Identity, Organization, Access, and Approval Governance (Catalog Component 8) is the authoritative policy definition point (PDP), admission authority, session governance engine, and formal approval clearinghouse across the Oryn platform. It governs organizations, memberships, teams, user and service identities, role assignments, action risk classifications (Tier 0 through Tier 4), autonomy gates, approval delegations, execution credentials, and cryptographic approval and admission receipts.

### Deployment Reference Architecture
Identity is implemented as a pure, deterministic Rust logical module embedded directly within the modular Oryn Control Plane, backed by transactional PostgreSQL storage with Row-Level Security (RLS) and transactionally locked authority guards. It uses a pure typed evaluator without dynamic script interpreters, external policy servers, or customer-authored domain policy languages.

```
+---------------------------------------------------------------------------------------------------+
|                                        ORYN CONTROL PLANE                                         |
|                                                                                                   |
|  +-------------------------+     +-------------------------------+     +-----------------------+  |
|  |     BFF / HTTP Tier     |     |   Session Admission Manager   |     |    Auth0 Universal    |  |
|  | (Cookies / CSRF / CORS) |<--->| (Exchange / Refresh / Secret) |<--->| Login Broker (OIDC)   |  |
|  +-------------------------+     +---------------+---------------+     +-----------------------+  |
|               ^                                  |                                                |
|               |                                  v                                                |
|               |                  +-------------------------------+                                |
|               |                  | Verified Principal / Session  |                                |
|               |                  +---------------+---------------+                                |
|               v                                  v                                                |
|  +---------------------------------------------------------------------------------------------+  |
|  |                 IDENTITY, ORGANIZATION, ACCESS, AND APPROVAL GOVERNANCE                     |  |
|  |                                                                                             |  |
|  |  +---------------------------+  +---------------------------+  +-------------------------+  |  |
|  |  | Pure Rust Typed Evaluator |  | Formal Approval Engine    |  | Keyset & Signer Manager |  |  |
|  |  | (evaluate_authorization)  |  | (Proposals / Decisions)   |  | (Ed25519 / Hashi Vault) |  |  |
|  |  +-------------+-------------+  +-------------+-------------+  +------------+------------+  |  |
|  |                |                              |                             |               |  |
|  |                v                              v                             v               |  |
|  |  +---------------------------------------------------------------------------------------+  |  |
|  |  |                Durable PostgreSQL Storage (RLS Enabled + Authority Guards)            |  |  |
|  |  +---------------------------------------------------------------------------------------+  |  |
|  +-----------------------------------------------+---------------------------------------------+  |
|                                                  |                                                |
|                                                  v                                                |
|                                  +-------------------------------+                                |
|                                  |   Authority Recovery Journal  |                                |
|                                  |  (Outbox -> Immutable Audit)  |                                |
|                                  +-------------------------------+                                |
+---------------------------------------------------------------------------------------------------+
```

### Module Ownership Matrix

| System Domain | Responsible Owner | Clear Boundary Invariants |
|---|---|---|
| **External Authentication** | Auth0 Universal Login Broker | Auth0 handles user credential verification, SAML/OIDC enterprise federation, passwordless email codes, and WebAuthn/TOTP MFA. Auth0 claims prove *authentication only*. Auth0 assertions never confer Oryn organization membership, role assignments, capture consent, publication rights, or execution authority. |
| **HTTP Transport & Physical Sessions** | Control Plane (BFF Tier) | BFF terminates HTTP, manages secure session cookies (`Secure`, `HttpOnly`, `SameSite=Lax`, `__Host-`), verifies CSRF tokens, manages rate limits, and persists physical token digests. Identity Policy evaluates session admission, lifetime bounds, idle timeouts, step-up requirements, and verified principal construction. |
| **Endpoint Credentials & Local Gates** | Desktop `SessionBroker` & Privacy Helper | `SessionBroker` holds native session secrets in OS credential storage (`com.oryn.device.identity`). Privacy Helper enforces local capture consent, manages software Ed25519 review keys, and maintains local release fences. Sync transports public enrollment and verified artifacts only. |
| **Release & Readiness Governance** | Release Governance | Release Governance owns candidate evaluation benchmarks, readiness evidence, and active release eligibility. Identity Policy verifies whether the requesting actor or workflow holds authorization to propose or approve releases, but does not compute simulation metrics. |
| **Business Verification** | Outcome Verification | Outcome Verification evaluates whether an executed external mutation achieved its intended business truth. Identity Policy authorizes execution attempts; authorization success ≠ business completion. |
| **Cryptographic Custody** | Infrastructure Security | Infrastructure Security manages HashiCorp Vault Transit mounts, service identity (mTLS), and WORM audit archive infrastructure. Identity Policy requests purpose-bound Ed25519 signatures through narrowly scoped Vault Transit keys. |

### Does Not Own
- Executing external API or browser mutations (owned by [application-adapters](application-adapters.md) and [browser-extension](browser-extension.md)).
- Determining factual correctness or readback confirmation of business outcomes (owned by [outcome-verification](outcome-verification.md)).
- Generating prompt instructions or agent plans (owned by [agent-factory-ir](agent-factory-ir.md)).
- Selecting customer-side frontend frameworks, LLM foundation providers, or cluster orchestrators.

### Boundary Requirements and Autonomy Invariants
1. **Model Never Grants Authority:** A machine learning model or autonomous agent may request authorization for an action, but cannot grant authorization. Machine inference authority is strictly decoupled from business action authorization: permission to execute an inference request grants zero right to mutate external business systems or export data.
2. **Deterministic Interception:** Every consequential action (Tier 3) is intercepted and evaluated by the deterministic policy engine at the physical execution boundary. Tier 3 actions require an explicit item-level human approval matching the canonical proposal digest (`action_sha256`).
3. **Tier 4 Absolute Prohibition:** Tier 4 restricted operations (e.g., automated funds transfers, credential exports, production database drops) are unconditionally denied for automated agent actuation across all v1.0 workloads, regardless of prior human demonstrations or prompt instructions.
4. **Single Active Organization Profile:** Exactly one organization and employee profile is active per operating system desktop user session. Switching organizations requires an explicit sign-out, termination of background capture, flushing of session tokens and local caches, locking of the private profile, and pairing via an independent browser login transaction.

---

## Product requirements

### Key Product Traceability

| Requirement ID | Product Specification Clause | Normative Identity Policy Implementation |
|---|---|---|
| **ORY-001** | Workspace Administration & Instant Revocation | Immediate transactional guard updates; outbox broadcast of `policy.changed` and `access.revoked`; connected long-poll wakeup within 2s; 500 ms endpoint acknowledgment barrier. |
| **ORY-002** | Observation and Consent Controls | Issuance of bounded `SignedCapturePolicyLease` (max 24h); consent withdrawal immediately pauses capture while preserving cached read-only guidance access. |
| **ORY-003** | Offline Capture Ceilings | Strict 24-hour absolute offline expiration for capture-policy leases; zero automatic resumption without fresh network policy refresh. |
| **ORY-004** | Privacy Helper Autonomy | Desktop privacy helper maintains software Ed25519 review key in OS-protected storage (`com.oryn.device.identity`) without central key escrow. |
| **ORY-005** | Raw Data Retention Bounds | Enforces organization policy ceilings (default 7 days, max 14 days) in capture leases; legal holds cannot extend raw retention bounds. |
| **ORY-007** | Mandatory Retention Verdicts | Issuance of `SignedRetentionVerdict` with `scope_coverage: complete`; missing or incomplete verdict unconditionally blocks voluntary destruction or client uninstall. |
| **ORY-008** | Transient Cloud Inference | Issuance of `InferenceAuthorization` tokens strictly bounded to certified routes, contractual ZDR terms, US data confinement, and deletion generation matching. |
| **ORY-026** | Tier 3 Human-in-the-Loop Approval | Item-level human approval displaying exact parameter diffs, consequence summary, and rule/authority checks bound to stable `action_sha256` and `proposal_digest`. |
| **ORY-027** | Tier 4 Execution Prohibition | Hardcoded, non-overridable code guard denying automated execution attempts for Tier 4 operations. |
| **ORY-028** | Strict Scope Containment | Closed `ScopeV1` typed record enforcement; multi-tenant RLS partitioning; missing or null organization denied. |
| **ORY-029** | No Silent Privilege Expansion | Agent repairs or rule changes cannot expand operational permissions without explicit administrator re-authorization. |
| **ORY-030** | Autonomy Stage Progression Gates | Formal governance proposals (`SignedGovernanceProposalV1`) requiring Workflow Owner approval by default, and Security Admin approval when permissions expand or policy explicitly demands stricter fencing. |
| **ORY-041** | Target Generation Staleness | Validation of live document generation, surface generation, and record revision; generation drift invalidates authorization and requires revised proposal. |
| **ORY-045** | Durable One-Use Consumption Fence | Atomically locks `identity_action_fence` keyed by `(organization_id, execution_context_sha256, action_id)`; duplicate attempts rejected. |
| **ORY-046** | Honest Outcome Boundary | Permission consumption and dispatch admission are distinct from external outcome verification; unverified external results report `Outcome Unknown`. |
| **ORY-047** | Authority Recovery Protection | Independent durable authority recovery journal protocol preventing backup restoration from resurrecting revoked permissions or consumed fences. |
| **ORY-048** | Separation of Duties | Job initiators cannot approve staged consequential actions without an explicit, active `ApprovalDelegationV1` within approved policy ceilings. |
| **ORY-067** | Legal Hold Governance | Security Admin with recent MFA sets/releases holds; holds require complete source coverage and prevent destruction of processed records. |
| **ORY-068** | Immediate Security Policy Enforcement | Policy updates apply immediately to canonical guards; in-flight unconsumed authorizations invalidated. |
| **ORY-069** | Controlled Tenant Offboarding | Suspending or deactivating an organization revokes session credentials, terminates capture leases, and halts future job authorization. |
| **ORY-070** | Consequential Audit Immutability | Tamper-evident, WORM-compatible audit trails for every role grant, policy revision, authorization verdict, and formal approval. |
| **ORY-071–076** | Governed Inference Gates | Enforces certified routes, tenant monthly budget caps, ephemeral input-scope hashing, and zero retention. |

### Fixed Role Catalog and Role-Maximum Matrix
Oryn defines nine immutable role IDs with standard product display names:

```
+---------------------------------------------------------------------------------------------------+
|                                      FIXED ROLE HIERARCHY                                         |
|                                                                                                   |
|  [Organization Admin]  [Security Admin]                                                           |
|          |                     |                                                                  |
|          +----------+----------+                                                                  |
|                     |                                                                             |
|                     v                                                                             |
|            [Operations Manager]                                                                   |
|                     |                                                                             |
|                     v                                                                             |
|             [Workflow Owner]                                                                      |
|               /          \                                                                        |
|              v            v                                                                       |
|      [Agent Operator]   [Automation Builder]                                                      |
|              \            /                                                                       |
|               v          v                                                                        |
|                   [SME]                                                                           |
|                     |                                                                             |
|                     v                                                                             |
|                [Employee]  <---  [Read-Only Stakeholder] (Scoped read subset)                     |
+---------------------------------------------------------------------------------------------------+
```

1. **`employee` (Employee):** `playbook.read`, personal privacy and contribution controls, participation in authorized assist sessions, `application.read` within allowed application scope. No production `job.run`.
2. **`sme` (Subject Matter Expert):** Employee permissions plus `workflow.review`. May explain workflows and propose candidate rules, but cannot approve business rules.
3. **`agent_operator` (Agent Operator):** Employee permissions plus `job.run`, team-scoped `incident.review`, and `action.approve` *only under an active, matching approval delegation*.
4. **`workflow_owner` (Workflow Owner):** Employee permissions plus assigned `workflow.review`, `rule.approve`, `agent.edit` (remit-scoped authoring and draft edits; grants no `job.run`, action delegation, or production write authority), `incident.review`, `repair.approve`, `release.approve`, `schedule.manage`, `application.qualify` (operation qualification staging/approvals in workflow/application remit), `simulation.read`, and `simulation.review` (remit-scoped suite sealing and expected-result review). Action approval requires an explicit approval delegation; job execution requires the operator role.
5. **`automation_builder` (Automation Builder):** Employee permissions plus `workflow.review`, `agent.edit`, `simulation.read`, `simulation.edit` (scenario authoring and draft modifications), and `simulation.evaluate` (launching candidate evaluation runs). May propose candidate agents, repairs, and test runs, but cannot approve production releases or seal readiness suites.
6. **`operations_manager` (Operations Manager):** Team-scoped `playbook.read`, `analytics.read`, and read-only issue/incident status. Manager status does *not* confer action approval or raw evidence access.
7. **`security_admin` (Security Admin):** `privacy_policy.manage`, `security_policy.manage`, `audit.read`, `hold.manage`, `integration.manage` (connection creation, scope expansion approval, credential lifecycle in application/team scope), `simulation.manage_policy` (tenant simulator limit policy), and security-side permission expansion approval. No implicit business rule or release owner authority.
8. **`organization_admin` (Organization Admin):** `membership.manage`, `execution_limits.manage`, team structure administration, and external identity federation configuration. No implicit action approval, business rule approval, arbitrary vendor data, or private evidence rights.
9. **`read_only_stakeholder` (Read-Only Stakeholder):** Scoped `playbook.read`, `application.read`, `simulation.read`, and eligible report/status reads. No write, execution, or export rights by default.

### Public Capability Catalog
The system enforces twenty-seven strictly bounded capabilities:
- **Public Capabilities:** `playbook.read`, `workflow.review`, `rule.approve`, `agent.edit`, `job.run`, `action.approve`, `incident.review`, `repair.approve`, `release.approve`, `analytics.read`, `report.export`, `privacy_policy.manage`, `membership.manage`, `application.read`, `simulation.read`, `simulation.edit`, `simulation.evaluate`, `simulation.review`.
- **Internal Governance Capabilities:** `schedule.manage`, `audit.read`, `security_policy.manage`, `hold.manage`, `identity.recover`, `integration.manage`, `application.qualify`, `execution_limits.manage`, `simulation.manage_policy`.

Token scopes map respectively to OAuth claims: `application.read` (`application:read`), `integration.manage` (`integration:manage`), `application.qualify` (`application:qualify`), `execution_limits.manage` (`execution_limits:manage`).

*Organization Execution Limits Policy (`execution_limits`):*
Configured via `OrganizationPolicyV1.execution_limits` using `ExecutionLimitsPolicyV1`:
- `max_active_cases`: integer 1..4 (default: 4)
- `max_active_cases_per_job`: integer 1..2 (default: 2)
- `max_active_cases_per_connection`: integer 1 (default: 1)
- `default_max_active_ms`: integer 1..900000 (default: 900,000 ms = 15 minutes)
- `job_spend_limit_microusd`: decimal integer string or null
Managed exclusively by Organization Admin via `execution_limits.manage`. Security Admin retains `security_policy.manage` for mandatory ceilings, not runtime job limits.

*Scheduled Execution Authority (`ScheduledExecutionAuthorityV1`):*
Scheduler execution uses an internal evaluated record `ScheduledExecutionAuthorityV1` binding `schedule_id`, `schedule_revision`, `owner_actor_id`, `sponsor_actor_id`, `approved_scope`, `policy_revision`, `owner_role_revision`, and `sponsor_role_revision`. The scheduler's authenticated WorkloadPrincipal queries this evaluation; Identity verifies that the sponsor holds current `job.run` and the owner holds `schedule.manage` without fabricating human session MFA or WebMember identities. Tier 3 steps within scheduled jobs still require real human approval.

*Special Policy Guard (`report.export`):* `report.export` requires an explicit grant from an authorized security policy within an existing report-read scope. Its absence denies export even if an actor can view a dashboard.

### Approval Delegations and Separation of Duties
An `ApprovalDelegationV1` is strictly decoupled from basic role assignments:
- **Delegation Attributes:** Approver actor ID, allowed action types (1–128), allowed record types (1–128), scope (`team_id`, `workflow_id`, `application_id`, optional record ID list <= 1,000), optional amount limit (`AmountLimitV1`), validity interval (`valid_from` to `not_after`), and `distinct_initiator_required` boolean.
- **Monetary Constraints:** `AmountLimitV1` specifies `max_minor_units` (nonnegative decimal integer string, semantic max signed 64-bit integer `9223372036854775807`) and a 3-letter ISO-4217 `currency` string. Currency conversion, floating-point arithmetic, split-action downgrade, or missing amount limits are strictly prohibited.
- **Bootstrap Invariant:** The power to *establish* a delegation is separated from the power to *exercise* it. Security Admin plus applicable Workflow Owner establish initial delegation ceilings without holding an action-approval delegation themselves. Operators and owners cannot redelegate.
- **Self-Approval Rules:** A job initiator or assist employee may approve its own staged action only if they hold an active, matching `ApprovalDelegationV1` and the organization policy has `distinct_initiator_required: false`. If organization policy requires distinct humans, self-approval is denied with `IDENTITY_SEPARATION_REQUIRED`.
- **Release Separation:** A production release requires a Workflow Owner distinct from its proposer. Production release authorization defaults to the designated Workflow Owner; Security Officer approval is required only when permissions expand or organizational policy explicitly demands stricter fencing. Universal dual Owner/Security sign-offs are not required for standard releases. Missing workflow Owner blocks final approval; Organization Admin must assign an Owner rather than substitute themselves.

---

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md) | Wire Schema: [`identity-policy-v1.schema.json`](../architecture/contracts/identity-policy-v1.schema.json)

### Contract Reference Summary
- **Contract 11 (Synchronous Action Authorization):** Real-time interception of proposed operations from [agent-runtime](agent-runtime.md) and [local-context-hud](local-context-hud.md). Binds `ExecutionContextV1`, `action_sha256`, target key, record key, and document/surface generations. Resolves live knowledge eligibility (`KnowledgeEligibilitySnapshotV1`) with [operational-graph](operational-graph.md) inside the authoritative transaction; active conflicts or superseded rules without approved continuations reject admission fail-closed. Returns `Allow`, `Deny`, or `RequireHumanApproval`.
- **Contract 3 (Guidance Access Lease Authorization):** Evaluates the strict conjunction of Discovery source audiences (`DiscoveryAudienceV1`) against the requesting principal before issuing signed guidance access leases (`hud.guidance-access-lease.v1`, max 24 hours) for exact playbook and guidance bundle hashes.
- **Contract 13 (Verification Read Authority):** Authoritative issuance of dedicated non-actuating read tokens under the `verification_read` purpose (`SignedVerificationReadAuthorizationV1` and single-use `SignedVerificationReadLeaseV1`) to [outcome-verification](outcome-verification.md) and [application-adapters](application-adapters.md). Binds exact prepared read target digest, connection ID, attempt epoch, and tenant context. Structurally incapable of authorizing mutations or workflow state transitions. Evaluates server-side separation-of-duty policies (`OrganizationPolicyV1.verification_policy`).
- **Contract 18 (Analytics, Reporting Governance & Notifications):** Delivers authorized role-scoped read models, permission updates, and immutable audit streams to [command-center-analytics](command-center-analytics.md):
  - **Reporting Policy Governance (`ReportingPolicyV1`):** Configured on `OrganizationPolicyV1.reporting_policy`, binding mandatory privacy parameters including `minimum_cohort_size` (enforcing the 5-contributor floor), `sealing_delay_hours` (72-hour delay after ISO week close), and `retention_days` (730 days / 24 months).
  - **Analytics Capabilities:** Enforces RBAC capability authorization for administrative operations: `analytics.pilot.manage` (required to create, amend, or transition evaluation pilots) and `analytics.assumptions.manage` (required to record or approve workflow baseline durations and wage assumptions).
  - **Approval Reporting Facts (`ApprovalReportingFactV1`):** Ingested by Command Center Analytics via `ReportingSourcePort` to track human escalation decisions, approval wait interval bounds, and review dispositions without exposing reviewer identity beyond authorized roles.
  - **Child Token Scope for Notifications:** Issues scoped child tokens (`ChildTokenRequestV1`) bound to `audience: "notifications"`, allowing Desktop Shell to authenticate the dedicated `/v1/notifications` long-polling feed without exposing ambient administrative rights.
- **Contract 17 (Simulation Admission and Test Identity):** Authoritative issuance of `SignedSimulationAdmissionV1` (`identity.simulation-admission.v1`) to [flight-simulator](flight-simulator.md). Binds evaluation ID, suite, scenario, attempt, target identity, test-realm principals, and environment bindings. Authenticates test-realm scripted actors with pure policy evaluations, ensuring simulated approvals never count toward human examples or supervised production history. Manages evaluation trust-key purpose in `SignedTrustKeysetV1`.
- **Contract 22 (Governed Cloud Inference Authorization):** Issues short-lived, signed `InferenceAuthorization` tokens to [cloud-inference](../architecture/cloud-inference.md). Enforces purpose allowlists, US processing, ZDR terms, and tenant monthly micro-USD budgets.
- **Contract 24 (Contribution Sync Root):** Authoritative trust root for review-key registration and enrollment challenge validation for [contribution-sync](contribution-sync.md).

### Cryptographic Envelopes and Signer Preimage Rule
All signed identity and policy artifacts use standard Draft 2020-12 envelopes:
```json
{
  "schema_id": "identity.action-authorization.v1",
  "key_id": "key_policy_2026_01",
  "payload": {
    "authorization_id": "22222222-2222-4222-8222-222222222222",
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "actor_id": "usr_employee_01",
    "worker_id": "wrk_runner_finance_01",
    "device_id": "dev_macbook_01",
    "profile_id": "prf_default_01",
    "audience": "execution",
    "execution_context": {
      "kind": "job",
      "job_id": "job_invoice_audit_01",
      "case_id": "case_inv_99882",
      "agent_version": "2026.11.08.1"
    },
    "action_id": "act_approve_invoice_001",
    "action_sha256": "sha256_15b72bca85a9ceff0f848dbe1519d51a6668d33200369cf06dd89145b66a60ed",
    "environment": "production",
    "risk_tier": 3,
    "policy_revision": "100",
    "access_revision": "200",
    "revocation_generation": "1",
    "approval_id": "33333333-3333-4333-8333-333333333333",
    "nonce": "N0nc3S3cr3tV4lu3B4s364Ur132Byt3s00000000000",
    "issued_at": "2026-11-10T15:05:00Z",
    "not_after": "2026-11-10T15:05:30Z"
  },
  "signature": "95mgxLgGBOsMr0f0eJlcda6UXTOA-1_Z5MjgKFvcPaIyzMFt_eZd-iZVkZl32T6TaGhjOEN49fSbEs6F5pzNDQ"
}
```
**Exact Normative Signing Preimage:**
```text
PreimageBytes = UTF8(schema_id) + 0x0A (LF byte) + RFC_8785_Canonical_JSON(payload)
```
Signatures are computed via Ed25519 over `PreimageBytes`. Textual Vault wrappers (e.g. `vault:v1:...`) are decoded to 64 raw bytes and encoded as unpadded base64url strings (86 characters). Unsigned key identifiers are never treated as network lookup URLs.

### Dual Digest Specification

```
+---------------------------------------------------------------------------------------------------+
|                                      DUAL DIGEST ARCHITECTURE                                     |
|                                                                                                   |
|  1. ACTION DIGEST (action_sha256): Underscore prefix, covers exact execution target & arguments    |
|  +---------------------------------------------------------------------------------------------+  |
|  | action_id, execution_context, application_profile_id, application_profile_version,          |  |
|  | document, surface_generation, target_key, record_key, expected_state, environment,           |  |
|  | operation, argument                                                                         |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                               |                                                   |
|                                               v  RFC 8785 JCS -> SHA-256                          |
|                                   "sha256_" + 64 lowercase hex                                    |
|                                                                                                   |
|  2. PROPOSAL DIGEST (proposal_digest): Hyphen prefix, covers human review diffs & consequences    |
|  +---------------------------------------------------------------------------------------------+  |
|  | proposal_id, proposal_revision, organization_id, execution_context, action_id,              |  |
|  | action_sha256, action_category, application_id, record_key, parameter_diffs, evidence_refs,   |  |
|  | rule_checks, authority_checks, consequence_summary, reversible, risk_tier, policy_revision, |  |
|  | access_revision, issued_at, not_after                                                       |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                               |                                                   |
|                                               v  RFC 8785 JCS -> SHA-256                          |
|                                    "sha256-" + 64 lowercase hex                                   |
+---------------------------------------------------------------------------------------------------+
```

1. **Action Digest (`action_sha256`):**
   ```text
   action_sha256 = "sha256_" + lowercase_hex(SHA256(RFC8785_JCS({
     action_id, execution_context, application_profile_id,
     application_profile_version, document, surface_generation,
     target_key, record_key, expected_state, environment, operation, argument
   })))
   ```
   *Exclusions:* Ephemeral reservation ID, dynamic target handles, authorization references, approval references, and timeout deadlines are explicitly excluded to maintain stability across retries and review sessions.
   *Adapter Actions:* For external API and native adapters, `TargetProjectionV1` projects:
   ```text
   AdapterTargetProjectionV1 {
     kind: "adapter", organization_id, action_id, execution_context,
     connection_id, connection_revision, vendor_account_id,
     application_id, capability_ref, operation_id, record_key,
     expected_state: AdapterExpectedStateV1, environment, argument_sha256
   }
   ```
   Connection and vendor account fields are mandatory action-digest inputs. `capability_ref` binds the immutable `ApplicationCapabilityRefV1`. `AdapterExpectedStateV1` is a closed API/native tagged union binding vendor revision, declared typed before-fields, and guard identity (`read_only`, `immutable_input`, `strong_precondition`, or `exclusive_scope` with epoch). For native execution, expected state additionally binds signed process identity, window identity, surface generation, and target key.
   Adapter action digest is strictly:
   ```text
   action_sha256 = "sha256_" + lowercase_hex(SHA256(RFC8785_JCS(AdapterTargetProjectionV1)))
   ```
   *Action Staging & Trusted Facts:* Identity owns `AdapterStagedActionV1`, which requires `effect=read|draft|write`. Parameter diffs are strictly bounded: reads require exactly 0 diffs; draft and write require 1–128 meaningful diffs. Adapters register trusted policy facts via the internal asynchronous port:
   ```rust
   pub async fn register_action_facts(
       principal: &VerifiedPrincipal,
       staged: &AdapterStagedActionV1,
       facts: ActionPolicyFactsV1,
   ) -> Result<(), IdentityError>;
   ```
   Identity verifies staging identity, digest binding, and operation classification floor before storing facts. Expired facts refresh; changed material content invalidates the proposal.


2. **Proposal Digest (`proposal_digest`):**
   ```text
   proposal_digest = "sha256-" + lowercase_hex(SHA256(RFC8785_JCS(
     proposal_payload_excluding_proposal_digest
   )))
   ```
   Notice the strict convention: `action_sha256` uses an underscore (`sha256_`), while `proposal_digest` uses a hyphen (`sha256-`). Tampering with either breaks cryptographic binding.

### Authentication Flow and Session Admission

#### Native Desktop Flow
```
+---------------+        +------------------+        +--------------------+        +----------------+
|    Desktop    |        | Control Plane /  |        |  Auth0 Universal   |        | Identity RLS   |
| SessionBroker |        | BFF Session Tier |        |    Login Broker    |        | Database Store |
+-------+-------+        +--------+---------+        +---------+----------+        +-------+--------+
        |                         |                            |                           |
        | 1. Bind loopback port (127.0.0.1:49152..49183)       |                           |
        | 2. Browser opens Auth0 Authorization Code + PKCE     |                           |
        |----------------------------------------------------->|                           |
        | 3. Auth0 redirects to loopback callback with code    |                           |
        |<-----------------------------------------------------|                           |
        | 4. Desktop SessionBroker redeems code + verifier at Auth0                        |
        |----------------------------------------------------->|                           |
        | 5. Auth0 returns tokens to Desktop SessionBroker     |                           |
        |<-----------------------------------------------------|                           |
        |                                                      |                           |
        | 6. POST /v1/identity/sessions/exchange (broker-token fields)                     |
        |------------------------>|                            |                           |
        |                         | 7. Validate broker tokens  |                           |
        |                         |    (JWKS / claims / MFA)   |                           |
        |                         |--------------------------->|                           |
        |                         |                                                        |
        |                         | 8. Discard broker tokens; mint Oryn 256-bit secrets    |
        |                         |    Store SHA-256 token digests in cp_credential_digest |
        |                         |------------------------------------------------------->|
        | 9. SessionCredentialsV1 |                            |                           |
        |    (Oryn bearer tokens) |                            |                           |
        |<------------------------|                            |                           |
```

#### Web BFF Flow (Confidential Browser Session)
Browser clients never receive Auth0 tokens or Oryn bearer credentials:
1. Web client initiates `POST /v1/session/login` (`WebLoginStartV1`). Control Plane sets 5-minute transaction cookie `__Host-oryn_login`, vault-encrypts the PKCE verifier, and redirects to Auth0.
2. Auth0 redirects to `GET /v1/identity/auth0/callback`. Control Plane validates transaction cookie, state, and nonce, confidentially redeems the code server-side, validates claims with Identity Policy, discards Auth0 tokens, and sets a 12-hour opaque `__Host-oryn_session` cookie.
3. Web requests use memory-held CSRF tokens, with 30-minute idle locks managed by `POST /v1/session/activity`.

1. **Client Registration & Loopback Pool:** Native external browser authentication uses Authorization Code + PKCE `S256` with state and OIDC nonce. The native client binds a loopback socket to `127.0.0.1` on a randomly selected available port within the registered range `49152–49183`, path `/callback`. Exactly 32 callback URIs are registered in Auth0; no wildcards, custom schemes, or embedded webviews. Code redemption occurs directly between Desktop SessionBroker and Auth0; Oryn server receives verified broker-token assertions only.
2. **Login Transactions:** A server-side login transaction lasts 5 minutes, binding client kind, organization ID, state, nonce, and callback URI. Validates issuer, RS256 JWKS signature, audience, and single-use status.
3. **Oryn Opaque Secrets:** Initial Auth0 tokens are validated and immediately discarded. Oryn issues opaque 256-bit random session and access secrets. Control-plane stores SHA-256 digests only. Rotation occurs atomically; token replay revokes the entire session family.
4. **Session Lifetimes & Idle Lock:**
   - Web sessions: Max 12 hours absolute, with a server-enforced 30-minute inactivity lock.
   - Desktop sessions: Max 7 days absolute.
   - Child access tokens: Bounded to maximum 5 minutes, scoped to specific audiences (`identity`, `sync`, `guidance`, `execution`, `inference`).
5. **Execution Principal Registration & Scopes:**
   Runtime dispatchers require authenticated execution principal registration (`ExecutionPrincipalRegistrationV1`):
   - Binds `organization_id`, `execution_context`, `host`, `assignment_id`, `assignment_epoch`, `recovery_epoch`, `allowed_scopes`, `environment` (`production` or `simulation`), and nullable `simulation_admission_ref` (required for simulation, null for production). Authenticated via cloud workload mTLS or enrolled local device execution child credential.
   - Child access tokens under audience `execution` are strictly bounded to 5 minutes maximum and limited to closed execution scopes:
     - `runtime:claim`: Atomically claim assignment and CAS progress
     - `runtime:read`: Retrieve authorized typed state and dependency values
     - `runtime:advance`: Commit validated checkpoint transitions
     - `runtime:heartbeat`: Renew assignment lease
     - `runtime:yield`: Relinquish execution at human wait, approval, or completion
   - Execution scopes grant zero rights to launch jobs, issue approvals, alter policy, or access vendor credentials.
   - Guard checks verify matching tenant, execution principal, assignment ID/epoch, recovery epoch, and matching environment, rejecting superseded, expired, or cancelled dispatchers before action admission.

#### Execution Contexts and Test-Realm Isolation
`ExecutionContextV1` enforces closed context typing across production and evaluation:
- `job`: Production job execution binding `job_id`, `case_id`, `job_type`, `agent_version_id`, `risk_tier`. Environment must be `production`.
- `assist`: Real-time desktop assist guidance binding `assist_session_id`, `actor_id`, `assist_plan_id`, `assist_plan_version`, `playbook_version`, `release_id`, `release_cohort_id`, `release_eligibility_generation`, and `plan_sha256`. Environment must be `production`.
- `evaluation`: Flight simulator candidate evaluation binding `evaluation_id`, `scenario_version_id`, `attempt_id`, and `evaluation_target` (`agent` or `assist_plan`). Environment must be `simulation`.

Scripted simulation actors exist in an Identity-owned test realm; they are not real memberships and cannot acquire production sessions, credentials, governance grants, or business authority. Scripted approval and clarification events bind exact proposed values, action/proposal digests, record/surface generations, and test-realm authority. They are labeled simulated and never count as human examples or supervised history. Tier 4 remains denied.

6. **Step-Up MFA:** Consequential operations (Tier 3 approvals, release approvals, policy modifications, emergency recovery) require verified MFA completed within the previous 5 minutes. Proven via Auth0 Actions emitting namespaced claims: `https://oryn.app/claims/connection_id`, `https://oryn.app/claims/connection_strategy`, and `https://oryn.app/claims/mfa_at`.

### Bridge Delivery Contract (`ExecuteBrowserAction`)
Browser execution occurs over `browser-bridge.v1` (major 1, minor 5 with capabilities `identity_authority_v1`, `local_execution_reservation_v1`, and `execution_reservation_lease_v1`):
```text
ExecuteBrowserAction.payload.authority = {
  authorization: SignedActionAuthorizationV1,
  approval:      SignedActionApprovalV1 | null,
  admission:     SignedActionAdmissionV1
}
```
`authorization_ref` equals `authorization_id`, and nullable `approval_ref` equals `approval_id`. Both references and the authority bundle remain strictly outside the canonical `action_sha256` digest.

### HTTP Route Specifications

| Method & Route | Scopes Required | Success Payload | Problem Error Mapping |
|---|---|---|---|
| `POST /v1/identity/actions/authorize` | `execution:authorize` | `200 OK`: `AuthorizationDecisionV1` | 400 Schema, 401 Auth, 403 Forbidden, 503 Signer |
| `POST /v1/identity/actions/consume` | `execution:consume` | `200 OK`: `ActionConsumptionV1` | 400 Schema, 403 Forbidden, 409 Conflict/Already Consumed |
| `GET /v1/identity/actions/{id}` | `execution:read` | `200 OK`: `AuthorizationStatusV1` | 401 Auth, 404 Not Found |
| `POST /v1/identity/approvals` | `action:approve` | `200 OK`: `ApprovalResultV1` | 400 Schema, 403 Step-Up Required, 409 Conflict |
| `POST /v1/identity/approvals/bulk` | `action:approve` | `200 OK`: `BulkApprovalResultV1` | 400 Schema, 403 Denied, 409 Atomicity Conflict |
| `GET /v1/identity/approvals/{id}` | `action:read` | `200 OK`: `ApprovalStatusV1` | 401 Auth, 404 Not Found |
| `POST /v1/identity/governance-approvals` | `governance:approve`| `200 OK`: `ApprovalResultV1` | 403 Forbidden/Separation, 409 Revision Stale |
| `POST /v1/identity/login-transactions` | Anonymous | `201 Created`: `LoginTransactionV1` | 400 Bad Request, 503 IdP Down |
| `POST /v1/identity/sessions/exchange` | Anonymous | `200 OK`: `SessionCredentialsV1` | 401 Invalid Code/Proof, 409 Replayed |
| `POST /v1/identity/sessions/refresh` | Anonymous | `200 OK`: `SessionCredentialsV1` | 401 Revoked Family, 409 Replay Detected |
| `POST /v1/identity/sessions/child-token`| Authenticated | `200 OK`: `ChildTokenV1` | 403 Scope Prohibited |
| `POST /v1/identity/sessions/select-organization` | Authenticated | `200 OK`: `SessionCredentialsV1` | 403 Organization Inactive/Access Denied |
| `POST /v1/identity/sessions/logout` | Authenticated | `200 OK`: `LogoutResultV1` | 401 Unauthorized |
| `POST /v1/identity/commands` | `admin:*` | `200 OK`: `IdentityCommandResultV1` | 403 Admin/MFA Required, 409 Revision Conflict |
| `POST /v1/identity/devices/{id}/review-keys/challenge` | `device:enroll` | `201 Created`: `SignedReviewKeyChallengeV1` | 401 Unauthorized |
| `POST /v1/identity/devices/{id}/review-keys` | `device:enroll` | `201 Created`: `SignedReviewKeyRegistrationV1` | 400 Bad Proof, 409 Replayed Nonce |
| `GET /v1/identity/devices/{id}/capture-policy` | `device:read` | `200 OK`: `SignedCapturePolicyLease` | 403 Device Suspended, 503 Signer Down |
| `GET /v1/identity/devices/{id}/retention-verdict` | `device:read` | `200 OK`: `SignedRetentionVerdict` | 403 Device Suspended, 503 Signer Down |
| `GET /v1/identity/artifact-policy` | `artifact:read` | `200 OK`: `SignedArtifactPolicy` | 404 Policy Not Active |

---

## Internal architecture

### Pure Rust Typed Evaluator
The authorization decision engine is implemented as a pure, side-effect-free Rust function:
```rust
pub fn evaluate_authorization(
    snapshot: &AuthorizationSnapshotV1,
    request: &AuthorizationRequestV1,
    now: UtcInstant,
) -> PolicyEvaluationV1;
```
- `AuthorizationSnapshotV1`: Immutable, strongly typed in-memory aggregate built exclusively from committed PostgreSQL owner records. Callers cannot supply roles, downgrade risk classifications, or assert release readiness.
- `PolicyEvaluationV1`: Internal evaluation result `{verdict: Allow | Deny | RequireHumanApproval, reason_code: IdentityReason, risk_tier: Option<RiskTier>, policy_revision: U64, access_revision: U64, required_approval: Option<ApprovalRequirementV1>, rule_checks: Vec<RuleCheckV1>, authority_checks: Vec<AuthorityCheckV1>}`.
- `UtcInstant`: Validated UTC instant with monotonic clock protection against system time manipulation.

### Fixed Evaluation Order
The evaluator follows a strict, non-bypassable order:
1. **Workload / Human Authentication & Environment:** Verify token validity, client environment matching (`production` vs `simulation`).
2. **Organization / Membership / Device / Session Status:** Active tenant check, non-suspended membership, non-revoked device enrollment.
3. **Tenant Boundary & Resource Equality:** Resource tenant ID matches authenticated organization ID.
4. **Mandatory Product Exclusions & Tier 4 Prohibition:** Hardcoded code guards unconditionally deny Tier 4 automated actions.
5. **Scope & Capability Matching:** Compute effective capabilities from granted roles within audience/team/workflow scope.
6. **Explicit Denials:** Apply capability restrictions (`CapabilityRestrictionV1`); explicit deny unconditionally removes permission.
7. **Effective Risk Classification:** Pinned owner facts determine action risk floor.
8. **Release Eligibility & Rule Constraints:** Workflow version eligibility and business rule passage verified.
9. **Amount / Delegation / Separation Constraints:** Monetary ceilings and initiator separation verified.
10. **Required Human Approval Resolution:** If otherwise permitted but requiring human sign-off, verify signed `approval_id` receipt. Missing approval yields `RequireHumanApproval`; forbidden actions never return an approvable state.

### Relational Schema (PostgreSQL)

```sql
-- Global identities (shared infrastructure adapter)
CREATE TABLE identity_person (
    person_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE identity_login_subject (
    issuer TEXT NOT NULL,
    subject TEXT NOT NULL,
    person_id UUID NOT NULL REFERENCES identity_person(person_id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (issuer, subject)
);

-- Tenant organizations
CREATE TABLE identity_organization (
    organization_id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('restricted', 'active', 'suspended', 'deactivated', 'deletion_pending', 'deleted')),
    current_policy_revision NUMERIC(20,0) NOT NULL DEFAULT 1 CHECK (current_policy_revision >= 1),
    current_access_revision NUMERIC(20,0) NOT NULL DEFAULT 1 CHECK (current_access_revision >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE identity_organization ENABLE ROW LEVEL SECURITY;

-- Tenant memberships
CREATE TABLE identity_membership (
    organization_id UUID NOT NULL REFERENCES identity_organization(organization_id) ON DELETE RESTRICT,
    actor_id TEXT NOT NULL,
    person_id UUID NOT NULL REFERENCES identity_person(person_id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (organization_id, actor_id)
);
ALTER TABLE identity_membership ENABLE ROW LEVEL SECURITY;

-- Authority guards (transactionally locked concurrency barriers)
CREATE TABLE identity_authority_guard (
    organization_id UUID NOT NULL REFERENCES identity_organization(organization_id) ON DELETE RESTRICT,
    guard_kind TEXT NOT NULL CHECK (guard_kind IN ('organization', 'member', 'device', 'policy', 'eligibility')),
    guard_id TEXT NOT NULL,
    revision NUMERIC(20,0) NOT NULL CHECK (revision >= 1),
    durability_pending BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (organization_id, guard_kind, guard_id)
);
ALTER TABLE identity_authority_guard ENABLE ROW LEVEL SECURITY;

-- Durable action execution fences (linearization points)
CREATE TABLE identity_action_fence (
    organization_id UUID NOT NULL REFERENCES identity_organization(organization_id) ON DELETE RESTRICT,
    execution_context_sha256 TEXT NOT NULL,
    action_id TEXT NOT NULL,
    action_sha256 TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('prepared', 'admitted', 'reconciled')),
    winning_authorization_id UUID,
    winning_attempt_id UUID,
    revision NUMERIC(20,0) NOT NULL DEFAULT 1 CHECK (revision >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (organization_id, execution_context_sha256, action_id)
);
ALTER TABLE identity_action_fence ENABLE ROW LEVEL SECURITY;

-- Formal proposals and approvals
CREATE TABLE identity_approval_proposal (
    organization_id UUID NOT NULL REFERENCES identity_organization(organization_id) ON DELETE RESTRICT,
    proposal_id UUID NOT NULL,
    proposal_revision NUMERIC(20,0) NOT NULL CHECK (proposal_revision >= 1),
    proposal_digest TEXT NOT NULL,
    action_id TEXT NOT NULL,
    action_sha256 TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('pending', 'approved', 'rejected', 'changes_requested', 'expired', 'invalidated', 'consumed')),
    proposal_json JSONB NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    not_after TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (organization_id, proposal_id, proposal_revision)
);
ALTER TABLE identity_approval_proposal ENABLE ROW LEVEL SECURITY;

CREATE TABLE identity_approval (
    organization_id UUID NOT NULL REFERENCES identity_organization(organization_id) ON DELETE RESTRICT,
    approval_id UUID PRIMARY KEY,
    proposal_id UUID NOT NULL,
    proposal_revision NUMERIC(20,0) NOT NULL,
    approver_actor_id TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject', 'request_changes')),
    approval_receipt_signature TEXT,
    decided_at TIMESTAMPTZ NOT NULL,
    not_after TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ
);
ALTER TABLE identity_approval ENABLE ROW LEVEL SECURITY;

-- Authorizations and consumptions
CREATE TABLE identity_action_authorization (
    organization_id UUID NOT NULL REFERENCES identity_organization(organization_id) ON DELETE RESTRICT,
    authorization_id UUID PRIMARY KEY,
    action_id TEXT NOT NULL,
    action_sha256 TEXT NOT NULL,
    approval_id UUID,
    nonce TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    not_after TIMESTAMPTZ NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('issued', 'consumed', 'expired', 'revoked'))
);
ALTER TABLE identity_action_authorization ENABLE ROW LEVEL SECURITY;

CREATE TABLE identity_action_consumption (
    organization_id UUID NOT NULL REFERENCES identity_organization(organization_id) ON DELETE RESTRICT,
    authorization_id UUID NOT NULL REFERENCES identity_action_authorization(authorization_id) ON DELETE RESTRICT,
    attempt_id UUID NOT NULL,
    consumed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (organization_id, authorization_id),
    UNIQUE (organization_id, attempt_id)
);
ALTER TABLE identity_action_consumption ENABLE ROW LEVEL SECURITY;
```

### Transactional Linearization & Authority Guards
To guarantee zero race conditions between permission revocation and action dispatch:
1. **Sorted Guard Acquisition:** Transactions acquire locks in deterministic sorted order: `(organization_id, guard_kind, guard_id)`.
2. **Lock Strength:** Authorization and consumption take `SELECT ... FOR SHARE`; role/policy updates and revocations take `SELECT ... FOR UPDATE`.
3. **The Linearization Point:** The commit of the `POST /v1/identity/actions/consume` transaction is the irreversible authorization linearization point. Once committed, logical fence state advances to `admitted`. Subsequent revocations request best-effort execution abort, but cannot retroactively cancel dispatched mutations.

### Authority Recovery Journal
PostgreSQL backups are susceptible to snapshot restore rollbacks that could resurrect revoked credentials or unconsume action fences. Oryn mitigates this through an independent durable Authority Recovery Journal:
- **Append on Commit:** Every state transition, governance consumption, action admission, runtime retention fence, and orchestration safety fence writes an `AuthorityJournalEntryV1` to the database outbox and appends to an external immutable audit journal before final response release. This includes:
  - `kind: "runtime_retention_fenced"` with after-images in `orchestration_retention_fence` using `RuntimeRetentionFenceV1`.
  - `kind: "orchestration_safety_fenced"` with after-images in `orchestration_safety_fence` using `OrchestrationSafetyFenceV1`, binding monotonic generations for subjects `job`, `schedule`, `case`, `action_intent`, `budget`, `occurrence`, `incident_restriction`, and `release_cohort` (binding `ReleaseCohortFenceV1`). Active containment restrictions lock target selectors taking the Identity authority guard before adapter/Graph guards.
  - `kind: "governance_consumed"` recording one-use formal governance approval consumption (`GovernanceConsumptionV1`) via `consume_governance` within a strict 15-minute consumption window and 24-hour proposal ceiling.
  - `kind: "release_changed"` and `kind: "release_preauthorization_changed"` with typed after-images for `release_head`, `release_cohort_binding`, `release_cohort_fence`, `release_preauthorization`, and `release_approval_consumption`.
- **Governance Proposal Consumption Seam:**
  ```rust
  async fn consume_governance(
      &self,
      tx: &mut TenantTransaction,
      principal: &VerifiedPrincipal,
      proposal_id: Uuid,
      expected_object_sha256: &str,
  ) -> Result<GovernanceConsumptionV1, IdentityProblemV1>;
  ```
  Enforces exactly one consumption per `(organization_id, proposal_id, proposal_revision)` and rejects stale approvals past 15 minutes.
- **Expiring Automation Policies (`ReleaseAutomationPolicyV1`):** Configured via `set_release_automation_policy` administrative command on `OrganizationPolicyV1.release_automation_policy`, defining finite validity intervals (`valid_from` to `not_after`), allowed actions (`repair_release`, `expand`, `restore`), and allowed patch categories (`interaction_binding`, `string_format`), requiring `security_policy.manage` and fresh MFA.
- **Incident Response Policy (`IncidentResponsePolicyV1`):** Configured on `OrganizationPolicyV1.incident_response_policy`, controlling background diagnosis enablement (default false), deterministic signature escalation rules, interview response deadlines, and timed escalation paths. Escalation rules specify observation windows, minimum case thresholds, severity floors, and target containment effects without inventing default thresholds.
- **Correction Voice Consent (`incident_correction_audio_permitted`):** Extends `SignedCapturePolicyLease` with dedicated `incident_correction_audio_permitted` boolean flag. True requires active employee consent and existing `audio` acquisition permission; missing or false fails closed.
- **Durability Gate:** Transitions commit with `durability_pending = true`. The operation is acknowledged to the client only after receiving a cryptographically signed `SignedAuthorityCheckpointV1` from the journal receipt signer. If a mutation produces >128 after-images, it splits into consecutive entries of at most 128 under one mutation ID with one checkpoint on the final entry.
- **Restore Protocol:** Following a database restore from backup, privileged traffic remains completely disabled. The recovery coordinator queries the external journal for the latest signed checkpoint, replays all missing entries into PostgreSQL, and reconstructs action fences, retention fences, orchestration safety fences, analytics disclosure commitments (`analytics_disclosure_changed` journal kinds and `analytics_disclosure_commitment` after-images), and high-water mark revision counters. All recorded occurrence keys are reconstructed from journaled occurrence entries before any scheduler or slot allocation runs. Retention fences must be replayed before DEK unwrapping or owner review; missing or gapped reconciliation denies value reads. Surviving fences are not proof that a lost receipt means no dispatch was sent. Any detected gap or unreachable journal returns `IDENTITY_RECOVERY_INCOMPLETE`, keeping the organization restricted.

---

## State and lifecycle

### Organization Lifecycle
```
+-------------+      +----------+      +-------------+      +---------------+
|  restricted | ---> |  active  | <--> |  suspended  | ---> |  deactivated  |
+-------------+      +----------+      +-------------+      +-------+-------+
                                                                    |
                                                                    v
+-------------+                                             +---------------+
|   deleted   | <------------------------------------------ | delet_pending |
+-------------+                                             +---------------+
```
- `restricted`: Created by initial workspace administrator; capture, writes, and inference budgets disabled pending policy activation.
- `active`: Fully operational.
- `suspended`: Temporarily halted by admin or billing; active tokens and leases immediately revoked; historical audit preserved.
- `deactivated`: Terminal shutdown; capture terminated, future jobs rejected, retained data preserved under statutory hold periods.
- `deletion_pending` -> `deleted`: Controlled purge after retention obligations expire; clears sync ledger and tenant keysets.

### Formal Approval Lifecycle
```
+-----------+       +-------------------+       +----------+
|  pending  | ----> | changes_requested |       | rejected |
+-----+-----+       +-------------------+       +----+-----+
      |                                              ^
      +----------------------------------------------+
      |
      +-------------> +----------+ -------------> +----------+
      |               | approved |                | consumed |
      v               +----+-----+                +----------+
+-----------+              |
|  expired  | <------------+ (15-min unconsumed)
+-----------+
      ^
      |
+-----+-------+
| invalidated | (Target generation drift / revocation)
+-------------+
```
- `pending`: Awaiting human decision (max 24 hours).
- `approved`: Validated human sign-off; grants a 15-minute validity window for execution consumption.
- `changes_requested`: Closes proposal; revised proposal requires a new revision and fresh digest.
- `invalidated`: Target record revision changes or document generation drifts; approval cannot be recycled.
- `consumed`: Proposal, approval, and authorization atomically consumed and logical action fence locked in PostgreSQL commit; terminal state. (Not defined at token issuance; dispatch occurs only after verified admission).

---

## Error and edge-case behavior

### Reason Code Catalog
Oryn Identity defines twenty-two exhaustive, standardized reason codes:

| Reason Code | HTTP Status | Description & Remediation |
|---|---|---|
| `IDENTITY_OK` | 200 OK | Operation or authorization check succeeded. |
| `IDENTITY_AUTH_REQUIRED` | 401 Unauthorized | Missing, malformed, or unauthenticated session credentials. |
| `IDENTITY_SESSION_EXPIRED` | 401 Unauthorized | Session exceeded absolute or idle expiration bounds; re-login required. |
| `IDENTITY_STEP_UP_REQUIRED` | 403 Forbidden | Consequential action requires fresh MFA completed within past 5 minutes. |
| `IDENTITY_ACCESS_DENIED` | 403 Forbidden | Calling actor lacks required role, capability, or audience scope. |
| `IDENTITY_ORGANIZATION_INACTIVE`| 403 Forbidden | Organization is suspended or deactivated; operations paused. |
| `IDENTITY_DEVICE_REVOKED` | 403 Forbidden | Device enrollment suspended or revoked; new enrollment required. |
| `IDENTITY_POLICY_STALE` | 409 Conflict | Policy lease expired or local high-water mark behind server; refresh needed. |
| `IDENTITY_CONTEXT_STALE` | 409 Conflict | Target document generation or record revision drifted; proposal invalidated. |
| `IDENTITY_TIER4_PROHIBITED` | 403 Forbidden | Operation is classified as Tier 4; automated agent execution unconditionally blocked. |
| `IDENTITY_APPROVAL_REQUIRED` | 200 OK | Action requires human approval; proposal returned in response. |
| `IDENTITY_APPROVAL_EXPIRED` | 410 Gone | Approval token expired (exceeded 15-minute consume window). |
| `IDENTITY_DELEGATION_INVALID` | 403 Forbidden | Approver delegation expired, exceeded amount ceiling, or currency mismatch. |
| `IDENTITY_SEPARATION_REQUIRED` | 403 Forbidden | Distinct human required; initiator self-approval prohibited. |
| `IDENTITY_ACTION_CONSUMED` | 409 Conflict | Action fence already consumed for this logical action intent. |
| `IDENTITY_SIGNER_UNAVAILABLE` | 503 Service Unavail | HashiCorp Vault Transit signer timeout (>500 ms); fail closed. |
| `IDENTITY_STORE_UNAVAILABLE` | 503 Service Unavail | PostgreSQL database or authority guard timeout (>1s); fail closed. |
| `IDENTITY_IDEMPOTENCY_CONFLICT`| 409 Conflict | Command ID replayed with conflicting payload or replayed nonce. |
| `IDENTITY_LAST_ADMIN_REQUIRED` | 409 Conflict | Voluntary removal of last Organization Admin blocked; emergency recovery needed. |
| `IDENTITY_TRUST_ROLLBACK` | 409 Conflict | Presented keyset generation or clock lower than high-water mark; fail closed. |
| `IDENTITY_SCHEMA_INVALID` | 400 Bad Request | Payload failed Draft 2020-12 schema validation; extra fields or bad types. |
| `IDENTITY_RECOVERY_INCOMPLETE` | 503 Service Unavail | Database restored with unverified journal gap; tenant operations held restricted. |

---

## Observability and audit

### Consequential Audit Logging (ORY-070)
Identity emits structured, immutable audit log events for every privileged decision:
- **Logged Events:** Role grants/revocations, policy replacements, legal hold activations/releases, action authorizations, formal approval decisions, fence consumptions, emergency account recoveries.
- **Standard Audit Schema:**
  - `event_id`: Unique UUIDv4.
  - `organization_id`: Tenant UUID.
  - `actor_id` / `worker_id`: Calling principal identifier.
  - `operation`: Exact operation name (e.g., `identity.action.consume`).
  - `object_ref`: Pinned target URI or record identifier.
  - `policy_revision` / `access_revision`: High-water marks.
  - `proposal_id` / `authorization_id` / `attempt_id`: Correlation lineage.
  - `outcome`: `Allow`, `Deny`, `RequireHumanApproval`, `Consumed`.
  - `reason_code`: Standard `IdentityReason`.
  - `timestamp_utc`: RFC 3339 UTC timestamp.
- **Privacy Exclusions:** Audit records strictly prohibit raw screen media, audio transcripts, DOM trees, prompts, passwords, bearer tokens, or employee productivity tracking metrics.
- **Retention Schedule:** Consequential audit events default to 24 months in tamper-evident WORM archive storage. Unapproved candidate proposals are retained for 365 days.

---

## Security and threat model

### Threat Mitigations
1. **Prompt Injection Escalation:** Malicious untrusted input (e.g., adversarial prompt injections in vendor invoices) attempting to command an agent to execute unauthorized wire transfers or bypass approvals is neutralized because execution authorization is evaluated outside the LLM in the deterministic Rust PDP.
2. **Approval Repurposing & Parameter Tampering:** Approvals are cryptographically bound to `action_sha256` and `proposal_digest`. An attacker cannot alter target account numbers, payment amounts, or document generations without invalidating the digest and failing preflight verification.
3. **Replay & Double-Dispatch:** Logical action fences keyed by `(organization_id, execution_context_sha256, action_id)` combined with single-use cryptographic nonces ensure an authorized token can be consumed exactly once.
4. **Credential Hijacking & Scope Creep:** Short-lived child access tokens (max 5 minutes) bind audience, organization, and narrow scope subsets. Stolen sync tokens cannot be used against guidance or execution endpoints.
5. **Cross-Tenant Contamination:** Mandatory PostgreSQL RLS on every tenant table combined with transaction-local context configuration prevents multi-tenant data leaks.
6. **Compromised Administrative Account:** Enforces two registered customer-controlled emergency accounts with independent MFA before allowing enterprise SSO enforcement. Emergency accounts hold narrow `identity.recover` grants without ambient business execution privileges.

---

## Test strategy

### Synthetic Conformance Suite
Conformance verification references [`identity-policy-v1.fixtures.json`](../architecture/contracts/identity-policy-v1.fixtures.json), containing 34 comprehensive test cases covering unit evaluations, dual-digest invariants, cryptographic signature verification, race condition fencing, and disaster recovery:

```
+---------------------------------------------------------------------------------------------------+
|                                SYNTHETIC CONFORMANCE TEST SUITE                                   |
|                                                                                                   |
|  [Unit Evaluation Matrix]  [Cryptographic Invariants]  [Concurrency & Races]  [Disaster Recovery] |
|   - Out-of-tenant lookup    - Action digest stability   - 2 tokens race fence  - Journal restore  |
|   - Union-minus-deny        - Proposal digest tamper    - Revoke vs consume    - Gap detection    |
|   - Tier 4 unconditional    - Signature byte corruption - Lost consume ack     - Clock rollback   |
|   - Distinct human rule     - Key purpose mismatch      - Nonce single use     - Keyset rotation  |
+---------------------------------------------------------------------------------------------------+
```

### Concrete Verification Scenarios
1. **Scenario 1: Tier 4 Automated Funds Transfer Rejection (ORY-027)**
   - *Input:* Agent submits authorization request for wire funds transfer (`risk_tier: 4`), presenting a forged human approval receipt.
   - *Observable Result:* Policy engine evaluates mandatory prohibition guard, returns `Deny` with `IDENTITY_TIER4_PROHIBITED`, transitions action fence to `reconciled` (blocked), and emits security alert.
2. **Scenario 2: Tier 3 Consequential Action Approval Sequence (ORY-026)**
   - *Input:* Agent submits invoice payment approval request (`risk_tier: 3`) without approval ID.
   - *Observable Result:* Engine returns `RequireHumanApproval` with `IDENTITY_APPROVAL_REQUIRED` and signed `SignedApprovalProposalV1`. Human reviewer approves; subsequent authorize call with `approval_id` returns signed `SignedActionAuthorizationV1` (30s TTL). Consume call locks fence, returns `SignedActionAdmissionV1`, and admits single dispatch.
3. **Scenario 3: Target Generation Drift Invalidation (ORY-041)**
   - *Input:* Human approves action based on live DOM document generation 2. Prior to dispatch, page navigates to document generation 3.
   - *Observable Result:* Browser bridge preflight recalculates `action_sha256`, detects digest mismatch against authorization token, returns `Deny` with `IDENTITY_CONTEXT_STALE`, and requires a revised approval proposal.

---

## Performance and operations

### Operational Targets
- **Availability Target:** 99.9% control-plane availability.
- **Evaluation Latency:** Pure typed evaluator p95 <= 1 ms for evaluation against 100 role grants and restrictions.
- **End-to-End Authorization:** Synchronous `authorize` and `consume` p95 <= 100 ms (excluding external third-party network calls).
- **Timeouts:** Vault Transit signer timeout is 500 ms (fails closed); PostgreSQL authority guard transaction timeout is 1,000 ms (fails closed).
- **Barrier Latency:** Connected endpoint restriction propagation <= 2 seconds via 25-second long-poll notifications; disconnected endpoint offline ceiling is 24 hours.
- **Zero Authoritative Permission Caching:** Every privileged authorization decision checks live, transactionally locked PostgreSQL authority guards.

---

## Architecture decisions and open questions

### Resolved Architecture Decisions (ADR-0011)
- **Policy Engine Format:** Implemented as an embedded pure Rust evaluator with typed, schema-validated configuration records. External policy engines (OPA/Rego, Cedar) were rejected to avoid runtime latency overhead, complex dynamic language parsers, and external network failure domains.
- **Approval Token Structure:** Structured around dual cryptographic digests (`action_sha256` underscore prefix and `proposal_digest` hyphen prefix) signed via Ed25519 over RFC 8785 canonical JSON bytes.
- **Revocation Propagation:** Transactional authority guard updates emit domain outbox events that immediately wake 25-second long-poll connections, coupled with 500 ms local endpoint acknowledgment barriers.
- **Review Key Custody:** Stored as software Ed25519 keys within OS-protected credential storage (`com.oryn.device.identity`), rejecting false hardware/Secure Enclave claims (as Apple Secure Enclave does not support Ed25519).
- **Durable Authority Recovery:** Independent durable authority recovery journal protocol preventing backup restoration from resurrecting revoked permissions or consumed fences.
- **Authentication Reference Architecture:** Auth0 Universal Login with PKCE `S256` on loopback port range 49152–49183, with Oryn-owned opaque session secrets.

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Authoritative user and agent identities, organization memberships, role assignments, action risk tiers, approval delegations, authorization decisions, formal approval clearinghouse, and policy leases.
2. *Data ingress/egress:* Ingests authentication assertions and action authorization requests; outputs cryptographic authorization tokens, approval proposals, admission receipts, and policy leases.
3. *Versions/identities:* Organization ID (UUID), actor ID, device ID, profile ID, policy revision (U64), access revision (U64), action digest (`action_sha256`), and proposal digest (`proposal_digest`).
4. *Upstream failure:* If Auth0 fails, existing valid Oryn sessions continue until expiration; operations requiring fresh MFA are blocked; zero new sessions admitted.
5. *Authority:* Identity Policy is the sole authority for action permissions, risk autonomy, and approval validity.
6. *Testing without private details:* Validated via comprehensive synthetic conformance fixtures ([`identity-policy-v1.fixtures.json`](../architecture/contracts/identity-policy-v1.fixtures.json)) without real customer data or private keys.
7. *Audit and duplicate prevention:* Enforced via durable `identity_action_fence` primary keys, single-use cryptographic nonces, and append-only audit journals.
8. *Failure blast radius:* Policy engine or signer failure causes all privileged executions to fail safe, blocking external mutations and pausing jobs.
9. *v1.0 criteria:* Fully satisfies and enables ORY-001, ORY-002–010, ORY-026–030, ORY-041, ORY-045–048, ORY-067–070, and ORY-071–076.
