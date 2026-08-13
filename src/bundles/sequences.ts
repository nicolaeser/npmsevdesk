import type { SevdeskClient } from "../client/sevdesk-client.js";
import { InvoiceType, OrderType } from "../enums/domain-enums.js";
import type { InvoiceTypeInput, OrderTypeInput } from "../enums/domain-enums.js";
import type { SevdeskResult } from "../types/result.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../utils/errors.js";
import { toUnixTimestamp, type SevdeskTimestamp } from "../utils/date.js";
import { mapResultData } from "../utils/result.js";
import { enumCode } from "./internal.js";
import type { CuratedRequestOptions } from "./types.js";

export const SequenceObjectType = {
  INVOICE: "Invoice",
  CREDIT_NOTE: "CreditNote",
  ORDER: "Order",
  CONTACT: "Contact",
  PART: "Part"
} as const;

export type SequenceObjectType = (typeof SequenceObjectType)[keyof typeof SequenceObjectType];

export type SequenceObjectTypeInput =
  | SequenceObjectType
  | "invoice"
  | "creditNote"
  | "credit_note"
  | "order"
  | "contact"
  | "part";

export const SequenceCreditNoteType = {
  NORMAL: "GS"
} as const;

export type SequenceCreditNoteType =
  (typeof SequenceCreditNoteType)[keyof typeof SequenceCreditNoteType];

export type SequenceTypeInput = InvoiceTypeInput | OrderTypeInput | SequenceCreditNoteType | "gs";

export interface SequenceNextInput {
  readonly objectType: SequenceObjectTypeInput;
  readonly type?: SequenceTypeInput;
  readonly at?: SevdeskTimestamp;
}

export interface SevdeskSequence {
  readonly id: string;
  readonly objectName: "SevSequence";
  readonly forObject: string;
  readonly format: string;
  readonly nextSequence: string;
  readonly type: string;
  readonly additionalInformation?: string | null;
  readonly create?: string;
  readonly update?: string;
  readonly sevClient?: {
    readonly id: string;
    readonly objectName: "SevClient";
  };
}

export interface SequenceNextData {
  readonly formatted: string;
  readonly format: string;
  readonly nextSequence: string;
  readonly objectType: string;
  readonly type: string;
  readonly sequence: SevdeskSequence;
}

export interface SequenceByTypeJson {
  readonly objects?: unknown;
}

export type SequenceNextResult = SevdeskResult<SequenceByTypeJson, SequenceNextData>;

const SEQUENCE_PATH = "/SevSequence/Factory/getByType";

const OBJECT_TYPE_BY_KEY: Readonly<Record<string, SequenceObjectType>> = {
  invoice: SequenceObjectType.INVOICE,
  creditnote: SequenceObjectType.CREDIT_NOTE,
  credit_note: SequenceObjectType.CREDIT_NOTE,
  order: SequenceObjectType.ORDER,
  contact: SequenceObjectType.CONTACT,
  part: SequenceObjectType.PART,
  [SequenceObjectType.INVOICE.toLowerCase()]: SequenceObjectType.INVOICE,
  [SequenceObjectType.CREDIT_NOTE.toLowerCase()]: SequenceObjectType.CREDIT_NOTE,
  [SequenceObjectType.ORDER.toLowerCase()]: SequenceObjectType.ORDER,
  [SequenceObjectType.CONTACT.toLowerCase()]: SequenceObjectType.CONTACT,
  [SequenceObjectType.PART.toLowerCase()]: SequenceObjectType.PART
};

const TENANT_PREFIXES = ["INV", "CN", "OC", "QUO", "DN", "BP", "AST", "SKU"] as const;

const DOCUMENT_OBJECT_TYPES = new Set<SequenceObjectType>([
  SequenceObjectType.INVOICE,
  SequenceObjectType.ORDER,
  SequenceObjectType.CREDIT_NOTE
]);

export function formatSequenceNumber(
  format: string,
  nextSequence: string | number,
  at: Date = new Date()
): string {
  if (typeof format !== "string" || format.trim() === "") {
    throw new SevdeskConfigurationError("Sequence format must be a non-empty string.");
  }
  const year = String(at.getFullYear());
  const month = String(at.getMonth() + 1).padStart(2, "0");
  return format
    .replaceAll("%YYYY", year)
    .replaceAll("%MM", month)
    .replaceAll("%NUMBER", String(nextSequence));
}

export class SequencesBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async next(
    input: SequenceNextInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<SequenceNextResult> {
    const { objectType, type } = resolveSequenceQuery(input);
    const at =
      input.at === undefined ? new Date() : new Date(toUnixTimestamp(input.at) * 1_000);
    const result = await this.client.request<SequenceByTypeJson>({
      method: "GET",
      path: SEQUENCE_PATH,
      query: type === undefined ? { objectType } : { objectType, type },
      retrySafe: false,
      ...(requestOptions === undefined ? {} : { options: requestOptions })
    });
    const sequence = normalizeSequence(result.data, objectType, type);
    const formatted = formatSequenceNumber(sequence.format, sequence.nextSequence, at);
    return mapResultData(result, {
      formatted,
      format: sequence.format,
      nextSequence: sequence.nextSequence,
      objectType: sequence.forObject,
      type: sequence.type,
      sequence
    });
  }
}

export function resolveSequenceQuery(input: SequenceNextInput): {
  readonly objectType: SequenceObjectType;
  readonly type?: string;
} {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new SevdeskConfigurationError("sequences.next input must be an object.");
  }
  const objectType = resolveObjectType(input.objectType);
  if (input.type !== undefined && input.type !== null) {
    rejectTenantPrefix(input.type, objectType);
  }
  if (DOCUMENT_OBJECT_TYPES.has(objectType)) {
    if (input.type === undefined || input.type === null) {
      throw new SevdeskConfigurationError(
        `sequences.next({ objectType: "${objectType}" }) requires an official type code such as RE, AB, AN, LI, GS, or WKR.`
      );
    }
    const type = resolveDocumentType(objectType, input.type);
    rejectTenantPrefix(type, objectType);
    rejectUnofficialType(type, objectType);
    return { objectType, type };
  }
  if (input.type !== undefined && input.type !== null) {
    throw new SevdeskConfigurationError(
      `sequences.next({ objectType: "${objectType}" }) does not take a document type.`
    );
  }
  return { objectType };
}

function resolveObjectType(value: SequenceObjectTypeInput): SequenceObjectType {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SevdeskConfigurationError("Sequence objectType must be a non-empty string.");
  }
  rejectTenantPrefix(value, "sequence objectType");
  const resolved = OBJECT_TYPE_BY_KEY[value.trim().toLowerCase()];
  if (resolved === undefined) {
    throw new SevdeskConfigurationError(
      `Unknown sequence objectType "${value}". Use Invoice, CreditNote, Order, Contact, or Part.`
    );
  }
  return resolved;
}

const OFFICIAL_SEQUENCE_TYPES: Readonly<Record<SequenceObjectType, readonly string[]>> = {
  Invoice: Object.values(InvoiceType),
  Order: Object.values(OrderType),
  CreditNote: [SequenceCreditNoteType.NORMAL],
  Contact: [],
  Part: []
};

function resolveDocumentType(objectType: SequenceObjectType, type: SequenceTypeInput): string {
  if (objectType === SequenceObjectType.INVOICE) {
    return String(enumCode(InvoiceType, type as InvoiceTypeInput, "invoice type"));
  }
  if (objectType === SequenceObjectType.ORDER) {
    return String(enumCode(OrderType, type as OrderTypeInput, "order type"));
  }
  if (unwrapSequenceType(type).toUpperCase() === SequenceCreditNoteType.NORMAL) {
    return SequenceCreditNoteType.NORMAL;
  }
  throw new SevdeskConfigurationError(
    `Unknown credit-note type "${formatSequenceType(type)}". Official credit-note class is GS.`
  );
}

function unwrapSequenceType(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (
    value !== null &&
    typeof value === "object" &&
    "value" in value &&
    (typeof value.value === "string" || typeof value.value === "number")
  ) {
    return String(value.value).trim();
  }
  return "";
}

function formatSequenceType(value: unknown): string {
  const unwrapped = unwrapSequenceType(value);
  return unwrapped === "" ? String(value) : unwrapped;
}

function rejectTenantPrefix(value: unknown, label: string): void {
  const normalized = unwrapSequenceType(value).replace(/\.$/u, "").toUpperCase();
  if (normalized !== "" && (TENANT_PREFIXES as readonly string[]).includes(normalized)) {
    throw new SevdeskConfigurationError(
      `"${formatSequenceType(value)}" is a tenant number prefix, not an official ${label}. Official document classes are RE, WKR, SR, MA, TR, AR, ER, AN, AB, LI, and GS.`
    );
  }
}

function rejectUnofficialType(type: string, objectType: SequenceObjectType): void {
  const official = OFFICIAL_SEQUENCE_TYPES[objectType];
  if (official.length === 0) return;
  if (!official.includes(type)) {
    throw new SevdeskConfigurationError(
      `"${type}" is not an official ${objectType} class. Official document classes are RE, WKR, SR, MA, TR, AR, ER, AN, AB, LI, and GS.`
    );
  }
}

function normalizeSequence(
  data: unknown,
  requestedObjectType: SequenceObjectType,
  requestedType: string | undefined
): SevdeskSequence {
  const record = unwrapSequence(data);
  const id = record.id;
  if (
    (typeof id !== "string" && typeof id !== "number") ||
    String(id).trim() === ""
  ) {
    throw new SevdeskResponseValidationError("sevdesk returned a sequence without an id.", {
      value: record
    });
  }
  if (record.objectName !== undefined && record.objectName !== "SevSequence") {
    throw new SevdeskResponseValidationError(
      'sevdesk returned a sequence with an unexpected objectName.',
      { value: record }
    );
  }
  const format = requiredText(record.format, "sequence format", record);
  const nextSequence = requiredSequenceNumber(record.nextSequence, record);
  const forObject =
    typeof record.forObject === "string" && record.forObject.trim() !== ""
      ? record.forObject
      : requestedObjectType;
  const type =
    typeof record.type === "string" && record.type.trim() !== ""
      ? record.type
      : (requestedType ?? "");
  return {
    id: String(id),
    objectName: "SevSequence",
    forObject,
    format,
    nextSequence,
    type,
    ...(record.additionalInformation === undefined
      ? {}
      : { additionalInformation: record.additionalInformation as string | null }),
    ...(typeof record.create === "string" ? { create: record.create } : {}),
    ...(typeof record.update === "string" ? { update: record.update } : {}),
    ...(isSevClient(record.sevClient)
      ? {
          sevClient: {
            id: String(record.sevClient.id),
            objectName: "SevClient" as const
          }
        }
      : {})
  };
}

function unwrapSequence(data: unknown): Record<string, unknown> {
  const value = Array.isArray(data) ? data[0] : data;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskResponseValidationError(
      "sevdesk returned no SevSequence object for getByType.",
      { value: data }
    );
  }
  return value as Record<string, unknown>;
}

function requiredText(
  value: unknown,
  label: string,
  record: Record<string, unknown>
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SevdeskResponseValidationError(`sevdesk returned a sequence without a ${label}.`, {
      value: record
    });
  }
  return value;
}

function requiredSequenceNumber(value: unknown, record: Record<string, unknown>): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  throw new SevdeskResponseValidationError(
    "sevdesk returned a sequence without nextSequence.",
    { value: record }
  );
}

function isSevClient(
  value: unknown
): value is { readonly id: string | number; readonly objectName: "SevClient" } {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    (typeof value.id === "string" || typeof value.id === "number") &&
    "objectName" in value &&
    value.objectName === "SevClient"
  );
}