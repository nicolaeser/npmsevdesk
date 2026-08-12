export const InvoiceStatus = {
  DEACTIVATED_RECURRING: 50,
  DRAFT: 100,
  OPEN: 200,
  OPEN_OR_DUE: 200,
  UNDOCUMENTED_500: 500,
  PARTIALLY_PAID: 750,
  PAID: 1000
} as const;

export const OrderStatus = {
  DRAFT: 100,
  DELIVERED: 200,
  REJECTED: 300,
  REJECTED_OR_CANCELLED: 300,
  ACCEPTED: 500,
  PARTIALLY_CALCULATED: 750,
  CALCULATED: 1000
} as const;

export const VoucherStatus = {
  DRAFT: 50,
  OPEN: 100,
  OPEN_OR_DUE: 100,
  TRANSFERRED: 150,
  PARTIALLY_PAID: 750,
  PAID: 1000
} as const;

export const CreditNoteStatus = {
  DRAFT: 100,
  OPEN: 200,
  PARTIALLY_PAID: 750,
  PAID: 1000,
  UNDOCUMENTED_300: 300,
  UNDOCUMENTED_500: 500
} as const;

export const ContactStatus = {
  LEAD: 100,
  PENDING: 500,
  ACTIVE: 1000
} as const;

export const CheckAccountStatus = {
  ARCHIVED: 0,
  ACTIVE: 100
} as const;

export const CheckAccountTransactionStatus = {
  CREATED: 100,
  LINKED: 200,
  PRIVATE: 300,
  AUTO_BOOKED: 350,
  BOOKED: 400
} as const;

export const PartStatus = {
  INACTIVE: 50,
  ACTIVE: 100
} as const;

export const DocumentStatus = {
  ACTIVE: 100
} as const;

export const ContactCategory = {
  SUPPLIER: 2,
  CUSTOMER: 3,
  PARTNER: 4,
  PROSPECT_CUSTOMER: 28
} as const;

export const InvoiceType = {
  NORMAL: "RE",
  RECURRING: "WKR",
  CANCELLATION: "SR",
  REMINDER: "MA",
  PARTIAL: "TR",
  ADVANCE: "AR",
  FINAL: "ER"
} as const;

export const InvoiceFromOrderPartialType = {
  FINAL: "RE",
  PARTIAL: "TR",
  ADVANCE: "AR"
} as const;

export const OrderType = {
  ESTIMATE: "AN",
  CONFIRMATION: "AB",
  DELIVERY_NOTE: "LI"
} as const;

export const VoucherType = {
  NORMAL: "VOU",
  RECURRING: "RV"
} as const;

export const VoucherDirection = {
  EXPENSE: "C",
  REVENUE: "D"
} as const;

export const SendType = {
  PRINT: "VPR",
  POSTAL: "VP",
  EMAIL: "VM",
  DOWNLOADED_PDF: "VPDF"
} as const;

export const BookingType = {
  FULL_PAYMENT: "FULL_PAYMENT",
  PARTIAL: "N",
  CASH_DISCOUNT: "CB",
  CURRENCY_FLUCTUATION: "CF",
  OTHER: "O",
  REMINDER_CHARGE: "OF",
  MONETARY_TRAFFIC_COST: "MTC"
} as const;

export const CommunicationWayType = {
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  WEB: "WEB",
  MOBILE: "MOBILE",
  FAX: "FAX"
} as const;

export const CommunicationWayKeyName = {
  WORK: "Arbeit",
  AUTOBOX: "Autobox",
  FAX: "Fax",
  MOBILE: "Mobil",
  NEWSLETTER: "Newsletter",
  PRIVATE: "Privat",
  INVOICE_ADDRESS: "Rechnungsadresse"
} as const;

export const CreditNoteBookingCategory = {
  PROVISION: "PROVISION",
  ROYALTY_ASSIGNED: "ROYALTY_ASSIGNED",
  ROYALTY_UNASSIGNED: "ROYALTY_UNASSIGNED",
  UNDERACHIEVEMENT: "UNDERACHIEVEMENT",
  ACCOUNTING_TYPE: "ACCOUNTING_TYPE"
} as const;

export const LegacyTaxType = {
  DEFAULT: "default",
  EU: "eu",
  NON_EU: "noteu",
  CUSTOM: "custom",
  SMALL_BUSINESS: "ss"
} as const;

export const TaxRule = {
  STANDARD_TAXABLE: 1,
  EXPORT: 2,
  INTRA_COMMUNITY_SUPPLY: 3,
  VAT_EXEMPT_SECTION_4: 4,
  REVERSE_CHARGE_13B_REVENUE: 5,
  INTRA_COMMUNITY_ACQUISITION: 8,
  DEDUCTIBLE_INPUT_TAX: 9,
  NON_DEDUCTIBLE_EXPENSE: 10,
  SMALL_BUSINESS_REVENUE: 11,
  REVERSE_CHARGE_13B_2_WITH_INPUT: 12,
  REVERSE_CHARGE_13B_WITHOUT_INPUT: 13,
  REVERSE_CHARGE_13B_1_EU: 14,
  NON_DOMESTIC_SERVICE: 17,
  OSS_GOODS: 18,
  OSS_ELECTRONIC_SERVICE: 19,
  OSS_OTHER_SERVICE: 20,
  REVERSE_CHARGE_18B: 21
} as const;

export const CheckAccountType = {
  ONLINE: "online",
  OFFLINE: "offline",
  REGISTER: "register"
} as const;

export const CheckAccountImportType = {
  CSV: "CSV",
  MT940: "MT940"
} as const;

export const ContactDepth = {
  ORGANISATIONS_ONLY: "0",
  ORGANISATIONS_AND_PEOPLE: "1"
} as const;

export const ReminderEligibilityFailureReason = {
  INELIGIBLE_STATUS: "INELIGIBLE_STATUS",
  NO_OUTSTANDING_BALANCE: "NO_OUTSTANDING_BALANCE",
  UNSENT_LAST_REMINDER: "UNSENT_LAST_REMINDER",
  UNSENT_LAST_DUNNING: "UNSENT_LAST_REMINDER",
  NOT_OVERDUE: "NOT_OVERDUE",
  UNDETERMINABLE_DUE_DATE: "UNDETERMINABLE_DUE_DATE"
} as const;

export const SortDirection = {
  ASCENDING: "ASC",
  DESCENDING: "DESC"
} as const;

export const RecurringInterval = {
  WEEKLY: "P0Y0M1W",
  EVERY_TWO_WEEKS: "P0Y0M2W",
  MONTHLY: "P0Y1M",
  EVERY_TWO_MONTHS: "P0Y2M",
  QUARTERLY: "P0Y3M",
  SEMIANNUALLY: "P0Y6M",
  YEARLY: "P1Y",
  EVERY_TWO_YEARS: "P2Y",
  EVERY_THREE_YEARS: "P3Y",
  EVERY_FOUR_YEARS: "P4Y",
  EVERY_FIVE_YEARS: "P5Y"
} as const;

export const TextTemplateCategory = {
  DOCUMENT: "DOCUMENT",
  LETTER: "LETTER",
  MAIL: "MAIL"
} as const;

export const TextTemplateTextType = {
  FOOT: "FOOT",
  HEAD: "HEAD",
  SIGNATURE: "SIGNATURE",
  SUBJECT: "SUBJECT",
  TEXT: "TEXT"
} as const;

export type EnumMap = Readonly<Record<string, string | number>>;
export type EnumValue<TMap extends EnumMap> = TMap[Extract<keyof TMap, string>];
export type EnumKey<TMap extends EnumMap> = Extract<keyof TMap, string>;

export type EnumDomain<TMap extends EnumMap> = TMap extends typeof InvoiceStatus
  ? "InvoiceStatus"
  : TMap extends typeof OrderStatus
    ? "OrderStatus"
    : TMap extends typeof VoucherStatus
      ? "VoucherStatus"
      : TMap extends typeof CreditNoteStatus
        ? "CreditNoteStatus"
        : TMap extends typeof ContactStatus
          ? "ContactStatus"
          : TMap extends typeof CheckAccountTransactionStatus
            ? "CheckAccountTransactionStatus"
            : TMap extends typeof CheckAccountStatus
              ? "CheckAccountStatus"
              : TMap extends typeof PartStatus
                ? "PartStatus"
                : TMap extends typeof ContactCategory
                  ? "ContactCategory"
                  : TMap extends typeof InvoiceType
                    ? "InvoiceType"
                    : TMap extends typeof InvoiceFromOrderPartialType
                      ? "InvoiceFromOrderPartialType"
                      : TMap extends typeof OrderType
                        ? "OrderType"
                        : TMap extends typeof VoucherType
                          ? "VoucherType"
                          : TMap extends typeof VoucherDirection
                            ? "VoucherDirection"
                            : TMap extends typeof SendType
                              ? "SendType"
                              : TMap extends typeof BookingType
                                ? "BookingType"
                                : TMap extends typeof CommunicationWayType
                                  ? "CommunicationWayType"
                                  : TMap extends typeof CommunicationWayKeyName
                                    ? "CommunicationWayKeyName"
                                    : TMap extends typeof CreditNoteBookingCategory
                                      ? "CreditNoteBookingCategory"
                                      : TMap extends typeof LegacyTaxType
                                        ? "LegacyTaxType"
                                        : TMap extends typeof TaxRule
                                          ? "TaxRule"
                                          : TMap extends typeof CheckAccountType
                                            ? "CheckAccountType"
                                            : TMap extends typeof CheckAccountImportType
                                              ? "CheckAccountImportType"
                                              : TMap extends typeof ContactDepth
                                                ? "ContactDepth"
                                                : TMap extends typeof SortDirection
                                                  ? "SortDirection"
                                                  : TMap extends typeof RecurringInterval
                                                    ? "RecurringInterval"
                                                    : TMap extends typeof TextTemplateCategory
                                                      ? "TextTemplateCategory"
                                                      : TMap extends typeof TextTemplateTextType
                                                        ? "TextTemplateTextType"
                                                        : TMap extends typeof DocumentStatus
                                                          ? "DocumentStatus"
                                                          : never;

type WidenEnumValue<TValue> =
  (TValue extends string ? string : never) | (TValue extends number ? number : never);

export type RawEnumCodeFor<TMap extends EnumMap> = RawEnumCode<
  EnumDomain<TMap>,
  WidenEnumValue<EnumValue<TMap>>
>;

type ReplaceAll<
  TValue extends string,
  TSearch extends string,
  TReplacement extends string
> = TValue extends `${infer THead}${TSearch}${infer TTail}`
  ? `${THead}${TReplacement}${ReplaceAll<TTail, TSearch, TReplacement>}`
  : TValue;

type SemanticEnumKey<TKey extends string> =
  | TKey
  | Lowercase<TKey>
  | Lowercase<ReplaceAll<TKey, "_", "-">>
  | Lowercase<ReplaceAll<TKey, "_", " ">>;

type NormalizedSemanticEnumKey<TInput extends string> = Uppercase<
  ReplaceAll<ReplaceAll<TInput, "-", "_">, " ", "_">
>;

export type EnumInput<TMap extends EnumMap> = EnumValue<TMap> | SemanticEnumKey<EnumKey<TMap>>;

const rawEnumCodeBrand: unique symbol = Symbol("npmsevdesk.rawEnumCode");

export interface RawEnumCode<
  TDomain extends string,
  TValue extends string | number = string | number
> {
  readonly domain: TDomain;
  readonly value: TValue;
  readonly [rawEnumCodeBrand]: true;
}

export type ResolvedEnumValue<TMap extends EnumMap, TInput> =
  TInput extends RawEnumCode<string, infer TValue>
    ? TValue
    : TInput extends EnumValue<TMap>
      ? TInput
      : TInput extends string
        ? NormalizedSemanticEnumKey<TInput> extends keyof TMap
          ? TMap[NormalizedSemanticEnumKey<TInput>]
          : never
        : never;

export function rawEnumCode<const TDomain extends string, const TValue extends string | number>(
  domain: TDomain,
  value: TValue
): RawEnumCode<TDomain, TValue> {
  if (!domain.trim()) {
    throw new TypeError("A raw enum code requires a non-empty domain name.");
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError("A raw numeric enum code must be finite.");
  }
  if (typeof value === "string" && !value.trim()) {
    throw new TypeError("A raw string enum code must be non-empty.");
  }
  return Object.freeze({
    domain,
    value,
    [rawEnumCodeBrand]: true as const
  });
}

export function resolveEnumValue<TMap extends EnumMap>(
  values: TMap,
  input: EnumInput<TMap> | string | number
): EnumValue<TMap> | string | number {
  if (typeof input === "number") return input;
  if ((Object.values(values) as readonly (string | number)[]).includes(input)) return input;
  const key = input.replaceAll(/[-\s]/g, "_").toUpperCase();
  if (Object.hasOwn(values, key)) return values[key as keyof TMap];
  if (/^-?\d+(?:\.\d+)?$/.test(input)) return Number(input);
  return input;
}

const enumDomainByMap = new Map<EnumMap, string>([
  [InvoiceStatus, "InvoiceStatus"],
  [OrderStatus, "OrderStatus"],
  [VoucherStatus, "VoucherStatus"],
  [CreditNoteStatus, "CreditNoteStatus"],
  [ContactStatus, "ContactStatus"],
  [CheckAccountStatus, "CheckAccountStatus"],
  [CheckAccountTransactionStatus, "CheckAccountTransactionStatus"],
  [PartStatus, "PartStatus"],
  [DocumentStatus, "DocumentStatus"],
  [ContactCategory, "ContactCategory"],
  [InvoiceType, "InvoiceType"],
  [InvoiceFromOrderPartialType, "InvoiceFromOrderPartialType"],
  [OrderType, "OrderType"],
  [VoucherType, "VoucherType"],
  [VoucherDirection, "VoucherDirection"],
  [SendType, "SendType"],
  [BookingType, "BookingType"],
  [CommunicationWayType, "CommunicationWayType"],
  [CommunicationWayKeyName, "CommunicationWayKeyName"],
  [CreditNoteBookingCategory, "CreditNoteBookingCategory"],
  [LegacyTaxType, "LegacyTaxType"],
  [TaxRule, "TaxRule"],
  [CheckAccountType, "CheckAccountType"],
  [CheckAccountImportType, "CheckAccountImportType"],
  [ContactDepth, "ContactDepth"],
  [SortDirection, "SortDirection"],
  [RecurringInterval, "RecurringInterval"],
  [TextTemplateCategory, "TextTemplateCategory"],
  [TextTemplateTextType, "TextTemplateTextType"]
]);

export function resolveEnumValueStrict<
  const TMap extends EnumMap,
  const TInput extends EnumInput<TMap> | RawEnumCode<string>
>(
  values: TMap,
  input: TInput extends EnumInput<TMap> | RawEnumCodeFor<TMap> ? TInput : never
): ResolvedEnumValue<TMap, TInput>;
export function resolveEnumValueStrict(
  values: EnumMap,
  input: string | number | RawEnumCode<string>
): string | number {
  if (typeof input === "object") {
    if (!input[rawEnumCodeBrand]) {
      throw new TypeError("Invalid raw enum code wrapper.");
    }
    const expectedDomain = enumDomainByMap.get(values);
    if (expectedDomain === undefined || input.domain !== expectedDomain) {
      throw new TypeError(
        `Raw enum code domain "${input.domain}" cannot be used with "${expectedDomain ?? "an unregistered enum map"}".`
      );
    }
    return input.value;
  }
  if ((Object.values(values) as readonly (string | number)[]).includes(input)) {
    return input;
  }
  if (typeof input === "string") {
    const key = input.replaceAll(/[-\s]/g, "_").toUpperCase();
    if (Object.hasOwn(values, key)) {
      const resolved = values[key];
      if (resolved !== undefined) return resolved;
    }
  }
  const domain = enumDomainByMap.get(values) ?? "enum";
  throw new TypeError(
    `Unknown ${domain} value "${String(input)}". Use rawEnumCode("${domain}", value) for an intentional forward-compatible code.`
  );
}

export function enumName<TMap extends EnumMap>(
  values: TMap,
  value: string | number
): EnumKey<TMap> | undefined {
  const entry = Object.entries(values).find(([, candidate]) => {
    if (candidate === value) return true;
    if (typeof candidate === "number" && typeof value === "string") {
      return String(candidate) === value.trim();
    }
    if (typeof candidate === "string" && typeof value === "number") {
      return candidate.trim() === String(value);
    }
    return false;
  });
  return entry?.[0] as EnumKey<TMap> | undefined;
}

export type InvoiceStatusValue = EnumValue<typeof InvoiceStatus>;
export type InvoiceStatusInput =
  EnumInput<typeof InvoiceStatus> | RawEnumCode<"InvoiceStatus", number>;
export type OrderStatusValue = EnumValue<typeof OrderStatus>;
export type OrderStatusInput = EnumInput<typeof OrderStatus> | RawEnumCode<"OrderStatus", number>;
export type VoucherStatusValue = EnumValue<typeof VoucherStatus>;
export type VoucherStatusInput =
  EnumInput<typeof VoucherStatus> | RawEnumCode<"VoucherStatus", number>;
export type CreditNoteStatusValue = EnumValue<typeof CreditNoteStatus>;
export type CreditNoteStatusInput =
  EnumInput<typeof CreditNoteStatus> | RawEnumCode<"CreditNoteStatus", number>;
export type ContactStatusValue = EnumValue<typeof ContactStatus>;
export type ContactStatusInput =
  EnumInput<typeof ContactStatus> | RawEnumCode<"ContactStatus", number>;
export type CheckAccountStatusValue = EnumValue<typeof CheckAccountStatus>;
export type CheckAccountStatusInput =
  EnumInput<typeof CheckAccountStatus> | RawEnumCode<"CheckAccountStatus", number>;
export type CheckAccountTransactionStatusValue = EnumValue<typeof CheckAccountTransactionStatus>;
export type CheckAccountTransactionStatusInput =
  | EnumInput<typeof CheckAccountTransactionStatus>
  | RawEnumCode<"CheckAccountTransactionStatus", number>;
export type PartStatusValue = EnumValue<typeof PartStatus>;
export type PartStatusInput = EnumInput<typeof PartStatus> | RawEnumCode<"PartStatus", number>;
export type DocumentStatusValue = EnumValue<typeof DocumentStatus>;
export type DocumentStatusInput =
  EnumInput<typeof DocumentStatus> | RawEnumCode<"DocumentStatus", number>;

export type ContactCategoryValue = EnumValue<typeof ContactCategory>;
export type ContactCategoryCodeInput =
  EnumInput<typeof ContactCategory> | RawEnumCode<"ContactCategory", number>;
export type InvoiceTypeValue = EnumValue<typeof InvoiceType>;
export type InvoiceTypeInput = EnumInput<typeof InvoiceType> | RawEnumCode<"InvoiceType", string>;
export type InvoiceFromOrderPartialTypeValue = EnumValue<typeof InvoiceFromOrderPartialType>;
export type InvoiceFromOrderPartialTypeInput =
  | EnumInput<typeof InvoiceFromOrderPartialType>
  | RawEnumCode<"InvoiceFromOrderPartialType", string>;
export type OrderTypeValue = EnumValue<typeof OrderType>;
export type OrderTypeInput = EnumInput<typeof OrderType> | RawEnumCode<"OrderType", string>;
export type VoucherTypeValue = EnumValue<typeof VoucherType>;
export type VoucherTypeInput = EnumInput<typeof VoucherType> | RawEnumCode<"VoucherType", string>;
export type VoucherDirectionValue = EnumValue<typeof VoucherDirection>;
export type VoucherDirectionInput =
  EnumInput<typeof VoucherDirection> | RawEnumCode<"VoucherDirection", string>;
export type SendTypeValue = EnumValue<typeof SendType>;
export type SendTypeInput = EnumInput<typeof SendType> | RawEnumCode<"SendType", string>;
export type BookingTypeValue = EnumValue<typeof BookingType>;
export type BookingTypeInput = EnumInput<typeof BookingType> | RawEnumCode<"BookingType", string>;
export type CommunicationWayTypeValue = EnumValue<typeof CommunicationWayType>;
export type CommunicationWayTypeInput =
  EnumInput<typeof CommunicationWayType> | RawEnumCode<"CommunicationWayType", string>;
export type CommunicationWayKeyNameValue = EnumValue<typeof CommunicationWayKeyName>;
export type CommunicationWayKeyNameInput =
  EnumInput<typeof CommunicationWayKeyName> | RawEnumCode<"CommunicationWayKeyName", string>;
export type CreditNoteBookingCategoryValue = EnumValue<typeof CreditNoteBookingCategory>;
export type CreditNoteBookingCategoryInput =
  EnumInput<typeof CreditNoteBookingCategory> | RawEnumCode<"CreditNoteBookingCategory", string>;
export type LegacyTaxTypeValue = EnumValue<typeof LegacyTaxType>;
export type LegacyTaxTypeInput =
  EnumInput<typeof LegacyTaxType> | RawEnumCode<"LegacyTaxType", string>;
export type TaxRuleValue = EnumValue<typeof TaxRule>;
export type TaxRuleInput = EnumInput<typeof TaxRule> | RawEnumCode<"TaxRule", number>;
export type CheckAccountTypeValue = EnumValue<typeof CheckAccountType>;
export type CheckAccountTypeInput =
  EnumInput<typeof CheckAccountType> | RawEnumCode<"CheckAccountType", string>;
export type CheckAccountImportTypeValue = EnumValue<typeof CheckAccountImportType>;
export type CheckAccountImportTypeInput =
  EnumInput<typeof CheckAccountImportType> | RawEnumCode<"CheckAccountImportType", string>;
export type ContactDepthValue = EnumValue<typeof ContactDepth>;
export type ContactDepthInput =
  EnumInput<typeof ContactDepth> | RawEnumCode<"ContactDepth", string>;
export type ReminderEligibilityFailureReasonValue = EnumValue<
  typeof ReminderEligibilityFailureReason
>;
export type SortDirectionValue = EnumValue<typeof SortDirection>;
export type SortDirectionInput =
  EnumInput<typeof SortDirection> | RawEnumCode<"SortDirection", string>;
export type RecurringIntervalValue = EnumValue<typeof RecurringInterval>;
export type RecurringIntervalInput =
  EnumInput<typeof RecurringInterval> | RawEnumCode<"RecurringInterval", string>;
export type TextTemplateCategoryValue = EnumValue<typeof TextTemplateCategory>;
export type TextTemplateCategoryInput =
  EnumInput<typeof TextTemplateCategory> | RawEnumCode<"TextTemplateCategory", string>;
export type TextTemplateTextTypeValue = EnumValue<typeof TextTemplateTextType>;
export type TextTemplateTextTypeInput =
  EnumInput<typeof TextTemplateTextType> | RawEnumCode<"TextTemplateTextType", string>;
