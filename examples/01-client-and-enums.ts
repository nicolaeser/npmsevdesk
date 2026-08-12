import {
  ContactDepth,
  InvoiceFromOrderPartialType,
  InvoiceStatus,
  InvoiceType,
  TaxRule,
  createSevdeskClient,
  type ContactDepthInput,
  type InvoiceFromOrderPartialTypeInput,
  type InvoiceStatusInput
} from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;

if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({
  apiToken,
  timeoutMs: 15_000,
  retries: {
    attempts: 2,
    unsafeOperations: false
  }
});

const status: InvoiceStatusInput = InvoiceStatus.OPEN;
const contactDepth: ContactDepthInput = ContactDepth.ORGANISATIONS_ONLY;
const finalInvoiceFromOrder: InvoiceFromOrderPartialTypeInput = InvoiceFromOrderPartialType.FINAL;

console.log({
  status,
  contactDepth,
  finalInvoiceFromOrder,
  normalInvoiceType: InvoiceType.NORMAL,
  standardTaxRule: TaxRule.STANDARD_TAXABLE
});

client.dispose();
