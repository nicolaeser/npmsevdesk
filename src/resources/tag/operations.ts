import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class TagResource extends BaseResource {
  createTag(
    request: RequestFor<operations["createTag"]>
  ): Promise<ResultFor<operations["createTag"]>> {
    return this.call("createTag", request);
  }
  deleteTag(
    request: RequestFor<operations["deleteTag"]>
  ): Promise<ResultFor<operations["deleteTag"]>> {
    return this.call("deleteTag", request);
  }
  getTagById(
    request: RequestFor<operations["getTagById"]>
  ): Promise<ResultFor<operations["getTagById"]>> {
    return this.call("getTagById", request);
  }
  getTagRelations(
    request: RequestFor<operations["getTagRelations"]> = {}
  ): Promise<ResultFor<operations["getTagRelations"]>> {
    return this.call("getTagRelations", request);
  }
  getTags(
    request: RequestFor<operations["getTags"]> = {}
  ): Promise<ResultFor<operations["getTags"]>> {
    return this.call("getTags", request);
  }
  updateTag(
    request: RequestFor<operations["updateTag"]>
  ): Promise<ResultFor<operations["updateTag"]>> {
    return this.call("updateTag", request);
  }
}
