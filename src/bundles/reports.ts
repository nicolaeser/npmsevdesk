import type { SevdeskClient } from "../client/sevdesk-client.js";
import { InvoiceType, OrderType, type InvoiceTypeInput, type OrderTypeInput } from "../enums/domain-enums.js";
import type { FileEnvelope, SevdeskResult } from "../types/result.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import { normalizeFileEnvelope } from "../utils/files.js";
import { mapResultData } from "../utils/result.js";
import { asRequest, enumCode, wireReference } from "./internal.js";
import type { ContactExportInput, ExportRangeFilter, InvoiceExportInput, VoucherExportInput } from "./exports.js";
import type { CuratedRequestOptions } from "./types.js";

const TENANT_PREFIXES = ["INV", "CN", "OC", "QUO", "DN", "BP", "AST", "SKU"] as const;

export interface InvoiceReportInput extends InvoiceExportInput {
  readonly view: string;
}

export interface OrderReportInput {
  readonly view: string;
  readonly download?: boolean;
  readonly limit?: number;
  readonly filter?: ExportRangeFilter & {
    readonly orderType?: OrderTypeInput | "AN" | "AB" | "LI";
  };
}

export interface VoucherReportInput extends VoucherExportInput {}

export interface ContactReportInput extends ContactExportInput {}

export class ReportsBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public invoices(input: InvoiceReportInput, requestOptions?: CuratedRequestOptions) {
    return this.mapFile(
      this.client.raw.report.reportInvoice(
        asRequest<"reportInvoice">(
          {
            query: {
              view: requiredView(input.view),
              ...(input.download === undefined ? {} : { download: input.download }),
              sevQuery: {
                modelName: "Invoice",
                objectName: "SevQuery",
                ...(input.limit === undefined ? {} : { limit: input.limit }),
                ...(input.filter === undefined
                  ? {}
                  : {
                      filter: {
                        ...rangeFilter(input.filter),
                        ...(input.filter.invoiceTypes === undefined
                          ? {}
                          : { invoiceType: input.filter.invoiceTypes.map(reportInvoiceType) })
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
  public orders(input: OrderReportInput, requestOptions?: CuratedRequestOptions) {
    return this.mapFile(
      this.client.raw.report.reportOrder(
        asRequest<"reportOrder">(
          {
            query: {
              view: requiredView(input.view),
              ...(input.download === undefined ? {} : { download: input.download }),
              sevQuery: {
                modelName: "Order",
                objectName: "SevQuery",
                ...(input.limit === undefined ? {} : { limit: input.limit }),
                ...(input.filter === undefined
                  ? {}
                  : {
                      filter: {
                        ...rangeFilter(input.filter),
                        ...(input.filter.orderType === undefined
                          ? {}
                          : { orderType: reportOrderType(input.filter.orderType) })
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
  public vouchers(input: VoucherReportInput = {}, requestOptions?: CuratedRequestOptions) {
    const filter = input.filter;
    return this.mapFile(
      this.client.raw.report.reportVoucher(
        asRequest<"reportVoucher">(
          {
            query: {
              ...(input.download === undefined ? {} : { download: input.download }),
              sevQuery: {
                modelName: "Voucher",
                objectName: "SevQuery",
                ...(input.limit === undefined ? {} : { limit: input.limit }),
                ...(filter === undefined
                  ? {}
                  : {
                      filter: {
                        ...rangeFilter(filter),
                        ...(filter.startPayDate === undefined
                          ? {}
                          : { startPayDate: filter.startPayDate }),
                        ...(filter.endPayDate === undefined ? {} : { endPayDate: filter.endPayDate })
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
  public contacts(input: ContactReportInput = {}, requestOptions?: CuratedRequestOptions) {
    const filter = input.filter;
    return this.mapFile(
      this.client.raw.report.reportContact(
        asRequest<"reportContact">(
          {
            query: {
              ...(input.download === undefined ? {} : { download: input.download }),
              sevQuery: {
                modelName: "Contact",
                objectName: "SevQuery",
                ...(input.limit === undefined ? {} : { limit: input.limit }),
                ...(filter === undefined
                  ? {}
                  : {
                      filter: {
                        ...(filter.zip === undefined ? {} : { zip: filter.zip }),
                        ...(filter.city === undefined ? {} : { city: filter.city }),
                        ...(filter.country === undefined
                          ? {}
                          : { country: wireReference(filter.country) }),
                        ...(filter.depth === undefined ? {} : { depth: filter.depth }),
                        ...(filter.onlyPeople === undefined
                          ? {}
                          : { onlyPeople: filter.onlyPeople })
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
  private async mapFile<TJson, TData, TBody>(
    pending: Promise<SevdeskResult<TJson, TData, TBody>>
  ): Promise<SevdeskResult<TJson, FileEnvelope, TBody>> {
    const result = await pending;
    return mapResultData(result, normalizeFileEnvelope(result.json));
  }
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

function reportInvoiceType(value: InvoiceTypeInput | "Re"): "Re" | "SR" | "TR" | "AR" | "ER" | "WKR" | "MA" {
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
  return (code === "RE" ? "Re" : code) as "Re" | "SR" | "TR" | "AR" | "ER" | "WKR" | "MA";
}

function reportOrderType(value: OrderTypeInput | "AN" | "AB" | "LI"): "AN" | "AB" | "LI" {
  if (typeof value === "string") {
    const prefix = value.trim().replace(/\.$/u, "").toUpperCase();
    if ((TENANT_PREFIXES as readonly string[]).includes(prefix)) {
      throw new SevdeskConfigurationError(
        `"${value}" is a tenant number prefix, not an official order type.`
      );
    }
  }
  return String(enumCode(OrderType, value as OrderTypeInput, "order type")) as "AN" | "AB" | "LI";
}

function requiredView(value: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SevdeskConfigurationError("Report view must be a non-empty string.");
  }
  return value;
}
