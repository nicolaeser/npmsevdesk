import type { SevdeskClient } from "../src/client/sevdesk-client.js";
import type { components, operations } from "../src/types/openapi.js";
import type {
  RawBinaryUpload,
  RequestBodyFor,
  ResponseJsonFor,
  SuccessStatusFor
} from "../src/types/operation.js";
import { fetchAll } from "../src/utils/pagination.js";

type Equal<TLeft, TRight> =
  (<TValue>() => TValue extends TLeft ? 1 : 2) extends <TValue>() => TValue extends TRight ? 1 : 2
    ? true
    : false;
type Assert<TValue extends true> = TValue;

type _DeleteResponseIsUndefined = Assert<
  Equal<ResponseJsonFor<operations["deleteInvoiceById"]>, undefined>
>;
type _InvoiceListSuccessStatus = Assert<Equal<SuccessStatusFor<operations["getInvoices"]>, 200>>;

declare const client: SevdeskClient;

// @ts-expect-error getInvoiceById requires its path envelope.
client.raw.invoice.getInvoiceById({});
// @ts-expect-error Generated raw methods intentionally expose no caller-controlled generic.
client.raw.invoice.getInvoiceById<never>({});

// @ts-expect-error Factory writes cannot be called without their body.
client.raw.invoice.createInvoiceByFactory();
// @ts-expect-error Ordinary create operations cannot omit their body either.
client.raw.contact.createContact();

client.raw.voucher.voucherUploadFile({
  body: { file: new Blob(["voucher"]) }
});
client.raw.voucher.voucherUploadFile({
  body: { file: new Uint8Array([1, 2, 3]) }
});
client.raw.voucher.voucherUploadFile({
  body: { file: new ArrayBuffer(4) }
});
client.raw.voucher.voucherUploadFile({ body: new FormData() });
// @ts-expect-error Raw multipart uploads accept binary data, not a local path string.
client.raw.voucher.voucherUploadFile({ body: { file: "/tmp/voucher.pdf" } });

client.raw.invoice.invoiceRender({ path: { invoiceId: 1 } });
client.raw.invoicePos.updateInvoicePos({
  path: { invoicePosId: 9 },
  body: { price: 25 }
});
// @ts-expect-error InvoicePos updates require the generated path envelope.
client.raw.invoicePos.updateInvoicePos({ body: { price: 25 } });
client.raw.checkAccount.createFileImportAccount({
  body: { name: "Import", importType: "CSV" }
});
// @ts-expect-error File-import accounts require both their name and import type.
client.raw.checkAccount.createFileImportAccount({ body: { name: "Import" } });
// @ts-expect-error Text-template creation requires template text.
client.raw.textTemplate.addTextTemplate({ body: { name: "Greeting" } });
// @ts-expect-error Text-template updates use the same required write fields.
const incompleteTextTemplate: RequestBodyFor<operations["updateTextTemplate"]> = {
  name: "Greeting"
};
void incompleteTextTemplate;

const binaryValues: readonly RawBinaryUpload[] = [new Blob(), new Uint8Array(), new ArrayBuffer(0)];
void binaryValues;

const invoiceFactoryBody = {
  invoice: {
    invoiceDate: "30.07.2026",
    contact: { id: 1, objectName: "Contact" },
    contactPerson: { id: 2, objectName: "SevUser" },
    status: "100",
    invoiceType: "RE",
    currency: "EUR",
    mapAll: true,
    taxRule: { id: 1, objectName: "TaxRule" }
  },
  invoicePosSave: [],
  invoicePosDelete: null,
  discountSave: null,
  discountDelete: null,
  takeDefaultAddress: true
} satisfies RequestBodyFor<operations["createInvoiceByFactory"]>;
void invoiceFactoryBody;

const smallBusinessInvoice = {
  invoiceDate: "30.07.2026",
  contact: { id: 1, objectName: "Contact" },
  contactPerson: { id: 2, objectName: "SevUser" },
  status: "100",
  invoiceType: "RE",
  currency: "EUR",
  mapAll: true,
  taxType: "ss"
} satisfies components["schemas"]["Factory_Invoice"];
void smallBusinessInvoice;

const voucherFactoryBody = {
  voucher: {
    objectName: "Voucher",
    mapAll: true,
    status: 50,
    voucherType: "VOU",
    creditDebit: "D",
    taxRule: { id: 9, objectName: "TaxRule" }
  },
  voucherPosSave: [
    {
      objectName: "VoucherPos",
      mapAll: true,
      taxRate: 19,
      net: true,
      sumNet: 100,
      sumGross: 119,
      accountDatev: { id: 1, objectName: "AccountDatev" }
    }
  ],
  voucherPosDelete: null
} satisfies RequestBodyFor<operations["voucherFactorySaveVoucher"]>;
void voucherFactoryBody;

async function assertPaginationInference(): Promise<void> {
  const result = await fetchAll(async () => ({
    data: [{ id: 1, label: "first" }] as const,
    json: { objects: [{ id: 1, label: "first" }] },
    raw: { status: 200 }
  }));
  type InferredItem = (typeof result.items)[number];
  const item: InferredItem = { id: 1, label: "first" };
  const exact: { readonly id: 1; readonly label: "first" } = item;
  void exact;
  // @ts-expect-error The item type is inferred from the page; it is not unknown.
  const wrong: string = item;
  void wrong;
}
void assertPaginationInference;
