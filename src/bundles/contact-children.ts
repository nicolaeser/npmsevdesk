import type { SevdeskClient } from "../client/sevdesk-client.js";
import { requireSingle, requireValue } from "../domain/normalizers.js";
import {
  CommunicationWayKeyName,
  CommunicationWayType,
  resolveEnumValueStrict,
  type CommunicationWayKeyNameInput,
  type CommunicationWayTypeInput
} from "../enums/domain-enums.js";
import type { ResponseJsonFor, TransportBodyFor } from "../types/operation.js";
import type { SevdeskIdInput, SevdeskReference } from "../types/references.js";
import type { SevdeskResult } from "../types/result.js";
import {
  SevdeskConfigurationError,
  SevdeskError,
  SevdeskResponseValidationError
} from "../utils/errors.js";
import { mapResultData } from "../utils/result.js";
import { validateFinitePayload } from "../utils/validation.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericId,
  stringEnumCode,
  wireReference
} from "./internal.js";
import type {
  ContactAddressCreateInput,
  CommunicationWayCreateInput,
  CuratedRequestOptions,
  OperationData,
  WorkflowActionReceipt,
  WorkflowResult
} from "./types.js";
import { workflowActionReceipt, workflowWriteOptions } from "./workflow.js";
import type { components, operations } from "../types/openapi.js";

type CuratedOperationResult<TOperationId extends keyof operations, TData> = SevdeskResult<
  ResponseJsonFor<operations[TOperationId]>,
  TData,
  TransportBodyFor<operations[TOperationId]>
>;

type NoExtraInput<TInput, TShape> = TInput & Record<Exclude<keyof TInput, keyof TShape>, never>;

const CONTACT_ADDRESS_SCALAR_KEYS = [
  "street",
  "zip",
  "city",
  "name",
  "name2",
  "name3",
  "name4"
] as const;
const CONTACT_ADDRESS_CREATE_KEYS = [
  ...CONTACT_ADDRESS_SCALAR_KEYS,
  "country",
  "category"
] as const;
const CONTACT_ADDRESS_UPDATE_KEYS = [
  ...CONTACT_ADDRESS_SCALAR_KEYS,
  "country",
  "category"
] as const;
const COMMUNICATION_WAY_CREATE_KEYS = ["type", "value", "key", "main"] as const;
const COMMUNICATION_WAY_UPDATE_KEYS = ["type", "value", "key", "main"] as const;

export type ContactAddress = NonNullable<OperationData<"createContactAddress">>;
export type ContactCommunicationWay = NonNullable<OperationData<"createCommunicationWay">>;
export type ContactCustomField = NonNullable<OperationData<"createContactField">>;

export type ContactAddressCreateResult = CuratedOperationResult<
  "createContactAddress",
  ContactAddress
>;
export type ContactCustomFieldCreateResult = CuratedOperationResult<
  "createContactField",
  ContactCustomField
>;

export type ContactAddressUpdateInput = Omit<
  components["schemas"]["Model_ContactAddressUpdate"],
  "contact" | "country" | "category"
> & {
  readonly country?: SevdeskReference<"StaticCountry"> | null;
  readonly category?: SevdeskReference<"Category"> | null;
};

export type ContactCommunicationWayUpdateInput = Omit<
  components["schemas"]["Model_CommunicationWayUpdate"],
  "contact" | "type" | "key"
> & {
  readonly type?: CommunicationWayTypeInput;
  readonly key?: SevdeskReference<"CommunicationWayKey"> | CommunicationWayKeyNameInput | null;
};

export interface ContactCustomFieldCreateInput {
  readonly setting: SevdeskReference<"ContactCustomFieldSetting">;
  readonly value: string;
}

export interface ContactCustomFieldUpdateInput {
  readonly value: string;
}

export interface ContactChildRemovalConfirmation {
  readonly confirm: true;
}

export class SevdeskContactChildOwnershipError extends SevdeskError {
  public readonly childType: "address" | "communicationWay" | "customField";
  public readonly childId: number;
  public readonly expectedContactId: number;
  public readonly actualContactId: number;
  public constructor(input: {
    readonly childType: "address" | "communicationWay" | "customField";
    readonly childId: number;
    readonly expectedContactId: number;
    readonly actualContactId: number;
  }) {
    super(
      `The contact ${input.childType} ${input.childId} belongs to contact ${input.actualContactId}, not contact ${input.expectedContactId}.`
    );
    this.childType = input.childType;
    this.childId = input.childId;
    this.expectedContactId = input.expectedContactId;
    this.actualContactId = input.actualContactId;
  }
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      childType: this.childType,
      childId: this.childId,
      expectedContactId: this.expectedContactId,
      actualContactId: this.actualContactId
    };
  }
}

export interface ContactAddressUpdateData {
  readonly before: NonNullable<OperationData<"getContactAddressById">>[number];
  readonly address: NonNullable<OperationData<"updateContactAddress">>;
}

export interface ContactAddressRemoveData {
  readonly removed: NonNullable<OperationData<"getContactAddressById">>[number];
  readonly receipt: WorkflowActionReceipt<"deleteContactAddress">;
}

export type ContactAddressUpdateResult = WorkflowResult<
  "contacts.addresses.update",
  ContactAddressUpdateData,
  "getContactAddressById" | "updateContactAddress"
>;

export type ContactAddressRemoveResult = WorkflowResult<
  "contacts.addresses.remove",
  ContactAddressRemoveData,
  "getContactAddressById" | "deleteContactAddress"
>;

export interface ContactCommunicationWayCreateData {
  readonly communicationWay: ContactCommunicationWay;
}

export interface ContactCommunicationWayUpdateData {
  readonly before: NonNullable<OperationData<"getCommunicationWayById">>[number];
  readonly communicationWay: NonNullable<OperationData<"UpdateCommunicationWay">>;
}

export interface ContactCommunicationWayRemoveData {
  readonly removed: NonNullable<OperationData<"getCommunicationWayById">>[number];
  readonly receipt: WorkflowActionReceipt<"deleteCommunicationWay">;
}

type CommunicationWayWriteOperationId = "getCommunicationWayKeys" | "createCommunicationWay";

export type ContactCommunicationWayCreateResult = WorkflowResult<
  "contacts.communicationWays.create",
  ContactCommunicationWayCreateData,
  CommunicationWayWriteOperationId
>;

export type ContactCommunicationWayUpdateResult = WorkflowResult<
  "contacts.communicationWays.update",
  ContactCommunicationWayUpdateData,
  "getCommunicationWayById" | "getCommunicationWayKeys" | "UpdateCommunicationWay"
>;

export type ContactCommunicationWayRemoveResult = WorkflowResult<
  "contacts.communicationWays.remove",
  ContactCommunicationWayRemoveData,
  "getCommunicationWayById" | "deleteCommunicationWay"
>;

export interface ContactCustomFieldUpdateData {
  readonly before: NonNullable<OperationData<"getContactFieldsById">>[number];
  readonly customField: NonNullable<OperationData<"updateContactfield">>;
}

export interface ContactCustomFieldRemoveData {
  readonly removed: NonNullable<OperationData<"getContactFieldsById">>[number];
  readonly receipt: WorkflowActionReceipt<"deleteContactCustomFieldId">;
}

export type ContactCustomFieldUpdateResult = WorkflowResult<
  "contacts.customFields.update",
  ContactCustomFieldUpdateData,
  "getContactFieldsById" | "updateContactfield"
>;

export type ContactCustomFieldRemoveResult = WorkflowResult<
  "contacts.customFields.remove",
  ContactCustomFieldRemoveData,
  "getContactFieldsById" | "deleteContactCustomFieldId"
>;

export class ContactAddressesModule {
  public constructor(private readonly client: SevdeskClient) {}
  public async create<const TInput extends ContactAddressCreateInput>(
    contactId: SevdeskIdInput,
    input: NoExtraInput<TInput, ContactAddressCreateInput>,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactAddressCreateResult> {
    validateAddressCreate(input);
    const fields = pickPresent(input, CONTACT_ADDRESS_CREATE_KEYS);
    const body = {
      ...fields,
      objectName: "ContactAddress" as const,
      contact: contactReference(contactId),
      country: wireReference(input.country),
      category: input.category === null ? null : wireReference(input.category)
    };
    const result = await this.client.raw.contactAddress.createContactAddress(
      asRequest<"createContactAddress">({ body }, workflowWriteOptions(requestOptions))
    );
    return mapResultData(result, requireValue(result.data, "contact address"));
  }
  public async update<const TInput extends ContactAddressUpdateInput>(
    contactId: SevdeskIdInput,
    addressId: SevdeskIdInput,
    input: NoExtraInput<TInput, ContactAddressUpdateInput>,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactAddressUpdateResult> {
    validateAddressUpdate(input);
    const expectedContactId = numericId(contactId, "contact");
    const normalizedAddressId = numericId(addressId, "contact address");
    const context = this.client.createWorkflowContext<
      "contacts.addresses.update",
      "getContactAddressById" | "updateContactAddress"
    >("contacts.addresses.update");
    const before = await inspectAddress(
      () =>
        context.step("verify contact-address ownership", "getContactAddressById", () =>
          this.client.raw.contactAddress.getContactAddressById(
            asRequest<"getContactAddressById">(
              { path: { contactAddressId: normalizedAddressId } },
              requestOptions
            )
          )
        ),
      expectedContactId,
      normalizedAddressId
    );
    try {
      const result = await context.step("update contact address", "updateContactAddress", () =>
        this.client.raw.contactAddress.updateContactAddress(
          asRequest<"updateContactAddress">(
            {
              path: { contactAddressId: normalizedAddressId },
              body: addressUpdateBody(input)
            },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      return context.result({
        before,
        address: requireValue(result.data, "updated contact address")
      });
    } catch (error) {
      throw context.error(error, { partial: { before } });
    }
  }
  public async remove(
    contactId: SevdeskIdInput,
    addressId: SevdeskIdInput,
    confirmation: ContactChildRemovalConfirmation,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactAddressRemoveResult> {
    requireRemovalConfirmation(confirmation);
    const expectedContactId = numericId(contactId, "contact");
    const normalizedAddressId = numericId(addressId, "contact address");
    const context = this.client.createWorkflowContext<
      "contacts.addresses.remove",
      "getContactAddressById" | "deleteContactAddress"
    >("contacts.addresses.remove");
    const removed = await inspectAddress(
      () =>
        context.step("verify contact-address ownership", "getContactAddressById", () =>
          this.client.raw.contactAddress.getContactAddressById(
            asRequest<"getContactAddressById">(
              { path: { contactAddressId: normalizedAddressId } },
              requestOptions
            )
          )
        ),
      expectedContactId,
      normalizedAddressId
    );
    try {
      const result = await context.step("remove contact address", "deleteContactAddress", () =>
        this.client.raw.contactAddress.deleteContactAddress(
          asRequest<"deleteContactAddress">(
            { path: { contactAddressId: normalizedAddressId } },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      return context.result({
        removed,
        receipt: workflowActionReceipt("deleteContactAddress", result)
      });
    } catch (error) {
      throw context.error(error, { partial: { removed } });
    }
  }
}

export class ContactCommunicationWaysModule {
  private keys?: Map<string, SevdeskReference<"CommunicationWayKey">>;
  public constructor(private readonly client: SevdeskClient) {}
  public async create<const TInput extends CommunicationWayCreateInput>(
    contactId: SevdeskIdInput,
    input: NoExtraInput<TInput, CommunicationWayCreateInput>,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactCommunicationWayCreateResult> {
    validateCommunicationWayCreate(input);
    const context = this.client.createWorkflowContext<
      "contacts.communicationWays.create",
      CommunicationWayWriteOperationId
    >("contacts.communicationWays.create");
    try {
      const key = await this.resolveKey(input.key, () =>
        context.step("load communication-way keys", "getCommunicationWayKeys", () =>
          this.client.raw.communicationWay.getCommunicationWayKeys(
            asRequest<"getCommunicationWayKeys">(
              { query: { countAll: true, limit: 100 } },
              requestOptions
            )
          )
        )
      );
      const body = forwardCompatibleBody({
        value: input.value,
        ...(hasOwn(input, "main") ? { main: input.main } : {}),
        objectName: "CommunicationWay" as const,
        contact: contactReference(contactId),
        type: stringEnumCode(CommunicationWayType, input.type, "communication-way type"),
        key: wireReference(key)
      });
      const result = await context.step("create communication way", "createCommunicationWay", () =>
        this.client.raw.communicationWay.createCommunicationWay(
          forwardCompatibleRequest<"createCommunicationWay">(
            { body },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      return context.result({
        communicationWay: requireValue(result.data, "communication way")
      });
    } catch (error) {
      throw context.error(error);
    }
  }
  public async update<const TInput extends ContactCommunicationWayUpdateInput>(
    contactId: SevdeskIdInput,
    communicationWayId: SevdeskIdInput,
    input: NoExtraInput<TInput, ContactCommunicationWayUpdateInput>,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactCommunicationWayUpdateResult> {
    validateCommunicationWayUpdate(input);
    const expectedContactId = numericId(contactId, "contact");
    const normalizedId = numericId(communicationWayId, "communication way");
    const context = this.client.createWorkflowContext<
      "contacts.communicationWays.update",
      "getCommunicationWayById" | "getCommunicationWayKeys" | "UpdateCommunicationWay"
    >("contacts.communicationWays.update");
    const before = await inspectCommunicationWay(
      () =>
        context.step("verify communication-way ownership", "getCommunicationWayById", () =>
          this.client.raw.communicationWay.getCommunicationWayById(
            asRequest<"getCommunicationWayById">(
              { path: { communicationWayId: normalizedId } },
              requestOptions
            )
          )
        ),
      expectedContactId,
      normalizedId
    );
    try {
      const key =
        input.key === undefined || input.key === null
          ? input.key
          : await this.resolveKey(input.key, () =>
              context.step("load communication-way keys", "getCommunicationWayKeys", () =>
                this.client.raw.communicationWay.getCommunicationWayKeys(
                  asRequest<"getCommunicationWayKeys">(
                    { query: { countAll: true, limit: 100 } },
                    requestOptions
                  )
                )
              )
            );
      const body = forwardCompatibleBody({
        ...(hasOwn(input, "value") ? { value: input.value } : {}),
        ...(hasOwn(input, "main") ? { main: input.main } : {}),
        ...(input.type === undefined
          ? {}
          : {
              type: stringEnumCode(CommunicationWayType, input.type, "communication-way type")
            }),
        ...(key === undefined ? {} : { key: key === null ? null : wireReference(key) })
      });
      const result = await context.step("update communication way", "UpdateCommunicationWay", () =>
        this.client.raw.communicationWay.UpdateCommunicationWay(
          forwardCompatibleRequest<"UpdateCommunicationWay">(
            { path: { communicationWayId: normalizedId }, body },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      return context.result({
        before,
        communicationWay: requireValue(result.data, "updated communication way")
      });
    } catch (error) {
      throw context.error(error, { partial: { before } });
    }
  }
  public async remove(
    contactId: SevdeskIdInput,
    communicationWayId: SevdeskIdInput,
    confirmation: ContactChildRemovalConfirmation,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactCommunicationWayRemoveResult> {
    requireRemovalConfirmation(confirmation);
    const expectedContactId = numericId(contactId, "contact");
    const normalizedId = numericId(communicationWayId, "communication way");
    const context = this.client.createWorkflowContext<
      "contacts.communicationWays.remove",
      "getCommunicationWayById" | "deleteCommunicationWay"
    >("contacts.communicationWays.remove");
    const removed = await inspectCommunicationWay(
      () =>
        context.step("verify communication-way ownership", "getCommunicationWayById", () =>
          this.client.raw.communicationWay.getCommunicationWayById(
            asRequest<"getCommunicationWayById">(
              { path: { communicationWayId: normalizedId } },
              requestOptions
            )
          )
        ),
      expectedContactId,
      normalizedId
    );
    try {
      const result = await context.step("remove communication way", "deleteCommunicationWay", () =>
        this.client.raw.communicationWay.deleteCommunicationWay(
          asRequest<"deleteCommunicationWay">(
            { path: { communicationWayId: normalizedId } },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      return context.result({
        removed,
        receipt: workflowActionReceipt("deleteCommunicationWay", result)
      });
    } catch (error) {
      throw context.error(error, { partial: { removed } });
    }
  }
  private async resolveKey(
    key: SevdeskReference<"CommunicationWayKey"> | CommunicationWayKeyNameInput,
    loadKeys: () => Promise<
      CuratedOperationResult<"getCommunicationWayKeys", OperationData<"getCommunicationWayKeys">>
    >
  ): Promise<SevdeskReference<"CommunicationWayKey">> {
    if (typeof key === "object" && "objectName" in key) return key;
    if (!this.keys) {
      const result = await loadKeys();
      this.keys = new Map(
        result.data.flatMap((item) =>
          item.id && item.name
            ? [
                [
                  item.name.toLocaleLowerCase(),
                  { id: item.id, objectName: "CommunicationWayKey" as const }
                ]
              ]
            : []
        )
      );
    }
    const requested = String(resolveEnumValueStrict(CommunicationWayKeyName, key));
    const resolved = this.keys.get(requested.toLocaleLowerCase());
    if (!resolved) {
      throw new SevdeskConfigurationError(
        `Unknown communication-way key "${key}". Use a returned CommunicationWayKey reference.`
      );
    }
    return resolved;
  }
}

export class ContactCustomFieldsModule {
  public constructor(private readonly client: SevdeskClient) {}
  public async create(
    contactId: SevdeskIdInput,
    input: ContactCustomFieldCreateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactCustomFieldCreateResult> {
    validateFinitePayload(input, "contact custom field");
    const result = await this.client.raw.contactField.createContactField(
      asRequest<"createContactField">(
        {
          body: {
            contact: contactReference(contactId),
            contactCustomFieldSetting: wireReference(input.setting),
            value: input.value,
            objectName: "ContactCustomField"
          }
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapResultData(result, requireValue(result.data, "contact custom field"));
  }
  public async update(
    contactId: SevdeskIdInput,
    customFieldId: SevdeskIdInput,
    input: ContactCustomFieldUpdateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactCustomFieldUpdateResult> {
    validateFinitePayload(input, "contact custom field update");
    const expectedContactId = numericId(contactId, "contact");
    const normalizedId = numericId(customFieldId, "contact custom field");
    const context = this.client.createWorkflowContext<
      "contacts.customFields.update",
      "getContactFieldsById" | "updateContactfield"
    >("contacts.customFields.update");
    const before = await inspectCustomField(
      () =>
        context.step("verify custom-field ownership", "getContactFieldsById", () =>
          this.client.raw.contactField.getContactFieldsById(
            asRequest<"getContactFieldsById">(
              { path: { contactCustomFieldId: normalizedId } },
              requestOptions
            )
          )
        ),
      expectedContactId,
      normalizedId
    );
    try {
      const result = await context.step("update contact custom field", "updateContactfield", () =>
        this.client.raw.contactField.updateContactfield(
          asRequest<"updateContactfield">(
            {
              path: { contactCustomFieldId: normalizedId },
              body: { value: input.value }
            },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      return context.result({
        before,
        customField: requireValue(result.data, "updated contact custom field")
      });
    } catch (error) {
      throw context.error(error, { partial: { before } });
    }
  }
  public async remove(
    contactId: SevdeskIdInput,
    customFieldId: SevdeskIdInput,
    confirmation: ContactChildRemovalConfirmation,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactCustomFieldRemoveResult> {
    requireRemovalConfirmation(confirmation);
    const expectedContactId = numericId(contactId, "contact");
    const normalizedId = numericId(customFieldId, "contact custom field");
    const context = this.client.createWorkflowContext<
      "contacts.customFields.remove",
      "getContactFieldsById" | "deleteContactCustomFieldId"
    >("contacts.customFields.remove");
    const removed = await inspectCustomField(
      () =>
        context.step("verify custom-field ownership", "getContactFieldsById", () =>
          this.client.raw.contactField.getContactFieldsById(
            asRequest<"getContactFieldsById">(
              { path: { contactCustomFieldId: normalizedId } },
              requestOptions
            )
          )
        ),
      expectedContactId,
      normalizedId
    );
    try {
      const result = await context.step(
        "remove contact custom field",
        "deleteContactCustomFieldId",
        () =>
          this.client.raw.contactField.deleteContactCustomFieldId(
            asRequest<"deleteContactCustomFieldId">(
              { path: { contactCustomFieldId: normalizedId } },
              workflowWriteOptions(requestOptions)
            )
          )
      );
      return context.result({
        removed,
        receipt: workflowActionReceipt("deleteContactCustomFieldId", result)
      });
    } catch (error) {
      throw context.error(error, { partial: { removed } });
    }
  }
}

async function inspectAddress(
  inspect: () => Promise<
    CuratedOperationResult<"getContactAddressById", OperationData<"getContactAddressById">>
  >,
  contactId: number,
  addressId: number
): Promise<NonNullable<OperationData<"getContactAddressById">>[number]> {
  const result = await inspect();
  const value = requireSingle(result.data, "contact address");
  assertChildIdentity("address", addressId, "ContactAddress", value);
  assertOwnership("address", addressId, contactId, value.contact);
  return value;
}

async function inspectCommunicationWay(
  inspect: () => Promise<
    CuratedOperationResult<"getCommunicationWayById", OperationData<"getCommunicationWayById">>
  >,
  contactId: number,
  communicationWayId: number
): Promise<NonNullable<OperationData<"getCommunicationWayById">>[number]> {
  const result = await inspect();
  const value = requireSingle(result.data, "communication way");
  assertChildIdentity("communicationWay", communicationWayId, "CommunicationWay", value);
  assertOwnership("communicationWay", communicationWayId, contactId, value.contact);
  return value;
}

async function inspectCustomField(
  inspect: () => Promise<
    CuratedOperationResult<"getContactFieldsById", OperationData<"getContactFieldsById">>
  >,
  contactId: number,
  customFieldId: number
): Promise<NonNullable<OperationData<"getContactFieldsById">>[number]> {
  const result = await inspect();
  const value = requireSingle(result.data, "contact custom field");
  assertChildIdentity("customField", customFieldId, "ContactCustomField", value);
  assertOwnership("customField", customFieldId, contactId, value.contact);
  return value;
}

function assertOwnership(
  childType: "address" | "communicationWay" | "customField",
  childId: number,
  expectedContactId: number,
  contact: unknown
): void {
  if (
    contact === null ||
    typeof contact !== "object" ||
    !("id" in contact) ||
    !("objectName" in contact) ||
    contact.objectName !== "Contact" ||
    (typeof contact.id !== "string" && typeof contact.id !== "number")
  ) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned ${childType} ${childId} without a usable Contact owner.`,
      { value: contact }
    );
  }
  let actualContactId: number;
  try {
    actualContactId = numericId(contact.id, `${childType} owner`);
  } catch (error) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned ${childType} ${childId} with an invalid Contact owner id.`,
      { value: contact },
      error
    );
  }
  if (actualContactId !== expectedContactId) {
    throw new SevdeskContactChildOwnershipError({
      childType,
      childId,
      expectedContactId,
      actualContactId
    });
  }
}

function assertChildIdentity(
  childType: "address" | "communicationWay" | "customField",
  expectedId: number,
  expectedObjectName: "ContactAddress" | "CommunicationWay" | "ContactCustomField",
  value: unknown
): void {
  if (
    value === null ||
    typeof value !== "object" ||
    !("id" in value) ||
    !("objectName" in value) ||
    value.objectName !== expectedObjectName ||
    (typeof value.id !== "string" && typeof value.id !== "number")
  ) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned an invalid ${childType} while verifying child identity.`,
      { value }
    );
  }
  let actualId: number;
  try {
    actualId = numericId(value.id, childType);
  } catch (error) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned ${childType} with an invalid id.`,
      { value },
      error
    );
  }
  if (actualId !== expectedId) {
    throw new SevdeskResponseValidationError(
      `sevdesk returned ${childType} ${actualId} while ${expectedId} was requested.`,
      { value }
    );
  }
}

function contactReference(contactId: SevdeskIdInput): { id: number; objectName: "Contact" } {
  return { id: numericId(contactId, "contact"), objectName: "Contact" };
}

function validateAddressCreate(input: ContactAddressCreateInput): void {
  assertOnlyKeys(input, CONTACT_ADDRESS_CREATE_KEYS, "contact address");
  validateFinitePayload(input, "contact address");
  wireReference(input.country);
  if (input.category !== null) wireReference(input.category);
}

function validateAddressUpdate(input: ContactAddressUpdateInput): void {
  assertOnlyKeys(input, CONTACT_ADDRESS_UPDATE_KEYS, "contact address update");
  requireNonEmptyUpdate(input, "contact address update");
  validateFinitePayload(input, "contact address update");
  if (input.country !== undefined && input.country !== null) wireReference(input.country);
  if (input.category !== undefined && input.category !== null) wireReference(input.category);
}

function addressUpdateBody(
  input: ContactAddressUpdateInput
): components["schemas"]["Model_ContactAddressUpdate"] {
  const { country, category, ...fields } = input;
  return {
    ...pickPresent(fields, CONTACT_ADDRESS_SCALAR_KEYS),
    ...(country === undefined ? {} : { country: country === null ? null : wireReference(country) }),
    ...(category === undefined
      ? {}
      : { category: category === null ? null : wireReference(category) })
  };
}

function validateCommunicationWayCreate(input: CommunicationWayCreateInput): void {
  assertOnlyKeys(input, COMMUNICATION_WAY_CREATE_KEYS, "communication way");
  validateFinitePayload(input, "communication way");
  stringEnumCode(CommunicationWayType, input.type, "communication-way type");
  if (typeof input.key === "object" && "objectName" in input.key) wireReference(input.key);
  else resolveEnumValueStrict(CommunicationWayKeyName, input.key);
}

function validateCommunicationWayUpdate(input: ContactCommunicationWayUpdateInput): void {
  assertOnlyKeys(input, COMMUNICATION_WAY_UPDATE_KEYS, "communication-way update");
  requireNonEmptyUpdate(input, "communication-way update");
  validateFinitePayload(input, "communication-way update");
  if (input.type !== undefined) {
    stringEnumCode(CommunicationWayType, input.type, "communication-way type");
  }
  if (input.key !== undefined && input.key !== null) {
    if (typeof input.key === "object" && "objectName" in input.key) wireReference(input.key);
    else resolveEnumValueStrict(CommunicationWayKeyName, input.key);
  }
}

function requireNonEmptyUpdate(input: Readonly<Record<string, unknown>>, label: string): void {
  if (Object.keys(input).length === 0) {
    throw new SevdeskConfigurationError(`${label} must change at least one field.`);
  }
}

function requireRemovalConfirmation(value: ContactChildRemovalConfirmation): void {
  if (value?.confirm !== true) {
    throw new SevdeskConfigurationError(
      "Removing a contact child requires the explicit option { confirm: true }."
    );
  }
}

function assertOnlyKeys(
  value: unknown,
  allowedKeys: readonly string[],
  label: string
): asserts value is Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskConfigurationError(`${label} must be an object.`);
  }
  const allowed = new Set(allowedKeys);
  const forbidden = Object.keys(value).filter((key) => !allowed.has(key));
  if (forbidden.length > 0) {
    throw new SevdeskConfigurationError(
      `${label} contains unsupported field${forbidden.length === 1 ? "" : "s"}: ${forbidden.join(
        ", "
      )}.`
    );
  }
}

function pickPresent(
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[]
): Record<string, unknown> {
  return Object.fromEntries(
    keys.filter((key) => hasOwn(value, key)).map((key) => [key, value[key]])
  );
}

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.hasOwn(value, key);
}
