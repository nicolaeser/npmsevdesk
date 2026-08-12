import type { operations } from "../types/openapi.js";
import type { RequestBodyFor } from "../types/operation.js";

type Replace<TValue, TReplacement> = Omit<TValue, keyof TReplacement> & TReplacement;

type RawContactCreatePayload = RequestBodyFor<operations["createContact"]>;
type RawInvoiceFactoryPayload = RequestBodyFor<operations["createInvoiceByFactory"]>;
type RawOrderFactoryPayload = RequestBodyFor<operations["createOrder"]>;
type RawVoucherFactoryPayload = RequestBodyFor<operations["voucherFactorySaveVoucher"]>;
type RawCreditNoteFactoryPayload = RequestBodyFor<operations["createcreditNote"]>;

export type ContactCreatePayload = RawContactCreatePayload;

export type ContactFactoryPayload = ContactCreatePayload;

export type InvoiceFactoryPayload = Replace<
  RawInvoiceFactoryPayload,
  {
    invoice: Replace<
      RawInvoiceFactoryPayload["invoice"],
      {
        invoiceType: string;
        sendType?: string | null;
        accountIntervall?: string | null;
        taxType?: string;
        deliveryAddressCountry?: { id: number; objectName: "StaticCountry" };
      }
    >;
  }
>;

export type OrderFactoryPayload = Replace<
  RawOrderFactoryPayload,
  {
    order: Replace<
      RawOrderFactoryPayload["order"],
      {
        orderType: string;
        sendType?: string | null;
        taxType?: string;
        deliveryAddressCountry?: { id: number; objectName: "StaticCountry" };
      }
    >;
  }
>;

export type VoucherFactoryPayload = Replace<
  RawVoucherFactoryPayload,
  {
    voucher: Replace<
      RawVoucherFactoryPayload["voucher"],
      {
        voucherType: string;
        creditDebit: string;
        recurringInterval?: string | null;
        taxType?: string;
      }
    >;
  }
>;

export type CreditNoteFactoryPayload = Replace<
  RawCreditNoteFactoryPayload,
  {
    creditNote: Replace<
      RawCreditNoteFactoryPayload["creditNote"],
      {
        bookingCategory?: string | null;
        sendType?: string | null;
        taxType?: string;
        deliveryAddressCountry?: { id: number; objectName: "StaticCountry" };
        refSrcInvoice?: number;
        refSrcVoucher?: number;
      }
    >;
  }
>;

export interface InvoiceBookingPayload<TType extends string = string> {
  readonly amount: number;
  readonly date: number;
  readonly type: TType;
  readonly checkAccount: {
    readonly id: number;
    readonly objectName: "CheckAccount";
  };
  readonly checkAccountTransaction?: {
    readonly id: number;
    readonly objectName: "CheckAccountTransaction";
  };
  readonly createFeed?: boolean;
}

export interface VoucherBookingPayload<TType extends string = string> extends Omit<
  InvoiceBookingPayload<TType>,
  "date"
> {
  readonly date: string;
}

export interface StandardEmailDeliveryPayload {
  readonly toEmail: string;
  readonly subject: string;
  readonly text: string;
  readonly copy?: boolean;
  readonly additionalAttachments?: string;
  readonly ccEmail?: string;
  readonly bccEmail?: string;
}

export interface InvoiceEmailDeliveryPayload extends StandardEmailDeliveryPayload {
  readonly sendXml?: boolean;
}

export interface MarkSentDeliveryPayload<TSendType extends string = string> {
  readonly sendType: TSendType;
  readonly sendDraft: boolean;
}

export type DeliveryPayload<TSendType extends string = string> =
  InvoiceEmailDeliveryPayload | StandardEmailDeliveryPayload | MarkSentDeliveryPayload<TSendType>;
