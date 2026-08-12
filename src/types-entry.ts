export type * from "./types/index.js";
export type * from "./domain/models.js";
export type * from "./domain/results.js";
export type * from "./domain/status.js";
export type {
  BookkeepingSystemValue,
  CountryRatesJson,
  CountryRatesResult,
  EuConsumerTaxationValue,
  ExpenseDocumentTaxInput,
  ExpenseTaxConfiguration,
  ExpenseTaxRuleInput,
  ExpenseTaxRuleValue,
  GermanDigitalServiceTaxInput,
  GermanDigitalServiceTaxRuleValue,
  GermanDigitalServiceTaxSelection,
  GermanDigitalServiceTaxTreatmentValue,
  GermanSaleDecision,
  GermanSaleQuoteResult,
  GermanSaleResolutionEvidence,
  GermanSaleResolutionResult,
  GermanSaleTaxInput,
  GermanSaleTaxRuleValue,
  GermanSaleTaxSelection,
  GermanSaleTaxTreatmentValue,
  KnownLegacyNonCustomTaxTypeInput,
  KnownLegacyTaxTypeInput,
  LegacyTaxConfiguration,
  ManualExpenseTaxConfiguration,
  ManualSalesTaxConfiguration,
  ManualVoucherRevenueTaxConfiguration,
  ModernExpenseTaxConfiguration,
  ModernSalesTaxConfiguration,
  ModernVoucherRevenueTaxConfiguration,
  NormalizedGuidanceRate,
  NormalizedTaxGuidance,
  NormalizedTaxGuidanceRule,
  ResolvedExpenseTaxPlan,
  ResolvedSalesTaxPlan,
  ResolvedTaxPlan,
  ResolvedTaxPlanFor,
  ResolvedVoucherRevenueTaxPlan,
  SalesDocumentTaxInput,
  SalesTaxConfiguration,
  SalesTaxRuleInput,
  SalesTaxRuleValue,
  SellerTaxSchemeValue,
  TaxCustomerTypeValue,
  TaxDestinationCountry,
  TaxGuidanceQuery,
  TaxGuidanceResult,
  TaxProfile,
  TaxProfileResult,
  TaxResolutionResult,
  TaxRuleForDirection,
  TaxSelection,
  TaxTreatmentValue,
  TaxValidationIssue,
  TaxValidationResult,
  VatIdEvidence,
  VatIdStatusValue,
  VoucherRevenueTaxConfiguration,
  VoucherRevenueTaxInput,
  VoucherRevenueTaxRuleInput,
  VoucherRevenueTaxRuleValue,
  VoucherTaxCheck,
  VoucherTaxCheckFailureReason,
  VoucherTaxCheckInput,
  VoucherTaxCheckResult
} from "./taxes/types.js";
export type { TaxDocumentValidationInput, TaxResource } from "./taxes/validation.js";
export type {
  TaxLocationAssessment,
  TaxLocationEvidence,
  TaxLocationSource
} from "./taxes/location.js";
export type { ApplicationVatRate } from "./taxes/rates/types.js";
export type {
  DestinationTaxPresetInput,
  EvidenceTaxPresetInput,
  RatedTaxPresetInput
} from "./taxes/presets.js";
export type {
  CountryRateEntry,
  CountryRates,
  DatedResolvedVatRate,
  GermanVatRate,
  ResolveCountryRateInput,
  ResolvedVatRate,
  SelectCountryRateOptions,
  SevdeskVatRateTypeValue,
  VatRateKind,
  VatRateProvider,
  VatRateSource
} from "./taxes/rates/index.js";
export type { CalculateTaxedPriceInput, PriceBasis, TaxedPrice } from "./taxes/pricing.js";
export type { VatIdFormatResult } from "./taxes/vat-id.js";
export type { CuratedRequestOptions } from "./bundles/types.js";
export type { SevdeskTimestamp } from "./utils/date.js";
export type { SevdeskDiagnosticOptions, SevdeskRequestContext } from "./utils/errors.js";
export type {
  FetchAllResult,
  PageItem,
  PageLike,
  PaginationOptions,
  PaginationRequest
} from "./utils/pagination.js";
export type { QueryObject } from "./utils/query.js";
export { reference, refs } from "./types/references.js";
