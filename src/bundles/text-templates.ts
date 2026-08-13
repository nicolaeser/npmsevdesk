import type { SevdeskClient } from "../client/sevdesk-client.js";
import {
  mapCreatedTextTemplateResult,
  mapTextTemplateListResult,
  mapUpdatedTextTemplateResult
} from "../domain/result-mappers.js";
import type {
  CreatedTextTemplateResult,
  TextTemplateListResult,
  UpdatedTextTemplateResult
} from "../domain/results.js";
import {
  TextTemplateCategory,
  TextTemplateTextType,
  type TextTemplateCategoryInput,
  type TextTemplateTextTypeInput
} from "../enums/domain-enums.js";
import type { SevdeskIdInput } from "../types/references.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { validatePaginationLimit, validatePaginationOffset } from "../utils/validation.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericId,
  stringEnumCode
} from "./internal.js";
import type { CuratedRequestOptions, WorkflowActionReceipt } from "./types.js";
import { workflowActionReceipt, workflowWriteOptions } from "./workflow.js";

export type TextTemplateObjectType =
  | "AB"
  | "ALL"
  | "AN"
  | "CN"
  | "LI"
  | "MA"
  | "PAYMENT_CONFIRMATION"
  | "RE";

export interface TextTemplateListOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly countAll?: boolean;
  readonly category?: TextTemplateCategoryInput;
  readonly objectType?: TextTemplateObjectType;
  readonly textType?: TextTemplateTextTypeInput;
}

export interface TextTemplateCreateInput {
  readonly name: string;
  readonly text: string;
  readonly category?: TextTemplateCategoryInput;
  readonly objectType?: TextTemplateObjectType;
  readonly textType?: TextTemplateTextTypeInput;
}

export type TextTemplateUpdateInput = TextTemplateCreateInput;

export type TextTemplateDeleteResult = WorkflowActionReceipt<"deleteTextTemplate">;

export class TextTemplatesBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async list(
    options: TextTemplateListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<TextTemplateListResult> {
    const result = await this.client.raw.textTemplate.getTextTemplate(
      asRequest<"getTextTemplate">({ query: textTemplateQuery(options) }, requestOptions)
    );
    return mapTextTemplateListResult(result);
  }
  public async create(
    input: TextTemplateCreateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedTextTemplateResult> {
    const result = await this.client.raw.textTemplate.addTextTemplate(
      forwardCompatibleRequest<"addTextTemplate">(
        { body: buildTextTemplatePayload(input) },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapCreatedTextTemplateResult(result);
  }
  public async update(
    templateId: SevdeskIdInput,
    input: TextTemplateUpdateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<UpdatedTextTemplateResult> {
    const result = await this.client.raw.textTemplate.updateTextTemplate(
      forwardCompatibleRequest<"updateTextTemplate">(
        {
          path: { id: numericId(templateId, "text template") },
          body: buildTextTemplatePayload(input)
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapUpdatedTextTemplateResult(result);
  }
  public async delete(
    templateId: SevdeskIdInput,
    options: { readonly confirm: true },
    requestOptions?: CuratedRequestOptions
  ): Promise<TextTemplateDeleteResult> {
    if (options.confirm !== true) {
      throw new SevdeskConfigurationError("textTemplates.delete requires { confirm: true }.");
    }
    const result = await this.client.raw.textTemplate.deleteTextTemplate(
      asRequest<"deleteTextTemplate">(
        { path: { id: numericId(templateId, "text template") } },
        workflowWriteOptions(requestOptions)
      )
    );
    return workflowActionReceipt("deleteTextTemplate", result);
  }
}

function textTemplateQuery(options: TextTemplateListOptions) {
  return {
    ...(options.limit === undefined
      ? {}
      : { limit: validatePaginationLimit(options.limit, "text-templates list") }),
    ...(options.offset === undefined
      ? {}
      : { offset: validatePaginationOffset(options.offset, "text-templates list") }),
    ...(options.countAll === undefined ? {} : { countAll: options.countAll }),
    ...(options.category === undefined
      ? {}
      : {
          category: stringEnumCode(
            TextTemplateCategory,
            options.category,
            "text-template category"
          ) as TextTemplateObjectType extends never ? never : "DOCUMENT" | "LETTER" | "MAIL"
        }),
    ...(options.objectType === undefined ? {} : { objectType: options.objectType }),
    ...(options.textType === undefined
      ? {}
      : {
          textType: stringEnumCode(
            TextTemplateTextType,
            options.textType,
            "text-template text type"
          ) as "FOOT" | "HEAD" | "SIGNATURE" | "SUBJECT" | "TEXT"
        })
  };
}

function buildTextTemplatePayload(input: TextTemplateCreateInput) {
  if (typeof input.name !== "string" || input.name.trim() === "") {
    throw new SevdeskConfigurationError("Text template name must be a non-empty string.");
  }
  if (typeof input.text !== "string") {
    throw new SevdeskConfigurationError("Text template text must be a string.");
  }
  return forwardCompatibleBody({
    name: input.name.trim(),
    text: input.text,
    ...(input.category === undefined
      ? {}
      : {
          category: stringEnumCode(TextTemplateCategory, input.category, "text-template category")
        }),
    ...(input.objectType === undefined ? {} : { objectType: input.objectType }),
    ...(input.textType === undefined
      ? {}
      : {
          textType: stringEnumCode(TextTemplateTextType, input.textType, "text-template text type")
        })
  });
}
