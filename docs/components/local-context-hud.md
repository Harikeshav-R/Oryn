# Local Context HUD and Guided Assistance Component Specification

Status: Detailed technical specification — implementation pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§4.6–4.7, 7.2, 8.6, 9.7](../../TECHNICAL.md) | [PRODUCT.md §§9.4, 12, 14.2–14.3, 29.1–29.6; ORY-011, ORY-018–021, ORY-026–028, ORY-043–045, ORY-064, ORY-068, ORY-070–075](../../PRODUCT.md) | [ADR-0009](../adr/0009-local-context-guidance-and-assist-boundaries.md)

### Core Responsibility
The Local Context HUD and Guided Assistance component provides real-time, nonintrusive guidance, published peer error resolutions, confirmed commitment reminders, and supervised local execution assistance directly alongside employee work. It operates as a dedicated user-space process (`oryn-hud-helper`) hosted on the employee workstation, combining local task understanding and guidance coordination behind one deterministic reducer.

The helper ingests sanitized, permitted screen observations from [local-privacy-storage](local-privacy-storage.md) (Contract 25: `privacy-context.v1`), matches live application states against locally cached published guidance bundles from [operational-graph](operational-graph.md) via [contribution-sync](contribution-sync.md) (Contract 3: `hud.guidance-bundle.v1`), schedules bounded cloud semantic reasoning requests via the privacy helper edge client (Contract 22: `text.reason`), and generates structured presentation models and coordinate highlights for native rendering by [desktop-shell](desktop-shell.md) (Contract 20: `shell-hud.v1`).

### Owns
- Local active-task hypothesis generation and observational task boundary segmentation.
- Maintaining an in-memory compiled exact-match index of authorized published playbooks, peer fixes, and rules.
- Contextual suggestion candidate ranking, deduplication, fatigue throttling, and employee suppression preference application.
- Tracking interactive guidance step progress across a per-step state ledger (`pending`, `active`, `acknowledged`, `observed_complete`, `skipped_optional`, `failed`, `unknown`).
- Managing at most one active guidance session per employee profile, with deterministic suspension upon task switching and explicit revalidation upon resume.
- Coordinating employee-supervised assisted execution (`AssistPlanV1`) binding an explicit tagged union `ExecutionContextV1` (`assist`), enforcing preflight reservations and preparation stopping points before consequential submissions.
- Generating reverse demonstration proposals (`DemonstrationProposalV1`) from observed completed task instances for validation by privacy storage prior to local contribution review.

### Consumes
- Redacted, permitted local observations (`PermittedObservationV1`), privacy fences (`ContextFence`), sequence gap markers (`ContextGap`), baseline responses, and storage receipts from [local-privacy-storage](local-privacy-storage.md) over Contract 25 (`privacy-context.v1`, major 1, minor 1).
- Published, access-filtered guidance bundles (`GuidanceBundleV1`) from [operational-graph](operational-graph.md) via [contribution-sync](contribution-sync.md) under Contract 3.
- Signed guidance access leases (`SignedGuidanceAccessLeaseV1`, schema `hud.guidance-access-lease.v1`) issued by [identity-policy](identity-policy.md) governing offline and online cache read eligibility (capped at 24 hours).
- Confirmed personal commitment projections (`CommitmentReminderProjection`) and projection changes (`CommitmentProjectionChangeV1`) from [meeting-intelligence](meeting-intelligence.md) via Contract 23.
- Employee guidance interactions (`GuidanceInteraction`) and presentation lifecycle events from [desktop-shell](desktop-shell.md) via Contract 20 (`shell-hud.v1`, major 1, minor 0).
- Live target presence and physical desktop coordinate rectangles (`BrowserTargetResult`) from [browser-extension](browser-extension.md) relayed via the privacy gate (Contract 21).
- Action authorization tokens and item-level approval receipts from [identity-policy](identity-policy.md) bound to canonical `action_sha256` proposal digests (Contract 11).
- Semantic reasoning results (`hud.context-interpretation.v1`, `hud.demonstration-summary.v1`, `hud.step-explanation.v1`) from the governed LiteLLM cloud gateway via the privacy helper edge client under Contract 22 (`text.reason`).

### Produces
- Structured guidance cards (`PresentGuidance`) and native target highlight coordinates delivered to [desktop-shell](desktop-shell.md) over Contract 20.
- Clear presentation directives (`ClearGuidance`) with monotonic presentation revisions to [desktop-shell](desktop-shell.md).
- Candidate task demonstration summaries (`DemonstrationProposalV1`) submitted to [local-privacy-storage](local-privacy-storage.md) over Contract 25.
- Target resolution queries (`ResolveBrowserTarget`) relayed to [browser-extension](browser-extension.md) via the privacy helper under Contract 21.
- Semantic inference requests (`SubmitHudInference`, `CancelHudInference`) dispatched to the privacy helper edge client under Contract 22.
- Supervised browser and application action requests (`ExecuteBrowserAction`) bound to `ExecutionContextV1` (`assist`) dispatched to local adapters (Contracts 11–13).
- Reminder interaction commands (`ApplyReminderInteractionV1`) dispatched to [meeting-intelligence](meeting-intelligence.md) over Contract 23.
- Task summaries (`SaveTaskSummary`) and guide checkpoints (`SaveGuideCheckpoint`, `DeleteGuideCheckpoint`) persisted in encrypted screen partition stores via Contract 25.

### Does Not Own
- Approving or publishing new organizational playbooks, rules, or peer fixes (owned by [operational-graph](operational-graph.md)).
- Central workflow clustering or cross-employee candidate discovery across multiple endpoints (owned by [workflow-discovery](workflow-discovery.md)).
- Granting authorization or elevating employee permissions for actions exceeding their role (owned by [identity-policy](identity-policy.md)).
- Hosting desktop overlay windows, computing native OS occlusion, or rendering click-through highlights (owned strictly by the native host in [desktop-shell](desktop-shell.md)).
- Physical window capture, Accessibility API calls, or display scraping (owned by [os-observation](os-observation.md) and [browser-extension](browser-extension.md)).
- Encrypted evidence database maintenance, media chunk storage, key catalog rotation, or selective deletion transactions (owned by [local-privacy-storage](local-privacy-storage.md)).
- Final outcome verification for completed business actions (owned independently by [outcome-verification](outcome-verification.md)).

### Cross-Component Ownership Boundary

| Subsystem | Authority and Boundary | HUD Interaction |
|---|---|---|
| `local-privacy-storage` (Privacy Helper) | Private summaries, source-linked retention, encrypted screen partitions, key catalog, deletion fences, and inference egress client. | Ingests `PermittedObservationV1` and `ContextFence` via Contract 25; persists `PrivateTaskSummaryV1` and `GuideCheckpointV1`. |
| `contribution-sync` | Encrypted durable organizational guidance cache, retrieval, delta sync, and access revocation ordering. | Compiles in-memory exact-match index from sync-committed cache generations; receives immediate revocation evictions. |
| `operational-graph` | Published playbook, peer-fix, rule, and assist-plan authority and version lineage. | Ingests immutable `GuidanceBundleV1` records; pins active guides to immutable version hashes. |
| `identity-policy` | Signed guidance read leases, action authorization tokens, risk tier classification, and item-level human approvals. | Enforces `SignedGuidanceAccessLeaseV1` (max 24h); binds `ExecutionContextV1` and `action_sha256` for Tier 2/3 assists. |
| `meeting-intelligence` | Confirmed saved commitments, occurrence scheduling, and transcript revision tracking. | Ingests `CommitmentReminderProjection`; selects contextual presentation; dispatches `ApplyReminderInteractionV1`. |
| `application-adapters` / `browser-extension` | Execution preflight, device reservation, actuation, minimal write-ahead receipts, and readback dispatch. | Dispatches authorized assist actions; checks device reservation and before-values; ingests `BrowserActionResult`. |
| `outcome-verification` | Authoritative final business verdict (`Verified Complete`, `Business Incorrect`, `Outcome Unknown`). | Neither step acknowledgment nor adapter dispatch acknowledgment produces a business verdict; independent readback required. |
| `desktop-shell` | Employee UI hosting, native windowing, click-through highlights, persistent preferences, and supervisor lifecycle. | Delegates all rendering to Shell over `shell-hud.v1` (Contract 20); receives employee interaction commands. |

## Product requirements

**Source references:** [PRODUCT.md §§9.4, 12, 14.2–14.3, 29.1–29.6; ORY-011, ORY-018–021, ORY-026–028, ORY-043–045, ORY-064, ORY-068, ORY-070–075](../../PRODUCT.md)

### Key Product Requirements
- **Candidate Task Inference (ORY-011):** Synthesizes candidate task demonstrations from observed employee workflows without triggering automatic central publication or shared cloud exposure.
- **Published Peer Error Resolution (ORY-018):** When an employee encounters a recognizable application error or discrepancy code, the HUD provides published, verified peer solutions displaying full provenance.
- **Accurate Next-Step Guidance and Verification (ORY-019):** Guidance highlights the correct UI element for the current active step and never silently advances past an incomplete or failed action. Step progression advances automatically only when declared expected-state predicates are observed on fresh evidence; user confirmation is explicitly recorded as employee acknowledgment, not verified business completion.
- **User Snooze, Mute, and Suppression (ORY-020):** Employees can dismiss suggestions for the current task, snooze a category for one hour, mute a category, or disable proactive suggestions while retaining manual search. Critical safety and policy warnings affecting a pending operation bypass ordinary suppression.
- **Contextual Commitment Reminders (ORY-021):** Displays compact contextual reminders for confirmed, open obligations derived from reviewed meetings when relevant business contexts are active. Reminders default to 09:00 in the employee's working zone on the due date.
- **Stage 3 Assist Plan Execution Gates (ORY-026, ORY-027, ORY-028):** Supervised execution of bounded assist plans attached to published playbooks requires independent Stage 3 evaluation and release governance approval (at least 5 verified human examples, 25 passing test scenarios, 5 edge/negative cases, and owner sign-off). Tier 3 consequential actions require an explicit item-level Review and Submit gesture showing parameter diffs. Tier 4 restricted actions are unconditionally blocked.
- **Outcome Verification and Hold on Uncertain Outcomes (ORY-043, ORY-044, ORY-045):** Action execution results distinguishing primitive dispatch from business verification. Ambiguous writes halt progression as `Outcome Unknown` and block blind retries. Operator stop commands are honored immediately without rolling back already committed external transactions.
- **Friction and Help Detection (ORY-064):** Identifies likely employee friction when an eligible step remains unresolved for at least 35 seconds or when the employee navigates between work and permitted help material at least four times in 60 seconds. Friction signals are processed strictly for immediate contextual help; persistent employee stall histories or surveillance metrics are prohibited.
- **Security Policy Enforcement and Controlled Offboarding (ORY-068, ORY-069):** Security policy changes, rule conflicts, or organization deactivation immediately invalidate active guidance, block assist dispatches, and terminate cached sessions.
- **Material Change Versioning and Review (ORY-070):** Material playbook or assist plan modifications require explicit reviewable version diffs; active guides remain pinned to immutable version digests until completion or explicit restart.
- **Governed Cloud Semantic Reasoning (ORY-071–075):** Semantic interpretation uses cloud-managed models routed through the LiteLLM gateway with contractual zero data retention, strict US processing, route pinning, and no on-device model fallback.

## Upstream and downstream contracts

**Catalog references:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md) (Contracts 3, 11, 12, 13, 20, 21, 22, 23, 25)

### Contract 25: Local Privacy Storage Interface (`privacy-context.v1`)
Operating over an isolated, direct socketpair (macOS) or anonymous pipe pair (Windows) established by the desktop shell supervisor at launch.
- **Negotiation:** Length-prefixed wire protocol negotiating `protocol_version: "privacy-context.v1"`, `protocol_major: 1`, `protocol_minor: 1`. Both peers require this minor; incompatible versions close the link immediately.
- **Framing & Queuing:** 4-byte big-endian unsigned length prefix + UTF-8 JSON. Max frame size: 1,048,576 bytes (1 MiB). Ring buffer capped at 128 messages or 8 MiB, with eight reserved control slots. Control slots guarantee delivery of privacy fences (`ContextFence`); if the reserve cannot carry a fence, the helper closes the link, invalidating HUD state and forcing resynchronization. Observation queue overflow emits one ordered `ContextGap` reporting lost sequence intervals and requests a fresh baseline.
- **Envelope Structure:** All Contract 25 messages use the canonical wire envelope:
  ```json
  {
    "protocol_version": "privacy-context.v1",
    "protocol_major": 1,
    "protocol_minor": 1,
    "message_id": "01928374-4001-7000-8000-000000000001",
    "correlation_id": null,
    "sequence": "101",
    "organization_id": "org_enterprise_corp",
    "actor_id": "usr_emp_harikeshav_r",
    "profile_id": "prf_550e8400-e29b-41d4-a716-446655440000",
    "session_epoch": "b5e9f1a0-3c2b-4e89-9a12-87c1f8d204e1",
    "type": "PermittedObservationV1",
    "payload": {}
  }
  ```
- **Ingress Observation Payloads:**
  - `ContextReady`: Sent upon successful handshake with privacy helper; contains current privacy revision, deletion generation, permitted modalities, and source health.
  - `PermittedObservationV1`: Contains `schema_id: "privacy.observation.v1"`, `source_id: "native_os" | "browser"`, `source_epoch`, `observation_kind: "baseline" | "delta" | "transition" | "error" | "expected_state"`, `surface_identity`, `application_id`, `work_context_key`, `record_binding_key`, `baseline_complete`, bounded `facts` array (max 128 facts, max 1 KiB per string), and timestamps. Opaque `record_binding_key` values are helper-minted random handles representing exact business entity bindings; they expire with supporting evidence and are null for uncertified values.
  - `ContextFence`: Revokes live context across profile, source, or surface boundaries (`pause`, `excluded`, `revoked`, `deleted`, `expired`, `source_lost`, `retention_changed`, `session_changed`). Immediately revokes live facts, candidate suggestions, and active targets.
  - `ContextGap`: Reports observation discontinuities with `first_lost_sequence` and `last_lost_sequence`. Pauses dependent guide branches; healthy sources remain active.
  - `ContextBaselineResponse`: Returns fresh full baseline for a permitted surface after gap or restart.
  - `BrowserTargetResult`: Relayed from browser extension via privacy gate (Contract 21).
  - `HudInferenceResult`: Result of cloud semantic interpretation (`hud.context-interpretation.v1`, `hud.demonstration-summary.v1`, `hud.step-explanation.v1`).
  - `ContextHistoryResponse`: Returns sanitized historical task summaries within retention bounds.
  - `GuideCheckpointResponse` & `TaskSummaryResponse`: Receipts for persisted checkpoints and task summaries.
- **Egress Commands & Proposals:**
  - `RequestContextBaseline`: Requests fresh surface baseline.
  - `ResolveBrowserTarget`: Queries target geometry through privacy gate.
  - `SubmitHudInference` & `CancelHudInference`: Dispatches semantic interpretation requests with allowed candidate IDs and fact references.
  - `GetContextHistory`: Queries historical task summaries for repetition analysis.
  - `SaveTaskSummary`: Persists bounded `PrivateTaskSummaryV1` in screen partition databases.
  - `SaveGuideCheckpoint`, `GetGuideCheckpoint`, `DeleteGuideCheckpoint`: Manages at most one resumable `GuideCheckpointV1` per profile.
  - `DemonstrationProposalV1`: Submits synthesized task demonstration proposals for privacy-storage validation before contribution review.

### Contract 3: Guidance Bundle and Access Lease Interface (`hud.guidance-bundle.v1`)
Consumes published, access-filtered guidance bundles from [operational-graph](operational-graph.md) via [contribution-sync](contribution-sync.md), and signed access leases from [identity-policy](identity-policy.md).
- **`GuidanceBundleV1` Schema:**
  - `schema_id`: `"hud.guidance-bundle.v1"`
  - `bundle_id`: string UUIDv4
  - `bundle_revision`: integer (>= 1)
  - `content_sha256`: lowercase 64-hex SHA-256 digest of canonical RFC 8785 bundle bytes (excluding `content_sha256` and `publisher_signature_ref`)
  - `publisher_signature_ref`: string UUIDv4 matching the corresponding `PublisherSignatureSidecarV1`
  - `playbook_id`: string identifier
  - `workflow_id`: string identifier
  - `capability_id`: string identifier
  - `playbook_version`: immutable SHA-256 string (e.g. `sha256-<64-hex>`)
  - `objective`: plain text workflow goal
  - `prerequisites`: closed predicate expression
  - `expected_result`: plain text postcondition summary
  - `task_signature`: deterministic entry application and state predicate
  - `steps`: array of at most 128 steps. Each step includes `step_id`, `order`, `label`, `description`, `target_key`, `application_profile_id`, `predicate`, `timeout_ms` (30,000–300,000 ms), `assist_plan_ref`, `rule_refs`, `source_refs`, and `allowed_targets`.
  - `step_edges`: array of explicit DAG edges `{from_step_id, to_step_id, condition}` forming a cycle-free directed acyclic graph.
  - `peer_fixes`: array of peer fix descriptors binding normalized error codes or declared state predicates to verified fix playbooks.
  - `assist_plans`: optional array of Stage 3 approved `AssistPlanV1` records.
  - `record_independent`: boolean (if false, guide cannot acquire mutation eligibility without an exact live record binding).
  - `applicable_profiles`: array of compatible application profile IDs and version bounds.
  - `effective_rule_versions`: array of bound rule version strings.
  - `audience`: authorized teams and role tiers.
  - `published_at`: RFC 3339 UTC timestamp.

- **Fail-Closed Successor Evaluation:**
  - Successor transitions follow explicit `step_edges` DAG topology.
  - For each candidate successor step, the HUD evaluates edge conditions and prerequisite predicates using three-valued logic (`true`, `false`, `unknown`).
  - If a condition evaluates to `false` or `unknown`, the edge is blocked.
  - If no outgoing edge from the active step evaluates to `true`, the HUD fails closed: it refuses to guess, halts advancement, clears target highlights, and prompts the employee to confirm whether an unobserved path was taken.

- **Whole-Guide Conflict Revocation:**
  - If Operational Graph, Identity Policy, or Local Privacy Storage flags an active playbook with rule conflicts, license restrictions, or legal holds (`conflict_flags`), HUD revokes guidance for the entire guide immediately.
  - Partial execution of uncontested steps in a conflicted guide is strictly prohibited; all active cards, highlights, and pending assist plans are cleared instantly.

- **Closed Predicate Algebra:** Predicates use a bounded algebra supporting operators: `all`, `any`, `not`, `exists`, `eq`, `enum_in`.
  - Maximum nesting depth: 8 levels.
  - Maximum leaf conditions per signature or step: 64 leaves.
  - Evaluation semantics: Three-valued logic (`true`, `false`, `unknown`). If a required field is missing or snapshot-inferred, evaluation yields `unknown`. In three-valued logic, `not unknown = unknown`.
  - Profile-approved field keys only; arbitrary regex, JavaScript evaluation, XPath, or dynamic remote code are strictly prohibited.

- **Signed Guidance Access Lease (`SignedGuidanceAccessLeaseV1`):**
  - Schema ID: `hud.guidance-access-lease.v1`.
  - Issued and signed by `identity-policy` using Ed25519 over RFC 8785 canonical JSON bytes.
  - Binds `organization_id`, `actor_id`, `device_id`, `profile_id`, `allowed_bundle_hashes`, `policy_revision`, `access_revision`, `issued_at`, `not_after`, and `read_only: true`.
  - Maximum absolute validity: **24 hours**. Policy may configure shorter validity; never exceeds 24 hours.
  - Offline rules: Employees may continue reading locally cached playbooks offline under a valid, unexpired access lease. Executing new assisted or autonomous actions is strictly prohibited while offline. Missing or expired leases hide restricted guidance and block resume.

### Contract 20: Desktop Shell Guidance Presentation Interface (`shell-hud.v1`)
The desktop shell host creates two private inherited byte channels at launch (`shell-hud.v1`, major 1, minor 0):
1. **Control/Presentation Channel:** Max 256 KiB frame, 64 queued messages / 1 MiB. Carries `PresentGuidance`, `ClearGuidance`, and content-free heartbeats every 100 ms. 500 ms silence or EOF invalidates presentation and pauses pending assists.
2. **Data Channel:** Max 1 MiB frame, 16 queued messages / 8 MiB. Carries bulk bundle transfers, manual search queries, interaction feedback receipts, and streaming generation chunk intake (`HudGenerationChunkV1`).
- **Generation Chunk Intake (`HudGenerationChunkV1`):** Streams semantic explanations and long-form summaries progressively across the Data Channel. Each chunk specifies `generation_id`, `chunk_index`, `is_last`, and `text_delta`. The desktop shell renders text progressively as chunks arrive without interrupting control heartbeats or highlight refreshes on the control channel.
- **Model Ingress (`PresentGuidance`):** Emits structured card model and target highlight geometry. All narrative text is rendered strictly as plain text (no HTML/script injection). Highlights use physical screen pixels; the native adapter translates coordinates using active display DPI scaling without applying double transforms. Highlight TTL is clamped to 1–250 ms (default 150 ms) and expires automatically unless continuously refreshed every 100 ms while visible. Highlights clear immediately upon window focus change, window movement, scroll, display reconfiguration, security prompts, or context revision mismatch. Highlighting OS security prompts or browser permission dialogs is strictly prohibited.
- **Clear Guidance Ingress (`ClearGuidance`):** Dismisses active guidance card and highlight with presentation revision and reason. Stale presentation revisions cannot restore cleared highlights.
- **Interaction Feedback (`GuidanceInteraction`):** Consumes employee UI commands:
  - Navigation: `"confirm_step"`, `"back"`, `"skip_optional"`, `"stop"`, `"start_guide"`, `"resume_guide"`, `"restart_updated_guide"`, `"select_guide"`.
  - Explanation: `"why_step"`, `"report_ui_differs"`, `"report_problem"` (routes defined categories from PRODUCT §30.7: `"wrong_step"`, `"missing_prerequisite"`, `"ui_changed"`, `"policy_blocked"`, `"performance_issue"`).
  - Suppression & Preference: `"dismiss"`, `"snooze_1h"`, `"mute_category"`, `"set_guidance_preferences"`.
  - Search: `"search_guidance"`.
  - Assist: `"start_assist"`, `"review_and_submit"`.

### Contract 21: Browser Target Resolution (Privacy Gate Relay)
Relays target resolution between HUD and browser extension via the privacy helper.
- **Query (`ResolveBrowserTarget`):** HUD supplies approved packaged `target_key`, document generation, surface generation, and context revision. HUD never supplies arbitrary DOM selectors or XPath expressions.
- **Result (`BrowserTargetResult`):** Extension resolves packaged multi-tier deterministic locators against live DOM and returns physical desktop bounds (`rect`), affine transforms, display ID, and TTL (clamped to 250 ms). Target presence requires active consent and generation match. If target geometry is unavailable, ambiguous, or unproven, the HUD falls back to text-only step guidance without coordinate highlights.

### Contract 23: Confirmed Commitment Projection (`meeting-intelligence`)
Consumes confirmed personal obligations from [meeting-intelligence](meeting-intelligence.md).
- **Ingress (`CommitmentReminderProjection`):** Ingests strictly `open` + `confirmed` commitments with `evidence_status: "available" | "partial" | "unavailable"`. Commitments with an explicit due date default to 09:00 in the employee's working zone. Commitments without a due date have no invented schedule.
- **Updates (`CommitmentProjectionChangeV1`):** Supports `upsert` and `remove` changes. Supporting transcript edits that trigger `needs_reconfirmation` immediately remove the projection until reconfirmed. Removals carry no obligation title.
- **Feedback (`ApplyReminderInteractionV1`):** Dispatches occurrence-bound commands (`delivered`, `dismiss`, `snooze`, `complete`, `cancel`) to update meeting storage transactionally.

### Contracts 11–13: Assisted Execution and Authorization Interfaces
Governs supervised execution of approved assist plans (`AssistPlanV1`).
- **Closed Execution Context Union (`ExecutionContextV1`):** Used uniformly across reservation requests, action requests, authorization tokens, receipts, and verifier queries:
  ```json
  {
    "kind": "assist",
    "assist_session_id": "asess_01928374-0001",
    "assist_plan_id": "plan_tax_post_adjustment_v1",
    "assist_plan_version": "1.0.0",
    "playbook_version": "sha256-e9102c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b"
  }
  ```
- **Exclusive Device Reservation:** Both agent jobs and HUD assists contend for the same device-wide exclusive local execution reservation (`ReserveBrowserExecution`); independent parallel job and assist locks are strictly prohibited.
- **Canonical Action Digest:** Computed identically across adapter, helper, and extension:
  ```
  action_sha256 = SHA256(RFC8785_Canonical_JSON({
    action_id, execution_context, application_profile_id,
    application_profile_version, document, surface_generation,
    target_key, record_key, expected_state, environment, operation, argument
  }))
  ```
  Encoded as string prefix `sha256_` followed by 64 lowercase hex digits.
- **Execution Flow & Stopping Points:** `start_assist` previews affected fields and stopping points, then reserves the active workspace. Tier 2 mutations require confirmed plan preview; Tier 3 consequential mutations halt at pre-declared stopping points and require a separate item-level `review_and_submit` action displaying exact parameter diffs. Tier 4 restricted actions are unconditionally denied.
- **Receipts:** Minimal durable receipts (`action_id`, `execution_context`, `action_sha256`, `authorization_ref`, `approval_ref`, `timestamp_utc`, `submission_state`, `evidence_ref`) contain zero customer business data and survive retention-off mode.

### Contract 22: Governed Cloud Semantic Reasoning (`text.reason`)
Dispatches semantic interpretation requests to LiteLLM via the Privacy Helper edge client.
- **Purposes & Schemas:**
  - `hud_context_interpretation` -> `hud.context-interpretation.v1`: Interprets ambiguous task surface context and suggests candidate playbooks.
  - `hud_demonstration_summary` -> `hud.demonstration-summary.v1`: Synthesizes structured demonstration proposals from observed task instances.
  - `hud_step_explanation` -> `hud.step-explanation.v1`: Generates contextual step explanations citing approved rule references.
- **Limits:** Minimized input <= 16 KiB, max 8 candidate IDs, 64 fact references. Output <= 8 KiB, max 16 hypotheses. Request timeout: 5,000 ms (effective deadline is earliest of 5,000 ms, authorization expiry, and input expiry). Rate limits: debounced 500 ms, 1 in-flight per device, >=30s cooldown between background requests, <=120 background requests per rolling hour.

## Trust and deployment boundaries

### Process and Execution Isolation
- **User-Space Helper Process:** The HUD executes as `oryn-hud-helper`, an unprivileged user-space binary spawned and supervised by `desktop-shell`. It runs under the logged-in desktop user's security context without elevated privileges.
- **Zero Ambient Privileges:** The process holds no direct windowing system handles, no accessibility API permissions, no screen capture entitlements, no local SQLite databases, no master encryption credentials, and no network sockets to external cloud providers.
- **Inherited Descriptor Channels:** Communication with `desktop-shell` uses two private inherited byte pipes (`shell-hud.v1`); communication with `oryn-privacy-helper` uses an isolated peer socketpair or pipe pair (`privacy-context.v1`). Public named pipes, TCP listeners, and unauthenticated IPC rendezvous points are strictly prohibited.

### Presentation Delegation and Clickjacking Defense
- **Presentation Host Only:** All visual elements, card frames, text panels, and click-through bounding boxes are rendered exclusively by the native host in `desktop-shell`. The HUD helper produces abstract geometry and structured text models only.
- **Plain-Text Narrative Rendering:** All narrative guidance content (`title`, `instruction`, `rationale`, `explanation_text`) is rendered as strict plain text. HTML markup, rich markdown with embedded media, script tags, executable links, and model-generated DOM locators are strictly forbidden.
- **Prohibited UI Overlays:** Target highlights are strictly forbidden from overlaying OS security prompts (User Account Control, macOS TCC authorization dialogs, Keychain prompts) or browser permission infobars. Highlights are clipped to certified application window viewports and dismiss immediately upon window occlusion or focus shifts.

### Offline and Policy Boundaries
- **Signed Offline Guidance Lease:** Reading cached guidance while offline requires a valid, verified `SignedGuidanceAccessLeaseV1` (maximum validity 24 hours). Offline operation is strictly read-only: executing new assisted actions, autonomous actions, or modifying shared knowledge while offline is unconditionally blocked.
- **Fail-Closed on Expiration or Tampering:** If a guidance lease expires, fails signature verification, or detects clock rollback, all restricted guidance cards and highlights are immediately hidden.
- **ZDR Inference Gateway:** All cloud model interactions route through the Privacy Helper's `InferenceEgressClient` over Contract 22 to LiteLLM, enforcing contractual zero content retention (ZDR), US data processing, route pinning, and RAM-disk upload spooling.

## Internal architecture

```
+----------------------------------------------------------------------------------------------------+
|                                         oryn-hud-helper                                            |
|                                                                                                    |
|  +--------------------+         +---------------------------------------------------------------+  |
|  |   GuidanceIndex    |         |                        ContextReducer                         |  |
|  | (Compiled RAM Set) |         | - Validates sequence order and generations                    |  |
|  +---------+----------+         | - Maintains bounded current-surface fact map (<= 64 surfaces) |  |
|            |                    +-------------------------------+-------------------------------+  |
|            |                                                    |                                  |
|            v                                                    v                                  |
|  +--------------------+         +-------------------------------+-------------------------------+  |
|  |   TaskSegmenter    |         |                      GuideCoordinator                         |  |
|  | (Task Hypotheses & |         | - Owns single active guide and step ledger                    |  |
|  |  Repetition Logic) |         | - Deterministic suspension & explicit resume                  |  |
|  +---------+----------+         +-------------------------------+-------------------------------+  |
|            |                                                    |                                  |
|            v                                                    v                                  |
|  +--------------------+         +-------------------------------+-------------------------------+  |
|  |SuggestionCoord'tor |         |                       AssistCoordinator                       |  |
|  | (Ranking, Dedup,   |<------->| - Validates AssistPlanV1 and Stage 3 eligibility              |  |
|  |  Fatigue & Queue)  |         | - Binds ExecutionContextV1 to adapters & extension            |  |
|  +---------+----------+         +-------------------------------+-------------------------------+  |
|            |                                                    |                                  |
|            v                                                    v                                  |
|  +--------------------+         +-------------------------------+-------------------------------+  |
|  |InferenceCoordinator|         |                     ShellPresentationBridge                   |  |
|  | (5s Timeout, ZDR)  |         | (Contract 20: shell-hud.v1 control & data channels)           |  |
|  +--------------------+         +---------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------------+
```

### Logical Submodules
1. **`ContextReducer`:** The single deterministic state authority. Validates message sequencing, source epochs, surface generations, and privacy deletion generations. Maintains a bounded in-memory current-surface fact map across up to 64 active surfaces. Implements the core reduction seam:
   ```rust
   fn reduce(state: HudState, input: HudInput, now: MonotonicInstant) -> HudTransition;
   ```
   `HudTransition` yields the replacement state and typed effects. Inputs include admitted observations, privacy fences, guidance bundle updates, reminder changes, employee interactions, adapter receipts, inference completions, and timer expirations. Side effects never mutate state directly; asynchronous completions re-enter the reducer as generation-bound inputs.
2. **`TaskSegmenter`:** Identifies task boundaries and derives explicitly uncertain task instances (`TaskHypothesis`) from observation event sequences. Tracks cross-application workflow transitions based on matching record binding keys (`record_binding_key`). Identifies repetition candidates across completed task instances.
3. **`GuidanceIndex`:** Compiles an in-memory exact-match lookup index from access-filtered `GuidanceBundleV1` records cached by `contribution-sync`. Indexes application profiles, normalized error codes, and task entry signatures. Evaluates closed predicate algebra conditions using three-valued logic.
4. **`SuggestionCoordinator`:** Computes candidate suggestion eligibility, priority ranking, fatigue throttling, and deduplication. Enforces employee snooze (1 hour), category mute, and proactive-off settings. Maintains the compact authorized candidate queue (max 20 entries).
5. **`GuideCoordinator`:** Manages the lifecycle of the single active guide (`GuidanceSession`), tracking step-by-step progress across the per-step ledger (`pending`, `active`, `acknowledged`, `observed_complete`, `skipped_optional`, `failed`, `unknown`). Handles automatic suspension upon context switching and explicit revalidation upon resume.
6. **`InferenceCoordinator`:** Schedules bounded cloud semantic reasoning requests (`text.reason`) through the Privacy Helper edge client under Contract 22. Enforces the 5,000 ms deadline, 500 ms debounce, 1 in-flight concurrency limit, 30-second background cooldown, and rolling hour limits. Discards late results arriving after context changes or input expiry.
7. **`AssistCoordinator`:** Coordinates interactive execution of approved assist plans (`AssistPlanV1`). Validates Stage 3 release governance eligibility, acquires exclusive device execution reservations, verifies observable before-values, checks parameter diffs, and binds `ExecutionContextV1` (`assist`) across adapter dispatches.

### Worker and Task Concurrency Model
The helper runs on a dedicated single-threaded Tokio runtime:
- **One Reducer Task:** All state transitions execute synchronously on one reducer task, eliminating lock contention and race conditions.
- **Bounded Channel Readers/Writers:** Separate asynchronous tasks handle length-prefixed streaming over the Contract 25 socketpair and Contract 20 presentation pipes.
- **At Most Two Blocking Workers:** Offloads CPU-intensive operations (guidance bundle validation, publisher Ed25519 signature checks, and GuidanceIndex recompilation) to at most two bounded blocking threads.
- **No Per-Observation Tasks:** Observations are processed sequentially through the reducer without spawning per-event tasks.

## State and lifecycle

### Guidance Session Lifecycle
Oryn maintains at most one active guidance session per employee profile:

```
+--------+   Match / Search    +---------+      Start Guide       +--------+
|  Idle  | ------------------> | Offered | ---------------------> | Active |
+--------+                     +---------+                        +----+---+
    ^                               ^                                  |
    |                               | Context Rebound / User Resume    | Unrelated Task / Gap /
    | Stop / Complete               |                                  | Window Minimize
    |                               v                                  v
+---+--------+                +-----------+                      +------------+
| Completed  |                | Resuming  | <------------------- | Suspended  |
| / Stopped  |                +-----------+   User Click Resume  +------------+
+------------+                      |
    ^                               | Policy Revocation / Conflict
    |                               v
    +-----------------------+---------------+
                            |  Invalidated  |
                            +---------------+
```

- `Idle`: No active guide. Evaluates incoming observations for suggestion opportunities.
- `Offered`: Contextual suggestion or peer fix presented to the employee via a compact or expanded card.
- `Active`: Employee clicked **Guide Me** or selected an approved procedure. Actively tracking step progress and rendering coordinate highlights.
- `Suspended`: Employee switched to an unrelated application, an observation gap occurred, or target window was minimized. Target highlights are immediately cleared. The session state and ledger remain preserved in memory (and checkpointed to encrypted screen partition storage).
- `Resuming`: Employee returned to the target application and clicked **Resume Guide**. The helper re-evaluates current identity, guidance access lease, policy revision, application profile, and record binding key before transitioning back to `Active`.
- `Completed`: Final step observed complete or acknowledged by employee. Session cleans up.
- `Stopped`: Employee explicitly clicked **Stop Guide**. In-flight queries are cancelled and highlights cleared; underlying business state is preserved.
- `Invalidated`: Pinned playbook was revoked, access lease expired, or policy conflict detected. Session halts immediately with explanatory troubleshooting text.

### Per-Step State Ledger
Each step in an active guide transitions through the following formal states:
- `pending`: Step not yet reached.
- `active`: Current step awaiting completion. Bounding highlight rendered if target certified.
- `acknowledged`: Employee clicked **Next Step** or confirmed instruction. Step advances, but recorded strictly as user acknowledgment rather than observed business completion.
- `observed_complete`: Expected-state predicate observed to be true on fresh structured evidence acquired after step activation, with exact matching record binding key and zero intervening observation gaps.
- `skipped_optional`: Employee clicked **Skip Step** on an optional step. Mandatory steps cannot be skipped.
- `failed`: Expected-state predicate evaluated definitely false, action timed out, or adapter reported dispatch failure. progression stops; troubleshooting guidance opens.
- `unknown`: Target element could not be certified, step timed out without observation, or observation gap occurred. progression halts.

### Assist Session Lifecycle
Assisted execution coordinates bounded macros under explicit employee supervision:

```
+------------+    Click Assist    +----------------+    Verify Preflight    +----------+
| Preparing  | -----------------> | Awaiting Start | ---------------------> | Reserved |
+------------+                    +----------------+                        +----+-----+
                                                                                 |
                                                                                 v
+------------+       Review Diff       +-------------------+    Dispatch Action  |
| Completed  | <---------------------- | Awaiting Approval | <-------------------+
+------------+                         +---------+---------+    (Tier 3 Commit)  |
      ^                                          |                               |
      | Action Completed                         v User Rejects / State Mismatch v
+-----+------+                         +-------------------+                +---------+
|  Running   | <---------------------- |  Paused / Stopped |                | Failed  |
+------------+   Operator Resumes      +-------------------+                +---------+
      |
      | Network Timeout / Ambiguous Dispatch
      v
+-------------------+
|  Outcome Unknown  |  (Blind duplicate retries strictly blocked)
+-------------------+
```

- `Preparing`: Validates plan hash, Stage 3 release governance approval, and application profile compatibility without executing side effects.
- `Awaiting Start`: Displays affected fields, parameter values, and declared stopping points in Shell UI.
- `Reserved`: Acquires exclusive device execution reservation (`ReserveBrowserExecution`) for the target tab or application workspace.
- `Running`: Dispatches validated action primitives through adapters (`ExecuteBrowserAction`).
- `Awaiting Approval`: Halts before consequential Tier 3 actions at pre-declared stopping points. Displays exact parameter diffs; awaits signed human approval receipt (`SubmitApproval`).
- `Paused`: Suspended due to user mouse/keyboard input interference or temporary navigation delay.
- `Outcome Unknown`: Adapter or extension returned ambiguous submission state (`unknown`). Automatic retry is strictly blocked; awaits independent readback verification.
- `Completed`: All plan actions dispatched and verified. Reservation released.
- `Failed`: Action rejected by policy, target handle unresolvable, or preconditions failed.

### Bounded Persistence and Checkpoint Records
- `PrivateTaskSummaryV1`: Persisted in screen partition databases via Contract 25 (`task_summaries`). Contains task ID, revision, profile ID, session epoch, source epoch, completion basis (`observed_complete`, `employee_reported_complete`, `incomplete`), deterministic hypothesis signature, observed application IDs (<= 128), step summaries (<= 128), and source evidence UUIDs (<= 256). Verified by privacy helper against retained evidence.
- `GuideCheckpointV1`: Persisted in screen partition databases via Contract 25 (`guide_checkpoints`). At most one resumable checkpoint per employee profile. Contains checkpoint ID, revision, guide session ID, task ID, profile ID, immutable playbook version SHA-256, step cursor, step ledger, source dependency IDs, last safe action receipt ref, and opaque record binding key. Lifetime is capped at the earliest of **24 hours** from guide start, supporting evidence retention deadline, and guidance access lease expiry. Checkpoints always restore in the `Suspended` state, requiring explicit employee resume and revalidation.
- **Retention-Off Mode (`personal_history_retention=false`):** All observation-derived facts, task hypotheses, candidate suggestions, and guide checkpoints operate strictly in volatile RAM with an absolute **30-second TTL** from original acquisition. Zero task summaries or checkpoints are written to disk. If supporting facts expire, active guides clear dependent state cleanly.

## Error and edge-case behavior

### Stable HUD Error Literals Table

| Error Code Literal | Category | Trigger Condition | System Behavior & Safe Outcome |
|---|---|---|---|
| `HUD_PROTOCOL_INCOMPATIBLE` | Fatal | Peer advertises protocol version or minor other than `privacy-context.v1` (1.1) or `shell-hud.v1` (1.0). | Helper terminates connection immediately; logs fatal diagnostic; fails closed without fallback. |
| `HUD_INVALID_MESSAGE` | Fatal | Malformed JSON, frame exceeding 1 MiB, invalid UTF-8, or missing required envelope fields. | Closes affected channel; invalidates session state; requests clean reconnection. |
| `HUD_CONTEXT_UNAVAILABLE` | Transient | Active application window is excluded, minimized, or obscured by unpermitted windows. | Clears guidance cards and highlights; transitions guide to `Suspended`; suspends inference. |
| `HUD_CONTEXT_STALE` | Transient | Observation sequence mismatch, superseded surface generation, or document generation change. | Discards pending suggestions; suppresses coordinate highlights; requests fresh baseline. |
| `HUD_OBSERVATION_GAP` | Transient | Upstream ring buffer overflow or dropped event sequence interval reported via `ContextGap`. | Emits gap warning; suspends active guide progression; requests fresh permitted baseline. |
| `HUD_GUIDANCE_UNAVAILABLE` | Operational | No published, access-filtered playbook matches current application context. | HUD remains silent; maintains compact search capability; avoids unprompted interruption. |
| `HUD_GUIDANCE_REVOKED` | Security | Pinned playbook revoked, deprecated, or employee access rights withdrawn. | Active guide invalidated immediately; highlights cleared; displays policy notice. |
| `HUD_GUIDANCE_LEASE_EXPIRED` | Security | Offline guidance access lease (`SignedGuidanceAccessLeaseV1`) exceeded 24-hour validity or clock rolled back. | Restricted guidance cards hidden; highlights cleared; blocks guide resume until re-authenticated online. |
| `HUD_RULE_CONFLICT` | Operational | Active playbook contains contradictory business rules flagged by operational graph. | Blocks affected step progression; displays rule conflict warning; prompts manual resolution. |
| `HUD_MATCH_AMBIGUOUS` | Operational | Multiple playbooks match active task with similar relevance or unknown predicates. | Presents passive choice menu; never auto-selects or executes unconfirmed procedures. |
| `HUD_TARGET_UNAVAILABLE` | Transient | Target element locator unresolved, ambiguous, occluded, or expired (> 250 ms). | Falls back to plain-text instruction card; suppresses coordinate highlight; never guesses geometry. |
| `HUD_STEP_TIMEOUT` | Operational | Step remains unresolved after configured `timeout_ms` (default 30s, max 300s). | Marks step `unknown`; halts auto-progression; offers troubleshooting guidance without advancing. |
| `HUD_PRESENTATION_STALE` | Transient | Employee interaction received with mismatched `presentation_revision`. | Interaction rejected with `stale`; shell UI refreshed with current state; duplicate clicks ignored. |
| `HUD_ASSIST_NOT_APPROVED` | Security | Playbook lacks Stage 3 release governance approval or assist plan hash mismatch. | Assist execution blocked unconditionally; offers guidance-only mode. |
| `HUD_ASSIST_CAPABILITY_UNAVAILABLE` | Operational | Required application profile adapter or browser execution capability unavailable. | Disables assist button; explains missing connector; falls back to manual guide. |
| `HUD_EXECUTION_BUSY` | Operational | Another batch job or assist session holds the exclusive device execution reservation. | Assist dispatch queued or rejected with busy notification; parallel execution prevented. |
| `HUD_APPROVAL_REQUIRED` | Security | Consequential Tier 3 assist action reached without signed human approval receipt. | Halts execution at stopping point; displays parameter diff; awaits `SubmitApproval`. |
| `HUD_ACTION_CONTEXT_CHANGED` | Security | Document generation, URL route, or before-values changed prior to action dispatch. | Dispatches aborted; reservation released; forces re-resolution and fresh approval. |
| `HUD_ACTION_OUTCOME_UNKNOWN` | Integrity | Action dispatched to adapter or browser but confirmation timed out or returned `unknown`. | Execution halted immediately; blind duplicate retries blocked; held for readback reconciliation. |
| `HUD_CAPACITY_EXCEEDED` | Resource | In-memory fact map exceeds 8 MiB, guidance cache exceeds 16 MiB, or queue exceeds 20 items. | Evicts lowest-priority unpinned context; drops noncritical candidates; preserves active guide. |
| `HUD_CHECKPOINT_UNAVAILABLE` | Storage | Local privacy storage rejects checkpoint save due to disk space or deletion fence. | Explains persistence unavailability; guide continues in memory-only mode without false save receipt. |

### Upstream Error Nesting and Idempotency
- **Nested Error Preservation:** Upstream errors from privacy storage (`PRIVACY_*`), cloud inference (`INFERENCE_*`), and browser extension (`TARGET_*`, `EXECUTION_*`) are preserved verbatim in error payloads as typed nested causes; the HUD never renames or synthesizes synthetic substitutes.
- **Command Idempotency Window:** The helper caches the receipts of the last 256 processed employee interaction commands for the active session. Duplicate command UUIDs replay the identical bounded outcome without re-executing business logic.

## Observability and audit

### Telemetry and Diagnostics Policy
In accordance with [PRODUCT.md §25.10](../../PRODUCT.md) and [TECHNICAL.md §11.5](../../TECHNICAL.md), the HUD helper collects strictly content-free operational diagnostics:
- **Permitted Telemetry Metrics:**
  - Aggregated suggestion counts by category (`error_resolution`, `workflow_assistance`, `commitment_reminder`, `repetition_opportunity`).
  - Reducer cycle latency percentiles (p50, p95, p99) and event queue depths.
  - Active guidance session counts and state distribution (`Idle`, `Offered`, `Active`, `Suspended`).
  - Contract 25 and Contract 20 message rates, buffer utilization, and dropped sequence intervals.
  - Target resolution latency and geometry cache hit/miss counts.
  - Standard error literal occurrence counts from the Stable Error Literals Table.
- **Strictly Prohibited Telemetry:**
  - Individual employee suggestion acceptance vs. dismissal ratios.
  - Step completion times, duration analytics, or employee speed measurements.
  - Employee stall histories, pause durations, or friction timelines.
  - Observed application titles, window names, URLs, form field values, or text tokens.
  - Hashes or raw representations of customer data, invoice numbers, or business entities.
  - Persistent tracking keys or tracking handles representing employee habits across sessions.

### Audit Trails and Consequential Records
- **Guidance vs. Execution Audit:** Passive guidance views, step advances, and dismissals are local-only and never emitted to centralized audit logs.
- **Consequential Assist Auditing:** When an employee executes an approved assist plan, the resulting action dispatches and item-level human approvals generate immutable local audit receipts (`action_id`, `execution_context`, `action_sha256`, `authorization_ref`, `approval_ref`, `submission_state`) preserved for 24 months under the organization's approved audit policy.

## Security and threat model

### Threat Scenarios and Defenses
1. **Prompt Injection via Hostile Application Text:** An untrusted web page, email, or invoice document contains adversarial text designed to hijack guidance instructions or trick the assistant into performing unauthorized fund transfers.
   - *Defense:* All card text, step instructions, and explanations are rendered strictly as plain text (no HTML/script evaluation). Model outputs route through LiteLLM with contractual ZDR and cannot generate executable selectors, code, or URLs. Assist actions use pre-approved deterministic action primitives declared in signed application profiles; model inference cannot create new actions or bypass declared risk tiers.
2. **Clickjacking and Bounding Box Manipulation:** Malicious desktop windows or dynamically resizing popups attempt to trick employees into clicking unintended buttons by aligning guidance highlights over sensitive controls.
   - *Defense:* Highlights are rendered exclusively by the native desktop shell using physical desktop coordinates verified against native compositor window bounds. Highlights have a strict 150 ms TTL (max 250 ms), requiring refresh every 100 ms while visible. Any window movement, scroll, resize, or focus shift immediately clears the highlight. Highlighting OS security prompts (UAC, Keychain, sudo) or browser permission dialogs is strictly prohibited.
3. **Guidance Bundle Tampering and Cache Poisoning:** An attacker attempts to inject malicious playbooks into the local guidance cache to mislead operators into following harmful procedures.
   - *Defense:* Guidance bundles (`GuidanceBundleV1`) are signed by the operational graph publisher and verified via content SHA-256 digests upon ingress. Offline access requires an Ed25519-signed `SignedGuidanceAccessLeaseV1` (max 24h validity). Tampered, unsigned, draft, or rejected playbooks fail admission and are quarantined.
4. **Stale Action Replay and Race Conditions:** An employee navigates away from an invoice page, but a delayed assist action executes against the newly navigated page.
   - *Defense:* Action proposals bind canonical `action_sha256` digests incorporating exact `document_generation`, `surface_generation`, and observable before-values (`expected_state`). Target handles expire in 250 ms. Preflight execution verifies that the tab remains reserved, before-values match, and the document generation has not incremented. Any mismatch aborts dispatch.
5. **Surrogate Job Escalation:** An assist plan attempts to claim unrestricted batch agent privileges or bypass human approvals by forging a job identifier.
   - *Defense:* Execution context is a closed tagged union `ExecutionContextV1`. Assist sessions are identified by `kind: "assist"` and cannot access batch orchestrator APIs. Tier 3 consequential actions unconditionally require item-level human approval displaying exact parameter diffs; Tier 4 restricted actions are unconditionally blocked.
6. **Side-Channel Timing and Memory Snooping:** Malicious local software attempts to reconstruct employee keystrokes or passwords from HUD memory.
   - *Defense:* High-entropy tokens, passwords, and sensitive fields are masked upstream before Contract 25 transmission. Volatile buffers operate in non-swappable locked memory and zero out immediately upon expiration (30s TTL in retention-off mode). Keystroke timing and mouse movement trajectories are never captured or logged.

## Test strategy

### Verification Approach
The Local Context HUD and Guided Assistance subsystem is verified through synthetic event stream fixtures, simulated clock environments, mock IPC channels, and deterministic state assertion test suites. Tests execute against public reducer effects and interface contracts without requiring external network connectivity, live cloud provider accounts, or private employee recordings.

### Canonical Acceptance Scenarios

#### Scenario HUD-TEST-01: Repetition Detection Yields Candidate Proposal
- **Identifier:** `HUD-TEST-01`
- **Product Criteria:** [PRODUCT.md §§12.2, 29.1; ORY-011, ORY-012](../../PRODUCT.md)
- **Input/Condition:** Employee completes three separate, substantially similar invoice reconciliation tasks in ERP at timestamps T=0, T=10m, and T=20m within an active 30-minute window. All three tasks follow the same application sequence, contain valid completion evidence, and have no observation gaps.
- **Expected Observable Result:** At T=20m, the HUD produces a proactive card with exact text: `"Repeated work detected — review workflow candidate"`. Card displays candidate objective, observed step count, and a button to review candidate. Clicking review generates `DemonstrationProposalV1` delivered to privacy storage. No batch job is launched, no automated execution occurs, and no unapproved playbook is published to the organization.

#### Scenario HUD-TEST-02: Incomplete or Gapped Examples Suppress Repetition
- **Identifier:** `HUD-TEST-02`
- **Product Criteria:** [PRODUCT.md §29.1; ORY-011](../../PRODUCT.md)
- **Input/Condition:** Employee completes two valid invoice reconciliation tasks at T=0 and T=10m. At T=20m, a third task is attempted but encounters a `ContextGap` during execution, leaving two steps unobserved.
- **Expected Observable Result:** The repetition trigger evaluates the incomplete third task as unproven. The proactive repetition suggestion is completely suppressed; no candidate workflow is proposed, and the compact queue remains at 0 items.

#### Scenario HUD-TEST-03: Recognized Error Code Triggers Published Peer Fix
- **Identifier:** `HUD-TEST-03`
- **Product Criteria:** [PRODUCT.md §§12.2, 12.5, 29.2; ORY-014, ORY-015, ORY-018](../../PRODUCT.md)
- **Input/Condition:** Permitted ERP window displays recognizable error string `"ERR_TAX_DISCREPANCY_401"`. An approved, published peer fix matching this error code exists in the local guidance cache with publisher signature.
- **Expected Observable Result:** The HUD immediately presents a high-priority peer fix card showing normalized error code, plain-text verified resolution instruction, source workflow title, and provenance (`"peer_verified"`). Draft, unapproved, or foreign-team procedures do not appear in results.

#### Scenario HUD-TEST-04: Ambiguous Candidate Match Offers Passive Choice
- **Identifier:** `HUD-TEST-04`
- **Product Criteria:** [PRODUCT.md §§12.3, 29.3; ORY-017, ORY-019](../../PRODUCT.md)
- **Input/Condition:** An application state matches entry signatures for two distinct published playbooks (`pb_po_match_v1` and `pb_po_variance_v2`) with identical confidence, while a third candidate has an explicit prerequisite predicate evaluating to `false`.
- **Expected Observable Result:** The third candidate is excluded immediately. The HUD presents a passive choice card labeled `"Possible related guidance"` listing both matching playbooks with distinct titles and summaries. No automatic selection occurs and no highlight is drawn until the employee explicitly selects one guide.

#### Scenario HUD-TEST-05: Expected State Advances Step; User Click Records Acknowledgment
- **Identifier:** `HUD-TEST-05`
- **Product Criteria:** [PRODUCT.md §§12.4, 29.3; ORY-019](../../PRODUCT.md)
- **Input/Condition:** Active guide is on Step 1 (`step_verify_rate`). Employee performs the manual adjustment. Permitted observation arrives with fresh evidence showing `expected_state_predicate` is satisfied. In a parallel test run, an employee clicks **Confirm Step** before the expected state is observed.
- **Expected Observable Result:** In the observation test, the step advances automatically to Step 2, recording `observed_complete` in the step ledger. In the manual click test, the step advances but records `acknowledged` in the ledger. Neither transition asserts verified external business outcome.

#### Scenario HUD-TEST-06: Snooze Suppresses Category; Critical Policy Warning Bypasses
- **Identifier:** `HUD-TEST-06`
- **Product Criteria:** [PRODUCT.md §§12.1, 12.3, 29.4; ORY-020](../../PRODUCT.md)
- **Input/Condition:** Employee receives an ordinary guidance suggestion at T=0 and clicks **Snooze 1 Hour**. At T=10m, another task in that category is detected. At T=15m, a critical policy warning arrives indicating that a pending batch submission violates an active compliance embargo.
- **Expected Observable Result:** At T=10m, the ordinary suggestion is completely suppressed by snooze. At T=15m, the critical policy warning bypasses the snooze filter immediately, displaying an expanded warning card without stealing keyboard focus.

#### Scenario HUD-TEST-07: Step Friction Triggers Contextual Help Without Surveillance
- **Identifier:** `HUD-TEST-07`
- **Product Criteria:** [PRODUCT.md §29.2; ORY-064](../../PRODUCT.md)
- **Input/Condition:** Active guidance step remains unresolved for 35 continuous seconds while the employee navigates between the work application and permitted documentation four times in 60 seconds.
- **Expected Observable Result:** The HUD presents a nonintrusive troubleshooting hint offering relevant documentation sections. The event is handled strictly in local memory; zero stall histories, employee speed metrics, or step duration logs are written to central telemetry or persistent diagnostics.

#### Scenario HUD-TEST-08: Task Switch Suspends Guide; Explicit Resume Revalidates
- **Identifier:** `HUD-TEST-08`
- **Product Criteria:** [PRODUCT.md §12.4; ORY-019](../../PRODUCT.md)
- **Input/Condition:** Employee has an active guide on an invoice screen. Employee switches window focus to an unrelated chat application. Later, employee returns to the invoice screen and clicks **Resume Guide**.
- **Expected Observable Result:** Upon switching to chat, the guide transitions to `Suspended` and native highlights clear within 100 ms. Upon returning to the invoice window, the card offers **Resume Guide**. Clicking resume re-evaluates access lease, policy revision, and document generation, returning the session to `Active` and restoring highlights. Same-workflow transitions across declared application profiles do not suspend the guide.

#### Scenario HUD-TEST-09: Routine Playbook Update Notifies; Revocation Blocks
- **Identifier:** `HUD-TEST-09`
- **Product Criteria:** [PRODUCT.md §§12.4, 29.7; ORY-017, ORY-068](../../PRODUCT.md)
- **Input/Condition:** While an employee follows Playbook A (version 1.0), version 1.1 is published to the local cache. Separately, in a second run, Playbook A is revoked by security policy.
- **Expected Observable Result:** In the update test, the active guide remains pinned to version 1.0; a nonintrusive banner offers `"Updated version available — restart guide"`. In the revocation test, the active guide transitions to `Invalidated` immediately, clearing highlights and blocking progression.

#### Scenario HUD-TEST-10: Sequence Gap and Baseline Reset Fail Closed
- **Identifier:** `HUD-TEST-10`
- **Product Criteria:** [PRODUCT.md §12.4; ORY-019](../../PRODUCT.md)
- **Input/Condition:** Privacy storage emits `ContextGap` reporting lost sequence numbers 45–52 on the active ERP window.
- **Expected Observable Result:** The HUD immediately halts active step progression on that surface, clears highlights, and marks dependent step status as `unknown`. It issues `RequestContextBaseline` to resynchronize. Other healthy sources (e.g. browser) remain unaffected.

#### Scenario HUD-TEST-11: Browser Target Geometry and Coordinate Translation
- **Identifier:** `HUD-TEST-11`
- **Product Criteria:** [PRODUCT.md §§12.1, 12.4; ORY-019](../../PRODUCT.md)
- **Input/Condition:** Active step targets a web button. `BrowserTargetResult` supplies desktop physical coordinates `(left: 620, top: 450, width: 120, height: 40)` on a secondary display with negative offset coordinates. In a second run, target resolution returns `TARGET_AMBIGUOUS`.
- **Expected Observable Result:** In the valid test, the highlight is rendered at the exact physical desktop coordinates without applying double affine scaling. In the ambiguous test, coordinate highlights are completely suppressed, and the card displays text-only guidance without bounding boxes.

#### Scenario HUD-TEST-12: Cloud Semantic Result Discarded After Deletion or Expiry
- **Identifier:** `HUD-TEST-12`
- **Product Criteria:** [PRODUCT.md §25.11; ORY-071, ORY-072, ORY-073, ORY-074, ORY-075](../../PRODUCT.md)
- **Input/Condition:** `SubmitHudInference` is dispatched for task interpretation. Before response returns, employee purges local history, triggering `ContextFence` with incremented `deletion_generation`. The late inference result arrives 2 seconds later.
- **Expected Observable Result:** The `InferenceCoordinator` detects deletion generation mismatch and discards the late result immediately. Zero prompt/completion data is written to disk, and no suggestion is rendered from the discarded response.

#### Scenario HUD-TEST-13: Retention-Off Volatile Expiry and Reminder Preservation
- **Identifier:** `HUD-TEST-13`
- **Product Criteria:** [PRODUCT.md §§25.1, 29.1, 29.2; ORY-021](../../PRODUCT.md)
- **Input/Condition:** Employee operates with `personal_history_retention=false`. Permitted observation arrives at T=0. At T=30.001s, a task matching attempt is evaluated. Separately, an independently saved meeting commitment reminder is scheduled for T=35s.
- **Expected Observable Result:** At T=30.001s, all observation-derived facts have expired and return empty; repetition suggestions and 35-second step friction detectors are unavailable. At T=35s, the confirmed commitment reminder displays normally as an independently saved obligation with `evidence_status: "unavailable"`.

#### Scenario HUD-TEST-14: Offline Signed Guidance Access Lease Enforces Read-Only
- **Identifier:** `HUD-TEST-14`
- **Product Criteria:** [PRODUCT.md §§12.1, 25.7; ORY-001, ORY-026](../../PRODUCT.md)
- **Input/Condition:** Workstation goes offline with an active `SignedGuidanceAccessLeaseV1` valid for 24 hours. Employee reads a cached playbook and clicks **Fill/Prepare Steps** to start an assist plan. In a second run, the 24-hour lease expires while still offline.
- **Expected Observable Result:** In the valid lease test, guide reading works smoothly, but clicking assist is blocked with `HUD_ASSIST_CAPABILITY_UNAVAILABLE` (offline action execution prohibited). In the expired lease test, cached guidance content is hidden immediately with an explanatory connection notice.

#### Scenario HUD-TEST-15: Process Restart Restores Checkpoint as Suspended
- **Identifier:** `HUD-TEST-15`
- **Product Criteria:** [PRODUCT.md §12.4; ORY-019](../../PRODUCT.md)
- **Input/Condition:** Employee is on Step 3 of a guide; `SaveGuideCheckpoint` committed to encrypted screen partition storage. `oryn-hud-helper` crashes and restarts.
- **Expected Observable Result:** Upon startup, the helper queries `GetGuideCheckpoint`, recovers the saved state, and presents the guide in the `Suspended` state with highlights cleared. Clicking **Resume Guide** revalidates current window identity and resumes Step 3. Unknown execution receipts are never redispatched.

#### Scenario HUD-TEST-16: Assist Plan Execution Preflight and Device Reservation
- **Identifier:** `HUD-TEST-16`
- **Product Criteria:** [PRODUCT.md §§14.2–14.3; ORY-026, ORY-027, ORY-028](../../PRODUCT.md)
- **Input/Condition:** Employee clicks **Start Assist** on an approved playbook. The assist plan has verified Stage 3 release governance approval. A parallel batch job currently holds the device execution reservation.
- **Expected Observable Result:** The assist coordinator attempts `ReserveBrowserExecution`. Because the device is reserved by a running job, the assist reservation is rejected with `HUD_EXECUTION_BUSY`. The HUD presents an informative message and leaves the active document unmutated.

#### Scenario HUD-TEST-17: Tier 3 Preparation Stopping Point and Action Digest Invalidation
- **Identifier:** `HUD-TEST-17`
- **Product Criteria:** [PRODUCT.md §§14.3, 16.6; ORY-026, ORY-070](../../PRODUCT.md)
- **Input/Condition:** An assist plan executes Step 1 (Tier 1 form fill) and reaches Step 2 (Tier 3 invoice commit). In a parallel test, the employee edits the invoice amount in the UI before clicking approve.
- **Expected Observable Result:** Step 1 completes and the plan halts at the pre-declared stopping point before Step 2. The card displays exact parameter diffs and a **Review and Submit** button. In the modification test, changing the amount alters the canonical `action_sha256` digest, immediately invalidating the prior approval token and requiring fresh human approval.

#### Scenario HUD-TEST-18: Ambiguous Dispatch Enters Outcome Unknown Without Retry
- **Identifier:** `HUD-TEST-18`
- **Product Criteria:** [PRODUCT.md §17; ORY-043, ORY-044, ORY-045](../../PRODUCT.md)
- **Input/Condition:** Assist action is dispatched to the browser adapter. Network drops mid-request; browser bridge returns `submission_state: "unknown"`.
- **Expected Observable Result:** The assist session transitions immediately to `Outcome Unknown`. progression is halted, automatic duplicate retries are strictly blocked, and the card instructs the employee to verify the external ERP record manually.

#### Scenario HUD-TEST-19: Confirmed Commitment Schedules Working-Zone Reminder
- **Identifier:** `HUD-TEST-19`
- **Product Criteria:** [PRODUCT.md §§12.2, 29.6; ORY-021](../../PRODUCT.md)
- **Input/Condition:** Meeting Intelligence projects confirmed commitment `"Send PO to Sarah"` with due date `2026-11-13` and time zone `America/New_York`. While waiting, employee edits the meeting transcript span, setting `review_state` to `needs_reconfirmation`.
- **Expected Observable Result:** Commitment is scheduled for 09:00 New York time on Nov 13. When the transcript is edited, `CommitmentProjectionChangeV1` emits `remove` with reason `"needs_reconfirmation"`, and the HUD removes the pending reminder card immediately.

#### Scenario HUD-TEST-20: Helper Crash and Cache Integrity Defense
- **Identifier:** `HUD-TEST-20`
- **Product Criteria:** [PRODUCT.md §§25.7, 31.9; ORY-068, ORY-071](../../PRODUCT.md)
- **Input/Condition:** An attacker modifies a cached guidance bundle JSON file on disk, altering a step URL. In parallel, `oryn-hud-helper` suffers an unhandled panic.
- **Expected Observable Result:** When `contribution-sync` or `GuidanceIndex` loads the modified bundle, content SHA-256 and publisher signature validation fail; the bundle is quarantined and rejected. Upon helper panic, desktop shell clears all highlights within 500 ms; underlying business applications and native observation streams continue running unaffected.

## Performance and operations

### Operational Budgets and Resource Ceilings
The following resource allocations are design budgets established for certification, distinct from live environment measurements:
- **Idle Memory (RSS):** <= 32 MiB resident set size when running with no active guidance session.
- **Active Memory (RSS):** <= 96 MiB resident set size during peak guidance tracking with compiled guidance cache and in-flight inference.
- **Shared Desktop Shell Budget:** Operates strictly within the desktop companion's shared resource budget (idle RSS <= 250 MiB, idle CPU <= 1% of one core across all processes). HUD idle CPU is budgeted at <= 0.2% of one core.
- **Capacity Limits:**
  - Maximum compiled guidance bundle set: **256 bundles** (capped at 16 MiB total compiled index size).
  - Maximum steps per bundle: **128 steps**.
  - Maximum concurrent task hypotheses tracked: **8 hypotheses**.
  - Maximum active surface fact projections: **64 surfaces**.
  - Maximum proactive suggestion queue: **20 entries** (lowest-priority noncritical entries evicted first upon overflow).
  - Maximum observation and fact buffer: **8 MiB** total (including in-flight inference buffers).

### Latency and Timing Targets
- **Reducer Processing Latency:** p95 <= 10 ms per admitted observation batch.
- **Coordinate Translation & Highlight Update:** p95 <= 50 ms from receipt of verified target geometry to presentation frame dispatch.
- **Deterministic Match and Presentation Effect:** p95 <= 200 ms from context transition admission to guidance card presentation (excluding normal observation coalescing window).
- **Normal Observation Coalescing:** Normal screen deltas are coalesced for at most 100 ms to conserve CPU; privacy fences, context exits, and window movements bypass coalescing immediately.
- **Semantic Inference Request Timeout:** 5,000 ms absolute request timeout; effective deadline clamped to the earliest of 5,000 ms, authorization token `not_after`, and input volatile expiration.
- **Privacy Fence Processing:** Ingress privacy fences (`ContextFence`) and clear presentation commands process in <= 100 ms of receipt.
- **Highlight Lifetime and Refresh:** Highlights carry a default TTL of **150 ms** (clamped to 1–250 ms), refreshed every 100 ms while visible.

## Architecture decisions and open questions

### Architectural Decisions (ADR-0009)
The architectural decisions governing this component are formally accepted in [ADR-0009](../adr/0009-local-context-guidance-and-assist-boundaries.md):
1. **Unified Helper with Deterministic Reducer:** Single Rust `oryn-hud-helper` process combining local task understanding and guidance coordination behind a single deterministic reducer (`reduce`), delegating all visual presentation to `desktop-shell`.
2. **Deterministic-First Inference with Governed Cloud Semantic Egress:** Exact-match compiled RAM index handles all real-time suggestions and error matching; cloud semantic interpretation (`text.reason`) handles ambiguous context and summaries under Contract 22. Zero local LLMs on-device.
3. **One Active Resumable Guide with Version Pinning:** One guide per profile, suspended cleanly on task switches or gaps, resumed explicitly by employee command, pinned immutably to version hashes until explicit completion or restart.
4. **Distinct Assist Identity over Common Execution Rails:** `ExecutionContextV1` tagged union (`job` or `assist`) used across reservations, dispatches, authorizations, receipts, and verifications. Stage 3 evaluation gating enforced; guidance approval never grants execution rights.
5. **Signed Read-Only Offline Guidance Lease:** Bounded 24-hour lease (`SignedGuidanceAccessLeaseV1`) permits offline playbook reading; offline new actions are unconditionally blocked.
6. **Encrypted Screen Partition Persistence:** Bounded task summaries and single resumable guide checkpoints stored in existing encrypted screen partitions; absolute 30-second volatile TTL in retention-off mode.

### Resolved Architectural Questions from Grilling Review
- *Why single helper instead of separate task engine and HUD daemon?* Running separate processes doubles process overhead, requires IPC serialization for every fact delta, and introduces race conditions between context detection and guidance tracking. A single process with private modules behind one reducer provides sub-millisecond coordination with minimal memory footprint.
- *How are highlight bounding boxes clamped across complex nested scrolling containers?* The native host and browser extension probe geometry content-free. Coordinates are clipped strictly to the certified visible viewport of the target application window. If an element is partially occluded, scrolled out of view, or ambiguous, coordinate highlights are completely suppressed, and the card falls back to text-only instructions.
- *How does the HUD prevent over-prompting and fatigue?* At most one expanded proactive card appears at any time. Suggestions are deduplicated by category, task ID, and playbook version. Dismissing hides the suggestion for the current task; 1-hour snooze and category mute provide explicit user control. Friction triggers fire at most once per task.
- *How is step completion verified across non-standard desktop UI toolkits?* Expected-state predicates evaluate declared structured business fields or certified application states, never pixel template matching. If an application lacks accessible structured state, the step requires explicit employee confirmation and is recorded as `acknowledged`, never falsely claimed as `observed_complete`.

### Technical Handoff Responses ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Active task hypotheses, local playbook cache matching, guidance presentation model generation, guidance step tracking, and assist coordination.
2. *Data ingress/egress:* Ingests permitted observations (`privacy-context.v1`), cached guidance bundles (`hud.guidance-bundle.v1`), target resolutions, and commitment projections. Outputs presentation models (`shell-hud.v1`), demonstration proposals, inference requests, and assist action requests.
3. *Versions/identities:* Playbook version SHA-256, rule version strings, `ExecutionContextV1` tagged union, presentation revision decimal string, and employee profile UUID.
4. *Upstream failure:* If cloud sync is offline, HUD operates using valid cached playbooks under a signed 24-hour lease. If privacy helper link drops, HUD suspends active guides and clears highlights.
5. *Authority:* The employee is authoritative for acknowledging steps and approving consequential assist actions; identity policy is authoritative for action authorization; operational graph is authoritative for published playbooks.
6. *Testing without private details:* Tested via synthetic event streams, fixture-driven unit tests, mock IPC sockets, and simulated clocks (`HUD-TEST-01` through `HUD-TEST-20`).
7. *Audit and duplicate prevention:* Interactive commands use unique UUIDs with a 256-entry deduplication cache. Consequential assist actions generate immutable execution receipts binding `action_sha256`.
8. *Failure blast radius:* HUD helper crash clears presentation cards and target highlights in desktop shell within 500 ms; underlying business applications, OS observation streams, and desktop status remain unaffected.
9. *v1.0 criteria:* Enables ORY-011, ORY-018, ORY-019, ORY-020, ORY-021, ORY-026, ORY-027, ORY-028, ORY-043, ORY-044, ORY-045, ORY-064, ORY-068, and ORY-070–075 verified through interactive guidance tests.
