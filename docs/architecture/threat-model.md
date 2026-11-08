# System Threat Model and Trust Boundaries

Status: Baseline brief — detailed design pending

## Purpose and Scope

This document establishes the system-wide threat model and trust boundaries for Oryn, grounded in [TECHNICAL.md §§1–2, 7.3, 10–11](../../TECHNICAL.md) and [PRODUCT.md §§4, 6, 14, 25, 28, 31–32](../../PRODUCT.md).

It documents the assets, actors, and threat scenarios that Oryn's architecture must safely counter. This brief defines **required safe outcomes and necessary controls** across all trust boundaries, without selecting specific vendor security products or prematurely declaring a complete security review.

---

## Assets and Actors

### System Assets
1. **Raw Observation Media:** Device-local screen recordings, accessibility trees, and audio streams containing potential PII, passwords, and private employee activity.
2. **Private Derived History:** On-device task indexes, unshared meeting commitments, and local context caches.
3. **Reviewed Procedural Knowledge:** Sanitized workflow demonstrations approved by employees for organizational sharing.
4. **Authoritative Organizational Knowledge:** Published playbooks, business rules, capability models, and dependency graphs.
5. **Executable Agent Lineage:** Immutable agent bundles, compiled IR plans, and tool access declarations.
6. **Execution Credentials:** Scoped OAuth tokens, API keys, and database connections accessing external enterprise applications.
7. **Business State and Transactions:** Production ERP, CRM, and banking records affected by agent actions.
8. **Audit Trails and Compliance Evidence:** Tamper-evident logs of approvals, releases, and consequential operations.

### System Actors
- **Employee:** Operates the desktop companion; controls capture pause, local retention, and contribution sharing.
- **Manager:** Views aggregate workflow analytics; strictly prohibited from viewing individual surveillance data or raw media.
- **Domain Owner / Reviewer:** Evaluates candidate workflows and approves business procedures and rules.
- **Workflow Builder:** Compiles approved playbooks into agent candidate bundles.
- **Operator:** Schedules, initiates, and monitors scoped agent jobs.
- **Security Administrator:** Manages enterprise exclusion policies, tenant memberships, and offboarding.
- **Agent Worker:** Sandboxed execution process running compiled agent instructions.
- **Model Provider:** Local or cloud LLM service processing reasoning steps at a data egress boundary.
- **Adversarial Content Author:** External third party embedding prompt injections or malicious instructions in business documents.

---

## The Nine Core Trust Boundaries (TECHNICAL.md §11.1)

```text
[Observation Sources] ──(1)──> [Local Private Store] ──(2)──> [Organization Control Plane]
                                                                        │
                                      ┌─────────────────────────────────┼──────────────────────────────┐
                                      │ (3)                             │ (5)                          │ (8)
                                      ▼                                 ▼                              ▼
                             [Domain Owners / UI]              [Execution Workers]            [Release Governance]
                                                                        │                              ▲
                                      ┌─────────────────────────────────┼──────────────┐               │
                                      │ (4)                             │ (6)          │ (7)           │
                                      ▼                                 ▼              ▼               │
                               [Model Output]                  [External Business] [Simulation] ───────┘
                                                                        │
                                                                        │ (9)
                                                                        ▼
                                                             [Outcome Verification]
```

1. **Observation Source → Local Private Store:** Boundary on the employee endpoint enforcing consent, exclusion filtering, and secret masking before persistence.
2. **Local Private Store → Organization Control Plane:** Boundary mediating employee review, sanitization, and authenticated contribution sync.
3. **Organization UI → Domain Owner:** Boundary validating user identity, roles, and administrative commands from web clients.
4. **Model Output → Agent Actions:** Boundary ensuring non-deterministic model completions cannot directly invoke tools without schema and policy validation.
5. **Orchestrator → Execution Worker:** Boundary dispatching bounded job assignments with pinned versions and minimal credentials.
6. **Runner → External Business State:** Boundary intercepting every external mutation for authorization, evidence logging, and approval verification.
7. **Production Execution ↔ Simulation Plane:** Boundary maintaining complete network and credential isolation between test sandboxes and production systems.
8. **Repair Proposal → Deployed Version:** Boundary requiring independent simulation passage and governance sign-off before candidate activation.
9. **Business Application → Verification:** Boundary querying independent authoritative readback state to confirm business outcomes.

---

## System Threat Matrix

The following matrix details concrete abuse scenarios, required safe outcomes, responsible components, and authoritative sources:

| Trust Boundary | Concrete Abuse / Failure Scenario | Required Safe Outcome | Responsible Components | Architectural Sources |
|---|---|---|---|---|
| **1. Source → Local Store** | **Excluded Capture:** Employee opens a password manager, personal banking window, or health portal alongside permitted work. | Observation immediately halts for that window; zero frames or accessibility trees are stored locally or in history. | [os-observation](../components/os-observation.md), [local-privacy-storage](../components/local-privacy-storage.md) | TECHNICAL.md §11.1; PRODUCT.md §§8, 25.2; ORY-005 |
| **2. Local Store → Org** | **Unreviewed Sharing:** Network connection is restored; background daemon attempts to auto-upload raw desktop recordings or unapproved drafts. | Upload is completely blocked; only sanitized contributions with signed employee review receipts can sync. | [local-privacy-storage](../components/local-privacy-storage.md), [contribution-sync](../components/contribution-sync.md) | TECHNICAL.md §§4.8, 11.1; PRODUCT.md §25.5; ORY-007 |
| **3. Org UI → Control** | **Cross-Tenant Access:** An authenticated user in Tenant A attempts to read or mutate playbooks belonging to Tenant B. | Request is rejected with 403 Forbidden; database queries enforce mandatory tenant row-level partitioning. | [control-plane](../components/control-plane.md), [identity-policy](../components/identity-policy.md), [infrastructure-security](../components/infrastructure-security.md) | TECHNICAL.md §§10.5, 11.1; PRODUCT.md §6; ORY-001 |
| **4. Model → Actions** | **Hostile Task Content / Prompt Injection:** An invoice PDF contains hidden text commanding the agent to transfer funds to an attacker's account. | Untrusted document text is treated strictly as data; model cannot override system instructions or invoke unapproved tools. | [agent-runtime](../components/agent-runtime.md), [identity-policy](../components/identity-policy.md) | TECHNICAL.md §§11.1, 11.2; PRODUCT.md §25.10 |
| **6. Runner → Business** | **Forged / Widened Approvals:** An attacker alters the payment amount on an approved invoice before the agent commits the transaction. | Approval token is cryptographically bound to the exact payload hash; modified parameters invalidate approval and halt commit. | [identity-policy](../components/identity-policy.md), [agent-runtime](../components/agent-runtime.md) | TECHNICAL.md §§11.1, 11.3; PRODUCT.md §16.6; ORY-026 |
| **6. Runner → Business** | **Stale Authority / Revoked Access:** An employee or agent role is revoked while a runner is executing; runner attempts to commit future steps. | Revocation immediately invalidates execution tokens; runner pauses or fails closed at the next action check. | [identity-policy](../components/identity-policy.md), [agent-runtime](../components/agent-runtime.md) | TECHNICAL.md §§8.8, 11.5; PRODUCT.md §25.7; ORY-068 |
| **5. Orchestrator → Worker** | **Credential Misuse:** A worker container attempts to use its temporary credentials to query unrelated databases or access prohibited APIs. | Tokens are scoped strictly to the assigned Case ID and specific application adapter; unauthorized calls are denied. | [identity-policy](../components/identity-policy.md), [application-adapters](../components/application-adapters.md) | TECHNICAL.md §§6.3, 11.1; PRODUCT.md §14; ORY-028 |
| **6. Runner → Business** | **Ambiguous Writes / Duplicate Retries:** Network drops during a payment submission; status code is unknown. | Submission is marked `Outcome Unknown`; blind duplicate retries are blocked; held for readback verification. | [application-adapters](../components/application-adapters.md), [job-orchestration](../components/job-orchestration.md), [outcome-verification](../components/outcome-verification.md) | TECHNICAL.md §§7.6, 11.4; PRODUCT.md §17; ORY-044 |
| **7. Prod ↔ Simulation** | **Production / Test Crossover:** A simulation test suite executes an automated action that connects to a live production ERP. | Network firewall rules and credential isolation completely block test sandboxes from reaching production endpoints. | [flight-simulator](../components/flight-simulator.md), [infrastructure-security](../components/infrastructure-security.md) | TECHNICAL.md §§6.5, 11.1; PRODUCT.md §15; ORY-031 |
| **8. Repair → Production** | **Unauthorized Repair Release:** An automated repair engine synthesizes a patch that fixes a bug but introduces a security regression, pushing it to production. | Candidate is blocked by mandatory regression evaluation; release governance requires human sign-off for policy changes. | [incident-correction-repair](../components/incident-correction-repair.md), [flight-simulator](../components/flight-simulator.md), [release-governance](../components/release-governance.md) | TECHNICAL.md §§6.10, 11.1; PRODUCT.md §21; ORY-055, ORY-058 |

---

## Required Controls vs. Unselected Technologies

The controls specified above are architectural invariants, distinct from underlying vendor implementations:

1. **Deterministic Policy Enforcement:** In prompt-injection scenarios, model compliance is **never** the sole defensive barrier. The policy engine intercepting tool calls must be deterministic, non-model code executing in an isolated process.
2. **Cryptographic Payload Binding:** Approvals must be bound to payload digests via HMAC or asymmetric digital signatures, regardless of whether tokens use JWT, PASETO, or custom structures.
3. **Network Air-Gapping:** Isolation between simulation and production must be enforced by network infrastructure (VPC isolation, firewall rules), not merely an environment flag in application configuration.
4. **Data Minimization at Ingress:** Redaction and exclusion occur on the client device before serialization into network messages.

---

## Unresolved Platform and Deployment Questions

The following security and threat questions remain explicitly unresolved and are preserved for component-level design:
- **Desktop Endpoint Tampering:** How should local SQLite databases be protected against local administrators or endpoint compromise (e.g., OS keychains vs. DPAPI)? Preserved for [local-privacy-storage](../components/local-privacy-storage.md).
- **Native IPC Hijacking:** What exact OS IPC security mechanism (e.g., Windows AppContainer sids, macOS XPC entitlements) prevents malicious local processes from sending spoofed approval clicks? Preserved for [desktop-shell](../components/desktop-shell.md).
- **Model Egress Confidentiality:** What cryptographic guarantees (e.g., confidential compute, zero-data-retention agreements) must govern third-party hosted model providers? Preserved for [infrastructure-security](../components/infrastructure-security.md).
- **WORM Audit Storage:** What specific immutable storage service (e.g., AWS S3 Object Lock, Azure Immutable Blob) will be selected for compliance audit trails? Preserved for [infrastructure-security](../components/infrastructure-security.md).
