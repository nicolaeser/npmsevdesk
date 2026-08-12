import axios, { type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import {
  SevdeskReminderEligibilityError,
  SevdeskWorkflowError,
  createSevdeskClient
} from "../src/index.js";
import { adapter, jsonResponse, requestJson, responseError } from "./helpers.js";

const reminderDeadlineSeconds = Date.UTC(2026, 6, 20) / 1000;

function sourceInvoice(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    id: "42",
    objectName: "Invoice",
    invoiceNumber: "RE-42",
    invoiceDate: "2026-07-01",
    timeToPay: "14",
    status: "200",
    ...overrides
  };
}

function preflightResponse(
  config: InternalAxiosRequestConfig,
  options: {
    readonly outstanding?: number;
    readonly source?: Readonly<Record<string, unknown>>;
    readonly lastDunning?: Readonly<Record<string, unknown>> | null;
  } = {}
) {
  if (config.url === "/Invoice/42") {
    return jsonResponse(config, {
      objects: [options.source ?? sourceInvoice()]
    });
  }
  if (config.url === "/Invoice/Factory/getOpenInvoiceReminderDebit") {
    return jsonResponse(config, {
      objects: options.outstanding ?? 119
    });
  }
  if (config.url === "/Invoice/42/getLastDunning") {
    if (options.lastDunning === null) return jsonResponse(config, {});
    return jsonResponse(
      config,
      options.lastDunning === undefined
        ? {
            objects: sourceInvoice({
              id: "41",
              invoiceType: "MA",
              reminderDeadline: reminderDeadlineSeconds
            })
          }
        : { objects: options.lastDunning }
    );
  }
  return undefined;
}

describe("reminder workflows", () => {
  it("checks eligibility, creates and explicitly delivers a reminder using the documented operations", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const instance = axios.create({
      adapter: adapter((config) => {
        calls.push(config);
        const preflight = preflightResponse(config);
        if (preflight !== undefined) return preflight;
        if (config.url === "/Invoice/Factory/createInvoiceReminder") {
          return jsonResponse(config, {
            objects: sourceInvoice({
              id: "43",
              invoiceType: "MA",
              status: "100"
            })
          });
        }
        if (config.url === "/Invoice/43/sendBy") {
          return jsonResponse(config, {
            objects: sourceInvoice({
              id: "43",
              invoiceType: "MA",
              status: "200"
            })
          });
        }
        throw new Error(`Unexpected request ${config.method} ${config.url}`);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    const reminders = client.reminders;
    expect(client.bundles.reminders).toBe(reminders);
    const result = await reminders.create({
      invoiceId: 42,
      asOf: new Date("2026-07-31T22:45:00Z"),
      delivery: { channel: "mark-sent", sendType: "email" }
    });
    expect(result.workflow).toBe("reminders.create");
    expect(result.steps.map((step) => step.operationId)).toEqual([
      "getInvoiceById",
      "getOpenInvoiceReminderDebit",
      "getLastDunning",
      "createInvoiceReminder",
      "invoiceSendBy"
    ]);
    expect(result.data.eligibility).toMatchObject({
      outstanding: 119,
      overdueByDays: 11
    });
    expect(result.data.eligibility.dueAt.toISOString()).toBe("2026-07-20T00:00:00.000Z");
    expect(result.data.reminder).toMatchObject({
      id: "43",
      status: "DRAFT",
      semantic: { invoiceType: { name: "REMINDER", code: "MA", known: true } }
    });
    expect(result.data.delivery).toMatchObject({
      id: "43",
      status: "OPEN"
    });
    const debitCall = calls.find(
      (call) => call.url === "/Invoice/Factory/getOpenInvoiceReminderDebit"
    );
    expect(debitCall?.params).toEqual({
      invoice: { id: 42, objectName: "Invoice" }
    });
    const createCall = calls.find((call) => call.url === "/Invoice/Factory/createInvoiceReminder");
    expect(createCall?.params).toEqual({
      "invoice[id]": 42,
      "invoice[objectName]": "Invoice"
    });
    if (!createCall) throw new Error("Expected a reminder creation request.");
    expect(requestJson(createCall)).toEqual({
      invoice: { id: 42, objectName: "Invoice" }
    });
  });
  it.each([
    ["Unix seconds", reminderDeadlineSeconds],
    ["Unix milliseconds", reminderDeadlineSeconds * 1000]
  ])("accepts numeric reminder deadlines in %s", async (_label, reminderDeadline) => {
    const instance = axios.create({
      adapter: adapter((config) => {
        const preflight = preflightResponse(config, {
          lastDunning: sourceInvoice({
            id: "41",
            invoiceType: "MA",
            reminderDeadline
          })
        });
        if (preflight !== undefined) return preflight;
        throw new Error(`Unexpected request ${config.method} ${config.url}`);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    const result = await client.reminders.checkEligibility(42, {
      asOf: new Date("2026-07-31T12:00:00Z")
    });
    expect(result.workflow).toBe("reminders.checkEligibility");
    expect(result.data.eligible).toBe(true);
    if (!result.data.eligible) throw new Error("Expected the invoice to be reminder-eligible.");
    expect(result.data.dueAt.toISOString()).toBe("2026-07-20T00:00:00.000Z");
    expect(result.data.overdueByDays).toBe(11);
  });
  it("validates asOf and invoice status before unrelated reminder reads", async () => {
    let calls = 0;
    const invalidDateClient = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, {});
        })
      })
    });
    await expect(
      invalidDateClient.reminders.checkEligibility(42, { asOf: new Date("invalid") })
    ).rejects.toThrow(/valid Date/);
    expect(calls).toBe(0);
    await expect(invalidDateClient.reminders.checkEligibility(0)).rejects.toThrow(
      /positive numeric sevdesk id/
    );
    expect(calls).toBe(0);
    const statusCalls: string[] = [];
    const paidClient = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          statusCalls.push(config.url ?? "");
          if (config.url === "/Invoice/42") {
            return jsonResponse(config, {
              objects: [sourceInvoice({ status: "1000" })]
            });
          }
          throw new Error(`An unrelated reminder read must not run: ${config.url}`);
        })
      })
    });
    const paidEligibility = await paidClient.reminders.checkEligibility(42, {
      asOf: new Date("2026-07-31T00:00:00Z")
    });
    expect(paidEligibility.data).toMatchObject({
      eligible: false,
      reason: "INELIGIBLE_STATUS"
    });
    expect(statusCalls).toEqual(["/Invoice/42"]);
  });
  it("blocks a new reminder while the last reminder is still a draft", async () => {
    const calls: string[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config.url ?? "");
          const preflight = preflightResponse(config, {
            lastDunning: sourceInvoice({
              id: "41",
              invoiceType: "MA",
              status: "100",
              reminderDeadline: reminderDeadlineSeconds
            })
          });
          if (preflight !== undefined) return preflight;
          throw new Error(`A reminder write must not run: ${config.url}`);
        })
      })
    });
    await expect(
      client.reminders.create({
        invoiceId: 42,
        asOf: new Date("2026-07-31T00:00:00Z")
      })
    ).rejects.toMatchObject({ reason: "UNSENT_LAST_REMINDER" });
    expect(calls).toEqual([
      "/Invoice/42",
      "/Invoice/Factory/getOpenInvoiceReminderDebit",
      "/Invoice/42/getLastDunning"
    ]);
  });
  it.each([
    ["null", null],
    ["an empty array", []]
  ])("treats %s objects as no previous dunning", async (_label, objects) => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => jsonResponse(config, { objects }))
      })
    });
    const result = await client.reminders.getLastForInvoice(42);
    expect(result.data).toBeUndefined();
  });
  it.each([
    [
      "a sentinel reminder timestamp",
      {
        source: sourceInvoice(),
        lastDunning: sourceInvoice({
          id: "41",
          invoiceType: "MA",
          status: "200",
          reminderDeadline: 0
        })
      }
    ],
    [
      "an overflowing payment term",
      {
        source: sourceInvoice({ timeToPay: Number.MAX_SAFE_INTEGER }),
        lastDunning: null
      }
    ]
  ])("fails closed for %s", async (_label, options) => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          const preflight = preflightResponse(config, options);
          if (preflight !== undefined) return preflight;
          throw new Error(`A reminder write must not run: ${config.url}`);
        })
      })
    });
    await expect(
      client.reminders.create({
        invoiceId: 42,
        asOf: new Date("2026-07-31T00:00:00Z")
      })
    ).rejects.toMatchObject({ reason: "UNDETERMINABLE_DUE_DATE" });
  });
  it("returns required email-delivery data when email delivery is requested", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          const preflight = preflightResponse(config);
          if (preflight !== undefined) return preflight;
          if (config.url === "/Invoice/Factory/createInvoiceReminder") {
            return jsonResponse(config, {
              objects: sourceInvoice({ id: "43", invoiceType: "MA", status: "100" })
            });
          }
          if (config.url === "/Invoice/43/sendViaEmail") {
            return jsonResponse(config, { objects: { sent: true } });
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const result = await client.reminders.create({
      invoiceId: 42,
      asOf: new Date("2026-07-31T00:00:00Z"),
      delivery: {
        channel: "email",
        toEmail: "customer@example.test",
        subject: "Reminder",
        text: "Attached"
      }
    });
    expect(result.data.delivery).toEqual({ sent: true });
    expect(result.steps.at(-1)?.operationId).toBe("sendInvoiceViaEMail");
  });
  it("does not create a reminder when the read-only eligibility check rejects it", async () => {
    const calls: string[] = [];
    const instance = axios.create({
      adapter: adapter((config) => {
        calls.push(config.url ?? "");
        const preflight = preflightResponse(config, {
          outstanding: 0,
          lastDunning: null
        });
        if (preflight !== undefined) return preflight;
        throw new Error(`A write must not be attempted: ${config.method} ${config.url}`);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    let error: unknown;
    try {
      await client.reminders.create({
        invoiceId: 42,
        asOf: new Date("2026-07-31T00:00:00Z")
      });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(SevdeskReminderEligibilityError);
    expect((error as SevdeskReminderEligibilityError).reason).toBe("NO_OUTSTANDING_BALANCE");
    expect(calls).toEqual([
      "/Invoice/42",
      "/Invoice/Factory/getOpenInvoiceReminderDebit",
      "/Invoice/42/getLastDunning"
    ]);
  });
  it("does not fall back to the original invoice due date when a prior dunning has no deadline", async () => {
    const calls: string[] = [];
    const instance = axios.create({
      adapter: adapter((config) => {
        calls.push(config.url ?? "");
        const preflight = preflightResponse(config, {
          lastDunning: sourceInvoice({
            id: "41",
            invoiceType: "MA",
            reminderDeadline: undefined
          })
        });
        if (preflight !== undefined) return preflight;
        throw new Error(`A write must not be attempted: ${config.method} ${config.url}`);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    await expect(
      client.reminders.create({
        invoiceId: 42,
        asOf: new Date("2026-07-31T00:00:00Z")
      })
    ).rejects.toMatchObject({
      reason: "UNDETERMINABLE_DUE_DATE"
    });
    expect(calls).toEqual([
      "/Invoice/42",
      "/Invoice/Factory/getOpenInvoiceReminderDebit",
      "/Invoice/42/getLastDunning"
    ]);
  });
  it("never retries the reminder write and keeps default workflow JSON metadata-only", async () => {
    let createCalls = 0;
    const instance = axios.create({
      adapter: adapter((config) => {
        const preflight = preflightResponse(config, {
          source: sourceInvoice({ customerInternalNote: "customer-private-value" })
        });
        if (preflight !== undefined) return preflight;
        if (config.url === "/Invoice/Factory/createInvoiceReminder") {
          createCalls += 1;
          return Promise.reject(responseError(config, 503, { message: "temporarily unavailable" }));
        }
        throw new Error(`Unexpected request ${config.method} ${config.url}`);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance,
      retries: {
        attempts: 3,
        baseDelayMs: 1,
        unsafeOperations: true
      }
    });
    let error: unknown;
    try {
      await client.reminders.create(
        {
          invoiceId: 42,
          asOf: new Date("2026-07-31T00:00:00Z")
        },
        { retry: { attempts: 5, unsafe: true } }
      );
    } catch (caught) {
      error = caught;
    }
    expect(createCalls).toBe(1);
    expect(error).toBeInstanceOf(SevdeskWorkflowError);
    const workflowError = error as SevdeskWorkflowError;
    expect(workflowError.failedOperationId).toBe("createInvoiceReminder");
    const defaultJson = JSON.stringify(workflowError);
    expect(defaultJson).not.toContain("customer-private-value");
    expect(workflowError.toJSON()).not.toHaveProperty("partial");
    expect(workflowError.toJSON()).not.toHaveProperty("completedSteps.0.json");
    const diagnostic = workflowError.toDiagnostic({ includeData: true });
    expect(JSON.stringify(diagnostic)).toContain("customer-private-value");
    expect(diagnostic).toHaveProperty("partial");
    expect(diagnostic).toHaveProperty("completedSteps.0.json");
  });
});
