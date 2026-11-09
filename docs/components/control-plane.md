# Control Plane API and Domain Coordination Component Brief

Status: Baseline brief — detailed design pending

## Purpose and ownership

**Source references:** [TECHNICAL.md §§5.1, 7](../../TECHNICAL.md) | [PRODUCT.md §§6, 16, 22, 25; ORY-001, ORY-041, ORY-060, ORY-070](../../PRODUCT.md)

### Core Responsibility
The Control Plane API and Domain Coordination component provides a unified, secure organization-scoped entry point for web clients, desktop companions, background workers, and external integrations, coordinating domain state transitions and publishing committed domain events.

### Owns
- API-level session authentication, request validation, and routing across organizational domain services.
- Domain-level command orchestration, transactional boundary management, and distributed consistency.
- Host and operation of logical modules `InferenceAdmission` and `InferenceSessionCoordinator` under Contract 22 (see [cloud-inference](../architecture/cloud-inference.md)).
- Publishing verified domain events to the message broker once database commits succeed.
- Webhook management and external event ingress validation.
### Consumes
- Authenticated client requests from [command-center-analytics](command-center-analytics.md), [desktop-shell](desktop-shell.md), and [contribution-sync](contribution-sync.md).
- Domain command execution results from [operational-graph](operational-graph.md), [job-orchestration](job-orchestration.md), and [release-governance](release-governance.md).
- Policy decisions from [identity-policy](identity-policy.md).

### Produces
- Scoped API responses and error structures delivered to frontend and desktop clients.
- Durable domain commands routed to specific internal subsystem handlers.
- Validated and governed inference dispatch via the LiteLLM gateway, returning typed `InferenceResult` structures.
- Emitted asynchronous domain events (e.g., `workflow.published`, `job.completed`) broadcast to subscribers.
- Central system audit event streams (strictly excluding private capture payloads and raw model prompts/completions).
### Does Not Own
- Direct OS or browser observation capture (owned by employee edge components).
- Executing application UI actions or holding production external system credentials (owned by [application-adapters](application-adapters.md)).
- Granting ambient permissions to bypass tenant boundaries (owned by [identity-policy](identity-policy.md)).

### Boundary Requirement
The Control Plane API is a structured gateway to authoritative domain owners, not an excuse to implement domain logic or state mutations directly in API endpoint controllers. API controllers validate requests and route to domain owners. Events are emitted strictly after transaction commits.

## Product requirements

### Key Product Requirements ([PRODUCT.md §§6, 16, 22, 25; ORY-001, ORY-041, ORY-060, ORY-070](../../PRODUCT.md))
- **Workspace Administration Routing:** Routes workspace, user, and role management commands to identity policy (ORY-001).
- **Preflight Coordination:** Coordinates preflight validation before job initiation, verifying scopes and required inputs (ORY-041).
- **Role-Scoped Projections:** Enforces role-based query scoping for all Command Center views, ensuring unauthorized users cannot access restricted details (ORY-060).
- **System-Wide Audit Logging:** Guarantees that every state-changing API request produces an immutable audit record (ORY-070).

## Upstream and downstream contracts

**Catalog reference:** [Cross-Component Contracts Catalog](../architecture/contracts/README.md)

### Cross-Component Contracts
- **Communication Patterns Reference in [Contracts Catalog](../architecture/contracts/README.md):** Implements synchronous request/response handling and event publishing per §7.1.
- **Contract Reference #18 in [Contracts Catalog](../architecture/contracts/README.md):** Delivers authorized read models and notifications to [command-center-analytics](command-center-analytics.md).
- **Contract Reference #22 in [Contracts Catalog](../architecture/contracts/README.md):** Operates `InferenceAdmission` (validating `InferenceAuthorization` tokens, route limits, schemas) and `InferenceSessionCoordinator` (managing active stream lifetimes and cancellations) via [cloud-inference](../architecture/cloud-inference.md).
- **Domain Event Bus:** Emits organization-scoped events (`workflow.candidate_created`, `job.requested`, `incident.created`) following the event taxonomy in §7.4.
## Trust and deployment boundaries

### Process and Security Boundaries
- **Deployment Location:** Cloud-hosted, modular backend service deployed behind reverse proxies and Web Application Firewalls (WAF).
- **Session Authentication:** Validates JWT/bearer session tokens issued by the identity provider on every request.
- **Tenant Scope Enforcement:** Resolves tenant context from authenticated tokens; strictly prevents cross-tenant data leakage at the API layer.

## Internal architecture

### Logical Submodules
- **API Gateway and Router:** Handles HTTP/REST and gRPC routing, request decoding, and rate limiting.
- **Authentication and Session Interceptor:** Validates authentication tokens, extracts user/organization context, and attaches security context.
- **InferenceAdmission & InferenceSessionCoordinator:** Evaluates incoming `InferenceRequest` envelopes against signed `InferenceAuthorization` tokens, checks route limits, manages transient sessions, dispatches calls to the LiteLLM gateway, and routes stream events without durable content persistence.
- **Domain Command Dispatcher:** Routes commands to owning domain services with transaction boundary coordination.
- **Outbox Event Publisher:** Transactionally records domain events in an outbox table and publishes them reliably to the message broker.
## State and lifecycle

### State and Persistence
- **Persisted State:** Manages client sessions, API rate-limit state, idempotency keys, and transactional outbox tables in the central relational database.
- **Lifecycle Transitions:** Coordinates domain state transitions across dependent modules using transactional boundaries.
- **Idempotency:** Client mutation commands require client-provided idempotency keys; duplicate submissions return the original committed response.

## Error and edge-case behavior

### Failure Handling
- **Downstream Domain Service Hang:** Applies strict timeouts and circuit breakers, returning standardized 504/503 responses without hanging frontend connections.
- **Validation Failures:** Returns structured, RFC-7807 compliant problem details detailing exact field validation errors.
- **Outbox Publisher Crash:** Upon restart, the outbox worker resumes publishing uncommitted events from durable storage.

## Observability and audit

### Telemetry and Diagnostics
- Emits distributed tracing spans (OpenTelemetry) linking client requests to downstream service executions.
- Comprehensive audit logging recording caller IP, user ID, tenant ID, action, and result status (ORY-070).

## Security and threat model

### Security and Safety Considerations
- **Broken Object-Level Authorization (BOLA):** Every entity fetch verifies that the requested object belongs to the caller's authorized tenant and team.
- **Denial of Service (DoS):** Implements tiered rate limiting per tenant and per IP address.
- **Injection Attacks:** SQL parameters and input schemas are strictly validated using strongly typed schemas before reaching domain services.

## Test strategy

### Acceptance and Verification Scenarios
- **Acceptance Criteria References:** [PRODUCT.md §31.1: ORY-001; §31.5: ORY-041; §31.7: ORY-060, ORY-070](../../PRODUCT.md).
- **Concrete Verification Scenario:**
  - *Input/Condition:* A client attempts to start an agent job with missing required input parameters.
  - *Expected Observable Result:* The control plane preflight validation detects the missing input, rejects the command with a 400 Bad Request describing the missing fields, prevents job creation, and logs an audit failure event.

## Performance and operations

### Operational Characteristics ([TECHNICAL.md §12](../../TECHNICAL.md))
- Sub-100ms API response latency for cached read models.
- High-throughput asynchronous event publishing via outbox pattern.
- Graceful degradation under traffic spikes via backpressure signaling.

## Architecture decisions and open questions

### Specific Preserved Implementation Questions
- What API architecture (GraphQL, gRPC-web, or REST/OpenAPI) provides the best developer experience and type safety?
- What message broker (Kafka, RabbitMQ, or cloud-managed queues) should back the asynchronous domain event bus?
- How should the transactional outbox pattern be implemented to guarantee at-least-once event delivery?
- How should background job coordination be partitioned across modular control-plane instances?

### Handoff Questions ([TECHNICAL.md §14.2](../../TECHNICAL.md))
1. *Owns exclusively:* API session validation, request routing, domain command dispatching, and outbox event publishing.
2. *Data ingress/egress:* Ingests authenticated user/worker commands; emits domain events and structured API responses.
3. *Versions/identities:* API schema version, tenant ID, user session ID, and trace correlation ID.
4. *Upstream failure:* If the message broker is unavailable, outbox stores events in the relational database until restored.
5. *Authority:* The control plane delegates business authority to owning domain services ([operational-graph](operational-graph.md), [identity-policy](identity-policy.md)).
6. *Testing without private details:* Tested via comprehensive API contract tests and synthetic mock payloads.
7. *Audit and duplicate prevention:* Idempotency keys prevent duplicate command execution across network retries.
8. *Failure blast radius:* Control plane degradation affects user-facing management; does not halt running local observers.
9. *v1.0 criteria:* Enables ORY-001, ORY-041, ORY-060, and ORY-070 verified through API lifecycle and audit tests.
