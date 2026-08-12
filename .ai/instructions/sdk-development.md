---
type: instruction
description: Governs SDK development and adoption; load for APIs, OpenAPI, migrations, or examples.
scope: repository
---

# SDK development

## Scope and activation

This Instruction must be loaded before the package's generated raw API, curated API, public exports,
OpenAPI inputs, semantic types, references, lookups, builders, result models, or compile-checked
examples are changed or adopted. It also applies when application code is migrated from direct
sevdesk HTTP calls or another client. [Taxation](taxation.md) must also be loaded for tax-bearing
behavior, [sevdesk integration safety](sevdesk-integration-safety.md) for transport or remote side
effects, and [quality and testing](quality-testing.md) for validation.
[Tenant identifiers](../knowledge/tenant-identifiers.md) must also be loaded when
document numbers, customer numbers, number ranges, or official type codes are involved.

Unfamiliar package adoption should start with `README.md`,
[the public surface map](../knowledge/sdk-surface.md), and the compile-checked programs in
`examples/`. Direct-HTTP replacement must centralize client construction, map one-operation calls
to `client.raw`, prefer curated methods for modeled business intent, replace unchecked IDs/codes
with typed references and enums, and keep `client.request()` only for ungenerated endpoints.

## Mandatory rules

- The generated raw surface must remain OpenAPI-shaped. Calls must use
  `client.raw.<resource>.<operationId>({ path, query, body, headers, extraQuery, options })`.
  Callers must not flatten the request envelope.
- A curated bundle should be preferred when it models the complete business intent. `client.raw`
  must be used for exact one-operation wire control, and `client.request()` may be used only when no
  generated operation exists.
- New curated names must use `list` for collections, `get` for one resource, `create` for the
  module's resource, an explicit verb for one state change, and a descriptive workflow name only
  for multi-request choreography. Existing canonical compound names include `contacts.create`,
  `invoices.createAndFinalize`, resource-level `book`, `sendByEmail`, and `markAsSent`,
  `vouchers.uploadAttachment`, and `reminders.getLastForInvoice`, `checkEligibility`, and `create`.
- `extraQuery` may contain only parameters absent from the generated `query` type. A duplicate key
  is a configuration error and must not override a typed query value.
- Curated entity inputs must use `SevdeskIdInput` and `refs.*` where a typed reference is required.
  Raw operations must retain their generated ID types. Strict lookups must require exactly one
  match; a `find*` lookup may make only the zero-match branch optional and must still reject
  ambiguity. Check-account lookup must scan every page because its raw list operation has no
  IBAN/name filter.
- Curated `list` and `get` inputs must use their resource-specific embed unions. `rawEmbed()` is the
  explicit reviewed compatibility escape for a newer server path; public types must not be widened
  to arbitrary strings.
- Curated enum inputs must use the declared semantic key or an exported domain constant. Future
  inputs require a correctly domain-branded `rawEnumCode`; raw calls must receive their exact wire
  types. The client constructor must not accept user-defined status or enum mappings.
- Field-specific enum meanings must remain separate. In particular,
  `invoices.createFromOrder().partialType` uses `InvoiceFromOrderPartialType`, where `FINAL` maps to
  `"RE"`; it must not use the general `InvoiceType.NORMAL` meaning of the same wire code.
- Official document-class codes (`invoiceType` `RE`, `orderType` `AN`, and the
  other vendor enumerations) must not be confused with tenant-assigned
  `invoiceNumber`, `orderNumber`, `creditNoteNumber`, `customerNumber`,
  `partNumber`, or printed `header` strings. A customized number range such as
  `INV-2024-0001` must pass through unchanged and must not be sent as
  `invoiceType`. [Tenant identifiers](../knowledge/tenant-identifiers.md)
  records this split.
- Curated reads and Factory creates may normalize only `result.data` after checking the identity,
  collection, status, and coded fields they rely on. They must preserve wire evidence in
  `result.objects`, `result.json`, and `result.raw`; documentation must not describe this boundary
  checking as exhaustive runtime validation.
- Status must remain the top-level correlated `{ status, statusCode, statusKnown }` union. Other
  coded fields must use the correlated `result.data.semantic.<field>.{ name, code, known }`
  discriminant. Unknown server values must preserve the wire code and use `"UNKNOWN"`.
  `semantic.sendType` must keep the canonical known not-sent value with `name: "NOT_SENT"` and
  `code: null` for sevdesk's not-sent sentinels.
- Curated list results must expose required `result.pagination`; generated raw array results retain
  optional pagination. Workflow step types must keep `operationId` correlated with that step's
  `data`, `json`, and `raw` evidence.
- Pure `build*Payload` functions or `client.prepare(...)` should be used when request JSON must be
  reviewed before sending. Export a named payload type when builder output crosses an application
  boundary; public APIs must not make consumers reconstruct it with `ReturnType`.
- Inventory work must use `client.parts` for normalized list, get, stock, create, and merge-update
  behavior and `client.lookup.part` for exact part-number resolution. `PartStatus`, typed
  `refs.unity`/`refs.category`, and `PartEmbedInput` must be used; no Part delete endpoint exists.
- Any changed public usage pattern must be represented in `examples/` with canonical imports and
  method names.
- Application migrations must centralize client construction, map exact one-operation calls to
  `client.raw`, prefer curated methods for modeled business intent, replace unchecked IDs/codes
  with typed references and enums, and keep a reviewed raw escape hatch for unsupported behavior.

## Architecture and dependency boundaries

- Public entry points expose the client, generated raw resources/types, and hand-maintained
  domain, lookup, tax, and bundle layers without changing their ownership.
- The effective OpenAPI document generates wire types, operation metadata, raw resources, enum
  catalog entries, and resource reference pages. Hand-maintained bundles and domain normalizers may
  interpret that surface but must not silently rewrite its request or response contract.
- `createSevdeskClient` configuration is transport-only. `resourceVersion` selects the optional
  `X-Version` representation header.
- A curated Factory `create(...)` is the save request. Multi-step bundle side-effect and recovery
  rules must follow [sevdesk integration safety](sevdesk-integration-safety.md).
- Public entry points are the root plus `npmsevdesk/raw`, `npmsevdesk/types`, `npmsevdesk/enums`,
  `npmsevdesk/bundles`, `npmsevdesk/taxes`, and `npmsevdesk/package.json`, as declared in
  `package.json`. New public surface must be exported deliberately through the appropriate entry
  point and covered as a consumer would import it.

## Compatibility requirements

- The package must remain compatible with Node.js 24 or newer, strict TypeScript, ESM and CommonJS,
  and the matching declaration trees defined by `package.json`, `tsup.config.ts`, and
  `tsconfig.build.json`.
- Raw requests and results must remain wire-shaped. Curated conveniences must not leak into raw
  types or mutate unchanged response evidence.
- Unknown future response codes must remain observable. Known semantic APIs must not be widened to
  arbitrary `string` or `number` merely to accept unreviewed values.
- The vendor specification currently represents 154 official operations. Additional
  live operations already exist in checked-in `src/resources`. `contactAddressId` is
  a deprecated compatibility alias for `getContactAddressById`, not an extra
  endpoint. The alias must be preserved unless a deliberate breaking release
  removes it.
- Generated type changes and public type-only changes can be breaking. Patch is a compatible fix,
  minor is a backward-compatible addition, and major is a removed/renamed export, changed default,
  changed request/result contract, or dropped runtime.
- Changes must not reintroduce removed prerelease curated aliases such as `createFullContact`,
  `createAndFinaliseInvoice`, `bookInvoice`, `uploadFile`, `preflight`, or `createReminder`.

## Sources of truth and canonical patterns

The source that owns the question must be used in this order:

1. Wire paths, parameters, bodies, and responses:
   `openapi/sevdesk-official-2.0.0.yaml` and the checked-in raw resources in
   `src/resources`.
2. Exported behavior: `src/client`, `src/resources`, `src/types`, `src/enums`, `src/domain`,
   `src/lookup`, `src/taxes`, `src/bundles`, and the public entry files under `src/`.
3. Executable expectations: `test/` and the compile-checked programs in `examples/`.
4. Agent context in `.ai/` and the short `README.md`. They guide usage but do not override
   checked-in types or implementation.

`src/types/openapi.ts`, `src/client/operation-catalog.ts`, `src/enums/catalog.ts`,
and `src/resources/**` are checked-in source. Changes to them are public API changes.

## Prohibited patterns

- Changes must not invent an operation, parameter, enum value, object name, response field,
  semantic alias, or Part delete endpoint.
- Callers must not pass readable strings such as `"open"` to arbitrary raw methods, arbitrary
  strings as curated IDs or embeds, or a `rawEnumCode` branded for a different domain.
- Curated models must not reconstruct semantic meaning from independent name/code fields or
  restore obsolete flat `*Name` or `*Known` properties.
- A strict lookup must not select the first duplicate; callers must not use `find*` without
  handling its zero-match branch.
- Callers must not assume omitting a curated filter selects raw output, or that `result.data` and
  `result.objects` have the same shape for curated calls.
- A public pattern must not be documented without adding or updating its compile-checked example.

## Commands

| Command                      | Use                                                         |
| ---------------------------- | ----------------------------------------------------------- |
| `npm run typecheck:examples` | Compile the canonical public usage programs.                |
| `npm run check`              | Run the broad source, test, build, and package gate.        |

## Validation requirements

- Validation must match the affected layer and follow
  [quality and testing](quality-testing.md).
- A raw-surface or OpenAPI-type change must end with `npm run check`.
- A curated contract change must cover request serialization, normalized `data`, unchanged wire
  evidence, unknown/invalid boundary behavior, and compile-time input/output narrowing as
  applicable.
- A public export or example change must run `npm run typecheck:examples`, `npm run build`, and
  `npm run verify:package` in addition to focused tests.
- Before relying on documented inventories or packaging assumptions, consult
  [known limitations](../knowledge/known-limitations.md).
