import type { SevdeskClient } from "../client/sevdesk-client.js";
import type { SevdeskContact } from "../domain/models.js";
import { mapContactListResult, mapContactResult } from "../domain/result-mappers.js";
import { requireValue } from "../domain/normalizers.js";
import type { ContactListResult, ContactResult, NextCustomerNumberResult } from "../domain/results.js";
import { mapResultData } from "../utils/result.js";
import {
  CommunicationWayKeyName,
  CommunicationWayType,
  resolveEnumValueStrict,
  type CommunicationWayKeyNameInput
} from "../enums/domain-enums.js";
import type { EntityId, SevdeskIdInput, SevdeskReference } from "../types/references.js";
import {
  SevdeskApiError,
  SevdeskConfigurationError,
  SevdeskResponseValidationError
} from "../utils/errors.js";
import { validateFinitePayload } from "../utils/validation.js";
import { buildContactPayload } from "./builders.js";
import { assertContactKindMatches } from "./contact-kind.js";
import type { ContactEmbedInput } from "./embed.js";
import { contactListQuery } from "./filters.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericId,
  omitServerManagedCreateFields,
  requireEntityId,
  stringEnumCode,
  wireReference
} from "./internal.js";
import type {
  CompleteContactInput,
  CompleteContactOptions,
  CompensationResult,
  ContactListOptions,
  CuratedRequestOptions,
  OperationData,
  WorkflowActionReceipt,
  WorkflowResult
} from "./types.js";
import { workflowActionReceipt, workflowWriteOptions, type WorkflowContext } from "./workflow.js";
import {
  ContactAddressesModule,
  ContactCommunicationWaysModule,
  ContactCustomFieldsModule
} from "./contact-children.js";
import {
  buildContactUpdatePayload,
  ContactUpsertModule,
  type ContactMergeInput,
  type ContactUpsertInput,
  type ContactUpsertOptions,
  type ContactUpsertResult,
  type StrictContactUpsertInput
} from "./contact-upsert.js";

export type ContactUpdateInput = ContactMergeInput;

export type ContactUpdateWorkflowOperationId = "getContactById" | "updateContact";

export interface ContactUpdateWorkflowData {
  readonly before: SevdeskContact;
  readonly receipt: WorkflowActionReceipt<"updateContact">;
  readonly contact: SevdeskContact;
}

export interface ContactUpdateWorkflowPartial {
  readonly before?: SevdeskContact;
  readonly receipt?: WorkflowActionReceipt<"updateContact">;
}

export type ContactUpdateWorkflowResult = WorkflowResult<
  "contacts.update",
  ContactUpdateWorkflowData,
  ContactUpdateWorkflowOperationId
>;

export type ContactDeleteResult = WorkflowActionReceipt<"deleteContact">;

export interface CompleteContactData {
  readonly contact: SevdeskContact;
  readonly addresses: readonly NonNullable<OperationData<"createContactAddress">>[];
  readonly communicationWays: readonly NonNullable<OperationData<"createCommunicationWay">>[];
  readonly accounting?: CreatedAccountingContact;
}

export type CreatedAccountingContact = Omit<
  NonNullable<OperationData<"createAccountingContact">>,
  "id" | "objectName"
> & {
  readonly id: string;
  readonly objectName: "AccountingContact";
};

export type ContactWorkflowOperationId =
  | "getNextCustomerNumber"
  | "contactCustomerNumberAvailabilityCheck"
  | "createContact"
  | "createContactAddress"
  | "getCommunicationWayKeys"
  | "createCommunicationWay"
  | "getContactById"
  | "createAccountingContact";

export interface CompleteContactPartial {
  readonly contactId?: EntityId;
  readonly addressIds: readonly EntityId[];
  readonly communicationWayIds: readonly EntityId[];
}

export type CompleteContactDataFor<TInput> = CompleteContactData &
  (TInput extends { readonly accounting: NonNullable<CompleteContactInput["accounting"]> }
    ? {
        readonly accounting: CreatedAccountingContact;
      }
    : object);

type PropertyValue<TValue, TKey extends PropertyKey> = TValue extends unknown
  ? TKey extends keyof TValue
    ? TValue[TKey]
    : never
  : never;

type ContactCustomerNumberValue<TInput> = Exclude<
  PropertyValue<PropertyValue<TInput, "contact">, "customerNumber">,
  undefined
>;

type ContactCustomerNumberOperationId<TInput, TOptions> =
  | ("next" extends ContactCustomerNumberValue<TInput> ? "getNextCustomerNumber" : never)
  | ([Exclude<ContactCustomerNumberValue<TInput>, "next">] extends [never]
      ? never
      : TOptions extends { readonly validateCustomerNumber: false }
        ? never
        : "contactCustomerNumberAvailabilityCheck");

export type CompleteContactWorkflowOperationId<TInput, TOptions> =
  | "createContact"
  | "getContactById"
  | ContactCustomerNumberOperationId<TInput, TOptions>
  | ([Exclude<PropertyValue<TInput, "addresses">, undefined>] extends [never]
      ? never
      : "createContactAddress")
  | ([Exclude<PropertyValue<TInput, "communicationWays">, undefined>] extends [never]
      ? never
      : "getCommunicationWayKeys" | "createCommunicationWay")
  | ([Exclude<PropertyValue<TInput, "accounting">, undefined>] extends [never]
      ? never
      : "createAccountingContact");

export type CreateContactWorkflowResult<TInput, TOptions = object> = WorkflowResult<
  "contacts.create",
  CompleteContactDataFor<TInput>,
  CompleteContactWorkflowOperationId<TInput, TOptions>
>;

export class ContactsBundle {
  private communicationWayKeys?: Map<string, SevdeskReference<"CommunicationWayKey">>;
  public readonly addresses: ContactAddressesModule;
  public readonly communicationWays: ContactCommunicationWaysModule;
  public readonly customFields: ContactCustomFieldsModule;
  private readonly upserts: ContactUpsertModule;
  public constructor(private readonly client: SevdeskClient) {
    this.addresses = new ContactAddressesModule(client);
    this.communicationWays = new ContactCommunicationWaysModule(client);
    this.customFields = new ContactCustomFieldsModule(client);
    this.upserts = new ContactUpsertModule(client, this);
  }
  public upsert<
    const TCreate extends CompleteContactInput,
    const TMerge extends ContactMergeInput | undefined = undefined,
    const TOptions extends ContactUpsertOptions = object
  >(
    input: StrictContactUpsertInput<TCreate, TMerge>,
    options?: TOptions,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactUpsertResult<ContactUpsertInput<TCreate, TMerge>, TOptions>> {
    return this.upserts.upsert(input, options, requestOptions);
  }
  public async nextCustomerNumber(
    requestOptions?: CuratedRequestOptions
  ): Promise<NextCustomerNumberResult> {
    const result = await this.client.raw.contact.getNextCustomerNumber(
      asRequest<"getNextCustomerNumber">({}, requestOptions)
    );
    return mapResultData(result, readNextCustomerNumber(result.data));
  }
  public async list(
    options: ContactListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactListResult> {
    const result = await this.client.raw.contact.getContacts(
      asRequest<"getContacts">(
        {
          extraQuery: contactListQuery(options)
        },
        requestOptions
      )
    );
    return mapContactListResult(result);
  }
  public async get(
    contactId: SevdeskIdInput,
    embed: readonly ContactEmbedInput[] = [],
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactResult> {
    const result = await this.client.raw.contact.getContactById(
      asRequest<"getContactById">(
        {
          path: { contactId: numericId(contactId, "contact") },
          ...(embed.length ? { extraQuery: { embed } } : {})
        },
        requestOptions
      )
    );
    return mapContactResult(result);
  }
  public async update(
    contactId: SevdeskIdInput,
    input: ContactUpdateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactUpdateWorkflowResult> {
    const id = numericId(contactId, "contact");
    const body = buildContactUpdatePayload(input);
    const context = this.client.createWorkflowContext<
      "contacts.update",
      ContactUpdateWorkflowOperationId,
      ContactUpdateWorkflowPartial
    >("contacts.update");
    let before: SevdeskContact;
    try {
      const current = await context.step("load contact before update", "getContactById", () =>
        this.get(id, ["category", "parent"], requestOptions)
      );
      before = current.data;
    } catch (error) {
      throw context.error(error, { partial: {} });
    }
    assertContactKindMatches(before, input);
    const partial: {
      before: SevdeskContact;
      receipt?: WorkflowActionReceipt<"updateContact">;
    } = { before };
    try {
      const updated = await context.step("update contact", "updateContact", () =>
        this.client.raw.contact.updateContact(
          forwardCompatibleRequest<"updateContact">(
            { path: { contactId: id }, body },
            workflowWriteOptions(requestOptions)
          )
        )
      );
      const receipt = workflowActionReceipt("updateContact", updated);
      partial.receipt = receipt;
      const hydrated = await context.step("load contact after update", "getContactById", () =>
        this.get(id, ["category", "parent"], requestOptions)
      );
      return context.result({ before, receipt, contact: hydrated.data });
    } catch (error) {
      throw context.error(error, { partial });
    }
  }
  public async delete(
    contactId: SevdeskIdInput,
    options: { readonly confirm: true },
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactDeleteResult> {
    if (options.confirm !== true) {
      throw new SevdeskConfigurationError("contacts.delete requires { confirm: true }.");
    }
    const id = numericId(contactId, "contact");
    const result = await this.client.raw.contact.deleteContact(
      asRequest<"deleteContact">({ path: { contactId: id } }, workflowWriteOptions(requestOptions))
    );
    return workflowActionReceipt("deleteContact", result);
  }
  public async create<
    const TInput extends CompleteContactInput,
    const TOptions extends CompleteContactOptions = object
  >(
    input: TInput,
    options: TOptions = {} as TOptions,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreateContactWorkflowResult<TInput, TOptions>> {
    validateCompleteContactInput(input);
    const context = this.client.createWorkflowContext<
      "contacts.create",
      ContactWorkflowOperationId,
      CompleteContactPartial
    >("contacts.create");
    const createdAddressIds: EntityId[] = [];
    const createdCommunicationWayIds: EntityId[] = [];
    let createdContactId: EntityId | undefined;
    let accountingAttempted = false;
    const writeOptions = workflowWriteOptions(requestOptions);
    try {
      const customerNumber = await this.resolveCustomerNumber(
        input,
        options,
        context,
        requestOptions
      );
      const contactPayload = buildContactPayload(input.contact, customerNumber);
      const contact = await context.step("create contact", "createContact", () =>
        this.client.raw.contact.createContact(
          forwardCompatibleRequest<"createContact">({ body: contactPayload }, writeOptions)
        )
      );
      const contactId = requireEntityId(contact.data, "contact");
      createdContactId = contactId;
      const contactReference = {
        id: numericId(contactId, "contact"),
        objectName: "Contact" as const
      };
      const addresses = [];
      for (const [index, address] of (input.addresses ?? []).entries()) {
        const result = await context.step(
          `create contact address ${index + 1}`,
          "createContactAddress",
          () =>
            this.client.raw.contactAddress.createContactAddress(
              asRequest<"createContactAddress">(
                {
                  body: {
                    ...omitServerManagedCreateFields(address),
                    objectName: "ContactAddress",
                    contact: contactReference,
                    country: wireReference(address.country),
                    category: address.category ? wireReference(address.category) : null
                  }
                },
                writeOptions
              )
            )
        );
        const createdAddress = requireValue(result.data, "contact address");
        createdAddressIds.push(requireEntityId(createdAddress, "contact address"));
        addresses.push(createdAddress);
      }
      const communicationWays = [];
      for (const [index, communicationWay] of (input.communicationWays ?? []).entries()) {
        const key = await this.resolveCommunicationWayKey(
          communicationWay.key,
          context,
          requestOptions
        );
        const result = await context.step(
          `create communication way ${index + 1}`,
          "createCommunicationWay",
          () => {
            const body = forwardCompatibleBody({
              ...omitServerManagedCreateFields(communicationWay),
              type: stringEnumCode(
                CommunicationWayType,
                communicationWay.type,
                "communication-way type"
              ),
              objectName: "CommunicationWay" as const,
              contact: contactReference,
              key: wireReference(key)
            });
            return this.client.raw.communicationWay.createCommunicationWay(
              forwardCompatibleRequest<"createCommunicationWay">({ body }, writeOptions)
            );
          }
        );
        const createdCommunicationWay = requireValue(result.data, "communication way");
        createdCommunicationWayIds.push(
          requireEntityId(createdCommunicationWay, "communication way")
        );
        communicationWays.push(createdCommunicationWay);
      }
      const hydratedContact = await context.step("hydrate contact", "getContactById", () =>
        this.get(contactReference.id, ["category", "parent"], requestOptions)
      );
      let accounting: CreatedAccountingContact | undefined;
      if (input.accounting) {
        const accountingInput = input.accounting;
        accountingAttempted = true;
        const result = await context.step(
          "create accounting contact",
          "createAccountingContact",
          () =>
            this.client.raw.accountingContact.createAccountingContact(
              asRequest<"createAccountingContact">(
                {
                  body: {
                    ...omitServerManagedCreateFields(accountingInput),
                    contact: contactReference
                  }
                },
                writeOptions
              )
            )
        );
        accounting = normalizeCreatedAccountingContact(
          requireValue(result.data, "accounting contact")
        );
      }
      const result = context.result({
        contact: hydratedContact.data,
        addresses,
        communicationWays,
        ...(accounting === undefined ? {} : { accounting })
      });
      return refineCompleteContactWorkflow(result, input) as CreateContactWorkflowResult<
        TInput,
        TOptions
      >;
    } catch (error) {
      const accountingWasDefinitelyRejected =
        accountingAttempted &&
        error instanceof SevdeskApiError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 408;
      const compensation =
        options.rollback === "best-effort" &&
        createdContactId !== undefined &&
        (!accountingAttempted || accountingWasDefinitelyRejected)
          ? await this.compensate(
              createdContactId,
              createdAddressIds,
              createdCommunicationWayIds,
              requestOptions
            )
          : [];
      throw context.error(error, {
        partial: {
          contactId: createdContactId,
          addressIds: createdAddressIds,
          communicationWayIds: createdCommunicationWayIds
        },
        compensation
      });
    }
  }
  private async resolveCustomerNumber(
    input: CompleteContactInput,
    options: CompleteContactOptions,
    context: WorkflowContext<"contacts.create", ContactWorkflowOperationId, CompleteContactPartial>,
    requestOptions?: CuratedRequestOptions
  ): Promise<string | undefined> {
    const requested = input.contact.customerNumber;
    if (requested === "next") {
      const result = await context.step("get next customer number", "getNextCustomerNumber", () =>
        this.client.raw.contact.getNextCustomerNumber(
          asRequest<"getNextCustomerNumber">({}, requestOptions)
        )
      );
      return readNextCustomerNumber(result.data);
    }
    if (requested && options.validateCustomerNumber !== false) {
      const result = await context.step(
        "validate customer number",
        "contactCustomerNumberAvailabilityCheck",
        () =>
          this.client.raw.contact.contactCustomerNumberAvailabilityCheck(
            asRequest<"contactCustomerNumberAvailabilityCheck">(
              {
                query: { customerNumber: requested }
              },
              requestOptions
            )
          )
      );
      if (result.data !== true) {
        throw new SevdeskConfigurationError(`Customer number "${requested}" is not available.`);
      }
    }
    return requested;
  }
  private async resolveCommunicationWayKey(
    key: SevdeskReference<"CommunicationWayKey"> | CommunicationWayKeyNameInput,
    context: WorkflowContext<"contacts.create", ContactWorkflowOperationId, CompleteContactPartial>,
    requestOptions?: CuratedRequestOptions
  ): Promise<SevdeskReference<"CommunicationWayKey">> {
    if (typeof key === "object" && "objectName" in key) return key;
    if (!this.communicationWayKeys) {
      const result = await context.step(
        "load communication-way keys",
        "getCommunicationWayKeys",
        () =>
          this.client.raw.communicationWay.getCommunicationWayKeys(
            asRequest<"getCommunicationWayKeys">(
              {
                query: { countAll: true, limit: 100 }
              },
              requestOptions
            )
          )
      );
      const map = new Map<string, SevdeskReference<"CommunicationWayKey">>();
      for (const item of result.data) {
        if (item.id && item.name) {
          map.set(item.name.toLocaleLowerCase(), {
            id: item.id,
            objectName: "CommunicationWayKey"
          });
        }
      }
      this.communicationWayKeys = map;
    }
    const semanticKey = String(resolveEnumValueStrict(CommunicationWayKeyName, key));
    const match = this.communicationWayKeys.get(semanticKey.toLocaleLowerCase());
    if (!match) {
      throw new SevdeskConfigurationError(
        `Unknown communication-way key "${key}". Use a returned CommunicationWayKey reference.`
      );
    }
    return match;
  }
  private async compensate(
    contactId: EntityId,
    addressIds: readonly EntityId[],
    communicationWayIds: readonly EntityId[],
    requestOptions?: CuratedRequestOptions
  ): Promise<CompensationResult[]> {
    const results: CompensationResult[] = [];
    const writeOptions = workflowWriteOptions(requestOptions);
    for (const id of [...communicationWayIds].reverse()) {
      results.push(
        await compensate("deleteCommunicationWay", () =>
          this.client.raw.communicationWay.deleteCommunicationWay(
            asRequest<"deleteCommunicationWay">(
              {
                path: { communicationWayId: numericId(id, "communication way") }
              },
              writeOptions
            )
          )
        )
      );
    }
    for (const id of [...addressIds].reverse()) {
      results.push(
        await compensate("deleteContactAddress", () =>
          this.client.raw.contactAddress.deleteContactAddress(
            asRequest<"deleteContactAddress">(
              {
                path: { contactAddressId: numericId(id, "contact address") }
              },
              writeOptions
            )
          )
        )
      );
    }
    results.push(
      await compensate("deleteContact", () =>
        this.client.raw.contact.deleteContact(
          asRequest<"deleteContact">(
            {
              path: { contactId: numericId(contactId, "contact") }
            },
            writeOptions
          )
        )
      )
    );
    return results;
  }
}

function validateCompleteContactInput(input: CompleteContactInput): void {
  buildContactPayload(input.contact);
  for (const [index, address] of (input.addresses ?? []).entries()) {
    validateFinitePayload(address, `contact address ${index + 1}`);
    wireReference(address.country);
    if (address.category !== null) wireReference(address.category);
  }
  for (const [index, communicationWay] of (input.communicationWays ?? []).entries()) {
    validateFinitePayload(communicationWay, `communication way ${index + 1}`);
    stringEnumCode(
      CommunicationWayType,
      communicationWay.type,
      `communication-way type ${index + 1}`
    );
    if (typeof communicationWay.key === "object" && "objectName" in communicationWay.key) {
      wireReference(communicationWay.key);
    } else {
      resolveEnumValueStrict(CommunicationWayKeyName, communicationWay.key);
    }
  }
  if (input.accounting !== undefined) {
    validateFinitePayload(input.accounting, "accounting contact");
  }
}

function normalizeCreatedAccountingContact(
  value: NonNullable<OperationData<"createAccountingContact">>
): CreatedAccountingContact {
  const id = requireEntityId(value, "accounting contact");
  if (value.objectName !== "AccountingContact") {
    throw new SevdeskResponseValidationError(
      'sevdesk returned an accounting contact without objectName "AccountingContact".',
      { value }
    );
  }
  return {
    ...value,
    id: String(id),
    objectName: "AccountingContact"
  };
}

export function readNextCustomerNumber(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  throw new SevdeskResponseValidationError("sevdesk returned no next customer number.", {
    value
  });
}

function refineCompleteContactWorkflow<TInput extends CompleteContactInput>(
  result: WorkflowResult<"contacts.create", CompleteContactData, ContactWorkflowOperationId>,
  input: TInput
): WorkflowResult<"contacts.create", CompleteContactDataFor<TInput>, ContactWorkflowOperationId> {
  if (input.accounting !== undefined && result.data.accounting === undefined) {
    throw new SevdeskResponseValidationError(
      "The accounting-contact step completed without response data.",
      { value: result.toSummary() }
    );
  }
  return result as WorkflowResult<
    "contacts.create",
    CompleteContactDataFor<TInput>,
    ContactWorkflowOperationId
  >;
}

async function compensate(
  operationId: string,
  action: () => Promise<unknown>
): Promise<CompensationResult> {
  try {
    await action();
    return { operationId, success: true };
  } catch (error) {
    return { operationId, success: false, error };
  }
}
