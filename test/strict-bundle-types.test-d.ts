import {
  InvoiceStatus,
  TaxRule,
  rawEnumCode,
  resolveEnumValueStrict
} from "../src/enums/domain-enums.js";
import type {
  CheckAccountSelector,
  ContactCreateInput,
  FinalisingMarkSentDelivery,
  InvoiceFinalisingPlan,
  InvoiceFactoryInput,
  InvoicePositionInput,
  StandardEmailDelivery,
  TaxConfiguration,
  VoucherFactoryInput,
  VoucherPosition20Input
} from "../src/bundles/types.js";
import { assertNonEmpty, buildDeliveryPayload, nonEmpty } from "../src/bundles/builders.js";
import { taxes } from "../src/taxes/presets.js";
import { refs } from "../src/types/references.js";

const invoice = {
  invoiceDate: "2026-07-30",
  contact: refs.contact(1),
  contactPerson: refs.sevUser(2),
  currency: "EUR",
  tax: taxes.manual.sales({
    bookkeepingSystem: "2.0",
    taxRule: TaxRule.STANDARD_TAXABLE
  })
} as const;

const invoicePosition = {
  quantity: 1,
  price: 100,
  taxRate: 19,
  unity: refs.unity(1)
} as const;

const validInvoice = {
  invoice: {
    ...invoice,
    status: InvoiceStatus.DRAFT,
    invoiceType: "normal"
  },
  positions: [invoicePosition]
} satisfies InvoiceFactoryInput;
void validInvoice;

const knownStatus: InvoiceFactoryInput["invoice"]["status"] = 100;
void knownStatus;

const futureStatus = rawEnumCode("InvoiceStatus", 150);
void (futureStatus satisfies import("../src/enums/domain-enums.js").InvoiceStatusInput);

const wrongDomainStatus = rawEnumCode("OrderStatus", 150);
// @ts-expect-error raw escape hatches cannot cross enum domains
void (wrongDomainStatus satisfies import("../src/enums/domain-enums.js").InvoiceStatusInput);
// @ts-expect-error the public resolver enforces the same domain boundary
resolveEnumValueStrict(InvoiceStatus, wrongDomainStatus);

const futureDelivery = buildDeliveryPayload({
  channel: "mark-sent",
  sendType: rawEnumCode("SendType", "NEW")
});
const retainedFutureCode: "NEW" = futureDelivery.sendType;
void retainedFutureCode;

// @ts-expect-error unknown unbranded status codes are rejected
const unknownStatus: import("../src/enums/domain-enums.js").InvoiceStatusInput = 150;
void unknownStatus;

// @ts-expect-error semantic enum typos are rejected
const invalidInvoiceType: InvoiceFactoryInput["invoice"]["invoiceType"] = "norml";
void invalidInvoiceType;

// @ts-expect-error Factory workflows require at least one position
const emptyInvoice: InvoiceFactoryInput = { invoice, positions: [] };
void emptyInvoice;

const dynamicPositions: InvoicePositionInput[] = [invoicePosition];
const narrowedPositions = nonEmpty(dynamicPositions, "invoice positions");
void ({ invoice, positions: narrowedPositions } satisfies InvoiceFactoryInput);

assertNonEmpty(dynamicPositions, "invoice positions");
void ({ invoice, positions: dynamicPositions } satisfies InvoiceFactoryInput);

const organisation = {
  kind: "organisation",
  name: "Acme GmbH",
  category: "customer"
} satisfies ContactCreateInput;
void organisation;

const customTaxContact = {
  kind: "organisation",
  name: "Custom Tax GmbH",
  category: "customer",
  taxType: "custom",
  taxSet: refs.taxSet(42)
} satisfies ContactCreateInput;
void customTaxContact;

// @ts-expect-error a contact's custom legacy tax default requires its TaxSet
const invalidCustomTaxContact: ContactCreateInput = {
  kind: "organisation",
  name: "Broken Tax GmbH",
  category: "customer",
  taxType: "custom"
};
void invalidCustomTaxContact;

const person = {
  kind: "person",
  firstName: "Ada",
  lastName: "Lovelace",
  organisation: refs.contact(1),
  category: "customer"
} satisfies ContactCreateInput;
void person;

// @ts-expect-error a person cannot also carry an organisation name
const invalidPerson: ContactCreateInput = {
  kind: "person",
  firstName: "Ada",
  lastName: "Lovelace",
  name: "Analytical Engines Ltd",
  category: "customer"
};
void invalidPerson;

const customLegacyTax = {
  bookkeepingSystem: "1.0",
  taxType: "custom",
  taxSet: refs.taxSet(42)
} satisfies TaxConfiguration;
void customLegacyTax;

// @ts-expect-error custom legacy tax requires a taxSet
const missingCustomTaxSet: TaxConfiguration = {
  bookkeepingSystem: "1.0",
  taxType: "custom"
};
void missingCustomTaxSet;

const netPosition = {
  taxRate: 19,
  net: true,
  sumNet: 100,
  accountDatev: refs.accountDatev(1)
} satisfies VoucherPosition20Input;
void netPosition;

// @ts-expect-error a net position cannot provide the read-only gross sum
const contradictoryAmount: VoucherPosition20Input = {
  ...netPosition,
  sumGross: 119
};
void contradictoryAmount;

const voucher20 = {
  voucher: {
    voucherDate: "2026-07-30",
    creditDebit: "expense",
    tax: taxes.manual.expense({
      bookkeepingSystem: "2.0",
      taxRule: TaxRule.DEDUCTIBLE_INPUT_TAX
    })
  },
  positions: [netPosition]
} satisfies VoucherFactoryInput;
void voucher20;

// @ts-expect-error bookkeeping 2.0 positions require accountDatev
const wrongVoucherAccount: VoucherFactoryInput = {
  voucher: {
    voucherDate: "2026-07-30",
    creditDebit: "expense",
    tax: taxes.manual.expense({
      bookkeepingSystem: "2.0",
      taxRule: TaxRule.DEDUCTIBLE_INPUT_TAX
    })
  },
  positions: [
    {
      taxRate: 19,
      net: true,
      sumNet: 100,
      accountingType: refs.accountingType(1)
    }
  ]
};
void wrongVoucherAccount;

const accountSelector = { iban: "DE02120300000000202051" } satisfies CheckAccountSelector;
void accountSelector;

// @ts-expect-error an empty selector could accidentally select an unrelated account
const emptySelector: CheckAccountSelector = {};
void emptySelector;

const standardEmail = {
  channel: "email",
  toEmail: "customer@example.test",
  subject: "Document",
  text: "Attached"
} satisfies StandardEmailDelivery;
void standardEmail;

const invalidStandardEmail: StandardEmailDelivery = {
  ...standardEmail,
  // @ts-expect-error only invoice email delivery supports sendXml
  sendXml: true
};
void invalidStandardEmail;

const draftDelivery: FinalisingMarkSentDelivery = {
  channel: "mark-sent",
  // @ts-expect-error a finalising delivery cannot deliberately remain a draft
  sendDraft: true
};
void draftDelivery;

const validFinalisingPlan = {
  delivery: { channel: "mark-sent" },
  enshrine: true
} satisfies InvoiceFinalisingPlan;
void validFinalisingPlan;

// @ts-expect-error at least one finalising action is required
const emptyFinalisingPlan: InvoiceFinalisingPlan = {};
void emptyFinalisingPlan;

// @ts-expect-error a newly created draft must transition before it can be enshrined
const enshrineOnlyFinalisingPlan: InvoiceFinalisingPlan = { enshrine: true };
void enshrineOnlyFinalisingPlan;

// @ts-expect-error enshrine false is not itself a finalising action
const falseOnlyFinalisingPlan: InvoiceFinalisingPlan = { enshrine: false };
void falseOnlyFinalisingPlan;

const referencedPart = refs.part(1);
const referencedCostCentre = refs.costCentre(2);
void [referencedPart, referencedCostCentre];
