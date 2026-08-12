import { BaseResource } from "../base-resource.js";
import type { operations } from "../../types/openapi.js";
import type { RequestFor, ResultFor } from "../../types/operation.js";

export class VoucherResource extends BaseResource {
  bookVoucher(
    request: RequestFor<operations["bookVoucher"]>
  ): Promise<ResultFor<operations["bookVoucher"]>> {
    return this.call("bookVoucher", request);
  }
  forAccountNumber(
    request: RequestFor<operations["forAccountNumber"]>
  ): Promise<ResultFor<operations["forAccountNumber"]>> {
    return this.call("forAccountNumber", request);
  }
  forAllAccounts(
    request: RequestFor<operations["forAllAccounts"]> = {}
  ): Promise<ResultFor<operations["forAllAccounts"]>> {
    return this.call("forAllAccounts", request);
  }
  forExpense(
    request: RequestFor<operations["forExpense"]> = {}
  ): Promise<ResultFor<operations["forExpense"]>> {
    return this.call("forExpense", request);
  }
  forRevenue(
    request: RequestFor<operations["forRevenue"]> = {}
  ): Promise<ResultFor<operations["forRevenue"]>> {
    return this.call("forRevenue", request);
  }
  forTaxRule(
    request: RequestFor<operations["forTaxRule"]>
  ): Promise<ResultFor<operations["forTaxRule"]>> {
    return this.call("forTaxRule", request);
  }
  getVoucherById(
    request: RequestFor<operations["getVoucherById"]>
  ): Promise<ResultFor<operations["getVoucherById"]>> {
    return this.call("getVoucherById", request);
  }
  getVouchers(
    request: RequestFor<operations["getVouchers"]> = {}
  ): Promise<ResultFor<operations["getVouchers"]>> {
    return this.call("getVouchers", request);
  }
  updateVoucher(
    request: RequestFor<operations["updateVoucher"]>
  ): Promise<ResultFor<operations["updateVoucher"]>> {
    return this.call("updateVoucher", request);
  }
  voucherEnshrine(
    request: RequestFor<operations["voucherEnshrine"]>
  ): Promise<ResultFor<operations["voucherEnshrine"]>> {
    return this.call("voucherEnshrine", request);
  }
  voucherFactorySaveVoucher(
    request: RequestFor<operations["voucherFactorySaveVoucher"]>
  ): Promise<ResultFor<operations["voucherFactorySaveVoucher"]>> {
    return this.call("voucherFactorySaveVoucher", request);
  }
  voucherResetToDraft(
    request: RequestFor<operations["voucherResetToDraft"]>
  ): Promise<ResultFor<operations["voucherResetToDraft"]>> {
    return this.call("voucherResetToDraft", request);
  }
  voucherResetToOpen(
    request: RequestFor<operations["voucherResetToOpen"]>
  ): Promise<ResultFor<operations["voucherResetToOpen"]>> {
    return this.call("voucherResetToOpen", request);
  }
  voucherUploadFile(
    request: RequestFor<operations["voucherUploadFile"]>
  ): Promise<ResultFor<operations["voucherUploadFile"]>> {
    return this.call("voucherUploadFile", request);
  }
}
