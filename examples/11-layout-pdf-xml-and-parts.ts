import {
  LayoutLanguage,
  LayoutPayPalMode,
  PartStatus,
  createSevdeskClient,
  refs
} from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;
if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });

const invoiceId = 42;
const orderId = 77;
const partId = 91;

try {
  const [templates, letterpapers, parts] = await Promise.all([
    client.layout.listTemplates({ type: "Invoice" }),
    client.layout.listLetterpapers(),
    client.parts.list({ limit: 50, countAll: true, embed: ["category", "unity"] })
  ]);
  console.log(templates.data, letterpapers.data);
  console.log(parts.data, parts.pagination);
  const [part, stock, pdf, xml] = await Promise.all([
    client.parts.get(partId),
    client.parts.getStock(partId),
    client.invoices.getPdf(invoiceId),
    client.invoices.getXml(invoiceId)
  ]);
  console.log(part.data.status, part.data.statusCode, stock.data);
  console.log(pdf.data.filename, pdf.data.mimeType, pdf.data.content?.length);
  console.log(xml.data);
  if (process.env.SEVDESK_ALLOW_DOCUMENT_WRITES === "true") {
    const template = templates.data[0];
    if (!template) throw new Error("The tenant has no invoice template.");
    const layout = await client.invoices.setLayout(
      invoiceId,
      {
        template: template.id,
        language: LayoutLanguage.GERMAN,
        payPal: LayoutPayPalMode.DISABLED
      },
      { getAsPdf: false }
    );
    console.log(layout.data.applied.template.receipt.performed);
    console.log(layout.data.applied.language.value);
    const rendered = await client.invoices.render(invoiceId, {
      forceReload: true,
      getAsPdf: true
    });
    console.log(rendered.data.kind, rendered.data.pdf.length);
  }
  if (process.env.SEVDESK_ALLOW_ORDER_COMMIT === "true") {
    const orderPdf = await client.orders.getPdf(orderId, {
      confirmCommit: true,
      download: true,
      markAsDownloaded: false
    });
    console.log(orderPdf.data.filename);
  }
  if (process.env.SEVDESK_ALLOW_TRANSACTION_UNLINK === "true") {
    await client.invoices.resetToOpen(invoiceId, {
      confirmUnlinkTransactions: true
    });
  }
  if (process.env.SEVDESK_ALLOW_PART_WRITES === "true") {
    const created = await client.parts.create({
      name: "Support plan",
      partNumber: `SUPPORT-${Date.now()}`,
      stock: 0,
      stockEnabled: false,
      unity: refs.unity(1),
      category: refs.category(3),
      taxRate: 19,
      status: PartStatus.ACTIVE,
      priceNet: 100
    });
    console.log(created.data.id, created.data.status);
    await client.parts.update(partId, { priceNet: 120 });
  }
} finally {
  client.dispose();
}
