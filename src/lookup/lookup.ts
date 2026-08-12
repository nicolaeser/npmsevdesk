import type { SevdeskClient } from "../client/sevdesk-client.js";
import type { CuratedRequestOptions } from "../bundles/types.js";
import type { SevdeskContact } from "../domain/models.js";
import { normalizeSevdeskId } from "../types/references.js";
import type { components } from "../types/openapi.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../utils/errors.js";
import { paginate, type PaginationRequest } from "../utils/pagination.js";
import { SevdeskLookupAmbiguityError, SevdeskLookupNotFoundError } from "./errors.js";
import type {
  CheckAccountLookupCriteria,
  CheckAccountLookupResult,
  ContactLookupCriteria,
  ContactLookupResult,
  LookupCheckAccount,
  LookupPageEvidence,
  LookupPart,
  LookupStaticCountry,
  PartLookupCriteria,
  PartLookupResult,
  StaticCountryLookupCriteria,
  StaticCountryLookupJson,
  StaticCountryLookupResult,
  UniqueLookupResult
} from "./types.js";

type CheckAccountWire = components["schemas"]["Model_CheckAccountResponse"];
type PartWire = components["schemas"]["Model_Part"];
type StaticCountryWire = components["schemas"]["Model_StaticCountryResponse"];

const LOOKUP_PAGE_SIZE = 100;

export class LookupModule {
  public constructor(private readonly client: SevdeskClient) {}
  public async contact(
    criteria: ContactLookupCriteria,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactLookupResult> {
    const result = await this.resolveContact(criteria, false, requestOptions);
    return result as ContactLookupResult;
  }
  public async findContact(
    criteria: ContactLookupCriteria,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactLookupResult | undefined> {
    return this.resolveContact(criteria, true, requestOptions);
  }
  public async checkAccount(
    criteria: CheckAccountLookupCriteria,
    requestOptions?: CuratedRequestOptions
  ): Promise<CheckAccountLookupResult> {
    const result = await this.resolveCheckAccount(criteria, false, requestOptions);
    return result as CheckAccountLookupResult;
  }
  public async findCheckAccount(
    criteria: CheckAccountLookupCriteria,
    requestOptions?: CuratedRequestOptions
  ): Promise<CheckAccountLookupResult | undefined> {
    return this.resolveCheckAccount(criteria, true, requestOptions);
  }
  public async part(
    criteria: PartLookupCriteria,
    requestOptions?: CuratedRequestOptions
  ): Promise<PartLookupResult> {
    const result = await this.resolvePart(criteria, false, requestOptions);
    return result as PartLookupResult;
  }
  public async findPart(
    criteria: PartLookupCriteria,
    requestOptions?: CuratedRequestOptions
  ): Promise<PartLookupResult | undefined> {
    return this.resolvePart(criteria, true, requestOptions);
  }
  public async country(
    criteria: StaticCountryLookupCriteria,
    requestOptions?: CuratedRequestOptions
  ): Promise<StaticCountryLookupResult> {
    const result = await this.resolveCountry(criteria, false, requestOptions);
    return result as StaticCountryLookupResult;
  }
  public async findCountry(
    criteria: StaticCountryLookupCriteria,
    requestOptions?: CuratedRequestOptions
  ): Promise<StaticCountryLookupResult | undefined> {
    return this.resolveCountry(criteria, true, requestOptions);
  }
  private resolveContact(
    criteria: ContactLookupCriteria,
    optional: boolean,
    requestOptions?: CuratedRequestOptions
  ): Promise<ContactLookupResult | undefined> {
    const customerNumber = requireLookupString(criteria.customerNumber, "contact customer number");
    const exactCriteria = { customerNumber } satisfies ContactLookupCriteria;
    return resolveUnique({
      resource: "Contact",
      criteria: exactCriteria,
      optional,
      fetchPage: (page) =>
        this.client.contacts.list(
          {
            customerNumber,
            depth: "all",
            ...page
          },
          requestOptions
        ),
      matches: (contact: SevdeskContact) => contact.customerNumber === customerNumber,
      normalize: (contact: SevdeskContact) => contact
    });
  }
  private resolveCheckAccount(
    criteria: CheckAccountLookupCriteria,
    optional: boolean,
    requestOptions?: CuratedRequestOptions
  ): Promise<CheckAccountLookupResult | undefined> {
    const exactCriteria = normalizeCheckAccountCriteria(criteria);
    return resolveUnique({
      resource: "CheckAccount",
      criteria: exactCriteria,
      optional,
      fetchPage: (page) =>
        this.client.raw.checkAccount.getCheckAccounts({
          query: { limit: page.limit, offset: page.offset, countAll: page.countAll },
          ...(requestOptions === undefined ? {} : { options: requestOptions })
        }),
      matches: (account: CheckAccountWire) => checkAccountMatches(account, exactCriteria),
      normalize: normalizeCheckAccount
    });
  }
  private resolvePart(
    criteria: PartLookupCriteria,
    optional: boolean,
    requestOptions?: CuratedRequestOptions
  ): Promise<PartLookupResult | undefined> {
    const exactCriteria = normalizePartCriteria(criteria);
    return resolveUnique({
      resource: "Part",
      criteria: exactCriteria,
      optional,
      fetchPage: (page) =>
        this.client.raw.part.getParts({
          query: {
            ...page,
            ...exactCriteria
          },
          ...(requestOptions === undefined ? {} : { options: requestOptions })
        }),
      matches: (part: PartWire) => partMatches(part, exactCriteria),
      normalize: normalizePart
    });
  }
  private resolveCountry(
    criteria: StaticCountryLookupCriteria,
    optional: boolean,
    requestOptions?: CuratedRequestOptions
  ): Promise<StaticCountryLookupResult | undefined> {
    const code = normalizeCountryCode(criteria.code);
    const exactCriteria = { code } satisfies StaticCountryLookupCriteria;
    return resolveUnique({
      resource: "StaticCountry",
      criteria: exactCriteria,
      optional,
      fetchPage: (page) =>
        this.client.request<StaticCountryLookupJson>({
          method: "GET",
          path: "/StaticCountry",
          query: {
            limit: page.limit,
            offset: page.offset,
            countAll: page.countAll
          },
          retrySafe: true,
          ...(requestOptions === undefined ? {} : { options: requestOptions })
        }),
      matches: (country: StaticCountryWire) =>
        typeof country.code === "string" && normalizeCountryCode(country.code) === code,
      normalize: normalizeStaticCountry
    });
  }
}

interface ResolveUniqueInput<
  TResource extends "Contact" | "CheckAccount" | "Part" | "StaticCountry",
  TCriteria extends object,
  TWire,
  TData,
  TPage extends LookupPageEvidence
> {
  readonly resource: TResource;
  readonly criteria: TCriteria;
  readonly optional: boolean;
  readonly fetchPage: (request: PaginationRequest) => Promise<TPage>;
  readonly matches: (item: TWire) => boolean;
  readonly normalize: (item: TWire) => TData;
}

async function resolveUnique<
  TResource extends "Contact" | "CheckAccount" | "Part" | "StaticCountry",
  TCriteria extends object,
  TWire,
  TData,
  TPage extends LookupPageEvidence
>(
  input: ResolveUniqueInput<TResource, TCriteria, TWire, TData, TPage>
): Promise<UniqueLookupResult<TData, TCriteria, TPage> | undefined> {
  const pages: TPage[] = [];
  const matches: TData[] = [];
  for await (const page of paginate(
    async (request) => {
      const result = await input.fetchPage(request);
      if (!Array.isArray(result.data)) {
        throw new SevdeskResponseValidationError(
          `sevdesk returned a malformed ${input.resource} lookup collection.`,
          { value: result.json }
        );
      }
      return result;
    },
    { limit: LOOKUP_PAGE_SIZE }
  )) {
    pages.push(page);
    for (const item of page.data) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) {
        throw new SevdeskResponseValidationError(
          `sevdesk returned a malformed ${input.resource} lookup item.`,
          { value: item }
        );
      }
      const wireItem = item as TWire;
      if (!input.matches(wireItem)) continue;
      matches.push(input.normalize(wireItem));
    }
  }
  if (matches.length > 1) {
    throw new SevdeskLookupAmbiguityError(input.resource, input.criteria, matches, pages);
  }
  const match = matches[0];
  if (match === undefined) {
    if (input.optional) return undefined;
    throw new SevdeskLookupNotFoundError(input.resource, input.criteria, pages);
  }
  const json = pages.map((page) => page.json);
  return {
    data: match,
    criteria: input.criteria,
    pages,
    json,
    raw: pages.map((page) => page.raw),
    toJSON: () => json
  };
}

function normalizeCheckAccountCriteria(
  criteria: CheckAccountLookupCriteria
): CheckAccountLookupCriteria {
  const values = lookupCriteriaRecord(criteria, "check-account lookup");
  const hasIban = hasDefinedCriterion(values, "iban");
  const hasName = hasDefinedCriterion(values, "name");
  if (hasIban === hasName) {
    throw new SevdeskConfigurationError(
      "check-account lookup requires exactly one of iban or name."
    );
  }
  return hasIban
    ? { iban: normalizeIban(values.iban) }
    : { name: requireLookupString(values.name, "check-account name") };
}

function normalizePartCriteria(criteria: PartLookupCriteria): PartLookupCriteria {
  const values = lookupCriteriaRecord(criteria, "part lookup");
  const hasPartNumber = hasDefinedCriterion(values, "partNumber");
  const hasName = hasDefinedCriterion(values, "name");
  if (hasPartNumber === hasName) {
    throw new SevdeskConfigurationError("part lookup requires exactly one of partNumber or name.");
  }
  return hasPartNumber
    ? { partNumber: requireLookupString(values.partNumber, "part number") }
    : { name: requireLookupString(values.name, "part name") };
}

function checkAccountMatches(
  account: CheckAccountWire,
  criteria: CheckAccountLookupCriteria
): boolean {
  if ("iban" in criteria && criteria.iban !== undefined) {
    return typeof account.iban === "string" && canonicalizeIban(account.iban) === criteria.iban;
  }
  return account.name === criteria.name;
}

function partMatches(part: PartWire, criteria: PartLookupCriteria): boolean {
  return "partNumber" in criteria && criteria.partNumber !== undefined
    ? part.partNumber === criteria.partNumber
    : part.name === criteria.name;
}

function normalizeCheckAccount(account: CheckAccountWire): LookupCheckAccount {
  const rawId: unknown = account.id;
  if (
    (typeof rawId !== "string" && typeof rawId !== "number") ||
    (account.objectName !== undefined && account.objectName !== "CheckAccount")
  ) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned a matched check account without a valid identity.",
      { value: account }
    );
  }
  let id: string;
  try {
    id = String(normalizeSevdeskId(rawId, "check account"));
  } catch (error) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned a matched check account without a valid identity.",
      { value: account },
      error
    );
  }
  return {
    ...account,
    id,
    objectName: "CheckAccount"
  };
}

function normalizePart(part: PartWire): LookupPart {
  if (
    typeof part.id !== "number" ||
    !Number.isSafeInteger(part.id) ||
    part.id <= 0 ||
    (part.objectName !== undefined && part.objectName !== "Part")
  ) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned a matched part without a valid identity.",
      { value: part }
    );
  }
  return {
    ...part,
    id: part.id,
    objectName: "Part"
  };
}

function normalizeStaticCountry(country: StaticCountryWire): LookupStaticCountry {
  if (country.objectName !== "StaticCountry") {
    throw new SevdeskResponseValidationError(
      "sevdesk returned a matched country without a valid identity.",
      { value: country }
    );
  }
  let id: string;
  try {
    id = String(normalizeSevdeskId(country.id, "static country"));
  } catch (error) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned a matched country without a valid identity.",
      { value: country },
      error
    );
  }
  return {
    ...country,
    code: normalizeCountryCode(country.code),
    id,
    objectName: "StaticCountry"
  };
}

function normalizeCountryCode(value: unknown): string {
  const code = requireLookupString(value, "country code").toUpperCase();
  const normalized = code === "EL" ? "GR" : code;
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new SevdeskConfigurationError("country code must be an ISO 3166-1 alpha-2 code.");
  }
  return normalized;
}

function normalizeIban(value: unknown): string {
  const iban = canonicalizeIban(requireLookupString(value, "check-account IBAN"));
  if (iban.length === 0) {
    throw new SevdeskConfigurationError("check-account IBAN must not be empty.");
  }
  return iban;
}

function canonicalizeIban(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function requireLookupString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SevdeskConfigurationError(`${label} must be a non-empty string.`);
  }
  return value;
}

function lookupCriteriaRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskConfigurationError(`${label} criteria must be an object.`);
  }
  return value as Record<string, unknown>;
}

function hasDefinedCriterion(value: Record<string, unknown>, key: string): boolean {
  return Object.hasOwn(value, key) && value[key] !== undefined;
}
