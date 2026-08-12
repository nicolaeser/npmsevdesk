# Repository AI Context

This is the only always-loaded project entry point. Before work begins, the exhaustive
[context index](SUMMARY.md) must be inspected, and only documents whose activation conditions match
the task may be loaded.
This is agent-only context. `README.md` is the only human-facing package document. `.ai/` is the
integration and repository context for agents and must stay self-contained.

## Conduct and change discipline

- The user's authorized scope must be followed exactly. A read, diagnosis, or documentation task
  must not be broadened into an implementation change.
- Commits must not be created unless the user explicitly requests one.
- Unrelated files and existing user changes must be preserved and must not be discarded, rewritten,
  or cleaned up as a side effect.
- The current implementation must be inspected before adding a pattern, abstraction, library, or
  dependency. Existing project conventions and the source that owns the behavior should be
  preferred.
- Changes must remain focused. Generated outputs must not be modified by hand; the owning input or
  generator described by the applicable Instruction must be used.
- Secrets, tokens, customer data, accounting data, and other sensitive business data must not be
  exposed in source, fixtures, logs, diagnostics, or reports.
- Repository work must not be claimed or disclosed as assisted or generated in commits, pull
  requests, changelogs, documentation, or code comments unless explicitly requested.
- `Co-authored-by`, generated-by, assistant-attribution, and similar trailers must not be added.
  Legitimate product-domain references to external assistants, machine-readable product content,
  or related functionality remain allowed when relevant to this repository.

## Authority and conflicts

Explicit task and safety constraints take precedence. This file supplies universal repository
rules; applicable Instructions are mandatory within their domains. Playbooks and Personas may add
procedure or scrutiny but must not override this file or an Instruction. For implementation facts,
enforced configuration and current code take precedence over explanatory documentation. If a
material conflict remains unresolved, work must stop and the user must be asked rather than a
choice being made silently.

## Compact task routing

- For tasks involving public exports, OpenAPI generation, raw or curated APIs, models, enums,
  references, lookups, builders, examples, invoice numbers, customer numbers, or official
  type codes such as `RE`,
  [SDK development](instructions/sdk-development.md) must be loaded, and
  [tenant identifiers](knowledge/tenant-identifiers.md) must also be loaded when those
  identifiers are in scope.
- For application migrations from direct sevdesk HTTP calls or another client to this package,
  [SDK development](instructions/sdk-development.md) and
  [sevdesk integration safety](instructions/sevdesk-integration-safety.md) must be loaded, and
  [taxation](instructions/taxation.md) must also be loaded when documents carry tax.
- For tasks involving transport, authentication, logging, errors, retries, remote mutations,
  workflows, recovery, document state changes, or live tests,
  [sevdesk integration safety](instructions/sevdesk-integration-safety.md) must be loaded.
- For tasks involving VAT, tax rules or rates, evidence, bookkeeping profiles, ReceiptGuidance, or
  tax-bearing documents, [taxation](instructions/taxation.md) must be loaded.
- For implementation, tests, generation, builds, compatibility, packaging, CI, or release work,
  [quality and testing](instructions/quality-testing.md) must be loaded.
- [AI context governance](AI.md) must be read only when modifying the `.ai/` system itself.
- [STYLE.md](STYLE.md) must always be loaded for UI, design, responsive, interaction, motion, or
  accessibility work; it records that this package currently has no visual UI system.

The following context-selection sequence must be used:

1. The task and affected domains must be classified.
2. [SUMMARY.md](SUMMARY.md) must be inspected for relevant existing documents.
3. Applicable Knowledge and all mandatory domain Instructions must be loaded.
4. A Playbook may be selected only when its repository-specific procedure closely matches the task.
5. A Persona may be applied when its distinct review method, decision priorities, or expected
   output add useful scrutiny; related Instructions remain authoritative and do not make the
   Persona redundant.
6. `STYLE.md` must always be loaded for UI, design, responsive, interaction, motion, or
   accessibility work.
7. The user must be asked about extending `.ai/` if a reusable context gap remains.
8. Validation and change-impact checks must be applied before completion.

A Persona must not be required for every task. During ordinary project work, if no existing `.ai/`
document covers a reusable context need, the user must be asked whether the system should be
extended; it must not be extended without explicit approval unless context maintenance is itself
the task.

## Completion

Work must be verified with the repository's actual checks in proportion to risk. The final change
set must be inspected to confirm that only authorized files changed; reports must distinguish checks
that ran from checks that could not run and identify remaining risks without claiming unperformed
validation.
