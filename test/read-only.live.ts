import { afterAll, describe, expect, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";

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
});

function requireLiveClient() {
  if (!client) throw new Error("SEVDESK_LIVE_API_TOKEN is required for the live read suite.");
  return client;
}
