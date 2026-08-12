import {
  ContactStatus,
  CreditNoteStatus,
  InvoiceStatus,
  OrderStatus,
  PartStatus,
  VoucherStatus
} from "../enums/domain-enums.js";
import { SevdeskResponseValidationError } from "../utils/errors.js";

const invoiceStatuses = {
  [InvoiceStatus.DEACTIVATED_RECURRING]: "DEACTIVATED_RECURRING",
  [InvoiceStatus.DRAFT]: "DRAFT",
  [InvoiceStatus.OPEN]: "OPEN",
  [InvoiceStatus.UNDOCUMENTED_500]: "UNDOCUMENTED_500",
  [InvoiceStatus.PARTIALLY_PAID]: "PARTIALLY_PAID",
  [InvoiceStatus.PAID]: "PAID"
} as const;

const orderStatuses = {
  [OrderStatus.DRAFT]: "DRAFT",
  [OrderStatus.DELIVERED]: "DELIVERED",
  [OrderStatus.REJECTED]: "REJECTED",
  [OrderStatus.ACCEPTED]: "ACCEPTED",
  [OrderStatus.PARTIALLY_CALCULATED]: "PARTIALLY_CALCULATED",
  [OrderStatus.CALCULATED]: "CALCULATED"
} as const;

const voucherStatuses = {
  [VoucherStatus.DRAFT]: "DRAFT",
  [VoucherStatus.OPEN]: "OPEN",
  [VoucherStatus.TRANSFERRED]: "TRANSFERRED",
  [VoucherStatus.PARTIALLY_PAID]: "PARTIALLY_PAID",
  [VoucherStatus.PAID]: "PAID"
} as const;

const creditNoteStatuses = {
  [CreditNoteStatus.DRAFT]: "DRAFT",
  [CreditNoteStatus.OPEN]: "OPEN",
  [CreditNoteStatus.PARTIALLY_PAID]: "PARTIALLY_PAID",
  [CreditNoteStatus.PAID]: "PAID",
  [CreditNoteStatus.UNDOCUMENTED_300]: "UNDOCUMENTED_300",
  [CreditNoteStatus.UNDOCUMENTED_500]: "UNDOCUMENTED_500"
} as const;

const contactStatuses = {
  [ContactStatus.LEAD]: "LEAD",
  [ContactStatus.PENDING]: "PENDING",
  [ContactStatus.ACTIVE]: "ACTIVE"
} as const;

const partStatuses = {
  [PartStatus.INACTIVE]: "INACTIVE",
  [PartStatus.ACTIVE]: "ACTIVE"
} as const;

type NumericKey<TMap> = Extract<keyof TMap, number>;
type StatusName<TMap> = TMap[NumericKey<TMap>] & string;
type KnownStatusFromMap<TMap extends Readonly<Record<number, string>>> = {
  [TCode in NumericKey<TMap>]: {
    readonly status: TMap[TCode];
    readonly statusCode: TCode;
    readonly statusKnown: true;
  };
}[NumericKey<TMap>];

export interface UnknownStatus {
  readonly status: "UNKNOWN";
  readonly statusCode: number;
  readonly statusKnown: false;
}

export type NormalizedStatus<TName extends string, TCode extends number = number> =
  | {
      readonly status: TName;
      readonly statusCode: TCode;
      readonly statusKnown: true;
    }
  | UnknownStatus;

type StatusFromMap<TMap extends Readonly<Record<number, string>>> =
  KnownStatusFromMap<TMap> | UnknownStatus;

export type InvoiceStatusName = StatusName<typeof invoiceStatuses>;
export type OrderStatusName = StatusName<typeof orderStatuses>;
export type VoucherStatusName = StatusName<typeof voucherStatuses>;
export type CreditNoteStatusName = StatusName<typeof creditNoteStatuses>;
export type ContactStatusName = StatusName<typeof contactStatuses>;
export type PartStatusName = StatusName<typeof partStatuses>;

export type InvoiceNormalizedStatus = StatusFromMap<typeof invoiceStatuses>;
export type OrderNormalizedStatus = StatusFromMap<typeof orderStatuses>;
export type VoucherNormalizedStatus = StatusFromMap<typeof voucherStatuses>;
export type CreditNoteNormalizedStatus = StatusFromMap<typeof creditNoteStatuses>;
export type ContactNormalizedStatus = StatusFromMap<typeof contactStatuses>;
export type PartNormalizedStatus = StatusFromMap<typeof partStatuses>;

export function normalizeInvoiceStatus(value: unknown): InvoiceNormalizedStatus {
  return normalizeStatus(value, invoiceStatuses, "invoice");
}

export function normalizeOrderStatus(value: unknown): OrderNormalizedStatus {
  return normalizeStatus(value, orderStatuses, "order");
}

export function normalizeVoucherStatus(value: unknown): VoucherNormalizedStatus {
  return normalizeStatus(value, voucherStatuses, "voucher");
}

export function normalizeCreditNoteStatus(value: unknown): CreditNoteNormalizedStatus {
  return normalizeStatus(value, creditNoteStatuses, "credit note");
}

export function normalizeContactStatus(value: unknown): ContactNormalizedStatus {
  return normalizeStatus(value, contactStatuses, "contact");
}

export function normalizePartStatus(value: unknown): PartNormalizedStatus {
  return normalizeStatus(value, partStatuses, "part");
}

function normalizeStatus<TMap extends Readonly<Record<number, string>>>(
  value: unknown,
  values: TMap,
  resource: string
): StatusFromMap<TMap> {
  const code =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^-?\d+$/.test(value.trim())
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isSafeInteger(code)) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned an invalid ${resource} status code.`,
      { value }
    );
  }
  const status = values[code];
  return (
    status
      ? { status, statusCode: code, statusKnown: true }
      : { status: "UNKNOWN", statusCode: code, statusKnown: false }
  ) as StatusFromMap<TMap>;
}
