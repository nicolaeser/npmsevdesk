import {
  createInvoiceFinalizationCheckpoint,
  type InvoiceFinalizationFailurePartial,
  parseInvoiceFinalizationCheckpoint,
  type createSevdeskClient,
  refs,
  type InvoiceFinalizationInput,
  type InvoiceFinalizingPlan
} from "../src/index.js";
import type { SevdeskWorkflowError } from "../src/bundles/workflow.js";

declare const client: ReturnType<typeof createSevdeskClient>;

const plan = {
  delivery: { channel: "mark-sent", sendType: "downloaded_pdf" },
  booking: {
    amount: 119,
    date: new Date(),
    checkAccount: refs.checkAccount(3),
    checkAccountTransaction: refs.checkAccountTransaction(4)
  },
  enshrine: true
} as const satisfies InvoiceFinalizingPlan;

const persistedCheckpoint = createInvoiceFinalizationCheckpoint({
  invoiceId: 42,
  plan,
  completedSteps: [{ operationId: "createInvoiceByFactory" }, { operationId: "invoiceSendBy" }],
  uncertainStep: { operationId: "bookInvoice" }
});
const persistedBookingDate: number = persistedCheckpoint.plan.booking.date;
declare const resumeError: SevdeskWorkflowError<
  InvoiceFinalizationFailurePartial<typeof persistedCheckpoint.plan>,
  "invoices.resumeFinalization"
>;
const recoveryCheckpoint = resumeError.partial.checkpoint;
const broadlyParsedCheckpoint = parseInvoiceFinalizationCheckpoint("{}");

// @ts-expect-error parse intentionally has no generic assertion overload.
parseInvoiceFinalizationCheckpoint<typeof persistedCheckpoint.plan>("{}");

const input = {
  ...persistedCheckpoint,
  probe: { maxAttempts: 3, delayMs: 5_000, deadline: new Date(Date.now() + 30_000) }
} as const satisfies InvoiceFinalizationInput<typeof persistedCheckpoint.plan>;

async function typeContract() {
  const reconciliation = await client.invoices.reconcileFinalization(input);
  const reconciliationName: "invoices.reconcileFinalization" = reconciliation.workflow;
  for (const step of reconciliation.steps) {
    const probeOnly: "getInvoiceById" = step.operationId;
    void probeOnly;
  }
  const deliveryOperation: "invoiceSendBy" = reconciliation.data.actions.delivery.operationId;
  const bookingOperation: "bookInvoice" = reconciliation.data.actions.booking.operationId;
  const enshrinementOperation: "invoiceEnshrine" =
    reconciliation.data.actions.enshrinement.operationId;
  await client.invoices.resumeFinalization({
    ...reconciliation.data.checkpoint,
    // @ts-expect-error getInvoiceById steps cannot replace completed/uncertain write history.
    completedSteps: reconciliation.steps
  });
  const resumed = await client.invoices.resumeFinalization({
    ...reconciliation.data.checkpoint,
    probe: input.probe
  });
  const resumeName: "invoices.resumeFinalization" = resumed.workflow;
  for (const step of resumed.steps) {
    const operation: "getInvoiceById" | "invoiceSendBy" | "bookInvoice" | "invoiceEnshrine" =
      step.operationId;
    // @ts-expect-error This concrete plan cannot execute email delivery.
    const impossible: "sendInvoiceViaEMail" = step.operationId;
    void [operation, impossible];
  }
  if (resumed.data.status === "resumed") {
    const complete: true = resumed.data.reconciliation.complete;
    const resumable: true = resumed.data.reconciliation.canResume;
    const first = resumed.data.executed[0];
    const operation: "invoiceSendBy" | "bookInvoice" | "invoiceEnshrine" = first.operationId;
    void [operation, complete, resumable];
  } else if (resumed.data.status === "already-complete" || resumed.data.status === "blocked") {
    const noExecutions: readonly [] = resumed.data.executed;
    void noExecutions;
  } else {
    const first = resumed.data.executed[0];
    void first;
  }
  void [reconciliationName, deliveryOperation, bookingOperation, enshrinementOperation, resumeName];
}

void [typeContract, persistedBookingDate, recoveryCheckpoint, broadlyParsedCheckpoint];
