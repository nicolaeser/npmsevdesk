import type { SevdeskClient } from "../client/sevdesk-client.js";
import type { operations } from "../types/openapi.js";
import type { ResponseJsonFor } from "../types/operation.js";
import type { SevdeskIdInput } from "../types/references.js";
import type { SevdeskResult } from "../types/result.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../utils/errors.js";
import { mapResultData } from "../utils/result.js";
import { asRequest, numericId } from "./internal.js";
import type {
  CuratedRequestOptions,
  OperationResult,
  RequireAtLeastOne,
  WorkflowActionReceipt,
  WorkflowResult
} from "./types.js";
import { workflowActionReceipt, workflowWriteOptions } from "./workflow.js";

export type LayoutDocumentKind = "invoice" | "order" | "creditNote";

export type LayoutTemplateType =
  | "Invoice"
  | "invoicereminder"
  | "Order"
  | "Contractnote"
  | "Packinglist"
  | "Letter"
  | "Creditnote";

export const LayoutLanguage = {
  GERMAN: "de_DE",
  GERMAN_AUSTRIA: "de_AT",
  GERMAN_SWITZERLAND: "de_CH",
  ENGLISH: "en_US",
  SPANISH: "es_ES",
  FRENCH: "fr_FR",
  ITALIAN: "id_IT",
  GREEK: "el_GR"
} as const;

export type LayoutLanguage = (typeof LayoutLanguage)[keyof typeof LayoutLanguage];

export const LayoutPayPalMode = {
  SHOW_ICON: "A",
  SHOW_LINK: "B",
  DISABLED: "C",
  AS_TEXT: "D"
} as const;

export type LayoutPayPalMode = (typeof LayoutPayPalMode)[keyof typeof LayoutPayPalMode];

export type LayoutParameterKey = "template" | "letterpaper" | "language" | "payPal";

export interface DocumentLayoutFields {
  readonly template?: string;
  readonly letterpaper?: string;
  readonly language?: LayoutLanguage;
  readonly payPal?: LayoutPayPalMode;
}

export type DocumentLayoutInput = RequireAtLeastOne<DocumentLayoutFields>;

export interface LayoutApplyOptions {
  readonly getAsPdf?: boolean;
}

export interface LayoutTemplateListOptions {
  readonly type?: LayoutTemplateType;
}

export interface LayoutTemplateFindInput {
  readonly name: string;
  readonly type?: LayoutTemplateType;
}

type TemplatesJson = ResponseJsonFor<operations["getTemplates"]>;
type TemplateWire = NonNullable<NonNullable<TemplatesJson>["templates"]>[number];

export type LayoutTemplate = Omit<TemplateWire, "id"> & {
  readonly id: string;
};

export type LayoutTemplateListResult = SevdeskResult<
  TemplatesJson,
  readonly LayoutTemplate[],
  undefined
>;

type LetterpapersJson = ResponseJsonFor<operations["getLetterpapersWithThumb"]>;
type LetterpaperWire = NonNullable<NonNullable<LetterpapersJson>["letterpapers"]>[number];

export type LayoutLetterpaper = Omit<LetterpaperWire, "id"> & {
  readonly id: string;
};

export type LayoutLetterpaperListResult = SevdeskResult<
  LetterpapersJson,
  readonly LayoutLetterpaper[],
  undefined
>;

export type LayoutOperationIdFor<TDocument extends LayoutDocumentKind> = TDocument extends "invoice"
  ? "updateInvoiceTemplate"
  : TDocument extends "order"
    ? "updateOrderTemplate"
    : "updateCreditNoteTemplate";

export type LayoutWorkflowNameFor<TDocument extends LayoutDocumentKind> = `layout.${TDocument}.set`;

type LayoutValueByKey = {
  readonly template: string;
  readonly letterpaper: string;
  readonly language: LayoutLanguage;
  readonly payPal: LayoutPayPalMode;
};

type RequiredLayoutKeys<TLayout> = {
  [TKey in LayoutParameterKey]-?: [TLayout] extends [Readonly<Record<TKey, unknown>>]
    ? TKey
    : never;
}[LayoutParameterKey];

type RequestedLayoutValue<TLayout, TKey extends LayoutParameterKey> =
  TLayout extends Readonly<Record<TKey, infer TValue>>
    ? Extract<TValue, LayoutValueByKey[TKey]>
    : LayoutValueByKey[TKey];

export interface AppliedLayoutParameter<
  TDocument extends LayoutDocumentKind,
  TKey extends LayoutParameterKey,
  TValue extends LayoutValueByKey[TKey] = LayoutValueByKey[TKey]
> {
  readonly key: TKey;
  readonly value: TValue;
  readonly receipt: WorkflowActionReceipt<LayoutOperationIdFor<TDocument>>;
}

export type AppliedLayoutParameters<
  TDocument extends LayoutDocumentKind,
  TLayout extends DocumentLayoutInput
> = Readonly<
  Partial<{
    [TKey in LayoutParameterKey]: AppliedLayoutParameter<
      TDocument,
      TKey,
      RequestedLayoutValue<TLayout, TKey>
    >;
  }>
> &
  Readonly<{
    [TKey in RequiredLayoutKeys<TLayout>]-?: AppliedLayoutParameter<
      TDocument,
      TKey,
      RequestedLayoutValue<TLayout, TKey>
    >;
  }>;

export interface SetLayoutWorkflowData<
  TDocument extends LayoutDocumentKind,
  TLayout extends DocumentLayoutInput
> {
  readonly document: TDocument;
  readonly documentId: number;
  readonly requested: TLayout;
  readonly applied: AppliedLayoutParameters<TDocument, TLayout>;
}

export interface SetLayoutWorkflowPartial<
  TDocument extends LayoutDocumentKind,
  TLayout extends DocumentLayoutInput
> {
  readonly document: TDocument;
  readonly documentId: number;
  readonly requested: TLayout;
  readonly applied: Readonly<
    Partial<{
      [TKey in LayoutParameterKey]: AppliedLayoutParameter<TDocument, TKey>;
    }>
  >;
}

export type SetLayoutWorkflowResult<
  TDocument extends LayoutDocumentKind,
  TLayout extends DocumentLayoutInput
> = WorkflowResult<
  LayoutWorkflowNameFor<TDocument>,
  SetLayoutWorkflowData<TDocument, TLayout>,
  LayoutOperationIdFor<TDocument>
>;

type LayoutPair = {
  [TKey in LayoutParameterKey]: {
    readonly key: TKey;
    readonly value: LayoutValueByKey[TKey];
  };
}[LayoutParameterKey];

export class LayoutBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async listTemplates(
    options: LayoutTemplateListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<LayoutTemplateListResult> {
    const result = await this.client.raw.layout.getTemplates(
      asRequest<"getTemplates">(
        {
          ...(options.type === undefined ? {} : { query: { type: options.type } })
        },
        requestOptions
      )
    );
    return mapResultData(result, normalizeTemplates(result.json));
  }
  public async findTemplate(
    input: LayoutTemplateFindInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<LayoutTemplate | undefined> {
    const name = requiredTemplateName(input.name);
    const listed = await this.listTemplates(
      input.type === undefined ? {} : { type: input.type },
      requestOptions
    );
    const matches = listed.data.filter((template) => (template.name ?? "").trim() === name);
    if (matches.length === 0) return undefined;
    if (matches.length > 1) {
      throw new SevdeskConfigurationError(
        `Multiple layout templates matched name "${name}"${input.type === undefined ? "" : ` for type ${input.type}`}.`
      );
    }
    return matches[0];
  }
  public async listLetterpapers(
    requestOptions?: CuratedRequestOptions
  ): Promise<LayoutLetterpaperListResult> {
    const result = await this.client.raw.layout.getLetterpapersWithThumb(
      asRequest<"getLetterpapersWithThumb">({}, requestOptions)
    );
    return mapResultData(result, normalizeLetterpapers(result.json));
  }
  public setInvoiceLayout<const TLayout extends DocumentLayoutInput>(
    invoiceId: SevdeskIdInput,
    layout: TLayout,
    options: LayoutApplyOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<SetLayoutWorkflowResult<"invoice", TLayout>> {
    const id = numericId(invoiceId, "invoice");
    return this.runLayoutWorkflow(
      "invoice",
      id,
      layout,
      requestOptions,
      "updateInvoiceTemplate",
      (pair, writeOptions) =>
        this.client.raw.layout.updateInvoiceTemplate(
          asRequest<"updateInvoiceTemplate">(
            {
              path: { invoiceId: id },
              ...(options.getAsPdf === undefined ? {} : { query: { getAsPdf: options.getAsPdf } }),
              body: pair
            },
            writeOptions
          )
        )
    );
  }
  public setOrderLayout<const TLayout extends DocumentLayoutInput>(
    orderId: SevdeskIdInput,
    layout: TLayout,
    options: LayoutApplyOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<SetLayoutWorkflowResult<"order", TLayout>> {
    const id = numericId(orderId, "order");
    return this.runLayoutWorkflow(
      "order",
      id,
      layout,
      requestOptions,
      "updateOrderTemplate",
      (pair, writeOptions) =>
        this.client.raw.layout.updateOrderTemplate(
          asRequest<"updateOrderTemplate">(
            {
              path: { orderId: id },
              ...(options.getAsPdf === undefined ? {} : { query: { getAsPdf: options.getAsPdf } }),
              body: pair
            },
            writeOptions
          )
        )
    );
  }
  public setCreditNoteLayout<const TLayout extends DocumentLayoutInput>(
    creditNoteId: SevdeskIdInput,
    layout: TLayout,
    options: LayoutApplyOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<SetLayoutWorkflowResult<"creditNote", TLayout>> {
    const id = numericId(creditNoteId, "credit note");
    return this.runLayoutWorkflow(
      "creditNote",
      id,
      layout,
      requestOptions,
      "updateCreditNoteTemplate",
      (pair, writeOptions) =>
        this.client.raw.layout.updateCreditNoteTemplate(
          asRequest<"updateCreditNoteTemplate">(
            {
              path: { creditNoteId: id },
              ...(options.getAsPdf === undefined ? {} : { query: { getAsPdf: options.getAsPdf } }),
              body: pair
            },
            writeOptions
          )
        )
    );
  }
  public setLayout<
    const TDocument extends LayoutDocumentKind,
    const TLayout extends DocumentLayoutInput
  >(
    document: TDocument,
    documentId: SevdeskIdInput,
    layout: TLayout,
    options: LayoutApplyOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<SetLayoutWorkflowResult<TDocument, TLayout>> {
    switch (document) {
      case "invoice":
        return this.setInvoiceLayout(documentId, layout, options, requestOptions) as Promise<
          SetLayoutWorkflowResult<TDocument, TLayout>
        >;
      case "order":
        return this.setOrderLayout(documentId, layout, options, requestOptions) as Promise<
          SetLayoutWorkflowResult<TDocument, TLayout>
        >;
      case "creditNote":
        return this.setCreditNoteLayout(documentId, layout, options, requestOptions) as Promise<
          SetLayoutWorkflowResult<TDocument, TLayout>
        >;
      default:
        throw new SevdeskConfigurationError(
          `Unsupported layout document kind "${String(document)}".`
        );
    }
  }
  private async runLayoutWorkflow<
    TDocument extends LayoutDocumentKind,
    TLayout extends DocumentLayoutInput
  >(
    document: TDocument,
    documentId: number,
    layout: TLayout,
    requestOptions: CuratedRequestOptions | undefined,
    operationId: LayoutOperationIdFor<TDocument>,
    execute: (
      pair: LayoutPair,
      writeOptions: CuratedRequestOptions
    ) => Promise<OperationResult<LayoutOperationIdFor<TDocument>>>
  ): Promise<SetLayoutWorkflowResult<TDocument, TLayout>> {
    const pairs = layoutPairs(layout);
    const workflow = `layout.${document}.set` as LayoutWorkflowNameFor<TDocument>;
    const context = this.client.createWorkflowContext<
      LayoutWorkflowNameFor<TDocument>,
      LayoutOperationIdFor<TDocument>,
      SetLayoutWorkflowPartial<TDocument, TLayout>
    >(workflow);
    const writeOptions = workflowWriteOptions(requestOptions);
    const applied: Partial<
      Record<LayoutParameterKey, AppliedLayoutParameter<TDocument, LayoutParameterKey>>
    > = {};
    try {
      for (const pair of pairs) {
        const result = await context.step(`set-${pair.key}`, operationId, () =>
          execute(pair, writeOptions)
        );
        const evidence: AppliedLayoutParameter<TDocument, typeof pair.key> = {
          key: pair.key,
          value: pair.value,
          receipt: workflowActionReceipt(operationId, result)
        };
        Object.assign(applied, { [pair.key]: evidence });
      }
      return context.result({
        document,
        documentId,
        requested: layout,
        applied: applied as AppliedLayoutParameters<TDocument, TLayout>
      });
    } catch (cause) {
      throw context.error(cause, {
        partial: {
          document,
          documentId,
          requested: layout,
          applied
        }
      });
    }
  }
}

function layoutPairs(layout: DocumentLayoutInput): readonly LayoutPair[] {
  const pairs: LayoutPair[] = [];
  if (layout.template !== undefined) {
    pairs.push({ key: "template", value: nonEmpty(layout.template, "template") });
  }
  if (layout.letterpaper !== undefined) {
    pairs.push({ key: "letterpaper", value: nonEmpty(layout.letterpaper, "letterpaper") });
  }
  if (layout.language !== undefined) {
    if (!LAYOUT_LANGUAGES.has(layout.language)) {
      throw new SevdeskConfigurationError(
        `Layout language "${String(layout.language)}" is not documented by the checked-in sevdesk OpenAPI specification.`
      );
    }
    pairs.push({ key: "language", value: layout.language });
  }
  if (layout.payPal !== undefined) {
    if (!LAYOUT_PAYPAL_MODES.has(layout.payPal)) {
      throw new SevdeskConfigurationError(
        `Layout payPal mode "${String(layout.payPal)}" is not documented by the checked-in sevdesk OpenAPI specification.`
      );
    }
    pairs.push({ key: "payPal", value: layout.payPal });
  }
  if (pairs.length === 0) {
    throw new SevdeskConfigurationError(
      "Layout update requires at least one of template, letterpaper, language, or payPal."
    );
  }
  return pairs;
}

const LAYOUT_LANGUAGES = new Set<string>(Object.values(LayoutLanguage));
const LAYOUT_PAYPAL_MODES = new Set<string>(Object.values(LayoutPayPalMode));

function normalizeTemplates(json: TemplatesJson): readonly LayoutTemplate[] {
  return layoutCollection(json, "templates", "template").map((template, index) => ({
    ...template,
    id: responseId(template, `template at index ${index}`)
  }));
}

function normalizeLetterpapers(json: LetterpapersJson): readonly LayoutLetterpaper[] {
  return layoutCollection(json, "letterpapers", "letterpaper").map((letterpaper, index) => ({
    ...letterpaper,
    id: responseId(letterpaper, `letterpaper at index ${index}`)
  }));
}

function layoutCollection<TKey extends "templates" | "letterpapers">(
  json: unknown,
  key: TKey,
  label: string
): readonly (TKey extends "templates" ? TemplateWire : LetterpaperWire)[] {
  const record = asRecord(json);
  const direct = record?.[key];
  if (Array.isArray(direct)) {
    return direct as readonly (TKey extends "templates" ? TemplateWire : LetterpaperWire)[];
  }
  const wrapped = asRecord(record?.objects)?.[key];
  if (Array.isArray(wrapped)) {
    return wrapped as readonly (TKey extends "templates" ? TemplateWire : LetterpaperWire)[];
  }
  throw new SevdeskResponseValidationError(
    `sevdesk returned a ${label} response without a ${key} collection.`,
    { value: json }
  );
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function responseId(value: unknown, label: string): string {
  if (value === null || typeof value !== "object" || !("id" in value)) {
    throw new SevdeskResponseValidationError(`sevdesk returned ${label} without an id.`, {
      value
    });
  }
  const id = value.id;
  if (typeof id !== "string" || id.trim() === "") {
    throw new SevdeskResponseValidationError(`sevdesk returned ${label} with an invalid id.`, {
      value
    });
  }
  return id;
}

function nonEmpty(value: string, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SevdeskConfigurationError(`Layout ${label} must be a non-empty string.`);
  }
  return value;
}

function requiredTemplateName(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SevdeskConfigurationError("layout.findTemplate requires a non-empty name.");
  }
  return value.trim();
}
