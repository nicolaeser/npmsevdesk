import { describe, expect, it } from "vitest";
import { createSevdeskClient } from "../src/client/sevdesk-client.js";
import { SevdeskConfigurationError } from "../src/utils/errors.js";
import { serializeQuery } from "../src/utils/query.js";

describe("serializeQuery", () => {
  it("preserves false, zero, bracketed objects, lists and comma-separated embeds", () => {
    const query = serializeQuery(
      {
        offset: 0,
        countAll: false,
        contact: { id: 7, objectName: "Contact" },
        tags: [
          { id: 1, objectName: "Tag" },
          { id: 2, objectName: "Tag" }
        ],
        embed: ["contact", "tags"]
      },
      [
        { name: "embed", style: "form", explode: false, array: true },
        { name: "contact", style: "deepObject", explode: true, array: false }
      ]
    );
    const parsed = new URLSearchParams(query);
    expect(parsed.get("offset")).toBe("0");
    expect(parsed.get("countAll")).toBe("false");
    expect(parsed.get("contact[id]")).toBe("7");
    expect(parsed.get("contact[objectName]")).toBe("Contact");
    expect(parsed.get("tags[0][id]")).toBe("1");
    expect(parsed.get("tags[1][objectName]")).toBe("Tag");
    expect(parsed.get("embed")).toBe("contact,tags");
  });
  it("serializes recursive sevQuery values using PHP-style brackets", () => {
    const query = serializeQuery({
      sevQuery: {
        objectName: "SevQuery",
        filter: { contact: { id: 42, objectName: "Contact" } }
      }
    });
    const parsed = new URLSearchParams(query);
    expect(parsed.get("sevQuery[filter][contact][id]")).toBe("42");
    expect(parsed.get("sevQuery[filter][contact][objectName]")).toBe("Contact");
  });
  it("uses dereferenced OpenAPI metadata for generated operation queries", () => {
    const client = createSevdeskClient({ apiToken: "test-token" });
    const prepared = client.prepare("getContacts", {
      query: {
        embed: ["addresses", "communicationWays"]
      }
    });
    expect(prepared.queryString).toBe("embed=addresses%2CcommunicationWays");
    expect(new URL(prepared.url).searchParams.get("embed")).toBe("addresses,communicationWays");
  });
  it("always comma-separates embed values used through prose-only extraQuery", () => {
    const query = serializeQuery({ embed: ["category", "parent"] });
    expect(new URLSearchParams(query).get("embed")).toBe("category,parent");
  });
  it("rejects extraQuery keys that would override typed query parameters", () => {
    const client = createSevdeskClient({ apiToken: "test-token" });
    expect(() =>
      client.prepare("getInvoices", {
        query: { limit: 10 },
        extraQuery: { limit: 20 }
      })
    ).toThrow(SevdeskConfigurationError);
  });
});
