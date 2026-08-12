---
type: instruction
description: Governs tax selection and evidence; load for rates or tax-bearing work.
scope: repository
---

# Taxation

## Scope and activation condition

This Instruction must be loaded for VAT or tax rules, German sale decisions, country/rate lookup,
tenant bookkeeping profiles, ReceiptGuidance, voucher booking compatibility, tax-bearing Factory
inputs, and related examples or tests. This document describes SDK safety and evidence requirements,
not tax or legal advice. [sevdesk integration safety](sevdesk-integration-safety.md) must also be
loaded for any remote request or document write.

## Mandatory rules

### Semantic selection

- For German sellers, `client.taxes.resolveSale()` should be used for a tax plan and
  `client.taxes.quoteSale()` when net/tax/gross and position data are needed. Canonical
  `TaxCustomerType`, `SaleProduct`, and `EuConsumerTaxation` values must be passed per call.
- Every EU consumer, including a business deliberately treated as a consumer, must make the
  reviewed seller-country-versus-OSS choice explicit. The SDK must not infer it from country,
  turnover, or customer master data.
- When the supply/document date is known, it must be supplied as `effectiveDate`, preferably as
  `YYYY-MM-DD`. A `Date` uses UTC calendar fields; omission means the current UTC day.
- Special VAT territories and Northern Ireland goods must remain application-owned legal facts.
  Country-level `resolveSale()` cannot infer them from an ISO country alone; a reviewed
  semantic/manual preset or `client.raw` must be used when the country-level matrix is insufficient.
- `result.data` or `quote.tax` must be passed directly as the curated document `tax`.
  `quote.position` and its correlated `quote.showNet` must be applied to the same document.
- A document treatment must not be derived from a percentage, `contact.exemptVat`, VAT/tax numbers,
  `taxText`, `showNet`, or voucher amount basis. Those are distinct legal, master-data, display, or
  calculation concerns.

### Location and VAT-ID evidence

- `locationEvidence` and pure `assessTaxLocation()` consume application-owned billing, IP, and
  payment evidence. Conflicts must fail closed unless the caller supplies an auditable
  `{ country, reason, reviewedBy }` override matching the requested country. The first or majority
  signal must not be chosen implicitly.
- `validateVatIdFormat()` checks syntax only and is not VIES. EU B2B treatment requires
  caller-verified provider evidence; invalid, unavailable, unchecked, or mismatched evidence must
  not become reverse charge.
- High-level `resolveSale()` validates a valid VAT ID's format, country, provider, and timestamp.
  It enforces `vatEvidenceMaxAgeDays` against both real time and `effectiveDate`; a future effective
  date requires `validUntil` covering that date. `checkedAt` and `validUntil` must not be
  fabricated.
- Low-level `resolveDigitalService()` is intentionally different: it requires valid status,
  non-empty value/provider, a parseable `checkedAt`, and a matching optional country, but has no
  `effectiveDate` and does not enforce evidence age or `validUntil`. A caller choosing this helper
  must verify and persist temporal validity before the call. `resolveSale()` should be preferred for
  new SaaS code.
- Pure presets such as `taxes.revenue.euB2bService()` express a reviewed treatment and may retain
  evidence; they do not verify that evidence.

### Rates and audit evidence

- A percentage alone must not determine a tax rule. For OSS, a reviewed explicit rate, a versioned
  application-owned `taxRateSource`, or successful dated evidence must be used.
- The package VAT table is an undated current snapshot and may be used only for the current UTC
  day. It must not evidence a historical or future document. A supplied `rateLookup.asOf` must
  match `effectiveDate`.
- `getCountryRates()` and `getCountryRatesResult()` call an undocumented endpoint absent from the
  checked-in OpenAPI files. Use of either endpoint must be an explicit experimental opt-in;
  automatic use requires `useLiveCountryRates: true`. An application-owned provider should be
  preferred in production.
- `resolveSale().evidence` or the rich `getCountryRatesResult()` response should be retained in a
  protected audit store when exact lookup evidence is required. Tax plans, VAT evidence, and
  checkout evidence must not enter ordinary logs.

### Tenant representation and overrides

- A semantic `taxes.revenue.*` or `taxes.expense.*` selection must be created and resolved with
  `client.taxes.resolve()`. `getProfile()` owns the cached tenant bookkeeping representation;
  `refreshProfile()` must be called after the tenant changes bookkeeping configuration.
- The HTTP `resourceVersion` setting owned by [SDK development](sdk-development.md) must not select
  `taxRule` versus `taxType`.
- A semantic preset with no documented bookkeeping-system 1.0 mapping must fail before a document
  request. A legacy mapping must not be invented; a reviewed direction-specific manual
  configuration must be used or the tenant must be migrated.
- `taxes.manual.sales()`, `taxes.manual.expense()`, and `taxes.manual.voucherRevenue()` are visible
  reviewed overrides. Curated Factory inputs must not accept an equivalent plain object.
  `client.raw` should be used when exact wire-shaped control is the intended contract.
- Sales, expense, and voucher-revenue rule domains must remain separate. Unknown future rules may
  use a domain-correct `rawEnumCode()` only inside the matching manual factory; the SDK must not
  invent their rate semantics.

### Vouchers and credit notes

- Before booking a voucher whose account/rule/rate compatibility is not already guaranteed by the
  application, the caller must invoke `client.taxes.checkVoucherCompatibility()`.
  `compatible: false` and its reasons must be treated as a typed business outcome; exact matching
  must not select the first duplicate account.
- Curated validation must preserve direction/rule/rate compatibility, finite 0–100 percentages,
  fixed-zero rules, a common voucher net/gross basis, OSS/rule-21 voucher restrictions, and legacy
  custom `taxSet` requirements.
- Manual OSS presets must resolve the destination with `client.lookup.country({ code })`; a sevdesk
  country ID must not be hard-coded.
- OSS rules 18–20 or rule 21 credit notes must use
  `CreditNoteBookingCategory.UNDERACHIEVEMENT` and exactly one source. Bookkeeping system 2.0
  accepts `refSrcInvoice` only; legacy 1.0 may accept `refSrcVoucher`. The two sources must not be
  supplied together, and neither may be attached to another booking category.

## Architecture and dependency boundaries

- `src/taxes/sale/**` owns high-level German sale normalization, evidence checks, the decision
  matrix, and deciding when a rate is required. `src/taxes/rates/resolve.ts` owns provider, live,
  and package-baseline rate resolution. `src/taxes/digital-service.ts` owns only the narrow
  compatibility helper described above.
- `src/taxes/presets.ts` and `src/taxes/selection.ts` own semantic rule mapping;
  `src/taxes/taxes.ts` owns tenant profile resolution, country-rate access, and ReceiptGuidance.
- Curated builders consume branded resolved or manual tax plans and validate document
  compatibility before transport. Raw methods remain wire-shaped and do not inherit curated legal
  semantics.
- The application owns the legal classification, OSS election/threshold decision, special
  territory facts, VIES/provider verification, historical rate provenance, and evidence storage.
  The SDK translates reviewed facts into a tenant representation.

## Compatibility requirements

- Canonical exported constants and direction-specific enums must remain the generated-application
  vocabulary. Compatibility aliases may be accepted where already typed, but new examples should
  use canonical inputs.
- The distinction between bookkeeping system 1.0 `taxType` mappings and 2.0 `taxRule` mappings must
  be preserved.
- Fail-closed behavior must be preserved for missing EU-consumer choices, conflicting location
  evidence, invalid/missing EU B2B evidence, unavailable dated rates, and unsupported legacy
  mappings.
- The correlation among a resolved plan's rule, direction, rate, destination country, evidence,
  position, and `showNet` must be preserved; these values must not be reconstructed from independent
  fields.

## Sources of truth and canonical patterns

- Canonical implementations are `src/taxes/sale/determine.ts`, `src/taxes/rates/resolve.ts`,
  `src/taxes/digital-service.ts`, `src/taxes/selection.ts`, `src/taxes/taxes.ts`, and the tax checks
  in `src/bundles/builders.ts`.
- Canonical executable evidence is in `test/taxes.test.ts`, `test/tax-location.test.ts`,
  `test/tax-rate-resolution.test.ts`, `test/vat-id.test.ts`, and `test/builders.test.ts`.
- Public usage programs are `examples/08-tax-resolution-and-json.ts` and
  `examples/09-sale-templates.ts`.

## Prohibited patterns

- The SDK and callers must not infer OSS, reverse charge, exemption, or a sevdesk rule from country,
  rate, contact fields, or VAT-ID syntax alone.
- Callers must not silently fetch or fabricate VAT verification, location evidence, timestamps, or
  rates.
- Callers must not use the current package VAT snapshot for a historical/future effective date or
  treat the experimental country-rate endpoint as a documented production contract.
- Curated code must not pass an unbranded hand-built tax object to a Factory, mix sales and expense
  rule domains, or invent a bookkeeping-system 1.0 mapping.
- Callers must not coerce a country-level result into a special-territory decision.
- Booking code must not use an ambiguous/mismatched ReceiptGuidance result or treat
  `compatible: false` as an exception that can be ignored.

## Relevant commands

- `npm test -- test/taxes.test.ts test/tax-location.test.ts`
- `npm test -- test/tax-rate-resolution.test.ts test/vat-id.test.ts`
- `npm test -- test/builders.test.ts`
- `npm run typecheck`
- `npm run typecheck:examples` for public tax usage
- `npm run check` for public tax contracts or cross-cutting changes

## Validation requirements

- Decision changes must cover German, EU, and non-EU branches; consumer/business and goods/service
  products; explicit seller-country/OSS choices; small-business handling; and fail-closed missing
  evidence.
- VAT evidence tests must pin real time and exercise format/country/provider checks, maximum age,
  effective-date boundaries, future `validUntil`, and the documented lower-level
  `resolveDigitalService()` distinction.
- Rate tests must cover explicit, provider, package-baseline, and opt-in live precedence; matching
  `asOf`; historical/future failures; missing-rate behavior; and UTC cache rollover.
- Profile and builder tests must cover 1.0/2.0 mapping, cache refresh, direction typing, serialized
  rule/rate/country values, manual overrides, and local failure before document transport.
- Voucher and credit-note tests must cover exact/ambiguous guidance, typed incompatibility,
  booking-category/source restrictions, and both supported bookkeeping representations.
