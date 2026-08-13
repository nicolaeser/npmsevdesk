import type { SevdeskClient } from "../client/sevdesk-client.js";
import {
  mapCreatedTransactionResult,
  mapTransactionListResult,
  mapTransactionResult,
  mapUpdatedTransactionResult
} from "../domain/result-mappers.js";
import type {
  CreatedTransactionResult,
  TransactionListResult,
  TransactionResult,
  UpdatedTransactionResult
} from "../domain/results.js";
import {
  CheckAccountTransactionStatus,
  type CheckAccountTransactionStatusInput
} from "../enums/domain-enums.js";
import type { SevdeskIdInput, SevdeskReference } from "../types/references.js";
import { SevdeskConfigurationError } from "../utils/errors.js";
import {
  validateFiniteNumber,
  validatePaginationLimit,
  validatePaginationOffset,
  validateSevdeskDateString
} from "../utils/validation.js";
import {
  asRequest,
  forwardCompatibleBody,
  forwardCompatibleRequest,
  numericEnumCode,
  numericId,
  wireReference
} from "./internal.js";
import type {
  CuratedRequestOptions,
  PageOptions,
  RequireAtLeastOne,
  WorkflowActionReceipt
} from "./types.js";
import { workflowActionReceipt, workflowWriteOptions } from "./workflow.js";

export type TransactionEmbed = "checkAccount" | "sevClient" | "sourceTransaction" | "targetTransaction";

export interface TransactionListOptions extends PageOptions<TransactionEmbed> {
  readonly checkAccount?: SevdeskReference<"CheckAccount">;
  readonly isBooked?: boolean;
  readonly paymtPurpose?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly payeePayerName?: string;
  readonly onlyCredit?: boolean;
  readonly onlyDebit?: boolean;
  readonly status?: CheckAccountTransactionStatusInput;
  readonly hideFees?: boolean;
  readonly searchForInvoiceAndVoucher?: string;
}

export interface TransactionCreateInput {
  readonly valueDate: string;
  readonly amount: number;
  readonly payeePayerName: string | null;
  readonly checkAccount: SevdeskReference<"CheckAccount">;
  readonly status?: CheckAccountTransactionStatusInput;
  readonly entryDate?: string | null;
  readonly paymtPurpose?: string | null;
  readonly payeePayerAcctNo?: string | null;
  readonly payeePayerBankCode?: string | null;
  readonly sourceTransaction?: SevdeskReference<"CheckAccountTransaction"> | null;
  readonly targetTransaction?: SevdeskReference<"CheckAccountTransaction"> | null;
}

interface TransactionUpdateFields {
  readonly valueDate?: string;
  readonly entryDate?: string | null;
  readonly paymtPurpose?: string;
  readonly amount?: number | null;
  readonly payeePayerName?: string | null;
  readonly checkAccount?: SevdeskReference<"CheckAccount">;
  readonly status?: CheckAccountTransactionStatusInput;
  readonly sourceTransaction?: SevdeskReference<"CheckAccountTransaction"> | null;
  readonly targetTransaction?: SevdeskReference<"CheckAccountTransaction"> | null;
}

export type TransactionUpdateInput = RequireAtLeastOne<TransactionUpdateFields>;

export type TransactionDeleteResult = WorkflowActionReceipt<"deleteCheckAccountTransaction">;
export type TransactionEnshrineResult = WorkflowActionReceipt<"checkAccountTransactionEnshrine">;

export class TransactionsBundle {
  public constructor(private readonly client: SevdeskClient) {}
  public async list(
    options: TransactionListOptions = {},
    requestOptions?: CuratedRequestOptions
  ): Promise<TransactionListResult> {
    const result = await this.client.raw.checkAccountTransaction.getTransactions(
      asRequest<"getTransactions">({ query: transactionListQuery(options) }, requestOptions)
    );
    return mapTransactionListResult(result);
  }
  public async get(
    transactionId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<TransactionResult> {
    const result = await this.client.raw.checkAccountTransaction.getCheckAccountTransactionById(
      asRequest<"getCheckAccountTransactionById">(
        { path: { checkAccountTransactionId: numericId(transactionId, "transaction") } },
        requestOptions
      )
    );
    return mapTransactionResult(result);
  }
  public async create(
    input: TransactionCreateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<CreatedTransactionResult> {
    const result = await this.client.raw.checkAccountTransaction.createTransaction(
      forwardCompatibleRequest<"createTransaction">(
        { body: buildTransactionCreatePayload(input) },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapCreatedTransactionResult(result);
  }
  public async update(
    transactionId: SevdeskIdInput,
    input: TransactionUpdateInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<UpdatedTransactionResult> {
    if (Object.keys(input).length === 0) {
      throw new SevdeskConfigurationError("Transaction update must change at least one field.");
    }
    const result = await this.client.raw.checkAccountTransaction.updateCheckAccountTransaction(
      forwardCompatibleRequest<"updateCheckAccountTransaction">(
        {
          path: { checkAccountTransactionId: numericId(transactionId, "transaction") },
          body: buildTransactionUpdatePayload(input)
        },
        workflowWriteOptions(requestOptions)
      )
    );
    return mapUpdatedTransactionResult(result);
  }
  public async delete(
    transactionId: SevdeskIdInput,
    options: { readonly confirm: true },
    requestOptions?: CuratedRequestOptions
  ): Promise<TransactionDeleteResult> {
    if (options.confirm !== true) {
      throw new SevdeskConfigurationError("transactions.delete requires { confirm: true }.");
    }
    const result = await this.client.raw.checkAccountTransaction.deleteCheckAccountTransaction(
      asRequest<"deleteCheckAccountTransaction">(
        { path: { checkAccountTransactionId: numericId(transactionId, "transaction") } },
        workflowWriteOptions(requestOptions)
      )
    );
    return workflowActionReceipt("deleteCheckAccountTransaction", result);
  }
  public async enshrine(
    transactionId: SevdeskIdInput,
    requestOptions?: CuratedRequestOptions
  ): Promise<TransactionEnshrineResult> {
    const result = await this.client.raw.checkAccountTransaction.checkAccountTransactionEnshrine(
      asRequest<"checkAccountTransactionEnshrine">(
        { path: { checkAccountTransactionId: numericId(transactionId, "transaction") } },
        workflowWriteOptions(requestOptions)
      )
    );
    return workflowActionReceipt("checkAccountTransactionEnshrine", result);
  }
}

function transactionListQuery(options: TransactionListOptions) {
  const checkAccount = options.checkAccount;
  return {
    ...(options.limit === undefined
      ? {}
      : { limit: validatePaginationLimit(options.limit, "transactions list") }),
    ...(options.offset === undefined
      ? {}
      : { offset: validatePaginationOffset(options.offset, "transactions list") }),
    ...(options.countAll === undefined ? {} : { countAll: options.countAll }),
    ...(options.embed === undefined || options.embed.length === 0
      ? {}
      : { embed: [...options.embed] }),
    ...(checkAccount === undefined
      ? {}
      : {
          "checkAccount[id]": numericId(checkAccount.id, "check account"),
          "checkAccount[objectName]": "CheckAccount"
        }),
    ...(options.isBooked === undefined ? {} : { isBooked: options.isBooked }),
    ...(options.paymtPurpose === undefined ? {} : { paymtPurpose: options.paymtPurpose }),
    ...(options.startDate === undefined ? {} : { startDate: options.startDate }),
    ...(options.endDate === undefined ? {} : { endDate: options.endDate }),
    ...(options.payeePayerName === undefined ? {} : { payeePayerName: options.payeePayerName }),
    ...(options.onlyCredit === undefined ? {} : { onlyCredit: options.onlyCredit }),
    ...(options.onlyDebit === undefined ? {} : { onlyDebit: options.onlyDebit }),
    ...(options.status === undefined
      ? {}
      : {
          status: numericEnumCode(
            CheckAccountTransactionStatus,
            options.status,
            "transaction status"
          ) as 100 | 200 | 300 | 350 | 400
        }),
    ...(options.hideFees === undefined ? {} : { hideFees: options.hideFees }),
    ...(options.searchForInvoiceAndVoucher === undefined
      ? {}
      : { searchForInvoiceAndVoucher: options.searchForInvoiceAndVoucher })
  };
}

function buildTransactionCreatePayload(input: TransactionCreateInput) {
  validateSevdeskDateString(input.valueDate, "transaction valueDate");
  if (input.entryDate !== undefined && input.entryDate !== null) {
    validateSevdeskDateString(input.entryDate, "transaction entryDate");
  }
  return forwardCompatibleBody({
    valueDate: input.valueDate,
    amount: validateFiniteNumber(input.amount, "transaction amount"),
    payeePayerName: input.payeePayerName,
    checkAccount: wireReference(input.checkAccount),
    status: transactionWriteStatus(input.status ?? CheckAccountTransactionStatus.CREATED),
    ...(input.entryDate === undefined ? {} : { entryDate: input.entryDate }),
    ...(input.paymtPurpose === undefined ? {} : { paymtPurpose: input.paymtPurpose }),
    ...(input.payeePayerAcctNo === undefined ? {} : { payeePayerAcctNo: input.payeePayerAcctNo }),
    ...(input.payeePayerBankCode === undefined
      ? {}
      : { payeePayerBankCode: input.payeePayerBankCode }),
    ...(input.sourceTransaction === undefined
      ? {}
      : {
          sourceTransaction:
            input.sourceTransaction === null ? null : wireReference(input.sourceTransaction)
        }),
    ...(input.targetTransaction === undefined
      ? {}
      : {
          targetTransaction:
            input.targetTransaction === null ? null : wireReference(input.targetTransaction)
        })
  });
}

function buildTransactionUpdatePayload(input: TransactionUpdateInput) {
  if (input.valueDate !== undefined) {
    validateSevdeskDateString(input.valueDate, "transaction valueDate");
  }
  if (input.entryDate !== undefined && input.entryDate !== null) {
    validateSevdeskDateString(input.entryDate, "transaction entryDate");
  }
  if (input.amount !== undefined && input.amount !== null) {
    validateFiniteNumber(input.amount, "transaction amount");
  }
  return forwardCompatibleBody({
    ...(input.valueDate === undefined ? {} : { valueDate: input.valueDate }),
    ...(input.entryDate === undefined ? {} : { entryDate: input.entryDate }),
    ...(input.paymtPurpose === undefined ? {} : { paymtPurpose: input.paymtPurpose }),
    ...(input.amount === undefined ? {} : { amount: input.amount }),
    ...(input.payeePayerName === undefined ? {} : { payeePayerName: input.payeePayerName }),
    ...(input.checkAccount === undefined ? {} : { checkAccount: wireReference(input.checkAccount) }),
    ...(input.status === undefined ? {} : { status: transactionWriteStatus(input.status) }),
    ...(input.sourceTransaction === undefined
      ? {}
      : {
          sourceTransaction:
            input.sourceTransaction === null ? null : wireReference(input.sourceTransaction)
        }),
    ...(input.targetTransaction === undefined
      ? {}
      : {
          targetTransaction:
            input.targetTransaction === null ? null : wireReference(input.targetTransaction)
        })
  });
}

function transactionWriteStatus(
  value: CheckAccountTransactionStatusInput
): 100 | 200 | 300 | 400 {
  const code = numericEnumCode(CheckAccountTransactionStatus, value, "transaction status");
  if (code !== 100 && code !== 200 && code !== 300 && code !== 400) {
    throw new SevdeskConfigurationError(
      "Transaction create/update status must be CREATED, LINKED, PRIVATE, or BOOKED."
    );
  }
  return code;
}
