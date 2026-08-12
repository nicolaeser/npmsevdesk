import type { SevdeskClient } from "../client/sevdesk-client.js";
import {
  mapCreatedOrderResult,
  mapOrderListResult,
  mapOrderResult,
  mapSentOrderResult
} from "../domain/result-mappers.js";
import type { SevdeskOrder } from "../domain/models.js";
import { requireValue } from "../domain/normalizers.js";
import type {
  CreatedOrder,
  CreatedOrderResult,
  OrderListResult,
  OrderResult,
  SentOrderResult
} from "../domain/results.js";
import { OrderStatus } from "../enums/domain-enums.js";
import type { SevdeskId, SevdeskIdInput, SevdeskReference } from "../types/references.js";
import type { components } from "../types/openapi.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { validateSevdeskDateString } from "../utils/validation.js";
import { buildDeliveryPayload, buildEntityReference, buildOrderPayload } from "./builders.js";
import type { OrderEmbedInput } from "./embed.js";
import { orderListQuery } from "./filters.js";
import type { DocumentLayoutInput, LayoutApplyOptions, SetLayoutWorkflowResult } from "./layout.js";
import {
  mapCreatedContractNoteResult,
  mapCreatedPackingListResult,
  mapPdfResult,
  type CreatedContractNoteResult,
  type CreatedPackingListResult,
  type OrderPdfOptions,
  type OrderPdfResult
} from "./document-output.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericId,
  requireEntityId,
  wireReference
} from "./internal.js";
import type {
  CuratedRequestOptions,
  MarkSentDelivery,
  OperationData,
  OperationResult,
  OrderFactoryInput,
  OrderListOptions,
  StandardEmailDelivery,
  StandardFinalizingDelivery,
  WorkflowActionReceipt,
  WorkflowResult
} from "./types.js";
import {
  assertNewDocumentTailIsValid,
  workflowActionReceipt,
  workflowWriteOptions,
  type WorkflowContext
} from "./workflow.js";

export interface OrderUpdateInput {
  readonly header?: string;
  readonly headText?: string | null;
  readonly footText?: string | null;
  readonly address?: string | null;
  readonly orderDate?: string;
  readonly currency?: string;
  readonly customerInternalNote?: string | null;
  readonly contact?: SevdeskReference<"Contact">;
  readonly contactPerson?: SevdeskReference<"SevUser">;
}

type OrderWireUpdate = components["schemas"]["Model_OrderUpdate"];

export type OrderUpdateWorkflowOperationId = "getOrderById" | "updateOrder";

export interface OrderUpdateWorkflowData {
  readonly before: SevdeskOrder;
  readonly receipt: WorkflowActionReceipt<"updateOrder">;
  readonly order: SevdeskOrder;
}

export interface OrderUpdateWorkflowPartial {
  readonly before?: SevdeskOrder;
  readonly receipt?: WorkflowActionReceipt<"updateOrder">;
}

export type OrderUpdateWorkflowResult = WorkflowResult<
  "orders.update",
  OrderUpdateWorkflowData,
  OrderUpdateWorkflowOperationId
>;

export type OrderDeleteResult = WorkflowActionReceipt<"deleteOrder">;

type OrderDeliveryData = NonNullable<OperationData<"sendorderViaEMail">> | SevdeskOrder;

export type OrderWorkflowOperationId = "createOrder" | "sendorderViaEMail" | "orderSendBy";

export type OrderWorkflowOperationIdFor<TDelivery> =
  | "createOrder"
  | (TDelivery extends { readonly channel: "email" }
      ? "sendorderViaEMail"
      : TDelivery extends { readonly channel: "mark-sent" }
        ? "orderSendBy"
        : never);

export type OrderDeliveryDataFor<TDelivery> = TDelivery extends {
  readonly channel: "email";
}
  ? NonNullable<OperationData<"sendorderViaEMail">>
  : TDelivery extends { readonly channel: "mark-sent" }
    ? SevdeskOrder
    : OrderDeliveryData;

export interface OrderWorkflowData<TDelivery = StandardFinalizingDelivery> {
  readonly created: CreatedOrder;
  readonly delivery: OrderDeliveryDataFor<TDelivery>;
}

export type CreateAndDeliverOrderWorkflowResult<TInput extends { readonly delivery: unknown }> =
  WorkflowResult<
    "orders.createAndDeliver",
    OrderWorkflowData<TInput["delivery"]>,
    OrderWorkflowOperationIdFor<TInput["delivery"]>
  >;

export class OrdersBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async list(
    options: OrderListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<OrderListResult> {
    const result = await this.client.raw.order.getOrders(
      asRequest<"getOrders">(
        {
          extraQuery: orderListQuery(options)
        },
        requestOptions
      )
    );
    return mapOrderListResult(result);
  }
  public async get(
    orderId: SevdeskIdInput,
    embed: readonly OrderEmbedInput[] = [],
    requestOptions?: CuratedRequestOptions
  ): Promise<OrderResult> {
    const result = await this.client.raw.order.getOrderById(
      asRequest<"getOrderById">(
        {
          path: { orderId: numericId(orderId, "order") },
          ...(embed.length ? { extraQuery: { embed } } : {})
        },
        requestOptions
      )
    );
    return mapOrderResult(result);
  }
  public async update(
    orderId: SevdeskIdInput,
    input: OrderUpdateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<OrderUpdateWorkflowResult> {
    const id = numericId(orderId, "order");
    const body = buildOrderUpdatePayload(input);
    const context = this.client.createWorkflowContext<
      "orders.update",
      OrderUpdateWorkflowOperationId,
      OrderUpdateWorkflowPartial
    >("orders.update");
    let before: SevdeskOrder;
    try {
      const current = await context.step("load order before update", "getOrderById", () =>
        this.get(id, [], requestOptions)
      );
      before = current.data;
    } catch (error) {
      throw context.error(error, { partial: {} });
    }
    assertDraftOrder(before);
    const partial: {
      before: SevdeskOrder;
      receipt?: WorkflowActionReceipt<"updateOrder">;
    } = { before };
    try {
      const updated = await context.step("update order", "updateOrder", () =>
        this.client.raw.order.updateOrder(
          forwardCompatibleRequest<"updateOrder">(
            { path: { orderId: id }, body },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      const receipt = workflowActionReceipt("updateOrder", updated);
      partial.receipt = receipt;
      const hydrated = await context.step("load order after update", "getOrderById", () =>
        this.get(id, [], requestOptions)
      );
      return context.result({ before, receipt, order: hydrated.data });
    } catch (error) {
      throw context.error(error, { partial });
    }
  }
  public async delete(
    orderId: SevdeskIdInput,
    options: { readonly confirm: true },
    requestOptions?: CuratedRequestOptions
  ): Promise<OrderDeleteResult> {
    if (options.confirm !== true) {
      throw new SevdeskConfigurationError("orders.delete requires { confirm: true }.");
    }
    const id = numericId(orderId, "order");
    const current = await this.get(id, [], requestOptions);
    assertDraftOrder(current.data);
    const result = await this.client.raw.order.deleteOrder(
      asRequest<"deleteOrder">({ path: { orderId: id } }, workflowWriteOptions(requestOptions))
    );
    return workflowActionReceipt("deleteOrder", result);
  }
  public async create(
    input: OrderFactoryInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedOrderResult> {
    const result = await this.client.raw.order.createOrder(
      forwardCompatibleRequest<"createOrder">({ body: buildOrderPayload(input) }, requestOptions)
    );
    return mapCreatedOrderResult(result);
  }
  public async createAndDeliver<
    const TInput extends OrderFactoryInput & {
      readonly delivery: StandardFinalizingDelivery;
      readonly booking?: never;
      readonly enshrine?: never;
    }
  >(
    input: TInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateAndDeliverOrderWorkflowResult<TInput>> {
    assertNewDocumentTailIsValid(input, "order");
    const context = this.client.createWorkflowContext<
      "orders.createAndDeliver",
      OrderWorkflowOperationId
    >("orders.createAndDeliver");
    try {
      const created = await context.step("create order with positions", "createOrder", () =>
        this.create(input, workflowWriteOptions(requestOptions))
      );
      const orderId = requireEntityId(created.data, "order");
      const delivered = await this.deliver(context, orderId, input.delivery, requestOptions);
      return context.result({
        created: created.data,
        delivery: delivered
      }) as CreateAndDeliverOrderWorkflowResult<TInput>;
    } catch (error) {
      throw context.error(error);
    }
  }
  public sendByEmail(
    orderId: SevdeskIdInput,
    delivery: StandardEmailDelivery,
    requestOptions?: CuratedRequestOptions
  ): Promise<OperationResult<"sendorderViaEMail">> {
    return this.client.raw.order.sendorderViaEMail(
      forwardCompatibleRequest<"sendorderViaEMail">(
        {
          path: { orderId: numericId(orderId, "order") },
          body: buildDeliveryPayload(delivery)
        },
        requestOptions
      )
    );
  }
  public async markAsSent(
    orderId: SevdeskIdInput,
    delivery: MarkSentDelivery = { channel: "mark-sent" },
    requestOptions?: CuratedRequestOptions
  ): Promise<SentOrderResult> {
    const result = await this.client.raw.order.orderSendBy(
      forwardCompatibleRequest<"orderSendBy">(
        {
          path: { orderId: numericId(orderId, "order") },
          body: buildDeliveryPayload(delivery)
        },
        requestOptions
      )
    );
    return mapSentOrderResult(result);
  }
  public async createPackingList(
    orderId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedPackingListResult> {
    const order = buildEntityReference("Order", orderId);
    const result = await this.client.raw.order.createPackingListFromOrder(
      asRequest<"createPackingListFromOrder">(
        {
          query: {
            "order[id]": order.id,
            "order[objectName]": order.objectName
          },
          body: order
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapCreatedPackingListResult(result);
  }
  public async createContractNote(
    orderId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedContractNoteResult> {
    const order = buildEntityReference("Order", orderId);
    const result = await this.client.raw.order.createContractNoteFromOrder(
      asRequest<"createContractNoteFromOrder">(
        {
          query: {
            "order[id]": order.id,
            "order[objectName]": order.objectName
          },
          body: order
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapCreatedContractNoteResult(result);
  }
  public setLayout<const TLayout extends DocumentLayoutInput>(
    orderId: SevdeskIdInput,
    layout: TLayout,
    options: LayoutApplyOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<SetLayoutWorkflowResult<"order", TLayout>> {
    return this.client.layout.setOrderLayout(orderId, layout, options, requestOptions);
  }
  public async getPdf(
    orderId: SevdeskIdInput,
    options: OrderPdfOptions,
    requestOptions?: CuratedRequestOptions
  ): Promise<OrderPdfResult> {
    if (options.confirmCommit !== true) {
      throw new SevdeskConfigurationError(
        "sevdesk can commit an order while creating its PDF; pass { confirmCommit: true }."
      );
    }
    const download = options.download ?? true;
    const result = await this.client.raw.order.orderGetPdf(
      asRequest<"orderGetPdf">(
        {
          path: { orderId: numericId(orderId, "order") },
          query: {
            download,
            preventSendBy: !(options.markAsDownloaded ?? false)
          }
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapPdfResult(result, "orderGetPdf", download);
  }
  private async deliver(
    context: WorkflowContext<"orders.createAndDeliver", OrderWorkflowOperationId>,
    orderId: SevdeskId,
    delivery: StandardFinalizingDelivery,
    requestOptions?: CuratedRequestOptions
  ): Promise<OrderDeliveryData> {
    const writeOptions = workflowWriteOptions(requestOptions);
    if (delivery.channel === "email") {
      const result = await context.step("send order by email", "sendorderViaEMail", () =>
        this.sendByEmail(orderId, delivery, writeOptions)
      );
      return requireValue(result.data, "order delivery");
    }
    const result = await context.step("mark order as sent", "orderSendBy", () =>
      this.markAsSent(orderId, delivery, writeOptions)
    );
    return result.data;
  }
}

function assertDraftOrder(document: {
  readonly status: string;
  readonly statusCode: number;
}): void {
  if (document.status === "DRAFT" || document.statusCode === OrderStatus.DRAFT) return;
  throw new SevdeskConfigurationError(
    `Only draft orders can be updated or deleted through the curated API (status=${document.status}, code=${document.statusCode}).`
  );
}

function buildOrderUpdatePayload(
  input: OrderUpdateInput
): ReturnType<typeof forwardCompatibleBody<OrderWireUpdate>> {
  if (Object.keys(input).length === 0) {
    throw new SevdeskConfigurationError("Order update must change at least one field.");
  }
  if (input.orderDate !== undefined) {
    validateSevdeskDateString(input.orderDate, "orderDate");
  }
  return forwardCompatibleBody<OrderWireUpdate>({
    ...(input.header === undefined ? {} : { header: input.header }),
    ...(input.headText === undefined ? {} : { headText: input.headText }),
    ...(input.footText === undefined ? {} : { footText: input.footText }),
    ...(input.address === undefined ? {} : { address: input.address }),
    ...(input.orderDate === undefined ? {} : { orderDate: input.orderDate }),
    ...(input.currency === undefined ? {} : { currency: input.currency }),
    ...(input.customerInternalNote === undefined
      ? {}
      : { customerInternalNote: input.customerInternalNote }),
    ...(input.contact === undefined ? {} : { contact: wireReference(input.contact) }),
    ...(input.contactPerson === undefined
      ? {}
      : { contactPerson: wireReference(input.contactPerson) })
  });
}
