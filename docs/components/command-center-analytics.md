# Command Center, Notifications, and Analytics Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§5.7, 12.7](../../TECHNICAL.md) | [PRODUCT.md §§11–12, 22–24, 26, 30; ORY-016, ORY-060–066](../../PRODUCT.md)

### Core Responsibility
The Command Center, Notifications, and Analytics component presents organization-scoped operations, playbooks, agent catalogs, evaluations, jobs, incidents, changes, and aggregate reporting via web interfaces, delivering role-filtered navigation and notifications.

### Owns
- The web application user interface, navigation hierarchies, and role-scoped view projections.
- Central notification inbox, alert prioritization, and delivery tracking.
- Aggregate operational analytics, automation health reporting, and the 14-day Operational X-Ray report.
- Workflow and agent review interfaces (Operations Map visualizer, candidate diff reviewer, approval inboxes).
- Export generation for permitted organizational knowledge and audit trails.

### Consumes
- Authorized read models and domain events from [control-plane](control-plane.md).
- Operations Map graph data from [operational-graph](operational-graph.md).
- Role definitions, permissions, and session context from [identity-policy](identity-policy.md).
- Aggregated job execution and verification metrics from [job-orchestration](job-orchestration.md) and [outcome-verification](outcome-verification.md).

### Produces
- Human management actions (approving playbooks, initiating jobs, managing releases) routed to [control-plane](control-plane.md).
- User interface feedback, notification acknowledgments, and report export requests.
- Filtered analytics dashboards and Operational X-Ray pilot reports.

### Does Not Own
- Authoritative business policy enforcement or action authorization (owned by [identity-policy](identity-policy.md)).
- Raw screen, audio, or desktop observation media (strictly prohibited from cloud dashboards).
- Employee surveillance analytics (individual active time, idle scoring, or employee rankings are forbidden by product architecture).

### Boundary Requirement
The frontend UI is strictly a presentation and interaction layer; it is never an authorization authority. All permissions and data access restrictions are enforced authoritatively by backend domain services. Analytics must remain strictly workflow- and organization-centric. Reports must clearly distinguish verified successes from estimated time avoidance and disclose data sample caveats.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§11–12, 22–24, 26, 30; ORY-016, ORY-060–066](../../PRODUCT.md))
- **Role-Scoped Views:** Home and navigation dynamically adjust content according to viewer role; restricted details remain hidden (ORY-060).
- **Operations Map:** Displays full operational capability graphs connecting workflows, rules, agents, and dependencies (ORY-016, ORY-061).
- **Cross-Team Handoff Management:** Enables authorized users to create, assign, and track inter-team handoff tasks (ORY-062).
- **Outcome-Accurate Reporting:** Reports distinguish verified success, partial success, unknown outcomes, and estimated avoidance (ORY-063).
- **Prohibition of Surveillance:** Managers cannot generate individual active-time, idle-time, attendance, or ranking reports (ORY-064).
- **Operational X-Ray Pilot Reports:** Generates 14-day pilot reports detailing discovered workflows, sample caveats, and recommendations (ORY-065).
- **Export Governance:** Exports include scope, period, methodology, privacy restrictions, and uncertainty labels (ORY-066).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Contract Reference #18 in [Contracts Catalog](../architecture/contracts/README.md):** Consumes authorized read models, notifications, and audit records from [control-plane](control-plane.md), [operational-graph](operational-graph.md), [workflow-discovery](workflow-discovery.md), and [release-governance](release-governance.md).
- **Workflow Discovery and Candidate Review Presentation:** Consumes candidate review models (`workflow.candidate.v1`, `workflow.candidate-revision.v1`) and opportunity projections (`workflow.opportunity.v1`) from [control-plane](control-plane.md) via Contract 18 read endpoints. Presents candidate revision diffs, step graphs, and clarification question inboxes (`ClarificationQuestionV1`). Renders opportunity projections with disclosed financial assumptions (`OpportunityAssumptionsV1`) and applies cohort privacy suppression when contributor cohort size is below threshold. Dispatches reviewer commands (`CandidateEditV1`, `CandidateApprovalV1`, `CandidateRejectionV1`) with optimistic concurrency (`expected_revision`).
- **Contract Reference #22 Reference:** Command center reporting excludes private raw captures, audio, and transcripts; any model-assisted analytical synthesis routes through LiteLLM under [cloud-inference](../architecture/cloud-inference.md).
- **Command Dispatch Contract:** Submits user commands (job triggers, approval actions) to [control-plane](control-plane.md) using strongly typed API contracts.
- **Notification WebSocket:** Subscribes to real-time notification streams for urgent approval requests and incident alerts.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Single-page web application (SPA) delivered to modern enterprise web browsers over HTTPS.
- **Zero Raw Capture Access:** The Command Center has zero technical pathways to query or view raw desktop frames or unreviewed audio.
- **Client-Side Authorization Prohibition:** UI views reflect backend authorizations; client-side route guards are purely for UX and cannot bypass backend data filtering.

## Internal architecture

### Logical Submodules
- **Navigation and View Router:** Manages role-based layouts, dashboard cards, and navigation state.
- **Candidate and Opportunity Review Module:** Renders semantic diffs between candidate revisions, visualizes acyclic repeat and decision branches, manages clarification question answering, displays evidence links without private local IDs, and presents sample-based opportunity metrics with explicit assumption caveats.
- **Operations Map Visualizer:** Renders interactive node-link diagrams of capabilities, rules, and dependencies.
- **Approval and Review Inbox:** Presents pending Tier 3 approvals, candidate workflows, and exception rules with supporting evidence.
- **Analytics and Report Engine:** Aggregates time-series operational metrics, ROI estimates, and pilot X-Ray summaries.

## State and lifecycle

### State and Persistence
- **Persisted State:** Minimal client-side session cache; all authoritative state resides in backend control plane databases.
- **Lifecycle Transitions:** Reacts to real-time WebSocket events to update dashboard states without full page reloads.
- **Session Expiration:** Automatically clears local caches and redirects to login upon session expiration or token revocation.

## Error and edge-case behavior

### Failure Handling
- **Backend Disconnection:** Displays a visible offline indicator and disables action buttons until connection is restored.
- **Partial Data Availability:** When aggregate metrics are partially missing, charts display explicit data-incomplete caveats rather than showing zero.
- **Unauthorized Resource Access:** Gracefully handles 403 Forbidden responses with clear explanation of required permissions.

## Observability and audit

### Telemetry and Diagnostics
- Captures frontend performance metrics (Core Web Vitals, page render times, error boundaries).
- User actions in the UI generate backend audit records documenting administrative operations (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Cross-Site Scripting (XSS):** Enforces strict Content Security Policy (CSP) and framework sanitization on all rendered markdown.
- **Click-Jacking Defense:** Prevents embedding Command Center within third-party iframes via `X-Frame-Options: DENY`.
- **Surveillance Resistance:** Backend APIs strictly reject any query requesting employee activity breakdown, protecting against custom frontend modifications.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.2: ORY-016; §31.7: ORY-060–066](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* An engineering manager logs into Command Center and attempts to navigate to an individual employee's daily activity timeline or generate a team attendance ranking.
  - *Expected Observable Result:* The Command Center exposes no individual activity navigation; attempts to call underlying reporting APIs for user-level productivity metrics return 403 Forbidden with an anti-surveillance policy rejection; aggregate workflow metrics remain visible.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Fast initial page load (under 2 seconds over standard broadband).
- Smooth interactive rendering of complex Operations Maps with hundreds of nodes.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What frontend framework (React, Vue, or Svelte) and graph visualization library best renders dense Operations Maps?
- How should real-time notifications be delivered reliably (WebSockets vs. Server-Sent Events) across enterprise firewalls?
- What aggregation pipeline (ClickHouse, materialized views, or OLAP engine) should back the Operational X-Ray report?
- How should export generation handle large multi-gigabyte audit trail downloads efficiently?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* Web presentation layer, Operations Map visualization, notification delivery, and aggregate reporting.
2. *Data ingress/egress:* Ingests authorized domain read models; outputs user commands and export requests.
3. *Versions/identities:* Web application build version, User ID, Organization ID, and Active Role.
4. *Upstream failure:* If backend services are degraded, frontend displays read-only cached status with warning banners.
5. *Authority:* The Command Center presents data; backend domain owners are authoritative for all business state.
6. *Testing without private details:* Tested via end-to-end Cypress/Playwright suites with synthetic tenant fixtures.
7. *Audit and duplicate prevention:* Management commands require idempotency tokens generated in the client session.
8. *Failure blast radius:* Frontend failure affects web users; background agent execution and local capture continue.
9. *v1.0 criteria:* Enables ORY-016, ORY-060, ORY-061, ORY-062, ORY-063, ORY-064, ORY-065, and ORY-066.
