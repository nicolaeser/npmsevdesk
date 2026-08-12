import { GermanVat } from "./german.js";
import {
  EU_STANDARD_RATE_BASELINE_VERSION,
  EU_STANDARD_RATE_SOURCE_URL,
  EU_STANDARD_VAT_RATES,
  isEuMemberCountry,
  isIsoCountryCode,
  normalizeCountryCode
} from "./eu-baseline.js";
import {
  formatRateDate,
  getPackageStandardRate,
  parseCountryRates,
  selectCountryRate,
  SEVDESK_COUNTRY_VAT_PATH
} from "./country-rates.js";

export { GermanVat, assertGermanVatRate, isGermanVatRate, type GermanVatRate } from "./german.js";
export {
  EU_STANDARD_RATE_BASELINE_VERSION,
  EU_STANDARD_RATE_SOURCE_URL,
  EU_STANDARD_VAT_RATES,
  isEuMemberCountry,
  isIsoCountryCode,
  normalizeCountryCode
} from "./eu-baseline.js";
export {
  formatRateDate,
  getPackageStandardRate,
  normalizeRateDate,
  parseCountryRates,
  selectCountryRate,
  SEVDESK_COUNTRY_VAT_PATH
} from "./country-rates.js";
export { resolveCountryRate } from "./resolve.js";
export { SevdeskVatRateType } from "./types.js";
export type {
  ApplicationVatRate,
  CountryRateEntry,
  CountryRates,
  DatedResolvedVatRate,
  ResolveCountryRateInput,
  ResolvedVatRate,
  SelectCountryRateOptions,
  VatRateKind,
  VatRateProvider,
  VatRateSource,
  SevdeskVatRateTypeValue
} from "./types.js";

export const taxesRates = Object.freeze({
  german: GermanVat,
  baselineVersion: EU_STANDARD_RATE_BASELINE_VERSION,
  sourceUrl: EU_STANDARD_RATE_SOURCE_URL,
  table: EU_STANDARD_VAT_RATES,
  sevdeskPath: SEVDESK_COUNTRY_VAT_PATH,
  packageStandard: getPackageStandardRate,
  isEuMember: isEuMemberCountry,
  isCountry: isIsoCountryCode,
  normalizeCountry: normalizeCountryCode,
  formatDate: formatRateDate,
  select: selectCountryRate,
  parse: parseCountryRates
});
