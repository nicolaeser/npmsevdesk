import type { AxiosError } from "axios";
import type { SevdeskAxiosResponse } from "../types/result.js";
import { safeAxiosErrorCause, safeAxiosResponse } from "./axios-security.js";
import { redact, redactHeaders } from "./redact.js";

export interface SevdeskRequestContext {
  readonly operationId?: string;
  readonly method?: string;
  readonly url?: string;
  readonly attempt?: number;
  readonly headers?: Readonly<Record<string, unknown>>;
  readonly requestBody?: unknown;
}

export interface SevdeskDiagnosticOptions {
  readonly includeData?: boolean;
}

export class SevdeskError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class SevdeskConfigurationError extends SevdeskError {}

export class SevdeskResponseValidationError extends SevdeskError {
  public readonly received: unknown;
  public constructor(message: string, options: { readonly value: unknown }, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.received = options.value;
  }
  public toJSON(): Record<string, unknown> {
    return this.toDiagnostic();
  }
  public toDiagnostic(options: SevdeskDiagnosticOptions = {}): Record<string, unknown> {
    const diagnostic: Record<string, unknown> = {
      name: this.name,
      message: "The sevdesk response failed curated validation."
    };
    if (options.includeData === true) {
      diagnostic.message = this.message;
      diagnostic.received = redact(this.received);
    }
    return diagnostic;
  }
}

export class SevdeskApiError<TBody = unknown> extends SevdeskError {
  public readonly status: number;
  public readonly responseBody: TBody;
  public readonly context: SevdeskRequestContext;
  public readonly response: SevdeskAxiosResponse<TBody>;
  public constructor(
    message: string,
    response: SevdeskAxiosResponse<TBody>,
    context: SevdeskRequestContext,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.status = response.status;
    this.responseBody = response.data;
    this.context = context;
    this.response = response;
  }
  public toJSON(): Record<string, unknown> {
    return this.toDiagnostic();
  }
  public toDiagnostic(options: SevdeskDiagnosticOptions = {}): Record<string, unknown> {
    const diagnostic: Record<string, unknown> = {
      name: this.name,
      message: `sevdesk API request failed with HTTP ${this.status}.`,
      status: this.status,
      context: metadataContext(this.context)
    };
    if (options.includeData === true) {
      diagnostic.message = this.message;
      diagnostic.responseBody = redact(this.responseBody);
      diagnostic.context = redact(this.context);
    }
    return diagnostic;
  }
}

export class SevdeskBadRequestError<TBody = unknown> extends SevdeskApiError<TBody> {}
export class SevdeskAuthenticationError<TBody = unknown> extends SevdeskApiError<TBody> {}
export class SevdeskPermissionError<TBody = unknown> extends SevdeskApiError<TBody> {}
export class SevdeskNotFoundError<TBody = unknown> extends SevdeskApiError<TBody> {}
export class SevdeskConflictError<TBody = unknown> extends SevdeskApiError<TBody> {}
export class SevdeskValidationError<TBody = unknown> extends SevdeskApiError<TBody> {}
export class SevdeskRateLimitError<TBody = unknown> extends SevdeskApiError<TBody> {
  public readonly retryAfterMs?: number;
  public constructor(
    message: string,
    response: SevdeskAxiosResponse<TBody>,
    context: SevdeskRequestContext,
    retryAfterMs?: number,
    options?: ErrorOptions
  ) {
    super(message, response, context, options);
    if (retryAfterMs !== undefined) this.retryAfterMs = retryAfterMs;
  }
  public override toDiagnostic(options: SevdeskDiagnosticOptions = {}): Record<string, unknown> {
    return {
      ...super.toDiagnostic(options),
      ...(this.retryAfterMs === undefined ? {} : { retryAfterMs: this.retryAfterMs })
    };
  }
}
export class SevdeskServerError<TBody = unknown> extends SevdeskApiError<TBody> {}

export class SevdeskNetworkError extends SevdeskError {
  public readonly context: SevdeskRequestContext;
  public readonly code?: string;
  public constructor(
    message: string,
    context: SevdeskRequestContext,
    code?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.context = context;
    if (code !== undefined) this.code = code;
  }
  public toJSON(): Record<string, unknown> {
    return this.toDiagnostic();
  }
  public toDiagnostic(options: SevdeskDiagnosticOptions = {}): Record<string, unknown> {
    const diagnostic: Record<string, unknown> = {
      name: this.name,
      message: "The sevdesk request failed before receiving a response.",
      ...(this.code === undefined ? {} : { code: this.code }),
      context: metadataContext(this.context)
    };
    if (options.includeData === true) {
      diagnostic.message = this.message;
      diagnostic.context = redact(this.context);
    }
    return diagnostic;
  }
}

export class SevdeskTimeoutError extends SevdeskNetworkError {}
export class SevdeskCancellationError extends SevdeskNetworkError {}

export function normalizeAxiosError(error: unknown): SevdeskError {
  if (error instanceof SevdeskError) return error;
  if (!isAxiosErrorValue(error)) {
    return new SevdeskError(error instanceof Error ? error.message : "Unknown sevdesk error", {
      cause: error
    });
  }
  const context = contextFromAxiosError(error);
  const safeCause = safeAxiosErrorCause(error);
  if (!error.response) {
    if (error.code === "ECONNABORTED" || /timeout/i.test(error.message)) {
      return new SevdeskTimeoutError("The sevdesk request timed out.", context, error.code, {
        cause: safeCause
      });
    }
    if (error.code === "ERR_CANCELED") {
      return new SevdeskCancellationError(
        "The sevdesk request was cancelled.",
        context,
        error.code,
        { cause: safeCause }
      );
    }
    return new SevdeskNetworkError(
      "The sevdesk network request failed before receiving a response.",
      context,
      error.code,
      { cause: safeCause }
    );
  }
  const response = safeAxiosResponse(error.response);
  const message = errorMessage(response.status, response.data);
  const options = { cause: safeCause };
  switch (response.status) {
    case 400:
      return new SevdeskBadRequestError(message, response, context, options);
    case 401:
      return new SevdeskAuthenticationError(message, response, context, options);
    case 403:
      return new SevdeskPermissionError(message, response, context, options);
    case 404:
      return new SevdeskNotFoundError(message, response, context, options);
    case 409:
      return new SevdeskConflictError(message, response, context, options);
    case 422:
      return new SevdeskValidationError(message, response, context, options);
    case 429:
      return new SevdeskRateLimitError(
        message,
        response,
        context,
        retryAfterMilliseconds(
          "get" in response.headers && typeof response.headers.get === "function"
            ? response.headers.get("retry-after")
            : response.headers["retry-after"]
        ),
        options
      );
    default:
      if (response.status >= 500) {
        return new SevdeskServerError(message, response, context, options);
      }
      return new SevdeskApiError(message, response, context, options);
  }
}

function isAxiosErrorValue(error: unknown): error is AxiosError {
  return (
    error !== null &&
    typeof error === "object" &&
    "isAxiosError" in error &&
    error.isAxiosError === true
  );
}

function contextFromAxiosError(error: AxiosError): SevdeskRequestContext {
  const config = error.config as
    | (typeof error.config & {
        _sevdesk?: {
          operationId?: string;
          attempt?: number;
          safeBody?: unknown;
        };
      })
    | undefined;
  const headers = config?.headers?.toJSON
    ? config.headers.toJSON()
    : (config?.headers as Readonly<Record<string, unknown>> | undefined);
  return {
    ...(config?._sevdesk?.operationId ? { operationId: config._sevdesk.operationId } : {}),
    ...(config?.method ? { method: config.method.toUpperCase() } : {}),
    ...(config?.url ? { url: config.url } : {}),
    ...(config?._sevdesk?.attempt !== undefined ? { attempt: config._sevdesk.attempt } : {}),
    headers: redactHeaders(headers),
    ...(config?._sevdesk?.safeBody === undefined && config?.data === undefined
      ? {}
      : {
          requestBody:
            config?._sevdesk?.safeBody === undefined
              ? redact(config?.data)
              : config._sevdesk.safeBody
        })
  };
}

function metadataContext(context: SevdeskRequestContext): SevdeskRequestContext {
  return {
    ...(context.operationId === undefined ? {} : { operationId: context.operationId }),
    ...(context.method === undefined ? {} : { method: context.method }),
    ...(context.url === undefined ? {} : { url: context.url }),
    ...(context.attempt === undefined ? {} : { attempt: context.attempt })
  };
}

function errorMessage(status: number, body: unknown): string {
  if (body !== null && typeof body === "object") {
    for (const key of ["message", "error", "detail", "errorMessage"]) {
      const value = (body as Record<string, unknown>)[key];
      if (typeof value === "string" && value.length > 0) {
        return `sevdesk API ${status}: ${value}`;
      }
    }
  }
  if (typeof body === "string" && body.length > 0) return `sevdesk API ${status}: ${body}`;
  return `sevdesk API request failed with HTTP ${status}.`;
}

export function retryAfterMilliseconds(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(String(value));
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}
