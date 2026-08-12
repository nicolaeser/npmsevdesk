import { SevdeskConfigurationError } from "../utils/errors.js";
import { isIsoCountryCode, normalizeCountryCode } from "./rates/eu-baseline.js";

export interface TaxLocationEvidence {
  readonly billingCountry: string;
  readonly ipCountry?: string;
  readonly paymentCountry?: string;
  readonly override?: {
    readonly country: string;
    readonly reason: string;
    readonly reviewedBy: string;
  };
}

export interface TaxLocationSource {
  readonly source: "billing" | "ip" | "payment";
  readonly country: string;
}

type TaxLocationAssessmentBase = {
  readonly sources: readonly TaxLocationSource[];
  readonly observedCountries: readonly string[];
};

export type TaxLocationAssessment =
  | (TaxLocationAssessmentBase & {
      readonly status: "consistent";
      readonly country: string;
      readonly conflicts: readonly [];
      readonly override?: never;
    })
  | (TaxLocationAssessmentBase & {
      readonly status: "conflict";
      readonly country?: never;
      readonly conflicts: readonly [string, string, ...string[]];
      readonly override?: never;
    })
  | (TaxLocationAssessmentBase & {
      readonly status: "overridden";
      readonly country: string;
      readonly conflicts: readonly string[];
      readonly override: {
        readonly country: string;
        readonly reason: string;
        readonly reviewedBy: string;
      };
    });

export function assessTaxLocation(input: TaxLocationEvidence): TaxLocationAssessment {
  const sources = Object.freeze([
    source("billing", input.billingCountry),
    ...(input.ipCountry === undefined ? [] : [source("ip", input.ipCountry)]),
    ...(input.paymentCountry === undefined ? [] : [source("payment", input.paymentCountry)])
  ] as const);
  const countries = Object.freeze([...new Set(sources.map((entry) => entry.country))].sort());
  if (input.override !== undefined) {
    const country = strictCountry(input.override.country, "location override country");
    const reason = input.override.reason.trim();
    const reviewedBy = input.override.reviewedBy.trim();
    if (!reason || !reviewedBy) {
      throw new SevdeskConfigurationError(
        "A tax location override requires non-empty reason and reviewedBy fields."
      );
    }
    return Object.freeze({
      status: "overridden",
      country,
      sources,
      observedCountries: countries,
      conflicts: countries.length > 1 ? countries : [],
      override: Object.freeze({ country, reason, reviewedBy })
    });
  }
  if (countries.length === 1) {
    const country = countries[0];
    if (country === undefined) {
      throw new SevdeskConfigurationError("billingCountry is required.");
    }
    return Object.freeze({
      status: "consistent",
      country,
      sources,
      observedCountries: countries,
      conflicts: Object.freeze([] as const)
    });
  }
  const [first, second, ...remaining] = countries;
  if (first === undefined || second === undefined) {
    throw new SevdeskConfigurationError("At least one tax location country is required.");
  }
  const conflicts = Object.freeze([first, second, ...remaining] as [string, string, ...string[]]);
  return Object.freeze({
    status: "conflict",
    sources,
    observedCountries: countries,
    conflicts
  });
}

function source(sourceName: TaxLocationSource["source"], country: string): TaxLocationSource {
  return Object.freeze({
    source: sourceName,
    country: strictCountry(country, `${sourceName} country`)
  });
}

function strictCountry(value: string, label: string): string {
  const country = normalizeCountryCode(value);
  if (!isIsoCountryCode(country)) {
    throw new SevdeskConfigurationError(
      `${label} must be an ISO 3166-1 alpha-2 code; received "${value}".`
    );
  }
  return country;
}
