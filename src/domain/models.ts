import type { components } from "../types/openapi.js";
import type {
  EnumMap,
  EnumValue,
  EnumKey,
  ContactCategory,
  InvoiceType,
  LegacyTaxType,
  OrderType,
  SendType,
  TaxRule,
  VoucherDirection,
  VoucherType
} from "../enums/domain-enums.js";
import type {
  ContactNormalizedStatus,
  CreditNoteNormalizedStatus,
  InvoiceNormalizedStatus,
  OrderNormalizedStatus,
  PartNormalizedStatus,
  VoucherNormalizedStatus
} from "./status.js";

type WithIdentity<T, TObjectName extends string> = Omit<T, "id" | "objectName"> & {
  readonly id: string;
  readonly objectName: TObjectName;
};

type WithNormalizedStatus<
  T,
  TStatus extends { readonly status: string; readonly statusCode: number }
> = Omit<T, "status"> & TStatus;

type ContactWire = components["schemas"]["Model_ContactResponse"];
type InvoiceWire = components["schemas"]["Model_InvoiceResponse"];
type OrderWire = components["schemas"]["Model_OrderResponse"];
type VoucherWire = components["schemas"]["Model_VoucherResponse"];
type CreditNoteWire = components["schemas"]["Model_creditNoteResponse"];
type PartWire = components["schemas"]["Model_Part"];
type UserWire = components["schemas"]["Model_SevUserResponse"];
type InvoiceBoundaryWire = Omit<
  WithIdentity<InvoiceWire, "Invoice">,
  "invoiceDate" | "timeToPay" | "reminderDeadline"
> & {
  readonly invoiceDate?: string | number | null;
  readonly timeToPay?: string | number | null;
  readonly reminderDeadline?: string | number | null;
};

export type SemanticCode<TMap extends EnumMap> =
  | {
      [TName in EnumKey<TMap>]: {
        readonly name: TName;
        readonly code: TMap[TName];
        readonly known: true;
      };
    }[EnumKey<TMap>]
  | {
      readonly name: "UNKNOWN";
      readonly code:
        | (EnumValue<TMap> extends string ? string : never)
        | (EnumValue<TMap> extends number ? number : never);
      readonly known: false;
    };

export type SendSemanticCode =
  | SemanticCode<typeof SendType>
  | {
      readonly name: "NOT_SENT";
      readonly code: null;
      readonly known: true;
    };

export type SevdeskContact = Readonly<
  WithNormalizedStatus<
    Omit<
      WithIdentity<ContactWire, "Contact">,
      "exemptVat" | "defaultDiscountPercentage" | "governmentAgency"
    > & {
      readonly exemptVat?: boolean;
      readonly defaultDiscountPercentage?: boolean;
      readonly governmentAgency?: boolean;
    },
    ContactNormalizedStatus
  > & {
    readonly semantic: {
      readonly category?: SemanticCode<typeof ContactCategory>;
      readonly taxType?: SemanticCode<typeof LegacyTaxType>;
    };
  }
>;

export type SevdeskInvoice = Readonly<
  WithNormalizedStatus<InvoiceBoundaryWire, InvoiceNormalizedStatus> & {
    readonly semantic: {
      readonly invoiceType?: SemanticCode<typeof InvoiceType>;
      readonly sendType?: SendSemanticCode;
      readonly taxType?: SemanticCode<typeof LegacyTaxType>;
      readonly taxRule?: SemanticCode<typeof TaxRule>;
    };
  }
>;

export type SevdeskOrder = Readonly<
  WithNormalizedStatus<WithIdentity<OrderWire, "Order">, OrderNormalizedStatus> & {
    readonly semantic: {
      readonly orderType?: SemanticCode<typeof OrderType>;
      readonly sendType?: SendSemanticCode;
      readonly taxType?: SemanticCode<typeof LegacyTaxType>;
      readonly taxRule?: SemanticCode<typeof TaxRule>;
    };
  }
>;

export type SevdeskVoucher = Readonly<
  WithNormalizedStatus<WithIdentity<VoucherWire, "Voucher">, VoucherNormalizedStatus> & {
    readonly semantic: {
      readonly voucherType?: SemanticCode<typeof VoucherType>;
      readonly direction?: SemanticCode<typeof VoucherDirection>;
      readonly taxType?: SemanticCode<typeof LegacyTaxType>;
      readonly taxRule?: SemanticCode<typeof TaxRule>;
    };
  }
>;

export type SevdeskCreditNote = Readonly<
  WithNormalizedStatus<WithIdentity<CreditNoteWire, "CreditNote">, CreditNoteNormalizedStatus> & {
    readonly semantic: {
      readonly sendType?: SendSemanticCode;
      readonly taxType?: SemanticCode<typeof LegacyTaxType>;
      readonly taxRule?: SemanticCode<typeof TaxRule>;
    };
  }
>;

type MissingPartStatus = {
  readonly status?: undefined;
  readonly statusCode?: undefined;
  readonly statusKnown?: undefined;
};

export type SevdeskPart = Readonly<
  Omit<WithIdentity<PartWire, "Part">, "status"> & (PartNormalizedStatus | MissingPartStatus)
>;

export type SevdeskUser = Readonly<WithIdentity<UserWire, "SevUser">>;

export type SevdeskInvoicePosition = components["schemas"]["Model_InvoicePosResponse"];
export type SevdeskOrderPosition = components["schemas"]["Model_OrderPosResponse"];
export type SevdeskVoucherPosition = components["schemas"]["Model_VoucherPosResponse"];
export type SevdeskCreditNotePosition = components["schemas"]["Model_creditNotePosResponse"];
export type SevdeskDiscount = components["schemas"]["Model_discountsResponse"];
