# 0015: Agent Factory IR and Candidate Qualification

- **Status:** Accepted
- **Date:** 2026-11-14
- **Amended by:** [ADR-0016](0016-application-adapter-qualification-and-dispatch-boundaries.md), [ADR-0019](0019-flight-simulator-isolation-and-evaluation-evidence.md)
- **Deciders:** Oryn Architecture Guild, Agent Factory Owner, Operational Graph Owner, Release Governance Owner, Control Plane Owner
- **Consulted:** Flight Simulator Owner, Agent Runtime Owner, Identity Policy Owner, Outcome Verification Owner, Enterprise Security Lead
- **Informed:** All Engineering Teams

## Context and Problem Statement

Under [PRODUCT.md §§13–14, 15.10, 21, 29.7](../../PRODUCT.md) and [TECHNICAL.md §§3, 5.5, 7.2, 9.2](../../TECHNICAL.md), Oryn must transform approved operational procedures into executable agent automations.

Key architectural challenges include:
1. **Scripting Flexibility vs. Deterministic Governance:** Whether to allow general-purpose scripting languages (Python/JavaScript) or closed, model-independent intermediate representations (IR).
2. **AI Synthesis vs. Human Authoring Authority:** Defining how model proposals are converted into executable plans without granting models authority to create business rules, bypass validation, or modify production state.
3. **Upstream Business Rule Authority vs. Compiler-Invented Policy:** Ensuring business logic originates exclusively from approved Operational Graph rules rather than local compiler heuristics.
4. **Candidate Authenticity vs. Production Authority:** Guaranteeing that candidate artifacts are immutably signed and verifiable without granting implicit release or execution authority.
5. **Compilation, Evaluation, and Release Decoupling:** Structuring lifecycle gates so compilation qualifies structural readiness without conflating it with simulation passage or production authorization.
6. **Compiler Service Architecture:** Choosing between a separate Python compilation microservice and a Rust module within the existing Control Plane.

## Decision

The Oryn Architecture Guild resolves the core architecture and qualification boundaries for the Agent Factory and Operational Capability IR as follows:

1. **Constrained, Model-Independent Intermediate Representation (AgentIRV1):**
   - The IR is a closed, deterministic, typed DAG format composed of ten explicit node kinds (`read`, `transform`, `reason`, `decision`, `action`, `foreach`, `verify`, `human_input`, `escalate`, `finish`).
   - Recursion, arbitrary loop-until constructs, dynamic code execution, and unconstrained scripting are strictly prohibited. Loops are restricted to bounded `foreach` constructs (maximum 2 nesting levels, maximum 1,000 items per loop, 10,000 worst-case node execution budget computed via static reverse-topological longest-path traversal).
   - Dataflow requires static RFC 6901 pointers, definite assignment, and dominance. Taint tracking is preserved across all transforms and reasoning nodes.

2. **Deterministic Lowering of Explicitly Accepted Proposals:**
   - Model proposals (`AgentIRCandidateProposalV1`) are strictly advisory and stored immutably with full provenance (`SynthesisProvenanceV1`).
   - A proposal cannot mutate the authoring head or grant business permissions. Lowering occurs only when an authorized human (`workflow_owner` or `automation_builder`) explicitly accepts the proposal into an `EditableAgentPlanV1`.
   - The compiler is a pure, deterministic Rust function (`compile_candidate`) with zero external network or model dependencies during lowering.

3. **Authoritative Upstream Business Rules and Dependency Closures:**
   - Business policies, conditions, and decision tables must be formalized and approved in the Operational Graph. The compiler binds rules via immutable `KnowledgeVersionRefV1` pointers and evaluates three-valued logic (`pass`, `fail`, `unknown`) and `UNIQUE` decision-table disjointness proofs.
   - Prose-only rules or unproven formalizations block candidate qualification. The compiler cannot invent fallback rules or synthesize business authority.
   - All transitive dependencies (capabilities, playbooks, rules, application profiles, verification specs) are captured in an ordered Graph `DependencyManifestV1` (capped at 4,096 entries).

4. **Signed Immutable Candidate Identity:**
   - The executable body (`ExecutableAgentBodyV1`) is strictly canonicalized via RFC 8785 and hashed (`behavior_sha256 = SHA256(RFC8785(body))`). Display metadata, version IDs, and timestamps are excluded from `behavior_sha256`.
   - Candidate versions (`AgentVersionV1`) are immutable. Each version is paired with a Vault Ed25519 publisher signature (`SignedCandidateAttestationV1`).
   - Material changes (any change outside `DisplayMetadataV1`) always produce a new version and invalidate prior qualification and evaluation references. Cosmetic changes update draft display metadata without changing executable identity.

5. **Strict Decoupling of Compilation, Evaluation, and Release:**
   - **Compilation Qualification:** Proves structural integrity, type soundness, DAG acyclicity, deterministic outcome coverage, verified value provenance, and prerequisite bindings. It outputs a `CompileReportV1` (`blocked` or `structurally_valid`).
   - **Evaluation Passage (Flight Simulator):** Proves empirical correctness across synthetic and recorded scenario matrices. Compilation does not populate evaluation verdicts.
   - **Release Approval (Release Governance):** Grants operational deployment authority based on stage gating, human verification history, and dual-authorization approvals. Candidate authenticity does not grant production write authority.

6. **Rust Module in Existing Control Plane vs. Separate Compiler Service:**
   - The Agent Factory compiler is implemented as a pure Rust module within the Axum/Tokio/SQLx Control Plane.
   - All state transitions, draft revisions, proposals, attempts, and versions are managed within PostgreSQL 18 with mandatory Row-Level Security.
   - Finalization synchronizes on the tenant `graph_knowledge_guard` within a single `TenantTransaction`, preventing stale dependency races.

## Rationale and Alternatives Considered

- **Rejected: General-Purpose Scripting (Python/TypeScript/Lua) Agents:** Scripting languages allow unbounded loops, dynamic reflection, hidden network calls, and arbitrary state mutations. Static termination, worst-case cost bounding, deterministic verification, and data taint tracking become undecidable. Closed IR guarantees bounded execution, complete outcome coverage, and auditable dataflow.
- **Rejected: Model-Authored Policy Authority:** Allowing LLMs to write code or generate policies directly creates severe prompt injection and privilege escalation vectors. In Oryn, business logic is owned exclusively by human Workflow Owners through approved Operational Graph formalizations.
- **Rejected: Separate Python Compiler Microservice:** A separate Python service would introduce multi-service failure modes, duplicate data models, network latency, distributed transaction complexity, and dependency synchronization lag. A pure Rust module avoids a separate service and makes deterministic compilation independently testable; performance remains an operational target, not a measured guarantee.

## Consequences

- The Agent Factory becomes the authoritative compiler for executable automations, consuming Operational Graph assets and outputting sealed candidate bundles.
- Flight Simulator admits candidates strictly via `CandidateEvaluationBundleV1`, verifying cryptographic attestations and manifest completeness before scenario execution.
- Release Governance evaluates candidate readiness without mutating agent definitions; material edits strictly invalidate downstream readiness.
- Identity Policy enforces that `workflow_owner` and `automation_builder` can draft and compile agents within their remit, but only operators with approval delegations can execute production jobs.

*(Scope Amendment — 2026-11-14): [ADR-0016](0016-application-adapter-qualification-and-dispatch-boundaries.md) amends capability discovery and compilation interfaces: normalizes `ApplicationCapabilityPort` to asynchronous producer-owned methods (`snapshot` and `statuses`). Requires `ApplicationCapabilityBodyV1` to support `platform="api"`, ordered required `qualification_refs`, and per-operation `write_guard`. Factory finalization locks `adapter_registry_guard(organization_id, generation)` before `graph_knowledge_guard`.*

*(Scope Amendment — 2026-11-15): [ADR-0019](0019-flight-simulator-isolation-and-evaluation-evidence.md) amends candidate evaluation bundle verification and repair command schemas: `RepairCandidateCommandV1` replaces generic string refs with typed `regression_requirement_refs: SimulationRegressionRequirementRefV1[]` referencing `SimulationRegressionRequirementV1` (`simulation.regression-requirement.v1`). Repairs require evaluating the full current regression suite, the original failing scenario / prevention spec, and at least 5 distinct nearby variations with material changed dimensions. Flight Simulator admits candidates under honest `ExecutionContextV1::Evaluation` and issues `SignedEvaluationReportV1`.*


## References

- [PRODUCT.md §§13–14, 15.10, 21, 29.7](../../PRODUCT.md)
- [TECHNICAL.md §§3, 5.5, 7.2, 9.2](../../TECHNICAL.md)
- [ADR-0011: Identity Authority and Approval Fencing](0011-identity-authority-and-approval-fencing.md)
- [ADR-0014: Operational Graph Knowledge and Rule Governance](0014-operational-graph-knowledge-and-rule-governance.md)
- [Component 13 Specification: Agent Factory and Operational Capability IR](../components/agent-factory-ir.md)
