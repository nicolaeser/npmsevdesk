import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class PartResource extends BaseResource {
  createPart(
    request: RequestFor<operations["createPart"]>
  ): Promise<ResultFor<operations["createPart"]>> {
    return this.call("createPart", request);
  }
  getPartById(
    request: RequestFor<operations["getPartById"]>
  ): Promise<ResultFor<operations["getPartById"]>> {
    return this.call("getPartById", request);
  }
  getParts(
    request: RequestFor<operations["getParts"]> = {}
  ): Promise<ResultFor<operations["getParts"]>> {
    return this.call("getParts", request);
  }
  partGetStock(
    request: RequestFor<operations["partGetStock"]>
  ): Promise<ResultFor<operations["partGetStock"]>> {
    return this.call("partGetStock", request);
  }
  updatePart(
    request: RequestFor<operations["updatePart"]>
  ): Promise<ResultFor<operations["updatePart"]>> {
    return this.call("updatePart", request);
  }
}
