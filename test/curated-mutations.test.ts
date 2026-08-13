import axios from "axios";
import { describe, expect, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import { SevdeskConfigurationError } from "../src/utils/errors.js";
import { adapter, jsonResponse, requestJson } from "./helpers.js";

describe("curated update and delete", () => {
  it("updates and deletes contacts with explicit confirm", async () => {
    const calls: string[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(`${config.method}:${config.url}`);
          if (String(config.url).includes("/Contact/") && config.method === "put") {
            expect(requestJson(config)).toMatchObject({ name: "Acme GmbH" });
            return jsonResponse(config, {
              objects: [{ id: "7", objectName: "Contact", name: "Acme GmbH", status: "100" }]
            });
          }
          if (String(config.url).includes("/Contact/") && config.method === "get") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "7",
                  objectName: "Contact",
                  name: "Acme GmbH",
                  status: "100",
                  category: { id: "3", objectName: "Category" }
                }
              ]
            });
          }
          if (String(config.url).includes("/Contact/") && config.method === "delete") {
            return jsonResponse(config, { objects: [] });
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    const updated = await client.contacts.update(7, {
      kind: "organisation",
      name: "Acme GmbH"
    });
    expect(updated.workflow).toBe("contacts.update");
    expect(updated.data.contact.name).toBe("Acme GmbH");
    expect(updated.data.receipt).toMatchObject({
      performed: true,
      operationId: "updateContact",
      status: 200
    });
    expect(updated.steps.map((step) => step.operationId)).toEqual([
      "getContactById",
      "updateContact",
      "getContactById"
    ]);
    await expect(client.contacts.delete(7, { confirm: true })).resolves.toMatchObject({
      performed: true,
      operationId: "deleteContact",
      status: 200
    });
    expect(calls.some((call) => call.startsWith("delete:"))).toBe(true);
    await expect(client.contacts.delete(7, { confirm: false as true })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
  });
  it("updates and deletes only draft invoices", async () => {
    let status: string | number = "100";
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url).includes("/Invoice/") && config.method === "get") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "42",
                  objectName: "Invoice",
                  status,
                  header: status === "100" || status === 100 ? "RE-42" : "RE-1",
                  invoiceType: "RE"
                }
              ]
            });
          }
          if (String(config.url).includes("/Invoice/") && config.method === "put") {
            expect(requestJson(config)).toMatchObject({ header: "RE-42" });
            return jsonResponse(config, {
              objects: [
                {
                  id: "42",
                  objectName: "Invoice",
                  status: "100",
                  header: "RE-42",
                  invoiceType: "RE"
                }
              ]
            });
          }
          if (String(config.url).includes("/Invoice/") && config.method === "delete") {
            return jsonResponse(config, { objects: [] });
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    const updated = await client.invoices.update(42, { header: "RE-42" });
    expect(updated.workflow).toBe("invoices.update");
    expect(updated.data.invoice.header).toBe("RE-42");
    expect(updated.data.receipt.operationId).toBe("updateInvoiceById");
    expect(updated.steps.map((step) => step.operationId)).toEqual([
      "getInvoiceById",
      "updateInvoiceById",
      "getInvoiceById"
    ]);
    await expect(client.invoices.delete(42, { confirm: true })).resolves.toMatchObject({
      performed: true,
      operationId: "deleteInvoiceById",
      status: 200
    });
    status = "200";
    await expect(client.invoices.update(42, { header: "nope" })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    await expect(client.invoices.delete(42, { confirm: true })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
  });
  it("updates and deletes only draft orders", async () => {
    let status: string | number = "100";
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url).includes("/Order/") && config.method === "get") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "9",
                  objectName: "Order",
                  status,
                  header: status === "100" || status === 100 ? "AN-9" : "AN-1",
                  orderType: "AN"
                }
              ]
            });
          }
          if (String(config.url).includes("/Order/") && config.method === "put") {
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
          }
          if (String(config.url).includes("/Order/") && config.method === "delete") {
            return jsonResponse(config, { objects: [] });
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    const updated = await client.orders.update(9, { header: "AN-9" });
    expect(updated.workflow).toBe("orders.update");
    expect(updated.data.order.header).toBe("AN-9");
    expect(updated.data.receipt.operationId).toBe("updateOrder");
    expect(updated.steps.map((step) => step.operationId)).toEqual([
      "getOrderById",
      "updateOrder",
      "getOrderById"
    ]);
    await expect(client.orders.delete(9, { confirm: true })).resolves.toMatchObject({
      performed: true,
      operationId: "deleteOrder",
      status: 200
    });
    status = "200";
    await expect(client.orders.delete(9, { confirm: true })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
  });
  it("updates only draft credit notes", async () => {
    let status: string | number = "100";
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url).includes("/CreditNote/") && config.method === "get") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "8",
                  objectName: "CreditNote",
                  status,
                  header: status === "100" || status === 100 ? "CN-8" : "CN-1"
                }
              ]
            });
          }
          if (String(config.url).includes("/CreditNote/") && config.method === "put") {
            expect(requestJson(config)).toMatchObject({ header: "CN-8" });
            return jsonResponse(config, {
              objects: { id: "8", objectName: "CreditNote", status: "100", header: "CN-8" }
            });
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    const updated = await client.creditNotes.update(8, { header: "CN-8" });
    expect(updated.workflow).toBe("creditNotes.update");
    expect(updated.data.creditNote.header).toBe("CN-8");
    expect(updated.data.receipt.operationId).toBe("updatecreditNote");
    expect(updated.steps.map((step) => step.operationId)).toEqual([
      "getcreditNoteById",
      "updatecreditNote",
      "getcreditNoteById"
    ]);
    status = "200";
    await expect(client.creditNotes.update(8, { header: "nope" })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
  });
  it("updates only draft vouchers", async () => {
    let status: string | number = "50";
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url).includes("/Voucher/") && config.method === "get") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "5",
                  objectName: "Voucher",
                  status,
                  description: status === "50" || status === 50 ? "Draft voucher" : "Open voucher"
                }
              ]
            });
          }
          if (String(config.url).includes("/Voucher/") && config.method === "put") {
            expect(requestJson(config)).toMatchObject({ description: "Draft voucher" });
            return jsonResponse(config, {
              objects: {
                id: "5",
                objectName: "Voucher",
                status: "50",
                description: "Draft voucher"
              }
            });
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    const updated = await client.vouchers.update(5, { description: "Draft voucher" });
    expect(updated.workflow).toBe("vouchers.update");
    expect(updated.data.voucher.description).toBe("Draft voucher");
    expect(updated.data.receipt.operationId).toBe("updateVoucher");
    expect(updated.steps.map((step) => step.operationId)).toEqual([
      "getVoucherById",
      "updateVoucher",
      "getVoucherById"
    ]);
    status = "100";
    await expect(client.vouchers.update(5, { description: "nope" })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
  });
});
