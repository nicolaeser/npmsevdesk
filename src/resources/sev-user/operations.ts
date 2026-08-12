import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class SevUserResource extends BaseResource {
  getSevUserById(
    request: RequestFor<operations["getSevUserById"]>
  ): Promise<ResultFor<operations["getSevUserById"]>> {
    return this.call("getSevUserById", request);
  }
  getSevUsers(
    request: RequestFor<operations["getSevUsers"]> = {}
  ): Promise<ResultFor<operations["getSevUsers"]>> {
    return this.call("getSevUsers", request);
  }
}
