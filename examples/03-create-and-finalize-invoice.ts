import {
  BookingType,
  SendType,
  TaxRate,
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
const now = new Date();
const invoiceDate = formatSevdeskDate(now);

try {
  const { data: tax } = await client.taxes.resolve(
    taxes.revenue.domestic({ rate: TaxRate.STANDARD_19 })
  );
  const result = await client.invoices.createAndFinalize({
    invoice: {
      invoiceDate,
      contact: refs.contact(42),
      contactPerson: refs.sevUser(7),
      currency: "EUR",
      tax
    },
    positions: [
      {
        name: "Consulting",
        quantity: 1,
        price: 100,
        unity: refs.unity(1)
      }
    ],
    delivery: {
      channel: "mark-sent",
      sendType: SendType.DOWNLOADED_PDF
    },
    booking: {
      amount: 119,
      date: now,
      type: BookingType.FULL_PAYMENT,
      checkAccount: refs.checkAccount(3)
    },
    enshrine: true
  });
  console.log(result.data.created);
  console.log(result.data.delivery);
  console.log(result.data.booking);
  console.log(result.data.enshrinement.performed);
  for (const step of result.steps) {
    console.log(step.operationId, step.status);
  }
} finally {
  client.dispose();
}
