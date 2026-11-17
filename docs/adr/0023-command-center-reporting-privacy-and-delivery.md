# 0023. Command Center Reporting, Privacy Releases, Notifications, and Governed Delivery

Date: 2026-11-16

## Status

Accepted — detailed technical specification complete, implementation pending

Amends:
- [0012-control-plane-transport-durability-and-inference.md](0012-control-plane-transport-durability-and-inference.md) (Adds Command Center, Notifications, and Analytics routes; multi-channel notification delivery via Desktop Shell `shell-sync.v1` major 1, minor 1 and isolated Notification Egress Broker; governed export streaming via isolated Export Artifact Broker and sandboxed Export Render Worker; expands Authority Recovery Journal kinds with `analytics_disclosure_changed`).
- [0013-workflow-discovery-evidence-and-review-boundaries.md](0013-workflow-discovery-evidence-and-review-boundaries.md) (Replaces leaky `OpportunityV1` with a discriminated union `available | suppressed | unavailable`, eliminating numeric/ranking key leakage on suppressed opportunities; adds `HumanTaskReportingFactV1` to Discovery's schema; adds nullable `observed_task_completed_at` to `WorkflowContributionContentV1` and `DemonstrationProposalV1`).

Amended by:
- [0024-infrastructure-security-custody-and-recovery.md](0024-infrastructure-security-custody-and-recovery.md) (Export recovery-region pin in `us-east-2`, corrected export transport references prohibiting presigned URLs, and finite reporting archive retention).

## Context

The Command Center, Notifications, and Analytics component delivers organization-scoped web management interfaces, notifications, aggregate operational analytics, X-Ray pilot reports, and governed exports under PRODUCT.md §§22–24, 26, 30 and TECHNICAL.md §§5.7, 7.3, 14.1.

Previous design briefs left critical architectural tensions across seven dimensions:
1. **Reporting Storage Engine (PostgreSQL Projections vs. External OLAP/ClickHouse):** Introducing a separate analytical datastore (ClickHouse, Snowflake, or Elasticsearch) would introduce non-transactional replication lag, split multi-tenant RLS enforcement, create new out-of-band egress, and bypass domain-owner authority boundaries.
2. **Employee Privacy Enforcement (Sealed Weekly Cohorts vs. Ad-Hoc Dynamic Slicing):** Allowing arbitrary time-range slicing or fine-grained ad-hoc filters over human task demonstration data allows small-cohort reconstruction attacks (e.g., filtering down to single-person work intervals), converting an automation discovery platform into an illicit employee surveillance tool.
3. **Report Immutability vs. Live Dashboard Drift:** Treating executive and operational reports as ephemeral live queries results in irreproducible calculations, silent retroactive revisions when underlying facts are restated, and unprovable compliance statements.
4. **Outbound Notification Authority and Channel Privacy:** Delivering notifications across inbox, desktop, and email risks leaking confidential record data into external email systems or allowing notification delivery receipts to be misinterpreted as business approvals or incident containment.
5. **Desktop Presentation Rail vs. Supervision Integrity:** Desktop Shell requires central notification awareness, but multiplexing notification bodies over guidance or capture channels risks polluting local privacy sandboxes or blocking urgent security revocations.
6. **Governed Export Generation vs. Worker Security:** Generating multi-megabyte and multi-gigabyte PDF, CSV, and ZIP exports requires document rendering (HTML-to-PDF) and large object staging (S3) without granting ambient Internet egress, general database pools, or filesystem persistence to core API/Durable Worker containers.
7. **AI Inference Role in Reporting:** Employing generative LLMs to synthesize executive summaries or calculate ROI introduces non-deterministic hallucinations and privacy exposure into compliance reporting.

## Decision

### 1. PostgreSQL Owner-Maintained Projections over External OLAP
- **No Dedicated Analytical Engine:** External OLAP clusters (ClickHouse, Snowflake) are rejected. Reporting is backed by PostgreSQL tables in the primary control plane cluster, maintaining unified multi-tenant row-level security (RLS), ACID guarantees, and backup boundaries.
- **Domain-Owner Write Authority:** Analytics does not write into owner schemas or ingest unverified events. Each upstream domain owner (Discovery, Orchestration, Verification, Identity, Simulator, Incident, Graph, Release) owns its reporting facts and writes immutable revisions into owner-prefixed reporting history tables within the same transaction as its canonical state mutations.
- **Watermark-Based Snapshot Rebuildability:** Analytics projects aggregates from owner-committed facts captured at explicit owner watermarks. Delivery history in PostgreSQL outbox/inbox lasts 7 days; durable reporting projections survive past 7 days by replaying from owner fact tables, not relying on infinite event outbox retention.

### 2. Sealed Weekly Privacy Releases and Anti-Surveillance Gate
- **Sealed Weekly Partitioning:** Human task contribution metrics are strictly partitioned into whole ISO weeks (Monday 00:00 to next Monday in the pinned organization timezone). Cells seal once, exactly 72 hours after week end. Late task submissions remain valid review evidence but never alter sealed historical human metrics.
- **Configurable Contributor Floor (Minimum 5):** A sealed cell requires at least 5 distinct human contributors (`minimum_contributors`, default 5, configurable 5..1000 by Security Admin, never lowerable below 5). If fewer than 5 contributors contributed to a cell, the cell is suppressed.
- **Discriminated Suppression (No Leaks):** Suppressed and unavailable cells (`MetricCellV1`, `OpportunityV1`) emit only safe reason codes. Numeric values, sample sizes, numerators, denominators, and ranking keys are completely omitted. Ad-hoc human queries spanning any suppressed cell fail closed and return suppressed totals.
- **Absolute Surveillance Ban:** Queries requesting actor, device, idle-time, active-time, attendance, or individual ranking dimensions are strictly rejected by backend APIs with `403 CC_SURVEILLANCE_FORBIDDEN`.
- **Authority Recovery Journal Checkpoint:** Prior to serialized disclosure of any human cell, an immutable commitment hash is written to the independent Authority Recovery Journal (`analytics_disclosure_changed`). On restore, if reconstructed data does not match the journal hash, the partition is permanently marked `blocked_history`.

### 3. Immutable Report Snapshots and Explicit Financial Baselines
- **Snapshot Immutability:** Generated reports (`ReportSnapshotV1`) are immutable statements binding kind, period, timezone, cutoff timestamp, methodology ID (`oryn.operational-metrics.v1`), per-owner source watermarks, audience expressions, released privacy cells, and source manifest SHA-256. Content is retained for at most 90 days; audit metadata is retained for 24 months.
- **Explicit Baselines and Currency Separation:** Operational savings are modeled as Time Avoidance Estimates based on owner-approved baselines (`ApproveReportingBaselineV1`) and verified non-no-op Cases minus review assumptions. Financial costs use settled execution micro-units and explicit hourly review rates. If currencies differ, components are displayed separately and combined cost is marked unavailable; implicit foreign exchange conversion is prohibited.
- **Fixed 14-Calendar-Day Operational X-Ray Pilot:** Pilot duration is strictly 14 calendar days (not 336 hours, correctly accounting for daylight saving transitions). Roster administration is restricted to authorized Workflow Owners under `analytics.pilot.manage` and never constitutes a manager participation score.

### 4. Bounded Multi-Channel Notifications
- **Eight Distinct Types, Four Priorities:** Central notifications encompass 8 types (`action_required`, `incident`, `repair_ready`, `release_status`, `commitment_reminder`, `guide_update`, `job_result`, `privacy_enrollment`) across 4 priorities (`critical`, `required`, `due`, `routine`).
- **Separation of Presentation from Authority:** Delivery, reading, snoozing, and dismissing notifications are distinct notification states. Notification acknowledgment (`NotificationAcknowledgment`) or dismissal never resolves an incident, clears a security restriction, or approves a business action.
- **Desktop Channel via shell-sync.v1 Minor 1:** Desktop Shell notification presentation is negotiated via `shell-sync.v1` major 1, minor 1 (`central_notifications_v1`) over the private control rail using short-lived (5-minute) child tokens with narrow self-service scopes (`notifications:read_own`, `notifications:update_own`, `notifications:record_delivery`). Sync Helper runs a separate long-polling feed with key filtering, bringing max long-poll tasks to 2 without interfering with signed restriction delivery.
- **Isolated Notification Egress Broker:** Outbound email uses a dedicated, network-isolated Notification Egress Broker connecting to AWS SES v2 in `us-east-1`. Email contains generic attention copy and authenticated links only; no private business data, record values, or tracking pixels are included.

### 5. Governed Large-Scale Exports
- **Three Governed Classes:** Exports cover `report`, `playbooks`, and `audit`, requiring explicit `report.export` capability.
- **Isolated Export Render Worker:** PDF generation runs in a network-isolated, read-only root sandbox worker using headless Chromium with JavaScript disabled, rendering trusted deterministic HTML/CSS templates within a 1 GiB memory and 120-second timeout.
- **Isolated Export Artifact Broker & S3:** Exports stream to/from private S3 buckets in AWS region `us-east-1` with SSE-KMS encryption via an internal mTLS broker. Presigned URLs and public access are prohibited. Part size is capped at 256 MiB; total export is capped at 5 GiB. Downloads support authenticated Range resumption, re-evaluating tenant authorization every 1 MiB or 2 seconds.
- **CSV Formula Neutralization:** CSV exports neutralize leading `=`, `+`, `-`, `@`, and whitespace-prefixed formulas without corrupting negative numbers. ZIP exports include an internal entry manifest (hashing contained files) and an external manifest (hashing part bytes), avoiding circular hashing.

### 6. Deterministic Operational Metrics and Zero AI Inference
- **Deterministic Analytics Engine:** Reporting calculations, rate aggregations, medians, and X-Ray recommendations are computed via deterministic Rust reducers and templates. No new LLM inference purposes, prompts, or gateway schemas are introduced for this component.

## Consequences

### Positive
- Strict mathematical privacy guarantees eliminate surveillance and re-identification risks while preserving valid automation intelligence.
- PostgreSQL-native architecture avoids external cluster operational costs, complex replication topologies, and split security policies.
- Immutable report snapshots and journaled disclosure commitments provide bulletproof auditability and disaster recovery integrity.
- Isolated rendering and egress brokers protect core API and Durable Worker workloads from memory exhaustion and network egress risks.

### Negative
- Sealed weekly partitioning means human task metrics reflect a 72-hour lag after week end; real-time human task counts are deliberately unavailable.
- Strict 5-contributor floor leaves small teams or low-volume workflows quantitatively suppressed until sufficient diversity is observed.
- Export size caps (5 GiB, 200 PDF pages) require users to narrow export query filters for high-volume audit logs.
- Dual long-poll connections on Desktop Sync Helper increase local socket count from 1 to 2.

*(Infrastructure & Security Amendment — 2026-11-16): [ADR-0024](0024-infrastructure-security-custody-and-recovery.md) pins S3 export storage to `us-east-1` with pre-provisioned activation in disaster recovery region `us-east-2`, mandates authenticated Export Artifact Broker streaming over mTLS with Range resumption (presigned URLs strictly prohibited), and defines finite reporting archive retention (730 days online, 365 days cold archive, then purged).*
