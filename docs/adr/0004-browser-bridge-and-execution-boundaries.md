# Browser Bridge Attachment, Per-Modality Arbitration, and Execution Boundaries

**Status:** accepted  
**Date:** 2026-11-09  
**Deciders:** Core Engineering Team  

## Context

The browser extension must capture permissioned web context for business applications in Google Chrome and Microsoft Edge, resolve robust target elements for non-intrusive step guidance overlays, and facilitate authorized local actions. Integrating browser context into the Oryn desktop architecture introduces five architectural tensions:

1. **Attachment Transport vs. No-Rendezvous Invariant:** ADR-0001 strictly prohibits public named pipes, localhost TCP sockets, and discoverable filesystem sockets, requiring inherited byte channels. However, a browser extension native messaging host (`oryn-browser-host`) is spawned by the browser process, not by Desktop Shell; it cannot inherit pre-existing channel descriptors at companion launch.
2. **Web Semantics vs. Native Compositor Snapshots:** The browser DOM provides structured accessible text, element roles, and form interactions, but browser screenshot APIs require broad permissions and lack deterministic synchronization with native window exposure. Conversely, the native observation worker (`oryn-observation-worker`) reliably computes window exposure and provides pre-transfer masking, but lacks granular web DOM semantics.
3. **Multi-Profile and Multi-Tenant Isolation:** Enterprise employees frequently use multiple browser profiles (e.g. personal, enterprise, contractor). Observations and actions must not cross profile or organizational boundaries.
4. **Execution Safety and Navigation Scope:** Autonomous or assisted browser actions must not escape approved work contexts, access credentials, navigate to arbitrary external domains, or race employee input.
5. **Observation Pause vs. Execution Disruption:** When an employee pauses screen observation, local browser actions must halt safely without corrupting background server transactions or assuming remote jobs can be undone.

## Decision

We establish six foundational architectural decisions for the browser extension and local browser bridge:

1. **Native Messaging Only with Restricted Shell-Owned OS IPC Broker:**
   We select Chrome/Edge Native Messaging (`com.oryn.browser_bridge` via `oryn-browser-host`) exclusively. Localhost TCP and WebSocket transports are prohibited. As a narrowly scoped amendment to ADR-0001, the Desktop Shell native core hosts an authenticated OS-local endpoint (`~/Library/Application Support/Oryn/run/browser-bridge.sock` on macOS with mode 0700/0600 and UID/PID/code verification; `\\.\pipe\Oryn.BrowserBridge.<user-SID>.<logon-LUID>` on Windows with logon-SID DACL, client PID, and Authenticode verification). The native host bridges the browser's native-endian 256 KiB stream to the shell broker's big-endian stream.
2. **Third Inherited Channel (`shell-browser.v1`) to Privacy Helper:**
   To preserve the fail-closed security boundary of the Privacy Helper, the Desktop Shell allocates a third inherited byte channel at helper launch dedicated to browser source traffic (`shell-browser.v1`), negotiated through `shell-privacy.v1` major 1, minor 1. Raw candidate DOM observations never cross the capture control channel (Contract 19).
3. **Explicit Profile Pairing and WebCrypto Mutual Authentication:**
   Every browser profile generates a nonextractable P-256 WebCrypto key pair in extension IndexedDB. Pairing requires an explicit human-in-the-loop confirmation matching a 6-digit numeric comparison code (valid for 60 seconds) in the extension popup and Desktop Shell UI. The shell pins the public key thumbprint to the employee, organization, and enrollment. Every subsequent connection requires RFC 8785 canonical JSON signing within a 3,000 ms handshake deadline, issuing an ephemeral 256-bit in-memory bearer token.
4. **Per-Modality Arbitration and Extension-Bound Native Snapshots:**
   Arbitration is per-modality rather than an all-or-nothing fallback:
   - When an extension is bound to a window, it owns all web semantics and DOM extraction; native accessibility queries are suppressed.
   - When visual observation is consented, the native worker captures event-triggered snapshots of extension-bound browser surfaces with pre-transfer masking under a certified `SurfaceValidationRecord` with `surface_kind: "browser_extension_bound"`.
   - Native fallback for accessibility context is restricted strictly to enterprise-managed profiles with verified disabled private browsing and empty URL allowlists (preserving ADR-0003).
5. **Decoupled Content-Free Geometry and Native Presentation:**
   The Desktop Shell native core implements `BrowserGeometryProbe`, computing window exposure, z-order, display layout generation, and physical desktop affine transforms content-free. Target highlights and guidance cards are rendered by the Desktop Shell (Contract 20); the extension never injects visual markup into page DOM.
6. **Strict Action Containment, Single-Job Reservation, and Local-Action Pause:**
   Local browser execution is restricted to at most one device-wide job at a time via `ReserveBrowserExecution`. Navigations are strictly constrained using `declarativeNetRequest` session rules. Consequential actions require stable `action_sha256` digests, fresh identity-policy tokens, and item-level human approvals (Tier 3). If an employee clicks **Pause Screen Observation**, all local browser actions pause at the nearest safe boundary and pending dispatches are held; remote background jobs remain separate, and already-submitted external operations are recorded as committed.

*(Scope Amendment — 2026-11-10): [ADR-0006](0006-meeting-capture-and-review-boundaries.md) amends the browser extension permissions and bridge framing: adds `offscreen` and narrow audio-only `tabCapture` (`video: false`) for admitted meeting tabs, with local playback restored via `AudioContext` to prevent call muting. Upgrades the bridge protocol to `browser-bridge.v1` minor 1, negotiating capability `meeting_audio_v1`. Forwarded audio chunks (`BrowserMeetingAudioChunk`) are decoded by the shell broker into binary PCM frames and routed over a fourth inherited channel (`shell-meeting-audio.v1`) to the privacy helper, without traversing Channel 1, 2, or 3.*

*(Scope Amendment — 2026-11-09): [ADR-0009](0009-local-context-guidance-and-assist-boundaries.md) amends the browser bridge execution contract: upgrades `browser-bridge.v1` from minor 1 to minor 2, adding capability `assist_execution_v1`. Generalizes execution reservations and actions from jobs only to `ExecutionContextV1` (`job` or `assist`), replaces top-level job/case fields with the closed tagged union, updates canonical `action_sha256` to bind `ExecutionContextV1` and live document/surface generations, and updates minimal execution receipts.*

*(Scope Amendment — 2026-11-14): [ADR-0016](0016-application-adapter-qualification-and-dispatch-boundaries.md) amends the browser bridge execution contract: upgrades `browser-bridge.v1` to minor 4, negotiating capability `local_execution_reservation_v1`. Replaces single-job browser reservation with a unified device-wide reservation brokered by `LocalExecutionReservationBroker` across native and browser execution. Requires `execution_context` in all action results and normalizes action IDs to Identity `Identifier` strings. Clarifies that local primitive completion is an execution receipt, not business outcome verification.*


## Rationale and Alternatives

- **Native Messaging vs. Localhost WebSockets:** Localhost listeners expose ports to any unprivileged local process on the machine, creating port-hijacking and cross-site websocket hijacking risks. Native Messaging guarantees browser process provenance and user session binding.
- **Narrow Broker Rendezvous vs. Browser-Launched Daemons:** Launching the entire Privacy Helper or observation engine directly from the browser extension would duplicate background processes per browser profile, break system-wide visibility lease enforcement, and prevent unified multi-window occlusion calculation. Hosting a single, heavily restricted OS endpoint in Desktop Shell provides the minimal necessary rendezvous.
- **Separate Channel 3 vs. Control Channel Multiplexing:** Multiplexing high-volume DOM mutation trees onto Contract 19 risks head-of-line blocking for safety-critical `PauseCapture` commands. Inherited channel 3 isolates browser observation payloads completely.
- **DeclarativeNetRequest vs. Debugger API:** The Chrome DevTools Protocol (`chrome.debugger`) triggers disruptive browser warning infobars and enables arbitrary JavaScript evaluation. DeclarativeNetRequest enforces main-frame and sub-frame navigation restrictions at the network layer without browser warnings or arbitrary script execution.

## Consequences

- Desktop Shell expands to include `BrowserBridgeBroker` and `BrowserGeometryProbe`.
- `shell-privacy.v1` advances to minor 1, activating inherited channel 3 (`shell-browser.v1`).
- `SurfaceValidationRecord` in [os-observation](../components/os-observation.md) adds `browser_extension_bound`.
- Contract 21 is established for browser target resolution between [local-context-hud](../components/local-context-hud.md) and [browser-extension](../components/browser-extension.md).
- Employee pause in [desktop-shell](../components/desktop-shell.md) pauses local browser actions alongside capture streams.
- The system threat model is updated to reflect the restricted local rendezvous point and browser extension trust boundaries.
