export interface PaginationRequest {
  readonly limit: number;
  readonly offset: number;
  readonly countAll: true;
}

export interface PaginationOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly maxPages?: number;
}

export interface PageLike<TItem = unknown> {
  readonly data: readonly TItem[] | undefined;
  readonly json: unknown;
  readonly raw: unknown;
  readonly pagination?: {
    readonly total?: number;
  };
}

export type PageItem<TPage extends PageLike> = NonNullable<TPage["data"]>[number];

export interface FetchAllResult<TPage extends PageLike> {
  readonly items: readonly PageItem<TPage>[];
  readonly pages: readonly TPage[];
  readonly json: readonly TPage["json"][];
  readonly raw: readonly TPage["raw"][];
}

export async function* paginate<TPage extends PageLike>(
  fetchPage: (request: PaginationRequest) => Promise<TPage>,
  options: PaginationOptions = {}
): AsyncGenerator<TPage, void, undefined> {
  const limit = validatePaginationLimit(options.limit ?? 100);
  let offset = validatePaginationOffset(options.offset ?? 0);
  const maxPages = validatePositiveSafeInteger(options.maxPages ?? 10_000, "maximum page count");
  for (let pageNumber = 0; pageNumber < maxPages; pageNumber += 1) {
    const page = await fetchPage({ limit, offset, countAll: true });
    if (!Array.isArray(page.data)) {
      throw new TypeError("The paginated sevdesk operation did not return an objects array.");
    }
    yield page;
    const returned = page.data.length;
    if (returned === 0) return;
    offset += returned;
    const total = page.pagination?.total;
    if (total !== undefined && offset >= total) return;
  }
  throw new RangeError(
    `Pagination exceeded ${maxPages} pages; the server may be ignoring the offset.`
  );
}

export async function fetchAll<TPage extends PageLike>(
  fetchPage: (request: PaginationRequest) => Promise<TPage>,
  options: PaginationOptions = {}
): Promise<FetchAllResult<TPage>> {
  const items: PageItem<TPage>[] = [];
  const pages: TPage[] = [];
  for await (const page of paginate(fetchPage, options)) {
    pages.push(page);
    items.push(...((page.data ?? []) as readonly PageItem<TPage>[]));
  }
  return {
    items,
    pages,
    json: pages.map((page) => page.json),
    raw: pages.map((page) => page.raw)
  };
}
import {
  validatePaginationLimit,
  validatePaginationOffset,
  validatePositiveSafeInteger
} from "./validation.js";
