import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class AccountingContactResource extends BaseResource {
  createAccountingContact(
    request: RequestFor<operations["createAccountingContact"]>
  ): Promise<ResultFor<operations["createAccountingContact"]>> {
    return this.call("createAccountingContact", request);
  }
  deleteAccountingContact(
    request: RequestFor<operations["deleteAccountingContact"]>
  ): Promise<ResultFor<operations["deleteAccountingContact"]>> {
    return this.call("deleteAccountingContact", request);
  }
  getAccountingContact(
    request: RequestFor<operations["getAccountingContact"]> = {}
  ): Promise<ResultFor<operations["getAccountingContact"]>> {
    return this.call("getAccountingContact", request);
  }
  getAccountingContactById(
    request: RequestFor<operations["getAccountingContactById"]>
  ): Promise<ResultFor<operations["getAccountingContactById"]>> {
    return this.call("getAccountingContactById", request);
  }
  updateAccountingContact(
    request: RequestFor<operations["updateAccountingContact"]>
  ): Promise<ResultFor<operations["updateAccountingContact"]>> {
    return this.call("updateAccountingContact", request);
  }
}
