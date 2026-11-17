# Contribution and Synchronization Gateway Component Specification

Status: Detailed technical specification — implementation pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§4.8, 7.2, 8.1, 8.8, 10, 11.5, 13.2](../../TECHNICAL.md) | [PRODUCT.md §§4.4, 10, 12.1, 25.4, 25.5, 25.7; ORY-007, ORY-010, ORY-012, ORY-015, ORY-018, ORY-068, ORY-069, ORY-070](../../PRODUCT.md) | [Cross-Component Contracts Catalog](../architecture/contracts/README.md) | [Data Classification and Retention](../architecture/data-classification.md)

### Core Responsibility
The Contribution and Synchronization Gateway mediates the boundary between private device knowledge and organization-shared knowledge. It provides secure, policy-gated, duplicate-safe network transmission of employee-approved sanitized workflow contributions and reviewed meeting handoffs to the organizational control plane, while delivering authorized published guidance bundles and peer fixes back to employee endpoints.

### Owns
- Secure network transport, offline queueing, and authenticated transmission of employee-approved workflow contributions (`ReviewedContributionV1`) and reviewed meeting handoffs (`ReviewedMeetingHandoffProposal`).
- Verification of employee Ed25519 review attestations (`sync.review-attestation.v1`) generated and signed exclusively by [local-privacy-storage](local-privacy-storage.md).
- Generating, recording, and returning local and central delivery receipts (`delivery_receipt_id`) under Contract 2 and Contract 24.
- Tracking local-to-cloud connectivity states, network interface capabilities, backoff retry schedules, and truthful delivery status projections (`delivery_projection`).
- Secure retrieval, cryptographic verification, durable disk caching, and generation-based atomic swaps of published guidance bundles (`GuidanceBundleV1`) and peer fixes.
- Enforcement of signed guidance access leases (`hud.guidance-access-lease.v1`, maximum validity 24 hours).
- Local management of the minimal organization-lifetime replay ledger (`organization_id`, `contribution_id`, `revision`, `content_digest`, terminal disposition).

### Consumes
- Sanitized, employee-reviewed task contributions with cryptographic Ed25519 review attestations from [local-privacy-storage](local-privacy-storage.md) over private protocol `privacy-sync.v1`.
- Centrally published playbooks, rules, and guidance manifest changes from [operational-graph](operational-graph.md) and [control-plane](control-plane.md) via HTTPS.
- Authoritative trust keysets (`sync.trust-keyset.v1`), canonical signed artifact policies (`privacy.artifact-policy.v1` binding `policy_version` and gated by active 24-hour storage certification under [infrastructure-security](infrastructure-security.md)), signed control snapshots (`sync.control-snapshot.v1`), and change pages (`sync.change-page.v1`) from [identity-policy](identity-policy.md).
- Network interface status and supervisor lifecycle events from [desktop-shell](desktop-shell.md) over `shell-sync.v1`.

### Produces
- Authenticated, organization-scoped contribution payloads delivered to [workflow-discovery](workflow-discovery.md) for procedure clustering and candidate synthesis, including required nullable `observed_task_completed_at` in `WorkflowContributionContentV1` to establish empirical baseline task duration and completion boundaries.
- Reviewed meeting handoff proposals (`ReviewedMeetingHandoffProposal`) delivered to [operational-graph](operational-graph.md) via Contract 24.
- Cryptographically verified, access-filtered guidance working sets delivered to [local-context-hud](local-context-hud.md) via [desktop-shell](desktop-shell.md) over Contract 20 bulk-data rails.
- Contribution delivery receipts, queue admission states, and connectivity indicators delivered to [desktop-shell](desktop-shell.md).

### Does Not Own
- Direct upload or egress of unreviewed or raw screen, audio, video, or full-transcript capture files (strictly prohibited on the contribution path).
- Routing transient AI inference requests (owned exclusively by [local-privacy-storage](local-privacy-storage.md) edge client and [control-plane](control-plane.md) under Contract 22 / [cloud-inference](../architecture/cloud-inference.md); inference processing is decoupled from organizational contribution).
- Holding endpoint private review keys or manufacturing employee approval (owned exclusively by [local-privacy-storage](local-privacy-storage.md) in `com.oryn.device.identity`; sync verifies public attestations and transports public enrollment registration only per [ADR-0011](../adr/0011-identity-authority-and-approval-fencing.md)).
- Executing actions or assists offline (offline guidance is strictly read-only under signed `SignedGuidanceAccessLeaseV1` capped at 24 hours; executing autonomous or assisted actions while offline is unconditionally blocked).
- Deciding whether a candidate workflow should be published across the company (owned by [operational-graph](operational-graph.md)).
- Central identity, policy evaluation, or credential issuance (owned by [identity-policy](identity-policy.md)).
- Index compilation or visual highlight rendering (owned by [local-context-hud](local-context-hud.md) and [desktop-shell](desktop-shell.md)).

### Boundary Invariants and Agreed Execution Decisions
1. **Retention-Off Online-Only Constraint:** When an employee sets `personal_history_retention=false`, screen-derived workflow contributions operate in an online-only mode. Approved payloads exist only in locked volatile memory buffers bounded by the source's 30-second lifetime and release fence; no durable sanitized payload capsule or offline queue payload is written to disk. Expiry destroys the buffer without durable trace.
2. **Immediate Unpublished Withdrawal Exclusion:** Employee withdrawal immediately excludes unpublished accepted contributions from candidate clustering and synthesis, and invalidates dependent unpublished proposals. Published derivatives use governed removal review by Workflow Owners; retention policies or legal holds do not permit continued synthesis from withdrawn records.
3. **No Independent Review Expiry:** Employee approval has no synthetic review timer. The exact reviewed content, purpose, audience, source eligibility, current authorization, and cancellation still gate transmission.
4. **Private Meeting Session Isolation:** Private meeting-session identifiers remain strictly local to `local-privacy-storage`. No shared meeting-group identifier is exposed over the network wire.
5. **Dedicated Unprivileged Helper:** The gateway executes as a dedicated signed, unprivileged Rust child process, `oryn-sync-helper`, supervised by Desktop Shell. It never receives private evidence encryption keys or raw capture paths.
6. **HTTPS REST and Bounded Polling:** All cloud communications use HTTPS request/response APIs and bounded long polling (25-second wait), not gRPC streaming.
7. **Delivery Receipt vs. Outcome Separation:** A delivery receipt proves domain-owned durable acceptance, not publication, correctness, or recipient acceptance. Acceptance atomically commits payload, deduplication result, receipt, and outbox.
8. **Bounded Offline Guidance Lease:** Default read-only offline guidance lease validity is 24 hours; organizational policy may shorten it. Executing new assisted or autonomous actions while offline is unconditionally blocked.
9. **PostgreSQL Relational Intake:** Bounded accepted PNG attachments are stored in PostgreSQL `bytea` columns within the domain acceptance transaction. No object-storage staging or presigned upload URLs exist on this path.
10. **Manifest Deltas and Immutable Bundles:** Guidance updates transfer access-filtered manifest deltas plus complete immutable changed bundles. Binary diff patching is prohibited.
11. **Bounded Working Set:** Offline guidance promises a bounded, visibly reported working set (prioritizing the active guide, recent use, and relevant team playbooks within declared capacity), not all company playbooks.
12. **Status-First Recovery:** Ambiguous delivery (timeouts, disconnects, crashes) recovers through status lookup first. Replay occurs only while source and policy gates remain valid. Following cancellation or source deletion, the gateway sends metadata-only reconciliation or withdrawal, never payload bytes.
13. **Strict Capacity Caps:** Per-profile pending payload cap is 256 MiB and 1,024 submissions. Guidance cache cap is 256 MiB. Admission space must be reserved before committing an offline enqueue; unsent approved content is never silently evicted.
14. **Machine-Readable Schemas:** Contract schemas are maintained in `docs/architecture/contracts/contribution-sync-v1.schema.json` and `docs/architecture/contracts/guidance-sync-v1.schema.json`.
15. **Minimal Replay Ledger:** A minimal replay ledger is retained for the organization's lifetime: organization ID, submission ID/revision, content digest, and terminal disposition. It contains zero narratives, images, private evidence IDs, or employee activity history. It is permanently erased when the organization is deleted.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§4.4, 10, 12.1, 25.4, 25.5, 25.7; ORY-007, ORY-010, ORY-012, ORY-015, ORY-018, ORY-068, ORY-069, ORY-070](../../PRODUCT.md))
- **Explicit Review Before Sync (ORY-007):** No procedural data may leave the device without an explicit review receipt proving the employee approved the contribution.
- **Contribution Withdrawal and Truthful Status (ORY-010):** Employees can withdraw previously shared contributions; unpublished use stops immediately while published knowledge follows governed removal. Delivery projections accurately distinguish between queued, dispatching, delivered, delivery unknown, and cancelled states.
- **Structured Candidate Payloads (ORY-012):** Transmitted contributions contain sanitized task objectives, step sequences, application names, observed variables, decisions, and exceptions without raw media. Redacted still images are strictly limited to at most four 8-bit PNG images (<= 1920x1080, <= 1 MiB) under an active signed artifact policy.
- **Delivery Receipt vs. Outcome Separation (ORY-015):** The system distinguishes network acceptance from business outcome verification and recipient acceptance.
- **Quota Enforcement and Storage Admission (ORY-018):** Enforces hard per-profile storage caps (256 MiB offline queue, 256 MiB guidance cache, 1 GiB host free-space floor) and rejects new admissions when full.
- **Offline Guidance Working Set (ORY-068):** Allows offline reading of cached playbooks under a signed 24-hour access lease, but unconditionally blocks offline execution of assisted or autonomous actions.
- **Atomic Cache Swapping (ORY-069):** Guidance cache updates swap atomically between complete prepared generations; partial or corrupted updates never become active.
- **Immediate Restriction and Conflict Revocation (ORY-070):** Policy changes, access revocations, and bundle conflicts invalidate local cache entries and purge in-flight queues immediately upon receipt.

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)  
**Machine-Readable Schemas:**
- Contribution Wire Schema: [`docs/architecture/contracts/contribution-sync-v1.schema.json`](../architecture/contracts/contribution-sync-v1.schema.json) (`urn:oryn:schemas:contribution-sync:v1`)
- Guidance Wire Schema: [`docs/architecture/contracts/guidance-sync-v1.schema.json`](../architecture/contracts/guidance-sync-v1.schema.json) (`urn:oryn:schemas:guidance-sync:v1`)

### 1. Contract 2: Reviewed Contribution Delivery (`sync.reviewed-contribution.v1`)
- **Producer:** `oryn-privacy-helper` via `privacy-sync.v1`
- **Consumer:** `workflow-discovery` via HTTPS `POST /v1/sync/submissions`
- **Payload:** `ReviewedContributionV1` (`sync.reviewed-contribution.v1`)
- **Invariants:** Sanitized text and purpose-bound redacted PNG images only. The outer signed attestation binds identity, revision, preview content digest, and governing policy revisions.

### 2. Contract 24: Reviewed Meeting Handoff Proposal (`meeting.reviewed-handoff.v1`)
- **Producer:** `meeting-intelligence` via `contribution-sync`
- **Consumer:** `operational-graph` via HTTPS `POST /v1/sync/submissions`
- **Payload:** `ReviewedContributionV1` where `kind = "meeting_handoff"` and `content` is `ReviewedMeetingHandoffProposal` (`meeting.reviewed-handoff.v1`).
- **Invariants:** Text-only excerpt and structured business context. `artifacts` must be empty. Meeting session identifiers remain local and are never transmitted over the wire. In `graph_handoff_intake`, `recipient_state` is a coarse intake projection (`proposed`, `accepted`, `rejected`, `cancelled`); detailed assignment, work progression, blockers, and independent completion assessments live solely in Operational Graph's canonical `graph_handoff` table.

### 2.1 Contract 26: Reviewed Incident Correction (`incident.reviewed-correction.v1`)
- **Producer:** `incident-correction-repair` / `local-privacy-storage` via `contribution-sync`
- **Consumer:** `incident-correction-repair` via HTTPS `POST /v1/sync/submissions` (routing destination `incident_correction_repair`)
- **Payload:** `ReviewedContributionV1` where `kind = "reviewed_correction"` and `content` is `ReviewedCorrectionV1` (`incident.reviewed-correction.v1`).
- **Invariants:** Sanitized text only (`artifacts` must be empty, `maxItems: 0`). Carries incident reference, execution context, learning type, generality, sanitized text (≤ 8,192 chars), evidence refs, and `source_expires_at`. Wrapped in existing `ReviewedContributionV1` with `purpose: "incident_correction"`, signed review attestation, and release permit. No audio, transcript archive, media handles, or local paths. Intake verifies purpose, audience, source expiry, and Privacy Helper release fence before custodial acceptance.

### 3. Contract 3: Published Guidance Bundles (`hud.guidance-bundle.v1`)
- **Producer:** `operational-graph` via HTTPS `GET /v1/sync/guidance/bundles/{sha256}`
- **Consumer:** `local-context-hud` via `desktop-shell`
- **Payload:** `SignedGuidanceBundleV1` (`sync.signed-guidance-bundle.v1`) containing `GuidanceBundleV1` and `SignedPublisherSignatureV1`.
- **Invariants:** Bundles are strictly immutable and version-pinned by `content_sha256`. Steps declare an explicit DAG via `step_edges` (0..256 unique records). Successor evaluation is fail-closed. Manifest generation and bundle retrieval evaluate the full conjunction of Discovery source audiences (`DiscoveryAudienceV1`) live against the requesting principal; coarse role/team metadata inside the bundle payload is non-authoritative display metadata, not an authorization boundary. Bundles may contain Stage 3 approved assist plans (`AssistPlanV1`) embedding Vault-signed `SignedAssistReleaseEligibilityV1` envelopes; sync caches signed bundles unchanged; Desktop Shell renders presentation without computing authority; Local Context HUD validates both Operational Graph publisher signature and Release Governance Vault `policy` signature before assist plan execution.
### 4. Contract 20 Relay: Atomic HUD Guidance Transfer
Relayed over `shell-hud.v1` data rails using closed IPC types:
- `BeginGuidanceGeneration`: Declares generation UUID, manifest revision, manifest SHA-256, sorted object hashes, and signed access lease.
- `GuidanceBundleChunk`: 256 KiB base64url chunks with sequential chunk indices and exact declared lengths.
- `GuidanceGenerationPrepared`: HUD signals compilation completion and memory footprint.
- `CommitGuidanceGeneration`: Authoritative atomic swap command.
- `GuidanceGenerationCommitted`: Swap acknowledgment.
- `InvalidateGuidance`: High-priority eviction command that bypasses bulk backpressure.

### 5. Direct Privacy-Sync Protocol (`privacy-sync.v1`, major 1, minor 0)
Operates over private inherited socketpairs between `oryn-privacy-helper` and `oryn-sync-helper`:
- `ReserveQueueSlot` / `ReserveQueueSlotResult`: Reserves capacity before approval confirmation.
- `EnqueueReviewedContribution` / `PayloadChunk` / `CommitEnqueue`: Commits payload into sync custody.
- `BeginRelease`: Privacy helper checks active fences and issues `SignedReleasePermitV1`.
- `CancelRelease`: Authoritative cancellation from privacy helper (deletions, source expiry).
- `RecordDelivery` / `RecordDeliveryResult`: Records server acceptance receipt and updates delivery projection.
- `GetReleaseState` / `GetReleaseStateResult`: Crash recovery status query without reading raw private evidence.
- `GetReviewPublicKeys`: Delivers enrolled device public keys to sync helper.
- `RestrictionApplied`: Bounded restriction acknowledgment.

### 6. Control Plane HTTP API Endpoints

| Method & Path | Auth & Headers | Request Payload | Response & Status | Invariants |
|---|---|---|---|---|
| `POST /v1/sync/bootstrap` | Bearer Token (`sync:contribute`, `guidance:read`) | `SyncBootstrapRequestV1` | `200 OK`: `SyncBootstrapResponseV1` | Establishes current snapshot, keyset, and artifact policy. |
| `GET /v1/sync/changes?cursor={c}&wait_seconds=25` | Bearer Token | Query params | `200 OK`: `SyncChangePageV1` | Bounded long polling; returns ordered events or timeout heartbeat. |
| `POST /v1/sync/submissions` | Bearer Token (`sync:contribute`), `Idempotency-Key` | Multipart body: Part 1 `SubmissionMetadataV1`, Parts 2..N PNG | `201 Created` / `200 OK`: `DeliveryReceiptV1` | Atomic PostgreSQL commit into destination tables. |
| `GET /v1/sync/submissions/{id}/revisions/{rev}` | Bearer Token (`sync:read_own` or `sync:review_ledger`) | None | `200 OK`: `SubmissionStatusV1` | Signed metadata status. Retained digest visible only under authorized ownership. |
| `POST /v1/sync/submissions/{id}/revisions/{rev}/withdrawals` | Bearer Token (`sync:withdraw_own`) | `SubmissionClosureRequestV1` | `200 OK`: `SubmissionStatusV1` | Excludes unpublished intake; marks dependent drafts for recomputation. |
| `GET /v1/sync/guidance/manifest?cursor={c}` | Bearer Token (`guidance:read`) | Query params | `200 OK`: `GuidanceManifestPageV1` | Returns access-filtered delta manifest pages. |
| `GET /v1/sync/guidance/bundles/{sha256}` | Bearer Token (`guidance:read`) | None | `200 OK`: `SignedGuidanceBundleV1` | Returns immutable bundle and publisher signature sidecar. |
| `POST /v1/sync/guidance/lease` | Bearer Token (`guidance:read`) | `GuidanceLeaseRequestV1` | `200 OK`: `SignedGuidanceAccessLeaseV1` | Issues signed read-only offline lease for authorized hashes. |
| `POST /v1/identity/devices/{id}/review-keys/challenge` | Bearer Token (`device:enroll`) | `ReviewKeyChallengeRequestV1` | `201 Created`: `SignedReviewKeyChallengeV1` | 32-byte nonce challenge valid for <= 5 minutes. |
| `POST /v1/identity/devices/{id}/review-keys` | Bearer Token (`device:enroll`) | `ReviewKeyRegistrationRequestV1` | `201 Created`: `SignedReviewKeyRegistrationV1` | Proof of possession registration over challenge payload. |

### 7. Normative Machine-Readable Fixture Examples

#### Fixture Set (`sync.fixture-set.v1`)
```json
{
  "schema_id": "sync.fixture-set.v1",
  "public_keys": [
    {
      "key_id": "key_root_01",
      "purpose": "root",
      "public_key": "NydObnS201Sd82aeKIudXnGMJ5BB4Tj3ln8DUSc3e0U"
    },
    {
      "key_id": "key_policy_01",
      "purpose": "policy",
      "public_key": "lcuz6wasmUrt_bYjiGcg1AD5GEndg3z-5ndFavErPtw"
    },
    {
      "key_id": "key_publisher_01",
      "purpose": "publisher",
      "public_key": "kLFqiOXjgcdxo6QAG93-YST6xjdAwwU2Wv0Cb6UI7nE"
    },
    {
      "key_id": "key_receipt_01",
      "purpose": "receipt",
      "public_key": "-gAZ3l4SixbWlOS8PZPhPReyD89fJxjdjJQxRth4Dgk"
    },
    {
      "key_id": "key_dev_01",
      "purpose": "device",
      "public_key": "AIoCVTdr59W0XbpaOLUKVIG2JsuMhvooms7AgJyPI78"
    }
  ],
  "artifacts": [
    {
      "artifact_id": "a0000000-0000-4000-8000-000000000001",
      "bytes_base64url": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGMQUDAAAACkAGE0Zn1yAAAAAElFTkSuQmCC"
    }
  ]
}
```

#### Signed Artifact Policy (`privacy.artifact-policy.v1`)
```json
{
  "schema_id": "privacy.artifact-policy.v1",
  "key_id": "key_policy_01",
  "payload": {
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "policy_version": "5",
    "allowed_purposes": [
      "workflow_sharing",
      "handoff_coordination"
    ],
    "allowed_audiences": [
      "aud_finance_ops",
      "aud_procurement_team"
    ],
    "max_lifetime_days": 90,
    "max_dimensions": {
      "width": 1920,
      "height": 1080
    },
    "max_byte_length": 1048576,
    "max_image_count": 4,
    "issued_at": "2026-11-09T00:00:00Z",
    "not_after": "2026-12-09T00:00:00Z"
  },
  "signature": "KGD5MYof_8JcnUwmLXdeTsBK2le1AvkkLCMvQX2QnV7olhyNNjR6KKVmsMKGof6Ocz8VmOjV0xLoFrG0ZWsKBA"
}
```

#### Signed Trust Keyset (`sync.trust-keyset.v1`)
```json
{
  "schema_id": "sync.trust-keyset.v1",
  "key_id": "key_root_01",
  "payload": {
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "keyset_revision": "1",
    "issued_at": "2026-11-09T00:00:00Z",
    "not_after": "2026-11-10T00:00:00Z",
    "keys": [
      {
        "key_id": "key_policy_01",
        "purpose": "policy",
        "public_key": "lcuz6wasmUrt_bYjiGcg1AD5GEndg3z-5ndFavErPtw",
        "status": "active",
        "not_before": "2026-11-01T00:00:00Z",
        "not_after": "2026-12-01T00:00:00Z"
      },
      {
        "key_id": "key_publisher_01",
        "purpose": "publisher",
        "public_key": "kLFqiOXjgcdxo6QAG93-YST6xjdAwwU2Wv0Cb6UI7nE",
        "status": "active",
        "not_before": "2026-11-01T00:00:00Z",
        "not_after": "2026-12-01T00:00:00Z"
      },
      {
        "key_id": "key_receipt_01",
        "purpose": "receipt",
        "public_key": "-gAZ3l4SixbWlOS8PZPhPReyD89fJxjdjJQxRth4Dgk",
        "status": "active",
        "not_before": "2026-11-01T00:00:00Z",
        "not_after": "2026-12-01T00:00:00Z"
      }
    ]
  },
  "signature": "u3mDsbnnDj7zKogo0EdxFldy-TgZiI8ZkD77udKjcVfB-8_Mot-zZBiDmabIk4_HJ3lIDCIGiP1Bz0Zz1c4EBw"
}
```

#### Reviewed Workflow Contribution (`sync.reviewed-contribution.v1`)

The review digest `content_digest` covers the exact RFC 8785 canonical JSON bytes of the unsigned semantic projection `{organization_id, actor_id, device_id, profile_id, contribution_id, revision, kind, purpose, audience, content, artifacts}`, excluding `content_digest` and `review_attestation` themselves. Preimage canonicalization sorts `audience.audience_ids`, each step's `variable_refs` and `artifact_ids` lexicographically, and sorts top-level artifact manifests by `artifact_id`; all other array orders (steps, decisions, branches, application sequence) are preserved. Duplicate set members are rejected. Artifact manifests and hashes are bound directly, never mutable image URLs. The review attestation signature covers `UTF-8(schema_id) + 0x0A + RFC_8785_Canonical_JSON(payload)`.

```json
{
  "schema_id": "sync.reviewed-contribution.v1",
  "organization_id": "00000000-0000-4000-8000-000000000001",
  "actor_id": "usr_employee_01",
  "device_id": "dev_macbook_01",
  "profile_id": "prf_default_01",
  "contribution_id": "c0000000-0000-4000-8000-000000000001",
  "revision": 1,
  "kind": "workflow",
  "purpose": "workflow_sharing",
  "audience": {
    "audience_ids": [
      "aud_finance_ops"
    ]
  },
  "content": {
    "demonstration_id": "d0000000-0000-4000-8000-000000000001",
    "completion_basis": "observed_complete",
    "task_measurement": {
      "elapsed_ms": 600000,
      "wait_ms": 120000,
      "basis": "observed_task_boundary",
      "complete_interval": true
    },
    "objective": "Reconcile daily invoice batches with ERP purchase orders",
    "summary": "Match received invoice line items to open ERP purchase orders and flag unit variance.",
    "applications": [
      {
        "application_id": "app_erp_core",
        "display_name": "ERP Core Client"
      }
    ],
    "inputs": [
      {
        "name": "batch_file",
        "value_label": "REDACTED_INVOICE_BATCH.CSV",
        "provenance": "observed"
      }
    ],
    "variables": [
      {
        "name": "batch_id",
        "value_label": "BATCH-20261109-01",
        "provenance": "reviewer_supplied"
      }
    ],
    "steps": [
      {
        "step_id": "step_open_batch",
        "order": 1,
        "application_id": "app_erp_core",
        "action": "Open Reconciliation Queue and select active daily batch",
        "expected_result": "Batch line items display with pending status indicators",
        "variable_refs": [
          "batch_id"
        ],
        "artifact_ids": [
          "a0000000-0000-4000-8000-000000000001"
        ]
      }
    ],
    "decisions": [
      {
        "decision_id": "dec_variance_check",
        "condition": "Line item unit variance exceeds tolerance threshold",
        "branches": [
          {
            "label": "Under tolerance",
            "target_step_id": "step_open_batch"
          }
        ]
      }
    ],
    "exceptions": [
      {
        "condition": "Purchase order status is closed or cancelled",
        "resolution": "Route invoice line to supervisory exception queue",
        "escalation_role_id": "role_finance_supervisor"
      }
    ],
    "suspected_outputs": [
      "Daily reconciliation variance report"
    ],
    "missing_evidence": [
      "Automated credit memo confirmation"
    ],
    "outcome": {
      "claim": "observed_complete",
      "shared_verification_ref": null
    }
  },
  "artifacts": [
    {
      "artifact_id": "a0000000-0000-4000-8000-000000000001",
      "media_type": "image/png",
      "width": 1,
      "height": 1,
      "byte_length": 69,
      "sha256": "d220355abb4483298addfcae6959dcadbb69552c422a0f005176197133fe6122",
      "step_ids": [
        "step_open_batch"
      ],
      "not_after": "2026-12-09T00:00:00Z",
      "artifact_policy_revision": "art_pol_rev_05"
    }
  ],
  "content_digest": "dc3679cef69b52542a84edbbadeeaa07a5fafe14c2bbddea5a48a21bf6c86f5a",
  "review_attestation": {
    "schema_id": "sync.review-attestation.v1",
    "key_id": "key_dev_01",
    "payload": {
      "review_receipt_id": "90000000-0000-4000-8000-000000000001",
      "organization_id": "00000000-0000-4000-8000-000000000001",
      "actor_id": "usr_employee_01",
      "device_id": "dev_macbook_01",
      "profile_id": "prf_default_01",
      "contribution_id": "c0000000-0000-4000-8000-000000000001",
      "revision": 1,
      "content_digest": "dc3679cef69b52542a84edbbadeeaa07a5fafe14c2bbddea5a48a21bf6c86f5a",
      "reviewed_at": "2026-11-09T20:00:00Z",
      "source_not_after": "2026-11-09T20:30:00Z",
      "policy_revision": "100",
      "artifact_policy_revision": "art_pol_rev_05"
    },
    "signature": "CVjAQ2TAehOJ-YpqlQ2fYOoA0EIFU0mP7ujKhF_wTPQstFWvm0IW6XsNxh9xEZOLDIoAxOgsT_7_hVbRILAvDg"
  }
}
```

#### Reviewed Meeting Handoff Contribution (`sync.reviewed-contribution.v1`)
```json
{
  "schema_id": "sync.reviewed-contribution.v1",
  "organization_id": "00000000-0000-4000-8000-000000000001",
  "actor_id": "usr_employee_01",
  "device_id": "dev_macbook_01",
  "profile_id": "prf_default_01",
  "contribution_id": "c0000000-0000-4000-8000-000000000002",
  "revision": 1,
  "kind": "meeting_handoff",
  "purpose": "handoff_coordination",
  "audience": {
    "audience_ids": [
      "aud_procurement_team"
    ]
  },
  "content": {
    "schema_id": "meeting.reviewed-handoff.v1",
    "proposal_id": "c0000000-0000-4000-8000-000000000002",
    "source_workflow_id": "wf_triage_meeting",
    "destination_workflow_id": "wf_po_reconciliation",
    "proposed_assignee_id": "usr_reviewer_02",
    "expected_downstream_state": "Invoice line variance verified against supplier agreement",
    "due_at": "2026-11-10T17:00:00Z",
    "time_zone": "America/New_York",
    "business_context": {
      "invoice_ref": "INV-2026-9921",
      "variance_amount": "1420.50",
      "priority_high": true
    },
    "sanitized_reviewed_excerpt": "Discussed PO line 4 variance with supplier; agreed to apply negotiated volume discount rebate."
  },
  "artifacts": [],
  "content_digest": "3e04980855e8eab4cc08c66fd53f484db5f4b149f87f6b2f8546470b28dc5443",
  "review_attestation": {
    "schema_id": "sync.review-attestation.v1",
    "key_id": "key_dev_01",
    "payload": {
      "review_receipt_id": "90000000-0000-4000-8000-000000000002",
      "organization_id": "00000000-0000-4000-8000-000000000001",
      "actor_id": "usr_employee_01",
      "device_id": "dev_macbook_01",
      "profile_id": "prf_default_01",
      "contribution_id": "c0000000-0000-4000-8000-000000000002",
      "revision": 1,
      "content_digest": "3e04980855e8eab4cc08c66fd53f484db5f4b149f87f6b2f8546470b28dc5443",
      "reviewed_at": "2026-11-09T20:05:00Z",
      "source_not_after": null,
      "policy_revision": "100",
      "artifact_policy_revision": null
    },
    "signature": "b9LiiC9z8xSMDqiu1kpfy2dcuUpUvpX8nd79FommquqANOWzsTO7F-tG8j37qk01BnDiftuIyA98mPoIgzuhDQ"
  }
}
```

#### Signed Release Permit (`sync.release-permit.v1`)
```json
{
  "schema_id": "sync.release-permit.v1",
  "key_id": "key_dev_01",
  "payload": {
    "attempt_id": "d0000000-0000-4000-8000-000000000001",
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "actor_id": "usr_employee_01",
    "device_id": "dev_macbook_01",
    "profile_id": "prf_default_01",
    "contribution_id": "c0000000-0000-4000-8000-000000000001",
    "revision": 1,
    "content_digest": "dc3679cef69b52542a84edbbadeeaa07a5fafe14c2bbddea5a48a21bf6c86f5a",
    "review_receipt_id": "90000000-0000-4000-8000-000000000001",
    "control_epoch": "e0000000-0000-4000-8000-000000000001",
    "control_sequence": "42",
    "policy_revision": "100",
    "access_revision": "200",
    "artifact_policy_revision": "art_pol_rev_05",
    "issued_at": "2026-11-09T20:00:10Z",
    "not_after": "2026-11-09T20:00:40Z"
  },
  "signature": "Xo_j9wPKjLdvriBIiLKdqlPVl67ZFmgN6vU1DraGi0n7DshueLnBcDT2GNmiJzpWzwzl-h_XnuX-49nJTj1UDQ"
}
```

#### Delivery Receipt (`sync.delivery-receipt.v1`)
```json
{
  "schema_id": "sync.delivery-receipt.v1",
  "key_id": "key_receipt_01",
  "payload": {
    "delivery_receipt_id": "b0000000-0000-4000-8000-000000000001",
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "contribution_id": "c0000000-0000-4000-8000-000000000001",
    "revision": 1,
    "content_digest": "dc3679cef69b52542a84edbbadeeaa07a5fafe14c2bbddea5a48a21bf6c86f5a",
    "kind": "workflow",
    "review_receipt_id": "90000000-0000-4000-8000-000000000001",
    "destination": "workflow_discovery",
    "accepted_at": "2026-11-09T20:00:12Z",
    "policy_revision": "100",
    "access_revision": "200",
    "domain_acceptance_id": "disc_acc_9901"
  },
  "signature": "XroNvAkLuEnuVx8cMmuEm-Vp9rrWZH6WKg2RaDgBMiaE58entILFBabF-2T3YQN0aH1ggS1EdSmDl3hU_gUYBQ"
}
```

#### Submission Status (`sync.submission-status.v1`)
```json
{
  "schema_id": "sync.submission-status.v1",
  "key_id": "key_policy_01",
  "payload": {
    "request_id": "f0000000-0000-4000-8000-000000000001",
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "contribution_id": "c0000000-0000-4000-8000-000000000001",
    "revision": 1,
    "content_digest": "dc3679cef69b52542a84edbbadeeaa07a5fafe14c2bbddea5a48a21bf6c86f5a",
    "disposition": "accepted",
    "delivery_receipt": {
      "schema_id": "sync.delivery-receipt.v1",
      "key_id": "key_receipt_01",
      "payload": {
        "delivery_receipt_id": "b0000000-0000-4000-8000-000000000001",
        "organization_id": "00000000-0000-4000-8000-000000000001",
        "contribution_id": "c0000000-0000-4000-8000-000000000001",
        "revision": 1,
        "content_digest": "dc3679cef69b52542a84edbbadeeaa07a5fafe14c2bbddea5a48a21bf6c86f5a",
        "kind": "workflow",
        "review_receipt_id": "90000000-0000-4000-8000-000000000001",
        "destination": "workflow_discovery",
        "accepted_at": "2026-11-09T20:00:12Z",
        "policy_revision": "100",
        "access_revision": "200",
        "domain_acceptance_id": "disc_acc_9901"
      },
      "signature": "XroNvAkLuEnuVx8cMmuEm-Vp9rrWZH6WKg2RaDgBMiaE58entILFBabF-2T3YQN0aH1ggS1EdSmDl3hU_gUYBQ"
    },
    "server_time": "2026-11-09T20:00:15Z",
    "issued_at": "2026-11-09T20:00:15Z",
    "not_after": "2026-11-09T20:01:15Z"
  },
  "signature": "1nOgGZooTURd1d92oGOL1-SP3dWSf3857O7fRy7uUMT8h4OvD2Jd4Fzks4PykagEuf8C4MpNfHAv0LvE7E-SDA"
}
```

#### Submission Closure Request (`sync.submission-closure-request.v1`)
```json
{
  "schema_id": "sync.submission-closure-request.v1",
  "request_id": "f0000000-0000-4000-8000-000000000002",
  "organization_id": "00000000-0000-4000-8000-000000000001",
  "contribution_id": "c0000000-0000-4000-8000-000000000001",
  "revision": 1,
  "expected_digest": "dc3679cef69b52542a84edbbadeeaa07a5fafe14c2bbddea5a48a21bf6c86f5a",
  "review_attestation": {
    "schema_id": "sync.review-attestation.v1",
    "key_id": "key_dev_01",
    "payload": {
      "review_receipt_id": "90000000-0000-4000-8000-000000000001",
      "organization_id": "00000000-0000-4000-8000-000000000001",
      "actor_id": "usr_employee_01",
      "device_id": "dev_macbook_01",
      "profile_id": "prf_default_01",
      "contribution_id": "c0000000-0000-4000-8000-000000000001",
      "revision": 1,
      "content_digest": "dc3679cef69b52542a84edbbadeeaa07a5fafe14c2bbddea5a48a21bf6c86f5a",
      "reviewed_at": "2026-11-09T20:00:00Z",
      "source_not_after": "2026-11-09T20:30:00Z",
      "policy_revision": "100",
      "artifact_policy_revision": "art_pol_rev_05"
    },
    "signature": "CVjAQ2TAehOJ-YpqlQ2fYOoA0EIFU0mP7ujKhF_wTPQstFWvm0IW6XsNxh9xEZOLDIoAxOgsT_7_hVbRILAvDg"
  },
  "action": "withdraw",
  "reason": "employee_withdrawal"
}
```

#### Signed Guidance Bundle Container (`sync.signed-guidance-bundle.v1`)
```json
{
  "schema_id": "sync.signed-guidance-bundle.v1",
  "bundle": {
    "bundle_id": "00000000-0000-4000-8000-000000000010",
    "bundle_revision": 1,
    "playbook_id": "pb_invoice_recon_v1",
    "workflow_id": "wf_po_reconciliation",
    "capability_id": "cap_financial_recon",
    "playbook_version": "sha256-7697c5f7a01890a2609560c49733cd1880809a00e48331030c2a777029fbb5a7",
    "objective": "Guide accounts payable staff through purchase order line matching.",
    "prerequisites": {
      "predicate": {
        "eq": {
          "field": "user_role",
          "value": "accounts_payable_clerk"
        }
      }
    },
    "expected_result": "All invoice lines reconciled with corresponding purchase order records.",
    "task_signature": {
      "entry_application_id": "app_erp_core",
      "entry_predicate": {
        "exists": {
          "field": "queue_active"
        }
      }
    },
    "steps": [
      {
        "step_id": "step_select_queue",
        "order": 1,
        "label": "Open Reconciliation Queue",
        "description": "Navigate to Financial Accounts and open Pending Invoices.",
        "target_key": "target_btn_queue",
        "application_profile_id": "prof_erp_web",
        "predicate": null,
        "timeout_ms": 45000,
        "assist_plan_ref": null,
        "rule_refs": [
          "rule_po_match_01"
        ],
        "source_refs": [
          "src_accounting_manual_v2"
        ],
        "allowed_targets": [
          {
            "application_profile_id": "prof_erp_web",
            "target_key": "target_btn_queue"
          }
        ]
      },
      {
        "step_id": "step_verify_po",
        "order": 2,
        "label": "Match Purchase Order",
        "description": "Enter the PO identifier into the match field and confirm unit counts.",
        "target_key": "target_input_po",
        "application_profile_id": "prof_erp_web",
        "predicate": {
          "eq": {
            "field": "batch_status",
            "value": "open"
          }
        },
        "timeout_ms": 60000,
        "assist_plan_ref": null,
        "rule_refs": [
          "rule_po_match_01"
        ],
        "source_refs": [
          "src_accounting_manual_v2"
        ],
        "allowed_targets": [
          {
            "application_profile_id": "prof_erp_web",
            "target_key": "target_input_po"
          }
        ]
      }
    ],
    "step_edges": [
      {
        "from_step_id": "step_select_queue",
        "to_step_id": "step_verify_po",
        "condition": null
      }
    ],
    "peer_fixes": [
      {
        "peer_fix_id": "fix_timeout_retry",
        "application_profile_id": "prof_erp_web",
        "profile_version": "2.4.0",
        "normalized_error_code": "ERR_ERP_SESSION_TIMEOUT",
        "state_predicate": null,
        "fix_playbook_version": "sha256-7697c5f7a01890a2609560c49733cd1880809a00e48331030c2a777029fbb5a7",
        "provenance": "peer_verified",
        "permitted_actions": "guidance"
      }
    ],
    "assist_plans": [],
    "record_independent": true,
    "applicable_profiles": [
      {
        "application_profile_id": "prof_erp_web",
        "min_version": "2.4.0",
        "max_version": null
      }
    ],
    "effective_rule_versions": [
      "rule_po_match_01"
    ],
    "audience": {
      "team_ids": [
        "team_accounts_payable"
      ],
      "role_tiers": [
        "tier_standard"
      ]
    },
    "published_at": "2026-11-09T18:00:00Z",
    "content_sha256": "780ea94e79bc83bd44ebe2bcc04f67b194c012161b797373668a89a9c67c4bec",
    "publisher_signature_ref": "00000000-0000-4000-8000-000000000020"
  },
  "publisher_signature": {
    "schema_id": "sync.publisher-signature.v1",
    "key_id": "key_publisher_01",
    "payload": {
      "organization_id": "00000000-0000-4000-8000-000000000001",
      "bundle_id": "00000000-0000-4000-8000-000000000010",
      "bundle_revision": 1,
      "content_sha256": "780ea94e79bc83bd44ebe2bcc04f67b194c012161b797373668a89a9c67c4bec",
      "playbook_version": "sha256-7697c5f7a01890a2609560c49733cd1880809a00e48331030c2a777029fbb5a7",
      "publisher_signature_ref": "00000000-0000-4000-8000-000000000020",
      "signed_at": "2026-11-09T18:00:00Z"
    },
    "signature": "buxAGs2d9WdpH0DZvRfHmNTdrMMMl8GF-3ViYA7tFjK_fxadDit_3D5UQmRqLm0coRGWLbD0KLYKjHj6VhYCDw"
  }
}
```

#### Signed Guidance Access Lease (`hud.guidance-access-lease.v1`)
```json
{
  "schema_id": "hud.guidance-access-lease.v1",
  "key_id": "key_policy_01",
  "payload": {
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "actor_id": "usr_employee_01",
    "device_id": "dev_macbook_01",
    "profile_id": "prf_default_01",
    "allowed_bundle_hashes": [
      "780ea94e79bc83bd44ebe2bcc04f67b194c012161b797373668a89a9c67c4bec"
    ],
    "policy_revision": "100",
    "access_revision": "200",
    "issued_at": "2026-11-09T20:00:00Z",
    "not_after": "2026-11-10T20:00:00Z",
    "read_only": true
  },
  "signature": "2Opurx3PwyqhwUEWsVUKziAiBS_HMvGp7iwigfzXI3_e6WyH-0RdCz9z-VkstR2-3i9_10H9sxrwBP9DH2S4DQ"
}
```

#### Guidance Manifest Page (`sync.guidance-manifest.v1`)
```json
{
  "schema_id": "sync.guidance-manifest.v1",
  "key_id": "key_policy_01",
  "payload": {
    "request_id": "f0000000-0000-4000-8000-000000000003",
    "snapshot_id": "e0000000-0000-4000-8000-000000000010",
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "actor_id": "usr_employee_01",
    "device_id": "dev_macbook_01",
    "profile_id": "prf_default_01",
    "manifest_revision": "1",
    "control_epoch": "e0000000-0000-4000-8000-000000000001",
    "control_sequence": "42",
    "access_revision": "200",
    "page_index": 0,
    "base_cursor": null,
    "next_cursor": null,
    "complete": true,
    "upserts": [
      {
        "bundle_id": "00000000-0000-4000-8000-000000000010",
        "bundle_revision": 1,
        "content_sha256": "780ea94e79bc83bd44ebe2bcc04f67b194c012161b797373668a89a9c67c4bec",
        "playbook_id": "pb_invoice_recon_v1",
        "playbook_version": "sha256-7697c5f7a01890a2609560c49733cd1880809a00e48331030c2a777029fbb5a7",
        "byte_length": 3353,
        "published_at": "2026-11-09T18:00:00Z"
      }
    ],
    "tombstones": [],
    "server_time": "2026-11-09T20:00:00Z",
    "issued_at": "2026-11-09T20:00:00Z",
    "not_after": "2026-11-09T20:01:00Z"
  },
  "signature": "4pU52HQJrLk9Y2QwiWgZmerf2HYz7RO0_j4x3w7Pgpb9v2H57N4TzUBroL8SAneQdfdv54hP3k-49gH6QsvbDA"
}
```

#### Sync Control Snapshot (`sync.control-snapshot.v1`)
```json
{
  "schema_id": "sync.control-snapshot.v1",
  "key_id": "key_policy_01",
  "payload": {
    "snapshot_id": "e0000000-0000-4000-8000-000000000010",
    "page_index": 0,
    "next_cursor": null,
    "complete": true,
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "actor_id": "usr_employee_01",
    "device_id": "dev_macbook_01",
    "profile_id": "prf_default_01",
    "control_epoch": "e0000000-0000-4000-8000-000000000001",
    "control_sequence": "42",
    "policy_revision": "100",
    "guidance_policy_revision": "100",
    "access_revision": "200",
    "capture_policy_revision": "cap_pol_rev_12",
    "sharing_allowed": true,
    "purpose_grants": [
      {
        "purpose": "workflow_sharing",
        "audience": "aud_finance_ops"
      }
    ],
    "revoked_contribution_ids": [],
    "revoked_bundle_hashes": [],
    "revoked_key_ids": [],
    "review_keys": [
      {
        "key_id": "key_dev_01",
        "public_key": "AIoCVTdr59W0XbpaOLUKVIG2JsuMhvooms7AgJyPI78",
        "actor_id": "usr_employee_01",
        "device_id": "dev_macbook_01",
        "profile_id": "prf_default_01",
        "registered_at": "2026-11-01T00:00:00Z",
        "status": "active"
      }
    ],
    "server_time": "2026-11-09T20:00:00Z",
    "issued_at": "2026-11-09T20:00:00Z",
    "not_after": "2026-11-09T20:01:00Z"
  },
  "signature": "96BrP4QXZdO2rnoP499vsqbesb-Wjtw_tKxoLdu1ds2Z6hwdamcdBByYyLLfa8GZXXuD3X9YGBEfVvJWoYqsCQ"
}
```

## Trust and deployment boundaries

### Process and Supervision Architecture
- **Process Model:** `oryn-sync-helper` runs locally on employee endpoints as a dedicated, unprivileged native child process supervised by [desktop-shell](desktop-shell.md).
- **Process Isolation:** The helper is sandboxed using native OS primitives (macOS `sandbox-exec` / App Sandbox, Windows Job Objects with restricted tokens). It possesses zero filesystem access outside its profile-scoped directory, cannot bind local network ports, and communicates exclusively over inherited anonymous pipes/socketpairs.
- **Inherited IPC Rails:**
  - `shell-sync.v1` (major 1, minor 1): Bidirectional channels between Desktop Shell and Sync Helper (Control/Status and Bulk Data Relay), negotiating capability `central_notifications_v1` for desktop notification routing and delivery receipts.
  - `privacy-sync.v1` (major 1, minor 0): Two bidirectional channels directly linking `oryn-privacy-helper` and `oryn-sync-helper` (Control and Payload Chunks).
- **Credential Separation:** The sync helper never receives private evidence encryption keys, master disk passwords, refresh tokens, or raw capture buffers. It receives only short-lived, audience-bound access tokens from `SessionBroker`.
- **Transport Security:** All cloud communication uses TLS 1.3 with strict SPKI certificate pinning. Unpinned interception fails closed with `SYNC_TLS_TRUST_FAILED`. No trust-on-first-use (TOFU) or insecure bypass flags exist.

## Internal architecture

### Execution Model and Threading
The helper operates a deterministic single-threaded state machine core alongside an asynchronous I/O runtime (Tokio) and a dedicated blocking worker pool:
- **State Reducer:** `reduce_sync(state: SyncState, input: SyncInput, now: MonotonicInstant) -> SyncTransition`. All protocol decisions, transitions, and timers are purely functional and deterministic.
- **Network Task:** One serial upload worker, at most two bundle download workers, and dual independent long-polling workers:
  - *Sync Control Change Feed:* Bounded 25-second long poll against `/v1/sync/changes` using tokens scoped to `audience: "sync"`.
  - *Central Notification Feed:* Bounded 25-second long poll against `/v1/notifications` negotiating `central_notifications_v1` and using child tokens strictly scoped to `audience: "notifications"`. Notifications are immediately forwarded to Desktop Shell for presentation, and `NotificationDeliveryReceiptV1` outcomes (`presented`, `suppressed`, `unavailable`) are reported back.
- **Storage/Crypto Worker:** Bounded thread pool handling AES-256-GCM chunk encryption and SQLCipher 4 database writes.

### Logical Submodules
1. **Custody & Privacy Gateway:** Implements `privacy-sync.v1`. Negotiates queue slot reservations, receives payload base64url chunks, validates total byte lengths, and signals committal receipts. Manages the dispatch linearization point in lockstep with the privacy helper's release fences.
2. **Offline Queue Manager:** Manages the encrypted offline queue in `sync-state.db`. Handles attempt sequencing, exponential full-jitter retries, quarantine isolation, and source expiration drops.
3. **HTTP/REST Transport Client:** Manages TLS 1.3 connections, SPKI pin verification, authentication header attachment, multipart/form-data encoding, and status-first recovery routines.
4. **Guidance Sync & Working Set Cache:** Evaluates access-filtered manifest deltas, prioritizes candidate working sets, downloads immutable bundles, verifies publisher signatures, and coordinates two-phase generation swaps with HUD.
5. **Keyset & Keystore Engine:** Verifies Ed25519 signatures across trust keysets, review attestations, release permits, access leases, and receipts using RFC 8785 canonical JSON bytes.
6. **Vault Anchoring & Crypto Erasure:** Maintains encrypted blob keys and catalog generation counters anchored in the OS credential vault (macOS Keychain `com.oryn.sync.catalog`, Windows Credential Manager).

## State and lifecycle

### Local Encrypted Storage Schema (SQLite / SQLCipher 4 in `sync-state.db`)

```sql
CREATE TABLE queue_entries (
    contribution_id TEXT NOT NULL,
    revision INTEGER NOT NULL,
    content_digest TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('workflow', 'meeting_handoff', 'reviewed_correction')),
    review_receipt_id TEXT NOT NULL,
    custody_mode TEXT NOT NULL CHECK(custody_mode IN ('durable', 'volatile')),
    payload_blob_id TEXT,
    byte_length INTEGER NOT NULL,
    source_not_after TEXT,
    state TEXT NOT NULL CHECK(state IN ('receiving', 'queued', 'dispatching', 'delivery_unknown', 'delivered', 'cancelled', 'quarantined', 'retry_paused')),
    active_attempt_id TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at_utc TEXT,
    last_error_code TEXT,
    accepted_receipt_id TEXT,
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL,
    PRIMARY KEY (contribution_id, revision)
);

CREATE INDEX idx_queue_schedule ON queue_entries(state, next_attempt_at_utc);
CREATE INDEX idx_queue_expiry ON queue_entries(source_not_after);

CREATE TABLE delivery_attempts (
    attempt_id TEXT PRIMARY KEY,
    contribution_id TEXT NOT NULL,
    revision INTEGER NOT NULL,
    content_digest TEXT NOT NULL,
    control_epoch TEXT NOT NULL,
    control_sequence TEXT NOT NULL,
    dispatched_at_utc TEXT NOT NULL,
    terminal_state TEXT CHECK(terminal_state IN ('succeeded', 'failed', 'cancelled', 'unknown')),
    status_code INTEGER,
    error_code TEXT,
    FOREIGN KEY(contribution_id, revision) REFERENCES queue_entries(contribution_id, revision) ON DELETE CASCADE
);

CREATE TABLE delivery_receipts (
    delivery_receipt_id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    contribution_id TEXT NOT NULL,
    revision INTEGER NOT NULL,
    content_digest TEXT NOT NULL,
    receipt_bytes BLOB NOT NULL,
    local_privacy_ack BOOLEAN NOT NULL DEFAULT 0,
    received_at_utc TEXT NOT NULL
);

CREATE TABLE guidance_objects (
    content_sha256 TEXT PRIMARY KEY,
    bundle_id TEXT NOT NULL,
    bundle_revision INTEGER NOT NULL,
    playbook_id TEXT NOT NULL,
    playbook_version TEXT NOT NULL,
    publisher_signature_bytes BLOB NOT NULL,
    encrypted_blob_id TEXT NOT NULL,
    byte_length INTEGER NOT NULL,
    access_revision TEXT NOT NULL,
    last_local_use_utc TEXT NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT 0
);

CREATE INDEX idx_guidance_playbook ON guidance_objects(playbook_id, bundle_revision);

CREATE TABLE guidance_generations (
    generation_id TEXT PRIMARY KEY,
    manifest_sha256 TEXT NOT NULL,
    control_epoch TEXT NOT NULL,
    control_sequence TEXT NOT NULL,
    access_revision TEXT NOT NULL,
    object_hashes TEXT NOT NULL, -- JSON array of Sha256
    state TEXT NOT NULL CHECK(state IN ('staging', 'prepared', 'active', 'invalidated')),
    created_at_utc TEXT NOT NULL,
    activated_at_utc TEXT
);

CREATE TABLE sync_cursors (
    singleton_id INTEGER PRIMARY KEY CHECK(singleton_id = 1),
    session_epoch TEXT NOT NULL,
    control_epoch TEXT NOT NULL,
    control_sequence TEXT NOT NULL,
    control_cursor TEXT,
    manifest_cursor TEXT,
    manifest_revision TEXT NOT NULL,
    trusted_time_high_water TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL
);
```

### PostgreSQL Domain Acceptance Schema (Control Plane)

```sql
CREATE TABLE sync_submission_identity (
    organization_id UUID NOT NULL,
    contribution_id UUID NOT NULL,
    revision NUMERIC(20,0) NOT NULL CHECK(revision >= 0),
    content_digest TEXT NOT NULL CHECK(length(content_digest) = 64),
    disposition TEXT NOT NULL CHECK(disposition IN ('accepted', 'withdrawn', 'expired')),
    PRIMARY KEY (organization_id, contribution_id, revision)
);

CREATE TABLE discovery_contribution_intake (
    organization_id UUID NOT NULL,
    contribution_id UUID NOT NULL,
    revision NUMERIC(20,0) NOT NULL,
    actor_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    purpose TEXT NOT NULL,
    audience_ids TEXT[] NOT NULL,
    canonical_payload BYTEA NOT NULL,
    eligibility_generation BIGINT NOT NULL DEFAULT 1,
    is_excluded BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (organization_id, contribution_id, revision),
    FOREIGN KEY (organization_id, contribution_id, revision) REFERENCES sync_submission_identity(organization_id, contribution_id, revision)
);

CREATE TABLE graph_handoff_intake (
    organization_id UUID NOT NULL,
    proposal_id UUID NOT NULL,
    revision NUMERIC(20,0) NOT NULL,
    destination_workflow_id TEXT NOT NULL,
    canonical_payload BYTEA NOT NULL,
    recipient_state TEXT NOT NULL DEFAULT 'proposed' CHECK(recipient_state IN ('proposed', 'accepted', 'rejected', 'cancelled')),
    accepted_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (organization_id, proposal_id, revision),
    FOREIGN KEY (organization_id, proposal_id, revision) REFERENCES sync_submission_identity(organization_id, proposal_id, revision)
);

CREATE TABLE sync_artifact (
    organization_id UUID NOT NULL,
    artifact_id UUID NOT NULL,
    contribution_id UUID NOT NULL,
    revision NUMERIC(20,0) NOT NULL,
    sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
    width INTEGER NOT NULL CHECK(width BETWEEN 1 AND 1920),
    height INTEGER NOT NULL CHECK(height BETWEEN 1 AND 1080),
    byte_length INTEGER NOT NULL CHECK(byte_length BETWEEN 1 AND 1048576),
    artifact_policy_revision TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    image_bytes BYTEA NOT NULL,
    PRIMARY KEY (organization_id, artifact_id),
    FOREIGN KEY (organization_id, contribution_id, revision) REFERENCES sync_submission_identity(organization_id, contribution_id, revision)
);

CREATE TABLE sync_delivery_receipt (
    organization_id UUID NOT NULL,
    delivery_receipt_id UUID NOT NULL,
    contribution_id UUID NOT NULL,
    revision NUMERIC(20,0) NOT NULL,
    content_digest TEXT NOT NULL,
    signed_receipt_bytes BYTEA NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (organization_id, delivery_receipt_id),
    FOREIGN KEY (organization_id, contribution_id, revision) REFERENCES sync_submission_identity(organization_id, contribution_id, revision)
);

CREATE TABLE domain_outbox (
    organization_id UUID NOT NULL,
    event_id UUID NOT NULL,
    topic TEXT NOT NULL,
    payload BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    published_at TIMESTAMPTZ,
    PRIMARY KEY (organization_id, event_id)
);

CREATE TABLE domain_inbox (
    organization_id UUID NOT NULL,
    event_id UUID NOT NULL,
    consumer TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (organization_id, event_id, consumer)
);
```

### PostgreSQL Atomic Acceptance Algorithm
1. **Pre-Admission Validation:** The HTTP gateway validates TLS client tokens (`sync:contribute`), message schema structure, cryptographic review signatures, release permit validity, and artifact PNG headers. Max total multipart body 5 MiB; max four 8-bit PNGs, each ≤ 1 MiB and ≤ 1920×1080; bounded decode and IHDR/IDAT/IEND-only chunks. Handoffs have empty artifacts and no private meeting identifiers.
2. **Deterministic Locking Sequence (READ COMMITTED):**
   - Begin `READ COMMITTED` transaction.
   - Acquire `SELECT ... FOR SHARE` locks in established sorted `(organization_id, guard_kind, guard_id)` order on authority guards and recheck current authority.
3. **Identity Insertion:**
   - Insert minimal accepted identity using `INSERT INTO sync_submission_identity (organization_id, contribution_id, revision, content_digest, disposition) VALUES ($1, $2, $3, $4, 'accepted') ON CONFLICT DO NOTHING RETURNING ...`. Record whether this transaction inserted the row.
   - Lock canonical row `FOR UPDATE`. Unique insertion waits serialize missing-row races; no visible reservation disposition or duplicate insertion.
4. **Idempotency and Conflict Evaluation:**
   - If row exists with terminal disposition (`withdrawn` or `expired`), return 410 `SYNC_RELEASE_CANCELLED`.
   - If row exists with differing digest, return 409 `SYNC_DIGEST_CONFLICT`.
   - If row exists with matching accepted identity and retained receipt, return 200 OK with original receipt (validating current caller access before replay).
5. **Atomic Intake Commit:**
   - For newly inserted identity only: insert destination intake rows (`discovery_contribution_intake`, `graph_handoff_intake`, or `incident_correction_intake`), image rows into `sync_artifact` (empty for reviewed corrections), original signed receipt, audit entries, committed event into `domain_outbox`, and minimal recovery-journal outbox entry in this single transaction. Commit transaction.
   - Return first-acceptance HTTP 201 only after commit and independent custody checkpoint.
6. **Receipt Signing:** Construct and sign `DeliveryReceiptV1` via Vault Transit receipt-purpose signing port under 500 ms timeout. Key is not exported. Failure before commit rolls back entire transaction.
7. **Durability Checkpoint:** Append minimal 5-field custody projection to independent recovery journal after commit. No SQL transaction remains open during independent append. Checkpoint failure returns explicitly unknown/reconcile status; consumers cannot process intake behind a pending custody durability guard.
8. **Truthful Replay & Reconciliation:** On exact replay, pending checkpoint reconciles idempotently before releasing durable receipt. Downstream synthesis re-verifies live eligibility under lock. If intake was pruned or lost after restore, return 200 `SubmissionStatusV1` with `content_state: 'lost_after_restore'` and nullable receipt.

### State Machines

#### Connection State Machine
`signed_out` → `authenticating` → `reconciling` → `ready` ↔ `offline`  
Additional states: `reauth_required`, `network_blocked`, `degraded`.

#### Queue State Machine
`receiving` → `queued` → `dispatching` → `delivered`  
Alternative transitions: `cancelled`, `quarantined`, `retry_paused`, `delivery_unknown`.

#### Withdrawal State Machine
`none` → `withdrawal_requested` → `withdrawn`  
Alternative outcomes: `review_required` (for published derivatives), `retained_under_policy`, `rejected`.

### Reconnection Sequence
1. **Session & TLS Establishment:** Re-establish network connectivity, validate server certificate against pinned SPKI hashes, and refresh short-lived SessionBroker tokens.
2. **Authoritative Barrier Retrieval:** Fetch `SyncControlSnapshotV1` via `POST /v1/sync/bootstrap`, refreshing trust keysets, sharing policies, and review-key registries.
3. **Control Delivery & Local Restriction:** Propagate capture restrictions to IdentityPort/privacy; deliver sharing cancellations to privacy helper and local queue; evict revoked playbooks from cache. Wait for bounded acknowledgments (500 ms) before opening barrier.
4. **Status Reconciliation:** Reconcile pending ambiguous attempts (`delivery_unknown`) via status queries; submit metadata-only withdrawal tombstones. Never fetch deleted sources.
5. **Guidance Working Set Refresh:** Query manifest deltas, fetch missing immutable bundles, verify publisher signatures, and atomically activate prepared generations in HUD.
6. **Outgoing Release Dispatch:** Release remaining authorized queued submissions by requesting fresh short-lived release permits from the privacy helper.

### Normative State Transition Cases (`sync.transition-cases.v1`)
```json
{
  "schema_id": "sync.transition-cases.v1",
  "cases": [
    {
      "case_id": "tc_pre_dispatch_cancellation",
      "initial_state": "queued",
      "event": "cancel_release",
      "conditions": {
        "fence_active": false,
        "source_valid": false,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": true,
        "natural_expiry": false,
        "server_accepted_before_expiry": null,
        "server_identity_exists": null,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "cancelled",
      "effects": [
        "purge_source",
        "drop_payload"
      ],
      "criterion": [
        "ORY-007",
        "ORY-010"
      ]
    },
    {
      "case_id": "tc_dispatch_explicit_deletion",
      "initial_state": "dispatching",
      "event": "source_deleted",
      "conditions": {
        "fence_active": false,
        "source_valid": false,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": true,
        "natural_expiry": false,
        "server_accepted_before_expiry": false,
        "server_identity_exists": false,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "delivery_unknown",
      "effects": [
        "purge_source",
        "drop_payload",
        "query_status",
        "submit_withdrawal"
      ],
      "criterion": [
        "ORY-007",
        "ORY-010"
      ]
    },
    {
      "case_id": "tc_pre_expiry_server_acceptance",
      "initial_state": "dispatching",
      "event": "source_expired",
      "conditions": {
        "fence_active": false,
        "source_valid": false,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": true,
        "server_accepted_before_expiry": true,
        "server_identity_exists": true,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "delivered",
      "effects": [
        "drop_payload"
      ],
      "criterion": [
        "ORY-007",
        "ORY-010"
      ]
    },
    {
      "case_id": "tc_natural_expiry_unaccepted",
      "initial_state": "queued",
      "event": "source_expired",
      "conditions": {
        "fence_active": false,
        "source_valid": false,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": true,
        "server_accepted_before_expiry": false,
        "server_identity_exists": false,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "cancelled",
      "effects": [
        "drop_payload",
        "close_unaccepted"
      ],
      "criterion": [
        "ORY-007",
        "ORY-010"
      ]
    },
    {
      "case_id": "tc_volatile_mode_expiry",
      "initial_state": "queued",
      "event": "source_expired",
      "conditions": {
        "fence_active": false,
        "source_valid": false,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": true,
        "server_accepted_before_expiry": false,
        "server_identity_exists": false,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "cancelled",
      "effects": [
        "drop_payload"
      ],
      "criterion": [
        "ORY-007",
        "ORY-010"
      ]
    },
    {
      "case_id": "tc_server_accept_first_time",
      "initial_state": "receiving",
      "event": "post_submission",
      "conditions": {
        "fence_active": true,
        "source_valid": true,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": false,
        "server_accepted_before_expiry": true,
        "server_identity_exists": false,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "accepted",
      "effects": [
        "accept_once"
      ],
      "criterion": [
        "ORY-007",
        "ORY-012"
      ]
    },
    {
      "case_id": "tc_server_exact_replay",
      "initial_state": "receiving",
      "event": "replay_submission",
      "conditions": {
        "fence_active": true,
        "source_valid": true,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": false,
        "server_accepted_before_expiry": true,
        "server_identity_exists": true,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "accepted",
      "effects": [
        "return_original_receipt"
      ],
      "criterion": [
        "ORY-007",
        "ORY-012"
      ]
    },
    {
      "case_id": "tc_server_altered_digest_conflict",
      "initial_state": "receiving",
      "event": "replay_submission_mismatch",
      "conditions": {
        "fence_active": true,
        "source_valid": true,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": false,
        "server_accepted_before_expiry": true,
        "server_identity_exists": true,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "quarantined",
      "effects": [
        "deny"
      ],
      "criterion": [
        "ORY-007"
      ]
    },
    {
      "case_id": "tc_withdrawal_before_upload",
      "initial_state": "receiving",
      "event": "post_submission_withdrawn",
      "conditions": {
        "fence_active": false,
        "source_valid": false,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": true,
        "natural_expiry": false,
        "server_accepted_before_expiry": false,
        "server_identity_exists": true,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "withdrawn",
      "effects": [
        "deny"
      ],
      "criterion": [
        "ORY-010"
      ]
    },
    {
      "case_id": "tc_accepted_unpublished_withdrawal",
      "initial_state": "accepted",
      "event": "submit_withdrawal",
      "conditions": {
        "fence_active": false,
        "source_valid": false,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": true,
        "natural_expiry": false,
        "server_accepted_before_expiry": true,
        "server_identity_exists": true,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "withdrawn",
      "effects": [
        "recompute_draft",
        "block_publication"
      ],
      "criterion": [
        "ORY-010",
        "ORY-011"
      ]
    },
    {
      "case_id": "tc_published_derivative_withdrawal",
      "initial_state": "published",
      "event": "submit_withdrawal",
      "conditions": {
        "fence_active": false,
        "source_valid": false,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": true,
        "natural_expiry": false,
        "server_accepted_before_expiry": true,
        "server_identity_exists": true,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": true
      },
      "expected_state": "review_required",
      "effects": [
        "deny"
      ],
      "criterion": [
        "ORY-010",
        "ORY-014"
      ]
    },
    {
      "case_id": "tc_pruned_ownership_ledger_access",
      "initial_state": "pruned",
      "event": "get_submission_status",
      "conditions": {
        "fence_active": false,
        "source_valid": false,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": false,
        "server_accepted_before_expiry": true,
        "server_identity_exists": true,
        "generation_complete": null,
        "lease_valid": null,
        "hash_revoked": null,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": false
      },
      "expected_state": "denied",
      "effects": [
        "deny"
      ],
      "criterion": [
        "ORY-010"
      ]
    },
    {
      "case_id": "tc_guidance_activate_generation",
      "initial_state": "staged",
      "event": "commit_guidance_generation",
      "conditions": {
        "fence_active": null,
        "source_valid": null,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": false,
        "server_accepted_before_expiry": null,
        "server_identity_exists": null,
        "generation_complete": true,
        "lease_valid": true,
        "hash_revoked": false,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": null
      },
      "expected_state": "active",
      "effects": [
        "activate_generation"
      ],
      "criterion": [
        "ORY-068",
        "ORY-069"
      ]
    },
    {
      "case_id": "tc_guidance_generation_incomplete",
      "initial_state": "staged",
      "event": "commit_guidance_generation",
      "conditions": {
        "fence_active": null,
        "source_valid": null,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": false,
        "server_accepted_before_expiry": null,
        "server_identity_exists": null,
        "generation_complete": false,
        "lease_valid": true,
        "hash_revoked": false,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": null
      },
      "expected_state": "staged",
      "effects": [
        "deny"
      ],
      "criterion": [
        "ORY-068",
        "ORY-069"
      ]
    },
    {
      "case_id": "tc_guidance_generation_revoked_hash",
      "initial_state": "staged",
      "event": "commit_guidance_generation",
      "conditions": {
        "fence_active": null,
        "source_valid": null,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": false,
        "server_accepted_before_expiry": null,
        "server_identity_exists": null,
        "generation_complete": true,
        "lease_valid": true,
        "hash_revoked": true,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": null
      },
      "expected_state": "invalidated",
      "effects": [
        "hide_guidance",
        "deny"
      ],
      "criterion": [
        "ORY-068",
        "ORY-070"
      ]
    },
    {
      "case_id": "tc_guidance_routine_update_pinned",
      "initial_state": "active",
      "event": "stage_newer_bundle",
      "conditions": {
        "fence_active": null,
        "source_valid": null,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": false,
        "server_accepted_before_expiry": null,
        "server_identity_exists": null,
        "generation_complete": true,
        "lease_valid": true,
        "hash_revoked": false,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": null
      },
      "expected_state": "active",
      "effects": [
        "prepare_generation"
      ],
      "criterion": [
        "ORY-068",
        "ORY-069"
      ]
    },
    {
      "case_id": "tc_guidance_conflict_revocation",
      "initial_state": "active",
      "event": "bundle_conflict_received",
      "conditions": {
        "fence_active": null,
        "source_valid": null,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": false,
        "server_accepted_before_expiry": null,
        "server_identity_exists": null,
        "generation_complete": true,
        "lease_valid": true,
        "hash_revoked": true,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": null
      },
      "expected_state": "invalidated",
      "effects": [
        "hide_guidance"
      ],
      "criterion": [
        "ORY-068",
        "ORY-070"
      ]
    },
    {
      "case_id": "tc_capture_only_revocation_guidance_unaffected",
      "initial_state": "active",
      "event": "capture_consent_revoked",
      "conditions": {
        "fence_active": false,
        "source_valid": false,
        "policy_fresh": true,
        "member_authorized": true,
        "explicit_withdrawal": false,
        "natural_expiry": false,
        "server_accepted_before_expiry": null,
        "server_identity_exists": null,
        "generation_complete": true,
        "lease_valid": true,
        "hash_revoked": false,
        "current_epoch_matches": true,
        "signature_valid": true,
        "ownership_record_available": null
      },
      "expected_state": "active",
      "effects": [
        "purge_source"
      ],
      "criterion": [
        "ORY-005",
        "ORY-068"
      ]
    }
  ]
}
```

## Observability and audit

### Telemetry Metrics
- **Success & Failure Counts:** Aggregated counters for submissions, delta manifest synchronizations, bundle downloads, lease grants, and closures.
- **Latency & Size Buckets:** Exponential histograms tracking upload latencies (100 ms to 30 s), payload byte lengths (1 KiB to 5 MiB), and long-poll durations.
- **Queue & Cache Health:** Gauges for active queued submissions, reserved byte capacity, guidance cache occupancy, and quarantine counts.

### Privacy Safeguards
- Operational logs strictly exclude application names, step instructions, employee comments, image bytes, private evidence IDs, and raw timestamps implying work activity.
- Diagnostic bundles contain only structured error codes, schema versions, and content-free state summaries. Export requires explicit employee confirmation.

## Security and threat model

### Threat Scenarios and Mitigations
1. **Review Envelope Forgery:** Attacker attempts to forge employee approval. *Mitigation:* Cryptographic Ed25519 signatures over RFC 8785 canonical bytes using keys enrolled strictly via privacy helper proof-of-possession challenges.
2. **Stolen or Rotated Device Keys:** Attacker uses compromised device key. *Mitigation:* Keyset revocation in `SyncControlSnapshotV1` immediately invalidates pending reviews; fresh employee review is required on a trusted key.
3. **Source Deletion / Dispatch Race:** Employee purges local capture while upload is in-flight. *Mitigation:* Privacy helper cancels the release fence and marks delivery projection `delivery_unknown`; local purge completes immediately; sync helper reconciles status and issues withdrawal without replaying source bytes.
4. **Concurrent Acceptance / Withdrawal Race:** Upload and withdrawal race at the server. *Mitigation:* Deterministic `SELECT ... FOR UPDATE` serialization on `sync_submission_identity`. Tombstones win and exclude unpublished use.
5. **Lost Network Acknowledgment:** Server accepts contribution but client disconnects before receiving receipt. *Mitigation:* Client performs status lookup first upon reconnecting; server returns the original signed receipt idempotently.
6. **Control Cursor Gaps & Rollback:** Network adversary drops restriction pages or replays old snapshots. *Mitigation:* Monotonic control sequences, signed cursor boundaries, contiguous page index enforcement, and high-water mark validation anchored in the OS credential vault.
7. **Multipart & PNG Decompression Bombs:** Malicious or malformed image payload intended to exhaust server memory. *Mitigation:* Strict 1 MiB byte cap, 1920x1080 dimension cap, chunk validation (only IHDR, IDAT, IEND), decompression allocation limits, and streaming length verification.
8. **Storage Quota Abuse:** Rogue process attempts to exhaust endpoint disk. *Mitigation:* Strict 256 MiB offline queue cap, 256 MiB guidance cap, 1 GiB host free-space floor, and reservation-first admission.

## Test strategy

### Acceptance Criteria Tracing and Verification Scenarios

- **Scenario 1: Offline Review and Reconnection Release (ORY-007, ORY-012)**
  - *Input:* Employee approves a sanitized invoice reconciliation workflow with one redacted PNG screenshot while offline. Connectivity is restored after 1 hour.
  - *Expected Result:* Gateway validates the review attestation, processes control snapshot restrictions first, acquires a fresh release permit, transmits multipart payload to `/v1/sync/submissions`, commits domain intake atomically, and receives `DeliveryReceiptV1`.
- **Scenario 2: Source Deletion During Active Dispatch (ORY-010)**
  - *Input:* Employee triggers selective purge of private evidence while an approved contribution upload is crossing the network wire.
  - *Expected Result:* Privacy helper cancels the release fence and marks projection `delivery_unknown`. Local evidence is erased immediately. Sync helper finishes network cycle, performs status lookup, and sends metadata-only withdrawal tombstone. Zero source bytes are re-uploaded.
- **Scenario 3: Unpublished Contribution Withdrawal (ORY-010, ORY-011)**
  - *Input:* Employee clicks withdraw on an accepted workflow contribution before it is synthesized into a candidate playbook.
  - *Expected Result:* Server commits withdrawal in `sync_submission_identity`, excludes the intake row from discovery clustering, and marks dependent draft proposals `needs_recomputation`.
- **Scenario 4: Governed Removal Review for Published Derivatives (ORY-010, ORY-014)**
  - *Input:* Employee requests withdrawal of a contribution that has already been incorporated into an approved published playbook.
  - *Expected Result:* Status returns `review_required`. Procedure remains published pending Workflow Owner review; legal holds do not allow continued synthesis from the withdrawn submission.
- **Scenario 5: Offline Guidance Reading and Blocked Execution (ORY-068)**
  - *Input:* Workstation operates offline with an active signed guidance lease valid for 24 hours. Employee reads cached playbooks and attempts to trigger an assisted action.
  - *Expected Result:* HUD displays cached playbook guidance normally. Action execution button is disabled with explicit message stating action execution requires online authorization.
- **Scenario 6: Conflict Revocation of Active Guidance (ORY-070)**
  - *Input:* Gateway receives a guidance manifest delta containing a tombstone with `reason = "conflict"` for the currently active playbook.
  - *Expected Result:* Gateway immediately issues `InvalidateGuidance` over Contract 20. HUD clears presentation highlights and closes the active guide session.
- **Scenario 7: Retention-Off Screen Contribution Online-Only Dispatch (ORY-005, ORY-007)**
  - *Input:* Employee with `personal_history_retention=false` approves a screen workflow demonstration while offline.
  - *Expected Result:* Approval fails admission to offline queue (`SYNC_QUEUE_FULL` / volatile custody restriction); payload is held in volatile memory bounded by 30-second TTL and purged upon expiration without disk committal.
- **Scenario 8: Queue Capacity Rejection (ORY-018)**
  - *Input:* Offline queue contains 1,024 submissions totaling 256 MiB. Employee approves an additional contribution.
  - *Expected Result:* `ReserveQueueSlot` rejects with `SYNC_QUEUE_FULL`. Desktop shell alerts employee that offline storage capacity is full without dropping previously queued items.

## Performance and operations

### Resource Budgets (Unmeasured Engineering Certification Targets)
- **Idle Memory:** Resident Set Size (RSS) <= 16 MiB.
- **Active Memory:** Resident Set Size (RSS) <= 64 MiB during 5 MiB multipart upload or concurrent bundle downloads.
- **Idle CPU:** <= 0.1% of one logical CPU core.
- **Active CPU:** <= 5% of one logical CPU core during cryptographic hashing and SQLCipher transactions.

### Network Timing and Retry Schedule
- **Upload Timeout:** 30 seconds total, bounded by permit and source deadlines. Connect timeout: 5 seconds.
- **Bundle Download Timeout:** 10 seconds per bundle (max 1 MiB).
- **Long-Poll Wait:** 25 seconds wait on server, 30-second HTTP request timeout.
- **Backoff Algorithm:** Full jitter exponential backoff: `t = uniform(0, min(300s, 1s * 2^attempt))`.
- **Retry Ceilings:** Max 8 consecutive payload retries before transitioning to `retry_paused`.

### Disaster Recovery and Certified Storage Prerequisite
- Cloud primary storage, write-ahead logs (WAL), read replicas, and backup archives must certify compliance with the signed artifact policy's maximum lifetime (<= 365 days).
- Issuance of artifact policies is blocked by `identity-policy` unless cloud infrastructure certification is active.
- Database restore procedures filter expired and revoked artifacts before serving any read traffic.

## Architecture decisions and open questions

### Resolved Architecture Decisions
1. **Sync Transport Protocol:** Resolved HTTPS request/response APIs and bounded long polling (25-second wait) over TLS 1.3, replacing complex gRPC streaming. Simplifies proxy traversal, reduces idle connection overhead, and leverages standard HTTP caching semantics.
2. **Contribution Deduplication:** Resolved relational idempotency scoped to `(organization_id, contribution_id, revision)`. Exact replay returns the original committed `DeliveryReceiptV1`. Distinct employee demonstrations remain distinct records to allow discovery clustering and graph duplicate resolution.
3. **Offline Queue Persistence:** Resolved SQLCipher 4 encrypted database (`sync-state.db`) with per-blob AES-256-GCM chunked payload files, anchored to generation credentials in the OS credential vault.
4. **Delta Synchronization Algorithm:** Resolved access-filtered manifest change pages combined with complete immutable bundle downloads. Eliminates fragile binary patching while maintaining minimal network bandwidth.

### Mandatory Handoff Answers ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Transport queueing, review attestation verification, network transmission, delivery receipts, local minimal replay ledger, and durable guidance caching.
2. *Data ingress/egress:* Ingests employee-reviewed contributions and published playbooks; outputs validated contributions and receipt status to the control plane.
3. *Versions/identities:* Organization UUID, actor ID, device ID, profile ID, contribution UUIDv4, revision u64, content digest SHA-256, and playbook version string.
4. *Upstream failure:* If cloud control plane is unreachable, outgoing contributions remain safely queued locally in encrypted storage.
5. *Authority:* The employee is authoritative for contribution release; control plane is authoritative for playbook publishing and access policy.
6. *Testing without private details:* Validated using synthetic fixtures with real ephemeral Ed25519 keys, metadata-free 1x1 PNGs, and simulated control snapshots.
7. *Audit and duplicate prevention:* Enforces client-generated UUIDv4 and signed review attestations; idempotency keys prevent duplicate processing.
8. *Failure blast radius:* Gateway failure stops knowledge synchronization; local capture, private history, and cached guidance reading remain functional.
9. *v1.0 criteria:* Fully satisfies ORY-007, ORY-010, ORY-012, ORY-015, ORY-018, ORY-068, ORY-069, and ORY-070.
