# Oryn — Product Requirements Document

**Document status:** Complete v1.0 product definition  
**Product name:** Oryn  
**Product category:** Self-learning, self-testing, self-maintaining enterprise workflow and agent platform  
**Release:** Version 1.0  
**Audience:** Product design, engineering, quality assurance, security review, customer success, and launch teams  
**Document purpose:** Define the product's behavior, visible experiences, boundaries, policies, and release acceptance requirements. This is a product specification, not a technical architecture or implementation plan.

## How to Use This Document

This is the authoritative proposed **v1.0 product scope** for Oryn. Product behavior, supported capabilities, defaults, policy, release gates, and exclusions are normative unless explicitly labeled illustrative. The sample customer scenarios are examples; they do not establish rules for any real customer. Where a product decision requires an organization's own policy (for example, its approval threshold), Oryn must request that policy and remain restricted rather than guess.

### Contents

- [1. Product Summary](#1-product-summary)
- [2. Customers, Personas, and Jobs to Be Done](#2-customers-personas-and-jobs-to-be-done)
- [3. v1.0 Scope and Product Decisions](#3-v10-scope-and-product-decisions)
- [4. Non-Negotiable Global Product Rules](#4-non-negotiable-global-product-rules)
- [5. Information Model: What the Product Must Understand](#5-information-model-what-the-product-must-understand)
- [6. Roles and Permissions](#6-roles-and-permissions)
- [7. Organization Setup and Enrollment](#7-organization-setup-and-enrollment)
- [8. Employee Observation and Personal Work History](#8-employee-observation-and-personal-work-history)
- [9. Meeting Intelligence and Commitments](#9-meeting-intelligence-and-commitments)
- [10. Workflow Discovery and Candidate Generation](#10-workflow-discovery-and-candidate-generation)
- [11. The Living Operational Graph](#11-the-living-operational-graph)
- [12. Contextual Guidance, Peer Intelligence, and Employee HUD](#12-contextual-guidance-peer-intelligence-and-employee-hud)
- [13. Agent Factory: From Workflow to Executable Agent](#13-agent-factory-from-workflow-to-executable-agent)
- [14. Risk Classification and Autonomy Ladder](#14-risk-classification-and-autonomy-ladder)
- [15. Agent Flight Simulator](#15-agent-flight-simulator)
- [16. Agent Jobs, Queues, and Production Execution](#16-agent-jobs-queues-and-production-execution)
- [17. Outcome Verification and Business Correctness](#17-outcome-verification-and-business-correctness)
- [18. Incident Center and Operational Immune System](#18-incident-center-and-operational-immune-system)
- [19. Human Corrections and Exception Intelligence](#19-human-corrections-and-exception-intelligence)
- [20. Repair Proposals, Regression Prevention, and Self-Maintenance](#20-repair-proposals-regression-prevention-and-self-maintenance)
- [21. Workflow and Agent Versioning: Git for Operations](#21-workflow-and-agent-versioning-git-for-operations)
- [22. Operations Map, Command Center, and Core Navigation](#22-operations-map-command-center-and-core-navigation)
- [23. Operational Analytics, Business Value, and the 14-Day X-Ray](#23-operational-analytics-business-value-and-the-14-day-x-ray)
- [24. Notifications, Reminders, and Attention Management](#24-notifications-reminders-and-attention-management)
- [25. Privacy, Data Lifecycle, Security Policy, and Audit Experience](#25-privacy-data-lifecycle-security-policy-and-audit-experience)
- [26. Cross-Team Work and Business Commitments](#26-cross-team-work-and-business-commitments)
- [27. End-to-End Reference Journeys](#27-end-to-end-reference-journeys)
- [28. Detailed Cross-Product Edge Cases and Expected Behavior](#28-detailed-cross-product-edge-cases-and-expected-behavior)
- [29. Specific Trigger, Consent, and Default Behavior Rules](#29-specific-trigger-consent-and-default-behavior-rules)
- [30. Accessibility, Copy, States, and Experience Quality](#30-accessibility-copy-states-and-experience-quality)
- [31. Release Acceptance Criteria for v1.0](#31-release-acceptance-criteria-for-v10)
- [32. Product Readiness and v1.0 Exit Criteria](#32-product-readiness-and-v10-exit-criteria)
- [33. Future Directions — Explicitly Not v1.0 Requirements](#33-future-directions--explicitly-not-v10-requirements)
- [34. Final Product Definition](#34-final-product-definition)

---

## 1. Product Summary

### 1.1 One-sentence definition

Oryn observes authorized workplace activity, discovers how work gets done, transforms verified procedures into safe and testable AI-powered automations, detects when those automations fail, learns from approved human corrections, and maintains an evolving organizational understanding of operational work.

### 1.2 Product promise

**A company's workflows should become easier to execute, more reliable, and progressively easier to automate as employees and approved agents perform them.**

Oryn combines five experiences into one product:

1. **Collective Procedural Intelligence:** Discover and share successful ways of working, including decisions, exceptions, sources, and measurable outcomes.
2. **Automatic Agent Engineering:** Turn sufficiently understood procedures into reviewable task agents without requiring an employee to manually reconstruct every action.
3. **Agent Flight Simulator:** Test agents against realistic normal, edge, and failure cases before production use and after every change.
4. **Operational Immune System:** Detect abnormal outcomes, pause unsafe actions, explain incidents, and propose validated repairs.
5. **Continuous Improvement:** Version workflows and agents, learn from authorized expert corrections, evaluate improvements, and distribute approved changes.

These are not independent tools. They share one operational knowledge model, evidence history, permissions system, workflow lifecycle, and change-approval experience.

### 1.3 Problems being solved

- Critical procedures are scattered across employees' heads, recordings, static documents, chat messages, meetings, and business software.
- Employees repeatedly encounter errors and exceptions that other employees have already solved.
- Business processes span applications and people, making their end-to-end structure hard to see.
- Traditional automation takes significant effort to configure, test, and maintain.
- An automation can complete its clicks and still produce an incorrect business result.
- Small changes to a vendor interface, document format, or business rule can break an otherwise reliable agent.
- Employees discover corrections and better procedures, but that knowledge rarely reaches every relevant colleague or agent.
- Operations leaders cannot easily distinguish genuinely automatable work from work that still requires expert judgment.

### 1.4 Desired v1.0 outcomes

For an approved workflow, a customer should be able to: (a) observe examples of the workflow with employee permission; (b) inspect a proposed canonical procedure, its evidence, decisions, and exceptions; (c) publish human guidance; (d) create an agent candidate; (e) evaluate it in realistic tests; (f) run it with the appropriate level of oversight; (g) see task and business-outcome evidence; (h) respond to a new failure by contributing one or more corrections; (i) review and validate an agent repair; and (j) roll out the repaired version with a clear history.

A successful v1.0 deployment does not require the customer to replace its existing ERP, CRM, spreadsheets, internal portals, or communication tools.

### 1.5 Positioning and distinctive value

Oryn is **not** merely a screen recorder, SOP generator, process-mining report, general-purpose chatbot, or agent playground. Its product unit is a **verified operational capability**: a repeatable business objective with evidence, allowed decisions, required outcomes, executable behavior, evaluation coverage, maintenance history, and human ownership.

Oryn is differentiated by the closed lifecycle between observed human work, organizational rules, agent generation, outcome-based testing, production observations, human corrections, and controlled agent repair. Every improvement must be traceable to evidence and appropriate authorization; simply witnessing an action must never make that action an approved company policy.

---

## 2. Customers, Personas, and Jobs to Be Done

### 2.1 Primary customer profile

Initial customers are organizations with 20–2,000 people performing repetitive, exception-heavy workflows across multiple business applications. Best-fit initial departments include accounts payable, B2B order operations, logistics operations, revenue operations, and tier-two business support. The customer must be able to supply a workflow owner, a small participating operator group, permitted business data for tests, and a way to verify correct task outcomes.

### 2.2 Personas

| Persona | Primary needs | Typical actions in Oryn |
|---|---|---|
| **Employee / Operator** | Less repetitive work; timely help; privacy; ability to teach the system | Opt into capture, pause recording, follow guides, use macros, supervise jobs, explain exceptions |
| **Subject-Matter Expert (SME)** | Preserve uncommon judgment; reduce repeated escalations | Validate decision rules, resolve exceptions, review candidate procedures, annotate missing cases |
| **Workflow Owner** | Reliable processes with accountable business outcomes | Define objectives, approve procedures and rules, select risk levels, approve agent releases |
| **Agent Operator** | Execute authorized tasks safely with clear review | Start agent jobs, inspect staged changes, approve eligible submissions, manage failed cases |
| **Operations Manager** | Improve throughput, errors, and handoffs without employee surveillance | View aggregate workflows, backlog, completion outcomes, automation opportunities and business impact |
| **Automation Builder** | Turn processes into reliable managed agents | Refine candidate instructions, set test coverage, inspect replays, propose patches and rollouts |
| **Security / Compliance Admin** | Enforce data handling, retention, permissions, and auditability | Set privacy defaults, allowed applications, consent policies, risk restrictions, review audit events |
| **Organization Admin** | Set up workspaces, teams, access, and subscriptions | Invite members, assign roles, maintain organizational settings |
| **Executive Sponsor** | Understand financial and operational outcomes | View aggregated outcome reports and approved business-impact estimates |

One person may have multiple roles. Access is always the union of granted roles minus any explicit restrictions. No role grants access to another employee's raw local screen or audio captures.

### 2.3 Primary jobs

1. "Show me how to complete this unfamiliar task correctly."
2. "Find the verified procedure people already use when this business software fails."
3. "Find tasks we're repeatedly performing and propose which are worth automating."
4. "Create an agent from the procedure we already know works."
5. "Prove that the agent makes the correct business changes across realistic cases."
6. "Process this authorized backlog without losing control over approvals."
7. "Tell me what failed, what changed, and what the agent did not complete."
8. "Learn from the way I resolved the exception, but don't assume my correction is a new company policy."
9. "Test and approve a repair, then distribute it without breaking other workflows."
10. "Explain whether these automations are actually improving outcomes."

---

## 3. v1.0 Scope and Product Decisions

### 3.1 Included in v1.0

- Organization and team workspaces; invitations; role-based permissions.
- Employee desktop companion for Windows and macOS, including a visible capture status and employee pause controls.
- Work-focused browser and supported desktop application observation with application/window exclusions.
- Optional meeting audio transcription and commitment detection, subject to explicit per-meeting consent and organizational recording policy.
- Private local activity history and strict privacy controls; local durable ownership of private captures combined with purpose-authorized transient cloud inference via an Oryn-managed LiteLLM gateway (no on-device model inference in v1.0); sanitized sharing into organizational knowledge.
- Discovery of individual and cross-application workflow candidates from consenting employee demonstrations.
- Structured workflows with goals, inputs, steps, decisions, exceptions, evidence, conditions, outcomes, and version history.
- Organization-wide discovery, search, ownership, review, verification, and publication of approved playbooks.
- Contextual in-app guidance, peer-learned fixes, and commitment reminders.
- Agent candidate generation from reviewed workflows, with editable intent, boundaries, and reviewable actions.
- A graded execution experience: suggestions, guided work, one-click assisted macros, supervised agents, and narrowly scoped autonomous agents.
- Agent Flight Simulator with isolated test cases, outcomes, evidence, failed-case replay, and side-by-side version comparison.
- Jobs, queues, manual triggering, and approved recurring triggering for eligible automations.
- Business-outcome verification; approval of consequential changes; explicit pause/stop/escalation behavior.
- Failure monitoring, incident classification, exception gathering, human correction capture, repair proposals, regression tests, and controlled release.
- Workflow and agent versions, approvals, staged rollouts, rollback where supported, and immutable change history.
- Operational dashboards, outcome and ROI reporting, notifications, exports, and governance controls.

### 3.2 Explicitly excluded from v1.0

- Linux desktop support.
- Unrestricted automation of arbitrary unknown applications with a guarantee of success.
- Silent background recording of every personal or work activity.
- Always-on meeting recording without distinct meeting authorization.
- Manager access to employee screenshots, raw audio, keystrokes, or individual activity scores.
- Remote control of an employee's personal desktop by another user.
- Fully autonomous changes to company policies, approval limits, or financial authority.
- Autonomous money movement, payroll changes, employee termination actions, security permission changes, permanent record deletion, or similarly high-consequence operations.
- Autonomous execution in applications or workflows that have not been explicitly approved.
- An unrestricted agent marketplace or cross-customer distribution of customers' proprietary workflows.
- Automatic procurement or negotiation with external parties without an approved human decision.
- Guaranteed re-creation of third-party production environments or perfect simulation of every external side effect.
- Automatic agent self-modification without evaluation and release controls.
- Employee rankings, productivity scores, surveillance analytics, or individual attendance tracking.
- Native mobile apps; a responsive web view for permitted management functions is sufficient.
- A public API product or universal software-to-API compiler as a separate customer feature.
- A company-wide predictive digital twin with staffing or cash-flow forecasts.
- On-device or local-only AI model inference (e.g. local LLMs, on-device Whisper, local embedding models); all v1.0 Oryn AI inference uses cloud-managed APIs through the governed LiteLLM gateway, with optional local inference explicitly slated for post-v1.0.

### 3.3 Application compatibility as a product promise

Oryn may observe and guide work in applications where the employee has permitted observation and a useful visible interface is available. Automated execution is offered only when Oryn can reliably identify relevant controls, evaluate required conditions, and verify supported outcomes. Some workflows will remain guidance-only or supervised. For partially supported applications, Oryn must state exactly which features are available: **Observe**, **Guide**, **Assist**, **Run Supervised**, or **Run Autonomously**. It must never present an unsupported capability as available.

For v1.0, the initial supported usage experience covers current supported Windows and macOS releases, the Chrome and Edge browser families, and approved desktop applications with accessible, consistently identifiable controls. Firefox, Safari, remote-desktop sessions, canvas-only applications, and visually ambiguous interfaces may be observed or used for guidance where permitted, but do not automatically qualify for agent execution. For browser applications in Chrome and Edge, observation and execution require exact packaged application profiles and explicit work context admission. Cross-origin frames, closed shadow roots, and dynamic web interfaces without proven native desktop geometry do not support coordinate highlights or automated actuation; they fall back to text-only guidance or report explicit validation gaps. Native visual snapshots of browser surfaces require certified platform validation and pre-transfer masking; pixel-to-document binding is verified defensively rather than assumed atomic. A customer-visible compatibility report specifies supported tasks per application and may mark an application as unsupported or unverified.

### 3.4 Supported automation scope

A v1.0 agent may read permitted task context, extract information from documents, look up records, validate values, create or update authorized low-risk records, draft communications, stage higher-risk changes for human review, and produce auditable results. It must work within a declared workflow scope, approved applications, defined records or queues, and authorized action types. It must not improvise outside that scope to reach the goal.

### 3.5 Version labels and terminology

- **v1.0 product:** This complete release, not the first internal prototype.
- **Workflow:** A repeatable business process that achieves a defined result.
- **Demonstration:** A captured example of a human executing a task; it is not proof of correctness by itself.
- **Candidate workflow:** A suggested procedure not yet formally approved.
- **Playbook:** An approved workflow presented for people and, when qualified, for agents.
- **Business rule:** A condition or policy governing a permitted outcome or decision.
- **Evidence:** Reviewable information showing why a claim, step, rule, or outcome is believed to be correct.
- **Agent candidate:** A proposed executable agent that is not approved for production execution.
- **Agent version:** A fixed reviewed definition of what an agent is permitted and expected to do.
- **Scenario:** A test case with starting context, allowed actions, and expected outcomes.
- **Job:** One requested or scheduled execution of an agent on a defined set of items.
- **Case:** One business item processed within a job, such as one invoice.
- **Incident:** An event requiring investigation because expected progress, correctness, safety, or permissions were violated or uncertain.
- **Repair proposal:** A reviewed change intended to resolve a documented failure.
- **Verification:** A separate check that required business postconditions hold; completing visible UI steps alone is not verification.
- **Publish:** Make a verified playbook available to an authorized audience.
- **Deploy:** Make an approved agent version eligible for execution in a defined scope.

### 3.6 v1.0 compatibility and reference-workflow matrix

For release acceptance, Oryn must support the following **product experiences**. This matrix defines customer-visible scope and does not mandate how the capabilities are delivered. A customer's own application configuration or administrative policy can still restrict a capability; Oryn must display that restriction honestly.

| Work surface | Observe permitted work | Human guide / peer fix | Agent execution in v1.0 | Conditions |
|---|---|---|---|---|
| Approved browser-based business applications in Chrome or Edge | Yes | Yes, where an approved workflow exists | Yes, only for individually validated actions and agent scopes | Per-application capability verification and customer authorization required |
| Approved Windows and macOS desktop business applications | Yes, when content is accessible and not excluded | Yes, when relevant steps can be identified reliably | Assisted or supervised actions only when individually validated; no general guarantee of autonomous execution | Must show unsupported steps explicitly |
| Gmail and Outlook web experiences | Yes, with employee permission | Yes | Read/draft and other explicitly authorized workflow actions only | Sending external communications is Tier 3 and needs review |
| Google Sheets and Excel web experiences | Yes, with employee permission | Yes | Validated read, draft, and eligible record-update actions | High-consequence spreadsheet changes require appropriate review |
| Salesforce, HubSpot, and NetSuite web experiences | Yes, with employee permission | Yes | Only workflows that have passed application- and customer-specific validation | No universal guarantee across custom forms or deployments |
| Zoom, Microsoft Teams, and Google Meet meetings | Separate per-meeting opt-in only | Meeting follow-up guidance | No autonomous participation in calls | Recording notice/consent policy must permit capture |
| Remote desktop, virtual desktop, canvas-heavy, or unsupported browser surfaces | Possible limited observation when explicitly permitted | Text-only or limited guidance where verifiable | Not certified for autonomous v1.0 execution | Explain unavailable capabilities and validation gaps |

The initial customer demonstration pack must include three complete, customer-independent synthetic reference workflows: **invoice-versus-purchase-order reconciliation**, **customer/order status reconciliation**, and **support exception triage**. At least one of these must support the full observe → guide → generate → simulate → supervised execute → incident → correct → repair → re-evaluate → controlled release loop. Reference packs do not imply that the same actions work automatically in every customer's particular application configuration.

---

## 4. Non-Negotiable Global Product Rules

### 4.1 Privacy and user control

1. No screen or audio recording starts until the employee is enrolled, has accepted a clear notice, and has enabled the relevant capture category.
2. Recording state is always visible on the desktop companion. The user can pause/resume with one action.
3. An employee cannot disable mandatory personal-data exclusions or organization-level protections.
4. Personal and excluded applications, URLs, and windows are blocked before capture. An excluded window must not appear in recorded frames, transcripts, search, or workflow examples.
5. Raw employee screen and audio captures remain durably on that employee's device. When cloud inference is authorized for visual extraction, transcription, or commitment analysis, data processing occurs transiently through an Oryn-managed LiteLLM gateway with contractual zero content retention, no model training, and strict US-only processing. Organization dashboards and central databases receive approved, sanitized procedural knowledge and verified outcomes, not full raw recordings or central media archives. Transient processing by approved cloud subprocessors is strictly separated from manager access, cloud backup, and organizational publication.
6. No manager or administrator can replay an employee's raw local capture remotely. An employee may explicitly share a redacted excerpt for one clearly named review purpose; that excerpt is a distinct shared artifact, not remote access to the original.
7. No employee idle-time analytics, active-hours tracking, mouse movement scores, or attendance metrics exist in the product.
8. Employees can see what Oryn learned from their activity, inspect candidate shared knowledge, flag a mistaken interpretation, and request removal of a shared contribution subject to retention and legal obligations.
9. Audio recording must comply with employer policy and applicable participant-notice and consent requirements. If those requirements are not satisfied, meeting capture must not begin.
10. The privacy policy applies equally to manual recordings, guided sessions, test evidence, and incident investigations.

### 4.2 Truthfulness and evidence

1. Oryn must label inferred information as **Suggested**, **Unverified**, or **Needs Review** until reviewed.
2. An employee's successful-looking actions cannot independently establish a policy or a correct business outcome.
3. Every approved rule has an owner, source or supporting evidence, approval record, effective date, and scope.
4. A statement with conflicting evidence must appear as a contradiction, not a silently chosen answer.
5. Unknown, unobservable, or unverifiable outcomes must be reported as unknown, not successful.
6. Business-critical values in suggestions and approval screens must link to source evidence whenever available.
7. AI-generated summaries, explanations, and patches must identify what is observed, inferred, and approved.

### 4.3 Safe execution

1. A user or approved schedule must initiate an agent job; passive observation alone never starts a production job.
2. Every job must use an approved agent version and operate within a declared scope.
3. A workflow that crosses into a restricted operation must pause or refuse that action, even if it was previously observed in a human demonstration.
4. Uncertain record identity, contradictory source values, missing authorization, unapproved policy changes, and unverifiable high-consequence outputs trigger human review.
5. No agent may silently broaden its application access, increase monetary authority, create a new destination for funds, or approve its own high-risk changes.
6. Starting an agent never means granting blanket approval to every action it may attempt.
7. A person approving a staged change sees the actual proposed values, affected items, relevant source evidence, and the expected consequence before committing.
8. An agent failure must not be disguised as a completed job, and a retry must not silently duplicate a committed business action.

### 4.4 Organizational knowledge ownership

The organization owns approved shared playbooks and agent versions produced for its work, subject to the applicable agreement. Individual employees retain access to and control over their private local captures. Knowledge from one customer is not made accessible to another customer. A contributor can view the proposed sanitized knowledge before it becomes organization-wide; an authorized workflow owner determines whether to publish it.

### 4.5 Hard distinction: recommendations versus decisions

Oryn may recommend actions, draft policies, propose repairs, and prepare approvals. Oryn may not treat a suggestion as an authoritative policy or grant itself authority because a model thinks an action is beneficial. Only specifically authorized people can approve controlled decisions. Decisions must be visibly attributed to the approving role and to the defined operational scope.

---

## 5. Information Model: What the Product Must Understand

Oryn presents the following conceptual objects to users. They may be related and displayed together; this section defines their meaning rather than their storage or implementation.

| Object | Required user-visible meaning |
|---|---|
| Organization | The customer-controlled boundary for members, business knowledge, security, and reporting |
| Team | A permitted audience and ownership group within an organization |
| Application | A named business tool with a clearly reported observation and execution capability |
| Task | A specific business objective attempted at a point in time |
| Workflow | A repeatable path from preconditions to verified outcome |
| Workflow variant | A legitimate alternate path based on known conditions |
| Step | A meaningful user or agent action with an intended result |
| Decision point | A choice between documented branches under stated rules |
| Exception | A situation in which the normal path is insufficient or inapplicable |
| Commitment | A work obligation, owner, deadline if known, and associated context |
| Business rule | An authoritative or proposed instruction governing allowed behavior |
| Evidence reference | A source and location sufficient for an authorized reviewer to substantiate a claim |
| Playbook | A published, owner-approved version of a workflow for guided execution |
| Agent | An executable representation of a workflow under declared permissions |
| Scenario | A repeatable test with explicit expected results |
| Evaluation | An agent-version test run with individual scenario verdicts and explanations |
| Job | A requested execution with cases, approvals, outcomes, and timing |
| Incident | A deviation, failure, uncertainty, or safety event needing attention |
| Correction | Authorized human-provided behavior or explanation for a specific case |
| Repair proposal | A candidate change to an execution plan, rule usage, or app-specific interaction |
| Change review | A proposal, diff, test evidence, approvers, decision, and rollout plan |
| Outcome | A verified business state, including when verification is impossible |

### 5.1 Minimum fields for every workflow

Every workflow detail page must display: name; summary; business objective; owning team and owner; affected applications; allowed user roles; trigger and starting conditions; required inputs; sequence of meaningful steps; known decisions and alternate branches; expected outputs; outcome-verification rules; exception and escalation routes; business risk tier; evidence and confidence state; human guidance availability; agent eligibility; current published version; last verification date; and change history. Unknown elements must be visibly marked **Not Yet Established** instead of being silently omitted.

### 5.2 Minimum fields for every agent

Every agent detail page must display: name; intended job; linked playbook and approved version; owner; applicable records and systems; allowed actions; forbidden actions; required input fields; prerequisites; decision rules; expected outputs; verification conditions; exception behavior; autonomy stage; risk tier; required approvals; latest evaluation; active version; rollout scope; recent job outcomes; known limitations; and repair history.

### 5.3 Evidence hierarchy

A rule or outcome may be backed by: (1) organization-approved authoritative policy; (2) business-system records and independently checked outcomes; (3) approved SME explanations; (4) repeated successful observations; or (5) an AI inference. Lower-level evidence may suggest a change but cannot override a directly applicable higher-level authoritative requirement. Contradictions are escalated to the workflow owner. Oryn must explain when the available evidence is insufficient to decide.

---

## 6. Roles and Permissions

### 6.1 v1.0 roles

- **Employee:** Manage personal capture, private history, contributions, contextual assistance, and guidance for authorized workflows.
- **SME:** Employee capabilities plus answer exception questions and propose business-rule interpretations.
- **Agent Operator:** Employee capabilities plus start jobs and approve specifically delegated routine job actions.
- **Workflow Owner:** Approve workflow scope, canonical playbooks, business rules in their remit, agent readiness, assigned reviewers, and permitted release changes.
- **Automation Builder:** Configure workflow/agent definitions and tests; create draft patches; cannot approve their own high-risk release solely through this role.
- **Operations Manager:** View approved aggregate operational reports, assigned teams' published workflows, open organizational issues, and improvement opportunities.
- **Security / Compliance Admin:** Configure exclusions, meeting recording policies, data retention, action-risk restrictions, audit access, and permissions policy.
- **Organization Admin:** Invite and remove members, manage teams and roles, and assign ownership. Does not automatically gain private employee capture access.
- **Read-Only Stakeholder:** View explicitly shared published playbooks, eligible reports, and status without editing or executing.

### 6.2 Permission principles

- All organization-wide publication requires a workflow owner or delegated reviewer.
- Any business-rule change affecting agent behavior requires owner approval; a security administrator must additionally approve any requested expansion of permission scope.
- An agent release requires a workflow owner distinct from the person proposing the release for risk tier 3 tasks. For tier 2, a single authorized workflow owner can approve if organizational separation-of-duties policy permits it.
- An SME can explain a rule but cannot unilaterally elevate an unverified opinion to an organization-wide policy unless also assigned the workflow-owner role.
- An agent operator can approve actions only within an explicit delegated amount, record type, and team scope. Being able to start a job does not confer approval authority.
- Removing a person's role immediately removes their ability to start new privileged actions and prevents them from giving future approvals; pending approval requests must be rerouted.
- A suspended member cannot access workspaces or perform approvals; previously published organizational material remains available to authorized colleagues.

### 6.3 Permission-matrix requirements

The user-facing permissions panel must allow administrators to separately grant or deny: view published playbooks; review workflow candidates; approve rules; edit agents; run jobs; approve staged actions; review incidents; approve repairs; release versions; view aggregate analytics; export reports; modify privacy controls; and administer users. Each capability must have an identifiable granting role. An employee must be able to see a concise explanation when an action is unavailable due to permissions.

---

## 7. Organization Setup and Enrollment

### 7.1 Organization setup flow

1. The creator names the organization and selects a business region and time zone for deadlines and reporting.
2. The organization admin acknowledges Oryn's capture, employee notice, and privacy model.
3. The security admin selects permitted work applications, mandatory exclusions, retention defaults, meeting recording policy, and allowed workflow risk tiers.
4. The admin creates or chooses a pilot team and assigns at least one workflow owner.
5. The admin invites employees by email or enterprise login. Each invitation states the organization's name, expected product use, privacy boundaries, and any required workplace policies.
6. Before capture can begin, each employee sees a clear notice covering what can be observed, what stays private, how purpose-authorized cloud inference operates transiently with zero retention and US-only processing, what may be shared, retention periods, and how to pause or withdraw participation.
7. Employees complete a personal setup checklist: choose allowed apps, confirm excluded apps, select capture mode, review meeting-capture settings, and run a capture test on permitted work content.
8. Oryn displays a final readiness checklist and marks any missing permission or policy acknowledgement as **Action Required**.

### 7.2 Setup success states

- **Organization Ready:** Roles, policy, and at least one workflow owner configured.
- **Employee Ready:** Employee opted in; required privacy permissions configured; capture test passed.
- **Observation Paused:** Employee opted in but intentionally paused capture.
- **Restricted:** Required permissions or policy acknowledgments incomplete; capture disabled.
- **Not Enrolled:** Employee has not accepted participation; no capture.

### 7.3 First-run product experience

On first successful enrollment, Oryn explains the four most important actions: start/pause observation; view private history; see what has been proposed for sharing; and ask for guidance on an active business task. It must demonstrate a sample workflow using synthetic content before requesting that the employee capture real work.

Browser observation and assistance require an explicit initial pairing step between the employee's browser profile and Desktop Shell via a matching one-time comparison code. Pairing establishes trusted local communication only; it does not grant website origin permissions, employee capture consent, or action execution authority. Website access requires explicit origin grants, observation requires active category consent and unexpired permits, and automated actions require separate cryptographic authorization and human approval where required.

### 7.4 Pilot activation

The pilot owner selects one to three named workflows to discover, defines their expected outcomes and the responsible SME, and confirms they are permitted to be recorded. Oryn may suggest other candidates later, but it must not automatically expand capture policy or deployment scope to pursue them.

---

## 8. Employee Observation and Personal Work History

### 8.1 Desktop companion requirements
The companion has a persistent but non-obstructive status indicator provided through the OS system tray/menu-bar and a movable native capture badge whenever capture is active. States are **Not Configured**, **Observing Approved Work**, **Paused by You**, **Paused by Policy**, **In Excluded Application**, **Meeting Capture Active**, and **Attention Needed**. Hovering or opening the companion explains the state and presents independent Screen and Meeting status indicators. A clear pause/resume control is always accessible during observation. When an excluded window takes foreground focus while permitted business windows remain visible in the background, the headline displays **Observing Approved Work** with the explicit subline `Approved windows observed; foreground excluded`, continuing observation strictly for uncovered permitted background surfaces. If all visible surfaces are excluded, the companion displays **In Excluded Application**. When meeting capture is active, the headline displays **Meeting Capture Active**; the subline is `Online transcription active` in online mode and exactly `Recording only — offline` in offline mode. If a native observer worker terminates unexpectedly, the fault isolates to the native OS source; healthy browser extension observation and meeting audio capture continue operating with visible independent indicators, while the headline displays **Attention Needed** with the subline `Native observation stopped; other active sources shown below`.

The companion must not hide recording state, simulate a different state, or resume capture automatically after a user-initiated pause. A user-initiated screen-observation pause (`PauseScreenObservation`) immediately stops all screen capture streams across native and browser surfaces, pauses executing local browser actions at the nearest safe boundary, and prevents new action dispatch, while leaving independently authorized meeting capture active. A Pause All action (`PauseCapture`) immediately stops all observation streams, including screen and meeting audio. Generic resume is screen-only; meeting capture never resumes automatically. When the main window is closed, capture continues only if background observation is explicitly enabled and the native badge remains visible on an active desktop; otherwise closing the window transitions to **Paused by You**. Explicit application quit stops capture and persists a quit pause. On workstation lock or system sleep, all capture halts immediately; on unlock or wake, previously active screen observation may automatically restore only if permitted by valid policy, consent, and healthy visibility, whereas meeting audio recording never automatically resumes. Following an unexpected helper or badge crash, visibility loss, or application update, capture remains paused behind an explicit recovery blocker and requires intentional employee action to resume. Local capture requires a valid capture policy lease, which expires after an absolute maximum of 24 hours of disconnection; upon expiry, capture halts until connectivity is restored and the employee explicitly resumes. Unseen remote revocations take effect upon reconnection or lease expiry, while received restrictions are enforced immediately. An optional employee-configured global hotkey allows quick toggling of screen observation or executing Pause All, but cannot grant meeting audio consent or acknowledge disclosure notices.

### 8.2 Work observation scope
For permitted work, Oryn may recognize application changes, relevant document and page context, visible form fields, navigation actions, task starts and endings, validation errors, decision branches, and observable results across all approved visible windows on all active displays. It prioritizes meaningful task transitions and must not expose raw typed passwords, secrets, or unrelated personal data as workflow content. Observation is restricted strictly to uncovered physical content: occluded regions of permitted windows are masked to opaque black before memory transfer, visual extraction, or cloud inference, and minimized, hidden, cloaked, or other-desktop/Space content is never acquired. While full approved-window rasters may transiently exist in isolated worker memory prior to masking, excluded surfaces remain strictly forbidden acquisition targets; post-capture cloud OCR cannot authorize capture of mandatory excluded content.

Observation categories operate independently:
- **Contextual work-application recognition without visual work observation:** Grants permission to read approved application identity, safe titles, and settled accessibility hierarchies. Visual snapshots, screen recording APIs, and OCR are completely disabled.
- **Visual work observation without contextual recognition:** Grants permission to capture event-triggered, privacy-gated snapshots and perform privacy-helper-governed visual extraction via the cloud inference gateway. Accessibility APIs are restricted to content-free geometry and protected-field bounding; no structured control labels, values, titles, or interaction streams are emitted.

Observation is always contextual: the product's objective is to learn how work is performed, not when or how long an employee appears active. Any time measurement applies to the elapsed duration of a task instance and is displayed only in approved aggregate operational reporting, with an option to exclude wait time from process analysis.
### 8.3 Personal history

Each enrolled employee can view a private timeline organized by task, date, and work application. Entries indicate whether Oryn merely recorded a task, suggested a candidate workflow, requested clarification, or prepared an approved shared contribution. The employee can search permitted local history, inspect the reason for each suggested insight, discard a candidate, and delete retained personal material subject to organizational legal holds and policy constraints.

Personal history is not available to managers as a detailed activity feed. A manager sees only aggregate organizational outcomes and published knowledge that their role permits.

### 8.4 Capture interruptions

- If capture is paused manually, Oryn stops observing immediately and does not infer missing actions as though it saw them.
- If the active window becomes excluded, observation stops for that content; previously captured permitted segments remain governed by normal retention.
- If observation resumes during the middle of a task, the segment is labeled incomplete unless the missing steps can be authoritatively supplied and reviewed.
- If an application becomes unreadable, Oryn labels the segment **Insufficient Observation** and does not create a high-confidence workflow from it.
- If local capacity or permissions prevent capture, Oryn shows a clear local status; it must not silently drop into weaker privacy protections.

---

## 9. Meeting Intelligence and Commitments

### 9.1 Meeting capture is opt-in per meeting
Meeting audio is off by default. Before each meeting recording, the employee must explicitly initiate capture and confirm that organizational policy and applicable participant-notice and consent conditions are satisfied. Meeting speech transcription and commitment extraction utilize cloud-managed AI APIs through the Oryn LiteLLM gateway with contractual zero content retention, no model training, and strict US processing. If cloud service is unavailable or offline recording is intentionally selected, Oryn supports explicit offline recording, which acquires local audio without AI processing and requires fresh authorization before any subsequent upload. Oryn displays a distinct recording indicator throughout the session. An authorized employee can end capture at any time. The product must not silently record incoming calls, automatically join meetings, or treat calendar attendance as recording consent.

### 9.2 Extracted insights

When capture is authorized, Oryn can suggest: actionable commitments, accountable people where known, deadlines, project/customer references, policy or product constraints discussed, unresolved questions, and follow-up dependencies. It must preserve qualifiers such as "proposed," "subject to approval," and "not yet agreed." A tentative comment must not become an accepted company commitment.

### 9.3 Commitment detail

Each suggested commitment includes the exact interpreted obligation; who appears responsible; any explicit deadline and its time zone; associated customer/project; supporting excerpt and source timestamp; confidence and verification status; and a confirmation choice. Employees may **Confirm**, **Edit**, **Dismiss**, or **Mark as Not a Commitment**. Nothing from an unconfirmed meeting commitment is automatically sent to a CRM, email recipient, or another person's task list.

### 9.4 Contextual reminders

When an employee opens an approved work context matching a confirmed unresolved commitment, Oryn may show one compact reminder. It can offer to draft a CRM note, open the relevant project, or prepare a follow-up. It never sends or posts that content without appropriate authorization and user confirmation. The employee may snooze or dismiss the reminder and view its source.

### 9.5 Privacy and sharing
Private transcript excerpts, candidate commitments, and raw recordings remain durably stored only on the recording employee's device unless explicitly shared under the organization's rules. Processing by cloud inference services is transient and bounded to the active session; no persistent cloud transcripts, voice profiles, or central recordings are maintained. Organizational playbooks may use sanitized, reviewed business commitments and rules, but not unrestricted meeting transcripts or voice profiles. Where an audio segment must be excluded, it contributes no shared knowledge.

---

## 10. Workflow Discovery and Candidate Generation

### 10.1 Candidate identification

Oryn identifies repeated, semantically similar task executions, including reasonable differences in identifiers, customer names, document contents, and navigation details. A candidate is triggered by a recognizable business objective and relevant beginning and ending context, not merely by an identical sequence of mouse actions. Oryn must not combine separate workflows solely because they happen in the same application.

### 10.2 Workflow candidate card

Each candidate shows: suggested name; owning team if identifiable; number of observed completed examples; application sequence; task objective; likely inputs and outputs; significant decisions; known exceptions; estimated complexity; observed variation; missing evidence; likely value to operators; and current approval status. All inferred or ambiguous content is marked accordingly.

### 10.3 Review and editing

The reviewer can accept or revise the workflow's boundaries, rename it, correct its goal, group or split steps, identify variables, add missing prerequisites, remove unrelated captured actions, define business outcomes, and select an appropriate reviewer. The reviewer can reject the candidate as not reusable, duplicate, sensitive, or incorrectly inferred. Rejection reasons improve the quality of future suggestions but do not silently publish a new rule.

### 10.4 Canonical workflow and legitimate variants

Oryn can suggest a preferred path based on verified success, relevant exception rate, compliance with approved rules, and efficiency. It must not choose the fastest path if that path fails a required control or has unverified results. When multiple legitimate variants exist, Oryn stores explicit conditions for each; it must not force distinct business situations into one generic sequence.

### 10.5 Completion and verification

A human demonstration can be marked **Observed Complete** when its sequence visibly ends. It can be marked **Outcome Verified** only when an authorized outcome source or reviewer confirms the required postconditions. A workflow can be published for guidance with known limitations, but it cannot advance to automatic execution when business-critical verification is missing.

### 10.6 Candidate states

**Suggested → Under Review → Needs Evidence / Approved for Guidance / Rejected.** An approved playbook may later be **Under Revision**, **Superseded**, or **Archived**. Every state change has a reason, actor, and timestamp. Rejected candidates are not shown to other operators as reliable guidance.

### 10.7 Opportunity detection

Oryn may identify high-volume repetitive workflows and suggest possible automation value. The opportunity card shows observed volume, time per verified case, exception frequency, degree of repeatability, known risks, and the quality of the sample. Potential hours saved are labeled estimates and must disclose the assumptions used. An opportunity is not an automatically approved agent.

---

## 11. The Living Operational Graph

### 11.1 Purpose

The Living Operational Graph is the customer-facing view of how approved work, decisions, people, systems, commitments, and results relate to one another. It is not a visualization of every employee click or a surveillance map.

### 11.2 Required relationships

Oryn must let authorized users examine relationships between: workflow and owner; workflow and applications; workflow and triggering event; step and business rule; rule and source; decision and alternative branch; exception and verified resolution; agent and playbook version; agent and test suite; agent and job outcome; incident and proposed patch; commitment and follow-up workflow; workflow and downstream workflow; and policy change and impacted agents.

### 11.3 Graph exploration

Users can browse by team, process, customer/project category where authorized, application, owner, business objective, risk tier, and status. Selecting a node opens a concise detail panel and a path to the canonical detail view. The graph can show upstream prerequisites, downstream effects, unresolved dependencies, and policy relationships. The product offers a readable list view as an alternative to a visual graph.

### 11.4 Evidence and contradiction handling

Every important claim displays its source category and status. When two rules or observations conflict, Oryn creates a **Knowledge Conflict** item with both interpretations, affected workflows, and the required owner decision. Until resolved, the affected branch is not automatically executable if the conflict can change the outcome. An approved newer policy can supersede an older policy with a recorded effective date; the older version remains visible in history.

### 11.5 Knowledge freshness

Every published workflow displays **Last Verified**, **Known Changes**, and **Current Status**. Relevant application changes, failed jobs, new policy versions, and unresolved exceptions can mark a workflow **Needs Revalidation**. This label blocks new autonomous releases for the affected scope until the appropriate verification completes, without necessarily disabling safe read-only guidance.

### 11.6 Knowledge search

The search experience supports queries such as "How do we handle a duplicate vendor bill?", "Which agents depend on the discount approval rule?", and "What changed in this workflow last week?" Results distinguish approved answers from suggestions and must show owner, version, source, and last verification status. When evidence is insufficient, Oryn says so and routes the question to an appropriate owner rather than inventing a definitive answer.

---

## 12. Contextual Guidance, Peer Intelligence, and Employee HUD

### 12.1 HUD principles

The HUD remains quiet by default, appears only in approved work contexts, never steals keyboard focus without user action, and never covers critical application controls. Guidance cards and click-through target highlights are hosted by the desktop shell from structured models produced by the context helper. Transparent native highlights never obscure OS security prompts or browser permission controls, and expire automatically unless continuously refreshed. The employee can snooze it for an hour, mute a suggestion category, or disable proactive suggestions while retaining manual search and guidance. When offline, employees may continue reading locally cached playbooks under a signed guidance access lease capped at 24 hours; executing new assisted or autonomous actions is strictly prohibited while offline.
### 12.2 Trigger categories

1. **Relevant Commitment:** A confirmed unresolved work obligation matches the current approved business context.
2. **Known Exception:** A recognizable error or validation state has a verified resolution that applies to the active workflow.
3. **Workflow Assistance:** The current task matches an available published guide.
4. **Repetition Opportunity:** Multiple similar completed tasks suggest an eligible reusable workflow or agent candidate.
5. **Important Change:** The current procedure has a new approved version or a known warning relevant to the task.

### 12.3 Suggestion priority

Safety and verified policy warnings outrank other tips. After those, active error resolution outranks commitment reminders, guidance, and automation suggestions. Oryn displays at most one expanded proactive suggestion at a time; other suggestions remain in a compact queue. Dismissed suggestions are not immediately repeated for the same context. No suggestion may imply a confidence or authorization level that the underlying knowledge does not have.

### 12.4 Guide experience

On choosing **Guide Me**, the employee sees the workflow objective, prerequisites, expected result, and next step. Oryn tracks at most one active guide per employee profile. Guidance points to a relevant visible control where identification is reliable. The step advances automatically only when Oryn reliably observes the declared expected state on fresh evidence; user confirmation records an acknowledgment, not verified business completion. Switching to unrelated work, encountering an observation gap, or window minimization suspends the active guide and clears highlights; returning to the task allows the employee to explicitly resume. New published playbook versions notify the employee without silently repinning the active guide; policy revocations or rule conflicts invalidate the guide immediately. The employee can move backward, skip an optional step, ask why a step exists, report that the UI differs, or stop the guide. A failed or unrecognized step opens relevant troubleshooting guidance instead of silently proceeding.
### 12.5 Peer-transfer experience

When a known exception is matched, the card shows the error or situation, the applicable approved fix, required preconditions, the source workflow, and available actions (**Explain**, **Guide**, or **Run Allowed Fix**). References to peer expertise describe verified team knowledge, not employee productivity comparisons. If only an unverified peer suggestion exists, Oryn offers it as a draft for review rather than an executable fix.

### 12.6 Assisted macros and assist plans

A published playbook can offer an approved **Assist Plan** for bounded actions. Approval for guidance does not grant assist execution approval; Stage 3 assist plans require distinct evaluation and release governance approval. Before execution, Oryn reserves the target tab or application workspace, displays affected fields, and declares the stopping point. Assist plans enforce a strict preparation boundary that pauses before every consequential or higher-risk submission. Committing consequential actions requires an explicit, separate item-level **Review and Submit** action displaying parameter diffs. If the application state differs from the approved path, the assist session stops and requires employee review. The employee always sees which actions were completed and which remain.
---
## 13. Agent Factory: From Workflow to Executable Agent

### 13.1 Entry conditions

An authorized Automation Builder or Workflow Owner can select **Create Agent** from an approved playbook. Oryn must block agent creation from a rejected workflow or an unknown business objective. It can create a draft from a workflow approved for guidance even when some execution requirements are missing, but the draft must prominently state that it is not executable until those requirements are resolved.

### 13.2 Agent creation flow

1. **Select workflow:** The user selects a playbook and its intended version.
2. **Confirm objective:** Oryn proposes the goal in plain language, and the creator must accept or edit it.
3. **Confirm operating boundary:** Identify permitted applications, record types, teams, geographic/business scope, and actions.
4. **Confirm inputs:** Define which inputs are required, what a valid value looks like, and how missing or conflicting inputs are handled.
5. **Confirm decisions:** Review every identified decision branch, its governing rule, and evidence source.
6. **Confirm outcomes:** Define what constitutes correct completion, partial completion, and required human escalation.
7. **Review execution plan:** See the proposed actions in meaningful business terms; modify individual steps, stop points, and review requirements.
8. **Assign accountability:** Set a workflow owner, agent operator group, and incident owner.
9. **Review risk:** Oryn suggests a tier based on actions; authorized users can raise the tier but cannot lower it below mandatory security policy.
10. **Save candidate:** Oryn creates a non-production version with a visible list of missing prerequisites and recommended tests.
11. **Evaluate:** The candidate enters the Flight Simulator and remains undeployable until the required checks and approvals pass.

### 13.3 Agent detail page sections

- **Overview:** Name, objective, current state, owner, active version, permitted scope, risk tier, autonomy stage.
- **What It Does:** Human-readable sequence and decision branches.
- **Inputs and Outputs:** Required fields, valid formats, expected changes, and source requirements.
- **Policy and Permissions:** Permitted and prohibited actions; authority limits; approval requirements.
- **Evidence:** Linked playbook, verified demonstrations, accepted rules, and unresolved assumptions.
- **Tests:** Current test suite, last evaluation, historical failures, and coverage gaps.
- **Runs:** Jobs, cases, verified outcomes, exceptions, pending approvals.
- **Incidents:** Open and past incidents, diagnoses, and repair proposals.
- **Versions:** Diffs, approvals, rollout history, and available restoration actions.

### 13.4 Human editing

The creator can change agent name, description, objective phrasing, workflow steps, condition descriptions, allowed input sources, expected outputs, exception paths, and proposed verification requirements. A material change to behavior invalidates the current evaluation approval and triggers retesting. Editing a descriptive label only does not require rerunning tests. Oryn clearly indicates which edits are material before saving them.

### 13.5 Supported agent actions

For approved scope, agents may: locate a business record; read visible or authorized document context; extract and normalize fields; compare values; look up related records; categorize a task; select among approved branches; populate draft forms; attach supporting evidence where supported; update a permitted reversible field; draft a message; create a review request; tag or route a case; request clarification; pause for approval; and report an outcome.

Agents may not infer approval from silence, act under a different employee's identity without authority, send external communications when only drafting was authorized, or initiate a workflow that has not been approved for the selected target record.

### 13.6 Ambiguity handling

When an agent encounters an ambiguity, it must explain the decision it cannot make, present the conflicting evidence, identify the affected case, and request the smallest needed input from an authorized person. It must not silently substitute plausible values or choose an arbitrary match. If the ambiguity affects only one case in a batch, Oryn pauses that case and continues unaffected cases when policy permits.

### 13.7 Agent state lifecycle

**Draft → Ready for Evaluation → Evaluation Failed / Evaluation Passed → Awaiting Approval → Approved → Limited Rollout → Active.** Additional states are **Paused**, **Restricted**, **Needs Revalidation**, **Superseded**, and **Retired**. No agent in Draft, Evaluation Failed, Restricted, or Retired may initiate new production actions. Paused and Needs Revalidation agents are governed by the restriction shown on their detail page; safe read-only inspection remains available.

### 13.8 Duplicate and overlapping agents

When a new agent covers substantially the same objective, applications, and target records as an existing agent, Oryn warns the creator and offers to extend the existing agent, create a separately scoped variant, or proceed with an explained justification. Two agents must not concurrently attempt conflicting writes to the same business item. Such cases are put on hold for the responsible operator, with a visible resolution path.

---

## 14. Risk Classification and Autonomy Ladder

### 14.1 Action risk tiers

| Tier | Meaning | Examples | Maximum v1.0 autonomy |
|---|---|---|---|
| **Tier 0 — Informational** | No business-state change | Search, explain, summarize, draft private notes | Automated reading and suggestions |
| **Tier 1 — Low-risk reversible** | Limited internal change with a documented recovery path | Tag case, update internal draft status, populate review queue | Autonomous within approved scope |
| **Tier 2 — Controlled reversible** | Material internal change, but reversible and independently verifiable | Update permitted order classification or reconciled status | Autonomous after stronger evaluation and supervised history |
| **Tier 3 — Consequential** | Externally visible, contractual, monetary, or irreversible business consequence | Send customer message, post invoice, issue credit, approve customer-facing change | Human approval before each consequential commit |
| **Tier 4 — Restricted** | Prohibited from v1 agent execution regardless of demonstrated frequency | Transfer funds, change payroll, grant permissions, permanently delete business records, make regulated clinical decisions | No agent execution |

A workflow's overall tier is at least the highest tier of any action it can take. Security policy may require stricter controls. A workflow cannot be downgraded by splitting a higher-risk action into several lower-risk-looking steps.

### 14.2 Six product autonomy stages

| Stage | Name | Employee or operator experience | Minimum release gate |
|---|---|---|---|
| **0** | Observe | Oryn learns and identifies tasks, but does not suggest an executable workflow | Consented, allowed observation |
| **1** | Suggest | Context cards and unverified workflow opportunities | At least one attributable observation and labeled uncertainty |
| **2** | Guide | Published step-by-step human guidance | At least two completed examples, a named owner, and explicit guide approval |
| **3** | Supervised Assist | Assisted macros and supervised task execution with review | At least five verified human examples, 25 passing representative scenarios, no failed mandatory safety tests, owner approval |
| **4** | Scoped Autopilot | Defined Tier 1/2 cases run without per-action review; exceptions escalate | At least 20 consecutive outcome-verified supervised cases, 100 passing representative scenarios, zero unresolved safety/policy failures, explicit scope approval |
| **5** | Self-Maintaining Autopilot | Detects drift, proposes repairs, validates them, and deploys eligible limited changes under policy | Stage 4 plus repair-specific tests and established change-control rules; v1 automatic release limited as stated below |

The counts above are default **minimum eligibility requirements**, not a guarantee that Oryn can prove a workflow safe. A workflow owner or security admin can impose stricter requirements. Distinct demonstrations must represent real completed cases, not repeated viewings of the same event. Scenario counts must include all known branches; a missing critical branch blocks promotion even if the numeric minimum is met.

### 14.3 Required test mix by stage

- **Stage 3:** At least 25 distinct scenarios, including at least five documented edge or negative cases where the agent must safely pause, reject, or request review. Every mandatory business invariant and permissions test must pass. All 25 intended outcomes must be correctly classified as success, safe escalation, or expected rejection.
- **Stage 4:** At least 100 distinct scenarios, including at least 20 edge, negative, or failure-injection cases; all known approved decision branches; all mandatory business invariants; and zero unexplained deviations. All 100 must receive the expected outcome or expected safe failure result. If the agent cannot independently verify a consequential outcome, Stage 4 is unavailable for that outcome.
- **Stage 5:** The candidate patch must pass the complete current regression suite, every directly affected previously failing scenario, and at least five newly generated nearby variations. A repair cannot be approved based solely on the scenario it was intended to fix.

### 14.4 Stage promotion, demotion, and scope

Promotion is always explicit, versioned, and limited to named workflows, application capabilities, action types, and target record populations. A passing evaluation does not automatically approve production use. An owner must confirm the intended scope and risk. A serious safety event, revoked permission, critical rule conflict, or unverifiable production behavior may immediately restrict or pause affected agent capabilities pending review. A noncritical test regression blocks promotion and creates an action item. Oryn must display the concrete reason for every demotion or restriction.

### 14.5 Stage 5 automatic repair release policy

In v1.0, Oryn may automatically **propose and test** repair candidates for all eligible workflows. Fully automatic deployment of a repair is allowed only when all of the following hold: the agent is already Stage 5; the modification is limited to a non-policy, non-permission, low-risk interaction or data-format adaptation; the affected job is Tier 0 or Tier 1; the organization and workflow owner have separately enabled this change category in advance; all required tests pass; no new action type or destination is introduced; and a limited rollout and immediate stop capability are available. Every other repair requires explicit owner approval before release. Automatic changes create an immediately visible release event and remain reversible at the agent-version level.

---

## 15. Agent Flight Simulator

### 15.1 Product goal

Before an agent is permitted to act on real business records, Oryn must allow authorized users to examine whether the agent achieves the correct outcome across representative cases, exceptions, unexpected application states, and denied actions. The Flight Simulator is a product experience for evidence-based readiness, not a guarantee of perfection.

### 15.2 Simulator home

The simulator displays an agent selector; version selector; scenario suite; latest evaluation result; mandatory check status; missing coverage; historical regressions; and a clear **Run Evaluation** action. Its default view explains whether the agent is eligible for its requested stage and exactly what prevents release.

### 15.3 Scenario definition

Every scenario must have: a descriptive name; scenario type; purpose; relevant application context; starting business state; input records and documents or approved synthetic equivalents; applicable policy conditions; permitted actions; expected final business state; expected exception or stop state where relevant; mandatory invariants; and a reviewer/source. A scenario with missing expected outcomes is **Incomplete** and cannot contribute to a passing readiness assessment.

### 15.4 Scenario categories

1. **Happy Path:** Normal cases satisfying known prerequisites.
2. **Boundary Conditions:** Exact thresholds, unusual but valid formats, and transitions between approved branches.
3. **Business Exceptions:** Duplicate record, missing approval, conflicting amount, unavailable customer, changed contract, unusual fee.
4. **Input Quality:** Missing, malformed, ambiguous, duplicated, or contradictory content.
5. **Application Drift:** Moved/renamed controls, altered form layout, changed field ordering, new confirmation screen.
6. **External Failure:** Timeout, unavailable application, interrupted session, partially completed step, rate limiting, stale data.
7. **Permission and Policy:** Actions outside role, amount, application, or record scope; unauthorized escalation attempts.
8. **Recovery and Duplicate Prevention:** Retry after an uncertain outcome; avoid duplicate submission; resume or safely stop.
9. **Previously Observed Incident:** Every resolved production issue that has a reproducible safe test representation.

### 15.5 Test suite generation

Oryn proposes scenarios using observed verified examples, approved business rules, documented exceptions, and previously observed incidents. It may generate synthetic business records, but must identify them as synthetic. The reviewer can accept, reject, revise, or add cases; define which cases are mandatory; and request new cases focused on a chosen branch or incident. Real sensitive data must not be copied into an unrestricted testing environment.

### 15.6 Execution visibility

While an evaluation runs, the user sees which scenario is running, its progress, the major business steps executed, a current verdict when known, and any required permission or policy stop. A test can be canceled without committing simulated changes to production. If an evaluation is interrupted, unfinished scenarios are shown as **Not Run**, not failures or passes. The evaluation remains incomplete.

### 15.7 Test verdicts

- **Passed:** Expected outcome and mandatory invariants verified.
- **Failed — Incorrect Outcome:** The final business state differs from the required state.
- **Failed — Unsafe Action:** An unauthorized or prohibited action was attempted.
- **Failed — Execution Error:** The agent could not complete the expected path.
- **Passed — Expected Safe Escalation:** The test deliberately requires stopping or asking a human, and the agent did so correctly.
- **Inconclusive:** Not enough evidence to establish correctness; does not count as a pass.
- **Not Run:** No completed evaluation for the scenario.
- **Canceled:** Evaluation stopped by a user or policy.

The overall evaluation is **Pass** only when every mandatory scenario has an expected passing verdict, no critical safety/policy failures exist, the required scenario mix is met, and the suite is complete. Otherwise it is **Fail** or **Incomplete**, with reasons.

### 15.8 Failure replay

Selecting a failed scenario opens a time-ordered business-action replay showing: starting state; decision points; source values used; actions attempted; state after each step where observable; exact expected-versus-actual difference; relevant policy; and the first point at which the outcome diverged. Visual captures are available only when retained in the permitted environment and visible to that user. A cloud reviewer must not receive another employee's raw local screenshots merely by opening replay.

### 15.9 Version comparison

A user can compare two agent versions against the same scenario set. The comparison must show: newly passing cases; regressions; unchanged failures; policy/safety differences; outcome accuracy; median task duration where meaningful; estimated per-case cost if available; human escalation frequency; and remaining unknowns. Comparisons explicitly state when suites differ or when test conditions are not comparable.

### 15.10 Evaluation governance

An approved evaluation report is linked to a fixed agent version and a fixed test-suite version. Changes to behavior, rules, scope, test expectations, or permissions require reevaluation. Cosmetic text edits do not. A workflow owner can request additional coverage before approval. No reviewer may waive a critical safety test failure to force autonomy eligibility.

### 15.11 Simulator empty and error states

- No test suite: **Create or Generate Scenarios**; agent not eligible for release.
- No expected outcome: **Define Expected Result**; scenario incomplete.
- External application cannot be represented safely: **Simulation Coverage Gap**; affected execution stage restricted.
- Scenario artifact expired or excluded: **Evidence Unavailable**; scenario cannot be scored as passed.
- Conflicting rule definitions: **Resolve Policy Conflict** before evaluating that branch.
- Evaluation canceled or partially run: **Incomplete**; show last completed cases without claiming readiness.

---

## 16. Agent Jobs, Queues, and Production Execution

### 16.1 Job creation

An authorized operator may start a job from the agent detail page, an approved task context, or an assigned work queue. Before starting, Oryn displays: agent name/version; objective; input source; exact target selection or queue; estimated item count; action scope; expected outputs; risk tier; approval requirements; known limitations; and the destination for results. The operator must confirm the selected scope. The product must never substitute a broader queue without asking.

### 16.2 Scheduled jobs

Eligible Stage 4/5 agents may be scheduled by an authorized workflow owner. The schedule defines start time or a named approved business event, eligible target population, maximum items per job, permitted hours, escalation recipient, and behavior if a prior job is still running. The default behavior is **do not start an overlapping job**. A failed scheduled run generates an alert; Oryn does not repeatedly re-trigger unbounded jobs.

### 16.3 Job and case statuses

**Job states:** Draft, Queued, Preflight Check, Running, Waiting for Review, Partially Complete, Completed, Completed with Exceptions, Paused, Failed, Canceled.  
**Case states:** Not Started, In Progress, Prepared, Awaiting Approval, Verified Complete, Expectedly Rejected, Needs Clarification, Blocked, Failed, Canceled, Outcome Unknown.

A job is **Completed** only when every included case reached an approved terminal state and the job's required output is available. It is **Completed with Exceptions** when expected exception states are resolved or explicitly handed off with ownership. It is **Partially Complete** when some cases succeeded but others remain unresolved. A business write with unverified outcome must not count as verified complete.

### 16.4 Preflight checks

Before any real write, Oryn checks that: the operator is authorized; the agent version is approved and active for this scope; necessary applications and permissions are available; required inputs exist; applicable rules are current; the target item is not in a conflicting active job; and the job does not exceed organizational restrictions. Any failure blocks the affected operation with an actionable explanation.

### 16.5 Execution transparency

The operator sees a live business-level log: item identifier or redacted label, step description, action status, current stage, required review, and outcome. For large batches, the summary prioritizes exceptions and decisions rather than displaying every minor interaction. A user can pause, stop future actions, inspect a case, or view evidence according to role and data permissions.

### 16.6 Human approval drawer

For Tier 3 consequential actions and other designated approval gates, Oryn presents a review drawer containing the affected records; proposed before/after values; evidence for those values; rule and authority checks; consequences of confirming; whether the action is reversible; and separate **Approve**, **Reject**, or **Request Changes** actions. Bulk approval is available only for explicitly permitted homogeneous actions and requires item-level visibility. Items with materially different risks or unresolved exceptions cannot be hidden inside a bulk approval.

### 16.7 Commit boundaries and uncertain results

Oryn must distinguish **Prepared**, **Submitted**, and **Outcome Verified**. Some external applications cannot undo a committed action. Oryn must not claim that all staged changes are transactionally reversible. When submission status is uncertain, the case becomes **Outcome Unknown**; further potentially duplicative action stops until the outcome is checked or an authorized operator resolves it. Where rollback is impossible, the product presents a compensating-action option only if explicitly approved and available.

### 16.8 Partial success and batch behavior

A failure affecting one case should not automatically fail all independent cases, unless a shared prerequisite or safety issue puts the entire batch at risk. Oryn identifies completed cases, unresolved cases, cases safely skipped, and those still pending. Retrying a batch defaults to unresolved eligible cases only. The operator must be able to inspect exactly which records will be retried.

### 16.9 Job results and handoff

On completion, Oryn provides counts and links for verified successes, expected rejections, escalations, failures, outcome-unknown cases, and any approvals still outstanding. Each case has a human-readable explanation and permitted source evidence. The result can be exported or shared to authorized stakeholders. If an issue requires manual follow-up, it has a named owner and visible status.

### 16.10 Running time, costs, and limits

Before starting a job, users see an indicative duration and cost range only when sufficient comparable history exists. Otherwise the UI states **Insufficient History for Estimate**. The platform reports actual elapsed task time and billed consumption, when applicable, without implying that task duration equals employee labor time saved. Organization admins may set run and spend limits; jobs that reach the limit pause cleanly and request new authorization.

---

## 17. Outcome Verification and Business Correctness

### 17.1 Required outcome specification

Every executable agent must define: (1) intended business effect; (2) observable result required to consider the case complete; (3) conditions that mean the action is invalid; (4) how a duplicate or already-completed case is recognized; (5) exceptions requiring review; and (6) who owns an inconclusive outcome.

### 17.2 Verification principle

A successful click, form completion, or success banner does not suffice when the workflow requires a confirmed downstream business state. Oryn attempts to verify the authoritative business result that the workflow owner approved. If the authoritative result cannot be inspected, the case is **Outcome Unknown** or **Prepared for Review** rather than **Verified Complete**.

### 17.3 Correctness categories

- **Correct and Verified:** Required postconditions hold; no mandatory policy violated.
- **Correctly Escalated:** The agent stopped because necessary evidence, authority, or a known condition was missing.
- **Business Incorrect:** The resulting state violates one or more expected business requirements.
- **Policy Violation Attempt:** The agent tried to perform or authorize an action outside allowed scope, even if the external system rejected it.
- **Unverified:** Evidence is missing, contradictory, or inaccessible.

### 17.4 Verification conflicts

If the agent believes a case is complete but an authoritative system disagrees, Oryn opens an incident. If two sources disagree, it does not choose whichever source produces a passing result; the workflow must specify source priority or refer the case to an owner. If downstream confirmation arrives later, Oryn may update a pending case with a time-stamped verified outcome; the history retains the earlier uncertain state.

---

## 18. Incident Center and Operational Immune System

### 18.1 What creates an incident

An incident is created when a deployed agent violates an important condition or cannot proceed safely. Triggers include unexpected application state; missing or inconsistent input; failed verification; repeatable errors; unauthorized action attempts; policy conflicts; permission loss; unusual exception volume; incomplete submission; version regression; unreliable outcome evidence; or suspected duplicated business effects.

Not every routine safe escalation is an incident. A known exception handled exactly as the approved workflow expects appears as a **Handled Exception**. Repeated handled exceptions may create an operational improvement opportunity if volume rises materially.

### 18.2 Incident severities

| Severity | Definition | Default behavior |
|---|---|---|
| **Critical** | Actual or suspected unauthorized consequential action, prohibited action attempt, security/privacy breach, or widespread incorrect business results | Immediately stop affected execution scope, alert owners and security admins, block automatic release |
| **High** | Incorrect verified outcome, repeated outcome uncertainty affecting multiple cases, or widespread agent regression | Pause affected write actions and notify incident owner and workflow owner |
| **Medium** | One or several recoverable errors with no observed unauthorized side effect | Pause affected case or capability; continue independent safe cases if permitted |
| **Low** | Noncritical drift, missing context, or usability issue with no correctness impact | Log, surface relevant warning, and propose routine review |

Users with incident-management authority can raise severity. Lowering Critical or High requires an incident owner and recorded justification; a Critical incident additionally requires security review.

### 18.3 Incident detail requirements

Every incident includes: title; severity; time discovered; affected organization/team; agent and version; workflow and decision point; cases and jobs affected; observed symptoms; expected versus actual behavior; known impact; current containment; evidence availability; suspected causes clearly labeled as hypotheses; remediation options; assigned owner; and status history.

### 18.4 Incident status flow

**Open → Triaged → Contained → Investigating → Repair Proposed → Testing → Awaiting Approval → Limited Release → Monitoring → Resolved.** An incident may be **Dismissed as Non-Issue** with justification or **Reopened** when new evidence appears. Status changes must preserve earlier facts and decisions.

### 18.5 Failure classification

Oryn offers explicit categories: **Interface Drift**, **Data/Document Format Drift**, **Missing Business Rule**, **Changed Business Policy**, **Reasoning/Decision Failure**, **External Service Failure**, **Permission/Authorization Failure**, **Inconsistent Source Data**, **Duplicate or Partial Submission**, **Verification Failure**, and **Unknown**. A case may have multiple suspected categories. Oryn must not present one cause as confirmed without supporting evidence.

### 18.6 Root-cause review

The incident page compares an affected case against relevant verified successful cases. It highlights the first observable divergence, changed input/context, decisions made, source values, and applicable rules. Authorized reviewers can correct the diagnosis, mark it unconfirmed, or request SME input. Missing evidence is shown as a gap, not filled with plausible fabricated detail.

### 18.7 Containment controls

Available responses are **Pause Case**, **Pause Agent**, **Disable Affected Action Type**, **Stop New Jobs**, **Escalate to Owner**, and **Request Approval to Resume**, subject to the user's role. Containment targets the smallest safe scope. A critical shared rule or permission issue can pause every dependent agent version. The control panel lists all affected work so that stopping an agent does not silently abandon pending cases.

### 18.8 Repeated incidents and pattern recognition

Oryn groups incidents that share a relevant failure signature, business rule, or workflow branch. The group shows number of affected cases, first/last occurrence, current workaround, and estimated impact. If a second agent depends on the same affected rule, Oryn flags that dependency and recommends verification of the second agent; it must not silently modify that agent.

---

## 19. Human Corrections and Exception Intelligence

### 19.1 Correction capture

When an agent stops or fails, an authorized SME or operator may complete a case manually and choose **Teach Oryn What Changed**. Oryn presents the observed deviation, proposed interpretation, relevant source values, and a chance to explain the reasoning. The employee may supply a concise written or spoken explanation under the applicable privacy policy.

### 19.2 Micro-interview experience

Oryn should ask one focused question at a time, only when the answer could clarify a meaningful rule or exception. Example: "You sent this invoice for manual review instead of matching it automatically. Which condition required that?" Available responses include typed answer, recorded answer when permitted, **I Don't Know**, **Not a General Rule**, and **Ask Another Expert**. A dismissed interview does not block the employee's unrelated work and must not repeatedly reappear for the same resolved question.

### 19.3 Candidate rule lifecycle

An explanation becomes **Proposed Rule**, not immediately approved policy. Oryn summarizes the proposed condition, affected workflow branches, evidence, example cases, possible conflicts, and consequences of adoption. The relevant owner reviews it against authoritative policy and either approves it, requests evidence, restricts its scope, or rejects it. Only approved rules can change agent authorization or automatic decisions.

### 19.4 Different types of learning

Oryn must distinguish: **Correction of a mistake**, **New legitimate exception**, **One-off discretionary judgment**, **App-interface workaround**, **Clarification of existing policy**, and **Actual policy change**. One-off judgments cannot silently become broadly reusable rules. Policy changes require the organization's designated approval route, not merely SME consensus.

### 19.5 Improvement artifacts

An accepted correction may create all of the following as appropriate: a clarified workflow step; an approved exception branch; a new test case; a repair proposal; an update to human guidance; a warning for similarly affected active jobs; and an item in the change history. The contributor sees which artifacts were generated and where review is pending.

### 19.6 Unanswered and contradictory questions

If no qualified expert answers a question, it stays unresolved and the agent continues to escalate that case type. If two experts disagree, Oryn creates a Knowledge Conflict with both views and requests owner decision. The system must not resolve material disagreement by majority vote or seniority alone.

---

## 20. Repair Proposals, Regression Prevention, and Self-Maintenance

### 20.1 Repair proposal types

A repair can propose to change: an interaction with a moved or renamed control; a document extraction interpretation; a step order or prerequisite; a retry/recovery rule; an exception branch; a clarification request; a tool or application selection; or a business-rule application. A repair cannot secretly increase permission scope or create an authorization that the original agent lacks.

### 20.2 Repair proposal card

The card must contain: affected incident(s); suspected root cause; description of proposed behavior; exact changed steps, conditions, or interpretation; why the change might work; source evidence; expected benefit; new risks; affected playbooks and agents; added tests; regression results; required approvals; and eligible rollout scope. It includes **Compare**, **Run Tests**, **Request Expert Input**, **Submit for Approval**, and **Reject** actions where applicable.

### 20.3 Repair creation lifecycle

1. Oryn identifies a reproducible or at least diagnosable failure.
2. The platform states the observed facts and any uncertain hypotheses.
3. The platform proposes one or more bounded corrections or asks an expert for missing knowledge.
4. The accepted candidate becomes a new draft version, not an edit to the active version.
5. The failure case is added as a regression scenario when it can be represented safely.
6. The complete regression suite and new nearby cases are evaluated.
7. Reviewers inspect the change and its effects, including any newly failing cases.
8. The release follows the agent's risk and change-approval policy.
9. A limited rollout is monitored before broad adoption.
10. The incident closes only after the agreed outcome is confirmed or a documented containment disposition is accepted.

### 20.4 Repair success rules

A repair is **Validated** only if: the original issue is reproduced or its prevention is otherwise demonstrably tested; the affected cases now produce the intended outcome or safe escalation; mandatory invariants pass; there are no new known critical regressions; and required approvals have been recorded. A patch that merely suppresses a visible error without achieving the intended business outcome fails.

### 20.5 Retry and recovery behavior

Oryn offers a retry only when it can determine which prior actions were completed and the workflow permits safe continuation or re-execution. If the committed state is unknown or could duplicate an external business effect, Oryn pauses for investigation. The operator sees an explicit **Retry Only Safe Remaining Actions** option where available, never an ambiguous retry that may repeat everything.

### 20.6 Repair outcome history

Every released repair records: incident linkage; changed agent version; approving roles; scenarios added; evaluation results; rollout scope; first observed live outcomes; any regressions; and whether the original incident recurred. Failed repairs remain visible in history and may be superseded; they must not disappear from the review trail.

---
## 21. Workflow and Agent Versioning: Git for Operations

### 21.1 Versioning principle

A published workflow or deployed agent is never silently overwritten. Every material modification produces a new proposed version with an explicit history. Employees using the existing published guide and operators running the existing approved agent must be able to identify which version they are using. Oryn preserves past definitions and relevant decisions for audit and comparison.

### 21.2 Versioned content

A new material version is required when the business objective, inputs, output obligations, execution steps, decision conditions, approved rules, permissions, authorized scope, required review gates, verification logic, or exception behavior changes. Editing only a spelling error, display order of nonfunctional information, or explanatory phrasing that does not alter meaning may be recorded as a nonmaterial revision; the product must classify it accordingly and permit an authorized user to challenge that classification.

### 21.3 Change review experience

A proposed version is presented as a business-language change request. The reviewer sees: old and new behavior side by side; rationale; affected roles, applications, workflows, and other agents; rules changed or reused; new and removed permissions; expected impact; test results; unresolved risks; proposed deployment audience; author; required approvers; and comment history. Review actions are **Approve**, **Request Changes**, **Reject**, and **Escalate**.

### 21.4 Version states

**Draft → Review Requested → Changes Requested / Approved → Limited Release → Active → Superseded → Archived.** A version may also be **Withdrawn** before release or **Reverted** after release. A rejected version remains visible for audit but cannot be deployed without a new review. Only one version is designated the default active version per specific deployment scope, although different teams may be on intentionally different approved rollout stages.

### 21.5 Rollout controls

Every agent release specifies the target team(s), application context, eligible records, autonomy stage, approval conditions, initial exposure, success criteria, stop conditions, and person accountable for rollout. The default v1.0 deployment for material changes is a limited release to an explicitly chosen test group before organization-wide adoption. The owner can expand, pause, or end the rollout based on verified business results.

### 21.6 Rollback and restore behavior

If a new agent version regresses, an authorized owner may restore the last approved version for future jobs. Oryn must be explicit that restoring an agent definition does not undo business records already committed by a previous job. The review screen separates **Restore Agent Version** from **Investigate/Correct Business Effects**. Reverting a version requires recording why; critical incidents additionally require incident follow-up.

### 21.7 Running jobs during changes

Jobs already executing must display their pinned agent version. A new release affects new eligible jobs, not silently the behavior of work already in progress. Critical safety restrictions may pause jobs regardless of version. Any job that cannot safely continue under an emergency restriction becomes **Paused** with an explanation and an assigned reviewer.

### 21.8 Rule changes and dependency impact

When an owner approves a material rule change, Oryn lists every published playbook, agent, test suite, guide, and unresolved incident that uses the rule. The owner chooses which workflows require immediate restriction and which may continue under an explicitly documented previous policy where legally and operationally permissible. Any agent whose required rule is invalidated is marked **Needs Revalidation** until tests and approvals are updated.

---

## 22. Operations Map, Command Center, and Core Navigation

### 22.1 Primary navigation

The v1.0 management experience has the following top-level areas:

1. **Home:** Organizational summary, prioritized issues, approvals, and recent verified outcomes.
2. **Operations Map:** Published workflow landscape, dependencies, exceptions, and candidate improvements.
3. **Playbooks:** Searchable human guidance and workflow review.
4. **Agent Factory:** Agent catalog, candidates, permissions, and versions.
5. **Flight Simulator:** Tests, evaluations, replay, and readiness.
6. **Jobs:** Execution queues, live runs, pending approvals, and results.
7. **Incidents:** Failures, root causes, expert questions, and repair proposals.
8. **Changes:** Reviews, staged releases, version comparison, and history.
9. **Insights:** Process and business-outcome reporting.
10. **Settings:** Organization, teams, privacy, retention, access, policies, and personal preferences.

Areas are visible only if the user's role permits them. A role-restricted page must display a comprehensible access explanation rather than an apparently empty or broken interface.

### 22.2 Home dashboard

The default home view contains the most important information for the current role. An employee sees personal guidance, outstanding expert questions, and assigned approvals. An operator sees in-progress jobs, unresolved cases, and upcoming scheduled work. A workflow owner sees candidates awaiting review, agent readiness, incidents, and proposed changes. A manager sees authorized aggregate outcomes and business-process bottlenecks. A security admin sees policy exceptions and high-severity safety alerts.

### 22.3 Required summary indicators

Where applicable and authorized, Home displays: discovered workflow candidates; approved playbooks; active approved agents; jobs in progress; verified successful cases; unresolved exceptions; pending reviews; currently paused agents; high-severity incidents; and changes awaiting rollout. Every indicator links to the filtered detail list and shows the reporting period. A number of zero must be displayed as zero, not hidden.

### 22.4 Operations Map

The map supports visual and table views. It shows processes by team, application, outcome, and dependency. Users can inspect: where work starts; which steps and decisions exist; handoffs to other processes; known exception branches; whether a playbook is current; and which portions are guided, assisted, or automated. Unverified candidate relationships are visually distinct from approved ones.

### 22.5 Global search

Search includes authorized published playbooks, workflow candidates the user may review, agents, known exceptions, incidents, approved rules, and relevant job IDs. Search results must honor the user's permissions and data scope. Results display type, title, owner, current state, and last verified or updated date. Search over private personal history stays in the employee's private companion and is not folded into organization-wide search.

### 22.6 Common detail-page pattern

Every object detail view should provide: name and status; summary; owner and scope; business significance; relevant evidence; related objects; timeline of changes; permitted actions; and a visible explanation of unavailable actions. Destructive or high-consequence controls must be visually distinct and require confirmation.

### 22.7 Visual language for uncertainty

Approved versus inferred, safe versus blocked, completed versus unverified, and active versus paused must remain clear without relying on color alone. Every status is accompanied by text. The product uses consistent status terminology throughout desktop HUD, web dashboard, notification, export, and audit views.

---

## 23. Operational Analytics, Business Value, and the 14-Day X-Ray

### 23.1 Analytics purpose

Oryn measures business-process health and automation results, not employee attendance or comparative personal productivity. Reports must be appropriate for decision-making, expose estimation assumptions, and distinguish observed data from inferred benefit.

### 23.2 Required v1.0 metrics

| Metric | Definition | Reporting constraint |
|---|---|---|
| **Workflow frequency** | Number of recognized completed task instances for an approved process in a period | Aggregate only; exclude incomplete observation |
| **Verified success rate** | Verified-complete cases divided by eligible cases with resolved outcomes | Show unknown outcomes separately |
| **Exception rate** | Cases requiring exception handling divided by started cases | Separate expected escalations from failures |
| **Autonomous completion rate** | Cases completed without per-case human correction and independently verified | Do not count merely submitted cases |
| **Human escalation rate** | Cases escalated to a person divided by started cases | Break down cause categories |
| **Recovery coverage** | Previously unsupported exception types successfully resolved through approved repairs | Define measured cohort and period |
| **Regression rate** | Previously passing test scenarios that fail under a new version | Show by agent version |
| **Median case duration** | Median elapsed execution time of verified cases | Separate waiting for approval where possible |
| **Approval workload** | Count of decisions requiring human review by workflow | Do not rank individual reviewers |
| **Estimated time avoided** | Verified automated volume multiplied by a clearly disclosed baseline manual task duration less estimated review effort | Show assumptions, not a promise of realized labor savings |
| **Estimated cost per completed case** | Applicable execution and review costs divided by verified-complete cases | If data unavailable, show unavailable |
| **Operational backlog** | Eligible unresolved cases by process and status | Subject to authorized system visibility |
| **Agent maintenance burden** | Count of incidents and manual repairs per agent and version | Measure operational reliability, not an employee's effort |

### 23.3 Analytics filters

Authorized users can filter by time period, team, workflow, application, agent, agent version, incident type, and risk tier. Every report shows the data window, denominator, missing-data limitations, and whether values are measured or estimated. Small groups must be aggregated or suppressed when individual activity might become identifiable under organizational privacy policy.

### 23.4 No surveillance analytics

The product must not provide: employee rankings; individual keyboard/mouse counts; hours actively using software; per-person idle time; personal desktop timelines; attendance inference; or detailed manager views of who visited which window. Aggregate process metrics must not be reexpressed as individual performance dashboards.

### 23.5 Operational opportunities

Oryn ranks improvement candidates using an explained combination of repeat volume, verified manual task effort, exception burden, economic importance where supplied, agent readiness, and safety risk. Suggestions must identify confidence and missing evidence. A manager can send a candidate to a workflow owner for investigation but cannot publish or deploy it solely because it appears high on the list.

### 23.6 The 14-Day Operational X-Ray

A customer can run a voluntary, time-bounded discovery pilot for one approved operational team. The pilot setup specifies start/end dates, applications, participating employees, permitted workflows, required privacy notices, owner, and intended output. Oryn reports progress without displaying employee surveillance indicators.

The pilot report contains: scope and sample size; workflows discovered; common variants and exception patterns; process handoffs; known bottlenecks; reusable peer fixes; estimated automation opportunities; evidence quality; eligible agent candidates; risks and privacy limitations; and a recommended next-step shortlist. It may include a supervised demonstration of a validated candidate agent, but must not imply that a production-grade agent was automatically proven safe solely because two weeks elapsed.

### 23.7 Export and sharing

Authorized users may export a report in a shareable human-readable format and a structured tabular format where relevant. Every export carries report period, organization, permission scope, generated date, methodology notes, and uncertainty labels. Exports never include raw employee media or private captures by default. The administrator can restrict export permissions and review a record of report exports.

---

## 24. Notifications, Reminders, and Attention Management

### 24.1 Notification channels

Every user has an in-product notification inbox. The product may offer desktop notifications for immediate operational events and organization-approved email notifications for assigned approvals and incidents. Notifications must respect employee quiet-hours preferences unless the organization has designated an applicable critical operational incident policy. No notification may leak sensitive business details in a locked-screen preview beyond the employee's chosen privacy setting.

### 24.2 Required notification types

- **Action Required:** Agent approval, unresolved case, expert question, or policy confirmation assigned to the user.
- **Incident:** New or escalated incident affecting the recipient's ownership scope.
- **Repair Ready:** A proposed change has new evidence or passed evaluation and requires review.
- **Release Status:** A limited rollout started, expanded, paused, reverted, or completed.
- **Commitment Reminder:** A confirmed outstanding obligation is relevant or due.
- **Guide Update:** An approved playbook changed in a way affecting active work.
- **Job Result:** A requested or scheduled job has completed, partially completed, failed, or paused.
- **Privacy/Enrollment:** Capture status needs attention, consent expired, or policy changed.

### 24.3 Notification precedence

Critical safety incidents are highest priority, followed by required operational approvals and stalled jobs, followed by due commitments and routine improvements. Repeated related cases may be summarized rather than generating a separate disruptive alert per case. Alerts must not be suppressed when an active security restriction requires action.

### 24.4 User controls

Employees can configure digest frequency, quiet hours, preferred channels, reminder snoozes, and proactive HUD categories within organizational minimum policy. The product honors a user's dismissal or snooze for the specified period. A critical notification cannot be marked resolved merely by hiding it; the underlying incident must receive an authorized disposition.

---

## 25. Privacy, Data Lifecycle, Security Policy, and Audit Experience

### 25.1 Capture categories and user-facing defaults
At enrollment the employee sees independent controls for: visual work observation; contextual work-application recognition; personal-history retention; organizational sharing of sanitized workflow suggestions; meeting transcription; and meeting commitment extraction. Each control explains the purpose and consequences of turning it off. Screen observation categories govern distinct capture modalities: `contextual_work_application_recognition` permits safe application identity, window titles, and settled accessibility text without visual frame capture or OCR; `visual_work_observation` permits event-triggered, privacy-masked visual snapshots and privacy-helper-governed visual extraction via the cloud inference gateway without structured accessibility text. When both are enabled, both streams are captured with distinct provenance. When `personal_history_retention` is disabled, screen-derived visual inference operates ephemerally under separate cloud-processing consent with a strict 30-second volatile lifetime in memory; no inputs, intermediate representations, or model outputs are written to disk, and no deferred upload backlog is maintained. Meeting audio is off by default and needs an additional per-meeting opt-in. Organizational sharing cannot transmit raw media or bypass exclusions.

### 25.2 Mandatory exclusions

Personal password managers, authentication secrets, personal messaging, personal banking, incognito/private browsing, personal mail, HR compensation data, protected health portals, and windows explicitly excluded by employee or organization policy must not be captured. Organization policy can add more exclusions but cannot force observation of these mandatory protected categories. An excluded window displayed alongside permitted work must not become part of the shared recorded artifact.

### 25.3 Sensitive-field handling

Passwords, tokens, account credentials, payment details, and other restricted data must not appear in shared playbooks, agent prompts, task summaries, or centralized reports. Sensitive business values used in execution are displayed to authorized operators only when needed for the task. Redacted material is represented with meaningful field labels rather than plausible replacement values that might be mistaken for real data.

### 25.4 Retention policy

**v1.0 defaults:** Raw local screen and audio content is retained for seven days and automatically expires. An employee may choose a shorter period of one to six days; an organization may permit an employee to extend retention up to a maximum of 14 days for a documented workflow-research need, but cannot force local raw retention beyond the defined maximum. Durable storage of private raw captures, audio, transcripts, and unshared commitments is strictly local to the employee device. Cloud model inference is strictly transient: the LiteLLM gateway enforces zero content retention after processing, disables prompt/completion logging and caching, and uses memory-backed temporary spooling that is wiped on completion or cancellation. Sanitized organizational workflow history is retained until archived or deleted under the organization's policy, with a default 365-day retention period for unapproved candidates. Approved playbook/agent change histories and consequential action audit records use the organization's approved audit retention schedule, with a default of 24 months. Legal hold or contractual retention requirements must be explicitly disclosed rather than silently extending private raw-capture retention.

When an employee deletes local content, Oryn explains whether already approved, anonymized organizational knowledge remains and offers the appropriate separate contribution-removal process. Discarded or expired private raw capture cannot be recovered from Oryn's organization dashboard.

Supported client uninstallation presents an explicit data deletion warning, stops all observation and helper processes, verifies whether legal hold constraints apply, and permanently purges eligible local unheld private data, profile secrets, and local preferences, issuing a cryptographic purge receipt. If an active legal hold or unknown retention verdict is returned by local storage, uninstallation cleanup is aborted with an explanation directing the user to their administrator, leaving protected data intact rather than performing unauthorized deletion. Uninstallation never deletes previously published, anonymized organizational knowledge or centralized audit records.

### 25.5 Review before sharing

Before a personal observation becomes a shared candidate playbook, the employee can inspect the proposed sanitized description, its referenced application context, included business variables, and any source excerpt intended for review. The employee can approve contribution, remove sensitive details, mark steps out of scope, or decline the share. Shared excerpts are limited strictly to sanitized text narratives and purpose-bound redacted still images (maximum 1920×1080, maximum 1 MiB, at most four per contribution) subject to a signed organizational artifact policy that defines purpose, audience, and maximum artifact lifetime. An approved redacted still image is a distinct, metadata-stripped derivative, not raw media or remote manager access to the source; audio and video clips remain strictly prohibited from sharing. Processing private captures with an AI service through the governed gateway is not a shared contribution; an explicit review-before-sharing step is always required before any sanitized workflow excerpt or commitment becomes organizational knowledge. An organization may limit publishing to approved work scopes but must not bypass this sharing review for individual recordings.
### 25.6 Enterprise restrictions

Security admins must be able to define: approved applications and excluded categories; which teams may use meeting intelligence; maximum raw-capture retention; organizational knowledge sharing audiences; allowed action risk tiers; special approval limits; which agent abilities can be enabled; export permission; and requirements for incident reporting. Every change shows affected users and workflows, effective timing, and who authorized it.

### 25.7 Consent changes

When consent is withdrawn, Oryn immediately stops the affected capture category. Existing pending private observations are not newly shared. Already published authorized organizational procedures are treated under the contribution and retention policy with visible options to request correction or removal. A changed organization policy that materially affects employee capture requires a new employee notice and acknowledgment before that capture category resumes.

If observation stops due to capture-policy lease expiration during offline operation, receiving a renewed valid policy lease alone does not restart capture automatically; intentional employee resumption (and acknowledgment of any updated notice terms) is required.

### 25.8 Audit trail

Audit views record significant user-visible and agent actions: enrollment/consent changes, capture policy changes, publications, approved rules, permission grants, job starts, approvals, external business submissions, verification outcomes, incident interventions, repair proposals, test approvals, releases, version restores, exports, and deletions. Each audit event states actor or approved agent identity, action, affected business object, time, scope, outcome, and reason where required. Audit views do not reveal prohibited raw capture data.

### 25.9 Data access, removal, and organization offboarding

Authorized admins can export published organizational knowledge and the audit artifacts they are entitled to retain. They can remove team memberships, restrict access, archive playbooks, retire agents, and request data deletion according to policy. An organization offboarding flow must list current agents, scheduled jobs, pending approvals, retained audit records, shared knowledge, and the consequence of deactivation. No agent may continue initiating jobs once the organization is deactivated.

### 25.10 Malicious or misleading content

Text appearing on a screen, in a PDF, an email, a chat message, or a test document is treated as business content, not automatic permission to change agent instructions. Oryn must not follow a document's instruction to bypass approvals, reveal secrets, or broaden agent capabilities. If untrusted content conflicts with approved rules, Oryn ignores the unauthorized instruction and may flag the case for review.

### 25.11 Employee trust center

Every employee has a **My Privacy** area showing active capture settings, excluded apps, next raw-retention expiration, shared contributions, consent history, and available pause/deletion actions. The product explains exactly what managers can and cannot see. This information must be accessible without submitting an administrative support ticket.

---

## 26. Cross-Team Work and Business Commitments

### 26.1 Dependency awareness

Oryn should recognize approved relationships such as "approved quote must precede order fulfillment" or "a contract exception requires legal review." These appear in the Operational Graph, and a workflow owner can make the dependency explicit. Work may cross teams, but no team gains access to another team's restricted source data merely because workflows are connected.

### 26.2 Handoff definition

A handoff contains source workflow, required destination workflow, triggering business state, relevant approved evidence, assigned responsible team or person, due date if known, and required completion condition. If ownership cannot be determined, the handoff is **Unassigned** and routed to the workflow owner rather than silently assigned.

### 26.3 Handoff tracking

A handoff may be **Proposed**, **Assigned**, **Accepted**, **In Progress**, **Blocked**, **Completed**, or **Canceled**. Completing an upstream task does not falsely mark downstream work complete. Oryn reminds the responsible role of overdue accepted handoffs according to notification preferences and organizational policy.

### 26.4 v1.0 limits

Oryn helps identify, track, and coordinate handoffs, and can prepare approved cross-team actions. It does not autonomously negotiate interdepartmental priorities, override team permissions, or reallocate staffing. A manager or owner must approve changes to accountability and process structure.

---

## 27. End-to-End Reference Journeys

These journeys are normative examples of v1.0 behavior. They are intentionally concrete enough to guide interaction design, content requirements, and test planning. Customer-specific facts and thresholds are illustrative; actual organizational rules must be approved before use.

### 27.1 Journey A — Discover an invoice reconciliation workflow

**Participants:** Accounts-payable employee, SME, workflow owner.  
**Starting conditions:** The employee is enrolled and has consented to observation in approved mail, PDF, and ERP applications. The team owner has defined an eligible invoice-matching objective.  
**Sequence:**

1. The employee processes multiple supplier invoices, compares invoice data with purchase orders, and stages matching results in the ERP.
2. Oryn recognizes a candidate repeated business objective while abstracting variable-specific values into business fields.
3. The candidate shows relevant applications, prerequisites, branches, observed examples, and missing outcomes.
4. The employee reviews the sanitized suggested contribution and approves sharing.
5. The workflow owner inspects the proposed steps and selects authoritative sources for matching rules.
6. The SME explains a legitimate variance exception; the owner confirms whether the rule is approved or only a one-time exception.
7. The owner identifies the outcome verification rule, including the expected invoice status and whether downstream approval is required.
8. Oryn marks the workflow **Approved for Guidance** and makes it available to the permitted AP team.
9. New team members can open the guide and see applicable instructions and verified exception handling.

**Required result:** A published, reviewable playbook, not an automatically deployed agent. Unknown data, unsupported steps, or disputed rules remain visible as limitations.

### 27.2 Journey B — Turn a playbook into an agent

**Participants:** Automation Builder, workflow owner.  
**Starting conditions:** The AP playbook is published, its risk and outcome requirements are known, and authorized examples are available.  
**Sequence:**

1. The builder selects **Create Agent** and reviews the inferred purpose, inputs, actions, rules, outputs, and stopping points.
2. Oryn marks any unverified branch and prohibits use of that branch in production until resolved.
3. The builder restricts the agent to approved AP records and drafts the run and escalation behavior.
4. Oryn generates a test suite covering matching cases, duplicate invoices, missing purchase orders, and variance thresholds.
5. The builder and owner review expected outcomes and add any missing critical scenarios.
6. Oryn runs the Flight Simulator and reports both expected passes and failures.
7. The builder adjusts the agent, retaining a change history, until the release gates are met.
8. The owner approves a limited Stage 3 supervised deployment.

**Required result:** An agent with a fixed objective, explicit scope, passing evaluation evidence, and a human owner. The agent does not become fully autonomous solely from successful simulation.

### 27.3 Journey C — Process an authorized invoice batch

**Participants:** Agent operator, AP reviewer.  
**Starting conditions:** An approved Stage 3 or Stage 4 agent and a defined eligible queue exist.  
**Sequence:**

1. The operator selects 11 eligible invoices and sees the exact items and allowed action scope.
2. Oryn verifies permissions, version, application readiness, and business preconditions.
3. The agent prepares each item and independently validates the matching conditions.
4. Seven standard cases reach verified complete status; two are correctly escalated due to missing purchase orders; one requires Tier 3 approval; one has an uncertain downstream status.
5. The consequential item appears with a before/after diff and source evidence. The authorized reviewer approves or rejects it.
6. The uncertain item is held instead of automatically resubmitted.
7. The job summary shows the exact counts and unresolved owners; it is not mislabeled as 11 successful completions.

**Required result:** No duplicate submissions; explicit outcome states; reviewable decisions; a truthful completed/partial status; and accessible case-level evidence.

### 27.4 Journey D — Self-heal after a supplier format change

**Participants:** Agent operator, SME, workflow owner.  
**Starting conditions:** An approved agent is processing a known invoice type. A supplier introduces a new fee placement that invalidates the current interpretation.  
**Sequence:**

1. The agent cannot verify a required amount and safely pauses the affected case.
2. Oryn opens an incident, groups similar cases, and identifies a likely format mismatch as an unconfirmed hypothesis.
3. An SME completes one affected invoice manually and chooses **Teach Oryn What Changed**.
4. Oryn asks which fee is included in the invoice total. The SME explains the situation and links an approved accounting rule.
5. The owner validates the rule's applicability and scope.
6. Oryn creates a bounded repair proposal affecting the document-interpretation step, plus new regression cases.
7. The candidate version is tested against the original failure, nearby invoice variants, and the full suite.
8. The owner reviews the changes and authorizes a limited release; Oryn watches verified outcomes in that scope.
9. After successful observation, the owner expands rollout and closes the incident with the disposition recorded.

**Required result:** The repair is learned and validated without automatically reinterpreting an unapproved SME opinion as policy; unaffected cases are preserved.

### 27.5 Journey E — Respond to a policy change

**Participants:** Finance policy owner, workflow owner, security admin if authority changes.  
**Starting conditions:** A formally approved finance rule changes an invoice approval threshold.  
**Sequence:**

1. An authorized owner records the new policy, effective date, and scope.
2. Oryn identifies dependent guides, agents, and tests.
3. Affected agent capabilities become **Needs Revalidation** where outcomes or authority may change.
4. Oryn proposes the necessary rule applications, guide updates, and boundary tests.
5. Required approvers review the change, especially any change to monetary authority.
6. The updated agent passes the full regression suite and new threshold tests.
7. A controlled release occurs, and applicable guidance switches to the approved effective version.

**Required result:** No unapproved agent behavior changes, and no automatic self-healing logic overrides a business-policy decision.

### 27.6 Journey F — Surface a peer-learned fix

**Participants:** Two employees in the same authorized operational team.  
**Starting conditions:** A verified, published resolution exists for a recurring ERP validation error.  
**Sequence:**

1. Employee B encounters the matching error while performing a permitted task.
2. Oryn offers one unobtrusive contextual card naming the problem and approved fix.
3. Employee B chooses **Guide Me** and completes the verified steps.
4. Oryn confirms the resulting state where observable; if the outcome is unclear, the guide does not claim success.
5. The guide remains available to authorized peers without exposing Employee A's private recording or personal productivity metrics.

**Required result:** Knowledge transfers through a verified playbook, not by replaying another employee's screen without permission.

### 27.7 Journey G — Capture a meeting commitment

**Participants:** Sales employee and authorized meeting participants.  
**Starting conditions:** Meeting notice and consent requirements are met; employee explicitly starts recording.  
**Sequence:**

1. A customer asks for a specific contractual addendum by a named date.
2. Oryn proposes a commitment with source timing and notes that the request remains subject to company approval.
3. The employee reviews and confirms the exact obligation and ownership.
4. Later, when viewing the corresponding approved CRM record, the employee receives a contextual reminder.
5. Oryn offers to draft a note or a follow-up task; the employee reviews before publishing.

**Required result:** Clear confirmation and provenance; no unauthorized sharing of private meeting audio or automatic customer communication.

### 27.8 Journey H — Prevent an unsafe action

**Participants:** Agent operator, authorized approver.  
**Starting conditions:** An agent may draft discounts but is not permitted to approve a customer-facing concession.  
**Sequence:**

1. The agent identifies a proposed discount from customer context.
2. Oryn checks the action against the approved authority limits and relevant policy.
3. Because the required approval is missing, the agent does not submit the concession.
4. The operator sees the policy reason, supporting sources, and a request-for-approval action.
5. The approver either authorizes the specific proposal within their remit or rejects it.

**Required result:** The agent cannot convert a customer's request or its own recommendation into authorization.

---

## 28. Detailed Cross-Product Edge Cases and Expected Behavior

### 28.1 Observation and privacy cases

- **Private window appears during an otherwise permitted session:** No content from that window is captured; observation resumes only on permitted content.
- **Employee pauses mid-workflow:** The resulting example is incomplete; inferred missing steps are not presented as observed facts.
- **Employee refuses to share a candidate:** The organization cannot inspect the associated private recording or force publication of that contribution.
- **A confidential value appears inside a permitted screen:** The shared workflow must use a redacted field or omit the value; if safe redaction cannot be established, sharing is blocked pending review.
- **Audio consent is missing or withdrawn:** Meeting recording does not start or stops immediately; no transcript is generated for the unauthorized segment.
- **A manager requests a specific employee's activity timeline:** The request is unavailable, with an explanation of the privacy boundary.
- **The employee uninstalls the desktop companion:** Observation and helpers stop; eligible local private data, profile secrets, and local preferences are securely purged after an explicit deletion warning and confirmation that no legal holds apply; if an active legal hold or unknown retention verdict applies, uninstallation cleanup is aborted with protected data left intact; published organizational procedures and centralized audit history remain under organizational retention.
- **The capture policy lease expires while disconnected:** Observation stops after an absolute maximum of 24 hours of disconnection (or shorter configured limit); reconnecting and receiving a renewed policy leaves capture paused until intentional employee resume.

### 28.2 Workflow-learning cases

- **Two task executions have the same clicks but different business purposes:** Oryn must allow separate workflow definitions.
- **One workflow has multiple valid routes:** Oryn records explicit branches instead of treating the slower route as an error.
- **An expert used an unsupported shortcut:** The shortcut is suggested only for review; Oryn does not automatically deploy it.
- **A critical field is absent in one observation:** Oryn marks the example incomplete or exceptional rather than supplying a guessed value.
- **An authoritative rule conflicts with observed behavior:** The rule takes precedence for automation eligibility; the conflict is surfaced.
- **A workflow is successful but cannot be verified externally:** It can remain guidance-only or supervised with explicit limitations, not autonomous for the unverifiable outcome.

### 28.3 Agent execution cases

- **Permissions expire during a job:** Pause affected actions, preserve completed case states, and request renewed authorization.
- **The target record already has the desired result:** Verify and mark as already satisfied, avoiding a duplicate write; include this in the result summary.
- **An agent encounters two plausible records:** Stop that case and request confirmation; never choose based on convenience alone.
- **The system fails after the external submit action:** Mark the outcome unknown until verified; do not blindly retry.
- **An operator cancels a batch:** Stop future eligible actions, explain any changes already committed, and report each case's resulting state.
- **The agent reaches a high-risk action not declared in its scope:** Block the action and open a permissions or policy incident.
- **An active agent version is restricted while jobs run:** Existing affected jobs are paused; they do not continue simply because they started earlier.

### 28.4 Testing and repair cases

- **One mandatory test fails while 99 pass:** The evaluation is not passing; autonomy promotion is blocked.
- **A generated test has no reliable expected result:** Mark incomplete; it does not count toward passing test coverage.
- **The original incident is fixed but a known case regresses:** Reject the candidate repair for release.
- **A repair requires broader permissions:** Treat it as a separate access and release proposal; do not self-approve.
- **A policy changes after test approval:** Revalidate affected agent versions and scenarios.
- **An automatic limited repair causes a new critical incident:** Immediately stop the affected release scope and notify the responsible owners; restore the earlier approved agent version for new jobs where safe.
- **A previously resolved incident recurs:** Reopen or link the incident, preserve the former diagnosis, and re-evaluate whether the fix actually generalized.

### 28.5 Organization and reporting cases

- **The only workflow owner leaves:** Organization admin must assign a replacement; new approvals for that workflow pause until ownership is restored.
- **The user loses authorization to view source evidence:** Summary metadata may remain visible if permitted, but the source itself is unavailable and cannot be exported by that user.
- **A reporting cohort is too small to preserve privacy:** Suppress or aggregate the metric according to organization policy.
- **No baseline exists for time savings:** Show that financial/time savings cannot yet be estimated reliably.
- **A workflow is archived while scheduled jobs exist:** Require cancellation or reassignment of the schedule; do not continue using an archived agent by default.
- **The organization deactivates Oryn:** Stop new agent jobs and capture, present offboarding consequences, and follow retention obligations.

---
## 29. Specific Trigger, Consent, and Default Behavior Rules

This section makes defaults explicit where earlier feature descriptions describe the general behavior. These rules are product defaults for v1.0; organizational security policy may be stricter, but ordinary users cannot weaken mandatory restrictions.

### 29.1 Workflow repetition trigger

The personal companion may suggest a reusable workflow when it identifies at least three substantially similar completed task executions during a 30-minute window. It can also propose a workflow from a longer history of repeated observations when the evidence is adequate. The first such suggestion reads **Repeated work detected — review workflow candidate**. The suggestion does not claim that an agent is ready, does not launch a job, and must not interrupt a high-consequence active transaction. The employee can dismiss it for that workflow for 30 days or turn off repetition suggestions. In retention-off mode (`personal_history_retention=false`), all supporting facts expire after 30 seconds; repetition suggestions are available only if three valid completed instances finish within that surviving 30-second window, and dismissal lasts only as long as the ephemeral session can be identified.
### 29.2 Friction and peer-fix trigger

A contextual error suggestion may appear when a permitted business application presents a recognizable failure state with an approved matching resolution. As a secondary signal, Oryn may identify a likely need for help when an eligible workflow step remains unresolved for at least 35 seconds or when the user navigates back and forth between a work application and permitted help material at least four times in 60 seconds. In retention-off mode, the 35-second unresolved-step detector is unavailable because volatile observations expire after 30 seconds. These signals are processed for immediate contextual help only; they do not become individual productivity measurements, persistent employee stall histories, or manager-facing metrics. The HUD must not repeatedly offer help based on the same ignored friction signal during the same task.
### 29.3 Context matching and uncertainty

A contextual recommendation must be associated with a known approved work context, a sufficiently specific business situation, and a permission-compatible action. If the context is ambiguous, Oryn may show a passive **Possible related guidance** result, but cannot offer a one-click mutation or assert that the suggested fix definitely applies. If multiple guides may be relevant, the employee chooses the correct workflow from clearly distinguished options.

### 29.4 HUD frequency and suppression

At most one proactive expanded card appears at a time. No more than one noncritical proactive interruption should be generated for the same workflow instance unless a new material error, policy change, or confirmed commitment becomes relevant. Dismissing a card hides that suggestion for the current task; **Snooze 1 Hour** suppresses that category for one hour; **Mute Category** turns off the category until the employee changes the preference. Critical safety warnings affecting a pending operation are never suppressed by ordinary recommendation settings. When retention is off, observation-derived suppression states expire with their evidence after 30 seconds; explicit employee category preferences remain preserved in shell settings.
### 29.5 Meeting transcript review

After a permitted meeting recording, the employee sees a private transcript and a suggested action-summary view. Speakers are initially identified as **You**, **Speaker 2**, **Speaker 3**, and so on when identifiable; speaker labels are session-local turn attributions and no person is assigned a real-world identity or permanent voiceprint solely from acoustic characteristics. The employee can assign names, correct transcript wording, split or merge incorrectly separated speaker turns, remove private segments, and delete the recording. Suggested commitments remain unconfirmed until accepted. Where audio is too unclear, Oryn displays **Unable to Transcribe Reliably** rather than inventing exact wording.

### 29.6 Default reminders

Confirmed commitments with an explicit deadline produce a reminder defaulting to 09:00 on the due date in the employee's selected working time zone, unless the employee has set an earlier reminder or custom time. Commitments with no due date remain in the unresolved commitment list but do not acquire an invented deadline. A contextual reminder may appear earlier when a relevant customer/project record is opened. Dismissal, snooze, completion, and cancellation are separate actions and states.

### 29.7 Evaluation and approval defaults

All new agents start as Draft and at Stage 0 or 1. All production write abilities are off until explicit authorization. Agent candidates default to **Supervised** rather than Autonomous, even if simulated test results are strong. Material changes require fresh evaluation. A workflow owner must approve release; security approval is additionally required for permission expansions. Stage 5 automatic repair release is off by default, even for eligible low-risk changes, until separately enabled at organization and workflow levels.

### 29.8 Incident response defaults

A critical safety incident immediately restricts affected agent actions and notifies the incident owner and security admin. A high-severity business-correctness incident pauses affected write operations. A medium incident pauses the case and may allow unrelated independent cases to proceed. A low incident creates a review item without unnecessarily stopping unaffected work. If severity or impact cannot be determined and an unauthorized consequential action is plausible, treat the event as Critical until investigated.

### 29.9 Default report transparency

Every reported improvement estimate shows its sample period, sample size, baseline assumptions, excluded wait time if known, unknown outcomes, and whether any labor savings have actually been realized. No default report claims a fixed percentage reduction in headcount, ramp time, errors, or labor cost.

### 29.10 Default ownership and timing

All workflow candidates and new incidents must have a named responsible team. If no qualified individual owner exists, the item is **Unassigned — Owner Required** and cannot advance to final release approval. All times shown to users use the viewer's chosen time zone and specify time zone on externally shared approvals, due dates, and reports where cross-region ambiguity is possible.

---

## 30. Accessibility, Copy, States, and Experience Quality

### 30.1 Accessibility

All management controls must be usable without a pointing device, must have visible focus indication, and must communicate status through text as well as color. Review dialogs must make the currently selected affected records and approval consequences accessible. The HUD must not prevent access to the underlying application's critical controls. Where guided highlighting is unavailable, a textual guide remains usable.

### 30.2 Language and regional scope

The v1.0 product interface, guided instructions, generated review labels, and help content are provided in English. Business data and documents may contain other languages, but Oryn must disclose when a particular input language cannot be reliably interpreted and must not claim multilingual correctness without workflow-specific validation. Dates, monetary values, and currency must retain source meaning, and currency conversions must not be silently performed. When amounts use different currencies, matching or conversion follows an explicitly approved business rule or escalates.

### 30.3 Empty-state conventions

- **No workflows found:** Explain that discovery needs authorized examples and offer to start a permitted pilot or create a manual candidate.
- **No agents:** Link to eligible published playbooks; do not imply an empty organization has been automatically mapped.
- **No incidents:** State that no open incidents are currently recorded, not that automation is guaranteed error-free.
- **No test results:** Prompt evaluation and explain why the agent cannot be released.
- **No data for ROI:** State **Not Enough Verified Data** and identify what is missing.
- **No permission:** Explain the missing capability and whom to contact, without leaking restricted object contents.
- **No source evidence:** Mark the assertion unverified and restrict actions that require that evidence.

### 30.4 Error-state conventions

Every error message must say: what failed; what was and was not changed; whether work is safe to retry; the next possible action; and who should be contacted if the user cannot resolve it. Oryn must not use an unexplained success-looking screen after a failed or indeterminate transaction.

### 30.5 User confirmation language

Consequential controls use explicit verbs such as **Approve 3 Changes**, **Submit Draft Invoice**, **Pause Agent**, **Reject Proposal**, and **Restore Previous Agent Version**, rather than ambiguous labels like **Continue** or **OK**. If a user authorizes a batch action, the control displays the number of eligible items and identifies any excluded exceptions.

### 30.6 Business explanation quality

Agent explanations must be understandable to an operator without model or software-engineering expertise. Technical diagnostics may be included in a secondary evidence view, but the main explanation should state the business condition, observed discrepancy, and safe next step. Speculative causes use language such as **Possible cause** until verified.

### 30.7 Support and feedback

From any playbook, guidance session, case, test, incident, or agent page, authorized users can report **Incorrect Guidance**, **Wrong Result**, **Missing Exception**, **Privacy Concern**, or **Other Problem**. The report is linked to its relevant object and routed to the responsible owner; a privacy concern is routed to the security administrator. Reporting a serious concern must not require attaching private raw media.

---

## 31. Release Acceptance Criteria for v1.0

The following are minimum end-to-end product acceptance checks. Each must be demonstrated in a controlled organization with synthetic or expressly authorized business records. A feature is not accepted because a static screen resembles the intended UI; its relevant state transitions, permissions, and results must behave as described.

### 31.1 Organization and privacy

| ID | Acceptance criterion |
|---|---|
| ORY-001 | An organization admin can create a workspace, invite a user, assign a role, and revoke that role; access changes take effect for future privileged actions. |
| ORY-002 | A new employee sees and accepts the applicable notice before any visual observation begins. |
| ORY-003 | The desktop companion always distinguishes active observation, user pause, policy pause, and excluded application status. |
| ORY-004 | User-initiated pause prevents new capture until an intentional resume action. |
| ORY-005 | Mandatory excluded applications and private windows contribute no captured content to personal history or shared workflows. |
| ORY-006 | A manager cannot view or request another employee's raw screen or audio timeline through Oryn. |
| ORY-007 | An employee can review sanitized workflow content before approving an organizational contribution. |
| ORY-008 | Meeting recording is off by default and cannot begin without per-meeting user confirmation and required notice/consent acknowledgment. |
| ORY-009 | Raw local capture expires on the applicable retention schedule without appearing in central organization dashboards. |
| ORY-010 | Employees can view their capture settings, exclusions, shared contributions, and consent history in My Privacy. |

### 31.2 Workflow learning and guidance

| ID | Acceptance criterion |
|---|---|
| ORY-011 | Three similar permitted task instances can generate a candidate rather than an automatically published playbook. |
| ORY-012 | A candidate identifies objective, main steps, inputs, applications, suspected outputs, and missing evidence. |
| ORY-013 | A reviewer can correct the workflow objective, decision branches, scope, and steps before publication. |
| ORY-014 | An owner can reject a candidate, and rejected content never appears as approved peer guidance. |
| ORY-015 | A verified playbook can be published to a permitted team while unauthorized users cannot open restricted details. |
| ORY-016 | The Operations Map shows an approved workflow, its owner, rules, exceptions, application relationships, and related agent. |
| ORY-017 | A policy conflict is displayed as unresolved and blocks automatic execution of the affected branch. |
| ORY-018 | An employee can search for a known error and find a published peer resolution with provenance. |
| ORY-019 | Contextual guidance points to the correct next business step and does not silently advance after a failed action. |
| ORY-020 | An employee can snooze, mute, or dismiss noncritical suggestions without disabling essential safety warnings. |
| ORY-021 | A confirmed commitment can produce a contextual reminder; an unconfirmed meeting suggestion cannot automatically update a CRM. |

### 31.3 Agent Factory and policy

| ID | Acceptance criterion |
|---|---|
| ORY-022 | An authorized builder can create an agent candidate from an approved playbook without granting production write access. |
| ORY-023 | The candidate exposes objective, inputs, outputs, business rules, allowed actions, forbidden actions, scope, owner, risk, and verification requirements. |
| ORY-024 | Missing business rules or outcomes are flagged and prevent release at an incompatible autonomy level. |
| ORY-025 | A builder can edit a candidate, and material edits invalidate previously granted evaluation readiness. |
| ORY-026 | A Tier 3 action triggers item-level human approval before its consequential commit. |
| ORY-027 | A Tier 4 action is unavailable to agents regardless of the historical human demonstration. |
| ORY-028 | An agent cannot access additional applications or record populations outside its approved scope. |
| ORY-029 | A permissions expansion requires an appropriate new authorization rather than being included silently in an agent repair. |
| ORY-030 | Only eligible versions and approval scopes can advance to Stage 3, 4, or 5 under the documented gates. |

### 31.4 Flight Simulator

| ID | Acceptance criterion |
|---|---|
| ORY-031 | A reviewer can generate, edit, accept, and reject scenarios with defined starting states and expected outcomes. |
| ORY-032 | A suite includes normal, edge, failure, and policy-restriction cases as required by the target stage. |
| ORY-033 | Evaluations identify passed, failed, inconclusive, not-run, and expected-safe-escalation cases separately. |
| ORY-034 | A case that completes visible steps but fails required business postconditions is scored as a failure. |
| ORY-035 | A mandatory policy violation or failed business invariant blocks passing readiness even if all other cases pass. |
| ORY-036 | A reviewer can open failed-case replay and inspect observed-versus-expected differences and evidence availability. |
| ORY-037 | A reviewer can compare two versions on equivalent scenarios and identify new passes and regressions. |
| ORY-038 | An incomplete test or absent expected outcome cannot be counted as a pass. |
| ORY-039 | Evaluation results are associated with the exact reviewed agent and scenario-suite versions. |

### 31.5 Jobs and correctness

| ID | Acceptance criterion |
|---|---|
| ORY-040 | An operator can select a precise eligible queue and see the scope and expected effects before starting a job. |
| ORY-041 | Preflight blocks execution when agent scope, role, required input, or critical permissions are invalid. |
| ORY-042 | A batch can show verified successes, expected exceptions, and unresolved cases without falsely reporting all items successful. |
| ORY-043 | A submitted but unverified consequential action is not marked Verified Complete. |
| ORY-044 | An uncertain external submission is held to prevent blind duplicate retry. |
| ORY-045 | The operator can stop future actions and see which effects already occurred and which cases remain. |
| ORY-046 | A scheduled job respects its declared scope and does not silently start an overlapping run by default. |
| ORY-047 | Every consequential approval presents actual proposed changes, evidence, and the approver's authority context. |
| ORY-048 | A role without approval authority cannot approve a consequential change by initiating an agent job. |

### 31.6 Incidents, learning, and repair

| ID | Acceptance criterion |
|---|---|
| ORY-049 | A failed verification or important unexpected state creates an incident with agent, case, severity, and evidence links. |
| ORY-050 | The incident distinguishes observed facts from a suspected root cause. |
| ORY-051 | A Critical incident stops affected operations and notifies appropriate owners and security reviewers. |
| ORY-052 | An authorized expert can explain a correction without automatically making it an authoritative company policy. |
| ORY-053 | An owner can approve, reject, or request more evidence for a proposed exception rule. |
| ORY-054 | A correction can produce a proposed agent patch and at least one linked regression scenario. |
| ORY-055 | A candidate repair that fixes its target but creates a critical regression cannot be released. |
| ORY-056 | An approved repair can roll out to a restricted cohort with visible test evidence and monitoring status. |
| ORY-057 | Restoring a previous agent version does not claim to undo business changes already committed. |
| ORY-058 | Only narrowly preauthorized Tier 0/1 Stage 5 changes can be automatically released; all other changes await required approval. |
| ORY-059 | Repeated failures can be grouped without obscuring the affected case list or independent evidence. |

### 31.7 Reporting, collaboration, and governance

| ID | Acceptance criterion |
|---|---|
| ORY-060 | Home changes content according to the viewer's role and does not expose restricted records. |
| ORY-061 | The Operations Map connects a workflow, affected policy, agent, evaluation, incident, and change version. |
| ORY-062 | Authorized users can create, assign, and complete an inter-team handoff with a verified downstream status. |
| ORY-063 | Reports distinguish verified success, partial success, unknown outcomes, and estimated time avoidance. |
| ORY-064 | A manager cannot generate individual active-time, idle-time, attendance, or ranking reports. |
| ORY-065 | A 14-day pilot can generate an Operational X-Ray report with scope, sample caveats, discovered workflows, exceptions, and recommended next steps. |
| ORY-066 | An authorized export includes scope, period, methodology, privacy restrictions, and uncertainty labels. |
| ORY-067 | Material workflow or agent changes require an explicit reviewable version diff and recorded decision. |
| ORY-068 | A security policy change identifies affected capabilities and prevents prohibited new actions. |
| ORY-069 | An organization can deactivate future capture and new agent jobs through a controlled offboarding flow. |
| ORY-070 | Every meaningful approval, release, permission change, consequential action, and incident intervention produces an audit record. |

### 31.8 Required demonstration scenarios before release

The release review must demonstrate the following uninterrupted journeys in a realistic customer-like environment: human workflow observation to approved playbook; playbook to agent candidate; agent to complete evaluation and supervised job; batch with mixed successful and exceptional cases; novel document-format failure to incident; expert correction to proposed rule and repair; regression testing; approval and limited rollout; version restore after a deliberately introduced regression; and employee pause/exclusion with confirmed privacy boundaries. Every journey must include at least one negative or failure branch, not only a success path.

### 31.9 Cloud inference acceptance

| ID | Acceptance criterion |
|---|---|
| ORY-071 | Every Oryn-owned v1.0 AI operation routes through the governed LiteLLM path; no local inference or direct-provider fallback executes. |
| ORY-072 | Private capture inference requires purpose-bound organization authorization and employee cloud-processing notice; publication still requires separate review. |
| ORY-073 | Unauthorized content persistence, training, body logging, caching, or unverified retention terms blocks the affected inference route. |
| ORY-074 | Every operation pins an approved US-processing provider/model/route/policy binding; disallowed region or provider fallback is rejected. |
| ORY-075 | Unsupported provider modalities, schemas, live transports, or diarization capabilities are reported unavailable rather than claimed or silently substituted. |
| ORY-076 | Offline recording is explicit, uses no local AI, and cannot upload retained audio after reconnection without fresh authorization and current policy checks. |

---

## 32. Product Readiness and v1.0 Exit Criteria

### 32.1 Release-blocking conditions

Oryn v1.0 must not be declared ready if any of the following remain true:

- Employees can be recorded without clear enrollment and recording-state notice.
- Mandatory sensitive applications or excluded windows can leak into shared knowledge.
- Organization roles allow managers to browse private raw employee captures.
- The product can claim agent success without the required business-outcome verification.
- A restricted action can be performed through an approved agent despite its declared risk policy.
- A failed or inconclusive mandatory simulator test can be represented as a passing release gate.
- A material agent modification can silently affect production without the required approval or explicitly authorized narrow Stage 5 exception.
- Incident containment cannot stop new affected actions.
- The product can blindly retry an uncertain external submission and duplicate business effects.
- There is no visible agent/version-to-job accountability or traceable audit for consequential actions.
- The core end-to-end repair workflow requires hidden manual intervention that is presented to customers as fully automated.
- Any Oryn-owned AI inference executes locally on-device or attempts direct-provider egress bypassing LiteLLM.
- Private capture data is transmitted to an inference route lacking verified US processing or contractual zero content retention.
- Offline-recorded meeting audio is automatically uploaded upon reconnection without explicit employee authorization.
- An unsupported model modality, transport, schema, or diarization failure is silently disguised as complete or substituted.
- The product has not passed the v1.0 acceptance cases listed in Section 31 for supported feature scopes.

### 32.2 Expected quality of a release candidate

A release candidate must let a new authorized customer understand enrollment, privacy, workflow review, agent readiness, execution, incidents, and approvals without requiring engineering staff to explain basic product states. Every major action has a clear success, blocked, partial, failed, and cancel outcome. Important business-impact estimates disclose assumptions. Product copy must not promise that all workflows are automatable or that the system never makes mistakes.

### 32.3 v1.0 launch narrative

Oryn should launch around one concrete and demonstrable claim: **The platform can learn a permitted operational procedure, turn it into a governed agent, prove its behavior in representative scenarios, and improve the agent after an exception with human-backed evidence and verified regression tests.** This is the core experience every adjacent feature must support.

### 32.4 Customer-facing success criteria

The product should be evaluated by whether customers can find reusable knowledge they previously lacked; reduce repeated expert interruptions; deploy a narrowly scoped useful agent; trust the reported outcome of every business case; recover from previously unseen but supported exceptions more quickly; understand exactly why a proposed repair is safe to try; and govern all of this without using the product as an employee surveillance system.

---

## 33. Future Directions — Explicitly Not v1.0 Requirements

These are promising later capabilities and should not be silently assumed to exist in the first release:

- Universal legacy-desktop-application-to-API or MCP tool generation as an independently sold product.
- Full organizational process simulation and counterfactual business planning.
- Autonomous optimization that eliminates whole departments' redundant processes without owner approval.
- Organization-wide autonomous orchestration of hundreds of interdependent agents.
- Cross-customer federated learning of proprietary business procedures.
- Automatic release of policy-changing or consequential repairs.
- Unsupervised negotiation, purchasing, bank transfers, payroll, or access administration.
- Comprehensive support for remote desktops and visually inaccessible legacy interfaces.
- Native mobile employee capture and execution.
- Multilingual interface and independently validated support for all document languages.
- Predictive staffing, revenue forecasting, or financial planning based solely on observed screen activity.
- On-device and local-only AI inference (e.g. local Whisper speech models, on-device SLMs, embedded local vector databases); all v1.0 AI inference is cloud-managed via LiteLLM.

Oryn may later expand into these areas, but the v1.0 product must be successful without any of them.

---

## 34. Final Product Definition

Oryn v1.0 is a **privacy-conscious operational knowledge and agent lifecycle platform**. It turns permitted real-world demonstrations into reviewed playbooks; uses those playbooks to guide people and generate scoped automation agents; tests agents against business-correct outcomes; manages authorized execution and approvals; diagnoses failures; incorporates expert corrections as proposed knowledge; evaluates repairs; and deploys controlled improvements with a verifiable history.

Its core product design commitments are:

1. **Observe work without surveilling workers.**
2. **Preserve the distinction between observed behavior and approved policy.**
3. **Treat verified business outcomes as more important than successful clicks.**
4. **Make every agent's scope, decisions, tests, and owner visible.**
5. **Escalate uncertainty rather than inventing authority or correctness.**
6. **Turn failures and expert corrections into reviewed, reusable improvements.**
7. **Test before deployment and re-test after every material change.**
8. **Give humans clear control over consequential actions and release decisions.**
9. **Maintain a living, evidence-backed record of operational capabilities.**
10. **Demonstrate measurable workflow reliability and value without making unsupported promises.**

**End of Oryn PRODUCT.md v1.0.**
