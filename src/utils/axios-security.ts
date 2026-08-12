import {
  AxiosHeaders,
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type RawAxiosHeaders
} from "axios";
import type { SevdeskAxiosResponse } from "../types/result.js";

export function safeAxiosResponse<TData, TRequestBody = unknown>(
  response: AxiosResponse<TData, TRequestBody>
): SevdeskAxiosResponse<TData, TRequestBody> {
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: AxiosHeaders.from(
      stripCredentialHeaders(headerRecord(response.headers)) as RawAxiosHeaders
    ),
    config: safeAxiosConfig(response.config)
  };
}

export function safeAxiosErrorCause(error: AxiosError): Error {
  const cause = new Error("Axios request failed.");
  cause.name = error.name || "AxiosError";
  Object.defineProperties(cause, {
    code: {
      configurable: true,
      enumerable: true,
      value: error.code
    },
    status: {
      configurable: true,
      enumerable: true,
      value: error.response?.status
    }
  });
  return cause;
}

function safeAxiosConfig<TRequestBody>(
  config: InternalAxiosRequestConfig<TRequestBody>
): InternalAxiosRequestConfig<TRequestBody> {
  const safe = {
    ...config,
    headers: AxiosHeaders.from(
      stripCredentialHeaders(headerRecord(config.headers)) as RawAxiosHeaders
    )
  } as InternalAxiosRequestConfig<TRequestBody>;
  delete (safe as Partial<AxiosRequestConfig<TRequestBody>>).auth;
  if (safe.proxy && typeof safe.proxy === "object") {
    const proxy = { ...safe.proxy };
    delete proxy.auth;
    safe.proxy = proxy;
  }
  return safe;
}

function stripCredentialHeaders(
  headers: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(Object.entries(headers).filter(([key]) => !isCredentialHeader(key)));
}

function isCredentialHeader(key: string): boolean {
  return /(?:authorization|api[-_]?key|token|cookie|session|credential|secret)/i.test(key);
}

function headerRecord(value: unknown): Readonly<Record<string, unknown>> {
  if (value instanceof AxiosHeaders) return value.toJSON() as Record<string, unknown>;
  if (value !== null && typeof value === "object") {
    const candidate = value as {
      toJSON?: () => unknown;
    };
    const json = typeof candidate.toJSON === "function" ? candidate.toJSON() : value;
    if (json !== null && typeof json === "object") {
      return json as Readonly<Record<string, unknown>>;
    }
  }
  return {};
}
