# Native OS Observation Adapters Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §4.2](../../TECHNICAL.md) | [PRODUCT.md §§3.3, 3.6, 8, 25.1–3, 28.1; ORY-005](../../PRODUCT.md)

### Core Responsibility
The Native OS Observation Adapters read permitted desktop context and system events across approved Windows and macOS business applications using supported platform facilities, normalizing them into a structured observation stream.

### Owns
- Platform-specific observation APIs and accessibility bridge integration for Windows (UI Automation, accessibility events) and macOS (Accessibility API, window server notifications).
- Reporting operating-system-level capability limitations, unsupported controls, and accessibility tree availability.
- Delivering a standardized, typed event stream to the local privacy and task understanding pipeline.

### Consumes
- Explicit capture consent state and pause status from [local-privacy-storage](local-privacy-storage.md).
- Application and window exclusion policies from [local-privacy-storage](local-privacy-storage.md).
- Active observation scope and application allowlists.
- OS-level user permission grants (e.g., macOS Screen Recording, Accessibility permissions; Windows UIA access).

### Produces
- Typed local observation events: active application focus changes, window geometry updates, accessibility element state, and permitted interaction events.
- Capture metadata references with explicit confidence, availability, and fidelity labels.
- Capability declarations indicating which applications and controls are observable.

### Does Not Own
- Determination of whether observed data is safe to share with the organization (owned by [local-privacy-storage](local-privacy-storage.md)).
- Inference of high-level business workflow intent (owned by [local-context-hud](local-context-hud.md) and [workflow-discovery](workflow-discovery.md)).
- Business policy definitions or action approvals (owned by [identity-policy](identity-policy.md)).

### Boundary Requirement
Supported observation capabilities must be declared explicitly per operating system and target application. Inaccessible UI elements, missing accessibility nodes, and platform gaps must be reported as explicit omissions rather than guessed or interpolated.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§3.3, 3.6, 8, 25.1–3, 28.1](../../PRODUCT.md))
- **Mandatory Exclusions Enforcement at Source:** When an excluded application (e.g., password manager, personal browser window, banking app) comes into focus, observation must immediately halt for that window (ORY-005).
- **Capability Transparency:** The adapter must report exactly what it can observe on the current platform, distinguishing full accessibility tree access from degraded window-level context.
- **Resource Discipline:** Monitoring must not degrade desktop responsiveness, drop keystrokes in user applications, or induce noticeable UI latency during high-frequency desktop events.

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #1 in [Contracts Catalog](../architecture/contracts/README.md):** Produces raw candidate observations consumed by [local-privacy-storage](local-privacy-storage.md).
- **Observation Stream:** Emits local typed events (`FocusChanged`, `ElementInvoked`, `WindowResized`) annotated with application bundle ID / executable name, window title (if not excluded), and control role.
- **Exclusion Policy Ingress:** Subscribes to synchronous exclusion rule updates from [local-privacy-storage](local-privacy-storage.md).

## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Runs locally on employee desktop as an unprivileged or accessibility-privileged helper process.
- **Data Access:** Reads OS window manager states, focused element hierarchy, and screen buffers strictly for non-excluded windows.
- **Network Access:** Prohibited from opening external network sockets. Connects exclusively to local IPC interfaces.
- **Operating System Privileges:** Relies on standard platform accessibility and window management permissions granted by the user via OS system dialogs.

## Internal architecture

### Logical Submodules
- **Platform Event Tap:** Captures raw window and UI events via platform APIs (macOS AXObserver, Windows UI Automation events).
- **Window Filter and Exclusion Gate:** Intercepts window switch events and immediately suppresses event generation if the window matches an exclusion pattern.
- **UI Tree Extractor:** Extracts hierarchical accessibility element trees for active, non-excluded business windows.
- **Event Normalizer:** Translates platform-specific element roles and actions into common Oryn observation primitives.

## State and lifecycle

### State and Persistence
- **Persisted State:** None. The observation adapter operates statelessly in memory.
- **Lifecycle Transitions:** `Uninitialized → Checking Permissions → Observing ↔ Excluded Window Active ↔ Suspended → Terminated`.
- **Crash Recovery:** If the adapter crashes, the desktop shell detects process termination and restarts the adapter; no raw observations are lost because pending data resides in memory buffers.

## Error and edge-case behavior

### Failure Handling
- **Missing OS Permissions:** If macOS Accessibility or Windows UIA permissions are revoked, the adapter transitions to Suspended and reports a permissions-revoked event to the shell.
- **Unresponsive Target App:** If a target application hangs during accessibility tree queries, the adapter applies a strict timeout and marks that application as temporarily degraded rather than blocking the observation loop.
- **High Event Flood:** High-frequency mouse movements or animations are throttled or sampled to prevent buffer overflow.

## Observability and audit

### Telemetry and Diagnostics
- Generates local debug logs containing event rates, extraction latency, and dropped event counts.
- Never logs keystroke values, non-anonymized window titles of excluded apps, or sensitive input field text in diagnostic logs.

## Security and threat model

### Security and Safety Considerations
- **Keystroke Logging Prohibition:** The adapter must not function as a keylogger; it captures UI state transitions and element invocations, never raw keystroke sequences across unapproved fields.
- **Password Field Suppression:** Password input elements (marked as secure or password type by OS accessibility) are masked at the OS API level; no text is ever extracted.
- **Process Memory Protection:** Observation buffers reside in private memory and are discarded immediately upon handoff to local privacy storage.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.1: ORY-005](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* An employee has a permitted spreadsheet open and opens a private password manager window.
  - *Expected Observable Result:* The OS observation adapter detects the password manager application ID against the mandatory exclusion list; it immediately halts extraction; no event or frame from the password manager is emitted to the local privacy pipeline.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Low CPU consumption during active user typing and window navigation.
- Efficient memory usage with bounded event buffers.
- Minimal latency between physical user action and normalized event emission.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What exact Windows UI Automation and macOS AX APIs provide the most reliable event hooks across modern and legacy desktop applications?
- How should event sampling and coalescing be tuned to prevent high CPU usage in dynamic applications?
- What fallback behavior is appropriate when an application exposes no accessibility tree (e.g., custom canvas controls)?
- How should OS permission revocation be detected reactively across macOS and Windows?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Native OS accessibility event taps, platform-specific UI tree extraction, and raw event normalization.
2. *Data ingress/egress:* Ingests OS event notifications; outputs normalized local observation events to local privacy storage.
3. *Versions/identities:* Platform OS version, adapter build version, and application identifiers (bundle ID / process name).
4. *Upstream failure:* If OS accessibility subsystem hangs, adapter falls back to degraded window-level reporting.
5. *Authority:* The OS user permissions govern adapter capability; [local-privacy-storage](local-privacy-storage.md) governs capture gating.
6. *Testing without private details:* Tested using synthetic test windows and mock accessibility hierarchies.
7. *Audit and duplicate prevention:* Events receive monotonic sequence numbers and monotonic timestamps.
8. *Failure blast radius:* Adapter crash halts OS observation; does not affect browser extension or desktop shell.
9. *v1.0 criteria:* Enables ORY-005 demonstrated through exclusion verification tests.
