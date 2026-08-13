import type { SevdeskClient } from "../src/client/sevdesk-client.js";
import type {
  CheckAccountDeleteResult,
  CheckAccountListResult,
  TagDeleteResult,
  TextTemplateDeleteResult,
  TransactionDeleteResult,
  TransactionListResult
} from "../src/index.js";

declare const client: SevdeskClient;

async function remainingCuratedContracts(): Promise<void> {
  const accounts: CheckAccountListResult = await client.checkAccounts.list({ limit: 1 });
  const accountTotal: number | undefined = accounts.pagination.total;
  const accountName: string | undefined = accounts.data[0]?.name;
  void [accountTotal, accountName];
  const deletedAccount: CheckAccountDeleteResult = await client.checkAccounts.delete(11, {
    confirm: true
  });
  const deleteAccountOp: "deleteCheckAccount" = deletedAccount.operationId;
  void deleteAccountOp;
  const transactions: TransactionListResult = await client.transactions.list({
    embed: ["sourceTransaction", "targetTransaction"]
  });
  const transactionPage: number | undefined = transactions.pagination.returned;
  void transactionPage;
  const deletedTransaction: TransactionDeleteResult = await client.transactions.delete(22, {
    confirm: true
  });
  const deleteTransactionOp: "deleteCheckAccountTransaction" = deletedTransaction.operationId;
  void deleteTransactionOp;
  const deletedTag: TagDeleteResult = await client.tags.delete(33, { confirm: true });
  const deleteTagOp: "deleteTag" = deletedTag.operationId;
  void deleteTagOp;
  const deletedTemplate: TextTemplateDeleteResult = await client.textTemplates.delete(55, {
    confirm: true
  });
  const deleteTemplateOp: "deleteTextTemplate" = deletedTemplate.operationId;
  void deleteTemplateOp;
  const sameTags = client.bundles.tags;
  const sameExports = client.bundles.exports;
  void sameTags.list;
  void sameExports.invoices;
}

void remainingCuratedContracts;
