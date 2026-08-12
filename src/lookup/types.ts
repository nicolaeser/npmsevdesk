import type { ContactListResult } from "../domain/results.js";
import type { SevdeskContact } from "../domain/models.js";
import type { components, operations } from "../types/openapi.js";
import type { ResultFor } from "../types/operation.js";
import type { SevdeskResult } from "../types/result.js";

export interface ContactLookupCriteria {
  readonly customerNumber: string;
}

export type CheckAccountLookupCriteria =
  | {
      readonly iban: string;
      readonly name?: never;
    }
  | {
      readonly name: string;
      readonly iban?: never;
    };

export type PartLookupCriteria =
  | {
      readonly partNumber: string;
      readonly name?: never;
    }
  | {
      readonly name: string;
      readonly partNumber?: never;
    };

export interface StaticCountryLookupCriteria {
  readonly code: string;
}

type CheckAccountWire = components["schemas"]["Model_CheckAccountResponse"];
type PartWire = components["schemas"]["Model_Part"];
type StaticCountryWire = components["schemas"]["Model_StaticCountryResponse"];

export type LookupCheckAccount = Readonly<
  Omit<CheckAccountWire, "id" | "objectName"> & {
    readonly id: string;
    readonly objectName: "CheckAccount";
  }
>;

export type LookupPart = Readonly<
  Omit<PartWire, "id" | "objectName"> & {
    readonly id: number;
    readonly objectName: "Part";
  }
>;

export type LookupStaticCountry = Readonly<
  Omit<StaticCountryWire, "code" | "id" | "objectName"> & {
    readonly code: string;
    readonly id: string;
    readonly objectName: "StaticCountry";
  }
>;

export interface LookupPageEvidence {
  readonly data: readonly unknown[];
  readonly json: unknown;
  readonly raw: unknown;
}

export interface UniqueLookupResult<
  TData,
  TCriteria extends object,
  TPage extends LookupPageEvidence
> {
  readonly data: TData;
  readonly criteria: Readonly<TCriteria>;
  readonly pages: readonly TPage[];
  readonly json: readonly TPage["json"][];
  readonly raw: readonly TPage["raw"][];
  toJSON(): readonly TPage["json"][];
}

export type ContactLookupResult = UniqueLookupResult<
  SevdeskContact,
  ContactLookupCriteria,
  ContactListResult
>;

export type CheckAccountLookupPage = ResultFor<operations["getCheckAccounts"]>;
export type CheckAccountLookupResult = UniqueLookupResult<
  LookupCheckAccount,
  CheckAccountLookupCriteria,
  CheckAccountLookupPage
>;

export type PartLookupPage = ResultFor<operations["getParts"]>;
export type PartLookupResult = UniqueLookupResult<LookupPart, PartLookupCriteria, PartLookupPage>;

export interface StaticCountryLookupJson {
  readonly objects: readonly StaticCountryWire[];
  readonly total?: number | string;
}

export type StaticCountryLookupPage = SevdeskResult<
  StaticCountryLookupJson,
  readonly StaticCountryWire[],
  unknown
>;
export type StaticCountryLookupResult = UniqueLookupResult<
  LookupStaticCountry,
  StaticCountryLookupCriteria,
  StaticCountryLookupPage
>;
