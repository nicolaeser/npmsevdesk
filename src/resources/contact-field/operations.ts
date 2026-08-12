import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class ContactFieldResource extends BaseResource {
  createContactField(
    request: RequestFor<operations["createContactField"]>
  ): Promise<ResultFor<operations["createContactField"]>> {
    return this.call("createContactField", request);
  }
  createContactFieldSetting(
    request: RequestFor<operations["createContactFieldSetting"]>
  ): Promise<ResultFor<operations["createContactFieldSetting"]>> {
    return this.call("createContactFieldSetting", request);
  }
  deleteContactCustomFieldId(
    request: RequestFor<operations["deleteContactCustomFieldId"]>
  ): Promise<ResultFor<operations["deleteContactCustomFieldId"]>> {
    return this.call("deleteContactCustomFieldId", request);
  }
  deleteContactFieldSetting(
    request: RequestFor<operations["deleteContactFieldSetting"]>
  ): Promise<ResultFor<operations["deleteContactFieldSetting"]>> {
    return this.call("deleteContactFieldSetting", request);
  }
  getContactFields(
    request: RequestFor<operations["getContactFields"]> = {}
  ): Promise<ResultFor<operations["getContactFields"]>> {
    return this.call("getContactFields", request);
  }
  getContactFieldsById(
    request: RequestFor<operations["getContactFieldsById"]>
  ): Promise<ResultFor<operations["getContactFieldsById"]>> {
    return this.call("getContactFieldsById", request);
  }
  getContactFieldSettingById(
    request: RequestFor<operations["getContactFieldSettingById"]>
  ): Promise<ResultFor<operations["getContactFieldSettingById"]>> {
    return this.call("getContactFieldSettingById", request);
  }
  getContactFieldSettings(
    request: RequestFor<operations["getContactFieldSettings"]> = {}
  ): Promise<ResultFor<operations["getContactFieldSettings"]>> {
    return this.call("getContactFieldSettings", request);
  }
  getPlaceholder(
    request: RequestFor<operations["getPlaceholder"]>
  ): Promise<ResultFor<operations["getPlaceholder"]>> {
    return this.call("getPlaceholder", request);
  }
  getReferenceCount(
    request: RequestFor<operations["getReferenceCount"]>
  ): Promise<ResultFor<operations["getReferenceCount"]>> {
    return this.call("getReferenceCount", request);
  }
  updateContactfield(
    request: RequestFor<operations["updateContactfield"]>
  ): Promise<ResultFor<operations["updateContactfield"]>> {
    return this.call("updateContactfield", request);
  }
  updateContactFieldSetting(
    request: RequestFor<operations["updateContactFieldSetting"]>
  ): Promise<ResultFor<operations["updateContactFieldSetting"]>> {
    return this.call("updateContactFieldSetting", request);
  }
}
