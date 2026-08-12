import type { SevdeskDiagnosticOptions } from "../utils/errors.js";
import { SevdeskError } from "../utils/errors.js";
import { redact } from "../utils/redact.js";
import type { LookupPageEvidence } from "./types.js";

export type SevdeskLookupResource = "Contact" | "CheckAccount" | "Part" | "StaticCountry";

export abstract class SevdeskLookupError<
  TCriteria extends object = Readonly<Record<string, string>>,
  TPage extends LookupPageEvidence = LookupPageEvidence
> extends SevdeskError {
  public readonly resource: SevdeskLookupResource;
  public readonly criteria: Readonly<TCriteria>;
  public readonly pages: readonly TPage[];
  public readonly json: readonly TPage["json"][];
  public readonly raw: readonly TPage["raw"][];
  protected constructor(
    message: string,
    resource: SevdeskLookupResource,
    criteria: TCriteria,
    pages: readonly TPage[]
  ) {
    super(message);
    this.resource = resource;
    this.criteria = criteria;
    this.pages = pages;
    this.json = pages.map((page) => page.json);
    this.raw = pages.map((page) => page.raw);
  }
  public toJSON(): Record<string, unknown> {
    return this.toDiagnostic();
  }
  public toDiagnostic(options: SevdeskDiagnosticOptions = {}): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      resource: this.resource,
      pageCount: this.pages.length,
      ...(options.includeData === true
        ? {
            criteria: redact(this.criteria),
            json: redact(this.json)
          }
        : {})
    };
  }
}

export class SevdeskLookupNotFoundError<
  TCriteria extends object = Readonly<Record<string, string>>,
  TPage extends LookupPageEvidence = LookupPageEvidence
> extends SevdeskLookupError<TCriteria, TPage> {
  public constructor(
    resource: SevdeskLookupResource,
    criteria: TCriteria,
    pages: readonly TPage[] = []
  ) {
    super(`No ${resource} matched the exact lookup criterion.`, resource, criteria, pages);
  }
}

export class SevdeskLookupAmbiguityError<
  TCriteria extends object = Readonly<Record<string, string>>,
  TMatch = unknown,
  TPage extends LookupPageEvidence = LookupPageEvidence
> extends SevdeskLookupError<TCriteria, TPage> {
  public readonly matches: readonly TMatch[];
  public readonly matchCount: number;
  public constructor(
    resource: SevdeskLookupResource,
    criteria: TCriteria,
    matches: readonly TMatch[],
    pages: readonly TPage[] = []
  ) {
    super(
      `Multiple ${resource} objects matched the exact lookup criterion.`,
      resource,
      criteria,
      pages
    );
    this.matches = matches;
    this.matchCount = matches.length;
  }
  public override toDiagnostic(options: SevdeskDiagnosticOptions = {}): Record<string, unknown> {
    return {
      ...super.toDiagnostic(options),
      matchCount: this.matchCount,
      ...(options.includeData === true ? { matches: redact(this.matches) } : {})
    };
  }
}
