import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class CreditNoteResource extends BaseResource {
  bookCreditNote(
    request: RequestFor<operations["bookCreditNote"]>
  ): Promise<ResultFor<operations["bookCreditNote"]>> {
    return this.call("bookCreditNote", request);
  }
  createcreditNote(
    request: RequestFor<operations["createcreditNote"]>
  ): Promise<ResultFor<operations["createcreditNote"]>> {
    return this.call("createcreditNote", request);
  }
  createCreditNoteFromInvoice(
    request: RequestFor<operations["createCreditNoteFromInvoice"]>
  ): Promise<ResultFor<operations["createCreditNoteFromInvoice"]>> {
    return this.call("createCreditNoteFromInvoice", request);
  }
  createCreditNoteFromVoucher(
    request: RequestFor<operations["createCreditNoteFromVoucher"]>
  ): Promise<ResultFor<operations["createCreditNoteFromVoucher"]>> {
    return this.call("createCreditNoteFromVoucher", request);
  }
  creditNoteEnshrine(
    request: RequestFor<operations["creditNoteEnshrine"]>
  ): Promise<ResultFor<operations["creditNoteEnshrine"]>> {
    return this.call("creditNoteEnshrine", request);
  }
  creditNoteGetPdf(
    request: RequestFor<operations["creditNoteGetPdf"]>
  ): Promise<ResultFor<operations["creditNoteGetPdf"]>> {
    return this.call("creditNoteGetPdf", request);
  }
  creditNoteResetToDraft(
    request: RequestFor<operations["creditNoteResetToDraft"]>
  ): Promise<ResultFor<operations["creditNoteResetToDraft"]>> {
    return this.call("creditNoteResetToDraft", request);
  }
  creditNoteResetToOpen(
    request: RequestFor<operations["creditNoteResetToOpen"]>
  ): Promise<ResultFor<operations["creditNoteResetToOpen"]>> {
    return this.call("creditNoteResetToOpen", request);
  }
  creditNoteSendBy(
    request: RequestFor<operations["creditNoteSendBy"]>
  ): Promise<ResultFor<operations["creditNoteSendBy"]>> {
    return this.call("creditNoteSendBy", request);
  }
  deletecreditNote(
    request: RequestFor<operations["deletecreditNote"]>
  ): Promise<ResultFor<operations["deletecreditNote"]>> {
    return this.call("deletecreditNote", request);
  }
  getcreditNoteById(
    request: RequestFor<operations["getcreditNoteById"]>
  ): Promise<ResultFor<operations["getcreditNoteById"]>> {
    return this.call("getcreditNoteById", request);
  }
  getCreditNotes(
    request: RequestFor<operations["getCreditNotes"]> = {}
  ): Promise<ResultFor<operations["getCreditNotes"]>> {
    return this.call("getCreditNotes", request);
  }
  sendCreditNoteByPrinting(
    request: RequestFor<operations["sendCreditNoteByPrinting"]>
  ): Promise<ResultFor<operations["sendCreditNoteByPrinting"]>> {
    return this.call("sendCreditNoteByPrinting", request);
  }
  sendCreditNoteViaEMail(
    request: RequestFor<operations["sendCreditNoteViaEMail"]>
  ): Promise<ResultFor<operations["sendCreditNoteViaEMail"]>> {
    return this.call("sendCreditNoteViaEMail", request);
  }
  updatecreditNote(
    request: RequestFor<operations["updatecreditNote"]>
  ): Promise<ResultFor<operations["updatecreditNote"]>> {
    return this.call("updatecreditNote", request);
  }
}
