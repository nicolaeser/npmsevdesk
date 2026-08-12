import { SevdeskConfigurationError } from "../utils/errors.js";

export type PriceBasis = "net" | "gross";

export interface CalculateTaxedPriceInput<TBasis extends PriceBasis = PriceBasis> {
  readonly price: number;
  readonly taxRate: number;
  readonly quantity?: number;
  readonly basis?: TBasis;
  readonly decimals?: number;
}

export interface TaxedPrice<TBasis extends PriceBasis = PriceBasis> {
  readonly taxRate: number;
  readonly quantity: number;
  readonly basis: TBasis;
  readonly unitNet: number;
  readonly unitTax: number;
  readonly unitGross: number;
  readonly lineNet: number;
  readonly lineTax: number;
  readonly lineGross: number;
}

function roundMoney(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new SevdeskConfigurationError(`${name} must be a finite number ≥ 0.`);
  }
}

export function calculateTaxedPrice<const TBasis extends PriceBasis = "net">(
  input: CalculateTaxedPriceInput<TBasis>
): TaxedPrice<TBasis> {
  assertFiniteNonNegative(input.price, "price");
  assertFiniteNonNegative(input.taxRate, "taxRate");
  if (input.taxRate > 100) {
    throw new SevdeskConfigurationError("taxRate must be between 0 and 100.");
  }
  const quantity = input.quantity ?? 1;
  assertFiniteNonNegative(quantity, "quantity");
  const basis = (input.basis ?? "net") as TBasis;
  if (basis !== "net" && basis !== "gross") {
    throw new SevdeskConfigurationError('basis must be "net" or "gross".');
  }
  const decimals = input.decimals ?? 2;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) {
    throw new SevdeskConfigurationError("decimals must be an integer 0–6.");
  }
  const factor = input.taxRate / 100;
  let unitNet: number;
  let unitGross: number;
  let unitTax: number;
  if (basis === "net") {
    unitNet = roundMoney(input.price, decimals);
    unitTax = roundMoney(unitNet * factor, decimals);
    unitGross = roundMoney(unitNet + unitTax, decimals);
  } else {
    unitGross = roundMoney(input.price, decimals);
    unitNet = roundMoney(unitGross / (1 + factor), decimals);
    unitTax = roundMoney(unitGross - unitNet, decimals);
  }
  const lineNet =
    basis === "net"
      ? roundMoney(unitNet * quantity, decimals)
      : roundMoney((unitGross * quantity) / (1 + factor), decimals);
  const lineGross =
    basis === "gross"
      ? roundMoney(unitGross * quantity, decimals)
      : roundMoney(lineNet * (1 + factor), decimals);
  const lineTax = roundMoney(lineGross - lineNet, decimals);
  const calculated = { unitNet, unitTax, unitGross, lineNet, lineTax, lineGross };
  for (const [name, value] of Object.entries(calculated)) {
    if (!Number.isFinite(value)) {
      throw new SevdeskConfigurationError(
        `${name} is not finite after price calculation; reduce price, quantity, or decimals.`
      );
    }
  }
  return Object.freeze({
    taxRate: input.taxRate,
    quantity,
    basis,
    unitNet,
    unitTax,
    unitGross,
    lineNet,
    lineTax,
    lineGross
  });
}

export function toInvoicePositionPrice(taxed: TaxedPrice): {
  readonly price: number;
  readonly quantity: number;
  readonly taxRate: number;
} {
  return Object.freeze({
    price: taxed.basis === "net" ? taxed.unitNet : taxed.unitGross,
    quantity: taxed.quantity,
    taxRate: taxed.taxRate
  });
}
