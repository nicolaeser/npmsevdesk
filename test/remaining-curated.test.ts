import axios, { type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import {
  CheckAccountTransactionStatus,
  InvoiceType,
  SevdeskConfigurationError,
  TextTemplateCategory,
  refs
} from "../src/index.js";
import { adapter, jsonResponse, requestJson } from "./helpers.js";

const checkAccount = {
  id: "11",
  objectName: "CheckAccount" as const,
  name: "Cash",
  type: "offline" as const,
  status: "100"
};

const transaction = {
  id: "22",
  objectName: "CheckAccountTransaction" as const,
  valueDate: "13.08.2026",
  amount: 12.5,
  payeePayerName: "Acme",
  status: "100",
  checkAccount: { id: "11", objectName: "CheckAccount" as const }
};

const tag = {
  id: "33",
  objectName: "Tag" as const,
  name: "Priority"
};

const tagRelation = {
  id: "44",
  objectName: "TagRelation" as const,
  tag: { id: "33", objectName: "Tag" as const },
  object: { id: 42, objectName: "Invoice" as const }
};

const textTemplate = {
  id: 55,
  name: "Invoice footer",
  text: "Thank you.",
  category: "DOCUMENT" as const,
  objectType: "RE" as const,
  textType: "FOOT" as const
};

function retryFlag(config: InternalAxiosRequestConfig): unknown {
  return (config as InternalAxiosRequestConfig & { _sevdesk?: { retry?: unknown } })._sevdesk
    ?.retry;
}

function clientWithAdapter(
  handler: (config: InternalAxiosRequestConfig) => ReturnType<typeof jsonResponse>
) {
  return createSevdeskClient({
    apiToken: "test-token",
    axiosInstance: axios.create({ adapter: adapter(handler) })
  });
}

describe("curated check accounts", () => {
  it("lists, gets, and reads a balance with pagination and identity", async () => {
    const client = clientWithAdapter((config) => {
      if (config.url === "/CheckAccount") {
        expect(config.method).toBe("get");
        expect(config.params).toEqual({ limit: 10, offset: 0, countAll: true });
        return jsonResponse(config, { objects: [checkAccount], total: 3 });
      }
      if (config.url === "/CheckAccount/11") {
        expect(config.method).toBe("get");
        return jsonResponse(config, { objects: [checkAccount] });
      }
      if (config.url === "/CheckAccount/11/getBalanceAtDate") {
        expect(config.method).toBe("get");
        expect(config.params).toEqual({ date: "13.08.2026" });
        return jsonResponse(config, { objects: "123.45" });
      }
      return jsonResponse(config, { objects: [] });
    });
    const listed = await client.checkAccounts.list({ limit: 10, offset: 0, countAll: true });
    expect(listed.pagination).toEqual({
      limit: 10,
      offset: 0,
      total: 3,
      returned: 1,
      hasMore: true,
      nextOffset: 1
    });
    expect(listed.data[0]).toMatchObject({ id: "11", objectName: "CheckAccount", name: "Cash" });
    expect(listed.objects[0]?.id).toBe("11");
    const found = await client.checkAccounts.get(11);
    expect(found.data.id).toBe("11");
    const balance = await client.checkAccounts.balanceAt(11, new Date(2026, 7, 13, 12, 0, 0));
    expect(balance.data).toBe("123.45");
  });
  it("creates clearing and file-import accounts, merge-updates, and requires delete confirm", async () => {
    const requests: Array<{
      readonly method?: string;
      readonly url?: string;
      readonly retry: unknown;
      readonly body: unknown;
    }> = [];
    const client = clientWithAdapter((config) => {
      requests.push({
        ...(config.method === undefined ? {} : { method: config.method }),
        ...(config.url === undefined ? {} : { url: config.url }),
        retry: retryFlag(config),
        body: requestJson(config)
      });
      if (String(config.url).includes("clearingAccount")) {
        return jsonResponse(
          config,
          { objects: { ...checkAccount, id: "12", name: "Clearing" } },
          201
        );
      }
      if (String(config.url).includes("fileImportAccount")) {
        return jsonResponse(
          config,
          { objects: { ...checkAccount, id: "13", name: "Bank", importType: "CSV" } },
          201
        );
      }
      if (config.method === "put") {
        return jsonResponse(config, { objects: { ...checkAccount, name: "Cash desk" } });
      }
      if (config.method === "delete") {
        return jsonResponse(config, { objects: [] });
      }
      return jsonResponse(config, { objects: checkAccount });
    });
    const clearing = await client.checkAccounts.createClearing({ name: " Clearing " });
    expect(clearing.data).toMatchObject({ id: "12", objectName: "CheckAccount", name: "Clearing" });
    const imported = await client.checkAccounts.createFileImport({
      name: "Bank",
      importType: "CSV",
      iban: "DE89370400440532013000"
    });
    expect(imported.data.id).toBe("13");
    const updated = await client.checkAccounts.update(11, { name: "Cash desk" });
    expect(updated.data.name).toBe("Cash desk");
    await expect(client.checkAccounts.delete(11, { confirm: true })).resolves.toMatchObject({
      performed: true,
      operationId: "deleteCheckAccount",
      status: 200
    });
    await expect(
      client.checkAccounts.delete(11, { confirm: false as true })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(requests).toEqual([
      {
        method: "post",
        url: "/CheckAccount/Factory/clearingAccount",
        retry: false,
        body: { name: "Clearing" }
      },
      {
        method: "post",
        url: "/CheckAccount/Factory/fileImportAccount",
        retry: false,
        body: { name: "Bank", importType: "CSV", iban: "DE89370400440532013000" }
      },
      {
        method: "put",
        url: "/CheckAccount/11",
        retry: false,
        body: { name: "Cash desk" }
      },
      {
        method: "delete",
        url: "/CheckAccount/11",
        retry: false,
        body: undefined
      }
    ]);
  });
});

describe("curated transactions", () => {
  it("lists with typed embeds and account filters, then gets one", async () => {
    const client = clientWithAdapter((config) => {
      if (config.url === "/CheckAccountTransaction") {
        expect(config.method).toBe("get");
        expect(config.params).toEqual({
          limit: 5,
          countAll: true,
          embed: ["checkAccount"],
          "checkAccount[id]": 11,
          "checkAccount[objectName]": "CheckAccount",
          status: 100
        });
        return jsonResponse(config, { objects: [transaction], total: 1 });
      }
      expect(config.url).toBe("/CheckAccountTransaction/22");
      return jsonResponse(config, { objects: [transaction] });
    });
    const listed = await client.transactions.list({
      limit: 5,
      countAll: true,
      embed: ["checkAccount"],
      checkAccount: refs.checkAccount(11),
      status: CheckAccountTransactionStatus.CREATED
    });
    expect(listed.pagination.total).toBe(1);
    expect(listed.data[0]).toMatchObject({
      id: "22",
      objectName: "CheckAccountTransaction",
      amount: 12.5
    });
    expect(listed.objects[0]?.status).toBe("100");
    const found = await client.transactions.get(22);
    expect(found.data.id).toBe("22");
  });
  it("creates, updates, deletes with confirm, and enshrines", async () => {
    const requests: Array<{
      readonly method?: string;
      readonly url?: string;
      readonly retry: unknown;
      readonly body: unknown;
    }> = [];
    const client = clientWithAdapter((config) => {
      requests.push({
        ...(config.method === undefined ? {} : { method: config.method }),
        ...(config.url === undefined ? {} : { url: config.url }),
        retry: retryFlag(config),
        body: requestJson(config)
      });
      if (config.method === "post") {
        return jsonResponse(config, { objects: transaction }, 201);
      }
      if (config.method === "put") {
        return jsonResponse(config, { objects: { ...transaction, amount: 20 } });
      }
      return jsonResponse(config, { objects: [] });
    });
    const created = await client.transactions.create({
      valueDate: "13.08.2026",
      amount: 12.5,
      payeePayerName: "Acme",
      checkAccount: refs.checkAccount(11)
    });
    expect(created.data.id).toBe("22");
    const updated = await client.transactions.update(22, { amount: 20 });
    expect(updated.data.amount).toBe(20);
    await expect(client.transactions.delete(22, { confirm: true })).resolves.toMatchObject({
      operationId: "deleteCheckAccountTransaction",
      performed: true
    });
    await expect(client.transactions.enshrine(22)).resolves.toMatchObject({
      operationId: "checkAccountTransactionEnshrine",
      performed: true
    });
    await expect(
      client.transactions.delete(22, { confirm: false as true })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    await expect(
      client.transactions.create({
        valueDate: "13.08.2026",
        amount: 1,
        payeePayerName: "Acme",
        checkAccount: refs.checkAccount(11),
        status: CheckAccountTransactionStatus.AUTO_BOOKED
      })
    ).rejects.toThrow(/CREATED, LINKED, PRIVATE, or BOOKED/);
    expect(requests.slice(0, 4)).toEqual([
      {
        method: "post",
        url: "/CheckAccountTransaction",
        retry: false,
        body: {
          valueDate: "13.08.2026",
          amount: 12.5,
          payeePayerName: "Acme",
          checkAccount: { id: 11, objectName: "CheckAccount" },
          status: 100
        }
      },
      {
        method: "put",
        url: "/CheckAccountTransaction/22",
        retry: false,
        body: { amount: 20 }
      },
      {
        method: "delete",
        url: "/CheckAccountTransaction/22",
        retry: false,
        body: undefined
      },
      {
        method: "put",
        url: "/CheckAccountTransaction/22/enshrine",
        retry: false,
        body: undefined
      }
    ]);
  });
});

describe("curated tags and text templates", () => {
  it("lists tags, relations, and one tag", async () => {
    const client = clientWithAdapter((config) => {
      if (config.url === "/Tag") {
        expect(config.params).toEqual({ limit: 2, name: "Priority", countAll: true });
        return jsonResponse(config, { objects: [tag], total: 1 });
      }
      if (config.url === "/TagRelation") {
        expect(config.params).toEqual({ limit: 5 });
        return jsonResponse(config, { objects: [tagRelation], total: 1 });
      }
      expect(config.url).toBe("/Tag/33");
      return jsonResponse(config, { objects: [tag] });
    });
    const listed = await client.tags.list({ limit: 2, name: "Priority", countAll: true });
    expect(listed.data[0]?.id).toBe("33");
    expect(listed.pagination.total).toBe(1);
    const relations = await client.tags.relations({ limit: 5 });
    expect(relations.data[0]).toMatchObject({ id: "44", objectName: "TagRelation" });
    const found = await client.tags.get(33);
    expect(found.data.name).toBe("Priority");
  });
  it("creates a relation, updates a tag, and requires delete confirm", async () => {
    const requests: Array<{ readonly method?: string; readonly url?: string; readonly body: unknown }> =
      [];
    const client = clientWithAdapter((config) => {
      requests.push({
        ...(config.method === undefined ? {} : { method: config.method }),
        ...(config.url === undefined ? {} : { url: config.url }),
        body: requestJson(config)
      });
      if (config.url === "/Tag/Factory/create") {
        return jsonResponse(config, { objects: tagRelation });
      }
      if (config.method === "put") {
        return jsonResponse(config, { objects: { ...tag, name: "Urgent" } });
      }
      return jsonResponse(config, { objects: [] });
    });
    const created = await client.tags.create({
      name: "Priority",
      object: refs.invoice(42)
    });
    expect(created.data.objectName).toBe("TagRelation");
    const updated = await client.tags.update(33, { name: " Urgent " });
    expect(updated.data.name).toBe("Urgent");
    await expect(client.tags.delete(33, { confirm: true })).resolves.toMatchObject({
      operationId: "deleteTag"
    });
    await expect(client.tags.delete(33, { confirm: false as true })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    expect(requests).toEqual([
      {
        method: "post",
        url: "/Tag/Factory/create",
        body: { name: "Priority", object: { id: 42, objectName: "Invoice" } }
      },
      { method: "put", url: "/Tag/33", body: { name: "Urgent" } },
      { method: "delete", url: "/Tag/33", body: undefined }
    ]);
  });
  it("lists, creates, updates, and deletes text templates", async () => {
    const client = clientWithAdapter((config) => {
      if (config.method === "get") {
        expect(config.url).toBe("/TextTemplate");
        expect(config.params).toMatchObject({
          limit: 1,
          category: "DOCUMENT",
          objectType: "RE"
        });
        return jsonResponse(config, { objects: [textTemplate], total: 1 });
      }
      if (config.method === "post") {
        expect(config.url).toBe("/TextTemplate");
        expect(requestJson(config)).toEqual({
          name: "Invoice footer",
          text: "Thank you.",
          category: "DOCUMENT",
          objectType: "RE",
          textType: "FOOT"
        });
        return jsonResponse(config, { objects: textTemplate }, 201);
      }
      if (config.method === "put") {
        expect(config.url).toBe("/TextTemplate/55");
        return jsonResponse(config, { objects: { ...textTemplate, text: "Updated." } });
      }
      expect(config.url).toBe("/TextTemplate/55");
      return jsonResponse(config, { objects: [] });
    });
    const listed = await client.textTemplates.list({
      limit: 1,
      category: TextTemplateCategory.DOCUMENT,
      objectType: "RE"
    });
    expect(listed.data[0]).toMatchObject({
      id: "55",
      objectName: "TextTemplate",
      name: "Invoice footer"
    });
    expect(listed.pagination.total).toBe(1);
    const created = await client.textTemplates.create({
      name: " Invoice footer ",
      text: "Thank you.",
      category: "DOCUMENT",
      objectType: "RE",
      textType: "FOOT"
    });
    expect(created.data.objectName).toBe("TextTemplate");
    const updated = await client.textTemplates.update(55, {
      name: "Invoice footer",
      text: "Updated."
    });
    expect(updated.data.text).toBe("Updated.");
    await expect(client.textTemplates.delete(55, { confirm: true })).resolves.toMatchObject({
      operationId: "deleteTextTemplate"
    });
    await expect(
      client.textTemplates.delete(55, { confirm: false as true })
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
  });
});

describe("curated exports and reports", () => {
  it("maps official invoice types to export wire codes and rejects tenant prefixes", async () => {
    const client = clientWithAdapter((config) => {
      expect(config.method).toBe("get");
      expect(config.url).toBe("/Export/invoiceCsv");
      expect(config.params).toEqual({
        download: true,
        sevQuery: {
          modelName: "Invoice",
          objectName: "SevQuery",
          limit: 10,
          filter: {
            invoiceType: ["Re"],
            startDate: "01.01.2026",
            contact: { id: 7, objectName: "Contact" }
          }
        }
      });
      return jsonResponse(config, {
        objects: {
          filename: "invoices.csv",
          mimetype: "text/csv",
          base64Encoded: false,
          content: "id,number"
        }
      });
    });
    const exported = await client.exports.invoices({
      download: true,
      limit: 10,
      filter: {
        invoiceTypes: [InvoiceType.NORMAL],
        startDate: "01.01.2026",
        contact: refs.contact(7)
      }
    });
    expect(exported.data).toMatchObject({
      filename: "invoices.csv",
      mimeType: "text/csv",
      base64Encoded: false,
      content: "id,number"
    });
    expect(exported.objects).toMatchObject({ filename: "invoices.csv", mimetype: "text/csv" });
    expect(() =>
      client.exports.invoices({ filter: { invoiceTypes: ["INV." as never] } })
    ).toThrow(/tenant number prefix/i);
  });
  it("starts a DATEV CSV job and reads progress helpers", async () => {
    const client = clientWithAdapter((config) => {
      if (config.url === "/Export/createDatevCsvZipExportJob") {
        expect(config.params).toMatchObject({
          scope: "invoices",
          includeEnshrined: false
        });
        expect(typeof config.params.startDate).toBe("number");
        expect(retryFlag(config)).toBe(false);
        return jsonResponse(config, { objects: "job-1" });
      }
      if (config.url === "/Progress/generateDownloadHash") {
        expect(config.params).toEqual({ jobId: "job-1" });
        return jsonResponse(config, { objects: [{ hash: "abc" }] });
      }
      if (config.url === "/Progress/getProgress") {
        expect(config.params).toEqual({ hash: "abc" });
        return jsonResponse(config, { objects: [{ progress: 100 }] });
      }
      expect(config.url).toBe("/ExportJob/jobDownloadInfo");
      expect(config.params).toEqual({ jobId: "job-1" });
      return jsonResponse(config, { objects: [{ filename: "datev.zip" }] });
    });
    const job = await client.exports.datevCsv({
      startDate: new Date(2026, 0, 1, 12, 0, 0),
      endDate: new Date(2026, 0, 31, 12, 0, 0),
      scope: "invoices",
      includeEnshrined: false
    });
    expect(job.data).toBe("job-1");
    const hash = await client.exports.downloadHash("job-1");
    expect(hash.data).toEqual([{ hash: "abc" }]);
    const progress = await client.exports.progress("abc");
    expect(progress.data).toEqual([{ progress: 100 }]);
    const info = await client.exports.jobDownloadInfo("job-1");
    expect(info.data).toEqual([{ filename: "datev.zip" }]);
  });
  it("reports invoices with a required view and official type mapping", async () => {
    const client = clientWithAdapter((config) => {
      expect(config.url).toBe("/Report/invoicelist");
      expect(config.params).toEqual({
        view: "csv",
        sevQuery: {
          modelName: "Invoice",
          objectName: "SevQuery",
          filter: { invoiceType: ["Re"] }
        }
      });
      return jsonResponse(config, {
        objects: { filename: "report.csv", mimetype: "text/csv", content: "a" }
      });
    });
    const reported = await client.reports.invoices({
      view: "csv",
      filter: { invoiceTypes: ["RE"] }
    });
    expect(reported.data.filename).toBe("report.csv");
    expect(() => client.reports.invoices({ view: "   " })).toThrow(/view/i);
    expect(() =>
      client.reports.orders({ view: "csv", filter: { orderType: "QUO." as never } })
    ).toThrow(/tenant number prefix/i);
  });
});
