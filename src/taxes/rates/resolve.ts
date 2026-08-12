import { SevdeskConfigurationError } from "../../utils/errors.js";
import { getPackageStandardRate, normalizeRateDate, selectCountryRate } from "./country-rates.js";
import { isIsoCountryCode, normalizeCountryCode } from "./eu-baseline.js";
import type { DatedResolvedVatRate, ResolveCountryRateInput, VatRateProvider } from "./types.js";

export async function resolveCountryRate(
  input: ResolveCountryRateInput
): Promise<DatedResolvedVatRate> {
  const code = normalizeCountryCode(input.countryCode);
  if (!isIsoCountryCode(code)) {
    throw new SevdeskConfigurationError(
      `countryCode must be an ISO 3166-1 alpha-2 code; received "${input.countryCode}".`
    );
  }
  const kind = input.kind ?? "standard";
  if (kind !== "standard" && kind !== "reduced") {
    throw new SevdeskConfigurationError('kind must be "standard" or "reduced".');
  }
  if (
    input.rate !== undefined &&
    (!Number.isFinite(input.rate) || input.rate < 0 || input.rate > 100)
  ) {
    throw new SevdeskConfigurationError("rate must be a finite percentage from 0 to 100.");
  }
  const currentDate = normalizeRateDate(new Date());
  const asOf = normalizeRateDate(input.asOf ?? currentDate);
  const errorOnMissing = input.errorOnMissingCountryRates !== false;
  const useLive = input.useLiveRates === true;
  if (kind === "standard" && input.provider !== undefined) {
    const fromProvider = await readProvider(input.provider, code, input, asOf);
    if (fromProvider !== undefined) return fromProvider;
  }
  let liveFailure: unknown;
  if (useLive && input.fetchCountryRates !== undefined) {
    let countryRates: Awaited<ReturnType<NonNullable<typeof input.fetchCountryRates>>> | undefined;
    try {
      countryRates = await input.fetchCountryRates({ countryCode: code, date: asOf });
    } catch (error) {
      liveFailure = error;
    }
    if (countryRates !== undefined) {
      const returnedCode = normalizeCountryCode(countryRates.countryCode);
      const returnedDate = normalizeRateDate(countryRates.date);
      if (returnedCode !== code) {
        throw new SevdeskConfigurationError(
          `Country-rate source returned ${returnedCode} for a ${code} lookup.`
        );
      }
      if (returnedDate !== asOf) {
        throw new SevdeskConfigurationError(
          `Country-rate source returned rates dated ${returnedDate} for requested date ${asOf}.`
        );
      }
      return selectCountryRate(countryRates, {
        kind,
        ...(input.rate === undefined ? {} : { rate: input.rate })
      });
    }
  }
  if (kind !== "standard") {
    throw new SevdeskConfigurationError(
      `No reduced VAT rate for ${code}. Pass destinationRateExact, or ensure live country rates load.`
    );
  }
  if (errorOnMissing && useLive) {
    const detail =
      liveFailure instanceof Error
        ? liveFailure.message
        : liveFailure !== undefined
          ? String(liveFailure)
          : "live country-rate fetch is not configured";
    throw new SevdeskConfigurationError(
      `Could not load sevdesk country VAT rates for ${code} (${detail}). ` +
        "Refusing to invent a rate so no incorrect invoice is built. " +
        "Pass destinationRate, configure taxRateSource, or set errorOnMissingCountryRates: false " +
        "to allow the package EU baseline for the current UTC day (not guaranteed against sevdesk)."
    );
  }
  if (asOf !== currentDate) {
    throw new SevdeskConfigurationError(
      `The package VAT baseline is an undated current snapshot and cannot evidence ${code} on ${asOf}. ` +
        "Supply successful dated provider/live-rate evidence, or pass an explicit dated rate at the sale layer."
    );
  }
  const baseline = getPackageStandardRate(code);
  if (baseline === undefined) {
    throw new SevdeskConfigurationError(`No package baseline rate for ${code}.`);
  }
  assertExactRate(input.rate, baseline.ratePercent, code, "package baseline");
  return Object.freeze({ ...baseline, asOf });
}

async function readProvider(
  provider: VatRateProvider,
  code: string,
  input: ResolveCountryRateInput,
  asOf: string
): Promise<DatedResolvedVatRate | undefined> {
  const context = {
    asOf: new Date(`${asOf}T00:00:00.000Z`),
    ...(input.productCategory === undefined ? {} : { productCategory: input.productCategory })
  };
  const value: unknown = await provider.getStandardRate(code, context);
  if (value === undefined) return undefined;
  let ratePercent: number;
  let version: string;
  if (typeof value === "number") {
    ratePercent = value;
    version = "application-provider:unversioned-number";
  } else if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as { ratePercent?: unknown }).ratePercent === "number" &&
    typeof (value as { version?: unknown }).version === "string"
  ) {
    ratePercent = (value as { ratePercent: number }).ratePercent;
    version = (value as { version: string }).version.trim();
  } else {
    throw new SevdeskConfigurationError(
      `VatRateProvider returned malformed rate evidence for ${code}.`
    );
  }
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    throw new SevdeskConfigurationError(`VatRateProvider returned an invalid rate for ${code}.`);
  }
  if (!version) {
    throw new SevdeskConfigurationError(`VatRateProvider returned no dataset version for ${code}.`);
  }
  assertExactRate(input.rate, ratePercent, code, "VatRateProvider");
  return Object.freeze({
    countryCode: code,
    ratePercent,
    kind: "standard" as const,
    source: "application" as const,
    version,
    asOf
  });
}

function assertExactRate(
  requested: number | undefined,
  actual: number,
  countryCode: string,
  source: string
): void {
  if (requested !== undefined && requested !== actual) {
    throw new SevdeskConfigurationError(
      `Requested standard rate ${requested} does not match ${source} rate ${actual} for ${countryCode}.`
    );
  }
}
