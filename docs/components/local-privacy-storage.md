# Local Privacy Gate, Evidence Store, and Retention Specification

Status: Detailed technical specification — implementation pending  
Component Number: 5  
Runtime Process: `oryn-privacy-helper` (unprivileged user-space child process)  
Authority: Technical Architecture, Security Engineering, Product Engineering  

---

## Purpose and ownership

### Source References
- [TECHNICAL.md §§4.5, 7.2, 10.1–5, 11.5, 13.2, 14.2](../../TECHNICAL.md)
- [PRODUCT.md §§4.1, 8.3–4, 25.1–11, 28.1, 31.1, 31.9; ORY-002–010, ORY-021, ORY-068–076](../../PRODUCT.md)
- [Cross-Component Contracts Catalog](../architecture/contracts/README.md): Contracts 1, 2, 19, 22, 23, 24, 25
- [Data Classification Policy](../architecture/data-classification.md)
- [System Threat Model](../architecture/threat-model.md)
- [Shared Cloud Inference Specification](../architecture/cloud-inference.md)
- Architecture Decision Records: [ADR-0001](../adr/0001-desktop-runtime-and-presentation.md), [ADR-0002](../adr/0002-desktop-capture-lifecycle.md), [ADR-0003](../adr/0003-native-observation-admission-and-isolation.md), [ADR-0004](../adr/0004-browser-bridge-and-execution-boundaries.md), [ADR-0005](../adr/0005-cloud-inference-and-private-evidence.md), [ADR-0006](../adr/0006-meeting-capture-and-review-boundaries.md), [ADR-0007](../adr/0007-private-evidence-storage-and-retention.md), [ADR-0008](../adr/0008-reviewed-still-image-sharing.md)

### Core Responsibility
The Local Privacy Gate, Evidence Store, and Retention component (`oryn-privacy-helper`) is the single authoritative guardian of employee privacy, device-level capture admission, private evidence durability, and voluntary sharing boundaries on the employee workstation. It executes as an unprivileged user-space child process spawned by the native desktop shell supervisor.

The component governs:
1. **Authoritative Capture Gating:** Evaluates employee consent, category states, organizational restrictions, application profiles, window identities, and signed capture policy leases before admitting any screen, DOM, or audio observation.
2. **Worker Supervision & Permit Issuance:** Spawns, monitors, and terminates the native observation worker (`oryn-observation-worker`) and meeting worker (`oryn-meeting-worker`); runs a 100 ms watchdog timer; and issues time-bounded source permits that renew every 100 ms and expire within 300 ms.
3. **Shared-Memory Frame Admission:** Maps inherited 8 MiB BGRA8 shared-memory frame slots, validates descriptor bounds and epochs, copies pixel data into private buffers, verifies that declared masked regions equal opaque-black BGRA `(0,0,0,255)`, verifies frame SHA-256 digests, and promptly releases slots back to worker pools.
4. **Encrypted Evidence Storage:** Manages local, profile-bound SQLCipher 4 encrypted structured database partitions and independently encrypted media files (AES-256-GCM) with no central raw backup, no recovery escrow, and no device-signing key reuse.
5. **Retention & Crash-Safe Erasure:** Enforces fixed raw retention deadlines (default 7 days, 1–6 employee choice, documented extension up to 14 days), evaluates signed legal hold verdicts, stages cryptographic deletion fences, and executes verified database rebuilding and key destruction.
6. **Volatile Processing Mode:** Enforces a strict 30-second volatile memory lifetime from original acquisition when `personal_history_retention` is disabled, with zero disk writes, locked memory buffers, and no deferred upload backlog.
7. **Employee Review Before Sharing:** Compiles candidate workflows, derives purpose-bound redacted still images, enforces strict image size and count limits, binds final review attestations with Ed25519 device signatures, and emits approved contributions.
8. **Governed Inference Egress:** Operates the edge `InferenceEgressClient`, attaching signed `InferenceAuthorization` tokens and dispatching transient model inference requests over TLS 1.3 to the LiteLLM gateway with contractual zero content retention, no model training, and strict US geographic confinement.
9. **Private HUD Context Stream:** Streams sanitized observation events and ingests reverse demonstration proposals over a direct, length-prefixed socketpair/pipe link (`privacy-context.v1`, Contract 25) with `local-context-hud`.
10. **Unified Local Execution Reservation:** Operates the `LocalExecutionReservationBroker`, maintaining the authoritative workstation execution reservation keyed by `(device_id, context, modality, epoch)` across browser (`browser-bridge.v1` major 1 minor 6) and native (`shell-adapter.v1` major 1 minor 2) modalities to enforce mutual exclusion and prevent competing actuation.

### Internal Modules and Responsibilities
`oryn-privacy-helper` is structured into eight decoupled Rust modules:
- `CaptureGate`: Authoritative consent validation, category state derivation, window and URL admission, ephemeral visibility lease tracking (100 ms lease / 500 ms cutoff), and signed capture policy lease verification. Runs on a high-priority, non-blocking control thread.
- `LocalExecutionReservationBroker`: Maintains the authoritative local reservation record keyed by `(device_id, context, modality, epoch)`, enforcing mutual exclusion between browser and native actuation, validating session epochs and execution context (`job`, `assist`, or `evaluation`), and executing fail-safe cleanup upon disconnect, pause, or completion.
- `SourceSupervisor`: Spawns and supervises `oryn-observation-worker` and `oryn-meeting-worker`; verifies binary Authenticode / code signatures; enforces 100 ms watchdog heartbeats; tracks per-source health (`ready`, `degraded`, `unavailable`); manages shared-memory slot admission; aggregates browser bridge health; and maintains source-specific recovery blockers. Meeting session coordination logic remains owned by Component 4 inside the helper.
- `EvidenceStore`: Manages SQLCipher 4 database partitions, independently encrypted media blobs, FTS5 indexes, versioned writes, transactional commits, and keyset-paginated read queries.
- `RetentionCoordinator`: Tracks retention deadlines, enforces trusted-time constraints across boots, evaluates signed retention/hold verdicts, computes deletion previews, and executes crash-safe selective purge workflows.
- `SanitizationReviewCoordinator`: Deterministic minimization, PII/credential masking, candidate review management, redacted still-image derivation, review attestation signing, and authoritative release cancellation fences.
- `InferenceEgressClient`: Attaches signed `InferenceAuthorization` tokens to minimized payloads, routes requests to the LiteLLM gateway, tracks request/response generations, and cancels remote work upon capture stop or consent revocation.
- `PrivacyContextPort`: Implements the `privacy-context.v1` interface, managing length-prefixed streaming of permitted observations to `local-context-hud` and validating reverse demonstration proposals.
- `PolicyVerifier`: Cryptographic verification of identity-policy signed artifacts (`SignedCapturePolicyLease`, `SignedRetentionVerdict`, `SignedArtifactPolicy`) using pinned Ed25519 issuer public keys.

### Priority Timer and Control Path Isolation
To guarantee responsiveness and fail-closed privacy:
- The `CaptureGate` timer loop, visibility lease watchdog, and Channel 1 control processor run on a dedicated, high-priority thread.
- **Blocking operations are strictly prohibited on the control path:** No synchronous SQL queries, no media compression or re-encoding, no OS Keychain or Credential Manager I/O, no filesystem syncs (`fsync`), and no network requests.
- Storage writes and background sweeps execute on bounded worker pools with strict queues. If storage writes encounter backpressure, the affected source is throttled or paused; the control gate never blocks.
- **Immediate Pause Invariant:** Receiving `PauseScreenObservation` or `PauseCapture` immediately closes affected source admission in memory on the control thread, halting permit issuance within 1 ms. The durable pause state is then written to the control partition before a success response is returned. If durable persistence fails, capture remains stopped, an error is returned, and storage failure is exposed; the helper never falsely acknowledges an unsaved pause.

### Exclusion Hierarchy and Precedence
Exclusion evaluation follows a strict, non-overridable waterfall where denial always wins:
1. **Mandatory Protected Categories:** Passwords, authentication secrets, password managers, personal messaging, personal banking, private/incognito browsing windows, personal webmail, HR compensation portals, and protected health portals.
2. **Organizational Exclusions:** Administrative restrictions, blacklisted executable IDs, restricted URL domains, and excluded window patterns declared in the signed capture policy lease.
3. **Employee Exclusions:** User-configured excluded applications, window titles, and web domains configured in My Privacy.
4. **Explicit Certified Work Admission:** Active window matches an approved application profile, certified executable identity, or verified enterprise-managed browser route with disabled incognito modes.

**Denial Invariant:** Neither employee configuration nor an AI model can relax or override mandatory exclusions. If window identity is ambiguous, process identity is recycled, private browsing status is uncertain, active work account cannot be verified, or window geometry is stale, the gate fails closed and suppresses capture for that surface.

### Consumes
- Raw candidate observation streams from [os-observation](os-observation.md), [browser-extension](browser-extension.md), and [meeting-intelligence](meeting-intelligence.md) over Contract 1.
- Capture commands, visibility lease renewals, session power states, and review actions from [desktop-shell](desktop-shell.md) over Contract 19.
- Signed capture policy leases, signed retention verdicts, and signed artifact policies from [identity-policy](identity-policy.md).
- Signed inference authorization tokens from [identity-policy](identity-policy.md) for Contract 22.
- Reverse demonstration proposals from [local-context-hud](local-context-hud.md) over Contract 25.

### Produces
- Authoritative `CaptureSnapshot` updates, query responses, and purge receipts to [desktop-shell](desktop-shell.md) over Contract 19.
- Redacted, permitted observation events to [local-context-hud](local-context-hud.md) over Contract 25 (`privacy-context.v1`).
- Employee-reviewed, signed task contributions (`ReviewedContributionV1`) to [contribution-sync](contribution-sync.md) over Contract 2.
- Authorized inference requests (`InferenceRequest`) to the LiteLLM gateway over Contract 22.
- Confirmed commitment projections to [local-context-hud](local-context-hud.md) and [desktop-shell](desktop-shell.md) over Contract 23.
- Reviewed meeting handoffs to [operational-graph](operational-graph.md) via [contribution-sync](contribution-sync.md) over Contract 24.

### Does Not Own
- Desktop shell presentation, badge rendering, or native window management (owned by [desktop-shell](desktop-shell.md)).
- Central workflow clustering or procedure synthesis (owned by [workflow-discovery](workflow-discovery.md)).
- Playbook authoring, canonical graph publishing, or cross-team access control (owned by [operational-graph](operational-graph.md)).
- Network queue retry, offline cache sync, or remote delivery receipts (owned by [contribution-sync](contribution-sync.md)).
- Remote screen or audio playback for managers or administrators (strictly prohibited across Oryn).
- On-device local AI models or speech recognizers (all Oryn AI inference routes through cloud LiteLLM gateway).

### Boundary Requirement
Default local raw retention is strictly **7 days**, employee-selectable between **1 and 6 days**, with documented organizational extension up to a maximum of **14 days**. Discarded or expired private raw capture cannot be recovered from organizational dashboards. Capture requires continuous 100 ms visibility lease renewals from the desktop shell; loss of renewal halts capture within 500 ms.

---

## Product requirements

### Traceability to Product Acceptance Criteria
- **Mandatory Exclusions (ORY-005):** Passwords, auth secrets, personal messaging, banking, incognito browsing, HR compensation, and health portals must never be captured or stored.
- **Prohibition of Manager Surveillance (ORY-006):** Managers cannot view or request an employee's raw screen or audio timeline through Oryn.
- **Review Before Sharing (ORY-007):** Every candidate workflow contribution requires explicit employee inspection and approval of sanitized steps and redacted artifacts before organizational sync.
- **Meeting Recording Confirmation (ORY-008):** Meeting recording is off by default and requires explicit per-meeting confirmation and notice acknowledgment.
- **Retention Expiration (ORY-009):** Raw local capture expires automatically on the configured schedule (default 7 days, 1–6 employee choice, max 14 days) and is purged permanently.
- **My Privacy Trust Center (ORY-010):** Exposes local retention status, active exclusion rules, consent logs, `last_cleanup_at`, next expiry, pending cleanup, and last error directly to the employee.
- **Meeting Commitments (ORY-021):** Confirmed commitments produce contextual reminders; unconfirmed suggestions cannot trigger external mutations.
- **Security Policy Enforcement (ORY-068):** Policy changes identify affected capabilities and immediately prevent prohibited capture or sharing actions.
- **Offboarding & Data Purge (ORY-069):** Controlled offboarding flow enables permanent local private data purge with cryptographic receipt.
- **Audit Logging (ORY-070):** Meaningful approvals, releases, permission changes, and deletions produce tamper-evident audit records.
- **Governed Inference Egress (ORY-071–076):** All v1.0 AI inference routes through LiteLLM; zero local inference; purpose-authorized; US-processing; contractual zero content retention; offline recording requires fresh authorization upon reconnection.

### Normative Privacy Requirements
1. **Source Permit Timing:** Observation workers and browser content scripts operate strictly under reverse source permits issued by `oryn-privacy-helper`. Permits renew every 100 ms and expire within 300 ms. If a worker fails to receive a permit renewal within 300 ms, acquisition ceases immediately.
2. **Visibility Lease Cutoff:** The desktop shell supervisor must renew the ephemeral visibility lease every 100 ms. If unrenewed for 500 ms (due to shell crash, lock, sleep, or occlusion), `CaptureGate` revokes all active permits, invalidates in-flight shared-memory slots, and halts observation.
3. **Independent Modality Retention:**
   - Screen evidence (visual frames and contextual window metadata) is governed by the configured raw retention deadline (default 7 days).
   - Meeting evidence (audio recordings and transcripts) is governed by the meeting session coordinator under independent retention bounds.
   - Turning off `personal_history_retention` applies strictly to new automatic screen history. Existing screen evidence remains readable and deletable until its unchanged deadline. Separately authorized meeting sessions continue storing audio and transcripts under their explicit retention policy.
4. **Volatile Processing Guarantees:** When `personal_history_retention=false`, screen frames and DOM observations admitted for live assistance, visual extraction, or adapter target preparation are held in locked, non-swappable volatile memory with a strict 30-second TTL from original acquisition. Observation-derived preparation buffers expire and are zeroed immediately upon TTL expiration, requiring fresh target resolution if unexecuted. No raw screen pixels, DOM nodes, embeddings, intermediate model outputs, or captured before-values touch disk. Local minimal receipts are content-free and independent of personal-history retention; raw native/browser observations never become a central execution transcript. Signed hashes and action approval records do not justify retaining captured before-values. API-authorized business inputs remain distinct from employee capture. If cloud inference is unavailable, the request fails without maintaining a deferred upload backlog.
5. **Legal Hold Constraints:** Legal holds block voluntary employee deletion of eligible evidence within its existing configured retention deadline. A legal hold cannot authorize new capture, cannot provide manager or administrative browsing access to raw timelines, and cannot extend retention beyond the original raw retention deadline. Expired records are purged permanently regardless of hold status.
6. **No Silent Recovery or Backup:** Oryn maintains no central backup, no recovery escrow, no administrator override keys, and no recovery export for private evidence. Lost device encryption keys result in permanent, unrecoverable loss of private history.
7. **Separation of Private Observations and Durable Execution Checkpoints:** Authorized execution reads are strictly distinct from passive employee observations:
   - **Private Observations:** Passive screen frames, DOM nodes, audio transcripts, and UI context held locally by Privacy Helper are governed by employee consent and local retention policies. Under `personal_history_retention=false`, they expire in locked volatile memory within 30 seconds of original acquisition. Local-private values and observation-derived buffers cannot be promoted to durable central checkpoints. If an execution path depends on an expired or unpromotable local observation, execution pauses rather than silently relaxing classification.
   - **Durable Execution Checkpoints:** Central Job Orchestration stores durable execution checkpoints (`orchestration_checkpoint`) and encrypted typed values (`orchestration_value`). These are business inputs and authorized operation values retrieved through authenticated adapters (`AdapterExecutionPort::value`) or certified model outputs, encrypted with per-execution DEKs (AES-256-GCM). They are retained for 7 days post-completion (with 30-day resumability) under organizational custody. Content-free action receipts (`AdapterSubmissionReceiptV1`) and consequential audit logs are preserved independently of employee local observation settings.

---

## Upstream and downstream contracts

### Contract Topology Overview
```
+------------------------------------------------------------------------------------+
|                                  Desktop Shell                                     |
+------------------------------------------------------------------------------------+
       ^                     | Channel 1: Control (shell-privacy.v1)
       |                     | Channel 2: Bounded Queries
       | Contract 19         | Channel 3: shell-browser.v1 (via broker)
       |                     | Channel 4: shell-meeting-audio.v1 (via broker)
       v                     v
+------------------------------------------------------------------------------------+
|                         oryn-privacy-helper (Component 5)                          |
|                                                                                    |
|  +--------------------+  +--------------------+  +-------------------------------+ |
|  |    CaptureGate     |  |  SourceSupervisor  |  |         EvidenceStore         | |
|  +--------------------+  +--------------------+  +-------------------------------+ |
|  +--------------------+  +--------------------+  +-------------------------------+ |
|  | RetentionCoord     |  | SanitizationReview |  |     InferenceEgressClient     | |
|  +--------------------+  +--------------------+  +-------------------------------+ |
+------------------------------------------------------------------------------------+
   | Contract 1               | Contract 25             | Contract 2      | Contract 22
   | (os-observation.v1,      | (privacy-context.v1)    | (ReviewedContrib| (LiteLLM
   |  meeting pipes)          |                         |  Attestation)   |  TLS 1.3)
   v                          v                         v                 v
+------------------+   +-------------------+   +------------------+  +---------------+
| Observation &    |   | Local Context HUD |   | ContributionSync |  | LiteLLM Cloud |
| Meeting Workers  |   | (Component 7)     |   | (Component 8)    |  | Gateway       |
+------------------+   +-------------------+   +------------------+  +---------------+
```

### Contract 1: Observation and Meeting Worker Interfaces
Ingests candidate observations and emits reverse source permits over private inherited byte channels and shared memory:
- Native Observation: `os-observation.v1` protocol. Worker sends `ObservationEvent` and shared-memory frame descriptors. Helper emits `GrantObservationPermit`, `RevokeObservationPermit`, and `ReleaseFrameSlot`.
- Browser Extension: Inherited Channel 3 (`shell-browser.v1`, max 256 KiB framing) receives structured DOM observations and navigation events; helper evaluates route policies and emits browser observation permits.
- Browser Meeting Audio: Inherited Channel 4 (`shell-meeting-audio.v1`) forwards binary 16 kHz 16-bit mono PCM frames with 64-byte `ORYA` headers from `BrowserBridgeBroker`.
- Native Meeting Audio: Inherited pipe pair forwards process-tapped Core Audio / WASAPI PCM chunks from `oryn-meeting-worker`.

### Contract 19: Desktop Shell Control and Query Interfaces
Operates over two dedicated inherited byte channels using 4-byte big-endian framing with a 1,048,576 byte (1 MiB) maximum payload:
- **Channel 1 (Control Channel):** Encapsulates idempotent commands and capture snapshot subscriptions. All mutations carry `command_id`, `session_epoch`, `expected_revision` (serialized as decimal string), and typed payload.
- **Channel 2 (Query Channel):** Encapsulates bounded, read-only private history queries, candidate browsing, deletion previews, and purge status checks using cursor-based pagination (capped at 100 items).

#### Authoritative CaptureSnapshot Payload (Channel 1 Subscription)
```json
{
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "revision": "1425",
  "sequence": "88",
  "enrollment": "ready",
  "meeting": {
    "meeting_session_id": "meet_98f1c2a0-4b12-4d89-9a10-112233445566",
    "recording_mode": "online",
    "processing_state": "live",
    "meeting_title": "Sprint Planning",
    "started_at": "2026-11-09T14:00:00.000Z",
    "duration_ms": 180000
  },
  "categories": [
    {
      "category": "visual_work_observation",
      "consented": true,
      "enabled": true,
      "permission": "granted",
      "activity": "active"
    },
    {
      "category": "contextual_work_application_recognition",
      "consented": true,
      "enabled": true,
      "permission": "granted",
      "activity": "active"
    },
    {
      "category": "personal_history_retention",
      "consented": true,
      "enabled": true,
      "permission": "not_required",
      "activity": "active"
    },
    {
      "category": "organizational_sharing",
      "consented": true,
      "enabled": true,
      "permission": "not_required",
      "activity": "stopped"
    },
    {
      "category": "meeting_transcription",
      "consented": true,
      "enabled": true,
      "permission": "granted",
      "activity": "active"
    },
    {
      "category": "meeting_commitment_extraction",
      "consented": true,
      "enabled": true,
      "permission": "granted",
      "activity": "active"
    }
  ],
  "sources": [
    {
      "source_id": "native_os",
      "health": "ready",
      "activities": [
        { "category": "visual_work_observation", "activity": "active" },
        { "category": "contextual_work_application_recognition", "activity": "active" }
      ],
      "recovery_blocker": null,
      "reason_codes": []
    },
    {
      "source_id": "browser",
      "health": "ready",
      "activities": [
        { "category": "visual_work_observation", "activity": "active" },
        { "category": "contextual_work_application_recognition", "activity": "active" }
      ],
      "recovery_blocker": null,
      "reason_codes": []
    },
    {
      "source_id": "meeting",
      "health": "ready",
      "activities": [
        { "category": "meeting_transcription", "activity": "active" },
        { "category": "meeting_commitment_extraction", "activity": "active" }
      ],
      "recovery_blocker": null,
      "reason_codes": []
    }
  ],
  "employee_paused": false,
  "suspension": null,
  "recovery_blocker": null,
  "policy_state": "valid",
  "policy_version": "pol_rev_20261109_01",
  "notice_version": "not_rev_20261109_01",
  "policy_not_after": "2026-11-10T12:00:00.000Z",
  "source_state": "permitted",
  "reason_codes": []
}
```

#### Channel 2 Query Protocol Messages

1. **`ListHistory` / `SearchHistory` Request:**
```json
{
  "query_id": "qry_8812a0f1",
  "profile_id": "prof_99a8b7c6",
  "source_id": "native_os",
  "search_text": "Quarterly Report",
  "from_utc": "2026-11-09T00:00:00.000Z",
  "to_utc": "2026-11-09T23:59:59.000Z",
  "cursor": null,
  "limit": 50
}
```

2. **`ListHistory` / `SearchHistory` Response:**
```json
{
  "query_id": "qry_8812a0f1",
  "items": [
    {
      "evidence_id": "evi_11223344-5566-7788-99aa-bbccddeeff00",
      "source_id": "native_os",
      "observed_at": "2026-11-09T14:15:22.100Z",
      "retention_deadline": "2026-11-16T14:15:22.100Z",
      "application_id": "com.microsoft.Excel",
      "window_title": "Q3_Financial_Model.xlsx",
      "modality": "snapshot",
      "preview_handle": "local-media://prev_77a8b9c0-1122-3344-5566-778899aabbcc",
      "sanitized_snippet": "Active Cell: C14, Formula: =SUM(C2:C13)"
    }
  ],
  "next_cursor": "cur_141522100_evi11223344",
  "has_more": false
}
```

3. **`PreviewDeletion` Request:**
```json
{
  "command_id": "cmd_preview_del_01",
  "profile_id": "prof_99a8b7c6",
  "scope": "date_range",
  "source_id": "native_os",
  "from_utc": "2026-11-02T00:00:00.000Z",
  "to_utc": "2026-11-05T00:00:00.000Z",
  "evidence_ids": []
}
```

4. **`PreviewDeletion` Response:**
```json
{
  "preview_id": "prv_del_99887766",
  "preview_digest": "sha256-4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123",
  "deletion_generation": "4",
  "signed_verdict_revision": "verdict_rev_104",
  "expires_at": "2026-11-09T14:30:30.000Z",
  "total_selected": 450,
  "eligible_count": 410,
  "blocked_count": 40,
  "blocked_reasons": [
    {
      "reason": "active_legal_hold",
      "hold_id": "hold_litigation_2026_q4",
      "count": 40
    }
  ],
  "affected_queued_shares": 2
}
```

5. **`CommitDeletion` Command (Channel 1):**
```json
{
  "command_id": "cmd_commit_del_01",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "expected_revision": "1425",
  "payload": {
    "preview_id": "prv_del_99887766",
    "preview_digest": "sha256-4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123",
    "confirm_eligible_subset": true
  }
}
```

6. **`CommitDeletion` Response (Channel 1):**
```json
{
  "command_id": "cmd_commit_del_01",
  "status": "acknowledged",
  "revision": "1426",
  "deletion_job_id": "del_job_55443322",
  "stage": "purge_pending",
  "eligible_count": 410,
  "blocked_count": 40
}
```

7. **`GetPurgeStatus` Response (Channel 2):**
```json
{
  "deletion_job_id": "del_job_55443322",
  "stage": "purged",
  "logical_deleted_at": "2026-11-09T14:31:00.100Z",
  "physical_purged_at": "2026-11-09T14:31:02.450Z",
  "selected_count": 450,
  "deleted_count": 410,
  "blocked_count": 40,
  "new_catalog_generation": "gen_00000005-1122-3344-5566-778899aabbcc",
  "receipt_id": "rcpt_purge_88776655"
}
```

### Contract 25: Local Context HUD Interface (`privacy-context.v1`)
The desktop shell host creates a connected Unix domain socketpair (macOS) or anonymous pipe pair (Windows) at launch, hands one descriptor to `oryn-privacy-helper` and the other to `oryn-hud-helper`, verifies both child Authenticode / designated requirements, and closes its own descriptors. This establishes a direct, isolated helper-to-helper byte stream with zero intermediate shell broker overhead.

Wire format: 4-byte big-endian unsigned length prefix followed by UTF-8 JSON. Maximum frame size: 1,048,576 bytes (1 MiB). Bounded in-flight ring buffer: 128 messages or 8 MiB maximum, including eight reserved control slots. Frames exceeding length limit, frames with zero length, invalid UTF-8, or malformed JSON close the link immediately.

Control slots are reserved exclusively for control traffic (`ContextFence`, `ContextGap`, `ContextHello`, `ContextReady`). A privacy fence must never be dropped to admit an observation: if the control reserve cannot carry a fence, the helper closes the link, invalidating HUD state and forcing fresh resynchronization upon reconnection. Observation queue overflow emits one ordered `ContextGap` reporting the dropped sequence interval, discards intermediate deltas, and triggers a fresh permitted baseline request.

Protocol negotiation mandates `protocol_version: "privacy-context.v1"`, `protocol_major: 1`, `protocol_minor: 2`. Both bundled peers require this exact minor. If either endpoint advertises an incompatible version or minor, the link is closed immediately without fallback.

#### Common Wire Envelope
Every message on Contract 25 uses a uniform envelope with typed payload:
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1001-7000-8000-000000000001",
  "correlation_id": null,
  "sequence": "1",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "ContextHello",
  "payload": {
    "client_build": "2026.11.09.1",
    "supported_modalities": ["structured", "snapshot_inferred"],
    "client_nonce": "4a1c7e9b20d34f8a1122334455667788"
  }
}
```

`sequence` is a decimal-string u64 rejecting signs, whitespace, leading zeroes except `"0"`, and overflow. All timestamps use RFC 3339 UTC with a trailing `Z`. Newly originated identifiers are UUIDv4. Upstream opaque identifiers are carried unchanged.

#### 1. `ContextHello` and `ContextReady`
Sent immediately on connection to negotiate protocol minor and session parameters:
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1002-7000-8000-000000000002",
  "correlation_id": "01928374-1001-7000-8000-000000000001",
  "sequence": "1",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "ContextReady",
  "payload": {
    "helper_build": "2026.11.09.1",
    "privacy_revision": "1420",
    "deletion_generation": "4",
    "permitted_modalities": ["structured", "snapshot_inferred"],
    "retention_mode": "retained",
    "source_health": {
      "native_os": "active",
      "browser": "active"
    }
  }
}
```

#### 2. `PermittedObservationV1` (`privacy.observation.v1`)
Transmits privacy-screened application and browser surface facts. Opaque `record_binding_key` values are helper-minted random handles representing exact business entity bindings; they expire with supporting evidence and are null for non-business or uncertified values:
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1003-7000-8000-000000000003",
  "correlation_id": null,
  "sequence": "2",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "PermittedObservationV1",
  "payload": {
    "schema_id": "privacy.observation.v1",
    "event_id": "obs_99887766-1122-3344-5566-778899aabbcc",
    "source_id": "native_os",
    "source_epoch": "src_ep_20261109_001",
    "observation_kind": "baseline",
    "context_revision": "1420",
    "surface_identity": {
      "native_window_id": "win_main_481",
      "native_surface_id": "surf_excel_main_104",
      "surface_generation": "2"
    },
    "application_id": "com.microsoft.Excel",
    "application_profile_id": "prof_app_excel_v1",
    "application_profile_version": "1.0.0",
    "work_context_key": "ctx_finance_invoicing",
    "record_binding_key": "rbk_inv_99882_a1b2c3d4",
    "baseline_complete": true,
    "facts": [
      {
        "fact_id": "fct_01928374-0001",
        "key": "active_cell_formula",
        "value": { "type": "string", "string_val": "=VLOOKUP(A2, Rates!A:B, 2, FALSE)" },
        "provenance": "structured",
        "observed_at": "2026-11-09T14:32:00.120Z",
        "valid_until": "2026-11-09T14:32:30.120Z",
        "evidence_id": "evi_11223344-5566-7788-99aa-bbccddeeff00"
      },
      {
        "fact_id": "fct_01928374-0002",
        "key": "error_code",
        "value": { "type": "string", "string_val": "ERR_TAX_DISCREPANCY_401" },
        "provenance": "structured",
        "observed_at": "2026-11-09T14:32:00.120Z",
        "valid_until": "2026-11-09T14:32:30.120Z",
        "evidence_id": "evi_11223344-5566-7788-99aa-bbccddeeff00"
      }
    ],
    "policy_revision": "pol_rev_20261109_01",
    "consent_revision": "not_rev_20261109_01",
    "input_generation": "1",
    "deletion_generation": "4",
    "acquired_at": "2026-11-09T14:32:00.120Z",
    "volatile_expires_at": "2026-11-09T14:32:30.120Z",
    "retention_expires_at": "2026-11-16T14:32:00.120Z",
    "retention_mode": "retained",
    "evidence_id": "evi_11223344-5566-7788-99aa-bbccddeeff00",
    "gap_reference": null
  }
}
```

#### 3. `ContextFence`
Revokes live context across profile, source, or surface boundaries due to exclusion, pause, deletion, expiration, or retention changes:
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1004-7000-8000-000000000004",
  "correlation_id": null,
  "sequence": "3",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "ContextFence",
  "payload": {
    "fence_id": "fnc_01928374-0001",
    "scope": "surface",
    "affected_source_id": "native_os",
    "affected_surface_id": "surf_excel_main_104",
    "cause": "excluded",
    "privacy_revision": "1421",
    "deletion_generation": "5",
    "revoked_evidence_ids": ["evi_11223344-5566-7788-99aa-bbccddeeff00"],
    "fenced_at": "2026-11-09T14:33:00.000Z"
  }
}
```

#### 4. `ContextGap`
Notifies HUD of observation discontinuities, invalidating intermediate sequence intervals:
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1005-7000-8000-000000000005",
  "correlation_id": null,
  "sequence": "4",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "ContextGap",
  "payload": {
    "source_id": "native_os",
    "surface_id": "surf_excel_main_104",
    "first_lost_sequence": "5",
    "last_lost_sequence": "12",
    "gap_reason": "buffer_overflow",
    "requires_baseline_reset": true
  }
}
```

#### 5. `RequestContextBaseline` and `ContextBaselineResponse`
Requests fresh full baseline for a permitted surface after gap or restart:
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1006-7000-8000-000000000006",
  "correlation_id": null,
  "sequence": "5",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "RequestContextBaseline",
  "payload": {
    "request_id": "req_base_01928374-0001",
    "source_id": "native_os",
    "surface_id": "surf_excel_main_104"
  }
}
```
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1007-7000-8000-000000000007",
  "correlation_id": "01928374-1006-7000-8000-000000000006",
  "sequence": "6",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "ContextBaselineResponse",
  "payload": {
    "request_id": "req_base_01928374-0001",
    "status": "ready",
    "context_revision": "1422",
    "deletion_generation": "5",
    "observation": {
      "schema_id": "privacy.observation.v1",
      "event_id": "obs_99887766-3344-5566-7788-99aabbccdde0",
      "source_id": "native_os",
      "source_epoch": "src_ep_20261109_001",
      "observation_kind": "baseline",
      "context_revision": "1422",
      "surface_identity": {
        "native_window_id": "win_main_481",
        "native_surface_id": "surf_excel_main_104",
        "surface_generation": "3"
      },
      "application_id": "com.microsoft.Excel",
      "application_profile_id": "prof_app_excel_v1",
      "application_profile_version": "1.0.0",
      "work_context_key": "ctx_finance_invoicing",
      "record_binding_key": "rbk_inv_99882_a1b2c3d4",
      "baseline_complete": true,
      "facts": [],
      "policy_revision": "pol_rev_20261109_01",
      "consent_revision": "not_rev_20261109_01",
      "input_generation": "2",
      "deletion_generation": "5",
      "acquired_at": "2026-11-09T14:33:05.000Z",
      "volatile_expires_at": "2026-11-09T14:33:35.000Z",
      "retention_expires_at": "2026-11-16T14:33:05.000Z",
      "retention_mode": "retained",
      "evidence_id": "evi_33445566-7788-99aa-bbcc-ddeeff001122",
      "gap_reference": null
    }
  }
}
```

#### 6. `ResolveBrowserTarget` and `BrowserTargetResult` (Contract 21 Relay)
Relays browser target resolution between HUD and browser extension via the privacy gate:
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1008-7000-8000-000000000008",
  "correlation_id": null,
  "sequence": "7",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "ResolveBrowserTarget",
  "payload": {
    "request_id": "req_tgt_01928374-1234",
    "document": {
      "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
      "browser_instance_id": "ins_12345678-abcd-ef01-2345-6789abcdef01",
      "window_id": 1042,
      "tab_id": 481,
      "frame_id": 0,
      "document_id": "doc_99887766-5544-3322-1100-aabbccddeeff",
      "document_generation": "1"
    },
    "surface_generation": "1",
    "application_profile_id": "prof_app_finance_invoicing_v1",
    "application_profile_version": "1.0.0",
    "target_key": "target_approve_button",
    "context_revision": "1422"
  }
}
```
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1009-7000-8000-000000000009",
  "correlation_id": "01928374-1008-7000-8000-000000000008",
  "sequence": "8",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "BrowserTargetResult",
  "payload": {
    "request_id": "req_tgt_01928374-1234",
    "status": "resolved",
    "target_handle": "hnd_01928374-tgt-approve-btn-250ms",
    "document": {
      "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
      "browser_instance_id": "ins_12345678-abcd-ef01-2345-6789abcdef01",
      "window_id": 1042,
      "tab_id": 481,
      "frame_id": 0,
      "document_id": "doc_99887766-5544-3322-1100-aabbccddeeff",
      "document_generation": "1"
    },
    "surface_generation": "1",
    "tree_version": "1",
    "context_revision": "1422",
    "geometry": {
      "rect": { "x": 620, "y": 450, "width": 120, "height": 40 },
      "display_id": "disp_dell_4k_01",
      "affine_transform": [1.0, 0.0, 0.0, 1.0, 120.0, 80.0],
      "display_layout_generation": "1",
      "binding_generation": "1",
      "ttl_ms": 250
    },
    "reason_code": null
  }
}
```

#### 7. `SubmitHudInference`, `CancelHudInference`, and `HudInferenceResult`
Submits semantic inference requests through the privacy helper edge egress client (Contract 22):
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1010-7000-8000-000000000010",
  "correlation_id": null,
  "sequence": "9",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "SubmitHudInference",
  "payload": {
    "inference_request_id": "inf_req_01928374-0001",
    "purpose": "hud_context_interpretation",
    "schema_id": "hud.context-interpretation.v1",
    "expected_context_revision": "1422",
    "expected_deletion_generation": "5",
    "allowed_candidate_ids": ["pb_tax_reconciliation_v2"],
    "fact_references": ["fct_01928374-0001", "fct_01928374-0002"],
    "deadline_ms": 5000
  }
}
```
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1011-7000-8000-000000000011",
  "correlation_id": null,
  "sequence": "10",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "CancelHudInference",
  "payload": {
    "inference_request_id": "inf_req_01928374-0001",
    "reason": "context_switched"
  }
}
```
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1012-7000-8000-000000000012",
  "correlation_id": "01928374-1010-7000-8000-000000000010",
  "sequence": "11",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "HudInferenceResult",
  "payload": {
    "inference_request_id": "inf_req_01928374-0001",
    "status": "succeeded",
    "context_revision": "1422",
    "deletion_generation": "5",
    "interpretation": {
      "objective": "Resolve ERP invoice tax discrepancy",
      "task_boundary": "invoice_line_item_view",
      "matched_candidate_id": "pb_tax_reconciliation_v2",
      "uncertainty_label": "low",
      "supporting_fact_ids": ["fct_01928374-0002"]
    },
    "error": null
  }
}
```

#### 8. `GetContextHistory` and `ContextHistoryResponse`
Queries sanitized task history within profile retention bounds:
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1013-7000-8000-000000000013",
  "correlation_id": null,
  "sequence": "12",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "GetContextHistory",
  "payload": {
    "query_id": "qry_hist_01928374-0001",
    "expected_deletion_generation": "5",
    "start_time_utc": "2026-11-09T14:00:00.000Z",
    "end_time_utc": "2026-11-09T14:35:00.000Z",
    "cursor": null,
    "limit": 50
  }
}
```
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1014-7000-8000-000000000014",
  "correlation_id": "01928374-1013-7000-8000-000000000013",
  "sequence": "13",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "ContextHistoryResponse",
  "payload": {
    "query_id": "qry_hist_01928374-0001",
    "status": "success",
    "deletion_generation": "5",
    "summaries": [
      {
        "task_id": "tsk_01928374-0001",
        "task_revision": "1",
        "completion_basis": "observed_complete",
        "hypothesis_signature": "sig_invoice_post_tax_fix",
        "acquired_at_utc": "2026-11-09T14:10:00.000Z",
        "ended_at_utc": "2026-11-09T14:14:00.000Z",
        "retention_deadline_utc": "2026-11-16T14:10:00.000Z"
      }
    ],
    "next_cursor": null
  }
}
```

#### 9. Task Summary and Guide Checkpoint Persistence Commands
Saves and retrieves bounded `PrivateTaskSummaryV1` and `GuideCheckpointV1` in screen partition databases:
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1015-7000-8000-000000000015",
  "correlation_id": null,
  "sequence": "14",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "SaveTaskSummary",
  "payload": {
    "command_id": "cmd_sum_01928374-0001",
    "expected_deletion_generation": "5",
    "task_summary": {
      "task_id": "tsk_01928374-0002",
      "task_revision": "1",
      "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
      "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
      "source_epoch": "src_ep_20261109_001",
      "completion_basis": "observed_complete",
      "hypothesis_signature": "sig_invoice_post_tax_fix",
      "source_provenance": "structured",
      "observed_applications": ["com.microsoft.Excel", "com.enterprise.erp"],
      "observed_steps": ["step_check_rate", "step_post_adjustment"],
      "source_evidence_ids": ["evi_11223344-5566-7788-99aa-bbccddeeff00"],
      "gaps_detected": false,
      "acquired_at_utc": "2026-11-09T14:20:00.000Z",
      "ended_at_utc": "2026-11-09T14:24:30.000Z",
      "retention_deadline_utc": "2026-11-16T14:20:00.000Z",
      "input_generation": "1",
      "deletion_generation": "5"
    }
  }
}
```
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1016-7000-8000-000000000016",
  "correlation_id": null,
  "sequence": "15",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "SaveGuideCheckpoint",
  "payload": {
    "command_id": "cmd_chk_01928374-0001",
    "expected_deletion_generation": "5",
    "checkpoint": {
      "checkpoint_id": "chk_01928374-0001",
      "checkpoint_revision": "1",
      "guide_session_id": "gsess_1092a8b",
      "task_id": "tsk_01928374-0002",
      "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
      "playbook_version": "sha256-e9102c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
      "step_cursor": 2,
      "step_ledger": [
        { "step_id": "step_1", "state": "observed_complete" },
        { "step_id": "step_2", "state": "active" }
      ],
      "source_dependency_ids": ["evi_11223344-5566-7788-99aa-bbccddeeff00"],
      "last_safe_action_ref": "act_receipt_001",
      "last_context_binding": "rbk_inv_99882_a1b2c3d4",
      "created_at_utc": "2026-11-09T14:22:00.000Z",
      "updated_at_utc": "2026-11-09T14:23:00.000Z",
      "expires_at_utc": "2026-11-10T14:22:00.000Z",
      "deletion_generation": "5"
    }
  }
}
```
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1017-7000-8000-000000000017",
  "correlation_id": "01928374-1016-7000-8000-000000000016",
  "sequence": "16",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "GuideCheckpointResponse",
  "payload": {
    "command_id": "cmd_chk_01928374-0001",
    "status": "saved",
    "checkpoint_id": "chk_01928374-0001",
    "checkpoint_revision": "1",
    "reason_code": null
  }
}
```
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1018-7000-8000-000000000018",
  "correlation_id": null,
  "sequence": "17",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "GetGuideCheckpoint",
  "payload": {
    "request_id": "req_chk_01928374-0001",
    "expected_deletion_generation": "5"
  }
}
```
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1019-7000-8000-000000000019",
  "correlation_id": null,
  "sequence": "18",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "DeleteGuideCheckpoint",
  "payload": {
    "command_id": "cmd_del_chk_01928374-0001",
    "checkpoint_id": "chk_01928374-0001",
    "expected_deletion_generation": "5"
  }
}
```

#### 10. `DemonstrationProposalV1` Schema (Reverse Stream)
Transmits local synthesized task demonstration proposals for privacy-storage validation before contribution review:
```json
{
  "protocol_version": "privacy-context.v1",
  "protocol_major": 1,
  "protocol_minor": 2,
  "message_id": "01928374-1020-7000-8000-000000000020",
  "correlation_id": null,
  "sequence": "19",
  "organization_id": "org_enterprise_corp",
  "actor_id": "usr_emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "type": "DemonstrationProposalV1",
  "payload": {
    "schema_id": "privacy.demonstration-proposal.v1",
    "proposal_id": "prop_demo_77665544",
    "task_id": "tsk_01928374-0002",
    "observed_completion_basis": "observed_complete",
    "task_measurement": {
      "elapsed_ms": 600000,
      "wait_ms": 120000,
      "basis": "observed_task_boundary",
      "complete_interval": true
    },
    "expected_privacy_revision": "1422",
    "deletion_generation": "5",
    "referenced_evidence_ids": [
      "evi_11223344-5566-7788-99aa-bbccddeeff00"
    ],
    "proposed_retention_expiry": "2026-11-16T14:20:00.000Z",
    "objective": "Reconcile daily invoice adjustments in ERP",
    "steps": [
      {
        "step_index": 1,
        "action_type": "click",
        "target_description": "Post Adjustment button in Invoice screen",
        "sanitized_inputs": {}
      }
    ],
    "variables": [
      {
        "name": "invoice_total",
        "value_label": "<DECIMAL_AMOUNT>"
      }
    ],
    "confidence": "high",
    "gap_detected": false
  }
}
```

##### Shared Demonstration Identity and Measurement Validation
The Privacy Helper mints a fresh random `demonstration_id` (UUIDv4) once for one local Task Instance, organization, and profile. The helper persists the local-task-to-shared-ID mapping alongside source-linked private task metadata only when retention allows. Revisions and separate contributions for the same local Task Instance reuse that ID. Local task IDs, evidence IDs, source epochs, observation timestamps, record identifiers, and reusable employee tracking keys never cross in this field. When personal retention is disabled (`personal_history_retention = false`), this mapping exists strictly within the source's 30-second volatile buffer lifetime; no durable map, shadow payload, or deferred queue is created.

The central attempt identity is `(organization_id, actor_id, device_id, profile_id, demonstration_id)` because device enrollment authenticates its issuer. A demonstration ID reused with a different issuer does not collapse unrelated employees' attempts. Different contribution IDs for this tuple do not increase support. A helper-controlled identifier prevents accidental duplicate submissions; it does not cryptographically prove independent real-world work against a compromised endpoint or deliberate human collusion.

HUD proposes task-level durations via `task_measurement`, but the Privacy Helper validates them against permitted boundaries, source gaps, and monotonic intervals before presenting them during contribution review. The employee reviewer inspects elapsed duration, wait duration, basis (`observed_task_boundary` vs `reviewer_estimate`), and interval completeness before signing the review attestation. Per-step durations are excluded to prevent unconsented granular surveillance.

### LocalExecutionReservationBroker and Joint Modality Reservation (Contracts 11 & 12)

The `LocalExecutionReservationBroker` inside `oryn-privacy-helper` is the single authoritative broker for local execution reservations on the enrolled workstation across both browser and native desktop adapter execution:

1. **Authoritative Reservation Key:**
   The broker maintains exactly one active local reservation record keyed by the 4-tuple:
   $$\text{ReservationKey} = (\text{device\_id}, \text{context}, \text{modality}, \text{epoch})$$
   where `context` is the tagged `ExecutionContextV1`:
   - `job`: Production job `{kind: "job", assignment_id, assignment_epoch}`.
   - `assist`: HUD assist `{kind: "assist", assist_session_id, assist_incarnation}`.
   - `evaluation`: Flight simulator candidate evaluation `{kind: "evaluation", attempt_id, assignment_id, assignment_epoch}` on enrolled lab devices.
   `modality` is strictly `browser` or `native`, and `epoch` is the workstation session epoch.

2. **Modality Mutual Exclusion:**
   Workstation execution is mutually exclusive across all modalities, jobs, assists, evaluations, and profiles. At any time $T$, only one execution context may hold an active local reservation. Any reservation request from a competing job, assist session, evaluation attempt, employee profile, or adapter modality is rejected immediately with a conflict status.

3. **Acquisition & Release Sequence:**
   - **Browser Execution:** When a browser adapter operation requires actuation, the browser bridge broker first requests the common reservation from `LocalExecutionReservationBroker`. Only after obtaining this workstation reservation does the browser bridge issue an `AcquireReservation` command to the browser extension and arm the DNR navigation guard. If extension reservation fails, the common workstation reservation is immediately released.
   - **Native Execution:** When native actuation is dispatched to the supervised worker `oryn-adapter-worker` over `shell-adapter.v1` (major 1, minor 2), the worker obtains the same common workstation reservation from `LocalExecutionReservationBroker`. Native actuation cannot proceed without this active grant.
   - **Fail-Safe Release:** Loss of visibility lease, workstation lock/sleep, employee pause (`PauseCapture` / `PauseScreenObservation`), shell disconnect, window occlusion, or action completion triggers immediate release of the reservation record.

4. **Browser Bridge Negotiation:**
   The broker preserves existing browser wire reservation messages (`AcquireReservation`, `ReleaseReservation`, `HeartbeatReservation`) on Contracts 11 and 12 (`browser-bridge.v1`). Execution requires negotiation of major 1, minor 6 and the explicit capabilities `identity_authority_v1`, `local_execution_reservation_v1`, `execution_reservation_lease_v1`, and `evaluation_execution_v1`. Legacy clients cannot claim joint native/browser execution support and cannot interoperate with unified workstation reservations. All browser action results must return typed `execution_context` (`ExecutionContextV1`).

5. **Observation Buffers & Ephemeral Receipts:**
   - **Content-Free Receipts:** Local execution receipts (`BrowserActionResult`, native action receipts) are content-free metadata envelopes confirming actuation success/failure. They are independent of personal-history retention and do not log or leak captured DOM nodes, element text, or screen pixels.
   - **No Central Observation Transcript:** Raw native or browser observations never become a central execution transcript.
   - **Preparation Buffers:** Observation-derived preparation buffers (e.g., target element coordinates or semantic nodes) reside strictly in volatile memory. When `personal_history_retention=false`, they expire under the strict 30-second volatile ceiling. If an authorized action is not dispatched within 30 seconds of observation acquisition, the buffer is zeroed and fresh target preparation is required.
   - **Distinct Data Classes:** Signed hashes and approval records do not justify retaining captured before-values. API-authorized business inputs remain strictly segregated from employee observation data.

6. **Dedicated Lab Capture and Replay Isolation:**
   Dedicated enrolled lab devices (`identity_simulation_lab_device`) execute browser and native evaluation scenarios under Flight Simulator:
   - Ordinary local privacy retention boundaries apply strictly to lab devices: local captures follow private local retention, capture consent, and review-before-sharing policies.
   - Central simulator replay receives metadata or separately reviewed redacted still excerpts; raw local screen captures are never streamed to central storage merely because the device is designated as a lab.
   - The 30-day simulator replay retention ceiling cannot extend a shorter local private-source or policy deadline. Once local private evidence expires or is deleted, central replay marks the corresponding media unavailable without invalidating surviving independent business verification records.

### Identity Policy Signed Artifacts
The privacy helper relies on cryptographic artifacts signed by `identity-policy` using pinned Ed25519 issuer keys. The signature covers the exact normative preimage: `UTF-8(schema_id) + 0x0A (LF byte) + RFC_8785_Canonical_JSON(payload)`. Signatures are unpadded base64url-encoded strings (86 characters).

#### SignedCapturePolicyLease Schema (`privacy.capture-policy.v1`)
```json
{
  "schema_id": "privacy.capture-policy.v1",
  "key_id": "key_policy_2026_01",
  "payload": {
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "actor_id": "usr_emp_harikeshav_r",
    "device_id": "dev_macbook_pro_m3_001",
    "profile_id": "prf_default_01",
    "enrollment_id": "enr_883a01f9-4b21-4f12-9c10-223344556677",
    "policy_revision": "100",
    "notice_revision": "10",
    "permitted_categories": [
      "screen",
      "audio",
      "accessibility_tree",
      "browser_dom"
    ],
    "mandatory_exclusion_catalog_revision": "cat_excl_v2026_01",
    "excluded_application_ids": [
      "com.1password.1password",
      "com.bitwarden.desktop",
      "KeePass.exe"
    ],
    "excluded_url_patterns": [
      "*://login.microsoftonline.com/*",
      "*://accounts.google.com/*",
      "*://bankofamerica.com/*"
    ],
    "max_raw_retention_days": 14,
    "research_extension_permitted": true,
    "max_offline_seconds": 86400,
    "revocation_generation": "1",
    "issued_at": "2026-11-09T08:00:00Z",
    "not_after": "2026-11-10T08:00:00Z"
  },
  "signature": "dGVzdC1zaWduYXR1cmUtZWQyNTUxOS1jYXB0dXJlLXBvbGljeS1sZWFzZS1leGFtcGxlMDAwMDAwMDAwMDAwMDAwMDAwMDAw"
}
```

#### SignedRetentionVerdict Schema (`privacy.retention-verdict.v1`)
```json
{
  "schema_id": "privacy.retention-verdict.v1",
  "key_id": "key_policy_2026_01",
  "payload": {
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "actor_id": "usr_emp_harikeshav_r",
    "device_id": "dev_macbook_pro_m3_001",
    "profile_id": "prf_default_01",
    "enrollment_id": "enr_883a01f9-4b21-4f12-9c10-223344556677",
    "verdict_revision": "5",
    "scope_coverage": "complete",
    "active_holds": [
      {
        "hold_id": "hold_litigation_2026_q4",
        "description": "Matter 2026-Q4 Legal Hold",
        "from_utc": "2026-11-01T00:00:00Z",
        "to_utc": "2026-11-10T00:00:00Z",
        "affected_sources": ["native_os", "meeting"]
      }
    ],
    "preservation_conflict": false,
    "issued_at": "2026-11-09T12:00:00Z",
    "not_after": "2026-11-10T12:00:00Z"
  },
  "signature": "dGVzdC1zaWduYXR1cmUtZWQyNTUxOS1yZXRlbnRpb24tdmVyZGljdC1leGFtcGxlMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw"
}
```

#### SignedArtifactPolicy Schema (`privacy.artifact-policy.v1`)
```json
{
  "schema_id": "privacy.artifact-policy.v1",
  "key_id": "key_policy_2026_01",
  "payload": {
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "policy_version": "5",
    "allowed_purposes": ["procedural_documentation", "peer_training"],
    "allowed_audiences": ["aud_operations_finance", "aud_team_engineering"],
    "max_lifetime_days": 365,
    "max_dimensions": { "width": 1920, "height": 1080 },
    "max_byte_length": 1048576,
    "max_image_count": 4,
    "issued_at": "2026-11-09T00:00:00Z",
    "not_after": "2026-11-10T00:00:00Z"
  },
  "signature": "dGVzdC1zaWduYXR1cmUtZWQyNTUxOS1hcnRpZmFjdC1wb2xpY3ktZXhhbXBsZTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw"
}
```

#### SignedPrivacyAuthorizationContextV1 Schema (`privacy.authorization-context.v1`)
For governed cloud inference under Contract 22, `InferenceEgressClient` validates current employee consent and signs an ephemeral authorization context binding input scope and manifest hashes:
```json
{
  "schema_id": "privacy.authorization-context.v1",
  "key_id": "key_device_macbook_01",
  "payload": {
    "request_id": "66666666-6666-4666-8666-666666666666",
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "actor_id": "usr_emp_harikeshav_r",
    "device_id": "dev_macbook_pro_m3_001",
    "profile_id": "prf_default_01",
    "purpose": "hud_context_interpretation",
    "operation": "text.reason",
    "consent_revision": "1",
    "notice_revision": "1",
    "input_scope_sha256": "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    "input_manifest_sha256": "1234567812345678123456781234567812345678123456781234567812345678",
    "input_revision": "1",
    "deletion_generation": "1",
    "issued_at": "2026-11-10T15:00:00Z",
    "not_after": "2026-11-10T15:00:05Z"
  },
  "signature": "dGVzdC1zaWduYXR1cmUtZWQyNTUxOS1wcml2YWN5LWF1dGhvcml6YXRpb24tY29udGV4dC1leGFtcGxlMDAwMDAwMDAwMDA="
}
```

---

## Trust and deployment boundaries

### Process Isolation and Execution Permissions
`oryn-privacy-helper` runs strictly in unprivileged user space under the active employee's OS account:
- **Zero Elevated Privileges:** Does not run as `root` (macOS) or `SYSTEM` / Administrator (Windows).
- **Filesystem Permissions:** Private store root is restricted to the current user (POSIX `0700` for directories, `0600` for files; Windows restricted DACL giving access only to the user's SID).
- **Symlink & Reparse Point Rejection:** Helper verifies before opening any database, catalog, or media file that no component of the path is a symlink, hard link, or Windows reparse point. If traversal is detected, storage locks immediately.
- **Backup and Indexing Exclusions:** Helper sets platform-specific flags on the privacy root to prevent inclusion in consumer cloud backups and search indexers:
  - macOS: Sets `NSURLIsExcludedFromBackupKey` on `~/Library/Application Support/Oryn/profiles/<profile_id>/privacy/` to exclude from Time Machine and iCloud Drive.
  - Windows: Sets `FILE_ATTRIBUTE_NOT_CONTENT_INDEXED` on `%LOCALAPPDATA%\Oryn\profiles\<profile_id>\privacy\`.

### Cryptographic Store Architecture (SQLCipher 4)
The evidence store is built on SQLCipher 4, utilizing embedded encrypted SQLite partitions:
- **Encryption Algorithm:** 256-bit AES in CBC mode with HMAC-SHA256 page authentication (`cipher_page_size = 4096`, `kdf_iter = 256000`).
- **Encrypted WAL:** WAL files are encrypted using the identical page-level cipher and authentication parameters.
- **Required PRAGMAs on Open:**
  ```sql
  PRAGMA cipher_memory_security = ON;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = FULL;
  PRAGMA temp_store = MEMORY;
  PRAGMA secure_delete = ON;
  PRAGMA cipher_plaintext_header_size = 0;
  PRAGMA auto_vacuum = INCREMENTAL;
  ```
- **Runtime Integrity Verification:** Keying the database is immediately followed by a read query against `sqlite_master`. If keying fails or HMAC authentication fails, the connection closes immediately. An unreadable database is never opened as plaintext and is never silently deleted or overwritten.
- **Memory Security Limits:** `cipher_memory_security = ON` uses platform memory locking (`mlock` / `VirtualLock`) on cryptographic state within the process. It does not prevent privileged root/admin memory dumps or OS-level kernel hibernation paging.

### Credential Storage & Generation Catalog
Encryption keys are independent random 256-bit byte arrays generated via OS cryptographically secure pseudorandom number generators (`SecRandomCopyBytes` on macOS, `BCryptGenRandom` on Windows). Evidence keys are never derived from employee passwords and never derived from device signing keys.

```
+-------------------------------------------------------------------------------+
| OS Secure Credential Store (macOS Keychain / Windows Credential Manager)     |
| Bound to Current OS User + Oryn Profile                                       |
| Holds exactly one active catalog credential:                                  |
|   { "catalog_generation": UUIDv4, "key": 32-byte AES-256 Master Key }         |
+-------------------------------------------------------------------------------+
                                    |
                                    v Decrypts
+-------------------------------------------------------------------------------+
| key-catalog.<generation>.enc (Encrypted with AES-256-GCM, AAD = gen+profile)   |
| Contains:                                                                     |
|   - Partition manifests (opaque IDs, paths, active generations)               |
|   - Partition encryption keys (independent 256-bit random keys)               |
|   - Schema version marker                                                     |
| Does NOT contain captured content, transcripts, or window titles              |
+-------------------------------------------------------------------------------+
                                    |
                 +------------------+------------------+
                 v                                     v
+---------------------------------+   +---------------------------------+
| screen_<source>_<hour>.db       |   | meeting_<session_id>.db         |
| (SQLCipher 4, Key from Catalog) |   | (SQLCipher 4, Key from Catalog) |
+---------------------------------+   +---------------------------------+
```

- **OS Credential Binding:** The current catalog generation key is stored under:
  - macOS: Keychain Service `com.oryn.privacy.catalog`, Account `<profile_id>`.
  - Windows: Credential Manager target `Oryn/PrivacyCatalog/<profile_id>`.
- **Key Catalog File:** `key-catalog.<generation>.enc` is encrypted with AES-256-GCM. The AAD binds `profile_id`, `catalog_generation`, and schema version. The catalog contains partition identities and their respective independent keys. Old partition keys are purged during rotation.
- **Device Signing Key Separation:** The Ed25519 device key used for signing consent receipts and contribution attestations is held in a separate credential slot (`com.oryn.device.identity`). Signing keys cannot be used to reconstruct storage encryption keys.

---

## Internal architecture

### Partition Topology and Bounded Stores
The evidence store partitions data to ensure fault isolation, crash safety, and bounded blast radius:

```
<profile_root>/privacy/
├── catalog/
│   ├── key-catalog.00000004-1122-3344-5566-778899aabbcc.enc
│   └── key-catalog.00000004-1122-3344-5566-778899aabbcc.sig
├── control/
│   ├── control.db               (Consent, categories, deletion jobs, hold verdicts)
│   └── control.db-wal
├── screen/
│   ├── native_20261109_14.db    (Hourly sealed screen partition)
│   ├── browser_20261109_14.db   (Hourly sealed browser DOM partition)
│   └── ...
├── meetings/
│   ├── meet_98f1c2a0.db         (Unified meeting DB: transcripts, commitments)
│   └── meet_98f1c2a0-audio.opus (Independently encrypted audio blob)
├── media/
│   ├── blob_77a8b9c0.enc        (Encrypted masked PNG chunks)
│   └── ...
└── staging/
    └── .maint_reserve           (256 MiB preallocated maintenance space)
```

1. **Screen Evidence Partitions:** Separated by source (`native_os`, `browser`) and sealed at the earliest of: one UTC clock hour, an active capture-policy or consent revision change, or 8 MiB of structured database content. Sealed partitions become read-only.
2. **Meeting Partitions:** A single meeting session encapsulates audio metadata, raw transcript spans, transcript edits, candidate commitments, and saved commitments in one SQLCipher database (`meet_<session_id>.db`). This enables atomic transactions across transcript revisions and reminder states. Audio is stored in a sibling encrypted media file capped at 4 hours or 128 MiB. A meeting structured database cap of 8 MiB stops acquisition visibly if reached.
3. **Control Store Partition:** Stores employee consent decisions, signed policy leases, active hold verdicts, deletion jobs, content-free audit logs, and release fences.
4. **Capacity Bounds:**
   - Maximum live retained partitions per profile: 1,024.
   - Maximum open database connections: 4 (1 control, 1 active writer, 2 read/sweep connections).
   - Maximum key catalog file size: 1 MiB.
   - Per-profile managed store quota target: 10 GiB.
   - Maintenance reserve: 256 MiB preallocated file (`.maint_reserve`) used exclusively to guarantee purge completion on a full disk.
   - Free-volume admission floor: 1 GiB free disk space required to admit new capture.

### Logical Storage Schemas

#### EvidenceRecord Table (`evidence_records` in screen and meeting partitions)
```sql
CREATE TABLE evidence_records (
    evidence_id TEXT PRIMARY KEY,             -- UUIDv4 string
    event_id TEXT NOT NULL UNIQUE,            -- Upstream source event identifier
    source_id TEXT NOT NULL,                  -- 'native_os' | 'browser' | 'meeting'
    session_epoch TEXT NOT NULL,              -- UUIDv4 supervisor session epoch
    source_epoch TEXT NOT NULL,               -- Source-instance epoch
    surface_id TEXT,                          -- Surface or tab identifier
    surface_generation TEXT,                  -- Decimal string u64
    modality TEXT NOT NULL,                   -- 'structured' | 'snapshot'
    acquired_at_utc TEXT NOT NULL,            -- RFC 3339 UTC timestamp
    acquired_at_mono_ns TEXT NOT NULL,        -- Decimal string u64 boot-monotonic ns
    policy_revision TEXT NOT NULL,            -- Active policy revision string
    consent_revision TEXT NOT NULL,           -- Active consent revision string
    retention_deadline_utc TEXT NOT NULL,     -- RFC 3339 retention deadline
    input_generation TEXT NOT NULL,           -- Decimal string u64 input generation
    deletion_generation TEXT NOT NULL,        -- Decimal string u64 deletion generation
    sanitized_payload TEXT NOT NULL,          -- JSON text (strictly minimized)
    media_blob_id TEXT,                       -- Nullable reference to media_manifests
    state TEXT NOT NULL DEFAULT 'committed',  -- 'committed' | 'tombstoned'
    FOREIGN KEY(media_blob_id) REFERENCES media_manifests(blob_id)
);

CREATE INDEX idx_evidence_retention ON evidence_records(retention_deadline_utc, state);
CREATE INDEX idx_evidence_query ON evidence_records(acquired_at_utc DESC, evidence_id);
```

#### MediaManifest Table (`media_manifests` in screen and meeting partitions)
```sql
CREATE TABLE media_manifests (
    blob_id TEXT PRIMARY KEY,                 -- UUIDv4 media blob identifier
    evidence_id TEXT NOT NULL,                -- Owning evidence record ID
    session_id TEXT NOT NULL,                 -- Owning session or meeting ID
    mime_type TEXT NOT NULL,                  -- 'image/png' | 'audio/opus'
    relative_path TEXT NOT NULL,              -- Opaque relative path (media/blob_<id>.enc)
    plaintext_byte_count TEXT NOT NULL,       -- Decimal string u64
    plaintext_sha256 TEXT NOT NULL,           -- Hex SHA-256 of plaintext
    data_key_enc TEXT NOT NULL,               -- 32-byte key encrypted under partition key
    nonce_prefix TEXT NOT NULL,               -- 4-byte random hex prefix
    chunk_count INTEGER NOT NULL,             -- Number of 1 MiB chunks
    committed_at_utc TEXT NOT NULL            -- RFC 3339 commit timestamp
);
```

#### DeletionJob Table (`deletion_jobs` in control partition)
```sql
CREATE TABLE deletion_jobs (
    job_id TEXT PRIMARY KEY,                  -- UUIDv4 job identifier
    command_id TEXT NOT NULL UNIQUE,          -- Idempotent command ID
    expected_revision TEXT NOT NULL,          -- Decimal string u64
    scope_type TEXT NOT NULL,                 -- 'explicit_ids' | 'date_range' | 'full_personal'
    scope_digest TEXT NOT NULL,               -- SHA-256 digest of frozen selection
    verdict_revision TEXT NOT NULL,           -- Signed retention verdict revision
    deletion_generation TEXT NOT NULL,        -- Decimal string u64
    selected_count INTEGER NOT NULL,
    eligible_count INTEGER NOT NULL,
    blocked_count INTEGER NOT NULL,
    old_catalog_gen TEXT NOT NULL,
    new_catalog_gen TEXT,
    stage TEXT NOT NULL,                      -- 'fenced' | 'rebuilding' | 'committed' | 'purged' | 'failed'
    failure_code TEXT,                        -- Nullable error code string
    created_at_utc TEXT NOT NULL,
    completed_at_utc TEXT
);
```

#### ReleaseFence Table (`release_fences` in control partition)
```sql
CREATE TABLE release_fences (
    contribution_id TEXT PRIMARY KEY,         -- UUIDv4 contribution identifier
    revision TEXT NOT NULL,                   -- Decimal string u64
    canonical_digest TEXT NOT NULL,           -- SHA-256 of canonical contribution payload
    dependent_evidence_ids TEXT NOT NULL,     -- JSON array of referenced private evidence IDs
    fence_state TEXT NOT NULL,                -- 'active' | 'cancelled' | 'released'
    delivery_projection TEXT NOT NULL,        -- 'queued' | 'dispatching' | 'delivered' | 'cancelled' | 'delivery_unknown' | 'withdrawal_requested'
    active_attempt_id TEXT,                   -- UUIDv4 of active attempt in-flight
    dispatch_started_at_utc TEXT,             -- RFC 3339 UTC
    eligibility_not_after TEXT,               -- RFC 3339 UTC or NULL for confirmed obligations
    cancellation_reason TEXT,                 -- 'source_deleted' | 'source_expired' | 'source_changed' | 'sharing_revoked' | 'employee_withdrawal' | 'policy_restricted' | 'session_ended' | 'helper_lost'
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL
);
```

#### TaskSummary Table (`task_summaries` in screen partition)
```sql
CREATE TABLE task_summaries (
    task_id TEXT PRIMARY KEY,                 -- UUIDv4 task identifier
    task_revision TEXT NOT NULL,              -- Decimal string u64
    profile_id TEXT NOT NULL,                 -- Profile identifier
    session_epoch TEXT NOT NULL,              -- UUIDv4 session epoch
    source_epoch TEXT NOT NULL,               -- Source epoch
    completion_basis TEXT NOT NULL,           -- 'observed_complete' | 'employee_reported_complete' | 'incomplete'
    hypothesis_signature TEXT NOT NULL,       -- Deterministic signature or candidate ID
    source_provenance TEXT NOT NULL,          -- 'structured' | 'snapshot_inferred' | 'mixed'
    observed_applications TEXT NOT NULL,      -- JSON array of application IDs (<=128)
    observed_steps TEXT NOT NULL,             -- JSON array of step summaries (<=128)
    source_evidence_ids TEXT NOT NULL,        -- JSON array of referenced evidence UUIDs (<=256)
    gaps_detected INTEGER NOT NULL DEFAULT 0, -- Boolean 0 | 1
    acquired_at_utc TEXT NOT NULL,            -- RFC 3339 start timestamp
    ended_at_utc TEXT NOT NULL,               -- RFC 3339 completion/end timestamp
    retention_deadline_utc TEXT NOT NULL,     -- Earliest supporting evidence retention deadline
    input_generation TEXT NOT NULL,           -- Decimal string u64
    deletion_generation TEXT NOT NULL,        -- Decimal string u64
    state TEXT NOT NULL DEFAULT 'committed'   -- 'committed' | 'tombstoned'
);

CREATE INDEX idx_task_summary_retention ON task_summaries(retention_deadline_utc, state);
CREATE INDEX idx_task_summary_profile ON task_summaries(profile_id, acquired_at_utc DESC);
```

#### GuideCheckpoint Table (`guide_checkpoints` in screen partition)
```sql
CREATE TABLE guide_checkpoints (
    checkpoint_id TEXT PRIMARY KEY,           -- UUIDv4 checkpoint identifier
    checkpoint_revision TEXT NOT NULL,        -- Decimal string u64
    guide_session_id TEXT NOT NULL,           -- UUIDv4 guide session identifier
    task_id TEXT NOT NULL,                    -- UUIDv4 task identifier
    profile_id TEXT NOT NULL,                 -- Profile identifier
    playbook_version TEXT NOT NULL,           -- Immutable playbook version SHA-256
    step_cursor INTEGER NOT NULL,             -- Current active step index
    step_ledger TEXT NOT NULL,                -- JSON array of step states with ack/observed flags
    source_dependency_ids TEXT NOT NULL,      -- JSON array of supporting evidence IDs
    last_safe_action_ref TEXT,                -- Nullable completed action receipt ID
    last_context_binding TEXT NOT NULL,       -- Opaque record binding key and surface tuple
    created_at_utc TEXT NOT NULL,             -- RFC 3339 creation timestamp
    updated_at_utc TEXT NOT NULL,             -- RFC 3339 update timestamp
    expires_at_utc TEXT NOT NULL,             -- Earliest of 24h from start and supporting evidence expiry
    deletion_generation TEXT NOT NULL,        -- Decimal string u64
    state TEXT NOT NULL DEFAULT 'suspended'   -- 'suspended' | 'tombstoned'
);

CREATE INDEX idx_guide_checkpoint_expiry ON guide_checkpoints(expires_at_utc, state);
CREATE INDEX idx_guide_checkpoint_profile ON guide_checkpoints(profile_id, updated_at_utc DESC);
```

### Media Blob Encryption Specification
- Media files are stored in 1 MiB chunks encrypted with AES-256-GCM.
- Each media blob has a unique random 256-bit data key.
- Nonce construction: 96-bit nonce composed of a 32-bit random blob prefix concatenated with a 64-bit big-endian chunk index ($0, 1, \dots$).
- Additional Authenticated Data (AAD): Concatenation of `profile_id`, `blob_id`, `schema_version`, and chunk index.
- Plaintext media is never spooled to disk; frames are compressed and encrypted directly in helper memory before writing to disk.

### Full-Text Search (FTS5) Isolation
- Private text search uses SQLite FTS5 tables local to each partition (`evidence_fts`).
- No global cross-partition plaintext index or embedding index exists on disk.
- Queries execute across relevant open partition connections and merge via newest-first `(observed_at, evidence_id)` keyset paging.
- During selective deletion, the FTS index is not incrementally vacuumed; instead, it is rebuilt entirely from surviving rows in a new partition database to ensure zero residual virtual-table shadow data leaks.

---

## State and lifecycle

### The Selective Deletion Algorithm
Selective erasure must withstand crashes, power loss, and partial writes without leaking deleted records or corrupting unaffected partitions:

```
+-------------------------------------------------------------------------------+
| Step 1: Control Transaction & Logical Fence                                  |
| - Verify signed retention verdict.                                            |
| - Insert DeletionJob with stage = 'fenced'.                                   |
| - Advance deletion_generation.                                                |
| - Mark matching ReleaseFences as 'cancelled'.                                 |
| - Return logical acknowledgement (stage = 'purge_pending').                   |
+-------------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------------+
| Step 2: Partition Rebuild (Under Partition Writer Lock)                       |
| - Open fresh database file (partition.db.rebuild) under fresh random key.      |
| - Copy surviving non-deleted rows and held rows.                              |
| - Copy surviving media encryption keys to new DB.                             |
| - Rebuild FTS5 index from surviving rows.                                     |
| - fsync new partition file and directory.                                     |
+-------------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------------+
| Step 3: Catalog Publication Staging                                           |
| - Verify deletion_generation has not changed concurrently.                    |
| - Generate fresh 256-bit catalog key and new catalog_generation UUID.         |
| - Write key-catalog.<new_gen>.enc with new partition key and surviving keys.  |
| - fsync new catalog file.                                                     |
+-------------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------------+
| Step 4: Generation Commit Point (Atomic OS Credential Update)                |
| - Atomically write { new_catalog_generation, new_catalog_key } to Keychain /  |
|   Windows Credential Manager.                                                 |
| - Verify readback from credential store.                                      |
| - THIS IS THE GENERATION COMMIT POINT.                                        |
+-------------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------------+
| Step 5: Obsolete Generation Teardown & Receipt                                |
| - Close old database reader connections.                                      |
| - Zero old in-memory keys and buffers.                                        |
| - Unlink old partition database, WAL, and deleted media blobs.                |
| - Remove old key-catalog.<old_gen>.enc.                                       |
| - Mark DeletionJob stage = 'purged'.                                          |
| - Sign PurgeReceipt with Ed25519 device key and return to caller.             |
+-------------------------------------------------------------------------------+
```

### Crash Recovery Semantics at Every Publication Boundary
- **Crash before Step 4:** Startup reads the existing catalog credential. The old catalog is decrypted. Startup detects an uncommitted `DeletionJob` in stage `fenced` or `rebuilding`. The deny fence remains authoritative: deleted IDs remain inaccessible. Startup removes temporary `.rebuild` files and re-runs Step 2 onward.
- **Crash during Step 4 (Ambiguous Credential Write):** Startup reads the credential store. If the stored generation matches `new_catalog_generation`, startup rolls forward to Step 5. If it matches `old_catalog_generation`, startup re-runs the rebuild. If the credential store returns an unresolvable or corrupted state, storage transitions to `PRIVACY_STORE_LOCKED` and requires administrative device verification; it never falls back to unencrypted or plaintext mode.
- **Crash after Step 4:** Startup reads `new_catalog_generation`. Old database files and unlinked media cannot be decrypted by the active catalog. Startup unlinks orphaned old files and completes Step 5.

### Supported Uninstallation Semantics
1. The desktop shell supervisor dispatches `PrepareUninstall` over Channel 1.
2. `RetentionCoordinator` evaluates the active `SignedRetentionVerdict`.
3. If an active legal hold is present or the retention verdict is expired/unknown, uninstallation aborts with status `blocked`, returning the blocking hold details. No files are deleted.
4. If no holds apply, `CaptureGate` terminates all observation workers and locks capture.
5. `RetentionCoordinator` destroys the OS catalog credential and unlinks all partitions, catalogs, media blobs, and preferences.
6. A signed `PurgeReceipt` with `scope = "full_personal"` is emitted, and the helper returns `ready` to the shell.

---

## Error and edge-case behavior

### Local Privacy Error Codes
The component defines explicit error codes over Channel 1, Channel 2, and Contract 25. Established Contract 22 inference errors and shell reason codes remain intact.

| Error Code | Trigger Condition | Subsystem Action | Client Recovery |
|---|---|---|---|
| `PRIVACY_INVALID_ARGUMENT` | Malformed JSON, out-of-range bounds, or invalid UUID. | Rejects message immediately. | Client fixes payload format. |
| `PRIVACY_POLICY_INVALID` | Capture policy signature fails or schema version mismatched. | Rejects lease; halts capture. | Shell requests fresh policy from identity service. |
| `PRIVACY_POLICY_EXPIRED` | Lease `not_after` elapsed (> 24 hours offline). | Revokes source permits; enters `policy_expired`. | Reconnect to enterprise network; deliberate resume. |
| `PRIVACY_CLOCK_UNTRUSTED` | System clock rolled back behind monotonic trusted anchor. | Halts capture; denies history reads. | Restore NTP synchronization. |
| `PRIVACY_CONSENT_REQUIRED` | Capture command received for unconsented category. | Rejects command. | Employee completes notice consent in UI. |
| `PRIVACY_EXCLUDED` | Targeted surface matches mandatory or user exclusion. | Drops frame; emits gap record. | Safe background windows continue. |
| `PRIVACY_STALE_GENERATION` | Command carries mismatched `expected_revision`. | Rejects mutation; returns current revision. | Client resynchronizes state and retries. |
| `PRIVACY_STORE_LOCKED` | Credential store unavailable or store in teardown. | Denies storage access; capture paused. | Verify OS user session; unlock workstation. |
| `PRIVACY_STORE_CORRUPT` | SQLCipher HMAC authentication or page read failure. | Closes store; halts capture; does not reset. | Quarantine corrupt file; inspect diagnostics. |
| `PRIVACY_STORAGE_FULL` | Managed store exceeds 10 GiB or disk space < 1 GiB. | Purges expired; if still full, stops capture. | Employee purges history or frees disk space. |
| `PRIVACY_HISTORY_DISABLED` | Durable query/save received while retention is off. | Rejects durable read/write. | Operate in volatile ephemeral mode. |
| `PRIVACY_HOLD_ACTIVE` | Deletion or uninstall attempted on record under legal hold. | Rejects deletion; reports blocked count. | Wait for legal hold release. |
| `PRIVACY_HOLD_UNKNOWN` | Retention verdict missing, unverifiable, or expired. | Blocks voluntary deletion and uninstall. | Connect to network to refresh hold verdict. |
| `PRIVACY_PREVIEW_STALE` | Deletion commit digest mismatches current state. | Rejects commit; invalidates preview. | Generate fresh preview and re-confirm. |
| `PRIVACY_NOT_FOUND` | Referenced evidence ID or blob ID does not exist. | Returns empty result. | Invalidate stale UI handles. |
| `PRIVACY_BUSY` | Concurrent destructive deletion job already in progress. | Rejects second deletion command. | Await completion of active deletion job. |
| `PRIVACY_PURGE_PENDING` | History read requested while partition rebuild is active. | Returns read data excluding fenced records. | Retry after purge completion. |
| `PRIVACY_IO_FAILED` | Filesystem write error or disk hardware failure. | Aborts write; marks store degraded. | Check filesystem health and permissions. |
| `PRIVACY_ARTIFACT_POLICY_REQUIRED`| Still-image review attempted without valid artifact policy. | Rejects image sharing; permits text review. | Provision valid organizational artifact policy. |
| `PRIVACY_ARTIFACT_TOO_LARGE` | Redacted image exceeds 1920x1080 or 1 MiB. | Rejects image artifact. | Crop image or reduce capture region. |
| `PRIVACY_MEMORY_UNAVAILABLE` | Memory locking (`mlock`) fails for volatile buffer. | Suppresses ephemeral extraction; stops capture. | Check OS memory limits. |

### Edge Case Handling

#### Deletion Racing Dispatched Network Upload
If an employee deletes private evidence while a previously approved contribution referencing that evidence is in-flight:
1. The control store transaction immediately marks the corresponding `ReleaseFence` as `cancelled` with `cancellation_reason = 'source_deleted'`.
2. The local purge completes independently and immediately without waiting for network I/O.
3. If the upload cannot be aborted before bytes cross the wire, the delivery projection is marked `delivery_unknown`.
4. Upon receiving a delivery acknowledgment or during reconnection reconciliation, the helper does not re-upload the deleted source; instead, it marks the contribution as `withdrawal_requested` and issues a metadata-only withdrawal request (`SubmissionClosureRequestV1`) to the control plane.
5. If the server durably accepted the contribution before the source's natural expiration or deletion, that prior acceptance remains valid and delivered. Natural expiry of underlying local sources for an already accepted contribution never automatically retracts organizational knowledge.
6. When `personal_history_retention=false`, screen-derived contributions bypass durable transport capsules and offline queue storage; approved bytes reside strictly in locked volatile memory bounded by the source's 30-second deadline. Expiration destroys the buffer without durable trace.

#### Offline Operation and Policy Lease Expiration
- Observation may continue offline only within the unexpired duration of `SignedCapturePolicyLease` (maximum 24 hours from issuance).
- Upon reaching `not_after`, `CaptureGate` revokes permits immediately, transitions `CaptureSnapshot.policy_state = "expired"`, and sets `recovery_blocker = "policy_expired"`.
- When connectivity returns and a renewed lease is verified, capture **does not resume automatically**. Intentional employee resumption via `ResumeCapture` is strictly required.

---

## Observability and audit

### Content-Free Audit Event Logging
All privacy-critical mutations produce tamper-evident audit records in the `audit_events` table within the control partition. Audit logs record administrative, security, and consent lifecycle changes without ever recording captured business content, window titles, URLs, keystrokes, pixels, or audio:

```sql
CREATE TABLE audit_events (
    audit_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    session_epoch TEXT NOT NULL,
    occurred_at_utc TEXT NOT NULL,
    policy_revision TEXT NOT NULL,
    details TEXT NOT NULL
);
```

#### Monitored Audit Event Types
- `consent.category_changed`: Category toggled, notice accepted, or consent withdrawn.
- `policy.lease_adopted`: New `SignedCapturePolicyLease` verified and activated.
- `policy.verdict_evaluated`: Signed retention verdict evaluated for legal holds.
- `evidence.retention_purged`: Scheduled sweep permanently purged expired partitions.
- `evidence.deletion_committed`: Employee committed selective or full deletion.
- `evidence.purge_completed`: Physical key destruction and file unlinking finished.
- `contribution.reviewed`: Employee approved or declined workflow contribution.
- `security.store_locked`: Cryptographic store locked due to credential or clock failure.

### Diagnostic Telemetry Scrubbing
Diagnostic telemetry emitted by `oryn-privacy-helper` to platform loggers or crash collectors strictly enforces:
- Prohibited in Logs: Frame hashes, OCR strings, accessibility tree values, application window titles, file paths outside the Oryn sandbox, employee names, customer IDs, and encryption keys.
- Permitted in Logs: Error codes, latency percentiles (p50, p95), memory RSS totals, active partition counts, database page counts, permit renewal durations, and watchdog status.

---

## Security and threat model

### Threat Vectors and Mitigations

```
+------------------------------------------------------------------------------------+
| Threat: Local Database Extraction                                                  |
| Attack: Malicious user-space process attempts to read evidence files on disk.      |
| Mitigation: SQLCipher 4 AES-256-CBC encryption with HMAC-SHA256 page auth. Keys   |
| held in OS Keychain / Credential Manager. File permissions 0700/0600.             |
+------------------------------------------------------------------------------------+
                                    |
+------------------------------------------------------------------------------------+
| Threat: Manager Surveillance Request                                               |
| Attack: Admin uses central API to request raw employee screen/audio timeline.      |
| Mitigation: No remote raw timeline retrieval API exists. Raw evidence never leaves |
| the workstation. Voluntary sharing requires employee Ed25519 signed review.       |
+------------------------------------------------------------------------------------+
                                    |
+------------------------------------------------------------------------------------+
| Threat: In-Memory Key & Frame Scraping                                             |
| Attack: Local process scrapes RAM for decrypted frame buffers or database keys.    |
| Mitigation: cipher_memory_security = ON locks key memory; owned frame buffers are |
| zeroed immediately after slot release; unprivileged process isolation.              |
+------------------------------------------------------------------------------------+
                                    |
+------------------------------------------------------------------------------------+
| Threat: Prompt Injection / Secret Egress                                           |
| Attack: Hidden screen text instructs AI model to exfiltrate private credentials.   |
| Mitigation: Deterministic regex and structural masking executed before model        |
| egress; inference is transient with contractual zero content retention.            |
+------------------------------------------------------------------------------------+
```

### Residual Risks and Explicit Non-Claims
1. **Compromised OS Kernel / Rootkit:** If an attacker gains kernel privileges or administrative root access on the employee workstation, they can inspect process memory, hook graphics compositors, or bypass file permissions. Oryn does not claim protection against a fully compromised host OS kernel.
2. **Forensic Storage Remanence:** In accordance with modern solid-state drive (SSD) wear-leveling algorithms, unlinking an encrypted file or issuing `secure_delete` does not guarantee physical sector overwrite on NAND flash. Security rests on cryptographic key destruction: destroying the partition key and rotating the catalog renders residual flash blocks permanently unreadable ciphertext.
3. **OS-Level Hibernation & Crash Dumps:** Operating system crash dumps (`core` files or `MEMORY.DMP`) or OS hibernation files (`hiberfil.sys`) can capture physical RAM to disk. Oryn configures core dump suppression (`setrlimit(RLIMIT_CORE, 0)`) where supported, but cannot override enterprise-wide OS crash collection policies.

---

## Test strategy

### Normative Acceptance Scenarios
The following 20 acceptance scenarios define the normative test specification for Component 5. All scenarios are **specified, not executed** in this documentation phase.

#### PRIV-TEST-01: Exclusion Enforcement with Permitted Background
- **Condition:** Employee switches focus to an excluded application (`1Password`) while an approved document (`Excel`) is visible in the background.
- **Expected Result:** `CaptureGate` revokes permits for the foreground window; no frames or metadata from `1Password` are acquired or stored; Excel background observation continues under certified occlusion subtraction; companion displays "Approved windows observed; foreground excluded".
- **Traceability:** PRODUCT.md §31.1 (ORY-003, ORY-005).

#### PRIV-TEST-02: Missing Visibility Lease Cutoff
- **Condition:** Desktop shell supervisor crashes or misses visibility lease renewals for > 500 ms while screen capture is active.
- **Expected Result:** Helper's internal watchdog revokes all source permits within 500 ms; in-flight shared-memory frame slots are invalidated; capture halts immediately; companion status transitions to "Attention Needed".
- **Traceability:** PRODUCT.md §31.1 (ORY-003, ORY-004).

#### PRIV-TEST-03: Shared-Memory Frame Verification Failure
- **Condition:** Native observer worker signals an 8 MiB frame slot where declared masked regions do not equal opaque-black BGRA `(0,0,0,255)` or the SHA-256 digest mismatches.
- **Expected Result:** Helper rejects the frame; zero bytes are written to storage or egressed to inference; slot is zeroed and quarantined; helper logs an extraction error and emits an `ObservationGap`.
- **Traceability:** PRODUCT.md §31.1 (ORY-005), TECHNICAL.md §4.2.

#### PRIV-TEST-04: Volatile Ephemeral Mode (Retention Off)
- **Condition:** Screen observation is active with `personal_history_retention=false`. Frame is acquired at time $T$.
- **Expected Result:** Frame is processed in volatile memory with a strict 30-second TTL ($T+30$ s); zero disk writes occur in `screen/`; memory buffers are zeroed; no deferred upload queue is maintained; previously retained historical records keep their original deadlines.
- **Traceability:** PRODUCT.md §25.1, §31.1 (ORY-005, ORY-009).

#### PRIV-TEST-05: Default Retention Expiration Sweep
- **Condition:** Local raw screen evidence reaches day 8 under default 7-day retention setting.
- **Expected Result:** Background retention sweep purges day 1 partition files and encryption keys; My Privacy displays updated retention bounds; zero records from day 1 can be decrypted or queried.
- **Traceability:** PRODUCT.md §31.1 (ORY-009, ORY-010).

#### PRIV-TEST-06: Future-Only Retention Policy Extension
- **Condition:** Employee changes retention preference from 3 days to 7 days.
- **Expected Result:** Evidence acquired prior to the change expires on its original 3-day deadline; only evidence acquired after the policy update receives the 7-day deadline; expired records are never resurrected.
- **Traceability:** PRODUCT.md §25.4, §31.1 (ORY-009).

#### PRIV-TEST-07: Immediate Retention Shortening
- **Condition:** Employee shortens retention preference from 7 days to 2 days.
- **Expected Result:** All retained evidence older than 2 days becomes immediately inaccessible via queries and is scheduled for immediate selective purge on the next sweep.
- **Traceability:** PRODUCT.md §25.4, §31.1 (ORY-009).

#### PRIV-TEST-08: Legal Hold Blocking Voluntary Deletion
- **Condition:** Employee attempts to delete history covering a date range subject to an active signed legal hold.
- **Expected Result:** `PreviewDeletion` reports exact blocked count and hold ID; `CommitDeletion` deletes only eligible non-held records; held records remain preserved within their existing retention deadline; hold does not extend retention past raw expiry.
- **Traceability:** PRODUCT.md §25.4, §31.1 (ORY-009).

#### PRIV-TEST-09: Unknown Hold Verdict Offline Blocking Deletion
- **Condition:** Workstation is offline; employee requests full history deletion, but `SignedRetentionVerdict` is expired (> 24 hours) or absent.
- **Expected Result:** Helper returns `PRIVACY_HOLD_UNKNOWN` and rejects voluntary deletion; all data remains intact until a verified verdict is obtained upon reconnection.
- **Traceability:** PRODUCT.md §25.4, §31.1 (ORY-009).

#### PRIV-TEST-10: Untrusted Clock Rollback Protection
- **Condition:** System clock is manually rolled back 10 days behind the persisted trusted-time high-water mark.
- **Expected Result:** Helper transitions state to `PRIVACY_CLOCK_UNTRUSTED`; halts capture; blocks all history reads and previews; capture does not resume until trusted time is restored.
- **Traceability:** PRODUCT.md §25.4, TECHNICAL.md §11.5.

#### PRIV-TEST-11: Post-Offline Cleanup on Day-Eight Startup
- **Condition:** Device is powered off on day 6 and powered on day 9 without network connectivity.
- **Expected Result:** On startup, helper runs overdue retention sweeps before enabling history queries; day 1 and 2 records are purged; UI accurately reflects `last_cleanup_at` and does not claim cleanup occurred while powered off.
- **Traceability:** PRODUCT.md §31.1 (ORY-009, ORY-010).

#### PRIV-TEST-12: Managed Store Capacity Limit (Storage Full)
- **Condition:** Managed store exceeds 10 GiB and available disk space drops below 1 GiB.
- **Expected Result:** Helper executes immediate purge of expired records; if space remains full, active screen and meeting capture halt; helper emits `PRIVACY_STORAGE_FULL`; no early eviction of unexpired records occurs; companion prompts user recovery.
- **Traceability:** PRODUCT.md §25.4, TECHNICAL.md §12.

#### PRIV-TEST-13: Crash Recovery at Generation Commit Point
- **Condition:** Power loss occurs during Step 4 of selective deletion, before OS credential write finishes.
- **Expected Result:** On reboot, helper detects old catalog generation with an uncommitted `DeletionJob`; re-verifies deny fence; re-executes partition rebuild; successfully commits new catalog; no deleted records leak.
- **Traceability:** PRODUCT.md §25.4, TECHNICAL.md §10.3.

#### PRIV-TEST-14: Residual Flash Ciphertext Invalidation
- **Condition:** Attacker inspects raw NAND flash sectors for deleted partition data.
- **Expected Result:** Old partition encryption keys were destroyed from the catalog and zeroed in RAM; residual flash blocks consist entirely of cryptographically strong AES-256 ciphertext without usable keys.
- **Traceability:** PRODUCT.md §25.4, TECHNICAL.md §10.3.

#### PRIV-TEST-15: Meeting Source Expiry vs. Saved Commitment
- **Condition:** Meeting audio and raw transcripts reach their 7-day retention deadline, but a confirmed action item was saved as a personal task.
- **Expected Result:** Audio blob and raw transcript spans are purged; the saved task survives with `evidence_status = "unavailable"`; reminders continue to function; full personal purge deletes the task.
- **Traceability:** PRODUCT.md §31.2 (ORY-021), [meeting-intelligence.md](meeting-intelligence.md).

#### PRIV-TEST-16: Stale Local Preview Handle Revocation
- **Condition:** Renderer attempts to fetch a thumbnail using a `local-media://` handle after the evidence record was deleted or 30 seconds elapsed.
- **Expected Result:** Helper rejects request with HTTP 404 / `PRIVACY_NOT_FOUND`; arbitrary filesystem path traversal is blocked.
- **Traceability:** PRODUCT.md §31.1 (ORY-006, ORY-010).

#### PRIV-TEST-17: Redacted Still-Image Excerpt Sharing
- **Condition:** Employee reviews a workflow candidate and includes a cropped screen still-image with an account number masked.
- **Expected Result:** Image is re-encoded as a metadata-stripped PNG <= 1920x1080 and <= 1 MiB; opaque black mask covers account number; final review displays exact image; Ed25519 review attestation binds image SHA-256; original raw screenshot remains private.
- **Traceability:** PRODUCT.md §25.5, §31.1 (ORY-007).

#### PRIV-TEST-18: Deletion Racing Queued Share
- **Condition:** Contribution is queued in `contribution-sync` while offline; employee deletes the underlying raw screen evidence.
- **Expected Result:** Control store immediately sets `ReleaseFence` to `cancelled`; sync queue drops the upload; no outgoing network transmission occurs upon reconnection.
- **Traceability:** PRODUCT.md §25.5, §31.1 (ORY-007, ORY-009).

#### PRIV-TEST-19: Supported Client Uninstallation with Hold Block
- **Condition:** Employee triggers application uninstallation while an active legal hold applies.
- **Expected Result:** Helper aborts cleanup, returns `PrepareUninstall` status `blocked` with hold details; protected evidence remains intact; uninstallation cannot proceed silently.
- **Traceability:** PRODUCT.md §25.4, §31.7 (ORY-069).

#### PRIV-TEST-20: Cloud Inference Cancellation on Capture Pause
- **Condition:** Visual extraction inference request is in-flight via LiteLLM; employee clicks "Pause Screen Observation".
- **Expected Result:** `InferenceEgressClient` immediately aborts the HTTP request; any late response arriving after pause is discarded and not committed to history.
- **Traceability:** PRODUCT.md §31.9 (ORY-071, ORY-073).

---

## Performance and operations

### Operational Budgets and Certification Targets
All metrics listed below are **certification targets to be verified during performance qualification**, not measured platform benchmarks:
- **Source Permit Issuance/Renewal Latency:** Issued every 100 ms; p95 latency < 5 ms.
- **Visibility Lease Cutoff Latency:** Watchdog timeout strictly enforced at 500 ms; p99 cutoff < 505 ms.
- **Employee Pause p95 Latency:** Control gate halts permit issuance within < 10 ms; durable pause written within < 100 ms.
- **Volatile In-Memory Processing Ceiling:** Strict 30-second TTL enforced by monotonic timer; memory zeroing completed within < 5 ms after extraction.
- **Channel 2 Keyset Paging:** 50-item history page retrieved within < 25 ms across 10 open partition databases.
- **Shared-Memory Frame Slot Copy:** Copying 8 MiB BGRA8 frame and calculating SHA-256 takes < 8 ms on target hardware (Apple M-series or Intel Core i7 11th Gen+).
- **Storage Consumption Caps:** Maximum 10 GiB per profile; 256 MiB maintenance reserve; 1 GiB free-volume admission floor.

### Storage Maintenance and Upgrades
- **Automatic WAL Checkpointing:** Partitions execute `PRAGMA wal_checkpoint(PASSIVE)` during idle capture gaps and `PRAGMA wal_checkpoint(TRUNCATE)` upon hourly partition sealing.
- **Background Retention Sweeper:** Runs low-priority cleanup sweeps once per minute while the helper process is active.
- **Schema Migration Strategy:** Database schemas carry a `schema_version` in their metadata table. Forward schema migrations execute in a fresh generation database during startup; downgrade into an older unsupported schema is prohibited and transitions the store to `PRIVACY_STORE_LOCKED`.

---

## Architecture decisions and open questions

### Resolved Architecture Decisions
1. **Embedded Database Engine:** SQLCipher 4 selected over LevelDB, RocksDB, or raw SQLite. Provides transparent AES-256-CBC page encryption, authenticated WAL journals, FTS5 virtual table support, and robust ACID transaction guarantees.
2. **Encryption Key Hierarchy:** Independent random 256-bit keys per partition managed via an encrypted generation catalog (`key-catalog.<generation>.enc`), anchored by a single catalog credential stored in macOS Keychain or Windows Credential Manager. Device signing keys are kept strictly separate from storage encryption keys.
3. **Legal Hold Precedence:** Legal holds prevent voluntary employee deletion within the configured raw retention period, but cannot extend retention beyond the original raw deadline and cannot grant remote manager playback access.
4. **Capacity Exhaustion Strategy:** Storage quota exhaustion halts capture visibly and prompts user action; it never evicts unexpired records early and never silently drops to unencrypted ephemeral mode.

### Subsystem Handoff Answers (TECHNICAL.md §14.2)
1. **Owns exclusively:** Authoritative capture consent enforcement, source permit issuance, raw screen/audio encrypted storage, SQLCipher partition lifecycle, retention sweeping, crash-safe selective purge, `ReviewedContributionV1` signing, and `InferenceEgressClient` token attachment.
2. **Data ingress/egress:** Ingress via Channels 1–4, `os-observation.v1`, and native audio pipes; egress via Contract 2 (`contribution.approved_for_sharing`), Contract 22 (`InferenceRequest` over TLS 1.3), and Contract 25 (`privacy-context.v1`). Zero raw media egresses to central organizational dashboards.
3. **Versions and identities:** Profile ID, enrollment ID, `session_epoch`, `source_epoch`, `surface_generation`, `input_generation`, `deletion_generation`, `catalog_generation`, and policy revision.
4. **Upstream failure handling:** Observation worker crash isolates to affected source (`native_os`, `browser`, `meeting`); healthy sources continue; helper marks affected source degraded/unavailable with recovery blocker; emits gap marker to HUD.
5. **Authority boundary:** Employee is authoritative for local retention choices (1–14 days), voluntary deletion, sharing review, and pause. Organization is authoritative for mandatory exclusions, maximum retention cap, legal hold verdicts, and artifact policy. Denial always wins.
6. **Testing without private details:** Verified using synthetic test fixtures with mock PII, fake application IDs, deterministic mock clocks, and synthetic frame buffers.
7. **Audit and duplicate prevention:** Idempotent command envelope (`command_id`, `expected_revision`), Ed25519 signed consent and review receipts, signed purge receipts, and monotonic sequence numbers.
8. **Failure blast radius:** Helper crash or storage corruption halts local observation within 500 ms, keeps private storage locked, and fails closed without leaking private data.
9. **v1.0 criteria enablement:** Enables ORY-002, ORY-003, ORY-004, ORY-005, ORY-006, ORY-007, ORY-008, ORY-009, ORY-010, ORY-021, ORY-068, ORY-069, ORY-070, ORY-071, ORY-072, ORY-073, ORY-074, ORY-075, and ORY-076.
