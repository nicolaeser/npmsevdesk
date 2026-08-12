import { describe, expect, it } from "vitest";
import * as enumsEntry from "../src/enums-entry.js";
import * as publicApi from "../src/index.js";

const curatedEnumExports = [
  "InvoiceStatus",
  "OrderStatus",
  "VoucherStatus",
  "CreditNoteStatus",
  "ContactStatus",
  "CheckAccountStatus",
  "CheckAccountTransactionStatus",
  "PartStatus",
  "DocumentStatus",
  "ContactCategory",
  "InvoiceType",
  "InvoiceFromOrderPartialType",
  "OrderType",
  "VoucherType",
  "VoucherDirection",
  "SendType",
  "BookingType",
  "CommunicationWayType",
  "CommunicationWayKeyName",
  "CreditNoteBookingCategory",
  "LegacyTaxType",
  "TaxRule",
  "CheckAccountType",
  "CheckAccountImportType",
  "ContactDepth",
  "ReminderEligibilityFailureReason",
  "SortDirection",
  "RecurringInterval",
  "TextTemplateCategory",
  "TextTemplateTextType"
] as const;

describe("curated enum exports", () => {
  it.each(curatedEnumExports)("exports %s from both public entry points", (name) => {
    expect(publicApi[name]).toBe(enumsEntry[name]);
  });
});
