# Agent Factory and Operational Capability Compiler Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§3.1–4, 5.5, 8.2](../../TECHNICAL.md) | [PRODUCT.md §§5.2, 13–14, 29.7; ORY-022–025](../../PRODUCT.md)

### Core Responsibility
The Agent Factory and Operational Capability Compiler transforms sufficiently specified, approved operational capabilities into executable **agent candidates** expressed in a structured, model-independent Intermediate Representation (IR), and generates corresponding verification requirements.

### Owns
- The Operational Capability Intermediate Representation (IR) schema and semantic specification.
- Compiler pipeline transforming published playbooks and business rules into executable agent candidates.
- Dependency analysis verifying that required application adapter capabilities and verification hooks exist.
- Generation of candidate execution plans, action boundaries, input/output schemas, and failure recovery branches.
- Versioned candidate bundle generation and tracking material plan edits.

### Consumes
- Approved capability models, published playbooks, and business rules from [operational-graph](operational-graph.md).
- Declared application action and verification capabilities from [application-adapters](application-adapters.md).
- Risk tier limits and policy constraints from [identity-policy](identity-policy.md).
- Candidate repair specifications from [incident-correction-repair](incident-correction-repair.md).
- Governed cloud reasoning operations (`text.reason`) via [cloud-inference](../architecture/cloud-inference.md).
### Produces
- Immutable, versioned candidate agent bundles containing IR definitions, declared tool contracts, and postconditions.
- Verification requirements and suggested test coverage scenarios delivered to [flight-simulator](flight-simulator.md).
- Blocked candidate declarations when prerequisites, rules, or verifiers are missing or incompatible.

### Does Not Own
- Approving agents for production deployment or assigning runtime permissions (owned by [release-governance](release-governance.md) / [identity-policy](identity-policy.md)).
- Production credential issuance or secret storage (owned by [infrastructure-security](infrastructure-security.md)).
- Running scenario test suites or evaluating candidate pass/fail grades (owned by [flight-simulator](flight-simulator.md)).

### Boundary Requirement
The compiler must produce a **model-independent operational representation**, not merely an unconstrained natural-language prompt. Business goals, step actions, governing policies, and verification postconditions must remain conceptually and structurally distinct. If required capabilities or verification hooks are absent, the compiler must output an explicitly blocked candidate rather than inferring unsupported actions.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§5.2, 13–14, 29.7; ORY-022–025](../../PRODUCT.md))
- **Builder Creation Without Production Access:** Authorized builders can generate agent candidates from approved playbooks without possessing production write credentials (ORY-022).
- **Candidate Transparency:** The candidate must clearly expose its objective, inputs, outputs, business rules, allowed actions, forbidden actions, scope, owner, risk tier, and verification requirements (ORY-023).
- **Incompatible Autonomy Blocking:** Missing business rules or unverified postconditions automatically flag the candidate and block release at incompatible autonomy levels (ORY-024).
- **Edit Invalidation:** Builders can edit candidate plans, but material modifications automatically invalidate prior evaluation readiness (ORY-025).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #5 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests approved capabilities, rules, and postconditions from [operational-graph](operational-graph.md).
- **Contract Reference #6 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes supported actions, limitations, and verification support from [application-adapters](application-adapters.md).
- **Contract Reference #7 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers fixed agent candidates and verification requirements to [flight-simulator](flight-simulator.md).
- **Contract Reference #17 in [Contracts Catalog](../architecture/contracts/README.md):** Receives new candidate versions and regression requirements from [incident-correction-repair](incident-correction-repair.md).
- **Contract Reference #22 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes `text.reason` via LiteLLM gateway under [cloud-inference](../architecture/cloud-inference.md) for candidate plan synthesis; plans are bounded by deterministic IR validation and require simulation testing before release.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Secure cloud service running in the organizational control plane.
- **Model Isolation:** Compiler passes that leverage LLMs for translation are bounded by deterministic schema validators; model hallucinations cannot insert undeclared tool actions.
- **Zero Production Authority:** The Agent Factory has zero network access to production external business applications.

## Internal architecture

### Logical Submodules
- **IR Parser and Schema Validator:** Validates structured capability definitions against the formal Oryn IR specification.
- **Dependency and Capability Checker:** Cross-references candidate tool requests against registered adapter capabilities in [application-adapters](application-adapters.md).
- **Plan and Branch Compiler:** Compiles high-level business goals into deterministic step graphs with explicit error handlers.
- **Verification Rule Linker:** Attaches required business postconditions and readback assertions to every action step.

## State and lifecycle

### State and Persistence
- **Persisted State:** Candidate IR specifications, compiler logs, validation reports, and version lineage trees in control-plane storage.
- **Lifecycle Transitions:** `Draft → Compiling → Validated Candidate ↔ Blocked (Missing Rules) → Ready for Evaluation → Evaluated → Released / Deprecated`.
- **Material Edit Tracking:** Any edit to steps, inputs, or rules triggers a new candidate version UUID and revokes evaluation marks.

## Error and edge-case behavior

### Failure Handling
- **Missing Application Adapter:** If a playbook requires an unmapped application action, compilation produces a `Blocked Candidate` report.
- **Unverified Postcondition:** If an action lacks a corresponding verification adapter, the candidate is restricted from Stage 4 autonomy.
- **Syntax or Schema Violation:** Compiler rejects invalid candidate definitions with line-specific diagnostic errors.

## Observability and audit

### Telemetry and Diagnostics
- Emits compilation metrics, pass/fail validation rates, blocked candidate counts, and schema violation details.
- Preserves full audit records of candidate creation, edits, and builder user identities (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Prompt Injection Defense:** Instructions extracted from playbooks cannot include system-level jailbreaks; prompt templates enforce strict role and instruction separation.
- **Forbidden Action Injection:** Tools requested by the agent must be allowlisted in the Capability Registry; undeclared tools are rejected at compile time.
- **Risk Tier Integrity:** A candidate's risk tier is computed as the maximum tier of any included action and cannot be manually overridden to bypass gates.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.3: ORY-022, ORY-023, ORY-024, ORY-025](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* A builder creates an agent candidate for PO reconciliation that lacks a defined postcondition check for invoice status; the builder requests Stage 4 autonomy.
  - *Expected Observable Result:* The compiler flags the candidate with an incomplete verification specification error, sets the candidate status to Blocked for Stage 4, and prevents submission to production release governance.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Fast compilation cycle (sub-5 seconds) for interactive candidate plan editing.
- Deterministic bytecode/IR generation ensuring that identical inputs yield identical candidate artifacts.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What intermediate representation format (JSON-based AST, YAML workflow schema, or typed domain DSL) best supports human review and static analysis?
- What validation rules constitute a material edit that must invalidate prior test evaluation readiness?
- How should plan editing UI support human-in-the-loop modifications of compiled IR trees?
- How should the compiler represent non-deterministic model-guided decision steps within a deterministic execution graph?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Operational IR schema, agent candidate compilation, verification requirement attachment, and plan versioning.
2. *Data ingress/egress:* Ingests approved capabilities and adapter declarations; outputs immutable candidate agent bundles.
3. *Versions/identities:* Candidate Agent version UUID, Capability version ID, IR schema version, and Builder user ID.
4. *Upstream failure:* If knowledge graph is unavailable, existing compiled candidates remain valid and immutable.
5. *Authority:* The assigned domain owner approves the source capability; the builder compiles the candidate; release governance approves deployment.
6. *Testing without private details:* Tested via synthetic playbook inputs and automated schema conformance test suites.
7. *Audit and duplicate prevention:* Candidate bundles are signed with SHA-256 content hashes.
8. *Failure blast radius:* Compiler failure blocks new agent creation; running production agents remain unaffected.
9. *v1.0 criteria:* Enables ORY-022, ORY-023, ORY-024, and ORY-025 verified through candidate compilation and edit invalidation tests.
