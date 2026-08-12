import axios, { type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import {
  buildPartCreatePayload,
  buildPartUpdatePayload,
  createSevdeskClient,
  PartStatus,
  refs,
  SevdeskConfigurationError,
  SevdeskResponseValidationError
} from "../src/index.js";
import type { PartUpdateInput } from "../src/bundles/parts.js";
import { adapter, jsonResponse, requestJson } from "./helpers.js";

const part = {
  id: 3,
  objectName: "Part" as const,
  name: "Widget",
  partNumber: "SKU-1",
  stock: 12,
  stockEnabled: true,
  unity: { id: 1, objectName: "Unity" as const },
  taxRate: 19,
  status: 100 as const
};

describe("curated parts", () => {
  it("normalizes lists, exact gets, stock, and required pagination", async () => {
    const client = clientWithAdapter((config) => {
      if (config.url === "/Part") {
        expect(config.params).toEqual({
          limit: 10,
          offset: 20,
          countAll: true,
          partNumber: "SKU-1",
          embed: ["category", "unity"]
        });
        return jsonResponse(config, { objects: [part], total: 21 });
      }
      if (config.url === "/Part/3/getStock") {
        return jsonResponse(config, { objects: 12 });
      }
      return jsonResponse(config, { objects: [part] });
    });
    const listed = await client.parts.list({
      limit: 10,
      offset: 20,
      countAll: true,
      partNumber: " SKU-1 ",
      embed: ["category", "unity"]
    });
    expect(listed.pagination).toEqual({
      limit: 10,
      offset: 20,
      total: 21,
      returned: 1,
      hasMore: false
    });
    expect(listed.data[0]).toMatchObject({
      id: "3",
      status: "ACTIVE",
      statusCode: 100,
      statusKnown: true
    });
    expect(listed.objects[0]?.status).toBe(100);
    const found = await client.parts.get("3");
    expect(found.data.id).toBe("3");
    expect(found.data.objectName).toBe("Part");
    const stock = await client.parts.getStock(3);
    expect(stock.data).toBe(12);
  });
  it("builds semantic create/update payloads and returns normalized resources", async () => {
    const requests: Array<{
      readonly method?: string;
      readonly retry?: unknown;
      readonly body: unknown;
    }> = [];
    const client = clientWithAdapter((config) => {
      requests.push({
        ...(config.method === undefined ? {} : { method: config.method }),
        retry: (config as InternalAxiosRequestConfig & { _sevdesk?: { retry?: unknown } })._sevdesk
          ?.retry,
        body: requestJson(config)
      });
      const body = requestJson(config) as Record<string, unknown>;
      return jsonResponse(config, {
        objects: {
          ...part,
          ...(body.name === undefined ? {} : { name: body.name }),
          ...(body.status === undefined ? {} : { status: body.status })
        }
      });
    });
    const created = await client.parts.create({
      name: " Widget Pro ",
      partNumber: " SKU-PRO ",
      stock: 5,
      stockEnabled: true,
      unity: refs.unity(1),
      category: refs.category(2),
      taxRate: 19,
      priceNet: 100,
      status: PartStatus.ACTIVE
    });
    expect(created.data).toMatchObject({
      name: "Widget Pro",
      status: "ACTIVE",
      statusCode: 100
    });
    expect(created.json.objects?.status).toBe(100);
    const updated = await client.parts.update(3, {
      name: "Retired Widget",
      status: "inactive",
      category: null
    });
    expect(updated.data).toMatchObject({
      name: "Retired Widget",
      status: "INACTIVE",
      statusCode: 50
    });
    expect(requests).toEqual([
      {
        method: "post",
        retry: false,
        body: {
          objectName: "Part",
          name: "Widget Pro",
          partNumber: "SKU-PRO",
          stock: 5,
          unity: { id: 1, objectName: "Unity" },
          taxRate: 19,
          category: { id: 2, objectName: "Category" },
          stockEnabled: true,
          priceNet: 100,
          status: 100
        }
      },
      {
        method: "put",
        retry: false,
        body: { name: "Retired Widget", category: null, status: 50 }
      }
    ]);
  });
  it("exposes pure named payload builders", () => {
    const createPayload = buildPartCreatePayload({
      name: "Consulting",
      partNumber: "SERVICE-1",
      stock: 0,
      unity: refs.unity(1),
      taxRate: 19,
      status: "active"
    });
    const updatePayload = buildPartUpdatePayload({ status: PartStatus.INACTIVE });
    expect(createPayload).toEqual({
      objectName: "Part",
      name: "Consulting",
      partNumber: "SERVICE-1",
      stock: 0,
      unity: { id: 1, objectName: "Unity" },
      taxRate: 19,
      status: 100
    });
    expect(updatePayload).toEqual({ status: 50 });
  });
  it("preserves an unknown future Part status as a flat discriminated value", async () => {
    const client = clientWithAdapter((config) =>
      jsonResponse(config, { objects: [{ ...part, status: 150 }] })
    );
    const result = await client.parts.get(3);
    expect(result.data).toMatchObject({
      status: "UNKNOWN",
      statusCode: 150,
      statusKnown: false
    });
    expect(result.objects?.[0]?.status).toBe(150);
  });
  it("rejects malformed inputs and response boundaries", async () => {
    expect(() =>
      buildPartCreatePayload({
        name: " ",
        partNumber: "SKU",
        stock: 1,
        unity: refs.unity(1),
        taxRate: 19
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      buildPartCreatePayload({
        name: "Widget",
        partNumber: "SKU",
        stock: Number.NaN,
        unity: refs.unity(1),
        taxRate: 19
      })
    ).toThrow(SevdeskConfigurationError);
    expect(() => buildPartUpdatePayload({} as PartUpdateInput)).toThrow(SevdeskConfigurationError);
    expect(() =>
      buildPartCreatePayload({
        name: "Widget",
        partNumber: "SKU",
        stock: 1,
        unity: refs.unity(1),
        taxRate: 19,
        stockEnabled: null
      } as unknown as Parameters<typeof buildPartCreatePayload>[0])
    ).toThrow(SevdeskConfigurationError);
    expect(() =>
      buildPartUpdatePayload({
        unity: { id: 1, objectName: "Category" }
      } as unknown as PartUpdateInput)
    ).toThrow(SevdeskConfigurationError);
    const multiple = clientWithAdapter((config) =>
      jsonResponse(config, { objects: [part, { ...part, id: 4 }] })
    );
    await expect(multiple.parts.get(3)).rejects.toBeInstanceOf(SevdeskResponseValidationError);
    const invalidStock = clientWithAdapter((config) =>
      jsonResponse(config, { objects: Number.POSITIVE_INFINITY })
    );
    await expect(invalidStock.parts.getStock(3)).rejects.toBeInstanceOf(
      SevdeskResponseValidationError
    );
    const missingCreated = clientWithAdapter((config) => jsonResponse(config, {}));
    await expect(
      missingCreated.parts.create({
        name: "Widget",
        partNumber: "SKU",
        stock: 1,
        unity: refs.unity(1),
        taxRate: 19
      })
    ).rejects.toBeInstanceOf(SevdeskResponseValidationError);
    await expect(
      missingCreated.parts.list({ countAll: "yes" } as unknown as Parameters<
        typeof missingCreated.parts.list
      >[0])
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
  });
});

function clientWithAdapter(
  handler: (config: InternalAxiosRequestConfig) => ReturnType<typeof jsonResponse>
) {
  return createSevdeskClient({
    apiToken: "test-token",
    retries: { attempts: 3, baseDelayMs: 0, maxDelayMs: 0, unsafeOperations: true },
    axiosInstance: axios.create({ adapter: adapter(handler) })
  });
}
