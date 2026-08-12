import axios, { type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import { InvoiceFromOrderPartialType, rawEnumCode } from "../src/enums/domain-enums.js";
import { taxes } from "../src/taxes/presets.js";
import { refs } from "../src/types/references.js";
import { SevdeskWorkflowError } from "../src/bundles/workflow.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../src/utils/errors.js";
import { adapter, jsonResponse, requestJson, responseError } from "./helpers.js";

function invoiceInput() {
  return {
    invoice: {
      invoiceDate: "2026-07-30",
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

describe("invoice workflows", () => {
  it("keeps workflow error logs metadata-only", () => {
    const events: unknown[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      logger: { log: (event) => events.push(event) },
      logging: { events: ["workflow-error"] }
    });
    client
      .createWorkflowContext("logging-redaction")
      .error(new Error("private customer and invoice details"));
    expect(JSON.stringify(events)).not.toContain("private customer and invoice details");
    expect(JSON.stringify(events)).toContain('"causeType":"Error"');
    client.dispose();
  });
  it("emits workflow-step and workflow-error events through client logging", async () => {
    const events: Array<{
      type: string;
      operationId?: string | undefined;
      details?: unknown;
    }> = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url).includes("Factory")) {
            return jsonResponse(config, {
              objects: {
                invoice: { id: "10", objectName: "Invoice", status: "100" },
                invoicePos: []
              }
            });
          }
          return Promise.reject(responseError(config, 500, { message: "book failed" }));
        })
      }),
      logger: {
        log: (event) => {
          events.push(event);
        }
      },
      logging: {
        events: ["workflow-step", "workflow-error"],
        includeTimings: true
      }
    });
    await expect(
      client.invoices.createAndBook({
        ...invoiceInput(),
        booking: {
          amount: 119,
          date: new Date("2026-07-30T12:00:00.000Z"),
          checkAccount: refs.checkAccount(3)
        }
      } as never)
    ).rejects.toBeInstanceOf(SevdeskWorkflowError);
    const types = events.map((event) => event.type);
    expect(types).toContain("workflow-step");
    expect(types).toContain("workflow-error");
    expect(
      events.some(
        (event) => event.type === "workflow-step" && event.operationId === "createInvoiceByFactory"
      )
    ).toBe(true);
    expect(
      events.some(
        (event) =>
          event.type === "workflow-error" &&
          typeof event.details === "object" &&
          event.details !== null &&
          "workflow" in event.details
      )
    ).toBe(true);
  });
  it("rejects an actionless finalising plan before creating a draft", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, {});
        })
      })
    });
    await expect(client.invoices.createAndFinalize(invoiceInput() as never)).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    expect(calls).toBe(0);
  });
  it("validates a requested booking before creating a draft", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, {});
        })
      })
    });
    await expect(
      client.invoices.createAndFinalize({
        ...invoiceInput(),
        booking: {
          amount: Number.NaN,
          date: new Date("invalid"),
          checkAccount: refs.checkAccount(3)
        }
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
  });
  it("rejects sendDraft delivery before creating a draft", async () => {
    let calls = 0;
    const instance = axios.create({
      adapter: adapter((config) => {
        calls += 1;
        return jsonResponse(config, {});
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    await expect(
      client.invoices.createAndFinalize({
        ...invoiceInput(),
        delivery: { channel: "mark-sent", sendDraft: true } as never
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
  });
  it("creates, sends and books without any additional save confirmation", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const instance = axios.create({
      adapter: adapter((config) => {
        calls.push(config);
        if (config.url === "/Invoice/Factory/saveInvoice") {
          return jsonResponse(
            config,
            {
              objects: {
                invoice: {
                  id: "42",
                  objectName: "Invoice",
                  status: "100"
                },
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
          return jsonResponse(config, { id: "9", objectName: "InvoiceLog" });
        }
        if (config.url === "/Invoice/42/enshrine") {
          return jsonResponse(config, {});
        }
        throw new Error(`Unexpected request ${config.method} ${config.url}`);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    const result = await client.invoices.createAndFinalize(
      {
        ...invoiceInput(),
        delivery: { channel: "mark-sent", sendType: "downloaded_pdf" },
        booking: {
          amount: 119,
          date: new Date("2026-07-30T10:00:00Z"),
          checkAccount: refs.checkAccount(3)
        },
        enshrine: true
      },
      {
        retry: { attempts: 5, unsafe: true }
      }
    );
    expect(result.steps.map((step) => step.operationId)).toEqual([
      "createInvoiceByFactory",
      "invoiceSendBy",
      "bookInvoice",
      "invoiceEnshrine"
    ]);
    expect(calls.map((call) => call.url)).toEqual([
      "/Invoice/Factory/saveInvoice",
      "/Invoice/42/sendBy",
      "/Invoice/42/bookAmount",
      "/Invoice/42/enshrine"
    ]);
    const createCall = calls[0];
    const sendCall = calls[1];
    expect(createCall).toBeDefined();
    expect(sendCall).toBeDefined();
    if (!createCall || !sendCall) throw new Error("Expected invoice workflow requests.");
    expect(requestJson(createCall)).toMatchObject({
      invoice: { status: "100", objectName: "Invoice" },
      invoicePosSave: [{ objectName: "InvoicePos" }]
    });
    expect(requestJson(sendCall)).toEqual({
      sendType: "VPDF",
      sendDraft: false
    });
    expect(result.data.enshrinement).toMatchObject({
      performed: true,
      operationId: "invoiceEnshrine",
      status: 200
    });
    expect(
      calls.map(
        (call) =>
          (
            call as InternalAxiosRequestConfig & {
              _sevdesk?: { retry?: unknown };
            }
          )._sevdesk?.retry
      )
    ).toEqual([false, false, false, false]);
    expect(result.raw).toHaveLength(4);
    expect(result.toJSON()).toEqual(result.json);
    expect(result.toSummary().steps).toHaveLength(4);
  });
  it("preserves completed steps and partial resources on failure", async () => {
    const instance = axios.create({
      adapter: adapter((config) => {
        if (config.url === "/Invoice/Factory/saveInvoice") {
          return jsonResponse(
            config,
            {
              objects: {
                invoice: {
                  id: "42",
                  objectName: "Invoice",
                  status: "100"
                },
                invoicePos: []
              }
            },
            201
          );
        }
        return Promise.reject(responseError(config, 422, { message: "email address rejected" }));
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: false,
      axiosInstance: instance
    });
    let error: unknown;
    try {
      await client.invoices.createAndFinalize({
        ...invoiceInput(),
        delivery: {
          channel: "email",
          toEmail: "customer@example.test",
          subject: "Invoice",
          text: "Attached"
        }
      });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(SevdeskWorkflowError);
    const workflowError = error as SevdeskWorkflowError;
    expect(workflowError.failedOperationId).toBe("sendInvoiceViaEMail");
    expect(workflowError.completedSteps).toHaveLength(1);
    expect(workflowError.retrySafe).toBe(false);
    expect(workflowError.partial).toMatchObject({
      invoice: { id: "42" }
    });
  });
});

describe("contact workflows", () => {
  it("front-loads nested reference and accounting-number validation", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, {});
        })
      })
    });
    await expect(
      client.contacts.create({
        contact: {
          kind: "organisation",
          name: "Invalid nested input",
          category: "customer"
        },
        addresses: [
          {
            country: { id: 0, objectName: "StaticCountry" },
            category: null
          }
        ]
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
    await expect(
      client.contacts.create({
        contact: {
          kind: "organisation",
          name: "Invalid accounting input",
          category: "customer"
        },
        accounting: { debitorNumber: Number.NaN } as never
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
  });
  it("returns one hydrated contact object while retaining every raw step", async () => {
    const instance = axios.create({
      adapter: adapter((config) => {
        if (config.method === "post" && config.url === "/Contact") {
          return jsonResponse(
            config,
            { objects: { id: "55", objectName: "Contact", name: "Acme GmbH" } },
            201
          );
        }
        if (config.method === "get" && config.url === "/Contact/55") {
          return jsonResponse(config, {
            objects: [
              {
                id: "55",
                objectName: "Contact",
                name: "Acme GmbH",
                status: "1000"
              }
            ]
          });
        }
        throw new Error(`Unexpected request ${config.method} ${config.url}`);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    const result = await client.contacts.create({
      contact: {
        kind: "organisation",
        name: "Acme GmbH",
        category: "customer"
      }
    });
    expect(result.data.contact).toMatchObject({
      id: "55",
      name: "Acme GmbH",
      status: "ACTIVE",
      statusCode: 1000
    });
    expect(Array.isArray(result.data.contact)).toBe(false);
    expect(result.steps.map((step) => step.operationId)).toEqual([
      "createContact",
      "getContactById"
    ]);
    expect(result.json).toHaveLength(2);
    expect(result.raw).toHaveLength(2);
  });
  it("requires usable accounting-contact identity when accounting was requested", async () => {
    const instance = axios.create({
      adapter: adapter((config) => {
        if (config.method === "post" && config.url === "/Contact") {
          return jsonResponse(
            config,
            { objects: { id: "55", objectName: "Contact", name: "Acme GmbH" } },
            201
          );
        }
        if (config.method === "get" && config.url === "/Contact/55") {
          return jsonResponse(config, {
            objects: [
              {
                id: "55",
                objectName: "Contact",
                name: "Acme GmbH",
                status: "1000"
              }
            ]
          });
        }
        if (config.method === "post" && config.url === "/AccountingContact") {
          return jsonResponse(config, { objects: {} }, 201);
        }
        throw new Error(`Unexpected request ${config.method} ${config.url}`);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    let error: unknown;
    try {
      await client.contacts.create({
        contact: {
          kind: "organisation",
          name: "Acme GmbH",
          category: "customer"
        },
        accounting: { debitorNumber: 10_000 }
      });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(SevdeskWorkflowError);
    expect((error as SevdeskWorkflowError).cause).toBeInstanceOf(SevdeskResponseValidationError);
  });
});

describe("nested Factory response IDs", () => {
  it("validates voucher Factory and booking inputs before uploading an attachment", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, {});
        })
      })
    });
    await expect(
      client.vouchers.createAndBook({
        voucher: {
          voucherDate: "2026-07-30",
          creditDebit: "expense",
          tax: taxes.manual.expense({ bookkeepingSystem: "2.0", taxRule: 9 })
        },
        positions: [
          {
            taxRate: 19,
            net: true,
            sumNet: 10,
            accountDatev: refs.accountDatev(1)
          }
        ],
        attachment: new Uint8Array([1]),
        booking: {
          amount: Number.NaN,
          date: "not-a-date",
          checkAccount: refs.checkAccount(3)
        }
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
  });
  it("continues order, voucher and credit-note workflows after nested create responses", async () => {
    const calls: string[] = [];
    const instance = axios.create({
      adapter: adapter((config) => {
        calls.push(config.url ?? "");
        switch (config.url) {
          case "/Order/Factory/saveOrder":
            return jsonResponse(
              config,
              {
                objects: {
                  order: {
                    id: "11",
                    objectName: "Order",
                    status: "100"
                  }
                }
              },
              201
            );
          case "/Order/11/sendBy":
            return jsonResponse(config, {
              objects: { id: "11", objectName: "Order", status: "200" }
            });
          case "/Voucher/Factory/saveVoucher":
            return jsonResponse(
              config,
              {
                objects: {
                  voucher: {
                    id: "22",
                    objectName: "Voucher",
                    status: "50"
                  }
                }
              },
              201
            );
          case "/Voucher/Factory/uploadTempFile":
            return jsonResponse(config, { objects: { filename: "temporary-receipt.pdf" } });
          case "/Voucher/22/bookAmount":
            return jsonResponse(config, { objects: { id: "220" } });
          case "/Voucher/22/enshrine":
            return jsonResponse(config, {});
          case "/CreditNote/Factory/saveCreditNote":
            return jsonResponse(
              config,
              {
                objects: {
                  creditNote: {
                    id: "33",
                    objectName: "CreditNote",
                    status: "100"
                  }
                }
              },
              201
            );
          case "/CreditNote/33/sendBy":
            return jsonResponse(config, {
              objects: { id: "33", objectName: "CreditNote", status: "200" }
            });
          case "/CreditNote/33/enshrine":
            return jsonResponse(config, {});
          default:
            throw new Error(`Unexpected request ${config.method} ${config.url}`);
        }
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    await client.orders.createAndDeliver({
      order: {
        orderNumber: "AN-1000",
        orderDate: "2026-07-30",
        orderType: "AN",
        header: "Proposal AN-1000",
        version: 0,
        taxText: "Umsatzsteuer 19%",
        taxRate: 0,
        addressCountry: refs.country(1),
        contact: refs.contact(1),
        contactPerson: refs.sevUser(2),
        currency: "EUR",
        tax: taxes.manual.sales({ bookkeepingSystem: "2.0", taxRule: 1 })
      },
      positions: [{ quantity: 1, price: 10, taxRate: 19, unity: refs.unity(1) }],
      delivery: { channel: "mark-sent" }
    });
    const voucherResult = await client.vouchers.createAndBook({
      voucher: {
        voucherDate: "2026-07-30",
        creditDebit: "expense",
        supplierName: "Supplier",
        tax: taxes.manual.expense({ bookkeepingSystem: "2.0", taxRule: 9 })
      },
      positions: [
        {
          taxRate: 19,
          net: true,
          sumNet: 10,
          accountDatev: refs.accountDatev(1)
        }
      ],
      attachment: {
        data: new Uint8Array([1, 2, 3]),
        filename: "receipt.pdf",
        contentType: "application/pdf"
      },
      booking: {
        amount: 11.9,
        date: "2026-07-30",
        checkAccount: refs.checkAccount(3)
      },
      enshrine: true
    });
    const creditNoteResult = await client.creditNotes.createAndDeliver({
      creditNote: {
        creditNoteDate: "2026-07-30",
        contact: refs.contact(1),
        contactPerson: refs.sevUser(2),
        currency: "EUR",
        tax: taxes.manual.sales({ bookkeepingSystem: "2.0", taxRule: 1 })
      },
      positions: [{ quantity: 1, price: 10, taxRate: 19, unity: refs.unity(1) }],
      delivery: { channel: "mark-sent" },
      enshrine: true
    });
    expect(calls).toEqual([
      "/Order/Factory/saveOrder",
      "/Order/11/sendBy",
      "/Voucher/Factory/uploadTempFile",
      "/Voucher/Factory/saveVoucher",
      "/Voucher/22/bookAmount",
      "/Voucher/22/enshrine",
      "/CreditNote/Factory/saveCreditNote",
      "/CreditNote/33/sendBy",
      "/CreditNote/33/enshrine"
    ]);
    expect(voucherResult.data.upload).toMatchObject({
      filename: "temporary-receipt.pdf"
    });
    expect(voucherResult.data.enshrinement).toMatchObject({
      performed: true,
      operationId: "voucherEnshrine"
    });
    expect(creditNoteResult.data.enshrinement).toMatchObject({
      performed: true,
      operationId: "creditNoteEnshrine"
    });
  });
});

describe("conversion workflow preconditions", () => {
  it("maps the endpoint-specific final-invoice key before creating from an order", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          return jsonResponse(config, {
            objects: { id: "42", objectName: "Invoice", status: "100" }
          });
        })
      })
    });
    const result = await client.invoices.createFromOrder({
      orderId: 9,
      partialType: "final"
    });
    expect(result.workflow).toBe("invoices.createFromOrder");
    expect(calls).toHaveLength(1);
    const createCall = calls[0];
    if (!createCall) throw new Error("Expected the invoice-from-order request.");
    expect(requestJson(createCall)).toMatchObject({
      order: { id: 9, objectName: "Order" },
      partialType: InvoiceFromOrderPartialType.FINAL
    });
  });
  it("rejects an untyped partial-type name and the wrong raw enum domain before transport", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, {});
        })
      })
    });
    await expect(
      client.invoices.createFromOrder({ orderId: 9, partialType: "normal" as never })
    ).rejects.toThrow(/Unknown InvoiceFromOrderPartialType value/);
    await expect(
      client.invoices.createFromOrder({
        orderId: 9,
        partialType: rawEnumCode("InvoiceType", "RE") as never
      })
    ).rejects.toThrow(/cannot be used/);
    expect(calls).toBe(0);
  });
  it("fails closed when bookkeeping version 1.0 is not explicitly returned", async () => {
    const calls: string[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config.url ?? "");
          if (config.url === "/Tools/bookkeepingSystemVersion") {
            return jsonResponse(config, {});
          }
          throw new Error(`A credit-note write must not run: ${config.method} ${config.url}`);
        })
      })
    });
    let error: unknown;
    try {
      await client.creditNotes.createFromVoucher({ voucherId: 9 });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(SevdeskWorkflowError);
    expect((error as SevdeskWorkflowError).cause).toBeInstanceOf(SevdeskResponseValidationError);
    expect(calls).toEqual(["/Tools/bookkeepingSystemVersion"]);
  });
  it("rejects a non-finite invoice-from-order amount before transport", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, {});
        })
      })
    });
    await expect(
      client.invoices.createFromOrder({
        orderId: 9,
        amount: Number.POSITIVE_INFINITY
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
  });
});
