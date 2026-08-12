import { LegacyTaxType, resolveEnumValueStrict, TaxRule } from "../enums/domain-enums.js";
import { normalizeSevdeskId } from "../types/references.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { ExpenseTaxRule, SalesTaxRule, TaxRate, TaxTreatment } from "./constants.js";
import { taxesRates } from "./rates/index.js";
import { SaleProduct, SaleTemplate } from "./sale/templates.js";
import {
  MANUAL_TAX_CONFIGURATION_BRAND,
  TAX_SELECTION_BRAND,
  type ExpenseTaxConfiguration,
  type ManualExpenseTaxConfiguration,
  type ManualSalesTaxConfiguration,
  type ManualVoucherRevenueTaxConfiguration,
  type SalesTaxConfiguration,
  type TaxDestinationCountry,
  type TaxSelection,
  type VoucherRevenueTaxConfiguration
} from "./types.js";
import { isValidVatIdFormat, normalizeVatId, parseVatId, validateVatIdFormat } from "./vat-id.js";
import { calculateTaxedPrice, toInvoicePositionPrice } from "./pricing.js";

export interface RatedTaxPresetInput {
  readonly rate: number;
  readonly evidence?: Readonly<Record<string, unknown>>;
}

export interface DestinationTaxPresetInput extends RatedTaxPresetInput {
  readonly destinationCountry: TaxDestinationCountry;
}

export interface EvidenceTaxPresetInput {
  readonly evidence?: Readonly<Record<string, unknown>>;
}

function revenueSelection<
  TTreatment extends TaxSelection<"revenue">["treatment"],
  TTaxRule extends TaxSelection<"revenue">["taxRule"],
  const TDefaultTaxRate extends number
>(
  treatment: TTreatment,
  taxRule: TTaxRule,
  defaultTaxRate: TDefaultTaxRate,
  options: {
    readonly legacyTaxType?: TaxSelection<"revenue">["legacyTaxType"] | undefined;
    readonly destinationCountry?: string | undefined;
    readonly deliveryAddressCountry?: TaxSelection<"revenue">["deliveryAddressCountry"];
    readonly evidence?: Readonly<Record<string, unknown>> | undefined;
  } = {}
): TaxSelection<"revenue", TTaxRule, TTreatment, TDefaultTaxRate> {
  assertTaxRate(defaultTaxRate, "tax rate");
  const selection = {
    kind: "tax-selection" as const,
    direction: "revenue" as const,
    treatment,
    taxRule,
    defaultTaxRate,
    ...(options.legacyTaxType === undefined ? {} : { legacyTaxType: options.legacyTaxType }),
    ...(options.destinationCountry === undefined
      ? {}
      : { destinationCountry: normalizeCountry(options.destinationCountry) }),
    ...(options.deliveryAddressCountry === undefined
      ? {}
      : { deliveryAddressCountry: options.deliveryAddressCountry }),
    ...(options.evidence === undefined ? {} : { evidence: Object.freeze({ ...options.evidence }) })
  };
  defineBrand(selection, TAX_SELECTION_BRAND);
  return Object.freeze(selection) as TaxSelection<"revenue", TTaxRule, TTreatment, TDefaultTaxRate>;
}

function expenseSelection<
  TTreatment extends TaxSelection<"expense">["treatment"],
  TTaxRule extends TaxSelection<"expense">["taxRule"],
  const TDefaultTaxRate extends number
>(
  treatment: TTreatment,
  taxRule: TTaxRule,
  defaultTaxRate: TDefaultTaxRate,
  options: {
    readonly legacyTaxType?: TaxSelection<"expense">["legacyTaxType"] | undefined;
    readonly evidence?: Readonly<Record<string, unknown>> | undefined;
  } = {}
): TaxSelection<"expense", TTaxRule, TTreatment, TDefaultTaxRate> {
  assertTaxRate(defaultTaxRate, "tax rate");
  const selection = {
    kind: "tax-selection" as const,
    direction: "expense" as const,
    treatment,
    taxRule,
    defaultTaxRate,
    ...(options.legacyTaxType === undefined ? {} : { legacyTaxType: options.legacyTaxType }),
    ...(options.evidence === undefined ? {} : { evidence: Object.freeze({ ...options.evidence }) })
  };
  defineBrand(selection, TAX_SELECTION_BRAND);
  return Object.freeze(selection) as TaxSelection<"expense", TTaxRule, TTreatment, TDefaultTaxRate>;
}

export const taxes = Object.freeze({
  rates: taxesRates,
  templates: SaleTemplate,
  products: SaleProduct,
  vatId: Object.freeze({
    normalize: normalizeVatId,
    parse: parseVatId,
    validateFormat: validateVatIdFormat,
    isValidFormat: isValidVatIdFormat
  }),
  pricing: Object.freeze({
    calculate: calculateTaxedPrice,
    toPosition: toInvoicePositionPrice
  }),
  revenue: Object.freeze({
    domestic<const TInput extends RatedTaxPresetInput>(input: TInput) {
      assertGermanRate(input.rate, TaxRule.STANDARD_TAXABLE);
      return revenueSelection(
        TaxTreatment.DOMESTIC_SALE,
        SalesTaxRule.STANDARD_TAXABLE,
        input.rate as TInput["rate"],
        { legacyTaxType: LegacyTaxType.DEFAULT, evidence: input.evidence }
      );
    },
    exportGoods(input: EvidenceTaxPresetInput = {}) {
      return revenueSelection(TaxTreatment.EXPORT_GOODS, SalesTaxRule.EXPORT, TaxRate.ZERO, input);
    },
    intraCommunitySupply<
      const TInput extends Partial<RatedTaxPresetInput> = Readonly<Record<never, never>>
    >(input: TInput = {} as TInput) {
      const rate = (input.rate ?? TaxRate.ZERO) as TInput extends {
        readonly rate: infer TRate extends number;
      }
        ? TRate
        : typeof TaxRate.ZERO;
      assertGermanRate(rate, TaxRule.INTRA_COMMUNITY_SUPPLY);
      return revenueSelection(
        TaxTreatment.INTRA_COMMUNITY_SUPPLY,
        SalesTaxRule.INTRA_COMMUNITY_SUPPLY,
        rate,
        { legacyTaxType: LegacyTaxType.EU, evidence: input.evidence }
      );
    },
    vatExemptSection4(input: EvidenceTaxPresetInput = {}) {
      return revenueSelection(
        TaxTreatment.VAT_EXEMPT_SECTION_4,
        SalesTaxRule.VAT_EXEMPT_SECTION_4,
        TaxRate.ZERO,
        input
      );
    },
    reverseCharge13b(input: EvidenceTaxPresetInput = {}) {
      return revenueSelection(
        TaxTreatment.REVERSE_CHARGE_13B_REVENUE,
        SalesTaxRule.REVERSE_CHARGE_13B_REVENUE,
        TaxRate.ZERO,
        input
      );
    },
    smallBusiness(input: EvidenceTaxPresetInput = {}) {
      return revenueSelection(
        TaxTreatment.SMALL_BUSINESS_REVENUE,
        SalesTaxRule.SMALL_BUSINESS_REVENUE,
        TaxRate.ZERO,
        { legacyTaxType: LegacyTaxType.SMALL_BUSINESS, evidence: input.evidence }
      );
    },
    nonDomesticService(input: EvidenceTaxPresetInput = {}) {
      return revenueSelection(
        TaxTreatment.NON_DOMESTIC_SERVICE,
        SalesTaxRule.NON_DOMESTIC_SERVICE,
        TaxRate.ZERO,
        { legacyTaxType: LegacyTaxType.NON_EU, evidence: input.evidence }
      );
    },
    ossGoods<const TInput extends DestinationTaxPresetInput>(input: TInput) {
      return revenueSelection(
        TaxTreatment.OSS_GOODS,
        SalesTaxRule.OSS_GOODS,
        input.rate as TInput["rate"],
        destinationOptions(input)
      );
    },
    ossElectronicService<const TInput extends DestinationTaxPresetInput>(input: TInput) {
      return revenueSelection(
        TaxTreatment.OSS_ELECTRONIC_SERVICE,
        SalesTaxRule.OSS_ELECTRONIC_SERVICE,
        input.rate as TInput["rate"],
        destinationOptions(input)
      );
    },
    ossOtherService<const TInput extends DestinationTaxPresetInput>(input: TInput) {
      return revenueSelection(
        TaxTreatment.OSS_OTHER_SERVICE,
        SalesTaxRule.OSS_OTHER_SERVICE,
        input.rate as TInput["rate"],
        destinationOptions(input)
      );
    },
    euB2bService(input: EvidenceTaxPresetInput = {}) {
      return revenueSelection(
        TaxTreatment.EU_B2B_REVERSE_CHARGE,
        SalesTaxRule.REVERSE_CHARGE_18B,
        TaxRate.ZERO,
        input
      );
    }
  }),
  expense: Object.freeze({
    intraCommunityAcquisition<const TInput extends RatedTaxPresetInput>(input: TInput) {
      assertGermanRate(input.rate, TaxRule.INTRA_COMMUNITY_ACQUISITION);
      return expenseSelection(
        TaxTreatment.INTRA_COMMUNITY_ACQUISITION,
        ExpenseTaxRule.INTRA_COMMUNITY_ACQUISITION,
        input.rate as TInput["rate"],
        input
      );
    },
    deductible<const TInput extends RatedTaxPresetInput>(input: TInput) {
      assertGermanRate(input.rate, TaxRule.DEDUCTIBLE_INPUT_TAX);
      return expenseSelection(
        TaxTreatment.DEDUCTIBLE_INPUT_TAX,
        ExpenseTaxRule.DEDUCTIBLE_INPUT_TAX,
        input.rate as TInput["rate"],
        { legacyTaxType: LegacyTaxType.DEFAULT, evidence: input.evidence }
      );
    },
    nonDeductible(input: EvidenceTaxPresetInput = {}) {
      return expenseSelection(
        TaxTreatment.NON_DEDUCTIBLE_EXPENSE,
        ExpenseTaxRule.NON_DEDUCTIBLE_EXPENSE,
        TaxRate.ZERO,
        input
      );
    },
    smallBusiness(input: EvidenceTaxPresetInput = {}) {
      return expenseSelection(
        TaxTreatment.SMALL_BUSINESS_EXPENSE,
        ExpenseTaxRule.NON_DEDUCTIBLE_EXPENSE,
        TaxRate.ZERO,
        { legacyTaxType: LegacyTaxType.SMALL_BUSINESS, evidence: input.evidence }
      );
    },
    reverseCharge13bWithInput(input: EvidenceTaxPresetInput = {}) {
      return expenseSelection(
        TaxTreatment.REVERSE_CHARGE_13B_2_WITH_INPUT,
        ExpenseTaxRule.REVERSE_CHARGE_13B_2_WITH_INPUT,
        TaxRate.ZERO,
        input
      );
    },
    reverseCharge13bWithoutInput(input: EvidenceTaxPresetInput = {}) {
      return expenseSelection(
        TaxTreatment.REVERSE_CHARGE_13B_WITHOUT_INPUT,
        ExpenseTaxRule.REVERSE_CHARGE_13B_WITHOUT_INPUT,
        TaxRate.ZERO,
        input
      );
    },
    reverseChargeEu(input: EvidenceTaxPresetInput = {}) {
      return expenseSelection(
        TaxTreatment.REVERSE_CHARGE_13B_1_EU,
        ExpenseTaxRule.REVERSE_CHARGE_13B_1_EU,
        TaxRate.ZERO,
        input
      );
    }
  }),
  manual: Object.freeze({
    sales<const TConfiguration extends SalesTaxConfiguration>(
      input: TConfiguration
    ): ManualSalesTaxConfiguration<TConfiguration> {
      assertManualTaxConfigurationShape(input, "sales");
      return manualConfiguration(input);
    },
    expense<const TConfiguration extends ExpenseTaxConfiguration>(
      input: TConfiguration
    ): ManualExpenseTaxConfiguration<TConfiguration> {
      assertManualTaxConfigurationShape(input, "expense");
      return manualConfiguration(input);
    },
    voucherRevenue<const TConfiguration extends VoucherRevenueTaxConfiguration>(
      input: TConfiguration
    ): ManualVoucherRevenueTaxConfiguration<TConfiguration> {
      assertManualTaxConfigurationShape(input, "voucher-revenue");
      return manualConfiguration(input);
    }
  })
});

function destinationOptions(input: DestinationTaxPresetInput) {
  if (input.destinationCountry.objectName !== "StaticCountry") {
    throw new SevdeskConfigurationError(
      "OSS destinationCountry must be a StaticCountry returned by client.lookup.country()."
    );
  }
  const code = normalizeCountry(input.destinationCountry.code);
  const id = normalizeSevdeskId(input.destinationCountry.id, "OSS destination country");
  return {
    destinationCountry: code,
    deliveryAddressCountry: Object.freeze({ id, objectName: "StaticCountry" as const }),
    evidence: input.evidence
  };
}

function manualConfiguration<TConfiguration extends object>(
  input: TConfiguration
): TConfiguration & { readonly [MANUAL_TAX_CONFIGURATION_BRAND]: true } {
  if (input === null || Array.isArray(input)) {
    throw new SevdeskConfigurationError("Manual tax configuration must be an object.");
  }
  const taxSet = "taxSet" in input ? input.taxSet : undefined;
  const configuration = {
    ...input,
    ...(taxSet === undefined || taxSet === null || typeof taxSet !== "object"
      ? {}
      : { taxSet: Object.freeze({ ...taxSet }) })
  };
  defineBrand(configuration, MANUAL_TAX_CONFIGURATION_BRAND);
  return Object.freeze(configuration) as TConfiguration & {
    readonly [MANUAL_TAX_CONFIGURATION_BRAND]: true;
  };
}

type ManualTaxConfigurationKind = "sales" | "expense" | "voucher-revenue";

const salesTaxRules = new Set<number>(Object.values(SalesTaxRule));
const expenseTaxRules = new Set<number>(Object.values(ExpenseTaxRule));
const voucherRevenueTaxRules = new Set<number>([
  TaxRule.STANDARD_TAXABLE,
  TaxRule.EXPORT,
  TaxRule.INTRA_COMMUNITY_SUPPLY,
  TaxRule.VAT_EXEMPT_SECTION_4,
  TaxRule.REVERSE_CHARGE_13B_REVENUE,
  TaxRule.SMALL_BUSINESS_REVENUE,
  TaxRule.NON_DOMESTIC_SERVICE
]);

export function assertManualTaxConfigurationShape(
  input: unknown,
  kind?: ManualTaxConfigurationKind
): asserts input is SalesTaxConfiguration | ExpenseTaxConfiguration {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new SevdeskConfigurationError("Manual tax configuration must be an object.");
  }
  const configuration = input as Readonly<Record<string, unknown>>;
  if (configuration.bookkeepingSystem === "2.0") {
    assertNoField(configuration, "taxType", "A 2.0 manual tax configuration");
    assertNoField(configuration, "taxSet", "A 2.0 manual tax configuration");
    if (!("taxRule" in configuration) || configuration.taxRule === undefined) {
      throw new SevdeskConfigurationError(
        "A 2.0 manual tax configuration requires an explicit taxRule."
      );
    }
    const resolvedRule = resolveManualEnumValue(TaxRule, configuration.taxRule, "taxRule");
    if (!Number.isSafeInteger(resolvedRule) || Number(resolvedRule) <= 0) {
      throw new SevdeskConfigurationError("Manual taxRule must resolve to a positive integer.");
    }
    const rule = Number(resolvedRule);
    const knownRule = Object.values(TaxRule).includes(rule as never);
    const allowedRules =
      kind === "sales"
        ? salesTaxRules
        : kind === "expense"
          ? expenseTaxRules
          : kind === "voucher-revenue"
            ? voucherRevenueTaxRules
            : undefined;
    if (knownRule && allowedRules !== undefined && !allowedRules.has(rule)) {
      throw new SevdeskConfigurationError(
        `Tax rule ${rule} is not allowed for a manual ${kind} configuration.`
      );
    }
    return;
  }
  if (configuration.bookkeepingSystem === "1.0") {
    assertNoField(configuration, "taxRule", "A 1.0 manual tax configuration");
    if (!("taxType" in configuration) || configuration.taxType === undefined) {
      throw new SevdeskConfigurationError(
        "A 1.0 manual tax configuration requires an explicit taxType."
      );
    }
    const taxType = resolveManualEnumValue(LegacyTaxType, configuration.taxType, "taxType");
    if (typeof taxType !== "string" || !taxType.trim()) {
      throw new SevdeskConfigurationError("Manual legacy taxType must resolve to a string.");
    }
    const customOrUnknown =
      taxType === LegacyTaxType.CUSTOM || !Object.values(LegacyTaxType).includes(taxType as never);
    if (customOrUnknown) {
      assertTaxSetReference(configuration.taxSet);
    } else {
      assertNoField(configuration, "taxSet", "A known non-custom legacy tax configuration");
    }
    return;
  }
  throw new SevdeskConfigurationError(
    'Manual tax configuration bookkeepingSystem must be exactly "1.0" or "2.0".'
  );
}

function resolveManualEnumValue(
  values: typeof TaxRule | typeof LegacyTaxType,
  input: unknown,
  label: string
): string | number {
  try {
    return resolveEnumValueStrict(values as never, input as never);
  } catch (cause) {
    throw new SevdeskConfigurationError(`Manual ${label} is not a recognized semantic value.`, {
      cause
    });
  }
}

function assertNoField(
  input: Readonly<Record<string, unknown>>,
  field: string,
  label: string
): void {
  if (field in input) {
    throw new SevdeskConfigurationError(`${label} must not contain ${field}.`);
  }
}

function assertTaxSetReference(value: unknown): void {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !("id" in value) ||
    !("objectName" in value) ||
    value.objectName !== "TaxSet"
  ) {
    throw new SevdeskConfigurationError(
      "A custom or forward-compatible legacy taxType requires an explicit TaxSet reference."
    );
  }
  normalizeSevdeskId(value.id as string | number, "TaxSet");
}

function defineBrand(target: object, brand: symbol): void {
  Object.defineProperty(target, brand, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false
  });
}

export function assertTaxRate(rate: number, label = "tax rate"): void {
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new SevdeskConfigurationError(`${label} must be a finite percentage from 0 through 100.`);
  }
}

export function assertGermanRate(rate: number, taxRule: number): void {
  assertTaxRate(rate);
  if (![TaxRate.ZERO, TaxRate.REDUCED_7, TaxRate.STANDARD_19].includes(rate as 0 | 7 | 19)) {
    throw new SevdeskConfigurationError(
      `Tax rule ${taxRule} accepts only the documented rates 0, 7 or 19.`
    );
  }
}

export function normalizeCountry(country: string): string {
  const normalized = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new SevdeskConfigurationError("A country must be an ISO 3166-1 alpha-2 code.");
  }
  return normalized === "EL" ? "GR" : normalized;
}
