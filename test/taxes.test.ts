import axios, { type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it, vi } from "vitest";
import {
  BookkeepingSystem,
  createSevdeskClient,
  determineGermanSale,
  EuConsumerTaxation,
  ExpenseTaxRule,
  formatRateDate,
  GermanVat,
  getPackageStandardRate,
  resolveCountryRate,
  SaleProduct,
  resolveTaxSelection,
  SaleTemplate,
  SellerTaxScheme,
  SevdeskConfigurationError,
  SevdeskTaxConfigurationError,
  taxes,
  TaxRate,
  TaxCustomerType,
  TaxRule,
  TaxTreatment,
  VatIdStatus
} from "../src/index.js";
import { buildInvoicePayload } from "../src/bundles/builders.js";
import { refs } from "../src/types/references.js";
import { adapter, jsonResponse } from "./helpers.js";

const FRANCE = Object.freeze({ code: "FR", ...refs.country(33) });

describe("semantic taxes", () => {
  it("uses the reviewed package baseline unless live country rates are explicitly enabled", async () => {
    let liveCalls = 0;
    const asOf = formatRateDate();
    const rate = await resolveCountryRate({
      countryCode: "NL",
      asOf,
      fetchCountryRates: async () => {
        liveCalls += 1;
        throw new Error("must not be called without opt-in");
      }
    });
    expect(rate).toMatchObject({
      countryCode: "NL",
      ratePercent: 21,
      source: "package-baseline",
      asOf
    });
    expect(liveCalls).toBe(0);
  });
  it("maps semantic presets to current and legacy tenant representations", () => {
    const selection = taxes.revenue.domestic({ rate: TaxRate.STANDARD_19 });
    expect(resolveTaxSelection(selection, BookkeepingSystem.CURRENT)).toMatchObject({
      kind: "resolved-tax-plan",
      treatment: TaxTreatment.DOMESTIC_SALE,
      bookkeepingSystem: "2.0",
      taxRule: TaxRule.STANDARD_TAXABLE,
      defaultTaxRate: 19
    });
    expect(resolveTaxSelection(selection, BookkeepingSystem.LEGACY)).toMatchObject({
      bookkeepingSystem: "1.0",
      taxType: "default",
      defaultTaxRate: 19
    });
    expect(() =>
      resolveTaxSelection(
        taxes.revenue.ossElectronicService({ destinationCountry: FRANCE, rate: 20 }),
        BookkeepingSystem.LEGACY
      )
    ).toThrow(/no documented bookkeeping-system 1.0 mapping/i);
  });
  it("loads and caches the tenant profile while preserving raw evidence", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, { objects: { version: "2.0" } });
        })
      })
    });
    const first = await client.taxes.resolve(taxes.expense.deductible({ rate: TaxRate.REDUCED_7 }));
    const second = await client.taxes.getProfile();
    expect(calls).toBe(1);
    expect(first.data).toMatchObject({
      direction: "expense",
      bookkeepingSystem: "2.0",
      taxRule: ExpenseTaxRule.DEDUCTIBLE_INPUT_TAX,
      defaultTaxRate: 7
    });
    expect(first.json).toEqual({ objects: { version: "2.0" } });
    expect(first.raw.status).toBe(200);
    expect(second.data.representation).toBe("tax-rule");
  });
  it("determines Provid-style German digital-service cases and fails closed for VAT IDs", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => jsonResponse(config, { objects: { version: "2.0" } }))
      })
    });
    const b2c = await client.taxes.resolveDigitalService({
      sellerTaxScheme: SellerTaxScheme.STANDARD,
      customer: {
        type: "consumer",
        country: "fr",
        euConsumerTaxation: {
          mode: "oss-destination",
          destinationCountry: FRANCE,
          rate: 20
        }
      }
    });
    expect(b2c.data).toMatchObject({
      treatment: TaxTreatment.OSS_ELECTRONIC_SERVICE,
      taxRule: TaxRule.OSS_ELECTRONIC_SERVICE,
      defaultTaxRate: 20,
      destinationCountry: "FR",
      deliveryAddressCountry: refs.country(33)
    });
    const nonEuBusiness = await client.taxes.resolveDigitalService({
      sellerTaxScheme: SellerTaxScheme.STANDARD,
      customer: { type: "business", country: "US" }
    });
    expect(nonEuBusiness.data).toMatchObject({
      treatment: TaxTreatment.NON_DOMESTIC_SERVICE,
      taxRule: TaxRule.NON_DOMESTIC_SERVICE,
      defaultTaxRate: 0
    });
    await expect(
      client.taxes.resolveDigitalService({
        sellerTaxScheme: SellerTaxScheme.STANDARD,
        customer: {
          type: "business",
          country: "NL",
          vatId: { status: VatIdStatus.NOT_CHECKED, value: "NL123" }
        }
      })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
  });
  it("requires explicit legal decisions for EU consumers and small-business sellers", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => jsonResponse(config, { objects: { version: "2.0" } }))
      })
    });
    await expect(
      client.taxes.resolveDigitalService({
        sellerTaxScheme: SellerTaxScheme.STANDARD,
        customer: { type: "consumer", country: "FR" }
      })
    ).rejects.toThrow(/explicit euConsumerTaxation choice/i);
    const sellerCountry = await client.taxes.resolveDigitalService({
      sellerTaxScheme: SellerTaxScheme.STANDARD,
      customer: {
        type: "consumer",
        country: "FR",
        euConsumerTaxation: { mode: "seller-country", rate: TaxRate.STANDARD_19 }
      }
    });
    expect(sellerCountry.data).toMatchObject({
      treatment: TaxTreatment.DOMESTIC_SALE,
      taxRule: TaxRule.STANDARD_TAXABLE,
      defaultTaxRate: TaxRate.STANDARD_19
    });
    await expect(
      client.taxes.resolveDigitalService({
        sellerTaxScheme: SellerTaxScheme.SMALL_BUSINESS,
        customer: { type: "consumer", country: "DE" }
      } as never)
    ).rejects.toThrow(/smallBusinessTreatment/i);
  });
  it("accepts only auditable, country-matching VAT-ID evidence for EU B2B", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => jsonResponse(config, { objects: { version: "2.0" } }))
      })
    });
    const result = await client.taxes.resolveDigitalService({
      sellerTaxScheme: SellerTaxScheme.STANDARD,
      customer: {
        type: "business",
        country: "NL",
        vatId: {
          status: VatIdStatus.VALID,
          value: "NL123456789B01",
          country: "NL",
          checkedAt: "2026-07-31T12:00:00.000Z",
          provider: "test-vies"
        }
      }
    });
    expect(result.data).toMatchObject({
      treatment: TaxTreatment.EU_B2B_REVERSE_CHARGE,
      taxRule: TaxRule.REVERSE_CHARGE_18B,
      defaultTaxRate: 0
    });
  });
  it("carries the exact StaticCountry reference into OSS Factory payloads", () => {
    const tax = resolveTaxSelection(
      taxes.revenue.ossElectronicService({ destinationCountry: FRANCE, rate: 20 }),
      BookkeepingSystem.CURRENT
    );
    const payload = buildInvoicePayload({
      invoice: {
        invoiceDate: "2026-07-31",
        contact: refs.contact(1),
        contactPerson: refs.sevUser(2),
        currency: "EUR",
        tax
      },
      positions: [{ quantity: 1, price: 100, unity: refs.unity(1) }]
    });
    expect(payload.invoice.taxRule).toEqual({ id: 19, objectName: "TaxRule" });
    expect(payload.invoice.deliveryAddressCountry).toEqual({
      id: 33,
      objectName: "StaticCountry"
    });
    expect(payload.invoicePosSave[0]?.taxRate).toBe(20);
  });
  it("requires resolved plans or an explicit manual escape at curated boundaries", () => {
    const invoice = {
      invoiceDate: "2026-07-31",
      contact: refs.contact(1),
      contactPerson: refs.sevUser(2),
      currency: "EUR"
    } as const;
    const positions = [{ quantity: 1, price: 100, taxRate: 19, unity: refs.unity(1) }] as const;
    expect(() =>
      buildInvoicePayload({
        invoice: {
          ...invoice,
          tax: { bookkeepingSystem: "2.0", taxRule: TaxRule.STANDARD_TAXABLE } as never
        },
        positions
      })
    ).toThrow(/client\.taxes\.resolve\(\).*taxes\.manual/i);
    const plan = resolveTaxSelection(
      taxes.revenue.domestic({ rate: TaxRate.STANDARD_19 }),
      BookkeepingSystem.CURRENT
    );
    expect(() =>
      buildInvoicePayload({
        invoice: { ...invoice, tax: { ...plan } as never },
        positions
      })
    ).toThrow(/client\.taxes\.resolve\(\).*taxes\.manual/i);
    expect(() =>
      buildInvoicePayload({
        invoice: {
          ...invoice,
          tax: taxes.manual.sales({
            bookkeepingSystem: "2.0",
            taxRule: TaxRule.STANDARD_TAXABLE
          })
        },
        positions
      })
    ).not.toThrow();
  });
  it("derives smallSettlement from the selected small-business treatment", () => {
    const tax = resolveTaxSelection(taxes.revenue.smallBusiness(), BookkeepingSystem.CURRENT);
    const payload = buildInvoicePayload({
      invoice: {
        invoiceDate: "2026-07-31",
        contact: refs.contact(1),
        contactPerson: refs.sevUser(2),
        currency: "EUR",
        tax
      },
      positions: [{ quantity: 1, price: 100, unity: refs.unity(1) }]
    });
    expect(payload.invoice.smallSettlement).toBe(true);
  });
  it("inherits the plan rate in Factory builders", () => {
    const salesTax = resolveTaxSelection(
      taxes.revenue.domestic({ rate: TaxRate.STANDARD_19 }),
      BookkeepingSystem.CURRENT
    );
    const invoice = buildInvoicePayload({
      invoice: {
        invoiceDate: "2026-07-31",
        contact: refs.contact(1),
        contactPerson: refs.sevUser(2),
        currency: "EUR",
        tax: salesTax
      },
      positions: [{ quantity: 1, price: 10, unity: refs.unity(1) }]
    });
    expect(invoice.invoicePosSave[0]?.taxRate).toBe(19);
  });
  it("rejects incompatible tax combinations at the builder boundary", () => {
    const invalidRate = () =>
      buildInvoicePayload({
        invoice: {
          invoiceDate: "2026-07-31",
          contact: refs.contact(1),
          contactPerson: refs.sevUser(2),
          currency: "EUR",
          tax: taxes.manual.sales({
            bookkeepingSystem: "2.0",
            taxRule: TaxRule.STANDARD_TAXABLE
          })
        },
        positions: [{ quantity: 1, price: 1, taxRate: 42, unity: refs.unity(1) }]
      });
    expect(invalidRate).toThrow(SevdeskTaxConfigurationError);
  });
});

describe("German sale templates and country rates", () => {
  it("exposes German and EU rate tables", () => {
    expect(GermanVat.STANDARD).toBe(19);
    expect(GermanVat.REDUCED).toBe(7);
    expect(GermanVat.ZERO).toBe(0);
    expect(taxes.rates.german.STANDARD).toBe(19);
    expect(getPackageStandardRate("NL")?.ratePercent).toBe(21);
    expect(getPackageStandardRate("DE")?.ratePercent).toBe(19);
    expect(taxes.rates.packageStandard("NL")?.ratePercent).toBe(21);
    expect(taxes.templates.GERMAN_SAAS).toBe(SaleTemplate.GERMAN_SAAS);
    expect(taxes.products.ELECTRONIC_SERVICE).toBe(SaleProduct.ELECTRONIC_SERVICE);
  });
  it("classifies DE / EU / non-EU for SaaS with minimal input", () => {
    expect(determineGermanSale({ country: "DE" })).toMatchObject({
      region: "DE",
      reason: "domestic-sale",
      defaultTaxRate: 19,
      taxRule: TaxRule.STANDARD_TAXABLE
    });
    expect(
      determineGermanSale({
        country: "FR",
        type: "company",
        vatId: {
          status: VatIdStatus.VALID,
          value: "FR12345678901",
          country: "FR",
          checkedAt: "2026-07-31T12:00:00.000Z",
          provider: "test-vies"
        }
      })
    ).toMatchObject({
      region: "EU",
      reason: "eu-b2b-reverse-charge-service",
      defaultTaxRate: 0,
      taxRule: TaxRule.REVERSE_CHARGE_18B
    });
    expect(determineGermanSale({ country: "US" })).toMatchObject({
      region: "NON_EU",
      taxRule: TaxRule.NON_DOMESTIC_SERVICE,
      defaultTaxRate: 0
    });
    expect(
      determineGermanSale({
        country: "NL",
        customerType: TaxCustomerType.CONSUMER,
        product: SaleProduct.ELECTRONIC_SERVICE,
        euConsumerTaxation: EuConsumerTaxation.SELLER_COUNTRY
      })
    ).toMatchObject({
      region: "EU",
      taxRule: TaxRule.STANDARD_TAXABLE,
      euConsumerTaxation: EuConsumerTaxation.SELLER_COUNTRY
    });
  });
  it("fails closed for invalid countries and implicit EU consumer treatment", () => {
    expect(() => determineGermanSale({ country: "NLD" })).toThrow(/ISO 3166-1 alpha-2/);
    expect(() => determineGermanSale({ country: "FR" })).toThrow(
      /EU consumer taxation is a legal business decision/
    );
    expect(
      determineGermanSale({ country: "FR", euConsumerTaxation: "seller-country" })
    ).toMatchObject({
      taxRule: TaxRule.STANDARD_TAXABLE,
      defaultTaxRate: TaxRate.STANDARD_19,
      euConsumerTaxation: "seller-country"
    });
  });
  it("rejects stale, future and malformed verified VAT evidence", () => {
    const common = { country: "FR", type: "company" } as const;
    expect(() =>
      determineGermanSale({
        ...common,
        vatId: {
          status: VatIdStatus.VALID,
          value: "FRXX",
          country: "FR",
          checkedAt: new Date().toISOString(),
          provider: "test-vies"
        }
      })
    ).toThrow(/invalid format/);
    expect(() =>
      determineGermanSale({
        ...common,
        vatId: {
          status: VatIdStatus.VALID,
          value: "FR12345678901",
          country: "FR",
          checkedAt: new Date(Date.now() - 31 * 86_400_000).toISOString(),
          provider: "test-vies"
        }
      })
    ).toThrow(/older than/);
    expect(() =>
      determineGermanSale({
        ...common,
        vatId: {
          status: VatIdStatus.VALID,
          value: "FR12345678901",
          country: "FR",
          checkedAt: new Date(Date.now() + 86_400_000).toISOString(),
          provider: "test-vies"
        }
      })
    ).toThrow(/future/);
  });
  it("correlates supplied rate evidence with country, kind, date and value", () => {
    expect(() =>
      determineGermanSale({
        country: "NL",
        euConsumerTaxation: "oss-destination",
        effectiveDate: "2026-07-31",
        destinationCountry: { code: "NL", ...refs.country(150) },
        rateLookup: {
          countryCode: "FR",
          ratePercent: 20,
          kind: "standard",
          source: "application",
          version: "test",
          asOf: "2026-07-31"
        }
      })
    ).toThrow(/countryCode must match/);
  });
  it("does not let synchronous OSS determination ignore rate constraints or providers", () => {
    const common = {
      country: "NL",
      euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
      effectiveDate: "2026-07-31",
      destinationCountry: { code: "NL", ...refs.country(150) }
    } as const;
    expect(() => determineGermanSale({ ...common, destinationRateExact: 20 })).toThrow(
      /does not match package baseline rate 21/
    );
    expect(() => determineGermanSale({ ...common, destinationRateKind: "reduced" })).toThrow(
      /Reduced destination taxation requires/
    );
    expect(() =>
      determineGermanSale({
        ...common,
        rateSource: { getStandardRate: () => 21 }
      })
    ).toThrow(/resolveSale/);
    expect(() => determineGermanSale(common)).toThrow(/undated current snapshot/);
    expect(() =>
      determineGermanSale({
        ...common,
        rateLookup: {
          countryCode: "NL",
          ratePercent: 21,
          kind: "standard",
          source: "application",
          version: "missing-date"
        }
      } as never)
    ).toThrow(/rateLookup.asOf is required/);
  });
  it("rejects semantically irrelevant tax fields instead of silently ignoring them", () => {
    expect(() =>
      determineGermanSale({
        country: "DE",
        smallBusiness: true,
        domesticTaxRate: 19
      } as never)
    ).toThrow(/smallBusiness taxation does not accept domesticTaxRate/);
    expect(() =>
      determineGermanSale({
        country: "NL",
        type: "company",
        vatId: {
          status: VatIdStatus.VALID,
          value: "NL123456789B01",
          country: "NL",
          checkedAt: new Date().toISOString(),
          provider: "test-vies"
        },
        euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
        destinationRate: 21
      } as never)
    ).toThrow(/valid EU VAT-ID selects the B2B treatment/);
    expect(() =>
      determineGermanSale({
        country: "NL",
        euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
        destinationCountry: { code: "NL", ...refs.country(150) },
        destinationRate: 21,
        rateSource: { getStandardRate: () => 21 }
      } as never)
    ).toThrow(/exactly one destination rate source/);
  });
  it("derives decision.location only from assessed locationEvidence", () => {
    const injected = determineGermanSale({
      country: "DE",
      evidence: {
        taxLocation: {
          status: "consistent",
          country: "US"
        }
      }
    });
    const assessed = determineGermanSale({
      country: "DE",
      locationEvidence: { billingCountry: "DE", ipCountry: "DE" }
    });
    expect("location" in injected).toBe(false);
    expect(assessed.location).toMatchObject({ status: "consistent", country: "DE" });
  });
  it("evaluates VAT-ID evidence against the effective tax date", () => {
    const common = {
      country: "FR",
      type: "company",
      effectiveDate: "2025-01-31"
    } as const;
    const evidence = {
      status: VatIdStatus.VALID,
      value: "FR12345678901",
      country: "FR",
      provider: "test-vies"
    } as const;
    expect(() =>
      determineGermanSale({
        ...common,
        vatId: {
          ...evidence,
          checkedAt: "2025-01-15T12:00:00.000Z",
          validUntil: "2025-02-01T00:00:00.000Z"
        }
      })
    ).not.toThrow();
    expect(() =>
      determineGermanSale({
        ...common,
        vatId: { ...evidence, checkedAt: "2025-02-01T12:00:00.000Z" }
      })
    ).toThrow(/real future or after the effective tax date/);
    expect(() =>
      determineGermanSale({
        ...common,
        vatId: {
          ...evidence,
          checkedAt: "2025-01-15T12:00:00.000Z",
          validUntil: "2025-01-30T23:59:59.999Z"
        }
      })
    ).toThrow(/expires before the effective tax date ends/);
    expect(() =>
      determineGermanSale({
        country: "FR",
        type: "company",
        effectiveDate: "2099-01-31",
        vatId: {
          ...evidence,
          checkedAt: "2099-01-15T12:00:00.000Z",
          validUntil: "2099-02-01T00:00:00.000Z"
        }
      })
    ).toThrow(/real future/);
    expect(() =>
      determineGermanSale({
        country: "FR",
        type: "company",
        effectiveDate: "2099-01-31",
        vatId: {
          ...evidence,
          checkedAt: new Date().toISOString()
        }
      })
    ).toThrow(/future effective tax date requires validUntil/);
    expect(() =>
      determineGermanSale({
        ...common,
        vatId: {
          ...evidence,
          checkedAt: "2025-01-15T12:00:00.000Z",
          validUntil: "2025-01-14T12:00:00.000Z"
        }
      })
    ).toThrow(/precedes checkedAt/);
  });
  it("resolveSale uses live STANDARD_RATE for EU consumers", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      useLiveCountryRates: true,
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          const url = String(config.url ?? "");
          if (url.includes("bookkeepingSystemVersion")) {
            return jsonResponse(config, { objects: { version: "2.0" } });
          }
          if (url.includes("Vat/getByCountryAndDate")) {
            return jsonResponse(config, {
              objects: [
                { rate: 20, type: "STANDARD_RATE" },
                { rate: 5.5, type: "REDUCED_RATE" },
                { rate: 10, type: "REDUCED_RATE" }
              ]
            });
          }
          return jsonResponse(config, {
            objects: [{ id: "33", objectName: "StaticCountry", code: "FR", name: "France" }],
            total: 1
          });
        })
      })
    });
    const result = await client.taxes.resolveSale({
      country: "FR",
      euConsumerTaxation: "oss-destination",
      effectiveDate: "2026-07-31"
    });
    expect(result.data).toMatchObject({
      taxRule: TaxRule.OSS_ELECTRONIC_SERVICE,
      defaultTaxRate: 20,
      destinationCountry: "FR"
    });
    expect(result.decision.rateSource).toMatchObject({
      ratePercent: 20,
      kind: "standard",
      source: "sevdesk-api"
    });
    expect(result.decision.effectiveDate).toBe("2026-07-31");
    expect(result.evidence.countryLookup?.data.code).toBe("FR");
    expect(result.evidence.countryRates?.json.objects).toHaveLength(3);
    expect(result.evidence.countryRates?.raw.status).toBe(200);
  });
  it("errors by default when live country rates cannot be loaded", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      useLiveCountryRates: true,
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          const url = String(config.url ?? "");
          if (url.includes("bookkeepingSystemVersion")) {
            return jsonResponse(config, { objects: { version: "2.0" } });
          }
          if (url.includes("Vat/getByCountryAndDate")) {
            return Promise.reject(new Error("unavailable"));
          }
          return jsonResponse(config, {
            objects: [{ id: "150", objectName: "StaticCountry", code: "NL", name: "Netherlands" }],
            total: 1
          });
        })
      })
    });
    await expect(
      client.taxes.resolveSale({ country: "NL", euConsumerTaxation: "oss-destination" })
    ).rejects.toThrow(/Could not load sevdesk country VAT rates for NL/i);
  });
  it("does not call the undocumented country-rate endpoint without explicit opt-in", async () => {
    let liveCalls = 0;
    const today = formatRateDate(new Date());
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          const url = String(config.url ?? "");
          if (url.includes("bookkeepingSystemVersion")) {
            return jsonResponse(config, { objects: { version: "2.0" } });
          }
          if (url.includes("Vat/getByCountryAndDate")) {
            liveCalls += 1;
            return Promise.reject(new Error("must not be called"));
          }
          return jsonResponse(config, {
            objects: [{ id: "150", objectName: "StaticCountry", code: "NL", name: "Netherlands" }],
            total: 1
          });
        })
      })
    });
    const result = await client.taxes.resolveSale({
      country: "NL",
      euConsumerTaxation: "oss-destination",
      effectiveDate: today
    });
    expect(liveCalls).toBe(0);
    expect(result.decision.rateSource).toMatchObject({
      ratePercent: 21,
      source: "package-baseline",
      asOf: today
    });
  });
  it("allows package baseline when errorOnMissingCountryRates is false", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      useLiveCountryRates: true,
      errorOnMissingCountryRates: false,
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          const url = String(config.url ?? "");
          if (url.includes("bookkeepingSystemVersion")) {
            return jsonResponse(config, { objects: { version: "2.0" } });
          }
          if (url.includes("Vat/getByCountryAndDate")) {
            return Promise.reject(new Error("unavailable"));
          }
          return jsonResponse(config, {
            objects: [{ id: "150", objectName: "StaticCountry", code: "NL", name: "Netherlands" }],
            total: 1
          });
        })
      })
    });
    const result = await client.taxes.resolveSale({
      country: "NL",
      euConsumerTaxation: "oss-destination"
    });
    expect(result.decision.rateSource).toMatchObject({
      ratePercent: 21,
      source: "package-baseline"
    });
  });
  it("selects STANDARD_RATE and requires exact reduced rates when ambiguous", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url ?? "").includes("Vat/getByCountryAndDate")) {
            return jsonResponse(config, {
              objects: [
                { rate: "21", type: "STANDARD_RATE" },
                { rate: 0, type: "REDUCED_RATE" },
                { rate: 9, type: "REDUCED_RATE" }
              ]
            });
          }
          return jsonResponse(config, { objects: { version: "2.0" } });
        })
      })
    });
    const rates = await client.taxes.getCountryRates({ countryCode: "nl", date: "2026-07-31" });
    expect(rates.countryCode).toBe("NL");
    expect(rates.standard?.rate).toBe(21);
    expect(rates.reduced.map((entry) => entry.rate)).toEqual([0, 9]);
    expect(rates.rates.map((entry) => entry.kind)).toEqual(["standard", "reduced", "reduced"]);
    expect(client.taxes.selectCountryRate(rates).ratePercent).toBe(21);
    expect(() => client.taxes.selectCountryRate(rates, { kind: "reduced" })).toThrow(
      /Multiple REDUCED_RATE/
    );
    expect(client.taxes.selectCountryRate(rates, { kind: "reduced", rate: 9 }).ratePercent).toBe(9);
  });
  it("caches today's country rates once and skips cache when disabled or for other dates", async () => {
    let liveCalls = 0;
    const vatPayload = {
      objects: [{ rate: 21, type: "STANDARD_RATE" }]
    };
    const instance = axios.create({
      adapter: adapter((config) => {
        if (String(config.url ?? "").includes("Vat/getByCountryAndDate")) {
          liveCalls += 1;
          return jsonResponse(config, vatPayload);
        }
        return jsonResponse(config, { objects: { version: "2.0" } });
      })
    });
    const cached = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: instance
    });
    const first = await cached.taxes.getCountryRates({ countryCode: "NL" });
    const second = await cached.taxes.getCountryRates({ countryCode: "nl" });
    expect(first.standard?.rate).toBe(21);
    expect(second.standard?.rate).toBe(21);
    expect(liveCalls).toBe(1);
    await cached.taxes.getCountryRates({ countryCode: "NL", date: "2020-01-01" });
    await cached.taxes.getCountryRates({ countryCode: "NL", date: "2020-01-01" });
    expect(liveCalls).toBe(3);
    liveCalls = 0;
    const uncached = createSevdeskClient({
      apiToken: "test-token",
      cacheCountryRates: false,
      axiosInstance: instance
    });
    await uncached.taxes.getCountryRates({ countryCode: "DE" });
    await uncached.taxes.getCountryRates({ countryCode: "DE" });
    expect(liveCalls).toBe(2);
    cached.taxes.clearCountryRateCache();
    await cached.taxes.getCountryRates({ countryCode: "NL" });
    expect(liveCalls).toBe(3);
  });
  it("discards the today-only country-rate cache after UTC midnight (fake timers)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-31T15:00:00.000Z"));
    let liveCalls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (String(config.url ?? "").includes("Vat/getByCountryAndDate")) {
            liveCalls += 1;
            const date = String((config.params as { date?: string } | undefined)?.date ?? "");
            const rate = date === "2026-07-31" ? 21 : 22;
            return jsonResponse(config, {
              objects: [{ rate, type: "STANDARD_RATE" }]
            });
          }
          return jsonResponse(config, { objects: { version: "2.0" } });
        })
      })
    });
    try {
      const dayOneA = await client.taxes.getCountryRates({ countryCode: "NL" });
      const dayOneB = await client.taxes.getCountryRates({ countryCode: "NL" });
      expect(dayOneA.standard?.rate).toBe(21);
      expect(dayOneB.standard?.rate).toBe(21);
      expect(dayOneA.date).toBe("2026-07-31");
      expect(liveCalls).toBe(1);
      vi.setSystemTime(new Date("2026-08-01T00:00:01.000Z"));
      const dayTwoA = await client.taxes.getCountryRates({ countryCode: "NL" });
      const dayTwoB = await client.taxes.getCountryRates({ countryCode: "NL" });
      expect(dayTwoA.date).toBe("2026-08-01");
      expect(dayTwoA.standard?.rate).toBe(22);
      expect(dayTwoB.standard?.rate).toBe(22);
      expect(liveCalls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
  it("prefers application VatRateProvider over live rates", async () => {
    let providerDate: Date | undefined;
    const client = createSevdeskClient({
      apiToken: "test-token",
      taxRateSource: {
        getStandardRate: (code, context) => {
          providerDate = context?.asOf;
          return code === "NL"
            ? { ratePercent: 21, version: "application-rates-2025-06" }
            : undefined;
        }
      },
      useLiveCountryRates: false,
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          const url = String(config.url ?? "");
          if (url.includes("bookkeepingSystemVersion")) {
            return jsonResponse(config, { objects: { version: "2.0" } });
          }
          return jsonResponse(config, {
            objects: [{ id: "150", objectName: "StaticCountry", code: "NL", name: "Netherlands" }],
            total: 1
          });
        })
      })
    });
    const result = await client.taxes.resolveSale({
      country: "NL",
      euConsumerTaxation: "oss-destination",
      effectiveDate: "2025-06-30"
    });
    expect(result.decision.rateSource).toMatchObject({
      ratePercent: 21,
      source: "application",
      version: "application-rates-2025-06"
    });
    expect(providerDate?.toISOString()).toBe("2025-06-30T00:00:00.000Z");
  });
  it("lets an explicit per-call rate provider override the client default", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      taxRateSource: {
        getStandardRate: () => ({ ratePercent: 20, version: "client-default" })
      },
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          const url = String(config.url ?? "");
          if (url.includes("bookkeepingSystemVersion")) {
            return jsonResponse(config, { objects: { version: "2.0" } });
          }
          return jsonResponse(config, {
            objects: [{ id: "150", objectName: "StaticCountry", code: "NL", name: "Netherlands" }],
            total: 1
          });
        })
      })
    });
    const result = await client.taxes.resolveSale({
      country: "NL",
      euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
      rateSource: {
        getStandardRate: () => ({ ratePercent: 21, version: "per-call" })
      }
    });
    expect(result.decision.rateSource).toMatchObject({
      ratePercent: 21,
      source: "application",
      version: "per-call"
    });
  });
});

describe("ReceiptGuidance", () => {
  it("normalizes guidance and checks an exact voucher tuple", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          return jsonResponse(config, {
            objects: [
              {
                accountDatevId: 1200,
                accountNumber: "3400",
                accountName: "Wareneingang",
                allowedReceiptTypes: ["EXPENSE"],
                allowedTaxRules: [
                  {
                    id: 9,
                    name: "VORST_ABZ_AUFW",
                    taxRates: ["ZERO", "SEVEN", "NINETEEN", "FUTURE_RATE"]
                  }
                ]
              }
            ]
          });
        })
      })
    });
    const result = await client.taxes.checkVoucherCompatibility({
      direction: "expense",
      account: refs.accountDatev(1200),
      taxRule: ExpenseTaxRule.DEDUCTIBLE_INPUT_TAX,
      taxRate: TaxRate.STANDARD_19
    });
    expect(calls[0]?.url).toBe("/ReceiptGuidance/forExpense");
    expect(result.data.compatible).toBe(true);
    expect(result.data.guidance?.rules[0]?.rates).toContainEqual({
      token: "FUTURE_RATE",
      known: false
    });
  });
});
