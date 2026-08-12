import type {
  ContactsBundle,
  CreditNotesBundle,
  CuratedRequestOptions,
  InvoicesBundle,
  OrdersBundle,
  PaymentsBundle,
  VouchersBundle
} from "../src/index.js";
import type { CuratedRequestOptions as BundlesCuratedRequestOptions } from "../src/bundles-entry.js";
import type { CuratedRequestOptions as FocusedCuratedRequestOptions } from "../src/types-entry.js";

type Equal<TLeft, TRight> =
  (<TValue>() => TValue extends TLeft ? 1 : 2) extends <TValue>() => TValue extends TRight ? 1 : 2
    ? true
    : false;
type Assert<TValue extends true> = TValue;
type LastRequired<TValues extends readonly unknown[]> =
  Required<TValues> extends readonly [...unknown[], infer TLast] ? TLast : never;
type MethodRequestOptionAudit<TBundle> = {
  [TKey in keyof TBundle]: TBundle[TKey] extends (...args: infer TArguments) => unknown
    ? Equal<LastRequired<TArguments>, CuratedRequestOptions>
    : true;
};
type AssertAllMethods<TAudit extends { [TKey in keyof TAudit]: true }> = TAudit;

type _BundlesExport = Assert<Equal<BundlesCuratedRequestOptions, CuratedRequestOptions>>;
type _FocusedExport = Assert<Equal<FocusedCuratedRequestOptions, CuratedRequestOptions>>;
type _Contacts = AssertAllMethods<MethodRequestOptionAudit<ContactsBundle>>;
type _Invoices = AssertAllMethods<MethodRequestOptionAudit<InvoicesBundle>>;
type _Orders = AssertAllMethods<MethodRequestOptionAudit<OrdersBundle>>;
type _Vouchers = AssertAllMethods<MethodRequestOptionAudit<VouchersBundle>>;
type _CreditNotes = AssertAllMethods<MethodRequestOptionAudit<CreditNotesBundle>>;
type _Payments = AssertAllMethods<MethodRequestOptionAudit<PaymentsBundle>>;

const validOptions = {
  signal: new AbortController().signal,
  timeoutMs: 15_000,
  resourceVersion: "2.0",
  retry: { attempts: 1, unsafe: false },
  headers: { "X-Test": "value" },
  axios: { maxRedirects: 0 }
} satisfies CuratedRequestOptions;
void validOptions;

// @ts-expect-error timeoutMs is expressed in milliseconds as a number
const invalidTimeout: CuratedRequestOptions = { timeoutMs: "15000" };
void invalidTimeout;

// @ts-expect-error resource versions use "default" or a numeric major.minor pair
const invalidResourceVersion: CuratedRequestOptions = { resourceVersion: "latest" };
void invalidResourceVersion;
