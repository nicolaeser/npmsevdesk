import type { SevdeskClient } from "../client/sevdesk-client.js";
import {
  mapCancelledInvoiceResult,
  mapCreatedInvoiceResult,
  mapInvoiceListResult,
  mapInvoicePositionListResult,
  mapInvoiceResult,
  mapSentInvoiceResult
} from "../domain/result-mappers.js";
import { normalizeInvoice, requireValue } from "../domain/normalizers.js";
import type {
  CancelledInvoiceResult,
  CreatedInvoice,
  CreatedInvoiceResult,
  InvoiceListResult,
  InvoicePositionListResult,
  InvoiceResult,
  SentInvoiceResult
} from "../domain/results.js";
import type { SevdeskInvoice, SevdeskInvoicePosition } from "../domain/models.js";
import {
  InvoiceFromOrderPartialType,
  InvoiceStatus,
  type InvoiceFromOrderPartialTypeInput
} from "../enums/domain-enums.js";
import type { SevdeskId, SevdeskIdInput, SevdeskReference } from "../types/references.js";
import {
  SevdeskApiError,
  SevdeskCancellationError,
  SevdeskConfigurationError,
  SevdeskNetworkError,
  SevdeskRateLimitError,
  SevdeskResponseValidationError,
  SevdeskTimeoutError
} from "../utils/errors.js";
import {
  validateFiniteNumber,
  validatePaginationLimit,
  validatePaginationOffset,
  validateSevdeskDateString
} from "../utils/validation.js";
import {
  buildDeliveryPayload,
  buildEntityReference,
  buildInvoiceBookingPayload,
  buildInvoicePayload
} from "./builders.js";
import type { components } from "../types/openapi.js";
import type { InvoiceEmbedInput, InvoicePositionEmbedInput } from "./embed.js";
import { invoiceListQuery } from "./filters.js";
import type { DocumentLayoutInput, LayoutApplyOptions, SetLayoutWorkflowResult } from "./layout.js";
import {
  mapDraftInvoiceResult,
  mapInvoiceRenderResult,
  mapInvoiceXmlResult,
  mapOpenInvoiceResult,
  mapPdfResult,
  type DocumentPdfOptions,
  type DraftInvoiceResult,
  type InvoicePdfResult,
  type InvoiceRenderOptions,
  type InvoiceRenderResult,
  type InvoiceXmlResult,
  type OpenInvoiceResult,
  type ResetToOpenConfirmation
} from "./document-output.js";
import {
  expectedOperations,
  normalizeInvoiceFinalizationCheckpoint,
  normalizeInvoiceFinalizationProbePolicy,
  reconcileInvoiceFinalizationState,
  updateInvoiceFinalizationCheckpoint,
  type CompleteInvoiceFinalizationReconciliation,
  type IncompleteInvoiceFinalizationReconciliation,
  type InvoiceFinalizationActionObservation,
  type InvoiceFinalizationCheckpoint,
  type InvoiceFinalizationExecutionReceipt,
  type InvoiceFinalizationFailurePartial,
  type InvoiceFinalizationInput,
  type InvoiceFinalizationProbeSummary,
  type InvoiceFinalizationProbeStepSummary,
  type InvoiceFinalizationReconciliation,
  type InvoiceFinalizationWriteOperationId,
  type NormalizedInvoiceFinalizationCheckpoint,
  type NormalizedInvoiceFinalizationProbePolicy,
  type ReconcileInvoiceFinalizationResult,
  type ResumeInvoiceFinalizationInput,
  type ResumeInvoiceFinalizationData,
  type ResumeInvoiceFinalizationResult
} from "./invoice-finalization.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericId,
  requireEntityId,
  stringEnumCode,
  wireReference
} from "./internal.js";

export interface InvoiceUpdateInput {
  readonly header?: string;
  readonly headText?: string | null;
  readonly footText?: string | null;
  readonly address?: string | null;
  readonly invoiceDate?: string;
  readonly deliveryDate?: string | null;
  readonly deliveryDateUntil?: number | null;
  readonly currency?: string;
  readonly customerInternalNote?: string | null;
  readonly contact?: SevdeskReference<"Contact">;
  readonly contactPerson?: SevdeskReference<"SevUser">;
}

export interface InvoicePositionUpdateFields {
  readonly name?: string | null;
  readonly text?: string | null;
  readonly quantity?: number;
  readonly price?: number | null;
  readonly priceNet?: number | null;
  readonly priceGross?: number | null;
  readonly taxRate?: number | null;
  readonly discount?: number | null;
  readonly positionNumber?: number | null;
  readonly unity?: SevdeskReference<"Unity">;
  readonly part?: SevdeskReference<"Part">;
}

type InvoiceWireUpdate = components["schemas"]["Model_InvoiceUpdate"];
import type {
  BookingInput,
  CuratedRequestOptions,
  InvoiceDelivery,
  InvoiceEmailDelivery,
  InvoiceFactoryInput,
  InvoiceFinalizingDelivery,
  InvoiceFinalizingPlan,
  InvoiceListOptions,
  InvoicePositionListOptions,
  MarkSentDelivery,
  OperationData,
  OperationResult,
  OptionalInvoiceFinalizingPlan,
  RequireAtLeastOne,
  WorkflowActionReceipt,
  WorkflowResult,
  WorkflowStep
} from "./types.js";

export type InvoicePositionUpdateInput = RequireAtLeastOne<InvoicePositionUpdateFields>;

type InvoicePosWireUpdate = components["schemas"]["Model_InvoicePosUpdate"];
import {
  assertNewDocumentTailIsValid,
  workflowActionReceipt,
  workflowWriteOptions,
  type WorkflowContext
} from "./workflow.js";

export type InvoiceUpdateWorkflowOperationId = "getInvoiceById" | "updateInvoiceById";

export interface InvoiceUpdateWorkflowData {
  readonly before: SevdeskInvoice;
  readonly receipt: WorkflowActionReceipt<"updateInvoiceById">;
  readonly invoice: SevdeskInvoice;
}

export interface InvoiceUpdateWorkflowPartial {
  readonly before?: SevdeskInvoice;
  readonly receipt?: WorkflowActionReceipt<"updateInvoiceById">;
}

export type InvoiceUpdateWorkflowResult = WorkflowResult<
  "invoices.update",
  InvoiceUpdateWorkflowData,
  InvoiceUpdateWorkflowOperationId
>;

export type InvoiceDeleteResult = WorkflowActionReceipt<"deleteInvoiceById">;

export type InvoiceEnshrineResult = OperationResult<"invoiceEnshrine">;

export type InvoicePositionUpdateWorkflowOperationId =
  | "getInvoicePos"
  | "getInvoiceById"
  | "updateInvoicePos";

export interface InvoicePositionUpdateWorkflowData {
  readonly before: SevdeskInvoice;
  readonly receipt: WorkflowActionReceipt<"updateInvoicePos">;
  readonly position: SevdeskInvoicePosition;
}

export interface InvoicePositionUpdateWorkflowPartial {
  readonly before?: SevdeskInvoice;
  readonly receipt?: WorkflowActionReceipt<"updateInvoicePos">;
}

export type InvoicePositionUpdateWorkflowResult = WorkflowResult<
  "invoices.updatePosition",
  InvoicePositionUpdateWorkflowData,
  InvoicePositionUpdateWorkflowOperationId
>;

export type CreateAndFinalizeInvoiceInput = InvoiceFactoryInput & InvoiceFinalizingPlan;

export type InvoiceWorkflowOperationId =
  | "createInvoiceByFactory"
  | "createInvoiceFromOrder"
  | "sendInvoiceViaEMail"
  | "invoiceSendBy"
  | "bookInvoice"
  | "invoiceEnshrine";

type PropertyValue<TValue, TKey extends PropertyKey> = TValue extends unknown
  ? TKey extends keyof TValue
    ? TValue[TKey]
    : never
  : never;

type InvoiceDeliveryOperationIdFor<TDelivery> = TDelivery extends {
  readonly channel: "email";
}
  ? "sendInvoiceViaEMail"
  : TDelivery extends { readonly channel: "mark-sent" }
    ? "invoiceSendBy"
    : never;

type InvoiceTailOperationId<TPlan> =
  | InvoiceDeliveryOperationIdFor<Exclude<PropertyValue<TPlan, "delivery">, undefined>>
  | ([Exclude<PropertyValue<TPlan, "booking">, undefined>] extends [never] ? never : "bookInvoice")
  | (true extends PropertyValue<TPlan, "enshrine"> ? "invoiceEnshrine" : never);

export type InvoiceFactoryWorkflowOperationId<TPlan> =
  "createInvoiceByFactory" | InvoiceTailOperationId<TPlan>;

export type InvoiceFromOrderWorkflowOperationId<TPlan> =
  "createInvoiceFromOrder" | InvoiceTailOperationId<TPlan>;

type InvoiceEmailDeliveryData = NonNullable<OperationData<"sendInvoiceViaEMail">>;
type InvoiceMarkSentDeliveryData = SevdeskInvoice;
type InvoiceDeliveryData = InvoiceEmailDeliveryData | InvoiceMarkSentDeliveryData;
type InvoiceBookingData = NonNullable<OperationData<"bookInvoice">>;

export type InvoiceDeliveryDataFor<TDelivery> = TDelivery extends {
  readonly channel: "email";
}
  ? InvoiceEmailDeliveryData
  : TDelivery extends { readonly channel: "mark-sent" }
    ? InvoiceMarkSentDeliveryData
    : InvoiceDeliveryData;

export interface InvoiceWorkflowData<
  TCreated extends CreatedInvoice | SevdeskInvoice = CreatedInvoice | SevdeskInvoice
> {
  readonly created: TCreated;
  readonly delivery?: InvoiceDeliveryData;
  readonly booking?: InvoiceBookingData;
  readonly enshrinement?: WorkflowActionReceipt<"invoiceEnshrine">;
  readonly enshrined?: OperationData<"invoiceEnshrine">;
}

export type InvoiceWorkflowFor<
  TCreated extends CreatedInvoice | SevdeskInvoice,
  TPlan
> = InvoiceWorkflowData<TCreated> &
  (TPlan extends { readonly delivery: infer TDelivery }
    ? { readonly delivery: InvoiceDeliveryDataFor<TDelivery> }
    : object) &
  (TPlan extends { readonly booking: BookingInput }
    ? { readonly booking: InvoiceBookingData }
    : object) &
  (TPlan extends { readonly enshrine: true }
    ? { readonly enshrinement: WorkflowActionReceipt<"invoiceEnshrine"> }
    : object);

export type CreateAndFinalizeInvoiceWorkflowResult<TInput> = WorkflowResult<
  "invoices.createAndFinalize",
  InvoiceWorkflowFor<CreatedInvoice, TInput>,
  InvoiceFactoryWorkflowOperationId<TInput>
>;

export type CreateAndDeliverInvoiceWorkflowResult<TInput> = WorkflowResult<
  "invoices.createAndDeliver",
  InvoiceWorkflowFor<CreatedInvoice, TInput>,
  InvoiceFactoryWorkflowOperationId<TInput>
>;

export type CreateAndBookInvoiceWorkflowResult<TInput> = WorkflowResult<
  "invoices.createAndBook",
  InvoiceWorkflowFor<CreatedInvoice, TInput>,
  InvoiceFactoryWorkflowOperationId<TInput>
>;

export type CreateInvoiceFromOrderWorkflowResult<TInput> = WorkflowResult<
  "invoices.createFromOrder",
  InvoiceWorkflowFor<SevdeskInvoice, TInput>,
  InvoiceFromOrderWorkflowOperationId<TInput>
>;

type InvoiceFromOrderBase = {
  readonly orderId: SevdeskIdInput;
  readonly type?: "percentage" | "net" | "gross";
  readonly amount?: number;
  readonly partialType?: InvoiceFromOrderPartialTypeInput;
};

export type { InvoiceFromOrderPartialTypeInput } from "../enums/domain-enums.js";

export type InvoiceFromOrderInput = InvoiceFromOrderBase & OptionalInvoiceFinalizingPlan;

export type {
  CompleteInvoiceFinalizationReconciliation,
  IncompleteInvoiceFinalizationReconciliation,
  InvoiceFinalizationActionObservation,
  InvoiceFinalizationBlockedReason,
  InvoiceFinalizationCheckpoint,
  InvoiceFinalizationCheckpointOperationId,
  InvoiceFinalizationCheckpointSeed,
  InvoiceFinalizationExecutionReceipt,
  InvoiceFinalizationFailurePartial,
  InvoiceFinalizationFingerprint,
  InvoiceFinalizationHistory,
  InvoiceFinalizationInput,
  InvoiceFinalizationOperationIdFor,
  InvoiceFinalizationProbePolicy,
  InvoiceFinalizationProbeSummary,
  InvoiceFinalizationProbeStepSummary,
  InvoiceFinalizationReconciliation,
  InvoiceFinalizationStepHint,
  InvoiceFinalizationWriteOperationId,
  PersistedInvoiceBooking,
  PersistedInvoiceFinalizationPlan,
  ReconcileInvoiceFinalizationResult,
  ResumeInvoiceFinalizationData,
  ResumeInvoiceFinalizationInput,
  ResumeInvoiceFinalizationResult
} from "./invoice-finalization.js";

export {
  createInvoiceFinalizationCheckpoint,
  parseInvoiceFinalizationCheckpoint,
  serializeInvoiceFinalizationCheckpoint,
  updateInvoiceFinalizationCheckpoint
} from "./invoice-finalization.js";

type InvoiceFinalizationWorkflowOperationId =
  "getInvoiceById" | InvoiceFinalizationWriteOperationId;

export class InvoicesBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async list(
    options: InvoiceListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceListResult> {
    const result = await this.client.raw.invoice.getInvoices(
      asRequest<"getInvoices">(
        {
          extraQuery: invoiceListQuery(options)
        },
        requestOptions
      )
    );
    return mapInvoiceListResult(result);
  }
  public async listPositions(
    invoiceId: SevdeskIdInput,
    options: InvoicePositionListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoicePositionListResult> {
    const limit =
      options.limit === undefined
        ? undefined
        : validatePaginationLimit(options.limit, "invoice positions list");
    const offset =
      options.offset === undefined
        ? undefined
        : validatePaginationOffset(options.offset, "invoice positions list");
    const embed = positionEmbedQuery(options.embed);
    const result = await this.client.raw.invoice.getInvoicePositionsById(
      asRequest<"getInvoicePositionsById">(
        {
          path: { invoiceId: numericId(invoiceId, "invoice") },
          query: {
            ...(limit === undefined ? {} : { limit }),
            ...(offset === undefined ? {} : { offset }),
            ...(options.countAll === undefined ? {} : { countAll: options.countAll }),
            ...(embed === undefined ? {} : { embed })
          }
        },
        requestOptions
      )
    );
    return mapInvoicePositionListResult(result);
  }
  public async get(
    invoiceId: SevdeskIdInput,
    embed: readonly InvoiceEmbedInput[] = [],
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceResult> {
    const result = await this.client.raw.invoice.getInvoiceById(
      asRequest<"getInvoiceById">(
        {
          path: { invoiceId: numericId(invoiceId, "invoice") },
          ...(embed.length ? { extraQuery: { embed } } : {})
        },
        requestOptions
      )
    );
    return mapInvoiceResult(result);
  }
  public async update(
    invoiceId: SevdeskIdInput,
    input: InvoiceUpdateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceUpdateWorkflowResult> {
    const id = numericId(invoiceId, "invoice");
    const body = buildInvoiceUpdatePayload(input);
    const context = this.client.createWorkflowContext<
      "invoices.update",
      InvoiceUpdateWorkflowOperationId,
      InvoiceUpdateWorkflowPartial
    >("invoices.update");
    let before: SevdeskInvoice;
    try {
      const current = await context.step("load invoice before update", "getInvoiceById", () =>
        this.get(id, [], requestOptions)
      );
      before = current.data;
    } catch (error) {
      throw context.error(error, { partial: {} });
    }
    assertDraftDocument(before, "invoice");
    const partial: {
      before: SevdeskInvoice;
      receipt?: WorkflowActionReceipt<"updateInvoiceById">;
    } = { before };
    try {
      const updated = await context.step("update invoice", "updateInvoiceById", () =>
        this.client.raw.invoice.updateInvoiceById(
          forwardCompatibleRequest<"updateInvoiceById">(
            { path: { invoiceId: id }, body },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      const receipt = workflowActionReceipt("updateInvoiceById", updated);
      partial.receipt = receipt;
      const hydrated = await context.step("load invoice after update", "getInvoiceById", () =>
        this.get(id, [], requestOptions)
      );
      return context.result({ before, receipt, invoice: hydrated.data });
    } catch (error) {
      throw context.error(error, { partial });
    }
  }
  public async delete(
    invoiceId: SevdeskIdInput,
    options: { readonly confirm: true },
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceDeleteResult> {
    if (options.confirm !== true) {
      throw new SevdeskConfigurationError("invoices.delete requires { confirm: true }.");
    }
    const id = numericId(invoiceId, "invoice");
    const current = await this.get(id, [], requestOptions);
    assertDraftDocument(current.data, "invoice");
    const result = await this.client.raw.invoice.deleteInvoiceById(
      asRequest<"deleteInvoiceById">(
        { path: { invoiceId: id } },
        workflowWriteOptions(requestOptions)
      )
    );
    return workflowActionReceipt("deleteInvoiceById", result);
  }
  public async updatePosition(
    positionId: SevdeskIdInput,
    input: InvoicePositionUpdateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoicePositionUpdateWorkflowResult> {
    const id = numericId(positionId, "invoice position");
    const body = buildInvoicePositionUpdatePayload(input);
    const context = this.client.createWorkflowContext<
      "invoices.updatePosition",
      InvoicePositionUpdateWorkflowOperationId,
      InvoicePositionUpdateWorkflowPartial
    >("invoices.updatePosition");
    let before: SevdeskInvoice;
    try {
      const current = await context.step("load invoice position before update", "getInvoicePos", () =>
        this.client.raw.invoicePos.getInvoicePos(
          asRequest<"getInvoicePos">({ query: { id } }, requestOptions)
        )
      );
      const position = requireSingleInvoicePosition(current.data, id);
      const invoiceId = requirePositionInvoiceId(position);
      const invoice = await context.step("load invoice before position update", "getInvoiceById", () =>
        this.get(invoiceId, [], requestOptions)
      );
      before = invoice.data;
    } catch (error) {
      throw context.error(error, { partial: {} });
    }
    assertDraftDocument(before, "invoice");
    const partial: {
      before: SevdeskInvoice;
      receipt?: WorkflowActionReceipt<"updateInvoicePos">;
    } = { before };
    try {
      const updated = await context.step("update invoice position", "updateInvoicePos", () =>
        this.client.raw.invoicePos.updateInvoicePos(
          forwardCompatibleRequest<"updateInvoicePos">(
            { path: { invoicePosId: id }, body },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      const receipt = workflowActionReceipt("updateInvoicePos", updated);
      partial.receipt = receipt;
      const reloaded = await context.step("load invoice position after update", "getInvoicePos", () =>
        this.client.raw.invoicePos.getInvoicePos(
          asRequest<"getInvoicePos">({ query: { id } }, requestOptions)
        )
      );
      return context.result({
        before,
        receipt,
        position: requireSingleInvoicePosition(reloaded.data, id)
      });
    } catch (error) {
      throw context.error(error, { partial });
    }
  }
  public enshrine(
    invoiceId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceEnshrineResult> {
    return this.client.raw.invoice.invoiceEnshrine(
      asRequest<"invoiceEnshrine">(
        { path: { invoiceId: numericId(invoiceId, "invoice") } },
        workflowWriteOptions(requestOptions)
      )
    );
  }
  public async create(
    input: InvoiceFactoryInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedInvoiceResult> {
    const result = await this.client.raw.invoice.createInvoiceByFactory(
      forwardCompatibleRequest<"createInvoiceByFactory">(
        {
          body: buildInvoicePayload(input)
        },
        requestOptions
      )
    );
    return mapCreatedInvoiceResult(result);
  }
  public async createAndFinalize<const TInput extends CreateAndFinalizeInvoiceInput>(
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateAndFinalizeInvoiceWorkflowResult<TInput>> {
    return this.createFactoryWorkflow("invoices.createAndFinalize", input, requestOptions);
  }
  public createAndDeliver<
    const TInput extends InvoiceFactoryInput & {
      readonly delivery: InvoiceFinalizingDelivery;
      readonly booking?: BookingInput;
      readonly enshrine?: boolean;
    }
  >(
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateAndDeliverInvoiceWorkflowResult<TInput>> {
    return this.createFactoryWorkflow("invoices.createAndDeliver", input, requestOptions);
  }
  public createAndBook<
    const TInput extends InvoiceFactoryInput & {
      readonly booking: BookingInput;
      readonly delivery?: InvoiceFinalizingDelivery;
      readonly enshrine?: boolean;
    }
  >(
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateAndBookInvoiceWorkflowResult<TInput>> {
    return this.createFactoryWorkflow("invoices.createAndBook", input, requestOptions);
  }
  public async createFromOrder<const TInput extends InvoiceFromOrderInput>(
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateInvoiceFromOrderWorkflowResult<TInput>> {
    assertNewDocumentTailIsValid(input, "invoice", { allowNoAction: true });
    const createPayload = forwardCompatibleBody({
      order: buildEntityReference("Order", input.orderId),
      ...(input.type ? { type: input.type } : {}),
      ...(input.amount === undefined
        ? {}
        : { amount: validateFiniteNumber(input.amount, "invoice-from-order amount") }),
      ...(input.partialType === undefined
        ? {}
        : {
            partialType: stringEnumCode(
              InvoiceFromOrderPartialType,
              input.partialType,
              "invoice-from-order partial type"
            )
          })
    });
    const context = this.client.createWorkflowContext<
      "invoices.createFromOrder",
      InvoiceWorkflowOperationId
    >("invoices.createFromOrder");
    try {
      const created = await context.step(
        "create invoice from order",
        "createInvoiceFromOrder",
        () =>
          this.client.raw.invoice.createInvoiceFromOrder(
            forwardCompatibleRequest<"createInvoiceFromOrder">(
              {
                body: createPayload
              },
              workflowWriteOptions(requestOptions)
            )
          )
      );
      const invoiceId = requireEntityId(created.data, "invoice from order");
      const normalizedCreated = normalizeInvoice(
        requireValue(created.data, "invoice created from order")
      );
      const tail = await this.runTail(context, invoiceId, input, requestOptions);
      const result: WorkflowResult<
        "invoices.createFromOrder",
        InvoiceWorkflowData<SevdeskInvoice>,
        InvoiceWorkflowOperationId
      > = context.result({
        created: normalizedCreated,
        ...tail
      });
      return refineInvoiceWorkflow(result, input) as CreateInvoiceFromOrderWorkflowResult<TInput>;
    } catch (error) {
      throw context.error(error);
    }
  }
  public book(
    invoiceId: SevdeskIdInput,
    booking: BookingInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<OperationResult<"bookInvoice">> {
    return this.client.raw.invoice.bookInvoice(
      forwardCompatibleRequest<"bookInvoice">(
        {
          path: { invoiceId: numericId(invoiceId, "invoice") },
          body: buildInvoiceBookingPayload(booking)
        },
        requestOptions
      )
    );
  }
  public sendByEmail(
    invoiceId: SevdeskIdInput,
    delivery: InvoiceEmailDelivery,
    requestOptions?: CuratedRequestOptions
  ): Promise<OperationResult<"sendInvoiceViaEMail">> {
    return this.client.raw.invoice.sendInvoiceViaEMail(
      forwardCompatibleRequest<"sendInvoiceViaEMail">(
        {
          path: { invoiceId: numericId(invoiceId, "invoice") },
          body: buildDeliveryPayload(delivery)
        },
        requestOptions
      )
    );
  }
  public async markAsSent(
    invoiceId: SevdeskIdInput,
    delivery: MarkSentDelivery = {
      channel: "mark-sent"
    },
    requestOptions?: CuratedRequestOptions
  ): Promise<SentInvoiceResult> {
    const result = await this.client.raw.invoice.invoiceSendBy(
      forwardCompatibleRequest<"invoiceSendBy">(
        {
          path: { invoiceId: numericId(invoiceId, "invoice") },
          body: buildDeliveryPayload(delivery)
        },
        requestOptions
      )
    );
    return mapSentInvoiceResult(result);
  }
  public async cancel(
    invoiceId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CancelledInvoiceResult> {
    const result = await this.client.raw.invoice.cancelInvoice(
      asRequest<"cancelInvoice">(
        {
          path: { invoiceId: numericId(invoiceId, "invoice") }
        },
        requestOptions
      )
    );
    return mapCancelledInvoiceResult(result);
  }
  public async getPdf(
    invoiceId: SevdeskIdInput,
    options: DocumentPdfOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoicePdfResult> {
    const download = options.download ?? true;
    const markAsDownloaded = options.markAsDownloaded ?? false;
    const result = await this.client.raw.invoice.invoiceGetPdf(
      asRequest<"invoiceGetPdf">(
        {
          path: { invoiceId: numericId(invoiceId, "invoice") },
          query: {
            download,
            preventSendBy: !markAsDownloaded
          }
        },
        markAsDownloaded ? workflowWriteOptions(requestOptions) : requestOptions
      )
    );
    return mapPdfResult(result, "invoiceGetPdf", download);
  }
  public async render(
    invoiceId: SevdeskIdInput,
    options: InvoiceRenderOptions<true>,
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceRenderResult<true>>;
  public async render(
    invoiceId: SevdeskIdInput,
    options?: InvoiceRenderOptions<false>,
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceRenderResult<false>>;
  public async render<TGetAsPdf extends boolean>(
    invoiceId: SevdeskIdInput,
    options: InvoiceRenderOptions<TGetAsPdf>,
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceRenderResult<TGetAsPdf>>;
  public async render(
    invoiceId: SevdeskIdInput,
    options: InvoiceRenderOptions<boolean> = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceRenderResult<boolean>> {
    const result = await this.client.raw.invoice.invoiceRender(
      asRequest<"invoiceRender">(
        {
          path: { invoiceId: numericId(invoiceId, "invoice") },
          ...(options.getAsPdf === undefined ? {} : { query: { getAsPdf: options.getAsPdf } }),
          ...(options.forceReload === undefined
            ? {}
            : { body: { forceReload: options.forceReload } })
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapInvoiceRenderResult(result, options.getAsPdf ?? false);
  }
  public setLayout<const TLayout extends DocumentLayoutInput>(
    invoiceId: SevdeskIdInput,
    layout: TLayout,
    options: LayoutApplyOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<SetLayoutWorkflowResult<"invoice", TLayout>> {
    return this.client.layout.setInvoiceLayout(invoiceId, layout, options, requestOptions);
  }
  public async getXml(
    invoiceId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceXmlResult> {
    const result = await this.client.raw.invoice.invoiceGetXml(
      asRequest<"invoiceGetXml">(
        { path: { invoiceId: numericId(invoiceId, "invoice") } },
        requestOptions
      )
    );
    return mapInvoiceXmlResult(result);
  }
  public async resetToDraft(
    invoiceId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<DraftInvoiceResult> {
    const result = await this.client.raw.invoice.invoiceResetToDraft(
      asRequest<"invoiceResetToDraft">(
        { path: { invoiceId: numericId(invoiceId, "invoice") } },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapDraftInvoiceResult(result);
  }
  public async resetToOpen(
    invoiceId: SevdeskIdInput,
    confirmation: ResetToOpenConfirmation,
    requestOptions?: CuratedRequestOptions
  ): Promise<OpenInvoiceResult> {
    if (confirmation.confirmUnlinkTransactions !== true) {
      throw new SevdeskConfigurationError(
        "Resetting an invoice to open unlinks its transactions; pass { confirmUnlinkTransactions: true }."
      );
    }
    const result = await this.client.raw.invoice.invoiceResetToOpen(
      asRequest<"invoiceResetToOpen">(
        { path: { invoiceId: numericId(invoiceId, "invoice") } },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapOpenInvoiceResult(result);
  }
  public async reconcileFinalization<const TPlan extends InvoiceFinalizingPlan>(
    input: InvoiceFinalizationInput<TPlan>,
    requestOptions?: CuratedRequestOptions
  ): Promise<ReconcileInvoiceFinalizationResult<TPlan>> {
    const checkpoint = normalizeInvoiceFinalizationCheckpoint(input.plan, input);
    const probePolicy = normalizeInvoiceFinalizationProbePolicy(input.probe);
    const context = this.client.createWorkflowContext<
      "invoices.reconcileFinalization",
      InvoiceFinalizationWorkflowOperationId
    >("invoices.reconcileFinalization");
    try {
      const reconciliation = await this.probeFinalization(
        context,
        input.invoiceId,
        input.plan,
        checkpoint,
        probePolicy,
        requestOptions
      );
      return context.result(reconciliation) as ReconcileInvoiceFinalizationResult<TPlan>;
    } catch (error) {
      throw context.error(error);
    }
  }
  public async resumeFinalization<const TPlan extends InvoiceFinalizingPlan>(
    input: ResumeInvoiceFinalizationInput<TPlan>,
    requestOptions?: CuratedRequestOptions
  ): Promise<ResumeInvoiceFinalizationResult<TPlan>> {
    if (!Array.isArray(input.completedSteps)) {
      throw new SevdeskConfigurationError(
        "resumeFinalization requires an explicit completedSteps array; use [] only when no action was started."
      );
    }
    const checkpoint = normalizeInvoiceFinalizationCheckpoint(input.plan, input);
    const probePolicy = normalizeInvoiceFinalizationProbePolicy(input.probe);
    const context = this.client.createWorkflowContext<
      "invoices.resumeFinalization",
      InvoiceFinalizationWorkflowOperationId
    >("invoices.resumeFinalization");
    const executed: WorkflowActionReceipt<InvoiceFinalizationWriteOperationId>[] = [];
    let reconciliation: InvoiceFinalizationReconciliation<TPlan> | undefined;
    let activeCheckpoint: InvoiceFinalizationCheckpoint<TPlan> = input;
    let activeContextProbeCount = 0;
    try {
      reconciliation = await this.probeFinalization(
        context,
        input.invoiceId,
        input.plan,
        checkpoint,
        probePolicy,
        requestOptions
      );
      activeCheckpoint = reconciliation.checkpoint;
      activeContextProbeCount = countFinalizationProbeSteps(context.steps);
      if (reconciliation.complete) {
        const completedReconciliation = asCompleteFinalizationReconciliation(reconciliation);
        const data: ResumeInvoiceFinalizationData<TPlan> = {
          status: "already-complete",
          completed: true,
          reconciliation: completedReconciliation,
          initialReconciliation: reconciliation,
          executed: []
        };
        return context.result(data) as ResumeInvoiceFinalizationResult<TPlan>;
      }
      if (!reconciliation.canResume) {
        const blockedReconciliation = asIncompleteFinalizationReconciliation(reconciliation);
        const data: ResumeInvoiceFinalizationData<TPlan> = {
          status: "blocked",
          completed: false,
          reconciliation: blockedReconciliation,
          initialReconciliation: reconciliation,
          executed: []
        };
        return context.result(data) as ResumeInvoiceFinalizationResult<TPlan>;
      }
      const invoiceId = numericId(input.invoiceId, "invoice");
      const writeOptions = workflowWriteOptions(requestOptions);
      for (const operationId of expectedOperations(input.plan)) {
        const observation = observationFor(reconciliation, operationId);
        if (observation.state !== "ready") continue;
        switch (operationId) {
          case "sendInvoiceViaEMail": {
            if (input.plan.delivery?.channel !== "email") {
              throw new SevdeskResponseValidationError(
                "Invoice finalization delivery plan no longer matches its reconciliation.",
                { value: input.plan }
              );
            }
            const result = await context.step("resume invoice email delivery", operationId, () =>
              this.sendByEmail(invoiceId, input.plan.delivery as InvoiceEmailDelivery, writeOptions)
            );
            executed.push(workflowActionReceipt(operationId, result));
            break;
          }
          case "invoiceSendBy": {
            if (input.plan.delivery?.channel !== "mark-sent") {
              throw new SevdeskResponseValidationError(
                "Invoice finalization delivery plan no longer matches its reconciliation.",
                { value: input.plan }
              );
            }
            const result = await context.step("resume marking invoice as sent", operationId, () =>
              this.client.raw.invoice.invoiceSendBy(
                forwardCompatibleRequest<"invoiceSendBy">(
                  {
                    path: { invoiceId },
                    body: buildDeliveryPayload(input.plan.delivery as MarkSentDelivery)
                  },
                  writeOptions
                )
              )
            );
            executed.push(workflowActionReceipt(operationId, result));
            break;
          }
          case "bookInvoice": {
            if (input.plan.booking === undefined) {
              throw new SevdeskResponseValidationError(
                "Invoice finalization booking plan no longer matches its reconciliation.",
                { value: input.plan }
              );
            }
            const result = await context.step("resume invoice booking", operationId, () =>
              this.book(invoiceId, input.plan.booking as BookingInput, writeOptions)
            );
            executed.push(workflowActionReceipt(operationId, result));
            break;
          }
          case "invoiceEnshrine": {
            const result = await context.step("resume invoice enshrinement", operationId, () =>
              this.client.raw.invoice.invoiceEnshrine(
                asRequest<"invoiceEnshrine">({ path: { invoiceId } }, writeOptions)
              )
            );
            executed.push(workflowActionReceipt(operationId, result));
            break;
          }
        }
      }
      if (executed.length === 0) {
        throw new SevdeskResponseValidationError(
          "Invoice finalization reconciliation was resumable but exposed no executable action.",
          { value: reconciliation }
        );
      }
      const initialReconciliation = reconciliation;
      const creationSteps = initialReconciliation.checkpoint.completedSteps.filter(
        (operationId) =>
          operationId === "createInvoiceByFactory" || operationId === "createInvoiceFromOrder"
      );
      const acknowledgedCanonicalCheckpoint = updateInvoiceFinalizationCheckpoint(
        initialReconciliation.checkpoint,
        {
          completedSteps: [...creationSteps, ...expectedOperations(input.plan)],
          probeSteps: initialReconciliation.checkpoint.probeSteps
        }
      );
      const acknowledgedCheckpoint = normalizeInvoiceFinalizationCheckpoint(
        input.plan,
        acknowledgedCanonicalCheckpoint
      );
      activeCheckpoint = acknowledgedCanonicalCheckpoint;
      activeContextProbeCount = countFinalizationProbeSteps(context.steps);
      reconciliation = await this.probeFinalization(
        context,
        input.invoiceId,
        input.plan,
        acknowledgedCheckpoint,
        probePolicy,
        requestOptions
      );
      const executionReceipts = executed as unknown as readonly [
        InvoiceFinalizationExecutionReceipt<TPlan>,
        ...InvoiceFinalizationExecutionReceipt<TPlan>[]
      ];
      const data: ResumeInvoiceFinalizationData<TPlan> = reconciliation.complete
        ? {
            status: "resumed",
            completed: true,
            reconciliation: asCompleteFinalizationReconciliation(reconciliation),
            initialReconciliation,
            executed: executionReceipts
          }
        : {
            status: "blocked-after-resume",
            completed: false,
            reconciliation: asIncompleteFinalizationReconciliation(reconciliation),
            initialReconciliation,
            executed: executionReceipts
          };
      return context.result(data) as ResumeInvoiceFinalizationResult<TPlan>;
    } catch (error) {
      const failureCheckpoint = finalizationFailureCheckpoint(
        activeCheckpoint,
        input.plan,
        reconciliation,
        executed,
        context.currentOperationId,
        context.steps,
        activeContextProbeCount
      );
      const partial: InvoiceFinalizationFailurePartial<TPlan> = {
        ...(reconciliation === undefined ? {} : { reconciliation }),
        executed: executed as unknown as readonly InvoiceFinalizationExecutionReceipt<TPlan>[],
        checkpoint: failureCheckpoint
      };
      throw context.error<InvoiceFinalizationFailurePartial<TPlan>>(error, {
        partial
      });
    }
  }
  private async probeFinalization<
    TWorkflow extends "invoices.reconcileFinalization" | "invoices.resumeFinalization",
    const TPlan extends InvoiceFinalizingPlan
  >(
    context: WorkflowContext<TWorkflow, InvoiceFinalizationWorkflowOperationId>,
    invoiceId: SevdeskIdInput,
    plan: TPlan,
    checkpoint: NormalizedInvoiceFinalizationCheckpoint,
    policy: NormalizedInvoiceFinalizationProbePolicy,
    requestOptions?: CuratedRequestOptions
  ): Promise<InvoiceFinalizationReconciliation<TPlan>> {
    let lastError: unknown;
    const requestedInvoiceId = numericId(invoiceId, "invoice");
    const successfulProbeSteps: InvoiceFinalizationProbeStepSummary[] = [];
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
      assertProbeActive(requestOptions?.signal, policy.deadlineMs);
      try {
        const result = await context.step(
          "reconcile invoice finalization state",
          "getInvoiceById",
          () =>
            this.get(
              invoiceId,
              ["checkAccountTransactions"],
              finalizationProbeRequestOptions(requestOptions, policy)
            )
        );
        if (numericId(result.data.id, "invoice response") !== requestedInvoiceId) {
          throw new SevdeskResponseValidationError(
            "sevdesk returned a different invoice than the requested finalization target.",
            {
              value: {
                requestedInvoiceId,
                receivedInvoiceId: result.data.id
              }
            }
          );
        }
        successfulProbeSteps.push({
          operationId: "getInvoiceById",
          status: result.response.status
        });
        const summary: InvoiceFinalizationProbeSummary = {
          attempts: attempt,
          observedAt: new Date().toISOString(),
          maxAttempts: policy.maxAttempts
        };
        const reconciliation = reconcileInvoiceFinalizationState(
          result.data,
          plan,
          checkpoint,
          summary,
          successfulProbeSteps
        );
        if (!reconciliation.needsMoreObservation || attempt === policy.maxAttempts) {
          return reconciliation;
        }
      } catch (error) {
        lastError = error;
        if (!isRetryableFinalizationProbeError(error) || attempt === policy.maxAttempts) {
          throw error;
        }
      }
      const retryAfterMs =
        lastError instanceof SevdeskRateLimitError ? lastError.retryAfterMs : undefined;
      await finalizationProbeDelay(attempt, policy, requestOptions?.signal, retryAfterMs);
      lastError = undefined;
    }
    throw (
      lastError ??
      new SevdeskResponseValidationError("Invoice finalization probing ended without a result.", {
        value: { invoiceId, policy }
      })
    );
  }
  private async createFactoryWorkflow<
    TWorkflow extends
      "invoices.createAndFinalize" | "invoices.createAndDeliver" | "invoices.createAndBook",
    const TInput extends CreateAndFinalizeInvoiceInput
  >(
    workflow: TWorkflow,
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<
    WorkflowResult<
      TWorkflow,
      InvoiceWorkflowFor<CreatedInvoice, TInput>,
      InvoiceFactoryWorkflowOperationId<TInput>
    >
  > {
    assertNewDocumentTailIsValid(input, "invoice");
    const context = this.client.createWorkflowContext<TWorkflow, InvoiceWorkflowOperationId>(
      workflow
    );
    try {
      const created = await context.step(
        "create invoice with positions",
        "createInvoiceByFactory",
        () => this.create(input, workflowWriteOptions(requestOptions))
      );
      const invoiceId = requireEntityId(created.data, "invoice");
      const tail = await this.runTail(context, invoiceId, input, requestOptions);
      const result = context.result({
        created: created.data,
        ...tail
      });
      return refineInvoiceWorkflow(result, input) as WorkflowResult<
        TWorkflow,
        InvoiceWorkflowFor<CreatedInvoice, TInput>,
        InvoiceFactoryWorkflowOperationId<TInput>
      >;
    } catch (error) {
      throw context.error(error);
    }
  }
  private async runTail(
    context: WorkflowContext<string, InvoiceWorkflowOperationId>,
    invoiceId: SevdeskId,
    input: {
      readonly delivery?: InvoiceDelivery;
      readonly booking?: BookingInput;
      readonly enshrine?: boolean;
    },
    requestOptions?: CuratedRequestOptions
  ): Promise<Omit<InvoiceWorkflowData<CreatedInvoice>, "created">> {
    const writeOptions = workflowWriteOptions(requestOptions);
    let delivery: InvoiceDeliveryData | undefined;
    if (input.delivery) {
      if (input.delivery.channel === "email") {
        const sent = await context.step("send invoice by email", "sendInvoiceViaEMail", () =>
          this.sendByEmail(invoiceId, input.delivery as InvoiceEmailDelivery, writeOptions)
        );
        delivery = requireValue(sent.data, "invoice delivery");
      } else {
        const sent = await context.step("mark invoice as sent", "invoiceSendBy", () =>
          this.markAsSent(invoiceId, input.delivery as MarkSentDelivery, writeOptions)
        );
        delivery = sent.data;
      }
    }
    let booking: InvoiceBookingData | undefined;
    if (input.booking) {
      const booked = await context.step("book invoice", "bookInvoice", () =>
        this.book(invoiceId, input.booking as BookingInput, writeOptions)
      );
      booking = requireValue(booked.data, "invoice booking");
    }
    let enshrinement: WorkflowActionReceipt<"invoiceEnshrine"> | undefined;
    if (input.enshrine) {
      const result = await context.step("enshrine invoice", "invoiceEnshrine", () =>
        this.client.raw.invoice.invoiceEnshrine(
          asRequest<"invoiceEnshrine">(
            {
              path: { invoiceId: numericId(invoiceId, "invoice") }
            },
            writeOptions
          )
        )
      );
      enshrinement = workflowActionReceipt("invoiceEnshrine", result);
    }
    return {
      ...(delivery === undefined ? {} : { delivery }),
      ...(booking === undefined ? {} : { booking }),
      ...(enshrinement === undefined ? {} : { enshrinement, enshrined: enshrinement.data })
    };
  }
}

function positionEmbedQuery(
  embed: readonly InvoicePositionEmbedInput[] | undefined
): string[] | undefined {
  if (embed === undefined || embed.length === 0) return undefined;
  return [...embed];
}

function assertDraftDocument(
  document: { readonly status: string; readonly statusCode: number },
  label: string
): void {
  if (document.status === "DRAFT" || document.statusCode === InvoiceStatus.DRAFT) return;
  throw new SevdeskConfigurationError(
    `Only draft ${label}s can be updated or deleted through the curated API (status=${document.status}, code=${document.statusCode}).`
  );
}

function buildInvoicePositionUpdatePayload(
  input: InvoicePositionUpdateInput
): ReturnType<typeof forwardCompatibleBody<InvoicePosWireUpdate>> {
  const keys = Object.keys(input);
  if (keys.length === 0) {
    throw new SevdeskConfigurationError("Invoice position update must change at least one field.");
  }
  if (input.quantity !== undefined) {
    validateFiniteNumber(input.quantity, "invoice position quantity");
  }
  if (input.price !== undefined && input.price !== null) {
    validateFiniteNumber(input.price, "invoice position price");
  }
  if (input.priceNet !== undefined && input.priceNet !== null) {
    validateFiniteNumber(input.priceNet, "invoice position priceNet");
  }
  if (input.priceGross !== undefined && input.priceGross !== null) {
    validateFiniteNumber(input.priceGross, "invoice position priceGross");
  }
  if (input.taxRate !== undefined && input.taxRate !== null) {
    validateFiniteNumber(input.taxRate, "invoice position taxRate");
  }
  if (input.discount !== undefined && input.discount !== null) {
    validateFiniteNumber(input.discount, "invoice position discount");
  }
  if (
    input.positionNumber !== undefined &&
    input.positionNumber !== null &&
    !Number.isSafeInteger(input.positionNumber)
  ) {
    throw new SevdeskConfigurationError("invoice position positionNumber must be a safe integer.");
  }
  return forwardCompatibleBody<InvoicePosWireUpdate>({
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(input.text === undefined ? {} : { text: input.text }),
    ...(input.quantity === undefined ? {} : { quantity: input.quantity }),
    ...(input.price === undefined ? {} : { price: input.price }),
    ...(input.priceNet === undefined ? {} : { priceNet: input.priceNet }),
    ...(input.priceGross === undefined ? {} : { priceGross: input.priceGross }),
    ...(input.taxRate === undefined ? {} : { taxRate: input.taxRate }),
    ...(input.discount === undefined ? {} : { discount: input.discount }),
    ...(input.positionNumber === undefined ? {} : { positionNumber: input.positionNumber }),
    ...(input.unity === undefined ? {} : { unity: wireReference(input.unity) }),
    ...(input.part === undefined ? {} : { part: wireReference(input.part) })
  });
}

function requireSingleInvoicePosition(
  value: unknown,
  positionId: number
): SevdeskInvoicePosition {
  const collection = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  if (collection.length !== 1 || collection[0] === undefined) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned ${collection.length} invoice positions where exactly one was expected.`,
      { value }
    );
  }
  const position = collection[0] as SevdeskInvoicePosition;
  if (position.id !== undefined && numericId(position.id, "invoice position response") !== positionId) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned a different invoice position than requested.",
      { value: position }
    );
  }
  return position;
}

function requirePositionInvoiceId(position: SevdeskInvoicePosition): number {
  const invoice = position.invoice;
  if (invoice === undefined || invoice === null) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned an invoice position without a parent invoice.",
      { value: position }
    );
  }
  return numericId(invoice.id, "invoice position invoice");
}

function buildInvoiceUpdatePayload(
  input: InvoiceUpdateInput
): ReturnType<typeof forwardCompatibleBody<InvoiceWireUpdate>> {
  const keys = Object.keys(input);
  if (keys.length === 0) {
    throw new SevdeskConfigurationError("Invoice update must change at least one field.");
  }
  if (input.invoiceDate !== undefined) {
    validateSevdeskDateString(input.invoiceDate, "invoiceDate");
  }
  if (input.deliveryDate !== undefined && input.deliveryDate !== null) {
    validateSevdeskDateString(input.deliveryDate, "deliveryDate");
  }
  if (
    input.deliveryDateUntil !== undefined &&
    input.deliveryDateUntil !== null &&
    (!Number.isSafeInteger(input.deliveryDateUntil) || input.deliveryDateUntil < 0)
  ) {
    throw new SevdeskConfigurationError("deliveryDateUntil must be a non-negative unix timestamp.");
  }
  return forwardCompatibleBody<InvoiceWireUpdate>({
    ...(input.header === undefined ? {} : { header: input.header }),
    ...(input.headText === undefined ? {} : { headText: input.headText }),
    ...(input.footText === undefined ? {} : { footText: input.footText }),
    ...(input.address === undefined ? {} : { address: input.address }),
    ...(input.invoiceDate === undefined ? {} : { invoiceDate: input.invoiceDate }),
    ...(input.deliveryDate === undefined ? {} : { deliveryDate: input.deliveryDate }),
    ...(input.deliveryDateUntil === undefined
      ? {}
      : { deliveryDateUntil: input.deliveryDateUntil }),
    ...(input.currency === undefined ? {} : { currency: input.currency }),
    ...(input.customerInternalNote === undefined
      ? {}
      : { customerInternalNote: input.customerInternalNote }),
    ...(input.contact === undefined ? {} : { contact: wireReference(input.contact) }),
    ...(input.contactPerson === undefined
      ? {}
      : { contactPerson: wireReference(input.contactPerson) })
  });
}

function refineInvoiceWorkflow<
  TWorkflow extends string,
  TCreated extends CreatedInvoice | SevdeskInvoice,
  TPlan extends {
    readonly delivery?: InvoiceDelivery;
    readonly booking?: BookingInput;
    readonly enshrine?: boolean;
  }
>(
  result: WorkflowResult<TWorkflow, InvoiceWorkflowData<TCreated>, InvoiceWorkflowOperationId>,
  plan: TPlan
): WorkflowResult<TWorkflow, InvoiceWorkflowFor<TCreated, TPlan>, InvoiceWorkflowOperationId> {
  if (plan.delivery !== undefined && result.data.delivery === undefined) {
    throw new SevdeskResponseValidationError(
      "The invoice delivery step completed without response data.",
      { value: result.toSummary() }
    );
  }
  if (plan.booking !== undefined && result.data.booking === undefined) {
    throw new SevdeskResponseValidationError(
      "The invoice booking step completed without response data.",
      { value: result.toSummary() }
    );
  }
  if (plan.enshrine === true && result.data.enshrinement?.performed !== true) {
    throw new SevdeskResponseValidationError(
      "The invoice enshrinement step completed without an action receipt.",
      { value: result.toSummary() }
    );
  }
  return result as WorkflowResult<
    TWorkflow,
    InvoiceWorkflowFor<TCreated, TPlan>,
    InvoiceWorkflowOperationId
  >;
}

function observationFor<TPlan extends InvoiceFinalizingPlan>(
  reconciliation: InvoiceFinalizationReconciliation<TPlan>,
  operationId: InvoiceFinalizationWriteOperationId
): InvoiceFinalizationActionObservation<InvoiceFinalizationWriteOperationId> {
  const actions = reconciliation.actions as {
    readonly delivery?: InvoiceFinalizationActionObservation<
      "sendInvoiceViaEMail" | "invoiceSendBy"
    >;
    readonly booking?: InvoiceFinalizationActionObservation<"bookInvoice">;
    readonly enshrinement?: InvoiceFinalizationActionObservation<"invoiceEnshrine">;
  };
  const observation =
    operationId === "bookInvoice"
      ? actions.booking
      : operationId === "invoiceEnshrine"
        ? actions.enshrinement
        : actions.delivery;
  if (observation === undefined || observation.operationId !== operationId) {
    throw new SevdeskResponseValidationError(
      `Invoice finalization reconciliation is missing operation ${operationId}.`,
      { value: reconciliation }
    );
  }
  return observation;
}

function countFinalizationProbeSteps(
  steps: readonly WorkflowStep<InvoiceFinalizationWorkflowOperationId>[]
): number {
  return steps.filter((step) => step.operationId === "getInvoiceById").length;
}

function finalizationFailureCheckpoint<TPlan extends InvoiceFinalizingPlan>(
  checkpoint: InvoiceFinalizationCheckpoint<TPlan>,
  plan: TPlan,
  reconciliation: InvoiceFinalizationReconciliation<TPlan> | undefined,
  executed: readonly WorkflowActionReceipt<InvoiceFinalizationWriteOperationId>[],
  currentOperationId: InvoiceFinalizationWorkflowOperationId | "initialization",
  steps: readonly WorkflowStep<InvoiceFinalizationWorkflowOperationId>[],
  checkpointProbeCount: number
): InvoiceFinalizationCheckpoint<TPlan> {
  const completed = new Set(checkpoint.completedSteps);
  for (const receipt of executed) completed.add(receipt.operationId);
  if (reconciliation !== undefined) {
    for (const operationId of expectedOperations(plan)) {
      if (observationFor(reconciliation, operationId).state === "satisfied") {
        completed.add(operationId);
      }
    }
  }
  const creationSteps = checkpoint.completedSteps.filter(
    (operationId) =>
      operationId === "createInvoiceByFactory" || operationId === "createInvoiceFromOrder"
  );
  const completedTail: InvoiceFinalizationWriteOperationId[] = [];
  for (const operationId of expectedOperations(plan)) {
    if (!completed.has(operationId)) break;
    completedTail.push(operationId);
  }
  const completedSteps = [...creationSteps, ...completedTail];
  const currentIsUnacknowledgedWrite =
    currentOperationId !== "initialization" &&
    currentOperationId !== "getInvoiceById" &&
    !completed.has(currentOperationId);
  const uncertainStep = currentIsUnacknowledgedWrite
    ? currentOperationId
    : checkpoint.uncertainStep;
  const contextProbeSteps = steps
    .filter((step) => step.operationId === "getInvoiceById")
    .map((step) => ({ operationId: "getInvoiceById" as const, status: step.status }));
  return updateInvoiceFinalizationCheckpoint(checkpoint, {
    completedSteps,
    ...(uncertainStep === undefined ? {} : { uncertainStep }),
    probeSteps: [...checkpoint.probeSteps, ...contextProbeSteps.slice(checkpointProbeCount)]
  });
}

function asCompleteFinalizationReconciliation<TPlan extends InvoiceFinalizingPlan>(
  value: InvoiceFinalizationReconciliation<TPlan>
): CompleteInvoiceFinalizationReconciliation<TPlan> {
  const actions = Object.values(
    value.actions
  ) as readonly InvoiceFinalizationActionObservation<InvoiceFinalizationWriteOperationId>[];
  if (
    !value.complete ||
    !value.canResume ||
    value.needsMoreObservation ||
    value.nextOperationId !== undefined ||
    actions.some((action) => action.state !== "satisfied")
  ) {
    throw new SevdeskResponseValidationError(
      "Invoice finalization reconciliation claimed completion with pending work.",
      { value }
    );
  }
  return value as CompleteInvoiceFinalizationReconciliation<TPlan>;
}

function asIncompleteFinalizationReconciliation<TPlan extends InvoiceFinalizingPlan>(
  value: InvoiceFinalizationReconciliation<TPlan>
): IncompleteInvoiceFinalizationReconciliation<TPlan> {
  if (value.complete) {
    throw new SevdeskResponseValidationError(
      "Invoice finalization reconciliation was expected to be incomplete.",
      { value }
    );
  }
  return value as IncompleteInvoiceFinalizationReconciliation<TPlan>;
}

function finalizationProbeRequestOptions(
  requestOptions: CuratedRequestOptions | undefined,
  policy: NormalizedInvoiceFinalizationProbePolicy
): CuratedRequestOptions {
  const remaining = remainingProbeTime(policy.deadlineMs);
  const timeoutMs =
    remaining === undefined
      ? requestOptions?.timeoutMs
      : Math.max(
          1,
          Math.floor(
            requestOptions?.timeoutMs === undefined
              ? remaining
              : Math.min(requestOptions.timeoutMs, remaining)
          )
        );
  return {
    ...(requestOptions ?? {}),
    retry: false,
    ...(timeoutMs === undefined ? {} : { timeoutMs })
  };
}

function isRetryableFinalizationProbeError(error: unknown): boolean {
  if (error instanceof SevdeskCancellationError) return false;
  if (error instanceof SevdeskNetworkError) return true;
  return (
    error instanceof SevdeskApiError && [408, 425, 429, 500, 502, 503, 504].includes(error.status)
  );
}

async function finalizationProbeDelay(
  completedAttempt: number,
  policy: NormalizedInvoiceFinalizationProbePolicy,
  signal: AbortSignal | undefined,
  retryAfterMs: number | undefined
): Promise<void> {
  const generatedDelay = Math.min(
    policy.maxDelayMs,
    policy.delayMs * policy.backoffFactor ** (completedAttempt - 1)
  );
  const delayMs = Math.max(generatedDelay, retryAfterMs ?? 0);
  assertProbeActive(signal, policy.deadlineMs);
  const remaining = remainingProbeTime(policy.deadlineMs);
  if (remaining !== undefined && delayMs >= remaining) {
    throw finalizationProbeTimeout();
  }
  if (delayMs === 0) return;
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(finalizationProbeCancellation(signal));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function assertProbeActive(signal: AbortSignal | undefined, deadlineMs: number | undefined): void {
  if (signal?.aborted) throw finalizationProbeCancellation(signal);
  const remaining = remainingProbeTime(deadlineMs);
  if (remaining !== undefined && remaining <= 0) {
    throw finalizationProbeTimeout();
  }
}

function remainingProbeTime(deadlineMs: number | undefined): number | undefined {
  return deadlineMs === undefined ? undefined : deadlineMs - Date.now();
}

function finalizationProbeCancellation(signal: AbortSignal | undefined): SevdeskCancellationError {
  return new SevdeskCancellationError(
    "Invoice finalization probing was cancelled.",
    { operationId: "getInvoiceById" },
    "ERR_CANCELED",
    signal?.reason === undefined ? undefined : { cause: signal.reason }
  );
}

function finalizationProbeTimeout(): SevdeskTimeoutError {
  return new SevdeskTimeoutError(
    "Invoice finalization probe deadline elapsed.",
    { operationId: "getInvoiceById" },
    "ECONNABORTED"
  );
}
