---
type: instruction
description: Governs validation; load for code, tests, examples, builds, packages, CI, or releases.
scope: repository
---

# Quality and testing

## Scope and activation

This Instruction must be loaded for every implementation change and whenever tests, examples,
generated artifacts, build output, public exports, compatibility policy, CI, or release preparation
are modified. [SDK development](sdk-development.md) must be used for API-layer rules.

## Mandatory rules

- Validation must be proportional to risk and must exercise the public or wire-visible behavior
  affected by the change. A bug fix must include a regression test at the narrowest stable layer.
- Source and test code must continue to pass the strict compiler settings in `tsconfig.json`,
  including `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
  `useUnknownInCatchVariables`, and `verbatimModuleSyntax`.
- Runtime tests in the default suite must be deterministic, use the repository's in-memory Axios
  adapters where transport is involved, make no live sevdesk requests, and require no API token.
- Compile-time contracts belong in `test/**/*.test-d.ts`; runtime behavior belongs in
  `test/**/*.test.ts`. Contributors must not assume `npm test` checks the type-only files:
  `npm run typecheck` does.
- Public usage example ownership must follow [SDK development](sdk-development.md); all affected
  examples must pass `npm run typecheck:examples`.
- OpenAPI-derived source in `src/types/openapi.ts`, `src/resources`, 
  `src/client/operation-catalog.ts`, and `src/enums/catalog.ts` is checked-in
  package source. Changes there must be reviewed as public API changes.
- Live tests are opt-in external operations, not a substitute for the deterministic suite. They
  must use a dedicated disposable tenant. Read-only runs require `SEVDESK_LIVE_API_TOKEN`.
  Writes also require a unique `SEVDESK_LIVE_MARKER` matching `npmsevdesk-live-*` (not
  `npmsevdesk-live-test`), `SEVDESK_LIVE_WRITE_CONFIRM=CREATE_AND_CLEAN_NPMSEVDESK_TEST_DRAFTS`,
  and the invoice contact/user/unity IDs. The voucher case additionally requires
  `SEVDESK_LIVE_VOUCHER_CONFIRM=LEAVE_MARKED_NPMSEVDESK_VOUCHER_DRAFT` and leaves a marked draft.
- Test fixtures, diagnostics, snapshots, and logs must not contain real tokens, tenant data,
  credentials, or production business data.
- A check must be reported as passing only when it was run successfully in the current workspace;
  otherwise report it as not run or blocked, with the reason.

## Architecture and dependency boundaries

- Default `npm test` runs `test/**/*.test.ts`. Opt-in live suites are
  `test/read-only.live.ts` and `test/write.live.ts`.
- `test/helpers.ts` is the canonical boundary-test support for capturing Axios request configs and
  returning typed fixtures. Transport tests should assert both serialized wire requests and the
  relevant `SevdeskResult` views.
- `examples/tsconfig.json` compiles public root-import examples against `src/index.ts` without
  executing them. Examples must remain copy-paste-oriented and must not become test-only fixtures.
- `tsup.config.ts` owns ESM/CommonJS runtime builds. `tsconfig.build.json` plus
  `.github/scripts/build-cjs-declarations.mjs` own the matching declaration trees.
- `.github/workflows/ci.yml` owns continuous-integration parity: exact dependency installation,
  the complete package checks, tarball inspection, and the Node compatibility matrix. Local
  validation should reproduce the relevant commands rather than encode a second policy.

## Compatibility requirements

- CI and release validation must use the repository-pinned npm 11.17.0; consumer compatibility
  must not fall below `package.json#engines.npm` (`>=11.5.1`). Reproducible automation must install
  the exact lockfile with `npm ci`.
- Test and build changes must preserve the runtime floor in `package.json#engines` and keep CI's
  exact Node.js 24.0.0 floor plus current Node.js 24 coverage aligned with it.
- Axios must remain the only runtime dependency unless an explicitly reviewed compatibility and
  release change updates the package contract and its enforced release verification.
- Build validation must cover ESM, CommonJS, ESM declarations, CommonJS declarations, declaration
  maps, and every public subpath declared by `package.json#exports`.
- `npm run verify:package` must validate exports as real ESM, CommonJS, and strict TypeScript
  consumers. Internal source imports are not sufficient evidence of package compatibility.
- Compatibility or packaging changes must follow SemVer: patch for a compatible fix, minor for a
  backward-compatible addition, major for a removed/renamed export, changed default, changed
  request/result contract, or dropped runtime.

## Sources of truth and canonical patterns

- Commands and composition: `package.json#scripts`.
- Compiler and declaration strictness: `tsconfig.json`, `tsconfig.build.json`, and
  `examples/tsconfig.json`.
- Runtime and live-test discovery: `package.json#scripts` (`test`, `test:live:read`,
  `test:live:write`).
- Runtime/package build shape: `tsup.config.ts`,
  `.github/scripts/build-cjs-declarations.mjs`, and
  `.github/scripts/verify-package-exports.mjs`.
- Enforced automation: `.github/workflows/ci.yml` and `.github/workflows/publish.yml`.
- Live-test entry points: `test/read-only.live.ts` and `test/write.live.ts`.
- Official OpenAPI reference: `openapi/sevdesk-official-2.0.0.yaml`.
- Release gates: `.github/scripts/verify-release.mjs` and `.github/workflows/publish.yml`.

Actual configuration and executable tests take precedence over narrative inventories.
[Known limitations](../knowledge/known-limitations.md) must be consulted before documentation
counts or release-packaging assumptions are relied upon.

## Prohibited patterns

- Changes must not bypass, weaken, rename, or fabricate live-write confirmation guards.
  `test:live:write` must not run outside the documented disposable-tenant procedure.
- Tests must not change a stable expectation merely to make a failure pass; resolve the
  authoritative contract first and record intentional compatibility changes.
- Tests must not cover only normalized curated data when exact wire serialization or unchanged
  response evidence is part of the contract.
- Broad snapshots must not replace focused assertions on operation order, request bodies, result
  correlation, partial failures, or unknown-code behavior.
- Contributors must not assume `npm run check` performs live tests, dependency audit,
  release verification, or tarball inspection; the applicable separate gate must run.

## Commands

| Command                      | Use                                                       |
| ---------------------------- | --------------------------------------------------------- |
| `npm test -- <path>`         | Run one focused deterministic runtime test file.          |
| `npm test`                   | Run all default `test/**/*.test.ts` runtime tests once.   |
| `npm run typecheck`          | Check source, runtime tests, type tests, and configs.     |
| `npm run typecheck:examples` | Compile all public examples without executing them.       |
| `npm run build`              | Build ESM, CommonJS, and both declaration trees.          |
| `npm run verify:package`     | Smoke-test all runtime and type export paths.             |
| `npm run check`              | Run type, test, build, export, and `publint`.             |
| `npm run test:live:read`     | Run explicitly credentialed read-only contract checks.    |
| `npm run test:live:write`    | Run strongly guarded disposable-tenant draft writes.      |

## Validation requirements

- During development, run the smallest focused test first, then the affected type, build, or
  package checks. Before completion, run the broadest safe gate justified by the change.
- A request/response change must assert exact method, URL, query/body serialization, and both
  normalized and wire-level result evidence where applicable.
- A multi-request workflow change must cover ordered operations, aggregate `data`, correlated step
  evidence, failure after a successful write, partial/compensation evidence, and the absence of
  unintended extra writes.
- A public type or export change must include compile-time coverage and run
  `npm run typecheck:examples`, `npm run build`, and `npm run verify:package`.
- A change to checked-in OpenAPI types or raw resources must finish with `npm run check`.
- Release preparation must run `npm run verify:release -- --channel "<latest|dev>"` in addition to
  `npm run check`. Ordinary CI is not sufficient evidence of publish readiness. Each
  `package.json` version may be published only once; a later push of the same version updates
  dist-tags only.
- Documentation-only changes must at minimum resolve internal Markdown links and run
  `git diff --check` when Git metadata is available.
