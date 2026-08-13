import type {
  BookingTypeInput,
  ContactCategoryCodeInput,
  ContactDepthInput,
  ContactStatusInput,
  CreditNoteBookingCategoryInput,
  CreditNoteStatus,
  CreditNoteStatusInput,
  InvoiceStatus,
  InvoiceStatusInput,
  InvoiceTypeInput,
  OrderTypeInput,
  OrderStatus,
  OrderStatusInput,
  RecurringIntervalInput,
  SendTypeInput,
  SortDirectionInput,
  VoucherDirectionInput,
  VoucherStatus,
  VoucherStatusInput,
  VoucherTypeInput,
  CommunicationWayKeyNameInput,
  CommunicationWayTypeInput
} from "../enums/domain-enums.js";
import type { components, operations } from "../types/openapi.js";
import type { RequestOptions } from "../types/config.js";
import type { RequestFor, ResponseJsonFor, ResultFor } from "../types/operation.js";
import type { SevdeskIdInput, SevdeskObjectName, SevdeskReference } from "../types/references.js";
import type { PrimaryData } from "../types/result.js";
import type {
  ExpenseDocumentTaxInput,
  ExpenseTaxConfiguration,
  KnownLegacyNonCustomTaxTypeInput,
  ManualExpenseTaxConfiguration,
  ManualSalesTaxConfiguration,
  ManualVoucherRevenueTaxConfiguration,
  ResolvedExpenseTaxPlan,
  ResolvedSalesTaxPlan,
  ResolvedVoucherRevenueTaxPlan,
  SalesDocumentTaxInput,
  SalesTaxConfiguration,
  VoucherRevenueTaxInput
} from "../taxes/types.js";
import type {
  ContactEmbedInput,
  CreditNoteEmbedInput,
  InvoiceEmbedInput,
  InvoicePositionEmbedInput,
  OrderEmbedInput,
  VoucherEmbedInput
} from "./embed.js";

export type DeepWritablePartial<T> = T extends readonly (infer TItem)[]
  ? DeepWritablePartial<TItem>[]
  : T extends object
    ? { -readonly [TKey in keyof T]?: DeepWritablePartial<T[TKey]> }
    : T;

type CreationModel<T> = Omit<
  DeepWritablePartial<T>,
  "id" | "create" | "update" | "sevClient" | "createUser"
>;

type DistributiveOmit<T, TKey extends PropertyKey> = T extends unknown
  ? Omit<T, Extract<TKey, keyof T>>
  : never;

export type OperationRequest<TOperationId extends keyof operations> = RequestFor<
  operations[TOperationId]
>;
export type OperationData<TOperationId extends keyof operations> = PrimaryData<
  ResponseJsonFor<operations[TOperationId]>
>;
export type OperationResult<TOperationId extends keyof operations> = ResultFor<
  operations[TOperationId]
>;

export type CuratedRequestOptions = RequestOptions;

export type NonEmptyReadonlyArray<TValue> = readonly [TValue, ...TValue[]];

export type ContactCategoryInput = ContactCategoryCodeInput | SevdeskReference<"Category">;

export type TaxConfiguration = SalesTaxConfiguration | ExpenseTaxConfiguration;

export type TaxConfiguration20 = Extract<TaxConfiguration, { readonly bookkeepingSystem: "2.0" }>;
export type TaxConfiguration10 = Extract<TaxConfiguration, { readonly bookkeepingSystem: "1.0" }>;

type ContactModel = components["schemas"]["Model_Contact"];
type ContactCreateBase = Omit<
  CreationModel<ContactModel>,
  | "addresses"
  | "category"
  | "communicationWays"
  | "customerNumber"
  | "familyname"
  | "mainAddress"
  | "name"
  | "name2"
  | "parent"
  | "status"
  | "surename"
  | "taxSet"
  | "taxType"
  | "titel"
> & {
  readonly category: ContactCategoryInput;
  readonly status?: ContactStatusInput;
  readonly customerNumber?: string | "next";
};

export type ContactTaxDefaults =
  | {
      readonly taxType?: KnownLegacyNonCustomTaxTypeInput | null;
      readonly taxSet?: null;
    }
  | {
      readonly taxType: "custom" | "CUSTOM";
      readonly taxSet: SevdeskReference<"TaxSet">;
    };

export type OrganisationContactCreateInput = ContactCreateBase & {
  readonly kind: "organisation";
  readonly name: string;
  readonly additionalName?: string;
  readonly parentOrganisation?: SevdeskReference<"Contact"> | null;
  readonly firstName?: never;
  readonly lastName?: never;
  readonly middleName?: never;
  readonly title?: never;
};

export type PersonContactCreateInput = ContactCreateBase & {
  readonly kind: "person";
  readonly firstName: string;
  readonly lastName: string;
  readonly middleName?: string;
  readonly title?: string;
  readonly organisation?: SevdeskReference<"Contact"> | null;
  readonly name?: never;
  readonly additionalName?: never;
  readonly parentOrganisation?: never;
};

export type ContactCreateInput =
  | (OrganisationContactCreateInput & ContactTaxDefaults)
  | (PersonContactCreateInput & ContactTaxDefaults);

type ContactAddressModel = components["schemas"]["Model_ContactAddress"];
export type ContactAddressCreateInput = Omit<
  CreationModel<ContactAddressModel>,
  "id" | "objectName" | "contact" | "country" | "category"
> & {
  readonly country: SevdeskReference<"StaticCountry">;
  readonly category: SevdeskReference<"Category"> | null;
};

type CommunicationWayModel = components["schemas"]["Model_CommunicationWay"];
export type CommunicationWayCreateInput = Omit<
  CreationModel<CommunicationWayModel>,
  "id" | "objectName" | "contact" | "key" | "type" | "value"
> & {
  readonly type: CommunicationWayTypeInput;
  readonly value: string;
  readonly key: SevdeskReference<"CommunicationWayKey"> | CommunicationWayKeyNameInput;
};

export interface CompleteContactInput {
  readonly contact: ContactCreateInput;
  readonly addresses?: readonly ContactAddressCreateInput[];
  readonly communicationWays?: readonly CommunicationWayCreateInput[];
  readonly accounting?: Omit<
    CreationModel<components["schemas"]["Model_AccountingContact"]>,
    "contact"
  >;
}

export interface CompleteContactOptions {
  readonly rollback?: "none" | "best-effort";
  readonly validateCustomerNumber?: boolean;
}

export type ContactCreateWorkflowInput = CompleteContactInput;
export type ContactCreateWorkflowOptions = CompleteContactOptions;

type InvoiceModel = components["schemas"]["Model_Invoice"];
export type InvoiceCreateInput = Omit<
  CreationModel<InvoiceModel>,
  | "objectName"
  | "mapAll"
  | "status"
  | "invoiceType"
  | "invoiceNumber"
  | "header"
  | "contact"
  | "contactPerson"
  | "addressCountry"
  | "deliveryAddressCountry"
  | "paymentMethod"
  | "origin"
  | "sendType"
  | "accountIntervall"
  | "taxRule"
  | "taxType"
  | "taxSet"
  | "taxRate"
  | "dunningLevel"
  | "accountIntervall"
  | "accountNextInvoice"
  | "sumNet"
  | "sumTax"
  | "sumGross"
  | "sumDiscounts"
  | "sumNetForeignCurrency"
  | "sumTaxForeignCurrency"
  | "sumGrossForeignCurrency"
  | "sumDiscountsForeignCurrency"
  | "sumNetAccounting"
  | "sumTaxAccounting"
  | "sumGrossAccounting"
  | "paidAmount"
  | "enshrined"
> & {
  readonly invoiceDate: string;
  readonly contact: SevdeskReference<"Contact">;
  readonly contactPerson: SevdeskReference<"SevUser">;
  readonly addressCountry?: SevdeskReference<"StaticCountry">;
  readonly deliveryAddressCountry?: SevdeskReference<"StaticCountry">;
  readonly paymentMethod?: SevdeskReference<"PaymentMethod">;
  readonly origin?: SevdeskReference<"Order"> | null;
  readonly sendType?: SendTypeInput | null;
  readonly accountIntervall?: RecurringIntervalInput | null;
  readonly accountNextInvoice?: number | Date | null;
  readonly currency: string;
  readonly status?: InvoiceStatusInput;
  readonly invoiceType?: InvoiceTypeInput;
  readonly invoiceNumber?: string;
  readonly header?: string;
  readonly tax: SalesDocumentTaxInput;
};

type InvoicePositionModel = components["schemas"]["Model_InvoicePos"];
export type InvoicePositionInput = Omit<
  CreationModel<InvoicePositionModel>,
  | "objectName"
  | "mapAll"
  | "invoice"
  | "unity"
  | "part"
  | "quantity"
  | "taxRate"
  | "sumDiscount"
  | "sumNetAccounting"
  | "sumTaxAccounting"
  | "sumGrossAccounting"
  | "priceNet"
> & {
  readonly quantity: number;
  readonly taxRate: number;
  readonly unity: SevdeskReference<"Unity">;
  readonly part?: SevdeskReference<"Part">;
};

export type InvoicePositionWithInheritedTaxInput = Omit<InvoicePositionInput, "taxRate"> & {
  readonly taxRate?: number;
};

export interface DiscountInput {
  readonly discount: boolean;
  readonly text: string;
  readonly percentage: boolean;
  readonly value: number;
}

export type InvoiceFactoryStatusInput = typeof InvoiceStatus.DRAFT | "DRAFT" | "draft";

type InvoiceFactoryBase = {
  readonly discounts?: readonly DiscountInput[];
  readonly filename?: string;
  readonly takeDefaultAddress?: boolean;
};

type InvoiceFactoryDocument<TTax> = Omit<InvoiceCreateInput, "status" | "tax"> & {
  readonly tax: TTax;
  readonly status?: InvoiceFactoryStatusInput;
};

export type InvoiceFactoryInput = InvoiceFactoryBase &
  (
    | {
        readonly invoice: InvoiceFactoryDocument<ManualSalesTaxConfiguration>;
        readonly positions: NonEmptyReadonlyArray<InvoicePositionInput>;
      }
    | {
        readonly invoice: InvoiceFactoryDocument<ResolvedSalesTaxPlan>;
        readonly positions: NonEmptyReadonlyArray<InvoicePositionWithInheritedTaxInput>;
      }
  );

type OrderModel = components["schemas"]["Model_Order"];
export type OrderCreateInput = Omit<
  CreationModel<OrderModel>,
  | "objectName"
  | "mapAll"
  | "status"
  | "orderType"
  | "contact"
  | "contactPerson"
  | "taxRule"
  | "taxType"
  | "taxSet"
  | "taxRate"
  | "address"
  | "addressCountry"
  | "deliveryAddressCountry"
  | "origin"
  | "sendType"
> & {
  readonly orderNumber: string;
  readonly orderDate: string;
  readonly header: string;
  readonly version: number;
  readonly contact: SevdeskReference<"Contact">;
  readonly contactPerson: SevdeskReference<"SevUser">;
  readonly deliveryAddressCountry?: SevdeskReference<"StaticCountry">;
  readonly currency: string;
  readonly status?: OrderStatusInput;
  readonly orderType: OrderTypeInput;
  readonly origin?: SevdeskReference<"Order"> | null;
  readonly sendType?: SendTypeInput | null;
  readonly tax: SalesDocumentTaxInput;
} & (
    | {
        readonly address: string;
        readonly addressCountry?: SevdeskReference<"StaticCountry">;
      }
    | {
        readonly address?: string | null;
        readonly addressCountry: SevdeskReference<"StaticCountry">;
      }
  );

type OrderPositionModel = components["schemas"]["Model_OrderPos"];
export type OrderPositionInput = Omit<
  CreationModel<OrderPositionModel>,
  | "objectName"
  | "mapAll"
  | "order"
  | "unity"
  | "part"
  | "quantity"
  | "taxRate"
  | "priceNet"
  | "sumDiscount"
> & {
  readonly quantity: number;
  readonly taxRate: number;
  readonly unity: SevdeskReference<"Unity">;
  readonly part?: SevdeskReference<"Part">;
};

export type OrderPositionWithInheritedTaxInput = Omit<OrderPositionInput, "taxRate"> & {
  readonly taxRate?: number;
};

type OrderFactoryDocument<TTax> = DistributiveOmit<OrderCreateInput, "status" | "tax"> & {
  readonly tax: TTax;
  readonly status?: typeof OrderStatus.DRAFT | "DRAFT" | "draft";
};

export type OrderFactoryInput =
  | {
      readonly order: OrderFactoryDocument<ManualSalesTaxConfiguration>;
      readonly positions: NonEmptyReadonlyArray<OrderPositionInput>;
    }
  | {
      readonly order: OrderFactoryDocument<ResolvedSalesTaxPlan>;
      readonly positions: NonEmptyReadonlyArray<OrderPositionWithInheritedTaxInput>;
    };

type VoucherModel = components["schemas"]["Model_Voucher"];
type VoucherCreateBase = Omit<
  CreationModel<VoucherModel>,
  | "objectName"
  | "mapAll"
  | "status"
  | "voucherType"
  | "creditDebit"
  | "supplier"
  | "document"
  | "costCentre"
  | "recurringInterval"
  | "taxRule"
  | "taxType"
  | "taxSet"
  | "sumNet"
  | "sumTax"
  | "sumGross"
  | "sumNetAccounting"
  | "sumTaxAccounting"
  | "sumGrossAccounting"
  | "sumDiscounts"
  | "sumDiscountsForeignCurrency"
  | "paidAmount"
  | "recurringInterval"
  | "recurringStartDate"
  | "recurringNextVoucher"
  | "recurringLastVoucher"
  | "recurringEndDate"
  | "enshrined"
> & {
  readonly voucherDate: string;
  readonly voucherType?: VoucherTypeInput;
  readonly status?: VoucherStatusInput;
  readonly supplier?: SevdeskReference<"Contact"> | null;
  readonly document?: SevdeskReference<"Document"> | null;
  readonly costCentre?: SevdeskReference<"CostCentre">;
  readonly recurringInterval?: RecurringIntervalInput | null;
  readonly supplierName?: string;
};

export type VoucherCreateInput =
  | (VoucherCreateBase & {
      readonly creditDebit: "C" | "EXPENSE" | "expense";
      readonly tax: ExpenseDocumentTaxInput;
    })
  | (VoucherCreateBase & {
      readonly creditDebit: "D" | "REVENUE" | "revenue";
      readonly tax: VoucherRevenueTaxInput;
    });

type VoucherPositionModel = components["schemas"]["Model_VoucherPos"];
type VoucherPositionBase = Omit<
  CreationModel<VoucherPositionModel>,
  | "objectName"
  | "mapAll"
  | "voucher"
  | "accountDatev"
  | "accountingType"
  | "taxRate"
  | "net"
  | "sumNet"
  | "sumGross"
  | "estimatedAccountingType"
  | "sumTax"
  | "sumNetAccounting"
  | "sumTaxAccounting"
  | "sumGrossAccounting"
> & {
  readonly taxRate: number;
};

type VoucherPositionAmount =
  | {
      readonly net: true;
      readonly sumNet: number;
      readonly sumGross?: never;
    }
  | {
      readonly net: false;
      readonly sumGross: number;
      readonly sumNet?: never;
    };

export type VoucherPosition20Input = VoucherPositionBase &
  VoucherPositionAmount & {
    readonly accountDatev: SevdeskReference<"AccountDatev">;
    readonly accountingType?: never;
  };

export type VoucherPosition10Input = VoucherPositionBase &
  VoucherPositionAmount & {
    readonly accountingType: SevdeskReference<"AccountingType">;
    readonly accountDatev?: never;
  };

export type VoucherPositionInput = VoucherPosition20Input | VoucherPosition10Input;

export type VoucherPosition20WithInheritedTaxInput = Omit<VoucherPosition20Input, "taxRate"> & {
  readonly taxRate?: number;
};

export type VoucherPosition10WithInheritedTaxInput = Omit<VoucherPosition10Input, "taxRate"> & {
  readonly taxRate?: number;
};

export type VoucherFactoryStatusInput =
  | typeof VoucherStatus.DRAFT
  | typeof VoucherStatus.OPEN
  | "DRAFT"
  | "draft"
  | "OPEN"
  | "open"
  | "OPEN_OR_DUE"
  | "open_or_due"
  | "open-or-due"
  | "open or due";

type VoucherFactoryBase = {
  readonly filename?: string;
};

type VoucherFactoryDocument<TDirection extends string, TTax> = Omit<VoucherCreateBase, "status"> & {
  readonly creditDebit: TDirection;
  readonly tax: TTax;
  readonly status?: VoucherFactoryStatusInput;
};

export type VoucherFactoryInput =
  | (VoucherFactoryBase & {
      readonly voucher: VoucherFactoryDocument<
        "C" | "EXPENSE" | "expense",
        Extract<ManualExpenseTaxConfiguration, { readonly bookkeepingSystem: "2.0" }>
      >;
      readonly positions: NonEmptyReadonlyArray<VoucherPosition20Input>;
    })
  | (VoucherFactoryBase & {
      readonly voucher: VoucherFactoryDocument<
        "D" | "REVENUE" | "revenue",
        Extract<ManualVoucherRevenueTaxConfiguration, { readonly bookkeepingSystem: "2.0" }>
      >;
      readonly positions: NonEmptyReadonlyArray<VoucherPosition20Input>;
    })
  | (VoucherFactoryBase & {
      readonly voucher: VoucherFactoryDocument<
        "C" | "EXPENSE" | "expense" | "D" | "REVENUE" | "revenue",
        Extract<
          ManualExpenseTaxConfiguration | ManualVoucherRevenueTaxConfiguration,
          { readonly bookkeepingSystem: "1.0" }
        >
      >;
      readonly positions: NonEmptyReadonlyArray<VoucherPosition10Input>;
    })
  | (VoucherFactoryBase & {
      readonly voucher: VoucherFactoryDocument<
        "C" | "EXPENSE" | "expense",
        Extract<ResolvedExpenseTaxPlan, { readonly bookkeepingSystem: "2.0" }>
      >;
      readonly positions: NonEmptyReadonlyArray<VoucherPosition20WithInheritedTaxInput>;
    })
  | (VoucherFactoryBase & {
      readonly voucher: VoucherFactoryDocument<
        "D" | "REVENUE" | "revenue",
        Extract<ResolvedVoucherRevenueTaxPlan, { readonly bookkeepingSystem: "2.0" }>
      >;
      readonly positions: NonEmptyReadonlyArray<VoucherPosition20WithInheritedTaxInput>;
    })
  | (VoucherFactoryBase & {
      readonly voucher: VoucherFactoryDocument<
        "C" | "EXPENSE" | "expense",
        Extract<ResolvedExpenseTaxPlan, { readonly bookkeepingSystem: "1.0" }>
      >;
      readonly positions: NonEmptyReadonlyArray<VoucherPosition10WithInheritedTaxInput>;
    })
  | (VoucherFactoryBase & {
      readonly voucher: VoucherFactoryDocument<
        "D" | "REVENUE" | "revenue",
        Extract<ResolvedVoucherRevenueTaxPlan, { readonly bookkeepingSystem: "1.0" }>
      >;
      readonly positions: NonEmptyReadonlyArray<VoucherPosition10WithInheritedTaxInput>;
    });

type CreditNoteModel = components["schemas"]["Model_creditNote"];
type CreditNoteCreateBase = Omit<
  CreationModel<CreditNoteModel>,
  | "objectName"
  | "mapAll"
  | "status"
  | "contact"
  | "contactPerson"
  | "addressCountry"
  | "deliveryAddressCountry"
  | "sendType"
  | "taxRule"
  | "taxType"
  | "taxSet"
  | "taxRate"
  | "bookingCategory"
  | "sumNet"
  | "sumTax"
  | "sumGross"
  | "sumDiscounts"
  | "sumNetForeignCurrency"
  | "sumTaxForeignCurrency"
  | "sumGrossForeignCurrency"
  | "sumDiscountsForeignCurrency"
> & {
  readonly creditNoteDate: string;
  readonly contact: SevdeskReference<"Contact">;
  readonly contactPerson: SevdeskReference<"SevUser">;
  readonly addressCountry?: SevdeskReference<"StaticCountry"> | null;
  readonly deliveryAddressCountry?: SevdeskReference<"StaticCountry">;
  readonly sendType?: SendTypeInput | null;
  readonly currency: string;
  readonly status?: CreditNoteStatusInput;
};

type CreditNoteBookingCategory20Input = Exclude<
  CreditNoteBookingCategoryInput,
  "ACCOUNTING_TYPE" | "accounting_type" | "accounting-type" | "accounting type"
>;

type CreditNoteUnderachievementInput =
  | typeof import("../enums/domain-enums.js").CreditNoteBookingCategory.UNDERACHIEVEMENT
  | "underachievement";

type CreditNoteRegularSource<TBookingCategory> = {
  readonly bookingCategory?: Exclude<TBookingCategory, CreditNoteUnderachievementInput>;
  readonly refSrcInvoice?: never;
  readonly refSrcVoucher?: never;
};

type CreditNoteInvoiceUnderachievementSource = {
  readonly bookingCategory: CreditNoteUnderachievementInput;
  readonly refSrcInvoice: SevdeskIdInput;
  readonly refSrcVoucher?: never;
};

type CreditNoteLegacyUnderachievementSource =
  | CreditNoteInvoiceUnderachievementSource
  | {
      readonly bookingCategory: CreditNoteUnderachievementInput;
      readonly refSrcInvoice?: never;
      readonly refSrcVoucher: SevdeskIdInput;
    };

export type CreditNoteCreateInput =
  | (CreditNoteCreateBase &
      (
        | CreditNoteRegularSource<CreditNoteBookingCategory20Input>
        | CreditNoteInvoiceUnderachievementSource
      ) & {
        readonly tax: Extract<SalesDocumentTaxInput, { readonly bookkeepingSystem: "2.0" }>;
      })
  | (CreditNoteCreateBase &
      (
        | CreditNoteRegularSource<CreditNoteBookingCategoryInput>
        | CreditNoteLegacyUnderachievementSource
      ) & {
        readonly tax: Extract<SalesDocumentTaxInput, { readonly bookkeepingSystem: "1.0" }>;
      });

type CreditNotePositionModel = components["schemas"]["Model_creditNotePos"];
export type CreditNotePositionInput = Omit<
  CreationModel<CreditNotePositionModel>,
  | "objectName"
  | "mapAll"
  | "creditNote"
  | "unity"
  | "part"
  | "quantity"
  | "taxRate"
  | "priceNet"
  | "sumDiscount"
> & {
  readonly quantity: number;
  readonly taxRate: number;
  readonly unity: SevdeskReference<"Unity">;
  readonly part?: SevdeskReference<"Part">;
};

export type CreditNotePositionWithInheritedTaxInput = Omit<CreditNotePositionInput, "taxRate"> & {
  readonly taxRate?: number;
};

type CreditNoteFactoryBase = {
  readonly takeDefaultAddress?: boolean;
  readonly forCashRegister?: boolean;
};

type CreditNoteFactoryDocument<TTax> = DistributiveOmit<CreditNoteCreateInput, "status" | "tax"> & {
  readonly tax: TTax;
  readonly status?: typeof CreditNoteStatus.DRAFT | "DRAFT" | "draft";
};

export type CreditNoteFactoryInput = CreditNoteFactoryBase &
  (
    | {
        readonly creditNote: CreditNoteFactoryDocument<ManualSalesTaxConfiguration>;
        readonly positions: NonEmptyReadonlyArray<CreditNotePositionInput>;
      }
    | {
        readonly creditNote: CreditNoteFactoryDocument<ResolvedSalesTaxPlan>;
        readonly positions: NonEmptyReadonlyArray<CreditNotePositionWithInheritedTaxInput>;
      }
  );

interface EmailDeliveryBase {
  readonly channel: "email";
  readonly toEmail: string;
  readonly subject: string;
  readonly text: string;
  readonly copy?: boolean;
  readonly additionalAttachments?: string | readonly (string | number)[];
  readonly ccEmail?: string | readonly string[];
  readonly bccEmail?: string | readonly string[];
}

export interface StandardEmailDelivery extends EmailDeliveryBase {
  readonly sendXml?: never;
}

export interface InvoiceEmailDelivery extends EmailDeliveryBase {
  readonly sendXml?: boolean;
}

export interface MarkSentDelivery {
  readonly channel: "mark-sent";
  readonly sendType?: SendTypeInput;
  readonly sendDraft?: boolean;
}

export interface FinalizingMarkSentDelivery extends Omit<MarkSentDelivery, "sendDraft"> {
  readonly sendDraft?: false;
}

export type FinalisingMarkSentDelivery = FinalizingMarkSentDelivery;

export type StandardDelivery = StandardEmailDelivery | MarkSentDelivery;
export type InvoiceDelivery = InvoiceEmailDelivery | MarkSentDelivery;
export type StandardFinalizingDelivery = StandardEmailDelivery | FinalizingMarkSentDelivery;
export type InvoiceFinalizingDelivery = InvoiceEmailDelivery | FinalizingMarkSentDelivery;
export type FinalizingDelivery =
  StandardEmailDelivery | InvoiceEmailDelivery | FinalizingMarkSentDelivery;

export type StandardFinalisingDelivery = StandardFinalizingDelivery;

export type InvoiceFinalisingDelivery = InvoiceFinalizingDelivery;

export type FinalisingDelivery = FinalizingDelivery;

export type DocumentDelivery = StandardDelivery;

export interface BookingInput {
  readonly amount: number;
  readonly date: number | Date;
  readonly type?: BookingTypeInput;
  readonly checkAccount: SevdeskReference<"CheckAccount">;
  readonly checkAccountTransaction?: SevdeskReference<"CheckAccountTransaction">;
  readonly createFeed?: boolean;
}

export interface VoucherBookingInput extends Omit<BookingInput, "date"> {
  readonly date: string | Date;
}

type FinalizingPlan<TDelivery> =
  | {
      readonly delivery: TDelivery;
      readonly booking?: BookingInput;
      readonly enshrine?: boolean;
    }
  | {
      readonly delivery?: TDelivery;
      readonly booking: BookingInput;
      readonly enshrine?: boolean;
    };

export type InvoiceFinalizingPlan = FinalizingPlan<InvoiceFinalizingDelivery>;

export type InvoiceFinalisingPlan = InvoiceFinalizingPlan;

export type StandardFinalizingPlan = FinalizingPlan<StandardFinalizingDelivery>;

export type StandardFinalisingPlan = StandardFinalizingPlan;

type NoFinalizingAction = {
  readonly delivery?: never;
  readonly booking?: never;
  readonly enshrine?: false;
};

export type OptionalInvoiceFinalizingPlan = NoFinalizingAction | InvoiceFinalizingPlan;
export type OptionalStandardFinalizingPlan = NoFinalizingAction | StandardFinalizingPlan;

export type OptionalInvoiceFinalisingPlan = OptionalInvoiceFinalizingPlan;

export type OptionalStandardFinalisingPlan = OptionalStandardFinalizingPlan;

export interface WorkflowStepFor<TOperationId extends keyof operations> {
  readonly name: string;
  readonly operationId: TOperationId;
  readonly status: number;
  readonly data: OperationData<TOperationId>;
  readonly json: ResponseJsonFor<operations[TOperationId]>;
  readonly raw: OperationResult<TOperationId>["raw"];
}

export type WorkflowStep<TOperationId extends keyof operations = keyof operations> = {
  [TId in TOperationId]: WorkflowStepFor<TId>;
}[TOperationId];

export type WorkflowJson<TOperationId extends keyof operations = keyof operations> = {
  [TId in TOperationId]: ResponseJsonFor<operations[TId]>;
}[TOperationId];

export type WorkflowRawResponse<TOperationId extends keyof operations = keyof operations> = {
  [TId in TOperationId]: OperationResult<TId>["raw"];
}[TOperationId];

export type WorkflowStepSummary<TOperationId extends keyof operations = keyof operations> = {
  [TId in TOperationId]: {
    readonly name: string;
    readonly operationId: TId;
    readonly status: number;
    readonly json: ResponseJsonFor<operations[TId]>;
  };
}[TOperationId];

export interface WorkflowActionReceipt<TOperationId extends keyof operations> {
  readonly performed: true;
  readonly operationId: TOperationId;
  readonly status: number;
  readonly data: OperationData<TOperationId>;
  readonly json: ResponseJsonFor<operations[TOperationId]>;
  readonly raw: OperationResult<TOperationId>["raw"];
  readonly response: OperationResult<TOperationId>["response"];
}

export interface CompensationResult {
  readonly operationId: string;
  readonly success: boolean;
  readonly error?: unknown;
}

export interface WorkflowResult<
  TWorkflow extends string,
  TData,
  TOperationId extends keyof operations = keyof operations
> {
  readonly workflow: TWorkflow;
  readonly data: TData;
  readonly steps: readonly WorkflowStep<TOperationId>[];
  readonly json: readonly WorkflowJson<TOperationId>[];
  readonly raw: readonly WorkflowRawResponse<TOperationId>[];
  toJSON(): readonly WorkflowJson<TOperationId>[];
  toSummary(): {
    readonly workflow: TWorkflow;
    readonly data: TData;
    readonly steps: readonly WorkflowStepSummary<TOperationId>[];
  };
}

export interface PageOptions<TEmbed extends string = string> {
  readonly limit?: number;
  readonly offset?: number;
  readonly countAll?: boolean;
  readonly embed?: readonly TEmbed[];
}

export type DateFilter = number | Date;

export interface ContactListOptions extends PageOptions<ContactEmbedInput> {
  readonly depth?: ContactDepthInput | "organisations" | "all";
  readonly category?: SevdeskReference<"Category"> | ContactCategoryInput;
  readonly city?: string;
  readonly tags?: readonly SevdeskReference<"Tag">[];
  readonly customerNumber?: string;
  readonly parent?: SevdeskReference<"Contact">;
  readonly name?: string;
  readonly zip?: string;
  readonly country?: SevdeskReference<"StaticCountry">;
  readonly createBefore?: DateFilter;
  readonly createAfter?: DateFilter;
  readonly updateBefore?: DateFilter;
  readonly updateAfter?: DateFilter;
  readonly orderByCustomerNumber?: SortDirectionInput;
}

export type InvoicePositionListOptions = PageOptions<InvoicePositionEmbedInput>;

export interface InvoiceListOptions extends PageOptions<InvoiceEmbedInput> {
  readonly status?: InvoiceStatusInput;
  readonly partiallyPaid?: boolean;
  readonly orderByDebit?: boolean;
  readonly orderByDueTime?: boolean;
  readonly showAll?: boolean;
  readonly canceled?: boolean;
  readonly invoiceNumber?: string;
  readonly delinquent?: boolean;
  readonly notDelinquent?: boolean;
  readonly tags?: readonly SevdeskReference<"Tag">[];
  readonly costCentre?: SevdeskReference<"CostCentre">;
  readonly createBefore?: DateFilter;
  readonly createAfter?: DateFilter;
  readonly updateBefore?: DateFilter;
  readonly updateAfter?: DateFilter;
  readonly contact?: SevdeskReference<"Contact">;
  readonly orderByDueDate?: boolean;
  readonly customerInternalNote?: string;
  readonly day?: DateFilter;
  readonly startDate?: DateFilter;
  readonly endDate?: DateFilter;
  readonly onlyDunned?: boolean;
  readonly showRecurring?: boolean;
  readonly showReminders?: boolean;
  readonly origin?: SevdeskReference<SevdeskObjectName>;
  readonly invoiceType?: InvoiceTypeInput;
  readonly paymentMethod?: SevdeskReference<"PaymentMethod">;
  readonly headerStartsWith?: string;
  readonly headerOrNumber?: string;
  readonly orderByInvoiceNumber?: SortDirectionInput;
  readonly invoiceNumberGreater?: string;
  readonly invoiceNumberSmaller?: string;
  readonly sendType?: SendTypeInput;
  readonly fulltextSearch?: string;
}

export interface OrderListOptions extends PageOptions<OrderEmbedInput> {
  readonly orderNumber?: string;
  readonly tags?: readonly SevdeskReference<"Tag">[];
  readonly status?: OrderStatusInput;
  readonly createBefore?: DateFilter;
  readonly createAfter?: DateFilter;
  readonly updateBefore?: DateFilter;
  readonly updateAfter?: DateFilter;
  readonly contact?: SevdeskReference<"Contact">;
  readonly startDate?: DateFilter;
  readonly endDate?: DateFilter;
  readonly orderType?: OrderTypeInput;
  readonly orderByOrderNumber?: SortDirectionInput;
  readonly orderNumberGreater?: string;
  readonly orderNumberSmaller?: string;
  readonly startAmount?: number;
  readonly endAmount?: number;
}

export interface CreditNoteListOptions extends PageOptions<CreditNoteEmbedInput> {
  readonly creditNoteNumber?: string;
  readonly onlyEnshrined?: boolean;
  readonly tags?: readonly SevdeskReference<"Tag">[];
  readonly status?: CreditNoteStatusInput;
  readonly delinquent?: boolean;
  readonly notDelinquent?: boolean;
  readonly customerInternalNote?: string;
  readonly origin?: SevdeskReference<SevdeskObjectName>;
  readonly costCentre?: SevdeskReference<"CostCentre">;
  readonly contact?: SevdeskReference<"Contact">;
  readonly startDate?: DateFilter;
  readonly endDate?: DateFilter;
  readonly day?: DateFilter;
  readonly paymentMethod?: SevdeskReference<"PaymentMethod">;
  readonly headerOrNumber?: string;
  readonly headerStartsWith?: string;
  readonly orderByCreditNoteNumber?: SortDirectionInput;
  readonly partiallyPaid?: boolean;
  readonly orderByDueDate?: boolean;
  readonly orderByDueTime?: boolean;
  readonly orderByDebit?: boolean;
  readonly creditNoteNumberGreater?: string;
  readonly creditNoteNumberSmaller?: string;
  readonly startAmount?: number;
  readonly endAmount?: number;
}

export interface VoucherListOptions extends PageOptions<VoucherEmbedInput> {
  readonly accountingType?: SevdeskReference<"AccountingType">;
  readonly withoutCatering?: boolean;
  readonly year?: number;
  readonly month?: number;
  readonly descriptionLike?: string;
  readonly creditDebit?: VoucherDirectionInput;
  readonly supplierName?: string;
  readonly commentLike?: string;
  readonly searchCommentOrDescription?: string;
  readonly contact?: SevdeskReference<"Contact">;
  readonly createBefore?: DateFilter;
  readonly createAfter?: DateFilter;
  readonly updateBefore?: DateFilter;
  readonly updateAfter?: DateFilter;
  readonly startDate?: DateFilter;
  readonly endDate?: DateFilter;
  readonly object?: SevdeskReference<SevdeskObjectName>;
  readonly startPayDate?: DateFilter;
  readonly endPayDate?: DateFilter;
  readonly status?: VoucherStatusInput;
  readonly orderByDebit?: boolean;
  readonly costCentre?: SevdeskReference<"CostCentre">;
  readonly voucherType?: VoucherTypeInput;
  readonly origin?: SevdeskReference<SevdeskObjectName>;
  readonly contactOrObject?: SevdeskReference<SevdeskObjectName>;
  readonly orderByVoucherNumber?: SortDirectionInput;
  readonly delinquent?: boolean;
  readonly hasDocument?: boolean;
  readonly noRecurring?: boolean;
  readonly tags?: readonly SevdeskReference<"Tag">[];
  readonly startAmount?: number;
  readonly endAmount?: number;
  readonly fulltextSearch?: string;
  readonly fulltextSearchObjects?: readonly string[];
}

export interface NamedBinaryUpload {
  readonly data: Blob | ArrayBuffer | Uint8Array;
  readonly filename?: string;
  readonly contentType?: string;
}

export type BinaryUpload = string | Blob | ArrayBuffer | Uint8Array | NamedBinaryUpload;

type CheckAccountSelectorFields = {
  readonly id?: SevdeskIdInput;
  readonly name?: string;
  readonly iban?: string;
  readonly accountingNumber?: string;
  readonly default?: true;
};

export type RequireAtLeastOne<TValue extends object> = {
  [TKey in keyof TValue]-?: Required<Pick<TValue, TKey>> & Partial<Omit<TValue, TKey>>;
}[keyof TValue];

export type CheckAccountSelector = RequireAtLeastOne<CheckAccountSelectorFields>;
