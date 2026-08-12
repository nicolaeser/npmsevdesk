import { createHash } from "node:crypto";
import type { SevdeskInvoice } from "../domain/models.js";
import { SendType } from "../enums/domain-enums.js";
import { normalizeSevdeskId, type SevdeskId, type SevdeskIdInput } from "../types/references.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { buildDeliveryPayload, buildInvoiceBookingPayload } from "./builders.js";
import { numericId } from "./internal.js";
import type {
  BookingInput,
  FinalizingMarkSentDelivery,
  InvoiceEmailDelivery,
  InvoiceFinalizingPlan,
  NonEmptyReadonlyArray,
  WorkflowActionReceipt,
  WorkflowResult
} from "./types.js";
import { assertNewDocumentTailIsValid } from "./workflow.js";

export type InvoiceFinalizationWriteOperationId =
  "sendInvoiceViaEMail" | "invoiceSendBy" | "bookInvoice" | "invoiceEnshrine";

export type InvoiceFinalizationCheckpointOperationId =
  "createInvoiceByFactory" | "createInvoiceFromOrder" | InvoiceFinalizationWriteOperationId;

export type InvoiceFinalizationStepHint =
  | InvoiceFinalizationCheckpointOperationId
  | { readonly operationId: InvoiceFinalizationCheckpointOperationId };

export interface InvoiceFinalizationProbePolicy {
  readonly maxAttempts?: number;
  readonly delayMs?: number;
  readonly backoffFactor?: number;
  readonly maxDelayMs?: number;
  readonly deadline?: Date | number;
}

export interface InvoiceFinalizationProbeStepSummary {
  readonly operationId: "getInvoiceById";
  readonly status: number;
}

export interface InvoiceFinalizationHistory {
  readonly completedSteps: readonly InvoiceFinalizationStepHint[];
  readonly uncertainStep?: InvoiceFinalizationStepHint;
  readonly probeSteps?: readonly InvoiceFinalizationProbeStepSummary[];
}

export type InvoiceFinalizationCheckpointSeed<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> = InvoiceFinalizationHistory & {
  readonly invoiceId: SevdeskIdInput;
  readonly plan: TPlan;
};

export type PersistedInvoiceBooking = Omit<BookingInput, "date"> & {
  readonly date: number;
};

type PersistedInvoiceDelivery<TDelivery> = TDelivery extends {
  readonly channel: "email";
}
  ? InvoiceEmailDelivery
  : TDelivery extends { readonly channel: "mark-sent" }
    ? FinalizingMarkSentDelivery
    : never;

export type PersistedInvoiceFinalizationPlan<TPlan extends InvoiceFinalizingPlan> =
  TPlan extends unknown
    ? (TPlan extends { readonly delivery: infer TDelivery }
        ? { readonly delivery: PersistedInvoiceDelivery<TDelivery> }
        : { readonly delivery?: never }) &
        (TPlan extends { readonly booking: BookingInput }
          ? { readonly booking: PersistedInvoiceBooking }
          : { readonly booking?: never }) &
        (TPlan extends { readonly enshrine: true }
          ? { readonly enshrine: true }
          : { readonly enshrine?: false })
    : never;

declare const invoiceFinalizationFingerprintBrand: unique symbol;

export type InvoiceFinalizationFingerprint = string & {
  readonly [invoiceFinalizationFingerprintBrand]: "InvoiceFinalizationFingerprint";
};

export type InvoiceFinalizationCheckpoint<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> = {
  readonly version: 1;
  readonly fingerprint: InvoiceFinalizationFingerprint;
  readonly invoiceId: SevdeskId;
  readonly plan: TPlan;
  readonly completedSteps: readonly InvoiceFinalizationCheckpointOperationId[];
  readonly uncertainStep?: InvoiceFinalizationCheckpointOperationId;
  readonly probeSteps: readonly InvoiceFinalizationProbeStepSummary[];
};

export type InvoiceFinalizationInput<TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan> =
  InvoiceFinalizationCheckpoint<TPlan> & {
    readonly probe?: InvoiceFinalizationProbePolicy;
  };

export type ResumeInvoiceFinalizationInput<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> = InvoiceFinalizationInput<TPlan>;

export type InvoiceFinalizationBlockedReason =
  | "write-not-observed"
  | "server-state-conflict"
  | "booking-not-uniquely-verifiable"
  | "invoice-already-enshrined";

export type InvoiceFinalizationActionObservation<
  TOperationId extends InvoiceFinalizationWriteOperationId
> =
  | {
      readonly operationId: TOperationId;
      readonly state: "satisfied";
      readonly exact: false;
      readonly evidence: "delivery-state" | "booking-state" | "linked-transaction";
    }
  | {
      readonly operationId: TOperationId;
      readonly state: "satisfied";
      readonly exact: true;
      readonly evidence: "enshrined-state";
    }
  | {
      readonly operationId: TOperationId;
      readonly state: "ready";
      readonly exact: true;
      readonly evidence: "checkpoint-not-started";
    }
  | {
      readonly operationId: TOperationId;
      readonly state: "blocked";
      readonly exact: false;
      readonly reason: InvoiceFinalizationBlockedReason;
      readonly retryableByProbe: boolean;
      readonly message: string;
    };

type PropertyValue<TValue, TKey extends PropertyKey> = TValue extends unknown
  ? TKey extends keyof TValue
    ? TValue[TKey]
    : never
  : never;

type DeliveryOperationId<TDelivery> = TDelivery extends { readonly channel: "email" }
  ? "sendInvoiceViaEMail"
  : TDelivery extends { readonly channel: "mark-sent" }
    ? "invoiceSendBy"
    : never;

type DeliveryOperationIdForPlan<TPlan> = DeliveryOperationId<
  Exclude<PropertyValue<TPlan, "delivery">, undefined>
>;

export type InvoiceFinalizationOperationIdFor<TPlan = InvoiceFinalizingPlan> =
  | DeliveryOperationIdForPlan<TPlan>
  | ([Exclude<PropertyValue<TPlan, "booking">, undefined>] extends [never] ? never : "bookInvoice")
  | (true extends PropertyValue<TPlan, "enshrine"> ? "invoiceEnshrine" : never);

type InvoiceFinalizationActions<TPlan> = TPlan extends unknown
  ? (DeliveryOperationIdForPlan<TPlan> extends infer TOperationId extends
      InvoiceFinalizationWriteOperationId
      ? [TOperationId] extends [never]
        ? { readonly delivery?: never }
        : {
            readonly delivery: InvoiceFinalizationActionObservation<TOperationId>;
          }
      : { readonly delivery?: never }) &
      ([Exclude<PropertyValue<TPlan, "booking">, undefined>] extends [never]
        ? { readonly booking?: never }
        : {
            readonly booking: InvoiceFinalizationActionObservation<"bookInvoice">;
          }) &
      (true extends PropertyValue<TPlan, "enshrine">
        ? {
            readonly enshrinement: InvoiceFinalizationActionObservation<"invoiceEnshrine">;
          }
        : { readonly enshrinement?: never })
  : never;

type InvoiceFinalizationSatisfiedObservation<
  TOperationId extends InvoiceFinalizationWriteOperationId
> = Extract<InvoiceFinalizationActionObservation<TOperationId>, { readonly state: "satisfied" }>;

type CompleteInvoiceFinalizationActions<TPlan> = TPlan extends unknown
  ? (DeliveryOperationIdForPlan<TPlan> extends infer TOperationId extends
      InvoiceFinalizationWriteOperationId
      ? [TOperationId] extends [never]
        ? { readonly delivery?: never }
        : {
            readonly delivery: InvoiceFinalizationSatisfiedObservation<TOperationId>;
          }
      : { readonly delivery?: never }) &
      ([Exclude<PropertyValue<TPlan, "booking">, undefined>] extends [never]
        ? { readonly booking?: never }
        : {
            readonly booking: InvoiceFinalizationSatisfiedObservation<"bookInvoice">;
          }) &
      (true extends PropertyValue<TPlan, "enshrine">
        ? {
            readonly enshrinement: InvoiceFinalizationSatisfiedObservation<"invoiceEnshrine">;
          }
        : { readonly enshrinement?: never })
  : never;

export interface InvoiceFinalizationProbeSummary {
  readonly attempts: number;
  readonly observedAt: string;
  readonly maxAttempts: number;
}

export type InvoiceFinalizationReconciliation<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> = {
  readonly invoice: SevdeskInvoice;
  readonly checkpoint: InvoiceFinalizationCheckpoint<TPlan>;
  readonly actions: InvoiceFinalizationActions<TPlan>;
  readonly complete: boolean;
  readonly canResume: boolean;
  readonly needsMoreObservation: boolean;
  readonly nextOperationId?: InvoiceFinalizationOperationIdFor<TPlan>;
  readonly probe: InvoiceFinalizationProbeSummary;
};

export type CompleteInvoiceFinalizationReconciliation<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> = Omit<
  InvoiceFinalizationReconciliation<TPlan>,
  "actions" | "canResume" | "complete" | "needsMoreObservation" | "nextOperationId"
> & {
  readonly actions: CompleteInvoiceFinalizationActions<TPlan>;
  readonly canResume: true;
  readonly complete: true;
  readonly needsMoreObservation: false;
  readonly nextOperationId?: never;
};

export type IncompleteInvoiceFinalizationReconciliation<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> = Omit<InvoiceFinalizationReconciliation<TPlan>, "complete"> & {
  readonly complete: false;
};

export type ReconcileInvoiceFinalizationResult<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> = WorkflowResult<
  "invoices.reconcileFinalization",
  InvoiceFinalizationReconciliation<TPlan>,
  "getInvoiceById"
>;

export type InvoiceFinalizationExecutionReceipt<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> = {
  [TOperationId in InvoiceFinalizationOperationIdFor<TPlan>]: WorkflowActionReceipt<TOperationId>;
}[InvoiceFinalizationOperationIdFor<TPlan>];

export interface InvoiceFinalizationFailurePartial<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> {
  readonly reconciliation?: InvoiceFinalizationReconciliation<TPlan>;
  readonly executed: readonly InvoiceFinalizationExecutionReceipt<TPlan>[];
  readonly checkpoint: InvoiceFinalizationCheckpoint<TPlan>;
}

export type ResumeInvoiceFinalizationData<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> =
  | {
      readonly status: "already-complete";
      readonly completed: true;
      readonly reconciliation: CompleteInvoiceFinalizationReconciliation<TPlan>;
      readonly initialReconciliation: InvoiceFinalizationReconciliation<TPlan>;
      readonly executed: readonly [];
    }
  | {
      readonly status: "blocked";
      readonly completed: false;
      readonly reconciliation: IncompleteInvoiceFinalizationReconciliation<TPlan>;
      readonly initialReconciliation: InvoiceFinalizationReconciliation<TPlan>;
      readonly executed: readonly [];
    }
  | {
      readonly status: "resumed";
      readonly completed: true;
      readonly reconciliation: CompleteInvoiceFinalizationReconciliation<TPlan>;
      readonly initialReconciliation: InvoiceFinalizationReconciliation<TPlan>;
      readonly executed: NonEmptyReadonlyArray<InvoiceFinalizationExecutionReceipt<TPlan>>;
    }
  | {
      readonly status: "blocked-after-resume";
      readonly completed: false;
      readonly reconciliation: IncompleteInvoiceFinalizationReconciliation<TPlan>;
      readonly initialReconciliation: InvoiceFinalizationReconciliation<TPlan>;
      readonly executed: NonEmptyReadonlyArray<InvoiceFinalizationExecutionReceipt<TPlan>>;
    };

export type ResumeInvoiceFinalizationResult<
  TPlan extends InvoiceFinalizingPlan = InvoiceFinalizingPlan
> = WorkflowResult<
  "invoices.resumeFinalization",
  ResumeInvoiceFinalizationData<TPlan>,
  "getInvoiceById" | InvoiceFinalizationOperationIdFor<TPlan>
>;

export interface NormalizedInvoiceFinalizationProbePolicy {
  readonly maxAttempts: number;
  readonly delayMs: number;
  readonly backoffFactor: number;
  readonly maxDelayMs: number;
  readonly deadlineMs?: number;
}

export interface NormalizedInvoiceFinalizationCheckpoint {
  readonly version: 1;
  readonly fingerprint: InvoiceFinalizationFingerprint;
  readonly invoiceId: SevdeskId;
  readonly completedSteps: readonly InvoiceFinalizationCheckpointOperationId[];
  readonly completed: ReadonlySet<InvoiceFinalizationCheckpointOperationId>;
  readonly uncertain?: InvoiceFinalizationCheckpointOperationId;
  readonly probeSteps: readonly InvoiceFinalizationProbeStepSummary[];
}

const creationOperations = new Set<InvoiceFinalizationCheckpointOperationId>([
  "createInvoiceByFactory",
  "createInvoiceFromOrder"
]);

const writeOperations = new Set<InvoiceFinalizationWriteOperationId>([
  "sendInvoiceViaEMail",
  "invoiceSendBy",
  "bookInvoice",
  "invoiceEnshrine"
]);

export function normalizeInvoiceFinalizationProbePolicy(
  value: InvoiceFinalizationProbePolicy | undefined
): NormalizedInvoiceFinalizationProbePolicy {
  const maxAttempts = value?.maxAttempts ?? 3;
  const delayMs = value?.delayMs ?? 5_000;
  const backoffFactor = value?.backoffFactor ?? 1;
  const maxDelayMs = value?.maxDelayMs ?? Math.max(delayMs, 5_000);
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
    throw new SevdeskConfigurationError(
      "Finalization probe maxAttempts must be a positive integer."
    );
  }
  for (const [label, candidate] of [
    ["delayMs", delayMs],
    ["maxDelayMs", maxDelayMs]
  ] as const) {
    if (!Number.isFinite(candidate) || candidate < 0) {
      throw new SevdeskConfigurationError(`Finalization probe ${label} must be non-negative.`);
    }
  }
  if (!Number.isFinite(backoffFactor) || backoffFactor < 1) {
    throw new SevdeskConfigurationError("Finalization probe backoffFactor must be at least 1.");
  }
  if (maxDelayMs < delayMs) {
    throw new SevdeskConfigurationError(
      "Finalization probe maxDelayMs must be greater than or equal to delayMs."
    );
  }
  const deadlineMs = normalizeDeadline(value?.deadline);
  return {
    maxAttempts,
    delayMs,
    backoffFactor,
    maxDelayMs,
    ...(deadlineMs === undefined ? {} : { deadlineMs })
  };
}

export function createInvoiceFinalizationCheckpoint<const TPlan extends InvoiceFinalizingPlan>(
  seed: InvoiceFinalizationCheckpointSeed<TPlan>
): InvoiceFinalizationCheckpoint<PersistedInvoiceFinalizationPlan<TPlan>> {
  if (seed === null || typeof seed !== "object" || Array.isArray(seed)) {
    throw new SevdeskConfigurationError("Invoice finalization checkpoint input must be an object.");
  }
  assertInvoiceFinalizationPlan(seed.plan);
  const invoiceId = normalizeSevdeskId(seed.invoiceId, "invoice finalization checkpoint");
  const history = normalizeInvoiceFinalizationHistory(seed.plan, seed);
  const plan = persistedInvoiceFinalizationPlan(seed.plan);
  return {
    version: 1,
    fingerprint: invoiceFinalizationFingerprint(invoiceId, plan, history),
    invoiceId,
    plan,
    completedSteps: [...history.completedSteps],
    ...(history.uncertain === undefined ? {} : { uncertainStep: history.uncertain }),
    probeSteps: [...history.probeSteps]
  };
}

export function serializeInvoiceFinalizationCheckpoint(
  checkpoint: InvoiceFinalizationCheckpoint
): string {
  assertInvoiceFinalizationCheckpointObject(checkpoint);
  assertInvoiceFinalizationPlan(checkpoint.plan);
  const normalized = normalizeInvoiceFinalizationCheckpoint(checkpoint.plan, checkpoint);
  return JSON.stringify({
    version: normalized.version,
    fingerprint: normalized.fingerprint,
    invoiceId: normalized.invoiceId,
    plan: persistedInvoiceFinalizationPlan(checkpoint.plan),
    completedSteps: normalized.completedSteps,
    ...(normalized.uncertain === undefined ? {} : { uncertainStep: normalized.uncertain }),
    probeSteps: normalized.probeSteps
  } satisfies InvoiceFinalizationCheckpoint);
}

export function parseInvoiceFinalizationCheckpoint(
  serialized: string
): InvoiceFinalizationCheckpoint<InvoiceFinalizingPlan> {
  let value: unknown;
  try {
    value = JSON.parse(serialized) as unknown;
  } catch (cause) {
    throw new SevdeskConfigurationError("Invoice finalization checkpoint is not valid JSON.", {
      cause
    });
  }
  if (
    value === null ||
    typeof value !== "object" ||
    !("plan" in value) ||
    value.plan === null ||
    typeof value.plan !== "object"
  ) {
    throw new SevdeskConfigurationError("Invoice finalization checkpoint JSON is malformed.");
  }
  assertInvoiceFinalizationPlan(value.plan);
  const candidate = value as InvoiceFinalizationCheckpoint<InvoiceFinalizingPlan>;
  const normalized = normalizeInvoiceFinalizationCheckpoint(candidate.plan, candidate);
  return {
    version: normalized.version,
    fingerprint: normalized.fingerprint,
    invoiceId: normalized.invoiceId,
    plan: persistedInvoiceFinalizationPlan(candidate.plan),
    completedSteps: [...normalized.completedSteps],
    ...(normalized.uncertain === undefined ? {} : { uncertainStep: normalized.uncertain }),
    probeSteps: [...normalized.probeSteps]
  };
}

export function updateInvoiceFinalizationCheckpoint<const TPlan extends InvoiceFinalizingPlan>(
  checkpoint: InvoiceFinalizationCheckpoint<TPlan>,
  history: InvoiceFinalizationHistory
): InvoiceFinalizationCheckpoint<TPlan> {
  assertInvoiceFinalizationCheckpointObject(checkpoint);
  const current = normalizeInvoiceFinalizationCheckpoint(checkpoint.plan, checkpoint);
  const normalized = normalizeInvoiceFinalizationHistory(checkpoint.plan, {
    ...history,
    probeSteps: history.probeSteps ?? checkpoint.probeSteps
  });
  assertMonotonicInvoiceFinalizationHistory(current, normalized);
  const plan = persistedInvoiceFinalizationPlan(checkpoint.plan);
  return {
    version: current.version,
    fingerprint: invoiceFinalizationFingerprint(current.invoiceId, plan, normalized),
    invoiceId: current.invoiceId,
    plan: checkpoint.plan,
    completedSteps: [...normalized.completedSteps],
    ...(normalized.uncertain === undefined ? {} : { uncertainStep: normalized.uncertain }),
    probeSteps: [...normalized.probeSteps]
  };
}

export function normalizeInvoiceFinalizationCheckpoint<TPlan extends InvoiceFinalizingPlan>(
  plan: TPlan,
  checkpoint: InvoiceFinalizationCheckpoint<TPlan>
): NormalizedInvoiceFinalizationCheckpoint {
  assertInvoiceFinalizationCheckpointObject(checkpoint);
  assertInvoiceFinalizationPlan(plan);
  if (checkpoint.version !== 1) {
    throw new SevdeskConfigurationError("Unsupported invoice finalization checkpoint version.");
  }
  const invoiceId = normalizeSevdeskId(checkpoint.invoiceId, "invoice finalization checkpoint");
  const history = normalizeInvoiceFinalizationHistory(plan, checkpoint);
  const expectedFingerprint = invoiceFinalizationFingerprint(
    invoiceId,
    persistedInvoiceFinalizationPlan(plan),
    history
  );
  if (checkpoint.fingerprint !== expectedFingerprint) {
    throw new SevdeskConfigurationError(
      "Invoice finalization checkpoint does not belong to this invoice and finalization plan."
    );
  }
  return {
    version: 1,
    fingerprint: checkpoint.fingerprint,
    invoiceId,
    ...history
  };
}

function normalizeInvoiceFinalizationHistory<TPlan extends InvoiceFinalizingPlan>(
  plan: TPlan,
  checkpoint: InvoiceFinalizationHistory
): Pick<
  NormalizedInvoiceFinalizationCheckpoint,
  "completedSteps" | "completed" | "uncertain" | "probeSteps"
> {
  const expected = expectedOperations(plan);
  if (!Array.isArray(checkpoint.completedSteps)) {
    throw new SevdeskConfigurationError(
      "Invoice finalization requires an explicit completedSteps array; use [] only when no operation was started."
    );
  }
  validateProbeSteps(checkpoint.probeSteps);
  const completedValues = checkpoint.completedSteps.map(operationIdFromHint);
  const uncertain =
    checkpoint.uncertainStep === undefined
      ? undefined
      : operationIdFromHint(checkpoint.uncertainStep);
  const completed = new Set<InvoiceFinalizationCheckpointOperationId>();
  for (const operationId of completedValues) {
    assertCheckpointOperation(operationId);
    if (completed.has(operationId)) {
      throw new SevdeskConfigurationError(
        `Invoice finalization checkpoint contains duplicate operation ${operationId}.`
      );
    }
    completed.add(operationId);
  }
  if (uncertain !== undefined) {
    assertCheckpointOperation(uncertain);
    if (completed.has(uncertain)) {
      throw new SevdeskConfigurationError(
        `Invoice finalization operation ${uncertain} cannot be both completed and uncertain.`
      );
    }
  }
  const completedCreations = completedValues.filter((operationId) =>
    creationOperations.has(operationId)
  );
  if (completedCreations.length > 1) {
    throw new SevdeskConfigurationError(
      "Invoice finalization checkpoint cannot contain two invoice creation operations."
    );
  }
  const creationIndex = completedValues.findIndex((operationId) =>
    creationOperations.has(operationId)
  );
  if (creationIndex > 0) {
    throw new SevdeskConfigurationError(
      "An invoice creation operation must be the first completed checkpoint step."
    );
  }
  const requested = new Set<InvoiceFinalizationCheckpointOperationId>(expected);
  for (const operationId of completed) {
    if (!creationOperations.has(operationId) && !requested.has(operationId)) {
      throw new SevdeskConfigurationError(
        `Invoice finalization checkpoint operation ${operationId} is not part of the requested plan.`
      );
    }
  }
  if (uncertain !== undefined && !creationOperations.has(uncertain) && !requested.has(uncertain)) {
    throw new SevdeskConfigurationError(
      `Uncertain invoice finalization operation ${uncertain} is not part of the requested plan.`
    );
  }
  const completedTail = completedValues.filter(
    (operationId): operationId is InvoiceFinalizationWriteOperationId =>
      !creationOperations.has(operationId)
  );
  const prefixLength = completedTail.length;
  if (completedTail.some((operationId, index) => operationId !== expected[index])) {
    throw new SevdeskConfigurationError(
      "Invoice finalization completedSteps must be an ordered prefix of the requested plan."
    );
  }
  if (
    uncertain !== undefined &&
    !creationOperations.has(uncertain) &&
    uncertain !== expected[prefixLength]
  ) {
    throw new SevdeskConfigurationError(
      "The uncertain invoice finalization step must immediately follow completedSteps."
    );
  }
  if (
    creationOperations.has(uncertain as InvoiceFinalizationCheckpointOperationId) &&
    (prefixLength > 0 || completedCreations.length > 0)
  ) {
    throw new SevdeskConfigurationError(
      "A creation step cannot be uncertain after finalization writes completed."
    );
  }
  return {
    completedSteps: [...completedValues],
    completed,
    ...(uncertain === undefined ? {} : { uncertain }),
    probeSteps: [...(checkpoint.probeSteps ?? [])]
  };
}

export function expectedOperations<TPlan extends InvoiceFinalizingPlan>(
  plan: TPlan
): readonly InvoiceFinalizationWriteOperationId[] {
  const operations: InvoiceFinalizationWriteOperationId[] = [];
  if (plan.delivery !== undefined) {
    operations.push(plan.delivery.channel === "email" ? "sendInvoiceViaEMail" : "invoiceSendBy");
  }
  if (plan.booking !== undefined) operations.push("bookInvoice");
  if (plan.enshrine === true) operations.push("invoiceEnshrine");
  return operations;
}

export function reconcileInvoiceFinalizationState<TPlan extends InvoiceFinalizingPlan>(
  invoice: SevdeskInvoice,
  plan: TPlan,
  checkpoint: NormalizedInvoiceFinalizationCheckpoint,
  probe: InvoiceFinalizationProbeSummary,
  probeSteps: readonly InvoiceFinalizationProbeStepSummary[]
): InvoiceFinalizationReconciliation<TPlan> {
  const mutableActions: Record<string, InvoiceFinalizationActionObservation<never>> = {};
  if (plan.delivery !== undefined) {
    const operationId = plan.delivery.channel === "email" ? "sendInvoiceViaEMail" : "invoiceSendBy";
    mutableActions.delivery = deliveryObservation(
      invoice,
      plan.delivery,
      operationId,
      checkpoint
    ) as never;
  }
  if (plan.booking !== undefined) {
    mutableActions.booking = bookingObservation(invoice, plan.booking, checkpoint) as never;
  }
  if (plan.enshrine === true) {
    mutableActions.enshrinement = enshrinementObservation(invoice, checkpoint) as never;
  }
  const observations = Object.values(
    mutableActions
  ) as InvoiceFinalizationActionObservation<InvoiceFinalizationWriteOperationId>[];
  if (hasEnshrinedState(invoice) && observations.some((item) => item.state !== "satisfied")) {
    for (const [key, observation] of Object.entries(mutableActions)) {
      if (observation.state === "satisfied") continue;
      mutableActions[key] = blocked(
        observation.operationId,
        "invoice-already-enshrined",
        false,
        "The invoice is already enshrined, so an earlier missing action cannot be executed safely."
      ) as never;
    }
  }
  const finalObservations = Object.values(
    mutableActions
  ) as InvoiceFinalizationActionObservation<InvoiceFinalizationWriteOperationId>[];
  const complete = finalObservations.every((item) => item.state === "satisfied");
  const blockedAction = finalObservations.find((item) => item.state === "blocked");
  const readyAction = finalObservations.find((item) => item.state === "ready");
  const canonicalCompleted: InvoiceFinalizationCheckpointOperationId[] =
    checkpoint.completedSteps.filter((operationId) => creationOperations.has(operationId));
  if (
    checkpoint.uncertain === "createInvoiceByFactory" ||
    checkpoint.uncertain === "createInvoiceFromOrder"
  ) {
    canonicalCompleted.push(checkpoint.uncertain);
  }
  for (const operationId of expectedOperations(plan)) {
    const observedSatisfied = finalObservations.some(
      (observation) => observation.operationId === operationId && observation.state === "satisfied"
    );
    if (!checkpoint.completed.has(operationId) && !observedSatisfied) break;
    canonicalCompleted.push(operationId);
  }
  const uncertaintyWasResolved =
    checkpoint.uncertain !== undefined && canonicalCompleted.includes(checkpoint.uncertain);
  const canonicalUncertain = uncertaintyWasResolved ? undefined : checkpoint.uncertain;
  const canonicalHistory = {
    completedSteps: canonicalCompleted,
    completed: new Set(canonicalCompleted),
    ...(canonicalUncertain === undefined ? {} : { uncertain: canonicalUncertain }),
    probeSteps: [...checkpoint.probeSteps, ...probeSteps]
  };
  return {
    invoice,
    checkpoint: {
      version: checkpoint.version,
      fingerprint: invoiceFinalizationFingerprint(
        checkpoint.invoiceId,
        persistedInvoiceFinalizationPlan(plan),
        canonicalHistory
      ),
      invoiceId: checkpoint.invoiceId,
      plan,
      completedSteps: canonicalCompleted,
      ...(canonicalUncertain === undefined ? {} : { uncertainStep: canonicalUncertain }),
      probeSteps: canonicalHistory.probeSteps
    },
    actions: mutableActions as InvoiceFinalizationActions<TPlan>,
    complete,
    canResume: blockedAction === undefined,
    needsMoreObservation:
      blockedAction?.state === "blocked" && blockedAction.retryableByProbe === true,
    ...(readyAction === undefined
      ? {}
      : { nextOperationId: readyAction.operationId as InvoiceFinalizationOperationIdFor<TPlan> }),
    probe
  };
}

function deliveryObservation(
  invoice: SevdeskInvoice,
  delivery: InvoiceFinalizingPlan["delivery"],
  operationId: "sendInvoiceViaEMail" | "invoiceSendBy",
  checkpoint: NormalizedInvoiceFinalizationCheckpoint
): InvoiceFinalizationActionObservation<typeof operationId> {
  if (delivery === undefined) {
    throw new SevdeskConfigurationError("Missing invoice delivery plan.");
  }
  const expectedSendType =
    delivery.channel === "email" ? SendType.EMAIL : buildDeliveryPayload(delivery).sendType;
  const actualSendType = invoice.semantic.sendType?.code ?? null;
  const statusCommitted = invoice.statusCode >= 200;
  if (statusCommitted && actualSendType === expectedSendType) {
    return {
      operationId,
      state: "satisfied",
      exact: false,
      evidence: "delivery-state"
    };
  }
  const history = historyFor(operationId, checkpoint);
  const noDeliveryState = invoice.statusCode < 200 && actualSendType === null && !invoice.sendDate;
  if (history === "not-started" && noDeliveryState) {
    return {
      operationId,
      state: "ready",
      exact: true,
      evidence: "checkpoint-not-started"
    };
  }
  return blocked(
    operationId,
    history === "not-started" ? "server-state-conflict" : "write-not-observed",
    history !== "not-started",
    history === "not-started"
      ? "The invoice already has delivery state that conflicts with the requested channel."
      : "The previous delivery write is not yet reflected by the invoice state; it will not be replayed."
  );
}

function bookingObservation(
  invoice: SevdeskInvoice,
  booking: BookingInput,
  checkpoint: NormalizedInvoiceFinalizationCheckpoint
): InvoiceFinalizationActionObservation<"bookInvoice"> {
  const history = historyFor("bookInvoice", checkpoint);
  const expectedTransactionId =
    booking.checkAccountTransaction === undefined
      ? undefined
      : numericId(booking.checkAccountTransaction.id, "check account transaction");
  const transactions = invoice.checkAccountTransactions ?? [];
  const linkedTransaction =
    expectedTransactionId === undefined
      ? undefined
      : transactions.find((transaction) => Number(transaction.id) === expectedTransactionId);
  if (linkedTransaction !== undefined) {
    return {
      operationId: "bookInvoice",
      state: "satisfied",
      exact: false,
      evidence: "linked-transaction"
    };
  }
  if (history === "completed" && expectedTransactionId === undefined) {
    if (hasExistingBookingState(invoice, transactions.length)) {
      return {
        operationId: "bookInvoice",
        state: "satisfied",
        exact: false,
        evidence: "booking-state"
      };
    }
    return blocked(
      "bookInvoice",
      "write-not-observed",
      true,
      "The acknowledged booking is not reflected by compatible invoice payment state yet."
    );
  }
  if (history !== "not-started") {
    if (expectedTransactionId === undefined) {
      return blocked(
        "bookInvoice",
        "booking-not-uniquely-verifiable",
        false,
        "A booking without an explicit checkAccountTransaction cannot be uniquely identified after a timeout."
      );
    }
    return blocked(
      "bookInvoice",
      "write-not-observed",
      true,
      "The expected check-account transaction is not linked yet; the booking write will not be replayed."
    );
  }
  if (hasExistingBookingState(invoice, transactions.length)) {
    return blocked(
      "bookInvoice",
      "server-state-conflict",
      false,
      "The invoice already has payment state that cannot be attributed safely to this booking plan."
    );
  }
  return {
    operationId: "bookInvoice",
    state: "ready",
    exact: true,
    evidence: "checkpoint-not-started"
  };
}

function enshrinementObservation(
  invoice: SevdeskInvoice,
  checkpoint: NormalizedInvoiceFinalizationCheckpoint
): InvoiceFinalizationActionObservation<"invoiceEnshrine"> {
  if (hasEnshrinedState(invoice)) {
    return {
      operationId: "invoiceEnshrine",
      state: "satisfied",
      exact: true,
      evidence: "enshrined-state"
    };
  }
  const history = historyFor("invoiceEnshrine", checkpoint);
  if (history === "not-started") {
    return {
      operationId: "invoiceEnshrine",
      state: "ready",
      exact: true,
      evidence: "checkpoint-not-started"
    };
  }
  return blocked(
    "invoiceEnshrine",
    "write-not-observed",
    true,
    "The previous enshrinement write is not reflected by server state; it will not be replayed."
  );
}

function historyFor(
  operationId: InvoiceFinalizationWriteOperationId,
  checkpoint: NormalizedInvoiceFinalizationCheckpoint
): "completed" | "uncertain" | "not-started" {
  if (checkpoint.completed.has(operationId)) return "completed";
  if (checkpoint.uncertain === operationId) return "uncertain";
  return "not-started";
}

function blocked<TOperationId extends InvoiceFinalizationWriteOperationId>(
  operationId: TOperationId,
  reason: InvoiceFinalizationBlockedReason,
  retryableByProbe: boolean,
  message: string
): InvoiceFinalizationActionObservation<TOperationId> {
  return {
    operationId,
    state: "blocked",
    exact: false,
    reason,
    retryableByProbe,
    message
  };
}

function hasEnshrinedState(invoice: SevdeskInvoice): boolean {
  return typeof invoice.enshrined === "string" && invoice.enshrined.trim().length > 0;
}

function hasExistingBookingState(invoice: SevdeskInvoice, transactionCount: number): boolean {
  return (
    transactionCount > 0 ||
    (typeof invoice.paidAmount === "number" && invoice.paidAmount !== 0) ||
    invoice.statusCode === 750 ||
    invoice.statusCode === 1000
  );
}

function operationIdFromHint(
  value: InvoiceFinalizationStepHint
): InvoiceFinalizationCheckpointOperationId {
  if (typeof value === "string") return value;
  if (value === null || typeof value !== "object" || typeof value.operationId !== "string") {
    throw new SevdeskConfigurationError(
      "Invoice finalization step hints must be operation IDs or objects with operationId."
    );
  }
  return value.operationId;
}

function assertCheckpointOperation(
  value: string
): asserts value is InvoiceFinalizationCheckpointOperationId {
  if (
    !creationOperations.has(value as InvoiceFinalizationCheckpointOperationId) &&
    !writeOperations.has(value as InvoiceFinalizationWriteOperationId)
  ) {
    throw new SevdeskConfigurationError(
      `Unknown invoice finalization checkpoint operation ${value}.`
    );
  }
}

function validateProbeSteps(
  value: readonly InvoiceFinalizationProbeStepSummary[] | undefined
): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    throw new SevdeskConfigurationError("Invoice finalization probeSteps must be an array.");
  }
  for (const step of value) {
    if (
      step === null ||
      typeof step !== "object" ||
      step.operationId !== "getInvoiceById" ||
      !Number.isInteger(step.status) ||
      step.status < 100 ||
      step.status > 599
    ) {
      throw new SevdeskConfigurationError(
        "Invoice finalization probeSteps may contain only getInvoiceById HTTP summaries."
      );
    }
  }
}

function invoiceFinalizationFingerprint<TPlan extends InvoiceFinalizingPlan>(
  invoiceId: SevdeskId,
  plan: TPlan,
  history: Pick<NormalizedInvoiceFinalizationCheckpoint, "completedSteps" | "uncertain">
): InvoiceFinalizationFingerprint {
  const serialized = JSON.stringify(
    stableJsonValue({
      version: 1,
      invoiceId,
      plan,
      completedSteps: history.completedSteps,
      ...(history.uncertain === undefined ? {} : { uncertainStep: history.uncertain })
    })
  );
  const digest = createHash("sha256").update(serialized).digest("hex");
  return `ifc-v1-${digest}` as InvoiceFinalizationFingerprint;
}

function assertMonotonicInvoiceFinalizationHistory(
  current: NormalizedInvoiceFinalizationCheckpoint,
  next: Pick<
    NormalizedInvoiceFinalizationCheckpoint,
    "completedSteps" | "completed" | "uncertain" | "probeSteps"
  >
): void {
  const completedPrefixPreserved = current.completedSteps.every(
    (operationId, index) => next.completedSteps[index] === operationId
  );
  if (!completedPrefixPreserved) {
    throw new SevdeskConfigurationError(
      "Invoice finalization checkpoint updates cannot remove or reorder completed operations."
    );
  }
  if (
    current.uncertain !== undefined &&
    next.uncertain !== current.uncertain &&
    !next.completed.has(current.uncertain)
  ) {
    throw new SevdeskConfigurationError(
      "Invoice finalization checkpoint updates cannot clear an unresolved uncertain operation."
    );
  }
  const probesPreserved = current.probeSteps.every((step, index) => {
    const candidate = next.probeSteps[index];
    return candidate?.operationId === step.operationId && candidate.status === step.status;
  });
  if (!probesPreserved) {
    throw new SevdeskConfigurationError(
      "Invoice finalization checkpoint updates cannot remove or reorder probe summaries."
    );
  }
}

function persistedInvoiceFinalizationPlan<const TPlan extends InvoiceFinalizingPlan>(
  plan: TPlan
): PersistedInvoiceFinalizationPlan<TPlan> {
  const delivery =
    plan.delivery === undefined
      ? undefined
      : plan.delivery.channel === "email"
        ? { channel: "email" as const, ...buildDeliveryPayload(plan.delivery) }
        : { channel: "mark-sent" as const, ...buildDeliveryPayload(plan.delivery) };
  const booking = plan.booking === undefined ? undefined : buildInvoiceBookingPayload(plan.booking);
  return {
    ...(delivery === undefined ? {} : { delivery }),
    ...(booking === undefined ? {} : { booking }),
    ...(plan.enshrine === true ? { enshrine: true as const } : {})
  } as unknown as PersistedInvoiceFinalizationPlan<TPlan>;
}

function stableJsonValue(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableJsonValue(item)])
    );
  }
  throw new SevdeskConfigurationError(
    "Invoice finalization plan contains a value that cannot be checkpointed."
  );
}

function assertInvoiceFinalizationPlan(value: unknown): asserts value is InvoiceFinalizingPlan {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskConfigurationError("Invoice finalization plan must be an object.");
  }
  const plan = value as Record<string, unknown>;
  if (plan.enshrine !== undefined && typeof plan.enshrine !== "boolean") {
    throw new SevdeskConfigurationError("Invoice finalization enshrine must be a boolean.");
  }
  if (plan.delivery !== undefined) assertInvoiceFinalizationDelivery(plan.delivery);
  if (plan.booking !== undefined) assertInvoiceFinalizationBooking(plan.booking);
  assertNewDocumentTailIsValid(plan as InvoiceFinalizingPlan, "invoice");
}

function assertInvoiceFinalizationCheckpointObject(
  value: unknown
): asserts value is InvoiceFinalizationCheckpoint {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskConfigurationError("Invoice finalization checkpoint must be an object.");
  }
}

function assertInvoiceFinalizationDelivery(value: unknown): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskConfigurationError("Invoice finalization delivery must be an object.");
  }
  const delivery = value as Record<string, unknown>;
  if (delivery.channel !== "email" && delivery.channel !== "mark-sent") {
    throw new SevdeskConfigurationError(
      'Invoice finalization delivery channel must be "email" or "mark-sent".'
    );
  }
  if (delivery.channel === "email") {
    for (const field of ["toEmail", "subject", "text"] as const) {
      if (typeof delivery[field] !== "string") {
        throw new SevdeskConfigurationError(`Invoice email delivery ${field} must be a string.`);
      }
    }
    assertOptionalBoolean(delivery.copy, "Invoice email delivery copy");
    assertOptionalBoolean(delivery.sendXml, "Invoice email delivery sendXml");
    assertOptionalStringList(delivery.ccEmail, "Invoice email delivery ccEmail");
    assertOptionalStringList(delivery.bccEmail, "Invoice email delivery bccEmail");
    assertOptionalAttachmentList(
      delivery.additionalAttachments,
      "Invoice email delivery additionalAttachments"
    );
    return;
  }
  assertOptionalBoolean(delivery.sendDraft, "Invoice mark-sent delivery sendDraft");
}

function assertInvoiceFinalizationBooking(value: unknown): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskConfigurationError("Invoice finalization booking must be an object.");
  }
  const booking = value as Record<string, unknown>;
  if (typeof booking.amount !== "number") {
    throw new SevdeskConfigurationError("Invoice finalization booking amount must be a number.");
  }
  if (typeof booking.date !== "number" && !(booking.date instanceof Date)) {
    throw new SevdeskConfigurationError(
      "Invoice finalization booking date must be a Date or Unix timestamp."
    );
  }
  assertFinalizationReference(booking.checkAccount, "CheckAccount", "booking checkAccount");
  if (booking.checkAccountTransaction !== undefined) {
    assertFinalizationReference(
      booking.checkAccountTransaction,
      "CheckAccountTransaction",
      "booking checkAccountTransaction"
    );
  }
  assertOptionalBoolean(booking.createFeed, "Invoice finalization booking createFeed");
}

function assertFinalizationReference(
  value: unknown,
  objectName: "CheckAccount" | "CheckAccountTransaction",
  label: string
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskConfigurationError(`Invoice finalization ${label} must be a reference.`);
  }
  const reference = value as Record<string, unknown>;
  if (reference.objectName !== objectName) {
    throw new SevdeskConfigurationError(
      `Invoice finalization ${label} objectName must be ${objectName}.`
    );
  }
  if (typeof reference.id !== "number" && typeof reference.id !== "string") {
    throw new SevdeskConfigurationError(`Invoice finalization ${label} id is invalid.`);
  }
  normalizeSevdeskId(reference.id, label);
}

function assertOptionalBoolean(value: unknown, label: string): void {
  if (value !== undefined && typeof value !== "boolean") {
    throw new SevdeskConfigurationError(`${label} must be a boolean.`);
  }
}

function assertOptionalStringList(value: unknown, label: string): void {
  if (
    value !== undefined &&
    typeof value !== "string" &&
    (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
  ) {
    throw new SevdeskConfigurationError(`${label} must be a string or string array.`);
  }
}

function assertOptionalAttachmentList(value: unknown, label: string): void {
  if (
    value !== undefined &&
    typeof value !== "string" &&
    (!Array.isArray(value) ||
      value.some(
        (item) => typeof item !== "string" && (typeof item !== "number" || !Number.isFinite(item))
      ))
  ) {
    throw new SevdeskConfigurationError(
      `${label} must be a string or an array of strings and finite numbers.`
    );
  }
}

function normalizeDeadline(value: Date | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  const deadline = value instanceof Date ? value.getTime() : value;
  if (!Number.isFinite(deadline) || deadline <= 0) {
    throw new SevdeskConfigurationError(
      "Finalization probe deadline must be a valid Date or positive epoch milliseconds."
    );
  }
  return deadline;
}
