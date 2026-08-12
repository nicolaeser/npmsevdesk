# Public SDK surface

Load this when adopting the package or choosing between curated, lookup, tax, and raw calls.

## Layers

- `createSevdeskClient({ apiToken })` is transport-only. Status and enum maps are not constructor
  configuration.
- Curated modules: `contacts`, `invoices`, `orders`, `creditNotes`, `vouchers`, `payments`,
  `reminders`, `layout`, `parts`. The same instances are also on `client.bundles`.
- `client.lookup` resolves exact contact customer numbers, check-account IBAN/names, part
  numbers/names, and countries. Ambiguity fails; `find*` only makes zero matches optional.
  Customer and part numbers are tenant strings with no assumed prefix.
- Official type codes such as `InvoiceType.NORMAL` (`"RE"`) are document classes.
  Tenant invoice numbers and headings can be `INV-…` without changing that code.
  See [tenant identifiers](tenant-identifiers.md).
- `client.taxes` resolves German sale plans, quotes priced lines, checks voucher compatibility, and
  can fetch experimental country rates. Prefer `resolveSale()` / `quoteSale()` over
  `resolveDigitalService()`.
- `client.raw.<resource>.<operationId>({ path, query, body, headers, extraQuery, options })` is the
  generated OpenAPI surface. Do not flatten the envelope.
- `client.request()` is only for an endpoint that is not generated.

## Naming

Use `list`, `get`, and `create` for the module resource; an explicit verb for one state change;
a workflow name only for multi-request choreography. Canonical compounds include
`contacts.create`, `invoices.createAndFinalize`, `book`, `sendByEmail`, `markAsSent`,
`vouchers.uploadAttachment`, and `reminders.checkEligibility` / `getLastForInvoice` / `create`.

Removed prerelease aliases such as `createFullContact`, `createAndFinaliseInvoice`, `bookInvoice`,
`uploadFile`, `preflight`, and `createReminder` must not be reintroduced.

Check accounts, transactions, exports, reports, tags, text templates, and SevUsers have no curated
module; use `client.raw`. Credit-note and voucher updates exist only on the raw surface.

## Results

Curated `result.data` is normalized after identity/status/code boundary checks. `objects`, `json`,
and credential-safe `raw` stay wire-shaped. Status is `{ status, statusCode, statusKnown }`. Other
coded fields live under `semantic.<field>.{ name, code, known }`. Curated lists require
`pagination`.

## Examples

Compile-checked programs in `examples/` are the public usage source. Change a public pattern only
together with its example.

Implementation ownership remains in `src/`. Mandatory rules remain in the Instructions.
