import axios from "axios";
import { describe, expect, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import { SevdeskConfigurationError } from "../src/utils/errors.js";
import { adapter, jsonResponse, requestJson } from "./helpers.js";

describe("layout and parts curated helpers", () => {
  it("lists templates and applies invoice layout keys in order", async () => {
    const calls: Array<{ method?: string; url?: string; body?: unknown }> = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push({
            ...(config.method === undefined ? {} : { method: config.method }),
            ...(config.url === undefined ? {} : { url: config.url }),
            ...(config.data === undefined ? {} : { body: requestJson(config) })
          });
          if (String(config.url).includes("getTemplatesWithThumb")) {
            return jsonResponse(config, {
              result: "1",
              templates: [{ id: "tpl-1", name: "Standard", type: "Invoice" }]
            });
          }
          if (String(config.url).includes("changeParameter")) {
            return jsonResponse(config, { result: "1" });
          }
          if (String(config.url).includes("/render")) {
            return jsonResponse(config, { docId: "doc-1", pages: 1 });
          }
          if (String(config.url).includes("/getXml")) {
            return jsonResponse(config, { objects: "<xml/>" });
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    const templates = await client.layout.listTemplates({ type: "Invoice" });
    expect(templates.json).toMatchObject({
      templates: [{ id: "tpl-1" }]
    });
    await client.invoices.setLayout(42, {
      template: "tpl-1",
      language: "de_DE"
    });
    const layoutCalls = calls.filter((call) => String(call.url).includes("changeParameter"));
    expect(layoutCalls).toHaveLength(2);
    expect(layoutCalls[0]?.body).toEqual({ key: "template", value: "tpl-1" });
    expect(layoutCalls[1]?.body).toEqual({ key: "language", value: "de_DE" });
    await client.invoices.render(42, { forceReload: true });
    expect(calls.some((call) => String(call.url).includes("/render"))).toBe(true);
    await client.invoices.getXml(42);
    expect(calls.some((call) => String(call.url).includes("/getXml"))).toBe(true);
    await expect(client.layout.setInvoiceLayout(1, {} as never)).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
  });
  it("reads templates wrapped in the live objects envelope", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) =>
          jsonResponse(config, {
            objects: {
              templates: [{ id: "tpl-live", name: "Standard", type: "Invoice" }]
            }
          })
        )
      })
    });
    const listed = await client.layout.listTemplates({ type: "Invoice" });
    expect(listed.data[0]?.id).toBe("tpl-live");
    const found = await client.layout.findTemplate({ type: "Invoice", name: "Standard" });
    expect(found?.id).toBe("tpl-live");
  });
  it("lists and gets parts", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url) === "/Part" && config.method === "get") {
            expect(config.params).toMatchObject({ limit: 10, partNumber: "SKU-1" });
            return jsonResponse(config, {
              objects: [{ id: "3", objectName: "Part", name: "Widget", partNumber: "SKU-1" }],
              total: 1
            });
          }
          if (String(config.url).includes("/Part/3") && !String(config.url).includes("getStock")) {
            return jsonResponse(config, {
              objects: [{ id: "3", objectName: "Part", name: "Widget", partNumber: "SKU-1" }]
            });
          }
          if (String(config.url).includes("getStock")) {
            return jsonResponse(config, { objects: 12 });
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    const listed = await client.parts.list({ limit: 10, partNumber: "SKU-1" });
    expect(listed.data).toEqual([expect.objectContaining({ id: "3", partNumber: "SKU-1" })]);
    const one = await client.parts.get(3);
    expect(one.data).toEqual(expect.objectContaining({ name: "Widget" }));
    const stock = await client.parts.getStock(3);
    expect(stock.data).toBe(12);
  });
  it("fetches credit-note PDFs", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          expect(String(config.url)).toContain("/CreditNote/5/getPdf");
          return jsonResponse(config, {
            objects: { filename: "GS-1.pdf", mimetype: "application/pdf", content: "AAA" }
          });
        })
      })
    });
    const pdf = await client.creditNotes.getPdf(5);
    expect(pdf.data).toMatchObject({ filename: "GS-1.pdf" });
  });
});
