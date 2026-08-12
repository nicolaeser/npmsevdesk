import {
  SendType,
  createInvoiceFinalizationCheckpoint,
  createSevdeskClient,
  refs,
  type InvoiceFinalizingPlan
} from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;

if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });
const invoiceId = 42;

const plan = {
  delivery: { channel: "mark-sent", sendType: SendType.DOWNLOADED_PDF },
  booking: {
    amount: 119,
    date: new Date("2026-07-31T10:00:00Z"),
    checkAccount: refs.checkAccount(3),
    checkAccountTransaction: refs.checkAccountTransaction(812)
  },
  enshrine: true
} as const satisfies InvoiceFinalizingPlan;

const checkpoint = createInvoiceFinalizationCheckpoint({
  invoiceId,
  plan,
  completedSteps: ["createInvoiceByFactory", "invoiceSendBy"],
  uncertainStep: "bookInvoice"
});

try {
  const observed = await client.invoices.reconcileFinalization({
    ...checkpoint
  });
  if (!observed.data.complete) {
    const resumed = await client.invoices.resumeFinalization({
      ...observed.data.checkpoint,
      probe: {
        maxAttempts: 3,
        delayMs: 5_000,
        deadline: Date.now() + 30_000
      }
    });
    if (resumed.data.completed) {
      console.log(resumed.data.status, resumed.data.executed);
    } else {
      console.error(resumed.data.status, resumed.data.reconciliation.actions);
    }
  }
} finally {
  client.dispose();
}
