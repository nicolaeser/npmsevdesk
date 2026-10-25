import type { SevdeskClient } from "../src/index.js";

declare const client: SevdeskClient;

// @ts-expect-error sevdesk documents that order PDF creation can commit the order
void client.orders.getPdf(1);
void client.orders.getPdf(1, { confirmCommit: true });

// @ts-expect-error resetToOpen unlinks linked transactions and needs explicit confirmation
void client.invoices.resetToOpen(1);
void client.invoices.resetToOpen(1, { confirmUnlinkTransactions: true });

async function correlatedRenderResults(): Promise<void> {
  const pdf = await client.invoices.render(1, { forceReload: true });
  const pdfKind: "pdf" = pdf.data.kind;
  const pdfContent: string = pdf.data.pdf;
  // @ts-expect-error sevdesk no longer returns page images from invoice render
  void pdf.data.pages;
  // @ts-expect-error getAsPdf is ignored by sevdesk and is not a curated render option
  await client.invoices.render(1, { getAsPdf: true });
  // @ts-expect-error layout updates no longer accept the ignored getAsPdf query
  await client.invoices.setLayout(1, { template: "tpl-1" }, { getAsPdf: false });
  void [pdfKind, pdfContent];
}

void correlatedRenderResults;
