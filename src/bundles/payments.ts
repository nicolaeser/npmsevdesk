import type { SevdeskClient } from "../client/sevdesk-client.js";
import { requireValue } from "../domain/normalizers.js";
import type { SevdeskIdInput, SevdeskReference } from "../types/references.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { paginate } from "../utils/pagination.js";
import { buildInvoiceBookingPayload, buildVoucherBookingPayload } from "./builders.js";
import { asRequest, forwardCompatibleRequest, numericId } from "./internal.js";
import type {
  BookingInput,
  CheckAccountSelector,
  CuratedRequestOptions,
  OperationData,
  OperationResult,
  VoucherBookingInput,
  WorkflowResult
} from "./types.js";
import { workflowWriteOptions, type WorkflowContext } from "./workflow.js";

export type PaymentTarget =
  | { readonly kind: "invoice"; readonly id: SevdeskIdInput; readonly date: number | Date }
  | { readonly kind: "creditNote"; readonly id: SevdeskIdInput; readonly date: number | Date }
  | { readonly kind: "voucher"; readonly id: SevdeskIdInput; readonly date: string | Date };

type InvoicePaymentTarget = Extract<PaymentTarget, { readonly kind: "invoice" }>;
type CreditNotePaymentTarget = Extract<PaymentTarget, { readonly kind: "creditNote" }>;
type VoucherPaymentTarget = Extract<PaymentTarget, { readonly kind: "voucher" }>;

type BookingFor<TTarget extends PaymentTarget> = TTarget extends InvoicePaymentTarget
  ? NonNullable<OperationData<"bookInvoice">>
  : TTarget extends CreditNotePaymentTarget
    ? NonNullable<OperationData<"bookCreditNote">>
    : TTarget extends VoucherPaymentTarget
      ? NonNullable<OperationData<"bookVoucher">>
      : never;

export interface PaymentInput {
  readonly amount: number;
  readonly type?: BookingInput["type"];
  readonly account: CheckAccountSelector | SevdeskReference<"CheckAccount">;
  readonly transaction?: SevdeskReference<"CheckAccountTransaction">;
  readonly createFeed?: boolean;
}

export interface PaymentWorkflowData<TTarget extends PaymentTarget = PaymentTarget> {
  readonly account: SevdeskReference<"CheckAccount">;
  readonly booking: BookingFor<TTarget>;
}

export type PaymentWorkflowOperationId =
  "getCheckAccounts" | "bookInvoice" | "bookCreditNote" | "bookVoucher";

type PaymentBookingOperationId<TTarget extends PaymentTarget> = TTarget extends InvoicePaymentTarget
  ? "bookInvoice"
  : TTarget extends CreditNotePaymentTarget
    ? "bookCreditNote"
    : "bookVoucher";

export type PaymentWorkflowResult<TTarget extends PaymentTarget> = TTarget extends PaymentTarget
  ? WorkflowResult<
      `payments.book.${TTarget["kind"]}`,
      PaymentWorkflowData<TTarget>,
      "getCheckAccounts" | PaymentBookingOperationId<TTarget>
    >
  : never;

export class PaymentsBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public book<const TTarget extends PaymentTarget>(
    target: TTarget,
    input: PaymentInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<PaymentWorkflowResult<TTarget>>;
  public async book(
    target: PaymentTarget,
    input: PaymentInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<
    WorkflowResult<
      `payments.book.${PaymentTarget["kind"]}`,
      PaymentWorkflowData,
      PaymentWorkflowOperationId
    >
  > {
    const workflow = `payments.book.${target.kind}` as const;
    const context = this.client.createWorkflowContext<typeof workflow, PaymentWorkflowOperationId>(
      `payments.book.${target.kind}`
    );
    const writeOptions = workflowWriteOptions(requestOptions);
    try {
      const account = await this.resolveAccount(context, input.account, requestOptions);
      const common = {
        amount: input.amount,
        type: input.type,
        checkAccount: account,
        checkAccountTransaction: input.transaction,
        createFeed: input.createFeed
      };
      if (target.kind === "voucher") {
        const booking = await context.step("book voucher payment", "bookVoucher", () =>
          this.client.raw.voucher.bookVoucher(
            forwardCompatibleRequest<"bookVoucher">(
              {
                path: { voucherId: numericId(target.id, "voucher") },
                body: buildVoucherBookingPayload({
                  ...common,
                  date: target.date
                } as VoucherBookingInput)
              },
              writeOptions
            )
          )
        );
        return context.result({
          account,
          booking: requireValue(booking.data, "voucher booking")
        });
      }
      if (target.kind === "invoice") {
        const booking = await context.step("book invoice payment", "bookInvoice", () =>
          this.client.raw.invoice.bookInvoice(
            forwardCompatibleRequest<"bookInvoice">(
              {
                path: { invoiceId: numericId(target.id, "invoice") },
                body: buildInvoiceBookingPayload({
                  ...common,
                  date: target.date
                } as BookingInput)
              },
              writeOptions
            )
          )
        );
        return context.result({
          account,
          booking: requireValue(booking.data, "invoice booking")
        });
      }
      const booking = await context.step("book credit-note payment", "bookCreditNote", () =>
        this.client.raw.creditNote.bookCreditNote(
          forwardCompatibleRequest<"bookCreditNote">(
            {
              path: { creditNoteId: numericId(target.id, "credit note") },
              body: buildInvoiceBookingPayload({
                ...common,
                date: target.date
              } as BookingInput)
            },
            writeOptions
          )
        )
      );
      return context.result({
        account,
        booking: requireValue(booking.data, "credit-note booking")
      });
    } catch (error) {
      throw context.error(error);
    }
  }
  private async resolveAccount(
    context: WorkflowContext<`payments.book.${PaymentTarget["kind"]}`, PaymentWorkflowOperationId>,
    selector: CheckAccountSelector | SevdeskReference<"CheckAccount">,
    requestOptions?: CuratedRequestOptions
  ): Promise<SevdeskReference<"CheckAccount">> {
    if ("objectName" in selector) return selector;
    type CheckAccount = NonNullable<OperationData<"getCheckAccounts">>[number];
    const accounts: CheckAccount[] = [];
    for await (const page of paginate<OperationResult<"getCheckAccounts">>(
      ({ countAll, limit, offset }) =>
        context.step(`resolve check account page at offset ${offset}`, "getCheckAccounts", () =>
          this.client.raw.checkAccount.getCheckAccounts(
            asRequest<"getCheckAccounts">(
              {
                query: { countAll, limit, offset }
              },
              requestOptions
            )
          )
        ),
      { limit: 1000 }
    )) {
      accounts.push(...page.data);
    }
    const matches = accounts.filter((account) => {
      if (selector.id !== undefined && String(account.id) !== String(selector.id)) return false;
      if (
        selector.name !== undefined &&
        account.name?.toLocaleLowerCase() !== selector.name.toLocaleLowerCase()
      ) {
        return false;
      }
      if (
        selector.iban !== undefined &&
        account.iban?.replaceAll(/\s/g, "").toUpperCase() !==
          selector.iban.replaceAll(/\s/g, "").toUpperCase()
      ) {
        return false;
      }
      if (
        selector.accountingNumber !== undefined &&
        account.accountingNumber !== selector.accountingNumber
      ) {
        return false;
      }
      if (selector.default && account.defaultAccount !== "1") return false;
      return true;
    });
    if (matches.length !== 1 || !matches[0]?.id) {
      throw new SevdeskConfigurationError(
        `Check-account selector matched ${matches.length} accounts; exactly one is required.`
      );
    }
    return { id: matches[0].id, objectName: "CheckAccount" };
  }
}
