import type { OperationExecutor } from "../types/operation.js";
import { AccountingContactResource } from "./accounting-contact/index.js";
import { BasicsResource } from "./basics/index.js";
import { CheckAccountResource } from "./check-account/index.js";
import { CheckAccountTransactionResource } from "./check-account-transaction/index.js";
import { CommunicationWayResource } from "./communication-way/index.js";
import { ContactResource } from "./contact/index.js";
import { ContactAddressResource } from "./contact-address/index.js";
import { ContactFieldResource } from "./contact-field/index.js";
import { CreditNoteResource } from "./credit-note/index.js";
import { CreditNotePosResource } from "./credit-note-pos/index.js";
import { DocumentResource } from "./document/index.js";
import { ExportResource } from "./export/index.js";
import { InvoiceResource } from "./invoice/index.js";
import { InvoicePosResource } from "./invoice-pos/index.js";
import { LayoutResource } from "./layout/index.js";
import { OrderResource } from "./order/index.js";
import { OrderPosResource } from "./order-pos/index.js";
import { PartResource } from "./part/index.js";
import { PrivateTransactionRuleResource } from "./private-transaction-rule/index.js";
import { ReportResource } from "./report/index.js";
import { SevUserResource } from "./sev-user/index.js";
import { TagResource } from "./tag/index.js";
import { TextTemplateResource } from "./text-template/index.js";
import { VoucherResource } from "./voucher/index.js";
import { VoucherPosResource } from "./voucher-pos/index.js";

export function createRawResources(executor: OperationExecutor) {
  return {
    accountingContact: new AccountingContactResource(executor),
    basics: new BasicsResource(executor),
    checkAccount: new CheckAccountResource(executor),
    checkAccountTransaction: new CheckAccountTransactionResource(executor),
    communicationWay: new CommunicationWayResource(executor),
    contact: new ContactResource(executor),
    contactAddress: new ContactAddressResource(executor),
    contactField: new ContactFieldResource(executor),
    creditNote: new CreditNoteResource(executor),
    creditNotePos: new CreditNotePosResource(executor),
    document: new DocumentResource(executor),
    export: new ExportResource(executor),
    invoice: new InvoiceResource(executor),
    invoicePos: new InvoicePosResource(executor),
    layout: new LayoutResource(executor),
    order: new OrderResource(executor),
    orderPos: new OrderPosResource(executor),
    part: new PartResource(executor),
    privateTransactionRule: new PrivateTransactionRuleResource(executor),
    report: new ReportResource(executor),
    sevUser: new SevUserResource(executor),
    tag: new TagResource(executor),
    textTemplate: new TextTemplateResource(executor),
    voucher: new VoucherResource(executor),
    voucherPos: new VoucherPosResource(executor)
  } as const;
}

export type RawResources = ReturnType<typeof createRawResources>;
