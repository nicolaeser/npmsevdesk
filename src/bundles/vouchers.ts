import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { SevdeskClient } from "../client/sevdesk-client.js";
import {
  mapDraftVoucherResult,
  mapCreatedVoucherResult,
  mapOpenVoucherResult,
  mapVoucherListResult,
  mapVoucherResult
} from "../domain/result-mappers.js";
import type {
  CreatedVoucher,
  CreatedVoucherResult,
  DraftVoucherResult,
  OpenVoucherResult,
  VoucherListResult,
  VoucherResult
} from "../domain/results.js";
import { requireValue } from "../domain/normalizers.js";
import { VoucherStatus } from "../enums/domain-enums.js";
import type { SevdeskVoucher } from "../domain/models.js";
import type { SevdeskIdInput, SevdeskReference } from "../types/references.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../utils/errors.js";
import { validateSevdeskDateString } from "../utils/validation.js";
import type { components } from "../types/openapi.js";
import { buildVoucherBookingPayload, buildVoucherPayload } from "./builders.js";
import type { VoucherEmbedInput } from "./embed.js";
import { voucherListQuery } from "./filters.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericId,
  requireEntityId,
  wireReference
} from "./internal.js";
import type {
  BinaryUpload,
  CuratedRequestOptions,
  NamedBinaryUpload,
  OperationData,
  OperationResult,
  VoucherBookingInput,
  VoucherFactoryInput,
  RequireAtLeastOne,
  VoucherListOptions,
  WorkflowActionReceipt,
  WorkflowResult
} from "./types.js";

export interface VoucherUpdateFields {
  readonly voucherDate?: string | null;
  readonly supplierName?: string | null;
  readonly description?: string | null;
  readonly payDate?: string | null;
  readonly currency?: string | null;
  readonly supplier?: SevdeskReference<"Contact"> | null;
}

export type VoucherUpdateInput = RequireAtLeastOne<VoucherUpdateFields>;

type VoucherWireUpdate = components["schemas"]["Model_VoucherUpdate"];

export type VoucherUpdateWorkflowOperationId = "getVoucherById" | "updateVoucher";

export interface VoucherUpdateWorkflowData {
  readonly before: SevdeskVoucher;
  readonly receipt: WorkflowActionReceipt<"updateVoucher">;
  readonly voucher: SevdeskVoucher;
}

export interface VoucherUpdateWorkflowPartial {
  readonly before?: SevdeskVoucher;
  readonly receipt?: WorkflowActionReceipt<"updateVoucher">;
}

export type VoucherUpdateWorkflowResult = WorkflowResult<
  "vouchers.update",
  VoucherUpdateWorkflowData,
  VoucherUpdateWorkflowOperationId
>;
import { workflowActionReceipt, workflowWriteOptions } from "./workflow.js";

export interface VoucherWorkflowData {
  readonly upload?: NonNullable<OperationData<"voucherUploadFile">>;
  readonly created: CreatedVoucher;
  readonly booking?: NonNullable<OperationData<"bookVoucher">>;
  readonly enshrinement?: WorkflowActionReceipt<"voucherEnshrine">;
  readonly enshrined?: OperationData<"voucherEnshrine">;
}

export type VoucherWorkflowOperationId =
  "voucherUploadFile" | "voucherFactorySaveVoucher" | "bookVoucher" | "voucherEnshrine";

type VoucherUploadData = NonNullable<OperationData<"voucherUploadFile">>;

export type VoucherAttachmentWorkflowData<TAttachment> = VoucherWorkflowData &
  (TAttachment extends BinaryUpload ? { readonly upload: VoucherUploadData } : object);

export type BookedVoucherWorkflowData<TPlan = object> = VoucherWorkflowData & {
  readonly booking: NonNullable<OperationData<"bookVoucher">>;
} & (TPlan extends { readonly attachment: BinaryUpload }
    ? { readonly upload: VoucherUploadData }
    : object) &
  (TPlan extends { readonly enshrine: true }
    ? { readonly enshrinement: WorkflowActionReceipt<"voucherEnshrine"> }
    : object);

type PropertyValue<TValue, TKey extends PropertyKey> = TValue extends unknown
  ? TKey extends keyof TValue
    ? TValue[TKey]
    : never
  : never;

export type VoucherAttachmentWorkflowOperationId<TAttachment> =
  "voucherFactorySaveVoucher" | (TAttachment extends BinaryUpload ? "voucherUploadFile" : never);

export type BookedVoucherWorkflowOperationId<TPlan> =
  | "voucherFactorySaveVoucher"
  | "bookVoucher"
  | ([Exclude<PropertyValue<TPlan, "attachment">, undefined>] extends [never]
      ? never
      : "voucherUploadFile")
  | (true extends PropertyValue<TPlan, "enshrine"> ? "voucherEnshrine" : never);

export type CreateVoucherWithAttachmentWorkflowResult<TAttachment> = WorkflowResult<
  "vouchers.createWithAttachment",
  VoucherAttachmentWorkflowData<TAttachment>,
  VoucherAttachmentWorkflowOperationId<TAttachment>
>;

export type CreateAndBookVoucherWorkflowResult<TInput> = WorkflowResult<
  "vouchers.createAndBook",
  BookedVoucherWorkflowData<TInput>,
  BookedVoucherWorkflowOperationId<TInput>
>;

export class VouchersBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async list(
    options: VoucherListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<VoucherListResult> {
    const result = await this.client.raw.voucher.getVouchers(
      asRequest<"getVouchers">(
        {
          extraQuery: voucherListQuery(options)
        },
        requestOptions
      )
    );
    return mapVoucherListResult(result);
  }
  public async get(
    voucherId: SevdeskIdInput,
    embed: readonly VoucherEmbedInput[] = [],
    requestOptions?: CuratedRequestOptions
  ): Promise<VoucherResult> {
    const result = await this.client.raw.voucher.getVoucherById(
      asRequest<"getVoucherById">(
        {
          path: { voucherId: numericId(voucherId, "voucher") },
          ...(embed.length ? { extraQuery: { embed } } : {})
        },
        requestOptions
      )
    );
    return mapVoucherResult(result);
  }
  public async update(
    voucherId: SevdeskIdInput,
    input: VoucherUpdateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<VoucherUpdateWorkflowResult> {
    const id = numericId(voucherId, "voucher");
    const body = buildVoucherUpdatePayload(input);
    const context = this.client.createWorkflowContext<
      "vouchers.update",
      VoucherUpdateWorkflowOperationId,
      VoucherUpdateWorkflowPartial
    >("vouchers.update");
    let before: SevdeskVoucher;
    try {
      const current = await context.step("load voucher before update", "getVoucherById", () =>
        this.get(id, [], requestOptions)
      );
      before = current.data;
    } catch (error) {
      throw context.error(error, { partial: {} });
    }
    if (before.status !== "DRAFT" && before.statusCode !== VoucherStatus.DRAFT) {
      throw new SevdeskConfigurationError(
        `Only draft vouchers can be updated through the curated API (status=${before.status}, code=${before.statusCode}).`
      );
    }
    const partial: {
      before: SevdeskVoucher;
      receipt?: WorkflowActionReceipt<"updateVoucher">;
    } = { before };
    try {
      const updated = await context.step("update voucher", "updateVoucher", () =>
        this.client.raw.voucher.updateVoucher(
          forwardCompatibleRequest<"updateVoucher">(
            { path: { voucherId: id }, body },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      const receipt = workflowActionReceipt("updateVoucher", updated);
      partial.receipt = receipt;
      const hydrated = await context.step("load voucher after update", "getVoucherById", () =>
        this.get(id, [], requestOptions)
      );
      return context.result({ before, receipt, voucher: hydrated.data });
    } catch (error) {
      throw context.error(error, { partial });
    }
  }
  public async uploadAttachment(
    file: BinaryUpload,
    requestOptions?: CuratedRequestOptions
  ): Promise<OperationResult<"voucherUploadFile">> {
    const form = await voucherUploadForm(file);
    return this.client.raw.voucher.voucherUploadFile(
      asRequest<"voucherUploadFile">({ body: form }, requestOptions)
    );
  }
  public async create(
    input: VoucherFactoryInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedVoucherResult> {
    const result = await this.client.raw.voucher.voucherFactorySaveVoucher(
      forwardCompatibleRequest<"voucherFactorySaveVoucher">(
        {
          body: buildVoucherPayload(input)
        },
        requestOptions
      )
    );
    return mapCreatedVoucherResult(result);
  }
  public async createWithAttachment<const TAttachment extends BinaryUpload | undefined = undefined>(
    input: VoucherFactoryInput,
    attachment?: TAttachment,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateVoucherWithAttachmentWorkflowResult<TAttachment>> {
    buildVoucherPayload(input);
    const context = this.client.createWorkflowContext<
      "vouchers.createWithAttachment",
      VoucherWorkflowOperationId
    >("vouchers.createWithAttachment");
    let uploadedFilename: string | undefined;
    const writeOptions = workflowWriteOptions(requestOptions);
    try {
      let upload: NonNullable<OperationData<"voucherUploadFile">> | undefined;
      if (attachment !== undefined) {
        const result = await context.step("upload voucher attachment", "voucherUploadFile", () =>
          this.uploadAttachment(attachment, writeOptions)
        );
        upload = requireValue(result.data, "voucher upload");
        uploadedFilename = fileNameFromUpload(upload);
      }
      const created = await context.step(
        "create voucher with positions",
        "voucherFactorySaveVoucher",
        () =>
          this.create(
            {
              ...input,
              ...((uploadedFilename ?? input.filename) === undefined
                ? {}
                : { filename: uploadedFilename ?? input.filename })
            },
            writeOptions
          )
      );
      const result = context.result({
        ...(upload === undefined ? {} : { upload }),
        created: created.data
      });
      return refineVoucherAttachmentWorkflow<TAttachment>(result, attachment as TAttachment);
    } catch (error) {
      throw context.error(error, {
        partial: {
          uploadedFilename,
          lastResult: context.partial
        }
      });
    }
  }
  public async createAndBook<
    const TInput extends VoucherFactoryInput & {
      readonly attachment?: BinaryUpload;
      readonly booking: VoucherBookingInput;
      readonly enshrine?: boolean;
      readonly delivery?: never;
    }
  >(
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateAndBookVoucherWorkflowResult<TInput>> {
    buildVoucherPayload(finalisedVoucherInput(input, input.filename));
    buildVoucherBookingPayload(input.booking);
    const context = this.client.createWorkflowContext<
      "vouchers.createAndBook",
      VoucherWorkflowOperationId
    >("vouchers.createAndBook");
    let uploadedFilename: string | undefined;
    const writeOptions = workflowWriteOptions(requestOptions);
    try {
      let upload: NonNullable<OperationData<"voucherUploadFile">> | undefined;
      if (input.attachment !== undefined) {
        const result = await context.step("upload voucher attachment", "voucherUploadFile", () =>
          this.uploadAttachment(input.attachment as BinaryUpload, writeOptions)
        );
        upload = requireValue(result.data, "voucher upload");
        uploadedFilename = fileNameFromUpload(upload);
      }
      const created = await context.step(
        "create finalized voucher with positions",
        "voucherFactorySaveVoucher",
        () =>
          this.create(
            finalisedVoucherInput(input, uploadedFilename ?? input.filename),
            writeOptions
          )
      );
      const voucherId = requireEntityId(created.data, "voucher");
      const booked = await context.step("book voucher", "bookVoucher", () =>
        this.book(voucherId, input.booking, writeOptions)
      );
      let enshrinement: WorkflowActionReceipt<"voucherEnshrine"> | undefined;
      if (input.enshrine) {
        const result = await context.step("enshrine voucher", "voucherEnshrine", () =>
          this.client.raw.voucher.voucherEnshrine(
            asRequest<"voucherEnshrine">(
              {
                path: { voucherId: numericId(voucherId, "voucher") }
              },
              writeOptions
            )
          )
        );
        enshrinement = workflowActionReceipt("voucherEnshrine", result);
      }
      const result = context.result({
        ...(upload === undefined ? {} : { upload }),
        created: created.data,
        booking: requireValue(booked.data, "voucher booking"),
        ...(enshrinement === undefined ? {} : { enshrinement, enshrined: enshrinement.data })
      });
      return refineBookedVoucherWorkflow(
        result,
        input
      ) as CreateAndBookVoucherWorkflowResult<TInput>;
    } catch (error) {
      throw context.error(error, {
        partial: {
          uploadedFilename,
          lastResult: context.partial
        }
      });
    }
  }
  public book(
    voucherId: SevdeskIdInput,
    booking: VoucherBookingInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<OperationResult<"bookVoucher">> {
    return this.client.raw.voucher.bookVoucher(
      forwardCompatibleRequest<"bookVoucher">(
        {
          path: { voucherId: numericId(voucherId, "voucher") },
          body: buildVoucherBookingPayload(booking)
        },
        requestOptions
      )
    );
  }
  public async resetToOpen(
    voucherId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<OpenVoucherResult> {
    const result = await this.client.raw.voucher.voucherResetToOpen(
      asRequest<"voucherResetToOpen">(
        {
          path: { voucherId: numericId(voucherId, "voucher") }
        },
        requestOptions
      )
    );
    return mapOpenVoucherResult(result);
  }
  public async resetToDraft(
    voucherId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<DraftVoucherResult> {
    const result = await this.client.raw.voucher.voucherResetToDraft(
      asRequest<"voucherResetToDraft">(
        {
          path: { voucherId: numericId(voucherId, "voucher") }
        },
        requestOptions
      )
    );
    return mapDraftVoucherResult(result);
  }
}

function refineVoucherAttachmentWorkflow<TAttachment extends BinaryUpload | undefined>(
  result: WorkflowResult<
    "vouchers.createWithAttachment",
    VoucherWorkflowData,
    VoucherWorkflowOperationId
  >,
  attachment: TAttachment
): CreateVoucherWithAttachmentWorkflowResult<TAttachment> {
  if (attachment !== undefined && result.data.upload === undefined) {
    throw new SevdeskResponseValidationError(
      "The voucher attachment upload completed without response data.",
      { value: result.toSummary() }
    );
  }
  return result as CreateVoucherWithAttachmentWorkflowResult<TAttachment>;
}

function refineBookedVoucherWorkflow<
  TPlan extends {
    readonly attachment?: BinaryUpload;
    readonly booking: VoucherBookingInput;
    readonly enshrine?: boolean;
  }
>(
  result: WorkflowResult<
    "vouchers.createAndBook",
    BookedVoucherWorkflowData,
    VoucherWorkflowOperationId
  >,
  plan: TPlan
): CreateAndBookVoucherWorkflowResult<TPlan> {
  if (plan.attachment !== undefined && result.data.upload === undefined) {
    throw new SevdeskResponseValidationError(
      "The voucher attachment upload completed without response data.",
      { value: result.toSummary() }
    );
  }
  if (plan.enshrine === true && result.data.enshrinement?.performed !== true) {
    throw new SevdeskResponseValidationError(
      "The voucher enshrinement step completed without an action receipt.",
      { value: result.toSummary() }
    );
  }
  return result as CreateAndBookVoucherWorkflowResult<TPlan>;
}

type VoucherFactory20Input = Extract<
  VoucherFactoryInput,
  {
    readonly voucher: {
      readonly tax: { readonly bookkeepingSystem: "2.0" };
    };
  }
>;

function isVoucherFactory20Input(input: VoucherFactoryInput): input is VoucherFactory20Input {
  return input.voucher.tax.bookkeepingSystem === "2.0";
}

function finalisedVoucherInput(
  input: VoucherFactoryInput,
  filename: string | undefined
): VoucherFactoryInput {
  if (isVoucherFactory20Input(input)) {
    return {
      voucher: { ...input.voucher, status: VoucherStatus.OPEN },
      positions: input.positions,
      ...(filename === undefined ? {} : { filename })
    } as VoucherFactoryInput;
  }
  return {
    voucher: { ...input.voucher, status: VoucherStatus.OPEN },
    positions: input.positions,
    ...(filename === undefined ? {} : { filename })
  } as VoucherFactoryInput;
}

async function voucherUploadForm(upload: BinaryUpload): Promise<FormData> {
  if (typeof FormData === "undefined" || typeof Blob === "undefined") {
    throw new SevdeskConfigurationError(
      "Voucher uploads require the Node.js 24+ Blob and FormData globals."
    );
  }
  let data: Blob | ArrayBuffer | Uint8Array;
  let filename: string | undefined;
  let contentType: string | undefined;
  if (typeof upload === "string") {
    if (!upload) throw new SevdeskConfigurationError("Voucher upload path cannot be empty.");
    data = await readFile(upload);
    filename = basename(upload);
  } else if (isNamedBinaryUpload(upload)) {
    data = upload.data;
    filename = upload.filename;
    contentType = upload.contentType;
  } else {
    data = upload;
  }
  const blob =
    data instanceof Blob
      ? data
      : new Blob(
          [data instanceof ArrayBuffer ? new Uint8Array(data) : Uint8Array.from(data)],
          contentType ? { type: contentType } : undefined
        );
  const inferredName =
    filename ??
    (data instanceof Blob && "name" in data && typeof data.name === "string"
      ? data.name
      : "voucher-upload");
  const form = new FormData();
  form.append("file", blob, inferredName);
  return form;
}

function isNamedBinaryUpload(value: BinaryUpload): value is NamedBinaryUpload {
  return (
    value !== null &&
    typeof value === "object" &&
    !(value instanceof Blob) &&
    !(value instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(value) &&
    "data" in value
  );
}

function fileNameFromUpload(value: unknown): string {
  if (value !== null && typeof value === "object" && "filename" in value) {
    const filename = value.filename;
    if (typeof filename === "string" && filename) return filename;
  }
  throw new SevdeskConfigurationError(
    "sevdesk returned no temporary filename after voucher upload."
  );
}

function buildVoucherUpdatePayload(
  input: VoucherUpdateInput
): ReturnType<typeof forwardCompatibleBody<VoucherWireUpdate>> {
  if (Object.keys(input).length === 0) {
    throw new SevdeskConfigurationError("Voucher update must change at least one field.");
  }
  if (input.voucherDate !== undefined && input.voucherDate !== null) {
    validateSevdeskDateString(input.voucherDate, "voucherDate");
  }
  if (input.payDate !== undefined && input.payDate !== null) {
    validateSevdeskDateString(input.payDate, "payDate");
  }
  return forwardCompatibleBody<VoucherWireUpdate>({
    ...(input.voucherDate === undefined ? {} : { voucherDate: input.voucherDate }),
    ...(input.supplierName === undefined ? {} : { supplierName: input.supplierName }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.payDate === undefined ? {} : { payDate: input.payDate }),
    ...(input.currency === undefined ? {} : { currency: input.currency }),
    ...(input.supplier === undefined
      ? {}
      : { supplier: input.supplier === null ? null : wireReference(input.supplier) })
  });
}
