import { describe, expect, it } from "vitest";
import {
  buildInvoiceBookingPayload,
  buildInvoicePayload,
  buildVoucherBookingPayload
} from "../src/bundles/builders.js";
import { rawEmbed } from "../src/bundles/embed.js";
import {
  contactListQuery,
  creditNoteListQuery,
  invoiceListQuery,
  orderListQuery,
  voucherListQuery
} from "../src/bundles/filters.js";
import { normalizeInvoice } from "../src/domain/normalizers.js";
import { TaxRule } from "../src/enums/domain-enums.js";
import { taxes } from "../src/taxes/presets.js";
import { normalizeSevdeskId, refs } from "../src/types/references.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../src/utils/errors.js";
import {
  validateSevdeskDateString,
  validateTimeoutMs,
  validateUnixTimestamp
} from "../src/utils/validation.js";

describe("typing and curated input boundaries", () => {
  it("normalizes safe sevdesk ids and rejects ambiguous numeric strings", () => {
    expect(normalizeSevdeskId(" 0042 ")).toBe(42);
    expect(refs.contact("7")).toEqual({ id: 7, objectName: "Contact" });
    for (const invalid of ["", "1.5", "1e3", "-1", "abc", 0, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => normalizeSevdeskId(invalid)).toThrow(SevdeskConfigurationError);
    }
  });
  it("validates pagination, dates and timeout ranges before transport", () => {
    expect(contactListQuery({ depth: "organisations_only" }).depth).toBe("0");
    expect(contactListQuery({ depth: "organisations_and_people" }).depth).toBe("1");
    expect(() => contactListQuery({ limit: 0 })).toThrow(SevdeskConfigurationError);
    expect(() => contactListQuery({ limit: 1_001 })).toThrow(SevdeskConfigurationError);
    expect(() => contactListQuery({ offset: -1 })).toThrow(SevdeskConfigurationError);
    expect(() => orderListQuery({ startAmount: Number.NaN })).toThrow(SevdeskConfigurationError);
    expect(() => creditNoteListQuery({ endAmount: Number.POSITIVE_INFINITY })).toThrow(
      SevdeskConfigurationError
    );
    expect(() => voucherListQuery({ year: 2026.5 })).toThrow(SevdeskConfigurationError);
    expect(() => voucherListQuery({ month: 13 })).toThrow(SevdeskConfigurationError);
    expect(() => voucherListQuery({ startAmount: Number.NEGATIVE_INFINITY })).toThrow(
      SevdeskConfigurationError
    );
    expect(() => invoiceListQuery({ startDate: new Date("invalid") })).toThrow(
      SevdeskConfigurationError
    );
    expect(() => validateTimeoutMs(-1)).toThrow(SevdeskConfigurationError);
    expect(() => validateTimeoutMs(Number.POSITIVE_INFINITY)).toThrow(SevdeskConfigurationError);
    expect(() => validateUnixTimestamp(-1, "date")).toThrow(SevdeskConfigurationError);
    expect(() => validateUnixTimestamp(1.5, "date")).toThrow(SevdeskConfigurationError);
    expect(validateSevdeskDateString("31.07.2026", "date")).toBe("31.07.2026");
    expect(() => validateSevdeskDateString("31.02.2026", "date")).toThrow(
      SevdeskConfigurationError
    );
  });
  it("rejects non-finite Factory and booking values", () => {
    expect(() =>
      buildInvoicePayload({
        invoice: {
          invoiceDate: "2026-07-30",
          contact: refs.contact(1),
          contactPerson: refs.sevUser(2),
          currency: "EUR",
          tax: taxes.manual.sales({
            bookkeepingSystem: "2.0",
            taxRule: TaxRule.STANDARD_TAXABLE
          })
        },
        positions: [
          {
            quantity: Number.NaN,
            price: 100,
            taxRate: 19,
            unity: refs.unity(1)
          }
        ]
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      buildInvoiceBookingPayload({
        amount: Number.POSITIVE_INFINITY,
        date: new Date(),
        checkAccount: refs.checkAccount(1)
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      buildVoucherBookingPayload({
        amount: 10,
        date: "not-a-date",
        checkAccount: refs.checkAccount(1)
      })
    ).toThrow(SevdeskConfigurationError);
  });
  it("requires an explicit escape hatch for forward embed paths at runtime", () => {
    expect(rawEmbed("future.relation")).toBe("future.relation");
    expect(() => rawEmbed("   ")).toThrow(SevdeskConfigurationError);
  });
  it("turns malformed normalized-domain values into SDK validation errors", () => {
    expect(() => normalizeInvoice(null as never)).toThrow(SevdeskResponseValidationError);
    expect(() =>
      normalizeInvoice({
        id: "1.5",
        objectName: "Invoice",
        status: "200"
      })
    ).toThrow(SevdeskResponseValidationError);
    expect(() =>
      normalizeInvoice({
        id: "1",
        objectName: "Invoice",
        status: "200",
        invoiceType: {} as never
      })
    ).toThrow(SevdeskResponseValidationError);
  });
});
