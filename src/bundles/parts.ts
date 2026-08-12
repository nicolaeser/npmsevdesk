import type { SevdeskClient } from "../client/sevdesk-client.js";
import {
  mapCreatedPartResult,
  mapPartListResult,
  mapPartResult,
  mapPartStockResult,
  mapUpdatedPartResult
} from "../domain/result-mappers.js";
import type {
  CreatedPartResult,
  PartListResult,
  PartResult,
  PartStockResult,
  UpdatedPartResult
} from "../domain/results.js";
import { PartStatus, type PartStatusInput } from "../enums/domain-enums.js";
import type { SevdeskIdInput, SevdeskReference } from "../types/references.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import {
  validateFiniteNumber,
  validatePaginationLimit,
  validatePaginationOffset
} from "../utils/validation.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericEnumCode,
  numericId
} from "./internal.js";
import type { ForwardCompatibleBody } from "./internal.js";
import type { PartEmbedInput } from "./embed.js";
import type { CuratedRequestOptions, PageOptions, RequireAtLeastOne } from "./types.js";
import { workflowWriteOptions } from "./workflow.js";

export interface PartListOptions extends PageOptions<PartEmbedInput> {
  readonly partNumber?: string;
  readonly name?: string;
}

export interface PartCreateInput {
  readonly name: string;
  readonly partNumber: string;
  readonly stock: number;
  readonly unity: SevdeskReference<"Unity">;
  readonly taxRate: number;
  readonly text?: string | null;
  readonly category?: SevdeskReference<"Category"> | null;
  readonly stockEnabled?: boolean;
  readonly price?: number | null;
  readonly priceNet?: number | null;
  readonly priceGross?: number | null;
  readonly pricePurchase?: number | null;
  readonly status?: PartStatusInput | null;
  readonly internalComment?: string | null;
}

interface PartUpdateFields {
  readonly name?: string;
  readonly partNumber?: string;
  readonly stock?: number;
  readonly unity?: SevdeskReference<"Unity">;
  readonly taxRate?: number;
  readonly text?: string | null;
  readonly category?: SevdeskReference<"Category"> | null;
  readonly stockEnabled?: boolean | null;
  readonly price?: number | null;
  readonly priceNet?: number | null;
  readonly priceGross?: number | null;
  readonly pricePurchase?: number | null;
  readonly status?: PartStatusInput | null;
  readonly internalComment?: string | null;
}

export type PartUpdateInput = RequireAtLeastOne<PartUpdateFields>;

interface PartCreatePayloadFields {
  readonly name: string;
  readonly partNumber: string;
  readonly stock: number;
  readonly unity: PartReferencePayload<"Unity">;
  readonly taxRate: number;
  readonly text?: string | null;
  readonly category?: PartReferencePayload<"Category"> | null;
  readonly stockEnabled?: boolean;
  readonly price?: number | null;
  readonly priceNet?: number | null;
  readonly priceGross?: number | null;
  readonly pricePurchase?: number | null;
  readonly status?: number | null;
  readonly internalComment?: string | null;
}

export interface PartCreatePayload extends PartCreatePayloadFields {
  readonly objectName: "Part";
}

interface PartUpdatePayloadFields {
  readonly name?: string;
  readonly partNumber?: string;
  readonly stock?: number;
  readonly unity?: PartReferencePayload<"Unity">;
  readonly taxRate?: number;
  readonly text?: string | null;
  readonly category?: PartReferencePayload<"Category"> | null;
  readonly stockEnabled?: boolean | null;
  readonly price?: number | null;
  readonly priceNet?: number | null;
  readonly priceGross?: number | null;
  readonly pricePurchase?: number | null;
  readonly status?: number | null;
  readonly internalComment?: string | null;
}

export type PartUpdatePayload = RequireAtLeastOne<PartUpdatePayloadFields>;

interface PartReferencePayload<TObjectName extends "Category" | "Unity"> {
  readonly id: number;
  readonly objectName: TObjectName;
}

type NoExtraInput<TInput, TShape> = TInput & Record<Exclude<keyof TInput, keyof TShape>, never>;

export class PartsBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async list(
    options: PartListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<PartListResult> {
    assertInputRecord(options, "parts list options");
    const limit =
      options.limit === undefined
        ? undefined
        : validatePaginationLimit(options.limit, "parts list");
    const offset =
      options.offset === undefined
        ? undefined
        : validatePaginationOffset(options.offset, "parts list");
    const partNumber = optionalFilter(options.partNumber, "part number");
    const name = optionalFilter(options.name, "part name");
    const countAll = optionalBoolean(options.countAll, "parts list countAll");
    const embed = optionalEmbed(options.embed);
    const result = await this.client.raw.part.getParts(
      asRequest<"getParts">(
        {
          query: {
            ...(limit === undefined ? {} : { limit }),
            ...(offset === undefined ? {} : { offset }),
            ...(countAll === undefined ? {} : { countAll }),
            ...(partNumber === undefined ? {} : { partNumber }),
            ...(name === undefined ? {} : { name }),
            ...(embed === undefined ? {} : { embed })
          }
        },
        requestOptions
      )
    );
    return mapPartListResult(result);
  }
  public async get(
    partId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<PartResult> {
    const result = await this.client.raw.part.getPartById(
      asRequest<"getPartById">({ path: { partId: numericId(partId, "part") } }, requestOptions)
    );
    return mapPartResult(result);
  }
  public async getStock(
    partId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<PartStockResult> {
    const result = await this.client.raw.part.partGetStock(
      asRequest<"partGetStock">({ path: { partId: numericId(partId, "part") } }, requestOptions)
    );
    return mapPartStockResult(result);
  }
  public async create<const TInput extends PartCreateInput>(
    input: NoExtraInput<TInput, PartCreateInput>,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedPartResult> {
    const result = await this.client.raw.part.createPart(
      forwardCompatibleRequest<"createPart">(
        { body: buildPartCreatePayload(input) },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapCreatedPartResult(result);
  }
  public async update<const TInput extends PartUpdateInput>(
    partId: SevdeskIdInput,
    input: NoExtraInput<TInput, PartUpdateInput>,
    requestOptions?: CuratedRequestOptions
  ): Promise<UpdatedPartResult> {
    const result = await this.client.raw.part.updatePart(
      forwardCompatibleRequest<"updatePart">(
        {
          path: { partId: numericId(partId, "part") },
          body: buildPartUpdatePayload(input)
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapUpdatedPartResult(result);
  }
}

export function buildPartCreatePayload<const TInput extends PartCreateInput>(
  input: NoExtraInput<TInput, PartCreateInput>
): ForwardCompatibleBody<PartCreatePayload> {
  assertInputRecord(input, "part create input");
  assertKnownKeys(input, "part create input");
  return forwardCompatibleBody({
    objectName: "Part",
    name: requiredText(input.name, "part name"),
    partNumber: requiredText(input.partNumber, "part number"),
    stock: finite(input.stock, "part stock"),
    unity: referencePayload(input.unity, "Unity", "part unity"),
    taxRate: finite(input.taxRate, "part tax rate"),
    ...optionalCreatePayload(input)
  });
}

export function buildPartUpdatePayload<const TInput extends PartUpdateInput>(
  input: NoExtraInput<TInput, PartUpdateInput>
): ForwardCompatibleBody<PartUpdatePayload> {
  assertInputRecord(input, "part update input");
  assertKnownKeys(input, "part update input");
  if (Object.keys(input).length === 0) {
    throw new SevdeskConfigurationError("part update input must contain at least one field.");
  }
  const payload = {
    ...(input.name === undefined ? {} : { name: requiredText(input.name, "part name") }),
    ...(input.partNumber === undefined
      ? {}
      : { partNumber: requiredText(input.partNumber, "part number") }),
    ...(input.stock === undefined ? {} : { stock: finite(input.stock, "part stock") }),
    ...(input.unity === undefined
      ? {}
      : { unity: referencePayload(input.unity, "Unity", "part unity") }),
    ...(input.taxRate === undefined ? {} : { taxRate: finite(input.taxRate, "part tax rate") }),
    ...optionalUpdatePayload(input)
  };
  return forwardCompatibleBody(payload as PartUpdatePayload);
}

function optionalCreatePayload(
  input: PartCreateInput
): Omit<PartCreatePayloadFields, "name" | "partNumber" | "stock" | "unity" | "taxRate"> {
  return {
    ...(input.text === undefined ? {} : { text: nullableText(input.text, "part text") }),
    ...(input.category === undefined
      ? {}
      : {
          category:
            input.category === null
              ? null
              : referencePayload(input.category, "Category", "part category")
        }),
    ...(input.stockEnabled === undefined
      ? {}
      : { stockEnabled: requiredBoolean(input.stockEnabled, "part stockEnabled") }),
    ...optionalNumbersAndStatus(input)
  };
}

function optionalUpdatePayload(
  input: PartUpdateFields
): Omit<PartUpdatePayloadFields, "name" | "partNumber" | "stock" | "unity" | "taxRate"> {
  return {
    ...(input.text === undefined ? {} : { text: nullableText(input.text, "part text") }),
    ...(input.category === undefined
      ? {}
      : {
          category:
            input.category === null
              ? null
              : referencePayload(input.category, "Category", "part category")
        }),
    ...(input.stockEnabled === undefined
      ? {}
      : { stockEnabled: nullableBoolean(input.stockEnabled, "part stockEnabled") }),
    ...optionalNumbersAndStatus(input)
  };
}

function optionalNumbersAndStatus(
  input: PartUpdateFields
): Pick<
  PartUpdatePayloadFields,
  "price" | "priceNet" | "priceGross" | "pricePurchase" | "status" | "internalComment"
> {
  return {
    ...(input.price === undefined ? {} : { price: nullableFinite(input.price, "part price") }),
    ...(input.priceNet === undefined
      ? {}
      : { priceNet: nullableFinite(input.priceNet, "part net price") }),
    ...(input.priceGross === undefined
      ? {}
      : { priceGross: nullableFinite(input.priceGross, "part gross price") }),
    ...(input.pricePurchase === undefined
      ? {}
      : { pricePurchase: nullableFinite(input.pricePurchase, "part purchase price") }),
    ...(input.status === undefined
      ? {}
      : {
          status:
            input.status === null ? null : numericEnumCode(PartStatus, input.status, "part status")
        }),
    ...(input.internalComment === undefined
      ? {}
      : {
          internalComment: nullableText(input.internalComment, "part internal comment")
        })
  };
}

function optionalFilter(value: string | undefined, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SevdeskConfigurationError(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function optionalBoolean(value: unknown, label: string): boolean | undefined {
  if (value === undefined) return undefined;
  return requiredBoolean(value, label);
}

function optionalEmbed(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new SevdeskConfigurationError("parts list embed must be an array.");
  }
  if (value.length === 0) return undefined;
  return value.map((embed, index) => requiredText(embed, `parts list embed[${index}]`));
}

const partInputKeys = new Set<keyof PartCreateInput>([
  "name",
  "partNumber",
  "stock",
  "unity",
  "taxRate",
  "text",
  "category",
  "stockEnabled",
  "price",
  "priceNet",
  "priceGross",
  "pricePurchase",
  "status",
  "internalComment"
]);

function assertInputRecord(value: unknown, label: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SevdeskConfigurationError(`${label} must be an object.`);
  }
}

function assertKnownKeys(value: object, label: string): void {
  const unknown = Object.keys(value).filter(
    (key) => !partInputKeys.has(key as keyof PartCreateInput)
  );
  if (unknown.length > 0) {
    throw new SevdeskConfigurationError(
      `${label} contains unsupported field${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}.`
    );
  }
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SevdeskConfigurationError(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function nullableText(value: unknown, label: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new SevdeskConfigurationError(`${label} must be a string or null.`);
  }
  return value;
}

function nullableBoolean(value: unknown, label: string): boolean | null {
  if (value === null || typeof value === "boolean") return value;
  throw new SevdeskConfigurationError(`${label} must be a boolean or null.`);
}

function requiredBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new SevdeskConfigurationError(`${label} must be a boolean.`);
  }
  return value;
}

function finite(value: unknown, label: string): number {
  return validateFiniteNumber(value, label);
}

function nullableFinite(value: unknown, label: string): number | null {
  return value === null ? null : finite(value, label);
}

function referencePayload<TObjectName extends "Category" | "Unity">(
  value: unknown,
  expectedObjectName: TObjectName,
  label: string
): PartReferencePayload<TObjectName> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !("id" in value) ||
    !("objectName" in value) ||
    value.objectName !== expectedObjectName
  ) {
    throw new SevdeskConfigurationError(
      `${label} must be a ${expectedObjectName} reference created with refs.${expectedObjectName === "Unity" ? "unity" : "category"}().`
    );
  }
  return {
    id: numericId(value.id as SevdeskIdInput, label),
    objectName: expectedObjectName
  };
}
