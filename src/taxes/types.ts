import type { EnumInput, LegacyTaxType, RawEnumCode } from "../enums/domain-enums.js";
import type { components, operations } from "../types/openapi.js";
import type { ResultFor } from "../types/operation.js";
import type { PaginatedSevdeskResult } from "../types/pagination-result.js";
import type { SafeSevdeskReference, SevdeskReference } from "../types/references.js";
import type { SevdeskResult } from "../types/result.js";
import type { StaticCountryLookupResult } from "../lookup/types.js";
import type {
  BookkeepingSystem,
  EuConsumerTaxation,
  ExpenseTaxRule,
  SalesTaxRule,
  SellerTaxScheme,
  TaxCustomerType,
  TaxTreatment,
  VatIdStatus,
  VoucherSalesTaxRule
} from "./constants.js";

export const TAX_SELECTION_BRAND: unique symbol = Symbol.for("npmsevdesk.tax-selection") as never;

export const RESOLVED_TAX_PLAN_BRAND: unique symbol = Symbol.for(
  "npmsevdesk.resolved-tax-plan"
) as never;

export const MANUAL_TAX_CONFIGURATION_BRAND: unique symbol = Symbol.for(
  "npmsevdesk.manual-tax-configuration"
) as never;

export type BookkeepingSystemValue = (typeof BookkeepingSystem)[keyof typeof BookkeepingSystem];
export type SalesTaxRuleValue = (typeof SalesTaxRule)[keyof typeof SalesTaxRule];
export type ExpenseTaxRuleValue = (typeof ExpenseTaxRule)[keyof typeof ExpenseTaxRule];
export type SalesTaxRuleInput = EnumInput<typeof SalesTaxRule> | RawEnumCode<"TaxRule", number>;
export type ExpenseTaxRuleInput = EnumInput<typeof ExpenseTaxRule> | RawEnumCode<"TaxRule", number>;
export type TaxTreatmentValue = (typeof TaxTreatment)[keyof typeof TaxTreatment];
export type SellerTaxSchemeValue = (typeof SellerTaxScheme)[keyof typeof SellerTaxScheme];
export type TaxCustomerTypeValue = (typeof TaxCustomerType)[keyof typeof TaxCustomerType];
export type EuConsumerTaxationValue = (typeof EuConsumerTaxation)[keyof typeof EuConsumerTaxation];
export type VatIdStatusValue = (typeof VatIdStatus)[keyof typeof VatIdStatus];
export type KnownLegacyTaxTypeInput = EnumInput<typeof LegacyTaxType>;
export type KnownLegacyNonCustomTaxTypeInput = EnumInput<Omit<typeof LegacyTaxType, "CUSTOM">>;

export interface ModernSalesTaxConfiguration {
  readonly kind?: never;
  readonly bookkeepingSystem: "2.0";
  readonly taxRule: SalesTaxRuleInput;
  readonly taxType?: never;
  readonly taxSet?: never;
}

export interface ModernExpenseTaxConfiguration {
  readonly kind?: never;
  readonly bookkeepingSystem: "2.0";
  readonly taxRule: ExpenseTaxRuleInput;
  readonly taxType?: never;
  readonly taxSet?: never;
}

export type LegacyTaxConfiguration =
  | {
      readonly kind?: never;
      readonly bookkeepingSystem: "1.0";
      readonly taxType: "custom" | "CUSTOM";
      readonly taxSet: SevdeskReference<"TaxSet">;
      readonly taxRule?: never;
    }
  | {
      readonly kind?: never;
      readonly bookkeepingSystem: "1.0";
      readonly taxType: KnownLegacyNonCustomTaxTypeInput;
      readonly taxSet?: never;
      readonly taxRule?: never;
    }
  | {
      readonly kind?: never;
      readonly bookkeepingSystem: "1.0";
      readonly taxType: RawEnumCode<"LegacyTaxType", string>;
      readonly taxSet: SevdeskReference<"TaxSet">;
      readonly taxRule?: never;
    };

export type SalesTaxConfiguration = ModernSalesTaxConfiguration | LegacyTaxConfiguration;
export type ExpenseTaxConfiguration = ModernExpenseTaxConfiguration | LegacyTaxConfiguration;

interface ManualTaxConfigurationMarker {
  readonly [MANUAL_TAX_CONFIGURATION_BRAND]: true;
}

export type ManualSalesTaxConfiguration<
  TConfiguration extends SalesTaxConfiguration = SalesTaxConfiguration
> = TConfiguration & ManualTaxConfigurationMarker;

export type ManualExpenseTaxConfiguration<
  TConfiguration extends ExpenseTaxConfiguration = ExpenseTaxConfiguration
> = TConfiguration & ManualTaxConfigurationMarker;

export type VoucherRevenueTaxRuleValue = Exclude<
  SalesTaxRuleValue,
  | typeof SalesTaxRule.OSS_GOODS
  | typeof SalesTaxRule.OSS_ELECTRONIC_SERVICE
  | typeof SalesTaxRule.OSS_OTHER_SERVICE
  | typeof SalesTaxRule.REVERSE_CHARGE_18B
>;

export type VoucherRevenueTaxRuleInput =
  EnumInput<typeof VoucherSalesTaxRule> | RawEnumCode<"TaxRule", number>;

export interface ModernVoucherRevenueTaxConfiguration {
  readonly kind?: never;
  readonly bookkeepingSystem: "2.0";
  readonly taxRule: VoucherRevenueTaxRuleInput;
  readonly taxType?: never;
  readonly taxSet?: never;
}

export type VoucherRevenueTaxConfiguration =
  ModernVoucherRevenueTaxConfiguration | LegacyTaxConfiguration;

export type ManualVoucherRevenueTaxConfiguration<
  TConfiguration extends VoucherRevenueTaxConfiguration = VoucherRevenueTaxConfiguration
> = TConfiguration & ManualTaxConfigurationMarker;

export interface TaxDestinationCountry {
  readonly code: string;
  readonly id: SevdeskReference<"StaticCountry">["id"];
  readonly objectName: "StaticCountry";
}

export type TaxRuleForDirection<TDirection extends "revenue" | "expense"> =
  TDirection extends "revenue" ? SalesTaxRuleValue : ExpenseTaxRuleValue;

export interface TaxSelection<
  TDirection extends "revenue" | "expense" = "revenue" | "expense",
  TTaxRule extends TaxRuleForDirection<TDirection> = TaxRuleForDirection<TDirection>,
  TTreatment extends TaxTreatmentValue = TaxTreatmentValue,
  TDefaultTaxRate extends number = number
> {
  readonly [TAX_SELECTION_BRAND]: true;
  readonly kind: "tax-selection";
  readonly direction: TDirection;
  readonly treatment: TTreatment;
  readonly taxRule: TTaxRule;
  readonly defaultTaxRate: TDefaultTaxRate;
  readonly legacyTaxType?: KnownLegacyNonCustomTaxTypeInput;
  readonly destinationCountry?: string;
  readonly deliveryAddressCountry?: SafeSevdeskReference<"StaticCountry">;
  readonly evidence?: Readonly<Record<string, unknown>>;
}

interface ResolvedTaxPlanBase<
  TDirection extends "revenue" | "expense",
  TTreatment extends TaxTreatmentValue,
  TDefaultTaxRate extends number
> {
  readonly [RESOLVED_TAX_PLAN_BRAND]: true;
  readonly kind: "resolved-tax-plan";
  readonly direction: TDirection;
  readonly treatment: TTreatment;
  readonly defaultTaxRate: TDefaultTaxRate;
  readonly destinationCountry?: string;
  readonly deliveryAddressCountry?: SafeSevdeskReference<"StaticCountry">;
  readonly evidence?: Readonly<Record<string, unknown>>;
}

export type ResolvedTaxPlan<
  TDirection extends "revenue" | "expense" = "revenue" | "expense",
  TTaxRule extends TaxRuleForDirection<TDirection> = TaxRuleForDirection<TDirection>,
  TTreatment extends TaxTreatmentValue = TaxTreatmentValue,
  TDefaultTaxRate extends number = number
> =
  | (ResolvedTaxPlanBase<TDirection, TTreatment, TDefaultTaxRate> & {
      readonly bookkeepingSystem: "2.0";
      readonly taxRule: TTaxRule;
      readonly taxType?: never;
      readonly taxSet?: never;
    })
  | (ResolvedTaxPlanBase<TDirection, TTreatment, TDefaultTaxRate> & {
      readonly bookkeepingSystem: "1.0";
      readonly taxType: KnownLegacyNonCustomTaxTypeInput;
      readonly taxRule?: never;
      readonly taxSet?: never;
    });

export type ResolvedSalesTaxPlan = ResolvedTaxPlan<"revenue">;
export type ResolvedExpenseTaxPlan = ResolvedTaxPlan<"expense">;
export type ResolvedVoucherRevenueTaxPlan = ResolvedTaxPlan<"revenue", VoucherRevenueTaxRuleValue>;
export type ResolvedTaxPlanFor<
  TDirection extends "revenue" | "expense",
  TVersion extends BookkeepingSystemValue,
  TTaxRule extends TaxRuleForDirection<TDirection> = TaxRuleForDirection<TDirection>,
  TTreatment extends TaxTreatmentValue = TaxTreatmentValue,
  TDefaultTaxRate extends number = number
> = Extract<
  ResolvedTaxPlan<TDirection, TTaxRule, TTreatment, TDefaultTaxRate>,
  { readonly bookkeepingSystem: TVersion }
>;
export type SalesDocumentTaxInput = ManualSalesTaxConfiguration | ResolvedSalesTaxPlan;
export type ExpenseDocumentTaxInput = ManualExpenseTaxConfiguration | ResolvedExpenseTaxPlan;
export type VoucherRevenueTaxInput =
  ManualVoucherRevenueTaxConfiguration | ResolvedVoucherRevenueTaxPlan;

export type TaxProfile =
  | {
      readonly bookkeepingSystem: "1.0";
      readonly representation: "legacy-tax-type";
    }
  | {
      readonly bookkeepingSystem: "2.0";
      readonly representation: "tax-rule";
    };

export type TaxProfileResult = SevdeskResult<
  ResultFor<operations["bookkeepingSystemVersion"]>["json"],
  TaxProfile,
  undefined
>;

export type TaxResolutionResult<
  TDirection extends "revenue" | "expense",
  TTaxRule extends TaxRuleForDirection<TDirection> = TaxRuleForDirection<TDirection>,
  TTreatment extends TaxTreatmentValue = TaxTreatmentValue,
  TDefaultTaxRate extends number = number
> = SevdeskResult<
  ResultFor<operations["bookkeepingSystemVersion"]>["json"],
  ResolvedTaxPlan<TDirection, TTaxRule, TTreatment, TDefaultTaxRate>,
  undefined
>;

export type VatIdEvidence =
  | {
      readonly status: typeof VatIdStatus.VALID;
      readonly value: string;
      readonly country: string;
      readonly checkedAt: string;
      readonly provider: string;
      readonly validUntil?: string;
    }
  | {
      readonly status: Exclude<VatIdStatusValue, typeof VatIdStatus.VALID>;
      readonly value?: string;
      readonly country?: string;
      readonly checkedAt?: string;
      readonly provider?: string;
    };

type DigitalServiceCustomer =
  | {
      readonly type: "consumer";
      readonly country: string;
      readonly euConsumerTaxation?:
        | {
            readonly mode: "oss-destination";
            readonly destinationCountry: TaxDestinationCountry;
            readonly rate: number;
          }
        | {
            readonly mode: "seller-country";
            readonly rate: number;
          };
      readonly vatId?: never;
    }
  | {
      readonly type: "business";
      readonly country: string;
      readonly vatId?: VatIdEvidence;
      readonly euConsumerTaxation?: never;
    };

interface GermanDigitalServiceTaxInputBase {
  readonly customer: DigitalServiceCustomer;
  readonly domesticTaxRate?: number;
  readonly evidence?: Readonly<Record<string, unknown>>;
}

export type GermanDigitalServiceTaxInput = GermanDigitalServiceTaxInputBase &
  (
    | {
        readonly sellerTaxScheme: typeof SellerTaxScheme.STANDARD;
        readonly smallBusinessTreatment?: never;
      }
    | {
        readonly sellerTaxScheme: typeof SellerTaxScheme.SMALL_BUSINESS;
        readonly smallBusinessTreatment: "section-19";
      }
  );

export type GermanDigitalServiceTaxRuleValue =
  | typeof SalesTaxRule.STANDARD_TAXABLE
  | typeof SalesTaxRule.SMALL_BUSINESS_REVENUE
  | typeof SalesTaxRule.NON_DOMESTIC_SERVICE
  | typeof SalesTaxRule.OSS_ELECTRONIC_SERVICE
  | typeof SalesTaxRule.REVERSE_CHARGE_18B;

export type GermanDigitalServiceTaxTreatmentValue =
  | typeof TaxTreatment.DOMESTIC_SALE
  | typeof TaxTreatment.SMALL_BUSINESS_REVENUE
  | typeof TaxTreatment.NON_DOMESTIC_SERVICE
  | typeof TaxTreatment.OSS_ELECTRONIC_SERVICE
  | typeof TaxTreatment.EU_B2B_REVERSE_CHARGE;

export type GermanDigitalServiceTaxSelection = TaxSelection<
  "revenue",
  GermanDigitalServiceTaxRuleValue,
  GermanDigitalServiceTaxTreatmentValue
>;

export type { SaleProductId, SaleTemplateId } from "./sale/templates.js";

type GermanSaleProductInput =
  | {
      readonly product?: import("./sale/templates.js").SaleProductId | "saas" | "service";
      readonly template?: never;
    }
  | {
      readonly template: import("./sale/templates.js").SaleTemplateId;
      readonly product?: never;
    };

type GermanSaleConsumerIdentity =
  | {
      readonly customerType?: typeof TaxCustomerType.CONSUMER;
      readonly type?: never;
    }
  | {
      readonly type: "private";
      readonly customerType?: never;
    };

type GermanSaleBusinessIdentity =
  | {
      readonly customerType: typeof TaxCustomerType.BUSINESS;
      readonly type?: never;
    }
  | {
      readonly type: "company";
      readonly customerType?: never;
    };

type GermanSaleAnyCustomerIdentity = GermanSaleConsumerIdentity | GermanSaleBusinessIdentity;

interface GermanSaleNoConsumerTaxation {
  readonly euConsumerTaxation?: never;
  readonly destinationCountry?: never;
  readonly destinationRate?: never;
  readonly destinationRateKind?: never;
  readonly destinationRateExact?: never;
  readonly rateLookup?: never;
  readonly rateSource?: never;
}

interface GermanSaleSellerCountryTaxation {
  readonly euConsumerTaxation: typeof EuConsumerTaxation.SELLER_COUNTRY;
  readonly destinationCountry?: never;
  readonly destinationRate?: never;
  readonly destinationRateKind?: never;
  readonly destinationRateExact?: never;
  readonly rateLookup?: never;
  readonly rateSource?: never;
}

interface GermanSaleOssRateBase {
  readonly destinationCountry?: TaxDestinationCountry;
}

type GermanSaleOssRateInput =
  | {
      readonly destinationRate?: never;
      readonly rateLookup?: never;
      readonly rateSource?: never;
      readonly destinationRateKind?: import("./rates/types.js").VatRateKind;
      readonly destinationRateExact?: number;
    }
  | {
      readonly destinationRate: number;
      readonly rateLookup?: never;
      readonly rateSource?: never;
      readonly destinationRateKind?: import("./rates/types.js").VatRateKind;
      readonly destinationRateExact?: never;
    }
  | {
      readonly destinationRate?: never;
      readonly rateLookup: import("./rates/types.js").DatedResolvedVatRate;
      readonly rateSource?: never;
      readonly destinationRateKind?: import("./rates/types.js").VatRateKind;
      readonly destinationRateExact?: number;
    }
  | {
      readonly destinationRate?: never;
      readonly rateLookup?: never;
      readonly rateSource: import("./rates/types.js").VatRateProvider;
      readonly destinationRateKind?: "standard";
      readonly destinationRateExact?: number;
    };

type GermanSaleOssTaxation = GermanSaleOssRateBase &
  GermanSaleOssRateInput & {
    readonly euConsumerTaxation: typeof EuConsumerTaxation.OSS_DESTINATION;
  };

type ValidVatIdEvidence = Extract<VatIdEvidence, { readonly status: typeof VatIdStatus.VALID }>;
type NonValidVatIdEvidence = Exclude<VatIdEvidence, { readonly status: typeof VatIdStatus.VALID }>;

interface GermanSaleNoVatEvidence {
  readonly vatId?: never;
  readonly vatEvidenceMaxAgeDays?: never;
}

type GermanSaleOptionalNonValidVatEvidence =
  | GermanSaleNoVatEvidence
  | {
      readonly vatId: NonValidVatIdEvidence;
      readonly vatEvidenceMaxAgeDays?: never;
    };

interface GermanSaleDomesticRateInput {
  readonly domesticTaxRate?: number;
}

interface GermanSaleNoDomesticRateInput {
  readonly domesticTaxRate?: never;
}

type GermanSaleRegularCustomerInput =
  | (GermanSaleConsumerIdentity &
      (GermanSaleNoConsumerTaxation | GermanSaleSellerCountryTaxation) &
      GermanSaleNoVatEvidence &
      GermanSaleDomesticRateInput & {
        readonly euBusinessWithoutVat?: never;
      })
  | (GermanSaleConsumerIdentity &
      GermanSaleOssTaxation &
      GermanSaleNoVatEvidence &
      GermanSaleNoDomesticRateInput & {
        readonly euBusinessWithoutVat?: never;
      })
  | (GermanSaleBusinessIdentity &
      GermanSaleNoConsumerTaxation &
      GermanSaleNoDomesticRateInput & {
        readonly vatId: ValidVatIdEvidence;
        readonly vatEvidenceMaxAgeDays?: number;
        readonly euBusinessWithoutVat?: never;
      })
  | (GermanSaleBusinessIdentity &
      GermanSaleNoConsumerTaxation &
      GermanSaleOptionalNonValidVatEvidence &
      GermanSaleDomesticRateInput & {
        readonly euBusinessWithoutVat?: "fail";
      })
  | (GermanSaleBusinessIdentity &
      GermanSaleSellerCountryTaxation &
      GermanSaleOptionalNonValidVatEvidence &
      GermanSaleDomesticRateInput & {
        readonly euBusinessWithoutVat: "tax-as-consumer";
      })
  | (GermanSaleBusinessIdentity &
      GermanSaleOssTaxation &
      GermanSaleOptionalNonValidVatEvidence &
      GermanSaleNoDomesticRateInput & {
        readonly euBusinessWithoutVat: "tax-as-consumer";
      });

type GermanSaleSellerSchemeInput =
  | (GermanSaleRegularCustomerInput & {
      readonly smallBusiness?: false;
    })
  | (GermanSaleAnyCustomerIdentity &
      GermanSaleNoConsumerTaxation & {
        readonly smallBusiness: true;
        readonly vatId?: never;
        readonly vatEvidenceMaxAgeDays?: never;
        readonly euBusinessWithoutVat?: never;
        readonly domesticTaxRate?: never;
      });

export type GermanSaleTaxInput = GermanSaleProductInput &
  GermanSaleSellerSchemeInput & {
    readonly country: string;
    readonly effectiveDate?: string | Date;
    readonly evidence?: Readonly<Record<string, unknown>>;
    readonly locationEvidence?: import("./location.js").TaxLocationEvidence;
  };

export type GermanSaleTaxRuleValue =
  | typeof SalesTaxRule.STANDARD_TAXABLE
  | typeof SalesTaxRule.EXPORT
  | typeof SalesTaxRule.INTRA_COMMUNITY_SUPPLY
  | typeof SalesTaxRule.SMALL_BUSINESS_REVENUE
  | typeof SalesTaxRule.NON_DOMESTIC_SERVICE
  | typeof SalesTaxRule.OSS_GOODS
  | typeof SalesTaxRule.OSS_ELECTRONIC_SERVICE
  | typeof SalesTaxRule.OSS_OTHER_SERVICE
  | typeof SalesTaxRule.REVERSE_CHARGE_18B;

export type GermanSaleTaxTreatmentValue =
  | typeof TaxTreatment.DOMESTIC_SALE
  | typeof TaxTreatment.EXPORT_GOODS
  | typeof TaxTreatment.INTRA_COMMUNITY_SUPPLY
  | typeof TaxTreatment.SMALL_BUSINESS_REVENUE
  | typeof TaxTreatment.NON_DOMESTIC_SERVICE
  | typeof TaxTreatment.OSS_GOODS
  | typeof TaxTreatment.OSS_ELECTRONIC_SERVICE
  | typeof TaxTreatment.OSS_OTHER_SERVICE
  | typeof TaxTreatment.EU_B2B_REVERSE_CHARGE;

export type GermanSaleTaxSelection = TaxSelection<
  "revenue",
  GermanSaleTaxRuleValue,
  GermanSaleTaxTreatmentValue
>;

interface GermanSaleDecisionBase<
  TSelection extends GermanSaleTaxSelection,
  TRegion extends "DE" | "EU" | "NON_EU",
  TReason extends string
> {
  readonly selection: TSelection;
  readonly region: TRegion;
  readonly reason: TReason;
  readonly defaultTaxRate: TSelection["defaultTaxRate"];
  readonly taxRule: TSelection["taxRule"];
  readonly treatment: TSelection["treatment"];
  readonly effectiveDate: string;
  readonly location?: import("./location.js").TaxLocationAssessment;
}

interface GermanSaleNonDestinationDecision {
  readonly euConsumerTaxation?: never;
  readonly rateSource?: never;
}

interface GermanSaleSellerCountryDecision {
  readonly euConsumerTaxation: typeof EuConsumerTaxation.SELLER_COUNTRY;
  readonly rateSource?: never;
}

interface GermanSaleOssDecision {
  readonly euConsumerTaxation: typeof EuConsumerTaxation.OSS_DESTINATION;
  readonly rateSource: import("./rates/types.js").DatedResolvedVatRate;
}

type SaleDecision<
  TRule extends GermanSaleTaxRuleValue,
  TTreatment extends GermanSaleTaxTreatmentValue,
  TRate extends number,
  TRegion extends "DE" | "EU" | "NON_EU",
  TReason extends string,
  TContext extends object = GermanSaleNonDestinationDecision
> = GermanSaleDecisionBase<TaxSelection<"revenue", TRule, TTreatment, TRate>, TRegion, TReason> &
  TContext;

export type GermanSaleDecision =
  | SaleDecision<
      typeof SalesTaxRule.STANDARD_TAXABLE,
      typeof TaxTreatment.DOMESTIC_SALE,
      number,
      "DE",
      "domestic-sale"
    >
  | SaleDecision<
      typeof SalesTaxRule.STANDARD_TAXABLE,
      typeof TaxTreatment.DOMESTIC_SALE,
      number,
      "EU",
      "eu-b2c-reviewed-seller-country-taxation",
      GermanSaleSellerCountryDecision
    >
  | SaleDecision<
      typeof SalesTaxRule.EXPORT,
      typeof TaxTreatment.EXPORT_GOODS,
      0,
      "NON_EU",
      "export-of-goods"
    >
  | SaleDecision<
      typeof SalesTaxRule.INTRA_COMMUNITY_SUPPLY,
      typeof TaxTreatment.INTRA_COMMUNITY_SUPPLY,
      0,
      "EU",
      "eu-b2b-intra-community-supply"
    >
  | SaleDecision<
      typeof SalesTaxRule.SMALL_BUSINESS_REVENUE,
      typeof TaxTreatment.SMALL_BUSINESS_REVENUE,
      0,
      "DE" | "EU" | "NON_EU",
      "seller-section-19-small-business"
    >
  | SaleDecision<
      typeof SalesTaxRule.NON_DOMESTIC_SERVICE,
      typeof TaxTreatment.NON_DOMESTIC_SERVICE,
      0,
      "NON_EU",
      "non-domestic-service"
    >
  | SaleDecision<
      typeof SalesTaxRule.OSS_GOODS,
      typeof TaxTreatment.OSS_GOODS,
      number,
      "EU",
      "eu-oss-goods",
      GermanSaleOssDecision
    >
  | SaleDecision<
      typeof SalesTaxRule.OSS_ELECTRONIC_SERVICE,
      typeof TaxTreatment.OSS_ELECTRONIC_SERVICE,
      number,
      "EU",
      "eu-oss-electronic-service",
      GermanSaleOssDecision
    >
  | SaleDecision<
      typeof SalesTaxRule.OSS_OTHER_SERVICE,
      typeof TaxTreatment.OSS_OTHER_SERVICE,
      number,
      "EU",
      "eu-oss-other-service",
      GermanSaleOssDecision
    >
  | SaleDecision<
      typeof SalesTaxRule.REVERSE_CHARGE_18B,
      typeof TaxTreatment.EU_B2B_REVERSE_CHARGE,
      0,
      "EU",
      "eu-b2b-reverse-charge-service"
    >;

export interface CountryRatesJson {
  readonly objects?: readonly unknown[];
}

export type CountryRatesResult = SevdeskResult<
  CountryRatesJson,
  import("./rates/types.js").CountryRates,
  undefined
>;

export interface GermanSaleResolutionEvidence {
  readonly countryLookup?: StaticCountryLookupResult;
  readonly countryRates?: CountryRatesResult;
  readonly rate?: import("./rates/types.js").DatedResolvedVatRate;
}

type GermanSaleResolutionEvidenceForDecision<TDecision extends GermanSaleDecision> =
  TDecision extends GermanSaleOssDecision
    ? Omit<GermanSaleResolutionEvidence, "rate"> & {
        readonly rate: TDecision["rateSource"];
      }
    : Omit<GermanSaleResolutionEvidence, "rate"> & {
        readonly rate?: never;
      };

type GermanSaleResolutionForDecision<TDecision extends GermanSaleDecision> =
  TDecision extends GermanSaleDecision
    ? TaxResolutionResult<
        "revenue",
        TDecision["taxRule"],
        TDecision["treatment"],
        TDecision["defaultTaxRate"]
      > & {
        readonly decision: TDecision;
        readonly evidence: GermanSaleResolutionEvidenceForDecision<TDecision>;
      }
    : never;

export type GermanSaleResolutionResult = GermanSaleResolutionForDecision<GermanSaleDecision>;

type GermanSaleQuoteForDecision<
  TDecision extends GermanSaleDecision,
  TBasis extends import("./pricing.js").PriceBasis = import("./pricing.js").PriceBasis
> = TDecision extends GermanSaleDecision
  ? {
      readonly tax: ResolvedTaxPlan<
        "revenue",
        TDecision["taxRule"],
        TDecision["treatment"],
        TDecision["defaultTaxRate"]
      >;
      readonly decision: TDecision;
      readonly evidence: GermanSaleResolutionEvidenceForDecision<TDecision>;
      readonly amounts: import("./pricing.js").TaxedPrice<TBasis>;
      readonly position: {
        readonly price: number;
        readonly quantity: number;
        readonly taxRate: number;
      };
      readonly showNet: TBasis extends "gross" ? false : true;
    }
  : never;

export type GermanSaleQuoteResult<
  TBasis extends import("./pricing.js").PriceBasis = import("./pricing.js").PriceBasis
> = GermanSaleQuoteForDecision<GermanSaleDecision, TBasis>;

export type TaxGuidanceQuery =
  | {
      readonly scope?: "all";
      readonly accountNumber?: never;
      readonly taxRuleCode?: never;
    }
  | {
      readonly scope: "revenue" | "expense";
      readonly accountNumber?: never;
      readonly taxRuleCode?: never;
    }
  | {
      readonly accountNumber: number;
      readonly scope?: never;
      readonly taxRuleCode?: never;
    }
  | {
      readonly taxRuleCode: string;
      readonly scope?: never;
      readonly accountNumber?: never;
    };

export type NormalizedGuidanceRate =
  | { readonly token: string; readonly percent: number; readonly known: true }
  | { readonly token: string; readonly percent?: never; readonly known: false };

export interface NormalizedTaxGuidanceRule {
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  readonly rates: readonly NormalizedGuidanceRate[];
}

export interface NormalizedTaxGuidance {
  readonly account: {
    readonly id: number;
    readonly number: string;
    readonly name?: string;
    readonly description?: string;
  };
  readonly rules: readonly NormalizedTaxGuidanceRule[];
  readonly receiptTypes: readonly string[];
}

export type ReceiptGuideWire = components["schemas"]["ReceiptGuideDto"];
export type TaxGuidanceResult = PaginatedSevdeskResult<
  ResultFor<operations["forAllAccounts"]>["json"],
  readonly NormalizedTaxGuidance[],
  undefined
>;

export type VoucherTaxCheckFailureReason =
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_AMBIGUOUS"
  | "RECEIPT_TYPE_NOT_ALLOWED"
  | "TAX_RULE_NOT_ALLOWED"
  | "TAX_RATE_UNRECOGNIZED"
  | "TAX_RATE_NOT_ALLOWED";

type VoucherTaxCheckAccount =
  | {
      readonly account: SevdeskReference<"AccountDatev"> & { readonly accountNumber?: never };
    }
  | {
      readonly account: {
        readonly accountNumber: string | number;
        readonly id?: never;
        readonly objectName?: never;
      };
    };

interface VoucherTaxCheckBase {
  readonly taxRate: number;
}

export type VoucherTaxCheckInput = VoucherTaxCheckAccount &
  VoucherTaxCheckBase &
  (
    | {
        readonly direction: "expense";
        readonly taxRule: ExpenseTaxRuleInput;
      }
    | {
        readonly direction: "revenue";
        readonly taxRule: VoucherRevenueTaxRuleInput;
      }
  );

interface VoucherTaxCheckResultBase {
  readonly requested: {
    readonly direction: "expense" | "revenue";
    readonly accountId?: number;
    readonly accountNumber?: string;
    readonly taxRule: number;
    readonly taxRate: number;
  };
}

export type VoucherTaxCheck =
  | (VoucherTaxCheckResultBase & {
      readonly compatible: true;
      readonly reasons: readonly [];
      readonly guidance: NormalizedTaxGuidance;
    })
  | (VoucherTaxCheckResultBase & {
      readonly compatible: false;
      readonly reasons: readonly [VoucherTaxCheckFailureReason, ...VoucherTaxCheckFailureReason[]];
      readonly guidance?: NormalizedTaxGuidance;
    });

export type VoucherTaxCheckResult = SevdeskResult<
  ResultFor<operations["forExpense"]>["json"],
  VoucherTaxCheck,
  undefined
>;

export interface TaxValidationIssue {
  readonly code:
    | "INVALID_TAX_CONFIGURATION"
    | "INVALID_RATE"
    | "RULE_NOT_ALLOWED_FOR_RESOURCE"
    | "RULE_NOT_ALLOWED_FOR_DIRECTION"
    | "PLAN_DIRECTION_MISMATCH"
    | "RATE_NOT_ALLOWED_FOR_RULE"
    | "MIXED_VOUCHER_AMOUNT_BASIS"
    | "LEGACY_CUSTOM_REQUIRES_TAX_SET"
    | "SMALL_BUSINESS_CONFLICT";
  readonly message: string;
  readonly path?: string;
}

export type TaxValidationResult =
  | { readonly valid: true; readonly issues: readonly [] }
  | { readonly valid: false; readonly issues: readonly TaxValidationIssue[] };
