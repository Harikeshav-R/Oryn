# Contribution and Synchronization Gateway Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§4.8, 8.1, 8.8](../../TECHNICAL.md) | [PRODUCT.md §§4.4, 10, 25.5–7; ORY-007, ORY-012](../../PRODUCT.md)

### Core Responsibility
The Contribution and Synchronization Gateway mediates the boundary between private device knowledge and organization-shared knowledge, securely transmitting employee-approved sanitized contributions to the control plane and delivering published guidance back to the endpoint.

### Owns
- Validation and transmission of employee-approved workflow contributions.
- Generating and recording cryptographic contribution review receipts.
- Tracking local-to-cloud connectivity state, offline sync queues, and retry policies.
- Secure retrieval, caching, and cache invalidation of published organizational playbooks and peer fixes.

### Consumes
- Sanitized, reviewed task contributions from [local-privacy-storage](local-privacy-storage.md).
- Centrally published playbooks, rules, and policy updates from [operational-graph](operational-graph.md) and [control-plane](control-plane.md).
- Policy revocation and permission changes from [identity-policy](identity-policy.md).
- Network interface status from the host operating system.

### Produces
- Authenticated, organization-scoped contribution payloads delivered to [workflow-discovery](workflow-discovery.md).
- Reviewed meeting handoff proposals (`ReviewedMeetingHandoffProposal`) delivered to [operational-graph](operational-graph.md) via Contract 24.
- Updated local playbook and peer-fix caches delivered to [local-context-hud](local-context-hud.md).
- Contribution delivery receipts and sync status indicators delivered to [desktop-shell](desktop-shell.md).

### Does Not Own
- Direct upload of unreviewed or raw screen/audio capture files (strictly prohibited on the contribution path).
- Routing transient AI inference requests (owned by [local-privacy-storage](local-privacy-storage.md) edge `InferenceEgressClient` and [control-plane](control-plane.md) `InferenceAdmission` via [cloud-inference](../architecture/cloud-inference.md); inference processing is strictly separated from organizational contribution).
- Deciding whether a workflow candidate should be published across the company (owned by [operational-graph](operational-graph.md)).
- Central identity and authorization rules (owned by [identity-policy](identity-policy.md)).

### Boundary Requirement
Offline behavior must preserve employee privacy and fail safely. Upon network reconnection, the gateway must process policy, restriction, and access revocation updates before transmitting any queued outgoing contributions. Any previously approved item whose scope has since been revoked is dropped from the egress queue. Unreviewed observations and drafts must never be queued or automatically uploaded upon network reconnection. Raw video, screen captures, and audio files are strictly prohibited from network egress.
## Product requirements

### Key Product Requirements ([PRODUCT.md §§4.4, 10, 25.5–7; ORY-007, ORY-012](../../PRODUCT.md))
- **Explicit Review Before Sync:** No procedural data may leave the device without an explicit review receipt proving the employee approved the contribution (ORY-007).
- **Structured Candidate Payloads:** Transmitted contributions must contain sanitized task objectives, step sequences, application names, and observed variables without raw media (ORY-012).
- **Revocation Propagation:** When an employee's access or consent is revoked, the gateway must purge restricted playbooks from the local cache immediately upon receiving the event.

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #2 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests reviewed contributions from [local-privacy-storage](local-privacy-storage.md) and delivers them to [workflow-discovery](workflow-discovery.md).
- **Contract Reference #3 in [Contracts Catalog](../architecture/contracts/README.md):** Fetches published playbooks from [operational-graph](operational-graph.md) and populates the local cache for [local-context-hud](local-context-hud.md).
- **Contract Reference #24 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers reviewed meeting handoff proposals (`ReviewedMeetingHandoffProposal`) from [meeting-intelligence](meeting-intelligence.md) to [operational-graph](operational-graph.md); preserves review receipts and business context.
- **Revocation Event Contract:** Receives `consent.revoked` and `access.revoked` events and triggers local cache invalidation.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Runs locally on employee endpoints as part of the desktop companion suite.
- **Transport Security:** All network communications use TLS 1.3 with mutual authentication or cryptographically signed session tokens.
- **Tenant Isolation:** Every contribution payload includes explicit tenant/organization identifiers; the gateway verifies tenant binding before transmission.

## Internal architecture

### Logical Submodules
- **Receipt Validator:** Verifies that outgoing payloads have valid, untampered employee review signatures.
- **Sync Transport Client:** Manages HTTP/gRPC connections, authentication headers, and exponential backoff retries.
- **Offline Queue Manager:** Holds approved outgoing contributions during network outages and handles safe resumption.
- **Playbook Cache Synchronizer:** Queries delta updates for published playbooks relevant to the employee's assigned teams.

## State and lifecycle

### State and Persistence
- **Persisted State:** Encrypted offline queue for approved contributions, sync receipts, and versioned playbook cache.
- **Lifecycle Transitions:** `Connected ↔ Disconnected (Offline Queueing) ↔ Syncing ↔ Sync Complete`.
- **Reconnection Ordering:** Reconnection enforces strict sequencing: (1) authenticate session, (2) fetch active policy and revocation state, (3) purge newly restricted or revoked items from offline queue, and (4) transmit remaining approved contributions and reviewed handoffs still authorized to leave. Reconnection never sweeps unreviewed drafts, and never automatically uploads offline meeting audio backlog (deferred meeting processing requires explicit employee command under Contract 19).

### Failure Handling
- **Sync Server Unreachable:** Outgoing approved contributions remain queued in encrypted storage; sync retries with exponential backoff.
- **Authentication Expiration:** If the employee's session token expires, sync pauses and alerts the user to re-authenticate.
- **Invalid Payload Schema:** If the backend rejects a payload due to schema mismatch, the item is quarantined and logged.

## Observability and audit

### Telemetry and Diagnostics
- Emits sync success/failure rates, payload byte sizes, and network latency metrics.
- Excludes payload step descriptions, application names, and employee comments from central operational logs.

## Security and threat model

### Security and Safety Considerations
- **Bypass of Review Gate:** The gateway validates cryptographic review receipts; attempts to submit unreviewed drafts fail validation.
- **Man-in-the-Middle Attacks:** Strict certificate pinning and TLS 1.3 protect against payload inspection or tampering in transit.
- **Replay Attacks:** Contributions include nonce identifiers and timestamps to prevent duplicate submissions.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.1: ORY-007; §31.2: ORY-012](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* An employee reviews and approves a sanitized PO reconciliation workflow while the endpoint is offline; network connection is subsequently restored.
  - *Expected Observable Result:* The gateway establishes a secure session, validates the review receipt, transmits the contribution to workflow discovery, receives a delivery receipt, and leaves unreviewed private media on the local endpoint.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Low bandwidth utilization via payload compression and delta caching.
- Sync operations run asynchronously in the background without impacting user typing or desktop performance.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What sync transport protocol (gRPC streaming vs. HTTPS REST) best handles intermittent laptop connectivity?
- How should contribution deduplication be handled when multiple employees submit identical workflows?
- What offline queue storage format ensures durability across OS reboots?
- What delta-sync algorithm minimizes bandwidth when synchronizing updated organizational playbooks?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Contribution receipt validation, sync transport, offline queueing, and local playbook caching.
2. *Data ingress/egress:* Ingests reviewed contributions and published playbooks; outputs validated contributions to control plane.
3. *Versions/identities:* Organization ID, user ID, client app version, and payload schema version.
4. *Upstream failure:* If cloud control plane is unreachable, outgoing contributions remain safely queued locally.
5. *Authority:* The employee is authoritative for contribution release; control plane is authoritative for playbook publishing.
6. *Testing without private details:* Tested via mock control-plane endpoints and synthetic contribution payloads.
7. *Audit and duplicate prevention:* Every contribution carries a client-generated UUID and signed review receipt.
8. *Failure blast radius:* Gateway failure stops knowledge sync; local observation and local guidance remain functional.
9. *v1.0 criteria:* Enables ORY-007 and ORY-012 verified through offline queueing and review receipt validation tests.
