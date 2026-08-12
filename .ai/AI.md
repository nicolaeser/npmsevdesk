# AI Context System Governance

This manual applies only when auditing or modifying `.ai/`, the root adapters, or a tracked legacy
instruction/style surface. It is not ordinary implementation context.

The `.ai/` tree is agent-only repository context and is published with the package. The only
human-facing package document is `README.md`. Active context must cite implementation, tests,
examples, and enforced configuration rather than a second prose documentation tree.

## Purpose and authority

The mandatory core is:

- `BASE.md`: the concise, always-loaded conduct, safety, precedence, and routing entry point.
- `AI.md`: governance for creating, changing, auditing, and retiring context.
- `STYLE.md`: the authoritative visual, interaction, responsive, motion, and accessibility contract,
  including an explicit no-UI scope when applicable.
- `SUMMARY.md`: the exhaustive discovery index for every other active `.ai/` Markdown document.

Optional categories have distinct authority:

- **Knowledge** records verified terminology, system facts, decisions, current limitations, and
  durable experience. It describes what is true and cites non-obvious evidence.
- **Instructions** define persistent mandatory rules for stable, broad engineering domains.
- **Playbooks** define repeatable repository procedures with validation and a definition of done.
- **Personas** provide optional specialist review methods, decision priorities, checklists, and
  expected outputs that apply authoritative rules without duplicating them.

`BASE.md` and applicable Instructions are mandatory. A Playbook or Persona must not override them.
Canonical implementation and enforced configuration own runtime facts; `.ai/` routes and applies
those sources rather than replacing them.

## Evidence gate

An optional document may be created or retained only when all of these conditions hold:

1. It has a distinct activation condition likely to recur in repository work.
2. One authoritative enforced source or multiple consistent current sources support it.
3. It materially improves implementation, review, debugging, or operational reliability.
4. Its authoritative content is not already covered adequately by an active `.ai/` document or a
   canonical repository source.
5. It can remain concise, actionable, and repository-specific without generic filler.

For a Persona, condition 4 applies to its specialist review method and expected output, not to the
underlying rules. Related Instructions and Playbooks are expected and do not make a Persona
redundant. No category or file count is a quality target, and empty category directories or
placeholder documents must not be created.

## Naming and document form

- Active context must be written in concise professional English. Commands, identifiers, paths, and
  product terms must be preserved when translation would change them.
- Optional documents must use lowercase kebab-case filenames and normal relative Markdown links
  inside `.ai/`. `@path` imports must be reserved for the root `CLAUDE.md` adapter.
- **Must**, **must not**, **should**, and **may** must be used consistently. Mandatory rules must be
  separated from recommendations and examples.
- Implementation evidence must cite repository-root paths in backticks. Links to canonical sources
  should be preferred over copied code or large inventories.
- Active context must not include empty headings, speculative history, private machine paths,
  credentials, personal data, generic best practices, or motivational prose.
- Instructions must use stable broad engineering domains and must not represent individual pages,
  routes, endpoints, features, or components. They require frontmatter with `type: instruction`, an
  activation-focused `description`, and `scope: repository`.
- Playbooks require `type: playbook` frontmatter plus use conditions, required context,
  prerequisites, ordered procedure, impact analysis, validation, recovery where applicable, and a
  definition of done.
- Personas require `type: persona` frontmatter plus use conditions, mission, responsibilities,
  priorities, review checklist, boundaries, required context, and expected output characteristics.

## Routing and orphan prevention

- `BASE.md` must remain compact and link prominently to `SUMMARY.md`; it must not reproduce the
  exhaustive catalog.
- `SUMMARY.md` must list every other active `.ai/` Markdown document exactly once, grouped by
  category, with a valid relative link and exactly one concise sentence stating both purpose and
  activation.
- Every active document except `SUMMARY.md` must have one catalog entry and a meaningful inbound
  route. Circular reference-only chains must be avoided.
- Instructions and Personas should link to related canonical sources and one another only with an
  activation phrase. Every inbound and outbound link must be updated when a document moves, is
  renamed, merged, split, or removed.
- Files under `.ai/.backup/` are historical recovery artifacts. They must be excluded from
  `SUMMARY.md`, routing, activation, orphan analysis, and ordinary loading.

## Creating, changing, and retiring documents

1. Current implementation, configuration, tests, documentation, and every active `.ai/` document
   must be audited before a change is proposed.
2. The evidence gate must be applied, and each fact, rule, procedure, or review method must have an
   exact owner and activation condition.
3. An existing document must be updated when its activation and ownership still fit; a document may
   be added only for a distinct need.
4. Documents that normally load together and overlap must be merged; a split may occur only when
   activation conditions are meaningfully different.
5. Each rule or fact must have one authoritative home and link elsewhere. Generic filler, stale
   claims, duplicate authority, and broken routing must be removed.
6. Still-valid content must be preserved before a document is removed or replaced, and
   `SUMMARY.md` must be updated in the same change.
7. Frontmatter, relative links, catalog completeness, activation wording, and authorized scope must
   be validated before completion.

After an architecture, compatibility, workflow, security, release, or domain decision changes,
the matching Instruction and Knowledge entries must be reviewed. Context should be updated only
when the changed fact is durable and materially useful; a one-off implementation must not be
promoted to a standard.

## Mandatory re-audit of an existing system

An audit must read every active `.ai/` document completely and inventory the actual tree. The tree
must be compared with `SUMMARY.md`, `BASE.md` routing, current domains, workflows, risks, and
sources of truth. Every document must be classified as **keep**, **update**, **merge**, **split**,
or **remove**, with evidence. The audit must check for stale claims, obsolete paths, broken links,
duplicate authority, generic filler, weak activation, missing evidence, routing drift, and orphaned
files. The same evidence gate must be applied to missing Knowledge, Instructions, Playbooks, and
Personas, and every approved gap must be closed. A previously approved system is not necessarily
complete.

## Conditional historical snapshots

Immediately before a substantive tracked root `AGENTS.md` or `CLAUDE.md` is replaced, its exact
bytes must be preserved as `.ai/.backup/AGENTS.md.original` or
`.ai/.backup/CLAUDE.md.original`. A tracked legacy `STYLEDOCS.md`, `STYLEDOCS.MD`, or equivalent
style contract must be archived under its original capitalization plus `.original` before it is
edited or removed. A legacy style contract must be the primary structural starting point for
`STYLE.md`, while every active rule must be verified against current implementation.

`.backup/` must not be created when there is no substantive source to preserve. An existing snapshot
must not be overwritten. If one exists, it must be compared with the current source, and any
difference must be reported; user direction is required before another version may be added.
Ignored, untracked, local, and personal instruction files must not be archived. Snapshots must
remain exact, inactive, retained for recovery, and excluded from all active routing. A normalized
active document must not replace the original snapshot.

## Tool-managed root blocks

Comment-delimited `BEGIN`/`END` regions must be treated as potentially externally managed:

1. The complete root file must be preserved in its exact snapshot before any change.
2. The owning package, generator, or framework must be identified from repository evidence.
3. Any requirement for the markers, wording, or original root path must be verified with the owner.
4. The block's still-valid semantic guidance must be migrated into the applicable active
   Instruction without claiming ownership of external wording.
5. If the owner requires the root location, the complete block must remain byte-for-byte after the
   minimal adapter line, and the semantic overlap must be documented as a compatibility exception.
6. If the owner does not require the root location, the active root copy must be removed after
   migration, and only the archived original may remain.
7. If ownership or location cannot be verified, the block must not be removed, rewritten,
   translated, normalized, or relocated; the evidence must be presented for user direction.

The default root adapters, when no verified block must remain, are exactly:

```text
Read and follow @.ai/BASE.md completely before doing any work.
```

for `AGENTS.md`, and:

```text
@.ai/BASE.md
```

for `CLAUDE.md`.

## Drift prevention and verification

- Claims must be reconciled with the source that owns them; verified product inconsistencies must
  be documented in Knowledge rather than changed in out-of-scope product code or documentation.
- Canonical procedures must remain canonical. A short activation route should be preferred to a
  duplicate Playbook.
- A Markdown link check and `git diff --check` must run when available. The final tree and diff must
  be inspected, snapshots must be verified byte-for-byte, and only authorized context surfaces may
  change.
- If Git metadata or required tooling is unavailable, the strongest non-destructive fallback must
  be used, and the limitation must be reported explicitly.
- A commit must not be created as part of context maintenance unless the user explicitly requests
  it.
