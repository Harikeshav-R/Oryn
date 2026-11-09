# Local Privacy Gate, Evidence Store, and Retention Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§4.5, 10.1–5, 11.5](../../TECHNICAL.md) | [PRODUCT.md §§8.3–4, 25, 28.1; ORY-005–010](../../PRODUCT.md)

### Core Responsibility
The Local Privacy Gate, Evidence Store, and Retention component enforces mandatory exclusions and data minimization at the desktop source, securely stores private screen and audio evidence locally, and governs retention, deletion, and conversion into shareable procedural knowledge.

- Device-level capture consent, authoritative capture snapshot generation, and active exclusion policy enforcement.
- Supervision and lifecycle management of the nested native observation worker (`oryn-observation-worker`), including binary signature verification, 100 ms heartbeat watchdog (500 ms timeout), and source permit issuance (`GrantObservationPermit`, `RevokeObservationPermit`, `ReleaseFrameSlot`).
- Source-aware operational tracking and recovery blocker isolation: maintains per-source health (`ready`, `degraded`, `unavailable`) and recovery blockers (`crash`, `hang`, `unclean_restart`) across `native_os`, `browser`, and `meeting` sources. A native-worker fault isolates to `native_os` without stopping independent healthy browser or meeting sources.
- Admission and routing of the third inherited browser source channel (`shell-browser.v1`) negotiated via `shell-privacy.v1` major 1, minor 1: ingests candidate browser observations, evaluates conjunctive work context rules, and issues unexpired browser permits (`GrantObservationPermit`, `RevokeObservationPermit`) with 100 ms refresh and 300 ms maximum TTL.
- Aggregation of per-profile browser bridge health into the authoritative `browser` capture source state (`sources.browser.health = "ready" | "degraded" | "unavailable"`).
- Execution gate coordination: `PauseCapture` from Desktop Shell immediately halts browser observation permits and pauses local browser execution at the nearest safe boundary.
- Masked shared-memory slot admission: maps inherited 8 MiB BGRA8 frame slots, verifies declared masked regions equal opaque-black BGRA `(0,0,0,255)`, verifies SHA-256 digest, copies frames into private buffers, and releases slots.
- Supervision interface, ephemeral visibility lease validation (100ms lease / 500ms timeout), and fail-closed capture gating.
- Durable employee pause persistence and recovery blocker tracking across process restarts and workstation power events.
- Local encrypted storage for private observations, raw screenshots, and transient audio evidence.
- Redaction and data minimization pipelines (masking credentials, tokens, PII, and financial account details).
- Ephemeral volatile processing pipeline when `personal_history_retention=false`: copies frame to volatile buffer, releases slot immediately, executes local redaction/OCR, delivers ephemeral result to live context with a strict 30-second TTL, then zeroes and discards memory without disk writes or durable evidence receipts.
- The employee's review-before-sharing workflow, ensuring no raw media egresses to the cloud.
- Automatic local retention sweeps, user-initiated local evidence deletion, and supported uninstall data purges.
### Consumes
- Raw candidate observation streams from [os-observation](os-observation.md), [browser-extension](browser-extension.md), and [meeting-intelligence](meeting-intelligence.md).
- Organization-wide mandatory exclusion rules and maximum retention caps from [identity-policy](identity-policy.md).
- Employee personal retention preferences, visibility lease renewals, session states, and pause/resume commands from [desktop-shell](desktop-shell.md).
- Explicit contribution review approvals from the employee.

### Produces
- Redacted, permitted observation events delivered to [local-context-hud](local-context-hud.md).
- Sanitized, employee-approved workflow candidates delivered to [contribution-sync](contribution-sync.md).
- Authoritative capture snapshots, state change streams, and audit receipts delivered to [desktop-shell](desktop-shell.md) via Contract 19.

### Does Not Own
- Central workflow candidate clustering or procedure synthesis (owned by [workflow-discovery](workflow-discovery.md)).
- Publishing playbooks to the organization or authoring business rules (owned by [operational-graph](operational-graph.md)).
- Remote video/screen playback for managers or administrators (strictly prohibited by product architecture).

### Boundary Requirement
Protected application categories (password managers, banking, personal messaging, health portals) must be excluded before capture at source; post-capture OCR or classification cannot authorize capture of mandatory excluded content. Mixed windows require strict pixel and DOM masking. Default local raw retention is strictly **7 days**, employee-selectable between **1–6 days**, with documented organization extension up to a maximum of **14 days** (per [PRODUCT.md §25.4](../../PRODUCT.md)). Discarded or expired private raw capture cannot be recovered from organizational dashboards. The capture gate requires continuous 100 ms visibility lease renewals from the desktop shell supervisor; loss of renewal revokes the capture gate within 500 ms and discards in-flight post-revocation observations. Capture policy validity during offline operation is capped at an absolute maximum of 24 hours.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§8.3–4, 25, 28.1; ORY-005–010](../../PRODUCT.md))
- **Mandatory Exclusions:** Mandatory protected categories (passwords, auth secrets, personal messaging, banking, private browsing, HR compensation, health portals) must never be captured or stored (ORY-005).
- **Prohibition of Manager Surveillance:** Managers cannot view or request an employee's raw screen or audio timeline through Oryn (ORY-006).
- **Review Before Sharing:** Every candidate workflow contribution requires explicit employee inspection and approval of sanitized steps before organizational sync (ORY-007).
- **Retention Expiration:** Raw local capture expires automatically on the configured schedule (default 7 days, 1–6 employee choice, max 14 days) and is purged permanently (ORY-009).
- **My Privacy Trust Center:** Exposes local retention status, active exclusion rules, and consent logs directly to the employee (ORY-010).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #1 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests raw candidate observations from [os-observation](os-observation.md), [browser-extension](browser-extension.md), and [meeting-intelligence](meeting-intelligence.md). Emits reverse source permits, policy configurations, and frame slot releases (`os-observation.v1`) to [os-observation](os-observation.md).
- **Contract Reference #2 in [Contracts Catalog](../architecture/contracts/README.md):** Emits employee-approved sanitized task contributions with consent receipts to [workflow-discovery](workflow-discovery.md) via [contribution-sync](contribution-sync.md).
- **Local Context Feed:** Streams redacted, permitted observation records to [local-context-hud](local-context-hud.md).
- **Contract Reference #19 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes capture commands (`PauseCapture`, `ResumeCapture`, `SetCaptureCategory`, `RecordCaptureConsent`, `PrepareUninstall`) and visibility lease renewals (`RenewVisibilityLease`) from [desktop-shell](desktop-shell.md); emits authoritative `CaptureSnapshot` updates over private inherited byte channels.

## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Executes as an unprivileged user-space child process (`oryn-privacy-helper`) spawned by the desktop shell native host, communicating exclusively over inherited byte channels (socketpair on macOS, anonymous pipes on Windows).
- **Physical Storage:** Stores evidence in an encrypted local database (e.g., SQLite with SQLCipher or OS-native keychains). Encryption keys are protected by user credentials.
- **Cloud Egress Prohibition:** Raw video, full-resolution screen frames, and raw audio files are strictly prohibited from network transmission to central Oryn cloud services.

## Internal architecture

### Logical Submodules
- **Pre-Capture Exclusion Interceptor & Permit Gate:** Evaluates window metadata, application identifiers, and URL domains against exclusion lists before image acquisition; issues unexpired 100 ms source permits to native workers and browser extensions.
- **Worker Supervisor & Watchdog:** Spawns `oryn-observation-worker`, enforces 500 ms watchdog on worker heartbeats, quarantines shared-memory slots upon permit revocation, and manages backoff restarts.
- **Sensitive Data Redaction Engine:** Performs on-device regex, NLP, and OCR masking of sensitive tokens, passwords, and PII.
- **Local Encrypted Evidence Store:** Manages on-disk encrypted storage of raw frames, interaction logs, and local task indexes.
- **Volatile Work Buffer Manager:** Manages ephemeral in-memory processing pipelines when `personal_history_retention=false`, enforcing zero-disk guarantees and 30-second TTL limits.
- **Retention Sweeper:** Background process that enforces TTL rules and securely deletes expired media files.
- **Sanitization Review Compiler:** Packages candidate workflow demonstrations into sanitized step narratives for employee inspection.
## State and lifecycle

### State and Persistence
- **Persisted State:** Local encrypted evidence database, exclusion rule cache, employee privacy preferences, and review receipts.
- **Lifecycle Transitions:** `Active Capture → Redacting & Storing → Retention Aging → Purged / Expired`.
- **Durable State and Blockers:** Persists durable employee pauses that survive restarts and reboots. Enforces recovery blockers (`crash`, `visibility_lost`, `update`, `unclean_restart`, `policy_expired`) that prevent automated resumption following abnormal transitions until an intentional employee resume command is received.
- **Deletion and Uninstall Semantics:** When an employee deletes local history, disk sectors are unlinked and overwritten; deletion is immediate and permanent. Supported client uninstallation verifies legal hold constraints, halts capture, and securely purges unheld private data, emitting a cryptographic purge receipt.

## Error and edge-case behavior

### Failure Handling
- **Ambiguous Window Identity:** If the application identifier or URL of a window cannot be confirmed, the gate fails safe and suppresses capture.
- **Storage Quota Exceeded:** If disk space thresholds are reached, oldest non-reviewed raw captures are purged early, accompanied by a user notification.
- **Redaction Failure:** If sensitive data detection encounters an unhandled format, the entire frame/event is dropped from candidate generation.

- **Visibility Lease Expiry:** If the native desktop shell crashes, hangs, or drops its status surfaces, visibility lease renewals cease. The privacy gate automatically halts observation within 500 ms, discarding any in-flight uncommitted frames.
- **Offline Policy Expiry:** If disconnected from the enterprise network beyond the capture policy lease expiration (maximum 24 hours), capture halts immediately and enters `policy_expired` state.
## Observability and audit

### Telemetry and Diagnostics
- Generates local audit logs recording capture events, redaction counts, retention purge runs, and contribution approvals.
- No sensitive text, window titles of excluded apps, or raw media are emitted to diagnostic telemetry.

## Security and threat model

### Security and Safety Considerations
- **Local Database Tampering:** Database files are encrypted at rest using platform-backed keys to prevent extraction by unauthorized local processes.
- **PII Leakage in Excerpts:** Candidate contribution excerpts must replace detected PII with generic field tokens (e.g., `<CUSTOMER_ID>`) rather than plausible fake values.
- **Surveillance Resistance:** The component rejects any administrative command requesting remote extraction of raw screen frames.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.1: ORY-005, ORY-006, ORY-007, ORY-008, ORY-009, ORY-010](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* Local raw capture reaches day 8 under default 7-day retention setting.
  - *Expected Observable Result:* The retention sweeper permanently purges the day 1 raw media and indexes; My Privacy displays updated retention bounds; no central API or dashboard can access the purged data.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Low I/O overhead during continuous frame and event logging.
- Background retention sweeps run at low process priority to avoid disk contention during employee working hours.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What local embedded storage engine (SQLite with SQLCipher, LevelDB, or OS data stores) offers the best combination of encryption speed and indexing?
- How should on-device redaction balance OCR speed against CPU utilization?
- What exact encryption key derivation and storage scheme (OS Keychain / DPAPI) should protect the local evidence database?
- How should legal hold requests be handled without violating product maximum retention limits?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Local capture consent enforcement, raw evidence storage, redaction pipeline, and retention purging.
2. *Data ingress/egress:* Ingests raw observation streams; outputs sanitized, employee-approved workflow contributions.
3. *Versions/identities:* Local device ID, policy version hash, and employee user identifier.
4. *Upstream failure:* If upstream observers fail, storage maintains existing data and logs gap markers.
5. *Authority:* The employee is authoritative for local retention choices (within 1–14 day bounds) and sharing review.
6. *Testing without private details:* Tested via mock observation streams containing synthetic PII and excluded app IDs.
7. *Audit and duplicate prevention:* Contribution approvals generate signed cryptographic receipts.
8. *Failure blast radius:* Local storage failure stops local observation; fails closed to ensure privacy.
9. *v1.0 criteria:* Enables ORY-005, ORY-006, ORY-007, ORY-009, and ORY-010 verified through retention sweeps and privacy audits.
