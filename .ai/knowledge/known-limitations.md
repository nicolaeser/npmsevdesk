# Known limitations

This document applies when planning package validation or release work, relying on published
repository context, or using low-level VAT-ID evidence. These are verified current gaps, not
approved conventions; the cited sources must be checked again before acting. An entry must be
removed when its underlying gap is closed.

## Declared Node range exceeds the CI matrix

The engine range `>=24.0.0` declares compatibility with future Node majors, while CI tests only the
24.0.0 floor and the current Node 24 release. Node 25 and later are not covered by repository CI.
Evidence: `package.json`, `.github/workflows/ci.yml`, and
`.github/scripts/verify-release.mjs`.

## No test-coverage or Markdown-link gate

The package scripts and CI have no code-coverage threshold and no repository Markdown-link
checker. Broken links and unexercised branches therefore require separate review. Evidence:
`package.json#scripts` and `.github/workflows/ci.yml`.

## Same version is not rebuilt or retagged between channels

A `package.json` version can be published only once. `development` publishes only prereleases as
`dev`. `main` publishes only new stable versions as `latest`. Trusted publishing can publish a
tarball with `--tag`; it cannot add extra `dist-tag` aliases or later move `latest` onto a
version first published as `dev`. Evidence: `.github/scripts/resolve-publish.mjs` and
`.github/workflows/publish.yml`.

## Release audit and tarball checks are partial

The publish workflow audits production dependencies only, although TypeScript, tsup, Vite, Vitest,
and other development dependencies execute in build or validation. It prints
`npm pack --dry-run` output for inspection, but no gate asserts the complete archive allowlist;
`verify-release` only requires selected entries in `package.json#files`. Evidence:
`package.json`, `.github/scripts/verify-release.mjs`, and `.github/workflows/publish.yml`.

## Official OpenAPI is incomplete

The vendor document lists 154 operations and omits pagination query parameters
on many list endpoints plus schemas such as `Model_StaticCountryResponse`.
Checked-in `src/resources` includes additional live operations. Evidence:
`openapi/sevdesk-official-2.0.0.yaml` and `src/resources`.

## Low-level VAT evidence lacks temporal enforcement

High-level `resolveSale()` checks VAT evidence against real time, the effective tax date, maximum
age, and future-date `validUntil`. Low-level `resolveDigitalService()` checks valid status,
non-empty value/provider, parseable `checkedAt`, and an optional country match, but has no
effective-date or age validation. Callers of the low-level helper must establish temporal validity
themselves. Evidence: `src/taxes/sale/determine.ts` and `src/taxes/digital-service.ts`.
