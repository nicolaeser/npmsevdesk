import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class InvoiceResource extends BaseResource {
  bookInvoice(
    request: RequestFor<operations["bookInvoice"]>
  ): Promise<ResultFor<operations["bookInvoice"]>> {
    return this.call("bookInvoice", request);
  }
  cancelInvoice(
    request: RequestFor<operations["cancelInvoice"]>
  ): Promise<ResultFor<operations["cancelInvoice"]>> {
    return this.call("cancelInvoice", request);
  }
  createInvoiceByFactory(
    request: RequestFor<operations["createInvoiceByFactory"]>
  ): Promise<ResultFor<operations["createInvoiceByFactory"]>> {
    return this.call("createInvoiceByFactory", request);
  }
  createInvoiceFromOrder(
    request: RequestFor<operations["createInvoiceFromOrder"]>
  ): Promise<ResultFor<operations["createInvoiceFromOrder"]>> {
    return this.call("createInvoiceFromOrder", request);
  }
  createInvoiceReminder(
    request: RequestFor<operations["createInvoiceReminder"]>
  ): Promise<ResultFor<operations["createInvoiceReminder"]>> {
    return this.call("createInvoiceReminder", request);
  }
  deleteInvoiceById(
    request: RequestFor<operations["deleteInvoiceById"]>
  ): Promise<ResultFor<operations["deleteInvoiceById"]>> {
    return this.call("deleteInvoiceById", request);
  }
  getInvoiceById(
    request: RequestFor<operations["getInvoiceById"]>
  ): Promise<ResultFor<operations["getInvoiceById"]>> {
    return this.call("getInvoiceById", request);
  }
  getInvoicePositionsById(
    request: RequestFor<operations["getInvoicePositionsById"]>
  ): Promise<ResultFor<operations["getInvoicePositionsById"]>> {
    return this.call("getInvoicePositionsById", request);
  }
  getInvoices(
    request: RequestFor<operations["getInvoices"]> = {}
  ): Promise<ResultFor<operations["getInvoices"]>> {
    return this.call("getInvoices", request);
  }
  getIsInvoicePartiallyPaid(
    request: RequestFor<operations["getIsInvoicePartiallyPaid"]>
  ): Promise<ResultFor<operations["getIsInvoicePartiallyPaid"]>> {
    return this.call("getIsInvoicePartiallyPaid", request);
  }
  getLastDunning(
    request: RequestFor<operations["getLastDunning"]>
  ): Promise<ResultFor<operations["getLastDunning"]>> {
    return this.call("getLastDunning", request);
  }
  getOpenInvoiceReminderDebit(
    request: RequestFor<operations["getOpenInvoiceReminderDebit"]>
  ): Promise<ResultFor<operations["getOpenInvoiceReminderDebit"]>> {
    return this.call("getOpenInvoiceReminderDebit", request);
  }
  invoiceEnshrine(
    request: RequestFor<operations["invoiceEnshrine"]>
  ): Promise<ResultFor<operations["invoiceEnshrine"]>> {
    return this.call("invoiceEnshrine", request);
  }
  invoiceGetPdf(
    request: RequestFor<operations["invoiceGetPdf"]>
  ): Promise<ResultFor<operations["invoiceGetPdf"]>> {
    return this.call("invoiceGetPdf", request);
  }
  invoiceGetXml(
    request: RequestFor<operations["invoiceGetXml"]>
  ): Promise<ResultFor<operations["invoiceGetXml"]>> {
    return this.call("invoiceGetXml", request);
  }
  invoiceRender(
    request: RequestFor<operations["invoiceRender"]>
  ): Promise<ResultFor<operations["invoiceRender"]>> {
    return this.call("invoiceRender", request);
  }
  invoiceResetToDraft(
    request: RequestFor<operations["invoiceResetToDraft"]>
  ): Promise<ResultFor<operations["invoiceResetToDraft"]>> {
    return this.call("invoiceResetToDraft", request);
  }
  invoiceResetToOpen(
    request: RequestFor<operations["invoiceResetToOpen"]>
  ): Promise<ResultFor<operations["invoiceResetToOpen"]>> {
    return this.call("invoiceResetToOpen", request);
  }
  invoiceSendBy(
    request: RequestFor<operations["invoiceSendBy"]>
  ): Promise<ResultFor<operations["invoiceSendBy"]>> {
    return this.call("invoiceSendBy", request);
  }
  sendInvoiceViaEMail(
    request: RequestFor<operations["sendInvoiceViaEMail"]>
  ): Promise<ResultFor<operations["sendInvoiceViaEMail"]>> {
    return this.call("sendInvoiceViaEMail", request);
  }
  updateInvoiceById(
    request: RequestFor<operations["updateInvoiceById"]>
  ): Promise<ResultFor<operations["updateInvoiceById"]>> {
    return this.call("updateInvoiceById", request);
  }
  updateStatus(
    request: RequestFor<operations["updateStatus"]>
  ): Promise<ResultFor<operations["updateStatus"]>> {
    return this.call("updateStatus", request);
  }
}
