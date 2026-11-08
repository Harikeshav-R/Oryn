# Desktop Shell and User Experience Host Component Brief

Status: Detailed technical specification — implementation pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§4.1, 4.7, 13.2](../../TECHNICAL.md) | [PRODUCT.md §§7–8, 12, 24–25, 30; ORY-002–004, ORY-010](../../PRODUCT.md)

### Core Responsibility
The Desktop Shell is the installed Windows and macOS application that exposes user enrollment, visible observation state, employee controls, personal task history, notifications, contextual guidance hosting, and approved local execution interfaces. It serves as the primary native host and human-in-the-loop interaction boundary for Oryn on employee workstations.

### Owns
- Desktop-level application session lifecycle, system tray/menu-bar presence, and movable native capture status surfaces across supported OS platforms.
- Clear employee visibility into local observation status, ensuring the recording state is never concealed or ambiguous.
- User controls for toggling, pausing, and resuming capture streams, including global keyboard shortcuts and quick-pause buttons.
- The presentation host for local assistance, task context, native click-through highlights, notification surfaces, and human-in-the-loop approval dialogs.
- Local application UI preferences, window positioning, and cached enrollment markers.
- Supervision, lifecycle management, and visibility lease renewal for unprivileged child helper processes.

### Consumes
- Authoritative capture state snapshots, consent records, and exclusion status from [local-privacy-storage](local-privacy-storage.md).
- Structured active task guidance cards, highlight geometries, and candidate summaries from [local-context-hud](local-context-hud.md).
- Permitted published guidance, peer resolutions, and rule definitions via [contribution-sync](contribution-sync.md).
- Job assignments, approval requests, and notifications dispatched from [control-plane](control-plane.md) and [command-center-analytics](command-center-analytics.md).
- Application compatibility and capability reports from [os-observation](os-observation.md).
- User authentication and role-scoped action permissions from [identity-policy](identity-policy.md).

### Produces
- Validated employee capture commands (`PauseCapture`, `ResumeCapture`, `SetCaptureCategory`, `RecordCaptureConsent`) directed to [local-privacy-storage](local-privacy-storage.md).
- Periodic ephemeral visibility lease renewals (`RenewVisibilityLease`) and session lifecycle transitions (`SetSessionState`) directed to [local-privacy-storage](local-privacy-storage.md).
- Employee review decisions and sanitization approvals for proposed task contributions (`ReviewContribution`).
- Employee interactions with guided workflows (`GuidanceInteraction`) returned to [local-context-hud](local-context-hud.md).
- Supervised action confirmations and approval responses (`SubmitApproval`) directed to [identity-policy](identity-policy.md) and [control-plane](control-plane.md).

### Does Not Own
- Authoritative consent evaluation, capture policy validation, raw media retention, redaction algorithms, or disk evidence stores (owned exclusively by [local-privacy-storage](local-privacy-storage.md)).
- Task hypothesis matching, signature ranking, fatigue heuristics, guide progression tracking, or execution planning (owned exclusively by [local-context-hud](local-context-hud.md)).
- Authoritative organizational capability models or playbook publication (owned by [operational-graph](operational-graph.md)).
- Organization-wide policy definition, role assignment, central token issuance, or central identity (owned by [identity-policy](identity-policy.md)).
- Independent business outcome verification (owned by [outcome-verification](outcome-verification.md)).
- Autonomous execution of privileged or consequential actions (delegated to authorized runtime executors).

### Boundary Requirement
Closing or disconnecting the desktop shell window must not silently change user consent or cause invisible observation. If the main UI window is dismissed, background capture may continue only if the employee has explicitly enabled background observation and the native status badge remains visible on an active desktop with an active visibility lease. The desktop shell does not execute privileged actions directly; it presents validated proposals and relays human decisions across typed interfaces.

## Product requirements

### Traceability Matrix

The Desktop Shell directly presents or participates in verifying key product requirements from [PRODUCT.md](../../PRODUCT.md). Because the shell acts as the user experience host, full end-to-end proof of certain requirements depends on upstream or downstream component owners:

| Requirement ID | Product Requirement Summary | Shell Responsibility | External Dependency for Verification |
|---|---|---|---|
| **ORY-002** | Enrollment and Disclosure Notice | Presents multi-step disclosure notice before capture; records version-bound employee decisions; blocks capture until accepted. | [local-privacy-storage](local-privacy-storage.md) persists authoritative consent and enforces pre-consent capture gate. |
| **ORY-003** | Persistent Status Visibility | Displays continuous operating status across native tray, movable badge, and main window across all 7 canonical states. | [local-privacy-storage](local-privacy-storage.md) supplies authoritative capture snapshot; OS window manager hosts surfaces. |
| **ORY-004** | Explicit Pause Control | Provides immediate Pause All control via badge, tray, and hotkey; displays pending state; guarantees UI never shows false active state. | [local-privacy-storage](local-privacy-storage.md) closes capture gate and discards in-flight post-pause observations. |
| **ORY-005** | Contextual Observation Scope | Visualizes active permitted capture context; suppresses typed passwords and sensitive UI from display previews. | [os-observation](os-observation.md) and [local-privacy-storage](local-privacy-storage.md) exclude sensitive fields at source. |
| **ORY-006** | Personal Work History View | Renders private, cursor-paginated timeline of tasks, candidate workflows, and review status for the authenticated profile. | [local-privacy-storage](local-privacy-storage.md) stores and paginates encrypted local evidence records. |
| **ORY-007** | Private History Search and Deletion | Provides local-only search filters and per-item or date-range deletion controls with explicit consequence explanations. | [local-privacy-storage](local-privacy-storage.md) executes physical deletion of records and cryptographic key destruction. |
| **ORY-008** | Management Privacy Boundary | Excludes productivity scores, keystroke rates, and manager activity feeds from all client views and client diagnostic bundles. | System-wide guarantee: [command-center-analytics](command-center-analytics.md) possesses no employee-level feed APIs. |
| **ORY-009** | Capture Interruption Labeling | Labels incomplete segments when pause, exclusion, or crash interrupts work; reflects "Insufficient Observation" banners. | [local-context-hud](local-context-hud.md) tags segmented tasks with boundary interruption flags. |
| **ORY-010** | My Privacy Trust Center | Dedicated UI area displaying capture settings, excluded apps, raw retention countdown, consent history, and visibility boundaries. | [local-privacy-storage](local-privacy-storage.md) provides authoritative settings and expiration schedules. |
| **ORY-018** | Published Peer Error Resolution | Displays contextual error resolution cards with author provenance, verification badge, and action choices. | [local-context-hud](local-context-hud.md) detects error context; [contribution-sync](contribution-sync.md) caches playbooks. |
| **ORY-019** | Next-Step Guidance and Highlighting | Hosts step-by-step guidance cards and native click-through target highlights; never advances steps autonomously. | [local-context-hud](local-context-hud.md) coordinates step verification and emits target bounding boxes. |
| **ORY-020** | User Snooze and Fatigue Throttling | Provides 1-hour snooze, category mute, and dismiss buttons on guidance cards; propagates choices immediately. | [local-context-hud](local-context-hud.md) enforces suppression filters and snooze timers. |
| **ORY-021** | Contextual Commitment Reminders | Renders confirmed meeting commitment reminder cards in relevant application contexts. | [meeting-intelligence](meeting-intelligence.md) extracts commitments; [local-context-hud](local-context-hud.md) matches context. |
| **ORY-026** | Sanitize Before Share Review | Presents structured contribution review dialog showing proposed sanitized steps, variables, and redacted previews. | [local-privacy-storage](local-privacy-storage.md) produces candidate; [contribution-sync](contribution-sync.md) awaits approved receipt. |
| **ORY-027** | Contribution Provenance & Redaction | Allows employee to edit proposed parameters, mask fields, or decline sharing prior to cryptographic signing. | [local-privacy-storage](local-privacy-storage.md) commits redacted contribution and applies employee signature. |
| **ORY-028** | Multi-User Variant Review | Displays clarifying questions and workflow variant comparisons when candidate consolidation requires employee input. | [workflow-discovery](workflow-discovery.md) clusters variants; [contribution-sync](contribution-sync.md) routes questions. |
| **ORY-041** | Consequential Action Approvals | Renders Tier 2/3 action approval dialogs displaying exact target parameters, before/after diffs, evidence, and expiration. | [control-plane](control-plane.md) and [identity-policy](identity-policy.md) issue proposals and validate signatures. |
| **ORY-043** | Emergency Stop Control | Immediate global stop control accessible via UI and shortcut; halts local executor dispatches instantly. | [agent-runtime](agent-runtime.md) and local application executors abort running tool invocations. |
| **ORY-044** | Verification Verdict Presentation | Displays execution results with explicit verification badges (Verified, Mismatch, Outcome Unknown). | [outcome-verification](outcome-verification.md) provides authoritative verification verdicts. |
| **ORY-045** | Mismatch & Error Explanation | Explains why an assisted action failed or differed from expected state; provides manual takeover path. | [outcome-verification](outcome-verification.md) diagnoses differences; [local-context-hud](local-context-hud.md) formats options. |
| **ORY-047** | Incident Diagnosis Explanation | Displays incident repair recommendations and impact explanations to authorized operator. | [incident-correction-repair](incident-correction-repair.md) isolates root cause and proposes patch. |
| **ORY-048** | Expert Correction Interface | Captures expert operator corrections, field adjustments, and parameter overrides during supervised repair. | [incident-correction-repair](incident-correction-repair.md) compiles patch candidate. |
| **ORY-064** | Offline Guidance Caching | Renders guidance cards seamlessly from local cache when disconnected; clearly indicates offline policy status. | [contribution-sync](contribution-sync.md) manages local cache; [identity-policy](identity-policy.md) bounds offline lease. |
| **ORY-068** | Cross-Platform Desktop Support | Delivers feature parity across macOS (Intel and Apple Silicon) and Windows 11 (x64 and ARM64). | Native OS platform APIs (AppKit on macOS, Win32 on Windows). |
| **ORY-069** | Resource Budget Enforcement | Enforces memory (<= 250 MiB idle tree), CPU (<= 1% core idle), launch (p95 <= 3s), and stop latency (p95 <= 100ms) limits. | Internal OS process monitoring and telemetry harnesses. |
| **ORY-070** | Local-First Privacy Guarantees | Prohibits raw media egress; ensures all raw screen frames and audio remain strictly on local disk. | [local-privacy-storage](local-privacy-storage.md) enforces cryptographic profile boundary and zero cloud egress. |

## Upstream and downstream contracts

**Catalog references:** [Cross-Component Contracts Catalog Contract 19 & 20](../architecture/contracts/README.md)

### Parent / Helper Transport Architecture

The Desktop Shell native host communicates with the supervised unprivileged Privacy Helper process via **private inherited byte channels** established at process creation. Public named pipes, localhost TCP sockets, and discoverable Unix domain filesystem sockets are strictly prohibited to prevent unauthorized local process connection or eavesdropping.

- **macOS / Unix:** The host creates two connected Unix domain stream socket pairs via `socketpair(AF_UNIX, SOCK_STREAM, 0)`: one dedicated to real-time bidirectional control/state streaming, and one dedicated to bounded query responses (history pagination, review candidate payloads). The host passes the child socket descriptors across `fork`/`exec` and closes the child ends in the host. The child closes the host ends and closes all inherited descriptors other than standard descriptors and the explicit protocol channels.
- **Windows:** The host creates two anonymous unidirectional pipe pairs (`CreatePipe`) per channel (four pipes total: control read/write, query read/write). The host uses `InitializeProcThreadAttributeList` with `PROC_THREAD_ATTRIBUTE_HANDLE_LIST` in `STARTUPINFOEXW` to restrict handle inheritance strictly to the child pipe ends. Unused handle copies in both parent and child are closed immediately upon child process creation.

Both host and child enforce strict closure of duplicate handles/descriptors. Failure to close duplicate handles breaks EOF detection upon process crash or termination, which violates the fail-closed capture invariant.

#### Binary Launch and Signature Verification
The host resolves the helper executable exclusively by absolute path within the authenticated application bundle or installation directory (`<AppBundle>/Contents/MacOS/oryn-privacy-helper` on macOS, `<InstallDir>\oryn-privacy-helper.exe` on Windows). PATH lookups, relative paths, and working-directory lookups are prohibited.

Prior to spawning the helper:
- On macOS, the host validates that the helper binary's designated code requirement matches the host's team identifier and bundle structure using `SecStaticCodeCheckValidity`.
- On Windows, the host validates the Authenticode digital signature and publisher subject of the helper binary using `WinVerifyTrust`.

#### Framing and Protocol Wire Format
Communication on both channels uses length-prefixed framing:
1. A **4-byte unsigned big-endian integer** indicating the payload length in bytes ($0 < \text{length} \le 1{,}048{,}576$).
2. A **UTF-8 JSON encoded payload** of exactly the specified length.

The maximum message size is fixed at **1,048,576 bytes (1 MiB)**. Payloads exceeding this size or reporting zero length are rejected immediately by closing the transport channel. Diagnostics and logs must never be multiplexed onto protocol channels.

#### Protocol Handshake (`shell-privacy.v1`)
Immediately following channel creation, the host and helper execute a mandatory protocol handshake. The protocol version is `shell-privacy.v1` (major 1, minor 0).

**Host Handshake Hello:**
```json
{
  "type": "HandshakeHello",
  "protocol_version": "shell-privacy.v1",
  "protocol_major": 1,
  "protocol_minor": 0,
  "shell_build": "2026.11.08.1",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r"
}
```

**Helper Handshake Ack:**
```json
{
  "type": "HandshakeAck",
  "protocol_major": 1,
  "protocol_minor": 0,
  "helper_build": "2026.11.08.1",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "status": "ready"
}
```

If the helper reports an incompatible protocol major, a mismatched build, a mismatched `session_epoch`, or fails to acknowledge within 3,000 ms, the host terminates the child process, marks helper status as `HELPER_UNAVAILABLE`, and shows **Attention Needed** in the UI.

### Control Channel Message Definitions

All employee-initiated mutations carry an idempotent command envelope:
- `command_id`: UUIDv4 string generated by the native coordinator.
- `session_epoch`: UUIDv4 string bound to the current supervisor/helper lifecycle.
- `expected_revision`: Unsigned 64-bit integer serialized as a **decimal string** (e.g. `"1420"`), preventing JavaScript 53-bit float rounding in WebView layers.
- `payload`: Typed mutation payload.

#### Commands

1. **`PauseCapture`**
   - **Payload:** `{"reason": "employee" | "window_closed" | "quit" | "update" | "uninstall"}`
   - **Semantics:** Commands immediate suspension of all active observation streams. Establishes a durable pause or specific recovery blocker in local privacy storage before responding. Bypasses `expected_revision` checks: requesting a capture stop must never fail due to a revision race.
   - **Response:** `{"command_id": "...", "status": "acknowledged", "revision": "1421", "stopped_at": "2026-11-08T14:30:00.120Z"}`

2. **`ResumeCapture`**
   - **Payload:** `{"categories": ["visual_work_observation", "contextual_work_application_recognition"]}`
   - **Semantics:** Requests resumption of consented, policy-permitted screen observation categories. **Never accepts audio or meeting categories.** Local privacy storage atomically validates current policy validity, employee consent, OS permissions, physical visibility lease, and absence of recovery blockers. Missing authority or mismatched `expected_revision` causes immediate rejection.
   - **Response:** `{"command_id": "...", "status": "acknowledged", "revision": "1422", "active_categories": [...]}` or rejection with reason code.

3. **`SetCaptureCategory`**
   - **Payload:** `{"category": "<CategoryIdentifier>", "enabled": boolean}`
   - **Semantics:** Toggles employee preference for a single category. Enabling a category cannot bypass missing employee notice consent, cannot start meeting recording, and cannot override an organizational policy prohibition.
   - **Response:** `{"command_id": "...", "status": "acknowledged", "revision": "1423"}`

4. **`RecordCaptureConsent`**
   - **Payload:** `{"notice_version": "v1.4.2", "category_decisions": [{"category": "<CategoryIdentifier>", "accepted": boolean}]}`
   - **Semantics:** Records formal employee acceptance or rejection of disclosure notice terms. Rejected categories cease immediately. Privacy storage signs and persists the consent record.
   - **Response:** `{"command_id": "...", "status": "acknowledged", "revision": "1424", "receipt_id": "rcpt_98fa..."}`

5. **`GetCaptureSnapshot`**
   - **Payload:** `{}`
   - **Semantics:** Synchronous read request. Returns the complete authoritative `CaptureSnapshot`.

6. **`SubscribeCaptureState`**
   - **Payload:** `{"after_sequence": "<DecimalString>"}`
   - **Semantics:** Establishes ordered streaming of snapshot changes. If the requested sequence is unavailable or the epoch has changed, the helper returns `{"error": "RESYNC_REQUIRED"}` requiring a fresh `GetCaptureSnapshot`.

7. **`RenewVisibilityLease` (Host Ephemeral Control)**
   - **Payload:** `{"session_epoch": "...", "lease_sequence": "<DecimalString>"}`
   - **Semantics:** Emitted strictly by the native supervisor every 100 ms while status surfaces (badge/tray) are healthy. Does not use UUID allocation, durable receipts, or revision increments. If unrenewed for 500 ms, the helper's internal capture gate automatically revokes and capture stops.

8. **`SetSessionState` (Host Lifecycle Control)**
   - **Payload:** `{"session_epoch": "...", "state": "active" | "locked" | "asleep" | "signing_out" | "shutting_down"}`
   - **Semantics:** Informs privacy storage of OS-level power/session events. Non-active states immediately suspend active capture and flush in-flight buffers. Wake/unlock triggers guarded reevaluation without clearing manual pauses or update blockers.

9. **`PrepareUninstall`**
   - **Payload:** `{"confirm_local_deletion": true}`
   - **Semantics:** Directs privacy storage to verify legal hold constraints, halt capture, securely purge non-held local private material, and return a purge receipt (`ready`) or a hold block (`blocked`).

#### The Six Category Identifiers
The system strictly enforces these six canonical category identifiers:
1. `visual_work_observation`: Screen capture, window geometry, and UI state tracking.
2. `contextual_work_application_recognition`: Active application, process identity, and window titles.
3. `personal_history_retention`: Local timeline persistence and candidate aggregation.
4. `organizational_sharing`: Eligibility to prepare and review sanitized shared playbooks.
5. `meeting_transcription`: Real-time audio capture and speech-to-text processing.
6. `meeting_commitment_extraction`: Inference of action items and commitments from transcripts.

Meeting categories (5 and 6) belong to a separately typed meeting interface; generic `ResumeCapture` rejects requests containing them.

### Downstream Integration Interfaces

#### 1. Contribution Review Interface (`SyncPort`)
When an employee reviews a sanitized task demonstration for potential organizational sharing:
- **Request (`ReviewContribution`):**
  ```json
  {
    "contribution_id": "contrib_8f7a1c9e",
    "revision": "4",
    "content_digest": "sha256-4b2a8f9c1e7a...",
    "decision": "approve" | "decline",
    "redaction_overrides": {
      "mask_field_ids": ["field_account_num"],
      "remove_step_indices": [3]
    }
  }
  ```
- **Response:** committal receipt with signed audit hash. Only the review/storage owner emits the downstream domain event `contribution.approved_for_sharing`. The desktop shell never manufactures sharing events or digital signatures.

#### 2. HUD Guidance Presentation Interface (`HudPresentationPort`)
`local-context-hud` produces structured guidance models; `desktop-shell` renders them.
- **Model Ingress (`PresentGuidance`):**
  ```json
  {
    "guidance_session_id": "gsess_1092a8b",
    "playbook_version": "sha256-e9102c3d...",
    "context_revision": "841",
    "card": {
      "title": "ERP Invoice Discrepancy Fix",
      "body": "Match invoice tax code with line-item schedule before posting.",
      "source_workflow_id": "wf_tax_matching_v2",
      "playbook_version": "v2.1",
      "last_verified_at": "2026-11-01T10:00:00Z",
      "evidence_refs": ["ev_9182a"],
      "status": "published",
      "actions": ["confirm_step", "back", "skip_optional", "stop", "dismiss", "snooze_1h", "mute_category"]
    },
    "highlight": {
      "target_application_id": "com.enterprise.erp",
      "target_window_id": "win_main_481",
      "display_id": "disp_retina_1",
      "context_revision": "841",
      "rect": {"left": 450, "top": 320, "width": 120, "height": 38},
      "ttl_ms": 150
    }
  }
  ```
  - `card.body` is rendered strictly as plain text (no HTML/markdown injection).
  - `highlight.rect` uses physical screen pixels; the native adapter translates coordinates using active display DPI scaling.
  - `highlight.ttl_ms` is clamped to 1–250 ms. Highlights expire automatically unless renewed by the HUD.
  - Highlights are dismissed immediately upon window focus change, window movement, display reconfiguration, or context revision mismatch. Highlighting OS security prompts or browser permission dialogs is prohibited.
- **Interaction Feedback (`GuidanceInteraction`):**
  ```json
  {
    "guidance_session_id": "gsess_1092a8b",
    "context_revision": "841",
    "action": "confirm_step" | "back" | "skip_optional" | "stop" | "dismiss" | "snooze_1h" | "mute_category"
  }
  ```

#### 3. Consequential Action Approval Interface (`IdentityPort`)
When a Tier 2 or Tier 3 action requires employee approval:
- **Proposal Model Ingress:** The shell receives a cryptographically signed proposal including proposal ID, revision, digest, action category, affected system, target entity, parameter diffs (before/after values), supporting evidence references, consequence summary, and expiration UTC timestamp.
- **Submission (`SubmitApproval`):**
  ```json
  {
    "command_id": "cmd_91a02b3c",
    "proposal_id": "prop_conseq_7812",
    "proposal_revision": "2",
    "proposal_digest": "sha256-8a71b2c4...",
    "decision": "approve" | "reject"
  }
  ```
- **Responses:** Distinguishes `accepted`, `rejected`, `expired`, `stale`, `forbidden`, and `unknown_delivery`. If `unknown_delivery` occurs, the UI displays an ambiguous status and refuses to repeat writes without reconciliation.

#### 4. Local History and Privacy Reads
History browsing, candidate inspection, and My Privacy data are fetched over the dedicated query channel using cursor-based pagination (capped at 100 items per response). Raw media thumbnails are fetched via short-lived, profile-bound opaque local handles (e.g. `local-media://handle-uuid`), validated by the privacy helper. Arbitrary filesystem path traversal and direct URLs to unredacted captures are strictly prohibited.

## Trust and deployment boundaries

### Process Isolation and Execution Hierarchy

```
+-------------------------------------------------------------------------+
| Employee Workstation (User Session Boundary: OS User UID / SID)        |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Desktop Shell Host Process (Rust / Tauri 2)                       |  |
|  | - ShellSupervisor, SessionBroker, PresentationCoordinator        |  |
|  | - NativeStatusAdapter (AppKit / Win32)                            |  |
|  |                                                                   |  |
|  |  +-------------------------------------------------------------+  |  |
|  |  | OS WebView (Isolated Webkit / WebView2 Process)             |  |  |
|  |  | - ShellViews (React / TypeScript)                           |  |  |
|  |  | - Capability-restricted IPC bridge                          |  |  |
|  |  +-------------------------------------------------------------+  |  |
|  +-------------------------------------------------------------------+  |
|         | (Inherited Unix Socketpair / Anonymous Pipe Pair)             |
|         v                                                               |
|  +-------------------------------------------------------------------+  |
|  | Privacy Helper Process (Unprivileged User-Space Child)           |  |
|  | - Local Privacy Gate, Evidence Store, Retention Engine          |  |
|  | - Ephemeral Visibility Lease Consumer                            |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | HUD Context Helper Process (Unprivileged User-Space Child)       |  |
|  | - Task Segmentation, Playbook Cache Matcher, Suggestion Model     |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

### Tauri Capabilities and IPC Allowlist Rules
The desktop shell runs under Tauri 2, which enforces explicit capability-based security:
- **No Global IPC:** Ambient command registration is prohibited. Every custom Tauri command must be explicitly enumerated in capability configuration files scoped to specific window labels.
- **Window Separation:**
  - `main`: Permitted to invoke session management, navigation, My Privacy reads, contribution review submissions, and consequential action approvals.
  - `guidance_card`: Permitted strictly to invoke `GuidanceInteraction` and card sizing commands. **Cannot access authentication tokens, privacy settings, or approval submission commands.**
  - `native_badge`: Native-drawn surface; no WebView or IPC layer exists within the badge window.
- **Restricted Tauri Core Plugins:** The standard Tauri filesystem, shell execution, global HTTP client, and clipboard-write plugins are disabled in renderer capabilities. All file operations, external URL openings, and network calls are handled by vetted Rust coordinator modules.
- **Content Security Policy (CSP):** The WebView enforces:
  ```text
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' local-media: data:; connect-src 'self'; object-src 'none'; frame-src 'none';
  ```
  Remote scripts, external styles, and `eval()` are blocked.

### Credential and Secret Management
- **Central Authentication Flow:** Authentication uses an external system browser (default OS browser) executing OAuth 2.0 / OIDC Authorization Code Flow with Proof Key for Code Exchange (PKCE, RFC 7636) and OIDC nonce validation. Embedded login WebViews and client secrets are strictly prohibited.
- **Token Storage:** Refresh tokens, session signing tokens, and active ID tokens are stored exclusively in the OS-provided secure credential store:
  - macOS: System Keychain Services via the `Security.framework` API.
  - Windows: Windows Credential Manager via the `CredWriteW` / `CredReadW` API.
- **Renderer Isolation:** Central tokens and cryptographic keys are held in Rust memory (`SessionBroker`) and are **never passed into the React WebView**, localStorage, sessionStorage, IndexedDB, or local log files.
- **Session Scoping:** Exactly one employee session per operating system desktop user account is supported. Switching accounts requires an explicit sign-out that invalidates local session tokens, unloads cached guidance, and locks the local evidence store.

## Internal architecture

### Logical Submodules and Seams

```
+----------------------------------------------------------------------------------+
| Desktop Shell Host (Rust Core)                                                   |
|                                                                                  |
|  +---------------------+        +--------------------+                           |
|  |   ShellSupervisor   |<------>|   SessionBroker    |                           |
|  | (Lifecycle/Lease)   |        |  (OIDC PKCE / OS)  |                           |
|  +---------------------+        +--------------------+                           |
|             |                              |                                     |
|             v                              v                                     |
|  +---------------------------------------------------+                           |
|  |             PresentationCoordinator               |                           |
|  |  - Projects Authoritative Capture Snapshot        |                           |
|  |  - Serializes Commands and Prevents Races         |                           |
|  +---------------------------------------------------+                           |
|             |                              |                                     |
|             +-----------------+            +------------------+                  |
|             v                 v            v                  v                  |
|  +--------------------+ +-----------+ +---------------+ +--------------------+   |
|  | NativeStatusAdapter| |PrivacyClnt| |Sync/IdentPort | | HudPresentationPort|   |
|  | (AppKit / Win32)   | |(Inherited)| |(Control Plane)| | (HUD Helper)       |   |
|  +--------------------+ +-----------+ +---------------+ +--------------------+   |
+----------------------------------------------------------------------------------+
                                        | (Tauri IPC Bridge)
                                        v
+----------------------------------------------------------------------------------+
| ShellViews (React / TypeScript in OS WebView)                                    |
| - Enrollment | Home | Personal History | Contribution Review | My Privacy        |
| - Guidance Cards | Notification Inbox | Consequential Approval Review            |
+----------------------------------------------------------------------------------+
```

1. **`ShellSupervisor` (Rust):**
   - Coordinates native process lifecycle, single-instance enforcement (via OS-level named mutex on Windows, flock on Unix), and child helper supervision.
   - Manages the visibility lease heartbeat timer (100 ms).
   - Monitors OS session lock/unlock, system sleep/wake, and display topology changes.
   - Registers and debounces global keyboard shortcuts.

2. **`SessionBroker` (Rust):**
   - Handles loopback HTTP listener for OIDC PKCE redirect capture (`http://127.0.0.1:<random-port>/callback`).
   - Interacts with OS Keychain / Credential Manager.
   - Maintains current tenant and employee identity tokens in protected memory.
   - Enforces clean token clearing on explicit sign-out.

3. **`PresentationCoordinator` (Rust):**
   - Receives raw `CaptureSnapshot` updates from `PrivacyClient` and computes the deterministic headline state and independent badge states.
   - Serializes employee commands to eliminate mutation races.
   - Intercepts resume commands while a capture stop is pending (`CAPTURE_STOP_PENDING`).
   - Maps backend errors into standardized employee-facing error codes.

4. **`NativeStatusAdapter` (Rust + Platform Native):**
   - **macOS:** Implemented via AppKit (`NSStatusBar`, `NSStatusItem`, `NSPanel`, `NSWindow`). Uses standard window levels (`NSStatusWindowLevel`) for non-focus-stealing badge and highlight surfaces. Strictly avoids private macOS transparency APIs.
   - **Windows:** Implemented via Win32 (`Shell_NotifyIconW`, `CreateWindowExW` with `WS_EX_TOPMOST | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE | WS_EX_LAYERED`).
   - Manages physical geometry, multi-monitor display coordinates, and click-through highlight rendering.

5. **`PrivacyClient` (Rust):**
   - Encapsulates length-prefixed framing over inherited socketpairs / pipes.
   - Executes handshake and handles channel recovery.
   - Dispatches mutations and maintains subscription stream.

6. **`HudPresentationPort`, `SyncPort`, `IdentityPort` (Rust):**
   - Abstract internal ports decoupling the shell coordinator from network transports and child process protocols of external components.

7. **`ShellViews` (React / TypeScript):**
   - Component surfaces rendering user views.
   - Built with strict TypeScript schemas matching Tauri IPC payloads.
   - Zero raw media storage; renders previews via short-lived handle URLs.

### Concurrency and Threading Architecture
The native host uses the **Tokio asynchronous runtime** for non-blocking I/O (IPC channels, loopback listeners, timers) alongside the **OS main UI thread** required by AppKit and Win32.
- The UI thread exclusively handles window creation, menu interaction, native drawing, and system event loops.
- Tokio worker threads handle channel byte streaming, message deserialization, cryptographic digest calculations, and SQLite preferences I/O.
- Communication between Tokio workers and the UI thread uses thread-safe crossbeam channels and Tauri's thread-safe window emitters (`AppHandle::emit`).

### Local Preferences Persistence
The Desktop Shell maintains a lightweight local SQLite database (`shell_preferences.db`) located in the standard OS application support directory:
- macOS: `~/Library/Application Support/Oryn/shell_preferences.db`
- Windows: `%LOCALAPPDATA%\Oryn\shell_preferences.db`

**Schema and Stored Settings:**
```sql
CREATE TABLE ui_preferences (
    profile_id TEXT PRIMARY KEY,
    schema_version INTEGER NOT NULL,
    window_bounds_json TEXT NOT NULL,
    badge_position_json TEXT NOT NULL,
    launch_at_login BOOLEAN NOT NULL DEFAULT 0,
    automatic_observation BOOLEAN NOT NULL DEFAULT 0,
    background_observation BOOLEAN NOT NULL DEFAULT 0,
    global_pause_hotkey TEXT,
    notification_quiet_hours_json TEXT,
    updated_at_utc TEXT NOT NULL
);
```

**Persistence Invariants:**
- Scoped strictly to the local OS user and active employee profile ID.
- **Zero Sensitive Data:** Stores UI layout, geometry, and toggle preferences only. **Never stores tokens, passwords, consent records, capture policy documents, or private history.**
- **Corruption Recovery:** If the SQLite database is unreadable or corrupted, the shell loads safe conservative defaults (all auto-start/background preferences set to `false`, capture remains stopped) and preserves the corrupted file as `shell_preferences.db.corrupt.<timestamp>` for diagnosis. It never silently overwrites an unreadable database.

## State and lifecycle

### Orthogonal State Model

The desktop companion operates across multiple orthogonal state axes. System state is never flattened into a single one-dimensional status:

```
[Enrollment Axis]      Not Enrolled ------> Notice Required ------> Ready
[Consent Axis]         No Consent   ------> Version-Bound Consent Granted (Per Category)
[Employee Pause Axis]  Active       <=====> Durable Employee Pause (survives restart)
[Transient Suspension] Unrestricted <=====> OS Lock / Sleep / Logout / Shutdown
[Recovery Blocker]     Clear        <=====> Crash / Visibility Lost / Update Blocker
[Policy Validity Axis] Valid        <=====> Expired / Revoked / Untrusted Clock
[Physical Visibility]  Lease Valid  <=====> Lease Expired / Badge Lost (gate closed)
[Active Capture Fact]  Stopped      <=====> Observing Screen / Recording Audio
```

### Authoritative Capture Snapshot Schema

The authoritative state emitted by [local-privacy-storage](local-privacy-storage.md) over `SubscribeCaptureState` conforms to the following Rust/TypeScript schema:

```typescript
export interface CaptureSnapshot {
  session_epoch: string;           // UUIDv4 of the active supervisor/helper session
  revision: string;                // Authoritative decimal string representation of u64
  sequence: string;                // Stream monotonic decimal string representation of u64
  enrollment: "not_enrolled" | "notice_required" | "permissions_required" | "ready";
  categories: CategoryState[];
  employee_paused: boolean;        // Durable employee pause flag
  suspension: null | "locked" | "asleep" | "signing_out" | "shutting_down";
  recovery_blocker: null | "crash" | "visibility_lost" | "update" | "unclean_restart" | "policy_expired";
  policy_state: "valid" | "expired" | "missing" | "revoked" | "untrusted_clock";
  policy_version: string | null;
  notice_version: string | null;
  policy_not_after: string | null; // RFC 3339 UTC timestamp
  source_state: "permitted" | "excluded" | "unavailable";
  reason_codes: string[];          // Machine-readable explanation tags
}

export interface CategoryState {
  category: "visual_work_observation" | "contextual_work_application_recognition" |
            "personal_history_retention" | "organizational_sharing" |
            "meeting_transcription" | "meeting_commitment_extraction";
  consented: boolean;
  enabled: boolean;
  permission: "granted" | "denied" | "not_required";
  activity: "active" | "stopped" | "unknown";
}
```

### The Seven Canonical Product States & Deterministic Headline Priority

In accordance with [PRODUCT.md §8.1](../../PRODUCT.md), the desktop shell presents one of seven canonical headline states. When multiple conditions coincide (e.g. employee pause while in an excluded application), the headline is derived using the following **strict deterministic priority order**:

| Priority | Canonical Headline | Trigger Condition | Visual & Explanatory Details |
|---|---|---|---|
| **1 (Highest)** | **Attention Needed** | Unknown capture state, failed helper, broken IPC, lost visibility lease, or unverified crash restart. | Warning badge; explainer states exact subsystem failure; offers Retry Connection or Restart. |
| **2** | **Not Configured** | `enrollment != "ready"` (notice unacknowledged, consent missing, or mandatory OS permissions denied). | Informational badge; provides direct link to Enrollment or OS Settings guide. |
| **3** | **Meeting Capture Active** | Audio transcription category `activity == "active"`. | Distinct high-visibility recording indicator; displays meeting title/duration and Stop Meeting button. |
| **4** | **Paused by You** | `employee_paused == true`. | Amber paused badge; indicates manual pause; displays Resume button. Surpasses background/policy states. |
| **5** | **Paused by Policy** | `policy_state != "valid"`, `suspension != null`, or administrative policy blocks capture. | Blue restriction badge; explains policy reason (e.g. "Workstation locked", "Policy lease expired", "Offline > 24h"). |
| **6** | **In Excluded Application** | Foreground window belongs to an organizationally or personally excluded application/domain. | Shield badge; displays "Excluded window active — observation suspended"; zero frames captured. |
| **7 (Lowest)** | **Observing Approved Work** | Eligible screen categories `activity == "active"`, policy valid, permitted source, visibility healthy. | Green active badge; displays "Observing approved work context" and quick Pause All button. |

**Independent Status Invariant:** Regardless of the headline state, the companion UI and native badge **always display independent Screen and Meeting status indicators** alongside active restriction text. Meeting audio is never concealed behind a screen pause headline.

### Command States and Stopping Transitions
When an employee clicks Pause:
1. The UI enters state `pending` and displays **`Pausing…`**.
2. The command is transmitted to privacy storage.
3. Privacy storage closes the capture gate, halts buffer ingestion, and flushes in-flight post-stop frames to the discard sink.
4. Privacy storage commits the durable pause state to disk and returns an acknowledgement with the new revision.
5. The UI receives the acknowledgement and transitions to **`Paused by You`**.
6. If no acknowledgement arrives within 500 ms, the host revokes the visibility lease, terminates the helper process, and transitions to **`Attention Needed`**. The UI never displays success based solely on dispatching a command.

### Complete Lifecycle Transition Table

| Event / Scenario | Trigger Condition | Authoritative Owner | Capture State Outcome | UI State & Explanatory Behavior | Recovery / Next Action |
|---|---|---|---|---|---|
| **First Install / Enrollment** | Fresh binary launch; no stored profile. | `ShellSupervisor` + [local-privacy-storage](local-privacy-storage.md) | All categories stopped; capture gates locked. | **Not Configured**; presents 4-step onboarding notice and synthetic demonstration before real capture. | Employee reviews disclosure notice, selects category consents, grants OS permissions. |
| **Main Window Close (Background Opt-In = True)** | User clicks window close button with `background_observation == true`. | `ShellSupervisor` | Capture continues uninterrupted. | Main window hides; native movable badge and tray icon remain fully visible on active desktop. | Reopening main window via tray/badge restores full view without altering capture. |
| **Main Window Close (Background Opt-In = False)** | User clicks window close button with `background_observation == false`. | `PresentationCoordinator` | Halts capture via `PauseCapture(reason="window_closed")`. | Main window hides; badge hides; tray icon displays amber paused status. | Employee must open main window and explicitly click Resume to restart observation. |
| **Explicit Application Quit** | User selects Quit from menu or tray. | `ShellSupervisor` | Persists `quit` pause; stops capture; waits for executor checkpoint; terminates helpers and host. | Application closes. Tray icon and native badge removed from desktop. | Clean shutdown. On next launch, starts paused unless automatic-observation preference is set. |
| **OS Workstation Lock / Sleep** | OS emits session lock or sleep notification. | OS Event -> `ShellSupervisor` -> `SetSessionState` | Stops all capture immediately; ends meeting recordings; records pre-suspension screen state. | System lock screen. Tray/badge suspend rendering. | Unlock/wake re-evaluates policy/visibility; restores previous screen observation ONLY if previously active. Audio never auto-resumes. |
| **OS Logout / Shutdown** | OS emits user logoff or system shutdown event. | `ShellSupervisor` | Visibility lease revoked immediately; capture stops; in-flight writes flushed. | Host terminates cleanly. No durable employee pause is recorded. | Next login obeys startup preferences. If provenance is ambiguous, starts paused. |
| **Child Helper Crash** | Supervised helper process terminates unexpectedly (SIGSEGV, crash). | `ShellSupervisor` | Capture gate collapses (EOF on socket/pipe); zero capture possible. | **Attention Needed**; badge indicates capture failure; displays "Privacy helper terminated unexpectedly". | Supervisor executes backoff restart (100ms, 500ms, 1500ms). Capture remains paused; requires explicit Resume. |
| **Native Status Badge Loss / Failure** | Badge surface fails, monitor unplugged, or compositor drops window. | `NativeStatusAdapter` | Lease renewal halted; privacy helper capture gate revokes at 500ms. | **Attention Needed**; tray displays warning; capture stopped. | Badge repositioned to primary display; requires explicit employee Resume once visibility is re-established. |
| **Software Update Available** | Update package downloaded and signature verified. | `ShellSupervisor` | Capture stops via `PauseCapture(reason="update")`; update blocker persisted before install. | Prompt indicates update ready; requires explicit employee confirmation to apply. | On relaunch, update blocker keeps capture paused until employee acknowledges and resumes. |
| **Offline Policy Expiry** | Disconnected from corporate network > 24 hours (or org limit). | [local-privacy-storage](local-privacy-storage.md) | Capture stops automatically; persists `recovery_blocker="policy_expired"`. | **Paused by Policy**; explains corporate capture policy expired while offline. | Reconnect to corporate network to refresh policy lease; employee must click Resume. |
| **Explicit Sign-Out** | Employee selects Sign Out in settings. | `SessionBroker` | All capture stops; meeting ends; tokens purged; local evidence locked. | Views reset to Enrollment/Login; history cleared from memory. | New OIDC PKCE login required. Prior profile data remains encrypted on disk. |
| **Supported Uninstall** | Employee or IT administrator initiates uninstall. | `ShellSupervisor` -> `PrepareUninstall` | Capture stops permanently; privacy storage checks legal holds; purges eligible private data. | Displays uninstall progress and data purge receipt; blocks if legal hold prevents deletion. | If ready, installer removes binaries and preferences. If blocked, directs user to admin hold policy. |

### Visible Capture and Supervision Rules

#### Movable Native Capture Badge
Whenever screen observation or meeting recording is active, the desktop shell maintains a compact, movable native badge on screen:
- **Platform Implementation:** AppKit floating panel (`NSPanel`) on macOS; layered top-level tool window (`WS_EX_TOOLWINDOW | WS_EX_TOPMOST`) on Windows.
- **Physical Invariants:** Non-focus-stealing (`NSWindowCollectionBehaviorCanJoinAllSpaces`, `WS_EX_NOACTIVATE`). Cannot steal keyboard focus or interrupt employee typing.
- **Accessible Controls:** Features high-contrast text, independent Screen/Meeting indicators, and an immediate **Pause All** button. Keyboard and screen-reader accessible via OS accessibility trees (AXUIElement / UI Automation).
- **Placement Safety:** Positioned at screen edge by default; movable by drag. Prohibited from anchoring over OS security dialogs, UAC prompts, or browser permission prompts. Automatically repositions if display disconnection invalidates its coordinates.
- **Zero Content Leakage:** The badge displays operational status only; it never displays captured window titles, customer names, or business values.

#### Visibility Lease Invariants
- The native supervisor evaluates badge health, window manager visibility, and desktop session state every **100 ms**.
- If healthy, the supervisor transmits `RenewVisibilityLease` with an incrementing sequence number over the inherited control channel.
- The privacy helper's internal capture gate automatically revokes if a lease renewal is not received within **500 ms**.
- Immediate revocation occurs upon channel EOF, socket error, or explicit revocation command.
- Capture processing checks the validity of the visibility lease before acquiring each frame and immediately before committing any observation into the evidence buffer.

#### Global Keyboard Shortcuts
- The shell supports an optional global hotkey for quick capture toggle (default: unbound).
- Employees may configure a custom key binding in Settings (e.g. `Cmd+Shift+P` / `Ctrl+Shift+P`).
- Key events are debounced at the native OS level: multiple keydown repeats generate exactly one command invocation.
- Hotkey intent resolves against the latest authoritative snapshot: if any capture (screen or meeting) is active, the hotkey executes **Pause All**. If paused, it attempts **ResumeCapture** for eligible screen categories only. **A hotkey cannot grant meeting audio consent or acknowledge a disclosure notice.**

## Error and edge-case behavior

### Standardized Error States and Recovery Matrix

| Error Code | Detection Mechanism | Root Cause / Trigger | Immediate State Impact | Employee-Visible Explanation | Recovery Action |
|---|---|---|---|---|---|
| `HELPER_UNAVAILABLE` | Child process exit, broken pipe, or timeout during handshake. | Privacy helper process crashed, killed, or failed signature check. | Capture halts immediately; visibility lease invalid; capture gate locked. | "Privacy helper unavailable. Capture suspended for your protection." | Automatic retry backoff (100ms, 500ms, 1500ms). If exhausted, displays **Retry Connection** button. |
| `PROTOCOL_MISMATCH` | Handshake response reports incompatible major or mismatched build. | Incompatible binary components deployed during partial update. | Handshake rejected; helper terminated; capture blocked. | "Component version mismatch detected. Please restart Oryn or reinstall." | Application prevents capture until matched update bundle is installed. |
| `POLICY_EXPIRED` | Policy engine clock check; `now() > policy_not_after` or offline > 24h. | Workstation disconnected from network beyond allowable offline validity window. | Capture stops immediately; recovery blocker `policy_expired` persisted. | "Capture policy expired while offline. Reconnect to corporate network to resume." | Reconnect to corporate network to refresh policy; click Resume once policy is valid. |
| `PERMISSION_REQUIRED` | OS API returns permission denied during screen capture or accessibility hook. | OS screen recording or accessibility permission revoked in system settings. | Affected category disabled; snapshot updated to `permission="denied"`. | "macOS Screen Recording permission required to observe approved work." | Opens system settings directly; shows verification button to re-check permissions. |
| `VISIBILITY_LOST` | Badge window occluded, destroyed, moved offscreen, or display disconnected. | Native status badge lost from active desktop view. | Visibility lease renewal halted; capture gate collapses within 500ms. | "Capture visibility lost. Observation stopped automatically." | Badge repositions to primary screen; employee must click Resume to re-verify visibility. |
| `STALE_REVISION` | Privacy helper responds with revision conflict error on mutation. | Concurrent mutation occurred or UI state was out of date. | Mutation rejected; authoritative snapshot refreshed. | "Settings changed in another window. Refreshing current state..." | UI updates to authoritative snapshot; employee repeats intentional action if desired. |
| `RESYNC_REQUIRED` | State subscription returns sequence gap or epoch mismatch. | Child helper restarted or sequence buffer overflowed. | Subscription reset; pending UI optimistic state cleared. | "Synchronizing capture state..." | Coordinator calls `GetCaptureSnapshot` and resubscribes with latest sequence. |
| `COMMAND_ID_CONFLICT` | Helper receives duplicate command ID with different payload. | Client bug or recycled UUID in command generator. | Mutation rejected with error; state unchanged. | "Action rejected due to internal conflict. Please retry." | Coordinator logs error, generates fresh UUID, and allows employee retry. |
| `APPROVAL_STALE` | Consequential approval submission returns `stale` or `expired`. | Action proposal was modified, superseded, or expired while review dialog was open. | Approval rejected; action prevented from executing. | "Action proposal expired or was superseded by a newer version." | Fetches updated proposal if available; requires fresh review of new parameters. |
| `UNKNOWN_DELIVERY` | Transport disconnect or timeout while awaiting approval submission response. | Network dropped during external API submission of consequential approval. | Execution outcome unknown; UI blocks blind retry. | "Approval submission timed out. Outcome is unverified. Checking status..." | Polls central control plane for proposal status before allowing employee intervention. |
| `CAPTURE_STOP_PENDING` | Employee clicks Resume while a prior PauseCapture command is in-flight. | Rapid clicking or race condition during capture shutdown. | Resume command rejected immediately by native coordinator. | "Pausing capture in progress. Please wait..." | Coordinator awaits stop confirmation before accepting any subsequent Resume command. |

## Observability and audit

### Redacted Diagnostic Telemetry Schema
To ensure diagnostic logs never compromise employee privacy or leak business secrets, all diagnostic events emitted by the desktop shell adhere to a strict redacted schema:

```json
{
  "event_id": "evt_0192a8b3-c4d5-7e8f-9a1b-2c3d4e5f6a7b",
  "timestamp_utc": "2026-11-08T14:35:10.042Z",
  "monotonic_ms": 4819204,
  "component": "desktop_shell",
  "subsystem": "supervisor",
  "event_code": "HELPER_PROCESS_RESTARTED",
  "correlation_id": "corr_8f1a2c3d",
  "shell_build": "2026.11.08.1",
  "helper_build": "2026.11.08.1",
  "protocol_major": 1,
  "duration_ms": 142,
  "failure_class": "transient_io",
  "details": {
    "exit_code": 1,
    "restart_attempt": 2,
    "backoff_ms": 500
  }
}
```

### Absolute Logging Prohibitions
The desktop shell is architecturally prohibited from writing any of the following to local diagnostic files or remote telemetry:
- Typed keystrokes, key codes, or input timing distributions.
- Window titles, document paths, or process names belonging to excluded applications.
- Screen pixel values, image thumbnails, OCR text, or DOM trees.
- Raw employee audio samples or transcript snippets.
- OAuth tokens, refresh tokens, session secrets, or encryption keys.
- Business form values, customer names, or financial parameters.

### Bounded Local Storage and Rotation
- Diagnostic log files are stored in `%LOCALAPPDATA%\Oryn\logs` (Windows) or `~/Library/Logs/Oryn` (macOS).
- Storage is strictly bounded: **maximum of three files of 5 MiB each** (15 MiB total).
- Uses standard size-triggered log rotation (`oryn.log`, `oryn.log.1`, `oryn.log.2`). When the limit is reached, the oldest log file is permanently deleted.

### Explicit Employee Diagnostic Upload
Diagnostic telemetry is not uploaded automatically to cloud servers. When troubleshooting an issue:
1. The employee opens **Settings > Diagnostics**.
2. The UI renders a structured, human-readable preview of the exact log entries to be included.
3. The employee must click an explicit **Export Logs** (saving locally as a `.zip` archive) or **Submit to Support** button.
4. An audit record of the export is saved to the local My Privacy log.

### Separation of Audit Records and Diagnostics
- **Shell Diagnostics:** Ephemeral operational traces for troubleshooting crashes and network errors.
- **My Privacy Audit Records:** Tamper-evident, durable records of employee consent changes, category toggles, data deletions, contribution approvals, and consequential action decisions. These are generated and signed by [local-privacy-storage](local-privacy-storage.md) and displayed read-only within the shell.

## Security and threat model

### Threat Matrix and Mitigations

| Threat ID | Threat Description | Attack Vector / Precondition | Impact | Specific Architectural Mitigation |
|---|---|---|---|---|
| **TH-DS-01** | Renderer Process Compromise / XSS | Malicious or malformed guidance text, notification payload, or peer fix injected via network. | Code execution inside WebView renderer process. | Strict CSP; no remote scripts; `eval()` disabled; UI text rendered as escaped text only; capability-restricted IPC allowlists. |
| **TH-DS-02** | Local IPC Forgery / Spoofing | Unprivileged local process attempts to connect to helper to disable capture or forge approvals. | Unauthorized state manipulation or false status reporting. | Inherited byte channels (`socketpair` / anonymous pipes); no named pipes or listening ports; platform signature checks before launch. |
| **TH-DS-03** | Malicious Helper Binary Substitution | Local malware or non-admin user replaces `oryn-privacy-helper` executable with altered binary. | Execution of untrusted code under employee desktop user account. | Hardened package paths; code signature verification (`SecStaticCodeCheckValidity` / `WinVerifyTrust`) before launch. |
| **TH-DS-04** | Stale / Cross-Profile Command Replay | Attacker replays captured `ResumeCapture` or `SubmitApproval` command payloads. | Unauthorized resumption of capture or execution of stale actions. | Unique `command_id` deduplication; `session_epoch` binding; strict `expected_revision` validation; receipt caching. |
| **TH-DS-05** | Click-Jacking / Deceptive Overlays | Malicious desktop app positions transparent window over Oryn approval dialog to hijack clicks. | Unintended employee approval of high-risk consequential action. | Consequential approvals hosted strictly in standard focus-stealing native dialogs; transparent overlays strictly click-through. |
| **TH-DS-06** | Browser Redirect / Callback Hijacking | Malicious local app attempts to steal OAuth authorization code during browser PKCE login. | Account takeover or identity spoofing. | RFC 7636 PKCE with cryptographically random code verifier; state parameter binding; loopback listener binds ephemeral port. |
| **TH-DS-07** | Insecure Update Artifact Tampering | Man-in-the-middle attacker tampers with downloaded desktop application update package. | Remote code execution via malicious auto-update installation. | Tauri updater signature validation using hardcoded public Ed25519 keys; Windows Authenticode / Apple Notarization checks. |
| **TH-DS-08** | Sensitive Data Leakage in Logs | Error handler logs unhandled exception containing captured frame data or business form values. | Private employee data exposed in unencrypted plaintext log files. | Strict structured log schema; zero raw media or input text in error objects; automated redaction filters in logging pipeline. |

### Same-User Desktop Security Boundary Realities
The desktop shell runs as an unprivileged process under the logged-in employee's desktop session. While the shell enforces strict process isolation and inherited IPC to prevent unsolicited access from other standard processes:
- **Admin / Root Compromise:** A root or SYSTEM-level compromised process on the workstation can inspect memory, attach debuggers, or manipulate display compositors regardless of client software design.
- **Same-User Process Memory Access:** On Windows and macOS, another process running with identical user rights can potentially inject code or inspect unencrypted memory via OS debugging APIs unless restricted by enterprise endpoint protection (EDR).
- **Mandatory Central Authorization:** The desktop shell and local UI clicks **never constitute cryptographic proof of authorization**. All consequential actions, policy evaluations, and data exports require server-side signature validation and token binding enforced centrally by [identity-policy](identity-policy.md) and [control-plane](control-plane.md).

## Test strategy

### Concrete Verification Scenarios (Walkthrough Table)

The following 23 scenarios establish the specification verification criteria for the Desktop Shell:

| # | Test Scenario / Input Condition | Authoritative Owner | Expected Specified Outcome | Verification Assertion |
|---|---|---|---|---|
| **1** | Fresh install; employee has not accepted disclosure notice. | `ShellSupervisor` + [local-privacy-storage](local-privacy-storage.md) | No category captures; status is **Not Configured**; synthetic demonstration precedes any real work capture. | Capture gate closed; frame count == 0; UI displays enrollment notice. |
| **2** | Active observation; employee clicks Pause; helper response delayed. | `PresentationCoordinator` | UI immediately shows **Pausing…**; privacy gate halts and in-flight post-stop frames are discarded; no false success. | UI never indicates active observation after click; gate closed within 100ms. |
| **3** | Employee paused; closes main window; reopens window; login preference enabled. | `ShellSupervisor` + `Preferences` | Durable employee pause survives; reopening shows **Paused by You**; no capture occurs until intentional Resume. | Snapshot `employee_paused == true`; capture remains stopped across launch. |
| **4** | Background opt-in enabled; employee closes main window. | `ShellSupervisor` + `NativeStatusAdapter` | Capture continues uninterrupted only because native movable badge remains active and visible with valid lease. | Badge visible on desktop; lease renewal continuous; capture active. |
| **5** | Native status badge hidden, closed, or host killed. | `NativeStatusAdapter` + [local-privacy-storage](local-privacy-storage.md) | Lease revoked or expires at 500ms; capture gate collapses immediately; restart requires explicit Resume. | Capture stops within 500ms of badge loss; recovery blocker set to `visibility_lost`. |
| **6** | Main React window crashes; native badge and tray remain healthy. | `NativeStatusAdapter` | Status badge maintains visible pause control and state; main window recovers; no false active state. | Capture visibility preserved; clicking Pause on badge successfully halts capture. |
| **7** | Active screen observation and meeting recording; workstation locks, then unlocks. | `ShellSupervisor` (`SetSessionState`) | Both stop on lock; on unlock, screen observation may resume only if previously active and permitted; audio never auto-resumes. | Screen observation restored; meeting recording remains stopped; notice shown. |
| **8** | Durable user pause exists before workstation sleep or process restart. | [local-privacy-storage](local-privacy-storage.md) | Automatic wake restoration and auto-start preferences cannot override durable employee pause. | Snapshot `employee_paused == true`; status remains **Paused by You** after wake. |
| **9** | Latest validated policy is 24 hours old; workstation remains offline. | [local-privacy-storage](local-privacy-storage.md) | Capture stops immediately even if employee consent is active; recovery blocker `policy_expired` set. | Capture halted at 24h deadline; headline transitions to **Paused by Policy**. |
| **10** | Fresh valid policy arrives after offline policy expiry. | [local-privacy-storage](local-privacy-storage.md) | Policy updates to valid; capture remains stopped behind blocker until employee explicitly clicks Resume. | Capture does not restart automatically; requires intentional employee Resume. |
| **11** | Administrative policy refresh deadline shortened to 1 hour by enterprise. | [identity-policy](identity-policy.md) + [local-privacy-storage](local-privacy-storage.md) | Capture halts after exactly 1 hour; clock rollbacks or reconnect attempts cannot extend lease. | Capture stops at 1h monotonic deadline; status shows **Paused by Policy**. |
| **12** | Unreviewed draft and approved contribution queued; reconnect after policy revocation. | [contribution-sync](contribution-sync.md) | Applies policy restrictions first; discards now-disallowed contribution; never uploads unreviewed draft. | Egress queue validated against fresh policy; zero unauthorized bytes uploaded. |
| **13** | Global shortcut pressed while paused under valid screen consent. | `PresentationCoordinator` | Transmits single `ResumeCapture` with fresh UUID for screen categories; never starts meeting audio. | Screen capture resumes; audio stream remains completely inactive. |
| **14** | Global shortcut pressed while only meeting audio is active. | `PresentationCoordinator` | Executes `PauseCapture(reason="employee")` (Pause All); does not start screen observation. | Meeting audio capture ceases immediately; screen observation remains stopped. |
| **15** | Proposal changes while review dialog is open or response lost. | `IdentityPort` | Detects revision mismatch or unknown delivery; refuses stale approval or blind retry; refreshes state. | Action rejected with `APPROVAL_STALE` or `UNKNOWN_DELIVERY`; no duplicate write. |
| **16** | Organizational OAuth token expires while workstation stays unlocked. | `SessionBroker` | Local private history and privacy controls remain accessible; central sync and privileged actions blocked. | Private history browsable offline; central sync shows offline warning. |
| **17** | Explicit sign-out, followed by login of another employee. | `SessionBroker` | Old tokens purged; memory caches cleared; old profile history locked; new profile isolated. | Zero cross-profile data leakage; history belongs exclusively to active profile. |
| **18** | Direct update downloaded while meeting capture is active. | `ShellSupervisor` | No silent install; prompts employee; requires meeting stop and quiet state before applying update. | Meeting continues uninterrupted until employee chooses to stop and update. |
| **19** | Managed enterprise build or tampered update artifact. | `ShellSupervisor` | Rejects unsigned artifact; disables in-app updater in managed mode; preserves existing data. | Signature check fails; update aborted; previous installation remains intact. |
| **20** | Protocol mismatch, replay into new epoch, or malformed frame. | `PrivacyClient` | Channel closes immediately; capture halts; UI shows **Attention Needed** with error explanation. | Host terminates invalid connection; captures stops within 500ms lease timeout. |
| **21** | Excluded window, secret, or private media reaches UI/log path. | `PresentationCoordinator` + Logger | Excluded window title, URL, or form text never enters status badge, notification, or log file. | Log files and badge text contain zero excluded string matches or raw pixels. |
| **22** | Supported uninstall confirmed with no legal hold. | `ShellSupervisor` -> `PrepareUninstall` | Purge receipt returned; capture stops; helpers terminate; local private data and credentials purged. | Local profile database and credentials deleted; published knowledge intact. |
| **23** | Uninstall encounters legal hold or unknown retention verdict. | [local-privacy-storage](local-privacy-storage.md) | Capture stops permanently; uninstall aborted with `blocked` status; held records preserved. | Local data retained; UI directs employee to contact organizational administrator. |

### Integration and UI Automation Test Suites
- **Unit Tests (Rust Core):** Tests `PresentationCoordinator` deterministic headline logic, command serialization, visibility lease timing, and framing parsers using synthetic mock channels.
- **Unit Tests (React Views):** Headless Vitest tests verifying view rendering, form sanitization, plain-text guidance enforcement, and state projection.
- **Process Integration Tests:** Spawns native shell host and mock helper over real OS socketpairs / pipes; tests handshake failures, crash recovery backoff, and lease expiration.
- **UI Automation (End-to-End):** Automated Playwright / WebDriver tests driving Tauri webviews, verifying navigation, keyboard focus management, and accessibility attributes.

## Performance and operations

### Supported Platform and Architecture Matrix

The Desktop Shell certifies explicit operating system and hardware architecture combinations:

| Operating System | Version Scope | Architecture | Packaging Format | WebView Engine |
|---|---|---|---|---|
| **macOS** | macOS 15 (Sequoia), macOS 26, macOS 27 | Apple Silicon (`aarch64`) & Intel (`x86_64`) | Universal 2 Binary inside signed & notarized `.dmg` (direct) or `.pkg` (MDM managed). | System WebKit (`WKWebView`) |
| **Windows** | Windows 11 (24H2+) | 64-bit x86 (`x64`) | Signed NSIS installer (direct) or signed `.msi` (Active Directory / Intune managed). | Evergreen WebView2 or Bundled Fixed Version |
| **Windows** | Windows 11 (24H2+) | 64-bit ARM (`ARM64`) | Native ARM64 binary packaged via signed NSIS (direct & silent MDM deployment). | Evergreen WebView2 or Bundled Fixed Version |

*Note on Windows ARM64:* Tauri's NSIS installer bootstrapper may execute under Windows Prism emulation, but installs a 100% native `ARM64` application binary and native child helpers.

### Resource Budgets and Acceptance Criteria
All measurements apply to the complete process tree (Host + OS WebView + Privacy Helper + HUD Helper) on reference hardware (Apple M1 8GB SSD / Intel Core i5 8GB SSD / Snapdragon X Elite 16GB SSD / Intel Core i7 16GB SSD):

| Metric | Acceptance Threshold | Measurement Condition |
|---|---|---|
| **Idle Process Tree Memory** | $\le 250\text{ MiB}$ resident set size (RSS) | Native badge visible, main window closed, 10 minutes post 1-minute warmup. Excludes OCR/model processing. |
| **Average Idle CPU Usage** | $\le 1.0\%$ of a single logical core | Background observation active, static screen content, 10-minute sampling window. |
| **Cold Startup Time (Ready)** | $p95 \le 3.0\text{ seconds}$ | From launch command to usable native status badge + initial authoritative snapshot. Measured over 30 cold runs. |
| **Pause Stop Latency** | $p95 \le 100\text{ ms}$ | From employee click / hotkey to capture gate closure in privacy helper. Measured over 100 pause operations. |
| **Host-Loss Fail-Closed Latency** | $\le 500\text{ ms}$ | From abnormal host termination to physical capture gate collapse in child helper. |

### Enterprise Packaging and Update Governance
- **Direct Installs:** Built-in auto-updater downloads signed differential update packages. Verifies Ed25519 digital signature against baked-in public keys before prompting employee. Application updates require explicit employee confirmation and never install during active meetings.
- **Enterprise Managed Installs:** When deployed via Microsoft Intune, SCCM, or Jamf Pro, in-app auto-updates are disabled via administrative configuration (`disable_updater = true` in machine-level policy or registry `HKLM\Software\Policies\Oryn\DisableUpdater`). Central IT controls package distribution via MSI / PKG.

## Architecture decisions and open questions

### Resolved Architecture Decisions (ADR Summary)

1. **[ADR-0001: Desktop Runtime and Presentation Architecture](../adr/0001-desktop-runtime-and-presentation.md)**
   - **Decision:** Build the desktop shell using Tauri 2 (Rust native core + React/TypeScript UI in system WebView). Implement native status surfaces (tray, movable badge, click-through highlights) using AppKit on macOS and Win32 on Windows. Run the privacy gate and evidence store in a separately spawned unprivileged child process communicating over private inherited byte channels.
   - **Rationale:** Minimizes memory footprint compared to Electron; preserves strict memory safety; eliminates listening ports and discoverable socket attacks; ensures recording state remains visible on native surfaces even if WebViews crash.

2. **[ADR-0002: Desktop Capture Lifecycle, Visibility Leases, and Bounded Offline Policy](../adr/0002-desktop-capture-lifecycle.md)**
   - **Decision:** Enforce capture visibility through a 100ms ephemeral visibility lease expired by the capture gate after 500ms. Make employee pause durable across restarts. Mandate explicit resume after crashes, visibility loss, or updates. Cap offline capture policy validity at an absolute maximum of 24 hours.
   - **Rationale:** Guarantees zero invisible capture under any failure mode; prevents accidental capture resumption upon workstation reboot; enforces corporate governance and revocation limits on disconnected endpoints.

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))

1. **Owns exclusively:** Desktop window lifecycle, movable native capture badge, employee capture controls, status presentation across the 7 canonical states, and local UI preferences.
2. **Data ingress/egress:** Ingests authoritative capture snapshots, guidance cards, approval proposals, and notifications; emits validated employee capture commands, guidance feedback, contribution reviews, and approval receipts. Prohibits raw media egress.
3. **Versions/identities:** Application package build, protocol major (`shell-privacy.v1`), session epoch UUID, active tenant ID, and authenticated employee ID.
4. **Upstream failure:** If central control plane is unreachable, the shell operates offline within valid cached policy (up to 24h); local private history and pause controls remain fully functional. If child privacy helper fails, the shell fails closed and displays **Attention Needed**.
5. **Authority:** The employee is authoritative for local capture pause and contribution sharing review; [identity-policy](identity-policy.md) is authoritative for action rights and capture policy leases.
6. **Testing without private details:** Tested via mock IPC streams, synthetic screen geometry events, and headless UI interaction harnesses without requiring real employee screens or audio.
7. **Audit and duplicate prevention:** Commands carry client-generated UUIDs, session epochs, and decimal revision numbers. Duplicate command IDs with identical payloads return cached results; conflicting payloads return `COMMAND_ID_CONFLICT`.
8. **Failure blast radius:** Desktop shell crashes or badge loss immediately collapse the capture gate within 500 ms; underlying business applications and private disk evidence remain safe and uncorrupted.
9. **v1.0 criteria:** Enables ORY-002, ORY-003, ORY-004, ORY-010, and all related presentation requirements verified through interactive walkthroughs and automated integration suites.

### Explicitly Owner-Scoped Dependencies

The Desktop Shell specification resolves all host and presentation architecture requirements. Lower-layer algorithms and backend infrastructure remain explicitly scoped to their respective component owners:
- **Local Evidence Redaction & Storage Engine:** Internal database engine, disk encryption schemes, and OCR/PII redaction algorithms are owned by [local-privacy-storage](local-privacy-storage.md).
- **Task Segmentation & Guidance Ranking Algorithms:** Local task boundary heuristics, playbook similarity math, and fatigue scoring algorithms are owned by [local-context-hud](local-context-hud.md).
- **Central Token Cryptography & Policy Engine:** OIDC identity provider integrations, global authorization token signing algorithms, and enterprise policy DSLs are owned by [identity-policy](identity-policy.md).
- **Sync Transport Protocols:** Cloud synchronization protocols, delta compression, and network outbox patterns are owned by [contribution-sync](contribution-sync.md).

### Primary Implementation References
- [Tauri Process Model](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/concept/process-model.md) — Separation of native Rust core and OS WebView rendering processes.
- [Tauri System Tray](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/learn/system-tray.mdx) — Native system tray configuration and event dispatching.
- [Tauri Capability Isolation](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/security/capabilities.mdx) — Granular per-window IPC command access control.
- [Tauri Signed Updater](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/plugin/updater.mdx) — Mandatory cryptographic signature verification for client auto-updates.
- [Tauri Windows Installer Constraints](https://github.com/tauri-apps/tauri-docs/blob/v2/src/content/docs/distribute/windows-installer.mdx) — NSIS, MSI, and native ARM64 application deployment architectures.
- [Apple Socketpair Manual](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/socketpair.2.html) — POSIX stream socket pairs for secure unprivileged IPC.
- [Microsoft Windows Pipe Inheritance](https://learn.microsoft.com/en-us/windows/win32/ipc/pipe-handle-inheritance) — Anonymous pipe handle inheritance and explicit child handle allowlisting.
- [Microsoft Windows 11 Release Health](https://learn.microsoft.com/en-us/windows/release-health/windows11-release-information) — Supported OS servicing channels and minimum build targets.
- [Apple macOS Release Support](https://support.apple.com/en-us/109033) — macOS lifecycle and platform security updates.
