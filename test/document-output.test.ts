import axios from "axios";
import { describe, expect, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../src/utils/errors.js";
import { adapter, jsonResponse, responseError } from "./helpers.js";

describe("curated document output", () => {
  it("normalizes PDF envelopes and sends documented query parameters", async () => {
    const calls: Array<{ readonly url?: string; readonly params?: unknown }> = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push({
            ...(config.url === undefined ? {} : { url: config.url }),
            ...(config.params === undefined ? {} : { params: config.params })
          });
          return jsonResponse(config, {
            objects: {
              base64encoded: true,
              content: "UERG",
              filename: "RE-1.pdf",
              mimetype: "application/pdf"
            }
          });
        })
      })
    });
    const invoice = await client.invoices.getPdf(1);
    expect(invoice.data).toEqual({
      base64Encoded: true,
      content: "UERG",
      filename: "RE-1.pdf",
      mimeType: "application/pdf"
    });
    expect(invoice.objects).toMatchObject({ base64encoded: true, content: "UERG" });
    expect(calls[0]).toMatchObject({
      url: "/Invoice/1/getPdf",
      params: { download: true, preventSendBy: true }
    });
    await client.creditNotes.getPdf(2, { markAsDownloaded: true });
    expect(calls[1]).toMatchObject({
      url: "/CreditNote/2/getPdf",
      params: { download: true, preventSendBy: false }
    });
    await client.orders.getPdf(3, { confirmCommit: true, download: false });
    expect(calls[2]).toMatchObject({
      url: "/Order/3/getPdf",
      params: { download: false, preventSendBy: true }
    });
  });
  it("requires requested PDF content instead of hiding malformed responses", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => jsonResponse(config, { objects: { filename: "RE-1.pdf" } }))
      })
    });
    await expect(client.invoices.getPdf(1)).rejects.toBeInstanceOf(SevdeskResponseValidationError);
  });
  it("returns input-correlated render data and required XML", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (config.url?.endsWith("/render")) {
            return config.params?.getAsPdf === true
              ? jsonResponse(config, { pdf: "UERG", docId: "pdf-doc" })
              : jsonResponse(config, { docId: "meta-doc", pages: 2, thumbs: ["thumb"] });
          }
          if (config.url?.endsWith("/getXml")) {
            return jsonResponse(config, { objects: '<?xml version="1.0"?><invoice/>' });
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const metadata = await client.invoices.render(1, { forceReload: true });
    expect(metadata.data).toEqual({
      kind: "metadata",
      docId: "meta-doc",
      pages: 2,
      thumbs: ["thumb"]
    });
    const pdf = await client.invoices.render(1, { getAsPdf: true });
    expect(pdf.data).toEqual({ kind: "pdf", pdf: "UERG", docId: "pdf-doc" });
    const xml = await client.invoices.getXml(1);
    expect(xml.data).toBe('<?xml version="1.0"?><invoice/>');
    expect(xml.json).toEqual({ objects: '<?xml version="1.0"?><invoice/>' });
  });
  it("rejects empty invoice XML", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => jsonResponse(config, { objects: "  " }))
      })
    });
    await expect(client.invoices.getXml(1)).rejects.toBeInstanceOf(SevdeskResponseValidationError);
  });
  it("normalizes reset, packing-list and contract-note resources", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          if (config.url === "/Invoice/1/resetToDraft") {
            return jsonResponse(config, { objects: invoice(1, "100") });
          }
          if (config.url === "/Invoice/1/resetToOpen") {
            return jsonResponse(config, { objects: invoice(1, "200") });
          }
          if (config.url === "/CreditNote/2/resetToDraft") {
            return jsonResponse(config, { objects: creditNote(2, "100") });
          }
          if (config.url === "/CreditNote/2/resetToOpen") {
            return jsonResponse(config, { objects: creditNote(2, "200") });
          }
          if (config.url?.includes("createPackingListFromOrder")) {
            return jsonResponse(config, { objects: order(31, "100") });
          }
          if (config.url?.includes("createContractNoteFromOrder")) {
            return jsonResponse(config, { objects: order(32, "100") });
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    await expect(client.invoices.resetToOpen(1, {} as never)).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    expect(calls).toBe(0);
    expect((await client.invoices.resetToDraft(1)).data.status).toBe("DRAFT");
    expect(
      (await client.invoices.resetToOpen(1, { confirmUnlinkTransactions: true })).data.status
    ).toBe("OPEN");
    expect((await client.creditNotes.resetToDraft(2)).data.status).toBe("DRAFT");
    expect(
      (await client.creditNotes.resetToOpen(2, { confirmUnlinkTransactions: true })).data.status
    ).toBe("OPEN");
    expect((await client.orders.createPackingList(3)).data).toMatchObject({
      id: "31",
      objectName: "Order",
      status: "DRAFT"
    });
    expect((await client.orders.createContractNote(3)).data).toMatchObject({
      id: "32",
      objectName: "Order",
      status: "DRAFT"
    });
  });
  it("never retries the potentially committing order PDF endpoint", async () => {
    let attempts = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: {
        attempts: 2,
        baseDelayMs: 0,
        maxDelayMs: 0,
        unsafeOperations: true
      },
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          attempts += 1;
          return Promise.reject(responseError(config, 503, {}));
        })
      })
    });
    await expect(client.orders.getPdf(1, { confirmCommit: true })).rejects.toThrow();
    expect(attempts).toBe(1);
  });
});

function invoice(id: number, status: string) {
  return { id: String(id), objectName: "Invoice", status };
}

function creditNote(id: number, status: string) {
  return { id: String(id), objectName: "CreditNote", status };
}

function order(id: number, status: string) {
  return { id: String(id), objectName: "Order", status };
}
