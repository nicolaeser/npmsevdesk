import {
  EuConsumerTaxation,
  SaleProduct,
  TaxCustomerType,
  VatIdStatus,
  assessTaxLocation,
  createSevdeskClient
} from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;
if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });

try {
  const de = await client.taxes.resolveSale({
    country: "DE",
    customerType: TaxCustomerType.CONSUMER,
    product: SaleProduct.ELECTRONIC_SERVICE,
    effectiveDate: new Date()
  });
  console.log("DE private", de.data.taxRule, de.data.defaultTaxRate);
  const locationEvidence = {
    billingCountry: "NL",
    ipCountry: "NL",
    paymentCountry: "NL"
  } as const;
  console.log("NL location", assessTaxLocation(locationEvidence));
  const quote = await client.taxes.quoteSale({
    country: "NL",
    customerType: TaxCustomerType.CONSUMER,
    product: SaleProduct.ELECTRONIC_SERVICE,
    euConsumerTaxation: EuConsumerTaxation.OSS_DESTINATION,
    effectiveDate: new Date(),
    locationEvidence,
    price: 29,
    quantity: 1,
    basis: "gross"
  });
  console.log(
    "NL quote",
    quote.tax.defaultTaxRate,
    quote.amounts,
    quote.position,
    quote.showNet,
    quote.evidence
  );
  const us = await client.taxes.resolveSale({
    country: "US",
    customerType: TaxCustomerType.CONSUMER,
    product: SaleProduct.ELECTRONIC_SERVICE,
    effectiveDate: new Date()
  });
  console.log("US", us.data.taxRule, us.data.defaultTaxRate);
  const frCompany = await client.taxes.resolveSale({
    country: "FR",
    customerType: TaxCustomerType.BUSINESS,
    product: SaleProduct.ELECTRONIC_SERVICE,
    effectiveDate: new Date(),
    vatId: {
      status: VatIdStatus.VALID,
      value: "FRXX123456789",
      country: "FR",
      checkedAt: new Date().toISOString(),
      provider: "your-vies-check"
    }
  });
  console.log("FR company", frCompany.data.taxRule, frCompany.data.defaultTaxRate);
} finally {
  client.dispose();
}
