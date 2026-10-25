# Public SDK surface

Load this when adopting the package or choosing between curated, lookup, tax, and raw calls.

## Layers

- `createSevdeskClient({ apiToken })` is transport-only. Status and enum maps are not constructor
  configuration.
- Curated modules: `contacts`, `invoices`, `orders`, `creditNotes`, `vouchers`, `payments`,
  `reminders`, `layout`, `parts`, `sequences`, `users`, `checkAccounts`, `transactions`,
  `exports`, `reports`, `tags`, `textTemplates`. The same instances are also on
  `client.bundles`.
- `client.lookup` resolves exact contact customer numbers, check-account IBAN/names, part
  numbers/names, and countries. Ambiguity fails; `find*` only makes zero matches optional.
  Customer and part numbers are tenant strings with no assumed prefix.
- Official type codes such as `InvoiceType.NORMAL` (`"RE"`) are document classes.
  Tenant invoice numbers and headings can be `INV-…` without changing that code.
  See [tenant identifiers](tenant-identifiers.md).
- E-invoice references use `einvoiceReference` (`EInvoiceReferenceType`, e.g.
  `PURCHASE_ORDER` = `"BT-13"`) for the type and `customerInternalNote` for the number. A type
  other than `CUSTOM` requires `propertyIsEInvoice: true` and a non-empty note. Factory create
  and `invoices.update()` accept the reference. An update merges the flag and note from the
  loaded draft when the patch omits them, and sends only fields the caller set.
  `propertyEInvoiceMail` is the recipient address on invoice and credit-note create and update;
  `null` clears it. Credit-note create and update also accept `propertyIsEInvoice`. Reads keep
  the wire values, and invoices expose `semantic.einvoiceReference`. `einvoiceReference` and
  `propertyEInvoiceMail` are not in the vendor OpenAPI, and live persistence is unverified. See
  [known limitations](known-limitations.md).
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

`exportDatevDepricated` is raw-only. `reports.creditNotes` is not generated. Credit-note and
voucher curated updates are draft-only workflows matching `invoices.update`.

## Document output

`invoices.render()` is a write. Since 7 April 2026 it always returns the full PDF on
`data.pdf` with `data.kind: "pdf"`. Curated calls do not send `getAsPdf` and do not expose page
images. Layout updates also omit `getAsPdf`. Raw render types still follow the checked-in OpenAPI
oneOf; see [known limitations](known-limitations.md). `invoices.getPdf()` remains the separate
download endpoint.

## Results

Curated `result.data` is normalized after identity/status/code boundary checks. `objects`, `json`,
and credential-safe `raw` stay wire-shaped. Status is `{ status, statusCode, statusKnown }`. Other
coded fields live under `semantic.<field>.{ name, code, known }`. Curated lists require
`pagination`.

## Examples

Compile-checked programs in `examples/` are the public usage source. Change a public pattern only
together with its example.

Implementation ownership remains in `src/`. Mandatory rules remain in the Instructions.
