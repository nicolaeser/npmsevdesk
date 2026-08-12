import {
  resolveCountryRate,
  selectCountryRate,
  type CountryRates,
  type DatedResolvedVatRate,
  type ResolvedVatRate,
  type VatRateProvider
} from "../src/taxes/rates/index.js";

declare const countryRates: CountryRates;

const selected: DatedResolvedVatRate = selectCountryRate(countryRates);
const resolved: Promise<DatedResolvedVatRate> = resolveCountryRate({ countryCode: "NL" });
const provider: VatRateProvider = {
  getStandardRate(_countryCode, context) {
    const providerDate: Date = context.asOf;
    return { ratePercent: 21, version: providerDate.toISOString() };
  }
};

const undatedSnapshot: ResolvedVatRate = {
  countryCode: "NL",
  ratePercent: 21,
  kind: "standard",
  source: "package-baseline",
  version: "snapshot"
};

// @ts-expect-error a dated resolved rate always carries its UTC calendar day
const missingDate: DatedResolvedVatRate = undatedSnapshot;

void [selected.asOf, resolved, provider, missingDate];
