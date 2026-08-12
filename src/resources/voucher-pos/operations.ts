import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class VoucherPosResource extends BaseResource {
  getVoucherPositions(
    request: RequestFor<operations["getVoucherPositions"]> = {}
  ): Promise<ResultFor<operations["getVoucherPositions"]>> {
    return this.call("getVoucherPositions", request);
  }
}
