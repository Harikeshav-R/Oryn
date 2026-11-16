# Contribution Delivery, Truthful Deletion Races, and Guidance Cache Synchronization

**Status:** accepted  
**Date:** 2026-11-09  
**Deciders:** User-Approved Architecture Review  
**Authority:** Technical Architecture & Security Engineering  
**Amends:** [ADR-0001](0001-desktop-runtime-and-presentation.md), [ADR-0007](0007-private-evidence-storage-and-retention.md), [ADR-0008](0008-reviewed-still-image-sharing.md), [ADR-0009](0009-local-context-guidance-and-assist-boundaries.md)  
**Amended by:** [ADR-0011](0011-identity-authority-and-approval-fencing.md), [ADR-0022](0022-release-eligibility-and-rollout-governance.md)  
**Normative Specification:** [docs/components/contribution-sync.md](../components/contribution-sync.md)

---

## Context

Oryn mediates the critical boundary between an employee's private on-device work history and shared organizational intelligence ([PRODUCT.md §§4.4, 10, 12, 25](../../PRODUCT.md)). While [ADR-0007](0007-private-evidence-storage-and-retention.md) and [ADR-0008](0008-reviewed-still-image-sharing.md) established private evidence partitioning, privacy helper review attestations, and still-image sharing limits, several hard-to-reverse architectural decisions remained open regarding how reviewed knowledge crosses the network wire and how published guidance is cached locally:

1. **Network Process Isolation vs. Monolithic Privacy Helper:** Whether network synchronization should run within `oryn-privacy-helper` or in a dedicated unprivileged helper process.
2. **Delivery Receipt Semantics vs. Domain Intake:** Whether central acceptance constitutes publication and whether intake requires staging through object storage or atomic relational commits.
3. **Network Races, Deletion, and Withdrawal Semantics:** How to truthfully handle deletion races during dispatch, employee withdrawal of shared contributions, and idempotency across crashes and retransmissions.
4. **Guidance Working Set Delivery and Cache Swapping:** How published guidance is retrieved, cryptographically verified, and delivered to [local-context-hud](../components/local-context-hud.md) without risk of mixed-version corruption or unauthorized offline execution.
5. **Replay Protection vs. Long-Term Privacy:** How the cloud control plane prevents replay attacks and maintains transport idempotency across the organization's lifetime without retaining permanent surveillance records of employee contributions.

---

## Decision

1. **Dedicated Unprivileged Sync Helper (`oryn-sync-helper`):**
   - Run network synchronization in a dedicated signed, unprivileged Rust child process, `oryn-sync-helper`, supervised by Desktop Shell.
   - The sync helper communicates with Desktop Shell over `shell-sync.v1` (major 1, minor 0) and directly with `oryn-privacy-helper` over `privacy-sync.v1` (major 1, minor 0) via inherited anonymous pipes/socketpairs.
   - The helper never receives private evidence encryption keys, disk master credentials, or raw capture data. It receives short-lived, audience-bound access tokens from `SessionBroker`.
2. **Domain-Owned PostgreSQL Atomic Acceptance:**
   - Egress uses HTTPS request/response APIs and bounded long polling (25-second wait) over TLS 1.3 with strict SPKI pinning, not gRPC streaming.
   - Submissions are accepted directly into PostgreSQL relational intake tables (`discovery_contribution_intake` for workflows, `graph_handoff_intake` for handoffs) with bounded PNG images in `bytea` columns. No object storage staging or presigned URLs exist on this path.
   - Acceptance executes within a single `READ COMMITTED` transaction using deterministic `FOR SHARE` locks on policy guards and `FOR UPDATE` on `sync_submission_identity`, atomically inserting intake rows, image artifacts, signed `DeliveryReceiptV1`, and outbox events.
   - A delivery receipt proves durable central acceptance, not publication or business correctness.
3. **Truthful Deletion Races and Immediate Unpublished Withdrawal:**
   - If an employee deletes private evidence while a contribution is queued, the privacy helper cancels the release fence and the sync helper drops the queued upload; zero bytes leave the device.
   - If deletion occurs during dispatch, the delivery projection transitions to `delivery_unknown`. Local deletion finishes immediately. Upon reconnection, the gateway queries status first and issues a metadata-only withdrawal, never re-uploading source bytes.
   - Employee withdrawal immediately excludes unpublished intake from discovery synthesis and marks dependent draft proposals `needs_recomputation`. Published derivatives require governed Workflow Owner removal review.
   - When `personal_history_retention=false`, contributions are online-only: approved buffers exist in volatile memory bounded by the source's 30-second TTL and are never queued durably.
4. **Immutable Guidance Bundles, Working Sets, and Atomic Swaps:**
   - Guidance updates transfer access-filtered manifest deltas plus complete immutable changed bundles (`GuidanceBundleV1`) with publisher signatures (`SignedPublisherSignatureV1`). Binary diff patching is prohibited.
   - Guidance working sets are cached in an encrypted local database (`sync-state.db`) and delivered to HUD over Contract 20 bulk-data rails.
   - HUD prepares generations in a staging area; activation executes via a two-phase commit (`BeginGuidanceGeneration` -> `GuidanceGenerationPrepared` -> `CommitGuidanceGeneration`). Partial or corrupted generations never become active.
   - Offline reading is governed by a signed `SignedGuidanceAccessLeaseV1` (maximum validity 24 hours). Executing assisted or autonomous actions while offline is unconditionally blocked.
5. **Minimal Organization-Lifetime Replay Ledger:**
   - Maintain a minimal central serialization and replay ledger (`sync_submission_identity`) across the organization's lifetime: `organization_id`, `contribution_id`, `revision`, `content_digest`, and terminal `disposition`.
   - The ledger contains zero narrative text, image bytes, private evidence IDs, or employee activity history.
   - It survives content and receipt pruning to prevent replay resurrection, and is permanently erased only when the organization itself is deleted.

---

## Rationale and Alternatives

- *Alternative Considered: Merging Knowledge Contribution Sync into Privacy Helper:* Rejected. Giving `oryn-privacy-helper` general asynchronous contribution upload and broad synchronization transport expands the network attack surface. Isolating asynchronous knowledge synchronization in `oryn-sync-helper` ensures offline contribution queues and bulk guidance transfers stay separate from `oryn-privacy-helper` (which maintains strictly bounded, governed inference egress under Contract 22 alongside local evidence keys; see [ADR-0005](0005-cloud-inference-and-private-evidence.md) and [ADR-0011](0011-identity-authority-and-approval-fencing.md)).
- *Alternative Considered: Hardware Enclave for Review Attestation:* Rejected per [ADR-0011](0011-identity-authority-and-approval-fencing.md). The review key is a software Ed25519 key stored in OS-protected credential storage (`com.oryn.device.identity`).
- *Alternative Considered: Object Storage Staging for Redacted PNGs:* Rejected. Staging image artifacts in S3/GCS using presigned upload URLs introduces race conditions between image uploads and metadata submission, requires multi-service cleanup upon cancellation, and risks orphaned images. Because still images are strictly bounded (<= 1920x1080, <= 1 MiB, max 4 per contribution), committing them directly to PostgreSQL `bytea` columns inside the domain acceptance transaction guarantees transactional atomicity.
- *Alternative Considered: gRPC Bidirectional Streaming:* Rejected. gRPC streaming introduces stateful connection maintenance complexities across corporate proxies, VPN reconnects, and laptop sleep cycles. HTTPS REST with bounded long polling provides robust proxy compatibility, simpler connection recovery, and standard cache integration.
- *Alternative Considered: Full Archival of Withdrawn Contributions:* Rejected. Retaining full copies of withdrawn employee contributions under standard retention schedules violates employee trust. Immediate exclusion of unpublished intake guarantees employee intent is honored while preserving governed review for published procedures.

---

## Consequences

- The network boundary for reviewed procedural contributions is concrete, verifiable, and protected by machine-readable schemas ([`contribution-sync-v1.schema.json`](../architecture/contracts/contribution-sync-v1.schema.json) and [`guidance-sync-v1.schema.json`](../architecture/contracts/guidance-sync-v1.schema.json)).
- Truthful deletion and withdrawal guarantees prevent silent data resurrection, stalled local purges, or unapproved candidate publication.
- Guidance cache updates are atomic, verifiable, and strictly bounded to an authorized working set.
- Amends [ADR-0001](0001-desktop-runtime-and-presentation.md) by defining the supervised `oryn-sync-helper` child and channel topology.
- Amends [ADR-0007](0007-private-evidence-storage-and-retention.md) by specifying the `privacy-sync.v1` protocol and release fence coordination.
- Amends [ADR-0008](0008-reviewed-still-image-sharing.md) by formalizing artifact policy verification and PostgreSQL `bytea` intake.
- Amends [ADR-0009](0009-local-context-guidance-and-assist-boundaries.md) by defining the two-phase HUD generation intake protocol over Contract 20.
- *(Scope Amendment — 2026-11-16): [ADR-0022](0022-release-eligibility-and-rollout-governance.md) requires guidance bundle publication to retain release-owned `SignedAssistReleaseEligibilityV1` within `AssistPlanV1.eligibility`. Sync helper and HUD must verify dual signatures (publisher and release governance) and current eligibility generation before activating assist plans for execution.*
