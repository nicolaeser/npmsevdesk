# npmsevdesk

Unofficial TypeScript SDK for the [sevdesk](https://sevdesk.de) API. Axios-based, ESM and CommonJS, Node.js 24+. Not affiliated with sevdesk GmbH.

```sh
npm install npmsevdesk
```

## Quick start

Send the API token in `Authorization` as-is. Do not add `Bearer`. Use HTTPS.

```ts
import { InvoiceStatus, createSevdeskClient } from "npmsevdesk";

const client = createSevdeskClient({
  apiToken: process.env.SEVDESK_API_TOKEN!
});

const invoices = await client.invoices.list({
  status: InvoiceStatus.OPEN,
  limit: 50
});

console.log(invoices.data[0]?.status, invoices.data[0]?.semantic.invoiceType);
client.dispose();
```

`createSevdeskClient` is transport and auth only. Status maps and tax rules are not constructor config.

## What to call

- `client.contacts`, `invoices`, `orders`, `creditNotes`, `vouchers`, `payments`, `reminders`, `layout`, `parts`, `sequences`, `users`, `checkAccounts`, `transactions`, `exports`, `reports`, `tags`, and `textTemplates` for the modeled business flows. The same objects are also on `client.bundles`.
- `client.lookup` when you have an exact customer number, IBAN, part number, or country code. Strict lookups fail on zero or multiple matches; `find*` only makes “not found” optional.
- `client.taxes` for German sale plans and priced lines. Prefer `resolveSale()` / `quoteSale()`.
- `client.raw.<resource>.<operationId>({ path, query, body })` for one generated OpenAPI call. Keep that envelope; do not flatten it.
- `client.request()` only for an endpoint that is not generated.

`exportDatevDepricated` stays on `client.raw` only. There is no curated credit-note report.

Curated `result.data` is the normalized view. `objects`, `json`, and `raw` stay wire-shaped. Status is `{ status, statusCode, statusKnown }`. Other coded fields live under `semantic.<field>`.

## Numbers vs type codes

`InvoiceType.NORMAL` is the official `"RE"` document class. It does not change when a tenant customizes the printed invoice name or number range. `invoiceNumber` and `customerNumber` are ordinary strings (`INV-2024-0001`, `CUST-42`). See `examples/12-tenant-identifiers.ts`.

For e-invoices, `einvoiceReference` sets which reference the number in `customerInternalNote` is, such as `EInvoiceReferenceType.PURCHASE_ORDER` (`"BT-13"`). Any type other than `CUSTOM` requires `propertyIsEInvoice: true` and a non-empty note. Factory create and `invoices.update()` accept it. An update uses the loaded draft when the patch omits the flag or the note, and sends only the fields the caller set. `propertyEInvoiceMail` is the recipient address on invoice and credit-note create and update; `null` clears it. Credit notes also accept `propertyIsEInvoice` on create and update. The official OpenAPI documents `propertyIsEInvoice` on invoice create, not on invoice update, credit notes, or these mail and reference fields. A live tenant has not confirmed that the API persists the extra fields.

## Writes

Creating, sending, booking, deleting, and similar calls change sevdesk. Use a disposable tenant for experiments. Invoice finalization and contact create are multi-request workflows, not transactions.

## Examples

Copy-paste programs live in `examples/`. They compile against the public package API.

- `01-client-and-enums.ts` — client setup and semantic enums
- `03-create-and-finalize-invoice.ts` — draft, send, book
- `05-exact-lookups.ts` — customer number, IBAN, part, country
- `08-tax-resolution-and-json.ts` — sale tax plans
- `12-tenant-identifiers.ts` — custom numbers vs `"RE"`, e-invoice reference, mail, and credit-note flag
- `13-sequences-users-and-dates.ts` — next numbers, users, dates, invoice positions
- `14-remaining-curated.ts` — check accounts, transactions, tags, text templates, exports, reports

## Requirements

Node.js 24 or newer. CI tests Node.js 24.0.0, the current Node.js 24 release, and Node.js 26.
Axios is the only runtime dependency.

Agents should start at `.ai/BASE.md`.
