import { describe, expect, it, vi } from "vitest";
import {
  formatRateDate,
  parseCountryRates,
  resolveCountryRate,
  selectCountryRate,
  SevdeskConfigurationError,
  type VatRateProvider
} from "../src/index.js";

describe("country VAT rate resolution", () => {
  it("requires an application provider to match an explicitly requested standard rate", async () => {
    await expect(
      resolveCountryRate({
        countryCode: "NL",
        asOf: "2026-08-01",
        rate: 20,
        provider: {
          getStandardRate: () => ({
            ratePercent: 21,
            version: "application-rates-2026-08"
          })
        }
      })
    ).rejects.toThrow(/requested standard rate 20.*provider rate 21.*NL/i);
  });
  it("requires the package baseline to match an explicitly requested standard rate", async () => {
    await expect(
      resolveCountryRate({
        countryCode: "NL",
        asOf: formatRateDate(),
        rate: 20
      })
    ).rejects.toThrow(/requested standard rate 20.*package baseline rate 21.*NL/i);
  });
  it("never turns a live selection mismatch into a package-baseline fallback", async () => {
    const fetchCountryRates = vi.fn(async () => ({
      countryCode: "NL",
      date: formatRateDate(),
      rates: Object.freeze([{ rate: 20, type: "STANDARD_RATE", kind: "standard" as const }]),
      standard: Object.freeze({ rate: 20, type: "STANDARD_RATE", kind: "standard" as const }),
      reduced: Object.freeze([])
    }));
    await expect(
      resolveCountryRate({
        countryCode: "NL",
        asOf: formatRateDate(),
        rate: 21,
        useLiveRates: true,
        errorOnMissingCountryRates: false,
        fetchCountryRates
      })
    ).rejects.toThrow(/requested standard rate 21.*STANDARD_RATE 20.*NL/i);
    expect(fetchCountryRates).toHaveBeenCalledOnce();
  });
  it("still permits an explicit soft fallback after an actual live fetch failure", async () => {
    const fetchCountryRates = vi.fn(() =>
      Promise.reject(new SevdeskConfigurationError("live transport unavailable"))
    );
    await expect(
      resolveCountryRate({
        countryCode: "NL",
        asOf: formatRateDate(),
        rate: 21,
        useLiveRates: true,
        errorOnMissingCountryRates: false,
        fetchCountryRates
      })
    ).resolves.toMatchObject({
      ratePercent: 21,
      source: "package-baseline",
      asOf: formatRateDate()
    });
    expect(fetchCountryRates).toHaveBeenCalledOnce();
  });
  it("never applies the undated package baseline to historical or future days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T17:30:00.000Z"));
    try {
      await expect(
        resolveCountryRate({ countryCode: "NL", asOf: "2025-08-01", rate: 21 })
      ).rejects.toThrow(/undated current snapshot.*cannot evidence NL on 2025-08-01/i);
      await expect(resolveCountryRate({ countryCode: "NL", asOf: "2027-08-01" })).rejects.toThrow(
        /dated provider\/live-rate evidence/i
      );
    } finally {
      vi.useRealTimers();
    }
  });
  it("preserves the requested date for provider evidence, including the default current day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T23:59:59.000Z"));
    let providerDate: Date | undefined;
    try {
      const rate = await resolveCountryRate({
        countryCode: "NL",
        provider: {
          getStandardRate: (_countryCode, context) => {
            providerDate = context.asOf;
            return { ratePercent: 21, version: "rates-2026-08" };
          }
        }
      });
      expect(providerDate?.toISOString()).toBe("2026-08-01T00:00:00.000Z");
      expect(rate).toMatchObject({ asOf: "2026-08-01", version: "rates-2026-08" });
    } finally {
      vi.useRealTimers();
    }
  });
  it("preserves historical live dates and rejects a source returning another day", async () => {
    const datedRates = parseCountryRates("NL", "2025-06-30", [{ rate: 21, type: "STANDARD_RATE" }]);
    await expect(
      resolveCountryRate({
        countryCode: "NL",
        asOf: "2025-06-30",
        useLiveRates: true,
        fetchCountryRates: async () => datedRates
      })
    ).resolves.toMatchObject({ source: "sevdesk-api", asOf: "2025-06-30" });
    await expect(
      resolveCountryRate({
        countryCode: "NL",
        asOf: "2025-07-01",
        useLiveRates: true,
        fetchCountryRates: async () => datedRates
      })
    ).rejects.toThrow(/returned rates dated 2025-06-30.*requested date 2025-07-01/i);
  });
  it("rejects invalid country/date metadata before creating a country-rate snapshot", () => {
    expect(() => parseCountryRates("ZZ", "2026-08-01", [])).toThrow(/ISO 3166-1 alpha-2/i);
    expect(() => parseCountryRates(123 as never, "2026-08-01", [])).toThrow(/alpha-2 string/i);
    expect(() => parseCountryRates("NL", "2026-02-30", [])).toThrow(/not a calendar day/i);
    expect(() => parseCountryRates("NL", 123 as never, [])).toThrow(/YYYY-MM-DD or a valid Date/i);
  });
  it("rejects conflicting duplicate STANDARD_RATE values but accepts equal duplicates", () => {
    expect(() =>
      parseCountryRates("NL", "2026-08-01", [
        { rate: 21, type: "STANDARD_RATE" },
        { rate: 20, type: "STANDARD_RATE" }
      ])
    ).toThrow(/conflicting STANDARD_RATE values.*21, 20/i);
    const equalDuplicates = parseCountryRates("NL", "2026-08-01", [
      { rate: 21, type: "STANDARD_RATE" },
      { rate: 21, type: "STANDARD_RATE" }
    ]);
    expect(selectCountryRate(equalDuplicates)).toMatchObject({
      ratePercent: 21,
      asOf: "2026-08-01"
    });
  });
  it("defensively rejects conflicting standards in externally constructed snapshots", () => {
    expect(() =>
      selectCountryRate({
        countryCode: "NL",
        date: "2026-08-01",
        rates: [
          { rate: 21, type: "STANDARD_RATE", kind: "standard" },
          { rate: 20, type: "STANDARD_RATE", kind: "standard" }
        ],
        standard: { rate: 21, type: "STANDARD_RATE", kind: "standard" },
        reduced: []
      })
    ).toThrow(/conflicting STANDARD_RATE values/i);
  });
  it("validates provider evidence structurally and identifies numeric compatibility values", async () => {
    const malformed = {
      getStandardRate: () => ({ ratePercent: 21, version: null })
    } as unknown as VatRateProvider;
    await expect(
      resolveCountryRate({ countryCode: "NL", asOf: "2025-08-01", provider: malformed })
    ).rejects.toThrow(/malformed rate evidence/i);
    await expect(
      resolveCountryRate({
        countryCode: "NL",
        asOf: "2025-08-01",
        provider: { getStandardRate: () => 21 }
      })
    ).resolves.toMatchObject({
      source: "application",
      version: "application-provider:unversioned-number",
      asOf: "2025-08-01"
    });
  });
});
