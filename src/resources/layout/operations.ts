import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class LayoutResource extends BaseResource {
  getLetterpapersWithThumb(
    request: RequestFor<operations["getLetterpapersWithThumb"]> = {}
  ): Promise<ResultFor<operations["getLetterpapersWithThumb"]>> {
    return this.call("getLetterpapersWithThumb", request);
  }
  getTemplates(
    request: RequestFor<operations["getTemplates"]> = {}
  ): Promise<ResultFor<operations["getTemplates"]>> {
    return this.call("getTemplates", request);
  }
  updateCreditNoteTemplate(
    request: RequestFor<operations["updateCreditNoteTemplate"]>
  ): Promise<ResultFor<operations["updateCreditNoteTemplate"]>> {
    return this.call("updateCreditNoteTemplate", request);
  }
  updateInvoiceTemplate(
    request: RequestFor<operations["updateInvoiceTemplate"]>
  ): Promise<ResultFor<operations["updateInvoiceTemplate"]>> {
    return this.call("updateInvoiceTemplate", request);
  }
  updateOrderTemplate(
    request: RequestFor<operations["updateOrderTemplate"]>
  ): Promise<ResultFor<operations["updateOrderTemplate"]>> {
    return this.call("updateOrderTemplate", request);
  }
}
