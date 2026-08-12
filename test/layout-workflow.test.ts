import axios from "axios";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import {
  LayoutLanguage,
  LayoutPayPalMode,
  type SetLayoutWorkflowPartial
} from "../src/bundles/layout.js";
import { SevdeskWorkflowError } from "../src/bundles/workflow.js";
import { SevdeskResponseValidationError } from "../src/utils/errors.js";
import { adapter, jsonResponse, requestJson, responseError } from "./helpers.js";

describe("curated document layouts", () => {
  it("normalizes template and letterpaper collections while preserving wire JSON", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url).includes("getTemplatesWithThumb")) {
            return jsonResponse(config, {
              result: "1",
              templates: [{ id: "tpl-1", name: "Standard", type: "Invoice" }]
            });
          }
          return jsonResponse(config, {
            result: "1",
            letterpapers: [{ id: "paper-1", name: "Company paper" }]
          });
        })
      })
    });
    const templates = await client.layout.listTemplates({ type: "Invoice" });
    expect(templates.data).toEqual([{ id: "tpl-1", name: "Standard", type: "Invoice" }]);
    expect(templates.objects).toBe(templates.json);
    expect(templates.json.templates).toEqual([{ id: "tpl-1", name: "Standard", type: "Invoice" }]);
    const letterpapers = await client.layout.listLetterpapers();
    expect(letterpapers.data).toEqual([{ id: "paper-1", name: "Company paper" }]);
    expect(letterpapers.json.letterpapers).toEqual([{ id: "paper-1", name: "Company paper" }]);
  });
  it("returns input-correlated evidence and forwards typed PDF generation", async () => {
    const calls: Array<{ readonly params: unknown; readonly body: unknown }> = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: { attempts: 4, baseDelayMs: 0, maxDelayMs: 0, unsafeOperations: true },
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push({ params: config.params, body: requestJson(config) });
          return jsonResponse(config, { objects: { result: "1" } });
        })
      })
    });
    const result = await client.layout.setInvoiceLayout(
      42,
      {
        template: "tpl-1",
        language: LayoutLanguage.GERMAN,
        payPal: LayoutPayPalMode.SHOW_LINK
      },
      { getAsPdf: true },
      { retry: { attempts: 9, unsafe: true } }
    );
    expect(result.workflow).toBe("layout.invoice.set");
    expect(result.steps).toHaveLength(3);
    expect(result.steps.every((step) => step.operationId === "updateInvoiceTemplate")).toBe(true);
    expect(result.data.applied.template.value).toBe("tpl-1");
    expect(result.data.applied.language.value).toBe("de_DE");
    expect(result.data.applied.payPal.value).toBe("B");
    expect(result.data.applied.template.receipt.performed).toBe(true);
    expect(result.data.applied.template.receipt.operationId).toBe("updateInvoiceTemplate");
    expect(calls.map((call) => call.body)).toEqual([
      { key: "template", value: "tpl-1" },
      { key: "language", value: "de_DE" },
      { key: "payPal", value: "B" }
    ]);
    expect(calls.every((call) => JSON.stringify(call.params) === '{"getAsPdf":true}')).toBe(true);
    expectTypeOf(result.workflow).toEqualTypeOf<"layout.invoice.set">();
    expectTypeOf(result.data.applied.template.value).toEqualTypeOf<"tpl-1">();
    expectTypeOf(result.data.applied.language.value).toEqualTypeOf<"de_DE">();
    expectTypeOf(result.data.applied.payPal.value).toEqualTypeOf<"B">();
    type ResultStep = (typeof result.steps)[number];
    expectTypeOf<ResultStep["operationId"]>().toEqualTypeOf<"updateInvoiceTemplate">();
  });
  it("does not retry writes and preserves successful parameter evidence on failure", async () => {
    let attempts = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: { attempts: 5, baseDelayMs: 0, maxDelayMs: 0, unsafeOperations: true },
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          attempts += 1;
          if (attempts === 1) {
            return jsonResponse(config, { objects: { result: "1" } });
          }
          return Promise.reject(responseError(config, 503, { error: "temporarily unavailable" }));
        })
      })
    });
    try {
      await client.layout.setOrderLayout(7, {
        template: "tpl-1",
        language: LayoutLanguage.ENGLISH
      });
      throw new Error("Expected layout workflow to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(SevdeskWorkflowError);
      if (!(error instanceof SevdeskWorkflowError)) throw error;
      expect(error.failedOperationId).toBe("updateOrderTemplate");
      expect(error.completedSteps).toHaveLength(1);
      expect(error.completedSteps[0]?.operationId).toBe("updateOrderTemplate");
      const partial = error.partial as SetLayoutWorkflowPartial<
        "order",
        { readonly template: "tpl-1"; readonly language: "en_US" }
      >;
      expect(partial.applied.template?.value).toBe("tpl-1");
      expect(partial.applied.language).toBeUndefined();
    }
    expect(attempts).toBe(2);
  });
  it("rejects malformed collections at the curated response boundary", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => jsonResponse(config, { result: "1" }))
      })
    });
    await expect(client.layout.listTemplates()).rejects.toBeInstanceOf(
      SevdeskResponseValidationError
    );
    await expect(client.layout.listLetterpapers()).rejects.toBeInstanceOf(
      SevdeskResponseValidationError
    );
  });
});
