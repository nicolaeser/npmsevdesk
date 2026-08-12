import { TaxRule } from "../enums/domain-enums.js";

export const BookkeepingSystem = {
  LEGACY: "1.0",
  CURRENT: "2.0"
} as const;

export const TaxRate = {
  ZERO: 0,
  REDUCED_7: 7,
  STANDARD_19: 19
} as const;

export const SalesTaxRule = {
  STANDARD_TAXABLE: TaxRule.STANDARD_TAXABLE,
  EXPORT: TaxRule.EXPORT,
  INTRA_COMMUNITY_SUPPLY: TaxRule.INTRA_COMMUNITY_SUPPLY,
  VAT_EXEMPT_SECTION_4: TaxRule.VAT_EXEMPT_SECTION_4,
  REVERSE_CHARGE_13B_REVENUE: TaxRule.REVERSE_CHARGE_13B_REVENUE,
  SMALL_BUSINESS_REVENUE: TaxRule.SMALL_BUSINESS_REVENUE,
  NON_DOMESTIC_SERVICE: TaxRule.NON_DOMESTIC_SERVICE,
  OSS_GOODS: TaxRule.OSS_GOODS,
  OSS_ELECTRONIC_SERVICE: TaxRule.OSS_ELECTRONIC_SERVICE,
  OSS_OTHER_SERVICE: TaxRule.OSS_OTHER_SERVICE,
  REVERSE_CHARGE_18B: TaxRule.REVERSE_CHARGE_18B
} as const;

export const ExpenseTaxRule = {
  INTRA_COMMUNITY_ACQUISITION: TaxRule.INTRA_COMMUNITY_ACQUISITION,
  DEDUCTIBLE_INPUT_TAX: TaxRule.DEDUCTIBLE_INPUT_TAX,
  NON_DEDUCTIBLE_EXPENSE: TaxRule.NON_DEDUCTIBLE_EXPENSE,
  REVERSE_CHARGE_13B_2_WITH_INPUT: TaxRule.REVERSE_CHARGE_13B_2_WITH_INPUT,
  REVERSE_CHARGE_13B_WITHOUT_INPUT: TaxRule.REVERSE_CHARGE_13B_WITHOUT_INPUT,
  REVERSE_CHARGE_13B_1_EU: TaxRule.REVERSE_CHARGE_13B_1_EU
} as const;

export const VoucherSalesTaxRule = {
  STANDARD_TAXABLE: TaxRule.STANDARD_TAXABLE,
  EXPORT: TaxRule.EXPORT,
  INTRA_COMMUNITY_SUPPLY: TaxRule.INTRA_COMMUNITY_SUPPLY,
  VAT_EXEMPT_SECTION_4: TaxRule.VAT_EXEMPT_SECTION_4,
  REVERSE_CHARGE_13B_REVENUE: TaxRule.REVERSE_CHARGE_13B_REVENUE,
  SMALL_BUSINESS_REVENUE: TaxRule.SMALL_BUSINESS_REVENUE,
  NON_DOMESTIC_SERVICE: TaxRule.NON_DOMESTIC_SERVICE
} as const;

export const TaxTreatment = {
  DOMESTIC_SALE: "domestic-sale",
  EXPORT_GOODS: "export-goods",
  INTRA_COMMUNITY_SUPPLY: "intra-community-supply",
  VAT_EXEMPT_SECTION_4: "vat-exempt-section-4",
  REVERSE_CHARGE_13B_REVENUE: "reverse-charge-13b-revenue",
  SMALL_BUSINESS_REVENUE: "small-business-revenue",
  NON_DOMESTIC_SERVICE: "non-domestic-service",
  OSS_GOODS: "oss-goods",
  OSS_ELECTRONIC_SERVICE: "oss-electronic-service",
  OSS_OTHER_SERVICE: "oss-other-service",
  EU_B2B_REVERSE_CHARGE: "eu-b2b-reverse-charge",
  INTRA_COMMUNITY_ACQUISITION: "intra-community-acquisition",
  DEDUCTIBLE_INPUT_TAX: "deductible-input-tax",
  NON_DEDUCTIBLE_EXPENSE: "non-deductible-expense",
  SMALL_BUSINESS_EXPENSE: "small-business-expense",
  REVERSE_CHARGE_13B_2_WITH_INPUT: "reverse-charge-13b-2-with-input",
  REVERSE_CHARGE_13B_WITHOUT_INPUT: "reverse-charge-13b-without-input",
  REVERSE_CHARGE_13B_1_EU: "reverse-charge-13b-1-eu"
} as const;

export const TaxCustomerType = {
  BUSINESS: "business",
  CONSUMER: "consumer"
} as const;

export const EuConsumerTaxation = {
  SELLER_COUNTRY: "seller-country",
  OSS_DESTINATION: "oss-destination"
} as const;

export const VatIdStatus = {
  VALID: "valid",
  INVALID: "invalid",
  UNAVAILABLE: "unavailable",
  NOT_CHECKED: "not-checked"
} as const;

export const SellerTaxScheme = {
  STANDARD: "standard",
  SMALL_BUSINESS: "small-business"
} as const;

export const GuidanceTaxRate = {
  ZERO: "ZERO",
  SEVEN: "SEVEN",
  NINETEEN: "NINETEEN"
} as const;
