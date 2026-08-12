import { describe, expect, it } from "vitest";
import { fetchAll, paginate } from "../src/utils/pagination.js";

describe("pagination helpers", () => {
  it("continues by returned count until total is reached", async () => {
    const requests: Array<{ limit: number; offset: number; countAll: true }> = [];
    const pages = [
      { data: [1, 2], pagination: { total: 3 }, json: { page: 1 }, raw: { page: 1 } },
      { data: [3], pagination: { total: 3 }, json: { page: 2 }, raw: { page: 2 } }
    ];
    const result = await fetchAll(
      async (request) => {
        requests.push(request);
        const page = pages.shift();
        if (!page) throw new Error("Unexpected page");
        return page;
      },
      { limit: 2 }
    );
    expect(result.items).toEqual([1, 2, 3]);
    expect(result.pages).toHaveLength(2);
    expect(requests).toEqual([
      { limit: 2, offset: 0, countAll: true },
      { limit: 2, offset: 2, countAll: true }
    ]);
  });
  it("fetches an empty terminal page when the server omits total", async () => {
    const offsets: number[] = [];
    const values = [[1], []];
    for await (const page of paginate(
      async ({ offset }) => {
        offsets.push(offset);
        return { data: values.shift() ?? [], json: {}, raw: {} };
      },
      { limit: 100 }
    )) {
      expect(page.data).toBeDefined();
    }
    expect(offsets).toEqual([0, 1]);
  });
});
