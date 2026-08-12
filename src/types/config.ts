import type { AxiosInstance, AxiosRequestConfig, Method, RawAxiosRequestHeaders } from "axios";
import type { ExtraQuery } from "./operation.js";

export type ApiTokenProvider = string | (() => string | Promise<string>);

export type ResourceVersion = "default" | `${number}.${number}`;

export type {
  LogBodyMode,
  LogDetailMode,
  LogEventType,
  LogLevel,
  LoggingEventsFilter,
  LoggingEventsPreset,
  LoggingOptions,
  SevdeskLogEvent,
  SevdeskLogRedactor,
  SevdeskLogRedactorContext,
  SevdeskLogger
} from "../utils/logging.js";

export interface RetryOptions {
  readonly attempts?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly unsafeOperations?: boolean;
}

export interface PerRequestRetryOptions {
  readonly attempts?: number;
  readonly unsafe?: boolean;
}

export interface RequestOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly resourceVersion?: ResourceVersion;
  readonly headers?: RawAxiosRequestHeaders;
  readonly retry?: boolean | PerRequestRetryOptions;
  readonly axios?: Omit<
    AxiosRequestConfig,
    | "url"
    | "method"
    | "params"
    | "data"
    | "headers"
    | "baseURL"
    | "signal"
    | "timeout"
    | "responseType"
    | "transformRequest"
    | "transformResponse"
    | "validateStatus"
  >;
}

export interface SevdeskClientConfig {
  readonly apiToken: ApiTokenProvider;
  readonly baseURL?: string;
  readonly allowInsecureLocalhost?: boolean;
  readonly userAgent?: string;
  readonly resourceVersion?: ResourceVersion;
  readonly timeoutMs?: number;
  readonly headers?: RawAxiosRequestHeaders;
  readonly retries?: false | RetryOptions;
  readonly debug?: boolean;
  readonly logger?: import("../utils/logging.js").SevdeskLogger;
  readonly logging?: import("../utils/logging.js").LoggingOptions;
  readonly taxRateSource?: import("../taxes/rates/types.js").VatRateProvider;
  readonly useLiveCountryRates?: boolean;
  readonly errorOnMissingCountryRates?: boolean;
  readonly cacheCountryRates?: boolean;
  readonly axiosInstance?: AxiosInstance;
}

export interface CustomRequest<TBody = unknown> {
  readonly method: Method;
  readonly path: string;
  readonly query?: ExtraQuery;
  readonly body?: TBody;
  readonly headers?: Readonly<Record<string, string>>;
  readonly responseType?: AxiosRequestConfig["responseType"];
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly resourceVersion?: ResourceVersion;
  readonly retrySafe?: boolean;
  readonly options?: RequestOptions;
}
