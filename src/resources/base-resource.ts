import type { OperationExecutor, RequestFor, ResultFor } from "../types/operation.js";
import type { operations } from "../types/openapi.js";

export abstract class BaseResource {
  public constructor(protected readonly executor: OperationExecutor) {}
  protected call<TOperationId extends keyof operations>(
    operationId: TOperationId,
    request: RequestFor<operations[TOperationId]>
  ): Promise<ResultFor<operations[TOperationId]>> {
    return this.executor.execute(operationId, request);
  }
}
