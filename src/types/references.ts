import { SevdeskConfigurationError } from "../utils/errors.js";
import { validatePositiveSafeInteger } from "../utils/validation.js";

export type EntityId = string | number;

declare const sevdeskIdBrand: unique symbol;

export type SevdeskId = number & {
  readonly [sevdeskIdBrand]: "SevdeskId";
};

export type SevdeskIdInput = SevdeskId | number | `${bigint}`;

export type SevdeskObjectName =
  | "AccountDatev"
  | "AccountingContact"
  | "AccountingType"
  | "Category"
  | "CheckAccount"
  | "CheckAccountTransaction"
  | "CommunicationWay"
  | "CommunicationWayKey"
  | "Contact"
  | "ContactAddress"
  | "ContactCustomField"
  | "ContactCustomFieldSetting"
  | "CostCentre"
  | "CreditNote"
  | "CreditNotePos"
  | "Document"
  | "Invoice"
  | "InvoicePos"
  | "Order"
  | "OrderPos"
  | "Part"
  | "PaymentMethod"
  | "SevUser"
  | "StaticCountry"
  | "Tag"
  | "TaxRule"
  | "TaxSet"
  | "Unity"
  | "Voucher"
  | "VoucherPos";

export interface SevdeskReference<
  TObjectName extends SevdeskObjectName = SevdeskObjectName,
  TId extends EntityId = EntityId
> {
  readonly id: TId;
  readonly objectName: TObjectName;
}

export type SafeSevdeskReference<TObjectName extends SevdeskObjectName = SevdeskObjectName> =
  SevdeskReference<TObjectName, SevdeskId>;

export function normalizeSevdeskId(id: EntityId, label = "entity"): SevdeskId {
  let value: number;
  if (typeof id === "number") {
    value = id;
  } else {
    const normalized = id.trim();
    if (!/^\d+$/.test(normalized)) {
      throw invalidId(id, label);
    }
    value = Number(normalized);
  }
  try {
    return validatePositiveSafeInteger(value, `${label} id`) as SevdeskId;
  } catch (error) {
    if (error instanceof SevdeskConfigurationError) throw invalidId(id, label, error);
    throw error;
  }
}

export function reference<TObjectName extends SevdeskObjectName>(
  objectName: TObjectName,
  id: SevdeskIdInput
): SafeSevdeskReference<TObjectName> {
  return { id: normalizeSevdeskId(id, objectName), objectName };
}

export const refs = {
  contact: (id: SevdeskIdInput) => reference("Contact", id),
  contactAddress: (id: SevdeskIdInput) => reference("ContactAddress", id),
  contactCustomField: (id: SevdeskIdInput) => reference("ContactCustomField", id),
  contactCustomFieldSetting: (id: SevdeskIdInput) => reference("ContactCustomFieldSetting", id),
  communicationWay: (id: SevdeskIdInput) => reference("CommunicationWay", id),
  communicationWayKey: (id: SevdeskIdInput) => reference("CommunicationWayKey", id),
  invoice: (id: SevdeskIdInput) => reference("Invoice", id),
  invoicePos: (id: SevdeskIdInput) => reference("InvoicePos", id),
  order: (id: SevdeskIdInput) => reference("Order", id),
  orderPos: (id: SevdeskIdInput) => reference("OrderPos", id),
  voucher: (id: SevdeskIdInput) => reference("Voucher", id),
  voucherPos: (id: SevdeskIdInput) => reference("VoucherPos", id),
  creditNote: (id: SevdeskIdInput) => reference("CreditNote", id),
  creditNotePos: (id: SevdeskIdInput) => reference("CreditNotePos", id),
  checkAccount: (id: SevdeskIdInput) => reference("CheckAccount", id),
  checkAccountTransaction: (id: SevdeskIdInput) => reference("CheckAccountTransaction", id),
  accountDatev: (id: SevdeskIdInput) => reference("AccountDatev", id),
  accountingType: (id: SevdeskIdInput) => reference("AccountingType", id),
  accountingContact: (id: SevdeskIdInput) => reference("AccountingContact", id),
  category: (id: SevdeskIdInput) => reference("Category", id),
  costCentre: (id: SevdeskIdInput) => reference("CostCentre", id),
  country: (id: SevdeskIdInput) => reference("StaticCountry", id),
  document: (id: SevdeskIdInput) => reference("Document", id),
  part: (id: SevdeskIdInput) => reference("Part", id),
  paymentMethod: (id: SevdeskIdInput) => reference("PaymentMethod", id),
  sevUser: (id: SevdeskIdInput) => reference("SevUser", id),
  taxRule: (id: SevdeskIdInput) => reference("TaxRule", id),
  taxSet: (id: SevdeskIdInput) => reference("TaxSet", id),
  tag: (id: SevdeskIdInput) => reference("Tag", id),
  unity: (id: SevdeskIdInput) => reference("Unity", id)
} as const;

function invalidId(id: EntityId, label: string, cause?: unknown): SevdeskConfigurationError {
  return new SevdeskConfigurationError(
    `${label} id "${String(id)}" is not a positive numeric sevdesk id.`,
    cause === undefined ? undefined : { cause }
  );
}
