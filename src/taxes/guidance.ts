import { SevdeskResponseValidationError } from "../utils/errors.js";
import { GuidanceTaxRate } from "./constants.js";
import type { NormalizedGuidanceRate, NormalizedTaxGuidance, ReceiptGuideWire } from "./types.js";

export function normalizeGuidance(value: ReceiptGuideWire): NormalizedTaxGuidance {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw malformedGuidance(value);
  }
  const accountId = value.accountDatevId;
  const accountNumber = value.accountNumber;
  const rules = value.allowedTaxRules;
  const receiptTypes = value.allowedReceiptTypes;
  if (
    typeof accountId !== "number" ||
    !Number.isSafeInteger(accountId) ||
    accountId <= 0 ||
    typeof accountNumber !== "string" ||
    accountNumber.trim().length === 0 ||
    !Array.isArray(rules) ||
    !Array.isArray(receiptTypes) ||
    !receiptTypes.every(
      (receiptType) => typeof receiptType === "string" && receiptType.trim().length > 0
    )
  ) {
    throw malformedGuidance(value);
  }
  return {
    account: {
      id: accountId,
      number: accountNumber.trim(),
      ...(typeof value.accountName === "string" ? { name: value.accountName } : {}),
      ...(typeof value.description === "string" ? { description: value.description } : {})
    },
    rules: normalizeGuidanceRules(rules, value),
    receiptTypes: receiptTypes.map((receiptType) => receiptType.trim())
  };
}

function normalizeGuidanceRules(
  rules: NonNullable<ReceiptGuideWire["allowedTaxRules"]>,
  guidance: ReceiptGuideWire
): readonly NormalizedTaxGuidance["rules"][number][] {
  const normalized = rules.map((rule) => {
    if (
      rule === null ||
      typeof rule !== "object" ||
      Array.isArray(rule) ||
      typeof rule.id !== "number" ||
      !Number.isSafeInteger(rule.id) ||
      rule.id <= 0 ||
      typeof rule.name !== "string" ||
      rule.name.trim().length === 0 ||
      !Array.isArray(rule.taxRates) ||
      !rule.taxRates.every((token) => typeof token === "string" && token.trim().length > 0)
    ) {
      throw malformedGuidance(guidance);
    }
    return {
      id: rule.id,
      name: rule.name.trim(),
      ...(typeof rule.description === "string" ? { description: rule.description } : {}),
      rates: rule.taxRates.map((token) => normalizeGuidanceRate(token.trim()))
    };
  });
  if (new Set(normalized.map((rule) => rule.id)).size !== normalized.length) {
    throw malformedGuidance(guidance);
  }
  return normalized;
}

function malformedGuidance(value: unknown): SevdeskResponseValidationError {
  return new SevdeskResponseValidationError("sevdesk returned malformed ReceiptGuidance.", {
    value
  });
}

function normalizeGuidanceRate(token: string): NormalizedGuidanceRate {
  const percent =
    token === GuidanceTaxRate.ZERO
      ? 0
      : token === GuidanceTaxRate.SEVEN
        ? 7
        : token === GuidanceTaxRate.NINETEEN
          ? 19
          : undefined;
  return percent === undefined ? { token, known: false } : { token, percent, known: true };
}
