import type { SevdeskClient } from "../client/sevdesk-client.js";
import type { SevdeskInvoice } from "../domain/models.js";
import { normalizeInvoice, requireSingle, requireValue } from "../domain/normalizers.js";
import type { DomainResult } from "../domain/results.js";
import type { ReminderEligibilityFailureReasonValue as ReminderEligibilityFailureReason } from "../enums/domain-enums.js";
import type { SevdeskId, SevdeskIdInput } from "../types/references.js";
import { mapResultData } from "../utils/result.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../utils/errors.js";
import { buildDeliveryPayload, buildEntityReference } from "./builders.js";
import { asRequest, forwardCompatibleRequest, numericId, requireEntityId } from "./internal.js";
import type {
  CuratedRequestOptions,
  InvoiceEmailDelivery,
  InvoiceFinalizingDelivery,
  MarkSentDelivery,
  OperationData,
  WorkflowResult
} from "./types.js";
import { workflowWriteOptions, type WorkflowContext } from "./workflow.js";

export type ReminderEligibilityOperationId =
  "getInvoiceById" | "getOpenInvoiceReminderDebit" | "getLastDunning";

export type ReminderWorkflowOperationId =
  | ReminderEligibilityOperationId
  | "createInvoiceReminder"
  | "sendInvoiceViaEMail"
  | "invoiceSendBy";

type ReminderDeliveryOperationId<TDelivery> = TDelivery extends {
  readonly channel: "email";
}
  ? "sendInvoiceViaEMail"
  : TDelivery extends { readonly channel: "mark-sent" }
    ? "invoiceSendBy"
    : never;

type PropertyValue<TValue, TKey extends PropertyKey> = TValue extends unknown
  ? TKey extends keyof TValue
    ? TValue[TKey]
    : never
  : never;

export type ReminderCreateWorkflowOperationId<TInput> =
  | ReminderEligibilityOperationId
  | "createInvoiceReminder"
  | ReminderDeliveryOperationId<Exclude<PropertyValue<TInput, "delivery">, undefined>>;

export interface ReminderEligibilityOptions {
  readonly asOf?: Date;
}

export interface ReminderCreateInput extends ReminderEligibilityOptions {
  readonly invoiceId: SevdeskIdInput;
  readonly delivery?: InvoiceFinalizingDelivery;
  readonly booking?: never;
  readonly enshrine?: never;
}

export interface ReminderEligibilityData {
  readonly eligible: true;
  readonly invoice: SevdeskInvoice;
  readonly lastReminder?: SevdeskInvoice;
  readonly lastDunning?: SevdeskInvoice;
  readonly outstanding: number;
  readonly dueAt: Date;
  readonly checkedAt: Date;
  readonly overdueByDays: number;
}

export interface ReminderIneligibilityData {
  readonly eligible: false;
  readonly reason: ReminderEligibilityFailureReason;
  readonly message: string;
  readonly invoice: SevdeskInvoice;
  readonly lastReminder?: SevdeskInvoice;
  readonly lastDunning?: SevdeskInvoice;
  readonly outstanding?: number;
  readonly dueAt?: Date;
  readonly checkedAt: Date;
}

export type ReminderEligibility = ReminderEligibilityData | ReminderIneligibilityData;

type ReminderEmailDeliveryData = NonNullable<OperationData<"sendInvoiceViaEMail">>;
type ReminderDeliveryData = ReminderEmailDeliveryData | SevdeskInvoice;

export type ReminderDeliveryDataFor<TDelivery> = TDelivery extends {
  readonly channel: "email";
}
  ? ReminderEmailDeliveryData
  : TDelivery extends { readonly channel: "mark-sent" }
    ? SevdeskInvoice
    : ReminderDeliveryData;

export interface ReminderWorkflowData {
  readonly eligibility: ReminderEligibilityData;
  readonly reminder: SevdeskInvoice;
  readonly delivery?: ReminderDeliveryData;
}

export type ReminderWorkflowFor<TInput> = ReminderWorkflowData &
  (TInput extends { readonly delivery: infer TDelivery }
    ? { readonly delivery: ReminderDeliveryDataFor<TDelivery> }
    : object);

export type ReminderEligibilityWorkflowResult = WorkflowResult<
  "reminders.checkEligibility",
  ReminderEligibility,
  ReminderEligibilityOperationId
>;

export type ReminderCreateWorkflowResult<TInput> = WorkflowResult<
  "reminders.create",
  ReminderWorkflowFor<TInput>,
  ReminderCreateWorkflowOperationId<TInput>
>;

export type LastReminderResult = DomainResult<"getLastDunning", SevdeskInvoice | undefined>;

export class SevdeskReminderEligibilityError extends SevdeskConfigurationError {
  public readonly reason: ReminderEligibilityFailureReason;
  public readonly invoiceId: number;
  public readonly invoice: SevdeskInvoice;
  public readonly lastReminder?: SevdeskInvoice;
  public readonly lastDunning?: SevdeskInvoice;
  public readonly outstanding?: number;
  public readonly dueAt?: Date;
  public readonly checkedAt: Date;
  public constructor(
    message: string,
    input: {
      readonly reason: ReminderEligibilityFailureReason;
      readonly invoiceId: number;
      readonly invoice: SevdeskInvoice;
      readonly lastReminder?: SevdeskInvoice;
      readonly outstanding?: number;
      readonly dueAt?: Date;
      readonly checkedAt: Date;
    }
  ) {
    super(message);
    this.reason = input.reason;
    this.invoiceId = input.invoiceId;
    this.invoice = input.invoice;
    this.checkedAt = input.checkedAt;
    if (input.lastReminder !== undefined) {
      this.lastReminder = input.lastReminder;
      this.lastDunning = input.lastReminder;
    }
    if (input.outstanding !== undefined) this.outstanding = input.outstanding;
    if (input.dueAt !== undefined) this.dueAt = input.dueAt;
  }
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      reason: this.reason,
      invoiceId: this.invoiceId,
      invoiceStatus: this.invoice.status,
      invoiceStatusCode: this.invoice.statusCode,
      lastReminderId: this.lastReminder?.id,
      outstanding: this.outstanding,
      dueAt: this.dueAt?.toISOString(),
      checkedAt: this.checkedAt.toISOString()
    };
  }
}

interface ReminderWorkflowPartial {
  readonly eligibility?: ReminderEligibilityData;
  readonly reminder?: SevdeskInvoice;
  readonly delivery?: ReminderDeliveryData;
}

type ReminderWorkflowName = "reminders.checkEligibility" | "reminders.create";

export class RemindersBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async getLastForInvoice(
    invoiceId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<LastReminderResult> {
    const result = await this.client.raw.invoice.getLastDunning(
      asRequest<"getLastDunning">(
        {
          path: { invoiceId: numericId(invoiceId, "invoice") }
        },
        requestOptions
      )
    );
    const lastDunningValue =
      result.json !== null &&
      typeof result.json === "object" &&
      Object.hasOwn(result.json, "objects")
        ? result.data
        : undefined;
    return mapResultData(result, normalizeOptionalLastDunning(lastDunningValue));
  }
  public async checkEligibility(
    invoiceId: SevdeskIdInput,
    options: ReminderEligibilityOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<ReminderEligibilityWorkflowResult> {
    const checkedAt = checkedCalendarDate(options.asOf);
    const normalizedInvoiceId = numericId(invoiceId, "invoice");
    const context = this.client.createWorkflowContext<
      "reminders.checkEligibility",
      ReminderWorkflowOperationId,
      ReminderWorkflowPartial
    >("reminders.checkEligibility");
    try {
      const eligibility = await this.evaluateEligibility(
        context,
        normalizedInvoiceId,
        checkedAt,
        requestOptions
      );
      return context.result(eligibility) as ReminderEligibilityWorkflowResult;
    } catch (error) {
      throw context.error(error, { partial: {} });
    }
  }
  public async create<const TInput extends ReminderCreateInput>(
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<ReminderCreateWorkflowResult<TInput>> {
    if (input.delivery !== undefined) buildDeliveryPayload(input.delivery);
    const checkedAt = checkedCalendarDate(input.asOf);
    const normalizedInvoiceId = numericId(input.invoiceId, "invoice");
    const context = this.client.createWorkflowContext<
      "reminders.create",
      ReminderWorkflowOperationId,
      ReminderWorkflowPartial
    >("reminders.create");
    let partial: ReminderWorkflowPartial = {};
    try {
      const eligibility = await this.evaluateEligibility(
        context,
        normalizedInvoiceId,
        checkedAt,
        requestOptions
      );
      if (!eligibility.eligible) {
        throw reminderEligibilityError(normalizedInvoiceId, eligibility);
      }
      partial = { eligibility };
      const invoice = buildEntityReference("Invoice", normalizedInvoiceId);
      const created = await context.step("create invoice reminder", "createInvoiceReminder", () =>
        this.client.raw.invoice.createInvoiceReminder(
          asRequest<"createInvoiceReminder">(
            {
              query: {
                "invoice[id]": invoice.id,
                "invoice[objectName]": invoice.objectName
              },
              body: { invoice }
            },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      const reminder = normalizeInvoice(requireValue(created.data, "created invoice reminder"));
      const reminderId = requireEntityId(reminder, "invoice reminder");
      partial = { eligibility, reminder };
      const delivery = await this.deliver(context, reminderId, input.delivery, requestOptions);
      if (delivery !== undefined) {
        partial = { eligibility, reminder, delivery };
      }
      const result = context.result({
        eligibility,
        reminder,
        ...(delivery === undefined ? {} : { delivery })
      });
      return refineReminderWorkflow(result, input);
    } catch (error) {
      if (error instanceof SevdeskReminderEligibilityError) throw error;
      throw context.error(error, { partial });
    }
  }
  private async evaluateEligibility<TWorkflow extends ReminderWorkflowName>(
    context: WorkflowContext<TWorkflow, ReminderWorkflowOperationId, ReminderWorkflowPartial>,
    normalizedInvoiceId: number,
    checkedAt: Date,
    requestOptions?: CuratedRequestOptions
  ): Promise<ReminderEligibility> {
    const invoiceResult = await context.step("load source invoice", "getInvoiceById", async () => {
      const result = await this.client.raw.invoice.getInvoiceById(
        asRequest<"getInvoiceById">(
          {
            path: { invoiceId: normalizedInvoiceId }
          },
          requestOptions
        )
      );
      return mapResultData(result, normalizeInvoice(requireSingle(result.data, "source invoice")));
    });
    const invoice = invoiceResult.data;
    if (invoice.status !== "OPEN" && invoice.status !== "PARTIALLY_PAID") {
      return reminderIneligibility(
        `Invoice status "${invoice.status}" is not eligible for a reminder.`,
        {
          reason: "INELIGIBLE_STATUS",
          invoice,
          checkedAt
        }
      );
    }
    const reference = buildEntityReference("Invoice", normalizedInvoiceId);
    const debitResult = await context.step(
      "load open reminder debit",
      "getOpenInvoiceReminderDebit",
      () =>
        this.client.raw.invoice.getOpenInvoiceReminderDebit(
          asRequest<"getOpenInvoiceReminderDebit">(
            {
              query: { invoice: reference }
            },
            requestOptions
          )
        )
    );
    const outstanding = requireFiniteAmount(
      requireValue(debitResult.data, "open invoice reminder debit")
    );
    const lastReminderResult = await context.step("load last reminder", "getLastDunning", () =>
      this.getLastForInvoice(normalizedInvoiceId, requestOptions)
    );
    const lastReminder = lastReminderResult.data;
    if (outstanding <= 0) {
      return reminderIneligibility("The invoice has no positive outstanding reminder balance.", {
        reason: "NO_OUTSTANDING_BALANCE",
        invoice,
        ...(lastReminder === undefined ? {} : { lastReminder }),
        outstanding,
        checkedAt
      });
    }
    if (lastReminder?.status === "DRAFT") {
      return reminderIneligibility(
        "The last reminder is still a draft and must be explicitly delivered before another reminder can be created.",
        {
          reason: "UNSENT_LAST_REMINDER",
          invoice,
          lastReminder,
          outstanding,
          checkedAt
        }
      );
    }
    const dueAt = reminderDueDate(invoice, lastReminder);
    if (dueAt === undefined) {
      return reminderIneligibility(
        "The reminder due date cannot be determined from reminderDeadline or invoiceDate/timeToPay.",
        {
          reason: "UNDETERMINABLE_DUE_DATE",
          invoice,
          ...(lastReminder === undefined ? {} : { lastReminder }),
          outstanding,
          checkedAt
        }
      );
    }
    const overdueByDays = calendarDayDifference(checkedAt, dueAt);
    if (overdueByDays <= 0) {
      return reminderIneligibility("The invoice is not overdue on the selected calendar day.", {
        reason: "NOT_OVERDUE",
        invoice,
        ...(lastReminder === undefined ? {} : { lastReminder }),
        outstanding,
        dueAt,
        checkedAt
      });
    }
    return {
      eligible: true,
      invoice,
      ...(lastReminder === undefined ? {} : { lastReminder, lastDunning: lastReminder }),
      outstanding,
      dueAt,
      checkedAt,
      overdueByDays
    };
  }
  private async deliver<TWorkflow extends ReminderWorkflowName>(
    context: WorkflowContext<TWorkflow, ReminderWorkflowOperationId, ReminderWorkflowPartial>,
    reminderId: SevdeskId,
    delivery: InvoiceFinalizingDelivery | undefined,
    requestOptions?: CuratedRequestOptions
  ): Promise<ReminderDeliveryData | undefined> {
    if (delivery === undefined) return undefined;
    const writeOptions = workflowWriteOptions(requestOptions);
    if (delivery.channel === "email") {
      const sent = await context.step("send reminder by email", "sendInvoiceViaEMail", () =>
        this.client.raw.invoice.sendInvoiceViaEMail(
          forwardCompatibleRequest<"sendInvoiceViaEMail">(
            {
              path: { invoiceId: numericId(reminderId, "invoice reminder") },
              body: buildDeliveryPayload(delivery as InvoiceEmailDelivery)
            },
            writeOptions
          )
        )
      );
      return requireValue(sent.data, "reminder email delivery");
    }
    const sent = await context.step("mark reminder as sent", "invoiceSendBy", () =>
      this.client.raw.invoice.invoiceSendBy(
        forwardCompatibleRequest<"invoiceSendBy">(
          {
            path: { invoiceId: numericId(reminderId, "invoice reminder") },
            body: buildDeliveryPayload(delivery as MarkSentDelivery)
          },
          writeOptions
        )
      )
    );
    return normalizeInvoice(requireValue(sent.data, "sent invoice reminder"));
  }
}

function refineReminderWorkflow<const TInput extends ReminderCreateInput>(
  result: WorkflowResult<"reminders.create", ReminderWorkflowData, ReminderWorkflowOperationId>,
  input: TInput
): ReminderCreateWorkflowResult<TInput> {
  if (input.delivery !== undefined && result.data.delivery === undefined) {
    throw new SevdeskResponseValidationError(
      "The reminder delivery step completed without response data.",
      { value: result.toSummary() }
    );
  }
  return result as ReminderCreateWorkflowResult<TInput>;
}

function requireFiniteAmount(value: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned a non-finite open invoice reminder debit.",
      { value }
    );
  }
  return value;
}

function reminderIneligibility(
  message: string,
  input: {
    readonly reason: ReminderEligibilityFailureReason;
    readonly invoice: SevdeskInvoice;
    readonly lastReminder?: SevdeskInvoice;
    readonly outstanding?: number;
    readonly dueAt?: Date;
    readonly checkedAt: Date;
  }
): ReminderIneligibilityData {
  return {
    eligible: false,
    reason: input.reason,
    message,
    invoice: input.invoice,
    ...(input.lastReminder === undefined
      ? {}
      : { lastReminder: input.lastReminder, lastDunning: input.lastReminder }),
    ...(input.outstanding === undefined ? {} : { outstanding: input.outstanding }),
    ...(input.dueAt === undefined ? {} : { dueAt: input.dueAt }),
    checkedAt: input.checkedAt
  };
}

function reminderEligibilityError(
  invoiceId: number,
  eligibility: ReminderIneligibilityData
): SevdeskReminderEligibilityError {
  return new SevdeskReminderEligibilityError(eligibility.message, {
    reason: eligibility.reason,
    invoiceId,
    invoice: eligibility.invoice,
    ...(eligibility.lastReminder === undefined ? {} : { lastReminder: eligibility.lastReminder }),
    ...(eligibility.outstanding === undefined ? {} : { outstanding: eligibility.outstanding }),
    ...(eligibility.dueAt === undefined ? {} : { dueAt: eligibility.dueAt }),
    checkedAt: eligibility.checkedAt
  });
}

function checkedCalendarDate(value: Date | undefined): Date {
  const checkedAt = value ?? new Date();
  if (Number.isNaN(checkedAt.getTime())) {
    throw new SevdeskConfigurationError("Reminder eligibility asOf must be a valid Date.");
  }
  return utcCalendarDate(
    checkedAt.getUTCFullYear(),
    checkedAt.getUTCMonth() + 1,
    checkedAt.getUTCDate()
  );
}

function reminderDueDate(
  invoice: SevdeskInvoice,
  lastReminder: SevdeskInvoice | undefined
): Date | undefined {
  if (lastReminder !== undefined) {
    return calendarDate(lastReminder.reminderDeadline);
  }
  const invoiceDate = calendarDate(invoice.invoiceDate);
  const timeToPay = nonNegativeInteger(invoice.timeToPay);
  if (invoiceDate === undefined || timeToPay === undefined) return undefined;
  const dueAt = new Date(invoiceDate.getTime());
  dueAt.setUTCDate(dueAt.getUTCDate() + timeToPay);
  return Number.isFinite(dueAt.getTime()) ? dueAt : undefined;
}

function calendarDate(value: unknown): Date | undefined {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value <= 0) return undefined;
    const timestamp = Math.abs(value) < 100_000_000_000 ? value * 1000 : value;
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return realisticUtcCalendarDate(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth() + 1,
      parsed.getUTCDate()
    );
  }
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (normalized.length === 0) return undefined;
  const german = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(normalized);
  if (german) {
    const day = Number(german[1]);
    const month = Number(german[2]);
    const year = Number(german[3]);
    return realisticUtcCalendarDate(year, month, day);
  }
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (isoDate) {
    return realisticUtcCalendarDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]));
  }
  if (/^\d{10}(?:\d{3})?$/.test(normalized)) {
    return calendarDate(Number(normalized));
  }
  if (
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
      normalized
    )
  ) {
    return undefined;
  }
  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp)) return undefined;
  const parsed = new Date(timestamp);
  return realisticUtcCalendarDate(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth() + 1,
    parsed.getUTCDate()
  );
}

function realisticUtcCalendarDate(year: number, month: number, day: number): Date | undefined {
  if (year < 2000 || year > 9999) return undefined;
  const result = utcCalendarDate(year, month, day);
  return result.getUTCFullYear() === year &&
    result.getUTCMonth() + 1 === month &&
    result.getUTCDate() === day
    ? result
    : undefined;
}

function utcCalendarDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function nonNegativeInteger(value: unknown): number | undefined {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "string" && value.trim().length === 0)
  ) {
    return undefined;
  }
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : undefined;
}

function calendarDayDifference(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 86_400_000);
}

function normalizeOptionalLastDunning(value: unknown): SevdeskInvoice | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    if (value.length !== 1 || value[0] === undefined) {
      throw new SevdeskResponseValidationError(
        "sevdesk returned more than one invoice for the last reminder.",
        { value }
      );
    }
    return normalizeInvoice(value[0] as never);
  }
  return normalizeInvoice(value as never);
}
