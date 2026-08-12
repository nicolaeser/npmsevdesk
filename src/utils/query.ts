import type { ExtraQuery, QueryParameterDefinition, QueryValue } from "../types/operation.js";
import { SevdeskConfigurationError } from "./errors.js";

export type QueryObject = Readonly<Record<string, QueryValue | undefined>>;

export function serializeQuery(
  query: QueryObject | undefined,
  definitions: readonly QueryParameterDefinition[] = []
): string {
  if (!query) return "";
  const parameters = new URLSearchParams();
  const definitionsByName = new Map(definitions.map((definition) => [definition.name, definition]));
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    const definition = definitionsByName.get(key);
    appendValue(parameters, key, value, definition);
  }
  return parameters.toString();
}

export function mergeQuery(
  typed: QueryObject | undefined,
  extra: ExtraQuery | undefined
): QueryObject | undefined {
  if (!typed && !extra) return undefined;
  if (typed && extra) {
    const duplicates = Object.keys(extra).filter((key) => Object.hasOwn(typed, key));
    if (duplicates.length > 0) {
      throw new SevdeskConfigurationError(
        `extraQuery duplicates typed query parameter${duplicates.length === 1 ? "" : "s"}: ${duplicates
          .sort()
          .join(", ")}.`
      );
    }
  }
  return { ...typed, ...extra };
}

function appendValue(
  parameters: URLSearchParams,
  key: string,
  value: QueryValue,
  definition?: QueryParameterDefinition
): void {
  if (Array.isArray(value)) {
    if (definition?.explode === false || key === "embed") {
      parameters.append(key, value.map(toPrimitive).join(","));
      return;
    }
    for (const [index, item] of value.entries()) {
      if (isObject(item)) appendObject(parameters, `${key}[${index}]`, item);
      else parameters.append(key, toPrimitive(item));
    }
    return;
  }
  if (isObject(value)) {
    appendObject(parameters, key, value);
    return;
  }
  parameters.append(key, toPrimitive(value));
}

function appendObject(
  parameters: URLSearchParams,
  prefix: string,
  value: Readonly<Record<string, QueryValue | undefined>>
): void {
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;
    const nestedKey = `${prefix}[${key}]`;
    if (Array.isArray(item)) {
      for (const [index, nested] of item.entries()) {
        if (isObject(nested)) appendObject(parameters, `${nestedKey}[${index}]`, nested);
        else parameters.append(`${nestedKey}[]`, toPrimitive(nested));
      }
    } else if (isObject(item)) {
      appendObject(parameters, nestedKey, item);
    } else {
      parameters.append(nestedKey, toPrimitive(item));
    }
  }
}

function isObject(value: QueryValue): value is Readonly<Record<string, QueryValue | undefined>> {
  return value !== null && typeof value === "object" && !(value instanceof Date);
}

function toPrimitive(value: QueryValue): string {
  if (value === null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
