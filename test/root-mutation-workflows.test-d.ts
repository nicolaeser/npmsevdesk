import type { SevdeskClient } from "../src/client/sevdesk-client.js";
import type {
  ContactDeleteResult,
  ContactUpdateWorkflowResult,
  CreditNoteUpdateWorkflowResult,
  InvoiceDeleteResult,
  InvoiceUpdateWorkflowResult,
  OrderDeleteResult,
  OrderUpdateWorkflowResult,
  VoucherUpdateWorkflowResult
} from "../src/bundles/index.js";

async function rootMutationResultTypes(client: SevdeskClient): Promise<void> {
  const invoice: InvoiceUpdateWorkflowResult = await client.invoices.update(42, {
    header: "Updated"
  });
  const invoiceId: string = invoice.data.invoice.id;
  const invoiceWrite: "updateInvoiceById" = invoice.data.receipt.operationId;
  const invoiceStep: InvoiceUpdateWorkflowResult["steps"][number]["operationId"] = "getInvoiceById";
  void [invoiceId, invoiceWrite, invoiceStep];
  // @ts-expect-error workflow updates expose their final resource under `data.invoice`.
  invoice.data.header;
  // @ts-expect-error unrelated invoice operations are excluded from update evidence.
  const unrelatedInvoiceStep: InvoiceUpdateWorkflowResult["steps"][number]["operationId"] =
    "createInvoiceByFactory";
  void unrelatedInvoiceStep;
  const order: OrderUpdateWorkflowResult = await client.orders.update(9, { header: "Updated" });
  const orderId: string = order.data.order.id;
  const orderWrite: "updateOrder" = order.data.receipt.operationId;
  const orderStep: OrderUpdateWorkflowResult["steps"][number]["operationId"] = "updateOrder";
  void [orderId, orderWrite, orderStep];
  const contact: ContactUpdateWorkflowResult = await client.contacts.update(7, {
    kind: "person",
    firstName: "Ada"
  });
  const contactId: string = contact.data.contact.id;
  const contactWrite: "updateContact" = contact.data.receipt.operationId;
  const contactStep: ContactUpdateWorkflowResult["steps"][number]["operationId"] = "getContactById";
  void [contactId, contactWrite, contactStep];
  const invoiceDelete: InvoiceDeleteResult = await client.invoices.delete(42, { confirm: true });
  const orderDelete: OrderDeleteResult = await client.orders.delete(9, { confirm: true });
  const contactDelete: ContactDeleteResult = await client.contacts.delete(7, { confirm: true });
  const invoiceDeleteOperation: "deleteInvoiceById" = invoiceDelete.operationId;
  const orderDeleteOperation: "deleteOrder" = orderDelete.operationId;
  const contactDeleteOperation: "deleteContact" = contactDelete.operationId;
  void [invoiceDeleteOperation, orderDeleteOperation, contactDeleteOperation];
  const creditNote: CreditNoteUpdateWorkflowResult = await client.creditNotes.update(8, {
    header: "Updated"
  });
  const creditNoteId: string = creditNote.data.creditNote.id;
  const creditNoteWrite: "updatecreditNote" = creditNote.data.receipt.operationId;
  void [creditNoteId, creditNoteWrite];
  const voucher: VoucherUpdateWorkflowResult = await client.vouchers.update(5, {
    description: "Updated"
  });
  const voucherId: string = voucher.data.voucher.id;
  const voucherWrite: "updateVoucher" = voucher.data.receipt.operationId;
  void [voucherId, voucherWrite];
}

declare const client: SevdeskClient;
void rootMutationResultTypes(client);
