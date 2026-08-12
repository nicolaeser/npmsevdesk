import axios from "axios";
import { describe, expect, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import {
  normalizeContact,
  normalizeCreditNote,
  normalizeCreatedInvoice,
  normalizeInvoice,
  normalizeOrder,
  normalizeVoucher
} from "../src/domain/normalizers.js";
import { SevdeskResponseValidationError } from "../src/utils/errors.js";
import { adapter, jsonResponse } from "./helpers.js";

describe("curated domain normalization", () => {
  it("turns sevdesk status and boolean strings into readable values", () => {
    const invoice = normalizeInvoice({
      id: "42",
      objectName: "Invoice",
      status: "200",
      invoiceType: "RE",
      sendType: "VM",
      taxType: "default",
      taxRule: { id: 1, objectName: "TaxRule" }
    });
    const contact = normalizeContact({
      id: "7",
      objectName: "Contact",
      status: "1000",
      taxType: "eu",
      exemptVat: "0",
      governmentAgency: "1"
    });
    expect(invoice).toMatchObject({
      id: "42",
      status: "OPEN",
      statusCode: 200,
      statusKnown: true,
      invoiceType: "RE",
      semantic: {
        invoiceType: { name: "NORMAL", code: "RE", known: true },
        sendType: { name: "EMAIL", code: "VM", known: true },
        taxType: { name: "DEFAULT", code: "default", known: true },
        taxRule: { name: "STANDARD_TAXABLE", code: 1, known: true }
      }
    });
    expect(contact).toMatchObject({
      id: "7",
      status: "ACTIVE",
      statusCode: 1000,
      exemptVat: false,
      governmentAgency: true,
      semantic: {
        taxType: { name: "EU", code: "eu", known: true }
      }
    });
  });
  it("retains unknown future status codes without pretending to understand them", () => {
    expect(
      normalizeInvoice({
        id: "42",
        objectName: "Invoice",
        status: "4711" as never,
        invoiceType: "FUTURE" as never
      })
    ).toMatchObject({
      status: "UNKNOWN",
      statusCode: 4711,
      statusKnown: false,
      semantic: {
        invoiceType: {
          name: "UNKNOWN",
          code: "FUTURE",
          known: false
        }
      }
    });
  });
  it("normalizes every curated document family and its coded companions", () => {
    expect(
      normalizeOrder({
        id: "8",
        objectName: "Order",
        status: "500",
        orderType: "AN",
        sendType: "VPDF"
      })
    ).toMatchObject({
      status: "ACCEPTED",
      statusCode: 500,
      semantic: {
        orderType: { name: "ESTIMATE", code: "AN", known: true },
        sendType: { name: "DOWNLOADED_PDF", code: "VPDF", known: true }
      }
    });
    expect(
      normalizeVoucher({
        id: "9",
        objectName: "Voucher",
        status: "150",
        voucherType: "VOU",
        creditDebit: "C"
      })
    ).toMatchObject({
      status: "TRANSFERRED",
      statusCode: 150,
      semantic: {
        voucherType: { name: "NORMAL", code: "VOU", known: true },
        direction: { name: "EXPENSE", code: "C", known: true }
      }
    });
    expect(
      normalizeCreditNote({
        id: "10",
        objectName: "CreditNote",
        status: "750",
        sendType: null
      })
    ).toMatchObject({
      status: "PARTIALLY_PAID",
      statusCode: 750,
      semantic: {
        sendType: { name: "NOT_SENT", code: null, known: true }
      }
    });
  });
  it("validates identities and Factory response structure", () => {
    expect(() =>
      normalizeInvoice({ id: "42", objectName: "Wrong" as "Invoice", status: "200" })
    ).toThrow(SevdeskResponseValidationError);
    expect(() => normalizeInvoice({ objectName: "Invoice", status: "200" })).toThrow(
      SevdeskResponseValidationError
    );
    expect(() => normalizeCreatedInvoice(undefined)).toThrow(SevdeskResponseValidationError);
  });
  it("normalizes curated data while preserving the unchanged wire response", async () => {
    const instance = axios.create({
      adapter: adapter((config) =>
        jsonResponse(config, {
          objects: [
            {
              id: "42",
              objectName: "Invoice",
              invoiceNumber: "RE-42",
              status: "200"
            }
          ],
          total: 1
        })
      )
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    const result = await client.invoices.list({ status: "open", countAll: true });
    expect(result.data[0]).toMatchObject({
      status: "OPEN",
      statusCode: 200,
      statusKnown: true
    });
    expect(result.objects[0]?.status).toBe("200");
    expect(result.json.objects[0]?.status).toBe("200");
    expect(result.toJSON()).toBe(result.json);
  });
  it("keeps tenant invoice numbers and unknown type codes on the wire", () => {
    const invoice = normalizeInvoice({
      id: "42",
      objectName: "Invoice",
      invoiceNumber: "INV-2024-0001",
      header: "Invoice INV-2024-0001",
      invoiceType: "RE",
      status: "200"
    });
    expect(invoice.invoiceNumber).toBe("INV-2024-0001");
    expect(invoice.header).toBe("Invoice INV-2024-0001");
    expect(invoice.semantic.invoiceType).toEqual({
      name: "NORMAL",
      code: "RE",
      known: true
    });
    const unknownType = normalizeInvoice({
      id: "43",
      objectName: "Invoice",
      invoiceNumber: "INV-2024-0002",
      invoiceType: "XX" as never,
      status: "100"
    });
    expect(unknownType.invoiceNumber).toBe("INV-2024-0002");
    expect(unknownType.semantic.invoiceType).toEqual({
      name: "UNKNOWN",
      code: "XX",
      known: false
    });
  });
});
