import {
  createSevdeskClient,
  rawEnumCode,
  refs,
  taxes,
  type CreatedInvoice,
  type OperationData,
  type SevdeskClient,
  type SevdeskInvoice
} from "../src/index.js";

declare const client: SevdeskClient;

async function verifyCuratedAndRawContracts(): Promise<void> {
  const curated = await client.invoices.list({ status: "open" });
  const curatedInvoices: readonly SevdeskInvoice[] = curated.data;
  const invoice = curatedInvoices[0];
  if (invoice?.statusKnown && invoice.status === "OPEN") {
    const correlatedCode: 200 = invoice.statusCode;
    void correlatedCode;
  }
  const invoiceType = invoice?.semantic.invoiceType;
  if (invoiceType?.known && invoiceType.name === "NORMAL") {
    const correlatedTypeCode: "RE" = invoiceType.code;
    void correlatedTypeCode;
  }
  const wireStatus: "50" | "100" | "200" | "500" | "750" | "1000" | undefined =
    curated.objects[0]?.status;
  void wireStatus;
  // @ts-expect-error wire statuses are not semantic status names
  const semanticStatusFromWireObjects: "OPEN" = curated.objects[0]?.status;
  void semanticStatusFromWireObjects;
  await client.invoices.list({
    status: rawEnumCode("InvoiceStatus", 4711)
  });
  // @ts-expect-error raw methods preserve OpenAPI wire inputs
  await client.raw.invoice.getInvoices({ query: { status: "open" } });
  // @ts-expect-error a raw code from another semantic domain cannot cross into invoice filters
  await client.invoices.list({ status: rawEnumCode("OrderStatus", 4711) });
  const custom = await client.request<
    { readonly objects: { readonly accepted: true } },
    { readonly value: string }
  >({
    method: "POST",
    path: "/FutureEndpoint",
    body: { value: "typed through AxiosResponse" }
  });
  const customBody: { readonly value: string } | undefined = custom.raw.config.data;
  void customBody;
  const payment = await client.payments.book(
    { kind: "invoice", id: 42, date: new Date() },
    {
      amount: 100,
      account: refs.checkAccount(7)
    }
  );
  const invoiceBooking: NonNullable<OperationData<"bookInvoice">> = payment.data.booking;
  void invoiceBooking;
  const createdInvoice = await client.invoices.createAndFinalize({
    invoice: {
      invoiceDate: "30.07.2026",
      contact: refs.contact(1),
      contactPerson: refs.sevUser(2),
      currency: "EUR",
      tax: taxes.manual.sales({
        bookkeepingSystem: "2.0",
        taxRule: "standard_taxable"
      })
    },
    positions: [
      {
        quantity: 1,
        price: 100,
        taxRate: 19,
        unity: refs.unity(1)
      }
    ],
    booking: {
      amount: 119,
      date: new Date(),
      checkAccount: refs.checkAccount(7)
    }
  });
  const factoryResult: CreatedInvoice = createdInvoice.data.created;
  const exactBooking: NonNullable<OperationData<"bookInvoice">> = createdInvoice.data.booking;
  void factoryResult;
  void exactBooking;
  const convertedInvoice = await client.invoices.createFromOrder({
    orderId: 9,
    delivery: { channel: "mark-sent" },
    enshrine: true
  });
  const converted: SevdeskInvoice = convertedInvoice.data.created;
  void converted;
  const nextNumber: string = (await client.contacts.nextCustomerNumber()).data;
  void nextNumber;
  const users = await client.users.list({ limit: 1 });
  const userId: string | undefined = users.data[0]?.id;
  void userId;
  const sequence = await client.sequences.next({
    objectType: "Invoice",
    type: "RE"
  });
  const formatted: string = sequence.data.formatted;
  void formatted;
  const template = await client.layout.findTemplate({ type: "Invoice", name: "Standard" });
  const templateId: string | undefined = template?.id;
  void templateId;
  const enshrined = await client.invoices.enshrine(42);
  void enshrined.response.status;
  const listedPositions = await client.invoices.listPositions(42, {
    limit: 50,
    countAll: true,
    embed: ["part", "unity"]
  });
  const positionTaxRate: string | undefined = listedPositions.data[0]?.taxRate;
  const positionPageTotal: number | undefined = listedPositions.pagination.total;
  void positionTaxRate;
  void positionPageTotal;
  // @ts-expect-error invoice-position embeds are the reviewed relation names only
  await client.invoices.listPositions(42, { embed: ["contact"] });
  await client.invoices.updatePosition(9, { price: 25 });
  await client.raw.invoicePos.updateInvoicePos({
    path: { invoicePosId: 9 },
    body: { price: 25 }
  });
}

// @ts-expect-error client configuration accepts auth and transport settings only
createSevdeskClient({ apiToken: "token", statusMappings: {} });

void verifyCuratedAndRawContracts;
