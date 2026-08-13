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
  normalizeInvoicePosition,
  normalizeOrder,
  normalizePart,
  normalizeUser,
  normalizeCheckAccount,
  normalizeTransaction,
  normalizeTag,
  normalizeTagRelation,
  normalizeTextTemplate,
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
  InvoicePositionListResult,
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
  UserListResult,
  UserResult,
  CheckAccountListResult,
  CheckAccountResult,
  CreatedClearingAccountResult,
  CreatedFileImportAccountResult,
  UpdatedCheckAccountResult,
  CheckAccountBalanceResult,
  TransactionListResult,
  TransactionResult,
  CreatedTransactionResult,
  UpdatedTransactionResult,
  TagListResult,
  TagResult,
  TagRelationListResult,
  CreatedTagResult,
  UpdatedTagResult,
  TextTemplateListResult,
  CreatedTextTemplateResult,
  UpdatedTextTemplateResult,
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

export function mapInvoicePositionListResult(
  result: ResultFor<operations["getInvoicePositionsById"]>
): InvoicePositionListResult {
  return mapPaginatedResultData(
    result,
    requireCollection(result.data, "invoice position").map(normalizeInvoicePosition)
  );
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

export function mapUserListResult(result: ResultFor<operations["getSevUsers"]>): UserListResult {
  return mapPaginatedResultData(result, requireCollection(result.data, "sevUser").map(normalizeUser));
}

export function mapUserResult(result: ResultFor<operations["getSevUserById"]>): UserResult {
  return mapResultData(result, normalizeUser(requireSingle(result.data, "sevUser")));
}

export function mapCheckAccountListResult(
  result: ResultFor<operations["getCheckAccounts"]>
): CheckAccountListResult {
  return mapPaginatedResultData(
    result,
    requireCollection(result.data, "check account").map(normalizeCheckAccount)
  );
}

export function mapCheckAccountResult(
  result: ResultFor<operations["getCheckAccountById"]>
): CheckAccountResult {
  return mapResultData(
    result,
    normalizeCheckAccount(requireSingle(result.data, "check account"))
  );
}

export function mapCreatedClearingAccountResult(
  result: ResultFor<operations["createClearingAccount"]>
): CreatedClearingAccountResult {
  return mapResultData(result, normalizeCheckAccount(requireValue(result.data, "check account")));
}

export function mapCreatedFileImportAccountResult(
  result: ResultFor<operations["createFileImportAccount"]>
): CreatedFileImportAccountResult {
  return mapResultData(result, normalizeCheckAccount(requireValue(result.data, "check account")));
}

export function mapUpdatedCheckAccountResult(
  result: ResultFor<operations["updateCheckAccount"]>
): UpdatedCheckAccountResult {
  return mapResultData(result, normalizeCheckAccount(requireValue(result.data, "check account")));
}

export function mapCheckAccountBalanceResult(
  result: ResultFor<operations["getBalanceAtDate"]>
): CheckAccountBalanceResult {
  const balance = requireValue(result.data, "check-account balance");
  if (typeof balance !== "string" && typeof balance !== "number") {
    throw new SevdeskResponseValidationError("sevdesk returned an invalid check-account balance.", {
      value: result.data
    });
  }
  return mapResultData(result, String(balance));
}

export function mapTransactionListResult(
  result: ResultFor<operations["getTransactions"]>
): TransactionListResult {
  return mapPaginatedResultData(
    result,
    requireCollection(result.data, "check-account transaction").map(normalizeTransaction)
  );
}

export function mapTransactionResult(
  result: ResultFor<operations["getCheckAccountTransactionById"]>
): TransactionResult {
  return mapResultData(
    result,
    normalizeTransaction(requireSingle(result.data, "check-account transaction"))
  );
}

export function mapCreatedTransactionResult(
  result: ResultFor<operations["createTransaction"]>
): CreatedTransactionResult {
  return mapResultData(
    result,
    normalizeTransaction(requireValue(result.data, "check-account transaction"))
  );
}

export function mapUpdatedTransactionResult(
  result: ResultFor<operations["updateCheckAccountTransaction"]>
): UpdatedTransactionResult {
  return mapResultData(
    result,
    normalizeTransaction(requireValue(result.data, "check-account transaction"))
  );
}

export function mapTagListResult(result: ResultFor<operations["getTags"]>): TagListResult {
  return mapPaginatedResultData(result, requireCollection(result.data, "tag").map(normalizeTag));
}

export function mapTagResult(result: ResultFor<operations["getTagById"]>): TagResult {
  return mapResultData(result, normalizeTag(requireSingle(result.data, "tag")));
}

export function mapTagRelationListResult(
  result: ResultFor<operations["getTagRelations"]>
): TagRelationListResult {
  return mapPaginatedResultData(
    result,
    requireCollection(result.data, "tag relation").map(normalizeTagRelation)
  );
}

export function mapCreatedTagResult(result: ResultFor<operations["createTag"]>): CreatedTagResult {
  return mapResultData(result, normalizeTagRelation(requireValue(result.data, "tag relation")));
}

export function mapUpdatedTagResult(result: ResultFor<operations["updateTag"]>): UpdatedTagResult {
  return mapResultData(result, normalizeTag(requireValue(result.data, "tag")));
}

export function mapTextTemplateListResult(
  result: ResultFor<operations["getTextTemplate"]>
): TextTemplateListResult {
  return mapPaginatedResultData(
    result,
    requireCollection(result.data, "text template").map(normalizeTextTemplate)
  );
}

export function mapCreatedTextTemplateResult(
  result: ResultFor<operations["addTextTemplate"]>
): CreatedTextTemplateResult {
  return mapResultData(result, normalizeTextTemplate(requireValue(result.data, "text template")));
}

export function mapUpdatedTextTemplateResult(
  result: ResultFor<operations["updateTextTemplate"]>
): UpdatedTextTemplateResult {
  return mapResultData(result, normalizeTextTemplate(requireValue(result.data, "text template")));
}
