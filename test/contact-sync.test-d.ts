import {
  createSevdeskClient,
  refs,
  type ContactAddressUpdateResult,
  type ContactUpsertResult
} from "../src/index.js";

const client = createSevdeskClient({ apiToken: "test-token" });

type Equal<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight ? 1 : 2 ? true : false;
type Assert<TValue extends true> = TValue;
type ResultData<TPromise extends Promise<unknown>> =
  Awaited<TPromise> extends {
    readonly data: infer TData;
  }
    ? TData
    : never;
type ResultOperation<TPromise extends Promise<unknown>> =
  Awaited<TPromise> extends {
    readonly steps: readonly { readonly operationId: infer TOperationId }[];
  }
    ? TOperationId
    : never;

const upsertInput = {
  match: { customerNumber: "K-10042" },
  create: {
    contact: {
      kind: "organisation",
      name: "Acme GmbH",
      category: "customer"
    }
  },
  merge: {
    kind: "organisation",
    name: "Acme GmbH",
    status: "active",
    category: "customer",
    taxType: "EU"
  }
} as const;
const upsert: Promise<ContactUpsertResult<typeof upsertInput>> =
  client.contacts.upsert(upsertInput);
void upsert;
type MergeOperations = ResultOperation<typeof upsert>;
type _MergeIncludesUpdate = Assert<
  Equal<Extract<MergeOperations, "updateContact">, "updateContact">
>;
type MergeMatchedAction = Extract<
  ResultData<typeof upsert>,
  { readonly previous: unknown }
>["action"];
type _MergeActionIsCorrelated = Assert<Equal<MergeMatchedAction, "merged">>;

const noMergeInput = {
  match: { customerNumber: "K-20000" },
  create: {
    contact: { kind: "organisation", name: "No Merge GmbH", category: "customer" }
  }
} as const;
const noMergeUpsert = client.contacts.upsert(noMergeInput, {
  validateCustomerNumber: false
} as const);
type NoMergeOperations = ResultOperation<typeof noMergeUpsert>;
type _NoMergeExcludesUpdate = Assert<Equal<Extract<NoMergeOperations, "updateContact">, never>>;
type _NoMergeExcludesAddressCreate = Assert<
  Equal<Extract<NoMergeOperations, "createContactAddress">, never>
>;
type _NoMergeExcludesCustomerCheck = Assert<
  Equal<Extract<NoMergeOperations, "contactCustomerNumberAvailabilityCheck">, never>
>;
type NoMergeMatchedAction = Extract<
  ResultData<typeof noMergeUpsert>,
  { readonly previous: unknown }
>["action"];
type _NoMergeActionIsCorrelated = Assert<Equal<NoMergeMatchedAction, "matched">>;

const addressUpdate: Promise<ContactAddressUpdateResult> = client.contacts.addresses.update(5, 11, {
  country: refs.country(1),
  category: refs.category(2),
  city: "Berlin"
});
void addressUpdate;

client.contacts.communicationWays.create(5, {
  type: "email",
  key: "work",
  value: "billing@example.test",
  main: true
});

client.contacts.customFields.create(5, {
  setting: refs.contactCustomFieldSetting(9),
  value: "external-42"
});

client.contacts.customFields.update(5, 31, { value: "external-43" });
client.contacts.customFields.remove(5, 31, { confirm: true });

// @ts-expect-error destructive calls require an explicit confirmation object
client.contacts.addresses.remove(5, 11);

client.contacts.upsert(
  {
    match: { customerNumber: "K-10042" },
    create: {
      contact: { kind: "organisation", name: "Acme", category: "customer" }
    }
  },
  // @ts-expect-error replace semantics are intentionally unsupported
  { mode: "replace" }
);

client.contacts.upsert({
  match: { customerNumber: "K-10042" },
  create: {
    contact: { kind: "organisation", name: "Acme", category: "customer" }
  },
  // @ts-expect-error upsert identity cannot be changed by the merge patch
  merge: { customerNumber: "K-20000" }
});

client.contacts.upsert({
  match: { customerNumber: "K-10042" },
  create: {
    contact: { kind: "organisation", name: "Acme", category: "customer" }
  },
  // @ts-expect-error an organisation merge cannot clear its kind-defining name
  merge: { kind: "organisation", name: null }
});

const broadAddressUpdate = {
  city: "Berlin",
  contact: refs.contact(99)
};
// @ts-expect-error broad variables cannot smuggle a contact owner into an update body
client.contacts.addresses.update(5, 11, broadAddressUpdate);

const broadCommunicationUpdate = {
  value: "billing@example.test",
  contact: refs.contact(99)
};
// @ts-expect-error broad variables cannot smuggle a contact owner into an update body
client.contacts.communicationWays.update(5, 21, broadCommunicationUpdate);

const broadMerge = {
  description: "unsafe",
  customerNumber: "K-CHANGED"
};
client.contacts.upsert({
  match: { customerNumber: "K-10042" },
  create: {
    contact: { kind: "organisation", name: "Acme", category: "customer" }
  },
  // @ts-expect-error broad merge variables cannot smuggle wire-level identity fields
  merge: broadMerge
});
