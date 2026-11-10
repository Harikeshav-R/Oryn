# Identity, Organization, Access, and Approval Governance Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§5.2, 9.2–3, 11.3](../../TECHNICAL.md) | [PRODUCT.md §§6–7, 14, 16.6, 25.6–9; ORY-001, ORY-026–030, ORY-048, ORY-068–069](../../PRODUCT.md)

### Core Responsibility
Identity, Organization, Access, and Approval Governance governs organizations, workspaces, teams, user and agent identities, role assignments, action risk tiers, approval policies, credential scoping, and formal human approval decisions across Oryn.

### Owns
- Authoritative tenant/organization structures, workspace boundaries, and membership rosters.
- Role-Based Access Control (RBAC) and granular permission evaluation engines.
- Policy definitions specifying action risk tiers (Tier 0 through Tier 4) and autonomy gates.
- Human approval request routing, binding verification, and cryptographic approval records.
- Mandatory enterprise capture exclusion policies distributed to employee endpoints.
- Issuing signed endpoint capture-policy leases and guidance access leases with configured validity periods (shorter than, but never exceeding, the desktop's 24-hour offline cap).
- Authoritative inference route, purpose, budget, and consent policy governance; issuing and signing `InferenceAuthorization` tokens under Contract 22 (see [cloud-inference](../architecture/cloud-inference.md)).
- Organization offboarding, suspension, and permission revocation enforcement.
### Consumes
- Identity claims and SSO assertions from enterprise identity providers (SAML, OIDC).
- Administrative role assignments and permission updates from [command-center-analytics](command-center-analytics.md).
- Real-time action authorization requests from [agent-runtime](agent-runtime.md) and local executors.
- Approval decisions submitted by authorized human reviewers.

### Produces
- Authoritative authorization verdicts (`Allow`, `Deny`, `RequireHumanApproval`) with policy justifications.
- Cryptographically signed approval tokens bound to specific proposed operations and parameters.
- Signed `InferenceAuthorization` tokens scoped to tenant, purpose, operation, route, and deletion generation (including HUD purposes `hud_context_interpretation`, `hud_demonstration_summary`, `hud_step_explanation`).
- Signed `SignedGuidanceAccessLeaseV1` artifacts authorizing offline read-only cached playbook access (max 24 hours).
- Policy change and access revocation events emitted across the system.
- Audit log records documenting every role change, policy update, and consequential approval.

### Does Not Own
- Verifying whether an agent's business action was *factually correct* (owned by [outcome-verification](outcome-verification.md)).
- Generating agent execution plans or prompt instructions (owned by [agent-factory-ir](agent-factory-ir.md)).
- Directly executing external third-party API mutations (owned by [application-adapters](application-adapters.md)).

### Boundary Requirement
A machine learning model may request authorization, but cannot grant it. Inference authorization is strictly distinct from business action authorization: permission to process information through a model grants zero permission to perform external mutations or publish knowledge. Every consequential action (Tier 3) is intercepted and evaluated by a trusted, deterministic policy engine at the execution boundary. Tier 3 requires an item-level human approval before external commit; Tier 4 restricted actions are strictly unavailable for v1.0 agent execution regardless of prior human demonstrations. All inference routes must have verified contractual zero retention and US-only processing. Capture-policy leases distributed to employee desktop endpoints are bounded by an absolute maximum offline validity ceiling of 24 hours. Upon lease expiry, endpoint observation halts until network connectivity is re-established and policy refreshed.
## Product requirements

### Key Product Requirements ([PRODUCT.md §§6–7, 14, 16.6, 25.6–9](../../PRODUCT.md))
- **Workspace Administration:** Admins can invite users, assign roles, and revoke roles; revocations take effect immediately for future privileged actions (ORY-001).
- **Tier 3 Human-in-the-Loop:** Consequential operations (monetary, external, irreversible) trigger item-level human approval displaying exact proposed changes (ORY-026).
- **Tier 4 Prohibition:** Tier 4 restricted actions are completely blocked from automated execution (ORY-027).
- **Scope Containment:** Agents cannot access applications or records outside their approved scope (ORY-028).
- **No Silent Privilege Expansion:** Agent repairs cannot expand permissions without explicit administrator re-authorization (ORY-029).
- **Stage Progression Gates:** Enforces minimum demonstration and evaluation gates before advancing an agent's autonomy stage (ORY-030).
- **Separation of Duties:** Initiating an agent job does not grant the operator authority to approve consequential actions if their role lacks approval rights (ORY-048).
- **Security Policy Enforcement:** Policy changes immediately block prohibited actions across all active capabilities (ORY-068).
- **Controlled Offboarding:** Deactivating an organization immediately terminates all active capture and agent executions (ORY-069).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #11 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes specific action authorization requests from [agent-runtime](agent-runtime.md) and local executors (including browser actions delegated to [browser-extension](browser-extension.md) and HUD-assisted actions coordinated by [local-context-hud](local-context-hud.md)); validates `ExecutionContextV1` (`job` or `assist`), and issues cryptographic authorization tokens bound to stable `action_sha256` proposal digests, enforcing item-level approval for Tier 3 actions and unconditional denial for Tier 4.
- **Contract Reference #18 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers authorized role-scoped read models and audit events to [command-center-analytics](command-center-analytics.md).
- **Contract Reference #22 in [Contracts Catalog](../architecture/contracts/README.md):** Issues and validates signed `InferenceAuthorization` tokens for [cloud-inference](../architecture/cloud-inference.md); enforces tenant inference budgets, purpose restrictions (including HUD semantic purposes), ZDR terms, and US geographic confinement.
- **Local Policy Artifact Issuance:** Issues Ed25519-signed policy artifacts to [local-privacy-storage](local-privacy-storage.md) and [local-context-hud](local-context-hud.md) using canonical RFC 8785 JSON encoding:
  - `SignedCapturePolicyLease` (`privacy.capture-policy.v1`): Bounded capture lease (max 24 hours) specifying permitted categories, mandatory exclusion catalog revision, application exclusions, and maximum raw retention bounds.
  - `SignedRetentionVerdict` (`privacy.retention-verdict.v1`): Authoritative legal hold verdict (max 24 hours) with complete source scope; missing or incomplete coverage blocks voluntary destruction and uninstallation.
  - `SignedArtifactPolicy` (`privacy.artifact-policy.v1`): Authorizes redacted still-image excerpt sharing for approved organizational purposes, audiences, and maximum artifact lifetimes.
  - `SignedGuidanceAccessLeaseV1` (`hud.guidance-access-lease.v1`): Bounded read-only guidance access lease (max 24 hours) specifying permitted playbook version hashes and scope for [local-context-hud](local-context-hud.md):

```json
{
  "schema_id": "hud.guidance-access-lease.v1",
  "key_id": "key_policy_01",
  "payload": {
    "organization_id": "00000000-0000-4000-8000-000000000001",
    "actor_id": "usr_employee_01",
    "device_id": "dev_macbook_01",
    "profile_id": "prf_default_01",
    "allowed_bundle_hashes": [
      "780ea94e79bc83bd44ebe2bcc04f67b194c012161b797373668a89a9c67c4bec"
    ],
    "policy_revision": "100",
    "access_revision": "200",
    "issued_at": "2026-11-09T20:00:00Z",
    "not_after": "2026-11-10T20:00:00Z",
    "read_only": true
  },
  "signature": "2Opurx3PwyqhwUEWsVUKziAiBS_HMvGp7iwigfzXI3_e6WyH-0RdCz9z-VkstR2-3i9_10H9sxrwBP9DH2S4DQ"
}
```

### Review Key Challenge and Registration Lifecycle
- **Key Generation:** During device enrollment, the desktop helper (`oryn-sync-helper`) generates a dedicated Ed25519 review keypair in hardware/Secure Enclave with an identifier `key_id`.
- **Registration and Proof of Possession:** The endpoint submits the public key to Identity Policy along with a challenge signed by the device enrollment credential. Identity Policy validates the challenge, binds `(organization_id, actor_id, device_id, key_id, public_key, registered_at_utc)`, and activates the key.
- **Sync Authority:** Identity Policy serves as the authoritative trust root for `contribution-sync` (Contract 24). During contribution intake, `control-plane` verifies review attestations against the active public key registered with Identity Policy.
- **Revocation:** When an employee departs, a device is decommissioned, or a key is suspected of compromise, Identity Policy marks the key revoked (`revoked_at_utc`). Subsequent contributions bearing attestations from revoked keys are rejected immediately with `SYNC_ATTESTATION_KEY_REVOKED`.
- **Revocation Broadcasts:** Emits `policy.changed`, `access.revoked`, and `consent.revoked` domain events to invalidate distributed caches and terminate active capture or execution leases upon reconnection.

### Process and Security Boundaries
- **Deployment Location:** Core control-plane service running within the hardened organizational cloud environment.
- **Security Invariant:** Serves as the primary security policy decision point (PDP). Policy evaluation code is strictly isolated from model execution containers.
- **Credential Scoping:** Issues short-lived, least-privileged execution tokens to runners, strictly scoped to target case IDs and adapter operations.

## Internal architecture

### Logical Submodules
- **RBAC and Scoping Engine:** Evaluates actor roles, resource scopes, and tenant memberships.
- **Action Risk Classifier:** Enforces the Tier 0–4 risk taxonomy and determines approval requirements.
- **Approval Integrity Verifier:** Cryptographically binds approvals to exact proposed mutation payloads to prevent parameter tampering.
- **Revocation Coordinator:** Manages revocation broadcasts and coordinates immediate termination of revoked runner tokens.

## State and lifecycle

### State and Persistence
- **Persisted State:** Tenant accounts, user roles, permission policies, approval audit trails, and signing keys in the central transactional database.
- **Lifecycle Transitions:** Approvals transition through `Requested → Pending Review → Approved / Rejected / Expired → Committed`.
- **Policy Immutability:** Policies are versioned immutably; historical executions link to the exact policy version under which they were authorized.

## Error and edge-case behavior

### Failure Handling
- **Policy Engine Unreachable:** Fails closed. If a runner cannot obtain authorization, the action is blocked and held for operator review.
- **Stale Context:** If the target entity's state changes between approval request and commit, the approval is invalidated and must be re-requested.
- **Ambiguous Authorization:** Any evaluation resulting in an indeterminate verdict is treated as `Deny`.

## Observability and audit

### Telemetry and Diagnostics
- Generates tamper-evident audit records for every authorization check, approval decision, role grant, and policy change (ORY-070).
- Telemetry logs capture authorization latency, rejection frequencies, and approval turnaround times.

## Security and threat model

### Security and Safety Considerations
- **Privilege Escalation via Prompt Injection:** Untrusted task data (e.g., invoice text) attempting to command the agent to bypass approvals is thwarted because policy checks occur in the separate deterministic policy engine.
- **Approval Repurposing:** Approvals are cryptographically bound to payload hashes; an approved token cannot be applied to a modified transaction.
- **Cross-Tenant Contamination:** Multi-tenant database queries enforce strict tenant ID partitioning on every lookup.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.1: ORY-001; §31.3: ORY-026–030; §31.5: ORY-048; §31.7: ORY-068–069](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* An agent running a PO reconciliation job attempts to submit a Tier 3 payment release without a valid human approval token.
  - *Expected Observable Result:* The policy engine intercepts the request, returns `Deny (Approval Required)`, transitions the case to `Awaiting Approval`, and emits an approval request notification to the authorized manager.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- High availability for synchronous authorization checks.
- Low-latency evaluation of cached role and policy rules.
- Horizontally scalable stateless evaluation engines backed by distributed caches.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What policy specification format (e.g., Cedar, OPA/Rego, or embedded DSL) offers the best balance of expressiveness and formal verifiability?
- How should approval tokens be cryptographically structured and signed to guarantee tamper-proof binding to action arguments?
- What revocation distribution protocol ensures minimal latency when revoking permissions across distributed worker nodes?
- How should fine-grained separation of duties be modeled between workflow builders, domain owners, and job operators?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Authoritative user roles, tenant policies, approval records, and action risk classification.
2. *Data ingress/egress:* Ingests identity assertions and authorization requests; outputs signed authorization decisions and policy events.
3. *Versions/identities:* Organization ID, actor user ID, policy version hash, and target resource ARN/URI.
4. *Upstream failure:* If identity provider fails, existing active sessions rely on valid cached tokens until expiration.
5. *Authority:* The identity-policy component is the sole authority for action permissions and approval validity.
6. *Testing without private details:* Tested via comprehensive policy test matrices with synthetic roles and scopes.
7. *Audit and duplicate prevention:* Approval tokens include cryptographic nonces to prevent replay attacks.
8. *Failure blast radius:* Policy engine failure causes all privileged executions to fail safe and pause.
9. *v1.0 criteria:* Enables ORY-001, ORY-026, ORY-027, ORY-028, ORY-029, ORY-030, ORY-048, ORY-068, and ORY-069.
