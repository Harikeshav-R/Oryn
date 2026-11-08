# Desktop Shell and User Experience Host Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§4.1, 4.7, 13.2](../../TECHNICAL.md) | [PRODUCT.md §§7–8, 12, 24–25, 30; ORY-002–004, ORY-010](../../PRODUCT.md)

### Core Responsibility
The Desktop Shell is the installed Windows and macOS application that exposes user enrollment, visible observation state, employee controls, personal task history, notifications, contextual guidance hosting, and approved local execution interfaces.

### Owns
- Desktop-level application session lifecycle and system tray/menu bar presence.
- Clear employee visibility into local observation status (active observation, user pause, policy pause, and excluded application).
- User controls for toggling, pausing, and resuming capture streams.
- The presentation host for local assistance, task context, and notification surfaces.
- Local application preferences and enrollment state management.

### Consumes
- Local task state and candidate summaries from [local-context-hud](local-context-hud.md).
- Permitted published guidance and peer fixes via [contribution-sync](contribution-sync.md).
- Consent and application exclusion policies from [local-privacy-storage](local-privacy-storage.md).
- Job assignments, approval requests, and notifications dispatched from [control-plane](control-plane.md) and [command-center-analytics](command-center-analytics.md).
- Application compatibility and capability reports from [os-observation](os-observation.md).

### Produces
- User capture commands (pause, resume, category toggle) directed to [local-privacy-storage](local-privacy-storage.md).
- Employee review decisions and sanitization approvals for proposed task contributions.
- User interactions with guided workflows and acknowledgment of contextual assistance.
- Supervised action confirmations and approval responses.
- Local executor invocation commands directed to [local-context-hud](local-context-hud.md).

### Does Not Own
- Authoritative organizational capability models or playbook publication (owned by [operational-graph](operational-graph.md)).
- Organization-wide policy definition, role assignment, or central identity (owned by [identity-policy](identity-policy.md)).
- Raw screen or audio media retention and redaction algorithms (owned by [local-privacy-storage](local-privacy-storage.md)).
- Independent business outcome verification (owned by [outcome-verification](outcome-verification.md)).

### Boundary Requirement
Closing or disconnecting the desktop shell window must not silently change user consent or cause invisible observation. If the UI is dismissed, background capture must obey explicit user preferences and display clear system tray/menu bar indicators. The desktop shell does not execute privileged actions directly; it delegates to authorized local components.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§7–8, 12, 24–25, 30](../../PRODUCT.md))
- **Enrollment and Notice:** At initial launch, the employee must be presented with full disclosure notice regarding visual observation and contextual application recognition before any capture begins (ORY-002).
- **Persistent Status Visibility:** The desktop companion must continually indicate its current operating status: active capture, user-initiated pause, policy-driven pause, or excluded application state (ORY-003).
- **Explicit Pause Control:** When an employee initiates a pause, capture must immediately cease across all local capture adapters and remain suspended until an intentional resume command is given (ORY-004).
- **My Privacy Trust Center:** The shell must provide a dedicated My Privacy area displaying current capture settings, excluded apps, next retention expiration date, shared contributions, and clear explanations of management visibility boundaries (ORY-010).
- **Non-Surveillance Guarantee:** The shell must never present or enable surveillance features such as employee productivity ranking, keystroke counting, or idle-time scoring.

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **User Capture Commands:** Transmits synchronous commands (`PauseCapture`, `ResumeCapture`, `ToggleCategory`) to [local-privacy-storage](local-privacy-storage.md).
- **Contribution Review Interface:** Receives sanitized candidate workflows from [local-privacy-storage](local-privacy-storage.md), presents the review dialog to the employee, and emits `contribution.approved_for_sharing` to [contribution-sync](contribution-sync.md).
- **Guidance Presentation:** Receives active task recommendations from [local-context-hud](local-context-hud.md) and displays step-by-step guidance overlays.
- **Approval Prompts:** Receives Tier 3 consequential action approval requests originating from [job-orchestration](job-orchestration.md) / [control-plane](control-plane.md) and returns explicit human approval or rejection receipts.

## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Runs locally on employee Windows and macOS endpoints as an unprivileged user-space desktop process.
- **Data Access:** Has access to local configuration, UI state, and IPC channels connected to local helper daemons. Does not possess ambient administrative or root privileges.
- **Credentials:** Does not store organizational service credentials or cloud master keys. Communicates with backend control plane via user session tokens acquired through standard authentication flows.
- **Third-Party Dependencies:** Relies on native desktop GUI toolkits and OS notification APIs.

## Internal architecture

### Logical Submodules
- **Window and Shell Manager:** Manages the main application window, system tray / status bar icon, menu handlers, and global keyboard shortcuts.
- **Status and State Coordinator:** Tracks overall companion state (enrolled, active, paused, excluded, offline) and synchronizes status presentation.
- **Notification and Prompt Presenter:** Renders non-intrusive toasts, guidance prompts, and high-priority consequential approval dialogs.
- **My Privacy View Controller:** Exposes the employee trust center, retention status counters, exclusion lists, and consent logs.
- **Local IPC Client:** Connects the UI process to local background services ([local-privacy-storage](local-privacy-storage.md), [local-context-hud](local-context-hud.md)).

## State and lifecycle

### State and Persistence
- **Persisted State:** Local UI preferences, window positioning, dismissed notification records, and cached enrollment markers.
- **Lifecycle Transitions:** `Unenrolled → Enrolled → Active Observation ↔ User Paused ↔ Policy Suspended → Shutting Down`.
- **Restart and Crash Recovery:** On unexpected restart or crash, the shell restores previous user pause state; it defaults to paused if prior state is ambiguous. It never resumes capture silently without displaying active status.

## Error and edge-case behavior

### Failure Handling
- **Local Helper Daemon Unavailable:** If the local privacy daemon is unresponsive, the shell displays an explicit error banner and disables capture indicators to prevent false confidence.
- **Network Disconnection:** When disconnected from the corporate network, the shell continues normal local display and marks central sync status as offline without interrupting permitted local work.
- **Stale Configuration:** If policy configuration cannot be fetched, the shell operates under the most restrictive cached policy.

## Observability and audit

### Telemetry and Diagnostics
- Emits local diagnostic logs covering UI lifecycle, crash stacks, and IPC connectivity.
- Prohibited from recording keystrokes, window titles of excluded apps, or screen thumbnails in diagnostic logs.
- All consent updates and pause/resume events generate local audit entries viewable in My Privacy.

## Security and threat model

### Security and Safety Considerations
- **Untrusted Remote Content:** Guidance templates, notifications, and approval descriptions received from the network are treated as structured data and rendered without remote script execution.
- **Spoofing Prevention:** Local IPC communication must authenticate connecting processes to prevent unauthorized local processes from spoofing user approvals.
- **Exclusion Integrity:** The shell must never display captured pixels or text from excluded applications even in preview thumbnails.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.1: ORY-002, ORY-003, ORY-004, ORY-010](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* An employee actively observing permitted work clicks the Pause Capture button in the desktop shell, closes the main application window, and later reopens the window from the system tray.
  - *Expected Observable Result:* The shell immediately commands local privacy storage to suspend capture; the tray icon changes to the paused state; upon reopening the window, the status display explicitly shows Paused, and zero frames or events are captured during the suspended interval.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Low CPU and memory overhead during idle background monitoring.
- Fast launch time and responsive tray icon interaction.
- Smooth rendering of status transitions without stuttering or blocking the OS window manager.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What GUI framework (e.g., native Swift/AppKit and C#/WinUI vs. cross-platform lightweight web shell) provides minimal footprint and reliable tray support?
- What exact IPC mechanism (domain sockets, named pipes, or localhost RPC) connects the shell UI to background daemons?
- How should the host boundary between the desktop shell and the contextual HUD overlay be drawn?
- What installer packaging, code signing, and auto-update mechanism will be used for enterprise deployment?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Desktop window lifecycle, user capture controls, and employee-facing status presentation.
2. *Data ingress/egress:* Receives user commands and notification models; emits validated user control intents and approval decisions.
3. *Versions/identities:* Desktop client application version, OS platform identity, and authenticated employee user identifier.
4. *Upstream failure:* If backend control plane is unavailable, local shell functions remain operational in offline mode.
5. *Authority:* The employee is authoritative for local capture pause and contribution submission; [identity-policy](identity-policy.md) is authoritative for action rights.
6. *Testing without private details:* Tested via mock IPC commands and headless UI interaction harnesses.
7. *Audit and duplicate prevention:* User commands carry client sequence IDs to prevent duplicate trigger actions.
8. *Failure blast radius:* Shell failure disables local UI visibility; local privacy storage fails closed to prevent unmonitored capture.
9. *v1.0 criteria:* Enables ORY-002, ORY-003, ORY-004, and ORY-010 demonstrated via interactive pause, notice, and status inspection.
