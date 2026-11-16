# Control Plane Transport Architecture, Transactional Durability, and Transient Inference

**Status:** accepted  
**Date:** 2026-11-10  
**Deciders:** User-Approved Architecture Review  
**Authority:** Technical Architecture & Security Engineering  
**Amends:** [ADR-0010](0010-contribution-delivery-and-guidance-sync.md), [ADR-0011](0011-identity-authority-and-approval-fencing.md)  
**Amended by:** [ADR-0022](0022-release-eligibility-and-rollout-governance.md), [ADR-0023](0023-command-center-reporting-privacy-and-delivery.md)  
**Normative Specification:** [docs/components/control-plane.md](../components/control-plane.md)

---

## Context

Oryn's enterprise multi-tenant control plane coordinates client ingress, domain state transitions, asynchronous background processing, contribution synchronization, and transient cloud model inference ([PRODUCT.md §§6–7, 14, 16.6, 25.6–9](../../PRODUCT.md)). Following the establishment of edge privacy storage ([ADR-0007](0007-private-evidence-storage-and-retention.md)), reviewed contribution sync ([ADR-0010](0010-contribution-delivery-and-guidance-sync.md)), and identity authority fencing ([ADR-0011](0011-identity-authority-and-approval-fencing.md)), several critical cross-cutting transport, persistence, and concurrency boundaries required final architectural resolution:

1. **Event Fabric and Message Broker Overhead:** Whether the pilot architecture requires an independent distributed streaming broker (e.g., Apache Kafka, RabbitMQ) or should rely on transactional PostgreSQL durable queues and transactional outbox tables.
2. **Process Boundary Segmentation:** How to isolate public web management traffic, durable event workers, and transient real-time inference streaming to prevent memory exhaustion, logging disclosure, or cross-tenant contamination.
3. **Web Browser Session Transport:** Whether browser applications should handle JWT access/refresh token pairs or use a hardened confidential Backend-for-Frontend (BFF) cookie architecture with CSRF defenses and activity tracking.
4. **Transient Inference Admission and Stream Continuity:** How real-time meeting transcription and visual reasoning are admitted, bounded, and transported without persisting private audio or transcripts, and how socket/pod disconnections are handled.
5. **Disaster Recovery and Site-Loss Custody Guarantees:** How to ensure that historically accepted contribution custody records survive PostgreSQL Point-In-Time Recovery (PITR) without duplicating contributor identity or risking false re-synthesis.

---

## Decision

1. **PostgreSQL-Only Transactional Event Fabric:**
   - Dedicated message brokers (Kafka, RabbitMQ, NATS) are rejected for the pilot deployment. All asynchronous domain event distribution uses PostgreSQL transactional outbox (`domain_outbox`), durable delivery tracking (`domain_delivery`), and inbox deduplication (`domain_inbox`).
   - Domain mutations, outbox entries, and mandatory audit records commit atomically in the same database transaction. Local fanout runs via background workers polling with `FOR UPDATE SKIP LOCKED`.
   - Event delivery enforces strict FIFO ordering per `(organization_id, aggregate_type, aggregate_id)` for each consumer. Delivery leases last 30 seconds and renew every 10 seconds.
   - Deliveries retry up to 8 times with full exponential backoff and jitter; after 8 failures, the delivery row transitions to `quarantined`. That specific aggregate is blocked for that consumer until audited administrative repair, while all other aggregates continue processing.
   - LISTEN/NOTIFY provides wake hints only; failure or dropped notifications are healed by periodic polling scans (250 ms for safety revocations, 1 s for ordinary work).

2. **Three-Role Process Segmentation:**
   - Control Plane deployments are partitioned into three dedicated Kubernetes workloads with independent scaling and resource limits:
     - `API / BFF`: Serves HTTPS management requests, web cookies, change feed long-polls, and synchronous command routing.
     - `Durable Worker`: Consumes transactional outbox events, executes asynchronous background tasks, and manages retry/quarantine lifecycles.
     - `Inference Worker`: Terminates WebSocket audio streams and proxies single-shot requests to LiteLLM with memory-only scratch spools zeroed on exit.
   - Total application database connections are capped at 64 across the cluster (24 API, 16 Worker, 8 Inference, 16 dedicated reserve).

3. **Confidential BFF Web Session Architecture:**
   - Raw bearer tokens, refresh tokens, and Auth0 assertions are never exposed to browser JavaScript.
   - Web authentication uses a single opaque 256-bit random cookie (`__Host-oryn_session`: HttpOnly, Secure, SameSite=Lax, Path=/, no Domain).
   - In-memory CSRF tokens and exact `Origin` header matching are required on all unsafe HTTP methods (`POST`, `PUT`, `DELETE`, `PATCH`).
   - Foreground UI activity heartbeats (`POST /v1/session/activity`) update `last_human_activity_at` (coalesced 1/min). At 30 minutes' inactivity, the session enters `locked` state; reauthentication via Auth0 unlocks the session without extending the 12-hour absolute deadline.
   - Organization switching updates session scope and rotates CSRF tokens; stale browser tabs receive 403 `CP_SCOPE_CHANGED` to prevent accidental cross-tenant mutation.

4. **Transient Non-Resumable Cloud Inference Transport:**
   - All cloud AI inference routes exclusively through Oryn's managed LiteLLM proxy pinned to US-only, zero-data-retention (ZDR), no-training enterprise endpoints.
   - Inference pods mount memory-backed scratch spools (`emptyDir: { medium: "Memory", sizeLimit: "256Mi" }`); all disk caching, swap space, and proxy body logging are disabled.
   - Real-time audio streaming uses WebSocket (`Sec-WebSocket-Protocol: oryn.inference.v1`). Connection affinity is routed using a 256-bit random session handle hashed with SHA-256 (`inference_owner_lease`).
   - Every 100 ms audio chunk (16 kHz, 16-bit mono PCM, max 3,200 bytes) requires a signed chunk proof (`SignedInferenceChunkProofV1`) signed by the enrolled device key, binding sequence numbers, sample offsets, and consent revisions.
   - Authority is renewed every 60 seconds. Pod crashes or socket disconnections immediately cancel upstream provider streams and zero local memory. Reconnection across pods and audio replay are prohibited; client must initiate a fresh session.

5. **Independent Recovery Journal Custody Extension (Amending ADR-0010 and ADR-0011):**
   - The independent immutable recovery journal established in [ADR-0011](0011-identity-authority-and-approval-fencing.md) is extended to record minimal 5-field custody projections: `{organization_id, contribution_id, revision, content_digest, disposition}`.
   - Custody changes (`sync_custody_changed`) are acknowledged only after independent journal checkpointing.
   - Following a PostgreSQL PITR restore, if an accepted contribution's payload is missing from storage, its status is truthfully reported as `lost_after_restore`, preventing silent re-synthesis, duplicate acceptance, or false claims of publication.
   - Pre-recovery idempotency keys generated prior to the restore floor are rejected with 503 `CP_RECOVERY_REQUIRED`.

---

## Consequences

### Positive
- Zero external broker infrastructure reduces deployment complexity and operational attack surface for pilot installations.
- Memory isolation and ephemeral proxying guarantee that raw capture evidence and meeting audio cannot leak to disk or logs.
- Strict multi-tab organization isolation prevents accidental cross-tenant data execution in browser consoles.
- Independent recovery journal guarantees non-rollback custody and action fencing across disaster recovery events.

### Negative
- High-volume event throughput is bounded by PostgreSQL write capacity (acceptable within pilot envelope of 25 req/s).
- Dropped WebSocket connections terminate meeting transcription without seamless resumption, requiring client reconnect.
- Offline long-polling clients must maintain active HTTP connections, requiring careful connection pool offloading.

*(Scope Amendment — 2026-11-16): [ADR-0022](0022-release-eligibility-and-rollout-governance.md) incorporates release governance routes and `durability_pending` transaction commitments, requiring complete signed authority checkpointing before newly expanded release authority is acknowledged or exposed to admission traffic.*

*(Scope Amendment — 2026-11-16): [ADR-0023](0023-command-center-reporting-privacy-and-delivery.md) incorporates Command Center, Notifications, and Analytics routes; multi-channel notification delivery via Desktop Shell (`shell-sync.v1` major 1, minor 1) and isolated Notification Egress Broker (AWS SES in `us-east-1`); governed export streaming via isolated Export Artifact Broker and sandboxed Export Render Worker (AWS S3 in `us-east-1`); and Authority Recovery Journal disclosure checkpointing (`analytics_disclosure_changed`).*


