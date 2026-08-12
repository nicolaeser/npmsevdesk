import type { SevdeskClient } from "../client/sevdesk-client.js";
import type { SevdeskContact } from "../domain/models.js";
import { mapContactResult } from "../domain/result-mappers.js";
import type { ContactListResult } from "../domain/results.js";
import {
  ContactCategory,
  ContactStatus,
  LegacyTaxType,
  type ContactStatusInput,
  type LegacyTaxTypeInput
} from "../enums/domain-enums.js";
import type { SevdeskReference } from "../types/references.js";
import { SevdeskLookupNotFoundError } from "../lookup/errors.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { validateFinitePayload } from "../utils/validation.js";
import { assertContactKindMatches } from "./contact-kind.js";
import type { ContactsBundle } from "./contacts.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericEnumCode,
  numericId,
  requireEntityId,
  stringEnumCode,
  wireReference
} from "./internal.js";
import type {
  CompleteContactDataFor,
  CompleteContactWorkflowOperationId,
  ContactWorkflowOperationId,
  CreateContactWorkflowResult
} from "./contacts.js";
import type {
  CompleteContactInput,
  CompleteContactOptions,
  ContactCategoryInput,
  CuratedRequestOptions,
  WorkflowStepFor,
  WorkflowResult
} from "./types.js";
import { SevdeskWorkflowError, workflowWriteOptions, type WorkflowContext } from "./workflow.js";
import type { components } from "../types/openapi.js";

type ContactWireUpdate = components["schemas"]["Model_ContactUpdate"];

const CONTACT_MERGE_COMMON_KEYS = [
  "description",
  "academicTitle",
  "gender",
  "birthday",
  "vatNumber",
  "bankAccount",
  "bankNumber",
  "defaultCashbackTime",
  "defaultCashbackPercent",
  "defaultTimeToPay",
  "taxNumber",
  "taxOffice",
  "exemptVat",
  "defaultDiscountAmount",
  "defaultDiscountPercentage",
  "buyerReference",
  "governmentAgency"
] as const;
const CONTACT_MERGE_ORGANISATION_KEYS = ["name", "additionalName", "parentOrganisation"] as const;
const CONTACT_MERGE_PERSON_KEYS = [
  "firstName",
  "lastName",
  "middleName",
  "title",
  "organisation"
] as const;
const CONTACT_MERGE_ALLOWED_KEYS = [
  ...CONTACT_MERGE_COMMON_KEYS,
  ...CONTACT_MERGE_ORGANISATION_KEYS,
  ...CONTACT_MERGE_PERSON_KEYS,
  "kind",
  "status",
  "category",
  "taxSet",
  "taxType"
] as const;

type ContactMergeCommon = Omit<
  ContactWireUpdate,
  | "name"
  | "name2"
  | "surename"
  | "familyname"
  | "titel"
  | "parent"
  | "customerNumber"
  | "status"
  | "category"
  | "taxSet"
  | "taxType"
> & {
  readonly status?: ContactStatusInput;
  readonly category?: ContactCategoryInput;
  readonly taxSet?: SevdeskReference<"TaxSet"> | null;
  readonly taxType?: LegacyTaxTypeInput | null;
};

export type ContactMergeInput = ContactMergeCommon &
  (
    | {
        readonly kind: "organisation";
        readonly name?: string;
        readonly additionalName?: string | null;
        readonly parentOrganisation?: SevdeskReference<"Contact"> | null;
        readonly firstName?: never;
        readonly lastName?: never;
        readonly middleName?: never;
        readonly title?: never;
        readonly organisation?: never;
      }
    | {
        readonly kind: "person";
        readonly firstName?: string | null;
        readonly lastName?: string | null;
        readonly middleName?: string | null;
        readonly title?: string | null;
        readonly organisation?: SevdeskReference<"Contact"> | null;
        readonly name?: never;
        readonly additionalName?: never;
        readonly parentOrganisation?: never;
      }
    | {
        readonly kind?: never;
        readonly name?: never;
        readonly additionalName?: never;
        readonly parentOrganisation?: never;
        readonly firstName?: never;
        readonly lastName?: never;
        readonly middleName?: never;
        readonly title?: never;
        readonly organisation?: never;
      }
  );

type ContactUpsertBase<TCreate extends CompleteContactInput> = {
  readonly match: {
    readonly customerNumber: string;
  };
  readonly create: TCreate;
};

export type ContactUpsertInput<
  TCreate extends CompleteContactInput = CompleteContactInput,
  TMerge extends ContactMergeInput | undefined = ContactMergeInput | undefined
> = ContactUpsertBase<TCreate> &
  ([TMerge] extends [undefined]
    ? { readonly merge?: never }
    : undefined extends TMerge
      ? {
          readonly merge?: TMerge;
        }
      : {
          readonly merge: TMerge;
        });

type ContactMergeAllowedKey = (typeof CONTACT_MERGE_ALLOWED_KEYS)[number];
type NoExtraContactMerge<TMerge extends ContactMergeInput> = TMerge &
  Record<Exclude<keyof TMerge, ContactMergeAllowedKey>, never>;

export type StrictContactUpsertInput<
  TCreate extends CompleteContactInput,
  TMerge extends ContactMergeInput | undefined
> = ContactUpsertInput<TCreate, TMerge> &
  (TMerge extends ContactMergeInput ? { readonly merge: NoExtraContactMerge<TMerge> } : object);

export interface ContactUpsertOptions extends CompleteContactOptions {
  readonly mode?: "merge";
}

type ContactUpsertCreateInput<TInput extends ContactUpsertInput> =
  TInput extends ContactUpsertInput<infer TCreate, ContactMergeInput | undefined> ? TCreate : never;

export interface ContactUpsertCreatedData<TInput extends ContactUpsertInput> {
  readonly action: "created";
  readonly contact: SevdeskContact;
  readonly creation: CompleteContactDataFor<ContactUpsertCreateInput<TInput>>;
}

type ContactUpsertMatchedAction<TInput extends ContactUpsertInput> = TInput extends {
  readonly merge: ContactMergeInput;
}
  ? "merged"
  : TInput extends { readonly merge?: never }
    ? "matched"
    : "matched" | "merged";

export interface ContactUpsertMatchedData<TInput extends ContactUpsertInput> {
  readonly action: ContactUpsertMatchedAction<TInput>;
  readonly contact: SevdeskContact;
  readonly previous: SevdeskContact;
}

export type ContactUpsertData<TInput extends ContactUpsertInput> =
  ContactUpsertCreatedData<TInput> | ContactUpsertMatchedData<TInput>;

export type ContactUpsertOperationId<
  TInput extends ContactUpsertInput,
  TOptions extends ContactUpsertOptions = object
> =
  | "getContacts"
  | "getContactById"
  | Exclude<
      CompleteContactWorkflowOperationId<ContactUpsertCreateInput<TInput>, TOptions>,
      "getNextCustomerNumber" | "contactCustomerNumberAvailabilityCheck"
    >
  | (TOptions extends { readonly validateCustomerNumber: false }
      ? never
      : "contactCustomerNumberAvailabilityCheck")
  | (TInput extends { readonly merge: ContactMergeInput } ? "updateContact" : never);

export type ContactUpsertResult<
  TInput extends ContactUpsertInput,
  TOptions extends ContactUpsertOptions = object
> = WorkflowResult<
  "contacts.upsert",
  ContactUpsertData<TInput>,
  ContactUpsertOperationId<TInput, TOptions>
>;

type AnyContactUpsertOperationId =
  "getContacts" | "updateContact" | "getContactById" | ContactWorkflowOperationId;

export class ContactUpsertModule {
  public constructor(
    private readonly client: SevdeskClient,
    private readonly contacts: ContactsBundle
  ) {}
  public async upsert<
    const TCreate extends CompleteContactInput,
    const TMerge extends ContactMergeInput | undefined = undefined,
    const TOptions extends ContactUpsertOptions = object
  >(
    input: StrictContactUpsertInput<TCreate, TMerge>,
    options: TOptions = {} as TOptions,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactUpsertResult<ContactUpsertInput<TCreate, TMerge>, TOptions>> {
    validateUpsertInput(input, options);
    const customerNumber = input.match.customerNumber;
    const context = this.client.createWorkflowContext<
      "contacts.upsert",
      AnyContactUpsertOperationId,
      { readonly contactId?: number }
    >("contacts.upsert");
    let existing: SevdeskContact | undefined;
    try {
      const lookup = await this.client.lookup.contact({ customerNumber }, requestOptions);
      appendLookupPages(context, lookup.pages);
      existing = lookup.data;
    } catch (error) {
      if (error instanceof SevdeskLookupNotFoundError) {
        appendLookupPages(context, error.pages as readonly ContactListResult[]);
      } else {
        throw error;
      }
    }
    if (existing === undefined) {
      const createInput = withMatchedCustomerNumber<TCreate>(input.create, customerNumber);
      let creation: CreateContactWorkflowResult<TCreate, TOptions>;
      try {
        creation = await this.contacts.create(createInput, options, requestOptions);
      } catch (error) {
        if (error instanceof SevdeskWorkflowError) {
          context.steps.push(
            ...(error.completedSteps as unknown as (typeof context.steps)[number][])
          );
          context.currentOperationId = error.failedOperationId as AnyContactUpsertOperationId;
          throw context.error(error.cause ?? error, {
            partial: error.partial as { readonly contactId?: number },
            compensation: error.compensation,
            retrySafe: error.retrySafe
          });
        }
        throw error;
      }
      context.steps.push(...(creation.steps as unknown as (typeof context.steps)[number][]));
      return context.result({
        action: "created",
        contact: creation.data.contact,
        creation: creation.data
      }) as unknown as ContactUpsertResult<ContactUpsertInput<TCreate, TMerge>, TOptions>;
    }
    const contactId = numericId(requireEntityId(existing, "contact"), "contact");
    let action: "matched" | "merged" = "matched";
    if (input.merge !== undefined) {
      assertContactKindMatches(existing, input.merge);
      const body = buildContactUpdatePayload(input.merge);
      try {
        await context.step("merge contact", "updateContact", () =>
          this.client.raw.contact.updateContact(
            forwardCompatibleRequest<"updateContact">(
              { path: { contactId }, body },
              workflowWriteOptions(requestOptions)
            )
          )
        );
        action = "merged";
      } catch (error) {
        throw context.error(error, { partial: { contactId } });
      }
    }
    try {
      const hydrated = await context.step("hydrate contact", "getContactById", () =>
        this.client.raw.contact
          .getContactById(
            asRequest<"getContactById">(
              {
                path: { contactId },
                extraQuery: { embed: ["category", "parent"] }
              },
              requestOptions
            )
          )
          .then(mapContactResult)
      );
      return context.result({
        action,
        contact: hydrated.data,
        previous: existing
      }) as unknown as ContactUpsertResult<ContactUpsertInput<TCreate, TMerge>, TOptions>;
    } catch (error) {
      throw context.error(error, { partial: { contactId } });
    }
  }
}

function validateUpsertInput(input: ContactUpsertInput, options: ContactUpsertOptions): void {
  if (typeof input.match.customerNumber !== "string" || input.match.customerNumber.trim() === "") {
    throw new SevdeskConfigurationError("Contact upsert requires a non-empty customer number.");
  }
  if (options.mode !== undefined && options.mode !== "merge") {
    throw new SevdeskConfigurationError(
      'Contact upsert supports only mode: "merge"; replace semantics are not safe for this API.'
    );
  }
  const createCustomerNumber = input.create.contact.customerNumber;
  if (createCustomerNumber === "next") {
    throw new SevdeskConfigurationError(
      'Contact upsert cannot use customerNumber: "next" because customer number is its identity.'
    );
  }
  if (createCustomerNumber !== undefined && createCustomerNumber !== input.match.customerNumber) {
    throw new SevdeskConfigurationError(
      "The create customer number must equal the upsert match customer number."
    );
  }
  if (input.merge !== undefined) buildContactUpdatePayload(input.merge);
}

function withMatchedCustomerNumber<const TCreate extends CompleteContactInput>(
  input: TCreate,
  customerNumber: string
): TCreate {
  if (input.contact.customerNumber === customerNumber) return input;
  return {
    ...input,
    contact: { ...input.contact, customerNumber }
  } as TCreate;
}

function appendLookupPages(
  context: WorkflowContext<"contacts.upsert", AnyContactUpsertOperationId>,
  pages: readonly ContactListResult[]
): void {
  for (const page of pages) {
    context.steps.push({
      name: "find contact by customer number",
      operationId: "getContacts",
      status: page.response.status,
      data: page.objects,
      json: page.json,
      raw: page.raw
    } satisfies WorkflowStepFor<"getContacts">);
  }
}

export function buildContactUpdatePayload(
  input: ContactMergeInput
): ReturnType<typeof forwardCompatibleBody<ContactWireUpdate>> {
  assertOnlyContactMergeKeys(input);
  assertContactMergeShape(input);
  if (Object.keys(input).every((key) => key === "kind")) {
    throw new SevdeskConfigurationError("Contact merge must change at least one field.");
  }
  validateFinitePayload(input, "contact merge");
  const {
    kind,
    status,
    category,
    taxSet,
    taxType,
    name,
    additionalName,
    parentOrganisation,
    firstName,
    lastName,
    middleName,
    title,
    organisation
  } = input;
  const common = pickContactMergeCommon(input);
  const identityFields =
    kind === "organisation"
      ? {
          ...(name === undefined ? {} : { name }),
          ...(additionalName === undefined ? {} : { name2: additionalName }),
          ...(parentOrganisation === undefined
            ? {}
            : {
                parent: parentOrganisation === null ? null : wireReference(parentOrganisation)
              })
        }
      : kind === "person"
        ? {
            ...(firstName === undefined ? {} : { surename: firstName }),
            ...(lastName === undefined ? {} : { familyname: lastName }),
            ...(middleName === undefined ? {} : { name2: middleName }),
            ...(title === undefined ? {} : { titel: title }),
            ...(organisation === undefined
              ? {}
              : { parent: organisation === null ? null : wireReference(organisation) })
          }
        : {};
  const resolvedTaxType =
    taxType === undefined || taxType === null
      ? taxType
      : (stringEnumCode(LegacyTaxType, taxType, "contact tax type") as NonNullable<
          ContactWireUpdate["taxType"]
        >);
  return forwardCompatibleBody<ContactWireUpdate>({
    ...common,
    ...identityFields,
    ...(status === undefined
      ? {}
      : { status: numericEnumCode(ContactStatus, status, "contact status") }),
    ...(category === undefined
      ? {}
      : {
          category:
            typeof category === "object" && "objectName" in category
              ? wireReference(category)
              : {
                  id: numericEnumCode(ContactCategory, category, "contact category"),
                  objectName: "Category"
                }
        }),
    ...(taxSet === undefined ? {} : { taxSet: taxSet === null ? null : wireReference(taxSet) }),
    ...(taxType === undefined ? {} : { taxType: resolvedTaxType })
  });
}

function assertOnlyContactMergeKeys(value: unknown): asserts value is ContactMergeInput {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskConfigurationError("Contact merge must be an object.");
  }
  const allowed = new Set<string>(CONTACT_MERGE_ALLOWED_KEYS);
  const forbidden = Object.keys(value).filter((key) => !allowed.has(key));
  if (forbidden.length > 0) {
    throw new SevdeskConfigurationError(
      `Contact merge contains unsupported field${forbidden.length === 1 ? "" : "s"}: ${forbidden.join(
        ", "
      )}.`
    );
  }
}

function assertContactMergeShape(input: ContactMergeInput): void {
  const kind: unknown = input.kind;
  if (kind !== undefined && kind !== "organisation" && kind !== "person") {
    throw new SevdeskConfigurationError('Contact merge kind must be "organisation" or "person".');
  }
  const organisationFields = CONTACT_MERGE_ORGANISATION_KEYS.filter((key) => hasOwn(input, key));
  const personFields = CONTACT_MERGE_PERSON_KEYS.filter((key) => hasOwn(input, key));
  if (kind !== "organisation" && organisationFields.length > 0) {
    throw new SevdeskConfigurationError(
      `Organisation merge fields require kind: "organisation": ${organisationFields.join(", ")}.`
    );
  }
  if (kind !== "person" && personFields.length > 0) {
    throw new SevdeskConfigurationError(
      `Person merge fields require kind: "person": ${personFields.join(", ")}.`
    );
  }
  if (kind === "organisation" && hasOwn(input, "name")) {
    const name: unknown = input.name;
    if (typeof name !== "string" || name.trim() === "") {
      throw new SevdeskConfigurationError(
        "An organisation merge name must be a non-empty string when provided."
      );
    }
  }
}

function pickContactMergeCommon(input: ContactMergeInput): ContactWireUpdate {
  return Object.fromEntries(
    CONTACT_MERGE_COMMON_KEYS.filter((key) => hasOwn(input, key)).map((key) => [key, input[key]])
  ) as ContactWireUpdate;
}

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.hasOwn(value, key);
}
