# Oryn Demo Prototype Discussion Summary

## Goal

Create a three-minute Oryn demo video that looks like a real product.

The requested demo may use hard-coded data and behavior. Product components do not need real backends, integrations, inference, automation, or persistence. The prototype must still look product-real and show the full product lifecycle.

## Repository findings

The Oryn repository is currently documentation and contract material, not an implemented product.

Evidence:

- `PRODUCT.md` defines the v1.0 customer experience.
- `TECHNICAL.md` defines the architecture and lifecycle.
- `docs/components/` contains 21 component specifications.
- `docs/architecture/contracts/` contains JSON schemas, fixtures, and an OpenAPI contract.
- No product UI source, frontend application, executable component, or branded media asset exists.
- The documentation explicitly says component briefs do not imply implementation or release readiness.

Core product lifecycle:

```text
Observe → Understand → Review → Publish → Compile → Simulate → Authorize → Execute → Verify → Diagnose → Correct → Repair → Re-evaluate → Release
```

Core launch claim from `PRODUCT.md`:

> The platform can learn a permitted operational procedure, turn it into a governed agent, prove its behavior in representative scenarios, and improve the agent after an exception with human-backed evidence and verified regression tests.

## Feasibility

A hard-coded clickable prototype is highly feasible.

| Scope | Feasibility |
|---|---:|
| Hard-coded UI states | 9/10 |
| Clickable scripted prototype | 9/10 |
| HyperFrames deterministic video | 9/10 |
| Showing the complete lifecycle | 8/10 |
| Showing every product feature deeply in 180 seconds | 3/10 |
| Real backend or production behavior | 0/10 |

The prototype preview can be functional. The final MP4 cannot be interactive; it replays deterministic state transitions.

## Recommended implementation

Build a standalone prototype under:

```text
demo/oryn-prototype/
```

Use plain TypeScript, HTML, and CSS. Avoid backend work and large framework setup.

Build one hard-coded state machine:

```text
enrollment
observation
meeting_review
candidate_review
playbook_published
agent_draft
simulation_running
simulation_failed
job_running
approval_required
incident_open
correction_captured
repair_testing
limited_release
```

Use one fixed synthetic story: invoice-versus-purchase-order reconciliation.

## Synthetic data set

Use data matching the documented reference journey:

- Three observed demonstrations.
- One approved playbook.
- One generated agent candidate.
- Passing and failing simulator scenarios.
- Eleven invoice cases.
- Seven verified successes.
- Two missing-purchase-order exceptions.
- One approval-required case.
- One outcome-unknown case.
- One supplier document-format incident.
- One expert correction.
- One bounded repair proposal.
- One regression suite.
- One limited rollout.

The documented journey is in `PRODUCT.md:1116-1183`.

## Required shared shell

Build these once and reuse them everywhere:

- Left navigation.
- Organization and role selector.
- Top bar.
- Notifications.
- Global search.
- Breadcrumbs.
- Status badges.
- Tables.
- Evidence drawer.
- Approval drawer.
- Activity timeline.
- Toasts.
- Loading, blocked, failed, unknown, and success states.
- Desktop HUD overlay.
- Synthetic-data indicator.

Use exact Oryn terminology and distinguish status with text, not color alone.

## Required UI surfaces

| Surface | Required behavior |
|---|---|
| Enrollment and My Privacy | Accept notice, enable observation, show exclusions |
| Desktop companion | Pause observation, show excluded window, resume |
| Meeting review | Confirm commitment, edit deadline, create reminder |
| Workflow candidate | Review three demonstrations, inspect evidence, approve |
| Playbook | View steps, rules, exceptions, owner, verification status |
| Operations Map | Select workflow, rule, agent, incident relationships |
| Agent Factory | Create candidate, define scope, risk, inputs, outcomes |
| Flight Simulator | Run evaluation, show passes, failure, and safe escalation |
| Jobs | Start invoice batch, show mixed case outcomes |
| Approval drawer | Inspect before/after values and approve one consequential action |
| Incident Center | Contain incident, inspect expected-versus-actual behavior |
| Correction and Repair | Answer expert question, run regression tests, approve rollout |
| Insights/Home | Show verified outcomes, exceptions, incidents, and release state |

Combine Home, Insights, Operations Map, Notifications, and Settings into the shared shell when time is limited.

## Recommended video route

```text
Privacy setup
→ Observe invoice work
→ Detect repeated workflow
→ Review candidate
→ Publish playbook
→ Create agent
→ Simulate agent
→ Run supervised batch
→ Approve consequential case
→ Detect incident
→ Teach correction
→ Test repair
→ Release limited cohort
```

Suggested timing:

| Time | Beat |
|---:|---|
| 0–15s | Employee sees repeated invoice work |
| 15–32s | Consent, exclusions, and privacy controls |
| 32–50s | Observation and meeting commitment capture |
| 50–72s | Three examples become a workflow candidate |
| 72–94s | Owner reviews rules, evidence, and playbook |
| 94–116s | Agent candidate and permission scope |
| 116–138s | Simulator passes, failure, and safe escalation |
| 138–154s | Supervised batch with mixed results |
| 154–174s | Incident, correction, repair, and regression tests |
| 174–180s | Limited release and end card |

## Do not build

- Authentication.
- Backend services.
- Database persistence.
- Real browser extension.
- OCR.
- Audio capture.
- Cloud inference.
- Real integrations.
- Agent runtime.
- Real permission enforcement.
- Real simulator environments.
- Production analytics calculations.
- Multi-user behavior.

## Product-real requirements

- Keep one invoice record moving across screens.
- Show evidence, owners, versions, permissions, and uncertainty.
- Show `Outcome Unknown`; do not show universal success.
- Show `Passed — Expected Safe Escalation`.
- Show approval before consequential actions.
- Show containment before repair.
- Use consistent shell, spacing, typography, and status colors.
- Use visible cursor movement and clicks in the film.
- Use real logo and font assets if available.
- Mark synthetic records as synthetic.
- Avoid invented claims, unsupported metrics, and fake live telemetry.

The repository has no product UI or brand assets. Supply those assets or use provisional assets consistently.

## HyperFrames plan

Use the prototype UI as the visual source, then create deterministic HyperFrames scenes.

Requirements:

- One scene per major workflow beat.
- Timeline-controlled state changes.
- No API calls, timers, random values, or live data.
- Transitions caused by visible clicks.
- Preview the clickable prototype separately.
- Render the fixed replay as MP4.
- Run `npx hyperframes check --json` before rendering.
- Preview the project before final rendering.

HyperFrames environment checks passed for Node, Chrome, FFmpeg, and FFprobe. Cloud usage was unknown because no subscription login was present. Optional local narration, transcription, and music tools were absent. Docker was installed but not running.

## Key constraint

HyperFrames launch guidance prefers real product UI and rejects invented UI presented as existing functionality. Because Oryn has no implemented UI, frame this as a **functional product prototype** or **proposed v1.0 prototype**, not as a production implementation.

## Estimated effort

Inference based on current repository state:

- Rough clickable prototype: 1–2 days.
- Polished clickable prototype plus three-minute scripted video: 3–5 days.
- High-fidelity prototype with supplied branding and captured screens: 1–2 weeks.

## Next step

Create the prototype shell, fixed invoice data, shared components, and state machine first. Then build each required surface only along the scripted route. Add HyperFrames scenes after the clickable path has no dead ends.
