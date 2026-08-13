import { buildDeliveryPayload, buildInvoicePayload } from "../src/bundles/builders.js";
import type { InvoiceTypeInput } from "../src/enums/domain-enums.js";
import {
  rawEmbed,
  type ContactEmbedInput,
  type InvoiceEmbedInput,
  type InvoicePositionEmbedInput
} from "../src/bundles/embed.js";
import type {
  ContactCreatePayload,
  ContactFactoryPayload,
  InvoiceFactoryPayload,
  MarkSentDeliveryPayload
} from "../src/bundles/payload-types.js";
import type { ContactListOptions } from "../src/bundles/types.js";
import type { InvoiceListResult } from "../src/domain/results.js";
import { taxes } from "../src/taxes/presets.js";
import { refs } from "../src/types/references.js";
import type { SafeSevdeskReference, SevdeskId, SevdeskReference } from "../src/types/references.js";
import type { PaginationMetadata } from "../src/types/result.js";

const safeContact: SafeSevdeskReference<"Contact"> = refs.contact("42");
const safeId: SevdeskId = safeContact.id;
void safeId;

const compatibleReference: SevdeskReference<"Contact"> = {
  id: "42",
  objectName: "Contact"
};
void compatibleReference;

// @ts-expect-error arbitrary numbers have not passed the SevdeskId constructor
const unsafeId: SevdeskId = 42;
void unsafeId;

// @ts-expect-error non-numeric strings are rejected before runtime
refs.contact("abc");

const contactEmbed: ContactEmbedInput = "parent.category";
const futureContactEmbed: ContactEmbedInput = rawEmbed("future.contactRelation");
const invoiceEmbed: InvoiceEmbedInput = "contact.parent";
const positionEmbed: InvoicePositionEmbedInput = "unity";
void contactEmbed;
void futureContactEmbed;
void invoiceEmbed;
void positionEmbed;

// @ts-expect-error unknown paths require rawEmbed() so they are reviewable
const accidentalEmbed: ContactEmbedInput = "future.contactRelation";
void accidentalEmbed;

const typedListEmbed: ContactListOptions = { embed: ["parent.category"] };
const escapedListEmbed: ContactListOptions = {
  embed: [rawEmbed("future.contactRelation")]
};
void typedListEmbed;
void escapedListEmbed;

// @ts-expect-error list options also require the explicit raw escape
const accidentalListEmbed: ContactListOptions = { embed: ["future.contactRelation"] };
void accidentalListEmbed;

declare const contactPayload: ContactCreatePayload;
const contactFactoryPayload: ContactFactoryPayload = contactPayload;
void contactFactoryPayload;

const factoryPayload: InvoiceFactoryPayload = buildInvoicePayload({
  invoice: {
    invoiceDate: "2026-07-30",
    contact: refs.contact(1),
    contactPerson: refs.sevUser(2),
    currency: "EUR",
    tax: taxes.manual.sales({ bookkeepingSystem: "2.0", taxRule: "standard_taxable" })
  },
  positions: [{ quantity: 1, price: 10, taxRate: 19, unity: refs.unity(1) }]
});
void factoryPayload;

const markedSent: MarkSentDeliveryPayload<"VM"> = buildDeliveryPayload({
  channel: "mark-sent",
  sendType: "email"
});
void markedSent;

declare const listResult: InvoiceListResult;
const mandatoryPagination: PaginationMetadata = listResult.pagination;

const tenantInvoiceNumber: string = "INV-2024-0001";
const tenantCustomerNumber: string = "CUST-42";
void tenantInvoiceNumber;
void tenantCustomerNumber;

// @ts-expect-error tenant number prefixes are not invoiceType document classes
const invoiceTypeFromPrefix: InvoiceTypeInput = "INV";
void invoiceTypeFromPrefix;
const mandatoryOffset: number = listResult.pagination.offset;
void mandatoryPagination;
void mandatoryOffset;
