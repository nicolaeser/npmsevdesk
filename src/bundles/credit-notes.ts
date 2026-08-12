import type { SevdeskClient } from "../client/sevdesk-client.js";
import {
  mapCreatedCreditNoteResult,
  mapCreditNoteListResult,
  mapCreditNoteResult,
  mapSentCreditNoteResult
} from "../domain/result-mappers.js";
import type { SevdeskCreditNote } from "../domain/models.js";
import { normalizeCreatedCreditNote, requireValue } from "../domain/normalizers.js";
import type {
  CreatedCreditNote,
  CreatedCreditNoteResult,
  CreditNoteListResult,
  CreditNoteResult,
  SentCreditNoteResult
} from "../domain/results.js";
import type { SevdeskId, SevdeskIdInput } from "../types/references.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../utils/errors.js";
import {
  buildCreditNotePayload,
  buildDeliveryPayload,
  buildEntityReference,
  buildInvoiceBookingPayload
} from "./builders.js";
import type { CreditNoteEmbedInput } from "./embed.js";
import { creditNoteListQuery } from "./filters.js";
import type { DocumentLayoutInput, LayoutApplyOptions, SetLayoutWorkflowResult } from "./layout.js";
import {
  mapDraftCreditNoteResult,
  mapOpenCreditNoteResult,
  mapPdfResult,
  type CreditNotePdfResult,
  type DocumentPdfOptions,
  type DraftCreditNoteResult,
  type OpenCreditNoteResult,
  type ResetToOpenConfirmation
} from "./document-output.js";
import { asRequest, forwardCompatibleRequest, numericId, requireEntityId } from "./internal.js";
import type {
  BookingInput,
  CreditNoteFactoryInput,
  CreditNoteListOptions,
  CuratedRequestOptions,
  MarkSentDelivery,
  OperationData,
  OperationResult,
  OptionalStandardFinalizingPlan,
  StandardDelivery,
  StandardEmailDelivery,
  StandardFinalizingDelivery,
  WorkflowActionReceipt,
  WorkflowResult
} from "./types.js";
import {
  assertNewDocumentTailIsValid,
  workflowActionReceipt,
  workflowWriteOptions,
  type WorkflowContext
} from "./workflow.js";

type CreditNoteDeliveryData =
  NonNullable<OperationData<"sendCreditNoteViaEMail">> | SevdeskCreditNote;
type CreditNoteBookingData = NonNullable<OperationData<"bookCreditNote">>;

export type CreditNoteWorkflowOperationId =
  | "bookkeepingSystemVersion"
  | "createcreditNote"
  | "createCreditNoteFromInvoice"
  | "createCreditNoteFromVoucher"
  | "sendCreditNoteViaEMail"
  | "creditNoteSendBy"
  | "bookCreditNote"
  | "creditNoteEnshrine";

type PropertyValue<TValue, TKey extends PropertyKey> = TValue extends unknown
  ? TKey extends keyof TValue
    ? TValue[TKey]
    : never
  : never;

type CreditNoteDeliveryOperationIdFor<TDelivery> = TDelivery extends {
  readonly channel: "email";
}
  ? "sendCreditNoteViaEMail"
  : TDelivery extends { readonly channel: "mark-sent" }
    ? "creditNoteSendBy"
    : never;

type CreditNoteTailOperationId<TPlan> =
  | CreditNoteDeliveryOperationIdFor<Exclude<PropertyValue<TPlan, "delivery">, undefined>>
  | ([Exclude<PropertyValue<TPlan, "booking">, undefined>] extends [never]
      ? never
      : "bookCreditNote")
  | (true extends PropertyValue<TPlan, "enshrine"> ? "creditNoteEnshrine" : never);

export type CreditNoteFactoryWorkflowOperationId<TPlan> =
  "createcreditNote" | CreditNoteTailOperationId<TPlan>;

export type CreditNoteFromInvoiceWorkflowOperationId<TPlan> =
  "createCreditNoteFromInvoice" | CreditNoteTailOperationId<TPlan>;

export type CreditNoteFromVoucherWorkflowOperationId<TPlan> =
  "bookkeepingSystemVersion" | "createCreditNoteFromVoucher" | CreditNoteTailOperationId<TPlan>;

export type CreditNoteDeliveryDataFor<TDelivery> = TDelivery extends {
  readonly channel: "email";
}
  ? NonNullable<OperationData<"sendCreditNoteViaEMail">>
  : TDelivery extends { readonly channel: "mark-sent" }
    ? SevdeskCreditNote
    : CreditNoteDeliveryData;

export interface CreditNoteWorkflowData {
  readonly created: CreatedCreditNote;
  readonly delivery?: CreditNoteDeliveryData;
  readonly booking?: CreditNoteBookingData;
  readonly enshrinement?: WorkflowActionReceipt<"creditNoteEnshrine">;
  readonly enshrined?: OperationData<"creditNoteEnshrine">;
}

export type CreditNoteWorkflowFor<TPlan> = CreditNoteWorkflowData &
  (TPlan extends { readonly delivery: infer TDelivery }
    ? { readonly delivery: CreditNoteDeliveryDataFor<TDelivery> }
    : object) &
  (TPlan extends { readonly booking: BookingInput }
    ? { readonly booking: CreditNoteBookingData }
    : object) &
  (TPlan extends { readonly enshrine: true }
    ? { readonly enshrinement: WorkflowActionReceipt<"creditNoteEnshrine"> }
    : object);

export type CreditNoteFromInvoiceInput = {
  readonly invoiceId: SevdeskIdInput;
} & OptionalStandardFinalizingPlan;

export type CreditNoteFromVoucherInput = {
  readonly voucherId: SevdeskIdInput;
} & OptionalStandardFinalizingPlan;

export type CreateAndDeliverCreditNoteWorkflowResult<TInput> = WorkflowResult<
  "creditNotes.createAndDeliver",
  CreditNoteWorkflowFor<TInput>,
  CreditNoteFactoryWorkflowOperationId<TInput>
>;

export type CreateCreditNoteFromInvoiceWorkflowResult<TInput> = WorkflowResult<
  "creditNotes.createFromInvoice",
  CreditNoteWorkflowFor<TInput>,
  CreditNoteFromInvoiceWorkflowOperationId<TInput>
>;

export type CreateCreditNoteFromVoucherWorkflowResult<TInput> = WorkflowResult<
  "creditNotes.createFromVoucher",
  CreditNoteWorkflowFor<TInput>,
  CreditNoteFromVoucherWorkflowOperationId<TInput>
>;

export class CreditNotesBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async list(
    options: CreditNoteListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<CreditNoteListResult> {
    const result = await this.client.raw.creditNote.getCreditNotes(
      asRequest<"getCreditNotes">(
        {
          extraQuery: creditNoteListQuery(options)
        },
        requestOptions
      )
    );
    return mapCreditNoteListResult(result);
  }
  public async get(
    creditNoteId: SevdeskIdInput,
    embed: readonly CreditNoteEmbedInput[] = [],
    requestOptions?: CuratedRequestOptions
  ): Promise<CreditNoteResult> {
    const result = await this.client.raw.creditNote.getcreditNoteById(
      asRequest<"getcreditNoteById">(
        {
          path: { creditNoteId: numericId(creditNoteId, "credit note") },
          ...(embed.length ? { extraQuery: { embed } } : {})
        },
        requestOptions
      )
    );
    return mapCreditNoteResult(result);
  }
  public async create(
    input: CreditNoteFactoryInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedCreditNoteResult> {
    const result = await this.client.raw.creditNote.createcreditNote(
      forwardCompatibleRequest<"createcreditNote">(
        {
          body: buildCreditNotePayload(input)
        },
        requestOptions
      )
    );
    return mapCreatedCreditNoteResult(result);
  }
  public async createAndDeliver<
    const TInput extends CreditNoteFactoryInput & {
      readonly delivery: StandardFinalizingDelivery;
      readonly booking?: BookingInput;
      readonly enshrine?: boolean;
    }
  >(
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateAndDeliverCreditNoteWorkflowResult<TInput>> {
    assertNewDocumentTailIsValid(input, "credit note");
    const context = this.client.createWorkflowContext<
      "creditNotes.createAndDeliver",
      CreditNoteWorkflowOperationId
    >("creditNotes.createAndDeliver");
    try {
      const created = await context.step(
        "create credit note with positions",
        "createcreditNote",
        () => this.create(input, workflowWriteOptions(requestOptions))
      );
      const creditNoteId = requireEntityId(created.data, "credit note");
      const tail = await this.runTail(context, creditNoteId, input, requestOptions);
      const result = context.result({ created: created.data, ...tail });
      return refineCreditNoteWorkflow(
        result,
        input
      ) as CreateAndDeliverCreditNoteWorkflowResult<TInput>;
    } catch (error) {
      throw context.error(error);
    }
  }
  public async createFromInvoice<const TInput extends CreditNoteFromInvoiceInput>(
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateCreditNoteFromInvoiceWorkflowResult<TInput>> {
    assertNewDocumentTailIsValid(input, "credit note", { allowNoAction: true });
    const context = this.client.createWorkflowContext<
      "creditNotes.createFromInvoice",
      CreditNoteWorkflowOperationId
    >("creditNotes.createFromInvoice");
    try {
      const created = await context.step(
        "create credit note from invoice",
        "createCreditNoteFromInvoice",
        () =>
          this.client.raw.creditNote.createCreditNoteFromInvoice(
            asRequest<"createCreditNoteFromInvoice">(
              {
                body: {
                  invoice: buildEntityReference("Invoice", input.invoiceId)
                }
              },
              workflowWriteOptions(requestOptions)
            )
          )
      );
      const creditNoteId = requireEntityId(created.data, "credit note");
      const normalizedCreated = normalizeCreatedCreditNote(created.data);
      const tail = await this.runTail(context, creditNoteId, input, requestOptions);
      return refineCreditNoteWorkflow(
        context.result({ created: normalizedCreated, ...tail }),
        input
      ) as CreateCreditNoteFromInvoiceWorkflowResult<TInput>;
    } catch (error) {
      throw context.error(error);
    }
  }
  public async createFromVoucher<const TInput extends CreditNoteFromVoucherInput>(
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateCreditNoteFromVoucherWorkflowResult<TInput>> {
    assertNewDocumentTailIsValid(input, "credit note", { allowNoAction: true });
    const context = this.client.createWorkflowContext<
      "creditNotes.createFromVoucher",
      CreditNoteWorkflowOperationId
    >("creditNotes.createFromVoucher");
    try {
      const version = await context.step(
        "check bookkeeping system version",
        "bookkeepingSystemVersion",
        () =>
          this.client.raw.basics.bookkeepingSystemVersion(
            asRequest<"bookkeepingSystemVersion">({}, requestOptions)
          )
      );
      if (version.data?.version === "2.0") {
        throw new SevdeskConfigurationError(
          "Creating a credit note from a voucher is unsupported in bookkeeping system 2.0."
        );
      }
      if (version.data?.version !== "1.0") {
        throw new SevdeskResponseValidationError(
          "Creating a credit note from a voucher requires sevdesk to report bookkeeping system version 1.0 explicitly.",
          { value: version.data }
        );
      }
      const created = await context.step(
        "create credit note from voucher",
        "createCreditNoteFromVoucher",
        () =>
          this.client.raw.creditNote.createCreditNoteFromVoucher(
            asRequest<"createCreditNoteFromVoucher">(
              {
                body: {
                  voucher: buildEntityReference("Voucher", input.voucherId)
                }
              },
              workflowWriteOptions(requestOptions)
            )
          )
      );
      const creditNoteId = requireEntityId(created.data, "credit note");
      const normalizedCreated = normalizeCreatedCreditNote(created.data);
      const tail = await this.runTail(context, creditNoteId, input, requestOptions);
      return refineCreditNoteWorkflow(
        context.result({ created: normalizedCreated, ...tail }),
        input
      ) as CreateCreditNoteFromVoucherWorkflowResult<TInput>;
    } catch (error) {
      throw context.error(error);
    }
  }
  public book(
    creditNoteId: SevdeskIdInput,
    booking: BookingInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<OperationResult<"bookCreditNote">> {
    return this.client.raw.creditNote.bookCreditNote(
      forwardCompatibleRequest<"bookCreditNote">(
        {
          path: { creditNoteId: numericId(creditNoteId, "credit note") },
          body: buildInvoiceBookingPayload(booking)
        },
        requestOptions
      )
    );
  }
  public sendByEmail(
    creditNoteId: SevdeskIdInput,
    delivery: StandardEmailDelivery,
    requestOptions?: CuratedRequestOptions
  ): Promise<OperationResult<"sendCreditNoteViaEMail">> {
    return this.client.raw.creditNote.sendCreditNoteViaEMail(
      forwardCompatibleRequest<"sendCreditNoteViaEMail">(
        {
          path: { creditNoteId: numericId(creditNoteId, "credit note") },
          body: buildDeliveryPayload(delivery)
        },
        requestOptions
      )
    );
  }
  public async markAsSent(
    creditNoteId: SevdeskIdInput,
    delivery: MarkSentDelivery = { channel: "mark-sent" },
    requestOptions?: CuratedRequestOptions
  ): Promise<SentCreditNoteResult> {
    const result = await this.client.raw.creditNote.creditNoteSendBy(
      forwardCompatibleRequest<"creditNoteSendBy">(
        {
          path: { creditNoteId: numericId(creditNoteId, "credit note") },
          body: buildDeliveryPayload(delivery)
        },
        requestOptions
      )
    );
    return mapSentCreditNoteResult(result);
  }
  public async getPdf(
    creditNoteId: SevdeskIdInput,
    options: DocumentPdfOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<CreditNotePdfResult> {
    const download = options.download ?? true;
    const markAsDownloaded = options.markAsDownloaded ?? false;
    const result = await this.client.raw.creditNote.creditNoteGetPdf(
      asRequest<"creditNoteGetPdf">(
        {
          path: { creditNoteId: numericId(creditNoteId, "credit note") },
          query: {
            download,
            preventSendBy: !markAsDownloaded
          }
        },
        markAsDownloaded ? workflowWriteOptions(requestOptions) : requestOptions
      )
    );
    return mapPdfResult(result, "creditNoteGetPdf", download);
  }
  public async resetToDraft(
    creditNoteId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<DraftCreditNoteResult> {
    const result = await this.client.raw.creditNote.creditNoteResetToDraft(
      asRequest<"creditNoteResetToDraft">(
        { path: { creditNoteId: numericId(creditNoteId, "credit note") } },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapDraftCreditNoteResult(result);
  }
  public async resetToOpen(
    creditNoteId: SevdeskIdInput,
    confirmation: ResetToOpenConfirmation,
    requestOptions?: CuratedRequestOptions
  ): Promise<OpenCreditNoteResult> {
    if (confirmation.confirmUnlinkTransactions !== true) {
      throw new SevdeskConfigurationError(
        "Resetting a credit note to open unlinks its transactions; pass { confirmUnlinkTransactions: true }."
      );
    }
    const result = await this.client.raw.creditNote.creditNoteResetToOpen(
      asRequest<"creditNoteResetToOpen">(
        { path: { creditNoteId: numericId(creditNoteId, "credit note") } },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapOpenCreditNoteResult(result);
  }
  public setLayout<const TLayout extends DocumentLayoutInput>(
    creditNoteId: SevdeskIdInput,
    layout: TLayout,
    options: LayoutApplyOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<SetLayoutWorkflowResult<"creditNote", TLayout>> {
    return this.client.layout.setCreditNoteLayout(creditNoteId, layout, options, requestOptions);
  }
  private async runTail(
    context: WorkflowContext<string, CreditNoteWorkflowOperationId>,
    creditNoteId: SevdeskId,
    input: {
      readonly delivery?: StandardDelivery;
      readonly booking?: BookingInput;
      readonly enshrine?: boolean;
    },
    requestOptions?: CuratedRequestOptions
  ): Promise<Omit<CreditNoteWorkflowData, "created">> {
    const writeOptions = workflowWriteOptions(requestOptions);
    let delivery: CreditNoteDeliveryData | undefined;
    if (input.delivery?.channel === "email") {
      const sent = await context.step("send credit note by email", "sendCreditNoteViaEMail", () =>
        this.sendByEmail(creditNoteId, input.delivery as StandardEmailDelivery, writeOptions)
      );
      delivery = requireValue(sent.data, "credit-note delivery");
    } else if (input.delivery) {
      const sent = await context.step("mark credit note as sent", "creditNoteSendBy", () =>
        this.markAsSent(creditNoteId, input.delivery as MarkSentDelivery, writeOptions)
      );
      delivery = sent.data;
    }
    let booking: CreditNoteBookingData | undefined;
    if (input.booking) {
      const booked = await context.step("book credit note", "bookCreditNote", () =>
        this.book(creditNoteId, input.booking as BookingInput, writeOptions)
      );
      booking = requireValue(booked.data, "credit-note booking");
    }
    let enshrinement: WorkflowActionReceipt<"creditNoteEnshrine"> | undefined;
    if (input.enshrine) {
      const result = await context.step("enshrine credit note", "creditNoteEnshrine", () =>
        this.client.raw.creditNote.creditNoteEnshrine(
          asRequest<"creditNoteEnshrine">(
            {
              path: { creditNoteId: numericId(creditNoteId, "credit note") }
            },
            writeOptions
          )
        )
      );
      enshrinement = workflowActionReceipt("creditNoteEnshrine", result);
    }
    return {
      ...(delivery === undefined ? {} : { delivery }),
      ...(booking === undefined ? {} : { booking }),
      ...(enshrinement === undefined ? {} : { enshrinement, enshrined: enshrinement.data })
    };
  }
}

function refineCreditNoteWorkflow<
  TWorkflow extends string,
  TPlan extends {
    readonly delivery?: StandardDelivery;
    readonly booking?: BookingInput;
    readonly enshrine?: boolean;
  }
>(
  result: WorkflowResult<TWorkflow, CreditNoteWorkflowData, CreditNoteWorkflowOperationId>,
  plan: TPlan
): WorkflowResult<TWorkflow, CreditNoteWorkflowFor<TPlan>, CreditNoteWorkflowOperationId> {
  if (plan.delivery !== undefined && result.data.delivery === undefined) {
    throw new SevdeskResponseValidationError(
      "The credit-note delivery step completed without response data.",
      { value: result.toSummary() }
    );
  }
  if (plan.booking !== undefined && result.data.booking === undefined) {
    throw new SevdeskResponseValidationError(
      "The credit-note booking step completed without response data.",
      { value: result.toSummary() }
    );
  }
  if (plan.enshrine === true && result.data.enshrinement?.performed !== true) {
    throw new SevdeskResponseValidationError(
      "The credit-note enshrinement step completed without an action receipt.",
      { value: result.toSummary() }
    );
  }
  return result as WorkflowResult<
    TWorkflow,
    CreditNoteWorkflowFor<TPlan>,
    CreditNoteWorkflowOperationId
  >;
}
