import type { SevdeskClient } from "../client/sevdesk-client.js";
import {
  mapCheckAccountBalanceResult,
  mapCheckAccountListResult,
  mapCheckAccountResult,
  mapCreatedClearingAccountResult,
  mapCreatedFileImportAccountResult,
  mapUpdatedCheckAccountResult
} from "../domain/result-mappers.js";
import type {
  CheckAccountBalanceResult,
  CheckAccountListResult,
  CheckAccountResult,
  CreatedClearingAccountResult,
  CreatedFileImportAccountResult,
  UpdatedCheckAccountResult
} from "../domain/results.js";
import type { SevdeskIdInput } from "../types/references.js";
import { formatSevdeskDate } from "../utils/date.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import {
  validatePaginationLimit,
  validatePaginationOffset,
  validateSevdeskDateString
} from "../utils/validation.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericId
} from "./internal.js";
import type { CuratedRequestOptions, RequireAtLeastOne, WorkflowActionReceipt } from "./types.js";
import { workflowActionReceipt, workflowWriteOptions } from "./workflow.js";

export interface CheckAccountListOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly countAll?: boolean;
}

export interface ClearingAccountCreateInput {
  readonly name: string;
  readonly accountingNumber?: number | null;
}

export interface FileImportAccountCreateInput {
  readonly name: string;
  readonly importType: "CSV" | "MT940";
  readonly accountingNumber?: number | null;
  readonly iban?: string | null;
}

interface CheckAccountUpdateFields {
  readonly name?: string;
  readonly defaultAccount?: 0 | 1;
  readonly autoMapTransactions?: number | null;
  readonly accountingNumber?: string;
  readonly iban?: string;
  readonly bic?: string;
}

export type CheckAccountUpdateInput = RequireAtLeastOne<CheckAccountUpdateFields>;

export type CheckAccountDeleteResult = WorkflowActionReceipt<"deleteCheckAccount">;

export class CheckAccountsBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async list(
    options: CheckAccountListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<CheckAccountListResult> {
    const result = await this.client.raw.checkAccount.getCheckAccounts(
      asRequest<"getCheckAccounts">(
        { query: pageQuery(options, "check-accounts list") },
        requestOptions
      )
    );
    return mapCheckAccountListResult(result);
  }
  public async get(
    checkAccountId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CheckAccountResult> {
    const result = await this.client.raw.checkAccount.getCheckAccountById(
      asRequest<"getCheckAccountById">(
        { path: { checkAccountId: numericId(checkAccountId, "check account") } },
        requestOptions
      )
    );
    return mapCheckAccountResult(result);
  }
  public async createClearing(
    input: ClearingAccountCreateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedClearingAccountResult> {
    const result = await this.client.raw.checkAccount.createClearingAccount(
      forwardCompatibleRequest<"createClearingAccount">(
        {
          body: forwardCompatibleBody({
            name: requiredName(input.name, "clearing account"),
            ...(input.accountingNumber === undefined
              ? {}
              : { accountingNumber: input.accountingNumber })
          })
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapCreatedClearingAccountResult(result);
  }
  public async createFileImport(
    input: FileImportAccountCreateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedFileImportAccountResult> {
    if (input.importType !== "CSV" && input.importType !== "MT940") {
      throw new SevdeskConfigurationError(
        'createFileImport importType must be "CSV" or "MT940".'
      );
    }
    const result = await this.client.raw.checkAccount.createFileImportAccount(
      forwardCompatibleRequest<"createFileImportAccount">(
        {
          body: forwardCompatibleBody({
            name: requiredName(input.name, "file-import account"),
            importType: input.importType,
            ...(input.accountingNumber === undefined
              ? {}
              : { accountingNumber: input.accountingNumber }),
            ...(input.iban === undefined ? {} : { iban: input.iban })
          })
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapCreatedFileImportAccountResult(result);
  }
  public async update(
    checkAccountId: SevdeskIdInput,
    input: CheckAccountUpdateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<UpdatedCheckAccountResult> {
    if (Object.keys(input).length === 0) {
      throw new SevdeskConfigurationError("Check-account update must change at least one field.");
    }
    const result = await this.client.raw.checkAccount.updateCheckAccount(
      forwardCompatibleRequest<"updateCheckAccount">(
        {
          path: { checkAccountId: numericId(checkAccountId, "check account") },
          body: forwardCompatibleBody({ ...input })
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapUpdatedCheckAccountResult(result);
  }
  public async delete(
    checkAccountId: SevdeskIdInput,
    options: { readonly confirm: true },
    requestOptions?: CuratedRequestOptions
  ): Promise<CheckAccountDeleteResult> {
    if (options.confirm !== true) {
      throw new SevdeskConfigurationError("checkAccounts.delete requires { confirm: true }.");
    }
    const result = await this.client.raw.checkAccount.deleteCheckAccount(
      asRequest<"deleteCheckAccount">(
        { path: { checkAccountId: numericId(checkAccountId, "check account") } },
        workflowWriteOptions(requestOptions)
      )
    );
    return workflowActionReceipt("deleteCheckAccount", result);
  }
  public async balanceAt(
    checkAccountId: SevdeskIdInput,
    date: string | Date,
    requestOptions?: CuratedRequestOptions
  ): Promise<CheckAccountBalanceResult> {
    const resolved =
      date instanceof Date
        ? formatSevdeskDate(date)
        : validateSevdeskDateString(date, "check-account balance date");
    const result = await this.client.raw.checkAccount.getBalanceAtDate(
      asRequest<"getBalanceAtDate">(
        {
          path: { checkAccountId: numericId(checkAccountId, "check account") },
          query: { date: resolved }
        },
        requestOptions
      )
    );
    return mapCheckAccountBalanceResult(result);
  }
}

function pageQuery(
  options: { readonly limit?: number; readonly offset?: number; readonly countAll?: boolean },
  label: string
): { limit?: number; offset?: number; countAll?: boolean } {
  return {
    ...(options.limit === undefined ? {} : { limit: validatePaginationLimit(options.limit, label) }),
    ...(options.offset === undefined
      ? {}
      : { offset: validatePaginationOffset(options.offset, label) }),
    ...(options.countAll === undefined ? {} : { countAll: options.countAll })
  };
}

function requiredName(value: string, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SevdeskConfigurationError(`${label} name must be a non-empty string.`);
  }
  return value.trim();
}
