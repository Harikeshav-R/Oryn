# AGENTS.md

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context documentation layout (`GLOSSARY.md` and `docs/adr/`). See `docs/agents/domain.md`.

## AI inference baseline

All Oryn-owned v1.0 AI inference uses cloud-managed APIs through Oryn's LiteLLM gateway. Local/on-device inference is post-v1.0.

For architecture, implementation, debugging, or planning that involves AI, read `docs/architecture/cloud-inference.md` and apply its provider-capability, US-processing, consent, retention, and route-pinning rules.

Keep deterministic capture, exclusions, masking, validation, exact matching, and private evidence storage local; local processing does not imply local AI.
