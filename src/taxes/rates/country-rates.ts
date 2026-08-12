import { SevdeskConfigurationError } from "../../utils/errors.js";
import {
  EU_STANDARD_RATE_BASELINE_VERSION,
  EU_STANDARD_RATE_SOURCE_URL,
  EU_STANDARD_VAT_RATES,
  isIsoCountryCode,
  normalizeCountryCode
} from "./eu-baseline.js";
import {
  SevdeskVatRateType,
  type CountryRateEntry,
  type CountryRates,
  type DatedResolvedVatRate,
  type ResolvedVatRate,
  type SelectCountryRateOptions
} from "./types.js";

export const SEVDESK_COUNTRY_VAT_PATH = "/Vat/getByCountryAndDate" as const;

export function formatRateDate(date: Date = new Date()): string {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new SevdeskConfigurationError("Tax effective date is invalid.");
  }
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function normalizeRateDate(value: Date | string = new Date()): string {
  if (value instanceof Date) return formatRateDate(value);
  if (typeof value !== "string") {
    throw new SevdeskConfigurationError("Tax effective date must be YYYY-MM-DD or a valid Date.");
  }
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new SevdeskConfigurationError("Tax effective date must be YYYY-MM-DD or a valid Date.");
  }
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || formatRateDate(parsed) !== trimmed) {
    throw new SevdeskConfigurationError(`Tax effective date "${value}" is not a calendar day.`);
  }
  return trimmed;
}

export function parseCountryRates(
  countryCode: string,
  date: string,
  objects: readonly unknown[]
): CountryRates {
  const code = normalizeRateCountryCode(countryCode);
  const normalizedDate = normalizeRateDate(date);
  const rates: CountryRateEntry[] = [];
  for (const row of objects) {
    if (row === null || typeof row !== "object" || Array.isArray(row)) continue;
    const rawRate = (row as { rate?: unknown }).rate;
    const rate =
      typeof rawRate === "number"
        ? rawRate
        : typeof rawRate === "string" && rawRate.trim() !== ""
          ? Number(rawRate)
          : Number.NaN;
    const type = (row as { type?: unknown }).type;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || rate > 100) continue;
    if (typeof type !== "string" || !type.trim()) continue;
    const kind =
      type === SevdeskVatRateType.STANDARD
        ? ("standard" as const)
        : type === SevdeskVatRateType.REDUCED
          ? ("reduced" as const)
          : ("unknown" as const);
    rates.push(Object.freeze({ rate, type, kind }));
  }
  const frozenRates = Object.freeze(rates);
  const standard = findUnambiguousStandardRate(code, normalizedDate, frozenRates);
  return Object.freeze({
    countryCode: code,
    date: normalizedDate,
    rates: frozenRates,
    standard,
    reduced: Object.freeze(rates.filter((entry) => entry.kind === "reduced"))
  });
}

export function selectCountryRate(
  countryRates: CountryRates,
  options: SelectCountryRateOptions = {}
): DatedResolvedVatRate {
  const countryCode = normalizeRateCountryCode(countryRates.countryCode);
  const asOf = normalizeRateDate(countryRates.date);
  const kind = options.kind ?? "standard";
  if (kind !== "standard" && kind !== "reduced") {
    throw new SevdeskConfigurationError('kind must be "standard" or "reduced".');
  }
  if (kind === "standard") {
    const standard = findUnambiguousStandardRate(
      countryCode,
      asOf,
      countryRates.rates,
      countryRates.standard
    );
    if (standard === undefined) {
      throw new SevdeskConfigurationError(`No STANDARD_RATE for ${countryCode} on ${asOf}.`);
    }
    if (options.rate !== undefined && options.rate !== standard.rate) {
      throw new SevdeskConfigurationError(
        `Requested standard rate ${options.rate} does not match STANDARD_RATE ${standard.rate} for ${countryCode}.`
      );
    }
    return freezeRate({
      countryCode,
      ratePercent: standard.rate,
      kind: "standard",
      source: "sevdesk-api",
      version: `sevdesk-vat:${asOf}`,
      asOf,
      availableRates: countryRates.rates
    });
  }
  const reduced = countryRates.reduced;
  if (reduced.length === 0) {
    throw new SevdeskConfigurationError(`No REDUCED_RATE for ${countryCode} on ${asOf}.`);
  }
  if (options.rate !== undefined) {
    const match = reduced.find((entry) => entry.rate === options.rate);
    if (match === undefined) {
      throw new SevdeskConfigurationError(
        `Reduced rate ${options.rate} not in [${reduced.map((e) => e.rate).join(", ")}] for ${countryCode}.`
      );
    }
    return freezeRate({
      countryCode,
      ratePercent: match.rate,
      kind: "reduced",
      source: "sevdesk-api",
      version: `sevdesk-vat:${asOf}`,
      asOf,
      availableRates: countryRates.rates
    });
  }
  if (reduced.length > 1) {
    throw new SevdeskConfigurationError(
      `Multiple REDUCED_RATE values for ${countryCode} (${reduced
        .map((e) => e.rate)
        .join(", ")}). Pass options.rate, or use kind "standard" for digital products.`
    );
  }
  const only = reduced[0];
  if (only === undefined) {
    throw new SevdeskConfigurationError(`No REDUCED_RATE for ${countryCode}.`);
  }
  return freezeRate({
    countryCode,
    ratePercent: only.rate,
    kind: "reduced",
    source: "sevdesk-api",
    version: `sevdesk-vat:${asOf}`,
    asOf,
    availableRates: countryRates.rates
  });
}

export function getPackageStandardRate(countryCode: string): ResolvedVatRate | undefined {
  const code = normalizeCountryCode(countryCode);
  const rate = EU_STANDARD_VAT_RATES[code];
  if (rate === undefined) return undefined;
  return freezeRate({
    countryCode: code,
    ratePercent: rate,
    kind: "standard",
    source: "package-baseline",
    version: EU_STANDARD_RATE_BASELINE_VERSION
  });
}

function freezeRate<T extends ResolvedVatRate>(rate: T): T {
  return Object.freeze(rate);
}

function findUnambiguousStandardRate(
  countryCode: string,
  date: string,
  rates: readonly CountryRateEntry[],
  declared?: CountryRateEntry
): CountryRateEntry | undefined {
  const candidates = rates.filter(
    (entry) => entry.kind === "standard" || entry.type === SevdeskVatRateType.STANDARD
  );
  const values = new Set(candidates.map((entry) => entry.rate));
  if (declared !== undefined) values.add(declared.rate);
  if (values.size > 1) {
    throw new SevdeskConfigurationError(
      `Conflicting STANDARD_RATE values for ${countryCode} on ${date}: ${[...values].join(", ")}.`
    );
  }
  return candidates[0] ?? declared;
}

function normalizeRateCountryCode(countryCode: string): string {
  const code = normalizeCountryCode(countryCode);
  if (!isIsoCountryCode(code)) {
    throw new SevdeskConfigurationError(
      `countryCode must be an ISO 3166-1 alpha-2 code; received "${countryCode}".`
    );
  }
  return code;
}

export { EU_STANDARD_RATE_SOURCE_URL };
