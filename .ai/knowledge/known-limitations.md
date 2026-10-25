# Known limitations

This document applies when planning package validation, dependency, or release work, relying on
published repository context, using low-level VAT-ID evidence, using e-invoice reference types, or
reading invoice render responses.
These are verified current gaps, not approved conventions; the cited sources must be checked again
before acting. An entry must be removed when its underlying gap is closed.

## Declared Node range exceeds the CI matrix

The engine range `>=24.0.0` declares compatibility with future Node majors. CI tests the 24.0.0
floor, the current Node 24 release, and current Node 26. Later majors are not covered by
repository CI. Evidence: `package.json`, `.github/workflows/ci.yml`, and
`.github/scripts/verify-release.mjs`.

## No test-coverage or Markdown-link gate

The package scripts and CI have no code-coverage threshold and no repository Markdown-link
checker. Broken links and unexercised branches therefore require separate review. Evidence:
`package.json#scripts` and `.github/workflows/ci.yml`.

## Same version is not rebuilt or retagged between channels

A published npm version can be published only once. `dev/<topic>` branches are not a publish
channel. `development` stamps `YYYY.M.D-vdev.<sha7>` from the commit date and the first 7 SHA
characters, then publishes that prerelease with dist-tag `dev`. The version does not keep the
`package.json` release number. Month and day are unpadded because SemVer forbids leading zeros,
and an all-digit SHA is prefixed with `s` for the same reason. A separate `dev-<sha7>` dist-tag
is not set: trusted publishing does not grant dist-tag access, and the pinned npm 11.17.0 is
below the 11.21.0 CLI that can do it. The version string is the pin. `main` publishes the stable
`package.json` version as `latest`. `latest` is not moved onto a version first published as `dev`.
Evidence: `.github/scripts/channel-version.mjs`, `.github/scripts/resolve-publish.mjs`, and
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
`https://api.sevdesk.de/openapi.yaml` and `src/resources`.

## E-invoice fields are only partly in the official OpenAPI

`propertyIsEInvoice` is documented on the invoice model and Factory create. It is not documented
on invoice update, invoice responses, or credit notes. `einvoiceReference` (`CUSTOM`, `BT-11`,
`BT-12`, `BT-13`, `BT-14`, `BT-16`, `BT-17`) and `propertyEInvoiceMail` are not in the vendor
OpenAPI. The reference codes mirror the sevdesk web client's selector. The web client labels
`BT-12` "Kontakt", but EN 16931 BT-12 is the contract reference. The number stays in
`customerInternalNote`. The web client resets the reference to `CUSTOM` when e-invoicing is
turned off; this package does not write that reset unless the caller sets `einvoiceReference`.

Curated invoice Factory create and `invoices.update()` accept `einvoiceReference`. A type other
than `CUSTOM` requires `propertyIsEInvoice: true` and a non-empty note, using the patch value or
the loaded draft. Invoice and credit-note create and update accept `propertyEInvoiceMail`;
`null` clears it and a blank address is rejected. Credit-note create and update accept
`propertyIsEInvoice`. Credit notes do not accept `einvoiceReference`. Normalized reads keep the
wire values when sevdesk returns them. Whether the public API saves and returns
`einvoiceReference`, `propertyEInvoiceMail`, and credit-note `propertyIsEInvoice` has not been
confirmed with a live tenant. Evidence: `src/enums/domain-enums.ts`, `src/bundles/builders.ts`,
`src/bundles/invoices.ts`, `src/bundles/credit-notes.ts`, `src/domain/normalizers.ts`, and
`src/types/openapi.ts`.

## Build tooling is held below tsup 9

tsup 9 requires Node.js `^24.11.0`, but the CI Node.js 24.0.0 job runs `npm run build`, so tsup
stays on 8.x until that floor changes. Dependabot ignores semver-major tsup updates for the same
reason. Evidence: `package.json#devDependencies`, `.github/dependabot.yml`, and
`.github/workflows/ci.yml`.

## Vendor render schema still describes page images

Since 7 April 2026, sevdesk render, `changeParameter`, and `sendByWithRender` responses return the
full PDF and ignore `getAsPdf`. `pages` and `thumbs` are gone
([API News Q1 2026](https://tech.sevdesk.com/api_news/posts/2026_02_breaking_changes_q1_2026/)).
The checked-in OpenAPI oneOf still documents both shapes, and raw types follow that document.
Curated `invoices.render()` follows the live PDF response. Evidence: `src/types/openapi.ts` and
`src/bundles/document-output.ts`.

## Low-level VAT evidence lacks temporal enforcement

High-level `resolveSale()` checks VAT evidence against real time, the effective tax date, maximum
age, and future-date `validUntil`. Low-level `resolveDigitalService()` checks valid status,
non-empty value/provider, parseable `checkedAt`, and an optional country match, but has no
effective-date or age validation. Callers of the low-level helper must establish temporal validity
themselves. Evidence: `src/taxes/sale/determine.ts` and `src/taxes/digital-service.ts`.
