import { afterAll, describe, expect, it } from "vitest";
import { InvoiceType } from "../src/enums/domain-enums.js";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import { formatSevdeskDate } from "../src/utils/date.js";

const apiToken = process.env.SEVDESK_LIVE_API_TOKEN;
const enabled = typeof apiToken === "string" && apiToken.trim().length > 0;
const client = enabled
  ? createSevdeskClient({
      apiToken,
      ...(process.env.SEVDESK_LIVE_BASE_URL ? { baseURL: process.env.SEVDESK_LIVE_BASE_URL } : {}),
      retries: { attempts: 1 }
    })
  : undefined;

describe.skipIf(!enabled)("sevdesk read-only live contract", () => {
  afterAll(() => client?.dispose());
  it("lists contacts without modifying tenant state", async () => {
    const result = await requireLiveClient().raw.contact.getContacts({
      query: { limit: 1, offset: 0, countAll: true }
    });
    expect(result.raw.status).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
  });
  it("lists invoices without modifying tenant state", async () => {
    const result = await requireLiveClient().raw.invoice.getInvoices({
      query: { limit: 1, offset: 0, countAll: true }
    });
    expect(result.raw.status).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
  });
  it("lists vouchers without modifying tenant state", async () => {
    const result = await requireLiveClient().raw.voucher.getVouchers({
      query: { limit: 1, offset: 0, countAll: true }
    });
    expect(result.raw.status).toBe(200);
    expect(Array.isArray(result.data)).toBe(true);
  });
  it("formats the next official invoice number from the tenant sequence", async () => {
    const result = await requireLiveClient().sequences.next({
      objectType: "Invoice",
      type: InvoiceType.NORMAL
    });
    expect(result.raw.status).toBe(200);
    expect(result.data.sequence.objectName).toBe("SevSequence");
    expect(result.data.format.includes("%NUMBER") || result.data.formatted.length > 0).toBe(true);
    expect(result.data.formatted).toBeTruthy();
    expect(result.data.type).toBe("RE");
  });
  it("lists SevUsers and the next customer number", async () => {
    const users = await requireLiveClient().users.list({ limit: 1, countAll: true });
    expect(users.raw.status).toBe(200);
    expect(users.data[0]?.objectName).toBe("SevUser");
    const next = await requireLiveClient().contacts.nextCustomerNumber();
    expect(next.raw.status).toBe(200);
    expect(next.data).toMatch(/^\d+$/);
  });
  it("lists check accounts, transactions, tags, and text templates", async () => {
    const live = requireLiveClient();
    const accounts = await live.checkAccounts.list({ limit: 1, countAll: true });
    expect(accounts.raw.status).toBe(200);
    expect(accounts.pagination.returned).toBeGreaterThanOrEqual(0);
    const accountId = Number(accounts.data[0]?.id);
    if (Number.isSafeInteger(accountId) && accountId > 0) {
      const found = await live.checkAccounts.get(accountId);
      expect(found.raw.status).toBe(200);
      expect(found.data.objectName).toBe("CheckAccount");
    }
    const transactions = await live.transactions.list({ limit: 1, countAll: true });
    expect(transactions.raw.status).toBe(200);
    const tags = await live.tags.list({ limit: 1, countAll: true });
    expect(tags.raw.status).toBe(200);
    const templates = await live.textTemplates.list({ limit: 1, countAll: true });
    expect(templates.raw.status).toBe(200);
  });
  it("can select a layout template by name when the tenant has one", async () => {
    const listed = await requireLiveClient().layout.listTemplates({ type: "Invoice" });
    expect(listed.raw.status).toBe(200);
    const first = listed.data[0];
    if (first?.name) {
      const found = await requireLiveClient().layout.findTemplate({
        type: "Invoice",
        name: first.name
      });
      expect(found?.id).toBe(first.id);
    }
    expect(formatSevdeskDate(new Date(2026, 7, 13, 12, 0, 0))).toBe("13.08.2026");
  });
});

function requireLiveClient() {
  if (!client) throw new Error("SEVDESK_LIVE_API_TOKEN is required for the live read suite.");
  return client;
}
