import {
  SevdeskLookupAmbiguityError,
  taxes,
  type SevdeskLookupError,
  SevdeskLookupNotFoundError,
  type CheckAccountLookupResult,
  type ContactLookupResult,
  type LookupCheckAccount,
  type LookupPart,
  type LookupStaticCountry,
  type PartLookupResult,
  type SevdeskClient,
  type SevdeskContact,
  type StaticCountryLookupResult
} from "../src/index.js";

declare const client: SevdeskClient;

async function verifyLookupContracts(): Promise<void> {
  const contact: ContactLookupResult = await client.lookup.contact({
    customerNumber: "K-10042"
  });
  const contactData: SevdeskContact = contact.data;
  const contactJsonPages: typeof contact.json = contact.toJSON();
  const optionalContact = await client.lookup.findContact({ customerNumber: "K-10042" });
  if (optionalContact !== undefined) {
    const narrowedContact: SevdeskContact = optionalContact.data;
    void narrowedContact;
  }
  const account: CheckAccountLookupResult = await client.lookup.checkAccount({
    iban: "DE02100500000054540402"
  });
  const accountData: LookupCheckAccount = account.data;
  const accountByName = await client.lookup.findCheckAccount({ name: "Business account" });
  const part: PartLookupResult = await client.lookup.part({ partNumber: "SKU-123" });
  const partData: LookupPart = part.data;
  const partByName = await client.lookup.findPart({ name: "Support" }, { timeoutMs: 5_000 });
  const country: StaticCountryLookupResult = await client.lookup.country({ code: "FR" });
  const countryData: LookupStaticCountry = country.data;
  const oss = taxes.revenue.ossElectronicService({
    destinationCountry: country.data,
    rate: 20
  });
  // @ts-expect-error exactly one check-account criterion is required
  await client.lookup.checkAccount({ iban: "DE02", name: "Bank" });
  // @ts-expect-error exactly one check-account criterion is required
  await client.lookup.checkAccount({});
  // @ts-expect-error exactly one part criterion is required
  await client.lookup.part({ partNumber: "SKU-123", name: "Support" });
  // @ts-expect-error exactly one part criterion is required
  await client.lookup.part({});
  // @ts-expect-error contact lookup is intentionally customer-number based
  await client.lookup.contact({ name: "Acme" });
  // @ts-expect-error country lookup accepts an ISO code, never a sevdesk numeric ID
  await client.lookup.country({ id: 33 });
  const notFound = new SevdeskLookupNotFoundError("Contact", {
    customerNumber: "K-10042"
  });
  const ambiguous = new SevdeskLookupAmbiguityError("Part", { partNumber: "SKU-123" }, [partData]);
  const exactMatchCount: number = ambiguous.matchCount;
  const commonLookupError: SevdeskLookupError = notFound;
  void contactData;
  void contactJsonPages;
  void accountData;
  void accountByName;
  void partData;
  void partByName;
  void countryData;
  void oss;
  void notFound;
  void exactMatchCount;
  void commonLookupError;
}

void verifyLookupContracts;
