import {
  ContactCategory,
  ContactDepth,
  CreditNoteStatus,
  InvoiceStatus,
  InvoiceType,
  OrderStatus,
  OrderType,
  SendType,
  SortDirection,
  VoucherDirection,
  VoucherStatus,
  VoucherType
} from "../enums/domain-enums.js";
import type { ExtraQuery, QueryValue } from "../types/operation.js";
import type { SevdeskObjectName, SevdeskReference } from "../types/references.js";
import {
  validateFiniteNumber,
  validateInteger,
  validatePaginationLimit,
  validatePaginationOffset
} from "../utils/validation.js";
import {
  compactQuery,
  dateFilter,
  numericEnumCode,
  stringEnumCode,
  wireReference
} from "./internal.js";
import type {
  ContactListOptions,
  CreditNoteListOptions,
  InvoiceListOptions,
  OrderListOptions,
  PageOptions,
  VoucherListOptions
} from "./types.js";

export function contactListQuery(options: ContactListOptions = {}): ExtraQuery {
  const category =
    options.category === undefined
      ? undefined
      : typeof options.category === "object" && "objectName" in options.category
        ? wireReference(options.category)
        : {
            id: numericEnumCode(ContactCategory, options.category, "contact category"),
            objectName: "Category"
          };
  return compactQuery({
    ...pageQuery(options),
    depth:
      options.depth === undefined
        ? undefined
        : options.depth === "all"
          ? ContactDepth.ORGANISATIONS_AND_PEOPLE
          : options.depth === "organisations"
            ? ContactDepth.ORGANISATIONS_ONLY
            : stringEnumCode(ContactDepth, options.depth, "contact depth"),
    category,
    city: options.city,
    tags: references(options.tags),
    customerNumber: options.customerNumber,
    parent: optionalReference(options.parent),
    name: options.name,
    zip: options.zip,
    country: optionalReference(options.country),
    createBefore: dateFilter(options.createBefore),
    createAfter: dateFilter(options.createAfter),
    updateBefore: dateFilter(options.updateBefore),
    updateAfter: dateFilter(options.updateAfter),
    orderByCustomerNumber:
      options.orderByCustomerNumber === undefined
        ? undefined
        : stringEnumCode(
            SortDirection,
            options.orderByCustomerNumber,
            "customer-number sort direction"
          )
  });
}

export function invoiceListQuery(options: InvoiceListOptions = {}): ExtraQuery {
  return compactQuery({
    ...pageQuery(options),
    status:
      options.status === undefined
        ? undefined
        : numericEnumCode(InvoiceStatus, options.status, "invoice status"),
    partiallyPaid: options.partiallyPaid,
    orderByDebit: options.orderByDebit,
    orderByDueTime: options.orderByDueTime,
    showAll: options.showAll,
    canceled: options.canceled,
    invoiceNumber: options.invoiceNumber,
    delinquent: options.delinquent,
    notdelinquent: options.notDelinquent,
    tags: references(options.tags),
    costCentre: optionalReference(options.costCentre),
    createBefore: dateFilter(options.createBefore),
    createAfter: dateFilter(options.createAfter),
    updateBefore: dateFilter(options.updateBefore),
    updateAfter: dateFilter(options.updateAfter),
    contact: optionalReference(options.contact),
    orderByDueDate: options.orderByDueDate,
    customerIntenalNote: options.customerInternalNote,
    day: dateFilter(options.day),
    startDate: dateFilter(options.startDate),
    endDate: dateFilter(options.endDate),
    onlyDunned: options.onlyDunned,
    showWkr: options.showRecurring ? "all" : undefined,
    showMa: options.showReminders ? "all" : undefined,
    origin: optionalReference(options.origin),
    invoiceType:
      options.invoiceType === undefined
        ? undefined
        : stringEnumCode(InvoiceType, options.invoiceType, "invoice type"),
    paymentMethod: optionalReference(options.paymentMethod),
    headerStartsWith: options.headerStartsWith,
    headerOrNumber: options.headerOrNumber,
    orderByInvoiceNumber:
      options.orderByInvoiceNumber === undefined
        ? undefined
        : stringEnumCode(
            SortDirection,
            options.orderByInvoiceNumber,
            "invoice-number sort direction"
          ),
    invoiceNumberGreater: options.invoiceNumberGreater,
    invoiceNumberSmaller: options.invoiceNumberSmaller,
    sendType:
      options.sendType === undefined
        ? undefined
        : stringEnumCode(SendType, options.sendType, "send type"),
    fulltextSearch: options.fulltextSearch
  });
}

export function orderListQuery(options: OrderListOptions = {}): ExtraQuery {
  return compactQuery({
    ...pageQuery(options),
    orderNumber: options.orderNumber,
    tags: references(options.tags),
    status:
      options.status === undefined
        ? undefined
        : numericEnumCode(OrderStatus, options.status, "order status"),
    createBefore: dateFilter(options.createBefore),
    createAfter: dateFilter(options.createAfter),
    updateBefore: dateFilter(options.updateBefore),
    updateAfter: dateFilter(options.updateAfter),
    contact: optionalReference(options.contact),
    startDate: dateFilter(options.startDate),
    endDate: dateFilter(options.endDate),
    orderType:
      options.orderType === undefined
        ? undefined
        : stringEnumCode(OrderType, options.orderType, "order type"),
    orderByOrderNumber:
      options.orderByOrderNumber === undefined
        ? undefined
        : stringEnumCode(SortDirection, options.orderByOrderNumber, "order-number sort direction"),
    orderNumberGreater: options.orderNumberGreater,
    orderNumberNumberSmaller: options.orderNumberSmaller,
    startAmount:
      options.startAmount === undefined
        ? undefined
        : validateFiniteNumber(options.startAmount, "order start amount"),
    endAmount:
      options.endAmount === undefined
        ? undefined
        : validateFiniteNumber(options.endAmount, "order end amount")
  });
}

export function creditNoteListQuery(options: CreditNoteListOptions = {}): ExtraQuery {
  return compactQuery({
    ...pageQuery(options),
    creditNoteNumber: options.creditNoteNumber,
    onlyEnshrined: options.onlyEnshrined,
    tags: references(options.tags),
    status:
      options.status === undefined
        ? undefined
        : numericEnumCode(CreditNoteStatus, options.status, "credit-note status"),
    delinquent: options.delinquent,
    notdelinquent: options.notDelinquent,
    customerIntenalNote: options.customerInternalNote,
    origin: optionalReference(options.origin),
    costCentre: optionalReference(options.costCentre),
    contact: optionalReference(options.contact),
    startDate: dateFilter(options.startDate),
    endDate: dateFilter(options.endDate),
    day: dateFilter(options.day),
    paymentMethod: optionalReference(options.paymentMethod),
    headerOrNumber: options.headerOrNumber,
    headerStartsWith: options.headerStartsWith,
    orderByCreditNoteNumber:
      options.orderByCreditNoteNumber === undefined
        ? undefined
        : stringEnumCode(
            SortDirection,
            options.orderByCreditNoteNumber,
            "credit-note-number sort direction"
          ),
    partiallyPaid: options.partiallyPaid,
    orderByDueDate: options.orderByDueDate,
    orderByDueTime: options.orderByDueTime,
    orderByDebit: options.orderByDebit,
    creditNoteNumberGreater: options.creditNoteNumberGreater,
    creditNoteNumberNumberSmaller: options.creditNoteNumberSmaller,
    startAmount:
      options.startAmount === undefined
        ? undefined
        : validateFiniteNumber(options.startAmount, "credit-note start amount"),
    endAmount:
      options.endAmount === undefined
        ? undefined
        : validateFiniteNumber(options.endAmount, "credit-note end amount")
  });
}

export function voucherListQuery(options: VoucherListOptions = {}): ExtraQuery {
  return compactQuery({
    ...pageQuery(options),
    accountingType: optionalReference(options.accountingType),
    withoutCatering: options.withoutCatering,
    year:
      options.year === undefined
        ? undefined
        : validateInteger(options.year, "voucher year", { minimum: 1 }),
    month:
      options.month === undefined
        ? undefined
        : validateInteger(options.month, "voucher month", { minimum: 1, maximum: 12 }),
    descriptionLike: options.descriptionLike,
    creditDebit:
      options.creditDebit === undefined
        ? undefined
        : stringEnumCode(VoucherDirection, options.creditDebit, "voucher direction"),
    supplierName: options.supplierName,
    commentLike: options.commentLike,
    searchCommentOrDescription: options.searchCommentOrDescription,
    contact: optionalReference(options.contact),
    createBefore: dateFilter(options.createBefore),
    createAfter: dateFilter(options.createAfter),
    updateBefore: dateFilter(options.updateBefore),
    updateAfter: dateFilter(options.updateAfter),
    startDate: dateFilter(options.startDate),
    endDate: dateFilter(options.endDate),
    object: optionalReference(options.object),
    startPayDate: dateFilter(options.startPayDate),
    endPayDate: dateFilter(options.endPayDate),
    status:
      options.status === undefined
        ? undefined
        : numericEnumCode(VoucherStatus, options.status, "voucher status"),
    orderByDebit: options.orderByDebit,
    costCentre: optionalReference(options.costCentre),
    voucherType:
      options.voucherType === undefined
        ? undefined
        : stringEnumCode(VoucherType, options.voucherType, "voucher type"),
    origin: optionalReference(options.origin),
    contactOrObject: optionalReference(options.contactOrObject),
    orderByVoucherNumber:
      options.orderByVoucherNumber === undefined
        ? undefined
        : stringEnumCode(
            SortDirection,
            options.orderByVoucherNumber,
            "voucher-number sort direction"
          ),
    delinquent: options.delinquent,
    hasDocument: options.hasDocument,
    noRv: options.noRecurring,
    tags: references(options.tags),
    startAmount:
      options.startAmount === undefined
        ? undefined
        : validateFiniteNumber(options.startAmount, "voucher start amount"),
    endAmount:
      options.endAmount === undefined
        ? undefined
        : validateFiniteNumber(options.endAmount, "voucher end amount"),
    fulltextSearch: options.fulltextSearch,
    fulltextSearchObjects: options.fulltextSearchObjects?.join(",")
  });
}

function pageQuery(options: PageOptions): Record<string, QueryValue | undefined> {
  return {
    limit: options.limit === undefined ? undefined : validatePaginationLimit(options.limit),
    offset: options.offset === undefined ? undefined : validatePaginationOffset(options.offset),
    countAll: options.countAll,
    embed: options.embed
  };
}

function references(
  values: readonly SevdeskReference<SevdeskObjectName>[] | undefined
): readonly QueryValue[] | undefined {
  return values?.map((value) => wireReference(value));
}

function optionalReference(
  value: SevdeskReference<SevdeskObjectName> | undefined
): QueryValue | undefined {
  return value ? wireReference(value) : undefined;
}
