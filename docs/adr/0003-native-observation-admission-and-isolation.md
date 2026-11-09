# Native Observation Admission, Isolation, and Multi-Window Capture

**Status:** accepted  
**Date:** 2026-11-08  
**Deciders:** Core Engineering Team  

## Context
Oryn promises high-fidelity contextual work observation across enterprise desktop applications while guaranteeing strict data minimization, mandatory exclusion enforcement at source, and zero silent capture. In desktop operating systems, native accessibility bridges (`AXUIElement` on macOS, `IUIAutomation2` on Windows) and window graphics capture APIs (`ScreenCaptureKit`, Windows Graphics Capture) present significant engineering challenges:
1. Target business applications frequently hang, deadlock, or leak memory inside platform accessibility API calls.
2. Multi-monitor enterprise workflows involve multiple simultaneously visible business windows alongside personal or sensitive windows (e.g. password managers, chat clients, or personal banking).
3. Transferring uncompressed visual frames (up to 8 MiB each) between processes risks massive memory bloat and garbage collection pauses if serialized as base64 JSON, while temporary files risk private disk leakage.
4. When a third-party application crashes a native accessibility tap, collapsing the entire capture companion halts independent, healthy capture streams (such as browser extensions or meeting audio).

We must establish the process architecture, memory sharing model, multi-window visibility semantics, browser arbitration rules, and fault containment boundaries governing native OS observation.

## Decision
We establish six foundational architectural principles for native OS observation:

1. **Nested Unprivileged Worker Process (`oryn-observation-worker`):** The native observation subsystem executes in a dedicated child process spawned and directly supervised by `oryn-privacy-helper`. Communication occurs over two private inherited byte channels (`os-observation.v1`) for priority control and observation streaming. The desktop shell supervises the privacy helper tree, while the privacy helper supervises the native worker, enforcing binary code signature checks and a 500 ms watchdog on 100 ms worker heartbeats.
2. **Multi-Window Scope with Foreground Priority and Background Continuity:** Observation tracks all approved, visible windows across all active physical displays. When an excluded window takes foreground focus, observation continues uninterrupted for non-overlapping approved background windows. Conservative z-order occlusion subtraction treats all higher surfaces (including transparent overlays, Oryn UI panels, and unknown windows) as fully occluding, without querying their contents.
3. **Pre-Transfer Masking and Inherited Shared-Memory Slots:** Visual snapshots are transferred using two fixed 8 MiB inherited shared-memory slots (`shm_open` unlinked before launch on macOS; unnamed file mappings on Windows). Before any raster leaves the worker, all occluded, security-dialog, or excluded coordinates are overwritten with opaque-black BGRA `(0,0,0,255)`. Downstream privacy storage independently verifies this black-pixel invariant before accepting frames and issuing `ReleaseFrameSlot`.
4. **Source-Specific Crash Containment and Deliberate Recovery:** An unhandled exception, crash, or native deadlock in `oryn-observation-worker` collapses the native capture gate immediately, invalidating active permits and recording a durable `crash` recovery blocker specifically for `native_os`. Active browser extension observation and meeting audio capture continue operating normally. The companion UI surfaces **Attention Needed** (with subline `Native observation stopped; other active sources shown below`) alongside independent live indicators. Resuming native observation requires an intentional employee `ResumeCapture` action.
5. **Independently Gated Modalities and Ephemeral Live Guidance:** Screen observation categories operate orthogonally:
   - `contextual_work_application_recognition` authorizes structured application identity and settled accessibility text without visual frame acquisition or OCR.
   - `visual_work_observation` authorizes event-triggered, privacy-masked visual snapshots and local visual extraction, restricting accessibility access to content-free bounding and security-field gating.
   - When `personal_history_retention=false`, live guidance operates ephemerally on volatile work buffers with an absolute 30-second TTL without durable writes, shadow persistence, or candidate playbook creation.
6. **Certified Managed Browser Fallback Only:** Web context observation is owned primarily by the authenticated browser extension. Native fallback is permitted only for certified enterprise-managed browser profiles with verified effective policies disabling Incognito/InPrivate mode and empty URL exception allowlists. Unverified profiles or exceptions block content extraction and emit an `ObservationGap`.

*(Scope Amendment — 2026-11-09): [ADR-0004](0004-browser-bridge-and-execution-boundaries.md) clarifies per-modality browser arbitration and adds support for extension-bound native snapshots: when the browser extension is connected, it owns web semantics while native accessibility queries remain suppressed; however, the native worker may acquire separately permitted, event-triggered snapshots for extension-bound browser surfaces with pre-transfer masking under a certified `SurfaceValidationRecord` with `surface_kind: "browser_extension_bound"`.*

## Rationale and Alternatives
- **Worker Process Isolation vs. Single Helper:** Placing native accessibility and graphics capture in the same process as `oryn-privacy-helper` would allow a single hung Win32 COM query or macOS Mach port deadlock to freeze the core privacy gate, retention sweeper, and shell control channel. The isolated `oryn-observation-worker` incurs an additional ~16–24 MiB RSS overhead, but prevents third-party target application instabilities from destabilizing privacy controls.
- **Background Continuity vs. Foreground-Only Halting:** Halting all screen observation when an employee checks a password manager or personal message creates severe workflow gaps. Because conservative occlusion subtraction masks all covered pixels to opaque black, observing approved background windows is provably safe.
- **Anonymous Shared Memory vs. Filesystem or Base64 IPC:** Base64 JSON over sockets causes CPU spikes and heap thrashing at high resolutions. Temporary filesystem files risk persistent unencrypted leakage upon sudden power loss. Inherited anonymous shared-memory slots provide zero-copy memory safety and guarantee zero filesystem remnants.
- **Source-Specific Fault Isolation vs. Global Collapse:** Crashing the entire application when a localized native accessibility API fails forces employees to restart meeting recordings and browser sessions. Isolating the failure to `native_os` maintains transparency via **Attention Needed** while allowing healthy capture sources to continue.

## Consequences
- `oryn-privacy-helper` must supervise `oryn-observation-worker`, manage shared-memory slot lifecycles, and enforce 500 ms heartbeat timeouts.
- `CaptureSnapshot` in Contract 19 incorporates per-source health and activity tracking (`sources: CaptureSourceState[]`).
- The desktop shell must present independent status indicators and specific headline sublines for partial source faults.
- Native observation adapters require pre-compiled, signed `SurfaceValidationRecord` manifests certifying tested platform and application builds before observation permits can be granted.
