import { LegacyTaxType, resolveEnumValueStrict } from "../enums/domain-enums.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { BookkeepingSystem } from "./constants.js";
import type {
  BookkeepingSystemValue,
  ResolvedTaxPlanFor,
  TaxRuleForDirection,
  TaxSelection,
  TaxTreatmentValue
} from "./types.js";
import { RESOLVED_TAX_PLAN_BRAND, TAX_SELECTION_BRAND } from "./types.js";
import { assertCanonicalTaxSelection, assertTaxDocument } from "./validation.js";

export function resolveTaxSelection<
  TDirection extends "revenue" | "expense",
  TTaxRule extends TaxRuleForDirection<TDirection>,
  TTreatment extends TaxTreatmentValue,
  TDefaultTaxRate extends number,
  TVersion extends BookkeepingSystemValue
>(
  selection: TaxSelection<TDirection, TTaxRule, TTreatment, TDefaultTaxRate>,
  bookkeepingSystem: TVersion
): ResolvedTaxPlanFor<TDirection, TVersion, TTaxRule, TTreatment, TDefaultTaxRate> {
  if (
    selection === null ||
    typeof selection !== "object" ||
    selection.kind !== "tax-selection" ||
    selection[TAX_SELECTION_BRAND] !== true
  ) {
    throw new SevdeskConfigurationError("Expected a tax selection created by the taxes presets.");
  }
  assertCanonicalTaxSelection(selection);
  assertTaxDocument({
    resource: selection.direction === "revenue" ? "invoice" : "voucher",
    direction: selection.direction,
    tax: { bookkeepingSystem: "2.0", taxRule: selection.taxRule },
    positionTaxRates: [selection.defaultTaxRate]
  });
  if (bookkeepingSystem === BookkeepingSystem.CURRENT) {
    const plan = {
      kind: "resolved-tax-plan" as const,
      direction: selection.direction,
      treatment: selection.treatment,
      bookkeepingSystem,
      taxRule: selection.taxRule,
      defaultTaxRate: selection.defaultTaxRate,
      ...(selection.destinationCountry === undefined
        ? {}
        : { destinationCountry: selection.destinationCountry }),
      ...(selection.deliveryAddressCountry === undefined
        ? {}
        : { deliveryAddressCountry: selection.deliveryAddressCountry }),
      ...(selection.evidence === undefined ? {} : { evidence: selection.evidence })
    };
    brandResolvedPlan(plan);
    return Object.freeze(plan) as ResolvedTaxPlanFor<
      TDirection,
      TVersion,
      TTaxRule,
      TTreatment,
      TDefaultTaxRate
    >;
  }
  if (selection.legacyTaxType === undefined) {
    throw new SevdeskConfigurationError(
      `${selection.treatment} has no documented bookkeeping-system 1.0 mapping. Use an explicit legacy tax configuration or migrate the tenant.`
    );
  }
  if (
    resolveEnumValueStrict(LegacyTaxType, selection.legacyTaxType as never) === LegacyTaxType.CUSTOM
  ) {
    throw new SevdeskConfigurationError(
      "Semantic tax selections cannot resolve legacy custom taxation without an explicit taxSet."
    );
  }
  const plan = {
    kind: "resolved-tax-plan" as const,
    direction: selection.direction,
    treatment: selection.treatment,
    bookkeepingSystem,
    taxType: selection.legacyTaxType,
    defaultTaxRate: selection.defaultTaxRate,
    ...(selection.destinationCountry === undefined
      ? {}
      : { destinationCountry: selection.destinationCountry }),
    ...(selection.deliveryAddressCountry === undefined
      ? {}
      : { deliveryAddressCountry: selection.deliveryAddressCountry }),
    ...(selection.evidence === undefined ? {} : { evidence: selection.evidence })
  };
  brandResolvedPlan(plan);
  return Object.freeze(plan) as ResolvedTaxPlanFor<
    TDirection,
    TVersion,
    TTaxRule,
    TTreatment,
    TDefaultTaxRate
  >;
}

function brandResolvedPlan(plan: object): void {
  Object.defineProperty(plan, RESOLVED_TAX_PLAN_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false
  });
}
