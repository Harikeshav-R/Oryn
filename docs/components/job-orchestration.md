# Job Orchestration and Scheduling Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§6.1, 8.3, 9.4, 11.4–5](../../TECHNICAL.md) | [PRODUCT.md §§16, 20.5, 21.7; ORY-040–048](../../PRODUCT.md)

### Core Responsibility
Job Orchestration and Scheduling coordinates manually started and approved recurring agent jobs across case populations, manages approval suspension, concurrency, and retries, and maintains durable execution state across worker failures.

### Owns
- The durable lifecycle of jobs and cases (Queued, Running, Awaiting Approval, Completed, Failed, Paused).
- Job scheduling, queue partitioning, and case dispatching to available worker pools.
- Enforcing concurrency limits, overlapping job restrictions, and execution resource budgets.
- Checkpointing case progression and managing safe crash recovery without repeating non-idempotent writes.
- Aggregating case outcomes and generating job-level operational summaries.

### Consumes
- Authorized job start requests from [command-center-analytics](command-center-analytics.md) / [control-plane](control-plane.md).
- Active, released agent versions and rollout scopes from [release-governance](release-governance.md).
- Preflight validation checks from [identity-policy](identity-policy.md) and [application-adapters](application-adapters.md).
- Step completion and failure reports from [agent-runtime](agent-runtime.md).
- Independent business verdicts from [outcome-verification](outcome-verification.md).

### Produces
- Scoped work assignments dispatched to [agent-runtime](agent-runtime.md) workers.
- Human approval task notifications routed to [identity-policy](identity-policy.md) and [desktop-shell](desktop-shell.md).
- Job and case status transition events broadcast across the domain event bus.
- Incident trigger signals dispatched to [incident-correction-repair](incident-correction-repair.md) when anomalies or systemic failures occur.

### Does Not Own
- Executing external application mutations directly (owned by [application-adapters](application-adapters.md)).
- Authorizing action permissions or granting risk tier exemptions (owned by [identity-policy](identity-policy.md)).
- Editing or patching agent code (owned by [agent-factory-ir](agent-factory-ir.md) / [incident-correction-repair](incident-correction-repair.md)).
- Declaring business correctness without verifier verdicts (owned by [outcome-verification](outcome-verification.md)).

### Boundary Requirement
Job operations must be durable, recoverable, and idempotent. An orchestrator restart or crash recovery must never blindly repeat non-idempotent external writes. Scheduling must strictly enforce organizational policies regarding concurrency, budget caps, and emergency stops. Terminal case status requires independent verification.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§16, 20.5, 21.7; ORY-040–048](../../PRODUCT.md))
- **Precise Queue Selection:** Operators must be able to view eligible queues, scope, and expected effects before starting a job (ORY-040).
- **Preflight Gating:** Preflight checks block job start if scope, role, required inputs, or permissions are invalid (ORY-041).
- **Accurate Batch Reporting:** Batches show verified successes, expected exceptions, and unresolved cases separately without false 100% claims (ORY-042).
- **Terminal Status Integrity:** A submitted but unverified action cannot be reported as Verified Complete (ORY-043).
- **Uncertain Outcome Holding:** Uncertain external submissions are placed in hold state to prevent duplicate retries (ORY-044).
- **Emergency Stop:** Operators can stop running jobs; the orchestrator reports completed effects and remaining cases (ORY-045).
- **Overlap Prevention:** Scheduled jobs respect declared scopes and prevent overlapping runs by default (ORY-046).
- **Approval Context:** Consequential approvals present proposed changes, supporting evidence, and authority context (ORY-047).
- **Separation of Duties:** Starting a job does not grant approval authority to unprivileged operators (ORY-048).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #9 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests eligible active version and scope from [release-governance](release-governance.md).
- **Contract Reference #10 in [Contracts Catalog](../architecture/contracts/README.md):** Dispatches bounded work assignments to [agent-runtime](agent-runtime.md).
- **Contract Reference #14 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests verification verdicts from [outcome-verification](outcome-verification.md) to transition case states.
- **Contract Reference #22 Reference:** Job orchestration remains deterministic; underlying worker model decisions route through LiteLLM under [cloud-inference](../architecture/cloud-inference.md).
- **Job Status Events:** Emits `job.requested`, `job.case_state_changed`, and `job.completed` domain events.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Highly available, clustered workflow orchestration service in the organizational control plane.
- **State Store Isolation:** Execution state is backed by transactional persistence (e.g., PostgreSQL or Temporal persistence engine).
- **Execution Rights:** The orchestrator dispatches work but does not possess credentials to execute business applications.

## Internal architecture

### Logical Submodules
- **Job Scheduler and Dispatcher:** Manages job queues, case batches, and worker allocation.
- **Durable State Machine:** Coordinates case lifecycle transitions and checkpoint persistence.
- **Approval Coordinator:** Manages suspension of cases awaiting human approval and resumes execution upon approval receipt.
- **Preflight Validator:** Executes pre-flight sanity checks against adapters, roles, and case records prior to job launch.

## State and lifecycle

### State and Persistence
- **Persisted State:** Durable job instances, case records, step execution checkpoints, approval wait states, and retry counters.
- **Job Lifecycle:** `Draft → Preflight Check → Queued → Running ↔ Waiting for Review ↔ Paused → Completed / Completed with Exceptions / Failed / Canceled`.
- **Case Lifecycle:** `Not Started → In Progress → Prepared → Awaiting Approval → Verified Complete / Expectedly Rejected / Needs Clarification / Blocked / Failed / Outcome Unknown`.

## Error and edge-case behavior

### Failure Handling
- **Worker Node Crash:** Orchestrator detects heartbeat loss, recovers the case from its last committed checkpoint, and reassigns it without re-executing submitted writes.
- **Verification Mismatch:** If verification reports a mismatch or policy error, the case is marked `Failed` and an incident signal is generated.
- **External Submission Timeout:** Transitions case to `Outcome Unknown`, halting retries until manual review or readback succeeds.

## Observability and audit

### Telemetry and Diagnostics
- Emits real-time progress metrics (cases completed, cases pending approval, failure rates, throughput).
- Preserves complete operational audit records of job launches, pauses, approvals, and stop commands (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Concurrency Race Conditions:** Distributed locks prevent overlapping scheduled jobs from operating on identical case records.
- **Unauthorized Job Launching:** Preflight checks verify that the initiating user possesses proper operational permissions.
- **Denial of Service:** Concurrency quotas per tenant prevent single jobs from exhausting shared worker clusters.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.5: ORY-040–048](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* An operator launches a batch reconciliation job; 8 cases verify complete, 1 case encounters a payment gateway timeout, and 1 case requires Tier 3 human approval.
  - *Expected Observable Result:* The batch progress display reports 8 Verified Complete, 1 Outcome Unknown (Held), and 1 Awaiting Approval; overall batch status remains Waiting for Review; no blind retry occurs on the timed-out case.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- High throughput supporting thousands of concurrent case state machines.
- Low-latency state transitions (sub-10ms checkpoint commits).
- Zero state loss during orchestrator node failover.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What workflow engine (Temporal, Cadence, or custom relational state machine) best provides durable replayable executions?
- How should case batch partitioning be managed to prevent database lock contention during high-volume jobs?
- What queue eviction and retention policies should apply to completed job operational records?
- How should emergency stop commands propagate across distributed workers to minimize shutdown latency?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Durable job and case lifecycles, execution scheduling, checkpoint persistence, and approval wait states.
2. *Data ingress/egress:* Ingests job requests and verification verdicts; outputs work assignments and job status events.
3. *Versions/identities:* Job ID, Case ID, Agent version UUID, Queue ID, and Operator user ID.
4. *Upstream failure:* If worker node crashes, orchestrator recovers case from checkpoint without re-running writes.
5. *Authority:* [release-governance](release-governance.md) authorizes active version; [outcome-verification](outcome-verification.md) authorizes terminal case completion.
6. *Testing without private details:* Tested via synthetic case batches and mock worker execution harnesses.
7. *Audit and duplicate prevention:* State transitions are atomic; external submissions use idempotent checkpoint tokens.
8. *Failure blast radius:* Orchestrator issue pauses job scheduling; existing external committed writes remain intact.
9. *v1.0 criteria:* Enables ORY-040, ORY-041, ORY-042, ORY-043, ORY-044, ORY-045, ORY-046, ORY-047, and ORY-048.
