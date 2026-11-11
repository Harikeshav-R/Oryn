# Release, Rollout, and Change Governance Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§6.10, 9.2–3, 9.5](../../TECHNICAL.md) | [PRODUCT.md §§14, 20.6, 21, 29.7; ORY-030, ORY-055–058, ORY-067](../../PRODUCT.md)

### Core Responsibility
Release, Rollout, and Change Governance decides which immutable agent candidate version is authorized to serve which organization, workflow, case population, and autonomy stage, managing canary rollouts, emergency halts, and version restorations.

### Owns
- The formal release lifecycle and release gate verification (Stage 0 through Stage 5).
- Mapping approved agent versions to specific organizations, teams, and case cohorts.
- Canary rollout progression policies, traffic ramping, and health monitoring thresholds.
- Emergency release pause, restriction, rollback, and version restoration commands.
- Release audit logging, version diff presentation, and recorded sign-off lineage.

### Consumes
- Candidate agent bundles from [agent-factory-ir](agent-factory-ir.md) or [incident-correction-repair](incident-correction-repair.md).
- Complete scenario evaluation evidence and regression scorecards from [flight-simulator](flight-simulator.md).
- Workflow owner and compliance approval sign-offs submitted via [control-plane](control-plane.md).
- Real-time incident and containment signals from [incident-correction-repair](incident-correction-repair.md).

### Produces
- Authoritative active version and scope assignments delivered to [job-orchestration](job-orchestration.md).
- Rollout restriction and emergency stop directives dispatched to [job-orchestration](job-orchestration.md) and [agent-runtime](agent-runtime.md).
- Release status updates and version diffs delivered to [command-center-analytics](command-center-analytics.md).

### Does Not Own
- Generating or editing agent behavioral code (owned by [agent-factory-ir](agent-factory-ir.md)).
- Executing scenario evaluation test suites (owned by [flight-simulator](flight-simulator.md)).
- Overriding business policy requirements or bypassing mandatory human approvals (owned by [identity-policy](identity-policy.md)).

### Boundary Requirement
Automatic Stage 5 release is strictly limited to narrow, pre-authorized Tier 0/1 low-risk patches meeting documented criteria; all higher-risk or policy-changing repairs require explicit human approval. Evaluation test passage in simulation is a necessary readiness prerequisite, not an autonomous authority grant. Formal production authorization for Tier 3 releases requires a `SignedGovernanceProposalV1` (`governance.proposal.v1`) approved by a designated Workflow Owner under [identity-policy](identity-policy.md) (ADR-0011). Restoring an earlier agent version re-establishes eligibility of that version, but does not claim to undo external business mutations already committed by newer versions.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§14, 20.6, 21, 29.7; ORY-030, ORY-055–058, ORY-067](../../PRODUCT.md))
- **Enforced Autonomy Gates:** Enforces prerequisite demonstration counts, scenario thresholds, and owner sign-offs before advancing autonomy stages (ORY-030).
- **Regression Release Prevention:** Blocks deployment of candidate repairs that introduce critical regressions in simulation (ORY-055).
- **Restricted Canary Rollouts:** Approved repairs roll out to restricted cohorts with visible test evidence and monitoring (ORY-056).
- **Version Restore Semantics:** Restoring an earlier version reverts execution eligibility without claiming to undo external side effects (ORY-057).
- **Automated Stage 5 Limits:** Limits automated release strictly to narrow low-risk Tier 0/1 patches; all other changes require approval (ORY-058).
- **Material Change Diffs:** Material workflow or agent changes require an explicit reviewable version diff and recorded decision (ORY-067).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #8 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests evaluation results, coverage metrics, and gap evidence bound to `EvaluationTargetV1` (`agent` or `assist_plan`) from [flight-simulator](flight-simulator.md). Validates that Stage 3 assist plans satisfy strict evaluation criteria: at least 5 distinct verified human examples, 25 passing representative scenarios including at least 5 edge/negative cases, all known branches covered, all mandatory checks passing, and owner approval.
- **Contract Reference #9 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers eligible active version and scope assignments to [job-orchestration](job-orchestration.md) for agent jobs, and publishes signed `assist_eligibility` records to [operational-graph](operational-graph.md) for HUD assist plans.
- **Contract Reference #11 in [Contracts Catalog](../architecture/contracts/README.md):** Submits and validates `SignedGovernanceProposalV1` (`governance.proposal.v1`) with [identity-policy](identity-policy.md) for Tier 3 releases, role grants, and policy changes, enforcing Workflow Owner remits and strict proposer-approver separation.
- **Contract Reference #22 Reference:** Candidate diff analysis may consume `text.reason` via LiteLLM under [cloud-inference](../architecture/cloud-inference.md); release promotion and policy changes strictly require human authorization.
- **Release Event Bus:** Emits `release.approved`, `release.paused`, `release.expanded`, and `release.reverted` events.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Core governance service operating within the organizational control plane.
- **Separation of Duties:** The user who authors an agent candidate or repair cannot be the sole approver for production release.
- **Immutable Version Binding:** Releases bind to immutable SHA-256 digests of agent candidate bundles; in-place code modification is impossible.

## Internal architecture

### Logical Submodules
- **Readiness Gate Evaluator:** Validates that candidate versions meet all test coverage, scenario passage, and policy prerequisites.
- **Canary and Rollout Controller:** Manages cohort allocation percentages and monitors error rates during progressive rollout.
- **Emergency Halt Switchboard:** Instantly revokes release eligibility and signals running orchestrators upon high-severity incident detection.
- **Version Diff and Audit Generator:** Renders structural visual diffs of IR, business rules, and tool configurations for human approvers.

## State and lifecycle

### State and Persistence
- **Persisted State:** Release records, approval signatures, active version maps, canary cohort configurations, and rollback histories.
- **Lifecycle Transitions:** `Candidate Review → Evaluation Verified → Approval Pending → Canary Rollout ↔ Active / Paused ↔ Superseded / Reverted / Retired`.
- **Rollback Mechanics:** Immediately shifts the active version pointer to a previously verified release; running jobs pin their current version or pause.

## Error and edge-case behavior

### Failure Handling
- **Canary Error Spike:** If an active canary exceeds predefined error thresholds, rollout automatically halts, pauses cases, and alerts operators.
- **Contradictory Release Approval:** Conflicting sign-offs freeze the release in an unapproved state awaiting administrative resolution.
- **Orchestrator Desynchronization:** If an orchestrator fails to acknowledge an emergency stop, workers are terminated via identity token revocation.

## Observability and audit

### Telemetry and Diagnostics
- Tracks release cadence, canary failure frequencies, rollback rates, and gate evaluation latencies.
- Produces tamper-evident audit logs capturing approver identities, timestamps, version diffs, and justifications (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Bypassing Release Gates:** Automated checks cryptographically verify test suite signatures; unsigned or incomplete test results reject deployment.
- **Unauthorized Version Promotion:** Release commands enforce strict role-based access control requiring designated workflow owner credentials.
- **Silent Degradation:** Canary monitors evaluate verification pass rates rather than just HTTP error rates to detect subtle business logic errors.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.3: ORY-030; §31.6: ORY-055–058; §31.7: ORY-067](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* A repaired agent version is approved for a 10% canary rollout; during execution, 2 out of 5 cases encounter verification errors; the operator clicks Revert to Prior Version.
  - *Expected Observable Result:* Release governance halts the canary immediately; shifts active version eligibility back to the prior stable release; displays an audit record explaining that already committed external effects are not undone; job orchestration routes subsequent cases to the restored version.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Instantaneous propagation of emergency stop commands (sub-second).
- Scalable configuration serving thousands of active tenant release mappings.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What statistical thresholds best govern automated canary progression without introducing false positives?
- How should emergency stops handle cases that are currently in the middle of multi-step external transactions?
- What UI diff representation is most effective for domain owners reviewing agent IR changes?
- How should version restore operations coordinate with external system state reconciliation?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Production release eligibility, canary rollout policies, emergency stop controls, and version diff sign-offs.
2. *Data ingress/egress:* Ingests evaluation scorecards and approval requests; outputs active version mappings and stop commands.
3. *Versions/identities:* Release ID, Agent candidate UUID, Approver User ID, Workflow ID, and Tenant ID.
4. *Upstream failure:* If simulator evidence is incomplete, release governance refuses deployment by default.
5. *Authority:* Designated domain owners and compliance reviewers are authoritative for production release approval.
6. *Testing without private details:* Tested via mock release gates and simulated canary failure harnesses.
7. *Audit and duplicate prevention:* Every release decision is recorded as an immutable, cryptographically signed audit event.
8. *Failure blast radius:* Governance failure blocks new deployments; currently running active releases continue operating.
9. *v1.0 criteria:* Enables ORY-030, ORY-055, ORY-056, ORY-057, ORY-058, and ORY-067 verified through canary and rollback tests.
