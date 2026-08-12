import {
  CommunicationWayKeyName,
  CommunicationWayType,
  ContactCategory,
  ContactStatus,
  createSevdeskClient,
  refs
} from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;

if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });

try {
  const synchronized = await client.contacts.upsert(
    {
      match: { customerNumber: "K-10042" },
      create: {
        contact: {
          kind: "organisation",
          name: "Example GmbH",
          customerNumber: "K-10042",
          category: ContactCategory.CUSTOMER
        },
        addresses: [
          {
            street: "Example Street 1",
            zip: "10115",
            city: "Berlin",
            country: refs.country(1),
            category: refs.category(47)
          }
        ]
      },
      merge: {
        kind: "organisation",
        name: "Example GmbH",
        description: "Synchronized by the CRM",
        status: ContactStatus.ACTIVE
      }
    },
    { rollback: "best-effort" }
  );
  const contactId = refs.contact(Number(synchronized.data.contact.id)).id;
  const email = await client.contacts.communicationWays.create(contactId, {
    type: CommunicationWayType.EMAIL,
    key: CommunicationWayKeyName.INVOICE_ADDRESS,
    value: "billing@example.test",
    main: true
  });
  const customField = await client.contacts.customFields.create(contactId, {
    setting: refs.contactCustomFieldSetting(9),
    value: "crm-4711"
  });
  console.log({
    action: synchronized.data.action,
    contactId,
    communicationWay: email.data.communicationWay,
    customField: customField.data
  });
  if (process.env.SEVDESK_REMOVE_CUSTOM_FIELD === "I_UNDERSTAND_THIS_DELETES_DATA") {
    const customFieldId = refs.contactCustomField(Number(customField.data.id)).id;
    await client.contacts.customFields.remove(contactId, customFieldId, { confirm: true });
  }
} finally {
  client.dispose();
}
