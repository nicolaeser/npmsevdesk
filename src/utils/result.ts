import type { AxiosHeaders, AxiosResponse } from "axios";
import type { PaginatedSevdeskResult } from "../types/pagination-result.js";
import type { PaginationMetadata, PrimaryData, SevdeskResult } from "../types/result.js";
import { SevdeskResponseValidationError } from "./errors.js";
import { safeAxiosResponse } from "./axios-security.js";

export function createResult<TJson, TRequestBody = unknown>(
  raw: AxiosResponse<TJson, TRequestBody>,
  query?: Readonly<Record<string, unknown>>
): SevdeskResult<TJson, PrimaryData<TJson>, TRequestBody> {
  const safeRaw = safeAxiosResponse(raw);
  const json = safeRaw.data;
  const objects = extractObjects(json);
  const pagination = extractPagination(json, objects, query);
  const requestId = headerValue(safeRaw.headers, "x-request-id");
  return {
    data: objects,
    objects,
    json,
    raw: safeRaw,
    response: {
      status: safeRaw.status,
      statusText: safeRaw.statusText,
      headers: normalizeHeaders(safeRaw.headers),
      ...(requestId ? { requestId } : {})
    },
    ...(pagination ? { pagination } : {}),
    toJSON: () => json
  };
}

export function mapResultData<TJson, TCurrentData, TNextData, TRequestBody = unknown>(
  result: SevdeskResult<TJson, TCurrentData, TRequestBody>,
  data: TNextData
): SevdeskResult<TJson, TNextData, TRequestBody> {
  return {
    ...result,
    data
  };
}

export function mapPaginatedResultData<TJson, TCurrentData, TNextData, TRequestBody = unknown>(
  result: SevdeskResult<TJson, TCurrentData, TRequestBody>,
  data: TNextData
): PaginatedSevdeskResult<TJson, TNextData, TRequestBody> {
  if (result.pagination === undefined) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned a collection result without pagination metadata.",
      { value: result.json }
    );
  }
  return {
    ...result,
    data,
    pagination: result.pagination
  };
}

export function extractObjects<TJson>(json: TJson): PrimaryData<TJson> {
  if (isRecord(json) && "objects" in json) {
    return json.objects as PrimaryData<TJson>;
  }
  return json as PrimaryData<TJson>;
}

function extractPagination(
  json: unknown,
  objects: unknown,
  query?: Readonly<Record<string, unknown>>
): PaginationMetadata | undefined {
  if (!Array.isArray(objects)) return undefined;
  const limit = finiteNumber(query?.limit);
  const offset = finiteNumber(query?.offset) ?? 0;
  const total = isRecord(json) ? finiteNumber(json.total) : undefined;
  const returned = objects.length;
  const hasMore =
    total !== undefined
      ? offset + returned < total
      : limit !== undefined
        ? returned >= limit
        : undefined;
  const nextOffset = hasMore ? offset + returned : undefined;
  return {
    ...(limit === undefined ? {} : { limit }),
    offset,
    ...(total === undefined ? {} : { total }),
    returned,
    ...(nextOffset === undefined ? {} : { nextOffset }),
    ...(hasMore === undefined ? {} : { hasMore })
  };
}

function normalizeHeaders(headers: AxiosResponse["headers"]): Readonly<Record<string, string>> {
  const json =
    typeof (headers as AxiosHeaders).toJSON === "function"
      ? (headers as AxiosHeaders).toJSON()
      : headers;
  const entries = Object.entries(json).flatMap(([key, value]) =>
    value === undefined || value === null ? [] : [[key, String(value)] as const]
  );
  return Object.fromEntries(entries);
}

function headerValue(headers: AxiosResponse["headers"], name: string): string | undefined {
  const value =
    typeof (headers as AxiosHeaders).get === "function"
      ? (headers as AxiosHeaders).get(name)
      : headers[name];
  return value === undefined || value === null ? undefined : String(value);
}

function finiteNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
