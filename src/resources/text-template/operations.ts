import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class TextTemplateResource extends BaseResource {
  addTextTemplate(
    request: RequestFor<operations["addTextTemplate"]>
  ): Promise<ResultFor<operations["addTextTemplate"]>> {
    return this.call("addTextTemplate", request);
  }
  deleteTextTemplate(
    request: RequestFor<operations["deleteTextTemplate"]>
  ): Promise<ResultFor<operations["deleteTextTemplate"]>> {
    return this.call("deleteTextTemplate", request);
  }
  getTextTemplate(
    request: RequestFor<operations["getTextTemplate"]> = {}
  ): Promise<ResultFor<operations["getTextTemplate"]>> {
    return this.call("getTextTemplate", request);
  }
  updateTextTemplate(
    request: RequestFor<operations["updateTextTemplate"]>
  ): Promise<ResultFor<operations["updateTextTemplate"]>> {
    return this.call("updateTextTemplate", request);
  }
}
