import type { operations } from "../types/openapi.js";
import type { ResultFor } from "../types/operation.js";
import { SevdeskResponseValidationError } from "../utils/errors.js";
import { mapPaginatedResultData, mapResultData } from "../utils/result.js";
import {
  normalizeContact,
  normalizeCreatedCreditNote,
  normalizeCreatedInvoice,
  normalizeCreatedOrder,
  normalizeCreatedVoucher,
  normalizeCreditNote,
  normalizeInvoice,
  normalizeOrder,
  normalizePart,
  normalizeVoucher,
  requireCollection,
  requireSingle,
  requireValue
} from "./normalizers.js";
import type {
  ContactListResult,
  ContactResult,
  CancelledInvoiceResult,
  CreatedCreditNoteResult,
  CreatedInvoiceResult,
  CreatedOrderResult,
  CreatedPartResult,
  CreatedVoucherResult,
  DraftVoucherResult,
  CreditNoteListResult,
  CreditNoteResult,
  InvoiceListResult,
  InvoiceResult,
  OpenVoucherResult,
  OrderListResult,
  OrderResult,
  PartListResult,
  PartResult,
  PartStockResult,
  SentCreditNoteResult,
  SentInvoiceResult,
  SentOrderResult,
  UpdatedPartResult,
  VoucherListResult,
  VoucherResult
} from "./results.js";

export function mapContactListResult(
  result: ResultFor<operations["getContacts"]>
): ContactListResult {
  return mapPaginatedResultData(
    result,
    requireCollection(result.data, "contact").map(normalizeContact)
  );
}

export function mapContactResult(result: ResultFor<operations["getContactById"]>): ContactResult {
  return mapResultData(result, normalizeContact(requireSingle(result.data, "contact")));
}

export function mapInvoiceListResult(
  result: ResultFor<operations["getInvoices"]>
): InvoiceListResult {
  return mapPaginatedResultData(
    result,
    requireCollection(result.data, "invoice").map(normalizeInvoice)
  );
}

export function mapInvoiceResult(result: ResultFor<operations["getInvoiceById"]>): InvoiceResult {
  return mapResultData(result, normalizeInvoice(requireSingle(result.data, "invoice")));
}

export function mapCreatedInvoiceResult(
  result: ResultFor<operations["createInvoiceByFactory"]>
): CreatedInvoiceResult {
  return mapResultData(result, normalizeCreatedInvoice(result.data));
}

export function mapSentInvoiceResult(
  result: ResultFor<operations["invoiceSendBy"]>
): SentInvoiceResult {
  return mapResultData(result, normalizeInvoice(requireValue(result.data, "sent invoice")));
}

export function mapCancelledInvoiceResult(
  result: ResultFor<operations["cancelInvoice"]>
): CancelledInvoiceResult {
  return mapResultData(result, normalizeInvoice(requireValue(result.data, "cancellation invoice")));
}

export function mapOrderListResult(result: ResultFor<operations["getOrders"]>): OrderListResult {
  return mapPaginatedResultData(
    result,
    requireCollection(result.data, "order").map(normalizeOrder)
  );
}

export function mapOrderResult(result: ResultFor<operations["getOrderById"]>): OrderResult {
  return mapResultData(result, normalizeOrder(requireSingle(result.data, "order")));
}

export function mapCreatedOrderResult(
  result: ResultFor<operations["createOrder"]>
): CreatedOrderResult {
  return mapResultData(result, normalizeCreatedOrder(result.data));
}

export function mapSentOrderResult(result: ResultFor<operations["orderSendBy"]>): SentOrderResult {
  return mapResultData(result, normalizeOrder(requireValue(result.data, "sent order")));
}

export function mapVoucherListResult(
  result: ResultFor<operations["getVouchers"]>
): VoucherListResult {
  return mapPaginatedResultData(
    result,
    requireCollection(result.data, "voucher").map(normalizeVoucher)
  );
}

export function mapVoucherResult(result: ResultFor<operations["getVoucherById"]>): VoucherResult {
  return mapResultData(result, normalizeVoucher(requireSingle(result.data, "voucher")));
}

export function mapCreatedVoucherResult(
  result: ResultFor<operations["voucherFactorySaveVoucher"]>
): CreatedVoucherResult {
  return mapResultData(result, normalizeCreatedVoucher(result.data));
}

export function mapOpenVoucherResult(
  result: ResultFor<operations["voucherResetToOpen"]>
): OpenVoucherResult {
  return mapResultData(result, normalizeVoucher(requireValue(result.data, "open voucher")));
}

export function mapDraftVoucherResult(
  result: ResultFor<operations["voucherResetToDraft"]>
): DraftVoucherResult {
  return mapResultData(result, normalizeVoucher(requireValue(result.data, "draft voucher")));
}

export function mapCreditNoteListResult(
  result: ResultFor<operations["getCreditNotes"]>
): CreditNoteListResult {
  return mapPaginatedResultData(
    result,
    requireCollection(result.data, "credit note").map(normalizeCreditNote)
  );
}

export function mapCreditNoteResult(
  result: ResultFor<operations["getcreditNoteById"]>
): CreditNoteResult {
  return mapResultData(result, normalizeCreditNote(requireSingle(result.data, "credit note")));
}

export function mapCreatedCreditNoteResult(
  result: ResultFor<operations["createcreditNote"]>
): CreatedCreditNoteResult {
  return mapResultData(result, normalizeCreatedCreditNote(result.data));
}

export function mapSentCreditNoteResult(
  result: ResultFor<operations["creditNoteSendBy"]>
): SentCreditNoteResult {
  return mapResultData(result, normalizeCreditNote(requireValue(result.data, "sent credit note")));
}

export function mapPartListResult(result: ResultFor<operations["getParts"]>): PartListResult {
  return mapPaginatedResultData(result, requireCollection(result.data, "part").map(normalizePart));
}

export function mapPartResult(result: ResultFor<operations["getPartById"]>): PartResult {
  return mapResultData(result, normalizePart(requireSingle(result.data, "part")));
}

export function mapPartStockResult(result: ResultFor<operations["partGetStock"]>): PartStockResult {
  const stock = requireValue(result.data, "part stock");
  if (typeof stock !== "number" || !Number.isFinite(stock)) {
    throw new SevdeskResponseValidationError("sevdesk returned invalid part stock.", {
      value: result.data
    });
  }
  return mapResultData(result, stock);
}

export function mapCreatedPartResult(
  result: ResultFor<operations["createPart"]>
): CreatedPartResult {
  return mapResultData(result, normalizePart(requireValue(result.data, "created part")));
}

export function mapUpdatedPartResult(
  result: ResultFor<operations["updatePart"]>
): UpdatedPartResult {
  return mapResultData(result, normalizePart(requireValue(result.data, "updated part")));
}
