import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class CheckAccountResource extends BaseResource {
  createClearingAccount(
    request: RequestFor<operations["createClearingAccount"]>
  ): Promise<ResultFor<operations["createClearingAccount"]>> {
    return this.call("createClearingAccount", request);
  }
  createFileImportAccount(
    request: RequestFor<operations["createFileImportAccount"]>
  ): Promise<ResultFor<operations["createFileImportAccount"]>> {
    return this.call("createFileImportAccount", request);
  }
  deleteCheckAccount(
    request: RequestFor<operations["deleteCheckAccount"]>
  ): Promise<ResultFor<operations["deleteCheckAccount"]>> {
    return this.call("deleteCheckAccount", request);
  }
  getBalanceAtDate(
    request: RequestFor<operations["getBalanceAtDate"]>
  ): Promise<ResultFor<operations["getBalanceAtDate"]>> {
    return this.call("getBalanceAtDate", request);
  }
  getCheckAccountById(
    request: RequestFor<operations["getCheckAccountById"]>
  ): Promise<ResultFor<operations["getCheckAccountById"]>> {
    return this.call("getCheckAccountById", request);
  }
  getCheckAccounts(
    request: RequestFor<operations["getCheckAccounts"]> = {}
  ): Promise<ResultFor<operations["getCheckAccounts"]>> {
    return this.call("getCheckAccounts", request);
  }
  updateCheckAccount(
    request: RequestFor<operations["updateCheckAccount"]>
  ): Promise<ResultFor<operations["updateCheckAccount"]>> {
    return this.call("updateCheckAccount", request);
  }
}
