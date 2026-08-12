import axios, { type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import {
  SevdeskContactChildOwnershipError,
  SevdeskLookupAmbiguityError,
  createSevdeskClient,
  refs
} from "../src/index.js";
import { SevdeskConfigurationError, SevdeskResponseValidationError } from "../src/utils/errors.js";
import { adapter, jsonResponse, requestJson } from "./helpers.js";

describe("contact upsert", () => {
  it("strictly matches by customer number and sends only explicit merge fields", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          if (config.method === "get" && config.url === "/Contact") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "5",
                  objectName: "Contact",
                  name: "Acme GmbH",
                  customerNumber: "K-10042",
                  status: "100"
                }
              ],
              total: 1
            });
          }
          if (config.method === "put" && config.url === "/Contact/5") {
            return jsonResponse(config, {
              objects: { id: "5", objectName: "Contact", status: "1000" }
            });
          }
          if (config.method === "get" && config.url === "/Contact/5") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "5",
                  objectName: "Contact",
                  name: "Acme GmbH",
                  customerNumber: "K-10042",
                  status: "1000"
                }
              ]
            });
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const result = await client.contacts.upsert({
      match: { customerNumber: "K-10042" },
      create: {
        contact: {
          kind: "organisation",
          name: "Acme GmbH",
          category: "customer"
        }
      },
      merge: {
        kind: "organisation",
        description: "Updated explicitly",
        status: "active",
        category: "customer",
        taxType: "EU"
      }
    });
    expect(result.data.action).toBe("merged");
    expect(result.data.contact).toMatchObject({ id: "5", status: "ACTIVE", statusCode: 1000 });
    expect(result.steps.map((step) => step.operationId)).toEqual([
      "getContacts",
      "updateContact",
      "getContactById"
    ]);
    expect(requestJson(calls[1] as InternalAxiosRequestConfig)).toEqual({
      description: "Updated explicitly",
      status: 1000,
      category: { id: 3, objectName: "Category" },
      taxType: "eu"
    });
  });
  it("creates once when no exact match exists and injects the identity customer number", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          if (config.method === "get" && config.url === "/Contact") {
            return jsonResponse(config, { objects: [], total: 0 });
          }
          if (config.method === "post" && config.url === "/Contact") {
            return jsonResponse(
              config,
              {
                objects: {
                  id: "7",
                  objectName: "Contact",
                  customerNumber: "K-NEW"
                }
              },
              201
            );
          }
          if (config.method === "get" && config.url === "/Contact/7") {
            return jsonResponse(config, {
              objects: [
                {
                  id: "7",
                  objectName: "Contact",
                  name: "New GmbH",
                  customerNumber: "K-NEW",
                  status: "100"
                }
              ]
            });
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const result = await client.contacts.upsert(
      {
        match: { customerNumber: "K-NEW" },
        create: {
          contact: {
            kind: "organisation",
            name: "New GmbH",
            category: "customer"
          }
        }
      },
      { validateCustomerNumber: false }
    );
    expect(result.data.action).toBe("created");
    const createCall = calls.find((call) => call.method === "post" && call.url === "/Contact");
    expect(createCall).toBeDefined();
    expect(requestJson(createCall as InternalAxiosRequestConfig)).toMatchObject({
      customerNumber: "K-NEW"
    });
    expect(result.steps.map((step) => step.operationId)).toEqual([
      "getContacts",
      "createContact",
      "getContactById"
    ]);
  });
  it("never chooses the first duplicate and performs no write", async () => {
    let writes = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (config.method !== "get") writes += 1;
          return jsonResponse(config, {
            objects: [
              { id: "5", objectName: "Contact", customerNumber: "DUP", status: "100" },
              { id: "6", objectName: "Contact", customerNumber: "DUP", status: "100" }
            ],
            total: 2
          });
        })
      })
    });
    await expect(
      client.contacts.upsert({
        match: { customerNumber: "DUP" },
        create: {
          contact: {
            kind: "organisation",
            name: "Duplicate",
            category: "customer"
          }
        }
      })
    ).rejects.toBeInstanceOf(SevdeskLookupAmbiguityError);
    expect(writes).toBe(0);
  });
  it("rejects unsafe replace and mismatched create identity before transport", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, {});
        })
      })
    });
    const base = {
      match: { customerNumber: "K-1" },
      create: {
        contact: {
          kind: "organisation" as const,
          name: "Acme",
          category: "customer" as const,
          customerNumber: "K-2"
        }
      }
    };
    await expect(client.contacts.upsert(base)).rejects.toBeInstanceOf(SevdeskConfigurationError);
    await expect(
      client.contacts.upsert(
        { ...base, create: { contact: { ...base.create.contact, customerNumber: "K-1" } } },
        { mode: "replace" } as never
      )
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
  });
  it("rejects forbidden wire fields and blank organisation names before lookup", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, {});
        })
      })
    });
    const base = {
      match: { customerNumber: "K-1" },
      create: {
        contact: { kind: "organisation" as const, name: "Acme", category: "customer" as const }
      }
    };
    for (const merge of [
      { description: "unsafe", customerNumber: "K-2" },
      { kind: "person", firstName: "Alice", surename: "smuggled" },
      { kind: "organisation", name: "Acme", parent: refs.contact(9) },
      { description: "unsafe", contact: refs.contact(9) }
    ]) {
      await expect(client.contacts.upsert({ ...base, merge } as never)).rejects.toBeInstanceOf(
        SevdeskConfigurationError
      );
    }
    await expect(
      client.contacts.upsert({
        ...base,
        merge: { kind: "organisation", name: "   " }
      } as never)
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
  });
});

describe("explicit contact child mutations", () => {
  it("checks address ownership and refuses an update belonging to another contact", async () => {
    let writes = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (config.method !== "get") writes += 1;
          return jsonResponse(config, {
            objects: [
              {
                id: 11,
                objectName: "ContactAddress",
                contact: { id: "99", objectName: "Contact" }
              }
            ]
          });
        })
      })
    });
    await expect(
      client.contacts.addresses.update(5, 11, { city: "Berlin" })
    ).rejects.toBeInstanceOf(SevdeskContactChildOwnershipError);
    expect(writes).toBe(0);
  });
  it("rejects excess child update fields before transport", async () => {
    let calls = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls += 1;
          return jsonResponse(config, {});
        })
      })
    });
    await expect(
      client.contacts.addresses.update(5, 11, {
        city: "Berlin",
        contact: refs.contact(99)
      } as never)
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    await expect(
      client.contacts.communicationWays.update(5, 21, {
        value: "safe@example.test",
        contact: refs.contact(99)
      } as never)
    ).rejects.toBeInstanceOf(SevdeskConfigurationError);
    expect(calls).toBe(0);
  });
  it("verifies child id and objectName before an update write", async () => {
    let responseVariant: "wrong-id" | "wrong-object" = "wrong-id";
    let writes = 0;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          if (config.method !== "get") writes += 1;
          return jsonResponse(config, {
            objects: [
              {
                id: responseVariant === "wrong-id" ? "12" : "11",
                objectName:
                  responseVariant === "wrong-object" ? "CommunicationWay" : "ContactAddress",
                contact: { id: 5, objectName: "Contact" }
              }
            ]
          });
        })
      })
    });
    await expect(
      client.contacts.addresses.update(5, 11, { city: "Berlin" })
    ).rejects.toBeInstanceOf(SevdeskResponseValidationError);
    responseVariant = "wrong-object";
    await expect(
      client.contacts.addresses.update("5", "11", { city: "Berlin" })
    ).rejects.toBeInstanceOf(SevdeskResponseValidationError);
    expect(writes).toBe(0);
  });
  it("requires confirmation, verifies ownership, and returns a delete receipt", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          if (config.method === "get") {
            return jsonResponse(config, {
              objects: [
                {
                  id: 11,
                  objectName: "ContactAddress",
                  contact: { id: "5", objectName: "Contact" }
                }
              ]
            });
          }
          return jsonResponse(config, { objects: [] });
        })
      })
    });
    await expect(client.contacts.addresses.remove(5, 11, {} as never)).rejects.toBeInstanceOf(
      SevdeskConfigurationError
    );
    expect(calls).toHaveLength(0);
    const result = await client.contacts.addresses.remove(5, 11, { confirm: true });
    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "get /ContactAddress/11",
      "delete /ContactAddress/11"
    ]);
    expect(result.data.receipt).toMatchObject({
      performed: true,
      operationId: "deleteContactAddress",
      status: 200
    });
  });
  it("supports explicit custom-field creation without permitting implicit replacement", async () => {
    let body: unknown;
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          body = requestJson(config);
          return jsonResponse(config, {
            objects: {
              id: "31",
              objectName: "ContactCustomField",
              contact: { id: "5", objectName: "Contact" },
              value: "external-42"
            }
          });
        })
      })
    });
    const result = await client.contacts.customFields.create(5, {
      setting: refs.contactCustomFieldSetting(9),
      value: "external-42"
    });
    expect(body).toEqual({
      contact: { id: 5, objectName: "Contact" },
      contactCustomFieldSetting: { id: 9, objectName: "ContactCustomFieldSetting" },
      value: "external-42",
      objectName: "ContactCustomField"
    });
    expect(result.data.id).toBe("31");
  });
  it("resolves semantic communication-way keys and retains every executed step", async () => {
    const calls: InternalAxiosRequestConfig[] = [];
    const client = createSevdeskClient({
      apiToken: "test-token",
      axiosInstance: axios.create({
        adapter: adapter((config) => {
          calls.push(config);
          if (config.method === "get" && config.url === "/CommunicationWayKey") {
            return jsonResponse(config, {
              objects: [{ id: "2", objectName: "CommunicationWayKey", name: "Arbeit" }]
            });
          }
          if (config.method === "post" && config.url === "/CommunicationWay") {
            return jsonResponse(
              config,
              {
                objects: {
                  id: "21",
                  objectName: "CommunicationWay",
                  contact: { id: "5", objectName: "Contact" },
                  type: "EMAIL",
                  value: "billing@example.test",
                  key: { id: "2", objectName: "CommunicationWayKey" }
                }
              },
              201
            );
          }
          throw new Error(`Unexpected request ${config.method} ${config.url}`);
        })
      })
    });
    const result = await client.contacts.communicationWays.create(5, {
      type: "email",
      key: "work",
      value: "billing@example.test"
    });
    expect(result.steps.map((step) => step.operationId)).toEqual([
      "getCommunicationWayKeys",
      "createCommunicationWay"
    ]);
    expect(requestJson(calls[1] as InternalAxiosRequestConfig)).toEqual({
      contact: { id: 5, objectName: "Contact" },
      type: "EMAIL",
      value: "billing@example.test",
      key: { id: 2, objectName: "CommunicationWayKey" },
      objectName: "CommunicationWay"
    });
  });
});
