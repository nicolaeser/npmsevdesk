import { describe, expect, it } from "vitest";
import { calculateTaxedPrice, toInvoicePositionPrice } from "../src/index.js";

describe("taxed price calculation", () => {
  it("computes net basis 19%", () => {
    const t = calculateTaxedPrice({ price: 100, taxRate: 19, quantity: 2 });
    expect(t).toMatchObject({
      unitNet: 100,
      unitTax: 19,
      unitGross: 119,
      lineNet: 200,
      lineTax: 38,
      lineGross: 238,
      taxRate: 19,
      quantity: 2,
      basis: "net"
    });
    expect(toInvoicePositionPrice(t)).toEqual({
      price: 100,
      quantity: 2,
      taxRate: 19
    });
  });
  it("computes gross basis", () => {
    const t = calculateTaxedPrice({
      price: 119,
      taxRate: 19,
      basis: "gross",
      quantity: 1
    });
    expect(t.unitGross).toBe(119);
    expect(t.unitNet).toBe(100);
    expect(t.unitTax).toBe(19);
  });
  it("handles zero rate", () => {
    const t = calculateTaxedPrice({ price: 50, taxRate: 0 });
    expect(t.unitTax).toBe(0);
    expect(t.unitGross).toBe(50);
  });
  it("rounds tax from the line total instead of multiplying rounded unit tax", () => {
    const t = calculateTaxedPrice({ price: 0.01, taxRate: 19, quantity: 100 });
    expect(t).toMatchObject({ lineNet: 1, lineTax: 0.19, lineGross: 1.19 });
  });
  it("keeps totals correlated with the rounded unit price emitted to sevdesk", () => {
    const t = calculateTaxedPrice({ price: 0.005, taxRate: 19, quantity: 2 });
    const position = toInvoicePositionPrice(t);
    expect(position.price).toBe(0.01);
    expect(t).toMatchObject({ unitNet: 0.01, lineNet: 0.02, lineTax: 0, lineGross: 0.02 });
    expect(t.lineNet).toBe(position.price * position.quantity);
  });
  it("keeps gross position prices correlated with a gross document", () => {
    const t = calculateTaxedPrice({ price: 119, taxRate: 19, basis: "gross" });
    expect(toInvoicePositionPrice(t)).toEqual({ price: 119, quantity: 1, taxRate: 19 });
  });
  it("rejects invalid runtime basis values", () => {
    expect(() => calculateTaxedPrice({ price: 1, taxRate: 19, basis: "other" as never })).toThrow(
      /basis/
    );
  });
  it("rejects finite inputs whose calculated totals overflow", () => {
    expect(() =>
      calculateTaxedPrice({ price: Number.MAX_VALUE, quantity: 2, taxRate: 19 })
    ).toThrow(/not finite after price calculation/);
  });
});
