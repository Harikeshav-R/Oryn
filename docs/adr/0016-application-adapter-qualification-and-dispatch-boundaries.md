# 0016: Application Adapter Qualification and Dispatch Boundaries

- **Status:** Accepted
- **Date:** 2026-11-14
- **Amended by:** [ADR-0019](0019-flight-simulator-isolation-and-evaluation-evidence.md), [ADR-0024](0024-infrastructure-security-custody-and-recovery.md)
- **Deciders:** Oryn Architecture Guild, Application Adapters Owner, Identity Policy Owner, Agent Runtime Owner, Control Plane Owner, Infrastructure Security Lead
- **Consulted:** Desktop Shell Owner, Browser Extension Owner, Outcome Verification Owner, Agent Factory Owner
- **Informed:** All Engineering Teams

## Context and Problem Statement

Under [PRODUCT.md §§3.3–6, 13.5, 16.4–7, 17](../../PRODUCT.md) and [TECHNICAL.md §§4.1, 4.3, 4.5, 4.7, 5.6, 6.3, 7.2 Contracts 6/11–13, 11.4](../../TECHNICAL.md), Oryn must execute qualified operations across SaaS APIs, web applications, and local desktop applications.

Key architectural challenges include:
1. **Extensible Plugin ABI vs. Signed First-Party Workers:** Whether to permit third-party runtime plugins, customer scripts, or dynamic interpreted connectors, or restrict execution strictly to signed first-party Rust worker executables.
2. **Blanket Certification vs. Layered, Renewable Operation Qualification:** Whether to certify an application or vendor integration globally, or require granular, operation-level qualification bound to specific configurations, accounts, environments, and evidence attestations expiring within 30 days.
3. **In-Worker Credentials vs. Independent Credential Egress Enforcement:** Whether worker processes receive vendor tokens directly or operate through an out-of-process egress broker that enforces destination, method, template, account, and role constraints.
4. **Dynamic Transport Fallback vs. Pinned Transports:** Whether adapters dynamically negotiate between REST, GraphQL, browser, and desktop interactions, or require explicit, pinned transports and API versions.
5. **Draft Mutation vs. Immutable Snapshot Sending:** How email sending and file communications are executed without leaving stale drafts or mutating user workspaces without human-reviewed immutable snapshots.
6. **Automatic Replay vs. Journaled One-Shot Submission:** How ambiguous timeouts, partial network responses, or crashes are handled without risking duplicate real-world actions.

## Decision

The Oryn Architecture Guild resolves the architecture, qualification, credential custody, and dispatch boundaries for application adapters as follows:

1. **Signed First-Party Workers (`oryn-adapter-worker`):**
   - Execution is restricted to signed first-party Rust executables. No runtime third-party plugins, user-supplied scripts, unvetted WASM modules, or model-generated code are permitted in execution paths.
   - Cloud isolation key is strictly `(organization_id, connection_id, environment, credential_role)`. Worker reuse is bounded within this exact tuple.
   - Local native execution is supervised by the Shell as an unprivileged child worker (`oryn-adapter-worker`) communicating via private inherited length-prefixed JSON frames (`shell-adapter.v1` major 1, minor 0). Primitives are restricted to Windows UI Automation and macOS Accessibility APIs without privilege elevation.

2. **Layered, Renewable Operation Qualification:**
   - Universal application certification is rejected. Each operation within an `AdapterPackV1` must be independently qualified (`OperationQualificationDefinitionV1`) for a specific customer organization, external account, environment, resource scope, and write guard.
   - Qualification definitions are immutable and content-hashed via RFC 8785 / SHA-256.
   - Attestations (`QualificationAttestationV1`) expire at most 30 days after issuance. Safe renewals require unchanged configuration and passing evidence probes; failure restricts or revokes support without extending the deadline.

3. **Independent Credential Egress Enforcement (`AdapterEgressBroker`):**
   - Worker processes receive opaque, short-lived operation handles, never vendor access tokens, refresh tokens, or client secrets.
   - Credential injection and network egress are enforced by an out-of-process `AdapterEgressBroker` tied to HashiCorp Vault.
   - The broker strictly verifies workload identity, admission attempt, role (`actuation` vs. `readback`), registered vendor origin, exact URL template, and bound account/environment.
   - The `readback` role cannot invoke mutating HTTP verbs or templates even if the underlying OAuth token possesses write scope. Direct worker vendor networking is blocked.

4. **Pinned Transports and Bounded Vendor Packs:**
   - Dynamic transport fallback is prohibited. Each operation binds to a pinned transport, API version, and template.
   - Seven bounded packs are specified: Gmail (REST v1), Outlook (Microsoft Graph v1.0), Google Sheets (REST v4 RAW), Excel Web (Graph v1.0 workbooks), Salesforce (pinned tenant REST version), HubSpot (version 2026-09), and NetSuite (SuiteTalk REST v1 with certificate-backed M2M OAuth).
   - Dynamic SOQL, arbitrary GraphQL queries, generic REST clients, and arbitrary custom scripting are strictly disallowed.

5. **Immutable Snapshot Sending for Communications:**
   - Mail operations send immutable, approved snapshots via Gmail `messages.send` and Outlook `sendMail`.
   - Existing employee drafts are never deleted, overwritten, or repurposed as transient send envelopes.
   - Verification requires independent sent-copy evidence matching the approved content, recipients, and attachment digests (`sent_copy_observed`), never conflating submission with guaranteed recipient delivery.

6. **Journaled One-Shot Submission and No-Replay Recovery:**
   - Every mutation attempt claims an atomic, durable record in `AdapterSubmissionJournal` before egress/OS dispatch.
   - At most one external mutation or local actuation is permitted per action. Automatic retry loops and transport-level resends for mutating operations are disabled.
   - Ambiguous timeouts, worker crashes, or missing acknowledgments result in `submission_state="unknown"`. Consumed Identity fences remain consumed.
   - Recovery requires explicit out-of-band reconciliation and issuance of a new action intent with a fresh action ID, distinct attempt, and valid authorization.

## Historical ADR Amendments

This decision explicitly amends relevant execution, credential, and reservation assumptions in prior ADRs by cross-reference without rewriting their historical context:

- **[ADR-0004: Browser Bridge and Execution Boundaries](0004-browser-bridge-and-execution-boundaries.md):**
  - Amends browser execution to require joint local device reservation via `LocalExecutionReservationBroker` (negotiating `browser-bridge.v1` major 1, minor 4 with capability `local_execution_reservation_v1`).
  - Requires `execution_context` in all action results and replaces any assumption of UUIDv4 action identifiers with canonical Identity `Identifier` strings.
  - Clarifies that browser primitive completion (`completed`) is an execution receipt, not business outcome verification.

- **[ADR-0009: Local Context Guidance and Assist Boundaries](0009-local-context-guidance-and-assist-boundaries.md):**
  - Extends execution reservation across modalities: HUD assist and batch job execution share one device-wide reservation lock managed by Privacy Helper across browser and native execution.
  - Native execution is restricted to Stage 3 semantic actuation under Shell supervision.

- **[ADR-0011: Identity Authority and Approval Fencing](0011-identity-authority-and-approval-fencing.md):**
  - Updates `AdapterTargetProjectionV1` to bind `connection_id`, `connection_revision`, `vendor_account_id`, `record_key`, `expected_state: AdapterExpectedStateV1`, `environment`, and `argument_sha256`.
  - Distinguishes action effects (`read`, `draft`, `write`); read actions require 0 parameter diffs, while draft/write require 1–128 diffs.
  - Adds Identity capabilities: `application.read`, `integration.manage`, and `application.qualify`.

- **[ADR-0015: Agent Factory IR and Candidate Qualification](0015-agent-factory-ir-and-candidate-qualification.md):**
  - Normalizes synchronous `ApplicationCapabilityPort` signatures in compilation specifications to asynchronous producer-owned methods (`snapshot` and `statuses`).
  - Requires `ApplicationCapabilityBodyV1` to bind `platform="api"` for cloud workers, required `qualification_refs`, and per-operation `write_guard`.
  - Factory finalization locks `adapter_registry_guard(organization_id, generation)` before `graph_knowledge_guard`.

## Rationale and Costly Tradeoffs

- **First-Party Workers vs. Plugin ABI:** Rejecting third-party WASM or script plugins increases engineering overhead to author and maintain all seven vendor packs internally. However, it eliminates supply-chain compromise, sandboxing escapes, and unverified data leakage across tenant boundaries.
- **Layered Renewable Qualification vs. Global Certification:** Requiring 30-day attestations and per-account qualification definitions adds operational complexity and telemetry tracking. However, SaaS tenant configurations (custom fields, automations, permission sets) change frequently; global claims of compatibility result in catastrophic silent runtime failures.
- **Independent Egress Broker vs. In-Worker Tokens:** Separating token custody into an independent egress broker requires IPC or internal RPC and strict template parsing, adding sub-millisecond latency. However, it guarantees that compromised worker memory cannot leak customer OAuth refresh tokens or forge requests outside the approved template and account.
- **Immutable Snapshot Sending vs. Draft Envelopes:** Freezing snapshots and refusing to clear user drafts consumes additional storage and requires explicit verifier sent-copy matching. However, modifying or deleting user drafts destroys user work and creates severe race conditions when an employee edits a draft simultaneously.
- **Journaled One-Shot Submission vs. Automatic Replay:** Forbidding automatic replays shifts retry handling to high-level workflow reconciliation. However, external business APIs frequently lack native idempotency keys; blind retries cause duplicate payments, duplicate CRM entries, or spam emails.

## Consequences

### Positive
- Strict isolation of tenant credentials and execution contexts.
- Full provenance and cryptographic binding between approved human intent and actual external API requests.
- Zero duplicate external mutations caused by transport-level retry loops.
- Deterministic outcome verification backed by independent readback.

### Negative / Operational Cost
- All vendor integrations must be authored as first-party Rust packs.
- Operational overhead of 30-day qualification renewals and evidence verification.
- Increased latency from out-of-process credential egress mediation.
- Stricter failure modes: ambiguous network drops require explicit workflow reconciliation rather than automatic transparent retries.

*(Scope Amendment — 2026-11-15): [ADR-0019](0019-flight-simulator-isolation-and-evaluation-evidence.md) amends `AdapterEnvironmentBindingV1` with nullable `production_qualification_ref`, nullable `configuration_equivalence_evidence_ref`, and `production_equivalence_status: "established" | "not_established"`. Missing production qualification allows behavioral evaluation in Flight Simulator, but Release Governance strictly denies production readiness until equivalence is established and verified. Bumps local IPC baselines: `browser-bridge.v1` major 1, minor 6 and `shell-adapter.v1` major 1, minor 2 negotiating `evaluation_execution_v1`.*

*(Infrastructure & Security Amendment — 2026-11-16): [ADR-0024](0024-infrastructure-security-custody-and-recovery.md) mandates qualified sandbox account and environment proof for third-party adapter executions (DNS allowlisting alone is insufficient; cryptographically verified credentials and API-verified sandbox tenant identity are required) and enforces journal recovery fences before admitting fresh adapter writers following disaster recovery.*
