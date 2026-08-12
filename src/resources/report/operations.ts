import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class ReportResource extends BaseResource {
  reportContact(
    request: RequestFor<operations["reportContact"]>
  ): Promise<ResultFor<operations["reportContact"]>> {
    return this.call("reportContact", request);
  }
  reportInvoice(
    request: RequestFor<operations["reportInvoice"]>
  ): Promise<ResultFor<operations["reportInvoice"]>> {
    return this.call("reportInvoice", request);
  }
  reportOrder(
    request: RequestFor<operations["reportOrder"]>
  ): Promise<ResultFor<operations["reportOrder"]>> {
    return this.call("reportOrder", request);
  }
  reportVoucher(
    request: RequestFor<operations["reportVoucher"]>
  ): Promise<ResultFor<operations["reportVoucher"]>> {
    return this.call("reportVoucher", request);
  }
}
