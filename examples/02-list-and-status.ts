import { InvoiceStatus, createSevdeskClient } from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;

if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });

try {
  const page = await client.invoices.list({
    status: InvoiceStatus.OPEN,
    embed: ["contact"],
    limit: 50,
    offset: 0,
    countAll: true
  });
  for (const invoice of page.data) {
    if (invoice.statusKnown) {
      console.log(invoice.id, invoice.status, invoice.statusCode);
    } else {
      console.warn("Future invoice status", invoice.id, invoice.statusCode);
    }
  }
  console.log(page.pagination.total, page.pagination.hasMore);
  const rawPage = await client.raw.invoice.getInvoices({
    query: {
      status: InvoiceStatus.OPEN,
      limit: 50,
      offset: 0,
      countAll: true
    }
  });
  console.log(rawPage.objects);
} finally {
  client.dispose();
}
