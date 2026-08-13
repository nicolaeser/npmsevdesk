import type { SevdeskClient } from "../src/client/sevdesk-client.js";
import { InvoiceType } from "../src/enums/domain-enums.js";

declare const client: SevdeskClient;

void client.sequences.next({
  objectType: "Invoice",
  type: InvoiceType.NORMAL
});
void client.sequences.next({
  objectType: "Order",
  type: "AB"
});
void client.sequences.next({
  objectType: "CreditNote",
  type: "GS"
});
void client.sequences.next({
  objectType: "Contact"
});

// @ts-expect-error tenant prefixes are not official invoice types
void client.sequences.next({ objectType: "Invoice", type: "INV." });
// @ts-expect-error tenant prefixes are not official order types
void client.sequences.next({ objectType: "Order", type: "OC." });
