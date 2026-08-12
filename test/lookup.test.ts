import axios, { type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import {
  createSevdeskClient,
  SevdeskConfigurationError,
  SevdeskLookupAmbiguityError,
  SevdeskLookupNotFoundError,
  SevdeskResponseValidationError,
  taxes
} from "../src/index.js";
import { adapter, jsonResponse } from "./helpers.js";

describe("exact lookup resolvers", () => {
  it("post-filters contacts exactly and preserves page evidence", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          return jsonResponse(config, {
            objects: [
              {
                id: "1",
                objectName: "Contact",
                customerNumber: "K-10042-copy",
                status: "1000"
              },
              {
                id: "2",
                objectName: "Contact",
                customerNumber: "K-10042",
                status: "1000"
              }
            ],
            total: 2
          });
        })
      })
    });
    const result = await client.lookup.contact({ customerNumber: "K-10042" });
    expect(result.data.id).toBe("2");
    expect(result.criteria).toEqual({ customerNumber: "K-10042" });
    expect(result.pages).toHaveLength(1);
    expect(result.json).toHaveLength(1);
    expect(result.raw).toHaveLength(1);
    expect(result.toJSON()).toBe(result.json);
    expect(calls[0]?.params).toMatchObject({
      customerNumber: "K-10042",
      depth: "1",
      limit: 100,
      offset: 0,
      countAll: true
    });
  });
  it("matches an exact tenant customer number without assuming a prefix", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          return jsonResponse(config, {
            objects: [
              {
                id: "9",
                objectName: "Contact",
                customerNumber: "CUST-42",
                status: "1000"
              }
            ],
            total: 1
          });
        })
      })
    });
    const result = await client.lookup.contact({ customerNumber: "CUST-42" });
    expect(result.data.id).toBe("9");
    expect(result.data.customerNumber).toBe("CUST-42");
    expect(calls[0]?.params).toMatchObject({ customerNumber: "CUST-42" });
  });
  it("has explicit strict and optional not-found APIs", async () => {
    let requests = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          requests += 1;
          return jsonResponse(config, { objects: [], total: 0 });
        })
      })
    });
    await expect(client.lookup.contact({ customerNumber: "missing" })).rejects.toMatchObject({
      name: "SevdeskLookupNotFoundError",
      resource: "Contact",
      criteria: { customerNumber: "missing" }
    });
    await expect(client.lookup.findContact({ customerNumber: "missing" })).resolves.toBeUndefined();
    expect(requests).toBe(2);
  });
  it("throws an ambiguity error instead of selecting the first exact match", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) =>
          jsonResponse(config, {
            objects: [
              {
                id: "1",
                objectName: "Contact",
                customerNumber: "duplicate",
                status: "1000"
              },
              {
                id: "2",
                objectName: "Contact",
                customerNumber: "duplicate",
                status: "1000"
              }
            ],
            total: 2
          })
        )
      })
    });
    const error = await client.lookup
      .findContact({ customerNumber: "duplicate" })
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(SevdeskLookupAmbiguityError);
    expect(error).toMatchObject({ resource: "Contact", matchCount: 2 });
    expect((error as SevdeskLookupAmbiguityError).toJSON()).not.toHaveProperty("criteria");
    expect(
      (error as SevdeskLookupAmbiguityError).toDiagnostic({ includeData: true })
    ).toHaveProperty("criteria.customerNumber", "duplicate");
  });
  it("scans all check-account pages and compares a normalized IBAN", async () => {
    const offsets: number[] = [];
    const controller = new AbortController();
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          offsets.push(Number(config.params?.offset));
          expect(config.signal).toBe(controller.signal);
          if (Number(config.params?.offset) === 0) {
            return jsonResponse(config, {
              objects: [{ id: "1", objectName: "CheckAccount", name: "Cash", iban: "   " }],
              total: 2
            });
          }
          return jsonResponse(config, {
            objects: [
              {
                id: "2",
                objectName: "CheckAccount",
                name: "Bank",
                iban: "de02 1005 0000 0054 5404 02"
              }
            ],
            total: 2
          });
        })
      })
    });
    const result = await client.lookup.checkAccount(
      { iban: "DE02100500000054540402" },
      { signal: controller.signal, retry: false }
    );
    expect(result.data).toMatchObject({ id: "2", objectName: "CheckAccount", name: "Bank" });
    expect(result.criteria).toEqual({ iban: "DE02100500000054540402" });
    expect(result.pages).toHaveLength(2);
    expect(offsets).toEqual([0, 1]);
  });
  it("post-filters part names exactly and validates the matched identity", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) =>
          jsonResponse(config, {
            objects: [
              { id: 1, objectName: "Part", name: "Support Plus", partNumber: "S-2" },
              { id: 2, objectName: "Part", name: "Support", partNumber: "S-1" }
            ],
            total: 2
          })
        )
      })
    });
    const result = await client.lookup.part({ name: "Support" });
    expect(result.data).toMatchObject({ id: 2, objectName: "Part", partNumber: "S-1" });
    const malformedClient = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) =>
          jsonResponse(config, {
            objects: [{ name: "Support", partNumber: "S-1" }],
            total: 1
          })
        )
      })
    });
    await expect(malformedClient.lookup.part({ partNumber: "S-1" })).rejects.toBeInstanceOf(
      SevdeskResponseValidationError
    );
  });
  it("resolves an OSS-ready StaticCountry without requiring its numeric ID", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) =>
          jsonResponse(config, {
            objects: [
              { id: "33", objectName: "StaticCountry", code: "fr", name: "France" },
              { id: "1", objectName: "StaticCountry", code: "DE", name: "Germany" }
            ],
            total: 2
          })
        )
      })
    });
    const country = await client.lookup.country({ code: "fr" });
    const selection = taxes.revenue.ossElectronicService({
      destinationCountry: country.data,
      rate: 20
    });
    expect(country.data).toMatchObject({
      id: "33",
      objectName: "StaticCountry",
      code: "FR",
      name: "France"
    });
    expect(country.criteria).toEqual({ code: "FR" });
    expect(selection).toMatchObject({
      destinationCountry: "FR",
      deliveryAddressCountry: { id: 33, objectName: "StaticCountry" }
    });
  });
  it("rejects empty criteria before making an HTTP request", async () => {
    let requests = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          requests += 1;
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    await expect(client.lookup.checkAccount({ iban: "  " })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    await expect(client.lookup.findPart({ name: "" })).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    await expect(
      client.lookup.checkAccount({ iban: "DE02100500000054540402", name: "Bank" } as never)
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    await expect(client.lookup.checkAccount({} as never)).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    await expect(
      client.lookup.part({ partNumber: "SKU-123", name: "Support" } as never)
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    await expect(client.lookup.part({} as never)).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(requests).toBe(0);
  });
  it("requires and canonicalizes a positive numeric check-account identity", async () => {
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) =>
          jsonResponse(config, {
            objects: [{ id: "0002", objectName: "CheckAccount", name: "Bank" }],
            total: 1
          })
        )
      })
    });
    const normalized = await client.lookup.checkAccount({ name: "Bank" });
    expect(normalized).toMatchObject({
      data: { id: "2", objectName: "CheckAccount" }
    });
    expect(normalized.pages[0]?.objects[0]?.id).toBe("0002");
    expect(normalized.json[0]?.objects[0]?.id).toBe("0002");
    const malformedClient = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) =>
          jsonResponse(config, {
            objects: [{ id: "not-an-id", objectName: "CheckAccount", name: "Bank" }],
            total: 1
          })
        )
      })
    });
    await expect(malformedClient.lookup.checkAccount({ name: "Bank" })).rejects.toBeInstanceOf(
      SevdeskResponseValidationError
    );
  });
  it("exposes the strict not-found error as a public class", () => {
    const error = new SevdeskLookupNotFoundError("Part", { partNumber: "missing" });
    expect(error.toJSON()).toEqual({
      name: "SevdeskLookupNotFoundError",
      message: "No Part matched the exact lookup criterion.",
      resource: "Part",
      pageCount: 0
    });
  });
});
