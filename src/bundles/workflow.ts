import type { operations } from "../types/openapi.js";
import type { ResponseJsonFor, TransportBodyFor } from "../types/operation.js";
import type { SevdeskResult } from "../types/result.js";
import {
  SevdeskConfigurationError,
  SevdeskError,
  type SevdeskDiagnosticOptions
} from "../utils/errors.js";
import { emitLog, type ResolvedLogging } from "../utils/logging.js";
import { redact } from "../utils/redact.js";
import type {
  BookingInput,
  CompensationResult,
  CuratedRequestOptions,
  FinalizingDelivery,
  OperationResult,
  WorkflowActionReceipt,
  WorkflowResult,
  WorkflowStep,
  WorkflowStepFor,
  WorkflowStepSummary
} from "./types.js";
import { buildDeliveryPayload, buildInvoiceBookingPayload } from "./builders.js";

export function workflowWriteOptions(
  requestOptions: CuratedRequestOptions | undefined
): CuratedRequestOptions {
  return requestOptions === undefined ? { retry: false } : { ...requestOptions, retry: false };
}

export class SevdeskWorkflowError<
  TPartial = unknown,
  TWorkflow extends string = string,
  TOperationId extends keyof operations = keyof operations
> extends SevdeskError {
  public readonly workflow: TWorkflow;
  public readonly failedOperationId: TOperationId | "initialization";
  public readonly completedSteps: readonly WorkflowStep<TOperationId>[];
  public readonly partial: TPartial;
  public readonly compensation: readonly CompensationResult[];
  public readonly retrySafe: boolean;
  public constructor(input: {
    workflow: TWorkflow;
    failedOperationId: TOperationId | "initialization";
    completedSteps: readonly WorkflowStep<TOperationId>[];
    partial: TPartial;
    compensation?: readonly CompensationResult[];
    retrySafe?: boolean;
    cause: unknown;
  }) {
    super(`Workflow "${input.workflow}" failed at operation "${input.failedOperationId}".`, {
      cause: input.cause
    });
    this.workflow = input.workflow;
    this.failedOperationId = input.failedOperationId;
    this.completedSteps = input.completedSteps;
    this.partial = input.partial;
    this.compensation = input.compensation ?? [];
    this.retrySafe = input.retrySafe ?? false;
  }
  public toJSON(): Record<string, unknown> {
    return this.toDiagnostic();
  }
  public toDiagnostic(options: SevdeskDiagnosticOptions = {}): Record<string, unknown> {
    const diagnostic: Record<string, unknown> = {
      name: this.name,
      message: this.message,
      workflow: this.workflow,
      failedOperationId: this.failedOperationId,
      completedSteps: this.completedSteps.map(({ name, operationId, status }) => ({
        name,
        operationId,
        status
      })),
      compensation: this.compensation.map(({ operationId, success }) => ({
        operationId,
        success
      })),
      retrySafe: this.retrySafe
    };
    if (options.includeData === true) {
      diagnostic.completedSteps = this.completedSteps.map(
        ({ name, operationId, status, json }) => ({
          name,
          operationId,
          status,
          json: redact(json)
        })
      );
      diagnostic.partial = redact(this.partial);
      diagnostic.compensation = this.compensation.map(({ operationId, success, error }) => ({
        operationId,
        success,
        ...(error === undefined ? {} : { error: redact(error) })
      }));
    }
    return diagnostic;
  }
}

export class WorkflowContext<
  TWorkflow extends string = string,
  TOperationId extends keyof operations = keyof operations,
  TPartial = unknown
> {
  public readonly steps: WorkflowStep<TOperationId>[] = [];
  public currentOperationId: TOperationId | "initialization" = "initialization";
  public partial: unknown;
  private readonly startedAt = Date.now();
  public constructor(
    public readonly workflow: TWorkflow,
    private readonly logging: ResolvedLogging | undefined = undefined
  ) {}
  public async step<
    TStepOperationId extends TOperationId,
    TJson extends ResponseJsonFor<operations[TStepOperationId]>,
    TData,
    TBody extends TransportBodyFor<operations[TStepOperationId]>
  >(
    name: string,
    operationId: TStepOperationId,
    action: () => Promise<SevdeskResult<TJson, TData, TBody>>
  ): Promise<SevdeskResult<TJson, TData, TBody>> {
    this.currentOperationId = operationId;
    const stepStartedAt = Date.now();
    const result = await action();
    const step = {
      name,
      operationId,
      status: result.response.status,
      data: result.objects,
      json: result.json,
      raw: result.raw
    } as WorkflowStepFor<TStepOperationId>;
    this.steps.push(step as WorkflowStep<TOperationId>);
    this.partial = result.objects;
    if (this.logging) {
      emitLog(this.logging, {
        type: "workflow-step",
        message: `Workflow "${this.workflow}" step "${name}" completed`,
        operationId: String(operationId),
        status: result.response.status,
        durationMs: Date.now() - stepStartedAt,
        details: {
          workflow: this.workflow,
          step: name,
          stepIndex: this.steps.length - 1,
          completedSteps: this.steps.length
        }
      });
    }
    return result;
  }
  public result<TData>(data: TData): WorkflowResult<TWorkflow, TData, TOperationId> {
    const steps = [...this.steps];
    return {
      workflow: this.workflow,
      data,
      steps,
      json: steps.map((step) => step.json),
      raw: steps.map((step) => step.raw),
      toJSON: () => steps.map((step) => step.json),
      toSummary: () => ({
        workflow: this.workflow,
        data,
        steps: steps.map(({ name, operationId, status, json }) => ({
          name,
          operationId,
          status,
          json
        })) as WorkflowStepSummary<TOperationId>[]
      })
    };
  }
  public error<TErrorPartial = TPartial>(
    cause: unknown,
    options?: {
      partial?: TErrorPartial;
      compensation?: readonly CompensationResult[];
      retrySafe?: boolean;
    }
  ): SevdeskWorkflowError<TErrorPartial, TWorkflow, TOperationId> {
    if (this.logging) {
      const causeType = cause instanceof Error ? cause.name : typeof cause;
      emitLog(this.logging, {
        type: "workflow-error",
        message: `Workflow "${this.workflow}" failed at "${String(this.currentOperationId)}"`,
        operationId: String(this.currentOperationId),
        durationMs: Date.now() - this.startedAt,
        details: {
          workflow: this.workflow,
          failedOperationId: this.currentOperationId,
          completedStepCount: this.steps.length,
          completedOperations: this.steps.map((step) => String(step.operationId)),
          causeType
        }
      });
    }
    return new SevdeskWorkflowError({
      workflow: this.workflow,
      failedOperationId: this.currentOperationId,
      completedSteps: [...this.steps],
      partial: (options?.partial ?? this.partial) as TErrorPartial,
      ...(options?.compensation === undefined ? {} : { compensation: options.compensation }),
      ...(options?.retrySafe === undefined ? {} : { retrySafe: options.retrySafe }),
      cause
    });
  }
}

export function workflowActionReceipt<TOperationId extends keyof operations>(
  operationId: TOperationId,
  result: OperationResult<TOperationId>
): WorkflowActionReceipt<TOperationId> {
  return {
    performed: true,
    operationId,
    status: result.response.status,
    data: result.data,
    json: result.json,
    raw: result.raw,
    response: result.response
  };
}

export function assertNewDocumentTailIsValid(
  input: {
    readonly delivery?: FinalizingDelivery;
    readonly booking?: BookingInput;
    readonly enshrine?: boolean;
  },
  label: string,
  options: { readonly allowNoAction?: boolean } = {}
): void {
  if (input.delivery === undefined && input.booking === undefined) {
    if (input.enshrine !== true && options.allowNoAction === true) return;
    throw new SevdeskConfigurationError(
      `A create-and-finalise ${label} workflow requires a delivery or booking action.`
    );
  }
  if (sendsAsDraft(input.delivery)) {
    throw new SevdeskConfigurationError(
      `A create-and-deliver ${label} workflow cannot use sendDraft: true because that leaves the document in draft state.`
    );
  }
  if (input.delivery !== undefined) buildDeliveryPayload(input.delivery);
  if (input.booking !== undefined) buildInvoiceBookingPayload(input.booking);
  if (!input.enshrine) return;
  const deliveryLeavesDraft =
    input.delivery?.channel === "email" ||
    (input.delivery?.channel === "mark-sent" && !sendsAsDraft(input.delivery));
  if (!deliveryLeavesDraft && !input.booking) {
    throw new SevdeskConfigurationError(
      `A newly created draft ${label} cannot be enshrined without a delivery that commits its status or a booking.`
    );
  }
}

function sendsAsDraft(delivery: FinalizingDelivery | undefined): boolean {
  if (delivery?.channel !== "mark-sent") return false;
  const sendDraft: unknown = delivery.sendDraft;
  return sendDraft === true;
}
