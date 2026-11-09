# Desktop Capture Lifecycle, Visibility Leases, and Bounded Offline Policy

**Status:** accepted  
**Date:** 2026-11-08  
**Deciders:** Core Engineering Team  

## Context
A foundational product promise of Oryn is absolute employee trust and transparency: observation must never occur silently, invisibly, or without current organizational and employee authorization. In desktop environments, multiple failure modes threaten this guarantee: the main application window closing, helper process crashes, OS sleep/wake cycles, display disconnections, network partitioning, and administrative policy updates.

We must define deterministic lifecycle semantics governing how observation starts, pauses, resumes, and terminates across these events, ensuring the system consistently fails closed without relying on complex, error-prone heuristics.

## Decision
We establish four core lifecycle principles enforced across the native desktop shell and local privacy storage:

1. **Ephemeral Visibility Leases:** Continuous capture requires an active visibility lease. The native shell host must renew this lease every 100 ms over the control channel only while verified native status surfaces (tray and movable badge) are physically visible on an active display. If unrenewed for 500 ms, or upon channel EOF/termination, the child helper's capture gate collapses immediately and discards in-flight observations.
2. **Durable Employee Pause:** When an employee pauses capture, the pause state is committed durably to disk. It survives process restarts, workstation sleep/wake, and user logoffs. Automatic startup or wake restoration preferences cannot override a durable employee pause.
3. **Explicit Resume After Abnormal Transitions:** Following any helper crash, visibility loss, or software update, capture remains paused behind an explicit recovery blocker. It never resumes automatically; the employee must deliberately select Resume.
4. **Bounded Offline Policy Window (24-Hour Cap):** Local capture requires a cryptographically validated capture-policy lease from the enterprise identity engine. In offline or disconnected environments, cached policy validity is capped at an absolute maximum of 24 hours from issuance (or shorter if configured by policy). Upon expiration, capture halts immediately and cannot be resumed until corporate network connectivity is restored and policy refreshed.

*(Scope Amendment — 2026-11-10): [ADR-0006](0006-meeting-capture-and-review-boundaries.md) introduces distinct pause semantics separating screen observation (`PauseScreenObservation`) from Pause All (`PauseCapture`). Screen pause halts screen capture and pauses local browser actions while preserving authorized meeting audio capture; Pause All immediately halts all capture streams. Generic resume is screen-only; meeting recording never resumes automatically. Introduces explicit offline meeting recording mode displaying headline **Meeting Capture Active** with subline `Recording only — offline`, which accumulates zero cloud upload backlog upon reconnection.*

## Rationale and Alternatives
We evaluated several looser lifecycle models:
- **Heartbeat-Free IPC:** Relying solely on explicit Stop messages fails if the host process crashes, hangs, or encounters a kernel freeze, leaving background observation running invisibly. The 100ms/500ms ephemeral lease guarantees fail-closed behavior within sub-second thresholds.
- **Volatile Pauses:** Resetting pause state on system reboot would cause observation to restart unexpectedly when employees restart their machines, severely violating employee trust.
- **Unbounded Offline Caching:** Allowing indefinite offline capture would allow employees to bypass policy revocations, team deauthorizations, or scope restrictions simply by remaining disconnected. The 24-hour hard ceiling enforces corporate governance while accommodating standard workday disconnections.

## Consequences
- The child privacy helper must implement an internal timer-based gate that halts ingestion when the visibility lease lapses.
- Background observation while the main window is closed is permitted only if the employee explicitly enabled background observation and the native status badge remains visible on an active desktop.
- On wake from sleep or unlock, only previously active screen observation may be automatically restored; meeting audio capture never automatically resumes.
- Network reconnection after offline operation must process policy and revocation updates prior to transmitting any pending approved contributions.
- Software updates require full process quiescence; the application restarts in a paused state with an update blocker until acknowledged.
