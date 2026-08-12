# Tenant identifiers versus official type codes

Load this when invoice numbers, customer numbers, document headings, number
ranges, or values such as `RE` and `INV` are involved.

## Official type codes stay fixed

The vendor OpenAPI enumerates document-class fields. `invoiceType` is
`RE` / `WKR` / `SR` / `MA` / `TR` / `AR` / `ER`. `orderType` is `AN` / `AB` /
`LI`. These codes do not change when a tenant customizes printed names or
number ranges. Evidence: `openapi/sevdesk-official-2.0.0.yaml` and
`src/enums/domain-enums.ts`.

## Tenant-assigned strings are opaque

`invoiceNumber`, `orderNumber`, `creditNoteNumber`, `customerNumber`,
`partNumber`, and printed `header` values are strings owned by the tenant
number range or master data. `INV-2024-0001` is a valid invoice number for a
normal invoice whose `invoiceType` remains `"RE"`. Contact `id` is the numeric
sevdesk identity; `customerNumber` is the tenant-facing string. Evidence:
vendor attribute tables and `src/bundles/types.ts`.

## Next numbers

Official prose documents `GET /SevSequence/Factory/getByType` with
`objectType` plus the official type code (`type=RE` for a normal invoice). The
path is not generated. Use `client.request()`. The `type` query is still the
document class, not the printed prefix. Evidence: vendor Invoice and CreditNote
tag prose.

## SDK behavior

Curated inputs accept official semantic keys or `rawEnumCode` for unknown type
codes. They must not treat a tenant prefix as `invoiceType`. Reads preserve
unknown type codes as `semantic.*.name: "UNKNOWN"`. Lookups match customer and
part numbers exactly, with no assumed prefix.
