import { AxiosError } from "axios";
import axios, { type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import {
  createInvoiceFinalizationCheckpoint,
  parseInvoiceFinalizationCheckpoint,
  serializeInvoiceFinalizationCheckpoint,
  updateInvoiceFinalizationCheckpoint,
  type InvoiceFinalizationCheckpointSeed,
  type InvoiceFinalizationFailurePartial,
  type InvoiceFinalizationProbePolicy
} from "../src/bundles/invoices.js";
import type { InvoiceFinalizingPlan } from "../src/bundles/types.js";
import { SevdeskWorkflowError } from "../src/bundles/workflow.js";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import { refs } from "../src/types/references.js";
import {
  SevdeskCancellationError,
  SevdeskConfigurationError,
  SevdeskResponseValidationError,
  SevdeskTimeoutError
} from "../src/utils/errors.js";
import { adapter, jsonResponse } from "./helpers.js";

const emailPlan = {
  delivery: {
    channel: "email" as const,
    toEmail: "customer@example.com",
    subject: "Invoice",
    text: "Attached"
  }
};

function checkpoint<const TPlan extends InvoiceFinalizingPlan>(
  input: InvoiceFinalizationCheckpointSeed<TPlan> & {
    readonly probe?: InvoiceFinalizationProbePolicy;
  }
) {
  const { probe, ...seed } = input;
  return {
    ...createInvoiceFinalizationCheckpoint(seed),
    ...(probe === undefined ? {} : { probe })
  };
}

function invoice(config: InternalAxiosRequestConfig, fields: Record<string, unknown> = {}) {
  return jsonResponse(config, {
    objects: [
      {
        id: "42",
        objectName: "Invoice",
        status: "100",
        sendType: null,
        checkAccountTransactions: [],
        ...fields
      }
    ]
  });
}

describe("invoice finalization reconciliation", () => {
  it("recognizes an uncertain email write from server state without replaying it", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          return invoice(config, {
            status: "200",
            sendType: "VM",
            sendDate: "2026-07-31T10:00:00+02:00"
          });
        })
      })
    });
    const result = await client.invoices.reconcileFinalization(
      checkpoint({
        invoiceId: 42,
        plan: emailPlan,
        completedSteps: ["createInvoiceByFactory"],
        uncertainStep: "sendInvoiceViaEMail"
      })
    );
    expect(result.data.complete).toBe(true);
    expect(result.data.actions.delivery).toMatchObject({
      operationId: "sendInvoiceViaEMail",
      state: "satisfied",
      exact: false,
      evidence: "delivery-state"
    });
    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual(["get /Invoice/42"]);
  });
  it("polls an ambiguous write three times but never replays it", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          return invoice(config);
        })
      })
    });
    const result = await client.invoices.resumeFinalization(
      checkpoint({
        invoiceId: 42,
        plan: emailPlan,
        completedSteps: ["createInvoiceByFactory"],
        uncertainStep: "sendInvoiceViaEMail",
        probe: { maxAttempts: 3, delayMs: 0, maxDelayMs: 0 }
      })
    );
    expect(result.data.status).toBe("blocked");
    expect(result.data.completed).toBe(false);
    expect(result.data.executed).toEqual([]);
    expect(result.data.reconciliation.actions.delivery).toMatchObject({
      state: "blocked",
      reason: "write-not-observed",
      retryableByProbe: true
    });
    expect(calls).toHaveLength(3);
    expect(calls.every((call) => call.method === "get")).toBe(true);
  });
  it("preserves completed and uncertain writes across reconcile-to-resume chaining", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          return invoice(config);
        })
      })
    });
    const plan = {
      ...emailPlan,
      booking: {
        amount: 119,
        date: new Date("2026-07-31T10:00:00Z"),
        checkAccount: refs.checkAccount(3)
      }
    } as const;
    const original = checkpoint({
      invoiceId: 42,
      plan,
      completedSteps: ["createInvoiceByFactory", "sendInvoiceViaEMail"],
      uncertainStep: "bookInvoice",
      probe: { maxAttempts: 1, delayMs: 0, maxDelayMs: 0 }
    });
    const observed = await client.invoices.reconcileFinalization(original);
    expect(observed.data.checkpoint.completedSteps).toEqual([
      "createInvoiceByFactory",
      "sendInvoiceViaEMail"
    ]);
    expect(observed.data.checkpoint.uncertainStep).toBe("bookInvoice");
    expect(observed.data.checkpoint.probeSteps).toEqual([
      { operationId: "getInvoiceById", status: 200 }
    ]);
    const resumed = await client.invoices.resumeFinalization({
      ...observed.data.checkpoint,
      probe: { maxAttempts: 1, delayMs: 0, maxDelayMs: 0 }
    });
    expect(resumed.data.status).toBe("blocked");
    expect(resumed.data.executed).toEqual([]);
    expect(calls).toHaveLength(2);
    expect(calls.every((call) => call.method === "get")).toBe(true);
  });
  it("returns a safe cumulative checkpoint when a resumed write is inconclusive", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    let emailAttempts = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          if (config.method === "get") return invoice(config);
          if (config.url === "/Invoice/42/sendViaEmail") {
            emailAttempts += 1;
            throw new AxiosError("write timeout", "ECONNABORTED", config);
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const initial = checkpoint({
      invoiceId: 42,
      plan: emailPlan,
      completedSteps: ["createInvoiceByFactory"]
    });
    let caught: unknown;
    try {
      await client.invoices.resumeFinalization(initial);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SevdeskWorkflowError);
    const partial = (caught as SevdeskWorkflowError).partial as InvoiceFinalizationFailurePartial<
      (typeof initial)["plan"]
    >;
    expect(partial.checkpoint.completedSteps).toEqual(["createInvoiceByFactory"]);
    expect(partial.checkpoint.uncertainStep).toBe("sendInvoiceViaEMail");
    expect(partial.checkpoint.probeSteps).toEqual([{ operationId: "getInvoiceById", status: 200 }]);
    const guarded = await client.invoices.resumeFinalization({
      ...partial.checkpoint,
      probe: { maxAttempts: 1, delayMs: 0, maxDelayMs: 0 }
    });
    expect(guarded.data.status).toBe("blocked");
    expect(emailAttempts).toBe(1);
    expect(calls.filter((call) => call.method === "get")).toHaveLength(2);
  });
  it("promotes an observed uncertain delivery before a later booking timeout", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    let bookingAttempts = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          if (config.method === "get") {
            return invoice(config, {
              status: "200",
              sendType: "VM",
              sendDate: "2026-07-31T10:00:00+02:00"
            });
          }
          if (config.url === "/Invoice/42/bookAmount") {
            bookingAttempts += 1;
            throw new AxiosError("booking timeout", "ECONNABORTED", config);
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const initial = checkpoint({
      invoiceId: 42,
      plan: {
        ...emailPlan,
        booking: {
          amount: 119,
          date: new Date("2026-07-31T10:00:00Z"),
          checkAccount: refs.checkAccount(3)
        }
      },
      completedSteps: ["createInvoiceByFactory"],
      uncertainStep: "sendInvoiceViaEMail",
      probe: { maxAttempts: 1, delayMs: 0, maxDelayMs: 0 }
    });
    let caught: unknown;
    try {
      await client.invoices.resumeFinalization(initial);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SevdeskWorkflowError);
    const partial = (caught as SevdeskWorkflowError).partial as InvoiceFinalizationFailurePartial<
      (typeof initial)["plan"]
    >;
    expect(partial.checkpoint.completedSteps).toEqual([
      "createInvoiceByFactory",
      "sendInvoiceViaEMail"
    ]);
    expect(partial.checkpoint.uncertainStep).toBe("bookInvoice");
    const guarded = await client.invoices.resumeFinalization({
      ...partial.checkpoint,
      probe: { maxAttempts: 1, delayMs: 0, maxDelayMs: 0 }
    });
    expect(guarded.data.status).toBe("blocked");
    expect(bookingAttempts).toBe(1);
    expect(calls.filter((call) => call.method === "get")).toHaveLength(2);
  });
  it("checkpoints an externally satisfied prefix before a later write timeout", async () => {
    let bookingAttempts = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (config.method === "get") {
            return invoice(config, {
              status: "200",
              sendType: "VM",
              sendDate: "2026-07-31T10:00:00+02:00"
            });
          }
          if (config.url === "/Invoice/42/bookAmount") {
            bookingAttempts += 1;
            throw new AxiosError("booking timeout", "ECONNABORTED", config);
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const initial = checkpoint({
      invoiceId: 42,
      plan: {
        ...emailPlan,
        booking: {
          amount: 119,
          date: new Date("2026-07-31T10:00:00Z"),
          checkAccount: refs.checkAccount(3)
        }
      },
      completedSteps: ["createInvoiceByFactory"],
      probe: { maxAttempts: 1, delayMs: 0, maxDelayMs: 0 }
    });
    let caught: unknown;
    try {
      await client.invoices.resumeFinalization(initial);
    } catch (error) {
      caught = error;
    }
    const partial = (caught as SevdeskWorkflowError).partial as InvoiceFinalizationFailurePartial<
      (typeof initial)["plan"]
    >;
    expect(partial.checkpoint.completedSteps).toEqual([
      "createInvoiceByFactory",
      "sendInvoiceViaEMail"
    ]);
    expect(partial.checkpoint.uncertainStep).toBe("bookInvoice");
    expect(bookingAttempts).toBe(1);
  });
  it("advances through pre-observed actions before checkpointing a later timeout", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    let deliverySucceeded = false;
    let enshrinementAttempts = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          if (config.method === "get") {
            return invoice(config, {
              ...(deliverySucceeded
                ? {
                    status: "200",
                    sendType: "VM",
                    sendDate: "2026-07-31T10:00:00+02:00"
                  }
                : {}),
              checkAccountTransactions: [{ id: "812", objectName: "CheckAccountTransaction" }]
            });
          }
          if (config.url === "/Invoice/42/sendViaEmail") {
            deliverySucceeded = true;
            return jsonResponse(config, { objects: { id: "9", objectName: "Email" } }, 201);
          }
          if (config.url === "/Invoice/42/enshrine") {
            enshrinementAttempts += 1;
            throw new AxiosError("enshrinement timeout", "ECONNABORTED", config);
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const initial = checkpoint({
      invoiceId: 42,
      plan: {
        ...emailPlan,
        booking: {
          amount: 119,
          date: new Date("2026-07-31T10:00:00Z"),
          checkAccount: refs.checkAccount(3),
          checkAccountTransaction: refs.checkAccountTransaction(812)
        },
        enshrine: true
      },
      completedSteps: ["createInvoiceByFactory"],
      probe: { maxAttempts: 1, delayMs: 0, maxDelayMs: 0 }
    });
    let caught: unknown;
    try {
      await client.invoices.resumeFinalization(initial);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SevdeskWorkflowError);
    const partial = (caught as SevdeskWorkflowError).partial as InvoiceFinalizationFailurePartial<
      (typeof initial)["plan"]
    >;
    expect(partial.executed.map((receipt) => receipt.operationId)).toEqual(["sendInvoiceViaEMail"]);
    expect(partial.checkpoint.completedSteps).toEqual([
      "createInvoiceByFactory",
      "sendInvoiceViaEMail",
      "bookInvoice"
    ]);
    expect(partial.checkpoint.uncertainStep).toBe("invoiceEnshrine");
    expect(calls.some((call) => call.url === "/Invoice/42/bookAmount")).toBe(false);
    const guarded = await client.invoices.resumeFinalization({
      ...partial.checkpoint,
      probe: { maxAttempts: 1, delayMs: 0, maxDelayMs: 0 }
    });
    expect(guarded.data.status).toBe("blocked");
    expect(enshrinementAttempts).toBe(1);
    expect(calls.filter((call) => call.url === "/Invoice/42/sendViaEmail")).toHaveLength(1);
  });
  it("persists canonical checkpoints through JSON with normalized booking dates", () => {
    const original = createInvoiceFinalizationCheckpoint({
      invoiceId: 42,
      plan: {
        booking: {
          amount: 119,
          date: new Date("2026-07-31T10:00:00Z"),
          checkAccount: refs.checkAccount(3)
        }
      },
      completedSteps: ["createInvoiceByFactory"],
      uncertainStep: "bookInvoice"
    });
    const restored = parseInvoiceFinalizationCheckpoint(
      serializeInvoiceFinalizationCheckpoint(original)
    );
    expect(restored).toEqual(original);
    expect(restored.plan.booking?.date).toBe(new Date("2026-07-31T10:00:00Z").getTime() / 1_000);
    expect(restored.fingerprint).toMatch(/^ifc-v1-[0-9a-f]{64}$/);
  });
  it("allows only monotonic explicit checkpoint updates", () => {
    const unresolved = createInvoiceFinalizationCheckpoint({
      invoiceId: 42,
      plan: emailPlan,
      completedSteps: ["createInvoiceByFactory"],
      uncertainStep: "sendInvoiceViaEMail"
    });
    expect(() =>
      updateInvoiceFinalizationCheckpoint(unresolved, {
        completedSteps: []
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      updateInvoiceFinalizationCheckpoint(unresolved, {
        completedSteps: ["createInvoiceByFactory"]
      })
    ).toThrow(SevdeskConfigurationError);
    const promoted = updateInvoiceFinalizationCheckpoint(unresolved, {
      completedSteps: ["createInvoiceByFactory", "sendInvoiceViaEMail"]
    });
    expect(promoted.completedSteps).toEqual(["createInvoiceByFactory", "sendInvoiceViaEMail"]);
    expect(promoted.uncertainStep).toBeUndefined();
    expect(promoted.fingerprint).not.toBe(unresolved.fingerprint);
  });
  it("rejects malformed plans at create, parse, and serialize boundaries", () => {
    for (const plan of [
      {},
      [],
      { delivery: { channel: "fax" } },
      { delivery: { channel: "email", toEmail: "customer@example.com" } },
      {
        booking: {
          amount: 119,
          date: new Date("2026-07-31T10:00:00Z"),
          checkAccount: { id: 3, objectName: "Contact" }
        }
      }
    ]) {
      expect(() =>
        createInvoiceFinalizationCheckpoint({
          invoiceId: 42,
          plan: plan as never,
          completedSteps: []
        })
      ).toThrow(SevdeskConfigurationError);
    }
    const valid = createInvoiceFinalizationCheckpoint({
      invoiceId: 42,
      plan: emailPlan,
      completedSteps: []
    });
    expect(() => serializeInvoiceFinalizationCheckpoint({ ...valid, plan: [] as never })).toThrow(
      SevdeskConfigurationError
    );
    expect(() =>
      parseInvoiceFinalizationCheckpoint(JSON.stringify({ ...valid, plan: [] }))
    ).toThrow(SevdeskConfigurationError);
  });
  it("accepts an acknowledged booking with compatible state and waits for enshrinement", async () => {
    let gets = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          gets += 1;
          return invoice(config, {
            status: "1000",
            sendType: "VM",
            paidAmount: 119,
            enshrined: gets === 1 ? null : "2026-07-31T10:05:00+02:00"
          });
        })
      })
    });
    const result = await client.invoices.resumeFinalization(
      checkpoint({
        invoiceId: 42,
        plan: {
          ...emailPlan,
          booking: {
            amount: 119,
            date: new Date("2026-07-31T10:00:00Z"),
            checkAccount: refs.checkAccount(3)
          },
          enshrine: true
        },
        completedSteps: ["createInvoiceByFactory", "sendInvoiceViaEMail", "bookInvoice"],
        uncertainStep: "invoiceEnshrine",
        probe: { maxAttempts: 2, delayMs: 0, maxDelayMs: 0 }
      })
    );
    expect(result.data.status).toBe("already-complete");
    expect(result.data.reconciliation.actions.booking).toMatchObject({
      state: "satisfied",
      exact: false,
      evidence: "booking-state"
    });
    expect(result.data.reconciliation.actions.enshrinement).toMatchObject({
      state: "satisfied",
      exact: true
    });
    expect(gets).toBe(2);
  });
  it("executes each explicitly not-started action once and disables write retries", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    let gets = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: { attempts: 5, unsafeOperations: true },
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          if (config.method === "get") {
            gets += 1;
            return gets === 1
              ? invoice(config)
              : invoice(config, {
                  status: "1000",
                  sendType: "VM",
                  paidAmount: 119,
                  enshrined: "2026-07-31T10:05:00+02:00"
                });
          }
          if (config.url === "/Invoice/42/sendViaEmail") {
            return jsonResponse(config, { objects: { id: "9", objectName: "Email" } }, 201);
          }
          if (config.url === "/Invoice/42/bookAmount") {
            return jsonResponse(config, { id: "10", objectName: "InvoiceLog" });
          }
          if (config.url === "/Invoice/42/enshrine") {
            return jsonResponse(config, { objects: null });
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const result = await client.invoices.resumeFinalization(
      checkpoint({
        invoiceId: 42,
        plan: {
          ...emailPlan,
          booking: {
            amount: 119,
            date: new Date("2026-07-31T10:00:00Z"),
            checkAccount: refs.checkAccount(3)
          },
          enshrine: true
        },
        completedSteps: ["createInvoiceByFactory"]
      })
    );
    expect(result.data.status).toBe("resumed");
    expect(result.data.executed.map((item) => item.operationId)).toEqual([
      "sendInvoiceViaEMail",
      "bookInvoice",
      "invoiceEnshrine"
    ]);
    expect(result.steps.map((step) => step.operationId)).toEqual([
      "getInvoiceById",
      "sendInvoiceViaEMail",
      "bookInvoice",
      "invoiceEnshrine",
      "getInvoiceById"
    ]);
    expect(result.data.reconciliation.complete).toBe(true);
    expect(result.data.reconciliation.checkpoint.completedSteps).toEqual([
      "createInvoiceByFactory",
      "sendInvoiceViaEMail",
      "bookInvoice",
      "invoiceEnshrine"
    ]);
    expect(result.data.reconciliation.checkpoint.uncertainStep).toBeUndefined();
    expect(result.data.reconciliation.checkpoint.probeSteps).toEqual([
      { operationId: "getInvoiceById", status: 200 },
      { operationId: "getInvoiceById", status: 200 }
    ]);
    expect(calls).toHaveLength(5);
    expect(
      calls
        .filter((call) => call.method !== "get")
        .every(
          (call) => (call as unknown as { _sevdesk: { retry: unknown } })._sevdesk.retry === false
        )
    ).toBe(true);
  });
  it("reports blocked-after-resume when acknowledged writes are not visible yet", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          if (config.method === "get") return invoice(config);
          if (config.url === "/Invoice/42/sendBy") {
            return jsonResponse(config, {
              objects: {
                id: "42",
                objectName: "Invoice",
                status: "200",
                sendType: "VPDF"
              }
            });
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const result = await client.invoices.resumeFinalization(
      checkpoint({
        invoiceId: 42,
        plan: { delivery: { channel: "mark-sent" } },
        completedSteps: ["createInvoiceByFactory"],
        probe: { maxAttempts: 2, delayMs: 0, maxDelayMs: 0 }
      })
    );
    expect(result.data.status).toBe("blocked-after-resume");
    expect(result.data.completed).toBe(false);
    expect(result.data.initialReconciliation.complete).toBe(false);
    expect(result.data.reconciliation.complete).toBe(false);
    expect(result.data.executed.map((item) => item.operationId)).toEqual(["invoiceSendBy"]);
    expect(calls.filter((call) => call.method === "put")).toHaveLength(1);
    expect(calls.filter((call) => call.method === "get")).toHaveLength(3);
  });
  it("does not infer an uncertain offline booking from coarse paid state", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          return invoice(config, { status: "1000", paidAmount: 119 });
        })
      })
    });
    const result = await client.invoices.resumeFinalization(
      checkpoint({
        invoiceId: 42,
        plan: {
          booking: {
            amount: 119,
            date: new Date("2026-07-31T10:00:00Z"),
            checkAccount: refs.checkAccount(3)
          }
        },
        completedSteps: ["createInvoiceByFactory"],
        uncertainStep: "bookInvoice",
        probe: { maxAttempts: 3, delayMs: 0, maxDelayMs: 0 }
      })
    );
    expect(result.data.status).toBe("blocked");
    expect(result.data.reconciliation.actions.booking).toMatchObject({
      state: "blocked",
      reason: "booking-not-uniquely-verifiable",
      retryableByProbe: false
    });
    expect(calls).toHaveLength(1);
  });
  it("retries a timed-out safe GET probe but not cancellation", async () => {
    let timeoutCalls = 0;
    const timeoutClient = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          timeoutCalls += 1;
          if (timeoutCalls === 1) {
            throw new AxiosError("probe timeout", "ECONNABORTED", config);
          }
          return invoice(config);
        })
      })
    });
    const recovered = await timeoutClient.invoices.reconcileFinalization(
      checkpoint({
        invoiceId: 42,
        plan: emailPlan,
        completedSteps: ["createInvoiceByFactory"],
        probe: { maxAttempts: 2, delayMs: 0, maxDelayMs: 0 }
      })
    );
    expect(recovered.data.canResume).toBe(true);
    expect(recovered.data.probe.attempts).toBe(2);
    expect(timeoutCalls).toBe(2);
    let cancellationCalls = 0;
    const cancellationClient = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          cancellationCalls += 1;
          throw new AxiosError("cancelled", "ERR_CANCELED", config);
        })
      })
    });
    let caught: unknown;
    try {
      await cancellationClient.invoices.reconcileFinalization(
        checkpoint({
          invoiceId: 42,
          plan: emailPlan,
          completedSteps: ["createInvoiceByFactory"],
          probe: { maxAttempts: 3, delayMs: 0, maxDelayMs: 0 }
        })
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SevdeskWorkflowError);
    expect((caught as Error).cause).toBeInstanceOf(SevdeskCancellationError);
    expect(cancellationCalls).toBe(1);
  });
  it("honors caller AbortSignal and absolute probe deadlines before transport", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return invoice(config);
        })
      })
    });
    const controller = new AbortController();
    controller.abort(new Error("stop"));
    let cancellation: unknown;
    try {
      await client.invoices.reconcileFinalization(
        checkpoint({ invoiceId: 42, plan: emailPlan, completedSteps: [] }),
        { signal: controller.signal }
      );
    } catch (error) {
      cancellation = error;
    }
    expect((cancellation as Error).cause).toBeInstanceOf(SevdeskCancellationError);
    let timeout: unknown;
    try {
      await client.invoices.reconcileFinalization(
        checkpoint({
          invoiceId: 42,
          plan: emailPlan,
          completedSteps: [],
          probe: { deadline: Date.now() - 1 }
        })
      );
    } catch (error) {
      timeout = error;
    }
    expect((timeout as Error).cause).toBeInstanceOf(SevdeskTimeoutError);
    expect(calls).toBe(0);
  });
  it("rejects inconsistent or duplicate checkpoint hints before transport", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return invoice(config);
        })
      })
    });
    await expect(
      client.invoices.resumeFinalization({
        invoiceId: 42,
        plan: emailPlan
      } as never)
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    const validEmailCheckpoint = checkpoint({
      invoiceId: 42,
      plan: emailPlan,
      completedSteps: []
    });
    await expect(
      client.invoices.resumeFinalization({
        ...validEmailCheckpoint,
        completedSteps: ["sendInvoiceViaEMail", "sendInvoiceViaEMail"]
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    await expect(
      client.invoices.resumeFinalization({
        ...validEmailCheckpoint,
        completedSteps: ["bookInvoice"] as never
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    await expect(
      client.invoices.resumeFinalization({
        ...validEmailCheckpoint,
        completedSteps: ["getInvoiceById"] as never
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    await expect(
      client.invoices.resumeFinalization({
        ...checkpoint({
          invoiceId: 42,
          plan: {
            ...emailPlan,
            booking: {
              amount: 119,
              date: new Date("2026-07-31T10:00:00Z"),
              checkAccount: refs.checkAccount(3)
            }
          },
          completedSteps: []
        }),
        completedSteps: ["bookInvoice", "sendInvoiceViaEMail"]
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
  });
  it("rejects invoice or plan checkpoint mix-ups before transport", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return invoice(config);
        })
      })
    });
    const valid = checkpoint({ invoiceId: 42, plan: emailPlan, completedSteps: [] });
    await expect(
      client.invoices.resumeFinalization({ ...valid, invoiceId: 43 as never })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    await expect(
      client.invoices.resumeFinalization({
        ...valid,
        plan: { delivery: { channel: "mark-sent" } }
      } as never)
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    const completed = checkpoint({
      invoiceId: 42,
      plan: emailPlan,
      completedSteps: ["createInvoiceByFactory", "sendInvoiceViaEMail"]
    });
    await expect(
      client.invoices.resumeFinalization({
        ...completed,
        completedSteps: ["createInvoiceByFactory"]
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
  });
  it("rejects a mismatched probe identity before any write", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          if (config.method === "get") return invoice(config, { id: "43" });
          throw new Error(`Unexpected write ${config.method} ${config.url}`);
        })
      })
    });
    let caught: unknown;
    try {
      await client.invoices.resumeFinalization(
        checkpoint({
          invoiceId: 42,
          plan: emailPlan,
          completedSteps: [],
          probe: { maxAttempts: 1, delayMs: 0, maxDelayMs: 0 }
        })
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SevdeskWorkflowError);
    expect((caught as Error).cause).toBeInstanceOf(SevdeskResponseValidationError);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe("get");
  });
  it("treats a linked booking transaction as linkage evidence, not an exact payload match", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) =>
          invoice(config, {
            checkAccountTransactions: [{ id: "812", objectName: "CheckAccountTransaction" }]
          })
        )
      })
    });
    const result = await client.invoices.reconcileFinalization(
      checkpoint({
        invoiceId: 42,
        plan: {
          booking: {
            amount: 119,
            date: new Date("2026-07-31T10:00:00Z"),
            checkAccount: refs.checkAccount(3),
            checkAccountTransaction: refs.checkAccountTransaction(812)
          }
        },
        completedSteps: ["createInvoiceByFactory"],
        uncertainStep: "bookInvoice"
      })
    );
    expect(result.data.actions.booking).toEqual({
      operationId: "bookInvoice",
      state: "satisfied",
      exact: false,
      evidence: "linked-transaction"
    });
  });
});
