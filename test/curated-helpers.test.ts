import axios from "axios";
import { describe, expect, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import { InvoiceType, OrderType, rawEnumCode } from "../src/enums/domain-enums.js";
import { formatSequenceNumber, resolveSequenceQuery } from "../src/bundles/sequences.js";
import { readNextCustomerNumber } from "../src/bundles/contacts.js";
import { formatSevdeskDate, toUnixTimestamp } from "../src/utils/date.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../src/utils/errors.js";
import { adapter, jsonResponse, requestJson } from "./helpers.js";

describe("date helpers", () => {
  it("formats local calendar dates as DD.MM.YYYY", () => {
    expect(formatSevdeskDate(new Date(2026, 7, 13, 12, 0, 0))).toBe("13.08.2026");
    const noon = new Date(2026, 0, 5, 12, 0, 0);
    expect(formatSevdeskDate(toUnixTimestamp(noon))).toBe("05.01.2026");
  });
});

describe("sequence formatting", () => {
  it("replaces %YYYY, %MM, and %NUMBER from the tenant format", () => {
    const at = new Date(2026, 7, 13, 12, 0, 0);
    expect(formatSequenceNumber("RE-%NUMBER", "1000", at)).toBe("RE-1000");
    expect(formatSequenceNumber("%YYYY/%MM/%NUMBER", 42, at)).toBe("2026/08/42");
    expect(formatSequenceNumber("%NUMBER", "1000", at)).toBe("1000");
  });
  it("rejects tenant prefixes as document types", () => {
    for (const type of ["INV.", "INV", "CN.", "OC.", "QUO.", "DN.", "BP.", "AST.", "SKU."]) {
      expect(() =>
        resolveSequenceQuery({ objectType: "Invoice", type: type as never })
      ).toThrow(/tenant number prefix/i);
    }
    expect(resolveSequenceQuery({ objectType: "Invoice", type: InvoiceType.NORMAL })).toEqual({
      objectType: "Invoice",
      type: "RE"
    });
    expect(resolveSequenceQuery({ objectType: "order", type: "confirmation" })).toEqual({
      objectType: "Order",
      type: OrderType.CONFIRMATION
    });
    expect(resolveSequenceQuery({ objectType: "CreditNote", type: "gs" })).toEqual({
      objectType: "CreditNote",
      type: "GS"
    });
    expect(resolveSequenceQuery({ objectType: "Contact" })).toEqual({ objectType: "Contact" });
    expect(() => resolveSequenceQuery({ objectType: "Invoice" })).toThrow(/requires an official type/i);
    expect(() => resolveSequenceQuery({ objectType: "Contact", type: "RE" })).toThrow(
      /does not take a document type/i
    );
    expect(() =>
      resolveSequenceQuery({
        objectType: "Invoice",
        type: rawEnumCode("InvoiceType", "INV")
      })
    ).toThrow(/tenant number prefix/i);
    expect(() =>
      resolveSequenceQuery({
        objectType: "Invoice",
        type: rawEnumCode("InvoiceType", "ZZ")
      })
    ).toThrow(/not an official Invoice class/i);
  });
  it("loads the next formatted number without sending tenant prefixes", async () => {
    const calls: Array<{ url?: string; params?: unknown }> = [];
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
              id: "13272523",
              objectName: "SevSequence",
              forObject: "Invoice",
              format: "RE-%YYYY-%MM-%NUMBER",
              nextSequence: "1000",
              type: "RE"
            }
          });
        })
      })
    });
    const result = await client.sequences.next({
      objectType: "Invoice",
      type: "normal",
      at: new Date(2026, 7, 13, 12, 0, 0)
    });
    expect(calls[0]?.url).toBe("/SevSequence/Factory/getByType");
    expect(calls[0]?.params).toEqual({ objectType: "Invoice", type: "RE" });
    expect(result.data.formatted).toBe("RE-2026-08-1000");
    expect(result.data.sequence.nextSequence).toBe("1000");
    expect(result.objects).toMatchObject({ format: "RE-%YYYY-%MM-%NUMBER" });
    await expect(
      client.sequences.next({ objectType: "Invoice", type: "INV." as never })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toHaveLength(1);
    await expect(
      client.sequences.next({
        objectType: "Invoice",
        type: rawEnumCode("InvoiceType", "INV")
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toHaveLength(1);
  });
});

describe("next customer number", () => {
  it("accepts the live numeric objects payload and the documented string form", () => {
    expect(readNextCustomerNumber(1000)).toBe("1000");
    expect(readNextCustomerNumber("1001")).toBe("1001");
    expect(() => readNextCustomerNumber(undefined)).toThrow(SevdeskResponseValidationError);
  });
  it("exposes the next number as a public contact helper", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          expect(config.url).toBe("/Contact/Factory/getNextCustomerNumber");
          return jsonResponse(config, { objects: 1000 });
        })
      })
    });
    const result = await client.contacts.nextCustomerNumber();
    expect(result.data).toBe("1000");
    expect(result.objects).toBe(1000);
  });
});

describe("curated users", () => {
  it("lists and gets SevUsers with pagination", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url) === "/SevUser" && config.method === "get") {
            expect(config.params).toMatchObject({ limit: 1, countAll: true });
            return jsonResponse(config, {
              objects: [{ id: "1530926", objectName: "SevUser", role: "admin" }],
              total: 1
            });
          }
          if (String(config.url).includes("/SevUser/1530926")) {
            return jsonResponse(config, {
              objects: [{ id: 1530926, objectName: "SevUser", role: "admin" }]
            });
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    const listed = await client.users.list({ limit: 1, countAll: true });
    expect(listed.data[0]?.id).toBe("1530926");
    expect(listed.pagination.total).toBe(1);
    const one = await client.users.get(1530926);
    expect(one.data.objectName).toBe("SevUser");
    expect(one.data.id).toBe("1530926");
  });
});

describe("layout.findTemplate", () => {
  it("returns the unique name match and rejects ambiguity", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          expect(String(config.url)).toContain("getTemplatesWithThumb");
          return jsonResponse(config, {
            result: "1",
            templates: [
              { id: "tpl-1", name: "Standard", type: "Invoice" },
              { id: "tpl-2", name: "TEMPLATE_STANDARD", type: "Invoice" }
            ]
          });
        })
      })
    });
    const found = await client.layout.findTemplate({ type: "Invoice", name: "Standard" });
    expect(found?.id).toBe("tpl-1");
    await expect(
      client.layout.findTemplate({ type: "Invoice", name: "Missing" })
    ).resolves.toBeUndefined();
  });
  it("rejects duplicate template names", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) =>
          jsonResponse(config, {
            templates: [
              { id: "a", name: "Standard", type: "Invoice" },
              { id: "b", name: "Standard", type: "Invoice" }
            ]
          })
        )
      })
    });
    await expect(client.layout.findTemplate({ name: "Standard" })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
  });
});

describe("invoice position list", () => {
  it("lists positions for one invoice with pagination", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          expect(config.method).toBe("get");
          expect(config.url).toBe("/Invoice/42/getPositions");
          expect(config.params).toMatchObject({
            limit: 50,
            offset: 0,
            countAll: true,
            embed: ["part", "unity"]
          });
          return jsonResponse(config, {
            objects: [
              {
                id: "9",
                objectName: "InvoicePos",
                taxRate: "19",
                invoice: { id: "42", objectName: "Invoice" }
              }
            ],
            total: 1
          });
        })
      })
    });
    const listed = await client.invoices.listPositions("42", {
      limit: 50,
      offset: 0,
      countAll: true,
      embed: ["part", "unity"]
    });
    expect(listed.data).toHaveLength(1);
    expect(listed.data[0]?.id).toBe("9");
    expect(listed.data[0]?.objectName).toBe("InvoicePos");
    expect(listed.data[0]?.taxRate).toBe("19");
    expect(listed.pagination).toMatchObject({ limit: 50, offset: 0, total: 1, returned: 1 });
    expect(listed.objects[0]?.id).toBe("9");
    await expect(client.invoices.listPositions(42, { limit: 0 })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
  });
});

describe("invoice enshrine and position update", () => {
  it("enshrines through the generated invoiceEnshrine operation", async () => {
    const calls: string[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(`${config.method}:${config.url}`);
          return jsonResponse(config, { objects: { objects: "enshrined" } });
        })
      })
    });
    const result = await client.invoices.enshrine(42);
    expect(calls).toEqual(["put:/Invoice/42/enshrine"]);
    expect(result.response.status).toBe(200);
  });
  it("updates a draft invoice position through raw InvoicePos PUT", async () => {
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
          if (String(config.url) === "/InvoicePos" && config.method === "get") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "9",
                  objectName: "InvoicePos",
                  price: "10",
                  invoice: { id: "42", objectName: "Invoice" }
                }
              ]
            });
          }
          if (String(config.url).includes("/Invoice/42") && config.method === "get") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "42",
                  objectName: "Invoice",
                  status: "100",
                  invoiceType: "RE"
                }
              ]
            });
          }
          if (String(config.url) === "/InvoicePos/9" && config.method === "put") {
            expect(requestJson(config)).toMatchObject({ price: 25 });
            return jsonResponse(config, {
              objects: [
                {
                  id: "9",
                  objectName: "InvoicePos",
                  price: "25",
                  invoice: { id: "42", objectName: "Invoice" }
                }
              ]
            });
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    const updated = await client.invoices.updatePosition(9, { price: 25 });
    expect(updated.workflow).toBe("invoices.updatePosition");
    expect(updated.data.receipt.operationId).toBe("updateInvoicePos");
    expect(updated.steps.map((step) => step.operationId)).toEqual([
      "getInvoicePos",
      "getInvoiceById",
      "updateInvoicePos",
      "getInvoicePos"
    ]);
    expect(calls.some((call) => call.method === "put" && call.url === "/InvoicePos/9")).toBe(true);
    const sentClient = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url) === "/InvoicePos" && config.method === "get") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "9",
                  objectName: "InvoicePos",
                  invoice: { id: "42", objectName: "Invoice" }
                }
              ]
            });
          }
          if (String(config.url).includes("/Invoice/42") && config.method === "get") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "42",
                  objectName: "Invoice",
                  status: "200",
                  invoiceType: "RE"
                }
              ]
            });
          }
          if (config.method === "put") {
            throw new Error("sent invoices must not receive a position PUT");
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    await expect(sentClient.invoices.updatePosition(9, { price: 25 })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
  });
});
