import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class OrderResource extends BaseResource {
  createContractNoteFromOrder(
    request: RequestFor<operations["createContractNoteFromOrder"]>
  ): Promise<ResultFor<operations["createContractNoteFromOrder"]>> {
    return this.call("createContractNoteFromOrder", request);
  }
  createOrder(
    request: RequestFor<operations["createOrder"]>
  ): Promise<ResultFor<operations["createOrder"]>> {
    return this.call("createOrder", request);
  }
  createPackingListFromOrder(
    request: RequestFor<operations["createPackingListFromOrder"]>
  ): Promise<ResultFor<operations["createPackingListFromOrder"]>> {
    return this.call("createPackingListFromOrder", request);
  }
  deleteOrder(
    request: RequestFor<operations["deleteOrder"]>
  ): Promise<ResultFor<operations["deleteOrder"]>> {
    return this.call("deleteOrder", request);
  }
  getDiscounts(
    request: RequestFor<operations["getDiscounts"]>
  ): Promise<ResultFor<operations["getDiscounts"]>> {
    return this.call("getDiscounts", request);
  }
  getOrderById(
    request: RequestFor<operations["getOrderById"]>
  ): Promise<ResultFor<operations["getOrderById"]>> {
    return this.call("getOrderById", request);
  }
  getOrderPositionsById(
    request: RequestFor<operations["getOrderPositionsById"]>
  ): Promise<ResultFor<operations["getOrderPositionsById"]>> {
    return this.call("getOrderPositionsById", request);
  }
  getOrders(
    request: RequestFor<operations["getOrders"]> = {}
  ): Promise<ResultFor<operations["getOrders"]>> {
    return this.call("getOrders", request);
  }
  getRelatedObjects(
    request: RequestFor<operations["getRelatedObjects"]>
  ): Promise<ResultFor<operations["getRelatedObjects"]>> {
    return this.call("getRelatedObjects", request);
  }
  orderGetPdf(
    request: RequestFor<operations["orderGetPdf"]>
  ): Promise<ResultFor<operations["orderGetPdf"]>> {
    return this.call("orderGetPdf", request);
  }
  orderSendBy(
    request: RequestFor<operations["orderSendBy"]>
  ): Promise<ResultFor<operations["orderSendBy"]>> {
    return this.call("orderSendBy", request);
  }
  sendorderViaEMail(
    request: RequestFor<operations["sendorderViaEMail"]>
  ): Promise<ResultFor<operations["sendorderViaEMail"]>> {
    return this.call("sendorderViaEMail", request);
  }
  updateOrder(
    request: RequestFor<operations["updateOrder"]>
  ): Promise<ResultFor<operations["updateOrder"]>> {
    return this.call("updateOrder", request);
  }
}
