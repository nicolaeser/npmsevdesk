import {
  BookkeepingSystem,
  EuConsumerTaxation,
  ExpenseTaxRule,
  resolveTaxSelection,
  SaleProduct,
  SalesTaxRule,
  SellerTaxScheme,
  taxes,
  TaxCustomerType,
  TaxRate,
  type SevdeskClient,
  type CreditNoteFactoryInput,
  type GermanSaleDecision,
  type GermanSaleQuoteResult,
  type GermanSaleResolutionResult,
  type GermanSaleTaxInput,
  type InvoiceFactoryInput,
  type VoucherFactoryInput
} from "../src/index.js";
import { refs } from "../src/types/references.js";

declare const client: SevdeskClient;
const france = { code: "FR", ...refs.country(33) } as const;

const currentSales = resolveTaxSelection(
  taxes.revenue.domestic({ rate: TaxRate.STANDARD_19 }),
  BookkeepingSystem.CURRENT
);
const currentExpense = resolveTaxSelection(
  taxes.expense.deductible({ rate: TaxRate.STANDARD_19 }),
  BookkeepingSystem.CURRENT
);
const currentOss = resolveTaxSelection(
  taxes.revenue.ossElectronicService({ destinationCountry: france, rate: 20 }),
  BookkeepingSystem.CURRENT
);

// @ts-expect-error OSS presets require an exact StaticCountry lookup result, not only a code.
taxes.revenue.ossElectronicService({ destinationCountry: "FR", rate: 20 });

const inheritedInvoice = {
  invoice: {
    invoiceDate: "2026-07-31",
    contact: refs.contact(1),
    contactPerson: refs.sevUser(2),
    currency: "EUR",
    tax: currentSales
  },
  positions: [{ quantity: 1, price: 100, unity: refs.unity(1) }]
} satisfies InvoiceFactoryInput;

const inheritedVoucher = {
  voucher: {
    voucherDate: "2026-07-31",
    creditDebit: "expense",
    tax: currentExpense
  },
  positions: [{ net: true, sumNet: 100, accountDatev: refs.accountDatev(1) }]
} satisfies VoucherFactoryInput;

const invalidInvoiceRule: InvoiceFactoryInput = {
  invoice: {
    invoiceDate: "2026-07-31",
    contact: refs.contact(1),
    contactPerson: refs.sevUser(2),
    currency: "EUR",
    // @ts-expect-error Expense tax configurations cannot be used on sales invoices.
    tax: taxes.manual.expense({
      bookkeepingSystem: "2.0",
      taxRule: ExpenseTaxRule.DEDUCTIBLE_INPUT_TAX
    })
  },
  positions: [{ quantity: 1, price: 100, taxRate: 19, unity: refs.unity(1) }]
};

// @ts-expect-error Only a resolved plan supplies an inheritable default rate.
const missingRawRate: InvoiceFactoryInput = {
  invoice: {
    invoiceDate: "2026-07-31",
    contact: refs.contact(1),
    contactPerson: refs.sevUser(2),
    currency: "EUR",
    tax: taxes.manual.sales({
      bookkeepingSystem: "2.0",
      taxRule: SalesTaxRule.STANDARD_TAXABLE
    })
  },
  positions: [{ quantity: 1, price: 100, unity: refs.unity(1) }]
};

const invalidVoucherDirection: VoucherFactoryInput = {
  // @ts-expect-error A revenue rule cannot be paired with an expense voucher.
  voucher: {
    voucherDate: "2026-07-31",
    creditDebit: "expense",
    tax: taxes.manual.voucherRevenue({
      bookkeepingSystem: "2.0",
      taxRule: SalesTaxRule.STANDARD_TAXABLE
    })
  },
  positions: [{ net: true, sumNet: 100, taxRate: 19, accountDatev: refs.accountDatev(1) }]
};

const invalidResolvedOssVoucher: VoucherFactoryInput = {
  voucher: {
    voucherDate: "2026-07-31",
    creditDebit: "revenue",
    // @ts-expect-error Resolved OSS plans remain forbidden for revenue vouchers.
    tax: currentOss
  },
  positions: [{ net: true, sumNet: 100, accountDatev: refs.accountDatev(1) }]
};

const missingCreditNoteSource: CreditNoteFactoryInput = {
  // @ts-expect-error UNDERACHIEVEMENT credit notes require a source invoice in 2.0.
  creditNote: {
    creditNoteDate: "2026-07-31",
    contact: refs.contact(1),
    contactPerson: refs.sevUser(2),
    currency: "EUR",
    bookingCategory: "UNDERACHIEVEMENT",
    tax: currentOss
  },
  positions: [{ quantity: 1, price: 10, unity: refs.unity(1) }]
};

const bareCuratedTax: InvoiceFactoryInput = {
  invoice: {
    invoiceDate: "2026-07-31",
    contact: refs.contact(1),
    contactPerson: refs.sevUser(2),
    currency: "EUR",
    // @ts-expect-error Bare wire fields require the explicit taxes.manual.sales() escape hatch.
    tax: { bookkeepingSystem: "2.0", taxRule: SalesTaxRule.STANDARD_TAXABLE }
  },
  positions: [{ quantity: 1, price: 100, taxRate: 19, unity: refs.unity(1) }]
};

clientSideVatEvidence({
  status: "valid",
  value: "FR12345678901",
  country: "FR",
  checkedAt: "2026-07-31T12:00:00.000Z",
  provider: "VIES"
});

// @ts-expect-error Valid VAT-ID evidence requires auditable verification fields.
clientSideVatEvidence({ status: "valid", value: "FR12345678901" });

function clientSideVatEvidence(value: import("../src/index.js").VatIdEvidence): void {
  void value;
}

// @ts-expect-error A small-business decision requires an explicit caller assertion.
client.taxes.resolveDigitalService({
  sellerTaxScheme: SellerTaxScheme.SMALL_BUSINESS,
  customer: { type: "consumer", country: "DE" }
});

client.taxes.resolveSale({
  country: "NL",
  euConsumerTaxation: "oss-destination",
  effectiveDate: "2026-07-31"
});

// @ts-expect-error Canonical customerType and compatibility type are mutually exclusive.
client.taxes.resolveSale({ country: "DE", customerType: "business", type: "company" });

// @ts-expect-error Destination-only fields require the explicit OSS branch.
client.taxes.resolveSale({ country: "NL", destinationRate: 21 });

const consumerWithVat = {
  country: "FR",
  customerType: TaxCustomerType.CONSUMER,
  vatId: { status: "invalid", value: "FR123" }
} as const;
// @ts-expect-error Consumer sales cannot carry business VAT-ID evidence.
client.taxes.resolveSale(consumerWithVat);

// @ts-expect-error The omitted customer type defaults to consumer, so VAT evidence is invalid.
client.taxes.resolveSale({ country: "FR", vatId: { status: "not-checked" } });

// @ts-expect-error VAT evidence age is meaningful only when VAT evidence is supplied.
client.taxes.resolveSale({ country: "FR", vatEvidenceMaxAgeDays: 30 });

// @ts-expect-error Evidence age is evaluated only for a verified VALID result.
client.taxes.resolveSale({
  country: "FR",
  type: "company",
  vatId: { status: "unavailable" },
  vatEvidenceMaxAgeDays: 30
});

const consumerWithBusinessFallback = {
  country: "FR",
  type: "private",
  euBusinessWithoutVat: "tax-as-consumer",
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION
} as const;
// @ts-expect-error euBusinessWithoutVat is a business-only decision.
client.taxes.resolveSale(consumerWithBusinessFallback);

// @ts-expect-error §19 selection makes OSS and destination-rate fields inapplicable.
client.taxes.resolveSale({
  country: "FR",
  smallBusiness: true,
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
  destinationRate: 20
});

const smallBusinessWithVat = {
  country: "FR",
  customerType: TaxCustomerType.BUSINESS,
  smallBusiness: true,
  vatId: { status: "invalid" }
} as const;
// @ts-expect-error §19 selection does not consume VAT-ID evidence.
client.taxes.resolveSale(smallBusinessWithVat);

const validFrenchVat = {
  status: "valid",
  value: "FR12345678901",
  country: "FR",
  checkedAt: "2026-07-31T12:00:00.000Z",
  provider: "VIES"
} as const;

// @ts-expect-error Valid VAT evidence selects B2B treatment; OSS fields would be ignored.
client.taxes.resolveSale({
  country: "FR",
  customerType: TaxCustomerType.BUSINESS,
  vatId: validFrenchVat,
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION
});

const validVatWithFallback = {
  country: "FR",
  type: "company",
  vatId: validFrenchVat,
  euBusinessWithoutVat: "fail"
} as const;
// @ts-expect-error euBusinessWithoutVat is inapplicable after valid VAT evidence.
client.taxes.resolveSale(validVatWithFallback);

client.taxes.resolveSale({
  country: "FR",
  type: "company",
  vatId: { status: "unavailable" },
  euBusinessWithoutVat: "tax-as-consumer",
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION
});

const datedFrenchRate = {
  countryCode: "FR",
  ratePercent: 20,
  kind: "standard",
  source: "application",
  version: "rates-2026-07",
  asOf: "2026-07-31"
} as const;

client.taxes.resolveSale({
  country: "FR",
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
  effectiveDate: "2026-07-31",
  rateLookup: datedFrenchRate
});

// @ts-expect-error An OSS destination decision does not consume the German domestic rate.
client.taxes.resolveSale({
  country: "FR",
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
  domesticTaxRate: 19
});

const undatedFrenchRate = {
  countryCode: "FR",
  ratePercent: 20,
  kind: "standard",
  source: "application",
  version: "rates-2026-07"
} as const;
const ossWithUndatedRate = {
  country: "FR",
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
  rateLookup: undatedFrenchRate
} as const;
// @ts-expect-error A stored rate lookup must be tied to an exact calendar day.
client.taxes.resolveSale(ossWithUndatedRate);

// @ts-expect-error Explicit rate and rate lookup are mutually exclusive rate modes.
client.taxes.resolveSale({
  country: "FR",
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
  destinationRate: 20,
  rateLookup: datedFrenchRate
});

// @ts-expect-error Explicit rate and application provider are mutually exclusive rate modes.
client.taxes.resolveSale({
  country: "FR",
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
  destinationRate: 20,
  rateSource: { getStandardRate: () => ({ ratePercent: 20, version: "test" }) }
});

// @ts-expect-error Lookup evidence and an application provider are mutually exclusive rate modes.
client.taxes.resolveSale({
  country: "FR",
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
  rateLookup: datedFrenchRate,
  rateSource: { getStandardRate: () => ({ ratePercent: 20, version: "test" }) }
});

const canonicalSaleInput = {
  country: "NL",
  customerType: TaxCustomerType.CONSUMER,
  product: SaleProduct.ELECTRONIC_SERVICE,
  euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
  effectiveDate: "2026-07-31",
  destinationRate: 21
} satisfies GermanSaleTaxInput;
void canonicalSaleInput;

client.taxes.resolveSale({
  country: "DE",
  template: "german-saas",
  // @ts-expect-error A sale template and explicit product are mutually exclusive.
  product: "electronic-service"
});

async function verifyCorrelatedSaleDecision(): Promise<void> {
  const sale = await client.taxes.resolveSale({ country: "US" });
  if (sale.decision.treatment === "non-domestic-service") {
    const rule: 17 = sale.decision.taxRule;
    const region: "NON_EU" = sale.decision.region;
    void rule;
    void region;
  }
}

async function verifyCorrelatedQuoteBasis(): Promise<void> {
  const gross = await client.taxes.quoteSale({
    country: "DE",
    price: 119,
    basis: "gross"
  });
  const showNet: false = gross.showNet;
  const net = await client.taxes.quoteSale({ country: "DE", price: 100 });
  const defaultShowNet: true = net.showNet;
  void showNet;
  void defaultShowNet;
}

declare const saleDecision: GermanSaleDecision;
if (saleDecision.reason === "domestic-sale") {
  const region: "DE" = saleDecision.region;
  const treatment: "domestic-sale" = saleDecision.treatment;
  const noOssChoice: undefined = saleDecision.euConsumerTaxation;
  void region;
  void treatment;
  void noOssChoice;
}
if (saleDecision.reason === "eu-b2c-reviewed-seller-country-taxation") {
  const region: "EU" = saleDecision.region;
  const choice: "seller-country" = saleDecision.euConsumerTaxation;
  const noDestinationRate: undefined = saleDecision.rateSource;
  void region;
  void choice;
  void noDestinationRate;
}
if (saleDecision.reason === "eu-b2b-intra-community-supply") {
  const zeroRate: 0 = saleDecision.defaultTaxRate;
  const rule: 3 = saleDecision.taxRule;
  void zeroRate;
  void rule;
}
if (saleDecision.reason === "eu-oss-electronic-service") {
  const choice: "oss-destination" = saleDecision.euConsumerTaxation;
  const dated: string = saleDecision.rateSource.asOf;
  const rateMatchesDecision: number = saleDecision.rateSource.ratePercent;
  void choice;
  void dated;
  void rateMatchesDecision;
}

type IntraCommunityResolution = Extract<
  GermanSaleResolutionResult,
  { readonly decision: { readonly reason: "eu-b2b-intra-community-supply" } }
>;
declare const correlatedResolution: IntraCommunityResolution;
const resolutionRate: 0 = correlatedResolution.data.defaultTaxRate;
const resolutionTreatment: "intra-community-supply" = correlatedResolution.data.treatment;
if (correlatedResolution.data.bookkeepingSystem === "2.0") {
  const rule: 3 = correlatedResolution.data.taxRule;
  void rule;
}
void resolutionRate;
void resolutionTreatment;

type OssGoodsQuote = Extract<
  GermanSaleQuoteResult<"gross">,
  { readonly decision: { readonly reason: "eu-oss-goods" } }
>;
declare const correlatedQuote: OssGoodsQuote;
const quoteTreatment: "oss-goods" = correlatedQuote.tax.treatment;
const quoteChoice: "oss-destination" = correlatedQuote.decision.euConsumerTaxation;
const quoteRateDate: string = correlatedQuote.evidence.rate.asOf;
const quoteShowNet: false = correlatedQuote.showNet;
void quoteTreatment;
void quoteChoice;
void quoteRateDate;
void quoteShowNet;

client.taxes.resolveDigitalService({
  sellerTaxScheme: SellerTaxScheme.SMALL_BUSINESS,
  smallBusinessTreatment: "section-19",
  customer: { type: "consumer", country: "DE" }
});

// @ts-expect-error ReceiptGuidance selectors are mutually exclusive.
client.taxes.listGuidance({ scope: "expense", accountNumber: 3400 });

client.taxes.checkVoucherCompatibility({
  direction: "expense",
  // @ts-expect-error Voucher account identity is exactly one id or account number.
  account: { ...refs.accountDatev(1), accountNumber: "3400" },
  taxRule: ExpenseTaxRule.DEDUCTIBLE_INPUT_TAX,
  taxRate: 19
});

async function verifyDiscriminatedVoucherCheck(): Promise<void> {
  const check = await client.taxes.checkVoucherCompatibility({
    direction: "expense",
    account: refs.accountDatev(1),
    taxRule: ExpenseTaxRule.DEDUCTIBLE_INPUT_TAX,
    taxRate: 19
  });
  if (check.data.compatible) {
    const noReasons: readonly [] = check.data.reasons;
    const account = check.data.guidance.account;
    void noReasons;
    void account;
  } else {
    const reason = check.data.reasons[0];
    void reason;
  }
}

void inheritedInvoice;
void inheritedVoucher;
void invalidInvoiceRule;
void missingRawRate;
void invalidVoucherDirection;
void invalidResolvedOssVoucher;
void missingCreditNoteSource;
void bareCuratedTax;
void verifyDiscriminatedVoucherCheck;
void verifyCorrelatedSaleDecision;
void verifyCorrelatedQuoteBasis;
