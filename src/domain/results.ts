import type { operations } from "../types/openapi.js";
import type { ResponseJsonFor, TransportBodyFor } from "../types/operation.js";
import type { PaginatedSevdeskResult } from "../types/pagination-result.js";
import type { SevdeskResult } from "../types/result.js";
import type {
  SevdeskContact,
  SevdeskCreditNote,
  SevdeskCreditNotePosition,
  SevdeskInvoice,
  SevdeskInvoicePosition,
  SevdeskOrder,
  SevdeskOrderPosition,
  SevdeskPart,
  SevdeskUser,
  SevdeskVoucher,
  SevdeskVoucherPosition
} from "./models.js";

export type DomainResult<TOperationId extends keyof operations, TData> = SevdeskResult<
  ResponseJsonFor<operations[TOperationId]>,
  TData,
  TransportBodyFor<operations[TOperationId]>
>;

export type PaginatedDomainResult<
  TOperationId extends keyof operations,
  TData
> = PaginatedSevdeskResult<
  ResponseJsonFor<operations[TOperationId]>,
  TData,
  TransportBodyFor<operations[TOperationId]>
>;

export type ContactListResult = PaginatedDomainResult<"getContacts", readonly SevdeskContact[]>;
export type ContactResult = DomainResult<"getContactById", SevdeskContact>;

export type InvoiceListResult = PaginatedDomainResult<"getInvoices", readonly SevdeskInvoice[]>;
export type InvoiceResult = DomainResult<"getInvoiceById", SevdeskInvoice>;
export type CreatedInvoiceResult = DomainResult<"createInvoiceByFactory", CreatedInvoice>;
export type SentInvoiceResult = DomainResult<"invoiceSendBy", SevdeskInvoice>;
export type CancelledInvoiceResult = DomainResult<"cancelInvoice", SevdeskInvoice>;

export type OrderListResult = PaginatedDomainResult<"getOrders", readonly SevdeskOrder[]>;
export type OrderResult = DomainResult<"getOrderById", SevdeskOrder>;
export type CreatedOrderResult = DomainResult<"createOrder", CreatedOrder>;
export type SentOrderResult = DomainResult<"orderSendBy", SevdeskOrder>;

export type VoucherListResult = PaginatedDomainResult<"getVouchers", readonly SevdeskVoucher[]>;
export type VoucherResult = DomainResult<"getVoucherById", SevdeskVoucher>;
export type CreatedVoucherResult = DomainResult<"voucherFactorySaveVoucher", CreatedVoucher>;
export type OpenVoucherResult = DomainResult<"voucherResetToOpen", SevdeskVoucher>;
export type DraftVoucherResult = DomainResult<"voucherResetToDraft", SevdeskVoucher>;

export type CreditNoteListResult = PaginatedDomainResult<
  "getCreditNotes",
  readonly SevdeskCreditNote[]
>;
export type CreditNoteResult = DomainResult<"getcreditNoteById", SevdeskCreditNote>;
export type CreatedCreditNoteResult = DomainResult<"createcreditNote", CreatedCreditNote>;
export type SentCreditNoteResult = DomainResult<"creditNoteSendBy", SevdeskCreditNote>;

export type PartListResult = PaginatedDomainResult<"getParts", readonly SevdeskPart[]>;
export type PartResult = DomainResult<"getPartById", SevdeskPart>;
export type PartStockResult = DomainResult<"partGetStock", number>;
export type CreatedPartResult = DomainResult<"createPart", SevdeskPart>;
export type UpdatedPartResult = DomainResult<"updatePart", SevdeskPart>;

export type UserListResult = PaginatedDomainResult<"getSevUsers", readonly SevdeskUser[]>;
export type UserResult = DomainResult<"getSevUserById", SevdeskUser>;
export type NextCustomerNumberResult = DomainResult<"getNextCustomerNumber", string>;

export interface CreatedInvoice {
  readonly invoice: SevdeskInvoice;
  readonly positions: readonly SevdeskInvoicePosition[];
  readonly filename?: string;
}

export interface CreatedOrder {
  readonly order: SevdeskOrder;
  readonly positions: readonly SevdeskOrderPosition[];
}

export interface CreatedVoucher {
  readonly voucher: SevdeskVoucher;
  readonly positions: readonly SevdeskVoucherPosition[];
  readonly filename?: string;
}

export interface CreatedCreditNote {
  readonly creditNote: SevdeskCreditNote;
  readonly positions: readonly SevdeskCreditNotePosition[];
}
