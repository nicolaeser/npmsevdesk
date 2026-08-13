import { describe, expect, it } from "vitest";
import {
  buildContactPayload,
  buildCreditNotePayload,
  buildDeliveryPayload,
  buildInvoicePayload,
  buildOrderPayload,
  buildVoucherPayload
} from "../src/bundles/builders.js";
import {
  enumName,
  CreditNoteBookingCategory,
  InvoiceStatus,
  InvoiceType,
  OrderStatus,
  rawEnumCode,
  resolveEnumValueStrict,
  TaxRule,
  VoucherDirection
} from "../src/enums/domain-enums.js";
import { refs } from "../src/types/references.js";
import { taxes } from "../src/taxes/presets.js";

const manualSalesTax = (taxRule: 1 | 17 = TaxRule.STANDARD_TAXABLE) =>
  taxes.manual.sales({ bookkeepingSystem: "2.0", taxRule });
const manualExpenseTax = () =>
  taxes.manual.expense({
    bookkeepingSystem: "2.0",
    taxRule: TaxRule.DEDUCTIBLE_INPUT_TAX
  });

describe("payload builders", () => {
  it("rejects a future raw code branded for another enum domain", () => {
    expect(() =>
      resolveEnumValueStrict(InvoiceStatus, rawEnumCode("OrderStatus", 150) as never)
    ).toThrow(/cannot be used/);
    expect(() => resolveEnumValueStrict(InvoiceStatus, 150 as never)).toThrow(
      /Unknown InvoiceStatus value/
    );
  });
  it("maps ergonomic person and organisation contact fields to sevdesk wire names", () => {
    expect(
      buildContactPayload({
        kind: "person",
        firstName: "Ada",
        lastName: "Lovelace",
        middleName: "Byron",
        title: "Countess",
        organisation: refs.contact("12"),
        category: "customer"
      })
    ).toMatchObject({
      surename: "Ada",
      familyname: "Lovelace",
      name2: "Byron",
      titel: "Countess",
      parent: { id: 12, objectName: "Contact" }
    });
    expect(
      buildContactPayload({
        kind: "organisation",
        name: "Analytical Engines Ltd",
        additionalName: "Research",
        category: "customer",
        taxType: "EU"
      })
    ).toMatchObject({
      name: "Analytical Engines Ltd",
      name2: "Research",
      taxType: "eu"
    });
    expect(() =>
      buildContactPayload({
        kind: "organisation",
        name: "Broken Tax GmbH",
        category: "customer",
        taxType: "custom"
      } as never)
    ).toThrow(/custom tax type requires a taxSet/i);
  });
  it("maps semantic invoice values and emits inspectable factory JSON", () => {
    const payload = buildInvoicePayload({
      invoice: {
        invoiceDate: "2026-07-30",
        contact: refs.contact("12"),
        contactPerson: refs.sevUser(3),
        currency: "EUR",
        status: "draft",
        tax: taxes.manual.sales({
          bookkeepingSystem: "2.0",
          taxRule: "standard_taxable"
        })
      },
      positions: [
        {
          quantity: 2,
          price: 100,
          name: "Consulting",
          taxRate: 19,
          unity: refs.unity(1)
        }
      ],
      takeDefaultAddress: true
    });
    expect(payload.invoice).toMatchObject({
      objectName: "Invoice",
      mapAll: true,
      status: String(InvoiceStatus.DRAFT),
      invoiceType: "RE",
      contact: { id: 12, objectName: "Contact" },
      taxRule: { id: TaxRule.STANDARD_TAXABLE, objectName: "TaxRule" },
      taxRate: 19
    });
    expect(payload.invoicePosSave[0]).toMatchObject({
      objectName: "InvoicePos",
      mapAll: true,
      quantity: 2,
      taxRate: 19
    });
    expect(payload.takeDefaultAddress).toBe(true);
    expect(payload.invoicePosDelete).toBeNull();
    expect(payload.discountSave).toBeNull();
    expect(payload.discountDelete).toBeNull();
    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });
  it("accepts recurring WKR next-charge timestamps on factory create", () => {
    const nextCharge = new Date(2026, 8, 1, 12, 0, 0);
    const payload = buildInvoicePayload({
      invoice: {
        invoiceDate: "13.08.2026",
        contact: refs.contact(12),
        contactPerson: refs.sevUser(3),
        currency: "EUR",
        invoiceType: InvoiceType.RECURRING,
        accountIntervall: "monthly",
        accountNextInvoice: nextCharge,
        tax: taxes.manual.sales({
          bookkeepingSystem: "2.0",
          taxRule: "standard_taxable"
        })
      },
      positions: [
        {
          quantity: 1,
          price: 10,
          taxRate: 19,
          unity: refs.unity(1)
        }
      ]
    });
    expect(payload.invoice.invoiceType).toBe("WKR");
    expect(payload.invoice.accountIntervall).toBe("P0Y1M");
    expect(payload.invoice.accountNextInvoice).toBe(Math.floor(nextCharge.getTime() / 1_000));
  });
  it("passes tenant invoice numbers through without changing invoiceType", () => {
    const payload = buildInvoicePayload({
      invoice: {
        invoiceDate: "2026-07-30",
        contact: refs.contact("12"),
        contactPerson: refs.sevUser(3),
        currency: "EUR",
        invoiceNumber: "INV-2024-0001",
        header: "Invoice INV-2024-0001",
        tax: taxes.manual.sales({
          bookkeepingSystem: "2.0",
          taxRule: "standard_taxable"
        })
      },
      positions: [
        {
          quantity: 1,
          price: 100,
          name: "Consulting",
          taxRate: 19,
          unity: refs.unity(1)
        }
      ]
    });
    expect(payload.invoice).toMatchObject({
      invoiceType: InvoiceType.NORMAL,
      invoiceNumber: "INV-2024-0001",
      header: "Invoice INV-2024-0001"
    });
    expect(() =>
      buildInvoicePayload({
        invoice: {
          invoiceDate: "2026-07-30",
          contact: refs.contact("12"),
          contactPerson: refs.sevUser(3),
          currency: "EUR",
          invoiceType: "INV" as never,
          tax: taxes.manual.sales({
            bookkeepingSystem: "2.0",
            taxRule: "standard_taxable"
          })
        },
        positions: [
          {
            quantity: 1,
            price: 1,
            taxRate: 19,
            unity: refs.unity(1)
          }
        ]
      })
    ).toThrow(/Unknown InvoiceType value "INV"/);
  });
  it("emits mandatory Factory placeholders and rejects invalid create statuses", () => {
    const invoice = {
      invoiceDate: "2026-07-30",
      contact: refs.contact(12),
      contactPerson: refs.sevUser(3),
      currency: "EUR",
      tax: manualSalesTax()
    };
    expect(() =>
      buildInvoicePayload({
        invoice: { ...invoice, status: 200 as never },
        positions: [{ quantity: 1, taxRate: 19, unity: refs.unity(1), price: 1 }]
      })
    ).toThrow(/only create.*DRAFT/i);
    expect(() =>
      buildVoucherPayload({
        voucher: {
          voucherDate: "2026-07-30",
          creditDebit: "expense",
          status: 1000 as never,
          tax: manualExpenseTax()
        },
        positions: [
          {
            taxRate: 19,
            net: true,
            sumNet: 1,
            accountDatev: refs.accountDatev(1)
          }
        ]
      })
    ).toThrow(/only DRAFT or OPEN/i);
  });
  it("rejects tax-rule combinations that sevdesk documents as invalid", () => {
    expect(() =>
      buildInvoicePayload({
        invoice: {
          invoiceDate: "2026-07-30",
          contact: refs.contact(12),
          contactPerson: refs.sevUser(3),
          currency: "EUR",
          invoiceType: "AR",
          tax: manualSalesTax(TaxRule.NON_DOMESTIC_SERVICE)
        },
        positions: [{ quantity: 1, taxRate: 0, unity: refs.unity(1), price: 1 }]
      })
    ).toThrow(/supports only tax rule 1 or 11/i);
  });
  it("maps readable voucher directions", () => {
    const payload = buildVoucherPayload({
      voucher: {
        voucherDate: "2026-07-30",
        creditDebit: "expense",
        supplierName: "Supplier",
        tax: manualExpenseTax()
      },
      positions: [
        {
          taxRate: 19,
          net: true,
          sumNet: 100,
          accountDatev: { id: 1, objectName: "AccountDatev" }
        }
      ]
    });
    expect(payload.voucher.creditDebit).toBe(VoucherDirection.EXPENSE);
    expect(payload.voucher.objectName).toBe("Voucher");
    expect(payload.voucherPosSave[0]?.objectName).toBe("VoucherPos");
    expect(payload.voucherPosDelete).toBeNull();
  });
  it("normalizes order references and rejects non-draft Factory creation", () => {
    const order = {
      orderNumber: "AN-1000",
      orderDate: "2026-07-30",
      orderType: "AN" as const,
      header: "Proposal AN-1000",
      version: 0,
      taxText: "Umsatzsteuer 19%",
      taxRate: 0,
      addressCountry: refs.country("1"),
      contact: refs.contact("12"),
      contactPerson: refs.sevUser("3"),
      currency: "EUR",
      tax: manualSalesTax()
    };
    const positions = [{ quantity: 1, price: 10, taxRate: 19, unity: refs.unity("1") }] as const;
    const payload = buildOrderPayload({ order, positions });
    expect(payload.order).toMatchObject({
      status: OrderStatus.DRAFT,
      addressCountry: { id: 1, objectName: "StaticCountry" },
      contact: { id: 12, objectName: "Contact" },
      contactPerson: { id: 3, objectName: "SevUser" }
    });
    expect(() =>
      buildOrderPayload({
        order: { ...order, status: OrderStatus.ACCEPTED as never },
        positions
      })
    ).toThrow(/only create.*DRAFT/i);
  });
  it("normalizes numeric response strings and makes future enum values explicit", () => {
    expect(enumName(InvoiceStatus, "200")).toBe("OPEN");
    const futureStatus = rawEnumCode("InvoiceStatus", 125);
    expect(futureStatus).toMatchObject({
      domain: "InvoiceStatus",
      value: 125
    });
    expect(
      buildDeliveryPayload({
        channel: "mark-sent",
        sendType: rawEnumCode("SendType", "NEW")
      }).sendType
    ).toBe("NEW");
  });
  it("rejects malformed document dates at every curated Factory boundary", () => {
    expect(() =>
      buildInvoicePayload({
        invoice: {
          invoiceDate: "31.02.2026",
          contact: refs.contact(1),
          contactPerson: refs.sevUser(2),
          currency: "EUR",
          tax: manualSalesTax()
        },
        positions: [{ quantity: 1, price: 1, taxRate: 19, unity: refs.unity(1) }]
      })
    ).toThrow(/invoice date/i);
    expect(() =>
      buildInvoicePayload({
        invoice: {
          invoiceDate: "2026-07-30",
          sendDate: "tomorrow",
          contact: refs.contact(1),
          contactPerson: refs.sevUser(2),
          currency: "EUR",
          tax: manualSalesTax()
        },
        positions: [{ quantity: 1, price: 1, taxRate: 19, unity: refs.unity(1) }]
      })
    ).toThrow(/sendDate/i);
    expect(() =>
      buildInvoicePayload({
        invoice: {
          invoiceDate: "2026-07-30",
          deliveryDateUntil: -1,
          contact: refs.contact(1),
          contactPerson: refs.sevUser(2),
          currency: "EUR",
          tax: manualSalesTax()
        },
        positions: [{ quantity: 1, price: 1, taxRate: 19, unity: refs.unity(1) }]
      })
    ).toThrow(/deliveryDateUntil/i);
    expect(() =>
      buildOrderPayload({
        order: {
          orderNumber: "AN-1",
          orderDate: "not-a-date",
          orderType: "AN",
          header: "Proposal",
          version: 0,
          addressCountry: refs.country(1),
          contact: refs.contact(1),
          contactPerson: refs.sevUser(2),
          currency: "EUR",
          tax: manualSalesTax()
        },
        positions: [{ quantity: 1, price: 1, taxRate: 19, unity: refs.unity(1) }]
      })
    ).toThrow(/order date/i);
    expect(() =>
      buildVoucherPayload({
        voucher: {
          voucherDate: "2026-02-30",
          creditDebit: "expense",
          tax: manualExpenseTax()
        },
        positions: [
          {
            taxRate: 19,
            net: true,
            sumNet: 1,
            accountDatev: refs.accountDatev(1)
          }
        ]
      })
    ).toThrow(/voucher date/i);
    expect(() =>
      buildCreditNotePayload({
        creditNote: {
          creditNoteDate: "2026/07/30",
          contact: refs.contact(1),
          contactPerson: refs.sevUser(2),
          currency: "EUR",
          tax: manualSalesTax()
        },
        positions: [{ quantity: 1, price: 1, taxRate: 19, unity: refs.unity(1) }]
      })
    ).toThrow(/credit-note date/i);
  });
  it("requires underachievement credit notes for OSS and section 18b tax rules", () => {
    for (const [taxRule, taxRate] of [
      [TaxRule.OSS_ELECTRONIC_SERVICE, 20],
      [TaxRule.REVERSE_CHARGE_18B, 0]
    ] as const) {
      expect(() =>
        buildCreditNotePayload({
          creditNote: {
            creditNoteDate: "2026-07-30",
            contact: refs.contact(1),
            contactPerson: refs.sevUser(2),
            currency: "EUR",
            deliveryAddressCountry: refs.country(3),
            tax: taxes.manual.sales({ bookkeepingSystem: "2.0", taxRule })
          },
          positions: [{ quantity: 1, price: 1, taxRate, unity: refs.unity(1) }]
        })
      ).toThrow(/bookingCategory UNDERACHIEVEMENT/);
    }
    const payload = buildCreditNotePayload({
      creditNote: {
        creditNoteDate: "2026-07-30",
        contact: refs.contact(1),
        contactPerson: refs.sevUser(2),
        currency: "EUR",
        bookingCategory: CreditNoteBookingCategory.UNDERACHIEVEMENT,
        refSrcInvoice: refs.invoice(77).id,
        deliveryAddressCountry: refs.country(3),
        tax: taxes.manual.sales({
          bookkeepingSystem: "2.0",
          taxRule: TaxRule.OSS_ELECTRONIC_SERVICE
        })
      },
      positions: [{ quantity: 1, price: 1, taxRate: 20, unity: refs.unity(1) }]
    });
    expect(payload.creditNote.refSrcInvoice).toBe(77);
    expect(() =>
      buildCreditNotePayload({
        creditNote: {
          creditNoteDate: "2026-07-30",
          contact: refs.contact(1),
          contactPerson: refs.sevUser(2),
          currency: "EUR",
          refSrcInvoice: refs.invoice(77).id,
          tax: manualSalesTax()
        },
        positions: [{ quantity: 1, price: 1, taxRate: 19, unity: refs.unity(1) }]
      } as never)
    ).toThrow(/only valid with bookingCategory UNDERACHIEVEMENT/);
  });
});
