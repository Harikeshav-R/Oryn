# Private Evidence Storage, Partitioning, and Retention Boundaries

**Status:** accepted  
**Date:** 2026-11-09  
**Deciders:** User-Approved Architecture Session  
**Authority:** Technical Architecture & Security Engineering  
**Amends:** [ADR-0001](0001-desktop-runtime-and-presentation.md), [ADR-0002](0002-desktop-capture-lifecycle.md), [ADR-0005](0005-cloud-inference-and-private-evidence.md), [ADR-0006](0006-meeting-capture-and-review-boundaries.md)  
**Normative Specification:** [docs/components/local-privacy-storage.md](../components/local-privacy-storage.md)

---

## Context

Oryn requires local persistence of employee screen observations, window contextual metadata, and meeting audio recordings to power contextual guidance, candidate workflow discovery, and commitment reminders ([PRODUCT.md §§8.3, 25.4](../../PRODUCT.md)).

Private endpoint storage introduces critical architectural, privacy, and cryptographic challenges:
1. **Surveillance Resistance vs. Local Storage:** Managers and administrators must never have remote access to browse or replay raw employee timelines. Raw capture must remain strictly local to the employee workstation.
2. **Crash-Safe Selective Erasure:** Employees must be able to delete specific date ranges or application histories. Erasure must guarantee that deleted rows cannot be recovered forensically from database free-lists, WAL journals, or virtual-table shadow indexes, even across system crashes or power losses.
3. **Retention Deadlines vs. Legal Holds:** Raw retention is default 7 days, employee-selectable between 1 and 6 days, with documented organizational extension up to 14 days. When a legal hold applies, it prevents voluntary employee deletion within the configured period, but must never be used to extend raw media retention indefinitely or create remote surveillance access.
4. **Capacity Exhaustion:** If local storage reaches quota or disk space runs low, the system must not silently drop to unencrypted ephemeral mode, nor evict unexpired records without user consent.
5. **No Central Recovery Escrow:** To uphold the core privacy promise, Oryn must not maintain central backups, recovery keys, or escrow services for private evidence.

## Decision

1. **Hybrid Bounded Storage (SQLCipher 4 + AES-256-GCM Media):**
   - Structured private observations are stored in SQLCipher 4 encrypted database partitions using AES-256 in CBC mode with HMAC-SHA256 page authentication (`cipher_page_size=4096`, encrypted WAL journals, `secure_delete=ON`).
   - Screen partitions are isolated by source (`native_os`, `browser`) and sealed at the earliest of: one UTC clock hour, an active policy/consent change, or 8 MiB of structured database content.
   - Meeting sessions encapsulate transcripts, candidate commitments, and saved commitments in a unified meeting partition (`meet_<session_id>.db`) with an 8 MiB structured cap, enabling single SQLite transaction commits for transcript edits.
   - Raw media files (masked PNG frames and Opus audio) are stored in independently encrypted blob files under AES-256-GCM chunked at 1 MiB with unique per-blob random 256-bit keys and 96-bit nonces.
2. **Encrypted Key Catalog and Generation Commit Point:**
   - Partition encryption keys are generated randomly and stored in an encrypted catalog file (`key-catalog.<generation>.enc`) encrypted with AES-256-GCM.
   - Exactly one master catalog credential `{ catalog_generation, master_key }` is stored in the OS-provided secure credential store (macOS Keychain Services / Windows Credential Manager).
   - Atomic update of the OS catalog credential represents the single **generation commit point** for selective deletions and key rotations.
   - No central raw backup, recovery escrow, recovery key, or administrative override exists. Device or key loss permanently loses private history.
3. **Deadlines Override Legal Holds:**
   - Legal holds prevent voluntary employee deletion of eligible evidence strictly within its existing configured retention deadline.
   - A legal hold cannot authorize new capture, cannot provide manager or administrative browsing access to raw timelines, and cannot extend retention beyond the original raw retention deadline.
   - Expired records are permanently purged regardless of hold status.
4. **Signed Verdict Gating for Voluntary Deletion:**
   - Voluntary deletion, selective purge, and client uninstallation require a valid, signed retention verdict (`SignedRetentionVerdict`) with complete source coverage.
   - An expired verdict, missing signature, or unknown status blocks voluntary deletion and uninstallation, preserving data integrity until verified upon reconnection.
5. **Screen and Meeting Retention Separation:**
   - Disabling `personal_history_retention` applies strictly to new automatic screen history. Existing screen records remain accessible and deletable until their original deadline.
   - Separately authorized meeting recordings continue storing under their explicit session retention policy.
   - Screen observations in retention-disabled mode operate under a strict 30-second volatile memory ceiling in locked, non-swappable RAM without disk persistence.
6. **Stopped-at-Capacity Behavior:**
   - Per-profile storage is capped at 10 GiB with a 256 MiB preallocated maintenance reserve and a 1 GiB free disk admission floor.
   - Reaching capacity triggers an immediate sweep of normally expired records. If space remains exhausted, affected capture sources halt cleanly and prompt user action; unexpired records are never evicted early, and capture never silently drops to unencrypted ephemeral mode.
7. **Direct Helper-to-Helper Link (Contract 25, `privacy-context.v1`):**
   - The desktop shell creates an isolated Unix domain socketpair or Windows anonymous pipe pair at launch and passes descriptors directly to `oryn-privacy-helper` and `oryn-hud-helper`.
   - Permitted observations and reverse demonstration proposals flow directly between privacy and HUD engines under length-prefixed framing without shell broker overhead.

## Rationale and Alternatives

- *Alternative Considered: Single Monolithic Database File:* Rejected. Rebuilding a single multi-gigabyte encrypted database for selective deletion creates severe write amplification, blocks ongoing capture, and risks database corruption across power losses. Hourly sealed partitions isolate write blast radius.
- *Alternative Considered: Per-Frame OS Keychain Secrets:* Rejected. Storing thousands of individual frame keys in macOS Keychain or Windows Credential Manager causes excessive IPC latency, keychain daemon lockups, and poor user experience. The encrypted generation catalog with a single master credential provides sub-millisecond key lookups with atomic generation rotation.
- *Alternative Considered: Physical Sector Overwrite (Gutmann/DoD Sanitization):* Rejected. Modern solid-state drives (SSDs) use proprietary wear-leveling, bad-block retirement, and over-provisioning controllers that bypass OS-level sector write commands. Security is guaranteed via cryptographic key destruction: unlinking partition keys renders remaining NAND flash blocks permanently unreadable ciphertext.
- *Alternative Considered: Separate Background Cleanup Daemon:* Rejected. An independent background daemon introduces service management complexity, requires ambient background credentials, and cannot run when the employee device is powered off. Local cleanup sweeps execute within the privacy helper process during active sessions and immediately at startup.

## Consequences

- Private evidence is protected by military-grade AES-256 encryption at rest, authenticated page HMACs, and OS-backed credential protection.
- Selective deletion is crash-safe, verified by generation commit points, and leaves no readable shadow traces in database free-lists or FTS virtual tables.
- Legal holds and compliance restrictions are enforced without violating employee trust or enabling remote administrative surveillance.
- Total data loss is permanent if OS credentials or devices are wiped; the product explicitly communicates this boundary to enterprise customers.
