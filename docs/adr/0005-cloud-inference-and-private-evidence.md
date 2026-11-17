# Governed Cloud Inference and Private Evidence Architecture

**Status:** accepted  
**Date:** 2026-11-10  
**Deciders:** Technical Architecture, Security Engineering, Product Engineering  
**Authority:** Technical Architecture & Security Policy  
**Amends:** [ADR-0001](0001-desktop-runtime-and-presentation.md), [ADR-0003](0003-native-observation-admission-and-isolation.md)  
**Normative Specification:** [docs/architecture/cloud-inference.md](../architecture/cloud-inference.md)

---

## Context

Oryn requires artificial intelligence models for speech-to-text transcription, speaker turn attribution, commitment extraction, screen vision extraction (OCR), workflow synthesis, agent IR generation, diagnostic reasoning, and semantic knowledge retrieval. 

Prior early architecture briefs explored on-device / local-only inference runtimes (e.g., Apple SpeechAnalyzer, Whisper on-device, llama.cpp, local ONNX embeddings). However, enterprise operational reality presents severe constraints:
1. **Hardware Heterogeneity & Quality:** Certified speech transcription and large multimodal reasoning models require significant GPU and memory resources. On-device local models on enterprise employee laptops (standard 16 GB RAM baseline) introduce prohibitive thermal, battery, and compute contention with active work applications, while exhibiting substantially higher transcription word error rates and hallucinated task extractions.
2. **Auditability and Key Governance:** Distributing model API keys or allowing unmediated client-side model calls exposes enterprise credentials and prevents centralized usage tracking, budget enforcement, and policy gating.
3. **Enterprise Compliance Requirements:** Customers require verifiable zero content retention (ZDR), contractual prohibitions against model training on enterprise data, strict United States geographic data confinement, and cryptographic proof of inference authorization.

## Decision

1. **Cloud-Only v1.0 AI Baseline:** All Oryn-owned AI model inference in v1.0 uses cloud-managed APIs routed exclusively through an Oryn-operated LiteLLM Proxy gateway. No local on-device inference runtime (Whisper, ONNX, llama.cpp, SpeechAnalyzer) is deployed or executed in v1.0. Optional on-device inference is explicitly deferred to post-v1.0 roadmaps.
2. **Deterministic Edge Processing Preserved:** All capture mechanics, audio resampling, window geometry, occlusion calculation, exclusion filtering, protected-field masking, regex/structural secret removal, exact text matching, cache reads, and private evidence storage remain strictly local and deterministic on the employee endpoint.
3. **Gateway Ingress & Authorization (Contract 22):** The control plane hosts `InferenceAdmission` and `InferenceSessionCoordinator`. Edge clients (via the Privacy Helper `InferenceEgressClient`) submit typed `InferenceRequest` envelopes accompanied by cryptographically signed, short-lived `InferenceAuthorization` tokens issued by `identity-policy`.
4. **Strict Route Pinning & Policy Gates:** LiteLLM automatic cross-provider fallback, traffic mirroring, and dynamic client routing are disabled. Every route is pinned by provider, model deployment revision, route revision, and policy lease. A provider failure fails closed (`INFERENCE_UPSTREAM_UNAVAILABLE`).
5. **Contractual ZDR and US Confinement:** Every admitted route must have an active Enterprise Zero Data Retention (ZDR) agreement, prohibition of training on customer content, and verified United States data confinement for ingress, computation, and all content-bearing subprocessors.
6. **Transient Gateway Hardening:** The LiteLLM deployment enforces `turn_off_message_logging: true`, `disable_spend_logs: true`, `disable_error_logs: true`, and disables prompt/completion caching. Upload spooling is restricted to RAM disks (`tmpfs`) with swap disabled and immediate unlinking upon completion or failure.

## Rationale and Alternatives

- *Alternative Considered: Local-First Whisper & ONNX on Endpoint:* Rejected for v1.0. High CPU/RAM footprint (>4 GB RAM reservation for reliable models), high error rates on low-end hardware, inability to support multimodal vision extraction consistently across macOS and Windows, and risk of endpoint performance degradation.
- *Alternative Considered: Direct Client-to-Provider Connections:* Rejected. Distributing provider API keys to client endpoints or letting clients connect directly to external endpoints creates significant credential leakage risks, prevents centralized budget enforcement, and circumvents audit controls.
- *Selected Architecture: Governed LiteLLM Gateway:* Provides unified schema adaptation, vault-backed secret isolation, centralized budget enforcement, and verifiable compliance controls without baking specific vendor implementations into client applications.

## Consequences

- The desktop companion and privacy helper remain lightweight native systems processes with low CPU and memory footprints.
- All AI capabilities (speech transcription, commitment extraction, visual extraction) require active network connectivity and cloud inference admission; offline operation provides local deterministic capture and cached guidance only, reporting AI features as unavailable.
- Enterprise customers can configure diverse upstream providers (Bedrock, Azure, OpenRouter) through operator-configured LiteLLM routes without modifying desktop binaries, provided the routes satisfy contractual ZDR and US processing requirements.
- Raw employee screen frames and audio remain stored durably only on the local device; cloud inference processing is strictly transient and creates no persistent cloud archives.
