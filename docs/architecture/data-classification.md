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
| **2. Private Derived Work History** | Employee endpoint; owned by [local-privacy-storage](../components/local-privacy-storage.md) (including source-linked `PrivateTaskSummaryV1` and `GuideCheckpointV1` in screen partitions) | Individual employee only | Local guidance and contribution review only; no cloud sync | Governed by personal history retention setting | Follows local raw retention or employee-managed deletion. Completely suppressed when `personal_history_retention=false` (volatile memory matching with 30-second TTL only; no durable writes). Explicit preferences stored separately in shell settings | Indexes task boundaries, unshared commitments, and local match scores |
| **3. Reviewed Contribution** | Transport owned by [contribution-sync](../components/contribution-sync.md); canonical accepted domain intake owned by [workflow-discovery](../components/workflow-discovery.md) (`discovery_contribution_intake`) and [operational-graph](../components/operational-graph.md) (`graph_handoff_intake`); minimal replay identity owned by [control-plane](../components/control-plane.md) (`sync_submission_identity`); attestation signed by [local-privacy-storage](../components/local-privacy-storage.md) | Assigned domain reviewers and discovery engine | Transmitted to central control plane over secure TLS 1.3 | Explicit employee review and Ed25519 review attestation mandatory (signed with software review key in OS-protected credential storage `com.oryn.device.identity`; see ADR-0011) | Unsent queued data follows source eligibility; accepted unpublished intake follows destination policy (default **365 days**). Source transport copies disappear after ownership transfer. Shared still-image artifacts honor signed artifact policy expiry (<= 365 days). Withdrawn content is immediately ineligible for synthesis even when held; physical deletion follows disclosed holds. Terminal local metadata retained 30 days; minimal central replay identity lasts until organization erasure | Carries cryptographic employee review attestation, canonical content digest, and tenant scope; limited to sanitized text and purpose-bound redacted still images (<= 1920x1080, <= 1 MiB, max 4 per contribution); audio and video clips prohibited |
| **4. Organizational Knowledge** | Control plane; owned by [operational-graph](../components/operational-graph.md) (cached locally by [contribution-sync](../components/contribution-sync.md) for [local-context-hud](../components/local-context-hud.md)) and candidate store owned by [workflow-discovery](../components/workflow-discovery.md) | Authorized teams and roles within the tenant | Distributed to authorized local HUD caches under signed guidance access leases (`hud.guidance-access-lease.v1`, max 24 hours) | Approved by designated domain and policy owners | Retained indefinitely while active; unapproved candidates default to **365 days** anchored to creation time (incoming evidence does not extend deadline; canonical payloads disposed upon expiry while minimal audit metadata and content hash survive); sanitized suppression rules retain minimal business descriptions under separate owner governance | Tracks capability ID, playbook version hash (`hud.guidance-bundle.v1`), and author/approver IDs |
| **5. Agent and Release Definitions** | Control plane; owned by [agent-factory-ir](../components/agent-factory-ir.md) and [release-governance](../components/release-governance.md) | Builders, operators, and execution workers | Dispatched to isolated execution sandboxes | Governed by compiler qualification, evaluation gates, and release approvals | Immutable version lineage retained for operational history (active versions retained indefinitely; superseded records follow 24-month audit schedule). Approved runtime prompt templates are versioned configuration; raw synthesis prompts, completions, model reasoning traces, private media, and customer payloads are not persisted | Candidate RFC 8785 canonical body digest (`behavior_sha256`) sealed with Vault Ed25519 publisher attestation (`SignedCandidateAttestationV1`); independently bound to `DependencyManifestV1`, simulation evaluation bundles, and release records |
| **6. Production Execution Records & Adapter State** | Execution plane; owned by [job-orchestration](../components/job-orchestration.md), [application-adapters](../components/application-adapters.md), and [outcome-verification](../components/outcome-verification.md) (with local browser action receipts produced by [browser-extension](../components/browser-extension.md) and adapters for both jobs and assists) | Operators, auditors, and incident reviewers | Scoped business reports and audit views; zero credential egress | Governed by job authorization, assist plan approval, and tenant policies | Consequential audit records default to **24 months** under approved audit schedule. Unsubmitted staging expires after **24 hours** (or 30s volatile). Connection secrets reside strictly in Vault. Minimal execution receipts contain zero captured DOM, full mailbox bodies, or customer form values, bind `ExecutionContextV1`, survive retention-off mode, and never become shadow observation history | Links Job ID / Assist Session ID, worker container, dual digests (`action_sha256` and `proposal_digest`), and authoritative readback digests |
| **7. Simulation Artifacts** | Simulation plane; owned by [flight-simulator](../components/flight-simulator.md) | Builders, reviewers, and evaluation engines | Stored in isolated evaluation artifact stores | Governed by scenario development policies | Retained for regression comparison across candidate versions | Scenarios, synthetic fixtures, fault injection logs, and scorecards |
| **8. Analytics and Notifications** | Reporting layer; owned by [command-center-analytics](../components/command-center-analytics.md) | Organization members according to RBAC roles | Exportable reports with scope and uncertainty caveats | Governed by tenant analytics policies | Aggregated metrics retained according to enterprise reporting policy | Discloses data coverage, sample caveats, and estimated vs. measured metrics |
| **9. Transient Inference Processing** | Control plane / LiteLLM Gateway / Certified US Provider; governed by [cloud-inference](cloud-inference.md) | Dedicated inference processes only; zero human audience | Transient egress through governed LiteLLM gateway only | Governed by employee capture consent, cloud notice acknowledgment, signed `InferenceAuthorization` (`inference.authorization.v1`), and ephemeral `SignedPrivacyAuthorizationContextV1` (`privacy.authorization-context.v1`) | Zero durable content retention after processing; memory-backed spooling wiped on completion/cancellation; strict 30-second volatile memory ceiling when personal retention is disabled | Cryptographically bound to input manifest hash, route ID, model revision, and deletion generation without exporting private identifiers |
| **10. Command Transport & Replay Metadata** | Control plane; owned by [control-plane](../components/control-plane.md) (`cp_idempotency`) | API Dispatcher and auditing workers | Organization-scoped internal control-plane persistence | Governed by tenant API authorization and verified principal context | Sanitized mutation responses retained for **7 days** for duplicate command replay; compact key/digest tombstones retained for **24 months** under audit schedule; zero private inference prompts or raw output bodies retained | Binds organization ID, authenticated principal, canonical HTTP method/path, UUIDv7 key, and RFC 8785 canonical request digest |

---

## Retention Schedules and Deletion Boundaries

### Exact Retention Preservations ([PRODUCT.md §25.4](../../PRODUCT.md))
- **Local Raw Screen and Audio Capture:** Default is strictly **7 days** with automatic expiration. Employees may configure a shorter duration of **1 to 6 days**. An enterprise may permit an employee to extend retention up to a hard maximum of **14 days** for documented workflow research, but cannot force local raw retention beyond this limit. Extensions apply future-only to acquisitions occurring after the policy change; shortening restricts existing eligible evidence immediately.
- **Encrypted Storage Architecture:** Stored locally in profile-bound SQLCipher 4 encrypted database partitions and independently encrypted media files (AES-256-GCM in 1 MiB chunks with unique per-blob 256-bit keys and 96-bit nonces). Partitions are governed by an encrypted key catalog anchored to an OS-protected master credential in macOS Keychain or Windows Credential Manager. Oryn maintains no central backup, no recovery key, and no recovery escrow for private evidence; device/key loss permanently loses private history.
- **Unapproved Candidate Workflows & Graph Stages:** Default retention is **365 days** anchored to candidate creation time for unapproved candidate workflows in discovery and unpublished stages in Operational Graph (`graph_candidate_stage`), subject to organizational policy. New contributing demonstrations or restaging never reset or extend this deadline. Upon expiry, the canonical review payload is disposed, while minimal audit metadata and content hashes are preserved. Sanitized suppression rules (`SuppressionRuleV1`) are governed under a separate owner lifecycle and survive candidate payload disposal.
- **Approved Knowledge Histories and Consequential Audit:** Approved playbook/agent change histories, business rule versions, and consequential action audit records default to **24 months** under the organization's approved audit schedule; active approved knowledge is retained indefinitely while active. Active and unresolved handoff obligations (`graph_handoff`) are retained while operationally required; terminal handoff records follow the 24-month audit schedule. When source evidence expires or is withdrawn, Operational Graph transitions the subject to `evidence_status = "unavailable"` or `"partially_unavailable"` rather than deleting approved business knowledge.

### Application Adapter and Execution State Lifecycle
Application execution maintains strict segregation between five distinct classes of data:
1. **Connection Secrets:** OAuth access tokens, refresh tokens, client secrets, and mTLS private keys. Stored exclusively in HashiCorp Vault. Execution workers hold zero decrypted credentials and zero ambient network egress; egress broker injects credentials out-of-process. Secrets are revoked immediately upon connection suspension or revocation and are never logged, exported to audit, or recoverable from database restore logs.
2. **Staged Authorized Business Arguments:** Pending mutation payloads and parameter diffs (`AdapterStagedActionV1`). Staged in Identity Policy upon authorization. Unsubmitted staging expires automatically after **24 hours** (or strictly **30 seconds** in locked memory when derived from local volatile observations). Expired staging requires fresh authorization.
3. **Content-Free Submission Audit:** Submission receipts (`SignedAdapterSubmissionReceiptV1`) and journal entries. Contains only execution metadata: action ID, `ExecutionContextV1`, dual digests (`action_sha256`, `proposal_digest`), timestamps, and submission state (`acknowledged`, `rejected`, `unknown`). Content-free: zero raw DOM nodes, zero media, zero full mailbox message bodies, zero customer form field contents, and zero HTTP request/response payload bodies. Retained for **24 months** under the approved audit schedule.
4. **Independent Readback Evidence:** Postcondition evidence (`SignedAdapterReadbackEvidenceV1`) fetched by independent verifiers over read-only scopes. Attests observed version tags, timestamps, `data_sha256` digests, and consistency limits (`authoritative`, `eventual`, `unknown`). Kept for postcondition verification; native private content remains local with metadata-only central references.
5. **Employee-Local Raw Observations:** Native screen frames and browser DOM. Governed by local retention (default **7 days**, employee 1–6 days, max 14 days), or strictly **30 seconds** in volatile memory when `personal_history_retention=false`. Raw observations never become a central execution transcript.

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
