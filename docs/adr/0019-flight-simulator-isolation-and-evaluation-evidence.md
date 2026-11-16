# 0019. Flight Simulator Isolation and Evaluation Evidence

Date: 2026-11-15

## Status

Accepted

Amends:
- [0009-local-context-guidance-and-assist-boundaries.md](0009-local-context-guidance-and-assist-boundaries.md) (Assist plan executable body, canonical `plan_sha256` preimage, `shell-hud.v1` minor 1, and HUD reducer simulation evaluation).
- [0011-identity-authority-and-approval-fencing.md](0011-identity-authority-and-approval-fencing.md) (`ExecutionContextV1` evaluation variant, test-realm scripted actors, `SignedSimulationAdmissionV1`, and dedicated `evaluation` key purpose).
- [0015-agent-factory-ir-and-candidate-qualification.md](0015-agent-factory-ir-and-candidate-qualification.md) (Sealed candidate evaluation bundle verification, `SimulationRegressionRequirementRefV1` lineage, and regression variation suites).
- [0016-application-adapter-qualification-and-dispatch-boundaries.md](0016-application-adapter-qualification-and-dispatch-boundaries.md) (`AdapterEnvironmentBindingV1` with `production_equivalence_status`, `browser-bridge.v1` minor 6, and `shell-adapter.v1` minor 2).
- [0017-agent-runtime-execution-and-recovery.md](0017-agent-runtime-execution-and-recovery.md) (`RuntimeExecutionContextV1`, strict `job -> production` and `evaluation -> simulation` constraints, and `shell-runtime.v1` minor 1).
- [0018-job-orchestration-and-scheduling.md](0018-job-orchestration-and-scheduling.md) (`orchestration_execution` table DDL amended with `environment` and `evaluation_attempt_id`).

Amended by:
- [0022-release-eligibility-and-rollout-governance.md](0022-release-eligibility-and-rollout-governance.md) (Simulator report `requested_stage: [3, 4]` retained; Stage 5 release is a composite governance check reading Stage 4 report plus repair bindings/obligations; clarifies 30-day adapter qualification validity vs. waiting periods).

## Context

Oryn requires a rigorous, reproducible, and isolated evaluation subsystem—the Flight Simulator—to evaluate candidate agents and assist plans against representative business scenarios before production release.

Evaluating autonomous candidates introduces severe architectural tensions:
1. **Behavioral Fidelity vs. Safety:** Candidates must execute their real decision logic and model prompts without mutating live production systems or exposing live customer credentials.
2. **Scenario Expressiveness vs. Security:** Scenarios must specify rich boundary conditions, starting states, and fault plans without introducing executable test scripts or unverified sandbox DSLs that could escape sandbox containment.
3. **Model Non-Determinism vs. Certification:** Stochastic LLM outputs can produce intermittent passes; candidate readiness cannot rely on lucky single runs or majority voting.
4. **Execution Authority vs. Audit Truthfulness:** Simulated actions need realistic policy evaluation, approvals, and error handling without fabricating fake production jobs, releases, employee session MFA, or supervised history.
5. **Pre-Production Testing vs. Production Equivalence:** Organizations need to evaluate candidate behavior before third-party production credentials or accounts are configured, while preventing pre-production test passes from masquerading as production readiness.

## Decision

### 1. Closed Declarative Scenarios and Canonical Fingerprinting
Scenarios are strictly closed Draft 2020-12 declarative JSON specifications (`ScenarioVersionV1` / `simulation.scenario-version.v1`):
- All scenario members (starting state, inputs, expected disposition, postconditions, invariants, principal profiles, human scripts, and fault plans) are declarative data structures. Executable test scripts, dynamic scenario DSLs, and embedded SQL are strictly prohibited.
- Unique scenario distinctness is established by a canonical semantic fingerprint (`semantic_sha256 = SHA256(RFC8785(semantic_projection))`) that normalizes physical database record IDs and display labels while strictly preserving business thresholds, list ordering, document variants, and fault behaviors. Changing a test seed or record ID alone does not inflate scenario counts.
- Scenario suites (`ScenarioSuiteVersionV1`) are immutable, ordered collections of scenario and fixture references sealed by an authorized Workflow Owner or delegate (`SuiteSealReceiptV1`). Every member scenario in a sealed readiness suite is mandatory.

### 2. Dual-Engine Reuse with Honest Evaluation Context
Evaluation executes candidates using their identical production behavior interpreters, avoiding divergence from forked test runtimes:
- **Agents:** Executed by `oryn-runtime-core` supervised via Job Orchestration's generalized `orchestration_execution` table.
- **Assist Plans:** Executed by `oryn-hud-helper`'s deterministic local reducer seam `reduce(state, input, now)` against scripted presentation inputs.
- **Honest Context:** Evaluated candidates execute under an explicit `ExecutionContextV1::Evaluation` variant:
  `{kind: "evaluation", evaluation_id, scenario_version_id, attempt_id, evaluation_target}`.
- **Pre-Release Admission:** Identity issues `SignedSimulationAdmissionV1` (`identity.simulation-admission.v1`) under the `policy` purpose (maximum 5-minute validity). Evaluating candidates requires no fabricated production jobs, fake releases, or artificial supervised history.
- **Test-Realm Actors:** Scripted simulation actors reside in an Identity-owned test realm. Simulated approvals evaluate real policy rules and one-use fences but are permanently labeled simulated and never count toward human example or supervised case minimums. Tier 4 restricted actions remain unconditionally denied.

### 3. Strict Host Isolation: Fresh Cloud Sandboxes and Dedicated Lab Devices
- **Cloud Attempts:** Every cloud attempt executes in a fresh, single-use **gVisor** sandbox container (`runsc`, UID 10001, 1 vCPU, 512 MiB RAM limit, 16 MiB memory-only scratch). Container reuse across attempts is prohibited.
- **Device-Bound Attempts:** Scenarios requiring browser or native desktop UI execute exclusively on dedicated, enrolled Windows/macOS lab devices (`identity_simulation_lab_device`). Execution on ordinary employee workstations is prohibited.
- **Reservation Broker:** Local device actuation requires exclusive reservations via `LocalExecutionReservationBroker` holding `{kind: "evaluation", attempt_id, assignment_id, assignment_epoch}` across `browser-bridge.v1` (major 1, minor 6) and `shell-adapter.v1` (major 1, minor 2).
- **Vendor Sandboxes:** Vendor sandboxes require certified, independently verified reset proof. Unverifiable cleanup or unknown external submissions quarantine the vendor scope immediately. Direct worker internet egress is blocked; all traffic routes through `AdapterEgressBroker`.

### 4. Three Independent Live Model Attempts with All-Pass Aggregation
To prevent stochastic passes from certifying unreliable agents:
- Model-dependent scenarios prescribe exactly three independent live execution attempts under identical pinned model routes, templates, and settings.
- **All-Pass Aggregation:** The scenario passes if and only if **all three** prescribed attempt slots achieve the expected passing verdict. A 2/3 majority pass is rejected as a failure.
- Deterministic (model-free) scenarios execute a single trial.
- Diagnostic replays (`recorded_diagnostic`) replay validated typed results for regression debugging but confer zero release-readiness coverage.

### 5. Decoupling Behavioral Passage from Production Equivalence
`AdapterEnvironmentBindingV1` decouples behavioral qualification from production deployment readiness:
- Supports `production_equivalence_status: "established" | "not_established"`.
- Missing production qualification (`not_established`) allows candidate behavioral evaluation in Flight Simulator, but Release Governance strictly blocks production deployment until production equivalence is established and verified.
- Establishing production equivalence modifies the environment binding and requires a fresh, complete sealed evaluation run; retrofitting or stitching earlier reports is strictly prohibited.

### 6. Cryptographic Evidence Integrity and Tiered Retention
- **Dedicated Keys:** Suite seals and evaluation reports are signed by a dedicated HashiCorp Vault `evaluation` trust-key purpose (`SignedEvaluationReportV1`, max 64 KiB envelope). Evaluation keys cannot verify as Factory compiler publishers, Identity policy signers, or production release approval keys.
- **Independent Oracle:** Outcome Verification independently inspects business outcomes against sealed expectations (`ScenarioExpectationRefV1`). Runner self-reports cannot determine verdicts.
- **Tiered Retention:**
  - Signed reports (`SignedEvaluationReportV1`), suite seals, and content-free approval records are retained for **24 months** under compliance audit policy.
  - Current-suite fixtures are retained while current, plus **24 months** after retirement.
  - Detailed replay traces, divergence diffs, and encrypted intermediates (`ReplayEntryV1`) are retained for **30 days**, bounded by earlier local private-source deadlines. Replay retention cannot extend a shorter private-source deadline.

## Rationale and Alternatives

- **Declarative Scenarios vs. Executable Scripts:** Executable Python or JavaScript test scripts introduce unconstrained compute, network escape vulnerabilities, and difficulty in statically analyzing branch coverage. Declarative JSON schemas guarantee closed, auditable execution semantics and reproducible hashing.
- **Dual-Engine Reuse vs. Standalone Simulator Engine:** Building a third simulation-only agent runner would inevitably drift from production runtime behavior. Reusing the pure Rust runtime core and HUD deterministic reducer guarantees that tested behavior matches deployed behavior.
- **All-Pass vs. Majority Voting:** For enterprise workflows executing financial, healthcare, or regulatory actions, a 33% failure rate (1 in 3 runs failing) is unacceptable. Requiring all three trials to pass ensures acceptable reliability bounds under stochastic model behavior.
- **Dedicated Lab Devices vs. Employee Workstation Background Execution:** Running unattended simulation scenarios on employee laptops risks accidental production mutation, workspace interference, and violation of local observation privacy bounds. Dedicated lab devices guarantee foreground isolation, controlled test accounts, and explicit admin enrollment.

## Consequences

- **Factory:** Emits sealed `CandidateEvaluationBundleV1` and consumes typed `SimulationRegressionRequirementRefV1` for repair candidates.
- **Identity:** Issues `SignedSimulationAdmissionV1`, manages test-realm principals, and partitions the `evaluation` signing key purpose.
- **Adapters:** Provides first-party synthetic packs (`synthetic.erp`, `synthetic.crm`, `synthetic.support`) and binds external sandbox credentials via `AdapterEnvironmentBindingV1`.
- **Runtime:** Dispatches under `RuntimeExecutionContextV1::Evaluation` with gVisor container isolation and IPC capability negotiation (`evaluation_execution_v1`).
- **Orchestration:** Persists simulation executions in `orchestration_execution` keyed by `evaluation_attempt_id` without creating dummy jobs or cases.
- **Release Governance:** Evaluates immutable signed reports from Flight Simulator, requiring full suite passage, verified coverage obligations, and separate production equivalence before production release.
