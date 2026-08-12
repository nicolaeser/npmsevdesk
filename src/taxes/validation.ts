import { LegacyTaxType, resolveEnumValueStrict, TaxRule } from "../enums/domain-enums.js";
import { normalizeSevdeskId } from "../types/references.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { ExpenseTaxRule, SalesTaxRule, TaxRate, TaxTreatment } from "./constants.js";
import { SevdeskTaxConfigurationError } from "./errors.js";
import { assertManualTaxConfigurationShape, assertTaxRate, normalizeCountry } from "./presets.js";
import {
  MANUAL_TAX_CONFIGURATION_BRAND,
  RESOLVED_TAX_PLAN_BRAND,
  TAX_SELECTION_BRAND,
  type ResolvedTaxPlan,
  type TaxSelection,
  type TaxValidationIssue,
  type TaxValidationResult
} from "./types.js";

export type TaxResource = "invoice" | "order" | "credit-note" | "voucher";

export interface TaxDocumentValidationInput {
  readonly resource: TaxResource;
  readonly direction: "revenue" | "expense";
  readonly tax: Readonly<Record<string, unknown>>;
  readonly positionTaxRates: readonly number[];
  readonly voucherAmountBases?: readonly ("net" | "gross")[];
  readonly smallSettlement?: boolean | null;
}

const salesRules = new Set<number>(Object.values(SalesTaxRule));
const expenseRules = new Set<number>(Object.values(ExpenseTaxRule));
const voucherForbiddenRevenueRules = new Set<number>([
  TaxRule.OSS_GOODS,
  TaxRule.OSS_ELECTRONIC_SERVICE,
  TaxRule.OSS_OTHER_SERVICE,
  TaxRule.REVERSE_CHARGE_18B
]);
const flexibleGermanRateRules = new Set<number>([
  TaxRule.STANDARD_TAXABLE,
  TaxRule.INTRA_COMMUNITY_SUPPLY,
  TaxRule.INTRA_COMMUNITY_ACQUISITION,
  TaxRule.DEDUCTIBLE_INPUT_TAX
]);
const ossRules = new Set<number>([
  TaxRule.OSS_GOODS,
  TaxRule.OSS_ELECTRONIC_SERVICE,
  TaxRule.OSS_OTHER_SERVICE
]);
const knownRules = new Set<number>(Object.values(TaxRule));
const treatmentRules = new Map<string, { readonly direction: "revenue" | "expense"; rule: number }>(
  [
    [TaxTreatment.DOMESTIC_SALE, { direction: "revenue", rule: TaxRule.STANDARD_TAXABLE }],
    [TaxTreatment.EXPORT_GOODS, { direction: "revenue", rule: TaxRule.EXPORT }],
    [
      TaxTreatment.INTRA_COMMUNITY_SUPPLY,
      { direction: "revenue", rule: TaxRule.INTRA_COMMUNITY_SUPPLY }
    ],
    [
      TaxTreatment.VAT_EXEMPT_SECTION_4,
      { direction: "revenue", rule: TaxRule.VAT_EXEMPT_SECTION_4 }
    ],
    [
      TaxTreatment.REVERSE_CHARGE_13B_REVENUE,
      { direction: "revenue", rule: TaxRule.REVERSE_CHARGE_13B_REVENUE }
    ],
    [
      TaxTreatment.SMALL_BUSINESS_REVENUE,
      { direction: "revenue", rule: TaxRule.SMALL_BUSINESS_REVENUE }
    ],
    [
      TaxTreatment.NON_DOMESTIC_SERVICE,
      { direction: "revenue", rule: TaxRule.NON_DOMESTIC_SERVICE }
    ],
    [TaxTreatment.OSS_GOODS, { direction: "revenue", rule: TaxRule.OSS_GOODS }],
    [
      TaxTreatment.OSS_ELECTRONIC_SERVICE,
      { direction: "revenue", rule: TaxRule.OSS_ELECTRONIC_SERVICE }
    ],
    [TaxTreatment.OSS_OTHER_SERVICE, { direction: "revenue", rule: TaxRule.OSS_OTHER_SERVICE }],
    [
      TaxTreatment.EU_B2B_REVERSE_CHARGE,
      { direction: "revenue", rule: TaxRule.REVERSE_CHARGE_18B }
    ],
    [
      TaxTreatment.INTRA_COMMUNITY_ACQUISITION,
      { direction: "expense", rule: TaxRule.INTRA_COMMUNITY_ACQUISITION }
    ],
    [
      TaxTreatment.DEDUCTIBLE_INPUT_TAX,
      { direction: "expense", rule: TaxRule.DEDUCTIBLE_INPUT_TAX }
    ],
    [
      TaxTreatment.NON_DEDUCTIBLE_EXPENSE,
      { direction: "expense", rule: TaxRule.NON_DEDUCTIBLE_EXPENSE }
    ],
    [
      TaxTreatment.SMALL_BUSINESS_EXPENSE,
      { direction: "expense", rule: TaxRule.NON_DEDUCTIBLE_EXPENSE }
    ],
    [
      TaxTreatment.REVERSE_CHARGE_13B_2_WITH_INPUT,
      { direction: "expense", rule: TaxRule.REVERSE_CHARGE_13B_2_WITH_INPUT }
    ],
    [
      TaxTreatment.REVERSE_CHARGE_13B_WITHOUT_INPUT,
      { direction: "expense", rule: TaxRule.REVERSE_CHARGE_13B_WITHOUT_INPUT }
    ],
    [
      TaxTreatment.REVERSE_CHARGE_13B_1_EU,
      { direction: "expense", rule: TaxRule.REVERSE_CHARGE_13B_1_EU }
    ]
  ]
);
const legacyTaxTypesByTreatment = new Map<string, string>([
  [TaxTreatment.DOMESTIC_SALE, LegacyTaxType.DEFAULT],
  [TaxTreatment.INTRA_COMMUNITY_SUPPLY, LegacyTaxType.EU],
  [TaxTreatment.SMALL_BUSINESS_REVENUE, LegacyTaxType.SMALL_BUSINESS],
  [TaxTreatment.NON_DOMESTIC_SERVICE, LegacyTaxType.NON_EU],
  [TaxTreatment.DEDUCTIBLE_INPUT_TAX, LegacyTaxType.DEFAULT],
  [TaxTreatment.SMALL_BUSINESS_EXPENSE, LegacyTaxType.SMALL_BUSINESS]
]);

export function isResolvedTaxPlan(value: unknown): value is ResolvedTaxPlan {
  if (!hasResolvedPlanBrand(value)) return false;
  try {
    assertResolvedTaxPlanShape(value);
    return true;
  } catch {
    return false;
  }
}

export function isManualTaxConfiguration(value: unknown): boolean {
  return hasImmutableBrand(value, MANUAL_TAX_CONFIGURATION_BRAND);
}

export function assertCuratedTaxInput(value: unknown): void {
  if (hasResolvedPlanBrand(value)) {
    assertResolvedTaxPlanShape(value);
    return;
  }
  if (isManualTaxConfiguration(value)) {
    assertManualTaxConfigurationShape(value);
    return;
  }
  throw new SevdeskConfigurationError(
    "Curated document tax must come from client.taxes.resolve() or taxes.manual.*()."
  );
}

export function assertCanonicalTaxSelection(selection: TaxSelection): void {
  if (!hasImmutableBrand(selection, TAX_SELECTION_BRAND)) {
    throw new SevdeskConfigurationError(
      "Tax selection must come unchanged from a taxes semantic preset."
    );
  }
  const canonical = treatmentRules.get(selection.treatment);
  if (
    canonical === undefined ||
    canonical.direction !== selection.direction ||
    canonical.rule !== selection.taxRule
  ) {
    throw new SevdeskConfigurationError(
      "Tax selection treatment, direction and sevdesk rule are inconsistent. Create it with a taxes preset."
    );
  }
  if (!rateAllowedForRule(selection.taxRule, selection.defaultTaxRate)) {
    throw new SevdeskConfigurationError(
      `Tax selection ${selection.treatment} does not allow rate ${selection.defaultTaxRate}.`
    );
  }
  const expectedLegacyTaxType = legacyTaxTypesByTreatment.get(selection.treatment);
  if (selection.legacyTaxType !== expectedLegacyTaxType) {
    throw new SevdeskConfigurationError(
      `Tax selection ${selection.treatment} has an inconsistent legacy tax type.`
    );
  }
  assertDestinationFields(selection, canonical.rule);
  if (
    selection.evidence !== undefined &&
    (selection.evidence === null ||
      typeof selection.evidence !== "object" ||
      Array.isArray(selection.evidence) ||
      !Object.isFrozen(selection.evidence))
  ) {
    throw new SevdeskConfigurationError("Tax selection evidence must be an object.");
  }
}

export function isSmallBusinessTax(tax: Readonly<Record<string, unknown>>): boolean {
  if (
    isResolvedTaxPlan(tax) &&
    (tax.treatment === TaxTreatment.SMALL_BUSINESS_REVENUE ||
      tax.treatment === TaxTreatment.SMALL_BUSINESS_EXPENSE)
  ) {
    return true;
  }
  if (tax.bookkeepingSystem === "2.0") {
    return resolveTaxRuleCode(tax) === TaxRule.SMALL_BUSINESS_REVENUE;
  }
  if (tax.bookkeepingSystem === "1.0") {
    try {
      return (
        resolveEnumValueStrict(LegacyTaxType, tax.taxType as never) === LegacyTaxType.SMALL_BUSINESS
      );
    } catch (cause) {
      throw new SevdeskConfigurationError("Unknown legacy taxType.", { cause });
    }
  }
  return false;
}

export function resolveTaxRuleCode(tax: Readonly<Record<string, unknown>>): number | undefined {
  if (tax.bookkeepingSystem !== "2.0") return undefined;
  let value: string | number;
  try {
    value = resolveEnumValueStrict(TaxRule, tax.taxRule as never);
  } catch (cause) {
    throw new SevdeskConfigurationError(`Unknown tax rule "${String(tax.taxRule)}".`, { cause });
  }
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(numeric) || numeric <= 0) {
    throw new SevdeskConfigurationError(`Unknown tax rule "${String(tax.taxRule)}".`);
  }
  return numeric;
}

export function taxRateForPosition(
  tax: Readonly<Record<string, unknown>>,
  taxRate: number | undefined,
  positionIndex: number
): number {
  const inherited = isResolvedTaxPlan(tax) ? tax.defaultTaxRate : undefined;
  const resolved = taxRate ?? inherited;
  if (resolved === undefined) {
    throw new SevdeskConfigurationError(
      `positions[${positionIndex}].taxRate is required unless tax is a resolved tax plan.`
    );
  }
  assertTaxRate(resolved, `positions[${positionIndex}].taxRate`);
  return resolved;
}

export function validateTaxDocument(input: TaxDocumentValidationInput): TaxValidationResult {
  const issues: TaxValidationIssue[] = [];
  let taxRule: number | undefined;
  let taxConfigurationValid = true;
  try {
    if (input.tax.bookkeepingSystem === "2.0") {
      if ("taxType" in input.tax || "taxSet" in input.tax) {
        throw new SevdeskConfigurationError(
          "A 2.0 tax configuration must not contain legacy taxType or taxSet fields."
        );
      }
      taxRule = resolveTaxRuleCode(input.tax);
    } else if (input.tax.bookkeepingSystem === "1.0") {
      if ("taxRule" in input.tax) {
        throw new SevdeskConfigurationError("A 1.0 tax configuration must not contain taxRule.");
      }
      validateLegacyCustom(input.tax, issues);
    } else {
      throw new SevdeskConfigurationError('bookkeepingSystem must be exactly "1.0" or "2.0".');
    }
  } catch (error) {
    taxConfigurationValid = false;
    issues.push({
      code: "INVALID_TAX_CONFIGURATION",
      path: "tax",
      message:
        error instanceof Error ? error.message : "The tax configuration is not structurally valid."
    });
  }
  if (isResolvedTaxPlan(input.tax) && input.tax.direction !== input.direction) {
    issues.push({
      code: "PLAN_DIRECTION_MISMATCH",
      path: "tax.direction",
      message: `A ${input.tax.direction} tax plan cannot be used for a ${input.direction} document.`
    });
  }
  for (const [index, rate] of input.positionTaxRates.entries()) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      issues.push({
        code: "INVALID_RATE",
        path: `positions[${index}].taxRate`,
        message: `Position ${index + 1} has an invalid tax rate; expected 0 through 100.`
      });
      continue;
    }
    if (taxRule !== undefined && !rateAllowedForRule(taxRule, rate)) {
      issues.push({
        code: "RATE_NOT_ALLOWED_FOR_RULE",
        path: `positions[${index}].taxRate`,
        message: `Tax rule ${taxRule} does not allow the position tax rate ${rate}.`
      });
    }
  }
  if (taxRule !== undefined && knownRules.has(taxRule)) {
    const expectedRules = input.direction === "revenue" ? salesRules : expenseRules;
    if (!expectedRules.has(taxRule)) {
      issues.push({
        code: "RULE_NOT_ALLOWED_FOR_DIRECTION",
        path: "tax.taxRule",
        message: `Tax rule ${taxRule} is not a ${input.direction} rule.`
      });
    }
    if (
      input.resource === "voucher" &&
      input.direction === "revenue" &&
      voucherForbiddenRevenueRules.has(taxRule)
    ) {
      issues.push({
        code: "RULE_NOT_ALLOWED_FOR_RESOURCE",
        path: "tax.taxRule",
        message: `Tax rule ${taxRule} is not supported for vouchers.`
      });
    }
  }
  if (input.voucherAmountBases !== undefined && new Set(input.voucherAmountBases).size > 1) {
    issues.push({
      code: "MIXED_VOUCHER_AMOUNT_BASIS",
      path: "positions",
      message: "All voucher positions must use the same net or gross amount basis."
    });
  }
  let smallBusinessTax = false;
  if (taxConfigurationValid) {
    try {
      smallBusinessTax = isSmallBusinessTax(input.tax);
    } catch (error) {
      issues.push({
        code: "INVALID_TAX_CONFIGURATION",
        path: "tax",
        message:
          error instanceof Error
            ? error.message
            : "The tax configuration is not structurally valid."
      });
    }
  }
  if (
    input.smallSettlement !== undefined &&
    input.smallSettlement !== null &&
    (input.smallSettlement !== smallBusinessTax ||
      (input.smallSettlement && input.positionTaxRates.some((rate) => rate !== TaxRate.ZERO)))
  ) {
    issues.push({
      code: "SMALL_BUSINESS_CONFLICT",
      path: "smallSettlement",
      message:
        "smallSettlement must match tax rule 11 or legacy tax type ss; small-business positions require zero rate."
    });
  }
  return issues.length === 0
    ? { valid: true, issues: [] }
    : { valid: false, issues: Object.freeze(issues) };
}

export function assertTaxDocument(input: TaxDocumentValidationInput): void {
  const result = validateTaxDocument(input);
  if (!result.valid) {
    throw new SevdeskTaxConfigurationError(result.issues);
  }
}

export function rateAllowedForRule(taxRule: number, rate: number): boolean {
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return false;
  if (!knownRules.has(taxRule)) return true;
  if (ossRules.has(taxRule)) return true;
  if (flexibleGermanRateRules.has(taxRule)) {
    return [TaxRate.ZERO, TaxRate.REDUCED_7, TaxRate.STANDARD_19].includes(rate as 0 | 7 | 19);
  }
  return rate === TaxRate.ZERO;
}

function validateLegacyCustom(
  tax: Readonly<Record<string, unknown>>,
  issues: TaxValidationIssue[]
): void {
  if (tax.bookkeepingSystem !== "1.0") return;
  let taxType: string | number;
  try {
    taxType = resolveEnumValueStrict(LegacyTaxType, tax.taxType as never);
  } catch (cause) {
    throw new SevdeskConfigurationError("Unknown legacy taxType.", { cause });
  }
  const requiresTaxSet =
    taxType === LegacyTaxType.CUSTOM || !Object.values(LegacyTaxType).includes(taxType as never);
  if (requiresTaxSet) {
    if (tax.taxSet === undefined) {
      issues.push({
        code: "LEGACY_CUSTOM_REQUIRES_TAX_SET",
        path: "tax.taxSet",
        message: "Legacy custom or forward-compatible tax type requires a TaxSet reference."
      });
      return;
    }
    const reference = tax.taxSet;
    if (
      reference === null ||
      typeof reference !== "object" ||
      Array.isArray(reference) ||
      !("id" in reference) ||
      !("objectName" in reference) ||
      reference.objectName !== "TaxSet"
    ) {
      throw new SevdeskConfigurationError("Legacy taxSet must be a TaxSet reference.");
    }
    normalizeSevdeskId(reference.id as string | number, "TaxSet");
  } else if ("taxSet" in tax) {
    throw new SevdeskConfigurationError(
      "A known non-custom legacy tax configuration must not contain taxSet."
    );
  }
}

function hasResolvedPlanBrand(value: unknown): value is Readonly<Record<PropertyKey, unknown>> & {
  readonly [RESOLVED_TAX_PLAN_BRAND]: true;
} {
  return hasImmutableBrand(value, RESOLVED_TAX_PLAN_BRAND);
}

function hasImmutableBrand(
  value: unknown,
  brand: symbol
): value is Readonly<Record<PropertyKey, unknown>> {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const descriptor = Object.getOwnPropertyDescriptor(value, brand);
  return (
    descriptor?.value === true &&
    descriptor.enumerable === false &&
    descriptor.configurable === false &&
    descriptor.writable === false
  );
}

function assertResolvedTaxPlanShape(value: unknown): asserts value is ResolvedTaxPlan {
  if (!hasResolvedPlanBrand(value) || value.kind !== "resolved-tax-plan") {
    throw new SevdeskConfigurationError(
      "Resolved tax plan must come unchanged from client.taxes.resolve()."
    );
  }
  if (value.direction !== "revenue" && value.direction !== "expense") {
    throw new SevdeskConfigurationError("Resolved tax plan has an invalid direction.");
  }
  if (typeof value.treatment !== "string") {
    throw new SevdeskConfigurationError("Resolved tax plan has an invalid treatment.");
  }
  const canonical = treatmentRules.get(value.treatment);
  if (canonical === undefined || canonical.direction !== value.direction) {
    throw new SevdeskConfigurationError(
      "Resolved tax plan treatment and direction are inconsistent."
    );
  }
  if (typeof value.defaultTaxRate !== "number") {
    throw new SevdeskConfigurationError("Resolved tax plan has no numeric defaultTaxRate.");
  }
  assertTaxRate(value.defaultTaxRate, "resolved defaultTaxRate");
  if (!rateAllowedForRule(canonical.rule, value.defaultTaxRate)) {
    throw new SevdeskConfigurationError(
      `Resolved tax plan ${value.treatment} does not allow rate ${value.defaultTaxRate}.`
    );
  }
  assertDestinationFields(
    value as typeof value & {
      readonly destinationCountry?: unknown;
      readonly deliveryAddressCountry?: unknown;
    },
    canonical.rule
  );
  if (
    value.evidence !== undefined &&
    (value.evidence === null ||
      typeof value.evidence !== "object" ||
      Array.isArray(value.evidence) ||
      !Object.isFrozen(value.evidence))
  ) {
    throw new SevdeskConfigurationError("Resolved tax plan evidence must be an object.");
  }
  if (value.bookkeepingSystem === "2.0") {
    if ("taxType" in value || "taxSet" in value) {
      throw new SevdeskConfigurationError(
        "A resolved 2.0 tax plan must not contain legacy taxType or taxSet fields."
      );
    }
    const rule = resolveTaxRuleCode(value);
    if (rule !== canonical.rule) {
      throw new SevdeskConfigurationError(
        "Resolved tax plan treatment and taxRule are inconsistent."
      );
    }
    return;
  }
  if (value.bookkeepingSystem === "1.0") {
    if ("taxRule" in value || "taxSet" in value) {
      throw new SevdeskConfigurationError(
        "A resolved 1.0 tax plan must not contain taxRule or taxSet fields."
      );
    }
    const expectedTaxType = legacyTaxTypesByTreatment.get(value.treatment);
    if (expectedTaxType === undefined) {
      throw new SevdeskConfigurationError(
        `Resolved tax treatment ${value.treatment} has no documented 1.0 representation.`
      );
    }
    const taxType = resolveEnumValueStrict(LegacyTaxType, value.taxType as never);
    if (taxType !== expectedTaxType) {
      throw new SevdeskConfigurationError(
        "Resolved tax plan treatment and legacy taxType are inconsistent."
      );
    }
    return;
  }
  throw new SevdeskConfigurationError(
    'Resolved tax plan bookkeepingSystem must be exactly "1.0" or "2.0".'
  );
}

function assertDestinationFields(
  value: {
    readonly destinationCountry?: unknown;
    readonly deliveryAddressCountry?: unknown;
  },
  taxRule: number
): void {
  const isOss = ossRules.has(taxRule);
  if (!isOss) {
    if (value.destinationCountry !== undefined || value.deliveryAddressCountry !== undefined) {
      throw new SevdeskConfigurationError(
        "Only an OSS tax selection may carry a destination country."
      );
    }
    return;
  }
  if (typeof value.destinationCountry !== "string") {
    throw new SevdeskConfigurationError("An OSS tax selection requires destinationCountry.");
  }
  normalizeCountry(value.destinationCountry);
  const reference = value.deliveryAddressCountry;
  if (
    reference === null ||
    typeof reference !== "object" ||
    Array.isArray(reference) ||
    !("id" in reference) ||
    !("objectName" in reference) ||
    reference.objectName !== "StaticCountry" ||
    !Object.isFrozen(reference)
  ) {
    throw new SevdeskConfigurationError(
      "An OSS tax selection requires a StaticCountry deliveryAddressCountry reference."
    );
  }
  normalizeSevdeskId(reference.id as string | number, "OSS destination country");
}
