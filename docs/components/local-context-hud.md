# Local Context HUD and Guided Assistance Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§4.6–7, 8.6](../../TECHNICAL.md) | [PRODUCT.md §§9.4, 12, 29.1–6; ORY-011, ORY-018–021](../../PRODUCT.md)

### Core Responsibility
The Local Context HUD and Guided Assistance component interprets the employee's permitted on-screen activity into candidate task context, matches it against locally cached approved playbooks, and produces structured step-by-step guidance models, peer error resolutions, and supervised local execution assistance for presentation by the desktop shell.

### Owns
- Local active-task hypothesis generation and task boundary segmentation.
- Matching active application states and error codes against locally cached playbooks and peer resolutions.
- Ranking contextual suggestions and suppressing intrusive or low-confidence prompts.
- Generating structured Heads-Up Display (HUD) guidance models, step checklists, and target highlight geometries for presentation by [desktop-shell](desktop-shell.md).
- Tracking interactive guidance step progress and executing approved, supervised local actions.

### Consumes
- Redacted, permitted local observations from [local-privacy-storage](local-privacy-storage.md), tagged with explicit source identity (`native_os` vs `browser`), document generations, and modality provenance.
- Target presence, physical desktop coordinates, and affine transforms from [browser-extension](browser-extension.md) via Contract 21 (`BrowserTargetResult`).
- Published organizational playbooks, peer fixes, and rule definitions via [contribution-sync](contribution-sync.md).
- Confirmed personal commitment projections from [meeting-intelligence](meeting-intelligence.md) via Contract 23 (`CommitmentReminderProjection`), receiving strictly `open` + `confirmed` obligations.
- User guidance preferences (snooze, mute, dismiss) from [desktop-shell](desktop-shell.md).
- Action authorization tokens from [identity-policy](identity-policy.md).
- Semantic inference results via the governed LiteLLM gateway (`text.reason`, see [cloud-inference](../architecture/cloud-inference.md)); no local LLM executes on-device in v1.0.

### Produces
- Candidate task segmentations and demonstration summaries delivered to [local-privacy-storage](local-privacy-storage.md) for contribution review.
- User feedback and guidance step acknowledgment events.
- Supervised action invocation requests directed to local application adapters.
- Friction and error signals that may indicate emerging organizational process gaps.

### Does Not Own
- Approving new organizational playbooks or procedures (owned by [operational-graph](operational-graph.md)).
- Central workflow candidate clustering across multiple users (owned by [workflow-discovery](workflow-discovery.md)).
- Granting authorization for actions exceeding the employee's role (owned by [identity-policy](identity-policy.md)).
- Desktop window hosting, native click-through highlight rendering, or UI presentation (owned by [desktop-shell](desktop-shell.md)).

### Boundary Requirement
Context matching must be uncertainty-aware and respect employee snooze/dismiss preferences. The input observation stream carries explicit source-aware `ObservationGap` records, incomplete or omitted baseline hierarchies (`TreeBaseline.complete=false`), exact source generations, modality provenance (`structured` vs `snapshot`), and affine coordinate transforms. The component must never synthesize guessed events or fabricate task continuity across reported observation gaps or surface generation changes; unobserved intervals must be treated as incomplete task evidence. When `personal_history_retention=false`, live guidance functions ephemerally on stream inputs within a 30-second window, without creating persistent task indexes or candidate records. An inferred task identity or matched playbook must never be treated as implicit authorization to execute business actions. Assisted local actions must obey the same rigorous policy authorization checks as remote runners.
## Product requirements

### Key Product Requirements ([PRODUCT.md §§9.4, 12, 29.1–6; ORY-011, ORY-018–021](../../PRODUCT.md))
- **Candidate Task Inference:** Synthesizes local task demonstrations without triggering automatic publication (ORY-011).
- **Published Peer Error Resolution:** When an employee encounters a recognized error code, the HUD provides published peer solutions with provenance (ORY-018).
- **Accurate Next-Step Guidance:** Guidance highlights the correct UI element for the current step and never silently advances past an incomplete or failed action (ORY-019).
- **User Snooze and Suppression:** Employees can snooze, mute, or dismiss suggestions without silencing critical safety warnings (ORY-020).
- **Commitment Reminders:** Displays reminders for confirmed meeting commitments in relevant application contexts (ORY-021).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)
### Cross-Component Contracts
- **Local Observation Feed:** Consumes redacted, permitted local observation records, masked visual extraction results, affine coordinate transforms, and explicit `ObservationGap` events from [local-privacy-storage](local-privacy-storage.md).
- **Contract Reference #3 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes published, access-filtered playbooks and peer fixes from [operational-graph](operational-graph.md) cached via [contribution-sync](contribution-sync.md).
- **Contract Reference #20 in [Contracts Catalog](../architecture/contracts/README.md):** Emits structured guidance cards and target highlight coordinates to [desktop-shell](desktop-shell.md), and consumes employee guidance interaction events (`confirm_step`, `back`, `skip_optional`, `stop`, `dismiss`, `snooze_1h`, `mute_category`).
- **Contract Reference #21 in [Contracts Catalog](../architecture/contracts/README.md):** Emits `ResolveBrowserTarget` queries to [browser-extension](browser-extension.md) via the privacy gate; consumes `BrowserTargetResult` containing ephemeral target handles and desktop geometry. If target geometry is unavailable or unproven, the HUD gracefully falls back to text-only step guidance without drawing coordinate highlights.
- **Contract Reference #23 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes `CommitmentReminderProjection` from [meeting-intelligence](meeting-intelligence.md); schedules compact contextual cards at 09:00 on the due date in the employee's working zone; suppresses reminders when supporting transcript edits trigger `needs_reconfirmation`. Inaccessible or revoked business contexts produce no contextual reminders or leaked titles.
- **Local Executor Interface:** Emits structured action requests to local UI and browser adapters, requiring explicit user confirmation for Tier 2/3 actions.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Executes as a user-space helper on the employee endpoint.
- **Presentation Delegation:** Operates as a background helper process without direct windowing or overlay rendering privileges. All visual surfaces and click-through highlights are rendered strictly by the native host in [desktop-shell](desktop-shell.md).
- **Local Action Execution:** Local actions run under the logged-in user's desktop session and permissions; the HUD cannot elevate permissions.

## Internal architecture

### Logical Submodules
- **Task Segmenter and Signature Matcher:** Identifies task boundaries from event sequences and matches signatures against cached playbooks.
- **Suggestion Ranker and Suppression Filter:** Computes contextual relevance scores and applies snooze/fatigue throttling.
- **Guidance Model Generator:** Computes structured step cards, required actions, and native bounding-box highlight geometries for transmission to the desktop shell.
- **Local Step Coordinator:** Verifies step prerequisites and advances guidance state only upon observed success.

## State and lifecycle

### State and Persistence
- **Persisted State:** Cached playbook signatures, snooze/mute settings, and active guidance session state.
- **Lifecycle Transitions:** `Idle → Context Detected → Suggestion Offered ↔ Guidance Active ↔ Action Executing → Step Complete / Dismissed`.
- **Session Reset:** Guidance state clears automatically when the target application window is closed or user switches tasks.

## Error and edge-case behavior

### Failure Handling
- **Ambiguous Match:** If multiple playbooks match the current screen with similar confidence, the HUD offers a choice menu or remains silent.
- **Failed Step Execution:** If an assisted action fails or times out, the HUD stops progression, highlights the failure, and offers manual recovery.
- **Cache Invalidation:** Stale playbooks are evicted immediately upon receiving revocation events from contribution sync.
- **Presentation Host Disconnection:** If the desktop shell crashes or closes the guidance presentation channel, the HUD helper suspends active guidance sessions without interrupting task hypothesis tracking or observation processing.

## Observability and audit

### Telemetry and Diagnostics
- Records local metrics on suggestion display rates, acceptance vs. dismissal ratios, and step completion times.
- Excludes proprietary customer data and form values from HUD diagnostic logs.

## Security and threat model

### Security and Safety Considerations
- **Click-Jacking Defense:** Overlay windows must not cover security-sensitive buttons (e.g., UAC prompts, browser permission dialogs).
- **False Guidance Prevention:** Unverified, draft, or rejected playbooks must never be loaded into the local guidance cache.
- **Hallucinated Action Prevention:** Inferred tasks cannot trigger autonomous actions without explicit user verification.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.2: ORY-011, ORY-018, ORY-019, ORY-020, ORY-021](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* An employee opens an ERP payment batch with a known discrepancy error code; a published peer fix exists in the cache; the employee snoozes the suggestion for 1 hour.
  - *Expected Observable Result:* The HUD renders the peer fix banner with source provenance; upon clicking snooze, the suggestion immediately disappears and does not reappear during the 1-hour window.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Guidance model generation and coordinate translation must execute within 50 ms of context transition to maintain sub-perceptual presentation latency.
- Local playbook signature matching must execute within sub-second thresholds to remain contextually relevant.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What local task segmentation algorithm balances responsiveness with low CPU overhead?
- How should highlight bounding-box coordinates be smoothed or clamped across complex nested application scrolling containers?
- What heuristic best measures user fatigue to prevent over-prompting?
- How can step completion be reliably verified across non-standard desktop UI toolkits?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Active task hypotheses, local playbook cache matching, guidance presentation model generation, and guidance step tracking.
2. *Data ingress/egress:* Ingests redacted observations and cached playbooks; outputs candidate task demonstrations and guidance interaction logs.
3. *Versions/identities:* Playbook version hash, rule version IDs, and employee user identifier.
4. *Upstream failure:* If central sync is offline, HUD operates using valid cached playbooks.
5. *Authority:* The employee is authoritative for acknowledging or dismissing suggestions.
6. *Testing without private details:* Tested via synthetic event streams and UI automation fixtures.
7. *Audit and duplicate prevention:* Suggestions and step completions carry unique session IDs.
8. *Failure blast radius:* HUD helper failure clears guidance cards and target highlights in the desktop shell; underlying business applications, observation streams, and desktop shell status surfaces remain unaffected.
9. *v1.0 criteria:* Enables ORY-011, ORY-018, ORY-019, ORY-020, and ORY-021 verified through interactive guidance tests.
