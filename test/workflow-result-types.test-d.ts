import type {
  RemindersBundle,
  CreateAndFinalizeInvoiceWorkflowResult,
  CreateAndBookVoucherWorkflowResult,
  CreateAndDeliverCreditNoteWorkflowResult,
  ReminderCreateInput,
  ReminderCreateWorkflowResult,
  CreditNoteFactoryInput,
  InvoiceFactoryInput,
  OperationData,
  OrderFactoryInput,
  PaymentTarget,
  PaymentWorkflowOperationId,
  PaymentWorkflowResult,
  ReminderWorkflowOperationId,
  SevdeskClient,
  SevdeskWorkflowError,
  VoucherFactoryInput,
  WorkflowActionReceipt,
  WorkflowJson,
  WorkflowRawResponse
} from "../src/index.js";

declare const client: SevdeskClient;
declare const invoiceFactory: InvoiceFactoryInput;
declare const creditNoteFactory: CreditNoteFactoryInput;
declare const voucherFactory: VoucherFactoryInput;
declare const orderFactory: OrderFactoryInput;
declare const attachment: Uint8Array;
declare const dynamicReminderInput: ReminderCreateInput;
declare const dynamicCustomerNumber: string;
declare const unionPayment: PaymentWorkflowResult<PaymentTarget>;

type OperationIdsOf<TResult> = TResult extends {
  readonly steps: readonly (infer TStep)[];
}
  ? TStep extends { readonly operationId: infer TOperationId }
    ? TOperationId
    : never
  : never;

type Equal<TLeft, TRight> =
  (<TValue>() => TValue extends TLeft ? 1 : 2) extends <TValue>() => TValue extends TRight ? 1 : 2
    ? (<TValue>() => TValue extends TRight ? 1 : 2) extends <TValue>() => TValue extends TLeft
        ? 1
        : 2
      ? true
      : false
    : false;

const dynamicReminderOperationsAreComplete: Equal<
  OperationIdsOf<ReminderCreateWorkflowResult<ReminderCreateInput>>,
  ReminderWorkflowOperationId
> = true;
const unionPaymentOperationsAreComplete: Equal<
  OperationIdsOf<PaymentWorkflowResult<PaymentTarget>>,
  PaymentWorkflowOperationId
> = true;

async function verifyInputCorrelatedWorkflowResults(): Promise<void> {
  const emailInvoiceInput = {
    ...invoiceFactory,
    delivery: {
      channel: "email",
      toEmail: "customer@example.test",
      subject: "Invoice",
      text: "Attached"
    }
  } as const;
  const emailInvoice = await client.invoices.createAndFinalize(emailInvoiceInput);
  const canonicalInvoiceName: "invoices.createAndFinalize" = emailInvoice.workflow;
  const invoiceEmail: NonNullable<OperationData<"sendInvoiceViaEMail">> =
    emailInvoice.data.delivery;
  const invoiceOperation: "createInvoiceByFactory" | "sendInvoiceViaEMail" | undefined =
    emailInvoice.steps[0]?.operationId;
  const invoiceJson: readonly WorkflowJson<"createInvoiceByFactory" | "sendInvoiceViaEMail">[] =
    emailInvoice.json;
  const invoiceRaw: readonly WorkflowRawResponse<
    "createInvoiceByFactory" | "sendInvoiceViaEMail"
  >[] = emailInvoice.raw;
  const invoiceResult: CreateAndFinalizeInvoiceWorkflowResult<typeof emailInvoiceInput> =
    emailInvoice;
  // @ts-expect-error this input has no booking step or required booking data
  const missingInvoiceBooking: NonNullable<OperationData<"bookInvoice">> =
    emailInvoice.data.booking;
  // @ts-expect-error createFromOrder is unrelated to the Factory workflow
  const unrelatedInvoiceOperation: "createInvoiceFromOrder" | undefined =
    emailInvoice.steps[0]?.operationId;
  const enshrinedInvoice = await client.invoices.createFromOrder({
    orderId: 9,
    booking: {
      amount: 119,
      date: new Date(),
      checkAccount: { id: 2, objectName: "CheckAccount" }
    },
    enshrine: true
  });
  const invoiceReceipt: WorkflowActionReceipt<"invoiceEnshrine"> =
    enshrinedInvoice.data.enshrinement;
  const invoiceEnshrinePerformed: true = invoiceReceipt.performed;
  const convertedInvoiceOperation:
    "createInvoiceFromOrder" | "bookInvoice" | "invoiceEnshrine" | undefined =
    enshrinedInvoice.steps[0]?.operationId;
  // @ts-expect-error Factory/saveInvoice is not used by createFromOrder
  const unrelatedFactoryOperation: "createInvoiceByFactory" | undefined =
    enshrinedInvoice.steps[0]?.operationId;
  const creditNoteInput = {
    ...creditNoteFactory,
    delivery: { channel: "mark-sent" },
    booking: {
      amount: 10,
      date: new Date(),
      checkAccount: { id: 2, objectName: "CheckAccount" }
    },
    enshrine: true
  } as const;
  const creditNote = await client.creditNotes.createAndDeliver(creditNoteInput);
  const sentCreditNote = creditNote.data.delivery;
  const creditNoteBooking: NonNullable<OperationData<"bookCreditNote">> = creditNote.data.booking;
  const creditNoteReceipt: WorkflowActionReceipt<"creditNoteEnshrine"> =
    creditNote.data.enshrinement;
  const creditNoteAlias: CreateAndDeliverCreditNoteWorkflowResult<typeof creditNoteInput> =
    creditNote;
  const creditNoteOperation:
    "createcreditNote" | "creditNoteSendBy" | "bookCreditNote" | "creditNoteEnshrine" | undefined =
    creditNote.steps[0]?.operationId;
  const voucherInput = {
    ...voucherFactory,
    attachment,
    booking: {
      amount: 10,
      date: new Date(),
      checkAccount: { id: 2, objectName: "CheckAccount" }
    },
    enshrine: true
  } as const;
  const voucher = await client.vouchers.createAndBook(voucherInput);
  const uploadedVoucherFile: NonNullable<OperationData<"voucherUploadFile">> = voucher.data.upload;
  const voucherBooking: NonNullable<OperationData<"bookVoucher">> = voucher.data.booking;
  const voucherReceipt: WorkflowActionReceipt<"voucherEnshrine"> = voucher.data.enshrinement;
  const voucherAlias: CreateAndBookVoucherWorkflowResult<typeof voucherInput> = voucher;
  const voucherOperation:
    | "voucherUploadFile"
    | "voucherFactorySaveVoucher"
    | "bookVoucher"
    | "voucherEnshrine"
    | undefined = voucher.steps[0]?.operationId;
  const contactInput = {
    contact: {
      kind: "organisation",
      name: "Example GmbH",
      category: "customer"
    },
    accounting: { debitorNumber: 10_000 }
  } as const;
  const contact = await client.contacts.create(contactInput);
  const contactWorkflowName: "contacts.create" = contact.workflow;
  const accountingContact: NonNullable<OperationData<"createAccountingContact">> =
    contact.data.accounting;
  const contactOperation:
    "createContact" | "createAccountingContact" | "getContactById" | undefined =
    contact.steps[0]?.operationId;
  const reminders: RemindersBundle = client.bundles.reminders;
  const directReminders: RemindersBundle = client.reminders;
  const reminderInput = {
    invoiceId: 42,
    delivery: {
      channel: "email",
      toEmail: "customer@example.test",
      subject: "Reminder",
      text: "Attached"
    }
  } as const;
  const reminder = await reminders.create(reminderInput);
  const reminderName: "reminders.create" = reminder.workflow;
  const reminderDelivery: NonNullable<OperationData<"sendInvoiceViaEMail">> =
    reminder.data.delivery;
  const reminderEligibilityInvoiceId: string = reminder.data.eligibility.invoice.id;
  const reminderOperation:
    | "getInvoiceById"
    | "getOpenInvoiceReminderDebit"
    | "getLastDunning"
    | "createInvoiceReminder"
    | "sendInvoiceViaEMail"
    | undefined = reminder.steps[0]?.operationId;
  const reminderResult: ReminderCreateWorkflowResult<typeof reminderInput> = reminder;
  // @ts-expect-error mark-sent is excluded for an email-delivery input
  const unrelatedReminderOperation: "invoiceSendBy" | undefined = reminder.steps[0]?.operationId;
  const eligibility = await reminders.checkEligibility(42);
  const eligibilityName: "reminders.checkEligibility" = eligibility.workflow;
  const dynamicReminder = await reminders.create(dynamicReminderInput);
  const dynamicReminderOperation: ReminderWorkflowOperationId | undefined =
    dynamicReminder.steps[0]?.operationId;
  const dynamicReminderDelivery = dynamicReminder.data.delivery;
  const dynamicContact = await client.contacts.create({
    contact: {
      kind: "organisation",
      name: "Dynamic customer",
      category: "customer",
      customerNumber: dynamicCustomerNumber
    }
  });
  const dynamicContactOperation:
    | "createContact"
    | "getContactById"
    | "getNextCustomerNumber"
    | "contactCustomerNumberAvailabilityCheck"
    | undefined = dynamicContact.steps[0]?.operationId;
  await client.invoices.createFromOrder({ orderId: 9 });
  await client.creditNotes.createFromInvoice({ invoiceId: 9 });
  await client.creditNotes.createFromVoucher({ voucherId: 9 });
  // @ts-expect-error enshrinement cannot be the only action on a new converted draft
  await client.invoices.createFromOrder({ orderId: 9, enshrine: true });
  // @ts-expect-error enshrinement cannot be the only action on a new converted draft
  await client.creditNotes.createFromInvoice({ invoiceId: 9, enshrine: true });
  // @ts-expect-error enshrinement cannot be the only action on a new converted draft
  await client.creditNotes.createFromVoucher({ voucherId: 9, enshrine: true });
  await client.orders.createAndDeliver({
    ...orderFactory,
    delivery: { channel: "mark-sent" },
    // @ts-expect-error order delivery workflows do not book an order
    booking: {
      amount: 1,
      date: new Date(),
      checkAccount: { id: 1, objectName: "CheckAccount" }
    }
  });
  await client.vouchers.createAndBook({
    ...voucherFactory,
    booking: {
      amount: 1,
      date: "2026-07-31",
      checkAccount: { id: 1, objectName: "CheckAccount" }
    },
    // @ts-expect-error voucher booking workflows do not deliver a sales document
    delivery: { channel: "mark-sent" }
  });
  await reminders.create({
    invoiceId: 42,
    // @ts-expect-error reminder workflows do not enshrine the generated reminder
    enshrine: true
  });
  if (unionPayment.workflow === "payments.book.invoice") {
    const narrowedPaymentOperation: "getCheckAccounts" | "bookInvoice" | undefined =
      unionPayment.steps[0]?.operationId;
    void narrowedPaymentOperation;
  }
  void canonicalInvoiceName;
  void invoiceEmail;
  void invoiceOperation;
  void invoiceJson;
  void invoiceRaw;
  void invoiceResult;
  void missingInvoiceBooking;
  void unrelatedInvoiceOperation;
  void invoiceEnshrinePerformed;
  void convertedInvoiceOperation;
  void unrelatedFactoryOperation;
  void sentCreditNote;
  void creditNoteBooking;
  void creditNoteReceipt;
  void creditNoteAlias;
  void creditNoteOperation;
  void uploadedVoucherFile;
  void voucherBooking;
  void voucherReceipt;
  void voucherAlias;
  void voucherOperation;
  void accountingContact;
  void contactOperation;
  void contactWorkflowName;
  void reminderName;
  void reminderDelivery;
  void reminderEligibilityInvoiceId;
  void reminderOperation;
  void reminderResult;
  void unrelatedReminderOperation;
  void eligibilityName;
  void dynamicReminderOperation;
  void dynamicReminderDelivery;
  void dynamicContactOperation;
  void directReminders;
}

declare const workflowError: SevdeskWorkflowError<
  { readonly reminderId?: string },
  "reminders.create",
  "createInvoiceReminder" | "sendInvoiceViaEMail"
>;
const typedWorkflowName: "reminders.create" = workflowError.workflow;
const typedFailedOperation: "initialization" | "createInvoiceReminder" | "sendInvoiceViaEMail" =
  workflowError.failedOperationId;
const typedPartial: { readonly reminderId?: string } = workflowError.partial;

void verifyInputCorrelatedWorkflowResults;
void typedWorkflowName;
void typedFailedOperation;
void typedPartial;
void dynamicReminderOperationsAreComplete;
void unionPaymentOperationsAreComplete;
