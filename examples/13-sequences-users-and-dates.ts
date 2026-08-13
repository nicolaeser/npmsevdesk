import {
  InvoiceType,
  RecurringInterval,
  buildInvoicePayload,
  createSevdeskClient,
  formatSevdeskDate,
  refs,
  taxes
} from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;

if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });

try {
  const invoiceDate = formatSevdeskDate();
  const [nextCustomerNumber, users, invoiceNumber, template] = await Promise.all([
    client.contacts.nextCustomerNumber(),
    client.users.list({ limit: 1, countAll: true }),
    client.sequences.next({ objectType: "Invoice", type: InvoiceType.NORMAL }),
    client.layout.findTemplate({ type: "Invoice", name: "Standard" })
  ]);
  console.log(nextCustomerNumber.data, users.data[0]?.id);
  console.log(invoiceNumber.data.formatted, invoiceNumber.data.format);
  console.log(template?.id);
  const recurring = buildInvoicePayload({
    invoice: {
      invoiceDate,
      contact: refs.contact(42),
      contactPerson: refs.sevUser(7),
      currency: "EUR",
      invoiceType: InvoiceType.RECURRING,
      accountIntervall: RecurringInterval.MONTHLY,
      accountNextInvoice: new Date(),
      tax: taxes.manual.sales({
        bookkeepingSystem: "2.0",
        taxRule: "standard_taxable"
      })
    },
    positions: [
      {
        name: "Recurring fee",
        quantity: 1,
        price: 10,
        taxRate: 19,
        unity: refs.unity(1)
      }
    ]
  });
  console.log(recurring.invoice.invoiceType, recurring.invoice.accountNextInvoice);
  if (process.env.SEVDESK_ALLOW_DOCUMENT_WRITES === "true") {
    const invoiceId = 42;
    await client.raw.invoicePos.updateInvoicePos({
      path: { invoicePosId: 9 },
      body: { price: 25 }
    });
    await client.invoices.updatePosition(9, { price: 25 });
    await client.invoices.enshrine(invoiceId);
  }
} finally {
  client.dispose();
}
