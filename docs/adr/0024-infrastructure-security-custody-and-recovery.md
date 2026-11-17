# 0024. Infrastructure, Key Custody, Independent Journal Durability, and Regional Recovery

Date: 2026-11-16

## Status

Accepted — detailed technical specification complete, implementation pending

Amends:
- [0011-identity-authority-and-approval-fencing.md](0011-identity-authority-and-approval-fencing.md) (Requires dual-region durable S3 writes before external acknowledgment; extends Authority Recovery Journal kinds with `payload_key_custody_changed` and after-images for `infrastructure_payload_key_fence` and `infrastructure_payload_custody_generation`; projects authority after-images to omit sensitive `proposal_json` and action authorization token nonces from WORM; establishes recovery replay fences for custody generations).
- [0012-control-plane-transport-durability-and-inference.md](0012-control-plane-transport-durability-and-inference.md) (Pins primary region `us-east-1` and pilot-light `us-east-2`; establishes DynamoDB Multi-Region Strong Consistency coordination across `us-east-1`, `us-east-2`, and `us-west-2` witness; defines global 64 database connection ceiling and zero-surge rolling updates; enforces memory-only inference spooling and 256 MiB pod ceiling).
- [0016-application-adapter-qualification-and-dispatch-boundaries.md](0016-application-adapter-qualification-and-dispatch-boundaries.md) (Restricts shared SaaS hostnames to qualified sandbox account/environment bindings independently verified by the simulation broker; DNS allowlisting alone does not constitute tenant isolation).
- [0017-agent-runtime-execution-and-recovery.md](0017-agent-runtime-execution-and-recovery.md) (Cuts over runtime custody from per-execution DEKs to per-immutable-value/artifact DEKs and independently deletable Vault Transit wrapping keys; unifies AAD binding to include `key_ref` and `custody_generation`; defines explicit evidence custody loss semantics).
- [0018-job-orchestration-and-scheduling.md](0018-job-orchestration-and-scheduling.md) (Preserves consumed action fences and occurrence watermarks across disaster recovery replay without requiring execution receipts; blocks duplicate job redispatch upon restored historical state).
- [0019-flight-simulator-isolation-and-evaluation-evidence.md](0019-flight-simulator-isolation-and-evaluation-evidence.md) (Mandates independent AWS account and dedicated EKS cluster for simulation workloads; enforces zero shared database credentials or ambient network connectivity to production).
- [0020-outcome-verification-and-evidence-finality.md](0020-outcome-verification-and-evidence-finality.md) (Establishes two-phase destruction fencing with `destroy_pending` and `destroyed` journal barriers; defines explicit payload custody loss exception preserving content-free verification outcomes).
- [0021-incident-correction-and-repair-governance.md](0021-incident-correction-and-repair-governance.md) (Prevents revival of lost custody generations; mandates fresh empty custody generation post-incident while preserving historical unmutated audit verdicts).
- [0023-command-center-reporting-privacy-and-delivery.md](0023-command-center-reporting-privacy-and-delivery.md) (Pre-provisions S3 export and SES infrastructure in recovery region `us-east-2`; aligns reporting read replica lag watermarks; establishes 730-day online and 365-day cold archive retention lifecycle for reporting facts).

## Context

Oryn is an enterprise agentic automation platform operating under strict anti-surveillance, least-privilege, and privacy-first product invariants ([PRODUCT.md](../../PRODUCT.md), [TECHNICAL.md](../../TECHNICAL.md)). As Oryn transitions from conceptual architecture into implementation, the platform requires normative operational infrastructure specifications for cloud hosting, database topology, independent append-only journals, cryptographic key lifecycles, network isolation, and regional disaster recovery.

Prior component designs and architectural ADRs identified several competing implementation tensions:
1. **Hosting and Multi-Tenancy Architecture:** Pure SaaS versus customer-hosted or dedicated deployments, and whether to offer customer-managed encryption keys (CMEK) or multi-cloud hosting in v1.0.
2. **Database Engine and High Availability Topology:** RDS Multi-AZ DB Instance (synchronous standby) versus Multi-AZ DB Cluster (multi-node synchronous storage) versus Aurora PostgreSQL, balancing node failover duration, native cross-region automated backup capabilities, and transactional RLS integrity.
3. **Journal Coordination and Append Durability:** Whether to rely on PostgreSQL outbox tables, message brokers, asynchronous S3 replication, or an independent dual-region object store coordinated via DynamoDB Multi-Region Strong Consistency (MRSC) to guarantee that acknowledged actions, revocations, and fences survive snapshot rollback.
4. **Key Custody Separation (Platform vs. Disposable Evidence):** Recoverable system signing keys and service credentials require high-durability disaster recovery backups. Conversely, finite-lifetime organizational evidence (screen captures, audio, redacted stills, sensitive arguments) requires provable, irreversible crypto-shredding where snapshot or backup persistence does not undermine organizational data disposal.
5. **Granularity of Disposable Data Encryption:** Choosing between per-organization master keys, per-execution session DEKs, or independently generated and deletable per-immutable-value DEKs.
6. **Disaster Recovery and Declared Loss Tradeoffs:** How to handle catastrophic regional loss or unrecoverable quorum loss of disposable key stores without violating immutable WORM audit trails or fabricating false restoration receipts.
7. **Connection Governance and Operational Resource Caps:** Preventing database connection exhaustion across API, Worker, and Inference replicas while respecting connection limits and strict anti-surge rolling updates.

## Decision

### 1. AWS-Managed SaaS Baseline and Multi-Account Security Domains
- **Multi-Tenant AWS SaaS Only:** Oryn v1.0 is delivered exclusively as an AWS-managed SaaS platform. No customer-hosted, customer-dedicated, multi-cloud, or customer-managed encryption key (CMEK) features are introduced.
- **Regional Deployment:** Primary region is `us-east-1` (N. Virginia); pilot-light recovery region is `us-east-2` (Ohio). Witness coordination for regional failover utilizes `us-west-2` (Oregon).
- **Four Distinct Security Accounts:**
  1. *Production Account:* EKS cluster hosting trusted Control Plane APIs, background Workers, Inference gateways, and untrusted gVisor execution node pools.
  2. *Simulation Account:* Dedicated EKS cluster, separate VPC, dedicated brokers, and isolated credentials for flight simulator execution. Zero shared database or control-plane networking.
  3. *Security and Archive Account:* Dedicated EC2 instances hosting two distinct HashiCorp Vault clusters across 3 AZs, WORM S3 audit buckets, and security log delivery brokers.
  4. *Nonproduction Account:* Isolated development and staging environments. Production data, customer evidence, and production trust roots are strictly forbidden from entering nonproduction accounts.

### 2. RDS PostgreSQL 18 Multi-AZ DB Instance
- **Topology:** Single RDS PostgreSQL 18 Multi-AZ DB Instance with one synchronous standby instance across Availability Zones in `us-east-1`, supplemented by one same-region read replica for reporting and analytics.
- **Tradeoff Rationale (Instance vs. Cluster):** An RDS Multi-AZ DB Instance was chosen over a Multi-AZ DB Cluster. While an instance failover target is engineering-budgeted at ≤120 seconds (compared to ~30 seconds for a cluster), DB Instances support native AWS cross-region automated backups with point-in-time recovery (PITR) and 7-day retention history without external tooling.
- **PostgreSQL Configuration:** Forced Row-Level Security (RLS) on all tenant tables, non-bypass application roles (`app_api`, `app_worker`, `app_reporting`), `pgvector` enabled, and canonical tenant session variable `oryn.organization_id`.
- **Target Recovery Objectives:** Ordinary regional recovery achieves RPO ≤ 15 minutes and RTO ≤ 4 hours. Node-level failover target is ≤ 120 seconds measured through application reconnection. Internal Control Plane monthly SLO is 99.9% availability (non-contractual).

### 3. Dual-Copy Independent Journal and DynamoDB MRSC Coordination
- **WORM Object Storage:** Private S3 buckets in `us-east-1` and `us-east-2` configured with versioning, SSE-KMS, and S3 Object Lock in Compliance Mode. Default content-free audit retention is 24 calendar months.
- **MRSC Head Coordination:** Global table coordination in DynamoDB with active replicas in `us-east-1` and `us-east-2`, and witness in `us-west-2`, operating under Multi-Region Strong Consistency (MRSC). DynamoDB serves strictly as an atomic head CAS and lock coordinator; PostgreSQL remains the sole transactional business authority.
- **Dual-Region Durability Gate:** A privileged mutation or consequential action is acknowledged to clients only after content-addressed entry chunks and manifests are durably written to **both** `us-east-1` and `us-east-2` S3 WORM buckets, followed by successful conditional CAS advancement of the MRSC head. Asynchronous S3 replication is rejected as insufficient for authority fencing.
- **Partition and Fencing Behavior:** Network partitions keep dispatch and new privileged authority closed. Restrictions, revocations, and expiry checks remain enforced immediately. Declared disaster replaces the archive pair with `us-east-2`/`us-west-2` only under two-person cryptographic approval, a globally fenced replica-set epoch, and verified committed closure.

### 4. Physically Split Vault Clusters: Platform vs. Expiring Payload Vault
To resolve the contradiction between backup recoverability and irreversible deletion, Oryn runs two physically distinct 3-node HashiCorp Vault clusters on dedicated hardened EC2 instances in the Security Account:
- **Platform Vault:**
  - *Custody:* Root Ed25519 action-signing keys, workload PKI certificate authorities, third-party vendor credentials, and platform transit secrets.
  - *Recovery:* AWS KMS multi-Region auto-unseal key with configured access in `us-east-2`. Automated Raft snapshots taken every 5 minutes, encrypted via KMS, cross-region replicated to `us-east-2`, and retained for 7 days.
- **Expiring Payload Vault:**
  - *Custody:* Disposable wrapping keys for finite-lifetime organizational evidence, screen capture artifacts, audio, and sensitive parameter values.
  - *No Backups:* Strictly exempt from Raft snapshots, EBS snapshots, AWS Backup, AMI creation, volume cloning, key export, and cross-region replication. Enforced via AWS Organizations Service Control Policies (SCPs) and IAM boundary policies.
  - *Explicit Payload Loss Exception:* Regional destruction of `us-east-1` or unrecoverable quorum loss of the Expiring Payload Vault permanently renders affected historical evidence unrecoverable. Content-free audit entries and outcome verdicts are preserved; the lost custody generation is marked `lost`; a fresh generation is initialized. This is an explicit architectural design exception, not a failure of disaster recovery.

### 5. Per-Immutable-Value Envelope Encryption and Two-Phase Destruction
- **Envelope Encryption Hierarchy:** Every immutable evidence artifact and sensitive payload receives an independent AES-256-GCM Data Encryption Key (DEK) generated in-memory with a fresh 96-bit nonce. DEKs are wrapped using dedicated Vault Transit AES-256-GCM wrapping keys with `disable_upsert=true`.
- **Granularity:** Wrapping keys are allocated per immutable artifact/value, not per tenant or per execution session. This amends ADR-0017 and ADR-0018.
- **Cryptographic Binding (AAD):** Additional Authenticated Data binds canonical context:
  `UTF8("oryn.payload-key-binding.v1") + LF + RFC8785(binding)`
  where binding contains `organization_id`, `subject_ref`, `key_ref`, `custody_generation`, and purpose.
- **Two-Phase Destruction State Machine:**
  1. Transaction writes an irreversible `state: "destroy_pending"` fence to the independent journal.
  2. Owner module calls Expiring Payload Vault to delete the Transit wrapping key and verifies key deletion.
  3. Transaction writes a `state: "destroyed"` fence to the journal and confirms absence.
  Timeouts or generation loss never generate false completed-destruction receipts.

### 6. Strict Connection Ceiling and Resource Governance
- **Global Database Connection Cap: 64 Connections:**
  - API Pods: 20 connections (10 per pod across 2 replicas).
  - Reporting Reader: 2 connections.
  - Export Worker: 1 connection.
  - Headroom: 1 connection.
  - Background Worker Pods: 16 connections (8 per pod across 2 replicas; Discovery restricted to at most 4).
  - Inference Pods: 8 connections (4 per pod across 2 replicas).
  - Safety Reserve: 16 connections (reserved strictly for incident containment, LISTEN, and recovery coordinator; never borrowable by reporting).
- **Zero-Surge Rolling Updates:** Database-owning roles deploy with zero-surge (`maxSurge: 0, maxUnavailable: 1`) so old and new pods can never exceed the 64-connection ceiling during rollouts.
- **Inference Isolation:** LiteLLM gateways enforce a 256 MiB memory-only (`tmpfs`) scratch ceiling per pod, 128 MiB final-meeting input limit, max 20 global concurrent sessions (12 per pod max), disabled disk buffering, disabled model/message logging, and strict US provider routing.

### 7. Storage Certification and Security Log Delivery
- **Storage Certification:** Automated continuous scanner inventories all primary, WAL, replica, backup, object, and key storage classes, issuing a 24-hour cryptographically signed `SignedStorageCertificationV1`. If certification expires or configuration drifts, Identity immediately suspends image artifact policy issuance.
- **Security Log Egress Broker:** Dedicated broker delivers content-free OTLP/HTTP JSON logs to customer-configured SIEM/SOC endpoints (`https://<host>:443/v1/logs`) using TLS 1.3, public IP verification (blocking private/metadata addresses and redirects), batches of ≤128 records and ≤256 KiB, and full-jitter exponential backoff.

## Consequences

### Positive
- Prevents database snapshot restore rollbacks from reviving revoked permissions, deleted secrets, or consumed action fences.
- Eliminates the risk of retained backups leaking crypto-shredded customer evidence.
- Physical separation of Platform and Expiring Vaults ensures platform survivability without compromising data disposal invariants.
- Strict 64-connection ceiling and zero-surge rollouts prevent database exhaustion during incidents and deployments.
- DynamoDB MRSC coordination eliminates single-region lock dependencies without compromising multi-region consistency.

### Negative
- Catastrophic loss of `us-east-1` results in intentional permanent loss of disposable payload evidence, though operational metadata and signed audit logs survive.
- Synchronous dual-region S3 writes introduce network latency to client mutation acknowledgments (budgeted under the <250 ms target).
- Zero-surge deployments cause temporary single-pod capacity reductions during rolling upgrades.
