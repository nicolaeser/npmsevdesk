import { describe, expect, it } from "vitest";
import { assessTaxLocation, determineGermanSale } from "../src/index.js";

describe("tax location evidence", () => {
  it("accepts matching billing, IP and payment evidence", () => {
    const result = assessTaxLocation({
      billingCountry: "nl",
      ipCountry: "NL",
      paymentCountry: "NL"
    });
    expect(result).toMatchObject({
      status: "consistent",
      country: "NL",
      observedCountries: ["NL"],
      conflicts: []
    });
  });
  it("surfaces conflicts and never silently selects one country", () => {
    const result = assessTaxLocation({ billingCountry: "NL", ipCountry: "BE" });
    expect(result).toMatchObject({ status: "conflict", conflicts: ["BE", "NL"] });
    if (result.status === "conflict") {
      expect(result.country).toBeUndefined();
    }
  });
  it("requires an auditable manual override before a conflicted sale can resolve", () => {
    expect(() =>
      determineGermanSale({
        country: "NL",
        euConsumerTaxation: "seller-country",
        locationEvidence: { billingCountry: "NL", ipCountry: "BE" }
      })
    ).toThrow(/conflicts/);
    const decision = determineGermanSale({
      country: "NL",
      euConsumerTaxation: "seller-country",
      locationEvidence: {
        billingCountry: "NL",
        ipCountry: "BE",
        override: {
          country: "NL",
          reason: "Verified contract and billing address",
          reviewedBy: "tax-team@example.test"
        }
      }
    });
    expect(decision.location).toMatchObject({ status: "overridden", country: "NL" });
  });
  it("rejects an input country that disagrees with resolved evidence", () => {
    expect(() =>
      determineGermanSale({
        country: "FR",
        euConsumerTaxation: "seller-country",
        locationEvidence: { billingCountry: "NL", paymentCountry: "NL" }
      })
    ).toThrow(/must match the resolved tax location/);
  });
});
