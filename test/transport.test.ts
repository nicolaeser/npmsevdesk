import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import packageMetadata from "../package.json" with { type: "json" };
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import {
  SevdeskAuthenticationError,
  SevdeskCancellationError,
  SevdeskConfigurationError,
  SevdeskNetworkError,
  SevdeskRateLimitError,
  SevdeskResponseValidationError,
  SevdeskServerError,
  SevdeskValidationError
} from "../src/utils/errors.js";
import { adapter, jsonResponse, responseError } from "./helpers.js";

describe("Axios transport", () => {
  it("authenticates, unwraps primary data, retains raw JSON and reports pagination", async () => {
    let captured: InternalAxiosRequestConfig | undefined;
    const instance = axios.create({
      adapter: adapter((config) => {
        captured = config;
        return jsonResponse(config, {
          objects: [{ id: "1", objectName: "Invoice" }],
          total: 5
        });
      })
    });
    const client = createSevdeskClient({
      apiToken: "0123456789abcdef0123456789abcdef",
      userAgent: "test-integration/1.0",
      axiosInstance: instance
    });
    const result = await client.raw.invoice.getInvoices({
      query: { limit: 1, offset: 0, countAll: true }
    });
    expect(result.data).toEqual([{ id: "1", objectName: "Invoice" }]);
    expect(result.objects).toBe(result.data);
    expect(result.json).toEqual({
      objects: [{ id: "1", objectName: "Invoice" }],
      total: 5
    });
    expect(result.raw.status).toBe(200);
    expect(result.pagination).toMatchObject({
      limit: 1,
      offset: 0,
      total: 5,
      returned: 1,
      nextOffset: 1,
      hasMore: true
    });
    const headers = AxiosHeaders.from(captured?.headers);
    expect(headers.get("Authorization")).toBe("0123456789abcdef0123456789abcdef");
    expect(headers.get("X-Sevdesk-Client")).toBe("test-integration/1.0");
    expect(AxiosHeaders.from(result.raw.config.headers).has("Authorization")).toBe(false);
    const omittedRequest: undefined = result.raw.request;
    void omittedRequest;
    expect(result.raw.request).toBeUndefined();
    expect(JSON.stringify(result.raw)).not.toContain("0123456789abcdef0123456789abcdef");
  });
  it("normalizes modeled validation and authentication failures", async () => {
    let status = 422;
    const instance = axios.create({
      adapter: adapter((config) =>
        Promise.reject(
          responseError(config, status, {
            message: status === 422 ? "invalid invoice" : "invalid token"
          })
        )
      )
    });
    const client = createSevdeskClient({
      apiToken: "invalid-for-test",
      retries: false,
      axiosInstance: instance
    });
    await expect(client.raw.invoice.getInvoices()).rejects.toBeInstanceOf(SevdeskValidationError);
    status = 401;
    await expect(client.raw.invoice.getInvoices()).rejects.toBeInstanceOf(
      SevdeskAuthenticationError
    );
  });
  it("retries safe reads but never retries a factory write by default", async () => {
    let reads = 0;
    let writes = 0;
    const instance = axios.create({
      adapter: adapter((config) => {
        if (config.url === "/Invoice") {
          reads += 1;
          if (reads === 1) return Promise.reject(responseError(config, 503, {}));
          return jsonResponse(config, { objects: [] });
        }
        writes += 1;
        return Promise.reject(responseError(config, 503, {}));
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: { attempts: 2, baseDelayMs: 0, maxDelayMs: 0 },
      axiosInstance: instance
    });
    await client.raw.invoice.getInvoices();
    expect(reads).toBe(2);
    await expect(
      client.raw.invoice.createInvoiceByFactory({
        body: {} as never
      })
    ).rejects.toThrow();
    expect(writes).toBe(1);
  });
  it("retries an Axios timeout only for a retry-safe operation", async () => {
    let attempts = 0;
    const instance = axios.create({
      adapter: adapter((config) => {
        attempts += 1;
        if (attempts === 1) {
          return Promise.reject(new AxiosError("read timed out", "ECONNABORTED", config));
        }
        return jsonResponse(config, { objects: [] });
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: { attempts: 1, baseDelayMs: 0, maxDelayMs: 0 },
      axiosInstance: instance
    });
    await client.raw.invoice.getInvoices();
    expect(attempts).toBe(2);
  });
  it("retries writes only when unsafe operation retries are explicitly enabled", async () => {
    let attempts = 0;
    const events: Array<{ type: string }> = [];
    const instance = axios.create({
      adapter: adapter((config) => {
        attempts += 1;
        if (attempts === 1) return Promise.reject(responseError(config, 503, {}));
        return jsonResponse(config, { objects: { invoice: { id: "1" } } });
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: {
        attempts: 1,
        baseDelayMs: 0,
        maxDelayMs: 0,
        unsafeOperations: true
      },
      axiosInstance: instance,
      logger: { log: (event) => events.push(event) }
    });
    await client.raw.invoice.createInvoiceByFactory({
      body: { password: "VERYSECRET" } as never
    });
    expect(attempts).toBe(2);
    expect(events.filter((event) => event.type === "response")).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain("VERYSECRET");
  });
  it("logs metadata only by default", async () => {
    const events: unknown[] = [];
    const instance = axios.create({
      adapter: adapter((config) =>
        jsonResponse(config, { objects: [], privateCustomerName: "PRIVATE-RESPONSE" })
      )
    });
    const client = createSevdeskClient({
      apiToken: "super-secret-token",
      axiosInstance: instance,
      logger: { log: (event) => events.push(event) }
    });
    await client.request({
      method: "POST",
      path: "/FutureResource",
      body: { privateCustomerName: "PRIVATE-REQUEST", password: "VERYSECRET" }
    });
    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain("super-secret-token");
    expect(serialized).not.toContain("PRIVATE-REQUEST");
    expect(serialized).not.toContain("PRIVATE-RESPONSE");
    expect(serialized).not.toContain("VERYSECRET");
    expect(events).toHaveLength(2);
  });
  it("includes bodies only in explicit redacted mode and reapplies credential redaction", async () => {
    const events: unknown[] = [];
    const phases: string[] = [];
    const instance = axios.create({
      adapter: adapter((config) =>
        jsonResponse(config, {
          objects: [],
          privateCustomerName: "PRIVATE-RESPONSE",
          token: "RESPONSE-TOKEN"
        })
      )
    });
    const client = createSevdeskClient({
      apiToken: "super-secret-token",
      axiosInstance: instance,
      logger: { log: (event) => events.push(event) },
      logging: {
        bodyMode: "redacted",
        redactor(value, context) {
          phases.push(context.phase);
          return JSON.parse(
            JSON.stringify(value).replaceAll(/PRIVATE-(?:REQUEST|RESPONSE)/g, "[BUSINESS-REDACTED]")
          ) as unknown;
        }
      }
    });
    await client.request({
      method: "POST",
      path: "/FutureResource",
      body: {
        privateCustomerName: "PRIVATE-REQUEST",
        password: "REQUEST-PASSWORD"
      }
    });
    const serialized = JSON.stringify(events);
    expect(serialized).toContain("[BUSINESS-REDACTED]");
    expect(serialized).toContain("[REDACTED]");
    expect(serialized).not.toContain("PRIVATE-REQUEST");
    expect(serialized).not.toContain("PRIVATE-RESPONSE");
    expect(serialized).not.toContain("REQUEST-PASSWORD");
    expect(serialized).not.toContain("RESPONSE-TOKEN");
    expect(serialized).not.toContain("super-secret-token");
    expect(phases).toEqual(["request", "response"]);
  });
  it("does not let a throwing logger or redactor change request behavior", async () => {
    const instance = axios.create({
      adapter: adapter((config) => jsonResponse(config, { objects: [] }))
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance,
      logger: {
        log() {
          throw new Error("logger failed");
        }
      },
      logging: {
        bodyMode: "redacted",
        redactor() {
          throw new Error("redactor failed");
        }
      }
    });
    await expect(client.raw.invoice.getInvoices()).resolves.toMatchObject({ data: [] });
  });
  it("filters log events by type preset and per-type map", async () => {
    const events: Array<{ type: string }> = [];
    const instance = axios.create({
      adapter: adapter((config) => jsonResponse(config, { objects: [] }))
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance,
      logger: { log: (event) => events.push(event) },
      logging: { events: "errors" }
    });
    await client.raw.invoice.getInvoices();
    expect(events).toEqual([]);
    events.length = 0;
    const errorsOnly = createSevdeskClient({
      apiToken: "test-token",
      retries: false,
      axiosInstance: axios.create({
        adapter: adapter((config) => Promise.reject(responseError(config, 500, {})))
      }),
      logger: { log: (event) => events.push(event) },
      logging: { events: { error: true, request: false, response: false, retry: false } }
    });
    await expect(errorsOnly.raw.invoice.getInvoices()).rejects.toBeInstanceOf(SevdeskServerError);
    expect(events.map((event) => event.type)).toEqual(["error"]);
  });
  it("respects operation include/exclude filters and slowMs for responses", async () => {
    const events: Array<{ type: string; operationId?: string | undefined }> = [];
    const instance = axios.create({
      adapter: adapter((config) => jsonResponse(config, { objects: [] }))
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance,
      logger: { log: (event) => events.push(event) },
      logging: {
        events: "lifecycle",
        includeOperations: ["getInvoice*"],
        excludeOperations: ["getInvoices"],
        slowMs: 60_000
      }
    });
    await client.raw.invoice.getInvoices();
    expect(events).toEqual([]);
    events.length = 0;
    const slowOnly = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance,
      logger: { log: (event) => events.push(event) },
      logging: {
        events: ["response"],
        slowMs: 60_000
      }
    });
    await slowOnly.raw.invoice.getInvoices();
    expect(events).toEqual([]);
  });
  it("serializes errors as metadata only unless redacted data is explicitly requested", async () => {
    const instance = axios.create({
      adapter: adapter((config) =>
        Promise.reject(responseError(config, 422, { message: "invalid payload" }))
      )
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: false,
      axiosInstance: instance
    });
    let error: unknown;
    try {
      await client.request({
        method: "POST",
        path: "/FutureResource",
        body: { password: "VERYSECRET" }
      });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(SevdeskValidationError);
    const apiError = error as SevdeskValidationError;
    const defaultJson = JSON.stringify(apiError);
    const dataDiagnostic = JSON.stringify(apiError.toDiagnostic({ includeData: true }));
    expect(defaultJson).not.toContain("VERYSECRET");
    expect(defaultJson).not.toContain("invalid payload");
    expect(defaultJson).not.toContain("responseBody");
    expect(defaultJson).not.toContain("requestBody");
    expect(dataDiagnostic).not.toContain("VERYSECRET");
    expect(dataDiagnostic).toContain("[REDACTED]");
    expect(dataDiagnostic).toContain("invalid payload");
    expect(AxiosHeaders.from(apiError.response.config.headers).has("Authorization")).toBe(false);
    expect(apiError.response.request).toBeUndefined();
    expect(JSON.stringify(apiError.cause)).not.toContain("test-token");
    expect(JSON.stringify(apiError.cause)).not.toContain("config");
  });
  it("does not retain request credentials in normalized server errors", async () => {
    const token = "non-enumerable-secret-token";
    const instance = axios.create({
      adapter: adapter((config) => {
        const error = responseError(config, 503, {});
        error.message = `Authorization: ${token}`;
        error.stack = `AxiosError: Authorization: ${token}`;
        return Promise.reject(error);
      })
    });
    const client = createSevdeskClient({
      apiToken: token,
      retries: false,
      axiosInstance: instance
    });
    let error: unknown;
    try {
      await client.raw.invoice.getInvoices();
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(SevdeskServerError);
    const apiError = error as SevdeskServerError;
    expect(apiError.response.request).toBeUndefined();
    expect(AxiosHeaders.from(apiError.response.config.headers).has("Authorization")).toBe(false);
    expect(JSON.stringify(apiError)).not.toContain(token);
    expect(JSON.stringify(apiError.cause)).not.toContain(token);
    expect((apiError.cause as Error).message).not.toContain(token);
    expect((apiError.cause as Error).stack).not.toContain(token);
  });
  it("keeps network and response-validation error JSON metadata-only", () => {
    const network = new SevdeskNetworkError(
      "socket failed near PRIVATE-CUSTOMER",
      {
        operationId: "custom:POST:/FutureResource",
        method: "POST",
        url: "/FutureResource",
        requestBody: { customer: "PRIVATE-CUSTOMER" }
      },
      "ECONNRESET"
    );
    const validation = new SevdeskResponseValidationError("invalid customer PRIVATE-CUSTOMER", {
      value: { customer: "PRIVATE-CUSTOMER" }
    });
    expect(JSON.stringify(network)).not.toContain("PRIVATE-CUSTOMER");
    expect(JSON.stringify(validation)).not.toContain("PRIVATE-CUSTOMER");
    expect(JSON.stringify(network.toDiagnostic({ includeData: true }))).toContain(
      "PRIVATE-CUSTOMER"
    );
    expect(JSON.stringify(validation.toDiagnostic({ includeData: true }))).toContain(
      "PRIVATE-CUSTOMER"
    );
  });
  it("applies resource versions to custom requests and rejects external URLs before auth", async () => {
    let captured: InternalAxiosRequestConfig | undefined;
    const instance = axios.create({
      adapter: adapter((config) => {
        captured = config;
        return jsonResponse(config, { objects: [] });
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      resourceVersion: "2.0",
      axiosInstance: instance
    });
    await client.request({ method: "GET", path: "/FutureResource" });
    expect(AxiosHeaders.from(captured?.headers).get("X-Version")).toBe("2.0");
    captured = undefined;
    await expect(
      client.request({ method: "GET", path: "https://attacker.example/collect" })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(captured).toBeUndefined();
  });
  it("validates resource-version values", () => {
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        resourceVersion: "latest" as "default"
      })
    ).toThrow(SevdeskConfigurationError);
    const client = createSevdeskClient({
      apiToken: "test-token",
      resourceVersion: "2.0"
    });
    expect(client.prepare("getInvoices", {}).headers["X-Version"]).toBe("2.0");
    expect(() =>
      client.prepare("getInvoices", {
        options: { resourceVersion: "latest" as "default" }
      })
    ).toThrow(SevdeskConfigurationError);
  });
  it("requires HTTPS except for an explicit localhost development opt-in", () => {
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        baseURL: "http://sevdesk.example/api/v1",
        allowInsecureLocalhost: true
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        baseURL: "http://127.0.0.1:3000/api/v1"
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        baseURL: "http://localhost:3000/api/v1",
        allowInsecureLocalhost: true
      })
    ).not.toThrow();
  });
  it("rejects authentication targets outside the configured origin and API prefix", async () => {
    let tokenResolutions = 0;
    let adapterCalls = 0;
    const instance = axios.create({
      adapter: adapter((config) => {
        adapterCalls += 1;
        return jsonResponse(config, { objects: [] });
      })
    });
    const client = createSevdeskClient({
      apiToken: () => {
        tokenResolutions += 1;
        return "test-token";
      },
      axiosInstance: instance
    });
    await expect(client.axios.get("https://attacker.example/collect")).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    await expect(client.axios.get("https://my.sevdesk.de/outside-api")).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    await expect(
      client.axios.get("/collect", { baseURL: "https://attacker.example" })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(tokenResolutions).toBe(0);
    expect(adapterCalls).toBe(0);
  });
  it("validates retry numbers before preparing or sending requests", () => {
    for (const attempts of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        createSevdeskClient({
          apiToken: "test-token",
          retries: { attempts }
        })
      ).toThrow(SevdeskConfigurationError);
    }
    for (const baseDelayMs of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        createSevdeskClient({
          apiToken: "test-token",
          retries: { baseDelayMs }
        })
      ).toThrow(SevdeskConfigurationError);
    }
    const client = createSevdeskClient({ apiToken: "test-token" });
    expect(() =>
      client.prepare("getInvoices", {
        options: { retry: { attempts: 0.5 } }
      })
    ).toThrow(SevdeskConfigurationError);
  });
  it("validates timeouts and security/logging options for JavaScript callers", async () => {
    for (const timeoutMs of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2_147_483_648]) {
      expect(() =>
        createSevdeskClient({
          apiToken: "test-token",
          timeoutMs
        })
      ).toThrow(SevdeskConfigurationError);
    }
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        allowInsecureLocalhost: "yes" as never
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        logging: { bodyMode: "everything" as never }
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        logging: { headersMode: "full" as never }
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        logging: { events: "verbose" as never }
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        logging: { events: ["not-a-real-event" as never] }
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        logging: { redactor: "redact" as never }
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      createSevdeskClient({
        apiToken: "test-token",
        logging: [] as never
      })
    ).toThrow(SevdeskConfigurationError);
    const client = createSevdeskClient({ apiToken: "test-token" });
    expect(() =>
      client.prepare("getInvoices", {
        options: { timeoutMs: Number.NaN }
      })
    ).toThrow(SevdeskConfigurationError);
    await expect(
      client.request({
        method: "GET",
        path: "/FutureResource",
        timeoutMs: -1
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
  });
  it("honors Retry-After even when it exceeds the configured jitter cap", async () => {
    let calls = 0;
    const events: Array<{ type: string; details?: unknown }> = [];
    const instance = axios.create({
      adapter: adapter((config) => {
        calls += 1;
        if (calls === 1) {
          const error = responseError(config, 429, {});
          if (!error.response) throw new Error("response fixture unexpectedly has no response");
          error.response.headers = new AxiosHeaders({ "Retry-After": "0.02" });
          return Promise.reject(error);
        }
        return jsonResponse(config, { objects: [] });
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: { attempts: 1, baseDelayMs: 0, maxDelayMs: 0 },
      axiosInstance: instance,
      logger: { log: (event) => events.push(event) }
    });
    const startedAt = Date.now();
    await client.raw.invoice.getInvoices();
    expect(calls).toBe(2);
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(15);
    expect(events.find((event) => event.type === "retry")?.details).toEqual({
      delayMs: 20,
      code: "ERR_BAD_RESPONSE"
    });
  });
  it("can cancel while waiting for Retry-After", async () => {
    let calls = 0;
    const instance = axios.create({
      adapter: adapter((config) => {
        calls += 1;
        const error = responseError(config, 429, {});
        if (!error.response) throw new Error("response fixture unexpectedly has no response");
        error.response.headers = new AxiosHeaders({ "Retry-After": "10" });
        return Promise.reject(error);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: { attempts: 1 },
      axiosInstance: instance
    });
    const controller = new AbortController();
    const pending = client.raw.invoice.getInvoices({
      options: { signal: controller.signal }
    });
    setTimeout(() => controller.abort(), 5);
    await expect(pending).rejects.toBeInstanceOf(SevdeskCancellationError);
    expect(calls).toBe(1);
  });
  it("preserves Retry-After metadata on a final rate-limit error", async () => {
    const instance = axios.create({
      adapter: adapter((config) => {
        const error = responseError(config, 429, {});
        if (!error.response) throw new Error("response fixture unexpectedly has no response");
        error.response.headers = new AxiosHeaders({ "Retry-After": "2" });
        return Promise.reject(error);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      retries: false,
      axiosInstance: instance
    });
    let error: unknown;
    try {
      await client.raw.invoice.getInvoices();
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(SevdeskRateLimitError);
    expect((error as SevdeskRateLimitError).retryAfterMs).toBe(2_000);
    expect((error as SevdeskRateLimitError).toJSON()).toMatchObject({
      status: 429,
      retryAfterMs: 2_000
    });
  });
  it("ejects SDK interceptors and disables the disposed client", async () => {
    const captured: InternalAxiosRequestConfig[] = [];
    const instance = axios.create({
      adapter: adapter((config) => {
        captured.push(config);
        return jsonResponse(config, { objects: [] });
      })
    });
    const client = createSevdeskClient({
      apiToken: "dispose-token",
      axiosInstance: instance
    });
    await client.raw.invoice.getInvoices();
    client.dispose();
    client.dispose();
    expect(() => client.prepare("getInvoices", {})).toThrow(SevdeskConfigurationError);
    await expect(client.raw.invoice.getInvoices()).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    await instance.get("/Invoice");
    expect(AxiosHeaders.from(captured[0]?.headers).get("Authorization")).toBe("dispose-token");
    expect(AxiosHeaders.from(captured[1]?.headers).has("Authorization")).toBe(false);
  });
  it("derives the default client header from package metadata", async () => {
    let captured: InternalAxiosRequestConfig | undefined;
    const instance = axios.create({
      adapter: adapter((config) => {
        captured = config;
        return jsonResponse(config, { objects: [] });
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    await client.raw.invoice.getInvoices();
    expect(AxiosHeaders.from(captured?.headers).get("X-Sevdesk-Client")).toBe(
      `${packageMetadata.name}/${packageMetadata.version}`
    );
  });
  it("uploads voucher blobs as real multipart file parts", async () => {
    let uploadedText: string | undefined;
    let uploadedName: string | undefined;
    const instance = axios.create({
      adapter: adapter(async (config) => {
        expect(config.data).toBeInstanceOf(FormData);
        const part = (config.data as FormData).get("file");
        expect(part).toBeInstanceOf(Blob);
        uploadedText = await (part as Blob).text();
        uploadedName =
          part !== null && typeof part === "object" && "name" in part
            ? String(part.name)
            : undefined;
        return jsonResponse(config, { objects: { filename: "temporary-upload.pdf" } }, 201);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    await client.vouchers.uploadAttachment({
      data: new TextEncoder().encode("voucher bytes"),
      filename: "receipt.txt",
      contentType: "text/plain"
    });
    expect(uploadedText).toBe("voucher bytes");
    expect(uploadedName).toBe("receipt.txt");
  });
  it("supports binary values on the generated raw multipart method", async () => {
    let uploadedText: string | undefined;
    const instance = axios.create({
      adapter: adapter(async (config) => {
        expect(config.data).toBeInstanceOf(FormData);
        const file = (config.data as FormData).get("file");
        expect(file).toBeInstanceOf(Blob);
        uploadedText = await (file as Blob).text();
        return jsonResponse(config, { objects: { filename: "raw-upload.pdf" } }, 201);
      })
    });
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    await client.raw.voucher.voucherUploadFile({
      body: { file: new TextEncoder().encode("raw voucher bytes") }
    });
    expect(uploadedText).toBe("raw voucher bytes");
  });
});
