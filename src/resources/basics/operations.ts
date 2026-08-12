import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class BasicsResource extends BaseResource {
  bookkeepingSystemVersion(
    request: RequestFor<operations["bookkeepingSystemVersion"]> = {}
  ): Promise<ResultFor<operations["bookkeepingSystemVersion"]>> {
    return this.call("bookkeepingSystemVersion", request);
  }
}
