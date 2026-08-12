import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class ExportResource extends BaseResource {
  exportContact(
    request: RequestFor<operations["exportContact"]>
  ): Promise<ResultFor<operations["exportContact"]>> {
    return this.call("exportContact", request);
  }
  exportCreditNote(
    request: RequestFor<operations["exportCreditNote"]>
  ): Promise<ResultFor<operations["exportCreditNote"]>> {
    return this.call("exportCreditNote", request);
  }
  exportDatevCSV(
    request: RequestFor<operations["exportDatevCSV"]>
  ): Promise<ResultFor<operations["exportDatevCSV"]>> {
    return this.call("exportDatevCSV", request);
  }
  exportDatevDepricated(
    request: RequestFor<operations["exportDatevDepricated"]>
  ): Promise<ResultFor<operations["exportDatevDepricated"]>> {
    return this.call("exportDatevDepricated", request);
  }
  exportDatevXML(
    request: RequestFor<operations["exportDatevXML"]>
  ): Promise<ResultFor<operations["exportDatevXML"]>> {
    return this.call("exportDatevXML", request);
  }
  exportInvoice(
    request: RequestFor<operations["exportInvoice"]>
  ): Promise<ResultFor<operations["exportInvoice"]>> {
    return this.call("exportInvoice", request);
  }
  exportInvoiceZip(
    request: RequestFor<operations["exportInvoiceZip"]>
  ): Promise<ResultFor<operations["exportInvoiceZip"]>> {
    return this.call("exportInvoiceZip", request);
  }
  exportTransactions(
    request: RequestFor<operations["exportTransactions"]>
  ): Promise<ResultFor<operations["exportTransactions"]>> {
    return this.call("exportTransactions", request);
  }
  exportVoucher(
    request: RequestFor<operations["exportVoucher"]>
  ): Promise<ResultFor<operations["exportVoucher"]>> {
    return this.call("exportVoucher", request);
  }
  exportVoucherZip(
    request: RequestFor<operations["exportVoucherZip"]>
  ): Promise<ResultFor<operations["exportVoucherZip"]>> {
    return this.call("exportVoucherZip", request);
  }
  generateDownloadHash(
    request: RequestFor<operations["generateDownloadHash"]>
  ): Promise<ResultFor<operations["generateDownloadHash"]>> {
    return this.call("generateDownloadHash", request);
  }
  getProgress(
    request: RequestFor<operations["getProgress"]>
  ): Promise<ResultFor<operations["getProgress"]>> {
    return this.call("getProgress", request);
  }
  jobDownloadInfo(
    request: RequestFor<operations["jobDownloadInfo"]>
  ): Promise<ResultFor<operations["jobDownloadInfo"]>> {
    return this.call("jobDownloadInfo", request);
  }
  updateExportConfig(
    request: RequestFor<operations["updateExportConfig"]>
  ): Promise<ResultFor<operations["updateExportConfig"]>> {
    return this.call("updateExportConfig", request);
  }
}
