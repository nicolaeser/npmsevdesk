import { afterAll, describe, expect, it } from "vitest";
import { TaxRule } from "../src/enums/domain-enums.js";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import { taxes } from "../src/taxes/presets.js";
import { refs } from "../src/types/references.js";

const WRITE_CONFIRMATION = "CREATE_AND_CLEAN_NPMSEVDESK_TEST_DRAFTS";
const VOUCHER_CONFIRMATION = "LEAVE_MARKED_NPMSEVDESK_VOUCHER_DRAFT";
const apiToken = process.env.SEVDESK_LIVE_API_TOKEN;
const marker = process.env.SEVDESK_LIVE_MARKER;
const markerValid =
  typeof marker === "string" &&
  /^npmsevdesk-live-[a-z0-9][a-z0-9-]{7,64}$/.test(marker) &&
  marker !== "npmsevdesk-live-test";
const writesEnabled =
  typeof apiToken === "string" &&
  apiToken.trim().length > 0 &&
  markerValid &&
  process.env.SEVDESK_LIVE_WRITE_CONFIRM === WRITE_CONFIRMATION;
const voucherEnabled =
  writesEnabled && process.env.SEVDESK_LIVE_VOUCHER_CONFIRM === VOUCHER_CONFIRMATION;

const client = writesEnabled
  ? createSevdeskClient({
      apiToken,
      ...(process.env.SEVDESK_LIVE_BASE_URL ? { baseURL: process.env.SEVDESK_LIVE_BASE_URL } : {}),
      retries: false
    })
  : undefined;

afterAll(() => client?.dispose());

describe.skipIf(!writesEnabled)("sevdesk guarded live draft writes", () => {
  it("creates and deletes a uniquely marked contact", async () => {
    let contactId: number | undefined;
    try {
      const created = await requireLiveClient().contacts.create(
        {
          contact: {
            kind: "organisation",
            name: `${marker} contact`,
            category: "customer",
            customerNumber: "next"
          }
        },
        { rollback: "best-effort" }
      );
      contactId = numericId(created.data.contact.id, "created contact");
      expect(created.data.contact.objectName).toBe("Contact");
    } finally {
      if (contactId !== undefined) {
        await requireLiveClient().raw.contact.deleteContact({ path: { contactId } });
      }
    }
  });
  it("creates and deletes a uniquely marked invoice draft without sending or booking", async () => {
    const contactId = requiredId("SEVDESK_LIVE_INVOICE_CONTACT_ID");
    const sevUserId = requiredId("SEVDESK_LIVE_SEV_USER_ID");
    const unityId = requiredId("SEVDESK_LIVE_UNITY_ID");
    let invoiceId: number | undefined;
    try {
      const created = await requireLiveClient().invoices.create({
        invoice: {
          invoiceDate: sevdeskDate(new Date()),
          header: `${marker} invoice draft`,
          contact: refs.contact(contactId),
          contactPerson: refs.sevUser(sevUserId),
          currency: "EUR",
          tax: taxes.manual.sales({
            bookkeepingSystem: "2.0",
            taxRule: TaxRule.STANDARD_TAXABLE
          })
        },
        positions: [
          {
            name: `${marker} contract-test position`,
            quantity: 1,
            price: 1,
            taxRate: 19,
            unity: refs.unity(unityId)
          }
        ]
      });
      invoiceId = numericId(created.data.invoice.id, "created invoice");
      expect(created.data.invoice.status).toBe("DRAFT");
    } finally {
      if (invoiceId !== undefined) {
        await requireLiveClient().raw.invoice.deleteInvoiceById({ path: { invoiceId } });
      }
    }
  });
});

describe.skipIf(!voucherEnabled)("sevdesk strongly guarded voucher draft write", () => {
  it("leaves one uniquely marked voucher draft and reports its id", async () => {
    const accountDatevId = requiredId("SEVDESK_LIVE_ACCOUNT_DATEV_ID");
    const created = await requireLiveClient().vouchers.create({
      voucher: {
        voucherDate: sevdeskDate(new Date()),
        supplierName: `${marker} voucher draft - SAFE TO DELETE`,
        creditDebit: "expense",
        status: "draft",
        tax: taxes.manual.expense({
          bookkeepingSystem: "2.0",
          taxRule: TaxRule.DEDUCTIBLE_INPUT_TAX
        })
      },
      positions: [
        {
          taxRate: 19,
          net: true,
          sumNet: 1,
          accountDatev: refs.accountDatev(accountDatevId)
        }
      ]
    });
    const voucherId = numericId(created.data.voucher.id, "created voucher");
    expect(created.data.voucher.status).toBe("DRAFT");
    console.warn(
      `[npmsevdesk live test] voucher draft ${voucherId} was intentionally left behind with marker "${marker}". Delete it manually in the test tenant.`
    );
  });
});

function requireLiveClient() {
  if (!client) {
    throw new Error(
      "Live writes require the API token, unique marker, and exact write confirmation."
    );
  }
  return client;
}

function requiredId(name: string): number {
  const value = process.env[name];
  if (!value || !/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive numeric sevdesk id for the live write suite.`);
  }
  return numericId(value, name);
}

function numericId(value: string | number, label: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} did not contain a positive numeric sevdesk id.`);
  }
  return parsed;
}

function sevdeskDate(value: Date): string {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${value.getFullYear()}`;
}
