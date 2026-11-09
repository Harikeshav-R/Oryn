# Living Operational Graph and Knowledge Governance Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§3, 5.4, 9.1, 10.2](../../TECHNICAL.md) | [PRODUCT.md §§5, 10–11, 21.8, 26; ORY-015–018, ORY-061–062](../../PRODUCT.md)

### Core Responsibility
The Living Operational Graph and Knowledge Governance component maintains the authoritative, versioned network of approved business processes, published playbooks, domain rules, system dependencies, peer fixes, and cross-team handoffs.

### Owns
- The authoritative Operational Capability entity model and playbook registry.
- Knowledge relationship mapping connecting workflows, applications, business rules, exceptions, and agents.
- Version lineage and immutable history for all approved procedures and rules.
- Scoped search and dependency query traversal (e.g., impact analysis for changed rules).
- Knowledge conflict detection, rule freshness monitoring, and deprecation lifecycles.

### Consumes
- Approved workflow candidates from domain reviewers via [workflow-discovery](workflow-discovery.md) and [control-plane](control-plane.md).
- Accepted expert corrections and rule proposals from [incident-correction-repair](incident-correction-repair.md).
- Authorized cross-team handoff commitments and reviewed meeting handoffs (`ReviewedMeetingHandoffProposal`) from [contribution-sync](contribution-sync.md) via Contract 24.
- Agent evaluation and release outcomes from [release-governance](release-governance.md).
- Governed cloud embedding and reranking operations (`text.embed`, `text.rerank`) via [cloud-inference](../architecture/cloud-inference.md).
### Produces
- Published playbooks and peer error resolutions delivered to [local-context-hud](local-context-hud.md) via [contribution-sync](contribution-sync.md).
- Approved capability definitions and business postconditions delivered to [agent-factory-ir](agent-factory-ir.md).
- Operations Map graph projections delivered to [command-center-analytics](command-center-analytics.md).
- Blast radius queries identifying affected workflows and agents when a rule or application changes.

### Does Not Own
- Raw desktop media, screen capture, or unreviewed personal history (strictly prohibited).
- Authorizing production execution or evaluating runtime permissions (owned by [identity-policy](identity-policy.md)).
- Generating executable agent code or test suites (owned by [agent-factory-ir](agent-factory-ir.md)).

### Boundary Requirement
Strictly separate observational evidence, proposed interpretations, and authoritative rules. Graph traversal must answer authoritative dependency questions based on verified links; semantic vector retrieval may assist exploration but cannot override structural relationships. Policy conflicts must be flagged explicitly and block automatic execution.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§5, 10–11, 21.8, 26; ORY-015–018, ORY-061–062](../../PRODUCT.md))
- **Team-Scoped Publication:** Verified playbooks can be published to specific authorized teams; unauthorized users are restricted from viewing details (ORY-015).
- **Operations Map Visualization:** Displays approved workflows, owners, business rules, exceptions, application dependencies, and linked agents (ORY-016, ORY-061).
- **Conflict Resolution Blocking:** Policy conflicts are displayed as unresolved and automatically block execution of the affected workflow branch (ORY-017).
- **Peer Error Resolution with Provenance:** Stores published peer fixes for specific error codes, displaying verifiable provenance to searching employees (ORY-018).
- **Cross-Team Handoff Tracking:** Links source workflow, destination workflow, expected state, owner, and due date for inter-team handoffs (ORY-062).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #3 in [Contracts Catalog](../architecture/contracts/README.md) (`hud.guidance-bundle.v1`):** Publishes access-filtered guidance bundles (`GuidanceBundleV1`) to [contribution-sync](contribution-sync.md) for caching and delivery to [local-context-hud](local-context-hud.md). Bundles are strictly immutable, version-pinned by content SHA-256 (`playbook_version`), signed by the publisher, and contain deterministic task signatures, step graphs (max 128 steps, cycle-checked), peer-fix descriptors, profile-approved predicates, and optional Stage 3 approved assist plans (`AssistPlanV1`). Private evidence IDs, customer values, executable scripts, and draft procedures are strictly prohibited:

```json
{
  "schema_id": "hud.guidance-bundle.v1",
  "organization_id": "org_enterprise_corp",
  "bundle_id": "01928374-2001-7000-8000-000000000001",
  "bundle_revision": "1",
  "content_sha256": "sha256_e9102c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
  "publisher_signature_ref": "sig_opgraph_pub_20261109_01",
  "playbook_id": "pb_tax_reconciliation_v2",
  "workflow_id": "wf_invoice_po_reconciliation",
  "capability_id": "cap_erp_tax_adjustment",
  "playbook_version": "sha256-e9102c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
  "display_revision_label": "v2.1",
  "status": "published",
  "audience": {
    "team_ids": ["team_finance_gl", "team_ap_invoicing"],
    "role_tiers": ["operator", "senior_accountant"]
  },
  "last_verified_at": "2026-11-01T10:00:00Z",
  "applicable_profiles": [
    { "application_profile_id": "prof_app_excel_v1", "min_version": "1.0.0" },
    { "application_profile_id": "prof_app_finance_invoicing_v1", "min_version": "1.0.0" }
  ],
  "effective_rule_versions": ["rule_finance_tax_matching_01:v3"],
  "conflict_flags": [],
  "record_independent": false,
  "objective": "Resolve ERP invoice tax discrepancy",
  "prerequisites": {
    "predicate": {
      "op": "eq",
      "field": "error_code",
      "value": "ERR_TAX_DISCREPANCY_401"
    }
  },
  "expected_result": "Invoice tax discrepancy cleared and ready for GL post",
  "task_signature": {
    "entry_application_id": "com.microsoft.Excel",
    "entry_predicate": {
      "op": "eq",
      "field": "error_code",
      "value": "ERR_TAX_DISCREPANCY_401"
    }
  },
  "steps": [
    {
      "step_id": "step_check_rate",
      "order": 1,
      "title": "Verify Tax Rate in Reference Schedule",
      "instruction": "Check tax rate formula matches line item schedule before posting.",
      "rationale": "Prevents GL tax mismatch.",
      "rule_refs": ["rule_finance_tax_matching_01:v3"],
      "source_refs": ["ev_pub_guidance_tax_01"],
      "optional": false,
      "prerequisite_predicate": null,
      "expected_state_predicate": {
        "op": "eq",
        "field": "active_cell_formula",
        "value": "=VLOOKUP(A2, Rates!A:B, 2, FALSE)"
      },
      "allowed_targets": [
        { "application_profile_id": "prof_app_excel_v1", "target_key": "active_cell" }
      ],
      "timeout_ms": 30000,
      "assist_plan_ref": null
    },
    {
      "step_id": "step_post_adjustment",
      "order": 2,
      "title": "Post Adjustment in ERP",
      "instruction": "Click Post Adjustment in the invoice screen to reconcile batch.",
      "rationale": "Commits verified line items.",
      "rule_refs": ["rule_finance_tax_matching_01:v3"],
      "source_refs": ["ev_pub_guidance_tax_01"],
      "optional": false,
      "prerequisite_predicate": {
        "op": "eq",
        "field": "active_cell_formula",
        "value": "=VLOOKUP(A2, Rates!A:B, 2, FALSE)"
      },
      "expected_state_predicate": {
        "op": "eq",
        "field": "status",
        "value": "Pending Review"
      },
      "allowed_targets": [
        { "application_profile_id": "prof_app_finance_invoicing_v1", "target_key": "target_approve_button" }
      ],
      "timeout_ms": 30000,
      "assist_plan_ref": "plan_tax_post_adjustment_v1"
    }
  ],
  "peer_fixes": [
    {
      "peer_fix_id": "fix_tax_disc_01",
      "application_profile_id": "prof_app_excel_v1",
      "application_profile_version": "1.0.0",
      "normalized_error_code": "ERR_TAX_DISCREPANCY_401",
      "fix_playbook_version": "sha256-e9102c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
      "provenance": "peer_verified",
      "permitted_action_categories": ["guidance_and_assist"]
    }
  ],
  "assist_plans": [
    {
      "assist_plan_id": "plan_tax_post_adjustment_v1",
      "assist_plan_version": "1.0.0",
      "plan_sha256": "sha256_b3f0e1d2c3b4a596877869504132231405162738495a6b7c8d9e0f1a2b3c4d5e",
      "playbook_version": "sha256-e9102c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
      "owner_approval_ref": "appr_tax_lead_20261109",
      "allowed_applications": ["prof_app_finance_invoicing_v1"],
      "allowed_transitions": ["trans_open_invoices", "trans_view_invoice_detail"],
      "allowed_record_types": ["rec_inv"],
      "variables": [
        { "name": "amount", "type": "decimal", "required": true }
      ],
      "actions": [
        {
          "step_id": "step_post_adjustment",
          "action_order": 1,
          "operation": "click",
          "target_key": "target_approve_button",
          "risk_tier": "tier_2",
          "declared_effects": ["state_transition_pending_review"],
          "stopping_point": "stop_before_commit",
          "timeout_ms": 5000,
          "expected_state": {
            "record_revision": "12",
            "fields": [
              { "field_key": "status", "value": "Pending Review" }
            ]
          }
        }
      ],
      "assist_eligibility": {
        "eligibility_id": "elg_01928374-0001",
        "organization_id": "org_enterprise_corp",
        "assist_plan_id": "plan_tax_post_adjustment_v1",
        "assist_plan_version": "1.0.0",
        "plan_sha256": "sha256_b3f0e1d2c3b4a596877869504132231405162738495a6b7c8d9e0f1a2b3c4d5e",
        "playbook_version": "sha256-e9102c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
        "rule_versions": ["rule_finance_tax_matching_01:v3"],
        "application_profile_versions": ["prof_app_finance_invoicing_v1:1.0.0"],
        "evaluation_id": "eval_flt_01928374-0001",
        "suite_version": "suite_v2_stage3",
        "verified_example_count": 6,
        "passed_scenario_count": 28,
        "edge_negative_count": 6,
        "mandatory_checks_passed": true,
        "all_branches_covered": true,
        "owner_approval_ref": "appr_rel_gov_20261109_01",
        "separation_of_duties_satisfied": true,
        "allowed_scope": "finance_invoicing_batch",
        "status": "approved"
      }
    }
  ]
}
```

- **Contract Reference #5 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers approved capability models, business rules, and postconditions to [agent-factory-ir](agent-factory-ir.md).
- **Contract Reference #16 in [Contracts Catalog](../architecture/contracts/README.md):** Receives accepted expert corrections and candidate rule changes from [incident-correction-repair](incident-correction-repair.md).
- **Contract Reference #22 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes `text.embed` and `text.rerank` via LiteLLM gateway under [cloud-inference](../architecture/cloud-inference.md) for semantic knowledge retrieval and node search.
- **Contract Reference #24 in [Contracts Catalog](../architecture/contracts/README.md):** Ingests `ReviewedMeetingHandoffProposal` from [contribution-sync](contribution-sync.md); manages canonical shared status, recipient authorization, and duplicate prevention.
- **Operations Map Projections:** Serves graph queries to [command-center-analytics](command-center-analytics.md).
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Core control-plane service backed by persistent graph/relational storage.
- **Access Control:** Every node and relationship is bounded by tenant isolation and team-level access policies.
- **Rule Authority:** Procedural steps and business policy rules have distinct approval authorities; a workflow owner cannot unilaterally overwrite an enterprise compliance rule.

## Internal architecture

### Logical Submodules
- **Capability and Playbook Registry:** Manages versioned records of operational capabilities and published steps.
- **Graph Traversal Engine:** Executes fast dependency, impact, and blast-radius queries across knowledge entities.
- **Conflict and Freshness Monitor:** Detects contradictory rules, overlapping playbooks, and stale application references.
- **Handoff Coordinator:** Manages cross-team handoff commitments and verifies downstream acceptance.

## State and lifecycle

### State and Persistence
- **Persisted State:** Nodes (Capabilities, Playbooks, Rules, Applications, Exceptions, Handoffs) and edges in central storage.
- **Lifecycle Transitions:** `Candidate Review → Approved & Published ↔ Conflict Flagged ↔ Revised (New Version) → Deprecated → Archived`.
- **Immutable Versioning:** Published playbooks and rules are append-only and immutable; updates instantiate a new version with lineage links.

## Error and edge-case behavior

### Failure Handling
- **Detected Policy Contradiction:** Immediately flags affected nodes with `Conflict Detected`, emits alerts, and notifies connected agents.
- **Dangling Reference:** If an application adapter or rule is deleted, dependent playbooks are marked `Revalidation Required`.
- **Query Timeout:** Deep recursive graph traversals enforce depth limits to prevent resource exhaustion.

## Observability and audit

### Telemetry and Diagnostics
- Logs graph mutation history, version diffs, approval author identities, and query performance metrics.
- All playbook publication, revision, and deprecation events generate immutable audit records (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Unauthorized Rule Alteration:** Rule modifications require specific policy-owner privileges; workflow builders cannot alter compliance rules.
- **Cross-Tenant Knowledge Leakage:** Strict tenant filtering on all graph traversals prevents multi-tenant leakage.
- **Stale Knowledge Risks:** Rules tagged with expiration dates trigger automatic revalidation warnings to prevent obsolete agent actions.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.2: ORY-015–018; §31.7: ORY-061–062](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* A compliance admin updates a financial threshold rule; the operational graph detects that two active playbooks contradict the new rule.
  - *Expected Observable Result:* The graph flags the affected playbooks with an unresolved conflict; the Operations Map displays a conflict warning; automated execution of the affected branch is immediately blocked.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Low-latency sub-50ms reads for cached playbook lookups.
- Scalable graph queries capable of traversing multi-hop dependency chains across thousands of enterprise workflows.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What database model (dedicated graph DB vs. relational with recursive CTEs and vector search) best supports versioned knowledge?
- How should conflict detection algorithms balance semantic ambiguity against strict rule contradictions?
- What schema structure best tracks cross-team handoffs with independent downstream verification?
- How should search indexing combine keyword, vector, and structural graph filters?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Authoritative capability models, published playbook versions, rule provenance, and dependency graphs.
2. *Data ingress/egress:* Ingests approved candidates and expert corrections; outputs published playbooks and dependency queries.
3. *Versions/identities:* Capability ID, Playbook version UUID, Rule version hash, and Organization ID.
4. *Upstream failure:* If discovery services stall, existing published playbooks remain active and authoritative.
5. *Authority:* Assigned domain and policy owners are authoritative for approving graph nodes.
6. *Testing without private details:* Tested via synthetic capability networks and automated graph consistency suites.
7. *Audit and duplicate prevention:* Version increments are strictly monotonic and cryptographically hashed.
8. *Failure blast radius:* Graph service failure prevents new publications; cached endpoint playbooks continue serving local HUDs.
9. *v1.0 criteria:* Enables ORY-015, ORY-016, ORY-017, ORY-018, ORY-061, and ORY-062 verified via graph navigation tests.
