import type { SevdeskClient } from "../client/sevdesk-client.js";
import {
  mapCreatedTagResult,
  mapTagListResult,
  mapTagRelationListResult,
  mapTagResult,
  mapUpdatedTagResult
} from "../domain/result-mappers.js";
import type {
  CreatedTagResult,
  TagListResult,
  TagRelationListResult,
  TagResult,
  UpdatedTagResult
} from "../domain/results.js";
import type { SevdeskIdInput, SevdeskObjectName, SevdeskReference } from "../types/references.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { validatePaginationLimit, validatePaginationOffset } from "../utils/validation.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericId,
  wireReference
} from "./internal.js";
import type { CuratedRequestOptions, WorkflowActionReceipt } from "./types.js";
import { workflowActionReceipt, workflowWriteOptions } from "./workflow.js";

export type TagTargetName = Extract<
  SevdeskObjectName,
  "Invoice" | "Voucher" | "Order" | "CreditNote"
>;

export interface TagListOptions {
  readonly id?: SevdeskIdInput;
  readonly name?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly countAll?: boolean;
}

export interface TagRelationListOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly countAll?: boolean;
}

export interface TagCreateInput {
  readonly name?: string;
  readonly object: SevdeskReference<TagTargetName>;
}

export interface TagUpdateInput {
  readonly name: string;
}

export type TagDeleteResult = WorkflowActionReceipt<"deleteTag">;

export class TagsBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async list(
    options: TagListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<TagListResult> {
    const result = await this.client.raw.tag.getTags(
      asRequest<"getTags">(
        {
          query: {
            ...pageQuery(options, "tags list"),
            ...(options.id === undefined ? {} : { id: numericId(options.id, "tag") }),
            ...(options.name === undefined ? {} : { name: options.name })
          }
        },
        requestOptions
      )
    );
    return mapTagListResult(result);
  }
  public async get(tagId: SevdeskIdInput, requestOptions?: CuratedRequestOptions): Promise<TagResult> {
    const result = await this.client.raw.tag.getTagById(
      asRequest<"getTagById">({ path: { tagId: numericId(tagId, "tag") } }, requestOptions)
    );
    return mapTagResult(result);
  }
  public async relations(
    options: TagRelationListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<TagRelationListResult> {
    const result = await this.client.raw.tag.getTagRelations(
      asRequest<"getTagRelations">(
        { query: pageQuery(options, "tag relations list") },
        requestOptions
      )
    );
    return mapTagRelationListResult(result);
  }
  public async create(
    input: TagCreateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedTagResult> {
    const result = await this.client.raw.tag.createTag(
      forwardCompatibleRequest<"createTag">(
        {
          body: forwardCompatibleBody({
            ...(input.name === undefined ? {} : { name: input.name }),
            object: wireReference(input.object)
          })
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapCreatedTagResult(result);
  }
  public async update(
    tagId: SevdeskIdInput,
    input: TagUpdateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<UpdatedTagResult> {
    if (typeof input.name !== "string" || input.name.trim() === "") {
      throw new SevdeskConfigurationError("Tag update requires a non-empty name.");
    }
    const result = await this.client.raw.tag.updateTag(
      forwardCompatibleRequest<"updateTag">(
        {
          path: { tagId: numericId(tagId, "tag") },
          body: forwardCompatibleBody({ name: input.name.trim() })
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapUpdatedTagResult(result);
  }
  public async delete(
    tagId: SevdeskIdInput,
    options: { readonly confirm: true },
    requestOptions?: CuratedRequestOptions
  ): Promise<TagDeleteResult> {
    if (options.confirm !== true) {
      throw new SevdeskConfigurationError("tags.delete requires { confirm: true }.");
    }
    const result = await this.client.raw.tag.deleteTag(
      asRequest<"deleteTag">(
        { path: { tagId: numericId(tagId, "tag") } },
        workflowWriteOptions(requestOptions)
      )
    );
    return workflowActionReceipt("deleteTag", result);
  }
}

function pageQuery(
  options: { readonly limit?: number; readonly offset?: number; readonly countAll?: boolean },
  label: string
): { limit?: number; offset?: number; countAll?: boolean } {
  return {
    ...(options.limit === undefined ? {} : { limit: validatePaginationLimit(options.limit, label) }),
    ...(options.offset === undefined
      ? {}
      : { offset: validatePaginationOffset(options.offset, label) }),
    ...(options.countAll === undefined ? {} : { countAll: options.countAll })
  };
}
