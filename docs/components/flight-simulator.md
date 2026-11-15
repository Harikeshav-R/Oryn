# Agent Flight Simulator and Evaluation Coordinator Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§6.4–5, 8.4](../../TECHNICAL.md) | [PRODUCT.md §§14.2–3, 15, 28.4; ORY-031–039](../../PRODUCT.md)

### Core Responsibility
The Agent Flight Simulator and Evaluation Coordinator evaluates fixed agent candidate versions and proposed repairs under controlled, representative business scenarios, synthetic test fixtures, and fault injection before release.

### Owns
- The scenario test-suite lifecycle, scenario generation, and test fixture management.
- Test environment provisioning, sandbox isolation, and clean state reset mechanics.
- Evaluation run coordination, failed-case capture, replay trace recording, and version-to-version regression comparison.
- Aggregation of evaluation results, reporting coverage metrics, and identifying verification gaps.

### Consumes
- Immutable candidate agent bundles and verification requirements from [agent-factory-ir](agent-factory-ir.md).
- Proposed repairs and regression requirements from [incident-correction-repair](incident-correction-repair.md).
- Reference scenario definitions and synthetic data sets.
- Independent oracle evaluation verdicts from [outcome-verification](outcome-verification.md).

### Produces
- Comprehensive evaluation reports and coverage gap analyses delivered to [release-governance](release-governance.md).
- Replay traces and step-by-step diffs of failed cases for builder inspection.
- Regression test suite artifacts linked to specific capabilities.

### Does Not Own
- Approving agents for production deployment or overriding release gates (owned by [release-governance](release-governance.md)).
- Business policy definitions or rule approvals (owned by [identity-policy](identity-policy.md)).
- Modifying production enterprise systems or using production write credentials (strictly prohibited).

### Boundary Requirement
Tests must execute using the **exact behaviorally relevant agent definition** intended for production, but inside completely segregated nonproduction authorization and data contexts. Tests cannot perform real-world writes to customer production systems. Every evaluation report must explicitly identify its environment fidelity and coverage limitations; incomplete tests or absent expected outcomes cannot be counted as passes.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§14.2–3, 15, 28.4; ORY-031–039](../../PRODUCT.md))
- **Scenario Management:** Reviewers can generate, edit, accept, and reject test scenarios with defined starting states and expected outcomes (ORY-031).
- **Diverse Scenario Suites:** Evaluation suites must include normal, edge, failure, and policy-restriction scenarios (ORY-032).
- **Distinct Result Classification:** Evaluations report passed, failed, inconclusive, not-run, and expected-safe-escalation cases separately (ORY-033).
- **Business Postcondition Scoring:** A case that finishes steps but fails business postconditions is scored as a failure (ORY-034).
- **Mandatory Policy Gating:** A mandatory policy violation blocks passing readiness even if all other scenarios pass (ORY-035).
- **Replay and Diff Inspection:** Reviewers can inspect failed-case replays showing observed vs. expected differences (ORY-036).
- **Version Comparison:** Compares candidate versions on equivalent scenarios to identify new passes and regressions (ORY-037).
- **Strict Pass Integrity:** Incomplete tests or missing expected outcomes cannot be counted as a pass (ORY-038).
- **Version Lineage Binding:** Evaluation results are immutably bound to exact agent and suite versions (ORY-039).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #7 in [Contracts Catalog](../architecture/contracts/README.md):** For an agent target, ingest `CandidateEvaluationBundleV1` from [agent-factory-ir](agent-factory-ir.md), defined in [`agent-factory-v1.schema.json`](../architecture/contracts/agent-factory-v1.schema.json). Require `evaluation_target.kind = agent` and `evaluation_target.agent_version = agent_version.agent_version_id`. At admission, recompute the canonical body and manifest hashes; verify their tenant, agent, version and manifest bindings, the Ed25519 signature and current publisher-key trust; require a complete registered manifest, current Graph eligibility, supported stage and complete executable prerequisites. A prior compile report or signature cannot bypass revocation. Coverage requirements are suggestions, not passing scenarios. Simulator owns scenarios, coverage and results and cannot mutate the candidate. For an assist-plan target, continue using the independently owned immutable assist plan, its exact `EvaluationTargetV1`, and its complete registered dependency manifest.
- **Contract Reference #8 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers evaluation results, coverage metrics, and gap evidence bound to `EvaluationTargetV1` to [release-governance](release-governance.md).
- **Contract Reference #17 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests new candidate versions and regression requirements from [incident-correction-repair](incident-correction-repair.md).
- **Contract Reference #22 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes `text.reason` via LiteLLM gateway under [cloud-inference](../architecture/cloud-inference.md) for synthetic scenario generation; simulated executions cannot touch production systems or bypass deterministic test oracles.
- **Evaluation Events:** Emits `evaluation.completed` and `evaluation.regression_detected` domain events.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Isolated test cluster running in the simulation execution plane.
- **Production Air-Gap:** Simulation environments use isolated synthetic database replicas and mock endpoints; zero network egress to production business ERPs.
- **Synthetic Test Data:** Operates strictly on synthetic, anonymized fixtures to prevent leakage of sensitive production data into test logs.

## Internal architecture

### Logical Submodules
- **Scenario and Fixture Manager:** Generates, parameterizes, and loads test scenarios and initial application states.
- **Simulation Runner:** Executes agent candidates in isolated containers against synthetic application replicas.
- **Fault Injector:** Injects network timeouts, HTTP 500 errors, corrupted documents, and edge-case application states.
- **Evaluation Aggregator:** Collects oracle results, computes coverage metrics, and generates regression comparison reports.

## State and lifecycle

### State and Persistence
- **Persisted State:** Scenario definitions, test fixtures, evaluation run logs, execution traces, and scorecards in evaluation artifact storage.
- **Lifecycle Transitions:** `Suite Created → Running Scenarios → Evaluating Outcomes → Run Completed → Report Published`.
- **Environment Reset:** Test sandboxes are completely destroyed and reprovisioned between scenario runs to guarantee isolation.

## Error and edge-case behavior

### Failure Handling
- **Environment Provisioning Failure:** Scenarios are marked `Inconclusive (Environment Error)` and rescheduled.
- **Run Timeout:** Agent runs exceeding execution time limits are terminated, scored as failures, and captured for replay.
- **Unexpected Crash:** The runner captures container logs and core dumps, reporting an unhandled execution exception.

## Observability and audit

### Telemetry and Diagnostics
- Captures fine-grained step traces, screenshots of simulated web pages, network request mocks, and execution duration.
- Generates immutable evaluation audit records signed with candidate and scenario hashes (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Simulated Privilege Escalation Testing:** Test suites deliberately attempt prompt injections and policy bypasses to verify runtime defenses.
- **Production Credential Contamination:** Strict credential segregation prevents production API tokens from being mounted in simulation containers.
- **False Confidence Avoidance:** Mocks must accurately emulate external error modes rather than ideal happy paths.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.4: ORY-031–039](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* A candidate agent completes all UI steps in a simulated invoice PO match scenario, but an injected tax rate causes the calculated total to deviate by $0.05 from the expected business postcondition.
  - *Expected Observable Result:* The flight simulator scores the scenario as a Failure; the replay viewer highlights the arithmetic mismatch; overall evaluation readiness is marked Not Passed; the candidate is blocked from release.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- High parallelism allowing 100+ scenario evaluations to complete within minutes.
- Efficient container reuse and lightweight sandbox snapshotting for fast scenario resets.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What scenario definition format best models complex multi-step application states and expected outcomes?
- How should high-fidelity application mocks be maintained as third-party SaaS APIs evolve?
- What heuristic determines sufficient scenario coverage for advancing an agent to Stage 4 autonomy?
- How should non-deterministic LLM reasoning variations be handled in deterministic pass/fail grading?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Scenario suites, simulation sandboxes, fixture reset mechanics, and evaluation reports.
2. *Data ingress/egress:* Ingests agent candidates and regression suites; outputs evaluation scorecards and replay traces.
3. *Versions/identities:* Evaluation Run ID, Candidate Agent UUID, Scenario Suite Version, and Benchmark Dataset ID.
4. *Upstream failure:* If candidate bundle fails schema validation, simulator rejects evaluation run immediately.
5. *Authority:* [outcome-verification](outcome-verification.md) provides authoritative oracle scoring; [release-governance](release-governance.md) decides release.
6. *Testing without private details:* Tested via self-evaluating meta-test suites and synthetic agent definitions.
7. *Audit and duplicate prevention:* Evaluation scorecards are cryptographically signed and immutable.
8. *Failure blast radius:* Simulation failure blocks candidate promotion; has zero impact on active production jobs.
9. *v1.0 criteria:* Enables ORY-031, ORY-032, ORY-033, ORY-034, ORY-035, ORY-036, ORY-037, ORY-038, and ORY-039.
