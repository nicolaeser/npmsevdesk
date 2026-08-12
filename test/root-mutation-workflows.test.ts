import axios from "axios";
import { describe, expect, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import { SevdeskConfigurationError } from "../src/utils/errors.js";
import { SevdeskWorkflowError } from "../src/bundles/workflow.js";
import { adapter, jsonResponse, responseError } from "./helpers.js";

describe("root mutation workflow evidence", () => {
  it("rejects a contact-kind mismatch before sending the update", async () => {
    let putCalls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (config.method === "put") {
            putCalls += 1;
          }
          return jsonResponse(config, {
            objects: [
              {
                id: "7",
                objectName: "Contact",
                surename: "Ada",
                familyname: "Lovelace",
                status: "100"
              }
            ]
          });
        })
      })
    });
    await expect(
      client.contacts.update(7, { kind: "organisation", name: "Lovelace Ltd" })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(putCalls).toBe(0);
  });
  it("preserves a successful invoice PUT when final hydration fails", async () => {
    let getCalls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: false,
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (config.method === "get") {
            getCalls += 1;
            if (getCalls > 1) {
              return Promise.reject(
                responseError(config, 503, { message: "temporarily unavailable" })
              );
            }
            return jsonResponse(config, {
              objects: [
                {
                  id: "42",
                  objectName: "Invoice",
                  status: "100",
                  header: "Before",
                  invoiceType: "RE"
                }
              ]
            });
          }
          return jsonResponse(config, {
            objects: {
              id: "42",
              objectName: "Invoice",
              status: "100",
              header: "After",
              invoiceType: "RE"
            }
          });
        })
      })
    });
    let caught: unknown;
    try {
      await client.invoices.update(42, { header: "After" });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SevdeskWorkflowError);
    const error = caught as SevdeskWorkflowError<
      {
        readonly before?: { readonly id: string };
        readonly receipt?: { readonly operationId: "updateInvoiceById"; readonly performed: true };
      },
      "invoices.update",
      "getInvoiceById" | "updateInvoiceById"
    >;
    expect(error.failedOperationId).toBe("getInvoiceById");
    expect(error.completedSteps.map((step) => step.operationId)).toEqual([
      "getInvoiceById",
      "updateInvoiceById"
    ]);
    expect(error.partial.before?.id).toBe("42");
    expect(error.partial.receipt).toMatchObject({
      performed: true,
      operationId: "updateInvoiceById",
      status: 200
    });
    expect(error.retrySafe).toBe(false);
  });
  it("never retries an order workflow write even when unsafe retries are globally enabled", async () => {
    let putCalls = 0;
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
          if (config.method === "put") {
            putCalls += 1;
            return Promise.reject(responseError(config, 503, { message: "write outcome unknown" }));
          }
          return jsonResponse(config, {
            objects: [
              {
                id: "9",
                objectName: "Order",
                status: "100",
                header: "AN-9",
                orderType: "AN"
              }
            ]
          });
        })
      })
    });
    await expect(client.orders.update(9, { header: "After" })).rejects.toBeInstanceOf(
      SevdeskWorkflowError
    );
    expect(putCalls).toBe(1);
  });
});
