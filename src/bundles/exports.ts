import type { SevdeskClient } from "../client/sevdesk-client.js";
import { InvoiceType, type InvoiceTypeInput } from "../enums/domain-enums.js";
import type { FileEnvelope, SevdeskResult } from "../types/result.js";
import type { SevdeskIdInput, SevdeskReference } from "../types/references.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { normalizeFileEnvelope } from "../utils/files.js";
import { mapResultData } from "../utils/result.js";
import { toUnixTimestamp, type SevdeskTimestamp } from "../utils/date.js";
import {
  asRequest,
  enumCode,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericId,
  wireReference
} from "./internal.js";
import type { CuratedRequestOptions } from "./types.js";
import { workflowWriteOptions } from "./workflow.js";

const TENANT_PREFIXES = ["INV", "CN", "OC", "QUO", "DN", "BP", "AST", "SKU"] as const;

export type ExportInvoiceType = "Re" | "SR" | "TR" | "AR" | "ER" | "WKR" | "MA";

export interface ExportRangeFilter {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly contact?: SevdeskReference<"Contact">;
  readonly startAmount?: number;
  readonly endAmount?: number;
}

export interface InvoiceExportInput {
  readonly download?: boolean;
  readonly limit?: number;
  readonly filter?: ExportRangeFilter & {
    readonly invoiceTypes?: readonly (InvoiceTypeInput | ExportInvoiceType)[];
  };
}

export interface CreditNoteExportInput {
  readonly download?: boolean;
  readonly limit?: number;
  readonly filter?: ExportRangeFilter;
}

export interface VoucherExportInput {
  readonly download?: boolean;
  readonly limit?: number;
  readonly filter?: ExportRangeFilter & {
    readonly startPayDate?: string;
    readonly endPayDate?: string;
  };
}

export interface TransactionExportInput {
  readonly download?: boolean;
  readonly limit?: number;
  readonly filter?: {
    readonly paymtPurpose?: string;
    readonly name?: string;
    readonly startDate?: string;
    readonly endDate?: string;
    readonly startAmount?: number;
    readonly endAmount?: number;
    readonly checkAccount?: SevdeskReference<"CheckAccount">;
  };
}

export interface ContactExportInput {
  readonly download?: boolean;
  readonly limit?: number;
  readonly filter?: {
    readonly zip?: number;
    readonly city?: string;
    readonly country?: SevdeskReference<"StaticCountry">;
    readonly depth?: boolean;
    readonly onlyPeople?: boolean;
  };
}

export interface DatevExportInput {
  readonly startDate: SevdeskTimestamp;
  readonly endDate: SevdeskTimestamp;
  readonly scope: string;
  readonly exportByPaydate?: boolean;
  readonly includeEnshrined?: boolean;
  readonly enshrineDocuments?: boolean;
  readonly includeDocumentImages?: boolean;
  readonly includeExportedDocuments?: boolean;
  readonly includeDocumentXml?: boolean;
}

export interface ExportConfigInput {
  readonly accountantNumber: number;
  readonly accountantClientNumber: number;
  readonly accountingYearBegin: number;
}

export class ExportsBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public invoices(input: InvoiceExportInput = {}, requestOptions?: CuratedRequestOptions) {
    return this.mapFile(
      this.client.raw.export.exportInvoice(
        asRequest<"exportInvoice">({ query: invoiceQuery(input) }, requestOptions)
      )
    );
  }
  public invoiceZip(input: InvoiceExportInput = {}, requestOptions?: CuratedRequestOptions) {
    return this.mapFile(
      this.client.raw.export.exportInvoiceZip(
        asRequest<"exportInvoiceZip">({ query: invoiceQuery(input) }, requestOptions)
      )
    );
  }
  public creditNotes(input: CreditNoteExportInput = {}, requestOptions?: CuratedRequestOptions) {
    return this.mapFile(
      this.client.raw.export.exportCreditNote(
        asRequest<"exportCreditNote">(
          {
            query: {
              ...(input.download === undefined ? {} : { download: input.download }),
              sevQuery: {
                modelName: "CreditNote",
                objectName: "SevQuery",
                ...(input.limit === undefined ? {} : { limit: input.limit }),
                ...(input.filter === undefined ? {} : { filter: rangeFilter(input.filter) })
              }
            }
          },
          requestOptions
        )
      )
    );
  }
  public vouchers(input: VoucherExportInput = {}, requestOptions?: CuratedRequestOptions) {
    return this.mapFile(
      this.client.raw.export.exportVoucher(
        asRequest<"exportVoucher">({ query: voucherQuery(input) }, requestOptions)
      )
    );
  }
  public voucherZip(input: VoucherExportInput = {}, requestOptions?: CuratedRequestOptions) {
    return this.mapFile(
      this.client.raw.export.exportVoucherZip(
        asRequest<"exportVoucherZip">({ query: voucherQuery(input) }, requestOptions)
      )
    );
  }
  public contacts(input: ContactExportInput = {}, requestOptions?: CuratedRequestOptions) {
    return this.mapFile(
      this.client.raw.export.exportContact(
        asRequest<"exportContact">(
          {
            query: {
              ...(input.download === undefined ? {} : { download: input.download }),
              sevQuery: {
                modelName: "Contact",
                objectName: "SevQuery",
                ...(input.limit === undefined ? {} : { limit: input.limit }),
                ...(input.filter === undefined ? {} : { filter: contactFilter(input.filter) })
              }
            }
          },
          requestOptions
        )
      )
    );
  }
  public transactions(input: TransactionExportInput = {}, requestOptions?: CuratedRequestOptions) {
    const filter = input.filter;
    return this.mapFile(
      this.client.raw.export.exportTransactions(
        asRequest<"exportTransactions">(
          {
            query: {
              ...(input.download === undefined ? {} : { download: input.download }),
              sevQuery: {
                modelName: "CheckAccountTransaction",
                objectName: "SevQuery",
                ...(input.limit === undefined ? {} : { limit: input.limit }),
                ...(filter === undefined
                  ? {}
                  : {
                      filter: {
                        ...(filter.paymtPurpose === undefined
                          ? {}
                          : { paymtPurpose: filter.paymtPurpose }),
                        ...(filter.name === undefined ? {} : { name: filter.name }),
                        ...(filter.startDate === undefined ? {} : { startDate: filter.startDate }),
                        ...(filter.endDate === undefined ? {} : { endDate: filter.endDate }),
                        ...(filter.startAmount === undefined
                          ? {}
                          : { startAmount: filter.startAmount }),
                        ...(filter.endAmount === undefined ? {} : { endAmount: filter.endAmount }),
                        ...(filter.checkAccount === undefined
                          ? {}
                          : { checkAccount: wireReference(filter.checkAccount) })
                      }
                    })
              }
            }
          },
          requestOptions
        )
      )
    );
  }
  public async datevCsv(input: DatevExportInput, requestOptions?: CuratedRequestOptions) {
    return this.client.raw.export.exportDatevCSV(
      asRequest<"exportDatevCSV">(
        {
          query: {
            startDate: toUnixTimestamp(input.startDate),
            endDate: toUnixTimestamp(input.endDate),
            scope: requiredScope(input.scope),
            ...(input.exportByPaydate === undefined ? {} : { exportByPaydate: input.exportByPaydate }),
            ...(input.includeEnshrined === undefined
              ? {}
              : { includeEnshrined: input.includeEnshrined }),
            ...(input.enshrineDocuments === undefined
              ? {}
              : { enshrineDocuments: input.enshrineDocuments }),
            ...(input.includeDocumentImages === undefined
              ? {}
              : { includeDocumentImages: input.includeDocumentImages })
          }
        },
        workflowWriteOptions(requestOptions)
      )
    );
  }
  public async datevXml(input: DatevExportInput, requestOptions?: CuratedRequestOptions) {
    return this.client.raw.export.exportDatevXML(
      asRequest<"exportDatevXML">(
        {
          query: {
            startDate: toUnixTimestamp(input.startDate),
            endDate: toUnixTimestamp(input.endDate),
            scope: requiredScope(input.scope),
            ...(input.exportByPaydate === undefined ? {} : { exportByPaydate: input.exportByPaydate }),
            ...(input.includeEnshrined === undefined
              ? {}
              : { includeEnshrined: input.includeEnshrined }),
            ...(input.includeExportedDocuments === undefined
              ? {}
              : { includeExportedDocuments: input.includeExportedDocuments }),
            ...(input.includeDocumentXml === undefined
              ? {}
              : { includeDocumentXml: input.includeDocumentXml })
          }
        },
        workflowWriteOptions(requestOptions)
      )
    );
  }
  public downloadHash(jobId: string, requestOptions?: CuratedRequestOptions) {
    return this.client.raw.export.generateDownloadHash(
      asRequest<"generateDownloadHash">({ query: { jobId } }, requestOptions)
    );
  }
  public progress(hash: string, requestOptions?: CuratedRequestOptions) {
    return this.client.raw.export.getProgress(
      asRequest<"getProgress">({ query: { hash } }, requestOptions)
    );
  }
  public jobDownloadInfo(jobId: string, requestOptions?: CuratedRequestOptions) {
    return this.client.raw.export.jobDownloadInfo(
      asRequest<"jobDownloadInfo">({ query: { jobId } }, requestOptions)
    );
  }
  public updateConfig(
    sevClientId: SevdeskIdInput,
    input: ExportConfigInput,
    requestOptions?: CuratedRequestOptions
  ) {
    return this.client.raw.export.updateExportConfig(
      forwardCompatibleRequest<"updateExportConfig">(
        {
          path: { SevClientId: numericId(sevClientId, "sev client") },
          body: forwardCompatibleBody(input)
        },
        workflowWriteOptions(requestOptions)
      )
    );
  }
  private async mapFile<TJson, TData, TBody>(
    pending: Promise<SevdeskResult<TJson, TData, TBody>>
  ): Promise<SevdeskResult<TJson, FileEnvelope, TBody>> {
    const result = await pending;
    return mapResultData(result, normalizeFileEnvelope(result.json));
  }
}

function invoiceQuery(input: InvoiceExportInput) {
  const types = input.filter?.invoiceTypes?.map(exportInvoiceType);
  return {
    ...(input.download === undefined ? {} : { download: input.download }),
    sevQuery: {
      modelName: "Invoice" as const,
      objectName: "SevQuery" as const,
      ...(input.limit === undefined ? {} : { limit: input.limit }),
      ...(input.filter === undefined && types === undefined
        ? {}
        : {
            filter: {
              ...rangeFilter(input.filter ?? {}),
              ...(types === undefined ? {} : { invoiceType: types })
            }
          })
    }
  };
}

function voucherQuery(input: VoucherExportInput) {
  const filter = input.filter;
  return {
    ...(input.download === undefined ? {} : { download: input.download }),
    sevQuery: {
      modelName: "Voucher" as const,
      objectName: "SevQuery" as const,
      ...(input.limit === undefined ? {} : { limit: input.limit }),
      ...(filter === undefined
        ? {}
        : {
            filter: {
              ...rangeFilter(filter),
              ...(filter.startPayDate === undefined ? {} : { startPayDate: filter.startPayDate }),
              ...(filter.endPayDate === undefined ? {} : { endPayDate: filter.endPayDate })
            }
          })
    }
  };
}

function rangeFilter(filter: ExportRangeFilter) {
  return {
    ...(filter.startDate === undefined ? {} : { startDate: filter.startDate }),
    ...(filter.endDate === undefined ? {} : { endDate: filter.endDate }),
    ...(filter.contact === undefined ? {} : { contact: wireReference(filter.contact) }),
    ...(filter.startAmount === undefined ? {} : { startAmount: filter.startAmount }),
    ...(filter.endAmount === undefined ? {} : { endAmount: filter.endAmount })
  };
}

function contactFilter(filter: NonNullable<ContactExportInput["filter"]>) {
  return {
    ...(filter.zip === undefined ? {} : { zip: filter.zip }),
    ...(filter.city === undefined ? {} : { city: filter.city }),
    ...(filter.country === undefined ? {} : { country: wireReference(filter.country) }),
    ...(filter.depth === undefined ? {} : { depth: filter.depth }),
    ...(filter.onlyPeople === undefined ? {} : { onlyPeople: filter.onlyPeople })
  };
}

function exportInvoiceType(value: InvoiceTypeInput | ExportInvoiceType): ExportInvoiceType {
  if (typeof value === "string") {
    const prefix = value.trim().replace(/\.$/u, "").toUpperCase();
    if ((TENANT_PREFIXES as readonly string[]).includes(prefix)) {
      throw new SevdeskConfigurationError(
        `"${value}" is a tenant number prefix, not an official invoice type.`
      );
    }
    if (value === "Re") return "Re";
  }
  const code = String(enumCode(InvoiceType, value as InvoiceTypeInput, "invoice type"));
  return (code === "RE" ? "Re" : code) as ExportInvoiceType;
}

function requiredScope(value: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SevdeskConfigurationError("DATEV export scope must be a non-empty string.");
  }
  return value;
}

export type { FileEnvelope };
