import { SevdeskConfigurationError } from "../utils/errors.js";
import { SellerTaxScheme, TaxCustomerType, VatIdStatus } from "./constants.js";
import { taxes } from "./presets.js";
import { isEuMemberCountry, normalizeCountryCode } from "./rates/eu-baseline.js";
import type { GermanDigitalServiceTaxInput, GermanDigitalServiceTaxSelection } from "./types.js";

export function determineGermanDigitalService(
  input: GermanDigitalServiceTaxInput
): GermanDigitalServiceTaxSelection {
  const country = normalizeCountryCode(input.customer.country);
  const evidence = Object.freeze({
    ...(input.evidence ?? {}),
    sellerCountry: "DE",
    customerCountry: country,
    customerType: input.customer.type,
    ...(input.customer.type === "business" && input.customer.vatId !== undefined
      ? { vatId: input.customer.vatId }
      : {})
  });
  if (input.sellerTaxScheme === SellerTaxScheme.SMALL_BUSINESS) {
    if (input.smallBusinessTreatment !== "section-19") {
      throw new SevdeskConfigurationError(
        'Small-business digital services require smallBusinessTreatment: "section-19".'
      );
    }
    return taxes.revenue.smallBusiness({ evidence });
  }
  if (input.sellerTaxScheme !== SellerTaxScheme.STANDARD) {
    throw new SevdeskConfigurationError("Unknown sellerTaxScheme.");
  }
  if (country === "DE") {
    if (input.customer.type === "consumer" && input.customer.euConsumerTaxation !== undefined) {
      throw new SevdeskConfigurationError(
        "euConsumerTaxation must not be provided for a German customer."
      );
    }
    if (input.domesticTaxRate === undefined) {
      throw new SevdeskConfigurationError(
        "domesticTaxRate is required for a standard-taxed German digital service."
      );
    }
    return taxes.revenue.domestic({ rate: input.domesticTaxRate, evidence });
  }
  if (!isEuMemberCountry(country)) {
    if (input.customer.type === "consumer" && input.customer.euConsumerTaxation !== undefined) {
      throw new SevdeskConfigurationError(
        "euConsumerTaxation must not be provided for a non-EU customer."
      );
    }
    return taxes.revenue.nonDomesticService({ evidence });
  }
  if (input.customer.type === TaxCustomerType.CONSUMER) {
    const taxation = input.customer.euConsumerTaxation;
    if (taxation === undefined) {
      throw new SevdeskConfigurationError(
        "EU consumer digital services require an explicit euConsumerTaxation choice."
      );
    }
    if (taxation.mode === "seller-country") {
      return taxes.revenue.domestic({ rate: taxation.rate, evidence });
    }
    if (normalizeCountryCode(taxation.destinationCountry.code) !== country) {
      throw new SevdeskConfigurationError(
        "OSS destination country does not match the customer country."
      );
    }
    return taxes.revenue.ossElectronicService({
      destinationCountry: taxation.destinationCountry,
      rate: taxation.rate,
      evidence
    });
  }
  const vatId = input.customer.vatId;
  if (vatId === undefined || vatId.status !== VatIdStatus.VALID) {
    throw new SevdeskConfigurationError(
      "EU B2B reverse charge requires caller-verified valid VAT-ID evidence."
    );
  }
  if (
    !vatId.value.trim() ||
    !vatId.provider.trim() ||
    !Number.isFinite(Date.parse(vatId.checkedAt))
  ) {
    throw new SevdeskConfigurationError(
      "Valid VAT-ID evidence requires value, provider, and checkedAt."
    );
  }
  if (vatId.country !== undefined && normalizeCountryCode(vatId.country) !== country) {
    throw new SevdeskConfigurationError(
      "VAT-ID evidence country does not match the customer country."
    );
  }
  return taxes.revenue.euB2bService({ evidence });
}
