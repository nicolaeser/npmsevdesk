import type { LayoutBundle } from "../src/bundles/layout.js";

declare const layout: LayoutBundle;

// @ts-expect-error Layout changes must contain at least one supported field.
void layout.setInvoiceLayout(1, {});

// @ts-expect-error `it_IT` is not the value documented by the checked-in specification.
void layout.setInvoiceLayout(1, { language: "it_IT" });

// @ts-expect-error PayPal modes are the documented A/B/C/D values only.
void layout.setInvoiceLayout(1, { payPal: "enabled" });

// @ts-expect-error findTemplate requires a name.
void layout.findTemplate({ type: "Invoice" });
