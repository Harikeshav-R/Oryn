# Meeting and Audio Intelligence Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§4.4, 8.7](../../TECHNICAL.md) | [PRODUCT.md §§9, 25.1, 29.5–6; ORY-008, ORY-021](../../PRODUCT.md)

### Core Responsibility
Meeting and Audio Intelligence supports separately authorized, opt-in meeting audio capture, local transcription, candidate commitment extraction, and employee-reviewed follow-up task reminders.

### Owns
- Per-meeting audio capture session lifecycle, consent confirmation prompts, and active recording indicators.
- Local audio stream buffering and transcription processing pipeline.
- Extraction of candidate verbal commitments, action items, and conversational context with explicit speaker uncertainty markers.
- Personal commitment review workflows presented to the employee.

### Consumes
- Organizational meeting capture policy and participant notification requirements from [identity-policy](identity-policy.md).
- Explicit per-meeting employee opt-in commands from [desktop-shell](desktop-shell.md).
- Local audio input hardware availability and active meeting application detection from [os-observation](os-observation.md).

### Produces
- Private, transcript-derived candidate commitments and action item suggestions for employee review.
- Sanitized commitment records submitted to [local-context-hud](local-context-hud.md) for contextual reminders.
- Explicitly reviewed and approved cross-team handoff proposals sent to [operational-graph](operational-graph.md) via [contribution-sync](contribution-sync.md).

### Does Not Own
- Always-on or background audio surveillance (strictly prohibited across the entire platform).
- Unilateral authority to send external emails, update customer CRMs, or create binding business promises without human confirmation (owned by [outcome-verification](outcome-verification.md) / [identity-policy](identity-policy.md)).
- Central organizational procedure definition based solely on conversational transcripts.

### Boundary Requirement
Screen observation consent does not imply meeting recording consent. Audio capture is disabled by default and requires explicit, per-meeting confirmation and participant notice acknowledgment before recording can start. If consent criteria are unmet or uncertain, recording does not begin.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§9, 25.1, 29.5–6; ORY-008, ORY-021](../../PRODUCT.md))
- **Per-Meeting Opt-In Default:** Audio recording is strictly off by default; every meeting requires an active, intentional opt-in and confirmation of participant notice (ORY-008).
- **Candidate Commitment Review:** Extracted commitments remain private candidates until the employee verifies them. An unconfirmed meeting suggestion must never update a production CRM or trigger external side effects automatically (ORY-021).
- **Speaker Attribution Uncertainty:** When multiple voices or low audio quality make speaker identification ambiguous, the system must label attribution as uncertain rather than guessing.

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #1 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests raw audio frames locally; filtered at source without cloud transmission.
- **Commitment Sync Contract:** Produces sanitized, employee-approved commitment handoffs transferred to [operational-graph](operational-graph.md) via [contribution-sync](contribution-sync.md).
- **Local Reminder Feeds:** Delivers confirmed personal commitments to [local-context-hud](local-context-hud.md) for contextual triggering during future desktop work.

## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Runs locally on the employee endpoint as a dedicated audio processing service.
- **Audio Data Isolation:** Raw audio buffers and interim transcripts reside in encrypted local temporary storage. Raw audio is never transmitted directly to central Oryn cloud servers.
- **External AI Providers:** If speech-to-text models leverage external APIs, customer approval and zero-retention data privacy guarantees must govern the transport boundary.

## Internal architecture

### Logical Submodules
- **Audio Capture Controller:** Manages microphone and system audio loopback capture, bound to explicit meeting lifecycle events.
- **Transcription Pipeline:** Performs speech-to-text conversion with timestamping and confidence scoring.
- **Commitment Extractor:** Analyzes normalized transcripts to extract candidate tasks, deadlines, and assignees.
- **Consent and Notice Verifier:** Validates that organizational consent prompts and required attendee notifications are logged prior to recording.

## State and lifecycle

### State and Persistence
- **Persisted State:** Private local transcript snippets and unreviewed candidate commitments in [local-privacy-storage](local-privacy-storage.md).
- **Lifecycle Transitions:** `Idle → Consent Awaiting ↔ Recording Active → Processing Transcript → Review Pending → Archived/Expired`.
- **Session Cleanup:** Raw audio files are deleted immediately after transcription unless employee policy explicitly permits short-term local audio retention.

## Error and edge-case behavior

### Failure Handling
- **Hardware Disconnection:** If audio input devices are disconnected mid-meeting, capture halts cleanly, saves partial transcript data, and notifies the user.
- **Ambiguous Multi-Speaker Overlap:** Overlapping speech segments are marked with low transcription confidence and flagged for employee clarification.
- **Transcription Timeout:** If transcription pipelines stall, processing is aborted without holding system memory.

## Observability and audit

### Telemetry and Diagnostics
- Logs recording start/stop timestamps, participant count estimates, and transcription latency.
- Strictly excludes raw speech samples, spoken names, and transcript text from central telemetry logs.

## Security and threat model

### Security and Safety Considerations
- **Eavesdropping Prevention:** Microphone access must require OS-level permission and explicit visible recording indicators.
- **Conversational Hallucination:** Commitments extracted by NLP models are treated as unverified drafts until reviewed by the employee.
- **Confidential Meeting Exclusion:** Meetings flagged with restricted calendar tags (e.g., HR, legal, board) are automatically blocked from recording.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.1: ORY-008; §31.2: ORY-021](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* An employee joins a virtual meeting where screen observation is active. A meeting detection banner appears. The employee does not click the record opt-in button.
  - *Expected Observable Result:* Audio recording does not initialize; microphone is not accessed; zero audio bytes or transcripts are stored; screen observation remains governed by normal desktop consent.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Low CPU footprint during real-time audio capture.
- Bounded memory usage for streaming audio buffers.
- Fast post-meeting extraction of candidate action items.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What local or cloud-assisted transcription engine balances high accuracy with strict enterprise data protection?
- How should virtual meeting app detection (Zoom, Teams, Meet) be implemented reliably across macOS and Windows?
- What UI pattern best presents candidate commitments to the employee without creating review fatigue?
- How should participant notice and recording laws (one-party vs. two-party consent jurisdictions) be enforced technically?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Per-meeting audio session lifecycle, private transcription buffers, and candidate commitment extraction.
2. *Data ingress/egress:* Ingests raw audio streams; outputs reviewed personal commitments and handoff proposals.
3. *Versions/identities:* Meeting session ID, participant pseudo-identities, and transcription model version.
4. *Upstream failure:* If audio capture fails, meeting recording terminates safely without affecting desktop observation.
5. *Authority:* The employee is authoritative for recording opt-in and commitment approval.
6. *Testing without private details:* Tested with synthetic pre-recorded audio benchmark datasets.
7. *Audit and duplicate prevention:* Each meeting session has a unique UUID; commitments carry monotonic sequence numbers.
8. *Failure blast radius:* Meeting intelligence failure is isolated to audio insights; no effect on core desktop capture.
9. *v1.0 criteria:* Enables ORY-008 and ORY-021 verified through opt-in gating and unconfirmed suggestion isolation tests.
