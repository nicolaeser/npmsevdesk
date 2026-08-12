import {
  SevdeskLookupAmbiguityError,
  SevdeskLookupNotFoundError,
  createSevdeskClient
} from "npmsevdesk";

const apiToken = process.env.SEVDESK_API_TOKEN;

if (!apiToken) {
  throw new Error("Set SEVDESK_API_TOKEN before running this example.");
}

const client = createSevdeskClient({ apiToken });

try {
  const contact = await client.lookup.contact({ customerNumber: "K-10042" });
  const account = await client.lookup.checkAccount({ iban: "DE02100500000054540402" });
  const part = await client.lookup.part({ partNumber: "SKU-123" });
  const country = await client.lookup.country({ code: "FR" });
  console.log({
    contactId: contact.data.id,
    checkAccountId: account.data.id,
    partId: part.data.id,
    countryId: country.data.id,
    inspectedAccountPages: account.pages.length
  });
  const optionalPart = await client.lookup.findPart({ partNumber: "OPTIONAL-SKU" });
  if (optionalPart === undefined) {
    console.log("The optional part does not exist.");
  }
} catch (error) {
  if (error instanceof SevdeskLookupNotFoundError) {
    console.error("Required object not found", error.resource);
  } else if (error instanceof SevdeskLookupAmbiguityError) {
    console.error("Duplicate exact identifiers", error.resource, error.matchCount);
  } else {
    throw error;
  }
} finally {
  client.dispose();
}
