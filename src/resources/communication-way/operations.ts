import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class CommunicationWayResource extends BaseResource {
  createCommunicationWay(
    request: RequestFor<operations["createCommunicationWay"]>
  ): Promise<ResultFor<operations["createCommunicationWay"]>> {
    return this.call("createCommunicationWay", request);
  }
  deleteCommunicationWay(
    request: RequestFor<operations["deleteCommunicationWay"]>
  ): Promise<ResultFor<operations["deleteCommunicationWay"]>> {
    return this.call("deleteCommunicationWay", request);
  }
  getCommunicationWayById(
    request: RequestFor<operations["getCommunicationWayById"]>
  ): Promise<ResultFor<operations["getCommunicationWayById"]>> {
    return this.call("getCommunicationWayById", request);
  }
  getCommunicationWayKeys(
    request: RequestFor<operations["getCommunicationWayKeys"]> = {}
  ): Promise<ResultFor<operations["getCommunicationWayKeys"]>> {
    return this.call("getCommunicationWayKeys", request);
  }
  getCommunicationWays(
    request: RequestFor<operations["getCommunicationWays"]> = {}
  ): Promise<ResultFor<operations["getCommunicationWays"]>> {
    return this.call("getCommunicationWays", request);
  }
  UpdateCommunicationWay(
    request: RequestFor<operations["UpdateCommunicationWay"]>
  ): Promise<ResultFor<operations["UpdateCommunicationWay"]>> {
    return this.call("UpdateCommunicationWay", request);
  }
}
