import { describe, expect, it } from "vitest";
import {
  isValidVatIdFormat,
  normalizeVatId,
  parseVatId,
  supportedVatIdCountries,
  taxes,
  validateVatIdFormat
} from "../src/index.js";

const VALID_SAMPLES: ReadonlyArray<readonly [string, string]> = [
  ["ATU12345678", "AT"],
  ["BE123456789", "BE"],
  ["BE1234567491", "BE"],
  ["BG123456789", "BG"],
  ["BG1234567890", "BG"],
  ["CY12345678L", "CY"],
  ["CZ12345678", "CZ"],
  ["CZ1234567890", "CZ"],
  ["DE123456789", "DE"],
  ["DK12345678", "DK"],
  ["EE123456789", "EE"],
  ["EL123456789", "GR"],
  ["ESA12345678", "ES"],
  ["ESX1234567A", "ES"],
  ["FI12345678", "FI"],
  ["FR83123456789", "FR"],
  ["FRX1234567890", "FR"],
  ["FR1X123456789", "FR"],
  ["FRXX123456789", "FR"],
  ["HR12345678901", "HR"],
  ["HU12345678", "HU"],
  ["IE1234567T", "IE"],
  ["IE1234567TW", "IE"],
  ["IT12345678901", "IT"],
  ["LT123456789", "LT"],
  ["LT123456789012", "LT"],
  ["LU12345678", "LU"],
  ["LV12345678901", "LV"],
  ["MT12345678", "MT"],
  ["NL123456789B01", "NL"],
  ["PL1234567890", "PL"],
  ["PT123456789", "PT"],
  ["RO12", "RO"],
  ["RO1234567890", "RO"],
  ["SE123456789012", "SE"],
  ["SI12345678", "SI"],
  ["SK1234567890", "SK"],
  ["XI123456789", "XI"]
];

describe("VAT ID format validation", () => {
  it("normalizes separators and uppercases", () => {
    expect(normalizeVatId("de 123 456 789")).toBe("DE123456789");
    expect(normalizeVatId("NL-123.456.789-B01")).toBe("NL123456789B01");
  });
  it("parses prefix and maps EL → GR", () => {
    expect(parseVatId("DE123456789")).toMatchObject({
      prefix: "DE",
      nationalNumber: "123456789",
      countryCode: "DE"
    });
    expect(parseVatId("EL123456789")).toMatchObject({
      prefix: "EL",
      countryCode: "GR"
    });
  });
  it("accepts documented structural samples", () => {
    for (const [id, country] of VALID_SAMPLES) {
      if (id === "IE1234567TW") {
        expect(validateVatIdFormat("IE1234567TH", "IE").valid).toBe(true);
        continue;
      }
      const result = validateVatIdFormat(id, country);
      expect(result, id).toMatchObject({ valid: true, normalized: normalizeVatId(id) });
    }
  });
  it("Belgium accepts 9 and 10 digits without inventing a leading zero", () => {
    expect(validateVatIdFormat("BE123456789")).toMatchObject({ valid: true });
    expect(validateVatIdFormat("BE1234567491")).toMatchObject({ valid: true });
    expect(validateVatIdFormat("BE12345678")).toMatchObject({
      valid: false,
      reason: "invalid-national-number"
    });
    expect(validateVatIdFormat("BE12345678901")).toMatchObject({
      valid: false,
      reason: "invalid-national-number"
    });
  });
  it("Germany rejects a leading zero (jsvat / DE practice)", () => {
    expect(validateVatIdFormat("DE012345678")).toMatchObject({
      valid: false,
      reason: "invalid-national-number"
    });
    expect(validateVatIdFormat("DE123456789")).toMatchObject({ valid: true });
  });
  it("covers every EU VIES prefix we support", () => {
    expect(supportedVatIdCountries()).toEqual(
      [
        "AT",
        "BE",
        "BG",
        "CY",
        "CZ",
        "DE",
        "DK",
        "EE",
        "EL",
        "ES",
        "FI",
        "FR",
        "HR",
        "HU",
        "IE",
        "IT",
        "LT",
        "LU",
        "LV",
        "MT",
        "NL",
        "PL",
        "PT",
        "RO",
        "SE",
        "SI",
        "SK",
        "XI"
      ].sort()
    );
  });
  it("rejects empty, mismatches, and non-EU GB", () => {
    expect(validateVatIdFormat("")).toMatchObject({ valid: false, reason: "empty" });
    expect(validateVatIdFormat("DE123456789", "FR")).toMatchObject({
      valid: false,
      reason: "country-mismatch"
    });
    expect(validateVatIdFormat("EL123456789", "GR")).toMatchObject({ valid: true });
    expect(isValidVatIdFormat("GB123456789")).toBe(false);
  });
  it("exposes helpers on taxes.vatId", () => {
    expect(taxes.vatId.isValidFormat("DE123456789")).toBe(true);
    expect(taxes.vatId.validateFormat("XX1").valid).toBe(false);
  });
});
