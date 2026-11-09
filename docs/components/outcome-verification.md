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
- **Contract Reference #8 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers oracle verification results to [flight-simulator](flight-simulator.md) and [release-governance](release-governance.md).
- **Contract Reference #13 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests submission records and readback evidence from [agent-runtime](agent-runtime.md) and [application-adapters](application-adapters.md) (including local browser action results `BrowserActionResult` from [browser-extension](browser-extension.md)). A `BrowserActionResult.status="completed"` confirms only that the local DOM primitive was dispatched; independent readback is required before issuing `Verified Complete`. An action with `submission_state="unknown"` is classified as `Outcome Unknown`, halting execution and preventing blind retries.
- **Contract Reference #14 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers verification verdicts and mismatch diagnoses to [job-orchestration](job-orchestration.md) and [incident-correction-repair](incident-correction-repair.md).

## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Core verification service running in the execution control plane, isolated from agent runtime workers.
- **Independent Query Authority:** Verifier queries external application readback endpoints directly using dedicated read-only credentials, preventing the runner from spoofing readback data.
- **Model Independence:** Outcome verification is strictly deterministic and rule-based; it does not rely on LLM self-evaluation for numerical or factual postconditions.

## Internal architecture

### Logical Submodules
- **Verification Rule Evaluator:** Evaluates formal predicate assertions against observed business state.
- **Authoritative Readback Orchestrator:** Triggers post-action data fetches via application adapters.
- **Discrepancy Analyzer:** Computes numerical deltas, missing field lists, and state divergence reports.
- **Evidence Bundler:** Compiles cryptographic hashes of raw readback payloads to establish tamper-evident proof.

## State and lifecycle

### State and Persistence
- **Persisted State:** Verification specifications, verdict records, readback evidence digests, and mismatch logs in central persistence.
- **Lifecycle Transitions:** `Awaiting Verification → Fetching Readback → Evaluating Rules → Verdict Issued (Verified / Mismatch / Unknown)`.
- **Verdict Immutability:** Once a verdict is recorded for a case execution, it is immutable; corrections generate new execution records.

## Error and edge-case behavior

### Failure Handling
- **Readback Query Timeout:** If the external system cannot be queried after submission, the verifier emits `Outcome Unknown`.
- **Transient Data Inconsistency:** If an external system exhibits eventual consistency, the verifier supports bounded polling before declaring an outcome unknown.
- **Contradictory Evidence:** If independent readback contradicts adapter receipts, the case is flagged for immediate human review.

## Observability and audit

### Telemetry and Diagnostics
- Emits verification latency metrics, verdict distribution ratios, and readback retry counts.
- Stores full audit traces linking verdicts to specific rule versions and raw readback hashes (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Runner Collusion Resistance:** The verifier treats the agent runner as untrusted; runner execution logs are never accepted as proof without readback evidence.
- **Readback Tampering:** Readback evidence is fetched over authenticated, encrypted channels directly to the verification service.
- **Stale Cache Vulnerability:** Verification queries explicitly bypass application read caches to observe authoritative primary database state.

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
