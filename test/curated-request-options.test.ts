import axios, { type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { createSevdeskClient, refs, taxes, type CuratedRequestOptions } from "../src/index.js";
import { adapter, jsonResponse, responseError } from "./helpers.js";

function invoiceInput() {
  return {
    invoice: {
      invoiceDate: "30.07.2026",
      contact: refs.contact(1),
      contactPerson: refs.sevUser(2),
      currency: "EUR",
      tax: taxes.manual.sales({ bookkeepingSystem: "2.0", taxRule: 1 })
    },
    positions: [
      {
        quantity: 1,
        price: 100,
        name: "Service",
        taxRate: 19,
        unity: refs.unity(1)
      }
    ]
  } as const;
}

describe("curated per-call request options", () => {
  it("applies transport controls to a one-operation curated method", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const controller = new AbortController();
    const instance = axios.create({
      adapter: adapter((config) => {
        calls.push(config);
        return jsonResponse(config, {
          objects: [{ id: "42", objectName: "Invoice", status: "200" }]
        });
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    const requestOptions = {
      signal: controller.signal,
      timeoutMs: 1_234,
      resourceVersion: "2.0",
      headers: { "X-Curated-Test": "single" },
      retry: false,
      axios: { maxRedirects: 0 }
    } satisfies CuratedRequestOptions;
    await client.invoices.list({ status: "open" }, requestOptions);
    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error("Expected one curated request.");
    expect(call.timeout).toBe(1_234);
    expect(call.signal).toBe(controller.signal);
    expect(call.maxRedirects).toBe(0);
    expect(call.headers.get("X-Version")).toBe("2.0");
    expect(call.headers.get("X-Curated-Test")).toBe("single");
  });
  it("propagates the same options to every request in a workflow", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const controller = new AbortController();
    const instance = axios.create({
      adapter: adapter((config) => {
        calls.push(config);
        if (config.url === "/Invoice/Factory/saveInvoice") {
          return jsonResponse(
            config,
            {
              objects: {
                invoice: { id: "42", objectName: "Invoice", status: "100" },
                invoicePos: []
              }
            },
            201
          );
        }
        if (config.url === "/Invoice/42/sendBy") {
          return jsonResponse(config, {
            objects: { id: "42", objectName: "Invoice", status: "200" }
          });
        }
        if (config.url === "/Invoice/42/bookAmount") {
          return jsonResponse(config, { objects: { id: "9", objectName: "InvoiceLog" } });
        }
        throw new Error(`Unexpected request ${config.method} ${config.url}`);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    const requestOptions = {
      signal: controller.signal,
      timeoutMs: 2_468,
      resourceVersion: "3.1",
      headers: { "X-Curated-Test": "workflow" },
      retry: false
    } satisfies CuratedRequestOptions;
    await client.invoices.createAndFinalize(
      {
        ...invoiceInput(),
        delivery: { channel: "mark-sent" },
        booking: {
          amount: 119,
          date: new Date("2026-07-30T10:00:00Z"),
          checkAccount: refs.checkAccount(3)
        }
      },
      requestOptions
    );
    expect(calls.map((call) => call.url)).toEqual([
      "/Invoice/Factory/saveInvoice",
      "/Invoice/42/sendBy",
      "/Invoice/42/bookAmount"
    ]);
    for (const call of calls) {
      expect(call.timeout).toBe(2_468);
      expect(call.signal).toBe(controller.signal);
      expect(call.headers.get("X-Version")).toBe("3.1");
      expect(call.headers.get("X-Curated-Test")).toBe("workflow");
    }
  });
  it("honours a per-call retry override on a curated read", async () => {
    let attempts = 0;
    const instance = axios.create({
      adapter: adapter((config) => {
        attempts += 1;
        if (attempts === 1) {
          return Promise.reject(responseError(config, 503, { message: "try again" }));
        }
        return jsonResponse(config, {
          objects: [{ id: "42", objectName: "Invoice", status: "200" }]
        });
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance,
      retries: {
        attempts: 0,
        baseDelayMs: 0,
        maxDelayMs: 0
      }
    });
    await client.invoices.list({}, { retry: { attempts: 1 } });
    expect(attempts).toBe(2);
  });
});
