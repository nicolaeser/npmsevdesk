import type { SevdeskClient } from "../src/index.js";

declare const client: SevdeskClient;

// @ts-expect-error sevdesk documents that order PDF creation can commit the order
void client.orders.getPdf(1);
void client.orders.getPdf(1, { confirmCommit: true });

// @ts-expect-error resetToOpen unlinks linked transactions and needs explicit confirmation
void client.invoices.resetToOpen(1);
void client.invoices.resetToOpen(1, { confirmUnlinkTransactions: true });

async function correlatedRenderResults(): Promise<void> {
  const pdf = await client.invoices.render(1, { getAsPdf: true });
  const pdfKind: "pdf" = pdf.data.kind;
  const pdfContent: string = pdf.data.pdf;
  const metadata = await client.invoices.render(1);
  const metadataKind: "metadata" = metadata.data.kind;
  // @ts-expect-error metadata render results cannot be mistaken for requested PDF content
  void metadata.data.pdf;
  void [pdfKind, pdfContent, metadataKind];
}

void correlatedRenderResults;
