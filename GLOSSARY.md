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
