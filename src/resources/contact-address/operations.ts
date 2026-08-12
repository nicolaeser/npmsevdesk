import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class ContactAddressResource extends BaseResource {
  createContactAddress(
    request: RequestFor<operations["createContactAddress"]>
  ): Promise<ResultFor<operations["createContactAddress"]>> {
    return this.call("createContactAddress", request);
  }
  deleteContactAddress(
    request: RequestFor<operations["deleteContactAddress"]>
  ): Promise<ResultFor<operations["deleteContactAddress"]>> {
    return this.call("deleteContactAddress", request);
  }
  getContactAddressById(
    request: RequestFor<operations["getContactAddressById"]>
  ): Promise<ResultFor<operations["getContactAddressById"]>> {
    return this.call("getContactAddressById", request);
  }
  getContactAddresses(
    request: RequestFor<operations["getContactAddresses"]> = {}
  ): Promise<ResultFor<operations["getContactAddresses"]>> {
    return this.call("getContactAddresses", request);
  }
  updateContactAddress(
    request: RequestFor<operations["updateContactAddress"]>
  ): Promise<ResultFor<operations["updateContactAddress"]>> {
    return this.call("updateContactAddress", request);
  }
  contactAddressId(
    request: RequestFor<operations["getContactAddressById"]>
  ): Promise<ResultFor<operations["getContactAddressById"]>> {
    return this.getContactAddressById(request);
  }
}
