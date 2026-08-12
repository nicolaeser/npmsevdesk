import { SevdeskConfigurationError } from "./errors.js";

export interface NumberRange {
  readonly minimum?: number;
  readonly maximum?: number;
}

export interface IntegerRange extends NumberRange {
  readonly safe?: boolean;
}

export function validateFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new SevdeskConfigurationError(`${label} must be a finite number.`);
  }
  return value;
}

export function validateNumberRange(
  value: unknown,
  label: string,
  range: NumberRange = {}
): number {
  const number = validateFiniteNumber(value, label);
  if (range.minimum !== undefined && number < range.minimum) {
    throw new SevdeskConfigurationError(`${label} must be at least ${range.minimum}.`);
  }
  if (range.maximum !== undefined && number > range.maximum) {
    throw new SevdeskConfigurationError(`${label} may not exceed ${range.maximum}.`);
  }
  return number;
}

export function validateInteger(value: unknown, label: string, range: IntegerRange = {}): number {
  const number = validateNumberRange(value, label, range);
  const isInteger = range.safe === false ? Number.isInteger(number) : Number.isSafeInteger(number);
  if (!isInteger) {
    const kind = range.safe === false ? "integer" : "safe integer";
    throw new SevdeskConfigurationError(`${label} must be a ${kind}.`);
  }
  return number;
}

export function validatePositiveSafeInteger(value: unknown, label: string): number {
  return validateInteger(value, label, { minimum: 1 });
}

export function validateNonNegativeSafeInteger(value: unknown, label: string): number {
  return validateInteger(value, label, { minimum: 0 });
}

export function validateTimeoutMs(value: unknown, label = "timeoutMs"): number {
  return validateInteger(value, label, {
    minimum: 0,
    maximum: 2_147_483_647
  });
}

export function validatePaginationLimit(value: unknown, label = "pagination limit"): number {
  return validateInteger(value, label, { minimum: 1, maximum: 1_000 });
}

export function validatePaginationOffset(value: unknown, label = "pagination offset"): number {
  return validateNonNegativeSafeInteger(value, label);
}

export function validateDate(value: unknown, label: string): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new SevdeskConfigurationError(`${label} must be a valid Date.`);
  }
  return value;
}

export function validateUnixTimestamp(value: number | Date, label: string): number {
  const seconds =
    value instanceof Date ? Math.floor(validateDate(value, label).getTime() / 1_000) : value;
  return validateNonNegativeSafeInteger(seconds, label);
}

export function validateSevdeskDateString(value: unknown, label: string): string {
  if (typeof value !== "string") throw invalidDateString(label);
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoDate) {
    assertCalendarDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]), label);
    return value;
  }
  const germanDate = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (germanDate) {
    assertCalendarDate(Number(germanDate[3]), Number(germanDate[2]), Number(germanDate[1]), label);
    return value;
  }
  const rfc3339 =
    /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(
      value
    );
  if (rfc3339) {
    assertCalendarDate(Number(rfc3339[1]), Number(rfc3339[2]), Number(rfc3339[3]), label);
    if (Number.isFinite(Date.parse(value))) return value;
  }
  throw invalidDateString(label);
}

export function validateFinitePayload(value: unknown, label = "payload"): void {
  visitFinitePayload(value, label, new WeakSet<object>());
}

function visitFinitePayload(value: unknown, path: string, seen: WeakSet<object>): void {
  if (typeof value === "number") {
    validateFiniteNumber(value, path);
    return;
  }
  if (value instanceof Date) {
    validateDate(value, path);
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      visitFinitePayload(item, `${path}[${index}]`, seen);
    });
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    visitFinitePayload(nested, `${path}.${key}`, seen);
  }
}

function assertCalendarDate(year: number, month: number, day: number, label: string): void {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw invalidDateString(label);
  }
}

function invalidDateString(label: string): SevdeskConfigurationError {
  return new SevdeskConfigurationError(
    `${label} must be YYYY-MM-DD, DD.MM.YYYY, or an RFC 3339 timestamp.`
  );
}
