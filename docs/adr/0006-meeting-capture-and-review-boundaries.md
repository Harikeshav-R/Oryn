# Meeting Audio Capture, Isolation, and Commitment Review Boundaries

**Status:** accepted  
**Date:** 2026-11-10  
**Deciders:** Technical Architecture, Security Engineering, Product Engineering  
**Authority:** Technical Architecture & Product Policy  
**Amends:** [ADR-0001](0001-desktop-runtime-and-presentation.md), [ADR-0002](0002-desktop-capture-lifecycle.md), [ADR-0004](0004-browser-bridge-and-execution-boundaries.md)  
**Normative Specification:** [docs/components/meeting-intelligence.md](../components/meeting-intelligence.md)

---

## Context

Oryn v1.0 includes optional meeting intelligence: audio transcription, session-local speaker attribution, candidate commitment extraction, and contextual follow-up reminders ([PRODUCT.md §9](../../PRODUCT.md)). 

Meeting audio observation introduces fundamental architectural and legal differences from screen observation:
1. **Consent and Wiretapping Compliance:** Screen observation is governed by employee workplace policy. Audio recording captures spoken words of external participants across disparate legal jurisdictions (one-party vs. two-party consent), requiring explicit, per-meeting opt-in and verified participant notice evidence. Screen consent must never imply meeting recording consent.
2. **Audio Routing and Isolation:** Modern business meetings occur across native desktop applications (Zoom, Teams) and web browsers (Google Meet, Teams Web). Capturing whole-system audio risks eavesdropping on personal music, notifications, banking videos, or background conversations.
3. **Muting and Privacy Invariants:** When an employee mutes their microphone in a meeting client, acquiring room audio constitutes an egregious privacy violation.
4. **Commitment Interpretation vs. Action Authority:** Conversational speech is tentative and ambiguous. Extracted action items cannot automatically trigger production API mutations or update external CRMs without explicit human review.

## Decision

1. **Process-Tap and Tab-Scoped Audio Isolation:**
   - **Native Applications:** Orchestrated via `NativeMeetingSource` in a signed, unprivileged `oryn-meeting-worker` process. Uses macOS Core Audio process taps and Windows WASAPI application loopback to capture only the audio produced by the specific meeting process.
   - **Browser Meetings:** Orchestrated via `MeetingAudioCapture` using Chrome/Edge `tabCapture` inside an offscreen document. Bounded strictly to the admitted meeting tab; restores audible local playback via `AudioContext`.
   - **Prohibition:** Whole-system and whole-browser audio loopback capture are strictly prohibited.
2. **Mute State Gating:** Microphone audio is acquired strictly when native accessibility probes or OS APIs verify an unmuted state. If mute cannot be verified, microphone acquisition is disabled and the session operates in remote-only mode with an explicit local speech gap.
3. **Four Inherited Shell Channels:** `shell-privacy.v1` is updated to minor 2. Channel 4 (`shell-meeting-audio.v1`) is allocated exclusively for decoded binary PCM browser meeting audio frames. Bulk audio never crosses Channels 1, 2, or 3.
4. **Contract 19 MeetingPort & Pause Controls:**
   - Adds distinct `PauseScreenObservation` command (screen capture halts; meeting audio continues independently).
   - Preserves `PauseCapture` as **Pause All** (halts screen and meeting audio immediately).
   - Generic `ResumeCapture` is screen-only; meeting recording never resumes automatically.
   - Introduces typed `MeetingPort` command envelope (`StartMeetingCapture`, `RenewMeetingConsent`, `StartMeetingSegment`, `StopMeetingCapture`, `AuthorizeDeferredMeetingProcessing`).
5. **Private Local Durability & Transient Cloud Processing:**
   - Audio tracks, raw PCM, transcripts, and unconfirmed commitment candidates remain durable only in local encrypted privacy storage.
   - Cloud transcription (`meeting.transcribe.*`) and extraction (`meeting.extract_commitments`) execute transiently via LiteLLM under Contract 22.
   - Speaker labels are session-local turn attributions (**You**, **Speaker 2**); permanent biometric voiceprints are prohibited.
6. **Conservative Invalidation & Human Review (Contracts 23 & 24):**
   - Extracted commitments are private drafts (`candidate`). Confirming an obligation creates an independently saved local task (`business_state="open"`, `review_state="confirmed"`).
   - Any edit to a supporting transcript span invalidates dependent candidates and transitions saved obligations to `needs_reconfirmation`, immediately suspending HUD reminders (Contract 23).
   - Inter-team handoffs require explicit proposal review (`ReviewedMeetingHandoffProposal`) delivered to Operational Graph via `contribution-sync` (Contract 24). Full transcripts or raw audio are never uploaded.
7. **Offline Recording Mode:**
   - If cloud connectivity is lost or offline mode is chosen, audio is recorded locally without AI processing.
   - Reconnection never auto-uploads retained audio; deferred processing requires explicit employee authorization under Contract 19.

## Rationale and Alternatives

- *Alternative Considered: Headless Bot Joining Calls (e.g. Zoom Bot):* Rejected for v1.0. High operational complexity, requires broad calendar integrations, disrupts meeting attendance aesthetics, and fails when meetings restrict external guest bots.
- *Alternative Considered: Whole-System Audio Loopback Driver:* Rejected. Violates security boundaries by capturing background music, personal YouTube videos, system notifications, and adjacent app sounds.
- *Selected Architecture: Native Process Taps + Offscreen Tab Capture:* Provides precise source isolation, respects application boundaries, operates seamlessly on standard employee desktop hardware, and upholds strict enterprise privacy principles.

## Consequences

- Meeting audio capture requires distinct per-meeting employee initiation and valid corporate policy leases.
- Native worker and browser offscreen architectures ensure zero cross-talk leakage from unrelated applications.
- Transcript edits conservatively suspend automated reminders, guaranteeing human-in-the-loop accuracy.
- Private meeting records survive raw media expiration, maintaining task persistence without indefinite audio retention.
