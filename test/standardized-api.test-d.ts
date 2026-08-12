import {
  BookingType,
  CommunicationWayKeyName,
  CommunicationWayType,
  ContactCategory,
  ContactDepth,
  ContactStatus,
  CreditNoteStatus,
  InvoiceFromOrderPartialType,
  InvoiceStatus,
  InvoiceType,
  LegacyTaxType,
  OrderStatus,
  OrderType,
  ReminderEligibilityFailureReason,
  SendType,
  SortDirection,
  TaxRule,
  VoucherDirection,
  VoucherStatus,
  VoucherType,
  type BookingInput,
  type CommunicationWayCreateInput,
  type CompleteContactInput,
  type ContactCreateInput,
  type ContactListOptions,
  type CreditNoteCreateInput,
  type CreditNoteListOptions,
  type InvoiceCreateInput,
  type CreateAndFinalizeInvoiceInput,
  type InvoiceFromOrderInput,
  type InvoiceEmailDelivery,
  type InvoiceListOptions,
  type MarkSentDelivery,
  type OrderCreateInput,
  type OrderListOptions,
  type ReminderCreateWorkflowOperationId,
  type ReminderEligibilityFailureReasonValue,
  type SevdeskClient,
  type StandardEmailDelivery,
  type TaxConfiguration,
  type VoucherBookingInput,
  type VoucherCreateInput,
  type VoucherListOptions
} from "../src/index.js";
import {
  BookingType as FocusedBookingType,
  CommunicationWayKeyName as FocusedCommunicationWayKeyName,
  CommunicationWayType as FocusedCommunicationWayType,
  ContactCategory as FocusedContactCategory,
  ContactDepth as FocusedContactDepth,
  ContactStatus as FocusedContactStatus,
  CreditNoteBookingCategory as FocusedCreditNoteBookingCategory,
  CreditNoteStatus as FocusedCreditNoteStatus,
  InvoiceFromOrderPartialType as FocusedInvoiceFromOrderPartialType,
  InvoiceStatus as FocusedInvoiceStatus,
  InvoiceType as FocusedInvoiceType,
  LegacyTaxType as FocusedLegacyTaxType,
  OrderStatus as FocusedOrderStatus,
  OrderType as FocusedOrderType,
  RecurringInterval as FocusedRecurringInterval,
  ReminderEligibilityFailureReason as FocusedReminderEligibilityFailureReason,
  SendType as FocusedSendType,
  SortDirection as FocusedSortDirection,
  TaxRule as FocusedTaxRule,
  VoucherDirection as FocusedVoucherDirection,
  VoucherStatus as FocusedVoucherStatus,
  VoucherType as FocusedVoucherType,
  type InvoiceStatusInput as FocusedInvoiceStatusInput,
  type TaxRuleInput as FocusedTaxRuleInput
} from "../src/enums-entry.js";

declare const client: SevdeskClient;
declare const completeContactInput: CompleteContactInput;
declare const invoiceWorkflowInput: CreateAndFinalizeInvoiceInput;
declare const bookingInput: BookingInput;
declare const invoiceEmailDelivery: InvoiceEmailDelivery;
declare const standardEmailDelivery: StandardEmailDelivery;
declare const voucherBookingInput: VoucherBookingInput;
declare const attachment: Uint8Array;

async function verifyStandardReminderNames(): Promise<void> {
  const lastReminder = await client.reminders.getLastForInvoice(42);
  const eligibility = await client.reminders.checkEligibility(42);
  const eligibilityName: "reminders.checkEligibility" = eligibility.workflow;
  const eligibilityInvoiceId: string = eligibility.data.invoice.id;
  if (eligibility.data.eligible) {
    const outstanding: number = eligibility.data.outstanding;
    void outstanding;
  } else {
    const reason: ReminderEligibilityFailureReasonValue = eligibility.data.reason;
    void reason;
  }
  const created = await client.reminders.create({
    invoiceId: 42,
    delivery: {
      channel: "mark-sent",
      sendType: SendType.EMAIL
    }
  });
  const createName: "reminders.create" = created.workflow;
  const deliveredStatus = created.data.delivery.status;
  const createdEligibilityInvoiceId: string = created.data.eligibility.invoice.id;
  void eligibilityName;
  void eligibilityInvoiceId;
  void lastReminder.data;
  void createName;
  void deliveredStatus;
  void createdEligibilityInvoiceId;
}

async function verifyCanonicalResourceMethods(): Promise<void> {
  const createdContact = await client.contacts.create(completeContactInput);
  const contactWorkflow: "contacts.create" = createdContact.workflow;
  const finalizedInvoice = await client.invoices.createAndFinalize(invoiceWorkflowInput);
  const invoiceWorkflow: "invoices.createAndFinalize" = finalizedInvoice.workflow;
  await client.invoices.book(42, bookingInput);
  await client.invoices.sendByEmail(42, invoiceEmailDelivery);
  await client.invoices.markAsSent(42, { channel: "mark-sent", sendType: SendType.EMAIL });
  await client.orders.sendByEmail(42, standardEmailDelivery);
  await client.orders.markAsSent(42, { channel: "mark-sent", sendType: SendType.EMAIL });
  await client.vouchers.uploadAttachment(attachment);
  await client.vouchers.book(42, voucherBookingInput);
  await client.creditNotes.markAsSent(42, {
    channel: "mark-sent",
    sendType: SendType.EMAIL
  });
  void contactWorkflow;
  void invoiceWorkflow;
}

const focusedInvoiceStatus: FocusedInvoiceStatusInput = FocusedInvoiceStatus.OPEN;
const focusedTaxRule: FocusedTaxRuleInput = FocusedTaxRule.STANDARD_TAXABLE;
const eligibilityReason: ReminderEligibilityFailureReasonValue =
  ReminderEligibilityFailureReason.NOT_OVERDUE;
const focusedEligibilityReason: ReminderEligibilityFailureReasonValue =
  FocusedReminderEligibilityFailureReason.NO_OUTSTANDING_BALANCE;
const invoiceStatus: InvoiceListOptions["status"] = InvoiceStatus.OPEN;
const invoiceType: InvoiceListOptions["invoiceType"] = InvoiceType.NORMAL;
const invoiceSendType: InvoiceListOptions["sendType"] = SendType.EMAIL;
const invoiceOrder: InvoiceListOptions["orderByInvoiceNumber"] = SortDirection.ASCENDING;
const orderStatus: OrderListOptions["status"] = OrderStatus.ACCEPTED;
const orderType: OrderListOptions["orderType"] = OrderType.CONFIRMATION;
const orderOrder: OrderListOptions["orderByOrderNumber"] = SortDirection.DESCENDING;
const voucherStatus: VoucherListOptions["status"] = VoucherStatus.OPEN;
const voucherType: VoucherListOptions["voucherType"] = VoucherType.NORMAL;
const voucherDirection: VoucherListOptions["creditDebit"] = VoucherDirection.EXPENSE;
const voucherOrder: VoucherListOptions["orderByVoucherNumber"] = SortDirection.ASCENDING;
const creditNoteStatus: CreditNoteListOptions["status"] = CreditNoteStatus.OPEN;
const creditNoteOrder: CreditNoteListOptions["orderByCreditNoteNumber"] = SortDirection.DESCENDING;
const contactDepth: ContactListOptions["depth"] = ContactDepth.ORGANISATIONS_AND_PEOPLE;
const contactDepthName: ContactListOptions["depth"] = "organisations_only";
const invoiceFromOrderType: InvoiceFromOrderInput["partialType"] =
  InvoiceFromOrderPartialType.FINAL;
const invoiceFromOrderTypeName: InvoiceFromOrderInput["partialType"] = "final";
const focusedInvoiceFromOrderType: InvoiceFromOrderInput["partialType"] =
  FocusedInvoiceFromOrderPartialType.PARTIAL;
// @ts-expect-error RE means FINAL for this endpoint; use the endpoint-specific enum/key.
const invalidInvoiceFromOrderType: InvoiceFromOrderInput["partialType"] = "normal";
const bookingType: BookingInput["type"] = BookingType.FULL_PAYMENT;
const deliverySendType: MarkSentDelivery["sendType"] = SendType.POSTAL;

const contact = {
  kind: "organisation",
  name: "Enum Example GmbH",
  category: ContactCategory.CUSTOMER,
  status: ContactStatus.ACTIVE
} satisfies ContactCreateInput;

const communicationWay = {
  type: CommunicationWayType.EMAIL,
  value: "accounting@example.test",
  key: CommunicationWayKeyName.INVOICE_ADDRESS
} satisfies CommunicationWayCreateInput;

const modernTax = {
  bookkeepingSystem: "2.0",
  taxRule: TaxRule.STANDARD_TAXABLE
} satisfies TaxConfiguration;

const legacyTax = {
  bookkeepingSystem: "1.0",
  taxType: LegacyTaxType.DEFAULT
} satisfies TaxConfiguration;

const invoiceCreateStatus: InvoiceCreateInput["status"] = FocusedInvoiceStatus.DRAFT;
const invoiceCreateType: InvoiceCreateInput["invoiceType"] = FocusedInvoiceType.NORMAL;
const orderCreateStatus: OrderCreateInput["status"] = FocusedOrderStatus.DRAFT;
const orderCreateType: OrderCreateInput["orderType"] = FocusedOrderType.ESTIMATE;
const voucherCreateStatus: VoucherCreateInput["status"] = FocusedVoucherStatus.DRAFT;
const voucherCreateType: VoucherCreateInput["voucherType"] = FocusedVoucherType.RECURRING;
const voucherCreateDirection: VoucherCreateInput["creditDebit"] = FocusedVoucherDirection.REVENUE;
const voucherInterval: VoucherCreateInput["recurringInterval"] = FocusedRecurringInterval.MONTHLY;
const creditNoteCreateStatus: CreditNoteCreateInput["status"] = FocusedCreditNoteStatus.DRAFT;
const creditNoteBookingCategory: CreditNoteCreateInput["bookingCategory"] =
  FocusedCreditNoteBookingCategory.PROVISION;
const focusedBooking: BookingInput["type"] = FocusedBookingType.PARTIAL;
const focusedSendType: MarkSentDelivery["sendType"] = FocusedSendType.EMAIL;
const focusedCommunicationType: CommunicationWayCreateInput["type"] =
  FocusedCommunicationWayType.PHONE;
const focusedCommunicationKey: CommunicationWayCreateInput["key"] =
  FocusedCommunicationWayKeyName.WORK;
const focusedContactCategory: ContactCreateInput["category"] = FocusedContactCategory.SUPPLIER;
const focusedContactStatus: ContactCreateInput["status"] = FocusedContactStatus.LEAD;
const focusedContactDepth: ContactListOptions["depth"] = FocusedContactDepth.ORGANISATIONS_ONLY;
const focusedLegacyTax: Extract<
  TaxConfiguration,
  { readonly bookkeepingSystem: "1.0" }
>["taxType"] = FocusedLegacyTaxType.EU;
const focusedSort: InvoiceListOptions["orderByInvoiceNumber"] = FocusedSortDirection.ASCENDING;
type CanonicalReminderOperation = ReminderCreateWorkflowOperationId<{
  readonly invoiceId: 42;
  readonly delivery: { readonly channel: "mark-sent" };
}>;
const reminderOperation: CanonicalReminderOperation = "invoiceSendBy";

void verifyStandardReminderNames;
void verifyCanonicalResourceMethods;
void [
  focusedInvoiceStatus,
  focusedTaxRule,
  eligibilityReason,
  focusedEligibilityReason,
  invoiceStatus,
  invoiceType,
  invoiceSendType,
  invoiceOrder,
  orderStatus,
  orderType,
  orderOrder,
  voucherStatus,
  voucherType,
  voucherDirection,
  voucherOrder,
  creditNoteStatus,
  creditNoteOrder,
  contactDepth,
  contactDepthName,
  invoiceFromOrderType,
  invoiceFromOrderTypeName,
  focusedInvoiceFromOrderType,
  invalidInvoiceFromOrderType,
  bookingType,
  deliverySendType,
  contact,
  communicationWay,
  modernTax,
  legacyTax,
  invoiceCreateStatus,
  invoiceCreateType,
  orderCreateStatus,
  orderCreateType,
  voucherCreateStatus,
  voucherCreateType,
  voucherCreateDirection,
  voucherInterval,
  creditNoteCreateStatus,
  creditNoteBookingCategory,
  focusedBooking,
  focusedSendType,
  focusedCommunicationType,
  focusedCommunicationKey,
  focusedContactCategory,
  focusedContactStatus,
  focusedContactDepth,
  focusedLegacyTax,
  focusedSort,
  reminderOperation
];
