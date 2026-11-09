# Data Classification and Retention Vocabulary

Status: Baseline brief — detailed design pending

## Purpose and Scope

This document defines Oryn's data architecture, sensitivity classification, retention schedules, and boundary rules, grounded in [TECHNICAL.md §§3.2, 7.3, 10](../../TECHNICAL.md) and [PRODUCT.md §25](../../PRODUCT.md).

It establishes a shared vocabulary for managing information lifecycles across employee endpoints, central control planes, execution workers, and simulation environments. This document uses authoritative source concepts rather than invented numerical classification schemes or rigid enum codes.

---

## Mandatory Exclusions and Restricted Secrets

Certain data categories are **mandatory exclusions** under [PRODUCT.md §25.2](../../PRODUCT.md). They are **not** ordinary business data waiting for later redaction; they must be excluded **before capture at source**; an OCR classifier or downstream filter cannot authorize capture of mandatory excluded content:
1. **Mandatory Excluded Applications and Contexts:**
   - Personal password managers and credential vaults.
   - Authentication secrets, session tokens, and cryptographic keys.
   - Personal messaging, chat, and personal email.
   - Personal banking, investment, and financial portals.
   - Incognito and private browser windows.
   - HR compensation, payroll records, and employee performance reviews.
   - Protected health information (PHI) and healthcare portals.
   - Windows and domains explicitly excluded by employee or organizational policy.
2. **Restricted Secrets in Execution:**
   - Account passwords, API keys, private keys, payment card numbers (PAN/CVV), and personal government identifiers (SSN/SIN).
   - Must never appear in shared playbooks, agent prompts, task summaries, or centralized analytics.
   - When redaction occurs, sensitive data is replaced with meaningful field tokens (e.g., `<CUSTOMER_ACCOUNT_NUMBER>`), never plausible fake values that could be mistaken for authentic data.
3. **Restricted Local Coordination Secrets:**
   - Browser pairing private keys (P-256 WebCrypto) and ephemeral connection tokens.
   - Stored strictly in extension-origin IndexedDB and OS-protected credential vaults (macOS Keychain / Windows Credential Manager).
   - Prohibited from central cloud synchronization, telemetry, error dumps, and diagnostic bundles.

---

## The Nine Logical Data Domains (TECHNICAL.md §10.1)

| Data Domain | Location and Owner | Authorized Audience | Allowed Egress | Governing Consent / Review | Retention and Deletion Schedule | Provenance Rules |
|---|---|---|---|---|---|---|
| **1. Private Raw Observation** | Employee endpoint; owned by [local-privacy-storage](../components/local-privacy-storage.md) (including transient native rasters isolated in `oryn-observation-worker` memory masked to opaque-black, structured DOM observations extracted by [browser-extension](../components/browser-extension.md), and private meeting audio tracks) | Individual employee only; never accessible to managers | Zero durable cloud egress; purpose-authorized transient inference via LiteLLM gateway permitted; central media archiving strictly prohibited | Governed by employee capture consent for the relevant modality (`visual_work_observation`, `contextual_work_application_recognition`, and meeting opt-in) | **Default: 7 days.** Employee may select **1–6 days**. Organization may permit extension up to **14 days maximum** for documented research; expires automatically. When `personal_history_retention=false`, raw media, screenshots, and DOM text reside exclusively in volatile memory buffers with an absolute 30-second TTL for live guidance, with zero disk writes, shadow persistence, or durable evidence receipts | Captures device ID, OS window metadata, document keys, and exclusion status |
| **2. Private Derived Work History** | Employee endpoint; owned by [local-privacy-storage](../components/local-privacy-storage.md) | Individual employee only | Local guidance and contribution review only; no cloud sync | Governed by personal history retention setting | Follows local raw retention or employee-managed deletion. Completely suppressed when `personal_history_retention=false` | Indexes task boundaries, unshared commitments, and local match scores |
| **3. Reviewed Contribution** | Ingestion pipeline; owned by [contribution-sync](../components/contribution-sync.md) (attestation signed by [local-privacy-storage](../components/local-privacy-storage.md)) | Assigned domain reviewers and discovery engine | Transmitted to central control plane over secure TLS | Explicit employee review and Ed25519 review attestation mandatory | Retained until synthesized into candidates or deleted by employee request; shared still-image artifacts governed by signed artifact policy | Carries cryptographic employee review attestation, canonical content digest, and tenant scope; limited to sanitized text and purpose-bound redacted still images (<= 1920x1080, <= 1 MiB, max 4 per contribution); audio and video clips prohibited |
| **4. Organizational Knowledge** | Control plane; owned by [operational-graph](../components/operational-graph.md) | Authorized teams and roles within the tenant | Distributed to authorized local HUD caches | Approved by designated domain and policy owners | Retained indefinitely while active; unapproved candidates default to **365 days** | Tracks capability ID, playbook version hash, and author/approver IDs |
| **5. Agent and Release Definitions** | Control plane; owned by [agent-factory-ir](../components/agent-factory-ir.md) and [release-governance](../components/release-governance.md) | Builders, operators, and execution workers | Dispatched to isolated execution sandboxes | Governed by release gates and owner sign-offs | Immutable version lineage retained for operational history | Signed with candidate content hash and evaluation scorecard links |
| **6. Production Execution Records** | Execution plane; owned by [job-orchestration](../components/job-orchestration.md) and [outcome-verification](../components/outcome-verification.md) (with local browser action receipts produced by [browser-extension](../components/browser-extension.md)) | Operators, auditors, and incident reviewers | Scoped business reports and audit views | Governed by job authorization and tenant policies | Consequential audit records default to **24 months** under approved audit schedule. Minimal execution receipts contain zero captured DOM or customer form values; they never become shadow observation history | Links Job ID, Case ID, worker container, proposal digests (`action_sha256`), and authoritative readback digests |
| **7. Simulation Artifacts** | Simulation plane; owned by [flight-simulator](../components/flight-simulator.md) | Builders, reviewers, and evaluation engines | Stored in isolated evaluation artifact stores | Governed by scenario development policies | Retained for regression comparison across candidate versions | Scenarios, synthetic fixtures, fault injection logs, and scorecards |
| **8. Analytics and Notifications** | Reporting layer; owned by [command-center-analytics](../components/command-center-analytics.md) | Organization members according to RBAC roles | Exportable reports with scope and uncertainty caveats | Governed by tenant analytics policies | Aggregated metrics retained according to enterprise reporting policy | Discloses data coverage, sample caveats, and estimated vs. measured metrics |
| **9. Transient Inference Processing** | Control plane / LiteLLM Gateway / Certified US Provider; governed by [cloud-inference](cloud-inference.md) | Dedicated inference processes only; zero human audience | Transient egress through governed LiteLLM gateway only | Governed by employee capture consent, cloud notice acknowledgment, and signed `InferenceAuthorization` | Zero durable content retention after processing; memory-backed spooling wiped on completion/cancellation; strict 30-second volatile memory ceiling when personal retention is disabled | Cryptographically bound to input manifest, route ID, model revision, and deletion generation |

---

## Retention Schedules and Deletion Boundaries

### Exact Retention Preservations ([PRODUCT.md §25.4](../../PRODUCT.md))
- **Local Raw Screen and Audio Capture:** Default is strictly **7 days** with automatic expiration. Employees may configure a shorter duration of **1 to 6 days**. An enterprise may permit an employee to extend retention up to a hard maximum of **14 days** for documented workflow research, but cannot force local raw retention beyond this limit. Extensions apply future-only to acquisitions occurring after the policy change; shortening restricts existing eligible evidence immediately.
- **Encrypted Storage Architecture:** Stored locally in profile-bound SQLCipher 4 encrypted database partitions and independently encrypted media files (AES-256-GCM in 1 MiB chunks with unique per-blob 256-bit keys and 96-bit nonces). Partitions are governed by an encrypted key catalog anchored to an OS-protected master credential in macOS Keychain or Windows Credential Manager. Oryn maintains no central backup, no recovery key, and no recovery escrow for private evidence; device/key loss permanently loses private history.
- **Unapproved Candidate Workflows:** Default retention is **365 days** for unapproved candidate workflows in discovery, subject to organizational policy.
- **Approved Histories and Consequential Audit:** Approved playbook/agent change histories and consequential action audit records default to **24 months** under the organization's approved audit schedule.

### Explicit Holds and Obligations
Legal holds, compliance retention, or contractual requirements block voluntary deletion of eligible evidence strictly within its existing configured retention deadline. Holds cannot authorize new capture, cannot provide manager or administrative browsing access to raw timelines, and cannot extend retention beyond the original raw retention deadline. Expired records are permanently purged regardless of hold status. Raw media must not be sequestered into permanent shadow storage.

### Deletion and Independent State Separation
When an employee requests deletion of local data, the system must clearly distinguish six distinct states:
1. **Private Original Capture:** Purged immediately and permanently from the local disk via cryptographic key destruction and partition unlinking. Discarded raw media cannot be recovered from organizational dashboards.
2. **Independently Saved Commitments:** Confirmed personal obligations survive source evidence expiration or source-only deletion with `evidence_status = "unavailable"`. Explicit full personal data purge / supported client uninstall permanently purges eligible saved commitments too.
3. **Reviewed Shared Contributions:** If already submitted to workflow discovery, the employee is presented with a separate contribution-removal flow.
4. **Published Organizational Knowledge:** Deleting a local recording does not automatically erase independently approved, anonymized company playbooks derived from it.
5. **Execution Evidence:** Verification readbacks and transaction receipts remain intact for operational integrity.
6. **Audit Obligations:** Consequential action audit logs cannot be truncated by individual user deletion requests.
---

## Model Processing and Egress Boundaries (TECHNICAL.md §10.4)

Every interaction with a language model, speech engine, or AI reasoning service constitutes a **governed data egress boundary**, routed exclusively through the Oryn LiteLLM gateway (see [shared cloud inference contract](cloud-inference.md)):
- **Cloud-Only v1.0 Baseline:** All Oryn-owned transcription, diarization, vision extraction, reasoning, embeddings, and reranking use cloud-managed APIs through LiteLLM. No local-only model runtimes execute in v1.0.
- **Zero Content Retention (ZDR):** Upstream providers must operate under enterprise zero-data-retention terms where customer content is never stored on disk after processing and never used for model training.
- **United States Confinement:** All inference ingress, proxy routing, model computation, and content-bearing subprocessors must operate within the United States.
- **Data Minimization & Transient Storage:** Only bounded, privacy-masked payloads are submitted. Spooling uses memory-backed temporary storage wiped immediately upon completion or cancellation.
- **Untrusted Output:** Model completions and extracted commitments are classified as untrusted candidates until validated by deterministic schema parsers and confirmed by employees.

---

## Simulation Artifact Sensitivity (TECHNICAL.md §10.1)

Although simulation environments run against synthetic data and application replicas, simulation artifacts retain sensitivity restrictions:
- Scenario definitions may encode proprietary business logic, operational edge cases, and confidential workflow structures.
- Simulation execution traces, regression reports, and replay recordings are protected under tenant-isolation policies identical to production operational knowledge.
- Test environments must never borrow production write authority or expose real customer PII in test fixtures.

---

## Technical Specifications and Deferrals

Concrete local encryption parameters (SQLCipher 4 AES-256-CBC, HMAC-SHA256, AES-256-GCM chunked media, generation catalog management, and crash-safe selective purge algorithms) are authoritatively specified in [local-privacy-storage](../components/local-privacy-storage.md). Central cloud database row-level security, KMS envelope encryption, and customer-managed encryption key (CMEK) integrations remain governed by [infrastructure-security](../components/infrastructure-security.md).
