import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class CheckAccountTransactionResource extends BaseResource {
  checkAccountTransactionEnshrine(
    request: RequestFor<operations["checkAccountTransactionEnshrine"]>
  ): Promise<ResultFor<operations["checkAccountTransactionEnshrine"]>> {
    return this.call("checkAccountTransactionEnshrine", request);
  }
  createTransaction(
    request: RequestFor<operations["createTransaction"]>
  ): Promise<ResultFor<operations["createTransaction"]>> {
    return this.call("createTransaction", request);
  }
  deleteCheckAccountTransaction(
    request: RequestFor<operations["deleteCheckAccountTransaction"]>
  ): Promise<ResultFor<operations["deleteCheckAccountTransaction"]>> {
    return this.call("deleteCheckAccountTransaction", request);
  }
  getCheckAccountTransactionById(
    request: RequestFor<operations["getCheckAccountTransactionById"]>
  ): Promise<ResultFor<operations["getCheckAccountTransactionById"]>> {
    return this.call("getCheckAccountTransactionById", request);
  }
  getTransactions(
    request: RequestFor<operations["getTransactions"]> = {}
  ): Promise<ResultFor<operations["getTransactions"]>> {
    return this.call("getTransactions", request);
  }
  updateCheckAccountTransaction(
    request: RequestFor<operations["updateCheckAccountTransaction"]>
  ): Promise<ResultFor<operations["updateCheckAccountTransaction"]>> {
    return this.call("updateCheckAccountTransaction", request);
  }
}
