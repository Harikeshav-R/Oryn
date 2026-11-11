# Application Capability Registry and Integration Management Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§5.6, 6.3](../../TECHNICAL.md) | [PRODUCT.md §§3.3–6, 13.5, 16.4–7, 17; ORY-028, ORY-041, ORY-043–044](../../PRODUCT.md)

### Core Responsibility
The Application Capability Registry and Integration Management component describes, manages, and executes permitted interactions with external business applications (ERPs, CRMs, web portals, desktop tools), advertising granular capabilities and enforcing scoped, least-privileged connection lifecycles.

### Owns
- The authoritative Application Capability Registry declaring supported observe, guide, assist, run, and verify capabilities per application.
- Standardized adapter interface definitions and connection lifecycle management.
- Actuation and data readback protocols across diverse modalities (structured REST/GraphQL APIs, browser automation, desktop accessibility).
- Side-effect semantics declarations (idempotency, reversibility, transactionality).
- Adapter-level error categorization and credential isolation.

### Consumes
- Customer-approved enterprise application connection credentials from [infrastructure-security](infrastructure-security.md).
- Authorized operation requests with target parameters from [agent-runtime](agent-runtime.md).
- Verification readback requests from [outcome-verification](outcome-verification.md).
- Scope restrictions and authorization grants from [identity-policy](identity-policy.md).

### Produces
- Capability discovery metadata delivered to [agent-factory-ir](agent-factory-ir.md) and [job-orchestration](job-orchestration.md).
- External action submission receipts, error classifications, and observed readback data delivered to [agent-runtime](agent-runtime.md) and [outcome-verification](outcome-verification.md).
- Integration health, latency, and connection status indicators delivered to [control-plane](control-plane.md).

### Does Not Own
- Deciding whether an action is authorized under business policy (owned by [identity-policy](identity-policy.md)).
- High-level business workflow logic or retry strategy (owned by [job-orchestration](job-orchestration.md)).
- Determining final business verification verdict based on readback (owned by [outcome-verification](outcome-verification.md)).

### Boundary Requirement
Observe, Guide, Assist, Run Supervised, and Run Autonomously are distinct advertised capabilities. An adapter may support read operations without supporting automated writes. Verification support is strictly separate from action execution. Unsupported capabilities cannot be inferred or hallucinated from model output. Production and test connections are never interchangeable by default.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§3.3–6, 13.5, 16.4–7, 17; ORY-028, ORY-041, ORY-043–044](../../PRODUCT.md))
- **Strict Scope Boundaries:** Adapters enforce that an agent cannot access applications or records outside its approved scope (ORY-028).
- **Preflight Connection Validation:** Verifies application connection health and permissions before job execution begins (ORY-041).
- **Readback Evidence Generation:** Provides independent readback evidence following action submission; prevents unverified actions from being marked complete (ORY-043).
- **Ambiguous Submission Protection:** When an external action times out or fails ambiguously, the adapter reports the outcome as uncertain to prevent blind duplicate retries (ORY-044).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #6 in [Contracts Catalog](../architecture/contracts/README.md):** Advertises supported actions, limitations, and verification capabilities to [agent-factory-ir](agent-factory-ir.md), [job-orchestration](job-orchestration.md), and [agent-runtime](agent-runtime.md).
- **Contract Reference #12 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes authorized external operation requests from [agent-runtime](agent-runtime.md) (for batch jobs) and [local-context-hud](local-context-hud.md) (for HUD assist sessions); binds `ExecutionContextV1` (`job` or `assist`) and the verified authority bundle `{authorization: ActionAuthorizationV1, approval: SignedApprovalProposalV1|null, admission: SignedActionAdmissionV1}`; delegates local browser actions to [browser-extension](browser-extension.md) via `ExecuteBrowserAction` over `browser-bridge.v1` (major 1, minor 3).
- **Contract Reference #13 in [Contracts Catalog](../architecture/contracts/README.md):** Emits action submission receipts (`BrowserActionResult` with `submission_state` and `ExecutionContextV1`) and independent readback evidence to [outcome-verification](outcome-verification.md).
- **Contract Reference #22 Reference:** Adapters remain strictly deterministic; remote model inference under [cloud-inference](../architecture/cloud-inference.md) cannot bypass declared adapter action constraints or invent unsupported capabilities.
- **Action Preflight & Staging:** When staging actions requiring review, the adapter owns `AdapterStagedActionV1` (canonical argument bytes ≤16 KiB validated against declared operation schema). Supplies `ActionPolicyFactsV1` to [identity-policy](identity-policy.md) (valid ≤30 seconds) and re-verifies live preflight immediately prior to admission consumption.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Deployed as isolated worker services or secure local connectors with network access to external business systems.
- **Credential Segregation:** Operates using narrow, scoped API keys or OAuth tokens; production credentials are never passed to simulation environments or client UIs.
- **Modality Hierarchy:** Prioritizes structured APIs first, validated browser automation second, and native desktop accessibility actions third.

## Internal architecture

### Logical Submodules
- **Capability Registry:** Maintains catalog of applications, supported operations, risk tiers, and verification support.
- **Connection Manager:** Handles OAuth2 token refresh, connection pooling, rate limiting, and mTLS connections.
- **Actuation Engine:** Translates standardized IR action requests into concrete HTTP calls, DOM manipulations, or OS events.
- **Readback Adapter:** Executes authoritative queries against external systems to capture post-action state for independent verification.

## State and lifecycle

### State and Persistence
- **Persisted State:** Adapter registration metadata, endpoint configurations, and connection status in central storage.
- **Lifecycle Transitions:** `Disconnected → Testing Connection → Active ↔ Degraded / Rate-Limited ↔ Suspended → Deprecated`.
- **Connection Isolation:** Connection sessions are ephemeral and scoped to specific job executions.

## Error and edge-case behavior

### Failure Handling
- **Network Timeout / Ambiguous HTTP 504:** The adapter flags the submission as `Outcome Unknown` (or `Submitted (Uncertain)`) and prohibits immediate retry. Because the logical action fence in [identity-policy](identity-policy.md) was consumed at admission, duplicate dispatch under the same action ID is blocked.
- **Authentication Expiration (401/403):** Flags the connection as degraded and alerts administrators to re-authorize credentials.
- **Schema Drift:** If the external API returns an unexpected payload structure, the adapter aborts and records a compatibility error.

## Observability and audit

### Telemetry and Diagnostics
- Captures API response status codes, external latency, rate limit quotas, and payload byte counts.
- Redacts sensitive request/response payload fields (passwords, PII, financial amounts) from operational logs.

## Security and threat model

### Security and Safety Considerations
- **Credential Leakage:** Credentials reside in encrypted vaults and are injected into adapters as short-lived tokens; never logged or exposed to LLM prompts.
- **Blind Duplicate Retries:** Protects against duplicate billing or shipping actions by enforcing idempotency keys on external API requests.
- **Test / Production Boundary Crossing:** Physical network separation prevents test adapters from communicating with production endpoints.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.3: ORY-028; §31.5: ORY-041, ORY-043, ORY-044](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* An agent invokes an invoice submission adapter; the external ERP gateway accepts the connection but drops the socket after 30 seconds without returning an HTTP status code.
  - *Expected Observable Result:* The adapter returns a `Submission Uncertain` status with evidence of socket timeout; it does not issue an automatic duplicate HTTP POST; the job coordinator holds the case for readback verification.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Connection pooling and keep-alive optimization for high-throughput ERP endpoints.
- Configurable rate-limiting buckets respecting external vendor API limits.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What standardized adapter plugin interface (e.g., gRPC service plugins, WebAssembly, or TypeScript modules) allows rapid integration development?
- How should adapters handle external applications with no public APIs or accessibility support?
- What idempotency key patterns best prevent duplicate mutations across legacy ERP systems?
- How should readback adapters query authoritative state when external systems exhibit replication lag?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* External application interaction, capability declarations, connection lifecycles, and readback fetching.
2. *Data ingress/egress:* Ingests authorized operation requests; outputs submission receipts and external readback evidence.
3. *Versions/identities:* Adapter version, Application vendor version, Connection ID, and Tenant ID.
4. *Upstream failure:* If external system is down, adapter returns structured error; does not attempt unverified retries.
5. *Authority:* [identity-policy](identity-policy.md) authorizes action execution; [outcome-verification](outcome-verification.md) determines business outcome.
6. *Testing without private details:* Tested using mock API servers (WireMock/Prism) and synthetic sandbox tenants.
7. *Audit and duplicate prevention:* Transmits client-generated idempotency keys to external APIs where supported.
8. *Failure blast radius:* Adapter failure pauses dependent job cases; unrelated adapters and platform services continue normally.
9. *v1.0 criteria:* Enables ORY-028, ORY-041, ORY-043, and ORY-044 verified through timeout and readback verification tests.
