import type {
  EnumInput,
  EnumMap,
  RawEnumCodeFor,
  ResolvedEnumValue
} from "../enums/domain-enums.js";
import { resolveEnumValueStrict } from "../enums/domain-enums.js";
import type { RequestOptions } from "../types/config.js";
import type { operations } from "../types/openapi.js";
import type { ExtraQuery, QueryValue, RequestFor } from "../types/operation.js";
import {
  normalizeSevdeskId,
  type EntityId,
  type SevdeskId,
  type SevdeskObjectName,
  type SevdeskReference
} from "../types/references.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../utils/errors.js";
import { validateUnixTimestamp } from "../utils/validation.js";
import type { DateFilter, OperationRequest } from "./types.js";

export function asRequest<TOperationId extends keyof operations>(
  value: OperationRequest<TOperationId>,
  requestOptions?: RequestOptions
): OperationRequest<TOperationId> {
  return requestOptions === undefined ? value : { ...value, options: requestOptions };
}

declare const forwardCompatibleBodyBrand: unique symbol;

export type ForwardCompatibleBody<TBody> = TBody & {
  readonly [forwardCompatibleBodyBrand]: true;
};

export function forwardCompatibleBody<TBody>(body: TBody): ForwardCompatibleBody<TBody> {
  return body as ForwardCompatibleBody<TBody>;
}

export function forwardCompatibleRequest<TOperationId extends keyof operations, TBody = unknown>(
  value: Omit<OperationRequest<TOperationId>, "body"> & {
    readonly body: ForwardCompatibleBody<TBody>;
  },
  requestOptions?: RequestOptions
): OperationRequest<TOperationId> {
  return (requestOptions === undefined
    ? value
    : { ...value, options: requestOptions }) as unknown as OperationRequest<TOperationId>;
}

export function numericId(id: EntityId, label = "entity"): number {
  return normalizeSevdeskId(id, label);
}

export function wireReference<TName extends SevdeskObjectName>(
  reference: SevdeskReference<TName>,
  label = reference.objectName
): { id: number; objectName: TName } {
  return {
    id: numericId(reference.id, label),
    objectName: reference.objectName
  };
}

export function wireStringReference<TName extends SevdeskObjectName>(
  reference: SevdeskReference<TName>,
  label = reference.objectName
): { id: string; objectName: TName } {
  return {
    id: String(numericId(reference.id, label)),
    objectName: reference.objectName
  };
}

export function requireEntityId(value: unknown, label: string): SevdeskId {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate !== null && typeof candidate === "object") {
    if ("id" in candidate && isEntityId(candidate.id)) {
      return responseEntityId(candidate.id, label);
    }
    for (const nestedKey of ["invoice", "order", "voucher", "creditNote"]) {
      const nested = (candidate as Record<string, unknown>)[nestedKey];
      if (
        nested !== null &&
        typeof nested === "object" &&
        "id" in nested &&
        isEntityId(nested.id)
      ) {
        return responseEntityId(nested.id, label);
      }
    }
  }
  throw new SevdeskResponseValidationError(
    `sevdesk did not return a valid id for ${label}; inspect the workflow raw JSON.`,
    { value }
  );
}

const serverManagedCreateFields = new Set(["id", "create", "update", "sevClient", "createUser"]);

export function omitServerManagedCreateFields<T extends Readonly<Record<string, unknown>>>(
  value: T,
  additionalFields: readonly string[] = []
): Omit<T, "id" | "create" | "update" | "sevClient" | "createUser"> {
  const excluded = new Set([...serverManagedCreateFields, ...additionalFields]);
  return Object.fromEntries(Object.entries(value).filter(([key]) => !excluded.has(key))) as Omit<
    T,
    "id" | "create" | "update" | "sevClient" | "createUser"
  >;
}

export function enumCode<
  TMap extends EnumMap,
  TInput extends EnumInput<TMap> | RawEnumCodeFor<TMap>
>(map: TMap, input: TInput, label: string): ResolvedEnumValue<TMap, TInput> {
  const value = resolveEnumValueStrict(map, input as never) as ResolvedEnumValue<TMap, TInput>;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new SevdeskConfigurationError(`Invalid ${label}.`);
  }
  return value;
}

export function numericEnumCode<
  TMap extends Readonly<Record<string, number>>,
  TInput extends EnumInput<TMap> | RawEnumCodeFor<TMap>
>(map: TMap, input: TInput, label: string): ResolvedEnumValue<TMap, TInput> {
  const value = enumCode(map, input, label);
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(number)) {
    throw new SevdeskConfigurationError(`Unknown ${label} "${String(input)}".`);
  }
  return number as ResolvedEnumValue<TMap, TInput>;
}

export function stringEnumCode<
  TMap extends Readonly<Record<string, string>>,
  TInput extends EnumInput<TMap> | RawEnumCodeFor<TMap>
>(map: TMap, input: TInput, label: string): ResolvedEnumValue<TMap, TInput> {
  return enumCode(map, input, label);
}

export function dateFilter(value: DateFilter | undefined): number | undefined {
  if (value === undefined) return undefined;
  return validateUnixTimestamp(value, "date filter");
}

export function compactQuery(
  entries: Readonly<Record<string, QueryValue | undefined>>
): ExtraQuery {
  return Object.fromEntries(
    Object.entries(entries).filter((entry): entry is [string, QueryValue] => entry[1] !== undefined)
  );
}

export function requestFor<TOperation>(value: RequestFor<TOperation>): RequestFor<TOperation> {
  return value;
}

function isEntityId(value: unknown): value is EntityId {
  return typeof value === "string" || typeof value === "number";
}

function responseEntityId(value: EntityId, label: string): SevdeskId {
  try {
    return normalizeSevdeskId(value, label);
  } catch (error) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned an invalid id for ${label}.`,
      {
        value
      },
      error
    );
  }
}
