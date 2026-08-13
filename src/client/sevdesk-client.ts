import type { AxiosInstance } from "axios";
import { CheckAccountsBundle } from "../bundles/check-accounts.js";
import { ContactsBundle } from "../bundles/contacts.js";
import { CreditNotesBundle } from "../bundles/credit-notes.js";
import { ExportsBundle } from "../bundles/exports.js";
import { InvoicesBundle } from "../bundles/invoices.js";
import { LayoutBundle } from "../bundles/layout.js";
import { OrdersBundle } from "../bundles/orders.js";
import { PartsBundle } from "../bundles/parts.js";
import { PaymentsBundle } from "../bundles/payments.js";
import { RemindersBundle } from "../bundles/reminders.js";
import { ReportsBundle } from "../bundles/reports.js";
import { SequencesBundle } from "../bundles/sequences.js";
import { TagsBundle } from "../bundles/tags.js";
import { TextTemplatesBundle } from "../bundles/text-templates.js";
import { TransactionsBundle } from "../bundles/transactions.js";
import { UsersBundle } from "../bundles/users.js";
import { VouchersBundle } from "../bundles/vouchers.js";
import { LookupModule } from "../lookup/lookup.js";
import { TaxesModule } from "../taxes/taxes.js";
import { WorkflowContext } from "../bundles/workflow.js";
import type { CustomRequest, SevdeskClientConfig } from "../types/config.js";
import type { operations } from "../types/openapi.js";
import type {
  OperationExecutor,
  PreparedRequest,
  RequestBodyFor,
  RequestFor,
  ResultFor
} from "../types/operation.js";
import type { PrimaryData, SevdeskResult } from "../types/result.js";
import type { ResolvedLogging } from "../utils/logging.js";
import { createRawResources, type RawResources } from "../resources/registry.js";
import { AxiosTransport } from "./axios-transport.js";
import type { OperationId } from "./operation-catalog.js";

export class SevdeskClient implements OperationExecutor {
  public readonly raw: RawResources;
  public readonly axios: AxiosInstance;
  public readonly logging: ResolvedLogging;
  public readonly contacts: ContactsBundle;
  public readonly invoices: InvoicesBundle;
  public readonly orders: OrdersBundle;
  public readonly vouchers: VouchersBundle;
  public readonly creditNotes: CreditNotesBundle;
  public readonly payments: PaymentsBundle;
  public readonly reminders: RemindersBundle;
  public readonly layout: LayoutBundle;
  public readonly parts: PartsBundle;
  public readonly sequences: SequencesBundle;
  public readonly users: UsersBundle;
  public readonly checkAccounts: CheckAccountsBundle;
  public readonly transactions: TransactionsBundle;
  public readonly exports: ExportsBundle;
  public readonly reports: ReportsBundle;
  public readonly tags: TagsBundle;
  public readonly textTemplates: TextTemplatesBundle;
  public readonly lookup: LookupModule;
  public readonly taxes: TaxesModule;
  public readonly bundles: {
    readonly contacts: ContactsBundle;
    readonly invoices: InvoicesBundle;
    readonly orders: OrdersBundle;
    readonly vouchers: VouchersBundle;
    readonly creditNotes: CreditNotesBundle;
    readonly payments: PaymentsBundle;
    readonly reminders: RemindersBundle;
    readonly layout: LayoutBundle;
    readonly parts: PartsBundle;
    readonly sequences: SequencesBundle;
    readonly users: UsersBundle;
    readonly checkAccounts: CheckAccountsBundle;
    readonly transactions: TransactionsBundle;
    readonly exports: ExportsBundle;
    readonly reports: ReportsBundle;
    readonly tags: TagsBundle;
    readonly textTemplates: TextTemplatesBundle;
  };
  private readonly transport: AxiosTransport;
  public constructor(config: SevdeskClientConfig) {
    this.transport = new AxiosTransport(config);
    this.axios = this.transport.axios;
    this.logging = this.transport.logging;
    this.raw = createRawResources(this);
    this.contacts = new ContactsBundle(this);
    this.invoices = new InvoicesBundle(this);
    this.orders = new OrdersBundle(this);
    this.vouchers = new VouchersBundle(this);
    this.creditNotes = new CreditNotesBundle(this);
    this.payments = new PaymentsBundle(this);
    this.reminders = new RemindersBundle(this);
    this.layout = new LayoutBundle(this);
    this.parts = new PartsBundle(this);
    this.sequences = new SequencesBundle(this);
    this.users = new UsersBundle(this);
    this.checkAccounts = new CheckAccountsBundle(this);
    this.transactions = new TransactionsBundle(this);
    this.exports = new ExportsBundle(this);
    this.reports = new ReportsBundle(this);
    this.tags = new TagsBundle(this);
    this.textTemplates = new TextTemplatesBundle(this);
    this.lookup = new LookupModule(this);
    this.taxes = new TaxesModule(this, {
      ...(config.taxRateSource === undefined ? {} : { rateSource: config.taxRateSource }),
      ...(config.useLiveCountryRates === undefined
        ? {}
        : { useLiveCountryRates: config.useLiveCountryRates }),
      ...(config.errorOnMissingCountryRates === undefined
        ? {}
        : { errorOnMissingCountryRates: config.errorOnMissingCountryRates }),
      ...(config.cacheCountryRates === undefined
        ? {}
        : { cacheCountryRates: config.cacheCountryRates })
    });
    this.bundles = {
      contacts: this.contacts,
      invoices: this.invoices,
      orders: this.orders,
      vouchers: this.vouchers,
      creditNotes: this.creditNotes,
      payments: this.payments,
      reminders: this.reminders,
      layout: this.layout,
      parts: this.parts,
      sequences: this.sequences,
      users: this.users,
      checkAccounts: this.checkAccounts,
      transactions: this.transactions,
      exports: this.exports,
      reports: this.reports,
      tags: this.tags,
      textTemplates: this.textTemplates
    };
  }
  public execute<TOperationId extends keyof operations>(
    operationId: TOperationId,
    request: RequestFor<operations[TOperationId]>
  ): Promise<ResultFor<operations[TOperationId]>> {
    return this.transport.execute(operationId, request);
  }
  public prepare<TOperationId extends OperationId>(
    operationId: TOperationId,
    request: RequestFor<operations[TOperationId]>
  ): PreparedRequest<RequestBodyFor<operations[TOperationId]>, TOperationId> {
    return this.transport.prepare(operationId, request);
  }
  public dispose(): void {
    this.transport.dispose();
  }
  public async request<TJson = unknown, TBody = unknown>(
    request: CustomRequest<TBody>
  ): Promise<SevdeskResult<TJson, PrimaryData<TJson>, TBody>> {
    return this.transport.executeCustom<TJson, TBody>(request);
  }
  public createWorkflowContext<
    TWorkflow extends string,
    TOperationId extends keyof operations = keyof operations,
    TPartial = unknown
  >(workflow: TWorkflow): WorkflowContext<TWorkflow, TOperationId, TPartial> {
    return new WorkflowContext(workflow, this.logging);
  }
}

export function createSevdeskClient(config: SevdeskClientConfig): SevdeskClient {
  return new SevdeskClient(config);
}

export type { CustomRequest } from "../types/config.js";
