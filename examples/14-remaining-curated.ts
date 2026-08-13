import {
  CheckAccountTransactionStatus,
  InvoiceType,
  createSevdeskClient,
  refs
} from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;
if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });

try {
  const [accounts, transactions, tags, templates] = await Promise.all([
    client.checkAccounts.list({ limit: 5, countAll: true }),
    client.transactions.list({
      limit: 5,
      countAll: true,
      embed: ["checkAccount"],
      status: CheckAccountTransactionStatus.CREATED
    }),
    client.tags.list({ limit: 5, countAll: true }),
    client.textTemplates.list({ limit: 5, countAll: true, objectType: "RE" })
  ]);
  console.log(accounts.data[0]?.id, accounts.pagination);
  console.log(transactions.data[0]?.id, transactions.pagination);
  console.log(tags.data[0]?.name, templates.data[0]?.name);

  const firstAccountId = Number(accounts.data[0]?.id);
  if (Number.isSafeInteger(firstAccountId) && firstAccountId > 0) {
    const balance = await client.checkAccounts.balanceAt(firstAccountId, new Date());
    console.log(balance.data);
  }

  const invoices = await client.exports.invoices({
    limit: 50,
    filter: { invoiceTypes: [InvoiceType.NORMAL] }
  });
  console.log(invoices.data.filename, invoices.data.mimeType);

  const report = await client.reports.invoices({
    view: "csv",
    filter: { invoiceTypes: [InvoiceType.NORMAL] }
  });
  console.log(report.data.filename);

  if (process.env.SEVDESK_ALLOW_DOCUMENT_WRITES === "true") {
    const creditNoteId = 8;
    const voucherId = 5;
    await client.creditNotes.update(creditNoteId, { header: "Draft credit note" });
    await client.vouchers.update(voucherId, { description: "Draft voucher" });
    const createdTag = await client.tags.create({
      name: "Follow-up",
      object: refs.invoice(42)
    });
    const createdTagId = Number(createdTag.data.tag?.id);
    if (Number.isSafeInteger(createdTagId) && createdTagId > 0) {
      await client.tags.delete(createdTagId, { confirm: true });
    }
  }
} finally {
  client.dispose();
}
