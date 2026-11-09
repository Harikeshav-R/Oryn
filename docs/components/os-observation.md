# Native OS Observation Adapters Component Brief

Status: Detailed technical specification — implementation pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §4.2](../../TECHNICAL.md) | [PRODUCT.md §§3.3, 3.6, 8, 25.1–3, 28.1; ORY-002, ORY-003, ORY-004, ORY-005, ORY-010](../../PRODUCT.md) | [ADR-0003](../adr/0003-native-observation-admission-and-isolation.md)

### Core Responsibility
The Native OS Observation Adapters subsystem reads permitted desktop context, window hierarchy, settled accessibility trees, and event-triggered visual snapshots across approved Windows and macOS business applications using supported operating-system facilities. It normalizes platform-specific events and accessibility topologies into a typed local observation stream delivered to [local-privacy-storage](local-privacy-storage.md) for local privacy enforcement, data minimization, and timeline ingestion.

### Owns
- Platform-specific accessibility bridges for macOS (`AXObserver`, `AXUIElement`) and Windows (`IUIAutomation2` / COM MTA).
- Native window inventory, z-order resolution, and physical desktop exposed-region geometry calculation.
- Window-targeted, event-triggered snapshot acquisition using platform graphics capture APIs (macOS `ScreenCaptureKit` and Windows Graphics Capture / `Windows.Graphics.Capture`).
- Pre-transfer visibility masking, guaranteeing that pixels outside proven exposed regions are overwritten with opaque-black BGRA `(0,0,0,255)` before shared-memory transfer.
- Reporting operating-system-level capability limitations, unsupported controls, and explicit accessibility omissions.
- Local fair scheduling across multiple concurrently visible permitted windows with foreground turn priority.
- Managing native worker execution under the supervision of `oryn-privacy-helper`.

### Consumes
- Strict source admission permits (`GrantObservationPermit`, `RevokeObservationPermit`) issued exclusively by [local-privacy-storage](local-privacy-storage.md).
- Active observation policies, application/window/domain exclusion lists, and validation scope configurations (`ReplaceObservationPolicy`) from [local-privacy-storage](local-privacy-storage.md).
- Frame slot availability and buffer recycling signals (`ReleaseFrameSlot`) from [local-privacy-storage](local-privacy-storage.md).
- OS-level permission grants (macOS Accessibility and Screen Recording; Windows UI Automation and Graphics Capture).

### Produces
- Normalized local observation events (`ObservationEvent` containing `WindowOpened`, `WindowClosed`, `FocusChanged`, `WindowGeometryChanged`, `TreeBaseline`, `ElementStateChanged`, `ElementInvoked`, `SnapshotAvailable`, `ObservationGap`, `CapabilityChanged`, `PermissionChanged`) streamed over private inherited byte channels to [local-privacy-storage](local-privacy-storage.md).
- Bounded, masked BGRA8 snapshots transferred via private inherited shared-memory slots to [local-privacy-storage](local-privacy-storage.md).
- Standardized `ObservationCapability` declarations describing supported platform controls and validated adapter limits.
- Explicit `ObservationGap` records identifying any interval, surface, or modality where reliable evidence could not be acquired.

### Does Not Own
- Authority to grant capture consent, evaluate policy validity, or maintain organizational exclusion lists (solely owned by [local-privacy-storage](local-privacy-storage.md)).
- Downstream optical character recognition (OCR), text entity redaction, or durable evidence retention (owned by [local-privacy-storage](local-privacy-storage.md)).
- Inference of high-level business workflow intent or user guidance (owned by [local-context-hud](local-context-hud.md) and [workflow-discovery](workflow-discovery.md)).
- User-facing status presentation and desktop badge leasing (owned by [desktop-shell](desktop-shell.md)).
- External network communication, remote storage, or centralized telemetry (strictly prohibited in this component).

### Canonical Domain Concepts

The subsystem introduces three canonical domain concepts:

- **Observation Surface:** A specific application window or document context that can be independently permitted or excluded from work observation. *Avoid: Capture target, watched window.*
- **Observation Gap:** A known interval or portion of permitted work for which reliable evidence is unavailable; missing actions remain unknown. *Avoid: Reconstructed activity, assumed step.*
- **Observation Capability:** The declared kinds and limits of work evidence available for a particular application and platform; it grants no authority to observe or execute. *Avoid: Automation support, blanket compatibility.*

### Observation Consent Matrix

Authority over capture categories resides entirely in [local-privacy-storage](local-privacy-storage.md). The observer worker executes source permits derived from the conjunction of employee category consent and active corporate policy. The two independent screen observation categories—`visual_work_observation` and `contextual_work_application_recognition`—govern native acquisition modalities according to the following four-row matrix:

| `visual_work_observation` | `contextual_work_application_recognition` | Native Observer Acquisition Behavior | Downstream Processing & Output |
|---|---|---|---|
| `false` | `false` | **Zero Content Acquisition.** Worker queries minimal application identity, process ID, and window bounds solely to compute occlusion geometry and enforce exclusion boundaries. No text, control labels, or pixels are read. | Emits only content-free status events (`CapabilityChanged`, `PermissionChanged`, or non-identifying `ObservationGap`). No task context or visual evidence is emitted. |
| `false` | `true` | **Structured Context Only.** Queries permitted application identity, safe window titles, and settled accessibility element trees (`NodeObservation`). **Zero pixel acquisition.** Platform snapshot APIs (`ScreenCaptureKit`, WGC) remain inactive; frame slots are not allocated. | Emits `WindowOpened`, `FocusChanged`, `TreeBaseline`, and `ElementStateChanged` with structured text. No OCR is performed; no images are captured or retained. |
| `true` | `false` | **Privacy-Gated Snapshots Only.** Accessibility subsystem is used strictly for content-free security role, password/protected field bounding, and geometry checks. Never reads or emits element labels, values, titles, or text streams. Event-triggered snapshots are acquired and masked. | Emits `SnapshotAvailable` with masked shared-memory frames. [local-privacy-storage](local-privacy-storage.md) executes safe local visual extraction and OCR. Zero structured accessibility events are emitted. |
| `true` | `true` | **Full Permitted Modalities.** Acquires both structured accessibility tree observations and event-triggered visual snapshots for admitted surfaces. Maintains separate provenance for structured and visual evidence streams. | Emits both structured events and `SnapshotAvailable` notifications. Downstream components correlate evidence streams using explicit surface and sequence identifiers. |

#### Personal History Retention Boundary
When `personal_history_retention=false`, durable evidence, timeline entries, search indexes, and candidate task logs are prohibited. However, live local guidance by [local-context-hud](local-context-hud.md) remains authorized if employee consent is active. In this mode:
1. The observer worker acquires permitted masked snapshots and emits `SnapshotAvailable` as normal.
2. [local-privacy-storage](local-privacy-storage.md) copies the frame from the shared-memory slot into a bounded private volatile work buffer and immediately emits `ReleaseFrameSlot`.
3. Privacy storage runs local redaction and ephemeral OCR in volatile memory.
4. Ephemeral redacted results are delivered to [local-context-hud](local-context-hud.md) with an absolute time-to-live of 30 seconds from acquisition.
5. If live context components cannot consume or process the frame within 30 seconds, the frame is dropped and an `ObservationGap` is recorded.
6. All volatile pixel and text buffers are zeroed and deallocated immediately upon consumption or expiration. Disabling retention at runtime immediately flushes and zeroes all uncommitted persistence queues. Zero disk cache, database records, search tokens, or durable evidence receipts are created.
7. Organizational sharing (`organizational_sharing`) never authorizes acquisition and cannot transmit raw media under any circumstance. Meeting categories are entirely separate and cannot be started through screen observation channels.

### Surface Admission Invariant
A native window is admitted as an active **Observation Surface** if and only if all conjuncts of the following admission predicate evaluate to `true`:
$$\text{Admitted}(\text{surface}) \iff \text{PermitValid} \land \text{ConsentActive} \land \text{PolicyValid} \land \text{VisibilityLeaseHealthy} \land \text{IdentityStable} \land \text{NotExcluded} \land \text{RegionExposed} \land \text{ModalityValidated}$$

Where:
- $\text{PermitValid}$: An unexpired `GrantObservationPermit` issued by [local-privacy-storage](local-privacy-storage.md) matches the current `surface_id` and `surface_generation`.
- $\text{ConsentActive}$: Employee consent covers the requested modality according to the Consent Matrix.
- $\text{PolicyValid}$: Active corporate capture policy lease is valid, verified, and unexpired.
- $\text{VisibilityLeaseHealthy}$: Desktop shell visibility lease renewal was received within the preceding 500 ms.
- $\text{IdentityStable}$: Process ID, start-time token, bundle/binary identity, and window handle form a verified tuple resistant to handle reuse.
- $\text{NotExcluded}$: The application executable, bundle ID, window title (if permitted), and associated domain do not match any mandatory or corporate exclusion rule.
- $\text{RegionExposed}$: The window possesses a non-empty uncovered physical pixel rectangle after subtracting all overlapping higher-z-order windows.
- $\text{ModalityValidated}$: An embedded, signed `SurfaceValidationRecord` exists and matches the current OS build, application build, locale, and target modality.

If any conjunct is unknown, false, or stale, observation for that surface or modality is immediately blocked and an explicit `ObservationGap` is recorded. Application approval alone never authorizes snapshot acquisition without a valid `SurfaceValidationRecord`.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§3.3, 3.6, 8, 25.1–3, 28.1; ORY-002–005, ORY-010](../../PRODUCT.md))
- **Mandatory Exclusions Enforced at Source (ORY-005):** Personal password managers, authentication secrets, personal messaging, banking, private browsing, HR compensation, and employee-excluded windows must never be captured. When an excluded window takes focus, observation for that window is completely suppressed.
- **Independent Multi-Window Work Observation (ORY-003, ORY-005):** Permitted, visible business windows across all active physical displays remain under active observation even when an excluded window takes foreground focus. An excluded foreground window does not halt observation of safe, non-overlapping background business windows.
- **Uncovered-Only Content Acquisition (ORY-005):** Only physical pixels and UI controls proven to be uncovered are eligible for observation. Minimized, hidden, cloaked, fully covered, off-screen, or other-desktop/Space content must never be queried, captured, or retained. Covered regions of partially occluded windows are masked to opaque-black before memory transfer.
- **No Continuous Video Streaming:** Continuous screen recording or full-motion video feeds are strictly prohibited. The system acquires event-triggered, single-frame visual snapshots only upon meaningful task state transitions, window activations, dialog openings, or verified element invocations.
- **Capability Transparency and Explicit Gaps (ORY-003, ORY-010):** The adapter must report exact platform and application observation limits. Inaccessible UI elements, dropped events, buffer overruns, and platform timeouts must be recorded as explicit `ObservationGap` events rather than guessed, interpolated, or hidden.
- **Resource and Responsiveness Discipline:** Native observation must never cause perceptible typing lag, dropped user input, or UI hitches in business applications. Static screens must idle at negligible CPU and memory footprints.

## Upstream and downstream contracts

**Catalog references:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md) (Contract 1, Contract 19)

### Process Architecture and Transport Mechanism
The observation adapter executes as a dedicated, unprivileged child process named `oryn-observation-worker` (`oryn-observation-worker.exe` on Windows). It is spawned and directly supervised by `oryn-privacy-helper`. The desktop shell supervises the privacy helper tree but does not communicate directly with the observer worker.

The privacy helper and observer worker communicate exclusively over two private inherited bidirectional byte channels:
1. **Control Channel:** Transmits priority commands, policy updates, source permits, slot releases, and heartbeats.
2. **Observation Channel:** Streams normalized `ObservationEvent` envelopes and snapshot notifications.

- **macOS:** Channels are created via `socketpair(AF_UNIX, SOCK_STREAM, 0)`. Descriptors are passed across `fork`/`exec` to the child; duplicate descriptors in parent and child are closed immediately. Close-on-exec (`FD_CLOEXEC`) is enforced on all non-child descriptors.
- **Windows:** Channels are created via anonymous pipe pairs (`CreatePipe`). Explicit handle inheritance is configured using `InitializeProcThreadAttributeList` with `PROC_THREAD_ATTRIBUTE_HANDLE_LIST` in `STARTUPINFOEXW`. Duplicate and unused handle copies are closed immediately.

No public named pipes, filesystem sockets, localhost TCP/HTTP endpoints, or shared registry paths are used.

#### Binary Identity and Verification
Prior to spawning `oryn-observation-worker`:
- On macOS, `oryn-privacy-helper` validates that the worker binary is located within the authenticated application bundle (`<AppBundle>/Contents/MacOS/oryn-observation-worker`) and that its designated code requirement matches the host's team identifier and bundle structure using `SecStaticCodeCheckValidity`.
- On Windows, `oryn-privacy-helper` validates that the worker binary is located within the secure installation directory (`<InstallDir>\oryn-observation-worker.exe`) and verifies its Authenticode digital signature and publisher identity using `WinVerifyTrust`.

#### Framing and Wire Convention
Communication on both channels uses length-prefixed framing:
1. A **4-byte unsigned big-endian integer** indicating payload byte length ($0 < \text{length} \le 1{,}048{,}576$).
2. A **UTF-8 JSON encoded payload** of exactly that byte length.

All 64-bit unsigned integers (timestamps, sequence numbers, revisions, generations) are serialized as **decimal strings** (e.g., `"1420"`), preventing precision loss in JSON deserializers. UUID values are serialized as canonical hyphenated 36-character strings.

### Protocol Handshake (`os-observation.v1`)
Upon channel creation, the privacy helper and worker execute a mandatory handshake with a strict 3,000 ms timeout.

**Privacy Helper Handshake Hello:**
```json
{
  "type": "HandshakeHello",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "worker_epoch": "7d2e4a81-9f12-4c33-b820-112233445566",
  "control_sequence": "1",
  "payload": {
    "protocol_major": 1,
    "protocol_minor": 0,
    "expected_worker_build": "2026.11.08.1",
    "boot_clock_id": "clock_boot_darwin_arm64_001",
    "organization_id": "org_enterprise_corp",
    "employee_id": "emp_harikeshav_r",
    "profile_id": "prof_primary_01"
  }
}
```

**Worker Handshake Ack:**
```json
{
  "type": "HandshakeAck",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "worker_epoch": "7d2e4a81-9f12-4c33-b820-112233445566",
  "control_sequence": "1",
  "payload": {
    "protocol_major": 1,
    "protocol_minor": 0,
    "worker_build": "2026.11.08.1",
    "os_build": "macOS 15.1.0 (24B83)",
    "adapter_version": "1.0.0",
    "boot_clock_id": "clock_boot_darwin_arm64_001",
    "validation_manifest_digest": "sha256:4a8c9b2f1e3d5a7c8e9b0a1f2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d"
  }
}
```

If the handshake fails, times out, reports mismatched epochs, or detects an incompatible build, the privacy helper terminates the worker and records a durable `crash` recovery blocker.

### Control Channel Message Definitions

All privacy-to-worker control messages use the standard envelope:
`{"type":"<Variant>","session_epoch":"<UUID>","worker_epoch":"<UUID>","control_sequence":"<DecimalString>","payload":{...}}`.

Worker responses use `CommandAck`:
```json
{
  "type": "CommandAck",
  "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
  "worker_epoch": "7d2e4a81-9f12-4c33-b820-112233445566",
  "control_sequence": "12",
  "payload": {
    "ack_control_sequence": "12",
    "status": "applied",
    "reason_code": null
  }
}
```

#### Privacy-to-Worker Commands

1. **`ReplaceObservationPolicy`**
   - Transmits active corporate policies, exclusion patterns, category switches, and validation ID filters. Replaces prior policy state atomically.
   ```json
   {
     "type": "ReplaceObservationPolicy",
     "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
     "worker_epoch": "7d2e4a81-9f12-4c33-b820-112233445566",
     "control_sequence": "2",
     "payload": {
       "policy_revision": "1420",
       "consent_revision": "1420",
       "scope_generation": "1",
       "visual_work_observation": true,
       "contextual_work_application_recognition": true,
       "excluded_application_ids": [
         "com.1password.1password",
         "com.bitwarden.desktop",
         "KeePass.exe"
       ],
       "excluded_window_title_patterns": [
         "*Private Browsing*",
         "*Incognito*",
         "*Payroll*"
       ],
       "enabled_validation_ids": [
         "val_macos_generic_v1",
         "val_win32_standard_v1"
       ],
       "disabled_validation_ids": []
     }
   }
   ```

2. **`GrantObservationPermit`**
   - Grants temporary authority to observe an admitted surface for up to 300 ms. Renewed every 100 ms while active.
   ```json
   {
     "type": "GrantObservationPermit",
     "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
     "worker_epoch": "7d2e4a81-9f12-4c33-b820-112233445566",
     "control_sequence": "3",
     "payload": {
       "permit_id": "pmt_883a01f9-4b21-4f12-9c10-223344556677",
       "surface_id": "surf_app_excel_win_1042",
       "surface_generation": "1",
       "scope_generation": "1",
       "policy_revision": "1420",
       "consent_revision": "1420",
      "allow_structured_content": true,
      "allow_snapshot": true,
      "not_after_mono_ns": "128450423456789",
      "browser_binding": null
   }
   ```

3. **`RevokeObservationPermit`**
   - Immediately revokes an outstanding permit. Worker flushes in-flight work and acknowledges before halting.
   ```json
   {
     "type": "RevokeObservationPermit",
     "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
     "worker_epoch": "7d2e4a81-9f12-4c33-b820-112233445566",
     "control_sequence": "4",
     "payload": {
       "permit_id": "pmt_883a01f9-4b21-4f12-9c10-223344556677",
       "surface_id": "surf_app_excel_win_1042",
       "surface_generation": "1",
       "scope_generation": "1",
       "reason_code": "window_occluded"
     }
   }
   ```

4. **`StopNativeObservation`**
   - Immediately halts all native observation and revokes all active permits (e.g., on employee pause or lock).
   ```json
   {
     "type": "StopNativeObservation",
     "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
     "worker_epoch": "7d2e4a81-9f12-4c33-b820-112233445566",
     "control_sequence": "5",
     "payload": {
       "reason_code": "employee_paused"
     }
   }
   ```

5. **`ReleaseFrameSlot`**
   - Acknowledges that [local-privacy-storage](local-privacy-storage.md) has safely read, copied, and zeroed a shared-memory frame slot, advancing its generation and granting permission to write new frames.
   ```json
   {
     "type": "ReleaseFrameSlot",
     "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
     "worker_epoch": "7d2e4a81-9f12-4c33-b820-112233445566",
     "control_sequence": "6",
     "payload": {
       "slot_id": "slot_0",
       "released_generation": "1",
       "next_generation": "2",
       "event_id": "evt_99112233-4455-6677-8899-aabbccddeeff"
     }
   }
   ```

#### Worker-to-Privacy Control Messages
- `WorkerReady`: Sent after handshake completion with embedded validation records.
- `WorkerHeartbeat`: Emitted every 100 ms containing current monotonic timestamp and active surface counts. Privacy watchdog enforces 500 ms timeout.
- `PermitRevoked`: Emitted upon immediate cancellation of a permit.
- `NativeStopped`: Emitted when all acquisition gates are closed following `StopNativeObservation`.
- `WorkerFault`: Emitted when an unrecoverable internal exception or OS API error occurs.

### Shared-Memory Snapshot Buffer Architecture

High-resolution visual frames are transferred using **two lazily committed inherited shared-memory slots** (`slot_0` and `slot_1`), each capped at **8 MiB (8,388,608 bytes)**:
- **macOS:** Created via `shm_open` with mode `0600`, immediately unlinked via `shm_unlink` before spawning the child, and inherited strictly by file descriptor across `exec`.
- **Windows:** Created via `CreateFileMappingW(INVALID_HANDLE_VALUE, ...)` without a name, and inherited strictly by handle via `PROC_THREAD_ATTRIBUTE_HANDLE_LIST`.

**Key Shared-Memory Invariants:**
1. **Zero Filesystem Discovery:** No persistent paths, temporary files, or named objects exist in the filesystem or object namespace.
2. **Single-Writer / Single-Reader Lifecycle:** A slot follows the state progression:
   $$\text{free} \longrightarrow \text{writing} \longrightarrow \text{ready} \longrightarrow \text{reading} \longrightarrow \text{zeroing} \longrightarrow \text{free}$$
3. **Pre-Transfer Masking:** The worker acquires the OS window raster into worker-private memory, paints all occluded, security-dialog, or excluded regions with opaque-black BGRA `(0,0,0,255)`, and copies only the masked result into the shared slot.
4. **Mandatory Black-Pixel Verification:** Upon receiving `SnapshotAvailable`, [local-privacy-storage](local-privacy-storage.md) maps the slot, computes its SHA-256 digest, and samples declared masked regions. If any pixel in a declared masked region does not equal `(0,0,0,255)`, the frame is rejected, the slot is quarantined, and native capture is halted.
5. **Backpressure and Timeout:** If privacy storage does not consume and release a slot within 500 ms, snapshot production is suspended and an `ObservationGap(reason="slot_backpressure")` is recorded. The structured observation stream continues uninterrupted.
6. **Slot Quarantine on Revocation:** If a permit is revoked while a slot is `writing` or `ready`, privacy storage quarantines the slot, instructs the worker to abort the write, waits up to 500 ms for quiescence, and zeroes the memory. If the worker fails to quiesce within 500 ms, the privacy helper terminates the worker process before reallocating memory.

### Observation Channel Event Stream

Observation events are wrapped in a standard JSON message:
`{"type":"ObservationEvent","event":<ObservationEvent>}`.

#### Common `ObservationEvent` Schema
```typescript
export interface ObservationEvent {
  schema_version: "os-observation.event.v1";
  event_id: string;               // UUIDv4
  session_epoch: string;          // UUIDv4
  worker_epoch: string;           // UUIDv4
  sequence: string;               // Monotonic decimal string of u64
  surface_id: string | null;      // Opaque surface identifier (null for system gaps)
  surface_generation: string | null;
  scope_generation: string;
  policy_revision: string;
  consent_revision: string;
  permit_id: string | null;
  observed_at_utc: string;        // RFC 3339 UTC timestamp
  observed_mono_ns: string;       // Boot-monotonic timestamp as decimal string
  source: "native_os";
  availability: "available" | "degraded" | "unavailable";
  fidelity: "structured" | "snapshot" | "metadata_only";
  payload: EventPayload;
}
```

#### Shared Geometry and Element Primitives
- **DesktopRectangle:** Physical desktop pixels `{ "x": i32, "y": i32, "width": u32, "height": u32 }` where width and height are non-zero for visible regions. Negative coordinate origins are valid.
- **AffineTransform:** Six finite `f64` values `[m11, m12, m21, m22, dx, dy]` mapping window coordinates to physical desktop pixels. Singular, infinite, or NaN values are rejected.
- **NodeObservation:**
  ```typescript
  export interface NodeObservation {
    element_id: string;           // Opaque string unique to (surface_generation, tree_version)
    role: "window" | "dialog" | "button" | "text" | "editable_text" |
          "checkbox" | "radio" | "combobox" | "list" | "list_item" |
          "table" | "row" | "cell" | "menu" | "menu_item" | "link" |
          "image" | "container" | "unknown";
    bounds: DesktopRectangle;
    states: Array<"focused" | "enabled" | "selected" | "expanded" | "checked" | "read_only" | "busy">;
    label: string | null;         // Null if unconsented, empty, or inaccessible
    value: string | null;         // Null for non-value elements or secure fields
    text_truncated: boolean;
    origin: "provider_observation";
  }
  ```

#### Payload Variants

1. **`WindowOpened`:** Emitted when a new eligible surface is detected.
   ```json
   {
     "kind": "WindowOpened",
     "application_identity": "com.microsoft.Excel",
     "application_build": "16.89.1",
     "native_window_id": "win_0x7ffe104",
     "bounds": { "x": 100, "y": 100, "width": 1280, "height": 800 },
     "display_id": "disp_primary_01"
   }
   ```

2. **`WindowClosed`:** Emitted when an admitted surface closes or is destroyed.
   ```json
   {
     "kind": "WindowClosed",
     "reason": "user_closed"
   }
   ```

3. **`FocusChanged`:** Emitted when keyboard or window focus shifts.
   ```json
   {
     "kind": "FocusChanged",
     "focused": true
   }
   ```

4. **`WindowGeometryChanged`:** Emitted when bounds, z-order, or physical display mapping changes.
   ```json
   {
     "kind": "WindowGeometryChanged",
     "bounds": { "x": 120, "y": 140, "width": 1400, "height": 900 },
     "display_id": "disp_primary_01",
     "is_occluded": false
   }
   ```

5. **`TreeBaseline`:** Delivers a complete or fragmented settled accessibility hierarchy snapshot for an admitted surface.
   ```json
   {
     "kind": "TreeBaseline",
     "baseline_id": "base_55443322-1100-aaee-bbcc-112233445566",
     "fragment_index": 0,
     "fragment_count": 1,
     "nodes": [
       {
         "element_id": "node_01",
         "role": "button",
         "bounds": { "x": 140, "y": 160, "width": 80, "height": 30 },
         "states": ["enabled"],
         "label": "Save",
         "value": null,
         "text_truncated": false,
         "origin": "provider_observation"
       }
     ],
     "omitted_node_count": 0,
     "complete": true
   }
   ```

6. **`ElementStateChanged`:** Emitted when a single element's states, bounds, or settled values update.
   ```json
   {
     "kind": "ElementStateChanged",
     "node": {
       "element_id": "node_01",
       "role": "checkbox",
       "bounds": { "x": 140, "y": 200, "width": 20, "height": 20 },
       "states": ["enabled", "checked"],
       "label": "Include Tax",
       "value": null,
       "text_truncated": false,
       "origin": "provider_observation"
     }
   }
   ```

7. **`ElementInvoked`:** Emitted strictly when an explicit OS accessibility invocation notification occurs.
   ```json
   {
     "kind": "ElementInvoked",
     "element_id": "node_01",
     "role": "button",
     "bounds": { "x": 140, "y": 160, "width": 80, "height": 30 },
     "provider_event": "AXPress",
     "actor": "unknown"
   }
   ```

8. **`SnapshotAvailable`:** Signals that a masked visual snapshot is available in a shared-memory slot.
   ```json
   {
     "kind": "SnapshotAvailable",
     "slot_id": "slot_0",
     "slot_generation": "1",
     "byte_length": 4096000,
     "sha256": "8f3b9c2a1e4d5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
     "width": 1280,
     "height": 800,
     "stride_bytes": 5120,
     "pixel_format": "BGRA8",
     "source_to_desktop_transform": [1.0, 0.0, 0.0, 1.0, 100.0, 100.0],
     "display_layout_generation": "1",
     "masked_regions": [
       { "x": 100, "y": 100, "width": 300, "height": 200 }
     ]
   }
   ```

9. **`ObservationGap`:** Declares an unobserved interval, missing modality, or dropped evidence.
   ```json
   {
     "kind": "ObservationGap",
     "reason": "occluded",
     "start_mono_ns": "128450123456789",
     "end_mono_ns": "128450223456789",
     "surface_generation": "1",
     "affected_modality": "snapshot",
     "lost_count": "1",
     "requires_resync": false
   }
   ```

10. **`CapabilityChanged`:** Emitted when supported platform capabilities for an application change.
    ```json
    {
      "kind": "CapabilityChanged",
      "capability": {
        "application_identity": "com.microsoft.Excel",
        "application_build": "16.89.1",
        "os_build": "macOS 15.1.0",
        "adapter_version": "1.0.0",
        "validation_id": "val_macos_generic_v1",
        "structured_context": "available",
        "invocation_events": "available",
        "window_geometry": "available",
        "snapshots": "available",
        "visual_extraction_eligible": true,
        "limitations": ["no_cell_formula_tree"],
        "reason_codes": []
      }
    }
    ```

11. **`PermissionChanged`:** Emitted upon detecting a change in OS-level user permission grants.
    ```json
    {
      "kind": "PermissionChanged",
      "permission": "accessibility",
      "state": "granted"
    }
    ```

## Trust and deployment boundaries

### Process and Boundary Model
- **Supervision Hierarchy:** `Desktop Companion Host` $\longrightarrow$ `oryn-privacy-helper` $\longrightarrow$ `oryn-observation-worker`. The worker is an unprivileged user process without administrative rights or elevation.
- **Operating System Credentials & IPC:** The worker inherits strictly scoped socketpairs or anonymous pipes. It binds no network ports, opens no localhost interfaces, mounts no IPC endpoints, and exposes no external APIs.
- **Binary Code Signing:** Binaries are signed with Apple Developer ID (macOS) or corporate Authenticode (Windows). Launch integrity is validated before execution.
- **Fail-Closed Capture Channel:** Any transport disconnection (EOF, socket reset, broken pipe) collapses the worker capture loop immediately.
- **Untrusted Target Application Data:** Window titles, accessibility trees, and UI values extracted from target applications are treated as untrusted data. They are never executed, passed to shell commands, or used to formulate SQL statements.

## Internal architecture

### Subsystem Module Responsibilities

The subsystem spans two processes—`oryn-privacy-helper` and `oryn-observation-worker`—organized into discrete logical modules:

```
[ oryn-privacy-helper (Rust) ]
  ├── ObservationSupervisor : Spawns worker, monitors watchdog (500ms), manages recovery blockers
  └── PermitGate            : Evaluates policy/consent, issues & revokes source permits, controls slots
          │ (Inherited socketpair / anonymous pipe + Shared Memory)
[ oryn-observation-worker (Rust Core + Platform Bridges) ]
  ├── SurfaceRegistry       : Tracks active OS surfaces, handles, and process identities
  ├── VisibilityResolver    : Computes occlusion geometry, display clipping, and exposed regions
  ├── FairScheduler         : Implements 100ms time-slices, FIFO foreground/background turn queues
  ├── PlatformObserver      : Platform-specific bridges (Swift on macOS, COM MTA on Windows)
  ├── SnapshotBroker        : Manages ScreenCaptureKit / WGC sessions, executes pre-transfer masking
  ├── EventNormalizer       : Normalizes roles, states, and coordinates into standard Oryn schema
  └── CapabilityReporter    : Evaluates and emits application-specific observation capability records
```

### Platform Extraction Implementations

#### macOS Platform Bridge
- **Accessibility Integration:** Utilizes `AXObserver` on the main worker dispatch thread to listen for `kAXFocusedWindowChangedNotification`, `kAXWindowMovedNotification`, `kAXWindowResizedNotification`, and `kAXValueChangedNotification`. Individual element queries use `AXUIElementCopyAttributeValue` with strict messaging timeouts configured via `AXUIElementSetMessagingTimeout(element, 0.1)`. Unresponsive calls return degraded element status rather than blocking the event loop.
- **Window Inventory & Geometry:** Queries `CGWindowListCopyWindowInfo` and ScreenCaptureKit shareable content metadata to enumerate on-screen windows and resolve physical desktop bounds.
- **Visual Snapshots:** Uses ScreenCaptureKit (`SCShareableContent`, `SCContentFilter(desktopIndependentWindow:)`, and `SCScreenshotManager.captureImage(contentFilter:configuration:)` on macOS 14+). Captured frames are rendered into worker-private buffers, masked against occluded rectangles, and copied into shared-memory slots.
- **Swift/Rust Architecture:** The Swift bridge is compiled into a static library linked directly into `oryn-observation-worker`. The Swift code exposes a narrow, explicit C ABI with manual memory ownership rules. No secondary Swift helper process is spawned.

#### Windows Platform Bridge
- **UI Automation Integration:** Employs Windows UI Automation (`IUIAutomation2`) initialized on a dedicated multithreaded apartment (COM MTA) worker thread. Event handlers (`IUIAutomationFocusChangedEventHandler`, `IUIAutomationPropertyChangedEventHandler`) are registered and removed strictly on that owner thread. Connection and transaction timeouts are explicitly configured to 100 ms via `IUIAutomation2::put_TransactionTimeout(100)` and `IUIAutomation2::put_ConnectionTimeout(100)`.
- **Window Inventory & Geometry:** Interrogates desktop window handles (`HWND`) via `EnumWindows`, filtering out non-standard and cloaked windows (`DWMWA_CLOAKED`). Queries `GetWindowRect` and display DPI contexts (`GetDpiForWindow`) to map coordinates into physical desktop pixels.
- **Visual Snapshots:** Uses Windows Graphics Capture (`IGraphicsCaptureItemInterop::CreateForWindow`) with Direct3D 11 (`ID3D11Device`, `Direct3D11CaptureFramePool`). When a snapshot is triggered, a short-lived `GraphicsCaptureSession` captures a single frame, extracts the raster via staging texture mapping, executes pre-transfer masking, copies pixels into the shared file mapping, and immediately closes the session.
- **Security Constraints:** The worker does not request `uiAccess=true` in its manifest, does not bypass UAC, does not inject DLLs, and does not install global keyboard or mouse hooks (`SetWindowsHookEx`). Access denied to elevated processes is reported honestly as degraded capability.

### Visibility and Exposed-Region Algorithm
The observer executes an uncovered-region calculation before querying any control text or capturing any pixel:
1. **Window Enumeration:** Collects all visible top-level windows in z-order from front to back across all active physical displays.
2. **Metadata Filter:** Skips windows where `IsWindowVisible` is false, `DWMWA_CLOAKED` is non-zero, bounds are zero, or the window belongs to a hidden desktop / macOS Space.
3. **Display Clipping:** Intersects window bounds with physical display rectangles. Content outside physical monitor coordinates is discarded.
4. **Occlusion Subtraction:** For each candidate window $W_i$, iterates over all higher-z-order windows $W_j$ ($j < i$). If $W_j$ intersects $W_i$:
   - The intersection rectangle $R_{\text{occluded}} = W_i \cap W_j$ is subtracted from the visible region of $W_i$.
   - Any higher window—whether an excluded application, a transparent window, an Oryn UI panel, or an unknown surface—is treated as fully opaque and occluding. The algorithm never queries or inspects the content of an occluding window to determine transparency.
5. **Pre/Post Generation Sampling:** Geometry and policy generations are sampled immediately before extraction and verified immediately after extraction. If the window moved, resized, or changed z-order during extraction, the extracted data is discarded and an `ObservationGap(reason="display_changed")` is emitted.
6. **Masking & Text Truncation:**
   - Visual frames paint all subtracted $R_{\text{occluded}}$ regions with opaque-black BGRA `(0,0,0,255)`.
   - Structured accessibility traversals skip any control whose bounding box intersects an occluded region. Partially clipped text controls are omitted rather than emitting partial or uncertain values.

### Browser Observation Arbitration
Browser observation is arbitrated per surface and modality by [local-privacy-storage](local-privacy-storage.md), never by native observer heuristics:
1. **Per-Modality Arbitration:** When an authenticated [browser-extension](browser-extension.md) is connected and bound to the native browser window, the extension provides document DOM, URL, and interaction events. The native observer suppresses structured accessibility queries for that window, emitting window geometry and lifecycle events only.
2. **Extension-Bound Visual Snapshots:** When visual work observation is consented (`visual_work_observation=true`), the native worker may acquire event-triggered visual snapshots of the extension-bound browser window using a certified `SurfaceValidationRecord` with `surface_kind: "browser_extension_bound"`. Before acquisition and before transfer, the worker validates native window bounds, exposure, and document generation, painting all occluded or extension-reported protected-input regions to opaque-black `(0,0,0,255)`. If the native graphics capture provider cannot prove source identity or if binding changes mid-flight, snapshot acquisition is canceled, shared-memory buffers are zeroed, and the surface operates in semantic-only mode.
3. **Native Fallback Certification:** If the extension is absent or unavailable, native observation falls back to extracting browser context *only* if the browser instance satisfies a strict certification check:
   - Operating in an enterprise-managed browser profile with verified policy restrictions.
   - For Google Chrome: effective enterprise policy `IncognitoModeAvailability=1` (Disabled) and `IncognitoModeUrlAllowlist` is empty or absent.
   - For Microsoft Edge: effective enterprise policy `InPrivateModeAvailability=1` (Disabled) and `InPrivateModeUrlAllowlist` is empty or absent.
   - A valid bundled `SurfaceValidationRecord` exists for the specific browser build and platform.
4. **Fallback Failure & Blocking:** If private-mode policy cannot be verified, if URL exceptions exist, if guest or unmanaged profiles are detected, or if document-to-window mapping is ambiguous, native browser context extraction is blocked. The surface is assigned `unsupported_surface` status and an `ObservationGap` is emitted.
5. **Source Transition Invariant:** Switching between extension observation and native fallback terminates the active `surface_generation`, forces an explicit `ObservationGap`, and requires a new `TreeBaseline`.
### Surface Validation Records

The subsystem uses embedded `SurfaceValidationRecord` objects issued by Oryn adapter maintainers after automated synthetic validation suites pass:

```typescript
export interface SurfaceValidationRecord {
  validation_id: string;              // e.g. "val_macos_excel_16_89"
  adapter_version: string;
  os_builds: string[];               // Exact OS version/build strings
  application_signing_identity: string;
  application_builds: string[];       // Exact application build identifiers
  locales: string[];                  // Exact supported BCP 47 locale codes
  surface_kind: "standard" | "custom_canvas" | "browser_managed" | "browser_extension_bound";
  modalities: Array<"structured" | "snapshot">;
  required_grants: Array<"accessibility" | "screen_recording" | "uia" | "graphics_capture">;
  source_probe_id: string;
  sensitive_region_probe_id: string;
  visibility_probe_id: string;
  test_evidence_digest: string;       // SHA-256 digest of synthetic test suite run
  issued_at_utc: string;
}
```

Validation records are baked into the signed binary of `oryn-observation-worker`. When the worker launches, it emits the digest of its embedded manifest in `HandshakeAck`. Privacy storage verifies this digest against its policy before issuing any permit referencing a `validation_id`. Policy can disable specific validation IDs immediately via `ReplaceObservationPolicy`, but cannot mint new records. Expanding adapter support requires a signed software update.

## State and lifecycle

### Worker Lifecycle State Machine

The worker process operates across five discrete states:

```
[ Uninitialized ]
       │ Launch & Handshake
       ▼
 [ ReadyStopped ] <═══════════════════════════════════════════════╗
       │                                                          ║
       │ GrantObservationPermit                                   ║ StopNativeObservation /
       ▼                                                          ║ Expired Permit / Pause
  [ Observing ] ──(Provider Timeout / Degraded Control)──> [ Degraded ]
       │                                                          ║
       │ Exception / Fault / SIGTERM                              ║
       ▼                                                          ║
   [ Failed ] ────────────────────────────────────────────────────╝
```

- **Uninitialized:** Process spawned; channels connected; awaiting `HandshakeHello`.
- **ReadyStopped:** Handshake complete; embedded validation records verified; no permits active; zero content queries or snapshots.
- **Observing:** Active permits granted; scheduler executing extraction time-slices; streaming events and frames.
- **Degraded:** One or more surfaces experiencing provider timeouts, clipped controls, or high load. Non-degraded surfaces continue normally.
- **Failed:** Unrecoverable fault, channel EOF, or watchdog expiration. Gates collapse; process terminates.

### Surface State Tracking
Each detected window is tracked in `SurfaceRegistry` under one of seven orthogonal statuses:
1. `metadata_only`: Unadmitted or unconsented window; tracked for bounds and occlusion only.
2. `permitted`: Valid permit active; actively observed under admitted modalities.
3. `excluded`: Matches corporate or personal exclusion rule; zero content query.
4. `occluded`: Permitted application but fully covered by higher windows; acquisition halted.
5. `unsupported`: Lacks matching validation record or platform accessibility support.
6. `permission_denied`: Missing required OS-level permission grant.
7. `provider_timeout`: Application accessibility API unresponsive; temporarily backed off.

### Crash Recovery and Blocker Persistence
1. **Worker Termination:** If `oryn-observation-worker` crashes or exits unexpectedly, the socketpair/pipe breaks. `oryn-privacy-helper` detects immediate channel EOF.
2. **Native Gate Collapse:** The privacy helper immediately marks the `native_os` source as `unavailable`, revokes all active permits, invalidates in-flight frame slots, and writes an `ObservationGap(reason="worker_restart")` to the local context stream.
3. **Durable Blocker Persistence:** The privacy helper records a durable recovery blocker `crash` or `hang` in local privacy storage specifically for the `native_os` source.
4. **Supervised Restart Backoff:** The privacy helper may restart the worker process following an exponential backoff schedule (100 ms, 500 ms, 1,500 ms). Once restarted, the worker remains strictly in `ReadyStopped`. **It is never granted permits automatically.**
5. **Independent Capture Preservation:** A native worker crash does not halt or degrade active [browser-extension](browser-extension.md) observation or [meeting-intelligence](meeting-intelligence.md) audio recording. Those sources continue operating under their independent permits, and the desktop companion reflects independent source health.

### Deliberate Resume Semantics
To resume native observation following a crash, pause, or policy update:
- The employee must perform an intentional action in the companion UI, dispatching `ResumeCapture` via [desktop-shell](desktop-shell.md).
- The `ResumeCapture` command operates on categories (`visual_work_observation`, `contextual_work_application_recognition`), not individual process IDs.
- Privacy storage validates that all gates are healthy (consent active, policy lease valid, visibility lease unexpired, OS permissions granted).
- If valid, privacy storage clears the `crash` blocker for `native_os`, issues `ReplaceObservationPolicy`, and begins dispatching `GrantObservationPermit` to the worker.
- If gates remain invalid or permissions are missing, the command is rejected and capture remains stopped.

## Error and edge-case behavior

### Failure Scenarios and Mitigations

| Failure Scenario | Immediate Detection Mechanism | Observer Worker Action | Privacy Helper / System Action |
|---|---|---|---|
| **OS Permission Revoked at Runtime** | Polled probe (1 s interval) or API failure code (`kAXErrorCannotComplete`, `E_ACCESSDENIED`). | Closes acquisition gates; emits `PermissionChanged(state="denied")`; transitions affected surfaces to `permission_denied`. | Emits `ObservationGap(reason="permission_denied")`; updates `CaptureSnapshot` to show degraded native source; companion presents Attention Needed. |
| **Target Application Hangs in Query** | Per-call timeout expires (100 ms via `AXUIElementSetMessagingTimeout` or MTA timeout). | Aborts query; marks surface as `provider_timeout`; skips surface for 2,000 ms; emits `ObservationGap(reason="provider_timeout")`. | Other permitted windows continue observation without hitching or frame drops. |
| **Unkillable Native Call** | Worker thread blocked on native OS deadlock > 500 ms. | Watchdog thread detects missed internal heartbeat. | Worker process self-terminates (`SIGABRT` / `TerminateProcess`). Privacy helper detects EOF and handles as worker crash. |
| **High Event Flood (Mouse/Animation)** | Event queue exceeds 1,024 items. | Coalesces rapid geometry updates; drops intermediate positions; preserves ordered focus and lifecycle events; emits `ObservationGap(reason="queue_overflow")`. | Enforces bounded CPU consumption; user application remains responsive. |
| **Display Disconnection / DPI Change** | OS display configuration notification (`CGDisplayRegisterReconfigurationCallback` / `WM_DISPLAYCHANGE`). | Invalidates all cached surface geometries and display transforms; clears frame slots; emits `ObservationGap(reason="display_changed")`. | Requests fresh `TreeBaseline` and geometry updates once display topology settles. |
| **Worker Process Terminated Externally** | Channel EOF on control/metadata channels. | Process dead. | Privacy helper quarantines shared memory, writes durable native crash blocker, marks `native_os` unavailable, and reports status to shell. |

### Process and Handle Reuse Protection
To prevent process ID (PID) or window handle (`HWND`, `CGWindowID`) recycling from causing accidental observation of a new, unapproved application:
- Surfaces are bound to an immutable identity tuple:
  `IdentityTuple = (worker_epoch, pid, process_start_time, native_window_id, surface_generation)`
- On macOS, `process_start_time` is resolved via `proc_pidinfo(PID, PROC_PIDTBSDINFO)`.
- On Windows, `process_start_time` is resolved via `GetProcessTimes`.
- If an application terminates and a new process reuses its PID, the process start time token mismatches, causing immediate invalidation of the surface registry entry, permit revocation, and cache purging.

## Observability and audit

### Diagnostic Logging vs. Capture Boundary
Diagnostic logging within `oryn-observation-worker` is strictly decoupled from capture data:
- **Permitted Diagnostic Telemetry:** Component lifecycle events, error codes, extraction duration percentiles (p50, p95), invalidation queue depth, dropped event counts, active surface counts, shared-memory slot recycling latency, and memory RSS totals.
- **Prohibited Diagnostic Data:** Raw window titles of excluded applications, document URLs, text field contents, user keystrokes, password masks, pixel data, or frame hashes. No captured business content may appear in log files, console streams, or crash reports.

### Local Operational Counters
The worker maintains in-memory monotonic counters exposed exclusively via local status commands:
- `native_events_emitted_total`: Total normalized events delivered over the metadata channel.
- `native_events_dropped_total`: Events dropped due to queue saturation or throttling.
- `native_snapshots_captured_total`: Total valid masked frames written to shared memory.
- `native_snapshots_dropped_total`: Snapshots skipped due to slot backpressure or movement.
- `native_gaps_recorded_total`: Total `ObservationGap` records generated, labeled by reason code.
- `native_extraction_duration_ms`: Rolling histogram of accessibility query and snapshot latency.

Diagnostic logs and operational counters remain strictly local to the employee device. They are never transmitted to organizational servers or used for employee surveillance, active-hours calculation, or keystroke analysis (violating ORY-064).

## Security and threat model

### Threat Analysis and Safety Controls

1. **Threat: Extraction of Sensitive Credentials or Password Fields**
   - *Mitigation:* The worker inspects OS accessibility traits and role metadata before querying control values. On macOS, elements with role `AXTextField` and subrole `AXSecureTextField` are recognized as password elements; value attributes are never requested. On Windows, elements with `IsPassword=true` are skipped. For snapshots, password and protected regions are masked with opaque-black pixels before shared-memory writing. If an application hides secure fields from accessibility or prevents bounding, snapshot acquisition for that surface is prohibited.
2. **Threat: Occlusion Leakage (Covered Private Content Exposed in Snapshot)**
   - *Mitigation:* Bounded window capture APIs (`SCContentFilter`, WGC window capture) isolate the target window raster from surrounding desktop windows. However, because platform APIs may capture regions of a window that are physically covered on screen by another window, the worker computes physical occlusion against all higher z-order surfaces. Every overlapping rectangle is overwritten with opaque-black BGRA `(0,0,0,255)` in the output buffer. Downstream privacy storage independently verifies this black-pixel invariant.
3. **Threat: Shared-Memory Exploitation or Buffer Overrun**
   - *Mitigation:* Shared-memory slots are fixed in size (8 MiB), unlinked or unnamed, and restricted to minimal process inheritance. Descriptors/handles are inherited only by the specific child. Memory layouts use strict offsets; strides and pixel counts are checked against declared buffer lengths. Overruns terminate the process.
4. **Threat: Host Privilege Escalation via Malformed Event Stream**
   - *Mitigation:* JSON payloads on the metadata channel are deserialized against strict, bounded schemas with maximum string lengths (4,096 bytes for labels) and bounded tree depths (12 levels). Unknown properties are rejected. Deserialization happens in the unprivileged `oryn-privacy-helper`.
5. **Threat: Stale Permit or Epoch Replay**
   - *Mitigation:* Every message carries `session_epoch`, `worker_epoch`, `surface_generation`, and `permit_id`. Permits carry absolute boot-monotonic expiration deadlines capped at 300 ms. Stale, mismatched, or replayed permits are rejected immediately by the worker's `PermitGate`.

### Trust Boundaries and Limitations
- The process isolation between `oryn-privacy-helper` and `oryn-observation-worker` protects the host system against unhandled crashes and memory corruption in third-party UI accessibility libraries.
- However, process isolation does **not** protect against a fully compromised local administrative account or kernel-level malware with rights to inspect arbitrary process memory (`ptrace`, `ReadProcessMemory`). Oryn's local security model assumes an uncompromised OS kernel and trusted desktop user account.

## Test strategy

### Deterministic Synthetic Acceptance Verification

The subsystem must pass the following deterministic synthetic test suite on certified platform test machines before any adapter build release. Mocks alone cannot certify OS accessibility, compositor, and window manager behaviors.

| Scenario ID | Test Scenario & Input Conditions | Expected Observable Result | Assertion Point | Product Criteria |
|---|---|---|---|---|
| **OS-TEST-01** | Two permitted windows on separate displays open; employee opens an excluded password manager in foreground. | Password manager window produces no text, events, or pixels. The two permitted background windows continue receiving structured observations and snapshots without hitching. UI displays Observing Approved Work with exact subline `Approved windows observed; foreground excluded`. | `ObservationEvent` stream contains zero records from password manager; background window events continue with valid permits. | ORY-003, ORY-005 |
| **OS-TEST-02** | Permitted window has 50% of its area covered by an excluded window and an irregular transparent overlay. | Worker extracts text strictly from controls in the 50% exposed region. Snapshot buffer contains opaque-black BGRA `(0,0,0,255)` for all covered coordinates. Clipped controls are omitted. Privacy storage verifies black-pixel mask. | Shared-memory frame validation passes; zero pixels from covered region leak into downstream pipeline. | ORY-005 |
| **OS-TEST-03** | Permitted window is minimized, hidden, cloaked, or switched to another macOS Space. | Worker immediately emits `WindowGeometryChanged(is_occluded=true)` and `ObservationGap(reason="occluded")`. Zero accessibility queries or snapshots executed while hidden. Fresh `TreeBaseline` emitted upon restoration. | CPU and API calls drop to zero for that window; no observations generated during hidden interval. | ORY-005 |
| **OS-TEST-04** | Consent toggled: `visual_work_observation=false`, `contextual_work_application_recognition=true`. | Worker immediately stops snapshot acquisition, frees Direct3D/ScreenCaptureKit sessions, and decommits shared memory. Continues streaming structured `TreeBaseline` and `ElementStateChanged` events. | Frame slots remain free; zero `SnapshotAvailable` events emitted; structured events arrive normally. | ORY-002, ORY-003 |
| **OS-TEST-05** | Consent toggled: `visual_work_observation=true`, `contextual_work_application_recognition=false`. | Worker halts structured text extraction; emits zero element labels, values, or title strings. Accessibility bridge used solely for bounds and password field checks. Event-triggered snapshots continue. | `ObservationEvent` stream contains only `SnapshotAvailable` and content-free geometry events; zero control text on wire. | ORY-002, ORY-003 |
| **OS-TEST-06** | `personal_history_retention=false` active; permitted visual snapshot triggered. | Worker emits `SnapshotAvailable`. Privacy storage copies frame to volatile buffer, releases slot immediately, runs ephemeral OCR, delivers live context with 30 s TTL, and zeroes buffers. Zero database records or durable receipts created. | Disk storage verification confirms zero byte delta in evidence database; shared slot released within 10 ms. | ORY-009, ORY-010 |
| **OS-TEST-07** | Target application contains secure text field (`AXSecureTextField` / `IsPassword=true`). | Worker reads element bounds and role; value attribute is null; `states` contains `read_only` or `protected`. Visual snapshots mask field bounds to opaque-black. | Wire payload contains `"value": null`; snapshot contains black rectangle over field coordinates. | ORY-005 |
| **OS-TEST-08** | Inaccessible custom canvas application opened without matching `SurfaceValidationRecord`. | Worker emits `CapabilityChanged(visual_extraction_eligible=false)` and `ObservationGap(reason="unsupported_surface")`. Zero snapshots or guessed text emitted. | No OCR or visual extraction attempted; surface cleanly classified as unsupported. | ORY-003 |
| **OS-TEST-09** | Managed browser instance running with verified enterprise policy disabling Incognito/InPrivate. | Worker validates effective policy, matches validation record, and enables native fallback observation when extension is disconnected. Switching tabs updates document generation and emits clean gap. | Native fallback emits structured browser context only while policy verification holds. | ORY-005 |
| **OS-TEST-10** | Managed browser instance has URL allowlist exception configured for Incognito/InPrivate. | Worker detects policy exception override; rejects native fallback; marks surface as `unsupported_surface`; emits `ObservationGap`. | Content extraction blocked; zero URL or DOM extraction occurs. | ORY-005 |
| **OS-TEST-11** | Worker process crashed (`kill -9`) while browser extension and meeting recording are active. | Privacy helper detects channel EOF; native source marked unavailable; durable native `crash` blocker recorded. Browser extension and meeting recording continue uninterrupted. Companion displays Attention Needed with exact subline `Native observation stopped; other active sources shown below` and independent healthy indicators. | Browser and audio streams continue logging; native stream emits gap; restart remains stopped. | ORY-003, ORY-004 |
| **OS-TEST-12** | Supervisor visibility lease not renewed for 500 ms (badge closed/crashed). | Privacy helper revokes capture gate; emits `StopNativeObservation(reason_code="visibility_lost")`. Worker immediately halts acquisition, purges frame buffers, and enters `ReadyStopped`. | Zero frames acquired after 500 ms; system transitions to Attention Needed. | ORY-003, ORY-004 |

## Performance and operations

### Operational Budgets and Target Invariants

The Native OS Observation subsystem conforms to the following operational parameters:

| Metric / Parameter | Budget Limit / Specification Target | Operational Enforcement Mechanism |
|---|---|---|
| **Static Screen Idle CPU** | $\le 1.0\%$ of one CPU core average | Event listeners sleep; no polling or continuous frame acquisition while screen is static. |
| **Active Extraction Peak CPU** | $\le 5.0\%$ of one CPU core average | 100 ms extraction time-slices; coalescing of rapid UI invalidations. |
| **Worker Idle Memory (RSS)** | $\le 32\text{ MiB}$ steady-state | Lean Rust core; Swift bridge caches freed; shared memory uncommitted. |
| **Worker Active Peak Memory (RSS)** | $\le 128\text{ MiB}$ peak (including mappings) | Bounded node trees (512 nodes/surface); shared-memory slots capped at 8 MiB each. |
| **Process-Tree Idle Memory** | $\le 250\text{ MiB}$ total companion tree | Shared budget across shell, privacy helper, and observation worker. |
| **Cold Startup Latency** | $p95 \le 3{,}000\text{ ms}$ | Handshake deadline enforced at 3,000 ms; lazy platform API initialization. |
| **Employee Pause Gate Closure** | $p95 \le 100\text{ ms}$ | `StopNativeObservation` bypasses queues; worker aborts active queries immediately. |
| **Supervisor Loss Fail-Closed** | $\le 500\text{ ms}$ | Watchdog and visibility lease timeout revoke capture gate within 500 ms. |
| **Foreground Event Latency** | $p95 \le 250\text{ ms}$ | Priority scheduling gives foreground window first turn in every round-robin cycle. |
| **Background Surface Freshness** | $\le 5{,}000\text{ ms}$ target | Background windows cycled round-robin; gap emitted if budget exceeded. |
| **Concurrently Tracked Surfaces** | Maximum 128 windows | Excess surfaces rotated using stable cursor; foreground always retains priority. |
| **Invalidation Queue Depth** | Maximum 1,024 events | Queue saturation triggers coalescing and `ObservationGap(reason="queue_overflow")`. |
| **Node Cache per Surface** | Maximum 512 nodes, depth 12 | Deep accessibility subtrees pruned at depth 12; omitted counts reported in `TreeBaseline`. |
| **Max Text Field Length** | 4,096 UTF-8 bytes | Strings exceeding limit truncated; `text_truncated=true` annotated. |
| **Max Output Snapshot Size** | 1,920 px longest edge, $\le 8\text{ MiB}$ | Aspect ratio preserved; surfaces $>16\text{ MP}$ rejected or captured at bounded resolution. |
| **Max In-Flight Snapshots** | 1 global in-flight | Global cap 2/s; foreground cap 1/s; background cap 1/window/5s. |

### Fair Multi-Window Scheduling
The worker's `FairScheduler` executes a cooperative multi-window turn pattern:
1. **Turn Pattern:** A repeating turn sequence: `[Foreground, Background_i, Background_i+1, Foreground, Background_i+2, ...]`. Foreground windows receive 50% of all scheduling turns.
2. **Turn Lending:** If the foreground window has no pending invalidations, its turn is lent to the background queue.
3. **Time-Slice Enforcement:** Each turn has a strict 100 ms deadline. Before issuing any native OS query, the scheduler checks remaining budget. If budget is exhausted, extraction suspends, the surface yields, and remaining nodes are completed on the next turn.
4. **Settled Edit Value Reading:** In-flight keystrokes in editable text controls are not queried continuously. Settled values are read only when focus departs the control or an explicit commit/return notification is emitted by the OS.

## Architecture decisions and open questions

### Resolved Architectural Decisions

| Decision Topic | Selected Architectural Choice | Key Rationale & Tradeoffs |
|---|---|---|
| **Process Placement** | Supervised child worker (`oryn-observation-worker`) spawned by `oryn-privacy-helper`. | Isolates complex third-party accessibility and graphics API crashes from core privacy storage. Prevents direct shell control of observation mechanics. Increases memory by ~16–24 MiB RSS for child process overhead. |
| **Snapshot Transport** | Fixed 8 MiB inherited shared-memory slots (two slots total). | Avoids multi-megabyte base64 JSON serialization overhead and GC pressure. Pre-transfer black-pixel masking guarantees privacy before memory leaves worker. |
| **Multi-Window Scope** | All approved visible windows across displays; foreground priority. | Reflects realistic multi-monitor enterprise workflows (e.g., reference document on display 1, entry form on display 2). Requires rigorous z-order occlusion subtraction. |
| **Exclusion with Approved Background** | Continue observing approved background windows when excluded window takes focus. | Halting all observation when an employee checks a password manager or personal chat causes unnecessary workflow gaps. Background capture is provably safe because occlusion subtraction masks all covered pixels. |
| **Browser Fallback Scope** | Strictly limited to certified enterprise-managed browser profiles with verified disabled private mode. | Unmanaged browsers cannot reliably prove that a window is not an incognito/private instance without extensions. Certified fallback provides bounded corporate support without compromising privacy. |
| **Crash Containment** | Worker crash halts native observation only; browser extension and meeting audio continue. | Prevents localized platform accessibility crashes from interrupting valid, independent capture modalities. Requires explicit employee resume for native recovery. |
| **Accessibility Timeout** | Strict 100 ms timeout per call via native API properties. | Prevents hung or malicious applications from stalling the Oryn worker loop. Surfaces experiencing timeouts degrade gracefully without impacting the desktop. |

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))

1. **Owns exclusively:** Native OS window enumeration, z-order occlusion calculation, platform accessibility tree extraction (`AXUIElement`, `IUIAutomation2`), event-triggered visual snapshot capture (`ScreenCaptureKit`, WGC), pre-transfer visibility masking, and fair multi-window scheduling.
2. **Data ingress/egress:** Ingests OS event notifications and window buffers; ingests policies and source permits from [local-privacy-storage](local-privacy-storage.md) via inherited control channel. Outputs normalized `ObservationEvent` streams and masked shared-memory frames to [local-privacy-storage](local-privacy-storage.md).
3. **Versions/identities:** `protocol_version: "os-observation.v1"`, `schema_version: "os-observation.event.v1"`, `worker_build`, `os_build`, `adapter_version`, `validation_id`, and immutable surface identity tuples `(worker_epoch, pid, process_start_time, native_window_id, surface_generation)`.
4. **Upstream failure:** If platform accessibility or graphics capture hangs, the call times out at 100 ms and the surface is marked degraded. If an unkillable native deadlock occurs, the worker self-terminates, and the privacy helper records a durable native crash blocker while keeping other capture sources active.
5. **Authority:** [local-privacy-storage](local-privacy-storage.md) is the sole authority for consent, policy validity, exclusions, and source permits. The worker possesses zero capture authority and cannot observe without an active permit.
6. **Testing without private details:** Tested using synthetic test windows, mock accessibility trees, and simulated occlusions with verified black-pixel assertion points (OS-TEST-01 through OS-TEST-12).
7. **Audit and duplicate prevention:** Events carry strictly increasing monotonic sequences, boot-monotonic timestamps, UUIDv4 event IDs, and generation-bound permit IDs. Gaps and sequence holes are explicitly flagged with reason codes.
8. **Failure blast radius:** A worker crash halts native OS observation only. [desktop-shell](desktop-shell.md), [local-privacy-storage](local-privacy-storage.md), [browser-extension](browser-extension.md), and [meeting-intelligence](meeting-intelligence.md) remain fully operational.
9. **v1.0 criteria:** Enables ORY-002, ORY-003, ORY-004, ORY-005, and ORY-010 demonstrated through synthetic multi-window exclusion, occlusion masking, and crash containment test suites.

### Primary API References
- **Apple ScreenCaptureKit:**
  - `SCShareableContent`: Display, window, and application enumeration.
  - `SCContentFilter(desktopIndependentWindow:)`: Isolated window capture filter.
  - `SCScreenshotManager.captureImage(contentFilter:configuration:)`: macOS 14+ event-triggered single-frame snapshot capture.
- **Apple Accessibility API:**
  - `AXObserver`: Run-loop observer for application accessibility notifications.
  - `AXUIElementCopyAttributeValue`: Targeted UI tree traversal.
  - `AXUIElementSetMessagingTimeout`: Bounded messaging timeout configuration (0.1 s).
- **Microsoft UI Automation:**
  - `IUIAutomation2`: Fast, thread-safe COM MTA accessibility client interface with connection and transaction timeouts (`TransactionTimeout`, `ConnectionTimeout`).
- **Microsoft Windows Graphics Capture:**
  - `IGraphicsCaptureItemInterop::CreateForWindow`: Direct3D-compatible window capture item initialization.
  - `Direct3D11CaptureFramePool`: Free-threaded single-frame capture pipeline.
- **Enterprise Browser Policies:**
  - Chrome Enterprise `IncognitoModeAvailability`: Value `1` forces disabled Incognito mode.
  - Microsoft Edge `InPrivateModeAvailability`: Value `1` forces disabled InPrivate mode.
