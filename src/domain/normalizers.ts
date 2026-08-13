import type { components } from "../types/openapi.js";
import {
  ContactCategory,
  enumName,
  InvoiceType,
  LegacyTaxType,
  OrderType,
  SendType,
  TaxRule,
  VoucherDirection,
  VoucherType,
  type EnumMap
} from "../enums/domain-enums.js";
import { SevdeskResponseValidationError } from "../utils/errors.js";
import { normalizeSevdeskId } from "../types/references.js";
import type { CreatedCreditNote, CreatedInvoice, CreatedOrder, CreatedVoucher } from "./results.js";
import type {
  SevdeskContact,
  SevdeskCreditNote,
  SevdeskInvoice,
  SevdeskInvoicePosition,
  SevdeskOrder,
  SevdeskPart,
  SevdeskUser,
  SevdeskVoucher,
  SemanticCode,
  SendSemanticCode
} from "./models.js";
import {
  normalizeContactStatus,
  normalizeCreditNoteStatus,
  normalizeInvoiceStatus,
  normalizeOrderStatus,
  normalizePartStatus,
  normalizeVoucherStatus
} from "./status.js";

export function normalizeContact(
  value: Omit<components["schemas"]["Model_ContactResponse"], "status"> & {
    readonly status?: unknown;
  }
): SevdeskContact {
  const record = requireRecord(value, "contact");
  const {
    id,
    objectName: _objectName,
    status,
    exemptVat,
    defaultDiscountPercentage,
    governmentAgency,
    ...contact
  } = record;
  requireObjectName(_objectName, "Contact", "contact");
  const category = semanticCode(
    optionalReferenceId(contact.category, "contact.category"),
    ContactCategory,
    "contact.category"
  );
  const taxType = semanticCode(contact.taxType, LegacyTaxType, "contact.taxType");
  return {
    ...contact,
    id: requiredId(id, "contact"),
    objectName: "Contact",
    ...normalizeContactStatus(status),
    ...(exemptVat === undefined
      ? {}
      : { exemptVat: normalizeBoolean(exemptVat, "contact.exemptVat") }),
    ...(defaultDiscountPercentage === undefined
      ? {}
      : {
          defaultDiscountPercentage: normalizeBoolean(
            defaultDiscountPercentage,
            "contact.defaultDiscountPercentage"
          )
        }),
    ...(governmentAgency === undefined
      ? {}
      : { governmentAgency: normalizeBoolean(governmentAgency, "contact.governmentAgency") }),
    semantic: {
      ...(category === undefined ? {} : { category }),
      ...(taxType === undefined ? {} : { taxType })
    }
  };
}

export function normalizeInvoice(
  value: Omit<
    components["schemas"]["Model_InvoiceResponse"],
    "status" | "invoiceDate" | "timeToPay" | "reminderDeadline"
  > & {
    readonly status?: unknown;
    readonly invoiceDate?: string | number | null;
    readonly timeToPay?: string | number | null;
    readonly reminderDeadline?: string | number | null;
  }
): SevdeskInvoice {
  const record = requireRecord(value, "invoice");
  const { id, objectName: _objectName, status, ...invoice } = record;
  requireObjectName(_objectName, "Invoice", "invoice");
  const invoiceType = semanticCode(invoice.invoiceType, InvoiceType, "invoice.invoiceType");
  const sendType = sendSemanticCode(invoice.sendType, "invoice.sendType");
  const taxType = semanticCode(invoice.taxType, LegacyTaxType, "invoice.taxType");
  const taxRule = semanticCode(
    optionalReferenceId(invoice.taxRule, "invoice.taxRule"),
    TaxRule,
    "invoice.taxRule"
  );
  return {
    ...invoice,
    id: requiredId(id, "invoice"),
    objectName: "Invoice",
    ...normalizeInvoiceStatus(status),
    semantic: {
      ...(invoiceType === undefined ? {} : { invoiceType }),
      ...(sendType === undefined ? {} : { sendType }),
      ...(taxType === undefined ? {} : { taxType }),
      ...(taxRule === undefined ? {} : { taxRule })
    }
  };
}

export function normalizeOrder(
  value: Omit<components["schemas"]["Model_OrderResponse"], "status"> & {
    readonly status?: unknown;
  }
): SevdeskOrder {
  const record = requireRecord(value, "order");
  const { id, objectName: _objectName, status, ...order } = record;
  requireObjectName(_objectName, "Order", "order");
  const orderType = semanticCode(order.orderType, OrderType, "order.orderType");
  const sendType = sendSemanticCode(order.sendType, "order.sendType");
  const taxType = semanticCode(order.taxType, LegacyTaxType, "order.taxType");
  const taxRule = semanticCode(
    optionalReferenceId(order.taxRule, "order.taxRule"),
    TaxRule,
    "order.taxRule"
  );
  return {
    ...order,
    id: requiredId(id, "order"),
    objectName: "Order",
    ...normalizeOrderStatus(status),
    semantic: {
      ...(orderType === undefined ? {} : { orderType }),
      ...(sendType === undefined ? {} : { sendType }),
      ...(taxType === undefined ? {} : { taxType }),
      ...(taxRule === undefined ? {} : { taxRule })
    }
  };
}

export function normalizeVoucher(
  value: Omit<components["schemas"]["Model_VoucherResponse"], "status"> & {
    readonly status?: unknown;
  }
): SevdeskVoucher {
  const record = requireRecord(value, "voucher");
  const { id, objectName: _objectName, status, ...voucher } = record;
  requireObjectName(_objectName, "Voucher", "voucher");
  const voucherType = semanticCode(voucher.voucherType, VoucherType, "voucher.voucherType");
  const direction = semanticCode(voucher.creditDebit, VoucherDirection, "voucher.creditDebit");
  const taxType = semanticCode(voucher.taxType, LegacyTaxType, "voucher.taxType");
  const taxRule = semanticCode(
    optionalReferenceId(voucher.taxRule, "voucher.taxRule"),
    TaxRule,
    "voucher.taxRule"
  );
  return {
    ...voucher,
    id: requiredId(id, "voucher"),
    objectName: "Voucher",
    ...normalizeVoucherStatus(status),
    semantic: {
      ...(voucherType === undefined ? {} : { voucherType }),
      ...(direction === undefined ? {} : { direction }),
      ...(taxType === undefined ? {} : { taxType }),
      ...(taxRule === undefined ? {} : { taxRule })
    }
  };
}

export function normalizePart(
  value: Omit<components["schemas"]["Model_Part"], "id" | "objectName" | "status"> & {
    readonly id?: unknown;
    readonly objectName?: unknown;
    readonly status?: unknown;
  }
): SevdeskPart {
  const record = requireRecord(value, "part");
  const { id, objectName: _objectName, status, ...part } = record;
  requireObjectName(_objectName, "Part", "part");
  const normalizedStatus =
    status === undefined || status === null ? undefined : normalizePartStatus(status);
  return {
    ...part,
    id: requiredId(id, "part"),
    objectName: "Part",
    ...(normalizedStatus === undefined ? {} : normalizedStatus)
  };
}

export function normalizeCreditNote(
  value: Omit<components["schemas"]["Model_creditNoteResponse"], "status"> & {
    readonly status?: unknown;
  }
): SevdeskCreditNote {
  const record = requireRecord(value, "credit note");
  const { id, objectName: _objectName, status, ...creditNote } = record;
  requireObjectName(_objectName, "CreditNote", "credit note");
  const sendType = sendSemanticCode(creditNote.sendType, "creditNote.sendType");
  const taxType = semanticCode(creditNote.taxType, LegacyTaxType, "creditNote.taxType");
  const taxRule = semanticCode(
    optionalReferenceId(creditNote.taxRule, "creditNote.taxRule"),
    TaxRule,
    "creditNote.taxRule"
  );
  return {
    ...creditNote,
    id: requiredId(id, "credit note"),
    objectName: "CreditNote",
    ...normalizeCreditNoteStatus(status),
    semantic: {
      ...(sendType === undefined ? {} : { sendType }),
      ...(taxType === undefined ? {} : { taxType }),
      ...(taxRule === undefined ? {} : { taxRule })
    }
  };
}

export function normalizeCreatedInvoice(
  value: components["schemas"]["saveInvoiceResponse"] | undefined
): CreatedInvoice {
  if (!value?.invoice) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned no invoice after Factory creation.",
      { value }
    );
  }
  return {
    invoice: normalizeInvoice(value.invoice),
    positions: optionalCollection(value.invoicePos, "invoice positions"),
    ...(value.filename === undefined ? {} : { filename: value.filename })
  };
}

export function normalizeCreatedOrder(
  value: components["schemas"]["saveOrderResponse"] | undefined
): CreatedOrder {
  if (!value?.order) {
    throw new SevdeskResponseValidationError("sevdesk returned no order after Factory creation.", {
      value
    });
  }
  return {
    order: normalizeOrder(value.order),
    positions: optionalCollection(value.orderPos, "order positions")
  };
}

export function normalizeCreatedVoucher(
  value: components["schemas"]["saveVoucherResponse"] | undefined
): CreatedVoucher {
  if (!value?.voucher) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned no voucher after Factory creation.",
      { value }
    );
  }
  return {
    voucher: normalizeVoucher(value.voucher),
    positions: optionalCollection(value.voucherPos, "voucher positions"),
    ...(value.filename === undefined ? {} : { filename: value.filename })
  };
}

export function normalizeCreatedCreditNote(
  value: components["schemas"]["saveCreditNoteResponse"] | undefined
): CreatedCreditNote {
  if (!value?.creditNote) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned no credit note after Factory creation.",
      { value }
    );
  }
  return {
    creditNote: normalizeCreditNote(value.creditNote),
    positions: optionalCollection(value.creditNotePos, "credit-note positions")
  };
}

export function normalizeInvoicePosition(
  value: components["schemas"]["Model_InvoicePosResponse"]
): SevdeskInvoicePosition {
  const record = requireRecord(value, "invoice position");
  if (record.objectName !== undefined) {
    requireObjectName(record.objectName, "InvoicePos", "invoice position");
  }
  if (record.id === undefined) {
    return {
      ...record,
      objectName: "InvoicePos"
    };
  }
  return {
    ...record,
    id: requiredId(record.id, "invoice position"),
    objectName: "InvoicePos"
  };
}

export function normalizeUser(
  value: components["schemas"]["Model_SevUserResponse"]
): SevdeskUser {
  const record = requireRecord(value, "sevUser");
  const { id, objectName: _objectName, ...user } = record;
  if (_objectName !== undefined) {
    requireObjectName(_objectName, "SevUser", "sevUser");
  }
  return {
    ...user,
    id: requiredId(id, "sevUser"),
    objectName: "SevUser"
  };
}

export function requireCollection<T>(
  value: readonly T[] | undefined,
  resource: string
): readonly T[] {
  if (!Array.isArray(value)) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned no ${resource} collection where an array was expected.`,
      { value }
    );
  }
  return value;
}

export function requireSingle<T>(value: readonly T[] | undefined, resource: string): T {
  const collection = requireCollection(value, resource);
  if (collection.length !== 1 || collection[0] === undefined) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned ${collection.length} ${resource} objects where exactly one was expected.`,
      { value }
    );
  }
  return collection[0];
}

export function requireValue<T>(value: T | null | undefined, resource: string): T {
  if (value === undefined || value === null) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned no ${resource} where one was expected.`,
      { value }
    );
  }
  return value;
}

function requiredId(value: unknown, resource: string): string {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new SevdeskResponseValidationError(`sevdesk returned no valid ${resource} id.`, {
      value
    });
  }
  try {
    return String(normalizeSevdeskId(value, resource));
  } catch (error) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned no valid ${resource} id.`,
      { value },
      error
    );
  }
}

function requireObjectName(
  value: unknown,
  expected: string,
  resource: string
): asserts value is string {
  if (value !== expected) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned an invalid objectName for ${resource}; expected "${expected}".`,
      { value }
    );
  }
}

function normalizeBoolean(value: unknown, field: string): boolean {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;
  throw new SevdeskResponseValidationError(`sevdesk returned an invalid boolean for ${field}.`, {
    value
  });
}

function semanticCode<TMap extends EnumMap>(
  value: unknown,
  values: TMap,
  field: string
): SemanticCode<TMap> | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new SevdeskResponseValidationError(`sevdesk returned an invalid code for ${field}.`, {
      value
    });
  }
  const name = enumName(values, value);
  if (name !== undefined) {
    return {
      name,
      code: values[name],
      known: true
    } as SemanticCode<TMap>;
  }
  return {
    name: "UNKNOWN",
    code: value,
    known: false
  } as SemanticCode<TMap>;
}

function sendSemanticCode(value: unknown, field: string): SendSemanticCode | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "" || value === 0) {
    return { name: "NOT_SENT", code: null, known: true };
  }
  return semanticCode(value, SendType, field);
}

function requireRecord<TValue>(value: TValue, resource: string): TValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskResponseValidationError(`sevdesk returned an invalid ${resource} object.`, {
      value
    });
  }
  return value;
}

function optionalReferenceId(value: unknown, field: string): unknown {
  if (value === undefined || value === null) return undefined;
  if (
    typeof value !== "object" ||
    Array.isArray(value) ||
    !("id" in value) ||
    value.id === undefined ||
    value.id === null
  ) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned an invalid reference for ${field}.`,
      { value }
    );
  }
  return value.id;
}

function optionalCollection<TValue>(
  value: readonly TValue[] | undefined,
  resource: string
): readonly TValue[] {
  return value === undefined ? [] : requireCollection(value, resource);
}
