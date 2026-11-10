# Reviewed Still-Image Sharing, Artifact Governance, and Deletion Race Boundaries

**Status:** accepted  
**Date:** 2026-11-09  
**Deciders:** User-Approved Architecture Session  
**Authority:** Technical Architecture & Security Engineering  
**Amends:** [ADR-0001](0001-desktop-runtime-and-presentation.md), [ADR-0002](0002-desktop-capture-lifecycle.md), [ADR-0005](0005-cloud-inference-and-private-evidence.md), [ADR-0007](0007-private-evidence-storage-and-retention.md)  
**Amended by:** [ADR-0010](0010-contribution-delivery-and-guidance-sync.md)  
**Normative Specification:** [docs/components/local-privacy-storage.md](../components/local-privacy-storage.md)

---

## Context

Oryn enables employees to share approved procedural demonstrations as candidate organizational workflows ([PRODUCT.md §§4.1, 4.4, 25.5](../../PRODUCT.md)). Procedural documentation is significantly more comprehensible when accompanied by visual illustrations of relevant UI buttons, forms, and dialog states.

However, sharing visual artifacts introduces serious privacy and governance risks:
1. **Raw Media Egress Ambiguity:** Product rules state that "raw media egress is prohibited". This rule protects employees against remote manager surveillance, but must not prevent an employee from voluntarily sharing an intentionally cropped, masked, and reviewed still image illustrating a specific task step.
2. **Exfiltration via Screenshot Attachments:** Unconstrained screenshot attachments could be used to exfiltrate full-desktop captures, adjacent personal windows, or massive batches of image data.
3. **Independent Retention Lifecycles:** Private raw evidence expires after 7 days (or 1–14 days as configured). If shared procedural playbooks automatically disappeared when the underlying raw screenshot expired, organizational knowledge would suffer arbitrary disruption.
4. **Deletion vs. Upload Network Races:** An employee might delete their private local evidence while a previously approved workflow contribution is sitting in an offline synchronization queue or actively crossing the network wire.

## Decision

1. **Separately Reviewed Purpose-Bound Still-Image Derivatives:**
   - Voluntary contributions may include purpose-bound redacted still images (`RedactedStillImageArtifact`) alongside sanitized step text.
   - An approved still image is a distinct, derivative artifact: cropped to the relevant interaction surface, masked over sensitive fields, stripped of all EXIF/system metadata, and re-encoded as a standalone PNG.
   - **Strict Constraints:**
     - Maximum resolution: 1920×1080 pixels.
     - Maximum encoded size: 1,048,576 bytes (1 MiB) per image.
     - Maximum count: At most four still images per workflow contribution.
   - **Prohibitions:** Full-motion video recordings, screen playback clips, unrestricted screenshot batches, and meeting audio recordings remain **strictly prohibited** from organizational sharing.
2. **Signed Artifact Policy and Independent Retention:**
   - Image publication requires an active, valid `SignedArtifactPolicy` issued by `identity-policy`, specifying approved organizational purposes, authorized audience groups, and maximum artifact retention limits (up to 365 days).
   - If an artifact policy is missing or expired, text-only contribution review remains available, but image attachments are rejected with `PRIVACY_ARTIFACT_POLICY_REQUIRED`.
   - Shared artifact lifetime is independent of the private raw capture retention deadline: when underlying raw private evidence expires or is selectively purged, previously delivered organizational playbooks and their reviewed image derivatives remain governed by the organizational knowledge lifecycle.
3. **Helper Review Attestation vs. Contribution Sync Gateway Ownership:**
   - The privacy helper (`oryn-privacy-helper`) exclusively owns the review approval boundary, constructs the `ReviewedContributionV1` payload, signs the Ed25519 review attestation (`rcpt_review_<id>`), and establishes an authoritative local `ReleaseFence`.
   - The contribution gateway (`contribution-sync`) verifies the review attestation, manages the encrypted offline queue, handles TLS 1.3 network transport, and emits network delivery receipts (`delivery_receipt_id`). It cannot manufacture employee approval.
4. **Truthful Deletion and Upload Race Semantics:**
   - **Queued Deletion Race:** If an employee deletes private evidence while a contribution referencing that evidence is queued offline in `contribution-sync`, the privacy helper's local `ReleaseFence` transitions immediately to `cancelled`. The sync gateway drops the queued upload idempotently upon checking the fence; zero bytes leave the endpoint.
   - **In-Flight Upload Race:** Dispatched network transmissions cannot participate in an atomic two-phase commit with local disk deletion. When deletion occurs while an upload is in-flight:
     - The helper marks the local delivery projection as `delivery_unknown`.
     - Local private storage purges the source evidence and keys immediately and permanently.
     - Upon receiving the network response, the helper reconciles state using the contribution ID without re-uploading or querying the deleted source.
     - If the upload succeeded prior to network abort, the UI marks the contribution as `withdrawal_requested` and exposes the separate organizational contribution withdrawal flow to the employee.

## Rationale and Alternatives

- *Alternative Considered: Allowing Short Video/GIF Clips:* Rejected for v1.0. Video and animated clips exponentially increase the probability of capturing background application state, temporary notification popups, adjacent monitor contents, and unmasked password entry. Redacted still images with opaque masks provide sufficient procedural clarity with minimal privacy exposure.
- *Alternative Considered: Cascading Deletion of Published Knowledge:* Rejected. Automatically deleting published organizational playbooks whenever an employee's private 7-day raw retention expires would destroy operational playbooks and disrupt enterprise workflows. The employee's explicit review and attestation creates a legally and architecturally distinct organizational asset.
- *Alternative Considered: Blocking Local Deletion Until Network Delivery Completes:* Rejected. An employee's right to immediately purge private data from their device cannot be blocked by network latency, captive portals, or server outages. Local deletion always takes immediate precedence, with asynchronous network reconciliation.

## Consequences

- Procedural playbooks can include clear, high-quality visual steps without violating employee privacy or exposing unredacted desktop contexts.
- The boundary between raw media (strictly local, short-lived, unshared) and reviewed excerpts (sanitized, signed, purpose-bound, separate lifecycle) is concrete and enforceable.
- Deletion races are handled truthfully without silent data resurrection or stalled local purges.
