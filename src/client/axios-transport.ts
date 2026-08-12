import axios, {
  AxiosHeaders,
  CanceledError,
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type GenericAbortSignal,
  type InternalAxiosRequestConfig
} from "axios";
import packageMetadata from "../../package.json" with { type: "json" };
import type {
  CustomRequest,
  PerRequestRetryOptions,
  RequestOptions,
  RetryOptions,
  SevdeskClientConfig
} from "../types/config.js";
import type { operations } from "../types/openapi.js";
import type {
  OperationExecutor,
  PreparedRequest,
  RequestBodyFor,
  RequestFor,
  ResponseJsonFor,
  ResultFor,
  TransportBodyFor
} from "../types/operation.js";
import type { PrimaryData, SevdeskResult } from "../types/result.js";
import {
  SevdeskConfigurationError,
  normalizeAxiosError,
  retryAfterMilliseconds
} from "../utils/errors.js";
import {
  emitLog,
  extractObservedRateLimitHeaders,
  formatTransportLogDetails,
  resolveLogging,
  validateLoggingConfig,
  type ResolvedLogging
} from "../utils/logging.js";
import { mergeQuery, serializeQuery, type QueryObject } from "../utils/query.js";
import { redact, redactHeaders } from "../utils/redact.js";
import { createResult } from "../utils/result.js";
import { validateTimeoutMs } from "../utils/validation.js";
import { operationCatalog } from "./operation-catalog.js";

const DEFAULT_BASE_URL = "https://my.sevdesk.de/api/v1";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_USER_AGENT = `${packageMetadata.name}/${packageMetadata.version}`;
const MAX_TIMER_DELAY_MS = 2_147_483_647;
const DEFAULT_RETRY: Required<RetryOptions> = {
  attempts: 2,
  baseDelayMs: 250,
  maxDelayMs: 4_000,
  unsafeOperations: false
};

interface InternalMetadata {
  operationId: string;
  retrySafe: boolean;
  attempt: number;
  startedAt: number;
  safeBody?: unknown;
  responseLogged?: boolean;
  retry?: boolean | { attempts?: number; unsafe?: boolean };
}

type InternalConfig<D = unknown> = InternalAxiosRequestConfig<D> & {
  _sevdesk?: InternalMetadata;
};

interface RuntimeRequest {
  readonly path?: Readonly<Record<string, unknown>>;
  readonly query?: QueryObject;
  readonly headers?: Readonly<Record<string, unknown>>;
  readonly body?: unknown;
  readonly extraQuery?: QueryObject;
  readonly options?: RequestOptions;
}

interface AuthenticationScope {
  readonly baseURL: string;
  readonly origin: string;
  readonly apiPrefix: string;
}

interface InstalledInterceptors {
  readonly request: number;
  readonly responses: readonly number[];
}

export class AxiosTransport implements OperationExecutor {
  public readonly axios: AxiosInstance;
  public readonly logging: ResolvedLogging;
  private readonly tokenProvider: SevdeskClientConfig["apiToken"];
  private readonly resourceVersion: string | undefined;
  private readonly userAgent: string;
  private readonly retry: Required<RetryOptions> | false;
  private readonly baseURL: string;
  private readonly authenticationScope: AuthenticationScope;
  private readonly interceptors: InstalledInterceptors;
  private disposed = false;
  public constructor(config: SevdeskClientConfig) {
    validateTransportConfiguration(config);
    const timeoutMs = validateTimeoutMs(
      config.timeoutMs ?? config.axiosInstance?.defaults.timeout ?? DEFAULT_TIMEOUT_MS,
      "Client timeoutMs"
    );
    this.tokenProvider = config.apiToken;
    this.resourceVersion = validateResourceVersion(config.resourceVersion, "client configuration");
    this.userAgent = config.userAgent ?? DEFAULT_USER_AGENT;
    this.retry = normalizeRetryOptions(config.retries);
    this.logging = resolveLogging(config);
    this.authenticationScope = createAuthenticationScope(
      config.baseURL ?? DEFAULT_BASE_URL,
      config.allowInsecureLocalhost === true
    );
    this.baseURL = this.authenticationScope.baseURL;
    this.axios =
      config.axiosInstance ??
      axios.create({
        baseURL: this.baseURL,
        timeout: timeoutMs,
        ...(config.headers ? { headers: config.headers } : {})
      });
    if (config.axiosInstance) {
      this.axios.defaults.baseURL = this.baseURL;
      this.axios.defaults.timeout = timeoutMs;
      if (config.headers) {
        Object.assign(this.axios.defaults.headers.common, config.headers);
      }
    }
    this.interceptors = this.installInterceptors();
  }
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.axios.interceptors.request.eject(this.interceptors.request);
    for (const id of this.interceptors.responses) {
      this.axios.interceptors.response.eject(id);
    }
  }
  public async execute<TOperationId extends keyof operations>(
    operationId: TOperationId,
    request: RequestFor<operations[TOperationId]>
  ): Promise<ResultFor<operations[TOperationId]>> {
    type TOperation = operations[TOperationId];
    type TBody = TransportBodyFor<TOperation>;
    type TJson = ResponseJsonFor<TOperation>;
    const prepared = this.prepare(operationId, request);
    const runtime = request as RuntimeRequest;
    const query = mergeQuery(runtime.query, runtime.extraQuery);
    const response = await this.axios.request<TJson, AxiosResponse<TJson, TBody>, TBody>(
      prepared.axios
    );
    return createResult(response, query as Readonly<Record<string, unknown>> | undefined);
  }
  public prepare<TOperationId extends keyof operations>(
    operationId: TOperationId,
    request: RequestFor<operations[TOperationId]>
  ): PreparedRequest<RequestBodyFor<operations[TOperationId]>, TOperationId> {
    this.assertActive();
    type TBody = RequestBodyFor<operations[TOperationId]>;
    const definition = operationCatalog[operationId];
    const runtime = request as RuntimeRequest;
    const path = interpolatePath(definition.path, runtime.path);
    const query = mergeQuery(runtime.query, runtime.extraQuery);
    const queryString = serializeQuery(query, definition.query);
    const options = runtime.options;
    const retry = normalizePerRequestRetry(options?.retry);
    const timeoutMs =
      options?.timeoutMs === undefined
        ? undefined
        : validateTimeoutMs(options.timeoutMs, `request timeoutMs for ${String(operationId)}`);
    const headers = AxiosHeaders.from({
      Accept: definition.responseContentType ?? "application/json",
      ...(runtime.headers ?? {}),
      ...(options?.headers ?? {})
    });
    const resourceVersion =
      validateResourceVersion(
        options?.resourceVersion,
        `request options for ${String(operationId)}`
      ) ?? this.resourceVersion;
    if (resourceVersion) headers.set("X-Version", resourceVersion);
    let body = runtime.body;
    if (body !== undefined && definition.requestContentType === "multipart/form-data") {
      body = isFormData(body) ? body : toMultipartFormData(body);
    } else if (body !== undefined && definition.requestContentType) {
      headers.set("Content-Type", definition.requestContentType);
    }
    const axiosConfig = {
      ...(options?.axios ?? {}),
      method: definition.method,
      url: path,
      params: query,
      paramsSerializer: {
        serialize: () => queryString
      },
      transformRequest: axios.defaults.transformRequest,
      transformResponse: axios.defaults.transformResponse,
      validateStatus: isSuccessfulStatus,
      headers,
      ...(body === undefined ? {} : { data: body }),
      ...(options?.signal ? { signal: options.signal } : {}),
      ...(timeoutMs === undefined ? {} : { timeout: timeoutMs }),
      _sevdesk: {
        operationId: definition.operationId,
        retrySafe: definition.retrySafe,
        attempt: 0,
        startedAt: Date.now(),
        ...(runtime.body === undefined ? {} : { safeBody: redact(runtime.body) }),
        ...(retry === undefined ? {} : { retry })
      }
    } as unknown as AxiosRequestConfig<TransportBodyFor<operations[TOperationId]>> & {
      _sevdesk: InternalMetadata;
    };
    const headerRecord = headers.toJSON() as Record<string, unknown>;
    const url = `${this.baseURL}${path}${queryString ? `?${queryString}` : ""}`;
    return {
      operationId: definition.operationId,
      method: definition.method,
      path,
      url,
      queryString,
      headers: Object.fromEntries(
        Object.entries(redactHeaders(headerRecord)).map(([key, value]) => [key, String(value)])
      ),
      ...(runtime.body === undefined ? {} : { body: runtime.body }),
      axios: axiosConfig
    } as unknown as PreparedRequest<TBody, TOperationId>;
  }
  public async executeCustom<TJson = unknown, TBody = unknown>(
    request: CustomRequest<TBody>
  ): Promise<SevdeskResult<TJson, PrimaryData<TJson>, TBody>> {
    this.assertActive();
    assertRelativeApiPath(request.path);
    const options = request.options;
    const retry = normalizePerRequestRetry(options?.retry);
    const requestedTimeout = request.timeoutMs ?? options?.timeoutMs;
    const timeoutMs =
      requestedTimeout === undefined
        ? undefined
        : validateTimeoutMs(requestedTimeout, `custom request timeoutMs for ${request.path}`);
    const queryString = serializeQuery(request.query);
    const headers = new AxiosHeaders();
    for (const [name, value] of Object.entries(options?.headers ?? {})) {
      if (value !== undefined) headers.set(name, value);
    }
    if (request.headers !== undefined) headers.set(request.headers);
    const resourceVersion =
      validateResourceVersion(
        request.resourceVersion ?? options?.resourceVersion,
        `custom request ${request.method} ${request.path}`
      ) ?? this.resourceVersion;
    if (resourceVersion) headers.set("X-Version", resourceVersion);
    const response = await this.axios.request<TJson, AxiosResponse<TJson, TBody>, TBody>({
      ...(options?.axios ?? {}),
      method: request.method,
      url: request.path,
      params: request.query,
      paramsSerializer: { serialize: () => queryString },
      headers,
      validateStatus: isSuccessfulStatus,
      ...(request.body === undefined ? {} : { data: request.body }),
      ...(request.responseType ? { responseType: request.responseType } : {}),
      ...((request.signal ?? options?.signal) ? { signal: request.signal ?? options?.signal } : {}),
      ...(timeoutMs === undefined ? {} : { timeout: timeoutMs }),
      _sevdesk: {
        operationId: `custom:${request.method}:${request.path}`,
        retrySafe: request.retrySafe === true,
        attempt: 0,
        startedAt: Date.now(),
        ...(request.body === undefined ? {} : { safeBody: redact(request.body) }),
        ...(retry === undefined ? {} : { retry })
      }
    } as AxiosRequestConfig<TBody>);
    return createResult(response, request.query as Readonly<Record<string, unknown>> | undefined);
  }
  private installInterceptors(): InstalledInterceptors {
    const request = this.axios.interceptors.request.use(async (config) => {
      const internal = config as InternalConfig;
      internal._sevdesk ??= {
        operationId: "custom",
        retrySafe: false,
        attempt: 0,
        startedAt: Date.now()
      };
      internal._sevdesk.startedAt = Date.now();
      assertAuthenticatedRequestTarget(this.authenticationScope, config);
      const token = await resolveToken(this.tokenProvider);
      const headers = AxiosHeaders.from(config.headers);
      headers.set("Authorization", token);
      headers.set("Accept", headers.get("Accept") ?? "application/json");
      headers.set("X-Sevdesk-Client", this.userAgent);
      if (isNodeRuntime()) headers.set("User-Agent", this.userAgent);
      config.headers = headers;
      const operationId = internal._sevdesk.operationId;
      const details = formatTransportLogDetails(this.logging, "request", operationId, "request", {
        headers: headers.toJSON() as Record<string, unknown>,
        query: config.params,
        body: internal._sevdesk.safeBody ?? config.data
      });
      emitLog(this.logging, {
        type: "request",
        message: `sevdesk request ${String(config.method).toUpperCase()} ${config.url}`,
        operationId,
        method: String(config.method).toUpperCase(),
        url: config.url,
        attempt: internal._sevdesk.attempt,
        ...(details === undefined ? {} : { details })
      });
      return config;
    });
    const retry = this.axios.interceptors.response.use(undefined, async (error: unknown) => {
      if (!axios.isAxiosError(error) || !error.config) return Promise.reject(error);
      const config = error.config as InternalConfig;
      const metadata = config._sevdesk;
      if (!metadata || !this.shouldRetry(error, metadata)) return Promise.reject(error);
      metadata.attempt += 1;
      const delayMs = this.retryDelay(error, metadata.attempt);
      const rateLimits = this.observedRateLimits(error.response?.headers);
      emitLog(this.logging, {
        type: "retry",
        message: `Retrying sevdesk operation ${metadata.operationId}`,
        operationId: metadata.operationId,
        method: config.method?.toUpperCase(),
        url: config.url,
        status: error.response?.status,
        attempt: metadata.attempt,
        details: {
          delayMs,
          code: error.code,
          ...(rateLimits === undefined ? {} : { rateLimits })
        }
      });
      await abortableDelay(delayMs, config.signal);
      return this.axios.request(config);
    });
    const logging = this.axios.interceptors.response.use(
      (response) => {
        const config = response.config as InternalConfig;
        const metadata = config._sevdesk;
        if (metadata?.responseLogged !== true) {
          if (metadata) metadata.responseLogged = true;
          const operationId = metadata?.operationId ?? "custom";
          const rateLimits = this.observedRateLimits(response.headers);
          const details = formatTransportLogDetails(
            this.logging,
            "response",
            operationId,
            "response",
            {
              headers: response.headers as Record<string, unknown>,
              body: response.data,
              ...(rateLimits === undefined ? {} : { extra: { rateLimits } })
            }
          );
          emitLog(this.logging, {
            type: "response",
            message: `sevdesk response ${response.status} for ${operationId}`,
            operationId,
            method: config.method?.toUpperCase(),
            url: config.url,
            status: response.status,
            attempt: metadata?.attempt,
            durationMs:
              metadata?.startedAt === undefined ? undefined : Date.now() - metadata.startedAt,
            ...(details === undefined ? {} : { details })
          });
        }
        return response;
      },
      (error: unknown) => {
        if (axios.isAxiosError(error)) {
          const config = error.config as InternalConfig | undefined;
          const metadata = config?._sevdesk;
          const operationId = metadata?.operationId ?? "custom";
          const rateLimits = this.observedRateLimits(error.response?.headers);
          const bodyDetails = formatTransportLogDetails(
            this.logging,
            "error",
            operationId,
            "error",
            {
              headers: error.response?.headers as Record<string, unknown> | undefined,
              body: error.response?.data
            }
          );
          emitLog(this.logging, {
            type: "error",
            message: `sevdesk request failed for ${operationId}`,
            operationId,
            method: config?.method?.toUpperCase(),
            url: config?.url,
            status: error.response?.status,
            attempt: metadata?.attempt,
            durationMs:
              metadata?.startedAt === undefined ? undefined : Date.now() - metadata.startedAt,
            details: {
              code: error.code,
              ...(bodyDetails === undefined ? {} : { data: bodyDetails }),
              ...(rateLimits === undefined ? {} : { rateLimits })
            }
          });
        }
        return Promise.reject(error);
      }
    );
    const normalization = this.axios.interceptors.response.use(undefined, (error: unknown) =>
      Promise.reject(normalizeAxiosError(error))
    );
    return {
      request,
      responses: [retry, logging, normalization]
    };
  }
  private shouldRetry(error: AxiosError, metadata: InternalMetadata): boolean {
    if (this.retry === false) return false;
    if (metadata.retry === false) return false;
    const requestRetry = typeof metadata.retry === "object" ? metadata.retry : undefined;
    const attempts = requestRetry?.attempts ?? this.retry.attempts;
    if (metadata.attempt >= attempts) return false;
    const allowUnsafe =
      metadata.retrySafe || requestRetry?.unsafe === true || this.retry.unsafeOperations;
    if (!allowUnsafe) return false;
    if (!error.response) {
      return error.code !== "ERR_CANCELED";
    }
    return [408, 425, 429, 500, 502, 503, 504].includes(error.response.status);
  }
  private retryDelay(error: AxiosError, attempt: number): number {
    if (this.retry === false) return 0;
    const retryAfter = retryAfterMilliseconds(
      error.response === undefined
        ? undefined
        : typeof (error.response.headers as AxiosHeaders).get === "function"
          ? (error.response.headers as AxiosHeaders).get("retry-after")
          : error.response.headers["retry-after"]
    );
    if (retryAfter !== undefined) return retryAfter;
    const ceiling = Math.min(this.retry.maxDelayMs, this.retry.baseDelayMs * 2 ** (attempt - 1));
    return Math.floor(Math.random() * (ceiling + 1));
  }
  private observedRateLimits(headers: unknown): Readonly<Record<string, string>> | undefined {
    if (!this.logging.includeObservedRateLimits) return undefined;
    return extractObservedRateLimitHeaders(headers);
  }
  private assertActive(): void {
    if (this.disposed) {
      throw new SevdeskConfigurationError(
        "This sevdesk client has been disposed and cannot make further requests."
      );
    }
  }
}

function validateTransportConfiguration(config: SevdeskClientConfig): void {
  if (
    config.allowInsecureLocalhost !== undefined &&
    typeof config.allowInsecureLocalhost !== "boolean"
  ) {
    throw new SevdeskConfigurationError("allowInsecureLocalhost must be a boolean.");
  }
  validateLoggingConfig(config);
  if (typeof config.apiToken !== "string" && typeof config.apiToken !== "function") {
    throw new SevdeskConfigurationError("apiToken must be a string or token provider function.");
  }
}

function normalizeRetryOptions(
  value: SevdeskClientConfig["retries"]
): Required<RetryOptions> | false {
  if (value === false) return false;
  if (value !== undefined && (value === null || typeof value !== "object")) {
    throw new SevdeskConfigurationError("Retry options must be an object or false.");
  }
  const normalized = {
    ...DEFAULT_RETRY,
    ...value
  };
  assertNonNegativeSafeInteger(normalized.attempts, "Retry attempts");
  assertNonNegativeFiniteNumber(normalized.baseDelayMs, "Retry baseDelayMs");
  assertNonNegativeFiniteNumber(normalized.maxDelayMs, "Retry maxDelayMs");
  if (typeof normalized.unsafeOperations !== "boolean") {
    throw new SevdeskConfigurationError("Retry unsafeOperations must be a boolean.");
  }
  return normalized;
}

function normalizePerRequestRetry(
  value: RequestOptions["retry"]
): boolean | PerRequestRetryOptions | undefined {
  if (value === undefined || typeof value === "boolean") return value;
  if (value === null || typeof value !== "object") {
    throw new SevdeskConfigurationError("Per-request retry options must be an object or boolean.");
  }
  if (value.attempts !== undefined) {
    assertNonNegativeSafeInteger(value.attempts, "Per-request retry attempts");
  }
  if (value.unsafe !== undefined && typeof value.unsafe !== "boolean") {
    throw new SevdeskConfigurationError("Per-request retry unsafe must be a boolean.");
  }
  return { ...value };
}

function assertNonNegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new SevdeskConfigurationError(`${label} must be a non-negative safe integer.`);
  }
}

function assertNonNegativeFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new SevdeskConfigurationError(`${label} must be a non-negative finite number.`);
  }
}

function validateResourceVersion(
  resourceVersion: string | undefined,
  context: string
): string | undefined {
  if (resourceVersion !== undefined && !/^(?:default|\d+\.\d+)$/.test(resourceVersion)) {
    throw new SevdeskConfigurationError(
      `The resource version in ${context} must be "default" or a numeric major.minor value.`
    );
  }
  return resourceVersion;
}

function createAuthenticationScope(
  baseURL: string,
  allowInsecureLocalhost: boolean
): AuthenticationScope {
  let parsed: URL;
  try {
    parsed = new URL(baseURL);
  } catch (error) {
    throw new SevdeskConfigurationError("The sevdesk baseURL must be an absolute HTTP(S) URL.", {
      cause: error
    });
  }
  if (parsed.protocol !== "https:") {
    if (parsed.protocol !== "http:" || !allowInsecureLocalhost || !isLocalhost(parsed.hostname)) {
      throw new SevdeskConfigurationError(
        "The sevdesk baseURL must use HTTPS. Plain HTTP is available only for localhost/loopback when allowInsecureLocalhost is true."
      );
    }
  }
  if (parsed.username || parsed.password) {
    throw new SevdeskConfigurationError("The sevdesk baseURL must not contain credentials.");
  }
  if (parsed.search || parsed.hash) {
    throw new SevdeskConfigurationError(
      "The sevdesk baseURL must not contain a query or fragment."
    );
  }
  const apiPrefix = parsed.pathname.replace(/\/+$/, "") || "/";
  const normalizedBaseURL = `${parsed.origin}${apiPrefix === "/" ? "" : apiPrefix}`;
  return {
    baseURL: normalizedBaseURL,
    origin: parsed.origin,
    apiPrefix
  };
}

function isLocalhost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "::1" ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized)
  );
}

function assertAuthenticatedRequestTarget(
  scope: AuthenticationScope,
  config: InternalAxiosRequestConfig
): void {
  if (!config.url) {
    throw new SevdeskConfigurationError("Authenticated sevdesk requests require a URL.");
  }
  let target: URL;
  try {
    if (/^[a-z][a-z\d+.-]*:/i.test(config.url) || config.url.startsWith("//")) {
      target = new URL(config.url, scope.origin);
    } else {
      const requestBase = config.baseURL ?? scope.baseURL;
      const combined = `${requestBase.replace(/\/+$/, "")}/${config.url.replace(/^\/+/, "")}`;
      target = new URL(combined);
    }
  } catch (error) {
    throw new SevdeskConfigurationError("Could not resolve the authenticated request URL.", {
      cause: error
    });
  }
  if (target.username || target.password) {
    throw new SevdeskConfigurationError("Authenticated request URLs must not contain credentials.");
  }
  if (target.origin !== scope.origin) {
    throw new SevdeskConfigurationError(
      `Refusing to send the sevdesk API token to a different origin (${target.origin}).`
    );
  }
  if (
    scope.apiPrefix !== "/" &&
    target.pathname !== scope.apiPrefix &&
    !target.pathname.startsWith(`${scope.apiPrefix}/`)
  ) {
    throw new SevdeskConfigurationError(
      `Refusing to send the sevdesk API token outside the configured API prefix (${scope.apiPrefix}).`
    );
  }
}

function interpolatePath(
  template: string,
  parameters: Readonly<Record<string, unknown>> | undefined
): string {
  return template.replaceAll(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = parameters?.[name];
    if (value === undefined || value === null || value === "") {
      throw new SevdeskConfigurationError(`Missing required path parameter "${name}".`);
    }
    return encodeURIComponent(String(value));
  });
}

function assertRelativeApiPath(path: string): void {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /^[a-z][a-z\d+.-]*:/i.test(path)
  ) {
    throw new SevdeskConfigurationError(
      'Custom request paths must be relative sevdesk API paths beginning with a single "/".'
    );
  }
}

function isSuccessfulStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

async function resolveToken(provider: SevdeskClientConfig["apiToken"]): Promise<string> {
  const token = typeof provider === "function" ? await provider() : provider;
  if (typeof token !== "string") {
    throw new SevdeskConfigurationError("The sevdesk API token provider must return a string.");
  }
  const normalized = token.trim();
  if (!normalized)
    throw new SevdeskConfigurationError("A non-empty sevdesk API token is required.");
  return normalized;
}

function isFormData(value: unknown): value is FormData {
  return (
    value !== null &&
    typeof value === "object" &&
    "append" in value &&
    typeof value.append === "function" &&
    (typeof FormData === "undefined" ||
      value instanceof FormData ||
      Object.prototype.toString.call(value) === "[object FormData]" ||
      "getHeaders" in value)
  );
}

function toMultipartFormData(value: unknown): FormData {
  if (typeof FormData === "undefined") {
    throw new SevdeskConfigurationError(
      "This runtime does not provide FormData required for multipart uploads."
    );
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskConfigurationError("Multipart request bodies must be objects or FormData.");
  }
  const form = new FormData();
  for (const [key, entry] of Object.entries(value)) {
    appendFormValue(form, key, entry);
  }
  return form;
}

function appendFormValue(form: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    for (const item of value) appendFormValue(form, key, item);
    return;
  }
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    form.append(key, value);
    return;
  }
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    const bytes =
      value instanceof ArrayBuffer
        ? new Uint8Array(value)
        : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    form.append(key, new Blob([Uint8Array.from(bytes)]));
    return;
  }
  if (typeof value === "object") {
    form.append(key, JSON.stringify(value));
    return;
  }
  form.append(key, String(value));
}

function isNodeRuntime(): boolean {
  return (
    typeof globalThis === "object" &&
    "process" in globalThis &&
    typeof (globalThis as { process?: { versions?: { node?: string } } }).process?.versions
      ?.node === "string"
  );
}

async function abortableDelay(milliseconds: number, signal?: GenericAbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new CanceledError("Request was cancelled."));
  let remaining = milliseconds;
  while (remaining > 0) {
    const chunk = Math.min(remaining, MAX_TIMER_DELAY_MS);
    await abortableTimer(chunk, signal);
    remaining -= chunk;
  }
}

function abortableTimer(milliseconds: number, signal?: GenericAbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener?.("abort", onAbort);
      resolve();
    };
    const timer = setTimeout(finish, milliseconds);
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", onAbort);
      reject(new CanceledError("Request was cancelled."));
    };
    signal?.addEventListener?.("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}
