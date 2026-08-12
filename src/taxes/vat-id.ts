import { normalizeCountryCode } from "./rates/eu-baseline.js";

const VAT_BODY_PATTERN: Readonly<Record<string, RegExp>> = Object.freeze({
  AT: /^U\d{8}$/,
  BE: /^\d{9}$|^\d{10}$/,
  BG: /^\d{9,10}$/,
  CY: /^\d{8}[A-Z]$/,
  CZ: /^\d{8,10}$/,
  DE: /^[1-9]\d{8}$/,
  DK: /^\d{8}$/,
  EE: /^\d{9}$/,
  EL: /^\d{9}$/,
  ES: /^[A-Z]\d{8}$|^[A-HN-SW]\d{7}[A-J]$|^[0-9YZ]\d{7}[A-Z]$|^[KLMX]\d{7}[A-Z]$/,
  FI: /^\d{8}$/,
  FR: /^\d{11}$|^[A-HJ-NP-Z]\d{10}$|^\d[A-HJ-NP-Z]\d{9}$|^[A-HJ-NP-Z]{2}\d{9}$/,
  HR: /^\d{11}$/,
  HU: /^\d{8}$/,
  IE: /^\d{7}[A-W]$|^\d{7}[A-W][AH]$|^[7-9][A-Z*+]\d{5}[A-W]$/,
  IT: /^\d{11}$/,
  LT: /^\d{9}$|^\d{12}$/,
  LU: /^\d{8}$/,
  LV: /^\d{11}$/,
  MT: /^\d{8}$/,
  NL: /^\d{9}B\d{2}$/,
  PL: /^\d{10}$/,
  PT: /^\d{9}$/,
  RO: /^\d{2,10}$/,
  SE: /^\d{12}$/,
  SI: /^\d{8}$/,
  SK: /^\d{10}$/,
  XI: /^\d{9}$|^\d{12}$|^GD\d{3}$|^HA\d{3}$/
});

const EU_VAT_PREFIXES = new Set(Object.keys(VAT_BODY_PATTERN));

export type VatIdFormatResult =
  | {
      readonly valid: true;
      readonly normalized: string;
      readonly countryCode: string;
      readonly prefix: string;
      readonly nationalNumber: string;
    }
  | {
      readonly valid: false;
      readonly reason:
        | "empty"
        | "invalid-shape"
        | "unknown-country"
        | "country-mismatch"
        | "invalid-national-number";
      readonly normalized?: string;
      readonly countryCode?: string;
      readonly prefix?: string;
      readonly nationalNumber?: string;
    };

export function normalizeVatId(raw: string): string {
  return raw.replace(/[\s.\-/]/g, "").toUpperCase();
}

export function parseVatId(raw: string): {
  readonly prefix: string;
  readonly nationalNumber: string;
  readonly countryCode: string;
  readonly normalized: string;
} | null {
  const normalized = normalizeVatId(raw);
  if (normalized.length < 4) return null;
  const prefix = normalized.slice(0, 2);
  const nationalNumber = normalized.slice(2);
  if (!/^[A-Z]{2}$/.test(prefix) || !/^[0-9A-Z*+]{2,12}$/.test(nationalNumber)) {
    return null;
  }
  if (!EU_VAT_PREFIXES.has(prefix)) return null;
  return {
    prefix,
    nationalNumber,
    countryCode: prefix === "EL" ? "GR" : prefix,
    normalized
  };
}

export function validateVatIdFormat(raw: string, expectedCountry?: string): VatIdFormatResult {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return { valid: false, reason: "empty" };
  }
  const parsed = parseVatId(trimmed);
  if (parsed === null) {
    const normalized = normalizeVatId(trimmed);
    return {
      valid: false,
      reason: "invalid-shape",
      ...(normalized ? { normalized } : {})
    };
  }
  if (expectedCountry !== undefined) {
    const expected = normalizeCountryCode(expectedCountry);
    const expectedPrefix = expected === "GR" ? "EL" : expected;
    if (parsed.prefix !== expectedPrefix && parsed.countryCode !== expected) {
      return {
        valid: false,
        reason: "country-mismatch",
        normalized: parsed.normalized,
        prefix: parsed.prefix,
        countryCode: parsed.countryCode,
        nationalNumber: parsed.nationalNumber
      };
    }
  }
  const body = VAT_BODY_PATTERN[parsed.prefix];
  if (body === undefined || !body.test(parsed.nationalNumber)) {
    return {
      valid: false,
      reason: "invalid-national-number",
      normalized: parsed.normalized,
      prefix: parsed.prefix,
      countryCode: parsed.countryCode,
      nationalNumber: parsed.nationalNumber
    };
  }
  return {
    valid: true,
    normalized: parsed.normalized,
    countryCode: parsed.countryCode,
    prefix: parsed.prefix,
    nationalNumber: parsed.nationalNumber
  };
}

export function isValidVatIdFormat(raw: string, expectedCountry?: string): boolean {
  return validateVatIdFormat(raw, expectedCountry).valid;
}

export function supportedVatIdCountries(): readonly string[] {
  return Object.freeze([...EU_VAT_PREFIXES].sort());
}
