import type { operations } from "../types/openapi.js";
import { SevdeskConfigurationError } from "../utils/errors.js";

declare const rawEmbedBrand: unique symbol;

export type RawEmbed = string & {
  readonly [rawEmbedBrand]: "RawEmbed";
};

export type EmbedInput<TKnown extends string> = TKnown | RawEmbed;

type ParametersOf<TOperation> = TOperation extends {
  parameters: infer TParameters;
}
  ? TParameters
  : never;

type QueryOf<TOperation> =
  ParametersOf<TOperation> extends {
    query?: infer TQuery;
  }
    ? NonNullable<TQuery>
    : never;

type ArrayItem<TValue> = NonNullable<TValue> extends readonly (infer TItem)[] ? TItem : never;

export type InvoiceEmbed = Extract<ArrayItem<QueryOf<operations["getInvoices"]>["embed"]>, string>;

export type ContactEmbed = "category" | "mainAddress" | "parent" | "parent.category" | "taxSet";

export type OrderEmbed =
  | "addressCountry"
  | "contact"
  | "contact.parent"
  | "contactPerson"
  | "origin"
  | "tags"
  | "taxRule"
  | "taxSet"
  | "total";

export type VoucherEmbed =
  "costCentre" | "document" | "origin" | "supplier" | "tags" | "taxRule" | "taxSet";

export type CreditNoteEmbed =
  | "addressCountry"
  | "contact"
  | "contact.parent"
  | "contactPerson"
  | "origin"
  | "paymentMethod"
  | "tags"
  | "taxRule"
  | "taxSet"
  | "total";

export type PartEmbed = "category" | "sevClient" | "unity";

export type InvoicePositionEmbed = "invoice" | "part" | "sevClient" | "unity";

export type ContactEmbedInput = EmbedInput<ContactEmbed>;
export type InvoiceEmbedInput = EmbedInput<InvoiceEmbed>;
export type InvoicePositionEmbedInput = EmbedInput<InvoicePositionEmbed>;
export type OrderEmbedInput = EmbedInput<OrderEmbed>;
export type VoucherEmbedInput = EmbedInput<VoucherEmbed>;
export type CreditNoteEmbedInput = EmbedInput<CreditNoteEmbed>;
export type PartEmbedInput = EmbedInput<PartEmbed>;

export function rawEmbed(value: string): RawEmbed {
  if (value.trim().length === 0) {
    throw new SevdeskConfigurationError("A raw embed path must not be empty.");
  }
  return value as RawEmbed;
}
