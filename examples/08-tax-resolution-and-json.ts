import { SellerTaxScheme, buildInvoicePayload, createSevdeskClient, refs } from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;

if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });

try {
  const france = await client.lookup.country({ code: "FR" });
  const resolution = await client.taxes.resolveDigitalService({
    sellerTaxScheme: SellerTaxScheme.STANDARD,
    customer: {
      type: "consumer",
      country: "FR",
      euConsumerTaxation: {
        mode: "oss-destination",
        destinationCountry: france.data,
        rate: 20
      }
    },
    evidence: { source: "checkout-tax-snapshot" }
  });
  const payload = buildInvoicePayload({
    invoice: {
      invoiceDate: "31.07.2026",
      contact: refs.contact(42),
      contactPerson: refs.sevUser(7),
      currency: "EUR",
      tax: resolution.data
    },
    positions: [
      {
        name: "SaaS subscription",
        quantity: 1,
        price: 100,
        unity: refs.unity(1)
      }
    ]
  });
  console.log(payload.invoice.taxRule);
  console.log(payload.invoice.deliveryAddressCountry);
  console.log(payload.invoicePosSave[0]?.taxRate);
  console.log(JSON.stringify(payload));
  console.log(resolution.json);
  console.log(resolution.raw.status);
} finally {
  client.dispose();
}
