# Data Classification and Retention Vocabulary

Status: Baseline brief — detailed design pending

## Purpose and Scope

This document defines Oryn's data architecture, sensitivity classification, retention schedules, and boundary rules, grounded in [TECHNICAL.md §§3.2, 7.3, 10](../../TECHNICAL.md) and [PRODUCT.md §25](../../PRODUCT.md).

It establishes a shared vocabulary for managing information lifecycles across employee endpoints, central control planes, execution workers, and simulation environments. This document uses authoritative source concepts rather than invented numerical classification schemes or rigid enum codes.

---

## Mandatory Exclusions and Restricted Secrets

Certain data categories are **mandatory exclusions** under [PRODUCT.md §25.2](../../PRODUCT.md). They are **not** ordinary business data waiting for later redaction; they must be excluded **before capture at source**:

1. **Mandatory Excluded Applications and Contexts:**
   - Personal password managers and credential vaults.
   - Authentication secrets, session tokens, and cryptographic keys.
   - Personal messaging, chat, and personal email.
   - Personal banking, investment, and financial portals.
   - Incognito and private browser windows.
   - HR compensation, payroll records, and employee performance reviews.
   - Protected health information (PHI) and healthcare portals.
   - Windows and domains explicitly excluded by employee or organizational policy.
2. **Restricted Secrets in Execution:**
   - Account passwords, API keys, private keys, payment card numbers (PAN/CVV), and personal government identifiers (SSN/SIN).
   - Must never appear in shared playbooks, agent prompts, task summaries, or centralized analytics.
   - When redaction occurs, sensitive data is replaced with meaningful field tokens (e.g., `<CUSTOMER_ACCOUNT_NUMBER>`), never plausible fake values that could be mistaken for authentic data.

---

## The Eight Logical Data Domains (TECHNICAL.md §10.1)

| Data Domain | Location and Owner | Authorized Audience | Allowed Egress | Governing Consent / Review | Retention and Deletion Schedule | Provenance Rules |
|---|---|---|---|---|---|---|
| **1. Private Raw Observation** | Employee endpoint; owned by [local-privacy-storage](../components/local-privacy-storage.md) | Individual employee only; never accessible to managers | Zero cloud egress; strictly prohibited from central servers | Governed by employee visual observation consent | **Default: 7 days.** Employee may select **1–6 days**. Organization may permit extension up to **14 days maximum** for documented research; expires automatically | Captures device ID, OS window metadata, and exclusion status |
| **2. Private Derived Work History** | Employee endpoint; owned by [local-privacy-storage](../components/local-privacy-storage.md) | Individual employee only | Local guidance and contribution review only; no cloud sync | Governed by personal history retention setting | Follows local raw retention or employee-managed deletion | Indexes task boundaries, unshared commitments, and local match scores |
| **3. Reviewed Contribution** | Ingestion pipeline; owned by [contribution-sync](../components/contribution-sync.md) | Assigned domain reviewers and discovery engine | Transmitted to central control plane over secure TLS | Explicit employee review and approval receipt mandatory | Retained until synthesized into candidates or deleted by employee request | Carries cryptographic employee review receipt and tenant scope |
| **4. Organizational Knowledge** | Control plane; owned by [operational-graph](../components/operational-graph.md) | Authorized teams and roles within the tenant | Distributed to authorized local HUD caches | Approved by designated domain and policy owners | Retained indefinitely while active; unapproved candidates default to **365 days** | Tracks capability ID, playbook version hash, and author/approver IDs |
| **5. Agent and Release Definitions** | Control plane; owned by [agent-factory-ir](../components/agent-factory-ir.md) and [release-governance](../components/release-governance.md) | Builders, operators, and execution workers | Dispatched to isolated execution sandboxes | Governed by release gates and owner sign-offs | Immutable version lineage retained for operational history | Signed with candidate content hash and evaluation scorecard links |
| **6. Production Execution Records** | Execution plane; owned by [job-orchestration](../components/job-orchestration.md) and [outcome-verification](../components/outcome-verification.md) | Operators, auditors, and incident reviewers | Scoped business reports and audit views | Governed by job authorization and tenant policies | Consequential audit records default to **24 months** under approved audit schedule | Links Job ID, Case ID, worker container, and authoritative readback digests |
| **7. Simulation Artifacts** | Simulation plane; owned by [flight-simulator](../components/flight-simulator.md) | Builders, reviewers, and evaluation engines | Stored in isolated evaluation artifact stores | Governed by scenario development policies | Retained for regression comparison across candidate versions | Scenarios, synthetic fixtures, fault injection logs, and scorecards |
| **8. Analytics and Notifications** | Reporting layer; owned by [command-center-analytics](../components/command-center-analytics.md) | Organization members according to RBAC roles | Exportable reports with scope and uncertainty caveats | Governed by tenant analytics policies | Aggregated metrics retained according to enterprise reporting policy | Discloses data coverage, sample caveats, and estimated vs. measured metrics |

---

## Retention Schedules and Deletion Boundaries

### Exact Retention Preservations ([PRODUCT.md §25.4](../../PRODUCT.md))
- **Local Raw Screen and Audio Capture:** Default is strictly **7 days** with automatic expiration. Employees may configure a shorter duration of **1 to 6 days**. An enterprise may permit an employee to extend retention up to a hard maximum of **14 days** for documented workflow research, but cannot force local raw retention beyond this limit.
- **Unapproved Candidate Workflows:** Default retention is **365 days** for unapproved candidate workflows in discovery, subject to organizational policy.
- **Approved Histories and Consequential Audit:** Approved playbook/agent change histories and consequential action audit records default to **24 months** under the organization's approved audit schedule.

### Explicit Holds and Obligations
Legal holds, compliance retention, or contractual requirements must be explicitly disclosed to users rather than silently extending private raw-capture retention beyond the 14-day product maximum. Raw media must not be sequestered into permanent shadow storage.

### Deletion and Independent State Separation
When an employee requests deletion of local data, the system must clearly distinguish five distinct states:
1. **Private Original Capture:** Purged immediately and permanently from the local disk. Discarded raw media cannot be recovered from organizational dashboards.
2. **Reviewed Shared Contributions:** If already submitted to workflow discovery, the employee is presented with a separate contribution-removal flow.
3. **Published Organizational Knowledge:** Deleting a local recording does not automatically erase independently approved, anonymized company playbooks derived from it.
4. **Execution Evidence:** Verification readbacks and transaction receipts remain intact for operational integrity.
5. **Audit Obligations:** Consequential action audit logs cannot be truncated by individual user deletion requests.

---

## Model Processing and Egress Boundaries (TECHNICAL.md §10.4)

Every interaction with a language model or external AI reasoning service constitutes a **data egress boundary**, whether the model is local, customer-hosted, or vendor-managed:
- **No Automatic Access:** External AI providers do not gain implicit access to corporate data.
- **Data Minimization:** Only the specific variables required for reasoning are submitted, scrubbed of PII and restricted credentials.
- **Zero-Retention Guarantees:** Third-party model providers must operate under enterprise zero-data-retention agreements where customer inputs are not used for model training.
- **Untrusted Output:** Model completions are classified as untrusted data until validated by deterministic schema parsers and policy engines.

---

## Simulation Artifact Sensitivity (TECHNICAL.md §10.1)

Although simulation environments run against synthetic data and application replicas, simulation artifacts retain sensitivity restrictions:
- Scenario definitions may encode proprietary business logic, operational edge cases, and confidential workflow structures.
- Simulation execution traces, regression reports, and replay recordings are protected under tenant-isolation policies identical to production operational knowledge.
- Test environments must never borrow production write authority or expose real customer PII in test fixtures.

---

## Technical Deferrals

Concrete encryption algorithms (e.g., AES-256-GCM), key derivation functions (Argon2, PBKDF2), physical database schemas, object storage lifecycle rules, and customer-managed encryption key (CMEK) integrations are deferred to component-level engineering designs (specifically [local-privacy-storage](../components/local-privacy-storage.md) and [infrastructure-security](../components/infrastructure-security.md)).
