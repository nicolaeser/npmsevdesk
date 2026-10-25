import type { SevdeskCreditNote, SevdeskInvoice, SevdeskOrder } from "../domain/models.js";
import {
  normalizeCreditNote,
  normalizeInvoice,
  normalizeOrder,
  requireValue
} from "../domain/normalizers.js";
import type { operations } from "../types/openapi.js";
import type { ResponseJsonFor, ResultFor, TransportBodyFor } from "../types/operation.js";
import type { FileEnvelope, SevdeskResult } from "../types/result.js";
import { SevdeskResponseValidationError } from "../utils/errors.js";
import { normalizeFileEnvelope } from "../utils/files.js";
import { mapResultData } from "../utils/result.js";

type CuratedOperationResult<TOperationId extends keyof operations, TData> = SevdeskResult<
  ResponseJsonFor<operations[TOperationId]>,
  TData,
  TransportBodyFor<operations[TOperationId]>
>;

export interface DocumentPdfOptions {
  readonly download?: boolean;
  readonly markAsDownloaded?: boolean;
}

export interface OrderPdfOptions extends DocumentPdfOptions {
  readonly confirmCommit: true;
}

export interface ResetToOpenConfirmation {
  readonly confirmUnlinkTransactions: true;
}

export type InvoicePdfResult = CuratedOperationResult<"invoiceGetPdf", FileEnvelope>;
export type OrderPdfResult = CuratedOperationResult<"orderGetPdf", FileEnvelope>;
export type CreditNotePdfResult = CuratedOperationResult<"creditNoteGetPdf", FileEnvelope>;
export type InvoiceXmlResult = CuratedOperationResult<"invoiceGetXml", string>;

type InvoiceRenderWire = ResponseJsonFor<operations["invoiceRender"]>;
type InvoiceRenderParameters = InvoiceRenderWire extends { parameters?: infer TParameters }
  ? TParameters
  : never;

export interface InvoiceRenderData {
  readonly kind: "pdf";
  readonly pdf: string;
  readonly docId?: string;
  readonly parameters?: InvoiceRenderParameters;
}

export type InvoiceRenderResult = CuratedOperationResult<"invoiceRender", InvoiceRenderData>;

export interface InvoiceRenderOptions {
  readonly forceReload?: boolean;
}

export type DraftInvoiceResult = CuratedOperationResult<"invoiceResetToDraft", SevdeskInvoice>;
export type OpenInvoiceResult = CuratedOperationResult<"invoiceResetToOpen", SevdeskInvoice>;
export type DraftCreditNoteResult = CuratedOperationResult<
  "creditNoteResetToDraft",
  SevdeskCreditNote
>;
export type OpenCreditNoteResult = CuratedOperationResult<
  "creditNoteResetToOpen",
  SevdeskCreditNote
>;
export type CreatedPackingListResult = CuratedOperationResult<
  "createPackingListFromOrder",
  SevdeskOrder
>;
export type CreatedContractNoteResult = CuratedOperationResult<
  "createContractNoteFromOrder",
  SevdeskOrder
>;

type PdfOperationId = "invoiceGetPdf" | "orderGetPdf" | "creditNoteGetPdf";
type PdfResultFor<TOperationId extends PdfOperationId> = CuratedOperationResult<
  TOperationId,
  FileEnvelope
>;

export function mapPdfResult<TOperationId extends PdfOperationId>(
  result: ResultFor<operations[TOperationId]>,
  operationId: TOperationId,
  requireContent: boolean
): PdfResultFor<TOperationId> {
  if (!isRecord(result.data)) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned no PDF envelope for ${operationId}.`,
      { value: result.data }
    );
  }
  const envelope = normalizeFileEnvelope(result.data);
  if (requireContent && (typeof envelope.content !== "string" || envelope.content.length === 0)) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned no PDF content for ${operationId} although download was requested.`,
      { value: result.data }
    );
  }
  if (
    !requireContent &&
    envelope.content === undefined &&
    envelope.filename === undefined &&
    envelope.mimeType === undefined
  ) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned an empty PDF envelope for ${operationId}.`,
      { value: result.data }
    );
  }
  return mapResultData(result, envelope);
}

export function mapInvoiceXmlResult(
  result: ResultFor<operations["invoiceGetXml"]>
): InvoiceXmlResult {
  const xml = requireValue(result.data, "invoice XML");
  if (typeof xml !== "string" || xml.trim().length === 0) {
    throw new SevdeskResponseValidationError("sevdesk returned invalid invoice XML.", {
      value: result.data
    });
  }
  return mapResultData(result, xml);
}

export function mapInvoiceRenderResult(
  result: ResultFor<operations["invoiceRender"]>
): InvoiceRenderResult {
  if (!isRecord(result.data)) {
    throw new SevdeskResponseValidationError("sevdesk returned invalid invoice render data.", {
      value: result.data
    });
  }
  const pdf = result.data.pdf;
  if (typeof pdf !== "string" || pdf.length === 0) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned no PDF content for the rendered invoice.",
      { value: result.data }
    );
  }
  return mapResultData(result, { kind: "pdf", pdf, ...renderSharedData(result.data) });
}

export function mapDraftInvoiceResult(
  result: ResultFor<operations["invoiceResetToDraft"]>
): DraftInvoiceResult {
  return mapResultData(
    result,
    normalizeInvoice(requireValue(result.data, "invoice reset to draft"))
  );
}

export function mapOpenInvoiceResult(
  result: ResultFor<operations["invoiceResetToOpen"]>
): OpenInvoiceResult {
  return mapResultData(
    result,
    normalizeInvoice(requireValue(result.data, "invoice reset to open"))
  );
}

export function mapDraftCreditNoteResult(
  result: ResultFor<operations["creditNoteResetToDraft"]>
): DraftCreditNoteResult {
  return mapResultData(
    result,
    normalizeCreditNote(requireValue(result.data, "credit note reset to draft"))
  );
}

export function mapOpenCreditNoteResult(
  result: ResultFor<operations["creditNoteResetToOpen"]>
): OpenCreditNoteResult {
  return mapResultData(
    result,
    normalizeCreditNote(requireValue(result.data, "credit note reset to open"))
  );
}

export function mapCreatedPackingListResult(
  result: ResultFor<operations["createPackingListFromOrder"]>
): CreatedPackingListResult {
  return mapResultData(
    result,
    normalizeOrder(requireValue(result.data, "packing list created from order"))
  );
}

export function mapCreatedContractNoteResult(
  result: ResultFor<operations["createContractNoteFromOrder"]>
): CreatedContractNoteResult {
  return mapResultData(
    result,
    normalizeOrder(requireValue(result.data, "contract note created from order"))
  );
}

function renderSharedData(value: Record<string, unknown>): {
  readonly docId?: string;
  readonly parameters?: InvoiceRenderParameters;
} {
  const docId = value.docId;
  if (docId !== undefined && typeof docId !== "string") {
    throw new SevdeskResponseValidationError("sevdesk returned an invalid rendered document id.", {
      value
    });
  }
  const parameters = value.parameters;
  if (parameters !== undefined && !Array.isArray(parameters)) {
    throw new SevdeskResponseValidationError("sevdesk returned invalid render parameters.", {
      value
    });
  }
  return {
    ...(docId === undefined ? {} : { docId }),
    ...(parameters === undefined ? {} : { parameters: parameters as InvoiceRenderParameters })
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
