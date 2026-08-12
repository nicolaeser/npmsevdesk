import { describe, expect, it } from "vitest";
import { SevdeskConfigurationError } from "../src/utils/errors.js";
import {
  LOG_EVENT_TYPES,
  createConsoleLogger,
  emitLog,
  extractObservedRateLimitHeaders,
  formatTransportLogDetails,
  matchesOperationFilter,
  resolveEventFilter,
  resolveLogging,
  shouldEmitLog,
  type SevdeskLogEvent
} from "../src/utils/logging.js";

describe("logging helpers", () => {
  it("exposes the full event-type catalog", () => {
    expect(LOG_EVENT_TYPES).toEqual([
      "request",
      "response",
      "retry",
      "error",
      "workflow-step",
      "workflow-error"
    ]);
  });
  it("resolves event presets, arrays, and maps", () => {
    expect(resolveEventFilter("errors")).toMatchObject({
      error: true,
      retry: true,
      "workflow-error": true,
      request: false,
      response: false
    });
    expect(resolveEventFilter("transport")).toMatchObject({
      request: true,
      response: true,
      retry: true,
      error: true,
      "workflow-step": false
    });
    expect(resolveEventFilter(["error", "retry"])).toMatchObject({
      error: true,
      retry: true,
      request: false
    });
    expect(resolveEventFilter({ error: true, request: true })).toMatchObject({
      error: true,
      request: true,
      response: false
    });
    expect(resolveEventFilter("none")).toMatchObject({
      request: false,
      error: false
    });
  });
  it("enables logging from debug, logger, or logging.console", () => {
    expect(resolveLogging({}).enabled).toBe(false);
    expect(resolveLogging({ debug: true }).enabled).toBe(true);
    expect(resolveLogging({ logging: { console: true } }).enabled).toBe(true);
    expect(
      resolveLogging({
        logger: { log() {} },
        logging: { events: "errors", level: "warn" }
      })
    ).toMatchObject({
      enabled: true,
      level: "warn",
      events: expect.objectContaining({ error: true, request: false })
    });
  });
  it("filters emitLog by level, event type, operations, and slowMs", () => {
    const seen: SevdeskLogEvent[] = [];
    const logging = resolveLogging({
      logger: { log: (event) => seen.push(event) },
      logging: {
        level: "info",
        events: "transport",
        slowMs: 100,
        includeOperations: ["book*"],
        excludeOperations: ["bookInvoicePos"]
      }
    });
    emitLog(logging, {
      type: "request",
      message: "debug request filtered by level",
      operationId: "bookInvoice"
    });
    expect(seen).toHaveLength(0);
    emitLog(logging, {
      type: "error",
      message: "error passes",
      operationId: "bookInvoice"
    });
    expect(seen).toHaveLength(1);
    expect(seen[0]?.level).toBe("error");
    seen.length = 0;
    emitLog(logging, {
      type: "response",
      message: "fast response filtered",
      operationId: "bookInvoice",
      durationMs: 10
    });
    expect(seen).toHaveLength(0);
    emitLog(logging, {
      type: "response",
      message: "slow response",
      operationId: "bookInvoice",
      durationMs: 150,
      level: "info"
    });
    expect(seen).toHaveLength(1);
    seen.length = 0;
    emitLog(logging, {
      type: "error",
      message: "excluded op",
      operationId: "bookInvoicePos"
    });
    expect(seen).toHaveLength(0);
    emitLog(logging, {
      type: "error",
      message: "not included prefix",
      operationId: "getInvoices"
    });
    expect(seen).toHaveLength(0);
  });
  it("builds independent redacted detail sections", () => {
    const logging = resolveLogging({
      logger: { log() {} },
      logging: {
        bodyMode: "redacted",
        headersMode: "redacted",
        queryMode: "redacted",
        maxDetailsChars: 10_000
      }
    });
    const details = formatTransportLogDetails(logging, "request", "createInvoice", "request", {
      headers: { Authorization: "secret-token", Accept: "application/json" },
      query: { limit: 1, password: "query-secret" },
      body: { password: "body-secret", name: "Acme" }
    });
    expect(details).toMatchObject({
      headers: expect.not.objectContaining({ Authorization: "secret-token" }),
      query: expect.objectContaining({ limit: 1 }),
      body: expect.objectContaining({ name: "Acme" })
    });
    expect(JSON.stringify(details)).toContain("[REDACTED]");
    expect(JSON.stringify(details)).not.toContain("secret-token");
    expect(JSON.stringify(details)).not.toContain("body-secret");
  });
  it("omits details when all detail modes are none", () => {
    const logging = resolveLogging({
      logger: { log() {} },
      logging: { bodyMode: "none", headersMode: "none", queryMode: "none" }
    });
    expect(
      formatTransportLogDetails(logging, "response", "getInvoices", "response", {
        headers: { Accept: "application/json" },
        body: { objects: [] }
      })
    ).toBeUndefined();
  });
  it("matches operation include/exclude patterns", () => {
    expect(matchesOperationFilter("getInvoices", ["getInvoice*"], undefined)).toBe(true);
    expect(matchesOperationFilter("bookInvoice", ["getInvoice*"], undefined)).toBe(false);
    expect(matchesOperationFilter("getInvoices", undefined, ["getInvoices"])).toBe(false);
    expect(matchesOperationFilter("getInvoiceById", ["getInvoice*"], ["getInvoices"])).toBe(true);
  });
  it("orders levels for threshold checks", () => {
    expect(shouldEmitLog("error", "warn")).toBe(true);
    expect(shouldEmitLog("debug", "info")).toBe(false);
    expect(shouldEmitLog("info", "info")).toBe(true);
  });
  it("honors includeTimings and extracts observed rate-limit headers only", () => {
    const seen: SevdeskLogEvent[] = [];
    const withTiming = resolveLogging({
      logger: { log: (event) => seen.push(event) },
      logging: { includeTimings: true, events: ["response"] }
    });
    emitLog(withTiming, {
      type: "response",
      message: "timed",
      operationId: "getInvoices",
      durationMs: 42,
      level: "info"
    });
    expect(seen[0]?.durationMs).toBe(42);
    seen.length = 0;
    const withoutTiming = resolveLogging({
      logger: { log: (event) => seen.push(event) },
      logging: { includeTimings: false, events: ["response"] }
    });
    emitLog(withoutTiming, {
      type: "response",
      message: "untimed",
      operationId: "getInvoices",
      durationMs: 42,
      level: "info"
    });
    expect(seen[0]?.durationMs).toBeUndefined();
    expect(
      extractObservedRateLimitHeaders({
        "Retry-After": "20",
        "X-RateLimit-Remaining": "3",
        "Content-Type": "application/json"
      })
    ).toEqual({
      "retry-after": "20",
      "x-ratelimit-remaining": "3"
    });
    expect(extractObservedRateLimitHeaders({ "Content-Type": "application/json" })).toBeUndefined();
  });
  it("isolates console logger failures and validates config", () => {
    const logger = createConsoleLogger({ level: "error", prefix: "[test]" });
    expect(() =>
      logger.log({
        level: "error",
        type: "error",
        message: "ok",
        timestamp: new Date().toISOString()
      })
    ).not.toThrow();
    expect(() => resolveLogging({ logging: { events: "nope" as never } })).toThrow(
      SevdeskConfigurationError
    );
    expect(() => resolveLogging({ logging: { eventLevels: { error: "trace" as never } } })).toThrow(
      SevdeskConfigurationError
    );
    expect(() => resolveLogging({ logging: { slowMs: -1 } })).toThrow(SevdeskConfigurationError);
  });
});
