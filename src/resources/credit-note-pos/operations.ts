import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class CreditNotePosResource extends BaseResource {
  getcreditNotePositions(
    request: RequestFor<operations["getcreditNotePositions"]> = {}
  ): Promise<ResultFor<operations["getcreditNotePositions"]>> {
    return this.call("getcreditNotePositions", request);
  }
}
