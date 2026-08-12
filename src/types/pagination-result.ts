import type { PaginationMetadata, SevdeskResult } from "./result.js";

export interface PaginatedSevdeskResult<TJson, TData, TRequestBody = unknown> extends SevdeskResult<
  TJson,
  TData,
  TRequestBody
> {
  readonly pagination: PaginationMetadata;
}
