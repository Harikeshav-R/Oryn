# Oryn Domain Glossary

The core domain terminology and boundary definitions for the Oryn platform, establishing shared language across product and engineering.

## Language

**Desktop Shell**:
The employee-facing local host application that manages Oryn windows, persistent status presentation, and user controls on employee workstations.
_Avoid_: Client agent, desktop daemon, native wrapper

**HUD**:
The nonintrusive contextual guidance surface that displays active task steps, peer resolutions, and highlight cues directly alongside employee work.
_Avoid_: Overlay manager, tooltip engine, assistant popup

**Background Observation**:
The permitted, policy-compliant observation of approved work applications that continues while the main desktop shell window is dismissed or closed.
_Avoid_: Headless capture, silent recording, stealth monitoring

**My Privacy**:
The employee-facing trust center view that displays active capture settings, excluded applications, data retention schedules, consent history, and deletion controls.
_Avoid_: Privacy dashboard, telemetry settings, user audit log

**Observation Surface**:
A specific application window or document context that can be independently permitted or excluded from work observation.
_Avoid_: Capture target, watched window

**Observation Gap**:
A known interval or portion of permitted work for which reliable evidence is unavailable; missing actions remain unknown.
_Avoid_: Reconstructed activity, assumed step

**Observation Capability**:
The declared kinds and limits of work evidence available for a particular application and platform; it grants no authority to observe or execute.
_Avoid_: Automation support, blanket compatibility

**Browser Work Context**:
An approved business account and page context within a browser application that may independently qualify for observation or assistance.
_Avoid_: Allowed website, browser session

**Reserved Execution Tab**:
An employee-visible browser workspace temporarily reserved for one authorized automation, distinct from the employee's ordinary browsing.
_Avoid_: Hidden worker tab, background bot session

**Cloud Inference**:
Processing authorized information with an approved remote AI model for a defined purpose. Its output is an inference, not permission to publish knowledge or perform a business action.
_Avoid_: local AI, automatic approval

**Inference Authorization**:
Permission for a bounded purpose and scope of information to be processed by approved AI services. It does not grant organizational publication or business-action authority.
_Avoid_: sharing consent, execution approval

**Meeting Session**:
One employee-authorized meeting evidence and review context. It does not authorize recording a subsequent call.
_Avoid_: always-on recording, calendar consent

**Confirmed Commitment**:
An obligation whose interpretation an employee has explicitly reviewed and saved. Confirmation alone does not create organizational authority or another person's acceptance.
_Avoid_: approved policy, automatic assignment

**Speaker Label**:
A meeting-scoped attribution label that may be uncertain. It is not a biometric identity or a cross-meeting voice profile.
_Avoid_: voice identity, voiceprint

**Offline Recording**:
Explicitly authorized local acquisition without AI processing. Later cloud processing requires a separate affirmative authorization.
_Avoid_: offline AI, automatic backfill

**Reviewed Contribution**:
Sanitized content an employee explicitly approves for a named organizational purpose and audience, including approved purpose-bound still-image derivatives. Processing private content with an AI service does not make it a reviewed contribution.
_Avoid_: inference output, raw upload

**Delivery Receipt**:
A record that the intended organizational destination accepted a reviewed contribution; it does not prove publication, business correctness, or acceptance of an obligation.
_Avoid_: Publication receipt, outcome verdict

**Contribution Withdrawal**:
An employee request to stop use of a shared contribution; unpublished use stops immediately while published knowledge and retained records follow governed removal rules.
_Avoid_: Local deletion, guaranteed global erasure

**Guidance Working Set**:
Published guidance currently retained for authorized local use within declared capacity; it is not all available organizational knowledge.
_Avoid_: Complete company cache, offline knowledge mirror

**Private Evidence**:
Employee-local captured material and private supporting records, distinct from a Reviewed Contribution or organizational evidence.
_Avoid_: Local log, central recording, employee audit trace

**Retention Deadline**:
The latest permitted lifetime of private source material under its applicable setting; a legal hold does not extend it.
_Avoid_: Hold expiration, archive date, storage timeout

**Legal Hold**:
A disclosed restriction on voluntary deletion of eligible retained material; not permission for new capture or longer raw retention.
_Avoid_: Preservation order, mandatory capture, retention extension

**Redacted Excerpt**:
A separately reviewed sanitized artifact for a named purpose and audience, not access to a private original.
_Avoid_: Raw screenshot, playback clip, unmasked excerpt

**Purge Receipt**:
A record stating the outcome and scope of completed eligible local destruction; not proof that external copies or published knowledge disappeared.
_Avoid_: Global erasure proof, backup purge certificate

**Task Instance**:
One employee attempt to achieve a business objective, distinct from the reusable workflow describing that objective.
_Avoid_: Workflow instance, employee activity session

**Demonstration**:
A sanitized, employee-approved record of one observed Task Instance submitted for procedural discovery; it represents evidence of how work was performed, not an approved organizational standard.
_Avoid_: Playbook, automated macro, training trace

**Workflow Candidate**:
A proposed reusable procedure synthesized from multiple concordant demonstrations or authored as a manual draft; it remains an unapproved suggestion until explicit domain owner approval.
_Avoid_: Published playbook, approved standard, active workflow

**Workflow Variant**:
An alternative procedural path achieving the same verifiable business outcome under documented conditions. A suggested variant reflects observed variations without owner endorsement; an approved legitimate variant is explicitly accepted by an authorized domain owner as compliant with enterprise policy.
_Avoid_: Procedural error, ad-hoc detour, loose branch

**Observed Complete**:
An observation where an employee completed the final step of a task without observed observation gaps or unhandled exceptions; it indicates behavioral completion, not verification of real-world business outcomes.
_Avoid_: Verified outcome, successful transaction, verified state

**Outcome Verified**:
An evidenced postcondition confirmation that a task achieved its intended business effect, substantiated by independent business-system records or an authorized reviewer's signed assessment.
_Avoid_: Self-reported success, employee assertion, assumed outcome

**Reconsideration Request**:
An owner-gated review proposal triggered by material new evidence for a previously rejected workflow concept; it does not revive the rejected candidate revision or grant publication authority.
_Avoid_: Automatic appeal, candidate un-rejection, un-suppression

**Task Hypothesis**:
An unconfirmed interpretation of which task an employee may be performing and where its boundaries lie.
_Avoid_: Confirmed task, execution authority

**Guidance Session**:
An employee-directed traversal of one published playbook version; step acknowledgment does not establish a verified business outcome.
_Avoid_: Agent job, automatic execution

**Assist Plan**:
An approved bounded sequence of permitted actions attached to a playbook, with declared prerequisites and stopping points.
_Avoid_: Recorded macro, inferred permission

**Assist Session**:
One employee-initiated attempt to run an approved assist plan for a defined work item.
_Avoid_: Background job, blanket approval

**Membership**:
A person's organization-specific participation and status. Membership in one organization grants no rights in another.
_Avoid_: Account, login

**Role Assignment**:
A scoped grant of a named organizational responsibility and its permitted capabilities.
_Avoid_: Blanket access, identity claim

**Approval Delegation**:
Explicit authority for a person to approve defined business operations within stated limits.
_Avoid_: Job-start permission, managerial seniority

**Approval Proposal**:
The exact business change and evidence presented for a human decision.
_Avoid_: Agent intent, blanket consent

**Action Authorization**:
Permission for one defined execution attempt within current policy and scope. It is not proof of submission or a correct outcome.
_Avoid_: Successful job, inference authorization

**Emergency Administrator**:
A customer-designated identity with narrow authority to restore identity administration. It does not gain business-action or private-evidence authority.
_Avoid_: Superuser, universal bypass

**Operation**:
A tracked request for work, representing transport and progress status; it is not proof that business work completed or succeeded.
_Avoid_: Job, task result

**Domain Event**:
A committed organizational fact published once database transactions succeed; it conveys notification of state change, not authority to act.
_Avoid_: Command trigger, authority grant

**Submission Custody**:
Organizational acceptance of a reviewed contribution into cloud intake; it establishes custodial tracking, not publication or current content availability.
_Avoid_: Publication, intake cache

**Inference Reservation**:
Bounded permission to consume a portion of an organization's configured inference allowance for an admitted request; it is an encumbrance, not confirmed actual cost.
_Avoid_: Spend invoice, guaranteed charge

**Operational Capability**:
A distinct, reusable organizational workflow objective and scope governed within a tenant.
_Avoid_: Playbook copy, workflow umbrella, automation script

**Capability Version**:
An immutable, approved specification of a capability's procedure, variants, governing rules, inputs, postconditions, audience, and provenance.
_Avoid_: Draft iteration, editable procedure, generic template

**Playbook Version**:
An approved, human-facing publication of a procedure bound to exactly one capability version for guidance delivery.
_Avoid_: Parallel procedure authority, unofficial runbook, editable guide

**Business Rule Version**:
An immutable, approved statement of organizational policy, scope, and effective interval, optionally paired with a formalized condition or decision table.
_Avoid_: Runtime permission, code snippet, informal convention

**Knowledge Conflict**:
A recorded unresolved incompatibility between approved knowledge assets or a credible material reported policy contradiction.
_Avoid_: Semantic similarity, vector distance, informal dispute

**Handoff**:
An accountable inter-team operational obligation linking a source workflow state to a required downstream recipient state and verification condition.
_Avoid_: Transport receipt, private commitment, task notification

**Dependency Manifest**:
An immutable, ordered declaration of the complete transitive operational knowledge assets required by a consumer.
_Avoid_: Partial import list, runtime cache, package manifest

**Previous-Policy Continuation**:
An explicit, approved grant permitting named consumers to continue operating under a superseded rule version for a bounded interval.
_Avoid_: Indefinite grace period, implicit grandfathering, blanket exemption

**Agent Candidate**:
Proposed executable behavior, declared dependencies, and structural bindings for an automated workflow; it confers no production authority or execution permission.
_Avoid_: Production agent, released automation, executable authority

**Agent Version**:
Immutable executable behavior and its declared dependencies; evaluation and release records refer to the version separately.
_Avoid_: Mutable draft, working branch, rolling release

**Execution Qualification**:
The verified structural and prerequisite readiness of an agent candidate for a stated execution mode; it establishes neither business correctness nor permission to deploy.
_Avoid_: Evaluation passage, release approval, deployment certificate

**Application Capability**:
Declared supported interactions and limitations for a business application, distinct from an Operational Capability and from permission to act.
_Avoid_: Blanket compatibility, business workflow

**Application Connection**:
An approved binding to an external account, environment, and execution identity with a defined resource scope; it is not the credential itself.
_Avoid_: API key, browser session

**Adapter Pack**:
A reviewed set of application-specific operation definitions and supported interactions; it grants no customer access or execution authority.
_Avoid_: Universal connector, customer plugin

**Operation Qualification**:
Evidence-backed confirmation that a declared operation is supported in a particular application configuration and execution mode; it is not an agent release.
_Avoid_: Deployment approval, blanket application certification

**Exclusive Target Scope**:
A customer-enforced resource scope that excludes conflicting writers for a defined period; an Oryn-only reservation does not establish it.
_Avoid_: Local mutex, best-effort lock

**Submission Receipt**:
A record describing whether an operation may have reached an external application; it does not establish a correct business outcome.
_Avoid_: Success verdict, completed case

**Readback Evidence**:
Independently acquired application state used to assess business postconditions, distinct from a submission acknowledgment or verdict.
_Avoid_: Response echo, agent self-report

**Execution Assignment**:
Bounded responsibility to continue one case under a fixed agent version and declared scope. It does not itself authorize a business action.
_Avoid_: Blanket permission, job launch

**Execution Checkpoint**:
A recorded continuation point and necessary case context that preserve completed effects without treating them as permission to repeat work.
_Avoid_: Rollback snapshot, success receipt

**Reconciliation**:
An evidence-backed determination of what happened after an uncertain business action, used to decide safe next work. It does not itself authorize another action.
_Avoid_: Automatic retry, assumed rollback

**Job**:
One confirmed or approved scheduled request to execute a fixed agent version against a defined population.
_Avoid_: Task runner, pipeline, batch script

**Case**:
One business item within a Job, retaining its own progress, outcomes, and execution history.
_Avoid_: Record row, loop iteration, worker thread

**Work Queue**:
An approved source and selection rule for eligible business items; not an execution assignment or transport queue.
_Avoid_: Message queue, dispatch buffer, broker topic

**Schedule**:
An owner-approved recurring, timed, or event-driven rule with bounded scope and an accountable execution sponsor; not blanket action approval.
_Avoid_: Cron job, background timer, periodic daemon

**Schedule Occurrence**:
One intended triggering of a Schedule, including a recorded skipped or missed triggering.
_Avoid_: Scheduled task, event pulse, tick

**Execution Sponsor**:
The named person whose current job-execution remit supports a Schedule; not its action approver by default.
_Avoid_: Schedule owner, system account, bot principal

**Frozen Population**:
The exact confirmed membership of a Job; later source changes do not add replacement items.
_Avoid_: Dynamic queue, auto-refill batch, rolling query

**Continuation Execution**:
A linked attempt to perform proven-safe remaining work for a Case; not a replay of prior effects.
_Avoid_: Automatic retry, replay, loopback


