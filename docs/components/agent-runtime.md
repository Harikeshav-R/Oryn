# Production Agent Runtime and Scoped Workers Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§6.2–3, 8.3, 11.2–4](../../TECHNICAL.md) | [PRODUCT.md §§14, 16–17, 28.3; ORY-026–028, ORY-043–045](../../PRODUCT.md)

### Core Responsibility
The Production Agent Runtime and Scoped Workers execute approved, immutable agent candidate versions against assigned cases through validated application adapters, operating under strict external policy interception and sandboxed execution boundaries.

### Owns
- The execution lifecycle of individual structured agent steps defined in the compiled IR.
- Invocation of approved model assistance exclusively for designated non-deterministic reasoning steps.
- Dispatching tool and application operations through external adapters.
- Generating comprehensive, immutable step execution traces and action evidence.
- Tracking local case execution state and enforcing step timeouts and bounded failure escalation.

### Consumes
- Bounded work assignments from [job-orchestration](job-orchestration.md) with pinned agent version UUIDs.
- Authoritative per-action authorization verdicts from [identity-policy](identity-policy.md).
- Scoped, short-lived adapter credentials and capabilities from [application-adapters](application-adapters.md).
- Target case data records and permitted task context.
- Governed cloud reasoning operations (`text.reason`) via [cloud-inference](../architecture/cloud-inference.md).
### Produces
- Action authorization requests submitted to [identity-policy](identity-policy.md) prior to executing any mutation.
- Proposed operations and parameters dispatched to [application-adapters](application-adapters.md).
- Action submission receipts and observed output evidence delivered to [outcome-verification](outcome-verification.md).
- Case progress updates and failure signals delivered to [job-orchestration](job-orchestration.md).

### Does Not Own
- Deciding whether an action is permissible under business policy (owned by [identity-policy](identity-policy.md)).
- Scheduling jobs, allocating case queues, or managing concurrency (owned by [job-orchestration](job-orchestration.md)).
- Determining whether an action achieved verified business success (owned by [outcome-verification](outcome-verification.md)).
- Modifying deployed agent versions or acquiring unapproved tools.

### Boundary Requirement
The runtime is treated as **less trusted than the authorization, verification, and release authorities**. Even if a language model is manipulated or an ingested document contains adversarial prompt injection, action permissions and credential scopes remain enforced outside model reasoning. Local and remote runners share identical conceptual contracts. Self-certified success from an agent is never accepted as business completion.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§14, 16–17, 28.3; ORY-026–028, ORY-043–045](../../PRODUCT.md))
- **Enforced Human Approval:** Tier 3 consequential operations halt execution and await signed human approval before commit (ORY-026).
- **Absolute Tier 4 Prohibition:** Tier 4 restricted actions cannot be executed under any circumstances (ORY-027).
- **Strict Scope Boundaries:** Workers are sandboxed to prevent access to unauthorized applications or records (ORY-028).
- **No Self-Verification:** An action submission cannot be marked Verified Complete without independent verification (ORY-043).
- **Hold on Uncertainty:** When external communication fails ambiguously, the runner halts and holds the case to prevent duplicate execution (ORY-044).
- **Stop Command Compliance:** The runner must immediately honor operator stop commands, preserving completed action records (ORY-045).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #10 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests bounded work assignments from [job-orchestration](job-orchestration.md).
- **Contract Reference #11 in [Contracts Catalog](../architecture/contracts/README.md):** Submits action authorization requests to [identity-policy](identity-policy.md).
- **Contract Reference #12 in [Contracts Catalog](../architecture/contracts/README.md):** Dispatches authorized operations to [application-adapters](application-adapters.md), which routes local browser operations to [browser-extension](browser-extension.md) over `browser-bridge.v1` (`ExecuteBrowserAction`) with canonical `action_sha256` proposal digests.
- **Contract Reference #13 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers action submission records and UI primitive results (`BrowserActionResult`) to [outcome-verification](outcome-verification.md).
- **Contract Reference #22 in [Contracts Catalog](../architecture/contracts/README.md):** Routes model-assisted step decisions (`text.reason`) through the LiteLLM gateway under [cloud-inference](../architecture/cloud-inference.md); model completions are untrusted data that must conform strictly to declared IR schema and action constraints.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Ephemeral worker containers running in hardened execution clusters or sandboxed local worker processes.
- **Least Privilege Sandbox:** Worker processes have no ambient filesystem or network access outside declared adapter endpoints.
- **Model Ingress Boundary:** Prompts sent to model providers include only sanitized case variables; model completions are parsed strictly into typed IR actions.

## Internal architecture

### Logical Submodules
- **IR Step Interpreter:** Walks the compiled execution graph, managing variable bindings and control flow.
- **Policy Enforcement Interceptor:** Intercepts every tool call, querying the policy engine before dispatching actions.
- **Model Reasoning Client:** Interacts with LLM providers for extraction or classification steps, enforcing JSON schemas.
- **Execution Tracer:** Captures fine-grained execution logs, inputs, outputs, timestamps, and tool receipts.

## State and lifecycle

### State and Persistence
- **Persisted State:** In-memory execution state with durable step checkpoints synchronized to [job-orchestration](job-orchestration.md).
- **Lifecycle Transitions:** `Spawned → Assigned Case → Executing Step ↔ Awaiting Policy / Approval ↔ Invoking Adapter → Step Verified / Failed → Terminated`.
- **Stateless Worker Model:** Worker nodes can be destroyed after case completion; all authoritative state resides in central storage.

## Error and edge-case behavior

### Failure Handling
- **Tool Execution Failure:** Records adapter error details and executes IR error-handling branches if defined.
- **Approval Rejection:** If a human reviewer denies a Tier 3 action, the runner marks the case `Expectedly Rejected` and exits cleanly.
- **Operator Emergency Stop:** Stops step execution immediately, rolls back uncommitted local state, and reports terminal status.

## Observability and audit

### Telemetry and Diagnostics
- Emits detailed step execution traces including duration, model token counts, tool arguments, and adapter response codes.
- Redacts customer PII and sensitive credentials from operational trace streams.

## Security and threat model

### Security and Safety Considerations
- **Prompt Injection Defense:** Content from incoming invoices or emails cannot override system instructions or alter tool arguments to unauthorized endpoints.
- **Credential Theft Prevention:** Workers receive short-lived, single-use tokens rather than permanent application passwords.
- **Runaway Loop Protection:** Hard limits on step counts and wall-clock execution time terminate runaway loops.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.3: ORY-026, ORY-027, ORY-028; §31.5: ORY-043, ORY-044, ORY-045](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* A running agent attempts to execute an action targeting a customer ID outside its assigned batch scope.
  - *Expected Observable Result:* The policy enforcement interceptor detects the out-of-scope customer ID, rejects the tool call with an authorization denial, halts case execution, and emits a security exception to job orchestration.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Rapid worker startup time (sub-second container warm-starts).
- Low memory overhead per active case execution thread.
- Graceful scale-to-zero when no jobs are queued.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What container or sandbox isolation technology (gVisor, Firecracker microVMs, or WebAssembly) best balances startup latency with isolation?
- How should model-assisted steps handle LLM provider rate limits and failover transparently?
- What exact serialization format should be used for execution checkpoints to support zero-loss worker migration?
- How should local desktop runners differ in execution mechanics while preserving identical security contracts?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* IR step execution, tool dispatching, action trace generation, and local step timeout enforcement.
2. *Data ingress/egress:* Ingests job assignments and case data; outputs authorization requests and execution traces.
3. *Versions/identities:* Agent candidate UUID, Job ID, Case ID, Worker container ID, and Tenant ID.
4. *Upstream failure:* If policy engine denies action or is unavailable, runner halts and refuses execution.
5. *Authority:* [identity-policy](identity-policy.md) is authoritative for permissions; [outcome-verification](outcome-verification.md) is authoritative for correctness.
6. *Testing without private details:* Tested via synthetic cases and mock application adapters in isolated environments.
7. *Audit and duplicate prevention:* Every action invocation carries a unique step execution UUID and idempotency key.
8. *Failure blast radius:* Runner failure is isolated to its current case; does not impact concurrent cases or orchestrator.
9. *v1.0 criteria:* Enables ORY-026, ORY-027, ORY-028, ORY-043, ORY-044, and ORY-045 verified through execution containment tests.
