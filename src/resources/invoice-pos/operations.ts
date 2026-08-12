import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class InvoicePosResource extends BaseResource {
  getInvoicePos(
    request: RequestFor<operations["getInvoicePos"]> = {}
  ): Promise<ResultFor<operations["getInvoicePos"]>> {
    return this.call("getInvoicePos", request);
  }
}
