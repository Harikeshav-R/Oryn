# Local Context Guidance and Assist Boundaries

**Status:** accepted  
**Date:** 2026-11-09  
**Deciders:** Architecture and Security Review  
**Amended by:** [ADR-0010](0010-contribution-delivery-and-guidance-sync.md), [ADR-0011](0011-identity-authority-and-approval-fencing.md), [ADR-0019](0019-flight-simulator-isolation-and-evaluation-evidence.md), [ADR-0022](0022-release-eligibility-and-rollout-governance.md)  

## Context
Oryn provides employees with real-time contextual guidance, peer error fixes, commitment reminders, and supervised assistance during desktop and browser work. Designing the boundary between local context understanding and execution assistance involves key architectural tensions:
1. Balancing responsive contextual recommendations with endpoint CPU/memory constraints and cloud inference governance (Contract 22 mandates cloud-only AI in v1.0).
2. Distinguishing guidance from execution authority (PRODUCT §12, §14): reading a playbook or acknowledging a step must not authorize autonomous mutations, while assisted execution must obey strict risk tiers (ORY-026–028).
3. Maintaining offline productivity without opening permanent authorization loopholes or running unauthorized offline actions.
4. Supporting crash recovery and session resumption without persisting sensitive unredacted form data or shadow browsing history.

## Decision
1. **Single Helper with Deterministic Reducer:** Implement both local task understanding and guidance coordination within a single user-space helper (`oryn-hud-helper`), private behind one deterministic reducer: `reduce(state: HudState, input: HudInput, now: MonotonicInstant) -> HudTransition`. All visual presentation and click-through highlights are delegated to the native desktop shell (`shell-hud.v1`, major 1, minor 0).
2. **Deterministic-First Inference with Governed Cloud Semantic Processing:** Context matching uses an exact, in-memory index compiled from access-filtered published bundles. Bounded semantic interpretation (`text.reason`) is scheduled through the Privacy Helper edge client under Contract 22 (purposes: `hud_context_interpretation`, `hud_demonstration_summary`, `hud_step_explanation`; 5,000 ms timeout, 1 in-flight limit, 16 KiB input cap, 8 KiB output cap). No on-device LLM runtime exists in v1.0.
3. **One Resumable Guide with Version Pinning:** The HUD tracks at most one active guide per profile. Switching tasks or encountering an observation gap suspends the guide and clears highlights; resumption requires an explicit employee command and revalidation. Playbook updates notify the user without silently repinning active sessions; safety revocations invalidate immediately.
4. **Distinct Assist Identity over Common Execution Rails:** Assist plans (`AssistPlanV1`) are immutable objects in published guidance bundles requiring independent Stage 3 evaluation and release governance approval; guidance approval never grants assist execution rights. All execution requests, reservations, authorizations, receipts, and verifications bind `ExecutionContextV1`:
   ```
   { kind: "job", job_id: string, case_id: string, agent_version: string }
   | { kind: "assist", assist_session_id: string, assist_plan_id: string,
       assist_plan_version: string, playbook_version: string }
   ```
   Local browser execution uses `browser-bridge.v1` (major 1, minor 2 with `assist_execution_v1`), verifying a canonical `action_sha256` digest covering live document and surface generations. Consequential Tier 3 actions require an explicit item-level Review and Submit gesture displaying parameter diffs.
5. **Signed Read-Only Offline Guidance Lease:** Offline guidance reads are permitted strictly under a signed `SignedGuidanceAccessLeaseV1` (max 24 hours). Executing new assisted or autonomous actions is strictly prohibited while offline.
6. **Private Screen-Partition State:** Bounded task summaries (`PrivateTaskSummaryV1`) and at most one resumable checkpoint (`GuideCheckpointV1`, capped at 24 hours) are stored in the Privacy Helper's encrypted screen partition databases. When `personal_history_retention=false`, all observation-derived facts and checkpoints operate ephemerally with an absolute 30-second TTL in volatile memory.

## Rationale and Alternatives
- *Rejected Alternative 1: Request-Only Inference:* Forcing all semantic interpretation to be manually triggered prevents valuable proactive error resolution and repetition detection. Bounded, debounced background requests (max 120/hr, 1 in-flight) provide assistance while enforcing strict cloud cost and bandwidth ceilings.
- *Rejected Alternative 2: Multiple Simultaneous Active Guides:* Tracking parallel guides across multiple windows creates confusing UI clutter, ambiguous target highlights, and divided employee attention. Limiting to one active guide with clean suspension on task switches ensures focus and deterministic recovery.
- *Rejected Alternative 3: Compulsory Agent Job Macros:* Treating assisted execution as synthetic batch agent jobs creates artificial job/case identifiers and bypasses the interactive nature of assisted work. Using the tagged union `ExecutionContextV1` allows both batch jobs and interactive assists to share identical deterministic adapter actuation, preflight verification, and receipt logging without compromising governance.
- *Rejected Alternative 4: Online-Only Guidance:* Forbidding offline playbook access impairs mobile or traveling employees. Authorizing offline cached reads through signed leases capped at 24 hours preserves productivity while strictly preventing unauthorized offline actions.
- *Rejected Alternative 5: Memory-Only Restart State:* Losing all guide progress upon transient process crashes or desktop reboots frustrates users. Storing bounded checkpoints in existing encrypted screen partitions enables safe resumption without creating new unmanaged databases.
- *Rejected Alternative 6: Restart-on-Every-Version:* Silently restarting or repinning active guides on minor playbook updates causes unexpected state transitions mid-task. Pinning the active version until explicit completion or restart ensures workflow stability.

## Consequences
- `browser-bridge.v1` bumps to major 1, minor 2, adding `assist_execution_v1` capability and requiring `ExecutionContextV1` in reservation and action messages.
- `privacy-context.v1` (major 1, minor 1) establishes direct helper-to-helper communication between `oryn-privacy-helper` and `oryn-hud-helper`. *(Scope Amendment — 2026-11-09): [ADR-0013](0013-workflow-discovery-evidence-and-review-boundaries.md) amends Contract 25 (`privacy-context.v1`) to negotiate `protocol_major: 1`, `protocol_minor: 2`, adding task-level duration proposals (`task_measurement`) and helper-minted shared demonstration identity.*
- `identity-policy` issues Ed25519-signed `SignedGuidanceAccessLeaseV1` artifacts and validates `ExecutionContextV1` in action authorization tokens using dual digests (`action_sha256` and `proposal_digest`) under Contract 11 (see [ADR-0011](0011-identity-authority-and-approval-fencing.md)).
- `browser-bridge.v1` advances to major 1, minor 3 with capability `identity_authority_v1` under Contract 12, passing the complete `{authorization, approval, admission}` authority bundle.
- `flight-simulator` and `release-governance` evaluate and gate assist plans using `EvaluationTargetV1` before publishing eligibility to `operational-graph`.
- `outcome-verification` validates postconditions for both batch jobs and assist sessions using `ExecutionContextV1`.
- `desktop-shell` renders guidance cards and highlights over `shell-hud.v1` (major 1, minor 0).

*(Scope Amendment — 2026-11-14): [ADR-0016](0016-application-adapter-qualification-and-dispatch-boundaries.md) amends execution reservation and native actuation: unifies local execution reservation under `LocalExecutionReservationBroker` managed by Privacy Helper, preventing concurrent browser or native actuation across jobs and assists. Restricts native automation strictly to Stage 3 semantic actuation under Shell supervision via `shell-adapter.v1` (major 1, minor 0).*

*(Scope Amendment — 2026-11-15): [ADR-0019](0019-flight-simulator-isolation-and-evaluation-evidence.md) defines immutable `AssistExecutableBodyV1` (`guidance.assist-executable-body.v1`) and canonical preimage `plan_sha256 = SHA256(RFC8785(AssistExecutableBodyV1))`. Published `AssistPlanV1` binds `{body, plan_sha256, owner_approval_ref, eligibility}`. Actions declare explicit `action_id`, `argument_bindings`, `result_bindings`, `capability_ref`, `adapter_operation_id`, and `verification_requirement_ids`. Assist evaluation bundles (`AssistEvaluationBundleV1`) are evaluated in Flight Simulator via the identical deterministic reducer seam `reduce(state, input, now)` against scripted presentation inputs on enrolled lab devices. Desktop Shell protocol baseline advances to `shell-hud.v1` major 1, minor 1 (negotiating `assist_executable_body_v1` and `evaluation_execution_v1`).*

*(Scope Amendment — 2026-11-16): [ADR-0022](0022-release-eligibility-and-rollout-governance.md) replaces unsigned `AssistPlanEligibilityV1` in `AssistPlanV1.eligibility` with release-signed `SignedAssistReleaseEligibilityV1` (`release.assist-eligibility.v1`), signed by Vault with purpose `policy`. Extends `ExecutionContextV1` assist arm with required `release_id: Uuid`, `release_cohort_id: Identifier`, `release_eligibility_generation: U64`, and `plan_sha256: Sha256Hex`, binding assist execution and action consumption strictly to the approved release cohort and live generation.*


