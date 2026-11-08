# Oryn Documentation

## Documentation Architecture and Baselines

This directory contains the component design briefs, cross-cutting architecture specifications, and architecture decision records for Oryn.

### Authoritative Baselines

1. [PRODUCT.md](../PRODUCT.md): Authoritative product baseline governing customer-visible behavior, user experience, permission tiers, autonomy levels, retention defaults, and v1.0 acceptance criteria.
2. [TECHNICAL.md](../TECHNICAL.md): Authoritative cross-component technical architecture baseline defining component boundaries, domain concepts, integration flows, and non-negotiable invariants.

### Precedence Hierarchy (TECHNICAL.md §0.3)

1. **`PRODUCT.md` governs first:** Customer-visible scope, safety policies, risk tiers, and acceptance criteria override technical documentation when a conflict arises.
2. **`TECHNICAL.md` governs second:** Cross-component boundaries, authoritative state ownership, communication patterns, and system invariants.
3. **Component design documents govern third:** Internal subsystem architecture, algorithms, and local data choices within component boundaries. Any proposed change to a shared contract or boundary requires an explicit architecture update.

### Nature of Baseline Briefs

Documents in `docs/components/` and `docs/architecture/` represent **baseline briefs**. Established requirements are grounded in `PRODUCT.md` and `TECHNICAL.md`. Pending design questions record open technical decisions and tradeoffs; they are **not** architectural approvals or implementation commitments. The existence of a document does not imply that the component exists in code or is release-ready.

---

## Document Index

### Architecture and Contracts

- [Architecture Decision Records Guide](adr/README.md): ADR rules, single-context storage in `docs/adr/`, sequential numbering, and change triggers.
- [Cross-Component Contracts Catalog](architecture/contracts/README.md): Conceptual contracts, communication patterns, shared metadata, and consistency model.
- [Threat Model and Trust Boundaries](architecture/threat-model.md): Multi-boundary threat analysis, asset classifications, and required safe failure outcomes.
- [Data Classification and Retention](architecture/data-classification.md): Logical data domains, retention schedules, suppression rules, and egress boundaries.

### Agent Workflow Guides

- [Domain Documentation Guide](agents/domain.md): Single-context domain layout and ADR consumption rules.
- [Issue Tracker Guide](agents/issue-tracker.md): GitHub Issues integration and conventions.
- [Triage Labels Guide](agents/triage-labels.md): Canonical issue triage labels.

---

## Component Index

The 21 components defined in [TECHNICAL.md §14.4](../TECHNICAL.md) are indexed below. Each brief captures authoritative responsibilities and preserves pending implementation choices.

| Component Brief | Technical Sources | Product Sources | Brief Status | Next Design Topic |
|---|---|---|---|---|
| [desktop-shell](components/desktop-shell.md) | §§4.1, 4.7, 13.2 | §§7–8, 12, 24–25, 30; ORY-002–004, ORY-010 | Baseline brief — detailed design pending | Shell framework, tray/status controls, crash/quit lifecycle, host boundary |
| [os-observation](components/os-observation.md) | §4.2 | §§3.3, 3.6, 8, 25.1–3, 28.1; ORY-005 | Baseline brief — detailed design pending | Per-OS APIs, capability reporting, sampling, event normalization |
| [browser-extension](components/browser-extension.md) | §4.3 | §§3.3, 3.6, 8, 12, 25; ORY-005, ORY-019, ORY-028 | Baseline brief — detailed design pending | Extension permissions, local bridge transport, DOM/observation correlation |
| [meeting-intelligence](components/meeting-intelligence.md) | §§4.4, 8.7 | §§9, 25.1, 29.5–6; ORY-008, ORY-021 | Baseline brief — detailed design pending | Per-meeting consent UX, transcription pipeline, commitment extraction |
| [local-privacy-storage](components/local-privacy-storage.md) | §§4.5, 10.1–5, 11.5 | §§8.3–4, 25, 28.1; ORY-005–010 | Baseline brief — detailed design pending | Local encryption, pre-capture suppression, redaction, retention sweeps |
| [local-context-hud](components/local-context-hud.md) | §§4.6–7, 8.6 | §§9.4, 12, 29.1–6; ORY-011, ORY-018–021 | Baseline brief — detailed design pending | Task matcher cache, suggestion ranking, overlay rendering, step tracking |
| [contribution-sync](components/contribution-sync.md) | §§4.8, 8.1, 8.8 | §§4.4, 10, 25.5–7; ORY-007, ORY-012 | Baseline brief — detailed design pending | Review receipts, sanitization verification, sync transport, offline queue |
| [identity-policy](components/identity-policy.md) | §§5.2, 9.2–3, 11.3 | §§6–7, 14, 16.6, 25.6–9; ORY-001, ORY-026–030, ORY-048, ORY-068–069 | Baseline brief — detailed design pending | Policy evaluation engine, scoped credentials, exact approval binding |
| [control-plane](components/control-plane.md) | §§5.1, 7 | §§6, 16, 22, 25; ORY-001, ORY-041, ORY-060, ORY-070 | Baseline brief — detailed design pending | API modularity, session management, domain validation, event consistency |
| [workflow-discovery](components/workflow-discovery.md) | §§5.3, 8.1, 9.1 | §§10, 27.1, 28.2; ORY-011–014 | Baseline brief — detailed design pending | Session clustering, procedure synthesis, confidence scoring, reviewer prompts |
| [operational-graph](components/operational-graph.md) | §§3, 5.4, 9.1, 10.2 | §§5, 10–11, 21.8, 26; ORY-015–018, ORY-061–062 | Baseline brief — detailed design pending | Canonical capability model, version lineage, search storage, conflict detection |
| [agent-factory-ir](components/agent-factory-ir.md) | §§3.1–4, 5.5, 8.2 | §§5.2, 13–14, 29.7; ORY-022–025 | Baseline brief — detailed design pending | Intermediate Representation schema, compiler stages, plan validator |
| [application-adapters](components/application-adapters.md) | §§5.6, 6.3 | §§3.3–6, 13.5, 16.4–7, 17; ORY-028, ORY-041, ORY-043–044 | Baseline brief — detailed design pending | Adapter interface, capability declarations, connection lifecycle, action/readback |
| [agent-runtime](components/agent-runtime.md) | §§6.2–3, 8.3, 11.2–4 | §§14, 16–17, 28.3; ORY-026–028, ORY-043–045 | Baseline brief — detailed design pending | Execution sandbox, tool invocation protocol, external policy interceptor |
| [job-orchestration](components/job-orchestration.md) | §§6.1, 8.3, 9.4, 11.4–5 | §§16, 20.5, 21.7; ORY-040–048 | Baseline brief — detailed design pending | Durable state machine engine, checkpointing, recovery, approval suspension |
| [flight-simulator](components/flight-simulator.md) | §§6.4–5, 8.4 | §§14.2–3, 15, 28.4; ORY-031–039 | Baseline brief — detailed design pending | Environment isolation, fixture reset, fault injection, replay mechanics |
| [outcome-verification](components/outcome-verification.md) | §§6.6, 9.4, 11.4 | §§15.7, 17, 16.7; ORY-034, ORY-043–044 | Baseline brief — detailed design pending | Readback oracle protocol, independent verification evidence, mismatch rules |
| [incident-correction-repair](components/incident-correction-repair.md) | §§6.7–9, 8.5, 9.6 | §§18–20, 28.4, 29.8; ORY-049–055, ORY-059 | Baseline brief — detailed design pending | Failure taxonomy, containment triggers, repair compiler, regression suites |
| [release-governance](components/release-governance.md) | §§6.10, 9.2–3, 9.5 | §§14, 20.6, 21, 29.7; ORY-030, ORY-055–058, ORY-067 | Baseline brief — detailed design pending | Rollout gates, canary progression, emergency stop dispatch, rollback |
| [command-center-analytics](components/command-center-analytics.md) | §§5.7, 12.7 | §§11–12, 22–24, 26, 30; ORY-016, ORY-060–066 | Baseline brief — detailed design pending | Role-based read models, graph visualizations, approval inbox, audit dashboards |
| [infrastructure-security](components/infrastructure-security.md) | §§2.1–3, 10–12 | §§4, 25, 31–32; ORY-006, ORY-009, ORY-064, ORY-068–070 | Baseline brief — detailed design pending | Host/container isolation, secret management, backup lifecycle, audit storage |

---

## Next Discussion: Desktop Shell

The first component targeted for detailed design discussion is the [Desktop Shell](components/desktop-shell.md).

Prior to beginning that discussion, refer to [Desktop Shell Questions](components/desktop-shell.md#12-architecture-decisions-and-open-questions). Note that in accordance with [TECHNICAL.md §14.3](../TECHNICAL.md), cross-cutting foundation agreements (such as identity/policy schemas, version lineage, and cross-component authorization contracts) remain dependencies to be negotiated, rather than invented unilaterally within the desktop shell.
