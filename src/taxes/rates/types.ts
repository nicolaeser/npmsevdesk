export type VatRateKind = "standard" | "reduced";

export type VatRateSource = "package-baseline" | "application" | "sevdesk-api" | "explicit";

export const SevdeskVatRateType = {
  STANDARD: "STANDARD_RATE",
  REDUCED: "REDUCED_RATE"
} as const;

export type SevdeskVatRateTypeValue = (typeof SevdeskVatRateType)[keyof typeof SevdeskVatRateType];

export interface CountryRateEntry {
  readonly rate: number;
  readonly type: SevdeskVatRateTypeValue | string;
  readonly kind: VatRateKind | "unknown";
}

export interface CountryRates {
  readonly countryCode: string;
  readonly date: string;
  readonly rates: readonly CountryRateEntry[];
  readonly standard: CountryRateEntry | undefined;
  readonly reduced: readonly CountryRateEntry[];
}

export interface ResolvedVatRate {
  readonly countryCode: string;
  readonly ratePercent: number;
  readonly kind: VatRateKind;
  readonly source: VatRateSource;
  readonly version: string;
  readonly asOf?: string;
  readonly availableRates?: readonly CountryRateEntry[];
}

export interface DatedResolvedVatRate extends ResolvedVatRate {
  readonly asOf: string;
}

export interface VatRateProvider {
  getStandardRate(
    countryCode: string,
    context: { readonly asOf: Date; readonly productCategory?: string }
  ): number | ApplicationVatRate | undefined | Promise<number | ApplicationVatRate | undefined>;
}

export interface ApplicationVatRate {
  readonly ratePercent: number;
  readonly version: string;
}

export interface SelectCountryRateOptions {
  readonly kind?: VatRateKind;
  readonly rate?: number;
}

export interface ResolveCountryRateInput {
  readonly countryCode: string;
  readonly asOf?: Date | string;
  readonly kind?: VatRateKind;
  readonly rate?: number;
  readonly provider?: VatRateProvider;
  readonly useLiveRates?: boolean;
  readonly errorOnMissingCountryRates?: boolean;
  readonly productCategory?: string;
  readonly fetchCountryRates?: (input: {
    readonly countryCode: string;
    readonly date: string;
  }) => Promise<CountryRates>;
}
