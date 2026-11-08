# Architecture Decision Records (ADRs)

Status: Active guidance — accepted records present for desktop subsystem

## Canonical Location and Numbering

The canonical directory for all system-wide Architecture Decision Records in Oryn is:

```text
docs/adr/
```

Individual records use zero-padded sequential numbering and lowercase hyphenated slugs:

```text
docs/adr/0001-slug-title.md
docs/adr/0002-another-decision.md
```

Numbering strictly increments based on the highest existing record in `docs/adr/`.

---

## When to Record an ADR

ADRs record hard-to-reverse, non-obvious engineering decisions and trade-offs. An ADR should be authored only when all three criteria are met:

1. **Hard to reverse:** The cost of changing the decision later is high (e.g., core database engine, IPC protocol, isolation primitive, or identity model).
2. **Surprising without context:** A future engineer or agent reading the code would wonder why an alternative was not chosen.
3. **The result of a real trade-off:** Multiple viable options existed, and one was deliberately selected based on concrete technical criteria.

Do not record ADRs for routine implementation details, obvious choices, or easily reversible file layout adjustments. Subsystem detailed specifications record accepted decisions following architecture review (see ADR-0001 and ADR-0002).

---

## Format

ADRs follow the concise format from the domain modeling standard:

```markdown
# {Short title of the decision}

**Status:** {proposed | accepted | deprecated | superseded by ADR-NNNN}  
**Date:** {YYYY-MM-DD}  
**Deciders:** {Names / Roles}  

## Context
{1–2 paragraphs: what problem are we solving, what constraints apply, and what forces are in tension?}

## Decision
{1–2 paragraphs: what did we decide to do?}

## Rationale and Alternatives
{1–2 paragraphs: why this choice was selected over alternatives, and what key trade-offs were accepted.}

## Consequences
{Bullet points: downstream effects, commitments, or new constraints imposed on other components.}
```

---

## Architecture Change Triggers (TECHNICAL.md §14.5)

Subsystem designs may introduce internal modules or alternate libraries without updating the system architecture if their public boundaries remain intact. However, a formal Architecture Decision Record and reconciliation with [TECHNICAL.md](../../TECHNICAL.md) is mandatory whenever a proposal touches:

1. **Privacy boundary:** The physical location, network path, or permission boundary of private employee data.
2. **Domain ownership:** The authoritative component owner of any domain concept or entity lifecycle.
3. **Authority and release semantics:** How agent authority is granted, verified, scoped, or released to production.
4. **Version lineage:** How immutable version identifiers, capability revisions, or job executions are tracked and pinned.
5. **Side-effect guarantees:** External side-effect handling, idempotency mechanisms, replay/retry rules, or simulation isolation.
6. **Shared contracts:** Any public cross-component message, command, event, or interface used by other components.
7. **Product-visible guarantees:** Any policy, autonomy tier, retention limit, or UX constraint specified in [PRODUCT.md](../../PRODUCT.md) (requiring both an ADR and a product specification update).

---

## Accepted Architecture Decisions

The following architecture decision records are currently accepted:

1. **[0001-desktop-runtime-and-presentation.md](0001-desktop-runtime-and-presentation.md)**: Desktop Runtime and Presentation Architecture (Tauri 2, Rust core, React/TypeScript UI, native AppKit/Win32 status adapters, and unprivileged child helper via inherited byte channels).
2. **[0002-desktop-capture-lifecycle.md](0002-desktop-capture-lifecycle.md)**: Desktop Capture Lifecycle, Visibility Leases, and Bounded Offline Policy (100ms/500ms ephemeral visibility lease, durable employee pause, explicit recovery resume, and 24-hour maximum offline policy validity cap).
