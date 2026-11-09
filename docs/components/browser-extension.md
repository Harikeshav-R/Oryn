# Browser Extension and Local Browser Bridge Component Specification

Status: Detailed technical specification — implementation pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §4.3](../../TECHNICAL.md) | [PRODUCT.md §§3.3, 3.6, 7.3, 8.1, 12.1, 25.1, 28, 31; ORY-002–005, ORY-009–010, ORY-019, ORY-026–029, ORY-041, ORY-043–045](../../PRODUCT.md)

### Core Responsibility

The Browser Extension and Local Browser Bridge capture high-fidelity, permissioned browser context for supported Google Chrome and Microsoft Edge business applications. The subsystem coordinates a restricted local browser bridge over OS-native messaging, enforces conjunctive privacy and security gates at source, provides deterministic target resolution for non-intrusive contextual guidance overlays, and facilitates strictly authorized local browser actions.

### Owns Exclusively

- **`BrowserCoordinator` (MV3 Service Worker):** Service worker lifecycle, trusted `MessageSender` validation, per-profile bridge state, permission inspection, per-document port connections, and tab-scoped navigation guard coordination.
- **`DocumentObserver` (Isolated-World Content Script):** Permit-gated semantic DOM extraction, independently admitted frame documents, bounded mutation observation, safe element redaction, and local invalidation handling.
- **`TargetResolver` and `DomExecutor`:** Packaged deterministic locator resolution, ephemeral target handle lifecycle, and validated browser action primitives (`read`, `click`, `fill`, `select`, `check`, `navigate`).
- **Packaged `ApplicationProfileRegistry`:** Immutable application profiles, browser and operating system compatibility declarations, business field definitions, record identity schemas, and transition templates.
- **Extension Popup:** Employee-visible pairing challenge display, per-origin optional permission requests, connection and capability status indicators, and direct links to the Desktop Shell pairing interface.
- **Rust `oryn-browser-host` (`oryn-browser-host.exe` on Windows):** Browser-launched native messaging host registered under `com.oryn.browser_bridge`, providing strict native-endian framing, signed-peer attachment, and bounded local routing.
- **Rust `BrowserBridgeBroker` (Shell Native Core):** Authenticated OS-local endpoint attachment, connection token management, and opaque typed message routing between the native host and the desktop shell supervisor.
- **Rust `BrowserGeometryProbe` (Shell Native Core):** Content-free browser window enumeration, desktop/Space visibility calculation, native window exposure, DPI scaling, and display-layout generation tracking, operating independently of the native observation worker.

### Consumes

- Authoritative browser observation permits, category consent, enterprise exclusion policies, and execution gate decisions from [local-privacy-storage](local-privacy-storage.md) via the privacy helper over the dedicated inherited `shell-browser.v1` channel.
- Guidance target queries and step definitions from [local-context-hud](local-context-hud.md) via Contract 21.
- Authorized, cryptographic-bound browser action commands originating from [agent-runtime](agent-runtime.md) and [application-adapters](application-adapters.md).
- Native browser window exposure, occlusion boundaries, and physical display metrics from the shell native core `BrowserGeometryProbe`.

### Produces

- Structured browser observation events conforming to `browser-observation.event.v1` routed to [local-privacy-storage](local-privacy-storage.md).
- Deterministic target presence, physical desktop coordinates, and affine transforms (`BrowserTargetResult`) delivered to [local-context-hud](local-context-hud.md) via Contract 21.
- Immediate action execution receipts (`BrowserActionResult`) detailing local UI dispatch, submission state, and evidence references.

### Does Not Own

- **Central Knowledge Sharing or Direct Cloud Egress:** Owned solely by [contribution-sync](contribution-sync.md). The extension contains zero network clients and zero cloud egress pathways.
- **Autonomous Job Scheduling or Arbitrary Navigation:** Owned by [job-orchestration](job-orchestration.md). The extension executes only bounded actions within an explicitly reserved execution tab.
- **Action Authorization Token Issuance:** Owned by [identity-policy](identity-policy.md). The extension validates incoming authorization tokens and checks one-use nonces; it never issues authority.
- **Business Outcome Verification:** Owned by [outcome-verification](outcome-verification.md). A successful DOM action primitive confirms only local interface dispatch; independent readback determines business success.
- **In-Browser Overlay Rendering or HUD Presentation:** Owned by [desktop-shell](desktop-shell.md). Guidance cards and bounding highlights are rendered in native desktop overlays by the shell; the extension never injects visual markup into page DOM.
- **Global Capture Consent or Retention Authority:** Owned by [local-privacy-storage](local-privacy-storage.md). The extension enforces received permits; it cannot generate or extend observation authority.

### Canonical Domain Concepts

The subsystem introduces and standardizes five canonical domain concepts:

- **Observation Surface:** A specific application window or document context that can be independently permitted or excluded from work observation. *Avoid: Capture target, watched window.*
- **Observation Gap:** A known interval or portion of permitted work for which reliable evidence is unavailable; missing actions remain unknown. *Avoid: Reconstructed activity, assumed step.*
- **Observation Capability:** The declared kinds and limits of work evidence available for a particular application and platform; it grants no authority to observe or execute. *Avoid: Automation support, blanket compatibility.*
- **Browser Work Context:** An approved business account and page context within a browser application that may independently qualify for observation or assistance. *Avoid: Allowed website, browser session.*
- **Reserved Execution Tab:** An employee-visible browser workspace temporarily reserved for one authorized automation, distinct from the employee's ordinary browsing. *Avoid: Hidden worker tab, background bot session.*

### Observation Consent Matrix

Authority over capture categories resides entirely in [local-privacy-storage](local-privacy-storage.md). The browser coordinator executes source permits derived from the conjunction of employee category consent and active corporate policy. The two independent screen observation categories—`visual_work_observation` and `contextual_work_application_recognition`—govern browser acquisition modalities according to the following four-row matrix:

| `visual_work_observation` | `contextual_work_application_recognition` | Browser Subsystem Acquisition Behavior | Downstream Processing and Output |
|---|---|---|---|
| `false` | `false` | **Zero Content Acquisition.** The extension queries minimal document URL origin and committed route solely to evaluate exclusion boundaries. No DOM text, control labels, field values, or screenshots are acquired. | Emits only content-free status events (`CapabilityChanged`, `DocumentLifecycleChanged`, or non-identifying `ObservationGap`). Zero task context or visual evidence is emitted. |
| `false` | `true` | **Structured Context Only.** Queries permitted route identity and extracts settled accessibility nodes and safe labels via `DocumentBaseline` and `ElementStateChanged`. **Zero pixel acquisition.** Platform visual snapshot APIs remain inactive; no screenshots or OCR are executed. | Emits structured DOM semantic events. Downstream privacy storage validates field redaction and delivers live context. No raster images are captured or retained. |
| `true` | `false` | **Privacy-Gated Native Snapshots Only.** The extension performs zero DOM label, value, or text extraction. It supplies only verified window identity, document generation, and protected-region coordinates to the privacy helper. Certified native snapshots are captured by the native observation worker. | Emits `SnapshotAvailable` with masked shared-memory frames captured by the native worker. Privacy storage executes safe local visual extraction and OCR. Zero structured DOM text events are emitted. |
| `true` | `true` | **Full Permitted Modalities.** Acquires both structured DOM semantic observations via the extension and event-triggered visual snapshots via the native observation worker for admitted documents. Maintains separate provenance for structured and visual evidence streams. | Emits both structured browser events and native `SnapshotAvailable` notifications. Downstream components correlate evidence streams using explicit document keys and sequence identifiers. |

#### Personal History Retention Boundary

When `personal_history_retention=false`, durable evidence, timeline entries, search indexes, and candidate task logs are strictly prohibited. However, live local guidance by [local-context-hud](local-context-hud.md) remains authorized if employee consent is active. In this mode:
1. The extension extracts permitted structured observations and emits `BrowserObservation` as normal.
2. [local-privacy-storage](local-privacy-storage.md) holds received observations in bounded volatile memory buffers with an absolute time-to-live of 30 seconds from acquisition.
3. Ephemeral redacted results are delivered to [local-context-hud](local-context-hud.md).
4. If live context components cannot consume or process the observation within 30 seconds, the event is dropped and an `ObservationGap` is recorded.
5. All volatile text, node, and event buffers are zeroed and deallocated immediately upon consumption or expiration. Disabling retention at runtime immediately flushes and zeroes all uncommitted persistence queues. Zero disk cache, database records, search tokens, or durable evidence receipts are created.
6. Separately authorized minimal execution and audit receipts remain governed by execution audit policy; they must not contain captured DOM trees or form values and must never become shadow observation history.

### Document Admission Invariant

A browser document is admitted as an active **Observation Surface** if and only if all conjuncts of the following admission predicate evaluate to `true`:

$$\text{Admitted}(\text{doc}) \iff \text{Paired} \land \text{Enrolled} \land \text{ConsentActive} \land \text{PolicyValid} \land \text{VisibilityHealthy} \land \text{BindingValid} \land \text{CurrentDoc} \land \text{OriginGranted} \land \text{RoutePermitted} \land \text{NonPrivate} \land \text{ModalityValid} \land \text{RegionExposed} \land \text{PermitValid}$$

Where:
- $\text{Paired}$: The browser profile holds a verified, pinned cryptographic key pair paired with the current Desktop Shell installation and organization.
- $\text{Enrolled}$: The employee enrollment status is `ready` in [desktop-shell](desktop-shell.md).
- $\text{ConsentActive}$: Employee consent covers the requested modality according to the Observation Consent Matrix.
- $\text{PolicyValid}$: Active corporate capture policy lease is valid, verified, and unexpired (maximum 24 hours).
- $\text{VisibilityHealthy}$: Desktop shell visibility lease renewal was received within the preceding 500 ms.
- $\text{BindingValid}$: The browser window is correlated to an unambiguous native window handle via the `BrowserGeometryProbe`.
- $\text{CurrentDoc}$: The document ID, frame ID, and generation match the currently committed navigation reported by trusted browser APIs.
- $\text{OriginGranted}$: The web origin is explicitly granted via the browser optional permissions API.
- $\text{RoutePermitted}$: The URL pathname matches an allowed route in an active corporate `WorkContextRule` and does not match any denied pattern.
- $\text{NonPrivate}$: The browser profile and window are verified non-incognito / non-InPrivate.
- $\text{ModalityValid}$: A valid `ApplicationProfile` exists for the application, or generic safe extraction is permitted.
- $\text{RegionExposed}$: The document possesses a non-empty uncovered physical pixel rectangle after subtracting occluding windows.
- $\text{PermitValid}$: An unexpired `GrantObservationPermit` issued by [local-privacy-storage](local-privacy-storage.md) matches the document key.

If any conjunct is unknown, false, or stale, observation for that document or modality is immediately blocked and an explicit `ObservationGap` is recorded. Deny rules win unconditionally over every allow rule.

## Product requirements

### Traceability Matrix ([PRODUCT.md §§3.3, 7.3, 8.1, 12.1, 25.1, 28, 31](../../PRODUCT.md))

| Product Criterion | Requirement Summary | Implementation in Component Specification |
|---|---|---|
| **ORY-002** | Notice and consent acceptance before visual observation. | Enforces `ConsentActive` in Document Admission Invariant. Unconsented modalities produce zero content acquisition. |
| **ORY-003** | Distinguishes active observation, user pause, policy pause, and excluded status. | Subsystem state machine maintains orthogonal states (`active`, `suspended`, `excluded`, `unsupported`). Reports per-profile status and explicit reason codes. |
| **ORY-004** | User pause stops capture until intentional resume; pauses local actions at safe boundary. | Employee pause immediately suspends permits, cancels active target queries, pauses executing browser actions at safe boundaries, and holds pending submissions. |
| **ORY-005** | Excluded applications, private windows, and unadmitted origins contribute zero content. | Evaluates mandatory exclusions, incognito flags, origin grants, and route patterns at source. Password/credential fields masked in isolated content script before transmission. |
| **ORY-009** | Raw local capture expires on retention schedule; 30 s volatile TTL when retention disabled. | Enforces 30 s TTL on all volatile observation buffers when `personal_history_retention=false`. Memory zeroed upon expiration; zero disk writes. |
| **ORY-010** | Settings, exclusions, shared contributions, and consent visible in My Privacy. | Reports granular per-profile pairing state, active origin grants, and observation status to Desktop Shell for display in My Privacy. |
| **ORY-019** | Guidance points to correct business input; does not advance after failed action. | Packaged multi-tier deterministic locators resolve unique element targets. Failure to match unique element emits `TARGET_NOT_FOUND` or `TARGET_AMBIGUOUS` and halts progression. |
| **ORY-026** | Tier 3 action triggers item-level human approval before consequential commit. | Browser action executor checks required `approval_ref` and validates stable `action_sha256` proposal digest before dispatching any Tier 3 action. |
| **ORY-027** | Tier 4 action is unavailable to agents regardless of demonstration. | Application profiles and identity policy reject any Tier 4 operation request; execution is blocked unconditionally at preflight. |
| **ORY-028** | Access restricted to approved applications and records; cross-domain transitions bounded. | Navigation guard uses `declarativeNetRequest` session rules to restrict main-frame and sub-frame navigation strictly to declared transition destinations within approved work contexts. |
| **ORY-029** | Permissions expansion requires new authorization rather than repair. | Adding new web origins, route patterns, or application profiles requires signed policy updates or explicit employee grant gestures; runtime repair cannot expand scope. |
| **ORY-041** | Preflight blocks execution when scope, role, required input, or permissions are invalid. | Preflight checks reservation validity, environment binding, document key, record identity, before-value matches, and fresh cryptographic authorization before dispatch. |
| **ORY-043** | Submitted but unverified consequential action is not marked Verified Complete. | Returning `completed` from `BrowserActionResult` signifies only local UI primitive execution. Business success is deferred to independent readback. |
| **ORY-044** | Uncertain external submission is held to prevent blind duplicate retry. | If bridge disconnects or crashes after action dispatch (`submission_state="unknown"`), action is held as `OUTCOME_UNKNOWN`; automated retry is strictly prohibited. |
| **ORY-045** | Operator can stop future actions and see occurred effects and remaining cases. | Execution release commands immediately cancel outstanding reservations, remove navigation guard rules, and report exact completion status. |

## Upstream and downstream contracts

**Catalog references:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md) (Contract 1, Contract 12, Contract 13, Contract 19, Contract 20, Contract 21)

### Cross-Component Contracts

- **Contract 1 (Raw Candidate Observations and Reverse Source Permits):**
  - **Producer:** [browser-extension](browser-extension.md)
  - **Consumer:** [local-privacy-storage](local-privacy-storage.md) via Privacy Helper
  - **Transport:** Inherited stream socket/pipe channel 3 (`shell-browser.v1`) negotiated via `shell-privacy.v1` major 1, minor 1.
  - **Boundary Invariant:** Raw candidate DOM observations and lifecycle events flow upstream; reverse permits (`GrantObservationPermit`, `RevokeObservationPermit`) flow downstream. Max frame size is 262,144 bytes. Permitted observations carry strict document generations and monotonic sequences. Zero raw DOM crosses the primary capture control channel (Contract 19).
- **Contract 12 (Authorized External Operation):**
  - **Producer:** [agent-runtime](agent-runtime.md) / [application-adapters](application-adapters.md)
  - **Consumer:** [browser-extension](browser-extension.md)
  - **Transport:** Routed through Privacy Helper and native broker over `browser-bridge.v1`.
  - **Boundary Invariant:** Execution requests (`ExecuteBrowserAction`) must include cryptographic `authorization_ref`, stable `action_sha256`, target key, record key, and expected before-state. Operates strictly within a reserved execution tab.
- **Contract 13 (Submission Records and Readback Evidence):**
  - **Producer:** [browser-extension](browser-extension.md)
  - **Consumer:** [outcome-verification](outcome-verification.md) / [agent-runtime](agent-runtime.md)
  - **Boundary Invariant:** Emits `BrowserActionResult` with granular `submission_state` (`not_dispatched`, `dispatched`, `application_acknowledged`, `unknown`). Distinguishes primitive dispatch success from business outcome verification.
- **Contract 19 (Capture Control, Ephemeral Visibility Lease, and State Subscription):**
  - **Producer:** [desktop-shell](desktop-shell.md)
  - **Consumer:** [local-privacy-storage](local-privacy-storage.md)
  - **Boundary Invariant:** Shell controls capture state, monitors visibility lease (500 ms cutoff), and subscribes to authoritative aggregated capture state (`sources: CaptureSourceState[]`). Negotiates minor 1 to activate channel 3.
- **Contract 20 (HUD Guidance Presentation):**
  - **Producer:** [local-context-hud](local-context-hud.md)
  - **Consumer:** [desktop-shell](desktop-shell.md)
  - **Boundary Invariant:** Shell hosts all presentation windows; HUD produces structured models and tracks guide progression.
- **Contract 21 (Browser Target Resolution):**
  - **Producer:** [local-context-hud](local-context-hud.md)
  - **Consumer:** [browser-extension](browser-extension.md) via Privacy Helper
  - **Transport:** Bidirectional JSON query over `shell-browser.v1` and `browser-bridge.v1`.
  - **Boundary Invariant:** HUD queries live target presence and geometry (`ResolveBrowserTarget`); extension resolves packaged locators against live DOM and returns physical desktop bounds and affine transforms (`BrowserTargetResult`). Stale generation or missing element returns immediate error; HUD falls back to text-only guidance if geometry cannot be proven.

## Trust and deployment boundaries

### Manifest V3 Specification

The extension is implemented in TypeScript, compiled to packaged JavaScript, and executes under Manifest V3. An illustrative production manifest is defined below:

```json
{
  "manifest_version": 3,
  "name": "Oryn Work Companion",
  "version": "1.0.0",
  "description": "Enterprise browser context observation and assisted execution bridge for Oryn.",
  "minimum_chrome_version": "120",
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "permissions": [
    "nativeMessaging",
    "storage",
    "scripting",
    "webNavigation",
    "declarativeNetRequest"
  ],
  "optional_host_permissions": [
    "https://*/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Oryn Companion Status"
  },
  "incognito": "not_allowed",
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none';"
  }
}
```

#### Permission and Security Boundary Rules

1. **Install-Time Required Permissions:**
   - `nativeMessaging`: Required to communicate with the browser-launched host (`com.oryn.browser_bridge`).
   - `storage`: Required for `chrome.storage.session` to retain ephemeral instance IDs across service worker termination.
   - `scripting`: Required to inject isolated-world content scripts dynamically into explicitly permitted tabs and frames.
   - `webNavigation`: Required to detect committed navigations, document replacements, and frame lifecycles without reading page content.
   - `declarativeNetRequest`: Required at install time to enforce main-frame and sub-frame navigation restrictions during execution. Chrome explicitly does not permit `declarativeNetRequest` as an optional permission; it is declared statically and scoped session rules are activated only during authorized execution reservations.
2. **Optional Host Permissions:**
   - Declaring `optional_host_permissions: ["https://*/*"]` grants zero websites at installation. It establishes the capability to request exact approved work origins at runtime via `chrome.permissions.request()`.
   - Wildcards are strictly prohibited in runtime requests: the extension requests only exact enterprise-approved work origins (e.g. `https://finance.corp.example.com`).
   - Standard HTTPS on default port 443 is required in v1; unsupported schemes (`http:`, `file:`, `chrome:`, `edge:`) and non-standard ports remain restricted.
3. **Prohibited Permissions:**
   - No broad static `host_permissions`.
   - Zero static all-site content scripts.
   - No sensitive `tabs` permission (lifecycle APIs operate without sensitive URL fields).
   - No `debugger`, `cookies`, `history`, `downloads`, `webRequest`, `clipboardRead`, `desktopCapture`, or `tabCapture` permissions.
4. **Incognito and Private Browsing Exclusion:**
   - `incognito: "not_allowed"` ensures the extension is not enabled in private browsing windows by default.
   - The service worker additionally validates `sender.tab.incognito === false` before accepting any message. If incognito or guest mode is detected, the sender is rejected immediately.
5. **Content Script Injection Policy:**
   - Injected exclusively via `chrome.scripting.registerContentScripts` or `chrome.scripting.executeScript` into explicitly granted origins and approved route patterns.
   - Always registered with `persistAcrossSessions: false`, `match_about_blank: false`, and `match_origin_as_fallback: false`.
   - Injected strictly into the browser `ISOLATED` world. Content scripts have their own browser-enforced sandbox and cannot access `MAIN` world JavaScript objects or prototypes.
   - Never injected into browser-internal pages (`chrome://`, `edge://`, `about:`), extension pages, file URLs, data URIs, blob URIs, authentication endpoints, or opaque-origin documents.
6. **Zero Cloud Egress Architecture:**
   - Extension page CSP specifies `connect-src 'none'`.
   - Content scripts contain no network clients (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` are prohibited). All data flows exclusively through the runtime port to the service worker, and through the native port to `oryn-browser-host`.
   - Host permissions allow DOM access upon employee approval; they do not authorize background network transmission.

### OS Local Attachment and Broker Endpoints

The native messaging host `oryn-browser-host` (`com.oryn.browser_bridge`) is launched by Chrome or Edge as a child process of the browser and communicates with the Desktop Shell native core over an authenticated local endpoint:

- **macOS:** Unix domain stream socket at `~/Library/Application Support/Oryn/run/browser-bridge.sock`.
  - Directory permissions: Owner current UID, mode `0700`.
  - Socket permissions: Owner current UID, mode `0600`. Symlinks are rejected via `O_NOFOLLOW`.
  - Peer verification: The shell broker queries `LOCAL_PEERPID` and `LOCAL_PEERCRED` via `getsockopt` to verify the peer process runs under the identical UID and belongs to an authentic `oryn-browser-host` executable signed with the Oryn developer ID.
- **Windows:** Dedicated named pipe at `\\.\pipe\Oryn.BrowserBridge.<user-SID>.<logon-LUID>`.
  - Access Control: Custom DACL granting access strictly to the token of the current logon session (`user-SID`) and rejecting network callers (`PIPE_REJECT_REMOTE_CLIENTS`).
  - Peer verification: The shell broker interrogates client process ID via `GetNamedPipeClientProcessId` and verifies the Authenticode digital signature and path of `oryn-browser-host.exe`.

The desktop shell native core creates and listens on this endpoint. The shell never replaces an active endpoint owned by another live process.

### Initial Pairing and WebCrypto Authentication Sequence

To prevent unsolicited or cross-profile connections, every browser profile must execute an explicit mutual pairing sequence with the Desktop Shell:

```
Extension Popup / Worker               Native Host / Shell Broker
          |                                        |
          | ----- BridgeHello -------------------> |
          | <---- BridgeChallenge ---------------- |
          |                                        |
  [Pairing Required: Profile Unpaired]             |
          | <---- PairingChallenge --------------- |
          |                                        |
  [Display 6-Digit Code in Popup]         [Display 6-Digit Code in Shell]
  [Employee confirms matching code and organization in Shell UI]
          |                                        |
          | ----- BridgeAuthenticate ------------> |
          |       (RFC 8785 JSON Signature)        |
          | <---- BridgeReady -------------------- |
          |       (Ephemeral Connection Token)     |
```

1. **Key Generation:** Before issuing `BridgeHello`, the extension service worker generates a nonextractable P-256 (`ECDSA` with `P-256` curve and `SHA-256`) key pair via `crypto.subtle.generateKey`. The private `CryptoKey` is stored in extension-origin IndexedDB solely for pairing identity; the public key JWK, `profile_id` (UUIDv4), and `enrollment_id` are stored in extension storage. Nonextractable keys cannot be read by web pages or content scripts.
2. **Initial Pairing Challenge:** If the public key thumbprint is not yet pinned in the shell credential store:
   - The broker generates a cryptographically secure 6-digit numeric comparison code (valid for 60 seconds) and emits `PairingChallenge`.
   - The comparison code and profile key thumbprint are displayed simultaneously in the extension popup and the native Desktop Shell pairing dialog.
   - The employee must explicitly confirm in the Desktop Shell UI that the codes match and approve the binding to their active organization and enrollment.
   - Three failed attempts expire the request and place the bridge into `blocked` state. Managed enterprise deployments do not bypass employee confirmation.
3. **Key Pinning:** Upon employee approval, the shell stores the public key thumbprint (SHA-256 over canonical JWK), `profile_id`, `employee_id`, and `organization_id` in the OS-protected credential store (macOS Keychain / Windows Credential Manager).
4. **Per-Connection Mutual Authentication:** On every connection establishment:
   - The broker sends a fresh 256-bit `broker_nonce` and `session_epoch` in `BridgeChallenge`.
   - The extension constructs an RFC 8785 canonical JSON transcript:
     ```json
     {
       "broker_nonce": "9f83b2a1c0d44e5f67890123456789ab",
       "client_nonce": "4a1c7e9b20d34f8a1122334455667788",
       "enrollment_id": "enr_01928374-abcd-7890-bcde-f0123456789a",
       "extension_id": "com.oryn.extension.chrome",
       "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
       "protocol_version": "browser-bridge.v1",
       "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1"
     }
     ```
   - The extension signs this transcript using its private key and sends `BridgeAuthenticate` containing the base64url-encoded raw IEEE-P1363 64-byte signature (`r || s`).
   - The broker verifies the signature against the pinned public key within a strict 3,000 ms handshake deadline.
   - Upon successful verification, the broker issues `BridgeReady` with an ephemeral 256-bit `connection_token`.
5. **Token Lifetime and Isolation:** The bearer token is held strictly in service worker volatile memory and native shell memory. It is never written to IndexedDB, `localStorage`, `chrome.storage.local`, DOM attributes, content scripts, log files, or URLs. Switching organizations or resetting enrollment immediately clears all stored keys and requires fresh pairing.

## Internal architecture

### Submodule Breakdown

```
+---------------------------------------------------------------------------------+
| Google Chrome / Microsoft Edge Profile Sandbox                                  |
|                                                                                 |
|  +--------------------+         +--------------------------------------------+  |
|  | Extension Popup    |         | MV3 Service Worker: BrowserCoordinator     |  |
|  | - Pairing Challenge|         | - MessageSender Validation                 |  |
|  | - Origin Grants    |         | - WebNavigation / Port Tracking            |  |
|  | - Capability Status|         | - DNR Session Navigation Guard             |  |
|  +---------+----------+         +---------------------+----------------------+  |
|            |                                          |                         |
|            | Runtime Ports                            | Runtime Ports           |
|            v                                          v                         |
|  +----------------------------------------------------+----------------------+  |
|  | DocumentObserver (ISOLATED World Content Script)                          |  |
|  | - Permit-Gated Semantic Extraction    - Safe Redaction Filter             |  |
|  | - Bounded Mutation Observer (100 ms)  - Local Postcondition Checker       |  |
|  +----------------------------------------------------+----------------------+  |
|  | TargetResolver & DomExecutor (ISOLATED World)                             |  |
|  | - Multi-Tier Packaged Locators        - Ephemeral Target Handles (250 ms) |  |
|  | - Validated Action Primitives         - Synthetic Event Dispatch          |  |
|  +---------------------------------------------------------------------------+  |
+---------------------------------------+-----------------------------------------+
                                        | Native Messaging Port (Native-Endian)
                                        v
+---------------------------------------------------------------------------------+
| Native Host: oryn-browser-host (com.oryn.browser_bridge)                        |
| - 262,144 Byte Frame Boundary Enforcement                                       |
| - Authenticated OS Endpoint Routing (Big-Endian)                                |
+---------------------------------------+-----------------------------------------+
                                        | OS Socket / Named Pipe (Big-Endian)
                                        v
+---------------------------------------------------------------------------------+
| Desktop Shell Native Core: BrowserBridgeBroker & BrowserGeometryProbe           |
| - Authenticated Session Token Gate       - Content-Free Window Correlation      |
| - Affine Viewport Desktop Transform      - Watchdog Heartbeat Monitoring        |
+---------------------------------------+-----------------------------------------+
                                        | Inherited Channel 3: shell-browser.v1
                                        v
+---------------------------------------------------------------------------------+
| Privacy Helper: oryn-privacy-helper (Contract 1 / 19 / 21 Authority)            |
| - Authoritative Permit Issuance          - Work Context Route & Account Filter  |
| - Retention TTL & Masking Validation     - Action Authorization Nonce Check     |
+---------------------------------------------------------------------------------+
```

### Identity and Permits

#### Browser Document Key Schema

Every browser document context is uniquely identified by the immutable `DocumentKey`:

```typescript
export interface DocumentKey {
  profile_id: string;              // UUIDv4 of the paired browser profile
  browser_instance_id: string;     // UUIDv4 retained in chrome.storage.session
  window_id: number;               // Browser API integer window identifier
  tab_id: number;                  // Browser API integer tab identifier
  frame_id: number;                // 0 for top-level frame; positive integer for sub-frames
  document_id: string;             // Opaque UUIDv4 assigned at document commit
  document_generation: string;     // Decimal string u64 incremented on commit/reload
}
```

- Browser integer IDs (`window_id`, `tab_id`, `frame_id`) may be recycled by the browser engine; they are never used as standalone durable identifiers.
- `browser_instance_id` is generated in `chrome.storage.session`. It survives background service worker restarts but is cleared and regenerated upon browser exit or extension reload.
- The service worker derives window, tab, frame, and document attributes strictly from trusted browser `MessageSender` properties. Caller-supplied routing headers from content scripts are discarded.

#### Native Window Correlation and Viewport Transform

The Desktop Shell `BrowserGeometryProbe` correlates browser window identities with native operating system window handles without inspecting web page content:
1. **Content-Free Sampling:** The probe enumerates running processes, verifies the signed browser binary path, and queries native window rectangles, desktop/Space assignments, and z-order. It never reads URL bars, page titles, tab headers, accessibility trees, or pixels.
2. **Ambiguity Resolution:** Window correlation matches extension-reported window bounds against native rectangles across two consecutive 100 ms samples.
   - If exactly one native window matches the active bounds and focus state, the tuple is bound to an opaque `binding_id` with an incrementing decimal string `binding_generation`.
   - If multiple candidates exist or bounds are ambiguous, the probe requests employee window focus or emits `ObservationGap(reason="binding_ambiguous")`. Coordinates are never guessed.
3. **Calibrated Viewport Transform:** For top-level and same-origin frames, element viewport rectangles are transformed into physical desktop pixels using a verified affine transform:
   $$\begin{bmatrix} X_{\text{desktop}} \\ Y_{\text{desktop}} \end{bmatrix} = \begin{bmatrix} m_{11} & m_{12} \\ m_{21} & m_{22} \end{bmatrix} \begin{bmatrix} x_{\text{viewport}} \\ y_{\text{viewport}} \end{bmatrix} + \begin{bmatrix} d_x \\ d_y \end{bmatrix}$$
   Accounting for browser chrome offsets, display DPI scaling, browser zoom level, visual viewport scroll offsets, and multi-monitor coordinates. Non-finite or singular transforms cause immediate fallback to unlocated guidance.

#### Extension-Bound Native Snapshots

When `visual_work_observation=true` is consented, visual snapshots of browser windows are captured by the native observation worker (`oryn-observation-worker`), not by extension screenshot APIs:
- Requires an active `SurfaceValidationRecord` with `surface_kind: "browser_extension_bound"`.
- The native permit `GrantObservationPermit` is augmented with an optional `browser_binding` record:
  ```typescript
  export interface BrowserBindingPermit {
    binding_id: string;
    binding_generation: string;
    profile_id: string;
    browser_instance_id: string;
    window_id: number;
    tab_id: number;
    document_id: string;
    document_generation: string;
    browser_surface_revision: string;
    validation_id: string;
  }
  ```
- Before triggering a native snapshot, the privacy helper verifies that the native window binding, document generation, and exposure calculation remain unexpired. Any occluded, unadmitted, or protected-input region reported by the extension is masked to opaque-black `(0, 0, 0, 255)` in shared memory before delivery.

#### Browser Observation Arbitration

1. **Connected Extension Rule:** When an authenticated extension is active and bound to a window, the extension is authoritative for web semantics, DOM structure, and navigation events. Native accessibility queries for that window are suppressed.
2. **Native Fallback Certification:** If the extension is disconnected, native observation extracts browser accessibility context only if strict certification conditions hold: Chrome `IncognitoModeAvailability=1` or Edge `InPrivateModeAvailability=1` with empty URL allowlists, an active `SurfaceValidationRecord`, and verified enterprise management. Otherwise, the surface is marked `unsupported_surface` and an `ObservationGap` is emitted.
3. **Modality Isolation:** A crash of the native observation worker terminates native snapshot acquisition but does not stop healthy browser semantic extraction.

### Wire Protocol `browser-bridge.v1`

Protocol `browser-bridge.v1` operates over two length-prefixed transports:
- **Browser <-> Native Host:** Chrome/Edge Native Messaging framing. 4-byte native-endian unsigned length ($0 < \text{length} \le 262{,}144$). Max payload is 262,144 bytes (256 KiB).
- **Host <-> Shell Broker:** 4-byte big-endian unsigned length ($0 < \text{length} \le 262{,}144$). Identical 262,144 byte maximum payload.

#### Paired Message Common Envelope

All paired messages exchange a standard JSON envelope:

```typescript
export interface PairedBridgeEnvelope {
  protocol_version: "browser-bridge.v1";
  message_id: string;              // UUIDv4
  session_epoch: string;           // UUIDv4 of Desktop Shell supervisor session
  bridge_epoch: string;            // UUIDv4 of current native bridge session
  organization_id: string;         // Enrolled enterprise organization ID
  employee_id: string;             // Enrolled employee identity
  profile_id: string;              // Paired browser profile UUIDv4
  sequence: string;                // Monotonic decimal string u64 per direction
  correlation_id: string | null;   // UUIDv4 matching query request, or null
  connection_token: string;        // 256-bit hex bearer token issued in BridgeReady
  type: BridgeMessageType;
  payload: BridgeMessagePayload;
}
```

#### Protocol Message Inventory and Synthetic Payloads

##### 1. `BridgeHello` (Extension -> Host/Broker)
Sent immediately upon native port connection. Pre-pair message; omits paired envelope.

```json
{
  "type": "BridgeHello",
  "protocol_version": "browser-bridge.v1",
  "protocol_major": 1,
  "protocol_minor": 0,
  "extension_id": "com.oryn.extension.chrome",
  "extension_version": "1.0.0",
  "browser_family": "chrome",
  "browser_build": "120.0.6099.109",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "enrollment_id": "enr_01928374-abcd-7890-bcde-f0123456789a",
  "client_nonce": "4a1c7e9b20d34f8a1122334455667788",
  "public_key_jwk": {
    "kty": "EC",
    "crv": "P-256",
    "x": "W8X2q4lK5o9rTtY1uV3wX5yZ7aB9cDsEfGhIjKlMnOp",
    "y": "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfG"
  }
}
```

##### 2. `BridgeChallenge` (Broker -> Extension)
Pre-pair message returning broker nonce.

```json
{
  "type": "BridgeChallenge",
  "protocol_version": "browser-bridge.v1",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "broker_nonce": "9f83b2a1c0d44e5f67890123456789ab",
  "expires_at_utc": "2026-11-09T10:00:03.000Z"
}
```

##### 3. `BridgeAuthenticate` (Extension -> Broker)
Pre-pair message submitting P-256 IEEE-P1363 signature over canonical RFC 8785 transcript.

```json
{
  "type": "BridgeAuthenticate",
  "protocol_version": "browser-bridge.v1",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "enrollment_id": "enr_01928374-abcd-7890-bcde-f0123456789a",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "client_nonce": "4a1c7e9b20d34f8a1122334455667788",
  "broker_nonce": "9f83b2a1c0d44e5f67890123456789ab",
  "signature": "MEQCID3k8l_x_signature_sample_base64url_raw_p1363"
}
```

##### 4. `PairingChallenge` (Broker -> Extension)
Emitted when an unpinned profile initiates connection.

```json
{
  "type": "PairingChallenge",
  "protocol_version": "browser-bridge.v1",
  "pairing_id": "pair_771a02b3-9c8d-4e5f-1122-334455667788",
  "comparison_code": "842915",
  "profile_key_thumbprint": "sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "organization_name": "Enterprise Solutions Corp",
  "expires_at_utc": "2026-11-09T10:01:00.000Z"
}
```

##### 5. `BridgeReady` (Broker/Helper -> Extension)
Establishes active bridge session and issues connection token.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0001-7000-8000-000000000001",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "1",
  "correlation_id": null,
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "BridgeReady",
  "payload": {
    "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
    "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
    "organization_id": "org_enterprise_corp",
    "employee_id": "emp_harikeshav_r",
    "enrollment_id": "enr_01928374-abcd-7890-bcde-f0123456789a",
    "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
    "limits": {
      "max_message_bytes": 262144,
      "max_nodes": 512,
      "max_depth": 12,
      "max_label_bytes": 256,
      "max_value_bytes": 1024,
      "max_queue_events": 64,
      "max_queue_bytes": 1048576,
      "permit_renewal_ms": 100,
      "max_permit_ttl_ms": 300,
      "bridge_watchdog_ms": 500,
      "max_target_ttl_ms": 250,
      "volatile_content_ttl_ms": 30000
    },
    "policy_revision": "1420",
    "consent_revision": "1420"
  }
}
```

##### 6. `ReplaceBrowserPolicy` (Privacy Helper -> Extension)
Transmits active corporate work context rules, category consents, and profile disablement.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0002-7000-8000-000000000002",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "2",
  "correlation_id": null,
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "ReplaceBrowserPolicy",
  "payload": {
    "policy_revision": "1421",
    "consent_revision": "1420",
    "scope_generation": "1",
    "visual_work_observation": true,
    "contextual_work_application_recognition": true,
    "personal_history_retention": true,
    "work_contexts": [
      {
        "work_context_id": "ctx_finance_invoicing",
        "origin": "https://finance.corp.example.com",
        "routes": [
          {
            "route_id": "rt_invoice_list",
            "path_pattern": "/invoices",
            "allow_observation": true,
            "allow_execution": true
          },
          {
            "route_id": "rt_invoice_detail",
            "path_pattern": "/invoices/*",
            "allow_observation": true,
            "allow_execution": true
          }
        ],
        "denied_route_patterns": [
          "/invoices/*/credentials",
          "/invoices/*/tax-id-reveal"
        ],
        "required_work_account_rule": {
          "kind": "tenant_header_or_marker",
          "marker_attribute": "data-tenant-id",
          "expected_value": "tenant_enterprise_corp"
        },
        "application_profile_id": "prof_app_finance_invoicing_v1"
      }
    ],
    "disabled_application_profile_ids": [],
    "disabled_validation_ids": []
  }
}
```

##### 7. `DocumentCandidate` (Extension -> Helper)
Content-free document announcement upon committed navigation.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0003-7000-8000-000000000003",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "1",
  "correlation_id": null,
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "DocumentCandidate",
  "payload": {
    "document": {
      "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
      "browser_instance_id": "ins_12345678-abcd-ef01-2345-6789abcdef01",
      "window_id": 1042,
      "tab_id": 481,
      "frame_id": 0,
      "document_id": "doc_99887766-5544-3322-1100-aabbccddeeff",
      "document_generation": "1"
    },
    "origin": "https://finance.corp.example.com",
    "route_id": "rt_invoice_detail",
    "work_context_id": "ctx_finance_invoicing",
    "application_profile_id": "prof_app_finance_invoicing_v1",
    "private_mode": false,
    "visibility_state": "visible",
    "browser_surface_revision": "1",
    "request_nonce": "non_01928374-1234-7000-8000-000000000001"
  }
}
```

##### 8. `RequestBrowserPermit` (Extension -> Helper)
Permit renewal request emitted every 100 ms while document remains active.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0004-7000-8000-000000000004",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "2",
  "correlation_id": null,
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "RequestBrowserPermit",
  "payload": {
    "document": {
      "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
      "browser_instance_id": "ins_12345678-abcd-ef01-2345-6789abcdef01",
      "window_id": 1042,
      "tab_id": 481,
      "frame_id": 0,
      "document_id": "doc_99887766-5544-3322-1100-aabbccddeeff",
      "document_generation": "1"
    },
    "binding_id": "bnd_win_1042_019283",
    "binding_generation": "1",
    "browser_surface_revision": "1",
    "request_nonce": "non_01928374-1234-7000-8000-000000000002",
    "request_structured_content": true,
    "request_snapshot": true
  }
}
```

##### 9. `GrantObservationPermit` (Helper -> Extension)
Authoritative temporary observation authority.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0005-7000-8000-000000000005",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "3",
  "correlation_id": null,
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "GrantObservationPermit",
  "payload": {
    "permit_id": "pmt_brw_01928374-4b21-4f12-9c10-223344556677",
    "document": {
      "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
      "browser_instance_id": "ins_12345678-abcd-ef01-2345-6789abcdef01",
      "window_id": 1042,
      "tab_id": 481,
      "frame_id": 0,
      "document_id": "doc_99887766-5544-3322-1100-aabbccddeeff",
      "document_generation": "1"
    },
    "binding_id": "bnd_win_1042_019283",
    "binding_generation": "1",
    "surface_id": "surf_brw_tab_481_doc_998877",
    "surface_generation": "1",
    "scope_generation": "1",
    "policy_revision": "1421",
    "consent_revision": "1420",
    "allow_structured_content": true,
    "allow_snapshot": true,
    "request_nonce": "non_01928374-1234-7000-8000-000000000002",
    "ttl_ms": 300
  }
}
```

##### 10. `RevokeObservationPermit` (Helper -> Extension)
Explicit permit revocation.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0006-7000-8000-000000000006",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "4",
  "correlation_id": null,
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "RevokeObservationPermit",
  "payload": {
    "permit_id": "pmt_brw_01928374-4b21-4f12-9c10-223344556677",
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
    "reason_code": "window_hidden"
  }
}
```

##### 11. `BrowserObservation` (Extension -> Helper)
Wraps a single `BrowserObservationEvent`.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0007-7000-8000-000000000007",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "3",
  "correlation_id": null,
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "BrowserObservation",
  "payload": {
    "event": {
      "schema_version": "browser-observation.event.v1",
      "event_id": "evt_01928374-5555-7000-8000-000000000001",
      "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
      "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
      "sequence": "1",
      "document": {
        "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
        "browser_instance_id": "ins_12345678-abcd-ef01-2345-6789abcdef01",
        "window_id": 1042,
        "tab_id": 481,
        "frame_id": 0,
        "document_id": "doc_99887766-5544-3322-1100-aabbccddeeff",
        "document_generation": "1"
      },
      "surface_id": "surf_brw_tab_481_doc_998877",
      "surface_generation": "1",
      "scope_generation": "1",
      "policy_revision": "1421",
      "consent_revision": "1420",
      "permit_id": "pmt_brw_01928374-4b21-4f12-9c10-223344556677",
      "browser_tick_ms": "142589.20",
      "accepted_at_utc": "2026-11-09T10:00:15.120Z",
      "accepted_mono_ns": "128450423456789",
      "source": "browser",
      "availability": "available",
      "fidelity": "structured",
      "payload": {
        "kind": "ElementStateChanged",
        "tree_version": "1",
        "node": {
          "element_id": "elem_inv_status_badge",
          "tree_version": "1",
          "role": "text",
          "states": ["enabled"],
          "label": "Invoice Status",
          "value": "Pending Review",
          "value_field_key": "status",
          "bounds": {
            "x": 240,
            "y": 180,
            "width": 140,
            "height": 32
          },
          "visibility_proof": "intersection_observer_proven",
          "text_truncated": false
        }
      }
    }
  }
}
```

##### 12. `RequestBrowserBaseline` (Helper -> Extension)
Requests full baseline after resync or overflow.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0008-7000-8000-000000000008",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "5",
  "correlation_id": null,
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "RequestBrowserBaseline",
  "payload": {
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
    "reason_code": "queue_overflow"
  }
}
```

##### 13. `ResolveBrowserTarget` (HUD -> Extension via Helper)
Queries target geometry for step guidance rendering (Contract 21).

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0009-7000-8000-000000000009",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "6",
  "correlation_id": "cor_hud_req_01928374-9999",
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
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
    "context_revision": "1421"
  }
}
```

##### 14. `BrowserTargetResult` (Extension -> HUD via Helper)
Returns resolved ephemeral target handle and desktop geometry.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0010-7000-8000-000000000010",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "4",
  "correlation_id": "cor_hud_req_01928374-9999",
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
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
    "context_revision": "1421",
    "geometry": {
      "rect": {
        "x": 620,
        "y": 450,
        "width": 120,
        "height": 40
      },
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

##### 15. `ReserveBrowserExecution` (Adapter -> Extension via Helper)
Requests exclusive device-wide browser execution reservation.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0011-7000-8000-000000000011",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "7",
  "correlation_id": "cor_res_01928374-8888",
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "ReserveBrowserExecution",
  "payload": {
    "reservation_id": "res_exec_01928374-0001",
    "job_id": "job_batch_invoice_audit_01",
    "case_id": "case_inv_99882",
    "mode": "job",
    "document": null,
    "application_profile_id": "prof_app_finance_invoicing_v1",
    "application_profile_version": "1.0.0",
    "launch_transition_id": "trans_open_invoices",
    "allowed_transitions": ["trans_open_invoices", "trans_view_invoice_detail"],
    "environment": "production"
  }
}
```

##### 16. `BrowserExecutionReservation` (Extension -> Adapter via Helper)
Acknowledges reservation and reports reserved window/tab IDs.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0012-7000-8000-000000000012",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "5",
  "correlation_id": "cor_res_01928374-8888",
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "BrowserExecutionReservation",
  "payload": {
    "reservation_id": "res_exec_01928374-0001",
    "status": "reserved",
    "browser_instance_id": "ins_12345678-abcd-ef01-2345-6789abcdef01",
    "window_id": 1045,
    "tab_id": 490,
    "document": null,
    "reason_code": null
  }
}
```

##### 17. `ExecuteBrowserAction` (Adapter -> Extension via Helper)
Commands execution of a single validated action primitive.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0013-7000-8000-000000000013",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "8",
  "correlation_id": "cor_act_01928374-7777",
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "ExecuteBrowserAction",
  "payload": {
    "action_id": "act_01928374-click-approve-0001",
    "reservation_id": "res_exec_01928374-0001",
    "job_id": "job_batch_invoice_audit_01",
    "case_id": "case_inv_99882",
    "agent_version": "2026.11.08.1",
    "application_profile_id": "prof_app_finance_invoicing_v1",
    "application_profile_version": "1.0.0",
    "document": {
      "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
      "browser_instance_id": "ins_12345678-abcd-ef01-2345-6789abcdef01",
      "window_id": 1045,
      "tab_id": 490,
      "frame_id": 0,
      "document_id": "doc_88776655-4433-2211-0099-aabbccddeeff",
      "document_generation": "2"
    },
    "surface_generation": "2",
    "target_key": "target_approve_button",
    "target_handle": "hnd_01928374-tgt-approve-btn-250ms",
    "record_key": "rec_inv_99882",
    "expected_state": {
      "record_revision": "12",
      "fields": [
        {
          "field_key": "status",
          "value": "Pending Review"
        },
        {
          "field_key": "invoice_total",
          "value": "1450.00"
        }
      ]
    },
    "environment": "production",
    "operation": "click",
    "argument": null,
    "action_sha256": "sha256_b3f0e1d2c3b4a596877869504132231405162738495a6b7c8d9e0f1a2b3c4d5e",
    "authorization_ref": "auth_tok_01928374-p256-signed-jwt-token",
    "approval_ref": "appr_receipt_01928374-operator-signature",
    "deadline_ms": 3000
  }
}
```

##### 18. `BrowserActionResult` (Extension -> Adapter via Helper)
Reports immediate dispatch and local submission status.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0014-7000-8000-000000000014",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "6",
  "correlation_id": "cor_act_01928374-7777",
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "BrowserActionResult",
  "payload": {
    "action_id": "act_01928374-click-approve-0001",
    "reservation_id": "res_exec_01928374-0001",
    "status": "completed",
    "submission_state": "application_acknowledged",
    "reason_code": null,
    "evidence_ref": "ev_act_01928374-local-dom-mutation-proof",
    "document": {
      "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
      "browser_instance_id": "ins_12345678-abcd-ef01-2345-6789abcdef01",
      "window_id": 1045,
      "tab_id": 490,
      "frame_id": 0,
      "document_id": "doc_88776655-4433-2211-0099-aabbccddeeff",
      "document_generation": "2"
    },
    "record_key": "rec_inv_99882"
  }
}
```

##### 19. `ReleaseBrowserExecution` (Helper -> Extension)
Releases execution reservation and clears navigation guards.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0015-7000-8000-000000000015",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "9",
  "correlation_id": null,
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "ReleaseBrowserExecution",
  "payload": {
    "reservation_id": "res_exec_01928374-0001",
    "reason_code": "job_completed"
  }
}
```

##### 20. `BrowserHeartbeat` (Bidirectional)
Content-free watchdog ping emitted every 100 ms.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0016-7000-8000-000000000016",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "7",
  "correlation_id": null,
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "BrowserHeartbeat",
  "payload": {
    "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
    "last_received_sequence": "9",
    "source_health": "ready"
  }
}
```

##### 21. `BridgeError` (Bidirectional)
Reports structured protocol or execution errors.

```json
{
  "protocol_version": "browser-bridge.v1",
  "message_id": "msg_01928374-0017-7000-8000-000000000017",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "bridge_epoch": "brg_11223344-5566-7788-99aa-bbccddeeff00",
  "organization_id": "org_enterprise_corp",
  "employee_id": "emp_harikeshav_r",
  "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
  "sequence": "8",
  "correlation_id": "cor_act_01928374-7777",
  "connection_token": "tok_99aabbccddeeff00112233445566778899aabbccddeeff001122334455667788",
  "type": "BridgeError",
  "payload": {
    "request_id": "act_01928374-click-approve-0001",
    "code": "TARGET_NOT_FOUND",
    "retry_class": "never",
    "may_have_side_effects": false
  }
}
```

### Bounded Semantic Observation Pipeline

```
DOM Mutations / Events
          |
          v
[100 ms Coalescing Window]
          |
          v
[Synchronous Extraction Slice: <= 4 ms]
          |
    +-----+-----+
    |           |
[Generic]  [Profile]
    |           |
    v           v
[Exclusion & Redaction: Password/Credit Card/Auth Masks]
          |
          v
[Per-Profile Queue: Max 64 Events / 1 MiB]
          |
          v (overflow? Drop Deltas -> Emit Gap -> Request Baseline)
[Native Messaging Host -> Broker -> Privacy Helper]
```

#### Semantic Extraction Algorithm

1. **Gate Verification:** Synchronously verify that the active `DocumentKey` has an unexpired `GrantObservationPermit` ($t \le t_{\text{request}} + \text{ttl\_ms}$) and that the document visibility state is `visible`.
2. **Exclusion and Boundary Traversal:**
   - Traverse the DOM tree in document order, ignoring hidden (`display: none`, `visibility: hidden`), collapsed, offscreen, or clipped elements.
   - For open shadow roots (`Element.shadowRoot`), traverse children recursively using declared packaged shadow scopes. Closed shadow roots (`mode: "closed"`) and opaque `<canvas>` surfaces are unsupported; emit `UNSUPPORTED_SURFACE`.
   - For `<iframe>` elements: check if the frame document has an independent, unexpired permit. If permitted, process within its own document key; if unpermitted, treat the frame boundary as opaque-black occluding geometry.
3. **Sensitive Field Masking at Source:**
   - Inspect input types and autocomplete attributes: `type="password"`, `autocomplete="current-password"`, `autocomplete="new-password"`, `autocomplete="cc-number"`, `autocomplete="cc-csc"`, `autocomplete="bday"`.
   - Any element matching sensitive patterns has `value` forced to `null` and `states` annotated with `protected`. The content script never serializes sensitive values across the native messaging bridge.
4. **Coalescing and Time-Slicing:**
   - DOM invalidations from `MutationObserver` are debounced into a 100 ms coalescing window.
   - Tree traversal is constrained to a maximum synchronous slice of 4 ms. If traversal exceeds 4 ms, the observer yields to the browser event loop and resumes only if the permit remains unexpired.
5. **Bounded Baseline Emission:**
   - Complete trees are capped at 512 nodes, maximum depth 12. Element labels are capped at 256 UTF-8 bytes; values are capped at 1,024 UTF-8 bytes.
   - If limits are reached, the observer marks `text_truncated: true` and sets `complete: false` with the truthful `omitted_count`.
6. **Queue Management:**
   - The service worker maintains a per-profile observation queue capped at 64 events and 1 MiB total payload.
   - If the queue overflows due to bridge backpressure, in-flight deltas are dropped, an `ObservationGap(reason="queue_overflow")` is emitted to the helper, and a fresh `DocumentBaseline` is requested.

### Packaged Application Profiles and Robust Guidance Targets

The extension interprets immutable `ApplicationProfile` records bundled inside the signed extension package:

```typescript
export interface ApplicationProfile {
  application_profile_id: string;      // e.g. "prof_app_finance_invoicing_v1"
  application_profile_version: string; // SemVer string e.g. "1.0.0"
  browser_families: Array<"chrome" | "edge">;
  browser_builds: string[];            // Certified browser version strings
  os_builds: string[];                 // Certified OS platform identifiers
  locales: string[];                   // Supported BCP 47 locales e.g. ["en-US"]
  allowed_origins: string[];           // Exact allowed origins
  work_context_rules: WorkContextRule[];
  business_fields: BusinessFieldDefinition[];
  record_identity: RecordIdentityRule;
  targets: TargetDefinition[];
  operations: OperationDefinition[];
  allowed_transitions: TransitionRule[];
  capabilities: ProfileCapabilities;
  validation_id: string;               // Bound SurfaceValidationRecord ID
  test_evidence_digest: string;        // SHA-256 digest of synthetic validation
}

export interface TargetDefinition {
  target_key: string;                  // e.g. "target_approve_button"
  expected_role: string;               // Normalized accessibility role
  locators: TargetLocator[];           // Ordered deterministic locators
  frame_scope: "top" | { origin: string; route_id: string };
  shadow_path: string[];               // Ordered open shadow host selectors
  preconditions: {
    enabled: boolean;
    editable: boolean;
    visible: boolean;
    unique: boolean;
  };
}

export type TargetLocator =
  | { kind: "role_name"; role: string; name: string }
  | { kind: "stable_attribute"; attribute: string; value: string }
  | { kind: "scoped_css"; selector: string };
```

#### Deterministic Target Resolution Rules

- `TargetResolver` evaluates all applicable locators for a target.
- **Unanimity Invariant:** Every locator that matches an element must resolve to the identical live DOM node. If zero locators match, it returns `TARGET_NOT_FOUND`. If locators match distinct nodes or multiple nodes match a single locator, it returns `TARGET_AMBIGUOUS`. Fuzzy matching, XPath, or dynamic label heuristics are prohibited.
- **Target Handle Invariant:** Resolved elements receive an ephemeral `target_handle` valid for at most 250 ms. Handles are invalidated immediately upon DOM mutation, navigation, or document generation change.

### Authorized Action Primitives and Navigation Guard

The subsystem exposes six validated action primitives:
1. `read`: Extracts permitted declared `business_fields`. Emits local task evidence; never produces business completion verdicts.
2. `click`: Dispatches synthetic `PointerEvent` and `MouseEvent` sequence (`pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`). Profile must declare if clicking can submit business effects (`may_submit: true`).
3. `fill`: Sets native DOM input property (`HTMLInputElement.prototype.value`), dispatches synthetic `input` and `change` events. Forbidden on password/credential inputs.
4. `select`: Selects valid `<option>` element and dispatches `change`.
5. `check`: Sets boolean `checked` property on checkbox/radio and dispatches `click` / `change`.
6. `navigate`: Restricts URL transitions to declared `allowed_transitions` templates.

#### Action Digest and Preflight Execution Sequence

```
1. Receive ExecuteBrowserAction
2. Re-resolve Target Handle (Must resolve uniquely within 250 ms)
3. Validate Observable Before-Values (expected_state.fields)
4. Verify SHA-256 Canonical Digest:
   action_sha256 = SHA256(RFC8785_Canonical_JSON(action_id, job_id, case_id,
     agent_version, application_profile_id, application_profile_version,
     target_key, record_key, expected_state, environment, operation, argument))
5. Verify Fresh Identity-Policy Authorization Token & Approval Receipt
6. Log "dispatching" Intent to Local Audit Store
7. Synchronously Dispatch DOM Primitive
8. Emit BrowserActionResult(status, submission_state)
```

#### Navigation Guard (`declarativeNetRequest`)

- The service worker dynamically installs session rules using `chrome.declarativeNetRequest.updateSessionRules`:
  - Rule Priority 1: Action `block` for resource types `["main_frame", "sub_frame"]` restricted to `tabIds: [reserved_tab_id]`.
  - Rule Priority 2: Action `allow` for exact destination URLs permitted by the job's active `allowed_transitions`.
- Anchored regex patterns are pre-validated via `chrome.declarativeNetRequest.isRegexSupported`. If rules fail to install or enterprise policies restrict DNR, local browser execution is immediately blocked.

## State and lifecycle

### Orthogonal Subsystem State Axes

The subsystem operates across three strictly orthogonal state axes:

```
[Bridge State]        Unpaired ---> Pairing ---> PairedDisconnected ---> Connecting ---> Ready
                                                                                    |
                                                          Incompatible <------------+---> Blocked

[Document State]      Unadmitted ---> AwaitingPermit ---> Active <=====> Suspended
                                                             |
                                            Excluded <-------+-----> Unsupported ---> Closed

[Execution State]     Idle ---> Reserved ---> Running <=====> AwaitingApproval
                                                 |
                                OutcomeUnknown <-+---> Paused ---> Released
```

### Comprehensive Transition Tables

#### 1. Bridge State Transitions

| Current State | Trigger / Event | Owner | Content / Action Effect | Reported Capture State | Recovery Action |
|---|---|---|---|---|---|
| `unpaired` | First extension connection with unpinned key | Extension / Broker | Zero observation or execution allowed. Exchanging pairing challenges only. | `sources.browser.health = "unavailable"` | Complete 6-digit comparison confirmation in Shell UI. |
| `pairing` | 60 s challenge expires or 3 failed attempts | Broker | Disconnects port. Zero content emitted. | `sources.browser.health = "unavailable"` | Restart pairing from extension popup. |
| `paired_disconnected` | Browser launches or extension reloads | Extension | Retains pinned key. Initiates native messaging connection. | `sources.browser.health = "degraded"` | Service worker calls `runtime.connectNative`. |
| `connecting` | Handshake timeout (> 3,000 ms) or build mismatch | Broker | Closes connection. Native host exits cleanly. | `sources.browser.health = "unavailable"` | Host restarted on next browser activity; updates inspected. |
| `connecting` | Signature verified within 3,000 ms | Broker | Issues `BridgeReady` and token. Enables policy distribution. | `sources.browser.health = "ready"` | Advance to `ready`. |
| `ready` | Native port EOF or browser process crash | Broker | Revokes all active permits. Zeroes in-memory session token. | `sources.browser.health = "unavailable"`, `recovery_blocker = "crash"` | Service worker reconnects; employee resumes capture. |
| `ready` | Organization switch or enrollment revoked | Shell Native Core | Clears pinned keys and session tokens. Drops queues. | `sources.browser.health = "unavailable"` | Re-pair profile to new organization. |

#### 2. Document Observation State Transitions

| Current State | Trigger / Event | Owner | Content / Action Effect | Reported Capture State | Recovery Action |
|---|---|---|---|---|---|
| `unadmitted` | Committed navigation to approved work context route | Extension | Emits `DocumentCandidate`. Zero content read. | `source_state = "permitted"` | Helper evaluates policy and issues permit. |
| `unadmitted` | Committed navigation to unapproved or excluded origin | Extension | Inactive. Content script not injected. | `source_state = "excluded"` | Navigate to approved work route. |
| `awaiting_permit` | `GrantObservationPermit` received within 300 ms | Helper / Extension | Injects observer. Begins baseline extraction. | `sources.browser.activities.active` | Advance to `active`. |
| `awaiting_permit` | Permit request rejected or timed out | Helper | Remains dormant. Emits `ObservationGap(reason="permit_denied")`. | `sources.browser.activities.stopped` | Recheck employee consent and corporate policy. |
| `active` | Employee pauses screen capture | Desktop Shell | Revokes permit immediately. Flushes uncommitted queues. | `employee_paused = true`, `activities.stopped` | Intentional employee resume action in Shell UI. |
| `active` | Tab hidden, minimized, or switched to background | Browser / Probe | Emits `DocumentLifecycleChanged(state="hidden")`. Suspends queries. | `activities.stopped` | Switch tab back to active foreground. |
| `active` | Page enters BFCache, prerender, or discard | Browser Engine | Invalidates document generation. Drops target handles. | `activities.stopped` | Page restore triggers fresh `DocumentCandidate`. |
| `active` | Incognito window opened or login route matched | Extension | Immediate revocation. Zero content read. | `source_state = "excluded"` | Close private window; return to standard work context. |

#### 3. Execution State Transitions

| Current State | Trigger / Event | Owner | Content / Action Effect | Reported Capture State | Recovery Action |
|---|---|---|---|---|---|
| `idle` | `ReserveBrowserExecution` received and validated | Privacy Helper | Validates environment, profile, and authorization. Reserves tab. | Execution reservation active | Advance to `reserved`. |
| `reserved` | Second reservation request received | Privacy Helper | Rejects with `EXECUTION_BUSY`. Only one local job allowed. | Unchanged | Wait for active reservation release. |
| `reserved` | Initial approved `navigate` dispatched | Extension | Installs DNR session rules. Opens approved route. | `running` | Await navigation commit and baseline. |
| `running` | Tier 3 action proposal constructed | Adapter / Runtime | Pauses dispatch. Displays proposal in Shell UI. | `awaiting_approval` | Operator reviews and approves `action_sha256`. |
| `awaiting_approval` | Operator approves; before-values match | Runtime / Helper | Verifies fresh authorization token; dispatches primitive. | `running` | Advance to local execution. |
| `awaiting_approval` | Before-values changed or operator rejects | Extension / Runtime | Discards proposal. Re-resolves target. | `idle` / `released` | Re-evaluate task plan or escalate to operator. |
| `running` | Employee moves mouse, types, or switches tab | BrowserCoordinator | Detects user interference. Suspends dispatch immediately. | `paused` | Operator resolves conflict and resumes job. |
| `running` | Port drops after action handed to browser | Host / Broker | Marks submission state `unknown`. Prohibits retry. | `outcome_unknown` | Readback verification or operator manual check. |
| `running` | Action completed; postconditions verified | DomExecutor | Emits `BrowserActionResult(status="completed")`. | `running` / `released` | Proceed to next step or release reservation. |

### Crash Recovery and Blocker Persistence

1. **Host or Service Worker Crash:** If `oryn-browser-host` exits or the MV3 service worker terminates unexpectedly, the native messaging channel breaks. The shell broker detects EOF immediately, invalidates the active bearer token, revokes all outstanding permits, and records a per-profile recovery blocker `crash`.
2. **Aggregate Health Derivation:**
   - If other paired browser profiles or the native OS observer remain healthy, the top-level capture state remains active.
   - The aggregate browser source health evaluates to `ready` if all eligible profiles are healthy, `degraded` if healthy and faulted profiles coexist, and `unavailable` if zero healthy profiles exist.
   - The top-level supervisor `recovery_blocker` is set only when zero healthy capture sources remain.
3. **Deliberate Resume Requirement:** Reconnecting the bridge allows capability status to update in the UI, but capture and local action execution remain blocked until the employee clicks **Resume Screen Observation** in the Desktop Shell.

## Error and edge-case behavior

### Stable Error Literals Table

The subsystem standardizes the following machine-readable error literals:

| Error Code | Classification | Trigger Condition | System Behavior and Recovery |
|---|---|---|---|
| `BRIDGE_UNPAIRED` | Configuration | Public key thumbprint not pinned in Shell store. | Bridge drops to pre-pair mode. Presents 6-digit challenge. |
| `BRIDGE_INCOMPATIBLE` | Version Mismatch | Protocol major version or browser build mismatch. | Bridge closes port. Native host exits. Prompts application update. |
| `BRIDGE_DISCONNECTED` | Transport Failure | Native messaging host terminated or socket closed. | Ceases observation and execution. Marks profile degraded. |
| `PAIRING_EXPIRED` | Timeout | Pairing challenge exceeded 60 s or 3 invalid inputs. | Terminates pairing session. Requires fresh pairing request. |
| `PROFILE_MISMATCH` | Security | Reported profile ID does not match pinned key. | Drops connection immediately. Emits security audit alert. |
| `POLICY_DENIED` | Policy | URL route matches denied pattern or lacks work context. | Halts injection. Emits zero observations. |
| `PERMIT_EXPIRED` | Lifecycle | Synchronous TTL expired before content read. | Discards unread content. Issues fresh permit request. |
| `PRIVATE_CONTEXT` | Privacy | Browser window is incognito or in-private. | Inactive. Emits zero observations. Blocks execution. |
| `WORK_CONTEXT_UNVERIFIED` | Admission | Required tenant marker attribute missing or mismatched. | Denies document admission. Emits `ObservationGap`. |
| `BINDING_AMBIGUOUS` | Geometry | Multiple native window rectangles match browser bounds. | Emits `ObservationGap`. Coordinates suppressed. |
| `VISIBILITY_UNPROVEN` | Geometry | Frame visibility or occlusion cannot be certified. | Falls back to text-only guidance. Geometry is null. |
| `UNSUPPORTED_SURFACE` | Capability | Document uses closed shadow root or opaque canvas. | Marks surface unsupported. Suppresses action execution. |
| `TARGET_NOT_FOUND` | Resolution | Zero DOM elements matched locator alternatives. | Step guidance halts. Execution action rejected before dispatch. |
| `TARGET_AMBIGUOUS` | Resolution | Multiple elements matched or alternatives disagreed. | Rejects target resolution. Prevents ambiguous actuation. |
| `TARGET_STALE` | Resolution | Ephemeral target handle exceeded 250 ms or DOM mutated. | Re-resolves target against live DOM before dispatch. |
| `RECORD_MISMATCH` | Preflight | Current observable business fields do not match proposal. | Cancels action dispatch. Invalidates previous approval. |
| `AUTHORIZATION_REQUIRED` | Security | Fresh identity-policy token missing, expired, or invalid. | Blocks action dispatch. Requires fresh authorization. |
| `APPROVAL_REQUIRED` | Governance | Tier 3 action proposal lacks valid operator approval receipt. | Halts execution. Prompts item-level human approval. |
| `EXECUTION_BUSY` | Scheduling | Reservation attempted while another local job is active. | Rejects reservation request. Orchestrator queues task. |
| `NAVIGATION_BLOCKED` | Guard | Target URL not declared in approved job transitions. | DeclarativeNetRequest session rule blocks request at source. |
| `NAVIGATION_GUARD_UNAVAILABLE` | Guard | Enterprise policy restricts DNR or rule install fails. | Execution is completely disabled. Observation may continue. |
| `USER_INTERFERENCE` | Safety | Employee user input detected inside reserved execution tab. | Suspends execution immediately. Awaits operator review. |
| `QUEUE_OVERFLOW` | Performance | Observation queue exceeded 64 events or 1 MiB. | Drops pending deltas. Emits gap. Requests fresh baseline. |
| `OUTCOME_UNKNOWN` | Recovery | Transport disconnected after primitive handed to browser. | Holds case in `Outcome Unknown`. Prohibits automated retry. |

### Edge-Case Handling

- **DOM Mutation Storms:** Single-page applications updating hundreds of nodes per second are throttled by the 100 ms coalescing window. If DOM processing exceeds 4 ms in a slice, it yields to the event loop. If the buffer reaches 64 events, the queue drops deltas, records an `ObservationGap(reason="queue_overflow")`, and schedules a single consolidated `DocumentBaseline`.
- **BFCache, Prerender, and Discard:** Navigations restored from the Back-Forward Cache (BFCache) or prerendered documents do not fire standard load events. The extension listens for `pageshow` (with `event.persisted === true`) and `prerenderingchange`. Restored documents invalidate all previous target handles, generate a fresh `document_generation`, and require a new `DocumentCandidate` exchange before emitting any observations.
- **Cross-Origin Frames without Native Geometry:** If a cross-origin iframe is permitted under an independent `WorkContextRule` but its physical desktop affine transform cannot be certified due to nested scrolling or compositor clipping, the extension emits structured DOM events with `"bounds": null`. Guidance step cards are displayed in text-only mode in the native HUD without drawing coordinate bounding boxes.
- **Framing and Serialization Errors:** If a message exceeds 262,144 bytes, contains non-UTF-8 bytes, or has an invalid length prefix, the native host immediately closes the connection. No partial messages are buffered or processed.

## Observability and audit

### Telemetry and Diagnostics Policy

To maintain zero-knowledge privacy guarantees, all telemetry and diagnostic logs produced by the extension and native bridge must be **strictly content-free**:
- **Permitted Diagnostic Data:** Bridge state transitions, protocol handshake durations, message sequence counters, queue utilization depths, dropped-event counters, target resolution latency (p50/p95), locator match kinds (`role_name`, `stable_attribute`, `scoped_css`), and coarse error literals from the Stable Error Literals Table.
- **Strictly Prohibited Data:** Web page URLs, query parameters, URL hash fragments, document titles, form input values, element inner text, CSS selectors containing customer data, target record keys, employee credentials, captured DOM trees, or raster screenshot pixels.
- **Timing and Keystroke Protection:** Typing latency, inter-keystroke timing, and mouse movement paths are never recorded or logged, preventing side-channel text reconstruction.

### Local Audit Trail and Minimal Execution Receipts

Every authorized browser action executed by the subsystem produces an immutable local audit record stored in the execution audit log:
- **Receipt Schema:**
  - `action_id`: UUIDv4
  - `job_id`: UUIDv4
  - `case_id`: UUIDv4
  - `action_sha256`: SHA-256 digest of canonical action proposal
  - `authorization_ref`: Cryptographic reference of authorization token
  - `approval_ref`: Operator approval identifier (or null for Tier 1/2)
  - `timestamp_utc`: RFC 3339 UTC timestamp
  - `submission_state`: Final submission state (`application_acknowledged`, `unknown`, `not_dispatched`)
  - `evidence_ref`: Content hash of local UI mutation proof
- Minimal execution receipts contain zero customer business data. They are preserved independently of observation retention settings and are never cleared by `personal_history_retention=false`.

## Security and threat model

### Threat Analysis and Mitigations

```
Threat: Malicious Page Script Injection
Mitigation: Isolated World Execution + No Eval + No MAIN World Prototype Access

Threat: Native Port Impersonation / Forgery
Mitigation: P-256 WebCrypto Signature + Pinned Thumbprint + 3,000 ms Handshake

Threat: Cross-Profile / Cross-Tenant Confusion
Mitigation: Profile UUID Bound to Single Org/Enrollment + In-Memory Token

Threat: Stale Permit or Replay Attack
Mitigation: Monotonic Sequences + Fresh Request Nonces + 300 ms Max TTL

Threat: Coordinate / Geometry Manipulation
Mitigation: Independent Shell BrowserGeometryProbe + Affine Calibration

Threat: Navigation Scope Escape
Mitigation: DeclarativeNetRequest Main/Sub-Frame Rules + Anchored Regex
```

1. **Hostile Web Page / DOM Injection:**
   - *Risk:* A malicious web page attempts to manipulate JavaScript prototypes, intercept extension messages, or execute arbitrary code in the extension context.
   - *Mitigation:* Content scripts execute in the browser's `ISOLATED` world. They share the DOM tree with the page but possess independent JavaScript execution contexts and prototypes. The extension uses strict CSP (`script-src 'self'`), prohibits `eval()`, `new Function()`, and inline scripts, and never passes page strings to `innerHTML`.
2. **Native Port Sender Forgery:**
   - *Risk:* A rogue extension or local process attempts to connect to `oryn-browser-host` to inject commands or extract observations.
   - *Mitigation:* The native host manifest specifies `allowed_origins` matching exact Chrome Web Store and Edge Add-ons IDs. The OS bridge socket/pipe verifies peer process UID, PID, and executable Authenticode/code requirements. The mutual WebCrypto handshake requires proof-of-possession of the pinned private key.
3. **Cross-Profile Tenant Confusion:**
   - *Risk:* An employee switches browser profiles or organizations, causing work context or observations from Organization A to be routed to Organization B.
   - *Mitigation:* Each browser profile holds a unique `profile_id` and nonextractable P-256 key pair bound to exactly one organization. The native broker verifies that the connecting profile matches the active Desktop Shell organization. Switching organizations invalidates all active session tokens and requires explicit re-pairing.
4. **Stale Document and Permit Replay:**
   - *Risk:* Network delays or worker pauses cause an expired permit to be used to extract content from a newly loaded, sensitive page.
   - *Mitigation:* Permits have a maximum TTL of 300 ms and are bound to an exact `document_generation` and one-use `request_nonce`. The content script checks expiration before reading, and the privacy helper checks OS boot-monotonic time before accepting data. Stale generations cause immediate packet rejection.
5. **DeclarativeNetRequest Bypass Attempts:**
   - *Risk:* An executing agent job navigates to an unauthorized external origin via sub-frame injection, window popups, or redirects.
   - *Mitigation:* DNR session rules are applied at priority 1 to block all `main_frame` and `sub_frame` navigations on the reserved tab, while priority 2 rules permit only declared transitions. Unexpected popups are opened in an unadmitted state and immediately halted.
6. **Crash-After-Dispatch Uncertainty:**
   - *Risk:* The browser bridge crashes after an HTTP POST request has been sent by the web page but before the response DOM renders, leading to duplicate financial transactions if retried.
   - *Mitigation:* The executor logs `dispatching` state immediately prior to primitive actuation. If the bridge drops before receiving an application acknowledgement, the action transitions to `submission_state="unknown"` and status `OUTCOME_UNKNOWN`. Automated retry is prohibited; the system requires independent readback or operator review.

## Test strategy

### Deterministic Synthetic Acceptance Verification

The subsystem must pass the following deterministic synthetic test suite on certified platform test machines (Google Chrome and Microsoft Edge on macOS and Windows) before release. All tests use synthetic web applications hosted on `https://*.oryn.test` with local test certificates:

| Scenario ID | Test Scenario and Input Conditions | Expected Observable Result | Assertion Point | Product Criteria |
|---|---|---|---|---|
| **BR-TEST-01** | Initial extension install; employee initiates pairing. Native broker issues `PairingChallenge`. | 6-digit code displayed in extension popup and Desktop Shell pairing dialog. Confirmed pairing pins public key thumbprint; unconfirmed pairing drops after 60 s. | Shell credential store contains pinned thumbprint; `BridgeReady` emitted with token. | ORY-002, ORY-010 |
| **BR-TEST-02** | Unpaired extension attempts to send `DocumentCandidate` or `RequestBrowserPermit`. | Bridge drops message immediately; returns `BRIDGE_UNPAIRED`. Zero document content processed. | Wire log contains zero document observations; bridge remains closed. | ORY-002, ORY-005 |
| **BR-TEST-03** | Browser profile associated with Organization A attempts to connect to Desktop Shell enrolled in Organization B. | Broker detects organization ID and enrollment mismatch; rejects authentication with `PROFILE_MISMATCH`. | Bridge logs security rejection; shell UI displays profile mismatch notice. | ORY-005, ORY-028 |
| **BR-TEST-04** | Employee opens permitted work origin (`https://finance.corp.oryn.test/invoices`), then navigates to personal email (`https://mail.personal.oryn.test`). | Content script injected on finance origin; upon navigation to personal email, observation ceases immediately. Zero email DOM or URL emitted. | Privacy storage receives zero events from personal email origin; UI shows Excluded Application. | ORY-003, ORY-005 |
| **BR-TEST-05** | Form contains sensitive fields (`type="password"`, `autocomplete="cc-number"`). | Content script extracts role and label; field `value` is serialized as `null`; states include `protected`. | Wire payload contains `"value": null`; downstream context receives zero credentials. | ORY-005 |
| **BR-TEST-06** | User opens Incognito / InPrivate browser window. | Extension background worker detects `sender.tab.incognito === true`; suppresses injection and rejects messages. | Observation pipeline inactive; zero incognito data acquired. | ORY-005 |
| **BR-TEST-07** | Consent toggled: `visual_work_observation=false`, `contextual_work_application_recognition=true`. | Extension streams structured DOM events (`ElementStateChanged`). Native worker allocates zero frame slots; zero screenshots taken. | Observation stream contains structured text; frame slots remain 0. | ORY-002, ORY-003 |
| **BR-TEST-08** | Consent toggled: `visual_work_observation=true`, `contextual_work_application_recognition=false`. | Extension extracts zero DOM text, values, or labels; provides only window geometry and protected bounds. Native worker captures masked snapshots. | Wire payload contains zero DOM text; visual frames masked at protected bounds. | ORY-002, ORY-003 |
| **BR-TEST-09** | `personal_history_retention=false` active; permitted DOM observations streamed. | Observations processed into volatile memory with 30 s TTL; delivered to HUD; memory zeroed upon expiry. Zero disk writes. | Storage verification confirms zero byte delta in evidence database. | ORY-009, ORY-010 |
| **BR-TEST-10** | Permitted browser window covered 50% by an excluded native application window. | Content-free probe calculates occlusion. DOM controls in occluded region omitted; native snapshot paints covered area opaque-black. | Target resolver rejects occluded elements; snapshot contains black pixels over covered bounds. | ORY-005, ORY-019 |
| **BR-TEST-11** | Cross-origin iframe loaded inside permitted page; iframe origin not in work context policy. | Content script not injected into iframe. Frame area treated as opaque-black occluding rectangle. | Zero observations emitted from iframe; iframe controls unresolvable. | ORY-005, ORY-028 |
| **BR-TEST-12** | SPA updates document via history pushState; route changes to `/invoices/992` (permitted). | WebNavigation detects commit; generates fresh `document_generation`; emits `DocumentCandidate`; re-evaluates permit. | State machine increments generation; old target handles invalidated. | ORY-003, ORY-019 |
| **BR-TEST-13** | Web page restores from Back-Forward Cache (BFCache) via `pageshow`. | Extension detects persisted page show; generates new generation; requests fresh baseline. Previous handles dropped. | Fresh baseline received; zero stale element handles reused. | ORY-003, ORY-019 |
| **BR-TEST-14** | High-frequency DOM mutation storm (> 500 mutations/sec). | Coalescing window batches changes; extraction slice throttles at 4 ms. Queue limit (64 events) drops deltas and emits gap. | `ObservationGap(reason="queue_overflow")` recorded; single baseline requested. | ORY-003 |
| **BR-TEST-15** | Native observation worker crashes (`kill -9`) while browser extension is observing. | Privacy helper detects native channel EOF; native snapshots stop. Independent browser semantic extraction continues without interruption. | Browser DOM events continue logging; UI reflects independent source health. | ORY-003, ORY-004 |
| **BR-TEST-16** | Employee clicks Pause Screen Observation during active guidance. | Privacy helper revokes permit immediately; active target queries return error; local action execution halts safely. | Zero observations emitted after pause; HUD displays Paused state. | ORY-003, ORY-004 |
| **BR-TEST-17** | Target resolution: multiple elements match ambiguous CSS selector. | TargetResolver evaluates multi-tier locators; detects ambiguity; returns `TARGET_AMBIGUOUS`. | Target handle is null; HUD halts guidance progression without guessing. | ORY-019 |
| **BR-TEST-18** | Preflight: proposed action `expected_state` has status "Pending", but live DOM reads "Approved". | Executor detects before-value mismatch; rejects dispatch with `RECORD_MISMATCH`. | Action not dispatched; operator prompted with state change notice. | ORY-019, ORY-041 |
| **BR-TEST-19** | Tier 3 action submitted without operator `approval_ref`. | Executor verifies policy tier; rejects dispatch with `APPROVAL_REQUIRED`. | Primitive not executed; item-level approval dialog displayed in Shell. | ORY-026 |
| **BR-TEST-20** | Tier 4 action submitted to browser executor. | Policy engine and application profile reject action unconditionally with `POLICY_DENIED`. | Action completely blocked at preflight; zero interaction attempted. | ORY-027 |
| **BR-TEST-21** | Executing agent job attempts to navigate to unauthorized external domain (`https://evil.oryn.test`). | DeclarativeNetRequest session rule blocks request at source (`net::ERR_BLOCKED_BY_CLIENT`). | Navigation aborted; execution halts with `NAVIGATION_BLOCKED`. | ORY-028 |
| **BR-TEST-22** | Native host drops connection immediately after click primitive sent to browser. | Executor records `submission_state="unknown"`; returns status `OUTCOME_UNKNOWN`. Automated retry blocked. | Case held for operator verification; zero duplicate clicks dispatched. | ORY-043, ORY-044 |

## Performance and operations

### Operational Budgets and Target Invariants

The subsystem conforms to the following operational performance parameters:

| Metric / Parameter | Budget Limit / Specification Target | Operational Enforcement Mechanism |
|---|---|---|
| **Mutual Handshake Deadline** | 3,000 ms maximum | Broker terminates port if `BridgeAuthenticate` is not completed within deadline. |
| **Native/Browser Frame Size** | 262,144 bytes maximum | Host and broker reject frames exceeding 256 KiB; closes transport immediately. |
| **Observation Permit Refresh / TTL** | 100 ms refresh / 300 ms maximum TTL | Helper rejects delayed responses; synchronous expiration check at content script. |
| **Visibility / Watchdog Cutoff** | 500 ms maximum; EOF immediate | Helper revokes permits if shell visibility lease or heartbeat lapses beyond 500 ms. |
| **Native Geometry Refresh / Validity** | 100 ms sampling / 300 ms maximum age | Geometry older than 300 ms treated as invalid; coordinate transforms suppressed. |
| **Ephemeral Target Handle Validity** | 250 ms maximum lifetime | Handles expire after 250 ms; mandatory re-resolution before any action primitive. |
| **Mutation Coalescing / Extraction Slice**| 100 ms window / 4 ms maximum slice | Debounce timer batches DOM invalidations; synchronous script slice caps at 4 ms. |
| **Target Resolution Latency** | p95 $\le$ 50 ms for certified fixtures | Fast DOM evaluation via multi-tier locators; aborts on ambiguity. |
| **Event Pipeline Latency** | p95 $\le$ 250 ms from mutation to helper | Bounded queues and asynchronous worker pipeline. |
| **Per-Profile Observation Queue** | 64 events and 1 MiB payload max | Overflows drop deltas, emit `ObservationGap`, and request fresh baseline. |
| **Baseline Tree / Redaction Limits** | 512 nodes, depth 12, label 256 B, value 1,024 B | Traversal truncation with explicit `omitted_count` and `complete=false`. |
| **Volatile Content Retention TTL** | 30 seconds maximum end-to-end | Volatile buffers deallocated and zeroed immediately upon consumption or expiration. |
| **Idle CPU Utilization** | $\le$ 1% of one CPU core | Mutation observers idle on static DOM; watchdog heartbeats use 100 ms timer. |
| **Active Extraction CPU Overhead** | $\le$ 5% of one CPU core (60 s average) | Bounded time slicing and selective attribute filtering. |
| **Native Bridge Host RSS** | $\le$ 24 MiB steady-state | Lean Rust binary (`oryn-browser-host`) with static memory allocations. |
| **Incremental Extension Memory** | $\le$ 32 MiB/profile + 4 MiB/document | Bounded event queues and strict garbage collection of detached DOM references. |
| **Concurrent Executing Browser Jobs** | Exactly 1 device-wide | Enforced via `ReserveBrowserExecution` lock in privacy helper. |

### Certified Platform and Browser Environments

Support is certified for exact 64-bit builds on macOS (Apple Silicon and Intel x86_64) and Windows 11 (x86_64 and ARM64):
- **Google Chrome:** Current Stable, Previous Stable, and vendor-supported Extended Stable channels.
- **Microsoft Edge:** Current Stable, Previous Stable, and vendor-supported Extended Stable channels.

Enterprise deployment is supported via Chrome enterprise policy (`ExtensionInstallForcelist`) and Edge policy (`ExtensionInstallForcelist`). Native host registration manifests are installed into vendor-specified system locations:
- macOS Chrome: `/Library/Google/Chrome/NativeMessagingHosts/com.oryn.browser_bridge.json`
- macOS Edge: `/Library/Microsoft/Edge/NativeMessagingHosts/com.oryn.browser_bridge.json`
- Windows Chrome: `HKLM\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.oryn.browser_bridge`
- Windows Edge: `HKLM\SOFTWARE\Microsoft\Edge\NativeMessagingHosts\com.oryn.browser_bridge`

## Architecture decisions and open questions

### Specific Preserved Implementation Questions

1. **Native Messaging Protocol vs. Localhost Transport:**
   - *Resolution:* Native Messaging is selected exclusively. Localhost TCP or WebSocket transports introduce severe localhost port hijacking risks, require broad firewall permissions, and cannot enforce OS process identity or browser ancestry verification. Native Messaging ensures the host is spawned directly by the browser under the employee's OS session.
2. **Robust DOM Selector Generation:**
   - *Resolution:* Packaged multi-tier deterministic locators are selected. Locators evaluate in order: `role_name` (accessible role + normalized name), `stable_attribute` (enterprise test/data attributes), and `scoped_css` (profile-scoped CSS, max 256 chars). All applicable locators must resolve to the identical live DOM node; any disagreement or ambiguity fails closed with `TARGET_AMBIGUOUS`. Fuzzy matching, XPath, and dynamic heuristic repairs are prohibited.
3. **Permissions Model in Manifest V3:**
   - *Resolution:* Minimum required permissions: `nativeMessaging`, `storage`, `scripting`, `webNavigation`, and `declarativeNetRequest`. Host access uses `optional_host_permissions: ["https://*/*"]`, with exact enterprise origins granted at runtime via user gesture. Broad static host permissions, `debugger`, and all-site content scripts are eliminated.
4. **Correlation Between OS Accessibility and Browser DOM:**
   - *Resolution:* Decoupled architecture. The shell native core `BrowserGeometryProbe` correlates window bounds, exposure, and z-order content-free. The extension owns web semantics and DOM extraction. When the extension is connected, native accessibility queries are suppressed. Native snapshots for extension-bound surfaces use certified `SurfaceValidationRecord` entries with pre-transfer masking.

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))

1. *Owns exclusively:* In-browser DOM semantic observation, tab lifecycle tracking, native messaging client, deterministic target resolution, and local action execution primitives.
2. *Data ingress/egress:* Ingests DOM mutations, form events, HUD target queries, and authorized action commands; emits structured `browser-observation.event.v1` events, target geometry (`BrowserTargetResult`), and execution receipts (`BrowserActionResult`). Zero direct cloud egress.
3. *Versions/identities:* Manifest version, extension version, browser build identity, `DocumentKey`, `profile_id`, `bridge_epoch`, `surface_generation`, and `application_profile_version`.
4. *Upstream failure:* If Desktop Shell or native bridge disconnects, extension becomes dormant immediately, ceases observation, drops target handles, and pauses active actions at safe boundaries.
5. *Authority:* [local-privacy-storage](local-privacy-storage.md) governs observation permits and capture policy; [identity-policy](identity-policy.md) governs action execution tokens; [desktop-shell](desktop-shell.md) governs window presentation.
6. *Testing without private details:* Tested using deterministic synthetic fixtures on `https://*.oryn.test` with synthetic enterprise invoicing and CRM workflows.
7. *Audit and duplicate prevention:* Paired envelopes carry monotonic sequences per direction; observations carry UUIDv4 event IDs; actions carry SHA-256 proposal digests and one-use nonces.
8. *Failure blast radius:* Extension crash or failure is contained to the browser process and native host; does not compromise Desktop Shell, OS observer, or meeting recording.
9. *v1.0 criteria:* Full verification of ORY-002–005, ORY-009–010, ORY-019, ORY-026–029, ORY-041, ORY-043–045 across 22 deterministic acceptance scenarios (`BR-TEST-01` through `BR-TEST-22`).
