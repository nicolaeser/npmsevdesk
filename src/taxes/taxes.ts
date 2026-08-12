import type { SevdeskClient } from "../client/sevdesk-client.js";
import { requireCollection } from "../domain/normalizers.js";
import type { ResultFor } from "../types/operation.js";
import type { operations } from "../types/openapi.js";
import type { RequestOptions } from "../types/config.js";
import { normalizeSevdeskId } from "../types/references.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../utils/errors.js";
import { mapPaginatedResultData, mapResultData } from "../utils/result.js";
import { BookkeepingSystem } from "./constants.js";
import { determineGermanDigitalService } from "./digital-service.js";
import { normalizeGuidance } from "./guidance.js";
import {
  formatRateDate,
  isIsoCountryCode,
  normalizeCountryCode,
  normalizeRateDate,
  parseCountryRates,
  resolveCountryRate,
  selectCountryRate,
  SEVDESK_COUNTRY_VAT_PATH,
  type CountryRates,
  type DatedResolvedVatRate,
  type SelectCountryRateOptions,
  type VatRateProvider
} from "./rates/index.js";
import {
  calculateTaxedPrice,
  toInvoicePositionPrice,
  type CalculateTaxedPriceInput,
  type TaxedPrice
} from "./pricing.js";
import { determineGermanSale, prepareGermanSaleInput } from "./sale/index.js";
import { resolveTaxSelection } from "./selection.js";
import {
  isValidVatIdFormat,
  normalizeVatId,
  parseVatId,
  validateVatIdFormat,
  type VatIdFormatResult
} from "./vat-id.js";
import type {
  GermanDigitalServiceTaxInput,
  GermanDigitalServiceTaxRuleValue,
  GermanDigitalServiceTaxTreatmentValue,
  GermanSaleQuoteResult,
  GermanSaleResolutionResult,
  GermanSaleTaxInput,
  CountryRatesResult,
  TaxDestinationCountry,
  TaxGuidanceQuery,
  TaxGuidanceResult,
  TaxProfile,
  TaxProfileResult,
  TaxResolutionResult,
  TaxRuleForDirection,
  TaxSelection,
  TaxTreatmentValue,
  VoucherTaxCheckFailureReason,
  VoucherTaxCheckInput,
  VoucherTaxCheckResult
} from "./types.js";
import { resolveEnumValueStrict, TaxRule } from "../enums/domain-enums.js";
import { assertTaxRate } from "./presets.js";

type GuidanceOperationResult =
  | ResultFor<operations["forAllAccounts"]>
  | ResultFor<operations["forAccountNumber"]>
  | ResultFor<operations["forTaxRule"]>
  | ResultFor<operations["forRevenue"]>
  | ResultFor<operations["forExpense"]>;

export class TaxesModule {
  private cachedProfile: TaxProfileResult | undefined;
  private profileRequest: Promise<TaxProfileResult> | undefined;
  private readonly rateProvider: VatRateProvider | undefined;
  private readonly useLiveRates: boolean;
  private readonly errorOnMissingCountryRates: boolean;
  private readonly cacheCountryRates: boolean;
  private readonly countryRateCache = new Map<string, Promise<CountryRatesResult>>();
  private countryRateCacheDay: string | undefined;
  public constructor(
    private readonly client: SevdeskClient,
    options: {
      readonly rateSource?: VatRateProvider;
      readonly useLiveCountryRates?: boolean;
      readonly errorOnMissingCountryRates?: boolean;
      readonly cacheCountryRates?: boolean;
    } = {}
  ) {
    this.rateProvider = options.rateSource;
    this.useLiveRates = options.useLiveCountryRates === true;
    this.errorOnMissingCountryRates = options.errorOnMissingCountryRates !== false;
    this.cacheCountryRates = options.cacheCountryRates !== false;
  }
  public async getProfile(requestOptions?: RequestOptions): Promise<TaxProfileResult> {
    if (this.cachedProfile !== undefined) return this.cachedProfile;
    if (this.profileRequest !== undefined) return this.profileRequest;
    const request = this.fetchProfile(requestOptions);
    this.profileRequest = request;
    try {
      const profile = await request;
      this.cachedProfile = profile;
      return profile;
    } finally {
      if (this.profileRequest === request) this.profileRequest = undefined;
    }
  }
  public async refreshProfile(requestOptions?: RequestOptions): Promise<TaxProfileResult> {
    const profile = await this.fetchProfile(requestOptions);
    this.cachedProfile = profile;
    return profile;
  }
  public async resolve<
    TDirection extends "revenue" | "expense",
    TTaxRule extends TaxRuleForDirection<TDirection>,
    TTreatment extends TaxTreatmentValue,
    TDefaultTaxRate extends number
  >(
    selection: TaxSelection<TDirection, TTaxRule, TTreatment, TDefaultTaxRate>,
    requestOptions?: RequestOptions
  ): Promise<TaxResolutionResult<TDirection, TTaxRule, TTreatment, TDefaultTaxRate>> {
    const profile = await this.getProfile(requestOptions);
    return mapResultData(
      profile,
      resolveTaxSelection(selection, profile.data.bookkeepingSystem)
    ) as TaxResolutionResult<TDirection, TTaxRule, TTreatment, TDefaultTaxRate>;
  }
  public async resolveDigitalService(
    input: GermanDigitalServiceTaxInput,
    requestOptions?: RequestOptions
  ): Promise<
    TaxResolutionResult<
      "revenue",
      GermanDigitalServiceTaxRuleValue,
      GermanDigitalServiceTaxTreatmentValue
    >
  > {
    return this.resolve(determineGermanDigitalService(input), requestOptions);
  }
  public validateVatIdFormat(raw: string, expectedCountry?: string): VatIdFormatResult {
    return validateVatIdFormat(raw, expectedCountry);
  }
  public isValidVatIdFormat(raw: string, expectedCountry?: string): boolean {
    return isValidVatIdFormat(raw, expectedCountry);
  }
  public normalizeVatId(raw: string): string {
    return normalizeVatId(raw);
  }
  public parseVatId(raw: string) {
    return parseVatId(raw);
  }
  public async resolveSale(
    input: GermanSaleTaxInput,
    requestOptions?: RequestOptions
  ): Promise<GermanSaleResolutionResult> {
    let countryLookup: Awaited<ReturnType<SevdeskClient["lookup"]["country"]>> | undefined;
    let countryRates: CountryRatesResult | undefined;
    const prepared = await prepareGermanSaleInput(input, {
      ...(input.rateSource !== undefined
        ? { rateSource: input.rateSource }
        : this.rateProvider !== undefined
          ? { rateSource: this.rateProvider }
          : {}),
      useLiveRates: this.useLiveRates,
      errorOnMissingCountryRates: this.errorOnMissingCountryRates,
      fetchCountryRates: async ({ countryCode, date }) => {
        countryRates = await this.getCountryRatesResult({ countryCode, date }, requestOptions);
        return countryRates.data;
      },
      lookupCountry: async (code) => {
        const country = await this.client.lookup.country(
          { code },
          requestOptions === undefined ? undefined : requestOptions
        );
        countryLookup = country;
        return {
          code: country.data.code,
          id: country.data.id as TaxDestinationCountry["id"],
          objectName: "StaticCountry"
        };
      }
    });
    const decision = determineGermanSale(prepared);
    const resolved = await this.resolve(decision.selection, requestOptions);
    return Object.assign(resolved, {
      decision,
      evidence: Object.freeze({
        ...(countryLookup === undefined ? {} : { countryLookup }),
        ...(countryRates === undefined ? {} : { countryRates }),
        ...(decision.rateSource === undefined ? {} : { rate: decision.rateSource })
      })
    }) as GermanSaleResolutionResult;
  }
  public calculateTaxedPrice<const TBasis extends "net" | "gross" = "net">(
    input: CalculateTaxedPriceInput<TBasis>
  ): TaxedPrice<TBasis> {
    return calculateTaxedPrice(input);
  }
  public async quoteSale<const TBasis extends "net" | "gross" = "net">(
    input: GermanSaleTaxInput & {
      readonly price: number;
      readonly quantity?: number;
      readonly basis?: TBasis;
      readonly decimals?: number;
    },
    requestOptions?: RequestOptions
  ): Promise<GermanSaleQuoteResult<TBasis>> {
    const { price, quantity, basis, decimals, ...saleInput } = input;
    const sale = await this.resolveSale(saleInput, requestOptions);
    const amounts = calculateTaxedPrice({
      price,
      taxRate: sale.data.defaultTaxRate,
      ...(quantity === undefined ? {} : { quantity }),
      ...(basis === undefined ? {} : { basis }),
      ...(decimals === undefined ? {} : { decimals })
    });
    return Object.freeze({
      tax: sale.data,
      decision: sale.decision,
      evidence: sale.evidence,
      amounts,
      position: toInvoicePositionPrice(amounts),
      showNet: amounts.basis === "net"
    }) as GermanSaleQuoteResult<TBasis>;
  }
  public async getCountryRates(
    input: { readonly countryCode: string; readonly date?: string | Date },
    requestOptions?: RequestOptions
  ): Promise<CountryRates> {
    return (await this.getCountryRatesResult(input, requestOptions)).data;
  }
  public async getCountryRatesResult(
    input: { readonly countryCode: string; readonly date?: string | Date },
    requestOptions?: RequestOptions
  ): Promise<CountryRatesResult> {
    const countryCode = normalizeCountryCode(input.countryCode);
    if (!isIsoCountryCode(countryCode)) {
      throw new SevdeskConfigurationError(
        `countryCode must be an ISO 3166-1 alpha-2 code; received "${input.countryCode}".`
      );
    }
    const date = normalizeRateDate(input.date ?? new Date());
    const today = formatRateDate(new Date());
    if (!this.cacheCountryRates || date !== today || requestOptions !== undefined) {
      return this.fetchCountryRatesResult(countryCode, date, requestOptions);
    }
    this.rotateCountryRateCacheDay(today);
    let pending = this.countryRateCache.get(countryCode);
    if (pending === undefined) {
      pending = this.fetchCountryRatesResult(countryCode, date, requestOptions);
      this.countryRateCache.set(countryCode, pending);
      pending.catch(() => {
        if (this.countryRateCache.get(countryCode) === pending) {
          this.countryRateCache.delete(countryCode);
        }
      });
    }
    return pending;
  }
  public clearCountryRateCache(): void {
    this.countryRateCache.clear();
    this.countryRateCacheDay = undefined;
  }
  private rotateCountryRateCacheDay(today: string): void {
    if (this.countryRateCacheDay === today) return;
    this.countryRateCache.clear();
    this.countryRateCacheDay = today;
  }
  public selectCountryRate(
    countryRates: CountryRates,
    options?: SelectCountryRateOptions
  ): DatedResolvedVatRate {
    return selectCountryRate(countryRates, options);
  }
  public async resolveCountryRate(
    input: {
      readonly countryCode: string;
      readonly date?: string | Date;
      readonly kind?: "standard" | "reduced";
      readonly rate?: number;
    },
    requestOptions?: RequestOptions
  ): Promise<DatedResolvedVatRate> {
    return resolveCountryRate({
      countryCode: input.countryCode,
      ...(input.date === undefined ? {} : { asOf: input.date }),
      ...(input.kind === undefined ? {} : { kind: input.kind }),
      ...(input.rate === undefined ? {} : { rate: input.rate }),
      ...(this.rateProvider === undefined ? {} : { provider: this.rateProvider }),
      useLiveRates: this.useLiveRates,
      errorOnMissingCountryRates: this.errorOnMissingCountryRates,
      fetchCountryRates: async ({ countryCode, date }) =>
        this.getCountryRates({ countryCode, date }, requestOptions)
    });
  }
  public async listGuidance(
    query: TaxGuidanceQuery = { scope: "all" },
    requestOptions?: RequestOptions
  ): Promise<TaxGuidanceResult> {
    let result: GuidanceOperationResult;
    if ("accountNumber" in query) {
      if (!Number.isSafeInteger(query.accountNumber) || query.accountNumber < 0) {
        throw new SevdeskConfigurationError("accountNumber must be a non-negative integer.");
      }
      result = await this.client.raw.voucher.forAccountNumber({
        query: { accountNumber: query.accountNumber },
        ...(requestOptions === undefined ? {} : { options: requestOptions })
      });
    } else if ("taxRuleCode" in query) {
      const taxRuleCode = query.taxRuleCode.trim();
      if (!taxRuleCode) {
        throw new SevdeskConfigurationError("taxRuleCode cannot be empty.");
      }
      result = await this.client.raw.voucher.forTaxRule({
        query: { taxRule: taxRuleCode },
        ...(requestOptions === undefined ? {} : { options: requestOptions })
      });
    } else if (query.scope === "expense") {
      result = await this.client.raw.voucher.forExpense(
        requestOptions === undefined ? {} : { options: requestOptions }
      );
    } else if (query.scope === "revenue") {
      result = await this.client.raw.voucher.forRevenue(
        requestOptions === undefined ? {} : { options: requestOptions }
      );
    } else {
      result = await this.client.raw.voucher.forAllAccounts(
        requestOptions === undefined ? {} : { options: requestOptions }
      );
    }
    const guidance = requireCollection(result.data, "receipt guidance").map(normalizeGuidance);
    return mapPaginatedResultData(result, guidance) as TaxGuidanceResult;
  }
  public async checkVoucherCompatibility(
    input: VoucherTaxCheckInput,
    requestOptions?: RequestOptions
  ): Promise<VoucherTaxCheckResult> {
    assertTaxRate(input.taxRate);
    const resolvedRule = resolveEnumValueStrict(TaxRule, input.taxRule as never);
    const taxRule = typeof resolvedRule === "number" ? resolvedRule : Number(resolvedRule);
    if (!Number.isSafeInteger(taxRule) || taxRule <= 0) {
      throw new SevdeskConfigurationError("taxRule must resolve to a positive integer.");
    }
    const guidanceResult = await this.listGuidance({ scope: input.direction }, requestOptions);
    const hasAccountId = "id" in input.account && input.account.id !== undefined;
    const hasAccountNumber =
      "accountNumber" in input.account && input.account.accountNumber !== undefined;
    if (hasAccountId === hasAccountNumber) {
      throw new SevdeskConfigurationError(
        "Voucher tax check requires exactly one account id or accountNumber."
      );
    }
    const accountId = hasAccountId
      ? normalizeSevdeskId(input.account.id as string | number, "AccountDatev")
      : undefined;
    const accountNumber = hasAccountNumber ? String(input.account.accountNumber).trim() : undefined;
    if (accountNumber !== undefined && !accountNumber) {
      throw new SevdeskConfigurationError("accountNumber cannot be empty.");
    }
    const matches = guidanceResult.data.filter((entry) =>
      accountId === undefined
        ? entry.account.number === accountNumber
        : entry.account.id === accountId
    );
    const requested = {
      direction: input.direction,
      ...(accountId === undefined ? {} : { accountId }),
      ...(accountNumber === undefined ? {} : { accountNumber }),
      taxRule,
      taxRate: input.taxRate
    } as const;
    if (matches.length === 0) {
      return mapResultData(guidanceResult, {
        compatible: false,
        reasons: ["ACCOUNT_NOT_FOUND"],
        requested
      });
    }
    if (matches.length > 1) {
      return mapResultData(guidanceResult, {
        compatible: false,
        reasons: ["ACCOUNT_AMBIGUOUS"],
        requested
      });
    }
    const guidance = matches[0];
    if (guidance === undefined) {
      throw new SevdeskResponseValidationError("ReceiptGuidance matching failed unexpectedly.", {
        value: guidanceResult.json
      });
    }
    const receiptType = input.direction.toUpperCase();
    const rule = guidance.rules.find((candidate) => candidate.id === taxRule);
    const reasons: VoucherTaxCheckFailureReason[] = [];
    if (!guidance.receiptTypes.includes(receiptType)) reasons.push("RECEIPT_TYPE_NOT_ALLOWED");
    if (rule === undefined) {
      reasons.push("TAX_RULE_NOT_ALLOWED");
    } else if (!rule.rates.some((rate) => rate.known && rate.percent === input.taxRate)) {
      reasons.push(
        rule.rates.some((rate) => !rate.known) ? "TAX_RATE_UNRECOGNIZED" : "TAX_RATE_NOT_ALLOWED"
      );
    }
    if (reasons.length === 0) {
      return mapResultData(guidanceResult, {
        compatible: true,
        reasons: [],
        guidance,
        requested
      });
    }
    return mapResultData(guidanceResult, {
      compatible: false,
      reasons: reasons as [VoucherTaxCheckFailureReason, ...VoucherTaxCheckFailureReason[]],
      guidance,
      requested
    });
  }
  private async fetchProfile(requestOptions?: RequestOptions): Promise<TaxProfileResult> {
    const result = await this.client.raw.basics.bookkeepingSystemVersion(
      requestOptions === undefined ? {} : { options: requestOptions }
    );
    const value = result.data;
    const version =
      value !== null && typeof value === "object" && "version" in value ? value.version : undefined;
    if (version !== BookkeepingSystem.LEGACY && version !== BookkeepingSystem.CURRENT) {
      throw new SevdeskResponseValidationError(
        "sevdesk returned no supported bookkeeping system version.",
        { value: result.json }
      );
    }
    const profile: TaxProfile =
      version === BookkeepingSystem.CURRENT
        ? Object.freeze({ bookkeepingSystem: "2.0", representation: "tax-rule" as const })
        : Object.freeze({ bookkeepingSystem: "1.0", representation: "legacy-tax-type" as const });
    return mapResultData(result, profile) as TaxProfileResult;
  }
  private async fetchCountryRatesResult(
    countryCode: string,
    date: string,
    requestOptions?: RequestOptions
  ): Promise<CountryRatesResult> {
    const result = await this.client.request<{ readonly objects?: readonly unknown[] }, undefined>({
      method: "GET",
      path: SEVDESK_COUNTRY_VAT_PATH,
      query: {
        countryCode: countryCode.toLowerCase(),
        date
      },
      retrySafe: true,
      ...(requestOptions === undefined ? {} : { options: requestOptions })
    });
    const objects = result.objects;
    if (!Array.isArray(objects)) {
      throw new SevdeskResponseValidationError(
        "sevdesk Vat/getByCountryAndDate returned a malformed objects collection.",
        { value: result.json }
      );
    }
    return mapResultData(
      result,
      parseCountryRates(countryCode, date, objects)
    ) as CountryRatesResult;
  }
}

export { resolveTaxSelection } from "./selection.js";
export { determineGermanDigitalService } from "./digital-service.js";
