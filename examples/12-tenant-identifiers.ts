import {
  InvoiceType,
  SevdeskLookupNotFoundError,
  buildInvoicePayload,
  createSevdeskClient,
  refs,
  taxes
} from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;

if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });

try {
  const invoiceNumber = "INV-2024-0001";
  const customerNumber = "CUST-42";
  const contact = await client.lookup.findContact({ customerNumber });
  if (contact === undefined) {
    console.log("No contact uses that tenant customer number.");
  } else {
    console.log(contact.data.id, contact.data.customerNumber);
  }
  const listed = await client.invoices.list({ invoiceNumber, limit: 1 });
  console.log(listed.data[0]?.invoiceNumber, listed.data[0]?.semantic.invoiceType);
  const payload = buildInvoicePayload({
    invoice: {
      invoiceDate: "01.01.2026",
      contact: refs.contact(42),
      contactPerson: refs.sevUser(7),
      currency: "EUR",
      invoiceType: InvoiceType.NORMAL,
      invoiceNumber,
      header: `Invoice ${invoiceNumber}`,
      tax: taxes.manual.sales({
        bookkeepingSystem: "2.0",
        taxRule: "standard_taxable"
      })
    },
    positions: [
      {
        name: "Consulting",
        quantity: 1,
        price: 100,
        taxRate: 19,
        unity: refs.unity(1)
      }
    ]
  });
  console.log(payload.invoice.invoiceType, payload.invoice.invoiceNumber);
  const sequence = await client.sequences.next({
    objectType: "Invoice",
    type: InvoiceType.NORMAL
  });
  console.log(sequence.data.formatted, sequence.data.format);
} catch (error) {
  if (error instanceof SevdeskLookupNotFoundError) {
    console.error("Required object not found", error.resource);
  } else {
    throw error;
  }
} finally {
  client.dispose();
}
