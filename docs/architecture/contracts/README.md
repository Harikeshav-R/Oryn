# Cross-Component Contracts Catalog

Status: Baseline brief — detailed design pending

## Purpose and Scope

This document serves as the conceptual contract catalog for Oryn, recording the producer/consumer agreements established in [TECHNICAL.md §7](../../../TECHNICAL.md).

This catalog defines **conceptual information exchange, authority boundaries, and behavioral invariants** between components. While generalized cloud serialization schemas and message broker topologies remain deferred at this catalog level, specific device-local IPC wires (such as `shell-privacy.v1` in Contracts 19 and 20, and `os-observation.v1` in Contract 1) are concretely specified in their respective authoritative component specifications.
---

## Communication Patterns (TECHNICAL.md §7.1)

All interactions across Oryn component boundaries fit into one of three distinct communication patterns:

1. **Synchronous request/response:** Used for immediate user or worker decisions (e.g., querying cached playbooks, real-time policy evaluation, requesting operator approval, or fetching job state). Handlers must authenticate, authorize, reject invalid scope, and report explicit errors.
2. **Asynchronous domain events:** Used to notify interested modules that an authorized state change has already committed (e.g., `workflow.published`, `incident.created`, `evaluation.completed`). Events must be sufficiently durable for their consumers and duplicate-tolerant. An event informs consumers of historical facts; it never confers execution authority.
3. **Durable business workflows:** Used for long-running, multi-step processes involving potential delays, retries, and human interventions (e.g., candidate evaluation runs, multi-stage approval waits, incident triage, and canary rollouts). The workflow coordinator must recover state across restarts and track side-effect uncertainty.

---

## Conceptual Contract Inventory (TECHNICAL.md §7.2)

The 21 cross-component agreements below govern data and command transfers across system boundaries:

| # | Producer Component | Consumer Component | Information / Command | Boundary Invariant |
|---|---|---|---|---|
| 1 | [os-observation](../../components/os-observation.md), [browser-extension](../../components/browser-extension.md), [meeting-intelligence](../../components/meeting-intelligence.md) | [local-privacy-storage](../../components/local-privacy-storage.md) | Raw candidate observations and reverse source permits | Filter at source; reverse privacy-to-observer control (`GrantObservationPermit`, `RevokeObservationPermit`, `ReleaseFrameSlot`) and normalized observation streaming over inherited byte channels (`os-observation.v1` for native observer; dedicated channel 3 `shell-browser.v1` for browser extension); masked BGRA8 snapshot frames via private inherited shared memory; no external or cloud egress pathway. Concrete wire protocols defined in [os-observation specification](../../components/os-observation.md#protocol-handshake-os-observationv1) and [browser-extension specification](../../components/browser-extension.md#wire-protocol-browser-bridgev1). |
| 2 | [local-privacy-storage](../../components/local-privacy-storage.md), [contribution-sync](../../components/contribution-sync.md) | [workflow-discovery](../../components/workflow-discovery.md) | Employee-approved sanitized task contribution | Preserve consent receipts, provenance, sensitivity tag, and tenant scope |
| 3 | [operational-graph](../../components/operational-graph.md) | [local-context-hud](../../components/local-context-hud.md) | Published, access-filtered playbook / peer fix | Cache only within currently authorized employee session and scope |
| 4 | [workflow-discovery](../../components/workflow-discovery.md) | [operational-graph](../../components/operational-graph.md) | Candidate workflow, observed variants, clarifying questions | Candidates cannot be auto-published; requires domain owner review |
| 5 | [operational-graph](../../components/operational-graph.md) | [agent-factory-ir](../../components/agent-factory-ir.md) | Approved capability, business rules, postconditions | References must be immutable and version-pinned |
| 6 | [application-adapters](../../components/application-adapters.md) | [agent-factory-ir](../../components/agent-factory-ir.md), [job-orchestration](../../components/job-orchestration.md), [agent-runtime](../../components/agent-runtime.md) | Supported actions, limitations, and verification support | Unsupported actions cannot be inferred or hallucinated from model output |
| 7 | [agent-factory-ir](../../components/agent-factory-ir.md) | [flight-simulator](../../components/flight-simulator.md) | Fixed agent candidate bundle and verification requirements | Test suites cannot silently modify the candidate under evaluation |
| 8 | [flight-simulator](../../components/flight-simulator.md), [outcome-verification](../../components/outcome-verification.md) | [release-governance](../../components/release-governance.md) | Evaluation results, coverage metrics, and gap evidence | Simulation passage does not automatically authorize production deployment |
| 9 | [release-governance](../../components/release-governance.md) | [job-orchestration](../../components/job-orchestration.md) | Eligible active version, scope, and canary policy | Executing jobs must pin accepted versions and honor emergency stops |
| 10 | [job-orchestration](../../components/job-orchestration.md) | [agent-runtime](../../components/agent-runtime.md) | Approved, bounded work assignment | Work assignment alone does not grant ambient or unrestricted rights |
| 11 | [agent-runtime](../../components/agent-runtime.md) | [identity-policy](../../components/identity-policy.md) | Specific action authorization request | Deny or escalate to human review when authority or context is missing |
| 12 | [agent-runtime](../../components/agent-runtime.md) | [application-adapters](../../components/application-adapters.md), [browser-extension](../../components/browser-extension.md) | Authorized external operation | Limited strictly to defined application actions with narrow credentials; local browser actions execute via [browser-extension](../../components/browser-extension.md) backend over `browser-bridge.v1` (`ExecuteBrowserAction`) with canonical `action_sha256` proposal digests and single-job execution reservations. |
| 13 | [agent-runtime](../../components/agent-runtime.md), [application-adapters](../../components/application-adapters.md), [browser-extension](../../components/browser-extension.md) | [outcome-verification](../../components/outcome-verification.md) | Submission records and readback evidence | Action dispatch receipts (`BrowserActionResult` with `submission_state`) do not equal verified business completion; runner tool success ≠ business outcome verification. |
| 14 | [outcome-verification](../../components/outcome-verification.md) | [job-orchestration](../../components/job-orchestration.md), [incident-correction-repair](../../components/incident-correction-repair.md) | Verification verdict and mismatch diagnosis | Unknown or ambiguous outcomes must halt execution and block blind retries |
| 15 | [incident-correction-repair](../../components/incident-correction-repair.md) | [incident-correction-repair](../../components/incident-correction-repair.md) | Failure classification and evidence references | Model-generated root cause hypotheses remain unverified until corroborated |
| 16 | [incident-correction-repair](../../components/incident-correction-repair.md) | [operational-graph](../../components/operational-graph.md), [incident-correction-repair](../../components/incident-correction-repair.md) | Accepted expert correction or candidate rule change | Independent domain owners must approve procedural and policy changes |
| 17 | [incident-correction-repair](../../components/incident-correction-repair.md) | [agent-factory-ir](../../components/agent-factory-ir.md), [flight-simulator](../../components/flight-simulator.md) | New candidate version and regression suite requirements | No in-place modification of active production agent versions |
| 18 | [control-plane](../../components/control-plane.md), [operational-graph](../../components/operational-graph.md), [release-governance](../../components/release-governance.md) | [command-center-analytics](../../components/command-center-analytics.md) | Authorized read models, notifications, and audit records | The frontend UI is a presentation layer, never an authorization authority |
| 19 | [desktop-shell](../../components/desktop-shell.md) | [local-privacy-storage](../../components/local-privacy-storage.md) | Capture control commands, ephemeral visibility lease, and state subscription | Inherited byte-channel control; visibility loss or unrenewed lease immediately stops capture; raw media and raw candidate DOM never cross control channel (`shell-privacy.v1` minor 1 negotiates dedicated channel 3 for browser traffic). Incorporates source-aware operational status (`sources: CaptureSourceState[]`) and category aggregation rules. Exact wire protocol defined in [desktop-shell specification](../../components/desktop-shell.md#parent--helper-transport-architecture). |
| 20 | [local-context-hud](../../components/local-context-hud.md) | [desktop-shell](../../components/desktop-shell.md) | Structured guidance cards, highlight targets, and employee guidance interactions | Shell hosts all presentation and windows; HUD produces structured models and tracks guide progression; stale context invalidates highlights; shell owns all window and highlight rendering. Exact wire protocol defined in [desktop-shell specification](../../components/desktop-shell.md#2-hud-guidance-presentation-interface-hudpresentationport). |
| 21 | [local-context-hud](../../components/local-context-hud.md) | [browser-extension](../../components/browser-extension.md) | Browser target resolution queries and results | HUD queries live DOM target presence (`ResolveBrowserTarget`); extension resolves packaged deterministic locators against live DOM and returns physical desktop bounds and affine transforms (`BrowserTargetResult`); consent, current document generation, and proven native geometry required; unproven geometry gracefully falls back to text-only guidance without coordinate highlights. Routed through privacy gate over `shell-browser.v1` and `browser-bridge.v1`. |

---

## Shared Metadata Requirements (TECHNICAL.md §7.3)

Cross-boundary messages, commands, and events share a common semantic model across seven categories without imposing a single bloated physical envelope:

1. **Identity:** Explicit tenant/organization identity, calling actor/worker identity, and service principal context.
2. **Traceability:** Globally unique object identifiers, causal identifiers, correlation identifiers, and creation/modification timestamps.
3. **Versioning:** Interface schema version, along with immutable versions of the underlying capability, playbook, agent code, and governing policy.
4. **Authorization:** Declared execution scope, target application boundaries, applicable user consent tokens, and security policy context.
5. **Sensitivity:** Classification level (e.g., local-private, shared-procedural, or operational-audit), access audience restrictions, and egress permissions.
6. **Evidence:** Cryptographic or content hashes referencing supporting artifacts (screenshots, DOM trees, run logs) and verification confidence levels.
7. **Errors:** Standardized categorization distinguishing client rejection, transient retriable errors, permanent unverified outcomes, and potential external side effects.

Universal envelopes containing raw screenshots, session histories, and credentials are prohibited. Producers must project only the minimal information required by the consumer.

---

## Commands, Events, and Notifications (TECHNICAL.md §7.5)

- **Command:** A direct request directed to the authoritative owner of a resource requesting a state mutation (e.g., `ExecuteAction`, `AuthorizeApproval`). The recipient may validate, execute, reject, or require escalation.
- **Domain Event:** An immutable fact stating that an authorized state change has already taken place (e.g., `workflow.published`). Events carry causal context and allow decoupled reactive processing.
- **Notification:** An advisory presentation to a human operator or dashboard. Notifications do not modify domain authority or represent guaranteed delivery of business state.

---

## Boundary Scopes and Consistency Model (TECHNICAL.md §§7.4, 7.6)

### Local-Only vs. Organization-Scoped

Event names listed in [TECHNICAL.md §7.4](../../../TECHNICAL.md) (such as `observation.local_task_identified` versus `workflow.published`) illustrate boundary scoping:
- **Device-Local Events:** Emitted and handled strictly within the local desktop boundary. They must never traverse network hops to central infrastructure.
- **Organization-Scoped Events:** Broadcast via the control plane to authorized tenant services after explicit employee review, sanitization, and sync.

### Consistency Rules

1. **Strong Validation at Consequential Boundaries:** Identity verification, policy checks, approval confirmation, version pinning, and external commit boundaries require strong validation. Stale authorization must never be used to execute privileged actions.
2. **Eventual Propagation for Derived Knowledge:** Search index updates, aggregate metric rollups, procedure discovery clustering, and peer-fix recommendations may tolerate eventual consistency.
3. **External Systems Lack Distributed Transactions:** Third-party applications do not participate in two-phase commits. When external writes timeout or fail ambiguously, Oryn must rely on independent verification readbacks rather than assuming atomicity or initiating unverified retries.

---

## Open Integration and Wire Design Questions

Specific wire designs deferred to component-level specifications include:
- The transport protocols (e.g., gRPC, HTTPS/REST, WebSockets, or local IPC pipes) for inter-component communication.
- Message broker selection, topic naming conventions, and queue topologies for asynchronous domain events.
- Idempotency key mechanisms, deduplication windows, and at-least-once versus exactly-once delivery guarantees.
- Schema definition language, backward/forward compatibility validation rules, and schema registry deployment.
- Event store and audit log physical persistence mechanisms.
