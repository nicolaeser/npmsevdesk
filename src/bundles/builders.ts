import {
  BookingType,
  ContactCategory,
  ContactStatus,
  CreditNoteBookingCategory,
  CreditNoteStatus,
  InvoiceStatus,
  InvoiceType,
  LegacyTaxType,
  OrderStatus,
  OrderType,
  RecurringInterval,
  SendType,
  TaxRule,
  VoucherDirection,
  VoucherStatus,
  VoucherType
} from "../enums/domain-enums.js";
import type { BookingTypeInput, ResolvedEnumValue, SendTypeInput } from "../enums/domain-enums.js";
import type { SevdeskIdInput, SevdeskObjectName, SevdeskReference } from "../types/references.js";
import {
  assertCuratedTaxInput,
  assertTaxDocument,
  isResolvedTaxPlan,
  isSmallBusinessTax,
  resolveTaxRuleCode,
  taxRateForPosition
} from "../taxes/validation.js";
import type { ResolvedTaxPlan } from "../taxes/types.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import {
  validateFinitePayload,
  validateFiniteNumber,
  validateSevdeskDateString,
  validateUnixTimestamp
} from "../utils/validation.js";
import {
  enumCode,
  forwardCompatibleBody,
  numericEnumCode,
  numericId,
  omitServerManagedCreateFields,
  stringEnumCode,
  wireReference,
  wireStringReference
} from "./internal.js";
import type { ForwardCompatibleBody } from "./internal.js";
import type {
  ContactCreatePayload,
  CreditNoteFactoryPayload,
  InvoiceBookingPayload,
  InvoiceEmailDeliveryPayload,
  InvoiceFactoryPayload,
  MarkSentDeliveryPayload,
  OrderFactoryPayload,
  StandardEmailDeliveryPayload,
  VoucherBookingPayload,
  VoucherFactoryPayload
} from "./payload-types.js";
import type {
  BookingInput,
  CompleteContactInput,
  CreditNoteFactoryInput,
  DiscountInput,
  InvoiceEmailDelivery,
  InvoiceDelivery,
  InvoiceFactoryInput,
  MarkSentDelivery,
  NonEmptyReadonlyArray,
  OrderFactoryInput,
  StandardEmailDelivery,
  StandardDelivery,
  TaxConfiguration,
  VoucherBookingInput,
  VoucherFactoryInput,
  VoucherPositionInput
} from "./types.js";

const invoiceReadOnlyFields = [
  "dunningLevel",
  "accountIntervall",
  "accountNextInvoice",
  "sumNet",
  "sumTax",
  "sumGross",
  "sumDiscounts",
  "sumNetForeignCurrency",
  "sumTaxForeignCurrency",
  "sumGrossForeignCurrency",
  "sumDiscountsForeignCurrency",
  "sumNetAccounting",
  "sumTaxAccounting",
  "sumGrossAccounting",
  "paidAmount",
  "enshrined"
] as const;
const invoicePositionReadOnlyFields = [
  "sumDiscount",
  "sumNetAccounting",
  "sumTaxAccounting",
  "sumGrossAccounting",
  "priceNet"
] as const;
const orderPositionReadOnlyFields = ["priceNet", "sumDiscount"] as const;
const voucherReadOnlyFields = [
  "sumNet",
  "sumTax",
  "sumGross",
  "sumNetAccounting",
  "sumTaxAccounting",
  "sumGrossAccounting",
  "sumDiscounts",
  "sumDiscountsForeignCurrency",
  "paidAmount",
  "recurringInterval",
  "recurringStartDate",
  "recurringNextVoucher",
  "recurringLastVoucher",
  "recurringEndDate",
  "enshrined"
] as const;
const voucherPositionReadOnlyFields = [
  "estimatedAccountingType",
  "sumTax",
  "sumNetAccounting",
  "sumTaxAccounting",
  "sumGrossAccounting"
] as const;
const creditNoteReadOnlyFields = [
  "sumNet",
  "sumTax",
  "sumGross",
  "sumDiscounts",
  "sumNetForeignCurrency",
  "sumTaxForeignCurrency",
  "sumGrossForeignCurrency",
  "sumDiscountsForeignCurrency"
] as const;
const creditNotePositionReadOnlyFields = ["priceNet", "sumDiscount"] as const;

export function assertNonEmpty<TValue>(
  values: readonly TValue[],
  label = "values"
): asserts values is NonEmptyReadonlyArray<TValue> {
  if (values.length === 0) {
    throw new SevdeskConfigurationError(`${label} must contain at least one item.`);
  }
}

export function nonEmpty<TValue>(
  values: readonly TValue[],
  label?: string
): NonEmptyReadonlyArray<TValue> {
  assertNonEmpty(values, label);
  return values;
}

export function buildContactPayload(
  input: CompleteContactInput["contact"],
  customerNumber?: string
): ForwardCompatibleBody<ContactCreatePayload> {
  validateFinitePayload(input, "contact");
  validateOptionalDateFields(input, ["birthday"], "contact");
  const { category, status, taxSet, taxType, customerNumber: requestedCustomerNumber } = input;
  const semanticContact =
    input.kind === "organisation" ? buildOrganisationContact(input) : buildPersonContact(input);
  const contact = omitServerManagedCreateFields(semanticContact);
  const categoryReference =
    typeof category === "object" && "objectName" in category
      ? wireReference(category)
      : {
          id: numericEnumCode(ContactCategory, category, "contact category"),
          objectName: "Category" as const
        };
  const resolvedCustomerNumber =
    customerNumber ?? (requestedCustomerNumber === "next" ? undefined : requestedCustomerNumber);
  const resolvedTaxType =
    taxType === undefined || taxType === null
      ? taxType
      : stringEnumCode(LegacyTaxType, taxType, "contact tax type");
  if (resolvedTaxType === LegacyTaxType.CUSTOM && taxSet == null) {
    throw new SevdeskConfigurationError("Contact custom tax type requires a taxSet reference.");
  }
  if (
    resolvedTaxType !== undefined &&
    resolvedTaxType !== null &&
    resolvedTaxType !== LegacyTaxType.CUSTOM &&
    taxSet !== undefined &&
    taxSet !== null
  ) {
    throw new SevdeskConfigurationError("Contact taxSet can only be used with custom tax type.");
  }
  return forwardCompatibleBody<ContactCreatePayload>({
    ...contact,
    status:
      status === undefined
        ? ContactStatus.LEAD
        : numericEnumCode(ContactStatus, status, "contact status"),
    category: categoryReference,
    ...(taxSet === undefined ? {} : { taxSet: taxSet === null ? null : wireReference(taxSet) }),
    ...(taxType === undefined ? {} : { taxType: resolvedTaxType }),
    ...(resolvedCustomerNumber ? { customerNumber: resolvedCustomerNumber } : {})
  });
}

function buildOrganisationContact(
  input: Extract<CompleteContactInput["contact"], { readonly kind: "organisation" }>
) {
  const {
    kind: _kind,
    category: _category,
    status: _status,
    taxSet: _taxSet,
    taxType: _taxType,
    customerNumber: _customerNumber,
    name,
    additionalName,
    parentOrganisation,
    ...contact
  } = input;
  return {
    ...contact,
    name,
    ...(additionalName === undefined ? {} : { name2: additionalName }),
    ...(parentOrganisation === undefined
      ? {}
      : {
          parent: parentOrganisation === null ? null : wireReference(parentOrganisation)
        })
  };
}

function buildPersonContact(
  input: Extract<CompleteContactInput["contact"], { readonly kind: "person" }>
) {
  const {
    kind: _kind,
    category: _category,
    status: _status,
    taxSet: _taxSet,
    taxType: _taxType,
    customerNumber: _customerNumber,
    firstName,
    lastName,
    middleName,
    title,
    organisation,
    ...contact
  } = input;
  return {
    ...contact,
    surename: firstName,
    familyname: lastName,
    ...(middleName === undefined ? {} : { name2: middleName }),
    ...(title === undefined ? {} : { titel: title }),
    ...(organisation === undefined
      ? {}
      : {
          parent: organisation === null ? null : wireReference(organisation)
        })
  };
}

export function buildInvoicePayload<const TInput extends InvoiceFactoryInput>(
  input: TInput
): ForwardCompatibleBody<InvoiceFactoryPayload> {
  validateFinitePayload(input, "invoice factory input");
  validateRequiredAndOptionalDateFields(
    input.invoice,
    "invoiceDate",
    ["deliveryDate", "payDate", "sendDate"],
    "invoice"
  );
  if (input.invoice.deliveryDateUntil !== undefined && input.invoice.deliveryDateUntil !== null) {
    validateUnixTimestamp(input.invoice.deliveryDateUntil, "invoice deliveryDateUntil");
  }
  const {
    tax,
    status,
    invoiceType,
    contact,
    contactPerson,
    addressCountry,
    deliveryAddressCountry,
    paymentMethod,
    origin,
    sendType,
    accountIntervall,
    ...rawInvoice
  } = input.invoice;
  assertCuratedTaxInput(tax);
  const invoice = omitServerManagedCreateFields(rawInvoice, invoiceReadOnlyFields);
  const normalizedInvoiceType = enumCode(
    InvoiceType,
    invoiceType ?? InvoiceType.NORMAL,
    "invoice type"
  );
  const taxFields = buildTaxFields(tax, "string");
  validateInvoiceTaxRule(taxFields.taxRule?.id, normalizedInvoiceType, invoice);
  const positionTaxRates = input.positions.map((position, index) =>
    taxRateForPosition(tax as unknown as Readonly<Record<string, unknown>>, position.taxRate, index)
  );
  const resolvedSmallSettlement =
    invoice.smallSettlement ??
    (isSmallBusinessTax(tax as unknown as Readonly<Record<string, unknown>>) ? true : undefined);
  const resolvedDeliveryAddressCountry = resolveDeliveryAddressCountry(
    tax,
    deliveryAddressCountry,
    "invoice"
  );
  assertTaxDocument({
    resource: "invoice",
    direction: "revenue",
    tax: tax as unknown as Readonly<Record<string, unknown>>,
    positionTaxRates,
    ...(typeof resolvedSmallSettlement === "boolean"
      ? { smallSettlement: resolvedSmallSettlement }
      : {})
  });
  const resolvedStatus =
    status === undefined
      ? InvoiceStatus.DRAFT
      : numericEnumCode(InvoiceStatus, status, "invoice status");
  if (resolvedStatus !== InvoiceStatus.DRAFT) {
    throw new SevdeskConfigurationError(
      "Factory/saveInvoice can only create invoices with DRAFT status; use a delivery endpoint to transition the status."
    );
  }
  return forwardCompatibleBody<InvoiceFactoryPayload>({
    invoice: {
      ...invoice,
      ...(resolvedSmallSettlement === undefined
        ? {}
        : { smallSettlement: resolvedSmallSettlement }),
      ...taxFields,
      objectName: "Invoice" as const,
      mapAll: true,
      status: String(resolvedStatus) as `${typeof InvoiceStatus.DRAFT}`,
      invoiceType: String(normalizedInvoiceType) as `${typeof normalizedInvoiceType}`,
      contact: wireReference(contact),
      contactPerson: wireReference(contactPerson),
      ...(addressCountry === undefined ? {} : { addressCountry: wireReference(addressCountry) }),
      ...(resolvedDeliveryAddressCountry === undefined
        ? {}
        : { deliveryAddressCountry: wireReference(resolvedDeliveryAddressCountry) }),
      ...(paymentMethod === undefined ? {} : { paymentMethod: wireReference(paymentMethod) }),
      ...(origin === undefined
        ? {}
        : { origin: origin === null ? null : wireStringReference(origin) }),
      ...(sendType === undefined
        ? {}
        : {
            sendType:
              sendType === null ? null : stringEnumCode(SendType, sendType, "invoice send type")
          }),
      ...(accountIntervall === undefined
        ? {}
        : {
            accountIntervall:
              accountIntervall === null
                ? null
                : stringEnumCode(RecurringInterval, accountIntervall, "invoice recurring interval")
          })
    },
    invoicePosSave: input.positions.map(({ unity, part, ...position }, index) => {
      const fields = omitServerManagedCreateFields(position, invoicePositionReadOnlyFields);
      return {
        ...fields,
        taxRate: positionTaxRates[index] as number,
        objectName: "InvoicePos" as const,
        mapAll: true,
        unity: wireReference(unity),
        ...(part ? { part: wireReference(part) } : {})
      };
    }),
    ...(input.filename ? { filename: input.filename } : {}),
    invoicePosDelete: null,
    discountSave: input.discounts?.length ? input.discounts.map(buildDiscountPayload) : null,
    discountDelete: null,
    takeDefaultAddress: input.takeDefaultAddress ?? true
  });
}

export function buildOrderPayload<const TInput extends OrderFactoryInput>(
  input: TInput
): ForwardCompatibleBody<OrderFactoryPayload> {
  validateFinitePayload(input, "order factory input");
  validateRequiredAndOptionalDateFields(input.order, "orderDate", ["sendDate"], "order");
  const {
    tax,
    status,
    orderType,
    contact,
    contactPerson,
    addressCountry,
    deliveryAddressCountry,
    origin,
    sendType,
    ...rawOrder
  } = input.order;
  assertCuratedTaxInput(tax);
  const order = omitServerManagedCreateFields(rawOrder);
  const resolvedStatus =
    status === undefined ? OrderStatus.DRAFT : numericEnumCode(OrderStatus, status, "order status");
  if (resolvedStatus !== OrderStatus.DRAFT) {
    throw new SevdeskConfigurationError(
      "Factory/saveOrder can only create orders with DRAFT status; use a delivery endpoint to transition the status."
    );
  }
  const normalizedOrderType = enumCode(OrderType, orderType, "order type");
  const positionTaxRates = input.positions.map((position, index) =>
    taxRateForPosition(tax as unknown as Readonly<Record<string, unknown>>, position.taxRate, index)
  );
  const resolvedSmallSettlement =
    order.smallSettlement ??
    (isSmallBusinessTax(tax as unknown as Readonly<Record<string, unknown>>) ? true : undefined);
  const resolvedDeliveryAddressCountry = resolveDeliveryAddressCountry(
    tax,
    deliveryAddressCountry,
    "order"
  );
  assertTaxDocument({
    resource: "order",
    direction: "revenue",
    tax: tax as unknown as Readonly<Record<string, unknown>>,
    positionTaxRates,
    ...(typeof resolvedSmallSettlement === "boolean"
      ? { smallSettlement: resolvedSmallSettlement }
      : {})
  });
  return forwardCompatibleBody<OrderFactoryPayload>({
    order: {
      ...order,
      ...(resolvedSmallSettlement === undefined
        ? {}
        : { smallSettlement: resolvedSmallSettlement }),
      ...buildTaxFields(tax),
      objectName: "Order" as const,
      mapAll: true,
      status: resolvedStatus,
      orderType: String(normalizedOrderType) as `${typeof normalizedOrderType}`,
      contact: wireReference(contact),
      contactPerson: wireReference(contactPerson),
      ...(addressCountry ? { addressCountry: wireReference(addressCountry) } : {}),
      ...(resolvedDeliveryAddressCountry === undefined
        ? {}
        : { deliveryAddressCountry: wireReference(resolvedDeliveryAddressCountry) }),
      ...(origin === undefined ? {} : { origin: origin === null ? null : wireReference(origin) }),
      ...(sendType === undefined
        ? {}
        : {
            sendType:
              sendType === null ? null : stringEnumCode(SendType, sendType, "order send type")
          })
    },
    orderPosSave: input.positions.map(({ unity, part, ...position }, index) => {
      const fields = omitServerManagedCreateFields(position, orderPositionReadOnlyFields);
      return {
        ...fields,
        taxRate: positionTaxRates[index] as number,
        objectName: "OrderPos" as const,
        mapAll: true,
        unity: wireReference(unity),
        ...(part ? { part: wireReference(part) } : {})
      };
    })
  });
}

export function buildVoucherPayload<const TInput extends VoucherFactoryInput>(
  input: TInput
): ForwardCompatibleBody<VoucherFactoryPayload> {
  validateFinitePayload(input, "voucher factory input");
  validateRequiredAndOptionalDateFields(
    input.voucher,
    "voucherDate",
    [
      "payDate",
      "propertyForeignCurrencyDeadline",
      "paymentDeadline",
      "deliveryDate",
      "deliveryDateUntil"
    ],
    "voucher"
  );
  const {
    tax,
    status,
    voucherType,
    creditDebit,
    supplier,
    document,
    costCentre,
    recurringInterval,
    ...rawVoucher
  } = input.voucher;
  assertCuratedTaxInput(tax);
  const voucher = omitServerManagedCreateFields(rawVoucher, voucherReadOnlyFields);
  const taxFields = buildTaxFields(tax);
  const normalizedDirection = stringEnumCode(
    VoucherDirection,
    creditDebit,
    "voucher credit/debit direction"
  );
  const positionTaxRates = input.positions.map((position, index) =>
    taxRateForPosition(tax as unknown as Readonly<Record<string, unknown>>, position.taxRate, index)
  );
  assertTaxDocument({
    resource: "voucher",
    direction: normalizedDirection === VoucherDirection.EXPENSE ? "expense" : "revenue",
    tax: tax as unknown as Readonly<Record<string, unknown>>,
    positionTaxRates,
    voucherAmountBases: input.positions.map((position) => (position.net ? "net" : "gross"))
  });
  const resolvedStatus =
    status === undefined
      ? VoucherStatus.DRAFT
      : numericEnumCode(VoucherStatus, status, "voucher status");
  if (![VoucherStatus.DRAFT, VoucherStatus.OPEN].includes(resolvedStatus as 50 | 100)) {
    throw new SevdeskConfigurationError("Factory/saveVoucher accepts only DRAFT or OPEN status.");
  }
  return forwardCompatibleBody<VoucherFactoryPayload>({
    voucher: {
      ...voucher,
      ...taxFields,
      objectName: "Voucher" as const,
      mapAll: true,
      status: resolvedStatus as typeof VoucherStatus.DRAFT | typeof VoucherStatus.OPEN,
      voucherType: stringEnumCode(VoucherType, voucherType ?? VoucherType.NORMAL, "voucher type"),
      creditDebit: normalizedDirection,
      ...(supplier === undefined
        ? {}
        : { supplier: supplier === null ? null : wireReference(supplier) }),
      ...(document === undefined
        ? {}
        : { document: document === null ? null : wireReference(document) }),
      ...(costCentre === undefined ? {} : { costCentre: wireReference(costCentre) }),
      ...(recurringInterval === undefined
        ? {}
        : {
            recurringInterval:
              recurringInterval === null
                ? null
                : stringEnumCode(RecurringInterval, recurringInterval, "voucher recurring interval")
          })
    },
    voucherPosSave: input.positions.map((position, index) => {
      if (tax.bookkeepingSystem === "2.0" && position.accountDatev === undefined) {
        throw new SevdeskConfigurationError(
          "Voucher positions require accountDatev in bookkeeping system 2.0."
        );
      }
      if (tax.bookkeepingSystem === "1.0" && position.accountingType === undefined) {
        throw new SevdeskConfigurationError(
          "Voucher positions require accountingType in bookkeeping system 1.0."
        );
      }
      return buildVoucherPositionPayload({
        ...position,
        taxRate: positionTaxRates[index] as number
      } as VoucherPositionInput);
    }),
    voucherPosDelete: null,
    ...(input.filename ? { filename: input.filename } : {})
  });
}

function buildVoucherPositionPayload(position: VoucherPositionInput) {
  if (position.accountDatev !== undefined) {
    if (position.net) {
      const {
        accountDatev,
        accountingType: _accountingType,
        net: _net,
        sumNet,
        sumGross: _sumGross,
        ...positionFields
      } = position;
      const fields = omitServerManagedCreateFields(positionFields, voucherPositionReadOnlyFields);
      return {
        ...fields,
        objectName: "VoucherPos" as const,
        mapAll: true,
        net: true as const,
        sumNet,
        accountDatev: wireReference(accountDatev)
      };
    }
    const {
      accountDatev,
      accountingType: _accountingType,
      net: _net,
      sumGross,
      sumNet: _sumNet,
      ...positionFields
    } = position;
    const fields = omitServerManagedCreateFields(positionFields, voucherPositionReadOnlyFields);
    return {
      ...fields,
      objectName: "VoucherPos" as const,
      mapAll: true,
      net: false as const,
      sumGross,
      accountDatev: wireReference(accountDatev)
    };
  }
  if (position.net) {
    const {
      accountingType,
      accountDatev: _accountDatev,
      net: _net,
      sumNet,
      sumGross: _sumGross,
      ...positionFields
    } = position;
    const fields = omitServerManagedCreateFields(positionFields, voucherPositionReadOnlyFields);
    return {
      ...fields,
      objectName: "VoucherPos" as const,
      mapAll: true,
      net: true as const,
      sumNet,
      accountingType: wireReference(accountingType)
    };
  }
  const {
    accountingType,
    accountDatev: _accountDatev,
    net: _net,
    sumGross,
    sumNet: _sumNet,
    ...positionFields
  } = position;
  const fields = omitServerManagedCreateFields(positionFields, voucherPositionReadOnlyFields);
  return {
    ...fields,
    objectName: "VoucherPos" as const,
    mapAll: true,
    net: false as const,
    sumGross,
    accountingType: wireReference(accountingType)
  };
}

export function buildCreditNotePayload<const TInput extends CreditNoteFactoryInput>(
  input: TInput
): ForwardCompatibleBody<CreditNoteFactoryPayload> {
  validateFinitePayload(input, "credit-note factory input");
  validateRequiredAndOptionalDateFields(
    input.creditNote,
    "creditNoteDate",
    ["sendDate"],
    "credit-note"
  );
  const {
    tax,
    status,
    contact,
    contactPerson,
    bookingCategory,
    refSrcInvoice,
    refSrcVoucher,
    addressCountry,
    deliveryAddressCountry,
    sendType,
    ...rawCreditNote
  } = input.creditNote;
  assertCuratedTaxInput(tax);
  const creditNote = omitServerManagedCreateFields(rawCreditNote, creditNoteReadOnlyFields);
  const resolvedStatus =
    status === undefined
      ? CreditNoteStatus.DRAFT
      : numericEnumCode(CreditNoteStatus, status, "credit-note status");
  if (resolvedStatus !== CreditNoteStatus.DRAFT) {
    throw new SevdeskConfigurationError(
      "Factory/saveCreditNote can only create credit notes with DRAFT status; use a delivery endpoint to transition the status."
    );
  }
  const positionTaxRates = input.positions.map((position, index) =>
    taxRateForPosition(tax as unknown as Readonly<Record<string, unknown>>, position.taxRate, index)
  );
  const normalizedBookingCategory = stringEnumCode(
    CreditNoteBookingCategory,
    bookingCategory ?? CreditNoteBookingCategory.PROVISION,
    "credit-note booking category"
  );
  validateCreditNoteTaxRule(
    resolveTaxRuleCode(tax as unknown as Readonly<Record<string, unknown>>),
    normalizedBookingCategory,
    refSrcInvoice,
    refSrcVoucher
  );
  const resolvedSmallSettlement =
    creditNote.smallSettlement ??
    (isSmallBusinessTax(tax as unknown as Readonly<Record<string, unknown>>) ? true : undefined);
  const resolvedDeliveryAddressCountry = resolveDeliveryAddressCountry(
    tax,
    deliveryAddressCountry,
    "credit note"
  );
  assertTaxDocument({
    resource: "credit-note",
    direction: "revenue",
    tax: tax as unknown as Readonly<Record<string, unknown>>,
    positionTaxRates,
    ...(typeof resolvedSmallSettlement === "boolean"
      ? { smallSettlement: resolvedSmallSettlement }
      : {})
  });
  return forwardCompatibleBody<CreditNoteFactoryPayload>({
    creditNote: {
      ...creditNote,
      ...(resolvedSmallSettlement === undefined
        ? {}
        : { smallSettlement: resolvedSmallSettlement }),
      ...buildTaxFields(tax),
      objectName: "CreditNote" as const,
      mapAll: true,
      status: String(resolvedStatus) as `${typeof CreditNoteStatus.DRAFT}`,
      bookingCategory: normalizedBookingCategory,
      ...(refSrcInvoice === undefined
        ? {}
        : { refSrcInvoice: numericId(refSrcInvoice, "source invoice") }),
      ...(refSrcVoucher === undefined
        ? {}
        : { refSrcVoucher: numericId(refSrcVoucher, "source voucher") }),
      contact: wireReference(contact),
      contactPerson: wireReference(contactPerson),
      ...(addressCountry === undefined
        ? {}
        : {
            addressCountry: addressCountry === null ? null : wireReference(addressCountry)
          }),
      ...(resolvedDeliveryAddressCountry === undefined
        ? {}
        : { deliveryAddressCountry: wireReference(resolvedDeliveryAddressCountry) }),
      ...(sendType === undefined
        ? {}
        : {
            sendType:
              sendType === null ? null : stringEnumCode(SendType, sendType, "credit-note send type")
          })
    },
    creditNotePosSave: input.positions.map(({ unity, part, ...position }, index) => {
      const fields = omitServerManagedCreateFields(position, creditNotePositionReadOnlyFields);
      return {
        ...fields,
        taxRate: positionTaxRates[index] as number,
        objectName: "CreditNotePos" as const,
        mapAll: true,
        unity: wireReference(unity),
        ...(part ? { part: wireReference(part) } : {})
      };
    }),
    creditNotePosDelete: null,
    discountSave: null,
    discountDelete: null,
    takeDefaultAddress: input.takeDefaultAddress ?? true,
    forCashRegister: input.forCashRegister ?? false
  });
}

type ResolvedBookingType<TInput> = TInput extends BookingTypeInput
  ? ResolvedEnumValue<typeof BookingType, TInput>
  : typeof BookingType.FULL_PAYMENT;

export function buildInvoiceBookingPayload<const TInput extends BookingInput>(
  input: TInput
): ForwardCompatibleBody<InvoiceBookingPayload<ResolvedBookingType<TInput["type"]>>> {
  validateFinitePayload(input, "invoice booking input");
  validateFiniteNumber(input.amount, "invoice booking amount");
  const bookingType = (
    input.type === undefined
      ? BookingType.FULL_PAYMENT
      : stringEnumCode(BookingType, input.type, "booking type")
  ) as ResolvedBookingType<TInput["type"]>;
  return forwardCompatibleBody({
    amount: input.amount,
    date: validateUnixTimestamp(input.date, "invoice booking date"),
    type: bookingType,
    checkAccount: wireReference(input.checkAccount),
    ...(input.checkAccountTransaction
      ? { checkAccountTransaction: wireReference(input.checkAccountTransaction) }
      : {}),
    ...(input.createFeed === undefined ? {} : { createFeed: input.createFeed })
  });
}

export function buildVoucherBookingPayload<const TInput extends VoucherBookingInput>(
  input: TInput
): ForwardCompatibleBody<VoucherBookingPayload<ResolvedBookingType<TInput["type"]>>> {
  validateFinitePayload(input, "voucher booking input");
  validateFiniteNumber(input.amount, "voucher booking amount");
  const bookingType = (
    input.type === undefined
      ? BookingType.FULL_PAYMENT
      : stringEnumCode(BookingType, input.type, "booking type")
  ) as ResolvedBookingType<TInput["type"]>;
  return forwardCompatibleBody({
    amount: input.amount,
    date:
      input.date instanceof Date
        ? input.date.toISOString()
        : validateSevdeskDateString(input.date, "voucher booking date"),
    type: bookingType,
    checkAccount: wireReference(input.checkAccount),
    ...(input.checkAccountTransaction
      ? { checkAccountTransaction: wireReference(input.checkAccountTransaction) }
      : {}),
    ...(input.createFeed === undefined ? {} : { createFeed: input.createFeed })
  });
}

type DeliverySendType<TDelivery extends MarkSentDelivery> = TDelivery extends {
  readonly sendType: infer TInput extends SendTypeInput;
}
  ? ResolvedEnumValue<typeof SendType, TInput>
  : typeof SendType.DOWNLOADED_PDF;

export function buildDeliveryPayload(
  delivery: InvoiceEmailDelivery
): ForwardCompatibleBody<InvoiceEmailDeliveryPayload>;
export function buildDeliveryPayload(
  delivery: StandardEmailDelivery
): ForwardCompatibleBody<StandardEmailDeliveryPayload>;
export function buildDeliveryPayload<const TDelivery extends MarkSentDelivery>(
  delivery: TDelivery
): ForwardCompatibleBody<MarkSentDeliveryPayload<DeliverySendType<TDelivery>>>;
export function buildDeliveryPayload(
  delivery: InvoiceDelivery | StandardDelivery
): ForwardCompatibleBody<
  InvoiceEmailDeliveryPayload | StandardEmailDeliveryPayload | MarkSentDeliveryPayload
>;
export function buildDeliveryPayload(
  delivery: InvoiceDelivery | StandardDelivery
): ForwardCompatibleBody<
  InvoiceEmailDeliveryPayload | StandardEmailDeliveryPayload | MarkSentDeliveryPayload
> {
  validateFinitePayload(delivery, "delivery input");
  if (delivery.channel === "email") {
    return forwardCompatibleBody({
      toEmail: delivery.toEmail,
      subject: delivery.subject,
      text: delivery.text,
      ...(delivery.copy === undefined ? {} : { copy: delivery.copy }),
      ...(delivery.additionalAttachments === undefined
        ? {}
        : {
            additionalAttachments: csv(delivery.additionalAttachments)
          }),
      ...(delivery.ccEmail === undefined
        ? {}
        : {
            ccEmail: csv(delivery.ccEmail)
          }),
      ...(delivery.bccEmail === undefined
        ? {}
        : {
            bccEmail: csv(delivery.bccEmail)
          }),
      ...(delivery.sendXml === undefined ? {} : { sendXml: delivery.sendXml })
    });
  }
  return forwardCompatibleBody({
    sendType: stringEnumCode(SendType, delivery.sendType ?? SendType.DOWNLOADED_PDF, "send type"),
    sendDraft: delivery.sendDraft ?? false
  });
}

function csv(value: string | readonly (string | number)[]): string {
  return typeof value === "string" ? value : value.join(",");
}

export function buildEntityReference<TName extends SevdeskObjectName>(
  objectName: TName,
  id: SevdeskIdInput
): { id: number; objectName: TName } {
  return { id: numericId(id, objectName), objectName };
}

function validateRequiredAndOptionalDateFields(
  value: Readonly<Record<string, unknown>>,
  requiredKey: string,
  optionalKeys: readonly string[],
  label: string
): void {
  validateSevdeskDateString(value[requiredKey], `${label} date`);
  validateOptionalDateFields(value, optionalKeys, label);
}

function validateOptionalDateFields(
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[],
  label: string
): void {
  for (const key of keys) {
    const candidate = value[key];
    if (candidate !== undefined && candidate !== null) {
      validateSevdeskDateString(candidate, `${label} ${key}`);
    }
  }
}

type TaxFields<TTaxSetId extends number | string> =
  | {
      taxRule: { id: number; objectName: "TaxRule" };
      taxType?: never;
      taxSet?: never;
    }
  | {
      taxType: string;
      taxSet?: { id: TTaxSetId; objectName: "TaxSet" };
      taxRule?: never;
    };

type BuilderTaxInput = TaxConfiguration | ResolvedTaxPlan;

function resolveDeliveryAddressCountry(
  tax: BuilderTaxInput,
  explicit: SevdeskReference<"StaticCountry"> | undefined,
  resource: string
): SevdeskReference<"StaticCountry"> | undefined {
  const planned = isResolvedTaxPlan(tax) ? tax.deliveryAddressCountry : undefined;
  if (
    planned !== undefined &&
    explicit !== undefined &&
    numericId(planned.id, `${resource} OSS destination country`) !==
      numericId(explicit.id, `${resource} deliveryAddressCountry`)
  ) {
    throw new SevdeskConfigurationError(
      `${resource} deliveryAddressCountry conflicts with the resolved OSS tax plan.`
    );
  }
  const resolved = planned ?? explicit;
  const taxRule = resolveTaxRuleCode(tax as unknown as Readonly<Record<string, unknown>>);
  if (
    [TaxRule.OSS_GOODS, TaxRule.OSS_ELECTRONIC_SERVICE, TaxRule.OSS_OTHER_SERVICE].includes(
      taxRule as 18 | 19 | 20
    ) &&
    resolved === undefined
  ) {
    throw new SevdeskConfigurationError(
      `${resource} OSS taxation requires deliveryAddressCountry; resolve a semantic OSS preset with client.lookup.country() or provide it explicitly for a manual override.`
    );
  }
  return resolved;
}

function buildTaxFields(tax: BuilderTaxInput, taxSetIdType: "string"): TaxFields<string>;
function buildTaxFields(tax: BuilderTaxInput, taxSetIdType?: "number"): TaxFields<number>;
function buildTaxFields(
  tax: BuilderTaxInput,
  taxSetIdType: "number" | "string" = "number"
): TaxFields<number | string> {
  if (tax.bookkeepingSystem === "2.0") {
    return {
      taxRule: {
        id: numericEnumCode(TaxRule, tax.taxRule, "tax rule"),
        objectName: "TaxRule"
      }
    };
  }
  const taxType = stringEnumCode(LegacyTaxType, tax.taxType, "legacy tax type");
  return {
    taxType,
    ...(tax.taxSet === undefined
      ? {}
      : {
          taxSet: {
            id:
              taxSetIdType === "string"
                ? String(numericId(tax.taxSet.id, "tax set"))
                : numericId(tax.taxSet.id, "tax set"),
            objectName: "TaxSet" as const
          }
        })
  };
}

function buildDiscountPayload(discount: DiscountInput) {
  return {
    ...discount,
    objectName: "Discounts" as const,
    mapAll: true
  };
}

function validateInvoiceTaxRule(
  taxRule: number | undefined,
  invoiceType: string | number,
  invoice: Readonly<Record<string, unknown>>
): void {
  if (taxRule === undefined) return;
  const normalizedInvoiceType = String(invoiceType);
  const advanceOrPartialInvoice = ["AR", "TR"].includes(normalizedInvoiceType);
  const restrictedDocumentType = [
    ...(advanceOrPartialInvoice ? [normalizedInvoiceType] : []),
    "ER"
  ].includes(normalizedInvoiceType);
  if (
    advanceOrPartialInvoice &&
    ![TaxRule.STANDARD_TAXABLE, TaxRule.SMALL_BUSINESS_REVENUE].includes(taxRule as 1 | 11)
  ) {
    throw new SevdeskConfigurationError(
      `Invoice type ${normalizedInvoiceType} supports only tax rule 1 or 11.`
    );
  }
  if (
    restrictedDocumentType &&
    [TaxRule.NON_DOMESTIC_SERVICE, TaxRule.REVERSE_CHARGE_18B].includes(taxRule as 17 | 21)
  ) {
    throw new SevdeskConfigurationError(
      `Tax rule ${taxRule} cannot be used for advance, partial or final invoices.`
    );
  }
  if (
    [TaxRule.OSS_GOODS, TaxRule.OSS_ELECTRONIC_SERVICE, TaxRule.OSS_OTHER_SERVICE].includes(
      taxRule as 18 | 19 | 20
    )
  ) {
    if (restrictedDocumentType || invoice.propertyIsEInvoice === true || invoice.accountDatev) {
      throw new SevdeskConfigurationError(
        `OSS tax rule ${taxRule} is incompatible with this invoice configuration.`
      );
    }
  }
}

function validateCreditNoteTaxRule(
  taxRule: number | undefined,
  bookingCategory: string,
  refSrcInvoice: unknown,
  refSrcVoucher: unknown
): void {
  if (bookingCategory === CreditNoteBookingCategory.UNDERACHIEVEMENT) {
    if ((refSrcInvoice === undefined) === (refSrcVoucher === undefined)) {
      throw new SevdeskConfigurationError(
        "Credit-note bookingCategory UNDERACHIEVEMENT requires exactly one refSrcInvoice or refSrcVoucher."
      );
    }
  } else if (refSrcInvoice !== undefined || refSrcVoucher !== undefined) {
    throw new SevdeskConfigurationError(
      "refSrcInvoice/refSrcVoucher are only valid with bookingCategory UNDERACHIEVEMENT."
    );
  }
  if (taxRule === undefined) return;
  if (
    [
      TaxRule.OSS_GOODS,
      TaxRule.OSS_ELECTRONIC_SERVICE,
      TaxRule.OSS_OTHER_SERVICE,
      TaxRule.REVERSE_CHARGE_18B
    ].includes(taxRule as 18 | 19 | 20 | 21) &&
    bookingCategory !== CreditNoteBookingCategory.UNDERACHIEVEMENT
  ) {
    throw new SevdeskConfigurationError(
      `Credit-note tax rule ${taxRule} requires bookingCategory UNDERACHIEVEMENT.`
    );
  }
}
