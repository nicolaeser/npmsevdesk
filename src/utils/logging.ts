import { SevdeskConfigurationError } from "./errors.js";
import { redact, redactHeaders } from "./redact.js";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogDetailMode = "none" | "redacted";

export type LogBodyMode = LogDetailMode;

export const LOG_EVENT_TYPES = [
  "request",
  "response",
  "retry",
  "error",
  "workflow-step",
  "workflow-error"
] as const;

export type LogEventType = (typeof LOG_EVENT_TYPES)[number];

const LOG_LEVEL_ORDER: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const DEFAULT_EVENT_LEVEL: Readonly<Record<LogEventType, LogLevel>> = {
  request: "debug",
  response: "debug",
  retry: "warn",
  error: "error",
  "workflow-step": "info",
  "workflow-error": "error"
};

export type LoggingEventsPreset = "all" | "errors" | "transport" | "lifecycle" | "none";

export type LoggingEventsFilter =
  LoggingEventsPreset | readonly LogEventType[] | Readonly<Partial<Record<LogEventType, boolean>>>;

export interface SevdeskLogRedactorContext {
  readonly phase: "request" | "response" | "error";
  readonly operationId: string;
  readonly eventType: LogEventType;
}

export type SevdeskLogRedactor = (value: unknown, context: SevdeskLogRedactorContext) => unknown;

export interface SevdeskLogEvent {
  readonly level: LogLevel;
  readonly type: LogEventType;
  readonly message: string;
  readonly timestamp: string;
  readonly operationId?: string | undefined;
  readonly method?: string | undefined;
  readonly url?: string | undefined;
  readonly status?: number | undefined;
  readonly attempt?: number | undefined;
  readonly durationMs?: number | undefined;
  readonly details?: unknown;
}

export interface SevdeskLogger {
  log(event: SevdeskLogEvent): void;
}

export interface LoggingOptions {
  readonly enabled?: boolean;
  readonly level?: LogLevel;
  readonly events?: LoggingEventsFilter;
  readonly bodyMode?: LogDetailMode;
  readonly headersMode?: LogDetailMode;
  readonly queryMode?: LogDetailMode;
  readonly slowMs?: number;
  readonly includeTimings?: boolean;
  readonly includeObservedRateLimits?: boolean;
  readonly maxDetailsChars?: number;
  readonly includeOperations?: readonly string[];
  readonly excludeOperations?: readonly string[];
  readonly eventLevels?: Readonly<Partial<Record<LogEventType, LogLevel>>>;
  readonly redactor?: SevdeskLogRedactor;
  readonly console?: boolean;
  readonly prefix?: string;
}

export interface ResolvedLogging {
  readonly enabled: boolean;
  readonly level: LogLevel;
  readonly events: Readonly<Record<LogEventType, boolean>>;
  readonly eventLevels: Readonly<Record<LogEventType, LogLevel>>;
  readonly bodyMode: LogDetailMode;
  readonly headersMode: LogDetailMode;
  readonly queryMode: LogDetailMode;
  readonly slowMs?: number | undefined;
  readonly includeTimings: boolean;
  readonly includeObservedRateLimits: boolean;
  readonly maxDetailsChars?: number | undefined;
  readonly includeOperations?: readonly string[] | undefined;
  readonly excludeOperations?: readonly string[] | undefined;
  readonly redactor?: SevdeskLogRedactor | undefined;
  readonly logger?: SevdeskLogger | undefined;
}

export interface LoggingSourceConfig {
  readonly debug?: boolean;
  readonly logger?: SevdeskLogger;
  readonly logging?: LoggingOptions;
}

export interface TransportLogDetailParts {
  readonly headers?: unknown;
  readonly query?: unknown;
  readonly body?: unknown;
  readonly extra?: Readonly<Record<string, unknown>>;
}

const PRESET_EVENTS: Readonly<Record<LoggingEventsPreset, ReadonlySet<LogEventType>>> = {
  all: new Set(LOG_EVENT_TYPES),
  errors: new Set(["error", "retry", "workflow-error"]),
  transport: new Set(["request", "response", "retry", "error"]),
  lifecycle: new Set(["request", "response"]),
  none: new Set()
};

export function createConsoleLogger(
  options: { readonly level?: LogLevel; readonly prefix?: string } = {}
): SevdeskLogger {
  const minLevel = options.level ?? "debug";
  const prefix = options.prefix ?? "[npmsevdesk]";
  return {
    log(event) {
      if (!shouldEmitLog(event.level, minLevel)) return;
      const method = event.level === "debug" ? "debug" : event.level;
      const sink = console[method] ?? console.log;
      sink.call(console, `${prefix} ${event.message}`, {
        level: event.level,
        type: event.type,
        timestamp: event.timestamp,
        ...(event.operationId === undefined ? {} : { operationId: event.operationId }),
        ...(event.method === undefined ? {} : { method: event.method }),
        ...(event.url === undefined ? {} : { url: event.url }),
        ...(event.status === undefined ? {} : { status: event.status }),
        ...(event.attempt === undefined ? {} : { attempt: event.attempt }),
        ...(event.durationMs === undefined ? {} : { durationMs: event.durationMs }),
        ...(event.details === undefined ? {} : { details: event.details })
      });
    }
  };
}

export function createSilentLogger(): SevdeskLogger {
  return { log() {} };
}

export function shouldEmitLog(eventLevel: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[eventLevel] >= LOG_LEVEL_ORDER[minLevel];
}

export function isLogEventType(value: unknown): value is LogEventType {
  return typeof value === "string" && (LOG_EVENT_TYPES as readonly string[]).includes(value);
}

export function resolveEventFilter(
  filter: LoggingEventsFilter | undefined
): Readonly<Record<LogEventType, boolean>> {
  const result = Object.fromEntries(LOG_EVENT_TYPES.map((type) => [type, false])) as Record<
    LogEventType,
    boolean
  >;
  if (filter === undefined || filter === "all") {
    for (const type of LOG_EVENT_TYPES) result[type] = true;
    return Object.freeze(result);
  }
  if (typeof filter === "string") {
    const preset = PRESET_EVENTS[filter as LoggingEventsPreset];
    if (!preset) {
      throw new SevdeskConfigurationError(
        'logging.events preset must be "all", "errors", "transport", "lifecycle", or "none".'
      );
    }
    for (const type of preset) result[type] = true;
    return Object.freeze(result);
  }
  if (Array.isArray(filter)) {
    for (const type of filter) {
      if (!isLogEventType(type)) {
        throw new SevdeskConfigurationError(
          `logging.events array contains unknown event type ${JSON.stringify(type)}.`
        );
      }
      result[type] = true;
    }
    return Object.freeze(result);
  }
  if (filter === null || typeof filter !== "object") {
    throw new SevdeskConfigurationError(
      "logging.events must be a preset string, event-type array, or per-type boolean map."
    );
  }
  for (const [key, value] of Object.entries(filter)) {
    if (!isLogEventType(key)) {
      throw new SevdeskConfigurationError(
        `logging.events map contains unknown event type ${JSON.stringify(key)}.`
      );
    }
    if (typeof value !== "boolean") {
      throw new SevdeskConfigurationError(
        `logging.events.${key} must be a boolean when using a per-type map.`
      );
    }
    result[key] = value;
  }
  return Object.freeze(result);
}

export function resolveLogging(config: LoggingSourceConfig): ResolvedLogging {
  validateLoggingConfig(config);
  const options = config.logging ?? {};
  const level = options.level ?? "debug";
  const bodyMode = options.bodyMode ?? "none";
  const headersMode = options.headersMode ?? "none";
  const queryMode = options.queryMode ?? "none";
  const wantConsole = config.debug === true || options.console === true;
  const enabled = options.enabled ?? (wantConsole || config.logger !== undefined);
  const eventLevels = { ...DEFAULT_EVENT_LEVEL };
  if (options.eventLevels) {
    for (const [key, value] of Object.entries(options.eventLevels)) {
      if (isLogEventType(key) && value !== undefined) {
        eventLevels[key] = value;
      }
    }
  }
  const resolvedLogger =
    config.logger ??
    (enabled
      ? createConsoleLogger({
          level,
          ...(options.prefix === undefined ? {} : { prefix: options.prefix })
        })
      : undefined);
  return Object.freeze({
    enabled: Boolean(enabled && resolvedLogger),
    level,
    events: resolveEventFilter(options.events),
    eventLevels: Object.freeze(eventLevels),
    bodyMode,
    headersMode,
    queryMode,
    slowMs: options.slowMs,
    includeTimings: options.includeTimings !== false,
    includeObservedRateLimits: options.includeObservedRateLimits === true,
    maxDetailsChars: options.maxDetailsChars,
    includeOperations: options.includeOperations,
    excludeOperations: options.excludeOperations,
    redactor: options.redactor,
    logger: enabled ? resolvedLogger : undefined
  });
}

export function matchesOperationFilter(
  operationId: string | undefined,
  include: readonly string[] | undefined,
  exclude: readonly string[] | undefined
): boolean {
  const id = operationId ?? "";
  if (include !== undefined && include.length > 0) {
    if (!include.some((pattern) => matchOperationPattern(id, pattern))) return false;
  }
  if (exclude !== undefined && exclude.length > 0) {
    if (exclude.some((pattern) => matchOperationPattern(id, pattern))) return false;
  }
  return true;
}

function matchOperationPattern(operationId: string, pattern: string): boolean {
  if (pattern.endsWith("*")) {
    return operationId.startsWith(pattern.slice(0, -1));
  }
  return operationId === pattern;
}

export type EmitLogInput = Omit<SevdeskLogEvent, "timestamp" | "level"> & {
  readonly level?: LogLevel | undefined;
};

export function emitLog(logging: ResolvedLogging, event: EmitLogInput): void {
  if (!logging.enabled || logging.logger === undefined) return;
  if (!logging.events[event.type]) return;
  if (
    !matchesOperationFilter(event.operationId, logging.includeOperations, logging.excludeOperations)
  ) {
    return;
  }
  if (
    event.type === "response" &&
    logging.slowMs !== undefined &&
    (event.durationMs === undefined || event.durationMs < logging.slowMs)
  ) {
    return;
  }
  const level = event.level ?? logging.eventLevels[event.type];
  if (!shouldEmitLog(level, logging.level)) return;
  const { durationMs, ...rest } = event;
  try {
    logging.logger.log({
      ...rest,
      level,
      ...(logging.includeTimings && durationMs !== undefined ? { durationMs } : {}),
      timestamp: new Date().toISOString()
    });
  } catch {
    return;
  }
}

export function extractObservedRateLimitHeaders(
  headers: unknown
): Readonly<Record<string, string>> | undefined {
  if (headers === null || headers === undefined || typeof headers !== "object") {
    return undefined;
  }
  const source = headers as Record<string, unknown>;
  const observed: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(source)) {
    const key = rawKey.toLowerCase();
    if (key !== "retry-after" && !key.startsWith("x-ratelimit") && !key.startsWith("ratelimit")) {
      continue;
    }
    const value = normalizeHeaderValue(rawValue);
    if (value !== undefined) observed[key] = value;
  }
  return Object.keys(observed).length > 0 ? Object.freeze(observed) : undefined;
}

function normalizeHeaderValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const parts = value
      .map(normalizeHeaderValue)
      .filter((part): part is string => part !== undefined);
    return parts.length > 0 ? parts.join(", ") : undefined;
  }
  return undefined;
}

export function formatTransportLogDetails(
  logging: ResolvedLogging,
  phase: "request" | "response" | "error",
  operationId: string,
  eventType: LogEventType,
  parts: TransportLogDetailParts
): unknown | undefined {
  const details: Record<string, unknown> = {};
  if (logging.headersMode === "redacted" && parts.headers !== undefined) {
    details.headers = redactHeaders((parts.headers ?? {}) as Record<string, unknown>);
  }
  if (logging.queryMode === "redacted" && parts.query !== undefined) {
    details.query = applyRedaction(logging, phase, operationId, eventType, parts.query);
  }
  if (logging.bodyMode === "redacted" && parts.body !== undefined) {
    details.body = applyRedaction(logging, phase, operationId, eventType, parts.body);
  }
  if (parts.extra) {
    for (const [key, value] of Object.entries(parts.extra)) {
      details[key] = applyRedaction(logging, phase, operationId, eventType, value);
    }
  }
  if (Object.keys(details).length === 0) return undefined;
  return truncateDetails(details, logging.maxDetailsChars);
}

export function formatLogDetails(
  logging: ResolvedLogging,
  phase: "request" | "response" | "error",
  operationId: string,
  value: unknown,
  eventType: LogEventType = phase === "error" ? "error" : phase
): unknown | undefined {
  if (logging.bodyMode === "none") return undefined;
  const redacted = applyRedaction(logging, phase, operationId, eventType, value);
  return truncateDetails(redacted, logging.maxDetailsChars);
}

function applyRedaction(
  logging: ResolvedLogging,
  phase: "request" | "response" | "error",
  operationId: string,
  eventType: LogEventType,
  value: unknown
): unknown {
  const credentialSafe = redact(value);
  if (!logging.redactor) return credentialSafe;
  try {
    return redact(logging.redactor(credentialSafe, { phase, operationId, eventType }));
  } catch {
    return "[Custom redactor failed]";
  }
}

function truncateDetails(value: unknown, maxChars: number | undefined): unknown {
  if (maxChars === undefined) return value;
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined || serialized.length <= maxChars) return value;
    return {
      truncated: true,
      maxDetailsChars: maxChars,
      originalChars: serialized.length,
      preview: serialized.slice(0, Math.max(0, maxChars - 32))
    };
  } catch {
    return value;
  }
}

export function validateLoggingConfig(config: LoggingSourceConfig): void {
  if (config.debug !== undefined && typeof config.debug !== "boolean") {
    throw new SevdeskConfigurationError("debug must be a boolean.");
  }
  if (config.logger !== undefined) {
    if (
      config.logger === null ||
      typeof config.logger !== "object" ||
      typeof config.logger.log !== "function"
    ) {
      throw new SevdeskConfigurationError("logger must implement { log(event) }.");
    }
  }
  if (config.logging === undefined) return;
  if (
    config.logging === null ||
    typeof config.logging !== "object" ||
    Array.isArray(config.logging)
  ) {
    throw new SevdeskConfigurationError("logging must be an object.");
  }
  const {
    enabled,
    level,
    events,
    bodyMode,
    headersMode,
    queryMode,
    slowMs,
    includeTimings,
    includeObservedRateLimits,
    maxDetailsChars,
    includeOperations,
    excludeOperations,
    eventLevels,
    redactor,
    console: useConsole,
    prefix
  } = config.logging;
  if (enabled !== undefined && typeof enabled !== "boolean") {
    throw new SevdeskConfigurationError("logging.enabled must be a boolean.");
  }
  if (useConsole !== undefined && typeof useConsole !== "boolean") {
    throw new SevdeskConfigurationError("logging.console must be a boolean.");
  }
  if (level !== undefined && !(level in LOG_LEVEL_ORDER)) {
    throw new SevdeskConfigurationError(
      'logging.level must be "debug", "info", "warn", or "error".'
    );
  }
  if (events !== undefined) {
    resolveEventFilter(events);
  }
  for (const [name, mode] of [
    ["bodyMode", bodyMode],
    ["headersMode", headersMode],
    ["queryMode", queryMode]
  ] as const) {
    if (mode !== undefined && mode !== "none" && mode !== "redacted") {
      throw new SevdeskConfigurationError(`logging.${name} must be "none" or "redacted".`);
    }
  }
  if (slowMs !== undefined && (!Number.isFinite(slowMs) || slowMs < 0)) {
    throw new SevdeskConfigurationError("logging.slowMs must be a non-negative finite number.");
  }
  if (includeTimings !== undefined && typeof includeTimings !== "boolean") {
    throw new SevdeskConfigurationError("logging.includeTimings must be a boolean.");
  }
  if (includeObservedRateLimits !== undefined && typeof includeObservedRateLimits !== "boolean") {
    throw new SevdeskConfigurationError("logging.includeObservedRateLimits must be a boolean.");
  }
  if (
    maxDetailsChars !== undefined &&
    (!Number.isSafeInteger(maxDetailsChars) || maxDetailsChars < 0)
  ) {
    throw new SevdeskConfigurationError(
      "logging.maxDetailsChars must be a non-negative safe integer."
    );
  }
  if (includeOperations !== undefined) {
    assertStringArray(includeOperations, "logging.includeOperations");
  }
  if (excludeOperations !== undefined) {
    assertStringArray(excludeOperations, "logging.excludeOperations");
  }
  if (eventLevels !== undefined) {
    if (eventLevels === null || typeof eventLevels !== "object" || Array.isArray(eventLevels)) {
      throw new SevdeskConfigurationError("logging.eventLevels must be an object.");
    }
    for (const [key, value] of Object.entries(eventLevels)) {
      if (!isLogEventType(key)) {
        throw new SevdeskConfigurationError(
          `logging.eventLevels contains unknown event type ${JSON.stringify(key)}.`
        );
      }
      if (value !== undefined && !(value in LOG_LEVEL_ORDER)) {
        throw new SevdeskConfigurationError(
          `logging.eventLevels.${key} must be "debug", "info", "warn", or "error".`
        );
      }
    }
  }
  if (redactor !== undefined && typeof redactor !== "function") {
    throw new SevdeskConfigurationError("logging.redactor must be a function.");
  }
  if (prefix !== undefined && typeof prefix !== "string") {
    throw new SevdeskConfigurationError("logging.prefix must be a string.");
  }
}

function assertStringArray(value: unknown, label: string): void {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new SevdeskConfigurationError(`${label} must be an array of strings.`);
  }
}
