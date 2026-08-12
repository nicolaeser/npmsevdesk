import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class ContactResource extends BaseResource {
  contactCustomerNumberAvailabilityCheck(
    request: RequestFor<operations["contactCustomerNumberAvailabilityCheck"]> = {}
  ): Promise<ResultFor<operations["contactCustomerNumberAvailabilityCheck"]>> {
    return this.call("contactCustomerNumberAvailabilityCheck", request);
  }
  createContact(
    request: RequestFor<operations["createContact"]>
  ): Promise<ResultFor<operations["createContact"]>> {
    return this.call("createContact", request);
  }
  deleteContact(
    request: RequestFor<operations["deleteContact"]>
  ): Promise<ResultFor<operations["deleteContact"]>> {
    return this.call("deleteContact", request);
  }
  findContactsByCustomFieldValue(
    request: RequestFor<operations["findContactsByCustomFieldValue"]>
  ): Promise<ResultFor<operations["findContactsByCustomFieldValue"]>> {
    return this.call("findContactsByCustomFieldValue", request);
  }
  getContactById(
    request: RequestFor<operations["getContactById"]>
  ): Promise<ResultFor<operations["getContactById"]>> {
    return this.call("getContactById", request);
  }
  getContacts(
    request: RequestFor<operations["getContacts"]> = {}
  ): Promise<ResultFor<operations["getContacts"]>> {
    return this.call("getContacts", request);
  }
  getContactTabsItemCountById(
    request: RequestFor<operations["getContactTabsItemCountById"]>
  ): Promise<ResultFor<operations["getContactTabsItemCountById"]>> {
    return this.call("getContactTabsItemCountById", request);
  }
  getNextCustomerNumber(
    request: RequestFor<operations["getNextCustomerNumber"]> = {}
  ): Promise<ResultFor<operations["getNextCustomerNumber"]>> {
    return this.call("getNextCustomerNumber", request);
  }
  updateContact(
    request: RequestFor<operations["updateContact"]>
  ): Promise<ResultFor<operations["updateContact"]>> {
    return this.call("updateContact", request);
  }
}
