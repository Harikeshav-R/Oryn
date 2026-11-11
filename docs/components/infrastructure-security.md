# Infrastructure and Security Engineering Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§2.1–3, 10–12](../../TECHNICAL.md) | [PRODUCT.md §§4, 25, 31–32; ORY-006, ORY-009, ORY-064, ORY-068–070](../../PRODUCT.md)

### Core Responsibility
Infrastructure and Security Engineering establishes and operates the foundational hosting environments, network boundaries, tenant isolation mechanisms, cryptographic key lifecycles, backup/recovery systems, and audit logging infrastructure across Oryn.

### Owns
- Physical and cloud hosting architecture, container orchestration, and serverless compute pools.
- Operation and hardening of the Oryn LiteLLM Proxy inference gateway, provider vault credentials, mutual TLS, and memory-backed upload spooling (`tmpfs`) under Contract 22 (see [cloud-inference](../architecture/cloud-inference.md)).
- Multi-tenant data segregation, database encryption at rest, and transport encryption in transit (TLS 1.3).
- Enterprise secret management, API token vaults, and signing key lifecycles.
- System-wide immutable audit trail storage and tamper-evident cryptographic log verification (strictly sanitizing content and excluding prompt/completion bodies).
- Disaster recovery, automated backups, and cross-region replication strategies (excluding private raw captures, which remain locally bounded).
- Network segmentation between production execution, simulation sandboxes, and employee endpoints.

### Consumes
- Architectural invariants and non-negotiable principles from [TECHNICAL.md §§1–2](../../TECHNICAL.md).
- Security policies, role definitions, and offboarding commands from [identity-policy](identity-policy.md).
- Resource consumption metrics and scaling demands from [control-plane](control-plane.md) and [job-orchestration](job-orchestration.md).

### Produces
- Hardened deployment environments for all control-plane and execution components.
- Governed LiteLLM inference gateway endpoints enforcing contractual zero content retention, no model training, and US geographic confinement.
- Scoped database connections, encryption keys, and mutual TLS certificates.
- Immutable, tamper-evident audit storage query interfaces delivered to [command-center-analytics](command-center-analytics.md).
- Infrastructure health, capacity, and security anomaly telemetry.

### Does Not Own
- Defining business action risk tiers or granting user permissions (owned by [identity-policy](identity-policy.md)).
- Developing application adapters or business workflow logic (owned by respective component teams).
- Accessing or decrypting private raw employee capture media stored on local endpoints.

### Boundary Requirement
Simulation execution environments must be completely network-isolated from production enterprise business applications. Multi-tenant database layers must enforce cryptographic or logical tenant partitioning on every storage operation. Raw local capture data must never be backed up to central infrastructure; it expires on the endpoint without cloud recovery options.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§4, 25, 31–32; ORY-006, ORY-009, ORY-064, ORY-068–070](../../PRODUCT.md))
- **Anti-Surveillance Architecture:** Prohibits central infrastructure from providing manager access to raw employee media or surveillance analytics (ORY-006, ORY-064).
- **Local Retention Enforcement:** Guarantees that raw capture expires on the local schedule without cloud backups (ORY-009).
- **Immediate Security Policy Enforcement:** Infrastructure propagates policy restrictions immediately to prevent unauthorized actions (ORY-068).
- **Controlled Organization Offboarding:** Deactivating an organization immediately suspends all jobs and purges tenant credentials (ORY-069).
- **Immutable Audit Trail:** Stores tamper-evident records of all approvals, releases, and consequential actions (ORY-070).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Infrastructure Context Reference:** Provides foundational hosting, database, and network fabrics supporting all 25 agreements in [Contracts Catalog](../architecture/contracts/README.md).
- **Contract Reference #22 in [Contracts Catalog](../architecture/contracts/README.md):** Deploys and manages the LiteLLM Proxy gateway; provisions vault-backed provider credentials; disables message/spend body logging and caching; enforces RAM-disk spooling and US network egress confinement (see [cloud-inference](../architecture/cloud-inference.md)).
- **Secret Vault Protocol:** Delivers short-lived, least-privileged credentials to [application-adapters](application-adapters.md) and [agent-runtime](agent-runtime.md).
- **Audit Logging Bus:** Ingests immutable audit events from all system services for secure long-term storage.
- **Private Evidence Boundary:** Central infrastructure explicitly maintains zero backup infrastructure, recovery key escrow, or administrative override keys for employee private evidence. Device-local encrypted storage and key management are governed strictly by [local-privacy-storage](local-privacy-storage.md).

### Process and Security Boundaries
- **Deployment Location:** Multi-cloud or customer-dedicated infrastructure (Kubernetes, managed PostgreSQL, KMS, object storage).
- **Production vs. Simulation Air-Gap:** Strict network policies (VPC peering, egress firewalls) prevent simulation runners from reaching production business ERPs.
- **Tenant Isolation:** Tenant data isolation enforced via database row-level security (RLS) or separate database schemas per organization.

## Internal architecture

### Logical Submodules
- **Tenant Isolation Coordinator:** Enforces tenant schema boundaries and database query filtering.
- **LiteLLM Gateway Operator:** Deploys, configures, and monitors the LiteLLM Proxy service, enforcing `turn_off_message_logging=true`, `disable_spend_logs=true`, `disable_error_logs=true`, zero response caching, and memory-backed temp directory spooling.
- **Secret and Key Vault:** Manages HashiCorp Vault Transit engine for software Ed25519 signing keys (`derived=false`, `exportable=false`, `allow_plaintext_backup=false`), HSM envelope encryption, provider API keys, and ephemeral token generation. Separate key mounts and ACLs segregate `root` (isolated infrastructure custody), `policy` (identity, authorization, privacy policy authority), `publisher` (guidance bundles), and `receipt` signing keys. Application services receive no private key material; they request bounded sign operations over workload-authenticated mTLS.
- **Immutable Audit Store and Authority Recovery Journal:** Write-once-read-many (WORM) storage for compliance audit logs with cryptographic hash chains. Operates the independent Authority Recovery Journal outside the PostgreSQL backup domain: accepts idempotent appends of `AuthorityJournalEntryV1` (`identity.authority-journal-entry.v1`) and issues signed `SignedAuthorityCheckpointV1` (`identity.authority-checkpoint.v1`) receipts.
- **Zero-Trust Network Mesh:** Implements mutual TLS (mTLS) and fine-grained network policies between all microservices.
## State and lifecycle

### State and Persistence
- **Persisted State:** Central database clusters, encrypted object stores, KMS keys, and audit log archives.
- **Lifecycle Transitions:** `Provisioned → Active Monitoring ↔ Scaling / Maintenance → Decommissioned`.
- **Backup, Restore, and Certified Artifact Storage:** Continuous point-in-time recovery (PITR) for relational stores; backups are encrypted with distinct keys. Cloud primary storage, write-ahead logs (WAL), read replicas, and backup archives must certify compliance with the signed artifact policy's maximum lifetime (<= 365 days); issuance of artifact policies by `identity-policy` is blocked unless cloud infrastructure storage certification is active. Database restore procedures filter expired and revoked artifacts before serving any read traffic. Disclose truthfully that local withdrawal removes active published intake immediately but does not promise instant physical erasure of existing write-ahead log segments or encrypted offline disaster recovery snapshots until normal snapshot retention expiry. If no certified image-storage policy exists, image-bearing review and release are rejected; employees may prepare and review a separate text-only contribution.
- **Authority Recovery and Restore Protocol:** Following any PostgreSQL database restore, all privileged traffic and lease issuance remain disabled until the independent Authority Recovery Journal is queried for its latest signed checkpoint (`SignedAuthorityCheckpointV1`). The independent journal is extended with minimal 5-field sync custody projections (`sync_custody_changed`), ensuring that both authority fences and contribution custody survive relational PITR restores without rolling back. The complete journal range is replayed to reconstruct membership, policy revisions, revocations, action fences, and submission custody. Pre-restore sessions, unconsumed tokens, and pending approvals are invalidated; reopening establishes a new recovery epoch and sets `recovery_admission_floor` to reopening UTC + 5s, rejecting pre-recovery keys with `CP_RECOVERY_REQUIRED`. If the journal is gapped, unverified, or unavailable, operations fail closed with `IDENTITY_RECOVERY_INCOMPLETE`.

### Application-Facing Platform Contracts
- **Portable Kubernetes Environment:** Application pods (API/BFF, Durable Worker, Inference Worker) run as non-root (UID 10001), drop all Linux capabilities, mount read-only root filesystems, and disable swap space and core dumps. Inference nodes mount memory-only scratch spools (`emptyDir: { medium: "Memory", sizeLimit: "256Mi" }`) with active zeroing on exit.
- **Connection Allocation:** Total application connection pool across PostgreSQL 18 HA is capped at 64 (24 API, 16 Worker, 8 Inference, 16 dedicated reserve for LISTEN, journal completion, and safety).
- **Mandatory Row-Level Security:** Every tenant table in PostgreSQL enforces `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`. Scoped database roles cannot bypass RLS.
- **US Processing Confinement:** LiteLLM proxy and certified model providers operate exclusively in US regions with contractual zero data retention (ZDR) and no training.
- **Honest Node-Failover vs. Disaster Recovery Targets:** Multi-AZ synchronous replication targets automated node failover ≤ 30 seconds with zero acknowledged data loss. In contrast, regional disaster recovery from backup targets ordinary canonical data RPO ≤ 15 minutes and RTO ≤ 4 hours; acknowledged authority and custody records remain fail-closed and non-rollback via the independent recovery journal.

## Error and edge-case behavior

### Failure Handling
- **Database Node Outage:** Automated multi-AZ failover promotes replica within 30 seconds with zero data loss.
- **Network Partition:** Partitions between control plane and workers cause workers to pause privileged executions safely.
- **KMS / HSM Unreachable:** Privileged write operations fail closed until cryptographic key services are restored.

## Observability and audit

### Telemetry and Diagnostics
- Comprehensive infrastructure monitoring (Prometheus, Grafana, CloudWatch) tracking CPU, memory, IOPS, and network error rates.
- Security Information and Event Management (SIEM) integration forwarding security logs to customer SOCs (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Cross-Tenant Data Breaches:** RLS and mandatory tenant query parameters prevent multi-tenant data contamination.
- **Compromised Worker Containers:** Container sandboxes restrict lateral network movement and prevent host kernel escapes.
- **Audit Tampering:** Audit records are cryptographically chained; deletion or alteration of historical logs is mathematically detectable.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.1: ORY-006, ORY-009; §31.7: ORY-064, ORY-068–070](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* A customer tenant is formally offboarded via administrative command; an active runner attempts to query the database using a cached tenant token.
  - *Expected Observable Result:* The database isolation layer rejects the query with a Tenant Inactive error; all active jobs for that tenant are terminated; secret keys associated with the tenant are immediately revoked in the KMS.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- 99.9% control-plane availability SLA.
- Automated horizontal pod autoscaling responding to worker queue depth.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What cloud infrastructure provider and Kubernetes distribution should serve as the primary deployment target?
- How should multi-tenant database partitioning be structured (Row-Level Security vs. database-per-tenant)?
- What KMS architecture supports customer-managed encryption keys (CMEK) for enterprise compliance?
- What disaster recovery RPO/RTO targets can be committed to without excessive multi-region replication costs?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Physical/cloud infrastructure, network segregation, KMS secret vaults, and audit storage integrity.
2. *Data ingress/egress:* Ingests audit logs and infrastructure metrics; outputs secure connection fabrics and encryption keys.
3. *Versions/identities:* Infrastructure release tag, Kubernetes cluster ID, KMS Key ARN, and Tenant ID.
4. *Upstream failure:* If cloud provider region fails, multi-AZ/cross-region failover restores operations.
5. *Authority:* Infrastructure operates under policies defined by [identity-policy](identity-policy.md) and enterprise compliance.
6. *Testing without private details:* Tested via automated chaos engineering, penetration testing, and disaster recovery drills.
7. *Audit and duplicate prevention:* Audit logs use cryptographic hash chains to guarantee immutability.
8. *Failure blast radius:* Infrastructure issues in one tenant namespace are isolated from other customer tenants.
9. *v1.0 criteria:* Enables ORY-006, ORY-009, ORY-064, ORY-068, ORY-069, and ORY-070 verified through isolation and audit drills.
