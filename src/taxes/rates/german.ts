import { SevdeskConfigurationError } from "../../utils/errors.js";
import { TaxRate } from "../constants.js";

export const GermanVat = Object.freeze({
  ZERO: TaxRate.ZERO,
  REDUCED: TaxRate.REDUCED_7,
  STANDARD: TaxRate.STANDARD_19,
  allowed: Object.freeze([TaxRate.ZERO, TaxRate.REDUCED_7, TaxRate.STANDARD_19] as const)
});

export type GermanVatRate = (typeof GermanVat.allowed)[number];

export function isGermanVatRate(rate: number): rate is GermanVatRate {
  return (GermanVat.allowed as readonly number[]).includes(rate);
}

export function assertGermanVatRate(
  rate: number,
  context = "German VAT rate"
): asserts rate is GermanVatRate {
  if (!isGermanVatRate(rate)) {
    throw new SevdeskConfigurationError(`${context} must be 0, 7, or 19 (got ${rate}).`);
  }
}
