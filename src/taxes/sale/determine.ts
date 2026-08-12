import { SevdeskConfigurationError } from "../../utils/errors.js";
import { EuConsumerTaxation, TaxCustomerType, TaxRate, VatIdStatus } from "../constants.js";
import { taxes } from "../presets.js";
import { assertGermanVatRate } from "../rates/german.js";
import {
  getPackageStandardRate,
  isEuMemberCountry,
  isIsoCountryCode,
  normalizeCountryCode,
  normalizeRateDate,
  type CountryRates,
  type ResolvedVatRate,
  type VatRateKind,
  type VatRateProvider
} from "../rates/index.js";
import { resolveCountryRate } from "../rates/resolve.js";
import type {
  GermanSaleDecision,
  GermanSaleTaxInput,
  GermanSaleTaxSelection,
  TaxDestinationCountry,
  VatIdEvidence
} from "../types.js";
import { validateVatIdFormat } from "../vat-id.js";
import { assessTaxLocation, type TaxLocationAssessment } from "../location.js";
import { SALE_TEMPLATE_PRODUCT, SaleProduct, type SaleProductId } from "./templates.js";

type NormalizedSale = {
  readonly country: string;
  readonly customerType: "consumer" | "business";
  readonly product: SaleProductId;
  readonly euConsumerTaxation: "seller-country" | "oss-destination" | undefined;
  readonly effectiveDate: string;
  readonly vatEvidenceMaxAgeDays: number;
  readonly smallBusiness: boolean;
  readonly vatId: VatIdEvidence | undefined;
  readonly domesticTaxRate: number | undefined;
  readonly euBusinessWithoutVat: "fail" | "tax-as-consumer";
  readonly destinationCountry: TaxDestinationCountry | undefined;
  readonly destinationRate: number | undefined;
  readonly destinationRateKind: VatRateKind | undefined;
  readonly destinationRateExact: number | undefined;
  readonly rateLookup: ResolvedVatRate | undefined;
  readonly rateSource: VatRateProvider | undefined;
  readonly evidence: Readonly<Record<string, unknown>> | undefined;
  readonly location: TaxLocationAssessment | undefined;
};

function normalizeSaleInput(input: GermanSaleTaxInput): NormalizedSale {
  const country = normalizeCountryCode(input.country);
  if (!isIsoCountryCode(country)) {
    throw new SevdeskConfigurationError(
      `country must be an ISO 3166-1 alpha-2 code (e.g. "DE", "NL"); received "${input.country}".`
    );
  }
  if (input.customerType !== undefined && input.type !== undefined) {
    throw new SevdeskConfigurationError("Use either customerType or type, never both.");
  }
  const customerType = normalizeCustomerType(input.customerType ?? input.type);
  const product = normalizeProduct(input);
  const euConsumerTaxation = input.euConsumerTaxation;
  if (
    euConsumerTaxation !== undefined &&
    euConsumerTaxation !== EuConsumerTaxation.SELLER_COUNTRY &&
    euConsumerTaxation !== EuConsumerTaxation.OSS_DESTINATION
  ) {
    throw new SevdeskConfigurationError(
      'euConsumerTaxation must be "seller-country" or "oss-destination".'
    );
  }
  const hasDestinationFields =
    input.destinationCountry !== undefined ||
    input.destinationRate !== undefined ||
    input.destinationRateKind !== undefined ||
    input.destinationRateExact !== undefined ||
    input.rateLookup !== undefined ||
    input.rateSource !== undefined;
  const selectedRateSources = [
    input.destinationRate !== undefined,
    input.rateLookup !== undefined,
    input.rateSource !== undefined
  ].filter(Boolean).length;
  if (selectedRateSources > 1) {
    throw new SevdeskConfigurationError(
      "Use exactly one destination rate source: destinationRate, rateLookup, or rateSource."
    );
  }
  if (euConsumerTaxation !== EuConsumerTaxation.OSS_DESTINATION && hasDestinationFields) {
    throw new SevdeskConfigurationError(
      'Destination country/rate fields require euConsumerTaxation: "oss-destination".'
    );
  }
  if (
    input.destinationRateKind !== undefined &&
    input.destinationRateKind !== "standard" &&
    input.destinationRateKind !== "reduced"
  ) {
    throw new SevdeskConfigurationError('destinationRateKind must be "standard" or "reduced".');
  }
  const runtimeRateFields = input as unknown as {
    readonly destinationRate?: number;
    readonly destinationRateExact?: number;
  };
  assertOptionalPercent(runtimeRateFields.destinationRateExact, "destinationRateExact");
  assertOptionalPercent(runtimeRateFields.destinationRate, "destinationRate");
  if (
    runtimeRateFields.destinationRate !== undefined &&
    runtimeRateFields.destinationRateExact !== undefined
  ) {
    throw new SevdeskConfigurationError(
      "destinationRate and destinationRateExact cannot be combined; use one explicit-rate mode."
    );
  }
  if (input.smallBusiness !== undefined && typeof input.smallBusiness !== "boolean") {
    throw new SevdeskConfigurationError("smallBusiness must be a boolean.");
  }
  if (input.smallBusiness === true && (euConsumerTaxation !== undefined || hasDestinationFields)) {
    throw new SevdeskConfigurationError(
      "smallBusiness taxation does not accept OSS destination options; use a reviewed manual preset for another scheme."
    );
  }
  if (input.smallBusiness === true && input.vatId !== undefined) {
    throw new SevdeskConfigurationError(
      "vatId evidence does not change the selected smallBusiness treatment."
    );
  }
  if (
    input.smallBusiness === true &&
    (input.domesticTaxRate !== undefined || input.euBusinessWithoutVat !== undefined)
  ) {
    throw new SevdeskConfigurationError(
      "smallBusiness taxation does not accept domesticTaxRate or euBusinessWithoutVat."
    );
  }
  if (customerType === "consumer" && input.vatId !== undefined) {
    throw new SevdeskConfigurationError("vatId evidence is only valid for a business customer.");
  }
  if (input.vatId !== undefined && !Object.values(VatIdStatus).includes(input.vatId.status)) {
    throw new SevdeskConfigurationError("vatId.status must be a VatIdStatus value.");
  }
  if (customerType === "consumer" && input.euBusinessWithoutVat !== undefined) {
    throw new SevdeskConfigurationError(
      "euBusinessWithoutVat is only valid for a business customer."
    );
  }
  if (input.vatEvidenceMaxAgeDays !== undefined && input.vatId?.status !== VatIdStatus.VALID) {
    throw new SevdeskConfigurationError(
      "vatEvidenceMaxAgeDays requires VAT-ID evidence with status VALID."
    );
  }
  if (
    customerType === "business" &&
    input.vatId?.status === VatIdStatus.VALID &&
    (input.euConsumerTaxation !== undefined ||
      hasDestinationFields ||
      input.euBusinessWithoutVat !== undefined)
  ) {
    throw new SevdeskConfigurationError(
      "A valid EU VAT-ID selects the B2B treatment and cannot be combined with OSS, destination-rate, or euBusinessWithoutVat options."
    );
  }
  if (input.vatId !== undefined && (country === "DE" || !isEuMemberCountry(country))) {
    throw new SevdeskConfigurationError(
      "EU VAT-ID evidence is only used for a business customer in another EU member country."
    );
  }
  if (
    input.euBusinessWithoutVat !== undefined &&
    (country === "DE" || !isEuMemberCountry(country))
  ) {
    throw new SevdeskConfigurationError(
      "euBusinessWithoutVat is only used for a business customer in another EU member country."
    );
  }
  if (
    input.domesticTaxRate !== undefined &&
    country !== "DE" &&
    euConsumerTaxation !== EuConsumerTaxation.SELLER_COUNTRY
  ) {
    throw new SevdeskConfigurationError(
      "domesticTaxRate is only used for DE or explicit seller-country taxation."
    );
  }
  if (euConsumerTaxation !== undefined && (country === "DE" || !isEuMemberCountry(country))) {
    throw new SevdeskConfigurationError(
      "euConsumerTaxation is only valid for a customer in another EU member country."
    );
  }
  const vatEvidenceMaxAgeDays = input.vatEvidenceMaxAgeDays ?? 30;
  if (
    !Number.isInteger(vatEvidenceMaxAgeDays) ||
    vatEvidenceMaxAgeDays < 1 ||
    vatEvidenceMaxAgeDays > 3650
  ) {
    throw new SevdeskConfigurationError("vatEvidenceMaxAgeDays must be an integer from 1 to 3650.");
  }
  const location =
    input.locationEvidence === undefined ? undefined : assessTaxLocation(input.locationEvidence);
  if (location?.status === "conflict") {
    throw new SevdeskConfigurationError(
      `Tax location evidence conflicts (${location.conflicts.join(", ")}); provide a reviewed locationEvidence.override.`
    );
  }
  if (location !== undefined && location.country !== country) {
    throw new SevdeskConfigurationError(
      `country (${country}) must match the resolved tax location (${location.country}).`
    );
  }
  if (
    input.euBusinessWithoutVat !== undefined &&
    input.euBusinessWithoutVat !== "fail" &&
    input.euBusinessWithoutVat !== "tax-as-consumer"
  ) {
    throw new SevdeskConfigurationError(
      'euBusinessWithoutVat must be "fail" or "tax-as-consumer".'
    );
  }
  return {
    country,
    customerType,
    product,
    euConsumerTaxation,
    effectiveDate: normalizeRateDate(input.effectiveDate ?? new Date()),
    vatEvidenceMaxAgeDays,
    smallBusiness: input.smallBusiness === true,
    vatId: input.vatId,
    domesticTaxRate: input.domesticTaxRate,
    euBusinessWithoutVat: input.euBusinessWithoutVat ?? "fail",
    destinationCountry: input.destinationCountry,
    destinationRate: input.destinationRate,
    destinationRateKind: input.destinationRateKind,
    destinationRateExact: input.destinationRateExact,
    rateLookup: input.rateLookup,
    rateSource: input.rateSource,
    evidence: input.evidence,
    location
  };
}

function normalizeCustomerType(
  value: "private" | "company" | "consumer" | "business" | undefined
): "consumer" | "business" {
  if (value === undefined || value === "private" || value === TaxCustomerType.CONSUMER) {
    return "consumer";
  }
  if (value === "company" || value === TaxCustomerType.BUSINESS) return "business";
  throw new SevdeskConfigurationError(
    'type must be TaxCustomerType.CONSUMER/BUSINESS or the aliases "private"/"company".'
  );
}

function normalizeProduct(input: GermanSaleTaxInput): SaleProductId {
  if (input.template !== undefined) {
    const product = SALE_TEMPLATE_PRODUCT[input.template];
    if (product === undefined) {
      throw new SevdeskConfigurationError(
        `Unknown sale template "${String(input.template)}". Use a SaleTemplate constant.`
      );
    }
    return product;
  }
  const product = input.product;
  if (product === undefined || product === "saas" || product === SaleProduct.ELECTRONIC_SERVICE) {
    return SaleProduct.ELECTRONIC_SERVICE;
  }
  if (product === "service" || product === SaleProduct.OTHER_SERVICE) {
    return SaleProduct.OTHER_SERVICE;
  }
  if (product === SaleProduct.GOODS) return SaleProduct.GOODS;
  throw new SevdeskConfigurationError(
    `Unknown product "${String(product)}". Use a SaleProduct or SaleTemplate constant.`
  );
}

function assertOptionalPercent(value: number | undefined, label: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 100)) {
    throw new SevdeskConfigurationError(`${label} must be a finite percentage from 0 to 100.`);
  }
}

export function determineGermanSale(input: GermanSaleTaxInput): GermanSaleDecision {
  const sale = normalizeSaleInput(input);
  const evidence = Object.freeze({
    ...(sale.evidence ?? {}),
    sellerCountry: "DE",
    customerCountry: sale.country,
    customerType: sale.customerType,
    product: sale.product,
    effectiveDate: sale.effectiveDate,
    ...(sale.euConsumerTaxation === undefined
      ? {}
      : { euConsumerTaxation: sale.euConsumerTaxation }),
    ...(sale.location === undefined ? {} : { taxLocation: sale.location }),
    ...(sale.customerType === "business" && sale.vatId !== undefined
      ? { vatIdStatus: sale.vatId.status, vatIdProvider: sale.vatId.provider }
      : {})
  });
  if (sale.smallBusiness) {
    return buildDecision(taxes.revenue.smallBusiness({ evidence }), {
      region: sale.country === "DE" ? "DE" : isEuMemberCountry(sale.country) ? "EU" : "NON_EU",
      reason: "seller-section-19-small-business",
      effectiveDate: sale.effectiveDate,
      location: sale.location
    });
  }
  if (sale.country === "DE") {
    const rate = sale.domesticTaxRate ?? TaxRate.STANDARD_19;
    assertGermanVatRate(rate, "domesticTaxRate");
    return buildDecision(taxes.revenue.domestic({ rate, evidence }), {
      region: "DE",
      reason: "domestic-sale",
      effectiveDate: sale.effectiveDate,
      location: sale.location
    });
  }
  if (!isEuMemberCountry(sale.country)) {
    if (sale.product === SaleProduct.GOODS) {
      return buildDecision(taxes.revenue.exportGoods({ evidence }), {
        region: "NON_EU",
        reason: "export-of-goods",
        effectiveDate: sale.effectiveDate,
        location: sale.location
      });
    }
    return buildDecision(taxes.revenue.nonDomesticService({ evidence }), {
      region: "NON_EU",
      reason: "non-domestic-service",
      effectiveDate: sale.effectiveDate,
      location: sale.location
    });
  }
  if (sale.customerType === TaxCustomerType.BUSINESS) {
    if (sale.vatId !== undefined) {
      assertVatEvidence(sale.vatId, sale.country, sale.vatEvidenceMaxAgeDays, sale.effectiveDate);
    }
    if (sale.vatId?.status === VatIdStatus.VALID) {
      if (sale.product === SaleProduct.GOODS) {
        return buildDecision(taxes.revenue.intraCommunitySupply({ evidence }), {
          region: "EU",
          reason: "eu-b2b-intra-community-supply",
          effectiveDate: sale.effectiveDate,
          location: sale.location
        });
      }
      return buildDecision(taxes.revenue.euB2bService({ evidence }), {
        region: "EU",
        reason: "eu-b2b-reverse-charge-service",
        effectiveDate: sale.effectiveDate,
        location: sale.location
      });
    }
    if (sale.euBusinessWithoutVat === "fail") {
      throw new SevdeskConfigurationError(
        'EU company reverse charge needs current, verified VAT-ID evidence. To tax it as a consumer, set euBusinessWithoutVat: "tax-as-consumer" and choose euConsumerTaxation explicitly.'
      );
    }
  }
  if (sale.euConsumerTaxation === undefined) {
    throw new SevdeskConfigurationError(
      'EU consumer taxation is a legal business decision. Set euConsumerTaxation to "seller-country" (reviewed threshold/election) or "oss-destination" explicitly.'
    );
  }
  if (sale.euConsumerTaxation === EuConsumerTaxation.SELLER_COUNTRY) {
    const rate = sale.domesticTaxRate ?? TaxRate.STANDARD_19;
    assertGermanVatRate(rate, "domesticTaxRate");
    return buildDecision(taxes.revenue.domestic({ rate, evidence }), {
      region: "EU",
      reason: "eu-b2c-reviewed-seller-country-taxation",
      effectiveDate: sale.effectiveDate,
      euConsumerTaxation: sale.euConsumerTaxation,
      location: sale.location
    });
  }
  return destinationTaxation(sale, evidence);
}

export async function prepareGermanSaleInput(
  input: GermanSaleTaxInput,
  options: {
    readonly lookupCountry: (code: string) => Promise<TaxDestinationCountry>;
    readonly rateSource?: VatRateProvider;
    readonly useLiveRates?: boolean;
    readonly errorOnMissingCountryRates?: boolean;
    readonly fetchCountryRates?: (input: {
      readonly countryCode: string;
      readonly date: string;
    }) => Promise<CountryRates>;
  }
): Promise<GermanSaleTaxInput> {
  const sale = normalizeSaleInput(input);
  if (!needsDestinationRate(sale)) {
    return input;
  }
  const destinationCountry = sale.destinationCountry ?? (await options.lookupCountry(sale.country));
  if (sale.rateLookup !== undefined) {
    assertResolvedRateMatchesSale(sale.rateLookup, sale);
    return {
      ...input,
      country: sale.country,
      effectiveDate: sale.effectiveDate,
      euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
      destinationCountry,
      rateLookup: sale.rateLookup
    } as GermanSaleTaxInput;
  }
  if (sale.destinationRate !== undefined) {
    return {
      ...input,
      country: sale.country,
      effectiveDate: sale.effectiveDate,
      euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
      destinationCountry,
      destinationRate: sale.destinationRate
    } as GermanSaleTaxInput;
  }
  const provider = options.rateSource ?? sale.rateSource;
  const resolved = await resolveCountryRate({
    countryCode: sale.country,
    kind: sale.destinationRateKind ?? "standard",
    ...(sale.destinationRateExact === undefined ? {} : { rate: sale.destinationRateExact }),
    ...(provider === undefined ? {} : { provider }),
    ...(options.useLiveRates === undefined ? {} : { useLiveRates: options.useLiveRates }),
    ...(options.errorOnMissingCountryRates === undefined
      ? {}
      : { errorOnMissingCountryRates: options.errorOnMissingCountryRates }),
    productCategory: sale.product,
    asOf: sale.effectiveDate,
    ...(options.fetchCountryRates === undefined
      ? {}
      : { fetchCountryRates: options.fetchCountryRates })
  });
  return {
    ...withoutDestinationRateSources(input),
    country: sale.country,
    effectiveDate: sale.effectiveDate,
    euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
    destinationCountry,
    rateLookup: resolved
  } as GermanSaleTaxInput;
}

function withoutDestinationRateSources(
  input: GermanSaleTaxInput
): Readonly<Record<string, unknown>> {
  const copy: Record<string, unknown> = { ...input };
  delete copy.destinationRate;
  delete copy.rateLookup;
  delete copy.rateSource;
  return copy;
}

function destinationTaxation(
  sale: NormalizedSale,
  evidence: Readonly<Record<string, unknown>>
): GermanSaleDecision {
  const rateResolution = resolveRateSync(sale);
  if (rateResolution === undefined) {
    throw new SevdeskConfigurationError(
      `No destination rate for ${sale.country}. Use resolveSale or pass destinationRate.`
    );
  }
  const destinationCountry = sale.destinationCountry;
  if (destinationCountry === undefined) {
    throw new SevdeskConfigurationError(
      "OSS requires a destination country. Use client.taxes.resolveSale()."
    );
  }
  if (normalizeCountryCode(destinationCountry.code) !== sale.country) {
    throw new SevdeskConfigurationError("destinationCountry.code must match country.");
  }
  const rate = rateResolution.ratePercent;
  if (sale.product === SaleProduct.GOODS) {
    return buildDecision(taxes.revenue.ossGoods({ destinationCountry, rate, evidence }), {
      region: "EU",
      reason: "eu-oss-goods",
      effectiveDate: sale.effectiveDate,
      euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
      rateSource: rateResolution,
      location: sale.location
    });
  }
  if (sale.product === SaleProduct.OTHER_SERVICE) {
    return buildDecision(taxes.revenue.ossOtherService({ destinationCountry, rate, evidence }), {
      region: "EU",
      reason: "eu-oss-other-service",
      effectiveDate: sale.effectiveDate,
      euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
      rateSource: rateResolution,
      location: sale.location
    });
  }
  return buildDecision(taxes.revenue.ossElectronicService({ destinationCountry, rate, evidence }), {
    region: "EU",
    reason: "eu-oss-electronic-service",
    effectiveDate: sale.effectiveDate,
    euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
    rateSource: rateResolution,
    location: sale.location
  });
}

function needsDestinationRate(sale: NormalizedSale): boolean {
  if (sale.smallBusiness) return false;
  if (sale.country === "DE" || !isEuMemberCountry(sale.country)) return false;
  if (sale.euConsumerTaxation !== EuConsumerTaxation.OSS_DESTINATION) return false;
  if (sale.customerType === TaxCustomerType.BUSINESS) {
    if (sale.vatId?.status === VatIdStatus.VALID) return false;
    if (sale.euBusinessWithoutVat !== "tax-as-consumer") return false;
  }
  return true;
}

function assertVatEvidence(
  vat: VatIdEvidence,
  customerCountry: string,
  maxAgeDays: number,
  effectiveDate: string
): void {
  if (vat.status !== VatIdStatus.VALID) return;
  if (
    typeof vat.value !== "string" ||
    typeof vat.country !== "string" ||
    typeof vat.checkedAt !== "string" ||
    typeof vat.provider !== "string"
  ) {
    throw new SevdeskConfigurationError(
      "Valid VAT-ID evidence requires string value, country, checkedAt and provider fields."
    );
  }
  const format = validateVatIdFormat(vat.value, customerCountry);
  if (!format.valid) {
    throw new SevdeskConfigurationError(
      `VAT-ID evidence has an invalid format (${format.reason}); format validation is required in addition to provider verification.`
    );
  }
  if (!vat.provider.trim()) {
    throw new SevdeskConfigurationError("VAT-ID evidence provider cannot be empty.");
  }
  if (!isIsoCountryCode(vat.country) || normalizeCountryCode(vat.country) !== customerCountry) {
    throw new SevdeskConfigurationError("VAT-ID evidence country must match the customer country.");
  }
  const checkedAt = Date.parse(vat.checkedAt);
  const effectiveDayEnd = Date.parse(`${effectiveDate}T23:59:59.999Z`);
  const observedAt = Date.now();
  const evidenceReference = Math.min(effectiveDayEnd, observedAt);
  const observedDate = normalizeRateDate(new Date(observedAt));
  if (!Number.isFinite(checkedAt)) {
    throw new SevdeskConfigurationError("VAT-ID evidence checkedAt must be a valid timestamp.");
  }
  if (checkedAt > evidenceReference + 5 * 60_000) {
    throw new SevdeskConfigurationError(
      "VAT-ID evidence checkedAt cannot be in the real future or after the effective tax date."
    );
  }
  if (evidenceReference - checkedAt > maxAgeDays * 86_400_000) {
    throw new SevdeskConfigurationError(
      `VAT-ID evidence is older than vatEvidenceMaxAgeDays (${maxAgeDays}).`
    );
  }
  if (effectiveDate > observedDate && vat.validUntil === undefined) {
    throw new SevdeskConfigurationError(
      "VAT-ID evidence for a future effective tax date requires validUntil covering that date."
    );
  }
  if (vat.validUntil !== undefined) {
    const validUntil = Date.parse(vat.validUntil);
    if (!Number.isFinite(validUntil) || validUntil < checkedAt || validUntil < effectiveDayEnd) {
      throw new SevdeskConfigurationError(
        "VAT-ID evidence validUntil is invalid, precedes checkedAt, or expires before the effective tax date ends."
      );
    }
  }
}

function resolveRateSync(sale: NormalizedSale): ResolvedVatRate | undefined {
  const { country, destinationRate, rateLookup } = sale;
  if (rateLookup !== undefined) assertResolvedRateMatchesSale(rateLookup, sale);
  if (destinationRate !== undefined) {
    if (!Number.isFinite(destinationRate) || destinationRate < 0 || destinationRate > 100) {
      throw new SevdeskConfigurationError("destinationRate must be a finite percentage 0–100.");
    }
    if (rateLookup !== undefined && rateLookup.ratePercent !== destinationRate) {
      throw new SevdeskConfigurationError(
        "destinationRate and rateLookup.ratePercent must describe the same rate."
      );
    }
    return (
      rateLookup ??
      Object.freeze({
        countryCode: country,
        ratePercent: destinationRate,
        kind: sale.destinationRateKind ?? ("standard" as const),
        source: "explicit" as const,
        version: "caller",
        asOf: sale.effectiveDate
      })
    );
  }
  if (rateLookup !== undefined) return rateLookup;
  if (sale.rateSource !== undefined) {
    throw new SevdeskConfigurationError(
      "An asynchronous rateSource cannot be evaluated by determineGermanSale(). Use client.taxes.resolveSale()."
    );
  }
  if (sale.destinationRateKind === "reduced") {
    throw new SevdeskConfigurationError(
      "Reduced destination taxation requires destinationRate or correlated rateLookup evidence."
    );
  }
  const baseline = getPackageStandardRate(country);
  if (baseline === undefined) return undefined;
  if (
    sale.destinationRateExact !== undefined &&
    baseline.ratePercent !== sale.destinationRateExact
  ) {
    throw new SevdeskConfigurationError(
      `destinationRateExact (${sale.destinationRateExact}) does not match package baseline rate ${baseline.ratePercent} for ${country}.`
    );
  }
  const currentDate = normalizeRateDate(new Date());
  if (sale.effectiveDate !== currentDate) {
    throw new SevdeskConfigurationError(
      `The package VAT baseline is an undated current snapshot and cannot evidence ${country} on ${sale.effectiveDate}. ` +
        "Use client.taxes.resolveSale() with dated provider/live evidence, or pass destinationRate explicitly."
    );
  }
  return Object.freeze({ ...baseline, asOf: sale.effectiveDate });
}

function assertResolvedRateMatchesSale(rate: ResolvedVatRate, sale: NormalizedSale): void {
  if (
    !Number.isFinite(rate.ratePercent) ||
    rate.ratePercent < 0 ||
    rate.ratePercent > 100 ||
    typeof rate.version !== "string" ||
    rate.version.trim() === ""
  ) {
    throw new SevdeskConfigurationError(
      "rateLookup requires a finite ratePercent from 0 to 100 and a non-empty version."
    );
  }
  if (normalizeCountryCode(rate.countryCode) !== sale.country) {
    throw new SevdeskConfigurationError("rateLookup.countryCode must match country.");
  }
  const expectedKind = sale.destinationRateKind ?? "standard";
  if (rate.kind !== expectedKind) {
    throw new SevdeskConfigurationError(
      `rateLookup.kind (${rate.kind}) must match destinationRateKind (${expectedKind}).`
    );
  }
  if (rate.asOf === undefined) {
    throw new SevdeskConfigurationError("rateLookup.asOf is required as dated rate evidence.");
  }
  if (normalizeRateDate(rate.asOf) !== sale.effectiveDate) {
    throw new SevdeskConfigurationError("rateLookup.asOf must match effectiveDate.");
  }
  if (sale.destinationRateExact !== undefined && rate.ratePercent !== sale.destinationRateExact) {
    throw new SevdeskConfigurationError("rateLookup.ratePercent must match destinationRateExact.");
  }
}

function buildDecision(
  selection: GermanSaleTaxSelection,
  meta: {
    readonly region: "DE" | "EU" | "NON_EU";
    readonly reason: string;
    readonly effectiveDate: string;
    readonly euConsumerTaxation?: "seller-country" | "oss-destination";
    readonly rateSource?: ResolvedVatRate;
    readonly location: TaxLocationAssessment | undefined;
  }
): GermanSaleDecision {
  return Object.freeze({
    selection,
    region: meta.region,
    reason: meta.reason,
    defaultTaxRate: selection.defaultTaxRate,
    taxRule: selection.taxRule,
    treatment: selection.treatment,
    effectiveDate: meta.effectiveDate,
    ...(meta.euConsumerTaxation === undefined
      ? {}
      : { euConsumerTaxation: meta.euConsumerTaxation }),
    ...(meta.rateSource === undefined ? {} : { rateSource: meta.rateSource }),
    ...(meta.location === undefined ? {} : { location: meta.location })
  }) as unknown as GermanSaleDecision;
}

export { SaleProduct, SaleTemplate } from "./templates.js";
export type { SaleProductId, SaleTemplateId } from "./templates.js";
