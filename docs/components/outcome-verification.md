# Independent Outcome Verification and Test Oracle Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§6.6, 9.4, 11.4](../../TECHNICAL.md) | [PRODUCT.md §§15.7, 17, 16.7; ORY-034, ORY-043–044](../../PRODUCT.md)

### Core Responsibility
Independent Outcome Verification and Test Oracle determines whether the **business effect** of an agent action or case matches authorized postconditions and business rules, or whether the result is incomplete, incorrect, or unknown.

### Owns
- The formal verification specification schema and execution engine.
- Independent evidence collection and authoritative external readback query execution.
- Deterministic verification verdicts (`Verified Complete`, `Business Incorrect`, `Expectedly Rejected`, `Outcome Unknown`).
- Verification mismatch descriptions, discrepancy quantification, and evidence traceability.

### Consumes
- Expected business postconditions from [agent-factory-ir](agent-factory-ir.md) and [operational-graph](operational-graph.md).
- Action submission receipts and observed data from [agent-runtime](agent-runtime.md) and [application-adapters](application-adapters.md).
- Authoritative state readback queries executed against external systems or simulation environments.
- Target scenario expected outcomes when operating in simulation mode.

### Produces
- Formal verification verdicts delivered to [job-orchestration](job-orchestration.md) to authorize case completion.
- Verification mismatch reports and failure evidence delivered to [incident-correction-repair](incident-correction-repair.md).
- Oracle evaluation results delivered to [flight-simulator](flight-simulator.md).

### Does Not Own
- Deciding which UI actions the agent should execute (owned by [agent-runtime](agent-runtime.md)).
- Granting action authorization under security policies (owned by [identity-policy](identity-policy.md)).
- Accepting agent self-declarations or UI success banners as proof of business completion.
- Assessing historical human demonstrations submitted during procedural discovery (`DemonstrationVerificationV1`, owned by [workflow-discovery](workflow-discovery.md)); human demonstration assessments provide read-only evidence references to Operational Graph and do not substitute for runtime postcondition verification during autonomous execution.

### Boundary Requirement
An independent authoritative readback is preferred over runner self-reporting. An unconfirmable or ambiguous consequential write is strictly classified as **Outcome Unknown**, not success. The production verifier and simulation oracle share identical business semantics while independently evaluating their respective state sources. Unknown outcomes must halt execution and block blind retries.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§15.7, 17, 16.7; ORY-034, ORY-043–044](../../PRODUCT.md))
- **Postcondition Verification Scoring:** A case that executes all steps but fails required business postconditions must be scored as a failure (ORY-034).
- **Prohibition of Self-Certification:** An action submission cannot be marked Verified Complete based solely on runner execution success; independent verification is mandatory (ORY-043).
- **Hold on Uncertain Outcomes:** When verification cannot confirm an external write, the outcome is flagged as uncertain, and automatic duplicate retries are blocked (ORY-044).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Compile-time verification catalog:** Advertises owner-defined verification specifications, postcondition predicates, and readback bindings to [agent-factory-ir](agent-factory-ir.md). This catalog does not replace Contract 7, the Factory-to-Simulator candidate bundle. Wire schema: [`outcome-verification-v1.schema.json`](../architecture/contracts/outcome-verification-v1.schema.json) (`$id: urn:oryn:schemas:outcome-verification:v1`).
  - **Projections for Agent Factory Compilation:** Exposes immutable `VerificationSpecProjectionV1` (`verification.spec-projection.v1`) and live `VerificationSpecStatusV1` through pure read interface `VerificationCatalogPort`:
    ```rust
    pub trait VerificationCatalogPort: Send + Sync {
        fn projections<'a>(
            &'a self,
            principal: &'a VerifiedPrincipal,
            references: &'a [KnowledgeVersionRefV1],
        ) -> impl Future<Output = Result<Vec<VerificationSpecProjectionV1>, VerificationCatalogError>> + Send + 'a;

        fn statuses<'a>(
            &'a self,
            principal: &'a VerifiedPrincipal,
            references: &'a [KnowledgeVersionRefV1],
        ) -> impl Future<Output = Result<Vec<VerificationSpecStatusV1>, VerificationCatalogError>> + Send + 'a;
    }
    ```
  - **Authoritative Boundary:** Missing or unknown projection references remain explicit qualification blockers. A proposed verification requirement (`VerificationRequirementV1`) may be drafted without a spec reference, but cannot prove execution readiness. Factory never invents an authoritative verification specification.
  - **Binding and verdicts:** The specification reference has `entity_kind = verification_spec` and hashes the RFC 8785 canonical projection body. Each postcondition ID must exist in the pinned source capability. `system_evidence` requires both readback bindings and no reviewer role; `authorized_reviewer` requires a reviewer role, no readback bindings, and supports Stage 3 only. Approval to commit is not an independent postcondition assessment. Predicates use Graph `BusinessConditionV1`, fact definitions, verified-source requirements, and three-valued evaluation. This projection defines discovery and binding, not polling or checkpoint implementation.
- **Contract Reference #8 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers oracle verification results to [flight-simulator](flight-simulator.md) and [release-governance](release-governance.md).
- **Contract Reference #13 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests submission records (`AdapterSubmissionReceiptV1`) and readback evidence (`SignedAdapterReadbackEvidenceV1`) from [agent-runtime](agent-runtime.md) and [application-adapters](application-adapters.md) under wire schema [`application-adapters-v1.schema.json`](../architecture/contracts/application-adapters-v1.schema.json) (Contract 13), bound to `ExecutionContextV1` (`job` or `assist`). The verifier alone owns source priority, freshness predicates, bounded polling, and final verdicts. The adapter executes one bounded fetch per request (`AdapterReadbackRequestV1`), returning signed evidence, never an authoritative business completion stamp. A `BrowserActionResult.status="completed"` confirms only that the local DOM primitive was dispatched; independent readback is required before issuing `Verified Complete`. An action with `submission_state="unknown"` is classified as `Outcome Unknown`, halting execution and preventing blind retries.
- **Contract Reference #14 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers verification verdicts and mismatch diagnoses to [job-orchestration](job-orchestration.md) (for batch agent jobs) and to the assist owner / [local-context-hud](local-context-hud.md) (for HUD assist sessions) and [incident-correction-repair](incident-correction-repair.md).
- **Contract Reference #22 Reference:** Model assistance (`text.reason`) for verification interpretation routes through LiteLLM under [cloud-inference](../architecture/cloud-inference.md); model judgment alone cannot certify business correctness; authoritative readback and deterministic oracle checks are required.
- **Human Demonstration Assessment Read-Only Boundary:** Postcondition assessments of human demonstrations (`DemonstrationVerificationV1` under Contract 4) establish whether a historical human Task Instance achieved verified business postconditions during procedural discovery. These assessments provide read-only evidence references in [operational-graph](operational-graph.md) and do NOT substitute for runtime Outcome Verification (Contracts 13 and 14) during autonomous agent execution.
- **Handoff Completion Assessment Boundary:** Independent system postcondition verifications for inter-team handoff obligations (`graph_handoff_assessment` with `method = "system_evidence"`) are evaluated by Outcome Verification against authoritative application readbacks. The resulting structured verdict (`verified`, `contradicted`, `unknown`) is delivered to [operational-graph](operational-graph.md) to govern completion of the canonical `graph_handoff` obligation.

### Process and Security Boundaries
- **Deployment Location:** Core verification service running in the execution control plane, isolated from agent runtime workers.
- **Independent Query Authority:** Verifier dispatches readback queries using independent readback-role authority with dedicated vendor read-only credentials when supported, or certified L7 read-only enforcement for broader grants. Each poll is an independently authorized bounded read; no mutation fence is reopened.
- **Model Independence:** Outcome verification is strictly deterministic and rule-based; it does not rely on LLM self-evaluation for numerical or factual postconditions.

## Internal architecture

### Logical Submodules
- **Verification Rule Evaluator:** Evaluates formal predicate assertions against observed business state using Graph `BusinessConditionV1` and three-valued logic.
- **Authoritative Readback Orchestrator:** Triggers post-action data fetches via application adapters (`AdapterReadbackRequestV1`).
- **Discrepancy Analyzer:** Computes numerical deltas, missing field lists, and state divergence reports.
- **Evidence Bundler:** Compiles cryptographic hashes of raw readback payloads to establish tamper-evident proof (`SignedAdapterReadbackEvidenceV1`).

### Runtime Verification Execution Port (`VerificationExecutionPort`)
Agent Runtime workers submit and poll verification requests via the asynchronous `VerificationExecutionPort`:

```rust
pub trait VerificationExecutionPort: Send + Sync {
    fn request<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        request: VerificationRunRequestV1,
    ) -> impl Future<Output = Result<VerificationRunStatusV1, VerificationErrorV1>> + Send + 'a;

    fn status<'a>(
        &'a self,
        principal: &'a VerifiedPrincipal,
        query: VerificationStatusQueryV1,
    ) -> impl Future<Output = Result<VerificationRunStatusV1, VerificationErrorV1>> + Send + 'a;
}
```

#### Protocol Exchange & Schemas
- **Run Request (`VerificationRunRequestV1`):**
  `{schema_id: "verification.run-request.v1", request_id, organization_id, execution_context, evaluation_target, behavior_sha256, requirement_ids, action_ids, checkpoint_revision, environment, scenario_expectation_ref}`.
  - `evaluation_target`: Required `EvaluationTargetV1` (closed union: `{ kind: "agent", agent_version: UUID }` or `{ kind: "assist_plan", assist_plan_id, assist_plan_version, plan_sha256, playbook_version }`). Replaces the obsolete request-only `agent_version_id` field.
  - `scenario_expectation_ref`: Nullable `ScenarioExpectationRefV1` (`{ suite_version_id, scenario_version_id, expected_result_sha256, attempt_id }`). Production callers pass `null`; simulation callers pass the exact sealed expectation issued by Flight Simulator. The Verifier independently resolves expectations from authoritative owner sources rather than trusting runner-asserted values.
- **Status Query (`VerificationStatusQueryV1`):**
  `{schema_id: "verification.status-query.v1", organization_id, execution_context, request_id}`.
- **Status Response (`VerificationRunStatusV1`):** Closed union:
  - `{schema_id: "verification.run-status.v1", state: "pending", request_id}`
  - `{schema_id: "verification.run-status.v1", state: "complete", result: VerificationRunResultV1}`
- **Run Result (`VerificationRunResultV1`):**
  `{schema_id: "verification.run-result.v1", request_id, verification_id, organization_id, execution_context, behavior_sha256, requirement_results, verdict, evidence_refs, verified_at}`.
  - Each item in `requirement_results` (`RequirementResultV1`): `{requirement_id, verdict, evidence_refs, limitations}`. Verdicts: `verified`, `mismatch`, `unknown`.
  - **Aggregate Verdict Rule:** `mismatch` if any required result is `mismatch`; `unknown` if none mismatch but any is `unknown`; otherwise `verified`. Missing requirements cannot produce `verified`.
- **Closed Error Codes (`VerificationErrorV1`):** `{code, request_id}` with closed variants `VERIFICATION_NOT_AUTHORIZED`, `VERIFICATION_INPUT_INVALID`, `VERIFICATION_UNAVAILABLE`, `VERIFICATION_REQUEST_CONFLICT`.
- **Bounds:** `requirement_ids`, `action_ids`, and `evidence_refs` cap at 256 items. `limitations` caps at 32 strings of at most 1024 characters.
- **Idempotency & Orchestrator Governance:** The Verifier owns durable request deduplication by `request_id`. Job Orchestration retrieves verifier-owned records rather than accepting a worker's self-claimed verdict. Mandatory `on_unknown`/`on_mismatch` triggers `pause_case` (halting runner execution to prevent subsequent mutations) while setting the case's authoritative wire state to `Failed` (for mismatch) or `Outcome Unknown` (for unknown), reconciling honest batch reporting with immediate execution safety.

## State and lifecycle

### State and Persistence
- **Persisted State:** Verification specifications, verdict records, readback evidence digests, and mismatch logs in central persistence.
- **Lifecycle Transitions:** `Awaiting Verification → Fetching Readback → Evaluating Rules → Verdict Issued (Verified / Mismatch / Unknown)`.
- **Verdict Immutability & Readback Records:** Once a verdict (`VerificationRunResultV1`) is recorded, it is immutable; it is never overwritten or deleted. Subsequent readback evaluations generate distinct verification-run records (`VerificationRunRequestV1` -> `VerificationRunResultV1`) with new request and result IDs for read-only re-evaluation. An actual new mutation attempt additionally requires an owner-authorized runtime continuation with a new action generation. If a later readback proves that the original mutation effect is verified correct, Job Orchestration may project the case's current state to `Verified Complete` based on that later verdict without rewriting earlier immutable verdict history.

## Error and edge-case behavior

### Failure Handling
- **Readback Query Timeout:** If the external system cannot be queried after submission within operational deadlines (default read/preflight deadline 5 seconds, max 30 seconds), the verifier emits `Outcome Unknown`.
- **Transient Data Inconsistency:** If an external system exhibits eventual consistency, the verifier supports bounded polling against declared `observed_after` timestamps before declaring an outcome unknown. It does not promise unmediated direct primary-database access; readbacks report the authoritative endpoint, observed version/timestamp, and consistency limits (`authoritative`, `eventual`, `unknown`).
- **Contradictory Evidence:** If independent readback contradicts adapter receipts, the case is flagged for immediate human review.

## Observability and audit

### Telemetry and Diagnostics
- Emits verification latency metrics, verdict distribution ratios, and readback retry counts.
- Stores full audit traces linking verdicts to specific rule versions and raw readback hashes (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Runner Collusion Resistance:** The verifier treats the agent runner as untrusted; runner execution logs are never accepted as proof without readback evidence.
- **Readback Tampering:** Readback evidence is fetched over authenticated, encrypted channels directly to the verification service via out-of-process credential egress.
- **Consistency Boundaries:** Verification queries target certified authoritative endpoints and evaluate provider-versioned timestamps and consistency metadata rather than claiming universal cache bypass.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.4: ORY-034; §31.5: ORY-043, ORY-044](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* An agent runner reports that an invoice status was updated to Approved in the ERP; the independent verifier executes a readback query and discovers the invoice status remains Pending in the ERP database.
  - *Expected Observable Result:* The verifier emits a `Business Incorrect (Mismatch)` verdict; the case is transitioned to Failed in job orchestration; an incident is immediately triggered with the readback evidence attached.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Low-latency postcondition evaluation (sub-200ms once readback data is available).
- Intelligent backoff and jitter for readback queries on eventually consistent external systems.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What domain-specific language (e.g., JSONSchema assertions, SQL predicates, or custom AST) best defines business verification postconditions?
- How should outcome verification handle third-party systems that provide no readback APIs or audit trails?
- What polling and reconciliation window is appropriate for applications with significant eventual consistency lag?
- How should human-in-the-loop review be integrated when an outcome verdict remains permanently unknown?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Verification specification execution, authoritative readback evaluation, and correctness verdicts.
2. *Data ingress/egress:* Ingests expected postconditions and readback data; outputs immutable verification verdicts and mismatch reports.
3. *Versions/identities:* Verification Spec ID, Rule Version UUID, Case ID, and Readback Digest Hash.
4. *Upstream failure:* If readback data is missing or corrupted, verifier emits `Outcome Unknown` to block further actions.
5. *Authority:* The verifier is the sole authority for business correctness of executed actions.
6. *Testing without private details:* Tested via synthetic business state models and automated assertion test matrices.
7. *Audit and duplicate prevention:* Every verdict is cryptographically hashed with its supporting evidence payload.
8. *Failure blast radius:* Verifier failure blocks case completion; fails closed to prevent unverified actions from committing.
9. *v1.0 criteria:* Enables ORY-034, ORY-043, and ORY-044 verified through postcondition mismatch and timeout tests.
