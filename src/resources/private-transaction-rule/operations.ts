import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class PrivateTransactionRuleResource extends BaseResource {
  createPrivateTransactionRule(
    request: RequestFor<operations["createPrivateTransactionRule"]>
  ): Promise<ResultFor<operations["createPrivateTransactionRule"]>> {
    return this.call("createPrivateTransactionRule", request);
  }
  deletePrivateTransactionRule(
    request: RequestFor<operations["deletePrivateTransactionRule"]>
  ): Promise<ResultFor<operations["deletePrivateTransactionRule"]>> {
    return this.call("deletePrivateTransactionRule", request);
  }
  listPrivateTransactionRules(
    request: RequestFor<operations["listPrivateTransactionRules"]> = {}
  ): Promise<ResultFor<operations["listPrivateTransactionRules"]>> {
    return this.call("listPrivateTransactionRules", request);
  }
}
