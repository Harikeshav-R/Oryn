# Identity Authority, Typed Policy Evaluation, and Concurrency Fencing

**Status:** accepted  
**Date:** 2026-11-10  
**Deciders:** User-Approved Architecture Review  
**Authority:** Technical Architecture & Security Engineering  
**Amends:** [ADR-0008](0008-reviewed-still-image-sharing.md), [ADR-0009](0009-local-context-guidance-and-assist-boundaries.md), [ADR-0010](0010-contribution-delivery-and-guidance-sync.md)  
**Normative Specification:** [docs/components/identity-policy.md](../components/identity-policy.md)

---

## Context

Oryn governs the execution boundary between autonomous AI agents, desktop human assistance, and external enterprise business applications ([PRODUCT.md §§6–7, 14, 16.6, 25.6–9](../../PRODUCT.md)). While foundational architecture established edge privacy isolation ([ADR-0007](0007-private-evidence-storage-and-retention.md)), governed inference gates ([ADR-0005](0005-cloud-inference-and-private-evidence.md)), and guidance cache synchronization ([ADR-0010](0010-contribution-delivery-and-guidance-sync.md)), critical architectural tensions remained open regarding how organizational identity is established, how policies are evaluated at scale, and how consequential actions are authoritatively gated and fenced:

1. **Authentication Broker vs. Authorization Authority:** Whether external enterprise identity providers (Auth0/SAML/OIDC) should convey Oryn membership, roles, and autonomy permissions, or whether external assertions must remain strictly limited to authentication proof.
2. **Policy Evaluation Paradigm:** Whether organizational policies should be expressed in a dynamic domain language (e.g., Cedar, OPA/Rego) or through an embedded, pure typed evaluator compiled into the control-plane binary.
3. **Endpoint Cryptographic Key Custody:** How endpoint review keys should be secured, resolving historical architectural claims of "Ed25519 in Apple Secure Enclave" with technical platform realities.
4. **Central Signing and Trust Roots:** How short-lived authorization tokens, approval proposals, and policy leases are signed without exposing master signing keys or introducing remote hardware attestation dependencies.
5. **Linearization, Revocation, and Dispatch Races:** How to guarantee that permission revocations win against in-flight authorization tokens, how duplicate dispatch is durably prevented, and how database restore operations avoid resurrecting consumed or revoked authority.

---

## Decision

1. **Decoupled Managed Authentication (Auth0) and Oryn-Owned Session Authority:**
   - Auth0 Universal Login functions strictly as an external authentication broker using Authorization Code with PKCE `S256` in the external system browser. The native desktop binds a local loopback port dynamically selected from a registered pool of 32 ports (`49152–49183`), path `/callback`.
   - Auth0 claims prove *identity authentication only*. Auth0 assertions never confer Oryn organization membership, role assignments, capture consent, publication rights, or execution authority.
   - Initial Auth0 tokens are validated server-side and immediately discarded. Oryn issues opaque 256-bit random session and access tokens, storing SHA-256 token digests in the control-plane database.
   - Desktop sessions last at most 7 days; web BFF sessions last at most 12 hours with a 30-minute inactivity lock; child access tokens last at most 5 minutes.
   - Consequential actions require step-up MFA verified within the past 5 minutes, proven via Auth0 Actions emitting signed namespaced claims (`https://oryn.app/claims/mfa_at`).

2. **Pure Typed Rust Policy Evaluator:**
   - Policy evaluation is implemented as a pure, deterministic Rust function (`evaluate_authorization`) embedded in the modular control plane, operating over immutable typed snapshots (`AuthorizationSnapshotV1`).
   - Customer policy languages (Rego, Cedar), custom-role editors, and dynamic rule scripting are rejected for v1.0. Policy is represented as immutable, schema-checked typed configuration records.
   - Evaluation order is strictly deterministic: Workload Authentication -> Tenant Boundary -> Mandatory Product Guards (Tier 4 Prohibition) -> Scope Matching -> Explicit Denials -> Effective Risk Floor -> Release Eligibility -> Delegation & Separation Constraints -> Required Human Approval Resolution.
   - Missing, ambiguous, or indeterminate policy inputs unconditionally evaluate to `Deny`.

3. **OS-Protected Software Ed25519 Endpoint Review Keys:**
   - We execute a clean architectural cutover correcting prior claims of "Ed25519 hardware/Secure Enclave review keys". Apple Secure Enclave natively supports P-256 (secp256r1) but not Ed25519.
   - Desktop review keys are generated and stored as software Ed25519 keys within OS-protected credential storage (`com.oryn.device.identity` in macOS Keychain / Windows Credential Manager), isolated from media encryption keys.
   - Registration requires cryptographic proof of possession over a single-use server challenge. Sync components verify public attestations; private endpoint keys are never escrowed centrally.

4. **Purpose-Bound HashiCorp Vault Transit Signer & Canonical Preimages:**
   - Central signing keys (Ed25519) are held in HashiCorp Vault Transit mounts, partitioned by key purpose (`root`, `policy`, `publisher`, `receipt`).
   - Signing preimages are strictly defined as `UTF8(schema_id) + 0x0A (LF byte) + RFC_8785_Canonical_JSON(payload)`. Vault textual wrappers are decoded to 64 raw bytes and encoded as unpadded base64url strings.
   - Authority is dual-digested: `action_sha256` (underscore prefix) binds the exact execution target and arguments; `proposal_digest` (hyphen prefix) binds the human-reviewed parameter diffs and consequence summary.

5. **Consumed-Before-Dispatch Linearization and Authority Recovery Journal:**
   - Authorization issuance and consumption are strictly decoupled. Issuance produces a short-lived token (max 30 seconds).
   - The commit of `POST /v1/identity/actions/consume` is the irreversible linearization point. It atomically locks `identity_action_fence` keyed by `(organization_id, execution_context_sha256, action_id)` and commits before external dispatch begins.
   - Subsequent permission revocations apply immediately to canonical database guards and outbox streams. Once an action is admitted, revocation attempts best-effort execution abort, but cannot promise rollback of already-dispatched mutations.
   - To prevent database backups from resurrecting revoked credentials or unconsuming action fences, every state transition and action admission appends an `AuthorityJournalEntryV1` to an independent immutable authority recovery journal. On database restore, all privileged traffic is held until the latest signed checkpoint (`SignedAuthorityCheckpointV1`) is verified and replayed. Any unverified journal gap yields `IDENTITY_RECOVERY_INCOMPLETE` and keeps tenant operations restricted.

---

## Rationale and Alternatives

- *Alternative Considered: Cedar or OPA/Rego Policy Engines:* Rejected. While dynamic policy engines offer flexible policy languages, they introduce external interpreter dependencies, non-trivial execution overhead, and potential runtime parsing failures. A pure, strongly typed Rust evaluator provides sub-millisecond evaluation (p95 <= 1 ms), complete formal exhaustiveness, compile-time type safety, and zero external runtime dependencies.
- *Alternative Considered: Hardware Enclave / WebCrypto P-256 for Review Keys:* Rejected. While Apple Secure Enclave supports P-256, cross-platform alignment (macOS and Windows) and uniform cryptographic primitives across server Vault keys, sync signatures, and review attestations strongly favored Ed25519. Storing Ed25519 keys within OS-protected credential storage (`com.oryn.device.identity`) provides robust process isolation and disk encryption without making false hardware attestation claims.
- *Alternative Considered: Two-Phase Commit (2PC) or Distributed Transaction Across External Systems:* Rejected. External SaaS business applications and web portals do not participate in distributed transaction protocols. Attempting to hold database locks during external network calls causes connection pool exhaustion and deadlocks. Atomically locking the logical action fence *prior* to external dispatch provides unambiguous side-effect linearization without distributed transactions.
- *Alternative Considered: Database Backups Alone for Disaster Recovery:* Rejected. If a database is restored from a snapshot taken four hours prior, all permission revocations and action fence consumptions that occurred in that four-hour window would be erased, resurrecting revoked employees and allowing duplicate execution of consequential actions. Coupling PostgreSQL with an independent, append-only Authority Recovery Journal guarantees that disaster recovery replays all recent revocations and fence locks before traffic resumes.

---

## Consequences

### Positive
- **Deterministic Autonomy Defense:** Hardcoded Tier 4 prohibition and deterministic PDP evaluation protect against prompt injection and autonomous model privilege escalation.
- **Sub-Millisecond Evaluation:** Pure Rust evaluator delivers sub-millisecond policy decisions without network round-trips to external policy servers.
- **Replay and Double-Action Immunity:** Dual digests and durable action fences guarantee that every consequential action is executed at most once.
- **Rollback Resilience:** Authority Recovery Journal ensures database disaster recovery cannot re-open consumed fences or restore revoked access.
- **Cryptographic Clarity:** Clear, unpadded base64url Ed25519 signatures over RFC 8785 canonical bytes across all schemas.

### Negative / Tradeoffs
- **Fixed Role Matrix:** Custom, user-defined role creation is unavailable in v1.0, requiring organizations to map responsibilities into the nine fixed roles.
- **Irreversible External Admissions:** Once an action consumption is committed, revocation cannot guarantee external recall if the adapter has already begun network transmission.
- **Auth0 Dependency for Initial Setup:** Enterprise SSO requires a fully configured Auth0 connection; test mail providers cannot substitute production email delivery.

---

## References
- Normative Component Specification: [docs/components/identity-policy.md](../components/identity-policy.md)
- Wire Schema: [docs/architecture/contracts/identity-policy-v1.schema.json](../architecture/contracts/identity-policy-v1.schema.json)
- Synthetic Fixtures: [docs/architecture/contracts/identity-policy-v1.fixtures.json](../architecture/contracts/identity-policy-v1.fixtures.json)
- Upstream Contracts: [Cross-Component Contracts Catalog](../architecture/contracts/README.md)
