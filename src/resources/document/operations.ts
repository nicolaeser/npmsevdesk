import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class DocumentResource extends BaseResource {
  getDocuments(
    request: RequestFor<operations["getDocuments"]> = {}
  ): Promise<ResultFor<operations["getDocuments"]>> {
    return this.call("getDocuments", request);
  }
}
