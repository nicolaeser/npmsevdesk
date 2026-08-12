import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class OrderPosResource extends BaseResource {
  deleteOrderPos(
    request: RequestFor<operations["deleteOrderPos"]>
  ): Promise<ResultFor<operations["deleteOrderPos"]>> {
    return this.call("deleteOrderPos", request);
  }
  getOrderPositionById(
    request: RequestFor<operations["getOrderPositionById"]>
  ): Promise<ResultFor<operations["getOrderPositionById"]>> {
    return this.call("getOrderPositionById", request);
  }
  getOrderPositions(
    request: RequestFor<operations["getOrderPositions"]> = {}
  ): Promise<ResultFor<operations["getOrderPositions"]>> {
    return this.call("getOrderPositions", request);
  }
  updateOrderPosition(
    request: RequestFor<operations["updateOrderPosition"]>
  ): Promise<ResultFor<operations["updateOrderPosition"]>> {
    return this.call("updateOrderPosition", request);
  }
}
