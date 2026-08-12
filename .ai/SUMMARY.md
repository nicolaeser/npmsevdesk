# AI Context Index

This is the exhaustive index of active `.ai/` Markdown context; load entries only when their
stated activation matches the task.

## Core

- [BASE.md](BASE.md) — Defines universal conduct, safety, precedence, compact routing, and
  completion expectations and must be loaded before every repository task.
- [AI.md](AI.md) — Governs the context system and must be loaded only when auditing or modifying
  `.ai/`, root adapters, or legacy instruction and style surfaces.
- [STYLE.md](STYLE.md) — Defines the repository's no-UI presentation contract and must be loaded
  for documentation presentation or any UI, design, responsive, interaction, motion, or
  accessibility work.

## Knowledge

- [known-limitations.md](knowledge/known-limitations.md) — Records verified unresolved repository
  gaps and must be loaded for package validation or release work, or low-level VAT-evidence
  decisions.
- [sdk-surface.md](knowledge/sdk-surface.md) — Maps the public client layers and naming and must
  be loaded when adopting the package or choosing between curated, lookup, tax, and raw calls.
- [tenant-identifiers.md](knowledge/tenant-identifiers.md) — Separates official document-class
  codes from tenant-assigned numbers and headings and must be loaded when invoice
  numbers, customer numbers, number ranges, or values such as `RE` and `INV` appear.

## Instructions

- [quality-testing.md](instructions/quality-testing.md) — Defines mandatory validation and test
  discipline and must be loaded for implementation, tests, examples, generation, builds,
  compatibility, packaging, CI, or releases.
- [sdk-development.md](instructions/sdk-development.md) — Defines mandatory raw, curated,
  generated, and public SDK contracts and must be loaded when developing or adopting APIs,
  OpenAPI resources, models, migration paths, or examples.
- [sevdesk-integration-safety.md](instructions/sevdesk-integration-safety.md) — Defines mandatory
  transport, sensitive-data, retry, mutation, and recovery safeguards and must be loaded for
  sevdesk integration or state-changing work.
- [taxation.md](instructions/taxation.md) — Defines mandatory tax-selection, VAT-evidence, rate,
  and tenant-representation rules and must be loaded for tax-bearing implementation or integration
  work.

## Personas

- [api-contract-reviewer.md](personas/api-contract-reviewer.md) — Defines the wire-to-public-API
  compatibility review method and must be loaded when that lens is applied to OpenAPI, generated,
  runtime, type, or compatibility changes.
- [application-security-reviewer.md](personas/application-security-reviewer.md) — Defines the
  credential and business-data trust-flow review method and must be loaded when that lens is
  applied to transport, diagnostics, uploads, live tests, or sensitive data paths.
- [delivery-reliability-reviewer.md](personas/delivery-reliability-reviewer.md) — Defines the
  source-to-registry readiness review method and must be loaded when that lens is applied to
  builds, declarations, exports, CI, tarballs, tags, or publishing.
- [remote-write-safety-reviewer.md](personas/remote-write-safety-reviewer.md) — Defines the
  mutation-ledger and ambiguity-recovery review method and must be loaded when that lens is applied
  to remote writes or multi-request workflows.
- [tax-decision-reviewer.md](personas/tax-decision-reviewer.md) — Defines the tax evidence-to-wire
  decision review method and must be loaded when that lens is applied to VAT treatment, evidence,
  rates, profiles, or tax-bearing payloads.
